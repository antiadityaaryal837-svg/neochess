import { TimeControlConfig, BotPersona, UserPreferences } from './types.js';

export const DEFAULT_PREFERENCES: UserPreferences = {
  boardTheme: 'green',
  pieceTheme: 'neo',
  soundEnabled: true,
  moveAnimation: true,
  showCoordinates: true,
  showLegalMoves: true,
  autoQueen: true,
  premovesEnabled: true,
  evalBarEnabled: true,
  boardFlipped: false,
};

export const STANDARD_TIME_CONTROLS: Record<string, TimeControlConfig> = {
  // Bullet
  '1+0': { type: 'bullet', name: '1 min', baseSeconds: 60, incrementSeconds: 0, label: '1 | 0' },
  '1+1': { type: 'bullet', name: '1 | 1', baseSeconds: 60, incrementSeconds: 1, label: '1 | 1' },
  '2+1': { type: 'bullet', name: '2 | 1', baseSeconds: 120, incrementSeconds: 1, label: '2 | 1' },

  // Blitz
  '3+0': { type: 'blitz', name: '3 min', baseSeconds: 180, incrementSeconds: 0, label: '3 | 0' },
  '3+2': { type: 'blitz', name: '3 | 2', baseSeconds: 180, incrementSeconds: 2, label: '3 | 2' },
  '5+0': { type: 'blitz', name: '5 min', baseSeconds: 300, incrementSeconds: 0, label: '5 | 0' },
  '5+3': { type: 'blitz', name: '5 | 3', baseSeconds: 300, incrementSeconds: 3, label: '5 | 3' },

  // Rapid
  '10+0': { type: 'rapid', name: '10 min', baseSeconds: 600, incrementSeconds: 0, label: '10 | 0' },
  '15+10': { type: 'rapid', name: '15 | 10', baseSeconds: 900, incrementSeconds: 10, label: '15 | 10' },
  '30+0': { type: 'rapid', name: '30 min', baseSeconds: 1800, incrementSeconds: 0, label: '30 | 0' },

  // Classical
  '60+0': { type: 'classical', name: '60 min', baseSeconds: 3600, incrementSeconds: 0, label: '60 | 0' },
};

export const BOT_PERSONAS: BotPersona[] = [
  {
    id: 'bot_martin',
    name: 'Martin',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    rating: 400,
    category: 'beginner',
    depth: 1,
    skillLevel: 1,
    blunderPercent: 40,
    bio: 'Martin loves playing chess with his kids and tries his best. He occasionally forgets to defend his pieces.',
    quote: 'Chess is fun! Win or lose, we are having a good time.',
  },
  {
    id: 'bot_elena',
    name: 'Elena',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
    rating: 700,
    category: 'beginner',
    depth: 3,
    skillLevel: 4,
    blunderPercent: 25,
    bio: 'Elena learned chess in middle school chess club. She knows opening principles and attacks actively.',
    quote: 'Control the center, castle early, and look for tactical tricks!',
  },
  {
    id: 'bot_nelson',
    name: 'Nelson',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    rating: 1300,
    category: 'intermediate',
    depth: 6,
    skillLevel: 9,
    blunderPercent: 12,
    bio: 'Nelson loves bringing his queen out on move 2. If you are not careful, he will deliver scholar mate!',
    quote: 'My Queen is my favorite piece. Watch out for her attacks!',
  },
  {
    id: 'bot_antonio',
    name: 'Antonio',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    rating: 1500,
    category: 'intermediate',
    depth: 8,
    skillLevel: 12,
    blunderPercent: 6,
    bio: 'A solid club player who punishes positional blunders and understands pawn structures well.',
    quote: 'Patience and solid pawn structure win games.',
  },
  {
    id: 'bot_li',
    name: 'Grandmaster Li',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
    rating: 2200,
    category: 'advanced',
    depth: 13,
    skillLevel: 18,
    blunderPercent: 1,
    bio: 'FIDE Master with razor-sharp calculation and deep endgame mastery.',
    quote: 'Every move must serve a deliberate strategy.',
  },
  {
    id: 'bot_stockfish_max',
    name: 'Stockfish Master',
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80',
    rating: 3200,
    category: 'master',
    depth: 18,
    skillLevel: 20,
    blunderPercent: 0,
    bio: 'Top open-source chess calculation engine playing at maximum depth.',
    quote: '0.00 -> M8.',
  },
];

export const BOARD_THEMES: Record<string, { name: string; light: string; dark: string; border: string }> = {
  green: {
    name: 'Neo Green',
    light: '#ebecd0',
    dark: '#739552',
    border: '#455931',
  },
  wood: {
    name: 'Classic Walnut',
    light: '#f0d9b5',
    dark: '#b58863',
    border: '#7c5333',
  },
  blue: {
    name: 'Oceanic Blue',
    light: '#dee3e6',
    dark: '#588ba8',
    border: '#35596e',
  },
  dark: {
    name: 'Obsidian Night',
    light: '#52525b',
    dark: '#27272a',
    border: '#18181b',
  },
  glass: {
    name: 'Crystal Glass',
    light: '#e2e8f0',
    dark: '#94a3b8',
    border: '#475569',
  },
};

export const INITIAL_RATINGS = {
  bullet: 1200,
  blitz: 1200,
  rapid: 1200,
  classical: 1200,
  puzzles: 1200,
};
