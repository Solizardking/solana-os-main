// Package upstash provides an Upstash Redis REST API client and
// Upstash Box container management for the SolanaOS runtime.
//
// Upstash Redis is used as a serverless memory backend (epistemological vault)
// with low-latency REST API access. Upstash Box provides ephemeral cloud
// containers for offloading agent workloads.
//
// API docs: https://docs.upstash.com/redis/rest
package upstash

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// ── Defaults ──────────────────────────────────────────────────────────

const (
	DefaultRedisURL    = ""
	DefaultBoxEndpoint = "https://api.upstash.com"
	DefaultBoxRegion   = "us-east-1"
	DefaultHTTPTimeout = 30 * time.Second
)

// ── Config ────────────────────────────────────────────────────────────

// Config holds the Upstash connection configuration.
type Config struct {
	// RedisURL is the Upstash Redis REST API URL
	// (e.g. https://us1-xxxxx.upstash.io)
	RedisURL string `json:"redis_url"`

	// RedisToken is the Upstash Redis REST API token
	RedisToken string `json:"redis_token"`

	// BoxEndpoint is the Upstash Box API endpoint
	BoxEndpoint string `json:"box_endpoint"`

	// BoxToken is the Upstash Box API token
	BoxToken string `json:"box_token"`

	// BoxRegion is the deployment region for Upstash Box
	BoxRegion string `json:"box_region"`

	// Timeout for HTTP requests
	Timeout time.Duration `json:"-"`
}

// ── Redis REST Response ───────────────────────────────────────────────

// RedisResponse wraps an Upstash Redis REST API response.
type RedisResponse struct {
	Result any    `json:"result"`
	Error  string `json:"error,omitempty"`
}

// ── Client ────────────────────────────────────────────────────────────

// Client is an Upstash Redis REST API and Box management client.
type Client struct {
	cfg     *Config
	http    *http.Client
}

// NewClient creates a new Upstash client from the provided config.
func NewClient(cfg *Config) *Client {
	if cfg == nil {
		cfg = &Config{}
	}
	timeout := cfg.Timeout
	if timeout <= 0 {
		timeout = DefaultHTTPTimeout
	}
	return &Client{
		cfg:  cfg,
		http: &http.Client{Timeout: timeout},
	}
}

// ── Redis REST API ────────────────────────────────────────────────────
// The Upstash Redis REST API uses HTTP Basic Auth with the token as password
// and accepts raw Redis commands via POST to the database URL.

