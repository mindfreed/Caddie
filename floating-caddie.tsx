import { useState, useEffect, useRef } from "react";

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
  const [status, setStatus] = useState("STANDBY");
  const [caddyStartup, setCaddyStartup] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [barHeights, setBarHeights] = useState<number[]>(Array(8).fill(0));
  const [successMode, setSuccessMode] = useState(false);
  const [successBars, setSuccessBars] = useState<boolean[]>(Array(8).fill(false));
  const [holoCoins, setHoloCoins] = useState<{id: number; x: number; y: number}[]>([]);
  const [currentFalseSummit, setCurrentFalseSummit] = useState<{ev: number, payout: number, gameData: any} | null>(null);
  const [clipboardText, setClipboardText] = useState<string | null>(null);
  const [showPlaybook, setShowPlaybook] = useState(false);
  const startupRan = useRef(false);
  const coinIdRef = useRef(0);

  const universalSnap = async () => {
    try {
      const text = await navigator.clipboard.readText();
      
      if (text && text.trim()) {
        setClipboardText(text.trim());
        setStatus(`Scouting terrain for: ${text.trim()}...`);
        
        startupRan.current = false;
        runStartupSequence();
        
        setTimeout(() => {
          analyzeGameByName(text.trim());
        }, 1000);
      } else {
        setStatus("CLIPBOARD EMPTY. COPY A GAME NAME FIRST.");
      }
    } catch (err) {
      setStatus("CLIPBOARD ACCESS DENIED. CHECK PERMISSIONS.");
    }
  };

  const analyzeGameByName = async (gameName: string) => {
    setLoading(true);
    setCurrentFalseSummit(null);
    
    const cleanTitle = gameName.toLowerCase().split('-')[0].trim();
    
    try {
      const res = await fetch(`/api/game-intel/search?q=${encodeURIComponent(cleanTitle)}`);
      const data = await res.json();
      
      const fallback = { hours: 35, success: 0.2, cliff: "Lvl 15" };
      let gameData = fallback;
      let gameTitleDisplay = gameName.toUpperCase();
      
      if (data && data.length > 0) {
        const game = data[0];
        gameData = {
          hours: game.avgCompletionHours || 35,
          success: (game.completionRate || 20) / 100,
          cliff: game.sandTraps ? JSON.parse(game.sandTraps)[0] || "Unknown" : "Unknown"
        };
        gameTitleDisplay = game.gameName?.toUpperCase() || gameName.toUpperCase();
      }
      
      const payout = 25;
      const ev = payout / gameData.hours;
      
      const newHeights = barHeights.map(() => {
        const height = (Math.random() * 40) + (ev * 5);
        return Math.min(height, 100);
      });
      setBarHeights(newHeights);
      
      if (ev > 5) {
        setSuccessBars(Array(8).fill(true));
        setStatus(`This is a Birdie! High juice, low squeeze. I'd play this one all day.`);
        triggerSuccessAnimation();
      } else if (ev < 3) {
        setSuccessBars(Array(8).fill(false));
        setStatus(`Watch out! Alliance stats show a massive cliff at ${gameData.cliff}. This hole is a trap.`);
        setCurrentFalseSummit({ ev, payout, gameData });
      } else {
        setSuccessBars(Array(8).fill(false));
        setStatus(`Standard terrain here. Methodical play will get you through the ${gameData.cliff} mark.`);
      }
    } catch (err) {
      setStatus("ALLIANCE LINK ERROR. RETRY SCAN.");
    }
    setLoading(false);
  };

  const triggerSuccessAnimation = () => {
    setSuccessMode(true);
    setStatus("BIRDIE DETECTED. ALLIANCE PROFIT SECURED.");
    
    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        setSuccessBars(prev => {
          const next = [...prev];
          next[i] = true;
          return next;
        });
      }, i * 30);
    }
    
    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        coinIdRef.current++;
        const newCoin = {
          id: coinIdRef.current,
          x: Math.random() * 280 + 30,
          y: 180
        };
        setHoloCoins(prev => [...prev, newCoin]);
        
        setTimeout(() => {
          setHoloCoins(prev => prev.filter(c => c.id !== newCoin.id));
        }, 1500);
      }, i * 150);
    }

    setTimeout(() => {
      setSuccessMode(false);
      setSuccessBars(Array(8).fill(false));
      setStatus("SYSTEM SETTLED. READY TO SCOUT.");
    }, 4000);
  };

  const runStartupSequence = () => {
    if (startupRan.current) return;
    startupRan.current = true;

    setCaddyStartup(true);
    setStatus("INITIALIZING ALLIANCE LINK...");

    setTimeout(() => {
      setStatus("MAPPING TOPOGRAPHY...");
      setScanning(true);

      const newHeights: number[] = [];
      for (let i = 0; i < 8; i++) {
        setTimeout(() => {
          newHeights[i] = Math.floor(Math.random() * 60) + 20;
          setBarHeights([...newHeights]);
        }, i * 50);
      }
    }, 1000);

    setTimeout(() => {
      setStatus("SYSTEM SETTLED. READY TO SCOUT.");
      setScanning(false);
      autoScoutTerrain();
    }, 2500);
  };

  const autoScoutTerrain = () => {
    setLoading(true);
    fetch("/api/top-offers")
      .then((res) => res.json())
      .then((data: Offer[]) => {
        setOffers(data);
        setLoading(false);
        
        if (data.length > 0) {
          const topOffer = data[0];
          const hours = topOffer.avgTimeDays * 24;
          const payout = topOffer.juice * 10;
          const hourlyEV = hours > 0 ? payout / hours : 0;
          
          if (hourlyEV >= 10) {
            triggerSuccessAnimation();
          } else if (hourlyEV < 3) {
            setStatus("WARNING: UNSTABLE TERRAIN. RIPCORD ADVISED.");
          } else {
            setStatus(`FOUND ${data.length} BIRDIES`);
          }
        } else {
          setStatus("NO OFFERS DETECTED");
        }
      })
      .catch(() => {
        setLoading(false);
        setStatus("SCAN FAILED");
      });
  };

  useEffect(() => {
    if (expanded) {
      runStartupSequence();
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
    <div className="fixed inset-0 bg-black text-white p-4 font-sans overflow-auto" data-testid="floating-caddie">
      <div id="app-interface" className="max-w-md mx-auto">
        <header className="flex flex-col items-center mb-8 pt-4">
          <div id="caddyImg" className={`caddy-sprite-container transition-all duration-500 mb-2 ${scanning ? 'scanning' : ''} ${successMode || status.includes('Birdie') ? 'birdie-mode' : ''} ${currentFalseSummit ? 'alert-mode' : ''} ${status.includes('trap') ? 'shake-effect' : ''} ${status.includes('Birdie') ? 'methodical-nod' : ''}`} />
          <h1 className="text-2xl font-bold font-mono tracking-widest uppercase">Freedmind AI</h1>
        </header>

        <section className="magic-numbers monitor-container mb-8">
            <div className="monitor-header">
                <span className="pulse-dot"></span> LIVE ALLIANCE STATS
            </div>
            <div className="magic-numbers-grid">
                <div className="stat-card">
                    <label>TRUE HOURLY</label>
                    <div id="hourly-rate" data-testid="text-live-hourly">
                      ${offers.length > 0 ? (offers[0].juice * 10 / (offers[0].avgTimeDays * 24)).toFixed(2) : (currentFalseSummit ? currentFalseSummit.ev.toFixed(2) : "0.00")}/hr
                    </div>
                </div>
                <div className="stat-card">
                    <label>TIME REFUND</label>
                    <div id="time-saved" data-testid="text-live-refund">
                      {offers.length > 0 ? (offers[0].avgTimeDays * 24).toFixed(1) : "0.0"} hrs
                    </div>
                </div>
                <div className="stat-card">
                    <label>NET PROFIT</label>
                    <div id="net-juice" data-testid="text-live-profit">
                      ${offers.length > 0 ? (offers[0].juice * 10).toFixed(2) : "0.00"}
                    </div>
                </div>
            </div>
        </section>

        <main className="space-y-4">
            <div id="caddy-call-box" className="bg-gray-900 border border-gray-800 p-4 rounded-lg min-h-[80px] flex items-center justify-center italic text-sm text-center">
                <p id="instruction" data-testid="text-caddy-instruction">
                  {status === "STANDBY" ? "\"Ready to scout. Paste an offer to begin the audit.\"" : `"${status}"`}
                </p>
            </div>

            {currentFalseSummit && (
              <div className="border-2 border-red-500 rounded-lg overflow-hidden bg-black/90 animate-in fade-in zoom-in duration-300">
                <div className="bg-red-600 text-white text-center font-bold py-1 text-sm tracking-tighter uppercase">False Summit Detected!</div>
                <div className="p-2 flex gap-3">
                  <div className="w-24 h-24 flex-shrink-0">
                    <img src="/assets/IMG_1413_1768849455411.png" alt="False Summit" className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1">
                    <div className="bg-yellow-400 text-black inline-block px-2 py-0.5 rounded text-[10px] font-bold mb-1">Caddy Call</div>
                    <div className="bg-red-900/40 border border-red-500/30 p-2 rounded text-[11px] leading-tight text-red-200">
                      Tactical Lay-Up! Final ${currentFalseSummit.payout * 30} goal requires a ${currentFalseSummit.payout * 10} buy-in. Stop at {currentFalseSummit.gameData.cliff} for ${currentFalseSummit.payout * 10} Pure Profit.
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button 
              id="snap-scan-btn" 
              className="snap-btn w-full py-4 text-lg"
              onClick={universalSnap}
              data-testid="button-snap-scan"
            >
              SNAP-SCAN OFFER
            </button>

            <div className="flex items-end gap-1 h-12 bg-gray-900 p-2 rounded" data-testid="grid-bars">
              {barHeights.map((height, i) => (
                <div
                  key={i}
                  className={`bar flex-1 bg-green-500 rounded-t transition-all ${successBars[i] ? 'bar-success' : ''}`}
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>

            <button
              onClick={() => setShowPlaybook(true)}
              className="w-full py-2 px-4 bg-transparent hover:bg-gray-800 border border-gray-700 rounded-lg text-gray-400 font-mono text-xs flex items-center justify-center gap-2 transition-all"
              data-testid="button-playbook"
            >
              📖 VIEW PLAYBOOK
            </button>

            {offers.map((offer, idx) => (
              <div 
                key={idx} 
                className={`p-2 border rounded-md mb-2 ${idx === 0 ? 'birdie-glow pulse-glow' : 'border-gray-700'}`}
                data-testid={`card-offer-${idx}`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-green-400">{offer.name}</span>
                  {idx === 0 && <span className="text-xs bg-green-500 text-black px-2 py-0.5 rounded font-bold">TOP BIRDIE</span>}
                </div>
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

                <button
                  className="w-full mt-2 bg-green-600 hover:bg-green-500 text-black font-bold py-2 rounded transition-all"
                  onClick={triggerSuccessAnimation}
                  data-testid={`button-complete-${idx}`}
                >
                  ✓ MARK COMPLETE
                </button>

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
            ))}
        </main>
      </div>

      {showPlaybook && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" data-testid="playbook-overlay">
          <div className="glass-container bg-black/90 border border-green-500/30 rounded-xl p-6 max-w-lg w-full">
            <h3 className="text-green-400 font-bold text-xl font-mono mb-2 text-center">THE CADDY'S PLAYBOOK</h3>
            <hr className="border-green-500/30 mb-4" />
            
            <div className="space-y-4">
              <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800">
                <h4 className="text-green-400 font-bold text-sm mb-2">1. DATA SOURCE</h4>
                <p className="text-gray-400 text-sm">Powered by <span className="text-green-400 font-bold">Alliance Stats</span>. Live crowdsourced difficulty peaks updated every 24h.</p>
              </div>
              
              <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800">
                <h4 className="text-green-400 font-bold text-sm mb-2">2. SNAP-SCAN</h4>
                <p className="text-gray-400 text-sm">Copy a game title from <span className="text-green-400 font-bold">Freecash, KashKick, or Swagbucks</span> and hit Snap-Scan.</p>
              </div>
              
              <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800">
                <h4 className="text-green-400 font-bold text-sm mb-2">3. THE CALL</h4>
                <p className="text-gray-400 text-sm">Follow the <span className="text-green-400 font-bold">Elevation Grid</span>. Green = Birdie. Red = Pull the Ripcord.</p>
              </div>
            </div>
            
            <a
              href="/freedmind-ai-caddy.tar.gz"
              download="freedmind-ai-caddy.tar.gz"
              className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2"
              data-testid="button-download"
            >
              📦 DOWNLOAD FULL PACKAGE
            </a>
            
            <button
              onClick={() => setShowPlaybook(false)}
              className="w-full mt-2 py-3 bg-green-600 hover:bg-green-500 text-black font-bold rounded-lg transition-all"
              data-testid="button-acknowledge"
            >
              ACKNOWLEDGED
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
