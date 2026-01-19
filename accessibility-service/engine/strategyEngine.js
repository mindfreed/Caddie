function synthesizeStrategy(analysis, context) {
  if (analysis.isHazard) {
    return {
      decision: "REJECT",
      reason: `${analysis.markupPercent}% markup vs grind`,
      action: "Execute free resource loop",
      exitCondition: `Reassess after phase: ${context.phase}`
    };
  }

  return {
    decision: "OPTIONAL",
    reason: "Within acceptable grind range",
    action: "Purchase only if time-constrained",
    exitCondition: "Stop on velocity drop"
  };
}

module.exports = { synthesizeStrategy };
