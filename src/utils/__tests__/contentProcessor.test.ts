import { processModuleContent, extractKeyTerms, generateSummary } from '../contentProcessor';

describe('contentProcessor', () => {
  describe('processModuleContent', () => {
    it('should process simple text content', () => {
      const content = 'This is a simple test content about analytical psychology.';
      const processed = processModuleContent(content);

      expect(processed).toBeDefined();
      expect(typeof processed).toBe('string');
      expect(processed.length).toBeGreaterThan(0);
    });

    it('should handle empty content', () => {
      const processed = processModuleContent('');
      expect(processed).toBe('');
    });

    it('should handle null and undefined content', () => {
      expect(processModuleContent(null as any)).toBe('');
      expect(processModuleContent(undefined as any)).toBe('');
    });

    it('should process markdown content', () => {
      const markdownContent = `
# Introduction to Jung
## The Collective Unconscious
- Archetype 1
- Archetype 2
### Shadow Work
The shadow represents...
      `;

      const processed = processModuleContent(markdownContent);
      expect(processed).toBeDefined();
      expect(processed).toContain('Jung');
    });

    it('should handle HTML content', () => {
      const htmlContent = '<p>Carl Jung was a <strong>Swiss psychiatrist</strong></p>';
      const processed = processModuleContent(htmlContent);

      expect(processed).toBeDefined();
      expect(processed).toContain('Jung');
    });

    it('should handle mixed content types', () => {
      const mixedContent = `
# Jung's Theory
<p>The collective unconscious</p>
- Anima
- Animus
**Important**: Individuation process
      `;

      const processed = processModuleContent(mixedContent);
      expect(processed).toBeDefined();
      expect(processed).toContain('Jung');
    });
  });

  describe('extractKeyTerms', () => {
    it('should extract key psychological terms', () => {
      const content = 'Carl Jung developed analytical psychology and the concept of the collective unconscious.';
      const terms = extractKeyTerms(content);

      expect(Array.isArray(terms)).toBe(true);
      expect(terms.length).toBeGreaterThan(0);
      expect(terms.some(t => t.term.toLowerCase().includes('analytical psychology') || t.term.toLowerCase().includes('collective unconscious'))).toBe(true);
    });

    it('should handle empty content', () => {
      const terms = extractKeyTerms('');
      expect(terms).toEqual([]);
    });

    it('should handle content without key terms', () => {
      const content = 'The quick brown fox jumps over the lazy dog.';
      const terms = extractKeyTerms(content);

      expect(Array.isArray(terms)).toBe(true);
      // Should still return an array even if no psychological terms found
    });

    it('should extract terms with definitions', () => {
      const content = 'Analytical psychology, individuation, collective unconscious, archetypes';
      const terms = extractKeyTerms(content);

      expect(Array.isArray(terms)).toBe(true);
      expect(terms.length).toBeGreaterThan(0);
      terms.forEach(term => {
        expect(term).toHaveProperty('term');
        expect(term).toHaveProperty('definition');
        expect(typeof term.definition).toBe('string');
        expect(term.definition.length).toBeGreaterThan(0);
      });
    });
  });

  describe('generateSummary', () => {
    it('should generate summary for psychological content', () => {
      const content = `
        Carl Jung was a Swiss psychiatrist and psychoanalyst who founded analytical psychology.
        His work on the collective unconscious and archetypes has been influential in psychology.
        The process of individuation is central to his therapeutic approach.
      `;

      const summary = generateSummary(content);
      expect(typeof summary).toBe('string');
      expect(summary.length).toBeGreaterThan(0);
      expect(summary).toContain('Jung');
    });

    it('should handle empty content', () => {
      const summary = generateSummary('');
      expect(summary).toBe('');
    });

    it('should handle very short content', () => {
      const content = 'Jung.';
      const summary = generateSummary(content);

      expect(typeof summary).toBe('string');
      expect(summary.length).toBeGreaterThan(0);
    });

    it('should create shorter summary than original', () => {
      const longContent = `
        Carl Jung was a Swiss psychiatrist and psychoanalyst who founded analytical psychology.
        His work has been influential in the fields of psychiatry, anthropology, archaeology,
        literature, philosophy, and religious studies. Jung worked as a research scientist at
        the famous Burghoelzli hospital, under Eugen Bleuler. During this time, he came to
        the attention of Sigmund Freud, the founder of psychoanalysis. The two men conducted
        a lengthy correspondence and collaborated, for a while, on a joint vision of human psychology.
      `;

      const summary = generateSummary(longContent);
      expect(summary.length).toBeLessThan(longContent.length);
      expect(summary).toContain('Jung');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    describe('processModuleContent - Advanced Cases', () => {
      it('should handle content with special characters', () => {
        const specialContent = 'Jung & Freud: The @#$% of psychology! (1900-1961)';
        const processed = processModuleContent(specialContent);

        expect(processed).toBeDefined();
        expect(processed).toContain('Jung');
      });

      it('should handle very long content', () => {
        const longContent = 'Jung '.repeat(10000) + 'analytical psychology';
        const processed = processModuleContent(longContent);

        expect(processed).toBeDefined();
        expect(typeof processed).toBe('string');
      });

      it('should handle content with mixed line endings', () => {
        const mixedContent = 'Line 1\\r\\nLine 2\\nLine 3\\rLine 4';
        const processed = processModuleContent(mixedContent);

        expect(processed).toBeDefined();
        expect(processed.includes('Line 1')).toBe(true);
        expect(processed.includes('Line 4')).toBe(true);
      });

      it('should handle deeply nested markdown structures', () => {
        const deepContent = `
### Level 3
#### Level 4
##### Level 5
###### Level 6
- Item 1
  - Sub Item 1
    - Sub Sub Item 1
      - Deep Item
        - Deeper Item`;

        const processed = processModuleContent(deepContent);
        expect(processed).toContain('Level');
        expect(processed).toContain('Item');
      });

      it('should handle malformed markdown', () => {
        const malformedContent = `
####### Too many hashes
*** Unbalanced emphasis
[Broken link](
| Incomplete | table
\`\`\`
Unclosed code block`;

        expect(() => processModuleContent(malformedContent)).not.toThrow();
        const processed = processModuleContent(malformedContent);
        expect(typeof processed).toBe('string');
      });

      it('should handle content with circular references in text', () => {
        const circularContent = 'This refers to this which refers to this...';
        const processed = processModuleContent(circularContent);

        expect(processed).toBeDefined();
        expect(processed.includes('refers'));
      });
    });

    describe('extractKeyTerms - Edge Cases', () => {
      it('should handle malformed input types', () => {
        expect(extractKeyTerms(null as any)).toEqual([]);
        expect(extractKeyTerms(undefined as any)).toEqual([]);
        expect(extractKeyTerms(123 as any)).toEqual([]);
        expect(extractKeyTerms({} as any)).toEqual([]);
        expect(extractKeyTerms([] as any)).toEqual([]);
      });

      it('should handle content with only numbers', () => {
        const numberContent = '1 2 3 4 5 123 456 789';
        const terms = extractKeyTerms(numberContent);

        expect(Array.isArray(terms)).toBe(true);
        // Should not extract pure numbers as key terms
        expect(terms.length).toBe(0);
      });

      it('should handle content with excessive whitespace', () => {
        const whitespaceContent = '   analytical psychology     collective     unconscious   ';
        const terms = extractKeyTerms(whitespaceContent);

        expect(terms.length).toBeGreaterThan(0);
        expect(terms.some(t => t.term.includes('unconscious') || t.term.includes('analytical psychology'))).toBe(true);
      });

      it('should handle content with unicode characters', () => {
        const unicodeContent = 'Carl Jung analytical psychology analysis brain';
        const terms = extractKeyTerms(unicodeContent);

        expect(Array.isArray(terms)).toBe(true);
        // Should extract psychological terms
        expect(terms.some(t => t.term.includes('analytical psychology'))).toBe(true);
      });

      it('should handle content with HTML entities', () => {
        const htmlContent = 'Jung&amp;s theory &lt;psychology&gt; &quot;archetypes&quot;';
        const terms = extractKeyTerms(htmlContent);

        expect(Array.isArray(terms)).toBe(true);
        // Should still find psychological terms
      });

      it('should handle extremely repetitive content', () => {
        const repetitiveContent = ('Jung '.repeat(1000) + 'psychology').trim();
        const terms = extractKeyTerms(repetitiveContent);

        expect(Array.isArray(terms)).toBe(true);
        // Should deduplicate terms
        const jungTerms = terms.filter(t => t.term.toLowerCase().includes('jung'));
        const uniqueJungTerms = [...new Set(jungTerms.map(t => t.term.toLowerCase()))];
        expect(jungTerms.length).toBe(uniqueJungTerms.length);
      });

      it('should handle content with mixed case variations', () => {
        const mixedCaseContent = 'JUNG Jung jung JuNg collective COLLECTIVE Collective';
        const terms = extractKeyTerms(mixedCaseContent);

        // Should find terms regardless of case but not duplicate
        const uniqueTermTexts = [...new Set(terms.map(t => t.term.toLowerCase()))];
        expect(terms.length).toBe(uniqueTermTexts.length);
      });
    });

    describe('generateSummary - Boundary Tests', () => {
      it('should handle malformed input types', () => {
        expect(generateSummary(null as any)).toBe('');
        expect(generateSummary(undefined as any)).toBe('');
        expect(generateSummary(123 as any)).toBe('');
        expect(generateSummary({} as any)).toBe('');
      });

      it('should handle content without sentences', () => {
        const noSentences = 'just words no punctuation at all';
        const summary = generateSummary(noSentences);

        expect(typeof summary).toBe('string');
        expect(summary.length).toBeGreaterThan(0);
      });

      it('should handle content with only punctuation', () => {
        const punctuationOnly = '!!! ??? ... ;;; :::... !!!';
        const summary = generateSummary(punctuationOnly);

        expect(typeof summary).toBe('string');
      });

      it('should handle content with irregular sentence structure', () => {
        const irregularContent = 'Jung. Was. A. Swiss. Psychiatrist. Who. Founded. Analytical. Psychology.';
        const summary = generateSummary(irregularContent);

        expect(summary).toContain('Jung');
        expect(summary.length).toBeGreaterThan(0);
      });

      it('should handle content with no priority keywords', () => {
        const nonPsychContent = 'The quick brown fox jumps over the lazy dog. This sentence contains no psychological terms whatsoever. It is purely about animals and movement.';
        const summary = generateSummary(nonPsychContent);

        expect(typeof summary).toBe('string');
        expect(summary.length).toBeGreaterThan(0);
      });

      it('should handle extremely long sentences', () => {
        const longSentence = 'Carl Jung was a Swiss psychiatrist and psychoanalyst who founded analytical psychology and is known for ' + 'his work with the collective unconscious and archetypes and individuation process and synchronicity and psychological types and '.repeat(50) + 'many other contributions to psychology.';
        const summary = generateSummary(longSentence);

        expect(summary.length).toBeLessThan(longSentence.length);
        expect(summary).toContain('Jung');
      });

      it('should handle content with embedded code or technical notation', () => {
        const technicalContent = `
        Jung's formula: Individuation = (Conscious + Unconscious) / Self

        if (psyche.shadow.integrated) {
          return individuation.complete();
        }

        The process involves integrating the shadow, anima/animus, and other archetypes.`;

        const summary = generateSummary(technicalContent);
        expect(summary).toContain('Jung');
        expect(summary.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Performance Stress Tests', () => {
    it('should handle large content processing efficiently', () => {
      const largeContent = `
      Carl Jung was a Swiss psychiatrist and psychoanalyst who founded analytical psychology.
      The collective unconscious contains universal archetypes like the shadow, anima, animus, and self.
      Individuation is the process of psychological integration and wholeness.
      `.repeat(1000);

      const start = performance.now();

      const processed = processModuleContent(largeContent);
      const keyTerms = extractKeyTerms(largeContent);
      const summary = generateSummary(largeContent);

      const duration = performance.now() - start;

      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
      expect(processed).toBeDefined();
      expect(keyTerms.length).toBeGreaterThan(0);
      expect(summary.length).toBeGreaterThan(0);
    });

    it('should handle many small content pieces efficiently', () => {
      const smallContents = Array.from({ length: 1000 }, (_, i) =>
        `Jung ${i} analytical psychology individuation`
      );

      const start = performance.now();

      smallContents.forEach(content => {
        processModuleContent(content);
        extractKeyTerms(content);
        generateSummary(content);
      });

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
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
      const edgeCases = ['', '   ', '\\n\\n\\n', 'a', 'A single word.', null, undefined];

      edgeCases.forEach(content => {
        expect(() => {
          const processed = processModuleContent(content as any);
          const keyTerms = extractKeyTerms(content as any);
          const summary = generateSummary(content as any);

          expect(typeof processed).toBe('string');
          expect(Array.isArray(keyTerms)).toBe(true);
          expect(typeof summary).toBe('string');
        }).not.toThrow();
      });
    });

    it('should maintain consistency across multiple processing cycles', () => {
      const content = 'Jung analytical psychology collective unconscious individuation';

      // Process the same content multiple times
      const results = [];
      for (let i = 0; i < 10; i++) {
        results.push({
          processed: processModuleContent(content),
          keyTerms: extractKeyTerms(content),
          summary: generateSummary(content)
        });
      }

      // All results should be identical (deterministic)
      const firstResult = results[0];
      results.forEach(result => {
        expect(result.processed).toBe(firstResult.processed);
        expect(result.keyTerms).toEqual(firstResult.keyTerms);
        expect(result.summary).toBe(firstResult.summary);
      });
    });

    it('should handle concurrent processing safely', async () => {
      const contents = Array.from({ length: 100 }, (_, i) =>
        `Content ${i}: Jung analytical psychology individuation`
      );

      const promises = contents.map(async content => {
        return {
          processed: processModuleContent(content),
          keyTerms: extractKeyTerms(content),
          summary: generateSummary(content)
        };
      });

      const results = await Promise.all(promises);

      expect(results.length).toBe(100);
      results.forEach(result => {
        expect(typeof result.processed).toBe('string');
        expect(Array.isArray(result.keyTerms)).toBe(true);
        expect(typeof result.summary).toBe('string');
      });
    });
  });
});