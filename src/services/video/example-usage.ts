import { YouTubeService } from './youtubeService';
import { VideoEnricher } from './videoEnricher';
import { VideoGenerator } from '../llm/generators/video-generator';
import { OpenAIProvider } from '../llm/provider';

// Example 1: Basic YouTube Search
async function exampleBasicSearch() {
  console.log('=== Example 1: Basic YouTube Search ===');
  
  const youtubeService = new YouTubeService();
  
  // Search for Jungian psychology videos
  const videos = await youtubeService.searchVideos('Carl Jung Shadow Self', {
    maxResults: 5,
    order: 'relevance',
    videoDuration: 'medium', // 4-20 minutes
    safeSearch: 'strict',
  });
  
  videos.forEach(video => {
    console.log(`
Title: ${video.title}
Channel: ${video.channelTitle}
Duration: ${video.duration}
Views: ${parseInt(video.viewCount).toLocaleString()}
Published: ${new Date(video.publishedAt).toLocaleDateString()}
`);
  });
}

// Example 2: Video Enrichment
async function exampleVideoEnrichment() {
  console.log('\n=== Example 2: Video Enrichment ===');
  
  const youtubeService = new YouTubeService();
  const videoEnricher = new VideoEnricher();
  
  // Search for a video
  const videos = await youtubeService.searchVideos('Jung Collective Unconscious', {
    maxResults: 3,
  });
  
  // Enrich the first video
  if (videos.length > 0) {
    const enrichedVideo = await videoEnricher.enrichVideo(videos[0], {
      assessDifficulty: true,
      generateTimestamps: true,
      courseContext: {
        topic: 'Collective Unconscious',
        concepts: ['archetypes', 'collective unconscious', 'universal patterns'],
      },
    });
    
    console.log(`
Enhanced Video:
Title: ${enrichedVideo.title}
Difficulty: ${enrichedVideo.metadata.difficulty}
Educational Value: ${(enrichedVideo.metadata.educationalValue * 100).toFixed(0)}%
Relevance Score: ${(enrichedVideo.metadata.relevanceScore * 100).toFixed(0)}%

Learning Outcomes:
${enrichedVideo.metadata.learningOutcomes?.map(outcome => `- ${outcome}`).join('\n')}

Key Timestamps:
${enrichedVideo.metadata.keyTimestamps?.map(ts => 
  `${ts.time}s - ${ts.topic}: ${ts.description}`
).join('\n')}
`);
  }
}

// Example 3: Full Video Generator with LLM
async function exampleVideoGenerator() {
  console.log('\n=== Example 3: Full Video Generator ===');
  
  // Initialize with OpenAI provider (or any LLM provider)
  const llmProvider = new OpenAIProvider(process.env.OPENAI_API_KEY || 'your-api-key');
  
  const videoGenerator = new VideoGenerator(llmProvider);
  
  // Generate video resources for a module
  const videos = await videoGenerator.generateVideos(
    'The Shadow and Personal Development',
    ['shadow', 'projection', 'integration', 'self-awareness'],
    'Psychology students and self-help enthusiasts',
    5
  );
  
  console.log(`\nGenerated ${videos.length} video resources:`);
  videos.forEach((video, index) => {
    console.log(`
${index + 1}. ${video.title}
   Platform: ${video.platform || 'YouTube'}
   Duration: ${video.duration} minutes
   Description: ${video.description}
   URL: ${video.url}
`);
  });
}

// Example 4: Progressive Learning Path
async function exampleProgressiveLearningPath() {
  console.log('\n=== Example 4: Progressive Learning Path ===');
  
  const llmProvider = new OpenAIProvider(process.env.OPENAI_API_KEY || 'your-api-key');
  
  const videoGenerator = new VideoGenerator(llmProvider);
  
  const learningPath = await videoGenerator.generateProgressiveLearningPath(
    'Individuation Process',
    ['ego', 'self', 'persona', 'shadow', 'anima/animus'],
    'Adult learners interested in personal growth'
  );
  
  console.log('Beginner Level:');
  learningPath.beginner.forEach(video => {
    console.log(`- ${video.title} (${video.duration} min)`);
  });
  
  console.log('\nIntermediate Level:');
  learningPath.intermediate.forEach(video => {
    console.log(`- ${video.title} (${video.duration} min)`);
  });
  
  console.log('\nAdvanced Level:');
  learningPath.advanced.forEach(video => {
    console.log(`- ${video.title} (${video.duration} min)`);
  });
}

// Example 5: Educational Channel Discovery
async function exampleChannelDiscovery() {
  console.log('\n=== Example 5: Educational Channel Discovery ===');
  
  const youtubeService = new YouTubeService();
  
  const channels = await youtubeService.searchEducationalChannels(
    'Jungian Psychology',
    5
  );
  
  console.log('Top Educational Channels:');
  channels.forEach(channel => {
    console.log(`
Channel: ${channel.title}
Subscribers: ${parseInt(channel.subscriberCount).toLocaleString()}
Videos: ${parseInt(channel.videoCount).toLocaleString()}
Total Views: ${parseInt(channel.viewCount).toLocaleString()}
`);
  });
}

// Run examples (uncomment to test)
async function runExamples() {
  try {
    await exampleBasicSearch();
    await exampleVideoEnrichment();
    // await exampleVideoGenerator(); // Requires API key
    // await exampleProgressiveLearningPath(); // Requires API key
    await exampleChannelDiscovery();
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Uncomment to run examples
// runExamples();

export {
  exampleBasicSearch,
  exampleVideoEnrichment,
  exampleVideoGenerator,
  exampleProgressiveLearningPath,
  exampleChannelDiscovery,
};