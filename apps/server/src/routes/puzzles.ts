import { Router, Response } from 'express';
import { prisma } from '../db.js';
import { authenticateToken, AuthenticatedRequest, optionalAuthenticateToken } from '../middleware/auth.js';
import { SubmitPuzzleAttemptSchema } from '@chess/shared';
import { calculatePuzzleRatingChange } from '@chess/chess';

const router = Router();

// GET /api/puzzles/daily
router.get('/daily', async (_req, res: Response) => {
  try {
    // Select daily puzzle deterministically based on day of year
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
    const puzzles = await prisma.puzzle.findMany();

    if (puzzles.length === 0) {
      return res.status(404).json({ error: 'No puzzles available' });
    }

    const selected = puzzles[dayOfYear % puzzles.length];
    return res.json({
      puzzle: {
        id: selected.id,
        fen: selected.fen,
        moves: selected.moves.split(' '),
        rating: selected.rating,
        themes: selected.themes.split(','),
        description: selected.description,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch daily puzzle' });
  }
});

// GET /api/puzzles/rated
router.get('/rated', optionalAuthenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    let userRating = 1200;
    if (req.user) {
      const userRatings = await prisma.rating.findUnique({ where: { userId: req.user.id } });
      if (userRatings) {
        userRating = userRatings.puzzles;
      }
    }

    // Find puzzle close to user's rating (within +/- 300 points)
    const puzzles = await prisma.puzzle.findMany({
      where: {
        rating: {
          gte: Math.max(400, userRating - 250),
          lte: userRating + 250,
        },
      },
      take: 10,
    });

    const pool = puzzles.length > 0 ? puzzles : await prisma.puzzle.findMany({ take: 5 });
    const selected = pool[Math.floor(Math.random() * pool.length)];

    return res.json({
      puzzle: {
        id: selected.id,
        fen: selected.fen,
        moves: selected.moves.split(' '),
        rating: selected.rating,
        themes: selected.themes.split(','),
        description: selected.description,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch rated puzzle' });
  }
});

// GET /api/puzzles/streak
router.get('/streak', async (_req, res: Response) => {
  try {
    const puzzles = await prisma.puzzle.findMany({
      orderBy: { rating: 'asc' },
      take: 15,
    });

    const formatted = puzzles.map((p) => ({
      id: p.id,
      fen: p.fen,
      moves: p.moves.split(' '),
      rating: p.rating,
      themes: p.themes.split(','),
      description: p.description,
    }));

    return res.json({ puzzles: formatted });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch puzzle streak' });
  }
});

// POST /api/puzzles/:id/attempt
router.post('/:id/attempt', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = SubmitPuzzleAttemptSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid puzzle attempt data' });
    }

    const { puzzleId, success, timeSpentSeconds } = parsed.data;

    const puzzle = await prisma.puzzle.findUnique({ where: { id: puzzleId } });
    if (!puzzle) {
      return res.status(404).json({ error: 'Puzzle not found' });
    }

    const ratingRecord = await prisma.rating.findUnique({ where: { userId: req.user!.id } });
    const currentRating = ratingRecord?.puzzles || 1200;

    const ratingDelta = calculatePuzzleRatingChange(currentRating, puzzle.rating, success);
    const newRating = Math.max(100, currentRating + ratingDelta);

    // Save attempt and update user rating
    await prisma.$transaction([
      prisma.puzzleAttempt.create({
        data: {
          userId: req.user!.id,
          puzzleId,
          success,
          timeSpentSeconds,
          userRatingBefore: currentRating,
          ratingChange: ratingDelta,
        },
      }),
      prisma.rating.update({
        where: { userId: req.user!.id },
        data: { puzzles: newRating },
      }),
      prisma.ratingHistory.create({
        data: {
          userId: req.user!.id,
          category: 'puzzles',
          rating: newRating,
          change: ratingDelta,
        },
      }),
    ]);

    return res.json({
      success,
      ratingChange: ratingDelta,
      newRating,
    });
  } catch (err: any) {
    console.error('Puzzle attempt error:', err);
    return res.status(500).json({ error: 'Failed to record puzzle attempt' });
  }
});

export default router;
