import { ILLMProvider } from '../provider';

export interface BibliographyEntry {
  id: string;
  type: 'book' | 'article' | 'chapter' | 'website' | 'video' | 'film' | 'interview' | 'lecture' | 'podcast' | 'course';
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
    const readingLevel = level === 'introductory' ? 'beginner' : level;
    
    const prompt = language === 'pt-BR' ? `
Gere ${count} recursos educacionais sobre "${topic}" em psicologia junguiana com LINKS ACESSÍVEIS.

Conceitos-chave: ${concepts.join(', ')}
Nível: ${level === 'introductory' ? 'introdutório' : level === 'intermediate' ? 'intermediário' : 'avançado'}

IMPORTANTE: 
- Cada recurso DEVE ter um URL funcional e acessível
- Priorize recursos em português ou com tradução disponível
- Inclua uma mistura de tipos: livros digitais, artigos acadêmicos, vídeos, cursos online, podcasts
- Para livros, prefira links para: Google Books, Amazon, Archive.org, sites de editoras
- Para artigos: SciELO, PePSIC, ResearchGate, Academia.edu, repositórios universitários
- Para vídeos: YouTube (aulas, palestras, documentários)
- Para cursos: Coursera, edX, plataformas educacionais

Foque em:
- Obras fundamentais de Jung traduzidas
- Comentadores brasileiros e latino-americanos
- Recursos didáticos e introdutórios
- Material audiovisual complementar
- Cursos e palestras online gratuitos

Formato de resposta (JSON):
[
  {
    "type": "book",
    "authors": ["Jung, Carl Gustav"],
    "title": "O Homem e Seus Símbolos",
    "year": 2016,
    "publisher": "Nova Fronteira",
    "url": "https://books.google.com.br/books?id=exemplo",
    "abstract": "Introdução acessível aos conceitos fundamentais da psicologia junguiana",
    "relevance": "Obra fundamental recomendada para iniciantes, escrita para o público geral",
    "jungianConcepts": ["arquétipos", "inconsciente coletivo", "símbolos"],
    "readingLevel": "beginner"
  }
]
` : `
Generate ${count} educational resources about "${topic}" in Jungian psychology with ACCESSIBLE LINKS.

Key concepts: ${concepts.join(', ')}
Level: ${level}

IMPORTANT:
- Each resource MUST have a functional and accessible URL
- Include a mix of types: digital books, academic articles, videos, online courses, podcasts
- For books: Google Books, Amazon, Archive.org, publisher sites
- For articles: JSTOR, PubMed, ResearchGate, Academia.edu, university repositories
- For videos: YouTube (lectures, documentaries)
- For courses: Coursera, edX, educational platforms

Focus on:
- Jung's fundamental works
- Contemporary Jungian scholars
- Educational and introductory resources
- Audiovisual materials
- Free online courses and lectures

Response format (JSON):
[
  {
    "type": "book",
    "authors": ["Jung, Carl Gustav"],
    "title": "Man and His Symbols",
    "year": 1964,
    "publisher": "Dell Publishing",
    "url": "https://archive.org/details/example",
    "abstract": "Accessible introduction to fundamental Jungian concepts",
    "relevance": "Essential introductory work written for general audience",
    "jungianConcepts": ["archetypes", "collective unconscious", "symbols"],
    "readingLevel": "beginner"
  }
]
`;

