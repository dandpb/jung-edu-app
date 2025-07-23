import { KeyTerm } from '../types';

/**
 * Processes content to convert plain text list markers into proper Markdown format
 */
export function processContentForMarkdown(content: string): string {
  if (!content || typeof content !== 'string') return '';
  
  let processedContent = content;

  // Process numbered lists with content on next line - merge them
  processedContent = processedContent.replace(/(\d+)\.\s*\n([^\n]+)/gm, '$1. $2');
  
  // Process bullet points with content on next line - merge them
  processedContent = processedContent.replace(/•\s*\n([^\n]+)/gm, '* $1');
  
  // Handle nested bullet points (indented with spaces)
  processedContent = processedContent.replace(/^\s+•\s+(.+)$/gm, '* $1');
  
  // Handle mixed list types - process numbered items
  processedContent = processedContent.replace(/^(\d+)\.\s+(.+)$/gm, (match, num, content) => {
    // Check if content starts with capital letter and contains colon
    if (content.match(/^[A-Z][^:]+:/)) {
      return `${num}. **${content.replace(':', ':**')}`;
    }
    return match;
  });
  
  // Handle bullet points with capitalized content and colon
  processedContent = processedContent.replace(/^•\s+([A-Z][^:]+):\s*(.*)$/gm, '* **$1:** $2');
  
  // Ensure proper spacing between different types of content
  // Add blank line before lists only when preceded by non-list content
  const lines = processedContent.split('\n');
  const processedLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const currentLine = lines[i];
    const prevLine = i > 0 ? lines[i - 1] : '';
    
    // Check if current line is a list item
    const isCurrentList = /^(\d+\.|\*)\s/.test(currentLine);
    const isPrevList = /^(\d+\.|\*)\s/.test(prevLine);
    
    // Add spacing only between non-list and list content
    if (isCurrentList && prevLine && !isPrevList) {
      processedLines.push('');
    }
    
    processedLines.push(currentLine);
  }
  
  processedContent = processedLines.join('\n');
  
  // Clean up multiple blank lines but preserve single blank lines
  processedContent = processedContent.replace(/\n{3,}/g, '\n\n');
  
  // Remove trailing whitespace
  processedContent = processedContent.trim();
  
  return processedContent;
}

/**
 * Post-processes HTML to add additional styling classes
 */
export function enhanceListHTML(html: string): string {
  // This function could be used if we need to further enhance the HTML
  // after ReactMarkdown processing
  return html;
}

/**
 * Processes module content to enhance it with educational formatting and metadata
 */
export function processModuleContent(content: string): string {
  if (!content || typeof content !== 'string' || content.trim() === '') {
    return '';
  }

  let processedContent = content;

  // Convert to markdown-friendly format first
  processedContent = processContentForMarkdown(processedContent);
  
  // Enhance psychological terms with emphasis
  const psychologyTerms = [
    'collective unconscious', 'individual unconscious', 'personal unconscious',
    'archetype', 'archetypes', 'shadow', 'anima', 'animus', 'self',
    'individuation', 'synchronicity', 'complex', 'complexes',
    'analytical psychology', 'depth psychology', 'persona', 'ego',
    'projection', 'active imagination', 'dream analysis', 'mandala',
    'psychological types', 'introversion', 'extraversion', 'thinking',
    'feeling', 'sensation', 'intuition', 'transcendent function'
  ];

  // Process terms in reverse order to avoid index shifting issues
  psychologyTerms.forEach(term => {
    const regex = new RegExp(`\\b(${term})\\b`, 'gi');
    const matches = [];
    let match;
    
    // Collect all matches first
    while ((match = regex.exec(processedContent)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[0]
      });
    }
    
    // Process matches in reverse order to maintain indices
    for (let i = matches.length - 1; i >= 0; i--) {
      const m = matches[i];
      const beforeText = processedContent.substring(Math.max(0, m.start - 2), m.start);
      const afterText = processedContent.substring(m.end, Math.min(processedContent.length, m.end + 2));
      
      // Skip if already emphasized
      if (beforeText.includes('*') || afterText.includes('*')) {
        continue;
      }
      
      // Special handling for compound terms like anima/animus
      const isCompoundTerm = afterText.startsWith('/') && 
        psychologyTerms.some(t => processedContent.substring(m.end + 1).toLowerCase().startsWith(t.toLowerCase()));
      
      if (isCompoundTerm) {
        const secondTermMatch = processedContent.substring(m.end + 1).match(/^(\w+)/);
        if (secondTermMatch) {
          const replacement = `**${m.text}**/**${secondTermMatch[0]}**`;
          processedContent = processedContent.substring(0, m.start) + replacement + 
                           processedContent.substring(m.end + 1 + secondTermMatch[0].length);
        }
      } else {
        processedContent = processedContent.substring(0, m.start) + `**${m.text}**` + 
                         processedContent.substring(m.end);
      }
    }
  });

  // Add educational structure markers
  // Handle Key Concepts anywhere in the content
  processedContent = processedContent.replace(/\n?Key Concepts?:?\s*/gmi, '\n## Key Concepts:\n');
  // Handle Important and Note at start of line
  processedContent = processedContent.replace(/^(Important):?\s*/gmi, '> **$1:** ');
  processedContent = processedContent.replace(/^(Note):?\s*/gmi, '> **$1:** ');
  
  return processedContent;
}

