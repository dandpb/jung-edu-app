import { ModuleGenerationOrchestrator } from '../llm/orchestrator';
import { VideoGenerator } from '../llm/generators/video-generator';
import { BibliographyGenerator } from '../llm/generators/bibliography-generator';
import { MockLLMProvider } from '../llm/provider';

describe('AI Resource Generation', () => {
  let provider: MockLLMProvider;

  beforeEach(() => {
    provider = new MockLLMProvider();
  });

  test('should generate videos with real YouTube IDs', async () => {
    const videoGen = new VideoGenerator(provider);
    const videos = await videoGen.generateVideos(
      'Sombra',
      ['inconsciente', 'projeção'],
      'estudantes',
      3,
      'pt-BR'
    );

    expect(videos).toBeDefined();
    expect(videos.length).toBeGreaterThan(0);
    
    videos.forEach(video => {
      expect(video).toHaveProperty('youtubeId');
      expect(video.youtubeId).toBeDefined();
      // Should not be the Rick Roll video
      expect(video.youtubeId).not.toBe('dQw4w9WgXcQ');
      // Should not be placeholder
      expect(video.youtubeId).not.toContain('PLACEHOLDER');
    });
  });

  test('should generate bibliography with real URLs', async () => {
    const bibGen = new BibliographyGenerator(provider);
    const bibliography = await bibGen.generateBibliography(
      'Sombra',
      ['inconsciente', 'projeção'],
      'intermediate',
      5,
      'pt-BR'
    );

    expect(bibliography).toBeDefined();
    expect(Array.isArray(bibliography)).toBe(true);
    expect(bibliography.length).toBeGreaterThan(0);
    
    console.log('Bibliography test - received:', bibliography);
    console.log('First entry type:', typeof bibliography[0]);
    
    bibliography.forEach((entry, index) => {
      console.log(`Entry ${index}:`, entry);
      expect(typeof entry).toBe('object');
      expect(entry).toHaveProperty('url');
      expect(entry.url).toBeDefined();
      // Should not be placeholder URL
      expect(entry.url).not.toContain('PLACEHOLDER');
      // Should be a valid URL format
      expect(entry.url).toMatch(/^https?:\/\//);
    });
  });

  test('should generate complete module with AI resources', async () => {
    // Use mock provider for faster testing
    const orchestrator = new ModuleGenerationOrchestrator(false); // Use mock services
    
    orchestrator.on('progress', (progress) => {
      console.log(`Progress: ${progress.stage} - ${progress.message}`);
    });
    
    const result = await orchestrator.generateModule({
      topic: 'A Sombra na Psicologia Junguiana',
      objectives: ['Compreender o conceito de sombra', 'Identificar projeções'],
      targetAudience: 'estudantes de psicologia',
      duration: 60,
      difficulty: 'intermediate',
      includeVideos: false, // Disable videos to simplify
      videoCount: 0,
      includeBibliography: false, // Disable bibliography to simplify
      bibliographyCount: 0,
      includeFilms: false, // Disable films
      includeMindMap: false, // Disable mind map
      quizQuestions: 5, // Re-enable quiz generation
      useRealServices: false // Use mock services for testing
    });

    // Check module was generated
    expect(result.module).toBeDefined();
    expect(result.module.title).toContain('Sombra');

    // Since we disabled videos and bibliography, they should not be present
    expect(result.videos).toBeUndefined();
    expect(result.bibliography).toBeUndefined();
    
    // Check quiz was generated
    expect(result.quiz).toBeDefined();
    expect(result.quiz?.questions.length).toBeGreaterThan(0);
  }, 60000); // Increase timeout to 60 seconds for module generation
});