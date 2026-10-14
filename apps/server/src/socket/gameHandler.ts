import { Server, Socket } from 'socket.io';
import { prisma } from '../db.js';
import { ChessGameEngine, calculateMatchRatings } from '@chess/chess';
import {
  ChessMoveRecord,
  GameResult,
  GameRoomState,
  GameStatus,
  PieceColor,
  STANDARD_TIME_CONTROLS,
  BOT_PERSONAS,
} from '@chess/shared';

interface ActiveRoom {
  id: string;
  engine: ChessGameEngine;
  whitePlayer: any;
  blackPlayer: any;
  whiteTimeMs: number;
  blackTimeMs: number;
  baseSeconds: number;
  incrementSeconds: number;
  timeControl: string;
  rated: boolean;
  status: GameStatus;
  result: GameResult;
  winner?: PieceColor | null;
  winReason?: string;
  lastMoveTimestamp: number;
  clockInterval?: NodeJS.Timeout;
  drawOfferedBy?: PieceColor | null;
  rematchOfferedBy?: PieceColor | null;
  spectators: Set<string>;
  abandonmentTimer?: NodeJS.Timeout;
}

const activeRooms = new Map<string, ActiveRoom>();

// Matchmaking Queues by time control: e.g. '3+0' -> array of { socketId, userId, rating }
interface MatchQueueEntry {
  socket: Socket;
  userId: string;
  username: string;
  rating: number;
  timeControl: string;
  rated: boolean;
}

const matchmakingQueues = new Map<string, MatchQueueEntry[]>();

