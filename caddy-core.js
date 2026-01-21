/**
 * FREEDMIND AI - CADDY MASTER CORE
 * Optimized for Universal OS & Minimal Stall
 */

const CaddyCore = {
    stats: {},

    async init() {
        try {
            const response = await fetch('/api/alliance-stats');
            this.stats = await response.json();
            console.log("Caddy: Alliance Stats Loaded.", Object.keys(this.stats).length, "games");
        } catch (e) {
            console.error("Caddy: Failed to link to Alliance.");
        }
    },

    async runSnapScan() {
        try {
            const rawText = await navigator.clipboard.readText();
            const gameTitle = rawText.toLowerCase().trim();
            
            const scoutReport = this.stats[gameTitle];

            if (scoutReport) {
                this.deployAnalysis(gameTitle, scoutReport);
            } else {
                this.handleUnknown(gameTitle);
            }
        } catch (err) {
            alert("Please allow clipboard access for the Caddy Scout.");
        }
    },

    deployAnalysis(title, data) {
        const status = document.getElementById('status');
        const aiText = document.getElementById('aiText');
        const bars = document.querySelectorAll('.bar');

        if (typeof startupSequence === 'function') {
            startupSequence();
        }

        setTimeout(() => {
            if (status) status.innerText = `SCOUTING COMPLETE: ${title.toUpperCase()}`;
            if (aiText) {
                aiText.innerHTML = `
                    <b>ALLIANCE CALL:</b> ${data.risk === 'low' ? 'BIRDIE' : 'RIPCORD'}<br>
                    <b>CLIFF DETECTED:</b> ${data.cliff}<br>
                    <b>EST. RETURN:</b> $${data.ev}/hr
                `;
            }

            bars.forEach((bar, i) => {
                const height = data.risk === 'low' ? (20 + i * 10) : (80 - i * 10);
                bar.style.height = height + "%";
                bar.style.background = data.risk === 'low' ? "#00FF41" : "#ff3333";
            });

            if (data.ev > 2 && typeof triggerBirdieVictory === 'function') {
                triggerBirdieVictory();
            } else {
                const caddy = document.getElementById('caddyImg');
                if (caddy) caddy.classList.add('caddy-success');
            }

        }, 1200);
    },

    handleUnknown(title) {
        const status = document.getElementById('status');
        const aiText = document.getElementById('aiText');
        
        if (status) status.innerText = "TERRAIN UNKNOWN";
        if (aiText) aiText.innerText = `The Alliance hasn't scouted "${title}" yet. Proceed with caution.`;
    },

    initGhostMode() {
        const icon = document.getElementById('caddy-icon');
        const briefing = document.getElementById('caddy-briefing');

        if (icon && briefing) {
            icon.addEventListener('click', () => {
                const isHidden = briefing.style.display === 'none' || !briefing.classList.contains('active');
                
                if (isHidden) {
                    briefing.classList.add('active');
                    briefing.style.display = 'block';
                    this.runSnapScan();
                } else {
                    briefing.classList.remove('active');
                    briefing.style.display = 'none';
                }
            });

            document.addEventListener('click', (e) => {
                if (!icon.contains(e.target) && !briefing.contains(e.target)) {
                    briefing.classList.remove('active');
                    briefing.style.display = 'none';
                }
            });

            console.log("Caddy: Ghost Mode Activated");
        }
    }
};

window.addEventListener('load', () => {
    CaddyCore.init();
    CaddyCore.initGhostMode();
});
