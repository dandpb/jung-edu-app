/**
 * Quiz Templates for Jung Educational App
 * Provides structured templates for different question types and topics
 */

export interface QuestionTemplate {
  type: 'multiple-choice' | 'true-false' | 'matching' | 'short-answer' | 'essay';
  structure: string;
  optionPatterns?: string[];
  explanationTemplate: string;
  difficultyFactors: string[];
}

export interface TopicTemplate {
  topic: string;
  concepts: string[];
  questionTypes: QuestionTemplate[];
  assessmentFocus: string[];
  commonMisconceptions: string[];
}

// Jung-specific question type configurations with Portuguese concepts
export const jungQuestionTypes = {
  shadow: {
    concepts: ['sombra', 'projeção', 'inconsciente pessoal', 'conteúdo reprimido', 'integração da sombra'],
    questionStems: [
      'O que caracteriza o conceito de sombra em Jung?',
      'Como identificar projeções da sombra?',
      'Qual o papel da sombra no processo de individuação?'
    ],
    commonDistractors: [
      'A sombra é apenas negativa',
      'A sombra deve ser eliminada',
      'A sombra é o mesmo que o mal'
    ]
  },
  anima: {
    concepts: ['anima', 'alma feminina', 'imagem da alma', 'projeção da anima', 'estágios da anima'],
    questionStems: [
      'O que representa a anima na psicologia junguiana?',
      'Como se manifesta a anima no homem?',
      'Quais são os estágios de desenvolvimento da anima?'
    ],
    commonDistractors: [
      'A anima é apenas atração romântica',
      'A anima é fixa e imutável',
      'A anima é um estereótipo de gênero'
    ]
  },
  animus: {
    concepts: ['animus', 'alma masculina', 'logos', 'projeção do animus', 'estágios do animus'],
    questionStems: [
      'O que caracteriza o animus na mulher?',
      'Como o animus influencia a psique feminina?',
      'Qual a função do animus no desenvolvimento psicológico?'
    ],
    commonDistractors: [
      'O animus é apenas masculinidade',
      'O animus é sempre negativo',
      'O animus é determinado biologicamente'
    ]
  },
  collectiveUnconscious: {
    concepts: ['inconsciente coletivo', 'arquétipos', 'padrões universais', 'imagens primordiais', 'herança psíquica'],
    questionStems: [
      'O que diferencia o inconsciente coletivo do pessoal?',
      'Como os arquétipos se manifestam no inconsciente coletivo?',
      'Qual a origem do inconsciente coletivo segundo Jung?'
    ],
    commonDistractors: [
      'É o mesmo que inconsciente pessoal',
      'É apenas cultural',
      'É transmitido geneticamente'
    ]
  },
  individuationProcess: {
    concepts: ['individuação', 'Self', 'totalidade', 'integração', 'eixo ego-Self'],
    questionStems: [
      'O que caracteriza o processo de individuação?',
      'Como ocorre a integração dos opostos?',
      'Qual o objetivo final da individuação?'
    ],
    commonDistractors: [
      'Individuação é individualismo',
      'É um processo linear',
      'Pode ser completado totalmente'
    ]
  },
  archetypes: {
    concepts: ['arquétipos', 'padrões universais', 'imagens primordiais', 'herói', 'grande mãe', 'velho sábio'],
    questionStems: [
      'O que são arquétipos na teoria junguiana?',
      'Como os arquétipos influenciam o comportamento?',
      'Qual a relação entre arquétipos e símbolos?'
    ],
    commonDistractors: [
      'Arquétipos são estereótipos',
      'São conscientes',
      'São aprendidos culturalmente'
    ]
  }
};

