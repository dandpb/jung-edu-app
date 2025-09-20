import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../utils/test-utils';
import QuizEditor from '../QuizEditor';
import { Quiz } from '../../../types';

// Mock lucide-react icons
jest.mock('lucide-react', () => {
  const React = require('react');
  return {
    ChevronRight: ({ className }: any) => React.createElement('svg', {
      'data-testid': 'chevron-right',
      className: `lucide-chevron-right ${className || ''}`
    }, 'ChevronRight'),
    ChevronDown: ({ className }: any) => React.createElement('svg', {
      'data-testid': 'chevron-down',
      className: `lucide-chevron-down ${className || ''}`
    }, 'ChevronDown'),
    Trash2: ({ className }: any) => React.createElement('svg', {
      'data-testid': 'trash-icon',
      className: `lucide-trash2 ${className || ''}`
    }, 'Trash2'),
    Plus: ({ className }: any) => React.createElement('svg', {
      'data-testid': 'plus-icon',
      className: `lucide-plus ${className || ''}`
    }, 'Plus'),
  };
});

const mockQuiz: Quiz = {
  id: 'quiz-1',
  title: 'Test Quiz',
  questions: [
    {
      id: 'q1',
      question: 'What is analytical psychology?',
      options: [
        'Jung\'s approach to psychology',
        'Freud\'s approach to psychology',
        'A type of therapy',
        'None of the above'
      ],
      correctAnswer: 0,
      explanation: 'Analytical psychology is Jung\'s unique approach.'
    },
    {
      id: 'q2',
      question: 'What is the collective unconscious?',
      options: [
        'Personal memories',
        'Shared human experiences',
        'Dream content',
        'Conscious thoughts'
      ],
      correctAnswer: 1,
      explanation: 'The collective unconscious contains universal human experiences.'
    }
  ]
};

const mockOnUpdate = jest.fn();

