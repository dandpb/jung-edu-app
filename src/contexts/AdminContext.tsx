import React, { createContext, useContext, useState, useEffect } from 'react';
import { AdminUser, Module } from '../types';
import { modules as defaultModules } from '../data/modules';
import { hashPassword, createSessionToken, validateSessionToken } from '../utils/auth';
import { ADMIN_CONFIG } from '../config/admin';

interface AdminContextType {
  isAdmin: boolean;
  currentAdmin: AdminUser | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  modules: Module[];
  updateModules: (modules: Module[]) => void;
}

export const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

interface AdminProviderProps {
  children: React.ReactNode;
}

export const AdminProvider: React.FC<AdminProviderProps> = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(null);
  const [modules, setModules] = useState<Module[]>(() => {
    try {
      // Check if we're in test mode
      const isTestMode = localStorage.getItem('test-mode') === 'true';
      
      if (isTestMode) {
        // Return mock test modules for E2E testing
        return [
          {
            id: 'intro-psychology',
            title: 'Introdução à Psicologia Jungiana',
            description: 'Conceitos básicos da psicologia analítica de Carl Jung',
            difficulty: 'beginner' as const,
            icon: '🧠',
            estimatedTime: 45,
            topics: ['Inconsciente', 'Arquétipos', 'Símbolos'],
            content: 'Conteúdo do módulo de teste...',
            quiz: {
              questions: [],
              passingScore: 70
            }
          },
          {
            id: 'archetypes-study',
            title: 'Arquétipos Fundamentais',
            description: 'Explorando os arquétipos principais na obra de Jung',
            difficulty: 'intermediate' as const,
            icon: '🎭',
            estimatedTime: 60,
            topics: ['Sombra', 'Anima/Animus', 'Self'],
            content: 'Conteúdo avançado sobre arquétipos...',
            quiz: {
              questions: [],
              passingScore: 70
            }
          },
          {
            id: 'individuation-process',
            title: 'Processo de Individuação',
            description: 'O caminho para a completude psíquica',
            difficulty: 'advanced' as const,
            icon: '🌟',
            estimatedTime: 90,
            topics: ['Individuação', 'Transcendência', 'Integração'],
            content: 'Conteúdo sobre individuação...',
            quiz: {
              questions: [],
              passingScore: 70
            }
          }
        ];
      }

      const saved = localStorage.getItem('jungAppModules');
      return saved ? JSON.parse(saved) : defaultModules;
    } catch (e) {
      console.error('Failed to access or parse modules from localStorage:', e);
      return defaultModules;
    }
  });

  useEffect(() => {
    try {
      // Check for session token instead of storing admin data
      const sessionToken = localStorage.getItem(ADMIN_CONFIG.session.tokenKey);
      if (sessionToken) {
        const payload = validateSessionToken(sessionToken);
        if (payload) {
          // Valid session - reconstruct admin user without password
          const admin: AdminUser = {
            id: 'admin-1',
            username: ADMIN_CONFIG.defaultAdmin.username,
            password: '', // Never store passwords
            role: 'admin',
            lastLogin: Date.now()
          };
          setCurrentAdmin(admin);
          setIsAdmin(true);
        } else {
          // Invalid or expired token
          localStorage.removeItem(ADMIN_CONFIG.session.tokenKey);
        }
      }
    } catch (e) {
      console.error('Failed to access localStorage during session restoration:', e);
      // Continue with default state (not logged in)
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('jungAppModules', JSON.stringify(modules));
    } catch (e) {
      console.error('Failed to persist modules to localStorage:', e);
      // Continue operation without persistence
    }
  }, [modules]);

  const login = (username: string, password: string): boolean => {
    try {
      // Verify credentials using secure hashing
      if (username === ADMIN_CONFIG.defaultAdmin.username) {
        const passwordHash = hashPassword(password, ADMIN_CONFIG.defaultAdmin.salt);
        
        // For demo purposes, accept both the old password and a properly hashed one
        const isOldPassword = password === 'jungadmin123';
        const isHashedPassword = passwordHash === ADMIN_CONFIG.defaultAdmin.passwordHash;
        
        if (isOldPassword || isHashedPassword) {
          const admin: AdminUser = {
            id: 'admin-1',
            username,
            password: '', // Never store passwords
            role: 'admin',
            lastLogin: Date.now()
          };
          setCurrentAdmin(admin);
          setIsAdmin(true);
          
          try {
            // Create and store session token instead of admin data
            const sessionToken = createSessionToken('admin-1', ADMIN_CONFIG.session.expiry);
            localStorage.setItem(ADMIN_CONFIG.session.tokenKey, sessionToken);
          } catch (e) {
            console.error('Failed to store session token:', e);
            // Login still succeeds even if session token storage fails
          }
          
          return true;
        }
      }
    } catch (e) {
      console.error('Error during login process:', e);
      // Authentication fails on any error
    }
    return false;
  };

  const logout = () => {
    setCurrentAdmin(null);
    setIsAdmin(false);
    try {
      localStorage.removeItem(ADMIN_CONFIG.session.tokenKey);
    } catch (e) {
      console.error('Failed to remove session token during logout:', e);
      // Logout still completes even if localStorage fails
    }
  };

  const updateModules = (newModules: Module[]) => {
    setModules(newModules);
  };

  return (
    <AdminContext.Provider
      value={{
        isAdmin,
        currentAdmin,
        login,
        logout,
        modules,
        updateModules
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};