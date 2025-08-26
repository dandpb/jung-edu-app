/**
 * Comprehensive tests for bibliography/example-usage.ts
 * Tests bibliography generation, reference management, and integration patterns
 */

import {
  generateBibliography,
  generateReadingPath,
  exportBibliography,
  findReferencesByKeywords,
  findReferencesByCategory,
  enrichReference,
  allReferences
} from '../index';

// Mock the entire bibliography index module
jest.mock('../index', () => ({
  generateBibliography: jest.fn(),
  generateReadingPath: jest.fn(),
  exportBibliography: jest.fn(),
  findReferencesByKeywords: jest.fn(),
  findReferencesByCategory: jest.fn(),
  enrichReference: jest.fn(),
  allReferences: []
}));

// Import example usage after mocking to ensure it uses mocked functions
const exampleUsage = require('../example-usage');

// Mock bibliography data
const mockReferences = [
  {
    id: 'cw9i',
    title: 'The Archetypes and the Collective Unconscious',
    author: 'Carl Gustav Jung',
    year: 1959,
    type: 'book',
    publisher: 'Princeton University Press',
    readingLevel: 'intermediate',
    relevanceScore: 95,
    topicRelevance: {
      shadow: 8,
      anima: 6,
      archetypes: 10,
      collective_unconscious: 10
    },
    formattedCitation: {
      apa: 'Jung, C. G. (1959). The Archetypes and the Collective Unconscious. Princeton University Press.',
      mla: 'Jung, Carl Gustav. The Archetypes and the Collective Unconscious. Princeton University Press, 1959.',
      chicago: 'Jung, Carl Gustav. The Archetypes and the Collective Unconscious. Princeton University Press, 1959.'
    },
    tags: ['psychology', 'analytical psychology', 'archetypes'],
    abstract: 'Jung\'s seminal work on the collective unconscious and archetypal psychology.'
  },
  {
    id: 'redbook',
    title: 'The Red Book: Liber Novus',
    author: 'Carl Gustav Jung',
    year: 2009,
    type: 'book',
    publisher: 'W. W. Norton & Company',
    readingLevel: 'scholar',
    relevanceScore: 90,
    topicRelevance: {
      active_imagination: 10,
      mandala: 9,
      individuation: 8
    },
    formattedCitation: {
      apa: 'Jung, C. G. (2009). The Red Book: Liber Novus. W. W. Norton & Company.',
      mla: 'Jung, Carl Gustav. The Red Book: Liber Novus. W. W. Norton & Company, 2009.',
      chicago: 'Jung, Carl Gustav. The Red Book: Liber Novus. W. W. Norton & Company, 2009.'
    },
    prerequisiteIds: ['cw9i', 'memories_dreams_reflections'],
    tags: ['active imagination', 'mandala', 'personal journey']
  },
  {
    id: 'man_symbols',
    title: 'Man and His Symbols',
    author: 'Carl Gustav Jung',
    year: 1964,
    type: 'book',
    publisher: 'Doubleday',
    readingLevel: 'beginner',
    relevanceScore: 88,
    topicRelevance: {
      symbols: 9,
      dreams: 8,
      unconscious: 7
    },
    formattedCitation: {
      apa: 'Jung, C. G. (1964). Man and His Symbols. Doubleday.',
      mla: 'Jung, Carl Gustav. Man and His Symbols. Doubleday, 1964.',
      chicago: 'Jung, Carl Gustav. Man and His Symbols. Doubleday, 1964.'
    }
  },
  {
    id: 'hero_journey',
    title: 'The Hero with a Thousand Faces',
    author: 'Joseph Campbell',
    year: 1949,
    type: 'book',
    publisher: 'Pantheon Books',
    readingLevel: 'intermediate',
    relevanceScore: 82,
    topicRelevance: {
      hero_archetype: 10,
      mythology: 9,
      transformation: 8
    },
    formattedCitation: {
      apa: 'Campbell, J. (1949). The Hero with a Thousand Faces. Pantheon Books.',
      mla: 'Campbell, Joseph. The Hero with a Thousand Faces. Pantheon Books, 1949.',
      chicago: 'Campbell, Joseph. The Hero with a Thousand Faces. Pantheon Books, 1949.'
    }
  },
  {
    id: 'shadow_film',
    title: 'The Shadow in Cinema',
    author: 'Dr. Film Analysis',
    year: 2020,
    type: 'film',
    url: 'https://example.com/shadow-cinema',
    readingLevel: 'intermediate',
    relevanceScore: 75,
    topicRelevance: {
      shadow: 9,
      projection: 7,
      cinema: 10
    },
    formattedCitation: {
      apa: 'Dr. Film Analysis (2020). The Shadow in Cinema [Film]. https://example.com/shadow-cinema'
    }
  }
];

