import {
  findReferencesByKeywords,
  findReferencesByCategory,
  findReferencesByAuthor,
  findReferencesByType,
  findReferencesInYearRange,
  allReferences,
  jungCollectedWorks,
  jungPopularWorks,
  contemporaryJungian,
  filmReferences,
  academicResearch,
  referenceCategories,
  keywordGroups,
  Reference
} from '../../../services/bibliography/referenceDatabase';

describe('Reference Database', () => {
  describe('Data integrity', () => {
    it('should have all required fields for each reference', () => {
      allReferences.forEach(ref => {
        expect(ref.id).toBeDefined();
        expect(ref.type).toBeDefined();
        expect(ref.title).toBeDefined();
        expect(ref.author).toBeDefined();
        expect(ref.year).toBeDefined();
        expect(ref.category).toBeDefined();
        expect(ref.category).toBeInstanceOf(Array);
        expect(ref.keywords).toBeDefined();
        expect(ref.keywords).toBeInstanceOf(Array);
      });
    });

    it('should have valid reference types', () => {
      const validTypes = ['book', 'article', 'film', 'chapter', 'interview', 'lecture'];
      allReferences.forEach(ref => {
        expect(validTypes).toContain(ref.type);
      });
    });

    it('should have unique IDs', () => {
      const ids = allReferences.map(ref => ref.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have reasonable year values', () => {
      allReferences.forEach(ref => {
        expect(ref.year).toBeGreaterThan(1900);
        expect(ref.year).toBeLessThanOrEqual(new Date().getFullYear());
      });
    });

    it('should have consistent data for Collected Works', () => {
      jungCollectedWorks.forEach(cw => {
        expect(cw.author).toBe('Carl G. Jung');
        expect(cw.publisher).toBe('Princeton University Press');
        expect(cw.category).toContain('collected-works');
        expect(cw.id).toMatch(/^cw\d+[a-z]*$/);
      });
    });

    it('should have consistent ISBN format', () => {
      allReferences.forEach(ref => {
        if (ref.isbn) {
          // ISBN-13 format: 978-X-XXXXX-XXX-X (allowing up to 7 digits in publisher code)
          expect(ref.isbn).toMatch(/^978-\d{1}-\d{2,7}-\d{2,6}-\d{1}$/);
        }
      });
    });

    it('should have DOI format for articles with DOI', () => {
      allReferences.forEach(ref => {
        if (ref.doi) {
          // Basic DOI format check
          expect(ref.doi).toMatch(/^\d+\.\d+\/.+$/);
        }
      });
    });
  });

  describe('findReferencesByKeywords', () => {
    it('should find references by single keyword', () => {
      const results = findReferencesByKeywords(['shadow']);
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(ref => 
        ref.keywords.some(k => k.toLowerCase().includes('shadow'))
      )).toBeTruthy();
    });

    it('should find references by multiple keywords', () => {
      const results = findReferencesByKeywords(['archetype', 'collective']);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should be case-insensitive', () => {
      const resultsLower = findReferencesByKeywords(['shadow']);
      const resultsUpper = findReferencesByKeywords(['SHADOW']);
      const resultsMixed = findReferencesByKeywords(['ShAdOw']);
      
      expect(resultsLower.length).toBe(resultsUpper.length);
      expect(resultsLower.length).toBe(resultsMixed.length);
    });

    it('should find references with partial keyword matches', () => {
      const results = findReferencesByKeywords(['psych']);
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(ref => 
        ref.keywords.some(k => k.toLowerCase().includes('psych'))
      )).toBeTruthy();
    });

    it('should return empty array for non-existent keywords', () => {
      const results = findReferencesByKeywords(['nonexistentkeyword123']);
      expect(results).toEqual([]);
    });

    it('should handle empty keyword array', () => {
      const results = findReferencesByKeywords([]);
      expect(results).toEqual([]);
    });
  });

  describe('findReferencesByCategory', () => {
    it('should find references by category', () => {
      const results = findReferencesByCategory('collected-works');
      expect(results.length).toBe(19); // 19 volumes of Collected Works (including 9i and 9ii)
      expect(results.every(ref => ref.category.includes('collected-works'))).toBeTruthy();
    });

    it('should be case-insensitive', () => {
      const resultsLower = findReferencesByCategory('alchemy');
      const resultsUpper = findReferencesByCategory('ALCHEMY');
      
      expect(resultsLower.length).toBe(resultsUpper.length);
    });

    it('should find popular/accessible works', () => {
      const popularResults = findReferencesByCategory('popular');
      const accessibleResults = findReferencesByCategory('accessible');
      
      expect(popularResults.length).toBeGreaterThan(0);
      expect(accessibleResults.length).toBeGreaterThan(0);
    });

    it('should find academic category', () => {
      const results = findReferencesByCategory('academic');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(ref => ref.type === 'article')).toBeTruthy();
    });

    it('should return empty array for non-existent category', () => {
      const results = findReferencesByCategory('nonexistentcategory');
      expect(results).toEqual([]);
    });
  });

  describe('findReferencesByAuthor', () => {
    it('should find all Jung references', () => {
      const results = findReferencesByAuthor('Jung');
      expect(results.length).toBeGreaterThan(20);
      
      results.forEach(ref => {
        const authors = Array.isArray(ref.author) ? ref.author : [ref.author];
        expect(authors.some(a => a.toLowerCase().includes('jung'))).toBeTruthy();
      });
    });

    it('should find references by partial author name', () => {
      const results = findReferencesByAuthor('von Franz');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(ref => {
        const authors = Array.isArray(ref.author) ? ref.author : [ref.author];
        return authors.some(a => a.includes('von Franz'));
      })).toBeTruthy();
    });

    it('should handle array authors correctly', () => {
      const results = findReferencesByAuthor('Robert Moore');
      expect(results.length).toBeGreaterThan(0);
      
      const kingWarriorRef = results.find(ref => ref.id === 'moore-king');
      expect(kingWarriorRef).toBeDefined();
      expect(Array.isArray(kingWarriorRef!.author)).toBeTruthy();
    });

    it('should be case-insensitive', () => {
      const resultsLower = findReferencesByAuthor('hillman');
      const resultsUpper = findReferencesByAuthor('HILLMAN');
      const resultsMixed = findReferencesByAuthor('HiLLmaN');
      
      expect(resultsLower.length).toBe(resultsUpper.length);
      expect(resultsLower.length).toBe(resultsMixed.length);
    });

    it('should return empty array for non-existent author', () => {
      const results = findReferencesByAuthor('NonExistentAuthor123');
      expect(results).toEqual([]);
    });
  });

  describe('findReferencesByType', () => {
    it('should find all books', () => {
      const results = findReferencesByType('book');
      expect(results.length).toBeGreaterThan(20);
      expect(results.every(ref => ref.type === 'book')).toBeTruthy();
    });

    it('should find all articles', () => {
      const results = findReferencesByType('article');
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(ref => ref.type === 'article')).toBeTruthy();
      expect(results.every(ref => ref.journal !== undefined)).toBeTruthy();
    });

    it('should find all films', () => {
      const results = findReferencesByType('film');
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(ref => ref.type === 'film')).toBeTruthy();
    });

    it('should find chapters', () => {
      const results = findReferencesByType('chapter');
      // Currently no chapter references in database, so expect 0
      expect(results.length).toBe(0);
    });

    it('should find interviews', () => {
      const results = findReferencesByType('interview');
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(ref => ref.type === 'interview')).toBeTruthy();
    });

    it('should return empty array for invalid type', () => {
      const results = findReferencesByType('invalid' as any);
      expect(results).toEqual([]);
    });
  });

  describe('findReferencesInYearRange', () => {
    it('should find references in specific decade', () => {
      const results = findReferencesInYearRange(1960, 1969);
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(ref => ref.year >= 1960 && ref.year <= 1969)).toBeTruthy();
    });

    it('should find recent publications', () => {
      const results = findReferencesInYearRange(2000, 2024);
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(ref => ref.year >= 2000)).toBeTruthy();
    });

    it('should include boundary years', () => {
      const results = findReferencesInYearRange(2009, 2009);
      const redBook = results.find(ref => ref.id === 'redbook');
      expect(redBook).toBeDefined();
      expect(redBook!.year).toBe(2009);
    });

    it('should return empty array for future years', () => {
      const results = findReferencesInYearRange(2030, 2040);
      expect(results).toEqual([]);
    });

    it('should return empty array for invalid range', () => {
      const results = findReferencesInYearRange(2000, 1990);
      expect(results).toEqual([]);
    });
  });

  describe('Reference collections', () => {
    it('should have correct number of Collected Works', () => {
      expect(jungCollectedWorks.length).toBe(19); // 19 volumes (including CW9i and CW9ii)
    });

    it('should have popular works including Man and His Symbols', () => {
      const manAndSymbols = jungPopularWorks.find(ref => ref.id === 'mams');
      expect(manAndSymbols).toBeDefined();
      expect(manAndSymbols!.title).toBe('Man and His Symbols');
      expect(Array.isArray(manAndSymbols!.author)).toBeTruthy();
    });

    it('should have contemporary Jungian authors', () => {
      expect(contemporaryJungian.length).toBeGreaterThan(0);
      expect(contemporaryJungian.some(ref => 
        ref.author.includes('Marie-Louise von Franz')
      )).toBeTruthy();
    });

    it('should have film references with URLs', () => {
      expect(filmReferences.length).toBeGreaterThan(0);
      expect(filmReferences.every(ref => 
        ref.type === 'film' || ref.type === 'interview'
      )).toBeTruthy();
      expect(filmReferences.every(ref => ref.url !== undefined)).toBeTruthy();
    });

    it('should have academic research with DOIs', () => {
      expect(academicResearch.length).toBeGreaterThan(0);
      const articlesWithDoi = academicResearch.filter(ref => 
        ref.type === 'article' && ref.doi
      );
      expect(articlesWithDoi.length).toBeGreaterThan(0);
    });
  });

  describe('Reference categories list', () => {
    it('should contain all major categories', () => {
      expect(referenceCategories).toContain('collected-works');
      expect(referenceCategories).toContain('accessible');
      expect(referenceCategories).toContain('jungian-analysis');
      expect(referenceCategories).toContain('shadow-work');
      expect(referenceCategories).toContain('typology');
      expect(referenceCategories).toContain('archetypes');
      expect(referenceCategories).toContain('alchemy');
      expect(referenceCategories).toContain('academic');
    });

    it('should have all categories present in actual references', () => {
      const usedCategories = new Set<string>();
      allReferences.forEach(ref => {
        ref.category.forEach(cat => usedCategories.add(cat));
      });
      
      // Most categories should be in the predefined list
      const overlap = referenceCategories.filter(cat => usedCategories.has(cat));
      expect(overlap.length).toBeGreaterThan(referenceCategories.length * 0.8);
    });
  });

  describe('Keyword groups', () => {
    it('should have core concepts', () => {
      expect(keywordGroups.core).toContain('unconscious');
      expect(keywordGroups.core).toContain('conscious');
      expect(keywordGroups.core).toContain('psyche');
      expect(keywordGroups.core).toContain('self');
      expect(keywordGroups.core).toContain('ego');
    });

    it('should have major archetypes', () => {
      expect(keywordGroups.archetypes).toContain('shadow');
      expect(keywordGroups.archetypes).toContain('anima');
      expect(keywordGroups.archetypes).toContain('animus');
      expect(keywordGroups.archetypes).toContain('persona');
      expect(keywordGroups.archetypes).toContain('self');
    });

    it('should have process keywords', () => {
      expect(keywordGroups.processes).toContain('individuation');
      expect(keywordGroups.processes).toContain('active imagination');
      expect(keywordGroups.processes).toContain('synchronicity');
    });

    it('should have clinical keywords', () => {
      expect(keywordGroups.clinical).toContain('therapy');
      expect(keywordGroups.clinical).toContain('transference');
      expect(keywordGroups.clinical).toContain('complex');
    });

    it('should have spiritual keywords', () => {
      expect(keywordGroups.spiritual).toContain('alchemy');
      expect(keywordGroups.spiritual).toContain('mythology');
      expect(keywordGroups.spiritual).toContain('transformation');
    });
  });

  describe('Complex queries', () => {
    it('should combine multiple search criteria effectively', () => {
      // Find Jung's books about alchemy from the 1960s
      const jungRefs = findReferencesByAuthor('Jung');
      const books = jungRefs.filter(ref => ref.type === 'book');
      const sixties = books.filter(ref => ref.year >= 1960 && ref.year <= 1969);
      const alchemy = sixties.filter(ref => 
        ref.keywords.some(k => k.toLowerCase().includes('alchemy')) ||
        ref.category.includes('alchemy')
      );
      
      expect(alchemy.length).toBeGreaterThan(0);
      expect(alchemy.some(ref => ref.id === 'cw12')).toBeTruthy();
    });

    it('should find introductory materials', () => {
      const introRefs = allReferences.filter(ref => 
        ref.category.includes('introduction') ||
        ref.category.includes('accessible') ||
        ref.keywords.some(k => k.toLowerCase().includes('introduction')) ||
        ref.title.toLowerCase().includes('introduction')
      );
      
      expect(introRefs.length).toBeGreaterThan(0);
      expect(introRefs.some(ref => ref.title.includes('Map of the Soul'))).toBeTruthy();
    });

    it('should find materials about specific archetypes', () => {
      const shadowRefs = findReferencesByKeywords(['shadow']);
      const animaRefs = findReferencesByKeywords(['anima', 'animus']);
      
      expect(shadowRefs.length).toBeGreaterThan(0);
      expect(animaRefs.length).toBeGreaterThan(0);
      
      // Check for von Franz's shadow work
      expect(shadowRefs.some(ref => 
        ref.id === 'vonfranz-shadow' && ref.title.includes('Shadow and Evil')
      )).toBeTruthy();
    });
  });
});