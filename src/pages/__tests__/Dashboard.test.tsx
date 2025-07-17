import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
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

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {component}
    </BrowserRouter>
  );
};

describe('Dashboard Component', () => {
  test('renders welcome message', () => {
    renderWithRouter(<Dashboard modules={modules} userProgress={mockUserProgress} />);
    
    expect(screen.getByText(/Welcome to Jung's Analytical Psychology/i)).toBeInTheDocument();
  });

  test('displays overall progress correctly', () => {
    renderWithRouter(<Dashboard modules={modules} userProgress={mockUserProgress} />);
    
    const completionPercentage = Math.round((2 / modules.length) * 100);
    expect(screen.getByText(`${completionPercentage}%`)).toBeInTheDocument();
  });

  test('shows correct number of completed modules', () => {
    renderWithRouter(<Dashboard modules={modules} userProgress={mockUserProgress} />);
    
    expect(screen.getByText(`2 / ${modules.length}`)).toBeInTheDocument();
  });

  test('displays study time in correct format', () => {
    renderWithRouter(<Dashboard modules={modules} userProgress={mockUserProgress} />);
    
    // Find the study time card specifically
    const studyTimeCard = screen.getByText('Study Time').closest('.card');
    expect(studyTimeCard).toBeInTheDocument();
    
    // Within the study time card, find the time value
    const timeValue = studyTimeCard?.querySelector('p.text-3xl');
    expect(timeValue).toHaveTextContent('60 min');
  });

  test('renders all modules', () => {
    renderWithRouter(<Dashboard modules={modules} userProgress={mockUserProgress} />);
    
    modules.forEach(module => {
      expect(screen.getByText(module.title)).toBeInTheDocument();
      expect(screen.getByText(module.description)).toBeInTheDocument();
    });
  });

  test('shows completed checkmark for completed modules', () => {
    renderWithRouter(<Dashboard modules={modules} userProgress={mockUserProgress} />);
    
    // Find all CheckCircle icons by looking for svg elements with the lucide-check-circle class
    const container = screen.getByText(/Welcome to Jung's Analytical Psychology/i).closest('div')?.parentElement;
    const checkmarks = container?.querySelectorAll('svg.lucide-check-circle');
    expect(checkmarks?.length).toBe(2); // We have 2 completed modules
  });

  test('displays module difficulty levels', () => {
    renderWithRouter(<Dashboard modules={modules} userProgress={mockUserProgress} />);
    
    expect(screen.getAllByText(/beginner|intermediate|advanced/i).length).toBeGreaterThan(0);
  });

  test('shows estimated time for each module', () => {
    renderWithRouter(<Dashboard modules={modules} userProgress={mockUserProgress} />);
    
    modules.forEach(module => {
      // Find the module card by its title
      const moduleCard = screen.getByText(module.title).closest('.module-card');
      expect(moduleCard).toBeInTheDocument();
      
      // Within the module card, find the time display
      const timeDisplay = moduleCard?.querySelector('.flex.items-center.text-gray-500');
      expect(timeDisplay).toHaveTextContent(`${module.estimatedTime} min`);
    });
  });

  test('indicates locked modules with prerequisites', () => {
    renderWithRouter(<Dashboard modules={modules} userProgress={mockUserProgress} />);
    
    const lockedModules = modules.filter(m => 
      m.prerequisites?.some(req => !mockUserProgress.completedModules.includes(req))
    );
    
    if (lockedModules.length > 0) {
      // Use getAllByText since there might be multiple locked modules
      const prerequisiteTexts = screen.getAllByText(/Complete prerequisites first/i);
      expect(prerequisiteTexts.length).toBeGreaterThan(0);
      expect(prerequisiteTexts.length).toBe(lockedModules.length);
    }
  });
});