import { createAuthClient } from "better-auth/client";
import { siwsClient } from "better-auth-solana/client";

export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined"
    ? window.location.origin
    : "https://terminal.solanaos.net",
  basePath: "/api/auth",
  plugins: [siwsClient()],
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient;
