import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import cors from 'cors';

import authRouter from '../apps/server/src/routes/auth.js';
import usersRouter from '../apps/server/src/routes/users.js';
import puzzlesRouter from '../apps/server/src/routes/puzzles.js';
import lessonsRouter from '../apps/server/src/routes/lessons.js';
import openingsRouter from '../apps/server/src/routes/openings.js';
import tournamentsRouter from '../apps/server/src/routes/tournaments.js';
import clubsRouter from '../apps/server/src/routes/clubs.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/puzzles', puzzlesRouter);
app.use('/api/lessons', lessonsRouter);
app.use('/api/openings', openingsRouter);
app.use('/api/tournaments', tournamentsRouter);
app.use('/api/clubs', clubsRouter);

describe('Backend REST API Test Suite', () => {
  it('GET /api/openings returns authentic opening database', async () => {
    const res = await request(app).get('/api/openings');
    expect(res.status).toBe(200);
    expect(res.body.openings).toBeDefined();
    expect(res.body.openings.length).toBeGreaterThanOrEqual(10);
    expect(res.body.openings[0].name).toContain('Sicilian');
  });

  it('GET /api/openings/lookup finds matching opening by FEN prefix', async () => {
    const sicilianFen = 'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq c6 0 2';
    const res = await request(app).get(`/api/openings/lookup?fen=${encodeURIComponent(sicilianFen)}`);
    expect(res.status).toBe(200);
    expect(res.body.matched).toBe(true);
    expect(res.body.opening.name).toBe('Sicilian Defense');
  });

  it('GET /api/puzzles/daily returns the daily puzzle', async () => {
    const res = await request(app).get('/api/puzzles/daily');
    expect(res.status).toBe(200);
    expect(res.body.puzzle).toBeDefined();
    expect(res.body.puzzle.fen).toBeDefined();
    expect(res.body.puzzle.moves.length).toBeGreaterThan(0);
  });

  it('GET /api/puzzles/streak returns puzzle list for streak mode', async () => {
    const res = await request(app).get('/api/puzzles/streak');
    expect(res.status).toBe(200);
    expect(res.body.puzzles.length).toBeGreaterThan(0);
  });

  it('GET /api/lessons returns all curriculum lessons with steps', async () => {
    const res = await request(app).get('/api/lessons');
    expect(res.status).toBe(200);
    expect(res.body.lessons.length).toBeGreaterThan(0);
    expect(res.body.lessons[0].title).toBe('How the Pieces Move & Capture');
  });

  it('POST /api/auth/guest generates zero-friction guest player token', async () => {
    const res = await request(app).post('/api/auth/guest');
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.isGuest).toBe(true);
    expect(res.body.user.ratings.blitz).toBe(1200);
  });

  it('POST /api/auth/login logs in seeded test accounts', async () => {
    const res = await request(app).post('/api/auth/login').send({
      usernameOrEmail: 'admin',
      password: 'AdminPass123!',
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('admin');
    expect(res.body.user.username).toBe('admin');
  });

  it('GET /api/users/leaderboard returns rankings by category', async () => {
    const res = await request(app).get('/api/users/leaderboard?category=blitz');
    expect(res.status).toBe(200);
    expect(res.body.category).toBe('blitz');
    expect(res.body.leaderboard.length).toBeGreaterThan(0);
    expect(res.body.leaderboard[0].rating).toBeGreaterThan(2000);
  });

  it('GET /api/tournaments returns active and upcoming tournaments', async () => {
    const res = await request(app).get('/api/tournaments');
    expect(res.status).toBe(200);
    expect(res.body.tournaments.length).toBeGreaterThan(0);
  });

  it('GET /api/clubs returns list of active clubs', async () => {
    const res = await request(app).get('/api/clubs');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.clubs)).toBe(true);
    expect(res.body.clubs.length).toBeGreaterThan(0);
  });

  it('GET /api/users/:username/achievements returns all 28 achievements', async () => {
    const res = await request(app).get('/api/users/admin/achievements');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.achievements)).toBe(true);
    expect(res.body.achievements.length).toBeGreaterThanOrEqual(28);
  });

  it('GET /api/puzzles/leaderboard returns puzzle ratings and rush leaderboards', async () => {
    const res = await request(app).get('/api/puzzles/leaderboard');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.ratingLeaderboard)).toBe(true);
    expect(Array.isArray(res.body.rushLeaderboard)).toBe(true);
  });
});