// Jung-specific question type templates
export const jungQuestionTemplates: Record<string, QuestionTemplate> = {
  conceptIdentification: {
    type: 'multiple-choice',
    structure: 'Qual das seguintes opções melhor descreve o conceito de {concept} segundo Jung?',
    optionPatterns: [
      'Definição correta com características principais',
      'Conceito similar de teoria diferente',
      'Definição parcial faltando elemento chave',
      'Equívoco comum'
    ],
    explanationTemplate: 'Jung definiu {concept} como {definition}. Isso difere de {misconception} porque {distinction}.',
    difficultyFactors: ['complexidade conceitual', 'pensamento abstrato necessário', 'diferenciação de conceitos similares']
  },
  
  archetypeAnalysis: {
    type: 'multiple-choice',
    structure: 'No seguinte cenário, qual arquétipo está mais proeminentemente manifestado: {scenario}?',
    optionPatterns: [
      'Arquétipo correto com justificativa',
      'Arquétipo relacionado mas distinto',
      'Interpretação superficial',
      'Arquétipo mal aplicado'
    ],
    explanationTemplate: 'Este cenário ilustra o {archetype} porque {key_features}. Indicadores principais incluem {evidence}.',
    difficultyFactors: ['complexidade do cenário', 'manifestações sutis', 'múltiplos arquétipos presentes']
  },

  psychologicalTypeIdentification: {
    type: 'multiple-choice',
    structure: 'Baseado no seguinte padrão de comportamento, qual tipo psicológico é mais provável: {behavior}?',
    optionPatterns: [
      'Tipo correto com pilha de funções',
      'Tipo oposto',
      'Similar mas com função dominante diferente',
      'Identificação estereotipada incorreta'
    ],
    explanationTemplate: 'Este padrão sugere {type} com função dominante {function}. Os indicadores principais são {behaviors} que demonstram {cognitive_process}.',
    difficultyFactors: ['sutileza do comportamento', 'diferenciação de funções', 'visibilidade da função auxiliar']
  },

  dreamSymbolInterpretation: {
    type: 'short-answer',
    structure: 'O que o símbolo de {symbol} pode representar em um sonho, segundo a análise junguiana?',
    explanationTemplate: 'Na análise de sonhos junguiana, {symbol} frequentemente representa {meaning}. Considere associações pessoais, contexto cultural e função compensatória.',
    difficultyFactors: ['ambiguidade do símbolo', 'significado pessoal vs coletivo', 'dependência do contexto']
  },

  individuationProcess: {
    type: 'essay',
    structure: 'Descreva como {situation} se relaciona com o processo de individuação.',
    explanationTemplate: 'Aspectos principais a considerar: {aspects}. O processo de individuação envolve {stages} e esta situação reflete {specific_stage}.',
    difficultyFactors: ['compreensão do processo', 'identificação de estágios', 'aplicação pessoal']
  },

  shadowWork: {
    type: 'multiple-choice',
    structure: 'Qual das seguintes opções representa um exemplo de projeção da sombra em {context}?',
    optionPatterns: [
      'Projeção clara com conteúdo inconsciente',
      'Crítica consciente sem projeção',
      'Projeção parcial com alguma consciência',
      'Mal-entendido como sombra (na verdade consciente)'
    ],
    explanationTemplate: 'A projeção da sombra ocorre quando {unconscious_content} é atribuído a outros. Aqui, {specific_example} mostra isso porque {evidence}.',
    difficultyFactors: ['sutileza da projeção', 'distinção consciente vs inconsciente', 'complexidade do contexto']
  }
};