export function setupSocketGameHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    let currentUserId: string | null = null;
    let currentUsername: string | null = null;

    // 1. Authenticate / Identify Socket
    socket.on('auth:identify', async (data: { userId?: string; username?: string }) => {
      if (data?.userId) {
        currentUserId = data.userId;
        currentUsername = data.username || 'Anonymous';
        socket.data.userId = currentUserId;
        socket.data.username = currentUsername;

        // Update profile online status
        await prisma.profile.updateMany({
          where: { userId: currentUserId },
          data: { isOnline: true, lastSeenAt: new Date() },
        });
      }
    });

    // 2. Matchmaking Join
    socket.on('matchmaking:join', async (data: { timeControl: string; rated: boolean }) => {
      const tc = data.timeControl || '3+0';
      const rated = data.rated !== false;
      const userId = socket.data.userId || socket.id;
      const username = socket.data.username || `Player_${socket.id.substring(0, 5)}`;

      let userRating = 1200;
      if (socket.data.userId) {
        const ratingRec = await prisma.rating.findUnique({ where: { userId: socket.data.userId } });
        const tcConfig = STANDARD_TIME_CONTROLS[tc] || STANDARD_TIME_CONTROLS['3+0'];
        userRating = (ratingRec as any)?.[tcConfig.type] || 1200;
      }

      if (!matchmakingQueues.has(tc)) {
        matchmakingQueues.set(tc, []);
      }

      const queue = matchmakingQueues.get(tc)!;

      // Filter out existing socket if already in queue
      const existingIndex = queue.findIndex((e) => e.socket.id === socket.id || (socket.data.userId && e.userId === socket.data.userId));
      if (existingIndex !== -1) {
        queue.splice(existingIndex, 1);
      }

      // Check for suitable opponent in queue
      if (queue.length > 0) {
        const opponent = queue.shift()!;
        // Prevent matching against self
        if (opponent.userId === userId && opponent.socket.id === socket.id) {
          queue.push({ socket, userId, username, rating: userRating, timeControl: tc, rated });
          socket.emit('matchmaking:waiting', { timeControl: tc });
          return;
        }

        // Create match in DB
        const tcConfig = STANDARD_TIME_CONTROLS[tc] || STANDARD_TIME_CONTROLS['3+0'];
        const isWhite = Math.random() < 0.5;
        const whiteEntry = isWhite ? { userId, username, rating: userRating, socket } : opponent;
        const blackEntry = isWhite ? opponent : { userId, username, rating: userRating, socket };

        try {
          const game = await prisma.game.create({
            data: {
              fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
              variant: 'standard',
              timeControl: tc,
              baseSeconds: tcConfig.baseSeconds,
              incrementSeconds: tcConfig.incrementSeconds,
              rated,
              status: 'in_progress',
              whitePlayerId: whiteEntry.userId.startsWith('guest_') || whiteEntry.userId === whiteEntry.socket.id ? null : whiteEntry.userId,
              whiteRating: whiteEntry.rating,
              blackPlayerId: blackEntry.userId.startsWith('guest_') || blackEntry.userId === blackEntry.socket.id ? null : blackEntry.userId,
              blackRating: blackEntry.rating,
            },
          });

          // Notify both players
          whiteEntry.socket.emit('matchmaking:matched', {
            gameId: game.id,
            color: 'white',
            timeControl: tc,
            opponent: { username: blackEntry.username, rating: blackEntry.rating },
          });

          blackEntry.socket.emit('matchmaking:matched', {
            gameId: game.id,
            color: 'black',
            timeControl: tc,
            opponent: { username: whiteEntry.username, rating: whiteEntry.rating },
          });

          return;
        } catch (err) {
          console.error('Match creation error:', err);
        }
      }

      // No opponent ready, enqueue
      queue.push({
        socket,
        userId,
        username,
        rating: userRating,
        timeControl: tc,
        rated,
      });

      socket.emit('matchmaking:waiting', { timeControl: tc, position: queue.length });
    });

    // 3. Matchmaking Leave
    socket.on('matchmaking:leave', () => {
      for (const queue of matchmakingQueues.values()) {
        const idx = queue.findIndex((e) => e.socket.id === socket.id);
        if (idx !== -1) {
          queue.splice(idx, 1);
        }
      }
      socket.emit('matchmaking:left');
    });

    // 4. Join Game Room
    socket.on('game:join', async (data: { gameId: string }) => {
      const { gameId } = data;
      if (!gameId) return;

      socket.join(gameId);

      let room = activeRooms.get(gameId);

      if (!room) {
        // Load from DB
        const game = await prisma.game.findUnique({
          where: { id: gameId },
          include: {
            whitePlayer: { select: { id: true, username: true, profile: true } },
            blackPlayer: { select: { id: true, username: true, profile: true } },
            moves: { orderBy: { moveNumber: 'asc' } },
          },
        });

        if (!game) {
          socket.emit('game:error', { message: 'Game does not exist' });
          return;
        }

        const engine = new ChessGameEngine(game.variant as any, game.fen);
        engine.moveHistory = game.moves.map((m) => ({
          from: m.fromSquare,
          to: m.toSquare,
          promotion: m.promotion as any,
          san: m.san,
          lan: m.lan || undefined,
          fen: m.fen,
          color: m.color as any,
          moveNumber: m.moveNumber,
          timeSpentMs: m.timeSpentMs,
          whiteTimeRemainingMs: m.whiteTimeRemainingMs,
          blackTimeRemainingMs: m.blackTimeRemainingMs,
          createdAt: m.createdAt.toISOString(),
        }));

        const tcConfig = STANDARD_TIME_CONTROLS[game.timeControl] || STANDARD_TIME_CONTROLS['3+0'];

        // Determine current remaining clock times
        let whiteTime = tcConfig.baseSeconds * 1000;
        let blackTime = tcConfig.baseSeconds * 1000;

        if (game.moves.length > 0) {
          const lastMove = game.moves[game.moves.length - 1];
          whiteTime = lastMove.whiteTimeRemainingMs;
          blackTime = lastMove.blackTimeRemainingMs;
        }

        room = {
          id: gameId,
          engine,
          whitePlayer: {
            id: game.whitePlayerId || 'white_bot',
            username: game.isWhiteBot ? (game.whiteBotName || 'Bot') : (game.whitePlayer?.username || 'White Player'),
            avatarUrl: game.whitePlayer?.profile?.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=white',
            rating: game.whiteRating,
            isComputer: game.isWhiteBot,
          },
          blackPlayer: {
            id: game.blackPlayerId || 'black_bot',
            username: game.isBlackBot ? (game.blackBotName || 'Bot') : (game.blackPlayer?.username || 'Black Player'),
            avatarUrl: game.blackPlayer?.profile?.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=black',
            rating: game.blackRating,
            isComputer: game.isBlackBot,
          },
          whiteTimeMs: whiteTime,
          blackTimeMs: blackTime,
          baseSeconds: game.baseSeconds,
          incrementSeconds: game.incrementSeconds,
          timeControl: game.timeControl,
          rated: game.rated,
          status: game.status as GameStatus,
          result: game.result as GameResult,
          winner: game.winnerColor as PieceColor | null,
          winReason: game.winReason || undefined,
          lastMoveTimestamp: Date.now(),
          spectators: new Set<string>(),
        };

        activeRooms.set(gameId, room);
        startRoomClock(room, io);
      }

      // Add socket as spectator if not one of the two players
      const isPlayer =
        (socket.data.userId && (socket.data.userId === room.whitePlayer.id || socket.data.userId === room.blackPlayer.id));
      if (!isPlayer) {
        room.spectators.add(socket.id);
      }

      // Emit current game state
      emitRoomState(room, socket);
    });

    // 5. Authoritative Move
    socket.on('game:move', async (data: { gameId: string; from: string; to: string; promotion?: 'q' | 'r' | 'b' | 'n' }) => {
      const { gameId, from, to, promotion } = data;
      const room = activeRooms.get(gameId);

      if (!room || room.status !== 'in_progress') {
        socket.emit('game:illegal_move', { error: 'Game is not in progress' });
        return;
      }

      const turn = room.engine.getTurn(); // 'w' or 'b'
      const playerColor = turn === 'w' ? 'white' : 'black';
      const expectedPlayer = turn === 'w' ? room.whitePlayer : room.blackPlayer;

      // Verify player identity in rated human vs human matches
      const isVsBot = room.whitePlayer.isComputer || room.blackPlayer.isComputer;
      if (!isVsBot && socket.data.userId && !expectedPlayer.isComputer && socket.data.userId !== expectedPlayer.id) {
        socket.emit('game:illegal_move', { error: 'Not your turn' });
        return;
      }

      // Calculate time spent on this move
      const now = Date.now();
      const elapsedMs = Math.max(0, now - room.lastMoveTimestamp);
      room.lastMoveTimestamp = now;

      if (turn === 'w') {
        room.whiteTimeMs = Math.max(0, room.whiteTimeMs - elapsedMs) + room.incrementSeconds * 1000;
      } else {
        room.blackTimeMs = Math.max(0, room.blackTimeMs - elapsedMs) + room.incrementSeconds * 1000;
      }

      // Attempt move on engine
      const moveResult = room.engine.makeMove(
        from,
        to,
        promotion,
        room.whiteTimeMs,
        room.blackTimeMs,
        elapsedMs
      );

      if (!moveResult.success || !moveResult.moveRecord) {
        socket.emit('game:illegal_move', { error: moveResult.error || 'Illegal move' });
        return;
      }

      const moveRecord = moveResult.moveRecord;

      // Save move to DB
      await prisma.gameMove.create({
        data: {
          gameId: room.id,
          moveNumber: moveRecord.moveNumber,
          color: moveRecord.color,
          san: moveRecord.san,
          lan: moveRecord.lan,
          fromSquare: moveRecord.from,
          toSquare: moveRecord.to,
          promotion: moveRecord.promotion,
          fen: moveRecord.fen,
          whiteTimeRemainingMs: room.whiteTimeMs,
          blackTimeRemainingMs: room.blackTimeMs,
          timeSpentMs: elapsedMs,
        },
      });

      // Update game FEN & PGN in DB
      await prisma.game.update({
        where: { id: room.id },
        data: {
          fen: room.engine.getFen(),
          pgn: room.engine.getPgn(),
        },
      });

      // Broadcast move to everyone in room
      io.to(gameId).emit('game:move_made', {
        move: moveRecord,
        fen: room.engine.getFen(),
        turn: room.engine.getTurn(),
        inCheck: room.engine.isInCheck(),
        whiteTimeMs: room.whiteTimeMs,
        blackTimeMs: room.blackTimeMs,
      });

      // Check game termination conditions
      if (room.engine.isGameOver()) {
        const evaluation = room.engine.evaluateStatus();
        await endGame(room, io, evaluation.status, evaluation.result, evaluation.winner, evaluation.winReason);
        return;
      }

      // Check if next turn is a computer bot
      const nextTurn = room.engine.getTurn();
      const nextPlayer = nextTurn === 'w' ? room.whitePlayer : room.blackPlayer;
      if (nextPlayer.isComputer && room.status === 'in_progress') {
        scheduleBotMove(room, io);
      }
    });

    // 6. Resign
    socket.on('game:resign', async (data: { gameId: string }) => {
      const room = activeRooms.get(data.gameId);
      if (!room || room.status !== 'in_progress') return;

      const isWhite = socket.data.userId === room.whitePlayer.id;
      const winner: PieceColor = isWhite ? 'b' : 'w';
      const result: GameResult = isWhite ? '0-1' : '1-0';
      const reason = `${isWhite ? 'White' : 'Black'} resigned`;

      await endGame(room, io, 'resigned', result, winner, reason);
    });

    // 7. Offer Draw
    socket.on('game:offer_draw', (data: { gameId: string }) => {
      const room = activeRooms.get(data.gameId);
      if (!room || room.status !== 'in_progress') return;

      const isWhite = socket.data.userId === room.whitePlayer.id;
      room.drawOfferedBy = isWhite ? 'w' : 'b';

      socket.to(data.gameId).emit('game:draw_offered', {
        offeredBy: room.drawOfferedBy,
      });
    });

    // 8. Accept Draw
    socket.on('game:accept_draw', async (data: { gameId: string }) => {
      const room = activeRooms.get(data.gameId);
      if (!room || room.status !== 'in_progress' || !room.drawOfferedBy) return;

      await endGame(room, io, 'draw_agreed', '1/2-1/2', null, 'Draw agreed by mutual consensus');
    });

    // 9. In-game Chat Message
    socket.on('game:chat', async (data: { gameId: string; message: string }) => {
      if (!data?.message || data.message.trim().length === 0) return;
      const username = socket.data.username || 'Spectator';

      io.to(data.gameId).emit('game:chat_message', {
        sender: username,
        message: data.message.trim().substring(0, 200),
        timestamp: new Date().toISOString(),
      });
    });

    // 10. Disconnect Handling
    socket.on('disconnect', () => {
      // Remove from matchmaking queues
      for (const queue of matchmakingQueues.values()) {
        const idx = queue.findIndex((e) => e.socket.id === socket.id);
        if (idx !== -1) queue.splice(idx, 1);
      }

      // Check if player was in an active room
      for (const room of activeRooms.values()) {
        if (room.spectators.has(socket.id)) {
          room.spectators.delete(socket.id);
        }
      }
    });
  });
}

