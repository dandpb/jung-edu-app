import { ModuleGenerationOrchestrator } from './services/llm/orchestrator';
import { VideoGenerator } from './services/llm/generators/video-generator';
import { BibliographyGenerator } from './services/llm/generators/bibliography-generator';
import { MockLLMProvider } from './services/llm/provider';
import { Video } from './types';

export async function testAIResourceGeneration() {
  console.log('🧪 Testing AI Resource Generation...\n');

  const provider = new MockLLMProvider();

  // Test 1: Direct Video Generation
  console.log('📺 Test 1: Direct Video Generation');
  const videoGen = new VideoGenerator(provider);
  const videos = await videoGen.generateVideos(
    'Sombra',
    ['inconsciente', 'projeção'],
    'estudantes',
    3,
    'pt-BR'
  );
  
  console.log(`Generated ${videos.length} videos:`);
  videos.forEach((v: Video, i) => {
    console.log(`  ${i+1}. ${v.title} (YouTube ID: ${v.youtubeId || 'NO ID'})`);
  });

  // Test 2: Direct Bibliography Generation
  console.log('\n📚 Test 2: Direct Bibliography Generation');
  const bibGen = new BibliographyGenerator(provider);
  const bibliography = await bibGen.generateBibliography(
    'Sombra',
    ['inconsciente', 'projeção'],
    'intermediate',
    5,
    'pt-BR'
  );
  
  console.log(`Generated ${bibliography.length} bibliography entries:`);
  bibliography.forEach((b, i) => {
    console.log(`  ${i+1}. ${b.title} (${b.year}) - ${b.url || 'No URL'}`);
  });

  // Test 3: Full Module Generation
  console.log('\n🎯 Test 3: Full Module Generation');
  const orchestrator = new ModuleGenerationOrchestrator(true);
  const result = await orchestrator.generateModule({
    topic: 'A Sombra na Psicologia Junguiana',
    objectives: ['Compreender o conceito de sombra', 'Identificar projeções'],
    targetAudience: 'estudantes de psicologia',
    duration: 60,
    difficulty: 'intermediate',
    includeVideos: true,
    videoCount: 3,
    includeBibliography: true,
    bibliographyCount: 5,
    quizQuestions: 5,
    useRealServices: true
  });

  console.log('\nModule Generation Results:');
  console.log(`- Title: ${result.module.title}`);
  console.log(`- Videos: ${result.videos?.length || 0}`);
  console.log(`- Bibliography: ${result.bibliography?.length || 0}`);
  console.log(`- Quiz Questions: ${result.quiz?.questions?.length || 0}`);

  if (result.videos && result.videos.length > 0) {
    console.log('\n📺 Generated Videos:');
    result.videos.forEach((v, i) => {
      console.log(`  ${i+1}. ${v.title}`);
      console.log(`     YouTube ID: ${(v as any).youtubeId || 'NO ID'}`);
      console.log(`     Has placeholder: ${(v as any).youtubeId === 'dQw4w9WgXcQ' ? 'YES ⚠️' : 'NO ✅'}`);
    });
  }

  if (result.bibliography && result.bibliography.length > 0) {
    console.log('\n📚 Generated Bibliography:');
    result.bibliography.forEach((b, i) => {
      console.log(`  ${i+1}. ${b.title} (${b.year})`);
      console.log(`     URL: ${b.url || 'No URL ⚠️'}`);
    });
  }

  return result;
}

// Run if called directly
if (require.main === module) {
  testAIResourceGeneration()
    .then(() => console.log('\n✅ Test completed!'))
    .catch(err => console.error('\n❌ Test failed:', err));
}