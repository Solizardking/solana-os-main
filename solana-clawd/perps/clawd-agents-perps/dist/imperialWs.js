/**
 * Imperial WebSocket Client
 *
 * Two persistent connections:
 *   /ws        — wallet-scoped invalidation (positions_updated, orders_updated)
 *   /ws/market — public market data stream (funding, marks, depth)
 *
 * Typed event emitter with automatic ping/pong keepalive and exponential-backoff
 * reconnect. Works in both Node (ws package) and browser (native WebSocket).
 */
export function createMarketCache() {
    return {
        funding: new Map(),
        markPrices: new Map(),
        depth: new Map(),
        lastUpdated: 0,
    };
}
// ─── Simple typed event emitter ───────────────────────────────────────────────
class TypedEmitter {
    listeners = {};
    on(event, listener) {
        if (!this.listeners[event])
            this.listeners[event] = [];
        this.listeners[event].push(listener);
        return this;
    }
    off(event, listener) {
        const arr = this.listeners[event];
        if (arr) {
            const idx = arr.indexOf(listener);
            if (idx >= 0)
                arr.splice(idx, 1);
        }
        return this;
    }
    emit(event, data) {
        const arr = this.listeners[event];
        if (arr) {
            for (const fn of arr)
                fn(data);
        }
    }
}
const WS_OPEN = 1;
async function openWs(url) {
    // Try native global WebSocket first (browser / Bun)
    const NativeWs = globalThis.WebSocket;
    if (NativeWs)
        return new NativeWs(url);
    // Fall back to 'ws' package in Node
    try {
        const { WebSocket: NodeWs } = await import("ws");
        return new NodeWs(url);
    }
    catch {
        throw new Error("No WebSocket implementation available. Install the 'ws' package.");
    }
}
// ─── ImperialMarketWs ─────────────────────────────────────────────────────────
export class ImperialMarketWs extends TypedEmitter {
    wsUrl;
    subscribeSymbols;
    ws = null;
    stopped = false;
    reconnectDelay = 1000;
    pingTimer = null;
    cache = createMarketCache();
    constructor(wsUrl, subscribeSymbols) {
        super();
        this.wsUrl = wsUrl;
        this.subscribeSymbols = subscribeSymbols;
    }
    async connect() {
        if (this.stopped)
            return;
        try {
            this.ws = await openWs(this.wsUrl);
        }
        catch (err) {
            this.emit("error", err instanceof Error ? err : new Error(String(err)));
            this.scheduleReconnect();
            return;
        }
        this.ws.onopen = () => {
            this.reconnectDelay = 1000;
            this.emit("connected", undefined);
            this.subscribe();
            this.startPing();
        };
        this.ws.onmessage = (ev) => {
            try {
                const msg = JSON.parse(ev.data);
                this.handleMessage(msg);
            }
            catch {
                // ignore parse errors
            }
        };
        this.ws.onerror = (ev) => {
            const err = ev instanceof Error ? ev : new Error("WebSocket error");
            this.emit("error", err);
        };
        this.ws.onclose = (ev) => {
            this.stopPing();
            this.emit("disconnected", { code: ev.code, reason: String(ev.reason ?? "") });
            if (!this.stopped)
                this.scheduleReconnect();
        };
    }
    subscribe() {
        if (!this.ws || this.ws.readyState !== WS_OPEN)
            return;
        this.ws.send(JSON.stringify({ type: "subscribe_funding_rates" }));
        this.ws.send(JSON.stringify({ type: "subscribe_mark_prices" }));
        this.ws.send(JSON.stringify({
            type: "subscribe_phoenix_depth",
            ...(this.subscribeSymbols ? { symbols: this.subscribeSymbols } : {}),
        }));
    }
    handleMessage(msg) {
        switch (msg.type) {
            case "funding_rate_update": {
                const key = `${msg.symbol}:${msg.venue}`;
                this.cache.funding.set(key, msg);
                this.cache.lastUpdated = Date.now();
                this.emit("funding", msg);
                break;
            }
            case "mark_price_update": {
                const key = `${msg.symbol}:${msg.venue}`;
                this.cache.markPrices.set(key, msg);
                this.cache.lastUpdated = Date.now();
                this.emit("mark", msg);
                break;
            }
            case "phoenix_depth_update": {
                this.cache.depth.set(msg.symbol, msg.snapshot);
                this.cache.lastUpdated = Date.now();
                this.emit("depth", msg);
                break;
            }
        }
    }
    startPing() {
        this.pingTimer = setInterval(() => {
            if (this.ws?.readyState === WS_OPEN) {
                this.ws.send(JSON.stringify({ type: "ping" }));
            }
        }, 20_000);
    }
    stopPing() {
        if (this.pingTimer) {
            clearInterval(this.pingTimer);
            this.pingTimer = null;
        }
    }
    scheduleReconnect() {
        const delay = this.reconnectDelay;
        this.reconnectDelay = Math.min(delay * 2, 30_000);
        setTimeout(() => this.connect(), delay);
    }
    /** Get latest mark price for a symbol from cache. */
    getMarkPrice(symbol, venue = "phoenix") {
        return this.cache.markPrices.get(`${symbol}:${venue}`)?.price ?? null;
    }
    /** Get latest funding for a symbol+venue from cache. */
    getFunding(symbol, venue = "phoenix") {
        return this.cache.funding.get(`${symbol}:${venue}`) ?? null;
    }
    /** Get latest depth snapshot for a symbol. */
    getDepth(symbol) {
        return this.cache.depth.get(symbol) ?? null;
    }
    /** Best mid price from depth cache. */
    getMid(symbol) {
        const d = this.getDepth(symbol);
        if (!d?.bids.length || !d?.asks.length)
            return null;
        const bid = d.bids[0]?.[0] ?? 0;
        const ask = d.asks[0]?.[0] ?? 0;
        return bid > 0 && ask > 0 ? (bid + ask) / 2 : null;
    }
    disconnect() {
        this.stopped = true;
        this.stopPing();
        this.ws?.close();
        this.ws = null;
    }
}
export class ImperialWalletWs extends TypedEmitter {
    wsUrl;
    wallet;
    ws = null;
    stopped = false;
    reconnectDelay = 1000;
    pingTimer = null;
    constructor(wsUrl, wallet) {
        super();
        this.wsUrl = wsUrl;
        this.wallet = wallet;
    }
    async connect() {
        if (this.stopped)
            return;
        try {
            this.ws = await openWs(this.wsUrl);
        }
        catch (err) {
            this.emit("error", err instanceof Error ? err : new Error(String(err)));
            this.scheduleReconnect();
            return;
        }
        this.ws.onopen = () => {
            this.reconnectDelay = 1000;
            this.emit("connected", undefined);
            this.ws?.send(JSON.stringify({ type: "subscribe", wallet: this.wallet }));
            this.pingTimer = setInterval(() => {
                if (this.ws?.readyState === WS_OPEN) {
                    this.ws.send(JSON.stringify({ type: "ping" }));
                }
            }, 20_000);
        };
        this.ws.onmessage = (ev) => {
            try {
                const msg = JSON.parse(ev.data);
                if (msg.type === "positions_updated")
                    this.emit("positions_updated", undefined);
                if (msg.type === "orders_updated")
                    this.emit("orders_updated", undefined);
            }
            catch {
                // ignore
            }
        };
        this.ws.onerror = (ev) => {
            this.emit("error", ev instanceof Error ? ev : new Error("WS error"));
        };
        this.ws.onclose = (ev) => {
            if (this.pingTimer) {
                clearInterval(this.pingTimer);
                this.pingTimer = null;
            }
            this.emit("disconnected", { code: ev.code, reason: String(ev.reason ?? "") });
            if (!this.stopped)
                this.scheduleReconnect();
        };
    }
    scheduleReconnect() {
        const delay = this.reconnectDelay;
        this.reconnectDelay = Math.min(delay * 2, 30_000);
        setTimeout(() => this.connect(), delay);
    }
    disconnect() {
        this.stopped = true;
        if (this.pingTimer) {
            clearInterval(this.pingTimer);
            this.pingTimer = null;
        }
        this.ws?.close();
        this.ws = null;
    }
}
// ─── Factory ──────────────────────────────────────────────────────────────────
export function createImperialMarketWs(base, symbols) {
    const wsBase = base.replace(/^http/, "ws").replace(/\/api\/v1\/?$/, "");
    return new ImperialMarketWs(`${wsBase}/ws/market`, symbols);
}
export function createImperialWalletWs(base, wallet) {
    const wsBase = base.replace(/^http/, "ws").replace(/\/api\/v1\/?$/, "");
    return new ImperialWalletWs(`${wsBase}/ws`, wallet);
}
//# sourceMappingURL=imperialWs.js.map