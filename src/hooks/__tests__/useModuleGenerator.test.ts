import { renderHook, act } from '@testing-library/react';
import { useModuleGenerator } from '../useModuleGenerator';
import { GenerationConfig } from '../../components/admin/AIModuleGenerator';
import { ModuleGenerationOrchestrator } from '../../services/llm/orchestrator';
import { Module } from '../../types';

// Mock the orchestrator module
jest.mock('../../services/llm/orchestrator');

describe('useModuleGenerator', () => {
  const mockOrchestrator = {
    on: jest.fn(),
    checkProviderAvailability: jest.fn(),
    generateModule: jest.fn(),
  };

  const mockModule: Module = {
    id: 'test-module-1',
    title: 'Test Module',
    description: 'A test module',
    duration: 60,
    level: 'Intermediário',
    objectives: ['Test objective 1', 'Test objective 2'],
    icon: '🧠',
    content: {
      sections: [
        {
          id: 'section-1',
          title: 'Section 1',
          content: 'Section 1 content',
          keyTerms: [
            { term: 'Term 1', definition: 'Definition 1' }
          ]
        }
      ],
      videos: [
        {
          id: 'video-1',
          title: 'Video 1',
          youtubeId: 'abc123',
          description: 'Video description',
          duration: 10
        }
      ],
      bibliography: [
        {
          author: 'Jung, C.G.',
          title: 'Test Book',
          year: 1950,
          type: 'book',
          link: 'https://example.com'
        }
      ],
      films: [],
      quiz: {
        id: 'quiz-1',
        title: 'Test Quiz',
        questions: [
          {
            id: 'q-1',
            question: 'Test question?',
            type: 'multiple-choice',
            options: [
              { id: 'opt-1', text: 'Option 1', isCorrect: true },
              { id: 'opt-2', text: 'Option 2', isCorrect: false },
              { id: 'opt-3', text: 'Option 3', isCorrect: false },
              { id: 'opt-4', text: 'Option 4', isCorrect: false }
            ],
            correctAnswer: 0,
            explanation: 'Test explanation'
          }
        ]
      }
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (ModuleGenerationOrchestrator as jest.Mock).mockImplementation(() => mockOrchestrator);
  });

  describe('Initial State', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useModuleGenerator());

      expect(result.current.isGenerating).toBe(false);
      expect(result.current.generatedModule).toBeNull();
      expect(result.current.generationSteps).toEqual([]);
      expect(result.current.currentStep).toBe(0);
      expect(result.current.error).toBeNull();
    });
  });

  describe('generateModule', () => {
    const defaultConfig: GenerationConfig = {
      subject: 'Psicologia Analítica',
      targetAudience: 'estudantes de psicologia',
      difficulty: 'intermediate',
      estimatedTime: 60,
      includeVideos: true,
      includeQuiz: true,
      includeBibliography: true,
    };

    it('should generate a module successfully', async () => {
      mockOrchestrator.checkProviderAvailability.mockResolvedValue(true);
      mockOrchestrator.generateModule.mockResolvedValue({
        module: {
          id: 'test-module-1',
          title: 'Test Module',
          description: 'A test module',
          duration: 60,
          level: 'Intermediário',
          objectives: ['Test objective 1', 'Test objective 2']
        },
        content: mockModule.content,
        videos: mockModule.content.videos,
        bibliography: mockModule.content.bibliography,
        quiz: mockModule.content.quiz
      });

      const { result } = renderHook(() => useModuleGenerator());

      await act(async () => {
        await result.current.generateModule(defaultConfig);
      });

      expect(result.current.isGenerating).toBe(false);
      expect(result.current.generatedModule).toMatchObject({
        ...mockModule,
        content: {
          ...mockModule.content,
          quiz: {
            ...mockModule.content.quiz,
            questions: expect.arrayContaining([
              expect.objectContaining({
                id: 'q-1',
                question: 'Test question?',
                type: 'multiple-choice',
                correctAnswer: 0,
                explanation: 'Test explanation'
              })
            ])
          }
        }
      });
      expect(result.current.error).toBeNull();
      
      // Check if all steps were marked as completed
      expect(result.current.generationSteps.every(step => step.status === 'completed')).toBe(true);
    });

    it('should handle provider unavailability', async () => {
      mockOrchestrator.checkProviderAvailability.mockResolvedValue(false);

      const { result } = renderHook(() => useModuleGenerator());

      await act(async () => {
        await result.current.generateModule(defaultConfig);
      });

      expect(result.current.isGenerating).toBe(false);
      expect(result.current.generatedModule).toBeNull();
      expect(result.current.error).toBe('Falha ao gerar módulo: O provedor LLM não está disponível. Verifique a configuração da sua chave de API.');
    });

    it('should handle generation errors', async () => {
      mockOrchestrator.checkProviderAvailability.mockResolvedValue(true);
      mockOrchestrator.generateModule.mockRejectedValue(new Error('Generation failed'));

      const { result } = renderHook(() => useModuleGenerator());

      await act(async () => {
        await result.current.generateModule(defaultConfig);
      });

      expect(result.current.isGenerating).toBe(false);
      expect(result.current.generatedModule).toBeNull();
      expect(result.current.error).toBe('Falha ao gerar módulo: Generation failed');
    });

    it('should update generation steps during progress', async () => {
      let progressCallback: ((progress: any) => void) | null = null;

      mockOrchestrator.on.mockImplementation((event: string, callback: any) => {
        if (event === 'progress') {
          progressCallback = callback;
        }
      });

      mockOrchestrator.checkProviderAvailability.mockResolvedValue(true);
      mockOrchestrator.generateModule.mockImplementation(async () => {
        // Simulate progress updates
        if (progressCallback) {
          progressCallback({ stage: 'initializing', message: 'Starting generation' });
          progressCallback({ stage: 'content', message: 'Generating content' });
          progressCallback({ stage: 'quiz', message: 'Creating quiz' });
        }
        return {
          module: mockModule,
          content: mockModule.content,
          videos: mockModule.content.videos,
          bibliography: mockModule.content.bibliography,
          quiz: mockModule.content.quiz
        };
      });

      const { result } = renderHook(() => useModuleGenerator());

      await act(async () => {
        await result.current.generateModule(defaultConfig);
      });

      expect(mockOrchestrator.on).toHaveBeenCalledWith('progress', expect.any(Function));
    });

    it('should create generation steps based on config', async () => {
      mockOrchestrator.checkProviderAvailability.mockResolvedValue(true);
      mockOrchestrator.generateModule.mockResolvedValue({
        module: mockModule,
        content: mockModule.content,
        videos: [],
        bibliography: [],
        quiz: undefined
      });

      const configWithoutExtras: GenerationConfig = {
        ...defaultConfig,
        includeVideos: false,
        includeQuiz: false,
        includeBibliography: false
      };

      const { result } = renderHook(() => useModuleGenerator());

      await act(async () => {
        await result.current.generateModule(configWithoutExtras);
      });

      // Should only have basic steps without quiz, videos, or bibliography
      const stepIds = result.current.generationSteps.map(step => step.id);
      expect(stepIds).toContain('initializing');
      expect(stepIds).toContain('content');
      expect(stepIds).toContain('finalizing');
      expect(stepIds).not.toContain('quiz');
      expect(stepIds).not.toContain('videos');
      expect(stepIds).not.toContain('bibliography');
    });

    it('should handle quiz generation with malformed data', async () => {
      mockOrchestrator.checkProviderAvailability.mockResolvedValue(true);
      mockOrchestrator.generateModule.mockResolvedValue({
        module: mockModule,
        content: mockModule.content,
        videos: [],
        bibliography: [],
        quiz: {
          id: 'quiz-1',
          title: 'Test Quiz',
          questions: [
            // Question with missing options
            {
              id: 'q-1',
              question: 'Test question?',
              type: 'multiple-choice',
              options: null,
              correctAnswer: 0,
              explanation: 'Test explanation'
            },
            // Question with empty options
            {
              id: 'q-2',
              question: 'Another question?',
              type: 'multiple-choice',
              options: [],
              correctAnswer: 0,
              explanation: 'Another explanation'
            },
            // Valid question
            {
              id: 'q-3',
              question: 'Valid question?',
              type: 'multiple-choice',
              options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
              correctAnswer: 0,
              explanation: 'Valid explanation'
            }
          ]
        }
      });

      const { result } = renderHook(() => useModuleGenerator());

      await act(async () => {
        await result.current.generateModule(defaultConfig);
      });

      // Should create fallback options for malformed questions
      const quiz = result.current.generatedModule?.content.quiz;
      expect(quiz).toBeDefined();
      expect(quiz?.questions).toHaveLength(3);
      
      // All questions should have valid options
      quiz?.questions.forEach(question => {
        expect(question.options).toBeDefined();
        expect(question.options.length).toBeGreaterThanOrEqual(2);
        expect(question.options[0]).toHaveProperty('id');
        expect(question.options[0]).toHaveProperty('text');
        expect(question.options[0]).toHaveProperty('isCorrect');
      });
    });

    it('should extract YouTube ID from various URL formats', async () => {
      mockOrchestrator.checkProviderAvailability.mockResolvedValue(true);
      mockOrchestrator.generateModule.mockResolvedValue({
        module: mockModule,
        content: mockModule.content,
        videos: [
          {
            id: 'video-1',
            title: 'Video 1',
            description: 'Description',
            url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
          },
          {
            id: 'video-2',
            title: 'Video 2',
            description: 'Description',
            url: 'https://youtu.be/dQw4w9WgXcQ'
          },
          {
            id: 'video-3',
            title: 'Video 3',
            description: 'Description',
            url: 'invalid-url'
          }
        ],
        bibliography: [],
        quiz: undefined
      });

      const { result } = renderHook(() => useModuleGenerator());

      await act(async () => {
        await result.current.generateModule(defaultConfig);
      });

      const videos = result.current.generatedModule?.content.videos;
      expect(videos).toHaveLength(3);
      expect(videos?.[0].youtubeId).toBe('dQw4w9WgXcQ');
      expect(videos?.[1].youtubeId).toBe('dQw4w9WgXcQ');
      expect(videos?.[2].youtubeId).toBe('dQw4w9WgXcQ'); // Falls back to default
    });
  });

  describe('regenerateSection', () => {
    it('should regenerate a section', async () => {
      const { result } = renderHook(() => useModuleGenerator());

      // Set a module first
      act(() => {
        result.current.updateGeneratedModule(mockModule);
      });

      await act(async () => {
        await result.current.regenerateSection('section-1');
      });

      const updatedSection = result.current.generatedModule?.content.sections.find(
        section => section.id === 'section-1'
      );

      expect(updatedSection?.content).toContain('[Regenerado]');
      expect(updatedSection?.keyTerms).toHaveLength(2); // Original + new term
      expect(updatedSection?.keyTerms?.[1]).toEqual({
        term: 'Novo Conceito',
        definition: 'Um aspecto recém-descoberto da regeneração'
      });
    });

    it('should do nothing if no module is generated', async () => {
      const { result } = renderHook(() => useModuleGenerator());

      await act(async () => {
        await result.current.regenerateSection('section-1');
      });

      expect(result.current.generatedModule).toBeNull();
    });
  });

  describe('updateGeneratedModule', () => {
    it('should update the generated module', () => {
      const { result } = renderHook(() => useModuleGenerator());

      act(() => {
        result.current.updateGeneratedModule(mockModule);
      });

      expect(result.current.generatedModule).toEqual(mockModule);
    });
  });

  describe('reset', () => {
    it('should reset all state to initial values', async () => {
      mockOrchestrator.checkProviderAvailability.mockResolvedValue(true);
      mockOrchestrator.generateModule.mockResolvedValue({
        module: mockModule,
        content: mockModule.content,
        videos: mockModule.content.videos,
        bibliography: mockModule.content.bibliography,
        quiz: mockModule.content.quiz
      });

      const { result } = renderHook(() => useModuleGenerator());

      // Generate a module first
      await act(async () => {
        await result.current.generateModule({
          subject: 'Test Subject',
          targetAudience: 'students',
          difficulty: 'beginner',
          estimatedTime: 30,
          includeVideos: true,
          includeQuiz: true,
          includeBibliography: true,
        });
      });

      // Verify module was generated
      expect(result.current.generatedModule).not.toBeNull();
      expect(result.current.generationSteps.length).toBeGreaterThan(0);

      // Reset
      act(() => {
        result.current.reset();
      });

      // Verify reset
      expect(result.current.isGenerating).toBe(false);
      expect(result.current.generatedModule).toBeNull();
      expect(result.current.generationSteps).toEqual([]);
      expect(result.current.currentStep).toBe(0);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle error that is not an Error instance', async () => {
      mockOrchestrator.checkProviderAvailability.mockResolvedValue(true);
      mockOrchestrator.generateModule.mockRejectedValue('String error');

      const { result } = renderHook(() => useModuleGenerator());

      await act(async () => {
        await result.current.generateModule({
          subject: 'Test',
          targetAudience: 'students',
          difficulty: 'beginner',
          estimatedTime: 30,
          includeVideos: false,
          includeQuiz: false,
          includeBibliography: false,
        });
      });

      expect(result.current.error).toBe('Falha ao gerar módulo: Erro desconhecido');
    });

    it('should handle video with duration as object', async () => {
      mockOrchestrator.checkProviderAvailability.mockResolvedValue(true);
      mockOrchestrator.generateModule.mockResolvedValue({
        module: mockModule,
        content: mockModule.content,
        videos: [
          {
            id: 'video-1',
            title: 'Video 1',
            youtubeId: 'abc123',
            description: 'Description',
            duration: { minutes: 25 }
          }
        ],
        bibliography: [],
        quiz: undefined
      });

      const { result } = renderHook(() => useModuleGenerator());

      await act(async () => {
        await result.current.generateModule({
          subject: 'Test',
          targetAudience: 'students',
          difficulty: 'beginner',
          estimatedTime: 30,
          includeVideos: true,
          includeQuiz: false,
          includeBibliography: false,
        });
      });

      const video = result.current.generatedModule?.content.videos[0];
      expect(video?.duration).toBe(25);
    });

    it('should handle progress updates for unknown stages', async () => {
      let progressCallback: ((progress: any) => void) | null = null;

      mockOrchestrator.on.mockImplementation((event: string, callback: any) => {
        if (event === 'progress') {
          progressCallback = callback;
        }
      });

      mockOrchestrator.checkProviderAvailability.mockResolvedValue(true);
      mockOrchestrator.generateModule.mockImplementation(async () => {
        // Simulate unknown stage
        if (progressCallback) {
          progressCallback({ stage: 'unknown-stage', message: 'Unknown progress' });
        }
        return {
          module: mockModule,
          content: mockModule.content,
          videos: [],
          bibliography: [],
          quiz: undefined
        };
      });

      const { result } = renderHook(() => useModuleGenerator());

      await act(async () => {
        await result.current.generateModule({
          subject: 'Test',
          targetAudience: 'students',
          difficulty: 'beginner',
          estimatedTime: 30,
          includeVideos: false,
          includeQuiz: false,
          includeBibliography: false,
        });
      });

      // Should handle unknown stage gracefully
      expect(result.current.error).toBeNull();
      expect(result.current.generatedModule).toBeDefined();
    });
  });
});