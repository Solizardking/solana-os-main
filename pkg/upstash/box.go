// Package upstash — box.go
// Upstash Box container management for cloud agent execution.
//
// Upstash Box provides ephemeral containers that can be used to offload
// compute-intensive tasks (research, backtesting, trading signal computation)
// from the local SolanaOS runtime.
//
// API docs: https://docs.upstash.com/box
package upstash

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
)


// ── Box Client ────────────────────────────────────────────────────────

// BoxManager handles Upstash Box deployment operations.
type BoxManager struct {
	client *Client
	cfg    *Config
	http   *http.Client
}

// NewBoxManager creates a new BoxManager.
func NewBoxManager(client *Client, cfg *Config) *BoxManager {
	timeout := DefaultHTTPTimeout
	if cfg != nil && cfg.Timeout > 0 {
		timeout = cfg.Timeout
	}
	return &BoxManager{
		client: client,
		cfg:    cfg,
		http:   &http.Client{Timeout: timeout},
	}
}

// ── Box API Endpoints ─────────────────────────────────────────────────

func (m *BoxManager) endpoint() string {
	if m.cfg != nil && m.cfg.BoxEndpoint != "" {
		return strings.TrimRight(m.cfg.BoxEndpoint, "/")
	}
	return DefaultBoxEndpoint
}

func (m *BoxManager) token() string {
	if m.cfg != nil && m.cfg.BoxToken != "" {
		return m.cfg.BoxToken
	}
	return ""
}

// ── Box Operations ────────────────────────────────────────────────────

