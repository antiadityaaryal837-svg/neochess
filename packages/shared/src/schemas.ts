import { z } from 'zod';

export const RegisterSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain letters, numbers, and underscores',
  }),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  country: z.string().optional().default('US'),
});

export const LoginSchema = z.object({
  usernameOrEmail: z.string().min(1),
  password: z.string().min(1),
});

export const UpdateProfileSchema = z.object({
  displayName: z.string().max(50).optional(),
  bio: z.string().max(500).optional(),
  country: z.string().max(3).optional(),
  avatarUrl: z.string().url().or(z.string().length(0)).optional(),
});

export const UpdatePreferencesSchema = z.object({
  boardTheme: z.enum(['green', 'wood', 'blue', 'glass', 'dark', 'tournament']).optional(),
  pieceTheme: z.enum(['neo', 'classic', 'wood', 'glass']).optional(),
  soundEnabled: z.boolean().optional(),
  moveAnimation: z.boolean().optional(),
  showCoordinates: z.boolean().optional(),
  showLegalMoves: z.boolean().optional(),
  autoQueen: z.boolean().optional(),
  premovesEnabled: z.boolean().optional(),
  evalBarEnabled: z.boolean().optional(),
  boardFlipped: z.boolean().optional(),
});

export const MakeMoveSchema = z.object({
  gameId: z.string(),
  from: z.string().length(2),
  to: z.string().length(2),
  promotion: z.enum(['q', 'r', 'b', 'n']).optional(),
});

export const CreateGameSchema = z.object({
  timeControl: z.enum(['1+0', '1+1', '2+1', '3+0', '3+2', '5+0', '5+3', '10+0', '15+10', '30+0', '60+0']),
  rated: z.boolean().default(true),
  variant: z.enum(['standard', 'chess960', 'three_check', 'king_of_the_hill', 'atomic']).default('standard'),
  color: z.enum(['white', 'black', 'random']).default('random'),
  opponentType: z.enum(['human', 'computer']).default('human'),
  botId: z.string().optional(),
});

export const MatchmakingQueueSchema = z.object({
  timeControl: z.enum(['1+0', '1+1', '2+1', '3+0', '3+2', '5+0', '5+3', '10+0', '15+10', '30+0']),
  rated: z.boolean().default(true),
});

export const SubmitPuzzleAttemptSchema = z.object({
  puzzleId: z.string(),
  success: z.boolean(),
  timeSpentSeconds: z.number().nonnegative(),
});
