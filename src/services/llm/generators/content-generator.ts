import { ILLMProvider } from '../types';
import { ModuleContent } from '../../../types';

interface ModuleContentOptions {
  title?: string;
  topic?: string;
  objectives?: string[];
  learningObjectives?: string[];
  targetAudience?: string;
  difficulty?: string;
  duration?: number;
  concepts?: string[];
  prerequisites?: string[];
  language?: string;
}

export class ContentGenerator {
  constructor(private provider: ILLMProvider) {}

  async generateModuleContent(
    topicOrOptions: string | ModuleContentOptions,
    objectives?: string[],
    targetAudience?: string,
    duration?: number,
    language: string = 'pt-BR'
  ): Promise<ModuleContent> {
    let topic: string;
    let validObjectives: string[];
    let audience: string;
    let durationMinutes: number;
    let options: ModuleContentOptions | undefined;

    // Handle both parameter styles
    if (typeof topicOrOptions === 'object') {
      // Object parameter style (from tests)
      options = topicOrOptions;
      topic = options.title || options.topic || '';
      validObjectives = options.learningObjectives || options.objectives || [];
      audience = options.targetAudience || options.difficulty || 'intermediate';
      durationMinutes = options.duration || 60;
      
      // Validate required fields
      if (!topic || (options.concepts && options.concepts.length === 0)) {
        throw new Error('Title and concepts are required');
      }
    } else {
      // Individual parameters style (from orchestrator)
      topic = topicOrOptions;
      validObjectives = objectives || [];
      audience = targetAudience || 'intermediate';
      durationMinutes = duration || 60;
      options = undefined;
    }

    const lang = options?.language || language;
    const sections = await this.generateSections(topic, validObjectives, audience, durationMinutes, options, lang);
    
    const conclusion = await this.generateConclusion(topic, validObjectives, lang);
    const keyTakeaways = await this.generateKeyTakeaways(topic, validObjectives, sections, lang);
    
    return {
      introduction: await this.generateIntroduction(topic, validObjectives, audience, lang),
      sections,
      summary: await this.generateSummary(sections, lang),
      keyTakeaways,
    };
  }

  private async generateIntroduction(
    topic: string,
    objectives: string[],
    targetAudience: string,
    language: string = 'pt-BR'
  ): Promise<string> {
    const prompt = language === 'pt-BR' ? `
Crie uma introdução envolvente para um módulo de psicologia junguiana sobre "${topic}".

Público-alvo: ${targetAudience}

Objetivos de aprendizagem:
${objectives?.map((obj, i) => `${i + 1}. ${obj}`).join('\n') || 'Nenhum objetivo especificado'}

Requisitos:
- Prenda o leitor com uma abertura interessante
- Introduza brevemente os principais conceitos
- Explique por que este tópico é importante na psicologia junguiana
- Defina expectativas para o que os estudantes aprenderão
- Mantenha entre 200-300 palavras
- IMPORTANTE: Escreva TODO o conteúdo em português brasileiro (pt-BR)

Formate usando Markdown:
- Use **negrito** para enfatizar conceitos-chave
- Use *itálico* para ênfase sutil
- Inclua um parágrafo de abertura atraente
- Estruture com parágrafos claros
` : `
Create an engaging introduction for a Jungian psychology module on "${topic}".

Target audience: ${targetAudience}

Learning objectives:
${objectives?.map((obj, i) => `${i + 1}. ${obj}`).join('\n') || 'No objectives specified'}

Requirements:
- Hook the reader with an interesting opening
- Briefly introduce the main concepts
- Explain why this topic is important in Jungian psychology
- Set expectations for what students will learn
- Keep it between 200-300 words

Format using Markdown:
- Use **bold** for emphasis on key concepts
- Use *italics* for subtle emphasis
- Include a compelling opening paragraph
- Structure with clear paragraphs
`;

    const response = await this.provider.generateCompletion(prompt, {
      temperature: 0.7,
      maxTokens: 500,
    });
    return response.content;
  }

