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

// Import Socket Game Handlers
import { setupSocketGameHandlers } from './socket/gameHandler.js';

const app = express();
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

// API Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  message: { error: 'Too many requests, please slow down' },
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

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    platform: 'NeoChess API Server',
  });
});

// Start server
server.listen(config.port, () => {
  console.log(`🚀 NeoChess Authoritative Server running on http://localhost:${config.port}`);
  console.log(`📡 Socket.IO real-time multiplayer engine ready`);
});
