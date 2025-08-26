/**
 * Quiz Prompt Service
 * Centralizes all quiz generation prompts using the admin prompt system
 */

import { promptTemplateServiceMock } from '../prompts/promptTemplateServiceMock';
import { PromptTemplate } from '../prompts/promptTemplateService';

export interface QuizPromptConfig {
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  concepts: string[];
  objectives?: string[];
  count?: number;
  userLevel?: 'beginner' | 'intermediate' | 'advanced';
}

export class QuizPromptService {
  private promptService = promptTemplateServiceMock;

  /**
   * Get template for concept identification questions
   */
  async getConceptIdentificationPrompt(
    concept: string,
    definition: string,
    misconception: string,
    distinction: string
  ): Promise<string> {
    const template = await this.promptService.getTemplateByKey('quiz.concept_identification');
    if (!template) {
      throw new Error('Template quiz.concept_identification not found');
    }

    return this.promptService.compilePrompt(template.template, {
      concept,
      definition,
      misconception,
      distinction
    });
  }

  /**
   * Get template for archetype analysis questions
   */
  async getArchetypeAnalysisPrompt(
    scenario: string,
    archetype: string,
    keyFeatures: string,
    evidence: string
  ): Promise<string> {
    const template = await this.promptService.getTemplateByKey('quiz.archetype_analysis');
    if (!template) {
      throw new Error('Template quiz.archetype_analysis not found');
    }

    return this.promptService.compilePrompt(template.template, {
      scenario,
      archetype,
      key_features: keyFeatures,
      evidence
    });
  }

  /**
   * Get template for psychological type questions
   */
  async getPsychologicalTypePrompt(
    behavior: string,
    type: string,
    dominantFunction: string,
    behaviors: string,
    cognitiveProcess: string
  ): Promise<string> {
    const template = await this.promptService.getTemplateByKey('quiz.psychological_type');
    if (!template) {
      throw new Error('Template quiz.psychological_type not found');
    }

    return this.promptService.compilePrompt(template.template, {
      behavior,
      type,
      function: dominantFunction,
      behaviors,
      cognitive_process: cognitiveProcess
    });
  }

  /**
   * Get template for dream interpretation questions
   */
  async getDreamInterpretationPrompt(
    symbol: string,
    meaning: string
  ): Promise<string> {
    const template = await this.promptService.getTemplateByKey('quiz.dream_interpretation');
    if (!template) {
      throw new Error('Template quiz.dream_interpretation not found');
    }

    return this.promptService.compilePrompt(template.template, {
      symbol,
      meaning
    });
  }

  /**
   * Get template for individuation process questions
   */
  async getIndividuationPrompt(
    situation: string,
    aspects: string,
    stages: string,
    specificStage: string
  ): Promise<string> {
    const template = await this.promptService.getTemplateByKey('quiz.individuation_process');
    if (!template) {
      throw new Error('Template quiz.individuation_process not found');
    }

    return this.promptService.compilePrompt(template.template, {
      situation,
      aspects,
      stages,
      specific_stage: specificStage
    });
  }

  /**
   * Get template for shadow work questions
   */
  async getShadowWorkPrompt(
    context: string,
    unconsciousContent: string,
    specificExample: string,
    evidence: string
  ): Promise<string> {
    const template = await this.promptService.getTemplateByKey('quiz.shadow_work');
    if (!template) {
      throw new Error('Template quiz.shadow_work not found');
    }

    return this.promptService.compilePrompt(template.template, {
      context,
      unconscious_content: unconsciousContent,
      specific_example: specificExample,
      evidence
    });
  }

