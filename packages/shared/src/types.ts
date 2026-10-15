export type PieceColor = 'w' | 'b';
export type PlayerColor = 'white' | 'black';

export type TimeControlType = 'bullet' | 'blitz' | 'rapid' | 'classical' | 'daily' | 'custom';

export type GameVariant =
  | 'standard'
  | 'chess960'
  | 'three_check'
  | 'king_of_the_hill'
  | 'atomic'
  | 'crazyhouse';

export type GameStatus =
  | 'waiting'
  | 'in_progress'
  | 'checkmate'
  | 'stalemate'
  | 'resigned'
  | 'timeout'
  | 'draw_agreed'
  | 'threefold_repetition'
  | 'fifty_move_rule'
  | 'insufficient_material'
  | 'abandoned';

export type GameResult = '1-0' | '0-1' | '1/2-1/2' | '*';

export type MoveClassification =
  | 'brilliant'
  | 'great'
  | 'best'
  | 'excellent'
  | 'good'
  | 'book'
  | 'inaccuracy'
  | 'mistake'
  | 'blunder'
  | 'missed_win';

export interface TimeControlConfig {
  type: TimeControlType;
  name: string;
  baseSeconds: number;
  incrementSeconds: number;
  label: string;
}

export interface ChessMoveRecord {
  from: string;
  to: string;
  promotion?: 'q' | 'r' | 'b' | 'n';
  san: string;
  lan?: string;
  fen: string;
  color: PieceColor;
  moveNumber: number;
  timeSpentMs?: number;
  whiteTimeRemainingMs: number;
  blackTimeRemainingMs: number;
  createdAt: string;
  classification?: MoveClassification;
  evalScore?: number; // In centipawns or mate score
  bestMove?: string;
}

export interface PlayerInfo {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  country?: string;
  rating: number;
  ratingChange?: number;
  isComputer?: boolean;
  botDifficulty?: number;
  title?: string;
  isOnline?: boolean;
}

export interface GameRoomState {
  id: string;
  fen: string;
  pgn: string;
  status: GameStatus;
  variant: GameVariant;
  timeControl: TimeControlConfig;
  rated: boolean;
  whitePlayer: PlayerInfo;
  blackPlayer: PlayerInfo;
  currentTurn: PieceColor;
  halfMoves: number;
  fullMoves: number;
  moves: ChessMoveRecord[];
  whiteTimeMs: number;
  blackTimeMs: number;
  lastMoveTimestamp?: number;
  drawOfferedBy?: PieceColor | null;
  rematchOfferedBy?: PieceColor | null;
  winner?: PieceColor | null;
  winReason?: string;
  result: GameResult;
  spectatorCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserSummary {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'moderator' | 'admin';
  membershipTier: 'free' | 'gold' | 'platinum' | 'diamond';
  avatarUrl: string;
  country: string;
  bio?: string;
  createdAt: string;
  ratings: Record<TimeControlType, number>;
  puzzleRating: number;
  stats: {
    totalGames: number;
    wins: number;
    losses: number;
    draws: number;
    winRate: number;
  };
}

export interface UserPreferences {
  boardTheme: 'green' | 'wood' | 'blue' | 'glass' | 'dark' | 'tournament';
  pieceTheme: 'neo' | 'classic' | 'wood' | 'glass';
  soundEnabled: boolean;
  moveAnimation: boolean;
  showCoordinates: boolean;
  showLegalMoves: boolean;
  autoQueen: boolean;
  premovesEnabled: boolean;
  evalBarEnabled: boolean;
  boardFlipped: boolean;
}

export interface Puzzle {
  id: string;
  fen: string;
  moves: string[]; // SAN or UCI sequence
  rating: number;
  ratingDeviation?: number;
  popularity?: number;
  themes: string[];
  gameUrl?: string;
  openingFamily?: string;
  description?: string;
  initialPly?: number;
}

export interface LessonStep {
  id: string;
  fen: string;
  prompt: string;
  solutionMoves: string[]; // sequence of moves expected
  explanation: string;
  arrows?: { from: string; to: string; color?: string }[];
  highlights?: { square: string; color?: string }[];
}

export interface Lesson {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: 'beginner' | 'intermediate' | 'advanced';
  icon: string;
  order: number;
  totalSteps: number;
  steps: LessonStep[];
}

export interface OpeningData {
  eco: string;
  name: string;
  fen: string;
  moves: string;
  whiteWinsPercent: number;
  drawsPercent: number;
  blackWinsPercent: number;
  totalGames: number;
  description: string;
}

export interface BotPersona {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  category: 'beginner' | 'intermediate' | 'advanced' | 'master' | 'grandmaster';
  depth: number;
  skillLevel: number; // 0 to 20
  blunderPercent: number;
  thinkingMs?: number;
  uciElo?: number;
  bio: string;
  quote: string;
}

export interface GameReviewReport {
  gameId: string;
  whiteAccuracy: number;
  blackAccuracy: number;
  whiteClassifications: Record<MoveClassification, number>;
  blackClassifications: Record<MoveClassification, number>;
  summary: string;
  keyMoments: {
    moveNumber: number;
    color: PieceColor;
    san: string;
    classification: MoveClassification;
    comment: string;
    bestSan?: string;
  }[];
}
