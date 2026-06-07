import { buildPerpsFrontendStatus } from "./frontend.js";
import { handleTelegramPerpsCommand } from "./telegram.js";
export async function getPerpsStatusApi(runtime) {
    const status = await buildPerpsFrontendStatus(runtime);
    return {
        ok: true,
        surface: "perps-status",
        status,
    };
}
export async function postTelegramPerpsApi(runtime, text) {
    const response = await handleTelegramPerpsCommand(runtime, text);
    return {
        ok: response.ok,
        surface: "telegram-perps",
        response,
    };
}
//# sourceMappingURL=api.js.map