  /**
   * Get template for generating quiz questions by difficulty
   */
  async getQuizGenerationPrompt(config: QuizPromptConfig): Promise<string> {
    // Determine which difficulty template to use based on user level
    const templateKey = config.userLevel === 'beginner' 
      ? 'quiz.difficulty_beginner'
      : config.userLevel === 'advanced'
      ? 'quiz.difficulty_advanced'
      : 'quiz.difficulty_intermediate';

    const template = await this.promptService.getTemplateByKey(templateKey);
    
    // Fallback to general quiz template if specific difficulty not found
    if (!template) {
      const fallbackTemplate = await this.promptService.getTemplateByKey('quiz.questions');
      if (!fallbackTemplate) {
        throw new Error('No quiz template found');
      }
      
      return this.promptService.compilePrompt(fallbackTemplate.template, {
        count: config.count || 10,
        topic: config.topic,
        objectives: config.objectives?.join('\n') || '',
        contentSummary: `Conceitos: ${config.concepts.join(', ')}`
      });
    }

    return this.promptService.compilePrompt(template.template, {
      count: config.count || 10,
      topic: config.topic,
      concepts: config.concepts.join(', ')
    });
  }

  /**
   * Get template for generating distractor patterns
   */
  async getDistractorPrompt(
    concept: string,
    similarTheory?: string,
    oversimplification?: string,
    overgeneralization?: string,
    commonMisconception?: string
  ): Promise<string> {
    const template = await this.promptService.getTemplateByKey('quiz.distractor_patterns');
    if (!template) {
      throw new Error('Template quiz.distractor_patterns not found');
    }

    return this.promptService.compilePrompt(template.template, {
      concept,
      similar_theory: similarTheory || '',
      oversimplification: oversimplification || '',
      overgeneralization: overgeneralization || '',
      common_misconception: commonMisconception || ''
    });
  }

  /**
   * Get template for generating explanations
   */
  async getExplanationPrompt(
    topic: string,
    correctExplanation: string,
    incorrectExplanations: string,
    keyInsight: string,
    practicalApplication: string,
    references?: string
  ): Promise<string> {
    const template = await this.promptService.getTemplateByKey('quiz.explanation_template');
    if (!template) {
      throw new Error('Template quiz.explanation_template not found');
    }

    return this.promptService.compilePrompt(template.template, {
      topic,
      correct_explanation: correctExplanation,
      incorrect_explanations: incorrectExplanations,
      key_insight: keyInsight,
      practical_application: practicalApplication,
      references: references || 'Não disponível'
    });
  }

  /**
   * Get appropriate question template based on topic and type
   */
  async getQuestionTemplateByTopic(
    topic: string,
    questionType: string
  ): Promise<PromptTemplate | null> {
    // Map topic to appropriate template key
    const topicMappings: Record<string, string[]> = {
      'sombra': ['quiz.shadow_work', 'quiz.concept_identification'],
      'shadow': ['quiz.shadow_work', 'quiz.concept_identification'],
      'anima': ['quiz.archetype_analysis', 'quiz.concept_identification'],
      'animus': ['quiz.archetype_analysis', 'quiz.concept_identification'],
      'arquétipos': ['quiz.archetype_analysis', 'quiz.concept_identification'],
      'archetypes': ['quiz.archetype_analysis', 'quiz.concept_identification'],
      'individuação': ['quiz.individuation_process', 'quiz.concept_identification'],
      'individuation': ['quiz.individuation_process', 'quiz.concept_identification'],
      'tipos psicológicos': ['quiz.psychological_type', 'quiz.concept_identification'],
      'psychological types': ['quiz.psychological_type', 'quiz.concept_identification'],
      'sonhos': ['quiz.dream_interpretation', 'quiz.concept_identification'],
      'dreams': ['quiz.dream_interpretation', 'quiz.concept_identification'],
      'inconsciente coletivo': ['quiz.concept_identification', 'quiz.archetype_analysis'],
      'collective unconscious': ['quiz.concept_identification', 'quiz.archetype_analysis']
    };

    const normalizedTopic = topic.toLowerCase();
    
    // Find matching template keys for the topic
    let templateKeys: string[] = [];
    for (const [key, values] of Object.entries(topicMappings)) {
      if (normalizedTopic.includes(key)) {
        templateKeys = values;
        break;
      }
    }

    // Default to concept identification if no specific match
    if (templateKeys.length === 0) {
      templateKeys = ['quiz.concept_identification'];
    }

    // Try to get the first available template
    for (const key of templateKeys) {
      const template = await this.promptService.getTemplateByKey(key);
      if (template) {
        return template;
      }
    }

    return null;
  }

