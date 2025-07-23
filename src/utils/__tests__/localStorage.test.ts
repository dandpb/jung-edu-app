import { UserProgress, Note } from '../../types';
import {
  saveUserProgress,
  loadUserProgress,
  clearUserProgress,
  saveNotes,
  loadNotes,
  saveModuleProgress,
  loadModuleProgress
} from '../localStorage';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    // Helper to access store for debugging
    __store: store
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

describe('localStorage utilities', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Reset the internal store
    (localStorageMock as any).__store = {};
    
    // Create a fresh console.error spy for each test
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Reset the localStorage mock functions to their default implementations
    (window.localStorage.getItem as jest.Mock).mockImplementation((key: string) => 
      (localStorageMock as any).__store[key] || null
    );
    (window.localStorage.setItem as jest.Mock).mockImplementation((key: string, value: string) => {
      (localStorageMock as any).__store[key] = value.toString();
    });
    (window.localStorage.removeItem as jest.Mock).mockImplementation((key: string) => {
      delete (localStorageMock as any).__store[key];
    });
    (window.localStorage.clear as jest.Mock).mockImplementation(() => {
      (localStorageMock as any).__store = {};
    });
  });

  afterEach(() => {
    // Restore console.error after each test
    consoleErrorSpy.mockRestore();
  });

  describe('saveUserProgress', () => {
    it('should save user progress to localStorage', () => {
      const userProgress: UserProgress = {
        userId: 'test-user',
        completedModules: ['intro-jung'],
        quizScores: { 'intro-jung': 90 },
        totalTime: 1800,
        lastAccessed: Date.now(),
        notes: []
      };

      saveUserProgress(userProgress);
      
      const saved = window.localStorage.getItem('jungAppUserProgress');
      expect(saved).toBeTruthy();
      
      const parsed = JSON.parse(saved!);
      expect(parsed.userId).toBe('test-user');
      expect(parsed.completedModules).toEqual(['intro-jung']);
      expect(parsed.quizScores['intro-jung']).toBe(90);
    });

    it('should handle errors gracefully', () => {
      // Mock setItem to throw an error
      (window.localStorage.setItem as jest.Mock).mockImplementation(() => {
        throw new Error('Storage error');
      });

      const userProgress: UserProgress = {
        userId: 'test-user',
        completedModules: [],
        quizScores: {},
        totalTime: 0,
        lastAccessed: Date.now(),
        notes: []
      };

      saveUserProgress(userProgress);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to save user progress:', expect.any(Error));
    });
  });

  describe('loadUserProgress', () => {
    it('should load user progress from localStorage', () => {
      const userProgress: UserProgress = {
        userId: 'test-user',
        completedModules: ['intro-jung', 'archetypes'],
        quizScores: { 'intro-jung': 85, 'archetypes': 92 },
        totalTime: 3600,
        lastAccessed: Date.now(),
        notes: []
      };

      window.localStorage.setItem('jungAppUserProgress', JSON.stringify(userProgress));
      
      const loaded = loadUserProgress();
      
      expect(loaded).not.toBeNull();
      expect(loaded?.completedModules).toHaveLength(2);
      expect(loaded?.quizScores['intro-jung']).toBe(85);
      expect(loaded?.quizScores['archetypes']).toBe(92);
    });

    it('should return null when no data exists', () => {
      const loaded = loadUserProgress();
      expect(loaded).toBeNull();
    });

    it('should handle JSON parse errors', () => {
      // Set invalid JSON in localStorage
      (localStorageMock as any).__store['jungAppUserProgress'] = 'invalid json';
      
      const loaded = loadUserProgress();
      
      expect(loaded).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load user progress:', expect.any(Error));
    });

    it('should handle localStorage errors', () => {
      // Mock getItem to throw an error
      (window.localStorage.getItem as jest.Mock).mockImplementation(() => {
        throw new Error('Storage error');
      });

      const loaded = loadUserProgress();
      
      expect(loaded).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load user progress:', expect.any(Error));
    });
  });

  describe('clearUserProgress', () => {
    it('should clear user progress from localStorage', () => {
      // Set up some data first
      (localStorageMock as any).__store['jungAppUserProgress'] = JSON.stringify({ userId: 'test' });
      
      clearUserProgress();
      
      expect(window.localStorage.getItem('jungAppUserProgress')).toBeNull();
    });

    it('should handle errors gracefully', () => {
      // Mock removeItem to throw an error
      (window.localStorage.removeItem as jest.Mock).mockImplementation(() => {
        throw new Error('Storage error');
      });

      clearUserProgress();
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to clear user progress:', expect.any(Error));
    });
  });

  describe('saveNotes', () => {
    it('should save notes to localStorage', () => {
      const notes: Note[] = [
        {
          id: 'note-1',
          moduleId: 'intro-jung',
          content: 'Test note',
          timestamp: Date.now()
        },
        {
          id: 'note-2',
          moduleId: 'archetypes',
          content: 'Another note',
          timestamp: Date.now()
        }
      ];

      saveNotes(notes);
      
      const saved = window.localStorage.getItem('jungAppNotes');
      expect(saved).toBeTruthy();
      
      const parsed = JSON.parse(saved!);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].content).toBe('Test note');
    });

    it('should handle errors gracefully', () => {
      // Mock setItem to throw an error
      (window.localStorage.setItem as jest.Mock).mockImplementation(() => {
        throw new Error('Storage error');
      });

      saveNotes([]);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to save notes:', expect.any(Error));
    });
  });

  describe('loadNotes', () => {
    it('should load notes from localStorage', () => {
      const notes: Note[] = [
        {
          id: 'note-1',
          moduleId: 'intro-jung',
          content: 'Test note',
          timestamp: Date.now()
        }
      ];

      window.localStorage.setItem('jungAppNotes', JSON.stringify(notes));
      
      const loaded = loadNotes();
      
      expect(loaded).toHaveLength(1);
      expect(loaded[0].content).toBe('Test note');
    });

    it('should return empty array when no notes exist', () => {
      const loaded = loadNotes();
      expect(loaded).toEqual([]);
    });

    it('should handle JSON parse errors', () => {
      // Set invalid JSON in localStorage
      (localStorageMock as any).__store['jungAppNotes'] = 'invalid json';
      
      const loaded = loadNotes();
      
      expect(loaded).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load notes:', expect.any(Error));
    });

    it('should handle localStorage errors', () => {
      // Mock getItem to throw an error
      (window.localStorage.getItem as jest.Mock).mockImplementation(() => {
        throw new Error('Storage error');
      });

      const loaded = loadNotes();
      
      expect(loaded).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load notes:', expect.any(Error));
    });
  });

  describe('saveModuleProgress', () => {
    it('should save module completion', () => {
      saveModuleProgress('intro-jung', true);
      
      const progress = loadUserProgress();
      expect(progress?.completedModules).toContain('intro-jung');
    });

    it('should save quiz score', () => {
      saveModuleProgress('intro-jung', false, 85);
      
      const progress = loadUserProgress();
      expect(progress?.quizScores['intro-jung']).toBe(85);
    });

    it('should save both completion and score', () => {
      saveModuleProgress('intro-jung', true, 90);
      
      const progress = loadUserProgress();
      expect(progress?.completedModules).toContain('intro-jung');
      expect(progress?.quizScores['intro-jung']).toBe(90);
    });

    it('should update existing progress', () => {
      const initialProgress: UserProgress = {
        userId: 'test-user',
        completedModules: ['archetypes'],
        quizScores: { 'archetypes': 88 },
        totalTime: 1000,
        lastAccessed: Date.now() - 1000,
        notes: []
      };

      saveUserProgress(initialProgress);
      saveModuleProgress('intro-jung', true, 92);
      
      const progress = loadUserProgress();
      expect(progress?.completedModules).toHaveLength(2);
      expect(progress?.completedModules).toContain('intro-jung');
      expect(progress?.completedModules).toContain('archetypes');
      expect(progress?.quizScores['intro-jung']).toBe(92);
    });

    it('should not duplicate completed modules', () => {
      saveModuleProgress('intro-jung', true);
      saveModuleProgress('intro-jung', true);
      
      const progress = loadUserProgress();
      expect(progress?.completedModules.filter(m => m === 'intro-jung')).toHaveLength(1);
    });

    it('should handle errors gracefully', () => {
      // Mock getItem to throw an error during loadUserProgress
      (window.localStorage.getItem as jest.Mock).mockImplementation(() => {
        throw new Error('Storage error');
      });

      saveModuleProgress('intro-jung', true);
      
      // Since saveModuleProgress calls loadUserProgress, and loadUserProgress handles its own errors,
      // the error message will be from loadUserProgress
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load user progress:', expect.any(Error));
    });
  });

  describe('loadModuleProgress', () => {
    it('should load module progress', () => {
      const userProgress: UserProgress = {
        userId: 'test-user',
        completedModules: ['intro-jung'],
        quizScores: { 'intro-jung': 88 },
        totalTime: 1000,
        lastAccessed: Date.now(),
        notes: []
      };

      saveUserProgress(userProgress);
      
      const progress = loadModuleProgress('intro-jung');
      
      expect(progress.completed).toBe(true);
      expect(progress.score).toBe(88);
    });

    it('should return false for uncompleted modules', () => {
      const userProgress: UserProgress = {
        userId: 'test-user',
        completedModules: ['archetypes'],
        quizScores: {},
        totalTime: 0,
        lastAccessed: Date.now(),
        notes: []
      };

      saveUserProgress(userProgress);
      
      const progress = loadModuleProgress('intro-jung');
      
      expect(progress.completed).toBe(false);
      expect(progress.score).toBeUndefined();
    });

    it('should return false when no user progress exists', () => {
      const progress = loadModuleProgress('intro-jung');
      
      expect(progress.completed).toBe(false);
      expect(progress.score).toBeUndefined();
    });

    it('should handle errors gracefully', () => {
      // Mock getItem to throw an error
      (window.localStorage.getItem as jest.Mock).mockImplementation(() => {
        throw new Error('Storage error');
      });

      const progress = loadModuleProgress('intro-jung');
      
      expect(progress.completed).toBe(false);
      // Since loadModuleProgress calls loadUserProgress, and loadUserProgress handles its own errors,
      // the error message will be from loadUserProgress
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load user progress:', expect.any(Error));
    });
  });
});