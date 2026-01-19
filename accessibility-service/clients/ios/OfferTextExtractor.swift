import SwiftUI
import Vision
import AVFoundation

struct ParsedOffer {
    let gameName: String
    let level: Int
    let priceCents: Int
    let resourceType: String
    let baseAmount: Int
    let bonusAmount: Int
}

func parseOfferFromText(_ rawText: String) -> ParsedOffer {
    // Implement parsing logic for offer text
    return ParsedOffer(gameName: "Unknown", level: 0, priceCents: 0, resourceType: "gems", baseAmount: 0, bonusAmount: 0)
}

func extractTextFromScreen(sampleBuffer: CMSampleBuffer, source: String) {
    guard let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else { return }
    
    let requestHandler = VNImageRequestHandler(cvPixelBuffer: pixelBuffer, options: [:])
    let request = VNRecognizeTextRequest { (request, error) in
        guard let observations = request.results as? [VNRecognizedTextObservation] else { return }
        
        let extractedText = observations.compactMap { $0.topCandidates(1).first?.string }.joined(separator: " ")
        let parsed = parseOfferFromText(extractedText)
        
        // CANONICAL PAYLOAD FORMAT
        let payload: [String: Any] = [
            "platform": "ios",
            "source": source,
            "game": parsed.gameName,
            "level": parsed.level,
            "offer": [
                "priceCents": parsed.priceCents,
                "resourceType": parsed.resourceType,
                "baseAmount": parsed.baseAmount,
                "bonusAmount": parsed.bonusAmount
            ],
            "session": [
                "velocity": 1.0,
                "phase": "Mid"
            ]
        ]
        sendToBackend(payload)
    }
    
    try? requestHandler.perform([request])
}

func sendToBackend(_ payload: [String: Any]) {
    guard let url = URL(string: "https://YOUR_REPLIT_URL/api/analyze-offer") else { return }
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.httpBody = try? JSONSerialization.data(withJSONObject: payload)
    
    URLSession.shared.dataTask(with: request).resume()
}
