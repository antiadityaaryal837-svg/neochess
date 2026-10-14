const API_URL = '/api';

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

  // Users & Profiles
  getLeaderboard: (category: string = 'blitz') => apiFetch<{ category: string; leaderboard: any[] }>(`/users/leaderboard?category=${category}`),
  getUserProfile: (username: string) => apiFetch<{ user: any }>(`/users/${username}`),
  searchUsers: (query: string) => apiFetch<{ users: any[] }>(`/users/search?q=${encodeURIComponent(query)}`),
  updateProfile: (body: any) => apiFetch<{ profile: any }>('/users/profile', { method: 'PUT', body: JSON.stringify(body) }),

  // Games
  getGames: (page: number = 1, limit: number = 15) => apiFetch<{ games: any[]; pagination: any }>(`/games?page=${page}&limit=${limit}`),
  getGame: (id: string) => apiFetch<{ game: any }>(`/games/${id}`),
  createGame: (body: any) => apiFetch<{ game: any }>('/games', { method: 'POST', body: JSON.stringify(body) }),
  analyzeGame: (id: string) => apiFetch<{ analysis: any }>(`/games/${id}/analyze`, { method: 'POST' }),

  // Puzzles
  getDailyPuzzle: () => apiFetch<{ puzzle: any }>('/puzzles/daily'),
  getRatedPuzzle: () => apiFetch<{ puzzle: any }>('/puzzles/rated'),
  getPuzzleStreak: () => apiFetch<{ puzzles: any[] }>('/puzzles/streak'),
  submitPuzzleAttempt: (id: string, body: any) => apiFetch<{ success: boolean; ratingChange: number; newRating: number }>(`/puzzles/${id}/attempt`, { method: 'POST', body: JSON.stringify(body) }),

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
  getClubs: () => apiFetch<{ clubs: any[] }>('/social/clubs'),
  joinClub: (slug: string) => apiFetch<{ message: string }>(`/social/clubs/${slug}/join`, { method: 'POST' }),

  // Tournaments
  getTournaments: () => apiFetch<{ tournaments: any[] }>('/tournaments'),
  getTournament: (id: string) => apiFetch<{ tournament: any }>(`/tournaments/${id}`),
  joinTournament: (id: string) => apiFetch<{ entry: any; message: string }>(`/tournaments/${id}/join`, { method: 'POST' }),
  createTournament: (body: any) => apiFetch<{ tournament: any }>('/tournaments', { method: 'POST', body: JSON.stringify(body) }),

  // Admin
  getAdminStats: () => apiFetch<any>('/admin/stats'),
  getAdminUsers: (page: number = 1) => apiFetch<{ users: any[]; pagination: any }>(`/admin/users?page=${page}`),
  banUser: (id: string) => apiFetch<{ message: string }>(`/admin/users/${id}/ban`, { method: 'POST' }),
  unbanUser: (id: string) => apiFetch<{ message: string }>(`/admin/users/${id}/unban`, { method: 'POST' }),
};
