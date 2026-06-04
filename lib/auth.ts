import { betterAuth } from "better-auth";
import { siws } from "better-auth-solana";
import { Pool } from "pg";
import { verifyClawdHolding, MIN_BALANCE } from "./clawd/clawdHolding";
import { verifyPhantomSignature } from "./clawd/phantomAuth";

const ADMIN_WALLETS = new Set(
  (process.env.CLAWD_ADMIN_WALLETS ?? "")
    .split(",")
    .map((w) => w.trim())
    .filter(Boolean)
);
const GATE_ENABLED = /^(1|true|yes|on)$/i.test(
  process.env.CLAWD_GATE_ENABLED ?? "true"
);

export const auth = betterAuth({
  baseURL: "https://terminal.solanaos.net",

  secret: process.env.BETTER_AUTH_SECRET ?? "",

  database: new Pool({
    connectionString: process.env.DATABASE_URL ?? "",
    ssl: { rejectUnauthorized: false },
  }),

  emailAndPassword: {
    enabled: true,
  },

  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID ?? "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    },
    discord: {
      clientId: process.env.DISCORD_CLIENT_ID ?? "",
      clientSecret: process.env.DISCORD_CLIENT_SECRET ?? "",
    },
    twitter: {
      clientId: process.env.TWITTER_CLIENT_ID ?? "",
      clientSecret: process.env.TWITTER_CLIENT_SECRET ?? "",
    },
  },

  plugins: [
    siws({
      domain: "terminal.solanaos.net",
      // Verify SIWS signature + $CLAWD holding before issuing a session
      verifySignature: async ({ address, message, signature }) => {
        const valid = await verifyPhantomSignature(message, signature, address);
        if (!valid) return false;

        if (!GATE_ENABLED || ADMIN_WALLETS.has(address)) return true;

        const holding = await verifyClawdHolding(address);
        if (!holding.rpcOk) {
          throw new Error(
            `Unable to verify $CLAWD balance: ${holding.rpcError ?? "RPC unreachable"}`
          );
        }
        if (!holding.meetsMinimum) {
          throw new Error(
            `Access requires ${MIN_BALANCE.toLocaleString()} $CLAWD. Your balance: ${holding.uiAmount.toLocaleString()}`
          );
        }
        return true;
      },
    }),
  ],

  trustedOrigins: [
    "https://terminal.solanaos.net",
    "http://localhost:5173",
    "http://localhost:3000",
  ],
});

export type Session = typeof auth.$Infer.Session;
