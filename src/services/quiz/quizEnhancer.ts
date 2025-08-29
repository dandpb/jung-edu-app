/**
 * Quiz Enhancer for Jung Educational App
 * Improves generated questions with better distractors, explanations, and educational value
 */

import { Question } from '../../types';
import { quizPromptService } from './quizPromptService';

export interface EnhancementOptions {
  addExplanations: boolean;
  improveDistractors: boolean;
  varyQuestionStems: boolean;
  addReferences: boolean;
  contextualizeQuestions: boolean;
}

export class QuizEnhancer {
  private usedDistractors: Set<string> = new Set();
  
  /**
   * Enhance a set of quiz questions with better educational features
   */
  async enhanceQuestions(
    questions: Question[],
    topic: string,
    options: EnhancementOptions = {
      addExplanations: true,
      improveDistractors: true,
      varyQuestionStems: true,
      addReferences: true,
      contextualizeQuestions: true
    }
  ): Promise<Question[]> {
    // Handle null, undefined, or invalid input
    if (!questions || !Array.isArray(questions)) {
      return [];
    }

    // Reset used distractors for each batch of questions
    this.usedDistractors.clear();

    // Filter out null/undefined questions and process valid ones
    const validQuestions = questions.filter(q => q && typeof q === 'object');
    
    return Promise.all(
      validQuestions.map(q => this.enhanceQuestion(q, topic, options))
    );
  }

  /**
   * Enhance a single question
   */
  private async enhanceQuestion(
    question: Question,
    topic: string,
    options: EnhancementOptions
  ): Promise<Question> {
    // Ensure we have valid inputs
    if (!question || typeof question !== 'object') {
      throw new Error('Invalid question object provided');
    }

    if (!topic || typeof topic !== 'string') {
      topic = 'General Psychology';
    }

    if (!options || typeof options !== 'object') {
      options = {
        addExplanations: true,
        improveDistractors: true,
        varyQuestionStems: true,
        addReferences: true,
        contextualizeQuestions: true
      };
    }

    let enhanced = { ...question };

    if (options.varyQuestionStems) {
      enhanced = this.varyQuestionStem(enhanced);
    }

    if (options.improveDistractors && enhanced.type === 'multiple-choice') {
      enhanced = this.improveDistractors(enhanced, topic);
    }

    if (options.addExplanations) {
      enhanced = this.enhanceExplanation(enhanced, topic);
    }

    if (options.addReferences) {
      enhanced = this.addReferences(enhanced);
    }

    if (options.contextualizeQuestions) {
      enhanced = this.contextualizeQuestion(enhanced, topic);
    }

    return enhanced;
  }

  /**
   * Vary question stems for better engagement
   */
  private varyQuestionStem(question: Question): Question {
    const questionType = this.identifyQuestionType(question.question);
    
    // Question stem variations in Portuguese
    const questionStemVariations = {
      identification: [
        'Qual das seguintes opções melhor descreve...',
        'O que caracteriza o conceito de Jung sobre...',
        'Como Jung definiria...',
        'Na psicologia junguiana, o que é...'
      ],
      application: [
        'Neste cenário, qual conceito é ilustrado...',
        'Como um analista junguiano interpretaria...',
        'Qual princípio junguiano explica...',
        'Que processo é demonstrado quando...'
      ],
      analysis: [
        'Qual é a diferença principal entre...',
        'Como a visão de Jung sobre X difere de...',
        'Por que X é importante para entender...',
        'Que relação existe entre...'
      ],
      synthesis: [
        'Como X e Y funcionam juntos em...',
        'O que acontece quando X encontra Y no contexto de...',
        'Explique a integração de...',
        'Descreva como múltiplos conceitos combinam em...'
      ]
    };
    
    const stems = questionStemVariations[questionType as keyof typeof questionStemVariations];
    
    if (!stems || stems.length === 0) return question;

    // Check if question already uses a standard stem
    const currentStem = stems.find(stem => 
      question.question.toLowerCase().startsWith(stem.toLowerCase())
    );

    if (currentStem) {
      // Replace with a different stem
      const otherStems = stems.filter(s => s !== currentStem);
      const newStem = otherStems[Math.floor(Math.random() * otherStems.length)];
      
      return {
        ...question,
        question: question.question.replace(currentStem, newStem)
      };
    }

    return question;
  }

