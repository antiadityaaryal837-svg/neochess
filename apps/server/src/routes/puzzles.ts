import { Router, Response } from 'express';
import { prisma } from '../db.js';
import { authenticateToken, AuthenticatedRequest, optionalAuthenticateToken } from '../middleware/auth.js';
import { SubmitPuzzleAttemptSchema } from '@chess/shared';
import { calculatePuzzleRatingChange } from '@chess/chess';

const router = Router();

// GET /api/puzzles/daily - Today's official daily puzzle
router.get('/daily', async (_req, res: Response) => {
  try {
    const totalPuzzles = await prisma.puzzle.count();
    if (totalPuzzles === 0) {
      return res.status(404).json({ error: 'No puzzles available in database' });
    }

    // Deterministic selection based on calendar day (YYYYMMDD)
    const today = new Date();
    const daySeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const skip = daySeed % totalPuzzles;

    const puzzle = await prisma.puzzle.findFirst({
      skip,
      take: 1,
    });

    if (!puzzle) {
      return res.status(404).json({ error: 'Daily puzzle not found' });
    }

    return res.json({
      puzzle: {
        id: puzzle.id,
        fen: puzzle.fen,
        moves: puzzle.moves.split(/\s+/),
        rating: puzzle.rating,
        themes: puzzle.themes.split(',').map((t) => t.trim()),
        description: puzzle.description || 'Solve the daily tactical challenge!',
      },
    });
  } catch (err: any) {
    console.error('Failed to fetch daily puzzle:', err);
    return res.status(500).json({ error: 'Failed to fetch daily puzzle' });
  }
});

// GET /api/puzzles/rated - Tailored to current user puzzle rating
router.get('/rated', optionalAuthenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    let userRating = 1200;
    if (req.user) {
      const userRatings = await prisma.rating.findUnique({ where: { userId: req.user.id } });
      if (userRatings) {
        userRating = userRatings.puzzles;
      }
    }

    // Query puzzles close to user rating (+/- 250)
    const ratingMin = Math.max(300, userRating - 250);
    const ratingMax = userRating + 250;

    const count = await prisma.puzzle.count({
      where: {
        rating: { gte: ratingMin, lte: ratingMax },
      },
    });

    let selected;
    if (count > 0) {
      const randomSkip = Math.floor(Math.random() * count);
      selected = await prisma.puzzle.findFirst({
        where: { rating: { gte: ratingMin, lte: ratingMax } },
        skip: randomSkip,
        take: 1,
      });
    } else {
      // Fallback to any puzzle
      const total = await prisma.puzzle.count();
      if (total === 0) return res.status(404).json({ error: 'No puzzles available' });
      const randomSkip = Math.floor(Math.random() * total);
      selected = await prisma.puzzle.findFirst({ skip: randomSkip, take: 1 });
    }

    if (!selected) {
      return res.status(404).json({ error: 'Puzzle not found' });
    }

    return res.json({
      puzzle: {
        id: selected.id,
        fen: selected.fen,
        moves: selected.moves.split(/\s+/),
        rating: selected.rating,
        themes: selected.themes.split(',').map((t) => t.trim()),
        description: selected.description,
      },
    });
  } catch (err: any) {
    console.error('Failed to fetch rated puzzle:', err);
    return res.status(500).json({ error: 'Failed to fetch rated puzzle' });
  }
});

// GET /api/puzzles/random - Random puzzle with optional theme and rating filters
router.get('/random', async (req, res: Response) => {
  try {
    const { theme, minRating, maxRating } = req.query;

    const whereClause: any = {};
    if (theme && typeof theme === 'string') {
      whereClause.themes = { contains: theme.trim() };
    }
    if (minRating || maxRating) {
      whereClause.rating = {};
      if (minRating) whereClause.rating.gte = parseInt(minRating as string, 10);
      if (maxRating) whereClause.rating.lte = parseInt(maxRating as string, 10);
    }

    const count = await prisma.puzzle.count({ where: whereClause });
    if (count === 0) {
      // If no matching puzzles with strict filter, fallback to any random puzzle
      const anyCount = await prisma.puzzle.count();
      if (anyCount === 0) return res.status(404).json({ error: 'No puzzles available' });
      const randomSkip = Math.floor(Math.random() * anyCount);
      const puzzle = await prisma.puzzle.findFirst({ skip: randomSkip, take: 1 });
      return res.json({ puzzle });
    }

    const randomSkip = Math.floor(Math.random() * count);
    const puzzle = await prisma.puzzle.findFirst({
      where: whereClause,
      skip: randomSkip,
      take: 1,
    });

    if (!puzzle) return res.status(404).json({ error: 'Puzzle not found' });

    return res.json({
      puzzle: {
        id: puzzle.id,
        fen: puzzle.fen,
        moves: puzzle.moves.split(/\s+/),
        rating: puzzle.rating,
        themes: puzzle.themes.split(',').map((t) => t.trim()),
        description: puzzle.description,
      },
    });
  } catch (err: any) {
    console.error('Failed to fetch random puzzle:', err);
    return res.status(500).json({ error: 'Failed to fetch random puzzle' });
  }
});

