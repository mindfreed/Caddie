// content.js - CANONICAL PAYLOAD FORMAT
function extractOffers() {
  const offerElements = document.querySelectorAll(".offer-card");
  const offers = Array.from(offerElements).map(el => {
    // CANONICAL PAYLOAD FORMAT
    return {
      platform: "web",
      source: window.location.hostname,
      game: el.dataset.game || "Unknown",
      level: parseInt(el.dataset.level) || 0,
      offer: {
        priceCents: parseInt(el.dataset.priceCents) || 0,
        resourceType: el.dataset.resourceType || "gems",
        baseAmount: parseInt(el.dataset.baseAmount) || 0,
        bonusAmount: parseInt(el.dataset.bonusAmount) || 0
      },
      session: {
        velocity: 1.0,
        phase: "Mid"
      }
    };
  });

  offers.forEach(offer => {
    fetch("https://YOUR_REPLIT_URL/api/analyze-offer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(offer)
    });
  });
}

setInterval(extractOffers, 5000);
