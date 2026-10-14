import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db.js';
import { config } from '../config.js';
import { RegisterSchema, LoginSchema, UpdatePreferencesSchema } from '@chess/shared';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const { username, email, password, country } = parsed.data;

    // Check existing
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ username: { equals: username } }, { email: { equals: email } }],
      },
    });

    if (existing) {
      if (existing.username.toLowerCase() === username.toLowerCase()) {
        return res.status(400).json({ error: 'Username is already taken' });
      }
      return res.status(400).json({ error: 'Email is already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        role: 'user',
        membershipTier: 'free',
        profile: {
          create: {
            displayName: username,
            country: country || 'US',
            avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
          },
        },
        settings: {
          create: {
            boardTheme: 'green',
            pieceTheme: 'neo',
          },
        },
        ratings: {
          create: {
            bullet: 1200,
            blitz: 1200,
            rapid: 1200,
            classical: 1200,
            puzzles: 1200,
          },
        },
      },
      include: {
        profile: true,
        settings: true,
        ratings: true,
      },
    });

    const token = jwt.sign({ userId: user.id }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn as any,
    });

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        membershipTier: user.membershipTier,
        profile: user.profile,
        settings: user.settings,
        ratings: user.ratings,
      },
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Failed to register account' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid login details' });
    }

    const { usernameOrEmail, password } = parsed.data;

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
      },
      include: {
        profile: true,
        settings: true,
        ratings: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    if (user.isBanned) {
      return res.status(403).json({ error: 'Account suspended by moderation' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign({ userId: user.id }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn as any,
    });

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        membershipTier: user.membershipTier,
        profile: user.profile,
        settings: user.settings,
        ratings: user.ratings,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Failed to process login' });
  }
});

// POST /api/auth/guest
router.post('/guest', async (_req: Request, res: Response) => {
  try {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const guestUsername = `Guest_${randomSuffix}`;
    const guestEmail = `guest_${randomSuffix}@guest.neochess.local`;
    const passwordHash = await bcrypt.hash('GuestPass!', 8);

    const user = await prisma.user.create({
      data: {
        username: guestUsername,
        email: guestEmail,
        passwordHash,
        role: 'user',
        membershipTier: 'free',
        profile: {
          create: {
            displayName: guestUsername,
            avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${guestUsername}`,
          },
        },
        settings: {
          create: {
            boardTheme: 'green',
            pieceTheme: 'neo',
          },
        },
        ratings: {
          create: {
            bullet: 1200,
            blitz: 1200,
            rapid: 1200,
            classical: 1200,
            puzzles: 1200,
          },
        },
      },
      include: {
        profile: true,
        settings: true,
        ratings: true,
      },
    });

    const token = jwt.sign({ userId: user.id }, config.jwtSecret, { expiresIn: '30d' });

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        membershipTier: user.membershipTier,
        profile: user.profile,
        settings: user.settings,
        ratings: user.ratings,
        isGuest: true,
      },
    });
  } catch (err: any) {
    console.error('Guest creation error:', err);
    return res.status(500).json({ error: 'Failed to initialize guest session' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        profile: true,
        settings: true,
        ratings: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        membershipTier: user.membershipTier,
        profile: user.profile,
        settings: user.settings,
        ratings: user.ratings,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve profile' });
  }
});

// PUT /api/auth/preferences
router.put('/preferences', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = UpdatePreferencesSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid settings payload' });
    }

    const updated = await prisma.settings.upsert({
      where: { userId: req.user!.id },
      update: parsed.data,
      create: {
        userId: req.user!.id,
        ...parsed.data,
      },
    });

    return res.json({ settings: updated });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update preferences' });
  }
});

export default router;
