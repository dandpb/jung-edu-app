/**
 * Test script to validate quiz quality improvements
 */

import { QuizGenerator } from '../llm/generators/quiz-generator';
import { quizValidator } from './quizValidator';

// Mock provider for testing
class MockProvider {
  async generateStructuredOutput<T>(prompt: string, schema: any, options?: any): Promise<T> {
    // Simulate high-quality quiz generation
    const mockQuestions = [
      {
        question: "According to Jung, how does Gengar represent the Shadow archetype in Pokemon?",
        options: [
          "Gengar embodies repressed aspects of the psyche that manifest as a dark, mischievous Pokemon",
          "Gengar represents the personal unconscious and individual memories",
          "Gengar symbolizes the collective unconscious shared by all trainers",
          "Gengar is a manifestation of the anima/animus in ghost form"
        ],
        correctAnswer: 0,
        explanation: "Gengar, as a Ghost/Poison type known for hiding in shadows and playing tricks, perfectly embodies Jung's Shadow archetype - the repressed, hidden aspects of personality that we don't acknowledge but that still influence our behavior.",
        difficulty: "medium",
        cognitiveLevel: "understanding"
      },
      {
        question: "How does Pokemon evolution parallel Jung's concept of individuation?",
        options: [
          "Both involve a transformative process of psychological development and self-realization",
          "Evolution is purely physical while individuation is only mental",
          "Pokemon evolution happens instantly while individuation takes a lifetime",
          "They are unrelated concepts from different fields"
        ],
        correctAnswer: 0,
        explanation: "Pokemon evolution mirrors individuation as both represent transformative journeys toward a more complete, integrated form. Just as Pokemon evolve into their fuller potential, individuation is the process of integrating all aspects of the psyche.",
        difficulty: "hard",
        cognitiveLevel: "analysis"
      },
      {
        question: "Which Pokemon type combination best represents the integration of opposing psychological functions in Jungian theory?",
        options: [
          "Psychic/Dark types like Malamar, showing integration of conscious and unconscious",
          "Fire/Water types, representing impossible combinations",
          "Normal types, showing psychological balance",
          "Single-type Pokemon, representing psychological purity"
        ],
        correctAnswer: 0,
        explanation: "Dual-type Pokemon like Psychic/Dark represent the Jungian concept of holding opposites in tension. The Psychic type (consciousness) paired with Dark type (shadow/unconscious) shows psychological integration.",
        difficulty: "hard",
        cognitiveLevel: "application"
      },
      {
        question: "In Jungian terms, what does the trainer-Pokemon relationship most closely represent?",
        options: [
          "The ego-Self axis, with the trainer as ego guiding various aspects of the psyche",
          "Simple pet ownership without psychological significance",
          "The superego controlling the id",
          "Behavioral conditioning through positive reinforcement"
        ],
        correctAnswer: 0,
        explanation: "The trainer (ego) works with various Pokemon (different aspects of the psyche - shadow, anima/animus, etc.) toward a common goal, mirroring how the ego must integrate various psychological elements in the individuation process.",
        difficulty: "medium",
        cognitiveLevel: "application"
      },
      {
        question: "How can legendary Pokemon be understood through the lens of Jungian archetypes?",
        options: [
          "They represent primordial archetypes from the collective unconscious",
          "They are simply more powerful versions of regular Pokemon",
          "They symbolize individual achievements and personal goals",
          "They have no archetypal significance in psychological terms"
        ],
        correctAnswer: 0,
        explanation: "Legendary Pokemon like Arceus (creation), Darkrai (shadow/nightmare), and Cresselia (dreams/light) represent fundamental archetypes that appear across cultures - creation myths, light/dark duality, etc., showing their roots in the collective unconscious.",
        difficulty: "medium",
        cognitiveLevel: "understanding"
      }
    ];

    return mockQuestions as any as T;
  }
}

export async function testQuizQuality() {
  console.log('Testing Quiz Generation Quality...\n');
  
  const mockProvider = new MockProvider() as any;
  const generator = new QuizGenerator(mockProvider);
  
  try {
    // Generate a quiz
    const quiz = await generator.generateQuiz(
      'pokemon-jung-1',
      'Pokemon and Jungian Psychology',
      'This module explores the deep psychological connections between Pokemon and Carl Jung\'s analytical psychology...',
      [
        'Understand how Pokemon represent Jungian archetypes',
        'Analyze Pokemon evolution as a metaphor for individuation',
        'Identify shadow projections in Pokemon battles'
      ],
      5
    );
    
    // Validate the quiz
    const validationResult = quizValidator.validateQuiz(quiz);
    
    console.log('Quiz Validation Results:');
    console.log('========================');
    console.log(`Valid: ${validationResult.isValid}`);
    console.log(`Quality Score: ${validationResult.score}/100`);
    console.log(`Errors: ${validationResult.errors.length}`);
    validationResult.errors.forEach(e => console.log(`  - ${e}`));
    console.log(`Warnings: ${validationResult.warnings.length}`);
    validationResult.warnings.forEach(w => console.log(`  - ${w}`));
    console.log(`Suggestions: ${validationResult.suggestions.length}`);
    validationResult.suggestions.forEach(s => console.log(`  - ${s}`));
    
    console.log('\nSample Questions:');
    console.log('=================');
    
    quiz.questions.slice(0, 3).forEach((q, i) => {
      console.log(`\nQuestion ${i + 1}: ${q.question}`);
      q.options?.forEach((opt, j) => {
        console.log(`  ${String.fromCharCode(65 + j)}) ${opt}`);
      });
      console.log(`Correct: ${String.fromCharCode(65 + (q.correctAnswer || 0))}`);
      console.log(`Explanation: ${q.explanation?.substring(0, 100)}...`);
    });
    
  } catch (error) {
    console.error('Error testing quiz generation:', error);
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testQuizQuality();
}