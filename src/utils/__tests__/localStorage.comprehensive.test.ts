import {
  saveUserProgress,
  loadUserProgress,
  clearUserProgress,
  saveNotes,
  loadNotes,
  saveModuleProgress,
  loadModuleProgress
} from '../localStorage';
import { UserProgress, Note } from '../../types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  
  return {
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
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('localStorage utilities', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe('saveUserProgress', () => {
    it('should save user progress to localStorage', () => {
      const progress: UserProgress = {
        userId: 'user123',
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
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      const progress: UserProgress = {
        userId: 'user123',
        completedModules: [],
        quizScores: {},
        totalTime: 0,
        lastAccessed: Date.now(),
        notes: []
      };

      expect(() => saveUserProgress(progress)).not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to save user progress:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('loadUserProgress', () => {
    it('should load user progress from localStorage', () => {
      const progress: UserProgress = {
        userId: 'user123',
        completedModules: ['module1'],
        quizScores: { module1: 85 },
        totalTime: 1800,
        lastAccessed: Date.now(),
        notes: []
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(progress));

      const result = loadUserProgress();

      expect(result).toEqual(progress);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('jungAppUserProgress');
    });

    it('should return null when no progress is stored', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = loadUserProgress();

      expect(result).toBeNull();
    });

    it('should handle invalid JSON gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      localStorageMock.getItem.mockReturnValue('invalid json');

      const result = loadUserProgress();

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load user progress:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should handle localStorage errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });

      const result = loadUserProgress();

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load user progress:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('clearUserProgress', () => {
    it('should remove user progress from localStorage', () => {
      clearUserProgress();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('jungAppUserProgress');
    });

    it('should handle localStorage errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });

      expect(() => clearUserProgress()).not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to clear user progress:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('saveNotes', () => {
    it('should save notes to localStorage', () => {
      const notes: Note[] = [
        {
          id: 'note1',
          moduleId: 'module1',
          content: 'Important note',
          timestamp: Date.now(),
          tags: ['important']
        },
        {
          id: 'note2',
          moduleId: 'module1',
          content: 'Another note',
          timestamp: Date.now(),
          tags: []
        }
      ];

      saveNotes(notes);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'jungAppNotes',
        JSON.stringify(notes)
      );
    });

    it('should handle empty notes array', () => {
      const notes: Note[] = [];

      saveNotes(notes);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'jungAppNotes',
        JSON.stringify(notes)
      );
    });

    it('should handle localStorage errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      const notes: Note[] = [
        {
          id: 'note1',
          moduleId: 'module1',
          content: 'Test note',
          timestamp: Date.now(),
          tags: []
        }
      ];

      expect(() => saveNotes(notes)).not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to save notes:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('loadNotes', () => {
    it('should load notes from localStorage', () => {
      const notes: Note[] = [
        {
          id: 'note1',
          moduleId: 'module1',
          content: 'Test note',
          timestamp: Date.now(),
          tags: ['test']
        }
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(notes));

      const result = loadNotes();

      expect(result).toEqual(notes);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('jungAppNotes');
    });

    it('should return empty array when no notes are stored', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = loadNotes();

      expect(result).toEqual([]);
    });

    it('should handle invalid JSON gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      localStorageMock.getItem.mockReturnValue('invalid json');

      const result = loadNotes();

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load notes:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('saveModuleProgress', () => {
    it('should save module completion progress', () => {
      const initialProgress: UserProgress = {
        userId: 'user123',
        completedModules: ['module1'],
        quizScores: {},
        totalTime: 0,
        lastAccessed: Date.now() - 1000,
        notes: []
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(initialProgress));

      saveModuleProgress('module2', true, 88);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'jungAppUserProgress',
        expect.stringContaining('module2')
      );

      // Verify the saved data contains the new module
      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedData.completedModules).toContain('module2');
      expect(savedData.quizScores.module2).toBe(88);
      expect(savedData.lastAccessed).toBeGreaterThan(initialProgress.lastAccessed);
    });

    it('should create new progress when none exists', () => {
      localStorageMock.getItem.mockReturnValue(null);

      saveModuleProgress('module1', true, 95);

      expect(localStorageMock.setItem).toHaveBeenCalled();

      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedData.userId).toBe('default-user');
      expect(savedData.completedModules).toContain('module1');
      expect(savedData.quizScores.module1).toBe(95);
    });

    it('should not duplicate completed modules', () => {
      const initialProgress: UserProgress = {
        userId: 'user123',
        completedModules: ['module1'],
        quizScores: { module1: 80 },
        totalTime: 0,
        lastAccessed: Date.now(),
        notes: []
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(initialProgress));

      saveModuleProgress('module1', true, 90);

      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedData.completedModules.filter((id: string) => id === 'module1')).toHaveLength(1);
      expect(savedData.quizScores.module1).toBe(90);
    });

    it('should handle score updates without completion', () => {
      const initialProgress: UserProgress = {
        userId: 'user123',
        completedModules: [],
        quizScores: {},
        totalTime: 0,
        lastAccessed: Date.now(),
        notes: []
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(initialProgress));

      saveModuleProgress('module1', false, 75);

      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedData.completedModules).not.toContain('module1');
      expect(savedData.quizScores.module1).toBe(75);
    });
  });

  describe('loadModuleProgress', () => {
    it('should load module progress correctly', () => {
      const progress: UserProgress = {
        userId: 'user123',
        completedModules: ['module1', 'module3'],
        quizScores: { module1: 85, module2: 92, module3: 78 },
        totalTime: 0,
        lastAccessed: Date.now(),
        notes: []
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(progress));

      const result1 = loadModuleProgress('module1');
      expect(result1).toEqual({ completed: true, score: 85 });

      const result2 = loadModuleProgress('module2');
      expect(result2).toEqual({ completed: false, score: 92 });

      const result3 = loadModuleProgress('module4');
      expect(result3).toEqual({ completed: false });
    });

    it('should return default values when no progress exists', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = loadModuleProgress('module1');

      expect(result).toEqual({ completed: false });
    });

    it('should handle errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const result = loadModuleProgress('module1');

      expect(result).toEqual({ completed: false });
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load module progress:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('edge cases and error scenarios', () => {
    it('should handle undefined module ID in saveModuleProgress', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // @ts-expect-error Testing undefined behavior
      saveModuleProgress(undefined, true);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should handle corrupted progress data', () => {
      localStorageMock.getItem.mockReturnValue('{"completedModules": "not an array"}');

      const result = loadModuleProgress('module1');

      expect(result).toEqual({ completed: false });
    });

    it('should handle very large notes arrays', () => {
      const largeNotes: Note[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `note${i}`,
        moduleId: 'module1',
        content: `Note content ${i}`.repeat(100),
        timestamp: Date.now() + i,
        tags: [`tag${i % 10}`]
      }));

      expect(() => saveNotes(largeNotes)).not.toThrow();
    });

    it('should handle progress with missing fields', () => {
      const incompleteProgress = {
        userId: 'user123',
        completedModules: ['module1']
        // Missing other required fields
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(incompleteProgress));

      const result = loadModuleProgress('module1');
      expect(result.completed).toBe(true);
    });
  });
});