package main

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/spf13/cobra"

	"github.com/x402agent/Solana-Os-Go/pkg/config"
	"github.com/x402agent/Solana-Os-Go/pkg/memory"
	"github.com/x402agent/Solana-Os-Go/pkg/upstash"
)

func NewUpstashCommand() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "upstash",
		Short: "Upstash Redis memory backend and Box container tools",
		Long: `Manage Upstash Redis memory backend and Upstash Box ephemeral containers.

Upstash provides a serverless Redis backend for SolanaOS memory operations
and Box containers for ephemeral agent execution environments.

Commands:
  upstash status          — Show Upstash connection and memory status
  upstash ping            — Test Upstash Redis connectivity
  upstash recall <query>  — Query Upstash Redis memory
  upstash remember <msg>  — Store a fact in Upstash Redis memory
  upstash trades          — Show recent trading events from Upstash
  upstash box deploy      — Deploy a container to Upstash Box
  upstash box status      — Check Upstash Box container status
  upstash box stop        — Stop an Upstash Box container
  upstash box list        — List Upstash Box containers
`,
	}

	// ── ping ─────────────────────────────────────────────────────────
	cmd.AddCommand(&cobra.Command{
		Use:   "ping",
		Short: "Test Upstash Redis connectivity",
		RunE: func(cmd *cobra.Command, args []string) error {
			cfg, err := config.Load()
			if err != nil {
				return fmt.Errorf("config error: %w", err)
			}
			if !cfg.Upstash.Enabled {
				return fmt.Errorf("upstash is disabled; set UPSTASH_ENABLED=true and UPSTASH_REDIS_URL")
			}
			client := upstash.NewClient(&upstash.Config{
				RedisURL:   cfg.Upstash.RedisURL,
				RedisToken: cfg.Upstash.RedisToken,
				Timeout:    10 * time.Second,
			})
			if err := client.Ping(cmd.Context()); err != nil {
				return fmt.Errorf("upstash ping failed: %w", err)
			}
			fmt.Printf("%s✅ Upstash Redis:%s PONG\n", colorGreen, colorReset)
			return nil
		},
	})

	// ── status ───────────────────────────────────────────────────────
	statusCmd := &cobra.Command{
		Use:   "status",
		Short: "Show Upstash connection and memory status",
		RunE: func(cmd *cobra.Command, args []string) error {
			cfg, _ := config.Load()
			fmt.Printf("%s☁️  Upstash Memory Status%s\n\n", colorGreen, colorReset)
			fmt.Printf("  %sEnabled:%s        %s\n", colorDim, colorReset, boolLabel(cfg.Upstash.Enabled))
			fmt.Printf("  %sRedis URL:%s      %s\n", colorDim, colorReset, maskKey(cfg.Upstash.RedisURL))
			fmt.Printf("  %sRedis Token:%s    %s\n", colorDim, colorReset, maskKey(cfg.Upstash.RedisToken))
			fmt.Printf("  %sBox Endpoint:%s   %s\n", colorDim, colorReset, maskKey(cfg.Upstash.BoxEndpoint))
			fmt.Printf("  %sBox Region:%s     %s\n", colorDim, colorReset, cfg.Upstash.BoxRegion)
			fmt.Printf("  %sAgent Peer ID:%s  %s\n", colorDim, colorReset, cfg.Upstash.AgentPeerID)
			fmt.Printf("  %sContext TTL:%s    %d\n", colorDim, colorReset, cfg.Upstash.ContextTTL)
			fmt.Printf("  %sEphemeral TTL:%s  %d\n", colorDim, colorReset, cfg.Upstash.EphemeralTTL)

			if cfg.Upstash.Enabled && cfg.Upstash.RedisURL != "" {
				client := upstash.NewClient(&upstash.Config{
					RedisURL:   cfg.Upstash.RedisURL,
					RedisToken: cfg.Upstash.RedisToken,
					Timeout:    5 * time.Second,
				})
				ctx, cancel := context.WithTimeout(cmd.Context(), 5*time.Second)
				defer cancel()
				if err := client.Ping(ctx); err != nil {
					fmt.Printf("\n  %s⚠️  Redis: unreachable — %s%s\n", colorAmber, err, colorReset)
				} else {
					fmt.Printf("\n  %s✅ Redis:%s PONG\n", colorGreen, colorReset)
				}
			}
			return nil
		},
	}

	// ── recall ───────────────────────────────────────────────────────
	recallCmd := &cobra.Command{
		Use:   "recall <query>",
		Short: "Query Upstash Redis memory",
		Args:  cobra.MinimumNArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			peerID, _ := cmd.Flags().GetString("peer")
			cfg, _ := config.Load()
			vault, err := newUpstashVault(cfg)
			if err != nil {
				return err
			}
			answer, err := vault.Recall(cmd.Context(), peerID, strings.Join(args, " "))
			if err != nil {
				return err
			}
			fmt.Printf("%s🔎 Upstash Recall%s\n\n%s\n", colorGreen, colorReset, strings.TrimSpace(answer))
			return nil
		},
	}
	recallCmd.Flags().String("peer", "operator", "Peer ID to query")

	// ── remember ─────────────────────────────────────────────────────
	rememberCmd := &cobra.Command{
		Use:   "remember <fact>",
		Short: "Store a fact in Upstash Redis memory",
		Args:  cobra.MinimumNArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			channelID, _ := cmd.Flags().GetString("channel")
			peerID, _ := cmd.Flags().GetString("peer")
			cfg, _ := config.Load()
			vault, err := newUpstashVault(cfg)
			if err != nil {
				return err
			}
			session, err := vault.EnsureSession(cmd.Context(), memory.ChannelCLI, channelID, peerID)
			if err != nil {
				return err
			}
			fact := strings.Join(args, " ")
			if err := vault.StoreAgentMessage(cmd.Context(), session, fact, nil); err != nil {
				return err
			}
			fmt.Printf("%s💾 Stored to Upstash memory: %s%s\n", colorGreen, colorReset, fact)
			return nil
		},
	}
	rememberCmd.Flags().String("channel", "cli", "Channel ID")
	rememberCmd.Flags().String("peer", "operator", "Peer ID")

	// ── trades ───────────────────────────────────────────────────────
	tradesCmd := &cobra.Command{
		Use:   "trades",
		Short: "Show recent trading events from Upstash",
		RunE: func(cmd *cobra.Command, args []string) error {
			limit, _ := cmd.Flags().GetInt("limit")
			cfg, _ := config.Load()
			vault, err := newUpstashVault(cfg)
			if err != nil {
				return err
			}
			session, err := vault.EnsureSession(cmd.Context(), memory.ChannelCLI, "trades", "operator")
			if err != nil {
				return err
			}
			trades, err := vault.GetTradingContext(cmd.Context(), session, "")
			if err != nil {
				return err
			}
			if trades == "" {
				fmt.Printf("%s📊 No trading events found.%s\n", colorDim, colorReset)
				return nil
			}
			lines := strings.Split(strings.TrimSpace(trades), "\n")
			if len(lines) > limit {
				lines = lines[len(lines)-limit:]
			}
			fmt.Printf("%s📊 Recent Trades (Upstash)%s\n\n", colorGreen, colorReset)
			for _, line := range lines {
				fmt.Printf("  %s\n", line)
			}
			return nil
		},
	}
	tradesCmd.Flags().Int("limit", 10, "Max trades to show")

	// ── box subcommand ───────────────────────────────────────────────
	boxCmd := &cobra.Command{
		Use:   "box",
		Short: "Manage Upstash Box containers",
	}

	boxDeployCmd := &cobra.Command{
		Use:   "deploy [image]",
		Short: "Deploy a container to Upstash Box",
		Args:  cobra.MaximumNArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			cfg, _ := config.Load()
			if !cfg.Upstash.Enabled {
				return fmt.Errorf("upstash is disabled; set UPSTASH_ENABLED=true")
			}
			if cfg.Upstash.BoxEndpoint == "" {
				return fmt.Errorf("upstash box endpoint not configured; set UPSTASH_BOX_ENDPOINT")
			}
			image := upstash.DefaultAgentImage()
			if len(args) > 0 {
				image = args[0]
			}

			client := upstash.NewClient(&upstash.Config{
				RedisURL:     cfg.Upstash.RedisURL,
				RedisToken:   cfg.Upstash.RedisToken,
				BoxEndpoint:  cfg.Upstash.BoxEndpoint,
				BoxToken:     cfg.Upstash.BoxToken,
				BoxRegion:    cfg.Upstash.BoxRegion,
				Timeout:      30 * time.Second,
			})
			box := upstash.NewBoxManager(client, &upstash.Config{
				BoxRegion: cfg.Upstash.BoxRegion,
			})

			boxCfg := upstash.DefaultSolanaOSBoxConfig(image)
			name, err := box.Deploy(cmd.Context(), boxCfg)
			if err != nil {
				return fmt.Errorf("box deploy failed: %w", err)
			}
			fmt.Printf("%s📦 Upstash Box Deployed%s\n\n", colorGreen, colorReset)
			fmt.Printf("  %sName:%s   %s\n", colorDim, colorReset, name)
			fmt.Printf("  %sImage:%s  %s\n", colorDim, colorReset, boxCfg.Image)
			return nil
		},
	}

	boxStatusCmd := &cobra.Command{
		Use:   "status <id>",
		Short: "Check Upstash Box container status",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			cfg, _ := config.Load()
			client := upstash.NewClient(&upstash.Config{
				BoxEndpoint: cfg.Upstash.BoxEndpoint,
				BoxToken:    cfg.Upstash.BoxToken,
				Timeout:     10 * time.Second,
			})
			box := upstash.NewBoxManager(client, nil)
			status, err := box.GetStatus(cmd.Context(), args[0])
			if err != nil {
				return fmt.Errorf("box status failed: %w", err)
			}
			fmt.Printf("%s📦 Upstash Box Status%s\n\n", colorGreen, colorReset)
			fmt.Printf("  %sName:%s   %s\n", colorDim, colorReset, status.Name)
			fmt.Printf("  %sState:%s  %s\n", colorDim, colorReset, status.State)
			fmt.Printf("  %sRegion:%s %s\n", colorDim, colorReset, status.Region)
			if status.Endpoint != "" {
				fmt.Printf("  %sEndpoint:%s %s\n", colorDim, colorReset, status.Endpoint)
			}
			return nil
		},
	}

	boxStopCmd := &cobra.Command{
		Use:   "stop <id>",
		Short: "Stop an Upstash Box container",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			cfg, _ := config.Load()
			client := upstash.NewClient(&upstash.Config{
				BoxEndpoint: cfg.Upstash.BoxEndpoint,
				BoxToken:    cfg.Upstash.BoxToken,
				Timeout:     10 * time.Second,
			})
			box := upstash.NewBoxManager(client, nil)
			if err := box.Stop(cmd.Context(), args[0]); err != nil {
				return fmt.Errorf("box stop failed: %w", err)
			}
			fmt.Printf("%s✅ Upstash Box %s stopped.%s\n", colorGreen, args[0], colorReset)
			return nil
		},
	}

	boxListCmd := &cobra.Command{
		Use:   "list",
		Short: "List Upstash Box containers",
		RunE: func(cmd *cobra.Command, args []string) error {
			cfg, _ := config.Load()
			client := upstash.NewClient(&upstash.Config{
				BoxEndpoint: cfg.Upstash.BoxEndpoint,
				BoxToken:    cfg.Upstash.BoxToken,
				Timeout:     10 * time.Second,
			})
			box := upstash.NewBoxManager(client, nil)
			containers, err := box.List(cmd.Context())
			if err != nil {
				return fmt.Errorf("box list failed: %w", err)
			}
			if len(containers) == 0 {
				fmt.Printf("%s📦 No Upstash Box containers found.%s\n", colorDim, colorReset)
				return nil
			}
			fmt.Printf("%s📦 Upstash Box Containers%s\n\n", colorGreen, colorReset)
			for _, c := range containers {
				fmt.Printf("  %s• %s%s (state: %s)\n", colorDim, colorReset, c.Name, c.State)
				if c.Endpoint != "" {
					fmt.Printf("    %sEndpoint:%s %s\n", colorDim, colorReset, c.Endpoint)
				}
			}
			return nil
		},
	}

	boxCmd.AddCommand(boxDeployCmd, boxStatusCmd, boxStopCmd, boxListCmd)

	cmd.AddCommand(statusCmd, recallCmd, rememberCmd, tradesCmd, boxCmd)

	return cmd
}

func newUpstashVault(cfg *config.Config) (*memory.UpstashVault, error) {
	if cfg == nil || !cfg.Upstash.Enabled {
		return nil, fmt.Errorf("upstash is disabled; set UPSTASH_ENABLED=true and UPSTASH_REDIS_URL/TOKEN")
	}
	upstashCfg := &upstash.Config{
		RedisURL:     cfg.Upstash.RedisURL,
		RedisToken:   cfg.Upstash.RedisToken,
		BoxEndpoint:  cfg.Upstash.BoxEndpoint,
		BoxToken:     cfg.Upstash.BoxToken,
		BoxRegion:    cfg.Upstash.BoxRegion,
		Timeout:      10 * time.Second,
	}
	agentPeer := cfg.Upstash.AgentPeerID
	if agentPeer == "" {
		agentPeer = "solanaos-agent"
	}
	return memory.NewUpstashVault(upstashCfg, agentPeer), nil
}

func maskKey(s string) string {
	if s == "" {
		return "(not set)"
	}
	if len(s) <= 8 {
		return strings.Repeat("*", len(s))
	}
	return s[:4] + strings.Repeat("*", len(s)-8) + s[len(s)-4:]
}
