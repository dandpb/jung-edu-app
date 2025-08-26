/**
 * Comprehensive Unit Tests for module.validator.ts
 * Tests: Module validation logic, edge cases, error handling, and complex data structures
 * Coverage Target: 100%
 */

import { 
  ModuleValidator, 
  validateEducationalModule, 
  sanitizeModule 
} from '../module.validator';
import { EducationalModule, DifficultyLevel, ModuleStatus } from '../module.schema';

// Helper function to create a valid module
const createValidModule = (overrides?: Partial<EducationalModule>): EducationalModule => ({
  id: 'test-module-123',
  title: 'Test Educational Module',
  description: 'A comprehensive test module for validation',
  content: {
    introduction: 'This is an introduction to the test module',
    sections: [
      {
        id: 'section-1',
        title: 'First Section',
        content: 'Content for the first section',
        order: 1
      }
    ],
    summary: 'Module summary'
  },
  videos: [],
  mindMaps: [],
  quiz: {
    id: 'quiz-1',
    title: 'Test Quiz',
    description: 'A test quiz',
    questions: [],
    passingScore: 70
  },
  bibliography: [],
  filmReferences: [],
  tags: ['jung', 'psychology'],
  difficultyLevel: DifficultyLevel.BEGINNER,
  timeEstimate: {
    hours: 2,
    minutes: 30,
    description: '2.5 hours including videos'
  },
  metadata: {
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-02T00:00:00Z',
    version: '1.0.0',
    author: {
      id: 'author-1',
      name: 'Test Author',
      email: 'author@test.com'
    },
    status: ModuleStatus.PUBLISHED,
    language: 'en'
  },
  ...overrides
});

