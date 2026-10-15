import { Chess } from 'chess.js';
import { MoveClassification } from '@chess/shared';

// Type declaration for the stockfish npm package
interface StockfishInstance {
  processCommand(cmd: string): void;
  terminate(): void;
}

type StockfishFactory = (listener: (line: string) => void) => StockfishInstance;

export interface EngineEvaluation {
  depth: number;
  scoreCentipawns?: number; // From perspective of side to move
  mateInMoves?: number;     // From perspective of side to move
  whiteScoreCentipawns?: number; // Normalized to White: positive = White advantage
  whiteMateInMoves?: number;     // Normalized to White: positive = White mates
  bestMove: string;         // UCI format (e.g. 'e2e4')
  bestMoveSan?: string;     // SAN format (e.g. 'e4')
  ponderMove?: string;
  pv: string[];             // Principal variation in UCI
  pvSan?: string[];         // Principal variation in SAN
}

export interface MoveAnalysis {
  moveNumber: number;
  color: 'w' | 'b';
  san: string;
  uci?: string;
  fenBefore: string;
  fenAfter: string;
  evalBefore: EngineEvaluation;
  evalAfter: EngineEvaluation;
  whiteEval: number;         // Normalized White score centipawns
  mateInMoves?: number;      // Normalized White mate
  centipawnLoss: number;
  classification: MoveClassification;
  bestMove: string;
  bestMoveSan: string;
  comment?: string;
}

export interface GameReviewReport {
  whiteAccuracy: number;
  blackAccuracy: number;
  moveAnalyses: MoveAnalysis[];
  keyMoments: Array<{
    moveNumber: number;
    color: 'w' | 'b';
    san: string;
    classification: MoveClassification;
    comment: string;
    whiteEval: number;
    mateInMoves?: number;
    bestMoveSan?: string;
  }>;
  classificationCounts: {
    white: Record<MoveClassification, number>;
    black: Record<MoveClassification, number>;
  };
  summary: string;
}

/**
 * Normalizes an evaluation to White's perspective:
 * Positive = White advantage / White mate
 * Negative = Black advantage / Black mate
 */
export function normalizeEvalToWhite(
  score: { scoreCentipawns?: number; mateInMoves?: number },
  turn: 'w' | 'b'
): { whiteScoreCentipawns?: number; whiteMateInMoves?: number } {
  if (score.mateInMoves !== undefined) {
    return {
      whiteMateInMoves: turn === 'w' ? score.mateInMoves : -score.mateInMoves,
    };
  }

  if (score.scoreCentipawns !== undefined) {
    return {
      whiteScoreCentipawns: turn === 'w' ? score.scoreCentipawns : -score.scoreCentipawns,
    };
  }

  return { whiteScoreCentipawns: 0 };
}

/**
 * Classifies a move based on centipawn loss and tactical context
 */
export function classifyMove(
  evalBeforeMover: number,
  evalAfterMover: number,
  isBestMove: boolean,
  isSacrifice: boolean = false,
  mateBeforeMover?: number,
  mateAfterMover?: number
): { classification: MoveClassification; comment?: string } {
  // If player had a forced mate and lost it
  if (mateBeforeMover !== undefined && mateBeforeMover > 0) {
    if (mateAfterMover === undefined || mateAfterMover <= 0) {
      return { classification: 'missed_win', comment: 'Missed forced checkmate sequence' };
    }
  }

  // If player had a completely winning position (> +300 cp) and lost the win (<= 100 cp)
  if (evalBeforeMover >= 300 && evalAfterMover <= 100) {
    return { classification: 'missed_win', comment: 'Missed winning tactical opportunity' };
  }

  if (isBestMove) {
    if (isSacrifice && evalAfterMover >= evalBeforeMover - 30) {
      return { classification: 'brilliant', comment: 'Brilliant tactical sacrifice!' };
    }
    return { classification: 'best', comment: 'Engine top recommendation' };
  }

  const loss = Math.max(0, evalBeforeMover - evalAfterMover);

  if (loss <= 15) return { classification: 'great', comment: 'Great find' };
  if (loss <= 30) return { classification: 'excellent', comment: 'Strong, accurate move' };
  if (loss <= 65) return { classification: 'good', comment: 'Solid move keeping the balance' };
  if (loss <= 140) return { classification: 'inaccuracy', comment: `Inaccuracy: dropped ${loss} centipawns` };
  if (loss <= 280) return { classification: 'mistake', comment: `Mistake: concessions made (${loss} cp loss)` };
  return { classification: 'blunder', comment: `Blunder: severe error losing ${loss} centipawns` };
}

/**
 * Converts winning probability from centipawn score:
 * Win probability formula based on standard logistic curve
 */
export function winProbability(cp: number): number {
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * cp)) - 1);
}

/**
 * Calculate overall accuracy percentage (0-100) from an array of move losses
 * Using standard evaluation-based CAPS formula
 */
export function calculateAccuracy(centipawnLosses: number[]): number {
  if (centipawnLosses.length === 0) return 100;

  const totalAcc = centipawnLosses.reduce((acc, loss) => {
    const moveAcc = Math.max(0, Math.min(100, 100 * Math.exp(-0.0035 * loss)));
    return acc + moveAcc;
  }, 0);

  return Math.round((totalAcc / centipawnLosses.length) * 10) / 10;
}

/**
 * Helper to convert UCI move (e.g. 'e2e4') to SAN (e.g. 'e4') given a FEN position
 */
export function uciToSan(fen: string, uci: string): string {
  if (!uci || uci.length < 4) return uci || '';
  try {
    const chess = new Chess(fen);
    const from = uci.slice(0, 2);
    const to = uci.slice(2, 4);
    const promotion = uci.length > 4 ? uci[4] : undefined;
    const res = chess.move({ from, to, promotion });
    return res ? res.san : uci;
  } catch {
    return uci;
  }
}

/**
 * StockfishEngine: Manages local Stockfish 19 WASM engine execution via UCI protocol
 */
export class StockfishEngine {
  private engineInstance: StockfishInstance | null = null;
  private isReadyPromise: Promise<void> | null = null;
  private queue: Array<() => Promise<void>> = [];
  private isProcessingQueue = false;

  private currentResolve: ((result: EngineEvaluation) => void) | null = null;
  private currentInfo: Partial<EngineEvaluation> = {};
  private currentTurn: 'w' | 'b' = 'w';

  constructor() {}

  public async init(): Promise<void> {
    if (this.isReadyPromise) return this.isReadyPromise;

    this.isReadyPromise = (async () => {
      try {
        const stockfishModule = await import('stockfish');
        const factory: StockfishFactory = (stockfishModule as any).default || stockfishModule;

        this.engineInstance = factory((line: string) => {
          this.handleEngineLine(line);
        });

        this.engineInstance.processCommand('uci');
        this.engineInstance.processCommand('isready');
      } catch (err) {
        console.error('Failed to initialize Stockfish WASM engine:', err);
        throw err;
      }
    })();

    return this.isReadyPromise;
  }

  private handleEngineLine(line: string): void {
    if (line.startsWith('info ') && line.includes('score ')) {
      const depthMatch = line.match(/depth\s+(\d+)/);
      const cpMatch = line.match(/score\s+cp\s+(-?\d+)/);
      const mateMatch = line.match(/score\s+mate\s+(-?\d+)/);
      const pvMatch = line.match(/\spv\s+(.+)$/);

      if (depthMatch) {
        this.currentInfo.depth = parseInt(depthMatch[1], 10);
      }
      if (cpMatch) {
        this.currentInfo.scoreCentipawns = parseInt(cpMatch[1], 10);
        delete this.currentInfo.mateInMoves;
      }
      if (mateMatch) {
        this.currentInfo.mateInMoves = parseInt(mateMatch[1], 10);
        delete this.currentInfo.scoreCentipawns;
      }
      if (pvMatch) {
        this.currentInfo.pv = pvMatch[1].trim().split(/\s+/);
      }
    }

    if (line.startsWith('bestmove')) {
      const parts = line.split(/\s+/);
      const bestMove = parts[1] || '';
      const ponderMove = parts[2] === 'ponder' ? parts[3] : undefined;

      const norm = normalizeEvalToWhite(
        {
          scoreCentipawns: this.currentInfo.scoreCentipawns,
          mateInMoves: this.currentInfo.mateInMoves,
        },
        this.currentTurn
      );

      const evaluation: EngineEvaluation = {
        depth: this.currentInfo.depth || 10,
        scoreCentipawns: this.currentInfo.scoreCentipawns ?? 0,
        mateInMoves: this.currentInfo.mateInMoves,
        whiteScoreCentipawns: norm.whiteScoreCentipawns,
        whiteMateInMoves: norm.whiteMateInMoves,
        bestMove,
        ponderMove,
        pv: this.currentInfo.pv || [bestMove],
      };

      if (this.currentResolve) {
        const resolve = this.currentResolve;
        this.currentResolve = null;
        this.currentInfo = {};
        resolve(evaluation);
      }
    }
  }

