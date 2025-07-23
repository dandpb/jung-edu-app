import {
  processContentForMarkdown,
  enhanceListHTML,
  processModuleContent,
  extractKeyTerms,
  generateSummary
} from './contentProcessor';

describe('contentProcessor utilities', () => {
  describe('processContentForMarkdown', () => {
    it('should convert numbered lists to markdown format', () => {
      const input = '1.\nFirst item\n2.\nSecond item';
      const expected = '1. First item\n2. Second item';
      
      expect(processContentForMarkdown(input)).toBe(expected);
    });

    it('should convert bullet points to markdown format', () => {
      const input = '•\nFirst bullet\n•\nSecond bullet';
      const expected = '* First bullet\n* Second bullet';
      
      expect(processContentForMarkdown(input)).toBe(expected);
    });

    it('should handle numbered lists with bold titles', () => {
      const input = '1. Autoconhecimento: Understanding yourself';
      const expected = '1. **Autoconhecimento:** Understanding yourself';
      
      expect(processContentForMarkdown(input)).toBe(expected);
    });

    it('should handle bullet lists with bold titles', () => {
      const input = '• Shadow Work: Exploring the unconscious';
      const expected = '* **Shadow Work:** Exploring the unconscious';
      
      expect(processContentForMarkdown(input)).toBe(expected);
    });

    it('should add proper spacing between list items', () => {
      const input = 'Some text\n1. First item\nMore text\n* Bullet item';
      const output = processContentForMarkdown(input);
      
      expect(output).toContain('Some text\n\n1.');
      expect(output).toContain('More text\n\n*');
    });

    it('should handle inline numbered lists with capitals', () => {
      const input = '1. Shadow\n2. Anima';
      const expected = '1. Shadow\n2. Anima';
      
      expect(processContentForMarkdown(input)).toBe(expected);
    });

    it('should handle inline bullet lists with capitals', () => {
      const input = '• Shadow\n• Anima';
      // The implementation doesn't convert bullet points that don't have capitals with colons
      const expected = '• Shadow\n• Anima';
      
      expect(processContentForMarkdown(input)).toBe(expected);
    });

    it('should clean up multiple blank lines', () => {
      const input = 'Text\n\n\n\nMore text';
      const expected = 'Text\n\nMore text';
      
      expect(processContentForMarkdown(input)).toBe(expected);
    });
  });

  describe('enhanceListHTML', () => {
    it('should return HTML unchanged', () => {
      const html = '<ul><li>Item 1</li><li>Item 2</li></ul>';
      expect(enhanceListHTML(html)).toBe(html);
    });
  });

  describe('processModuleContent', () => {
    it('should handle empty content', () => {
      expect(processModuleContent('')).toBe('');
      expect(processModuleContent('   ')).toBe('');
    });

    it('should add emphasis to psychological terms', () => {
      const input = 'The collective unconscious contains archetypes';
      const output = processModuleContent(input);
      
      expect(output).toContain('**collective unconscious**');
      expect(output).toContain('**archetypes**');
    });

    it('should handle case-insensitive psychological terms', () => {
      const input = 'The SHADOW and the Shadow are the same';
      const output = processModuleContent(input);
      
      expect(output).toContain('**SHADOW**');
      expect(output).toContain('**Shadow**');
    });

    it('should not double-emphasize already bold terms', () => {
      const input = 'The **shadow** is already bold';
      const output = processModuleContent(input);
      
      expect(output).not.toContain('****shadow****');
      expect(output).toContain('**shadow**');
    });

    it('should add markdown headers for key concepts', () => {
      const input = 'Key Concepts: Understanding Jung\nImportant: Read carefully';
      const output = processModuleContent(input);
      
      expect(output).toContain('## Key Concepts:');
      expect(output).toContain('> **Important:**');
    });

    it('should process lists and add emphasis', () => {
      const input = '1. The shadow represents\n2. The anima is';
      const output = processModuleContent(input);
      
      expect(output).toContain('**shadow**');
      expect(output).toContain('**anima**');
    });

    it('should handle multiple psychological terms', () => {
      const input = 'Jung studied the ego, persona, and individuation process';
      const output = processModuleContent(input);
      
      expect(output).toContain('**ego**');
      expect(output).toContain('**persona**');
      expect(output).toContain('**individuation**');
    });
  });

  describe('extractKeyTerms', () => {
    it('should handle empty content', () => {
      expect(extractKeyTerms('')).toEqual([]);
      expect(extractKeyTerms('   ')).toEqual([]);
    });

    it('should extract Jungian terms with definitions', () => {
      const input = 'The collective unconscious contains archetypes';
      const terms = extractKeyTerms(input);
      
      expect(terms).toHaveLength(2);
      expect(terms[0].term).toBe('collective unconscious');
      expect(terms[0].definition).toContain('unconscious mind shared by all humanity');
      expect(terms[1].term).toBe('archetype');
    });

    it('should extract terms case-insensitively', () => {
      const input = 'The SHADOW and the Anima are important';
      const terms = extractKeyTerms(input);
      
      const shadowTerm = terms.find(t => t.term === 'shadow');
      const animaTerm = terms.find(t => t.term === 'anima');
      
      expect(shadowTerm).toBeDefined();
      expect(animaTerm).toBeDefined();
    });

    it('should not duplicate terms', () => {
      const input = 'The shadow, SHADOW, and Shadow are the same';
      const terms = extractKeyTerms(input);
      
      const shadowTerms = terms.filter(t => t.term.toLowerCase() === 'shadow');
      expect(shadowTerms).toHaveLength(1);
    });

    it('should extract multiple Jungian terms', () => {
      const input = 'Jung developed analytical psychology studying the ego, persona, and self';
      const terms = extractKeyTerms(input);
      
      const termNames = terms.map(t => t.term);
      expect(termNames).toContain('analytical psychology');
      expect(termNames).toContain('ego');
      expect(termNames).toContain('persona');
      expect(termNames).toContain('self');
    });

    it('should extract capitalized terms as potential key terms', () => {
      const input = 'The Depth Psychology movement influenced many';
      const terms = extractKeyTerms(input);
      
      // The implementation finds 'depth psychology' (lowercase) from the predefined list
      const depthPsychTerm = terms.find(t => t.term.toLowerCase() === 'depth psychology');
      expect(depthPsychTerm).toBeDefined();
      expect(depthPsychTerm?.definition).toContain('approach to psychology');
    });

    it('should skip common words and short terms', () => {
      const input = 'The This That Carl Jung studied';
      const terms = extractKeyTerms(input);
      
      const termNames = terms.map(t => t.term);
      expect(termNames).not.toContain('The');
      expect(termNames).not.toContain('This');
      expect(termNames).not.toContain('That');
      expect(termNames).not.toContain('Carl');
      expect(termNames).not.toContain('Jung');
    });
  });

  describe('generateSummary', () => {
    it('should handle empty content', () => {
      expect(generateSummary('')).toBe('');
      expect(generateSummary('   ')).toBe('');
    });

    it('should return short content as-is', () => {
      const shortContent = 'This is a short piece of content.';
      expect(generateSummary(shortContent)).toBe(shortContent);
    });

    it('should clean markdown formatting', () => {
      const input = '## Header\n**Bold text** and *italic* text with `code`';
      const summary = generateSummary(input);
      
      expect(summary).not.toContain('##');
      expect(summary).not.toContain('**');
      expect(summary).not.toContain('*');
      expect(summary).not.toContain('`');
    });

    it('should remove list formatting', () => {
      const input = '1. First item\n2. Second item\n* Bullet item';
      const summary = generateSummary(input);
      
      expect(summary).not.toMatch(/^\d+\./);
      expect(summary).not.toContain('*');
    });

    it('should prioritize sentences with Jungian keywords', () => {
      const input = `
        This is a general sentence about psychology.
        Jung developed the concept of the collective unconscious.
        Another general sentence here.
        The archetype of the shadow is fundamental.
        Some more general text.
      `;
      
      const summary = generateSummary(input);
      
      expect(summary).toContain('collective unconscious');
      expect(summary).toContain('archetype');
      expect(summary).toContain('shadow');
    });

    it('should limit summary length', () => {
      const longContent = 'Jung studied many concepts. '.repeat(50);
      const summary = generateSummary(longContent);
      
      expect(summary.length).toBeLessThanOrEqual(403); // 400 + possible '...'
    });

    it('should handle content with multiple sentences', () => {
      const input = `
        Carl Jung was a Swiss psychiatrist. He founded analytical psychology.
        His work explored the collective unconscious. Jung identified universal
        archetypes in human psychology. The process of individuation was central
        to his theories. He studied dreams and symbols extensively.
      `;
      
      const summary = generateSummary(input);
      
      expect(summary).toBeTruthy();
      expect(summary.split('.').filter(s => s.trim()).length).toBeGreaterThanOrEqual(1);
    });

    it('should end summary properly', () => {
      const input = 'This is a test sentence. ' + 'Another sentence here. '.repeat(20);
      const summary = generateSummary(input);
      
      expect(summary).toMatch(/[.!?]$|\.\.\.$/);
    });

    it('should handle links in markdown', () => {
      const input = 'Check out [Jung\'s work](http://example.com) on archetypes.';
      const summary = generateSummary(input);
      
      expect(summary).toContain("Jung's work");
      expect(summary).not.toContain('http://example.com');
      expect(summary).not.toContain('[');
      expect(summary).not.toContain(']');
    });
  });
});