    // Define proper schema for the structured response
    const schema = {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: { 
            type: "string", 
            enum: ["book", "article", "chapter", "website", "video", "film", "interview", "lecture", "podcast", "course"] 
          },
          authors: { type: "array", items: { type: "string" } },
          title: { type: "string" },
          year: { type: "number" },
          publisher: { type: "string" },
          journal: { type: "string" },
          volume: { type: "string" },
          issue: { type: "string" },
          pages: { type: "string" },
          doi: { type: "string" },
          url: { type: "string" },
          abstract: { type: "string" },
          relevance: { type: "string" },
          jungianConcepts: { type: "array", items: { type: "string" } },
          readingLevel: { type: "string", enum: ["beginner", "intermediate", "advanced", "scholar"] }
        },
        required: ["type", "authors", "title", "year", "url", "relevance", "jungianConcepts"]
      }
    };

    let sources: Array<Omit<BibliographyEntry, 'id' | 'formattedCitation'>>;
    
    try {
      sources = await this.provider.generateStructuredResponse<Array<Omit<BibliographyEntry, 'id' | 'formattedCitation'>>>(
        prompt,
        schema,
        { temperature: 0.7 }
      );
    } catch (error) {
      console.error('Error generating bibliography:', error);
      return [];
    }

    // Ensure sources is an array
    if (!Array.isArray(sources)) {
      console.error('generateStructuredResponse did not return an array, got:', sources);
      return [];
    }

    // Add IDs and ensure reading level
    return sources.map((source, index) => ({
      id: `bib-${Date.now()}-${index}`,
      ...source,
      readingLevel: source.readingLevel || readingLevel as any,
      formattedCitation: undefined
    }));
  }

  async generateFilmSuggestions(
    topic: string,
    concepts: string[],
    count: number = 5,
    language: string = 'pt-BR'
  ): Promise<Array<{
    id: string;
    title: string;
    director: string;
    year: number;
    relevance: string;
    streamingUrl?: string;
    trailerUrl?: string;
    type: 'documentary' | 'fiction' | 'educational' | 'biographical';
  }>> {
    const prompt = language === 'pt-BR' ? `
Gere ${count} sugestões de filmes e documentários relacionados a "${topic}" em psicologia junguiana com LINKS PARA ASSISTIR.

Conceitos relacionados: ${concepts.join(', ')}

IMPORTANTE:
- Cada filme DEVE ter pelo menos um link (streaming ou trailer)
- Priorize filmes disponíveis em plataformas de streaming ou YouTube
- Inclua documentários educacionais sobre Jung e psicologia analítica
- Filmes que ilustrem conceitos junguianos (jornada do herói, sombra, anima/animus)
- Biografias e entrevistas com Jung

Tipos de links preferidos:
- YouTube (filmes completos, documentários)
- Netflix, Prime Video, HBO Max (se disponível)
- Vimeo (documentários educacionais)
- Sites educacionais com conteúdo gratuito

Formato de resposta (JSON):
[
  {
    "title": "A Sabedoria dos Sonhos",
    "director": "Stephen Segaller",
    "year": 1989,
    "type": "documentary",
    "relevance": "Documentário em 3 partes sobre a vida e obra de Jung, essencial para iniciantes",
    "streamingUrl": "https://www.youtube.com/watch?v=exemplo",
    "trailerUrl": "https://www.youtube.com/watch?v=trailer"
  }
]
` : `
Generate ${count} film and documentary suggestions related to "${topic}" in Jungian psychology with STREAMING LINKS.

Related concepts: ${concepts.join(', ')}

IMPORTANT:
- Each film MUST have at least one link (streaming or trailer)
- Prioritize films available on streaming platforms or YouTube
- Include educational documentaries about Jung and analytical psychology
- Films that illustrate Jungian concepts (hero's journey, shadow, anima/animus)
- Jung biographies and interviews

Preferred link types:
- YouTube (full films, documentaries)
- Netflix, Prime Video, HBO Max (if available)
- Vimeo (educational documentaries)
- Educational sites with free content

Response format (JSON):
[
  {
    "title": "The Wisdom of the Dream",
    "director": "Stephen Segaller",
    "year": 1989,
    "type": "documentary",
    "relevance": "3-part documentary about Jung's life and work, essential for beginners",
    "streamingUrl": "https://www.youtube.com/watch?v=example",
    "trailerUrl": "https://www.youtube.com/watch?v=trailer"
  }
]
`;

    const schema = {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          director: { type: "string" },
          year: { type: "number" },
          type: { type: "string", enum: ["documentary", "fiction", "educational", "biographical"] },
          relevance: { type: "string" },
          streamingUrl: { type: "string" },
          trailerUrl: { type: "string" }
        },
        required: ["title", "director", "year", "type", "relevance"]
      }
    };

    let films: Array<any>;
    
    try {
      films = await this.provider.generateStructuredResponse<Array<any>>(
        prompt,
        schema,
        { temperature: 0.7 }
      );
    } catch (error) {
      console.error('Error generating film suggestions:', error);
      return [];
    }

    if (!Array.isArray(films)) {
      console.error('generateStructuredResponse did not return an array for films, got:', films);
      return [];
    }

    // Add IDs and ensure at least one URL exists
    return films
      .filter(film => film.streamingUrl || film.trailerUrl)
      .map((film, index) => ({
        id: `film-${Date.now()}-${index}`,
        ...film
      }));
  }

  async formatCitation(entry: BibliographyEntry, style: 'APA' | 'MLA' | 'Chicago' = 'APA', language: string = 'pt-BR'): Promise<string> {
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
Link: ${entry.url}

Áreas de foco para anotação: ${focusAreas.join(', ')}

A anotação deve:
1. Resumir os principais argumentos ou descobertas
2. Avaliar a credibilidade e contribuição da fonte
3. Explicar como se relaciona com as áreas de foco
4. Mencionar como acessar o recurso (se está disponível gratuitamente, etc.)

Escreva em português brasileiro.
` : `
Write a 150-200 word annotation for this source about "${entry.title}" by ${entry.authors.join(', ')}.

Abstract: ${entry.abstract}
Relevance: ${entry.relevance}
Link: ${entry.url}

Focus areas for annotation: ${focusAreas.join(', ')}

The annotation should:
1. Summarize the main arguments or findings
2. Evaluate the source's credibility and contribution
3. Explain how it relates to the focus areas
4. Mention how to access the resource (if freely available, etc.)
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
    // If entries have reading levels, order them automatically
    const hasReadingLevels = entries.every(e => e.readingLevel);
    
    if (hasReadingLevels) {
      const levelOrder = { 'beginner': 0, 'intermediate': 1, 'advanced': 2, 'scholar': 3 };
      
      // Sort by reading level first, then by year within each level
      return [...entries].sort((a, b) => {
        const levelDiff = levelOrder[a.readingLevel!] - levelOrder[b.readingLevel!];
        if (levelDiff !== 0) return levelDiff;
        
        // Within same level, put older foundational texts first
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
1. Comece com textos introdutórios e vídeos educacionais
2. Construa complexidade gradualmente
3. Alterne entre diferentes tipos de mídia
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
1. Starts with introductory texts and educational videos
2. Builds complexity gradually
3. Alternates between different media types
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
      return entries;
    }

    // Ensure order is an array
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
}