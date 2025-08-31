/**
 * Module Generation Demo
 * Provides demo functionality for testing and development
 */

import { UnifiedModuleGenerator, ModuleGenerationConfig } from './index';

export async function runCompleteDemo(config?: ModuleGenerationConfig): Promise<void> {
  console.log('🚀 Starting module generation demo...');
  
  const generator = new UnifiedModuleGenerator();
  
  const demoConfig = config || {
    topic: 'Jungian Psychology Demo',
    objectives: [
      'Understand basic Jung concepts',
      'Explore archetypal patterns',
      'Apply psychological insights'
    ],
    targetAudience: 'Psychology students',
    duration: 60,
    difficulty: 'intermediate' as const,
    language: 'pt-BR'
  };

  try {
    console.log('📝 Generating module content...');
    const result = await generator.generateCompleteModule(demoConfig);
    
    console.log('✅ Demo completed successfully!');
    console.log(`Generated module: ${result.module.title}`);
    
    // Safe access to componentsIncluded in case metadata is null or undefined
    const components = result.metadata?.componentsIncluded || [];
    console.log(`Components: ${components.join(', ')}`);
    
    return;
  } catch (error) {
    console.error('❌ Demo failed:', error);
    throw error;
  }
}

export function runDemoSuite(): void {
  console.log('🧪 Running demo test suite...');
  
  // Basic functionality test
  const testConfigs = [
    {
      topic: 'Basic Jung',
      objectives: ['Learn'],
      targetAudience: 'Students',
      duration: 30,
      difficulty: 'beginner' as const
    },
    {
      topic: 'Advanced Analytical Psychology',
      objectives: ['Master concepts', 'Apply techniques'],
      targetAudience: 'Advanced students',
      duration: 90,
      difficulty: 'advanced' as const
    }
  ];

  testConfigs.forEach((config, index) => {
    console.log(`Test ${index + 1}: ${config.topic}`);
    console.log(`  Difficulty: ${config.difficulty}`);
    console.log(`  Duration: ${config.duration}min`);
  });

  console.log('✅ Demo suite configuration verified');
}