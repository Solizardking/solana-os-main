export type PerpProgramOiReadArgs<T> = {
    rpcUrl: string;
    marketAccount: string;
    decodeMarket: (data: Buffer) => T;
    pickLongOi: (decoded: T) => bigint | number;
    pickShortOi: (decoded: T) => bigint | number;
};
export type PerpProgramOiSnapshot = {
    marketAccount: string;
    longOi: number;
    shortOi: number;
    totalOi: number;
    balanced: boolean;
    slot?: number;
};
export declare function readPerpProgramOi<T>(args: PerpProgramOiReadArgs<T>): Promise<PerpProgramOiSnapshot>;
