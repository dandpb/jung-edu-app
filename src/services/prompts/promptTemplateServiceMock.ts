/**
 * Mock implementation of prompt template service for when database tables don't exist yet
 * This allows the application to run while the database is being set up
 */

import { 
  PromptTemplate, 
  PromptVariable, 
  PromptTemplateVersion, 
  PromptCategory,
  PromptExecutionLog 
} from './promptTemplateService';

class PromptTemplateServiceMock {
  private templates: Map<string, PromptTemplate> = new Map();

  constructor() {
    this.initializeDefaultTemplates();
  }

  private initializeDefaultTemplates() {
    // Add default templates for all LLM generators
    const defaultTemplates: PromptTemplate[] = [
      // Content Generation Templates
      {
        id: 'default-content-intro',
        key: 'content.introduction',
        category: 'content',
        name: 'Introdução de Módulo',
        description: 'Template para gerar introduções de módulos educacionais',
        template: `Crie uma introdução envolvente para um módulo de psicologia junguiana sobre "{{topic}}".

Público-alvo: {{targetAudience}}

Objetivos de aprendizagem:
{{objectives}}

Requisitos:
- Prenda o leitor com uma abertura interessante
- Introduza brevemente os principais conceitos
- Explique por que este tópico é importante na psicologia junguiana
- Defina expectativas para o que os estudantes aprenderão
- Mantenha entre {{minWords}}-{{maxWords}} palavras
- IMPORTANTE: Escreva TODO o conteúdo em português brasileiro (pt-BR)

Formate usando Markdown:
- Use **negrito** para enfatizar conceitos-chave
- Use *itálico* para ênfase sutil
- Inclua um parágrafo de abertura atraente
- Estruture com parágrafos claros`,
        variables: [
          { name: 'topic', type: 'text', description: 'Tópico do módulo', required: true },
          { name: 'targetAudience', type: 'text', description: 'Público-alvo', required: true, defaultValue: 'intermediate' },
          { name: 'objectives', type: 'text', description: 'Objetivos de aprendizagem', required: false },
          { name: 'minWords', type: 'number', description: 'Mínimo de palavras', required: false, defaultValue: 200 },
          { name: 'maxWords', type: 'number', description: 'Máximo de palavras', required: false, defaultValue: 300 }
        ],
        language: 'pt-BR',
        isActive: true,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'default-content-section',
        key: 'content.section',
        category: 'content',
        name: 'Seção de Conteúdo',
        description: 'Template para gerar seções detalhadas de conteúdo',
        template: `Escreva conteúdo detalhado para a seção "{{sectionTitle}}" em um módulo de psicologia junguiana sobre "{{mainTopic}}".

Público-alvo: {{targetAudience}}
{{#if usesSimpleLanguage}}Use linguagem simples e acessível para iniciantes.{{/if}}

{{#if learningObjectives}}
Objetivos de aprendizagem específicos:
{{learningObjectives}}
{{/if}}

{{#if prerequisites}}
Pré-requisitos:
{{prerequisites}}
{{/if}}

Conceitos-chave a cobrir:
{{concepts}}

Requisitos:
- Explique conceitos claramente com exemplos
- Inclua terminologia junguiana relevante
- Use metáforas ou analogias quando útil
- Referencie o trabalho original de Jung quando aplicável
- Inclua aplicações práticas ou exercícios
- Busque {{targetWords}} palavras
- IMPORTANTE: Escreva TODO o conteúdo em português brasileiro (pt-BR)

Formate usando Markdown:
- Use ## para subtítulos
- Use **negrito** para termos importantes
- Use listas quando apropriado
- Inclua citações relevantes quando possível`,
        variables: [
          { name: 'sectionTitle', type: 'text', description: 'Título da seção', required: true },
          { name: 'mainTopic', type: 'text', description: 'Tópico principal do módulo', required: true },
          { name: 'targetAudience', type: 'text', description: 'Público-alvo', required: true },
          { name: 'usesSimpleLanguage', type: 'boolean', description: 'Usar linguagem simples', required: false, defaultValue: false },
          { name: 'learningObjectives', type: 'text', description: 'Objetivos de aprendizagem', required: false },
          { name: 'prerequisites', type: 'text', description: 'Pré-requisitos', required: false },
          { name: 'concepts', type: 'text', description: 'Conceitos-chave', required: true },
          { name: 'targetWords', type: 'text', description: 'Número de palavras alvo', required: false, defaultValue: '400-600' }
        ],
        language: 'pt-BR',
        isActive: true,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // Quiz Generation Templates
      {
        id: 'default-quiz-questions',
        key: 'quiz.questions',
        category: 'quiz',
        name: 'Questões de Quiz',
        description: 'Template para gerar questões de múltipla escolha',
        template: `Gere exatamente {{count}} questões de múltipla escolha para um quiz de psicologia junguiana sobre "{{topic}}".

Objetivos de aprendizagem a avaliar:
{{objectives}}

{{#if contentSummary}}
Contexto do conteúdo:
{{contentSummary}}
{{/if}}

Requisitos para cada questão:
- Teste compreensão real, não apenas memorização
- Inclua 4 opções de resposta (A, B, C, D)
- Apenas uma resposta correta por questão
- Forneça uma explicação detalhada para a resposta correta
- Varie os níveis de dificuldade
- IMPORTANTE: Escreva TODAS as questões, opções e explicações em português brasileiro (pt-BR)

Formate cada questão como um objeto JSON:
{
  "question": "texto da pergunta",
  "options": {
    "A": "opção A",
    "B": "opção B",
    "C": "opção C",
    "D": "opção D"
  },
  "correct": "letra da resposta correta",
  "explanation": "explicação detalhada"
}`,
        variables: [
          { name: 'count', type: 'number', description: 'Número de questões', required: true, defaultValue: 10 },
          { name: 'topic', type: 'text', description: 'Tópico do quiz', required: true },
          { name: 'objectives', type: 'text', description: 'Objetivos de aprendizagem', required: false },
          { name: 'contentSummary', type: 'text', description: 'Resumo do conteúdo', required: false }
        ],
        language: 'pt-BR',
        isActive: true,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // Mind Map Generation Templates
      {
        id: 'default-mindmap-structure',
        key: 'mindmap.structure',
        category: 'mindmap',
        name: 'Estrutura de Mapa Mental',
        description: 'Template para gerar estruturas de mapas mentais',
        template: `Crie uma estrutura de mapa mental {{style}} para "{{topic}}" em psicologia junguiana com {{depth}} níveis de profundidade.

Conceitos-chave a incluir: {{concepts}}

Requisitos:
- O nó central deve ser "{{topic}}"
- Cada ramo principal deve ter entre {{minBranches}}-{{maxBranches}} sub-ramos
- Use terminologia junguiana precisa
- Organize logicamente do geral para o específico
- Inclua conexões entre conceitos relacionados
- IMPORTANTE: Todos os rótulos devem estar em português brasileiro

Formate como estrutura hierárquica:
- Nó Central
  - Ramo Principal 1
    - Sub-ramo 1.1
      - Detalhe 1.1.1
    - Sub-ramo 1.2
  - Ramo Principal 2
    - Sub-ramo 2.1
    - Sub-ramo 2.2`,
        variables: [
          { name: 'topic', type: 'text', description: 'Tópico central', required: true },
          { name: 'depth', type: 'number', description: 'Níveis de profundidade', required: true, defaultValue: 3 },
          { name: 'style', type: 'text', description: 'Estilo do mapa', required: false, defaultValue: 'abrangente' },
          { name: 'concepts', type: 'text', description: 'Conceitos-chave', required: true },
          { name: 'minBranches', type: 'number', description: 'Mínimo de sub-ramos', required: false, defaultValue: 3 },
          { name: 'maxBranches', type: 'number', description: 'Máximo de sub-ramos', required: false, defaultValue: 5 }
        ],
        language: 'pt-BR',
        isActive: true,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // Video Generation Templates
      {
        id: 'default-video-search',
        key: 'video.search_queries',
        category: 'video',
        name: 'Queries de Busca de Vídeos',
        description: 'Template para gerar queries de busca no YouTube',
        template: `Gere exatamente {{queryCount}} queries de busca do YouTube para encontrar vídeos educacionais sobre "{{topic}}" em psicologia junguiana.

{{#if targetAudience}}
Público-alvo: {{targetAudience}}
{{/if}}

Conceitos-chave a cobrir:
{{concepts}}

Requisitos para as queries:
- Varie entre termos específicos e gerais
- Inclua nomes de psicólogos junguianos conhecidos quando relevante
- Adicione termos como "aula", "palestra", "explicação"
- Inclua variações em português e inglês
- IMPORTANTE: As queries devem incluir termos em português (legendado, português, Brasil)

Formate cada query em uma linha separada:
1. query 1
2. query 2
3. query 3`,
        variables: [
          { name: 'queryCount', type: 'number', description: 'Número de queries', required: true, defaultValue: 8 },
          { name: 'topic', type: 'text', description: 'Tópico dos vídeos', required: true },
          { name: 'concepts', type: 'text', description: 'Conceitos-chave', required: true },
          { name: 'targetAudience', type: 'text', description: 'Público-alvo', required: false }
        ],
        language: 'pt-BR',
        isActive: true,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // Bibliography Generation Templates
      {
        id: 'default-bibliography-resources',
        key: 'bibliography.resources',
        category: 'bibliography',
        name: 'Recursos Bibliográficos',
        description: 'Template para gerar lista de recursos educacionais',
        template: `Gere {{count}} recursos educacionais sobre "{{topic}}" em psicologia junguiana com LINKS ACESSÍVEIS.

Conceitos-chave: {{concepts}}
Nível: {{level}}

Tipos de recursos a incluir:
{{resourceTypes}}

Requisitos:
- Priorize recursos em português ou com tradução disponível
- Inclua uma variedade de tipos de mídia
- Forneça links reais e acessíveis quando possível
- Para livros, inclua ISBN quando disponível
- Ordene por relevância e acessibilidade
- IMPORTANTE: Descreva cada recurso em português brasileiro

Formate cada recurso como:
**Título do Recurso**
- Tipo: [tipo de recurso]
- Autor(es): [nomes]
- Ano: [ano]
- Descrição: [breve descrição]
- Link/Acesso: [URL ou forma de acesso]
- Relevância: [por que é útil para este tópico]`,
        variables: [
          { name: 'count', type: 'number', description: 'Número de recursos', required: true, defaultValue: 10 },
          { name: 'topic', type: 'text', description: 'Tópico dos recursos', required: true },
          { name: 'concepts', type: 'text', description: 'Conceitos-chave', required: true },
          { name: 'level', type: 'text', description: 'Nível de dificuldade', required: true, defaultValue: 'intermediário' },
          { name: 'resourceTypes', type: 'text', description: 'Tipos de recursos', required: false, defaultValue: 'livros digitais, artigos acadêmicos, vídeos, cursos online, podcasts' }
        ],
        language: 'pt-BR',
        isActive: true,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.key, template);
    });
  }

  async getTemplates(category?: string): Promise<PromptTemplate[]> {
    const templates = Array.from(this.templates.values());
    if (category) {
      return templates.filter(t => t.category === category);
    }
    return templates;
  }

  async getTemplateByKey(key: string): Promise<PromptTemplate | null> {
    return this.templates.get(key) || null;
  }

  async createTemplate(template: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<PromptTemplate> {
    const newTemplate: PromptTemplate = {
      ...template,
      id: `template-${Date.now()}`,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.templates.set(newTemplate.key, newTemplate);
    return newTemplate;
  }

  async updateTemplate(id: string, updates: Partial<PromptTemplate>): Promise<PromptTemplate> {
    const template = Array.from(this.templates.values()).find(t => t.id === id);
    if (!template) {
      throw new Error('Template not found');
    }
    
    const updatedTemplate = {
      ...template,
      ...updates,
      updatedAt: new Date(),
      version: template.version + 1
    };
    
    this.templates.set(template.key, updatedTemplate);
    return updatedTemplate;
  }

  async deleteTemplate(id: string): Promise<void> {
    const template = Array.from(this.templates.values()).find(t => t.id === id);
    if (template) {
      this.templates.delete(template.key);
    }
  }

  async getTemplateVersions(templateId: string): Promise<PromptTemplateVersion[]> {
    // Mock implementation - return empty array
    return [];
  }

  async rollbackToVersion(templateId: string, versionId: string): Promise<PromptTemplate> {
    const template = Array.from(this.templates.values()).find(t => t.id === templateId);
    if (!template) {
      throw new Error('Template not found');
    }
    return template;
  }

  async getCategories(): Promise<PromptCategory[]> {
    return [
      { id: '1', key: 'content', name: 'Content Generation', description: 'Prompts for generating module content', icon: '📚', color: '#8B5CF6', displayOrder: 1 },
      { id: '2', key: 'quiz', name: 'Quiz Generation', description: 'Prompts for creating quizzes', icon: '❓', color: '#3B82F6', displayOrder: 2 },
      { id: '3', key: 'mindmap', name: 'Mind Map Generation', description: 'Prompts for mind maps', icon: '🗺️', color: '#10B981', displayOrder: 3 },
      { id: '4', key: 'video', name: 'Video Curation', description: 'Prompts for videos', icon: '🎥', color: '#F59E0B', displayOrder: 4 },
      { id: '5', key: 'bibliography', name: 'Bibliography Generation', description: 'Prompts for references', icon: '📖', color: '#EC4899', displayOrder: 5 }
    ];
  }

  async logExecution(
    templateId: string,
    inputVariables: Record<string, any>,
    responseTimeMs: number,
    tokenCount?: number,
    success: boolean = true,
    errorMessage?: string
  ): Promise<void> {
    // Mock implementation - just log to console
    console.log('Prompt execution logged:', { templateId, responseTimeMs, success });
  }

  async getExecutionStats(templateId: string, days: number = 30): Promise<{
    totalExecutions: number;
    averageResponseTime: number;
    successRate: number;
    averageTokens: number;
  }> {
    // Mock implementation - return dummy stats
    return {
      totalExecutions: 0,
      averageResponseTime: 0,
      successRate: 100,
      averageTokens: 0
    };
  }

  compilePrompt(template: string, variables: Record<string, any>): string {
    let compiled = template;

    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      let replacementValue = value;

      if (Array.isArray(value)) {
        replacementValue = value.join(', ');
      } else if (typeof value === 'object' && value !== null) {
        replacementValue = JSON.stringify(value, null, 2);
      }

      compiled = compiled.replace(placeholder, String(replacementValue));
    });

    return compiled;
  }

  validateVariables(template: PromptTemplate, variables: Record<string, any>): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    template.variables.forEach(varDef => {
      const value = variables[varDef.name];

      if (varDef.required && (value === undefined || value === null || value === '')) {
        errors.push(`Variable '${varDef.name}' is required`);
        return;
      }

      if (!varDef.required && (value === undefined || value === null)) {
        return;
      }

      if (varDef.type === 'number' && typeof value !== 'number') {
        errors.push(`Variable '${varDef.name}' must be a number`);
      }
      if (varDef.type === 'array' && !Array.isArray(value)) {
        errors.push(`Variable '${varDef.name}' must be an array`);
      }
      if (varDef.type === 'boolean' && typeof value !== 'boolean') {
        errors.push(`Variable '${varDef.name}' must be a boolean`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Export a singleton instance
export const promptTemplateServiceMock = new PromptTemplateServiceMock();