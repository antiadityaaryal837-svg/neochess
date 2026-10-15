import React, { useState, useEffect, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess, Square } from 'chess.js';
import { BOARD_THEMES } from '@chess/shared';
import { useAuthStore } from '../../store/authStore.js';
import { useSettingsStore } from '../../store/settingsStore.js';
import { getCustomPieces } from './pieceThemes.js';

interface ChessBoardWrapperProps {
  position: string;
  boardOrientation?: 'white' | 'black';
  onPieceDrop?: (sourceSquare: string, targetSquare: string) => boolean;
  onSquareClick?: (square: string) => void;
  lastMove?: { from: string; to: string } | null;
  arePiecesDraggable?: boolean;
  customArrows?: [string, string, string?][];
  boardWidth?: number;
}

export const ChessBoardWrapper: React.FC<ChessBoardWrapperProps> = ({
  position,
  boardOrientation = 'white',
  onPieceDrop,
  onSquareClick,
  lastMove,
  arePiecesDraggable = true,
  customArrows = [],
  boardWidth = 540,
}) => {
  const { boardTheme, pieceTheme, showCoordinates } = useSettingsStore();
  const theme = BOARD_THEMES[boardTheme] || BOARD_THEMES.green;
  const customPieces = getCustomPieces(pieceTheme);

  const containerRef = useRef<HTMLDivElement>(null);
  const [computedWidth, setComputedWidth] = useState<number>(boardWidth);

  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [optionSquares, setOptionSquares] = useState<Record<string, any>>({});

  // Dynamic responsive board sizing observer
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const clientWidth = containerRef.current.clientWidth;
        if (clientWidth > 0) {
          // Keep board square and proportional, fitting within container width
          const target = Math.min(boardWidth, clientWidth);
          setComputedWidth(Math.max(260, target));
        }
      }
    };

    handleResize();
    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    window.addEventListener('resize', handleResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [boardWidth]);

  // Helper to calculate legal move destinations
  const getMoveOptions = (square: string) => {
    try {
      const chess = new Chess(position);
      const moves = chess.moves({
        square: square as Square,
        verbose: true,
      });

      if (moves.length === 0) {
        setOptionSquares({});
        return false;
      }

      const newSquares: Record<string, any> = {};
      moves.forEach((move) => {
        const isCapture = chess.get(move.to as Square);
        newSquares[move.to] = {
          background: isCapture
            ? 'radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)'
            : 'radial-gradient(circle, rgba(0,0,0,.2) 25%, transparent 25%)',
          borderRadius: '50%',
        };
      });

      newSquares[square] = {
        background: 'rgba(255, 255, 0, 0.4)',
      };

      setOptionSquares(newSquares);
      return true;
    } catch {
      return false;
    }
  };

  const handleSquareClick = (square: string) => {
    if (onSquareClick) {
      onSquareClick(square);
    }

    if (selectedSquare && optionSquares[square]) {
      if (onPieceDrop) {
        onPieceDrop(selectedSquare, square);
      }
      setSelectedSquare(null);
      setOptionSquares({});
      return;
    }

    const hasOptions = getMoveOptions(square);
    if (hasOptions) {
      setSelectedSquare(square);
    } else {
      setSelectedSquare(null);
      setOptionSquares({});
    }
  };

  const handlePieceDrop = (source: string, target: string) => {
    setSelectedSquare(null);
    setOptionSquares({});
    if (onPieceDrop) {
      return onPieceDrop(source, target);
    }
    return false;
  };

  // Compile custom square styles (last move + selection highlights)
  const customSquareStyles: Record<string, any> = { ...optionSquares };

  if (lastMove) {
    customSquareStyles[lastMove.from] = {
      backgroundColor: 'rgba(247, 247, 105, 0.45)',
      ...customSquareStyles[lastMove.from],
    };
    customSquareStyles[lastMove.to] = {
      backgroundColor: 'rgba(247, 247, 105, 0.45)',
      ...customSquareStyles[lastMove.to],
    };
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full flex items-center justify-center rounded-2xl overflow-hidden shadow-chess border-2 sm:border-4 border-[#2b2926] bg-[#262522] touch-none"
    >
      <Chessboard
        position={position}
        boardOrientation={boardOrientation}
        onPieceDrop={handlePieceDrop}
        onSquareClick={handleSquareClick}
        arePiecesDraggable={arePiecesDraggable}
        customSquareStyles={customSquareStyles}
        customArrows={customArrows as any}
        customDarkSquareStyle={{ backgroundColor: theme.dark }}
        customLightSquareStyle={{ backgroundColor: theme.light }}
        customPieces={customPieces}
        boardWidth={computedWidth}
        animationDuration={150}
        showBoardNotation={showCoordinates}
      />
    </div>
  );
};