// Do sends a raw Redis command via the Upstash REST API.
//   command: Redis command string, e.g. "SET key value" or "GET key"
// Returns the parsed response result.
func (c *Client) Do(ctx context.Context, command string) (any, error) {
	if c.cfg.RedisURL == "" {
		return nil, fmt.Errorf("upstash: redis url not configured")
	}
	if c.cfg.RedisToken == "" {
		return nil, fmt.Errorf("upstash: redis token not configured")
	}

	body := strings.TrimSpace(command)
	req, err := http.NewRequestWithContext(ctx, "POST", c.cfg.RedisURL, bytes.NewBufferString(body))
	if err != nil {
		return nil, fmt.Errorf("upstash: create request: %w", err)
	}
	req.SetBasicAuth("default", c.cfg.RedisToken)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := c.http.Do(req)
	if err != nil {
		return nil, fmt.Errorf("upstash: request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("upstash: read response: %w", err)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("upstash: api error %d: %s", resp.StatusCode, string(respBody))
	}

	// Try to parse as JSON response
	var redisResp RedisResponse
	if err := json.Unmarshal(respBody, &redisResp); err == nil {
		if redisResp.Error != "" {
			return nil, fmt.Errorf("upstash: redis error: %s", redisResp.Error)
		}
		return redisResp.Result, nil
	}

	// Fallback: return raw string
	return strings.TrimSpace(string(respBody)), nil
}

// ── Redis Convenience Commands ─────────────────────────────────────────

// Set stores a key-value pair. If ttl > 0, it sets TTL in seconds.
func (c *Client) Set(ctx context.Context, key, value string, ttl int) error {
	if ttl > 0 {
		_, err := c.Do(ctx, fmt.Sprintf("SET %s %s EX %d", quoteArg(key), quoteArg(value), ttl))
		return err
	}
	_, err := c.Do(ctx, fmt.Sprintf("SET %s %s", quoteArg(key), quoteArg(value)))
	return err
}

// Get retrieves a value by key.
func (c *Client) Get(ctx context.Context, key string) (string, error) {
	result, err := c.Do(ctx, fmt.Sprintf("GET %s", quoteArg(key)))
	if err != nil {
		return "", err
	}
	if result == nil {
		return "", nil
	}
	return fmt.Sprintf("%v", result), nil
}

// Del deletes one or more keys.
func (c *Client) Del(ctx context.Context, keys ...string) error {
	args := make([]string, len(keys))
	for i, k := range keys {
		args[i] = quoteArg(k)
	}
	_, err := c.Do(ctx, fmt.Sprintf("DEL %s", strings.Join(args, " ")))
	return err
}

// Exists checks if a key exists. Returns 1 if exists, 0 otherwise.
func (c *Client) Exists(ctx context.Context, key string) (int, error) {
	result, err := c.Do(ctx, fmt.Sprintf("EXISTS %s", quoteArg(key)))
	if err != nil {
		return 0, err
	}
	n, _ := toInt(result)
	return n, nil
}

// Expire sets a TTL on a key in seconds.
func (c *Client) Expire(ctx context.Context, key string, ttl int) error {
	_, err := c.Do(ctx, fmt.Sprintf("EXPIRE %s %d", quoteArg(key), ttl))
	return err
}

// TTL returns the remaining TTL of a key (-1 if no TTL, -2 if key does not exist).
func (c *Client) TTL(ctx context.Context, key string) (int, error) {
	result, err := c.Do(ctx, fmt.Sprintf("TTL %s", quoteArg(key)))
	if err != nil {
		return 0, err
	}
	return toInt(result)
}

// Keys finds all keys matching a pattern. Use with caution on production.
func (c *Client) Keys(ctx context.Context, pattern string) ([]string, error) {
	result, err := c.Do(ctx, fmt.Sprintf("KEYS %s", quoteArg(pattern)))
	if err != nil {
		return nil, err
	}
	return toStringSlice(result)
}

// ── Redis List Operations ─────────────────────────────────────────────

// LPush prepends a value to a list.
func (c *Client) LPush(ctx context.Context, key, value string) error {
	_, err := c.Do(ctx, fmt.Sprintf("LPUSH %s %s", quoteArg(key), quoteArg(value)))
	return err
}

// RPush appends a value to a list.
func (c *Client) RPush(ctx context.Context, key, value string) error {
	_, err := c.Do(ctx, fmt.Sprintf("RPUSH %s %s", quoteArg(key), quoteArg(value)))
	return err
}

// LRange returns a range of elements from a list (0-based, inclusive).
// start: 0-based start index, stop: 0-based stop index (use -1 for all).
func (c *Client) LRange(ctx context.Context, key string, start, stop int) ([]string, error) {
	result, err := c.Do(ctx, fmt.Sprintf("LRANGE %s %d %d", quoteArg(key), start, stop))
	if err != nil {
		return nil, err
	}
	return toStringSlice(result)
}

// LLen returns the length of a list.
func (c *Client) LLen(ctx context.Context, key string) (int, error) {
	result, err := c.Do(ctx, fmt.Sprintf("LLEN %s", quoteArg(key)))
	if err != nil {
		return 0, err
	}
	return toInt(result)
}

// ── Redis Sorted Set Operations ───────────────────────────────────────

// ZAdd adds a member with score to a sorted set.
func (c *Client) ZAdd(ctx context.Context, key, member string, score float64) error {
	_, err := c.Do(ctx, fmt.Sprintf("ZADD %s %f %s", quoteArg(key), score, quoteArg(member)))
	return err
}

// ZRangeByScore returns members with scores in the given range.
func (c *Client) ZRangeByScore(ctx context.Context, key, min, max string) ([]string, error) {
	result, err := c.Do(ctx, fmt.Sprintf("ZRANGEBYSCORE %s %s %s", quoteArg(key), quoteArg(min), quoteArg(max)))
	if err != nil {
		return nil, err
	}
	return toStringSlice(result)
}

// ZRemRangeByScore removes members with scores in the given range.
func (c *Client) ZRemRangeByScore(ctx context.Context, key, min, max string) error {
	_, err := c.Do(ctx, fmt.Sprintf("ZREMRANGEBYSCORE %s %s %s", quoteArg(key), quoteArg(min), quoteArg(max)))
	return err
}

// ── Redis Hash Operations ─────────────────────────────────────────────

// HSet sets fields in a hash.
func (c *Client) HSet(ctx context.Context, key, field, value string) error {
	_, err := c.Do(ctx, fmt.Sprintf("HSET %s %s %s", quoteArg(key), quoteArg(field), quoteArg(value)))
	return err
}

// HGet gets a field value from a hash.
func (c *Client) HGet(ctx context.Context, key, field string) (string, error) {
	result, err := c.Do(ctx, fmt.Sprintf("HGET %s %s", quoteArg(key), quoteArg(field)))
	if err != nil {
		return "", err
	}
	if result == nil {
		return "", nil
	}
	return fmt.Sprintf("%v", result), nil
}

// HGetAll returns all fields and values of a hash.
func (c *Client) HGetAll(ctx context.Context, key string) (map[string]string, error) {
	result, err := c.Do(ctx, fmt.Sprintf("HGETALL %s", quoteArg(key)))
	if err != nil {
		return nil, err
	}
	// HGETALL returns a flat array of [field1, val1, field2, val2, ...]
	slice, err := toStringSlice(result)
	if err != nil {
		return nil, err
	}
	m := make(map[string]string, len(slice)/2)
	for i := 0; i+1 < len(slice); i += 2 {
		m[slice[i]] = slice[i+1]
	}
	return m, nil
}

// HDel deletes fields from a hash.
func (c *Client) HDel(ctx context.Context, key string, fields ...string) error {
	args := []string{"HDEL", quoteArg(key)}
	for _, f := range fields {
		args = append(args, quoteArg(f))
	}
	_, err := c.Do(ctx, strings.Join(args, " "))
	return err
}

// ── JSON Operations (using RedisJSON-like patterns) ──────────────────

// JSONSet stores a JSON-serializable value under a key.
func (c *Client) JSONSet(ctx context.Context, key string, value any) error {
	data, err := json.Marshal(value)
	if err != nil {
		return fmt.Errorf("upstash: marshal json: %w", err)
	}
	_, err = c.Do(ctx, fmt.Sprintf("SET %s %s", quoteArg(key), quoteArg(string(data))))
	return err
}

// JSONGet retrieves and deserializes a JSON value from a key.
func (c *Client) JSONGet(ctx context.Context, key string, dest any) error {
	result, err := c.Do(ctx, fmt.Sprintf("GET %s", quoteArg(key)))
	if err != nil {
		return err
	}
	if result == nil {
		return nil
	}
	data, ok := result.(string)
	if !ok {
		return fmt.Errorf("upstash: unexpected result type %T", result)
	}
	return json.Unmarshal([]byte(data), dest)
}

// ── Ping ──────────────────────────────────────────────────────────────

// Ping checks connectivity to Upstash Redis.
func (c *Client) Ping(ctx context.Context) error {
	result, err := c.Do(ctx, "PING")
	if err != nil {
		return err
	}
	s, _ := result.(string)
	if s != "PONG" {
		return fmt.Errorf("upstash: unexpected ping response: %v", result)
	}
	return nil
}

// ── Info ──────────────────────────────────────────────────────────────

// Info returns the Redis INFO command output.
func (c *Client) Info(ctx context.Context) (string, error) {
	result, err := c.Do(ctx, "INFO")
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%v", result), nil
}

// ── Memory Stats ──────────────────────────────────────────────────────

// DBSize returns the number of keys in the database.
func (c *Client) DBSize(ctx context.Context) (int, error) {
	result, err := c.Do(ctx, "DBSIZE")
	if err != nil {
		return 0, err
	}
	return toInt(result)
}

// ── Helpers ───────────────────────────────────────────────────────────

// quoteArg quotes a Redis argument to handle spaces and special characters.
// Upstash REST API expects URL-encoded arguments.
func quoteArg(s string) string {
	// For the Upstash REST API, we need to quote the value
	// The REST API accepts raw Redis commands in the body
	return "'" + strings.ReplaceAll(s, "'", "\\'") + "'"
}

func toInt(v any) (int, error) {
	switch n := v.(type) {
	case float64:
		return int(n), nil
	case int:
		return n, nil
	case int64:
		return int(n), nil
	case string:
		var i int
		if _, err := fmt.Sscanf(n, "%d", &i); err == nil {
			return i, nil
		}
		return 0, fmt.Errorf("upstash: cannot parse int: %s", n)
	default:
		return 0, fmt.Errorf("upstash: unexpected type %T", v)
	}
}

func toStringSlice(v any) ([]string, error) {
	switch s := v.(type) {
	case []any:
		result := make([]string, len(s))
		for i, item := range s {
			result[i] = fmt.Sprintf("%v", item)
		}
		return result, nil
	case []string:
		return s, nil
	case nil:
		return nil, nil
	default:
		// Single value
		return []string{fmt.Sprintf("%v", v)}, nil
	}
}

// urlEncodeParams encodes a map as URL query parameters.
func urlEncodeParams(params map[string]string) string {
	vals := url.Values{}
	for k, v := range params {
		vals.Set(k, v)
	}
	return vals.Encode()
}

// ── Box Types ─────────────────────────────────────────────────────────
// (Defined here for shared use with box.go)

// BoxConfig describes an Upstash Box deployment configuration.
type BoxConfig struct {
	Name       string            `json:"name"`
	Image      string            `json:"image"`
	Region     string            `json:"region,omitempty"`
	CPU        int               `json:"cpu,omitempty"`   // in cores (2, 4, 8)
	Memory     int               `json:"memory,omitempty"` // in GB (4, 8, 16)
	Env        map[string]string `json:"env,omitempty"`
	Replicas   int               `json:"replicas,omitempty"`
	TimeoutSec int               `json:"timeout_seconds,omitempty"`
}

// BoxStatus represents the current state of a Box deployment.
type BoxStatus struct {
	Name      string `json:"name"`
	State     string `json:"state"` // "running", "deploying", "stopped", "error"
	Endpoint  string `json:"endpoint,omitempty"`
	Region    string `json:"region"`
	CreatedAt string `json:"created_at"`
}
