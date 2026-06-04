const APP_ID = import.meta.env.VITE_PHANTOM_APP_ID ?? "042c127c-ae87-47f5-8ad3-941486b0ac99";
const CALLBACK = import.meta.env.VITE_PHANTOM_CALLBACK ?? "https://terminal.solanaos.net/auth/callback";
const MIN_CLAWD = 100_000;

// ── base58 encode ─────────────────────────────────────────────────────────────
const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
function encodeBase58(bytes: Uint8Array): string {
  let n = bytes.reduce((acc, b) => acc * 256n + BigInt(b), 0n);
  let out = "";
  while (n > 0n) { out = B58[Number(n % 58n)] + out; n /= 58n; }
  for (const b of bytes) { if (b !== 0) break; out = `1${out}`; }
  return out;
}

// ── UI helpers ────────────────────────────────────────────────────────────────
function $(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Element #${id} not found`);
  return el;
}
function setStatus(msg: string, cls: "" | "error" | "success" = "") {
  const el = $("status");
  el.textContent = msg;
  el.className = cls ? `status ${cls}` : "status";
}

// ── Phantom provider ──────────────────────────────────────────────────────────
interface PhantomProvider {
  isPhantom?: boolean;
  connect(opts?: { appId?: string }): Promise<{ publicKey: { toBase58(): string } }>;
  signMessage(msg: Uint8Array, encoding: string): Promise<{ signature: Uint8Array }>;
}

function getProvider(): PhantomProvider | null {
  const win = window as Window & {
    phantom?: { solana?: PhantomProvider };
    backpack?: PhantomProvider;
    solflare?: PhantomProvider & { isSolflare?: boolean };
  };
  if (win.phantom?.solana?.isPhantom) return win.phantom.solana;
  if (win.backpack) return win.backpack;
  if (win.solflare?.isSolflare) return win.solflare;
  return null;
}

function openPhantomDeepLink() {
  const ref = encodeURIComponent(CALLBACK);
  const appUrl = encodeURIComponent("https://terminal.solanaos.net");
  window.location.href = `https://phantom.app/ul/v1/connect?app_url=${appUrl}&redirect_link=${ref}&app_id=${APP_ID}`;
}

// ── CLAWD gate handshake ──────────────────────────────────────────────────────
async function clawdSignIn(
  address: string,
  signMessage: (msg: Uint8Array) => Promise<{ signature: Uint8Array }>
) {
  const cRes = await fetch("/api/clawd/challenge", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ walletAddress: address }),
  });
  if (!cRes.ok) throw new Error("Challenge failed");
  const { message, timestamp } = await cRes.json() as { message: string; timestamp: string };

  const { signature } = await signMessage(new TextEncoder().encode(message));
  const sigB58 = encodeBase58(signature);

  const vRes = await fetch("/api/clawd/verify", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ walletAddress: address, signature: sigB58, message, timestamp }),
  });

  if (vRes.status === 403) {
    const err = await vRes.json() as { error?: string; clawdBalance?: number };
    const bal = err.clawdBalance !== undefined
      ? ` Your balance: ${err.clawdBalance.toLocaleString()}.`
      : "";
    throw new Error(err.error ?? `Need ${MIN_CLAWD.toLocaleString()} $CLAWD.${bal}`);
  }
  if (!vRes.ok) {
    const err = await vRes.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? `Verify failed (${vRes.status})`);
  }
}

// ── Main connect flow ─────────────────────────────────────────────────────────
async function connect() {
  const btn = $("connectBtn") as HTMLButtonElement;
  const provider = getProvider();

  if (!provider) {
    if (/iPhone|iPad|Android/i.test(navigator.userAgent)) {
      openPhantomDeepLink();
      return;
    }
    setStatus("No wallet detected. Install Phantom or Backpack.", "error");
    return;
  }

  try {
    btn.disabled = true;
    setStatus("Connecting wallet…");
    const resp = await provider.connect({ appId: APP_ID });
    const address = resp.publicKey.toBase58();

    setStatus("Verifying $CLAWD holding…");
    await clawdSignIn(address, (msg) => provider.signMessage(msg, "utf8"));

    setStatus("Access granted!", "success");
    const from = new URLSearchParams(location.search).get("from") ?? "/";
    setTimeout(() => { location.href = from; }, 700);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Sign-in failed.";
    setStatus(msg, "error");
    btn.disabled = false;
  }
}

// ── Boot ──────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  $("connectBtn").addEventListener("click", connect);
  if (/iPhone|iPad|Android/i.test(navigator.userAgent) && !getProvider()) {
    ($("connectBtn") as HTMLButtonElement).textContent = "⚡ Open in Phantom";
  }
});
