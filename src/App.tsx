import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserProgress } from './types';
import { AuthProvider } from './contexts/AuthContext';
import { AdminProvider, useAdmin } from './contexts/AdminContext';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import ModulePage from './pages/ModulePage';
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
import AdminPrompts from './pages/admin/AdminPrompts';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { PublicRoute } from './components/auth/PublicRoute';
import { AdminProtectedRoute } from './components/admin/AdminProtectedRoute';
import { AdminPublicRoute } from './components/admin/AdminPublicRoute';
import { UserRole } from './types/auth';
import CreateTestUser from './pages/CreateTestUser';
import MonitoringDashboard from './pages/MonitoringDashboard';

function AppContent() {
  const { modules } = useAdmin();
  const [userProgress, setUserProgress] = useState<UserProgress>(() => {
    const saved = localStorage.getItem('jungAppProgress');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        // If localStorage data is corrupted, clear it and create new progress
        console.warn('Corrupted localStorage data detected, creating new user progress:', error);
        localStorage.removeItem('jungAppProgress');
      }
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
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } />
          <Route path="/register" element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          } />
          <Route path="/forgot-password" element={
            <PublicRoute>
              <ForgotPasswordPage />
            </PublicRoute>
          } />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="/create-test-user" element={<CreateTestUser />} />
          
          {/* Protected Routes - All pages require authentication */}
          <Route path="/" element={
            <ProtectedRoute>
              <Navigate to="/dashboard" replace />
            </ProtectedRoute>
          } />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard 
                  modules={modules}
                  userProgress={userProgress} 
                />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/module/:moduleId" 
            element={
              <ProtectedRoute>
                <ModulePage 
                  modules={modules}
                  userProgress={userProgress}
                  updateProgress={updateProgress}
                />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/ai-demo" 
            element={
              <ProtectedRoute requiredRole={UserRole.ADMIN}>
                <AIDemo />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/notes" 
            element={
              <ProtectedRoute>
                <NotesPage 
                  modules={modules}
                  userProgress={userProgress}
                  updateProgress={updateProgress}
                />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/bibliography" 
            element={
              <ProtectedRoute>
                <BibliographyPage modules={modules} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/search" 
            element={
              <ProtectedRoute>
                <SearchPage modules={modules} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/test-youtube" 
            element={
              <ProtectedRoute requiredRole={UserRole.ADMIN}>
                <TestYouTubeIntegration />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/test-api" 
            element={
              <ProtectedRoute requiredRole={UserRole.ADMIN}>
                <TestYouTubeAPI />
              </ProtectedRoute>
            } 
          />
          
          {/* Monitoring Dashboard */}
          <Route 
            path="/monitoring" 
            element={
              <ProtectedRoute requiredRole={UserRole.ADMIN}>
                <MonitoringDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={
            <AdminPublicRoute redirectTo="/admin/dashboard">
              <AdminLogin />
            </AdminPublicRoute>
          } />
          <Route
            path="/admin"
            element={
              <AdminProtectedRoute>
                <Navigate to="/admin/dashboard" replace />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/modules"
            element={
              <AdminProtectedRoute>
                <AdminModules />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/resources"
            element={
              <AdminProtectedRoute>
                <AdminResources />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/prompts"
            element={
              <AdminProtectedRoute>
                <AdminPrompts />
              </AdminProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <AdminProvider>
          <AppContent />
        </AdminProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;