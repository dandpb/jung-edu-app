import React, { useState, useCallback } from 'react';
import { Brain, Settings, Play, BarChart3, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { AutomaticQuizOrchestrator, AutoQuizGenerationOptions, QuizGenerationResult } from '../../services/quiz/automaticQuizOrchestrator';
import { contentAnalyzer } from '../../services/quiz/contentAnalyzer';
import { LLMProviderFactory } from '../../services/llm/provider';
import { Quiz } from '../../types';

interface AutomaticQuizGeneratorProps {
  onQuizGenerated: (quiz: Quiz) => void;
  moduleContent?: string;
  moduleTopic?: string;
  learningObjectives?: string[];
}

interface GenerationStep {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  message: string;
  duration?: number;
}

const AutomaticQuizGenerator: React.FC<AutomaticQuizGeneratorProps> = ({
  onQuizGenerated,
  moduleContent = '',
  moduleTopic = '',
  learningObjectives = []
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationOptions, setGenerationOptions] = useState<AutoQuizGenerationOptions>({
    questionCount: 10,
    targetDifficulty: 'intermediate',
    includeEssayQuestions: false,
    adaptiveDifficulty: true,
    qualityThreshold: 75,
    maxRetries: 3,
    language: 'pt-BR',
    cognitiveDistribution: {
      recall: 0.2,
      understanding: 0.4,
      application: 0.3,
      analysis: 0.1
    }
  });
  const [generationSteps, setGenerationSteps] = useState<GenerationStep[]>([]);
  const [generationResult, setGenerationResult] = useState<QuizGenerationResult | null>(null);
  const [contentPreview, setContentPreview] = useState<any>(null);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // Initialize orchestrator
  const orchestrator = new AutomaticQuizOrchestrator(LLMProviderFactory.getProvider());

  /**
   * Quick content analysis for preview
   */
  const analyzeContentPreview = useCallback(async () => {
    if (!moduleContent || !moduleTopic) return;

    try {
      const preview = await contentAnalyzer.quickAnalysis(moduleContent, moduleTopic);
      setContentPreview(preview);
    } catch (error) {
      console.error('Error in content preview:', error);
    }
  }, [moduleContent, moduleTopic]);

  /**
   * Main quiz generation function
   */
  const generateAutomaticQuiz = async () => {
    if (!moduleContent || !moduleTopic) {
      alert('Conteúdo do módulo e tópico são obrigatórios');
      return;
    }

    setIsGenerating(true);
    setGenerationResult(null);
    
    // Initialize generation steps
    const steps: GenerationStep[] = [
      { name: 'content-analysis', status: 'pending', message: 'Analisando conteúdo...' },
      { name: 'question-generation', status: 'pending', message: 'Gerando questões...' },
      { name: 'enhancement', status: 'pending', message: 'Aprimorando questões...' },
      { name: 'validation', status: 'pending', message: 'Validando qualidade...' },
      { name: 'finalization', status: 'pending', message: 'Finalizando quiz...' }
    ];
    setGenerationSteps(steps);

    try {
      // Update step function
      const updateStep = (stepName: string, status: GenerationStep['status'], message: string, duration?: number) => {
        setGenerationSteps(prev => prev.map(step => 
          step.name === stepName 
            ? { ...step, status, message, duration }
            : step
        ));
      };

      // Step 1: Content Analysis
      updateStep('content-analysis', 'running', 'Analisando estrutura do conteúdo...');
      const analysisStart = Date.now();
      
      // Simulate progressive analysis updates
      setTimeout(() => updateStep('content-analysis', 'running', 'Extraindo conceitos-chave...'), 1000);
      setTimeout(() => updateStep('content-analysis', 'running', 'Avaliando nível de dificuldade...'), 2000);
      
      const analysisResult = await contentAnalyzer.analyzeContent(moduleContent, moduleTopic, generationOptions.language);
      const analysisTime = Date.now() - analysisStart;
      updateStep('content-analysis', 'completed', `Análise concluída: ${analysisResult.keyConcepts.length} conceitos identificados`, analysisTime);

      // Step 2: Question Generation
      updateStep('question-generation', 'running', 'Iniciando geração de questões...');
      const generationStart = Date.now();
      
      setTimeout(() => updateStep('question-generation', 'running', 'Aplicando templates especializados...'), 500);
      setTimeout(() => updateStep('question-generation', 'running', 'Criando distratores plausíveis...'), 1500);

      const result = await orchestrator.generateAutomaticQuiz(
        `module-${Date.now()}`,
        moduleTopic,
        moduleContent,
        learningObjectives,
        generationOptions
      );

      const generationTime = Date.now() - generationStart;
      updateStep('question-generation', 'completed', `${result.quiz.questions.length} questões geradas`, generationTime);

      // Step 3: Enhancement
      updateStep('enhancement', 'running', 'Aprimorando qualidade das questões...');
      setTimeout(() => updateStep('enhancement', 'completed', 'Questões aprimoradas com sucesso', 800), 800);

      // Step 4: Validation
      updateStep('validation', 'running', 'Validando qualidade do quiz...');
      setTimeout(() => {
        const score = result.analytics.finalQualityScore;
        const message = score >= 80 ? `Excelente qualidade (${score}%)` : 
                       score >= 70 ? `Boa qualidade (${score}%)` : 
                       `Qualidade moderada (${score}%)`;
        updateStep('validation', 'completed', message, 600);
      }, 600);

      // Step 5: Finalization
      updateStep('finalization', 'running', 'Preparando quiz final...');
      setTimeout(() => updateStep('finalization', 'completed', 'Quiz pronto para uso!', 400), 400);

      setGenerationResult(result);
      
      // Pass quiz to parent component
      setTimeout(() => {
        onQuizGenerated(result.quiz);
      }, 1000);

    } catch (error) {
      console.error('Error generating quiz:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      // Mark current running step as error
      setGenerationSteps(prev => prev.map(step => 
        step.status === 'running' 
          ? { ...step, status: 'error', message: `Erro: ${errorMessage}` }
          : step
      ));
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Render generation step
   */
  const renderStep = (step: GenerationStep, index: number) => {
    const getIcon = () => {
      switch (step.status) {
        case 'completed':
          return <CheckCircle className="w-5 h-5 text-green-600" />;
        case 'running':
          return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
        case 'error':
          return <AlertCircle className="w-5 h-5 text-red-600" />;
        default:
          return <div className="w-5 h-5 rounded-full bg-gray-300" />;
      }
    };

    const getTextColor = () => {
      switch (step.status) {
        case 'completed':
          return 'text-green-700';
        case 'running':
          return 'text-blue-700';
        case 'error':
          return 'text-red-700';
        default:
          return 'text-gray-500';
      }
    };

    return (
      <div key={step.name} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
        {getIcon()}
        <div className="flex-1">
          <div className={`font-medium ${getTextColor()}`}>
            {step.message}
          </div>
          {step.duration && (
            <div className="text-sm text-gray-500">
              Concluído em {(step.duration / 1000).toFixed(1)}s
            </div>
          )}
        </div>
      </div>
    );
  };

  // Auto-analyze content when it changes
  React.useEffect(() => {
    analyzeContentPreview();
  }, [analyzeContentPreview]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Brain className="w-8 h-8 text-blue-600" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Gerador Automático de Quiz
          </h2>
          <p className="text-gray-600">
            Gere quizzes inteligentes usando IA avançada
          </p>
        </div>
      </div>

      {/* Content Preview */}
      {contentPreview && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">📊 Análise do Conteúdo</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">Tópicos principais:</span>
              <div className="text-blue-700">
                {contentPreview.keyTopics.slice(0, 3).join(', ')}
              </div>
            </div>
            <div>
              <span className="font-medium">Dificuldade estimada:</span>
              <div className="text-blue-700 capitalize">
                {contentPreview.estimatedDifficulty}
              </div>
            </div>
            <div>
              <span className="font-medium">Questões sugeridas:</span>
              <div className="text-blue-700">
                {contentPreview.suggestedQuestionCount}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generation Options */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Configurações de Geração</h3>
          <button
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            className="text-blue-600 hover:text-blue-700 flex items-center space-x-1"
          >
            <Settings className="w-4 h-4" />
            <span>{showAdvancedOptions ? 'Ocultar' : 'Avançado'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Basic Options */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de Questões
              </label>
              <input
                type="number"
                min="5"
                max="20"
                value={generationOptions.questionCount}
                onChange={(e) => setGenerationOptions(prev => ({
                  ...prev,
                  questionCount: parseInt(e.target.value) || 10
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nível de Dificuldade
              </label>
              <select
                value={generationOptions.targetDifficulty}
                onChange={(e) => setGenerationOptions(prev => ({
                  ...prev,
                  targetDifficulty: e.target.value as any
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="beginner">Iniciante</option>
                <option value="intermediate">Intermediário</option>
                <option value="advanced">Avançado</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="includeEssay"
                checked={generationOptions.includeEssayQuestions}
                onChange={(e) => setGenerationOptions(prev => ({
                  ...prev,
                  includeEssayQuestions: e.target.checked
                }))}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="includeEssay" className="text-sm text-gray-700">
                Incluir questões dissertativas
              </label>
            </div>
          </div>

          {/* Advanced Options */}
          {showAdvancedOptions && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Limiar de Qualidade (%)
                </label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={generationOptions.qualityThreshold}
                  onChange={(e) => setGenerationOptions(prev => ({
                    ...prev,
                    qualityThreshold: parseInt(e.target.value) || 75
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Máximo de Tentativas
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={generationOptions.maxRetries}
                  onChange={(e) => setGenerationOptions(prev => ({
                    ...prev,
                    maxRetries: parseInt(e.target.value) || 3
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="adaptiveDifficulty"
                  checked={generationOptions.adaptiveDifficulty}
                  onChange={(e) => setGenerationOptions(prev => ({
                    ...prev,
                    adaptiveDifficulty: e.target.checked
                  }))}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="adaptiveDifficulty" className="text-sm text-gray-700">
                  Dificuldade adaptativa
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Generation Progress */}
      {generationSteps.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Progresso da Geração
          </h3>
          <div className="space-y-3">
            {generationSteps.map((step, index) => renderStep(step, index))}
          </div>
        </div>
      )}

      {/* Generation Results */}
      {generationResult && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-900 mb-4">
            ✅ Quiz Gerado com Sucesso!
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-green-800 mb-2">Estatísticas</h4>
              <ul className="space-y-1 text-sm text-green-700">
                <li>• {generationResult.quiz.questions.length} questões geradas</li>
                <li>• Qualidade: {generationResult.analytics.finalQualityScore}%</li>
                <li>• Tentativas: {generationResult.analytics.generationAttempts}</li>
                <li>• Tempo: {(generationResult.analytics.timeTaken / 1000).toFixed(1)}s</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-green-800 mb-2">Conceitos Analisados</h4>
              <div className="text-sm text-green-700">
                {generationResult.analytics.contentAnalysis.keyConcepts?.slice(0, 5).join(', ')}
                {(generationResult.analytics.contentAnalysis.keyConcepts?.length || 0) > 5 && '...'}
              </div>
            </div>
          </div>
          
          {generationResult.analytics.improvementSuggestions.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-green-800 mb-2">Sugestões de Melhoria</h4>
              <ul className="space-y-1 text-sm text-green-700">
                {generationResult.analytics.improvementSuggestions.slice(0, 3).map((suggestion, index) => (
                  <li key={index}>• {suggestion}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Generate Button */}
      <div className="flex justify-center">
        <button
          onClick={generateAutomaticQuiz}
          disabled={isGenerating || !moduleContent || !moduleTopic}
          className="btn-primary flex items-center space-x-2 px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Gerando Quiz...</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              <span>Gerar Quiz Automaticamente</span>
            </>
          )}
        </button>
      </div>

      {/* Analytics Button */}
      {generationResult && (
        <div className="flex justify-center mt-4">
          <button
            onClick={() => {
              // This could open a detailed analytics modal
              console.log('Analytics:', generationResult.analytics);
            }}
            className="text-blue-600 hover:text-blue-700 flex items-center space-x-1"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Ver Análise Detalhada</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default AutomaticQuizGenerator;