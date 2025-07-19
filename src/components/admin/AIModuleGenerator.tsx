import React, { useState } from 'react';
import { X, Sparkles, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { Module } from '../../types';

interface AIModuleGeneratorProps {
  onGenerate: (config: GenerationConfig) => void;
  onCancel: () => void;
  existingModules: Module[];
}

export interface GenerationConfig {
  subject: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
  prerequisites: string[];
  targetAudience?: string;
  includeQuiz: boolean;
  includeVideos: boolean;
  includeBibliography: boolean;
  language?: string;
}

const AIModuleGenerator: React.FC<AIModuleGeneratorProps> = ({
  onGenerate,
  onCancel,
  existingModules
}) => {
  const [subject, setSubject] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [config, setConfig] = useState<GenerationConfig>({
    subject: '',
    difficulty: 'beginner',
    estimatedTime: 30,
    prerequisites: [],
    includeQuiz: true,
    includeVideos: true,
    includeBibliography: true,
    language: 'en'
  });

  const exampleSubjects = [
    "Introduction to the Shadow",
    "Jung's Theory of Archetypes",
    "Dream Analysis Techniques",
    "The Collective Unconscious",
    "Individuation Process",
    "Anima and Animus Concepts"
  ];

  const handleGenerate = () => {
    if (subject.trim().length < 3) {
      return;
    }
    try {
      onGenerate({
        ...config,
        subject: subject.trim()
      });
    } catch (error) {
      console.error('Error in onGenerate:', error);
    }
  };

  const updateConfig = (updates: Partial<GenerationConfig>) => {
    setConfig({ ...config, ...updates });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Sparkles className="w-6 h-6 text-purple-600" />
            <h2 className="text-2xl font-semibold text-gray-900">
              Generate Module with AI
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Subject Input */}
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
              What subject would you like to create a module for?
            </label>
            <input
              id="subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg"
              placeholder="Enter a Jung psychology topic..."
              autoFocus
            />
            
            {/* Examples */}
            <div className="mt-3">
              <p className="text-sm text-gray-600 mb-2">Examples:</p>
              <div className="flex flex-wrap gap-2">
                {exampleSubjects.map((example) => (
                  <button
                    key={example}
                    onClick={() => setSubject(example)}
                    className="text-sm px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Advanced Options */}
          <div className="border-t pt-4">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 font-medium"
            >
              {showAdvanced ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
              <span>Advanced Options</span>
            </button>

            {showAdvanced && (
              <div className="mt-4 space-y-4">
                {/* Difficulty */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulty Level
                  </label>
                  <div className="flex space-x-3">
                    {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                      <label key={level} className="flex-1">
                        <input
                          type="radio"
                          name="difficulty"
                          value={level}
                          checked={config.difficulty === level}
                          onChange={() => updateConfig({ difficulty: level })}
                          className="sr-only"
                        />
                        <div className={`
                          p-3 text-center rounded-lg border-2 cursor-pointer transition-all
                          ${config.difficulty === level
                            ? 'border-purple-600 bg-purple-50 text-purple-700'
                            : 'border-gray-200 hover:border-gray-300'
                          }
                        `}>
                          <span className="capitalize font-medium">{level}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Estimated Time */}
                <div>
                  <label htmlFor="estimated-time" className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Time (minutes)
                  </label>
                  <input
                    id="estimated-time"
                    type="number"
                    value={config.estimatedTime}
                    onChange={(e) => {
                      const value = e.target.value;
                      const parsedValue = parseInt(value);
                      // Only update if it's a valid number, otherwise keep existing value
                      if (!isNaN(parsedValue) && parsedValue >= 0) {
                        updateConfig({ estimatedTime: parsedValue });
                      } else if (value === '') {
                        updateConfig({ estimatedTime: 30 }); // Default when cleared
                      }
                    }}
                    min="10"
                    max="180"
                    step="10"
                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Prerequisites */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prerequisites
                  </label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {existingModules.map((module) => (
                      <label key={module.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={config.prerequisites.includes(module.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              updateConfig({
                                prerequisites: [...config.prerequisites, module.id]
                              });
                            } else {
                              updateConfig({
                                prerequisites: config.prerequisites.filter(id => id !== module.id)
                              });
                            }
                          }}
                          className="rounded text-purple-600"
                        />
                        <span className="text-sm text-gray-700">{module.title}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Include Options */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Include in Generation
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={config.includeQuiz}
                        onChange={(e) => updateConfig({ includeQuiz: e.target.checked })}
                        className="rounded text-purple-600"
                      />
                      <span className="text-sm text-gray-700">Quiz Questions</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={config.includeVideos}
                        onChange={(e) => updateConfig({ includeVideos: e.target.checked })}
                        className="rounded text-purple-600"
                      />
                      <span className="text-sm text-gray-700">Video Suggestions</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={config.includeBibliography}
                        onChange={(e) => updateConfig({ includeBibliography: e.target.checked })}
                        className="rounded text-purple-600"
                      />
                      <span className="text-sm text-gray-700">Bibliography</span>
                    </label>
                  </div>
                </div>

                {/* Target Audience */}
                <div>
                  <label htmlFor="target-audience" className="block text-sm font-medium text-gray-700 mb-2">
                    Target Audience (Optional)
                  </label>
                  <input
                    id="target-audience"
                    type="text"
                    value={config.targetAudience || ''}
                    onChange={(e) => updateConfig({ targetAudience: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., Psychology students, therapists, general audience"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex space-x-3">
            <Info className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-purple-800">
              <p className="font-medium mb-1">AI-Powered Generation</p>
              <p>
                Our AI will create a comprehensive module including introduction, 
                sections with key terms, and optional quiz questions. You can 
                customize everything after generation.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={subject.trim().length < 3}
            className={`
              px-6 py-2 rounded-lg font-medium flex items-center space-x-2
              transition-all duration-200
              ${subject.trim().length >= 3
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Module</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIModuleGenerator;