/**
 * Mock data for tests
 */

export const mockModule = {
  id: 'test-module-1',
  title: 'Introduction to Jungian Psychology',
  description: 'An introductory module on the fundamentals of Jungian psychology',
  metadata: {
    difficulty: 'beginner',
    targetAudience: 'General learners interested in psychology',
    estimatedDuration: 60,
    language: 'en',
    tags: ['jung', 'psychology', 'introduction'],
    status: 'draft'
  },
  structure: {
    introduction: 'Welcome to this introduction to Jungian psychology...',
    sections: [
      {
        id: 'section-1',
        title: 'The Collective Unconscious',
        duration: 15,
        contentPoints: [
          'Definition of collective unconscious',
          'Archetypes and their role',
          'Universal symbols'
        ],
        keyTerms: [
          { term: 'collective unconscious', definition: 'The part of the unconscious mind shared by humanity' },
          { term: 'archetype', definition: 'Universal patterns or images from the collective unconscious' },
          { term: 'symbol', definition: 'Representations that carry deep psychological meaning' }
        ],
        suggestedActivities: ['Reflection exercise on personal archetypes']
      }
    ],
    conclusion: 'In this module, we explored the fundamental concepts...'
  }
};

export const mockBibliographyItem = {
  id: 'bib-1',
  title: 'Man and His Symbols',
  authors: ['Carl Jung'],
  year: 1964,
  type: 'book',
  publisher: 'Doubleday',
  relevanceNote: 'Essential reading for understanding Jungian symbolism'
};

export const mockFilmReference = {
  id: 'film-1',
  title: 'A Dangerous Method',
  director: ['David Cronenberg'],
  year: 2011,
  duration: 99,
  genre: ['Drama', 'Biography'],
  relevance: 'Depicts the relationship between Jung and Freud'
};