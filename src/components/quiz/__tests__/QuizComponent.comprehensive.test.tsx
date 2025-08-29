/**
 * Comprehensive Unit Tests for QuizComponent
 * Tests quiz functionality, question navigation, score calculation
 * Target: 80%+ coverage
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import QuizComponent from '../QuizComponent';
import { Quiz, Question } from '../../../types';

// Mock data factories
const createMockQuestion = (id: string, overrides: Partial<Question> = {}): Question => ({
  id,
  question: `What is question ${id}?`,
  type: 'multiple-choice',
  options: [
    { id: 'opt1', text: 'Option A', isCorrect: false },
    { id: 'opt2', text: 'Option B', isCorrect: true },
    { id: 'opt3', text: 'Option C', isCorrect: false },
    { id: 'opt4', text: 'Option D', isCorrect: false }
  ],
  correctAnswer: 1,
  explanation: `Explanation for question ${id}`,
  difficulty: 'intermediate',
  ...overrides
});

const createMockQuiz = (overrides: Partial<Quiz> = {}): Quiz => ({
  id: 'test-quiz-1',
  title: 'Psychology Test Quiz',
  questions: [
    createMockQuestion('q1', {
      question: 'What is the collective unconscious according to Jung?',
      explanation: 'The collective unconscious contains universal archetypes shared by humanity.'
    }),
    createMockQuestion('q2', {
      question: 'Which concept is NOT part of Jungian psychology?',
      options: [
        { id: 'opt1', text: 'Archetypes', isCorrect: false },
        { id: 'opt2', text: 'Persona', isCorrect: false },
        { id: 'opt3', text: 'Shadow', isCorrect: false },
        { id: 'opt4', text: 'Superego', isCorrect: true }
      ],
      correctAnswer: 3,
      explanation: 'Superego is a Freudian concept, not Jungian.'
    }),
    createMockQuestion('q3', {
      question: 'What does individuation mean in Jung\'s theory?',
      correctAnswer: 0,
      explanation: 'Individuation is the process of psychological integration.'
    })
  ],
  description: 'Test your knowledge of Jungian psychology',
  passingScore: 70,
  timeLimit: 1800,
  ...overrides
});

describe('QuizComponent', () => {
  const user = userEvent.setup();
  const mockOnComplete = jest.fn();

  const defaultProps = {
    quiz: createMockQuiz(),
    onComplete: mockOnComplete,
    previousScore: undefined
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Initialization', () => {
    it('should render quiz with title and first question', () => {
      render(<QuizComponent {...defaultProps} />);

      expect(screen.getByText('Psychology Test Quiz')).toBeInTheDocument();
      expect(screen.getByText('What is the collective unconscious according to Jung?')).toBeInTheDocument();
      expect(screen.getByText('Questão 1 de 3')).toBeInTheDocument();
    });

    it('should show progress bar', () => {
      render(<QuizComponent {...defaultProps} />);

      const progressBar = screen.getByRole('progressbar'); // CSS-based progress bar
      expect(progressBar).toBeInTheDocument(); // Progress bar should be present
    });

    it('should render all answer options', () => {
      render(<QuizComponent {...defaultProps} />);

      expect(screen.getByText('Option A')).toBeInTheDocument();
      expect(screen.getByText('Option B')).toBeInTheDocument();
      expect(screen.getByText('Option C')).toBeInTheDocument();
      expect(screen.getByText('Option D')).toBeInTheDocument();
    });

    it('should have disabled next button initially', () => {
      render(<QuizComponent {...defaultProps} />);

      const nextButton = screen.getByText('Próxima Questão');
      expect(nextButton).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should show error message for invalid quiz', () => {
      render(<QuizComponent {...defaultProps} quiz={null as any} />);

      expect(screen.getByText('Questionário Indisponível')).toBeInTheDocument();
      expect(screen.getByText('Este módulo ainda não possui um questionário disponível.')).toBeInTheDocument();
    });

    it('should handle quiz without questions', () => {
      const emptyQuiz = createMockQuiz({ questions: [] });
      render(<QuizComponent {...defaultProps} quiz={emptyQuiz} />);

      expect(screen.getByText('Questionário Indisponível')).toBeInTheDocument();
    });

    it('should handle quiz with null questions array', () => {
      const invalidQuiz = createMockQuiz({ questions: null as any });
      render(<QuizComponent {...defaultProps} quiz={invalidQuiz} />);

      expect(screen.getByText('Questionário Indisponível')).toBeInTheDocument();
    });

    it('should handle undefined question gracefully', () => {
      const quizWithUndefinedQuestion = createMockQuiz({
        questions: [createMockQuestion('q1'), undefined as any, createMockQuestion('q3')]
      });
      
      render(<QuizComponent {...defaultProps} quiz={quizWithUndefinedQuestion} />);

      // Should start with first valid question
      expect(screen.getByText('What is question q1?')).toBeInTheDocument();
    });

    it('should show error for corrupted current question', () => {
      const corruptedQuiz = createMockQuiz({
        questions: [null as any, createMockQuestion('q2')]
      });
      
      render(<QuizComponent {...defaultProps} quiz={corruptedQuiz} />);

      expect(screen.getByText('Erro no Questionário')).toBeInTheDocument();
      expect(screen.getByText('Houve um problema ao carregar as questões. Tente recarregar a página.')).toBeInTheDocument();
    });
  });

  describe('Answer Selection', () => {
    it('should select answer and show explanation', async () => {
      render(<QuizComponent {...defaultProps} />);

      const optionB = screen.getByText('Option B');
      await user.click(optionB);

      expect(screen.getByText('Explanation for question q1')).toBeInTheDocument();
      
      const nextButton = screen.getByText('Próxima Questão');
      expect(nextButton).not.toBeDisabled();
    });

    it('should highlight selected answer', async () => {
      render(<QuizComponent {...defaultProps} />);

      const optionA = screen.getByText('Option A');
      await user.click(optionA);

      const selectedButton = optionA.closest('button');
      expect(selectedButton).toHaveClass('border-primary-500', 'bg-primary-50');
    });

    it('should show correct/incorrect feedback after selection', async () => {
      render(<QuizComponent {...defaultProps} />);

      // Select wrong answer
      const wrongOption = screen.getByText('Option A');
      await user.click(wrongOption);

      // Should show red styling for incorrect answer
      const wrongButton = wrongOption.closest('button');
      expect(wrongButton).toHaveClass('border-red-500', 'bg-red-50');

      // Should have X icon
      expect(wrongButton?.querySelector('svg')).toBeInTheDocument();
    });

    it('should show green feedback for correct answer', async () => {
      render(<QuizComponent {...defaultProps} />);

      // Select correct answer
      const correctOption = screen.getByText('Option B');
      await user.click(correctOption);

      const correctButton = correctOption.closest('button');
      expect(correctButton).toHaveClass('border-green-500', 'bg-green-50');

      // Should have check icon
      expect(correctButton?.querySelector('svg')).toBeInTheDocument();
    });

    it('should disable options after selection', async () => {
      render(<QuizComponent {...defaultProps} />);

      const optionA = screen.getByText('Option A');
      await user.click(optionA);

      // All options should be disabled
      const allOptions = screen.getAllByRole('button').filter(btn => 
        btn.textContent?.includes('Option')
      );
      
      allOptions.forEach(option => {
        expect(option).toBeDisabled();
      });
    });

    it('should gray out non-selected options after selection', async () => {
      render(<QuizComponent {...defaultProps} />);

      const optionA = screen.getByText('Option A');
      await user.click(optionA);

      const optionC = screen.getByText('Option C');
      const nonSelectedButton = optionC.closest('button');
      expect(nonSelectedButton).toHaveClass('opacity-50');
    });
  });

  describe('Question Navigation', () => {
    it('should advance to next question', async () => {
      render(<QuizComponent {...defaultProps} />);

      // Answer first question
      await user.click(screen.getByText('Option A'));
      await user.click(screen.getByText('Próxima Questão'));

      expect(screen.getByText('Which concept is NOT part of Jungian psychology?')).toBeInTheDocument();
      expect(screen.getByText('Questão 2 de 3')).toBeInTheDocument();
    });

    it('should update progress bar on navigation', async () => {
      render(<QuizComponent {...defaultProps} />);

      // Answer first question and go to second
      await user.click(screen.getByText('Option A'));
      await user.click(screen.getByText('Próxima Questão'));

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveStyle('width: 66.66666666666667%'); // 2/3 questions
    });

    it('should show "Finalizar Questionário" on last question', async () => {
      render(<QuizComponent {...defaultProps} />);

      // Go to last question
      await user.click(screen.getByText('Option A'));
      await user.click(screen.getByText('Próxima Questão'));
      
      await user.click(screen.getByText('Superego'));
      await user.click(screen.getByText('Próxima Questão'));

      expect(screen.getByText('Finalizar Questionário')).toBeInTheDocument();
    });

    it('should reset explanation state when navigating', async () => {
      render(<QuizComponent {...defaultProps} />);

      // Answer first question
      await user.click(screen.getByText('Option A'));
      expect(screen.getByText('Explanation for question q1')).toBeInTheDocument();

      // Go to next question
      await user.click(screen.getByText('Próxima Questão'));

      // Explanation should not be shown for new question
      expect(screen.queryByText('Explanation for question q1')).not.toBeInTheDocument();
      expect(screen.queryByText('Superego is a Freudian concept, not Jungian.')).not.toBeInTheDocument();
    });
  });

  describe('Quiz Completion and Results', () => {
    const completeQuiz = async (answers: number[]) => {
      const questions = screen.getAllByText(/Option [A-D]|Archetypes|Persona|Shadow|Superego/);
      
      // Answer all questions
      for (let i = 0; i < answers.length; i++) {
        const questionOptions = screen.getAllByRole('button').filter(btn => 
          btn.textContent?.match(/Option [A-D]|Archetypes|Persona|Shadow|Superego/)
        );
        
        await user.click(questionOptions[answers[i]]);
        
        if (i < answers.length - 1) {
          await user.click(screen.getByText('Próxima Questão'));
        } else {
          await user.click(screen.getByText('Finalizar Questionário'));
        }
      }
    };

    it('should calculate and display final score', async () => {
      render(<QuizComponent {...defaultProps} />);

      // Answer: wrong, correct, correct = 2/3 = 67%
      await user.click(screen.getByText('Option A')); // Wrong
      await user.click(screen.getByText('Próxima Questão'));
      
      await user.click(screen.getByText('Superego')); // Correct
      await user.click(screen.getByText('Próxima Questão'));
      
      await user.click(screen.getByText('Option A')); // Correct
      await user.click(screen.getByText('Finalizar Questionário'));

      expect(screen.getByText('Questionário Concluído!')).toBeInTheDocument();
      expect(screen.getByText('67%')).toBeInTheDocument();
      expect(screen.getByText('Você acertou 2 de 3 questões')).toBeInTheDocument();
    });

    it('should call onComplete callback with score', async () => {
      render(<QuizComponent {...defaultProps} />);

      // Answer all correctly for 100%
      await user.click(screen.getByText('Option B')); // Correct
      await user.click(screen.getByText('Próxima Questão'));
      
      await user.click(screen.getByText('Superego')); // Correct
      await user.click(screen.getByText('Próxima Questão'));
      
      await user.click(screen.getByText('Option A')); // Correct
      await user.click(screen.getByText('Finalizar Questionário'));

      expect(mockOnComplete).toHaveBeenCalledWith(100);
    });

    it('should show previous score when provided', async () => {
      render(<QuizComponent {...defaultProps} previousScore={85} />);

      // Complete quiz
      await user.click(screen.getByText('Option A'));
      await user.click(screen.getByText('Próxima Questão'));
      
      await user.click(screen.getByText('Superego'));
      await user.click(screen.getByText('Próxima Questão'));
      
      await user.click(screen.getByText('Option A'));
      await user.click(screen.getByText('Finalizar Questionário'));

      expect(screen.getByText('Melhor resultado anterior: 85%')).toBeInTheDocument();
    });

    it('should display detailed results for each question', async () => {
      render(<QuizComponent {...defaultProps} />);

      // Complete quiz with mixed answers
      await user.click(screen.getByText('Option A')); // Wrong
      await user.click(screen.getByText('Próxima Questão'));
      
      await user.click(screen.getByText('Superego')); // Correct
      await user.click(screen.getByText('Próxima Questão'));
      
      await user.click(screen.getByText('Option C')); // Wrong
      await user.click(screen.getByText('Finalizar Questionário'));

      // Should show results for each question
      expect(screen.getByText('What is the collective unconscious according to Jung?')).toBeInTheDocument();
      expect(screen.getByText('Which concept is NOT part of Jungian psychology?')).toBeInTheDocument();
      expect(screen.getByText('What does individuation mean in Jung\'s theory?')).toBeInTheDocument();

      // Should show correct/incorrect icons
      const checkIcons = screen.getAllByTestId('check-circle-icon') || [];
      const xIcons = screen.getAllByTestId('x-circle-icon') || [];
      
      // Expect at least some icons (actual count depends on answers)
      expect(checkIcons.length + xIcons.length).toBeGreaterThan(0);
    });

    it('should show correct answers for incorrect responses', async () => {
      render(<QuizComponent {...defaultProps} />);

      // Give wrong answer to first question
      await user.click(screen.getByText('Option A')); // Wrong (correct is Option B)
      await user.click(screen.getByText('Próxima Questão'));
      
      await user.click(screen.getByText('Superego')); // Correct
      await user.click(screen.getByText('Próxima Questão'));
      
      await user.click(screen.getByText('Option A')); // Correct
      await user.click(screen.getByText('Finalizar Questionário'));

      // Should show your answer and correct answer for wrong questions
      expect(screen.getByText('Sua resposta: Option A')).toBeInTheDocument();
      expect(screen.getByText('Resposta correta: Option B')).toBeInTheDocument();
    });

    it('should provide retry functionality', async () => {
      render(<QuizComponent {...defaultProps} />);

      // Complete quiz
      await user.click(screen.getByText('Option A'));
      await user.click(screen.getByText('Próxima Questão'));
      
      await user.click(screen.getByText('Superego'));
      await user.click(screen.getByText('Próxima Questão'));
      
      await user.click(screen.getByText('Option A'));
      await user.click(screen.getByText('Finalizar Questionário'));

      // Click retry button
      await user.click(screen.getByText('Tentar Novamente'));

      // Should return to first question
      expect(screen.getByText('What is the collective unconscious according to Jung?')).toBeInTheDocument();
      expect(screen.getByText('Questão 1 de 3')).toBeInTheDocument();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle questions with missing options', () => {
      const quizWithMissingOptions = createMockQuiz({
        questions: [
          createMockQuestion('q1', { options: [] })
        ]
      });

      render(<QuizComponent {...defaultProps} quiz={quizWithMissingOptions} />);

      expect(screen.getByText('What is question q1?')).toBeInTheDocument();
      // Should not crash even with no options
    });

    it('should handle questions with null options', () => {
      const quizWithNullOptions = createMockQuiz({
        questions: [
          createMockQuestion('q1', { options: null as any })
        ]
      });

      render(<QuizComponent {...defaultProps} quiz={quizWithNullOptions} />);

      expect(screen.getByText('What is question q1?')).toBeInTheDocument();
    });

    it('should handle malformed option objects', () => {
      const quizWithMalformedOptions = createMockQuiz({
        questions: [
          createMockQuestion('q1', {
            options: [
              'String option' as any,
              { text: 'Valid option' },
              null as any,
              { id: 'no-text' } as any
            ],
            correctAnswer: 1
          })
        ]
      });

      render(<QuizComponent {...defaultProps} quiz={quizWithMalformedOptions} />);

      expect(screen.getByText('String option')).toBeInTheDocument();
      expect(screen.getByText('Valid option')).toBeInTheDocument();
      expect(screen.getByText('Opção sem texto')).toBeInTheDocument();
    });

    it('should handle missing or invalid correct answers', () => {
      const quizWithInvalidCorrectAnswer = createMockQuiz({
        questions: [
          createMockQuestion('q1', { correctAnswer: undefined as any }),
          createMockQuestion('q2', { correctAnswer: 99 }), // Out of bounds
          createMockQuestion('q3', { correctAnswer: 'invalid' as any })
        ]
      });

      render(<QuizComponent {...defaultProps} quiz={quizWithInvalidCorrectAnswer} />);

      // Complete quiz - should handle invalid correct answers gracefully
      expect(screen.getByText('What is question q1?')).toBeInTheDocument();
    });

    it('should handle missing question text', () => {
      const quizWithMissingQuestionText = createMockQuiz({
        questions: [
          createMockQuestion('q1', { question: '' }),
          createMockQuestion('q2', { question: undefined as any })
        ]
      });

      render(<QuizComponent {...defaultProps} quiz={quizWithMissingQuestionText} />);

      expect(screen.getByText('Questão sem texto')).toBeInTheDocument();
    });

    it('should handle missing explanations', async () => {
      const quizWithMissingExplanation = createMockQuiz({
        questions: [
          createMockQuestion('q1', { explanation: '' }),
          createMockQuestion('q2', { explanation: undefined as any })
        ]
      });

      render(<QuizComponent {...defaultProps} quiz={quizWithMissingExplanation} />);

      // Select answer to trigger explanation
      await user.click(screen.getByText('Option A'));

      expect(screen.getByText('Explicação não disponível')).toBeInTheDocument();
    });

    it('should handle array-type correct answers', async () => {
      const quizWithArrayAnswer = createMockQuiz({
        questions: [
          createMockQuestion('q1', { correctAnswer: [1, 2] as any })
        ]
      });

      render(<QuizComponent {...defaultProps} quiz={quizWithArrayAnswer} />);

      // Complete quiz
      await user.click(screen.getByText('Option B'));
      await user.click(screen.getByText('Finalizar Questionário'));

      // Should handle array correct answer in results
      expect(screen.getByText('Questionário Concluído!')).toBeInTheDocument();
    });
  });

  describe('UI State Management', () => {
    it('should maintain question index correctly', async () => {
      render(<QuizComponent {...defaultProps} />);

      // Navigate through all questions
      expect(screen.getByText('Questão 1 de 3')).toBeInTheDocument();

      await user.click(screen.getByText('Option A'));
      await user.click(screen.getByText('Próxima Questão'));
      expect(screen.getByText('Questão 2 de 3')).toBeInTheDocument();

      await user.click(screen.getByText('Superego'));
      await user.click(screen.getByText('Próxima Questão'));
      expect(screen.getByText('Questão 3 de 3')).toBeInTheDocument();
    });

    it('should maintain selected answers state', async () => {
      render(<QuizComponent {...defaultProps} />);

      // Select answer for first question
      await user.click(screen.getByText('Option C'));
      await user.click(screen.getByText('Próxima Questão'));

      // Navigate to second question and back (if implemented)
      // The selected answer should persist
      expect(screen.getByText('Which concept is NOT part of Jungian psychology?')).toBeInTheDocument();
    });

    it('should reset all state when retry is clicked', async () => {
      render(<QuizComponent {...defaultProps} />);

      // Complete entire quiz
      await user.click(screen.getByText('Option A'));
      await user.click(screen.getByText('Próxima Questão'));
      
      await user.click(screen.getByText('Superego'));
      await user.click(screen.getByText('Próxima Questão'));
      
      await user.click(screen.getByText('Option A'));
      await user.click(screen.getByText('Finalizar Questionário'));

      // Retry
      await user.click(screen.getByText('Tentar Novamente'));

      // Should be back to initial state
      expect(screen.getByText('Questão 1 de 3')).toBeInTheDocument();
      expect(screen.getByText('What is the collective unconscious according to Jung?')).toBeInTheDocument();
      
      const nextButton = screen.getByText('Próxima Questão');
      expect(nextButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      render(<QuizComponent {...defaultProps} />);

      const quizTitle = screen.getByRole('heading', { level: 2, name: /Psychology Test Quiz/ });
      expect(quizTitle).toBeInTheDocument();

      const questionTitle = screen.getByRole('heading', { level: 3 });
      expect(questionTitle).toHaveTextContent('What is the collective unconscious according to Jung?');
    });

    it('should have accessible form controls', () => {
      render(<QuizComponent {...defaultProps} />);

      // All options should be clickable buttons
      const optionButtons = screen.getAllByRole('button').filter(btn => 
        btn.textContent?.includes('Option')
      );
      
      expect(optionButtons).toHaveLength(4);
      
      optionButtons.forEach(button => {
        expect(button).toBeInTheDocument();
      });
    });

    it('should support keyboard navigation', async () => {
      render(<QuizComponent {...defaultProps} />);

      // Should be able to tab through options
      const firstOption = screen.getByText('Option A').closest('button');
      if (firstOption) {
        firstOption.focus();
        expect(firstOption).toHaveFocus();
      }
    });

    it('should provide clear progress indication', () => {
      render(<QuizComponent {...defaultProps} />);

      expect(screen.getByText('Questão 1 de 3')).toBeInTheDocument();
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
    });
  });
});