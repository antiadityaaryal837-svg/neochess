import { Router, Response } from 'express';
import { prisma } from '../db.js';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Protect all admin routes with authentication and role check
router.use(authenticateToken);
router.use(requireRole('admin'));

// GET /api/admin/stats
router.get('/stats', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const [totalUsers, totalGames, totalPuzzles, totalAttempts, activeGames] = await Promise.all([
      prisma.user.count(),
      prisma.game.count(),
      prisma.puzzle.count(),
      prisma.puzzleAttempt.count(),
      prisma.game.count({ where: { status: 'in_progress' } }),
    ]);

    return res.json({
      totalUsers,
      totalGames,
      totalPuzzles,
      totalAttempts,
      activeGames,
      uptimeSeconds: Math.floor(process.uptime()),
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to load platform statistics' });
  }
});

// GET /api/admin/users
router.get('/users', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = 20;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          membershipTier: true,
          isBanned: true,
          createdAt: true,
          profile: true,
          ratings: true,
        },
      }),
      prisma.user.count(),
    ]);

    return res.json({
      users,
      pagination: {
        page,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to load users' });
  }
});

// POST /api/admin/users/:id/ban
router.post('/users/:id/ban', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (id === req.user!.id) {
      return res.status(400).json({ error: 'Cannot ban yourself' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isBanned: true },
    });

    return res.json({ message: `User ${updated.username} suspended successfully` });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to ban user' });
  }
});

// POST /api/admin/users/:id/unban
router.post('/users/:id/unban', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const updated = await prisma.user.update({
      where: { id },
      data: { isBanned: false },
    });

    return res.json({ message: `User ${updated.username} unbanned successfully` });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to unban user' });
  }
});

// GET /api/admin/reports
router.get('/reports', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const reports = await prisma.report.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: { select: { username: true } },
        reportedUser: { select: { username: true, isBanned: true } },
      },
    });

    return res.json({ reports });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to load reports' });
  }
});

export default router;
