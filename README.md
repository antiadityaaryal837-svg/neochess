
# ♟ NeoChess | Production-Grade Online Chess Platform

> A complete, fully functional, production-oriented online chess platform inspired by Chess.com. Built with an authoritative backend engine, real-time multiplayer, intelligent computer opponents, interactive puzzles, video-free step-by-step lessons, ECO opening explorer, Stockfish game analysis, and social features.

---

## 🌟 Key Features Overview

### 1. ⚔ Authoritative Real-Time Chess Engine & Multiplayer
- **Authoritative Server Validation**: Server validates every legal move using `chess.js`; never trusts frontend state.
- **Full Rules Authority**: Checkmate, Stalemate, Threefold repetition, 50-move rule, Insufficient material, Castling (kingside/queenside), En passant, and Pawn promotion.
- **Variants Support**: Standard Chess, Three-Check Chess (delivering 3 checks wins), King of the Hill (occupying d4/e4/d5/e5 wins), and Chess960 (Fischer Random).
- **Time Controls**: Bullet (1+0, 1+1, 2+1), Blitz (3+0, 3+2, 5+0, 5+3), Rapid (10+0, 15+10, 30+0), and Classical (60+0).
- **Clocks & Increments**: Synchronized real-time server clocks with decrement math and low-time flashing warnings (<20s).
- **Matchmaking Queues**: Automatic rating-based matchmaking queues with instant matching.
- **In-Game Controls**: Resign, Offer/Accept/Decline Draw, Rematch, Board Flipping, PGN Download, FEN Copy, and Room Chat.
- **Audio Synthesizer**: Zero-dependency Web Audio API sound engine (wooden move clicks, heavy capture thumps, check alarms, castling, and victory fanfare).

### 2. 🤖 Computer Opponents (Adaptive AI Bots)
- **Martin (400)**: Casual beginner, occasionally leaves pieces undefended.
- **Elena (700)**: Solid opening principles and center control.
- **Nelson (1300)**: Aggressive early queen attacks and scholar mate tactics.
- **Antonio (1500)**: Positional club player punishing structure weaknesses.
- **Grandmaster Li (2200)**: Sharp calculation and master endgames.
- **Stockfish Master (3200)**: Maximum depth engine evaluation.

### 3. 🧩 Chess Puzzles & Tactics
- **Daily Puzzles**: Deterministic daily puzzle updated every 24 hours.
- **Rated Puzzles**: Serves tactical combinations tailored to user's puzzle rating with dynamic Elo calculation.
- **Tactical Themes**: Forks, pins, skewers, back-rank mates, sacrifices, discovered attacks, pawn breaks.
- **Hints & Solutions**: Visual square hints and retry mechanisms.
- **Puzzle Streak**: Continuous puzzle rush mode.

### 4. 🔬 Stockfish Analysis & Game Review
- **Interactive Analysis Board**: Move forward and backward through positions.
- **Live Evaluation Bar**: Smooth vertical advantage bar showing centipawns (+1.2) or forced mates (M4).
- **Move Classification**: Brilliant, Best, Excellent, Good, Inaccuracy, Mistake, and Blunder badges.
- **Game Review**: Accuracy percentage score calculation for White and Black.
- **Import / Export**: Paste any custom FEN or PGN to inspect positions.

### 5. 🎓 Interactive Chess Academy & Lessons
- **Beginner**: How pieces move (Rooks, Bishops, Queens, Kings).
- **Intermediate**: Essential checkmate patterns (Back rank, f7 attacks).
- **Advanced**: King & Pawn endgames (Opposition, outflanking, promotion paths).
- Step-by-step interactive exercises with explanation cards and server progress tracking.

### 6. 📖 ECO Opening Explorer
- Popular openings database with ECO codes (Sicilian Defense, Italian Game, Ruy Lopez, Queen's Gambit, Caro-Kann, King's Indian, London System, etc.).
- Move notation, historical master win/draw/loss percentages, and preview board.
- Instant FEN position lookup.

### 7. 🏆 Tournaments & Social System
- **Tournaments**: Arena and Swiss rapid championships with live standings and participant rosters.
- **Clubs**: Speed Demons Club, Master Tacticians, Endgame Maestros with member management.
- **Friends**: Search players, send requests, accept/decline, direct messaging.
- **Global Leaderboards**: Top rankings for Bullet, Blitz, Rapid, Classical, and Puzzles.

### 8. 🛡 Administration & Security
- **Role-Based Access Control**: Users, Moderators, and Administrators.
- **Admin Dashboard**: System telemetry, total users, active games, puzzle metrics, uptime.
- **Player Moderation**: Account suspensions, bans, unbans, and fair-play report resolution.
- **Security**: Bcrypt password hashing, JWT sessions, Helmet headers, Rate limiting, Zod validation.

---

## 🏗 Architecture & Monorepo Structure

