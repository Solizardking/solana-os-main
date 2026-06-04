package ai.openclaw.app.solana

import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.launch
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.doubleOrNull
import kotlinx.serialization.json.longOrNull
import kotlinx.serialization.json.put
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean

class BirdeyeWebSocketClient(
    private val wssUrl: String,
    private val apiKey: String,
) {
    private val tag = "BirdeyeWS"
    private val json = Json { ignoreUnknownKeys = true }
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val running = AtomicBoolean(false)
    private var ws: WebSocket? = null
    private var subscribedMint: String? = null

    private val client = OkHttpClient.Builder()
        .pingInterval(20, TimeUnit.SECONDS)
        .readTimeout(0, TimeUnit.MILLISECONDS)
        .build()

    private val _ohlcvUpdates = MutableSharedFlow<BirdeyeOhlcvItem>(extraBufferCapacity = 64)
    val ohlcvUpdates: SharedFlow<BirdeyeOhlcvItem> = _ohlcvUpdates

    val isConfigured: Boolean get() = wssUrl.isNotBlank() && apiKey.isNotBlank()
    val isConnected: Boolean get() = running.get()

    fun connect() {
        if (!isConfigured || running.get()) return
        val url = if (wssUrl.contains("?")) wssUrl else "$wssUrl?x-api-key=$apiKey"
        val request = Request.Builder().url(url).build()
        running.set(true)
        ws = client.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                Log.i(tag, "Connected")
                subscribedMint?.let { subscribePriceOhlcv(it) }
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                handleMessage(text)
            }

            override fun onClosing(webSocket: WebSocket, code: Int, reason: String) {
                Log.i(tag, "Closing: $code $reason")
                webSocket.close(1000, null)
            }

            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                Log.i(tag, "Closed: $code")
                running.set(false)
                reconnect()
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                Log.w(tag, "Failure: ${t.message}")
                running.set(false)
                reconnect()
            }
        })
    }

    fun disconnect() {
        running.set(false)
        ws?.close(1000, "bye")
        ws = null
        subscribedMint = null
    }

    fun subscribePriceOhlcv(mint: String) {
        subscribedMint = mint
        val sub = buildJsonObject {
            put("type", "SUBSCRIBE_PRICE")
            put("data", buildJsonObject {
                put("chartType", "1m")
                put("address", mint)
                put("currency", "usd")
            })
        }
        ws?.send(sub.toString())
        Log.i(tag, "Subscribed OHLCV: $mint")
    }

    fun unsubscribe(mint: String) {
        val unsub = buildJsonObject {
            put("type", "UNSUBSCRIBE_PRICE")
            put("data", buildJsonObject {
                put("chartType", "1m")
                put("address", mint)
                put("currency", "usd")
            })
        }
        ws?.send(unsub.toString())
        if (subscribedMint == mint) subscribedMint = null
    }

    private fun handleMessage(text: String) {
        try {
            val root = json.parseToJsonElement(text).jsonObject
            val type = root["type"]?.jsonPrimitive?.content ?: return
            if (type != "PRICE_DATA") return
            val data = root["data"]?.jsonObject ?: return
            val item = BirdeyeOhlcvItem(
                time = data["unixTime"]?.jsonPrimitive?.longOrNull
                    ?: (System.currentTimeMillis() / 1000),
                open = data["o"]?.jsonPrimitive?.doubleOrNull ?: return,
                high = data["h"]?.jsonPrimitive?.doubleOrNull ?: return,
                low = data["l"]?.jsonPrimitive?.doubleOrNull ?: return,
                close = data["c"]?.jsonPrimitive?.doubleOrNull ?: return,
                volume = data["v"]?.jsonPrimitive?.doubleOrNull ?: 0.0,
            )
            _ohlcvUpdates.tryEmit(item)
        } catch (_: Exception) {}
    }

    private fun reconnect() {
        scope.launch {
            delay(3000)
            if (!running.get()) connect()
        }
    }
}
