import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { getStockfishEngine } from '@chess/chess';

dotenv.config();

const prisma = new PrismaClient();

async function processPendingAnalyses() {
  try {
    // Find unanalyzed games that have ended and have moves
    const unanalyzedGames = await prisma.game.findMany({
      where: {
        status: { in: ['checkmate', 'resigned', 'timeout', 'draw_agreed', 'stalemate'] },
        analysis: null,
      },
      include: {
        moves: { orderBy: { moveNumber: 'asc' } },
      },
      take: 5,
    });

    const sf = getStockfishEngine();

    for (const game of unanalyzedGames) {
      if (game.moves.length === 0) continue;

      console.log(`[Worker] Analyzing game ${game.id} with Stockfish 19 WASM...`);

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

      await prisma.gameAnalysis.upsert({
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

      console.log(`[Worker] Finished review for game ${game.id}`);
    }
  } catch (err) {
    console.error('[Worker] Error processing game analysis:', err);
  }
}

async function startWorker() {
  console.log('♟ NeoChess Background Engine Analysis Worker started');
  // Run loop every 15 seconds
  setInterval(processPendingAnalyses, 15000);
  await processPendingAnalyses();
}

startWorker();
