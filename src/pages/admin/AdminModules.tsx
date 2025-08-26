import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../contexts/AdminContext';
import { Module } from '../../types';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  ChevronDown,
  ChevronRight,
  Clock,
  BookOpen,
  FileText,
  Sparkles,
  LogOut
} from 'lucide-react';
import ModuleEditor from '../../components/admin/ModuleEditor';
import AIModuleGenerator from '../../components/admin/AIModuleGenerator';
import AutomaticQuizGenerator from '../../components/admin/AutomaticQuizGenerator';
import GenerationProgress from '../../components/admin/GenerationProgress';
import ModulePreview from '../../components/admin/ModulePreview';
import { useModuleGenerator } from '../../hooks/useModuleGenerator';
import AdminNavigation from '../../components/admin/AdminNavigation';

const AdminModules: React.FC = () => {
  const { modules, updateModules, logout } = useAdmin();
  const navigate = useNavigate();
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [showQuizGenerator, setShowQuizGenerator] = useState(false);
  const [quizGenerationModule, setQuizGenerationModule] = useState<Module | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isEditingPreview, setIsEditingPreview] = useState(false);
  
  const {
    isGenerating,
    generatedModule,
    generationSteps,
    currentStep,
    generateModule,
    regenerateSection,
    updateGeneratedModule,
    reset
  } = useModuleGenerator();

  const handleCreateModule = () => {
    const newModule: Module = {
      id: `module-${Date.now()}`,
      title: 'Novo Módulo',
      description: 'Descrição do módulo',
      icon: '📚',
      estimatedTime: 30,
      difficulty: 'beginner',
      prerequisites: [],
      content: {
        introduction: '',
        sections: [],
        videos: [],
        bibliography: [],
        films: []
      }
    };
    setEditingModule(newModule);
    setIsCreating(true);
  };

  const handleSaveModule = (module: Module) => {
    if (isCreating) {
      updateModules([...modules, module]);
    } else {
      updateModules(modules.map(m => m.id === module.id ? module : m));
    }
    setEditingModule(null);
    setIsCreating(false);
  };

  const handleDeleteModule = (moduleId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este módulo?')) {
      updateModules(modules.filter(m => m.id !== moduleId));
    }
  };

  const toggleModuleExpansion = (moduleId: string) => {
    setExpandedModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'text-green-600 bg-green-50';
      case 'intermediate':
        return 'text-yellow-600 bg-yellow-50';
      case 'advanced':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const handleAIGenerate = async (config: any) => {
    setShowAIGenerator(false);
    await generateModule(config);
  };

  const handleSaveGeneratedModule = () => {
    if (generatedModule) {
      updateModules([...modules, generatedModule]);
      setShowPreview(false);
      reset();
    }
  };

  const handleCancelGeneration = () => {
    reset();
    setShowPreview(false);
  };

  const handleGenerateQuiz = (module: Module) => {
    setQuizGenerationModule(module);
    setShowQuizGenerator(true);
  };

  const handleQuizGenerated = (quiz: any) => {
    if (quizGenerationModule) {
      const updatedModule: Module = {
        ...quizGenerationModule,
        content: {
          introduction: quizGenerationModule.content?.introduction || '',
          sections: quizGenerationModule.content?.sections || [],
          videos: quizGenerationModule.content?.videos,
          quiz: quiz,
          bibliography: quizGenerationModule.content?.bibliography,
          films: quizGenerationModule.content?.films,
          summary: quizGenerationModule.content?.summary,
          keyTakeaways: quizGenerationModule.content?.keyTakeaways
        }
      };
      updateModules(modules.map(m => m.id === quizGenerationModule.id ? updatedModule : m));
      setShowQuizGenerator(false);
      setQuizGenerationModule(null);
    }
  };

  const handleCancelQuizGeneration = () => {
    setShowQuizGenerator(false);
    setQuizGenerationModule(null);
  };

  const handleEditGeneratedModule = (updates: Partial<Module>) => {
    if (generatedModule) {
      // Toggle edit mode if no updates provided (just switching mode)
      if (Object.keys(updates).length === 0) {
        setIsEditingPreview(!isEditingPreview);
        return;
      }
      
      // Update the generated module with edits
      const updatedModule = { ...generatedModule, ...updates };
      updateGeneratedModule(updatedModule);
    }
  };

  // Show preview when module is generated
  React.useEffect(() => {
    if (generatedModule && !isGenerating) {
      setShowPreview(true);
    }
  }, [generatedModule, isGenerating]);

  return (
    <>
      <AdminNavigation />
      <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">
            Gerenciar Módulos
          </h1>
          <p className="text-gray-600">
            Criar e editar módulos de aprendizagem, seções e questionários
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAIGenerator(true)}
            className="btn-secondary flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
          >
            <Sparkles className="w-4 h-4" />
            <span>Gerar com IA</span>
          </button>
          <button
            onClick={handleCreateModule}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Módulo</span>
          </button>
          <button
            onClick={handleLogout}
            className="btn-secondary flex items-center space-x-2 bg-red-600 text-white hover:bg-red-700"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {modules.map((module) => {
          const isExpanded = expandedModules.includes(module.id);
          
          return (
            <div key={module.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <button
                      onClick={() => toggleModuleExpansion(module.id)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </button>
                    <span className="text-2xl">{module.icon}</span>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {module.title}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(module.difficulty)}`}>
                      {module.difficulty}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 ml-11 mb-3">{module.description}</p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500 ml-11">
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {module.estimatedTime} min
                    </span>
                    <span className="flex items-center">
                      <BookOpen className="w-4 h-4 mr-1" />
                      {module.content?.sections?.length || 0} seções
                    </span>
                    {module.content?.quiz && (
                      <span className="flex items-center">
                        <FileText className="w-4 h-4 mr-1" />
                        {module.content?.quiz?.questions?.length || 0} questões
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setEditingModule(module)}
                    className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded-lg"
                    title="Editar módulo"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleGenerateQuiz(module)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="Gerar quiz automático"
                  >
                    <Sparkles className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteModule(module.id)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-gray-50 rounded-lg"
                    title="Excluir módulo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="mt-6 ml-11 space-y-4 border-t pt-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Introdução</h4>
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {module.content?.introduction}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Seções</h4>
                    <div className="space-y-2">
                      {module.content?.sections?.map((section, index) => (
                        <div key={section.id} className="flex items-center space-x-2 text-sm">
                          <span className="text-gray-400">{index + 1}.</span>
                          <span className="text-gray-700">{section.title}</span>
                          {section.keyTerms && (
                            <span className="text-gray-500">
                              ({section.keyTerms.length} termos)
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {module.prerequisites && module.prerequisites.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Pré-requisitos</h4>
                      <div className="flex flex-wrap gap-2">
                        {module.prerequisites.map(prereq => {
                          const prereqModule = modules.find(m => m.id === prereq);
                          return prereqModule ? (
                            <span
                              key={prereq}
                              className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded"
                            >
                              {prereqModule.title}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {editingModule && (
        <ModuleEditor
          module={editingModule}
          modules={modules}
          onSave={handleSaveModule}
          onCancel={() => {
            setEditingModule(null);
            setIsCreating(false);
          }}
        />
      )}

      {/* AI Module Generator Modal */}
      {showAIGenerator && (
        <AIModuleGenerator
          onGenerate={handleAIGenerate}
          onCancel={() => setShowAIGenerator(false)}
          existingModules={modules}
        />
      )}

      {/* Automatic Quiz Generator Modal */}
      {showQuizGenerator && quizGenerationModule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Gerar Quiz para: {quizGenerationModule.title}
                </h2>
                <button
                  onClick={handleCancelQuizGeneration}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Fechar</span>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <AutomaticQuizGenerator
                onQuizGenerated={handleQuizGenerated}
                moduleContent={(quizGenerationModule.content?.introduction || '') + ' ' + 
                              (quizGenerationModule.content?.sections || []).map(s => s.content).join(' ')}
                moduleTopic={quizGenerationModule.title}
                learningObjectives={[quizGenerationModule.description]}
              />
            </div>
          </div>
        </div>
      )}

      {/* Generation Progress Modal */}
      {isGenerating && (
        <GenerationProgress
          steps={generationSteps}
          currentStep={currentStep}
          onCancel={handleCancelGeneration}
          estimatedTime={45}
        />
      )}

      {/* Module Preview Modal */}
      {showPreview && generatedModule && (
        <ModulePreview
          module={generatedModule}
          isEditing={isEditingPreview}
          onEdit={handleEditGeneratedModule}
          onSectionRegenerate={regenerateSection}
          onSave={handleSaveGeneratedModule}
          onCancel={handleCancelGeneration}
          aiSuggestions={[
            {
              id: 'sug-1',
              type: 'enhancement',
              target: 'section',
              suggestion: 'Consider adding more practical examples to illustrate concepts',
              priority: 'medium'
            },
            {
              id: 'sug-2',
              type: 'addition',
              target: 'quiz',
              suggestion: 'Add a question about the relationship with other Jungian concepts',
              priority: 'high'
            }
          ]}
        />
      )}
      </div>
    </>
  );
};

export default AdminModules;