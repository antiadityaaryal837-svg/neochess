import { Router, Response } from 'express';
import { prisma } from '../db.js';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth.js';
import os from 'os';

const router = Router();

// Protect all admin routes with authentication
router.use(authenticateToken);

// Helper function to log administrative actions to the database
async function recordAuditLog(
  adminId: string,
  action: string,
  targetType: string,
  targetId?: string,
  details?: string,
  ipAddress?: string
) {
  try {
    await prisma.auditLog.create({
      data: {
        adminId,
        action,
        targetType,
        targetId,
        details,
        ipAddress,
      },
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}

// -------------------------------------------------------------
// SECTION A: DASHBOARD TELEMETRY & STATS
// -------------------------------------------------------------
router.get('/stats', requireRole(['moderator', 'admin', 'superadmin']), async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      onlineUsers,
      activeGames,
      completedGames,
      gamesToday,
      totalTournaments,
      totalPuzzles,
      totalAttempts,
      recentUsers,
      recentGames,
      pendingReports,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.profile.count({ where: { isOnline: true } }),
      prisma.game.count({ where: { status: 'in_progress' } }),
      prisma.game.count({ where: { status: { in: ['checkmate', 'resigned', 'timeout', 'draw_agreed', 'stalemate'] } } }),
      prisma.game.count({ where: { createdAt: { gte: today } } }),
      prisma.tournament.count(),
      prisma.puzzle.count(),
      prisma.puzzleAttempt.count(),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, username: true, role: true, createdAt: true },
      }),
      prisma.game.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          whitePlayer: { select: { username: true } },
          blackPlayer: { select: { username: true } },
        },
      }),
      prisma.report.count({ where: { status: 'pending' } }),
    ]);

    // Check database connection responsiveness
    const dbPingStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatencyMs = Date.now() - dbPingStart;

    return res.json({
      totalUsers,
      onlineUsers,
      activeGames,
      completedGames,
      gamesToday,
      totalTournaments,
      totalPuzzles,
      totalAttempts,
      pendingReports,
      serverHealth: {
        status: 'healthy',
        uptimeSeconds: Math.floor(process.uptime()),
        dbLatencyMs,
        memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        systemLoad: os.loadavg(),
      },
      recentActivity: {
        recentUsers,
        recentGames,
      },
    });
  } catch (err: any) {
    console.error('Admin stats error:', err);
    return res.status(500).json({ error: 'Failed to load platform statistics' });
  }
});

// -------------------------------------------------------------
// SECTION B: USER MANAGEMENT
// -------------------------------------------------------------
router.get('/users', requireRole(['moderator', 'admin', 'superadmin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string || '20', 10)));
    const search = (req.query.search as string || '').trim();
    const roleFilter = req.query.role as string;
    const statusFilter = req.query.status as string; // 'banned', 'active'
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { username: { contains: search } },
        { email: { contains: search } },
      ];
    }
    if (roleFilter && roleFilter !== 'all') {
      where.role = roleFilter;
    }
    if (statusFilter === 'banned') {
      where.isBanned = true;
    } else if (statusFilter === 'active') {
      where.isBanned = false;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
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
          profile: {
            select: {
              displayName: true,
              country: true,
              title: true,
              avatarUrl: true,
              isOnline: true,
              lastSeenAt: true,
            },
          },
          ratings: true,
        },
      }),
      prisma.user.count({ where }),
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
    console.error('Admin list users error:', err);
    return res.status(500).json({ error: 'Failed to load users' });
  }
});

router.get('/users/:id', requireRole(['moderator', 'admin', 'superadmin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        membershipTier: true,
        isBanned: true,
        createdAt: true,
        updatedAt: true,
        profile: true,
        ratings: true,
        ratingHistory: { take: 10, orderBy: { createdAt: 'desc' } },
        whiteGames: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: { id: true, status: true, result: true, timeControl: true, createdAt: true },
        },
        blackGames: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: { id: true, status: true, result: true, timeControl: true, createdAt: true },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to load user details' });
  }
});

// Edit user profile details
router.put('/users/:id', requireRole(['admin', 'superadmin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { username, displayName, bio, country, title, membershipTier } = req.body;

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    // Update user and profile
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        username: username || undefined,
        membershipTier: membershipTier || undefined,
        profile: {
          upsert: {
            create: { displayName, bio, country: country || 'US', title },
            update: { displayName, bio, country, title },
          },
        },
      },
      select: { id: true, username: true, email: true, role: true, membershipTier: true },
    });

    await recordAuditLog(
      req.user!.id,
      'edit_user',
      'user',
      id,
      `Updated user profile for ${updatedUser.username}`,
      req.ip
    );

    return res.json({ message: 'User updated successfully', user: updatedUser });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update user' });
  }
});