function startRoomClock(room: ActiveRoom, io: Server) {
  if (room.clockInterval) clearInterval(room.clockInterval);

  room.clockInterval = setInterval(async () => {
    if (room.status !== 'in_progress') {
      if (room.clockInterval) clearInterval(room.clockInterval);
      return;
    }

    const now = Date.now();
    const elapsedMs = now - room.lastMoveTimestamp;
    const turn = room.engine.getTurn();

    let currentWhite = room.whiteTimeMs;
    let currentBlack = room.blackTimeMs;

    if (turn === 'w') {
      currentWhite = Math.max(0, room.whiteTimeMs - elapsedMs);
      if (currentWhite <= 0) {
        await endGame(room, io, 'timeout', '0-1', 'b', 'White ran out of time');
        return;
      }
    } else {
      currentBlack = Math.max(0, room.blackTimeMs - elapsedMs);
      if (currentBlack <= 0) {
        await endGame(room, io, 'timeout', '1-0', 'w', 'Black ran out of time');
        return;
      }
    }

    // Sync clock every 1 second
    io.to(room.id).emit('game:clock_sync', {
      whiteTimeMs: currentWhite,
      blackTimeMs: currentBlack,
      turn,
    });
  }, 1000);
}

async function scheduleBotMove(room: ActiveRoom, io: Server) {
  // Realistic thinking delay between 500ms and 1400ms
  const delay = Math.floor(500 + Math.random() * 800);

  setTimeout(async () => {
    if (room.status !== 'in_progress') return;

    const legalMoves = room.engine.getLegalMoves();
    if (legalMoves.length === 0) return;

    // Tactical bot move selection:
    // Prioritize checkmates, checks, and captures
    let chosenMove = legalMoves[0];
    const checkmateMoves = legalMoves.filter((m) => m.includes('#'));
    const captureMoves = legalMoves.filter((m) => m.includes('x'));
    const checkMoves = legalMoves.filter((m) => m.includes('+'));

    if (checkmateMoves.length > 0) {
      chosenMove = checkmateMoves[0];
    } else if (captureMoves.length > 0 && Math.random() > 0.3) {
      chosenMove = captureMoves[Math.floor(Math.random() * captureMoves.length)];
    } else if (checkMoves.length > 0 && Math.random() > 0.4) {
      chosenMove = checkMoves[Math.floor(Math.random() * checkMoves.length)];
    } else {
      chosenMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
    }

    // Convert SAN to move execution on engine
    try {
      const now = Date.now();
      const elapsedMs = Math.max(0, now - room.lastMoveTimestamp);
      room.lastMoveTimestamp = now;

      const turn = room.engine.getTurn();
      if (turn === 'w') {
        room.whiteTimeMs = Math.max(0, room.whiteTimeMs - elapsedMs) + room.incrementSeconds * 1000;
      } else {
        room.blackTimeMs = Math.max(0, room.blackTimeMs - elapsedMs) + room.incrementSeconds * 1000;
      }

      // Temporary chess helper to find from/to coordinates for the SAN
      const tempChess = new (await import('chess.js')).Chess(room.engine.getFen());
      const res = tempChess.move(chosenMove);
      if (!res) return;

      const moveResult = room.engine.makeMove(
        res.from,
        res.to,
        res.promotion as any,
        room.whiteTimeMs,
        room.blackTimeMs,
        elapsedMs
      );

      if (moveResult.success && moveResult.moveRecord) {
        const moveRecord = moveResult.moveRecord;

        await prisma.gameMove.create({
          data: {
            gameId: room.id,
            moveNumber: moveRecord.moveNumber,
            color: moveRecord.color,
            san: moveRecord.san,
            lan: moveRecord.lan,
            fromSquare: moveRecord.from,
            toSquare: moveRecord.to,
            promotion: moveRecord.promotion,
            fen: moveRecord.fen,
            whiteTimeRemainingMs: room.whiteTimeMs,
            blackTimeRemainingMs: room.blackTimeMs,
            timeSpentMs: elapsedMs,
          },
        });

        await prisma.game.update({
          where: { id: room.id },
          data: {
            fen: room.engine.getFen(),
            pgn: room.engine.getPgn(),
          },
        });

        io.to(room.id).emit('game:move_made', {
          move: moveRecord,
          fen: room.engine.getFen(),
          turn: room.engine.getTurn(),
          inCheck: room.engine.isInCheck(),
          whiteTimeMs: room.whiteTimeMs,
          blackTimeMs: room.blackTimeMs,
        });

        if (room.engine.isGameOver()) {
          const evaluation = room.engine.evaluateStatus();
          await endGame(room, io, evaluation.status, evaluation.result, evaluation.winner, evaluation.winReason);
        }
      }
    } catch (err) {
      console.error('Bot move calculation error:', err);
    }
  }, delay);
}

