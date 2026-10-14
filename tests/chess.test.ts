import { describe, it, expect } from 'vitest';
import { ChessGameEngine, calculateMatchRatings, calculatePuzzleRatingChange, generateChess960Fen, classifyMove, calculateAccuracy } from '@chess/chess';

describe('Authoritative Chess Game Engine', () => {
  it('initializes standard starting position', () => {
    const engine = new ChessGameEngine('standard');
    expect(engine.getFen()).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    expect(engine.getTurn()).toBe('w');
    expect(engine.isGameOver()).toBe(false);
  });

  it('validates legal opening moves and rejects illegal moves', () => {
    const engine = new ChessGameEngine('standard');
    
    // Legal pawn move e2 -> e4
    const res1 = engine.makeMove('e2', 'e4');
    expect(res1.success).toBe(true);
    expect(res1.moveRecord?.san).toBe('e4');
    expect(engine.getTurn()).toBe('b');

    // Illegal move: moving pawn backwards e4 -> e3 on Black turn
    const res2 = engine.makeMove('e4', 'e3');
    expect(res2.success).toBe(false);

    // Legal black move e7 -> e5
    const res3 = engine.makeMove('e7', 'e5');
    expect(res3.success).toBe(true);
    expect(res3.moveRecord?.san).toBe('e5');
  });

  it('detects Scholar Mate checkmate authoritatively', () => {
    const engine = new ChessGameEngine('standard');
    engine.makeMove('e2', 'e4');
    engine.makeMove('e7', 'e5');
    engine.makeMove('f1', 'c4');
    engine.makeMove('b8', 'c6');
    engine.makeMove('d1', 'h5');
    engine.makeMove('g8', 'f6');
    
    // Qxf7# delivers checkmate
    const mateMove = engine.makeMove('h5', 'f7');
    expect(mateMove.success).toBe(true);
    expect(mateMove.moveRecord?.san).toBe('Qxf7#');
    expect(engine.isGameOver()).toBe(true);

    const status = engine.evaluateStatus();
    expect(status.status).toBe('checkmate');
    expect(status.result).toBe('1-0');
    expect(status.winner).toBe('w');
  });

  it('detects King of the Hill win condition', () => {
    // White King reaches e4
    const engine = new ChessGameEngine('king_of_the_hill');
    expect(engine.isGameOver()).toBe(false);

    // Load position where white king is on e3 and moves to e4
    const hillEngine = new ChessGameEngine('king_of_the_hill', 'rnbqkbnr/pppppppp/8/8/8/4K3/PPPPPPPP/RNBQ1BNR w KQkq - 0 1');
    const move = hillEngine.makeMove('e3', 'e4');
    expect(move.success).toBe(true);
    expect(hillEngine.isGameOver()).toBe(true);

    const evalRes = hillEngine.evaluateStatus();
    expect(evalRes.winner).toBe('w');
    expect(evalRes.winReason).toContain('King of the Hill');
  });

  it('generates valid Chess960 Fischer Random position', () => {
    const fen = generateChess960Fen();
    expect(fen).toContain('w KQkq - 0 1');
    
    // Check that engine can successfully parse and initialize with this Chess960 fen
    const engine = new ChessGameEngine('chess960', fen);
    expect(engine.isGameOver()).toBe(false);
    expect(engine.getLegalMoves().length).toBeGreaterThan(0);
  });
});

describe('Rating System & Fair Play Mathematics', () => {
  it('updates ratings correctly for white win between equal players', () => {
    const ratings = calculateMatchRatings(1500, 1500, 1);
    expect(ratings.playerDelta).toBeGreaterThan(0);
    expect(ratings.opponentDelta).toBeLessThan(0);
    expect(ratings.playerDelta).toBe(Math.abs(ratings.opponentDelta));
  });

  it('updates ratings correctly for upset win (underdog defeats favorite)', () => {
    // Underdog (1200) beats favorite (1800)
    const ratings = calculateMatchRatings(1200, 1800, 1);
    expect(ratings.playerDelta).toBeGreaterThan(20);
  });

  it('calculates puzzle rating changes based on difficulty', () => {
    // Solving a higher rated puzzle gives higher reward
    const deltaHard = calculatePuzzleRatingChange(1200, 1600, true);
    const deltaEasy = calculatePuzzleRatingChange(1200, 1000, true);
    expect(deltaHard).toBeGreaterThan(deltaEasy);

    // Failing an easy puzzle penalizes more than failing a hard puzzle
    const failEasy = calculatePuzzleRatingChange(1200, 1000, false);
    const failHard = calculatePuzzleRatingChange(1200, 1600, false);
    expect(failEasy).toBeLessThan(failHard);
  });
});

describe('Stockfish Evaluation & Move Classification', () => {
  it('classifies top engine move as best or brilliant', () => {
    expect(classifyMove(100, 150, true, true)).toBe('brilliant');
    expect(classifyMove(100, 100, true, false)).toBe('best');
  });

  it('detects inaccuracies, mistakes and blunders by centipawn loss', () => {
    expect(classifyMove(200, 185, false)).toBe('excellent');
    expect(classifyMove(200, 160, false)).toBe('good');
    expect(classifyMove(200, 80, false)).toBe('inaccuracy');
    expect(classifyMove(200, -50, false)).toBe('mistake');
    expect(classifyMove(200, -250, false)).toBe('blunder');
  });

  it('computes accuracy percentage within 0-100 range', () => {
    expect(calculateAccuracy([0, 0, 0])).toBe(100);
    expect(calculateAccuracy([150, 200, 300])).toBeLessThan(80);
    expect(calculateAccuracy([150, 200, 300])).toBeGreaterThan(30);
  });
});
