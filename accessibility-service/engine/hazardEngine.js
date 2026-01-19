function analyzeOffer(offer, grindAverage) {
  const totalAmount = offer.baseAmount + (offer.bonusAmount || 0);
  const costPerUnit = offer.priceCents / totalAmount;
  const markupPercent = ((costPerUnit - grindAverage) / grindAverage) * 100;
  const isHazard = markupPercent > 20;

  return {
    costPerUnit: parseFloat(costPerUnit.toFixed(2)),
    grindAverageCost: grindAverage,
    markupPercent: parseFloat(markupPercent.toFixed(1)),
    isHazard,
    classification: isHazard ? "HAZARD" : "CLEAR"
  };
}

module.exports = { analyzeOffer };
