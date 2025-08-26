/**
 * Test Data Helper Functions
 * Utility functions to create properly typed test data
 */

import { 
  VideoDuration, 
  Option, 
  DifficultyLevel,
  PublicationType,
  Section 
} from '../../schemas/module.schema';

/**
 * Convert duration string to VideoDuration object
 */
export function createVideoDuration(durationString: string): VideoDuration {
  // Parse formats like "45m", "1h30m", "2h", "45:30", etc.
  let hours = 0;
  let minutes = 0;
  let seconds = 0;

  if (durationString.includes(':')) {
    const parts = durationString.split(':');
    if (parts.length === 2) {
      minutes = parseInt(parts[0], 10) || 0;
      seconds = parseInt(parts[1], 10) || 0;
    } else if (parts.length === 3) {
      hours = parseInt(parts[0], 10) || 0;
      minutes = parseInt(parts[1], 10) || 0;
      seconds = parseInt(parts[2], 10) || 0;
    }
  } else if (durationString.includes('h') || durationString.includes('m')) {
    const hourMatch = durationString.match(/(\d+)h/);
    const minuteMatch = durationString.match(/(\d+)m/);
    
    if (hourMatch) hours = parseInt(hourMatch[1], 10);
    if (minuteMatch) minutes = parseInt(minuteMatch[1], 10);
  } else {
    // Assume it's just minutes if no format specified
    minutes = parseInt(durationString, 10) || 0;
  }

  return { hours, minutes, seconds };
}

/**
 * Create proper Option objects from string arrays
 */
export function createOptions(optionStrings: string[]): Option[] {
  return optionStrings.map((text, index) => ({
    id: index,
    text,
    isCorrect: false, // Will be set based on correctAnswer
  }));
}

/**
 * Create Option objects with correct answer marked
 */
export function createOptionsWithCorrect(
  optionStrings: string[], 
  correctIndex: number | number[]
): Option[] {
  const correctIndices = Array.isArray(correctIndex) ? correctIndex : [correctIndex];
  
  return optionStrings.map((text, index) => ({
    id: index,
    text,
    isCorrect: correctIndices.includes(index),
  }));
}

/**
 * Convert string difficulty to proper enum
 */
export function getDifficultyLevel(difficulty: string): DifficultyLevel {
  const mapping: Record<string, DifficultyLevel> = {
    'beginner': DifficultyLevel.BEGINNER,
    'intermediate': DifficultyLevel.INTERMEDIATE,
    'advanced': DifficultyLevel.ADVANCED
  };
  
  return mapping[difficulty.toLowerCase()] || DifficultyLevel.BEGINNER;
}

/**
 * Convert string publication type to proper enum
 */
export function getPublicationType(type: string): PublicationType {
  const mapping: Record<string, PublicationType> = {
    'book': PublicationType.BOOK,
    'journal-article': PublicationType.JOURNAL_ARTICLE,
    'conference-paper': PublicationType.CONFERENCE_PAPER,
    'thesis': PublicationType.THESIS,
    'website': PublicationType.WEBSITE,
    'report': PublicationType.REPORT,
    'other': PublicationType.OTHER
  };
  
  return mapping[type.toLowerCase()] || PublicationType.OTHER;
}

/**
 * Create a Section with all required properties
 */
export function createSection(data: {
  id: string;
  title: string;
  content: string;
  order?: number;
  concepts?: string[];
  keyTerms?: any[];
}): Section {
  return {
    id: data.id,
    title: data.title,
    content: data.content,
    order: data.order ?? 0,
    keyTerms: data.keyTerms || (data.concepts ? 
      data.concepts.map(term => ({
        term,
        definition: `Definition of ${term}`
      })) : undefined)
  };
}

/**
 * Fix sections array by adding order property
 */
export function fixSections(sections: any[]): Section[] {
  return sections.map((section, index) => 
    createSection({
      ...section,
      order: section.order ?? index
    })
  );
}