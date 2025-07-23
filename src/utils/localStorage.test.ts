import {
  saveUserProgress,
  loadUserProgress,
  clearUserProgress,
  saveNotes,
  loadNotes,
  saveModuleProgress,
  loadModuleProgress
} from './localStorage';
import { UserProgress, Note } from '../types';

describe('localStorage utilities', () => {
  // Mock localStorage
  let store: Record<string, string> = {};
  
  const localStorageMock = {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };

  // Create a mock for console.error
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Clear store
    store = {};
    
    // Clear all mocks
    jest.clearAllMocks();
    
    // Mock console.error for each test
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Reset mock implementations to default behavior
    localStorageMock.getItem.mockImplementation((key: string) => store[key] || null);
    localStorageMock.setItem.mockImplementation((key: string, value: string) => {
      store[key] = value;
    });
    localStorageMock.removeItem.mockImplementation((key: string) => {
      delete store[key];
    });
    
    // Set up localStorage mock
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true
    });
  });

  afterEach(() => {
    // Restore console.error after each test
    consoleErrorSpy.mockRestore();
  });

  describe('saveUserProgress', () => {
    it('should save user progress to localStorage', () => {
      const progress: UserProgress = {
        userId: 'test-user',
        completedModules: ['module1', 'module2'],
        quizScores: { module1: 85, module2: 92 },
        totalTime: 3600,
        lastAccessed: Date.now(),
        notes: []
      };

      saveUserProgress(progress);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'jungAppUserProgress',
        JSON.stringify(progress)
      );
    });

    it('should handle localStorage errors gracefully', () => {
      const progress: UserProgress = {
        userId: 'test-user',
        completedModules: [],
        quizScores: {},
        totalTime: 0,
        lastAccessed: Date.now(),
        notes: []
      };

      // Override the mock to throw an error
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      saveUserProgress(progress);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to save user progress:',
        expect.any(Error)
      );
    });
  });

  describe('loadUserProgress', () => {
    it('should load user progress from localStorage', () => {
      const progress: UserProgress = {
        userId: 'test-user',
        completedModules: ['module1'],
        quizScores: { module1: 88 },
        totalTime: 1800,
        lastAccessed: Date.now(),
        notes: []
      };

      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(progress));

      const loaded = loadUserProgress();

      expect(loaded).toEqual(progress);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('jungAppUserProgress');
    });

    it('should return null if no progress exists', () => {
      localStorageMock.getItem.mockReturnValueOnce(null);

      const loaded = loadUserProgress();

      expect(loaded).toBeNull();
    });

    it('should handle invalid JSON gracefully', () => {
      localStorageMock.getItem.mockReturnValueOnce('invalid json');

      const loaded = loadUserProgress();

      expect(loaded).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to load user progress:',
        expect.any(Error)
      );
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage access denied');
      });

      const loaded = loadUserProgress();

      expect(loaded).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('clearUserProgress', () => {
    it('should remove user progress from localStorage', () => {
      clearUserProgress();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('jungAppUserProgress');
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('Storage access denied');
      });

      clearUserProgress();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to clear user progress:',
        expect.any(Error)
      );
    });
  });

  describe('saveNotes', () => {
    it('should save notes to localStorage', () => {
      const notes: Note[] = [
        {
          id: 'note1',
          moduleId: 'module1',
          content: 'Test note 1',
          timestamp: Date.now()
        },
        {
          id: 'note2',
          moduleId: 'module2',
          content: 'Test note 2',
          timestamp: Date.now()
        }
      ];

      saveNotes(notes);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'jungAppNotes',
        JSON.stringify(notes)
      );
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      saveNotes([]);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to save notes:',
        expect.any(Error)
      );
    });
  });

  describe('loadNotes', () => {
    it('should load notes from localStorage', () => {
      const notes: Note[] = [
        {
          id: 'note1',
          moduleId: 'module1',
          content: 'Loaded note',
          timestamp: Date.now()
        }
      ];

      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(notes));

      const loaded = loadNotes();

      expect(loaded).toEqual(notes);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('jungAppNotes');
    });

    it('should return empty array if no notes exist', () => {
      localStorageMock.getItem.mockReturnValueOnce(null);

      const loaded = loadNotes();

      expect(loaded).toEqual([]);
    });

    it('should handle invalid JSON gracefully', () => {
      localStorageMock.getItem.mockReturnValueOnce('invalid json');

      const loaded = loadNotes();

      expect(loaded).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('saveModuleProgress', () => {
    it('should save module completion', () => {
      saveModuleProgress('module1', true);

      const savedData = localStorageMock.setItem.mock.calls[0][1];
      const progress = JSON.parse(savedData);

      expect(progress.completedModules).toContain('module1');
    });

    it('should save module score', () => {
      saveModuleProgress('module1', false, 95);

      const savedData = localStorageMock.setItem.mock.calls[0][1];
      const progress = JSON.parse(savedData);

      expect(progress.quizScores.module1).toBe(95);
    });

    it('should save both completion and score', () => {
      saveModuleProgress('module1', true, 90);

      const savedData = localStorageMock.setItem.mock.calls[0][1];
      const progress = JSON.parse(savedData);

      expect(progress.completedModules).toContain('module1');
      expect(progress.quizScores.module1).toBe(90);
    });

    it('should not duplicate completed modules', () => {
      const existingProgress: UserProgress = {
        userId: 'test-user',
        completedModules: ['module1'],
        quizScores: {},
        totalTime: 0,
        lastAccessed: Date.now(),
        notes: []
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingProgress));

      saveModuleProgress('module1', true);

      const savedData = localStorageMock.setItem.mock.calls[0][1];
      const progress = JSON.parse(savedData);

      expect(progress.completedModules.filter((m: string) => m === 'module1')).toHaveLength(1);
    });

    it('should handle errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      saveModuleProgress('module1', true, 85);

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should update lastAccessed timestamp', () => {
      const now = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(now);

      saveModuleProgress('module1', true);

      const savedData = localStorageMock.setItem.mock.calls[0][1];
      const progress = JSON.parse(savedData);

      expect(progress.lastAccessed).toBe(now);

      jest.restoreAllMocks();
    });
  });

  describe('loadModuleProgress', () => {
    it('should load module completion status', () => {
      const progress: UserProgress = {
        userId: 'test-user',
        completedModules: ['module1', 'module2'],
        quizScores: { module1: 85 },
        totalTime: 0,
        lastAccessed: Date.now(),
        notes: []
      };

      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(progress));

      const result = loadModuleProgress('module1');

      expect(result.completed).toBe(true);
      expect(result.score).toBe(85);
    });

    it('should return false for uncompleted modules', () => {
      const progress: UserProgress = {
        userId: 'test-user',
        completedModules: ['module1'],
        quizScores: {},
        totalTime: 0,
        lastAccessed: Date.now(),
        notes: []
      };

      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(progress));

      const result = loadModuleProgress('module2');

      expect(result.completed).toBe(false);
      expect(result.score).toBeUndefined();
    });

    it('should handle missing progress', () => {
      localStorageMock.getItem.mockReturnValueOnce(null);

      const result = loadModuleProgress('module1');

      expect(result.completed).toBe(false);
      expect(result.score).toBeUndefined();
    });

    it('should handle errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const result = loadModuleProgress('module1');

      expect(result.completed).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });
});