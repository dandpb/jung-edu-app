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
    count: number = 10,
    language: string = 'pt-BR'
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
      const llmEntries = await this.generateAdditionalSources(topic, concepts, level, additionalCount, language);
      entries.push(...llmEntries);
    }
    
    return entries;
  }

  private async generateAdditionalSources(
    topic: string,
    concepts: string[],
    level: string,
    count: number,
    language: string = 'pt-BR'
  ): Promise<BibliographyEntry[]> {
    const prompt = language === 'pt-BR' ? `
Gere ${count} fontes acadêmicas adicionais sobre "${topic}" em psicologia junguiana que complementem a bibliografia existente.

Conceitos-chave: ${concepts.join(', ')}
Nível: ${level === 'introductory' ? 'introdutório' : level === 'intermediate' ? 'intermediário' : 'avançado'}

Foque em:
- Pesquisa interdisciplinar recente
- Aplicações clínicas
- Perspectivas transculturais
- Fontes não tipicamente em bibliografias padrão de Jung
- Preferência por fontes em português ou traduzidas

Formato de resposta:
[
  {
    "type": "article",
    "authors": ["Autor, Nome"],
    "title": "Título em Português",
    "year": 2020,
    "journal": "Nome do Periódico",
    "volume": "45",
    "issue": "3",
    "pages": "234-256",
    "doi": "10.xxxx/xxxxx",
    "abstract": "Resumo breve em português",
    "relevance": "Por que isso complementa o trabalho original de Jung",
    "jungianConcepts": ["conceito1", "conceito2"]
  }
]
` : `
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
        abstract: ref.abstract || `Texto junguiano fundamental explorando ${ref.keywords.join(', ')}`,
        relevance: `Fonte primária para entender ${topic}`,
        jungianConcepts: ref.keywords
      }));
  }


  async formatCitation(entry: BibliographyEntry, style: 'APA' | 'MLA' | 'Chicago' = 'APA', language: string = 'pt-BR'): Promise<string> {
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
    const prompt = language === 'pt-BR' ? `
Formate esta entrada bibliográfica no estilo ${style}:

Tipo: ${entry.type === 'book' ? 'livro' : entry.type === 'article' ? 'artigo' : entry.type}
Autores: ${entry.authors.join(', ')}
Título: ${entry.title}
Ano: ${entry.year}
${entry.publisher ? `Editora: ${entry.publisher}` : ''}
${entry.journal ? `Periódico: ${entry.journal}` : ''}
${entry.volume ? `Volume: ${entry.volume}` : ''}
${entry.issue ? `Edição: ${entry.issue}` : ''}
${entry.pages ? `Páginas: ${entry.pages}` : ''}
${entry.doi ? `DOI: ${entry.doi}` : ''}
${entry.url ? `URL: ${entry.url}` : ''}

Forneça apenas a citação formatada, nada mais.
` : `
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
    focusAreas: string[],
    language: string = 'pt-BR'
  ): Promise<Array<{ entry: BibliographyEntry; annotation: string }>> {
    const annotations = await Promise.all(
      entries.map(async entry => {
        const prompt = language === 'pt-BR' ? `
Escreva uma anotação de 150-200 palavras para esta fonte sobre "${entry.title}" por ${entry.authors.join(', ')}.

Resumo: ${entry.abstract}
Relevância: ${entry.relevance}

Áreas de foco para anotação: ${focusAreas.join(', ')}

A anotação deve:
1. Resumir os principais argumentos ou descobertas
2. Avaliar a credibilidade e contribuição da fonte
3. Explicar como se relaciona com as áreas de foco
4. Observar quaisquer limitações ou vieses

Escreva em português brasileiro.
` : `
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
    learningObjectives: string[],
    language: string = 'pt-BR'
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
    const prompt = language === 'pt-BR' ? `
Ordene estas entradas bibliográficas para progressão ótima de aprendizagem:

Entradas:
${entries.map((e, i) => `${i + 1}. "${e.title}" (${e.year}) - ${e.type === 'book' ? 'livro' : e.type === 'article' ? 'artigo' : e.type}, ${e.readingLevel ? (e.readingLevel === 'beginner' ? 'iniciante' : e.readingLevel === 'intermediate' ? 'intermediário' : e.readingLevel === 'advanced' ? 'avançado' : 'acadêmico') : 'Nível desconhecido'}`).join('\n')}

Objetivos de aprendizagem:
${learningObjectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n')}

Crie uma ordem de leitura que:
1. Comece com textos fundamentais (como "O Homem e Seus Símbolos")
2. Construa complexidade gradualmente
3. Introduza fontes primárias em momentos apropriados
4. Termine com aplicações contemporâneas

Formato de resposta:
[3, 1, 5, 2, 4] (índices na ordem sugerida)
` : `
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