const CLAWD_MINT =
  process.env.CLAWD_TOKEN_ADDRESS ?? "8cHzQHUS2s2h8TzCmfqPKYiM4dSt4roa3n7MyRLApump";
const MIN_BALANCE = Number(process.env.CLAWD_MIN_BALANCE ?? "100000");
const RPC_URL =
  process.env.HELIUS_RPC_URL ??
  process.env.SOLANA_RPC_URL ??
  "https://api.mainnet-beta.solana.com";

export type ClawdBalanceResult = {
  walletAddress: string;
  mint: string;
  uiAmount: number;
  meetsMinimum: boolean;
  rpcOk: boolean;
  rpcError?: string;
};

export async function verifyClawdHolding(
  walletAddress: string
): Promise<ClawdBalanceResult> {
  let uiAmount = 0;
  let rpcOk = false;
  let rpcError: string | undefined;

  try {
    const res = await fetch(RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "clawd-verify",
        method: "getTokenAccountsByOwner",
        params: [
          walletAddress,
          { mint: CLAWD_MINT },
          { encoding: "jsonParsed" },
        ],
      }),
      signal: AbortSignal.timeout(15_000),
    });

    const data = await res.json() as any;

    if (data?.error) {
      rpcError = `RPC error: ${data.error.message ?? "unknown"}`;
    } else {
      const accounts: any[] = data?.result?.value ?? [];
      for (const acct of accounts) {
        const ui =
          acct?.account?.data?.parsed?.info?.tokenAmount?.uiAmount;
        if (typeof ui === "number") uiAmount += ui;
      }
      rpcOk = true;
    }
  } catch (err) {
    rpcError = `Helius RPC unreachable: ${(err as Error).message}`;
  }

  return {
    walletAddress,
    mint: CLAWD_MINT,
    uiAmount,
    meetsMinimum: rpcOk && uiAmount >= MIN_BALANCE,
    rpcOk,
    rpcError,
  };
}

export { CLAWD_MINT, MIN_BALANCE };
