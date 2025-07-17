import React, { useState } from 'react';
import { Quiz, Question } from '../../types';
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

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;

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
      if (selectedAnswers[index] === question.correctAnswer) {
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
        answer === quiz.questions[index].correctAnswer
      ).length / quiz.questions.length) * 100
    );

    return (
      <div className="card max-w-2xl mx-auto text-center">
        <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">
          Quiz Complete!
        </h2>
        
        <div className="mb-6">
          <div className="text-5xl font-bold mb-2">
            {score}%
          </div>
          <p className="text-gray-600">
            You got {selectedAnswers.filter((answer, index) => 
              answer === quiz.questions[index].correctAnswer
            ).length} out of {quiz.questions.length} questions correct
          </p>
        </div>

        {previousScore !== undefined && (
          <p className="text-sm text-gray-500 mb-4">
            Previous best: {previousScore}%
          </p>
        )}

        <div className="space-y-4">
          {quiz.questions.map((question, index) => {
            const isCorrect = selectedAnswers[index] === question.correctAnswer;
            return (
              <div key={question.id} className="text-left p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start space-x-2">
                  {isCorrect ? (
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{question.question}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Your answer: {question.options[selectedAnswers[index]]}
                    </p>
                    {!isCorrect && (
                      <p className="text-sm text-green-600 mt-1">
                        Correct answer: {question.options[question.correctAnswer]}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button onClick={resetQuiz} className="btn-primary mt-6">
          Try Again
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
            Question {currentQuestionIndex + 1} of {quiz.questions.length}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {currentQuestion.question}
        </h3>

        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => {
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
                  <span className="font-medium">{option}</span>
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
            <p className="text-sm text-blue-800">{currentQuestion.explanation}</p>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleNext}
          disabled={selectedAnswers[currentQuestionIndex] === undefined}
          className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>{isLastQuestion ? 'Finish Quiz' : 'Next Question'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default QuizComponent;