import React, { useState, useEffect } from 'react';
import { getSocket } from '../../services/socket.js';
import { useAuthStore } from '../../store/authStore.js';
import { api } from '../../services/api.js';
import { sounds } from '../../utils/sound.js';
import {
  Wifi,
  Globe,
  Swords,
  Search,
  Clock,
  Shield,
  Copy,
  Check,
  AlertCircle,
  X,
  UserCheck,
  Smartphone,
  Laptop,
  Users,
} from 'lucide-react';

interface OnlinePlayer {
  userId: string;
  username: string;
  rating: number;
  status: 'available' | 'in_game';
  isLocalNetwork: boolean;
  avatarUrl?: string;
  title?: string;
  connectedAt: number;
  isSelf?: boolean;
}

interface IncomingInvite {
  invitationId: string;
  fromUserId: string;
  fromUsername: string;
  fromRating: number;
  timeControl: string;
  rated: boolean;
  expiresAt: number;
  isLocalNetwork: boolean;
}

interface LobbyPanelProps {
  onGameReady?: (gameId: string) => void;
}

export const LobbyPanel: React.FC<LobbyPanelProps> = ({ onGameReady }) => {
  const { user } = useAuthStore();
  const [players, setPlayers] = useState<OnlinePlayer[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTimeControl, setSelectedTimeControl] = useState<string>('3+0');
  const [isRated, setIsRated] = useState<boolean>(true);

  // LAN network information
  const [lanInfo, setLanInfo] = useState<{ lanIp: string; webUrl: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Invitation state
  const [outgoingInvite, setOutgoingInvite] = useState<{
    invitationId?: string;
    toUsername: string;
    expiresAt: number;
  } | null>(null);
  const [incomingInvite, setIncomingInvite] = useState<IncomingInvite | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Fetch LAN info
  useEffect(() => {
    fetch('/api/network-info')
      .then((r) => r.json())
      .then((data) => setLanInfo(data))
      .catch(() => {});
  }, []);

  // Socket lobby listeners
  useEffect(() => {
    const socket = getSocket();

    // Request active players
    socket.emit('lobby:get_players');

    const handlePlayersList = (data: { players: OnlinePlayer[] }) => {
      setPlayers(data.players || []);
    };

    const handlePlayersUpdated = (data: { players: OnlinePlayer[] }) => {
      setPlayers(data.players || []);
    };

    const handleInviteReceived = (invite: IncomingInvite) => {
      setIncomingInvite(invite);
      sounds.playCheck(); // Pleasant sound alert for incoming game challenge
    };

    const handleInviteSent = (data: any) => {
      setOutgoingInvite((prev) => (prev ? { ...prev, ...data } : data));
    };

    const handleInviteDeclined = (data: { byUsername: string }) => {
      alert(`${data.byUsername || 'Opponent'} declined the game invitation.`);
      setOutgoingInvite(null);
    };

    const handleInviteCancelled = () => {
      setIncomingInvite(null);
    };

    const handleInviteExpired = () => {
      setOutgoingInvite(null);
      setIncomingInvite(null);
    };

    const handleInviteError = (data: { message: string }) => {
      setInviteError(data.message);
      setOutgoingInvite(null);
      setTimeout(() => setInviteError(null), 4000);
    };

    socket.on('lobby:players_list', handlePlayersList);
    socket.on('lobby:players_updated', handlePlayersUpdated);
    socket.on('invite:received', handleInviteReceived);
    socket.on('invite:sent', handleInviteSent);
    socket.on('invite:declined', handleInviteDeclined);
    socket.on('invite:cancelled', handleInviteCancelled);
    socket.on('invite:expired', handleInviteExpired);
    socket.on('invite:error', handleInviteError);

    return () => {
      socket.off('lobby:players_list', handlePlayersList);
      socket.off('lobby:players_updated', handlePlayersUpdated);
      socket.off('invite:received', handleInviteReceived);
      socket.off('invite:sent', handleInviteSent);
      socket.off('invite:declined', handleInviteDeclined);
      socket.off('invite:cancelled', handleInviteCancelled);
      socket.off('invite:expired', handleInviteExpired);
      socket.off('invite:error', handleInviteError);
    };
  }, []);

  const handleSendInvite = (targetPlayer: OnlinePlayer) => {
    const socket = getSocket();
    setInviteError(null);
    setOutgoingInvite({
      toUsername: targetPlayer.username,
      expiresAt: Date.now() + 30000,
    });

    socket.emit('invite:send', {
      toUserId: targetPlayer.userId,
      timeControl: selectedTimeControl,
      rated: isRated,
    });
  };

  const handleAcceptInvite = () => {
    if (!incomingInvite) return;
    const socket = getSocket();
    socket.emit('invite:accept', { invitationId: incomingInvite.invitationId });
    setIncomingInvite(null);
  };

  const handleDeclineInvite = () => {
    if (!incomingInvite) return;
    const socket = getSocket();
    socket.emit('invite:decline', { invitationId: incomingInvite.invitationId });
    setIncomingInvite(null);
  };

  const handleCancelOutgoingInvite = () => {
    if (!outgoingInvite?.invitationId) {
      setOutgoingInvite(null);
      return;
    }
    const socket = getSocket();
    socket.emit('invite:cancel', { invitationId: outgoingInvite.invitationId });
    setOutgoingInvite(null);
  };

  const handleCopyLanUrl = () => {
    if (!lanInfo?.webUrl) return;
    navigator.clipboard.writeText(lanInfo.webUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Filter players
  const filteredPlayers = players.filter((p) => {
    if (p.userId === user?.id) return false; // don't show self in challenge list
    if (searchQuery && !p.username.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Local Network Wi-Fi Discovery Banner */}
      {lanInfo && (
        <div className="p-4 bg-gradient-to-r from-emerald-950/60 via-[#1e271c] to-[#1e1d1a] border border-emerald-500/40 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-chess">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Wifi size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-white">Same Wi-Fi / Local Network Play</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/30 text-emerald-300">
                  Ready
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-0.5">
                Friends on your Wi-Fi can connect directly via{' '}
                <strong className="text-white font-mono bg-black/40 px-1.5 py-0.5 rounded">
                  {lanInfo.webUrl}
                </strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLanUrl}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#81b64c] hover:bg-[#95c65a] text-white text-xs font-bold rounded-xl transition-all shadow-sm"
              title="Copy URL for friends on the same Wi-Fi"
            >
              {copiedLink ? <Check size={14} /> : <Copy size={14} />}
              <span>{copiedLink ? 'Copied URL!' : 'Share Wi-Fi Link'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Error alert if any */}
      {inviteError && (
        <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-xs text-red-300 font-semibold flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{inviteError}</span>
          </div>
          <button onClick={() => setInviteError(null)} className="text-gray-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Invitation Configuration & Online Player Lobby Card */}
      <div className="p-6 bg-[#262522] border border-[#3c3934] rounded-2xl shadow-chess space-y-6">
        {/* Controls row: Time control & Search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#312e2b]">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Swords className="text-[#81b64c]" size={20} /> Live Player Lobby
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Select any player to challenge them directly to a live match.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Time Control Selector */}
            <div className="flex items-center gap-1.5 bg-[#1e1d1a] border border-[#3c3934] rounded-xl px-2.5 py-1">
              <Clock size={14} className="text-amber-400" />
              <select
                value={selectedTimeControl}
                onChange={(e) => setSelectedTimeControl(e.target.value)}
                className="bg-transparent text-white font-bold focus:outline-none"
              >
                <option value="1+0">1 min (Bullet)</option>
                <option value="2+1">2 | 1 (Bullet)</option>
                <option value="3+0">3 min (Blitz)</option>
                <option value="3+2">3 | 2 (Blitz)</option>
                <option value="5+0">5 min (Blitz)</option>
                <option value="10+0">10 min (Rapid)</option>
                <option value="15+10">15 | 10 (Rapid)</option>
              </select>
            </div>

            {/* Rated Toggle */}
            <label className="flex items-center gap-1.5 bg-[#1e1d1a] border border-[#3c3934] rounded-xl px-2.5 py-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isRated}
                onChange={(e) => setIsRated(e.target.checked)}
                className="w-3.5 h-3.5 text-[#81b64c] rounded"
              />
              <span className="font-bold text-gray-300">Rated</span>
            </label>

            {/* Search Input */}
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-2.5 text-gray-500" />
              <input
                type="text"
                placeholder="Search players..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#1e1d1a] border border-[#3c3934] rounded-xl pl-8 pr-3 py-1.5 text-white focus:outline-none focus:border-[#81b64c]"
              />
            </div>
          </div>
        </div>

        {/* Players Directory List */}
        <div className="space-y-2">
          {filteredPlayers.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#1e1d1a] border border-[#312e2b] flex items-center justify-center mx-auto text-gray-500">
                <Users size={22} />
              </div>
              <div className="text-sm font-bold text-white">No other players currently online</div>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Invite friends to join on your Wi-Fi or open a second browser tab to test local multiplayer.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredPlayers.map((p) => {
                const isAvailable = p.status === 'available';
                return (
                  <div
                    key={p.userId}
                    className="p-3.5 bg-[#1e1d1a] hover:bg-[#252420] border border-[#312e2b] rounded-xl flex items-center justify-between gap-3 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={p.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${p.username}`}
                          alt={p.username}
                          className="w-10 h-10 rounded-xl bg-[#2b2926] object-cover"
                        />
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#1e1d1a] ${
                            isAvailable ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                          title={isAvailable ? 'Available to play' : 'Currently in a game'}
                        />
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white text-xs">{p.username}</span>
                          {p.title && (
                            <span className="px-1 py-0.2 bg-red-600 text-white rounded text-[9px] font-black font-mono">
                              {p.title}
                            </span>
                          )}
                          {p.isLocalNetwork ? (
                            <span
                              className="px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-950 text-emerald-300 border border-emerald-600/40 flex items-center gap-1"
                              title="Connected via Same Local Wi-Fi"
                            >
                              <Wifi size={10} /> Same Wi-Fi
                            </span>
                          ) : (
                            <span
                              className="px-1.5 py-0.2 rounded text-[9px] font-black bg-blue-950 text-blue-300 border border-blue-600/40 flex items-center gap-1"
                              title="Online via Internet"
                            >
                              <Globe size={10} /> Online
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                          Rating: <strong className="text-gray-200">{p.rating}</strong> • {isAvailable ? 'Available' : 'In Game'}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSendInvite(p)}
                      disabled={!isAvailable || Boolean(outgoingInvite)}
                      className="px-3 py-1.5 bg-[#81b64c] hover:bg-[#95c65a] text-white text-xs font-bold rounded-xl transition-all disabled:opacity-40 flex items-center gap-1.5"
                    >
                      <Swords size={13} />
                      <span>Challenge</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Outgoing Invitation Modal */}
      {outgoingInvite && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-[#262522] border border-[#3c3934] rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-[#81b64c]/20 border border-[#81b64c]/40 flex items-center justify-center mx-auto text-[#81b64c] animate-pulse">
              <Swords size={24} />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Challenge Sent!</h3>
              <p className="text-xs text-gray-300">
                Waiting for <strong className="text-white">{outgoingInvite.toUsername}</strong> to accept your challenge...
              </p>
            </div>

            <div className="text-xs text-gray-500 font-mono animate-pulse">
              Invitation expires in 30 seconds
            </div>

            <button
              onClick={handleCancelOutgoingInvite}
              className="w-full py-2 bg-[#312e2b] hover:bg-[#3c3934] text-gray-300 font-bold rounded-xl text-xs transition-colors"
            >
              Cancel Challenge
            </button>
          </div>
        </div>
      )}

      {/* Incoming Invitation Modal Alert */}
      {incomingInvite && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-[#262522] border-2 border-[#81b64c] rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-full bg-[#81b64c]/20 border border-[#81b64c] flex items-center justify-center mx-auto text-[#81b64c] animate-bounce">
              <Swords size={28} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <span className="text-xs uppercase font-bold tracking-wider text-[#81b64c]">Direct Game Challenge</span>
                {incomingInvite.isLocalNetwork && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                    <Wifi size={11} /> Same Wi-Fi
                  </span>
                )}
              </div>

              <h3 className="text-xl font-black text-white">
                {incomingInvite.fromUsername}{' '}
                <span className="text-sm font-mono text-gray-400 font-normal">
                  ({incomingInvite.fromRating})
                </span>
              </h3>

              <div className="p-3 bg-[#1e1d1a] rounded-xl border border-[#312e2b] text-xs font-mono text-gray-300">
                Time Control: <strong className="text-white">{incomingInvite.timeControl}</strong> •{' '}
                {incomingInvite.rated ? 'Rated Game' : 'Casual Game'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleDeclineInvite}
                className="py-2.5 bg-[#312e2b] hover:bg-red-950 text-gray-300 hover:text-red-300 font-bold rounded-xl text-xs transition-all"
              >
                Decline
              </button>
              <button
                onClick={handleAcceptInvite}
                className="py-2.5 bg-[#81b64c] hover:bg-[#95c65a] text-white font-black rounded-xl text-xs transition-all shadow-chess"
              >
                Accept Challenge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
