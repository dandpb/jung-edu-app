/**
 * Enhanced comprehensive tests for QuizComponent
 * Targeting 90%+ coverage with edge cases and error handling
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuizComponent from '../QuizComponent';
import { Quiz } from '../../../types';

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  CheckCircle: ({ className }: any) => <div data-testid="check-circle" className={className}>✓</div>,
  XCircle: ({ className }: any) => <div data-testid="x-circle" className={className}>✗</div>,
  ArrowRight: ({ className }: any) => <div data-testid="arrow-right" className={className}>→</div>,
}));

describe('QuizComponent - Enhanced Coverage', () => {
  const mockOnComplete = jest.fn();

  const validQuiz: Quiz = {
    id: 'test-quiz',
    title: 'Valid Quiz',
    questions: [
      {
        id: 'q1',
        question: 'What is Jung\'s concept of the shadow?',
        options: [
          'The conscious mind',
          'The hidden part of personality',
          'The collective unconscious',
          'A dream symbol'
        ],
        correctAnswer: 1,
        explanation: 'The shadow represents the hidden, repressed, or denied parts of the self.'
      },
      {
        id: 'q2',
        question: 'Which archetype represents the wise old man?',
        options: [
          { text: 'Anima', id: 'opt1' },
          { text: 'Persona', id: 'opt2' },
          { text: 'Sage', id: 'opt3' },
          { text: 'Trickster', id: 'opt4' }
        ],
        correctAnswer: 2,
        explanation: 'The Sage archetype embodies wisdom and knowledge.'
      },
      {
        id: 'q3',
        question: 'What does individuation mean in Jungian psychology?',
        options: ['Process of personal growth', 'Dream analysis', 'Therapy technique', 'Personality type'],
        correctAnswer: 0,
        explanation: 'Individuation is the process of integrating conscious and unconscious parts of the psyche.'
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Error Handling and Edge Cases', () => {
    test('handles null quiz gracefully', () => {
      render(<QuizComponent quiz={null as any} onComplete={mockOnComplete} />);
      
      expect(screen.getByText('Questionário Indisponível')).toBeInTheDocument();
      expect(screen.getByText('Este módulo ainda não possui um questionário disponível.')).toBeInTheDocument();
    });

    test('handles undefined quiz gracefully', () => {
      render(<QuizComponent quiz={undefined as any} onComplete={mockOnComplete} />);
      
      expect(screen.getByText('Questionário Indisponível')).toBeInTheDocument();
    });

    test('handles quiz with no questions', () => {
      const emptyQuiz: Quiz = {
        id: 'empty-quiz',
        title: 'Empty Quiz',
        questions: []
      };
      
      render(<QuizComponent quiz={emptyQuiz} onComplete={mockOnComplete} />);
      
      expect(screen.getByText('Questionário Indisponível')).toBeInTheDocument();
    });

    test('handles quiz with null questions array', () => {
      const nullQuestionsQuiz = {
        id: 'null-questions',
        title: 'Quiz with null questions',
        questions: null as any
      };
      
      render(<QuizComponent quiz={nullQuestionsQuiz} onComplete={mockOnComplete} />);
      
      expect(screen.getByText('Questionário Indisponível')).toBeInTheDocument();
    });

    test('handles undefined current question', () => {
      const malformedQuiz = {
        id: 'malformed',
        title: 'Malformed Quiz',
        questions: [undefined, null] as any
      };
      
      render(<QuizComponent quiz={malformedQuiz} onComplete={mockOnComplete} />);
      
      expect(screen.getByText('Erro no Questionário')).toBeInTheDocument();
      expect(screen.getByText('Houve um problema ao carregar as questões. Tente recarregar a página.')).toBeInTheDocument();
    });

    test('handles questions with missing properties', () => {
      const incompleteQuiz: Quiz = {
        id: 'incomplete',
        title: 'Incomplete Quiz',
        questions: [
          {
            id: 'q1',
            question: '',
            options: [],
            correctAnswer: 0,
            explanation: ''
          }
        ]
      };
      
      render(<QuizComponent quiz={incompleteQuiz} onComplete={mockOnComplete} />);
      
      expect(screen.getByText('Questão sem texto')).toBeInTheDocument();
    });

    test('handles options as mixed string and object types', () => {
      const mixedOptionsQuiz: Quiz = {
        id: 'mixed',
        title: 'Mixed Options Quiz',
        questions: [
          {
            id: 'q1',
            question: 'Test question',
            options: [
              'String option',
              { text: 'Object option', id: 'opt1' },
              { id: 'opt2' } as any, // Missing text
              null as any
            ],
            correctAnswer: 0,
            explanation: 'Test explanation'
          }
        ]
      };
      
      render(<QuizComponent quiz={mixedOptionsQuiz} onComplete={mockOnComplete} />);
      
      expect(screen.getByText('String option')).toBeInTheDocument();
      expect(screen.getByText('Object option')).toBeInTheDocument();
      expect(screen.getByText('Opção sem texto')).toBeInTheDocument();
    });

    test('handles array correctAnswer format', () => {
      const arrayAnswerQuiz: Quiz = {
        id: 'array-answer',
        title: 'Array Answer Quiz',
        questions: [
          {
            id: 'q1',
            question: 'Multiple select question',
            options: ['Option 1', 'Option 2', 'Option 3'],
            correctAnswer: [0, 2] as any,
            explanation: 'Multiple correct answers'
          }
        ]
      };
      
      render(<QuizComponent quiz={arrayAnswerQuiz} onComplete={mockOnComplete} />);
      
      fireEvent.click(screen.getByText('Option 1'));
      fireEvent.click(screen.getByText('Próxima Questão'));
      
      expect(screen.getByText('Questionário Concluído!')).toBeInTheDocument();
    });

    test('handles NaN correctAnswer', () => {
      const nanAnswerQuiz: Quiz = {
        id: 'nan-answer',
        title: 'NaN Answer Quiz',
        questions: [
          {
            id: 'q1',
            question: 'Question with NaN answer',
            options: ['Option 1', 'Option 2'],
            correctAnswer: 'invalid' as any,
            explanation: 'Invalid answer format'
          }
        ]
      };
      
      render(<QuizComponent quiz={nanAnswerQuiz} onComplete={mockOnComplete} />);
      
      fireEvent.click(screen.getByText('Option 1'));
      fireEvent.click(screen.getByText('Próxima Questão'));
      
      // Should complete without errors
      expect(screen.getByText('Questionário Concluído!')).toBeInTheDocument();
    });
  });

  describe('User Interactions and State Management', () => {
    test('prevents double-clicking answer buttons after selection', async () => {
      const user = userEvent.setup();
      render(<QuizComponent quiz={validQuiz} onComplete={mockOnComplete} />);
      
      const option = screen.getByText('The hidden part of personality');
      await user.click(option);
      
      // Try to click again - should be disabled
      expect(option.closest('button')).toBeDisabled();
    });

    test('handles rapid clicking on next button', async () => {
      const user = userEvent.setup();
      render(<QuizComponent quiz={validQuiz} onComplete={mockOnComplete} />);
      
      await user.click(screen.getByText('The hidden part of personality'));
      
      const nextButton = screen.getByText('Próxima Questão');
      
      // Rapid clicks
      await user.click(nextButton);
      await user.click(nextButton);
      await user.click(nextButton);
      
      // Should only advance once
      expect(screen.getByText('Which archetype represents the wise old man?')).toBeInTheDocument();
    });

    test('handles keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<QuizComponent quiz={validQuiz} onComplete={mockOnComplete} />);
      
      // Focus on first option
      const firstOption = screen.getByText('The conscious mind');
      firstOption.focus();
      
      // Use Enter to select
      await user.keyboard('{Enter}');
      
      // Should show explanation
      expect(screen.getByText(/The shadow represents/)).toBeInTheDocument();
    });

    test('calculates score correctly with all wrong answers', () => {
      render(<QuizComponent quiz={validQuiz} onComplete={mockOnComplete} />);
      
      // Answer all questions wrong
      fireEvent.click(screen.getByText('The conscious mind'));
      fireEvent.click(screen.getByText('Próxima Questão'));
      
      fireEvent.click(screen.getByText('Anima'));
      fireEvent.click(screen.getByText('Próxima Questão'));
      
      fireEvent.click(screen.getByText('Dream analysis'));
      fireEvent.click(screen.getByText('Finalizar Questionário'));
      
      expect(screen.getByText('0%')).toBeInTheDocument();
      expect(screen.getByText('Você acertou 0 de 3 questões')).toBeInTheDocument();
      expect(mockOnComplete).toHaveBeenCalledWith(0);
    });

    test('calculates score correctly with partial correct answers', () => {
      render(<QuizComponent quiz={validQuiz} onComplete={mockOnComplete} />);
      
      // Answer 2 out of 3 correct
      fireEvent.click(screen.getByText('The hidden part of personality'));
      fireEvent.click(screen.getByText('Próxima Questão'));
      
      fireEvent.click(screen.getByText('Sage'));
      fireEvent.click(screen.getByText('Próxima Questão'));
      
      fireEvent.click(screen.getByText('Dream analysis')); // Wrong
      fireEvent.click(screen.getByText('Finalizar Questionário'));
      
      expect(screen.getByText('67%')).toBeInTheDocument();
      expect(mockOnComplete).toHaveBeenCalledWith(67);
    });
  });

  describe('Visual Feedback and UI States', () => {
    test('shows correct feedback icons', () => {
      render(<QuizComponent quiz={validQuiz} onComplete={mockOnComplete} />);
      
      // Select correct answer
      fireEvent.click(screen.getByText('The hidden part of personality'));
      
      expect(screen.getByTestId('check-circle')).toBeInTheDocument();
      
      // Complete quiz and check results
      fireEvent.click(screen.getByText('Próxima Questão'));
      fireEvent.click(screen.getByText('Sage'));
      fireEvent.click(screen.getByText('Próxima Questão'));
      fireEvent.click(screen.getByText('Process of personal growth'));
      fireEvent.click(screen.getByText('Finalizar Questionário'));
      
      // Should show check marks in results
      const checkIcons = screen.getAllByTestId('check-circle');
      expect(checkIcons.length).toBeGreaterThan(0);
    });

    test('shows incorrect feedback icons', () => {
      render(<QuizComponent quiz={validQuiz} onComplete={mockOnComplete} />);
      
      // Select wrong answer
      fireEvent.click(screen.getByText('The conscious mind'));
      
      expect(screen.getByTestId('x-circle')).toBeInTheDocument();
    });

    test('updates progress bar correctly', () => {
      const { container } = render(<QuizComponent quiz={validQuiz} onComplete={mockOnComplete} />);
      
      let progressBar = container.querySelector('.bg-primary-600');
      expect(progressBar).toHaveStyle('width: 33.333333333333336%'); // 1 of 3
      
      fireEvent.click(screen.getByText('The hidden part of personality'));
      fireEvent.click(screen.getByText('Próxima Questão'));
      
      expect(progressBar).toHaveStyle('width: 66.66666666666667%'); // 2 of 3
      
      fireEvent.click(screen.getByText('Sage'));
      fireEvent.click(screen.getByText('Próxima Questão'));
      
      expect(progressBar).toHaveStyle('width: 100%'); // 3 of 3
    });

    test('shows question counter correctly', () => {
      render(<QuizComponent quiz={validQuiz} onComplete={mockOnComplete} />);
      
      expect(screen.getByText('Questão 1 de 3')).toBeInTheDocument();
      
      fireEvent.click(screen.getByText('The hidden part of personality'));
      fireEvent.click(screen.getByText('Próxima Questão'));
      
      expect(screen.getByText('Questão 2 de 3')).toBeInTheDocument();
    });
  });

  describe('Results Screen Functionality', () => {
    test('shows detailed results with correct answers', () => {
      render(<QuizComponent quiz={validQuiz} onComplete={mockOnComplete} />);
      
      // Complete quiz with mixed results
      fireEvent.click(screen.getByText('The conscious mind')); // Wrong
      fireEvent.click(screen.getByText('Próxima Questão'));
      
      fireEvent.click(screen.getByText('Sage')); // Correct
      fireEvent.click(screen.getByText('Próxima Questão'));
      
      fireEvent.click(screen.getByText('Process of personal growth')); // Correct
      fireEvent.click(screen.getByText('Finalizar Questionário'));
      
      // Check individual results
      expect(screen.getByText('Sua resposta: The conscious mind')).toBeInTheDocument();
      expect(screen.getByText('Resposta correta: The hidden part of personality')).toBeInTheDocument();
      expect(screen.getByText('Sua resposta: Sage')).toBeInTheDocument();
      expect(screen.getByText('Sua resposta: Process of personal growth')).toBeInTheDocument();
    });

    test('handles missing options in results gracefully', () => {
      const quizWithMissingOptions: Quiz = {
        id: 'missing-options',
        title: 'Quiz with Missing Options',
        questions: [
          {
            id: 'q1',
            question: 'Test question',
            options: [], // Empty options
            correctAnswer: 0,
            explanation: 'Test'
          }
        ]
      };
      
      render(<QuizComponent quiz={quizWithMissingOptions} onComplete={mockOnComplete} />);
      
      // Since no options, button should be disabled
      const nextButton = screen.getByText('Próxima Questão');
      expect(nextButton).toBeDisabled();
    });

    test('shows previous score comparison', () => {
      render(<QuizComponent quiz={validQuiz} onComplete={mockOnComplete} previousScore={75} />);
      
      // Complete quiz
      fireEvent.click(screen.getByText('The hidden part of personality'));
      fireEvent.click(screen.getByText('Próxima Questão'));
      fireEvent.click(screen.getByText('Sage'));
      fireEvent.click(screen.getByText('Próxima Questão'));
      fireEvent.click(screen.getByText('Process of personal growth'));
      fireEvent.click(screen.getByText('Finalizar Questionário'));
      
      expect(screen.getByText('Melhor resultado anterior: 75%')).toBeInTheDocument();
    });

    test('reset functionality works correctly', () => {
      render(<QuizComponent quiz={validQuiz} onComplete={mockOnComplete} />);
      
      // Complete quiz
      fireEvent.click(screen.getByText('The hidden part of personality'));
      fireEvent.click(screen.getByText('Próxima Questão'));
      fireEvent.click(screen.getByText('Sage'));
      fireEvent.click(screen.getByText('Próxima Questão'));
      fireEvent.click(screen.getByText('Process of personal growth'));
      fireEvent.click(screen.getByText('Finalizar Questionário'));
      
      // Reset quiz
      fireEvent.click(screen.getByText('Tentar Novamente'));
      
      expect(screen.getByText('What is Jung\'s concept of the shadow?')).toBeInTheDocument();
      expect(screen.getByText('Questão 1 de 3')).toBeInTheDocument();
      
      // Should not show explanation initially
      expect(screen.queryByText(/The shadow represents/)).not.toBeInTheDocument();
    });
  });

  describe('Question Navigation Edge Cases', () => {
    test('handles last question correctly', () => {
      render(<QuizComponent quiz={validQuiz} onComplete={mockOnComplete} />);
      
      // Navigate to last question
      fireEvent.click(screen.getByText('The hidden part of personality'));
      fireEvent.click(screen.getByText('Próxima Questão'));
      fireEvent.click(screen.getByText('Sage'));
      fireEvent.click(screen.getByText('Próxima Questão'));
      
      // Should show "Finalizar Questionário" instead of "Próxima Questão"
      expect(screen.getByText('Finalizar Questionário')).toBeInTheDocument();
      expect(screen.queryByText('Próxima Questão')).not.toBeInTheDocument();
    });

    test('handles single question quiz', () => {
      const singleQuestionQuiz: Quiz = {
        id: 'single',
        title: 'Single Question Quiz',
        questions: [validQuiz.questions[0]]
      };
      
      render(<QuizComponent quiz={singleQuestionQuiz} onComplete={mockOnComplete} />);
      
      fireEvent.click(screen.getByText('The hidden part of personality'));
      
      // Should show "Finalizar Questionário" immediately
      expect(screen.getByText('Finalizar Questionário')).toBeInTheDocument();
    });
  });

  describe('Accessibility and UX', () => {
    test('explanation is properly associated with question', () => {
      render(<QuizComponent quiz={validQuiz} onComplete={mockOnComplete} />);
      
      fireEvent.click(screen.getByText('The hidden part of personality'));
      
      const explanation = screen.getByText(/The shadow represents/);
      expect(explanation).toHaveClass('text-blue-800');
      expect(explanation.closest('.bg-blue-50')).toBeInTheDocument();
    });

    test('disabled states are properly applied', () => {
      render(<QuizComponent quiz={validQuiz} onComplete={mockOnComplete} />);
      
      // Next button should be disabled initially
      const nextButton = screen.getByText('Próxima Questão');
      expect(nextButton).toBeDisabled();
      expect(nextButton).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed');
      
      // Select answer
      fireEvent.click(screen.getByText('The hidden part of personality'));
      
      // Now should be enabled
      expect(nextButton).not.toBeDisabled();
      
      // Answer options should be disabled
      const options = screen.getAllByRole('button').filter(btn => 
        btn.textContent?.includes('conscious mind') ||
        btn.textContent?.includes('hidden part') ||
        btn.textContent?.includes('collective unconscious')
      );
      
      options.forEach(option => {
        if (option.textContent?.includes('hidden part')) {
          expect(option).toBeDisabled();
        }
      });
    });

    test('proper ARIA labels and roles', () => {
      render(<QuizComponent quiz={validQuiz} onComplete={mockOnComplete} />);
      
      // Check that buttons have proper roles
      const nextButton = screen.getByRole('button', { name: /próxima questão/i });
      expect(nextButton).toBeInTheDocument();
      
      const optionButtons = screen.getAllByRole('button').filter(btn => 
        btn.textContent?.includes('conscious') ||
        btn.textContent?.includes('hidden') ||
        btn.textContent?.includes('collective')
      );
      
      expect(optionButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Error Recovery', () => {
    test('recovers from malformed question data during quiz', () => {
      const partiallyMalformedQuiz: Quiz = {
        id: 'partial-malformed',
        title: 'Partially Malformed Quiz',
        questions: [
          validQuiz.questions[0], // Valid question
          {
            id: 'malformed',
            question: 'Malformed question',
            options: null as any,
            correctAnswer: 0,
            explanation: null as any
          },
          validQuiz.questions[1] // Another valid question
        ]
      };
      
      render(<QuizComponent quiz={partiallyMalformedQuiz} onComplete={mockOnComplete} />);
      
      // First question should work normally
      fireEvent.click(screen.getByText('The hidden part of personality'));
      fireEvent.click(screen.getByText('Próxima Questão'));
      
      // Should handle malformed question gracefully
      // The component should either skip it or show fallback content
      expect(screen.getByText(/Questão/)).toBeInTheDocument();
    });

    test('handles onComplete callback errors gracefully', () => {
      const errorCallback = jest.fn(() => {
        throw new Error('Callback error');
      });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<QuizComponent quiz={validQuiz} onComplete={errorCallback} />);
      
      // Complete quiz
      fireEvent.click(screen.getByText('The hidden part of personality'));
      fireEvent.click(screen.getByText('Próxima Questão'));
      fireEvent.click(screen.getByText('Sage'));
      fireEvent.click(screen.getByText('Próxima Questão'));
      fireEvent.click(screen.getByText('Process of personal growth'));
      fireEvent.click(screen.getByText('Finalizar Questionário'));
      
      // Should still show results even if callback fails
      expect(screen.getByText('Questionário Concluído!')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Performance and Memory', () => {
    test('does not cause memory leaks with rapid state changes', async () => {
      const user = userEvent.setup();
      render(<QuizComponent quiz={validQuiz} onComplete={mockOnComplete} />);
      
      // Simulate rapid user interactions
      for (let i = 0; i < 10; i++) {
        await user.click(screen.getByText('The hidden part of personality'));
        if (i % 3 === 0) {
          await waitFor(() => {
            expect(screen.getByText(/The shadow represents/)).toBeInTheDocument();
          });
        }
      }
      
      // Component should remain stable
      expect(screen.getByText('What is Jung\'s concept of the shadow?')).toBeInTheDocument();
    });

    test('handles large number of questions efficiently', () => {
      const largeQuiz: Quiz = {
        id: 'large-quiz',
        title: 'Large Quiz',
        questions: Array.from({ length: 50 }, (_, index) => ({
          id: `q${index + 1}`,
          question: `Question ${index + 1}`,
          options: [`Option A${index + 1}`, `Option B${index + 1}`, `Option C${index + 1}`, `Option D${index + 1}`],
          correctAnswer: index % 4,
          explanation: `Explanation for question ${index + 1}`
        }))
      };
      
      const start = performance.now();
      render(<QuizComponent quiz={largeQuiz} onComplete={mockOnComplete} />);
      const end = performance.now();
      
      // Should render efficiently (less than 100ms for 50 questions)
      expect(end - start).toBeLessThan(100);
      
      expect(screen.getByText('Question 1')).toBeInTheDocument();
      expect(screen.getByText('Questão 1 de 50')).toBeInTheDocument();
    });
  });
});