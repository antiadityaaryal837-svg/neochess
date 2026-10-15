import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ChessBoardWrapper } from '../components/chess/ChessBoardWrapper.js';
import { ClockDisplay } from '../components/chess/ClockDisplay.js';
import { MoveHistoryPanel } from '../components/chess/MoveHistoryPanel.js';
import { GameControls } from '../components/chess/GameControls.js';
import { GameOverModal } from '../components/chess/GameOverModal.js';
import { EvalBar } from '../components/chess/EvalBar.js';
import { LobbyPanel } from '../components/play/LobbyPanel.js';
import { useGameStore } from '../store/gameStore.js';
import { useAuthStore } from '../store/authStore.js';
import { api } from '../services/api.js';
import { MessageSquare, Send, Users, Swords, ArrowLeft, Bot } from 'lucide-react';

export const PlayPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const botId = searchParams.get('bot');
  const gameIdParam = searchParams.get('gameId');
  const tc = searchParams.get('tc') || '3+0';

  const {
    game,
    chess,
    boardOrientation,
    lastMove,
    evalScore,
    makeMove,
    resignGame,
    offerDraw,
    flipBoard,
    gameEndResult,
    chatMessages,
    sendChatMessage,
    joinGame,
    resetGame,
    initSocketListeners,
  } = useGameStore();

  const { user, isAuthenticated, openAuthModal } = useAuthStore();
  const [chatInput, setChatInput] = useState('');
  const [showEndModal, setShowEndModal] = useState(false);
  const [viewMode, setViewMode] = useState<'lobby' | 'board'>('lobby');
  const hasCreatedRef = React.useRef(false);

  // Initialize socket listeners on mount
  useEffect(() => {
    initSocketListeners();
  }, [initSocketListeners]);

  // Handle direct URL params (bot, specific gameId, or view)
  const viewParam = searchParams.get('view');

  useEffect(() => {
    if (viewParam === 'lobby') {
      setViewMode('lobby');
    } else if (viewParam === 'board') {
      setViewMode('board');
    }
  }, [viewParam]);

  useEffect(() => {
    if (hasCreatedRef.current) return;

    if (gameIdParam) {
      hasCreatedRef.current = true;
      joinGame(gameIdParam);
      setViewMode('board');
    } else if (botId) {
      hasCreatedRef.current = true;
      api.createGame({
        timeControl: '10+0',
        rated: false,
        variant: 'standard',
        color: 'white',
        opponentType: 'computer',
        botId,
      }).then((res) => {
        joinGame(res.game.id);
        setViewMode('board');
      }).catch(console.error);
    }
  }, [botId, gameIdParam, joinGame]);

  // When game becomes active, switch view to board automatically
  useEffect(() => {
    if (game && game.status === 'in_progress') {
      setViewMode('board');
    }
  }, [game]);

  useEffect(() => {
    if (gameEndResult) {
      setShowEndModal(true);
    }
  }, [gameEndResult]);

  const handlePieceDrop = (source: string, target: string) => {
    return makeMove(source, target);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendChatMessage(chatInput);
    setChatInput('');
  };

  // Determine colors and players
  const whitePlayer = game?.whitePlayer || {
    id: 'white',
    username: user?.username || 'You',
    rating: user?.ratings?.blitz || 1200,
    avatarUrl: user?.profile?.avatarUrl,
  };

  const blackPlayer = game?.blackPlayer || {
    id: 'black',
    username: 'Opponent',
    rating: 1200,
    avatarUrl: undefined,
  };

  const topPlayer = boardOrientation === 'white' ? blackPlayer : whitePlayer;
  const bottomPlayer = boardOrientation === 'white' ? whitePlayer : blackPlayer;

  const topTime = boardOrientation === 'white' ? (game?.blackTimeMs || 180000) : (game?.whiteTimeMs || 180000);
  const bottomTime = boardOrientation === 'white' ? (game?.whiteTimeMs || 180000) : (game?.blackTimeMs || 180000);

  const topColor = boardOrientation === 'white' ? 'black' : 'white';
  const bottomColor = boardOrientation === 'white' ? 'white' : 'black';

  const isTopActive = game?.currentTurn === (boardOrientation === 'white' ? 'b' : 'w');
  const isBottomActive = game?.currentTurn === (boardOrientation === 'white' ? 'w' : 'b');

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Top View Mode Switcher */}
      <div className="flex items-center justify-between pb-2 border-b border-[#312e2b]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('lobby')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'lobby'
                ? 'bg-[#81b64c] text-white shadow-chess'
                : 'bg-[#262522] text-gray-400 hover:text-white border border-[#3c3934]'
            }`}
          >
            <Users size={16} />
            <span>Player Lobby (Wi-Fi & Online)</span>
          </button>

          <button
            onClick={() => setViewMode('board')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'board'
                ? 'bg-[#81b64c] text-white shadow-chess'
                : 'bg-[#262522] text-gray-400 hover:text-white border border-[#3c3934]'
            }`}
          >
            <Swords size={16} />
            <span>Match Board {game?.status === 'in_progress' && '• Live'}</span>
          </button>
        </div>

        <button
          onClick={() => navigate('/bots')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#262522] hover:bg-[#312e2b] text-gray-300 text-xs font-semibold rounded-xl border border-[#3c3934] transition-all"
        >
          <Bot size={15} />
          <span>Play vs Bots</span>
        </button>
      </div>

      {/* VIEW 1: PLAYER LOBBY */}
      {viewMode === 'lobby' && (
        <LobbyPanel
          onGameReady={(newGameId) => {
            joinGame(newGameId);
            setViewMode('board');
          }}
        />
      )}

      {/* VIEW 2: LIVE MATCH BOARD */}
      {viewMode === 'board' && (
        <>
          {/* Game Over Modal */}
          {showEndModal && gameEndResult && (
            <GameOverModal
              winner={gameEndResult.winner}
              reason={gameEndResult.reason}
              result={gameEndResult.result}
              playerColor={boardOrientation}
              whiteRatingDelta={gameEndResult.whiteRatingDelta}
              blackRatingDelta={gameEndResult.blackRatingDelta}
              gameId={game?.id || ''}
              onRematch={() => {
                setShowEndModal(false);
                setViewMode('lobby');
              }}
              onClose={() => {
                setShowEndModal(false);
                setViewMode('lobby');
              }}
            />
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Eval Bar + Chessboard (8 cols) */}
            <div className="lg:col-span-8 flex gap-3 sm:gap-4 items-center justify-center">
              {/* Vertical Eval Bar */}
              <div className="hidden sm:block h-[560px]">
                <EvalBar scoreCentipawns={evalScore} orientation={boardOrientation} isLive={true} />
              </div>

              {/* Board & Clocks Container */}
              <div className="flex flex-col gap-2 w-full max-w-[560px]">
                {/* Top Opponent Clock */}
                <ClockDisplay
                  player={topPlayer}
                  timeMs={topTime}
                  isActiveTurn={isTopActive}
                  color={topColor}
                />

                {/* Authoritative Interactive Board */}
                <ChessBoardWrapper
                  position={game?.fen || chess.fen()}
                  boardOrientation={boardOrientation}
                  onPieceDrop={handlePieceDrop}
                  lastMove={lastMove}
                  arePiecesDraggable={game ? game.status === 'in_progress' : true}
                />

                {/* Bottom Player Clock */}
                <ClockDisplay
                  player={bottomPlayer}
                  timeMs={bottomTime}
                  isActiveTurn={isBottomActive}
                  color={bottomColor}
                />

                {/* Game Controls Toolbar */}
                <GameControls
                  onResign={resignGame}
                  onOfferDraw={offerDraw}
                  onFlipBoard={flipBoard}
                  disabled={game ? game.status !== 'in_progress' : false}
                />
              </div>
            </div>

            {/* Right: Move History & In-Game Chat (4 cols) */}
            <div className="lg:col-span-4 flex flex-col gap-4 h-[640px]">
              {/* Move History Panel */}
              <div className="flex-1 min-h-[300px]">
                <MoveHistoryPanel
                  moves={game?.moves || []}
                  pgn={game?.pgn || chess.pgn()}
                  fen={game?.fen || chess.fen()}
                />
              </div>

              {/* In-Game Chat */}
              <div className="h-64 flex flex-col bg-[#262522] rounded-xl border border-[#3c3934] overflow-hidden">
                <div className="flex items-center gap-2 px-3.5 py-2 bg-[#21201d] border-b border-[#312e2b]">
                  <MessageSquare size={14} className="text-[#81b64c]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-300">Room Chat</span>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs">
                  {chatMessages.length === 0 ? (
                    <div className="text-center py-6 text-gray-500">
                      Be polite and have fun! Chat with your opponent or spectators.
                    </div>
                  ) : (
                    chatMessages.map((msg, i) => (
                      <div key={i} className="flex flex-col">
                        <span className="font-bold text-gray-400 text-[10px]">{msg.sender}</span>
                        <span className="text-gray-200">{msg.message}</span>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleSendChat} className="p-2 border-t border-[#312e2b] flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Send a message..."
                    className="flex-1 bg-[#1e1d1a] border border-[#3c3934] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#81b64c]"
                  />
                  <button
                    type="submit"
                    className="p-1.5 bg-[#81b64c] hover:bg-[#95c65a] text-white rounded-lg transition-colors"
                  >
                    <Send size={14} />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
