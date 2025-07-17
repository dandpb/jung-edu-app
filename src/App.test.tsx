import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('renders without crashing', () => {
    render(<App />);
    expect(screen.getByText(/Jung's Psychology/i)).toBeInTheDocument();
  });

  test('initializes user progress from localStorage', () => {
    const savedProgress = {
      userId: 'test-user',
      completedModules: ['intro-jung'],
      quizScores: { 'intro-jung': 85 },
      totalTime: 1800,
      lastAccessed: Date.now(),
      notes: []
    };
    
    localStorage.setItem('jungAppProgress', JSON.stringify(savedProgress));
    
    render(<App />);
    
    expect(localStorage.getItem).toHaveBeenCalledWith('jungAppProgress');
  });

  test('creates new user progress if none exists', () => {
    render(<App />);
    
    // Check that localStorage.setItem was called
    expect(localStorage.setItem).toHaveBeenCalled();
    
    // Get the arguments passed to localStorage.setItem
    const calls = (localStorage.setItem as jest.Mock).mock.calls;
    const progressCall = calls.find(call => call[0] === 'jungAppProgress');
    
    expect(progressCall).toBeDefined();
    
    if (progressCall) {
      const savedData = JSON.parse(progressCall[1]);
      expect(savedData).toHaveProperty('userId');
      expect(savedData.completedModules).toEqual([]);
      expect(savedData.notes).toEqual([]);
    }
  });

  test('navigation renders all required links', () => {
    render(<App />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Mind Map')).toBeInTheDocument();
    expect(screen.getByText('Notes')).toBeInTheDocument();
    expect(screen.getByText('Progress')).toBeInTheDocument();
    expect(screen.getByText('Resources')).toBeInTheDocument();
    expect(screen.getByText('Search')).toBeInTheDocument();
  });
});