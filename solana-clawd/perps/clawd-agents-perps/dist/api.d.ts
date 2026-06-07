import { ClawdPerpsRuntime } from "./marketMaker.js";
export declare function getPerpsStatusApi(runtime: ClawdPerpsRuntime): Promise<{
    ok: boolean;
    surface: string;
    status: import("./frontend.js").PerpsFrontendStatus;
}>;
export declare function postTelegramPerpsApi(runtime: ClawdPerpsRuntime, text: string): Promise<{
    ok: boolean;
    surface: string;
    response: import("./telegram.js").TelegramPerpsResponse;
}>;
