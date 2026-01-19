const express = require("express");
const app = express();

const { analyzeOffer } = require("./engine/hazardEngine");
const { synthesizeStrategy } = require("./engine/strategyEngine");
const grindAverages = require("./data/grindAverages");

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "Strategic Gamer's Caddie online" });
});

app.post("/analyze-offer", (req, res) => {
  const { game, offer, session } = req.body;

  if (!grindAverages[game] || !grindAverages[game][offer.resourceType]) {
    return res.status(400).json({ error: "Unsupported game or resource" });
  }

  const grindAverage = grindAverages[game][offer.resourceType];

  const analysis = analyzeOffer(offer, grindAverage);
  const strategy = synthesizeStrategy(analysis, session);

  res.json({
    analysis,
    strategy
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
