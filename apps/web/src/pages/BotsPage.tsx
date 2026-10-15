import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BOT_PERSONAS, BotPersona } from '@chess/shared';
import { Bot, Swords, Sparkles, Shield, ChevronRight } from 'lucide-react';

export const BotsPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'beginner' | 'intermediate' | 'advanced' | 'master'>('all');
  const [selectedBot, setSelectedBot] = useState<BotPersona>(BOT_PERSONAS[0]);
  const [color, setColor] = useState<'white' | 'black' | 'random'>('white');

  const filteredBots = selectedCategory === 'all'
    ? BOT_PERSONAS
    : BOT_PERSONAS.filter((b: BotPersona) => b.category === selectedCategory);

  const handleStartGame = () => {
    navigate(`/play?bot=${selectedBot.id}&color=${color}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Bot className="text-[#81b64c]" size={28} /> Computer Personalities
        </h1>
        <p className="text-sm text-gray-400">
          Challenge adaptive AI bots with unique opening repertoires, tactical styles, and difficulty levels.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {['all', 'beginner', 'intermediate', 'advanced', 'master'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              selectedCategory === cat
                ? 'bg-[#81b64c] text-white shadow-glow-green'
                : 'bg-[#262522] text-gray-400 hover:text-white border border-[#3c3934]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Bots Grid (2 cols) */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredBots.map((bot: BotPersona) => {
            const isSelected = selectedBot.id === bot.id;
            return (
              <div
                key={bot.id}
                onClick={() => setSelectedBot(bot)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#2e2c28] border-[#81b64c] shadow-md scale-[1.01]'
                    : 'bg-[#262522] border-[#3c3934] hover:border-[#504c46]'
                }`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <img
                    src={bot.avatar}
                    alt={bot.name}
                    className="w-14 h-14 rounded-xl object-cover bg-[#161512] border border-[#3c3934]"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-white text-base truncate">{bot.name}</h3>
                      <span className="font-mono font-bold text-sm text-[#81b64c]">
                        {bot.rating}
                      </span>
                    </div>
                    <span className="text-xs text-amber-400 font-semibold uppercase tracking-wider">
                      {bot.category}
                    </span>
                    <p className="text-xs text-gray-400 line-clamp-2 mt-1">{bot.bio}</p>
                  </div>
                </div>

                <div className="p-2 bg-[#1e1d1a] rounded-lg text-xs italic text-gray-300 border border-[#312e2b]">
                  "{bot.quote}"
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Bot Details & Match Launch Card (1 col) */}
        <div className="p-6 bg-[#262522] border border-[#3c3934] rounded-2xl shadow-chess space-y-6 sticky top-6">
          <div className="text-center space-y-3">
            <img
              src={selectedBot.avatar}
              alt={selectedBot.name}
              className="w-24 h-24 rounded-2xl object-cover mx-auto border-2 border-[#81b64c] shadow-glow-green"
            />
            <div>
              <h2 className="text-xl font-black text-white">{selectedBot.name}</h2>
              <div className="text-sm font-bold font-mono text-[#81b64c]">Rating: {selectedBot.rating}</div>
            </div>
            <p className="text-xs text-gray-300 italic">"{selectedBot.quote}"</p>
          </div>

          <div className="space-y-3 pt-4 border-t border-[#312e2b]">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">
              Choose Your Color
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setColor('white')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                  color === 'white'
                    ? 'bg-white text-black border-white shadow-sm'
                    : 'bg-[#1e1d1a] text-gray-300 border-[#3c3934] hover:bg-[#2b2926]'
                }`}
              >
                White
              </button>
              <button
                onClick={() => setColor('random')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                  color === 'random'
                    ? 'bg-[#81b64c] text-white border-[#81b64c]'
                    : 'bg-[#1e1d1a] text-gray-300 border-[#3c3934] hover:bg-[#2b2926]'
                }`}
              >
                Random
              </button>
              <button
                onClick={() => setColor('black')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                  color === 'black'
                    ? 'bg-zinc-900 text-white border-zinc-500 shadow-sm'
                    : 'bg-[#1e1d1a] text-gray-300 border-[#3c3934] hover:bg-[#2b2926]'
                }`}
              >
                Black
              </button>
            </div>
          </div>

          <button
            onClick={handleStartGame}
            className="w-full py-3.5 px-4 bg-[#81b64c] hover:bg-[#95c65a] text-white font-bold text-sm rounded-xl shadow-glow-green flex items-center justify-center gap-2 transition-all"
          >
            <Swords size={18} />
            <span>Play vs {selectedBot.name}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
