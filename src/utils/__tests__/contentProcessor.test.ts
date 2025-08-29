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

  describe('Boundary Tests and Edge Cases', () => {
    describe('processContentForMarkdown', () => {
      it('should handle null and undefined inputs', () => {
        expect(() => processModuleContent(null as any)).not.toThrow();
        expect(() => processModuleContent(undefined as any)).not.toThrow();
        expect(processModuleContent(null as any)).toBe('');
        expect(processModuleContent(undefined as any)).toBe('');
      });

      it('should handle non-string inputs', () => {
        expect(processModuleContent(123 as any)).toBe('');
        expect(processModuleContent({} as any)).toBe('');
        expect(processModuleContent([] as any)).toBe('');
        expect(processModuleContent(true as any)).toBe('');
      });

      it('should handle extremely large content', () => {
        const hugeContent = 'Jung '.repeat(100000) + 'analytical psychology';
        
        const start = performance.now();
        const processed = processModuleContent(hugeContent);
        const duration = performance.now() - start;
        
        expect(processed).toBeDefined();
        expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      });\n\n      it('should handle content with only special characters', () => {\n        const specialContent = '!@#$%^&*()_+-=[]{}|;:,.<>?`~';\n        const processed = processModuleContent(specialContent);\n        \n        expect(processed).toBe(specialContent.trim());\n      });\n\n      it('should handle content with mixed line endings', () => {\n        const mixedContent = 'Line 1\\r\\nLine 2\\nLine 3\\rLine 4';\n        const processed = processModuleContent(mixedContent);\n        \n        expect(processed).toBeDefined();\n        expect(processed.includes('Line 1'));\n        expect(processed.includes('Line 4'));\n      });\n\n      it('should handle deeply nested markdown structures', () => {\n        const deepContent = `\n### Level 3\n#### Level 4\n##### Level 5\n###### Level 6\n- Item 1\n  - Sub Item 1\n    - Sub Sub Item 1\n      - Deep Item\n        - Deeper Item`;\n        \n        const processed = processModuleContent(deepContent);\n        expect(processed).toContain('Level');\n        expect(processed).toContain('Item');\n      });\n\n      it('should handle malformed markdown', () => {\n        const malformedContent = `\n####### Too many hashes\n*** Unbalanced emphasis\n[Broken link](\n| Incomplete | table\n\`\`\`\nUnclosed code block`;\n        \n        expect(() => processModuleContent(malformedContent)).not.toThrow();\n        const processed = processModuleContent(malformedContent);\n        expect(typeof processed).toBe('string');\n      });\n\n      it('should handle content with circular references in text', () => {\n        const circularContent = 'This refers to this which refers to this...';\n        const processed = processModuleContent(circularContent);\n        \n        expect(processed).toBeDefined();\n        expect(processed.includes('refers'));\n      });\n    });\n\n    describe('extractKeyTerms - Edge Cases', () => {\n      it('should handle malformed input types', () => {\n        expect(extractKeyTerms(null as any)).toEqual([]);\n        expect(extractKeyTerms(undefined as any)).toEqual([]);\n        expect(extractKeyTerms(123 as any)).toEqual([]);\n        expect(extractKeyTerms({} as any)).toEqual([]);\n        expect(extractKeyTerms([] as any)).toEqual([]);\n      });\n\n      it('should handle content with only numbers', () => {\n        const numberContent = '1 2 3 4 5 123 456 789';\n        const terms = extractKeyTerms(numberContent);\n        \n        expect(Array.isArray(terms)).toBe(true);\n        // Should not extract pure numbers as key terms\n        expect(terms.length).toBe(0);\n      });\n\n      it('should handle content with excessive whitespace', () => {\n        const whitespaceContent = '   Jung     collective     unconscious   ';\n        const terms = extractKeyTerms(whitespaceContent);\n        \n        expect(terms.length).toBeGreaterThan(0);\n        expect(terms.some(t => t.term.includes('unconscious'))).toBe(true);\n      });\n\n      it('should handle content with unicode characters', () => {\n        const unicodeContent = 'Carl Jung의 분석심리학 ψυχολογία 心理学 🧠';\n        const terms = extractKeyTerms(unicodeContent);\n        \n        expect(Array.isArray(terms)).toBe(true);\n        // Should extract 'Carl' at minimum\n        expect(terms.some(t => t.term.includes('Carl'))).toBe(true);\n      });\n\n      it('should handle content with HTML entities', () => {\n        const htmlContent = 'Jung&amp;s theory &lt;psychology&gt; &quot;archetypes&quot;';\n        const terms = extractKeyTerms(htmlContent);\n        \n        expect(Array.isArray(terms)).toBe(true);\n        // Should still find psychological terms\n      });\n\n      it('should handle extremely repetitive content', () => {\n        const repetitiveContent = ('Jung '.repeat(1000) + 'psychology').trim();\n        const terms = extractKeyTerms(repetitiveContent);\n        \n        expect(Array.isArray(terms)).toBe(true);\n        // Should deduplicate terms\n        const jungTerms = terms.filter(t => t.term.toLowerCase().includes('jung'));\n        const uniqueJungTerms = [...new Set(jungTerms.map(t => t.term.toLowerCase()))];\n        expect(jungTerms.length).toBe(uniqueJungTerms.length);\n      });\n\n      it('should handle content with mixed case variations', () => {\n        const mixedCaseContent = 'JUNG Jung jung JuNg collective COLLECTIVE Collective';\n        const terms = extractKeyTerms(mixedCaseContent);\n        \n        // Should find terms regardless of case but not duplicate\n        const uniqueTermTexts = [...new Set(terms.map(t => t.term.toLowerCase()))];\n        expect(terms.length).toBe(uniqueTermTexts.length);\n      });\n    });\n\n    describe('generateSummary - Boundary Tests', () => {\n      it('should handle malformed input types', () => {\n        expect(generateSummary(null as any)).toBe('');\n        expect(generateSummary(undefined as any)).toBe('');\n        expect(generateSummary(123 as any)).toBe('');\n        expect(generateSummary({} as any)).toBe('');\n      });\n\n      it('should handle content without sentences', () => {\n        const noSentences = 'just words no punctuation at all';\n        const summary = generateSummary(noSentences);\n        \n        expect(typeof summary).toBe('string');\n        expect(summary.length).toBeGreaterThan(0);\n      });\n\n      it('should handle content with only punctuation', () => {\n        const punctuationOnly = '!!! ??? ... ;;; :::... !!!';\n        const summary = generateSummary(punctuationOnly);\n        \n        expect(typeof summary).toBe('string');\n      });\n\n      it('should handle content with irregular sentence structure', () => {\n        const irregularContent = 'Jung. Was. A. Swiss. Psychiatrist. Who. Founded. Analytical. Psychology.';\n        const summary = generateSummary(irregularContent);\n        \n        expect(summary).toContain('Jung');\n        expect(summary.length).toBeGreaterThan(0);\n      });\n\n      it('should handle content with no priority keywords', () => {\n        const nonPsychContent = 'The quick brown fox jumps over the lazy dog. This sentence contains no psychological terms whatsoever. It is purely about animals and movement.';\n        const summary = generateSummary(nonPsychContent);\n        \n        expect(typeof summary).toBe('string');\n        expect(summary.length).toBeGreaterThan(0);\n      });\n\n      it('should handle extremely long sentences', () => {\n        const longSentence = 'Carl Jung was a Swiss psychiatrist and psychoanalyst who founded analytical psychology and is known for ' + 'his work with the collective unconscious and archetypes and individuation process and synchronicity and psychological types and '.repeat(50) + 'many other contributions to psychology.';\n        const summary = generateSummary(longSentence);\n        \n        expect(summary.length).toBeLessThan(longSentence.length);\n        expect(summary).toContain('Jung');\n      });\n\n      it('should handle content with embedded code or technical notation', () => {\n        const technicalContent = `\n        Jung's formula: Individuation = (Conscious + Unconscious) / Self\n        \n        if (psyche.shadow.integrated) {\n          return individuation.complete();\n        }\n        \n        The process involves integrating the shadow, anima/animus, and other archetypes.`;\n        \n        const summary = generateSummary(technicalContent);\n        expect(summary).toContain('Jung');\n        expect(summary.length).toBeGreaterThan(0);\n      });\n    });\n  });\n\n  describe('Performance Stress Tests', () => {\n    it('should handle large content processing efficiently', () => {\n      const largeContent = `\n      Carl Jung was a Swiss psychiatrist and psychoanalyst who founded analytical psychology. \n      The collective unconscious contains universal archetypes like the shadow, anima, animus, and self.\n      Individuation is the process of psychological integration and wholeness.\n      `.repeat(1000);\n      \n      const start = performance.now();\n      \n      const processed = processModuleContent(largeContent);\n      const keyTerms = extractKeyTerms(largeContent);\n      const summary = generateSummary(largeContent);\n      \n      const duration = performance.now() - start;\n      \n      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds\n      expect(processed).toBeDefined();\n      expect(keyTerms.length).toBeGreaterThan(0);\n      expect(summary.length).toBeGreaterThan(0);\n    });\n\n    it('should handle many small content pieces efficiently', () => {\n      const smallContents = Array.from({ length: 1000 }, (_, i) => \n        `Jung ${i} analytical psychology individuation`\n      );\n      \n      const start = performance.now();\n      \n      smallContents.forEach(content => {\n        processModuleContent(content);\n        extractKeyTerms(content);\n        generateSummary(content);\n      });\n      \n      const duration = performance.now() - start;\n      expect(duration).toBeLessThan(1000); // Should complete within 1 second\n    });\n  });\n\n  describe('Integration Tests', () => {\n    it('should work together to process comprehensive content', () => {\n      const content = `Carl Jung's analytical psychology focuses on the integration of conscious and unconscious processes. \n      The collective unconscious contains archetypes such as the shadow, anima, animus, and the self. \n      Individuation is the process by which an individual becomes whole and integrated.`;\n      \n      const processed = processModuleContent(content);\n      const keyTerms = extractKeyTerms(content);\n      const summary = generateSummary(content);\n      \n      expect(processed).toBeDefined();\n      expect(keyTerms).toBeDefined();\n      expect(summary).toBeDefined();\n      \n      expect(Array.isArray(keyTerms)).toBe(true);\n      expect(typeof summary).toBe('string');\n      expect(typeof processed).toBe('string');\n      \n      // All should contain relevant psychological content\n      expect(processed.toLowerCase()).toMatch(/jung|psychology|unconscious/);\n      expect(summary.toLowerCase()).toMatch(/jung|psychology|unconscious/);\n    });\n\n    it('should handle edge cases consistently', () => {\n      const edgeCases = ['', '   ', '\\n\\n\\n', 'a', 'A single word.', null, undefined];\n      \n      edgeCases.forEach(content => {\n        expect(() => {\n          const processed = processModuleContent(content as any);\n          const keyTerms = extractKeyTerms(content as any);\n          const summary = generateSummary(content as any);\n          \n          expect(typeof processed).toBe('string');\n          expect(Array.isArray(keyTerms)).toBe(true);\n          expect(typeof summary).toBe('string');\n        }).not.toThrow();\n      });\n    });\n\n    it('should maintain consistency across multiple processing cycles', () => {\n      const content = 'Jung analytical psychology collective unconscious individuation';\n      \n      // Process the same content multiple times\n      const results = [];\n      for (let i = 0; i < 10; i++) {\n        results.push({\n          processed: processModuleContent(content),\n          keyTerms: extractKeyTerms(content),\n          summary: generateSummary(content)\n        });\n      }\n      \n      // All results should be identical (deterministic)\n      const firstResult = results[0];\n      results.forEach(result => {\n        expect(result.processed).toBe(firstResult.processed);\n        expect(result.keyTerms).toEqual(firstResult.keyTerms);\n        expect(result.summary).toBe(firstResult.summary);\n      });\n    });\n\n    it('should handle concurrent processing safely', async () => {\n      const contents = Array.from({ length: 100 }, (_, i) => \n        `Content ${i}: Jung analytical psychology individuation`\n      );\n      \n      const promises = contents.map(async content => {\n        return {\n          processed: processModuleContent(content),\n          keyTerms: extractKeyTerms(content),\n          summary: generateSummary(content)\n        };\n      });\n      \n      const results = await Promise.all(promises);\n      \n      expect(results.length).toBe(100);\n      results.forEach(result => {\n        expect(typeof result.processed).toBe('string');\n        expect(Array.isArray(result.keyTerms)).toBe(true);\n        expect(typeof result.summary).toBe('string');\n      });\n    });\n  });\n});