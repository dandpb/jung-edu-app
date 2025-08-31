/**
 * Comprehensive Unit Tests for QuizPromptService
 * Covers all prompt generation methods, template management, and error handling
 */

import { QuizPromptService, quizPromptService, QuizPromptConfig } from '../quizPromptService';
import { promptTemplateServiceMock } from '../../prompts/promptTemplateServiceMock';
import { PromptTemplate } from '../../prompts/promptTemplateService';

// Mock the prompt template service
jest.mock('../../prompts/promptTemplateServiceMock');

const mockPromptTemplateService = promptTemplateServiceMock as jest.Mocked<typeof promptTemplateServiceMock>;

describe('QuizPromptService - Comprehensive Unit Tests', () => {
  let service: QuizPromptService;

  // Mock template data
  const mockTemplate: PromptTemplate = {
    id: 'template-1',
    key: 'quiz.concept_identification',
    category: 'quiz',
    name: 'Concept Identification',
    description: 'Template for concept identification questions',
    template: 'Create a question about {{concept}} with definition {{definition}}',
    variables: [
      { name: 'concept', type: 'text', description: 'The concept', required: true },
      { name: 'definition', type: 'text', description: 'The definition', required: true }
    ],
    language: 'pt-BR',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new QuizPromptService();
    
    // Setup default mock implementations
    mockPromptTemplateService.getTemplateByKey.mockResolvedValue(mockTemplate);
    mockPromptTemplateService.compilePrompt.mockResolvedValue('Compiled prompt text');
    mockPromptTemplateService.getTemplates.mockResolvedValue([mockTemplate]);
    mockPromptTemplateService.createTemplate.mockResolvedValue(mockTemplate);
    mockPromptTemplateService.updateTemplate.mockResolvedValue(mockTemplate);
  });

  describe('Constructor and Initialization', () => {
    it('should initialize with promptTemplateServiceMock', () => {
      expect(service).toBeDefined();
      expect(service['promptService']).toBe(promptTemplateServiceMock);
    });

    it('should export singleton instance', () => {
      expect(quizPromptService).toBeInstanceOf(QuizPromptService);
    });
  });

  describe('Concept Identification Prompts', () => {
    describe('getConceptIdentificationPrompt', () => {
      it('should generate concept identification prompt successfully', async () => {
        const result = await service.getConceptIdentificationPrompt(
          'shadow',
          'the hidden parts of personality',
          'shadow is evil',
          'shadow vs persona'
        );

        expect(result).toBe('Compiled prompt text');
        expect(mockPromptTemplateService.getTemplateByKey).toHaveBeenCalledWith('quiz.concept_identification');
        expect(mockPromptTemplateService.compilePrompt).toHaveBeenCalledWith(mockTemplate.template, {
          concept: 'shadow',
          definition: 'the hidden parts of personality',
          misconception: 'shadow is evil',
          distinction: 'shadow vs persona'
        });
      });

      it('should throw error when template not found', async () => {
        mockPromptTemplateService.getTemplateByKey.mockResolvedValue(null);

        await expect(service.getConceptIdentificationPrompt(
          'shadow', 'definition', 'misconception', 'distinction'
        )).rejects.toThrow('Template quiz.concept_identification not found');
      });

      it('should handle empty parameters', async () => {
        await service.getConceptIdentificationPrompt('', '', '', '');

        expect(mockPromptTemplateService.compilePrompt).toHaveBeenCalledWith(mockTemplate.template, {
          concept: '',
          definition: '',
          misconception: '',
          distinction: ''
        });
      });
    });
  });

  describe('Archetype Analysis Prompts', () => {
    describe('getArchetypeAnalysisPrompt', () => {
      it('should generate archetype analysis prompt successfully', async () => {
        mockPromptTemplateService.getTemplateByKey.mockResolvedValue({
          ...mockTemplate,
          key: 'quiz.archetype_analysis'
        });

        const result = await service.getArchetypeAnalysisPrompt(
          'dream scenario',
          'anima',
          'feminine aspects',
          'emotional responses'
        );

        expect(result).toBe('Compiled prompt text');
        expect(mockPromptTemplateService.getTemplateByKey).toHaveBeenCalledWith('quiz.archetype_analysis');
        expect(mockPromptTemplateService.compilePrompt).toHaveBeenCalledWith(mockTemplate.template, {
          scenario: 'dream scenario',
          archetype: 'anima',
          key_features: 'feminine aspects',
          evidence: 'emotional responses'
        });
      });

      it('should throw error when template not found', async () => {
        mockPromptTemplateService.getTemplateByKey.mockResolvedValue(null);

        await expect(service.getArchetypeAnalysisPrompt(
          'scenario', 'archetype', 'features', 'evidence'
        )).rejects.toThrow('Template quiz.archetype_analysis not found');
      });
    });
  });

  describe('Psychological Type Prompts', () => {
    describe('getPsychologicalTypePrompt', () => {
      it('should generate psychological type prompt successfully', async () => {
        mockPromptTemplateService.getTemplateByKey.mockResolvedValue({
          ...mockTemplate,
          key: 'quiz.psychological_type'
        });

        const result = await service.getPsychologicalTypePrompt(
          'introvert behavior',
          'INTJ',
          'thinking',
          'analytical behaviors',
          'dominant thinking process'
        );

        expect(result).toBe('Compiled prompt text');
        expect(mockPromptTemplateService.compilePrompt).toHaveBeenCalledWith(mockTemplate.template, {
          behavior: 'introvert behavior',
          type: 'INTJ',
          function: 'thinking',
          behaviors: 'analytical behaviors',
          cognitive_process: 'dominant thinking process'
        });
      });
    });
  });

  describe('Dream Interpretation Prompts', () => {
    describe('getDreamInterpretationPrompt', () => {
      it('should generate dream interpretation prompt successfully', async () => {
        mockPromptTemplateService.getTemplateByKey.mockResolvedValue({
          ...mockTemplate,
          key: 'quiz.dream_interpretation'
        });

        const result = await service.getDreamInterpretationPrompt(
          'water symbol',
          'unconscious emotions'
        );

        expect(result).toBe('Compiled prompt text');
        expect(mockPromptTemplateService.compilePrompt).toHaveBeenCalledWith(mockTemplate.template, {
          symbol: 'water symbol',
          meaning: 'unconscious emotions'
        });
      });
    });
  });

  describe('Individuation Process Prompts', () => {
    describe('getIndividuationPrompt', () => {
      it('should generate individuation prompt successfully', async () => {
        mockPromptTemplateService.getTemplateByKey.mockResolvedValue({
          ...mockTemplate,
          key: 'quiz.individuation_process'
        });

        const result = await service.getIndividuationPrompt(
          'midlife crisis',
          'personality aspects',
          'integration stages',
          'shadow integration'
        );

        expect(result).toBe('Compiled prompt text');
        expect(mockPromptTemplateService.compilePrompt).toHaveBeenCalledWith(mockTemplate.template, {
          situation: 'midlife crisis',
          aspects: 'personality aspects',
          stages: 'integration stages',
          specific_stage: 'shadow integration'
        });
      });
    });
  });

  describe('Shadow Work Prompts', () => {
    describe('getShadowWorkPrompt', () => {
      it('should generate shadow work prompt successfully', async () => {
        mockPromptTemplateService.getTemplateByKey.mockResolvedValue({
          ...mockTemplate,
          key: 'quiz.shadow_work'
        });

        const result = await service.getShadowWorkPrompt(
          'projection context',
          'repressed anger',
          'workplace conflict',
          'defensive behavior'
        );

        expect(result).toBe('Compiled prompt text');
        expect(mockPromptTemplateService.compilePrompt).toHaveBeenCalledWith(mockTemplate.template, {
          context: 'projection context',
          unconscious_content: 'repressed anger',
          specific_example: 'workplace conflict',
          evidence: 'defensive behavior'
        });
      });
    });
  });

  describe('Quiz Generation Prompts', () => {
    describe('getQuizGenerationPrompt', () => {
      const basicConfig: QuizPromptConfig = {
        topic: 'Jung Psychology',
        difficulty: 'medium',
        concepts: ['shadow', 'anima', 'animus'],
        count: 5
      };

      it('should generate beginner level quiz prompt', async () => {
        mockPromptTemplateService.getTemplateByKey
          .mockResolvedValueOnce({ ...mockTemplate, key: 'quiz.difficulty_beginner' });

        const config = { ...basicConfig, userLevel: 'beginner' as const };
        const result = await service.getQuizGenerationPrompt(config);

        expect(mockPromptTemplateService.getTemplateByKey).toHaveBeenCalledWith('quiz.difficulty_beginner');
        expect(mockPromptTemplateService.compilePrompt).toHaveBeenCalledWith(mockTemplate.template, {
          count: 5,
          topic: 'Jung Psychology',
          concepts: 'shadow, anima, animus'
        });
      });

      it('should generate advanced level quiz prompt', async () => {
        mockPromptTemplateService.getTemplateByKey
          .mockResolvedValueOnce({ ...mockTemplate, key: 'quiz.difficulty_advanced' });

        const config = { ...basicConfig, userLevel: 'advanced' as const };
        await service.getQuizGenerationPrompt(config);

        expect(mockPromptTemplateService.getTemplateByKey).toHaveBeenCalledWith('quiz.difficulty_advanced');
      });

      it('should default to intermediate level', async () => {
        mockPromptTemplateService.getTemplateByKey
          .mockResolvedValueOnce({ ...mockTemplate, key: 'quiz.difficulty_intermediate' });

        await service.getQuizGenerationPrompt(basicConfig);

        expect(mockPromptTemplateService.getTemplateByKey).toHaveBeenCalledWith('quiz.difficulty_intermediate');
      });

      it('should fallback to general template when specific difficulty not found', async () => {
        mockPromptTemplateService.getTemplateByKey
          .mockResolvedValueOnce(null) // difficulty template not found
          .mockResolvedValueOnce({ ...mockTemplate, key: 'quiz.questions' }); // fallback template

        const config = { ...basicConfig, objectives: ['learn shadow', 'understand anima'] };
        const result = await service.getQuizGenerationPrompt(config);

        expect(mockPromptTemplateService.getTemplateByKey).toHaveBeenCalledWith('quiz.difficulty_intermediate');
        expect(mockPromptTemplateService.getTemplateByKey).toHaveBeenCalledWith('quiz.questions');
        expect(mockPromptTemplateService.compilePrompt).toHaveBeenCalledWith(mockTemplate.template, {
          count: 5,
          topic: 'Jung Psychology',
          objectives: 'learn shadow\nunderstand anima',
          contentSummary: 'Conceitos: shadow, anima, animus'
        });
      });

      it('should throw error when no template found', async () => {
        mockPromptTemplateService.getTemplateByKey.mockResolvedValue(null);

        await expect(service.getQuizGenerationPrompt(basicConfig)).rejects.toThrow(
          'No quiz template found'
        );
      });

      it('should use default values for optional parameters', async () => {
        const minimalConfig = { topic: 'Psychology', difficulty: 'easy' as const, concepts: ['basic'] };
        
        await service.getQuizGenerationPrompt(minimalConfig);

        expect(mockPromptTemplateService.compilePrompt).toHaveBeenCalledWith(mockTemplate.template, {
          count: 10, // default
          topic: 'Psychology',
          concepts: 'basic'
        });
      });
    });
  });

  describe('Distractor Prompts', () => {
    describe('getDistractorPrompt', () => {
      it('should generate distractor prompt with all parameters', async () => {
        mockPromptTemplateService.getTemplateByKey.mockResolvedValue({
          ...mockTemplate,
          key: 'quiz.distractor_patterns'
        });

        const result = await service.getDistractorPrompt(
          'shadow concept',
          'freudian theory',
          'shadow is just negative',
          'all shadows are the same',
          'shadow equals evil'
        );

        expect(result).toBe('Compiled prompt text');
        expect(mockPromptTemplateService.compilePrompt).toHaveBeenCalledWith(mockTemplate.template, {
          concept: 'shadow concept',
          similar_theory: 'freudian theory',
          oversimplification: 'shadow is just negative',
          overgeneralization: 'all shadows are the same',
          common_misconception: 'shadow equals evil'
        });
      });

      it('should handle optional parameters', async () => {
        mockPromptTemplateService.getTemplateByKey.mockResolvedValue({
          ...mockTemplate,
          key: 'quiz.distractor_patterns'
        });

        await service.getDistractorPrompt('concept');

        expect(mockPromptTemplateService.compilePrompt).toHaveBeenCalledWith(mockTemplate.template, {
          concept: 'concept',
          similar_theory: '',
          oversimplification: '',
          overgeneralization: '',
          common_misconception: ''
        });
      });
    });
  });

  describe('Explanation Prompts', () => {
    describe('getExplanationPrompt', () => {
      it('should generate explanation prompt with all parameters', async () => {
        mockPromptTemplateService.getTemplateByKey.mockResolvedValue({
          ...mockTemplate,
          key: 'quiz.explanation_template'
        });

        const result = await service.getExplanationPrompt(
          'shadow integration',
          'correct explanation',
          'incorrect explanations',
          'key insight',
          'practical application',
          'Jung, CW 9'
        );

        expect(result).toBe('Compiled prompt text');
        expect(mockPromptTemplateService.compilePrompt).toHaveBeenCalledWith(mockTemplate.template, {
          topic: 'shadow integration',
          correct_explanation: 'correct explanation',
          incorrect_explanations: 'incorrect explanations',
          key_insight: 'key insight',
          practical_application: 'practical application',
          references: 'Jung, CW 9'
        });
      });

      it('should handle missing references', async () => {
        mockPromptTemplateService.getTemplateByKey.mockResolvedValue({
          ...mockTemplate,
          key: 'quiz.explanation_template'
        });

        await service.getExplanationPrompt(
          'topic', 'correct', 'incorrect', 'insight', 'application'
        );

        expect(mockPromptTemplateService.compilePrompt).toHaveBeenCalledWith(mockTemplate.template, 
          expect.objectContaining({ references: 'Não disponível' })
        );
      });
    });
  });

  describe('Question Template by Topic', () => {
    describe('getQuestionTemplateByTopic', () => {
      it('should return shadow work template for shadow topics', async () => {
        const shadowTemplate = { ...mockTemplate, key: 'quiz.shadow_work' };
        mockPromptTemplateService.getTemplateByKey
          .mockResolvedValueOnce(shadowTemplate);

        const result = await service.getQuestionTemplateByTopic('sombra', 'analysis');

        expect(result).toBe(shadowTemplate);
        expect(mockPromptTemplateService.getTemplateByKey).toHaveBeenCalledWith('quiz.shadow_work');
      });

      it('should return archetype template for anima/animus topics', async () => {
        const archetypeTemplate = { ...mockTemplate, key: 'quiz.archetype_analysis' };
        mockPromptTemplateService.getTemplateByKey
          .mockResolvedValueOnce(archetypeTemplate);

        const result = await service.getQuestionTemplateByTopic('anima', 'analysis');

        expect(result).toBe(archetypeTemplate);
        expect(mockPromptTemplateService.getTemplateByKey).toHaveBeenCalledWith('quiz.archetype_analysis');
      });

      it('should return psychological type template for type topics', async () => {
        const typeTemplate = { ...mockTemplate, key: 'quiz.psychological_type' };
        mockPromptTemplateService.getTemplateByKey
          .mockResolvedValueOnce(typeTemplate);

        const result = await service.getQuestionTemplateByTopic('psychological types', 'type');

        expect(result).toBe(typeTemplate);
      });

      it('should fallback to concept identification for unknown topics', async () => {
        const conceptTemplate = { ...mockTemplate, key: 'quiz.concept_identification' };
        mockPromptTemplateService.getTemplateByKey
          .mockResolvedValueOnce(conceptTemplate);

        const result = await service.getQuestionTemplateByTopic('unknown topic', 'question');

        expect(result).toBe(conceptTemplate);
        expect(mockPromptTemplateService.getTemplateByKey).toHaveBeenCalledWith('quiz.concept_identification');
      });

      it('should return null when no template available', async () => {
        mockPromptTemplateService.getTemplateByKey.mockResolvedValue(null);

        const result = await service.getQuestionTemplateByTopic('any topic', 'type');

        expect(result).toBeNull();
      });

      it('should handle case insensitive topic matching', async () => {
        const shadowTemplate = { ...mockTemplate, key: 'quiz.shadow_work' };
        mockPromptTemplateService.getTemplateByKey.mockResolvedValueOnce(shadowTemplate);

        const result = await service.getQuestionTemplateByTopic('SHADOW WORK', 'analysis');

        expect(result).toBe(shadowTemplate);
      });
    });
  });

  describe('Template Management', () => {
    describe('getAllQuizTemplates', () => {
      it('should return all quiz templates', async () => {
        const mockTemplates = [mockTemplate, { ...mockTemplate, id: 'template-2' }];
        mockPromptTemplateService.getTemplates.mockResolvedValue(mockTemplates);

        const result = await service.getAllQuizTemplates();

        expect(result).toBe(mockTemplates);
        expect(mockPromptTemplateService.getTemplates).toHaveBeenCalledWith('quiz');
      });
    });

    describe('createCustomTemplate', () => {
      it('should create custom template successfully', async () => {
        const mockDate = new Date('2023-01-01');
        jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime());

        const result = await service.createCustomTemplate(
          'Custom Quiz Template',
          'A custom template for specific needs',
          'Template content with {{variable}}',
          [{ name: 'variable', type: 'text', description: 'Test variable', required: true }]
        );

        expect(result).toBe(mockTemplate);
        expect(mockPromptTemplateService.createTemplate).toHaveBeenCalledWith({
          key: `quiz.custom_${mockDate.getTime()}`,
          category: 'quiz',
          name: 'Custom Quiz Template',
          description: 'A custom template for specific needs',
          template: 'Template content with {{variable}}',
          variables: [{ name: 'variable', type: 'text', description: 'Test variable', required: true }],
          language: 'pt-BR',
          isActive: true
        });
      });
    });

    describe('updateTemplate', () => {
      it('should update existing template', async () => {
        const updates = { name: 'Updated Template', description: 'Updated description' };

        const result = await service.updateTemplate('template-1', updates);

        expect(result).toBe(mockTemplate);
        expect(mockPromptTemplateService.updateTemplate).toHaveBeenCalledWith('template-1', updates);
      });
    });
  });

  describe('Topic Concepts and Misconceptions', () => {
    describe('getTopicConcepts', () => {
      it('should return shadow concepts for shadow topics', () => {
        const concepts = service.getTopicConcepts('sombra');

        expect(concepts).toEqual([
          'sombra',
          'projeção',
          'inconsciente pessoal',
          'conteúdo reprimido',
          'integração da sombra'
        ]);
      });

      it('should return anima concepts for anima topics', () => {
        const concepts = service.getTopicConcepts('anima projection');

        expect(concepts).toEqual([
          'anima',
          'alma feminina',
          'imagem da alma',
          'projeção da anima',
          'estágios da anima'
        ]);
      });

      it('should return general concepts for unknown topics', () => {
        const concepts = service.getTopicConcepts('unknown topic');

        expect(concepts).toEqual([
          'inconsciente',
          'arquétipos',
          'individuação',
          'sombra',
          'anima',
          'animus',
          'Self',
          'ego',
          'persona'
        ]);
      });

      it('should handle case insensitive matching', () => {
        const concepts = service.getTopicConcepts('ARQUÉTIPOS');

        expect(concepts).toContain('arquétipos');
        expect(concepts).toContain('padrões universais');
      });
    });

    describe('getTopicMisconceptions', () => {
      it('should return shadow misconceptions for shadow topics', () => {
        const misconceptions = service.getTopicMisconceptions('sombra');

        expect(misconceptions).toEqual([
          'A sombra é apenas negativa',
          'A sombra deve ser eliminada',
          'A sombra é o mesmo que o mal'
        ]);
      });

      it('should return anima misconceptions for anima topics', () => {
        const misconceptions = service.getTopicMisconceptions('anima');

        expect(misconceptions).toEqual([
          'A anima é apenas atração romântica',
          'A anima é fixa e imutável',
          'A anima é um estereótipo de gênero'
        ]);
      });

      it('should return empty array for unknown topics', () => {
        const misconceptions = service.getTopicMisconceptions('unknown topic');

        expect(misconceptions).toEqual([]);
      });

      it('should handle partial topic matching', () => {
        const misconceptions = service.getTopicMisconceptions('inconsciente coletivo de jung');

        expect(misconceptions).toContain('É o mesmo que inconsciente pessoal');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle prompt service errors gracefully', async () => {
      mockPromptTemplateService.getTemplateByKey.mockRejectedValue(new Error('Service error'));

      await expect(service.getConceptIdentificationPrompt(
        'concept', 'definition', 'misconception', 'distinction'
      )).rejects.toThrow('Service error');
    });

    it('should handle compilation errors', async () => {
      mockPromptTemplateService.compilePrompt.mockRejectedValue(new Error('Compilation failed'));

      await expect(service.getConceptIdentificationPrompt(
        'concept', 'definition', 'misconception', 'distinction'
      )).rejects.toThrow('Compilation failed');
    });

    it('should handle template creation errors', async () => {
      mockPromptTemplateService.createTemplate.mockRejectedValue(new Error('Creation failed'));

      await expect(service.createCustomTemplate(
        'name', 'description', 'template', []
      )).rejects.toThrow('Creation failed');
    });
  });

  describe('Integration Tests', () => {
    it('should work with real prompt template service flow', async () => {
      // This tests the actual integration without mocking internal calls
      const realService = new QuizPromptService();
      
      // Mock only the external service calls
      mockPromptTemplateService.getTemplateByKey.mockResolvedValue(mockTemplate);
      mockPromptTemplateService.compilePrompt.mockResolvedValue('Final compiled prompt');

      const result = await realService.getConceptIdentificationPrompt(
        'shadow', 'definition', 'misconception', 'distinction'
      );

      expect(result).toBe('Final compiled prompt');
    });

    it('should handle multiple concurrent requests', async () => {
      const promises = [
        service.getConceptIdentificationPrompt('concept1', 'def1', 'misc1', 'dist1'),
        service.getArchetypeAnalysisPrompt('scenario1', 'arch1', 'features1', 'evidence1'),
        service.getDreamInterpretationPrompt('symbol1', 'meaning1')
      ];

      mockPromptTemplateService.getTemplateByKey.mockResolvedValue(mockTemplate);

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(results.every(result => result === 'Compiled prompt text')).toBe(true);
    });
  });
});