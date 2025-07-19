import { ILLMProvider } from '../provider';
import {
  generateBibliography as generateRealBibliography,
  generateReadingPath,
  EnrichedReference,
  BibliographyOptions,
  exportBibliography,
  findReferencesByKeywords,
  jungCollectedWorks,
  contemporaryJungian
} from '../../bibliography';

export interface BibliographyEntry {
  id: string;
  type: 'book' | 'article' | 'chapter' | 'website' | 'video' | 'film' | 'interview' | 'lecture';
  authors: string[];
  title: string;
  year: number;
  publisher?: string;
  journal?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  url?: string;
  abstract?: string;
  relevance: string;
  jungianConcepts: string[];
  readingLevel?: 'beginner' | 'intermediate' | 'advanced' | 'scholar';
  formattedCitation?: {
    apa: string;
    mla: string;
    chicago: string;
  };
}

export class BibliographyGenerator {
  constructor(private provider: ILLMProvider) {}

  async generateBibliography(
    topic: string,
    concepts: string[],
    level: 'introductory' | 'intermediate' | 'advanced',
    count: number = 10
  ): Promise<BibliographyEntry[]> {
    // Map level to our bibliography service levels
    const readingLevel = level === 'introductory' ? 'beginner' : level;
    
    // Generate real bibliography using our service
    const bibliographyOptions: BibliographyOptions = {
      topic,
      keywords: concepts,
      maxResults: count,
      readingLevel: readingLevel as any,
      sortBy: 'relevance'
    };
    
    const enrichedRefs = generateRealBibliography(bibliographyOptions);
    
    // Convert enriched references to BibliographyEntry format
    const entries: BibliographyEntry[] = enrichedRefs.map(ref => ({
      id: ref.id,
      type: ref.type,
      authors: Array.isArray(ref.author) ? ref.author : [ref.author],
      title: ref.title,
      year: ref.year,
      publisher: ref.publisher,
      journal: ref.journal,
      volume: ref.volume?.toString(),
      issue: ref.issue?.toString(),
      pages: ref.pages,
      doi: ref.doi,
      url: ref.url,
      abstract: ref.abstract || '',
      relevance: `Relevance score: ${ref.relevanceScore}%`,
      jungianConcepts: ref.keywords,
      readingLevel: ref.readingLevel,
      formattedCitation: ref.formattedCitation
    }));
    
    // If we need more entries, generate some using LLM
    if (entries.length < count) {
      const additionalCount = count - entries.length;
      const llmEntries = await this.generateAdditionalSources(topic, concepts, level, additionalCount);
      entries.push(...llmEntries);
    }
    
    return entries;
  }