// Update user role - Super Admin only for promoting to admin/superadmin
router.put('/users/:id/role', requireRole('superadmin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'moderator', 'admin', 'superadmin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role specified' });
    }

    if (id === req.user!.id && role !== 'superadmin') {
      return res.status(400).json({ error: 'Cannot demote your own Super Admin account' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, username: true, role: true },
    });

    await recordAuditLog(
      req.user!.id,
      'update_role',
      'user',
      id,
      `Changed role of ${updated.username} to ${role}`,
      req.ip
    );

    return res.json({ message: `Role updated to ${role} for ${updated.username}`, user: updated });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to change user role' });
  }
});

// Suspend account
router.post('/users/:id/suspend', requireRole(['moderator', 'admin', 'superadmin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (id === req.user!.id) {
      return res.status(400).json({ error: 'Cannot suspend your own account' });
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    if (targetUser.role === 'superadmin' && req.user!.role !== 'superadmin') {
      return res.status(403).json({ error: 'Cannot suspend a Super Admin' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isBanned: true },
    });

    await recordAuditLog(
      req.user!.id,
      'suspend_user',
      'user',
      id,
      `Suspended user ${updated.username}. Reason: ${reason || 'Terms violation'}`,
      req.ip
    );

    return res.json({ message: `User ${updated.username} suspended successfully` });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to suspend user' });
  }
});

// Unsuspend account
router.post('/users/:id/unsuspend', requireRole(['moderator', 'admin', 'superadmin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const updated = await prisma.user.update({
      where: { id },
      data: { isBanned: false },
    });

    await recordAuditLog(
      req.user!.id,
      'unsuspend_user',
      'user',
      id,
      `Lifted suspension for ${updated.username}`,
      req.ip
    );

    return res.json({ message: `User ${updated.username} unsuspended successfully` });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to unsuspend user' });
  }
});

// Permanently delete user account - Super Admin only
router.delete('/users/:id', requireRole('superadmin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (id === req.user!.id) {
      return res.status(400).json({ error: 'Cannot delete your own active account' });
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    // Safeguard initial admin or superadmin
    if (targetUser.role === 'superadmin') {
      const superAdminCount = await prisma.user.count({ where: { role: 'superadmin' } });
      if (superAdminCount <= 1) {
        return res.status(400).json({ error: 'Cannot delete the only Super Admin on the platform' });
      }
    }

    await prisma.user.delete({ where: { id } });

    await recordAuditLog(
      req.user!.id,
      'delete_user',
      'user',
      id,
      `Permanently deleted user account ${targetUser.username} (${targetUser.email})`,
      req.ip
    );

    return res.json({ message: `User ${targetUser.username} deleted permanently` });
  } catch (err: any) {
    console.error('Delete user error:', err);
    return res.status(500).json({ error: 'Failed to delete user' });
  }
});

// -------------------------------------------------------------
// SECTION C: GAME MANAGEMENT
// -------------------------------------------------------------
router.get('/games', requireRole(['moderator', 'admin', 'superadmin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string || '20', 10)));
    const status = req.query.status as string; // 'in_progress', 'completed'
    const search = (req.query.search as string || '').trim();
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status === 'in_progress') {
      where.status = 'in_progress';
    } else if (status === 'completed') {
      where.status = { not: 'in_progress' };
    }

    if (search) {
      where.OR = [
        { id: { contains: search } },
        { whitePlayer: { username: { contains: search } } },
        { blackPlayer: { username: { contains: search } } },
      ];
    }

    const [games, total] = await Promise.all([
      prisma.game.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          whitePlayer: { select: { id: true, username: true } },
          blackPlayer: { select: { id: true, username: true } },
          analysis: { select: { whiteAccuracy: true, blackAccuracy: true } },
        },
      }),
      prisma.game.count({ where }),
    ]);

    return res.json({
      games,
      pagination: {
        page,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to load games' });
  }
});

// Terminate abusive or broken game
router.post('/games/:id/terminate', requireRole(['admin', 'superadmin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const game = await prisma.game.findUnique({ where: { id } });
    if (!game) return res.status(404).json({ error: 'Game not found' });

    const updated = await prisma.game.update({
      where: { id },
      data: {
        status: 'abandoned',
        result: '*',
      },
    });

    await recordAuditLog(
      req.user!.id,
      'terminate_game',
      'game',
      id,
      `Force terminated game ${id}. Reason: ${reason || 'Administrative termination'}`,
      req.ip
    );

    return res.json({ message: 'Game terminated successfully', game: updated });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to terminate game' });
  }
});

// -------------------------------------------------------------
// SECTION D: PLATFORM CONFIGURATION
// -------------------------------------------------------------
router.get('/config', requireRole(['admin', 'superadmin']), async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const configs = await prisma.platformConfig.findMany();
    const configMap: Record<string, any> = {};

    configs.forEach((c) => {
      try {
        configMap[c.key] = JSON.parse(c.value);
      } catch {
        configMap[c.key] = c.value;
      }
    });

    // Default configuration fallbacks if not yet initialized
    const defaults = {
      allowRegistrations: true,
      maintenanceMode: false,
      announcement: '',
      puzzlesEnabled: true,
      tournamentsEnabled: true,
      supportedTimeControls: ['bullet_1_0', 'blitz_3_0', 'blitz_5_0', 'rapid_10_0', 'classical_30_0'],
      matchmakingRatingRange: 200,
      enabledVariants: ['standard', 'chess960', 'three_check'],
    };

    return res.json({
      config: { ...defaults, ...configMap },
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to load platform configuration' });
  }
});

