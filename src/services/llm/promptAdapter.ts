import { promptTemplateService } from '../prompts/promptTemplateService';

/**
 * Adapter to integrate customizable prompts with LLM generators
 * This service bridges the prompt template system with the existing LLM infrastructure
 */
export class PromptAdapter {
  private static instance: PromptAdapter;
  private promptCache: Map<string, string> = new Map();
  private cacheExpiry: number = 10 * 60 * 1000; // 10 minutes
  private lastCacheUpdate: number = 0;

  private constructor() {}

  static getInstance(): PromptAdapter {
    if (!PromptAdapter.instance) {
      PromptAdapter.instance = new PromptAdapter();
    }
    return PromptAdapter.instance;
  }

  /**
   * Get a compiled prompt by key with variables
   */
  async getPrompt(key: string, variables: Record<string, any>): Promise<string> {
    const startTime = Date.now();
    let template = null;
    
    try {
      // Try to get the template from service
      template = await promptTemplateService.getTemplateByKey(key);
      
      if (!template) {
        console.warn(`Prompt template not found for key: ${key}, using fallback`);
        return this.getFallbackPrompt(key, variables);
      }

      // Validate variables
      const validation = promptTemplateService.validateVariables(template, variables);
      if (!validation.valid) {
        console.warn(`Variable validation failed for ${key}:`, validation.errors);
        // Continue with defaults for missing required variables
        const enrichedVariables = this.enrichVariablesWithDefaults(template.variables, variables);
        variables = enrichedVariables;
      }

      // Compile the prompt
      const compiledPrompt = promptTemplateService.compilePrompt(template.template, variables);

      // Log execution (async, don't wait)
      const responseTime = Date.now() - startTime;
      promptTemplateService.logExecution(
        template.id,
        variables,
        responseTime,
        undefined,
        true
      ).catch(err => console.error('Failed to log prompt execution:', err));

      return compiledPrompt;
    } catch (error) {
      console.error(`Error getting prompt for key ${key}:`, error);
      
      // Log failure (async, don't wait) - only if we have a template
      const responseTime = Date.now() - startTime;
      if (template?.id) {
        promptTemplateService.logExecution(
          template.id,
          variables,
          responseTime,
          undefined,
          false,
          (error as Error).message
        ).catch(err => console.error('Failed to log prompt execution error:', err));
      }

      return this.getFallbackPrompt(key, variables);
    }
  }

  /**
   * Get prompts for content generation
   */
  async getContentPrompts() {
    return {
      introduction: async (topic: string, objectives: string[], targetAudience: string, language: string = 'pt-BR') => {
        const objectivesText = objectives?.length > 0 
          ? objectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n')
          : 'Nenhum objetivo especificado';
        
        return this.getPrompt('content.introduction', {
          topic,
          targetAudience,
          objectives: objectivesText,
          minWords: 200,
          maxWords: 300
        });
      },

      section: async (
        mainTopic: string,
        sectionTitle: string,
        concepts: string[],
        targetAudience: string,
        learningObjectives?: string[],
        prerequisites?: string[],
        language: string = 'pt-BR'
      ) => {
        const conceptsText = concepts?.length > 0 
          ? concepts.map(c => `- ${c}`).join('\n')
          : '- Conceitos principais do tópico';
        
        const objectivesText = learningObjectives && learningObjectives.length > 0
          ? learningObjectives.map(obj => `- ${obj}`).join('\n')
          : '';
        
        const prerequisitesText = prerequisites && prerequisites.length > 0
          ? prerequisites.map(pre => `- ${pre}`).join('\n')
          : '';

        return this.getPrompt('content.section', {
          sectionTitle,
          mainTopic,
          targetAudience,
          usesSimpleLanguage: targetAudience.toLowerCase() === 'beginner',
          learningObjectives: objectivesText,
          prerequisites: prerequisitesText,
          concepts: conceptsText,
          targetWords: '400-600'
        });
      }
    };
  }

  /**
   * Get prompts for quiz generation
   */
  async getQuizPrompts() {
    return {
      questions: async (
        topic: string,
        content: string,
        objectives: string[],
        count: number,
        language: string = 'pt-BR'
      ) => {
        const objectivesText = objectives?.length > 0
          ? objectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n')
          : 'Compreensão geral do tópico';
        
        const contentSummary = content.substring(0, 1000) + '...';

        return this.getPrompt('quiz.questions', {
          count,
          topic,
          objectives: objectivesText,
          contentSummary
        });
      }
    };
  }

  /**
   * Get prompts for mind map generation
   */
  async getMindMapPrompts() {
    return {
      structure: async (
        topic: string,
        concepts: string[],
        depth: number,
        style: string,
        language: string = 'pt-BR'
      ) => {
        const conceptsText = concepts.join(', ');
        const styleText = style === 'comprehensive' ? 'abrangente' 
          : style === 'simplified' ? 'simplificado' 
          : 'analítico';

        return this.getPrompt('mindmap.structure', {
          topic,
          depth,
          style: styleText,
          concepts: conceptsText,
          minBranches: 3,
          maxBranches: 5
        });
      }
    };
  }

