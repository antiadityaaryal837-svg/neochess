export interface RatingUpdateResult {
  playerNewRating: number;
  playerDelta: number;
  opponentNewRating: number;
  opponentDelta: number;
}

/**
 * Standard Elo Rating Calculator with adaptive K-factor
 * @param playerRating Current rating of player
 * @param opponentRating Current rating of opponent
 * @param score 1 for win, 0.5 for draw, 0 for loss
 * @param kFactor Default 32 for provisional / standard
 */
export function calculateElo(
  playerRating: number,
  opponentRating: number,
  score: 1 | 0.5 | 0,
  kFactor: number = 32
): { newRating: number; delta: number } {
  const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  const delta = Math.round(kFactor * (score - expectedScore));
  const newRating = Math.max(100, playerRating + delta);
  return { newRating, delta };
}

/**
 * Calculates updated ratings for both players simultaneously
 */
export function calculateMatchRatings(
  whiteRating: number,
  blackRating: number,
  whiteScore: 1 | 0.5 | 0,
  whiteGamesPlayed: number = 30,
  blackGamesPlayed: number = 30
): RatingUpdateResult {
  // Use higher K-factor for newer players (<30 games)
  const whiteK = whiteGamesPlayed < 30 ? 40 : 24;
  const blackK = blackGamesPlayed < 30 ? 40 : 24;

  const whiteResult = calculateElo(whiteRating, blackRating, whiteScore, whiteK);
  const blackScore = (1 - whiteScore) as 1 | 0.5 | 0;
  const blackResult = calculateElo(blackRating, whiteRating, blackScore, blackK);

  return {
    playerNewRating: whiteResult.newRating,
    playerDelta: whiteResult.delta,
    opponentNewRating: blackResult.newRating,
    opponentDelta: blackResult.delta,
  };
}

/**
 * Calculates rating change for puzzle solving
 */
export function calculatePuzzleRatingChange(
  userRating: number,
  puzzleRating: number,
  success: boolean
): number {
  const score = success ? 1 : 0;
  const expectedScore = 1 / (1 + Math.pow(10, (puzzleRating - userRating) / 400));
  // Puzzles use K=32 for dynamic progression
  const delta = Math.round(32 * (score - expectedScore));
  return delta;
}
