import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Module, UserProgress, InteractiveVisualization as IVisualization, Video } from '../types';
import EnhancedQuizComponent from '../components/quiz/EnhancedQuizComponent';
import InteractiveVisualization from '../components/visualizations/InteractiveVisualization';
import MultimediaPlayer from '../components/multimedia/MultimediaPlayer';
import DiscussionForum from '../components/forum/DiscussionForum';
import { 
  BookOpen, 
  Clock, 
  Target, 
  Users,
  MessageSquare,
  Play,
  Brain,
  Award,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Eye,
  Lightbulb
} from 'lucide-react';

interface EnhancedModulePageProps {
  modules: Module[];
  userProgress: UserProgress;
  updateProgress: (updates: Partial<UserProgress>) => void;
}

const EnhancedModulePage: React.FC<EnhancedModulePageProps> = ({
  modules,
  userProgress,
  updateProgress
}) => {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'content' | 'video' | 'quiz' | 'discussion' | 'visualization'>('content');
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [currentNote, setCurrentNote] = useState('');

  const module = modules.find(m => m.id === moduleId);
  const isCompleted = userProgress.completedModules.includes(moduleId || '');
  const previousScore = moduleId ? userProgress.quizScores[moduleId] : undefined;

  // Sample interactive visualization for Jung concepts
  const sampleVisualization: IVisualization = {
    id: 'archetype-mandala',
    type: 'archetype-mandala',
    title: 'Mandala dos Arquétipos',
    description: 'Explore interativamente os principais arquétipos de Jung e suas relações',
    config: {
      dimensions: { width: 800, height: 600 },
      interactivity: true,
      animations: true,
      customizations: {}
    },
    data: {
      archetypes: [
        { name: 'The Self', color: '#FFD700', size: 40, x: 400, y: 300 },
        { name: 'Shadow', color: '#696969', size: 30, x: 300, y: 400 },
        { name: 'Anima', color: '#FF69B4', size: 25, x: 500, y: 200 },
        { name: 'Animus', color: '#4169E1', size: 25, x: 300, y: 200 },
        { name: 'Persona', color: '#32CD32', size: 20, x: 500, y: 400 }
      ]
    },
    interactions: [
      {
        trigger: 'click',
        action: 'modal',
        parameters: { showDetails: true }
      }
    ]
  };

  // Sample enhanced video data
  const sampleVideo: Video = {
    id: 'jung-intro-enhanced',
    title: 'Introdução Aprofundada aos Conceitos de Jung',
    youtubeId: 'wreioVJmhAI',
    description: 'Uma exploração detalhada dos principais conceitos da psicologia junguiana',
    duration: 1800, // 30 minutes
    chapters: [
      { id: 'ch1', title: 'Biografia de Jung', startTime: 0, endTime: 300 },
      { id: 'ch2', title: 'Inconsciente Coletivo', startTime: 300, endTime: 900 },
      { id: 'ch3', title: 'Arquétipos Principais', startTime: 900, endTime: 1500 },
      { id: 'ch4', title: 'Processo de Individuação', startTime: 1500, endTime: 1800 }
    ],
    keyMoments: [
      {
        timestamp: 180,
        title: 'Ruptura com Freud',
        description: 'O momento decisivo na carreira de Jung',
        type: 'concept',
        relatedConcepts: ['analytical-psychology', 'psychoanalysis']
      },
      {
        timestamp: 600,
        title: 'Definição de Arquétipo',
        description: 'Jung explica o conceito fundamental de arquétipo',
        type: 'concept',
        relatedConcepts: ['archetypes', 'collective-unconscious']
      }
    ]
  };

  useEffect(() => {
    if (!module) {
      navigate('/dashboard');
      return;
    }
  }, [module, navigate]);

  if (!module) {
    return <div>Módulo não encontrado</div>;
  }

  const handleQuizComplete = (score: number, analytics: any) => {
    const newScores = { ...userProgress.quizScores, [module.id]: score };
    const newCompletedModules = isCompleted 
      ? userProgress.completedModules 
      : [...userProgress.completedModules, module.id];

    updateProgress({
      quizScores: newScores,
      completedModules: newCompletedModules,
      totalTime: userProgress.totalTime + 30 // Add 30 minutes for quiz completion
    });

    setShowQuiz(false);
  };

  const handleVisualizationInteraction = (interaction: string, data: any) => {
    console.log('Visualization interaction:', interaction, data);
    // Here you could track user interactions for analytics
  };

  const handleNoteCreate = (note: any) => {
    const newNote = {
      id: Date.now().toString(),
      moduleId: module.id,
      content: note.content,
      timestamp: Date.now(),
      type: note.type,
      tags: note.tags
    };

    const updatedNotes = [...userProgress.notes, newNote];
    updateProgress({ notes: updatedNotes });
  };

  const nextModule = modules.find((m, index) => {
    const currentIndex = modules.findIndex(mod => mod.id === module.id);
    return index === currentIndex + 1;
  });

  const prevModule = modules.find((m, index) => {
    const currentIndex = modules.findIndex(mod => mod.id === module.id);
    return index === currentIndex - 1;
  });

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      beginner: 'bg-green-100 text-green-800',
      intermediate: 'bg-yellow-100 text-yellow-800',
      advanced: 'bg-red-100 text-red-800'
    };
    return colors[difficulty as keyof typeof colors] || colors.intermediate;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-primary-600 hover:text-primary-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Painel
          </button>
          
          <div className="flex items-center space-x-2">
            {isCompleted && (
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Concluído</span>
              </div>
            )}
            {previousScore && (
              <div className="flex items-center space-x-2 text-blue-600">
                <Award className="w-5 h-5" />
                <span className="text-sm font-medium">{previousScore}%</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-4">
                <span className="text-4xl">{module.icon}</span>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{module.title}</h1>
                  <p className="text-gray-600 mt-1">{module.description}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{formatTime(module.estimatedTime)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Target className="w-4 h-4" />
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(module.difficulty)}`}>
                    {module.difficulty}
                  </span>
                </div>
                {module.sections && (
                  <div className="flex items-center space-x-1">
                    <BookOpen className="w-4 h-4" />
                    <span>{module.sections.length} seções</span>
                  </div>
                )}
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>42 estudantes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'content', label: 'Conteúdo', icon: BookOpen },
              { id: 'video', label: 'Vídeo', icon: Play },
              { id: 'visualization', label: 'Visualização', icon: Brain },
              { id: 'quiz', label: 'Quiz', icon: Target },
              { id: 'discussion', label: 'Discussão', icon: MessageSquare }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3">
          {activeTab === 'content' && (
            <div className="space-y-8">
              {/* Introduction */}
              {module.content?.introduction && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Introdução</h2>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 leading-relaxed">
                      {module.content.introduction}
                    </p>
                  </div>
                </div>
              )}

              {/* Sections */}
              {module.content?.sections?.map((section, index) => (
                <div key={section.id} className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {index + 1}. {section.title}
                    </h3>
                    {section.estimatedTime && (
                      <span className="text-sm text-gray-500 flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {formatTime(section.estimatedTime)}
                      </span>
                    )}
                  </div>
                  
                  <div className="prose max-w-none mb-6">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {section.content}
                    </p>
                  </div>

                  {/* Key Terms */}
                  {section.keyTerms && section.keyTerms.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-medium text-gray-900 mb-3">Termos-chave:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {section.keyTerms.map((term, termIndex) => (
                          <div key={termIndex} className="p-3 bg-blue-50 rounded-lg">
                            <dt className="font-medium text-blue-900">{term.term}</dt>
                            <dd className="text-sm text-blue-800 mt-1">{term.definition}</dd>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Interactive Elements */}
                  {section.interactiveElements && section.interactiveElements.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                        <Lightbulb className="w-4 h-4 mr-2" />
                        Elementos Interativos:
                      </h4>
                      <div className="space-y-3">
                        {section.interactiveElements.map((element, elemIndex) => (
                          <div key={elemIndex} className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <h5 className="font-medium text-yellow-900">{element.title}</h5>
                            <p className="text-sm text-yellow-800 mt-1">{element.description}</p>
                            <button className="mt-2 text-yellow-600 hover:text-yellow-700 text-sm font-medium">
                              Explorar →
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Learning Objectives */}
              {module.learningObjectives && module.learningObjectives.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-green-900 mb-4">
                    Objetivos de Aprendizado
                  </h3>
                  <ul className="space-y-2">
                    {module.learningObjectives.map((objective, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                        <span className="text-green-800">{objective}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'video' && (
            <div className="space-y-6">
              <MultimediaPlayer
                video={sampleVideo}
                onNoteCreate={handleNoteCreate}
                showNotes={true}
                showBookmarks={true}
                allowNoteCreation={true}
              />
            </div>
          )}

          {activeTab === 'visualization' && (
            <div className="space-y-6">
              <InteractiveVisualization
                visualization={sampleVisualization}
                onInteraction={handleVisualizationInteraction}
              />
            </div>
          )}

          {activeTab === 'quiz' && module.content?.quiz && (
            <div className="space-y-6">
              <EnhancedQuizComponent
                quiz={module.content.quiz}
                onComplete={handleQuizComplete}
                userProgress={userProgress}
                adaptiveMode={true}
                showTimer={true}
                allowReview={true}
              />
            </div>
          )}

          {activeTab === 'discussion' && (
            <div className="space-y-6">
              <DiscussionForum
                moduleId={module.id}
                category="module-questions"
              />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="space-y-6">
            {/* Progress */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Seu Progresso</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Conclusão do Módulo</span>
                    <span>{isCompleted ? '100%' : '0%'}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: isCompleted ? '100%' : '0%' }}
                    />
                  </div>
                </div>
                
                {previousScore && (
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Melhor Pontuação</span>
                      <span>{previousScore}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${previousScore}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Notes */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Anotações Rápidas</h3>
              
              <textarea
                value={currentNote}
                onChange={(e) => setCurrentNote(e.target.value)}
                placeholder="Adicione suas anotações..."
                className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                rows={4}
              />
              
              <button
                onClick={() => {
                  if (currentNote.trim()) {
                    handleNoteCreate({
                      content: currentNote,
                      type: 'note',
                      tags: [module.category || 'general']
                    });
                    setCurrentNote('');
                  }
                }}
                className="w-full mt-3 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Salvar Nota
              </button>
            </div>

            {/* Navigation */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Navegação</h3>
              
              <div className="space-y-3">
                {prevModule && (
                  <button
                    onClick={() => navigate(`/module/${prevModule.id}`)}
                    className="w-full flex items-center justify-between p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      <span className="text-sm">Anterior</span>
                    </div>
                    <span className="text-xs text-gray-500 truncate ml-2">
                      {prevModule.title}
                    </span>
                  </button>
                )}
                
                {nextModule && (
                  <button
                    onClick={() => navigate(`/module/${nextModule.id}`)}
                    className="w-full flex items-center justify-between p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center">
                      <span className="text-sm">Próximo</span>
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </div>
                    <span className="text-xs text-gray-500 truncate ml-2">
                      {nextModule.title}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedModulePage;