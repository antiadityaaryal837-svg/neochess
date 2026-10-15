const API_URL = (import.meta as any).env?.VITE_API_URL || '/api';

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('chess_auth_token');
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  register: (body: any) => apiFetch<{ token: string; user: any }>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: any) => apiFetch<{ token: string; user: any }>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  guest: () => apiFetch<{ token: string; user: any }>('/auth/guest', { method: 'POST' }),
  getMe: () => apiFetch<{ user: any }>('/auth/me'),
  updatePreferences: (body: any) => apiFetch<{ settings: any }>('/auth/preferences', { method: 'PUT', body: JSON.stringify(body) }),
  getGoogleConfig: () => apiFetch<{ enabled: boolean; clientId: string | null }>('/auth/google/config'),
  googleLogin: (body: { credential?: string; code?: string; redirectUri?: string }) =>
    apiFetch<{ token: string; user: any }>('/auth/google', { method: 'POST', body: JSON.stringify(body) }),

  // Users & Profiles
  getLeaderboard: (category: string = 'blitz') => apiFetch<{ category: string; leaderboard: any[] }>(`/users/leaderboard?category=${category}`),
  getUserProfile: (username: string) => apiFetch<{ user: any }>(`/users/${username}`),
  searchUsers: (query: string) => apiFetch<{ users: any[] }>(`/users/search?q=${encodeURIComponent(query)}`),
  updateProfile: (body: any) => apiFetch<{ profile: any }>('/users/profile', { method: 'PUT', body: JSON.stringify(body) }),

  // Games
  getGames: (page: number = 1, limit: number = 15) => apiFetch<{ games: any[]; pagination: any }>(`/games?page=${page}&limit=${limit}`),
  getGame: (id: string) => apiFetch<{ game: any }>(`/games/${id}`),
  createGame: (body: any) => apiFetch<{ game: any }>('/games', { method: 'POST', body: JSON.stringify(body) }),
  analyzeGame: (id: string, force?: boolean) => apiFetch<{ analysis: any; moves?: any[]; report?: any }>(`/games/${id}/analyze${force ? '?force=true' : ''}`, { method: 'POST' }),
  evaluatePosition: (fen: string, depth: number = 10) => apiFetch<{ fen: string; evaluation: any }>('/analysis/evaluate', { method: 'POST', body: JSON.stringify({ fen, depth }) }),

  // Puzzles
  getDailyPuzzle: () => apiFetch<{ puzzle: any }>('/puzzles/daily'),
  getRatedPuzzle: () => apiFetch<{ puzzle: any }>('/puzzles/rated'),
  getRandomPuzzle: (params?: { theme?: string; minRating?: number; maxRating?: number }) => {
    const q = new URLSearchParams();
    if (params?.theme) q.set('theme', params.theme);
    if (params?.minRating) q.set('minRating', params.minRating.toString());
    if (params?.maxRating) q.set('maxRating', params.maxRating.toString());
    const qs = q.toString();
    return apiFetch<{ puzzle: any }>(`/puzzles/random${qs ? `?${qs}` : ''}`);
  },
  getPuzzleRush: () => apiFetch<{ puzzles: any[] }>('/puzzles/rush'),
  getPuzzleStreak: () => apiFetch<{ puzzles: any[] }>('/puzzles/streak'),
  getPuzzleThemes: () => apiFetch<{ themes: any[] }>('/puzzles/themes'),
  getPuzzleHistory: () => apiFetch<{ attempts: any[]; stats: any }>('/puzzles/history'),
  getPuzzleRecommendations: () => apiFetch<{ recommendedTheme: string; puzzles: any[] }>('/puzzles/recommendations'),
  submitPuzzleRushScore: (score: number, mode: string = '3min') =>
    apiFetch<{ score: any }>('/puzzles/rush-score', { method: 'POST', body: JSON.stringify({ score, mode }) }),
  getPuzzleLeaderboard: () => apiFetch<{ ratingLeaderboard: any[]; rushLeaderboard: any[] }>('/puzzles/leaderboard'),
  submitPuzzleAttempt: (id: string, body: any) =>
    apiFetch<{ success: boolean; ratingChange: number; newRating: number; solutionMoves?: string[]; themes?: string[] }>(
      `/puzzles/${id}/attempt`,
      { method: 'POST', body: JSON.stringify(body) }
    ),

  // Lessons
  getLessons: () => apiFetch<{ lessons: any[] }>('/lessons'),
  getLesson: (slug: string) => apiFetch<{ lesson: any }>(`/lessons/${slug}`),
  saveLessonStep: (id: string, stepIndex: number) => apiFetch<{ progress: any }>(`/lessons/${id}/step`, { method: 'POST', body: JSON.stringify({ stepIndex }) }),

  // Openings
  getOpenings: () => apiFetch<{ openings: any[] }>('/openings'),
  lookupOpening: (fen: string) => apiFetch<{ matched: boolean; opening: any }>(`/openings/lookup?fen=${encodeURIComponent(fen)}`),

  // Social
  getFriends: () => apiFetch<{ friends: any[]; pendingRequests: any[] }>('/social/friends'),
  sendFriendRequest: (targetUsername: string) => apiFetch<{ friendship: any }>('/social/friends/request', { method: 'POST', body: JSON.stringify({ targetUsername }) }),
  respondFriendRequest: (friendshipId: string, accept: boolean) => apiFetch<{ message: string }>('/social/friends/respond', { method: 'POST', body: JSON.stringify({ friendshipId, accept }) }),
  // Clubs
  getClubs: (search?: string) => apiFetch<{ clubs: any[] }>(`/clubs${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  getClubDetails: (idOrSlug: string) => apiFetch<{ club: any }>(`/clubs/${idOrSlug}`),
  createClub: (body: { name: string; description?: string; isPrivate?: boolean; avatarUrl?: string; bannerUrl?: string }) =>
    apiFetch<{ club: any }>('/clubs', { method: 'POST', body: JSON.stringify(body) }),
  updateClub: (id: string, body: any) =>
    apiFetch<{ club: any }>(`/clubs/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteClub: (id: string) =>
    apiFetch<{ message: string }>(`/clubs/${id}`, { method: 'DELETE' }),
  joinClub: (idOrSlug: string) =>
    apiFetch<{ message: string }>(`/clubs/${idOrSlug}/join`, { method: 'POST' }),
  leaveClub: (idOrSlug: string) =>
    apiFetch<{ message: string }>(`/clubs/${idOrSlug}/leave`, { method: 'POST' }),
  postClubAnnouncement: (clubId: string, title: string, content: string) =>
    apiFetch<{ announcement: any }>(`/clubs/${clubId}/announcements`, { method: 'POST', body: JSON.stringify({ title, content }) }),
  deleteClubAnnouncement: (clubId: string, announcementId: string) =>
    apiFetch<{ message: string }>(`/clubs/${clubId}/announcements/${announcementId}`, { method: 'DELETE' }),
  updateClubMemberRole: (clubId: string, targetUserId: string, role: 'admin' | 'member') =>
    apiFetch<{ membership: any }>(`/clubs/${clubId}/members/${targetUserId}/role`, { method: 'POST', body: JSON.stringify({ role }) }),
  removeClubMember: (clubId: string, targetUserId: string) =>
    apiFetch<{ message: string }>(`/clubs/${clubId}/members/${targetUserId}`, { method: 'DELETE' }),
  getClubMessages: (clubId: string) =>
    apiFetch<{ messages: any[] }>(`/clubs/${clubId}/messages`),
  sendClubMessage: (clubId: string, content: string) =>
    apiFetch<{ message: any }>(`/clubs/${clubId}/messages`, { method: 'POST', body: JSON.stringify({ content }) }),

  // Tournaments
  getTournaments: () => apiFetch<{ tournaments: any[] }>('/tournaments'),
  getTournament: (id: string) => apiFetch<{ tournament: any }>(`/tournaments/${id}`),
  joinTournament: (id: string) => apiFetch<{ entry: any; message: string }>(`/tournaments/${id}/join`, { method: 'POST' }),
  createTournament: (body: any) => apiFetch<{ tournament: any }>('/tournaments', { method: 'POST', body: JSON.stringify(body) }),

  // Admin
  getAdminStats: () => apiFetch<any>('/admin/stats'),
  getAdminUsers: (page: number = 1, search: string = '', role: string = '', status: string = '') =>
    apiFetch<{ users: any[]; pagination: any }>(
      `/admin/users?page=${page}&search=${encodeURIComponent(search)}&role=${role}&status=${status}`
    ),
  getAdminUser: (id: string) => apiFetch<{ user: any }>(`/admin/users/${id}`),
  updateAdminUser: (id: string, body: any) => apiFetch<{ message: string; user: any }>(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  updateAdminUserRole: (id: string, role: string) => apiFetch<{ message: string; user: any }>(`/admin/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
  suspendUser: (id: string, reason?: string) => apiFetch<{ message: string }>(`/admin/users/${id}/suspend`, { method: 'POST', body: JSON.stringify({ reason }) }),
  unsuspendUser: (id: string) => apiFetch<{ message: string }>(`/admin/users/${id}/unsuspend`, { method: 'POST' }),
  deleteUser: (id: string) => apiFetch<{ message: string }>(`/admin/users/${id}`, { method: 'DELETE' }),

  getAdminGames: (page: number = 1, status: string = '', search: string = '') =>
    apiFetch<{ games: any[]; pagination: any }>(`/admin/games?page=${page}&status=${status}&search=${encodeURIComponent(search)}`),
  terminateGame: (id: string, reason?: string) => apiFetch<{ message: string; game: any }>(`/admin/games/${id}/terminate`, { method: 'POST', body: JSON.stringify({ reason }) }),

  getPlatformConfig: () => apiFetch<{ config: any }>('/admin/config'),
  updatePlatformConfig: (config: any) => apiFetch<{ message: string }>('/admin/config', { method: 'PUT', body: JSON.stringify(config) }),

  getAdminPuzzles: (page: number = 1) => apiFetch<{ puzzles: any[]; total: number; totalPages: number }>(`/admin/puzzles?page=${page}`),
  createAdminPuzzle: (body: any) => apiFetch<{ puzzle: any; message: string }>('/admin/puzzles', { method: 'POST', body: JSON.stringify(body) }),
  deleteAdminPuzzle: (id: string) => apiFetch<{ message: string }>(`/admin/puzzles/${id}`, { method: 'DELETE' }),

  getAdminReports: () => apiFetch<{ reports: any[] }>('/admin/reports'),
  resolveAdminReport: (id: string, status: string, actionTaken?: string) =>
    apiFetch<{ message: string; report: any }>(`/admin/reports/${id}/resolve`, { method: 'POST', body: JSON.stringify({ status, actionTaken }) }),
  getAdminAuditLogs: (limit: number = 50) => apiFetch<{ logs: any[] }>(`/admin/audit-logs?limit=${limit}`),
  getAdminSystem: () => apiFetch<{ system: any }>('/admin/system'),
};
