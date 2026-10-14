import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Sidebar } from './components/layout/Sidebar.js';
import { AuthModal } from './components/modals/AuthModal.js';
import { useAuthStore } from './store/authStore.js';
import { useGameStore } from './store/gameStore.js';

// Pages
import { HomePage } from './pages/HomePage.js';
import { PlayPage } from './pages/PlayPage.js';
import { BotsPage } from './pages/BotsPage.js';
import { PuzzlesPage } from './pages/PuzzlesPage.js';
import { LessonsPage } from './pages/LessonsPage.js';
import { AnalysisPage } from './pages/AnalysisPage.js';
import { OpeningsPage } from './pages/OpeningsPage.js';
import { TournamentsPage } from './pages/TournamentsPage.js';
import { ClubsPage } from './pages/ClubsPage.js';
import { LeaderboardPage } from './pages/LeaderboardPage.js';
import { ProfilePage } from './pages/ProfilePage.js';
import { SettingsPage } from './pages/SettingsPage.js';
import { AdminPage } from './pages/AdminPage.js';

const queryClient = new QueryClient();

export const App: React.FC = () => {
  const { initialize } = useAuthStore();
  const { initSocketListeners } = useGameStore();

  useEffect(() => {
    initialize();
    initSocketListeners();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="flex min-h-screen bg-[#161512] text-[#f0f0f0] font-sans">
          {/* Left Navigation Sidebar */}
          <Sidebar />

          {/* Main Viewport */}
          <main className="flex-1 overflow-y-auto min-h-screen">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/play" element={<PlayPage />} />
              <Route path="/bots" element={<BotsPage />} />
              <Route path="/puzzles" element={<PuzzlesPage />} />
              <Route path="/lessons" element={<LessonsPage />} />
              <Route path="/analysis" element={<AnalysisPage />} />
              <Route path="/openings" element={<OpeningsPage />} />
              <Route path="/tournaments" element={<TournamentsPage />} />
              <Route path="/clubs" element={<ClubsPage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/profile/:username" element={<ProfilePage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          {/* Global Auth Modal */}
          <AuthModal />
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