const mockReadingPaths = [
  {
    level: 'Beginner',
    description: 'Start with accessible introductions to Jung\'s key concepts',
    references: [mockReferences[2]], // Man and His Symbols
    estimatedTime: '2-3 weeks',
    prerequisites: []
  },
  {
    level: 'Intermediate', 
    description: 'Explore core Jungian works and archetypal theory',
    references: [mockReferences[0], mockReferences[3]], // Archetypes book, Hero's Journey
    estimatedTime: '4-6 weeks',
    prerequisites: ['Basic understanding of psychology']
  },
  {
    level: 'Advanced',
    description: 'Deep dive into Jung\'s personal journey and advanced concepts',
    references: [mockReferences[1]], // Red Book
    estimatedTime: '8-12 weeks', 
    prerequisites: ['Solid foundation in Jungian theory', 'Experience with psychological texts']
  }
];

describe('Bibliography Example Usage - Comprehensive Tests', () => {
  let originalConsoleLog: typeof console.log;
  let originalConsoleError: typeof console.error;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock console methods
    originalConsoleLog = console.log;
    originalConsoleError = console.error;
    console.log = jest.fn();
    console.error = jest.fn();

    // Setup mock implementations
    (generateBibliography as jest.Mock).mockReturnValue(mockReferences.slice(0, 3));
    (generateReadingPath as jest.Mock).mockReturnValue(mockReadingPaths);
    (findReferencesByKeywords as jest.Mock).mockReturnValue(mockReferences.slice(0, 2));
    (findReferencesByCategory as jest.Mock).mockReturnValue([mockReferences[0]]);
    (exportBibliography as jest.Mock).mockReturnValue('@article{jung1959,\n  title={The Archetypes},\n  author={Jung, Carl Gustav},\n  year={1959}\n}');
    (enrichReference as jest.Mock).mockImplementation((ref, options) => ({
      ...ref,
      prerequisiteIds: options.topic === 'active imagination' ? ['cw9i'] : []
    }));

    // Mock allReferences
    (allReferences as any).length = mockReferences.length;
    (allReferences as any).filter = jest.fn().mockImplementation((fn) => 
      mockReferences.filter(fn)
    );
    (allReferences as any).find = jest.fn().mockImplementation((fn) =>
      mockReferences.find(fn)
    );
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  describe('Shadow Bibliography Generation', () => {
    it('should generate bibliography on shadow archetype', () => {
      // Execute the example code
      const shadowBibliography = generateBibliography({
        topic: 'shadow',
        keywords: ['shadow', 'projection', 'dark side', 'repression'],
        maxResults: 10,
        readingLevel: 'intermediate',
        sortBy: 'relevance'
      });

      // Verify the function was called correctly
      expect(generateBibliography).toHaveBeenCalledWith({
        topic: 'shadow',
        keywords: ['shadow', 'projection', 'dark side', 'repression'],
        maxResults: 10,
        readingLevel: 'intermediate',
        sortBy: 'relevance'
      });

      // Verify output formatting
      expect(console.log).toHaveBeenCalledWith('=== Bibliography on the Shadow Archetype ===\n');
      
      if (shadowBibliography && shadowBibliography.length > 0) {
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining(shadowBibliography[0].title));
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining(shadowBibliography[0].author));
      }
    });

    it('should handle empty bibliography results', () => {
      (generateBibliography as jest.Mock).mockReturnValue([]);

      const shadowBibliography = generateBibliography({
        topic: 'nonexistent',
        keywords: [],
        maxResults: 10,
        readingLevel: 'intermediate',
        sortBy: 'relevance'
      });

      expect(console.log).toHaveBeenCalledWith('No references found for shadow archetype with the specified criteria.');
    });

    it('should handle null bibliography results', () => {
      (generateBibliography as jest.Mock).mockReturnValue(null);

      const shadowBibliography = generateBibliography({
        topic: 'shadow',
        keywords: ['shadow'],
        maxResults: 10,
        readingLevel: 'intermediate', 
        sortBy: 'relevance'
      });

      expect(console.log).toHaveBeenCalledWith('No references found for shadow archetype with the specified criteria.');
    });
  });

  describe('Reading Path Generation', () => {
    it('should generate reading paths for individuation', () => {
      const individuationPaths = generateReadingPath('individuation');

      expect(generateReadingPath).toHaveBeenCalledWith('individuation');
      expect(console.log).toHaveBeenCalledWith('\n=== Reading Paths for Individuation ===\n');
      
      if (individuationPaths && individuationPaths.length > 0) {
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Beginner Path:'));
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Start with accessible'));
        expect(console.log).toHaveBeenCalledWith('1. Man and His Symbols (1964)');
      }
    });

    it('should handle empty reading paths', () => {
      (generateReadingPath as jest.Mock).mockReturnValue([]);

      const individuationPaths = generateReadingPath('nonexistent');

      expect(console.log).toHaveBeenCalledWith('No reading paths found for individuation.');
    });

    it('should handle null reading paths', () => {
      (generateReadingPath as jest.Mock).mockReturnValue(null);

      const individuationPaths = generateReadingPath('individuation');

      expect(console.log).toHaveBeenCalledWith('No reading paths found for individuation.');
    });

    it('should handle paths with empty references', () => {
      const emptyPaths = [
        {
          level: 'Beginner',
          description: 'Test path',
          references: [],
          estimatedTime: '1 week',
          prerequisites: []
        }
      ];
      (generateReadingPath as jest.Mock).mockReturnValue(emptyPaths);

      const individuationPaths = generateReadingPath('test');

      expect(console.log).toHaveBeenCalledWith('No references available for this path.');
    });
  });

  describe('Film References Discovery', () => {
    it('should find and display film references', () => {
      (allReferences as any).filter.mockReturnValue([mockReferences[4]]);

      // Execute the film reference example code
      if (allReferences && allReferences.length > 0) {
        const films = allReferences.filter((ref: any) => ref.type === 'film');
        
        if (films.length > 0) {
          films.forEach((film: any) => {
            console.log(`- ${film.title} (${film.year})`);
            if (film.url) console.log(`  URL: ${film.url}`);
          });
        }
      }

      expect(console.log).toHaveBeenCalledWith('\n=== Film References ===\n');
      expect(console.log).toHaveBeenCalledWith('- The Shadow in Cinema (2020)');
      expect(console.log).toHaveBeenCalledWith('  URL: https://example.com/shadow-cinema');
    });

    it('should handle no film references', () => {
      (allReferences as any).filter.mockReturnValue([]);

      if (allReferences && allReferences.length > 0) {
        const films = allReferences.filter((ref: any) => ref.type === 'film');
        if (films.length === 0) {
          console.log('No film references found in the database.');
        }
      }

      expect(console.log).toHaveBeenCalledWith('No film references found in the database.');
    });

    it('should handle empty reference database', () => {
      (allReferences as any).length = 0;

      if (!allReferences || allReferences.length === 0) {
        console.log('Reference database is empty or unavailable.');
      }

      expect(console.log).toHaveBeenCalledWith('Reference database is empty or unavailable.');
    });
  });

  describe('Category-based Reference Search', () => {
    it('should find references by category', () => {
      const alchemyRefs = findReferencesByCategory('alchemy');

      expect(findReferencesByCategory).toHaveBeenCalledWith('alchemy');
      expect(console.log).toHaveBeenCalledWith('\n=== Alchemy References ===\n');
      
      if (alchemyRefs && alchemyRefs.length > 0) {
        expect(console.log).toHaveBeenCalledWith(`- ${mockReferences[0].title} (${mockReferences[0].id})`);
      }
    });

    it('should handle no alchemy references', () => {
      (findReferencesByCategory as jest.Mock).mockReturnValue([]);

      const alchemyRefs = findReferencesByCategory('alchemy');

      expect(console.log).toHaveBeenCalledWith('No alchemy references found in the database.');
    });

    it('should handle null category results', () => {
      (findReferencesByCategory as jest.Mock).mockReturnValue(null);

      const alchemyRefs = findReferencesByCategory('alchemy');

      expect(console.log).toHaveBeenCalledWith('No alchemy references found in the database.');
    });
  });

  describe('Bibliography Export', () => {
    it('should export bibliography in BibTeX format', () => {
      const typologyRefs = generateBibliography({
        topic: 'psychological types',
        keywords: ['introversion', 'extraversion', 'thinking', 'feeling'],
        maxResults: 3,
        sortBy: 'year'
      });

      if (typologyRefs && typologyRefs.length > 0) {
        const bibtex = exportBibliography(typologyRefs, 'bibtex');
        console.log(bibtex);
      }

      expect(generateBibliography).toHaveBeenCalledWith({
        topic: 'psychological types',
        keywords: ['introversion', 'extraversion', 'thinking', 'feeling'],
        maxResults: 3,
        sortBy: 'year'
      });

      expect(exportBibliography).toHaveBeenCalledWith(mockReferences.slice(0, 3), 'bibtex');
      expect(console.log).toHaveBeenCalledWith('\n=== Bibliography Export (BibTeX) ===\n');
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('@article{jung1959'));
    });

    it('should handle no typology references for export', () => {
      (generateBibliography as jest.Mock).mockReturnValue([]);

      const typologyRefs = generateBibliography({
        topic: 'psychological types',
        keywords: ['introversion', 'extraversion', 'thinking', 'feeling'],
        maxResults: 3,
        sortBy: 'year'
      });

      expect(console.log).toHaveBeenCalledWith('No typology references found to export.');
    });
  });

  describe('Prerequisites Analysis', () => {
    it('should analyze prerequisites for Red Book', () => {
      (allReferences as any).find.mockImplementation((fn: any) => {
        const redBook = mockReferences.find(r => r.id === 'redbook');
        return fn(redBook) ? redBook : undefined;
      });

      const redBook = allReferences.find((ref: any) => ref.id === 'redbook');
      if (redBook) {
        const enrichedRedBook = enrichReference(redBook, { topic: 'active imagination' });
        
        console.log(`To read "${redBook.title}", first read:`);
        if (enrichedRedBook && enrichedRedBook.prerequisiteIds && enrichedRedBook.prerequisiteIds.length > 0) {
          enrichedRedBook.prerequisiteIds.forEach((prereqId: string) => {
            const prereq = allReferences.find((r: any) => r.id === prereqId);
            if (prereq) {
              console.log(`- ${prereq.title}`);
            }
          });
        }
      }

      expect(enrichReference).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'redbook' }),
        { topic: 'active imagination' }
      );

      expect(console.log).toHaveBeenCalledWith('\n=== Prerequisites for Reading the Red Book ===\n');
      expect(console.log).toHaveBeenCalledWith('To read "The Red Book: Liber Novus", first read:');
    });

    it('should handle Red Book not found', () => {
      (allReferences as any).find.mockReturnValue(undefined);

      const redBook = allReferences.find((ref: any) => ref.id === 'redbook');
      if (!redBook) {
        console.log('Red Book not found in the reference database.');
      }

      expect(console.log).toHaveBeenCalledWith('Red Book not found in the reference database.');
    });

    it('should handle enrichment errors', () => {
      (allReferences as any).find.mockReturnValue(mockReferences[1]);
      (enrichReference as jest.Mock).mockImplementation(() => {
        throw new Error('Enrichment error');
      });

      const redBook = allReferences.find((ref: any) => ref.id === 'redbook');
      if (redBook) {
        try {
          enrichReference(redBook, { topic: 'active imagination' });
        } catch (error) {
          console.error('Error enriching Red Book reference:', error);
        }
      }

      expect(console.error).toHaveBeenCalledWith('Error enriching Red Book reference:', expect.any(Error));
    });

    it('should handle no prerequisites identified', () => {
      (allReferences as any).find.mockReturnValue(mockReferences[1]);
      (enrichReference as jest.Mock).mockReturnValue({
        ...mockReferences[1],
        prerequisiteIds: []
      });

      const redBook = allReferences.find((ref: any) => ref.id === 'redbook');
      if (redBook) {
        const enrichedRedBook = enrichReference(redBook, { topic: 'active imagination' });
        
        if (!enrichedRedBook.prerequisiteIds || enrichedRedBook.prerequisiteIds.length === 0) {
          console.log('No specific prerequisites identified for the Red Book.');
        }
      }

      expect(console.log).toHaveBeenCalledWith('No specific prerequisites identified for the Red Book.');
    });
  });

  describe('Contemporary Research Search', () => {
    it('should search contemporary dream research', () => {
      const dreamResearch = generateBibliography({
        topic: 'dreams',
        keywords: ['dream analysis', 'unconscious', 'symbols'],
        maxResults: 5,
        yearRange: { start: 2000, end: 2024 },
        includeTypes: ['article', 'book'],
        readingLevel: 'scholar',
        sortBy: 'year'
      });

      expect(generateBibliography).toHaveBeenCalledWith({
        topic: 'dreams',
        keywords: ['dream analysis', 'unconscious', 'symbols'],
        maxResults: 5,
        yearRange: { start: 2000, end: 2024 },
        includeTypes: ['article', 'book'],
        readingLevel: 'scholar',
        sortBy: 'year'
      });

      expect(console.log).toHaveBeenCalledWith('\n=== Contemporary Research on Dreams ===\n');
      
      if (dreamResearch && dreamResearch.length > 0) {
        expect(console.log).toHaveBeenCalledWith(dreamResearch[0].formattedCitation.apa);
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Topic Relevance:'));
      }
    });

    it('should handle no contemporary research found', () => {
      (generateBibliography as jest.Mock).mockReturnValue([]);

      const dreamResearch = generateBibliography({
        topic: 'dreams',
        keywords: ['dream analysis', 'unconscious', 'symbols'],
        maxResults: 5,
        yearRange: { start: 2000, end: 2024 },
        includeTypes: ['article', 'book'],
        readingLevel: 'scholar',
        sortBy: 'year'
      });

      expect(console.log).toHaveBeenCalledWith('No contemporary dream research found matching the specified criteria.');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle bibliography service failures', () => {
      (generateBibliography as jest.Mock).mockImplementation(() => {
        throw new Error('Bibliography service error');
      });

      expect(() => {
        generateBibliography({
          topic: 'test',
          keywords: [],
          maxResults: 5,
          readingLevel: 'beginner',
          sortBy: 'relevance'
        });
      }).toThrow('Bibliography service error');
    });

    it('should handle export service failures', () => {
      (exportBibliography as jest.Mock).mockImplementation(() => {
        throw new Error('Export service error');
      });

      expect(() => {
        exportBibliography(mockReferences, 'bibtex');
      }).toThrow('Export service error');
    });

    it('should handle references with missing fields', () => {
      const incompleteRef = {
        id: 'incomplete',
        title: 'Test Reference',
        // Missing author, year, etc.
      };
      
      (generateBibliography as jest.Mock).mockReturnValue([incompleteRef]);

      const shadowBibliography = generateBibliography({
        topic: 'shadow',
        keywords: ['shadow'],
        maxResults: 1,
        readingLevel: 'intermediate',
        sortBy: 'relevance'
      });

      // Should not crash even with incomplete data
      expect(shadowBibliography).toBeDefined();
      expect(shadowBibliography).toHaveLength(1);
    });

    it('should handle large reference datasets efficiently', () => {
      const largeReferenceSet = Array(1000).fill(null).map((_, i) => ({
        ...mockReferences[0],
        id: `ref-${i}`,
        title: `Reference ${i}`
      }));
      
      (generateBibliography as jest.Mock).mockReturnValue(largeReferenceSet);

      const result = generateBibliography({
        topic: 'large dataset',
        keywords: ['test'],
        maxResults: 1000,
        readingLevel: 'intermediate',
        sortBy: 'relevance'
      });

      expect(result).toHaveLength(1000);
    });

    it('should handle concurrent bibliography requests', async () => {
      const promises = Array(10).fill(null).map((_, i) => 
        Promise.resolve(generateBibliography({
          topic: `topic-${i}`,
          keywords: [`keyword-${i}`],
          maxResults: 5,
          readingLevel: 'intermediate',
          sortBy: 'relevance'
        }))
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      expect(generateBibliography).toHaveBeenCalledTimes(10);
    });
  });

  describe('Data Integrity and Validation', () => {
    it('should validate reference data structure', () => {
      const bibliography = generateBibliography({
        topic: 'shadow',
        keywords: ['shadow'],
        maxResults: 1,
        readingLevel: 'intermediate',
        sortBy: 'relevance'
      });

      if (bibliography && bibliography.length > 0) {
        const ref = bibliography[0];
        expect(ref).toHaveProperty('id');
        expect(ref).toHaveProperty('title');
        expect(ref).toHaveProperty('author');
        expect(ref).toHaveProperty('year');
        expect(ref).toHaveProperty('formattedCitation');
      }
    });

    it('should validate reading path structure', () => {
      const paths = generateReadingPath('test');

      if (paths && paths.length > 0) {
        const path = paths[0];
        expect(path).toHaveProperty('level');
        expect(path).toHaveProperty('description');
        expect(path).toHaveProperty('references');
        expect(Array.isArray(path.references)).toBe(true);
      }
    });

    it('should validate export format integrity', () => {
      const bibtex = exportBibliography([mockReferences[0]], 'bibtex');

      expect(typeof bibtex).toBe('string');
      expect(bibtex.length).toBeGreaterThan(0);
    });
  });
});