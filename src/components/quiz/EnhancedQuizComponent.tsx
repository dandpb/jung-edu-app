import React, { useState, useEffect, useCallback } from 'react';
import { Quiz, Question, QuestionType, Option, UserProgress } from '../../types';
import { 
  CheckCircle, 
  XCircle, 
  ArrowRight, 
  ArrowLeft,
  Clock,
  Target,
  Lightbulb,
  Flag,
  BarChart3,
  Brain,
  Shuffle
} from 'lucide-react';

interface EnhancedQuizComponentProps {
  quiz: Quiz;
  onComplete: (score: number, analytics: QuizAnalytics) => void;
  userProgress?: UserProgress;
  adaptiveMode?: boolean;
  showTimer?: boolean;
  allowReview?: boolean;
}

export interface QuizAnalytics {
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number;
  averageTimePerQuestion: number;
  difficultyBreakdown: Record<string, { correct: number; total: number }>;
  conceptMastery: Record<string, number>;
  responsePatterns: Array<{
    questionId: string;
    timeSpent: number;
    attempts: number;
    hintsUsed: number;
    confidence: number;
  }>;
}

const EnhancedQuizComponent: React.FC<EnhancedQuizComponentProps> = ({
  quiz,
  onComplete,
  userProgress,
  adaptiveMode = false,
  showTimer = true,
  allowReview = true
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Map<string, any>>(new Map());
  const [showResult, setShowResult] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [hintsUsed, setHintsUsed] = useState<Set<string>>(new Set());
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [confidence, setConfidence] = useState<Map<string, number>>(new Map());
  const [reviewMode, setReviewMode] = useState(false);
  const [analytics, setAnalytics] = useState<QuizAnalytics | null>(null);

  // Timer effect
  useEffect(() => {
    if (!showResult && !reviewMode) {
      const timer = setInterval(() => {
        setTimeSpent(prev => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [showResult, reviewMode]);

  // Early return if quiz data is invalid
  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return (
      <div className="card max-w-4xl mx-auto text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Questionário Indisponível</h2>
        <p className="text-gray-600">Este módulo ainda não possui um questionário disponível.</p>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  const handleAnswerSelect = useCallback((answer: any) => {
    const questionId = currentQuestion.id;
    setSelectedAnswers(prev => new Map(prev.set(questionId, answer)));
    
    if (currentQuestion.type === 'multiple-choice' || currentQuestion.type === 'true-false') {
      setShowExplanation(true);
    }
  }, [currentQuestion]);

  const handleMultipleSelect = useCallback((optionIndex: number) => {
    const questionId = currentQuestion.id;
    const currentSelection = selectedAnswers.get(questionId) as number[] || [];
    
    const newSelection = currentSelection.includes(optionIndex)
      ? currentSelection.filter(i => i !== optionIndex)
      : [...currentSelection, optionIndex];
    
    setSelectedAnswers(prev => new Map(prev.set(questionId, newSelection)));
  }, [currentQuestion, selectedAnswers]);

  const handleConfidenceChange = useCallback((questionId: string, level: number) => {
    setConfidence(prev => new Map(prev.set(questionId, level)));
  }, []);

  const useHint = useCallback(() => {
    setHintsUsed(prev => new Set(prev.add(currentQuestion.id)));
  }, [currentQuestion]);

  const toggleFlag = useCallback(() => {
    const questionId = currentQuestion.id;
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  }, [currentQuestion]);

  const handleNext = useCallback(() => {
    if (isLastQuestion) {
      calculateScore();
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
      setShowExplanation(false);
      setQuestionStartTime(Date.now());
    }
  }, [isLastQuestion]);

  const handlePrevious = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setShowExplanation(false);
      setQuestionStartTime(Date.now());
    }
  }, [currentQuestionIndex]);

  const calculateScore = useCallback(() => {
    let correct = 0;
    const difficultyBreakdown: Record<string, { correct: number; total: number }> = {};
    const conceptMastery: Record<string, number> = {};
    const responsePatterns: QuizAnalytics['responsePatterns'] = [];

    quiz.questions.forEach((question, index) => {
      if (!question) return;

      const userAnswer = selectedAnswers.get(question.id);
      const isCorrect = checkAnswer(question, userAnswer);
      
      if (isCorrect) correct++;

      // Track difficulty breakdown
      const difficulty = question.difficulty || 'intermediate';
      if (!difficultyBreakdown[difficulty]) {
        difficultyBreakdown[difficulty] = { correct: 0, total: 0 };
      }
      difficultyBreakdown[difficulty].total++;
      if (isCorrect) difficultyBreakdown[difficulty].correct++;

      // Track concept mastery
      question.tags?.forEach(tag => {
        if (!conceptMastery[tag]) conceptMastery[tag] = 0;
        conceptMastery[tag] += isCorrect ? 1 : 0;
      });

      // Response patterns
      responsePatterns.push({
        questionId: question.id,
        timeSpent: 30, // Placeholder - would track actual time per question
        attempts: 1,
        hintsUsed: hintsUsed.has(question.id) ? 1 : 0,
        confidence: confidence.get(question.id) || 3
      });
    });

    const score = Math.round((correct / quiz.questions.length) * 100);
    const quizAnalytics: QuizAnalytics = {
      totalQuestions: quiz.questions.length,
      correctAnswers: correct,
      timeSpent,
      averageTimePerQuestion: timeSpent / quiz.questions.length,
      difficultyBreakdown,
      conceptMastery,
      responsePatterns
    };

    setAnalytics(quizAnalytics);
    setShowResult(true);
    onComplete(score, quizAnalytics);
  }, [quiz.questions, selectedAnswers, timeSpent, hintsUsed, confidence, onComplete]);

  const checkAnswer = (question: Question, userAnswer: any): boolean => {
    if (!userAnswer && userAnswer !== 0) return false;

    switch (question.type) {
      case 'multiple-choice':
      case 'true-false':
        return userAnswer === question.correctAnswer;
      case 'multiple-select':
        const correctAnswers = Array.isArray(question.correctAnswer) 
          ? question.correctAnswer 
          : [question.correctAnswer];
        const userAnswers = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
        return correctAnswers.length === userAnswers.length && 
               correctAnswers.every(ans => userAnswers.includes(ans));
      case 'fill-in-blank':
      case 'short-answer':
        const correctText = String(question.correctAnswer).toLowerCase().trim();
        const userText = String(userAnswer).toLowerCase().trim();
        return correctText === userText;
      default:
        return false;
    }
  };

  const renderQuestion = (question: Question) => {
    switch (question.type) {
      case 'multiple-choice':
      case 'true-false':
        return renderMultipleChoice(question);
      case 'multiple-select':
        return renderMultipleSelect(question);
      case 'fill-in-blank':
        return renderFillInBlank(question);
      case 'short-answer':
        return renderShortAnswer(question);
      case 'essay':
        return renderEssay(question);
      default:
        return <div>Tipo de questão não suportado: {question.type}</div>;
    }
  };

  const renderMultipleChoice = (question: Question) => {
    const userAnswer = selectedAnswers.get(question.id);
    
    return (
      <div className="space-y-3">
        {(question.options || []).map((option, index) => {
          const isSelected = userAnswer === index;
          const isCorrect = index === question.correctAnswer;
          const showFeedback = showExplanation && isSelected;

          return (
            <button
              key={index}
              onClick={() => handleAnswerSelect(index)}
              disabled={showExplanation}
              className={`
                w-full text-left p-4 rounded-lg border-2 transition-all
                ${!showExplanation && 'hover:border-primary-300 hover:bg-primary-50'}
                ${isSelected && !showExplanation && 'border-primary-500 bg-primary-50'}
                ${showFeedback && isCorrect && 'border-green-500 bg-green-50'}
                ${showFeedback && !isCorrect && 'border-red-500 bg-red-50'}
                ${!isSelected && !showExplanation && 'border-gray-200'}
                ${showExplanation && !isSelected && 'opacity-50'}
              `}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {typeof option === 'string' ? option : option.text}
                </span>
                {showFeedback && (
                  isCorrect ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )
                )}
              </div>
              {showExplanation && typeof option === 'object' && option.explanation && (
                <p className="text-sm text-gray-600 mt-2">{option.explanation}</p>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  const renderMultipleSelect = (question: Question) => {
    const userAnswers = selectedAnswers.get(question.id) as number[] || [];
    
    return (
      <div className="space-y-3">
        <div className="text-sm text-gray-600 mb-4">
          Selecione todas as alternativas corretas
        </div>
        {(question.options || []).map((option, index) => {
          const isSelected = userAnswers.includes(index);
          
          return (
            <label
              key={index}
              className="flex items-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleMultipleSelect(index)}
                className="mr-3 h-4 w-4 text-primary-600"
              />
              <span className="font-medium">
                {typeof option === 'string' ? option : option.text}
              </span>
            </label>
          );
        })}
      </div>
    );
  };

  const renderFillInBlank = (question: Question) => {
    const userAnswer = selectedAnswers.get(question.id) || '';
    
    return (
      <div className="space-y-4">
        <div className="text-lg" dangerouslySetInnerHTML={{ 
          __html: question.question.replace(/___/g, '<span class="border-b-2 border-primary-500 inline-block min-w-32 mx-2"></span>')
        }} />
        <input
          type="text"
          value={userAnswer}
          onChange={(e) => handleAnswerSelect(e.target.value)}
          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:outline-none"
          placeholder="Digite sua resposta..."
        />
      </div>
    );
  };

  const renderShortAnswer = (question: Question) => {
    const userAnswer = selectedAnswers.get(question.id) || '';
    
    return (
      <div className="space-y-4">
        <textarea
          value={userAnswer}
          onChange={(e) => handleAnswerSelect(e.target.value)}
          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:outline-none min-h-32"
          placeholder="Digite sua resposta..."
        />
        <div className="text-sm text-gray-500">
          Máximo de {question.metadata?.maxWords || 100} palavras
        </div>
      </div>
    );
  };

  const renderEssay = (question: Question) => {
    const userAnswer = selectedAnswers.get(question.id) || '';
    
    return (
      <div className="space-y-4">
        <textarea
          value={userAnswer}
          onChange={(e) => handleAnswerSelect(e.target.value)}
          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:outline-none min-h-48"
          placeholder="Desenvolva sua resposta..."
        />
        <div className="text-sm text-gray-500">
          Mínimo de {question.metadata?.minWords || 150} palavras
        </div>
        {question.rubric && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Critérios de Avaliação:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              {question.rubric.criteria.map((criterion, index) => (
                <li key={index}>• {criterion.name}: {criterion.description}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (showResult && analytics) {
    return (
      <div className="card max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-display font-bold text-gray-900 mb-4">
            Questionário Concluído!
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-primary-50 p-6 rounded-lg">
              <div className="text-3xl font-bold text-primary-600 mb-2">
                {Math.round((analytics.correctAnswers / analytics.totalQuestions) * 100)}%
              </div>
              <p className="text-gray-600">Pontuação Final</p>
            </div>
            
            <div className="bg-blue-50 p-6 rounded-lg">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {formatTime(analytics.timeSpent)}
              </div>
              <p className="text-gray-600">Tempo Total</p>
            </div>
            
            <div className="bg-green-50 p-6 rounded-lg">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {analytics.correctAnswers}/{analytics.totalQuestions}
              </div>
              <p className="text-gray-600">Acertos</p>
            </div>
          </div>

          {/* Detailed Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="bg-white p-6 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <BarChart3 className="mr-2" />
                Desempenho por Dificuldade
              </h3>
              {Object.entries(analytics.difficultyBreakdown).map(([difficulty, data]) => (
                <div key={difficulty} className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize">{difficulty}</span>
                    <span>{data.correct}/{data.total}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full"
                      style={{
                        width: `${data.total > 0 ? (data.correct / data.total) * 100 : 0}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white p-6 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Brain className="mr-2" />
                Domínio de Conceitos
              </h3>
              {Object.entries(analytics.conceptMastery).slice(0, 5).map(([concept, score]) => (
                <div key={concept} className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize">{concept}</span>
                    <span>{Math.round(score * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${score * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {allowReview && (
            <div className="space-x-4">
              <button
                onClick={() => setReviewMode(true)}
                className="btn-secondary"
              >
                Revisar Respostas
              </button>
              <button
                onClick={() => window.location.reload()}
                className="btn-primary"
              >
                Tentar Novamente
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (reviewMode) {
    return (
      <div className="card max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => setReviewMode(false)}
            className="flex items-center text-primary-600 hover:text-primary-700 mb-4"
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            Voltar aos Resultados
          </button>
          <h2 className="text-2xl font-semibold text-gray-900">Revisão das Respostas</h2>
        </div>

        <div className="space-y-8">
          {quiz.questions.map((question, index) => {
            const userAnswer = selectedAnswers.get(question.id);
            const isCorrect = checkAnswer(question, userAnswer);
            
            return (
              <div key={question.id} className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-medium">
                    {index + 1}. {question.question}
                  </h3>
                  {isCorrect ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600" />
                  )}
                </div>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Sua resposta:</p>
                  <p className="font-medium">
                    {typeof userAnswer === 'object' 
                      ? JSON.stringify(userAnswer) 
                      : String(userAnswer || 'Não respondida')
                    }
                  </p>
                </div>

                {!isCorrect && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Resposta correta:</p>
                    <p className="font-medium text-green-600">
                      {typeof question.correctAnswer === 'object'
                        ? JSON.stringify(question.correctAnswer)
                        : String(question.correctAnswer)
                      }
                    </p>
                  </div>
                )}

                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">{question.explanation}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="card max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-gray-900">{quiz.title}</h2>
          <div className="flex items-center space-x-4">
            {showTimer && (
              <div className="flex items-center text-gray-600">
                <Clock className="w-4 h-4 mr-1" />
                <span>{formatTime(timeSpent)}</span>
              </div>
            )}
            <span className="text-sm text-gray-500">
              {currentQuestionIndex + 1} de {quiz.questions.length}
            </span>
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-primary-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center mb-4">
              <h3 className="text-xl font-medium text-gray-900 mr-4">
                {currentQuestion.question}
              </h3>
              <button
                onClick={toggleFlag}
                className={`p-2 rounded-lg transition-colors ${
                  flaggedQuestions.has(currentQuestion.id)
                    ? 'bg-yellow-100 text-yellow-600'
                    : 'bg-gray-100 text-gray-400 hover:text-gray-600'
                }`}
              >
                <Flag className="w-4 h-4" />
              </button>
            </div>
            
            {currentQuestion.mediaUrl && (
              <div className="mb-4">
                <img
                  src={currentQuestion.mediaUrl}
                  alt="Question media"
                  className="max-w-full h-auto rounded-lg"
                />
              </div>
            )}
            
            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-6">
              <span className="flex items-center">
                <Target className="w-4 h-4 mr-1" />
                {currentQuestion.difficulty || 'Intermediário'}
              </span>
              {currentQuestion.points && (
                <span>{currentQuestion.points} pontos</span>
              )}
              {currentQuestion.timeLimit && (
                <span>
                  <Clock className="w-4 h-4 mr-1 inline" />
                  {currentQuestion.timeLimit}min
                </span>
              )}
            </div>
          </div>
        </div>

        {renderQuestion(currentQuestion)}

        {/* Hints */}
        {currentQuestion.hints && currentQuestion.hints.length > 0 && (
          <div className="mt-6">
            {!hintsUsed.has(currentQuestion.id) ? (
              <button
                onClick={useHint}
                className="flex items-center text-primary-600 hover:text-primary-700"
              >
                <Lightbulb className="w-4 h-4 mr-2" />
                Usar Dica
              </button>
            ) : (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex">
                  <Lightbulb className="w-5 h-5 text-yellow-400 mr-2" />
                  <p className="text-sm text-yellow-800">
                    {currentQuestion.hints[0]}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Explanation */}
        {showExplanation && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">{currentQuestion.explanation}</p>
          </div>
        )}

        {/* Confidence Scale */}
        <div className="mt-6">
          <p className="text-sm text-gray-600 mb-3">
            Quão confiante você está na sua resposta?
          </p>
          <div className="flex space-x-2">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                onClick={() => handleConfidenceChange(currentQuestion.id, level)}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  confidence.get(currentQuestion.id) === level
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {level === 1 ? 'Não tenho certeza' : 
                 level === 2 ? 'Pouco confiante' :
                 level === 3 ? 'Moderadamente confiante' :
                 level === 4 ? 'Confiante' : 'Muito confiante'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          className="btn-secondary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Anterior</span>
        </button>

        <div className="flex items-center space-x-4">
          {flaggedQuestions.size > 0 && (
            <span className="text-sm text-yellow-600">
              {flaggedQuestions.size} questão(ões) marcada(s)
            </span>
          )}
          
          <button
            onClick={handleNext}
            disabled={!selectedAnswers.has(currentQuestion.id)}
            className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{isLastQuestion ? 'Finalizar' : 'Próxima'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedQuizComponent;