// Package upstash — redis.go
// Redis memory store operations for the Upstash-backed epistemological vault.
//
// Uses Upstash Redis key schemas designed for the Vault interface:
//   - session:{channelType}:{channelID}  →  Hash (session metadata)
//   - msgs:{sessionID}                    →  List (ordered message history)
//   - msgs:{sessionID}:user               →  List (user messages)
//   - msgs:{sessionID}:agent              →  List (agent messages)
//   - trades:{sessionID}                  →  List (trading events)
//   - peer:{peerID}:profile               →  String (JSON operator profile)
//   - peer:{peerID}:card                  →  Sorted Set (peer card facts by score)
//   - context:{sessionID}                 →  String (formatted context)
package upstash

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"
)

// ── Key Builders ──────────────────────────────────────────────────────

func sessionKey(channelType, channelID string) string {
	return fmt.Sprintf("session:%s:%s", channelType, channelID)
}

func messagesKey(sessionID string) string {
	return fmt.Sprintf("msgs:%s", sessionID)
}

func userMessagesKey(sessionID string) string {
	return fmt.Sprintf("msgs:%s:user", sessionID)
}

func agentMessagesKey(sessionID string) string {
	return fmt.Sprintf("msgs:%s:agent", sessionID)
}

func tradesKey(sessionID string) string {
	return fmt.Sprintf("trades:%s", sessionID)
}

func peerProfileKey(peerID string) string {
	return fmt.Sprintf("peer:%s:profile", peerID)
}

func peerCardKey(peerID string) string {
	return fmt.Sprintf("peer:%s:card", peerID)
}

func contextKey(sessionID string) string {
	return fmt.Sprintf("context:%s", sessionID)
}

func ephemeralKey(prefix, id string) string {
	return fmt.Sprintf("ephemeral:%s:%s", prefix, id)
}

// ── Session Record ────────────────────────────────────────────────────

// SessionRecord is the JSON structure stored in Upstash Redis for a session.
type SessionRecord struct {
	SessionID   string    `json:"session_id"`
	ChannelType string    `json:"channel_type"`
	ChannelID   string    `json:"channel_id"`
	PeerID      string    `json:"peer_id"`
	CreatedAt   string    `json:"created_at"`
	UpdatedAt   string    `json:"updated_at"`
}

// MessageRecord is a message stored in Upstash Redis.
type MessageRecord struct {
	PeerID    string         `json:"peer_id"`
	Content   string         `json:"content"`
	Metadata  map[string]any `json:"metadata,omitempty"`
	CreatedAt string         `json:"created_at"`
}

// ── RedisStore ────────────────────────────────────────────────────────

// RedisStore wraps the Upstash client with higher-level memory operations.
type RedisStore struct {
	client *Client
}

// NewRedisStore creates a new RedisStore backed by the Upstash client.
func NewRedisStore(client *Client) *RedisStore {
	return &RedisStore{client: client}
}

// Client returns the underlying Upstash client.
func (s *RedisStore) Client() *Client {
	return s.client
}

// EnsureSession creates or retrieves a session record in Redis.
// Returns the session ID.
func (s *RedisStore) EnsureSession(ctx context.Context, channelType, channelID, peerID string) (string, error) {
	key := sessionKey(channelType, channelID)
	now := time.Now().UTC().Format(time.RFC3339)

	// Check if session exists via TTL (won't exist with no TTL, but this pattern works)
	exists, err := s.client.Exists(ctx, key)
	if err != nil {
		return "", fmt.Errorf("upstash: check session: %w", err)
	}

	if exists > 0 {
		// Session exists — get session ID
		sessionID, err := s.client.HGet(ctx, key, "session_id")
		if err != nil {
			return "", fmt.Errorf("upstash: get session id: %w", err)
		}
		if sessionID != "" {
			// Update timestamp
			_ = s.client.HSet(ctx, key, "updated_at", now)
			return sessionID, nil
		}
	}

	// Create new session
	sessionID := fmt.Sprintf("%s-%s-%d", channelType, channelID, time.Now().UnixMilli())

	rec := SessionRecord{
		SessionID:   sessionID,
		ChannelType: channelType,
		ChannelID:   channelID,
		PeerID:      peerID,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	data, err := json.Marshal(rec)
	if err != nil {
		return "", fmt.Errorf("upstash: marshal session: %w", err)
	}

	// Store as hash fields for easy partial updates
	_ = s.client.HSet(ctx, key, "session_id", sessionID)
	_ = s.client.HSet(ctx, key, "channel_type", channelType)
	_ = s.client.HSet(ctx, key, "channel_id", channelID)
	_ = s.client.HSet(ctx, key, "peer_id", peerID)
	_ = s.client.HSet(ctx, key, "created_at", now)
	_ = s.client.HSet(ctx, key, "updated_at", now)
	_ = s.client.HSet(ctx, key, "data", string(data))

	return sessionID, nil
}

// GetSessionID retrieves the session ID for a given channel and user.
func (s *RedisStore) GetSessionID(ctx context.Context, channelType, channelID string) (string, error) {
	key := sessionKey(channelType, channelID)
	return s.client.HGet(ctx, key, "session_id")
}

// StoreMessage appends a message to the message list. If userMsg is true,
// it also appends to the user-specific list, otherwise to agent-specific list.
func (s *RedisStore) StoreMessage(ctx context.Context, sessionID, peerID, content string, metadata map[string]any, userMsg bool) error {
	content = strings.TrimSpace(content)
	if content == "" {
		return nil
	}

	msg := MessageRecord{
		PeerID:    peerID,
		Content:   content,
		Metadata:  metadata,
		CreatedAt: time.Now().UTC().Format(time.RFC3339),
	}

	data, err := json.Marshal(msg)
	if err != nil {
		return fmt.Errorf("upstash: marshal message: %w", err)
	}

	msgStr := string(data)

	// Store in general messages list
	if err := s.client.RPush(ctx, messagesKey(sessionID), msgStr); err != nil {
		return fmt.Errorf("upstash: store message: %w", err)
	}

	// Store in role-specific list
	if userMsg {
		if err := s.client.RPush(ctx, userMessagesKey(sessionID), msgStr); err != nil {
			return fmt.Errorf("upstash: store user message: %w", err)
		}
	} else {
		if err := s.client.RPush(ctx, agentMessagesKey(sessionID), msgStr); err != nil {
			return fmt.Errorf("upstash: store agent message: %w", err)
		}
	}

	return nil
}

// GetRecentMessages returns the N most recent messages from a session.
func (s *RedisStore) GetRecentMessages(ctx context.Context, sessionID string, limit int) ([]MessageRecord, error) {
	if limit <= 0 {
		limit = 20
	}

	raw, err := s.client.LRange(ctx, messagesKey(sessionID), -limit, -1)
	if err != nil {
		return nil, fmt.Errorf("upstash: get messages: %w", err)
	}

	return parseMessageRecords(raw)
}

// GetUserMessages returns user messages from a session.
func (s *RedisStore) GetUserMessages(ctx context.Context, sessionID string, limit int) ([]MessageRecord, error) {
	if limit <= 0 {
		limit = 20
	}
	raw, err := s.client.LRange(ctx, userMessagesKey(sessionID), -limit, -1)
	if err != nil {
		return nil, fmt.Errorf("upstash: get user messages: %w", err)
	}
	return parseMessageRecords(raw)
}

// GetAgentMessages returns agent messages from a session.
func (s *RedisStore) GetAgentMessages(ctx context.Context, sessionID string, limit int) ([]MessageRecord, error) {
	if limit <= 0 {
		limit = 20
	}
	raw, err := s.client.LRange(ctx, agentMessagesKey(sessionID), -limit, -1)
	if err != nil {
		return nil, fmt.Errorf("upstash: get agent messages: %w", err)
	}
	return parseMessageRecords(raw)
}

// StoreTradingEvent persists a trading event to the trades list.
func (s *RedisStore) StoreTradingEvent(ctx context.Context, sessionID, content string, metadata map[string]any) error {
	content = strings.TrimSpace(content)
	if content == "" {
		return nil
	}

	event := map[string]any{
		"content":   content,
		"metadata":  metadata,
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	}

	data, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("upstash: marshal trade event: %w", err)
	}

	return s.client.RPush(ctx, tradesKey(sessionID), string(data))
}

// GetRecentTrades returns recent trading events.
func (s *RedisStore) GetRecentTrades(ctx context.Context, sessionID string, limit int) ([]map[string]any, error) {
	if limit <= 0 {
		limit = 10
	}

	raw, err := s.client.LRange(ctx, tradesKey(sessionID), -limit, -1)
	if err != nil {
		return nil, fmt.Errorf("upstash: get trades: %w", err)
	}

	events := make([]map[string]any, 0, len(raw))
	for _, r := range raw {
		var evt map[string]any
		if err := json.Unmarshal([]byte(r), &evt); err == nil {
			events = append(events, evt)
		}
	}
	return events, nil
}

// ── Query / Search (Recall) ──────────────────────────────────────────

// Recall searches messages by content (case-insensitive substring match).
// This is a simple scan-based approach since Upstash Redis doesn't have
// built-in full-text search on the REST tier. For production, consider
// using Redis Stack with FT.SEARCH or an external search index.
func (s *RedisStore) Recall(ctx context.Context, sessionID, query string, limit int) (string, error) {
	if limit <= 0 {
		limit = 10
	}

	query = strings.ToLower(strings.TrimSpace(query))
	if query == "" {
		return "", nil
	}

	messages, err := s.GetRecentMessages(ctx, sessionID, 100)
	if err != nil {
		return "", err
	}

	var results []string
	seen := make(map[string]bool)
	for _, msg := range messages {
		if len(results) >= limit {
			break
		}
		lower := strings.ToLower(msg.Content)
		if strings.Contains(lower, query) {
			key := msg.PeerID + ":" + msg.Content
			if !seen[key] {
				seen[key] = true
				results = append(results, fmt.Sprintf("[%s] %s: %s", msg.CreatedAt, msg.PeerID, msg.Content))
			}
		}
	}

	if len(results) == 0 {
		return "", nil
	}

	return strings.Join(results, "\n"), nil
}

// ── Context ───────────────────────────────────────────────────────────

// StoreContext stores a formatted context string for a session.
func (s *RedisStore) StoreContext(ctx context.Context, sessionID, context string) error {
	return s.client.Set(ctx, contextKey(sessionID), context, 3600) // 1 hour TTL
}

// GetContext retrieves the stored context for a session.
func (s *RedisStore) GetContext(ctx context.Context, sessionID string) (string, error) {
	return s.client.Get(ctx, contextKey(sessionID))
}

// ── Peer Profile ──────────────────────────────────────────────────────

// StorePeerProfile stores a peer profile as JSON.
func (s *RedisStore) StorePeerProfile(ctx context.Context, peerID, profile string) error {
	return s.client.Set(ctx, peerProfileKey(peerID), profile, 0) // no TTL
}

// GetPeerProfile retrieves a peer profile.
func (s *RedisStore) GetPeerProfile(ctx context.Context, peerID string) (string, error) {
	return s.client.Get(ctx, peerProfileKey(peerID))
}

// ── Peer Card ─────────────────────────────────────────────────────────

// AddPeerFact adds a fact to the peer card with a confidence score.
func (s *RedisStore) AddPeerFact(ctx context.Context, peerID, fact string, score float64) error {
	return s.client.ZAdd(ctx, peerCardKey(peerID), fact, score)
}

// GetPeerCard returns all facts from a peer card, sorted by score descending.
func (s *RedisStore) GetPeerCard(ctx context.Context, peerID string) ([]string, error) {
	return s.client.ZRangeByScore(ctx, peerCardKey(peerID), "-inf", "+inf")
}

// ── Utility ───────────────────────────────────────────────────────────

// BuildContextFromMessages builds a formatted context string from session messages.
func (s *RedisStore) BuildContextFromMessages(ctx context.Context, sessionID, query string) (string, error) {
	messages, err := s.GetRecentMessages(ctx, sessionID, 20)
	if err != nil {
		return "", err
	}

	if len(messages) == 0 {
		return "", nil
	}

	var b strings.Builder
	b.WriteString("Messages:\n")
	for _, msg := range messages {
		role := strings.TrimSpace(msg.PeerID)
		if role == "" {
			role = "unknown"
		}
		b.WriteString(fmt.Sprintf("- %s: %s\n", role, strings.TrimSpace(msg.Content)))
	}

	return strings.TrimSpace(b.String()), nil
}

// ── Ephemeral Storage (short-term TTL-based) ─────────────────────────

// StoreEphemeral stores a value with a TTL for short-term memory needs.
func (s *RedisStore) StoreEphemeral(ctx context.Context, prefix, id, value string, ttlSeconds int) error {
	key := ephemeralKey(prefix, id)
	return s.client.Set(ctx, key, value, ttlSeconds)
}

// GetEphemeral retrieves an ephemeral value.
func (s *RedisStore) GetEphemeral(ctx context.Context, prefix, id string) (string, error) {
	key := ephemeralKey(prefix, id)
	return s.client.Get(ctx, key)
}

// ── Helpers ───────────────────────────────────────────────────────────

func parseMessageRecords(raw []string) ([]MessageRecord, error) {
	records := make([]MessageRecord, 0, len(raw))
	for _, r := range raw {
		var msg MessageRecord
		if err := json.Unmarshal([]byte(r), &msg); err != nil {
			// If it's not JSON, store as plain content
			records = append(records, MessageRecord{
				Content:   r,
				CreatedAt: time.Now().UTC().Format(time.RFC3339),
			})
			continue
		}
		records = append(records, msg)
	}
	return records, nil
}
