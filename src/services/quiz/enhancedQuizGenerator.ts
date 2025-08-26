/**
 * Enhanced Quiz Generator for Jung Educational App
 * Integrates templates and enhancement features for better educational quizzes
 */

import { ILLMProvider } from '../llm/types';
import { Quiz, Question } from '../../types';
import { QuizGenerator } from '../llm/generators/quiz-generator';
import { quizEnhancer, EnhancementOptions } from './quizEnhancer';
import { quizPromptService, QuizPromptConfig } from './quizPromptService';
import { ensureVariedCorrectAnswerPositions } from '../../utils/quizUtils';

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

    // Randomize option positions to ensure variety
    questions = ensureVariedCorrectAnswerPositions(questions);

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
    // Get difficulty distribution based on user level
    const distribution = this.getDistributionForLevel(options.userLevel);
    
    // Calculate question distribution
    const questionDistribution = this.calculateQuestionDistribution(count, distribution);
    
    // Generate questions for each difficulty level
    const allQuestions: Question[] = [];
    
    for (const [difficulty, questionCount] of Object.entries(questionDistribution)) {
      if (questionCount > 0) {
        const questions = await this.generateQuestionsByDifficulty(
          topic,
          content,
          objectives,
          difficulty,
          questionCount
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
    count: number
  ): Promise<Question[]> {
    // Use centralized prompt service
    const concepts = quizPromptService.getTopicConcepts(topic);
    const userLevel = this.mapDifficultyToLevel(difficulty);
    
    const promptConfig: QuizPromptConfig = {
      topic,
      difficulty: difficulty as 'easy' | 'medium' | 'hard',
      concepts,
      objectives,
      count,
      userLevel
    };
    
    const prompt = await quizPromptService.getQuizGenerationPrompt(promptConfig);

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
    let questionsArray = rawQuestions;
    
    // Verificar se retornou um objeto com propriedade 'questions'
    if (rawQuestions && typeof rawQuestions === 'object' && 'questions' in (rawQuestions as any)) {
      console.log('Extraindo array de questões do objeto retornado');
      questionsArray = (rawQuestions as any).questions;
    }
    
    if (!Array.isArray(questionsArray)) {
      // Se retornou um objeto único, converter para array
      if (questionsArray && typeof questionsArray === 'object' && 'question' in questionsArray) {
        console.log('Convertendo objeto único para array de questões');
        questionsArray = [questionsArray as any];
      } else {
        console.error('Questões do quiz não estão em formato de array:', questionsArray);
        // Criar questões de fallback em português
        const fallbackQuestions = Array.from({ length: count }, (_, i) => {
          // Randomizar a posição da resposta correta
          const correctPosition = i % 4; // Varia entre 0, 1, 2, 3
          const options = [
            'Um princípio da psicologia comportamental',
            'Uma técnica de terapia cognitiva',
            'Um fenômeno da psicologia social',
            'Uma abordagem da psicologia humanista'
          ];
          
          // Inserir a resposta correta na posição aleatória
          options.splice(correctPosition, 0, `Um conceito fundamental em ${topic} segundo Jung`);
          options.pop(); // Remove o último para manter 4 opções
          
          return {
            question: `Qual é um aspecto fundamental de ${topic} na psicologia junguiana?`,
            type: 'multiple-choice',
            options,
            correctAnswer: correctPosition,
            explanation: `Isso se relaciona aos princípios fundamentais de ${topic} na psicologia analítica de Jung.`,
            difficulty: difficulty
          };
        });
        return fallbackQuestions.map((q, index) => this.formatTemplatedQuestion(q, index, difficulty));
      }
    }

    return questionsArray.map((q: any, index: number) => this.formatTemplatedQuestion(q, index, difficulty));
  }

  /**
   * Map difficulty to user level
   */
  private mapDifficultyToLevel(difficulty: string): 'beginner' | 'intermediate' | 'advanced' {
    switch (difficulty) {
      case 'easy':
        return 'beginner';
      case 'hard':
        return 'advanced';
      default:
        return 'intermediate';
    }
  }

  /**
   * Get difficulty distribution for user level
   */
  private getDistributionForLevel(level: 'beginner' | 'intermediate' | 'advanced') {
    const distributions = {
      beginner: { easy: 0.5, medium: 0.4, hard: 0.1 },
      intermediate: { easy: 0.2, medium: 0.6, hard: 0.2 },
      advanced: { easy: 0.1, medium: 0.4, hard: 0.5 }
    };
    return distributions[level];
  }

  /**
   * Format a templated question into Question format
   */
  private formatTemplatedQuestion(
    rawQuestion: any,
    index: number,
    difficulty: string
  ): Question {
    // Garantir que sempre haja uma explicação
    const explanation = rawQuestion.explanation || 
      `Esta questão avalia sua compreensão sobre ${rawQuestion.question?.substring(0, 50)}... ` +
      `A resposta correta demonstra conhecimento dos princípios fundamentais da psicologia junguiana. ` +
      `É importante compreender como este conceito se relaciona com outros aspectos da teoria de Jung.`;
    
    const baseQuestion: Question = {
      id: `q-${difficulty}-${index + 1}`,
      type: rawQuestion.type || 'multiple-choice',
      question: rawQuestion.question,
      options: [], // Default empty array, will be overridden below
      correctAnswer: 0, // Default value, will be overridden below
      explanation,
      points: difficulty === 'hard' ? 15 : difficulty === 'medium' ? 10 : 5,
      order: index,
      metadata: {
        difficulty,
        templated: true
      }
    };

    // Add type-specific properties
    if (rawQuestion.type === 'multiple-choice' || !rawQuestion.type) {
      // Normalizar opções - remover prefixos como "A)", "B)", etc.
      let normalizedOptions = rawQuestion.options;
      
      if (Array.isArray(rawQuestion.options)) {
        normalizedOptions = rawQuestion.options.map((opt: any) => {
          if (typeof opt === 'string') {
            // Remover prefixos como "A)", "B)", "1.", etc.
            return opt.replace(/^[A-D]\)\s*|^[1-4]\.\s*|^\d+\)\s*/i, '').trim();
          }
          return opt;
        });
      }
      
      return {
        ...baseQuestion,
        options: normalizedOptions || [],
        correctAnswer: rawQuestion.correctAnswer || 0
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
    const prompt = `
Gere ${count} questões dissertativas sobre "${topic}" em psicologia junguiana.

🆑 IMPORTANTE: TODAS as questões devem estar em PORTUGUÊS BRASILEIRO.

Foco em:
- Integração e síntese de conceitos
- Reflexão pessoal e aplicação
- Análise crítica

Objetivos de aprendizagem:
${objectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n')}

Para cada questão forneça:
{
  "question": "Pergunta dissertativa que encoraja reflexão profunda",
  "type": "essay",
  "rubric": {
    "required": ["conceito1", "conceito2"],
    "optional": ["adicional1", "adicional2"],
    "depth": 200
  },
  "explanation": "Orientação sobre o que uma boa resposta deve incluir"
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
        question: `Discuta a importância de ${topic} na psicologia junguiana. Foque em como este conceito contribui para o desenvolvimento psicológico pessoal.`,
        type: 'essay',
        rubric: {
          required: ['conceitos-chave', 'compreensão', topic.toLowerCase()],
          optional: ['exemplos', 'análise', 'reflexão pessoal'],
          depth: 200
        },
        explanation: `Uma discussão abrangente deve abordar os princípios fundamentais de ${topic}, seu papel na teoria junguiana e aplicações práticas para o desenvolvimento psicológico.`
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
              name: 'Compreensão do Conteúdo',
              description: 'Demonstra compreensão dos conceitos-chave',
              levels: [
                { score: 25, description: 'Excelente compreensão com insights profundos' },
                { score: 20, description: 'Boa compreensão com explicações claras' },
                { score: 15, description: 'Compreensão básica com algumas lacunas' },
                { score: 10, description: 'Compreensão limitada' },
                { score: 0, description: 'Nenhuma compreensão demonstrada' }
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