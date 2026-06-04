import type { VercelRequest, VercelResponse } from "@vercel/node";

const COOKIE_NAME = process.env.COOKIE_NAME ?? "clawd_session";

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`
  );
  res.json({ ok: true });
}
