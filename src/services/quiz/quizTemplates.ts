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

// Jung-specific question type templates
export const jungQuestionTypes: Record<string, QuestionTemplate> = {
  conceptIdentification: {
    type: 'multiple-choice',
    structure: 'Which of the following best describes Jung\'s concept of {concept}?',
    optionPatterns: [
      'Correct definition with key characteristics',
      'Similar concept from different theory',
      'Partial definition missing key element',
      'Common misconception'
    ],
    explanationTemplate: 'Jung defined {concept} as {definition}. This differs from {misconception} because {distinction}.',
    difficultyFactors: ['conceptual complexity', 'abstract thinking required', 'differentiation from similar concepts']
  },
  
  archetypeAnalysis: {
    type: 'multiple-choice',
    structure: 'In the following scenario, which archetype is most prominently displayed: {scenario}?',
    optionPatterns: [
      'Correct archetype with justification',
      'Related but distinct archetype',
      'Surface-level interpretation',
      'Misapplied archetype'
    ],
    explanationTemplate: 'This scenario illustrates the {archetype} because {key_features}. Key indicators include {evidence}.',
    difficultyFactors: ['scenario complexity', 'subtle manifestations', 'multiple archetypes present']
  },

  psychologicalTypeIdentification: {
    type: 'multiple-choice',
    structure: 'Based on the following behavior pattern, which psychological type is most likely: {behavior}?',
    optionPatterns: [
      'Correct type with function stack',
      'Opposite type',
      'Similar but different dominant function',
      'Stereotypical misidentification'
    ],
    explanationTemplate: 'This pattern suggests {type} with dominant {function}. The key indicators are {behaviors} which demonstrate {cognitive_process}.',
    difficultyFactors: ['behavior subtlety', 'function differentiation', 'auxiliary function visibility']
  },

  dreamSymbolInterpretation: {
    type: 'short-answer',
    structure: 'What might the symbol of {symbol} represent in a dream, according to Jungian analysis?',
    explanationTemplate: 'In Jungian dream analysis, {symbol} often represents {meaning}. Consider personal associations, cultural context, and compensatory function.',
    difficultyFactors: ['symbol ambiguity', 'personal vs collective meaning', 'context dependency']
  },

  individuationProcess: {
    type: 'essay',
    structure: 'Describe how {situation} relates to the individuation process.',
    explanationTemplate: 'Key aspects to consider: {aspects}. The individuation process involves {stages} and this situation reflects {specific_stage}.',
    difficultyFactors: ['process understanding', 'stage identification', 'personal application']
  },

  shadowWork: {
    type: 'multiple-choice',
    structure: 'Which of the following represents an example of shadow projection in {context}?',
    optionPatterns: [
      'Clear projection with unconscious content',
      'Conscious criticism without projection',
      'Partial projection with some awareness',
      'Misunderstood as shadow (actually conscious)'
    ],
    explanationTemplate: 'Shadow projection occurs when {unconscious_content} is attributed to others. Here, {specific_example} shows this because {evidence}.',
    difficultyFactors: ['projection subtlety', 'conscious vs unconscious distinction', 'context complexity']
  }
};

