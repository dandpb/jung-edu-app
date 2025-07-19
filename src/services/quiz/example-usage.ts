/**
 * Example usage of the enhanced quiz generation system
 */

import { EnhancedQuizGenerator, EnhancedQuizOptions } from './enhancedQuizGenerator';
import { quizEnhancer } from './quizEnhancer';
import { getQuestionTemplate, topicTemplates } from './quizTemplates';
import { OpenAIProvider } from '../llm/provider';
import { Quiz, QuizQuestion } from '../../types/schema';

// Initialize the enhanced quiz generator
const quizGenerator = new EnhancedQuizGenerator(new OpenAIProvider(process.env.REACT_APP_OPENAI_API_KEY || ''));

/**
 * Example 1: Generate a comprehensive quiz for beginners
 */
export async function generateBeginnerQuiz(): Promise<Quiz> {
  const options: EnhancedQuizOptions = {
    useTemplates: true,
    enhanceQuestions: true,
    adaptiveDifficulty: false, // Keep it simple for beginners
    includeEssayQuestions: false, // No essays for beginners
    contextualizeQuestions: true,
    userLevel: 'beginner'
  };

  const quiz = await quizGenerator.generateEnhancedQuiz(
    'module-intro-001',
    'Collective Unconscious',
    `The collective unconscious is a key concept in Jung's analytical psychology...`,
    [
      'Define the collective unconscious',
      'Identify basic archetypes',
      'Distinguish collective from personal unconscious'
    ],
    8, // Fewer questions for beginners
    options
  );

  console.log('Generated beginner quiz:', {
    title: quiz.title,
    questionCount: quiz.questions.length,
    difficultyDistribution: quiz.metadata?.difficultyDistribution,
    timeLimit: quiz.timeLimit
  });

  return quiz;
}

/**
 * Example 2: Generate an advanced quiz with essays
 */
export async function generateAdvancedQuiz(): Promise<Quiz> {
  const options: EnhancedQuizOptions = {
    useTemplates: true,
    enhanceQuestions: true,
    adaptiveDifficulty: true,
    includeEssayQuestions: true,
    contextualizeQuestions: true,
    userLevel: 'advanced'
  };

  const quiz = await quizGenerator.generateEnhancedQuiz(
    'module-adv-shadow',
    'Shadow',
    `The shadow represents the parts of the personality that the conscious ego doesn't identify with...`,
    [
      'Analyze shadow projection mechanisms',
      'Evaluate integration strategies',
      'Synthesize shadow work with individuation'
    ],
    12,
    options
  );

  return quiz;
}

/**
 * Example 3: Generate adaptive questions based on performance
 */
export async function generateAdaptiveFollowUp(
  topic: string,
  previousPerformance: Array<{ questionId: string; correct: boolean; difficulty: string }>
): Promise<QuizQuestion[]> {
  // Convert to format expected by generator
  const responses = previousPerformance.map(p => ({
    correct: p.correct,
    difficulty: p.difficulty
  }));

  const adaptiveQuestions = await quizGenerator.generateAdaptiveQuestions(
    topic,
    responses,
    5 // Generate 5 follow-up questions
  );

  // Enhance the adaptive questions
  const enhanced = await quizEnhancer.enhanceQuestions(
    adaptiveQuestions,
    topic,
    {
      addExplanations: true,
      improveDistractors: true,
      varyQuestionStems: true,
      addReferences: true,
      contextualizeQuestions: false // Already contextualized
    }
  );

  return enhanced;
}

/**
 * Example 4: Generate practice questions for specific concepts
 */
export async function generateConceptPractice(
  topic: string,
  concept: string
): Promise<QuizQuestion[]> {
  const practiceQuestions = await quizGenerator.generatePracticeQuestions(
    topic,
    concept,
    5
  );

  // Enhance with educational features
  const enhanced = await quizEnhancer.enhanceQuestions(
    practiceQuestions,
    topic,
    {
      addExplanations: true,
      improveDistractors: true,
      varyQuestionStems: false, // Keep original for practice
      addReferences: true,
      contextualizeQuestions: true
    }
  );

  return enhanced;
}

/**
 * Example 5: Generate a study guide after quiz completion
 */
export async function generatePersonalizedStudyGuide(
  quiz: Quiz,
  userResponses: Array<{ questionId: string; answer: any; correct: boolean }>
): Promise<string> {
  const studyGuide = await quizGenerator.generateStudyGuide(
    quiz,
    userResponses.map(r => ({ questionId: r.questionId, correct: r.correct })),
    quiz.title.split(' - ')[0] // Extract topic from title
  );

  return studyGuide;
}

/**
 * Example 6: Use specific question templates
 */
