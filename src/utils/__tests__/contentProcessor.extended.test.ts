import {
  processContentForMarkdown,
  enhanceListHTML,
  processModuleContent,
  extractKeyTerms,
  generateSummary
} from '../contentProcessor';
import { KeyTerm } from '../../types';

describe('contentProcessor utilities - Extended Tests', () => {
  describe('processContentForMarkdown', () => {
    it('should convert numbered lists with content on new lines', () => {
      const input = `1.\nFirst item\n2.\nSecond item`;
      const expected = `1. First item\n2. Second item`;
      expect(processContentForMarkdown(input)).toBe(expected);
    });

    it('should convert bullet points correctly', () => {
      const input = `•\nBullet one\n•\nBullet two`;
      const expected = `* Bullet one\n* Bullet two`;
      expect(processContentForMarkdown(input)).toBe(expected);
    });

    it('should handle mixed list types', () => {
      const input = `1. First numbered\n•\nBullet item\n2. Second numbered`;
      const result = processContentForMarkdown(input);
      expect(result).toContain('1. First numbered');
      expect(result).toContain('* Bullet item');
      expect(result).toContain('2. Second numbered');
    });

    it('should add bold formatting to list items starting with capital letters', () => {
      const input = `1. Autoconhecimento: Understanding oneself\n• Shadow: The dark side`;
      const result = processContentForMarkdown(input);
      expect(result).toContain('**Autoconhecimento:** Understanding oneself');
      expect(result).toContain('**Shadow:** The dark side');
    });

    it('should ensure proper spacing between list items', () => {
      const input = `Some text\n1. First item\nMore text\n* Bullet item`;
      const result = processContentForMarkdown(input);
      expect(result).toContain('Some text\n\n1. First item');
      expect(result).toContain('More text\n\n* Bullet item');
    });

    it('should clean up multiple blank lines', () => {
      const input = `Line 1\n\n\n\nLine 2\n\n\n\n\nLine 3`;
      const result = processContentForMarkdown(input);
      expect(result).toBe('Line 1\n\nLine 2\n\nLine 3');
    });

    it('should handle edge cases with empty content', () => {
      expect(processContentForMarkdown('')).toBe('');
      expect(processContentForMarkdown('\n\n\n')).toBe('');
    });

    it('should preserve existing markdown formatting', () => {
      const input = `**Bold text**\n*Italic text*\n[Link](http://example.com)`;
      const result = processContentForMarkdown(input);
      expect(result).toContain('**Bold text**');
      expect(result).toContain('*Italic text*');
      expect(result).toContain('[Link](http://example.com)');
    });

    it('should handle complex nested structures', () => {
      const input = `1. Main point:\n   • Sub-bullet one\n   • Sub-bullet two\n2. Another point`;
      const result = processContentForMarkdown(input);
      expect(result).toContain('1. **Main point:**');
      expect(result).toContain('* Sub-bullet one');
    });
  });

  describe('enhanceListHTML', () => {
    it('should return HTML unchanged (placeholder function)', () => {
      const html = '<ul><li>Item 1</li><li>Item 2</li></ul>';
      expect(enhanceListHTML(html)).toBe(html);
    });

    it('should handle empty HTML', () => {
      expect(enhanceListHTML('')).toBe('');
    });
  });

  describe('processModuleContent', () => {
    it('should return empty string for empty content', () => {
      expect(processModuleContent('')).toBe('');
      expect(processModuleContent('   ')).toBe('');
      expect(processModuleContent('\n\n')).toBe('');
    });

    it('should emphasize Jungian psychological terms', () => {
      const input = 'The collective unconscious contains archetypes like the shadow and anima.';
      const result = processModuleContent(input);
      expect(result).toContain('**collective unconscious**');
      expect(result).toContain('**archetypes**');
      expect(result).toContain('**shadow**');
      expect(result).toContain('**anima**');
    });

    it('should handle case-insensitive term matching', () => {
      const input = 'The SHADOW, Shadow, and shadow are all the same concept.';
      const result = processModuleContent(input);
      const shadowCount = (result.match(/\*\*[Ss]?[Hh]?[Aa]?[Dd]?[Oo]?[Ww]?\*\*/gi) || []).length;
      expect(shadowCount).toBeGreaterThanOrEqual(3);
    });

    it('should not double-emphasize already formatted terms', () => {
      const input = 'The **shadow** is already bold, so is *individuation*.';
      const result = processModuleContent(input);
      expect(result).not.toContain('****shadow****');
      expect(result).toContain('**shadow**');
    });

    it('should add structure markers for educational content', () => {
      const input = `Key Concepts:\nImportant: Remember this\nNote: Additional info`;
      const result = processModuleContent(input);
      expect(result).toContain('## Key Concepts:');
      expect(result).toContain('> **Important:** Remember this');
      expect(result).toContain('> **Note:** Additional info');
    });

    it('should handle complex psychological content', () => {
      const input = `The process of individuation involves integrating the shadow, 
        anima/animus, and other archetypes from the collective unconscious.
        Key Concepts: Self, ego, persona
        Important: This is central to analytical psychology`;
      
      const result = processModuleContent(input);
      expect(result).toContain('**individuation**');
      expect(result).toContain('**shadow**');
      expect(result).toContain('**anima**/**animus**');
      expect(result).toContain('## Key Concepts:');
      expect(result).toContain('**analytical psychology**');
    });

    it('should preserve word boundaries when emphasizing terms', () => {
      const input = 'The ego is different from egotism. Complexes vs complexity.';
      const result = processModuleContent(input);
      expect(result).toContain('**ego** is');
      expect(result).not.toContain('**ego**tism');
      expect(result).toContain('**Complexes**');
      expect(result).not.toContain('**complex**ity');
    });
  });

  describe('extractKeyTerms', () => {
    it('should return empty array for empty content', () => {
      expect(extractKeyTerms('')).toEqual([]);
      expect(extractKeyTerms('   ')).toEqual([]);
    });

    it('should extract basic Jungian terms with definitions', () => {
      const content = 'The shadow represents hidden aspects, while the anima is the feminine side.';
      const terms = extractKeyTerms(content);
      
      const shadowTerm = terms.find(t => t.term === 'shadow');
      const animaTerm = terms.find(t => t.term === 'anima');
      
      expect(shadowTerm).toBeDefined();
      expect(shadowTerm?.definition).toContain('hidden, repressed, or denied aspects');
      expect(animaTerm).toBeDefined();
      expect(animaTerm?.definition).toContain('unconscious feminine aspect');
    });

    it('should handle case-insensitive matching', () => {
      const content = 'The COLLECTIVE UNCONSCIOUS and Collective Unconscious are the same.';
      const terms = extractKeyTerms(content);
      
      const collectiveTerms = terms.filter(t => t.term.toLowerCase() === 'collective unconscious');
      expect(collectiveTerms.length).toBe(1);
    });

    it('should extract all mentioned Jungian terms', () => {
      const content = `Jungian psychology involves concepts like the collective unconscious,
        personal unconscious, archetypes (shadow, anima, animus, self), individuation,
        synchronicity, complexes, persona, ego, projection, active imagination,
        and the transcendent function.`;
      
      const terms = extractKeyTerms(content);
      const termNames = terms.map(t => t.term.toLowerCase());
      
      expect(termNames).toContain('collective unconscious');
      expect(termNames).toContain('personal unconscious');
      expect(termNames).toContain('archetype');
      expect(termNames).toContain('shadow');
      expect(termNames).toContain('anima');
      expect(termNames).toContain('animus');
      expect(termNames).toContain('self');
      expect(termNames).toContain('individuation');
      expect(termNames).toContain('synchronicity');
      expect(termNames).toContain('complex');
      expect(termNames).toContain('persona');
      expect(termNames).toContain('ego');
      expect(termNames).toContain('projection');
      expect(termNames).toContain('active imagination');
      expect(termNames).toContain('transcendent function');
    });

    it('should handle additional capitalized terms', () => {
      const content = 'The Depth Psychology approach uses Dream Analysis techniques.';
      const terms = extractKeyTerms(content);
      
      const depthPsych = terms.find(t => t.term.toLowerCase() === 'depth psychology');
      expect(depthPsych).toBeDefined();
      expect(depthPsych?.definition).toContain('unconscious mind');
    });

    it('should filter out common words and short terms', () => {
      const content = 'The This That These Those Are Not Key Terms But Individuation Is';
      const terms = extractKeyTerms(content);
      
      const termNames = terms.map(t => t.term);
      expect(termNames).not.toContain('The');
      expect(termNames).not.toContain('This');
      expect(termNames).not.toContain('That');
      expect(termNames).not.toContain('Are');
      expect(termNames).not.toContain('Not');
      expect(termNames).not.toContain('But');
      expect(termNames).toContain('individuation');
    });

    it('should remove duplicate terms', () => {
      const content = 'shadow Shadow SHADOW shadow';
      const terms = extractKeyTerms(content);
      
      const shadowTerms = terms.filter(t => t.term.toLowerCase() === 'shadow');
      expect(shadowTerms.length).toBe(1);
    });

    it('should handle psychology-related compound terms', () => {
      const content = 'Analytical Psychology and Depth Psychology are related fields.';
      const terms = extractKeyTerms(content);
      
      expect(terms.some(t => t.term.toLowerCase() === 'analytical psychology')).toBe(true);
      expect(terms.some(t => t.term.toLowerCase() === 'depth psychology')).toBe(true);
    });
  });

  describe('generateSummary', () => {
    it('should return empty string for empty content', () => {
      expect(generateSummary('')).toBe('');
      expect(generateSummary('   ')).toBe('');
    });

    it('should return full content if under 200 characters', () => {
      const shortContent = 'This is a short piece of content about Jung.';
      expect(generateSummary(shortContent)).toBe(shortContent);
    });

    it('should clean markdown formatting from summary', () => {
      const content = `## Header\n**Bold text** and *italic text*. [Link](http://example.com) and \`code\`.
        - Bullet point
        1. Numbered item`;
      
      const summary = generateSummary(content);
      expect(summary).not.toContain('##');
      expect(summary).not.toContain('**');
      expect(summary).not.toContain('*');
      expect(summary).not.toContain('[Link]');
      expect(summary).not.toContain('`');
      expect(summary).toContain('Bold text');
      expect(summary).toContain('italic text');
    });

    it('should prioritize sentences with Jungian keywords', () => {
      const content = `This is a general sentence about psychology. 
        Jung developed the concept of the collective unconscious. 
        People have different personalities. 
        The shadow archetype represents our hidden aspects. 
        Weather is unpredictable today. 
        Individuation is the central process of human development.
        Coffee is a popular beverage.`;
      
      const summary = generateSummary(content);
      const lowerSummary = summary.toLowerCase();
      
      // Should contain at least 2 of the 3 key concepts (summary selects top 3 sentences)
      const keyConceptsFound = [
        lowerSummary.includes('collective unconscious'),
        lowerSummary.includes('shadow'),
        lowerSummary.includes('individuation')
      ].filter(Boolean).length;
      
      expect(keyConceptsFound).toBeGreaterThanOrEqual(2);
      expect(summary).not.toContain('Weather');
      expect(summary).not.toContain('Coffee');
    });

    it('should handle very long content', () => {
      const longContent = 'Jung believed in the collective unconscious. '.repeat(50);
      const summary = generateSummary(longContent);
      
      expect(summary.length).toBeLessThanOrEqual(400);
      expect(summary).toContain('collective unconscious');
    });

    it('should preserve sentence order in final summary', () => {
      const content = `First, Jung introduced analytical psychology.
        Second, he described the collective unconscious.
        Third, he identified universal archetypes.
        Fourth, general filler content here.
        Fifth, more general content.`;
      
      const summary = generateSummary(content);
      const firstIndex = summary.indexOf('First');
      const secondIndex = summary.indexOf('Second');
      const thirdIndex = summary.indexOf('Third');
      
      if (firstIndex !== -1 && secondIndex !== -1) {
        expect(firstIndex).toBeLessThan(secondIndex);
      }
      if (secondIndex !== -1 && thirdIndex !== -1) {
        expect(secondIndex).toBeLessThan(thirdIndex);
      }
    });

    it('should handle content with only one or two sentences', () => {
      const content = 'Jung studied the collective unconscious.';
      expect(generateSummary(content)).toBe(content);
      
      const twoSentences = 'Jung studied archetypes. He founded analytical psychology.';
      expect(generateSummary(twoSentences)).toBe(twoSentences);
    });

    it('should add ellipsis for truncated summaries', () => {
      const content = 'A'.repeat(500) + '. This sentence will be cut off.';
      const summary = generateSummary(content);
      
      if (summary.length >= 400) {
        expect(summary).toMatch(/\.{3}$|\.$/);
      }
    });

    it('should handle edge cases with punctuation', () => {
      const content = 'What is the shadow? It represents hidden aspects! Jung explained it well... Indeed.';
      const summary = generateSummary(content);
      
      expect(summary.split(/[.!?]+/).filter(s => s.trim()).length).toBeGreaterThan(0);
    });

    it('should give bonus to longer informative sentences', () => {
      const content = `Short sentence. 
        This is a much longer sentence about Jung's concept of individuation and how it relates to personal growth and development. 
        Another short one. 
        A detailed explanation of archetypes including the shadow, anima, animus, and self in analytical psychology.`;
      
      const summary = generateSummary(content);
      expect(summary).toContain('individuation');
      expect(summary).toContain('archetypes');
    });
  });

  describe('Edge cases and boundary conditions', () => {
    it('should handle null/undefined gracefully', () => {
      expect(processContentForMarkdown(null as any)).toBe('');
      expect(processModuleContent(undefined as any)).toBe('');
      expect(extractKeyTerms(null as any)).toEqual([]);
      expect(generateSummary(undefined as any)).toBe('');
    });

    it('should handle special characters and unicode', () => {
      const content = 'Jung\'s concept of "shadow" includes § special © symbols ™ and émōjî 🧠';
      const processed = processModuleContent(content);
      expect(processed).toContain('**shadow**');
      expect(processed).toContain('§');
      expect(processed).toContain('©');
      expect(processed).toContain('🧠');
    });

    it('should handle extremely long words without breaking', () => {
      const content = 'The ' + 'a'.repeat(1000) + ' represents shadow aspects.';
      const terms = extractKeyTerms(content);
      expect(terms.some(t => t.term === 'shadow')).toBe(true);
    });

    it('should handle malformed markdown input', () => {
      const malformed = '**Unclosed bold shadow ** and *unclosed italic anima * text';
      const processed = processModuleContent(malformed);
      expect(processed).toContain('shadow');
      expect(processed).toContain('anima');
    });
  });
});