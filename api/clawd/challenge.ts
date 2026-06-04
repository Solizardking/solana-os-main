import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  generateAuthMessage,
  isValidWalletAddress,
} from "../../lib/clawd/phantomAuth";

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const walletAddress =
    typeof req.body?.walletAddress === "string"
      ? req.body.walletAddress.trim()
      : "";

  if (!walletAddress || !isValidWalletAddress(walletAddress)) {
    res.status(400).json({ error: "Invalid walletAddress" });
    return;
  }

  const timestamp = new Date().toISOString();
  const message = generateAuthMessage(walletAddress, timestamp);
  res.json({ message, timestamp });
}
