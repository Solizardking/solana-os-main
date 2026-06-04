import type { VercelRequest, VercelResponse } from "@vercel/node";
import { SignJWT } from "jose";
import { MIN_BALANCE, verifyClawdHolding } from "../../lib/clawd/clawdHolding";
import {
  generateAuthMessage,
  isValidTimestamp,
  isValidWalletAddress,
  verifyPhantomSignature,
} from "../../lib/clawd/phantomAuth";

const GATE_ENABLED = /^(1|true|yes|on)$/i.test(
  process.env.CLAWD_GATE_ENABLED ?? "true"
);
const ADMIN_WALLETS = new Set(
  (process.env.CLAWD_ADMIN_WALLETS ?? "")
    .split(",")
    .map((w) => w.trim())
    .filter(Boolean)
);
const WHITELIST_WALLETS = new Set(
  (process.env.CLAWD_WHITELIST_WALLETS ?? "")
    .split(",")
    .map((w) => w.trim())
    .filter(Boolean)
);
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "change-me-in-production"
);
const COOKIE_NAME = process.env.COOKIE_NAME ?? "clawd_session";
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { walletAddress, signature, message, timestamp } = req.body ?? {};
  if (!walletAddress || !signature || !message || !timestamp) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  if (!isValidWalletAddress(walletAddress)) {
    res.status(400).json({ error: "Invalid wallet address" });
    return;
  }
  if (!isValidTimestamp(timestamp)) {
    res.status(401).json({ error: "Challenge expired — request a new one" });
    return;
  }
  const expected = generateAuthMessage(walletAddress, timestamp);
  if (message !== expected) {
    res.status(401).json({ error: "Message mismatch" });
    return;
  }
  if (!await verifyPhantomSignature(message, signature, walletAddress)) {
    res.status(401).json({ error: "Invalid signature" });
    return;
  }

  const isAdmin = ADMIN_WALLETS.has(walletAddress);
  const isWhitelisted = WHITELIST_WALLETS.has(walletAddress);

  if (GATE_ENABLED && !isAdmin && !isWhitelisted) {
    const holding = await verifyClawdHolding(walletAddress);
    if (!holding.rpcOk) {
      res.status(403).json({
        error: `Unable to verify $CLAWD balance (${holding.rpcError ?? "RPC unreachable"}). Please retry.`,
      });
      return;
    }
    if (!holding.meetsMinimum) {
      res.status(403).json({
        error: `Access requires ${MIN_BALANCE.toLocaleString()} $CLAWD. Your balance: ${holding.uiAmount.toLocaleString()}`,
        walletAddress,
        clawdBalance: holding.uiAmount,
        mint: holding.mint,
        required: MIN_BALANCE,
      });
      return;
    }
  }

  const token = await new SignJWT({
    wallet: walletAddress,
    role: isAdmin ? "admin" : "user",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("365d")
    .sign(JWT_SECRET);

  const secure = req.headers.host?.includes("localhost") ? "" : "; Secure";
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=${token}; HttpOnly${secure}; SameSite=Lax; Path=/; Max-Age=${ONE_YEAR_MS / 1000}`
  );
  res.json({ ok: true, walletAddress, role: isAdmin ? "admin" : "user" });
}
