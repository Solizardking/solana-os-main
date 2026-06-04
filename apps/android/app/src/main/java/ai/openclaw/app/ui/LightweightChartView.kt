package ai.openclaw.app.ui

import ai.openclaw.app.solana.BirdeyeOhlcvItem
import android.annotation.SuppressLint
import android.graphics.Color as AndroidColor
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.webkit.WebSettingsCompat
import androidx.webkit.WebViewFeature

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun LightweightChartView(
    candles: List<BirdeyeOhlcvItem>,
    liveCandle: BirdeyeOhlcvItem? = null,
    modifier: Modifier = Modifier,
) {
    val context = LocalContext.current
    val webViewRef = remember { mutableStateOf<WebView?>(null) }
    val chartReady = remember { mutableStateOf(false) }

    DisposableEffect(Unit) {
        onDispose {
            webViewRef.value?.stopLoading()
            webViewRef.value?.destroy()
            webViewRef.value = null
        }
    }

    // Push initial candles once chart is ready
    LaunchedEffect(chartReady.value, candles) {
        if (!chartReady.value || candles.isEmpty()) return@LaunchedEffect
        val js = buildCandleDataJs(candles)
        webViewRef.value?.post { webViewRef.value?.evaluateJavascript(js, null) }
    }

    // Push live candle updates
    LaunchedEffect(chartReady.value, liveCandle) {
        if (!chartReady.value || liveCandle == null) return@LaunchedEffect
        val js = buildUpdateCandleJs(liveCandle)
        webViewRef.value?.post { webViewRef.value?.evaluateJavascript(js, null) }
    }

    AndroidView(
        modifier = modifier
            .fillMaxWidth()
            .height(280.dp)
            .clip(RoundedCornerShape(14.dp)),
        factory = {
            WebView(context).apply {
                setBackgroundColor(AndroidColor.parseColor("#0a0a0a"))
                settings.javaScriptEnabled = true
                settings.domStorageEnabled = true
                settings.mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
                settings.useWideViewPort = false
                settings.builtInZoomControls = false
                settings.displayZoomControls = false
                settings.setSupportZoom(false)
                if (WebViewFeature.isFeatureSupported(WebViewFeature.ALGORITHMIC_DARKENING)) {
                    WebSettingsCompat.setAlgorithmicDarkeningAllowed(settings, false)
                }
                webViewClient = object : WebViewClient() {
                    override fun onPageFinished(view: WebView?, url: String?) {
                        chartReady.value = true
                    }
                }
                loadDataWithBaseURL(
                    "https://solanaos.net",
                    chartHtml(),
                    "text/html",
                    "UTF-8",
                    null,
                )
                webViewRef.value = this
            }
        },
    )
}

private fun chartHtml(): String = """
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{background:#0a0a0a;overflow:hidden;width:100%;height:100%}
#chart{width:100%;height:100%}
</style>
</head>
<body>
<div id="chart"></div>
<script src="https://unpkg.com/lightweight-charts@5.0.0/dist/lightweight-charts.standalone.production.js"></script>
<script>
const chart = LightweightCharts.createChart(document.getElementById('chart'), {
    layout: {
        background: { type: 'solid', color: '#0a0a0a' },
        textColor: 'rgba(255,255,255,0.5)',
        fontFamily: 'system-ui',
        fontSize: 11,
    },
    grid: {
        vertLines: { color: 'rgba(255,255,255,0.04)' },
        horzLines: { color: 'rgba(255,255,255,0.04)' },
    },
    crosshair: { mode: 0 },
    rightPriceScale: {
        borderColor: 'rgba(255,255,255,0.08)',
        scaleMargins: { top: 0.1, bottom: 0.2 },
    },
    timeScale: {
        borderColor: 'rgba(255,255,255,0.08)',
        timeVisible: true,
        secondsVisible: false,
    },
    handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
    handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
});

const candleSeries = chart.addSeries(LightweightCharts.CandlestickSeries, {
    upColor: '#14f195',
    downColor: '#ff4d6a',
    borderUpColor: '#14f195',
    borderDownColor: '#ff4d6a',
    wickUpColor: '#14f195',
    wickDownColor: '#ff4d6a',
});

const volumeSeries = chart.addSeries(LightweightCharts.HistogramSeries, {
    priceFormat: { type: 'volume' },
    priceScaleId: 'volume',
});
chart.priceScale('volume').applyOptions({
    scaleMargins: { top: 0.8, bottom: 0 },
});

function setCandles(data) {
    const candles = data.map(d => ({ time: d.time, open: d.open, high: d.high, low: d.low, close: d.close }));
    const volumes = data.map(d => ({
        time: d.time,
        value: d.volume,
        color: d.close >= d.open ? 'rgba(20,241,149,0.2)' : 'rgba(255,77,106,0.2)',
    }));
    candleSeries.setData(candles);
    volumeSeries.setData(volumes);
    chart.timeScale().fitContent();
}

function updateCandle(d) {
    candleSeries.update({ time: d.time, open: d.open, high: d.high, low: d.low, close: d.close });
    volumeSeries.update({
        time: d.time,
        value: d.volume,
        color: d.close >= d.open ? 'rgba(20,241,149,0.2)' : 'rgba(255,77,106,0.2)',
    });
}

window.addEventListener('resize', () => chart.applyOptions({ width: window.innerWidth }));
</script>
</body>
</html>
""".trimIndent()

private fun buildCandleDataJs(candles: List<BirdeyeOhlcvItem>): String {
    val arr = candles.joinToString(",") { c ->
        """{"time":${c.time},"open":${c.open},"high":${c.high},"low":${c.low},"close":${c.close},"volume":${c.volume}}"""
    }
    return "setCandles([$arr])"
}

private fun buildUpdateCandleJs(candle: BirdeyeOhlcvItem): String =
    """updateCandle({"time":${candle.time},"open":${candle.open},"high":${candle.high},"low":${candle.low},"close":${candle.close},"volume":${candle.volume}})"""
