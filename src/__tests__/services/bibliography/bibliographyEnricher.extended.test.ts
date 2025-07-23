import { 
  enrichReference, 
  generateBibliography, 
  generateReadingPath,
  exportBibliography,
  formatters
} from '../../../services/bibliography/bibliographyEnricher';
import { Reference } from '../../../services/bibliography/referenceDatabase';

describe('BibliographyEnricher Extended Tests', () => {
  // Sample references for testing
  const sampleReference: Reference = {
    id: 'test-ref-1',
    type: 'book',
    title: 'Test Book on Jung',
    author: 'Test Author',
    year: 2020,
    publisher: 'Test Publisher',
    isbn: '978-0-123456789',
    category: ['accessible', 'introduction'],
    keywords: ['jung', 'psychology', 'archetypes', 'shadow']
  };

  const multiAuthorReference: Reference = {
    id: 'test-ref-2',
    type: 'article',
    title: 'Collective Unconscious in Modern Psychology',
    author: ['First Author', 'Second Author', 'Third Author'],
    year: 2022,
    journal: 'Journal of Analytical Psychology',
    volume: 67,
    issue: 3,
    pages: '45-67',
    doi: '10.1234/test.doi',
    category: ['academic', 'jungian-analysis'],
    keywords: ['collective unconscious', 'modern psychology', 'research']
  };

  const filmReference: Reference = {
    id: 'test-film-1',
    type: 'film',
    title: 'Jung: A Film About Dreams',
    author: 'Test Director',
    year: 2019,
    publisher: 'Test Studios',
    category: ['documentary'],
    keywords: ['dreams', 'jung', 'documentary']
  };

  const chapterReference: Reference = {
    id: 'test-chapter-1',
    type: 'chapter',
    title: 'Jung and Modern Thought',
    author: 'Chapter Author',
    year: 2021,
    publisher: 'Academic Press',
    category: ['academic'],
    keywords: ['jung', 'modern', 'thought']
  };

  describe('formatters', () => {
    describe('APA formatter', () => {
      it('should format single author book correctly', () => {
        const formatted = formatters.apa(sampleReference);
        expect(formatted).toBe('Test Author (2020). *Test Book on Jung*. Test Publisher.');
      });

      it('should format multiple authors article correctly', () => {
        const formatted = formatters.apa(multiAuthorReference);
        expect(formatted).toContain('First Author, et al.');
        expect(formatted).toContain('(2022)');
        expect(formatted).toContain('Collective Unconscious in Modern Psychology');
        expect(formatted).toContain('*Journal of Analytical Psychology*');
        expect(formatted).toContain('67(3)');
        expect(formatted).toContain('45-67');
        expect(formatted).toContain('https://doi.org/10.1234/test.doi');
      });

      it('should format two authors correctly', () => {
        const twoAuthorRef = {
          ...sampleReference,
          author: ['First Author', 'Second Author']
        };
        const formatted = formatters.apa(twoAuthorRef);
        expect(formatted).toContain('First Author, & Second Author');
      });

      it('should format film reference correctly', () => {
        const formatted = formatters.apa(filmReference);
        expect(formatted).toBe('Test Director (Director). (2019). *Jung: A Film About Dreams* [Film]. Test Studios.');
      });

      it('should format chapter reference correctly', () => {
        const formatted = formatters.apa(chapterReference);
        expect(formatted).toBe('Chapter Author (2021). Jung and Modern Thought. In Academic Press.');
      });

      it('should handle missing data gracefully', () => {
        const refWithMissingData = {
          ...multiAuthorReference,
          issue: undefined,
          pages: undefined,
          doi: undefined
        };
        const formatted = formatters.apa(refWithMissingData);
        expect(formatted).toContain('67, n.p.');
        expect(formatted).not.toContain('https://doi.org/');
      });
    });

    describe('MLA formatter', () => {
      it('should format single author book correctly', () => {
        const formatted = formatters.mla(sampleReference);
        expect(formatted).toBe('Author, Test. *Test Book on Jung.* Test Publisher, 2020.');
      });

      it('should format multiple authors article correctly', () => {
        const formatted = formatters.mla(multiAuthorReference);
        expect(formatted).toContain('Author, First, et al.');
        expect(formatted).toContain('"Collective Unconscious in Modern Psychology."');
        expect(formatted).toContain('*Journal of Analytical Psychology*');
        expect(formatted).toContain('vol. 67, no. 3');
        expect(formatted).toContain('pp. 45-67');
        expect(formatted).toContain('doi:10.1234/test.doi');
      });

      it('should format two authors correctly', () => {
        const twoAuthorRef = {
          ...sampleReference,
          author: ['First Author', 'Second Author']
        };
        const formatted = formatters.mla(twoAuthorRef);
        expect(formatted).toContain('Author, First, and Second Author');
      });

      it('should format film reference correctly', () => {
        const formatted = formatters.mla(filmReference);
        expect(formatted).toBe('*Jung: A Film About Dreams.* Directed by Test Director, Test Studios, 2019.');
      });

      it('should handle missing issue number', () => {
        const refWithoutIssue = {
          ...multiAuthorReference,
          issue: undefined
        };
        const formatted = formatters.mla(refWithoutIssue);
        expect(formatted).toContain('no. n.i.');
      });

      it('should handle unknown type with fallback format', () => {
        const unknownTypeRef = {
          ...sampleReference,
          type: 'unknown' as any
        };
        const formatted = formatters.mla(unknownTypeRef);
        expect(formatted).toContain('Author, Test. *Test Book on Jung.* 2020.');
      });
    });

    describe('Chicago formatter', () => {
      it('should format book correctly', () => {
        const formatted = formatters.chicago(sampleReference);
        expect(formatted).toBe('Test Author. *Test Book on Jung*. Test Publisher, 2020.');
      });

      it('should format article correctly', () => {
        const formatted = formatters.chicago(multiAuthorReference);
        expect(formatted).toContain('First Author, Second Author, Third Author');
        expect(formatted).toContain('"Collective Unconscious in Modern Psychology."');
        expect(formatted).toContain('*Journal of Analytical Psychology* 67');
        expect(formatted).toContain('no. 3');
        expect(formatted).toContain('(2022): 45-67');
        expect(formatted).toContain('https://doi.org/10.1234/test.doi');
      });

      it('should handle missing data gracefully', () => {
        const refWithMissingData = {
          ...multiAuthorReference,
          issue: undefined,
          pages: undefined,
          doi: undefined
        };
        const formatted = formatters.chicago(refWithMissingData);
        expect(formatted).toContain('no. n.i.');
        expect(formatted).toContain('n.p.');
        expect(formatted).not.toContain('https://doi.org/');
      });

      it('should handle unknown type with fallback format', () => {
        const unknownTypeRef = {
          ...sampleReference,
          type: 'lecture' as Reference['type']
        };
        const formatted = formatters.chicago(unknownTypeRef);
        expect(formatted).toBe('Test Author. *Test Book on Jung*. 2020.');
      });
    });
  });

  describe('enrichReference', () => {
    it('should assess reading level correctly for beginner titles', () => {
      const beginnerRef: Reference = {
        ...sampleReference,
        title: 'Man and His Symbols',
        category: ['popular']
      };
      const enriched = enrichReference(beginnerRef);
      expect(enriched.readingLevel).toBe('beginner');
    });

    it('should assess reading level for Memories, Dreams, Reflections', () => {
      const mdrRef: Reference = {
        ...sampleReference,
        title: 'Memories, Dreams, Reflections',
        category: ['autobiography']
      };
      const enriched = enrichReference(mdrRef);
      expect(enriched.readingLevel).toBe('beginner');
    });

    it('should assess reading level for practical and introduction categories', () => {
      const practicalRef: Reference = {
        ...sampleReference,
        category: ['practical', 'jungian-analysis']
      };
      const enriched = enrichReference(practicalRef);
      expect(enriched.readingLevel).toBe('intermediate');
    });

    it('should assess advanced level for specific Collected Works', () => {
      const cwRef: Reference = {
        ...sampleReference,
        id: 'cw9i',
        category: ['collected-works']
      };
      const enriched = enrichReference(cwRef);
      expect(enriched.readingLevel).toBe('advanced');
    });

    it('should assess scholar level for Red Book and Black Books', () => {
      const redBookRef: Reference = {
        ...sampleReference,
        id: 'redbook',
        category: ['primary-text']
      };
      const enriched = enrichReference(redBookRef);
      expect(enriched.readingLevel).toBe('scholar');

      const blackBooksRef: Reference = {
        ...sampleReference,
        id: 'blackbooks',
        category: ['primary-text']
      };
      const enrichedBB = enrichReference(blackBooksRef);
      expect(enrichedBB.readingLevel).toBe('scholar');
    });

    it('should assess scholar level for academic articles', () => {
      const enriched = enrichReference(multiAuthorReference);
      expect(enriched.readingLevel).toBe('scholar');
    });

    it('should calculate topic relevance scores correctly', () => {
      const enriched = enrichReference(sampleReference, {
        topic: 'shadow',
        keywords: ['archetypes', 'jung']
      });
      
      expect(enriched.topicRelevance.topic).toBeGreaterThan(0);
      expect(enriched.topicRelevance.keywords).toBeGreaterThan(0);
      expect(Object.keys(enriched.topicRelevance)).toContain('archetypes');
    });

    it('should find prerequisites correctly', () => {
      const cw5Ref: Reference = {
        ...sampleReference,
        id: 'cw5',
        category: ['collected-works']
      };
      const enriched = enrichReference(cw5Ref);
      expect(enriched.prerequisiteIds).toEqual(['cw6', 'cw9i']);
    });

    it('should find prerequisites for advanced works', () => {
      const cw14Ref: Reference = {
        ...sampleReference,
        id: 'cw14',
        category: ['collected-works', 'alchemy']
      };
      const enriched = enrichReference(cw14Ref);
      expect(enriched.prerequisiteIds).toEqual(['cw12', 'cw13']);
    });

    it('should find related references based on shared categories', () => {
      const testRef: Reference = {
        ...sampleReference,
        category: ['alchemy', 'symbolism', 'collected-works'],
        keywords: ['transformation', 'symbols', 'opus']
      };
      const enriched = enrichReference(testRef);
      expect(enriched.relatedIds).toBeDefined();
      expect(enriched.relatedIds!.length).toBeLessThanOrEqual(5);
    });

    it('should calculate relevance score with reading level preference', () => {
      const enrichedWithPref = enrichReference(sampleReference, {
        readingLevel: 'beginner'
      });
      const enrichedWithoutPref = enrichReference(sampleReference);
      
      // Beginner reference should score higher when beginner is preferred
      expect(enrichedWithPref.relevanceScore).toBeGreaterThan(enrichedWithoutPref.relevanceScore);
    });

    it('should handle references without prerequisites', () => {
      const enriched = enrichReference(sampleReference);
      expect(enriched.prerequisiteIds).toBeUndefined();
    });

    it('should generate all citation formats', () => {
      const enriched = enrichReference(multiAuthorReference);
      expect(enriched.formattedCitation.apa).toBeDefined();
      expect(enriched.formattedCitation.mla).toBeDefined();
      expect(enriched.formattedCitation.chicago).toBeDefined();
      expect(enriched.formattedCitation.apa).toContain('First Author, et al.');
      expect(enriched.formattedCitation.mla).toContain('Author, First, et al.');
      expect(enriched.formattedCitation.chicago).toContain('First Author, Second Author, Third Author');
    });
  });

  describe('generateBibliography', () => {
    it('should filter by include types', () => {
      const results = generateBibliography({
        includeTypes: ['book']
      });
      
      expect(results.every(ref => ref.type === 'book')).toBeTruthy();
    });

    it('should filter by exclude types', () => {
      const results = generateBibliography({
        excludeTypes: ['film', 'interview']
      });
      
      expect(results.every(ref => ref.type !== 'film' && ref.type !== 'interview')).toBeTruthy();
    });

    it('should filter by year range', () => {
      const results = generateBibliography({
        yearRange: { start: 2000, end: 2020 }
      });
      
      expect(results.every(ref => ref.year >= 2000 && ref.year <= 2020)).toBeTruthy();
    });

    it('should filter by reading level', () => {
      const results = generateBibliography({
        readingLevel: 'beginner'
      });
      
      expect(results.every(ref => ref.readingLevel === 'beginner')).toBeTruthy();
    });

    it('should sort by year', () => {
      const results = generateBibliography({
        sortBy: 'year'
      });
      
      for (let i = 1; i < results.length; i++) {
        expect(results[i-1].year).toBeGreaterThanOrEqual(results[i].year);
      }
    });

    it('should sort by reading level', () => {
      const results = generateBibliography({
        sortBy: 'readingLevel'
      });
      
      const levelOrder = { 'beginner': 0, 'intermediate': 1, 'advanced': 2, 'scholar': 3 };
      for (let i = 1; i < results.length; i++) {
        expect(levelOrder[results[i-1].readingLevel]).toBeLessThanOrEqual(levelOrder[results[i].readingLevel]);
      }
    });

    it('should sort by title alphabetically', () => {
      const results = generateBibliography({
        sortBy: 'title'
      });
      
      for (let i = 1; i < results.length; i++) {
        expect(results[i-1].title.localeCompare(results[i].title)).toBeLessThanOrEqual(0);
      }
    });

    it('should sort by relevance by default', () => {
      const results = generateBibliography({
        topic: 'shadow',
        keywords: ['archetype']
      });
      
      for (let i = 1; i < results.length; i++) {
        expect(results[i-1].relevanceScore).toBeGreaterThanOrEqual(results[i].relevanceScore);
      }
    });

    it('should limit results correctly', () => {
      const results = generateBibliography({
        maxResults: 5
      });
      
      expect(results.length).toBeLessThanOrEqual(5);
    });

    it('should handle empty options', () => {
      const results = generateBibliography();
      expect(results.length).toBeGreaterThan(0);
    });

    it('should combine multiple filters', () => {
      const results = generateBibliography({
        includeTypes: ['book'],
        yearRange: { start: 1960, end: 1980 },
        readingLevel: 'intermediate',
        maxResults: 10,
        sortBy: 'year'
      });
      
      expect(results.length).toBeLessThanOrEqual(10);
      expect(results.every(ref => ref.type === 'book')).toBeTruthy();
      expect(results.every(ref => ref.year >= 1960 && ref.year <= 1980)).toBeTruthy();
      expect(results.every(ref => ref.readingLevel === 'intermediate')).toBeTruthy();
    });
  });

  describe('generateReadingPath', () => {
    it('should generate reading paths for a topic', () => {
      const paths = generateReadingPath('shadow');
      
      expect(paths.length).toBeGreaterThan(0);
      expect(paths.some(p => p.level === 'Beginner')).toBeTruthy();
      expect(paths.some(p => p.level === 'Intermediate')).toBeTruthy();
      expect(paths.some(p => p.level === 'Advanced')).toBeTruthy();
    });

    it('should include appropriate descriptions', () => {
      const paths = generateReadingPath('individuation');
      
      const beginnerPath = paths.find(p => p.level === 'Beginner');
      expect(beginnerPath?.description).toContain('accessible introductions');
      
      const intermediatePath = paths.find(p => p.level === 'Intermediate');
      expect(intermediatePath?.description).toContain('core Jungian texts');
      
      const advancedPath = paths.find(p => p.level === 'Advanced');
      expect(advancedPath?.description).toContain('complex theoretical works');
    });

    it('should include scholar path when available', () => {
      const paths = generateReadingPath('alchemy');
      
      const scholarPath = paths.find(p => p.level === 'Scholar');
      if (scholarPath) {
        expect(scholarPath.description).toContain('primary sources');
        expect(scholarPath.references.length).toBeGreaterThan(0);
      }
    });

    it('should filter out empty paths', () => {
      const paths = generateReadingPath('very_specific_topic_unlikely_to_match');
      
      // All paths should have at least one reference
      paths.forEach(path => {
        expect(path.references.length).toBeGreaterThan(0);
      });
    });

    it('should sort references by relevance within each path', () => {
      const paths = generateReadingPath('collective unconscious');
      
      paths.forEach(path => {
        for (let i = 1; i < path.references.length; i++) {
          expect(path.references[i-1].relevanceScore).toBeGreaterThanOrEqual(path.references[i].relevanceScore);
        }
      });
    });
  });

  describe('exportBibliography', () => {
    const enrichedRefs = [
      enrichReference(sampleReference),
      enrichReference(multiAuthorReference),
      enrichReference(filmReference)
    ];

    it('should export in APA format', () => {
      const exported = exportBibliography(enrichedRefs, 'apa');
      
      expect(exported).toContain('Test Author (2020)');
      expect(exported).toContain('First Author, et al. (2022)');
      expect(exported).toContain('Test Director (Director)');
      expect(exported.split('\n\n').length).toBe(3);
    });

    it('should export in MLA format', () => {
      const exported = exportBibliography(enrichedRefs, 'mla');
      
      expect(exported).toContain('Author, Test');
      expect(exported).toContain('Author, First, et al.');
      expect(exported).toContain('Directed by Test Director');
    });

    it('should export in Chicago format', () => {
      const exported = exportBibliography(enrichedRefs, 'chicago');
      
      expect(exported).toContain('Test Author. *Test Book on Jung*');
      expect(exported).toContain('First Author, Second Author, Third Author');
    });

    it('should export in BibTeX format', () => {
      const exported = exportBibliography(enrichedRefs, 'bibtex');
      
      expect(exported).toContain('@book{test-ref-1,');
      expect(exported).toContain('@article{test-ref-2,');
      expect(exported).toContain('title = {Test Book on Jung}');
      expect(exported).toContain('author = {Test Author}');
      expect(exported).toContain('year = {2020}');
      expect(exported).toContain('journal = {Journal of Analytical Psychology}');
      expect(exported).toContain('volume = {67}');
      expect(exported).toContain('number = {3}');
      expect(exported).toContain('doi = {10.1234/test.doi}');
    });

    it('should handle missing fields in BibTeX export', () => {
      const refWithMissingFields = {
        ...sampleReference,
        publisher: undefined,
        isbn: undefined
      };
      const enrichedRef = enrichReference(refWithMissingFields);
      const exported = exportBibliography([enrichedRef], 'bibtex');
      
      expect(exported).not.toContain('publisher =');
      expect(exported).not.toContain('isbn =');
    });

    it('should join multiple authors with "and" in BibTeX', () => {
      const exported = exportBibliography([enrichReference(multiAuthorReference)], 'bibtex');
      
      expect(exported).toContain('author = {First Author and Second Author and Third Author}');
    });

    it('should default to APA format', () => {
      const exportedDefault = exportBibliography(enrichedRefs);
      const exportedAPA = exportBibliography(enrichedRefs, 'apa');
      
      expect(exportedDefault).toBe(exportedAPA);
    });
  });
});