// Topic-specific templates with Portuguese concepts
export const topicTemplates: TopicTemplate[] = [
  {
    topic: 'Inconsciente Coletivo',
    concepts: ['inconsciente coletivo', 'arquétipos', 'padrões universais', 'imagens primordiais', 'herança psíquica'],
    questionTypes: [jungQuestionTemplates.conceptIdentification, jungQuestionTemplates.archetypeAnalysis],
    assessmentFocus: ['diferenciação do inconsciente pessoal', 'identificação de arquétipos', 'manifestações culturais'],
    commonMisconceptions: ['mesmo que inconsciente pessoal', 'puramente cultural', 'herança genética']
  },
  
  {
    topic: 'Tipos Psicológicos',
    concepts: ['introversão/extroversão', 'pensamento/sentimento', 'sensação/intuição', 'função dominante', 'função inferior'],
    questionTypes: [jungQuestionTemplates.psychologicalTypeIdentification, jungQuestionTemplates.conceptIdentification],
    assessmentFocus: ['identificação de funções', 'dinâmica dos tipos', 'padrões de desenvolvimento'],
    commonMisconceptions: ['tipos como caixas', 'mudança impossível', 'comportamento igual a tipo']
  },

  {
    topic: 'Individuação',
    concepts: ['individuação', 'Self', 'eixo ego-Self', 'integração', 'totalidade', 'transição da meia-idade'],
    questionTypes: [jungQuestionTemplates.individuationProcess, jungQuestionTemplates.conceptIdentification],
    assessmentFocus: ['compreensão do processo', 'reconhecimento de estágios', 'desafios de integração'],
    commonMisconceptions: ['processo linear', 'conclusão possível', 'mesmo que auto-aperfeiçoamento']
  },

  {
    topic: 'Sombra',
    concepts: ['sombra', 'sombra pessoal', 'sombra coletiva', 'projeção', 'integração', 'ouro na sombra'],
    questionTypes: [jungQuestionTemplates.shadowWork, jungQuestionTemplates.archetypeAnalysis],
    assessmentFocus: ['reconhecimento de projeção', 'métodos de integração', 'sombra positiva'],
    commonMisconceptions: ['apenas negativa', 'deve ser eliminada', 'é o mal']
  },

  {
    topic: 'Anima/Animus',
    concepts: ['anima', 'animus', 'contrassexual', 'imagem da alma', 'projeção', 'estágios de desenvolvimento', 'integração'],
    questionTypes: [jungQuestionTemplates.archetypeAnalysis, jungQuestionTemplates.conceptIdentification],
    assessmentFocus: ['identificação de estágios', 'padrões de projeção', 'sinais de integração'],
    commonMisconceptions: ['estereótipos de gênero', 'imagens fixas', 'apenas romântico']
  },
  {
    topic: 'Anima',
    concepts: ['anima', 'alma feminina', 'imagem da alma', 'projeção da anima', 'estágios da anima', 'integração'],
    questionTypes: [jungQuestionTemplates.archetypeAnalysis, jungQuestionTemplates.conceptIdentification],
    assessmentFocus: ['identificação de estágios', 'padrões de projeção', 'sinais de integração'],
    commonMisconceptions: ['estereótipos de gênero', 'imagens fixas', 'apenas romântico']
  },

  {
    topic: 'Sonhos',
    concepts: ['função compensatória', 'função prospectiva', 'símbolos', 'amplificação', 'imaginação ativa'],
    questionTypes: [jungQuestionTemplates.dreamSymbolInterpretation, jungQuestionTemplates.conceptIdentification],
    assessmentFocus: ['interpretação de símbolos', 'compreensão da função', 'pessoal vs coletivo'],
    commonMisconceptions: ['apenas realização de desejos', 'significados universais', 'interpretação literal']
  },
  {
    topic: 'Archetypes',
    concepts: ['arquétipos', 'padrões universais', 'imagens primordiais', 'herói', 'grande mãe', 'velho sábio', 'Self'],
    questionTypes: [jungQuestionTemplates.archetypeAnalysis, jungQuestionTemplates.conceptIdentification],
    assessmentFocus: ['identificação de arquétipos', 'manifestações culturais', 'símbolos universais'],
    commonMisconceptions: ['são estereótipos', 'são conscientes', 'são aprendidos']
  },
  {
    topic: 'Arquétipos',
    concepts: ['arquétipos', 'padrões universais', 'imagens primordiais', 'herói', 'grande mãe', 'velho sábio', 'Self'],
    questionTypes: [jungQuestionTemplates.archetypeAnalysis, jungQuestionTemplates.conceptIdentification],
    assessmentFocus: ['identificação de arquétipos', 'manifestações culturais', 'símbolos universais'],
    commonMisconceptions: ['são estereótipos', 'são conscientes', 'são aprendidos']
  }
];

