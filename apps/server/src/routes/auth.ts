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

// GET /api/auth/google/config
router.get('/google/config', (_req: Request, res: Response) => {
  return res.json({
    enabled: Boolean(config.googleClientId),
    clientId: config.googleClientId || null,
  });
});

// POST /api/auth/google - Authenticate with Google ID Token / OpenID Connect
router.post('/google', async (req: Request, res: Response) => {
  try {
    const { credential, code, redirectUri } = req.body;

    if (!credential && !code) {
      return res.status(400).json({ error: 'Google credential or authorization code is required' });
    }

    let email = '';
    let emailVerified = false;
    let name = '';
    let picture = '';

    if (credential) {
      // 1. Verify Google ID Token via Google's tokeninfo API
      const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
      const tokenInfo: any = await verifyRes.json();

      if (!verifyRes.ok || !tokenInfo.email) {
        return res.status(401).json({ error: tokenInfo.error_description || 'Invalid or expired Google credential' });
      }

      // Check audience if client ID is configured
      if (config.googleClientId && tokenInfo.aud !== config.googleClientId) {
        return res.status(401).json({ error: 'Google ID token audience mismatch' });
      }

      email = tokenInfo.email;
      emailVerified = tokenInfo.email_verified === 'true' || tokenInfo.email_verified === true;
      name = tokenInfo.name || tokenInfo.given_name || '';
      picture = tokenInfo.picture || '';
    } else if (code) {
      // 2. Exchange authorization code for tokens
      if (!config.googleClientId || !config.googleClientSecret) {
        return res.status(400).json({ error: 'Server Google OAuth credentials are not fully configured' });
      }

      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: config.googleClientId,
          client_secret: config.googleClientSecret,
          redirect_uri: redirectUri || `${config.clientUrl}/auth/callback`,
          grant_type: 'authorization_code',
        }),
      });

      const tokenData: any = await tokenRes.json();
      if (!tokenRes.ok || !tokenData.id_token) {
        return res.status(401).json({ error: tokenData.error_description || 'Failed to exchange authorization code' });
      }

      const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(tokenData.id_token)}`);
      const tokenInfo: any = await verifyRes.json();
      if (!verifyRes.ok || !tokenInfo.email) {
        return res.status(401).json({ error: 'Failed to verify token info from Google' });
      }

      email = tokenInfo.email;
      emailVerified = tokenInfo.email_verified === 'true' || tokenInfo.email_verified === true;
      name = tokenInfo.name || '';
      picture = tokenInfo.picture || '';
    }

    if (!emailVerified) {
      return res.status(400).json({ error: 'Your Google email address must be verified' });
    }

    // Check if user already exists with this email
    let user = await prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
        settings: true,
        ratings: true,
      },
    });

    if (user) {
      if (user.isBanned) {
        return res.status(403).json({ error: 'This account has been suspended' });
      }
      // Update avatar if not yet set
      if (picture && !user.profile?.avatarUrl) {
        await prisma.profile.update({
          where: { userId: user.id },
          data: { avatarUrl: picture },
        });
      }
    } else {
      // Generate clean unique username from Google name or email
      let baseUsername = (name || email.split('@')[0])
        .replace(/[^a-zA-Z0-9_]/g, '')
        .substring(0, 14) || 'Player';

      let uniqueUsername = baseUsername;
      let counter = 1;
      while (await prisma.user.findUnique({ where: { username: uniqueUsername } })) {
        uniqueUsername = `${baseUsername.substring(0, 11)}_${Math.floor(100 + Math.random() * 900)}`;
        counter++;
        if (counter > 10) break;
      }

      const dummyPasswordHash = await bcrypt.hash(`OAuth_${Date.now()}_${Math.random()}`, 10);

      user = await prisma.user.create({
        data: {
          username: uniqueUsername,
          email,
          passwordHash: dummyPasswordHash,
          role: 'user',
          membershipTier: 'free',
          profile: {
            create: {
              displayName: name || uniqueUsername,
              avatarUrl: picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${uniqueUsername}`,
              country: 'US',
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
    console.error('Google OAuth error:', err);
    return res.status(500).json({ error: 'Failed to process Google authentication' });
  }
});

export default router;
