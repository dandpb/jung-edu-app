import React from 'react';
import { VideoGenerator } from './src/services/llm/generators/video-generator';
import { MockLLMProvider } from './src/services/llm/provider';
import { ModuleGenerationOrchestrator } from './src/services/llm/orchestrator';

// Test function to verify video generation
async function testVideoGeneration() {
  console.log('🧪 Testing Video Generation Integration...\n');

  // Test 1: Direct video generation
  const provider = new MockLLMProvider();
  const videoGenerator = new VideoGenerator(provider);

  const videos = await videoGenerator.generateVideos(
    'Sombra',
    ['inconsciente', 'projeção', 'integração'],
    'estudantes de psicologia',
    3,
    'pt-BR'
  );

  console.log('✅ Direct generation - Videos:', videos.length);
  videos.forEach((v, i) => {
    console.log(`${i + 1}. ${v.title} - YouTube ID: ${v.youtubeId}`);
  });

  // Test 2: Module generation with videos
  const orchestrator = new ModuleGenerationOrchestrator(true);
  const result = await orchestrator.generateModule({
    topic: 'Sombra Junguiana',
    objectives: ['Compreender o conceito de sombra', 'Identificar projeções'],
    targetAudience: 'estudantes',
    duration: 60,
    difficulty: 'intermediate',
    includeVideos: true,
    videoCount: 3,
    useRealServices: true
  });

  console.log('\n✅ Module generation - Videos:', result.videos?.length || 0);
  result.videos?.forEach((v, i) => {
    console.log(`${i + 1}. ${v.title} - YouTube ID: ${v.youtubeId}`);
  });

  return { directVideos: videos, moduleVideos: result.videos };
}

// Export for testing
export { testVideoGeneration };