// GET /api/puzzles/rush - Returns 30 puzzles with ascending difficulty for Puzzle Rush
router.get('/rush', async (_req, res: Response) => {
  try {
    // Generate an ascending ladder: 400 to 2500 in 15-30 increments
    const puzzles = await prisma.puzzle.findMany({
      orderBy: { rating: 'asc' },
      take: 40,
    });

    const formatted = puzzles.map((p) => ({
      id: p.id,
      fen: p.fen,
      moves: p.moves.split(/\s+/),
      rating: p.rating,
      themes: p.themes.split(',').map((t) => t.trim()),
      description: p.description,
    }));

    return res.json({ puzzles: formatted });
  } catch (err: any) {
    console.error('Failed to fetch rush puzzles:', err);
    return res.status(500).json({ error: 'Failed to load Puzzle Rush' });
  }
});

// GET /api/puzzles/streak - Puzzle streak ladder
router.get('/streak', async (_req, res: Response) => {
  try {
    const puzzles = await prisma.puzzle.findMany({
      orderBy: { rating: 'asc' },
      take: 25,
    });

    const formatted = puzzles.map((p) => ({
      id: p.id,
      fen: p.fen,
      moves: p.moves.split(/\s+/),
      rating: p.rating,
      themes: p.themes.split(',').map((t) => t.trim()),
      description: p.description,
    }));

    return res.json({ puzzles: formatted });
  } catch (err: any) {
    console.error('Failed to fetch puzzle streak:', err);
    return res.status(500).json({ error: 'Failed to fetch puzzle streak' });
  }
});

// GET /api/puzzles/themes - Available tactical themes and summary
router.get('/themes', async (_req, res: Response) => {
  try {
    const themesList = [
      { id: 'fork', name: 'Forks', description: 'One piece attacks two or more enemy pieces simultaneously' },
      { id: 'pin', name: 'Pins', description: 'A piece cannot move because it would expose a more valuable piece' },
      { id: 'skewer', name: 'Skewers', description: 'Attack through a valuable piece to win a piece behind it' },
      { id: 'discoveredAttack', name: 'Discovered Attacks', description: 'Moving one piece unleashes an attack from another' },
      { id: 'doubleCheck', name: 'Double Checks', description: 'Two pieces deliver check at the same time' },
      { id: 'deflection', name: 'Deflections', description: 'Forcing an opponent piece away from a vital square' },
      { id: 'decoy', name: 'Decoys', description: 'Luring an enemy piece onto a vulnerable square' },
      { id: 'sacrifice', name: 'Sacrifices', description: 'Deliberately giving up material for a decisive tactical gain' },
      { id: 'backRankMate', name: 'Back-Rank Mates', description: 'Mating the enemy king trapped behind its own pawns' },
      { id: 'mateIn1', name: 'Mate in 1', description: 'Find the immediate checkmate in one single move' },
      { id: 'zwischenzug', name: 'Zwischenzug', description: 'An unexpected in-between move that completely changes the evaluation' },
      { id: 'attraction', name: 'Attraction', description: 'Drawing the king or queen into a mating net or trap' },
      { id: 'clearance', name: 'Clearance', description: 'Vacating a square or diagonal for a decisive attack' },
      { id: 'interference', name: 'Interference', description: 'Blocking the line of communication between enemy defenders' },
      { id: 'endgame', name: 'Endgame Tactics', description: 'Crucial tactical precision in simplified positions' },
    ];

    return res.json({ themes: themesList });
  } catch (err: any) {
    console.error('Failed to fetch themes:', err);
    return res.status(500).json({ error: 'Failed to fetch themes' });
  }
});

