import { ModuleService } from '../../../services/modules/moduleService';
import { EducationalModule } from '../../../types/schema';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('ModuleService CRUD Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  const mockModule: EducationalModule = {
    id: 'test-123',
    title: 'Introduction to Jungian Psychology',
    description: 'A comprehensive introduction to Jung\'s theories and analytical psychology',
    content: {
      introduction: 'This module provides a comprehensive introduction to Carl Jung\'s analytical psychology, exploring the fundamental concepts that shaped his approach to understanding the human psyche.',
      sections: [{
        id: 'section-1',
        title: 'Introduction to Jung',
        content: 'Carl Gustav Jung (1875-1961) was a Swiss psychiatrist and psychoanalyst who founded analytical psychology.',
        order: 0,
        keyTerms: [],
        images: [],
        interactiveElements: [],
        estimatedTime: 10
      }],
      summary: 'Summary of Jung\'s key concepts',
      keyTakeaways: ['Understanding the collective unconscious', 'Archetypes and their role']
    },
    videos: [],
    mindMaps: [],
    quiz: {
      id: 'quiz-test-123',
      title: 'Test Quiz',
      questions: [{
        id: 'q1',
        type: 'multiple-choice',
        question: 'What is analytical psychology?',
        options: [
          { id: '0', text: 'A psychological approach by Jung', isCorrect: true },
          { id: '1', text: 'A physical therapy method', isCorrect: false },
          { id: '2', text: 'A medical procedure', isCorrect: false },
          { id: '3', text: 'A teaching method', isCorrect: false }
        ],
        correctAnswer: 0,
        explanation: 'Analytical psychology is the approach developed by Carl Jung.',
        difficulty: 'beginner'
      }]
    },
    bibliography: [],
    filmReferences: [],
    tags: ['jung', 'psychology'],
    timeEstimate: { hours: 1, minutes: 0 },
    difficultyLevel: 'intermediate' as const,
    metadata: {
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z',
      version: '1.0.0',
      author: { id: 'test-author', name: 'Test Author' },
      status: 'published' as const,
      language: 'en'
    }
  };

  describe('getAllModules', () => {
    it('should return empty array when no modules exist', async () => {
      localStorageMock.getItem.mockReturnValue(null);
      const modules = await ModuleService.getAllModules();
      expect(modules).toEqual([]);
    });

    it('should return all stored modules', async () => {
      const modules = [mockModule];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(modules));
      
      const result = await ModuleService.getAllModules();
      expect(result).toEqual(modules);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('jungAppEducationalModules');
    });

    it('should handle localStorage errors gracefully', async () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      const modules = await ModuleService.getAllModules();
      expect(modules).toEqual([]);
    });
  });

  describe('getModuleById', () => {
    it('should return null when module not found', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify([]));
      const module = await ModuleService.getModuleById('non-existent');
      expect(module).toBeNull();
    });

    it('should return module when found', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify([mockModule]));
      const module = await ModuleService.getModuleById('test-123');
      expect(module).toEqual(mockModule);
    });
  });

  describe('createModule', () => {
    it('should create a new module with generated ID', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify([]));
      
      const newModule = { ...mockModule };
      delete (newModule as any).id;
      
      const created = await ModuleService.createModule(newModule);
      
      expect(created.id).toBeDefined();
      expect(created.id).not.toBe('');
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should validate module before creation', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify([]));
      
      // Since createModule fills in defaults, let's create a module and then manually trigger validation failure
      // by testing a module that fails our additional validation rules
      const invalidModule = { 
        id: 'test-invalid',
        title: 'Test Module',
        content: { introduction: '', sections: [] }, // Valid but empty content
        timeEstimate: { hours: -1, minutes: -5 }, // Invalid negative time
        difficultyLevel: 'beginner',
        metadata: {
          status: 'draft',
          language: 'en',
          author: { id: 'test', name: 'Test' }
        }
      } as any;
      
      await expect(ModuleService.createModule(invalidModule))
        .rejects.toThrow('Time estimate must be non-negative');
    });
  });

  describe('updateModule', () => {
    it('should update existing module', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify([mockModule]));
      
      const updated = await ModuleService.updateModule('test-123', {
        title: 'Updated Title',
        // Include required fields to pass validation
        timeEstimate: { hours: 1, minutes: 0 },
        difficultyLevel: 'intermediate'
      });
      
      expect(updated?.title).toBe('Updated Title');
      expect(updated?.metadata.updatedAt).toBeDefined();
    });

    it('should throw error when module not found', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify([]));
      
      await expect(ModuleService.updateModule('non-existent', {
        title: 'Updated'
      })).rejects.toThrow('Module with ID non-existent not found');
    });
  });

  describe('deleteModule', () => {
    it('should delete existing module', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify([mockModule]));
      
      const result = await ModuleService.deleteModule('test-123');
      expect(result).toBe(true);
      
      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedData).toHaveLength(0);
    });

    it('should return false when module not found', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify([]));
      
      const result = await ModuleService.deleteModule('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('searchModules', () => {
    it('should search modules by title', async () => {
      const modules = [
        mockModule,
        { ...mockModule, id: 'test-456', title: 'Advanced Jung' }
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(modules));
      
      const results = await ModuleService.searchModules({ 
        query: 'Jungian Psychology' 
      });
      
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('test-123');
    });

    it('should filter by difficulty level', async () => {
      const modules = [
        mockModule,
        { ...mockModule, id: 'test-456', difficultyLevel: 'beginner' }
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(modules));
      
      const results = await ModuleService.searchModules({ 
        difficultyLevel: 'intermediate' 
      });
      
      expect(results).toHaveLength(1);
      expect(results[0].difficultyLevel).toBe('intermediate');
    });

    it('should filter by tags', async () => {
      const modules = [
        mockModule,
        { ...mockModule, id: 'test-456', tags: ['freud', 'psychoanalysis'] }
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(modules));
      
      const results = await ModuleService.searchModules({ 
        tags: ['jung'] 
      });
      
      expect(results).toHaveLength(1);
      expect(results[0].tags).toContain('jung');
    });
  });

  describe('draft management', () => {
    it('should save draft module', async () => {
      const draft = { ...mockModule };
      await ModuleService.saveDraft(draft);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'jungAppDraftModules',
        expect.stringContaining(draft.id)
      );
    });
  });
});