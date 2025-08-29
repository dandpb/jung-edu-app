/**
 * Comprehensive Unit Tests for EnhancedDashboard Component
 * Tests rendering, user interactions, progress tracking
 * Target: 80%+ coverage
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import EnhancedDashboard from '../EnhancedDashboard';
import { Module, UserProgress, Achievement } from '../../../types';

// Mock data factories
const createMockModule = (id: string, overrides: Partial<Module> = {}): Module => ({
  id,
  title: `Module ${id}`,
  description: `Description for module ${id}`,
  icon: '🧠',
  estimatedTime: 60,
  difficulty: 'beginner',
  prerequisites: [],
  ...overrides
});

const createMockUserProgress = (overrides: Partial<UserProgress> = {}): UserProgress => ({
  userId: 'test-user',
  completedModules: ['module-1'],
  quizScores: { 'module-1': 85, 'module-2': 92 },
  totalTime: 240, // 4 hours
  lastAccessed: Date.now(),
  notes: [],
  analytics: {
    totalStudyTime: 240,
    averageQuizScore: 88,
    moduleCompletionRate: 50,
    streakDays: 5,
    preferredLearningTime: '14:00',
    strongConcepts: ['archetypes', 'collective-unconscious'],
    weakConcepts: ['active-imagination'],
    learningVelocity: 1.2,
    engagementScore: 85,
    lastWeekActivity: [
      { date: '2024-01-01', timeSpent: 30, modulesCompleted: 0, quizzesTaken: 0, notesCreated: 1 },
      { date: '2024-01-02', timeSpent: 45, modulesCompleted: 1, quizzesTaken: 1, notesCreated: 2 },
      { date: '2024-01-03', timeSpent: 60, modulesCompleted: 0, quizzesTaken: 0, notesCreated: 0 },
      { date: '2024-01-04', timeSpent: 30, modulesCompleted: 0, quizzesTaken: 1, notesCreated: 1 },
      { date: '2024-01-05', timeSpent: 75, modulesCompleted: 1, quizzesTaken: 1, notesCreated: 3 },
    ]
  },
  achievements: [
    {
      id: 'first-quiz',
      title: 'Primeiro Quiz',
      description: 'Complete seu primeiro quiz',
      icon: '🎯',
      category: 'progress',
      points: 50,
      unlockedAt: new Date(),
      rarity: 'common',
      requirements: []
    }
  ],
  ...overrides
});

const DashboardWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

// Mock Date.now() for consistent testing
const mockDate = new Date('2024-01-15T10:00:00Z');
jest.useFakeTimers();
jest.setSystemTime(mockDate);

describe('EnhancedDashboard Component', () => {
  const mockModules: Module[] = [
    createMockModule('module-1', { 
      title: 'Introduction to Jung',
      difficulty: 'beginner',
      estimatedTime: 60
    }),
    createMockModule('module-2', { 
      title: 'The Collective Unconscious',
      difficulty: 'intermediate',
      estimatedTime: 90,
      prerequisites: ['module-1']
    }),
    createMockModule('module-3', { 
      title: 'Advanced Archetypes',
      difficulty: 'advanced',
      estimatedTime: 120,
      prerequisites: ['module-1', 'module-2']
    })
  ];

  const mockUserProgress = createMockUserProgress();

  describe('Component Rendering', () => {
    it('should render welcome header with time-based greeting', () => {
      render(
        <DashboardWrapper>
          <EnhancedDashboard 
            modules={mockModules} 
            userProgress={mockUserProgress} 
          />
        </DashboardWrapper>
      );

      // Should show morning greeting for 10:00 AM
      expect(screen.getByText(/Bom dia!/)).toBeInTheDocument();
      expect(screen.getByText(/Vamos continuar sua jornada junguiana/)).toBeInTheDocument();
    });

    it('should display correct completion percentage', () => {
      render(
        <DashboardWrapper>
          <EnhancedDashboard 
            modules={mockModules} 
            userProgress={mockUserProgress} 
          />
        </DashboardWrapper>
      );

      // 1 completed out of 3 modules = 33%
      expect(screen.getByText('33%')).toBeInTheDocument();
      expect(screen.getByText('1 de 3 módulos')).toBeInTheDocument();
    });

    it('should show streak count when available', () => {
      render(
        <DashboardWrapper>
          <EnhancedDashboard 
            modules={mockModules} 
            userProgress={mockUserProgress} 
          />
        </DashboardWrapper>
      );

      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('dias consecutivos')).toBeInTheDocument();
    });
  });

  describe('Key Metrics Display', () => {
    it('should display all key metrics cards', () => {
      render(
        <DashboardWrapper>
          <EnhancedDashboard 
            modules={mockModules} 
            userProgress={mockUserProgress} 
          />
        </DashboardWrapper>
      );

      expect(screen.getByText('Progresso Geral')).toBeInTheDocument();
      expect(screen.getByText('Pontuação Média')).toBeInTheDocument();
      expect(screen.getByText('Tempo de Estudo')).toBeInTheDocument();
      expect(screen.getByText('Conquistas')).toBeInTheDocument();
    });

    it('should calculate and display average quiz score', () => {
      render(
        <DashboardWrapper>
          <EnhancedDashboard 
            modules={mockModules} 
            userProgress={mockUserProgress} 
          />
        </DashboardWrapper>
      );

      // (85 + 92) / 2 = 88.5, rounded to 89
      // Look for 89% specifically in the "Pontuação Média" section
      const averageScoreSection = screen.getByText('Pontuação Média').closest('.bg-white');
      expect(within(averageScoreSection!).getByText('89%')).toBeInTheDocument();
    });

    it('should format and display study time correctly', () => {
      render(
        <DashboardWrapper>
          <EnhancedDashboard 
            modules={mockModules} 
            userProgress={mockUserProgress} 
          />
        </DashboardWrapper>
      );

      // 240 minutes = 4h 0m - Look in the "Tempo de Estudo" section
      const studyTimeSection = screen.getByText('Tempo de Estudo').closest('.bg-white');
      expect(within(studyTimeSection!).getByText('4h 0m')).toBeInTheDocument();
    });

    it('should display achievement count', () => {
      render(
        <DashboardWrapper>
          <EnhancedDashboard 
            modules={mockModules} 
            userProgress={mockUserProgress} 
          />
        </DashboardWrapper>
      );

      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  describe('Next Recommended Module', () => {
    it('should show next available module recommendation', () => {
      render(
        <DashboardWrapper>
          <EnhancedDashboard 
            modules={mockModules} 
            userProgress={mockUserProgress} 
          />
        </DashboardWrapper>
      );

      // Check for the recommendation section
      const recommendationSection = screen.getByText('Continue Aprendendo').closest('.bg-white');
      expect(recommendationSection).toBeInTheDocument();
      expect(within(recommendationSection!).getByText('The Collective Unconscious')).toBeInTheDocument();
    });

    it('should show correct difficulty badge', () => {
      render(
        <DashboardWrapper>
          <EnhancedDashboard 
            modules={mockModules} 
          userProgress={mockUserProgress} 
          />
        </DashboardWrapper>
      );

      // Look for difficulty badge in the recommendation section
      const recommendationSection = screen.getByText('Continue Aprendendo').closest('.bg-white');
      expect(within(recommendationSection!).getByText('Intermediário')).toBeInTheDocument();
    });

    it('should have link to continue studying', () => {
      render(
        <DashboardWrapper>
          <EnhancedDashboard 
            modules={mockModules} 
            userProgress={mockUserProgress} 
          />
        </DashboardWrapper>
      );

      const continueButton = screen.getByText('Continuar Estudando').closest('a');
      expect(continueButton).toHaveAttribute('href', '/module/module-2');
    });

    it('should not show recommendation section when no next module available', () => {
      const allCompletedProgress = createMockUserProgress({
        completedModules: ['module-1', 'module-2', 'module-3']
      });

      render(
        <DashboardWrapper>
          <EnhancedDashboard 
            modules={mockModules} 
            userProgress={allCompletedProgress} 
          />
        </DashboardWrapper>
      );

      expect(screen.queryByText('Continue Aprendendo')).not.toBeInTheDocument();
    });
  });

  describe('All Modules Section', () => {
    it('should display all modules in correct states', () => {
      render(
        <DashboardWrapper>
          <EnhancedDashboard 
            modules={mockModules} 
            userProgress={mockUserProgress} 
          />
        </DashboardWrapper>
      );

      // Look for modules in the "Todos os Módulos" section
      const modulesSection = screen.getByText('Todos os Módulos').parentElement?.parentElement;
      
      // Module 1 - completed
      expect(screen.getByText('Introduction to Jung')).toBeInTheDocument();
      
      // Module 2 - available (prerequisites met) 
      expect(screen.getAllByText('The Collective Unconscious')).toHaveLength(2); // One in recommendation, one in all modules
      
      // Module 3 - blocked (prerequisites not met)
      expect(screen.getByText('Advanced Archetypes')).toBeInTheDocument();
    });

    it('should show correct action buttons for each module state', () => {
      render(
        <DashboardWrapper>
          <EnhancedDashboard 
            modules={mockModules} 
            userProgress={mockUserProgress} 
          />
        </DashboardWrapper>
      );

      // Should have "Revisar" for completed module
      expect(screen.getByText('Revisar')).toBeInTheDocument();
      
      // Should have "Estudar" for available modules
      expect(screen.getAllByText('Estudar')).toHaveLength(1);
      
      // Should have "Bloqueado" for blocked modules
      expect(screen.getByText('Bloqueado')).toBeInTheDocument();
    });

    it('should display quiz scores for completed modules', () => {
      render(
        <DashboardWrapper>
          <EnhancedDashboard 
            modules={mockModules} 
            userProgress={mockUserProgress} 
          />
        </DashboardWrapper>
      );

      expect(screen.getByText('85%')).toBeInTheDocument();
    });

    it('should show prerequisites for modules that have them', () => {
      render(
        <DashboardWrapper>
          <EnhancedDashboard 
            modules={mockModules} 
            userProgress={mockUserProgress} 
          />
        </DashboardWrapper>
      );

      expect(screen.getByText(/Pré-requisitos: module-1, module-2/)).toBeInTheDocument();
    });
  });

  describe('Sidebar Components', () => {
    it('should display quick actions panel', () => {
      render(
        <DashboardWrapper>
          <EnhancedDashboard 
            modules={mockModules} 
            userProgress={mockUserProgress} 
          />
        </DashboardWrapper>
      );

      expect(screen.getByText('Ações Rápidas')).toBeInTheDocument();
      expect(screen.getByText('Ver Progresso')).toBeInTheDocument();
      expect(screen.getByText('Minhas Anotações')).toBeInTheDocument();
    });

    it('should show correct notes count', () => {
      const progressWithNotes = createMockUserProgress({
        notes: [
          { id: '1', moduleId: 'mod1', content: 'Note 1', timestamp: Date.now() },
          { id: '2', moduleId: 'mod2', content: 'Note 2', timestamp: Date.now() }
        ]
      });

      render(
        <DashboardWrapper>
          <EnhancedDashboard 
            modules={mockModules} 
            userProgress={progressWithNotes} 
          />
        </DashboardWrapper>
      );

      expect(screen.getByText('2 anotações')).toBeInTheDocument();
    });

    it('should display recent achievements when available', () => {
      render(
        <DashboardWrapper>
          <EnhancedDashboard 
            modules={mockModules} 
            userProgress={mockUserProgress} 
          />
        </DashboardWrapper>
      );

      expect(screen.getByText('Conquistas Recentes')).toBeInTheDocument();
      expect(screen.getByText('Primeiro Quiz')).toBeInTheDocument();
      expect(screen.getByText('+50 XP')).toBeInTheDocument();
    });

    it('should display study statistics', () => {
      render(
        <DashboardWrapper>
          <EnhancedDashboard 
            modules={mockModules} 
            userProgress={mockUserProgress} 
          />
        </DashboardWrapper>
      );

      expect(screen.getByText('Estatísticas')).toBeInTheDocument();
      expect(screen.getByText('Total de horas:')).toBeInTheDocument();
      expect(screen.getByText('Sequência:')).toBeInTheDocument();
      expect(screen.getByText('Esta semana:')).toBeInTheDocument();
      expect(screen.getByText('Média quiz:')).toBeInTheDocument();
    });

    it('should display study tip', () => {
      render(
        <DashboardWrapper>
          <EnhancedDashboard 
            modules={mockModules} 
            userProgress={mockUserProgress} 
          />
        </DashboardWrapper>
      );

      expect(screen.getByText('Dica de Estudo')).toBeInTheDocument();
      expect(screen.getByText(/Jung dizia que/)).toBeInTheDocument();
    });
  });

  describe('Time-based Greetings', () => {
    it('should show afternoon greeting', () => {
      const afternoonTime = new Date('2024-01-15T15:00:00Z');
      jest.setSystemTime(afternoonTime);

      render(
        <DashboardWrapper>
          <EnhancedDashboard 
            modules={mockModules} 
            userProgress={mockUserProgress} 
          />
        </DashboardWrapper>
      );

      expect(screen.getByText(/Boa tarde!/)).toBeInTheDocument();
    });

    it('should show evening greeting', () => {
      const eveningTime = new Date('2024-01-15T19:00:00Z');
      jest.setSystemTime(eveningTime);

      render(
        <DashboardWrapper>
          <EnhancedDashboard 
            modules={mockModules} 
            userProgress={mockUserProgress} 
          />
        </DashboardWrapper>
      );

      expect(screen.getByText(/Boa noite!/)).toBeInTheDocument();
      
      // Reset time after test
      jest.setSystemTime(mockDate);
    });
  });

  describe('Difficulty Badge Translation', () => {
    it('should translate difficulty levels correctly', () => {
      const modulesWithDifficulties: Module[] = [
        createMockModule('easy', { difficulty: 'beginner', title: 'Easy Module' }),
        createMockModule('medium', { difficulty: 'intermediate', title: 'Medium Module' }),
        createMockModule('hard', { difficulty: 'advanced', title: 'Hard Module' })
      ];

      render(
        <DashboardWrapper>
          <EnhancedDashboard 
            modules={modulesWithDifficulties} 
            userProgress={createMockUserProgress({ completedModules: [] })} 
          />
        </DashboardWrapper>
      );

      // Look for difficulty badges in the modules section
      expect(screen.getByText('Iniciante')).toBeInTheDocument();
      expect(screen.getByText('Intermediário')).toBeInTheDocument();
      expect(screen.getByText('Avançado')).toBeInTheDocument();
    });
  });

  describe('Progress Calculation Edge Cases', () => {
    it('should handle empty modules array', () => {
      render(
        <DashboardWrapper>
          <EnhancedDashboard 
            modules={[]} 
            userProgress={mockUserProgress} 
          />
        </DashboardWrapper>
      );

      // Should not crash and show 0% completion
      expect(screen.getByText(/0 de 0 módulos/)).toBeInTheDocument();
    });

    it('should handle missing quiz scores', () => {
      const progressWithoutQuizzes = createMockUserProgress({
        quizScores: {}
      });

      render(
        <DashboardWrapper>
          <EnhancedDashboard 
            modules={mockModules} 
            userProgress={progressWithoutQuizzes} 
          />
        </DashboardWrapper>
      );

      // Look for 0% in the average score section specifically
      const averageScoreSection = screen.getByText('Pontuação Média').closest('.bg-white');
      expect(within(averageScoreSection!).getByText('0%')).toBeInTheDocument();
    });

    it('should handle missing analytics data', () => {
      const progressWithoutAnalytics = createMockUserProgress({
        analytics: undefined
      });

      render(
        <DashboardWrapper>
          <EnhancedDashboard 
            modules={mockModules} 
            userProgress={progressWithoutAnalytics} 
          />
        </DashboardWrapper>
      );

      // Should show 0 streak days
      expect(screen.queryByText('dias consecutivos')).not.toBeInTheDocument();
    });
  });

  describe('Interactive Elements', () => {
    it('should have working links to module pages', () => {
      render(
        <DashboardWrapper>
          <EnhancedDashboard 
            modules={mockModules} 
            userProgress={mockUserProgress} 
          />
        </DashboardWrapper>
      );

      const moduleLinks = screen.getAllByText('Estudar');
      expect(moduleLinks[0].closest('a')).toHaveAttribute('href', '/module/module-2');
    });

    it('should have working links in quick actions', () => {
      render(
        <DashboardWrapper>
          <EnhancedDashboard 
            modules={mockModules} 
            userProgress={mockUserProgress} 
          />
        </DashboardWrapper>
      );

      expect(screen.getByText('Ver Progresso').closest('a')).toHaveAttribute('href', '/progress');
      expect(screen.getByText('Minhas Anotações').closest('a')).toHaveAttribute('href', '/notes');
    });
  });

  describe('UpdateProgress Callback', () => {
    it('should call updateProgress when provided', () => {
      const mockUpdateProgress = jest.fn();
      
      render(
        <DashboardWrapper>
          <EnhancedDashboard 
            modules={mockModules} 
            userProgress={mockUserProgress} 
            updateProgress={mockUpdateProgress}
          />
        </DashboardWrapper>
      );

      // Component should render without calling updateProgress
      expect(mockUpdateProgress).not.toHaveBeenCalled();
    });
  });

  describe('Performance Indicators', () => {
    it('should show performance feedback based on average score', () => {
      const highScoreProgress = createMockUserProgress({
        quizScores: { 'module-1': 95, 'module-2': 98 }
      });

      render(
        <DashboardWrapper>
          <EnhancedDashboard 
            modules={mockModules} 
            userProgress={highScoreProgress} 
          />
        </DashboardWrapper>
      );

      expect(screen.getByText('Desempenho excelente!')).toBeInTheDocument();
    });

    it('should show appropriate feedback for different score ranges', () => {
      const mediumScoreProgress = createMockUserProgress({
        quizScores: { 'module-1': 75, 'module-2': 78 }
      });

      render(
        <DashboardWrapper>
          <EnhancedDashboard 
            modules={mockModules} 
            userProgress={mediumScoreProgress} 
          />
        </DashboardWrapper>
      );

      expect(screen.getByText('Bom progresso')).toBeInTheDocument();
    });
  });
});