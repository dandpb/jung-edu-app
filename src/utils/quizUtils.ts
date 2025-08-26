/**
 * Quiz Utility Functions
 * Helper functions for quiz generation and manipulation
 */

import { Question, Option } from '../types';

/**
 * Randomize the order of options in a question and update the correct answer index
 */
export function randomizeQuestionOptions(question: Question): Question {
  // Only randomize multiple-choice questions
  if (question.type !== 'multiple-choice' || !question.options || question.options.length === 0) {
    return question;
  }

  // Create array with options and their original indices
  const optionsWithIndices = question.options.map((option, index) => ({
    option,
    originalIndex: index
  }));

  // Shuffle the array using Fisher-Yates algorithm
  const shuffled = [...optionsWithIndices];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Find the new position of the correct answer
  let newCorrectAnswer = question.correctAnswer;
  
  if (typeof question.correctAnswer === 'number') {
    const correctOptionOriginalIndex = question.correctAnswer;
    newCorrectAnswer = shuffled.findIndex(
      item => item.originalIndex === correctOptionOriginalIndex
    );
  } else if (Array.isArray(question.correctAnswer)) {
    // For multiple correct answers (if supported)
    newCorrectAnswer = question.correctAnswer.map(originalIndex => 
      shuffled.findIndex(item => item.originalIndex === originalIndex)
    );
  }

  // Return the question with shuffled options and updated correct answer
  return {
    ...question,
    options: shuffled.map(item => item.option),
    correctAnswer: newCorrectAnswer
  };
}

/**
 * Randomize options for all questions in an array
 */
export function randomizeAllQuestionOptions(questions: Question[]): Question[] {
  return questions.map(question => randomizeQuestionOptions(question));
}

/**
 * Ensure the correct answer is not always in the same position across multiple questions
 */
export function ensureVariedCorrectAnswerPositions(questions: Question[]): Question[] {
  // Track the position of correct answers
  const positions: number[] = [];
  
  return questions.map((question, index) => {
    if (question.type !== 'multiple-choice' || !question.options) {
      return question;
    }

    // Get the last few positions to avoid repetition
    const recentPositions = positions.slice(-3);
    
    // If the correct answer has been in the same position too many times, force a shuffle
    if (typeof question.correctAnswer === 'number') {
      const currentPosition = question.correctAnswer;
      const samePositionCount = recentPositions.filter(p => p === currentPosition).length;
      
      // If the same position appears 2+ times in the last 3 questions, shuffle until different
      if (samePositionCount >= 2) {
        let shuffledQuestion = randomizeQuestionOptions(question);
        let attempts = 0;
        
        while (shuffledQuestion.correctAnswer === currentPosition && attempts < 10) {
          shuffledQuestion = randomizeQuestionOptions(question);
          attempts++;
        }
        
        positions.push(shuffledQuestion.correctAnswer as number);
        return shuffledQuestion;
      }
    }
    
    // Normal randomization
    const randomized = randomizeQuestionOptions(question);
    if (typeof randomized.correctAnswer === 'number') {
      positions.push(randomized.correctAnswer);
    }
    
    return randomized;
  });
}

/**
 * Get a random position for the correct answer with distribution
 * Ensures even distribution across positions 0-3
 */
export function getBalancedCorrectAnswerPosition(questionIndex: number): number {
  // Use a simple pattern to ensure distribution
  // This creates a pattern like [0,1,2,3,1,3,0,2,3,2,1,0...]
  const patterns = [
    [0, 1, 2, 3],
    [1, 3, 0, 2],
    [3, 2, 1, 0],
    [2, 0, 3, 1]
  ];
  
  const patternIndex = Math.floor(questionIndex / 4) % patterns.length;
  const positionIndex = questionIndex % 4;
  
  return patterns[patternIndex][positionIndex];
}

/**
 * Shuffle an array of options while tracking the correct answer
 */
export function shuffleOptionsWithTracking(
  options: string[],
  correctIndex: number
): { options: string[], newCorrectIndex: number } {
  const optionsWithIndices = options.map((option, index) => ({
    option,
    isCorrect: index === correctIndex
  }));

  // Fisher-Yates shuffle
  const shuffled = [...optionsWithIndices];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const newOptions = shuffled.map(item => item.option);
  const newCorrectIndex = shuffled.findIndex(item => item.isCorrect);

  return {
    options: newOptions,
    newCorrectIndex
  };
}