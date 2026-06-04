package ai.openclaw.app.solana

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.doubleOrNull
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.longOrNull
import okhttp3.OkHttpClient
import okhttp3.Request

@Serializable
data class BirdeyeOhlcvItem(
    val time: Long,
    val open: Double,
    val high: Double,
    val low: Double,
    val close: Double,
    val volume: Double,
)

@Serializable
data class BirdeyeTokenOverview(
    val address: String = "",
    val symbol: String = "",
    val name: String = "",
    val price: Double? = null,
    val priceChange24h: Double? = null,
    val marketCap: Double? = null,
    val fdv: Double? = null,
    val liquidity: Double? = null,
    val volume24h: Double? = null,
    val holders: Int? = null,
)

class BirdeyeApiClient(
    private val apiKey: String,
    private val client: OkHttpClient = OkHttpClient(),
) {
    private val baseUrl = "https://public-api.birdeye.so"
    private val json = Json { ignoreUnknownKeys = true; coerceInputValues = true }

    val isConfigured: Boolean get() = apiKey.isNotBlank()

    private fun buildRequest(path: String): Request.Builder =
        Request.Builder()
            .url("$baseUrl$path")
            .addHeader("X-API-KEY", apiKey)
            .addHeader("x-chain", "solana")

    suspend fun fetchOhlcv(
        mint: String,
        timeframe: String = "15m",
        limit: Int = 100,
    ): List<BirdeyeOhlcvItem> = withContext(Dispatchers.IO) {
        if (!isConfigured) return@withContext emptyList()
        val tfMap = mapOf(
            "1m" to "1m", "5m" to "5m", "15m" to "15m",
            "1h" to "1H", "4h" to "4H", "1d" to "1D",
        )
        val tf = tfMap[timeframe] ?: "15m"
        val now = System.currentTimeMillis() / 1000
        val from = now - when (timeframe) {
            "1m" -> limit * 60L
            "5m" -> limit * 300L
            "15m" -> limit * 900L
            "1h" -> limit * 3600L
            "4h" -> limit * 14400L
            "1d" -> limit * 86400L
            else -> limit * 900L
        }
        val url = "$baseUrl/defi/ohlcv?address=$mint&type=$tf&time_from=$from&time_to=$now"
        val request = buildRequest("/defi/ohlcv?address=$mint&type=$tf&time_from=$from&time_to=$now")
            .url(url)
            .build()
        try {
            val response = client.newCall(request).execute()
            val body = response.body?.string() ?: return@withContext emptyList()
            val root = json.parseToJsonElement(body).jsonObject
            val data = root["data"]?.jsonObject ?: return@withContext emptyList()
            val items = data["items"]?.jsonArray ?: return@withContext emptyList()
            items.mapNotNull { parseOhlcvItem(it) }
        } catch (_: Exception) {
            emptyList()
        }
    }

    suspend fun fetchTokenOverview(mint: String): BirdeyeTokenOverview? = withContext(Dispatchers.IO) {
        if (!isConfigured) return@withContext null
        val request = buildRequest("/defi/token_overview?address=$mint").build()
        try {
            val response = client.newCall(request).execute()
            val body = response.body?.string() ?: return@withContext null
            val root = json.parseToJsonElement(body).jsonObject
            val data = root["data"]?.jsonObject ?: return@withContext null
            BirdeyeTokenOverview(
                address = data["address"]?.jsonPrimitive?.contentOrNull ?: mint,
                symbol = data["symbol"]?.jsonPrimitive?.contentOrNull ?: "",
                name = data["name"]?.jsonPrimitive?.contentOrNull ?: "",
                price = data["price"]?.jsonPrimitive?.doubleOrNull,
                priceChange24h = data["priceChange24hPercent"]?.jsonPrimitive?.doubleOrNull,
                marketCap = data["mc"]?.jsonPrimitive?.doubleOrNull,
                fdv = data["fdv"]?.jsonPrimitive?.doubleOrNull,
                liquidity = data["liquidity"]?.jsonPrimitive?.doubleOrNull,
                volume24h = data["v24hUSD"]?.jsonPrimitive?.doubleOrNull,
                holders = data["holder"]?.jsonPrimitive?.contentOrNull?.toIntOrNull(),
            )
        } catch (_: Exception) {
            null
        }
    }

    suspend fun fetchMultiPrice(mints: List<String>): Map<String, Double> = withContext(Dispatchers.IO) {
        if (!isConfigured || mints.isEmpty()) return@withContext emptyMap()
        val addresses = mints.joinToString(",")
        val request = buildRequest("/defi/multi_price?list_address=$addresses").build()
        try {
            val response = client.newCall(request).execute()
            val body = response.body?.string() ?: return@withContext emptyMap()
            val root = json.parseToJsonElement(body).jsonObject
            val data = root["data"]?.jsonObject ?: return@withContext emptyMap()
            data.entries.mapNotNull { (addr, el) ->
                val price = el.jsonObject["value"]?.jsonPrimitive?.doubleOrNull ?: return@mapNotNull null
                addr to price
            }.toMap()
        } catch (_: Exception) {
            emptyMap()
        }
    }

    private fun parseOhlcvItem(el: JsonElement): BirdeyeOhlcvItem? {
        val obj = el.jsonObject
        return BirdeyeOhlcvItem(
            time = obj["unixTime"]?.jsonPrimitive?.longOrNull ?: return null,
            open = obj["o"]?.jsonPrimitive?.doubleOrNull ?: return null,
            high = obj["h"]?.jsonPrimitive?.doubleOrNull ?: return null,
            low = obj["l"]?.jsonPrimitive?.doubleOrNull ?: return null,
            close = obj["c"]?.jsonPrimitive?.doubleOrNull ?: return null,
            volume = obj["v"]?.jsonPrimitive?.doubleOrNull ?: 0.0,
        )
    }
}