export function demonstrateTemplateUsage() {
  // Get all available topics
  const availableTopics = topicTemplates.map(t => t.topic);
  console.log('Available topics:', availableTopics);

  // Get template for a specific topic and difficulty
  const shadowTemplate = getQuestionTemplate('Shadow', 'medium');
  console.log('Shadow question template:', shadowTemplate);

  // Show how templates structure questions
  const exampleQuestion = shadowTemplate.structure.replace('{context}', 'workplace criticism');
  console.log('Example question:', exampleQuestion);

  // Show option patterns for multiple choice
  if (shadowTemplate.optionPatterns) {
    console.log('Distractor patterns:', shadowTemplate.optionPatterns);
  }
}

/**
 * Example 7: Complete quiz workflow
 */
export async function completeQuizWorkflow(moduleId: string, topic: string) {
  console.log(`Starting quiz workflow for ${topic}...`);

  // 1. Generate initial quiz
  const quiz = await generateBeginnerQuiz();
  console.log('✓ Quiz generated');

  // 2. Simulate user taking the quiz
  const userResponses = quiz.questions.map((q, i) => ({
    questionId: q.id,
    answer: i % 3 === 0 ? q.correctAnswer : 0, // Simulate some wrong answers
    correct: i % 3 === 0
  }));

  // 3. Generate adaptive follow-up questions
  const performance = userResponses.map((r, i) => ({
    questionId: r.questionId,
    correct: r.correct,
    difficulty: quiz.questions[i].metadata?.difficulty || 'medium'
  }));
  
  const followUpQuestions = await generateAdaptiveFollowUp(topic, performance);
  console.log('✓ Adaptive questions generated:', followUpQuestions.length);

  // 4. Generate study guide
  const studyGuide = await generatePersonalizedStudyGuide(quiz, userResponses);
  console.log('✓ Study guide generated');

  // 5. Generate practice questions for weak areas
  const practiceQuestions = await generateConceptPractice(topic, 'archetypes');
  console.log('✓ Practice questions generated:', practiceQuestions.length);

  return {
    quiz,
    userResponses,
    followUpQuestions,
    studyGuide,
    practiceQuestions
  };
}

/**
 * Example 8: Validate and score different question types
 */
export function demonstrateQuestionValidation() {
  // Multiple choice validation
  const mcQuestion: QuizQuestion = {
    id: 'q1',
    type: 'multiple-choice',
    question: 'Which archetype represents the wise old man?',
    options: ['Shadow', 'Anima', 'Senex', 'Persona'],
    correctAnswer: 2,
    points: 10,
    order: 1
  };

  const mcAnswer = 2;
  const mcCorrect = mcAnswer === mcQuestion.correctAnswer;
  console.log('Multiple choice:', mcCorrect ? 'Correct!' : 'Incorrect');

  // Short answer validation
  const saQuestion: QuizQuestion = {
    id: 'q2',
    type: 'short-answer',
    question: 'What is individuation?',
    expectedKeywords: ['wholeness', 'integration', 'self', 'process'],
    points: 15,
    order: 2
  };

  const saAnswer = 'Individuation is the process of integrating unconscious parts to achieve wholeness and realize the Self.';
  const keywords = saQuestion.expectedKeywords || [];
  const saCorrect = keywords.filter(k => saAnswer.toLowerCase().includes(k)).length >= keywords.length * 0.75;
  console.log('Short answer:', saCorrect ? 'Good answer!' : 'Missing key concepts');

  // Essay scoring with rubric
  const essayQuestion: QuizQuestion = {
    id: 'q3',
    type: 'essay',
    question: 'Discuss the role of the shadow in personal development.',
    rubric: {
      required: ['projection', 'integration', 'unconscious'],
      optional: ['gold in shadow', 'collective shadow', 'examples'],
      depth: 150 // minimum words
    },
    points: 25,
    order: 3
  };

  const essayAnswer = `The shadow plays a crucial role in personal development...`; // abbreviated
  const wordCount = essayAnswer.split(/\s+/).length;
  const requiredFound = essayQuestion.rubric?.required.filter(r => 
    essayAnswer.toLowerCase().includes(r)
  ).length || 0;
  const score = (requiredFound / (essayQuestion.rubric?.required.length || 1)) * essayQuestion.points;
  console.log('Essay score:', score, 'points');
}

// Run examples when imported (for testing)
if (require.main === module) {
  (async () => {
    console.log('Running quiz generation examples...\n');
    
    // Run template demonstration
    demonstrateTemplateUsage();
    
    // Run validation demonstration
    console.log('\n--- Question Validation ---');
    demonstrateQuestionValidation();
    
    // Run async examples
    console.log('\n--- Generating Quizzes ---');
    await generateBeginnerQuiz();
    
    console.log('\n--- Complete Workflow ---');
    await completeQuizWorkflow('module-001', 'Collective Unconscious');
  })();
}