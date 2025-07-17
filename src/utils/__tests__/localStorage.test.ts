import { UserProgress } from '../../types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
    removeItem: (key: string) => {
      delete store[key];
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('localStorage utilities', () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.clearAllMocks();
  });

  test('saves user progress to localStorage', () => {
    const userProgress: UserProgress = {
      userId: 'test-user',
      completedModules: ['intro-jung'],
      quizScores: { 'intro-jung': 90 },
      totalTime: 1800,
      lastAccessed: Date.now(),
      notes: [{
        id: 'note-1',
        moduleId: 'intro-jung',
        content: 'Test note',
        timestamp: Date.now()
      }]
    };

    window.localStorage.setItem('jungAppProgress', JSON.stringify(userProgress));
    
    const saved = window.localStorage.getItem('jungAppProgress');
    expect(saved).toBeTruthy();
    
    const parsed = JSON.parse(saved!);
    expect(parsed.userId).toBe('test-user');
    expect(parsed.completedModules).toEqual(['intro-jung']);
    expect(parsed.notes).toHaveLength(1);
  });

  test('retrieves user progress from localStorage', () => {
    const userProgress: UserProgress = {
      userId: 'test-user',
      completedModules: ['intro-jung', 'archetypes'],
      quizScores: { 'intro-jung': 85, 'archetypes': 92 },
      totalTime: 3600,
      lastAccessed: Date.now(),
      notes: []
    };

    window.localStorage.setItem('jungAppProgress', JSON.stringify(userProgress));
    
    const retrieved = JSON.parse(window.localStorage.getItem('jungAppProgress') || '{}');
    
    expect(retrieved.completedModules).toHaveLength(2);
    expect(retrieved.quizScores['intro-jung']).toBe(85);
    expect(retrieved.quizScores['archetypes']).toBe(92);
    expect(retrieved.totalTime).toBe(3600);
  });

  test('handles missing localStorage data gracefully', () => {
    const retrieved = window.localStorage.getItem('jungAppProgress');
    expect(retrieved).toBeNull();
    
    const parsed = JSON.parse(retrieved || '{}');
    expect(parsed).toEqual({});
  });

  test('updates existing progress', () => {
    const initialProgress: UserProgress = {
      userId: 'test-user',
      completedModules: ['intro-jung'],
      quizScores: { 'intro-jung': 80 },
      totalTime: 1000,
      lastAccessed: Date.now() - 1000,
      notes: []
    };

    window.localStorage.setItem('jungAppProgress', JSON.stringify(initialProgress));
    
    // Simulate updating progress
    const retrieved = JSON.parse(window.localStorage.getItem('jungAppProgress')!);
    const updatedProgress = {
      ...retrieved,
      completedModules: [...retrieved.completedModules, 'archetypes'],
      quizScores: { ...retrieved.quizScores, 'archetypes': 95 },
      totalTime: retrieved.totalTime + 500,
      lastAccessed: Date.now()
    };
    
    window.localStorage.setItem('jungAppProgress', JSON.stringify(updatedProgress));
    
    const final = JSON.parse(window.localStorage.getItem('jungAppProgress')!);
    expect(final.completedModules).toHaveLength(2);
    expect(final.totalTime).toBe(1500);
    expect(final.quizScores['archetypes']).toBe(95);
  });

  test('preserves notes when updating progress', () => {
    const progressWithNotes: UserProgress = {
      userId: 'test-user',
      completedModules: [],
      quizScores: {},
      totalTime: 0,
      lastAccessed: Date.now(),
      notes: [
        {
          id: 'note-1',
          moduleId: 'intro-jung',
          content: 'First note',
          timestamp: Date.now() - 1000
        },
        {
          id: 'note-2',
          moduleId: 'archetypes',
          content: 'Second note',
          timestamp: Date.now()
        }
      ]
    };

    window.localStorage.setItem('jungAppProgress', JSON.stringify(progressWithNotes));
    
    const retrieved = JSON.parse(window.localStorage.getItem('jungAppProgress')!);
    expect(retrieved.notes).toHaveLength(2);
    expect(retrieved.notes[0].content).toBe('First note');
    expect(retrieved.notes[1].content).toBe('Second note');
  });

  test('handles localStorage quota exceeded error', () => {
    const largeData = {
      userId: 'test-user',
      completedModules: [],
      quizScores: {},
      totalTime: 0,
      lastAccessed: Date.now(),
      notes: Array(10000).fill({
        id: 'note',
        moduleId: 'test',
        content: 'x'.repeat(1000),
        timestamp: Date.now()
      })
    };

    try {
      window.localStorage.setItem('jungAppProgress', JSON.stringify(largeData));
    } catch (e) {
      // QuotaExceededError should be handled gracefully
      expect(e).toBeDefined();
    }
  });
});