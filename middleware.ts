// Vercel Edge Middleware — no external dependencies (WebCrypto only)
// Checks the clawd_session cookie set by api/clawd/verify.ts.
const COOKIE = process.env.COOKIE_NAME ?? "clawd_session";
const PUBLIC_PREFIXES = [
  "/login",
  "/api/auth/",
  "/api/clawd/",
  "/api/solana/",
];
const STATIC_RE = /\.(ico|png|svg|jpg|jpeg|webp|woff2?|ttf|css|js|map|json)$/;

async function verifyJWT(token: string): Promise<boolean> {
  const secret = process.env.JWT_SECRET ?? "change-me-in-production";
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [header, payload, sig] = parts;
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const b64url = (s: string) =>
      Uint8Array.from(
        atob(s.replace(/-/g, "+").replace(/_/g, "/")),
        (c) => c.charCodeAt(0)
      );
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      b64url(sig),
      new TextEncoder().encode(`${header}.${payload}`)
    );
    if (!valid) return false;
    const claims = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
    ) as { exp?: number };
    if (claims.exp && claims.exp < Date.now() / 1000) return false;
    return true;
  } catch {
    return false;
  }
}

function getCookie(header: string, name: string): string | undefined {
  return header
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

// Paths that require a valid $CLAWD session
const PROTECTED_PREFIXES = ["/api/protected/"];

export default async function middleware(req: Request): Promise<Response | undefined> {
  const url = new URL(req.url);
  const path = url.pathname;

  // Only block explicitly protected API paths
  if (!PROTECTED_PREFIXES.some((p) => path.startsWith(p))) {
    return undefined;
  }

  const token = getCookie(req.headers.get("cookie") ?? "", COOKIE);
  if (token && (await verifyJWT(token))) return undefined;

  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

export const config = { runtime: "edge" };
