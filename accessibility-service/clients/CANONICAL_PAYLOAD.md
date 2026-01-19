# Canonical Payload Format

All cross-platform clients MUST send payloads in this exact format to `/api/analyze-offer`.

## Required Fields

```json
{
  "platform": "android" | "ios" | "web",
  "source": "game_package_name" | "freecash" | "inboxdollars" | "custom",
  "game": "Game Title",
  "level": 10,
  "offer": {
    "priceCents": 499,
    "resourceType": "gems" | "coins" | "energy" | "cash",
    "baseAmount": 100,
    "bonusAmount": 20
  },
  "session": {
    "velocity": 0.8,
    "phase": "Early" | "Mid" | "Late" | "Endgame"
  }
}
```

## Field Definitions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `platform` | string | Yes | Client platform: `android`, `ios`, or `web` |
| `source` | string | Yes | Package name, site name, or identifier |
| `game` | string | Yes | Human-readable game/offer title |
| `level` | integer | Yes | Current player level (0 if unknown) |
| `offer.priceCents` | integer | Yes | Cost in cents (0 for free offers) |
| `offer.resourceType` | string | Yes | Type of resource being offered |
| `offer.baseAmount` | integer | Yes | Base resource amount |
| `offer.bonusAmount` | integer | No | Bonus amount (default: 0) |
| `session.velocity` | float | Yes | Progress rate (0.0 - 2.0) |
| `session.phase` | string | Yes | Progression phase |

## Response Format

```json
{
  "analysis": {
    "costPerUnit": 4.16,
    "grindAverageCost": 3.0,
    "markupPercent": 38.7,
    "isHazard": true,
    "classification": "HAZARD" | "CLEAR"
  },
  "strategy": {
    "decision": "REJECT" | "ACCEPT" | "DEFER",
    "reason": "38.7% markup vs grind",
    "action": "Execute free resource loop",
    "exitCondition": "Reassess after phase: Mid"
  }
}
```
