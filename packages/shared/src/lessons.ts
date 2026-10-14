import { Lesson } from './types.js';

export const SEED_LESSONS: Lesson[] = [
  {
    id: 'lesson_basics_01',
    title: 'How the Pieces Move',
    slug: 'how-the-pieces-move',
    description: 'Learn the fundamentals of moving the Rooks, Bishops, Queen, and King.',
    category: 'beginner',
    icon: 'Crown',
    order: 1,
    totalSteps: 3,
    steps: [
      {
        id: 'step_1',
        fen: '8/8/8/4R3/8/8/8/4K3 w - - 0 1',
        prompt: 'Move the Rook up to the 8th rank (e8).',
        solutionMoves: ['Re8'],
        explanation: 'Rooks move in straight horizontal and vertical lines any number of unoccupied squares.',
      },
      {
        id: 'step_2',
        fen: '8/8/8/4B3/8/8/8/4K3 w - - 0 1',
        prompt: 'Move the Bishop diagonally to h8.',
        solutionMoves: ['Bh8'],
        explanation: 'Bishops move along diagonals of their starting color.',
      },
      {
        id: 'step_3',
        fen: '8/8/8/4Q3/8/8/8/4K3 w - - 0 1',
        prompt: 'Move the Queen to the edge square a1.',
        solutionMoves: ['Qa1'],
        explanation: 'The Queen combines the powers of Rook and Bishop, moving in any straight direction.',
      },
    ],
  },
  {
    id: 'lesson_checkmate_patterns_02',
    title: 'Essential Checkmate Patterns',
    slug: 'essential-checkmate-patterns',
    description: 'Master back rank mates, scholar attacks, and the smother mate.',
    category: 'intermediate',
    icon: 'Swords',
    order: 2,
    totalSteps: 2,
    steps: [
      {
        id: 'step_1',
        fen: '6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1',
        prompt: 'Deliver checkmate on the back rank.',
        solutionMoves: ['Ra8#'],
        explanation: 'Because the black pawns on f7, g7, and h7 block the king from stepping forward, Ra8 is checkmate.',
      },
      {
        id: 'step_2',
        fen: 'r1bqkb1r/pppp1ppp/2n5/4p3/2B1n3/2P2N2/PPP2PPP/R1BQK2R w KQkq - 0 7',
        prompt: 'Punish Black with Bxf7+ forcing the king out.',
        solutionMoves: ['Bxf7+'],
        explanation: 'Attacking the weak f7 square is a recurring theme in early game tactical combinations.',
      },
    ],
  },
  {
    id: 'lesson_endgame_03',
    title: 'King and Pawn Endgames',
    slug: 'king-and-pawn-endgames',
    description: 'Understand opposition, key squares, and outflanking to queen your pawns.',
    category: 'advanced',
    icon: 'Target',
    order: 3,
    totalSteps: 2,
    steps: [
      {
        id: 'step_1',
        fen: '8/4k3/8/4P3/4K3/8/8/8 w - - 0 1',
        prompt: 'Seize the opposition with Kd5.',
        solutionMoves: ['Kd5'],
        explanation: 'Taking direct opposition puts Black into zugzwang, forcing their king to step aside.',
      },
      {
        id: 'step_2',
        fen: '8/8/3k4/4P3/3K4/8/8/8 b - - 0 1',
        prompt: 'Retreat the king safely to e6 to contest the promotion square.',
        solutionMoves: ['Ke6'],
        explanation: 'Staying in front of the pawn prevents immediate advancement.',
      },
    ],
  },
];
