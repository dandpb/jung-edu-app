/**
 * Enhanced comprehensive test suite for Dashboard Component
 * Targets 100% coverage to boost overall project coverage
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../utils/test-utils';
import Dashboard from '../Dashboard';
import { modules } from '../../data/modules';
import { UserProgress, Module } from '../../types';

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Link: ({ to, className, children, ...props }: any) => (
    <a href={to} className={className} {...props}>
      {children}
    </a>
  ),
  useNavigate: () => mockNavigate
}));

const mockUserProgress: UserProgress = {
  userId: 'test-user',
  completedModules: ['intro-jung', 'collective-unconscious'],
  quizScores: { 
    'intro-jung': 90,
    'collective-unconscious': 85
  },
  totalTime: 3600,
  lastAccessed: Date.now(),
  notes: []
};

const mockEmptyProgress: UserProgress = {
  userId: 'empty-user',
  completedModules: [],
  quizScores: {},
  totalTime: 0,
  lastAccessed: Date.now(),
  notes: []
};

const mockModules: Module[] = [
  {
    id: 'intro-jung',
    title: 'Introduction to Jung',
    description: 'Basic introduction to Jungian psychology',
    estimatedTime: 45,
    difficulty: 'beginner',
    icon: '🧠',
    prerequisites: []
  },
  {
    id: 'collective-unconscious',
    title: 'Collective Unconscious',
    description: 'Understanding the collective unconscious',
    estimatedTime: 60,
    difficulty: 'intermediate',
    icon: '🌊',
    prerequisites: ['intro-jung']
  },
  {
    id: 'advanced-concepts',
    title: 'Advanced Concepts',
    description: 'Advanced Jungian concepts',
    estimatedTime: 90,
    difficulty: 'advanced',
    icon: '⚡',
    prerequisites: ['intro-jung', 'collective-unconscious']
  },
  {
    id: 'locked-module',
    title: 'Locked Module',
    description: 'This module is locked',
    estimatedTime: 30,
    difficulty: 'beginner',
    icon: '🔒',
    prerequisites: ['non-existent-prerequisite']
  }
];

describe('Dashboard Component - Enhanced Coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders welcome message correctly', () => {
      render(<Dashboard modules={mockModules} userProgress={mockUserProgress} />);
      
      expect(screen.getByTestId('welcome-message')).toHaveTextContent(
        'Bem-vindo à Psicologia Analítica de Jung'
      );
    });

    it('renders dashboard description', () => {
      render(<Dashboard modules={mockModules} userProgress={mockUserProgress} />);
      
      expect(screen.getByTestId('dashboard-description')).toHaveTextContent(
        'Explore as profundezas da psique humana através das teorias revolucionárias de Carl Jung'
      );
    });

    it('renders all main sections with correct test IDs', () => {
      render(<Dashboard modules={mockModules} userProgress={mockUserProgress} />);
      
      expect(screen.getByTestId('dashboard-container')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-header')).toBeInTheDocument();
      expect(screen.getByTestId('progress-section')).toBeInTheDocument();
      expect(screen.getByTestId('recent-modules-section')).toBeInTheDocument();
    });
  });

  describe('Progress Statistics', () => {
    it('calculates and displays correct completion percentage', () => {
      render(<Dashboard modules={mockModules} userProgress={mockUserProgress} />);
      
      // 2 completed out of 4 modules = 50%
      const expectedPercentage = Math.round((2 / 4) * 100);
      expect(screen.getByTestId('completion-percentage')).toHaveTextContent(`${expectedPercentage}%`);
    });

    it('displays progress bar with correct width', () => {
      render(<Dashboard modules={mockModules} userProgress={mockUserProgress} />);
      
      const progressBar = screen.getByTestId('progress-bar').querySelector('.bg-primary-600');
      const expectedPercentage = Math.round((2 / 4) * 100);
      expect(progressBar).toHaveStyle(`width: ${expectedPercentage}%`);
    });

    it('displays correct module completion count', () => {
      render(<Dashboard modules={mockModules} userProgress={mockUserProgress} />);
      
      expect(screen.getByTestId('modules-completed-count')).toHaveTextContent('2 / 4');
    });

    it('displays total study time correctly', () => {
      render(<Dashboard modules={mockModules} userProgress={mockUserProgress} />);
      
      // 3600 seconds = 60 minutes
      expect(screen.getByTestId('total-time')).toHaveTextContent('60 min');
    });

    it('handles zero progress correctly', () => {
      render(<Dashboard modules={mockModules} userProgress={mockEmptyProgress} />);
      
      expect(screen.getByTestId('completion-percentage')).toHaveTextContent('0%');
      expect(screen.getByTestId('modules-completed-count')).toHaveTextContent('0 / 4');
      expect(screen.getByTestId('total-time')).toHaveTextContent('0 min');
    });

    it('handles 100% completion', () => {
      const fullProgress: UserProgress = {
        ...mockUserProgress,
        completedModules: mockModules.map(m => m.id)
      };
      
      render(<Dashboard modules={mockModules} userProgress={fullProgress} />);
      
      expect(screen.getByTestId('completion-percentage')).toHaveTextContent('100%');
      expect(screen.getByTestId('modules-completed-count')).toHaveTextContent('4 / 4');
    });

    it('rounds completion percentage correctly', () => {
      const oddProgress: UserProgress = {
        ...mockUserProgress,
        completedModules: ['intro-jung'] // 1 out of 4 = 25%
      };
      
      render(<Dashboard modules={mockModules} userProgress={oddProgress} />);
      
      expect(screen.getByTestId('completion-percentage')).toHaveTextContent('25%');
    });
  });

  describe('Module Display and Status', () => {
    it('renders all modules with correct titles', () => {
      render(<Dashboard modules={mockModules} userProgress={mockUserProgress} />);
      
      mockModules.forEach(module => {
        expect(screen.getByText(module.title)).toBeInTheDocument();
      });
    });

    it('shows completion checkmarks for completed modules', () => {
      render(<Dashboard modules={mockModules} userProgress={mockUserProgress} />);
      
      const checkmarks = document.querySelectorAll('.lucide-check-circle');
      expect(checkmarks).toHaveLength(2); // 2 completed modules
    });

    it('displays module descriptions correctly', () => {
      render(<Dashboard modules={mockModules} userProgress={mockUserProgress} />);
      
      mockModules.forEach(module => {
        expect(screen.getByText(module.description)).toBeInTheDocument();
      });
    });

    it('displays module icons correctly', () => {
      render(<Dashboard modules={mockModules} userProgress={mockUserProgress} />);
      
      mockModules.forEach(module => {
        expect(screen.getByText(module.icon)).toBeInTheDocument();
      });
    });

    it('shows estimated time for each module', () => {
      render(<Dashboard modules={mockModules} userProgress={mockUserProgress} />);
      
      expect(screen.getByText('45 min')).toBeInTheDocument();
      expect(screen.getByText('60 min')).toBeInTheDocument();
      expect(screen.getByText('90 min')).toBeInTheDocument();
      expect(screen.getByText('30 min')).toBeInTheDocument();
    });
  });

  describe('Difficulty Levels', () => {
    it('displays difficulty badges with correct colors and text', () => {
      render(<Dashboard modules={mockModules} userProgress={mockUserProgress} />);
      
      // Check beginner (green)
      const beginnerBadges = screen.getAllByText('Iniciante');
      beginnerBadges.forEach(badge => {
        expect(badge).toHaveClass('text-green-600', 'bg-green-50');
      });
      
      // Check intermediate (yellow)
      const intermediateBadge = screen.getByText('Intermediário');
      expect(intermediateBadge).toHaveClass('text-yellow-600', 'bg-yellow-50');
      
      // Check advanced (red)
      const advancedBadge = screen.getByText('Avançado');
      expect(advancedBadge).toHaveClass('text-red-600', 'bg-red-50');
    });

    it('handles unknown difficulty levels gracefully', () => {
      const moduleWithUnknownDifficulty: Module = {
        ...mockModules[0],
        id: 'unknown-difficulty',
        difficulty: 'unknown-level' as any
      };
      
      render(<Dashboard modules={[moduleWithUnknownDifficulty]} userProgress={mockEmptyProgress} />);
      
      expect(screen.getByText('unknown-level')).toHaveClass('text-gray-600', 'bg-gray-50');
    });

    it('applies default difficulty styling for undefined values', () => {
      const moduleWithUndefinedDifficulty: Module = {
        ...mockModules[0],
        id: 'undefined-difficulty',
        difficulty: undefined as any
      };
      
      render(<Dashboard modules={[moduleWithUndefinedDifficulty]} userProgress={mockEmptyProgress} />);
      
      // Should use default styling
      const difficultyElement = document.querySelector('.text-gray-600.bg-gray-50');
      expect(difficultyElement).toBeInTheDocument();
    });
  });

  describe('Module Prerequisites and Locking', () => {
    it('identifies and displays locked modules correctly', () => {
      render(<Dashboard modules={mockModules} userProgress={mockUserProgress} />);
      
      const prerequisiteTexts = screen.getAllByText(/Complete os pré-requisitos primeiro/i);
      expect(prerequisiteTexts).toHaveLength(1); // Only locked-module should be locked
    });

    it('applies correct styling to locked modules', () => {
      render(<Dashboard modules={mockModules} userProgress={mockUserProgress} />);
      
      const moduleCards = screen.getAllByTestId('module-card');
      const lockedCard = moduleCards.find(card => 
        card.textContent?.includes('Locked Module')
      );
      
      expect(lockedCard).toHaveClass('opacity-60', 'cursor-not-allowed');
    });

    it('sets correct href for locked modules', () => {
      render(<Dashboard modules={mockModules} userProgress={mockUserProgress} />);
      
      const moduleLinks = document.querySelectorAll('a[data-testid="module-card"]');
      const lockedLink = Array.from(moduleLinks).find(link => 
        link.textContent?.includes('Locked Module')
      ) as HTMLAnchorElement;
      
      expect(lockedLink.href).toContain('#');
    });

    it('does not show arrow icon for locked modules', () => {
      render(<Dashboard modules={mockModules} userProgress={mockUserProgress} />);
      
      const moduleCards = screen.getAllByTestId('module-card');
      const lockedCard = moduleCards.find(card => 
        card.textContent?.includes('Locked Module')
      );
      
      const arrowIcon = lockedCard?.querySelector('.lucide-arrow-right');
      expect(arrowIcon).toBeNull();
    });

    it('shows arrow icon for unlocked modules', () => {
      render(<Dashboard modules={mockModules} userProgress={mockUserProgress} />);
      
      const moduleCards = screen.getAllByTestId('module-card');
      const unlockedCard = moduleCards.find(card => 
        card.textContent?.includes('Introduction to Jung')
      );
      
      const arrowIcon = unlockedCard?.querySelector('.lucide-arrow-right');
      expect(arrowIcon).not.toBeNull();
    });

    it('handles modules without prerequisites', () => {
      const moduleWithoutPrereqs: Module = {
        ...mockModules[0],
        prerequisites: undefined
      };
      
      render(<Dashboard modules={[moduleWithoutPrereqs]} userProgress={mockEmptyProgress} />);
      
      const moduleCard = screen.getByTestId('module-card');
      expect(moduleCard).not.toHaveClass('opacity-60');
    });

    it('handles empty prerequisites array', () => {
      render(<Dashboard modules={mockModules} userProgress={mockUserProgress} />);
      
      const introModule = screen.getByText('Introduction to Jung').closest('[data-testid="module-card"]');
      expect(introModule).not.toHaveClass('opacity-60');
    });
  });

  describe('Quick Actions', () => {
    it('renders quick action buttons', () => {
      render(<Dashboard modules={mockModules} userProgress={mockUserProgress} />);
      
      expect(screen.getByTestId('quick-action-search')).toBeInTheDocument();
      expect(screen.getByTestId('quick-action-progress')).toBeInTheDocument();
    });

    it('applies correct styling to quick action buttons', () => {
      render(<Dashboard modules={mockModules} userProgress={mockUserProgress} />);
      
      const searchButton = screen.getByTestId('quick-action-search');
      expect(searchButton).toHaveClass('px-3', 'py-2', 'text-sm', 'bg-gray-100', 'hover:bg-gray-200');
      
      const progressButton = screen.getByTestId('quick-action-progress');
      expect(progressButton).toHaveClass('px-3', 'py-2', 'text-sm', 'bg-primary-100', 'hover:bg-primary-200');
    });

    it('makes quick action buttons interactive', () => {
      render(<Dashboard modules={mockModules} userProgress={mockUserProgress} />);
      
      const searchButton = screen.getByTestId('quick-action-search');
      const progressButton = screen.getByTestId('quick-action-progress');
      
      fireEvent.click(searchButton);
      fireEvent.click(progressButton);
      
      // Should not throw errors (buttons are functional)
      expect(searchButton).toBeInTheDocument();
      expect(progressButton).toBeInTheDocument();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles empty modules array', () => {
      render(<Dashboard modules={[]} userProgress={mockEmptyProgress} />);
      
      expect(screen.getByTestId('completion-percentage')).toHaveTextContent('0%');
      expect(screen.getByTestId('modules-completed-count')).toHaveTextContent('0 / 0');
    });

    it('handles modules array with undefined elements', () => {
      const modulesWithUndefined = [mockModules[0], undefined as any, mockModules[1]];
      
      // Should not crash
      expect(() => {
        render(<Dashboard modules={modulesWithUndefined} userProgress={mockEmptyProgress} />);
      }).not.toThrow();
    });

    it('handles very large completion percentages gracefully', () => {
      const progressWithMoreCompleted: UserProgress = {
        ...mockUserProgress,
        completedModules: ['intro-jung', 'collective-unconscious', 'extra-module-1', 'extra-module-2']
      };
      
      render(<Dashboard modules={mockModules} userProgress={progressWithMoreCompleted} />);
      
      // Should cap at 100%
      expect(screen.getByTestId('completion-percentage')).toHaveTextContent('100%');
    });

    it('handles negative time values', () => {
      const negativeTimeProgress: UserProgress = {
        ...mockUserProgress,
        totalTime: -100
      };
      
      render(<Dashboard modules={mockModules} userProgress={negativeTimeProgress} />);
      
      expect(screen.getByTestId('total-time')).toHaveTextContent('-2 min');
    });

    it('handles modules with missing fields', () => {
      const incompleteModule: Partial<Module> = {
        id: 'incomplete',
        title: 'Incomplete Module'
        // Missing other required fields
      };
      
      expect(() => {
        render(<Dashboard modules={[incompleteModule as Module]} userProgress={mockEmptyProgress} />);
      }).not.toThrow();
    });

    it('handles extremely long module titles and descriptions', () => {
      const longContentModule: Module = {
        ...mockModules[0],
        id: 'long-content',
        title: 'A'.repeat(200),
        description: 'B'.repeat(500)
      };
      
      render(<Dashboard modules={[longContentModule]} userProgress={mockEmptyProgress} />);
      
      expect(screen.getByText('A'.repeat(200))).toBeInTheDocument();
      expect(screen.getByText('B'.repeat(500))).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('applies correct grid classes for responsiveness', () => {
      render(<Dashboard modules={mockModules} userProgress={mockUserProgress} />);
      
      const progressSection = screen.getByTestId('progress-section');
      expect(progressSection).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-3');
      
      const modulesList = screen.getByTestId('recent-modules-list');
      expect(modulesList).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
    });

    it('applies proper spacing and layout classes', () => {
      render(<Dashboard modules={mockModules} userProgress={mockUserProgress} />);
      
      const container = screen.getByTestId('dashboard-container');
      expect(container).toHaveClass('max-w-7xl', 'mx-auto');
      
      const header = screen.getByTestId('dashboard-header');
      expect(header).toHaveClass('mb-8');
    });
  });

  describe('Accessibility', () => {
    it('uses proper heading hierarchy', () => {
      render(<Dashboard modules={mockModules} userProgress={mockUserProgress} />);
      
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Bem-vindo à Psicologia Analítica de Jung');
      
      const sectionHeading = screen.getByRole('heading', { level: 2 });
      expect(sectionHeading).toHaveTextContent('Módulos de Aprendizagem');
    });

    it('provides proper text alternatives for icons', () => {
      render(<Dashboard modules={mockModules} userProgress={mockUserProgress} />);
      
      // Icons are text-based emojis, so they should be readable
      mockModules.forEach(module => {
        expect(screen.getByText(module.icon)).toBeInTheDocument();
      });
    });

    it('ensures proper color contrast for difficulty badges', () => {
      render(<Dashboard modules={mockModules} userProgress={mockUserProgress} />);
      
      // Test that difficulty badges have appropriate color classes
      expect(screen.getByText('Iniciante')).toHaveClass('text-green-600');
      expect(screen.getByText('Intermediário')).toHaveClass('text-yellow-600');
      expect(screen.getByText('Avançado')).toHaveClass('text-red-600');
    });
  });

  describe('Performance Considerations', () => {
    it('renders efficiently with many modules', () => {
      const manyModules = Array(50).fill(null).map((_, index) => ({
        ...mockModules[0],
        id: `module-${index}`,
        title: `Module ${index}`,
        description: `Description for module ${index}`
      }));
      
      const startTime = performance.now();
      render(<Dashboard modules={manyModules} userProgress={mockEmptyProgress} />);
      const endTime = performance.now();
      
      // Should render in reasonable time (less than 100ms)
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('handles rapid re-renders gracefully', () => {
      const { rerender } = render(<Dashboard modules={mockModules} userProgress={mockUserProgress} />);
      
      // Rapid re-renders should not cause errors
      for (let i = 0; i < 10; i++) {
        rerender(<Dashboard modules={mockModules} userProgress={{
          ...mockUserProgress,
          totalTime: i * 100
        }} />);
      }
      
      expect(screen.getByTestId('dashboard-container')).toBeInTheDocument();
    });
  });

  describe('Data Consistency', () => {
    it('maintains consistency between progress stats and module display', () => {
      render(<Dashboard modules={mockModules} userProgress={mockUserProgress} />);
      
      // Count completed modules from UI
      const checkmarks = document.querySelectorAll('.lucide-check-circle');
      const completedCount = checkmarks.length;
      
      // Should match the displayed count
      const displayedCount = parseInt(screen.getByTestId('modules-completed-count').textContent!.split(' / ')[0]);
      expect(completedCount).toBe(displayedCount);
    });

    it('ensures module completion status consistency', () => {
      render(<Dashboard modules={mockModules} userProgress={mockUserProgress} />);
      
      // Check that completed modules show checkmarks
      mockUserProgress.completedModules.forEach(moduleId => {
        const module = mockModules.find(m => m.id === moduleId);
        if (module) {
          const moduleElement = screen.getByText(module.title).closest('[data-testid="module-card"]');
          expect(moduleElement?.querySelector('.lucide-check-circle')).toBeInTheDocument();
        }
      });
    });
  });
});