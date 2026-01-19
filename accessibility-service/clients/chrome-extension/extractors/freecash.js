// Freecash Offer Extractor - CANONICAL PAYLOAD FORMAT
function extractFreecashOffers() {
  const offerCards = document.querySelectorAll('[data-testid="offer-card"], .offer-item, .earn-card');
  
  const offers = Array.from(offerCards).map(card => {
    const titleEl = card.querySelector('.offer-title, h3, h4');
    const payoutEl = card.querySelector('.payout, .reward, .coins, [data-testid="payout"]');
    
    const payoutText = payoutEl?.textContent?.trim() || '0';
    const payoutCents = parseFloat(payoutText.replace(/[^0-9.]/g, '')) * 100;
    
    // CANONICAL PAYLOAD FORMAT
    return {
      platform: "web",
      source: "freecash",
      game: titleEl?.textContent?.trim() || "Unknown Offer",
      level: 0,
      offer: {
        priceCents: 0,
        resourceType: "cash",
        baseAmount: Math.round(payoutCents),
        bonusAmount: 0
      },
      session: {
        velocity: 1.0,
        phase: "Early"
      }
    };
  });

  return offers.filter(o => o.offer.baseAmount > 0);
}

function sendOffers(offers) {
  if (offers.length === 0) return;
  
  offers.forEach(offer => {
    fetch("https://YOUR_REPLIT_URL/api/analyze-offer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(offer)
    });
  });
}

setInterval(() => {
  const offers = extractFreecashOffers();
  sendOffers(offers);
}, 10000);
