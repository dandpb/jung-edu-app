import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Module, UserProgress, Note } from '../types';
import { ArrowLeft, Clock, BookOpen, PlayCircle, FileText, CheckCircle } from 'lucide-react';
import VideoPlayer from '../components/modules/VideoPlayer';
import QuizComponent from '../components/quiz/QuizComponent';
import NoteEditor from '../components/notes/NoteEditor';

interface ModulePageProps {
  modules: Module[];
  userProgress: UserProgress;
  updateProgress: (updates: Partial<UserProgress> | ((prev: UserProgress) => Partial<UserProgress>)) => void;
}

const ModulePage: React.FC<ModulePageProps> = ({ modules, userProgress, updateProgress }) => {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('content');
  const [startTime] = useState(Date.now());
  const [showNoteEditor, setShowNoteEditor] = useState(false);

  const module = modules.find(m => m.id === moduleId);
  const isCompleted = userProgress.completedModules.includes(moduleId || '');

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
    return <div>Module not found</div>;
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

  const tabs = [
    { id: 'content', label: 'Content', icon: BookOpen },
    { id: 'videos', label: 'Videos', icon: PlayCircle, count: module.content.videos?.length },
    { id: 'quiz', label: 'Quiz', icon: FileText },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Dashboard
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
                {module.estimatedTime} minutes
              </span>
              <span className="capitalize px-2 py-1 bg-gray-100 rounded">
                {module.difficulty}
              </span>
            </div>
          </div>
          
          <button
            onClick={() => setShowNoteEditor(true)}
            className="btn-secondary"
          >
            Add Note
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
              <h2 className="text-xl font-semibold text-primary-900 mb-3">Introduction</h2>
              <p className="text-primary-800">{module.content.introduction}</p>
            </div>

            {module.content.sections.map(section => (
              <div key={section.id} className="mb-8">
                <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">
                  {section.title}
                </h2>
                <p className="text-gray-700 mb-4">{section.content}</p>
                
                {section.keyTerms && section.keyTerms.length > 0 && (
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Terms</h3>
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
            {module.content.videos && module.content.videos.length > 0 ? (
              module.content.videos.map(video => (
                <VideoPlayer key={video.id} video={video} />
              ))
            ) : (
              <p className="text-gray-500 text-center py-12">
                No videos available for this module yet.
              </p>
            )}
          </div>
        )}

        {activeTab === 'quiz' && (
          <div>
            {module.content.quiz ? (
              <QuizComponent
                quiz={module.content.quiz}
                onComplete={handleQuizComplete}
                previousScore={userProgress.quizScores[module.id]}
              />
            ) : (
              <p className="text-gray-500 text-center py-12">
                No quiz available for this module yet.
              </p>
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