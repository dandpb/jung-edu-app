import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import QuizEditor from '../QuizEditor';
import { Quiz } from '../../../types';

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
    expect(screen.getByLabelText(/quiz title/i)).toBeInTheDocument();
    
    // Should display questions
    const questions = screen.getAllByText(/question \d+/i);
    expect(questions).toHaveLength(2);
  });

  test('updates quiz title', () => {
    render(
      <QuizEditor
        quiz={mockQuiz}
        onUpdate={mockOnUpdate}
      />
    );

    const titleInput = screen.getByLabelText(/quiz title/i) as HTMLInputElement;
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

    expect(screen.getByText(/create quiz/i)).toBeInTheDocument();
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

    const addButton = screen.getByText(/add question/i);
    expect(addButton).toBeInTheDocument();
  });

  test('quiz has delete button', () => {
    render(
      <QuizEditor
        quiz={mockQuiz}
        onUpdate={mockOnUpdate}
      />
    );

    // Delete button is an icon next to the quiz title
    const container = screen.getByLabelText(/quiz title/i).closest('.flex');
    const deleteButton = container?.querySelector('button');
    expect(deleteButton).toBeInTheDocument();
    
    // Check it has the trash icon
    const trashIcon = deleteButton?.querySelector('svg.lucide-trash2');
    expect(trashIcon).toBeInTheDocument();
  });

  test('displays question options', () => {
    render(
      <QuizEditor
        quiz={mockQuiz}
        onUpdate={mockOnUpdate}
      />
    );

    // First expand the questions by clicking the chevron buttons
    const expandButtons = screen.getAllByRole('button').filter(button => 
      button.querySelector('svg.lucide-chevron-right')
    );
    
    // Expand the first question
    fireEvent.click(expandButtons[0]);

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
    const expandButtons = screen.getAllByRole('button').filter(button => 
      button.querySelector('svg.lucide-chevron-right')
    );
    fireEvent.click(expandButtons[0]);

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

    const titleInput = screen.getByLabelText(/quiz title/i);
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

    const createButton = screen.getByText(/create quiz/i);
    fireEvent.click(createButton);

    expect(mockOnUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Module Quiz',
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
    const container = screen.getByLabelText(/quiz title/i).closest('.flex');
    const deleteButton = container?.querySelector('button') as HTMLButtonElement;
    fireEvent.click(deleteButton);

    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this quiz?');
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

    expect(screen.queryByText(/question 1/i)).not.toBeInTheDocument();
    expect(screen.getByText(/add question/i)).toBeInTheDocument();
  });

  test('calls onUpdate when title changes', () => {
    render(
      <QuizEditor
        quiz={mockQuiz}
        onUpdate={mockOnUpdate}
      />
    );

    const titleInput = screen.getByLabelText(/quiz title/i);
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
    const expandButtons = screen.getAllByRole('button').filter(button => 
      button.querySelector('svg.lucide-chevron-right')
    );
    
    expect(expandButtons.length).toBeGreaterThan(0);
    
    // Click to expand
    fireEvent.click(expandButtons[0]);

    // After expansion, chevron should change to down
    const downChevron = screen.getAllByRole('button').find(button => 
      button.querySelector('svg.lucide-chevron-down')
    );
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
    const questions = screen.getAllByText(/question \d+/i);
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
});