  private async generateSections(
    topic: string,
    objectives: string[],
    targetAudience: string,
    duration: number,
    options?: ModuleContentOptions,
    language: string = 'pt-BR'
  ): Promise<ModuleContent['sections']> {
    const validObjectives = objectives;
    // Calculate number of sections based on duration
    const sectionCount = Math.max(3, Math.min(8, Math.floor(duration / 15)));
    
    const structurePrompt = language === 'pt-BR' ? `Crie um esboço detalhado para um módulo de psicologia junguiana sobre "${topic}".

Público-alvo: ${targetAudience}
Duração: ${duration} minutos
Número de seções: ${sectionCount}

Objetivos de aprendizagem:
${objectives?.map((obj, i) => `${i + 1}. ${obj}`).join('\n') || 'Nenhum objetivo especificado'}

Crie exatamente ${sectionCount} seções principais que construam progressivamente o entendimento.

CRÍTICO: Você deve responder com um array JSON contendo exatamente ${sectionCount} objetos. Cada objeto deve ter:
- title: Um título descritivo da seção (string) - EM PORTUGUÊS
- concepts: Array de conceitos-chave a cobrir (array de strings) - EM PORTUGUÊS
- duration: Tempo estimado em minutos (number)

Formato de exemplo (responda exatamente com esta estrutura):
[
  {
    "title": "Entendendo os Fundamentos de ${topic}",
    "concepts": ["princípios fundamentais", "contexto histórico"],
    "duration": ${Math.floor(duration / sectionCount)}
  },
  {
    "title": "Conceitos Avançados em ${topic}",
    "concepts": ["teoria complexa", "aplicações práticas"],
    "duration": ${Math.ceil(duration / sectionCount)}
  }
]` : `Create a detailed outline for a Jungian psychology module on "${topic}".

Target audience: ${targetAudience}
Duration: ${duration} minutes
Number of sections: ${sectionCount}

Learning objectives:
${objectives?.map((obj, i) => `${i + 1}. ${obj}`).join('\n') || 'No objectives specified'}

Create exactly ${sectionCount} main sections that progressively build understanding.

CRITICAL: You must respond with a JSON array containing exactly ${sectionCount} objects. Each object must have:
- title: A descriptive section title (string)
- concepts: Array of key concepts to cover (array of strings)
- duration: Estimated time in minutes (number)

Example format (respond with exactly this structure):
[
  {
    "title": "Understanding the Basics of ${topic}",
    "concepts": ["fundamental principles", "historical context"],
    "duration": ${Math.floor(duration / sectionCount)}
  },
  {
    "title": "Advanced Concepts in ${topic}",
    "concepts": ["complex theory", "practical applications"],
    "duration": ${Math.ceil(duration / sectionCount)}
  }
]`;

    const schema = {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          concepts: { 
            type: "array",
            items: { type: "string" }
          },
          duration: { type: "number" }
        },
        required: ["title", "concepts", "duration"]
      }
    };

    let structure = await this.provider.generateStructuredOutput<Array<{
      title: string;
      concepts: string[];
      duration: number;
    }>>(structurePrompt, schema, { temperature: 0.2 });

    // Debug logging removed - structure generation working correctly
    
    if (!structure) {
      throw new Error('Failed to generate module structure: No structure returned');
    }
    
    if (!Array.isArray(structure)) {
      console.error('Structure is not an array:', structure);
      
      // Try to handle if structure is wrapped in an object
      if (typeof structure === 'object' && 'sections' in structure && Array.isArray((structure as any).sections)) {
        console.log('Found sections in structure object, using those');
        structure = (structure as any).sections;
      } else {
        console.warn('Using fallback structure generation due to invalid response');
        // Create a fallback structure
        structure = [
          {
            title: `Understanding ${topic}`,
            concepts: ['fundamental concepts', 'key principles'],
            duration: Math.floor(duration / 3)
          },
          {
            title: `${topic} in Practice`,
            concepts: ['practical applications', 'real-world examples'],
            duration: Math.floor(duration / 3)
          },
          {
            title: `Integration and Development`,
            concepts: ['personal development', 'psychological integration'],
            duration: Math.ceil(duration / 3)
          }
        ];
      }
    }

    // Generate content for each section
    const sections = await Promise.all(
      structure.map(async (section, index) => ({
        id: `section-${index + 1}`,
        title: section.title,
        content: await this.generateSectionContent(
          topic,
          section.title,
          section.concepts,
          targetAudience,
          options?.learningObjectives || validObjectives,
          options?.prerequisites,
          language
        ),
        order: index,
        subsections: [],
        media: [],
      }))
    );

    return sections;
  }

  private async generateSectionContent(
    mainTopic: string,
    sectionTitle: string,
    concepts: string[],
    targetAudience: string,
    learningObjectives?: string[],
    prerequisites?: string[],
    language: string = 'pt-BR'
  ): Promise<string> {
    let prompt = language === 'pt-BR' ? `
Escreva conteúdo detalhado para a seção "${sectionTitle}" em um módulo de psicologia junguiana sobre "${mainTopic}".

Público-alvo: ${targetAudience}` : `
Write detailed content for the section "${sectionTitle}" in a Jungian psychology module about "${mainTopic}".

Target audience: ${targetAudience}`;

    if (targetAudience.toLowerCase() === 'beginner') {
      prompt += language === 'pt-BR' ? '\nUse linguagem simples e evite jargão excessivamente técnico.' : '\nUse simple language and avoid overly technical jargon.';
    }

    if (learningObjectives && learningObjectives.length > 0) {
      prompt += language === 'pt-BR' ? '\n\nObjetivos de aprendizagem:\n' + learningObjectives.map(obj => `- ${obj}`).join('\n') : '\n\nLearning objectives:\n' + learningObjectives.map(obj => `- ${obj}`).join('\n');
    }

    if (prerequisites && prerequisites.length > 0) {
      prompt += language === 'pt-BR' ? '\n\nPré-requisitos:\n' + prerequisites.map(pre => `- ${pre}`).join('\n') : '\n\nPrerequisites:\n' + prerequisites.map(pre => `- ${pre}`).join('\n');
    }

    prompt += language === 'pt-BR' ? `

Conceitos-chave a cobrir:
${concepts && concepts.length > 0 ? concepts.map(c => `- ${c}`).join('\n') : '- Conceitos principais do tópico'}

Requisitos:
- Explique conceitos claramente com exemplos
- Inclua terminologia junguiana relevante
- Use metáforas ou analogias quando útil
- Referencie o trabalho original de Jung quando aplicável
- Inclua aplicações práticas ou exercícios
- Busque 400-600 palavras
- IMPORTANTE: Escreva TODO o conteúdo em português brasileiro (pt-BR)

IMPORTANTE: Formate o conteúdo usando Markdown:
- Use **negrito** para termos-chave e conceitos importantes
- Use *itálico* para ênfase
- Use listas numeradas (1. 2. 3.) para passos sequenciais
- Use pontos de lista (- ou *) para itens não sequenciais
- IMPORTANTE: Para listas, use o formato Markdown correto:
  - Para listas numeradas: "1. Item um" (com espaço após o ponto)
  - Para listas com marcadores: "- Item" ou "* Item" (com espaço após o marcador)
  - NÃO use "1." ou "•" em linhas separadas do conteúdo
- Adicione quebras de linha duplas entre parágrafos
- Use > para citações importantes de Jung
- Você pode usar ### para subtítulos dentro da seção
- Inclua links onde relevante: [texto](url)
- Escreva em um estilo claro e educacional
` : `

Key concepts to cover:
${concepts && concepts.length > 0 ? concepts.map(c => `- ${c}`).join('\n') : '- Main concepts of the topic'}

Requirements:
- Explain concepts clearly with examples
- Include relevant Jungian terminology
- Use metaphors or analogies when helpful
- Reference Jung's original work when applicable
- Include practical applications or exercises
- Aim for 400-600 words

IMPORTANT: Format the content using Markdown:
- Use **bold** for key terms and important concepts
- Use *italics* for emphasis
- Use numbered lists (1. 2. 3.) for sequential steps
- Use bullet points (- or *) for non-sequential items
- Add double line breaks between paragraphs
- Use > for important quotes from Jung
- You can use ### for subheadings within the section
- Include links where relevant: [text](url)
- Write in a clear, educational style
`;

    const response = await this.provider.generateCompletion(prompt, {
      temperature: 0.7,
      maxTokens: 800,
    });
    return response.content;
  }

  private async generateConclusion(topic: string, objectives: string[], language: string = 'pt-BR'): Promise<string> {
    const prompt = language === 'pt-BR' ? `
Escreva uma conclusão envolvente para um módulo de psicologia junguiana sobre "${topic}".

Objetivos de aprendizagem cobertos:
${objectives?.map((obj, i) => `${i + 1}. ${obj}`).join('\n') || 'Nenhum objetivo especificado'}

Requisitos:
- Resuma os principais aprendizados
- Conecte os conceitos de volta à teoria junguiana mais ampla
- Inspire exploração adicional
- Sugira aplicações práticas
- Mantenha entre 150-200 palavras
- IMPORTANTE: Escreva em português brasileiro (pt-BR)
` : `
Write a compelling conclusion for a Jungian psychology module on "${topic}".

Learning objectives covered:
${objectives?.map((obj, i) => `${i + 1}. ${obj}`).join('\n') || 'No objectives specified'}

Requirements:
- Summarize key takeaways
- Connect concepts back to broader Jungian theory
- Inspire further exploration
- Suggest practical applications
- Keep it between 150-200 words
`;

    const response = await this.provider.generateCompletion(prompt, {
      temperature: 0.7,
      maxTokens: 300,
    });
    return response.content;
  }

  private async generateSummary(sections: ModuleContent['sections'], language: string = 'pt-BR'): Promise<string> {
    const sectionTitles = sections.map(s => s.title).join(', ');
    
    const prompt = language === 'pt-BR' ? `
Crie um resumo conciso de um módulo de psicologia junguiana cobrindo estas seções: ${sectionTitles}.

Escreva um resumo de 100-150 palavras que capture os conceitos essenciais e suas relações.
Foque nos principais insights e aplicações práticas.
IMPORTANTE: Escreva em português brasileiro (pt-BR)
` : `
Create a concise summary of a Jungian psychology module covering these sections: ${sectionTitles}.

Write a 100-150 word summary that captures the essential concepts and their relationships.
Focus on the main insights and practical applications.
`;

    const response = await this.provider.generateCompletion(prompt, {
      temperature: 0.6,
      maxTokens: 200,
    });
    return response.content;
  }

  private async generateKeyTakeaways(
    topic: string,
    objectives: string[],
    sections: ModuleContent['sections'],
    language: string = 'pt-BR'
  ): Promise<string[]> {
    const sectionTitles = sections.map(s => s.title).join(', ');
    
    const prompt = language === 'pt-BR' ? `
Gere 5-7 principais aprendizados de um módulo de psicologia junguiana sobre "${topic}".

Objetivos de aprendizagem:
${objectives?.map((obj, i) => `${i + 1}. ${obj}`).join('\n') || 'Nenhum objetivo especificado'}

Seções cobertas: ${sectionTitles}

Forneça os aprendizados como um array JSON de strings. Cada aprendizado deve ser:
- Claro e conciso (1-2 frases)
- Acionável ou perspicaz
- Diretamente relacionado aos conceitos da psicologia junguiana
- IMPORTANTE: Escrito em português brasileiro (pt-BR)

Formato de exemplo: ["Aprendizado 1", "Aprendizado 2", ...]
` : `
Generate 5-7 key takeaways from a Jungian psychology module on "${topic}".

Learning objectives:
${objectives?.map((obj, i) => `${i + 1}. ${obj}`).join('\n') || 'No objectives specified'}

Sections covered: ${sectionTitles}

Provide the takeaways as a JSON array of strings. Each takeaway should be:
- Clear and concise (1-2 sentences)
- Actionable or insightful
- Directly related to Jungian psychology concepts

Example format: ["Takeaway 1", "Takeaway 2", ...]
`;

    const response = await this.provider.generateStructuredOutput<string[]>(
      prompt,
      [],
      { temperature: 0.7, maxTokens: 400 }
    );

    return response;
  }

  async generateConceptExplanation(
    concept: string,
    options: {
      context?: string;
      depth?: 'beginner' | 'intermediate' | 'advanced';
      includeExamples?: boolean;
      language?: string;
    } = {}
  ): Promise<{
    concept: string;
    definition?: string;
    explanation?: string;
    keyPoints?: string[];
    examples?: string[];
    relatedConcepts?: string[];
  }> {
    const { context = 'Jungian psychology', depth = 'intermediate', includeExamples = true, language = 'pt-BR' } = options;
    
    let prompt = language === 'pt-BR' 
      ? `Explique o conceito "${concept}" no contexto da ${context}.

Profundidade alvo: ${depth === 'beginner' ? 'iniciante' : depth === 'intermediate' ? 'intermediário' : 'avançado'}`
      : `Explain the concept "${concept}" in the context of ${context}.

Target depth: ${depth}`;

    if (depth === 'beginner') {
      prompt += language === 'pt-BR' 
        ? '\nUse linguagem simples e exemplos cotidianos.'
        : '\nUse simple language and everyday examples.';
    }

    if (includeExamples) {
      prompt += language === 'pt-BR'
        ? '\nInclua exemplos práticos para ilustrar o conceito.'
        : '\nInclude practical examples to illustrate the concept.';
    }
    
    if (language === 'pt-BR') {
      prompt += '\nIMPORTANTE: Responda em português brasileiro (pt-BR).';
    }

    const response = await this.provider.generateStructuredOutput<{
      concept: string;
      definition?: string;
      explanation?: string;
      keyPoints?: string[];
      examples?: string[];
      relatedConcepts?: string[];
    }>(prompt, {
      type: 'object',
      properties: {
        concept: { type: 'string' },
        definition: { type: 'string' },
        keyPoints: { type: 'array', items: { type: 'string' } },
        examples: { type: 'array', items: { type: 'string' } },
        relatedConcepts: { type: 'array', items: { type: 'string' } }
      },
      required: ['concept', 'definition', 'keyPoints', 'examples', 'relatedConcepts']
    });

    return response;
  }

  async enrichContent(
    content: string,
    options: {
      addExamples?: boolean;
      addExercises?: boolean;
      addMetaphors?: boolean;
      addVisualDescriptions?: boolean;
      culturalContext?: string;
      language?: string;
    } = {}
  ): Promise<{
    originalContent?: string;
    enrichedContent?: string;
    enrichments?: {
      examples?: string[];
      metaphors?: string[];
      practicalApplications?: string[];
      culturalReferences?: string[];
    };
    additions?: {
      examples?: string[];
      exercises?: string[];
      visualDescriptions?: string[];
    };
  }> {
    const { addExamples, addExercises, addMetaphors, addVisualDescriptions, culturalContext, language = 'pt-BR' } = options;
    
    let prompt = language === 'pt-BR' 
      ? `Enriqueça o seguinte conteúdo com elementos adicionais:

Conteúdo original:
${content}

Adições solicitadas:`
      : `Enrich the following content with additional elements:

Original content:
${content}

Requested additions:`;

    if (addExamples) prompt += language === 'pt-BR' ? '\n- Adicione exemplos práticos' : '\n- Add practical examples';
    if (addExercises) prompt += language === 'pt-BR' ? '\n- Adicione exercícios ou questões de reflexão' : '\n- Add exercises or reflection questions';
    if (addMetaphors) prompt += language === 'pt-BR' ? '\n- Adicione metáforas e analogias' : '\n- Add metaphors and analogies';
    if (addVisualDescriptions) prompt += language === 'pt-BR' ? '\n- Adicione descrições para recursos visuais ou diagramas' : '\n- Add descriptions for visual aids or diagrams';
    if (culturalContext) prompt += language === 'pt-BR' ? `\n- Adicione referências culturais relevantes para ${culturalContext}` : `\n- Add cultural references relevant to ${culturalContext}`;
    
    if (language === 'pt-BR') {
      prompt += '\nIMPORTANTE: Todo o conteúdo deve ser em português brasileiro (pt-BR).';
    }

    const response = await this.provider.generateStructuredOutput<{
      originalContent?: string;
      enrichedContent?: string;
      enrichments?: {
        examples?: string[];
        metaphors?: string[];
        practicalApplications?: string[];
        culturalReferences?: string[];
      };
      additions?: {
        examples?: string[];
        exercises?: string[];
        visualDescriptions?: string[];
      };
    }>(prompt, {
      type: 'object',
      properties: {
        enrichedContent: { type: 'string' },
        additions: {
          type: 'object',
          properties: {
            examples: { type: 'array', items: { type: 'string' } },
            exercises: { type: 'array', items: { type: 'string' } },
            visualDescriptions: { type: 'array', items: { type: 'string' } }
          }
        }
      },
      required: ['enrichedContent', 'additions']
    });

    return response;
  }

  async summarizeContent(
    content: string,
    options: {
      maxLength?: number;
      style?: 'academic' | 'casual' | 'bullet-points';
      preserveKeyTerms?: boolean;
      language?: string;
    } = {}
  ): Promise<{
    mainPoints?: string[];
    keyTakeaways?: string[];
    briefSummary?: string;
    summary?: string;
    keyPoints?: string[];
    wordCount?: number;
  }> {
    const { maxLength = 300, style = 'academic', preserveKeyTerms = true, language = 'pt-BR' } = options;
    
    const styleTranslation = {
      'academic': 'acadêmico',
      'casual': 'casual',
      'bullet-points': 'pontos de bala'
    };
    
    let prompt = language === 'pt-BR'
      ? `Resuma o seguinte conteúdo no estilo ${styleTranslation[style]}:

${content}

Requisitos:
- Máximo de ${maxLength} palavras
- Estilo: ${styleTranslation[style]}`
      : `Summarize the following content in ${style} style:

${content}

Requirements:
- Maximum ${maxLength} words
- Style: ${style}`;

    if (preserveKeyTerms) {
      prompt += language === 'pt-BR' 
        ? '\n- Preserve a terminologia junguiana chave'
        : '\n- Preserve key Jungian terminology';
    }
    
    if (language === 'pt-BR') {
      prompt += '\nIMPORTANTE: Escreva o resumo em português brasileiro (pt-BR).';
    }

    const response = await this.provider.generateStructuredOutput<{
      mainPoints?: string[];
      keyTakeaways?: string[];
      briefSummary?: string;
      summary?: string;
      keyPoints?: string[];
      wordCount?: number;
    }>(prompt, {
      type: 'object',
      properties: {
        summary: { type: 'string' },
        keyPoints: { type: 'array', items: { type: 'string' } },
        wordCount: { type: 'number' }
      },
      required: ['summary', 'keyPoints', 'wordCount']
    });

    return response;
  }

  async generateModuleContentStream(
    options: {
      title: string;
      concepts: string[];
      difficulty?: string;
      targetAudience?: string;
      duration?: number;
      learningObjectives?: string[];
      prerequisites?: string[];
      language?: string;
    },
    onChunk: (chunk: string) => void
  ): Promise<ModuleContent> {
    // Generate sections structure first
    const targetAudience = options.targetAudience || options.difficulty || 'intermediate';
    const duration = options.duration || 60;
    const language = options.language || 'pt-BR';
    const sections = await this.generateSections(
      options.title,
      options.learningObjectives || [],
      targetAudience,
      duration,
      options,
      language
    );
    
    // Stream introduction
    const introPrompt = language === 'pt-BR' ? `
Crie uma introdução envolvente para um módulo de psicologia junguiana sobre "${options.title}".

Público-alvo: ${targetAudience}

Objetivos de aprendizagem:
${options.learningObjectives?.map((obj, i) => `${i + 1}. ${obj}`).join('\n') || 'Nenhum objetivo especificado'}

Requisitos:
- Prenda o leitor com uma abertura interessante
- Introduza brevemente os principais conceitos
- Explique por que este tópico é importante na psicologia junguiana
- Defina expectativas para o que os estudantes aprenderão
- Mantenha entre 200-300 palavras
- IMPORTANTE: Escreva em português brasileiro (pt-BR)

Formate usando Markdown:
- Use **negrito** para enfatizar conceitos-chave
- Use *itálico* para ênfase sutil
- Inclua um parágrafo de abertura atraente
- Estruture com parágrafos claros
` : `
Create an engaging introduction for a Jungian psychology module on "${options.title}".

Target audience: ${targetAudience}

Learning objectives:
${options.learningObjectives?.map((obj, i) => `${i + 1}. ${obj}`).join('\n') || 'No objectives specified'}

Requirements:
- Hook the reader with an interesting opening
- Briefly introduce the main concepts
- Explain why this topic is important in Jungian psychology
- Set expectations for what students will learn
- Keep it between 200-300 words

Format using Markdown:
- Use **bold** for emphasis on key concepts
- Use *italics* for subtle emphasis
- Include a compelling opening paragraph
- Structure with clear paragraphs
`;

    let introduction = '';
    if ('streamCompletion' in this.provider && this.provider.streamCompletion) {
      await (this.provider as any).streamCompletion(introPrompt, (chunk: string) => {
        introduction += chunk;
        onChunk(chunk);
      }, {
        temperature: 0.7,
        maxTokens: 500,
      });
    } else {
      // Fallback to regular completion
      const response = await this.provider.generateCompletion(introPrompt, {
        temperature: 0.7,
        maxTokens: 500,
      });
      introduction = (response as any).content;
      onChunk(introduction);
    }
    
    // Stream each section content
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      
      // Add section header
      onChunk(`\n\n## ${section.title}\n\n`);
      
      const sectionPrompt = language === 'pt-BR' ? `
Escreva conteúdo detalhado para a seção "${section.title}" em um módulo de psicologia junguiana sobre "${options.title}".

Público-alvo: ${targetAudience}${targetAudience.toLowerCase() === 'beginner' ? '\nUse linguagem simples e evite jargão excessivamente técnico.' : ''}${options.learningObjectives && options.learningObjectives.length > 0 ? '\n\nObjetivos de aprendizagem:\n' + options.learningObjectives.map(obj => `- ${obj}`).join('\n') : ''}${options.prerequisites && options.prerequisites.length > 0 ? '\n\nPré-requisitos:\n' + options.prerequisites.map(pre => `- ${pre}`).join('\n') : ''}

Conceitos-chave a cobrir:
${(section as any).concepts?.map((c: string) => `- ${c}`).join('\n') || 'Nenhum conceito específico'}

Requisitos:
- Explique conceitos claramente com exemplos
- Inclua terminologia junguiana relevante
- Use metáforas ou analogias quando útil
- Referencie o trabalho original de Jung quando aplicável
- Inclua aplicações práticas ou exercícios
- Busque 400-600 palavras
- IMPORTANTE: Escreva em português brasileiro (pt-BR)

IMPORTANTE: Formate o conteúdo usando Markdown:
- Use **negrito** para termos-chave e conceitos importantes
- Use *itálico* para ênfase
- Use listas numeradas (1. 2. 3.) para passos sequenciais
- Use pontos de lista (- ou *) para itens não sequenciais
- IMPORTANTE: Para listas, use o formato Markdown correto:
  - Para listas numeradas: "1. Item um" (com espaço após o ponto)
  - Para listas com marcadores: "- Item" ou "* Item" (com espaço após o marcador)
  - NÃO use "1." ou "•" em linhas separadas do conteúdo
- Adicione quebras de linha duplas entre parágrafos
- Use > para citações importantes de Jung
- Você pode usar ### para subtítulos dentro da seção
- Inclua links onde relevante: [texto](url)
- Escreva em um estilo claro e educacional
` : `
Write detailed content for the section "${section.title}" in a Jungian psychology module about "${options.title}".

Target audience: ${targetAudience}${targetAudience.toLowerCase() === 'beginner' ? '\nUse simple language and avoid overly technical jargon.' : ''}${options.learningObjectives && options.learningObjectives.length > 0 ? '\n\nLearning objectives:\n' + options.learningObjectives.map(obj => `- ${obj}`).join('\n') : ''}${options.prerequisites && options.prerequisites.length > 0 ? '\n\nPrerequisites:\n' + options.prerequisites.map(pre => `- ${pre}`).join('\n') : ''}

Key concepts to cover:
${(section as any).concepts?.map((c: string) => `- ${c}`).join('\n') || 'No specific concepts'}

Requirements:
- Explain concepts clearly with examples
- Include relevant Jungian terminology
- Use metaphors or analogies when helpful
- Reference Jung's original work when applicable
- Include practical applications or exercises
- Aim for 400-600 words

IMPORTANT: Format the content using Markdown:
- Use **bold** for key terms and important concepts
- Use *italics* for emphasis
- Use numbered lists (1. 2. 3.) for sequential steps
- Use bullet points (- or *) for non-sequential items
- Add double line breaks between paragraphs
- Use > for important quotes from Jung
- You can use ### for subheadings within the section
- Include links where relevant: [text](url)
- Write in a clear, educational style
`;

      let sectionContent = '';
      if ('streamCompletion' in this.provider && this.provider.streamCompletion) {
        await (this.provider as any).streamCompletion(sectionPrompt, (chunk: string) => {
          sectionContent += chunk;
          onChunk(chunk);
        }, {
          temperature: 0.7,
          maxTokens: 800,
        });
      } else {
        // Fallback to regular completion
        const response = await this.provider.generateCompletion(sectionPrompt, {
          temperature: 0.7,
          maxTokens: 800,
        });
        sectionContent = (response as any).content;
        onChunk(sectionContent);
      }
      
      // Update section content
      sections[i].content = sectionContent;
    }
    
    // Generate summary and key takeaways
    const summary = await this.generateSummary(sections, language);
    const keyTakeaways = await this.generateKeyTakeaways(
      options.title,
      options.learningObjectives || [],
      sections,
      language
    );
    
    return {
      introduction,
      sections,
      summary,
      keyTakeaways,
    };
  }
}