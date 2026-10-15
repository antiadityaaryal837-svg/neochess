import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';

// Import Routers
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import gamesRouter from './routes/games.js';
import puzzlesRouter from './routes/puzzles.js';
import lessonsRouter from './routes/lessons.js';
import openingsRouter from './routes/openings.js';
import socialRouter from './routes/social.js';
import tournamentsRouter from './routes/tournaments.js';
import adminRouter from './routes/admin.js';
import analysisRouter from './routes/analysis.js';
import clubsRouter from './routes/clubs.js';
import { ensureAchievementsSeeded } from './services/achievementService.js';

// Auto-seed all system achievements on startup
ensureAchievementsSeeded().catch((err) => console.error('Failed to seed achievements:', err));

// Import Socket Game Handlers
import { setupSocketGameHandlers } from './socket/gameHandler.js';

const app = express();
app.set('trust proxy', 1);
const server = http.createServer(app);

// Socket.IO Setup
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 30000,
  pingInterval: 10000,
});

setupSocketGameHandlers(io);

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*' }));
app.use(express.json());

// API Rate limiting (configured safely for proxies and tunnels)
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1000,
  message: { error: 'Too many requests, please slow down' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});
app.use('/api', limiter);

// Mount API routes
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/games', gamesRouter);
app.use('/api/puzzles', puzzlesRouter);
app.use('/api/lessons', lessonsRouter);
app.use('/api/openings', openingsRouter);
app.use('/api/social', socialRouter);
app.use('/api/tournaments', tournamentsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/analysis', analysisRouter);
app.use('/api/clubs', clubsRouter);

import os from 'os';

function getLanIpAddress(): string {
  const interfaces = os.networkInterfaces();
  let wifiIp = '';
  let ethernetIp = '';
  let fallbackIp = '';

  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        const lowerName = name.toLowerCase();
        if (lowerName.includes('wi-fi') || lowerName.includes('wireless') || lowerName.includes('wlan')) {
          wifiIp = net.address;
        } else if (lowerName.includes('ethernet') && !lowerName.includes('vethernet') && !lowerName.includes('virtual')) {
          ethernetIp = net.address;
        } else if (!fallbackIp && !lowerName.includes('vethernet') && !lowerName.includes('virtual') && !lowerName.includes('default switch')) {
          fallbackIp = net.address;
        }
      }
    }
  }

  return wifiIp || ethernetIp || fallbackIp || '127.0.0.1';
}

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    platform: 'NeoChess API Server',
  });
});

// Network LAN Discovery endpoint
app.get('/api/network-info', (_req, res) => {
  const lanIp = getLanIpAddress();
  res.json({
    lanIp,
    webUrl: `http://${lanIp}:5173`,
    apiUrl: `http://${lanIp}:${config.port}`,
    hostname: os.hostname(),
    isAccessibleOnLan: true,
  });
});

// Start server on 0.0.0.0 for LAN access
server.listen(config.port, '0.0.0.0', () => {
  const lanIp = getLanIpAddress();
  console.log(`🚀 NeoChess Authoritative Server running on http://localhost:${config.port}`);
  console.log(`🌐 Local Network Access (Wi-Fi/LAN): http://${lanIp}:${config.port}`);
  console.log(`📡 Socket.IO real-time multiplayer engine ready on 0.0.0.0:${config.port}`);
});