// Difficulty progression patterns
export const difficultyProgressions = {
  beginner: {
    questionDistribution: { easy: 0.5, medium: 0.4, hard: 0.1 },
    cognitiveDistribution: { remembering: 0.4, understanding: 0.4, applying: 0.15, analyzing: 0.05 },
    focusAreas: ['definitions', 'basic identification', 'single concepts'],
    avoidAreas: ['complex integration', 'multiple concept synthesis', 'nuanced differentiation']
  },
  
  intermediate: {
    questionDistribution: { easy: 0.2, medium: 0.6, hard: 0.2 },
    cognitiveDistribution: { remembering: 0.2, understanding: 0.3, applying: 0.3, analyzing: 0.2 },
    focusAreas: ['application', 'differentiation', 'basic analysis'],
    avoidAreas: ['advanced theoretical synthesis', 'complex case analysis']
  },
  
  advanced: {
    questionDistribution: { easy: 0.1, medium: 0.4, hard: 0.5 },
    cognitiveDistribution: { remembering: 0.1, understanding: 0.2, applying: 0.3, analyzing: 0.4 },
    focusAreas: ['synthesis', 'critical analysis', 'integration', 'nuanced understanding'],
    avoidAreas: []
  }
};

// Answer validation patterns for different question types
export const answerValidationPatterns = {
  multipleChoice: {
    validate: (answer: number, correctAnswer: number) => answer === correctAnswer,
    feedback: (correct: boolean) => correct ? 'Correct!' : 'Not quite. Review the explanation to understand why.'
  },
  
  trueFalse: {
    validate: (answer: boolean, correctAnswer: boolean) => answer === correctAnswer,
    feedback: (correct: boolean) => correct ? 'Correct!' : 'Consider the nuances of Jung\'s theory here.'
  },
  
  shortAnswer: {
    validate: (answer: string, keyTerms: string[]) => {
      const lowerAnswer = answer.toLowerCase();
      return keyTerms.every(term => lowerAnswer.includes(term.toLowerCase()));
    },
    feedback: (correct: boolean, missing?: string[]) => 
      correct ? 'Excellent understanding!' : `Consider including these key concepts: ${missing?.join(', ')}`
  },
  
  essay: {
    validate: (answer: string, rubric: { required: string[], optional: string[], depth: number }) => {
      const lowerAnswer = answer.toLowerCase();
      const requiredCount = rubric.required.filter(term => lowerAnswer.includes(term.toLowerCase())).length;
      const optionalCount = rubric.optional.filter(term => lowerAnswer.includes(term.toLowerCase())).length;
      const wordCount = answer.split(/\s+/).length;
      
      return {
        score: (requiredCount / rubric.required.length) * 0.6 + 
               (optionalCount / rubric.optional.length) * 0.3 +
               (Math.min(wordCount / rubric.depth, 1)) * 0.1,
        feedback: {
          required: requiredCount,
          optional: optionalCount,
          depth: wordCount >= rubric.depth
        }
      };
    },
    feedback: (result: any) => {
      const score = Math.round(result.score * 100);
      return `Score: ${score}%. Required concepts: ${result.feedback.required}/${result.rubric.required.length}. ` +
             `Additional concepts: ${result.feedback.optional}/${result.rubric.optional.length}. ` +
             `${result.feedback.depth ? 'Good depth of analysis.' : 'Consider expanding your analysis.'}`;
    }
  }
};

// Question stem variations for engagement
export const questionStemVariations = {
  identification: [
    'Which of the following best describes...',
    'What characterizes Jung\'s concept of...',
    'How would Jung define...',
    'In Jungian psychology, what is...'
  ],
  
  application: [
    'In this scenario, which concept is illustrated...',
    'How would a Jungian analyst interpret...',
    'Which Jungian principle explains...',
    'What process is demonstrated when...'
  ],
  
  analysis: [
    'What is the key difference between...',
    'How does Jung\'s view of X differ from...',
    'Why is X important for understanding...',
    'What relationship exists between...'
  ],
  
  synthesis: [
    'How do X and Y work together in...',
    'What happens when X meets Y in the context of...',
    'Explain the integration of...',
    'Describe how multiple concepts combine in...'
  ]
};

