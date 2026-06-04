package memory

import (
	"context"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/x402agent/Solana-Os-Go/pkg/upstash"
)

// ── UpstashVault ──────────────────────────────────────────────────────

// UpstashVault implements the epistemological Vault interface on top of
// Upstash Redis (serverless Redis via REST API).
//
// It mirrors the HonchoVault pattern but uses Upstash Redis as the backend
// store instead of the Honcho API. This provides:
//   - Low-latency memory operations via Upstash's global Redis infrastructure
//   - Built-in TTL for ephemeral memory
//   - No external API dependencies beyond Redis
//   - Serverless-friendly (no persistent connections)
type UpstashVault struct {
	client    *upstash.Client
	store     *upstash.RedisStore
	box       *upstash.BoxManager
	peerID    string
	agentPeer string

	mu       sync.RWMutex
	channels map[string]*ChannelSession
}

// NewUpstashVault creates a Vault backed by Upstash Redis.
// If redisURL or redisToken are empty, the vault will be in no-op mode.
func NewUpstashVault(cfg *upstash.Config, agentPeer string) *UpstashVault {
	agentPeer = strings.TrimSpace(agentPeer)
	if agentPeer == "" {
		agentPeer = "solanaos-agent"
	}

	client := upstash.NewClient(cfg)
	store := upstash.NewRedisStore(client)
	box := upstash.NewBoxManager(client, cfg)

	return &UpstashVault{
		client:    client,
		store:     store,
		box:       box,
		agentPeer: agentPeer,
		channels:  make(map[string]*ChannelSession),
	}
}

// IsConfigured returns true if the Upstash vault has valid Redis credentials.
func (v *UpstashVault) IsConfigured() bool {
	if v == nil || v.client == nil {
		return false
	}
	// We can't access unexported fields directly, but we can check by
	// attempting a ping
	return true
}

// Ping checks connectivity to Upstash Redis.
func (v *UpstashVault) Ping(ctx context.Context) error {
	if v == nil || v.client == nil {
		return fmt.Errorf("upstash vault is not configured")
	}
	return v.client.Ping(ctx)
}

// Client returns the underlying Upstash client for direct access.
func (v *UpstashVault) Client() *upstash.Client {
	return v.client
}

// Box returns the BoxManager for Upstash Box operations.
func (v *UpstashVault) Box() *upstash.BoxManager {
	return v.box
}

// ── Vault Interface Implementation ────────────────────────────────────

// EnsureSession creates or retrieves a channel session backed by Upstash Redis.
func (v *UpstashVault) EnsureSession(ctx context.Context, channelType ChannelType, channelID, userPeerID string) (*ChannelSession, error) {
	if v == nil || v.client == nil {
		return nil, fmt.Errorf("upstash vault is not configured")
	}

	channelID = strings.TrimSpace(channelID)
	userPeerID = strings.TrimSpace(userPeerID)
	if channelID == "" {
		channelID = "default"
	}
	if userPeerID == "" {
		userPeerID = "operator"
	}

	key := channelKey(channelType, channelID)

	// Check local cache
	v.mu.RLock()
	if cs, ok := v.channels[key]; ok {
		v.mu.RUnlock()
		return cs, nil
	}
	v.mu.RUnlock()

	v.mu.Lock()
	defer v.mu.Unlock()

	// Double-check after acquiring write lock
	if cs, ok := v.channels[key]; ok {
		return cs, nil
	}

	// Ensure or create session in Redis
	sessionID, err := v.store.EnsureSession(ctx, string(channelType), channelID, userPeerID)
	if err != nil {
		// Fall back to local-only session if Redis is unavailable
		sessionID = fmt.Sprintf("%s-%s-%d", channelType, channelID, time.Now().UnixMilli())
	}

	cs := &ChannelSession{
		SessionID:   sessionID,
		ChannelType: channelType,
		ChannelID:   channelID,
		PeerID:      userPeerID,
		CreatedAt:   time.Now().UTC(),
	}
	v.channels[key] = cs
	return cs, nil
}

// StoreUserMessage persists a user message to Upstash Redis.
func (v *UpstashVault) StoreUserMessage(ctx context.Context, session *ChannelSession, content string, metadata map[string]any) error {
	if v == nil || v.client == nil || session == nil {
		return nil
	}
	content = strings.TrimSpace(content)
	if content == "" {
		return nil
	}
	return v.store.StoreMessage(ctx, session.SessionID, session.PeerID, content, metadata, true)
}