  /**
   * Get all available quiz templates
   */
  async getAllQuizTemplates(): Promise<PromptTemplate[]> {
    return await this.promptService.getTemplates('quiz');
  }

  /**
   * Create a custom quiz template
   */
  async createCustomTemplate(
    name: string,
    description: string,
    templateContent: string,
    variables: Array<{ name: string; type: 'text' | 'number' | 'boolean' | 'array'; description: string; required: boolean }>
  ): Promise<PromptTemplate> {
    return await this.promptService.createTemplate({
      key: `quiz.custom_${Date.now()}`,
      category: 'quiz',
      name,
      description,
      template: templateContent,
      variables,
      language: 'pt-BR',
      isActive: true
    });
  }

  /**
   * Update an existing quiz template
   */
  async updateTemplate(
    templateId: string,
    updates: Partial<PromptTemplate>
  ): Promise<PromptTemplate> {
    return await this.promptService.updateTemplate(templateId, updates);
  }

  /**
   * Get Jung-specific concepts for a topic
   */
  getTopicConcepts(topic: string): string[] {
    const conceptMap: Record<string, string[]> = {
      'sombra': ['sombra', 'projeção', 'inconsciente pessoal', 'conteúdo reprimido', 'integração da sombra'],
      'anima': ['anima', 'alma feminina', 'imagem da alma', 'projeção da anima', 'estágios da anima'],
      'animus': ['animus', 'alma masculina', 'logos', 'projeção do animus', 'estágios do animus'],
      'inconsciente coletivo': ['inconsciente coletivo', 'arquétipos', 'padrões universais', 'imagens primordiais', 'herança psíquica'],
      'individuação': ['individuação', 'Self', 'totalidade', 'integração', 'eixo ego-Self'],
      'arquétipos': ['arquétipos', 'padrões universais', 'imagens primordiais', 'herói', 'grande mãe', 'velho sábio'],
      'tipos psicológicos': ['introversão/extroversão', 'pensamento/sentimento', 'sensação/intuição', 'função dominante', 'função inferior'],
      'sonhos': ['função compensatória', 'função prospectiva', 'símbolos', 'amplificação', 'imaginação ativa']
    };

    const normalizedTopic = topic.toLowerCase();
    
    for (const [key, concepts] of Object.entries(conceptMap)) {
      if (normalizedTopic.includes(key)) {
        return concepts;
      }
    }

    // Return general concepts if no specific match
    return ['inconsciente', 'arquétipos', 'individuação', 'sombra', 'anima', 'animus', 'Self', 'ego', 'persona'];
  }

  /**
   * Get common misconceptions for a topic
   */
  getTopicMisconceptions(topic: string): string[] {
    const misconceptionMap: Record<string, string[]> = {
      'sombra': ['A sombra é apenas negativa', 'A sombra deve ser eliminada', 'A sombra é o mesmo que o mal'],
      'anima': ['A anima é apenas atração romântica', 'A anima é fixa e imutável', 'A anima é um estereótipo de gênero'],
      'animus': ['O animus é apenas masculinidade', 'O animus é sempre negativo', 'O animus é determinado biologicamente'],
      'inconsciente coletivo': ['É o mesmo que inconsciente pessoal', 'É apenas cultural', 'É transmitido geneticamente'],
      'individuação': ['Individuação é individualismo', 'É um processo linear', 'Pode ser completado totalmente'],
      'arquétipos': ['Arquétipos são estereótipos', 'São conscientes', 'São aprendidos culturalmente']
    };

    const normalizedTopic = topic.toLowerCase();
    
    for (const [key, misconceptions] of Object.entries(misconceptionMap)) {
      if (normalizedTopic.includes(key)) {
        return misconceptions;
      }
    }

    return [];
  }
}

// Export singleton instance
export const quizPromptService = new QuizPromptService();