import { Lesson } from './types.js';

export const SEED_LESSONS: Lesson[] = [
  // 1. Piece Movement
  {
    id: 'lesson_pieces_01',
    title: 'How the Pieces Move & Capture',
    slug: 'how-the-pieces-move',
    description: 'Master the fundamental movement and capture rules of Rooks, Bishops, Knights, Queen, and King.',
    category: 'beginner',
    icon: 'Crown',
    order: 1,
    totalSteps: 4,
    steps: [
      {
        id: 'step_1',
        fen: '8/8/8/4R3/8/8/8/4K3 w - - 0 1',
        prompt: 'Move the Rook to the top rank (e8).',
        solutionMoves: ['Re8'],
        explanation: 'Rooks move in straight lines horizontally and vertically as far as unobstructed.',
      },
      {
        id: 'step_2',
        fen: '8/8/8/4B3/8/8/8/4K3 w - - 0 1',
        prompt: 'Move the Bishop diagonally across the board to h8.',
        solutionMoves: ['Bh8'],
        explanation: 'Bishops move diagonally on squares of their starting color (light or dark).',
      },
      {
        id: 'step_3',
        fen: '8/8/8/4N3/8/8/8/4K3 w - - 0 1',
        prompt: 'Hop the Knight in an "L-shape" to f7.',
        solutionMoves: ['Nf7'],
        explanation: 'Knights are the only pieces that can jump over other pieces, moving 2 squares in one direction and 1 to the side.',
      },
      {
        id: 'step_4',
        fen: '8/8/8/4Q3/8/8/8/4K3 w - - 0 1',
        prompt: 'Move the powerful Queen diagonally to a1.',
        solutionMoves: ['Qa1'],
        explanation: 'The Queen combines the straight movement of a Rook with the diagonal powers of a Bishop.',
      },
    ],
  },

  // 2. Check, Checkmate, and Stalemate
  {
    id: 'lesson_check_mate_02',
    title: 'Check, Checkmate, and Stalemate',
    slug: 'check-checkmate-and-stalemate',
    description: 'Learn the critical differences between check, delivering checkmate, and avoiding accidental stalemate draws.',
    category: 'beginner',
    icon: 'Swords',
    order: 2,
    totalSteps: 3,
    steps: [
      {
        id: 'step_1',
        fen: 'r1bqk2r/pppp1ppp/2n5/4p3/1bB1n3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 1 6',
        prompt: 'Get out of check by blocking with your bishop on d2 (Bd2).',
        solutionMoves: ['Bd2'],
        explanation: 'There are 3 ways to escape check: Capture the attacking piece, Block the check, or Move the King (CPR).',
      },
      {
        id: 'step_2',
        fen: '6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1',
        prompt: 'Deliver checkmate on the back rank with your Rook (Ra8#).',
        solutionMoves: ['Ra8#'],
        explanation: 'Because the Black king has no legal squares and cannot block or capture the rook, it is checkmate and White wins!',
      },
      {
        id: 'step_3',
        fen: 'k7/2Q5/1K6/8/8/8/8/8 w - - 0 1',
        prompt: 'Deliver checkmate with Qb7# (Notice: do NOT play Qc8 stalemate!).',
        solutionMoves: ['Qb7#'],
        explanation: 'Qb7 delivers checkmate because the Queen directly attacks the King. A move that attacks no squares but leaves the king with no legal moves would be a stalemate draw!',
      },
    ],
  },

  // 3. Special Rules: Castling & En Passant
  {
    id: 'lesson_special_rules_03',
    title: 'Castling and En Passant',
    slug: 'castling-and-en-passant',
    description: 'Protect your king with kingside/queenside castling and learn the unique pawn capture rule En Passant.',
    category: 'beginner',
    icon: 'Shield',
    order: 3,
    totalSteps: 3,
    steps: [
      {
        id: 'step_1',
        fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQkq - 1 6',
        prompt: 'Castle kingside to tuck your king safely into the corner (O-O).',
        solutionMoves: ['O-O'],
        explanation: 'Castling is the only move where you move two pieces in a single turn. It activates your rook and shields your king.',
      },
      {
        id: 'step_2',
        fen: 'r3k2r/pppq1ppp/2np1n2/2b1p3/4P3/1PNP1N2/PBP1QPPP/R3K2R w KQkq - 1 9',
        prompt: 'Castle queenside with your King and a1-Rook (O-O-O).',
        solutionMoves: ['O-O-O'],
        explanation: 'Queenside castling places the King on c1 and brings the d-file rook directly into the center.',
      },
      {
        id: 'step_3',
        fen: 'rnbqkbnr/ppp1pppp/8/3pP3/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 3',
        prompt: 'Capture the black d5 pawn "in passing" (exd6).',
        solutionMoves: ['exd6'],
        explanation: 'When an enemy pawn advances two squares past your fifth-rank pawn, you can capture it En Passant on the very next move.',
      },
    ],
  },

  // 4. Opening Principles
  {
    id: 'lesson_opening_principles_04',
    title: 'Golden Opening Principles',
    slug: 'opening-principles',
    description: 'Control the four central squares, develop minor pieces with purpose, and avoid moving the same piece twice.',
    category: 'beginner',
    icon: 'Compass',
    order: 4,
    totalSteps: 3,
    steps: [
      {
        id: 'step_1',
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        prompt: 'Stake your claim in the center with 1. e4.',
        solutionMoves: ['e4'],
        explanation: '1. e4 controls the key d5 and f5 squares and immediately frees diagonals for your Queen and Bishop.',
      },
      {
        id: 'step_2',
        fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2',
        prompt: 'Develop your king’s knight to attack the e5 pawn (Nf3).',
        solutionMoves: ['Nf3'],
        explanation: 'Develop knights toward the center where they control 8 squares rather than the edge where they only control 4.',
      },
      {
        id: 'step_3',
        fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
        prompt: 'Develop your light-squared bishop to active square c4 (Bc4).',
        solutionMoves: ['Bc4'],
        explanation: 'Bc4 controls the center and takes aim at Black’s vulnerable f7 square, preparing kingside castling.',
      },
    ],
  },

  // 5. Tactical Patterns: Forks & Pins
  {
    id: 'lesson_forks_pins_05',
    title: 'Tactical Patterns: Forks & Pins',
    slug: 'tactical-patterns-forks-and-pins',
    description: 'Double attacks that win immediate material. Master the royal knight fork and the paralyzing pin.',
    category: 'intermediate',
    icon: 'Zap',
    order: 5,
    totalSteps: 3,
    steps: [
      {
        id: 'step_1',
        fen: 'r1bqk2r/pppp1ppp/2n5/4p3/1b2n3/2NP1N2/PPP1BPPP/R1BQK2R w KQkq - 0 6',
        prompt: 'Win a piece by capturing the knight on e4 (dxe4).',
        solutionMoves: ['dxe4'],
        explanation: 'When your opponent attacks your pinned piece without adequate defense, calculate exchanges to win material.',
      },
      {
        id: 'step_2',
        fen: 'r1bqkb1r/pppp1ppp/2n5/4p3/2B1n3/2P2N2/PP1P1PPP/RNBQK2R w KQkq - 0 5',
        prompt: 'Play the classic fork trick: advance your d-pawn to d4 (d4).',
        solutionMoves: ['d4'],
        explanation: 'd4 forks Black’s bishop on c5 and knight on e4, guaranteeing White the return of material with central superiority.',
      },
      {
        id: 'step_3',
        fen: 'r1bqk2r/pp3ppp/2n5/1Bbp4/4n3/2P2N2/PP3PPP/RNBQ1RK1 w kq - 2 9',
        prompt: 'Pin the knight to the Black king with Bxc6+.',
        solutionMoves: ['Bxc6+'],
        explanation: 'Absolute pins against the enemy king completely freeze opponent pieces from moving.',
      },
    ],
  },

  // 6. Skewers & Discovered Attacks
  {
    id: 'lesson_skewers_discovered_06',
    title: 'Skewers & Discovered Attacks',
    slug: 'tactical-patterns-skewers-and-discovered-attacks',
    description: 'Learn the deadly reverse-pin (skewer) and unleash overwhelming firepower through discovered checks.',
    category: 'intermediate',
    icon: 'Crosshair',
    order: 6,
    totalSteps: 2,
    steps: [
      {
        id: 'step_1',
        fen: '4k3/8/8/8/1r6/8/2R5/2K5 w - - 0 1',
        prompt: 'Deliver a decisive horizontal skewer check with Rc8+.',
        solutionMoves: ['Rc8+'],
        explanation: 'The check forces the black king to move away, leaving the rook on b4 undefended and ripe for capture!',
      },
      {
        id: 'step_2',
        fen: 'r1b1k2r/pppp1ppp/2n5/4p1B1/2B1n3/2P2N2/PPP2PPP/R2QK2R w KQkq - 0 8',
        prompt: 'Sacrifice the bishop on f7 to draw the king into an ambush (Bxf7+).',
        solutionMoves: ['Bxf7+'],
        explanation: 'Bxf7+ strips the Black king of castling rights and opens devastating discovered attack diagonals.',
      },
    ],
  },

  // 7. Classic Mating Attacks
  {
    id: 'lesson_classic_mates_07',
    title: 'Classic Mating Patterns',
    slug: 'classic-mating-attacks',
    description: 'Recognize scholar attacks, Anastasia’s mate, legal traps, and the smothered knight checkmate.',
    category: 'intermediate',
    icon: 'Flame',
    order: 7,
    totalSteps: 2,
    steps: [
      {
        id: 'step_1',
        fen: 'r1bqkb1r/pppp1ppp/2n5/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4',
        prompt: 'Deliver Scholar’s Mate on the weakest square f7 (Qxf7#).',
        solutionMoves: ['Qxf7#'],
        explanation: 'Because only the king defends f7 at the start of the game, coordinated Queen + Bishop attacks can deliver swift checkmate.',
      },
      {
        id: 'step_2',
        fen: '6k1/5ppp/8/8/8/8/1r3PPP/4R1K1 w - - 0 1',
        prompt: 'Deliver back-rank checkmate on e8 (Re8#).',
        solutionMoves: ['Re8#'],
        explanation: 'Always ensure your king has "luft" (escape breathing room like h3 or g3) to avoid sudden back-rank disasters.',
      },
    ],
  },

  // 8. Pawn Structure Fundamentals
  {
    id: 'lesson_pawn_structure_08',
    title: 'Pawn Structures & Passed Pawns',
    slug: 'pawn-structures',
    description: 'Pawns are the soul of chess. Learn about isolated pawns, doubled pawns, pawn islands, and creating outside passers.',
    category: 'intermediate',
    icon: 'Layers',
    order: 8,
    totalSteps: 2,
    steps: [
      {
        id: 'step_1',
        fen: '8/4kp2/8/4P3/4KP2/8/8/8 w - - 0 1',
        prompt: 'Advance your pawn to create a breakthrough with f5 (f5).',
        solutionMoves: ['f5'],
        explanation: 'Advancing connected pawns restricts the enemy king and establishes a protected passed pawn.',
      },
      {
        id: 'step_2',
        fen: '8/8/4k3/4p3/4K3/8/8/8 w - - 0 1',
        prompt: 'Hold the defensive fortress and wait for Black to advance or concede (Kd3).',
        solutionMoves: ['Kd3'],
        explanation: 'In king-and-pawn endgames, maintaining proper distance and preventing the opponent king from penetrating is crucial.',
      },
    ],
  },

  // 9. Piece Activity & Outposts
  {
    id: 'lesson_piece_activity_09',
    title: 'Piece Activity and Outposts',
    slug: 'piece-activity',
    description: 'Transform passive defenders into dominant attackers by anchoring knights on permanent outposts and controlling open files.',
    category: 'intermediate',
    icon: 'Target',
    order: 9,
    totalSteps: 2,
    steps: [
      {
        id: 'step_1',
        fen: 'r2q1rk1/pp1nbppp/2p1pn2/3p4/2PP4/2NBPN2/PP3PPP/R1BQ1RK1 w - - 4 9',
        prompt: 'Seize the center and challenge Black with e4 (e4).',
        solutionMoves: ['e4'],
        explanation: 'Striking in the center with e4 opens lines for your bishops and restricts the enemy minor pieces.',
      },
      {
        id: 'step_2',
        fen: 'r1b2rk1/pp1n1ppp/2p1pn2/q2p4/2PP4/1PbBPN2/PB1N1PPP/R2Q1RK1 w - - 5 10',
        prompt: 'Eliminate the dangerous black bishop by playing Bxc3 (Bxc3).',
        solutionMoves: ['Bxc3'],
        explanation: 'Trading off your opponent’s active attacking pieces neutralizes their initiative and strengthens your structure.',
      },
    ],
  },

  // 10. King Safety & Pawn Shields
  {
    id: 'lesson_king_safety_10',
    title: 'King Safety & Castled Defense',
    slug: 'king-safety',
    description: 'Learn how to detect mating threats before they strike and preserve the intact pawn shield around your castled king.',
    category: 'intermediate',
    icon: 'ShieldAlert',
    order: 10,
    totalSteps: 2,
    steps: [
      {
        id: 'step_1',
        fen: 'r1b2rk1/pp3ppp/2n1p3/q7/3P4/P1PB1N2/2Q2PPP/R3K2R w KQ - 3 14',
        prompt: 'Crash through the h7 pawn shield with Bxh7+ (Bxh7+).',
        solutionMoves: ['Bxh7+'],
        explanation: 'The classic Greek Gift sacrifice often begins with Bxh7+, stripping the black king of its pawn barrier.',
      },
      {
        id: 'step_2',
        fen: 'r1b2r1k/pp3ppB/2n1p3/q7/3P4/P1P2N2/2Q2PPP/R3K2R w KQ - 1 15',
        prompt: 'Retreat your bishop to safe square e4 to consolidate your material advantage (Be4).',
        solutionMoves: ['Be4'],
        explanation: 'After winning material through a kingside raid, immediately consolidate and secure central outposts.',
      },
    ],
  },

  // 11. Calculation & Visualization
  {
    id: 'lesson_calculation_11',
    title: 'Tactical Calculation & Candidate Moves',
    slug: 'calculation-and-visualization',
    description: 'Calculate forcing variations like a Grandmaster using the CCT method: Checks, Captures, and Threats.',
    category: 'advanced',
    icon: 'Cpu',
    order: 11,
    totalSteps: 2,
    steps: [
      {
        id: 'step_1',
        fen: 'r1b1k2r/pppp1Npp/8/4p3/2Bn3q/6n1/PPPP3P/RNB2QKR w kq - 0 10',
        prompt: 'Eliminate the rook on h8 with your knight (Nxh8).',
        solutionMoves: ['Nxh8'],
        explanation: 'Calculating the concrete consequences of forcing moves allows you to net decisive material advantage.',
      },
      {
        id: 'step_2',
        fen: 'r1b2rk1/pp1n1ppp/2p5/q3p3/2PP4/b1NBPN2/P1Q2PPP/1R3RK1 w - - 0 15',
        prompt: 'Sacrifice the bishop on h7 with check to begin the kingside assault (Bxh7+).',
        solutionMoves: ['Bxh7+'],
        explanation: 'Never play auto-moves; always calculate forcing responses to your opponent’s defensive resources.',
      },
    ],
  },

  // 12. Middlegame Strategy
  {
    id: 'lesson_middlegame_12',
    title: 'Middlegame Strategy & Planning',
    slug: 'middlegame-strategy',
    description: 'Transform an opening advantage into a winning middlegame strategy by targeting weaknesses and coordinating major pieces.',
    category: 'advanced',
    icon: 'Activity',
    order: 12,
    totalSteps: 2,
    steps: [
      {
        id: 'step_1',
        fen: 'r4rk1/pp1b1ppp/1qn1pn2/2bp4/8/2NBPN2/PPPB1PPP/R2Q1RK1 w - - 4 10',
        prompt: 'Attack the black queen and win the bishop pair with Na4 (Na4).',
        solutionMoves: ['Na4'],
        explanation: 'Na4 forces Black to part with their active dark-squared bishop, leaving White with long-term positional superiority.',
      },
      {
        id: 'step_2',
        fen: 'r1bqr1k1/pp3ppp/2n2n2/2bp4/8/2NB1N2/PPPB1PPP/R2QR1K1 w - - 6 11',
        prompt: 'Contest the open e-file by trading rooks on e8 (Rxe8+).',
        solutionMoves: ['Rxe8+'],
        explanation: 'Trading rooks on open files simplifies the position when ahead or defuses opponent counterplay.',
      },
    ],
  },

  // 13. Endgame Fundamentals
  {
    id: 'lesson_endgame_fundamentals_13',
    title: 'King and Pawn Endgames: The Opposition',
    slug: 'endgame-fundamentals',
    description: 'The definitive guide to opposition, key squares, outflanking, and the rule of the square in pawn endgames.',
    category: 'advanced',
    icon: 'Award',
    order: 13,
    totalSteps: 2,
    steps: [
      {
        id: 'step_1',
        fen: '8/4k3/8/4P3/4K3/8/8/8 w - - 0 1',
        prompt: 'Take the direct vertical opposition by stepping to d5 (Kd5).',
        solutionMoves: ['Kd5'],
        explanation: 'Taking the opposition puts Black into zugzwang: Black must yield ground to either the left or right.',
      },
      {
        id: 'step_2',
        fen: '8/8/3k4/4P3/3K4/8/8/8 b - - 0 1',
        prompt: 'Retreat the king directly in front of the passed pawn on e6 (Ke6).',
        solutionMoves: ['Ke6'],
        explanation: 'Always maintain control of the queening corridor in pawn endgames to ensure successful promotion.',
      },
    ],
  },

  // 14. Rook Endgames: Lucena & Philidor
  {
    id: 'lesson_rook_endgames_14',
    title: 'Rook Endgames: Lucena & Philidor',
    slug: 'rook-endgames',
    description: 'The two most essential endgame techniques in chess: building the Lucena bridge and holding the Philidor draw.',
    category: 'advanced',
    icon: 'Anchor',
    order: 14,
    totalSteps: 2,
    steps: [
      {
        id: 'step_1',
        fen: '3R4/8/8/8/8/5k2/r7/4K3 w - - 0 1',
        prompt: 'Give check to drive the enemy king away with Rf8+ (Rf8+).',
        solutionMoves: ['Rf8+'],
        explanation: 'Checking from a distance separates the enemy king from the passed pawn and secures the defensive perimeter.',
      },
      {
        id: 'step_2',
        fen: '8/8/8/4k3/R7/8/4K3/1r6 w - - 0 1',
        prompt: 'Cut the king off along the 5th rank with Ra5+ (Ra5+).',
        solutionMoves: ['Ra5+'],
        explanation: 'Cutting off the enemy king by ranks or files is a cornerstone principle in Grandmaster rook endgames.',
      },
    ],
  },

  // 15. Minor-Piece Endgames
  {
    id: 'lesson_minor_piece_endgames_15',
    title: 'Minor-Piece Endgames',
    slug: 'minor-piece-endgames',
    description: 'Understand the power of the bishop pair, bad bishops vs good knights, and fortress drawing techniques.',
    category: 'advanced',
    icon: 'CheckCircle',
    order: 15,
    totalSteps: 2,
    steps: [
      {
        id: 'step_1',
        fen: '8/5pk1/6p1/7p/8/5KP1/5P1P/8 w - - 0 1',
        prompt: 'Centralize your king aggressively with Ke4 (Ke4).',
        solutionMoves: ['Ke4'],
        explanation: 'In the endgame, the king becomes an active fighting piece rather than a target needing defense.',
      },
      {
        id: 'step_2',
        fen: '8/5k2/6p1/7p/4K3/6P1/5P1P/8 w - - 1 2',
        prompt: 'Advance into opposition territory with Kf4 (Kf4).',
        solutionMoves: ['Kf4'],
        explanation: 'Infiltrating dark or light square weaknesses forces defensive pawn concessions from the opponent.',
      },
    ],
  },

  // 16. Advanced Tactical Calculation
  {
    id: 'lesson_advanced_tactics_16',
    title: 'Advanced Tactical Calculation',
    slug: 'advanced-tactical-calculation',
    description: 'Decoys, deflections, clearance sacrifices, and double checks that shatter even the most solid defenses.',
    category: 'advanced',
    icon: 'Sparkles',
    order: 16,
    totalSteps: 2,
    steps: [
      {
        id: 'step_1',
        fen: 'r2q1rk1/pp1b1ppp/2n1pn2/8/3P4/2NB1N2/PP1Q1PPP/R4RK1 w - - 5 12',
        prompt: 'Strike in the center with the thematic breakthrough d5! (d5).',
        solutionMoves: ['d5'],
        explanation: 'The d5 breakthrough creates tactical pins on the c-file and clears diagonal lines for the bishops.',
      },
      {
        id: 'step_2',
        fen: 'r4rk1/ppp2ppp/8/3q4/3n4/3Q4/PP1N1PPP/R4RK1 w - - 0 15',
        prompt: 'Reposition your knight with tempo by playing Nb3 (Nb3).',
        solutionMoves: ['Nb3'],
        explanation: 'Pinning the d4 knight to the queen on d5 while adding a second attacker guarantees winning the minor piece.',
      },
    ],
  },

  // 17. Zwischenzug & Quiet Moves
  {
    id: 'lesson_zwischenzug_17',
    title: 'Zwischenzug: The In-Between Move',
    slug: 'zwischenzug',
    description: 'Learn how unexpected intermediate checks and quiet moves disrupt opponent calculations and turn the tables.',
    category: 'advanced',
    icon: 'Pause',
    order: 17,
    totalSteps: 2,
    steps: [
      {
        id: 'step_1',
        fen: 'r1bqr1k1/pp3ppp/2n2n2/2bp4/8/2NB1N2/PPPB1PPP/R2QR1K1 w - - 6 11',
        prompt: 'Play the unexpected intermediate exchange Rxe8+ before recapturing (Rxe8+).',
        solutionMoves: ['Rxe8+'],
        explanation: 'By inserting Rxe8+ before dealing with the center, White disrupts Black’s piece coordination.',
      },
      {
        id: 'step_2',
        fen: 'r1b1r1k1/pp3ppp/2n2n2/2bp4/8/2NB1N2/PPPB1PPP/R2Q2K1 w - - 0 12',
        prompt: 'Reroute your knight with Bg5 to create a devastating pin (Bg5).',
        solutionMoves: ['Bg5'],
        explanation: 'Bg5 paralyzes the f6 defender and threatens central destruction on d5.',
      },
    ],
  },

  // 18. Positional Understanding
  {
    id: 'lesson_positional_18',
    title: 'Advanced Positional Play',
    slug: 'positional-understanding',
    description: 'Prophylaxis, space advantages, weak square complexes, and mastering pawn tension.',
    category: 'advanced',
    icon: 'Maximize2',
    order: 18,
    totalSteps: 2,
    steps: [
      {
        id: 'step_1',
        fen: 'r1b2rk1/pp1n1ppp/2p1pn2/q2p4/2PP4/1PbBPN2/PB1N1PPP/R2Q1RK1 w - - 5 10',
        prompt: 'Maintain central tension and preserve your bishop with Qc2 (Qc2).',
        solutionMoves: ['Qc2'],
        explanation: 'Developing the queen while targeting the enemy bishop keeps maximum tension on the board.',
      },
      {
        id: 'step_2',
        fen: 'r2q1rk1/pp3ppp/4p3/3pP3/3P4/2PQ1N2/PP1b2PP/R4RK1 w - - 0 15',
        prompt: 'Recapture cleanly with Qxd2 (Qxd2).',
        solutionMoves: ['Qxd2'],
        explanation: 'Consolidating the center with your major pieces prepares a minority attack on the queenside.',
      },
    ],
  },

  // 19. Opening Repertoire Foundations
  {
    id: 'lesson_opening_repertoire_19',
    title: 'Opening Repertoire Foundations',
    slug: 'opening-repertoires',
    description: 'Learn the core battle plans of the Italian Game, Queen’s Gambit, and defending against 1. e4.',
    category: 'advanced',
    icon: 'BookOpen',
    order: 19,
    totalSteps: 2,
    steps: [
      {
        id: 'step_1',
        fen: 'rnbqkbnr/ppp1pppp/8/3p4/2PP4/8/PP2PPPP/RNBQKBNR b KQkq c3 0 2',
        prompt: 'Decline the Queen’s Gambit solidly with 2... e6 (e6).',
        solutionMoves: ['e6'],
        explanation: '2... e6 forms the Orthodox defense, establishing a rock-solid pawn chain supporting d5.',
      },
      {
        id: 'step_2',
        fen: 'rnbqkb1r/ppp2ppp/4pn2/3p4/2PP4/2N5/PP2PPPP/R1BQKBNR w KQkq - 2 4',
        prompt: 'Pin the knight to the queen with 4. Bg5 (Bg5).',
        solutionMoves: ['Bg5'],
        explanation: 'Bg5 exerts maximum pressure against Black’s central hold on d5 in the Queen’s Gambit Declined.',
      },
    ],
  },

  // 20. Tournament Preparation & Psychology
  {
    id: 'lesson_tournament_prep_20',
    title: 'Tournament Preparation & Time Management',
    slug: 'tournament-preparation',
    description: 'Master the candidate move checklist, time management strategies, and blunder-prevention rituals.',
    category: 'advanced',
    icon: 'Trophy',
    order: 20,
    totalSteps: 2,
    steps: [
      {
        id: 'step_1',
        fen: 'r1bqk2r/pppp1ppp/2n5/4p3/1bB1n3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 1 6',
        prompt: 'Always double-check your blunder prevention routine before moving (Bd2).',
        solutionMoves: ['Bd2'],
        explanation: 'Before finalizing any move: 1. What is my opponent threatening? 2. Is my intended move safe? 3. Do I have a better candidate?',
      },
      {
        id: 'step_2',
        fen: '6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1',
        prompt: 'Deliver the finishing tournament blow with Ra8# (Ra8#).',
        solutionMoves: ['Ra8#'],
        explanation: 'Congratulations! You have completed the comprehensive NeoChess educational curriculum.',
      },
    ],
  },
];
