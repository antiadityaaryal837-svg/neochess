import React, { useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess, Square } from 'chess.js';
import { BOARD_THEMES } from '@chess/shared';
import { useAuthStore } from '../../store/authStore.js';

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
  boardWidth = 520,
}) => {
  const { user } = useAuthStore();
  const themeName = user?.settings?.boardTheme || 'green';
  const theme = BOARD_THEMES[themeName] || BOARD_THEMES.green;

  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [optionSquares, setOptionSquares] = useState<Record<string, any>>({});

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

    // If square was already selected and clicked target is in optionSquares, perform move
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

  // Compile custom square styles (last move + selection)
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
    <div className="relative rounded-2xl overflow-hidden shadow-chess border-4 border-[#2b2926] bg-[#262522]">
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
        boardWidth={boardWidth}
        animationDuration={150}
        showBoardNotation={user?.settings?.showCoordinates !== false}
      />
    </div>
  );
};
