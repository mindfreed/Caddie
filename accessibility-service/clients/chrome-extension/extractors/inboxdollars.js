// InboxDollars Offer Extractor - CANONICAL PAYLOAD FORMAT
function extractInboxDollarsOffers() {
  const offerCards = document.querySelectorAll('.offer-card, .activity-card, .earn-activity');
  
  const offers = Array.from(offerCards).map(card => {
    const titleEl = card.querySelector('.activity-title, .offer-name, h3');
    const payoutEl = card.querySelector('.earnings, .payout, .reward-amount');
    const timeEl = card.querySelector('.time-estimate, .duration');
    
    const payoutText = payoutEl?.textContent?.trim() || '$0';
    const payoutCents = parseFloat(payoutText.replace(/[^0-9.]/g, '')) * 100;
    
    const timeText = timeEl?.textContent?.trim() || '';
    const estimatedMins = parseInt(timeText.replace(/[^0-9]/g, '')) || 30;
    
    // CANONICAL PAYLOAD FORMAT
    return {
      platform: "web",
      source: "inboxdollars",
      game: titleEl?.textContent?.trim() || "Unknown Offer",
      level: 0,
      offer: {
        priceCents: 0,
        resourceType: "cash",
        baseAmount: Math.round(payoutCents),
        bonusAmount: 0
      },
      session: {
        velocity: payoutCents / estimatedMins / 100,
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
  const offers = extractInboxDollarsOffers();
  sendOffers(offers);
}, 10000);