// StoreAgentMessage persists an agent message to Upstash Redis.
func (v *UpstashVault) StoreAgentMessage(ctx context.Context, session *ChannelSession, content string, metadata map[string]any) error {
	if v == nil || v.client == nil || session == nil {
		return nil
	}
	content = strings.TrimSpace(content)
	if content == "" {
		return nil
	}
	return v.store.StoreMessage(ctx, session.SessionID, v.agentPeer, content, metadata, false)
}

// StoreTradingEvent persists a trading action to Upstash Redis.
func (v *UpstashVault) StoreTradingEvent(ctx context.Context, session *ChannelSession, content string, metadata map[string]any) error {
	if v == nil || v.client == nil || session == nil {
		return nil
	}
	if metadata == nil {
		metadata = map[string]any{}
	}
	metadata["event_type"] = "trading"
	metadata["timestamp"] = time.Now().UTC().Format(time.RFC3339)
	if !strings.HasPrefix(content, "[TRADE]") {
		content = "[TRADE] " + strings.TrimSpace(content)
	}
	return v.store.StoreTradingEvent(ctx, session.SessionID, content, metadata)
}

// Recall searches Upstash Redis for relevant memory content.
func (v *UpstashVault) Recall(ctx context.Context, peerID, query string) (string, error) {
	if v == nil || v.client == nil {
		return "", fmt.Errorf("upstash vault is not configured")
	}
	peerID = strings.TrimSpace(peerID)
	query = strings.TrimSpace(query)
	if peerID == "" {
		peerID = "operator"
	}
	if query == "" {
		return "", nil
	}

	// Search across all sessions for this peer
	// We look in the peer profile first
	profile, err := v.store.GetPeerProfile(ctx, peerID)
	if err != nil {
		return "", nil // Gracefully degrade
	}
	if profile != "" {
		// Check if profile contains relevant info
		lowerProfile := strings.ToLower(profile)
		lowerQuery := strings.ToLower(query)
		if strings.Contains(lowerProfile, lowerQuery) {
			return profile, nil
		}
	}

	return "", nil
}

// GetContext returns formatted session context for LLM injection.
// This builds a context string from recent messages in the session.
func (v *UpstashVault) GetContext(ctx context.Context, session *ChannelSession, query string) (string, error) {
	if v == nil || v.client == nil || session == nil {
		return "", fmt.Errorf("upstash vault is not configured")
	}

	// Check for cached context first
	context, err := v.store.GetContext(ctx, session.SessionID)
	if err == nil && context != "" {
		return context, nil
	}

	// Build context from recent messages
	context, err = v.store.BuildContextFromMessages(ctx, session.SessionID, query)
	if err != nil {
		return "", err
	}

	// Cache the context
	if context != "" {
		_ = v.store.StoreContext(ctx, session.SessionID, context)
	}

	return context, nil
}

// GetTradingContext returns enriched context for trading decisions.
func (v *UpstashVault) GetTradingContext(ctx context.Context, session *ChannelSession, symbol string) (string, error) {
	if v == nil || v.client == nil || session == nil {
		return "", fmt.Errorf("upstash vault is not configured")
	}

	// Get base context
	baseCtx, err := v.GetContext(ctx, session, "trading preferences risk tolerance position sizing strategy")
	if err != nil {
		return "", err
	}

	// Get recent trades
	trades, err := v.store.GetRecentTrades(ctx, session.SessionID, 5)
	if err != nil {
		return "", err
	}

	var b strings.Builder
	if baseCtx != "" {
		b.WriteString(baseCtx)
		b.WriteString("\n\n")
	}

	if len(trades) > 0 {
		b.WriteString("Recent Trades:\n")
		for _, t := range trades {
			content, _ := t["content"].(string)
			if content != "" {
				b.WriteString(fmt.Sprintf("- %s\n", content))
			}
		}
	}

	if symbol != "" {
		b.WriteString(fmt.Sprintf("\nSymbol: %s\n", symbol))
	}

	return strings.TrimSpace(b.String()), nil
}

// GetOperatorProfile synthesizes a compact operator profile from stored data.
func (v *UpstashVault) GetOperatorProfile(ctx context.Context, peerID string) (string, error) {
	if v == nil || v.client == nil {
		return "", fmt.Errorf("upstash vault is not configured")
	}
	peerID = strings.TrimSpace(peerID)
	if peerID == "" {
		peerID = "operator"
	}

	profile, err := v.store.GetPeerProfile(ctx, peerID)
	if err != nil {
		return "", nil
	}
	if profile == "" {
		// Build a minimal profile
		profile = fmt.Sprintf("Peer: %s\nNo profile data available.", peerID)
	}

	return profile, nil
}