// Helper function to get appropriate template
export function getQuestionTemplate(topic: string, difficulty: string): QuestionTemplate {
  // Handle null/undefined/empty inputs
  if (!topic || typeof topic !== 'string') {
    return {
      type: 'multiple-choice',
      structure: 'O que melhor descreve este conceito junguiano?',
      optionPatterns: ['Definição correta', 'Conceito similar', 'Definição parcial', 'Concepção errônea comum'],
      explanationTemplate: 'Este conceito representa {explanation}.',
      difficultyFactors: ['complexidade conceitual']
    };
  }
  
  const normalizedTopic = topic.toString().trim().toLowerCase();
  const topicTemplate = topicTemplates.find(t => 
    t.topic.toLowerCase() === normalizedTopic || 
    t.topic.toLowerCase().includes(normalizedTopic) ||
    normalizedTopic.includes(t.topic.toLowerCase())
  );
  
  if (!topicTemplate) {
    // Return a default template for unknown topics
    return {
      type: 'multiple-choice',
      structure: 'O que melhor descreve o conceito junguiano de {concept}?',
      optionPatterns: ['Definição correta', 'Conceito relacionado', 'Definição incompleta', 'Interpretação incorreta'],
      explanationTemplate: 'Este conceito representa {explanation}.',
      difficultyFactors: ['complexidade conceitual']
    };
  }
  
  // Select based on difficulty
  const normalizedDifficulty = (difficulty || 'medium').toString().toLowerCase();
  if (normalizedDifficulty === 'easy') {
    return topicTemplate.questionTypes.find(qt => qt.type === 'multiple-choice') || topicTemplate.questionTypes[0];
  } else if (normalizedDifficulty === 'hard') {
    return topicTemplate.questionTypes.find(qt => qt.type === 'essay' || qt.type === 'short-answer') || topicTemplate.questionTypes[0];
  }
  
  return topicTemplate.questionTypes[Math.floor(Math.random() * topicTemplate.questionTypes.length)];
}

// Helper to get topic-specific concepts
export function getTopicConcepts(topic: string): string[] {
  // Handle null/undefined/empty inputs
  if (!topic || typeof topic !== 'string') {
    // Return general Jungian concepts
    return ['inconsciente', 'arquétipos', 'individuação', 'sombra', 'anima', 'animus', 'Self'];
  }
  
  const normalizedTopic = topic.toString().trim().toLowerCase();
  const topicTemplate = topicTemplates.find(t => 
    t.topic.toLowerCase() === normalizedTopic || 
    t.topic.toLowerCase().includes(normalizedTopic) ||
    normalizedTopic.includes(t.topic.toLowerCase())
  );
  
  if (!topicTemplate) {
    // Check if topic matches any jungQuestionTypes key
    const jungTypeKey = Object.keys(jungQuestionTypes).find(key => 
      key.toLowerCase() === normalizedTopic || 
      normalizedTopic.includes(key.toLowerCase()) ||
      key.toLowerCase().includes(normalizedTopic)
    );
    
    if (jungTypeKey && jungTypeKey in jungQuestionTypes) {
      return jungQuestionTypes[jungTypeKey as keyof typeof jungQuestionTypes].concepts;
    }
    
    // Return general Jungian concepts for unknown topics
    return ['inconsciente', 'arquétipos', 'individuação', 'sombra', 'anima', 'animus', 'Self', 'ego', 'persona'];
  }
  
  return topicTemplate.concepts;
}

// Helper to get common misconceptions for a topic
export function getTopicMisconceptions(topic: string): string[] {
  if (!topic || typeof topic !== 'string') {
    return [];
  }
  
  const normalizedTopic = topic.toString().trim().toLowerCase();
  const topicTemplate = topicTemplates.find(t => 
    t.topic.toLowerCase() === normalizedTopic || 
    t.topic.toLowerCase().includes(normalizedTopic) ||
    normalizedTopic.includes(t.topic.toLowerCase())
  );
  
  return topicTemplate?.commonMisconceptions || [];
}