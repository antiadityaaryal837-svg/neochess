import { Chess } from 'chess.js';
import { GameVariant, PieceColor } from '@chess/shared';

export interface VariantState {
  whiteChecks?: number;
  blackChecks?: number;
  isHillOccupied?: boolean;
  hillWinner?: PieceColor;
}

const HILL_SQUARES = new Set(['d4', 'd5', 'e4', 'e5']);

/**
 * Checks King of the Hill win condition:
 * If a king lands on d4, d5, e4, or e5, that player immediately wins.
 */
export function checkKingOfTheHillWin(chess: Chess): PieceColor | null {
  const board = chess.board();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const square = `${String.fromCharCode(97 + c)}${8 - r}`;
      const piece = board[r][c];
      if (piece && piece.type === 'k' && HILL_SQUARES.has(square)) {
        return piece.color;
      }
    }
  }
  return null;
}

/**
 * Generates a valid Chess960 (Fischer Random) starting position FEN
 */
export function generateChess960Fen(): string {
  const pieces: string[] = Array(8).fill('');
  
  // 1. Place Bishops on opposite colors (one even square, one odd square)
  const lightSquares = [1, 3, 5, 7];
  const darkSquares = [0, 2, 4, 6];
  const lightBishop = lightSquares[Math.floor(Math.random() * lightSquares.length)];
  const darkBishop = darkSquares[Math.floor(Math.random() * darkSquares.length)];
  pieces[lightBishop] = 'B';
  pieces[darkBishop] = 'B';

  // Helper for available empty positions
  const getEmpty = () => pieces.map((p, i) => (p === '' ? i : -1)).filter((i) => i !== -1);

  // 2. Place Queen in any remaining open square
  let available = getEmpty();
  const queenSquare = available[Math.floor(Math.random() * available.length)];
  pieces[queenSquare] = 'Q';

  // 3. Place two Knights in any remaining open squares
  available = getEmpty();
  const knight1 = available[Math.floor(Math.random() * available.length)];
  pieces[knight1] = 'N';

  available = getEmpty();
  const knight2 = available[Math.floor(Math.random() * available.length)];
  pieces[knight2] = 'N';

  // 4. Place Rooks and King: King MUST be between the two Rooks
  available = getEmpty(); // length 3: [r1, k, r2]
  pieces[available[0]] = 'R';
  pieces[available[1]] = 'K';
  pieces[available[2]] = 'R';

  const whiteBackRank = pieces.join('');
  const blackBackRank = pieces.join('').toLowerCase();

  return `${blackBackRank}/pppppppp/8/8/8/8/PPPPPPPP/${whiteBackRank} w KQkq - 0 1`;
}
