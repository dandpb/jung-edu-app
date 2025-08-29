import React, { useState } from 'react';
import { Quiz } from '../../types';
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react';

interface QuizComponentProps {
  quiz: Quiz;
  onComplete: (score: number) => void;
  previousScore?: number;
}

const QuizComponent: React.FC<QuizComponentProps> = ({ quiz, onComplete, previousScore }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  // Early return if quiz data is invalid
  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return (
      <div className="card max-w-2xl mx-auto text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Questionário Indisponível</h2>
        <p className="text-gray-600">Este módulo ainda não possui um questionário disponível.</p>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;

  // Additional safety check for currentQuestion
  if (!currentQuestion) {
    return (
      <div className="card max-w-2xl mx-auto text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Erro no Questionário</h2>
        <p className="text-gray-600">Houve um problema ao carregar as questões. Tente recarregar a página.</p>
      </div>
    );
  }

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setSelectedAnswers(newAnswers);
    setShowExplanation(true);
  };

  const handleNext = () => {
    if (isLastQuestion) {
      calculateScore();
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
      setShowExplanation(false);
    }
  };

  const calculateScore = () => {
    let correct = 0;
    quiz.questions.forEach((question, index) => {
      if (question && selectedAnswers[index] === question.correctAnswer) {
        correct++;
      }
    });
    const score = Math.round((correct / quiz.questions.length) * 100);
    setShowResult(true);
    onComplete(score);
  };

  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers([]);
    setShowResult(false);
    setShowExplanation(false);
  };

  if (showResult) {
    const score = Math.round(
      (selectedAnswers.filter((answer, index) => 
        quiz.questions[index] && answer === quiz.questions[index].correctAnswer
      ).length / quiz.questions.length) * 100
    );

    return (
      <div className="card max-w-2xl mx-auto text-center">
        <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">
          Questionário Concluído!
        </h2>
        
        <div className="mb-6">
          <div className="text-5xl font-bold mb-2">
            {score}%
          </div>
          <p className="text-gray-600">
            Você acertou {selectedAnswers.filter((answer, index) => 
              quiz.questions[index] && answer === quiz.questions[index].correctAnswer
            ).length} de {quiz.questions.length} questões
          </p>
        </div>

        {previousScore !== undefined && (
          <p className="text-sm text-gray-500 mb-4">
            Melhor resultado anterior: {previousScore}%
          </p>
        )}

        <div className="space-y-4">
          {quiz.questions.map((question, index) => {
            // Skip rendering if question is undefined
            if (!question) return null;
            
            const isCorrect = selectedAnswers[index] === question.correctAnswer;
            return (
              <div key={question.id || index} className="text-left p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start space-x-2">
                  {isCorrect ? (
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{question.question || 'Questão sem texto'}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Sua resposta: {(() => {
                        if (!question.options || selectedAnswers[index] === undefined) return 'N/A';
                        const option = question.options[selectedAnswers[index]];
                        return typeof option === 'string' ? option : option?.text || 'N/A';
                      })()}
                    </p>
                    {!isCorrect && (
                      <p className="text-sm text-green-600 mt-1">
                        Resposta correta: {(() => {
                          if (!question.options || question.correctAnswer === undefined) return 'N/A';
                          const correctIndex = Array.isArray(question.correctAnswer) ? question.correctAnswer[0] : Number(question.correctAnswer);
                          if (typeof correctIndex !== 'number' || isNaN(correctIndex)) return 'N/A';
                          const option = question.options[correctIndex];
                          return typeof option === 'string' ? option : option?.text || 'N/A';
                        })()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button onClick={resetQuiz} className="btn-primary mt-6">
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="card max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold text-gray-900">{quiz.title}</h2>
          <span className="text-sm text-gray-500">
            Questão {currentQuestionIndex + 1} de {quiz.questions.length}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2" role="progressbar" aria-valuenow={currentQuestionIndex + 1} aria-valuemax={quiz.questions.length} aria-valuemin={1}>
          <div
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {currentQuestion.question || 'Questão sem texto'}
        </h3>

        <div className="space-y-3">
          {(currentQuestion.options || []).map((option, index) => {
            const isSelected = selectedAnswers[currentQuestionIndex] === index;
            const isCorrect = index === currentQuestion.correctAnswer;
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
                  <span className="font-medium">{typeof option === 'string' ? option : (option?.text || 'Opção sem texto')}</span>
                  {showFeedback && (
                    isCorrect ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {showExplanation && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">{currentQuestion.explanation || 'Explicação não disponível'}</p>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleNext}
          disabled={selectedAnswers[currentQuestionIndex] === undefined}
          className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>{isLastQuestion ? 'Finalizar Questionário' : 'Próxima Questão'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default QuizComponent;