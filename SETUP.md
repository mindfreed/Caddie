# strategicGamerz Caddie - Local Setup Guide

## Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

## Quick Start

### 1. Clone/Download the Project

Download all files from the Replit project or clone the repository.

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

Create a PostgreSQL database:

```sql
CREATE DATABASE caddie_db;
```

### 4. Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/caddie_db
```

### 5. Push Database Schema

```bash
npm run db:push
```

### 6. Start the Application

```bash
npm run dev
```

The app will be available at `http://localhost:5000`

## API Endpoints

### Offer Analysis
- `POST /api/analyze-offer` - Analyze a game offer for hazards

### Top Offers
- `GET /api/top-offers` - Get top 3 offers with briefing data
- `POST /api/offers` - Create a new offer

### Game Intel
- `GET /api/game-intel` - Get all game intelligence
- `GET /api/game-intel/:packageName` - Get intel for specific game
- `POST /api/game-intel` - Create game intel entry
- `PATCH /api/game-intel/:id` - Update game intel
- `DELETE /api/game-intel/:id` - Delete game intel

### Public API
- `GET /api/public/game-intel` - Public game intel list
- `GET /api/public/game-intel/:packageName` - Public specific game intel

## Cross-Platform Clients

### Chrome Extension
Located in `accessibility-service/clients/chrome-extension/`

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `chrome-extension` folder
5. Update `YOUR_REPLIT_URL` in the JS files with your server URL

### Android Accessibility Service
Located in `accessibility-service/clients/android/`

Reference implementation for reading game offers on Android.

### iOS Vision Framework
Located in `accessibility-service/clients/ios/`

Reference implementation for OCR-based offer detection on iOS.

## Canonical Payload Format

All clients must send payloads in this format:

```json
{
  "platform": "android|ios|web",
  "source": "package_name_or_site",
  "game": "Game Title",
  "level": 10,
  "offer": {
    "priceCents": 499,
    "resourceType": "gems",
    "baseAmount": 100,
    "bonusAmount": 20
  },
  "session": {
    "velocity": 0.8,
    "phase": "Early|Mid|Late|Endgame"
  }
}
```

## Project Structure

```
├── client/                    # React frontend
│   └── src/
│       ├── components/        # UI components
│       │   ├── floating-caddie.tsx
│       │   ├── caddy-briefing.tsx
│       │   └── marshal-monitor.tsx
│       └── pages/
├── server/                    # Express backend
│   ├── routes.ts              # API routes
│   ├── storage.ts             # Database operations
│   └── db.ts                  # Drizzle connection
├── shared/
│   └── schema.ts              # Database schema
├── accessibility-service/     # Standalone analysis service
│   ├── clients/               # Cross-platform clients
│   └── engine/                # Hazard detection engine
└── package.json
```
