import React, { useState } from 'react';
import { useAdmin } from '../../contexts/AdminContext';
import { Module, Section, Question, Quiz } from '../../types';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  ChevronDown,
  ChevronRight,
  Clock,
  BookOpen,
  FileText
} from 'lucide-react';
import ModuleEditor from '../../components/admin/ModuleEditor';
import QuizEditor from '../../components/admin/QuizEditor';

const AdminModules: React.FC = () => {
  const { modules, updateModules } = useAdmin();
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);

  const handleCreateModule = () => {
    const newModule: Module = {
      id: `module-${Date.now()}`,
      title: 'New Module',
      description: 'Module description',
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
    if (window.confirm('Are you sure you want to delete this module?')) {
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

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">
            Manage Modules
          </h1>
          <p className="text-gray-600">
            Create and edit learning modules, sections, and quizzes
          </p>
        </div>
        <button
          onClick={handleCreateModule}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Module</span>
        </button>
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
                      {module.content.sections.length} sections
                    </span>
                    {module.content.quiz && (
                      <span className="flex items-center">
                        <FileText className="w-4 h-4 mr-1" />
                        {module.content.quiz.questions.length} questions
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setEditingModule(module)}
                    className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded-lg"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteModule(module.id)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-gray-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="mt-6 ml-11 space-y-4 border-t pt-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Introduction</h4>
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {module.content.introduction}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Sections</h4>
                    <div className="space-y-2">
                      {module.content.sections.map((section, index) => (
                        <div key={section.id} className="flex items-center space-x-2 text-sm">
                          <span className="text-gray-400">{index + 1}.</span>
                          <span className="text-gray-700">{section.title}</span>
                          {section.keyTerms && (
                            <span className="text-gray-500">
                              ({section.keyTerms.length} terms)
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {module.prerequisites && module.prerequisites.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Prerequisites</h4>
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
    </div>
  );
};

export default AdminModules;