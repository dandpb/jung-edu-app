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

describe('localStorage utilities', () => {
  // Mock localStorage with comprehensive error handling
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
    }),
    length: 0,
    key: jest.fn()
  };

  // Mock console.error
  let consoleErrorSpy: jest.SpyInstance;

  // Mock Date.now for consistent testing
  let mockDateNow: jest.SpyInstance;

  beforeAll(() => {
    // Mock localStorage globally
    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true
    });
    
    // Mock window.localStorage for browser compatibility
    if (typeof window !== 'undefined') {
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
        writable: true,
        configurable: true
      });
    }
  });

  beforeEach(() => {
    // Clear store and reset mocks
    store = {};
    jest.clearAllMocks();
    
    // Mock console.error
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock Date.now with a consistent timestamp
    const mockTimestamp = 1700000000000;
    mockDateNow = jest.spyOn(Date, 'now').mockReturnValue(mockTimestamp);
    
    // Reset mock implementations to default behavior
    localStorageMock.getItem.mockImplementation((key: string) => store[key] || null);
    localStorageMock.setItem.mockImplementation((key: string, value: string) => {
      store[key] = value;
    });
    localStorageMock.removeItem.mockImplementation((key: string) => {
      delete store[key];
    });
  });

  afterEach(() => {
    // Restore mocks after each test
    consoleErrorSpy.mockRestore();
    mockDateNow.mockRestore();
  });

  describe('saveUserProgress', () => {
    it('should save user progress to localStorage with correct key', () => {
      const progress: UserProgress = {
        userId: 'test-user-123',
        completedModules: ['module1', 'module2'],
        quizScores: { module1: 85, module2: 92 },
        totalTime: 3600,
        lastAccessed: Date.now(),
        notes: []
      };

      saveUserProgress(progress);

      expect(localStorageMock.setItem).toHaveBeenCalledTimes(1);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'jungAppUserProgress',
        JSON.stringify(progress)
      );
      expect(store.jungAppUserProgress).toBe(JSON.stringify(progress));
    });

    it('should save empty progress object', () => {
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

    it('should save progress with optional properties', () => {
      const progressWithOptionals: UserProgress = {
        userId: 'user-with-extras',
        completedModules: ['module1'],
        quizScores: { module1: 100 },
        totalTime: 1200,
        lastAccessed: Date.now(),
        notes: [{
          id: 'note1',
          moduleId: 'module1',
          content: 'Test note',
          timestamp: Date.now()
        }],
        learningPath: {
          id: 'path1',
          name: 'Jung Basics',
          description: 'Introduction to Jung',
          modules: ['module1', 'module2'],
          currentModule: 'module1',
          progress: 50,
          estimatedCompletion: new Date(),
          personalized: true
        }
      };

      saveUserProgress(progressWithOptionals);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'jungAppUserProgress',
        JSON.stringify(progressWithOptionals)
      );
    });

    it('should handle localStorage quota exceeded error (DOMException)', () => {
      const progress: UserProgress = {
        userId: 'test-user',
        completedModules: [],
        quizScores: {},
        totalTime: 0,
        lastAccessed: Date.now(),
        notes: []
      };

      const quotaError = new DOMException('QuotaExceededError', 'QuotaExceededError');
      localStorageMock.setItem.mockImplementation(() => {
        throw quotaError;
      });

      saveUserProgress(progress);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to save user progress:',
        quotaError
      );
    });

    it('should handle general storage errors', () => {
      const progress: UserProgress = {
        userId: 'test-user',
        completedModules: [],
        quizScores: {},
        totalTime: 0,
        lastAccessed: Date.now(),
        notes: []
      };

      const storageError = new Error('Storage access denied');
      localStorageMock.setItem.mockImplementation(() => {
        throw storageError;
      });

      saveUserProgress(progress);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to save user progress:',
        storageError
      );
    });

    it('should handle SecurityError (private browsing)', () => {
      const progress: UserProgress = {
        userId: 'test-user',
        completedModules: [],
        quizScores: {},
        totalTime: 0,
        lastAccessed: Date.now(),
        notes: []
      };

      const securityError = new DOMException('SecurityError', 'SecurityError');
      localStorageMock.setItem.mockImplementation(() => {
        throw securityError;
      });

      saveUserProgress(progress);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to save user progress:',
        securityError
      );
    });

    it('should handle non-serializable data gracefully', () => {
      // Create a circular reference that would break JSON.stringify
      const progressWithCircular = {
        userId: 'test-user',
        completedModules: [],
        quizScores: {},
        totalTime: 0,
        lastAccessed: Date.now(),
        notes: []
      } as any;
      
      // Add circular reference
      progressWithCircular.self = progressWithCircular;

      // JSON.stringify will throw, but setItem won't be called
      const originalStringify = JSON.stringify;
      jest.spyOn(JSON, 'stringify').mockImplementation(() => {
        throw new TypeError('Converting circular structure to JSON');
      });

      saveUserProgress(progressWithCircular);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to save user progress:',
        expect.any(TypeError)
      );

      JSON.stringify = originalStringify;
    });
  });

  describe('loadUserProgress', () => {
    it('should load valid user progress from localStorage', () => {
      const progress: UserProgress = {
        userId: 'test-user-load',
        completedModules: ['module1', 'module3'],
        quizScores: { module1: 88, module3: 95 },
        totalTime: 7200,
        lastAccessed: Date.now(),
        notes: [{
          id: 'note1',
          moduleId: 'module1',
          content: 'Important insight',
          timestamp: Date.now()
        }]
      };

      store.jungAppUserProgress = JSON.stringify(progress);

      const loaded = loadUserProgress();

      expect(localStorageMock.getItem).toHaveBeenCalledWith('jungAppUserProgress');
      expect(loaded).toEqual(progress);
    });

    it('should return null when no progress exists', () => {
      store = {}; // Empty store

      const loaded = loadUserProgress();

      expect(loaded).toBeNull();
      expect(localStorageMock.getItem).toHaveBeenCalledWith('jungAppUserProgress');
    });

    it('should return null when stored value is empty string', () => {
      store.jungAppUserProgress = '';

      const loaded = loadUserProgress();

      expect(loaded).toBeNull();
    });

    it('should handle invalid JSON and return null', () => {
      store.jungAppUserProgress = 'invalid json {[}';

      const loaded = loadUserProgress();

      expect(loaded).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to load user progress:',
        expect.any(SyntaxError)
      );
    });

    it('should handle malformed JSON objects', () => {
      store.jungAppUserProgress = '{"userId": "test", "incomplete":';

      const loaded = loadUserProgress();

      expect(loaded).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to load user progress:',
        expect.any(SyntaxError)
      );
    });

    it('should handle localStorage access errors', () => {
      const accessError = new DOMException('SecurityError', 'SecurityError');
      localStorageMock.getItem.mockImplementation(() => {
        throw accessError;
      });

      const loaded = loadUserProgress();

      expect(loaded).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to load user progress:',
        accessError
      );
    });

    it('should handle null localStorage return gracefully', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const loaded = loadUserProgress();

      expect(loaded).toBeNull();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should handle undefined localStorage return', () => {
      localStorageMock.getItem.mockReturnValue(undefined as any);

      const loaded = loadUserProgress();

      expect(loaded).toBeNull();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should handle corrupt JSON with valid structure but wrong content', () => {
      store.jungAppUserProgress = '{"not": "userProgress"}';

      const loaded = loadUserProgress();

      // Should still return the parsed object, even if it doesn't match our interface
      expect(loaded).toEqual({ not: 'userProgress' });
    });

    it('should handle very large JSON objects', () => {
      const largeProgress: UserProgress = {
        userId: 'large-user',
        completedModules: Array.from({ length: 1000 }, (_, i) => `module${i}`),
        quizScores: {},
        totalTime: 99999999,
        lastAccessed: Date.now(),
        notes: Array.from({ length: 100 }, (_, i) => ({
          id: `note${i}`,
          moduleId: `module${i}`,
          content: 'A'.repeat(1000), // Large content
          timestamp: Date.now()
        }))
      };

      // Fill quiz scores
      for (let i = 0; i < 1000; i++) {
        largeProgress.quizScores[`module${i}`] = Math.floor(Math.random() * 100);
      }

      store.jungAppUserProgress = JSON.stringify(largeProgress);

      const loaded = loadUserProgress();

      expect(loaded).toEqual(largeProgress);
    });
  });

  describe('clearUserProgress', () => {
    it('should remove user progress from localStorage', () => {
      // Set some initial data
      store.jungAppUserProgress = '{"userId": "test"}';

      clearUserProgress();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('jungAppUserProgress');
      expect(store.jungAppUserProgress).toBeUndefined();
    });

    it('should handle removal of non-existent key gracefully', () => {
      // Start with empty store
      store = {};

      clearUserProgress();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('jungAppUserProgress');
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should handle localStorage access errors during removal', () => {
      const accessError = new DOMException('SecurityError', 'SecurityError');
      localStorageMock.removeItem.mockImplementation(() => {
        throw accessError;
      });

      clearUserProgress();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to clear user progress:',
        accessError
      );
    });

    it('should handle general errors during removal', () => {
      const generalError = new Error('Unexpected storage error');
      localStorageMock.removeItem.mockImplementation(() => {
        throw generalError;
      });

      clearUserProgress();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to clear user progress:',
        generalError
      );
    });
  });

  describe('saveNotes', () => {
    it('should save notes array to localStorage', () => {
      const notes: Note[] = [
        {
          id: 'note1',
          moduleId: 'module1',
          content: 'Jung\'s theory of individuation',
          timestamp: Date.now(),
          tags: ['individuation', 'theory']
        },
        {
          id: 'note2',
          moduleId: 'module2',
          content: 'Collective unconscious concepts',
          timestamp: Date.now(),
          type: 'text',
          linkedConcepts: ['collective', 'unconscious']
        }
      ];

      saveNotes(notes);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'jungAppNotes',
        JSON.stringify(notes)
      );
      expect(store.jungAppNotes).toBe(JSON.stringify(notes));
    });

    it('should save empty notes array', () => {
      const emptyNotes: Note[] = [];

      saveNotes(emptyNotes);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'jungAppNotes',
        JSON.stringify(emptyNotes)
      );
    });

    it('should save notes with all optional properties', () => {
      const richNotes: Note[] = [
        {
          id: 'rich-note',
          moduleId: 'advanced-module',
          content: 'Complex note with attachments',
          timestamp: Date.now(),
          tags: ['advanced', 'multimedia'],
          type: 'text',
          mediaAttachments: [
            {
              id: 'attachment1',
              type: 'image',
              url: 'https://example.com/image.jpg',
              filename: 'jung-diagram.jpg',
              size: 1024000,
              thumbnail: 'https://example.com/thumb.jpg'
            }
          ],
          linkedConcepts: ['anima', 'animus', 'shadow'],
          isShared: true,
          parentNoteId: 'parent-note-123',
          reactions: [
            {
              userId: 'user1',
              type: '👍',
              timestamp: Date.now()
            }
          ]
        }
      ];

      saveNotes(richNotes);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'jungAppNotes',
        JSON.stringify(richNotes)
      );
    });

    it('should handle localStorage quota exceeded error', () => {
      const quotaError = new DOMException('QuotaExceededError', 'QuotaExceededError');
      localStorageMock.setItem.mockImplementation(() => {
        throw quotaError;
      });

      const notes: Note[] = [{ id: 'note1', moduleId: 'module1', content: 'test', timestamp: Date.now() }];
      saveNotes(notes);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to save notes:',
        quotaError
      );
    });

    it('should handle general storage errors', () => {
      const storageError = new Error('Storage access denied');
      localStorageMock.setItem.mockImplementation(() => {
        throw storageError;
      });

      saveNotes([]);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to save notes:',
        storageError
      );
    });

    it('should handle very large notes array', () => {
      const largeNotes: Note[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `note${i}`,
        moduleId: `module${i % 10}`,
        content: 'Lorem ipsum '.repeat(100), // Large content per note
        timestamp: Date.now() + i,
        tags: [`tag${i}`, `category${i % 5}`]
      }));

      saveNotes(largeNotes);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'jungAppNotes',
        JSON.stringify(largeNotes)
      );
    });
  });

  describe('loadNotes', () => {
    it('should load notes array from localStorage', () => {
      const notes: Note[] = [
        {
          id: 'note1',
          moduleId: 'module1',
          content: 'Loaded note about archetypes',
          timestamp: Date.now(),
          tags: ['archetypes']
        },
        {
          id: 'note2',
          moduleId: 'module2',
          content: 'Dreams and symbols',
          timestamp: Date.now(),
          type: 'text'
        }
      ];

      store.jungAppNotes = JSON.stringify(notes);

      const loaded = loadNotes();

      expect(localStorageMock.getItem).toHaveBeenCalledWith('jungAppNotes');
      expect(loaded).toEqual(notes);
    });

    it('should return empty array when no notes exist', () => {
      store = {}; // Empty store

      const loaded = loadNotes();

      expect(loaded).toEqual([]);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('jungAppNotes');
    });

    it('should return empty array for null value', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const loaded = loadNotes();

      expect(loaded).toEqual([]);
    });

    it('should return empty array for empty string', () => {
      store.jungAppNotes = '';

      const loaded = loadNotes();

      expect(loaded).toEqual([]);
    });

    it('should handle invalid JSON and return empty array', () => {
      store.jungAppNotes = 'invalid json [}';

      const loaded = loadNotes();

      expect(loaded).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to load notes:',
        expect.any(SyntaxError)
      );
    });

    it('should handle non-array data format and return empty array', () => {
      store.jungAppNotes = '{"not": "an array"}';

      const loaded = loadNotes();

      expect(loaded).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Invalid notes data format - expected array, got:',
        'object'
      );
    });

    it('should handle various non-array types', () => {
      const nonArrayTypes = [
        { data: '"string"', expectedType: 'string' },
        { data: '123', expectedType: 'number' },
        { data: 'true', expectedType: 'boolean' },
        { data: 'null', expectedType: 'object' }, // typeof null === 'object'
      ];

      nonArrayTypes.forEach(({ data, expectedType }) => {
        // Reset mocks for each iteration
        jest.clearAllMocks();
        consoleErrorSpy.mockClear();
        
        store.jungAppNotes = data;
        
        const loaded = loadNotes();
        
        expect(loaded).toEqual([]);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Invalid notes data format - expected array, got:',
          expectedType
        );
      });
    });

    it('should handle localStorage access errors', () => {
      const accessError = new DOMException('SecurityError', 'SecurityError');
      localStorageMock.getItem.mockImplementation(() => {
        throw accessError;
      });

      const loaded = loadNotes();

      expect(loaded).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to load notes:',
        accessError
      );
    });

    it('should load array with mixed note types', () => {
      const mixedNotes = [
        {
          id: 'text-note',
          moduleId: 'module1',
          content: 'Text note',
          timestamp: Date.now(),
          type: 'text' as const
        },
        {
          id: 'audio-note', 
          moduleId: 'module2',
          content: 'Audio note description',
          timestamp: Date.now(),
          type: 'audio' as const
        },
        {
          id: 'drawing-note',
          moduleId: 'module3', 
          content: 'Drawing note',
          timestamp: Date.now(),
          type: 'drawing' as const
        }
      ];

      store.jungAppNotes = JSON.stringify(mixedNotes);

      const loaded = loadNotes();

      expect(loaded).toEqual(mixedNotes);
    });
  });

  describe('saveModuleProgress', () => {
    it('should create new progress when none exists', () => {
      localStorageMock.getItem.mockReturnValue(null);

      saveModuleProgress('module1', true, 85);

      expect(localStorageMock.getItem).toHaveBeenCalledWith('jungAppUserProgress');
      expect(localStorageMock.setItem).toHaveBeenCalledTimes(1);

      const savedData = localStorageMock.setItem.mock.calls[0][1];
      const progress = JSON.parse(savedData);

      expect(progress).toEqual({
        userId: 'default-user',
        completedModules: ['module1'],
        quizScores: { module1: 85 },
        totalTime: 0,
        lastAccessed: Date.now(),
        notes: []
      });
    });

    it('should update existing progress', () => {
      const existingProgress: UserProgress = {
        userId: 'existing-user',
        completedModules: ['module1'],
        quizScores: { module1: 80 },
        totalTime: 1800,
        lastAccessed: Date.now() - 1000,
        notes: []
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingProgress));

      saveModuleProgress('module2', true, 95);

      const savedData = localStorageMock.setItem.mock.calls[0][1];
      const progress = JSON.parse(savedData);

      expect(progress.completedModules).toContain('module1');
      expect(progress.completedModules).toContain('module2');
      expect(progress.quizScores.module1).toBe(80);
      expect(progress.quizScores.module2).toBe(95);
      expect(progress.lastAccessed).toBe(Date.now());
    });

    it('should mark module as completed without score', () => {
      localStorageMock.getItem.mockReturnValue(null);

      saveModuleProgress('module1', true);

      const savedData = localStorageMock.setItem.mock.calls[0][1];
      const progress = JSON.parse(savedData);

      expect(progress.completedModules).toContain('module1');
      expect(progress.quizScores.module1).toBeUndefined();
    });

    it('should save score without marking as completed', () => {
      localStorageMock.getItem.mockReturnValue(null);

      saveModuleProgress('module1', false, 75);

      const savedData = localStorageMock.setItem.mock.calls[0][1];
      const progress = JSON.parse(savedData);

      expect(progress.completedModules).not.toContain('module1');
      expect(progress.quizScores.module1).toBe(75);
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

      saveModuleProgress('module1', true, 90);

      const savedData = localStorageMock.setItem.mock.calls[0][1];
      const progress = JSON.parse(savedData);

      const moduleCount = progress.completedModules.filter((m: string) => m === 'module1').length;
      expect(moduleCount).toBe(1);
      expect(progress.quizScores.module1).toBe(90);
    });

    it('should update lastAccessed timestamp', () => {
      const pastTimestamp = Date.now() - 10000;
      const existingProgress: UserProgress = {
        userId: 'test-user',
        completedModules: [],
        quizScores: {},
        totalTime: 0,
        lastAccessed: pastTimestamp,
        notes: []
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingProgress));

      saveModuleProgress('module1', false, 88);

      const savedData = localStorageMock.setItem.mock.calls[0][1];
      const progress = JSON.parse(savedData);

      expect(progress.lastAccessed).toBe(Date.now());
      expect(progress.lastAccessed).not.toBe(pastTimestamp);
    });

    it('should handle loadUserProgress errors gracefully', () => {
      const loadError = new Error('Failed to load');
      localStorageMock.getItem.mockImplementation(() => {
        throw loadError;
      });

      saveModuleProgress('module1', true, 85);

      // loadUserProgress logs its own error before saveModuleProgress catches it
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to load user progress:',
        loadError
      );
    });

    it('should handle saveUserProgress errors gracefully', () => {
      localStorageMock.getItem.mockReturnValue(null);
      const saveError = new DOMException('QuotaExceededError', 'QuotaExceededError');
      localStorageMock.setItem.mockImplementation(() => {
        throw saveError;
      });

      saveModuleProgress('module1', true, 85);

      // saveUserProgress logs its own error before saveModuleProgress catches it
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to save user progress:',
        saveError
      );
    });

    it('should handle edge case with undefined score', () => {
      localStorageMock.getItem.mockReturnValue(null);

      saveModuleProgress('module1', true, undefined);

      const savedData = localStorageMock.setItem.mock.calls[0][1];
      const progress = JSON.parse(savedData);

      expect(progress.completedModules).toContain('module1');
      expect(progress.quizScores.module1).toBeUndefined();
    });

    it('should handle zero score', () => {
      localStorageMock.getItem.mockReturnValue(null);

      saveModuleProgress('module1', true, 0);

      const savedData = localStorageMock.setItem.mock.calls[0][1];
      const progress = JSON.parse(savedData);

      expect(progress.completedModules).toContain('module1');
      expect(progress.quizScores.module1).toBe(0);
    });

    it('should handle negative score (edge case)', () => {
      localStorageMock.getItem.mockReturnValue(null);

      saveModuleProgress('module1', true, -10);

      const savedData = localStorageMock.setItem.mock.calls[0][1];
      const progress = JSON.parse(savedData);

      expect(progress.quizScores.module1).toBe(-10);
    });

    it('should handle very high score', () => {
      localStorageMock.getItem.mockReturnValue(null);

      saveModuleProgress('module1', true, 999999);

      const savedData = localStorageMock.setItem.mock.calls[0][1];
      const progress = JSON.parse(savedData);

      expect(progress.quizScores.module1).toBe(999999);
    });
  });

  describe('loadModuleProgress', () => {
    it('should load module completion and score', () => {
      const progress: UserProgress = {
        userId: 'test-user',
        completedModules: ['module1', 'module2'],
        quizScores: { module1: 85, module2: 92 },
        totalTime: 0,
        lastAccessed: Date.now(),
        notes: []
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(progress));

      const result = loadModuleProgress('module1');

      expect(localStorageMock.getItem).toHaveBeenCalledWith('jungAppUserProgress');
      expect(result.completed).toBe(true);
      expect(result.score).toBe(85);
    });

    it('should return false for uncompleted module', () => {
      const progress: UserProgress = {
        userId: 'test-user',
        completedModules: ['module1'],
        quizScores: { module1: 88 },
        totalTime: 0,
        lastAccessed: Date.now(),
        notes: []
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(progress));

      const result = loadModuleProgress('module2');

      expect(result.completed).toBe(false);
      expect(result.score).toBeUndefined();
    });

    it('should handle missing progress data', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = loadModuleProgress('module1');

      expect(result.completed).toBe(false);
      expect(result.score).toBeUndefined();
    });

    it('should handle empty/null/undefined moduleId', () => {
      const testCases = ['', null, undefined] as any[];

      testCases.forEach((moduleId) => {
        const result = loadModuleProgress(moduleId);
        
        expect(result.completed).toBe(false);
        expect(result.score).toBeUndefined();
      });
    });

    it('should handle missing completedModules property', () => {
      const progressWithoutModules = {
        userId: 'test-user',
        // completedModules: missing
        quizScores: { module1: 88 },
        totalTime: 0,
        lastAccessed: Date.now(),
        notes: []
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(progressWithoutModules));

      const result = loadModuleProgress('module1');

      expect(result.completed).toBe(false); // Should handle missing property
      expect(result.score).toBe(88);
    });

    it('should handle missing quizScores property', () => {
      const progressWithoutScores = {
        userId: 'test-user',
        completedModules: ['module1'],
        // quizScores: missing
        totalTime: 0,
        lastAccessed: Date.now(),
        notes: []
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(progressWithoutScores));

      const result = loadModuleProgress('module1');

      expect(result.completed).toBe(true);
      expect(result.score).toBeUndefined(); // Should handle missing property
    });

    it('should handle both missing properties', () => {
      const minimalProgress = {
        userId: 'test-user',
        // completedModules: missing
        // quizScores: missing
        totalTime: 0,
        lastAccessed: Date.now(),
        notes: []
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(minimalProgress));

      const result = loadModuleProgress('module1');

      expect(result.completed).toBe(false);
      expect(result.score).toBeUndefined();
    });

    it('should handle localStorage access errors', () => {
      const accessError = new DOMException('SecurityError', 'SecurityError');
      localStorageMock.getItem.mockImplementation(() => {
        throw accessError;
      });

      const result = loadModuleProgress('module1');

      expect(result.completed).toBe(false);
      expect(result.score).toBeUndefined();
      // loadUserProgress logs its own error before loadModuleProgress catches it
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to load user progress:',
        accessError
      );
    });

    it('should handle JSON parse errors', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');

      const result = loadModuleProgress('module1');

      expect(result.completed).toBe(false);
      expect(result.score).toBeUndefined();
      // loadUserProgress logs its own error before loadModuleProgress catches it
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to load user progress:',
        expect.any(SyntaxError)
      );
    });

    it('should handle null completedModules array', () => {
      const progressWithNullModules = {
        userId: 'test-user',
        completedModules: null,
        quizScores: { module1: 88 },
        totalTime: 0,
        lastAccessed: Date.now(),
        notes: []
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(progressWithNullModules));

      const result = loadModuleProgress('module1');

      expect(result.completed).toBe(false);
      expect(result.score).toBe(88);
    });

    it('should handle null quizScores object', () => {
      const progressWithNullScores = {
        userId: 'test-user',
        completedModules: ['module1'],
        quizScores: null,
        totalTime: 0,
        lastAccessed: Date.now(),
        notes: []
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(progressWithNullScores));

      const result = loadModuleProgress('module1');

      expect(result.completed).toBe(true);
      expect(result.score).toBeUndefined();
    });

    it('should handle score of zero correctly', () => {
      const progress: UserProgress = {
        userId: 'test-user',
        completedModules: ['module1'],
        quizScores: { module1: 0 },
        totalTime: 0,
        lastAccessed: Date.now(),
        notes: []
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(progress));

      const result = loadModuleProgress('module1');

      expect(result.completed).toBe(true);
      expect(result.score).toBe(0);
    });

    it('should handle negative score (edge case)', () => {
      const progress: UserProgress = {
        userId: 'test-user',
        completedModules: ['module1'],
        quizScores: { module1: -5 },
        totalTime: 0,
        lastAccessed: Date.now(),
        notes: []
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(progress));

      const result = loadModuleProgress('module1');

      expect(result.completed).toBe(true);
      expect(result.score).toBe(-5);
    });

    it('should handle special characters in moduleId', () => {
      const specialModuleId = 'module-with-special-chars!@#$%^&*()';
      const progress: UserProgress = {
        userId: 'test-user',
        completedModules: [specialModuleId],
        quizScores: { [specialModuleId]: 75 },
        totalTime: 0,
        lastAccessed: Date.now(),
        notes: []
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(progress));

      const result = loadModuleProgress(specialModuleId);

      expect(result.completed).toBe(true);
      expect(result.score).toBe(75);
    });

    it('should handle unicode moduleId', () => {
      const unicodeModuleId = 'модуль-тест-🎓📚';
      const progress: UserProgress = {
        userId: 'test-user',
        completedModules: [unicodeModuleId],
        quizScores: { [unicodeModuleId]: 95 },
        totalTime: 0,
        lastAccessed: Date.now(),
        notes: []
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(progress));

      const result = loadModuleProgress(unicodeModuleId);

      expect(result.completed).toBe(true);
      expect(result.score).toBe(95);
    });
  });

  describe('Browser Compatibility', () => {
    it('should work when localStorage is not available', () => {
      // Temporarily remove localStorage
      const originalLocalStorage = global.localStorage;
      delete (global as any).localStorage;

      // This should cause localStorage access to throw
      const progress: UserProgress = {
        userId: 'test-user',
        completedModules: [],
        quizScores: {},
        totalTime: 0,
        lastAccessed: Date.now(),
        notes: []
      };

      // These should handle the missing localStorage gracefully
      expect(() => saveUserProgress(progress)).not.toThrow();
      expect(() => loadUserProgress()).not.toThrow();
      expect(() => clearUserProgress()).not.toThrow();
      expect(() => saveNotes([])).not.toThrow();
      expect(() => loadNotes()).not.toThrow();
      expect(() => saveModuleProgress('module1', true)).not.toThrow();
      expect(() => loadModuleProgress('module1')).not.toThrow();

      // Restore localStorage
      (global as any).localStorage = originalLocalStorage;
    });

    it('should handle localStorage being read-only', () => {
      // Make localStorage read-only by throwing on write operations
      localStorageMock.setItem.mockImplementation(() => {
        throw new DOMException('SecurityError', 'SecurityError');
      });
      localStorageMock.removeItem.mockImplementation(() => {
        throw new DOMException('SecurityError', 'SecurityError');
      });

      const progress: UserProgress = {
        userId: 'test-user',
        completedModules: [],
        quizScores: {},
        totalTime: 0,
        lastAccessed: Date.now(),
        notes: []
      };

      // These should handle read-only localStorage gracefully
      expect(() => saveUserProgress(progress)).not.toThrow();
      expect(() => clearUserProgress()).not.toThrow();
      expect(() => saveNotes([])).not.toThrow();
      expect(() => saveModuleProgress('module1', true)).not.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledTimes(4);
    });

    it('should handle private browsing mode restrictions', () => {
      // In some private browsing modes, localStorage exists but throws on access
      localStorageMock.getItem.mockImplementation(() => {
        throw new DOMException('SecurityError', 'SecurityError');
      });
      localStorageMock.setItem.mockImplementation(() => {
        throw new DOMException('SecurityError', 'SecurityError');
      });

      // Should handle gracefully and not crash the application
      expect(loadUserProgress()).toBeNull();
      expect(loadNotes()).toEqual([]);
      expect(loadModuleProgress('module1')).toEqual({ completed: false });

      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('Edge Cases and Error Recovery', () => {
    it('should recover from corrupted localStorage data', () => {
      // Simulate corrupted data
      store.jungAppUserProgress = '\x00\x01invalid\x02data\x03';

      const result = loadUserProgress();

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should handle data migration scenarios', () => {
      // Simulate old data format that might exist from previous app versions
      const legacyProgress = {
        user: 'legacy-user',
        modules: ['module1'], // Different property name
        scores: { module1: 85 }, // Different property name  
        time: 1800,
        accessed: Date.now()
        // Missing some new properties
      };

      store.jungAppUserProgress = JSON.stringify(legacyProgress);

      // Should load the data even if format doesn't exactly match
      const loaded = loadUserProgress();
      expect(loaded).toEqual(legacyProgress);
    });

    it('should handle data with extra properties', () => {
      const futureProgress = {
        userId: 'future-user',
        completedModules: ['module1'],
        quizScores: { module1: 90 },
        totalTime: 0,
        lastAccessed: Date.now(),
        notes: [],
        // Future properties that don't exist yet
        version: '2.0',
        aiRecommendations: ['suggestion1', 'suggestion2'],
        learningAnalytics: {
          strengths: ['critical thinking'],
          weaknesses: ['time management']
        }
      };

      store.jungAppUserProgress = JSON.stringify(futureProgress);

      const loaded = loadUserProgress();
      expect(loaded).toEqual(futureProgress); // Should preserve extra properties
    });

    it('should handle memory pressure scenarios', () => {
      // Simulate memory pressure by making JSON operations slow/fail intermittently
      let parseCallCount = 0;
      const originalParse = JSON.parse;
      
      jest.spyOn(JSON, 'parse').mockImplementation((text: string) => {
        parseCallCount++;
        if (parseCallCount % 3 === 0) {
          throw new Error('Memory pressure - operation failed');
        }
        return originalParse(text);
      });

      store.jungAppUserProgress = '{"userId":"test","completedModules":[],"quizScores":{},"totalTime":0,"lastAccessed":123,"notes":[]}';

      // First two calls should work, third should fail
      expect(loadUserProgress()).toBeDefined();
      expect(loadUserProgress()).toBeDefined();
      expect(loadUserProgress()).toBeNull();

      JSON.parse = originalParse;
    });

    it('should handle very long keys/values', () => {
      const longUserId = 'a'.repeat(10000);
      const longContent = 'very long content '.repeat(1000);

      const progress: UserProgress = {
        userId: longUserId,
        completedModules: [],
        quizScores: {},
        totalTime: 0,
        lastAccessed: Date.now(),
        notes: [{
          id: 'long-note',
          moduleId: 'module1',
          content: longContent,
          timestamp: Date.now()
        }]
      };

      expect(() => saveUserProgress(progress)).not.toThrow();

      store.jungAppUserProgress = JSON.stringify(progress);
      const loaded = loadUserProgress();

      expect(loaded?.userId).toBe(longUserId);
      expect(loaded?.notes[0].content).toBe(longContent);
    });

    it('should handle concurrent access scenarios', () => {
      // Simulate concurrent modifications by changing store mid-operation
      let callCount = 0;
      localStorageMock.getItem.mockImplementation((key: string) => {
        callCount++;
        if (callCount === 1) {
          return JSON.stringify({
            userId: 'first-user',
            completedModules: [],
            quizScores: {},
            totalTime: 0,
            lastAccessed: Date.now(),
            notes: []
          });
        } else {
          return JSON.stringify({
            userId: 'second-user', // Different user data
            completedModules: ['module1'],
            quizScores: { module1: 100 },
            totalTime: 1000,
            lastAccessed: Date.now(),
            notes: []
          });
        }
      });

      const result1 = loadUserProgress();
      const result2 = loadUserProgress();

      expect(result1?.userId).toBe('first-user');
      expect(result2?.userId).toBe('second-user');
    });

    it('should handle maximum localStorage size limits gracefully', () => {
      // Create very large data that might exceed localStorage limits
      const massiveNotes: Note[] = Array.from({ length: 10000 }, (_, i) => ({
        id: `note${i}`,
        moduleId: `module${i}`,
        content: 'X'.repeat(1000), // 1KB per note = ~10MB total
        timestamp: Date.now() + i,
        tags: Array.from({ length: 100 }, (_, j) => `tag${i}-${j}`)
      }));

      // Mock quota exceeded error
      localStorageMock.setItem.mockImplementation(() => {
        throw new DOMException('QuotaExceededError', 'QuotaExceededError');
      });

      saveNotes(massiveNotes);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to save notes:',
        expect.any(DOMException)
      );
    });

    it('should handle rapid successive calls', () => {
      const progress: UserProgress = {
        userId: 'rapid-user',
        completedModules: [],
        quizScores: {},
        totalTime: 0,
        lastAccessed: Date.now(),
        notes: []
      };

      // Make many rapid calls
      for (let i = 0; i < 100; i++) {
        saveUserProgress(progress);
        loadUserProgress();
        saveModuleProgress(`module${i}`, true, i);
        loadModuleProgress(`module${i}`);
      }

      // Should not cause any errors
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should handle storage events and external modifications', () => {
      // Simulate external modification to localStorage
      const initialProgress: UserProgress = {
        userId: 'initial-user',
        completedModules: ['module1'],
        quizScores: { module1: 85 },
        totalTime: 0,
        lastAccessed: Date.now(),
        notes: []
      };

      store.jungAppUserProgress = JSON.stringify(initialProgress);
      
      // Load initial state
      const loaded1 = loadUserProgress();
      expect(loaded1?.userId).toBe('initial-user');

      // Simulate external modification (another tab, etc.)
      const modifiedProgress = {
        ...initialProgress,
        userId: 'externally-modified-user',
        completedModules: ['module1', 'module2']
      };
      store.jungAppUserProgress = JSON.stringify(modifiedProgress);

      // Load should reflect external changes
      const loaded2 = loadUserProgress();
      expect(loaded2?.userId).toBe('externally-modified-user');
      expect(loaded2?.completedModules).toContain('module2');
    });

    it('should handle cross-origin security restrictions', () => {
      // Simulate cross-origin restrictions
      const crossOriginError = new DOMException('SecurityError', 'SecurityError');
      
      localStorageMock.getItem.mockImplementation(() => {
        throw crossOriginError;
      });
      localStorageMock.setItem.mockImplementation(() => {
        throw crossOriginError;
      });

      // Should handle gracefully without crashing
      expect(loadUserProgress()).toBeNull();
      expect(loadNotes()).toEqual([]);
      
      const progress: UserProgress = {
        userId: 'test',
        completedModules: [],
        quizScores: {},
        totalTime: 0,
        lastAccessed: Date.now(),
        notes: []
      };
      
      expect(() => saveUserProgress(progress)).not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should handle localStorage implementation inconsistencies', () => {
      // Some environments might have partial localStorage implementations
      
      // Test 1: getItem returns undefined instead of null
      localStorageMock.getItem.mockReturnValue(undefined as any);
      expect(loadUserProgress()).toBeNull();
      expect(loadNotes()).toEqual([]);
      
      // Test 2: setItem accepts but silently fails
      let silentFailCount = 0;
      localStorageMock.setItem.mockImplementation(() => {
        silentFailCount++;
        // Silently do nothing (some implementations might do this)
      });
      
      const progress: UserProgress = {
        userId: 'silent-fail-user',
        completedModules: [],
        quizScores: {},
        totalTime: 0,
        lastAccessed: Date.now(),
        notes: []
      };
      
      saveUserProgress(progress);
      expect(silentFailCount).toBe(1);
      
      // Test 3: removeItem might not exist
      delete (localStorageMock as any).removeItem;
      expect(() => clearUserProgress()).not.toThrow();
    });

    it('should handle data corruption at byte level', () => {
      // Simulate various types of data corruption
      const corruptedDataScenarios = [
        '{"userId":"test","completedModules":[', // Truncated JSON
        '{"userId":"test","completedModules":["module1"],"invalid":"', // Incomplete string
        '{"userId":"test","completedModules":["module1"],"quizScores":{', // Truncated object
        '\uFFFD{"userId":"test"}', // BOM or invalid Unicode
        '{"userId":"test\x00"}', // Null bytes in string
        '{"userId":"test","completedModules":null}', // Null where array expected
      ];

      corruptedDataScenarios.forEach((corruptedData, index) => {
        // Reset error spy for each scenario
        consoleErrorSpy.mockClear();
        
        store.jungAppUserProgress = corruptedData;
        
        const result = loadUserProgress();
        
        // Should handle gracefully - either return null or the partially parsed data
        if (result === null) {
          expect(consoleErrorSpy).toHaveBeenCalled();
        }
        
        // Should not crash the application
        expect(() => {
          loadModuleProgress('module1');
          saveModuleProgress('module1', true, 85);
        }).not.toThrow();
      });
    });

    it('should handle notes with complex nested structures', () => {
      const complexNotes: Note[] = [{
        id: 'complex-note',
        moduleId: 'advanced-module',
        content: 'Note with complex data',
        timestamp: Date.now(),
        tags: ['complex', 'nested'],
        mediaAttachments: [{
          id: 'attachment-1',
          type: 'video',
          url: 'https://example.com/video.mp4',
          filename: 'lecture.mp4',
          size: 50000000,
          metadata: {
            duration: 1800,
            resolution: { width: 1920, height: 1080 },
            codec: 'h264',
            transcriptions: [
              { language: 'en', text: 'Hello world', timestamp: 0 },
              { language: 'es', text: 'Hola mundo', timestamp: 0 }
            ]
          }
        }],
        linkedConcepts: ['concept1', 'concept2'],
        references: [{
          type: 'book',
          author: 'Carl Jung',
          title: 'The Archetypes and the Collective Unconscious',
          page: 123,
          isbn: '978-0-691-01833-1'
        }]
      }];

      // Should handle complex nested structures
      expect(() => saveNotes(complexNotes)).not.toThrow();
      
      store.jungAppNotes = JSON.stringify(complexNotes);
      const loaded = loadNotes();
      
      expect(loaded).toEqual(complexNotes);
      expect(loaded[0].mediaAttachments?.[0].metadata?.transcriptions).toHaveLength(2);
    });
  });

  describe('Performance and Optimization', () => {
    it('should handle large data sets efficiently', () => {
      const largeProgress: UserProgress = {
        userId: 'performance-user',
        completedModules: Array.from({ length: 10000 }, (_, i) => `module-${i}`),
        quizScores: {},
        totalTime: 99999999,
        lastAccessed: Date.now(),
        notes: Array.from({ length: 5000 }, (_, i) => ({
          id: `note-${i}`,
          moduleId: `module-${i % 100}`,
          content: `Performance test note ${i} `.repeat(10),
          timestamp: Date.now() + i
        }))
      };

      // Generate quiz scores for all modules
      for (let i = 0; i < 10000; i++) {
        largeProgress.quizScores[`module-${i}`] = Math.floor(Math.random() * 100);
      }

      const start = performance.now();
      saveUserProgress(largeProgress);
      const saveTime = performance.now() - start;

      const loadStart = performance.now();
      const loaded = loadUserProgress();
      const loadTime = performance.now() - loadStart;

      // Performance should be reasonable (less than 1 second for large data)
      expect(saveTime).toBeLessThan(1000);
      expect(loadTime).toBeLessThan(1000);
      expect(loaded?.completedModules).toHaveLength(10000);
      expect(loaded?.notes).toHaveLength(5000);
    });

    it('should handle frequent read/write operations efficiently', () => {
      const start = performance.now();

      // Simulate frequent updates (like auto-save)
      for (let i = 0; i < 100; i++) {
        saveModuleProgress(`module-${i}`, i % 2 === 0, Math.random() * 100);
        loadModuleProgress(`module-${i}`);
      }

      const duration = performance.now() - start;
      
      // 100 read/write cycles should complete quickly
      expect(duration).toBeLessThan(500);
    });

    it('should not cause memory leaks with repeated operations', () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      const progress: UserProgress = {
        userId: 'memory-test-user',
        completedModules: [],
        quizScores: {},
        totalTime: 0,
        lastAccessed: Date.now(),
        notes: []
      };

      // Perform many operations
      for (let i = 0; i < 1000; i++) {
        saveUserProgress({ ...progress, userId: `user-${i}` });
        loadUserProgress();
        saveNotes([{
          id: `note-${i}`,
          moduleId: 'test-module',
          content: `Test content ${i}`,
          timestamp: Date.now()
        }]);
        loadNotes();
      }

      // Force garbage collection if available
      if ((global as any).gc) {
        (global as any).gc();
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Memory usage should not increase significantly (allow 5MB increase)
      if (initialMemory > 0) {
        expect(finalMemory - initialMemory).toBeLessThan(5 * 1024 * 1024);
      }
    });

    it('should optimize JSON serialization for repeated operations', () => {
      const baseProgress: UserProgress = {
        userId: 'optimization-user',
        completedModules: [],
        quizScores: {},
        totalTime: 0,
        lastAccessed: Date.now(),
        notes: []
      };

      // Track JSON.stringify calls to ensure we're not serializing unnecessarily
      const originalStringify = JSON.stringify;
      let stringifyCallCount = 0;
      jest.spyOn(JSON, 'stringify').mockImplementation((...args) => {
        stringifyCallCount++;
        return originalStringify(...args);
      });

      // Multiple saves of the same data
      for (let i = 0; i < 10; i++) {
        saveUserProgress(baseProgress);
      }

      expect(stringifyCallCount).toBe(10); // Should call stringify for each save

      JSON.stringify = originalStringify;
    });
  });

  describe('Data Integrity and Validation', () => {
    it('should maintain data integrity across save/load cycles', () => {
      const originalProgress: UserProgress = {
        userId: 'integrity-user',
        completedModules: ['module1', 'module2'],
        quizScores: { module1: 85, module2: 92.5 },
        totalTime: 3661, // 1 hour, 1 minute, 1 second
        lastAccessed: 1700000000000,
        notes: [{
          id: 'integrity-note',
          moduleId: 'module1',
          content: 'Test note with special chars: "quotes", \'apostrophes\', & symbols!',
          timestamp: 1700000000001,
          tags: ['integrity', 'testing', '特殊文字']
        }]
      };

      // Save and load multiple times
      for (let i = 0; i < 10; i++) {
        saveUserProgress(originalProgress);
        const loaded = loadUserProgress();
        
        // Data should be identical after each cycle
        expect(loaded).toEqual(originalProgress);
        expect(loaded?.userId).toBe(originalProgress.userId);
        expect(loaded?.completedModules).toEqual(originalProgress.completedModules);
        expect(loaded?.quizScores).toEqual(originalProgress.quizScores);
        expect(loaded?.totalTime).toBe(originalProgress.totalTime);
        expect(loaded?.lastAccessed).toBe(originalProgress.lastAccessed);
        expect(loaded?.notes).toEqual(originalProgress.notes);
      }
    });

    it('should preserve data types correctly', () => {
      const typedData = {
        string: 'text',
        number: 42,
        float: 3.14159,
        boolean: true,
        null: null,
        array: [1, 2, 3],
        object: { nested: 'value' },
        date: new Date().getTime(), // Dates become numbers in JSON
        undefined: undefined // Will be lost in JSON
      };

      const progress: UserProgress = {
        userId: 'type-test-user',
        completedModules: ['module1'],
        quizScores: { module1: 88.5 },
        totalTime: 3600,
        lastAccessed: Date.now(),
        notes: [],
        customData: typedData as any
      };

      saveUserProgress(progress);
      const loaded = loadUserProgress();

      expect(typeof loaded?.customData?.string).toBe('string');
      expect(typeof loaded?.customData?.number).toBe('number');
      expect(typeof loaded?.customData?.float).toBe('number');
      expect(typeof loaded?.customData?.boolean).toBe('boolean');
      expect(loaded?.customData?.null).toBeNull();
      expect(Array.isArray(loaded?.customData?.array)).toBe(true);
      expect(typeof loaded?.customData?.object).toBe('object');
      expect(typeof loaded?.customData?.date).toBe('number');
      expect(loaded?.customData?.undefined).toBeUndefined();
    });

    it('should handle edge cases in module progress data', () => {
      const edgeCases = [
        { moduleId: '', completed: true, score: 100 },
        { moduleId: '   ', completed: false, score: 0 },
        { moduleId: 'module-with-very-long-name-that-exceeds-normal-limits'.repeat(10), completed: true, score: 75 },
        { moduleId: '🎓📚', completed: true, score: 95 },
        { moduleId: 'module\nwith\nnewlines', completed: false, score: undefined },
        { moduleId: 'module"with"quotes', completed: true, score: 88 },
        { moduleId: "module'with'apostrophes", completed: true, score: 92 }
      ];

      edgeCases.forEach(({ moduleId, completed, score }) => {
        // Clear previous data
        store = {};
        
        // Save module progress
        saveModuleProgress(moduleId, completed, score);
        
        // Load and verify
        const result = loadModuleProgress(moduleId);
        
        if (moduleId.trim() === '') {
          // Empty/whitespace module IDs should return default values
          expect(result.completed).toBe(false);
          expect(result.score).toBeUndefined();
        } else {
          expect(result.completed).toBe(completed);
          expect(result.score).toBe(score);
        }
      });
    });
  });
});