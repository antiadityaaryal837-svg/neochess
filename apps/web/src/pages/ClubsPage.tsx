import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api.js';
import {
  Users,
  Shield,
  ShieldAlert,
  Check,
  UserPlus,
  Plus,
  Search,
  MessageSquare,
  Megaphone,
  Settings,
  Trash2,
  Lock,
  Globe,
  ArrowLeft,
  Send,
  UserCheck,
  UserX,
  Crown,
  Info,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore.js';

export const ClubsPage: React.FC = () => {
  const { user, isAuthenticated, openAuthModal } = useAuthStore();
  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedClub, setSelectedClub] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'announcements' | 'members' | 'chat' | 'settings'>('announcements');

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [newClubName, setNewClubName] = useState<string>('');
  const [newClubDesc, setNewClubDesc] = useState<string>('');
  const [newClubPrivate, setNewClubPrivate] = useState<boolean>(false);
  const [newClubAvatar, setNewClubAvatar] = useState<string>('');
  const [creating, setCreating] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string>('');

  // Announcement Form State
  const [annTitle, setAnnTitle] = useState<string>('');
  const [annContent, setAnnContent] = useState<string>('');
  const [submittingAnn, setSubmittingAnn] = useState<boolean>(false);

  // Chat State
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [sendingChat, setSendingChat] = useState<boolean>(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Edit Club State
  const [editName, setEditName] = useState<string>('');
  const [editDesc, setEditDesc] = useState<string>('');
  const [editPrivate, setEditPrivate] = useState<boolean>(false);
  const [editAvatar, setEditAvatar] = useState<string>('');
  const [savingSettings, setSavingSettings] = useState<boolean>(false);

  const fetchClubs = async (search = searchQuery) => {
    try {
      setLoading(true);
      const res = await api.getClubs(search);
      setClubs(res.clubs || []);
    } catch (err) {
      console.error('Failed to load clubs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClubs();
  }, []);

  const loadClubDetails = async (idOrSlug: string) => {
    try {
      const res = await api.getClubDetails(idOrSlug);
      setSelectedClub(res.club);
      setEditName(res.club.name);
      setEditDesc(res.club.description || '');
      setEditPrivate(res.club.isPrivate);
      setEditAvatar(res.club.avatarUrl || '');

      // Load chat messages
      loadMessages(res.club.id);
    } catch (err) {
      console.error('Failed to fetch club details:', err);
    }
  };

  const loadMessages = async (clubId: string) => {
    try {
      const res = await api.getClubMessages(clubId);
      setChatMessages(res.messages || []);
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      console.error('Failed to load club chat:', err);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchClubs(searchQuery);
  };

  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    if (!newClubName.trim()) {
      setCreateError('Please provide a club name.');
      return;
    }

    try {
      setCreating(true);
      setCreateError('');
      const res = await api.createClub({
        name: newClubName.trim(),
        description: newClubDesc.trim(),
        isPrivate: newClubPrivate,
        avatarUrl: newClubAvatar.trim() || undefined,
      });

      setIsCreateModalOpen(false);
      setNewClubName('');
      setNewClubDesc('');
      setNewClubPrivate(false);
      setNewClubAvatar('');
      await fetchClubs();
      if (res.club) {
        await loadClubDetails(res.club.id);
      }
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create club');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinLeave = async (club: any) => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    try {
      if (club.isMember) {
        if (confirm(`Are you sure you want to leave ${club.name}?`)) {
          await api.leaveClub(club.id);
          if (selectedClub?.id === club.id) {
            await loadClubDetails(club.id);
          }
          await fetchClubs();
        }
      } else {
        await api.joinClub(club.id);
        if (selectedClub?.id === club.id) {
          await loadClubDetails(club.id);
        }
        await fetchClubs();
      }
    } catch (err: any) {
      alert(err.message || 'Action failed');
    }
  };

  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim() || !selectedClub) return;

    try {
      setSubmittingAnn(true);
      await api.postClubAnnouncement(selectedClub.id, annTitle, annContent);
      setAnnTitle('');
      setAnnContent('');
      await loadClubDetails(selectedClub.id);
    } catch (err: any) {
      alert(err.message || 'Failed to post announcement');
    } finally {
      setSubmittingAnn(false);
    }
  };

  const handleDeleteAnnouncement = async (annId: string) => {
    if (!selectedClub || !confirm('Delete this announcement?')) return;
    try {
      await api.deleteClubAnnouncement(selectedClub.id, annId);
      await loadClubDetails(selectedClub.id);
    } catch (err: any) {
      alert(err.message || 'Failed to delete announcement');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedClub || !isAuthenticated) return;

    try {
      setSendingChat(true);
      await api.sendClubMessage(selectedClub.id, chatInput.trim());
      setChatInput('');
      await loadMessages(selectedClub.id);
    } catch (err: any) {
      alert(err.message || 'Failed to send message');
    } finally {
      setSendingChat(false);
    }
  };

  const handleRoleChange = async (targetUserId: string, newRole: 'admin' | 'member') => {
    if (!selectedClub) return;
    try {
      await api.updateClubMemberRole(selectedClub.id, targetUserId, newRole);
      await loadClubDetails(selectedClub.id);
    } catch (err: any) {
      alert(err.message || 'Failed to update member role');
    }
  };

  const handleRemoveMember = async (targetUserId: string, username: string) => {
    if (!selectedClub || !confirm(`Remove ${username} from ${selectedClub.name}?`)) return;
    try {
      await api.removeClubMember(selectedClub.id, targetUserId);
      await loadClubDetails(selectedClub.id);
    } catch (err: any) {
      alert(err.message || 'Failed to remove member');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClub) return;
    try {
      setSavingSettings(true);
      await api.updateClub(selectedClub.id, {
        name: editName.trim(),
        description: editDesc.trim(),
        isPrivate: editPrivate,
        avatarUrl: editAvatar.trim(),
      });
      await loadClubDetails(selectedClub.id);
      await fetchClubs();
      alert('Club settings saved successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to update club settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleDeleteClub = async () => {
    if (!selectedClub) return;
    const confirmName = prompt(`To confirm deletion, type "${selectedClub.name}":`);
    if (confirmName !== selectedClub.name) {
      alert('Name did not match. Deletion cancelled.');
      return;
    }

    try {
      await api.deleteClub(selectedClub.id);
      setSelectedClub(null);
      await fetchClubs();
      alert('Club has been permanently deleted.');
    } catch (err: any) {
      alert(err.message || 'Failed to delete club');
    }
  };

  // If a club is selected, render the Club Detail View
  if (selectedClub) {
    const isOwner = selectedClub.isOwner;
    const canManage = selectedClub.canManage;

    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-in fade-in duration-300">
        <button
          onClick={() => {
            setSelectedClub(null);
            fetchClubs();
          }}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} /> Back to All Clubs
        </button>

        {/* Club Header Banner */}
        <div className="bg-[#262522] border border-[#3c3934] rounded-2xl overflow-hidden shadow-chess">
          <div className="h-32 bg-gradient-to-r from-[#1c1b18] via-[#2d2b27] to-[#1c1b18] border-b border-[#3c3934] relative">
            <div className="absolute top-4 right-4 flex items-center gap-2">
              {selectedClub.isPrivate ? (
                <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-xs font-semibold rounded-full flex items-center gap-1.5 border border-amber-500/30">
                  <Lock size={12} /> Private Club
                </span>
              ) : (
                <span className="px-3 py-1 bg-[#81b64c]/20 text-[#81b64c] text-xs font-semibold rounded-full flex items-center gap-1.5 border border-[#81b64c]/30">
                  <Globe size={12} /> Public Club
                </span>
              )}
            </div>
          </div>

          <div className="px-6 pb-6 pt-0 relative flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12">
            <div className="flex items-end gap-4">
              <img
                src={
                  selectedClub.avatarUrl ||
                  'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=200&q=80'
                }
                alt={selectedClub.name}
                className="w-24 h-24 rounded-2xl object-cover border-4 border-[#262522] shadow-2xl bg-[#1c1b18]"
              />
              <div className="pb-1">
                <h1 className="text-2xl font-black text-white flex items-center gap-2">
                  {selectedClub.name}
                </h1>
                <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                  <span>
                    Created by <strong className="text-gray-200">{selectedClub.owner?.username}</strong>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Users size={13} className="text-[#81b64c]" /> {selectedClub.memberCount} Members
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleJoinLeave(selectedClub)}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
                  selectedClub.isMember
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30'
                    : 'bg-[#81b64c] hover:bg-[#95c65a] text-white shadow-glow-green'
                }`}
              >
                {selectedClub.isMember ? (
                  <>
                    <UserX size={16} /> Leave Club
                  </>
                ) : (
                  <>
                    <UserPlus size={16} /> Join Club
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 px-6 border-t border-[#312e2b] bg-[#21201d]">
            <button
              onClick={() => setActiveTab('announcements')}
              className={`px-4 py-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'announcements'
                  ? 'border-[#81b64c] text-white'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <Megaphone size={14} /> Announcements ({selectedClub.announcements?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`px-4 py-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'members'
                  ? 'border-[#81b64c] text-white'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <Users size={14} /> Members ({selectedClub.members?.length || 0})
            </button>
            <button
              onClick={() => {
                setActiveTab('chat');
                loadMessages(selectedClub.id);
              }}
              className={`px-4 py-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'chat'
                  ? 'border-[#81b64c] text-white'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <MessageSquare size={14} /> Club Chat
            </button>
            {canManage && (
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === 'settings'
                    ? 'border-[#81b64c] text-white'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                <Settings size={14} /> Manage Club
              </button>
            )}
          </div>
        </div>

        {/* Tab 1: Announcements */}
        {activeTab === 'announcements' && (
          <div className="space-y-6">
            {canManage && (
              <form
                onSubmit={handlePostAnnouncement}
                className="p-5 bg-[#262522] border border-[#3c3934] rounded-2xl shadow-chess space-y-4"
              >
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Megaphone size={16} className="text-[#81b64c]" /> Post Official Announcement
                </h3>
                <input
                  type="text"
                  placeholder="Announcement Title"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  className="w-full px-4 py-2 bg-[#1c1b18] border border-[#3c3934] rounded-xl text-sm text-white focus:outline-none focus:border-[#81b64c]"
                  required
                />
                <textarea
                  placeholder="Share details, upcoming club tournaments, or general updates..."
                  rows={3}
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  className="w-full px-4 py-2 bg-[#1c1b18] border border-[#3c3934] rounded-xl text-sm text-white focus:outline-none focus:border-[#81b64c] resize-none"
                  required
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingAnn}
                    className="px-5 py-2 bg-[#81b64c] hover:bg-[#95c65a] disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-glow-green flex items-center gap-2 transition-all"
                  >
                    <Send size={14} /> {submittingAnn ? 'Posting...' : 'Publish Announcement'}
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-4">
              {selectedClub.announcements?.length === 0 ? (
                <div className="p-8 text-center bg-[#262522] border border-[#3c3934] rounded-2xl text-gray-400 text-sm">
                  No announcements have been posted yet.
                </div>
              ) : (
                selectedClub.announcements?.map((ann: any) => (
                  <div
                    key={ann.id}
                    className="p-6 bg-[#262522] border border-[#3c3934] rounded-2xl shadow-chess space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            ann.author?.profile?.avatarUrl ||
                            `https://api.dicebear.com/7.x/bottts/svg?seed=${ann.author?.username}`
                          }
                          alt={ann.author?.username}
                          className="w-9 h-9 rounded-xl object-cover border border-[#3c3934]"
                        />
                        <div>
                          <h4 className="font-bold text-white text-base leading-none">{ann.title}</h4>
                          <span className="text-[11px] text-gray-400 mt-1 inline-block">
                            by {ann.author?.username} • {new Date(ann.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {canManage && (
                        <button
                          onClick={() => handleDeleteAnnouncement(ann.id)}
                          className="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                          title="Delete announcement"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{ann.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Members Roster */}
        {activeTab === 'members' && (
          <div className="bg-[#262522] border border-[#3c3934] rounded-2xl overflow-hidden shadow-chess">
            <div className="p-4 border-b border-[#312e2b] flex items-center justify-between">
              <span className="text-sm font-bold text-white">Club Members ({selectedClub.members?.length || 0})</span>
            </div>
            <div className="divide-y divide-[#312e2b]">
              {selectedClub.members?.map((m: any) => {
                const memberUser = m.user;
                const isMemberOwner = selectedClub.ownerId === memberUser.id;
                const isMemberAdmin = m.role === 'admin';

                return (
                  <div key={m.id} className="p-4 flex items-center justify-between hover:bg-[#2c2a26] transition-colors">
                    <div className="flex items-center gap-3.5">
                      <img
                        src={
                          memberUser.profile?.avatarUrl ||
                          `https://api.dicebear.com/7.x/bottts/svg?seed=${memberUser.username}`
                        }
                        alt={memberUser.username}
                        className="w-10 h-10 rounded-xl object-cover border border-[#3c3934]"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{memberUser.username}</span>
                          {isMemberOwner && (
                            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-bold rounded-md flex items-center gap-1 border border-amber-500/30">
                              <Crown size={11} /> Owner
                            </span>
                          )}
                          {isMemberAdmin && !isMemberOwner && (
                            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] font-bold rounded-md flex items-center gap-1 border border-blue-500/30">
                              <Shield size={11} /> Admin
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-gray-400">
                          Joined {new Date(m.joinedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {isOwner && !isMemberOwner && (
                      <div className="flex items-center gap-2">
                        {m.role === 'admin' ? (
                          <button
                            onClick={() => handleRoleChange(memberUser.id, 'member')}
                            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs font-semibold rounded-lg transition-colors"
                          >
                            Demote to Member
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRoleChange(memberUser.id, 'admin')}
                            className="px-3 py-1.5 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 text-xs font-semibold rounded-lg border border-blue-500/40 transition-colors flex items-center gap-1"
                          >
                            <Shield size={12} /> Make Admin
                          </button>
                        )}
                        <button
                          onClick={() => handleRemoveMember(memberUser.id, memberUser.username)}
                          className="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                          title="Remove from club"
                        >
                          <UserX size={15} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Club Chat */}
        {activeTab === 'chat' && (
          <div className="bg-[#262522] border border-[#3c3934] rounded-2xl overflow-hidden shadow-chess flex flex-col h-[520px]">
            <div className="p-4 border-b border-[#312e2b] bg-[#21201d] flex items-center justify-between">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <MessageSquare size={16} className="text-[#81b64c]" /> Club Chat Room
              </span>
              <button
                onClick={() => loadMessages(selectedClub.id)}
                className="text-xs text-[#81b64c] hover:underline"
              >
                Refresh
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {chatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 text-xs">
                  <MessageSquare size={32} className="text-gray-600 mb-2" />
                  No messages yet. Say hello to your fellow club members!
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isMe = msg.senderId === user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 text-xs ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isMe && (
                        <img
                          src={
                            msg.sender?.profile?.avatarUrl ||
                            `https://api.dicebear.com/7.x/bottts/svg?seed=${msg.sender?.username}`
                          }
                          alt={msg.sender?.username}
                          className="w-7 h-7 rounded-lg object-cover border border-[#3c3934]"
                        />
                      )}
                      <div
                        className={`max-w-[75%] p-3 rounded-2xl ${
                          isMe
                            ? 'bg-[#81b64c] text-white rounded-br-sm'
                            : 'bg-[#1c1b18] text-gray-200 border border-[#3c3934] rounded-bl-sm'
                        }`}
                      >
                        {!isMe && (
                          <div className="font-bold text-[11px] text-gray-400 mb-1">
                            {msg.sender?.username}
                          </div>
                        )}
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        <span
                          className={`text-[9px] mt-1 block ${
                            isMe ? 'text-white/70 text-right' : 'text-gray-500'
                          }`}
                        >
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatBottomRef} />
            </div>

            <form
              onSubmit={handleSendMessage}
              className="p-3 border-t border-[#312e2b] bg-[#21201d] flex items-center gap-2"
            >
              <input
                type="text"
                placeholder={
                  isAuthenticated ? 'Type a message to the club...' : 'Please log in to chat'
                }
                disabled={!isAuthenticated || sendingChat}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-[#1c1b18] border border-[#3c3934] rounded-xl text-xs text-white focus:outline-none focus:border-[#81b64c]"
              />
              <button
                type="submit"
                disabled={!isAuthenticated || !chatInput.trim() || sendingChat}
                className="p-2.5 bg-[#81b64c] hover:bg-[#95c65a] disabled:opacity-40 text-white rounded-xl shadow-glow-green transition-all"
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        )}

        {/* Tab 4: Settings (Manage Club) */}
        {activeTab === 'settings' && canManage && (
          <div className="space-y-6">
            <form
              onSubmit={handleSaveSettings}
              className="p-6 bg-[#262522] border border-[#3c3934] rounded-2xl shadow-chess space-y-4"
            >
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Settings size={18} className="text-[#81b64c]" /> Club Configuration
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Club Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-2 bg-[#1c1b18] border border-[#3c3934] rounded-xl text-sm text-white focus:outline-none focus:border-[#81b64c]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full px-4 py-2 bg-[#1c1b18] border border-[#3c3934] rounded-xl text-sm text-white focus:outline-none focus:border-[#81b64c] resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Avatar / Logo Image URL</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={editAvatar}
                    onChange={(e) => setEditAvatar(e.target.value)}
                    className="w-full px-4 py-2 bg-[#1c1b18] border border-[#3c3934] rounded-xl text-sm text-white focus:outline-none focus:border-[#81b64c]"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="editPrivate"
                    checked={editPrivate}
                    onChange={(e) => setEditPrivate(e.target.checked)}
                    className="rounded bg-[#1c1b18] border-[#3c3934] text-[#81b64c] focus:ring-0"
                  />
                  <label htmlFor="editPrivate" className="text-xs text-gray-300 cursor-pointer">
                    Private Club (approval required to join)
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-[#312e2b]">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-5 py-2.5 bg-[#81b64c] hover:bg-[#95c65a] disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-glow-green transition-all"
                >
                  {savingSettings ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>

            {/* Danger Zone */}
            {isOwner && (
              <div className="p-6 bg-rose-950/20 border border-rose-900/40 rounded-2xl shadow-chess space-y-4">
                <h4 className="text-sm font-bold text-rose-400 flex items-center gap-2">
                  <ShieldAlert size={16} /> Danger Zone
                </h4>
                <p className="text-xs text-gray-400">
                  Deleting this club is permanent and will remove all club members, announcements, and chat messages.
                </p>
                <button
                  type="button"
                  onClick={handleDeleteClub}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-2"
                >
                  <Trash2 size={14} /> Delete Club Permanently
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Default Club Directory View
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Header with Search and Create Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Users className="text-[#81b64c]" size={28} /> Chess Clubs & Communities
          </h1>
          <p className="text-sm text-gray-400">
            Connect with like-minded chess players, participate in internal club battles, and share strategies.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <form onSubmit={handleSearch} className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search clubs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#262522] border border-[#3c3934] rounded-xl text-xs text-white focus:outline-none focus:border-[#81b64c]"
            />
          </form>

          <button
            onClick={() => {
              if (!isAuthenticated) {
                openAuthModal('login');
              } else {
                setIsCreateModalOpen(true);
              }
            }}
            className="px-4 py-2 bg-[#81b64c] hover:bg-[#95c65a] text-white text-xs font-bold rounded-xl shadow-glow-green flex items-center gap-1.5 transition-all whitespace-nowrap"
          >
            <Plus size={16} /> Create Club
          </button>
        </div>
      </div>

      {/* Clubs Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-48 bg-[#262522] border border-[#3c3934] rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : clubs.length === 0 ? (
        <div className="p-12 text-center bg-[#262522] border border-[#3c3934] rounded-2xl text-gray-400">
          <Users size={40} className="mx-auto mb-3 text-gray-600" />
          <h3 className="font-bold text-white text-base">No Clubs Found</h3>
          <p className="text-xs text-gray-400 mt-1">
            {searchQuery ? 'Try another search term or create your own club.' : 'Be the first to start a club!'}
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-4 px-4 py-2 bg-[#81b64c] text-white text-xs font-bold rounded-xl"
          >
            Create a Club
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clubs.map((club) => {
            const isJoined = club.isMember;

            return (
              <div
                key={club.id}
                className="p-6 bg-[#262522] border border-[#3c3934] hover:border-[#504c46] rounded-2xl shadow-chess flex flex-col justify-between transition-all"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-3.5">
                    <img
                      src={
                        club.avatarUrl ||
                        'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=150&q=80'
                      }
                      alt={club.name}
                      className="w-14 h-14 rounded-2xl object-cover border border-[#3c3934] bg-[#1c1b18]"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-white text-base truncate">{club.name}</h3>
                        {club.isPrivate && <Lock size={12} className="text-amber-400 flex-shrink-0" />}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Users size={13} className="text-[#81b64c]" /> {club.memberCount} Members
                        </span>
                        <span>•</span>
                        <span>{club._count?.announcements || 0} posts</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-gray-300 leading-relaxed line-clamp-2">
                    {club.description || 'Welcome to our chess club! Play games, discuss tactics, and improve.'}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-[#312e2b] flex items-center justify-between">
                  <span className="text-[11px] text-gray-400">
                    Leader: <strong className="text-gray-300">{club.owner?.username}</strong>
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => loadClubDetails(club.slug || club.id)}
                      className="px-3 py-1.5 bg-[#312e2b] hover:bg-[#3c3934] text-xs font-semibold text-gray-200 rounded-xl transition-colors"
                    >
                      View Club
                    </button>
                    <button
                      onClick={() => handleJoinLeave(club)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                        isJoined
                          ? 'bg-[#81b64c]/20 text-[#81b64c] border border-[#81b64c]/40'
                          : 'bg-[#81b64c] hover:bg-[#95c65a] text-white shadow-glow-green'
                      }`}
                    >
                      {isJoined ? (
                        <>
                          <Check size={13} /> Joined
                        </>
                      ) : (
                        <>
                          <UserPlus size={13} /> Join
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Club Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#262522] border border-[#3c3934] rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Users size={20} className="text-[#81b64c]" /> Create a New Club
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {createError && (
              <div className="p-3 bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs rounded-xl">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateClub} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Club Name <span className="text-[#81b64c]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kathmandu Chess Knights"
                  value={newClubName}
                  onChange={(e) => setNewClubName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#1c1b18] border border-[#3c3934] rounded-xl text-sm text-white focus:outline-none focus:border-[#81b64c]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Description</label>
                <textarea
                  placeholder="What is this club about? Who should join?"
                  rows={3}
                  value={newClubDesc}
                  onChange={(e) => setNewClubDesc(e.target.value)}
                  className="w-full px-4 py-2 bg-[#1c1b18] border border-[#3c3934] rounded-xl text-sm text-white focus:outline-none focus:border-[#81b64c] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Logo / Avatar Image URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newClubAvatar}
                  onChange={(e) => setNewClubAvatar(e.target.value)}
                  className="w-full px-4 py-2 bg-[#1c1b18] border border-[#3c3934] rounded-xl text-xs text-white focus:outline-none focus:border-[#81b64c]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="modalPrivate"
                  checked={newClubPrivate}
                  onChange={(e) => setNewClubPrivate(e.target.checked)}
                  className="rounded bg-[#1c1b18] border-[#3c3934] text-[#81b64c] focus:ring-0"
                />
                <label htmlFor="modalPrivate" className="text-xs text-gray-300 cursor-pointer">
                  Private Club (membership requires approval)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#312e2b]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2.5 bg-[#81b64c] hover:bg-[#95c65a] disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-glow-green transition-all"
                >
                  {creating ? 'Creating...' : 'Create Club'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
