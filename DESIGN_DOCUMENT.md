# strategicGamaerz caddie - Design Document

## Overview
A strategic intelligence companion app for mobile gamers. Provides real-time analysis, offer evaluation, and tactical guidance to help players make informed decisions.

---

## Core Features

### 1. Game Intel Analysis
- **Sanction Status**: Games are classified as "Sanctioned" (recommended) or "No Play" (not recommended)
- **Pace of Play**: Expected timeline to reach milestones (e.g., "25-30 Days to Level 100+")
- **Reality Check**: Clinical assessment of progression probability using phrases like "High probability. Linear progression until level 25."

### 2. Sand Traps (Hazard Warnings)
Identifies in-game pitfalls at specific levels:
- **Level-based warnings** with severity levels
- **Types**: Cost-Spike, Stall-Point, Resource-Drain, House-Rake, Bonus-Lock
- **Notes**: Detailed explanations (e.g., "Village costs double. Velocity drops 40%.")

### 3. Suggested Clubs (Free Alternatives)
Recommends strategies at each game stage:
- **Stage**: When to use (Early, Mid, Level 10, etc.)
- **Club**: The strategy or resource (e.g., "FB Daily Spin Link")
- **Cost**: Clearly labeled as "Free" or specific price

### 4. Offer Evaluation System (HAZARD Detection)
**Rule**: Compare cost-per-resource against the 48-hour grind average. If > 20% markup, label as HAZARD.

For each in-game purchase offer:
- Calculates **Cost Per Resource**
- Compares against **48-Hour Grind Average**
- Shows **Markup Percentage**
- Labels offers with >20% markup as **HAZARD** with warning message

### 5. Marshal Monitor
- Tracks pace of play in real-time
- Issues "Marshal Corrections" if activity stalls
- Configurable threshold (default: 5 seconds for demo)

### 6. Floating Caddy
- Persistent UI element with quick access
- Clinical status messages (no conversational fluff)
- Minimizes to "ghost state" after briefing acknowledgment

---

## Design Principles

### Clinical Tone
All messaging uses direct, data-driven language:
- "High probability. Linear progression."
- "ALLIANCE STATS: TARGET ACQUIRED"
- "NO PLAY RECOMMENDED"

### Visual Theme
- **Dark cyberpunk aesthetic**
- **Neon green primary** (#00ff80) for sanctioned/positive
- **Red/destructive** for warnings and hazards
- **Purple secondary** accent
- Scanline effects and glowing borders

---

## Data Model

### GameIntel
| Field | Type | Description |
|-------|------|-------------|
| packageName | text | Android package identifier |
| gameName | text | Display name |
| isSanctioned | boolean | Recommended status |
| paceOfPlay | text | Timeline assessment |
| realityCheck | text | Probability analysis |
| sandTraps | JSON | Array of hazard warnings |
| suggestedClubs | JSON | Array of free strategies |
| offers | JSON | Array of in-game purchases |

### Offer Structure
```json
{
  "id": "unique-id",
  "name": "Spin Bundle",
  "resourceAmount": 100,
  "priceCents": 499,
  "grindAverage48h": 3.0
}
```

### Offer Evaluation Output
```json
{
  "costPerResource": 4.99,
  "grindAverageCost": 3.0,
  "markupPercent": 66.3,
  "isHazard": true
}
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/game-intel | List all games |
| GET | /api/game-intel/:packageName | Get specific game intel |
| POST | /api/game-intel | Add new game |
| PATCH | /api/game-intel/:id | Update game |
| DELETE | /api/game-intel/:id | Remove game |

---

## Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **UI Components**: shadcn/ui component library

---

## Sample Games Included

1. **Coin Master** (Sanctioned)
   - Pace: 25-30 Days to Level 100+
   - Sand Traps: Cost-Spike at Level 26, Stall-Point at Level 80
   - Free Strategy: FB Daily Spin Link

2. **Dice Dreams** (Sanctioned)
   - Pace: 10-15 Days to Kingdom 25
   - Sand Traps: Resource-Drain at Level 17

3. **Solitaire Cash** (No Play)
   - Risk: House-Rake 30%, Bonus-Lock on cash