router.put('/config', requireRole(['admin', 'superadmin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const settings = req.body;

    for (const [key, value] of Object.entries(settings)) {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      await prisma.platformConfig.upsert({
        where: { key },
        create: {
          key,
          value: stringValue,
          updatedBy: req.user!.id,
        },
        update: {
          value: stringValue,
          updatedBy: req.user!.id,
        },
      });
    }

    await recordAuditLog(
      req.user!.id,
      'update_config',
      'config',
      'platform',
      `Updated platform configuration settings: ${Object.keys(settings).join(', ')}`,
      req.ip
    );

    return res.json({ message: 'Platform configuration updated successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update platform configuration' });
  }
});

// -------------------------------------------------------------
// SECTION E: CONTENT MANAGEMENT (Puzzles, Lessons, Openings)
// -------------------------------------------------------------
router.get('/puzzles', requireRole(['admin', 'superadmin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string || '1', 10));
    const limit = 20;
    const skip = (page - 1) * limit;

    const [puzzles, total] = await Promise.all([
      prisma.puzzle.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.puzzle.count(),
    ]);

    return res.json({ puzzles, total, page, totalPages: Math.ceil(total / limit) });
  } catch {
    return res.status(500).json({ error: 'Failed to load puzzles' });
  }
});

router.post('/puzzles', requireRole(['admin', 'superadmin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { fen, moves, rating, theme } = req.body;
    if (!fen || !moves) {
      return res.status(400).json({ error: 'FEN and moves are required' });
    }

    const movesStr = Array.isArray(moves) ? moves.join(' ') : moves;
    const puzzle = await prisma.puzzle.create({
      data: {
        fen: fen.trim(),
        moves: movesStr.trim(),
        rating: rating || 1500,
        themes: theme || 'tactics',
      },
    });

    await recordAuditLog(req.user!.id, 'create_puzzle', 'puzzle', puzzle.id, `Created puzzle ${puzzle.id}`, req.ip);
    return res.json({ puzzle, message: 'Puzzle created successfully' });
  } catch {
    return res.status(500).json({ error: 'Failed to create puzzle' });
  }
});

router.delete('/puzzles/:id', requireRole(['admin', 'superadmin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.puzzle.delete({ where: { id } });
    await recordAuditLog(req.user!.id, 'delete_puzzle', 'puzzle', id, `Deleted puzzle ${id}`, req.ip);
    return res.json({ message: 'Puzzle deleted successfully' });
  } catch {
    return res.status(500).json({ error: 'Failed to delete puzzle' });
  }
});

// -------------------------------------------------------------
// SECTION F: MODERATION & USER REPORTS
// -------------------------------------------------------------
router.get('/reports', requireRole(['moderator', 'admin', 'superadmin']), async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const reports = await prisma.report.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: { select: { id: true, username: true } },
        reportedUser: { select: { id: true, username: true, isBanned: true } },
      },
    });

    return res.json({ reports });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to load reports' });
  }
});

router.post('/reports/:id/resolve', requireRole(['moderator', 'admin', 'superadmin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, actionTaken } = req.body; // 'resolved', 'dismissed'

    const report = await prisma.report.update({
      where: { id },
      data: { status: status || 'resolved' },
    });

    await recordAuditLog(
      req.user!.id,
      'resolve_report',
      'report',
      id,
      `Report marked as ${status}. Action: ${actionTaken || 'None'}`,
      req.ip
    );

    return res.json({ message: 'Report updated successfully', report });
  } catch {
    return res.status(500).json({ error: 'Failed to update report' });
  }
});

router.get('/audit-logs', requireRole(['admin', 'superadmin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string || '50', 10)));
    const logs = await prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ logs });
  } catch {
    return res.status(500).json({ error: 'Failed to load audit logs' });
  }
});

// -------------------------------------------------------------
// SECTION H: SYSTEM MONITORING
// -------------------------------------------------------------
router.get('/system', requireRole(['admin', 'superadmin']), async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const dbPingStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatencyMs = Date.now() - dbPingStart;

    const memoryUsage = process.memoryUsage();

    return res.json({
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        uptimeSeconds: Math.floor(process.uptime()),
        hostname: os.hostname(),
        cpus: os.cpus().length,
        freeMemMb: Math.round(os.freemem() / 1024 / 1024),
        totalMemMb: Math.round(os.totalmem() / 1024 / 1024),
        processMemory: {
          heapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          heapTotalMb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          rssMb: Math.round(memoryUsage.rss / 1024 / 1024),
        },
        services: {
          backend: 'online',
          database: {
            status: 'connected',
            latencyMs: dbLatencyMs,
          },
          stockfish: {
            engine: 'Stockfish 19 WASM',
            status: 'ready',
          },
        },
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch system metrics' });
  }
});

export default router;
