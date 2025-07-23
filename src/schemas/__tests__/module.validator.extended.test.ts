import { ModuleValidator, validateEducationalModule, sanitizeModule } from '../module.validator';
import { EducationalModule } from '../module.schema';

describe('ModuleValidator - Extended Edge Case Tests', () => {
  describe('ModuleValidator.validate', () => {
    it('should validate a complete valid module', () => {
      const validModule: EducationalModule = {
        id: 'module-1',
        title: 'Introduction to Jung',
        description: 'An overview of Jungian psychology',
        content: {
          introduction: 'Welcome to Jungian psychology',
          sections: [
            {
              title: 'The Unconscious',
              content: 'Jung believed in collective unconscious',
              order: 1
            }
          ]
        },
        timeEstimate: { hours: 2, minutes: 30 },
        difficultyLevel: 'Intermediate',
        version: '1.0.0',
        metadata: {
          author: 'Test Author',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: ['jung', 'psychology'],
          language: 'en'
        }
      };

      const result = ModuleValidator.validate(validModule);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should catch missing required fields', () => {
      const invalidModule = {} as EducationalModule;
      
      const result = ModuleValidator.validate(invalidModule);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Module ID is required');
      expect(result.errors).toContain('Module title is required');
      expect(result.errors).toContain('Module content is required');
      expect(result.errors).toContain('Time estimate is required');
      expect(result.errors).toContain('Difficulty level is required');
    });

    it('should validate empty title strings', () => {
      const module: EducationalModule = {
        id: 'test',
        title: '   ',
        content: { introduction: 'test' },
        timeEstimate: { hours: 1, minutes: 0 },
        difficultyLevel: 'Beginner'
      };

      const result = ModuleValidator.validate(module);
      expect(result.errors).toContain('Module title is required');
    });

    it('should catch negative time estimates', () => {
      const module: EducationalModule = {
        id: 'test',
        title: 'Test Module',
        content: { introduction: 'test' },
        timeEstimate: { hours: -1, minutes: 30 },
        difficultyLevel: 'Beginner'
      };

      const result = ModuleValidator.validate(module);
      expect(result.errors).toContain('Time estimate must be non-negative');
    });

    it('should catch negative minutes', () => {
      const module: EducationalModule = {
        id: 'test',
        title: 'Test Module',
        content: { introduction: 'test' },
        timeEstimate: { hours: 1, minutes: -30 },
        difficultyLevel: 'Beginner'
      };

      const result = ModuleValidator.validate(module);
      expect(result.errors).toContain('Time estimate must be non-negative');
    });

    it('should validate content structure', () => {
      const module: EducationalModule = {
        id: 'test',
        title: 'Test Module',
        content: {} as any, // Empty content object
        timeEstimate: { hours: 1, minutes: 0 },
        difficultyLevel: 'Beginner'
      };

      const result = ModuleValidator.validate(module);
      expect(result.errors).toContain('Module content must have introduction or sections');
    });

    it('should accept content with only introduction', () => {
      const module: EducationalModule = {
        id: 'test',
        title: 'Test Module',
        content: { introduction: 'Just an introduction' },
        timeEstimate: { hours: 1, minutes: 0 },
        difficultyLevel: 'Beginner'
      };

      const result = ModuleValidator.validate(module);
      expect(result.valid).toBe(true);
    });

    it('should accept content with only sections', () => {
      const module: EducationalModule = {
        id: 'test',
        title: 'Test Module',
        content: { 
          sections: [
            { title: 'Section 1', content: 'Content 1', order: 1 }
          ]
        },
        timeEstimate: { hours: 1, minutes: 0 },
        difficultyLevel: 'Beginner'
      };

      const result = ModuleValidator.validate(module);
      expect(result.valid).toBe(true);
    });

    it('should handle null/undefined values gracefully', () => {
      const module: any = {
        id: null,
        title: undefined,
        content: null,
        timeEstimate: null,
        difficultyLevel: undefined
      };

      const result = ModuleValidator.validate(module);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle extreme values', () => {
      const module: EducationalModule = {
        id: 'a'.repeat(1000), // Very long ID
        title: 'Title'.repeat(100), // Very long title
        content: { introduction: 'x'.repeat(10000) }, // Very long content
        timeEstimate: { hours: 999999, minutes: 59 }, // Very large time
        difficultyLevel: 'Beginner'
      };

      const result = ModuleValidator.validate(module);
      expect(result.valid).toBe(true); // Current validator doesn't check max lengths
    });

    it('should handle special characters in strings', () => {
      const module: EducationalModule = {
        id: 'test-<script>alert("xss")</script>',
        title: 'Title with "quotes" and \'apostrophes\'',
        content: { introduction: 'Content with \n newlines \t tabs' },
        timeEstimate: { hours: 1, minutes: 0 },
        difficultyLevel: 'Beginner'
      };

      const result = ModuleValidator.validate(module);
      expect(result.valid).toBe(true); // Validator doesn't sanitize
    });

    it('should handle fractional time values', () => {
      const module: EducationalModule = {
        id: 'test',
        title: 'Test Module',
        content: { introduction: 'test' },
        timeEstimate: { hours: 1.5, minutes: 30.7 },
        difficultyLevel: 'Beginner'
      };

      const result = ModuleValidator.validate(module);
      expect(result.valid).toBe(true); // Accepts decimals
    });
  });

  describe('validateEducationalModule', () => {
    it('should transform validation result to expected format', () => {
      const invalidModule = {} as EducationalModule;
      
      const result = validateEducationalModule(invalidModule);
      expect(result.isValid).toBe(false);
      expect(result.errors).toBeInstanceOf(Array);
      expect(result.errors[0]).toHaveProperty('message');
    });

    it('should return empty errors array for valid module', () => {
      const validModule: EducationalModule = {
        id: 'test',
        title: 'Test',
        content: { introduction: 'test' },
        timeEstimate: { hours: 1, minutes: 0 },
        difficultyLevel: 'Beginner'
      };

      const result = validateEducationalModule(validModule);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should preserve all error messages', () => {
      const module: EducationalModule = {
        id: '',
        title: '',
        content: null as any,
        timeEstimate: { hours: -1, minutes: -1 },
        difficultyLevel: ''
      };

      const result = validateEducationalModule(module);
      expect(result.errors.length).toBeGreaterThan(3);
      result.errors.forEach(error => {
        expect(error.message).toBeTruthy();
      });
    });
  });

  describe('sanitizeModule', () => {
    it('should trim title and description', () => {
      const module: EducationalModule = {
        id: 'test',
        title: '  Untrimmed Title  ',
        description: '  Untrimmed Description  ',
        content: { introduction: 'test' },
        timeEstimate: { hours: 1, minutes: 0 },
        difficultyLevel: 'Beginner'
      };

      const sanitized = sanitizeModule(module);
      expect(sanitized.title).toBe('Untrimmed Title');
      expect(sanitized.description).toBe('Untrimmed Description');
    });

    it('should handle missing title and description', () => {
      const module: any = {
        id: 'test',
        content: { introduction: 'test' },
        timeEstimate: { hours: 1, minutes: 0 },
        difficultyLevel: 'Beginner'
      };

      const sanitized = sanitizeModule(module);
      expect(sanitized.title).toBe('');
      expect(sanitized.description).toBe('');
    });

    it('should preserve other fields unchanged', () => {
      const module: EducationalModule = {
        id: 'test-id',
        title: 'Title',
        content: { 
          introduction: 'Intro',
          sections: [{ title: 'S1', content: 'C1', order: 1 }]
        },
        timeEstimate: { hours: 2, minutes: 30 },
        difficultyLevel: 'Advanced',
        metadata: {
          author: 'Author',
          tags: ['tag1', 'tag2']
        }
      };

      const sanitized = sanitizeModule(module);
      expect(sanitized.id).toBe(module.id);
      expect(sanitized.content).toEqual(module.content);
      expect(sanitized.timeEstimate).toEqual(module.timeEstimate);
      expect(sanitized.difficultyLevel).toBe(module.difficultyLevel);
      expect(sanitized.metadata).toEqual(module.metadata);
    });

    it('should handle null/undefined gracefully', () => {
      const module: any = {
        id: 'test',
        title: null,
        description: undefined,
        content: { introduction: 'test' },
        timeEstimate: { hours: 1, minutes: 0 },
        difficultyLevel: 'Beginner'
      };

      const sanitized = sanitizeModule(module);
      expect(sanitized.title).toBe('');
      expect(sanitized.description).toBe('');
    });

    it('should handle whitespace-only strings', () => {
      const module: EducationalModule = {
        id: 'test',
        title: '   \n\t  ',
        description: '   \r\n   ',
        content: { introduction: 'test' },
        timeEstimate: { hours: 1, minutes: 0 },
        difficultyLevel: 'Beginner'
      };

      const sanitized = sanitizeModule(module);
      expect(sanitized.title).toBe('');
      expect(sanitized.description).toBe('');
    });

    it('should not mutate the original module', () => {
      const module: EducationalModule = {
        id: 'test',
        title: '  Original  ',
        description: '  Description  ',
        content: { introduction: 'test' },
        timeEstimate: { hours: 1, minutes: 0 },
        difficultyLevel: 'Beginner'
      };

      const originalTitle = module.title;
      const originalDesc = module.description;
      
      sanitizeModule(module);
      
      expect(module.title).toBe(originalTitle);
      expect(module.description).toBe(originalDesc);
    });

    it('should handle modules with circular references', () => {
      const module: any = {
        id: 'test',
        title: 'Title',
        content: { introduction: 'test' },
        timeEstimate: { hours: 1, minutes: 0 },
        difficultyLevel: 'Beginner'
      };
      module.circular = module; // Create circular reference

      // Should not throw
      expect(() => sanitizeModule(module)).not.toThrow();
    });
  });
});