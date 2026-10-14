import { create } from 'zustand';
import { Chess } from 'chess.js';
import { GameRoomState, PieceColor, ChessMoveRecord } from '@chess/shared';
import { getSocket } from '../services/socket.js';
import { sounds } from '../utils/sound.js';
import confetti from 'canvas-confetti';

interface GameStore {
  game: GameRoomState | null;
  chess: Chess;
  boardOrientation: 'white' | 'black';
  selectedSquare: string | null;
  possibleMoves: string[];
  lastMove: { from: string; to: string } | null;
  evalScore: number;
  isSearchingMatch: boolean;
  matchQueueStatus: { timeControl: string; position?: number } | null;
  gameEndResult: {
    winner?: PieceColor | null;
    reason?: string;
    result?: string;
    whiteRatingDelta?: number;
    blackRatingDelta?: number;
  } | null;
  chatMessages: { sender: string; message: string; timestamp: string }[];

  initSocketListeners: () => void;
  joinGame: (gameId: string) => void;
  makeMove: (from: string, to: string, promotion?: 'q' | 'r' | 'b' | 'n') => boolean;
  resignGame: () => void;
  offerDraw: () => void;
  acceptDraw: () => void;
  flipBoard: () => void;
  startMatchmaking: (timeControl: string, rated?: boolean) => void;
  cancelMatchmaking: () => void;
  sendChatMessage: (message: string) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameStore>((set, get) => {
  const chess = new Chess();

  return {
    game: null,
    chess,
    boardOrientation: 'white',
    selectedSquare: null,
    possibleMoves: [],
    lastMove: null,
    evalScore: 0,
    isSearchingMatch: false,
    matchQueueStatus: null,
    gameEndResult: null,
    chatMessages: [],

    initSocketListeners: () => {
      const socket = getSocket();

      // Avoid double binding
      socket.off('game:state');
      socket.off('game:move_made');
      socket.off('game:ended');
      socket.off('game:clock_sync');
      socket.off('game:chat_message');
      socket.off('matchmaking:matched');
      socket.off('matchmaking:waiting');
      socket.off('matchmaking:left');

      socket.on('game:state', (gameState: GameRoomState) => {
        chess.load(gameState.fen);
        let lastMove = null;
        if (gameState.moves.length > 0) {
          const last = gameState.moves[gameState.moves.length - 1];
          lastMove = { from: last.from, to: last.to };
        }

        set({
          game: gameState,
          lastMove,
          gameEndResult: gameState.status !== 'in_progress' ? {
            winner: gameState.winner,
            reason: gameState.winReason,
            result: gameState.result,
          } : null,
        });

        if (gameState.status === 'in_progress') {
          sounds.playGameStart();
        }
      });

      socket.on('game:move_made', (data: {
        move: ChessMoveRecord;
        fen: string;
        turn: PieceColor;
        inCheck: boolean;
        whiteTimeMs: number;
        blackTimeMs: number;
      }) => {
        chess.load(data.fen);

        // Sound effect based on move
        if (data.inCheck) {
          sounds.playCheck();
        } else if (data.move.san.includes('x')) {
          sounds.playCapture();
        } else if (data.move.san.includes('O-O')) {
          sounds.playCastle();
        } else {
          sounds.playMove();
        }

        const currentGame = get().game;
        if (currentGame) {
          const updatedMoves = [...currentGame.moves, data.move];
          set({
            game: {
              ...currentGame,
              fen: data.fen,
              currentTurn: data.turn,
              moves: updatedMoves,
              whiteTimeMs: data.whiteTimeMs,
              blackTimeMs: data.blackTimeMs,
            },
            lastMove: { from: data.move.from, to: data.move.to },
            selectedSquare: null,
            possibleMoves: [],
          });
        }
      });

      socket.on('game:clock_sync', (data: { whiteTimeMs: number; blackTimeMs: number }) => {
        const currentGame = get().game;
        if (currentGame && currentGame.status === 'in_progress') {
          set({
            game: {
              ...currentGame,
              whiteTimeMs: data.whiteTimeMs,
              blackTimeMs: data.blackTimeMs,
            },
          });
        }
      });

      socket.on('game:ended', (data: {
        status: string;
        result: string;
        winner?: PieceColor | null;
        winReason?: string;
        whiteRatingDelta?: number;
        blackRatingDelta?: number;
      }) => {
        sounds.playGameEnd();

        // Celebration confetti if player won!
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });

        const currentGame = get().game;
        if (currentGame) {
          set({
            game: {
              ...currentGame,
              status: data.status as any,
              result: data.result as any,
              winner: data.winner,
              winReason: data.winReason,
            },
            gameEndResult: {
              winner: data.winner,
              reason: data.winReason,
              result: data.result,
              whiteRatingDelta: data.whiteRatingDelta,
              blackRatingDelta: data.blackRatingDelta,
            },
          });
        }
      });

      socket.on('game:chat_message', (msg: { sender: string; message: string; timestamp: string }) => {
        set((state) => ({
          chatMessages: [...state.chatMessages, msg],
        }));
      });

      socket.on('matchmaking:waiting', (status: { timeControl: string; position?: number }) => {
        set({ isSearchingMatch: true, matchQueueStatus: status });
      });

      socket.on('matchmaking:matched', (data: { gameId: string; color: 'white' | 'black' }) => {
        set({
          isSearchingMatch: false,
          matchQueueStatus: null,
          boardOrientation: data.color,
        });
        get().joinGame(data.gameId);
      });

      socket.on('matchmaking:left', () => {
        set({ isSearchingMatch: false, matchQueueStatus: null });
      });
    },

    joinGame: (gameId: string) => {
      const socket = getSocket();
      socket.emit('game:join', { gameId });
    },

    makeMove: (from: string, to: string, promotion = 'q') => {
      const socket = getSocket();
      const currentGame = get().game;
      if (!currentGame || currentGame.status !== 'in_progress') return false;

      // Optimistic check
      try {
        const testMove = chess.move({
          from: from as any,
          to: to as any,
          promotion: promotion as any,
        });

        if (!testMove) return false;

        // Authoritative move dispatch to server
        socket.emit('game:move', {
          gameId: currentGame.id,
          from,
          to,
          promotion,
        });

        return true;
      } catch {
        return false;
      }
    },

    resignGame: () => {
      const currentGame = get().game;
      if (!currentGame) return;
      const socket = getSocket();
      socket.emit('game:resign', { gameId: currentGame.id });
    },

    offerDraw: () => {
      const currentGame = get().game;
      if (!currentGame) return;
      const socket = getSocket();
      socket.emit('game:offer_draw', { gameId: currentGame.id });
    },

    acceptDraw: () => {
      const currentGame = get().game;
      if (!currentGame) return;
      const socket = getSocket();
      socket.emit('game:accept_draw', { gameId: currentGame.id });
    },

    flipBoard: () => {
      set((state) => ({
        boardOrientation: state.boardOrientation === 'white' ? 'black' : 'white',
      }));
    },

    startMatchmaking: (timeControl: string, rated = true) => {
      const socket = getSocket();
      socket.emit('matchmaking:join', { timeControl, rated });
      set({ isSearchingMatch: true, matchQueueStatus: { timeControl } });
    },

    cancelMatchmaking: () => {
      const socket = getSocket();
      socket.emit('matchmaking:leave');
      set({ isSearchingMatch: false, matchQueueStatus: null });
    },

    sendChatMessage: (message: string) => {
      const currentGame = get().game;
      if (!currentGame) return;
      const socket = getSocket();
      socket.emit('game:chat', { gameId: currentGame.id, message });
    },

    resetGame: () => {
      chess.reset();
      set({
        game: null,
        selectedSquare: null,
        possibleMoves: [],
        lastMove: null,
        gameEndResult: null,
        chatMessages: [],
      });
    },
  };
});
