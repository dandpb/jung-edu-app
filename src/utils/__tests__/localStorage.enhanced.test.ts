/**
 * Comprehensive Unit Tests for localStorage.ts
 * Tests: Local storage operations, error handling, data persistence, and validation edge cases
 * Coverage Target: 100%
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
const mockLocalStorage = (() => {
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
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((index: number) => Object.keys(store)[index] || null)
  };
})();

// Replace global localStorage
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

// Mock console.error to test error logging
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('localStorage utilities - Enhanced Test Suite', () => {
  beforeEach(() => {
    // Clear all mocks and storage before each test
    jest.clearAllMocks();
    mockLocalStorage.clear();
    consoleErrorSpy.mockClear();
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('saveUserProgress', () => {
    const mockUserProgress: UserProgress = {
      userId: 'test-user-123',
      completedModules: ['module1', 'module2'],
      quizScores: { quiz1: 85, quiz2: 92 },
      totalTime: 3600,
      lastAccessed: Date.now(),
      notes: []
    };

    it('should save user progress to localStorage successfully', () => {
      saveUserProgress(mockUserProgress);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'jungAppUserProgress',
        JSON.stringify(mockUserProgress)
      );
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should handle large user progress objects', () => {
      const largeProgress = {
        ...mockUserProgress,
        completedModules: Array(1000).fill(0).map((_, i) => `module-${i}`),
        quizScores: Object.fromEntries(Array(500).fill(0).map((_, i) => [`quiz-${i}`, Math.random() * 100])),
        notes: Array(100).fill(0).map((_, i) => ({
          id: `note-${i}`,
          moduleId: `module-${i % 10}`,
          content: `This is test note number ${i}`.repeat(10),
          timestamp: Date.now() - (i * 1000)
        }))
      };

      saveUserProgress(largeProgress);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'jungAppUserProgress',
        JSON.stringify(largeProgress)
      );
    });

    it('should handle progress with special characters and Unicode', () => {
      const progressWithSpecialChars = {
        ...mockUserProgress,
        userId: 'user-🎓-测试-español',
        notes: [{
          id: 'note-1',
          moduleId: 'module-1',
          content: 'Note with émojis 🧠💭 and spëcial chars: åäö',
          timestamp: Date.now()
        }]
      };

      saveUserProgress(progressWithSpecialChars);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'jungAppUserProgress',
        JSON.stringify(progressWithSpecialChars)
      );
    });

    it('should log error when localStorage.setItem throws QuotaExceededError', () => {
      const quotaError = new Error('QuotaExceededError');
      quotaError.name = 'QuotaExceededError';
      mockLocalStorage.setItem.mockImplementation(() => {
        throw quotaError;
      });

      saveUserProgress(mockUserProgress);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to save user progress:', quotaError);
    });

    it('should handle DOMException errors', () => {
      const domException = new DOMException('Storage disabled', 'SecurityError');
      mockLocalStorage.setItem.mockImplementation(() => {
        throw domException;
      });

      saveUserProgress(mockUserProgress);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to save user progress:', domException);
    });

    it('should handle null and undefined progress gracefully', () => {
      saveUserProgress(null as any);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockClear();
      saveUserProgress(undefined as any);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('loadUserProgress', () => {
    const mockUserProgress: UserProgress = {
      userId: 'test-user-456',
      completedModules: ['module3', 'module4'],
      quizScores: { quiz3: 78, quiz4: 95 },
      totalTime: 7200,
      lastAccessed: Date.now(),
      notes: [{
        id: 'note-1',
        moduleId: 'module-3',
        content: 'Test note content',
        timestamp: Date.now()
      }]
    };

    it('should load user progress from localStorage successfully', () => {
      mockLocalStorage.setItem('jungAppUserProgress', JSON.stringify(mockUserProgress));

      const result = loadUserProgress();

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('jungAppUserProgress');
      expect(result).toEqual(mockUserProgress);
    });

    it('should return null when no progress exists', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = loadUserProgress();

      expect(result).toBeNull();
    });

    it('should return null when stored data is empty string', () => {
      mockLocalStorage.getItem.mockReturnValue('');

      const result = loadUserProgress();

      expect(result).toBeNull();
    });

    it('should handle malformed JSON gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue('{"invalid": json malformed}');

      const result = loadUserProgress();

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load user progress:', expect.any(Error));
    });

    it('should handle localStorage.getItem throwing errors', () => {
      const storageError = new Error('Storage access denied');
      mockLocalStorage.getItem.mockImplementation(() => {
        throw storageError;
      });

      const result = loadUserProgress();

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load user progress:', storageError);
    });

    it('should handle corrupted progress data with missing required fields', () => {
      const corruptedData = { userId: 'test', incompletefield: true };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(corruptedData));

      const result = loadUserProgress();

      // Should still return the data even if incomplete (backwards compatibility)
      expect(result).toEqual(corruptedData);
    });

    it('should handle very large stored data', () => {
      const largeProgress = {
        ...mockUserProgress,
        notes: Array(10000).fill(0).map((_, i) => ({
          id: `note-${i}`,
          moduleId: `module-${i % 100}`,
          content: 'Large content '.repeat(100),
          timestamp: Date.now() - i
        }))
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(largeProgress));

      const result = loadUserProgress();

      expect(result).toBeDefined();
      expect(result!.notes).toHaveLength(10000);
    });
  });

  describe('clearUserProgress', () => {
    it('should clear user progress from localStorage', () => {
      clearUserProgress();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('jungAppUserProgress');
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should handle localStorage.removeItem throwing errors', () => {
      const removeError = new Error('Remove operation failed');
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw removeError;
      });

      clearUserProgress();

      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to clear user progress:', removeError);
    });

    it('should handle clearing non-existent data gracefully', () => {
      // localStorage.removeItem typically doesn't throw for non-existent keys
      mockLocalStorage.removeItem.mockImplementation(() => {}); // no-op

      clearUserProgress();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('jungAppUserProgress');
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });

  describe('saveNotes', () => {
    const mockNotes: Note[] = [
      {
        id: 'note-1',
        moduleId: 'module-1',
        content: 'First test note',
        timestamp: Date.now()
      },
      {
        id: 'note-2',
        moduleId: 'module-2',
        content: 'Second test note with special chars: àáâãäå',
        timestamp: Date.now() - 1000,
        tags: ['important', 'review']
      }
    ];

    it('should save notes array to localStorage', () => {
      saveNotes(mockNotes);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'jungAppNotes',
        JSON.stringify(mockNotes)
      );
    });

    it('should handle empty notes array', () => {
      saveNotes([]);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('jungAppNotes', '[]');
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should handle notes with all possible properties', () => {
      const complexNotes: Note[] = [{
        id: 'complex-note',
        moduleId: 'module-complex',
        content: 'Complex note content',
        timestamp: Date.now(),
        tags: ['tag1', 'tag2'],
        type: 'text',
        linkedConcepts: ['concept1', 'concept2'],
        isShared: true,
        parentNoteId: 'parent-note-id'
      }];

      saveNotes(complexNotes);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'jungAppNotes',
        JSON.stringify(complexNotes)
      );
    });

    it('should handle save errors gracefully', () => {
      const saveError = new Error('Notes save failed');
      mockLocalStorage.setItem.mockImplementation(() => {
        throw saveError;
      });

      saveNotes(mockNotes);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to save notes:', saveError);
    });
  });

  describe('loadNotes', () => {
    const mockNotes: Note[] = [
      {
        id: 'loaded-note-1',
        moduleId: 'module-loaded',
        content: 'Loaded note content',
        timestamp: Date.now()
      }
    ];

    it('should load notes from localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockNotes));

      const result = loadNotes();

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('jungAppNotes');
      expect(result).toEqual(mockNotes);
    });

    it('should return empty array when no notes exist', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = loadNotes();

      expect(result).toEqual([]);
    });

    it('should return empty array when stored data is empty', () => {
      mockLocalStorage.getItem.mockReturnValue('');

      const result = loadNotes();

      expect(result).toEqual([]);
    });

    it('should handle malformed JSON in notes', () => {
      mockLocalStorage.getItem.mockReturnValue('[{invalid json}]');

      const result = loadNotes();

      expect(result).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load notes:', expect.any(Error));
    });

    it('should handle storage access errors', () => {
      const accessError = new Error('Storage access denied');
      mockLocalStorage.getItem.mockImplementation(() => {
        throw accessError;
      });

      const result = loadNotes();

      expect(result).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load notes:', accessError);
    });
  });

  describe('saveModuleProgress', () => {
    it('should create new progress when none exists', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      saveModuleProgress('module-new', true, 88);

      const expectedProgress = {
        userId: 'default-user',
        completedModules: ['module-new'],
        quizScores: { 'module-new': 88 },
        totalTime: 0,
        lastAccessed: expect.any(Number),
        notes: []
      };

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'jungAppUserProgress',
        JSON.stringify(expectedProgress)
      );
    });

    it('should update existing progress without duplicating completed modules', () => {
      const existingProgress = {
        userId: 'existing-user',
        completedModules: ['module-1'],
        quizScores: { 'module-1': 75 },
        totalTime: 1800,
        lastAccessed: Date.now() - 1000,
        notes: []
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingProgress));

      saveModuleProgress('module-1', true, 90);

      const expectedProgress = {
        ...existingProgress,
        completedModules: ['module-1'], // Should not duplicate
        quizScores: { 'module-1': 90 }, // Should update score
        lastAccessed: expect.any(Number)
      };

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'jungAppUserProgress',
        JSON.stringify(expectedProgress)
      );
    });

    it('should add new module to existing completed modules', () => {
      const existingProgress = {
        userId: 'existing-user',
        completedModules: ['module-1', 'module-2'],
        quizScores: { 'module-1': 75, 'module-2': 80 },
        totalTime: 3600,
        lastAccessed: Date.now() - 2000,
        notes: []
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingProgress));

      saveModuleProgress('module-3', true, 95);

      const expectedProgress = {
        ...existingProgress,
        completedModules: ['module-1', 'module-2', 'module-3'],
        quizScores: { 'module-1': 75, 'module-2': 80, 'module-3': 95 },
        lastAccessed: expect.any(Number)
      };

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'jungAppUserProgress',
        JSON.stringify(expectedProgress)
      );
    });

    it('should handle saving only score without completion', () => {
      const existingProgress = {
        userId: 'test-user',
        completedModules: [],
        quizScores: {},
        totalTime: 0,
        lastAccessed: Date.now() - 1000,
        notes: []
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingProgress));

      saveModuleProgress('module-score-only', false, 65);

      const expectedProgress = {
        ...existingProgress,
        completedModules: [], // Should remain empty
        quizScores: { 'module-score-only': 65 },
        lastAccessed: expect.any(Number)
      };

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'jungAppUserProgress',
        JSON.stringify(expectedProgress)
      );
    });

    it('should handle saving completion without score', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      saveModuleProgress('module-no-score', true);

      const expectedProgress = {
        userId: 'default-user',
        completedModules: ['module-no-score'],
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

    it('should handle errors during progress loading', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Load failed');
      });

      saveModuleProgress('module-error', true, 50);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to save module progress:', expect.any(Error));
    });

    it('should handle errors during progress saving', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Save failed');
      });

      saveModuleProgress('module-save-error', true, 70);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to save module progress:', expect.any(Error));
    });
  });

  describe('loadModuleProgress', () => {
    it('should return module progress when it exists', () => {
      const existingProgress = {
        userId: 'test-user',
        completedModules: ['module-1', 'module-2'],
        quizScores: { 'module-1': 85, 'module-2': 92 },
        totalTime: 3600,
        lastAccessed: Date.now(),
        notes: []
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingProgress));

      const result = loadModuleProgress('module-2');

      expect(result).toEqual({
        completed: true,
        score: 92
      });
    });

    it('should return default progress when no user progress exists', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = loadModuleProgress('non-existent-module');

      expect(result).toEqual({
        completed: false
      });
    });

    it('should return partial progress when module has score but not completed', () => {
      const existingProgress = {
        userId: 'test-user',
        completedModules: ['module-1'],
        quizScores: { 'module-1': 75, 'module-2': 60 },
        totalTime: 1800,
        lastAccessed: Date.now(),
        notes: []
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingProgress));

      const result = loadModuleProgress('module-2');

      expect(result).toEqual({
        completed: false,
        score: 60
      });
    });

    it('should return completed without score when module is completed but has no score', () => {
      const existingProgress = {
        userId: 'test-user',
        completedModules: ['module-completed'],
        quizScores: {},
        totalTime: 2400,
        lastAccessed: Date.now(),
        notes: []
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingProgress));

      const result = loadModuleProgress('module-completed');

      expect(result).toEqual({
        completed: true
      });
    });

    it('should handle errors and return default progress', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage read error');
      });

      const result = loadModuleProgress('error-module');

      expect(result).toEqual({
        completed: false
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load module progress:', expect.any(Error));
    });

    it('should handle corrupted progress data gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue('{"malformed": "data" without proper structure}');

      const result = loadModuleProgress('any-module');

      expect(result).toEqual({
        completed: false
      });
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('Edge cases and browser compatibility', () => {
    it('should handle private/incognito mode localStorage limitations', () => {
      // Simulate private mode where localStorage.setItem throws
      mockLocalStorage.setItem.mockImplementation(() => {
        const error = new Error('localStorage is not available');
        error.name = 'SecurityError';
        throw error;
      });

      const mockProgress: UserProgress = {
        userId: 'private-user',
        completedModules: [],
        quizScores: {},
        totalTime: 0,
        lastAccessed: Date.now(),
        notes: []
      };

      saveUserProgress(mockProgress);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to save user progress:', 
        expect.objectContaining({ name: 'SecurityError' })
      );
    });

    it('should handle storage quota exceeded scenarios', () => {
      const quotaError = new Error('Quota exceeded');
      quotaError.name = 'QuotaExceededError';
      mockLocalStorage.setItem.mockImplementation(() => {
        throw quotaError;
      });

      const largeNotes = Array(1000).fill(0).map((_, i) => ({
        id: `note-${i}`,
        moduleId: 'module-large',
        content: 'Very long content '.repeat(1000),
        timestamp: Date.now()
      }));

      saveNotes(largeNotes);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to save notes:',
        expect.objectContaining({ name: 'QuotaExceededError' })
      );
    });

    it('should handle storage disabled scenarios', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new DOMException('Storage disabled', 'SecurityError');
      });

      const result = loadUserProgress();

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to load user progress:',
        expect.any(DOMException)
      );
    });

    it('should handle circular reference in data serialization', () => {
      const circularProgress: any = {
        userId: 'circular-user',
        completedModules: [],
        quizScores: {},
        totalTime: 0,
        lastAccessed: Date.now(),
        notes: []
      };
      circularProgress.self = circularProgress; // Create circular reference

      saveUserProgress(circularProgress);

      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('Performance and memory tests', () => {
    it('should handle multiple rapid save operations efficiently', () => {
      const mockProgress: UserProgress = {
        userId: 'perf-user',
        completedModules: ['module-1'],
        quizScores: { 'module-1': 80 },
        totalTime: 1200,
        lastAccessed: Date.now(),
        notes: []
      };

      // Perform 100 rapid saves
      for (let i = 0; i < 100; i++) {
        mockProgress.totalTime += 60;
        saveUserProgress(mockProgress);
      }

      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(100);
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should handle very large note content efficiently', () => {
      const veryLargeNote: Note = {
        id: 'large-note',
        moduleId: 'module-large',
        content: 'Large content text '.repeat(10000), // ~170KB of text
        timestamp: Date.now()
      };

      saveNotes([veryLargeNote]);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'jungAppNotes',
        JSON.stringify([veryLargeNote])
      );
    });

    it('should maintain data integrity across multiple operations', () => {
      // Setup initial progress
      const initialProgress: UserProgress = {
        userId: 'integrity-user',
        completedModules: [],
        quizScores: {},
        totalTime: 0,
        lastAccessed: Date.now(),
        notes: []
      };

      mockLocalStorage.getItem.mockReturnValue(null);
      saveUserProgress(initialProgress);

      // Simulate the storage being updated
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(initialProgress));

      // Add multiple modules
      for (let i = 1; i <= 5; i++) {
        const currentProgress = loadUserProgress()!;
        currentProgress.completedModules.push(`module-${i}`);
        currentProgress.quizScores[`module-${i}`] = 70 + i * 5;
        saveUserProgress(currentProgress);
        
        // Update mock to return the new progress
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(currentProgress));
      }

      const finalProgress = loadUserProgress()!;
      expect(finalProgress.completedModules).toHaveLength(5);
      expect(Object.keys(finalProgress.quizScores)).toHaveLength(5);
      expect(finalProgress.completedModules).toEqual([
        'module-1', 'module-2', 'module-3', 'module-4', 'module-5'
      ]);
    });
  });
});