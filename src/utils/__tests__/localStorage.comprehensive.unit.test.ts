/**
 * Comprehensive unit tests for localStorage utility functions
 * Tests localStorage operations, error handling, edge cases, and security
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
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    key: jest.fn((index: number) => Object.keys(store)[index] || null),
    get length() {
      return Object.keys(store).length;
    }
  };
})();

// Mock console methods
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('localStorage Utilities - Comprehensive Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    consoleErrorSpy.mockClear();
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('saveUserProgress', () => {
    it('should save valid user progress to localStorage', () => {
      const mockProgress: UserProgress = {
        userId: 'user123',
        completedModules: ['mod1', 'mod2'],
        quizScores: { 'quiz1': 85, 'quiz2': 92 },
        totalTime: 3600,
        lastAccessed: Date.now(),
        notes: []
      };

      saveUserProgress(mockProgress);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'jungAppUserProgress',
        JSON.stringify(mockProgress)
      );
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should handle empty user progress', () => {
      const emptyProgress: UserProgress = {
        userId: '',
        completedModules: [],
        quizScores: {},
        totalTime: 0,
        lastAccessed: 0,
        notes: []
      };

      saveUserProgress(emptyProgress);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'jungAppUserProgress',
        JSON.stringify(emptyProgress)
      );
    });

    it('should handle user progress with complex nested data', () => {
      const complexProgress: UserProgress = {
        userId: 'user123',
        completedModules: ['mod1', 'mod2', 'mod3'],
        quizScores: { 
          'quiz1': 85, 
          'quiz2': 92,
          'quiz3': 78,
          'quiz4': 95
        },
        totalTime: 7200,
        lastAccessed: Date.now(),
        notes: [
          {
            id: 'note1',
            moduleId: 'mod1',
            content: 'Important concept about Jung',
            timestamp: Date.now(),
            tags: ['jung', 'psychology']
          },
          {
            id: 'note2',
            moduleId: 'mod2',
            content: 'Another insight',
            timestamp: Date.now() - 3600000
          }
        ]
      };

      saveUserProgress(complexProgress);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'jungAppUserProgress',
        JSON.stringify(complexProgress)
      );
    });

    it('should handle localStorage quota exceeded error', () => {
      const mockError = new Error('QuotaExceededError');
      mockError.name = 'QuotaExceededError';
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw mockError;
      });

      const mockProgress: UserProgress = {
        userId: 'user123',
        completedModules: ['mod1'],
        quizScores: {},
        totalTime: 1800,
        lastAccessed: Date.now(),
        notes: []
      };

      saveUserProgress(mockProgress);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to save user progress:', mockError);
    });

    it('should handle localStorage not available error', () => {
      const mockError = new Error('localStorage is not available');
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw mockError;
      });

      const mockProgress: UserProgress = {
        userId: 'user123',
        completedModules: [],
        quizScores: {},
        totalTime: 0,
        lastAccessed: Date.now(),
        notes: []
      };

      saveUserProgress(mockProgress);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to save user progress:', mockError);
    });

    it('should handle circular reference serialization error', () => {
      const circularProgress: any = {
        userId: 'user123',
        completedModules: [],
        quizScores: {},
        totalTime: 0,
        lastAccessed: Date.now(),
        notes: []
      };
      // Create circular reference
      circularProgress.self = circularProgress;

      // Mock JSON.stringify to throw error
      const originalStringify = JSON.stringify;
      jest.spyOn(JSON, 'stringify').mockImplementationOnce(() => {
        throw new TypeError('Converting circular structure to JSON');
      });

      saveUserProgress(circularProgress);

      expect(consoleErrorSpy).toHaveBeenCalled();
      
      JSON.stringify = originalStringify;
    });

    it('should handle undefined input gracefully', () => {
      saveUserProgress(undefined as any);

      expect(localStorageMock.setItem).toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });

  describe('loadUserProgress', () => {
    it('should load valid user progress from localStorage', () => {
      const mockProgress: UserProgress = {
        userId: 'user123',
        completedModules: ['mod1', 'mod2'],
        quizScores: { 'quiz1': 85, 'quiz2': 92 },
        totalTime: 3600,
        lastAccessed: Date.now(),
        notes: []
      };

      localStorageMock.setItem('jungAppUserProgress', JSON.stringify(mockProgress));

      const result = loadUserProgress();

      expect(result).toEqual(mockProgress);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('jungAppUserProgress');
    });

    it('should return null when no data exists', () => {
      localStorageMock.getItem.mockReturnValueOnce(null);

      const result = loadUserProgress();

      expect(result).toBeNull();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should return null when empty string is stored', () => {
      localStorageMock.getItem.mockReturnValueOnce('');

      const result = loadUserProgress();

      expect(result).toBeNull();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should handle corrupted JSON data', () => {
      localStorageMock.getItem.mockReturnValueOnce('invalid-json{');

      const result = loadUserProgress();

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to load user progress:',
        expect.any(SyntaxError)
      );
    });

    it('should handle localStorage access error', () => {
      const mockError = new Error('localStorage is not available');
      localStorageMock.getItem.mockImplementationOnce(() => {
        throw mockError;
      });

      const result = loadUserProgress();

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load user progress:', mockError);
    });

    it('should handle partial data corruption', () => {
      const partialData = '{"userId": "user123", "completedModules": [';
      localStorageMock.getItem.mockReturnValueOnce(partialData);

      const result = loadUserProgress();

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should handle non-string data', () => {
      localStorageMock.getItem.mockReturnValueOnce(null);

      const result = loadUserProgress();

      expect(result).toBeNull();
    });

    it('should handle very large data sets', () => {
      const largeProgress: UserProgress = {
        userId: 'user123',
        completedModules: Array.from({ length: 1000 }, (_, i) => `mod${i}`),
        quizScores: Object.fromEntries(
          Array.from({ length: 1000 }, (_, i) => [`quiz${i}`, Math.floor(Math.random() * 100)])
        ),
        totalTime: 360000,
        lastAccessed: Date.now(),
        notes: Array.from({ length: 100 }, (_, i) => ({
          id: `note${i}`,
          moduleId: `mod${i % 10}`,
          content: `Note content ${i}`,
          timestamp: Date.now() - (i * 60000)
        }))
      };

      localStorageMock.setItem('jungAppUserProgress', JSON.stringify(largeProgress));

      const result = loadUserProgress();

      expect(result).toEqual(largeProgress);
    });
  });

  describe('clearUserProgress', () => {
    it('should remove user progress from localStorage', () => {
      clearUserProgress();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('jungAppUserProgress');
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should handle localStorage not available error', () => {
      const mockError = new Error('localStorage is not available');
      localStorageMock.removeItem.mockImplementationOnce(() => {
        throw mockError;
      });

      clearUserProgress();

      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to clear user progress:', mockError);
    });

    it('should handle removal of non-existent key gracefully', () => {
      localStorageMock.getItem.mockReturnValueOnce(null);

      clearUserProgress();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('jungAppUserProgress');
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });

  describe('saveNotes', () => {
    it('should save valid notes array to localStorage', () => {
      const mockNotes: Note[] = [
        {
          id: 'note1',
          moduleId: 'mod1',
          content: 'Important concept',
          timestamp: Date.now(),
          tags: ['concept', 'important']
        },
        {
          id: 'note2',
          moduleId: 'mod2',
          content: 'Another insight',
          timestamp: Date.now() - 3600000,
          type: 'text'
        }
      ];

      saveNotes(mockNotes);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'jungAppNotes',
        JSON.stringify(mockNotes)
      );
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should save empty notes array', () => {
      saveNotes([]);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'jungAppNotes',
        JSON.stringify([])
      );
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should handle notes with complex media attachments', () => {
      const complexNotes: Note[] = [
        {
          id: 'note1',
          moduleId: 'mod1',
          content: 'Note with media',
          timestamp: Date.now(),
          type: 'text',
          mediaAttachments: [
            {
              id: 'media1',
              type: 'image',
              url: 'https://example.com/image.jpg',
              filename: 'image.jpg',
              size: 1024,
              thumbnail: 'https://example.com/thumb.jpg'
            }
          ],
          linkedConcepts: ['jung', 'psychology'],
          isShared: true,
          reactions: [
            {
              userId: 'user2',
              type: '👍',
              timestamp: Date.now()
            }
          ]
        }
      ];

      saveNotes(complexNotes);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'jungAppNotes',
        JSON.stringify(complexNotes)
      );
    });

    it('should handle localStorage error during notes save', () => {
      const mockError = new Error('Storage quota exceeded');
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw mockError;
      });

      const mockNotes: Note[] = [
        {
          id: 'note1',
          moduleId: 'mod1',
          content: 'Test note',
          timestamp: Date.now()
        }
      ];

      saveNotes(mockNotes);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to save notes:', mockError);
    });
  });

  describe('loadNotes', () => {
    it('should load valid notes from localStorage', () => {
      const mockNotes: Note[] = [
        {
          id: 'note1',
          moduleId: 'mod1',
          content: 'Important concept',
          timestamp: Date.now(),
          tags: ['concept']
        },
        {
          id: 'note2',
          moduleId: 'mod2',
          content: 'Another insight',
          timestamp: Date.now() - 3600000
        }
      ];

      localStorageMock.setItem('jungAppNotes', JSON.stringify(mockNotes));

      const result = loadNotes();

      expect(result).toEqual(mockNotes);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('jungAppNotes');
    });

    it('should return empty array when no notes exist', () => {
      localStorageMock.getItem.mockReturnValueOnce(null);

      const result = loadNotes();

      expect(result).toEqual([]);
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should return empty array when notes data is corrupted', () => {
      localStorageMock.getItem.mockReturnValueOnce('invalid-json[');

      const result = loadNotes();

      expect(result).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to load notes:',
        expect.any(SyntaxError)
      );
    });

    it('should handle localStorage access error', () => {
      const mockError = new Error('localStorage is not available');
      localStorageMock.getItem.mockImplementationOnce(() => {
        throw mockError;
      });

      const result = loadNotes();

      expect(result).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load notes:', mockError);
    });

    it('should handle notes with missing required fields', () => {
      const invalidNotes = '[{"id": "note1", "content": "missing moduleId"}]';
      localStorageMock.getItem.mockReturnValueOnce(invalidNotes);

      const result = loadNotes();

      // Should still parse and return the data, even if some fields are missing
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('id', 'note1');
      expect(result[0]).toHaveProperty('content', 'missing moduleId');
    });
  });

  describe('saveModuleProgress', () => {
    beforeEach(() => {
      // Mock Date.now for consistent timestamps
      jest.spyOn(Date, 'now').mockReturnValue(1234567890);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should save module completion with existing progress', () => {
      const existingProgress: UserProgress = {
        userId: 'user123',
        completedModules: ['mod1'],
        quizScores: { 'quiz1': 85 },
        totalTime: 1800,
        lastAccessed: 1234567800,
        notes: []
      };

      localStorageMock.setItem('jungAppUserProgress', JSON.stringify(existingProgress));

      saveModuleProgress('mod2', true, 90);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'jungAppUserProgress',
        JSON.stringify({
          ...existingProgress,
          completedModules: ['mod1', 'mod2'],
          quizScores: { 'quiz1': 85, 'mod2': 90 },
          lastAccessed: 1234567890
        })
      );
    });

    it('should create new progress when none exists', () => {
      localStorageMock.getItem.mockReturnValueOnce(null);

      saveModuleProgress('mod1', true, 85);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'jungAppUserProgress',
        JSON.stringify({
          userId: 'default-user',
          completedModules: ['mod1'],
          quizScores: { 'mod1': 85 },
          totalTime: 0,
          lastAccessed: 1234567890,
          notes: []
        })
      );
    });

    it('should update score without marking as completed', () => {
      const existingProgress: UserProgress = {
        userId: 'user123',
        completedModules: ['mod1'],
        quizScores: {},
        totalTime: 1800,
        lastAccessed: 1234567800,
        notes: []
      };

      localStorageMock.setItem('jungAppUserProgress', JSON.stringify(existingProgress));

      saveModuleProgress('mod2', false, 75);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'jungAppUserProgress',
        JSON.stringify({
          ...existingProgress,
          completedModules: ['mod1'], // mod2 not added
          quizScores: { 'mod2': 75 },
          lastAccessed: 1234567890
        })
      );
    });

    it('should handle completion without score', () => {
      const existingProgress: UserProgress = {
        userId: 'user123',
        completedModules: [],
        quizScores: {},
        totalTime: 0,
        lastAccessed: 1234567800,
        notes: []
      };

      localStorageMock.setItem('jungAppUserProgress', JSON.stringify(existingProgress));

      saveModuleProgress('mod1', true);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'jungAppUserProgress',
        JSON.stringify({
          ...existingProgress,
          completedModules: ['mod1'],
          lastAccessed: 1234567890
        })
      );
    });

    it('should not duplicate completed modules', () => {
      const existingProgress: UserProgress = {
        userId: 'user123',
        completedModules: ['mod1'],
        quizScores: { 'mod1': 80 },
        totalTime: 1800,
        lastAccessed: 1234567800,
        notes: []
      };

      localStorageMock.setItem('jungAppUserProgress', JSON.stringify(existingProgress));

      saveModuleProgress('mod1', true, 90);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'jungAppUserProgress',
        JSON.stringify({
          ...existingProgress,
          completedModules: ['mod1'], // Not duplicated
          quizScores: { 'mod1': 90 }, // Score updated
          lastAccessed: 1234567890
        })
      );
    });

    it('should handle error during progress save', () => {
      const mockError = new Error('Storage error');
      localStorageMock.getItem.mockImplementationOnce(() => {
        throw mockError;
      });

      saveModuleProgress('mod1', true, 85);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to save module progress:', mockError);
    });

    it('should handle corrupted existing progress gracefully', () => {
      localStorageMock.getItem.mockReturnValueOnce('invalid-json');

      saveModuleProgress('mod1', true, 85);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to save module progress:',
        expect.any(SyntaxError)
      );
    });

    it('should handle edge case with undefined score', () => {
      const existingProgress: UserProgress = {
        userId: 'user123',
        completedModules: [],
        quizScores: {},
        totalTime: 0,
        lastAccessed: 1234567800,
        notes: []
      };

      localStorageMock.setItem('jungAppUserProgress', JSON.stringify(existingProgress));

      saveModuleProgress('mod1', true, undefined);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'jungAppUserProgress',
        JSON.stringify({
          ...existingProgress,
          completedModules: ['mod1'],
          lastAccessed: 1234567890
          // quizScores should not include mod1
        })
      );
    });
  });

  describe('loadModuleProgress', () => {
    it('should load module progress for existing module', () => {
      const existingProgress: UserProgress = {
        userId: 'user123',
        completedModules: ['mod1', 'mod2'],
        quizScores: { 'mod1': 85, 'mod2': 92 },
        totalTime: 3600,
        lastAccessed: Date.now(),
        notes: []
      };

      localStorageMock.setItem('jungAppUserProgress', JSON.stringify(existingProgress));

      const result = loadModuleProgress('mod1');

      expect(result).toEqual({
        completed: true,
        score: 85
      });
    });

    it('should return not completed for non-existent module', () => {
      const existingProgress: UserProgress = {
        userId: 'user123',
        completedModules: ['mod1'],
        quizScores: { 'mod1': 85 },
        totalTime: 1800,
        lastAccessed: Date.now(),
        notes: []
      };

      localStorageMock.setItem('jungAppUserProgress', JSON.stringify(existingProgress));

      const result = loadModuleProgress('mod2');

      expect(result).toEqual({
        completed: false
      });
    });

    it('should return not completed when no progress exists', () => {
      localStorageMock.getItem.mockReturnValueOnce(null);

      const result = loadModuleProgress('mod1');

      expect(result).toEqual({
        completed: false
      });
    });

    it('should handle module completed but no score', () => {
      const existingProgress: UserProgress = {
        userId: 'user123',
        completedModules: ['mod1'],
        quizScores: {},
        totalTime: 1800,
        lastAccessed: Date.now(),
        notes: []
      };

      localStorageMock.setItem('jungAppUserProgress', JSON.stringify(existingProgress));

      const result = loadModuleProgress('mod1');

      expect(result).toEqual({
        completed: true
        // score should be undefined
      });
    });

    it('should handle error during progress load', () => {
      const mockError = new Error('Storage access error');
      localStorageMock.getItem.mockImplementationOnce(() => {
        throw mockError;
      });

      const result = loadModuleProgress('mod1');

      expect(result).toEqual({
        completed: false
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load module progress:', mockError);
    });

    it('should handle corrupted progress data', () => {
      localStorageMock.getItem.mockReturnValueOnce('invalid-json-data');

      const result = loadModuleProgress('mod1');

      expect(result).toEqual({
        completed: false
      });
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should handle empty module ID', () => {
      const existingProgress: UserProgress = {
        userId: 'user123',
        completedModules: ['mod1'],
        quizScores: { 'mod1': 85 },
        totalTime: 1800,
        lastAccessed: Date.now(),
        notes: []
      };

      localStorageMock.setItem('jungAppUserProgress', JSON.stringify(existingProgress));

      const result = loadModuleProgress('');

      expect(result).toEqual({
        completed: false
      });
    });

    it('should handle null module ID', () => {
      const result = loadModuleProgress(null as any);

      expect(result).toEqual({
        completed: false
      });
    });

    it('should handle progress with missing required fields', () => {
      const invalidProgress = {
        userId: 'user123',
        // Missing completedModules array
        quizScores: { 'mod1': 85 },
        totalTime: 1800,
        lastAccessed: Date.now(),
        notes: []
      };

      localStorageMock.setItem('jungAppUserProgress', JSON.stringify(invalidProgress));

      const result = loadModuleProgress('mod1');

      expect(result).toEqual({
        completed: false
      });
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('Edge Cases and Performance', () => {
    it('should handle extremely large module IDs', () => {
      const longModuleId = 'a'.repeat(10000);
      
      saveModuleProgress(longModuleId, true, 85);

      const result = loadModuleProgress(longModuleId);
      expect(result.completed).toBe(true);
      expect(result.score).toBe(85);
    });

    it('should handle special characters in module IDs', () => {
      const specialModuleId = 'mod!@#$%^&*()_+-=[]{}|;:,.<>?';
      
      saveModuleProgress(specialModuleId, true, 90);

      const result = loadModuleProgress(specialModuleId);
      expect(result.completed).toBe(true);
      expect(result.score).toBe(90);
    });

    it('should handle Unicode characters in content', () => {
      const unicodeNotes: Note[] = [
        {
          id: 'note1',
          moduleId: 'mod1',
          content: '心理学 - Psychology 🧠 नफसिय ψυχολογία',
          timestamp: Date.now(),
          tags: ['unicode', 'international']
        }
      ];

      saveNotes(unicodeNotes);

      const result = loadNotes();
      expect(result[0].content).toBe('心理学 - Psychology 🧠 नफसिय ψυχολογία');
    });

    it('should handle maximum localStorage size gracefully', () => {
      // Simulate quota exceeded
      const mockError = new Error('QuotaExceededError');
      mockError.name = 'QuotaExceededError';
      
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw mockError;
      });

      const largeData = 'x'.repeat(5000000); // 5MB string
      const largeProgress: UserProgress = {
        userId: 'user123',
        completedModules: [],
        quizScores: {},
        totalTime: 0,
        lastAccessed: Date.now(),
        notes: [
          {
            id: 'note1',
            moduleId: 'mod1',
            content: largeData,
            timestamp: Date.now()
          }
        ]
      };

      saveUserProgress(largeProgress);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to save user progress:',
        mockError
      );
    });

    it('should handle concurrent access attempts', async () => {
      const promises = Array.from({ length: 100 }, (_, i) => 
        Promise.resolve().then(() => {
          saveModuleProgress(`mod${i}`, true, 85);
          return loadModuleProgress(`mod${i}`);
        })
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(100);
      results.forEach((result, index) => {
        expect(result.completed).toBe(true);
        expect(result.score).toBe(85);
      });
    });
  });

  describe('Security Tests', () => {
    it('should handle potential XSS in note content', () => {
      const maliciousNotes: Note[] = [
        {
          id: 'note1',
          moduleId: 'mod1',
          content: '<script>alert("XSS")</script>',
          timestamp: Date.now(),
          tags: ['<img src=x onerror=alert(1)>']
        }
      ];

      saveNotes(maliciousNotes);

      const result = loadNotes();
      expect(result[0].content).toBe('<script>alert("XSS")</script>');
      expect(result[0].tags?.[0]).toBe('<img src=x onerror=alert(1)>');
      // The function should store the data as-is; sanitization should happen at display time
    });

    it('should handle potential injection in module IDs', () => {
      const maliciousModuleId = '"; DROP TABLE modules; --';
      
      saveModuleProgress(maliciousModuleId, true, 85);

      const result = loadModuleProgress(maliciousModuleId);
      expect(result.completed).toBe(true);
      expect(result.score).toBe(85);
    });

    it('should handle extremely nested object structures', () => {
      const deeplyNested: any = {};
      let current = deeplyNested;
      for (let i = 0; i < 1000; i++) {
        current.nested = {};
        current = current.nested;
      }
      current.value = 'deep';

      const progressWithDeepNesting: UserProgress = {
        userId: 'user123',
        completedModules: [],
        quizScores: {},
        totalTime: 0,
        lastAccessed: Date.now(),
        notes: [
          {
            id: 'note1',
            moduleId: 'mod1',
            content: 'test',
            timestamp: Date.now(),
            linkedConcepts: [JSON.stringify(deeplyNested)]
          }
        ]
      };

      // This should handle deep nesting gracefully
      expect(() => saveUserProgress(progressWithDeepNesting)).not.toThrow();
    });
  });

  describe('Type Safety', () => {
    it('should handle missing optional properties', () => {
      const minimalProgress: UserProgress = {
        userId: 'user123',
        completedModules: [],
        quizScores: {},
        totalTime: 0,
        lastAccessed: Date.now(),
        notes: []
      };

      saveUserProgress(minimalProgress);
      const result = loadUserProgress();

      expect(result).toEqual(minimalProgress);
    });

    it('should handle partial note objects', () => {
      const minimalNote: Note = {
        id: 'note1',
        moduleId: 'mod1',
        content: 'minimal note',
        timestamp: Date.now()
      };

      saveNotes([minimalNote]);
      const result = loadNotes();

      expect(result[0]).toEqual(minimalNote);
    });

    it('should preserve data types correctly', () => {
      const progress: UserProgress = {
        userId: 'user123',
        completedModules: ['mod1', 'mod2'],
        quizScores: { 'quiz1': 85.5, 'quiz2': 92.7 },
        totalTime: 3600,
        lastAccessed: 1234567890,
        notes: []
      };

      saveUserProgress(progress);
      const result = loadUserProgress();

      expect(typeof result?.userId).toBe('string');
      expect(Array.isArray(result?.completedModules)).toBe(true);
      expect(typeof result?.quizScores).toBe('object');
      expect(typeof result?.totalTime).toBe('number');
      expect(typeof result?.lastAccessed).toBe('number');
      expect(Array.isArray(result?.notes)).toBe(true);
    });
  });
});