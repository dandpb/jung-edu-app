import React, { useState } from 'react';
import { Quiz, Question } from '../../types';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';

interface QuizEditorProps {
  quiz?: Quiz;
  onUpdate: (quiz: Quiz | undefined) => void;
}

const QuizEditor: React.FC<QuizEditorProps> = ({ quiz, onUpdate }) => {
  const [expandedQuestions, setExpandedQuestions] = useState<string[]>([]);

  const createQuiz = () => {
    const newQuiz: Quiz = {
      id: `quiz-${Date.now()}`,
      title: 'Module Quiz',
      questions: []
    };
    onUpdate(newQuiz);
  };

  const deleteQuiz = () => {
    if (window.confirm('Are you sure you want to delete this quiz?')) {
      onUpdate(undefined);
    }
  };

  const updateQuizTitle = (title: string) => {
    if (quiz) {
      onUpdate({ ...quiz, title });
    }
  };

  const addQuestion = () => {
    if (!quiz) return;
    
    const newQuestion: Question = {
      id: `question-${Date.now()}`,
      question: 'New Question',
      options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
      correctAnswer: 0,
      explanation: ''
    };
    
    onUpdate({
      ...quiz,
      questions: [...quiz.questions, newQuestion]
    });
  };

  const updateQuestion = (questionId: string, updates: Partial<Question>) => {
    if (!quiz) return;
    
    onUpdate({
      ...quiz,
      questions: quiz.questions.map(q =>
        q.id === questionId ? { ...q, ...updates } : q
      )
    });
  };

  const deleteQuestion = (questionId: string) => {
    if (!quiz) return;
    
    onUpdate({
      ...quiz,
      questions: quiz.questions.filter(q => q.id !== questionId)
    });
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    if (!quiz) return;
    
    const question = quiz.questions.find(q => q.id === questionId);
    if (!question) return;
    
    const newOptions = [...question.options];
    newOptions[optionIndex] = value;
    
    updateQuestion(questionId, { options: newOptions });
  };

  const toggleQuestionExpansion = (questionId: string) => {
    setExpandedQuestions(prev =>
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  if (!quiz) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">No quiz created for this module yet.</p>
        <button
          onClick={createQuiz}
          className="btn-primary"
        >
          Create Quiz
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <label htmlFor="quiz-title" className="block text-sm font-medium text-gray-700 mb-2">
            Quiz Title
          </label>
          <input
            id="quiz-title"
            type="text"
            value={quiz.title}
            onChange={(e) => updateQuizTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <button
          onClick={deleteQuiz}
          className="ml-4 text-red-600 hover:text-red-700"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Questions</h3>
          <button
            onClick={addQuestion}
            className="btn-secondary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Question</span>
          </button>
        </div>

        <div className="space-y-4">
          {quiz.questions.map((question, qIndex) => {
            const isExpanded = expandedQuestions.includes(question.id);
            
            return (
              <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-2 flex-1">
                    <button
                      onClick={() => toggleQuestionExpansion(question.id)}
                      className="text-gray-500 hover:text-gray-700 mt-1"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </button>
                    <div className="flex-1">
                      <span className="text-sm text-gray-500">Question {qIndex + 1}</span>
                      <input
                        type="text"
                        value={question.question}
                        onChange={(e) => updateQuestion(question.id, { question: e.target.value })}
                        className="w-full mt-1 font-medium text-gray-900 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-primary-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => deleteQuestion(question.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {isExpanded && (
                  <div className="mt-4 ml-7 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Answer Options
                      </label>
                      <div className="space-y-2">
                        {question.options.map((option, optionIndex) => (
                          <div key={optionIndex} className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name={`correct-${question.id}`}
                              checked={question.correctAnswer === optionIndex}
                              onChange={() => updateQuestion(question.id, { correctAnswer: optionIndex })}
                              className="text-primary-600"
                            />
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => updateOption(question.id, optionIndex, e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                              placeholder={`Option ${optionIndex + 1}`}
                            />
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        Select the correct answer by clicking the radio button
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Explanation
                      </label>
                      <textarea
                        value={question.explanation}
                        onChange={(e) => updateQuestion(question.id, { explanation: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Explain why this is the correct answer..."
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default QuizEditor;