// Example usage of the Bibliography Service
import {
  generateBibliography,
  generateReadingPath,
  exportBibliography,
  findReferencesByKeywords,
  findReferencesByCategory,
  enrichReference,
  allReferences
} from './index';

// Example 1: Generate a bibliography on the Shadow archetype
console.log('=== Bibliography on the Shadow Archetype ===\n');

const shadowBibliography = generateBibliography({
  topic: 'shadow',
  keywords: ['shadow', 'projection', 'dark side', 'repression'],
  maxResults: 10,
  readingLevel: 'intermediate',
  sortBy: 'relevance'
});

if (shadowBibliography && shadowBibliography.length > 0) {
  shadowBibliography.forEach(ref => {
    console.log(`${ref.title} (${ref.year})`);
    console.log(`  Authors: ${ref.author}`);
    console.log(`  Reading Level: ${ref.readingLevel}`);
    console.log(`  Relevance Score: ${ref.relevanceScore}%`);
    console.log(`  Citation (APA): ${ref.formattedCitation.apa}`);
    console.log('');
  });
} else {
  console.log('No references found for shadow archetype with the specified criteria.');
}

// Example 2: Generate reading paths for Individuation
console.log('\n=== Reading Paths for Individuation ===\n');

const individuationPaths = generateReadingPath('individuation');

if (individuationPaths && individuationPaths.length > 0) {
  individuationPaths.forEach(path => {
    console.log(`\n${path.level} Path:`);
    console.log(path.description);
    console.log('---');
    if (path.references && path.references.length > 0) {
      path.references.forEach((ref, idx) => {
        console.log(`${idx + 1}. ${ref.title} (${ref.year})`);
      });
    } else {
      console.log('No references available for this path.');
    }
  });
} else {
  console.log('No reading paths found for individuation.');
}

// Example 3: Find specific types of references
console.log('\n=== Film References ===\n');

if (allReferences && allReferences.length > 0) {
  const films = allReferences.filter(ref => ref.type === 'film');
  if (films.length > 0) {
    films.forEach(film => {
      console.log(`- ${film.title} (${film.year})`);
      if (film.url) console.log(`  URL: ${film.url}`);
    });
  } else {
    console.log('No film references found in the database.');
  }
} else {
  console.log('Reference database is empty or unavailable.');
}

// Example 4: Find references by category
console.log('\n=== Alchemy References ===\n');

const alchemyRefs = findReferencesByCategory('alchemy');
if (alchemyRefs && alchemyRefs.length > 0) {
  alchemyRefs.forEach(ref => {
    console.log(`- ${ref.title} (${ref.id})`);
  });
} else {
  console.log('No alchemy references found in the database.');
}

// Example 5: Export bibliography in different formats
console.log('\n=== Bibliography Export (BibTeX) ===\n');

const typologyRefs = generateBibliography({
  topic: 'psychological types',
  keywords: ['introversion', 'extraversion', 'thinking', 'feeling'],
  maxResults: 3,
  sortBy: 'year'
});

if (typologyRefs && typologyRefs.length > 0) {
  const bibtex = exportBibliography(typologyRefs, 'bibtex');
  console.log(bibtex);
} else {
  console.log('No typology references found to export.');
}

// Example 6: Find prerequisites for advanced texts
console.log('\n=== Prerequisites for Reading the Red Book ===\n');

if (allReferences && allReferences.length > 0) {
  const redBook = allReferences.find(ref => ref.id === 'redbook');
  if (redBook) {
    try {
      const enrichedRedBook = enrichReference(redBook, { topic: 'active imagination' });
      
      console.log(`To read "${redBook.title}", first read:`);
      if (enrichedRedBook && enrichedRedBook.prerequisiteIds && enrichedRedBook.prerequisiteIds.length > 0) {
        enrichedRedBook.prerequisiteIds.forEach(prereqId => {
          const prereq = allReferences.find(r => r.id === prereqId);
          if (prereq) {
            console.log(`- ${prereq.title}`);
          }
        });
      } else {
        console.log('No specific prerequisites identified for the Red Book.');
      }
    } catch (error) {
      console.error('Error enriching Red Book reference:', error);
    }
  } else {
    console.log('Red Book not found in the reference database.');
  }
} else {
  console.log('Reference database is empty or unavailable.');
}

// Example 7: Complex search combining multiple criteria
console.log('\n=== Contemporary Research on Dreams ===\n');

const dreamResearch = generateBibliography({
  topic: 'dreams',
  keywords: ['dream analysis', 'unconscious', 'symbols'],
  maxResults: 5,
  yearRange: { start: 2000, end: 2024 },
  includeTypes: ['article', 'book'],
  readingLevel: 'scholar',
  sortBy: 'year'
});

if (dreamResearch && dreamResearch.length > 0) {
  dreamResearch.forEach(ref => {
    console.log(`${ref.formattedCitation.apa}`);
    console.log(`  Topic Relevance: ${JSON.stringify(ref.topicRelevance)}`);
    console.log('');
  });
} else {
  console.log('No contemporary dream research found matching the specified criteria.');
}

// =====================================================================
// EXPORTED FUNCTIONS FOR TESTING
// =====================================================================

