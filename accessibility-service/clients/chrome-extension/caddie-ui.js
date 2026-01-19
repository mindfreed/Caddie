// Caddie UI - Cost-Efficient Trigger Logic
// Icon always visible, API calls only on user interaction

function initCaddieUI() {
  const styles = document.createElement('style');
  styles.textContent = `
    #caddie-floating {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border: 2px solid #0f3460;
      border-radius: 50%;
      cursor: pointer;
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    #caddie-floating:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 16px rgba(0,0,0,0.4);
    }
    #caddie-floating.ghost-mode {
      opacity: 0.3;
    }
    #caddie-floating.ghost-mode:hover {
      opacity: 1;
    }
    #caddie-floating svg {
      width: 24px;
      height: 24px;
      fill: #e94560;
    }
    #caddie-panel {
      position: fixed;
      bottom: 80px;
      right: 20px;
      width: 320px;
      max-height: 400px;
      background: #1a1a2e;
      border: 1px solid #0f3460;
      border-radius: 8px;
      z-index: 999998;
      display: none;
      overflow: hidden;
      box-shadow: 0 8px 24px rgba(0,0,0,0.4);
    }
    #caddie-panel-header {
      background: #0f3460;
      padding: 12px;
      color: #e94560;
      font-family: monospace;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    #caddie-panel-content {
      padding: 12px;
      color: #a0a0a0;
      font-family: monospace;
      font-size: 11px;
      max-height: 340px;
      overflow-y: auto;
    }
    .caddie-offer {
      background: #16213e;
      border-radius: 4px;
      padding: 10px;
      margin-bottom: 10px;
    }
    .caddie-hazard { border-left: 3px solid #e94560; }
    .caddie-clear { border-left: 3px solid #4ade80; }
    .caddie-title {
      font-size: 11px;
      font-weight: bold;
      color: #fff;
      margin-bottom: 6px;
    }
    .caddie-stat {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      margin-bottom: 3px;
      color: #a0a0a0;
    }
    .caddie-stat-value { color: #e0e0e0; }
    .caddie-hazard-warn { color: #e94560; font-size: 10px; margin: 4px 0; }
    .caddie-free-alt { color: #4ade80; font-size: 10px; margin: 4px 0; }
    .caddie-strategy {
      font-size: 10px;
      color: #60a5fa;
      font-style: italic;
      margin-top: 6px;
      padding-top: 6px;
      border-top: 1px solid #0f3460;
    }
  `;
  document.head.appendChild(styles);

  const icon = document.createElement('div');
  icon.id = 'caddie-floating';
  icon.innerHTML = `<svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`;
  document.body.appendChild(icon);

  const panel = document.createElement('div');
  panel.id = 'caddie-panel';
  panel.innerHTML = `
    <div id="caddie-panel-header">
      GAMERGUIDE AI CADDIE
      <span id="caddie-dismiss" style="float:right;cursor:pointer;opacity:0.6;">✕</span>
    </div>
    <div id="caddie-panel-content">Click to analyze visible offers...</div>
  `;

  panel.querySelector('#caddie-dismiss').addEventListener('click', (e) => {
    e.stopPropagation();
    acknowledgePanel();
  });
  document.body.appendChild(panel);

  icon.style.display = 'block';

  icon.addEventListener('click', async () => {
    const iconEl = document.getElementById('caddie-floating');
    const panelEl = document.getElementById('caddie-panel');
    
    iconEl.classList.remove('ghost-mode');
    
    if (panelEl.style.display === 'block') {
      panelEl.style.display = 'none';
    } else {
      panelEl.style.display = 'block';
      await fetchTopOffersAndAnalysis();
    }
  });
}

function acknowledgePanel() {
  const panel = document.getElementById('caddie-panel');
  panel.style.display = 'none';
  const icon = document.getElementById('caddie-floating');
  icon.classList.add('ghost-mode');
}

async function fetchTopOffersAndAnalysis() {
  const content = document.getElementById('caddie-panel-content');
  content.innerHTML = 'Scanning offers...';

  const offers = extractVisibleOffers();
  if (offers.length === 0) {
    content.innerHTML = 'No offers detected on this page.';
    return;
  }

  const results = await Promise.all(offers.map(analyzeOffer));
  
  content.innerHTML = results.map(r => {
    const juice = (r.analysis.grindAverageCost / r.analysis.costPerUnit).toFixed(1);
    const avgDays = Math.round(30 / (r.session?.velocity || 1));
    const completion = Math.round(85 - r.analysis.markupPercent);
    const hazardText = r.analysis.isHazard ? `Level ${r.level || 26} Cost-Spike` : 'none';
    const freeAlt = r.analysis.isHazard ? 'FB Daily Spin' : 'Daily Spin';
    const markup = r.analysis.markupPercent > 0 ? `+${r.analysis.markupPercent}%` : '0%';
    
    return `
    <div class="caddie-offer ${r.analysis.isHazard ? 'caddie-hazard' : 'caddie-clear'}">
      <div class="caddie-title">${r.game}</div>
      <div class="caddie-stat"><span>Juice:</span><span class="caddie-stat-value">${juice}x</span></div>
      <div class="caddie-stat"><span>Avg Time:</span><span class="caddie-stat-value">${avgDays} days</span></div>
      <div class="caddie-stat"><span>Completion:</span><span class="caddie-stat-value">${Math.max(0, completion)}%</span></div>
      <div class="caddie-stat"><span>TPS:</span><span class="caddie-stat-value">${markup} markup</span></div>
      ${r.analysis.isHazard ? `<div class="caddie-hazard-warn">Hazard: ${hazardText}</div>` : ''}
      <div class="caddie-free-alt">Free Alt: ${freeAlt}</div>
      <div class="caddie-strategy">"${r.strategy.action}"</div>
    </div>
  `;
  }).join('');
}

function extractVisibleOffers() {
  const offerElements = document.querySelectorAll('.offer-card, [data-offer], .earn-card');
  return Array.from(offerElements).slice(0, 5).map(el => ({
    platform: "web",
    source: window.location.hostname,
    game: el.dataset.game || el.querySelector('h3, h4, .title')?.textContent?.trim() || "Unknown",
    level: parseInt(el.dataset.level) || 0,
    offer: {
      priceCents: parseInt(el.dataset.priceCents) || 0,
      resourceType: el.dataset.resourceType || "gems",
      baseAmount: parseInt(el.dataset.baseAmount) || 100,
      bonusAmount: parseInt(el.dataset.bonusAmount) || 0
    },
    session: {
      velocity: 1.0,
      phase: "Mid"
    }
  }));
}

async function analyzeOffer(offer) {
  try {
    const res = await fetch("https://YOUR_REPLIT_URL/api/analyze-offer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(offer)
    });
    const data = await res.json();
    return { ...data, game: offer.game };
  } catch (e) {
    return {
      game: offer.game,
      analysis: { isHazard: false, classification: "ERROR", markupPercent: 0 },
      strategy: { action: "Unable to analyze" }
    };
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCaddieUI);
} else {
  initCaddieUI();
}
