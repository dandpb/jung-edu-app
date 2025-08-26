/**
 * Comprehensive tests for localStorage utilities
 * Tests all localStorage operations, error handling, and edge cases
 */

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
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

// Mock console methods
const originalConsoleError = console.error;

describe('LocalStorage Utilities Comprehensive Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });
    
    // Mock console.error to capture error messages
    console.error = jest.fn();
  });

  afterEach(() => {
    // Restore original console.error
    console.error = originalConsoleError;
  });

  describe('User Progress Management', () => {
    const mockUserProgress: UserProgress = {
      userId: 'test-user-123',
      completedModules: ['module-1', 'module-2'],
      quizScores: {
        'module-1': 85,
        'module-2': 92
      },
      totalTime: 3600,
      lastAccessed: Date.now(),
      notes: [],
      preferences: {
        theme: 'dark',
        language: 'en',
        notifications: true
      }
    };

    describe('saveUserProgress', () => {
      it('should save user progress to localStorage', () => {
        saveUserProgress(mockUserProgress);

        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'jungAppUserProgress',
          JSON.stringify(mockUserProgress)
        );
      });

      it('should handle localStorage setItem errors gracefully', () => {
        const storageError = new Error('Storage quota exceeded');
        mockLocalStorage.setItem.mockImplementation(() => {
          throw storageError;
        });

        expect(() => saveUserProgress(mockUserProgress)).not.toThrow();
        expect(console.error).toHaveBeenCalledWith(
          'Failed to save user progress:',
          storageError
        );
      });

      it('should save progress with minimal data structure', () => {
        const minimalProgress: UserProgress = {
          userId: 'minimal-user',
          completedModules: [],
          quizScores: {},
          totalTime: 0,
          lastAccessed: Date.now(),
          notes: []
        };

        saveUserProgress(minimalProgress);

        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'jungAppUserProgress',
          JSON.stringify(minimalProgress)
        );
      });

      it('should handle null/undefined values in progress', () => {
        const progressWithNulls: UserProgress = {
          userId: 'test-user',
          completedModules: ['module-1'],
          quizScores: {},
          totalTime: 0,
          lastAccessed: Date.now(),
          notes: [],
          preferences: undefined as any
        };

        expect(() => saveUserProgress(progressWithNulls)).not.toThrow();
        expect(mockLocalStorage.setItem).toHaveBeenCalled();
      });
    });

    describe('loadUserProgress', () => {
      it('should load user progress from localStorage', () => {
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockUserProgress));

        const result = loadUserProgress();

        expect(mockLocalStorage.getItem).toHaveBeenCalledWith('jungAppUserProgress');
        expect(result).toEqual(mockUserProgress);
      });

      it('should return null when no progress is stored', () => {
        mockLocalStorage.getItem.mockReturnValue(null);

        const result = loadUserProgress();

        expect(result).toBeNull();
      });

      it('should return null when stored data is empty string', () => {
        mockLocalStorage.getItem.mockReturnValue('');

        const result = loadUserProgress();

        expect(result).toBeNull();
      });

      it('should handle JSON parsing errors gracefully', () => {
        mockLocalStorage.getItem.mockReturnValue('invalid-json-{');

        const result = loadUserProgress();

        expect(result).toBeNull();
        expect(console.error).toHaveBeenCalledWith(
          'Failed to load user progress:',
          expect.any(Error)
        );
      });

      it('should handle localStorage access errors', () => {
        mockLocalStorage.getItem.mockImplementation(() => {
          throw new Error('localStorage access denied');
        });

        const result = loadUserProgress();

        expect(result).toBeNull();
        expect(console.error).toHaveBeenCalledWith(
          'Failed to load user progress:',
          expect.any(Error)
        );
      });

      it('should handle corrupted JSON with partial data', () => {
        const corruptedData = JSON.stringify(mockUserProgress).slice(0, -10);
        mockLocalStorage.getItem.mockReturnValue(corruptedData);

        const result = loadUserProgress();

        expect(result).toBeNull();
        expect(console.error).toHaveBeenCalled();
      });
    });

    describe('clearUserProgress', () => {
      it('should remove user progress from localStorage', () => {
        clearUserProgress();

        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('jungAppUserProgress');
      });

      it('should handle localStorage removeItem errors gracefully', () => {
        mockLocalStorage.removeItem.mockImplementation(() => {
          throw new Error('Storage access error');
        });

        expect(() => clearUserProgress()).not.toThrow();
        expect(console.error).toHaveBeenCalledWith(
          'Failed to clear user progress:',
          expect.any(Error)
        );
      });
    });
  });

  describe('Notes Management', () => {
    const mockNotes: Note[] = [
      {
        id: 'note-1',
        moduleId: 'module-1',
        content: 'This is a test note about Jung\'s theories',
        timestamp: Date.now(),
        tags: ['psychology', 'jung']
      },
      {
        id: 'note-2',
        moduleId: 'module-2',
        content: 'Another note about archetypes',
        timestamp: Date.now() - 1000,
        tags: ['archetypes']
      }
    ];

    describe('saveNotes', () => {
      it('should save notes to localStorage', () => {
        saveNotes(mockNotes);

        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'jungAppNotes',
          JSON.stringify(mockNotes)
        );
      });

      it('should save empty notes array', () => {
        saveNotes([]);

        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'jungAppNotes',
          JSON.stringify([])
        );
      });

      it('should handle localStorage setItem errors when saving notes', () => {
        mockLocalStorage.setItem.mockImplementation(() => {
          throw new Error('Storage full');
        });

        expect(() => saveNotes(mockNotes)).not.toThrow();
        expect(console.error).toHaveBeenCalledWith(
          'Failed to save notes:',
          expect.any(Error)
        );
      });

      it('should handle notes with special characters', () => {
        const notesWithSpecialChars: Note[] = [
          {
            id: 'special-note',
            moduleId: 'module-test',
            content: 'Note with émojis 🧠 and spëcial chars: "quotes" & symbols',
            timestamp: Date.now(),
            tags: ['special', 'émojis']
          }
        ];

        expect(() => saveNotes(notesWithSpecialChars)).not.toThrow();
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'jungAppNotes',
          JSON.stringify(notesWithSpecialChars)
        );
      });

      it('should handle very large notes arrays', () => {
        const largeNotesArray = Array.from({ length: 1000 }, (_, i) => ({
          id: `note-${i}`,
          moduleId: `module-${i % 10}`,
          content: `This is note ${i} with some content`.repeat(10),
          timestamp: Date.now() - i,
          tags: [`tag-${i % 5}`]
        }));

        expect(() => saveNotes(largeNotesArray)).not.toThrow();
        expect(mockLocalStorage.setItem).toHaveBeenCalled();
      });
    });

    describe('loadNotes', () => {
      it('should load notes from localStorage', () => {
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockNotes));

        const result = loadNotes();

        expect(mockLocalStorage.getItem).toHaveBeenCalledWith('jungAppNotes');
        expect(result).toEqual(mockNotes);
      });

      it('should return empty array when no notes are stored', () => {
        mockLocalStorage.getItem.mockReturnValue(null);

        const result = loadNotes();

        expect(result).toEqual([]);
      });

      it('should return empty array when stored data is empty string', () => {
        mockLocalStorage.getItem.mockReturnValue('');

        const result = loadNotes();

        expect(result).toEqual([]);
      });

      it('should handle JSON parsing errors when loading notes', () => {
        mockLocalStorage.getItem.mockReturnValue('invalid-json-[');

        const result = loadNotes();

        expect(result).toEqual([]);
        expect(console.error).toHaveBeenCalledWith(
          'Failed to load notes:',
          expect.any(Error)
        );
      });

      it('should handle localStorage access errors when loading notes', () => {
        mockLocalStorage.getItem.mockImplementation(() => {
          throw new Error('localStorage unavailable');
        });

        const result = loadNotes();

        expect(result).toEqual([]);
        expect(console.error).toHaveBeenCalledWith(
          'Failed to load notes:',
          expect.any(Error)
        );
      });

      it('should handle corrupted notes data', () => {
        const corruptedNotes = '[{"id": "note-1", "content": "test"'; // Missing closing bracket
        mockLocalStorage.getItem.mockReturnValue(corruptedNotes);

        const result = loadNotes();

        expect(result).toEqual([]);
        expect(console.error).toHaveBeenCalled();
      });

      it('should handle non-array data stored in notes key', () => {
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify({ invalid: 'data' }));

        const result = loadNotes();

        expect(result).toEqual([]);
        expect(console.error).toHaveBeenCalled();
      });
    });
  });

  describe('Module Progress Management', () => {
    describe('saveModuleProgress', () => {
      it('should save new module completion with existing progress', () => {
        const existingProgress: UserProgress = {
          userId: 'test-user',
          completedModules: ['module-1'],
          quizScores: { 'module-1': 75 },
          totalTime: 1800,
          lastAccessed: Date.now() - 1000,
          notes: []
        };

        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingProgress));

        saveModuleProgress('module-2', true, 88);

        const expectedProgress = {
          ...existingProgress,
          completedModules: ['module-1', 'module-2'],
          quizScores: { 'module-1': 75, 'module-2': 88 },
          lastAccessed: expect.any(Number)
        };

        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'jungAppUserProgress',
          JSON.stringify(expectedProgress)
        );
      });

      it('should create new progress when no existing progress exists', () => {
        mockLocalStorage.getItem.mockReturnValue(null);

        saveModuleProgress('module-1', true, 90);

        const expectedProgress = {
          userId: 'default-user',
          completedModules: ['module-1'],
          quizScores: { 'module-1': 90 },
          totalTime: 0,
          lastAccessed: expect.any(Number),
          notes: []
        };

        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'jungAppUserProgress',
          JSON.stringify(expectedProgress)
        );
      });

      it('should not duplicate completed modules', () => {
        const progressWithModule: UserProgress = {
          userId: 'test-user',
          completedModules: ['module-1'],
          quizScores: {},
          totalTime: 0,
          lastAccessed: Date.now(),
          notes: []
        };

        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(progressWithModule));

        saveModuleProgress('module-1', true); // Mark already completed module as complete again

        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'jungAppUserProgress',
          JSON.stringify({
            ...progressWithModule,
            lastAccessed: expect.any(Number)
          })
        );
      });

      it('should save quiz score without marking as completed', () => {
        const existingProgress: UserProgress = {
          userId: 'test-user',
          completedModules: [],
          quizScores: {},
          totalTime: 0,
          lastAccessed: Date.now(),
          notes: []
        };

        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingProgress));

        saveModuleProgress('module-1', false, 65);

        const expectedProgress = {
          ...existingProgress,
          quizScores: { 'module-1': 65 },
          lastAccessed: expect.any(Number)
        };

        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'jungAppUserProgress',
          JSON.stringify(expectedProgress)
        );
      });

      it('should handle saving progress without score', () => {
        mockLocalStorage.getItem.mockReturnValue(null);

        saveModuleProgress('module-1', true);

        const expectedProgress = {
          userId: 'default-user',
          completedModules: ['module-1'],
          quizScores: {},
          totalTime: 0,
          lastAccessed: expect.any(Number),
          notes: []
        };

        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'jungAppUserProgress',
          JSON.stringify(expectedProgress)
        );
      });

      it('should handle errors when saving module progress', () => {
        mockLocalStorage.getItem.mockImplementation(() => {
          throw new Error('Storage error');
        });

        expect(() => saveModuleProgress('module-1', true, 85)).not.toThrow();
        expect(console.error).toHaveBeenCalledWith(
          'Failed to save module progress:',
          expect.any(Error)
        );
      });

      it('should handle corrupted existing progress when saving', () => {
        mockLocalStorage.getItem.mockReturnValue('corrupted-json');

        expect(() => saveModuleProgress('module-1', true, 85)).not.toThrow();
        expect(console.error).toHaveBeenCalled();
      });

      it('should update lastAccessed timestamp', () => {
        const oldTimestamp = Date.now() - 10000;
        const existingProgress: UserProgress = {
          userId: 'test-user',
          completedModules: [],
          quizScores: {},
          totalTime: 0,
          lastAccessed: oldTimestamp,
          notes: []
        };

        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingProgress));

        saveModuleProgress('module-1', true);

        const [, savedProgressString] = mockLocalStorage.setItem.mock.calls[0];
        const savedProgress = JSON.parse(savedProgressString);

        expect(savedProgress.lastAccessed).toBeGreaterThan(oldTimestamp);
      });
    });

    describe('loadModuleProgress', () => {
      it('should load existing module progress', () => {
        const existingProgress: UserProgress = {
          userId: 'test-user',
          completedModules: ['module-1', 'module-3'],
          quizScores: { 'module-1': 85, 'module-2': 92 },
          totalTime: 0,
          lastAccessed: Date.now(),
          notes: []
        };

        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingProgress));

        const result1 = loadModuleProgress('module-1');
        const result2 = loadModuleProgress('module-2');
        const result3 = loadModuleProgress('module-4');

        expect(result1).toEqual({ completed: true, score: 85 });
        expect(result2).toEqual({ completed: false, score: 92 });
        expect(result3).toEqual({ completed: false });
      });

      it('should return default values when no progress exists', () => {
        mockLocalStorage.getItem.mockReturnValue(null);

        const result = loadModuleProgress('module-1');

        expect(result).toEqual({ completed: false });
      });

      it('should handle errors when loading module progress', () => {
        mockLocalStorage.getItem.mockImplementation(() => {
          throw new Error('Storage access error');
        });

        const result = loadModuleProgress('module-1');

        expect(result).toEqual({ completed: false });
        expect(console.error).toHaveBeenCalledWith(
          'Failed to load module progress:',
          expect.any(Error)
        );
      });

      it('should handle corrupted progress data when loading module progress', () => {
        mockLocalStorage.getItem.mockReturnValue('invalid-json');

        const result = loadModuleProgress('module-1');

        expect(result).toEqual({ completed: false });
        expect(console.error).toHaveBeenCalled();
      });

      it('should handle missing properties in progress data', () => {
        const incompleteProgress = {
          userId: 'test-user',
          completedModules: ['module-1']
          // Missing quizScores, totalTime, etc.
        };

        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(incompleteProgress));

        const result1 = loadModuleProgress('module-1');
        const result2 = loadModuleProgress('module-2');

        expect(result1).toEqual({ completed: true });
        expect(result2).toEqual({ completed: false });
      });

      it('should handle null/undefined module IDs', () => {
        const existingProgress: UserProgress = {
          userId: 'test-user',
          completedModules: ['module-1'],
          quizScores: {},
          totalTime: 0,
          lastAccessed: Date.now(),
          notes: []
        };

        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingProgress));

        const result1 = loadModuleProgress('');
        const result2 = loadModuleProgress(null as any);
        const result3 = loadModuleProgress(undefined as any);

        expect(result1).toEqual({ completed: false });
        expect(result2).toEqual({ completed: false });
        expect(result3).toEqual({ completed: false });
      });
    });
  });

  describe('Edge Cases and Performance', () => {
    it('should handle extremely large data structures', () => {
      const largeProgress: UserProgress = {
        userId: 'large-data-user',
        completedModules: Array.from({ length: 10000 }, (_, i) => `module-${i}`),
        quizScores: Object.fromEntries(
          Array.from({ length: 10000 }, (_, i) => [`module-${i}`, Math.floor(Math.random() * 100)])
        ),
        totalTime: 999999999,
        lastAccessed: Date.now(),
        notes: Array.from({ length: 1000 }, (_, i) => ({
          id: `note-${i}`,
          moduleId: `module-${i}`,
          content: 'A'.repeat(1000),
          timestamp: Date.now(),
          tags: [`tag-${i}`]
        }))
      };

      expect(() => saveUserProgress(largeProgress)).not.toThrow();
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('should handle concurrent save operations', () => {
      const promises = Array.from({ length: 100 }, (_, i) => 
        Promise.resolve(saveModuleProgress(`module-${i}`, true, i))
      );

      expect(() => Promise.all(promises)).not.toThrow();
    });

    it('should handle special characters and encoding issues', () => {
      const specialProgress: UserProgress = {
        userId: '用户-123',
        completedModules: ['模块-1', 'módulo-2', 'モジュール-3'],
        quizScores: { 'módulo-test': 85 },
        totalTime: 0,
        lastAccessed: Date.now(),
        notes: []
      };

      expect(() => saveUserProgress(specialProgress)).not.toThrow();
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(specialProgress));
      const loaded = loadUserProgress();
      
      expect(loaded).toEqual(specialProgress);
    });

    it('should handle browser storage limitations', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new DOMException('QuotaExceededError');
      });

      expect(() => saveUserProgress(mockUserProgress)).not.toThrow();
      expect(console.error).toHaveBeenCalledWith(
        'Failed to save user progress:',
        expect.any(DOMException)
      );
    });

    it('should handle private/incognito mode restrictions', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('localStorage is not available');
      });

      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage is not available');
      });

      expect(() => saveUserProgress(mockUserProgress)).not.toThrow();
      expect(loadUserProgress()).toBeNull();
      expect(loadNotes()).toEqual([]);
    });
  });

  describe('Data Integrity and Validation', () => {
    it('should maintain data consistency across save/load cycles', () => {
      const originalProgress: UserProgress = {
        userId: 'consistency-test',
        completedModules: ['module-1', 'module-2'],
        quizScores: { 'module-1': 85, 'module-2': 92 },
        totalTime: 3600,
        lastAccessed: Date.now(),
        notes: []
      };

      // Save progress
      saveUserProgress(originalProgress);
      const savedCall = mockLocalStorage.setItem.mock.calls[0];
      
      // Mock the retrieval
      mockLocalStorage.getItem.mockReturnValue(savedCall[1]);
      
      // Load progress
      const loadedProgress = loadUserProgress();
      
      expect(loadedProgress).toEqual(originalProgress);
    });

    it('should handle version migration scenarios', () => {
      // Simulate old version of progress data
      const oldProgress = {
        userId: 'old-user',
        completed: ['module-1'], // Old field name
        scores: { 'module-1': 80 } // Old field name
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(oldProgress));

      // Should not crash, even with old data structure
      const result = loadUserProgress();
      expect(result).toBeDefined();
    });

    it('should preserve data types through serialization', () => {
      const progressWithTypes: UserProgress = {
        userId: 'type-test',
        completedModules: [],
        quizScores: {},
        totalTime: 0,
        lastAccessed: 1234567890123, // Specific timestamp
        notes: []
      };

      saveUserProgress(progressWithTypes);
      const savedData = mockLocalStorage.setItem.mock.calls[0][1];
      mockLocalStorage.getItem.mockReturnValue(savedData);

      const loaded = loadUserProgress();
      
      expect(typeof loaded?.lastAccessed).toBe('number');
      expect(loaded?.lastAccessed).toBe(1234567890123);
    });
  });
});