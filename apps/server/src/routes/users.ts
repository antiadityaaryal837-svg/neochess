import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { UpdateProfileSchema } from '@chess/shared';

const router = Router();

// GET /api/users/leaderboard
router.get('/leaderboard', async (req: Request, res: Response) => {
  try {
    const category = (req.query.category as string) || 'blitz';
    const validCategories = ['bullet', 'blitz', 'rapid', 'classical', 'puzzles'];
    const sortField = validCategories.includes(category) ? category : 'blitz';

    const topRatings = await prisma.rating.findMany({
      take: 25,
      orderBy: { [sortField]: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            membershipTier: true,
            profile: {
              select: {
                displayName: true,
                country: true,
                avatarUrl: true,
                title: true,
              },
            },
          },
        },
      },
    });

    const leaderboard = topRatings.map((r, index) => ({
      rank: index + 1,
      userId: r.user.id,
      username: r.user.username,
      displayName: r.user.profile?.displayName || r.user.username,
      avatarUrl: r.user.profile?.avatarUrl,
      country: r.user.profile?.country || 'US',
      title: r.user.profile?.title,
      membershipTier: r.user.membershipTier,
      rating: (r as any)[sortField],
    }));

    return res.json({ category: sortField, leaderboard });
  } catch (err: any) {
    console.error('Leaderboard error:', err);
    return res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// GET /api/users/search?q=...
router.get('/search', async (req: Request, res: Response) => {
  try {
    const query = (req.query.q as string) || '';
    if (query.trim().length < 2) {
      return res.json({ users: [] });
    }

    const users = await prisma.user.findMany({
      where: {
        username: {
          contains: query,
        },
      },
      take: 10,
      select: {
        id: true,
        username: true,
        membershipTier: true,
        profile: {
          select: {
            displayName: true,
            country: true,
            avatarUrl: true,
            title: true,
            isOnline: true,
          },
        },
        ratings: true,
      },
    });

    return res.json({ users });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to search users' });
  }
});

// GET /api/users/:username
router.get('/:username', async (req: Request, res: Response) => {
  try {
    const { username } = req.params;

    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        profile: true,
        ratings: true,
        achievements: {
          include: {
            // @ts-ignore
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Player profile not found' });
    }

    // Calculate game stats
    const [whiteWins, blackWins, whiteLosses, blackLosses, draws] = await Promise.all([
      prisma.game.count({ where: { whitePlayerId: user.id, result: '1-0' } }),
      prisma.game.count({ where: { blackPlayerId: user.id, result: '0-1' } }),
      prisma.game.count({ where: { whitePlayerId: user.id, result: '0-1' } }),
      prisma.game.count({ where: { blackPlayerId: user.id, result: '1-0' } }),
      prisma.game.count({
        where: {
          OR: [{ whitePlayerId: user.id }, { blackPlayerId: user.id }],
          result: '1/2-1/2',
        },
      }),
    ]);

    const wins = whiteWins + blackWins;
    const losses = whiteLosses + blackLosses;
    const totalGames = wins + losses + draws;
    const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

    // Recent games
    const recentGames = await prisma.game.findMany({
      where: {
        OR: [{ whitePlayerId: user.id }, { blackPlayerId: user.id }],
        status: { not: 'in_progress' },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        whitePlayer: { select: { username: true, profile: true } },
        blackPlayer: { select: { username: true, profile: true } },
      },
    });

    return res.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        membershipTier: user.membershipTier,
        createdAt: user.createdAt,
        profile: user.profile,
        ratings: user.ratings,
        stats: {
          totalGames,
          wins,
          losses,
          draws,
          winRate,
        },
        recentGames,
      },
    });
  } catch (err: any) {
    console.error('User profile lookup error:', err);
    return res.status(500).json({ error: 'Failed to load user profile' });
  }
});

// PUT /api/users/profile
router.put('/profile', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = UpdateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid profile payload' });
    }

    const profile = await prisma.profile.upsert({
      where: { userId: req.user!.id },
      update: parsed.data,
      create: {
        userId: req.user!.id,
        ...parsed.data,
      },
    });

    return res.json({ profile });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