// GET /api/puzzles/history - Personal puzzle history for authenticated user
router.get('/history', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const attempts = await prisma.puzzleAttempt.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        puzzle: {
          select: {
            id: true,
            rating: true,
            themes: true,
            fen: true,
          },
        },
      },
    });

    const totalSolved = attempts.filter((a) => a.success).length;
    const totalAttempts = attempts.length;
    const winRate = totalAttempts > 0 ? Math.round((totalSolved / totalAttempts) * 100) : 0;

    return res.json({
      attempts,
      stats: {
        totalAttempts,
        totalSolved,
        winRate,
      },
    });
  } catch (err: any) {
    console.error('Failed to fetch puzzle history:', err);
    return res.status(500).json({ error: 'Failed to fetch puzzle history' });
  }
});

// GET /api/puzzles/recommendations - Recommends puzzles based on recent user mistakes
router.get('/recommendations', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Find recent failed puzzle attempts
    const failedAttempts = await prisma.puzzleAttempt.findMany({
      where: { userId, success: false },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { puzzle: true },
    });

    // Extract missed themes
    const missedThemeCounts: Record<string, number> = {};
    for (const attempt of failedAttempts) {
      const themes = attempt.puzzle.themes.split(',');
      for (const t of themes) {
        const clean = t.trim();
        if (clean && clean !== 'advantage' && clean !== 'short' && clean !== 'long') {
          missedThemeCounts[clean] = (missedThemeCounts[clean] || 0) + 1;
        }
      }
    }

    // Top missed theme
    const topMissedTheme = Object.entries(missedThemeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'fork';

    // Recommend 5 puzzles for that theme
    const recommendations = await prisma.puzzle.findMany({
      where: { themes: { contains: topMissedTheme } },
      take: 5,
    });

    return res.json({
      recommendedTheme: topMissedTheme,
      puzzles: recommendations.map((p) => ({
        id: p.id,
        fen: p.fen,
        moves: p.moves.split(/\s+/),
        rating: p.rating,
        themes: p.themes.split(','),
        description: p.description,
      })),
    });
  } catch (err: any) {
    console.error('Failed to fetch recommendations:', err);
    return res.status(500).json({ error: 'Failed to fetch puzzle recommendations' });
  }
});

// POST /api/puzzles/rush-score - Save Puzzle Rush / Survival score
router.post('/rush-score', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { score, mode } = req.body;

    if (typeof score !== 'number' || score < 0) {
      return res.status(400).json({ error: 'Invalid score' });
    }

    const saved = await prisma.puzzleRushScore.create({
      data: {
        userId,
        score,
        mode: mode || '3min',
      },
    });

    return res.status(201).json({ score: saved });
  } catch (err: any) {
    console.error('Failed to save puzzle rush score:', err);
    return res.status(500).json({ error: 'Failed to save score' });
  }
});

// GET /api/puzzles/leaderboard - Puzzle Leaderboards
router.get('/leaderboard', async (_req, res: Response) => {
  try {
    const topRatings = await prisma.rating.findMany({
      orderBy: { puzzles: 'desc' },
      take: 10,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profile: { select: { avatarUrl: true, country: true } },
          },
        },
      },
    });

    const topRush = await prisma.puzzleRushScore.findMany({
      orderBy: { score: 'desc' },
      take: 10,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profile: { select: { avatarUrl: true, country: true } },
          },
        },
      },
    });

    return res.json({
      ratingLeaderboard: topRatings.map((r) => ({
        userId: r.userId,
        username: r.user.username,
        rating: r.puzzles,
        avatarUrl: r.user.profile?.avatarUrl,
        country: r.user.profile?.country,
      })),
      rushLeaderboard: topRush.map((r) => ({
        userId: r.userId,
        username: r.user.username,
        score: r.score,
        mode: r.mode,
        avatarUrl: r.user.profile?.avatarUrl,
        date: r.createdAt,
      })),
    });
  } catch (err: any) {
    console.error('Failed to fetch puzzle leaderboard:', err);
    return res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// POST /api/puzzles/:id/attempt - Record puzzle attempt and update Elo rating
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

    // Save attempt and update user rating atomically
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
      prisma.rating.upsert({
        where: { userId: req.user!.id },
        create: {
          userId: req.user!.id,
          bullet: 1200,
          blitz: 1200,
          rapid: 1200,
          classical: 1200,
          puzzles: newRating,
        },
        update: { puzzles: newRating },
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
      solutionMoves: puzzle.moves.split(/\s+/),
      themes: puzzle.themes.split(','),
    });
  } catch (err: any) {
    console.error('Puzzle attempt error:', err);
    return res.status(500).json({ error: 'Failed to record puzzle attempt' });
  }
});

export default router;
