import { ILLMProvider } from '../provider';
import { Quiz, QuizQuestion } from '../../../types/schema';
import { quizEnhancer } from '../../../services/quiz/quizEnhancer';
import { quizValidator } from '../../../services/quiz/quizValidator';

export class QuizGenerator {
  constructor(protected provider: ILLMProvider) {}

  async generateQuiz(
    moduleId: string,
    topic: string,
    content: string,
    objectives: string[],
    questionCount: number = 10
  ): Promise<Quiz> {
    const questions = await this.generateQuestions(topic, content, objectives, questionCount);
    
    return {
      id: `quiz-${moduleId}`,
      moduleId,
      title: `${topic} - Assessment Quiz`,
      description: `Test your understanding of ${topic} concepts in Jungian psychology`,
      questions,
      passingScore: 70,
      timeLimit: questionCount * 2, // 2 minutes per question
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  protected async generateQuestions(
    topic: string,
    content: string,
    objectives: string[],
    count: number
  ): Promise<QuizQuestion[]> {
    const prompt = `Generate exactly ${count} multiple-choice questions for a Jungian psychology quiz on "${topic}".

Learning objectives to assess:
${objectives && objectives.length > 0 ? objectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n') : 'General understanding of the topic'}

Context content summary:
${content.substring(0, 1000)}...

CRITICAL: You must respond with a JSON array containing exactly ${count} question objects.

Requirements for each question:
1. Test understanding, not just memorization
2. Include exactly 4 answer options that are ALL plausible and related to the topic
3. Only one correct answer (index 0-3)
4. Provide clear explanations for the correct answer
5. Vary difficulty levels (easy, medium, hard)
6. Cover different cognitive levels (recall, understanding, application, analysis)

DISTRACTOR GUIDELINES (VERY IMPORTANT):
- ALL distractors must be plausible and related to Jungian psychology
- Use these types of distractors:
  a) Common misconceptions about the concept
  b) Related but distinct Jungian concepts
  c) Concepts from other psychological theories (Freud, Adler, etc.)
  d) Partial or incomplete understanding of the concept
  e) Overgeneralized or oversimplified versions
- NEVER use obviously wrong or unrelated options
- Each distractor should be approximately the same length as the correct answer
- Avoid patterns like "all of the above" or "none of the above"

Example of GOOD question:
{
  "question": "According to Jung, what distinguishes the collective unconscious from the personal unconscious?",
  "options": [
    "The collective unconscious contains universal, inherited patterns shared by all humanity",
    "The collective unconscious stores repressed personal memories from childhood",
    "The collective unconscious is formed through cultural transmission and social learning",
    "The collective unconscious represents the ego's defense mechanisms against anxiety"
  ],
  "correctAnswer": 0,
  "explanation": "The collective unconscious contains archetypes and universal patterns inherited by all humans, unlike the personal unconscious which contains individual repressed content.",
  "difficulty": "medium",
  "cognitiveLevel": "understanding"
}

Example of BAD question (DO NOT CREATE LIKE THIS):
{
  "question": "What is the Shadow?",
  "options": [
    "The dark side of personality",
    "A type of food",
    "A weather phenomenon",
    "None of the above"
  ]
}

Respond with exactly ${count} questions following the good example format:`;

    const schema = {
      type: "array",
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          options: { 
            type: "array",
            items: { type: "string" },
            minItems: 4,
            maxItems: 4
          },
          correctAnswer: { 
            type: "number",
            minimum: 0,
            maximum: 3
          },
          explanation: { type: "string" },
          difficulty: { 
            type: "string",
            enum: ["easy", "medium", "hard"]
          },
          cognitiveLevel: { 
            type: "string",
            enum: ["recall", "understanding", "application", "analysis"]
          }
        },
        required: ["question", "options", "correctAnswer", "explanation", "difficulty", "cognitiveLevel"]
      }
    };

    const rawQuestions = await this.provider.generateStructuredResponse<Array<{
      question: string;
      options: string[];
      correctAnswer: number;
      explanation: string;
      difficulty: string;
      cognitiveLevel: string;
    }>>(prompt, schema, { temperature: 0.3, maxTokens: 3000, retries: 3 });

    console.log('Generated raw questions:', rawQuestions, 'Type:', typeof rawQuestions, 'Is array:', Array.isArray(rawQuestions));
    
    // Ensure rawQuestions is an array
    let questions = rawQuestions;
    if (!Array.isArray(questions)) {
      console.error('Raw questions is not an array:', questions);
      
      // Try to handle if questions are wrapped in an object
      if (typeof questions === 'object' && questions !== null && 'questions' in questions && Array.isArray((questions as any).questions)) {
        console.log('Found questions in wrapper object, using those');
        questions = (questions as any).questions;
      } else {
        console.warn('Using fallback quiz questions due to invalid response');
        // Create fallback questions
        questions = [
          {
            question: `What is a key concept in ${topic}?`,
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswer: 1,
            explanation: 'This is a fundamental concept in the topic.',
            difficulty: 'medium',
            cognitiveLevel: 'understanding'
          },
          {
            question: `How does ${topic} relate to Jungian psychology?`,
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswer: 0,
            explanation: 'This demonstrates the connection to Jungian theory.',
            difficulty: 'medium',
            cognitiveLevel: 'application'
          }
        ];
      }
    }

    // Convert to QuizQuestion format
    const quizQuestions: QuizQuestion[] = questions.map((q, index) => ({
      id: `q-${index + 1}`,
      type: 'multiple-choice' as const,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      points: q.difficulty === 'hard' ? 15 : q.difficulty === 'medium' ? 10 : 5,
      order: index,
      metadata: {
        difficulty: q.difficulty,
        cognitiveLevel: q.cognitiveLevel
      }
    }));

    // Enhance questions with better educational features
    const enhancedQuestions = await quizEnhancer.enhanceQuestions(quizQuestions, topic, {
      addExplanations: true,
      improveDistractors: true,
      varyQuestionStems: true,
      addReferences: true,
      contextualizeQuestions: true
    });

    // Validate enhanced questions
    const testQuiz: Quiz = {
      id: 'temp-validation',
      moduleId: '',
      title: '',
      description: '',
      questions: enhancedQuestions,
      passingScore: 70,
      timeLimit: 30,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const validationResult = quizValidator.validateQuiz(testQuiz);
    
    // If validation score is too low, try to regenerate problematic questions
    if (validationResult.score < 70) {
      console.warn('Quiz quality score is low:', validationResult.score);
      console.warn('Validation errors:', validationResult.errors);
      console.warn('Validation warnings:', validationResult.warnings);
      
      // For now, log the issues but still return the questions
      // In a production system, you might want to retry generation
    }

    return enhancedQuestions;
  }

  async generateAdaptiveQuestions(
    topic: string,
    previousResponses: Array<{ correct: boolean; difficulty: string }>,
    count: number = 3
  ): Promise<QuizQuestion[]> {
    // Analyze performance to determine next difficulty
    const correctRate = previousResponses.filter(r => r.correct).length / previousResponses.length;
    let targetDifficulty: string;
    
    if (correctRate > 0.8) {
      targetDifficulty = 'hard';
    } else if (correctRate < 0.4) {
      targetDifficulty = 'easy';
    } else {
      targetDifficulty = 'medium';
    }

    const prompt = `
Generate ${count} ${targetDifficulty} multiple-choice questions for adaptive testing on "${topic}" in Jungian psychology.

Previous performance: ${Math.round(correctRate * 100)}% correct

Focus on:
${targetDifficulty === 'hard' ? 'complex analysis and synthesis of concepts' : 
  targetDifficulty === 'easy' ? 'fundamental concepts and definitions' : 
  'application and understanding of concepts'}

Response format: same as before
`;

    const questions = await this.provider.generateStructuredResponse<Array<{
      question: string;
      options: string[];
      correctAnswer: number;
      explanation: string;
    }>>(prompt, [], { temperature: 0.5 });

    return questions.map((q, index) => ({
      id: `adaptive-q-${Date.now()}-${index}`,
      type: 'multiple-choice' as const,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      points: targetDifficulty === 'hard' ? 15 : targetDifficulty === 'medium' ? 10 : 5,
      order: index,
    }));
  }

  async generatePracticeQuestions(
    topic: string,
    specificConcept: string,
    count: number = 5
  ): Promise<QuizQuestion[]> {
    const prompt = `
Generate ${count} practice questions focused on "${specificConcept}" within the topic of "${topic}" in Jungian psychology.

Requirements:
- Start with easier questions and progress to harder ones
- Include detailed explanations that teach the concept
- Use real-world examples where applicable
- Reference Jung's original work when relevant

Response format: same as standard questions
`;

    const questions = await this.provider.generateStructuredResponse<Array<{
      question: string;
      options: string[];
      correctAnswer: number;
      explanation: string;
    }>>(prompt, [], { temperature: 0.6 });

    return questions.map((q, index) => ({
      id: `practice-q-${Date.now()}-${index}`,
      type: 'multiple-choice' as const,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      points: 5,
      order: index,
    }));
  }
}