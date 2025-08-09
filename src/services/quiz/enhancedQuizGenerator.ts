/**
 * Enhanced Quiz Generator for Jung Educational App
 * Integrates templates and enhancement features for better educational quizzes
 */

import { ILLMProvider } from '../llm/types';
import { Quiz, Question } from '../../types';
import { QuizGenerator } from '../llm/generators/quiz-generator';
import { quizEnhancer, EnhancementOptions } from './quizEnhancer';
import { 
  getQuestionTemplate, 
  getTopicConcepts, 
  topicTemplates,
  difficultyProgressions,
  jungQuestionTypes,
  QuestionTemplate
} from './quizTemplates';

export interface EnhancedQuizOptions {
  useTemplates: boolean;
  enhanceQuestions: boolean;
  adaptiveDifficulty: boolean;
  includeEssayQuestions: boolean;
  contextualizeQuestions: boolean;
  userLevel: 'beginner' | 'intermediate' | 'advanced';
}

export class EnhancedQuizGenerator extends QuizGenerator {
  constructor(provider: ILLMProvider) {
    super(provider);
  }

  /**
   * Generate an enhanced quiz with templates and improvements
   */
  async generateEnhancedQuiz(
    moduleId: string,
    topic: string,
    content: string,
    objectives: string[],
    questionCount: number = 10,
    options: EnhancedQuizOptions = {
      useTemplates: true,
      enhanceQuestions: true,
      adaptiveDifficulty: true,
      includeEssayQuestions: false,
      contextualizeQuestions: true,
      userLevel: 'intermediate'
    }
  ): Promise<Quiz> {
    // Handle zero question count
    if (questionCount <= 0) {
      return {
        id: `quiz-${moduleId}`,
        moduleId,
        title: `${topic} - Enhanced Assessment`,
        description: `Comprehensive assessment of your understanding of ${topic} in Jungian psychology`,
        questions: [],
        passingScore: 70,
        timeLimit: 0,
        metadata: {
          enhanced: true,
          userLevel: options.userLevel,
          concepts: [],
          difficultyDistribution: { easy: 0, medium: 0, hard: 0 }
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    // Generate base questions using templates if enabled
    let questions: Question[];
    
    if (options.useTemplates) {
      questions = await this.generateTemplatedQuestions(
        topic, 
        content, 
        objectives, 
        questionCount,
        options
      );
    } else {
      questions = await this.generateQuestions(topic, content, objectives, questionCount);
    }

    // Add essay questions if requested and not already included
    if (options.includeEssayQuestions && !questions.some(q => q.type === 'essay')) {
      const essayCount = Math.max(1, Math.floor(questionCount * 0.2));
      const essayQuestions = await this.generateEssayQuestions(
        topic,
        objectives,
        essayCount
      );
      
      // Replace some questions with essays or add them
      if (questions.length >= essayCount) {
        questions.splice(questions.length - essayCount, essayCount, ...essayQuestions);
      } else {
        questions.push(...essayQuestions);
      }
    }

    // Enhance questions if enabled
    if (options.enhanceQuestions) {
      const enhancementOptions: EnhancementOptions = {
        addExplanations: true,
        improveDistractors: true,
        varyQuestionStems: true,
        addReferences: true,
        contextualizeQuestions: options.contextualizeQuestions
      };
      
      questions = await quizEnhancer.enhanceQuestions(questions, topic, enhancementOptions);
    }

    // Add metadata and create quiz
    return {
      id: `quiz-${moduleId}`,
      moduleId,
      title: `${topic} - Enhanced Assessment`,
      description: `Comprehensive assessment of your understanding of ${topic} in Jungian psychology`,
      questions,
      passingScore: 70,
      timeLimit: this.calculateTimeLimit(questions),
      metadata: {
        enhanced: true,
        userLevel: options.userLevel,
        concepts: this.extractQuizConcepts(questions),
        difficultyDistribution: this.analyzeDifficultyDistribution(questions)
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Generate questions using templates
   */
  private async generateTemplatedQuestions(
    topic: string,
    content: string,
    objectives: string[],
    count: number,
    options: EnhancedQuizOptions
  ): Promise<Question[]> {
    const topicTemplate = topicTemplates.find(t => t.topic === topic);
    const progression = difficultyProgressions[options.userLevel];
    
    // Calculate question distribution
    const distribution = this.calculateQuestionDistribution(count, progression.questionDistribution);
    
    // Generate questions for each difficulty level
    const allQuestions: Question[] = [];
    
    for (const [difficulty, questionCount] of Object.entries(distribution)) {
      if (questionCount > 0) {
        const questions = await this.generateQuestionsByDifficulty(
          topic,
          content,
          objectives,
          difficulty,
          questionCount,
          topicTemplate
        );
        allQuestions.push(...questions);
      }
    }

    // Add essay questions if requested
    if (options.includeEssayQuestions && count > 5) {
      const essayCount = Math.max(1, Math.floor(count * 0.2));
      const essayQuestions = await this.generateEssayQuestions(
        topic,
        objectives,
        essayCount
      );
      
      // Replace some MC questions with essays
      allQuestions.splice(allQuestions.length - essayCount, essayCount, ...essayQuestions);
    }

    return allQuestions;
  }

  /**
   * Generate questions for a specific difficulty level
   */
  private async generateQuestionsByDifficulty(
    topic: string,
    content: string,
    objectives: string[],
    difficulty: string,
    count: number,
    topicTemplate: any
  ): Promise<Question[]> {
    const template = getQuestionTemplate(topic, difficulty);
    const concepts = getTopicConcepts(topic);
    
    const prompt = this.buildTemplatedPrompt(
      topic,
      content,
      objectives,
      difficulty,
      count,
      template,
      concepts
    );

    const rawQuestions = await this.provider.generateStructuredOutput<Array<{
      question: string;
      type: string;
      options?: string[];
      correctAnswer?: number;
      expectedKeywords?: string[];
      rubric?: any;
      explanation: string;
    }>>(prompt, [], { temperature: 0.6, maxTokens: 2000 });

    // Ensure rawQuestions is an array
    if (!Array.isArray(rawQuestions)) {
      console.error('Enhanced quiz raw questions is not an array:', rawQuestions);
      // Create fallback questions that include the topic
      const fallbackQuestions = Array.from({ length: count }, (_, i) => ({
        question: `What is a key aspect of ${topic} in Jungian psychology?`,
        type: 'multiple-choice',
        options: [
          `A fundamental concept in ${topic}`,
          'A behavioral psychology principle',
          'A cognitive therapy technique',
          'A social psychology phenomenon'
        ],
        correctAnswer: 0,
        explanation: `This relates to core principles of ${topic} in Jung's analytical psychology.`,
        difficulty: difficulty
      }));
      return fallbackQuestions.map((q, index) => this.formatTemplatedQuestion(q, index, difficulty));
    }

    return rawQuestions.map((q, index) => this.formatTemplatedQuestion(q, index, difficulty));
  }

  /**
   * Build a prompt using templates
   */
  private buildTemplatedPrompt(
    topic: string,
    content: string,
    objectives: string[],
    difficulty: string,
    count: number,
    template: QuestionTemplate,
    concepts: string[]
  ): string {
    return `
Generate ${count} ${difficulty} questions about "${topic}" in Jungian psychology.

Use this question structure template:
"${template.structure}"

Question type: ${template.type}

Key concepts to assess:
${concepts.slice(0, 5).join(', ')}

Learning objectives:
${objectives.slice(0, 3).map((obj, i) => `${i + 1}. ${obj}`).join('\n')}

Context from content:
${content.substring(0, 800)}...

${template.type === 'multiple-choice' ? `
Distractor patterns to use:
${template.optionPatterns?.join('\n')}
` : ''}

${template.type === 'essay' || template.type === 'short-answer' ? `
Expected answer should cover these aspects:
- Key Jungian concepts
- Personal understanding/application
- References to Jung's work (if applicable)
` : ''}

For each question provide:
{
  "question": "The question text following the template",
  "type": "${template.type}",
  ${template.type === 'multiple-choice' ? '"options": ["A", "B", "C", "D"], "correctAnswer": 0,' : ''}
  ${template.type === 'short-answer' || template.type === 'essay' ? '"expectedKeywords": ["keyword1", "keyword2"], "rubric": {},' : ''}
  "explanation": "Detailed explanation following template: ${template.explanationTemplate}"
}
`;
  }

  /**
   * Format a templated question into Question format
   */
  private formatTemplatedQuestion(
    rawQuestion: any,
    index: number,
    difficulty: string
  ): Question {
    const baseQuestion: Question = {
      id: `q-${difficulty}-${index + 1}`,
      type: rawQuestion.type || 'multiple-choice',
      question: rawQuestion.question,
      options: [], // Default empty array, will be overridden below
      correctAnswer: 0, // Default value, will be overridden below
      explanation: rawQuestion.explanation,
      points: difficulty === 'hard' ? 15 : difficulty === 'medium' ? 10 : 5,
      order: index,
      metadata: {
        difficulty,
        templated: true
      }
    };

    // Add type-specific properties
    if (rawQuestion.type === 'multiple-choice') {
      return {
        ...baseQuestion,
        options: rawQuestion.options,
        correctAnswer: rawQuestion.correctAnswer
      };
    } else if (rawQuestion.type === 'short-answer' || rawQuestion.type === 'essay') {
      return {
        ...baseQuestion,
        expectedKeywords: rawQuestion.expectedKeywords,
        rubric: rawQuestion.rubric
      };
    }

    return baseQuestion;
  }

  /**
   * Generate essay questions
   */
  private async generateEssayQuestions(
    topic: string,
    objectives: string[],
    count: number
  ): Promise<Question[]> {
    const essayTemplate = jungQuestionTypes.individuationProcess;
    
    const prompt = `
Generate ${count} essay questions about "${topic}" in Jungian psychology.

Focus on:
- Integration and synthesis of concepts
- Personal reflection and application
- Critical analysis

Learning objectives:
${objectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n')}

For each question provide:
{
  "question": "Essay prompt that encourages deep reflection",
  "type": "essay",
  "rubric": {
    "required": ["concept1", "concept2"],
    "optional": ["additional1", "additional2"],
    "depth": 200
  },
  "explanation": "Guidance on what a good answer should include"
}
`;

    const rawQuestions = await this.provider.generateStructuredOutput<Array<{
      question: string;
      type: string;
      rubric: any;
      explanation: string;
    }>>(prompt, [], { temperature: 0.7, maxTokens: 1500 });

    // Ensure rawQuestions is an array
    if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
      console.error('Essay raw questions is not an array or empty:', rawQuestions);
      // Create fallback essay questions
      const fallbackQuestions = Array.from({ length: count }, (_, i) => ({
        question: `Discuss the significance of ${topic} in Jungian psychology. Focus on how this concept contributes to personal psychological development.`,
        type: 'essay',
        rubric: {
          required: ['key concepts', 'understanding', topic.toLowerCase()],
          optional: ['examples', 'analysis', 'personal reflection'],
          depth: 200
        },
        explanation: `A comprehensive discussion should address the core principles of ${topic}, its role in Jungian theory, and practical applications for psychological development.`
      }));
      return fallbackQuestions.map((q, index) => ({
        id: `essay-${index + 1}`,
        type: 'essay' as const,
        question: q.question,
        options: [], // Essay questions don't have options
        correctAnswer: -1, // Not applicable for essay questions
        rubric: {
          criteria: [
            {
              name: 'Content Understanding',
              description: 'Demonstrates understanding of key concepts',
              levels: [
                { score: 25, description: 'Excellent understanding with deep insights' },
                { score: 20, description: 'Good understanding with clear explanations' },
                { score: 15, description: 'Basic understanding with some gaps' },
                { score: 10, description: 'Limited understanding' },
                { score: 0, description: 'No understanding demonstrated' }
              ]
            }
          ],
          maxScore: 25
        },
        explanation: q.explanation,
        points: 25,
        order: index,
        metadata: {
          difficulty: 'hard',
          cognitiveLevel: 'create'
        }
      }));
    }

    return rawQuestions.map((q, index) => ({
      id: `essay-${index + 1}`,
      type: 'essay' as const,
      question: q.question,
      options: [], // Essay questions don't have options
      correctAnswer: -1, // Not applicable for essay questions
      rubric: {
        criteria: [
          {
            name: 'Content Understanding',
            description: 'Demonstrates understanding of key concepts',
            levels: [
              { score: 25, description: 'Excellent understanding with deep insights' },
              { score: 20, description: 'Good understanding with clear explanations' },
              { score: 15, description: 'Basic understanding with some gaps' },
              { score: 10, description: 'Limited understanding' },
              { score: 0, description: 'No understanding demonstrated' }
            ]
          }
        ],
        maxScore: 25
      },
      explanation: q.explanation,
      points: 25,
      order: index,
      metadata: {
        difficulty: 'hard',
        cognitiveLevel: 'create'
      }
    }));
  }

  /**
   * Helper methods
   */
  private calculateQuestionDistribution(
    total: number,
    distribution: { easy: number; medium: number; hard: number }
  ): { easy: number; medium: number; hard: number } {
    return {
      easy: Math.round(total * distribution.easy),
      medium: Math.round(total * distribution.medium),
      hard: Math.round(total * distribution.hard)
    };
  }

  private calculateTimeLimit(questions: Question[]): number {
    let totalMinutes = 0;
    
    questions.forEach(q => {
      switch (q.type) {
        case 'multiple-choice':
        case 'true-false':
          totalMinutes += 2;
          break;
        case 'short-answer':
          totalMinutes += 5;
          break;
        case 'essay':
          totalMinutes += 15;
          break;
        default:
          totalMinutes += 3;
      }
    });
    
    return totalMinutes;
  }

  private extractQuizConcepts(questions: Question[]): string[] {
    const concepts = new Set<string>();
    
    questions.forEach(q => {
      if (q.metadata?.concepts) {
        q.metadata.concepts.forEach((c: string) => concepts.add(c));
      }
    });
    
    return Array.from(concepts);
  }

  private analyzeDifficultyDistribution(questions: Question[]): Record<string, number> {
    const distribution: Record<string, number> = {
      easy: 0,
      medium: 0,
      hard: 0
    };
    
    questions.forEach(q => {
      const difficulty = q.metadata?.difficulty || 'medium';
      distribution[difficulty] = (distribution[difficulty] || 0) + 1;
    });
    
    return distribution;
  }

  /**
   * Generate a study guide based on quiz performance
   */
  async generateStudyGuide(
    quiz: Quiz,
    userResponses: Array<{ questionId: string; correct: boolean }>,
    topic: string
  ): Promise<string> {
    const incorrectQuestions = userResponses
      .filter(r => !r.correct)
      .map(r => quiz.questions.find(q => q.id === r.questionId))
      .filter(Boolean);

    const weakConcepts = this.identifyWeakConcepts(incorrectQuestions);
    const studyPlan = await this.createStudyPlan(topic, weakConcepts);
    
    return studyPlan;
  }

  private identifyWeakConcepts(incorrectQuestions: (Question | undefined)[]): string[] {
    const concepts = new Map<string, number>();
    
    incorrectQuestions.forEach(q => {
      if (q?.metadata?.concepts) {
        q.metadata.concepts.forEach((c: string) => {
          concepts.set(c, (concepts.get(c) || 0) + 1);
        });
      }
    });
    
    // Sort by frequency (most missed concepts first)
    return Array.from(concepts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([concept]) => concept);
  }

  private async createStudyPlan(topic: string, weakConcepts: string[]): Promise<string> {
    const prompt = `
Create a personalized study guide for someone who struggled with these Jungian concepts in "${topic}":
${weakConcepts.slice(0, 5).join(', ')}

Include:
1. Core concept explanations
2. Common misconceptions to avoid
3. Recommended readings from Jung's work
4. Practice exercises
5. Real-world applications

Format as a structured study plan.
`;

    const response = await this.provider.generateCompletion(prompt, { temperature: 0.7, maxTokens: 1500 });
    return response.content;
  }
}