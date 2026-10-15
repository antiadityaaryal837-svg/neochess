import React from 'react';

// SVGs for classic, wood, alpha, and modern piece sets
export function getCustomPieces(pieceTheme: string): Record<string, (args: { squareWidth: number; isDragging: boolean }) => JSX.Element> | undefined {
  if (pieceTheme === 'neo' || !pieceTheme) {
    // Uses react-chessboard's high quality default Neo piece set
    return undefined;
  }

  const pieceStyles: Record<string, { fillWhite: string; strokeWhite: string; fillBlack: string; strokeBlack: string; filter?: string }> = {
    classic: {
      fillWhite: '#ffffff',
      strokeWhite: '#1e293b',
      fillBlack: '#1e293b',
      strokeBlack: '#0f172a',
    },
    wood: {
      fillWhite: '#fed7aa',
      strokeWhite: '#7c2d12',
      fillBlack: '#451a03',
      strokeBlack: '#291202',
    },
    alpha: {
      fillWhite: '#f8fafc',
      strokeWhite: '#334155',
      fillBlack: '#020617',
      strokeBlack: '#475569',
    },
    modern: {
      fillWhite: '#38bdf8',
      strokeWhite: '#0369a1',
      fillBlack: '#1e1b4b',
      strokeBlack: '#818cf8',
    },
  };

  const current = pieceStyles[pieceTheme] || pieceStyles.classic;

  const renderPiece = (symbol: string, isWhite: boolean, width: number) => {
    const fill = isWhite ? current.fillWhite : current.fillBlack;
    const stroke = isWhite ? current.strokeWhite : current.strokeBlack;
    const accent = isWhite ? '#000000' : '#ffffff';

    return (
      <div
        style={{
          width,
          height: width,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          userSelect: 'none',
        }}
      >
        <svg
          viewBox="0 0 45 45"
          width={width * 0.88}
          height={width * 0.88}
          style={{
            filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.35))',
            transition: 'transform 0.15s ease',
          }}
        >
          {symbol === 'P' && (
            <path
              d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.92 3.84 2.36 5.05-.72.63-1.63 1.27-2.36 2.45-1.22 1.98-1.5 4.5-1.5 7.5h16c0-3-.28-5.52-1.5-7.5-.73-1.18-1.64-1.82-2.36-2.45 1.44-1.21 2.36-3.02 2.36-5.05 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z"
              fill={fill}
              stroke={stroke}
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {symbol === 'N' && (
            <path
              d="M22 10c-3 0-6 2-7 6-1 4-1 9 2 12-2 2-3 5-3 8h17c0-4-2-7-4-10 3-1 5-4 5-8 0-5-4-8-10-8zm-2 4a1.5 1.5 0 110 3 1.5 1.5 0 010-3z"
              fill={fill}
              stroke={stroke}
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {symbol === 'B' && (
            <path
              d="M22.5 7a3 3 0 100 6 3 3 0 000-6zm-4 7c-2 2-3 5-3 9 0 3 2 6 4 8-1 1-2 3-2 5h10c0-2-1-4-2-5 2-2 4-5 4-8 0-4-1-7-3-9l-2 3-2-3z"
              fill={fill}
              stroke={stroke}
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {symbol === 'R' && (
            <path
              d="M12 12v4h3v-2h3v2h3v-2h3v2h3v-2h3v2h3v-4H12zm2 6l2 12h13l2-12H14zm-3 14v4h23v-4H11z"
              fill={fill}
              stroke={stroke}
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {symbol === 'Q' && (
            <path
              d="M11 15l3 13h17l3-13-5 5-6.5-9-6.5 9-5-5zm-1 15v5h25v-5H10z"
              fill={fill}
              stroke={stroke}
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {symbol === 'K' && (
            <path
              d="M21 6h3v3h-3V6zm-2 3h7v2h-7V9zm-5 6l4 12h15l4-12-6 4-5.5-6-5.5 6-6-4zm-2 14v5h27v-5H12z"
              fill={fill}
              stroke={stroke}
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>
      </div>
    );
  };

  const pieces: Record<string, (args: { squareWidth: number; isDragging: boolean }) => JSX.Element> = {};
  const types = ['P', 'N', 'B', 'R', 'Q', 'K'];

  for (const t of types) {
    pieces[`w${t}`] = ({ squareWidth }) => renderPiece(t, true, squareWidth);
    pieces[`b${t}`] = ({ squareWidth }) => renderPiece(t, false, squareWidth);
  }

  return pieces;
}
