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

shadowBibliography.forEach(ref => {
  console.log(`${ref.title} (${ref.year})`);
  console.log(`  Authors: ${ref.author}`);
  console.log(`  Reading Level: ${ref.readingLevel}`);
  console.log(`  Relevance Score: ${ref.relevanceScore}%`);
  console.log(`  Citation (APA): ${ref.formattedCitation.apa}`);
  console.log('');
});

// Example 2: Generate reading paths for Individuation
console.log('\n=== Reading Paths for Individuation ===\n');

const individuationPaths = generateReadingPath('individuation');

individuationPaths.forEach(path => {
  console.log(`\n${path.level} Path:`);
  console.log(path.description);
  console.log('---');
  path.references.forEach((ref, idx) => {
    console.log(`${idx + 1}. ${ref.title} (${ref.year})`);
  });
});

// Example 3: Find specific types of references
console.log('\n=== Film References ===\n');

const films = allReferences.filter(ref => ref.type === 'film');
films.forEach(film => {
  console.log(`- ${film.title} (${film.year})`);
  if (film.url) console.log(`  URL: ${film.url}`);
});

// Example 4: Find references by category
console.log('\n=== Alchemy References ===\n');

const alchemyRefs = findReferencesByCategory('alchemy');
alchemyRefs.forEach(ref => {
  console.log(`- ${ref.title} (${ref.id})`);
});

// Example 5: Export bibliography in different formats
console.log('\n=== Bibliography Export (BibTeX) ===\n');

const typologyRefs = generateBibliography({
  topic: 'psychological types',
  keywords: ['introversion', 'extraversion', 'thinking', 'feeling'],
  maxResults: 3,
  sortBy: 'year'
});

const bibtex = exportBibliography(typologyRefs, 'bibtex');
console.log(bibtex);

// Example 6: Find prerequisites for advanced texts
console.log('\n=== Prerequisites for Reading the Red Book ===\n');

const redBook = allReferences.find(ref => ref.id === 'redbook');
if (redBook) {
  const enrichedRedBook = enrichReference(redBook, { topic: 'active imagination' });
  
  console.log(`To read "${redBook.title}", first read:`);
  if (enrichedRedBook.prerequisiteIds) {
    enrichedRedBook.prerequisiteIds.forEach(prereqId => {
      const prereq = allReferences.find(r => r.id === prereqId);
      if (prereq) {
        console.log(`- ${prereq.title}`);
      }
    });
  }
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

dreamResearch.forEach(ref => {
  console.log(`${ref.formattedCitation.apa}`);
  console.log(`  Topic Relevance: ${JSON.stringify(ref.topicRelevance)}`);
  console.log('');
});