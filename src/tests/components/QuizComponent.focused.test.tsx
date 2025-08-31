import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuizComponent from '../../components/quiz/QuizComponent';
import { Quiz } from '../../types';

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  CheckCircle: ({ className }: { className?: string }) => <div data-testid="check-circle-icon" className={className}>CheckCircle</div>,
  XCircle: ({ className }: { className?: string }) => <div data-testid="x-circle-icon" className={className}>XCircle</div>,
  ArrowRight: ({ className }: { className?: string }) => <div data-testid="arrow-right-icon" className={className}>ArrowRight</div>,
}));

describe('QuizComponent', () => {
  const mockQuiz: Quiz = {
    id: 'quiz1',
    title: 'Quiz sobre Jung',
    questions: [
      {
        id: 'q1',
        question: 'Qual é o conceito central da psicologia analítica?',
        options: [
          'Inconsciente coletivo',
          'Complexo de Édipo',
          'Behaviorismo',
          'Cognitivismo'
        ],
        correctAnswer: 0,
        explanation: 'O inconsciente coletivo é um dos conceitos mais importantes de Jung.'
      },
      {
        id: 'q2',
        question: 'O que são arquetipos?',
        options: [
          'Teorias psicológicas',
          'Padrões universais da psique',
          'Métodos terapêuticos',
          'Distúrbios mentais'
        ],
        correctAnswer: 1,
        explanation: 'Arquetipos são padrões ou imagens universais derivadas do inconsciente coletivo.'
      }
    ]
  };

  const mockOnComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders quiz component with title', () => {
      render(<QuizComponent quiz={mockQuiz} onComplete={mockOnComplete} />);
      
      expect(screen.getByText('Quiz sobre Jung')).toBeInTheDocument();
    });

    it('displays current question number', () => {
      render(<QuizComponent quiz={mockQuiz} onComplete={mockOnComplete} />);
      
      expect(screen.getByText('Questão 1 de 2')).toBeInTheDocument();
    });

    it('shows progress bar with correct initial value', () => {
      render(<QuizComponent quiz={mockQuiz} onComplete={mockOnComplete} />);
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '1');
      expect(progressBar).toHaveAttribute('aria-valuemax', '2');
      expect(progressBar).toHaveAttribute('aria-valuemin', '1');
    });

    it('displays first question text', () => {
      render(<QuizComponent quiz={mockQuiz} onComplete={mockOnComplete} />);
      
      expect(screen.getByText('Qual é o conceito central da psicologia analítica?')).toBeInTheDocument();
    });

    it('renders all answer options', () => {
      render(<QuizComponent quiz={mockQuiz} onComplete={mockOnComplete} />);
      
      expect(screen.getByText('Inconsciente coletivo')).toBeInTheDocument();
      expect(screen.getByText('Complexo de Édipo')).toBeInTheDocument();
      expect(screen.getByText('Behaviorismo')).toBeInTheDocument();
      expect(screen.getByText('Cognitivismo')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('allows selecting an answer', async () => {
      const user = userEvent.setup();
      render(<QuizComponent quiz={mockQuiz} onComplete={mockOnComplete} />);
      
      const firstOption = screen.getByText('Inconsciente coletivo');
      await user.click(firstOption);
      
      const button = firstOption.closest('button');
      expect(button).toHaveClass('border-primary-500', 'bg-primary-50');
    });

    it('shows explanation after selecting answer', async () => {
      const user = userEvent.setup();
      render(<QuizComponent quiz={mockQuiz} onComplete={mockOnComplete} />);
      
      const firstOption = screen.getByText('Inconsciente coletivo');
      await user.click(firstOption);
      
      await waitFor(() => {
        expect(screen.getByText('O inconsciente coletivo é um dos conceitos mais importantes de Jung.')).toBeInTheDocument();
      });
    });

    it('disables options after selection', async () => {
      const user = userEvent.setup();
      render(<QuizComponent quiz={mockQuiz} onComplete={mockOnComplete} />);
      
      const firstOption = screen.getByText('Inconsciente coletivo');
      await user.click(firstOption);
      
      const optionButton = firstOption.closest('button');
      expect(optionButton).toBeDisabled();
    });

    it('enables next button after selecting answer', async () => {
      const user = userEvent.setup();
      render(<QuizComponent quiz={mockQuiz} onComplete={mockOnComplete} />);
      
      const nextButton = screen.getByText('Próxima Questão');
      expect(nextButton).toBeDisabled();
      
      const firstOption = screen.getByText('Inconsciente coletivo');
      await user.click(firstOption);
      
      await waitFor(() => {
        expect(nextButton).toBeEnabled();
      });
    });

    it('shows check icon for correct answer', async () => {
      const user = userEvent.setup();
      render(<QuizComponent quiz={mockQuiz} onComplete={mockOnComplete} />);
      
      const correctOption = screen.getByText('Inconsciente coletivo');
      await user.click(correctOption);
      
      await waitFor(() => {
        expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
      });
    });

    it('shows X icon for incorrect answer', async () => {
      const user = userEvent.setup();
      render(<QuizComponent quiz={mockQuiz} onComplete={mockOnComplete} />);
      
      const incorrectOption = screen.getByText('Complexo de Édipo');
      await user.click(incorrectOption);
      
      await waitFor(() => {
        expect(screen.getByTestId('x-circle-icon')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('advances to next question', async () => {
      const user = userEvent.setup();
      render(<QuizComponent quiz={mockQuiz} onComplete={mockOnComplete} />);
      
      // Answer first question
      const firstOption = screen.getByText('Inconsciente coletivo');
      await user.click(firstOption);
      
      // Click next
      const nextButton = screen.getByText('Próxima Questão');
      await user.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText('Questão 2 de 2')).toBeInTheDocument();
        expect(screen.getByText('O que são arquetipos?')).toBeInTheDocument();
      });
    });

    it('shows "Finalizar Questionário" on last question', async () => {
      const user = userEvent.setup();
      render(<QuizComponent quiz={mockQuiz} onComplete={mockOnComplete} />);
      
      // Go to last question
      const firstOption = screen.getByText('Inconsciente coletivo');
      await user.click(firstOption);
      
      const nextButton = screen.getByText('Próxima Questão');
      await user.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText('Finalizar Questionário')).toBeInTheDocument();
      });
    });

    it('updates progress bar correctly', async () => {
      const user = userEvent.setup();
      render(<QuizComponent quiz={mockQuiz} onComplete={mockOnComplete} />);
      
      // Answer first question and advance
      const firstOption = screen.getByText('Inconsciente coletivo');
      await user.click(firstOption);
      
      const nextButton = screen.getByText('Próxima Questão');
      await user.click(nextButton);
      
      await waitFor(() => {
        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toHaveAttribute('aria-valuenow', '2');
      });
    });
  });

  describe('Quiz Completion', () => {
    it('completes quiz and shows results', async () => {
      const user = userEvent.setup();
      render(<QuizComponent quiz={mockQuiz} onComplete={mockOnComplete} />);
      
      // Answer first question correctly
      const firstOption = screen.getByText('Inconsciente coletivo');
      await user.click(firstOption);
      
      let nextButton = screen.getByText('Próxima Questão');
      await user.click(nextButton);
      
      // Answer second question correctly
      await waitFor(() => {
        expect(screen.getByText('O que são arquetipos?')).toBeInTheDocument();
      });
      
      const secondCorrectOption = screen.getByText('Padrões universais da psique');
      await user.click(secondCorrectOption);
      
      const finalizeButton = screen.getByText('Finalizar Questionário');
      await user.click(finalizeButton);
      
      await waitFor(() => {
        expect(screen.getByText('Questionário Concluído!')).toBeInTheDocument();
        expect(screen.getByText('100%')).toBeInTheDocument();
      });
    });

    it('calculates correct score', async () => {
      const user = userEvent.setup();
      render(<QuizComponent quiz={mockQuiz} onComplete={mockOnComplete} />);
      
      // Answer first question correctly
      const firstOption = screen.getByText('Inconsciente coletivo');
      await user.click(firstOption);
      
      let nextButton = screen.getByText('Próxima Questão');
      await user.click(nextButton);
      
      // Answer second question incorrectly
      await waitFor(() => {
        expect(screen.getByText('O que são arquetipos?')).toBeInTheDocument();
      });
      
      const secondIncorrectOption = screen.getByText('Teorias psicológicas');
      await user.click(secondIncorrectOption);
      
      const finalizeButton = screen.getByText('Finalizar Questionário');
      await user.click(finalizeButton);
      
      await waitFor(() => {
        expect(screen.getByText('50%')).toBeInTheDocument();
        expect(screen.getByText('Você acertou 1 de 2 questões')).toBeInTheDocument();
      });
    });

    it('calls onComplete with correct score', async () => {
      const user = userEvent.setup();
      render(<QuizComponent quiz={mockQuiz} onComplete={mockOnComplete} />);
      
      // Complete quiz with 100% score
      const firstOption = screen.getByText('Inconsciente coletivo');
      await user.click(firstOption);
      
      let nextButton = screen.getByText('Próxima Questão');
      await user.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText('O que são arquetipos?')).toBeInTheDocument();
      });
      
      const secondCorrectOption = screen.getByText('Padrões universais da psique');
      await user.click(secondCorrectOption);
      
      const finalizeButton = screen.getByText('Finalizar Questionário');
      await user.click(finalizeButton);
      
      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith(100);
      });
    });

    it('shows previous score if provided', () => {
      render(<QuizComponent quiz={mockQuiz} onComplete={mockOnComplete} previousScore={85} />);
      
      // Complete quiz first
      const firstOption = screen.getByText('Inconsciente coletivo');
      fireEvent.click(firstOption);
      
      const nextButton = screen.getByText('Próxima Questão');
      fireEvent.click(nextButton);
      
      const secondCorrectOption = screen.getByText('Padrões universais da psique');
      fireEvent.click(secondCorrectOption);
      
      const finalizeButton = screen.getByText('Finalizar Questionário');
      fireEvent.click(finalizeButton);
      
      expect(screen.getByText('Melhor resultado anterior: 85%')).toBeInTheDocument();
    });
  });

  describe('Quiz Reset', () => {
    it('allows retaking quiz', async () => {
      const user = userEvent.setup();
      render(<QuizComponent quiz={mockQuiz} onComplete={mockOnComplete} />);
      
      // Complete quiz
      const firstOption = screen.getByText('Inconsciente coletivo');
      await user.click(firstOption);
      
      let nextButton = screen.getByText('Próxima Questão');
      await user.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText('O que são arquetipos?')).toBeInTheDocument();
      });
      
      const secondCorrectOption = screen.getByText('Padrões universais da psique');
      await user.click(secondCorrectOption);
      
      const finalizeButton = screen.getByText('Finalizar Questionário');
      await user.click(finalizeButton);
      
      // Reset quiz
      await waitFor(() => {
        expect(screen.getByText('Tentar Novamente')).toBeInTheDocument();
      });
      
      const resetButton = screen.getByText('Tentar Novamente');
      await user.click(resetButton);
      
      await waitFor(() => {
        expect(screen.getByText('Questão 1 de 2')).toBeInTheDocument();
        expect(screen.getByText('Qual é o conceito central da psicologia analítica?')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles empty quiz gracefully', () => {
      const emptyQuiz: Quiz = {
        id: 'empty',
        title: 'Empty Quiz',
        questions: []
      };
      
      render(<QuizComponent quiz={emptyQuiz} onComplete={mockOnComplete} />);
      
      expect(screen.getByText('Questionário Indisponível')).toBeInTheDocument();
      expect(screen.getByText('Este módulo ainda não possui um questionário disponível.')).toBeInTheDocument();
    });

    it('handles null quiz gracefully', () => {
      render(<QuizComponent quiz={null as any} onComplete={mockOnComplete} />);
      
      expect(screen.getByText('Questionário Indisponível')).toBeInTheDocument();
    });

    it('handles missing question data', () => {
      const malformedQuiz: Quiz = {
        id: 'malformed',
        title: 'Malformed Quiz',
        questions: [null as any]
      };
      
      render(<QuizComponent quiz={malformedQuiz} onComplete={mockOnComplete} />);
      
      expect(screen.getByText('Erro no Questionário')).toBeInTheDocument();
      expect(screen.getByText('Houve um problema ao carregar as questões. Tente recarregar a página.')).toBeInTheDocument();
    });

    it('handles questions without text gracefully', () => {
      const quizWithEmptyQuestion: Quiz = {
        id: 'empty-question',
        title: 'Quiz with Empty Question',
        questions: [
          {
            id: 'q1',
            question: '',
            options: ['Option 1', 'Option 2'],
            correctAnswer: 0,
            explanation: 'Explanation'
          }
        ]
      };
      
      render(<QuizComponent quiz={quizWithEmptyQuestion} onComplete={mockOnComplete} />);
      
      expect(screen.getByText('Questão sem texto')).toBeInTheDocument();
    });

    it('handles missing explanations gracefully', () => {
      const quizWithoutExplanation: Quiz = {
        id: 'no-explanation',
        title: 'Quiz without Explanation',
        questions: [
          {
            id: 'q1',
            question: 'Test question?',
            options: ['Option 1', 'Option 2'],
            correctAnswer: 0
          }
        ]
      };
      
      render(<QuizComponent quiz={quizWithoutExplanation} onComplete={mockOnComplete} />);
      
      const firstOption = screen.getByText('Option 1');
      fireEvent.click(firstOption);
      
      expect(screen.getByText('Explicação não disponível')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes for progress bar', () => {
      render(<QuizComponent quiz={mockQuiz} onComplete={mockOnComplete} />);
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '1');
      expect(progressBar).toHaveAttribute('aria-valuemax', '2');
      expect(progressBar).toHaveAttribute('aria-valuemin', '1');
    });

    it('has proper button states', () => {
      render(<QuizComponent quiz={mockQuiz} onComplete={mockOnComplete} />);
      
      const nextButton = screen.getByText('Próxima Questão');
      expect(nextButton).toBeDisabled();
      expect(nextButton).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed');
    });
  });
});