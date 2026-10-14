import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChessBoardWrapper } from '../components/chess/ChessBoardWrapper.js';
import { ClockDisplay } from '../components/chess/ClockDisplay.js';
import { MoveHistoryPanel } from '../components/chess/MoveHistoryPanel.js';
import { GameControls } from '../components/chess/GameControls.js';
import { GameOverModal } from '../components/chess/GameOverModal.js';
import { EvalBar } from '../components/chess/EvalBar.js';
import { useGameStore } from '../store/gameStore.js';
import { useAuthStore } from '../store/authStore.js';
import { api } from '../services/api.js';
import { MessageSquare, Send } from 'lucide-react';

export const PlayPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const botId = searchParams.get('bot');
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
  } = useGameStore();

  const { user, isAuthenticated, openAuthModal } = useAuthStore();
  const [chatInput, setChatInput] = useState('');
  const [showEndModal, setShowEndModal] = useState(false);
  const hasCreatedRef = React.useRef(false);

  // Initialize game on load if specified
  useEffect(() => {
    if (hasCreatedRef.current) return;
    hasCreatedRef.current = true;

    if (botId) {
      // Create computer match
      api.createGame({
        timeControl: '10+0',
        rated: false,
        variant: 'standard',
        color: 'white',
        opponentType: 'computer',
        botId,
      }).then((res) => {
        joinGame(res.game.id);
      }).catch(console.error);
    } else if (!game) {
      // Create friendly or practice game
      api.createGame({
        timeControl: tc as any,
        rated: false,
        variant: 'standard',
        color: 'white',
        opponentType: 'computer',
        botId: 'bot_martin',
      }).then((res) => {
        joinGame(res.game.id);
      }).catch(console.error);
    }
  }, [botId, tc]);

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
    username: 'Martin (Bot)',
    rating: 400,
    isComputer: true,
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
  };

  const topPlayer = boardOrientation === 'white' ? blackPlayer : whitePlayer;
  const bottomPlayer = boardOrientation === 'white' ? whitePlayer : blackPlayer;

  const topTime = boardOrientation === 'white' ? (game?.blackTimeMs || 600000) : (game?.whiteTimeMs || 600000);
  const bottomTime = boardOrientation === 'white' ? (game?.whiteTimeMs || 600000) : (game?.blackTimeMs || 600000);

  const topColor = boardOrientation === 'white' ? 'black' : 'white';
  const bottomColor = boardOrientation === 'white' ? 'white' : 'black';

  const isTopActive = game?.currentTurn === (boardOrientation === 'white' ? 'b' : 'w');
  const isBottomActive = game?.currentTurn === (boardOrientation === 'white' ? 'w' : 'b');

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
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
            if (botId) {
              api.createGame({
                timeControl: '10+0',
                rated: false,
                variant: 'standard',
                color: 'white',
                opponentType: 'computer',
                botId,
              }).then((res) => joinGame(res.game.id));
            }
          }}
          onClose={() => setShowEndModal(false)}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Eval Bar + Chessboard (8 cols) */}
        <div className="lg:col-span-8 flex gap-3 items-center justify-center">
          {/* Vertical Eval Bar */}
          <div className="hidden sm:block h-[560px]">
            <EvalBar scoreCentipawns={evalScore} orientation={boardOrientation} />
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
    </div>
  );
};