describe('QuizEditor Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders with quiz title and all questions', () => {
    render(
      <QuizEditor
        quiz={mockQuiz}
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByDisplayValue('Test Quiz')).toBeInTheDocument();
    expect(screen.getByDisplayValue('What is analytical psychology?')).toBeInTheDocument();
    expect(screen.getByDisplayValue('What is the collective unconscious?')).toBeInTheDocument();
  });

  test('displays quiz editor interface', () => {
    render(
      <QuizEditor
        quiz={mockQuiz}
        onUpdate={mockOnUpdate}
      />
    );

    // Should display quiz title input
    expect(screen.getByLabelText(/título do questionário/i)).toBeInTheDocument();
    
    // Should display questions
    const questions = screen.getAllByText(/questão \d+/i);
    expect(questions).toHaveLength(2);
  });

  test('updates quiz title', () => {
    render(
      <QuizEditor
        quiz={mockQuiz}
        onUpdate={mockOnUpdate}
      />
    );

    const titleInput = screen.getByLabelText(/título do questionário/i) as HTMLInputElement;
    fireEvent.change(titleInput, { target: { value: 'Updated Quiz Title' } });

    // Verify onUpdate was called with the new title
    expect(mockOnUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        ...mockQuiz,
        title: 'Updated Quiz Title'
      })
    );
  });

  test('handles empty quiz', () => {
    render(
      <QuizEditor
        quiz={undefined}
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByText(/criar questionário/i)).toBeInTheDocument();
  });

  test('displays questions when quiz exists', () => {
    render(
      <QuizEditor
        quiz={mockQuiz}
        onUpdate={mockOnUpdate}
      />
    );

    // Questions should be displayed in input fields
    expect(screen.getByDisplayValue('What is analytical psychology?')).toBeInTheDocument();
    expect(screen.getByDisplayValue('What is the collective unconscious?')).toBeInTheDocument();
  });

  test('quiz has add question button', () => {
    render(
      <QuizEditor
        quiz={mockQuiz}
        onUpdate={mockOnUpdate}
      />
    );

    const addButton = screen.getByText(/adicionar questão/i);
    expect(addButton).toBeInTheDocument();
  });

  test('quiz has delete button', () => {
    render(
      <QuizEditor
        quiz={mockQuiz}
        onUpdate={mockOnUpdate}
      />
    );

    // Delete button is next to the quiz title - should be the first trash icon
    const trashIcons = screen.getAllByTestId('trash-icon');
    expect(trashIcons.length).toBeGreaterThan(0);

    // The first trash icon should be the quiz delete button (next to title)
    const quizDeleteButton = trashIcons[0].closest('button');
    expect(quizDeleteButton).toBeInTheDocument();
  });

  test('displays question options', () => {
    render(
      <QuizEditor
        quiz={mockQuiz}
        onUpdate={mockOnUpdate}
      />
    );

    // First expand the questions by clicking the chevron buttons
    const chevronIcons = screen.getAllByTestId('chevron-right');
    expect(chevronIcons.length).toBeGreaterThan(0);

    // Expand the first question
    const expandButton = chevronIcons[0].closest('button');
    if (expandButton) {
      fireEvent.click(expandButton);
    }

    // Now options should be visible in input fields
    expect(screen.getByDisplayValue("Jung's approach to psychology")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Freud's approach to psychology")).toBeInTheDocument();
  });

  test('displays explanations', () => {
    render(
      <QuizEditor
        quiz={mockQuiz}
        onUpdate={mockOnUpdate}
      />
    );

    // First expand the question
    const chevronIcons = screen.getAllByTestId('chevron-right');
    const expandButton = chevronIcons[0].closest('button');
    if (expandButton) {
      fireEvent.click(expandButton);
    }

    // Explanations should be displayed in a textarea when expanded
    expect(screen.getByDisplayValue("Analytical psychology is Jung's unique approach.")).toBeInTheDocument();
  });

  test('calls onUpdate with updated quiz data', async () => {
    render(
      <QuizEditor
        quiz={mockQuiz}
        onUpdate={mockOnUpdate}
      />
    );

    const titleInput = screen.getByLabelText(/título do questionário/i);
    fireEvent.change(titleInput, { target: { value: 'Final Quiz' } });

    // Update happens on change, not on save button
    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockQuiz,
          title: 'Final Quiz'
        })
      );
    });
  });

  test('creates new quiz when none exists', () => {
    render(
      <QuizEditor
        quiz={undefined}
        onUpdate={mockOnUpdate}
      />
    );

    const createButton = screen.getByText(/criar questionário/i);
    fireEvent.click(createButton);

    expect(mockOnUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Questionário do Módulo',
        questions: []
      })
    );
  });

  test('deletes quiz when delete button clicked', () => {
    const emptyQuiz: Quiz = {
      id: 'quiz-2',
      title: '',
      questions: []
    };

    render(
      <QuizEditor
        quiz={emptyQuiz}
        onUpdate={mockOnUpdate}
      />
    );

    window.confirm = jest.fn(() => true);
    
    // Delete button is an icon next to the quiz title
    const container = screen.getByLabelText(/título do questionário/i).closest('.flex')?.parentElement;
    const deleteButton = container?.querySelector('button') as HTMLButtonElement;
    fireEvent.click(deleteButton);

    expect(window.confirm).toHaveBeenCalledWith('Tem certeza que deseja excluir este questionário?');
    expect(mockOnUpdate).toHaveBeenCalledWith(undefined);
  });

  test('handles quiz with no initial questions', () => {
    const emptyQuiz: Quiz = {
      id: 'quiz-3',
      title: 'Empty Quiz',
      questions: []
    };

    render(
      <QuizEditor
        quiz={emptyQuiz}
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.queryByText(/questão 1/i)).not.toBeInTheDocument();
    expect(screen.getByText(/adicionar questão/i)).toBeInTheDocument();
  });

  test('calls onUpdate when title changes', () => {
    render(
      <QuizEditor
        quiz={mockQuiz}
        onUpdate={mockOnUpdate}
      />
    );

    const titleInput = screen.getByLabelText(/título do questionário/i);
    fireEvent.change(titleInput, { target: { value: 'New Title' } });

    expect(mockOnUpdate).toHaveBeenCalled();
  });

  test('toggles question expansion', () => {
    render(
      <QuizEditor
        quiz={mockQuiz}
        onUpdate={mockOnUpdate}
      />
    );

    // Find expand buttons by looking for chevron icons
    const chevronIcons = screen.getAllByTestId('chevron-right');
    expect(chevronIcons.length).toBeGreaterThan(0);

    // Click to expand
    const expandButton = chevronIcons[0].closest('button');
    if (expandButton) {
      fireEvent.click(expandButton);
    }

    // After expansion, chevron should change to down
    const downChevron = screen.queryByTestId('chevron-down');
    expect(downChevron).toBeInTheDocument();
  });

  test('toggles question visibility', () => {
    render(
      <QuizEditor
        quiz={mockQuiz}
        onUpdate={mockOnUpdate}
      />
    );

    // Questions should have expand/collapse functionality
    const questions = screen.getAllByText(/questão \d+/i);
    expect(questions).toHaveLength(2);
  });

  test('handles quiz without ID', () => {
    const quizWithoutId = {
      ...mockQuiz,
      id: ''
    };

    render(
      <QuizEditor
        quiz={quizWithoutId}
        onUpdate={mockOnUpdate}
      />
    );

    expect(screen.getByDisplayValue('Test Quiz')).toBeInTheDocument();
  });

  describe('Question Management', () => {
    test('adds new question when add button clicked', () => {
      render(
        <QuizEditor
          quiz={mockQuiz}
          onUpdate={mockOnUpdate}
        />
      );

      const addButton = screen.getByText(/adicionar questão/i);
      fireEvent.click(addButton);

      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          questions: expect.arrayContaining([
            ...mockQuiz.questions,
            expect.objectContaining({
              question: 'Nova Questão',
              options: expect.arrayContaining([
                expect.objectContaining({ text: 'Opção 1' }),
                expect.objectContaining({ text: 'Opção 2' }),
                expect.objectContaining({ text: 'Opção 3' }),
                expect.objectContaining({ text: 'Opção 4' })
              ]),
              type: 'multiple-choice',
              correctAnswer: 0
            })
          ])
        })
      );
    });

    test('deletes question when delete button clicked', () => {
      render(
        <QuizEditor
          quiz={mockQuiz}
          onUpdate={mockOnUpdate}
        />
      );

      // First expand the question by clicking chevron
      const chevronIcons = screen.getAllByTestId('chevron-right');
      if (chevronIcons.length > 0) {
        const expandButton = chevronIcons[0].closest('button');
        if (expandButton) {
          fireEvent.click(expandButton);
        }
      }

      // Find delete buttons (trash icons)
      const trashIcons = screen.getAllByTestId('trash-icon');
      const deleteButtons = trashIcons.map(icon => icon.closest('button')).filter(Boolean);
      
      // Click the second delete button (first is for quiz, second is for first question)
      fireEvent.click(deleteButtons[1]);

      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          questions: expect.arrayContaining([mockQuiz.questions[1]])
        })
      );
      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          questions: expect.not.arrayContaining([mockQuiz.questions[0]])
        })
      );
    });

    test('updates question text when edited', () => {
      render(
        <QuizEditor
          quiz={mockQuiz}
          onUpdate={mockOnUpdate}
        />
      );

      const questionInput = screen.getByDisplayValue('What is analytical psychology?');
      fireEvent.change(questionInput, { target: { value: 'Updated question text' } });

      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          questions: expect.arrayContaining([
            expect.objectContaining({
              id: 'q1',
              question: 'Updated question text'
            })
          ])
        })
      );
    });
  });

  describe('Option Management', () => {
    test('updates option text when edited', () => {
      render(
        <QuizEditor
          quiz={mockQuiz}
          onUpdate={mockOnUpdate}
        />
      );

      // Find and click the chevron button for the first question
      const chevronIcons = screen.getAllByTestId('chevron-right');
      const expandButton = chevronIcons[0].closest('button');
      if (expandButton) {
        fireEvent.click(expandButton);
      }

      const optionInput = screen.getByDisplayValue("Jung's approach to psychology");
      fireEvent.change(optionInput, { target: { value: 'Updated option text' } });

      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          questions: expect.arrayContaining([
            expect.objectContaining({
              id: 'q1',
              options: expect.arrayContaining([
                expect.objectContaining({ text: 'Updated option text' })
              ])
            })
          ])
        })
      );
    });

    test('changes correct answer when radio button clicked', () => {
      render(
        <QuizEditor
          quiz={mockQuiz}
          onUpdate={mockOnUpdate}
        />
      );

      // Find and click the chevron button for the first question
      const chevronIcons = screen.getAllByTestId('chevron-right');
      const expandButton = chevronIcons[0].closest('button');
      if (expandButton) {
        fireEvent.click(expandButton);
      }

      // Click the second radio button
      const radioButtons = screen.getAllByRole('radio');
      fireEvent.click(radioButtons[1]);

      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          questions: expect.arrayContaining([
            expect.objectContaining({
              id: 'q1',
              correctAnswer: 1
            })
          ])
        })
      );
    });

    test('updates explanation text', () => {
      render(
        <QuizEditor
          quiz={mockQuiz}
          onUpdate={mockOnUpdate}
        />
      );

      // Find and click the chevron button for the first question
      const chevronIcons = screen.getAllByTestId('chevron-right');
      const expandButton = chevronIcons[0].closest('button');
      if (expandButton) {
        fireEvent.click(expandButton);
      }

      const explanationTextarea = screen.getByDisplayValue("Analytical psychology is Jung's unique approach.");
      fireEvent.change(explanationTextarea, { target: { value: 'Updated explanation' } });

      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          questions: expect.arrayContaining([
            expect.objectContaining({
              id: 'q1',
              explanation: 'Updated explanation'
            })
          ])
        })
      );
    });
  });

  describe('Edge Cases', () => {
    test('handles questions with string options', () => {
      const quizWithStringOptions = {
        ...mockQuiz,
        questions: [{
          id: 'q1',
          question: 'Test question',
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswer: 0,
          explanation: 'Test'
        }]
      };

      render(
        <QuizEditor
          quiz={quizWithStringOptions}
          onUpdate={mockOnUpdate}
        />
      );

      // Find and click the chevron button
      const chevronIcons = screen.getAllByTestId('chevron-right');
      const expandButton = chevronIcons[0].closest('button');
      if (expandButton) {
        fireEvent.click(expandButton);
      }

      // Update option
      const optionInput = screen.getByDisplayValue('Option A');
      fireEvent.change(optionInput, { target: { value: 'Updated Option A' } });

      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          questions: expect.arrayContaining([
            expect.objectContaining({
              options: expect.arrayContaining([
                expect.objectContaining({ id: '1', text: 'Updated Option A' })
              ])
            })
          ])
        })
      );
    });

    test('preserves question type when updating', () => {
      const quizWithTypes = {
        ...mockQuiz,
        questions: [{
          ...mockQuiz.questions[0],
          type: 'true-false' as const
        }]
      };

      render(
        <QuizEditor
          quiz={quizWithTypes}
          onUpdate={mockOnUpdate}
        />
      );

      const questionInput = screen.getByDisplayValue('What is analytical psychology?');
      fireEvent.change(questionInput, { target: { value: 'Updated question' } });

      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          questions: expect.arrayContaining([
            expect.objectContaining({
              type: 'true-false'
            })
          ])
        })
      );
    });

    test('handles quiz with many questions', () => {
      const manyQuestions = Array.from({ length: 10 }, (_, i) => ({
        id: `q${i}`,
        question: `Question ${i + 1}`,
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 0,
        explanation: `Explanation ${i + 1}`
      }));

      const largeQuiz = {
        ...mockQuiz,
        questions: manyQuestions
      };

      render(
        <QuizEditor
          quiz={largeQuiz}
          onUpdate={mockOnUpdate}
        />
      );

      // Should display all questions
      for (let i = 1; i <= 10; i++) {
        expect(screen.getByText(`Questão ${i}`)).toBeInTheDocument();
      }
    });
  });
});