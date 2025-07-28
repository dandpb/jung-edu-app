/**
 * Specialized Question Type Generators
 * Creates different types of questions with specific patterns and validation
 */

import { ILLMProvider } from '../llm/types';
import { Question } from '../../types';

export interface QuestionGenerationContext {
  topic: string;
  content: string;
  difficulty: 'easy' | 'medium' | 'hard';
  language: 'pt-BR' | 'en';
  concepts: string[];
  learningObjectives: string[];
}

export interface MultipleChoiceOptions {
  distractorStrategy: 'misconceptions' | 'related-concepts' | 'partial-truths' | 'mixed';
  optionLength: 'short' | 'medium' | 'long';
  includeAllOfAbove: boolean;
  conceptualDepth: 'surface' | 'deep';
}

export interface TrueFalseOptions {
  statementType: 'definition' | 'application' | 'relationship' | 'comparison';
  includeNuances: boolean;
  trapComplexity: 'simple' | 'moderate' | 'complex';
}

export interface ShortAnswerOptions {
  expectedLength: 'brief' | 'moderate' | 'detailed';
  requireExamples: boolean;
  keywordCount: number;
  allowMultipleCorrect: boolean;
}

export interface EssayOptions {
  essayType: 'analytical' | 'comparative' | 'evaluative' | 'synthetic';
  wordCountRange: { min: number; max: number };
  requiredElements: string[];
  rubricDetail: 'basic' | 'detailed' | 'comprehensive';
}

export class QuestionTypeGenerators {
  constructor(private provider: ILLMProvider) {}

  /**
   * Generate Multiple Choice Questions
   */
  async generateMultipleChoice(
    context: QuestionGenerationContext,
    count: number,
    options: MultipleChoiceOptions
  ): Promise<Question[]> {
    const prompt = this.buildMultipleChoicePrompt(context, count, options);
    
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
          correctAnswer: { type: "number", minimum: 0, maximum: 3 },
          explanation: { type: "string" },
          distractorAnalysis: {
            type: "array",
            items: {
              type: "object",
              properties: {
                option: { type: "string" },
                why_wrong: { type: "string" },
                strategy: { type: "string" }
              }
            }
          }
        },
        required: ["question", "options", "correctAnswer", "explanation"]
      }
    };

    try {
      const rawQuestions = await this.provider.generateStructuredOutput<any[]>(
        prompt, schema, { temperature: 0.3, maxTokens: 3000 }
      );

      return rawQuestions.map((q, index) => this.formatMultipleChoiceQuestion(q, index, context));
    } catch (error) {
      console.error('Error generating multiple choice questions:', error);
      return this.generateFallbackMultipleChoice(context, count);
    }
  }

  /**
   * Generate True/False Questions
   */
  async generateTrueFalse(
    context: QuestionGenerationContext,
    count: number,
    options: TrueFalseOptions
  ): Promise<Question[]> {
    const prompt = this.buildTrueFalsePrompt(context, count, options);

    const schema = {
      type: "array",
      items: {
        type: "object",
        properties: {
          statement: { type: "string" },
          isTrue: { type: "boolean" },
          explanation: { type: "string" },
          trapType: { type: "string" },
          nuanceLevel: { type: "string" }
        },
        required: ["statement", "isTrue", "explanation"]
      }
    };

    try {
      const rawQuestions = await this.provider.generateStructuredOutput<any[]>(
        prompt, schema, { temperature: 0.4, maxTokens: 2000 }
      );

      return rawQuestions.map((q, index) => this.formatTrueFalseQuestion(q, index, context));
    } catch (error) {
      console.error('Error generating true/false questions:', error);
      return this.generateFallbackTrueFalse(context, count);
    }
  }

  /**
   * Generate Short Answer Questions
   */
  async generateShortAnswer(
    context: QuestionGenerationContext,
    count: number,
    options: ShortAnswerOptions
  ): Promise<Question[]> {
    const prompt = this.buildShortAnswerPrompt(context, count, options);

    const schema = {
      type: "array",
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          expectedAnswer: { type: "string" },
          keyKeywords: { 
            type: "array",
            items: { type: "string" }
          },
          alternativeAnswers: {
            type: "array",
            items: { type: "string" }
          },
          scoringRubric: {
            type: "object",
            properties: {
              excellent: { type: "string" },
              good: { type: "string" },
              fair: { type: "string" },
              poor: { type: "string" }
            }
          }
        },
        required: ["question", "expectedAnswer", "keyKeywords"]
      }
    };

    try {
      const rawQuestions = await this.provider.generateStructuredOutput<any[]>(
        prompt, schema, { temperature: 0.5, maxTokens: 2500 }
      );

      return rawQuestions.map((q, index) => this.formatShortAnswerQuestion(q, index, context));
    } catch (error) {
      console.error('Error generating short answer questions:', error);
      return this.generateFallbackShortAnswer(context, count);
    }
  }

  /**
   * Generate Essay Questions
   */
  async generateEssay(
    context: QuestionGenerationContext,
    count: number,
    options: EssayOptions
  ): Promise<Question[]> {
    const prompt = this.buildEssayPrompt(context, count, options);

    const schema = {
      type: "array",
      items: {
        type: "object",
        properties: {
          prompt: { type: "string" },
          guidelines: { type: "string" },
          rubric: {
            type: "object",
            properties: {
              criteria: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    description: { type: "string" },
                    points: { type: "number" }
                  }
                }
              },
              totalPoints: { type: "number" },
              gradingNotes: { type: "string" }
            }
          },
          sampleResponse: { type: "string" }
        },
        required: ["prompt", "guidelines", "rubric"]
      }
    };

    try {
      const rawQuestions = await this.provider.generateStructuredOutput<any[]>(
        prompt, schema, { temperature: 0.6, maxTokens: 3500 }
      );

      return rawQuestions.map((q, index) => this.formatEssayQuestion(q, index, context, options));
    } catch (error) {
      console.error('Error generating essay questions:', error);
      return this.generateFallbackEssay(context, count, options);
    }
  }

  /**
   * Generate Matching Questions
   */
  async generateMatching(
    context: QuestionGenerationContext,
    count: number
  ): Promise<Question[]> {
    const prompt = this.buildMatchingPrompt(context, count);

    const schema = {
      type: "array",
      items: {
        type: "object",
        properties: {
          instruction: { type: "string" },
          leftColumn: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                text: { type: "string" }
              }
            }
          },
          rightColumn: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                text: { type: "string" }
              }
            }
          },
          correctMatches: {
            type: "array",
            items: {
              type: "object",
              properties: {
                left: { type: "string" },
                right: { type: "string" }
              }
            }
          }
        },
        required: ["instruction", "leftColumn", "rightColumn", "correctMatches"]
      }
    };

    try {
      const rawQuestions = await this.provider.generateStructuredOutput<any[]>(
        prompt, schema, { temperature: 0.4, maxTokens: 2000 }
      );

      return rawQuestions.map((q, index) => this.formatMatchingQuestion(q, index, context));
    } catch (error) {
      console.error('Error generating matching questions:', error);
      return this.generateFallbackMatching(context, count);
    }
  }

  /**
   * Build Multiple Choice Prompt
   */
  private buildMultipleChoicePrompt(
    context: QuestionGenerationContext,
    count: number,
    options: MultipleChoiceOptions
  ): string {
    const isPortuguese = context.language === 'pt-BR';
    
    return isPortuguese ? `
Gere ${count} questões de múltipla escolha sobre "${context.topic}" em psicologia junguiana.

Contexto do conteúdo:
${context.content.substring(0, 1000)}...

Conceitos-chave: ${context.concepts.join(', ')}

Configurações específicas:
- Nível: ${context.difficulty}
- Estratégia de distratores: ${options.distractorStrategy}
- Tamanho das opções: ${options.optionLength}
- Incluir "todas as anteriores": ${options.includeAllOfAbove ? 'sim' : 'não'}
- Profundidade conceitual: ${options.conceptualDepth}

IMPORTANTE: 
1. Cada questão deve ter exatamente 4 opções
2. Distratores devem ser plausíveis e relacionados ao tema
3. Use a estratégia "${options.distractorStrategy}" para criar distratores
4. Para cada distrator, explique por que está errado

Estratégias de distratores:
- misconceptions: Use equívocos comuns sobre o conceito
- related-concepts: Use conceitos relacionados mas distintos
- partial-truths: Use verdades parciais ou incompletas
- mixed: Combine as estratégias acima

Formato de resposta em JSON:
[
  {
    "question": "Texto da questão",
    "options": ["Opção correta", "Distrator 1", "Distrator 2", "Distrator 3"],
    "correctAnswer": 0,
    "explanation": "Explicação detalhada da resposta correta",
    "distractorAnalysis": [
      {"option": "Distrator 1", "why_wrong": "Por que está errado", "strategy": "misconceptions"},
      {"option": "Distrator 2", "why_wrong": "Por que está errado", "strategy": "related-concepts"},
      {"option": "Distrator 3", "why_wrong": "Por que está errado", "strategy": "partial-truths"}
    ]
  }
]
` : `
Generate ${count} multiple choice questions about "${context.topic}" in Jungian psychology.

Content context:
${context.content.substring(0, 1000)}...

Key concepts: ${context.concepts.join(', ')}

Specific settings:
- Level: ${context.difficulty}
- Distractor strategy: ${options.distractorStrategy}
- Option length: ${options.optionLength}
- Include "all of the above": ${options.includeAllOfAbove ? 'yes' : 'no'}
- Conceptual depth: ${options.conceptualDepth}

IMPORTANT:
1. Each question must have exactly 4 options
2. Distractors must be plausible and topic-related
3. Use "${options.distractorStrategy}" strategy for distractors
4. For each distractor, explain why it's wrong

Respond in JSON format as shown above.
`;
  }

  /**
   * Build True/False Prompt
   */
  private buildTrueFalsePrompt(
    context: QuestionGenerationContext,
    count: number,
    options: TrueFalseOptions
  ): string {
    const isPortuguese = context.language === 'pt-BR';
    
    return isPortuguese ? `
Gere ${count} questões verdadeiro/falso sobre "${context.topic}" em psicologia junguiana.

Contexto: ${context.content.substring(0, 800)}...

Configurações:
- Tipo de afirmação: ${options.statementType}
- Incluir nuances: ${options.includeNuances ? 'sim' : 'não'}
- Complexidade das armadilhas: ${options.trapComplexity}

Tipos de afirmação:
- definition: Afirmações sobre definições de conceitos
- application: Afirmações sobre aplicação prática
- relationship: Afirmações sobre relações entre conceitos
- comparison: Afirmações comparativas

DIRETRIZES:
1. Balanceie questões verdadeiras e falsas (aproximadamente 50/50)
2. Afirmações falsas devem ser sutis, não obviamente erradas
3. Use armadilhas conceituais adequadas ao nível de complexidade
4. Explique claramente por que a afirmação é verdadeira ou falsa

Formato JSON:
[
  {
    "statement": "Afirmação para avaliar",
    "isTrue": true/false,
    "explanation": "Explicação detalhada",
    "trapType": "tipo de armadilha usada",
    "nuanceLevel": "nível de nuance"
  }
]
` : `
Generate ${count} true/false questions about "${context.topic}" in Jungian psychology.

Context: ${context.content.substring(0, 800)}...

Settings:
- Statement type: ${options.statementType}
- Include nuances: ${options.includeNuances ? 'yes' : 'no'}
- Trap complexity: ${options.trapComplexity}

Respond in JSON format as shown above.
`;
  }

  /**
   * Build Short Answer Prompt
   */
  private buildShortAnswerPrompt(
    context: QuestionGenerationContext,
    count: number,
    options: ShortAnswerOptions
  ): string {
    const isPortuguese = context.language === 'pt-BR';
    
    return isPortuguese ? `
Gere ${count} questões de resposta curta sobre "${context.topic}".

Contexto: ${context.content.substring(0, 800)}...

Configurações:
- Extensão esperada: ${options.expectedLength}
- Requer exemplos: ${options.requireExamples ? 'sim' : 'não'}
- Número de palavras-chave: ${options.keywordCount}
- Múltiplas respostas corretas: ${options.allowMultipleCorrect ? 'sim' : 'não'}

DIRETRIZES:
1. Questões devem permitir respostas ${options.expectedLength === 'brief' ? 'de 1-2 frases' : options.expectedLength === 'moderate' ? 'de 3-5 frases' : 'de um parágrafo'}
2. Identifique ${options.keywordCount} palavras-chave essenciais para avaliação
3. ${options.requireExamples ? 'Inclua perguntas que exigem exemplos' : 'Foque em conceitos teóricos'}
4. Forneça rubrica de pontuação clara

Formato JSON:
[
  {
    "question": "Pergunta que requer resposta elaborada",
    "expectedAnswer": "Resposta modelo esperada",
    "keyKeywords": ["palavra-chave1", "palavra-chave2", ...],
    "alternativeAnswers": ["variação aceitável 1", "variação aceitável 2"],
    "scoringRubric": {
      "excellent": "Critérios para nota máxima",
      "good": "Critérios para boa nota",
      "fair": "Critérios para nota satisfatória",
      "poor": "Critérios para nota baixa"
    }
  }
]
` : `
Generate ${count} short answer questions about "${context.topic}".

Context: ${context.content.substring(0, 800)}...

Respond in JSON format as shown above.
`;
  }

  /**
   * Build Essay Prompt
   */
  private buildEssayPrompt(
    context: QuestionGenerationContext,
    count: number,
    options: EssayOptions
  ): string {
    const isPortuguese = context.language === 'pt-BR';
    
    return isPortuguese ? `
Gere ${count} questões dissertativas sobre "${context.topic}".

Contexto: ${context.content.substring(0, 600)}...

Configurações:
- Tipo de ensaio: ${options.essayType}
- Faixa de palavras: ${options.wordCountRange.min}-${options.wordCountRange.max}
- Elementos obrigatórios: ${options.requiredElements.join(', ')}
- Detalhe da rubrica: ${options.rubricDetail}

Tipos de ensaio:
- analytical: Análise profunda de conceitos
- comparative: Comparação entre teorias/conceitos
- evaluative: Avaliação crítica de ideias
- synthetic: Síntese e integração de múltiplos conceitos

DIRETRIZES:
1. Prompts devem estimular pensamento crítico de alto nível
2. Inclua orientações claras sobre expectativas
3. Crie rubrica detalhada com critérios específicos
4. Forneça exemplo de resposta de qualidade

Formato JSON:
[
  {
    "prompt": "Prompt dissertativo que estimula pensamento crítico",
    "guidelines": "Orientações específicas para o estudante",
    "rubric": {
      "criteria": [
        {
          "name": "Compreensão conceitual",
          "description": "Demonstra entendimento profundo dos conceitos",
          "points": 25
        }
      ],
      "totalPoints": 100,
      "gradingNotes": "Notas adicionais para avaliação"
    },
    "sampleResponse": "Exemplo de resposta de alta qualidade"
  }
]
` : `
Generate ${count} essay questions about "${context.topic}".

Context: ${context.content.substring(0, 600)}...

Respond in JSON format as shown above.
`;
  }

  /**
   * Build Matching Prompt
   */
  private buildMatchingPrompt(context: QuestionGenerationContext, count: number): string {
    const isPortuguese = context.language === 'pt-BR';
    
    return isPortuguese ? `
Gere ${count} questões de correspondência sobre "${context.topic}".

Contexto: ${context.content.substring(0, 800)}...

DIRETRIZES:
1. Crie 5-7 itens em cada coluna
2. Inclua mais itens na coluna direita (distratores)
3. Relacione conceitos, definições, exemplos ou aplicações
4. Misture a ordem para evitar padrões óbvios

Formato JSON:
[
  {
    "instruction": "Instruções claras para o estudante",
    "leftColumn": [
      {"id": "L1", "text": "Item da coluna esquerda"},
      {"id": "L2", "text": "Outro item"}
    ],
    "rightColumn": [
      {"id": "R1", "text": "Item correspondente"},
      {"id": "R2", "text": "Outro item"},
      {"id": "R3", "text": "Distrator"}
    ],
    "correctMatches": [
      {"left": "L1", "right": "R1"},
      {"left": "L2", "right": "R2"}
    ]
  }
]
` : `
Generate ${count} matching questions about "${context.topic}".

Context: ${context.content.substring(0, 800)}...

Respond in JSON format as shown above.
`;
  }

  /**
   * Format Multiple Choice Question
   */
  private formatMultipleChoiceQuestion(rawQuestion: any, index: number, context: QuestionGenerationContext): Question {
    return {
      id: `mc-${Date.now()}-${index}`,
      type: 'multiple-choice',
      question: rawQuestion.question,
      options: rawQuestion.options.map((option: string, optIndex: number) => ({
        id: `mc-${Date.now()}-${index}-opt-${optIndex}`,
        text: option,
        isCorrect: optIndex === rawQuestion.correctAnswer
      })),
      correctAnswer: rawQuestion.correctAnswer,
      explanation: rawQuestion.explanation,
      points: context.difficulty === 'hard' ? 15 : context.difficulty === 'medium' ? 10 : 5,
      order: index,
      metadata: {
        difficulty: context.difficulty,
        questionType: 'multiple-choice',
        distractorAnalysis: rawQuestion.distractorAnalysis,
        concepts: context.concepts.slice(0, 3)
      }
    };
  }

  /**
   * Format True/False Question
   */
  private formatTrueFalseQuestion(rawQuestion: any, index: number, context: QuestionGenerationContext): Question {
    return {
      id: `tf-${Date.now()}-${index}`,
      type: 'true-false',
      question: rawQuestion.statement,
      options: [
        { id: `tf-${Date.now()}-${index}-true`, text: 'Verdadeiro', isCorrect: rawQuestion.isTrue },
        { id: `tf-${Date.now()}-${index}-false`, text: 'Falso', isCorrect: !rawQuestion.isTrue }
      ],
      correctAnswer: rawQuestion.isTrue ? 0 : 1,
      explanation: rawQuestion.explanation,
      points: context.difficulty === 'hard' ? 10 : context.difficulty === 'medium' ? 8 : 5,
      order: index,
      metadata: {
        difficulty: context.difficulty,
        questionType: 'true-false',
        trapType: rawQuestion.trapType,
        nuanceLevel: rawQuestion.nuanceLevel
      }
    };
  }

  /**
   * Format Short Answer Question
   */
  private formatShortAnswerQuestion(rawQuestion: any, index: number, context: QuestionGenerationContext): Question {
    return {
      id: `sa-${Date.now()}-${index}`,
      type: 'short-answer',
      question: rawQuestion.question,
      options: [], // Short answer questions don't have predefined options
      correctAnswer: -1, // Not applicable
      explanation: rawQuestion.expectedAnswer,
      expectedKeywords: rawQuestion.keyKeywords,
      points: context.difficulty === 'hard' ? 20 : context.difficulty === 'medium' ? 15 : 10,
      order: index,
      metadata: {
        difficulty: context.difficulty,
        questionType: 'short-answer',
        alternativeAnswers: rawQuestion.alternativeAnswers,
        scoringRubric: rawQuestion.scoringRubric
      }
    };
  }

  /**
   * Format Essay Question
   */
  private formatEssayQuestion(rawQuestion: any, index: number, context: QuestionGenerationContext, options: EssayOptions): Question {
    return {
      id: `essay-${Date.now()}-${index}`,
      type: 'essay',
      question: rawQuestion.prompt,
      options: [], // Essay questions don't have predefined options
      correctAnswer: -1, // Not applicable
      explanation: rawQuestion.guidelines,
      rubric: rawQuestion.rubric,
      points: rawQuestion.rubric?.totalPoints || 50,
      order: index,
      metadata: {
        difficulty: context.difficulty,
        questionType: 'essay',
        essayType: options.essayType,
        wordCountRange: options.wordCountRange,
        sampleResponse: rawQuestion.sampleResponse
      }
    };
  }

  /**
   * Format Matching Question
   */
  private formatMatchingQuestion(rawQuestion: any, index: number, context: QuestionGenerationContext): Question {
    return {
      id: `match-${Date.now()}-${index}`,
      type: 'matching',
      question: rawQuestion.instruction,
      options: [], // Matching questions use different structure
      correctAnswer: -1, // Not applicable
      explanation: 'Verifique as correspondências corretas na rubrica.',
      points: context.difficulty === 'hard' ? 25 : context.difficulty === 'medium' ? 20 : 15,
      order: index,
      metadata: {
        difficulty: context.difficulty,
        questionType: 'matching',
        leftColumn: rawQuestion.leftColumn,
        rightColumn: rawQuestion.rightColumn,
        correctMatches: rawQuestion.correctMatches
      }
    };
  }

  /**
   * Fallback generators for error cases
   */
  private generateFallbackMultipleChoice(context: QuestionGenerationContext, count: number): Question[] {
    const questions: Question[] = [];
    for (let i = 0; i < count; i++) {
      questions.push({
        id: `fallback-mc-${i}`,
        type: 'multiple-choice',
        question: `Qual é um aspecto importante de ${context.topic}?`,
        options: [
          { id: 'opt-1', text: 'É um conceito fundamental', isCorrect: true },
          { id: 'opt-2', text: 'Não tem importância', isCorrect: false },
          { id: 'opt-3', text: 'É apenas teórico', isCorrect: false },
          { id: 'opt-4', text: 'Foi refutado', isCorrect: false }
        ],
        correctAnswer: 0,
        explanation: 'Resposta padrão devido a erro de geração.',
        points: 10,
        order: i,
        metadata: { difficulty: context.difficulty, fallback: true }
      });
    }
    return questions;
  }

  private generateFallbackTrueFalse(context: QuestionGenerationContext, count: number): Question[] {
    const questions: Question[] = [];
    for (let i = 0; i < count; i++) {
      questions.push({
        id: `fallback-tf-${i}`,
        type: 'true-false',
        question: `${context.topic} é um conceito importante na psicologia junguiana.`,
        options: [
          { id: 'true', text: 'Verdadeiro', isCorrect: true },
          { id: 'false', text: 'Falso', isCorrect: false }
        ],
        correctAnswer: 0,
        explanation: 'Resposta padrão devido a erro de geração.',
        points: 5,
        order: i,
        metadata: { difficulty: context.difficulty, fallback: true }
      });
    }
    return questions;
  }

  private generateFallbackShortAnswer(context: QuestionGenerationContext, count: number): Question[] {
    const questions: Question[] = [];
    for (let i = 0; i < count; i++) {
      questions.push({
        id: `fallback-sa-${i}`,
        type: 'short-answer',
        question: `Explique brevemente o conceito de ${context.topic}.`,
        options: [],
        correctAnswer: -1,
        explanation: 'Resposta esperada: definição básica do conceito.',
        expectedKeywords: [context.topic.toLowerCase(), 'jung', 'psicologia'],
        points: 15,
        order: i,
        metadata: { difficulty: context.difficulty, fallback: true }
      });
    }
    return questions;
  }

  private generateFallbackEssay(context: QuestionGenerationContext, count: number, options: EssayOptions): Question[] {
    const questions: Question[] = [];
    for (let i = 0; i < count; i++) {
      questions.push({
        id: `fallback-essay-${i}`,
        type: 'essay',
        question: `Discuta a importância de ${context.topic} na psicologia junguiana.`,
        options: [],
        correctAnswer: -1,
        explanation: 'Resposta deve incluir definições, exemplos e análise crítica.',
        rubric: {
          criteria: [
            { name: 'Compreensão', description: 'Entendimento do conceito', points: 20 },
            { name: 'Análise', description: 'Análise crítica', points: 20 },
            { name: 'Exemplos', description: 'Uso de exemplos', points: 10 }
          ],
          totalPoints: 50
        },
        points: 50,
        order: i,
        metadata: { difficulty: context.difficulty, fallback: true }
      });
    }
    return questions;
  }

  private generateFallbackMatching(context: QuestionGenerationContext, count: number): Question[] {
    const questions: Question[] = [];
    for (let i = 0; i < count; i++) {
      questions.push({
        id: `fallback-match-${i}`,
        type: 'matching',
        question: `Relacione os conceitos com suas definições.`,
        options: [],
        correctAnswer: -1,
        explanation: 'Questão de correspondência básica.',
        points: 20,
        order: i,
        metadata: {
          difficulty: context.difficulty,
          fallback: true,
          leftColumn: [
            { id: 'L1', text: context.topic },
            { id: 'L2', text: 'Conceito relacionado' }
          ],
          rightColumn: [
            { id: 'R1', text: 'Definição principal' },
            { id: 'R2', text: 'Definição relacionada' }
          ],
          correctMatches: [
            { left: 'L1', right: 'R1' },
            { left: 'L2', right: 'R2' }
          ]
        }
      });
    }
    return questions;
  }
}