import { describe, it, expect } from 'vitest';
import { getStockfishEngine } from '@chess/chess';

describe('Stockfish WASM Engine & UCI Protocol Integration', () => {
  it('initializes Stockfish WASM and answers UCI ready probe', async () => {
    const sf = getStockfishEngine();
    await sf.init();
    expect(sf).toBeDefined();
  }, 20000);

  it('evaluates starting position with normalized White perspective', async () => {
    const sf = getStockfishEngine();
    const result = await sf.evaluatePosition('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 6);
    
    expect(result).toBeDefined();
    expect(result.bestMove).toBeDefined();
    expect(typeof result.whiteScoreCentipawns).toBe('number');
    // Starting position eval should be near 0 (+/- 60 cp)
    expect(result.whiteScoreCentipawns!).toBeGreaterThan(-60);
    expect(result.whiteScoreCentipawns!).toBeLessThan(60);
  }, 25000);

  it('normalizes evaluation to White perspective when Black is to move with advantage', async () => {
    const sf = getStockfishEngine();
    // Position where Black has huge material advantage (extra Queen and Rook)
    // Black turn
    const blackAheadFen = 'rnb1kbnr/pppppppp/8/8/8/8/PPPPPPPP/4K3 b kq - 0 1';
    const result = await sf.evaluatePosition(blackAheadFen, 6);

    expect(result.whiteScoreCentipawns).toBeDefined();
    // Since Black is winning, normalized White-perspective score MUST be strongly negative
    expect(result.whiteScoreCentipawns!).toBeLessThan(-500);
  }, 25000);

  it('detects forced mate with correct White perspective sign', async () => {
    const sf = getStockfishEngine();
    // Scholar's Mate position: White to play Qxf7# (mate in 1)
    const mateIn1Fen = 'r1bqkb1r/pppp1ppp/2n5/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4';
    const result = await sf.evaluatePosition(mateIn1Fen, 8);

    expect(result.whiteMateInMoves).toBe(1);
    expect(result.bestMove).toBe('h5f7');
  }, 25000);

  it('analyzes a short game move-by-move and computes CAPS accuracy', async () => {
    const sf = getStockfishEngine();
    // Fool's mate: 1. f3 e5 2. g4 Qh4#
    const moves = [
      {
        moveNumber: 1,
        color: 'w' as const,
        san: 'f3',
        fen: 'rnbqkbnr/pppppppp/8/8/5P2/8/PPPPP1PP/RNBQKBNR b KQkq - 0 1',
      },
      {
        moveNumber: 1,
        color: 'b' as const,
        san: 'e5',
        fen: 'rnbqkbnr/pppp1ppp/8/4p3/5P2/8/PPPPP1PP/RNBQKBNR w KQkq e6 0 2',
      },
      {
        moveNumber: 2,
        color: 'w' as const,
        san: 'g4',
        fen: 'rnbqkbnr/pppp1ppp/8/4p3/5PP1/8/PPPPP2P/RNBQKBNR b KQkq g3 0 2',
      },
      {
        moveNumber: 2,
        color: 'b' as const,
        san: 'Qh4#',
        fen: 'rnb1kbnr/pppp1ppp/8/4p3/5PPq/8/PPPPP2P/RNBQKBNR w KQkq - 1 3',
      },
    ];

    const analysis = await sf.analyzeGame(moves, 4);
    expect(analysis).toBeDefined();
    expect(analysis.moveAnalyses.length).toBe(4);
    expect(analysis.whiteAccuracy).toBeGreaterThanOrEqual(0);
    expect(analysis.whiteAccuracy).toBeLessThanOrEqual(100);
    expect(analysis.blackAccuracy).toBeGreaterThanOrEqual(0);
    expect(analysis.blackAccuracy).toBeLessThanOrEqual(100);
    // Black played winning checkmate move
    expect(analysis.blackAccuracy).toBeGreaterThan(60);
  }, 35000);

  it('calculates legal calibrated bot moves for beginner bot with quick response', async () => {
    const sf = getStockfishEngine();
    const fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
    const move = await sf.getBotMove(fen, {
      skillLevel: 1,
      depth: 2,
      uciElo: 400,
      blunderPercent: 10,
    });

    expect(move).toBeDefined();
    expect(move.from).toBeDefined();
    expect(move.to).toBeDefined();
    expect(move.san).toBeDefined();
    expect(move.uci).toBeDefined();
    expect(move.from.length).toBe(2);
    expect(move.to.length).toBe(2);
  }, 20000);

  it('calculates master bot move spotting immediate checkmate', async () => {
    const sf = getStockfishEngine();
    // Scholar's Mate: Qxf7#
    const mateIn1Fen = 'r1bqkb1r/pppp1ppp/2n5/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4';
    const move = await sf.getBotMove(mateIn1Fen, {
      skillLevel: 20,
      depth: 6,
      uciElo: 2400,
      blunderPercent: 0,
    });

    expect(move).toBeDefined();
    expect(move.from).toBe('h5');
    expect(move.to).toBe('f7');
    expect(move.san).toContain('#');
  }, 20000);
});

