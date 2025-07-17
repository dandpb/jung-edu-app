import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import QuizComponent from '../QuizComponent';
import { Quiz } from '../../../types';

const mockQuiz: Quiz = {
  id: 'test-quiz',
  title: 'Test Quiz',
  questions: [
    {
      id: 'q1',
      question: 'What is 2 + 2?',
      options: ['3', '4', '5', '6'],
      correctAnswer: 1,
      explanation: '2 + 2 equals 4'
    },
    {
      id: 'q2',
      question: 'What is the capital of France?',
      options: ['London', 'Berlin', 'Paris', 'Madrid'],
      correctAnswer: 2,
      explanation: 'Paris is the capital of France'
    }
  ]
};

const mockOnComplete = jest.fn();

describe('QuizComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders quiz title and first question', () => {
    render(<QuizComponent quiz={mockQuiz} onComplete={mockOnComplete} />);
    
    expect(screen.getByText('Test Quiz')).toBeInTheDocument();
    expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument();
    expect(screen.getByText('Question 1 of 2')).toBeInTheDocument();
  });

  test('displays all answer options', () => {
    render(<QuizComponent quiz={mockQuiz} onComplete={mockOnComplete} />);
    
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
  });

  test('shows explanation after selecting an answer', () => {
    render(<QuizComponent quiz={mockQuiz} onComplete={mockOnComplete} />);
    
    fireEvent.click(screen.getByText('4'));
    
    expect(screen.getByText('2 + 2 equals 4')).toBeInTheDocument();
  });

  test('displays correct/incorrect feedback', () => {
    const { rerender } = render(<QuizComponent quiz={mockQuiz} onComplete={mockOnComplete} />);
    
    // Select wrong answer
    fireEvent.click(screen.getByText('3'));
    
    const wrongAnswer = screen.getByText('3').closest('button');
    expect(wrongAnswer).toHaveClass('border-red-500');
    
    // Clear the component and re-render to reset state
    rerender(<QuizComponent quiz={mockQuiz} onComplete={mockOnComplete} key="reset" />);
    
    // Select correct answer
    fireEvent.click(screen.getAllByText('4')[0]);
    
    const correctAnswer = screen.getAllByText('4')[0].closest('button');
    expect(correctAnswer).toHaveClass('border-green-500');
  });

  test('navigates to next question', () => {
    render(<QuizComponent quiz={mockQuiz} onComplete={mockOnComplete} />);
    
    fireEvent.click(screen.getByText('4'));
    fireEvent.click(screen.getByText('Next Question'));
    
    expect(screen.getByText('What is the capital of France?')).toBeInTheDocument();
    expect(screen.getByText('Question 2 of 2')).toBeInTheDocument();
  });

  test('completes quiz and shows results', () => {
    render(<QuizComponent quiz={mockQuiz} onComplete={mockOnComplete} />);
    
    // Answer first question correctly
    fireEvent.click(screen.getByText('4'));
    fireEvent.click(screen.getByText('Next Question'));
    
    // Answer second question correctly
    fireEvent.click(screen.getByText('Paris'));
    fireEvent.click(screen.getByText('Finish Quiz'));
    
    expect(screen.getByText('Quiz Complete!')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('You got 2 out of 2 questions correct')).toBeInTheDocument();
    expect(mockOnComplete).toHaveBeenCalledWith(100);
  });

  test('shows previous score if available', () => {
    render(<QuizComponent quiz={mockQuiz} onComplete={mockOnComplete} previousScore={85} />);
    
    // Complete the quiz
    fireEvent.click(screen.getByText('4'));
    fireEvent.click(screen.getByText('Next Question'));
    fireEvent.click(screen.getByText('Paris'));
    fireEvent.click(screen.getByText('Finish Quiz'));
    
    expect(screen.getByText('Previous best: 85%')).toBeInTheDocument();
  });

  test('disables next button until answer is selected', () => {
    render(<QuizComponent quiz={mockQuiz} onComplete={mockOnComplete} />);
    
    const nextButton = screen.getByRole('button', { name: /next question/i });
    expect(nextButton).toBeDisabled();
    
    fireEvent.click(screen.getByText('4'));
    expect(nextButton).not.toBeDisabled();
  });

  test('shows progress bar', () => {
    const { container } = render(<QuizComponent quiz={mockQuiz} onComplete={mockOnComplete} />);
    
    const progressBar = container.querySelector('.bg-primary-600');
    expect(progressBar).toHaveStyle('width: 50%'); // 1 of 2 questions
    
    fireEvent.click(screen.getByText('4'));
    fireEvent.click(screen.getByText('Next Question'));
    
    expect(progressBar).toHaveStyle('width: 100%'); // 2 of 2 questions
  });

  test('allows retaking quiz', () => {
    render(<QuizComponent quiz={mockQuiz} onComplete={mockOnComplete} />);
    
    // Complete quiz
    fireEvent.click(screen.getByText('4'));
    fireEvent.click(screen.getByText('Next Question'));
    fireEvent.click(screen.getByText('Paris'));
    fireEvent.click(screen.getByText('Finish Quiz'));
    
    // Click Try Again
    fireEvent.click(screen.getByText('Try Again'));
    
    expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument();
    expect(screen.getByText('Question 1 of 2')).toBeInTheDocument();
  });

  test('shows detailed results for each question', () => {
    render(<QuizComponent quiz={mockQuiz} onComplete={mockOnComplete} />);
    
    // Answer first question wrong, second correct
    fireEvent.click(screen.getByText('3'));
    fireEvent.click(screen.getByText('Next Question'));
    fireEvent.click(screen.getByText('Paris'));
    fireEvent.click(screen.getByText('Finish Quiz'));
    
    expect(screen.getByText('50%')).toBeInTheDocument();
    
    // Check individual question results
    const results = screen.getAllByText(/Your answer:/);
    expect(results).toHaveLength(2);
  });
});