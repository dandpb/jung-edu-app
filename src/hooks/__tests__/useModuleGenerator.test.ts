import { renderHook, act, waitFor } from '@testing-library/react';
import { useModuleGenerator } from '../useModuleGenerator';
import { GenerationConfig } from '../../components/admin/AIModuleGenerator';
import { ModuleGenerationOrchestrator, GenerationProgress } from '../../services/llm/orchestrator';
import { Module } from '../../types';

// Mock the orchestrator module completely
jest.mock('../../services/llm/orchestrator');

// Mock timers for testing async operations
jest.useFakeTimers('modern');

describe('useModuleGenerator', () => {
  const mockOrchestrator = {
    on: jest.fn(),
    off: jest.fn(),
    checkProviderAvailability: jest.fn(),
    generateModule: jest.fn(),
    removeAllListeners: jest.fn(),
  };

  const defaultConfig: GenerationConfig = {
    subject: 'Psicologia Analítica',
    targetAudience: 'estudantes de psicologia',
    difficulty: 'intermediate',
    estimatedTime: 60,
    includeVideos: true,
    includeQuiz: true,
    includeBibliography: true,
    prerequisites: []
  };

  const mockModule: Module = {
    id: 'test-module-1',
    title: 'Test Module',
    description: 'A test module',
    estimatedTime: 60,
    difficulty: 'intermediate',
    learningObjectives: ['Test objective 1', 'Test objective 2'],
    icon: '🧠',
    content: {
      introduction: 'Test introduction',
      sections: [
        {
          id: 'section-1',
          title: 'Section 1',
          content: 'Section 1 content',
          order: 0,
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
          id: 'bib-1',
          title: 'Test Book',
          authors: ['Jung, C.G.'],
          year: 1950,
          type: 'book',
          url: 'https://example.com'
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
    jest.clearAllTimers();
    (ModuleGenerationOrchestrator as jest.Mock).mockImplementation(() => mockOrchestrator);
    
    // Reset mock implementations
    mockOrchestrator.on.mockImplementation(() => {});
    mockOrchestrator.off.mockImplementation(() => {});
    mockOrchestrator.removeAllListeners.mockImplementation(() => {});
    mockOrchestrator.checkProviderAvailability.mockResolvedValue(true);
    mockOrchestrator.generateModule.mockResolvedValue({
      module: mockModule,
      content: mockModule.content,
      videos: mockModule.content?.videos || [],
      bibliography: mockModule.content?.bibliography || [],
      quiz: mockModule.content?.quiz
    });
  });
  
  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
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

    it('should provide all expected hook interface methods', () => {
      const { result } = renderHook(() => useModuleGenerator());

      expect(typeof result.current.generateModule).toBe('function');
      expect(typeof result.current.regenerateSection).toBe('function');
      expect(typeof result.current.updateGeneratedModule).toBe('function');
      expect(typeof result.current.reset).toBe('function');
    });
  });

  describe('generateModule', () => {
    it('should generate a module successfully', async () => {
      mockOrchestrator.checkProviderAvailability.mockResolvedValue(true);
      mockOrchestrator.generateModule.mockResolvedValue({
        module: mockModule,
        content: mockModule.content,
        videos: mockModule.content?.videos,
        bibliography: mockModule.content?.bibliography,
        quiz: mockModule.content?.quiz
      });

      const { result } = renderHook(() => useModuleGenerator());

      await act(async () => {
        await result.current.generateModule(defaultConfig);
      });

      expect(result.current.isGenerating).toBe(false);
      expect(result.current.generatedModule).toMatchObject(expect.objectContaining({
        id: 'test-module-1',
        title: 'Test Module',
        content: expect.objectContaining({
          quiz: expect.objectContaining({
            id: 'quiz-1',
            title: 'Test Quiz'
          })
        })
      }));
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
      expect(result.current.error).toContain('O provedor LLM não está disponível');
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

    it('should create generation steps based on config', async () => {
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

      const stepIds = result.current.generationSteps.map(step => step.id);
      expect(stepIds).toContain('initializing');
      expect(stepIds).toContain('content');
      expect(stepIds).toContain('finalizing');
      expect(stepIds).not.toContain('quiz');
      expect(stepIds).not.toContain('videos');
      expect(stepIds).not.toContain('bibliography');
    });

    it('should create conditional generation steps based on config flags', async () => {
      const configWithAllOptions: GenerationConfig = {
        subject: 'Full Test Subject',
        targetAudience: 'students', 
        difficulty: 'advanced',
        estimatedTime: 90,
        includeVideos: true,
        includeQuiz: true,
        includeBibliography: true,
        prerequisites: []
      };

      const { result } = renderHook(() => useModuleGenerator());

      await act(async () => {
        await result.current.generateModule(configWithAllOptions);
      });

      const stepIds = result.current.generationSteps.map(step => step.id);
      expect(stepIds).toContain('quiz');
      expect(stepIds).toContain('videos');
      expect(stepIds).toContain('bibliography');
      expect(stepIds).toHaveLength(6); // initializing, content, quiz, videos, bibliography, finalizing
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
            {
              id: 'q-1',
              question: 'Test question?',
              type: 'multiple-choice',
              options: null,
              correctAnswer: 0,
              explanation: 'Test explanation'
            },
            {
              id: 'q-2',
              question: 'Another question?',
              type: 'multiple-choice',
              options: [],
              correctAnswer: 0,
              explanation: 'Another explanation'
            },
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

      const quiz = result.current.generatedModule?.content?.quiz;
      expect(quiz).toBeDefined();
      expect(quiz?.questions).toHaveLength(3);
      
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

      const videos = result.current.generatedModule?.content?.videos;
      expect(videos).toHaveLength(3);
      expect(videos?.[0].youtubeId).toBe('dQw4w9WgXcQ');
      expect(videos?.[1].youtubeId).toBe('dQw4w9WgXcQ');
      expect(videos?.[2].youtubeId).toBe('dQw4w9WgXcQ'); // Falls back to default
    });
  });

  describe('regenerateSection', () => {
    it('should regenerate a section', async () => {
      const { result } = renderHook(() => useModuleGenerator());

      act(() => {
        result.current.updateGeneratedModule(mockModule);
      });

      // Fast-forward through the regeneration timeout
      act(() => {
        jest.advanceTimersByTime(1500);
      });

      await act(async () => {
        await result.current.regenerateSection('section-1');
      });

      const updatedSection = result.current.generatedModule?.content?.sections?.find(
        section => section.id === 'section-1'
      );

      expect(updatedSection?.content).toContain('[Regenerado]');
      expect(updatedSection?.keyTerms).toHaveLength(2);
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

    it('should handle section regeneration for non-existent section', async () => {
      const { result } = renderHook(() => useModuleGenerator());

      act(() => {
        result.current.updateGeneratedModule(mockModule);
      });

      await act(async () => {
        await result.current.regenerateSection('non-existent-section');
      });

      const sections = result.current.generatedModule?.content?.sections;
      expect(sections?.[0].content).not.toContain('[Regenerado]');
    });

    it('should handle regeneration when module has no content', () => {
      const moduleWithoutContent = { ...mockModule, content: undefined };
      const { result } = renderHook(() => useModuleGenerator());

      act(() => {
        result.current.updateGeneratedModule(moduleWithoutContent);
      });

      expect(result.current.generatedModule).toBeDefined();
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

    it('should handle updateGeneratedModule with null', () => {
      const { result } = renderHook(() => useModuleGenerator());
      
      act(() => {
        result.current.updateGeneratedModule(mockModule);
      });
      
      expect(result.current.generatedModule).toEqual(mockModule);
      
      act(() => {
        result.current.updateGeneratedModule(null as any);
      });
      
      expect(result.current.generatedModule).toBeNull();
    });
  });

  describe('reset', () => {
    it('should reset all state to initial values', async () => {
      const { result } = renderHook(() => useModuleGenerator());

      await act(async () => {
        await result.current.generateModule(defaultConfig);
      });

      expect(result.current.generatedModule).not.toBeNull();
      expect(result.current.generationSteps.length).toBeGreaterThan(0);

      act(() => {
        result.current.reset();
      });

      expect(result.current.isGenerating).toBe(false);
      expect(result.current.generatedModule).toBeNull();
      expect(result.current.generationSteps).toEqual([]);
      expect(result.current.currentStep).toBe(0);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Edge Cases and Advanced Scenarios', () => {
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
          prerequisites: []
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
          prerequisites: []
        });
      });

      const video = result.current.generatedModule?.content?.videos?.[0];
      expect(video?.duration).toBe(25);
    });

    it('should handle null/undefined module content sections gracefully', async () => {
      mockOrchestrator.checkProviderAvailability.mockResolvedValue(true);
      mockOrchestrator.generateModule.mockResolvedValue({
        module: { ...mockModule, content: undefined },
        content: undefined,
        videos: [],
        bibliography: [],
        quiz: undefined
      });

      const { result } = renderHook(() => useModuleGenerator());

      await act(async () => {
        await result.current.generateModule(defaultConfig);
      });

      expect(result.current.generatedModule).toBeTruthy();
      expect(result.current.error).toBeNull();
    });
  });

  describe('Loading States and Progress Tracking', () => {
    it('should update isGenerating state correctly during generation', async () => {
      let resolveGeneration: (value: any) => void;
      const generationPromise = new Promise(resolve => { resolveGeneration = resolve; });
      
      mockOrchestrator.generateModule.mockReturnValue(generationPromise);
      
      const { result } = renderHook(() => useModuleGenerator());

      expect(result.current.isGenerating).toBe(false);

      act(() => {
        result.current.generateModule(defaultConfig);
      });

      expect(result.current.isGenerating).toBe(true);

      await act(async () => {
        resolveGeneration({
          module: mockModule,
          content: mockModule.content,
          videos: [],
          bibliography: [],
          quiz: undefined
        });
        await generationPromise;
      });

      expect(result.current.isGenerating).toBe(false);
    });

    it('should clear error state when starting new generation', async () => {
      const { result } = renderHook(() => useModuleGenerator());
      
      mockOrchestrator.checkProviderAvailability.mockResolvedValueOnce(false);
      
      await act(async () => {
        await result.current.generateModule(defaultConfig);
      });
      
      expect(result.current.error).toBeTruthy();
      
      mockOrchestrator.checkProviderAvailability.mockResolvedValue(true);
      mockOrchestrator.generateModule.mockResolvedValue({
        module: mockModule,
        content: mockModule.content,
        videos: [],
        bibliography: [],
        quiz: undefined
      });
      
      await act(async () => {
        await result.current.generateModule(defaultConfig);
      });
      
      expect(result.current.error).toBeNull();
    });

    it('should set all steps to completed after successful generation', async () => {
      const { result } = renderHook(() => useModuleGenerator());

      await act(async () => {
        await result.current.generateModule(defaultConfig);
      });

      expect(result.current.generationSteps.every(step => step.status === 'completed')).toBe(true);
    });

    it('should mark current step as error on failure', async () => {
      mockOrchestrator.checkProviderAvailability.mockResolvedValue(true);
      mockOrchestrator.generateModule.mockRejectedValue(new Error('Generation failed'));

      const { result } = renderHook(() => useModuleGenerator());

      await act(async () => {
        await result.current.generateModule(defaultConfig);
      });

      const errorStep = result.current.generationSteps.find(step => step.status === 'error');
      expect(errorStep).toBeDefined();
      expect(errorStep?.message).toBe('Falha na geração');
    });
  });

  describe('Memory Management and Cleanup', () => {
    it('should handle orchestrator cleanup on unmount', () => {
      const { unmount } = renderHook(() => useModuleGenerator());
      
      expect(() => unmount()).not.toThrow();
    });

    it('should maintain referential stability of callback functions', () => {
      const { result, rerender } = renderHook(() => useModuleGenerator());
      
      const firstGenerateModule = result.current.generateModule;
      const firstRegenerateSection = result.current.regenerateSection;
      const firstReset = result.current.reset;
      const firstUpdateGeneratedModule = result.current.updateGeneratedModule;
      
      rerender();
      
      expect(result.current.generateModule).toBe(firstGenerateModule);
      expect(result.current.regenerateSection).toBe(firstRegenerateSection);
      expect(result.current.reset).toBe(firstReset);
      expect(result.current.updateGeneratedModule).toBe(firstUpdateGeneratedModule);
    });
  });

  describe('State Consistency', () => {
    it('should maintain state consistency during rapid state changes', () => {
      const { result } = renderHook(() => useModuleGenerator());
      
      act(() => {
        result.current.updateGeneratedModule(mockModule);
        result.current.reset();
        result.current.updateGeneratedModule(mockModule);
      });
      
      expect(result.current.generatedModule).toEqual(mockModule);
    });
  });
});