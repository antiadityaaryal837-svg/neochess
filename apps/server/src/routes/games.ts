import { Router, Response } from 'express';
import { prisma } from '../db.js';
import { authenticateToken, AuthenticatedRequest, optionalAuthenticateToken } from '../middleware/auth.js';
import { CreateGameSchema, STANDARD_TIME_CONTROLS, BOT_PERSONAS } from '@chess/shared';
import { ChessGameEngine, getStockfishEngine } from '@chess/chess';

const router = Router();

// GET /api/games
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = Math.min(50, parseInt(req.query.limit as string || '15', 10));
    const skip = (page - 1) * limit;

    const [games, total] = await Promise.all([
      prisma.game.findMany({
        where: {
          OR: [{ whitePlayerId: req.user!.id }, { blackPlayerId: req.user!.id }],
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          whitePlayer: { select: { id: true, username: true, profile: true } },
          blackPlayer: { select: { id: true, username: true, profile: true } },
          analysis: { select: { whiteAccuracy: true, blackAccuracy: true } },
        },
      }),
      prisma.game.count({
        where: {
          OR: [{ whitePlayerId: req.user!.id }, { blackPlayerId: req.user!.id }],
        },
      }),
    ]);

    return res.json({
      games,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    console.error('Fetch games error:', err);
    return res.status(500).json({ error: 'Failed to fetch games' });
  }
});

// GET /api/games/:id
router.get('/:id', optionalAuthenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const game = await prisma.game.findUnique({
      where: { id },
      include: {
        whitePlayer: { select: { id: true, username: true, profile: true } },
        blackPlayer: { select: { id: true, username: true, profile: true } },
        moves: { orderBy: { moveNumber: 'asc' } },
        analysis: true,
      },
    });

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    return res.json({ game });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to load game details' });
  }
});

// POST /api/games (Create vs Bot or Custom Room)
router.post('/', optionalAuthenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = CreateGameSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const { timeControl, rated, variant, color, opponentType, botId } = parsed.data;
    const tcConfig = STANDARD_TIME_CONTROLS[timeControl] || STANDARD_TIME_CONTROLS['3+0'];

    let userId = req.user?.id;
    let userRating = 1200;

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { ratings: true },
      });
      if (user) {
        userRating = (user.ratings as any)?.[tcConfig.type] || 1200;
      }
    } else {
      // Auto-provision guest user for zero friction
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const guest = await prisma.user.create({
        data: {
          username: `Guest_${randomSuffix}`,
          email: `guest_${randomSuffix}_${Date.now()}@guest.neochess.local`,
          passwordHash: 'guest',
          role: 'user',
          profile: {
            create: {
              displayName: `Guest ${randomSuffix}`,
              avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=guest_${randomSuffix}`,
            },
          },
          ratings: { create: {} },
        },
      });
      userId = guest.id;
    }

    let isWhite = color === 'white';
    if (color === 'random') {
      isWhite = Math.random() < 0.5;
    }

    let isComputerOpponent = opponentType === 'computer';
    let botPersona = BOT_PERSONAS[0];
    if (isComputerOpponent && botId) {
      const found = BOT_PERSONAS.find((b: any) => b.id === botId);
      if (found) botPersona = found;
    }

    const game = await prisma.game.create({
      data: {
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        variant,
        timeControl,
        baseSeconds: tcConfig.baseSeconds,
        incrementSeconds: tcConfig.incrementSeconds,
        rated: isComputerOpponent ? false : rated,
        status: isComputerOpponent ? 'in_progress' : 'waiting',
        whitePlayerId: isWhite ? userId : null,
        whiteRating: isWhite ? userRating : botPersona.rating,
        isWhiteBot: !isWhite && isComputerOpponent,
        whiteBotName: !isWhite && isComputerOpponent ? botPersona.name : null,

        blackPlayerId: !isWhite ? userId : null,
        blackRating: !isWhite ? userRating : botPersona.rating,
        isBlackBot: isWhite && isComputerOpponent,
        blackBotName: isWhite && isComputerOpponent ? botPersona.name : null,
      },
      include: {
        whitePlayer: { select: { id: true, username: true, profile: true } },
        blackPlayer: { select: { id: true, username: true, profile: true } },
      },
    });

    return res.status(201).json({ game });
  } catch (err: any) {
    console.error('Game creation error:', err);
    return res.status(500).json({ error: 'Failed to create game' });
  }
});

// POST /api/games/:id/analyze
router.post('/:id/analyze', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const game = await prisma.game.findUnique({
      where: { id },
      include: {
        moves: { orderBy: { moveNumber: 'asc' } },
        analysis: true,
      },
    });

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Reopen previous game reviews without recalculating everything unless forced
    if (game.analysis && req.query.force !== 'true') {
      return res.json({ analysis: game.analysis, moves: game.moves });
    }

    if (!game.moves || game.moves.length === 0) {
      return res.status(400).json({ error: 'Cannot analyze a game with no moves' });
    }

    // Run real Stockfish WASM engine analysis
    const sf = getStockfishEngine();
    const report = await sf.analyzeGame(
      game.moves.map((m) => ({
        id: m.id,
        moveNumber: m.moveNumber,
        color: m.color as 'w' | 'b',
        san: m.san,
        fen: m.fen,
      })),
      10
    );

    // Update each move in database with real engine classification, eval, and recommended best move
    for (const item of report.moveAnalyses) {
      const dbMove = game.moves.find(
        (m) => m.moveNumber === item.moveNumber && m.color === item.color
      );
      if (dbMove) {
        await prisma.gameMove.update({
          where: { id: dbMove.id },
          data: {
            classification: item.classification,
            evalScore: item.whiteEval,
            bestMove: item.bestMoveSan || item.bestMove,
          },
        });
      }
    }

    // Upsert analysis record
    const analysis = await prisma.gameAnalysis.upsert({
      where: { gameId: game.id },
      create: {
        gameId: game.id,
        whiteAccuracy: report.whiteAccuracy,
        blackAccuracy: report.blackAccuracy,
        summary: report.summary,
        keyMomentsJson: JSON.stringify(report.keyMoments),
      },
      update: {
        whiteAccuracy: report.whiteAccuracy,
        blackAccuracy: report.blackAccuracy,
        summary: report.summary,
        keyMomentsJson: JSON.stringify(report.keyMoments),
      },
    });

    const updatedMoves = await prisma.gameMove.findMany({
      where: { gameId: game.id },
      orderBy: { moveNumber: 'asc' },
    });

    return res.json({ analysis, moves: updatedMoves, report });
  } catch (err: any) {
    console.error('Game analysis error:', err);
    return res.status(500).json({ error: 'Failed to analyze game' });
  }
});

export default router;
