import android.accessibilityservice.AccessibilityService
import android.view.accessibility.AccessibilityEvent

class OfferReaderService : AccessibilityService() {

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        event?.let {
            val packageName = it.packageName.toString()
            val textNodes = it.text
            if (textNodes.isNotEmpty()) {
                val rawText = textNodes.joinToString(" ")
                val parsed = parseOfferFromText(rawText)
                
                // CANONICAL PAYLOAD FORMAT
                val payload = mapOf(
                    "platform" to "android",
                    "source" to packageName,
                    "game" to parsed.gameName,
                    "level" to parsed.level,
                    "offer" to mapOf(
                        "priceCents" to parsed.priceCents,
                        "resourceType" to parsed.resourceType,
                        "baseAmount" to parsed.baseAmount,
                        "bonusAmount" to parsed.bonusAmount
                    ),
                    "session" to mapOf(
                        "velocity" to 1.0,
                        "phase" to "Mid"
                    )
                )
                sendToBackend(payload)
            }
        }
    }

    override fun onInterrupt() {}

    private fun sendToBackend(payload: Map<String, Any>) {
        // POST to https://YOUR_REPLIT_URL/api/analyze-offer
    }

    data class ParsedOffer(
        val gameName: String,
        val level: Int,
        val priceCents: Int,
        val resourceType: String,
        val baseAmount: Int,
        val bonusAmount: Int
    )

    private fun parseOfferFromText(rawText: String): ParsedOffer {
        // Implement parsing logic for offer text
        return ParsedOffer("Unknown", 0, 0, "gems", 0, 0)
    }
}