  private async generateAdditionalSources(
    topic: string,
    concepts: string[],
    level: string,
    count: number
  ): Promise<BibliographyEntry[]> {
    const prompt = `
Generate ${count} additional academic sources about "${topic}" in Jungian psychology that complement the existing bibliography.

Key concepts: ${concepts.join(', ')}
Level: ${level}

Focus on:
- Recent interdisciplinary research
- Clinical applications
- Cross-cultural perspectives
- Sources not typically in standard Jung bibliographies

Response format:
[
  {
    "type": "article",
    "authors": ["Author, Name"],
    "title": "Title",
    "year": 2020,
    "journal": "Journal name",
    "volume": "45",
    "issue": "3",
    "pages": "234-256",
    "doi": "10.xxxx/xxxxx",
    "abstract": "Brief abstract",
    "relevance": "Why this complements Jung's original work",
    "jungianConcepts": ["concept1", "concept2"]
  }
]
`;

    // Define proper schema for the structured response
    const schema = {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["book", "article", "chapter", "website", "video", "film", "interview", "lecture"] },
          authors: { type: "array", items: { type: "string" } },
          title: { type: "string" },
          year: { type: "number" },
          journal: { type: "string" },
          volume: { type: "string" },
          issue: { type: "string" },
          pages: { type: "string" },
          doi: { type: "string" },
          abstract: { type: "string" },
          relevance: { type: "string" },
          jungianConcepts: { type: "array", items: { type: "string" } }
        },
        required: ["type", "authors", "title", "year", "relevance", "jungianConcepts"]
      }
    };

    let sources: Array<Omit<BibliographyEntry, 'id' | 'readingLevel' | 'formattedCitation'>>;
    
    try {
      sources = await this.provider.generateStructuredResponse<Array<Omit<BibliographyEntry, 'id' | 'readingLevel' | 'formattedCitation'>>>(
        prompt,
        schema,
        { temperature: 0.5 }
      );
    } catch (error) {
      console.error('Error generating additional sources:', error);
      // Return empty array if generation fails
      return [];
    }

    // Ensure sources is an array before calling map
    if (!Array.isArray(sources)) {
      console.error('generateStructuredResponse did not return an array, got:', sources);
      return [];
    }

    return sources.map((source, index) => ({
      id: `additional-${index + 1}`,
      ...source,
      readingLevel: level === 'introductory' ? 'beginner' : level as any,
    }));
  }

  async generatePrimarySourcesFromDatabase(
    topic: string,
    concepts: string[]
  ): Promise<BibliographyEntry[]> {
    // Find relevant Jung Collected Works
    const relevantCW = findReferencesByKeywords(concepts);
    
    // Convert to BibliographyEntry format
    return relevantCW
      .filter(ref => ref.id.startsWith('cw'))
      .slice(0, 5)
      .map(ref => ({
        id: ref.id,
        type: ref.type,
        authors: Array.isArray(ref.author) ? ref.author : [ref.author],
        title: ref.title,
        year: ref.year,
        publisher: ref.publisher,
        journal: ref.journal,
        volume: ref.volume?.toString(),
        issue: ref.issue?.toString(),
        pages: ref.pages,
        doi: ref.doi,
        url: ref.url,
        abstract: ref.abstract || `Key Jungian text exploring ${ref.keywords.join(', ')}`,
        relevance: `Primary source for understanding ${topic}`,
        jungianConcepts: ref.keywords
      }));
  }


  async formatCitation(entry: BibliographyEntry, style: 'APA' | 'MLA' | 'Chicago' = 'APA'): Promise<string> {
    // If we have pre-formatted citations, use them
    if (entry.formattedCitation) {
      const styleMap = {
        'APA': 'apa',
        'MLA': 'mla',
        'Chicago': 'chicago'
      };
      return entry.formattedCitation[styleMap[style] as keyof typeof entry.formattedCitation];
    }
    
    // Otherwise, generate citation using LLM
    const prompt = `
Format this bibliographic entry in ${style} style:

Type: ${entry.type}
Authors: ${entry.authors.join(', ')}
Title: ${entry.title}
Year: ${entry.year}
${entry.publisher ? `Publisher: ${entry.publisher}` : ''}
${entry.journal ? `Journal: ${entry.journal}` : ''}
${entry.volume ? `Volume: ${entry.volume}` : ''}
${entry.issue ? `Issue: ${entry.issue}` : ''}
${entry.pages ? `Pages: ${entry.pages}` : ''}
${entry.doi ? `DOI: ${entry.doi}` : ''}
${entry.url ? `URL: ${entry.url}` : ''}

Provide only the formatted citation, nothing else.
`;

    return await this.provider.generateCompletion(prompt, {
      temperature: 0.1,
      maxTokens: 200,
    });
  }

  async generateAnnotatedBibliography(
    entries: BibliographyEntry[],
    focusAreas: string[]
  ): Promise<Array<{ entry: BibliographyEntry; annotation: string }>> {
    const annotations = await Promise.all(
      entries.map(async entry => {
        const prompt = `
Write a 150-200 word annotation for this source about "${entry.title}" by ${entry.authors.join(', ')}.

Abstract: ${entry.abstract}
Relevance: ${entry.relevance}

Focus areas for annotation: ${focusAreas.join(', ')}

The annotation should:
1. Summarize the main arguments or findings
2. Evaluate the source's credibility and contribution
3. Explain how it relates to the focus areas
4. Note any limitations or biases
`;

        const annotation = await this.provider.generateCompletion(prompt, {
          temperature: 0.6,
          maxTokens: 300,
        });

        return { entry, annotation };
      })
    );

    return annotations;
  }

  async suggestReadingOrder(
    entries: BibliographyEntry[],
    learningObjectives: string[]
  ): Promise<BibliographyEntry[]> {
    // If entries have reading levels, we can order them automatically
    const hasReadingLevels = entries.every(e => e.readingLevel);
    
    if (hasReadingLevels) {
      const levelOrder = { 'beginner': 0, 'intermediate': 1, 'advanced': 2, 'scholar': 3 };
      
      // Sort by reading level first, then by year within each level
      return [...entries].sort((a, b) => {
        const levelDiff = levelOrder[a.readingLevel!] - levelOrder[b.readingLevel!];
        if (levelDiff !== 0) return levelDiff;
        
        // Within same level, put older foundational texts first
        if (a.id.startsWith('mams') || a.id.startsWith('mdrs')) return -1;
        if (b.id.startsWith('mams') || b.id.startsWith('mdrs')) return 1;
        
        return a.year - b.year;
      });
    }
    
    // Otherwise use LLM to suggest order
    const prompt = `
Order these bibliography entries for optimal learning progression:

Entries:
${entries.map((e, i) => `${i + 1}. "${e.title}" (${e.year}) - ${e.type}, ${e.readingLevel || 'Level unknown'}`).join('\n')}

Learning objectives:
${learningObjectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n')}

Create a reading order that:
1. Starts with foundational texts (like "Man and His Symbols")
2. Builds complexity gradually
3. Introduces primary sources at appropriate times
4. Ends with contemporary applications

Response format:
[3, 1, 5, 2, 4] (indices in suggested order)
`;

    // Define schema for array of numbers
    const orderSchema = {
      type: "array",
      items: { type: "number" }
    };

    let order: number[];
    
    try {
      order = await this.provider.generateStructuredResponse<number[]>(
        prompt,
        orderSchema,
        { temperature: 0.3 }
      );
    } catch (error) {
      console.error('Error generating reading order:', error);
      // Return original order if generation fails
      return entries;
    }

    // Ensure order is an array before calling map
    if (!Array.isArray(order)) {
      console.error('generateStructuredResponse did not return an array for order, got:', order);
      return entries;
    }

    // Validate indices are within bounds
    const validOrder = order.filter(index => index >= 1 && index <= entries.length);
    if (validOrder.length !== order.length) {
      console.warn('Some indices were out of bounds, using valid indices only');
    }

    return validOrder.map(index => entries[index - 1]);
  }

  // New method to generate reading paths using our service
  async generateReadingPaths(topic: string): Promise<{
    beginner: BibliographyEntry[];
    intermediate: BibliographyEntry[];
    advanced: BibliographyEntry[];
    scholar?: BibliographyEntry[];
  }> {
    const paths = generateReadingPath(topic);
    const result: any = {};
    
    paths.forEach(path => {
      const levelKey = path.level.toLowerCase();
      result[levelKey] = path.references.map(ref => ({
        id: ref.id,
        type: ref.type,
        authors: Array.isArray(ref.author) ? ref.author : [ref.author],
        title: ref.title,
        year: ref.year,
        publisher: ref.publisher,
        journal: ref.journal,
        volume: ref.volume?.toString(),
        issue: ref.issue?.toString(),
        pages: ref.pages,
        doi: ref.doi,
        url: ref.url,
        abstract: ref.abstract || '',
        relevance: `Relevance score: ${ref.relevanceScore}%`,
        jungianConcepts: ref.keywords,
        readingLevel: ref.readingLevel,
        formattedCitation: ref.formattedCitation
      }));
    });
    
    return result;
  }
}