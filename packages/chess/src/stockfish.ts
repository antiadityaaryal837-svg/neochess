import { MoveClassification } from '@chess/shared';

export interface EngineEvaluation {
  depth: number;
  scoreCentipawns: number;
  mateInMoves?: number;
  bestMove: string;
  ponderMove?: string;
  pv: string[];
}

/**
 * Classifies a move based on centipawn loss compared to the engine's best move
 * @param evalBefore Centipawns from the perspective of the moving player before the move
 * @param evalAfter Centipawns from the perspective of the moving player after the move
 * @param isBest Whether the move was engine's top choice
 * @param isSacrifice Whether a piece was sacrificed deliberately for advantage
 */
export function classifyMove(
  evalBefore: number,
  evalAfter: number,
  isBest: boolean,
  isSacrifice: boolean = false
): MoveClassification {
  if (isBest) {
    if (isSacrifice && evalAfter >= evalBefore) {
      return 'brilliant';
    }
    return 'best';
  }

  // Centipawn loss (positive number = player lost advantage)
  const loss = Math.max(0, evalBefore - evalAfter);

  if (loss <= 20) return 'excellent';
  if (loss <= 50) return 'good';
  if (loss <= 150) return 'inaccuracy';
  if (loss <= 300) return 'mistake';
  return 'blunder';
}

/**
 * Calculate overall accuracy percentage (0-100) from an array of move losses
 */
export function calculateAccuracy(centipawnLosses: number[]): number {
  if (centipawnLosses.length === 0) return 100;
  // Standard harmonic accuracy formula based on average win-percentage drop
  const totalAcc = centipawnLosses.reduce((acc, loss) => {
    // Loss of 0 -> 100%
    // Loss of 100 cp -> ~70%
    // Loss of 300 cp -> ~40%
    const moveAcc = Math.max(0, 100 * Math.exp(-0.004 * loss));
    return acc + moveAcc;
  }, 0);

  return Math.round(totalAcc / centipawnLosses.length);
}
