import React, { useState } from 'react';
import { 
  RefreshCw, 
  Edit3, 
  Sparkles,
  Save,
  X,
  Plus,
  Lightbulb
} from 'lucide-react';
import { Module, Section } from '../../types';
import { MarkdownContent } from '../common';

interface ModulePreviewProps {
  module: Module;
  isEditing: boolean;
  onEdit: (updates: Partial<Module>) => void;
  onSectionRegenerate: (sectionId: string) => void;
  onSave: () => void;
  onCancel: () => void;
  aiSuggestions?: AISuggestion[];
}

export interface AISuggestion {
  id: string;
  type: 'enhancement' | 'addition' | 'correction';
  target: 'section' | 'quiz' | 'general';
  targetId?: string;
  suggestion: string;
  priority: 'high' | 'medium' | 'low';
}

const ModulePreview: React.FC<ModulePreviewProps> = ({
  module,
  isEditing,
  onEdit,
  onSectionRegenerate,
  onSave,
  onCancel,
  aiSuggestions = []
}) => {
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [regeneratingSection, setRegeneratingSection] = useState<string | null>(null);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleSectionEdit = (sectionId: string, updates: Partial<Section>) => {
    if (!module.content) return;
    const updatedSections = module.content.sections.map(section =>
      section.id === sectionId ? { ...section, ...updates } : section
    );
    onEdit({
      content: {
        introduction: module.content?.introduction || '',
        sections: updatedSections,
        videos: module.content?.videos,
        quiz: module.content?.quiz,
        bibliography: module.content?.bibliography,
        films: module.content?.films,
        summary: module.content?.summary,
        keyTakeaways: module.content?.keyTakeaways
      }
    });
  };

  const handleRegenerate = async (sectionId: string) => {
    setRegeneratingSection(sectionId);
    await onSectionRegenerate(sectionId);
    setTimeout(() => setRegeneratingSection(null), 1500);
  };

  const getSuggestionIcon = (priority: string) => {
    const colors = {
      high: 'text-red-500',
      medium: 'text-yellow-500',
      low: 'text-blue-500'
    };
    return <Lightbulb className={`w-4 h-4 ${colors[priority as keyof typeof colors]}`} />;
  };

  return (
    <div className="fixed inset-0 bg-gray-50 z-40 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">Module Preview</h1>
          <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full">
            AI Generated
          </span>
        </div>
        <div className="flex items-center space-x-3">
          {!isEditing ? (
            <button
              onClick={() => onEdit({ /* trigger edit mode */ })}
              className="btn-secondary flex items-center space-x-2"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit</span>
            </button>
          ) : (
            <>
              <button
                onClick={onCancel}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={onSave}
                className="btn-primary flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Module</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Left Panel - Structure */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h2 className="font-medium text-gray-900 mb-4">Module Structure</h2>
            
            {/* Module Info */}
            <div className="space-y-3 mb-6">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700">Title</p>
                <p className="text-gray-900">{module.title}</p>
              </div>
              <div className="flex space-x-3">
                <div className="flex-1 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700">Difficulty</p>
                  <p className="text-gray-900 capitalize">{module.difficulty}</p>
                </div>
                <div className="flex-1 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700">Duration</p>
                  <p className="text-gray-900">{module.estimatedTime} min</p>
                </div>
              </div>
            </div>

            {/* Sections List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">Sections</h3>
                {isEditing && (
                  <button className="text-purple-600 hover:text-purple-700">
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <div className="space-y-1">
                <button
                  className="w-full text-left p-2 rounded hover:bg-gray-50"
                  onClick={() => toggleSection('intro')}
                >
                  <span className="font-medium text-gray-700">Introduction</span>
                </button>
                
                {module.content?.sections?.map((section, index) => (
                  <button
                    key={section.id}
                    className={`
                      w-full text-left p-2 rounded hover:bg-gray-50
                      ${expandedSections.includes(section.id) ? 'bg-purple-50' : ''}
                    `}
                    onClick={() => toggleSection(section.id)}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">{index + 1}.</span>
                      <span className="text-gray-700">{section.title}</span>
                    </div>
                  </button>
                ))}
                
                {module.content?.quiz && (
                  <button
                    className="w-full text-left p-2 rounded hover:bg-gray-50"
                    onClick={() => toggleSection('quiz')}
                  >
                    <span className="font-medium text-gray-700">Quiz</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Content */}
        <div className="flex-1 flex">
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto p-8">
              {/* Introduction Section */}
              {(expandedSections.includes('intro') || expandedSections.length === 0) && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-semibold text-gray-900">Introduction</h2>
                    {isEditing && (
                      <button
                        onClick={() => handleRegenerate('intro')}
                        className="text-purple-600 hover:text-purple-700 flex items-center space-x-1"
                      >
                        <RefreshCw className={`w-4 h-4 ${regeneratingSection === 'intro' ? 'animate-spin' : ''}`} />
                        <span className="text-sm">Regenerate</span>
                      </button>
                    )}
                  </div>
                  {isEditing && editingSection === 'intro' ? (
                    <textarea
                      value={module.content?.introduction || ''}
                      onChange={(e) => onEdit({
                        content: { 
                          introduction: e.target.value,
                          sections: module.content?.sections || [],
                          videos: module.content?.videos,
                          quiz: module.content?.quiz,
                          bibliography: module.content?.bibliography,
                          films: module.content?.films,
                          summary: module.content?.summary,
                          keyTakeaways: module.content?.keyTakeaways
                        }
                      })}
                      className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      rows={6}
                    />
                  ) : (
                    <div
                      className={`prose max-w-none ${isEditing ? 'cursor-pointer hover:bg-gray-50 p-4 rounded-lg' : ''}`}
                      onClick={() => isEditing && setEditingSection('intro')}
                    >
                      <MarkdownContent 
                        content={module.content?.introduction || ''}
                        className="text-gray-700"
                        prose={false}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Content Sections */}
              {module.content?.sections?.map((section, index) => {
                if (!expandedSections.includes(section.id) && expandedSections.length > 0) {
                  return null;
                }

                return (
                  <div key={section.id} className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {index + 1}. {section.title}
                      </h3>
                      {isEditing && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleRegenerate(section.id)}
                            className="text-purple-600 hover:text-purple-700 flex items-center space-x-1"
                          >
                            <RefreshCw className={`w-4 h-4 ${regeneratingSection === section.id ? 'animate-spin' : ''}`} />
                            <span className="text-sm">Regenerate</span>
                          </button>
                          <button className="text-purple-600 hover:text-purple-700 flex items-center space-x-1">
                            <Sparkles className="w-4 h-4" />
                            <span className="text-sm">Enhance</span>
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {isEditing && editingSection === section.id ? (
                      <div className="space-y-4">
                        <input
                          type="text"
                          value={section.title}
                          onChange={(e) => handleSectionEdit(section.id, { title: e.target.value })}
                          className="w-full text-xl font-semibold px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <textarea
                          value={section.content}
                          onChange={(e) => handleSectionEdit(section.id, { content: e.target.value })}
                          className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          rows={8}
                        />
                        <button
                          onClick={() => setEditingSection(null)}
                          className="btn-secondary"
                        >
                          Done Editing
                        </button>
                      </div>
                    ) : (
                      <div
                        className={`prose max-w-none ${isEditing ? 'cursor-pointer hover:bg-gray-50 p-4 rounded-lg' : ''}`}
                        onClick={() => isEditing && setEditingSection(section.id)}
                      >
                        <MarkdownContent 
                          content={section.content}
                          className="text-gray-700"
                          prose={false}
                        />
                        
                        {section.keyTerms && section.keyTerms.length > 0 && (
                          <div className="mt-4">
                            <h4 className="font-medium text-gray-900 mb-2">Key Terms</h4>
                            <div className="space-y-2">
                              {section.keyTerms.map((term, idx) => (
                                <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                                  <p className="font-medium text-gray-900">{term.term}</p>
                                  <p className="text-sm text-gray-600 mt-1">{term.definition}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Quiz Section */}
              {expandedSections.includes('quiz') && module.content?.quiz && (
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Quiz</h3>
                  <div className="space-y-4">
                    {module.content?.quiz?.questions?.map((question, idx) => (
                      <div key={question.id} className="bg-gray-50 p-4 rounded-lg">
                        <p className="font-medium text-gray-900 mb-2">
                          {idx + 1}. {question.question}
                        </p>
                        <div className="space-y-2 ml-4">
                          {question.options.map((option, optIdx) => (
                            <div key={optIdx} className="flex items-center space-x-2">
                              <div className={`
                                w-4 h-4 rounded-full border-2
                                ${optIdx === question.correctAnswer
                                  ? 'border-green-500 bg-green-100'
                                  : 'border-gray-300'
                                }
                              `} />
                              <span className="text-gray-700">{typeof option === 'string' ? option : option.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Suggestions Panel */}
          {aiSuggestions.length > 0 && showSuggestions && (
            <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900">AI Suggestions</h3>
                  <button
                    onClick={() => setShowSuggestions(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-3">
                  {aiSuggestions.map((suggestion) => (
                    <div
                      key={suggestion.id}
                      className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                    >
                      <div className="flex items-start space-x-2">
                        {getSuggestionIcon(suggestion.priority)}
                        <div className="flex-1">
                          <p className="text-sm text-gray-700">{suggestion.suggestion}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {suggestion.type} • {suggestion.target}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModulePreview;