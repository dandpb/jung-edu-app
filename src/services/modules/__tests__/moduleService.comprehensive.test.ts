/**
 * Comprehensive Unit Tests for ModuleService
 * Covers all CRUD operations, validation, search, export/import functionality
 */

import { ModuleService } from '../moduleService';
import { EducationalModule, ModuleStatus, DifficultyLevel } from '../../../schemas/module.schema';
import { validateEducationalModule } from '../../../schemas/module.validator';
import { v4 as uuidv4 } from 'uuid';

// Mock dependencies
jest.mock('../../../schemas/module.validator');
jest.mock('uuid');

const mockValidateEducationalModule = validateEducationalModule as jest.MockedFunction<typeof validateEducationalModule>;
const mockUuidv4 = uuidv4 as jest.MockedFunction<typeof uuidv4>;

describe('ModuleService - Comprehensive Unit Tests', () => {
  // Mock localStorage
  const mockLocalStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  };

  Object.defineProperty(global, 'localStorage', {
    value: mockLocalStorage,
    writable: true
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    mockValidateEducationalModule.mockReturnValue({ isValid: true, errors: [] });
    mockUuidv4.mockReturnValue('mock-uuid-123');
    
    // Ensure Date works normally
    jest.restoreAllMocks();
    mockValidateEducationalModule.mockReturnValue({ isValid: true, errors: [] });
    mockUuidv4.mockReturnValue('mock-uuid-123');
  });

  describe('getAllModules', () => {
    it('should return empty array when no modules stored', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = await ModuleService.getAllModules();

      expect(result).toEqual([]);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('jungAppEducationalModules');
    });

    it('should return parsed modules from localStorage', async () => {
      const mockModules = [
        { id: '1', title: 'Module 1' },
        { id: '2', title: 'Module 2' }
      ];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockModules));

      const result = await ModuleService.getAllModules();

      expect(result).toEqual(mockModules);
    });

    it('should handle JSON parsing errors gracefully', async () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-json');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await ModuleService.getAllModules();

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Error loading modules:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('getModuleById', () => {
    it('should return module when found', async () => {
      const mockModule = { id: 'test-id', title: 'Test Module' };
      const mockModules = [mockModule, { id: 'other-id', title: 'Other Module' }];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockModules));

      const result = await ModuleService.getModuleById('test-id');

      expect(result).toEqual(mockModule);
    });

    it('should return null when module not found', async () => {
      const mockModules = [{ id: 'other-id', title: 'Other Module' }];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockModules));

      const result = await ModuleService.getModuleById('nonexistent-id');

      expect(result).toBeNull();
    });

    it('should return null when no modules exist', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = await ModuleService.getModuleById('any-id');

      expect(result).toBeNull();
    });
  });

  describe('createModule', () => {
    const mockModuleData = {
      title: 'New Module',
      description: 'Test description',
      tags: ['psychology', 'jung']
    };

    it('should create module with valid data', async () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([]));

      const result = await ModuleService.createModule(mockModuleData);

      expect(result).toMatchObject({
        id: 'mock-uuid-123',
        title: 'New Module',
        description: 'Test description',
        tags: ['psychology', 'jung'],
        difficultyLevel: DifficultyLevel.BEGINNER,
        metadata: {
          status: ModuleStatus.DRAFT,
          language: 'en',
          author: {
            id: 'system',
            name: 'System Generated'
          }
        }
      });

      expect(mockValidateEducationalModule).toHaveBeenCalledWith(result);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'jungAppEducationalModules',
        expect.stringContaining('"id":"mock-uuid-123"')
      );
    });

    it('should use provided ID when specified', async () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([]));
      const moduleWithId = { ...mockModuleData, id: 'custom-id' };

      const result = await ModuleService.createModule(moduleWithId);

      expect(result.id).toBe('custom-id');
    });

    it('should throw error when validation fails', async () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([]));
      mockValidateEducationalModule.mockReturnValue({
        isValid: false,
        errors: [{ message: 'Title is required' }]
      });

      await expect(ModuleService.createModule(mockModuleData)).rejects.toThrow(
        'Module validation failed: Title is required'
      );

      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });

    it('should set default values for missing properties', async () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([]));
      const minimalData = { title: 'Minimal Module' };

      const result = await ModuleService.createModule(minimalData);

      expect(result).toMatchObject({
        title: 'Minimal Module',
        description: '',
        content: { introduction: '', sections: [] },
        videos: [],
        quiz: { id: '', title: '', questions: [] },
        bibliography: [],
        filmReferences: [],
        tags: [],
        difficultyLevel: DifficultyLevel.BEGINNER,
        timeEstimate: { hours: 0, minutes: 30 }
      });
    });
  });

  describe('updateModule', () => {
    const existingModule = {
      id: 'existing-id',
      title: 'Existing Module',
      metadata: {
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        version: '1.0.0',
        status: ModuleStatus.DRAFT,
        language: 'en',
        author: { id: 'user', name: 'User' }
      }
    };

    it('should update existing module', async () => {
      const mockModules = [existingModule];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockModules));
      const mockDate = new Date('2023-01-02T00:00:00Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

      const updates = { title: 'Updated Module', description: 'Updated description' };
      const result = await ModuleService.updateModule('existing-id', updates);

      expect(result).toMatchObject({
        id: 'existing-id',
        title: 'Updated Module',
        description: 'Updated description',
        metadata: expect.objectContaining({
          updatedAt: '2023-01-02T00:00:00.000Z'
        })
      });

      expect(mockValidateEducationalModule).toHaveBeenCalled();
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'jungAppEducationalModules',
        expect.stringContaining('"title":"Updated Module"')
      );
    });

    it('should throw error when module not found', async () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([]));

      const updates = { title: 'Updated Module' };
      await expect(ModuleService.updateModule('nonexistent-id', updates)).rejects.toThrow(
        'Module with ID nonexistent-id not found'
      );

      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });

    it('should throw error when validation fails', async () => {
      const mockModules = [existingModule];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockModules));
      mockValidateEducationalModule.mockReturnValue({
        isValid: false,
        errors: [{ message: 'Invalid update' }]
      });

      const updates = { title: '' }; // Invalid title
      await expect(ModuleService.updateModule('existing-id', updates)).rejects.toThrow(
        'Module validation failed: Invalid update'
      );
    });

    it('should preserve module ID even if provided in updates', async () => {
      const mockModules = [existingModule];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockModules));

      const updates = { id: 'different-id', title: 'Updated Module' };
      const result = await ModuleService.updateModule('existing-id', updates);

      expect(result.id).toBe('existing-id');
    });
  });

  describe('deleteModule', () => {
    it('should delete existing module', async () => {
      const mockModules = [
        { id: 'module-1', title: 'Module 1' },
        { id: 'module-2', title: 'Module 2' }
      ];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockModules));

      const result = await ModuleService.deleteModule('module-1');

      expect(result).toBe(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'jungAppEducationalModules',
        JSON.stringify([{ id: 'module-2', title: 'Module 2' }])
      );
    });

    it('should return false when module not found', async () => {
      const mockModules = [{ id: 'module-1', title: 'Module 1' }];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockModules));

      const result = await ModuleService.deleteModule('nonexistent-id');

      expect(result).toBe(false);
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });

    it('should handle empty module list', async () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([]));

      const result = await ModuleService.deleteModule('any-id');

      expect(result).toBe(false);
    });
  });

  describe('searchModules', () => {
    const mockModules = [
      {
        id: '1',
        title: 'Jung Psychology',
        description: 'Introduction to Jung',
        tags: ['psychology', 'jung'],
        difficultyLevel: DifficultyLevel.BEGINNER,
        timeEstimate: { hours: 1, minutes: 30 },
        metadata: { 
          author: { name: 'Dr. Smith' },
          status: ModuleStatus.PUBLISHED,
          language: 'en'
        }
      },
      {
        id: '2',
        title: 'Advanced Analytics',
        description: 'Deep dive into analytics',
        tags: ['analytics', 'advanced'],
        difficultyLevel: DifficultyLevel.ADVANCED,
        timeEstimate: { hours: 3, minutes: 0 },
        metadata: {
          author: { name: 'Prof. Johnson' },
          status: ModuleStatus.DRAFT,
          language: 'pt'
        }
      },
      {
        id: '3',
        title: 'Psychology Basics',
        description: 'Basic psychological concepts',
        tags: ['psychology', 'basics'],
        difficultyLevel: DifficultyLevel.INTERMEDIATE,
        timeEstimate: { hours: 0, minutes: 45 },
        metadata: {
          author: { name: 'Dr. Smith' },
          status: ModuleStatus.PUBLISHED,
          language: 'en'
        }
      }
    ];

    beforeEach(() => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockModules));
    });

    it('should search by query text', async () => {
      const result = await ModuleService.searchModules({ query: 'jung' });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('should search by tags', async () => {
      const result = await ModuleService.searchModules({ tags: ['psychology'] });

      expect(result).toHaveLength(2);
      expect(result.map(m => m.id)).toEqual(['1', '3']);
    });

    it('should filter by difficulty level', async () => {
      const result = await ModuleService.searchModules({ 
        difficultyLevel: DifficultyLevel.ADVANCED 
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2');
    });

    it('should filter by duration range', async () => {
      const result = await ModuleService.searchModules({ 
        minDuration: 60,  // 1 hour
        maxDuration: 120  // 2 hours
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1'); // 1.5 hours
    });

    it('should filter by author', async () => {
      const result = await ModuleService.searchModules({ author: 'Dr. Smith' });

      expect(result).toHaveLength(2);
      expect(result.map(m => m.id)).toEqual(['1', '3']);
    });

    it('should filter by status', async () => {
      const result = await ModuleService.searchModules({ 
        status: ModuleStatus.PUBLISHED 
      });

      expect(result).toHaveLength(2);
      expect(result.map(m => m.id)).toEqual(['1', '3']);
    });

    it('should filter by language', async () => {
      const result = await ModuleService.searchModules({ language: 'pt' });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2');
    });

    it('should combine multiple filters', async () => {
      const result = await ModuleService.searchModules({
        query: 'psychology',
        difficultyLevel: DifficultyLevel.BEGINNER,
        author: 'Dr. Smith'
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('should return empty array when no matches found', async () => {
      const result = await ModuleService.searchModules({ 
        query: 'nonexistent topic' 
      });

      expect(result).toEqual([]);
    });
  });

  describe('Draft Management', () => {
    describe('saveDraft', () => {
      it('should save new draft', async () => {
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify([]));
        const draftData = { id: 'draft-1', title: 'Draft Module' };

        await ModuleService.saveDraft(draftData);

        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'jungAppDraftModules',
          expect.stringContaining('"id":"draft-1"')
        );
      });

      it('should update existing draft', async () => {
        const existingDrafts = [
          { id: 'draft-1', title: 'Old Title' },
          { id: 'draft-2', title: 'Other Draft' }
        ];
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingDrafts));

        const updatedData = { id: 'draft-1', title: 'New Title' };
        await ModuleService.saveDraft(updatedData);

        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'jungAppDraftModules',
          expect.stringContaining('"title":"New Title"')
        );
      });

      it('should set default metadata for drafts', async () => {
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify([]));
        const draftData = { id: 'draft-1', title: 'Draft Module' };

        await ModuleService.saveDraft(draftData);

        const savedCall = mockLocalStorage.setItem.mock.calls.find(
          call => call[0] === 'jungAppDraftModules'
        );
        const savedData = JSON.parse(savedCall[1]);
        
        expect(savedData[0].metadata).toMatchObject({
          status: ModuleStatus.DRAFT,
          language: 'en',
          author: { id: 'user', name: 'User' }
        });
      });
    });

    describe('getDrafts', () => {
      it('should return drafts from localStorage', async () => {
        const mockDrafts = [{ id: 'draft-1', title: 'Draft 1' }];
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockDrafts));

        const result = await ModuleService.getDrafts();

        expect(result).toEqual(mockDrafts);
        expect(mockLocalStorage.getItem).toHaveBeenCalledWith('jungAppDraftModules');
      });

      it('should return empty array when no drafts', async () => {
        mockLocalStorage.getItem.mockReturnValue(null);

        const result = await ModuleService.getDrafts();

        expect(result).toEqual([]);
      });

      it('should handle JSON parsing errors', async () => {
        mockLocalStorage.getItem.mockReturnValue('invalid-json');
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        const result = await ModuleService.getDrafts();

        expect(result).toEqual([]);
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
      });
    });

    describe('deleteDraft', () => {
      it('should delete existing draft', async () => {
        const mockDrafts = [
          { id: 'draft-1', title: 'Draft 1' },
          { id: 'draft-2', title: 'Draft 2' }
        ];
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockDrafts));

        const result = await ModuleService.deleteDraft('draft-1');

        expect(result).toBe(true);
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'jungAppDraftModules',
          JSON.stringify([{ id: 'draft-2', title: 'Draft 2' }])
        );
      });

      it('should return false when draft not found', async () => {
        const mockDrafts = [{ id: 'draft-1', title: 'Draft 1' }];
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockDrafts));

        const result = await ModuleService.deleteDraft('nonexistent-id');

        expect(result).toBe(false);
        expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
      });
    });
  });

  describe('Import/Export', () => {
    const mockModules = [
      { id: '1', title: 'Module 1' },
      { id: '2', title: 'Module 2' }
    ];

    describe('exportModules', () => {
      beforeEach(() => {
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockModules));
      });

      it('should export all modules when no IDs specified', async () => {
        const mockDate = new Date('2023-01-01T00:00:00Z');
        jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

        const result = await ModuleService.exportModules();
        const parsed = JSON.parse(result);

        expect(parsed).toMatchObject({
          version: '1.0.0',
          exportDate: '2023-01-01T00:00:00.000Z',
          modules: mockModules
        });
      });

      it('should export specific modules when IDs provided', async () => {
        const result = await ModuleService.exportModules(['1']);
        const parsed = JSON.parse(result);

        expect(parsed.modules).toHaveLength(1);
        expect(parsed.modules[0].id).toBe('1');
      });

      it('should format JSON with proper indentation', async () => {
        const result = await ModuleService.exportModules();

        expect(result).toMatch(/\n/); // Should contain newlines for formatting
        expect(result).toMatch(/  /); // Should contain indentation
      });
    });

    describe('importModules', () => {
      const validImportData = {
        version: '1.0.0',
        modules: [
          { id: 'new-1', title: 'New Module 1' },
          { id: 'new-2', title: 'New Module 2' }
        ]
      };

      it('should import modules without overwrite', async () => {
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify([
          { id: 'existing-1', title: 'Existing Module' }
        ]));

        const result = await ModuleService.importModules(
          JSON.stringify(validImportData), 
          false
        );

        expect(result).toBe(2); // 2 new modules imported
        
        const savedCall = mockLocalStorage.setItem.mock.calls.find(
          call => call[0] === 'jungAppEducationalModules'
        );
        const savedModules = JSON.parse(savedCall[1]);
        expect(savedModules).toHaveLength(3); // existing + 2 new
      });

      it('should import modules with overwrite', async () => {
        const result = await ModuleService.importModules(
          JSON.stringify(validImportData), 
          true
        );

        expect(result).toBe(2);
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'jungAppEducationalModules',
          JSON.stringify(validImportData.modules)
        );
      });

      it('should skip duplicate modules on merge', async () => {
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify([
          { id: 'new-1', title: 'Existing Module' }
        ]));

        const result = await ModuleService.importModules(
          JSON.stringify(validImportData), 
          false
        );

        expect(result).toBe(1); // Only 1 new module (new-2)
      });

      it('should throw error for invalid JSON', async () => {
        await expect(ModuleService.importModules('invalid-json')).rejects.toThrow(
          'Import failed:'
        );
      });

      it('should throw error for invalid format', async () => {
        const invalidData = { version: '1.0.0', modules: 'not-an-array' };

        await expect(ModuleService.importModules(JSON.stringify(invalidData))).rejects.toThrow(
          'Invalid import format: modules must be an array'
        );
      });

      it('should validate all modules before importing', async () => {
        mockValidateEducationalModule
          .mockReturnValueOnce({ isValid: true, errors: [] })
          .mockReturnValueOnce({ isValid: false, errors: [{ message: 'Invalid module' }] });

        await expect(ModuleService.importModules(JSON.stringify(validImportData))).rejects.toThrow(
          'Module new-2 validation failed: Invalid module'
        );
      });
    });
  });

  describe('getStatistics', () => {
    const mockModules = [
      {
        difficultyLevel: DifficultyLevel.BEGINNER,
        timeEstimate: { hours: 1, minutes: 30 },
        metadata: { status: ModuleStatus.PUBLISHED, language: 'en' }
      },
      {
        difficultyLevel: DifficultyLevel.ADVANCED,
        timeEstimate: { hours: 2, minutes: 0 },
        metadata: { status: ModuleStatus.DRAFT, language: 'en' }
      },
      {
        difficultyLevel: DifficultyLevel.BEGINNER,
        timeEstimate: { hours: 0, minutes: 45 },
        metadata: { status: ModuleStatus.PUBLISHED, language: 'pt' }
      }
    ];

    it('should calculate comprehensive statistics', async () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockModules));

      const stats = await ModuleService.getStatistics();

      expect(stats).toMatchObject({
        total: 3,
        byStatus: {
          [ModuleStatus.DRAFT]: 1,
          [ModuleStatus.PUBLISHED]: 2,
          [ModuleStatus.REVIEW]: 0,
          [ModuleStatus.ARCHIVED]: 0
        },
        byDifficulty: {
          [DifficultyLevel.BEGINNER]: 2,
          [DifficultyLevel.INTERMEDIATE]: 0,
          [DifficultyLevel.ADVANCED]: 1
        },
        byLanguage: {
          'en': 2,
          'pt': 1
        },
        avgDuration: 85 // (90 + 120 + 45) / 3 = 85
      });
    });

    it('should handle empty module list', async () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([]));

      const stats = await ModuleService.getStatistics();

      expect(stats.total).toBe(0);
      expect(stats.avgDuration).toBe(0);
    });
  });

  describe('clearAllModules', () => {
    it('should clear both modules and drafts', async () => {
      await ModuleService.clearAllModules();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('jungAppEducationalModules');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('jungAppDraftModules');
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully in getAllModules', async () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const result = await ModuleService.getAllModules();

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should handle localStorage errors in save operations', async () => {
      // Note: ModuleService currently throws on localStorage errors rather than gracefully handling them
      // This test documents the current behavior - in production, consider adding error handling
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([]));
      
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage full');
      });

      // Currently throws - this documents existing behavior
      await expect(ModuleService.createModule({ title: 'Test' })).rejects.toThrow('Storage full');
    });
  });
});