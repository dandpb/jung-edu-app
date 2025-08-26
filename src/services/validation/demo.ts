/**
 * Validation System Demonstration
 * Shows how to use the comprehensive validation system
 */

import { validationService } from './index';
import { EducationalModule, DifficultyLevel, ModuleStatus, PublicationType } from '../../schemas/module.schema';

// Demo module for testing
const createDemoModule = (): EducationalModule => {
  const now = new Date().toISOString();
  
  return {
    id: 'demo-module-1',
    title: 'Introduction to Jungian Psychology',
    description: 'A comprehensive introduction to Carl Jung\'s analytical psychology',
    content: {
      introduction: 'Carl Jung was a Swiss psychiatrist and psychoanalyst who founded analytical psychology.',
      sections: [
        {
          id: 'section-1',
          title: 'Basic Concepts',
          content: 'Jung introduced several key concepts including the collective unconscious and archetypes.',
          order: 0,
          keyTerms: [
            { term: 'collective unconscious', definition: 'The part of the unconscious mind shared by humanity' },
            { term: 'archetypes', definition: 'Universal patterns or images from the collective unconscious' },
            { term: 'individuation', definition: 'The process of psychological integration and self-realization' }
          ],
          images: [
            {
              id: 'image-1',
              url: 'https://example.com/jung-concepts.jpg',
              alt: 'Diagram showing Jung\'s key psychological concepts',
              caption: 'Overview of Jungian psychology concepts'
            }
          ],
          interactiveElements: [],
          estimatedTime: 15
        }
      ],
      summary: 'This module introduced the fundamental concepts of Jungian analytical psychology.',
      keyTakeaways: [
        'Jung\'s approach differs from Freudian psychoanalysis',
        'The collective unconscious contains universal archetypes',
        'Individuation is the process of psychological development'
      ]
    },
    videos: [
      {
        id: 'video-1',
        title: 'Introduction to Jung',
        description: 'Overview of Jung\'s life and work',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        duration: { hours: 0, minutes: 10, seconds: 0 },
        transcript: 'Carl Jung was born in Switzerland...'
      }
    ],
    quiz: {
      id: 'quiz-1',
      title: 'Jung Basics Quiz',
      description: 'Test your understanding of basic Jungian concepts',
      questions: [
        {
          id: 'q1',
          question: 'What is the collective unconscious according to Jung?',
          type: 'multiple-choice',
          points: 10,
          options: [
            { id: 0, text: 'Personal memories and experiences', isCorrect: false },
            { id: 1, text: 'Universal patterns shared by all humanity', isCorrect: true },
            { id: 2, text: 'Conscious thoughts and feelings', isCorrect: false },
            { id: 3, text: 'Dreams and fantasies', isCorrect: false }
          ],
          correctAnswers: [1],
          allowMultiple: false,
          explanation: 'The collective unconscious contains universal patterns and archetypes shared by all humans.',
          difficulty: DifficultyLevel.BEGINNER,
          tags: ['collective unconscious', 'archetypes']
        }
      ],
      passingScore: 70,
      timeLimit: 15,
      shuffleQuestions: false,
      showFeedback: true,
      allowRetries: true,
      maxRetries: 3
    },
    bibliography: [
      {
        id: 'ref-1',
        title: 'The Collected Works of C.G. Jung',
        authors: ['Carl Gustav Jung'],
        year: 1979,
        publisher: 'Princeton University Press',
        type: PublicationType.BOOK,
        url: 'https://example.com/jung-collected-works'
      }
    ],
    filmReferences: [],
    tags: ['psychology', 'jung', 'analytical'],
    difficultyLevel: DifficultyLevel.BEGINNER,
    timeEstimate: {
      hours: 1,
      minutes: 0,
      description: 'Approximately 1 hour'
    },
    metadata: {
      createdAt: now,
      updatedAt: now,
      version: '1.0.0',
      author: {
        id: 'demo-author',
        name: 'Demo Author',
        email: 'demo@example.com',
        role: 'Educator'
      },
      status: ModuleStatus.PUBLISHED,
      language: 'en',
      analytics: {
        views: 100,
        completions: 80,
        averageTime: 55,
        averageScore: 85,
        feedback: []
      }
    },
    prerequisites: [],
    learningObjectives: [
      'Understand basic Jungian concepts',
      'Explain the collective unconscious',
      'Identify archetypal patterns'
    ],
    icon: 'psychology'
  };
};

