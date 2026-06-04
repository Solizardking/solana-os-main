export {}

declare global {
  interface Window {
    clawdAPI: {
      helius: {
        getBalances: (address: string) => Promise<{ lamports: number }>
        getTokenAccounts: (address: string) => Promise<unknown>
        getTransactionHistory: (
          address: string,
          limit?: number
        ) => Promise<Array<{ signature: string; blockTime: number; err: null | unknown }>>
        getAssets: (address: string) => Promise<unknown>
        getTokenPrice: (
          mint: string
        ) => Promise<{ value: number; updateUnixTime: number } | null>
        getWalletPortfolio: (address: string) => Promise<unknown>
        config: () => Promise<{ hasHelius: boolean; hasBirdeye: boolean; rpcUrl: string }>
      }
      assemblyai: {
        getStreamingToken: (
          expiresIn?: number,
          maxDuration?: number
        ) => Promise<{ token: string; expires_in_seconds: number }>
        getVoiceAgentToken: (
          expiresIn?: number,
          maxDuration?: number
        ) => Promise<{ token: string; expires_in_seconds: number }>
        chat: (
          model: string,
          messages: Array<{ role: string; content: string }>,
          maxTokens?: number,
          temperature?: number
        ) => Promise<{ content: string; usage: { input_tokens: number; output_tokens: number } }>
        transcribeUrl: (audioUrl: string) => Promise<{ id: string; text: string; status: string }>
        config: () => Promise<{
          hasApiKey: boolean
          streamingBase: string
          agentsBase: string
          llmBase: string
        }>
      }
      livekit: {
        createRoomToken: (room: string, identity: string, ttl?: number) => Promise<string>
        createAgentToken: (room: string, agentIdentity: string, ttl?: number) => Promise<string>
        config: () => Promise<{ projectUrl: string; hasCredentials: boolean }>
      }
      metaplex: {
        recentAgents: (
          limit?: number,
          fetchDoc?: boolean
        ) => Promise<{
          items: Array<{
            assetAddress: string
            pda: string
            wallet: string
            signature: string
            slot: number
            blockTime: number | null
            network: string
            name: string | null
            image: string | null
            description: string | null
            registrationUri: string | null
            services: Array<{ name?: string; endpoint?: string; version?: string }>
            active: boolean | null
            supportedTrust: string[] | null
          }>
          network: string
        }>
        getAgent: (address: string) => Promise<unknown>
        config: () => Promise<{ program: string; hasHelius: boolean }>
      }
      vault: {
        get: (secretKey: string) => Promise<string | null>
        set: (secretKey: string, value: string) => Promise<boolean>
        delete: (secretKey: string) => Promise<boolean>
        list: () => Promise<string[]>
        clear: () => Promise<boolean>
        status: () => Promise<{ path: string; exists: boolean; osKeychainAvailable: boolean }>
      }
      wallet: {
        create: (
          label: string,
          network?: 'mainnet' | 'devnet',
          seedPhrase?: string
        ) => Promise<{ label: string; publicKey: string; network: string }>
        import: (
          label: string,
          secretKeyB58: string,
          network?: 'mainnet' | 'devnet'
        ) => Promise<{ label: string; publicKey: string; network: string }>
        list: () => Promise<
          Array<{ label: string; publicKey: string; createdAt: number; network: string }>
        >
        publicKey: (label: string) => Promise<string | null>
        exportSecret: (label: string) => Promise<string>
        delete: (label: string) => Promise<boolean>
        sign: (label: string, messageHex: string) => Promise<string>
        nonce: () => Promise<string>
      }
      skills: {
        catalog: () => Promise<
          Array<{
            slug: string
            name: string
            description?: string
            category?: string
            version?: string
            author?: string
            tags?: string[]
          }>
        >
        content: (slug: string) => Promise<string | null>
        manifest: (slug: string) => Promise<unknown>
        search: (query: string) => Promise<Array<{ slug: string; name: string; description?: string; category?: string }>>
        categories: () => Promise<string[]>
        config: () => Promise<{ root: string; exists: boolean; isPackaged: boolean }>
      }
    }
  }
}
