// SolanaOS Computer TUI Launcher — Solana-native terminal UI
// Uses tview for a rich interactive experience.
package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"strings"
	"time"

	"github.com/gdamore/tcell/v2"
	"github.com/rivo/tview"
)

const (
	clawdGreen  = "#14F195"
	clawdPurple = "#9945FF"
	clawdTeal   = "#00D4FF"
	clawdAmber  = "#FFAA00"
	clawdRed    = "#FF4060"
	clawdBg     = "#020208"
	clawdBg2    = "#0A0A14"
	clawdDim    = "#556680"
)

const gobotArt = `[#14F195]
              ██████╗████████████████████████████╗
             ██╔═══████╔═══════════════════════████╗
           ██║   ████║  [#14F195]🖥️ SOLANAOS[#14F195]            ████║
           ██║   ████║  [#00D4FF]The Solana Computer[#14F195]    ████║
          ██║   ████║  [#9945FF]NVIDIA Orin Nano[#14F195]       ████║
         ██║   ████║  [#FFAA00]x402 · Go · Solana[#14F195]    ████║
        ██║   ████╚═══════════════════════════████║
       ██║   ████████████████████████████████████║
      ██╔╝                                   ████║
     ██╔╝   [#9945FF]╔══════════════════════╗[#14F195]     ████║
    ██╔╝    [#9945FF]║  ◉   OODA LOOP   ◉  ║[#14F195]    ████║
   ██╔╝     [#9945FF]║  OBSERVE → ORIENT   ║[#14F195]   ████║
  ██╔╝      [#9945FF]║  DECIDE  →  ACT     ║[#14F195]  ████║
 ██╔╝       [#9945FF]╚══════════════════════╝[#14F195] ████║
██╔╝                                       ████║
██║      [#FFAA00]🎛️ Modulino® I2C[#14F195]              ████║
██║      [#FFAA00]Pixels·Buzzer·Knob·IMU[#14F195]        ████║
██╚══════════════════════════════════════████╝
 ╚══════════════════════════════════════██╝[-]
`

