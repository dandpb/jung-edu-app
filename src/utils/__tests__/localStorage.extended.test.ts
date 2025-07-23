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

describe('localStorage utilities - Extended Tests', () => {
  // Mock localStorage
  let localStorageMock: { [key: string]: string };
  const mockGetItem = jest.fn();
  const mockSetItem = jest.fn();
  const mockRemoveItem = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock = {};
    
    mockGetItem.mockImplementation((key: string) => localStorageMock[key] || null);
    mockSetItem.mockImplementation((key: string, value: string) => {
      localStorageMock[key] = value;
    });
    mockRemoveItem.mockImplementation((key: string) => {
      delete localStorageMock[key];
    });

    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: mockGetItem,
        setItem: mockSetItem,
        removeItem: mockRemoveItem
      },
      writable: true
    });

    // Spy on console methods
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('saveUserProgress', () => {
    it('should save valid user progress to localStorage', () => {
      const progress: UserProgress = {
        userId: 'test-user-123',
        completedModules: ['module1', 'module2'],
        quizScores: { module1: 85, module2: 92 },
        totalTime: 3600,
        lastAccessed: Date.now(),
        notes: []
      };

      saveUserProgress(progress);

      expect(mockSetItem).toHaveBeenCalledWith(
        'jungAppUserProgress',
        JSON.stringify(progress)
      );
    });

    it('should handle localStorage quota exceeded error', () => {
      const progress: UserProgress = {
        userId: 'test-user',
        completedModules: [],
        quizScores: {},
        totalTime: 0,
        lastAccessed: Date.now(),
        notes: []
      };

      mockSetItem.mockImplementation(() => {
        throw new DOMException('QuotaExceededError');
      });

      saveUserProgress(progress);

      expect(console.error).toHaveBeenCalledWith(
        'Failed to save user progress:',
        expect.any(DOMException)
      );
    });

    it('should handle serialization errors', () => {
      const circularRef: any = { userId: 'test' };
      circularRef.circular = circularRef;

      saveUserProgress(circularRef as UserProgress);

      expect(console.error).toHaveBeenCalledWith(
        'Failed to save user progress:',
        expect.any(Error)
      );
    });
  });

  describe('loadUserProgress', () => {
    it('should load and parse user progress from localStorage', () => {
      const progress: UserProgress = {
        userId: 'test-user',
        completedModules: ['module1'],
        quizScores: { module1: 90 },
        totalTime: 1800,
        lastAccessed: Date.now(),
        notes: []
      };

      localStorageMock['jungAppUserProgress'] = JSON.stringify(progress);

      const loaded = loadUserProgress();
      expect(loaded).toEqual(progress);
    });

    it('should return null when no progress exists', () => {
      const loaded = loadUserProgress();
      expect(loaded).toBeNull();
    });

    it('should handle invalid JSON gracefully', () => {
      localStorageMock['jungAppUserProgress'] = 'invalid json {]';

      const loaded = loadUserProgress();
      
      expect(loaded).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        'Failed to load user progress:',
        expect.any(SyntaxError)
      );
    });

    it('should handle localStorage access errors', () => {
      mockGetItem.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const loaded = loadUserProgress();
      
      expect(loaded).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        'Failed to load user progress:',
        expect.any(Error)
      );
    });
  });

  describe('clearUserProgress', () => {
    it('should remove user progress from localStorage', () => {
      localStorageMock['jungAppUserProgress'] = 'some data';

      clearUserProgress();

      expect(mockRemoveItem).toHaveBeenCalledWith('jungAppUserProgress');
      expect(localStorageMock['jungAppUserProgress']).toBeUndefined();
    });

    it('should handle removal errors gracefully', () => {
      mockRemoveItem.mockImplementation(() => {
        throw new Error('Cannot remove item');
      });

      clearUserProgress();

      expect(console.error).toHaveBeenCalledWith(
        'Failed to clear user progress:',
        expect.any(Error)
      );
    });
  });

  describe('saveNotes', () => {
    it('should save notes array to localStorage', () => {
      const notes: Note[] = [
        { 
          id: 'note1', 
          moduleId: 'module1', 
          content: 'Test note 1',
          createdAt: Date.now(),
          updatedAt: Date.now()
        },
        { 
          id: 'note2', 
          moduleId: 'module2', 
          content: 'Test note 2',
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
      ];

      saveNotes(notes);

      expect(mockSetItem).toHaveBeenCalledWith(
        'jungAppNotes',
        JSON.stringify(notes)
      );
    });

    it('should handle empty notes array', () => {
      saveNotes([]);

      expect(mockSetItem).toHaveBeenCalledWith(
        'jungAppNotes',
        '[]'
      );
    });

    it('should handle save errors', () => {
      mockSetItem.mockImplementation(() => {
        throw new Error('Storage failed');
      });

      const notes: Note[] = [{ 
        id: 'note1', 
        moduleId: 'module1', 
        content: 'Test',
        createdAt: Date.now(),
        updatedAt: Date.now()
      }];

      saveNotes(notes);

      expect(console.error).toHaveBeenCalledWith(
        'Failed to save notes:',
        expect.any(Error)
      );
    });
  });

  describe('loadNotes', () => {
    it('should load and parse notes from localStorage', () => {
      const notes: Note[] = [
        { 
          id: 'note1', 
          moduleId: 'module1', 
          content: 'Test note',
          createdAt: 1234567890,
          updatedAt: 1234567890
        }
      ];

      localStorageMock['jungAppNotes'] = JSON.stringify(notes);

      const loaded = loadNotes();
      expect(loaded).toEqual(notes);
    });

    it('should return empty array when no notes exist', () => {
      const loaded = loadNotes();
      expect(loaded).toEqual([]);
    });

    it('should handle corrupted data gracefully', () => {
      localStorageMock['jungAppNotes'] = '{"invalid": "json"';

      const loaded = loadNotes();
      
      expect(loaded).toEqual([]);
      expect(console.error).toHaveBeenCalledWith(
        'Failed to load notes:',
        expect.any(SyntaxError)
      );
    });
  });

  describe('saveModuleProgress', () => {
    it('should create new progress if none exists', () => {
      saveModuleProgress('module1', true, 95);

      const savedData = JSON.parse(localStorageMock['jungAppUserProgress']);
      expect(savedData).toMatchObject({
        userId: 'default-user',
        completedModules: ['module1'],
        quizScores: { module1: 95 },
        totalTime: 0
      });
      expect(savedData.lastAccessed).toBeDefined();
    });

    it('should update existing progress', () => {
      const existingProgress: UserProgress = {
        userId: 'existing-user',
        completedModules: ['module1'],
        quizScores: { module1: 80 },
        totalTime: 1000,
        lastAccessed: Date.now() - 10000,
        notes: []
      };

      localStorageMock['jungAppUserProgress'] = JSON.stringify(existingProgress);

      saveModuleProgress('module2', true, 90);

      const savedData = JSON.parse(localStorageMock['jungAppUserProgress']);
      expect(savedData.completedModules).toEqual(['module1', 'module2']);
      expect(savedData.quizScores).toEqual({ module1: 80, module2: 90 });
      expect(savedData.userId).toBe('existing-user');
    });

    it('should not duplicate completed modules', () => {
      const existingProgress: UserProgress = {
        userId: 'user',
        completedModules: ['module1'],
        quizScores: {},
        totalTime: 0,
        lastAccessed: Date.now(),
        notes: []
      };

      localStorageMock['jungAppUserProgress'] = JSON.stringify(existingProgress);

      saveModuleProgress('module1', true);

      const savedData = JSON.parse(localStorageMock['jungAppUserProgress']);
      expect(savedData.completedModules).toEqual(['module1']);
    });

    it('should handle completion without score', () => {
      saveModuleProgress('module1', true);

      const savedData = JSON.parse(localStorageMock['jungAppUserProgress']);
      expect(savedData.completedModules).toContain('module1');
      expect(savedData.quizScores.module1).toBeUndefined();
    });

    it('should handle score without completion', () => {
      saveModuleProgress('module1', false, 75);

      const savedData = JSON.parse(localStorageMock['jungAppUserProgress']);
      expect(savedData.completedModules).not.toContain('module1');
      expect(savedData.quizScores.module1).toBe(75);
    });

    it('should handle save errors gracefully', () => {
      mockGetItem.mockImplementation(() => {
        throw new Error('Load failed');
      });

      saveModuleProgress('module1', true, 90);

      // When save fails during load, it logs the load error
      expect(console.error).toHaveBeenCalledWith(
        'Failed to load user progress:',
        expect.any(Error)
      );
    });
  });

  describe('loadModuleProgress', () => {
    it('should load module progress correctly', () => {
      const progress: UserProgress = {
        userId: 'user',
        completedModules: ['module1', 'module2'],
        quizScores: { module1: 85, module2: 90 },
        totalTime: 0,
        lastAccessed: Date.now(),
        notes: []
      };

      localStorageMock['jungAppUserProgress'] = JSON.stringify(progress);

      const module1Progress = loadModuleProgress('module1');
      expect(module1Progress).toEqual({ completed: true, score: 85 });

      const module3Progress = loadModuleProgress('module3');
      expect(module3Progress).toEqual({ completed: false });
    });

    it('should return defaults when no progress exists', () => {
      const progress = loadModuleProgress('module1');
      expect(progress).toEqual({ completed: false });
    });

    it('should handle load errors gracefully', () => {
      mockGetItem.mockImplementation(() => {
        throw new Error('Access denied');
      });

      const progress = loadModuleProgress('module1');
      
      expect(progress).toEqual({ completed: false });
      // loadModuleProgress calls loadUserProgress which logs this error
      expect(console.error).toHaveBeenCalledWith(
        'Failed to load user progress:',
        expect.any(Error)
      );
    });
  });

  describe('Edge cases and boundary conditions', () => {
    it('should handle very large data gracefully', () => {
      const largeNotes: Note[] = Array(1000).fill(null).map((_, i) => ({
        id: `note${i}`,
        moduleId: `module${i % 10}`,
        content: 'A'.repeat(1000), // Very long content
        createdAt: Date.now(),
        updatedAt: Date.now()
      }));

      saveNotes(largeNotes);
      const loaded = loadNotes();
      
      expect(loaded.length).toBe(1000);
    });

    it('should handle special characters in content', () => {
      const specialNotes: Note[] = [{
        id: 'special',
        moduleId: 'module1',
        content: 'Test with "quotes", \'apostrophes\', \n newlines, \t tabs, and emoji 🧠',
        createdAt: Date.now(),
        updatedAt: Date.now()
      }];

      saveNotes(specialNotes);
      const loaded = loadNotes();
      
      expect(loaded[0].content).toBe(specialNotes[0].content);
    });

    it('should handle concurrent operations', () => {
      const progress1: UserProgress = {
        userId: 'user1',
        completedModules: ['module1'],
        quizScores: {},
        totalTime: 0,
        lastAccessed: Date.now(),
        notes: []
      };

      // Simulate concurrent saves
      saveUserProgress(progress1);
      saveModuleProgress('module2', true, 88);
      
      const loaded = loadUserProgress();
      expect(loaded?.completedModules).toContain('module2');
      expect(loaded?.quizScores.module2).toBe(88);
    });

    it('should handle undefined and null values appropriately', () => {
      // Test with undefined values in progress
      const progress: any = {
        userId: undefined,
        completedModules: null,
        quizScores: undefined,
        totalTime: null,
        lastAccessed: Date.now(),
        notes: undefined
      };

      saveUserProgress(progress);
      const loaded = loadUserProgress();
      
      expect(loaded).toBeTruthy();
    });
  });
});