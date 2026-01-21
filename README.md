# Freedmind AI Caddy - Complete Source Package

## What's Included

| File | Purpose |
|------|---------|
| floating-caddie.tsx | Main React component with Snap-Scan, Alliance integration, and animations |
| index.css | Full styling including tactical glow effects, animations, and dark theme |
| manifest.json | PWA configuration for iOS/Android home screen install |
| caddy-core.js | Standalone JavaScript module for external integration |
| index.html | Entry point with PWA meta tags |
| alliance_stats.json | Pre-loaded game database (16 games) |
| routes.ts | Backend API routes for game intel and Alliance stats |
| caddy-mascot.png | App icon/mascot image |
| QUICK_START_GUIDE.md | User-facing installation guide |

## Key Features

### 1. Universal Snap-Scan
Copy any game title from offer walls (Freecash, KashKick, Swagbucks) and the Caddy instantly analyzes it.

### 2. Live Alliance Stats Dashboard
- TRUE HOURLY: Real $/hr EV based on 48-hour grind averages
- TIME REFUND: Hours saved from avoiding bad offers
- NET PROFIT: Calculated summit profit

### 3. Tactical Alerts
- Birdie Mode: Green glow when EV > $5/hr
- False Summit Alert: Red warning when game has hidden cliffs
- Ripcord Advisory: Stop recommendation when EV drops below $3/hr

### 4. PWA Installation
Full standalone mobile app experience with:
- iOS Safari "Add to Home Screen" support
- Android Chrome installable
- No browser chrome (standalone display)

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| /api/alliance-stats | GET | Full playbook JSON |
| /api/game-intel/search?q=query | GET | Search with Alliance fallback |
| /api/game-intel/:packageName | GET | Specific game lookup |
| /api/top-offers | GET | Current top-rated offers |

## Deployment

1. Deploy to any Node.js host (Replit, Vercel, etc.)
2. Ensure PostgreSQL database is connected
3. Run database migrations
4. Set environment variables

---
Freedmind AI Caddy - Strategic Intelligence for Mobile Gamers
