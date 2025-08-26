/**
 * Extended test suite for BibliographyGenerator covering advanced scenarios and edge cases
 */

import { BibliographyGenerator, BibliographyEntry } from '../bibliography-generator';
import { ILLMProvider } from '../../types';

// Mock the provider
jest.mock('../../provider');

describe('BibliographyGenerator - Extended Coverage', () => {
  let generator: BibliographyGenerator;
  let mockProvider: jest.Mocked<ILLMProvider>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockProvider = {
      generateStructuredOutput: jest.fn(),
      generateCompletion: jest.fn(),
      getTokenCount: jest.fn(),
      isAvailable: jest.fn().mockResolvedValue(true),
      streamCompletion: jest.fn()
    } as any;

    generator = new BibliographyGenerator(mockProvider);
  });

  describe('Advanced Bibliography Generation', () => {
    it('should handle specialized academic levels', async () => {
      const specializedLevels = ['doctoral', 'postgraduate', 'researcher', 'professional'];
      
      for (const level of specializedLevels) {
        mockProvider.generateStructuredOutput.mockResolvedValueOnce([
          {
            type: 'journal',
            authors: ['Expert, Dr.'],
            title: `Advanced ${level} Research`,
            year: 2023,
            journal: 'Advanced Studies Journal',
            volume: '45',
            issue: '2',
            pages: '123-145',
            doi: '10.1234/advanced.2023',
            url: 'https://journal.com/advanced',
            abstract: `Specialized research for ${level} level`,
            relevance: `Appropriate for ${level} studies`,
            jungianConcepts: ['advanced concepts'],
            readingLevel: level as any
          }
        ]);

        const bibliography = await generator.generateBibliography(
          'Advanced Topic',
          ['complex concept'],
          level as any,
          1
        );

        expect(bibliography).toHaveLength(1);
        expect(bibliography[0].readingLevel).toBe(level);
      }
    });

    it('should generate comprehensive bibliography with mixed resource types', async () => {
      const mixedResources = [
        {
          type: 'book',
          authors: ['Jung, Carl Gustav'],
          title: 'Collected Works Volume 1',
          year: 1953,
          publisher: 'Princeton University Press',
          isbn: '978-0-691-01825-1',
          url: 'https://books.example.com/cw1',
          abstract: 'Foundational work',
          relevance: 'Primary source',
          jungianConcepts: ['psyche', 'unconscious'],
          readingLevel: 'advanced'
        },
        {
          type: 'article',
          authors: ['Smith, John', 'Doe, Jane'],
          title: 'Modern Applications of Jung',
          year: 2023,
          journal: 'Contemporary Psychology',
          volume: '68',
          issue: '4',
          pages: '234-256',
          doi: '10.1037/con0000123',
          url: 'https://psycnet.apa.org/record/modern-jung',
          abstract: 'Contemporary applications',
          relevance: 'Modern perspective',
          jungianConcepts: ['therapy', 'practice'],
          readingLevel: 'intermediate'
        },
        {
          type: 'thesis',
          authors: ['Graduate, PhD'],
          title: 'Jung in Digital Age',
          year: 2022,
          institution: 'Digital University',
          degree: 'PhD',
          url: 'https://digitaluni.edu/thesis/123',
          abstract: 'Digital applications of Jungian theory',
          relevance: 'Contemporary research',
          jungianConcepts: ['digital psychology'],
          readingLevel: 'advanced'
        },
        {
          type: 'website',
          authors: ['Jung Institute'],
          title: 'Online Resources for Jung Study',
          year: 2023,
          url: 'https://jung-institute.org/resources',
          accessDate: '2023-12-01',
          abstract: 'Comprehensive online resources',
          relevance: 'Practical resources',
          jungianConcepts: ['study materials'],
          readingLevel: 'beginner'
        }
      ];

      mockProvider.generateStructuredOutput.mockResolvedValue(mixedResources);

      const bibliography = await generator.generateBibliography(
        'Comprehensive Jung Study',
        ['jung', 'psychology', 'therapy'],
        'graduate',
        10
      );

      expect(bibliography).toHaveLength(4);
      
      const resourceTypes = bibliography.map(entry => entry.type);
      expect(resourceTypes).toContain('book');
      expect(resourceTypes).toContain('article');
      expect(resourceTypes).toContain('thesis');
      expect(resourceTypes).toContain('website');

      // Check that each type has appropriate fields
      const bookEntry = bibliography.find(entry => entry.type === 'book');
      expect(bookEntry).toHaveProperty('publisher');
      expect(bookEntry).toHaveProperty('isbn');

      const articleEntry = bibliography.find(entry => entry.type === 'article');
      expect(articleEntry).toHaveProperty('journal');
      expect(articleEntry).toHaveProperty('doi');

      const thesisEntry = bibliography.find(entry => entry.type === 'thesis');
      expect(thesisEntry).toHaveProperty('institution');
      expect(thesisEntry).toHaveProperty('degree');

      const websiteEntry = bibliography.find(entry => entry.type === 'website');
      expect(websiteEntry).toHaveProperty('accessDate');
    });

    it('should filter bibliography by publication date range', async () => {
      const dateRangedResources = [
        {
          type: 'book',
          authors: ['Jung, C.G.'],
          title: 'Historical Work',
          year: 1920,
          publisher: 'Old Publisher',
          url: 'https://archive.org/historical',
          abstract: 'Historical perspective',
          relevance: 'Historical context',
          jungianConcepts: ['early theory'],
          readingLevel: 'advanced'
        },
        {
          type: 'article',
          authors: ['Modern, Author'],
          title: 'Contemporary Research',
          year: 2023,
          journal: 'Modern Psychology',
          volume: '75',
          issue: '1',
          pages: '1-20',
          doi: '10.1234/mod.2023',
          url: 'https://modern.psych.com/2023',
          abstract: 'Latest research',
          relevance: 'Current applications',
          jungianConcepts: ['modern therapy'],
          readingLevel: 'intermediate'
        }
      ];

      mockProvider.generateStructuredOutput.mockResolvedValue(dateRangedResources);

      const bibliography = await generator.generateBibliography(
        'Time-Filtered Study',
        ['jung history'],
        'researcher',
        5,
        'en',
        { startYear: 1900, endYear: 2025 }
      );

      expect(bibliography).toHaveLength(2);
      bibliography.forEach(entry => {
        expect(entry.year).toBeGreaterThanOrEqual(1900);
        expect(entry.year).toBeLessThanOrEqual(2025);
      });
    });
  });

  describe('Advanced Film Suggestions', () => {
    it('should generate film suggestions with detailed metadata', async () => {
      const detailedFilms = [
        {
          title: 'The Red Book Documentary',
          director: 'Documentary Filmmaker',
          year: 2020,
          type: 'documentary',
          duration: 90,
          language: 'English',
          subtitles: ['Portuguese', 'Spanish', 'French'],
          relevance: 'Explores Jung\'s personal journey',
          streamingUrl: 'https://streaming.com/redbook',
          trailerUrl: 'https://youtube.com/trailer/redbook',
          educationalValue: 0.9,
          targetAudience: 'psychology students',
          jungianConcepts: ['individuation', 'active imagination'],
          contentWarnings: ['psychological themes'],
          awards: ['Best Documentary 2020']
        },
        {
          title: 'Analytical Psychology in Practice',
          director: 'Educational Director',
          year: 2021,
          type: 'educational',
          duration: 45,
          language: 'English',
          subtitles: ['Portuguese'],
          relevance: 'Practical applications of Jung\'s theories',
          streamingUrl: 'https://edutube.com/analytical-practice',
          educationalValue: 0.95,
          targetAudience: 'therapists',
          jungianConcepts: ['therapy techniques', 'dream analysis'],
          supplementaryMaterials: ['study guide', 'discussion questions']
        }
      ];

      mockProvider.generateStructuredOutput.mockResolvedValue(detailedFilms);

      const films = await generator.generateFilmSuggestions(
        'Jung in Practice',
        ['therapy', 'practice', 'techniques'],
        5,
        'en',
        { includeEducationalContent: true }
      );

      expect(films).toHaveLength(2);
      films.forEach(film => {
        expect(film).toHaveProperty('duration');
        expect(film).toHaveProperty('educationalValue');
        expect(film).toHaveProperty('targetAudience');
        expect(film).toHaveProperty('jungianConcepts');
        expect(Array.isArray(film.jungianConcepts)).toBe(true);
      });
    });

    it('should handle international film suggestions', async () => {
      const internationalFilms = [
        {
          title: 'Jung et la Psychologie Analytique',
          director: 'Directeur Français',
          year: 2019,
          type: 'documentary',
          language: 'French',
          subtitles: ['English', 'Portuguese'],
          relevance: 'French perspective on analytical psychology',
          streamingUrl: 'https://francetv.fr/jung-documentary',
          country: 'France'
        },
        {
          title: 'Jung: Uma Jornada Brasileira',
          director: 'Diretor Brasileiro',
          year: 2022,
          type: 'biographical',
          language: 'Portuguese',
          subtitles: ['English'],
          relevance: 'Brazilian interpretation of Jung\'s work',
          streamingUrl: 'https://globoplay.com/jung-jornada',
          country: 'Brazil'
        }
      ];

      mockProvider.generateStructuredOutput.mockResolvedValue(internationalFilms);

      const films = await generator.generateFilmSuggestions(
        'Jung International Perspectives',
        ['international', 'cultural'],
        5,
        'multi'
      );

      expect(films).toHaveLength(2);
      const languages = films.map(f => f.language);
      expect(languages).toContain('French');
      expect(languages).toContain('Portuguese');
    });
  });

  describe('Citation Formatting Edge Cases', () => {
    it('should handle complex author names and affiliations', async () => {
      const complexEntry: BibliographyEntry = {
        id: 'complex-1',
        type: 'article',
        authors: [
          'van der Berg, Dr. Johannes M.',
          'Smith-Johnson, Prof. Mary Elizabeth',
          'da Silva, Ana Lúcia',
          'O\'Connor, PhD, Seán'
        ],
        title: 'Complex Multi-Author Study on Jungian Archetypes',
        year: 2023,
        journal: 'International Journal of Analytical Psychology & Cultural Studies',
        volume: '45',
        issue: '3',
        pages: '123-145',
        doi: '10.1234/complex-study.2023.v45i3',
        url: 'https://journal.complex.study/2023/complex-authors',
        abstract: 'Complex study with multiple international authors',
        relevance: 'Multi-cultural perspective',
        jungianConcepts: ['cultural archetypes', 'international psychology'],
        readingLevel: 'advanced'
      };

      mockProvider.generateCompletion.mockResolvedValue({
        content: 'van der Berg, J. M., Smith-Johnson, M. E., da Silva, A. L., & O\'Connor, S. (2023). Complex multi-author study on Jungian archetypes. International Journal of Analytical Psychology & Cultural Studies, 45(3), 123-145. https://doi.org/10.1234/complex-study.2023.v45i3'
      });

      const citation = await generator.formatCitation(complexEntry, 'APA', 'en');

      expect(citation).toContain('van der Berg');
      expect(citation).toContain('Smith-Johnson');
      expect(citation).toContain('da Silva');
      expect(citation).toContain('O\'Connor');
      expect(citation).toContain('2023');
    });

    it('should handle missing citation information gracefully', async () => {
      const incompleteEntry: BibliographyEntry = {
        id: 'incomplete-1',
        type: 'book',
        authors: ['Unknown Author'],
        title: 'Incomplete Book Information',
        year: 2020,
        // Missing publisher, URL, etc.
        url: 'https://example.com',
        relevance: 'Incomplete information test',
        jungianConcepts: ['incomplete data']
      };

      mockProvider.generateCompletion.mockResolvedValue({
        content: 'Unknown Author. (2020). Incomplete book information. Publisher unknown.'
      });

      const citation = await generator.formatCitation(incompleteEntry, 'APA');

      expect(citation).toContain('Unknown Author');
      expect(citation).toContain('2020');
      expect(citation).toContain('Incomplete book information');
    });

    it('should format citations in multiple styles correctly', async () => {
      const standardEntry: BibliographyEntry = {
        id: 'standard-1',
        type: 'book',
        authors: ['Jung, Carl Gustav'],
        title: 'The Archetypes and the Collective Unconscious',
        year: 1959,
        publisher: 'Princeton University Press',
        url: 'https://press.princeton.edu/books/jung-archetypes',
        abstract: 'Foundational work on archetypes',
        relevance: 'Primary source',
        jungianConcepts: ['archetypes', 'collective unconscious'],
        readingLevel: 'advanced'
      };

      const citationStyles = [
        { style: 'APA', expected: 'Jung, C. G. (1959)' },
        { style: 'MLA', expected: 'Jung, Carl Gustav' },
        { style: 'Chicago', expected: 'Jung, Carl Gustav' },
        { style: 'Harvard', expected: 'Jung, C.G.' }
      ];

      for (const { style, expected } of citationStyles) {
        mockProvider.generateCompletion.mockResolvedValueOnce({
          content: `${expected}. The archetypes and the collective unconscious. Princeton University Press.`
        });

        const citation = await generator.formatCitation(standardEntry, style as any);
        expect(citation).toContain(expected);
      }
    });
  });

  describe('Annotated Bibliography Advanced Features', () => {
    it('should generate context-aware annotations', async () => {
      const contextualEntries: BibliographyEntry[] = [
        {
          id: 'context-1',
          type: 'book',
          authors: ['Jung, Carl Gustav'],
          title: 'Psychological Types',
          year: 1921,
          publisher: 'Kegan Paul',
          url: 'https://archive.org/psychological-types',
          abstract: 'Jung\'s typology theory',
          relevance: 'Foundational typology work',
          jungianConcepts: ['psychological types', 'introversion', 'extraversion'],
          readingLevel: 'intermediate'
        }
      ];

      const contextualFocusAreas = [
        'personality assessment in therapy',
        'modern applications of psychological types',
        'cultural variations in psychological types'
      ];

      mockProvider.generateCompletion.mockResolvedValue({
        content: 'This foundational work introduces Jung\'s theory of psychological types, distinguishing between introversion and extraversion as well as the four psychological functions. For personality assessment in therapy, this text provides the theoretical basis for understanding individual differences in cognitive and emotional processing. Modern applications extend Jung\'s original framework to contemporary personality assessments like the MBTI. The work also opens discussions about cultural variations in psychological types, though Jung\'s original observations were primarily based on Western populations. Essential reading for understanding both historical development and current applications of typological thinking in analytical psychology.'
      });

      const annotated = await generator.generateAnnotatedBibliography(
        contextualEntries,
        contextualFocusAreas,
        'en'
      );

      expect(annotated).toHaveLength(1);
      expect(annotated[0].annotation).toContain('personality assessment');
      expect(annotated[0].annotation).toContain('modern applications');
      expect(annotated[0].annotation).toContain('cultural variations');
      expect(annotated[0].annotation.length).toBeGreaterThan(200);
    });

    it('should handle annotation generation for different academic levels', async () => {
      const sameEntry: BibliographyEntry = {
        id: 'level-test',
        type: 'article',
        authors: ['Modern, Researcher'],
        title: 'Contemporary Jung Research',
        year: 2023,
        journal: 'Current Psychology',
        url: 'https://journal.com/contemporary',
        abstract: 'Current research in Jungian psychology',
        relevance: 'Up-to-date findings',
        jungianConcepts: ['modern research'],
        readingLevel: 'advanced'
      };

      // Test different annotation styles for different academic levels
      const academicLevels = [
        { 
          level: 'undergraduate', 
          expectedKeywords: ['introduces', 'basic', 'foundation'] 
        },
        { 
          level: 'graduate', 
          expectedKeywords: ['analysis', 'methodology', 'implications'] 
        },
        { 
          level: 'researcher', 
          expectedKeywords: ['methodology', 'limitations', 'future research'] 
        }
      ];

      for (const { level, expectedKeywords } of academicLevels) {
        mockProvider.generateCompletion.mockResolvedValueOnce({
          content: `This research ${expectedKeywords[0]} important concepts in contemporary Jungian psychology. The ${expectedKeywords[1]} approach demonstrates ${expectedKeywords[2]} for current understanding. Recommended for ${level} study.`
        });

        const annotated = await generator.generateAnnotatedBibliography(
          [sameEntry],
          [`research for ${level} level`],
          'en',
          { academicLevel: level }
        );

        expect(annotated[0].annotation).toContain(expectedKeywords[0]);
        expect(annotated[0].annotation).toContain(level);
      }
    });
  });

  describe('Reading Order Optimization', () => {
    it('should suggest optimal reading order for complex learning paths', async () => {
      const complexEntries: BibliographyEntry[] = [
        {
          id: 'foundation-1',
          type: 'book',
          authors: ['Jung, C.G.'],
          title: 'Man and His Symbols',
          year: 1964,
          readingLevel: 'beginner',
          url: 'https://books.com/man-symbols',
          relevance: 'Introduction to Jung',
          jungianConcepts: ['symbols', 'dreams']
        },
        {
          id: 'advanced-1',
          type: 'book',
          authors: ['Jung, C.G.'],
          title: 'Aion',
          year: 1951,
          readingLevel: 'advanced',
          url: 'https://books.com/aion',
          relevance: 'Complex alchemical symbolism',
          jungianConcepts: ['aion', 'self', 'alchemy']
        },
        {
          id: 'intermediate-1',
          type: 'book',
          authors: ['Jung, C.G.'],
          title: 'The Development of Personality',
          year: 1954,
          readingLevel: 'intermediate',
          url: 'https://books.com/personality',
          relevance: 'Personality development theory',
          jungianConcepts: ['personality', 'development']
        },
        {
          id: 'foundation-2',
          type: 'article',
          authors: ['von Franz, M.L.'],
          title: 'Introduction to Jung',
          year: 1975,
          readingLevel: 'beginner',
          url: 'https://articles.com/intro-jung',
          relevance: 'Accessible introduction',
          jungianConcepts: ['jung basics']
        }
      ];

      const learningObjectives = [
        'Build foundational understanding of Jung',
        'Understand personality development',
        'Master complex symbolic thinking'
      ];

      const ordered = await generator.suggestReadingOrder(
        complexEntries,
        learningObjectives
      );

      expect(ordered).toHaveLength(4);
      
      // Should start with beginner level
      expect(['beginner', undefined]).toContain(ordered[0].readingLevel);
      expect(['beginner', undefined]).toContain(ordered[1].readingLevel);
      
      // Should progress to intermediate then advanced
      const levels = ordered.map(entry => entry.readingLevel);
      const beginnerIndex = levels.findIndex(level => level === 'beginner');
      const intermediateIndex = levels.findIndex(level => level === 'intermediate');
      const advancedIndex = levels.findIndex(level => level === 'advanced');
      
      if (beginnerIndex !== -1 && intermediateIndex !== -1) {
        expect(beginnerIndex).toBeLessThan(intermediateIndex);
      }
      if (intermediateIndex !== -1 && advancedIndex !== -1) {
        expect(intermediateIndex).toBeLessThan(advancedIndex);
      }
    });

    it('should handle reading order when some entries lack reading levels', async () => {
      const mixedEntries = [
        {
          id: 'mixed-1',
          type: 'book',
          authors: ['Author One'],
          title: 'First Book',
          year: 2020,
          readingLevel: 'advanced' as const,
          url: 'https://example.com',
          relevance: 'Advanced content',
          jungianConcepts: ['advanced']
        },
        {
          id: 'mixed-2',
          type: 'book',
          authors: ['Author Two'],
          title: 'Second Book',
          year: 2021,
          // No reading level specified
          url: 'https://example.com',
          relevance: 'Unknown level',
          jungianConcepts: ['unknown']
        },
        {
          id: 'mixed-3',
          type: 'book',
          authors: ['Author Three'],
          title: 'Third Book',
          year: 2019,
          readingLevel: 'beginner' as const,
          url: 'https://example.com',
          relevance: 'Basic content',
          jungianConcepts: ['basic']
        }
      ];

      // Mock LLM ordering for entries without levels
      mockProvider.generateStructuredOutput.mockResolvedValue([2, 1, 3]);

      const ordered = await generator.suggestReadingOrder(
        mixedEntries,
        ['Learn progressively']
      );

      expect(ordered).toHaveLength(3);
      // Should handle mixed levels gracefully
      expect(ordered.find(entry => entry.id === 'mixed-3')?.readingLevel).toBe('beginner');
      expect(ordered.find(entry => entry.id === 'mixed-1')?.readingLevel).toBe('advanced');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle provider timeout during bibliography generation', async () => {
      mockProvider.generateStructuredOutput.mockImplementation(
        () => new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );

      const bibliography = await generator.generateBibliography(
        'Timeout Test',
        ['concept'],
        'intermediate',
        5
      );

      expect(bibliography).toEqual([]);
    });

    it('should handle malformed provider responses', async () => {
      const malformedResponses = [
        null,
        undefined,
        {},
        { notAnArray: true },
        'string response',
        123,
        [null, undefined, {}, 'invalid']
      ];

      for (const response of malformedResponses) {
        mockProvider.generateStructuredOutput.mockResolvedValueOnce(response as any);

        const bibliography = await generator.generateBibliography(
          'Malformed Test',
          ['concept'],
          'beginner',
          1
        );

        if (Array.isArray(response) && response.length > 0) {
          // Should create fallback entries for invalid items
          expect(bibliography.length).toBeGreaterThan(0);
        } else {
          expect(bibliography).toEqual([]);
        }
      }
    });

    it('should validate and sanitize user inputs', async () => {
      const edgeCaseInputs = [
        {
          topic: '',
          concepts: ['valid concept'],
          level: 'beginner' as const,
          count: 5
        },
        {
          topic: 'x'.repeat(10000), // Very long topic
          concepts: ['concept'],
          level: 'intermediate' as const,
          count: 5
        },
        {
          topic: 'Valid Topic',
          concepts: [], // Empty concepts
          level: 'advanced' as const,
          count: 5
        },
        {
          topic: 'Valid Topic',
          concepts: Array(1000).fill('concept'), // Too many concepts
          level: 'beginner' as const,
          count: 5
        }
      ];

      mockProvider.generateStructuredOutput.mockResolvedValue([]);

      for (const input of edgeCaseInputs) {
        const bibliography = await generator.generateBibliography(
          input.topic,
          input.concepts,
          input.level,
          input.count
        );

        // Should handle all edge cases gracefully
        expect(Array.isArray(bibliography)).toBe(true);
      }
    });

    it('should handle network errors during citation formatting', async () => {
      const testEntry: BibliographyEntry = {
        id: 'network-test',
        type: 'book',
        authors: ['Test Author'],
        title: 'Network Test Book',
        year: 2023,
        url: 'https://example.com',
        relevance: 'Testing network errors',
        jungianConcepts: ['network']
      };

      mockProvider.generateCompletion.mockRejectedValue(new Error('Network error'));

      await expect(generator.formatCitation(testEntry, 'APA'))
        .rejects.toThrow('Failed to format citation');
    });

    it('should handle extremely large bibliography requests', async () => {
      // Test with very large count
      const largeCount = 1000;
      
      mockProvider.generateStructuredOutput.mockResolvedValue(
        Array(largeCount).fill(null).map((_, i) => ({
          type: 'book',
          authors: [`Author ${i}`],
          title: `Book ${i}`,
          year: 2023,
          publisher: 'Test Publisher',
          url: `https://example.com/book${i}`,
          abstract: `Abstract for book ${i}`,
          relevance: 'Test relevance',
          jungianConcepts: [`concept${i}`],
          readingLevel: 'intermediate'
        }))
      );

      const bibliography = await generator.generateBibliography(
        'Large Test',
        ['concept'],
        'intermediate',
        largeCount
      );

      // Should handle large requests but may limit results
      expect(bibliography.length).toBeGreaterThan(0);
      expect(bibliography.length).toBeLessThanOrEqual(largeCount);
      
      // Each entry should have required fields
      bibliography.forEach((entry, index) => {
        expect(entry).toHaveProperty('id');
        expect(entry).toHaveProperty('authors');
        expect(entry).toHaveProperty('title');
        expect(entry).toHaveProperty('year');
      });
    });
  });
});