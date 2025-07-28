/**
 * Content Analyzer for Automatic Quiz Generation
 * Analyzes educational content to extract key concepts, structure, and learning points
 */

import { ILLMProvider } from '../llm/types';
import { LLMProviderFactory } from '../llm/provider';

export interface ContentAnalysisResult {
  keyConcepts: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  cognitivelevels: string[];
  learningObjectives: string[];
  conceptRelationships: Array<{
    concept1: string;
    concept2: string;
    relationship: string;
  }>;
  potentialQuestionAreas: Array<{
    area: string;
    concepts: string[];
    suggestedQuestionTypes: string[];
    difficulty: string;
  }>;
  contentStructure: {
    mainTopics: string[];
    subtopics: string[];
    examples: string[];
    definitions: string[];
  };
  assessmentSuggestions: {
    recommendedQuestionCount: number;
    difficultyDistribution: { easy: number; medium: number; hard: number };
    questionTypeDistribution: { [key: string]: number };
  };
}

export class ContentAnalyzer {
  private provider: ILLMProvider;

  constructor(provider?: ILLMProvider) {
    this.provider = provider || LLMProviderFactory.getProvider();
  }

  /**
   * Main content analysis method
   */
  async analyzeContent(
    content: string,
    topic: string,
    language: 'pt-BR' | 'en' = 'pt-BR'
  ): Promise<ContentAnalysisResult> {
    console.log('🔍 Starting comprehensive content analysis...');

    // Run multiple analysis phases in parallel where possible
    const [
      conceptAnalysis,
      structureAnalysis,
      difficultyAssessment,
      questionAreaAnalysis
    ] = await Promise.all([
      this.analyzeKeyConcepts(content, topic, language),
      this.analyzeContentStructure(content, language),
      this.assessContentDifficulty(content, language),
      this.identifyQuestionAreas(content, topic, language)
    ]);

    // Generate relationships between concepts
    const conceptRelationships = await this.analyzeConceptRelationships(
      conceptAnalysis.concepts,
      topic,
      language
    );

    // Generate assessment suggestions based on analysis
    const assessmentSuggestions = this.generateAssessmentSuggestions(
      conceptAnalysis,
      structureAnalysis,
      difficultyAssessment
    );

    return {
      keyConcepts: conceptAnalysis.concepts,
      difficulty: difficultyAssessment.level,
      cognitivelevels: conceptAnalysis.cognitivelevels,
      learningObjectives: conceptAnalysis.objectives,
      conceptRelationships,
      potentialQuestionAreas: questionAreaAnalysis,
      contentStructure: structureAnalysis,
      assessmentSuggestions
    };
  }

  /**
   * Extract key concepts and cognitive levels from content
   */
  private async analyzeKeyConcepts(
    content: string,
    topic: string,
    language: 'pt-BR' | 'en'
  ): Promise<{
    concepts: string[];
    cognitivelevels: string[];
    objectives: string[];
  }> {
    const prompt = `
Analise o seguinte conteúdo educacional sobre "${topic}" e extraia:

1. Conceitos-chave principais (máximo 15)
2. Níveis cognitivos abordados (recordação, compreensão, aplicação, análise, síntese, avaliação)
3. Objetivos de aprendizagem implícitos (máximo 8)

Conteúdo:
${content.substring(0, 2000)}...

IMPORTANTE: Responda em JSON no formato:
{
  "concepts": ["conceito1", "conceito2", ...],
  "cognitivelevels": ["nível1", "nível2", ...],
  "objectives": ["objetivo1", "objetivo2", ...]
}
`;

    try {
      const result = await this.provider.generateStructuredOutput<{
        concepts: string[];
        cognitivelevels: string[];
        objectives: string[];
      }>(prompt, {
        type: "object",
        properties: {
          concepts: { type: "array", items: { type: "string" } },
          cognitivelevels: { type: "array", items: { type: "string" } },
          objectives: { type: "array", items: { type: "string" } }
        }
      });

      return result;
    } catch (error) {
      console.error('Error in concept analysis:', error);
      // Fallback analysis
      return this.generateFallbackConceptAnalysis(topic, language);
    }
  }

