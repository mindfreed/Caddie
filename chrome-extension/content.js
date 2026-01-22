// Freedmind AI Caddy - Chrome Extension Content Script
(function() {
    const API_BASE = 'https://freedski42.replit.app';
    
    let allianceStats = {};
    let isEngaged = false;
    let currentGame = null;
    let currentStats = null;

    // Load Alliance Stats
    fetch(`${API_BASE}/api/alliance-stats`)
        .then(res => res.json())
        .then(data => {
            allianceStats = data;
            console.log('Caddy: Alliance linked.', Object.keys(data).length, 'games loaded.');
        })
        .catch(e => console.error('Caddy: Alliance connection failed.'));

    // Create overlay HTML
    const overlay = document.createElement('div');
    overlay.id = 'caddy-overlay';
    overlay.innerHTML = `
        <div id="caddy-bubble">
            <h2>Eyes On Target</h2>
            <p id="caddy-text">OVERSIGHT ACTIVE. GRID SECURE. TAP TO ACQUIRE TARGET.</p>
            <div id="caddy-offer-input">
                <input type="number" id="caddy-offer-amount" placeholder="Offer $">
                <button id="caddy-calc-btn">CALC</button>
            </div>
            <div class="stat-row">
                <span id="caddy-risk">THREAT: --</span>
                <span id="caddy-ev">VALUE: --</span>
            </div>
        </div>
        <div id="caddy-icon"></div>
    `;
    document.body.appendChild(overlay);

    const icon = document.getElementById('caddy-icon');
    const bubble = document.getElementById('caddy-bubble');
    const text = document.getElementById('caddy-text');
    const riskStat = document.getElementById('caddy-risk');
    const evStat = document.getElementById('caddy-ev');
    const offerInput = document.getElementById('caddy-offer-input');
    const offerAmount = document.getElementById('caddy-offer-amount');
    const calcBtn = document.getElementById('caddy-calc-btn');

    icon.addEventListener('click', toggleIntel);
    calcBtn.addEventListener('click', recalculate);

    function toggleIntel() {
        isEngaged = !isEngaged;
        
        if (isEngaged) {
            icon.classList.add('engaged');
            bubble.classList.add('active');
            runSnapScan();
        } else {
            icon.classList.remove('engaged');
            bubble.classList.remove('active');
            bubble.classList.remove('alert-state');
            offerInput.style.display = 'none';
        }
    }

    async function runSnapScan() {
        text.innerText = "Scanning...";
        riskStat.innerText = "THREAT: --";
        evStat.innerText = "VALUE: --";
        bubble.classList.remove('alert-state');
        offerInput.style.display = 'none';
        
        try {
            const rawText = await navigator.clipboard.readText();
            const gameTitle = rawText.toLowerCase().trim();
            currentGame = rawText;
            
            setTimeout(() => {
                const scoutReport = allianceStats[gameTitle];
                currentStats = scoutReport;
                
                if (scoutReport) {
                    const isRisky = scoutReport.risk === 'high';
                    const isMed = scoutReport.risk === 'med';
                    
                    if (isRisky) {
                        text.innerHTML = `<b>${rawText.toUpperCase()}</b><br>Hold. High drag at <b>${scoutReport.cliff}</b>. Not worth your time.`;
                        bubble.classList.add('alert-state');
                    } else if (isMed) {
                        text.innerHTML = `<b>${rawText.toUpperCase()}</b><br>Proceed with caution. Watch for slowdown at <b>${scoutReport.cliff}</b>.`;
                    } else {
                        text.innerHTML = `<b>${rawText.toUpperCase()}</b><br>Clean shot. Push through <b>${scoutReport.cliff}</b> and collect.`;
                    }
                    riskStat.innerText = `THREAT: ${scoutReport.risk.toUpperCase()}`;
                    evStat.innerText = `VALUE: $${scoutReport.ev}/hr`;
                    offerInput.style.display = 'block';
                } else {
                    text.innerHTML = `<b>${rawText.toUpperCase()}</b><br>No intel. Uncharted. Proceed at own risk.`;
                    riskStat.innerText = "THREAT: ???";
                    evStat.innerText = "VALUE: --";
                }
            }, 600);
        } catch (err) {
            text.innerText = "Need clipboard access. Check permissions.";
        }
    }

    function recalculate() {
        const offer = parseFloat(offerAmount.value);
        if (!offer || !currentStats || !currentGame) return;
        
        const hours = currentStats.hours || 30;
        const customEV = (offer / hours).toFixed(2);
        
        let verdict = '';
        let threat = 'LOW';
        bubble.classList.remove('alert-state');
        
        if (customEV < 0.50) {
            verdict = `$${offer} for ${hours}hrs? That's $${customEV}/hr. Hard pass.`;
            threat = 'HIGH';
            bubble.classList.add('alert-state');
        } else if (customEV < 1.00) {
            verdict = `$${offer} = $${customEV}/hr over ${hours}hrs. Marginal. Only if idle time.`;
            threat = 'MED';
        } else {
            verdict = `$${offer} = $${customEV}/hr over ${hours}hrs. Solid rate. Execute.`;
            threat = 'LOW';
        }
        
        text.innerHTML = `<b>${currentGame.toUpperCase()}</b><br>${verdict}`;
        riskStat.innerText = `THREAT: ${threat}`;
        evStat.innerText = `VALUE: $${customEV}/hr`;
    }

    console.log('Freedmind AI Caddy deployed. Standing by.');
})();
