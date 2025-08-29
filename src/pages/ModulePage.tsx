import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Module, UserProgress, Note } from '../types';
import { 
  ArrowLeft, Clock, BookOpen, PlayCircle, FileText, 
  CheckCircle, Library, Book, Film as FilmIcon, 
  ExternalLink, Calendar, User 
} from 'lucide-react';
import VideoPlayer from '../components/modules/VideoPlayer';
import QuizComponent from '../components/quiz/QuizComponent';
import NoteEditor from '../components/notes/NoteEditor';
import { MarkdownContent } from '../components/common';

interface ModulePageProps {
  modules: Module[];
  userProgress: UserProgress;
  updateProgress: (updates: Partial<UserProgress> | ((prev: UserProgress) => Partial<UserProgress>)) => void;
}

const ModulePage: React.FC<ModulePageProps> = ({ modules, userProgress, updateProgress }) => {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('content');
  const [showNoteEditor, setShowNoteEditor] = useState(false);

  const module = modules.find(m => m.id === moduleId);
  const isCompleted = userProgress.completedModules.includes(moduleId || '');

  // Reset active tab if current tab is not available
  useEffect(() => {
    if (module) {
      const availableTabIds = [
        'content', 
        'videos', 
        ...(module.content?.quiz && module.content.quiz?.questions && module.content.quiz.questions?.length > 0 ? ['quiz'] : []),
        'resources'
      ];
      if (!availableTabIds.includes(activeTab)) {
        setActiveTab('content');
      }
    }
  }, [module, activeTab]);

  // Temporarily disabled time tracking to fix infinite loop
  // TODO: Implement time tracking with a different approach
  // useEffect(() => {
  //   return () => {
  //     const timeSpent = Math.floor((Date.now() - startTime) / 1000);
  //     updateProgress((prevProgress) => ({
  //       totalTime: prevProgress.totalTime + timeSpent
  //     }));
  //   };
  // }, [startTime, updateProgress]);

  if (!module) {
    return <div>Módulo não encontrado</div>;
  }

  const handleQuizComplete = (score: number) => {
    const newScores = { ...userProgress.quizScores, [module.id]: score };
    const newCompleted = [...userProgress.completedModules];
    
    if (!newCompleted.includes(module.id) && score >= 70) {
      newCompleted.push(module.id);
    }

    updateProgress({
      quizScores: newScores,
      completedModules: newCompleted
    });
  };

  const handleSaveNote = (content: string) => {
    const newNote: Note = {
      id: `note-${Date.now()}`,
      moduleId: module.id,
      content,
      timestamp: Date.now()
    };

    updateProgress({
      notes: [...userProgress.notes, newNote]
    });
    setShowNoteEditor(false);
  };

  const getBibliographyIcon = (type: string) => {
    switch (type) {
      case 'book':
        return '📚';
      case 'article':
        return '📄';
      case 'journal':
        return '📰';
      default:
        return '📖';
    }
  };

  const tabs = [
    { id: 'content', label: 'Conteúdo', icon: BookOpen },
    { id: 'videos', label: 'Vídeos', icon: PlayCircle, count: module.content?.videos?.length },
    ...(module.content?.quiz && module.content.quiz?.questions && module.content.quiz.questions?.length > 0 
      ? [{ id: 'quiz', label: 'Questionário', icon: FileText }] 
      : []
    ),
    { 
      id: 'resources', 
      label: 'Recursos', 
      icon: Library, 
      count: (module.content?.bibliography?.length || 0) + (module.content?.films?.length || 0)
    },
  ];

  return (
    <div className="max-w-4xl mx-auto" data-testid="module-content">
      <div className="mb-6" data-testid="module-header">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          data-testid="back-to-dashboard"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar ao Painel
        </button>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="text-4xl">{module.icon}</span>
              <h1 className="text-3xl font-display font-bold text-gray-900">
                {module.title}
              </h1>
              {isCompleted && (
                <CheckCircle className="w-8 h-8 text-green-600" />
              )}
            </div>
            <p className="text-lg text-gray-600 mb-4">{module.description}</p>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {module.estimatedTime} minutos
              </span>
              <span className="capitalize px-2 py-1 bg-gray-100 rounded">
                {module.difficulty === 'beginner' ? 'Iniciante' :
                 module.difficulty === 'intermediate' ? 'Intermediário' :
                 module.difficulty === 'advanced' ? 'Avançado' : module.difficulty}
              </span>
            </div>
          </div>
          
          <button
            onClick={() => setShowNoteEditor(true)}
            className="btn-secondary"
          >
            Adicionar Anotação
          </button>
        </div>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center space-x-2 py-3 border-b-2 font-medium text-sm
                  transition-colors duration-200
                  ${activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count && (
                  <span className="ml-1 px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="space-y-6">
        {activeTab === 'content' && (
          <div className="prose prose-lg max-w-none">
            <div className="bg-primary-50 p-6 rounded-lg mb-8">
              <h2 className="text-xl font-semibold text-primary-900 mb-3">Introdução</h2>
              <MarkdownContent 
                content={module.content?.introduction || ''}
                className="text-primary-800"
                prose={false}
              />
            </div>

            {module.content?.sections?.map(section => (
              <div key={section.id} className="mb-8">
                <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">
                  {section.title}
                </h2>
                <MarkdownContent 
                  content={section.content}
                  className="text-gray-700 mb-4"
                  prose={false}
                />
                
                {section.keyTerms && section.keyTerms.length > 0 && (
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Termos-Chave</h3>
                    <dl className="space-y-3">
                      {section.keyTerms.map(term => (
                        <div key={term.term}>
                          <dt className="font-semibold text-gray-900">{term.term}</dt>
                          <dd className="text-gray-600 ml-4">{term.definition}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'videos' && (
          <div className="space-y-6">
            {module.content?.videos && module.content.videos?.length > 0 ? (
              module.content?.videos?.map(video => (
                <VideoPlayer key={video.id} video={video} />
              ))
            ) : (
              <p className="text-gray-500 text-center py-12">
                Ainda não há vídeos disponíveis para este módulo.
              </p>
            )}
          </div>
        )}

        {activeTab === 'quiz' && (
          <div>
            {module.content?.quiz && module.content.quiz?.questions && module.content.quiz.questions?.length > 0 ? (
              <QuizComponent
                quiz={module.content?.quiz}
                onComplete={handleQuizComplete}
                previousScore={userProgress.quizScores[module.id]}
              />
            ) : (
              <p className="text-gray-500 text-center py-12">
                Ainda não há questionário disponível para este módulo.
              </p>
            )}
          </div>
        )}

        {activeTab === 'resources' && (
          <div className="space-y-8">
            {/* Seção de Bibliografia */}
            {module.content?.bibliography && module.content.bibliography?.length > 0 && (
              <div>
                <h2 className="text-2xl font-display font-bold text-gray-900 mb-4 flex items-center">
                  <Book className="w-6 h-6 mr-2" />
                  Bibliografia Recomendada
                </h2>
                <div className="space-y-4">
                  {module.content?.bibliography?.map(item => (
                    <div key={item.id} className="card hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-2xl">{getBibliographyIcon(item.type)}</span>
                            <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                          </div>
                          <p className="text-gray-600 mb-2">
                            <User className="w-4 h-4 inline mr-1" />
                            {item.authors.join(', ')}
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {item.year}
                            </span>
                            <span className="px-2 py-1 bg-gray-100 rounded capitalize">
                              {item.type}
                            </span>
                          </div>
                        </div>
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:text-primary-700"
                          >
                            <ExternalLink className="w-5 h-5" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Seção de Filmes */}
            {module.content?.films && module.content.films?.length > 0 && (
              <div>
                <h2 className="text-2xl font-display font-bold text-gray-900 mb-4 flex items-center">
                  <FilmIcon className="w-6 h-6 mr-2" />
                  Filmes Relacionados
                </h2>
                <div className="space-y-4">
                  {module.content?.films?.map(film => (
                    <div key={film.id} className="card hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{film.title}</h3>
                          <p className="text-gray-600 mb-2">
                            Diretor: {film.director} • {film.year}
                          </p>
                          <p className="text-sm text-gray-600 italic">
                            {film.relevance}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {film.streamingUrl && (
                            <a
                              href={film.streamingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-primary flex items-center space-x-2"
                            >
                              <PlayCircle className="w-4 h-4" />
                              <span>Assistir</span>
                            </a>
                          )}
                          {film.trailer && (
                            <a
                              href={film.trailer}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-secondary flex items-center space-x-2"
                            >
                              <PlayCircle className="w-4 h-4" />
                              <span>Trailer</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mensagem quando não há recursos */}
            {(!module.content?.bibliography || module.content.bibliography?.length === 0) && 
             (!module.content?.films || module.content.films?.length === 0) && (
              <div className="text-center py-12">
                <Library className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum recurso adicional disponível para este módulo.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {showNoteEditor && (
        <NoteEditor
          onSave={handleSaveNote}
          onCancel={() => setShowNoteEditor(false)}
          moduleTitle={module.title}
        />
      )}
    </div>
  );
};

export default ModulePage;