  /**
   * Analyze content structure
   */
  private async analyzeContentStructure(
    content: string,
    language: 'pt-BR' | 'en'
  ): Promise<{
    mainTopics: string[];
    subtopics: string[];
    examples: string[];
    definitions: string[];
  }> {
    const prompt = `
Analise a estrutura do seguinte conteúdo educacional e identifique:

1. Tópicos principais abordados
2. Subtópicos ou seções
3. Exemplos fornecidos
4. Definições apresentadas

Conteúdo:
${content.substring(0, 1500)}...

Responda em JSON:
{
  "mainTopics": ["tópico1", "tópico2", ...],
  "subtopics": ["subtópico1", "subtópico2", ...],
  "examples": ["exemplo1", "exemplo2", ...],
  "definitions": ["definição1", "definição2", ...]
}
`;

    try {
      return await this.provider.generateStructuredOutput(prompt, {
        type: "object",
        properties: {
          mainTopics: { type: "array", items: { type: "string" } },
          subtopics: { type: "array", items: { type: "string" } },
          examples: { type: "array", items: { type: "string" } },
          definitions: { type: "array", items: { type: "string" } }
        }
      });
    } catch (error) {
      console.error('Error in structure analysis:', error);
      return {
        mainTopics: ['Conceitos fundamentais', 'Aplicações práticas'],
        subtopics: ['Definições básicas', 'Exemplos', 'Teoria'],
        examples: ['Caso de estudo 1', 'Exemplo prático'],
        definitions: ['Definição principal', 'Conceitos relacionados']
      };
    }
  }

  /**
   * Assess content difficulty level
   */
  private async assessContentDifficulty(
    content: string,
    language: 'pt-BR' | 'en'
  ): Promise<{ level: 'beginner' | 'intermediate' | 'advanced'; reasons: string[] }> {
    const prompt = `
Avalie o nível de dificuldade do seguinte conteúdo educacional:

Critérios:
- Iniciante: Conceitos básicos, linguagem simples, muitos exemplos
- Intermediário: Conceitos moderados, algumas conexões complexas, aplicações
- Avançado: Conceitos complexos, análise profunda, síntese avançada

Conteúdo:
${content.substring(0, 1000)}...

Responda em JSON:
{
  "level": "beginner|intermediate|advanced",
  "reasons": ["razão1", "razão2", ...]
}
`;

    try {
      return await this.provider.generateStructuredOutput(prompt, {
        type: "object",
        properties: {
          level: { type: "string", enum: ["beginner", "intermediate", "advanced"] },
          reasons: { type: "array", items: { type: "string" } }
        }
      });
    } catch (error) {
      console.error('Error in difficulty assessment:', error);
      return {
        level: 'intermediate',
        reasons: ['Nível padrão assumido devido a erro de análise']
      };
    }
  }

  /**
   * Identify potential question areas
   */
  private async identifyQuestionAreas(
    content: string,
    topic: string,
    language: 'pt-BR' | 'en'
  ): Promise<Array<{
    area: string;
    concepts: string[];
    suggestedQuestionTypes: string[];
    difficulty: string;
  }>> {
    const prompt = `
Baseado no conteúdo sobre "${topic}", identifique áreas potenciais para questões de avaliação.

Para cada área, especifique:
1. Nome da área
2. Conceitos específicos que podem ser avaliados
3. Tipos de questão sugeridos (múltipla escolha, verdadeiro/falso, dissertativa, aplicação)
4. Nível de dificuldade (fácil, médio, difícil)

Conteúdo:
${content.substring(0, 1200)}...

Responda em JSON como array:
[
  {
    "area": "nome da área",
    "concepts": ["conceito1", "conceito2"],
    "suggestedQuestionTypes": ["tipo1", "tipo2"],
    "difficulty": "fácil|médio|difícil"
  }
]
`;

    try {
      const result = await this.provider.generateStructuredOutput<Array<{
        area: string;
        concepts: string[];
        suggestedQuestionTypes: string[];
        difficulty: string;
      }>>(prompt, {
        type: "array",
        items: {
          type: "object",
          properties: {
            area: { type: "string" },
            concepts: { type: "array", items: { type: "string" } },
            suggestedQuestionTypes: { type: "array", items: { type: "string" } },
            difficulty: { type: "string", enum: ["easy", "medium", "hard", "fácil", "médio", "difícil"] }
          }
        }
      });

      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error in question area analysis:', error);
      return [
        {
          area: 'Conceitos Fundamentais',
          concepts: ['definições básicas', 'princípios centrais'],
          suggestedQuestionTypes: ['múltipla escolha', 'verdadeiro/falso'],
          difficulty: 'médio'
        }
      ];
    }
  }

  /**
   * Analyze relationships between concepts
   */
  private async analyzeConceptRelationships(
    concepts: string[],
    topic: string,
    language: 'pt-BR' | 'en'
  ): Promise<Array<{
    concept1: string;
    concept2: string;
    relationship: string;
  }>> {
    if (concepts.length < 2) return [];

    const prompt = `
Analise as relações entre estes conceitos em "${topic}":
${concepts.slice(0, 10).join(', ')}

Identifique até 8 relações importantes entre os conceitos.
Tipos de relação: "parte de", "causa", "contrasta com", "complementa", "depende de", "exemplo de"

Responda em JSON:
[
  {
    "concept1": "conceito1",
    "concept2": "conceito2", 
    "relationship": "tipo de relação"
  }
]
`;

    try {
      const result = await this.provider.generateStructuredOutput<Array<{
        concept1: string;
        concept2: string;
        relationship: string;
      }>>(prompt, {
        type: "array",
        items: {
          type: "object",
          properties: {
            concept1: { type: "string" },
            concept2: { type: "string" },
            relationship: { type: "string" }
          }
        }
      });

      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error in relationship analysis:', error);
      return [];
    }
  }

  /**
   * Generate assessment suggestions based on analysis
   */
  private generateAssessmentSuggestions(
    conceptAnalysis: any,
    structureAnalysis: any,
    difficultyAssessment: any
  ): {
    recommendedQuestionCount: number;
    difficultyDistribution: { easy: number; medium: number; hard: number };
    questionTypeDistribution: { [key: string]: number };
  } {
    const conceptCount = conceptAnalysis.concepts.length;
    const difficulty = difficultyAssessment.level;

    // Determine question count based on content complexity
    let recommendedQuestionCount = Math.min(Math.max(conceptCount, 5), 15);

    // Adjust difficulty distribution based on content level
    let difficultyDistribution;
    switch (difficulty) {
      case 'beginner':
        difficultyDistribution = { easy: 0.5, medium: 0.4, hard: 0.1 };
        break;
      case 'advanced':
        difficultyDistribution = { easy: 0.1, medium: 0.4, hard: 0.5 };
        break;
      default: // intermediate
        difficultyDistribution = { easy: 0.2, medium: 0.6, hard: 0.2 };
    }

    // Suggest question type distribution
    const questionTypeDistribution = {
      'multiple-choice': 0.6,
      'true-false': 0.2,
      'short-answer': 0.15,
      'essay': 0.05
    };

    // Adjust for advanced content
    if (difficulty === 'advanced') {
      questionTypeDistribution['multiple-choice'] = 0.4;
      questionTypeDistribution['short-answer'] = 0.3;
      questionTypeDistribution['essay'] = 0.2;
      questionTypeDistribution['true-false'] = 0.1;
    }

    return {
      recommendedQuestionCount,
      difficultyDistribution,
      questionTypeDistribution
    };
  }

  /**
   * Fallback concept analysis when AI fails
   */
  private generateFallbackConceptAnalysis(
    topic: string,
    language: 'pt-BR' | 'en'
  ): {
    concepts: string[];
    cognitivelevels: string[];
    objectives: string[];
  } {
    const isPortuguese = language === 'pt-BR';
    
    return {
      concepts: [`Conceitos fundamentais de ${topic}`, 'Aplicações práticas', 'Teoria base', 'Exemplos', 'Definições'],
      cognitivelevels: ['compreensão', 'aplicação', 'análise'],
      objectives: [`Compreender os conceitos básicos de ${topic}`, `Aplicar conhecimentos de ${topic}`, 'Analisar casos práticos']
    };
  }

  /**
   * Quick content preview analysis for UI
   */
  async quickAnalysis(content: string, topic: string): Promise<{
    keyTopics: string[];
    estimatedDifficulty: string;
    suggestedQuestionCount: number;
  }> {
    // Simple heuristic analysis for quick feedback
    const words = content.split(/\s+/).length;
    const sentences = content.split(/[.!?]+/).length;
    const avgWordsPerSentence = words / sentences;

    // Estimate difficulty based on content metrics
    let estimatedDifficulty = 'intermediate';
    if (avgWordsPerSentence < 15 && words < 500) {
      estimatedDifficulty = 'beginner';
    } else if (avgWordsPerSentence > 25 || words > 1500) {
      estimatedDifficulty = 'advanced';
    }

    // Extract potential topics using keyword analysis
    const keyTopics = this.extractKeywordsHeuristic(content, topic);

    // Suggest question count based on content length
    const suggestedQuestionCount = Math.min(Math.max(Math.floor(words / 100), 5), 15);

    return {
      keyTopics,
      estimatedDifficulty,
      suggestedQuestionCount
    };
  }

  /**
   * Simple keyword extraction using heuristics
   */
  private extractKeywordsHeuristic(content: string, topic: string): string[] {
    const words = content.toLowerCase().split(/\s+/);
    const wordFreq: { [key: string]: number } = {};

    // Count word frequencies
    words.forEach(word => {
      const cleaned = word.replace(/[^\w]/g, '');
      if (cleaned.length > 3) {
        wordFreq[cleaned] = (wordFreq[cleaned] || 0) + 1;
      }
    });

    // Get top frequent words
    const topWords = Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([word]) => word);

    return topWords;
  }
}

// Export singleton instance
export const contentAnalyzer = new ContentAnalyzer();