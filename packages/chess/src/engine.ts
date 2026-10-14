import { Chess, Square } from 'chess.js';
import {
  ChessMoveRecord,
  GameResult,
  GameStatus,
  GameVariant,
  PieceColor,
} from '@chess/shared';
import { checkKingOfTheHillWin, generateChess960Fen } from './variants.js';

export interface AuthoritativeGameState {
  fen: string;
  pgn: string;
  turn: PieceColor;
  inCheck: boolean;
  status: GameStatus;
  result: GameResult;
  winner?: PieceColor | null;
  winReason?: string;
  halfMoves: number;
  fullMoves: number;
  moveHistory: ChessMoveRecord[];
  whiteChecksDelivered: number;
  blackChecksDelivered: number;
}

export class ChessGameEngine {
  private chess: Chess;
  public variant: GameVariant;
  public whiteChecksDelivered = 0;
  public blackChecksDelivered = 0;
  public moveHistory: ChessMoveRecord[] = [];

  constructor(variant: GameVariant = 'standard', initialFen?: string) {
    this.variant = variant;
    let fenToLoad = initialFen;

    if (!fenToLoad) {
      if (variant === 'chess960') {
        fenToLoad = generateChess960Fen();
      }
    }

    this.chess = new Chess(fenToLoad);
  }

  public getFen(): string {
    return this.chess.fen();
  }

  public getPgn(): string {
    return this.chess.pgn();
  }

  public getTurn(): PieceColor {
    return this.chess.turn() as PieceColor;
  }

  public isInCheck(): boolean {
    return this.chess.inCheck();
  }

  public isGameOver(): boolean {
    if (this.chess.isGameOver()) return true;

    if (this.variant === 'three_check') {
      if (this.whiteChecksDelivered >= 3 || this.blackChecksDelivered >= 3) {
        return true;
      }
    }

    if (this.variant === 'king_of_the_hill') {
      if (checkKingOfTheHillWin(this.chess) !== null) {
        return true;
      }
    }

    return false;
  }

  public getLegalMoves(square?: string): string[] {
    if (square) {
      return this.chess.moves({ square: square as Square, verbose: true }).map((m) => m.to);
    }
    return this.chess.moves();
  }

  /**
   * Authoritative server-side move execution
   */
  public makeMove(
    from: string,
    to: string,
    promotion?: 'q' | 'r' | 'b' | 'n',
    timeRemainingWhiteMs: number = 0,
    timeRemainingBlackMs: number = 0,
    timeSpentMs: number = 0
  ): { success: boolean; moveRecord?: ChessMoveRecord; error?: string } {
    try {
      const movingPlayer = this.getTurn();

      // Attempt chess move
      const moveResult = this.chess.move({
        from: from as Square,
        to: to as Square,
        promotion: promotion || 'q',
      });

      if (!moveResult) {
        return { success: false, error: 'Illegal move' };
      }

      // Track three-check counts
      if (this.chess.inCheck()) {
        if (movingPlayer === 'w') {
          this.whiteChecksDelivered += 1;
        } else {
          this.blackChecksDelivered += 1;
        }
      }

      const moveRecord: ChessMoveRecord = {
        from: moveResult.from,
        to: moveResult.to,
        promotion: moveResult.promotion as 'q' | 'r' | 'b' | 'n' | undefined,
        san: moveResult.san,
        lan: moveResult.lan,
        fen: this.chess.fen(),
        color: movingPlayer,
        moveNumber: Math.ceil(this.chess.history().length / 2),
        timeSpentMs,
        whiteTimeRemainingMs: timeRemainingWhiteMs,
        blackTimeRemainingMs: timeRemainingBlackMs,
        createdAt: new Date().toISOString(),
      };

      this.moveHistory.push(moveRecord);

      return { success: true, moveRecord };
    } catch (err: any) {
      return { success: false, error: err.message || 'Illegal move execution' };
    }
  }

  /**
   * Determine exact game status and result
   */
  public evaluateStatus(): {
    status: GameStatus;
    result: GameResult;
    winner?: PieceColor | null;
    winReason?: string;
  } {
    // Check variant special conditions first
    if (this.variant === 'three_check') {
      if (this.whiteChecksDelivered >= 3) {
        return {
          status: 'checkmate',
          result: '1-0',
          winner: 'w',
          winReason: 'Three checks delivered by White',
        };
      }
      if (this.blackChecksDelivered >= 3) {
        return {
          status: 'checkmate',
          result: '0-1',
          winner: 'b',
          winReason: 'Three checks delivered by Black',
        };
      }
    }

    if (this.variant === 'king_of_the_hill') {
      const hillWinner = checkKingOfTheHillWin(this.chess);
      if (hillWinner === 'w') {
        return {
          status: 'checkmate',
          result: '1-0',
          winner: 'w',
          winReason: 'King of the Hill reached by White',
        };
      }
      if (hillWinner === 'b') {
        return {
          status: 'checkmate',
          result: '0-1',
          winner: 'b',
          winReason: 'King of the Hill reached by Black',
        };
      }
    }

    // Standard Chess rules
    if (this.chess.isCheckmate()) {
      const winner = this.chess.turn() === 'w' ? 'b' : 'w';
      return {
        status: 'checkmate',
        result: winner === 'w' ? '1-0' : '0-1',
        winner,
        winReason: 'Checkmate',
      };
    }

    if (this.chess.isStalemate()) {
      return {
        status: 'stalemate',
        result: '1/2-1/2',
        winner: null,
        winReason: 'Stalemate',
      };
    }

    if (this.chess.isThreefoldRepetition()) {
      return {
        status: 'threefold_repetition',
        result: '1/2-1/2',
        winner: null,
        winReason: 'Draw by threefold repetition',
      };
    }

    if (this.chess.isInsufficientMaterial()) {
      return {
        status: 'insufficient_material',
        result: '1/2-1/2',
        winner: null,
        winReason: 'Draw by insufficient material',
      };
    }

    if (this.chess.isDraw()) {
      return {
        status: 'fifty_move_rule',
        result: '1/2-1/2',
        winner: null,
        winReason: 'Draw by fifty-move rule',
      };
    }

    return {
      status: 'in_progress',
      result: '*',
      winner: null,
    };
  }

  public getFullState(): AuthoritativeGameState {
    const statusEval = this.evaluateStatus();
    return {
      fen: this.chess.fen(),
      pgn: this.chess.pgn(),
      turn: this.getTurn(),
      inCheck: this.isInCheck(),
      status: statusEval.status,
      result: statusEval.result,
      winner: statusEval.winner,
      winReason: statusEval.winReason,
      halfMoves: this.chess.history().length,
      fullMoves: Math.ceil(this.chess.history().length / 2),
      moveHistory: [...this.moveHistory],
      whiteChecksDelivered: this.whiteChecksDelivered,
      blackChecksDelivered: this.blackChecksDelivered,
    };
  }

  public reset(fen?: string): void {
    this.chess = new Chess(fen);
    this.moveHistory = [];
    this.whiteChecksDelivered = 0;
    this.blackChecksDelivered = 0;
  }
}
