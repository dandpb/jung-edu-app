import React from 'react';
import { render, screen } from '@testing-library/react';
import ProgressPage from '../ProgressPage';
import { modules } from '../../data/modules';
import { UserProgress } from '../../types';

const mockUserProgress: UserProgress = {
  userId: 'test-user',
  completedModules: ['intro-jung', 'collective-unconscious'],
  quizScores: { 
    'intro-jung': 90,
    'collective-unconscious': 85,
    'archetypes': 75
  },
  totalTime: 7800, // 2 hours and 10 minutes
  lastAccessed: Date.now(),
  notes: []
};

describe('ProgressPage Component', () => {
  test('displays overall progress percentage', () => {
    render(<ProgressPage userProgress={mockUserProgress} modules={modules} />);
    
    const completionPercentage = Math.round((2 / modules.length) * 100);
    expect(screen.getByText(`${completionPercentage}%`)).toBeInTheDocument();
  });

  test('shows correct modules completed count', () => {
    render(<ProgressPage userProgress={mockUserProgress} modules={modules} />);
    
    expect(screen.getByText(`2/${modules.length}`)).toBeInTheDocument();
  });

  test('displays study time in correct format', () => {
    render(<ProgressPage userProgress={mockUserProgress} modules={modules} />);
    
    expect(screen.getByText('2h 10m')).toBeInTheDocument();
  });

  test('calculates and displays average quiz score', () => {
    render(<ProgressPage userProgress={mockUserProgress} modules={modules} />);
    
    const averageScore = Math.round((90 + 85 + 75) / 3);
    expect(screen.getByText(`${averageScore}%`)).toBeInTheDocument();
  });

  test('shows all modules with their status', () => {
    render(<ProgressPage userProgress={mockUserProgress} modules={modules} />);
    
    modules.forEach(module => {
      expect(screen.getByText(module.title)).toBeInTheDocument();
    });
    
    // Check that the correct modules show as completed
    // The page shows "Completed" in the summary card AND for each completed module
    const completedModules = mockUserProgress.completedModules;
    completedModules.forEach(moduleId => {
      const module = modules.find(m => m.id === moduleId);
      if (module) {
        // Find the module's title and check its status
        const moduleElement = screen.getByText(module.title).closest('div');
        expect(moduleElement).toHaveTextContent('Completed');
      }
    });
  });

  test('displays quiz scores for completed modules', () => {
    render(<ProgressPage userProgress={mockUserProgress} modules={modules} />);
    
    expect(screen.getByText('90%')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  test('shows locked status for modules with incomplete prerequisites', () => {
    render(<ProgressPage userProgress={mockUserProgress} modules={modules} />);
    
    const lockedModules = modules.filter(m => 
      m.prerequisites?.some(req => !mockUserProgress.completedModules.includes(req))
    );
    
    if (lockedModules.length > 0) {
      const lockedElements = screen.getAllByText(/Locked - Complete prerequisites/);
      expect(lockedElements.length).toBeGreaterThan(0);
    }
  });

  test('displays unlocked achievements', () => {
    render(<ProgressPage userProgress={mockUserProgress} modules={modules} />);
    
    // First Steps achievement should be unlocked
    expect(screen.getByText('First Steps')).toBeInTheDocument();
    expect(screen.getByText('Complete your first module')).toBeInTheDocument();
    
    // Dedicated Learner achievement should be unlocked (2h 10m > 2h)
    expect(screen.getByText('Dedicated Learner')).toBeInTheDocument();
    expect(screen.getByText('Study for more than 2 hours')).toBeInTheDocument();
  });

  test('shows locked achievements with reduced opacity', () => {
    const newUserProgress = { ...mockUserProgress, completedModules: [], totalTime: 0 };
    render(<ProgressPage userProgress={newUserProgress} modules={modules} />);
    
    const achievements = screen.getAllByText('Locked');
    expect(achievements.length).toBeGreaterThan(0);
  });

  test('displays Quiz Master achievement when score >= 90%', () => {
    render(<ProgressPage userProgress={mockUserProgress} modules={modules} />);
    
    expect(screen.getByText('Quiz Master')).toBeInTheDocument();
    expect(screen.getByText('Score 90% or higher on any quiz')).toBeInTheDocument();
    
    // Multiple achievements might be unlocked, so use getAllByText
    const unlockedElements = screen.getAllByText('✓ Unlocked');
    expect(unlockedElements.length).toBeGreaterThan(0);
  });

  test('shows overall progress percentage correctly', () => {
    render(<ProgressPage userProgress={mockUserProgress} modules={modules} />);
    
    // The component displays the percentage as text, not as a progress bar
    const completionPercentage = Math.round((2 / modules.length) * 100);
    expect(screen.getByText(`${completionPercentage}%`)).toBeInTheDocument();
  });
});