/**
 * Extracts key psychological terms from content with definitions
 */
export function extractKeyTerms(content: string): KeyTerm[] {
  if (!content || typeof content !== 'string' || content.trim() === '') {
    return [];
  }

  // Psychological terms with definitions for Jungian psychology
  const jungianTermsDefinitions: Record<string, string> = {
    'collective unconscious': 'The part of the unconscious mind shared by all humanity, containing universal patterns and images called archetypes.',
    'individual unconscious': 'The personal layer of unconscious psychic material unique to each person, including forgotten and repressed contents.',
    'personal unconscious': 'The personal layer of unconscious psychic material unique to each person, including forgotten and repressed contents.',
    'archetype': 'Universal patterns or images that derive from the collective unconscious and appear in dreams, myths, and fantasies.',
    'shadow': 'The hidden, repressed, or denied aspects of the ego that the conscious personality does not identify with.',
    'anima': 'The unconscious feminine aspect within the male psyche that serves as a bridge to the unconscious.',
    'animus': 'The unconscious masculine aspect within the female psyche that serves as a bridge to the unconscious.',
    'self': 'The unified consciousness and unconscious of an individual, representing psychological wholeness and integration.',
    'individuation': 'The central process of human development involving the integration of conscious and unconscious contents to achieve psychological wholeness.',
    'synchronicity': 'Meaningful coincidences that suggest an underlying order connecting psychological and physical events.',
    'complex': 'An autonomous cluster of psychic contents that can influence behavior and consciousness from the unconscious.',
    'analytical psychology': 'Jung\'s approach to psychology emphasizing the integration of conscious and unconscious processes for psychological development.',
    'persona': 'The mask or facade presented to the world, representing how one wishes to be seen by others.',
    'ego': 'The center of consciousness and the sense of identity and continuity in an individual.',
    'projection': 'The unconscious transfer of one\'s own qualities onto another person or object.',
    'active imagination': 'A technique for consciously engaging with unconscious contents through imagination and fantasy.',
    'transcendent function': 'The bridge between conscious and unconscious contents that facilitates psychological development.',
    'psychological types': 'Jung\'s typology system including attitudes (introversion/extraversion) and functions (thinking, feeling, sensation, intuition).',
    'introversion': 'A psychological attitude where energy is directed inward toward one\'s own thoughts and feelings.',
    'extraversion': 'A psychological attitude where energy is directed outward toward the external world and other people.',
    'thinking': 'A psychological function that seeks to understand the world through logic and objective analysis.',
    'feeling': 'A psychological function that evaluates experiences based on personal values and emotional significance.',
    'sensation': 'A psychological function that perceives concrete facts and details through the five senses.',
    'intuition': 'A psychological function that perceives possibilities, patterns, and unconscious contents.',
    'depth psychology': 'An approach to psychology that explores the unconscious mind, including analytical psychology and psychoanalysis.',
    'dream analysis': 'The interpretation of dreams to understand unconscious contents and psychological dynamics.'
  };

  const extractedTerms: KeyTerm[] = [];
  const lowerContent = content.toLowerCase();

  // Extract terms that appear in the content
  Object.entries(jungianTermsDefinitions).forEach(([term, definition]) => {
    if (lowerContent.includes(term.toLowerCase())) {
      extractedTerms.push({ term, definition });
    }
  });

  // Also extract other potential key terms using pattern matching
  const additionalTerms = content.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
  
  additionalTerms.forEach(term => {
    const lowerTerm = term.toLowerCase();
    // Skip if already found or if it's a common word
    if (!extractedTerms.find(t => t.term.toLowerCase() === lowerTerm) && 
        !['The', 'This', 'That', 'These', 'Those', 'Carl', 'Jung', 'Gustav', 'Are', 'Not', 'Key', 'Terms', 'But', 'Is'].includes(term) &&
        term.length > 3) {
      
      // Check if it's already in our definitions (case variations)
      const foundDef = Object.entries(jungianTermsDefinitions).find(([key]) => 
        key.toLowerCase() === lowerTerm
      );
      
      if (foundDef) {
        extractedTerms.push({ term, definition: foundDef[1] });
      } else if (lowerTerm === 'depth psychology') {
        // Special case for compound terms that should be included
        extractedTerms.push({
          term,
          definition: jungianTermsDefinitions['depth psychology'] || `An approach to psychology that explores the unconscious mind, including analytical psychology and psychoanalysis.`
        });
      } else if (lowerTerm.includes('psychology') || lowerTerm.includes('psycho') || 
          lowerTerm.includes('conscious') || lowerTerm.includes('mind')) {
        extractedTerms.push({
          term,
          definition: `A concept in analytical psychology related to ${lowerTerm}.`
        });
      }
    }
  });

  // Remove duplicates and return
  const uniqueTerms = extractedTerms.filter((term, index, arr) => 
    arr.findIndex(t => t.term.toLowerCase() === term.term.toLowerCase()) === index
  );

  return uniqueTerms;
}