  /**
   * Embaralha as opções usando algoritmo Fisher-Yates
   */
  private shuffleOptions(options: any[]): any[] {
    const shuffled = [...options];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Improve distractors for multiple choice questions
   */
  private improveDistractors(question: Question, topic: string): Question {
    if (!question.options || question.correctAnswer === undefined) return question;

    const misconceptions = quizPromptService.getTopicMisconceptions(topic);
    const concepts = quizPromptService.getTopicConcepts(topic);
    
    // Handle different types of correctAnswer
    const correctAnswerIndex = typeof question.correctAnswer === 'number' ? 
      question.correctAnswer : 
      (Array.isArray(question.correctAnswer) ? question.correctAnswer[0] : 0);
    
    const correctOption = question.options[correctAnswerIndex];
    
    // Generate better distractors
    const improvedOptions = question.options.map((option, index) => {
      if (index === correctAnswerIndex) {
        // Keep correct answer but ensure it's an Option object
        return typeof option === 'string' ? 
          { id: `option-${index}`, text: option, isCorrect: true } : 
          option;
      }
      
      // Categorize and improve distractor
      const optionText = typeof option === 'string' ? option : option.text || option.toString();
      const correctText = typeof correctOption === 'string' ? correctOption : correctOption.text || correctOption.toString();
      const distractorType = this.categorizeDistractor(optionText, correctText, misconceptions);
      const improvedText = this.generateBetterDistractor(optionText, distractorType, correctText, concepts, misconceptions);
      
      // Always return an Option object
      return typeof option === 'string' ? 
        { id: `option-${index}`, text: improvedText, isCorrect: false } : 
        { ...option, text: improvedText };
    });

    // Embaralhar as opções para variar a posição da resposta correta
    const shuffledOptions = this.shuffleOptions(improvedOptions);
    const newCorrectAnswerIndex = shuffledOptions.findIndex((opt: any) => 
      (typeof opt === 'string' ? false : opt.isCorrect) || 
      shuffledOptions.indexOf(improvedOptions[correctAnswerIndex]) === shuffledOptions.indexOf(opt)
    );

    return {
      ...question,
      options: shuffledOptions,
      correctAnswer: newCorrectAnswerIndex
    };
  }

  /**
   * Enhance explanations with more educational content
   */
  private enhanceExplanation(question: Question, topic: string): Question {
    // Se não há explicação, criar uma básica
    if (!question.explanation || question.explanation.trim() === '') {
      const basicExplanation = this.createBasicExplanation(question, topic);
      question = { ...question, explanation: basicExplanation };
    }

    const enhanced = {
      ...question,
      explanation: this.buildEnhancedExplanation(question, topic)
    };

    // Add metadata for learning tracking
    return {
      ...enhanced,
      metadata: {
        ...enhanced.metadata,
        concepts: this.extractConcepts(question.question + ' ' + question.explanation),
        cognitiveLevel: this.determineCognitiveLevel(question),
        educationalValue: this.assessEducationalValue(enhanced)
      }
    };
  }

  /**
   * Add references to Jung's work
   */
  private addReferences(question: Question): Question {
    const references = this.findRelevantReferences(question.question);
    
    if (references.length === 0) return question;

    return {
      ...question,
      explanation: question.explanation + '\n\nReferences: ' + references.join('; '),
      metadata: {
        ...question.metadata,
        references
      }
    };
  }

  /**
   * Contextualize questions with real-world examples
   */
  private contextualizeQuestion(question: Question, topic: string): Question {
    const context = this.generateContext(question.question, topic);
    
    if (!context) return question;

    return {
      ...question,
      question: `${context}\n\n${question.question}`,
      metadata: {
        ...question.metadata,
        hasContext: true,
        contextType: this.identifyContextType(context)
      }
    };
  }

  /**
   * Helper methods
   */
  private identifyQuestionType(question: string): string {
    const lowerQ = question.toLowerCase();
    
    // Check for Portuguese keywords
    if (lowerQ.includes('qual') || lowerQ.includes('o que é') || lowerQ.includes('quais')) return 'identification';
    if (lowerQ.includes('como') || lowerQ.includes('explique')) return 'application';
    if (lowerQ.includes('diferença') || lowerQ.includes('compare')) return 'analysis';
    if (lowerQ.includes('integre') || lowerQ.includes('combine')) return 'synthesis';
    
    // Fallback to English keywords
    if (lowerQ.includes('which') || lowerQ.includes('what is')) return 'identification';
    if (lowerQ.includes('how') || lowerQ.includes('explain')) return 'application';
    if (lowerQ.includes('difference') || lowerQ.includes('compare')) return 'analysis';
    if (lowerQ.includes('integrate') || lowerQ.includes('combine')) return 'synthesis';
    
    return 'identification';
  }

  private categorizeDistractor(distractor: string, correct: string, misconceptions: string[]): string {
    const lowerDistractor = distractor.toLowerCase();
    
    // Check if it's a common misconception
    if (misconceptions.some(m => lowerDistractor.includes(m.toLowerCase()))) {
      return 'misconception';
    }
    
    // Check if it's partially correct
    const correctTerms = correct.toLowerCase().split(/\s+/);
    const matchCount = correctTerms.filter(term => 
      lowerDistractor.includes(term) && term.length > 3
    ).length;
    
    if (matchCount > correctTerms.length * 0.3) return 'partial';
    
    // Check if it's from a different theory
    if (lowerDistractor.includes('freud') || lowerDistractor.includes('adler')) {
      return 'different-theory';
    }
    
    return 'unrelated';
  }

  private generateBetterDistractor(
    original: string,
    type: string,
    correct: string,
    concepts: string[],
    misconceptions: string[]
  ): string {
    switch (type) {
      case 'misconception':
        // Already good, maybe enhance clarity
        return original;
        
      case 'partial':
        // Make it more clearly incomplete
        return this.makePartialMoreObvious(original, correct);
        
      case 'different-theory':
        // Good for showing differentiation
        return original;
        
      case 'unrelated':
        // Replace with a better distractor
        return this.createPlausibleDistractor(correct, concepts, misconceptions);
        
      default:
        return original;
    }
  }

  private makePartialMoreObvious(partial: string, correct: string): string {
    // partial is already a string, no need to check
    const partialText = partial;
    // Add qualifiers that make it incomplete
    const qualifiers = ['only', 'simply', 'merely', 'just'];
    const qualifier = qualifiers[Math.floor(Math.random() * qualifiers.length)];
    
    if (!partialText.includes(qualifier)) {
      return partialText.replace(/is|are|was|were/, `$& ${qualifier}`);
    }
    
    return partialText;
  }

  private createPlausibleDistractor(correct: string, concepts: string[], misconceptions: string[]): string {
    // Helper function to check if distractor was already used
    const tryDistractor = (distractor: string): string | null => {
      // Normalizar para comparação (remover espaços extras, lowercase)
      const normalized = distractor.toLowerCase().trim().replace(/\s+/g, ' ');
      if (!this.usedDistractors.has(normalized)) {
        this.usedDistractors.add(normalized);
        return distractor;
      }
      return null;
    };

    // Use a misconception if available
    if (misconceptions.length > 0) {
      // Shuffle misconceptions to vary the selection
      const shuffledMisconceptions = [...misconceptions].sort(() => Math.random() - 0.5);
      
      // Criar tipos MUITO mais variados de distratores
      const templates = [
        (m: string) => `${m}`,
        (m: string) => `O conceito de que ${m}`,
        (m: string) => `A perspectiva onde ${m}`,
        (m: string) => `A teoria de que ${m}`,
        (m: string) => `A hipótese que ${m}`,
        (m: string) => `A proposição de que ${m}`,
        (m: string) => `O princípio onde ${m}`,
        (m: string) => `A concepção de que ${m}`,
        (m: string) => `O entendimento que ${m}`,
        (m: string) => `A premissa de que ${m}`,
        (m: string) => `A abordagem onde ${m}`,
        (m: string) => `A interpretação que sugere ${m}`,
        (m: string) => `A análise indicando que ${m}`,
        (m: string) => `A compreensão de que ${m}`,
        (m: string) => `O ponto de vista que ${m}`,
        (m: string) => `A explicação onde ${m}`
      ];
      
      // Try different combinations until we find an unused one
      for (const misconception of shuffledMisconceptions) {
        // Randomizar templates para cada misconception
        const shuffledTemplates = [...templates].sort(() => Math.random() - 0.5);
        for (const template of shuffledTemplates) {
          const distractor = template(misconception);
          const result = tryDistractor(distractor);
          if (result) return result;
        }
      }
    }
    
    // If we have concepts available, use them intelligently
    if (concepts.length > 0) {
      const shuffledConcepts = [...concepts].sort(() => Math.random() - 0.5);
      
      // Criar interpretações plausíveis mas incorretas - EXPANDIDO
      const distractorTemplates = [
        (c: string) => `${c} aplicado apenas à experiência pessoal`,
        (c: string) => `${c} como um processo puramente consciente`,
        (c: string) => `${c} sem elementos do inconsciente`,
        (c: string) => `${c} na perspectiva comportamental`,
        (c: string) => `Uma interpretação superficial de ${c}`,
        (c: string) => `${c} segundo a psicanálise freudiana`,
        (c: string) => `${c} entendido de forma literal`,
        (c: string) => `${c} como construção social apenas`,
        (c: string) => `${c} limitado a fatores biológicos`,
        (c: string) => `${c} desprovido de simbolismo`,
        (c: string) => `${c} restrito ao ego consciente`,
        (c: string) => `${c} como mecanismo de defesa`,
        (c: string) => `${c} determinado geneticamente`,
        (c: string) => `${c} resultado de condicionamento`,
        (c: string) => `${c} manifestação do superego`,
        (c: string) => `${c} produto da cultura moderna`,
        (c: string) => `${c} fenômeno neuroquímico`,
        (c: string) => `${c} expressão do id primitivo`,
        (c: string) => `${c} conceito obsoleto na psicologia`,
        (c: string) => `${c} limitado à primeira infância`
      ];
      
      // Try different combinations
      for (const concept of shuffledConcepts) {
        for (const template of distractorTemplates) {
          const distractor = template(concept);
          const result = tryDistractor(distractor);
          if (result) return result;
        }
      }
    }
    
    // Fallback: generate context-aware distractors based on the correct answer
    const correctLower = correct.toLowerCase();
    
    // Extract key terms from correct answer
    const jungianTerms = ['archetype', 'shadow', 'anima', 'animus', 'collective', 'unconscious', 
                         'individuation', 'self', 'ego', 'persona', 'complex'];
    
    const foundTerms = jungianTerms.filter(term => correctLower.includes(term));
    
    if (foundTerms.length > 0) {
      const term = foundTerms[0];
      
      // Criar conceitos relacionados mas incorretos
      const relatedDistracters: Record<string, string[]> = {
        'archetype': [
          'Memórias pessoais transmitidas geneticamente',
          'Comportamentos culturais aprendidos',
          'Traços individuais de personalidade',
          'Pensamento simbólico consciente',
          'Padrões sociais adquiridos',
          'Instintos biológicos básicos',
          'Representações mentais individuais',
          'Construções sociais compartilhadas',
          'Experiências traumáticas herdadas',
          'Símbolos religiosos universais'
        ],
        'shadow': [
          'Os pensamentos sombrios da mente consciente',
          'Aspectos malignos que devem ser eliminados',
          'Apenas traços negativos da personalidade',
          'O conceito de id de Freud',
          'Medos conscientes e fobias',
          'Comportamentos antissociais',
          'Impulsos destrutivos primários',
          'Defeitos morais inaceitáveis',
          'Energias psíquicas negativas',
          'Projeções do superego'
        ],
        'collective': [
          'Consciência grupal através do aprendizado social',
          'Memórias compartilhadas de ancestrais',
          'Tradições e costumes culturais',
          'Condicionamento social e normas',
          'Conhecimento transmitido culturalmente',
          'Experiências grupais sincronizadas',
          'Memória racial biologicamente herdada',
          'Consenso social sobre valores',
          'Padrões comportamentais aprendidos',
          'Identidade cultural coletiva'
        ],
        'unconscious': [
          'Memórias esquecidas que podem ser lembradas',
          'A atividade da mente durante o sono',
          'Pensamentos e desejos suprimidos',
          'Respostas comportamentais automáticas',
          'Processos cognitivos não conscientes',
          'Reflexos condicionados aprendidos',
          'Estados alterados de consciência',
          'Memórias reprimidas traumáticas',
          'Impulsos biológicos primitivos',
          'Processos mentais subliminares'
        ],
        'individuation': [
          'Tornar-se independente da sociedade',
          'Desenvolver uma personalidade única',
          'Autoaperfeiçoamento e sucesso',
          'Alcançar maturidade psicológica',
          'Isolamento social voluntário',
          'Rejeição de valores coletivos',
          'Busca por originalidade extrema',
          'Eliminação de conflitos internos',
          'Perfeição do caráter pessoal',
          'Transcendência do ego individual'
        ],
        'pokemon': [
          'Simples personagens de jogo sem significado profundo',
          'Designs aleatórios de criaturas sem base psicológica',
          'Figuras de entretenimento sem relação com psicologia',
          'Invenções modernas sem conexões arquetípicas'
        ],
        'gengar': [
          'Uma representação do mal puro na psicologia',
          'Um símbolo apenas de medos infantis',
          'Um exemplo do inconsciente pessoal',
          'Uma manifestação do lado sombrio do ego'
        ],
        'evolution': [
          'Crescimento físico simples sem mudança psicológica',
          'Transformações aleatórias sem significado profundo',
          'Um processo não relacionado à individuação',
          'Mudanças puramente biológicas em organismos'
        ]
      };
      
      const options = relatedDistracters[term] || [
        'Um conceito psicológico diferente',
        'Uma abordagem teórica alternativa',
        'Um processo relacionado mas distinto',
        'Uma interpretação equivocada comum',
        'Uma perspectiva não-junguiana',
        'Uma simplificação do conceito',
        'Uma distorção teórica comum',
        'Um mal-entendido frequente'
      ];
      
      // Try each option until we find an unused one
      const shuffledOptions = [...options].sort(() => Math.random() - 0.5);
      for (const option of shuffledOptions) {
        const result = tryDistractor(option);
        if (result) return result;
      }
    }
    
    // Fallback final: Gerar distratores psicológicos gerais - MUITO EXPANDIDO
    const generalDistracters = [
      'Um conceito cognitivo-comportamental',
      'Uma interpretação psicanalítica clássica',
      'Um princípio da psicologia humanista',
      'Uma teoria do desenvolvimento infantil',
      'Um fenômeno da psicologia social',
      'Um processo neuropsicológico',
      'Uma abordagem behaviorista radical',
      'Um conceito da psicologia positiva',
      'Uma teoria da Gestalt',
      'Um princípio existencialista',
      'Uma perspectiva transpessoal',
      'Um conceito sistêmico-familiar',
      'Uma teoria psicossomática',
      'Um modelo cognitivo-social',
      'Uma abordagem psicodinâmica',
      'Um paradigma construtivista',
      'Uma teoria do apego',
      'Um conceito da neurociência',
      'Uma perspectiva evolucionista',
      'Um princípio da psicofarmacologia',
      'Uma teoria da personalidade',
      'Um modelo de processamento de informação',
      'Uma abordagem fenomenológica',
      'Um conceito da psicologia cultural',
      'Uma teoria da motivação humana',
      'Um princípio da psicologia educacional',
      'Uma perspectiva psicobiológica',
      'Um modelo de inteligência emocional',
      'Uma teoria da aprendizagem social',
      'Um conceito da psicologia organizacional'
    ];
    
    // Try to find an unused general distractor
    const shuffledGeneral = [...generalDistracters].sort(() => Math.random() - 0.5);
    for (const distractor of shuffledGeneral) {
      const result = tryDistractor(distractor);
      if (result) return result;
    }
    
    // Se todas as opções foram esgotadas, gerar distratores contextuais únicos
    const contextualDistracters = [
      `Uma interpretação alternativa baseada em ${this.getRandomTheory()}`,
      `O processo de ${this.getRandomProcess()} na psique`,
      `A manifestação de ${this.getRandomConcept()} no comportamento`,
      `Uma dinâmica entre ${this.getRandomDuality()}`,
      `O desenvolvimento de ${this.getRandomDevelopment()}`,
      `A expressão de ${this.getRandomExpression()}`,
      `Uma forma de ${this.getRandomForm()}`,
      `O mecanismo de ${this.getRandomMechanism()}`
    ];
    
    // Tentar distratores contextuais
    const shuffledContextual = [...contextualDistracters].sort(() => Math.random() - 0.5);
    for (const distractor of shuffledContextual) {
      const result = tryDistractor(distractor);
      if (result) return result;
    }
    
    // Último recurso: gerar com timestamp para garantir unicidade
    const timestamp = Date.now();
    const uniqueDistractor = `Conceito psicológico alternativo (${timestamp % 1000})`;
    this.usedDistractors.add(uniqueDistractor.toLowerCase().trim().replace(/\s+/g, ' '));
    return uniqueDistractor;
  }

  /**
   * Create a basic explanation when none exists
   */
  private createBasicExplanation(question: Question, topic: string): string {
    const correctAnswerIndex = typeof question.correctAnswer === 'number' ? 
      question.correctAnswer : 
      (Array.isArray(question.correctAnswer) ? question.correctAnswer[0] : 0);
    
    const correctOption = question.options?.[correctAnswerIndex];
    const correctText = typeof correctOption === 'string' ? 
      correctOption : 
      (correctOption?.text || 'a resposta correta');
    
    return `A resposta correta é "${correctText}". ` +
           `Esta questão avalia sua compreensão sobre ${topic} na psicologia junguiana. ` +
           `É fundamental entender como este conceito se relaciona com os princípios da psicologia analítica de Jung ` +
           `e sua aplicação no processo de desenvolvimento psicológico e individuação.`;
  }

  private buildEnhancedExplanation(question: Question, topic: string): string {
    const base = question.explanation || '';
    const concepts = quizPromptService.getTopicConcepts(topic);
    
    // Structure: Why correct + Why others wrong + Key insight + Application
    let enhanced = base;
    
    // Add why other options are wrong (if multiple choice)
    if (question.type === 'multiple-choice' && question.options) {
      // Handle different types of correctAnswer
      const correctAnswerIndex = typeof question.correctAnswer === 'number' ? 
        question.correctAnswer : 
        (Array.isArray(question.correctAnswer) ? question.correctAnswer[0] : 0);
      
      enhanced += '\n\nPor que as outras opções estão incorretas:';
      question.options.forEach((option, index) => {
        if (index !== correctAnswerIndex) {
          const optionText = typeof option === 'string' ? option : option.text || option.toString();
          const correctOption = question.options![correctAnswerIndex];
          const correctText = typeof correctOption === 'string' ? correctOption : (correctOption.text || correctOption.toString());
          enhanced += `\n- Opção ${String.fromCharCode(65 + index)}: ${this.explainWhyWrong(optionText, correctText as string, question.question)}`;
        }
      });
    }
    
    // Add key insight
    enhanced += '\n\nInsight Principal: ' + this.generateKeyInsight(question.question, topic);
    
    // Add practical application
    enhanced += '\n\nAplicação Prática: ' + this.generatePracticalApplication(topic);
    
    return enhanced;
  }

  private extractKeyDifference(wrong: string, correct: string): string {
    // Extrair a diferença principal entre as opções
    const differences = [
      'a natureza universal versus pessoal do conceito',
      'o aspecto consciente versus inconsciente',
      'a dimensão individual versus coletiva',
      'o processo ativo versus passivo',
      'a origem interna versus externa'
    ];
    return differences[Math.floor(Math.random() * differences.length)];
  }

  private extractJungianEmphasis(correct: string): string {
    // Extrair o que Jung enfatizava
    const correctLower = correct.toLowerCase();
    
    if (correctLower.includes('coletivo')) {
      return 'a natureza coletiva e herdada dos padrões psíquicos';
    }
    if (correctLower.includes('individuação')) {
      return 'o processo de integração e realização do Self';
    }
    if (correctLower.includes('sombra')) {
      return 'a importância de integrar aspectos rejeitados da personalidade';
    }
    if (correctLower.includes('arquétipo')) {
      return 'os padrões universais que estruturam a experiência humana';
    }
    if (correctLower.includes('sonho')) {
      return 'a função compensatória e prospectiva dos sonhos';
    }
    
    return 'a totalidade da psique e a busca pelo equilíbrio psicológico';
  }

  private explainWhyWrong(wrong: string, correct: string, question: string): string {
    const wrongLower = wrong.toLowerCase();
    const correctLower = correct.toLowerCase();
    
    // Analisar o tipo de erro baseado no conteúdo
    if (wrongLower.includes('freud') && !correctLower.includes('freud')) {
      return 'Esta opção confunde conceitos junguianos com teoria freudiana. Jung desenvolveu suas próprias teorias que divergem significativamente das de Freud.';
    }
    
    if (wrongLower.includes('consciente') && correctLower.includes('inconsciente')) {
      return 'Esta opção inverte os conceitos de consciente e inconsciente. Lembre-se que Jung enfatizava a importância do inconsciente.';
    }
    
    if (wrongLower.includes('pessoal') && correctLower.includes('coletivo')) {
      return 'Esta opção confunde o inconsciente pessoal com o coletivo. O inconsciente coletivo é herdado e universal, não pessoal.';
    }
    
    if (wrongLower.includes('apenas') || wrongLower.includes('somente')) {
      return 'Esta opção é muito restritiva. Os conceitos junguianos são mais abrangentes e complexos do que esta simplificação sugere.';
    }
    
    if (wrongLower.includes('todos') || wrongLower.includes('sempre')) {
      return 'Esta opção generaliza demais. Jung reconhecia a individualidade e variação nas experiências psicológicas.';
    }
    
    // Explicações genéricas mais completas
    const keyDiff = this.extractKeyDifference(wrong, correct);
    const jungEmphasis = this.extractJungianEmphasis(correct);
    
    const explanations = [
      'Esta opção representa um mal-entendido comum sobre o conceito. ' + correct + ' é a resposta correta porque aborda o aspecto fundamental da teoria.',
      'Embora pareça plausível, esta opção não captura a essência do conceito junguiano. A resposta correta enfatiza ' + keyDiff,
      'Esta interpretação é parcialmente correta mas omite elementos cruciais. Jung especificamente enfatizava ' + jungEmphasis,
      'Esta opção descreve um aspecto diferente da psicologia analítica que não se aplica diretamente à questão apresentada.'
    ];
    
    return explanations[Math.floor(Math.random() * explanations.length)];
  }

  private generateKeyInsight(question: string, topic: string): string {
    const insights = {
      'Collective Unconscious': 'Lembre-se que o inconsciente coletivo é herdado, não aprendido, e contém padrões universais da humanidade.',
      'Psychological Types': 'Os tipos são preferências, não limitações. Todos usam todas as funções, mas em ordens diferentes.',
      'Individuation': 'A individuação é sobre tornar-se completo, não perfeito. É um processo que dura toda a vida.',
      'Shadow': 'A sombra contém tanto qualidades negativas quanto positivas que rejeitamos em nós mesmos.',
      'Anima/Animus': 'Estes representam nossa relação com o inconsciente, não apenas papéis de gênero.',
      'Dreams': 'Os sonhos compensam atitudes conscientes e podem mostrar desenvolvimentos psicológicos futuros.',
      'Arquétipos': 'Os arquétipos são padrões universais que se manifestam de forma única em cada indivíduo.',
      'Self': 'O Self representa a totalidade da psique, incluindo aspectos conscientes e inconscientes.',
      'Persona': 'A persona é a máscara social que usamos, mas não deve ser confundida com nossa verdadeira identidade.',
      'Complexos': 'Os complexos são grupos de ideias e emoções que influenciam nosso comportamento de forma inconsciente.'
    };
    
    return insights[topic as keyof typeof insights] || 'Compreender este conceito ajuda a integrar aspectos conscientes e inconscientes da psique, promovendo o desenvolvimento pessoal.';
  }

  private generatePracticalApplication(topic: string): string {
    const applications = {
      'Collective Unconscious': 'Observe temas universais em histórias, mitos e seus próprios sonhos. Note como certos símbolos aparecem repetidamente.',
      'Psychological Types': 'Observe suas preferências naturais em decisões diárias e interações. Identifique sua função dominante.',
      'Individuation': 'Reflita sobre momentos em que você integrou aspectos opostos de si mesmo. Reconheça seu progresso pessoal.',
      'Shadow': 'Preste atenção a reações emocionais fortes a outras pessoas - elas podem revelar conteúdo da sombra.',
      'Anima/Animus': 'Examine seus relacionamentos em busca de projeções de figuras internas. Note padrões repetitivos.',
      'Dreams': 'Mantenha um diário de sonhos e procure mensagens compensatórias do inconsciente.',
      'Arquétipos': 'Identifique padrões arquetípicos em sua vida e na cultura ao seu redor.',
      'Self': 'Pratique a auto-observação para reconhecer momentos de totalidade e integração.',
      'Persona': 'Diferencie entre seu eu autêntico e as máscaras sociais que você usa em diferentes contextos.',
      'Complexos': 'Observe situações que desencadeiam reações desproporcionais - podem indicar complexos ativos.'
    };
    
    return applications[topic as keyof typeof applications] || 'Aplique este entendimento em sua jornada de desenvolvimento pessoal, observando como os conceitos se manifestam em sua vida diária.';
  }

  private extractConcepts(text: string): string[] {
    const jungianConcepts = [
      'archetype', 'shadow', 'anima', 'animus', 'self', 'ego', 'persona',
      'collective unconscious', 'individuation', 'complex', 'projection',
      'compensation', 'transcendent function', 'active imagination'
    ];
    
    return jungianConcepts.filter(concept => 
      text.toLowerCase().includes(concept.toLowerCase())
    );
  }

  private determineCognitiveLevel(question: Question): string {
    const q = (question.question || '').toLowerCase();
    
    if (q.includes('define') || q.includes('what is') || q.includes('identify')) {
      return 'remember';
    } else if (q.includes('explain') || q.includes('describe') || q.includes('summarize')) {
      return 'understand';
    } else if (q.includes('apply') || q.includes('demonstrate') || q.includes('use')) {
      return 'apply';
    } else if (q.includes('analyze') || q.includes('compare') || q.includes('differentiate')) {
      return 'analyze';
    } else if (q.includes('evaluate') || q.includes('assess') || q.includes('critique')) {
      return 'evaluate';
    } else if (q.includes('create') || q.includes('design') || q.includes('integrate')) {
      return 'create';
    }
    
    return 'understand';
  }

  private assessEducationalValue(question: Question): number {
    let value = 0;
    
    // Has explanation
    if (question.explanation && question.explanation.length > 100) value += 2;
    
    // Has good distractors (for MC)
    if (question.type === 'multiple-choice' && question.options) {
      const hasGoodDistractors = question.options.some((opt, index) => {
        const optText = typeof opt === 'string' ? opt : opt.text || '';
        return optText.length > 20 && index !== question.correctAnswer!;
      });
      if (hasGoodDistractors) value += 2;
    }
    
    // Tests higher cognitive levels
    const cogLevel = question.metadata?.cognitiveLevel || this.determineCognitiveLevel(question);
    if (['analyze', 'evaluate', 'create'].includes(cogLevel)) value += 3;
    
    // Has context
    if (question.metadata?.hasContext) value += 2;
    
    // Has references
    if (question.metadata?.references?.length) value += 1;
    
    return Math.min(value, 10); // Max score of 10
  }

  private findRelevantReferences(question: string): string[] {
    const references: Record<string, string[]> = {
      'collective unconscious': ['CW 9i: The Archetypes and the Collective Unconscious'],
      'archetype': ['CW 9i: The Archetypes and the Collective Unconscious', 'Man and His Symbols'],
      'shadow': ['CW 9ii: Aion', 'Man and His Symbols, Chapter 3'],
      'anima': ['CW 9ii: Aion', 'CW 7: Two Essays on Analytical Psychology'],
      'animus': ['CW 9ii: Aion', 'CW 7: Two Essays on Analytical Psychology'],
      'individuation': ['CW 9i: The Archetypes and the Collective Unconscious', 'Memories, Dreams, Reflections'],
      'self': ['CW 9ii: Aion', 'CW 11: Psychology and Religion'],
      'psychological types': ['CW 6: Psychological Types'],
      'dreams': ['CW 8: The Structure and Dynamics of the Psyche', 'Man and His Symbols, Chapter 1']
    };
    
    const found: string[] = [];
    const lowerQuestion = question.toLowerCase();
    
    Object.entries(references).forEach(([concept, refs]) => {
      if (lowerQuestion.includes(concept)) {
        found.push(...refs);
      }
    });
    
    return Array.from(new Set(found)).slice(0, 2); // Return max 2 unique references
  }

  private generateContext(question: string, topic: string): string | null {
    const contexts = {
      'Collective Unconscious': [
        'Consider how similar mythological themes appear across different cultures that had no contact with each other.',
        'Think about why certain symbols (like the circle or the tree) appear universally in human art and dreams.'
      ],
      'Psychological Types': [
        'Imagine you\'re at a party. Some people gain energy from socializing while others feel drained.',
        'In a team meeting, notice how some members focus on facts while others emphasize values.'
      ],
      'Individuation': [
        'A successful businessperson at midlife suddenly feels empty despite external achievements.',
        'After years of pleasing others, someone begins to discover what they truly value.'
      ],
      'Shadow': [
        'You find yourself intensely irritated by a colleague\'s behavior that others barely notice.',
        'A person who prides themselves on being rational becomes furious when accused of being emotional.'
      ]
    };
    
    const topicContexts = contexts[topic as keyof typeof contexts];
    if (!topicContexts || topicContexts.length === 0) return null;
    
    // Only add context to some questions for variety
    if (Math.random() > 0.6) return null;
    
    return topicContexts[Math.floor(Math.random() * topicContexts.length)];
  }

  private identifyContextType(context: string): string {
    if (context.includes('Consider') || context.includes('Think about')) return 'reflective';
    if (context.includes('Imagine') || context.includes('picture')) return 'scenario';
    if (context.includes('A person') || context.includes('someone')) return 'case-study';
    return 'example';
  }

  // Métodos auxiliares para geração de distratores únicos
  private getRandomTheory(): string {
    const theories = [
      'teorias cognitivas modernas',
      'abordagens psicodinâmicas',
      'perspectivas humanistas',
      'modelos comportamentais',
      'teorias sistêmicas',
      'paradigmas construtivistas'
    ];
    return theories[Math.floor(Math.random() * theories.length)];
  }

  private getRandomProcess(): string {
    const processes = [
      'integração psíquica',
      'adaptação emocional',
      'regulação afetiva',
      'processamento simbólico',
      'elaboração mental',
      'transformação psicológica'
    ];
    return processes[Math.floor(Math.random() * processes.length)];
  }

  private getRandomConcept(): string {
    const concepts = [
      'energia psíquica',
      'conteúdo latente',
      'estrutura mental',
      'padrão comportamental',
      'dinâmica interna',
      'força motivacional'
    ];
    return concepts[Math.floor(Math.random() * concepts.length)];
  }

  private getRandomDuality(): string {
    const dualities = [
      'consciente e pré-consciente',
      'impulso e controle',
      'desejo e realidade',
      'interno e externo',
      'individual e social',
      'racional e emocional'
    ];
    return dualities[Math.floor(Math.random() * dualities.length)];
  }

  private getRandomDevelopment(): string {
    const developments = [
      'capacidades adaptativas',
      'recursos psicológicos',
      'potenciais latentes',
      'habilidades emocionais',
      'competências sociais',
      'estruturas cognitivas'
    ];
    return developments[Math.floor(Math.random() * developments.length)];
  }

  private getRandomExpression(): string {
    const expressions = [
      'tendências inconscientes',
      'padrões relacionais',
      'dinâmicas internas',
      'processos adaptativos',
      'mecanismos psicológicos',
      'estruturas de personalidade'
    ];
    return expressions[Math.floor(Math.random() * expressions.length)];
  }

  private getRandomForm(): string {
    const forms = [
      'elaboração psíquica',
      'processamento emocional',
      'integração mental',
      'organização psicológica',
      'estruturação cognitiva',
      'desenvolvimento pessoal'
    ];
    return forms[Math.floor(Math.random() * forms.length)];
  }

  private getRandomMechanism(): string {
    const mechanisms = [
      'autorregulação emocional',
      'compensação psíquica',
      'equilibração dinâmica',
      'adaptação funcional',
      'integração estrutural',
      'transformação simbólica'
    ];
    return mechanisms[Math.floor(Math.random() * mechanisms.length)];
  }

}

// Export a singleton instance
export const quizEnhancer = new QuizEnhancer();