// Deploy deploys a Box container with the given configuration.
// Returns the Box name and any deployment error.
func (m *BoxManager) Deploy(ctx context.Context, cfg BoxConfig) (string, error) {
	if cfg.Name == "" {
		return "", fmt.Errorf("upstash box: name is required")
	}
	if cfg.Image == "" {
		return "", fmt.Errorf("upstash box: image is required")
	}

	// Set defaults
	if cfg.Region == "" {
		cfg.Region = DefaultBoxRegion
	}
	if cfg.CPU <= 0 {
		cfg.CPU = 2 // Small by default
	}
	if cfg.Memory <= 0 {
		cfg.Memory = 4 // 4GB by default
	}
	if cfg.Replicas <= 0 {
		cfg.Replicas = 1
	}
	if cfg.TimeoutSec <= 0 {
		cfg.TimeoutSec = 300 // 5 min default
	}

	payload := map[string]any{
		"name":           cfg.Name,
		"image":          cfg.Image,
		"region":         cfg.Region,
		"cpu":            cfg.CPU,
		"memory":         cfg.Memory,
		"replicas":       cfg.Replicas,
		"timeoutSeconds": cfg.TimeoutSec,
	}

	if len(cfg.Env) > 0 {
		envVars := make([]map[string]string, 0, len(cfg.Env))
		for k, v := range cfg.Env {
			envVars = append(envVars, map[string]string{"name": k, "value": v})
		}
		payload["env"] = envVars
	}

	data, err := json.Marshal(payload)
	if err != nil {
		return "", fmt.Errorf("upstash box: marshal payload: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST",
		m.endpoint()+"/v1/box/deploy",
		bytes.NewReader(data))
	if err != nil {
		return "", fmt.Errorf("upstash box: create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+m.token())
	req.Header.Set("Content-Type", "application/json")

	resp, err := m.http.Do(req)
	if err != nil {
		return "", fmt.Errorf("upstash box: deploy request: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 400 {
		return "", fmt.Errorf("upstash box: deploy error %d: %s", resp.StatusCode, string(body))
	}

	var result struct {
		Name string `json:"name"`
	}
	if err := json.Unmarshal(body, &result); err != nil {
		return "", fmt.Errorf("upstash box: parse response: %w", err)
	}

	return result.Name, nil
}

// GetStatus retrieves the status of a deployed Box.
func (m *BoxManager) GetStatus(ctx context.Context, name string) (*BoxStatus, error) {
	if name == "" {
		return nil, fmt.Errorf("upstash box: name is required")
	}

	req, err := http.NewRequestWithContext(ctx, "GET",
		m.endpoint()+"/v1/box/"+name, nil)
	if err != nil {
		return nil, fmt.Errorf("upstash box: create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+m.token())

	resp, err := m.http.Do(req)
	if err != nil {
		return nil, fmt.Errorf("upstash box: status request: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("upstash box: status error %d: %s", resp.StatusCode, string(body))
	}

	var status BoxStatus
	if err := json.Unmarshal(body, &status); err != nil {
		return nil, fmt.Errorf("upstash box: parse status: %w", err)
	}

	return &status, nil
}

// Stop stops a running Box deployment.
func (m *BoxManager) Stop(ctx context.Context, name string) error {
	if name == "" {
		return fmt.Errorf("upstash box: name is required")
	}

	req, err := http.NewRequestWithContext(ctx, "POST",
		m.endpoint()+"/v1/box/"+name+"/stop", nil)
	if err != nil {
		return fmt.Errorf("upstash box: create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+m.token())

	resp, err := m.http.Do(req)
	if err != nil {
		return fmt.Errorf("upstash box: stop request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("upstash box: stop error %d: %s", resp.StatusCode, string(body))
	}

	return nil
}

// Delete removes a Box deployment.
func (m *BoxManager) Delete(ctx context.Context, name string) error {
	if name == "" {
		return fmt.Errorf("upstash box: name is required")
	}

	req, err := http.NewRequestWithContext(ctx, "DELETE",
		m.endpoint()+"/v1/box/"+name, nil)
	if err != nil {
		return fmt.Errorf("upstash box: create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+m.token())

	resp, err := m.http.Do(req)
	if err != nil {
		return fmt.Errorf("upstash box: delete request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("upstash box: delete error %d: %s", resp.StatusCode, string(body))
	}

	return nil
}

// List returns all Box deployments.
func (m *BoxManager) List(ctx context.Context) ([]BoxStatus, error) {
	req, err := http.NewRequestWithContext(ctx, "GET",
		m.endpoint()+"/v1/box", nil)
	if err != nil {
		return nil, fmt.Errorf("upstash box: create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+m.token())

	resp, err := m.http.Do(req)
	if err != nil {
		return nil, fmt.Errorf("upstash box: list request: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("upstash box: list error %d: %s", resp.StatusCode, string(body))
	}

	var boxes []BoxStatus
	if err := json.Unmarshal(body, &boxes); err != nil {
		return nil, fmt.Errorf("upstash box: parse list: %w", err)
	}

	return boxes, nil
}

// Execute runs a command inside a Box container and returns the output.
// This is a convenience method that creates an ephemeral execution.
func (m *BoxManager) Execute(ctx context.Context, name, command string, timeoutSec int) (string, error) {
	if name == "" {
		return "", fmt.Errorf("upstash box: name is required")
	}
	if timeoutSec <= 0 {
		timeoutSec = 60
	}

	payload := map[string]any{
		"command":       command,
		"timeoutSeconds": timeoutSec,
	}

	data, err := json.Marshal(payload)
	if err != nil {
		return "", fmt.Errorf("upstash box: marshal exec: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST",
		m.endpoint()+"/v1/box/"+name+"/exec",
		bytes.NewReader(data))
	if err != nil {
		return "", fmt.Errorf("upstash box: create exec request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+m.token())
	req.Header.Set("Content-Type", "application/json")

	resp, err := m.http.Do(req)
	if err != nil {
		return "", fmt.Errorf("upstash box: exec request: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 400 {
		return "", fmt.Errorf("upstash box: exec error %d: %s", resp.StatusCode, string(body))
	}

	var result struct {
		Output string `json:"output"`
	}
	if err := json.Unmarshal(body, &result); err != nil {
		return string(body), nil
	}

	return result.Output, nil
}

// ── Agent Image Helper ────────────────────────────────────────────────

// DefaultAgentImage returns the default Docker image for SolanaOS agent boxes.
func DefaultAgentImage() string {
	return "golang:1.23-alpine"
}

// DefaultSolanaOSBoxConfig returns a default BoxConfig for running the SolanaOS binary.
func DefaultSolanaOSBoxConfig(name string) BoxConfig {
	return BoxConfig{
		Name:       name,
		Image:      DefaultAgentImage(),
		Region:     DefaultBoxRegion,
		CPU:        2,
		Memory:     4,
		Replicas:   1,
		TimeoutSec: 300,
	}
}
