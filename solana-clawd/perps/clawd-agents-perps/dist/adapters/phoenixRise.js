import { ClaWDPerps } from "@openclawdsolana/clawd-perps";
function unwrapResult(label, result) {
    if (!result.success) {
        throw new Error(result.error ?? `${label} failed`);
    }
    return result.data;
}
export class ClawdPhoenixRiseAdapter {
    config;
    perps;
    constructor(config) {
        this.config = config;
        this.perps = new ClaWDPerps({
            apiUrl: config.apiUrl,
            rpcUrl: config.rpcUrl,
            walletName: config.wallet,
            traderPdaIndex: config.traderPdaIndex,
            traderSubaccountIndex: config.traderSubaccountIndex,
        });
    }
    async listMarkets() {
        return unwrapResult("listMarkets", await this.perps.listMarkets());
    }
    async getTicker(symbol) {
        const result = symbol
            ? await this.perps.getTicker(symbol)
            : await this.perps.getAllTickers();
        return unwrapResult("getTicker", result);
    }
    async getOrderbook(symbol, depth = 20) {
        return unwrapResult("getOrderbook", await this.perps.getOrderbook(symbol, depth));
    }
    async getTraderSnapshot(authority) {
        return unwrapResult("getPortfolio", await this.perps.getPortfolio(authority));
    }
    async getPositions(authority) {
        return unwrapResult("listPositions", await this.perps.listPositions(authority));
    }
    async health() {
        return unwrapResult("health", await this.perps.health());
    }
}
export function createPhoenixRiseAdapter(config) {
    return new ClawdPhoenixRiseAdapter(config);
}
//# sourceMappingURL=phoenixRise.js.map