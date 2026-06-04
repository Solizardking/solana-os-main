// Pure WebCrypto implementation — no external dependencies.
// Ed25519 is supported in Node.js 18+ and all modern browsers.

export const AUTH_PREFIX =
  "Sign this message to authenticate with solana-clawd Terminal";
const FIVE_MIN = 5 * 60 * 1000;

export function generateAuthMessage(wallet: string, timestamp: string) {
  return `${AUTH_PREFIX}\n\nWallet: ${wallet}\nTimestamp: ${timestamp}`;
}

export function isValidTimestamp(timestamp: string): boolean {
  try {
    const t = new Date(timestamp).getTime();
    if (!Number.isFinite(t)) return false;
    const now = Date.now();
    return t <= now + 5_000 && now - t <= FIVE_MIN;
  } catch {
    return false;
  }
}

// Minimal base58 decoder (no external dep)
const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
function decodeBase58(s: string): Uint8Array {
  const bytes = [0];
  for (const c of s) {
    let carry = B58.indexOf(c);
    if (carry < 0) throw new Error("Invalid base58 char");
    for (let i = 0; i < bytes.length; i++) {
      carry += bytes[i] * 58;
      bytes[i] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) { bytes.push(carry & 0xff); carry >>= 8; }
  }
  for (const c of s) { if (c !== "1") break; bytes.push(0); }
  return new Uint8Array(bytes.reverse());
}

export function isValidWalletAddress(wallet: string): boolean {
  try { return decodeBase58(wallet).length === 32; } catch { return false; }
}

export async function verifyPhantomSignature(
  message: string,
  signatureB58: string,
  walletAddress: string
): Promise<boolean> {
  try {
    // TypeScript 6 requires ArrayBuffer (not ArrayBufferLike) for SubtleCrypto
    const buf = (u: Uint8Array) =>
      u.buffer.slice(u.byteOffset, u.byteOffset + u.byteLength) as ArrayBuffer;

    const key = await crypto.subtle.importKey(
      "raw",
      buf(decodeBase58(walletAddress)),
      { name: "Ed25519" },
      false,
      ["verify"]
    );
    return await crypto.subtle.verify(
      "Ed25519", key,
      buf(decodeBase58(signatureB58)),
      buf(new TextEncoder().encode(message))
    );
  } catch {
    return false;
  }
}
