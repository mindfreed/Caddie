import { useState, useEffect } from "react";

type Offer = {
  name: string;
  juice: number;
  avgTimeDays: number;
  completionRate: number;
  hazard: string | null;
  freeAlt: string | null;
  TPSMarkup: number;
  investmentWorth: string;
  yieldPath: string[];
  isRipCord: boolean;
  ripCordMessage: string;
  strategy: string;
};

export default function FloatingCaddie() {
  const [expanded, setExpanded] = useState(false);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (expanded) {
      setLoading(true);
      fetch("/api/top-offers")
        .then((res) => res.json())
        .then((data: Offer[]) => {
          setOffers(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [expanded]);

  const handleQA = (metric: string) => {
    if (offers[0]) {
      switch (metric) {
        case "⚡ Juice":
          alert(`Juice: ${offers[0].juice}x`);
          break;
        case "⏱ Time":
          alert(`Avg Time: ${offers[0].avgTimeDays} days`);
          break;
        case "✅ Completion":
          alert(`Completion Rate: ${offers[0].completionRate}%`);
          break;
        case "⚠ Hazard":
          alert(`Hazard: ${offers[0].hazard || "None"}`);
          break;
        case "💰 Free Alt":
          alert(`Free Alt: ${offers[0].freeAlt || "None"}`);
          break;
        case "💸 Investment Worth":
          alert(`Investment Worth: ${offers[0].investmentWorth}`);
          break;
        case "⏳ Yield Path":
          alert(`Yield Path:\n${offers[0].yieldPath.join("\n")}`);
          break;
      }
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50" data-testid="floating-caddie">
      {!expanded ? (
        <button
          className="w-12 h-12 bg-green-500 rounded-full shadow-lg hover:bg-green-600 flex items-center justify-center text-white font-bold text-xl"
          onClick={() => setExpanded(true)}
          data-testid="button-expand-caddie"
        >
          C
        </button>
      ) : (
        <div className="w-96 h-[28rem] bg-gray-900 text-white p-4 rounded-lg shadow-lg overflow-auto relative">
          <button
            className="absolute top-2 right-2 text-red-500"
            onClick={() => setExpanded(false)}
            data-testid="button-close-caddie"
          >
            ✕
          </button>

          {loading ? (
            <div data-testid="text-loading">Loading top offers...</div>
          ) : (
            offers.map((offer, idx) => (
              <div key={idx} className="p-2 border border-gray-700 rounded-md mb-2" data-testid={`card-offer-${idx}`}>
                <div className="font-bold">{offer.name}</div>
                <div>⚡ Juice: {offer.juice}x</div>
                <div>⏱ Avg Time: {offer.avgTimeDays}d</div>
                <div>✅ Completion: {offer.completionRate}%</div>
                <div>⚠ Hazard: {offer.hazard || "None"}</div>
                <div>💰 Free Alt: {offer.freeAlt || "None"}</div>
                <div>💵 TPS Markup: {offer.TPSMarkup}%</div>
                <div>💸 Investment Worth: {offer.investmentWorth}</div>
                <div>
                  ⏳ Yield Path:
                  <ul className="list-disc list-inside">
                    {offer.yieldPath.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ul>
                </div>

                {offer.isRipCord && (
                  <div className="bg-red-700 text-white p-2 rounded-md mt-2" data-testid={`ripcord-${idx}`}>
                    💀 Rip Cord Advisory: {offer.ripCordMessage}
                    <div className="flex space-x-2 mt-2">
                      <button
                        className="bg-green-500 px-2 py-1 rounded hover:bg-green-600"
                        onClick={() => alert("Continuing offer")}
                        data-testid={`button-continue-${idx}`}
                      >
                        Continue
                      </button>
                      <button
                        className="bg-gray-500 px-2 py-1 rounded hover:bg-gray-600"
                        onClick={() => alert("Skipping offer")}
                        data-testid={`button-skip-${idx}`}
                      >
                        Skip
                      </button>
                    </div>
                  </div>
                )}

                <div className="bg-gray-800 p-2 rounded-md mt-2 text-green-400">
                  🎯 Strategy: {offer.strategy}
                </div>

                <div className="flex space-x-2 mt-2 flex-wrap gap-1">
                  {["⚡ Juice", "⏱ Time", "✅ Completion", "⚠ Hazard", "💰 Free Alt", "💸 Investment Worth", "⏳ Yield Path"].map(
                    (label) => (
                      <button
                        key={label}
                        className="bg-blue-500 px-2 py-1 rounded text-white hover:bg-blue-600 text-xs"
                        onClick={() => handleQA(label)}
                        data-testid={`button-qa-${label.replace(/[^a-zA-Z]/g, '')}`}
                      >
                        {label}
                      </button>
                    )
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