func main() {
	app := tview.NewApplication()

	// ── Header ───────────────────────────────────────────────
	header := tview.NewTextView().
		SetDynamicColors(true).
		SetTextAlign(tview.AlignCenter).
		SetText(fmt.Sprintf("[%s]SOLANAOS[%s] [%s]Computer[%s] [%s]:: v1.0 :: Go Runtime :: x402 :: %s[-]",
			clawdGreen, clawdPurple, clawdTeal, "", clawdDim, time.Now().Format("15:04:05")))
	header.SetBackgroundColor(tcell.ColorBlack)
	header.SetBorderPadding(0, 0, 2, 2)

	// ── Lobster Art Panel ────────────────────────────────────
	artView := tview.NewTextView().
		SetDynamicColors(true).
		SetText(gobotArt)
	artView.SetBackgroundColor(tcell.ColorBlack)
	artView.SetBorder(true).
		SetBorderColor(tcell.NewRGBColor(20, 241, 149)).
		SetTitle(fmt.Sprintf(" [%s]🖥️ SOLANAOS COMPUTER[-] ", clawdGreen)).
		SetTitleAlign(tview.AlignCenter)

	// ── Menu ─────────────────────────────────────────────────
	menuItems := []struct {
		label string
		desc  string
		cmd   string
	}{
		{"🤖 Agent Chat", "Interactive chat with SolanaOS AI", "agent"},
		{"🔄 OODA Loop", "Start autonomous trading cycle", "ooda"},
		{"💰 Wallet", "Solana wallet info & balance", "solana wallet"},
		{"🌐 Trending", "Birdeye trending tokens", "solana trending"},
		{"🔬 Research", "Deep research a token", "solana research So11111111111111111111111111111111111111112"},
		{"🧾 DAS Owner", "Helius DAS assets by owner", "solana das owner-assets"},
		{"🪙 SPL Supply", "Helius SPL token supply", "solana spl token-supply So11111111111111111111111111111111111111112"},
		{"⚡ RPC Ping", "Helius generic RPC getSlot", "solana spl rpc getSlot --params '[]'"},
		{"📊 Status", "System status & health", "status"},
		{"🛠  Onboard", "Initialize config & workspace", "onboard"},
		{"🎛  Hardware", "Scan Arduino Modulino® I2C sensors", "hardware scan"},
		{"⚙  Gateway", "Start multi-channel gateway", "gateway"},
		{"📜 Version", "Version & build info", "version"},
	}

	menu := tview.NewList()
	menu.SetBackgroundColor(tcell.ColorBlack)
	menu.SetBorder(true).
		SetBorderColor(tcell.NewRGBColor(153, 69, 255)).
		SetTitle(fmt.Sprintf(" [%s]◆ LAUNCH PAD[-] ", clawdPurple)).
		SetTitleAlign(tview.AlignLeft)
	menu.SetHighlightFullLine(true)
	menu.SetSelectedBackgroundColor(tcell.NewRGBColor(20, 241, 149))
	menu.SetSelectedTextColor(tcell.ColorBlack)
	menu.SetMainTextColor(tcell.NewRGBColor(200, 216, 232))
	menu.SetSecondaryTextColor(tcell.NewRGBColor(85, 102, 128))

	for i, item := range menuItems {
		cmdCopy := item.cmd
		shortcut := rune('a' + i)
		menu.AddItem(item.label, item.desc, shortcut, func() {
			app.Stop()
			runGoBot(cmdCopy)
		})
	}

	menu.AddItem("🚪 Exit", "Quit the launcher", 'q', func() {
		app.Stop()
	})

	// ── Status Panel ─────────────────────────────────────────
	statusView := tview.NewTextView().
		SetDynamicColors(true)
	statusView.SetBackgroundColor(tcell.ColorBlack)
	statusView.SetBorder(true).
		SetBorderColor(tcell.NewRGBColor(0, 212, 255)).
		SetTitle(fmt.Sprintf(" [%s]SYSTEM STATUS[-] ", clawdTeal)).
		SetTitleAlign(tview.AlignLeft)

	updateStatus(statusView)

	// ── Live Market Feed ─────────────────────────────────────
	marketView := tview.NewTextView().
		SetDynamicColors(true).
		SetChangedFunc(func() { app.Draw() })
	marketView.SetBackgroundColor(tcell.ColorBlack)
	marketView.SetBorder(true).
		SetBorderColor(tcell.NewRGBColor(255, 170, 0)).
		SetTitle(fmt.Sprintf(" [%s]📊 LIVE MARKET[-] ", clawdAmber)).
		SetTitleAlign(tview.AlignLeft)
	marketView.SetText(fmt.Sprintf("[%s]Connecting to SolanaTracker...[-]", clawdDim))

	// ── Honcho + Hub Panel ───────────────────────────────────
	hubView := tview.NewTextView().
		SetDynamicColors(true)
	hubView.SetBackgroundColor(tcell.ColorBlack)
	hubView.SetBorder(true).
		SetBorderColor(tcell.NewRGBColor(14, 165, 233)).
		SetTitle(fmt.Sprintf(" [%s]🧠 MEMORY + HUB[-] ", "#0EA5E9")).
		SetTitleAlign(tview.AlignLeft)
	hubView.SetText(fmt.Sprintf(`[%s]Memory[-]   Honcho: %s  Vault: [%s]✓[-]  Convex: %s
[%s]Hub[-]      solanaos.net  seeker.solanaos.net  souls.solanaos.net
[%s]Strategy[-] %s   [%s]Dialectic[-] %s   [%s]CLI[-] npx solanaos-cli install`,
		clawdTeal, envStatus("HONCHO_API_KEY"), clawdGreen, envStatus("CONVEX_URL"),
		clawdAmber,
		clawdPurple, envValue("HONCHO_SESSION_STRATEGY", "per-chat"),
		"#0EA5E9", envValue("HONCHO_DIALECTIC_ENABLED", "true"),
		clawdDim,
	))

	// ── Info Bar ─────────────────────────────────────────────
	infoBar := tview.NewTextView().
		SetDynamicColors(true).
		SetTextAlign(tview.AlignCenter).
		SetText(fmt.Sprintf("[%s]SolanaOS :: solanaos.net :: seeker.solanaos.net :: github.com/x402agent/Solana-Os-Go[-]", clawdDim))
	infoBar.SetBackgroundColor(tcell.ColorBlack)

	// ── Layout ───────────────────────────────────────────────
	leftPanel := tview.NewFlex().
		SetDirection(tview.FlexRow).
		AddItem(artView, 22, 0, false).
		AddItem(statusView, 0, 1, false)

	rightPanel := tview.NewFlex().
		SetDirection(tview.FlexRow).
		AddItem(menu, 0, 1, true).
		AddItem(marketView, 10, 0, false)

	mainContent := tview.NewFlex().
		AddItem(leftPanel, 0, 1, false).
		AddItem(rightPanel, 0, 1, true)

	layout := tview.NewFlex().
		SetDirection(tview.FlexRow).
		AddItem(header, 1, 0, false).
		AddItem(mainContent, 0, 1, true).
		AddItem(hubView, 5, 0, false).
		AddItem(infoBar, 1, 0, false)

	// ── Run ──────────────────────────────────────────────────
	app.SetRoot(layout, true).
		EnableMouse(true).
		SetFocus(menu)

	// Update status periodically
	go func() {
		for {
			time.Sleep(5 * time.Second)
			app.QueueUpdateDraw(func() {
				updateStatus(statusView)
			})
		}
	}()

	// Live market data feed
	go func() {
		updateMarketFeed(marketView)
		for {
			time.Sleep(15 * time.Second)
			app.QueueUpdateDraw(func() {
				updateMarketFeed(marketView)
			})
		}
	}()

	if err := app.Run(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func updateStatus(view *tview.TextView) {
	now := time.Now()

	status := fmt.Sprintf(`[%s]Runtime[%s]
  Go:        %-20s
  Platform:  %-20s
  Time:      %s

[%s]Solana Stack[%s]
  Helius:    %s
  Network:   %s
  Birdeye:   %s
  Jupiter:   %s
  Aster:     %s
  DAS:       %s
  SPL/RPC:   %s

[%s]Hardware[%s]
  Target:    NVIDIA Orin Nano
  I2C Bus:   /dev/i2c-1
  Modulinos: (scan on connect)

[%s]Memory[%s]
  Vault:     ~/.nanosolana/workspace/vault
  Supabase:  %s
`,
		clawdGreen, "",
		"Go 1.25+",
		"linux/arm64",
		now.Format("15:04:05 MST"),
		clawdAmber, "",
		envStatus("HELIUS_API_KEY"),
		envValue("HELIUS_NETWORK", "mainnet"),
		envStatus("BIRDEYE_API_KEY"),
		envStatus("JUPITER_API_KEY"),
		envStatus("ASTER_API_KEY"),
		envStatus("HELIUS_API_KEY"),
		envStatus("HELIUS_API_KEY"),
		clawdTeal, "",
		clawdPurple, "",
		envStatus("SUPABASE_URL"),
	)

	view.SetText(status)
}

func envStatus(key string) string {
	if os.Getenv(key) != "" {
		return fmt.Sprintf("[%s]✓ configured[-]", clawdGreen)
	}
	return fmt.Sprintf("[%s]✗ not set[-]", clawdRed)
}

func envValue(key, fallback string) string {
	v := strings.TrimSpace(os.Getenv(key))
	if v == "" {
		v = fallback
	}
	return fmt.Sprintf("[%s]%s[-]", clawdTeal, v)
}

func updateMarketFeed(view *tview.TextView) {
	apiKey := os.Getenv("SOLANA_TRACKER_API_KEY")
	if apiKey == "" {
		view.SetText(fmt.Sprintf("[%s]Set SOLANA_TRACKER_API_KEY for live data[-]", clawdDim))
		return
	}

	client := &http.Client{Timeout: 5 * time.Second}
	req, err := http.NewRequest("GET", "https://data.solanatracker.io/tokens/trending", nil)
	if err != nil {
		view.SetText(fmt.Sprintf("[%s]Feed error: %s[-]", clawdRed, err.Error()))
		return
	}
	req.Header.Set("x-api-key", apiKey)

	resp, err := client.Do(req)
	if err != nil {
		view.SetText(fmt.Sprintf("[%s]Feed offline: %s[-]", clawdRed, err.Error()))
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != 200 {
		view.SetText(fmt.Sprintf("[%s]API %d[-]", clawdRed, resp.StatusCode))
		return
	}

	var tokens []struct {
		Name   string  `json:"name"`
		Symbol string  `json:"symbol"`
		Price  float64 `json:"price"`
		Volume float64 `json:"volume"`
		Change float64 `json:"priceChange"`
	}
	if err := json.Unmarshal(body, &tokens); err != nil {
		// Try nested format
		var wrapper struct {
			Tokens []struct {
				Name   string  `json:"name"`
				Symbol string  `json:"symbol"`
				Price  float64 `json:"price"`
				Volume float64 `json:"volume"`
				Change float64 `json:"priceChange"`
			} `json:"tokens"`
		}
		if err2 := json.Unmarshal(body, &wrapper); err2 == nil {
			tokens = wrapper.Tokens
		}
	}

	if len(tokens) == 0 {
		view.SetText(fmt.Sprintf("[%s]No trending data[-]  [%s]%s[-]", clawdDim, clawdDim, time.Now().Format("15:04:05")))
		return
	}

	var b strings.Builder
	limit := len(tokens)
	if limit > 6 {
		limit = 6
	}
	for _, t := range tokens[:limit] {
		changeColor := clawdGreen
		arrow := "▲"
		if t.Change < 0 {
			changeColor = clawdRed
			arrow = "▼"
		}
		sym := t.Symbol
		if len(sym) > 8 {
			sym = sym[:8]
		}
		b.WriteString(fmt.Sprintf("  [%s]%-8s[%s] $%-10.6f [%s]%s%.1f%%[-]\n",
			clawdAmber, sym, "", t.Price, changeColor, arrow, t.Change))
	}
	b.WriteString(fmt.Sprintf("  [%s]Updated %s[-]", clawdDim, time.Now().Format("15:04:05")))
	view.SetText(b.String())
}

func runGoBot(subcmd string) {
	parts := strings.Fields(subcmd)
	args := append([]string{}, parts...)

	// Try the canonical CLI name first, then compatibility aliases.
	binary := "solanaos"
	if _, err := exec.LookPath(binary); err != nil {
		if _, compatErr := exec.LookPath("nanosolana"); compatErr == nil {
			binary = "nanosolana"
		} else if _, localErr := os.Stat("./build/solanaos"); localErr == nil {
			binary = "./build/solanaos"
		} else {
			binary = "./solanaos"
		}
	}

	cmd := exec.Command(binary, args...)
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Run()
}
