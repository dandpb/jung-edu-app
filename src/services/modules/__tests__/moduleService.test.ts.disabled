/**
 * Comprehensive test suite for ModuleService
 * Targets 90%+ coverage for maximum impact on overall project coverage
 */

import { ModuleService } from '../moduleService';
import { EducationalModule, DifficultyLevel, ModuleStatus, ModuleSearchCriteria } from '../../../schemas/module.schema';
import { validateEducationalModule } from '../../../schemas/module.validator';

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
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Mock the validator
jest.mock('../../../schemas/module.validator');
const mockValidateEducationalModule = validateEducationalModule as jest.MockedFunction<typeof validateEducationalModule>;

describe('ModuleService', () => {
  const mockModule: EducationalModule = {
    id: 'test-module-1',
    title: 'Test Module',
    description: 'Test Description',
    content: {
      introduction: 'Test intro',
      sections: [
        {
          id: 'section-1',
          title: 'Section 1',
          content: 'Section content',
          order: 0
        }
      ]
    },
    videos: [
      {
        id: 'video-1',
        title: 'Test Video',
        url: 'https://example.com/video',
        duration: 300,
        description: 'Video description'
      }
    ],
    quiz: {
      id: 'quiz-1',
      title: 'Test Quiz',
      questions: [
        {
          id: 'q1',
          type: 'multiple-choice',
          question: 'Test question?',
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 0,
          explanation: 'Test explanation',
          points: 10,
          order: 0
        }
      ]
    },
    bibliography: [
      {
        id: 'bib-1',
        type: 'book',
        authors: ['Jung, C.G.'],
        title: 'Test Book',
        year: 1950,
        publisher: 'Test Publisher'
      }
    ],
    filmReferences: [
      {
        id: 'film-1',
        title: 'Test Film',
        director: 'Test Director',
        year: 2020,
        relevance: 'Test relevance'
      }
    ],
    tags: ['psychology', 'jung', 'test'],
    difficultyLevel: DifficultyLevel.INTERMEDIATE,
    timeEstimate: { hours: 2, minutes: 30 },
    metadata: {
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z',
      version: '1.0.0',
      status: ModuleStatus.PUBLISHED,
      language: 'en',
      author: {
        id: 'author-1',
        name: 'Test Author'
      }
    }
  };

  beforeEach(() => {
    mockLocalStorage.clear();
    jest.clearAllMocks();
    
    // Default validation success
    mockValidateEducationalModule.mockReturnValue({
      isValid: true,
      errors: []
    });
  });

  describe('getAllModules', () => {
    it('should return empty array when no modules exist', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const result = await ModuleService.getAllModules();
      
      expect(result).toEqual([]);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('jungAppEducationalModules');
    });

    it('should return parsed modules from localStorage', async () => {
      const modules = [mockModule];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(modules));
      
      const result = await ModuleService.getAllModules();
      
      expect(result).toEqual(modules);
    });

    it('should handle JSON parse errors gracefully', async () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const result = await ModuleService.getAllModules();
      
      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Error loading modules:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should handle localStorage exceptions', async () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const result = await ModuleService.getAllModules();
      
      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('getModuleById', () => {
    it('should return module when found', async () => {
      const modules = [mockModule];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(modules));
      
      const result = await ModuleService.getModuleById('test-module-1');
      
      expect(result).toEqual(mockModule);
    });

    it('should return null when module not found', async () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([]));
      
      const result = await ModuleService.getModuleById('non-existent');
      
      expect(result).toBeNull();
    });

    it('should return null when localStorage is empty', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const result = await ModuleService.getModuleById('test-module-1');
      
      expect(result).toBeNull();
    });
  });

  describe('createModule', () => {
    it('should create module with minimal data', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const result = await ModuleService.createModule({});
      
      expect(result.title).toBe('Untitled Module');
      expect(result.description).toBe('');
      expect(result.id).toBeDefined();
      expect(result.difficultyLevel).toBe(DifficultyLevel.BEGINNER);
      expect(result.metadata.status).toBe(ModuleStatus.DRAFT);
      expect(mockValidateEducationalModule).toHaveBeenCalled();
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('should create module with provided data', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      const moduleData = {
        title: 'Custom Title',
        description: 'Custom Description',
        difficultyLevel: DifficultyLevel.ADVANCED
      };
      
      const result = await ModuleService.createModule(moduleData);
      
      expect(result.title).toBe('Custom Title');
      expect(result.description).toBe('Custom Description');
      expect(result.difficultyLevel).toBe(DifficultyLevel.ADVANCED);
    });

    it('should preserve provided ID', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      const customId = 'custom-id-123';
      
      const result = await ModuleService.createModule({ id: customId });
      
      expect(result.id).toBe(customId);
    });

    it('should set timestamps correctly', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      const beforeCreate = new Date().toISOString();
      
      const result = await ModuleService.createModule({});
      
      expect(result.metadata.createdAt).toBeDefined();
      expect(result.metadata.updatedAt).toBeDefined();
      expect(new Date(result.metadata.createdAt).getTime()).toBeGreaterThanOrEqual(new Date(beforeCreate).getTime());
    });

    it('should add module to existing modules', async () => {
      const existingModules = [mockModule];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingModules));
      
      await ModuleService.createModule({ title: 'New Module' });
      
      const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      expect(savedData).toHaveLength(2);
      expect(savedData[1].title).toBe('New Module');
    });

    it('should throw error when validation fails', async () => {
      mockValidateEducationalModule.mockReturnValue({
        isValid: false,
        errors: [{ message: 'Invalid title' }]
      });
      
      await expect(ModuleService.createModule({})).rejects.toThrow('Module validation failed: Invalid title');
    });

    it('should handle multiple validation errors', async () => {
      mockValidateEducationalModule.mockReturnValue({
        isValid: false,
        errors: [
          { message: 'Invalid title' },
          { message: 'Missing content' }
        ]
      });
      
      await expect(ModuleService.createModule({})).rejects.toThrow('Module validation failed: Invalid title, Missing content');
    });

    it('should preserve custom metadata fields', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      const customMetadata = {
        customField: 'custom value',
        status: ModuleStatus.REVIEW,
        language: 'pt-BR'
      };
      
      const result = await ModuleService.createModule({
        metadata: customMetadata
      });
      
      expect(result.metadata.status).toBe(ModuleStatus.REVIEW);
      expect(result.metadata.language).toBe('pt-BR');
      expect((result.metadata as any).customField).toBe('custom value');
    });
  });

  describe('updateModule', () => {
    beforeEach(() => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([mockModule]));
    });

    it('should update existing module', async () => {
      const updates = { title: 'Updated Title' };
      
      const result = await ModuleService.updateModule('test-module-1', updates);
      
      expect(result.title).toBe('Updated Title');
      expect(result.id).toBe('test-module-1'); // ID should not change
      expect(result.metadata.updatedAt).not.toBe(mockModule.metadata.updatedAt);
    });

    it('should preserve existing metadata when updating', async () => {
      const updates = { title: 'New Title' };
      
      const result = await ModuleService.updateModule('test-module-1', updates);
      
      expect(result.metadata.createdAt).toBe(mockModule.metadata.createdAt);
      expect(result.metadata.version).toBe(mockModule.metadata.version);
      expect(result.metadata.author).toEqual(mockModule.metadata.author);
    });

    it('should merge metadata updates', async () => {
      const updates = {
        metadata: {
          status: ModuleStatus.ARCHIVED,
          language: 'pt-BR'
        }
      };
      
      const result = await ModuleService.updateModule('test-module-1', updates);
      
      expect(result.metadata.status).toBe(ModuleStatus.ARCHIVED);
      expect(result.metadata.language).toBe('pt-BR');
      expect(result.metadata.createdAt).toBe(mockModule.metadata.createdAt);
      expect(result.metadata.author).toEqual(mockModule.metadata.author);
    });

    it('should throw error when module not found', async () => {
      await expect(ModuleService.updateModule('non-existent', {}))
        .rejects.toThrow('Module with ID non-existent not found');
    });

    it('should throw error when validation fails', async () => {
      mockValidateEducationalModule.mockReturnValue({
        isValid: false,
        errors: [{ message: 'Validation error' }]
      });
      
      await expect(ModuleService.updateModule('test-module-1', { title: 'Invalid' }))
        .rejects.toThrow('Module validation failed: Validation error');
    });

    it('should preserve ID even if update tries to change it', async () => {
      const updates = { id: 'different-id', title: 'New Title' };
      
      const result = await ModuleService.updateModule('test-module-1', updates);
      
      expect(result.id).toBe('test-module-1'); // Original ID preserved
      expect(result.title).toBe('New Title');
    });

    it('should update module in storage', async () => {
      await ModuleService.updateModule('test-module-1', { title: 'Updated' });
      
      const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      expect(savedData[0].title).toBe('Updated');
    });
  });

  describe('deleteModule', () => {
    it('should delete existing module', async () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([mockModule]));
      
      const result = await ModuleService.deleteModule('test-module-1');
      
      expect(result).toBe(true);
      const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      expect(savedData).toHaveLength(0);
    });

    it('should return false when module not found', async () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([mockModule]));
      
      const result = await ModuleService.deleteModule('non-existent');
      
      expect(result).toBe(false);
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });

    it('should handle empty storage', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const result = await ModuleService.deleteModule('test-module-1');
      
      expect(result).toBe(false);
    });

    it('should delete only the specified module', async () => {
      const module2 = { ...mockModule, id: 'test-module-2', title: 'Module 2' };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([mockModule, module2]));
      
      const result = await ModuleService.deleteModule('test-module-1');
      
      expect(result).toBe(true);
      const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      expect(savedData).toHaveLength(1);
      expect(savedData[0].id).toBe('test-module-2');
    });
  });

  describe('searchModules', () => {
    const module2: EducationalModule = {
      ...mockModule,
      id: 'module-2',
      title: 'Advanced Jung Theory',
      description: 'Deep dive into collective unconscious',
      tags: ['advanced', 'collective', 'unconscious'],
      difficultyLevel: DifficultyLevel.ADVANCED,
      timeEstimate: { hours: 4, minutes: 0 },
      metadata: {
        ...mockModule.metadata,
        status: ModuleStatus.DRAFT,
        language: 'pt-BR',
        author: { id: 'author-2', name: 'Different Author' }
      }
    };

    beforeEach(() => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([mockModule, module2]));
    });

    it('should return all modules when no criteria', async () => {
      const result = await ModuleService.searchModules({});
      
      expect(result).toHaveLength(2);
    });

    it('should filter by query in title', async () => {
      const result = await ModuleService.searchModules({ query: 'Advanced' });
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('module-2');
    });

    it('should filter by query in description', async () => {
      const result = await ModuleService.searchModules({ query: 'collective' });
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('module-2');
    });

    it('should filter by query in tags', async () => {
      const result = await ModuleService.searchModules({ query: 'psychology' });
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('test-module-1');
    });

    it('should be case insensitive', async () => {
      const result = await ModuleService.searchModules({ query: 'ADVANCED' });
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('module-2');
    });

    it('should filter by single tag', async () => {
      const result = await ModuleService.searchModules({ tags: ['advanced'] });
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('module-2');
    });

    it('should filter by multiple tags (OR logic)', async () => {
      const result = await ModuleService.searchModules({ tags: ['psychology', 'advanced'] });
      
      expect(result).toHaveLength(2);
    });

    it('should filter by difficulty level', async () => {
      const result = await ModuleService.searchModules({ difficultyLevel: DifficultyLevel.ADVANCED });
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('module-2');
    });

    it('should filter by minimum duration', async () => {
      const result = await ModuleService.searchModules({ minDuration: 200 }); // 200 minutes
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('module-2'); // 4 hours = 240 minutes
    });

    it('should filter by maximum duration', async () => {
      const result = await ModuleService.searchModules({ maxDuration: 200 }); // 200 minutes
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('test-module-1'); // 2.5 hours = 150 minutes
    });

    it('should filter by author', async () => {
      const result = await ModuleService.searchModules({ author: 'Different Author' });
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('module-2');
    });

    it('should filter by status', async () => {
      const result = await ModuleService.searchModules({ status: ModuleStatus.DRAFT });
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('module-2');
    });

    it('should filter by language', async () => {
      const result = await ModuleService.searchModules({ language: 'pt-BR' });
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('module-2');
    });

    it('should combine multiple filters', async () => {
      const result = await ModuleService.searchModules({
        query: 'Advanced',
        difficultyLevel: DifficultyLevel.ADVANCED,
        status: ModuleStatus.DRAFT
      });
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('module-2');
    });

    it('should return empty array when no matches', async () => {
      const result = await ModuleService.searchModules({ query: 'nonexistent' });
      
      expect(result).toHaveLength(0);
    });

    it('should handle modules without timeEstimate', async () => {
      const moduleWithoutTime = { ...mockModule, timeEstimate: undefined };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([moduleWithoutTime]));
      
      const result = await ModuleService.searchModules({ minDuration: 10 });
      
      expect(result).toHaveLength(0);
    });
  });

  describe('saveDraft', () => {
    it('should save new draft', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      const draftData = { id: 'draft-1', title: 'Draft Title' };
      
      await ModuleService.saveDraft(draftData);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'jungAppDraftModules',
        expect.stringContaining('Draft Title')
      );
    });

    it('should update existing draft', async () => {
      const existingDraft = { id: 'draft-1', title: 'Old Title' };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([existingDraft]));
      
      await ModuleService.saveDraft({ id: 'draft-1', title: 'New Title' });
      
      const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      expect(savedData).toHaveLength(1);
      expect(savedData[0].title).toBe('New Title');
    });

    it('should set draft metadata correctly', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      await ModuleService.saveDraft({ id: 'draft-1' });
      
      const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      expect(savedData[0].metadata.status).toBe(ModuleStatus.DRAFT);
      expect(savedData[0].metadata.updatedAt).toBeDefined();
    });

    it('should preserve custom metadata', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      const customMetadata = { customField: 'value' };
      
      await ModuleService.saveDraft({
        id: 'draft-1',
        metadata: customMetadata
      });
      
      const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      expect((savedData[0].metadata as any).customField).toBe('value');
    });
  });

  describe('getDrafts', () => {
    it('should return empty array when no drafts exist', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const result = await ModuleService.getDrafts();
      
      expect(result).toEqual([]);
    });

    it('should return parsed drafts', async () => {
      const drafts = [{ id: 'draft-1', title: 'Draft' }];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(drafts));
      
      const result = await ModuleService.getDrafts();
      
      expect(result).toEqual(drafts);
    });

    it('should handle JSON parse errors', async () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const result = await ModuleService.getDrafts();
      
      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('deleteDraft', () => {
    it('should delete existing draft', async () => {
      const drafts = [{ id: 'draft-1' }, { id: 'draft-2' }];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(drafts));
      
      const result = await ModuleService.deleteDraft('draft-1');
      
      expect(result).toBe(true);
      const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      expect(savedData).toHaveLength(1);
      expect(savedData[0].id).toBe('draft-2');
    });

    it('should return false when draft not found', async () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([]));
      
      const result = await ModuleService.deleteDraft('non-existent');
      
      expect(result).toBe(false);
    });
  });

  describe('exportModules', () => {
    beforeEach(() => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([mockModule]));
    });

    it('should export all modules when no IDs specified', async () => {
      const result = await ModuleService.exportModules();
      
      const parsed = JSON.parse(result);
      expect(parsed.version).toBe('1.0.0');
      expect(parsed.exportDate).toBeDefined();
      expect(parsed.modules).toHaveLength(1);
    });

    it('should export specific modules when IDs provided', async () => {
      const module2 = { ...mockModule, id: 'module-2' };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([mockModule, module2]));
      
      const result = await ModuleService.exportModules(['test-module-1']);
      
      const parsed = JSON.parse(result);
      expect(parsed.modules).toHaveLength(1);
      expect(parsed.modules[0].id).toBe('test-module-1');
    });

    it('should handle empty module list', async () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([]));
      
      const result = await ModuleService.exportModules();
      
      const parsed = JSON.parse(result);
      expect(parsed.modules).toHaveLength(0);
    });

    it('should format JSON with proper indentation', async () => {
      const result = await ModuleService.exportModules();
      
      expect(result).toContain('\n');
      expect(result).toContain('  '); // Should have indentation
    });
  });

  describe('importModules', () => {
    const validImportData = {
      version: '1.0.0',
      modules: [mockModule]
    };

    it('should import modules with overwrite', async () => {
      const existingModule = { ...mockModule, id: 'existing-1' };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([existingModule]));
      
      const result = await ModuleService.importModules(JSON.stringify(validImportData), true);
      
      expect(result).toBe(1);
      const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      expect(savedData).toHaveLength(1);
      expect(savedData[0].id).toBe('test-module-1');
    });

    it('should import modules without overwrite (merge)', async () => {
      const existingModule = { ...mockModule, id: 'existing-1' };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([existingModule]));
      
      const result = await ModuleService.importModules(JSON.stringify(validImportData), false);
      
      expect(result).toBe(1);
      const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      expect(savedData).toHaveLength(2);
    });

    it('should skip duplicate modules when merging', async () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([mockModule]));
      
      const result = await ModuleService.importModules(JSON.stringify(validImportData), false);
      
      expect(result).toBe(0); // No new modules added
    });

    it('should throw error for invalid JSON', async () => {
      await expect(ModuleService.importModules('invalid json'))
        .rejects.toThrow('Import failed:');
    });

    it('should throw error when modules is not array', async () => {
      const invalidData = { modules: 'not an array' };
      
      await expect(ModuleService.importModules(JSON.stringify(invalidData)))
        .rejects.toThrow('Invalid import format: modules must be an array');
    });

    it('should validate all modules before importing', async () => {
      mockValidateEducationalModule.mockReturnValue({
        isValid: false,
        errors: [{ message: 'Invalid module' }]
      });
      
      await expect(ModuleService.importModules(JSON.stringify(validImportData)))
        .rejects.toThrow('Module test-module-1 validation failed: Invalid module');
    });

    it('should handle missing modules property', async () => {
      const dataWithoutModules = { version: '1.0.0' };
      
      const result = await ModuleService.importModules(JSON.stringify(dataWithoutModules), true);
      
      expect(result).toBe(0);
    });
  });

  describe('getStatistics', () => {
    const statsModules: EducationalModule[] = [
      {
        ...mockModule,
        difficultyLevel: DifficultyLevel.BEGINNER,
        timeEstimate: { hours: 1, minutes: 30 },
        metadata: {
          ...mockModule.metadata,
          status: ModuleStatus.PUBLISHED,
          language: 'en'
        }
      },
      {
        ...mockModule,
        id: 'module-2',
        difficultyLevel: DifficultyLevel.INTERMEDIATE,
        timeEstimate: { hours: 2, minutes: 0 },
        metadata: {
          ...mockModule.metadata,
          status: ModuleStatus.DRAFT,
          language: 'pt-BR'
        }
      },
      {
        ...mockModule,
        id: 'module-3',
        difficultyLevel: DifficultyLevel.ADVANCED,
        timeEstimate: { hours: 3, minutes: 30 },
        metadata: {
          ...mockModule.metadata,
          status: ModuleStatus.PUBLISHED,
          language: 'en'
        }
      }
    ];

    beforeEach(() => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(statsModules));
    });

    it('should calculate basic statistics', async () => {
      const result = await ModuleService.getStatistics();
      
      expect(result.total).toBe(3);
    });

    it('should count modules by status', async () => {
      const result = await ModuleService.getStatistics();
      
      expect(result.byStatus[ModuleStatus.PUBLISHED]).toBe(2);
      expect(result.byStatus[ModuleStatus.DRAFT]).toBe(1);
      expect(result.byStatus[ModuleStatus.REVIEW]).toBe(0);
      expect(result.byStatus[ModuleStatus.ARCHIVED]).toBe(0);
    });

    it('should count modules by difficulty', async () => {
      const result = await ModuleService.getStatistics();
      
      expect(result.byDifficulty[DifficultyLevel.BEGINNER]).toBe(1);
      expect(result.byDifficulty[DifficultyLevel.INTERMEDIATE]).toBe(1);
      expect(result.byDifficulty[DifficultyLevel.ADVANCED]).toBe(1);
    });

    it('should count modules by language', async () => {
      const result = await ModuleService.getStatistics();
      
      expect(result.byLanguage.en).toBe(2);
      expect(result.byLanguage['pt-BR']).toBe(1);
    });

    it('should calculate average duration', async () => {
      const result = await ModuleService.getStatistics();
      
      // (90 + 120 + 210) / 3 = 140 minutes
      expect(result.avgDuration).toBe(140);
    });

    it('should handle empty modules list', async () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([]));
      
      const result = await ModuleService.getStatistics();
      
      expect(result.total).toBe(0);
      expect(result.avgDuration).toBe(0);
    });

    it('should initialize all counters to zero', async () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([]));
      
      const result = await ModuleService.getStatistics();
      
      Object.values(result.byStatus).forEach(count => {
        expect(count).toBe(0);
      });
      Object.values(result.byDifficulty).forEach(count => {
        expect(count).toBe(0);
      });
    });
  });

  describe('clearAllModules', () => {
    it('should remove both modules and drafts from localStorage', async () => {
      await ModuleService.clearAllModules();
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('jungAppEducationalModules');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('jungAppDraftModules');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledTimes(2);
    });
  });
});