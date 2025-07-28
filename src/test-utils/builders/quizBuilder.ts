// Quiz and Question types are defined inline in the schema
// Using any types for flexibility in tests
type Quiz = any;
type Question = any;

/**
 * Builder pattern for creating test quizzes with flexible configurations
 */
export class QuizBuilder {
  private quiz: Partial<Quiz> = {};
  private questions: Question[] = [];

  constructor() {
    this.quiz = {
      id: `quiz-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: 'Test Quiz',
      questions: []
    };
  }

  withId(id: string): QuizBuilder {
    this.quiz.id = id;
    return this;
  }

  withTitle(title: string): QuizBuilder {
    this.quiz.title = title;
    return this;
  }

  withDescription(description: string): QuizBuilder {
    this.quiz.description = description;
    return this;
  }

  withTimeLimit(minutes: number): QuizBuilder {
    this.quiz.timeLimit = minutes;
    return this;
  }

  withPassingScore(score: number): QuizBuilder {
    this.quiz.passingScore = score;
    return this;
  }

  withInstructions(instructions: string): QuizBuilder {
    this.quiz.instructions = instructions;
    return this;
  }

  addQuestion(question: Question): QuizBuilder {
    this.questions.push(question);
    return this;
  }

  addMultipleChoiceQuestion(options: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    concept?: string;
  }): QuizBuilder {
    const question: Question = {
      id: `q${this.questions.length + 1}`,
      type: 'multiple-choice',
      question: options.question,
      options: options.options.map((text, index) => ({
        id: index.toString(),
        text,
        isCorrect: index === options.correctIndex
      })),
      correctAnswer: options.correctIndex,
      explanation: options.explanation || 'No explanation provided',
      difficulty: options.difficulty || 'medium',
      concept: options.concept
    };

    this.questions.push(question);
    return this;
  }

  addTrueFalseQuestion(options: {
    question: string;
    correctAnswer: boolean;
    explanation?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    concept?: string;
  }): QuizBuilder {
    const question: Question = {
      id: `q${this.questions.length + 1}`,
      type: 'true-false',
      question: options.question,
      correctAnswer: options.correctAnswer,
      explanation: options.explanation || 'No explanation provided',
      difficulty: options.difficulty || 'medium',
      concept: options.concept
    };

    this.questions.push(question);
    return this;
  }

  addEssayQuestion(options: {
    question: string;
    sampleAnswer?: string;
    rubric?: string[];
    difficulty?: 'easy' | 'medium' | 'hard';
    concept?: string;
  }): QuizBuilder {
    const question: Question = {
      id: `q${this.questions.length + 1}`,
      type: 'essay',
      question: options.question,
      sampleAnswer: options.sampleAnswer,
      rubric: options.rubric,
      difficulty: options.difficulty || 'medium',
      concept: options.concept
    };

    this.questions.push(question);
    return this;
  }

  /**
   * Adds multiple questions of mixed types
   */
  withMixedQuestions(count: number, options?: {
    concepts?: string[];
    difficulties?: Array<'easy' | 'medium' | 'hard'>;
    includeEssay?: boolean;
  }): QuizBuilder {
    const {
      concepts = ['collective unconscious', 'shadow', 'archetypes', 'individuation'],
      difficulties = ['easy', 'medium', 'hard'],
      includeEssay = false
    } = options || {};

    for (let i = 0; i < count; i++) {
      const concept = concepts[i % concepts.length];
      const difficulty = difficulties[i % difficulties.length];

      if (i % 3 === 0) {
        // Multiple choice
        this.addMultipleChoiceQuestion({
          question: `What aspect of ${concept} is most important?`,
          options: [
            `Understanding ${concept} deeply`,
            `Applying ${concept} practically`,
            `Analyzing ${concept} theoretically`,
            `Integrating ${concept} personally`
          ],
          correctIndex: i % 4,
          explanation: `This relates to the core understanding of ${concept}`,
          difficulty,
          concept
        });
      } else if (i % 3 === 1) {
        // True/False
        this.addTrueFalseQuestion({
          question: `The ${concept} is always conscious and easily accessible.`,
          correctAnswer: false,
          explanation: `Most Jungian concepts, including ${concept}, operate largely in the unconscious.`,
          difficulty,
          concept
        });
      } else if (includeEssay) {
        // Essay
        this.addEssayQuestion({
          question: `Describe how ${concept} manifests in everyday life.`,
          sampleAnswer: `The ${concept} can be observed in various ways...`,
          rubric: [
            'Demonstrates understanding of the concept',
            'Provides relevant examples',
            'Shows personal insight'
          ],
          difficulty,
          concept
        });
      } else {
        // Another multiple choice
        this.addMultipleChoiceQuestion({
          question: `Which archetype is most closely related to ${concept}?`,
          options: ['The Self', 'The Shadow', 'The Hero', 'The Wise Old Man'],
          correctIndex: (i + 1) % 4,
          explanation: `This archetype has a special relationship with ${concept}`,
          difficulty,
          concept
        });
      }
    }

    return this;
  }

  build(): Quiz {
    return {
      ...this.quiz,
      questions: this.questions
    } as Quiz;
  }

  /**
   * Creates a basic quiz for testing
   */
  static basic(questionCount: number = 5): Quiz {
    return new QuizBuilder()
      .withTitle('Basic Jungian Concepts Quiz')
      .withDescription('Test your understanding of basic Jungian psychology')
      .withTimeLimit(10)
      .withPassingScore(70)
      .withMixedQuestions(questionCount)
      .build();
  }

  /**
   * Creates a comprehensive quiz with all question types
   */
  static comprehensive(): Quiz {
    return new QuizBuilder()
      .withTitle('Comprehensive Jungian Psychology Assessment')
      .withDescription('A thorough assessment of Jungian concepts')
      .withTimeLimit(30)
      .withPassingScore(75)
      .withInstructions('Answer all questions to the best of your ability. Essay questions require thoughtful responses.')
      .withMixedQuestions(10, { includeEssay: true })
      .build();
  }

  /**
   * Creates a quiz focused on a specific concept
   */
  static forConcept(concept: string, questionCount: number = 5): Quiz {
    return new QuizBuilder()
      .withTitle(`${concept} Assessment`)
      .withDescription(`Test your understanding of ${concept}`)
      .withTimeLimit(questionCount * 2)
      .withPassingScore(70)
      .withMixedQuestions(questionCount, { concepts: [concept] })
      .build();
  }

  /**
   * Creates a quiz with specific difficulty
   */
  static withDifficulty(difficulty: 'easy' | 'medium' | 'hard', questionCount: number = 5): Quiz {
    return new QuizBuilder()
      .withTitle(`${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Level Quiz`)
      .withDescription(`A ${difficulty} level assessment of Jungian concepts`)
      .withTimeLimit(questionCount * (difficulty === 'easy' ? 1.5 : difficulty === 'medium' ? 2 : 3))
      .withPassingScore(difficulty === 'easy' ? 60 : difficulty === 'medium' ? 70 : 80)
      .withMixedQuestions(questionCount, { difficulties: [difficulty] })
      .build();
  }
}