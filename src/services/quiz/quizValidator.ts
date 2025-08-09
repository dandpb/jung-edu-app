/**
 * Quiz Validator for Jung Educational App
 * Validates and improves quiz quality before returning to users
 */

import { Quiz, Question } from '../../types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  score: number; // 0-100
}

export interface QuestionValidationResult {
  questionId: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  qualityScore: number; // 0-100
}

export class QuizValidator {
  /**
   * Validate an entire quiz
   */
  validateQuiz(quiz: Quiz): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: [],
      score: 100
    };

    // Basic structure validation
    if (!quiz.questions || quiz.questions.length === 0) {
      result.errors.push('Quiz has no questions');
      result.isValid = false;
      result.score = 0;
      return result;
    }

    // Validate each question
    const questionResults = quiz.questions.map(q => this.validateQuestion(q));
    
    // Aggregate results
    questionResults.forEach((qr, index) => {
      if (!qr.isValid) {
        result.isValid = false;
        qr.errors.forEach(e => result.errors.push(`Q${index + 1}: ${e}`));
      }
      qr.warnings.forEach(w => result.warnings.push(`Q${index + 1}: ${w}`));
    });

    // Calculate overall quality score
    const avgQuestionScore = questionResults.reduce((sum, qr) => sum + qr.qualityScore, 0) / questionResults.length;
    result.score = Math.round(avgQuestionScore);

    // Add suggestions based on analysis
    result.suggestions = this.generateSuggestions(quiz, questionResults);

    return result;
  }

  /**
   * Validate a single question
   */
  private validateQuestion(question: Question): QuestionValidationResult {
    // Handle null/undefined questions
    if (!question || typeof question !== 'object') {
      return {
        questionId: 'unknown',
        isValid: false,
        errors: ['Invalid question object'],
        warnings: [],
        qualityScore: 0
      };
    }

    const result: QuestionValidationResult = {
      questionId: question.id || 'unknown',
      isValid: true,
      errors: [],
      warnings: [],
      qualityScore: 100
    };

    // Required fields
    if (!question.question || question.question.trim().length === 0) {
      result.errors.push('Question text is missing');
      result.isValid = false;
      result.qualityScore -= 50;
    }

    if (question.type === 'multiple-choice') {
      // Validate multiple choice specifics
      if (!question.options || question.options.length !== 4) {
        result.errors.push('Multiple choice questions must have exactly 4 options');
        result.isValid = false;
        result.qualityScore -= 30;
      } else {
        // Check distractor quality
        const distractorQuality = this.assessDistractorQuality(question);
        result.qualityScore = Math.min(result.qualityScore, distractorQuality.score);
        result.warnings.push(...distractorQuality.warnings);
      }

      if (question.correctAnswer === undefined || 
          (typeof question.correctAnswer === 'number' && (question.correctAnswer < 0 || question.correctAnswer > 3))) {
        result.errors.push('Invalid correct answer index');
        result.isValid = false;
        result.qualityScore -= 50;
      }
    }

    // Check explanation quality
    if (!question.explanation || question.explanation.length < 50) {
      result.warnings.push('Explanation is missing or too short');
      result.qualityScore -= 10;
    }

    // Check question complexity
    const complexityScore = this.assessQuestionComplexity(question);
    if (complexityScore < 50) {
      result.warnings.push('Question may be too simple or memorization-focused');
      result.qualityScore -= 15;
    }

    // Ensure minimum quality
    result.qualityScore = Math.max(0, result.qualityScore);

    return result;
  }

  /**
   * Assess the quality of distractors in a multiple choice question
   */
  private assessDistractorQuality(question: Question): { score: number; warnings: string[] } {
    const warnings: string[] = [];
    let score = 100;

    if (!question.options || question.correctAnswer === undefined) {
      return { score: 0, warnings: ['Missing options or correct answer'] };
    }

    const options = question.options;
    // Handle different types of correctAnswer
    const correctAnswerIndex = typeof question.correctAnswer === 'number' ? 
      question.correctAnswer : 
      (Array.isArray(question.correctAnswer) ? question.correctAnswer[0] : 0);
    const correctAnswer = options[correctAnswerIndex];

    // Check for generic or low-quality distractors
    const genericPatterns = [
      /^the process of undefined/i,
      /^none of the above/i,
      /^all of the above/i,
      /^option [a-d]$/i,
      /^[a-d]\.?\s*$/i,
      /^yes$/i,
      /^no$/i,
      /^true$/i,
      /^false$/i,
      /^n\/a$/i,
      /^not applicable$/i
    ];

    options.forEach((option, index) => {
      if (index === correctAnswerIndex) return; // Skip correct answer

      // Handle non-string options
      let optionText: string;
      if (typeof option === 'string') {
        optionText = option;
      } else if (option && typeof option === 'object' && option.text) {
        optionText = option.text;
      } else if (option && typeof option.toString === 'function') {
        optionText = option.toString();
      } else {
        optionText = '';
      }

      // Check for generic patterns
      if (genericPatterns.some(pattern => pattern.test(optionText))) {
        warnings.push(`Distractor "${optionText}" is generic or low quality`);
        score -= 20;
      }

      // Check for very short distractors
      if (optionText.length < 10) {
        warnings.push(`Distractor "${optionText}" is too short`);
        score -= 10;
      }

      // Check for repeated content
      const optionLower = optionText.toLowerCase();
      const otherOptions = options.filter((_, i) => i !== index).map(o => {
        const text = typeof o === 'string' ? o : (o.text || o.toString());
        return text.toLowerCase();
      });
      if (otherOptions.some(other => other === optionLower)) {
        warnings.push(`Duplicate option found: "${optionText}"`);
        score -= 25;
      }

      // Check for obvious wrong answers
      const obviousWrongPatterns = [
        /not related/i,
        /nothing to do with/i,
        /completely different/i,
        /unrelated concept/i
      ];

      if (obviousWrongPatterns.some(pattern => pattern.test(optionText))) {
        warnings.push(`Distractor "${optionText}" is too obviously wrong`);
        score -= 15;
      }
    });

    // Check length consistency
    const lengths = options.map(o => {
      let text: string;
      if (typeof o === 'string') {
        text = o;
      } else if (o && typeof o === 'object' && o.text) {
        text = o.text;
      } else if (o && typeof o.toString === 'function') {
        text = o.toString();
      } else {
        text = '';
      }
      return text.length;
    });
    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const lengthVariance = lengths.map(l => Math.abs(l - avgLength)).reduce((a, b) => a + b, 0) / lengths.length;
    
    if (lengthVariance > avgLength * 0.5) {
      warnings.push('Options have inconsistent lengths');
      score -= 10;
    }

    // Check if all distractors are plausible
    const jungianTerms = ['jung', 'archetype', 'shadow', 'anima', 'animus', 'collective', 'unconscious', 
                         'individuation', 'self', 'ego', 'persona', 'complex', 'psyche', 'psychological'];
    
    let plausibleCount = 0;
    options.forEach((option, index) => {
      if (index === correctAnswerIndex) return;
      
      // Handle non-string options
      let optionText: string;
      if (typeof option === 'string') {
        optionText = option;
      } else if (option && typeof option === 'object' && option.text) {
        optionText = option.text;
      } else if (option && typeof option.toString === 'function') {
        optionText = option.toString();
      } else {
        optionText = '';
      }
      const hasJungianContent = jungianTerms.some(term => optionText.toLowerCase().includes(term));
      const hasPsychologicalContent = /psycholog|mental|conscious|personality|behavior|cognitive|emotional/i.test(optionText);
      
      if (hasJungianContent || hasPsychologicalContent) {
        plausibleCount++;
      }
    });

    if (plausibleCount < 2) {
      warnings.push('Not enough plausible distractors related to psychology');
      score -= 20;
    }

    return { score: Math.max(0, score), warnings };
  }

  /**
   * Assess question complexity and cognitive level
   */
  private assessQuestionComplexity(question: Question): number {
    let score = 50; // Base score

    // Handle missing or invalid question text
    if (!question || !question.question || typeof question.question !== 'string') {
      return 0;
    }

    const questionLower = question.question.toLowerCase();

    // Higher cognitive level indicators
    const higherOrderPatterns = [
      /how does .+ differ/i,
      /compare and contrast/i,
      /analyze/i,
      /evaluate/i,
      /what is the relationship/i,
      /explain why/i,
      /which .+ best demonstrates/i,
      /in what way/i,
      /how would jung interpret/i,
      /apply .+ concept/i
    ];

    if (higherOrderPatterns.some(pattern => pattern.test(questionLower))) {
      score += 30;
    }

    // Lower cognitive level indicators (memorization)
    const lowerOrderPatterns = [
      /^what is/i,
      /^who was/i,
      /^when did/i,
      /^define/i,
      /^list/i,
      /^name/i,
      /which of the following is the definition/i
    ];

    if (lowerOrderPatterns.some(pattern => pattern.test(questionLower))) {
      score -= 20;
    }

    // Scenario-based questions get bonus points
    if (questionLower.includes('scenario') || questionLower.includes('example') || 
        questionLower.includes('situation') || questionLower.includes('case')) {
      score += 20;
    }

    // Length as a complexity indicator (longer questions tend to be more complex)
    if (question.question.length > 100) {
      score += 10;
    } else if (question.question.length < 30) {
      score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Generate improvement suggestions for the quiz
   */
  private generateSuggestions(quiz: Quiz, questionResults: QuestionValidationResult[]): string[] {
    const suggestions: string[] = [];

    // Check question diversity
    const difficulties = quiz.questions.map(q => (q as any).difficulty || 'medium');
    const diffCounts = difficulties.reduce((acc, d) => {
      acc[d] = (acc[d] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    if (!diffCounts.easy || !diffCounts.medium || !diffCounts.hard) {
      suggestions.push('Include a mix of easy, medium, and hard questions for better assessment');
    }

    // Check cognitive levels
    const cogLevels = quiz.questions.map(q => (q as any).cognitiveLevel || 'recall');
    const cogCounts = cogLevels.reduce((acc, c) => {
      acc[c] = (acc[c] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    if (cogCounts.recall > quiz.questions.length * 0.5) {
      suggestions.push('Add more application and analysis questions to test deeper understanding');
    }

    // Check for low-scoring questions
    const lowQualityQuestions = questionResults.filter(qr => qr.qualityScore < 70);
    if (lowQualityQuestions.length > 0) {
      suggestions.push(`Improve the quality of ${lowQualityQuestions.length} questions with better distractors`);
    }

    // Check explanation quality
    const shortExplanations = quiz.questions.filter(q => !q.explanation || q.explanation.length < 100);
    if (shortExplanations.length > 0) {
      suggestions.push(`Add more detailed explanations to ${shortExplanations.length} questions`);
    }

    return suggestions;
  }
}

// Export singleton instance
export const quizValidator = new QuizValidator();