// Topic-specific templates
export const topicTemplates: TopicTemplate[] = [
  {
    topic: 'Collective Unconscious',
    concepts: ['archetypes', 'universal patterns', 'inherited psychic structures', 'primordial images'],
    questionTypes: [jungQuestionTypes.conceptIdentification, jungQuestionTypes.archetypeAnalysis],
    assessmentFocus: ['differentiation from personal unconscious', 'archetype identification', 'cultural manifestations'],
    commonMisconceptions: ['same as personal unconscious', 'purely cultural', 'genetic inheritance']
  },
  
  {
    topic: 'Pokemon and Jungian Psychology',
    concepts: ['Pokemon as archetypes', 'evolution as individuation', 'type dynamics', 'trainer-Pokemon relationship as Self-ego axis'],
    questionTypes: [jungQuestionTypes.archetypeAnalysis, jungQuestionTypes.conceptIdentification],
    assessmentFocus: ['archetype manifestation in Pokemon', 'psychological growth through Pokemon journey', 'type relationships as psychological functions'],
    commonMisconceptions: ['Pokemon are just entertainment', 'evolution is only physical change', 'types are arbitrary categories']
  },
  
  {
    topic: 'Psychological Types',
    concepts: ['introversion/extraversion', 'thinking/feeling', 'sensation/intuition', 'dominant function', 'inferior function'],
    questionTypes: [jungQuestionTypes.psychologicalTypeIdentification, jungQuestionTypes.conceptIdentification],
    assessmentFocus: ['function identification', 'type dynamics', 'development patterns'],
    commonMisconceptions: ['types as boxes', 'no change possible', 'behavior equals type']
  },

  {
    topic: 'Individuation',
    concepts: ['Self', 'ego-Self axis', 'integration', 'wholeness', 'midlife transition'],
    questionTypes: [jungQuestionTypes.individuationProcess, jungQuestionTypes.conceptIdentification],
    assessmentFocus: ['process understanding', 'stage recognition', 'integration challenges'],
    commonMisconceptions: ['linear process', 'completion possible', 'same as self-improvement']
  },

  {
    topic: 'Shadow',
    concepts: ['personal shadow', 'collective shadow', 'projection', 'integration', 'gold in the shadow'],
    questionTypes: [jungQuestionTypes.shadowWork, jungQuestionTypes.archetypeAnalysis],
    assessmentFocus: ['projection recognition', 'integration methods', 'positive shadow'],
    commonMisconceptions: ['only negative', 'should be eliminated', 'same as evil']
  },

  {
    topic: 'Anima/Animus',
    concepts: ['contrasexual', 'soul image', 'projection', 'development stages', 'integration'],
    questionTypes: [jungQuestionTypes.archetypeAnalysis, jungQuestionTypes.conceptIdentification],
    assessmentFocus: ['stage identification', 'projection patterns', 'integration signs'],
    commonMisconceptions: ['gender stereotypes', 'fixed images', 'only romantic']
  },

  {
    topic: 'Dreams',
    concepts: ['compensatory function', 'prospective function', 'symbols', 'amplification', 'active imagination'],
    questionTypes: [jungQuestionTypes.dreamSymbolInterpretation, jungQuestionTypes.conceptIdentification],
    assessmentFocus: ['symbol interpretation', 'function understanding', 'personal vs collective'],
    commonMisconceptions: ['wish fulfillment only', 'universal meanings', 'literal interpretation']
  }
];

// Difficulty progression patterns
export const difficultyProgressions = {
  beginner: {
    questionDistribution: { easy: 0.5, medium: 0.4, hard: 0.1 },
    focusAreas: ['definitions', 'basic identification', 'single concepts'],
    avoidAreas: ['complex integration', 'multiple concept synthesis', 'nuanced differentiation']
  },
  
  intermediate: {
    questionDistribution: { easy: 0.2, medium: 0.6, hard: 0.2 },
    focusAreas: ['application', 'differentiation', 'basic analysis'],
    avoidAreas: ['advanced theoretical synthesis', 'complex case analysis']
  },
  
  advanced: {
    questionDistribution: { easy: 0.1, medium: 0.4, hard: 0.5 },
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
  const topicTemplate = topicTemplates.find(t => t.topic === topic);
  if (!topicTemplate) {
    return jungQuestionTypes.conceptIdentification; // default
  }
  
  // Select based on difficulty
  if (difficulty === 'easy') {
    return topicTemplate.questionTypes.find(qt => qt.type === 'multiple-choice') || topicTemplate.questionTypes[0];
  } else if (difficulty === 'hard') {
    return topicTemplate.questionTypes.find(qt => qt.type === 'essay' || qt.type === 'short-answer') || topicTemplate.questionTypes[0];
  }
  
  return topicTemplate.questionTypes[Math.floor(Math.random() * topicTemplate.questionTypes.length)];
}

// Helper to get topic-specific concepts
export function getTopicConcepts(topic: string): string[] {
  const topicTemplate = topicTemplates.find(t => t.topic === topic);
  return topicTemplate?.concepts || [];
}

// Helper to get common misconceptions for a topic
export function getTopicMisconceptions(topic: string): string[] {
  const topicTemplate = topicTemplates.find(t => t.topic === topic);
  return topicTemplate?.commonMisconceptions || [];
}