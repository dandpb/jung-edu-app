import React from 'react';
import { render, screen } from '../../utils/test-utils';
import Dashboard from '../Dashboard';
import { modules } from '../../data/modules';
import { UserProgress } from '../../types';

const mockUserProgress: UserProgress = {
  userId: 'test-user',
  completedModules: ['intro-jung', 'collective-unconscious'],
  quizScores: { 'intro-jung': 90 },
  totalTime: 3600,
  lastAccessed: Date.now(),
  notes: []
};

describe('Dashboard Component', () => {
  test('renders welcome message', () => {
    render(<Dashboard modules={modules} userProgress={mockUserProgress} />);
    
    expect(screen.getByText(/Bem-vindo à Psicologia Analítica de Jung/i)).toBeInTheDocument();
  });

  // Removed: These individual tests are now covered by the consolidated test above

  test('displays progress and study information correctly', () => {
    render(<Dashboard modules={modules} userProgress={mockUserProgress} />);
    
    // Check progress percentage
    const completionPercentage = Math.round((2 / modules.length) * 100);
    expect(screen.getByText(`${completionPercentage}%`)).toBeInTheDocument();
    
    // Check completed modules count
    expect(screen.getByText(`2 / ${modules.length}`)).toBeInTheDocument();
    
    // Check study time display
    const studyTimeCard = screen.getByText('Tempo de Estudo').closest('.card');
    const timeValue = studyTimeCard?.querySelector('p.text-3xl');
    expect(timeValue).toHaveTextContent('60 min');
  });

  test('renders all modules with completion status', () => {
    render(<Dashboard modules={modules} userProgress={mockUserProgress} />);
    
    // Check that all modules are displayed
    modules.forEach(module => {
      expect(screen.getByText(module.title)).toBeInTheDocument();
    });
    
    // Check that completed modules show checkmarks
    const container = screen.getByText(/Bem-vindo à Psicologia Analítica de Jung/i).closest('div')?.parentElement;
    const checkmarks = container?.querySelectorAll('svg.lucide-check-circle');
    expect(checkmarks?.length).toBe(2); // We have 2 completed modules
  });

  test('indicates locked modules with prerequisites', () => {
    render(<Dashboard modules={modules} userProgress={mockUserProgress} />);
    
    const lockedModules = modules.filter(m => 
      m.prerequisites?.some(req => !mockUserProgress.completedModules.includes(req))
    );
    
    if (lockedModules.length > 0) {
      // Use getAllByText since there might be multiple locked modules
      const prerequisiteTexts = screen.getAllByText(/Complete os pré-requisitos primeiro/i);
      expect(prerequisiteTexts.length).toBeGreaterThan(0);
      expect(prerequisiteTexts.length).toBe(lockedModules.length);
    }
  });
});