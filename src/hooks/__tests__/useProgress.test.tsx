import { renderHook, act } from '@testing-library/react';
import { useState, useEffect } from 'react';
import { UserProgress } from '../../types';

// Custom hook to manage user progress
function useProgress() {
  const [userProgress, setUserProgress] = useState<UserProgress>(() => {
    const saved = localStorage.getItem('jungAppProgress');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      userId: 'user-' + Date.now(),
      completedModules: [],
      quizScores: {},
      totalTime: 0,
      lastAccessed: Date.now(),
      notes: []
    };
  });

  useEffect(() => {
    localStorage.setItem('jungAppProgress', JSON.stringify(userProgress));
  }, [userProgress]);

  const updateProgress = (updates: Partial<UserProgress>) => {
    setUserProgress(prev => ({
      ...prev,
      ...updates,
      lastAccessed: Date.now()
    }));
  };

  return { userProgress, updateProgress };
}

describe('useProgress Hook', () => {
  beforeEach(() => {
    // Clear localStorage and all mocks before each test
    localStorage.clear();
    jest.clearAllMocks();
    // Restore all mocks to ensure clean state
    jest.restoreAllMocks();
    // Mock localStorage to fix the behavior
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn((key) => {
          if (key === 'jungAppProgress' && (window as any).__mockLocalStorage?.[key]) {
            return (window as any).__mockLocalStorage[key];
          }
          return null;
        }),
        setItem: jest.fn((key, value) => {
          if (!(window as any).__mockLocalStorage) {
            (window as any).__mockLocalStorage = {};
          }
          (window as any).__mockLocalStorage[key] = value;
        }),
        clear: jest.fn(() => {
          (window as any).__mockLocalStorage = {};
        }),
        removeItem: jest.fn((key) => {
          if ((window as any).__mockLocalStorage) {
            delete (window as any).__mockLocalStorage[key];
          }
        })
      },
      writable: true
    });
  });

  test('initializes with default progress when localStorage is empty', () => {
    const { result } = renderHook(() => useProgress());
    
    expect(result.current.userProgress.completedModules).toEqual([]);
    expect(result.current.userProgress.quizScores).toEqual({});
    expect(result.current.userProgress.totalTime).toBe(0);
    expect(result.current.userProgress.notes).toEqual([]);
    expect(result.current.userProgress.userId).toMatch(/^user-\d+$/);
  });

  test('loads existing progress from localStorage', () => {
    const existingProgress: UserProgress = {
      userId: 'existing-user',
      completedModules: ['intro-jung'],
      quizScores: { 'intro-jung': 85 },
      totalTime: 1800,
      lastAccessed: Date.now() - 1000,
      notes: []
    };
    
    // Set the value in localStorage before rendering the hook
    localStorage.setItem('jungAppProgress', JSON.stringify(existingProgress));
    
    const { result } = renderHook(() => useProgress());
    
    expect(result.current.userProgress.userId).toBe('existing-user');
    expect(result.current.userProgress.completedModules).toEqual(['intro-jung']);
    expect(result.current.userProgress.quizScores['intro-jung']).toBe(85);
  });

  test('updates progress and saves to localStorage', () => {
    const { result } = renderHook(() => useProgress());
    
    act(() => {
      result.current.updateProgress({
        completedModules: ['intro-jung'],
        quizScores: { 'intro-jung': 90 }
      });
    });
    
    expect(result.current.userProgress.completedModules).toEqual(['intro-jung']);
    expect(result.current.userProgress.quizScores['intro-jung']).toBe(90);
    
    // Verify that localStorage.setItem was called with the correct data
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'jungAppProgress',
      expect.stringContaining('"completedModules":["intro-jung"]')
    );
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'jungAppProgress',
      expect.stringContaining('"quizScores":{"intro-jung":90}')
    );
  });

  test('updates lastAccessed timestamp on every update', async () => {
    const { result } = renderHook(() => useProgress());
    
    const initialTimestamp = result.current.userProgress.lastAccessed;
    
    // Wait a bit to ensure timestamp changes
    await new Promise(resolve => setTimeout(resolve, 10));
    
    act(() => {
      result.current.updateProgress({
        totalTime: 100
      });
    });
    
    expect(result.current.userProgress.lastAccessed).toBeGreaterThan(initialTimestamp);
  });

  test('merges partial updates correctly', () => {
    const { result } = renderHook(() => useProgress());
    
    act(() => {
      result.current.updateProgress({
        completedModules: ['intro-jung']
      });
    });
    
    act(() => {
      result.current.updateProgress({
        quizScores: { 'intro-jung': 95 }
      });
    });
    
    expect(result.current.userProgress.completedModules).toEqual(['intro-jung']);
    expect(result.current.userProgress.quizScores['intro-jung']).toBe(95);
  });

  test('handles notes updates', () => {
    const { result } = renderHook(() => useProgress());
    
    const newNote = {
      id: 'note-1',
      moduleId: 'intro-jung',
      content: 'Test note',
      timestamp: Date.now()
    };
    
    act(() => {
      result.current.updateProgress({
        notes: [newNote]
      });
    });
    
    expect(result.current.userProgress.notes).toHaveLength(1);
    expect(result.current.userProgress.notes[0].content).toBe('Test note');
  });
});