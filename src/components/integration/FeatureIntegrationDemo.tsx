import React, { useState, useEffect } from 'react';
import { Module, UserProgress, InteractiveVisualization as IVisualization, Video, Quiz } from '../../types';
import EnhancedQuizComponent from '../quiz/EnhancedQuizComponent';
import InteractiveVisualization from '../visualizations/InteractiveVisualization';
import MultimediaPlayer from '../multimedia/MultimediaPlayer';
import DiscussionForum from '../forum/DiscussionForum';
import AchievementSystem from '../gamification/AchievementSystem';
import AnalyticsPanel from '../progress/AnalyticsPanel';
import AdaptiveLearningEngine from '../../services/adaptive/AdaptiveLearningEngine';
import { 
  Brain, 
  Play, 
  MessageSquare, 
  Trophy, 
  BarChart3,
  Target,
  Sparkles,
  Zap,
  BookOpen
} from 'lucide-react';

interface FeatureIntegrationDemoProps {
  userProgress: UserProgress;
  modules: Module[];
  onProgressUpdate: (progress: UserProgress) => void;
}

/**
 * This component demonstrates the integration of all new Jung Educational Platform features:
 * 
 * 1. Enhanced Quiz System with multiple question types and adaptive difficulty
 * 2. Interactive Visualizations for Jung concepts (mandalas, concept maps, timelines)
 * 3. Multimedia Player with note-taking and bookmarking
 * 4. Discussion Forum for community interaction
 * 5. Achievement and Gamification System
 * 6. Detailed Analytics and Progress Tracking
 * 7. Adaptive Learning Algorithm for personalized experiences
 * 8. AI Content Generation Integration
 */
