import { ILLMProvider } from '../types';
import { Quiz, Question } from '../../../types';
import { quizEnhancer } from '../../../services/quiz/quizEnhancer';
import { quizValidator } from '../../../services/quiz/quizValidator';
import { randomizeAllQuestionOptions, ensureVariedCorrectAnswerPositions } from '../../../utils/quizUtils';

export class QuizGenerator {
  constructor(protected provider: ILLMProvider) {}

  async generateQuiz(
    moduleId: string,
    topic: string,
    content: string,
    objectives: string[],
    questionCount: number = 10,
    language: string = 'pt-BR'
  ): Promise<Quiz> {
    const questions = await this.generateQuestions(topic, content, objectives, questionCount, language);
    
    return {
      id: `quiz-${moduleId}`,
      moduleId,
      title: language === 'pt-BR' ? `${topic} - Questionário de Avaliação` : `${topic} - Assessment Quiz`,
      description: language === 'pt-BR' ? `Teste seu entendimento dos conceitos de ${topic} na psicologia junguiana` : `Test your understanding of ${topic} concepts in Jungian psychology`,
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
    count: number,
    language: string = 'pt-BR'
  ): Promise<Question[]> {
    const prompt = language === 'pt-BR' ? `Gere exatamente ${count} questões de múltipla escolha para um quiz de psicologia junguiana sobre "${topic}".

Objetivos de aprendizagem a avaliar:
${objectives && objectives.length > 0 ? objectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n') : 'Compreensão geral do tópico'}

Resumo do conteúdo contextual:
${content.substring(0, 1000)}...

CRÍTICO: Você deve responder com um array JSON contendo exatamente ${count} objetos de questão.

Requisitos para cada questão:
1. Teste a compreensão, não apenas memorização
2. Inclua exatamente 4 opções de resposta que sejam TODAS plausíveis e relacionadas ao tópico
3. Apenas uma resposta correta (índice 0-3)
4. Forneça explicações claras para a resposta correta
5. Varie os níveis de dificuldade (fácil, médio, difícil)
6. Cubra diferentes níveis cognitivos (recordação, compreensão, aplicação, análise)

DIRETRIZES PARA DISTRATORES (MUITO IMPORTANTE):
- TODOS os distratores devem ser plausíveis e relacionados à psicologia junguiana
- NUNCA repita opções - cada uma deve ser ÚNICA e ESPECÍFICA
- Todas as opções devem ter comprimento similar (30-80 caracteres)
- Use estes tipos de distratores ESPECÍFICOS:
  a) Conceitos junguianos relacionados mas distintos (ex: anima vs animus, persona vs sombra)
  b) Aplicação incorreta de teorias freudianas no contexto junguiano
  c) Características de outros arquétipos junguianos
  d) Interpretações parciais ou incompletas do conceito principal
  e) Confusões com conceitos de psicologia cognitiva ou comportamental
- EVITE termos genéricos como: "fenômeno social", "princípio humanista", "teoria psicológica"
- Use sempre CONCEITOS ESPECÍFICOS da psicologia junguiana
- Cada distrator deve ter aproximadamente o mesmo tamanho da resposta correta
- Evite padrões como "todas as anteriores" ou "nenhuma das anteriores"

VERIFICAÇÃO OBRIGATÓRIA ANTES DE RESPONDER:
1. Todas as 4 opções são DIFERENTES entre si?
2. Todas mencionam conceitos ESPECÍFICOS da psicologia?
3. Todas têm tamanho similar (30-80 caracteres)?
4. Não há termos genéricos demais?

Exemplo de questão BOA (note as opções específicas e únicas):
{
  "question": "De acordo com Jung, o que caracteriza fundamentalmente o arquétipo da Sombra?",
  "options": [
    "Representa os aspectos reprimidos e negados da personalidade consciente",
    "Manifesta-se como a imagem idealizada do parceiro romântico perfeito",
    "Constitui a máscara social usada para interagir com o mundo externo",
    "Expressa os impulsos criativos do inconsciente coletivo durante sonhos"
  ],
  "correctAnswer": 0,
  "explanation": "A Sombra representa os aspectos da personalidade que foram reprimidos ou negados pela consciência, diferindo da anima/animus (imagem do parceiro), persona (máscara social) ou função transcendente (impulsos criativos).",
  "difficulty": "medium",
  "cognitiveLevel": "understanding"
}

EXEMPLO de questão RUIM (NÃO FAÇA ASSIM):
{
  "question": "O que é importante na psicologia?",
  "options": [
    "Um conceito fundamental",
    "Um princípio humanista",
    "Um fenômeno social",
    "Uma teoria psicológica"
  ]
  // ❌ PROBLEMAS: Opções muito genéricas, sem especificidade junguiana
}

IMPORTANTE: Escreva TODAS as questões, opções e explicações em português brasileiro (pt-BR).

Responda com exatamente ${count} questões seguindo o formato do bom exemplo:` : `Generate exactly ${count} multiple-choice questions for a Jungian psychology quiz on "${topic}".

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
- NEVER repeat options - each must be UNIQUE and SPECIFIC
- All options should have similar length (30-80 characters)
- Use these SPECIFIC types of distractors:
  a) Related but distinct Jungian concepts (e.g., anima vs animus, persona vs shadow)
  b) Incorrect application of Freudian theories in Jungian context
  c) Characteristics of other Jungian archetypes
  d) Partial or incomplete interpretations of the main concept
  e) Confusion with cognitive or behavioral psychology concepts
- AVOID generic terms like: "social phenomenon", "humanistic principle", "psychological theory"
- Always use SPECIFIC concepts from Jungian psychology
- Each distractor should be approximately the same length as the correct answer
- Avoid patterns like "all of the above" or "none of the above"

MANDATORY VERIFICATION BEFORE RESPONDING:
1. Are all 4 options DIFFERENT from each other?
2. Do all mention SPECIFIC psychological concepts?
3. Are all similar in length (30-80 characters)?
4. Are there no overly generic terms?

Example of GOOD question (note specific and unique options):
{
  "question": "According to Jung, what fundamentally characterizes the Shadow archetype?",
  "options": [
    "Represents repressed and denied aspects of the conscious personality",
    "Manifests as the idealized image of the perfect romantic partner",
    "Constitutes the social mask used to interact with the external world",
    "Expresses creative impulses from the collective unconscious during dreams"
  ],
  "correctAnswer": 0,
  "explanation": "The Shadow represents aspects of personality that have been repressed or denied by consciousness, differing from anima/animus (partner image), persona (social mask), or transcendent function (creative impulses).",
  "difficulty": "medium",
  "cognitiveLevel": "understanding"
}

Example of BAD question (DON'T DO THIS):
{
  "question": "What is important in psychology?",
  "options": [
    "A fundamental concept",
    "A humanistic principle", 
    "A social phenomenon",
    "A psychological theory"
  ]
  // ❌ PROBLEMS: Too generic options, no Jungian specificity
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

    const rawQuestions = await this.provider.generateStructuredOutput<Array<{
      question: string;
      options: string[];
      correctAnswer: number;
      explanation: string;
      difficulty: string;
      cognitiveLevel: string;
    }>>(prompt, schema, { temperature: 0.3, maxTokens: 3000 });

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
            question: `Qual é um conceito-chave em ${topic}?`,
            options: ['Opção A', 'Opção B', 'Opção C', 'Opção D'],
            correctAnswer: 1,
            explanation: 'Este é um conceito fundamental no tópico.',
            difficulty: 'medium',
            cognitiveLevel: 'understanding'
          },
          {
            question: `Como ${topic} se relaciona com a psicologia junguiana?`,
            options: ['Opção A', 'Opção B', 'Opção C', 'Opção D'],
            correctAnswer: 0,
            explanation: 'Isso demonstra a conexão com a teoria junguiana.',
            difficulty: 'medium',
            cognitiveLevel: 'application'
          }
        ];
      }
    }

    // Pre-validate and clean questions before conversion
    const cleanedQuestions = this.preValidateQuestions(questions);
    
    // Convert to Question format
    const quizQuestions: Question[] = cleanedQuestions.map((q, index) => ({
      id: `q-${index + 1}`,
      type: 'multiple-choice' as const,
      question: q.question,
      options: q.options.map((option: string, optIndex: number) => ({
        id: `q-${index + 1}-opt-${optIndex + 1}`,
        text: option,
        isCorrect: optIndex === q.correctAnswer
      })),
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

    // Randomize option positions to avoid pattern where correct answer is always first
    const randomizedQuestions = ensureVariedCorrectAnswerPositions(enhancedQuestions);

    // Validate randomized questions
    const testQuiz: Quiz = {
      id: 'temp-validation',
      moduleId: '',
      title: '',
      description: '',
      questions: randomizedQuestions,
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
      
      // Try to fix validation issues
      const fixedQuestions = await this.fixValidationIssues(randomizedQuestions, validationResult, topic, content, objectives, language);
      return fixedQuestions;
    }

    return randomizedQuestions;
  }

  /**
   * Pre-validate questions and fix obvious issues before full validation
   */
  private preValidateQuestions(questions: any[]): any[] {
    return questions.map((q, index) => {
      // Check for duplicate options
      if (q.options && Array.isArray(q.options)) {
        const uniqueOptions = new Set(q.options);
        if (uniqueOptions.size !== q.options.length) {
          console.warn(`Question ${index + 1} has duplicate options, generating fallback`);
          return this.createPreValidationFallback(q, index);
        }
        
        // Check for generic options
        const genericTerms = ['fenômeno social', 'princípio humanista', 'teoria psicológica', 'conceito fundamental', 
                             'social phenomenon', 'humanistic principle', 'psychological theory', 'fundamental concept'];
        const hasGenericTerms = q.options.some((opt: string) => 
          genericTerms.some(term => opt.toLowerCase().includes(term.toLowerCase()))
        );
        
        if (hasGenericTerms) {
          console.warn(`Question ${index + 1} has generic terms, generating fallback`);
          return this.createPreValidationFallback(q, index);
        }
      }
      
      return q;
    });
  }

  /**
   * Create a pre-validation fallback question
   */
  private createPreValidationFallback(originalQuestion: any, index: number): any {
    const topics = ['arquétipos', 'inconsciente coletivo', 'individuação', 'sombra', 'anima', 'animus', 'persona'];
    const randomTopic = topics[index % topics.length];
    
    return {
      question: `Qual é uma característica específica de ${randomTopic} na psicologia junguiana?`,
      options: [
        `Representa um padrão universal presente no inconsciente coletivo`,
        `Manifesta-se exclusivamente através de sonhos recorrentes específicos`,
        `Desenvolve-se apenas durante a fase de maturidade psicológica`,
        `Origina-se da repressão de impulsos sexuais na primeira infância`
      ],
      correctAnswer: 0,
      explanation: `${randomTopic} é um conceito fundamental na psicologia junguiana que representa padrões universais do inconsciente coletivo.`,
      difficulty: originalQuestion.difficulty || 'medium',
      cognitiveLevel: originalQuestion.cognitiveLevel || 'understanding'
    };
  }

  /**
   * Fix validation issues in generated questions
   */
  private async fixValidationIssues(
    questions: Question[],
    validationResult: any,
    topic: string,
    content: string,
    objectives: string[],
    language: string
  ): Promise<Question[]> {
    const fixedQuestions = [...questions];
    
    // Identify questions with issues
    const issuePattern = /Q(\d+):/;
    const questionIssues: { [key: number]: string[] } = {};
    
    validationResult.warnings.forEach((warning: string) => {
      const match = warning.match(issuePattern);
      if (match) {
        const questionIndex = parseInt(match[1]) - 1;
        if (!questionIssues[questionIndex]) {
          questionIssues[questionIndex] = [];
        }
        questionIssues[questionIndex].push(warning);
      }
    });

    // Fix questions with issues
    for (const [questionIndexStr, issues] of Object.entries(questionIssues)) {
      const questionIndex = parseInt(questionIndexStr);
      if (questionIndex >= 0 && questionIndex < fixedQuestions.length) {
        const hasduplicateOptions = issues.some(issue => issue.includes('Duplicate option'));
        const hasInconsistentLengths = issues.some(issue => issue.includes('inconsistent lengths'));
        const hasPoorDistractors = issues.some(issue => issue.includes('Not enough plausible distractors'));
        
        if (hasduplicateOptions || hasInconsistentLengths || hasPoorDistractors) {
          console.log(`🔧 Fixing question ${questionIndex + 1} with issues:`, issues);
          
          try {
            const fixedQuestion = await this.regenerateQuestion(
              fixedQuestions[questionIndex],
              topic,
              content,
              objectives,
              language,
              issues
            );
            
            if (fixedQuestion) {
              fixedQuestions[questionIndex] = fixedQuestion;
              console.log(`✅ Successfully fixed question ${questionIndex + 1}`);
            }
          } catch (error) {
            console.error(`❌ Failed to fix question ${questionIndex + 1}:`, error);
            // Keep the original question if fixing fails
          }
        }
      }
    }

    return fixedQuestions;
  }

  /**
   * Regenerate a single question with better quality
   */
  private async regenerateQuestion(
    originalQuestion: Question,
    topic: string,
    content: string,
    objectives: string[],
    language: string,
    issues: string[]
  ): Promise<Question | null> {
    const isPortuguese = language === 'pt-BR';
    
    const issueDescription = issues.join(', ');
    
    const prompt = `
Regenere esta questão de múltipla escolha sobre "${topic}" corrigindo os seguintes problemas:
${issueDescription}

Questão original: ${originalQuestion.question}
Opções originais: ${originalQuestion.options.map((opt: any) => typeof opt === 'string' ? opt : opt.text).join(' | ')}

REGRAS CRÍTICAS PARA EVITAR PROBLEMAS:
1. NUNCA repita opções - cada uma deve ser ÚNICA
2. Todas as opções devem ter comprimento similar (30-80 caracteres)
3. TODAS as opções devem ser relacionadas à psicologia junguiana
4. Use conceitos junguianos ESPECÍFICOS para cada distrator
5. Evite termos genéricos como "fenômeno social" ou "princípio humanista"

ESTRATÉGIA DE DISTRATORES MELHORADA:
- Opção correta: Resposta verdadeira sobre ${topic}
- Distrator 1: Conceito junguiano relacionado mas diferente (ex: arquétipo diferente)
- Distrator 2: Conceito de outra teoria psicológica aplicada incorretamente
- Distrator 3: Equívoco comum sobre ${topic} na psicologia junguiana

Contexto: ${content.substring(0, 500)}...

IMPORTANTE: Responda apenas com um objeto JSON:
{
  "question": "Nova pergunta melhorada",
  "options": ["Resposta correta específica", "Distrator 1 específico", "Distrator 2 específico", "Distrator 3 específico"],
  "correctAnswer": 0,
  "explanation": "Explicação detalhada da resposta correta",
  "difficulty": "medium",
  "cognitiveLevel": "understanding"
}
`;

    try {
      const response = await this.provider.generateStructuredOutput<{
        question: string;
        options: string[];
        correctAnswer: number;
        explanation: string;
        difficulty: string;
        cognitiveLevel: string;
      }>(prompt, {
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
          difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
          cognitiveLevel: { type: "string", enum: ["recall", "understanding", "application", "analysis"] }
        },
        required: ["question", "options", "correctAnswer", "explanation"]
      }, { temperature: 0.2, maxTokens: 1000 });

      // Validate the regenerated question doesn't have duplicates
      const optionTexts = response.options;
      const uniqueOptions = new Set(optionTexts);
      
      if (uniqueOptions.size !== optionTexts.length) {
        console.warn('Regenerated question still has duplicate options, using fallback');
        return this.createFallbackQuestion(originalQuestion, topic);
      }

      // Convert to Question format
      return {
        ...originalQuestion,
        question: response.question,
        options: response.options.map((option: string, optIndex: number) => ({
          id: `${originalQuestion.id}-fixed-opt-${optIndex + 1}`,
          text: option,
          isCorrect: optIndex === response.correctAnswer
        })),
        correctAnswer: response.correctAnswer,
        explanation: response.explanation,
        metadata: {
          ...originalQuestion.metadata,
          difficulty: response.difficulty,
          cognitiveLevel: response.cognitiveLevel,
          regenerated: true
        }
      };
      
    } catch (error) {
      console.error('Error regenerating question:', error);
      return this.createFallbackQuestion(originalQuestion, topic);
    }
  }

  /**
   * Create a fallback question when regeneration fails
   */
  private createFallbackQuestion(originalQuestion: Question, topic: string): Question {
    return {
      ...originalQuestion,
      question: `Qual é uma característica fundamental de ${topic} na psicologia junguiana?`,
      options: [
        { id: `${originalQuestion.id}-fallback-1`, text: `É um conceito central na teoria analítica de Jung`, isCorrect: true },
        { id: `${originalQuestion.id}-fallback-2`, text: `Representa apenas aspectos inconscientes da personalidade`, isCorrect: false },
        { id: `${originalQuestion.id}-fallback-3`, text: `Funciona exclusivamente no nível individual da psique`, isCorrect: false },
        { id: `${originalQuestion.id}-fallback-4`, text: `Manifesta-se apenas durante processos terapêuticos específicos`, isCorrect: false }
      ],
      correctAnswer: 0,
      explanation: `${topic} é um conceito fundamental na psicologia analítica de Jung, com aplicações amplas na compreensão da psique humana.`,
      metadata: {
        ...originalQuestion.metadata,
        fallback: true,
        regenerated: true
      }
    };
  }

  async generateAdaptiveQuestions(
    topic: string,
    previousResponses: Array<{ correct: boolean; difficulty: string }>,
    count: number = 3,
    language: string = 'pt-BR'
  ): Promise<Question[]> {
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

    const difficultyTerms: Record<string, string> = {
      'hard': language === 'pt-BR' ? 'difícil' : 'hard',
      'easy': language === 'pt-BR' ? 'fácil' : 'easy',
      'medium': language === 'pt-BR' ? 'médio' : 'medium'
    };

    const prompt = `
Gere ${count} questões de múltipla escolha de nível ${difficultyTerms[targetDifficulty]} para teste adaptativo sobre "${topic}" em psicologia junguiana.

Desempenho anterior: ${Math.round(correctRate * 100)}% correto

Foque em:
${targetDifficulty === 'hard' ? 'análise complexa e síntese de conceitos' : 
  targetDifficulty === 'easy' ? 'conceitos fundamentais e definições' : 
  'aplicação e compreensão de conceitos'}

IMPORTANTE: Escreva todas as questões em português brasileiro (pt-BR).
Formato de resposta: mesmo que antes
`;

    const questions = await this.provider.generateStructuredOutput<Array<{
      question: string;
      options: string[];
      correctAnswer: number;
      explanation: string;
    }>>(prompt, [], { temperature: 0.5 });

    return questions.map((q, index) => ({
      id: `adaptive-q-${Date.now()}-${index}`,
      type: 'multiple-choice' as const,
      question: q.question,
      options: q.options.map((option: string, optIndex: number) => ({
        id: `adaptive-q-${Date.now()}-${index}-opt-${optIndex + 1}`,
        text: option,
        isCorrect: optIndex === q.correctAnswer
      })),
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      points: targetDifficulty === 'hard' ? 15 : targetDifficulty === 'medium' ? 10 : 5,
      order: index,
    }));
  }

  async generatePracticeQuestions(
    topic: string,
    specificConcept: string,
    count: number = 5,
    language: string = 'pt-BR'
  ): Promise<Question[]> {
    const prompt = `
Gere ${count} questões práticas focadas em "${specificConcept}" dentro do tópico "${topic}" em psicologia junguiana.

Requisitos:
- Comece com questões mais fáceis e progrida para as mais difíceis
- Inclua explicações detalhadas que ensinem o conceito
- Use exemplos do mundo real quando aplicável
- Referencie o trabalho original de Jung quando relevante
- IMPORTANTE: Escreva todas as questões em português brasileiro (pt-BR)

Formato de resposta: mesmo que questões padrão
`;

    const questions = await this.provider.generateStructuredOutput<Array<{
      question: string;
      options: string[];
      correctAnswer: number;
      explanation: string;
    }>>(prompt, [], { temperature: 0.6 });

    return questions.map((q, index) => ({
      id: `practice-q-${Date.now()}-${index}`,
      type: 'multiple-choice' as const,
      question: q.question,
      options: q.options.map((option: string, optIndex: number) => ({
        id: `practice-q-${Date.now()}-${index}-opt-${optIndex + 1}`,
        text: option,
        isCorrect: optIndex === q.correctAnswer
      })),
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      points: 5,
      order: index,
    }));
  }
}