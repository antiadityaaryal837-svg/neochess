import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import os from 'os';

import authRouter from '../apps/server/src/routes/auth.js';
import adminRouter from '../apps/server/src/routes/admin.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);

// LAN network info route test simulation
app.get('/api/network-info', (_req, res) => {
  const interfaces = os.networkInterfaces();
  const addresses: { iface: string; address: string; family: string }[] = [];

  for (const [name, nets] of Object.entries(interfaces)) {
    if (!nets) continue;
    for (const net of nets) {
      if (net.family === 'IPv4' && !net.internal) {
        addresses.push({ iface: name, address: net.address, family: net.family });
      }
    }
  }

  const preferred = addresses.find((a) =>
    a.address.startsWith('192.168.') || a.address.startsWith('10.')
  ) || addresses[0];

  res.json({
    status: 'ok',
    primaryIp: preferred ? preferred.address : 'localhost',
    port: 3001,
    clientPort: 5173,
    allIpv4: addresses,
    localUrl: `http://${preferred ? preferred.address : 'localhost'}:5173`,
  });
});

describe('Admin RBAC & LAN Infrastructure Suite', () => {
  it('GET /api/network-info returns host IP for LAN multiplayer', async () => {
    const res = await request(app).get('/api/network-info');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.port).toBe(3001);
    expect(res.body.localUrl).toBeDefined();
    expect(res.body.primaryIp).toBeDefined();
  });

  it('GET /api/auth/google/config returns OAuth initialization state', async () => {
    const res = await request(app).get('/api/auth/google/config');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('enabled');
    expect(res.body).toHaveProperty('clientId');
  });

  it('rejects unauthenticated requests to /api/admin/stats with 401', async () => {
    const res = await request(app).get('/api/admin/stats');
    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  it('rejects regular user tokens from accessing /api/admin/stats with 403', async () => {
    // 1. Get token for guest / regular user
    const guestRes = await request(app).post('/api/auth/guest');
    const guestToken = guestRes.body.token;

    // 2. Attempt to hit admin endpoint
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${guestToken}`);
    
    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Access denied');
  });

  it('allows authenticated admin token to access /api/admin/stats', async () => {
    // 1. Login with seeded admin account
    const loginRes = await request(app).post('/api/auth/login').send({
      usernameOrEmail: 'admin',
      password: 'AdminPass123!',
    });
    const adminToken = loginRes.body.token;
    expect(adminToken).toBeDefined();

    // 2. Fetch admin telemetry metrics
    const statsRes = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(statsRes.status).toBe(200);
    expect(statsRes.body.totalUsers).toBeDefined();
    expect(statsRes.body.activeGames).toBeDefined();
    expect(statsRes.body.completedGames).toBeDefined();
  });

  it('allows admin to query /api/admin/system', async () => {
    const loginRes = await request(app).post('/api/auth/login').send({
      usernameOrEmail: 'admin',
      password: 'AdminPass123!',
    });
    const adminToken = loginRes.body.token;

    const res = await request(app)
      .get('/api/admin/system')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.system).toBeDefined();
    expect(res.body.system.services.database.status).toBe('connected');
    expect(res.body.system.services.stockfish.status).toBe('ready');
  });
});
