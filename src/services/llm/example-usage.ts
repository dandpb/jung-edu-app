import { ModuleGenerationOrchestrator, GenerationOptions } from './orchestrator';

/**
 * Example usage of the LLM service layer
 */
async function generateJungianModule() {
  // Create orchestrator instance
  const orchestrator = new ModuleGenerationOrchestrator();

  // Listen for progress updates
  orchestrator.on('progress', (progress) => {
    console.log(`[${progress.stage}] ${progress.progress}% - ${progress.message}`);
  });

  // Define generation options
  const options: GenerationOptions = {
    topic: 'The Shadow Archetype',
    objectives: [
      'Understand the concept of the Shadow in Jungian psychology',
      'Identify personal shadow aspects through self-reflection',
      'Learn techniques for shadow integration',
      'Explore the collective shadow in society',
    ],
    targetAudience: 'Psychology undergraduate students',
    duration: 60, // minutes
    difficulty: 'intermediate',
    includeVideos: true,
    includeBibliography: true,
    quizQuestions: 15,
    videoCount: 5,
    bibliographyCount: 12,
  };

  try {
    // Check if provider is available
    const isAvailable = await orchestrator.checkProviderAvailability();
    console.log('Provider available:', isAvailable);

    // Estimate token usage
    const estimatedTokens = await orchestrator.estimateTokenUsage(options);
    console.log('Estimated tokens:', estimatedTokens);

    // Generate the module
    console.log('Starting module generation...');
    const result = await orchestrator.generateModule(options);

    // Display results
    console.log('\n=== Generated Module ===');
    console.log('Title:', result.module.title);
    console.log('Duration:', result.module.estimatedTime, 'minutes');
    console.log('Sections:', result.content.sections.length);
    
    if (result.quiz) {
      console.log('\n=== Quiz ===');
      console.log('Questions:', result.quiz.questions.length);
      console.log('Passing score:', (result.quiz as any).passingScore || 70, '%');
    }

    if (result.videos) {
      console.log('\n=== Videos ===');
      console.log('Total videos:', result.videos.length);
      result.videos.forEach(video => {
        console.log(`- ${video.title} (${video.duration} min)`);
      });
    }

    if (result.bibliography) {
      console.log('\n=== Bibliography ===');
      console.log('Total sources:', result.bibliography.length);
      const byType = result.bibliography.reduce((acc, entry) => {
        acc[entry.type] = (acc[entry.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      console.log('By type:', byType);
    }

    // Save to file (example)
    const fs = await import('fs/promises');
    await fs.writeFile(
      'generated-module.json',
      JSON.stringify(result, null, 2)
    );
    console.log('\nModule saved to generated-module.json');

  } catch (error) {
    console.error('Generation failed:', error);
  }
}

/**
 * Example: Generate adaptive quiz questions based on performance
 */
async function generateAdaptiveQuiz() {
  try {
    const { QuizGenerator } = await import('./generators/quiz-generator');
    const { MockLLMProvider } = await import('./providers/mock');
    
    const provider = new MockLLMProvider();
    const quizGen = new QuizGenerator(provider);

    // Simulate previous responses
    const previousResponses = [
      { correct: true, difficulty: 'easy' },
      { correct: true, difficulty: 'easy' },
      { correct: false, difficulty: 'medium' },
      { correct: true, difficulty: 'medium' },
    ];

    const adaptiveQuestions = await quizGen.generateAdaptiveQuestions(
      'Individuation Process',
      previousResponses,
      3
    );

    console.log('Generated adaptive questions:', adaptiveQuestions);
  } catch (error) {
    console.error('Adaptive quiz generation failed:', error);
  }
}

/**
 * Example: Generate specific practice questions
 */
async function generatePracticeQuestions() {
  try {
    const { QuizGenerator } = await import('./generators/quiz-generator');
    const { MockLLMProvider } = await import('./providers/mock');
    
    const provider = new MockLLMProvider();
    const quizGen = new QuizGenerator(provider);

    const practiceQuestions = await quizGen.generatePracticeQuestions(
      'Psychological Types',
      'Introversion vs Extraversion',
      5
    );

    console.log('Practice questions generated:', practiceQuestions.length);
    practiceQuestions.forEach((q, i) => {
      console.log(`\nQ${i + 1}: ${q.question}`);
      if (q.options) {
        q.options.forEach((opt: any, j: number) => {
          console.log(`  ${String.fromCharCode(65 + j)}. ${opt.text}`);
        });
      }
    });
  } catch (error) {
    console.error('Practice questions generation failed:', error);
  }
}

// Export functions for testing
export {
  generateJungianModule,
  generateAdaptiveQuiz,
  generatePracticeQuestions
};

// Run examples
if (require.main === module) {
  console.log('Running LLM Service Examples...\n');
  
  generateJungianModule()
    .then(() => generateAdaptiveQuiz())
    .then(() => generatePracticeQuestions())
    .catch(console.error);
}