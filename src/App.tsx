import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserProgress } from './types';
import { AdminProvider, useAdmin } from './contexts/AdminContext';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import ModulePage from './pages/ModulePage';
import MindMapPage from './pages/MindMapPage';
import MiniMapDemo from './pages/MiniMapDemo';
import EnhancedMindMapPage from './pages/EnhancedMindMapPage';
import AIDemo from './pages/AIDemo';
import NotesPage from './pages/NotesPage';
import BibliographyPage from './pages/BibliographyPage';
import SearchPage from './pages/SearchPage';
import TestYouTubeIntegration from './pages/TestYouTubeIntegration';
import TestYouTubeAPI from './pages/TestYouTubeAPI';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminModules from './pages/admin/AdminModules';
import AdminResources from './pages/admin/AdminResources';
import ProtectedRoute from './components/ProtectedRoute';

function AppContent() {
  const { modules } = useAdmin();
  const [userProgress, setUserProgress] = useState<UserProgress>(() => {
    const saved = localStorage.getItem('jungAppProgress');
    if (saved) {
      return JSON.parse(saved);
    }
    const newProgress = {
      userId: 'user-' + Date.now(),
      completedModules: [],
      quizScores: {},
      totalTime: 0,
      lastAccessed: Date.now(),
      notes: []
    };
    // Save to localStorage immediately when creating new progress
    localStorage.setItem('jungAppProgress', JSON.stringify(newProgress));
    return newProgress;
  });

  useEffect(() => {
    localStorage.setItem('jungAppProgress', JSON.stringify(userProgress));
  }, [userProgress]);

  const updateProgress = useCallback((updates: Partial<UserProgress> | ((prev: UserProgress) => Partial<UserProgress>)) => {
    setUserProgress(prev => {
      const actualUpdates = typeof updates === 'function' ? updates(prev) : updates;
      return {
        ...prev,
        ...actualUpdates,
        lastAccessed: Date.now()
      };
    });
  }, []);

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route 
              path="/dashboard" 
              element={
                <Dashboard 
                  modules={modules}
                  userProgress={userProgress} 
                />
              } 
            />
            <Route 
              path="/module/:moduleId" 
              element={
                <ModulePage 
                  modules={modules}
                  userProgress={userProgress}
                  updateProgress={updateProgress}
                />
              } 
            />
              <Route 
                path="/mindmap" 
                element={<MindMapPage modules={modules} />} 
              />
              <Route 
                path="/minimap-demo" 
                element={<MiniMapDemo />} 
              />
              <Route 
                path="/enhanced-mindmap" 
                element={<EnhancedMindMapPage modules={modules} />} 
              />
              <Route 
                path="/ai-demo" 
                element={<AIDemo />} 
              />
              <Route 
                path="/notes" 
                element={
                  <NotesPage 
                    modules={modules}
                    userProgress={userProgress}
                    updateProgress={updateProgress}
                  />
                } 
              />
              <Route 
                path="/bibliography" 
                element={<BibliographyPage modules={modules} />} 
              />
              <Route 
                path="/search" 
                element={<SearchPage modules={modules} />} 
              />
              <Route 
                path="/test-youtube" 
                element={<TestYouTubeIntegration />} 
              />
              <Route 
                path="/test-api" 
                element={<TestYouTubeAPI />} 
              />
              
              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/modules"
                element={
                  <ProtectedRoute>
                    <AdminModules />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/resources"
                element={
                  <ProtectedRoute>
                    <AdminResources />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
        </div>
      </Router>
  );
}

function App() {
  return (
    <AdminProvider>
      <AppContent />
    </AdminProvider>
  );
}

export default App;