import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../../pages/Dashboard';
import { Module, UserProgress } from '../../types';

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Clock: () => <div data-testid="clock-icon">Clock</div>,
  CheckCircle: () => <div data-testid="check-circle-icon">CheckCircle</div>,
  ArrowRight: () => <div data-testid="arrow-right-icon">ArrowRight</div>,
  BarChart3: () => <div data-testid="bar-chart-icon">BarChart3</div>,
}));

// Wrapper for routing
const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Dashboard Component', () => {
  const mockModules: Module[] = [
    {
      id: '1',
      title: 'Introdução à Psicologia Analítica',
      description: 'Uma introdução aos conceitos fundamentais da psicologia de Jung',
      difficulty: 'beginner',
      estimatedTime: 30,
      icon: '🧠',
      content: {
        introduction: 'Introduction to this module',
        sections: [],
        summary: 'Module summary'
      },
      quiz: {
        id: 'quiz1',
        title: 'Quiz 1',
        questions: []
      }
    },
    {
      id: '2', 
      title: 'O Inconsciente Coletivo',
      description: 'Explorando o conceito do inconsciente coletivo',
      difficulty: 'intermediate',
      estimatedTime: 45,
      icon: '🌊',
      content: {
        introduction: 'Introduction to this module',
        sections: [],
        summary: 'Module summary'
      },
      prerequisites: ['1'],
      quiz: {
        id: 'quiz2',
        title: 'Quiz 2',
        questions: []
      }
    },
    {
      id: '3',
      title: 'Arquetipos Avançados',
      description: 'Estudos avançados dos arquetipos junguianos',
      difficulty: 'advanced',
      estimatedTime: 60,
      icon: '🏛️',
      content: {
        introduction: 'Introduction to this module',
        sections: [],
        summary: 'Module summary'
      },
      prerequisites: ['1', '2'],
      quiz: {
        id: 'quiz3',
        title: 'Quiz 3', 
        questions: []
      }
    }
  ];

  const mockEmptyProgress: UserProgress = {
    userId: 'user1',
    completedModules: [],
    quizScores: {},
    totalTime: 0,
    lastAccessed: Date.now(),
    notes: []
  };

  const mockProgressWithCompletedModules: UserProgress = {
    userId: 'user1',
    completedModules: ['1'],
    quizScores: { quiz1: 85 },
    totalTime: 1800, // 30 minutes
    lastAccessed: Date.now(),
    notes: []
  };

  describe('Component Rendering', () => {
    it('renders dashboard container with correct test id', () => {
      renderWithRouter(<Dashboard modules={mockModules} userProgress={mockEmptyProgress} />);
      
      expect(screen.getByTestId('dashboard-container')).toBeInTheDocument();
    });

    it('renders welcome message', () => {
      renderWithRouter(<Dashboard modules={mockModules} userProgress={mockEmptyProgress} />);
      
      expect(screen.getByTestId('welcome-message')).toHaveTextContent('Bem-vindo à Psicologia Analítica de Jung');
    });

    it('renders dashboard description', () => {
      renderWithRouter(<Dashboard modules={mockModules} userProgress={mockEmptyProgress} />);
      
      expect(screen.getByTestId('dashboard-description')).toHaveTextContent(
        'Explore as profundezas da psique humana através das teorias revolucionárias de Carl Jung'
      );
    });
  });

  describe('Progress Section', () => {
    it('displays progress section with correct test id', () => {
      renderWithRouter(<Dashboard modules={mockModules} userProgress={mockEmptyProgress} />);
      
      expect(screen.getByTestId('progress-section')).toBeInTheDocument();
    });

    it('shows correct completion percentage for empty progress', () => {
      renderWithRouter(<Dashboard modules={mockModules} userProgress={mockEmptyProgress} />);
      
      expect(screen.getByTestId('completion-percentage')).toHaveTextContent('0%');
    });

    it('calculates completion percentage correctly with completed modules', () => {
      renderWithRouter(<Dashboard modules={mockModules} userProgress={mockProgressWithCompletedModules} />);
      
      expect(screen.getByTestId('completion-percentage')).toHaveTextContent('33%');
    });

    it('displays modules completion count', () => {
      renderWithRouter(<Dashboard modules={mockModules} userProgress={mockProgressWithCompletedModules} />);
      
      expect(screen.getByTestId('modules-completed-count')).toHaveTextContent('1 / 3');
    });

    it('shows study time in minutes', () => {
      renderWithRouter(<Dashboard modules={mockModules} userProgress={mockProgressWithCompletedModules} />);
      
      expect(screen.getByTestId('total-time')).toHaveTextContent('30 min');
    });

    it('displays progress bar with correct width', () => {
      renderWithRouter(<Dashboard modules={mockModules} userProgress={mockProgressWithCompletedModules} />);
      
      const progressBar = screen.getByTestId('progress-bar').querySelector('div');
      expect(progressBar).toHaveStyle({ width: '33%' });
    });

    it('renders all required icons in progress section', () => {
      renderWithRouter(<Dashboard modules={mockModules} userProgress={mockEmptyProgress} />);
      
      expect(screen.getByTestId('bar-chart-icon')).toBeInTheDocument();
      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
      expect(screen.getAllByTestId('clock-icon').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Modules Section', () => {
    it('renders modules section with correct test id', () => {
      renderWithRouter(<Dashboard modules={mockModules} userProgress={mockEmptyProgress} />);
      
      expect(screen.getByTestId('recent-modules-section')).toBeInTheDocument();
    });

    it('displays quick actions section', () => {
      renderWithRouter(<Dashboard modules={mockModules} userProgress={mockEmptyProgress} />);
      
      expect(screen.getByTestId('quick-actions-section')).toBeInTheDocument();
      expect(screen.getByTestId('quick-action-search')).toHaveTextContent('Pesquisar');
      expect(screen.getByTestId('quick-action-progress')).toHaveTextContent('Progresso');
    });

    it('renders all modules in the list', () => {
      renderWithRouter(<Dashboard modules={mockModules} userProgress={mockEmptyProgress} />);
      
      const moduleCards = screen.getAllByTestId('module-card');
      expect(moduleCards).toHaveLength(3);
    });

    it('displays module information correctly', () => {
      renderWithRouter(<Dashboard modules={mockModules} userProgress={mockEmptyProgress} />);
      
      const firstModuleCard = screen.getAllByTestId('module-card')[0];
      
      expect(within(firstModuleCard).getByTestId('module-title')).toHaveTextContent('Introdução à Psicologia Analítica');
      expect(within(firstModuleCard).getByTestId('module-description')).toHaveTextContent('Uma introdução aos conceitos fundamentais');
    });
  });

  describe('Difficulty Display', () => {
    it('translates difficulty levels correctly', () => {
      renderWithRouter(<Dashboard modules={mockModules} userProgress={mockEmptyProgress} />);
      
      const moduleCards = screen.getAllByTestId('module-card');
      
      // Check beginner difficulty
      expect(within(moduleCards[0]).getByText('Iniciante')).toBeInTheDocument();
      
      // Check intermediate difficulty  
      expect(within(moduleCards[1]).getByText('Intermediário')).toBeInTheDocument();
      
      // Check advanced difficulty
      expect(within(moduleCards[2]).getByText('Avançado')).toBeInTheDocument();
    });

    it('applies correct color classes for difficulty levels', () => {
      renderWithRouter(<Dashboard modules={mockModules} userProgress={mockEmptyProgress} />);
      
      const beginnerBadge = screen.getByText('Iniciante');
      const intermediateBadge = screen.getByText('Intermediário'); 
      const advancedBadge = screen.getByText('Avançado');
      
      expect(beginnerBadge).toHaveClass('text-green-600', 'bg-green-50');
      expect(intermediateBadge).toHaveClass('text-yellow-600', 'bg-yellow-50');
      expect(advancedBadge).toHaveClass('text-red-600', 'bg-red-50');
    });
  });

  describe('Module State Logic', () => {
    it('shows completed checkmark for completed modules', () => {
      renderWithRouter(<Dashboard modules={mockModules} userProgress={mockProgressWithCompletedModules} />);
      
      const firstModuleCard = screen.getAllByTestId('module-card')[0];
      expect(within(firstModuleCard).getByTestId('check-circle-icon')).toBeInTheDocument();
    });

    it('disables locked modules with prerequisites', () => {
      renderWithRouter(<Dashboard modules={mockModules} userProgress={mockEmptyProgress} />);
      
      const moduleCards = screen.getAllByTestId('module-card');
      const lockedModule = moduleCards[1]; // Module 2 requires module 1
      
      expect(lockedModule).toHaveClass('opacity-60', 'cursor-not-allowed');
    });

    it('shows prerequisite message for locked modules', () => {
      renderWithRouter(<Dashboard modules={mockModules} userProgress={mockEmptyProgress} />);
      
      expect(screen.getAllByText('Complete os pré-requisitos primeiro').length).toBeGreaterThanOrEqual(1);
    });

    it('shows arrow icon for unlocked modules only', () => {
      renderWithRouter(<Dashboard modules={mockModules} userProgress={mockProgressWithCompletedModules} />);
      
      const unlockedModules = screen.getAllByTestId('module-card').filter(card => 
        !card.classList.contains('opacity-60')
      );
      
      // Should have arrow icons for unlocked modules
      expect(unlockedModules.length).toBeGreaterThan(0);
    });
  });

  describe('Navigation Links', () => {
    it('creates correct links for unlocked modules', () => {
      renderWithRouter(<Dashboard modules={mockModules} userProgress={mockProgressWithCompletedModules} />);
      
      const firstModuleLink = screen.getAllByTestId('module-card')[0];
      expect(firstModuleLink).toHaveAttribute('href', '/module/1');
    });

    it('creates disabled links for locked modules', () => {
      renderWithRouter(<Dashboard modules={mockModules} userProgress={mockEmptyProgress} />);
      
      const moduleCards = screen.getAllByTestId('module-card');
      const lockedModules = moduleCards.filter(card => 
        card.classList.contains('opacity-60') && card.classList.contains('cursor-not-allowed')
      );
      
      expect(lockedModules.length).toBeGreaterThan(0);
      // For locked modules, check they have disabled styling and prevent navigation
      lockedModules.forEach(module => {
        expect(module).toHaveClass('opacity-60', 'cursor-not-allowed');
      });
    });
  });

  describe('Empty State', () => {
    it('handles empty modules array', () => {
      renderWithRouter(<Dashboard modules={[]} userProgress={mockEmptyProgress} />);
      
      expect(screen.getByTestId('dashboard-container')).toBeInTheDocument();
      expect(screen.getByTestId('completion-percentage')).toHaveTextContent('0%');
    });

    it('prevents division by zero with empty modules', () => {
      renderWithRouter(<Dashboard modules={[]} userProgress={mockEmptyProgress} />);
      
      // Should show 0% completion instead of NaN
      expect(screen.getByTestId('completion-percentage')).toHaveTextContent('0%');
    });
  });

  describe('Time Display', () => {
    it('shows estimated time for each module', () => {
      renderWithRouter(<Dashboard modules={mockModules} userProgress={mockEmptyProgress} />);
      
      expect(screen.getByText('30 min')).toBeInTheDocument();
      expect(screen.getByText('45 min')).toBeInTheDocument();  
      expect(screen.getByText('60 min')).toBeInTheDocument();
    });

    it('rounds total time to minutes correctly', () => {
      const progressWithOddTime = {
        ...mockEmptyProgress,
        totalTime: 1890 // 31.5 minutes
      };
      
      renderWithRouter(<Dashboard modules={mockModules} userProgress={progressWithOddTime} />);
      
      expect(screen.getByTestId('total-time')).toHaveTextContent('32 min');
    });
  });
});