const FeatureIntegrationDemo: React.FC<FeatureIntegrationDemoProps> = ({
  userProgress,
  modules,
  onProgressUpdate
}) => {
  const [activeDemo, setActiveDemo] = useState<'quiz' | 'visualization' | 'video' | 'forum' | 'achievements' | 'analytics'>('quiz');
  const [adaptiveEngine] = useState(() => new AdaptiveLearningEngine());
  const [recommendations, setRecommendations] = useState<Module[]>([]);

  // Sample data for demonstrations
  const sampleQuiz: Quiz = {
    id: 'demo-adaptive-quiz',
    title: 'Quiz Adaptativo sobre Arquétipos',
    description: 'Este quiz adapta sua dificuldade baseado em suas respostas',
    questions: [
      {
        id: 'q1',
        question: 'Qual arquétipo representa a totalidade da psique segundo Jung?',
        type: 'multiple-choice',
        options: [
          { id: 'a', text: 'Shadow', isCorrect: false },
          { id: 'b', text: 'Anima', isCorrect: false },
          { id: 'c', text: 'Self', isCorrect: true },
          { id: 'd', text: 'Persona', isCorrect: false }
        ],
        correctAnswer: 2,
        explanation: 'O Self (Si-mesmo) é o arquétipo central que representa a totalidade e a unificação de todos os aspectos da psique.',
        difficulty: 'intermediate',
        points: 10,
        hints: ['Pense no arquétipo que Jung considerava como o objetivo final da individuação'],
        tags: ['archetypes', 'self', 'individuation']
      },
      {
        id: 'q2',
        question: 'Complete a frase: "A sombra é _______ da personalidade consciente."',
        type: 'fill-in-blank',
        options: [
          { id: 'a', text: 'o aspecto rejeitado', isCorrect: true }
        ],
        correctAnswer: 'o aspecto rejeitado',
        explanation: 'A sombra representa os aspectos da personalidade que foram rejeitados ou reprimidos pela consciência.',
        difficulty: 'beginner',
        points: 8,
        tags: ['shadow', 'consciousness']
      },
      {
        id: 'q3',
        question: 'Selecione todos os elementos que fazem parte do processo de individuação:',
        type: 'multiple-select',
        options: [
          { id: 'a', text: 'Integração da sombra', isCorrect: true },
          { id: 'b', text: 'Encontro com anima/animus', isCorrect: true },
          { id: 'c', text: 'Desenvolvimento da persona', isCorrect: false },
          { id: 'd', text: 'Realização do Self', isCorrect: true }
        ],
        correctAnswer: [0, 1, 3],
        explanation: 'O processo de individuação envolve a integração da sombra, o encontro com anima/animus e a realização do Self. A persona é uma máscara social, não um objetivo da individuação.',
        difficulty: 'advanced',
        points: 15,
        tags: ['individuation', 'shadow', 'anima-animus', 'self']
      }
    ],
    adaptiveSettings: {
      enabled: true,
      difficultyRange: [0.3, 0.9],
      minQuestions: 5,
      maxQuestions: 15,
      targetAccuracy: 0.75
    }
  };

  const sampleVisualization: IVisualization = {
    id: 'jung-psyche-model',
    type: '3d-psyche-model',
    title: 'Modelo Tridimensional da Psique',
    description: 'Explore as diferentes camadas da psique segundo Jung: consciente, inconsciente pessoal e inconsciente coletivo.',
    config: {
      dimensions: { width: 800, height: 600 },
      interactivity: true,
      animations: true,
      customizations: {
        showLabels: true,
        enableRotation: true,
        colorScheme: 'jung-classic'
      }
    },
    data: {
      layers: [
        { name: 'Consciente', depth: 1, color: '#FFD700', elements: ['Ego', 'Percepções', 'Memórias'] },
        { name: 'Inconsciente Pessoal', depth: 2, color: '#9370DB', elements: ['Complexos', 'Memórias Reprimidas'] },
        { name: 'Inconsciente Coletivo', depth: 3, color: '#4169E1', elements: ['Arquétipos', 'Instintos'] }
      ]
    },
    interactions: [
      { trigger: 'click', action: 'expand', parameters: { showDetails: true } },
      { trigger: 'hover', action: 'highlight', parameters: { duration: 500 } }
    ]
  };

  const sampleVideo: Video = {
    id: 'jung-dream-analysis',
    title: 'Análise de Sonhos na Psicologia Junguiana',
    youtubeId: 'sample-dream-analysis',
    description: 'Aprenda as técnicas fundamentais de análise de sonhos desenvolvidas por Jung',
    duration: 2400, // 40 minutes
    chapters: [
      { id: 'intro', title: 'Introdução aos Sonhos', startTime: 0, endTime: 480 },
      { id: 'symbols', title: 'Símbolos e Arquétipos nos Sonhos', startTime: 480, endTime: 1200 },
      { id: 'interpretation', title: 'Técnicas de Interpretação', startTime: 1200, endTime: 1920 },
      { id: 'practice', title: 'Exercícios Práticos', startTime: 1920, endTime: 2400 }
    ],
    keyMoments: [
      {
        timestamp: 300,
        title: 'Diferença entre Freud e Jung',
        description: 'Jung vs Freud na interpretação dos sonhos',
        type: 'concept',
        relatedConcepts: ['dream-analysis', 'freud-comparison']
      },
      {
        timestamp: 800,
        title: 'Arquétipos Comuns em Sonhos',
        description: 'Identificando arquétipos universais',
        type: 'example',
        relatedConcepts: ['archetypes', 'universal-symbols']
      }
    ],
    interactiveElements: [
      {
        id: 'quiz-moment-1',
        timestamp: 600,
        type: 'quiz',
        content: {
          question: 'Qual é a principal diferença entre Jung e Freud na análise de sonhos?',
          options: ['Símbolos sexuais', 'Arquétipos universais', 'Repressão', 'Libido']
        }
      }
    ]
  };

  useEffect(() => {
    // Generate personalized recommendations using adaptive learning
    const recs = adaptiveEngine.recommendContent(userProgress, modules);
    setRecommendations(recs);
  }, [userProgress, modules, adaptiveEngine]);

  const handleQuizComplete = (score: number, analytics: any) => {
    console.log('Quiz completed with score:', score, 'Analytics:', analytics);
    
    // Update user progress with adaptive learning data
    const updatedUserProgress = adaptiveEngine.updateAdaptiveData(userProgress, {
      score,
      concept: 'archetypes',
      difficulty: 0.6,
      timeSpent: analytics.timeSpent / 60 // Convert to minutes
    });
    
    onProgressUpdate(updatedUserProgress);
  };

  const handleVisualizationInteraction = (interaction: string, data: any) => {
    console.log('Visualization interaction:', interaction, data);
    // Track interaction for learning analytics
  };

  const handleNoteCreate = (note: any) => {
    console.log('Note created:', note);
    // Add note to user progress
  };

  const renderDemo = () => {
    switch (activeDemo) {
      case 'quiz':
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">🎯 Sistema de Quiz Aprimorado</h3>
              <p className="text-blue-800 text-sm">
                Experimente nosso quiz adaptativo que ajusta a dificuldade baseado em suas respostas. 
                Inclui múltiplos tipos de questões, dicas contextuais e análise detalhada de desempenho.
              </p>
            </div>
            <EnhancedQuizComponent
              quiz={sampleQuiz}
              onComplete={handleQuizComplete}
              userProgress={userProgress}
              adaptiveMode={true}
              showTimer={true}
              allowReview={true}
            />
          </div>
        );

      case 'visualization':
        return (
          <div className="space-y-6">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold text-purple-900 mb-2">🧠 Visualizações Interativas</h3>
              <p className="text-purple-800 text-sm">
                Explore conceitos junguianos através de visualizações interativas, incluindo mandalas de arquétipos, 
                mapas conceituais, linhas do tempo e modelos 3D da psique.
              </p>
            </div>
            <InteractiveVisualization
              visualization={sampleVisualization}
              onInteraction={handleVisualizationInteraction}
            />
          </div>
        );

      case 'video':
        return (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2">📹 Player Multimídia Avançado</h3>
              <p className="text-green-800 text-sm">
                Player de vídeo com recursos avançados: anotações com timestamp, marcadores, 
                capítulos navegáveis e elementos interativos sincronizados.
              </p>
            </div>
            <MultimediaPlayer
              video={sampleVideo}
              onNoteCreate={handleNoteCreate}
              showNotes={true}
              showBookmarks={true}
              allowNoteCreation={true}
            />
          </div>
        );

      case 'forum':
        return (
          <div className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-900 mb-2">💬 Fórum de Discussão</h3>
              <p className="text-yellow-800 text-sm">
                Participe de discussões com outros estudantes, compartilhe insights sobre sonhos, 
                faça perguntas sobre conceitos e explore estudos de caso colaborativamente.
              </p>
            </div>
            <DiscussionForum
              category="general-discussion"
              className="max-h-96 overflow-y-auto"
            />
          </div>
        );

      case 'achievements':
        return (
          <div className="space-y-6">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="font-semibold text-orange-900 mb-2">🏆 Sistema de Conquistas</h3>
              <p className="text-orange-800 text-sm">
                Sistema completo de gamificação com conquistas baseadas em progresso, conhecimento, 
                engajamento social, exploração e maestria. Inclui níveis, XP e recompensas.
              </p>
            </div>
            <AchievementSystem
              userProgress={userProgress}
              onAchievementUnlock={(achievement) => console.log('Achievement unlocked:', achievement)}
            />
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-6">
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <h3 className="font-semibold text-indigo-900 mb-2">📊 Análise de Progresso</h3>
              <p className="text-indigo-800 text-sm">
                Dashboard completo com métricas de aprendizado, análise de desempenho por conceito, 
                padrões de estudo, recomendações personalizadas e insights comportamentais.
              </p>
            </div>
            <AnalyticsPanel userProgress={userProgress} />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <Sparkles className="w-8 h-8 text-yellow-500 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">
            Demonstração das Funcionalidades Avançadas
          </h1>
          <Sparkles className="w-8 h-8 text-yellow-500 ml-3" />
        </div>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Explore todas as funcionalidades inovadoras da plataforma Jung Educational: 
          quizzes adaptativos, visualizações interativas, player multimídia, fórum colaborativo, 
          sistema de conquistas e análise inteligente de progresso.
        </p>
      </div>

      {/* Feature Navigation */}
      <div className="mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { id: 'quiz', label: 'Quiz Adaptativo', icon: Target, color: 'blue' },
              { id: 'visualization', label: 'Visualizações', icon: Brain, color: 'purple' },
              { id: 'video', label: 'Player Multimídia', icon: Play, color: 'green' },
              { id: 'forum', label: 'Fórum', icon: MessageSquare, color: 'yellow' },
              { id: 'achievements', label: 'Conquistas', icon: Trophy, color: 'orange' },
              { id: 'analytics', label: 'Análise', icon: BarChart3, color: 'indigo' }
            ].map(feature => {
              const Icon = feature.icon;
              const isActive = activeDemo === feature.id;
              
              return (
                <button
                  key={feature.id}
                  onClick={() => setActiveDemo(feature.id as any)}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    isActive
                      ? `border-${feature.color}-500 bg-${feature.color}-50 text-${feature.color}-700`
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Icon className={`w-6 h-6 mx-auto mb-2 ${
                    isActive ? `text-${feature.color}-600` : 'text-gray-600'
                  }`} />
                  <div className={`text-sm font-medium ${
                    isActive ? `text-${feature.color}-900` : 'text-gray-900'
                  }`}>
                    {feature.label}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Adaptive Learning Insights */}
      {recommendations.length > 0 && (
        <div className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-6">
          <div className="flex items-center mb-4">
            <Zap className="w-5 h-5 text-yellow-500 mr-2" />
            <h3 className="font-semibold text-gray-900">Recomendações Personalizadas (IA Adaptativa)</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendations.slice(0, 3).map(module => (
              <div key={module.id} className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-2">{module.icon}</span>
                  <h4 className="font-medium text-gray-900">{module.title}</h4>
                </div>
                <p className="text-sm text-gray-600 mb-3">{module.description}</p>
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    module.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                    module.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {module.difficulty}
                  </span>
                  <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                    Estudar →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Demo Content */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {renderDemo()}
      </div>

      {/* Technical Information */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
          <BookOpen className="w-5 h-5 mr-2" />
          Informações Técnicas
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
          <div>
            <h4 className="font-medium mb-2">Tecnologias Implementadas:</h4>
            <ul className="space-y-1">
              <li>• React 18 com TypeScript</li>
              <li>• D3.js para visualizações interativas</li>
              <li>• Recharts para gráficos de análise</li>
              <li>• Algoritmos de aprendizado adaptativo</li>
              <li>• Sistema de gamificação completo</li>
              <li>• Player de vídeo com recursos avançados</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Funcionalidades Principais:</h4>
            <ul className="space-y-1">
              <li>• Quiz adaptativo com múltiplos tipos</li>
              <li>• Visualizações interativas de conceitos</li>
              <li>• Análise detalhada de progresso</li>
              <li>• Sistema de conquistas e níveis</li>
              <li>• Fórum colaborativo integrado</li>
              <li>• IA para recomendações personalizadas</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureIntegrationDemo;