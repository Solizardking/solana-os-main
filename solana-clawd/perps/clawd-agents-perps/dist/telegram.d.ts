import { ClawdPerpsRuntime } from "./marketMaker.js";
export interface TelegramPerpsCommand {
    command: string;
    description: string;
}
export interface TelegramPerpsResponse {
    ok: boolean;
    text: string;
    data?: unknown;
}
export declare const TELEGRAM_PERPS_COMMANDS: TelegramPerpsCommand[];
export declare function handleTelegramPerpsCommand(runtime: ClawdPerpsRuntime, text: string): Promise<TelegramPerpsResponse>;
