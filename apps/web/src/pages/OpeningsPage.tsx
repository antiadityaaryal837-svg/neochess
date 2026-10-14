import React, { useState } from 'react';
import { POPULAR_OPENINGS, OpeningData } from '@chess/shared';
import { ChessBoardWrapper } from '../components/chess/ChessBoardWrapper.js';
import { BookOpen, Search, BarChart2 } from 'lucide-react';

export const OpeningsPage: React.FC = () => {
  const [selectedOpening, setSelectedOpening] = useState<OpeningData>(POPULAR_OPENINGS[0]);
  const [search, setSearch] = useState('');

  const filtered = POPULAR_OPENINGS.filter(
    (o) =>
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.eco.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <BookOpen className="text-[#81b64c]" size={28} /> ECO Opening Explorer
        </h1>
        <p className="text-sm text-gray-400">
          Study opening theory, master move orders, and discover statistical win rates.
        </p>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3.5 top-3 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by opening name or ECO (e.g. Sicilian, B20)..."
          className="w-full bg-[#262522] border border-[#3c3934] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#81b64c]"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Opening List (5 cols) */}
        <div className="lg:col-span-5 space-y-2.5">
          {filtered.map((op) => {
            const isSelected = selectedOpening.eco === op.eco;
            return (
              <div
                key={op.eco}
                onClick={() => setSelectedOpening(op)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#2b2926] border-[#81b64c] shadow-md'
                    : 'bg-[#262522] border-[#3c3934] hover:border-[#504c46]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-white text-sm">{op.name}</span>
                  <span className="font-mono text-xs font-bold text-[#81b64c] bg-[#81b64c]/10 px-2 py-0.5 rounded border border-[#81b64c]/30">
                    {op.eco}
                  </span>
                </div>
                <div className="text-xs font-mono text-gray-400 mb-2">{op.moves}</div>

                {/* Win rate visual bar */}
                <div className="flex h-2 rounded-full overflow-hidden text-[9px] font-bold">
                  <div style={{ width: `${op.whiteWinsPercent}%` }} className="bg-white" title={`White ${op.whiteWinsPercent}%`} />
                  <div style={{ width: `${op.drawsPercent}%` }} className="bg-gray-500" title={`Draw ${op.drawsPercent}%`} />
                  <div style={{ width: `${op.blackWinsPercent}%` }} className="bg-zinc-800" title={`Black ${op.blackWinsPercent}%`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Board Preview & Statistical Analysis (7 cols) */}
        <div className="lg:col-span-7 flex flex-col md:flex-row gap-6 items-start">
          <div className="w-full max-w-[420px]">
            <ChessBoardWrapper
              position={selectedOpening.fen}
              boardOrientation="white"
              arePiecesDraggable={false}
            />
          </div>

          <div className="flex-1 p-6 bg-[#262522] border border-[#3c3934] rounded-2xl shadow-chess space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-mono text-[#81b64c] bg-[#81b64c]/15 px-2.5 py-1 rounded-lg border border-[#81b64c]/30">
                ECO {selectedOpening.eco}
              </span>
              <span className="text-xs text-gray-400 font-mono">
                {selectedOpening.totalGames.toLocaleString()} Master Games
              </span>
            </div>

            <h2 className="text-xl font-black text-white">{selectedOpening.name}</h2>
            <div className="p-3 bg-[#1e1d1a] border border-[#312e2b] rounded-xl font-mono text-sm font-bold text-gray-200">
              {selectedOpening.moves}
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">{selectedOpening.description}</p>

            {/* Win/Draw/Loss Statistics Breakdown */}
            <div className="pt-2 border-t border-[#312e2b] space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <BarChart2 size={14} className="text-[#81b64c]" /> Win Rates
              </span>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 bg-[#1e1d1a] rounded-xl border border-[#312e2b]">
                  <div className="text-gray-400 text-[11px] mb-0.5">White Wins</div>
                  <div className="font-bold text-white font-mono">{selectedOpening.whiteWinsPercent}%</div>
                </div>
                <div className="p-2.5 bg-[#1e1d1a] rounded-xl border border-[#312e2b]">
                  <div className="text-gray-400 text-[11px] mb-0.5">Draws</div>
                  <div className="font-bold text-gray-300 font-mono">{selectedOpening.drawsPercent}%</div>
                </div>
                <div className="p-2.5 bg-[#1e1d1a] rounded-xl border border-[#312e2b]">
                  <div className="text-gray-400 text-[11px] mb-0.5">Black Wins</div>
                  <div className="font-bold text-white font-mono">{selectedOpening.blackWinsPercent}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