describe('ModuleValidator - Comprehensive Test Suite', () => {
  describe('ModuleValidator.validate', () => {
    it('should validate a complete, valid module successfully', () => {
      const validModule = createValidModule();
      
      const result = ModuleValidator.validate(validModule);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject module without ID', () => {
      const moduleWithoutId = createValidModule({ id: '' });
      
      const result = ModuleValidator.validate(moduleWithoutId);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Module ID is required');
    });

    it('should reject module with null/undefined ID', () => {
      const moduleWithNullId = createValidModule({ id: null as any });
      const moduleWithUndefinedId = createValidModule({ id: undefined as any });
      
      expect(ModuleValidator.validate(moduleWithNullId).valid).toBe(false);
      expect(ModuleValidator.validate(moduleWithUndefinedId).valid).toBe(false);
    });

    it('should reject module without title', () => {
      const moduleWithoutTitle = createValidModule({ title: '' });
      
      const result = ModuleValidator.validate(moduleWithoutTitle);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Module title is required');
    });

    it('should reject module with whitespace-only title', () => {
      const moduleWithWhitespaceTitle = createValidModule({ title: '   \t\n   ' });
      
      const result = ModuleValidator.validate(moduleWithWhitespaceTitle);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Module title is required');
    });

    it('should reject module with null/undefined title', () => {
      const moduleWithNullTitle = createValidModule({ title: null as any });
      const moduleWithUndefinedTitle = createValidModule({ title: undefined as any });
      
      expect(ModuleValidator.validate(moduleWithNullTitle).valid).toBe(false);
      expect(ModuleValidator.validate(moduleWithUndefinedTitle).valid).toBe(false);
    });

    it('should reject module without content', () => {
      const moduleWithoutContent = createValidModule({ content: null as any });
      
      const result = ModuleValidator.validate(moduleWithoutContent);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Module content is required');
    });

    it('should reject module with undefined content', () => {
      const moduleWithUndefinedContent = createValidModule({ content: undefined as any });
      
      const result = ModuleValidator.validate(moduleWithUndefinedContent);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Module content is required');
    });

    it('should reject module without time estimate', () => {
      const moduleWithoutTimeEstimate = createValidModule({ timeEstimate: null as any });
      
      const result = ModuleValidator.validate(moduleWithoutTimeEstimate);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Time estimate is required');
    });

    it('should reject module with undefined time estimate', () => {
      const moduleWithUndefinedTimeEstimate = createValidModule({ timeEstimate: undefined as any });
      
      const result = ModuleValidator.validate(moduleWithUndefinedTimeEstimate);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Time estimate is required');
    });

    it('should reject module without difficulty level', () => {
      const moduleWithoutDifficulty = createValidModule({ difficultyLevel: null as any });
      
      const result = ModuleValidator.validate(moduleWithoutDifficulty);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Difficulty level is required');
    });

    it('should reject module with undefined difficulty level', () => {
      const moduleWithUndefinedDifficulty = createValidModule({ difficultyLevel: undefined as any });
      
      const result = ModuleValidator.validate(moduleWithUndefinedDifficulty);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Difficulty level is required');
    });

    it('should reject module with negative time estimate hours', () => {
      const moduleWithNegativeHours = createValidModule({
        timeEstimate: { hours: -1, minutes: 30 }
      });
      
      const result = ModuleValidator.validate(moduleWithNegativeHours);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Time estimate must be non-negative');
    });

    it('should reject module with negative time estimate minutes', () => {
      const moduleWithNegativeMinutes = createValidModule({
        timeEstimate: { hours: 2, minutes: -15 }
      });
      
      const result = ModuleValidator.validate(moduleWithNegativeMinutes);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Time estimate must be non-negative');
    });

    it('should accept module with zero time estimate', () => {
      const moduleWithZeroTime = createValidModule({
        timeEstimate: { hours: 0, minutes: 0 }
      });
      
      const result = ModuleValidator.validate(moduleWithZeroTime);
      
      expect(result.valid).toBe(true);
    });

    it('should reject module with content that has neither introduction nor sections', () => {
      const moduleWithEmptyContent = createValidModule({
        content: {
          introduction: '',
          sections: []
        }
      });
      
      const result = ModuleValidator.validate(moduleWithEmptyContent);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Module content must have introduction or sections');
    });

    it('should accept module with only introduction (no sections)', () => {
      const moduleWithOnlyIntro = createValidModule({
        content: {
          introduction: 'This is a valid introduction',
          sections: []
        }
      });
      
      const result = ModuleValidator.validate(moduleWithOnlyIntro);
      
      expect(result.valid).toBe(true);
    });

    it('should accept module with only sections (no introduction)', () => {
      const moduleWithOnlySections = createValidModule({
        content: {
          introduction: '',
          sections: [
            {
              id: 'section-1',
              title: 'Valid Section',
              content: 'Section content',
              order: 1
            }
          ]
        }
      });
      
      const result = ModuleValidator.validate(moduleWithOnlySections);
      
      expect(result.valid).toBe(true);
    });

    it('should accept module with both introduction and sections', () => {
      const moduleWithBoth = createValidModule({
        content: {
          introduction: 'Valid introduction',
          sections: [
            {
              id: 'section-1',
              title: 'Valid Section',
              content: 'Section content',
              order: 1
            }
          ]
        }
      });
      
      const result = ModuleValidator.validate(moduleWithBoth);
      
      expect(result.valid).toBe(true);
    });

    it('should collect multiple validation errors', () => {
      const invalidModule = createValidModule({
        id: '',
        title: '',
        content: null as any,
        timeEstimate: { hours: -1, minutes: -5 },
        difficultyLevel: null as any
      });
      
      const result = ModuleValidator.validate(invalidModule);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(5);
      expect(result.errors).toContain('Module ID is required');
      expect(result.errors).toContain('Module title is required');
      expect(result.errors).toContain('Module content is required');
      expect(result.errors).toContain('Time estimate must be non-negative');
      expect(result.errors).toContain('Difficulty level is required');
    });

    it('should handle module with complex nested structure', () => {
      const complexModule = createValidModule({
        content: {
          introduction: 'Complex module introduction',
          sections: [
            {
              id: 'section-1',
              title: 'Section with Key Terms',
              content: 'Section content',
              order: 1,
              keyTerms: [
                { term: 'Term 1', definition: 'Definition 1' },
                { term: 'Term 2', definition: 'Definition 2' }
              ],
              images: [
                {
                  id: 'img-1',
                  url: 'https://example.com/image.jpg',
                  caption: 'Test image',
                  alt: 'Alt text'
                }
              ]
            },
            {
              id: 'section-2',
              title: 'Section with Interactive Elements',
              content: 'Another section',
              order: 2,
              interactiveElements: [
                {
                  id: 'interactive-1',
                  type: 'simulation',
                  title: 'Test Simulation',
                  url: 'https://example.com/sim',
                  description: 'Interactive simulation'
                }
              ]
            }
          ],
          summary: 'Complex module summary',
          keyTakeaways: [
            'Key takeaway 1',
            'Key takeaway 2',
            'Key takeaway 3'
          ]
        }
      });
      
      const result = ModuleValidator.validate(complexModule);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should handle module with all difficulty levels', () => {
      const difficulties: DifficultyLevel[] = [
        DifficultyLevel.BEGINNER,
        DifficultyLevel.INTERMEDIATE,
        DifficultyLevel.ADVANCED
      ];
      
      for (const difficulty of difficulties) {
        const module = createValidModule({ difficultyLevel: difficulty });
        const result = ModuleValidator.validate(module);
        
        expect(result.valid).toBe(true);
        expect(result.errors).toEqual([]);
      }
    });

    it('should handle module with extensive metadata', () => {
      const moduleWithExtensiveMetadata = createValidModule({
        metadata: {
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-12-31T23:59:59Z',
          version: '2.1.5',
          author: {
            id: 'author-123',
            name: 'Dr. Jane Smith',
            email: 'jane.smith@university.edu',
            role: 'Professor'
          },
          status: ModuleStatus.PUBLISHED,
          language: 'en',
          reviewedBy: {
            id: 'reviewer-456',
            name: 'Prof. John Doe',
            email: 'john.doe@university.edu',
            role: 'Senior Reviewer'
          },
          reviewedAt: '2023-06-15T10:30:00Z',
          publishedAt: '2023-07-01T09:00:00Z',
          analytics: {
            views: 1250,
            completions: 892,
            averageTime: 145,
            averageScore: 83.7,
            feedback: [
              {
                userId: 'user-1',
                rating: 5,
                comment: 'Excellent module!',
                timestamp: '2023-08-01T14:20:00Z',
                helpful: 15
              }
            ]
          }
        }
      });
      
      const result = ModuleValidator.validate(moduleWithExtensiveMetadata);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  describe('validateEducationalModule', () => {
    it('should return validation result in expected format', () => {
      const validModule = createValidModule();
      
      const result = validateEducationalModule(validModule);
      
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
      expect(result.isValid).toBe(true);
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('should return false for invalid module', () => {
      const invalidModule = createValidModule({ id: '' });
      
      const result = validateEducationalModule(invalidModule);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should format error messages correctly', () => {
      const invalidModule = createValidModule({ title: '' });
      
      const result = validateEducationalModule(invalidModule);
      
      expect(result.errors[0]).toHaveProperty('message');
      expect(result.errors[0].message).toBe('Module title is required');
    });

    it('should handle multiple errors', () => {
      const invalidModule = createValidModule({
        id: '',
        title: '',
        content: null as any
      });
      
      const result = validateEducationalModule(invalidModule);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(3);
      expect(result.errors.every(error => error.message)).toBe(true);
    });

    it('should handle null module gracefully', () => {
      const result = validateEducationalModule(null as any);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle undefined module gracefully', () => {
      const result = validateEducationalModule(undefined as any);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle module with circular references gracefully', () => {
      const circularModule: any = createValidModule();
      circularModule.self = circularModule; // Create circular reference
      
      const result = validateEducationalModule(circularModule);
      
      // Should not throw and should handle the validation
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
    });
  });

  describe('sanitizeModule', () => {
    it('should trim whitespace from title', () => {
      const moduleWithWhitespace = createValidModule({
        title: '   Whitespace Title   '
      });
      
      const sanitized = sanitizeModule(moduleWithWhitespace);
      
      expect(sanitized.title).toBe('Whitespace Title');
    });

    it('should trim whitespace from description', () => {
      const moduleWithWhitespace = createValidModule({
        description: '   Whitespace Description   '
      });
      
      const sanitized = sanitizeModule(moduleWithWhitespace);
      
      expect(sanitized.description).toBe('Whitespace Description');
    });

    it('should handle empty title gracefully', () => {
      const moduleWithEmptyTitle = createValidModule({
        title: ''
      });
      
      const sanitized = sanitizeModule(moduleWithEmptyTitle);
      
      expect(sanitized.title).toBe('');
    });

    it('should handle null title gracefully', () => {
      const moduleWithNullTitle = createValidModule({
        title: null as any
      });
      
      const sanitized = sanitizeModule(moduleWithNullTitle);
      
      expect(sanitized.title).toBe('');
    });

    it('should handle undefined title gracefully', () => {
      const moduleWithUndefinedTitle = createValidModule({
        title: undefined as any
      });
      
      const sanitized = sanitizeModule(moduleWithUndefinedTitle);
      
      expect(sanitized.title).toBe('');
    });

    it('should handle null description gracefully', () => {
      const moduleWithNullDescription = createValidModule({
        description: null as any
      });
      
      const sanitized = sanitizeModule(moduleWithNullDescription);
      
      expect(sanitized.description).toBe('');
    });

    it('should handle undefined description gracefully', () => {
      const moduleWithUndefinedDescription = createValidModule({
        description: undefined as any
      });
      
      const sanitized = sanitizeModule(moduleWithUndefinedDescription);
      
      expect(sanitized.description).toBe('');
    });

    it('should preserve all other module properties', () => {
      const originalModule = createValidModule();
      const sanitized = sanitizeModule(originalModule);
      
      // Check that all properties except title and description are unchanged
      expect(sanitized.id).toBe(originalModule.id);
      expect(sanitized.content).toEqual(originalModule.content);
      expect(sanitized.videos).toEqual(originalModule.videos);
      expect(sanitized.mindMaps).toEqual(originalModule.mindMaps);
      expect(sanitized.quiz).toEqual(originalModule.quiz);
      expect(sanitized.bibliography).toEqual(originalModule.bibliography);
      expect(sanitized.filmReferences).toEqual(originalModule.filmReferences);
      expect(sanitized.tags).toEqual(originalModule.tags);
      expect(sanitized.difficultyLevel).toBe(originalModule.difficultyLevel);
      expect(sanitized.timeEstimate).toEqual(originalModule.timeEstimate);
      expect(sanitized.metadata).toEqual(originalModule.metadata);
    });

    it('should handle complex whitespace patterns', () => {
      const moduleWithComplexWhitespace = createValidModule({
        title: '\\n\\t   Complex   \\n\\r   Title   \\t\\n',
        description: '\\r\\n   Description   with   \\t   spaces   \\n\\r'
      });
      
      const sanitized = sanitizeModule(moduleWithComplexWhitespace);
      
      expect(sanitized.title).toBe('\\n\\t   Complex   \\n\\r   Title   \\t\\n'.trim());
      expect(sanitized.description).toBe('\\r\\n   Description   with   \\t   spaces   \\n\\r'.trim());
    });

    it('should handle modules with only whitespace in title and description', () => {
      const moduleWithOnlyWhitespace = createValidModule({
        title: '   \\n\\t\\r   ',
        description: '\\t\\t   \\n\\n   '
      });
      
      const sanitized = sanitizeModule(moduleWithOnlyWhitespace);
      
      expect(sanitized.title).toBe('');
      expect(sanitized.description).toBe('');
    });

    it('should not modify the original module object', () => {
      const originalModule = createValidModule({
        title: '   Original Title   ',
        description: '   Original Description   '
      });
      const originalTitleCopy = originalModule.title;
      const originalDescriptionCopy = originalModule.description;
      
      const sanitized = sanitizeModule(originalModule);
      
      // Original should remain unchanged
      expect(originalModule.title).toBe(originalTitleCopy);
      expect(originalModule.description).toBe(originalDescriptionCopy);
      
      // Sanitized should be different
      expect(sanitized.title).toBe('Original Title');
      expect(sanitized.description).toBe('Original Description');
    });

    it('should handle deep cloning correctly', () => {
      const originalModule = createValidModule();
      const sanitized = sanitizeModule(originalModule);
      
      // Modify the sanitized object
      sanitized.tags.push('new-tag');
      sanitized.content.introduction = 'Modified introduction';
      
      // Original should remain unchanged
      expect(originalModule.tags).not.toContain('new-tag');
      expect(originalModule.content.introduction).not.toBe('Modified introduction');
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle extremely large modules', () => {
      const largeModule = createValidModule({
        content: {
          introduction: 'Large module'.repeat(1000),
          sections: Array(100).fill(0).map((_, i) => ({
            id: `section-${i}`,
            title: `Section ${i}`,
            content: `Content for section ${i}`.repeat(100),
            order: i + 1,
            keyTerms: Array(10).fill(0).map((_, j) => ({
              term: `Term ${i}-${j}`,
              definition: `Definition for term ${i}-${j}`
            }))
          }))
        },
        tags: Array(50).fill(0).map((_, i) => `tag-${i}`),
        bibliography: Array(20).fill(0).map((_, i) => ({
          id: `bib-${i}`,
          title: `Bibliography ${i}`,
          authors: [`Author ${i}`],
          year: 2020 + i,
          type: 'BOOK' as any
        }))
      });
      
      const result = ModuleValidator.validate(largeModule);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should handle modules with special characters in strings', () => {
      const moduleWithSpecialChars = createValidModule({
        title: 'Module with émojis 🎓 and spëcial chars: àáâãäåæç',
        description: 'Description with symbols: !@#$%^&*()_+-=[]{}|;\\:"\\'<>?,./~`',
        content: {
          introduction: 'Introduction with unicode: 中文, العربية, हिन्दी, русский',
          sections: [
            {
              id: 'special-section',
              title: 'Section with ñoño characters',
              content: 'Content with mixed scripts: Ελληνικά and Deutsch',
              order: 1
            }
          ]
        }
      });
      
      const result = ModuleValidator.validate(moduleWithSpecialChars);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should handle modules with extreme time estimates', () => {
      const moduleWithExtremeTime = createValidModule({
        timeEstimate: {
          hours: 999999,
          minutes: 999999
        }
      });
      
      const result = ModuleValidator.validate(moduleWithExtremeTime);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should handle malformed object gracefully', () => {
      const malformedModule = {
        // Missing required properties, wrong types, etc.
        id: 123, // Should be string
        title: null,
        content: 'not an object',
        timeEstimate: 'invalid',
        difficultyLevel: 'invalid-level'
      } as any;
      
      const result = ModuleValidator.validate(malformedModule);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle prototype pollution attempts safely', () => {
      const maliciousModule = createValidModule();
      (maliciousModule as any).__proto__.polluted = true;
      (maliciousModule as any).constructor.prototype.polluted = true;
      
      const result = ModuleValidator.validate(maliciousModule);
      
      // Should validate normally without being affected by prototype pollution
      expect(result.valid).toBe(true);
      expect((Object.prototype as any).polluted).toBeUndefined();
    });
  });
});