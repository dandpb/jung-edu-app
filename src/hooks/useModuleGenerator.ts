import { useState, useCallback } from 'react';
import { Module, Section, Question, Quiz } from '../types';
import { GenerationConfig } from '../components/admin/AIModuleGenerator';
import { GenerationStep } from '../components/admin/GenerationProgress';
import { ModuleGenerationOrchestrator, GenerationOptions, GenerationProgress } from '../services/llm/orchestrator';

// Helper function to extract YouTube video ID from URL
const extractYouTubeId = (url: string): string | null => {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

interface UseModuleGeneratorReturn {
  isGenerating: boolean;
  generatedModule: Module | null;
  generationSteps: GenerationStep[];
  currentStep: number;
  error: string | null;
  generateModule: (config: GenerationConfig) => Promise<void>;
  regenerateSection: (sectionId: string) => Promise<void>;
  updateGeneratedModule: (module: Module) => void;
  reset: () => void;
}

// Real AI generation function using LLM orchestrator
const generateAIModule = async (
  config: GenerationConfig,
  onProgress?: (progress: GenerationProgress) => void
): Promise<Module> => {
  const orchestrator = new ModuleGenerationOrchestrator();
  
  // Set up progress listener if provided
  if (onProgress) {
    orchestrator.on('progress', onProgress);
  }
  
  // Convert UI config to orchestrator options
  const generationOptions: GenerationOptions = {
    topic: config.subject,
    objectives: [
      `Understand the fundamental concepts of ${config.subject}`,
      `Apply ${config.subject} principles in practical contexts`,
      `Analyze the role of ${config.subject} in Jungian psychology`
    ],
    targetAudience: config.targetAudience || 'psychology students',
    duration: config.estimatedTime,
    difficulty: config.difficulty,
    includeVideos: config.includeVideos,
    includeBibliography: config.includeBibliography,
    includeMindMap: false, // Mind maps are handled separately
    quizQuestions: config.includeQuiz ? 5 : 0,
    videoCount: config.includeVideos ? 3 : 0,
    bibliographyCount: config.includeBibliography ? 8 : 0,
    useRealServices: true
  };
  
  try {
    // Check if the provider is available before starting generation
    const isProviderAvailable = await orchestrator.checkProviderAvailability();
    console.log('Provider availability check:', isProviderAvailable);
    
    if (!isProviderAvailable) {
      throw new Error('LLM provider is not available. Please check your API key configuration.');
    }
    
    const result = await orchestrator.generateModule(generationOptions);
    
    // Convert orchestrator result to expected Module format
    const module: Module = {
      ...result.module,
      icon: '🧠', // Default icon
      content: {
        ...result.content,
        videos: (result.videos || []).map(video => ({
          id: video.id,
          title: video.title,
          youtubeId: extractYouTubeId(video.url) || 'dQw4w9WgXcQ', // Fallback to a default video
          description: video.description,
          duration: typeof video.duration === 'object' ? video.duration.minutes : video.duration || 15
        })),
        bibliography: result.bibliography || [],
        films: [], // Not currently generated
        quiz: result.quiz ? {
          id: result.quiz.id,
          title: result.quiz.title,
          questions: result.quiz.questions
            .filter(q => q.type === 'multiple-choice' && q.options && q.options.length > 0)
            .map(q => ({
              id: q.id,
              question: q.question,
              options: q.options!, // We filtered to ensure this exists
              correctAnswer: q.correctAnswer || 0,
              explanation: q.explanation || 'No explanation provided'
            }))
        } : undefined
      }
    };
    
    return module;
  } catch (error) {
    console.error('Module generation failed:', error);
    throw new Error(`Failed to generate module: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const useModuleGenerator = (): UseModuleGeneratorReturn => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedModule, setGeneratedModule] = useState<Module | null>(null);
  const [generationSteps, setGenerationSteps] = useState<GenerationStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Add a method to directly set the generated module (for edits)
  const setModule = useCallback((module: Module) => {
    setGeneratedModule(module);
  }, []);

  const generateModule = useCallback(async (config: GenerationConfig) => {
    setIsGenerating(true);
    setError(null);
    
    // Define generation steps that map to the orchestrator stages
    const steps: GenerationStep[] = [
      {
        id: 'initializing',
        label: 'Initializing generation process',
        status: 'pending'
      },
      {
        id: 'content',
        label: 'Generating educational content',
        status: 'pending'
      },
      ...(config.includeQuiz ? [{
        id: 'quiz',
        label: 'Creating assessment questions',
        status: 'pending' as const
      }] : []),
      ...(config.includeVideos ? [{
        id: 'videos',
        label: 'Finding video resources',
        status: 'pending' as const
      }] : []),
      ...(config.includeBibliography ? [{
        id: 'bibliography',
        label: 'Compiling bibliography',
        status: 'pending' as const
      }] : []),
      {
        id: 'finalizing',
        label: 'Finalizing module',
        status: 'pending'
      }
    ];
    
    setGenerationSteps(steps);
    setCurrentStep(0);
    
    try {
      // Generate the module with real LLM calls
      const module = await generateAIModule(config, (progress: GenerationProgress) => {
        // Update steps based on orchestrator progress
        const stageToStepMap: Record<string, string> = {
          'initializing': 'initializing',
          'content': 'content',
          'quiz': 'quiz',
          'videos': 'videos',
          'bibliography': 'bibliography',
          'finalizing': 'finalizing',
          'complete': 'finalizing'
        };
        
        const activeStepId = stageToStepMap[progress.stage] || 'content';
        const stepIndex = steps.findIndex(step => step.id === activeStepId);
        
        if (stepIndex >= 0) {
          setCurrentStep(stepIndex);
          setGenerationSteps(prev => prev.map((step, idx) => ({
            ...step,
            status: idx < stepIndex ? 'completed' : 
                   idx === stepIndex ? 'in-progress' : 'pending',
            message: idx === stepIndex ? progress.message : step.message
          })));
        }
      });
      
      // Mark all steps as completed
      setGenerationSteps(prev => prev.map(step => ({
        ...step,
        status: 'completed'
      })));
      
      setGeneratedModule(module);
    } catch (err) {
      console.error('Module generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate module');
      setGenerationSteps(prev => prev.map((step, idx) => ({
        ...step,
        status: idx === currentStep ? 'error' : step.status,
        message: idx === currentStep ? 'Generation failed' : step.message
      })));
    } finally {
      setIsGenerating(false);
    }
  }, [currentStep]);

  const regenerateSection = useCallback(async (sectionId: string) => {
    if (!generatedModule) return;
    
    // Simulate regenerating a section
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const updatedSections = generatedModule.content.sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          content: `[Regenerated] ${section.content}`,
          keyTerms: [
            ...section.keyTerms || [],
            {
              term: 'New Concept',
              definition: 'A newly discovered aspect from regeneration'
            }
          ]
        };
      }
      return section;
    });
    
    setGeneratedModule({
      ...generatedModule,
      content: {
        ...generatedModule.content,
        sections: updatedSections
      }
    });
  }, [generatedModule]);

  const reset = useCallback(() => {
    setIsGenerating(false);
    setGeneratedModule(null);
    setGenerationSteps([]);
    setCurrentStep(0);
    setError(null);
  }, []);

  return {
    isGenerating,
    generatedModule,
    generationSteps,
    currentStep,
    error,
    generateModule,
    regenerateSection,
    updateGeneratedModule: setModule,
    reset
  };
};