  /**
   * Get prompts for video generation
   */
  async getVideoPrompts() {
    return {
      searchQueries: async (
        topic: string,
        concepts: string[],
        targetAudience: string,
        language: string = 'pt-BR'
      ) => {
        const conceptsText = concepts.map(c => `- ${c}`).join('\n');

        return this.getPrompt('video.search_queries', {
          queryCount: 8,
          topic,
          concepts: conceptsText,
          targetAudience
        });
      }
    };
  }

  /**
   * Get prompts for bibliography generation
   */
  async getBibliographyPrompts() {
    return {
      resources: async (
        topic: string,
        concepts: string[],
        level: string,
        count: number,
        language: string = 'pt-BR'
      ) => {
        const conceptsText = concepts.join(', ');
        const levelText = level === 'introductory' ? 'introdutório' 
          : level === 'intermediate' ? 'intermediário' 
          : 'avançado';

        return this.getPrompt('bibliography.resources', {
          count,
          topic,
          concepts: conceptsText,
          level: levelText,
          resourceTypes: 'livros digitais, artigos acadêmicos, vídeos, cursos online, podcasts'
        });
      }
    };
  }

  /**
   * Enrich variables with defaults from template definition
   */
  private enrichVariablesWithDefaults(
    templateVariables: any[],
    providedVariables: Record<string, any>
  ): Record<string, any> {
    const enriched = { ...providedVariables };

    templateVariables.forEach(varDef => {
      if (enriched[varDef.name] === undefined || enriched[varDef.name] === null) {
        if (varDef.defaultValue !== undefined) {
          enriched[varDef.name] = varDef.defaultValue;
        } else if (varDef.required) {
          // Provide a reasonable default based on type
          switch (varDef.type) {
            case 'text':
              enriched[varDef.name] = '';
              break;
            case 'number':
              enriched[varDef.name] = 0;
              break;
            case 'array':
              enriched[varDef.name] = [];
              break;
            case 'boolean':
              enriched[varDef.name] = false;
              break;
          }
        }
      }
    });

    return enriched;
  }

  /**
   * Get fallback prompt when template is not found
   * These are the original hardcoded prompts as backup
   */
  private getFallbackPrompt(key: string, variables: Record<string, any>): string {
    const fallbackPrompts: Record<string, string> = {
      'content.introduction': `
Crie uma introdução envolvente para um módulo de psicologia junguiana sobre "${variables.topic}".

Público-alvo: ${variables.targetAudience}

Objetivos de aprendizagem:
${variables.objectives || 'Nenhum objetivo especificado'}

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
- Estruture com parágrafos claros`,

      'content.section': `
Escreva conteúdo detalhado para a seção "${variables.sectionTitle}" em um módulo de psicologia junguiana sobre "${variables.mainTopic}".

Público-alvo: ${variables.targetAudience}

Conceitos-chave a cobrir:
${variables.concepts}

Requisitos:
- Explique conceitos claramente com exemplos
- Inclua terminologia junguiana relevante
- Use metáforas ou analogias quando útil
- Referencie o trabalho original de Jung quando aplicável
- Inclua aplicações práticas ou exercícios
- Busque 400-600 palavras
- IMPORTANTE: Escreva TODO o conteúdo em português brasileiro (pt-BR)`,

      'quiz.questions': `
Gere exatamente ${variables.count || 10} questões de múltipla escolha para um quiz de psicologia junguiana sobre "${variables.topic}".

Objetivos de aprendizagem a avaliar:
${variables.objectives || 'Compreensão geral do tópico'}

IMPORTANTE: Escreva TODAS as questões, opções e explicações em português brasileiro (pt-BR).`,

      'mindmap.structure': `
Crie uma estrutura de mapa mental para "${variables.topic}" em psicologia junguiana com ${variables.depth || 3} níveis de profundidade.

Conceitos-chave a incluir: ${variables.concepts}

IMPORTANTE: Todos os rótulos devem estar em português brasileiro.`,

      'video.search_queries': `
Gere exatamente ${variables.queryCount || 8} queries de busca do YouTube para encontrar vídeos educacionais sobre "${variables.topic}" em psicologia junguiana.

Conceitos-chave a cobrir:
${variables.concepts}

IMPORTANTE: As queries devem incluir termos em português (legendado, português, Brasil)`,

      'bibliography.resources': `
Gere ${variables.count || 10} recursos educacionais sobre "${variables.topic}" em psicologia junguiana com LINKS ACESSÍVEIS.

Conceitos-chave: ${variables.concepts}
Nível: ${variables.level}

IMPORTANTE: Priorize recursos em português ou com tradução disponível.`
    };

    return fallbackPrompts[key] || `Prompt not found for key: ${key}`;
  }

  /**
   * Clear the prompt cache
   */
  clearCache(): void {
    this.promptCache.clear();
    this.lastCacheUpdate = 0;
  }
}

export const promptAdapter = PromptAdapter.getInstance();