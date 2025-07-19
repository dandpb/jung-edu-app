// Bibliography Service Export
export * from './referenceDatabase';
export * from './bibliographyEnricher';

// Re-export main functions for convenience
export {
  allReferences,
  jungCollectedWorks,
  jungPopularWorks,
  contemporaryJungian,
  filmReferences,
  academicResearch,
  findReferencesByKeywords,
  findReferencesByCategory,
  findReferencesByAuthor,
  findReferencesByType,
  findReferencesInYearRange,
  referenceCategories,
  keywordGroups
} from './referenceDatabase';

export {
  enrichReference,
  generateBibliography,
  generateReadingPath,
  exportBibliography,
  formatters
} from './bibliographyEnricher';

// Export types
export type {
  Reference
} from './referenceDatabase';

export type {
  EnrichedReference,
  BibliographyOptions,
  ReadingPath
} from './bibliographyEnricher';