/**
 * Generate bibliography for a specific module topic
 * @param topic The main topic/module name
 * @param concepts Array of related concepts to search for
 * @returns Array of enriched references
 */
export async function generateModuleBibliography(
  topic: string, 
  concepts: string[]
): Promise<import('./bibliographyEnricher').EnrichedReference[]> {
  if (!topic || topic.trim() === '') {
    throw new Error('Topic parameter is required and cannot be empty');
  }

  // Import the function directly
  const { generateBibliography } = await import('./bibliographyEnricher');

  const options = {
    topic: topic.trim(),
    keywords: concepts,
    maxResults: 10,
    sortBy: 'relevance' as const
  };

  const result = generateBibliography(options);
  
  // Ensure we return an array even if generateBibliography returns undefined
  return Array.isArray(result) ? result : [];
}

/**
 * Enrich references with additional metadata
 * @param references Array of basic references to enrich
 * @returns Array of enriched references with metadata
 */
export async function enrichReferences(
  references: any[]
): Promise<import('./bibliographyEnricher').EnrichedReference[]> {
  const { enrichReference } = await import('./bibliographyEnricher');
  
  return references.map(ref => {
    // Convert basic reference format to our Reference format if needed
    const normalizedRef = {
      id: ref.id || `ref-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: ref.type || 'book' as const,
      title: ref.title || 'Untitled',
      author: ref.authors || ref.author || 'Unknown Author',
      year: ref.year || new Date().getFullYear(),
      publisher: ref.publisher,
      journal: ref.journal,
      volume: ref.volume,
      issue: ref.issue,
      pages: ref.pages,
      doi: ref.doi,
      url: ref.url,
      isbn: ref.isbn,
      abstract: ref.abstract,
      keywords: ref.keywords || [],
      category: ref.category || []
    };

    // Enrich the reference
    const enriched = enrichReference(normalizedRef);
    
    // Add metadata property for enriched reference
    return {
      ...enriched,
      metadata: {
        enriched: true,
        processedAt: new Date().toISOString(),
        readingLevel: enriched?.readingLevel || 'intermediate',
        relevanceScore: enriched?.relevanceScore || 50
      }
    };
  });
}

/**
 * Format citations in specified style
 * @param references Array of references to format
 * @param style Citation style (APA, MLA, Chicago)
 * @returns Array of formatted citation strings
 */
export function formatCitations(
  references: any[], 
  style: 'APA' | 'MLA' | 'Chicago'
): string[] {
  if (!['APA', 'MLA', 'Chicago'].includes(style)) {
    throw new Error('Unsupported citation style');
  }

  // Import synchronously to avoid issues
  const bibliographyModule = require('./bibliographyEnricher');
  const formatters = bibliographyModule.formatters;
  
  if (!formatters) {
    console.error('Formatters not found in bibliographyEnricher');
    throw new Error('Bibliography formatters not available');
  }
  
  return references.map(ref => {
    // Convert to our Reference format
    const normalizedRef = {
      id: ref.id || 'unknown',
      type: ref.type || 'book' as const,
      title: ref.title || 'Untitled',
      author: ref.authors || ref.author || 'Unknown Author',
      year: ref.year || new Date().getFullYear(),
      publisher: ref.publisher,
      journal: ref.journal,
      volume: ref.volume,
      issue: ref.issue,
      pages: ref.pages,
      doi: ref.doi,
      url: ref.url,
      isbn: ref.isbn,
      abstract: ref.abstract,
      keywords: ref.keywords || [],
      category: ref.category || []
    };

    try {
      let formattedCitation;
      switch (style) {
        case 'APA':
          formattedCitation = formatters.apa(normalizedRef);
          break;
        case 'MLA':
          formattedCitation = formatters.mla(normalizedRef);
          break;
        case 'Chicago':
          formattedCitation = formatters.chicago(normalizedRef);
          break;
        default:
          throw new Error('Unsupported citation style');
      }
      
      // Fallback if formatter returns undefined
      if (typeof formattedCitation !== 'string' || !formattedCitation) {
        return `${normalizedRef.author} (${normalizedRef.year}). ${normalizedRef.title}.`;
      }
      
      return formattedCitation;
    } catch (error) {
      console.error('Error formatting citation:', error);
      return `${normalizedRef.author} (${normalizedRef.year}). ${normalizedRef.title}.`;
    }
  });
}

/**
 * Validate references and separate valid from invalid ones
 * @param references Array of references to validate
 * @returns Object with valid and invalid reference arrays
 */
export function validateReferences(references: any[]): {
  valid: any[];
  invalid: any[];
} {
  const valid: any[] = [];
  const invalid: any[] = [];

  references.forEach(ref => {
    // Check required fields
    const hasTitle = ref.title && ref.title.trim() !== '';
    const hasAuthors = ref.authors && Array.isArray(ref.authors) && ref.authors.length > 0;
    const hasYear = ref.year && typeof ref.year === 'number' && ref.year > 0;

    if (hasTitle && hasAuthors && hasYear) {
      valid.push(ref);
    } else {
      invalid.push(ref);
    }
  });

  return { valid, invalid };
}