async function endGame(
  room: ActiveRoom,
  io: Server,
  status: GameStatus,
  result: GameResult,
  winner?: PieceColor | null,
  winReason?: string
) {
  room.status = status;
  room.result = result;
  room.winner = winner;
  room.winReason = winReason;

  if (room.clockInterval) {
    clearInterval(room.clockInterval);
  }

  let whiteRatingDelta = 0;
  let blackRatingDelta = 0;

  // Calculate rating changes if rated game
  if (room.rated && room.whitePlayer.id && room.blackPlayer.id && !room.whitePlayer.isComputer && !room.blackPlayer.isComputer) {
    const whiteScore: 1 | 0.5 | 0 = result === '1-0' ? 1 : result === '1/2-1/2' ? 0.5 : 0;
    const ratingChanges = calculateMatchRatings(
      room.whitePlayer.rating,
      room.blackPlayer.rating,
      whiteScore
    );

    whiteRatingDelta = ratingChanges.playerDelta;
    blackRatingDelta = ratingChanges.opponentDelta;

    const tcConfig = STANDARD_TIME_CONTROLS[room.timeControl] || STANDARD_TIME_CONTROLS['3+0'];
    const tcField = tcConfig.type;

    try {
      await prisma.$transaction([
        prisma.rating.update({
          where: { userId: room.whitePlayer.id },
          data: { [tcField]: ratingChanges.playerNewRating },
        }),
        prisma.ratingHistory.create({
          data: {
            userId: room.whitePlayer.id,
            category: tcField,
            rating: ratingChanges.playerNewRating,
            change: whiteRatingDelta,
            gameId: room.id,
          },
        }),
        prisma.rating.update({
          where: { userId: room.blackPlayer.id },
          data: { [tcField]: ratingChanges.opponentNewRating },
        }),
        prisma.ratingHistory.create({
          data: {
            userId: room.blackPlayer.id,
            category: tcField,
            rating: ratingChanges.opponentNewRating,
            change: blackRatingDelta,
            gameId: room.id,
          },
        }),
      ]);
    } catch (err) {
      console.error('Failed to update ratings in database:', err);
    }
  }

  // Update game in DB
  await prisma.game.update({
    where: { id: room.id },
    data: {
      status,
      result,
      winnerColor: winner,
      winReason,
      whiteRatingChange: whiteRatingDelta,
      blackRatingChange: blackRatingDelta,
      endedAt: new Date(),
    },
  });

  // Broadcast game:ended to everyone
  io.to(room.id).emit('game:ended', {
    status,
    result,
    winner,
    winReason,
    whiteRatingDelta,
    blackRatingDelta,
  });
}

function emitRoomState(room: ActiveRoom, socket: Socket) {
  const fullState = room.engine.getFullState();

  const state: GameRoomState = {
    id: room.id,
    fen: fullState.fen,
    pgn: fullState.pgn,
    status: room.status,
    variant: room.engine.variant,
    timeControl: STANDARD_TIME_CONTROLS[room.timeControl] || STANDARD_TIME_CONTROLS['3+0'],
    rated: room.rated,
    whitePlayer: room.whitePlayer,
    blackPlayer: room.blackPlayer,
    currentTurn: fullState.turn,
    halfMoves: fullState.halfMoves,
    fullMoves: fullState.fullMoves,
    moves: fullState.moveHistory,
    whiteTimeMs: room.whiteTimeMs,
    blackTimeMs: room.blackTimeMs,
    lastMoveTimestamp: room.lastMoveTimestamp,
    drawOfferedBy: room.drawOfferedBy,
    rematchOfferedBy: room.rematchOfferedBy,
    winner: room.winner,
    winReason: room.winReason,
    result: room.result,
    spectatorCount: room.spectators.size,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  socket.emit('game:state', state);
}
