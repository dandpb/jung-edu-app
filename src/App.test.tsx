import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock localStorage responses for different keys
    mockLocalStorage.getItem.mockImplementation((key: string) => {
      if (key === 'jungAppProgress') return null;
      if (key === 'jungAppModules') return JSON.stringify([
        { id: 'test-module', title: 'Test Module', concepts: ['concept1'] }
      ]);
      if (key === 'jungAppMindMapNodes') return JSON.stringify([]);
      if (key === 'jungAppMindMapEdges') return JSON.stringify([]);
      return null;
    });
  });

  test('renders without crashing', () => {
    render(<App />);
    expect(screen.getByText(/Psicologia de Jung/i)).toBeInTheDocument();
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
    
    // Override the mock for this specific test
    mockLocalStorage.getItem.mockImplementation((key: string) => {
      if (key === 'jungAppProgress') return JSON.stringify(savedProgress);
      if (key === 'jungAppModules') return JSON.stringify([
        { id: 'test-module', title: 'Test Module', concepts: ['concept1'] }
      ]);
      if (key === 'jungAppMindMapNodes') return JSON.stringify([]);
      if (key === 'jungAppMindMapEdges') return JSON.stringify([]);
      return null;
    });
    
    render(<App />);
    
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('jungAppProgress');
  });

  test('creates new user progress if none exists', () => {
    render(<App />);
    
    // Check that localStorage.setItem was called
    expect(mockLocalStorage.setItem).toHaveBeenCalled();
    
    // Get the arguments passed to localStorage.setItem
    const calls = mockLocalStorage.setItem.mock.calls;
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
    
    expect(screen.getByText('Painel')).toBeInTheDocument();
    expect(screen.getByText('Mapa Mental')).toBeInTheDocument();
    expect(screen.getByText('Anotações')).toBeInTheDocument();
    expect(screen.getByText('Recursos')).toBeInTheDocument();
    expect(screen.getByText('Buscar')).toBeInTheDocument();
  });
});