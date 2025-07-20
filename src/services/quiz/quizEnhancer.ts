/**
 * Quiz Enhancer for Jung Educational App
 * Improves generated questions with better distractors, explanations, and educational value
 */

import { Question } from '../../types';
import { getTopicMisconceptions, getTopicConcepts, questionStemVariations } from './quizTemplates';

export interface EnhancementOptions {
  addExplanations: boolean;
  improveDistractors: boolean;
  varyQuestionStems: boolean;
  addReferences: boolean;
  contextualizeQuestions: boolean;
}

export class QuizEnhancer {
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
    return Promise.all(
      questions.map(q => this.enhanceQuestion(q, topic, options))
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
   * Improve distractors for multiple choice questions
   */
  private improveDistractors(question: Question, topic: string): Question {
    if (!question.options || question.correctAnswer === undefined) return question;

    const misconceptions = getTopicMisconceptions(topic);
    const concepts = getTopicConcepts(topic);
    const correctOption = question.options[question.correctAnswer];
    
    // Generate better distractors
    const improvedOptions = question.options.map((option, index) => {
      if (index === question.correctAnswer) {
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

    return {
      ...question,
      options: improvedOptions
    };
  }

  /**
   * Enhance explanations with more educational content
   */
  private enhanceExplanation(question: Question, topic: string): Question {
    if (!question.explanation) return question;

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
    // Use a misconception if available
    if (misconceptions.length > 0) {
      const misconception = misconceptions[Math.floor(Math.random() * misconceptions.length)];
      
      // Create varied distractor types based on misconception
      const templates = [
        `A belief that ${misconception}`,
        `The idea that ${misconception}`,
        `A theory suggesting ${misconception}`,
        `The concept where ${misconception}`
      ];
      
      return templates[Math.floor(Math.random() * templates.length)];
    }
    
    // If we have concepts available, use them intelligently
    if (concepts.length > 0) {
      const relatedConcept = concepts[Math.floor(Math.random() * concepts.length)];
      
      // Create plausible but incorrect interpretations
      const distractorTemplates = [
        `${relatedConcept} applied to personal experience only`,
        `${relatedConcept} as a conscious process`,
        `${relatedConcept} without unconscious elements`,
        `${relatedConcept} in behavioral psychology context`,
        `A simplified version of ${relatedConcept}`,
        `${relatedConcept} from a Freudian perspective`
      ];
      
      return distractorTemplates[Math.floor(Math.random() * distractorTemplates.length)];
    }
    
    // Fallback: generate context-aware distractors based on the correct answer
    const correctLower = correct.toLowerCase();
    
    // Extract key terms from correct answer
    const jungianTerms = ['archetype', 'shadow', 'anima', 'animus', 'collective', 'unconscious', 
                         'individuation', 'self', 'ego', 'persona', 'complex'];
    
    const foundTerms = jungianTerms.filter(term => correctLower.includes(term));
    
    if (foundTerms.length > 0) {
      const term = foundTerms[0];
      
      // Create related but incorrect concepts
      const relatedDistracters: Record<string, string[]> = {
        'archetype': [
          'Personal memories passed through genetics',
          'Learned cultural behaviors',
          'Individual personality traits',
          'Conscious symbolic thinking'
        ],
        'shadow': [
          'The conscious mind\'s dark thoughts',
          'Evil aspects that must be eliminated',
          'Only negative personality traits',
          'Freud\'s concept of the id'
        ],
        'collective': [
          'Group consciousness from social learning',
          'Shared memories from ancestors',
          'Cultural traditions and customs',
          'Social conditioning and norms'
        ],
        'unconscious': [
          'Forgotten memories that can be recalled',
          'The sleeping mind\'s activity',
          'Suppressed thoughts and desires',
          'Automatic behavioral responses'
        ],
        'individuation': [
          'Becoming independent from society',
          'Developing a unique personality',
          'Self-improvement and success',
          'Reaching psychological maturity'
        ],
        'pokemon': [
          'Simple game characters without deeper meaning',
          'Random creature designs with no psychological basis',
          'Entertainment figures unrelated to psychology',
          'Modern inventions with no archetypal connections'
        ],
        'gengar': [
          'A representation of pure evil in psychology',
          'A symbol of childhood fears only',
          'An example of the personal unconscious',
          'A manifestation of the ego\'s dark side'
        ],
        'evolution': [
          'Simple physical growth without psychological change',
          'Random transformations with no deeper meaning',
          'A process unrelated to individuation',
          'Purely biological changes in organisms'
        ]
      };
      
      const options = relatedDistracters[term] || [
        'A different psychological concept',
        'An alternative theoretical approach',
        'A related but distinct process',
        'A common misinterpretation'
      ];
      
      return options[Math.floor(Math.random() * options.length)];
    }
    
    // Final fallback: Generate general psychological distractors
    const generalDistracters = [
      'A cognitive behavioral concept',
      'A psychoanalytic interpretation',
      'A humanistic psychology principle',
      'A developmental psychology theory',
      'A social psychology phenomenon',
      'A neuropsychological process'
    ];
    
    return generalDistracters[Math.floor(Math.random() * generalDistracters.length)];
  }

  private buildEnhancedExplanation(question: Question, topic: string): string {
    const base = question.explanation || '';
    const concepts = getTopicConcepts(topic);
    
    // Structure: Why correct + Why others wrong + Key insight + Application
    let enhanced = base;
    
    // Add why other options are wrong (if multiple choice)
    if (question.type === 'multiple-choice' && question.options) {
      enhanced += '\n\nWhy other options are incorrect:';
      question.options.forEach((option, index) => {
        if (index !== question.correctAnswer) {
          const optionText = typeof option === 'string' ? option : option.text || option.toString();
          const correctOption = question.options![question.correctAnswer!];
          const correctText = typeof correctOption === 'string' ? correctOption : (correctOption.text || correctOption.toString());
          enhanced += `\n- Option ${String.fromCharCode(65 + index)}: ${this.explainWhyWrong(optionText, correctText as string)}`;
        }
      });
    }
    
    // Add key insight
    enhanced += '\n\nKey Insight: ' + this.generateKeyInsight(question.question, topic);
    
    // Add practical application
    enhanced += '\n\nPractical Application: ' + this.generatePracticalApplication(topic);
    
    return enhanced;
  }

  private explainWhyWrong(wrong: string, correct: string): string {
    const explanations = [
      'This confuses the concept with',
      'This is a common misconception that',
      'While partially true, this misses',
      'This describes a different aspect that'
    ];
    
    return explanations[Math.floor(Math.random() * explanations.length)] + ' ...';
  }

  private generateKeyInsight(question: string, topic: string): string {
    const insights = {
      'Collective Unconscious': 'Remember that the collective unconscious is inherited, not learned, and contains universal patterns.',
      'Psychological Types': 'Types are preferences, not limitations. Everyone uses all functions but in different orders.',
      'Individuation': 'Individuation is about becoming whole, not perfect. It\'s a lifelong process.',
      'Shadow': 'The shadow contains both negative and positive qualities we\'ve rejected.',
      'Anima/Animus': 'These represent our relationship with the unconscious, not just gender roles.',
      'Dreams': 'Dreams compensate for conscious attitudes and can show future psychological developments.'
    };
    
    return insights[topic as keyof typeof insights] || 'Understanding this concept helps integrate conscious and unconscious aspects of the psyche.';
  }

  private generatePracticalApplication(topic: string): string {
    const applications = {
      'Collective Unconscious': 'Notice universal themes in stories, myths, and your own dreams.',
      'Psychological Types': 'Observe your natural preferences in daily decisions and interactions.',
      'Individuation': 'Reflect on moments when you\'ve integrated opposing aspects of yourself.',
      'Shadow': 'Pay attention to strong emotional reactions to others - they may reveal shadow content.',
      'Anima/Animus': 'Examine your relationships for projections of inner figures.',
      'Dreams': 'Keep a dream journal and look for compensatory messages.'
    };
    
    return applications[topic as keyof typeof applications] || 'Apply this understanding to your personal development journey.';
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
    const q = question.question.toLowerCase();
    
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
}

// Export a singleton instance
export const quizEnhancer = new QuizEnhancer();