import { useState, useCallback } from 'react';
import { Module, Section, Question, Quiz } from '../types';
import { GenerationConfig } from '../components/admin/AIModuleGenerator';
import { GenerationStep } from '../components/admin/GenerationProgress';
import { ModuleGenerationOrchestrator, GenerationOptions, GenerationProgress } from '../services/llm/orchestrator';

// Função auxiliar para extrair ID do vídeo do YouTube da URL
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

// Função real de geração de IA usando orquestrador LLM
const generateAIModule = async (
  config: GenerationConfig,
  onProgress?: (progress: GenerationProgress) => void
): Promise<Module> => {
  const orchestrator = new ModuleGenerationOrchestrator();
  
  // Configura listener de progresso se fornecido
  if (onProgress) {
    orchestrator.on('progress', onProgress);
  }
  
  // Converte configuração da UI para opções do orquestrador
  const generationOptions: GenerationOptions = {
    topic: config.subject,
    objectives: [
      `Compreender os conceitos fundamentais de ${config.subject}`,
      `Aplicar os princípios de ${config.subject} em contextos práticos`,
      `Analisar o papel de ${config.subject} na psicologia junguiana`
    ],
    targetAudience: config.targetAudience || 'estudantes de psicologia',
    duration: config.estimatedTime,
    difficulty: config.difficulty,
    includeVideos: config.includeVideos,
    includeBibliography: config.includeBibliography,
    includeMindMap: false, // Mapas mentais são tratados separadamente
    quizQuestions: config.includeQuiz ? 5 : 0,
    videoCount: config.includeVideos ? 3 : 0,
    bibliographyCount: config.includeBibliography ? 8 : 0,
    useRealServices: true
  };
  
  try {
    // Verifica se o provedor está disponível antes de iniciar a geração
    const isProviderAvailable = await orchestrator.checkProviderAvailability();
    console.log('Verificação de disponibilidade do provedor:', isProviderAvailable);
    
    if (!isProviderAvailable) {
      throw new Error('O provedor LLM não está disponível. Verifique a configuração da sua chave de API.');
    }
    
    const result = await orchestrator.generateModule(generationOptions);
    
    // Converte resultado do orquestrador para formato Module esperado
    const module: Module = {
      ...result.module,
      icon: '🧠', // Ícone padrão
      content: {
        ...result.content,
        videos: (result.videos || []).map(video => ({
          id: video.id,
          title: video.title,
          youtubeId: video.youtubeId || extractYouTubeId((video as any).url || '') || 'dQw4w9WgXcQ', // Fallback para vídeo padrão
          description: video.description,
          duration: typeof (video as any).duration === 'object' ? (video as any).duration.minutes : video.duration || 15
        })),
        bibliography: result.bibliography || [],
        films: [], // Não gerado atualmente
        quiz: result.quiz ? (() => {
          console.log('🎯 Debug: Quiz received from orchestrator:', {
            hasQuiz: !!result.quiz,
            questionCount: result.quiz?.questions?.length || 0,
            questions: result.quiz?.questions?.map((q: any) => ({
              id: q.id,
              hasQuestion: !!q.question,
              hasOptions: !!q.options,
              optionsCount: q.options?.length || 0,
              type: q.type
            }))
          });
          return {
          id: result.quiz.id,
          title: result.quiz.title,
          questions: result.quiz.questions
            .map((q: any, index: number) => {
              // Ensure we have proper question format
              const questionData = {
                id: q.id || `q-${index + 1}`,
                question: q.question || `Questão ${index + 1}`,
                type: q.type || 'multiple-choice',
                correctAnswer: q.correctAnswer || 0,
                explanation: q.explanation || 'Nenhuma explicação fornecida'
              };

              // Handle options - ensure we always have at least 4 options
              if (q.options && Array.isArray(q.options) && q.options.length >= 2) {
                return {
                  ...questionData,
                  options: q.options.map((opt: any, optIndex: number) => ({
                    id: `${questionData.id}-opt-${optIndex + 1}`,
                    text: typeof opt === 'string' ? opt : opt.text || `Opção ${optIndex + 1}`,
                    isCorrect: optIndex === questionData.correctAnswer
                  }))
                };
              } else {
                // Create fallback options if none exist or malformed
                const fallbackOptions = [
                  'Conceito fundamental da psicologia junguiana',
                  'Aplicação específica da teoria analítica',
                  'Aspecto secundário do desenvolvimento pessoal',
                  'Elemento não relacionado à individuação'
                ];
                
                return {
                  ...questionData,
                  options: fallbackOptions.map((opt, optIndex) => ({
                    id: `${questionData.id}-opt-${optIndex + 1}`,
                    text: opt,
                    isCorrect: optIndex === 0 // First option is correct by default
                  }))
                };
              }
            })
            .filter(q => q && q.question && q.options && q.options.length >= 2) // Only filter out completely invalid questions
          };
        })() : undefined
      }
    };
    
    console.log('🎯 Debug: Final module quiz:', {
      hasQuiz: !!module.content.quiz,
      finalQuestionCount: module.content.quiz?.questions?.length || 0
    });
    
    return module;
  } catch (error) {
    console.error('Falha na geração do módulo:', error);
    throw new Error(`Falha ao gerar módulo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
};

export const useModuleGenerator = (): UseModuleGeneratorReturn => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedModule, setGeneratedModule] = useState<Module | null>(null);
  const [generationSteps, setGenerationSteps] = useState<GenerationStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Adiciona método para definir diretamente o módulo gerado (para edições)
  const setModule = useCallback((module: Module) => {
    setGeneratedModule(module);
  }, []);

  const generateModule = useCallback(async (config: GenerationConfig) => {
    setIsGenerating(true);
    setError(null);
    
    // Define etapas de geração que mapeiam para os estágios do orquestrador
    const steps: GenerationStep[] = [
      {
        id: 'initializing',
        label: 'Inicializando processo de geração',
        status: 'pending'
      },
      {
        id: 'content',
        label: 'Gerando conteúdo educacional',
        status: 'pending'
      },
      ...(config.includeQuiz ? [{
        id: 'quiz',
        label: 'Criando questões de avaliação',
        status: 'pending' as const
      }] : []),
      ...(config.includeVideos ? [{
        id: 'videos',
        label: 'Buscando recursos de vídeo',
        status: 'pending' as const
      }] : []),
      ...(config.includeBibliography ? [{
        id: 'bibliography',
        label: 'Compilando bibliografia',
        status: 'pending' as const
      }] : []),
      {
        id: 'finalizing',
        label: 'Finalizando módulo',
        status: 'pending'
      }
    ];
    
    setGenerationSteps(steps);
    setCurrentStep(0);
    
    try {
      // Gera o módulo com chamadas reais de LLM
      const module = await generateAIModule(config, (progress: GenerationProgress) => {
        // Atualiza etapas baseado no progresso do orquestrador
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
      
      // Marca todas as etapas como concluídas
      setGenerationSteps(prev => prev.map(step => ({
        ...step,
        status: 'completed'
      })));
      
      setGeneratedModule(module);
    } catch (err) {
      console.error('Erro na geração do módulo:', err);
      setError(err instanceof Error ? err.message : 'Falha ao gerar módulo');
      setGenerationSteps(prev => prev.map((step, idx) => ({
        ...step,
        status: idx === currentStep ? 'error' : step.status,
        message: idx === currentStep ? 'Falha na geração' : step.message
      })));
    } finally {
      setIsGenerating(false);
    }
  }, [currentStep]);

  const regenerateSection = useCallback(async (sectionId: string) => {
    if (!generatedModule) return;
    
    // Simula regeneração de uma seção
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const updatedSections = generatedModule.content.sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          content: `[Regenerado] ${section.content}`,
          keyTerms: [
            ...section.keyTerms || [],
            {
              term: 'Novo Conceito',
              definition: 'Um aspecto recém-descoberto da regeneração'
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