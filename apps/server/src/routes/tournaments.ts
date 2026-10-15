import { Router, Response, Request } from 'express';
import { prisma } from '../db.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/tournaments
router.get('/', async (_req: Request, res: Response) => {
  try {
    const tournaments = await prisma.tournament.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { username: true } },
        _count: { select: { players: true } },
      },
    });

    return res.json({ tournaments });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch tournaments' });
  }
});

// GET /api/tournaments/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        createdBy: { select: { username: true } },
        players: {
          orderBy: { points: 'desc' },
          include: {
            user: { select: { username: true, profile: true, ratings: true } },
          },
        },
      },
    });

    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    return res.json({ tournament });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to load tournament' });
  }
});

// POST /api/tournaments/:id/join
router.post('/:id/join', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: { _count: { select: { players: true } } },
    });

    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    if (tournament._count.players >= tournament.maxPlayers) {
      return res.status(400).json({ error: 'Tournament is at full capacity' });
    }

    const entry = await prisma.tournamentPlayer.upsert({
      where: {
        tournamentId_userId: {
          tournamentId: id,
          userId: req.user!.id,
        },
      },
      update: {},
      create: {
        tournamentId: id,
        userId: req.user!.id,
        points: 0.0,
      },
    });

    return res.json({ entry, message: 'Joined tournament successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to join tournament' });
  }
});

// POST /api/tournaments
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, variant, timeControl, maxPlayers } = req.body;

    if (!name || name.trim().length < 3) {
      return res.status(400).json({ error: 'Valid tournament name required' });
    }

    const tournament = await prisma.tournament.create({
      data: {
        name,
        description,
        variant: variant || 'standard',
        timeControl: timeControl || '3+0',
        maxPlayers: maxPlayers || 64,
        createdById: req.user!.id,
        status: 'upcoming',
        players: {
          create: {
            userId: req.user!.id,
            points: 0.0,
          },
        },
      },
    });

    return res.status(201).json({ tournament });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create tournament' });
  }
});

export default router;
