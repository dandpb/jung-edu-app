/**
 * Test suite for bibliography service example usage
 * Tests bibliography generation workflows and integration patterns
 */

import { 
  generateModuleBibliography, 
  enrichReferences, 
  formatCitations, 
  validateReferences 
} from '../example-usage';

// Mock dependencies
jest.mock('../bibliographyEnricher');

describe('Bibliography Service Example Usage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateModuleBibliography', () => {
    it('should generate bibliography for module', async () => {
      const result = await generateModuleBibliography('Jung Psychology', ['archetype', 'shadow']);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle empty concepts', async () => {
      const result = await generateModuleBibliography('Topic', []);
      
      expect(Array.isArray(result)).toBe(true);
    });

    it('should validate topic parameter', async () => {
      await expect(generateModuleBibliography('', ['concept'])).rejects.toThrow();
    });
  });

  describe('enrichReferences', () => {
    it('should enrich reference metadata', async () => {
      const mockReferences = [
        { title: 'Test Book', authors: ['Author'], year: 2023 }
      ];

      const result = await enrichReferences(mockReferences as any);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('metadata');
    });

    it('should handle missing metadata', async () => {
      const mockReferences = [{ title: 'Test' }];

      const result = await enrichReferences(mockReferences as any);
      
      expect(result).toHaveLength(1);
    });
  });

  describe('formatCitations', () => {
    it('should format citations in APA style', () => {
      const references = [
        { title: 'Test Book', authors: ['Smith, J.'], year: 2023, type: 'book' }
      ];

      const result = formatCitations(references as any, 'APA');
      
      expect(result).toHaveLength(1);
      expect(result[0]).toContain('Smith, J. (2023)');
    });

    it('should format citations in MLA style', () => {
      const references = [
        { title: 'Test Article', authors: ['Doe, Jane'], year: 2022, type: 'journal' }
      ];

      const result = formatCitations(references as any, 'MLA');
      
      expect(result).toHaveLength(1);
      expect(result[0]).toContain('Doe, Jane');
    });

    it('should handle unknown citation style', () => {
      const references = [{ title: 'Test', authors: ['Author'], year: 2023 }];

      expect(() => {
        formatCitations(references as any, 'UNKNOWN' as any);
      }).toThrow('Unsupported citation style');
    });
  });

  describe('validateReferences', () => {
    it('should validate complete references', () => {
      const references = [
        { title: 'Complete Book', authors: ['Author'], year: 2023, type: 'book' }
      ];

      const result = validateReferences(references as any);
      
      expect(result.valid).toHaveLength(1);
      expect(result.invalid).toHaveLength(0);
    });

    it('should identify invalid references', () => {
      const references = [
        { title: '', authors: [], year: null }, // Invalid
        { title: 'Valid', authors: ['Author'], year: 2023 } // Valid
      ];

      const result = validateReferences(references as any);
      
      expect(result.valid).toHaveLength(1);
      expect(result.invalid).toHaveLength(1);
    });

    it('should handle empty reference list', () => {
      const result = validateReferences([]);
      
      expect(result.valid).toHaveLength(0);
      expect(result.invalid).toHaveLength(0);
    });
  });
});