  /**
   * Enqueues an engine task so UCI requests do not collide
   */
  private runQueued<T>(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const res = await task();
          resolve(res);
        } catch (err) {
          reject(err);
        }
      });
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;

    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        try {
          await task();
        } catch (e) {
          console.error('Stockfish queue task error:', e);
        }
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Evaluates a single FEN position using Stockfish
   */
  public async evaluatePosition(fen: string, depth: number = 10): Promise<EngineEvaluation> {
    await this.init();

    return this.runQueued<EngineEvaluation>(() => {
      return new Promise<EngineEvaluation>((resolve, reject) => {
        if (!this.engineInstance) {
          return reject(new Error('Stockfish instance not initialized'));
        }

        // Determine turn from FEN
        const parts = fen.trim().split(/\s+/);
        this.currentTurn = (parts[1] === 'b' ? 'b' : 'w') as 'w' | 'b';
        this.currentInfo = {};
        this.currentResolve = (evalResult) => {
          // Convert bestMove and PV to SAN
          evalResult.bestMoveSan = uciToSan(fen, evalResult.bestMove);
          if (evalResult.pv && evalResult.pv.length > 0) {
            evalResult.pvSan = [];
            let tempFen = fen;
            for (const moveUci of evalResult.pv.slice(0, 5)) {
              const san = uciToSan(tempFen, moveUci);
              evalResult.pvSan.push(san);
              try {
                const c = new Chess(tempFen);
                const r = c.move({
                  from: moveUci.slice(0, 2),
                  to: moveUci.slice(2, 4),
                  promotion: moveUci.length > 4 ? moveUci[4] : undefined,
                });
                if (r) tempFen = c.fen();
              } catch {
                break;
              }
            }
          }
          resolve(evalResult);
        };

        // Send UCI position and depth
        this.engineInstance.processCommand(`position fen ${fen}`);
        this.engineInstance.processCommand(`go depth ${depth}`);
      });
    });
  }

  /**
   * Calculates a genuine bot move calibrated to engine Skill Level, UCI_Elo, and depth
   */
  public async getBotMove(
    fen: string,
    options: {
      skillLevel?: number;
      depth?: number;
      uciElo?: number;
      blunderPercent?: number;
      maxThinkingMs?: number;
    } = {}
  ): Promise<{
    from: string;
    to: string;
    promotion?: string;
    san: string;
    uci: string;
  }> {
    await this.init();

    const chess = new Chess(fen);
    const legalMoves = chess.moves({ verbose: true });
    if (legalMoves.length === 0) {
      throw new Error('No legal moves available in position');
    }

    const blunderPercent = options.blunderPercent ?? 0;
    const shouldBlunder = blunderPercent > 0 && Math.random() * 100 < blunderPercent;

    if (shouldBlunder && legalMoves.length > 1) {
      // Pick a non-checkmating, casual legal move to simulate beginner play
      const nonMates = legalMoves.filter((m) => !m.san.includes('#'));
      const candidateMoves = nonMates.length > 0 ? nonMates : legalMoves;
      const randomMove = candidateMoves[Math.floor(Math.random() * candidateMoves.length)];
      return {
        from: randomMove.from,
        to: randomMove.to,
        promotion: randomMove.promotion,
        san: randomMove.san,
        uci: `${randomMove.from}${randomMove.to}${randomMove.promotion || ''}`,
      };
    }

    const skillLevel = Math.max(0, Math.min(20, options.skillLevel ?? 10));
    const depth = Math.max(1, Math.min(24, options.depth ?? 8));
    const uciElo = options.uciElo;
    const maxThinkingMs = options.maxThinkingMs;

    return this.runQueued<{
      from: string;
      to: string;
      promotion?: string;
      san: string;
      uci: string;
    }>(() => {
      return new Promise((resolve) => {
        if (!this.engineInstance) {
          // Fallback if engine unavailable
          const fallback = legalMoves[0];
          return resolve({
            from: fallback.from,
            to: fallback.to,
            promotion: fallback.promotion,
            san: fallback.san,
            uci: `${fallback.from}${fallback.to}${fallback.promotion || ''}`,
          });
        }

        const parts = fen.trim().split(/\s+/);
        this.currentTurn = (parts[1] === 'b' ? 'b' : 'w') as 'w' | 'b';
        this.currentInfo = {};

        this.currentResolve = (evalResult) => {
          const uci = evalResult.bestMove;
          if (uci && uci.length >= 4) {
            const from = uci.slice(0, 2);
            const to = uci.slice(2, 4);
            const promotion = uci.length > 4 ? uci[4] : undefined;

            try {
              const testChess = new Chess(fen);
              const applied = testChess.move({ from, to, promotion });
              if (applied) {
                return resolve({
                  from,
                  to,
                  promotion,
                  san: applied.san,
                  uci,
                });
              }
            } catch (err) {
              console.warn('Stockfish suggested unparseable move:', uci, err);
            }
          }

          // Safe fallback to first legal move
          const safeMove = legalMoves[0];
          resolve({
            from: safeMove.from,
            to: safeMove.to,
            promotion: safeMove.promotion,
            san: safeMove.san,
            uci: `${safeMove.from}${safeMove.to}${safeMove.promotion || ''}`,
          });
        };

        // Configure Stockfish UCI Options
        this.engineInstance.processCommand(`setoption name Skill Level value ${skillLevel}`);
        if (uciElo && uciElo >= 1320) {
          this.engineInstance.processCommand(`setoption name UCI_LimitStrength value true`);
          this.engineInstance.processCommand(`setoption name UCI_Elo value ${Math.min(3190, uciElo)}`);
        } else {
          this.engineInstance.processCommand(`setoption name UCI_LimitStrength value false`);
        }

        this.engineInstance.processCommand(`position fen ${fen}`);
        if (maxThinkingMs && maxThinkingMs > 0) {
          this.engineInstance.processCommand(`go depth ${depth} movetime ${maxThinkingMs}`);
        } else {
          this.engineInstance.processCommand(`go depth ${depth}`);
        }
      });
    });
  }

  /**
   * Replays an entire game and performs full move-by-move Stockfish analysis
   */
  public async analyzeGame(
    moves: Array<{
      id?: string;
      moveNumber: number;
      color: 'w' | 'b';
      san: string;
      fen: string;
    }>,
    depth: number = 8
  ): Promise<GameReviewReport> {
    await this.init();

    const moveAnalyses: MoveAnalysis[] = [];
    const whiteLosses: number[] = [];
    const blackLosses: number[] = [];

    const emptyCounts = (): Record<MoveClassification, number> => ({
      brilliant: 0,
      great: 0,
      best: 0,
      excellent: 0,
      good: 0,
      book: 0,
      inaccuracy: 0,
      mistake: 0,
      blunder: 0,
      missed_win: 0,
    });

    const classificationCounts: {
      white: Record<MoveClassification, number>;
      black: Record<MoveClassification, number>;
    } = {
      white: emptyCounts(),
      black: emptyCounts(),
    };

    const keyMoments: GameReviewReport['keyMoments'] = [];

    const startFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    let prevFen = startFen;
    let prevEval: EngineEvaluation = await this.evaluatePosition(prevFen, depth);

    for (let i = 0; i < moves.length; i++) {
      const move = moves[i];
      const currentEval = await this.evaluatePosition(move.fen, depth);

      // Mover perspective before move
      const evalBeforeMover =
        move.color === 'w'
          ? (prevEval.whiteScoreCentipawns ?? 0)
          : -(prevEval.whiteScoreCentipawns ?? 0);

      // Mover perspective after move
      const evalAfterMover =
        move.color === 'w'
          ? (currentEval.whiteScoreCentipawns ?? 0)
          : -(currentEval.whiteScoreCentipawns ?? 0);

      const mateBeforeMover =
        move.color === 'w' ? prevEval.whiteMateInMoves : (prevEval.whiteMateInMoves ? -prevEval.whiteMateInMoves : undefined);

      const mateAfterMover =
        move.color === 'w' ? currentEval.whiteMateInMoves : (currentEval.whiteMateInMoves ? -currentEval.whiteMateInMoves : undefined);

      // Check if move matches best move recommended by engine in prev position
      const isBest = Boolean(
        prevEval.bestMoveSan === move.san ||
        (prevEval.bestMove && uciToSan(prevFen, prevEval.bestMove) === move.san)
      );

      // Centipawn loss (never negative)
      const loss = Math.max(0, evalBeforeMover - evalAfterMover);

      // Check for piece sacrifice
      const isSacrifice = move.san.includes('x') && loss === 0;

      const { classification, comment } = classifyMove(
        evalBeforeMover,
        evalAfterMover,
        isBest,
        isSacrifice,
        mateBeforeMover,
        mateAfterMover
      );

      const colorKey = move.color === 'w' ? 'white' : 'black';
      classificationCounts[colorKey][classification]++;

      if (move.color === 'w') {
        whiteLosses.push(loss);
      } else {
        blackLosses.push(loss);
      }

      const whiteEval = currentEval.whiteScoreCentipawns ?? 0;
      const mateInMoves = currentEval.whiteMateInMoves;

      const analysisItem: MoveAnalysis = {
        moveNumber: move.moveNumber,
        color: move.color,
        san: move.san,
        fenBefore: prevFen,
        fenAfter: move.fen,
        evalBefore: prevEval,
        evalAfter: currentEval,
        whiteEval,
        mateInMoves,
        centipawnLoss: loss,
        classification,
        bestMove: prevEval.bestMove,
        bestMoveSan: prevEval.bestMoveSan || prevEval.bestMove,
        comment,
      };

      moveAnalyses.push(analysisItem);

      // Add key moments (blunders, mistakes, inaccuracies, missed wins, brilliancies)
      if (
        classification === 'blunder' ||
        classification === 'mistake' ||
        classification === 'inaccuracy' ||
        classification === 'missed_win' ||
        classification === 'brilliant'
      ) {
        keyMoments.push({
          moveNumber: move.moveNumber,
          color: move.color,
          san: move.san,
          classification,
          comment: comment || `${move.color === 'w' ? 'White' : 'Black'} played ${move.san}`,
          whiteEval,
          mateInMoves,
          bestMoveSan: prevEval.bestMoveSan,
        });
      }

      prevFen = move.fen;
      prevEval = currentEval;
    }

    const whiteAccuracy = calculateAccuracy(whiteLosses);
    const blackAccuracy = calculateAccuracy(blackLosses);

    const summary = `Game review completed with Stockfish 19 engine. White achieved ${whiteAccuracy}% accuracy (${classificationCounts.white.blunder} blunders, ${classificationCounts.white.mistake} mistakes, ${classificationCounts.white.inaccuracy} inaccuracies). Black achieved ${blackAccuracy}% accuracy (${classificationCounts.black.blunder} blunders, ${classificationCounts.black.mistake} mistakes, ${classificationCounts.black.inaccuracy} inaccuracies).`;

    return {
      whiteAccuracy,
      blackAccuracy,
      moveAnalyses,
      keyMoments,
      classificationCounts,
      summary,
    };
  }

  public terminate(): void {
    if (this.engineInstance) {
      try {
        this.engineInstance.terminate();
      } catch (e) {
        console.error('Error terminating Stockfish instance:', e);
      }
      this.engineInstance = null;
      this.isReadyPromise = null;
    }
  }
}

// Global shared singleton engine instance for the application
let globalEngineInstance: StockfishEngine | null = null;

export function getStockfishEngine(): StockfishEngine {
  if (!globalEngineInstance) {
    globalEngineInstance = new StockfishEngine();
  }
  return globalEngineInstance;
}