```
chess.com/
├── apps/
│   ├── web/                    # React 18 + Vite + Tailwind CSS Frontend
│   │   ├── src/
│   │   │   ├── components/     # Chessboard, Clocks, EvalBar, MoveHistory, Modals
│   │   │   ├── pages/          # Home, Play, Bots, Puzzles, Lessons, Analysis, etc.
│   │   │   ├── services/       # Typed API client & Socket.IO client
│   │   │   ├── store/          # Zustand authStore & gameStore
│   │   │   └── utils/          # Web Audio API sound synthesizer
│   ├── server/                 # Express + Socket.IO + Prisma Backend
│   │   ├── src/
│   │   │   ├── routes/         # Auth, Games, Users, Puzzles, Lessons, Admin, etc.
│   │   │   ├── socket/         # Authoritative real-time game handler & clocks
│   │   │   └── cache.ts        # Redis client with in-memory fallback
│   └── worker/                 # Asynchronous Stockfish deep analysis worker
├── packages/
│   ├── shared/                 # Shared domain types, constants, openings, schemas
│   └── chess/                  # Authoritative ChessGameEngine, Elo/Glicko math, variants
├── prisma/
│   ├── schema.prisma           # SQLite (Zero-config local development)
│   ├── schema.postgresql.prisma# PostgreSQL (Docker / Production deployment)
│   └── seed.ts                 # Database seed script
├── docker/
│   ├── Dockerfile.server       # Containerized Node.js backend
│   ├── Dockerfile.web          # Containerized React + Nginx frontend
│   ├── Dockerfile.worker       # Containerized background analysis worker
│   └── nginx.conf              # Reverse proxy configuration
├── tests/
│   ├── chess.test.ts           # Authoritative rules, variants & Elo tests
│   └── api.test.ts             # REST API integration tests
├── docker-compose.yml          # Multi-container orchestration (PostgreSQL + Redis)
└── package.json                # Monorepo workspaces
```

---

## ⚡ Quickstart Guide (Local Windows 11 - Zero Cost & Zero External Dependencies)

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Build Shared Packages
```bash
npm run build --workspace=@chess/shared
npm run build --workspace=@chess/chess
```

### Step 3: Initialize Database & Seed Sample Data
The local setup uses self-contained SQLite with Prisma ORM (zero installation required):
```bash
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
```

*Pre-seeded demo accounts:*
- **Admin**: `admin` / `AdminPass123!`
- **Magnus**: `magnus_test` / `ChessPass123!`
- **Alex (Club Player)**: `alex_club` / `ChessPass123!`
- **Instant Guest**: Click *"Play Instantly as Guest"* on the login modal (no password required).

### Step 4: Run Development Servers
Run the full platform simultaneously:
```bash
npm run dev
```
Or start individually in separate terminals:
```bash
# Terminal 1: Backend Server (Port 3001)
npm run dev:server

# Terminal 2: Web Frontend (Port 5173)
npm run dev:web
```

Access the application in your browser:
- Web App: `http://localhost:5173`
- Backend API: `http://localhost:3001`
- Health Check: `http://localhost:3001/api/health`

---

## 🐳 Docker Compose Deployment (PostgreSQL + Redis)

To run the complete production stack with PostgreSQL, Redis, Server, Web, and Worker:

```bash
docker-compose up --build
```

Services:
- Web Client: `http://localhost` (Port 80)
- Backend API: `http://localhost:3001`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

---

## 🧪 Running Automated Tests

Run the complete test suite (20/20 unit and integration tests):
```bash
npx vitest run
```

Tests verify:
- Authoritative legal move validation
- Castling, en passant, promotion
- Scholar's mate and stalemate detection
- Three-Check and King of the Hill win conditions
- Chess960 Fischer Random board generator
- Elo rating delta calculation
- Puzzle rating adjustments
- Move classification (blunder, mistake, inaccuracy, best)
- Accuracy percentage formula
- Full REST API endpoints (Auth, Games, Puzzles, Lessons, Openings, Tournaments)

---

## 📋 Feature Completion Checklist

| Requirement | Implementation Status | Notes |
|:---|:---:|:---|
| **Authoritative Chess Rules** | ✅ Complete | Legal move checks, checkmate, stalemate, 50-move, threefold |
| **Chess Variants** | ✅ Complete | Standard, Chess960, Three-Check, King of the Hill |
| **Real-time Multiplayer** | ✅ Complete | Socket.IO room broadcasts, move relays, spectator presence |
| **Authoritative Clocks** | ✅ Complete | Server timestamp countdown, increments, timeout wins |
| **Matchmaking & Ratings** | ✅ Complete | Time control queues, adaptive Elo rating calculation |
| **Computer Opponents** | ✅ Complete | Martin, Elena, Nelson, Antonio, Grandmaster Li, Stockfish |
| **Chess Puzzles** | ✅ Complete | Daily puzzle, rated tactics, hints, streak mode |
| **Chess Lessons** | ✅ Complete | Interactive step exercises, explanations, progress tracking |
| **Game Review & Analysis** | ✅ Complete | Stockfish eval bar, accuracy %, move classification |
| **ECO Opening Explorer** | ✅ Complete | ECO codes, opening names, move trees, win rates |
| **Tournaments** | ✅ Complete | Arena and Swiss tournament structures, live standings |
| **Clubs & Social** | ✅ Complete | Community clubs, friend requests, room chat |
| **Player Profiles** | ✅ Complete | Public profiles, ratings, win rates, match history |
| **Customization & Themes** | ✅ Complete | Neo Green, Walnut, Ocean, Obsidian, Glass board themes |
| **Sound System** | ✅ Complete | Acoustic Web Audio API synthesizer (no external audio assets) |
| **Admin Dashboard** | ✅ Complete | User management, suspensions, ban/unban, platform metrics |
| **Zero Cost & Local** | ✅ Complete | 100% free open-source stack, runs on Windows 11 laptop |

---

## 🔒 Security & Fair Play
- Passwords hashed with `bcryptjs` (salt rounds: 10).
- Stateless JWT authentication tokens.
- Server-side move authorization: player cannot move opponent's pieces or move out of turn.
- Input validation on all endpoints with `zod`.
- Strict Helmet security headers and express rate limiting.
