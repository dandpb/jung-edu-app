import { processModuleContent, extractKeyTerms, generateSummary } from '../contentProcessor';

describe('Content Processor', () => {
  describe('processModuleContent', () => {
    it('should process module content and add metadata', () => {
      const content = 'This is about the collective unconscious and individuation process in analytical psychology.';
      
      const processed = processModuleContent(content);
      
      expect(processed).toBeDefined();
      expect(typeof processed).toBe('string');
      expect(processed.length).toBeGreaterThan(0);
    });

    it('should handle empty content', () => {
      const processed = processModuleContent('');
      
      expect(processed).toBe('');
    });

    it('should handle content with special characters', () => {
      const content = 'Jung\'s "collective unconscious" & archetypes: shadow, anima/animus.';
      
      const processed = processModuleContent(content);
      
      expect(processed).toBeDefined();
      expect(processed).toContain('Jung');
      expect(processed).toContain('collective unconscious');
    });

    it('should handle very long content', () => {
      const longContent = 'Carl Jung '.repeat(1000) + 'analytical psychology';
      
      const processed = processModuleContent(longContent);
      
      expect(processed).toBeDefined();
      expect(processed.length).toBeGreaterThan(0);
    });

    it('should handle content with line breaks and formatting', () => {
      const content = `Carl Jung's Analytical Psychology

      Key Concepts:
      - Collective Unconscious
      - Individuation
      - Archetypes
      
      The process of individuation is central to Jung's theory.`;
      
      const processed = processModuleContent(content);
      
      expect(processed).toBeDefined();
      expect(processed).toContain('Jung');
      expect(processed).toContain('individuation');
    });
  });

  describe('extractKeyTerms', () => {
    it('should extract psychological terms from content', () => {
      const content = 'The collective unconscious contains archetypes such as the shadow, anima, and animus. Individuation is the process of psychological integration.';
      
      const keyTerms = extractKeyTerms(content);
      
      expect(Array.isArray(keyTerms)).toBe(true);
      expect(keyTerms.length).toBeGreaterThan(0);
      
      // Should contain some psychological terms
      const termTexts = keyTerms.map(term => term.term.toLowerCase());
      expect(termTexts.some(term => term.includes('unconscious') || term.includes('archetype') || term.includes('shadow'))).toBe(true);
    });

    it('should handle empty content for key terms', () => {
      const keyTerms = extractKeyTerms('');
      
      expect(Array.isArray(keyTerms)).toBe(true);
      expect(keyTerms.length).toBe(0);
    });

    it('should extract terms from content without psychological terms', () => {
      const content = 'This is a simple text about cooking and recipes.';
      
      const keyTerms = extractKeyTerms(content);
      
      expect(Array.isArray(keyTerms)).toBe(true);
      // Should still return some terms, even if not psychological
    });

    it('should handle content with repeated terms', () => {
      const content = 'Jung Jung Jung analytical psychology psychology psychology';
      
      const keyTerms = extractKeyTerms(content);
      
      expect(Array.isArray(keyTerms)).toBe(true);
      // Should deduplicate terms
      const termTexts = keyTerms.map(term => term.term);
      const uniqueTerms = [...new Set(termTexts)];
      expect(termTexts.length).toBe(uniqueTerms.length);
    });

    it('should return terms with definitions', () => {
      const content = 'The collective unconscious is a fundamental concept in analytical psychology.';
      
      const keyTerms = extractKeyTerms(content);
      
      keyTerms.forEach(term => {
        expect(term).toHaveProperty('term');
        expect(term).toHaveProperty('definition');
        expect(typeof term.term).toBe('string');
        expect(typeof term.definition).toBe('string');
        expect(term.term.length).toBeGreaterThan(0);
        expect(term.definition.length).toBeGreaterThan(0);
      });
    });
  });

  describe('generateSummary', () => {
    it('should generate a summary from content', () => {
      const content = `Carl Gustav Jung was a Swiss psychiatrist and psychoanalyst who founded analytical psychology. 
      
      Jung's work has been influential in the fields of psychiatry, anthropology, archaeology, literature, philosophy, psychology, and religious studies. 
      
      The collective unconscious is one of Jung's most important contributions to psychology. It refers to structures of the unconscious mind shared among beings of the same species.
      
      Individuation is the central process of human development in Jungian psychology. It involves the integration of conscious and unconscious contents.`;
      
      const summary = generateSummary(content);
      
      expect(typeof summary).toBe('string');
      expect(summary.length).toBeGreaterThan(0);
      expect(summary.length).toBeLessThan(content.length);
      
      // Should contain key concepts
      expect(summary.toLowerCase()).toMatch(/jung|collective|unconscious|individuation|psychology/);
    });

    it('should handle short content for summary', () => {
      const content = 'Jung was a psychologist.';
      
      const summary = generateSummary(content);
      
      expect(typeof summary).toBe('string');
      expect(summary.length).toBeGreaterThan(0);
    });

    it('should handle empty content for summary', () => {
      const summary = generateSummary('');
      
      expect(typeof summary).toBe('string');
      expect(summary.length).toBe(0);
    });

    it('should create meaningful summaries', () => {
      const content = `Analytical psychology is a school of psychology that originated with Carl Jung. 
      It emphasizes the importance of the individual psyche and the personal quest for wholeness. 
      Jung believed that the human psyche has three parts: the ego, the personal unconscious, and the collective unconscious.
      
      The ego represents the conscious mind, the personal unconscious contains temporarily forgotten or repressed contents, 
      and the collective unconscious contains universal patterns and images that derive from the earliest human experience.
      
      Key concepts include archetypes, complexes, individuation, and synchronicity. These concepts help explain human behavior and psychological development.`;
      
      const summary = generateSummary(content);
      
      expect(summary).toBeDefined();
      expect(summary.length).toBeGreaterThan(50); // Should be a substantial summary
      expect(summary.toLowerCase()).toMatch(/jung|psychology|unconscious|ego/);
    });

    it('should handle content with special formatting', () => {
      const content = `# Carl Jung's Psychology
      
      ## Key Concepts
      
      ### 1. Collective Unconscious
      - Universal patterns
      - Shared across humanity
      
      ### 2. Archetypes
      - The Hero
      - The Shadow
      - The Anima/Animus
      
      **Important:** These concepts are fundamental to understanding analytical psychology.`;
      
      const summary = generateSummary(content);
      
      expect(summary).toBeDefined();
      expect(summary.length).toBeGreaterThan(0);
      // Should still extract meaningful content despite formatting
      expect(summary.toLowerCase()).toMatch(/jung|unconscious|archetype/);
    });
  });

  describe('Integration Tests', () => {
    it('should work together to process comprehensive content', () => {
      const content = `Carl Jung's analytical psychology focuses on the integration of conscious and unconscious processes. 
      The collective unconscious contains archetypes such as the shadow, anima, animus, and the self. 
      Individuation is the process by which an individual becomes whole and integrated.`;
      
      const processed = processModuleContent(content);
      const keyTerms = extractKeyTerms(content);
      const summary = generateSummary(content);
      
      expect(processed).toBeDefined();
      expect(keyTerms).toBeDefined();
      expect(summary).toBeDefined();
      
      expect(Array.isArray(keyTerms)).toBe(true);
      expect(typeof summary).toBe('string');
      expect(typeof processed).toBe('string');
      
      // All should contain relevant psychological content
      expect(processed.toLowerCase()).toMatch(/jung|psychology|unconscious/);
      expect(summary.toLowerCase()).toMatch(/jung|psychology|unconscious/);
    });

    it('should handle edge cases consistently', () => {
      const edgeCases = ['', '   ', '\n\n\n', 'a', 'A single word.'];
      
      edgeCases.forEach(content => {
        expect(() => {
          const processed = processModuleContent(content);
          const keyTerms = extractKeyTerms(content);
          const summary = generateSummary(content);
          
          expect(typeof processed).toBe('string');
          expect(Array.isArray(keyTerms)).toBe(true);
          expect(typeof summary).toBe('string');
        }).not.toThrow();
      });
    });
  });
});