/**
 * Demonstrates the complete validation workflow
 */
export async function demonstrateValidation(): Promise<void> {
  console.log('🚀 jaqEdu Validation System Demonstration');
  console.log('==========================================\n');

  // Create demo modules
  const modules = [
    createDemoModule(),
    {
      ...createDemoModule(),
      id: 'demo-module-2',
      title: 'Advanced Jungian Analysis',
      difficultyLevel: DifficultyLevel.ADVANCED,
      prerequisites: ['demo-module-1']
    }
  ];

  console.log(`📚 Created ${modules.length} demo modules for validation\n`);

  try {
    // 1. Quick validation for development
    console.log('1️⃣ Running Quick Validation...');
    console.log('--------------------------------');
    
    const quickResult = await validationService.validateQuick(modules);
    console.log(`Score: ${quickResult.score}/100 ${quickResult.passed ? '✅' : '❌'}`);
    
    if (quickResult.issues.length > 0) {
      console.log('Issues found:');
      quickResult.issues.forEach(issue => console.log(`  ⚠️ ${issue}`));
    }
    
    if (quickResult.recommendations.length > 0) {
      console.log('Recommendations:');
      quickResult.recommendations.forEach(rec => console.log(`  💡 ${rec}`));
    }
    console.log();

    // 2. Comprehensive validation
    console.log('2️⃣ Running Comprehensive Validation...');
    console.log('--------------------------------------');
    
    const fullResult = await validationService.validateComplete(modules);
    
    console.log(`Overall Score: ${fullResult.overallScore}/100 (Grade: ${fullResult.grade})`);
    console.log(`Status: ${fullResult.status.replace(/_/g, ' ').toUpperCase()}`);
    console.log(`Validation: ${fullResult.passed ? 'PASSED' : 'FAILED'}\n`);

    // 3. Component scores
    console.log('📊 Component Scores:');
    console.log(`System Quality: ${fullResult.system.score}/100 ${fullResult.system.passed ? '✅' : '❌'}`);
    console.log(`Integration: ${fullResult.integration.score}/100 ${fullResult.integration.passed ? '✅' : '❌'}`);
    console.log(`End-to-End: ${fullResult.endToEnd.score}/100 ${fullResult.endToEnd.passed ? '✅' : '❌'}\n`);

    // 4. Key metrics
    console.log('📈 Key Metrics:');
    console.log(`Performance: ${fullResult.metrics.performance}/100`);
    console.log(`Security: ${fullResult.metrics.security}/100`);
    console.log(`Accessibility: ${fullResult.metrics.accessibility}/100`);
    console.log(`Reliability: ${fullResult.metrics.reliability}/100`);
    console.log(`User Experience: ${fullResult.metrics.userExperience}/100\n`);

    // 5. Summary insights
    if (fullResult.summary.strengths.length > 0) {
      console.log('✅ Strengths:');
      fullResult.summary.strengths.forEach(strength => console.log(`  • ${strength}`));
      console.log();
    }

    if (fullResult.summary.weaknesses.length > 0) {
      console.log('⚠️ Areas for Improvement:');
      fullResult.summary.weaknesses.forEach(weakness => console.log(`  • ${weakness}`));
      console.log();
    }

    if (fullResult.summary.criticalIssues.length > 0) {
      console.log('🚨 Critical Issues:');
      fullResult.summary.criticalIssues.forEach(issue => console.log(`  • ${issue}`));
      console.log();
    }

    // 6. Top recommendations
    if (fullResult.summary.recommendations.length > 0) {
      console.log('💡 Top Recommendations:');
      fullResult.summary.recommendations.slice(0, 3).forEach((rec, i) => 
        console.log(`  ${i + 1}. ${rec}`)
      );
      console.log();
    }

    // 7. Next steps
    console.log('🎯 Next Steps:');
    fullResult.summary.nextSteps.forEach(step => console.log(`  • ${step}`));
    console.log();

    // 8. Generate reports
    console.log('3️⃣ Generating Reports...');
    console.log('------------------------');
    
    const summaryReport = await validationService.generateReport(fullResult, 'summary');
    console.log('Summary report generated ✅');
    
    const markdownReport = await validationService.generateReport(fullResult, 'markdown');
    console.log('Markdown report generated ✅');
    console.log();

    // 9. Specific aspect validation
    console.log('4️⃣ Testing Specific Aspect Validation...');
    console.log('----------------------------------------');
    
    const performanceResult = await validationService.validateAspect(modules, 'performance');
    console.log(`Performance validation completed - Score: ${performanceResult.overallScore}/100`);
    
    const securityResult = await validationService.validateAspect(modules, 'security');
    console.log(`Security validation completed - Score: ${securityResult.overallScore}/100`);
    console.log();

    console.log('✅ Validation demonstration completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`- Total modules validated: ${fullResult.moduleCount}`);
    console.log(`- Overall score: ${fullResult.overallScore}/100`);
    console.log(`- System status: ${fullResult.status}`);
    console.log(`- Ready for: ${fullResult.status === 'production_ready' ? 'Production' : 'Further development'}`);

  } catch (error) {
    console.error('❌ Validation demonstration failed:', error);
  }
}

/**
 * Example of how to use specific validators directly
 */
export async function demonstrateSpecificValidators(): Promise<void> {
  console.log('\n🔧 Direct Validator Usage Examples');
  console.log('==================================\n');

  const { systemValidator, integrationValidator, endToEndValidator } = await import('./index');
  const modules = [createDemoModule()];

  try {
    // System validation only
    console.log('🔍 System Validation:');
    const systemResult = await systemValidator.validateSystem(modules);
    console.log(`Result: ${systemResult.overall.score}/100 ${systemResult.isValid ? '✅' : '❌'}`);
    console.log(`Modules analyzed: ${systemResult.modules.length}`);
    console.log(`Recommendations: ${systemResult.recommendations.length}`);
    console.log();

    // Integration validation only
    console.log('🔗 Integration Validation:');
    const integrationResult = await integrationValidator.validateIntegration(modules);
    console.log(`Result: ${integrationResult.overall.score}/100 ${integrationResult.overall.passed ? '✅' : '❌'}`);
    console.log(`Tests run: ${integrationResult.overall.totalTests}`);
    console.log(`Tests passed: ${integrationResult.overall.passedTests}`);
    console.log();

    // End-to-end validation only
    console.log('🎯 End-to-End Validation:');
    const e2eResult = await endToEndValidator.validateEndToEnd(modules);
    console.log(`Result: ${e2eResult.overall.score}/100 ${e2eResult.overall.passed ? '✅' : '❌'}`);
    console.log(`Workflows tested: ${e2eResult.workflows.length}`);
    console.log(`Critical issues: ${e2eResult.criticalIssues.length}`);
    console.log();

    console.log('✅ Direct validator demonstrations completed!');

  } catch (error) {
    console.error('❌ Direct validator demonstration failed:', error);
  }
}

// Export demo functions for use in other files
export { createDemoModule };

// If run directly, execute demonstration
if (require.main === module) {
  demonstrateValidation()
    .then(() => demonstrateSpecificValidators())
    .catch(console.error);
}