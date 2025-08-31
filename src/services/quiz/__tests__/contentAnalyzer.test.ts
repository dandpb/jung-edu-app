/**
 * Comprehensive Unit Tests for ContentAnalyzer
 * Tests content analysis for concept extraction, difficulty assessment, and question area identification
 */

import { ContentAnalyzer, contentAnalyzer, ContentAnalysisResult } from '../contentAnalyzer';
import { ILLMProvider } from '../../llm/types';
import { LLMProviderFactory } from '../../llm/provider';

// Mock dependencies
jest.mock('../../llm/provider');

describe('ContentAnalyzer', () => {
  let analyzer: ContentAnalyzer;
  let mockProvider: jest.Mocked<ILLMProvider>;

  const sampleContent = `
    Carl Jung desenvolveu a teoria do inconsciente coletivo, que é uma camada mais profunda 
    do inconsciente compartilhada por toda a humanidade. Este inconsciente contém arquétipos, 
    que são padrões universais ou imagens que derivam do inconsciente coletivo.
    
    O processo de individuação é central na psicologia junguiana, representando o processo 
    de integração dos opostos dentro da psique para alcançar a totalidade. Durante este 
    processo, o indivíduo confronta sua sombra, que representa aspectos reprimidos da personalidade.
    
    Os arquétipos mais importantes incluem a Anima (aspecto feminino no homem), 
    o Animus (aspecto masculino na mulher), a Sombra, e o Self (o centro unificador da personalidade).
  `;

  const mockAnalysisResponse = {
    concepts: ['inconsciente coletivo', 'arquétipos', 'individuação', 'sombra', 'anima', 'animus'],
    cognitivelevels: ['compreensão', 'aplicação', 'análise'],
    objectives: ['Compreender o inconsciente coletivo', 'Identificar arquétipos principais', 'Explicar o processo de individuação']
  };

  const mockStructureResponse = {
    mainTopics: ['Inconsciente Coletivo', 'Arquétipos', 'Processo de Individuação'],
    subtopics: ['Sombra', 'Anima e Animus', 'Self'],
    examples: ['Confronto com a sombra', 'Integração dos opostos'],
    definitions: ['Inconsciente coletivo', 'Arquétipos', 'Individuação']
  };

  const mockDifficultyResponse = {
    level: 'intermediate' as const,
    reasons: ['Conceitos complexos mas bem explicados', 'Requer conhecimento prévio de psicologia']
  };

  const mockQuestionAreasResponse = [
    {
      area: 'Conceitos Fundamentais',
      concepts: ['inconsciente coletivo', 'arquétipos'],
      suggestedQuestionTypes: ['múltipla escolha', 'verdadeiro/falso'],
      difficulty: 'médio'
    },
    {
      area: 'Processo de Individuação',
      concepts: ['individuação', 'sombra'],
      suggestedQuestionTypes: ['dissertativa', 'aplicação'],
      difficulty: 'difícil'
    }
  ];

  const mockRelationshipsResponse = [
    {
      concept1: 'inconsciente coletivo',
      concept2: 'arquétipos',
      relationship: 'contém'
    },
    {
      concept1: 'individuação',
      concept2: 'sombra',
      relationship: 'envolve'
    }
  ];

  beforeEach(() => {
    mockProvider = {
      generateCompletion: jest.fn(),
      generateStructuredOutput: jest.fn(),
      getTokenCount: jest.fn().mockReturnValue(150),
      isAvailable: jest.fn().mockResolvedValue(true)
    };

    (LLMProviderFactory.getProvider as jest.Mock).mockReturnValue(mockProvider);

    analyzer = new ContentAnalyzer(mockProvider);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzeContent()', () => {
    beforeEach(() => {
      // Setup successful responses for all analysis phases
      mockProvider.generateStructuredOutput
        .mockResolvedValueOnce(mockAnalysisResponse)
        .mockResolvedValueOnce(mockStructureResponse)
        .mockResolvedValueOnce(mockDifficultyResponse)
        .mockResolvedValueOnce(mockQuestionAreasResponse)
        .mockResolvedValueOnce(mockRelationshipsResponse);
    });

    it('should perform comprehensive content analysis', async () => {
      const result = await analyzer.analyzeContent(
        sampleContent,
        'Psicologia Junguiana',
        'pt-BR'
      );

      expect(result).toMatchObject({
        keyConcepts: mockAnalysisResponse.concepts,
        difficulty: mockDifficultyResponse.level,
        cognitivelevels: mockAnalysisResponse.cognitivelevels,
        learningObjectives: mockAnalysisResponse.objectives,
        conceptRelationships: mockRelationshipsResponse,
        potentialQuestionAreas: mockQuestionAreasResponse,
        contentStructure: mockStructureResponse,
        assessmentSuggestions: expect.any(Object)
      });

      expect(result.assessmentSuggestions).toMatchObject({
        recommendedQuestionCount: expect.any(Number),
        difficultyDistribution: expect.objectContaining({
          easy: expect.any(Number),
          medium: expect.any(Number),
          hard: expect.any(Number)
        }),
        questionTypeDistribution: expect.any(Object)
      });
    });

    it('should call all analysis phases in parallel', async () => {
      await analyzer.analyzeContent(sampleContent, 'Test Topic', 'pt-BR');

      // Should have called generateStructuredOutput 5 times (4 parallel + 1 sequential)
      expect(mockProvider.generateStructuredOutput).toHaveBeenCalledTimes(5);

      // Verify the parallel calls were made
      const calls = mockProvider.generateStructuredOutput.mock.calls;
      expect(calls[0][0]).toContain('Analise o seguinte conteúdo'); // Concept analysis
      expect(calls[1][0]).toContain('Analise a estrutura'); // Structure analysis
      expect(calls[2][0]).toContain('Avalie o nível de dificuldade'); // Difficulty assessment
      expect(calls[3][0]).toContain('identifique áreas potenciais'); // Question areas
      expect(calls[4][0]).toContain('Analise as relações'); // Relationships
    });

    it('should generate appropriate assessment suggestions for beginner content', async () => {
      // Create fresh analyzer to avoid mock interference
      const freshAnalyzer = new ContentAnalyzer(mockProvider);
      mockProvider.generateStructuredOutput.mockReset();
      
      const beginnerAnalysisResponse = { ...mockAnalysisResponse };
      const beginnerDifficultyResponse = { level: 'beginner', reasons: ['Conceitos básicos'] };
      
      mockProvider.generateStructuredOutput
        .mockResolvedValueOnce(beginnerAnalysisResponse)
        .mockResolvedValueOnce(mockStructureResponse)
        .mockResolvedValueOnce(beginnerDifficultyResponse)
        .mockResolvedValueOnce(mockQuestionAreasResponse)
        .mockResolvedValueOnce(mockRelationshipsResponse);

      const result = await freshAnalyzer.analyzeContent(sampleContent, 'Basic Topic', 'pt-BR');

      expect(result.difficulty).toBe('beginner');
      expect(result.assessmentSuggestions.difficultyDistribution).toMatchObject({
        easy: 0.5,
        medium: 0.4,
        hard: 0.1
      });
    });

    it('should generate appropriate assessment suggestions for advanced content', async () => {
      // Create fresh analyzer to avoid mock interference
      const freshAnalyzer = new ContentAnalyzer(mockProvider);
      mockProvider.generateStructuredOutput.mockReset();
      
      const advancedAnalysisResponse = { ...mockAnalysisResponse };
      const advancedDifficultyResponse = { level: 'advanced', reasons: ['Conceitos muito complexos'] };
      
      mockProvider.generateStructuredOutput
        .mockResolvedValueOnce(advancedAnalysisResponse)
        .mockResolvedValueOnce(mockStructureResponse)
        .mockResolvedValueOnce(advancedDifficultyResponse)
        .mockResolvedValueOnce(mockQuestionAreasResponse)
        .mockResolvedValueOnce(mockRelationshipsResponse);

      const result = await freshAnalyzer.analyzeContent(sampleContent, 'Advanced Topic', 'pt-BR');

      expect(result.difficulty).toBe('advanced');
      expect(result.assessmentSuggestions.difficultyDistribution).toMatchObject({
        easy: 0.1,
        medium: 0.4,
        hard: 0.5
      });

      expect(result.assessmentSuggestions.questionTypeDistribution).toMatchObject({
        'multiple-choice': 0.4,
        'short-answer': 0.3,
        'essay': 0.2,
        'true-false': 0.1
      });
    });

    it('should handle content analysis failure with fallback', async () => {
      // First call fails, subsequent calls succeed
      mockProvider.generateStructuredOutput
        .mockRejectedValueOnce(new Error('Analysis failed'))
        .mockResolvedValueOnce(mockStructureResponse)
        .mockResolvedValueOnce(mockDifficultyResponse)
        .mockResolvedValueOnce(mockQuestionAreasResponse)
        .mockResolvedValueOnce([]);

      const result = await analyzer.analyzeContent(sampleContent, 'Test Topic', 'pt-BR');

      // Should still succeed with the remaining calls
      expect(result.keyConcepts).toEqual(
        expect.arrayContaining(['inconsciente coletivo', 'arquétipos'])
      );
      expect(result.learningObjectives).toEqual(
        expect.any(Array)
      );
    });

    it('should handle structure analysis failure with fallback', async () => {
      mockProvider.generateStructuredOutput
        .mockResolvedValueOnce(mockAnalysisResponse)
        .mockRejectedValueOnce(new Error('Structure analysis failed'))
        .mockResolvedValueOnce(mockDifficultyResponse)
        .mockResolvedValueOnce(mockQuestionAreasResponse)
        .mockResolvedValueOnce([]);

      const result = await analyzer.analyzeContent(sampleContent, 'Test Topic', 'pt-BR');

      expect(result.contentStructure).toMatchObject({
        mainTopics: ['Conceitos fundamentais', 'Aplicações práticas'],
        subtopics: ['Definições básicas', 'Exemplos', 'Teoria'],
        examples: ['Caso de estudo 1', 'Exemplo prático'],
        definitions: ['Definição principal', 'Conceitos relacionados']
      });
    });

    it('should handle difficulty assessment failure with fallback', async () => {
      mockProvider.generateStructuredOutput
        .mockResolvedValueOnce(mockAnalysisResponse)
        .mockResolvedValueOnce(mockStructureResponse)
        .mockRejectedValueOnce(new Error('Difficulty assessment failed'))
        .mockResolvedValueOnce(mockQuestionAreasResponse)
        .mockResolvedValueOnce([]);

      const result = await analyzer.analyzeContent(sampleContent, 'Test Topic', 'pt-BR');

      expect(result.difficulty).toBe('intermediate');
    });

    it('should handle question areas analysis failure with fallback', async () => {
      mockProvider.generateStructuredOutput
        .mockResolvedValueOnce(mockAnalysisResponse)
        .mockResolvedValueOnce(mockStructureResponse)
        .mockResolvedValueOnce(mockDifficultyResponse)
        .mockRejectedValueOnce(new Error('Question areas failed'))
        .mockResolvedValueOnce([]);

      const result = await analyzer.analyzeContent(sampleContent, 'Test Topic', 'pt-BR');

      expect(result.potentialQuestionAreas).toEqual([
        {
          area: 'Conceitos Fundamentais',
          concepts: ['definições básicas', 'princípios centrais'],
          suggestedQuestionTypes: ['múltipla escolha', 'verdadeiro/falso'],
          difficulty: 'médio'
        }
      ]);
    });

    it('should handle relationships analysis failure gracefully', async () => {
      mockProvider.generateStructuredOutput
        .mockResolvedValueOnce(mockAnalysisResponse)
        .mockResolvedValueOnce(mockStructureResponse)
        .mockResolvedValueOnce(mockDifficultyResponse)
        .mockResolvedValueOnce(mockQuestionAreasResponse)
        .mockRejectedValueOnce(new Error('Relationships analysis failed'));

      const result = await analyzer.analyzeContent(sampleContent, 'Test Topic', 'pt-BR');

      expect(result.conceptRelationships).toEqual([]);
    });

    it('should skip relationships analysis for insufficient concepts', async () => {
      mockProvider.generateStructuredOutput
        .mockResolvedValueOnce({ ...mockAnalysisResponse, concepts: ['single-concept'] })
        .mockResolvedValueOnce(mockStructureResponse)
        .mockResolvedValueOnce(mockDifficultyResponse)
        .mockResolvedValueOnce(mockQuestionAreasResponse);

      const result = await analyzer.analyzeContent(sampleContent, 'Test Topic', 'pt-BR');

      expect(result.conceptRelationships).toEqual([]);
      expect(mockProvider.generateStructuredOutput).toHaveBeenCalledTimes(4); // No relationships call
    });

    it('should handle non-array responses gracefully', async () => {
      mockProvider.generateStructuredOutput
        .mockResolvedValueOnce(mockAnalysisResponse)
        .mockResolvedValueOnce(mockStructureResponse)
        .mockResolvedValueOnce(mockDifficultyResponse)
        .mockResolvedValueOnce('not an array') // Invalid response
        .mockResolvedValueOnce('also not an array');

      const result = await analyzer.analyzeContent(sampleContent, 'Test Topic', 'pt-BR');

      expect(result.potentialQuestionAreas).toEqual([]);
      expect(result.conceptRelationships).toEqual([]);
    });
  });

  describe('quickAnalysis()', () => {
    it('should perform quick heuristic analysis', async () => {
      const shortContent = 'This is a short test content about basic concepts.';
      
      const result = await analyzer.quickAnalysis(shortContent, 'Basic Topic');

      expect(result).toMatchObject({
        keyTopics: expect.any(Array),
        estimatedDifficulty: 'beginner',
        suggestedQuestionCount: expect.any(Number)
      });

      expect(result.suggestedQuestionCount).toBeGreaterThanOrEqual(5);
      expect(result.suggestedQuestionCount).toBeLessThanOrEqual(15);
    });

    it('should estimate beginner difficulty for short, simple content', async () => {
      const simpleContent = 'Jung was a psychologist. He studied dreams.';

      const result = await analyzer.quickAnalysis(simpleContent, 'Jung Basics');

      expect(result.estimatedDifficulty).toBe('beginner');
      expect(result.suggestedQuestionCount).toBeGreaterThanOrEqual(5);
    });

    it('should estimate advanced difficulty for long, complex content', async () => {
      const complexContent = `
        The phenomenological approach to understanding archetypal manifestations within the collective unconscious
        requires a sophisticated analysis of symbolic representations across cultural paradigms and temporal dimensions.
        This intricate examination necessitates a comprehensive understanding of hermeneutic methodologies and their
        application to psychoanalytic interpretation frameworks.
      `.repeat(5); // Make it longer

      const result = await analyzer.quickAnalysis(complexContent, 'Advanced Jung');

      expect(result.estimatedDifficulty).toBe('advanced');
      expect(result.suggestedQuestionCount).toBeGreaterThan(5);
    });

    it('should extract meaningful keywords', async () => {
      const keywordRichContent = 'unconscious collective archetypes individuation shadow anima animus personality development psychology';

      const result = await analyzer.quickAnalysis(keywordRichContent, 'Jung Psychology');

      expect(result.keyTopics).toContain('unconscious');
      expect(result.keyTopics).toContain('archetypes');
      expect(result.keyTopics).toContain('individuation');
      expect(result.keyTopics.length).toBeGreaterThan(3);
    });

    it('should handle empty or very short content', async () => {
      const result = await analyzer.quickAnalysis('', 'Empty Topic');

      expect(result).toMatchObject({
        keyTopics: [],
        estimatedDifficulty: 'intermediate',
        suggestedQuestionCount: 5
      });
    });

    it('should filter out short words from keywords', async () => {
      const content = 'This is a test with many short words but few meaningful psychology concepts';

      const result = await analyzer.quickAnalysis(content, 'Test Topic');

      // Should not include words like 'is', 'a', 'with', 'but'
      result.keyTopics.forEach(keyword => {
        expect(keyword.length).toBeGreaterThan(3);
      });
    });
  });

  describe('Provider Interactions', () => {
    it('should use default provider when none provided', () => {
      const defaultAnalyzer = new ContentAnalyzer();
      
      expect(LLMProviderFactory.getProvider).toHaveBeenCalled();
    });

    it('should use provided LLM provider', () => {
      const customProvider = {
        generateCompletion: jest.fn(),
        generateStructuredOutput: jest.fn(),
        getTokenCount: jest.fn(),
        isAvailable: jest.fn()
      } as any;

      const customAnalyzer = new ContentAnalyzer(customProvider);
      expect(customAnalyzer).toBeDefined();
    });

    it('should handle provider availability gracefully', async () => {
      mockProvider.isAvailable.mockResolvedValue(false);
      mockProvider.generateStructuredOutput.mockRejectedValue(new Error('Provider unavailable'));

      const result = await analyzer.analyzeContent(sampleContent, 'Test Topic', 'pt-BR');

      // Should still return results with fallback data
      expect(result).toBeDefined();
      expect(result.keyConcepts).toBeDefined();
      expect(result.difficulty).toBeDefined();
    });
  });

  describe('Language Support', () => {
    it('should handle English language analysis', async () => {
      const englishContent = `
        Carl Jung developed the theory of the collective unconscious, which represents a deeper layer 
        of unconscious shared by all humanity. This unconscious contains archetypes, which are 
        universal patterns or images derived from the collective unconscious.
      `;

      mockProvider.generateStructuredOutput
        .mockResolvedValueOnce({
          concepts: ['collective unconscious', 'archetypes', 'universal patterns'],
          cognitivelevels: ['understanding', 'analysis'],
          objectives: ['Understand collective unconscious', 'Identify archetypes']
        })
        .mockResolvedValueOnce(mockStructureResponse)
        .mockResolvedValueOnce(mockDifficultyResponse)
        .mockResolvedValueOnce(mockQuestionAreasResponse)
        .mockResolvedValueOnce(mockRelationshipsResponse);

      const result = await analyzer.analyzeContent(englishContent, 'Jung Theory', 'en');

      expect(result).toBeDefined();
      expect(result.keyConcepts).toContain('collective unconscious');
      expect(result.keyConcepts).toContain('archetypes');
    });

    it('should default to Portuguese when language not specified', async () => {
      mockProvider.generateStructuredOutput
        .mockResolvedValueOnce(mockAnalysisResponse)
        .mockResolvedValueOnce(mockStructureResponse)
        .mockResolvedValueOnce(mockDifficultyResponse)
        .mockResolvedValueOnce(mockQuestionAreasResponse)
        .mockResolvedValueOnce([]);

      await analyzer.analyzeContent(sampleContent, 'Test Topic');

      const firstCall = mockProvider.generateStructuredOutput.mock.calls[0][0];
      expect(firstCall).toContain('Analise o seguinte conteúdo'); // Portuguese prompt
    });
  });

  describe('Content Types and Edge Cases', () => {
    it('should handle very long content by truncating appropriately', async () => {
      const veryLongContent = sampleContent.repeat(50); // Very long content
      
      mockProvider.generateStructuredOutput
        .mockResolvedValueOnce(mockAnalysisResponse)
        .mockResolvedValueOnce(mockStructureResponse)
        .mockResolvedValueOnce(mockDifficultyResponse)
        .mockResolvedValueOnce(mockQuestionAreasResponse)
        .mockResolvedValueOnce([]);

      const result = await analyzer.analyzeContent(veryLongContent, 'Long Topic', 'pt-BR');

      // Should still work despite long content
      expect(result).toBeDefined();
      
      // Check that prompts were truncated appropriately
      const calls = mockProvider.generateStructuredOutput.mock.calls;
      calls.forEach(call => {
        const prompt = call[0];
        expect(prompt.length).toBeLessThan(5000); // Reasonable prompt length
      });
    });

    it('should handle content with special characters and formatting', async () => {
      const specialContent = `
        Jung's concept of "individuation" is crucial... It involves:
        • Shadow integration
        • Anima/Animus recognition  
        • Self-realization process
        
        Key aspects include:
        1. Psychological development
        2. Wholeness achievement
        3. Personal transformation
      `;

      mockProvider.generateStructuredOutput
        .mockResolvedValueOnce(mockAnalysisResponse)
        .mockResolvedValueOnce(mockStructureResponse)
        .mockResolvedValueOnce(mockDifficultyResponse)
        .mockResolvedValueOnce(mockQuestionAreasResponse)
        .mockResolvedValueOnce([]);

      const result = await analyzer.analyzeContent(specialContent, 'Special Format', 'pt-BR');

      expect(result).toBeDefined();
      expect(result.keyConcepts).toBeDefined();
    });

    it('should generate appropriate question counts based on content length', async () => {
      const shortContent = 'Brief content about Jung.';
      const longContent = sampleContent.repeat(10);

      // Test short content
      const shortResult = await analyzer.quickAnalysis(shortContent, 'Short Topic');
      expect(shortResult.suggestedQuestionCount).toBe(5); // Minimum

      // Test long content  
      const longResult = await analyzer.quickAnalysis(longContent, 'Long Topic');
      expect(longResult.suggestedQuestionCount).toBeGreaterThan(5);
      expect(longResult.suggestedQuestionCount).toBeLessThanOrEqual(15); // Maximum
    });
  });

  describe('Singleton Instance', () => {
    it('should export working singleton instance', () => {
      expect(contentAnalyzer).toBeInstanceOf(ContentAnalyzer);
      expect(typeof contentAnalyzer.analyzeContent).toBe('function');
      expect(typeof contentAnalyzer.quickAnalysis).toBe('function');
    });
  });

  describe('Assessment Suggestions Generation', () => {
    it('should adjust question count based on concept complexity', async () => {
      const manyConceptsAnalysis = {
        ...mockAnalysisResponse,
        concepts: Array(20).fill(null).map((_, i) => `concept-${i + 1}`)
      };

      mockProvider.generateStructuredOutput
        .mockResolvedValueOnce(manyConceptsAnalysis)
        .mockResolvedValueOnce(mockStructureResponse)
        .mockResolvedValueOnce(mockDifficultyResponse)
        .mockResolvedValueOnce(mockQuestionAreasResponse)
        .mockResolvedValueOnce([]);

      const result = await analyzer.analyzeContent(sampleContent, 'Complex Topic', 'pt-BR');

      expect(result.assessmentSuggestions.recommendedQuestionCount).toBe(15); // Max limit
    });

    it('should ensure minimum question count', async () => {
      const fewConceptsAnalysis = {
        ...mockAnalysisResponse,
        concepts: ['single-concept']
      };

      mockProvider.generateStructuredOutput
        .mockResolvedValueOnce(fewConceptsAnalysis)
        .mockResolvedValueOnce(mockStructureResponse)
        .mockResolvedValueOnce(mockDifficultyResponse)
        .mockResolvedValueOnce(mockQuestionAreasResponse)
        .mockResolvedValueOnce([]);

      const result = await analyzer.analyzeContent(sampleContent, 'Simple Topic', 'pt-BR');

      expect(result.assessmentSuggestions.recommendedQuestionCount).toBe(5); // Min limit
    });
  });
});