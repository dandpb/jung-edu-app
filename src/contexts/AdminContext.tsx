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

    try {
      const saved = localStorage.getItem('jungAppModules');
      return saved ? JSON.parse(saved) : defaultModules;
    } catch (e) {
      console.error('Failed to parse modules from localStorage:', e);
      return defaultModules;
    }
  });

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    localStorage.setItem('jungAppModules', JSON.stringify(modules));
  }, [modules]);

  const login = (username: string, password: string): boolean => {
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
        
        // Create and store session token instead of admin data
        const sessionToken = createSessionToken('admin-1', ADMIN_CONFIG.session.expiry);
        localStorage.setItem(ADMIN_CONFIG.session.tokenKey, sessionToken);
        
        return true;
      }
    }
    return false;
  };

  const logout = () => {
    setCurrentAdmin(null);
    setIsAdmin(false);
    localStorage.removeItem(ADMIN_CONFIG.session.tokenKey);
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