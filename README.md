# Questboard Mobile

React Native port of [Questboard](https://github.com/thillygooth/questboard) — a gamified family chore tracker with pixel art RPG aesthetics. Family members pick heroes, battle daily monsters by completing chores, earn gold, and spend it on rewards.

## Stack

- React Native 0.76 (bare CLI, no Expo)
- TypeScript
- React Navigation 6 (bottom tabs)
- `@op-engineering/op-sqlite` — local SQLite cache for offline use
- `react-native-mmkv` — key-value settings storage
- React Context — no Redux
- FastAPI backend with WebSocket support for real-time family sync

## Features

- **Player profiles** — up to 6 family members, each with a hero class
- **Chore system** — daily/weekly/monthly chores with party and solo modes
- **Monster combat** — complete chores to deal damage; earn gold when the monster is defeated
- **Dungeon mode** — BSP-generated dungeon maps with D-pad navigation, loot, traps, and floor progression
- **Rewards shop** — redeem gold for real-world rewards
- **History log** — track monster kills and reward redemptions
- **Real-time sync** — WebSocket pushes state to all family devices instantly
- **Offline mode** — SQLite cache serves last-known state when server is unreachable

## Project Structure

```
questboard-mobile/
├── src/
│   ├── game/
│   │   ├── data.js          Game data (chores, monsters, rewards, classes)
│   │   └── logic.js         Pure JS game engine (dungeon gen, XP, badges, etc.)
│   ├── api/
│   │   └── client.ts        REST + WebSocket client with auto-reconnect
│   ├── storage/
│   │   └── db.ts            SQLite cache via op-sqlite
│   ├── context/
│   │   └── GameContext.tsx  Global state, sync logic, game actions
│   ├── navigation/
│   │   └── Navigator.tsx    Bottom tab + stack navigator
│   ├── screens/
│   │   ├── HomeScreen.tsx      Main game view (player card + chore grid)
│   │   ├── DungeonScreen.tsx   Dungeon map exploration
│   │   ├── RewardsScreen.tsx   Reward shop
│   │   ├── HistoryScreen.tsx   Activity log
│   │   └── SettingsScreen.tsx  Server config + player management
│   ├── components/
│   │   ├── PlayerCard.tsx    Hero stats + monster HP bar
│   │   ├── ChoreGrid.tsx     Tappable chore cards
│   │   ├── MonsterSprite.tsx Animated sprite from server or emoji fallback
│   │   ├── DungeonMap.tsx    Tile-based dungeon with D-pad
│   │   ├── TileSprite.tsx    Individual tilemap tile renderer
│   │   ├── SetupWizard.tsx   First-run server URL wizard
│   │   └── Celebration.tsx   Animated pop-up for kills/rewards
│   └── theme.ts             Color palette and spacing constants
├── backend/
│   └── main.py              FastAPI server with WebSocket broadcast
├── App.tsx
├── index.js
└── package.json
```

## Getting Started

### 1. Install dependencies

```bash
cd questboard-mobile
npm install
```

### 2. Android setup

```bash
# Make sure ANDROID_HOME is set and an emulator/device is connected
npx react-native run-android
```

### 3. iOS setup

```bash
cd ios && pod install && cd ..
npx react-native run-ios
```

### 4. Backend

The app connects to the original Questboard FastAPI backend (with added WebSocket support).

Using the enhanced backend in `backend/main.py`:

```bash
pip install fastapi uvicorn
QUESTBOARD_DATA=./data uvicorn backend.main:app --host 0.0.0.0 --port 8099
```

Or use the original Docker setup — the mobile app is compatible with the existing REST API. The WebSocket endpoint (`/ws`) is additive.

### 5. Configure server URL

On first launch, the app prompts for the server URL (e.g. `192.168.1.10:8099`). This can also be set in Settings at any time.

## Offline Mode

When no server is reachable, the app reads from the local SQLite cache. Mutations are applied locally and synced to the server when connectivity is restored.

## Sprite Assets

Monster sprites and dungeon tiles are served by the backend from the original `frontend/public/` directory. The app loads them by URL (e.g. `http://server/sprites/monsters2/green_slime.png`). If an image fails to load, an emoji fallback is shown automatically.

## Architecture Notes

- `GameContext.tsx` is the single source of truth. All game actions mutate state there, persist to SQLite, then POST to server (which broadcasts via WS to all connected devices).
- `logic.js` and `data.js` are copied verbatim from the original project and used as-is (ES module exports work in React Native with Babel).
- The dungeon map is rendered as a grid of colored `View` tiles (no WebGL/canvas needed). Each tile is 14px; scroll to navigate the full 34×22 grid.