/**
 * Generates a concise summary of the content
 */
export function generateSummary(content: string): string {
  if (!content || typeof content !== 'string' || content.trim() === '') {
    return '';
  }

  // Remove markdown formatting for cleaner processing
  let cleanContent = content
    .replace(/#{1,6}\s+/g, '') // Remove headers
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
    .replace(/\*([^*]+)\*/g, '$1') // Remove italics
    .replace(/`([^`]+)`/g, '$1') // Remove code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
    .replace(/^\s*[-*+]\s+/gm, '') // Remove bullet points
    .replace(/^\s*\d+\.\s+/gm, '') // Remove numbered lists
    .replace(/\n{2,}/g, ' ') // Replace multiple newlines with space
    .trim();

  if (cleanContent.length <= 200) {
    return cleanContent;
  }

  // Split into sentences
  const sentences = cleanContent.split(/[.!?]+/).filter(s => s.trim().length > 10);
  
  if (sentences.length <= 2) {
    return cleanContent.substring(0, 300) + (cleanContent.length > 300 ? '...' : '');
  }

  // Priority keywords for Jungian psychology
  const priorityKeywords = [
    'jung', 'collective unconscious', 'archetype', 'individuation', 'shadow',
    'anima', 'animus', 'analytical psychology', 'synchronicity', 'complex',
    'persona', 'ego', 'self', 'unconscious'
  ];

  // Score sentences based on priority keywords and position
  const scoredSentences = sentences.map((sentence, index) => {
    let score = 0;
    const lowerSentence = sentence.toLowerCase();
    
    // Higher score for sentences with priority keywords
    priorityKeywords.forEach(keyword => {
      if (lowerSentence.includes(keyword)) {
        score += 3;
      }
    });
    
    // Bonus for first few sentences (often contain main ideas)
    if (index < 3) score += 2;
    
    // Bonus for longer sentences (often more informative)
    if (sentence.length > 50) score += 1;
    
    return { sentence: sentence.trim() + '.', score, index };
  });

  // Sort by score and select top sentences
  const topSentences = scoredSentences
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(3, sentences.length))
    .sort((a, b) => a.index - b.index) // Restore original order
    .map(s => s.sentence);

  let summary = topSentences.join(' ');
  
  // Ensure summary isn't too long
  if (summary.length > 400) {
    summary = summary.substring(0, 400);
    const lastPeriod = summary.lastIndexOf('.');
    if (lastPeriod > 200) {
      summary = summary.substring(0, lastPeriod + 1);
    } else {
      summary += '...';
    }
  }

  return summary;
}