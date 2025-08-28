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
   Platform: ${(video as any).platform || 'YouTube'}
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

// New functions expected by the test file
export async function generateVideoContent(
  topic: string, 
  concepts: string[]
): Promise<{ videos: any[], metadata: any }> {
  if (!topic || topic.trim() === '') {
    throw new Error('Topic cannot be empty');
  }
  
  const youtubeService = new YouTubeService();
  const videoEnricher = new VideoEnricher();
  
  // Generate search query from topic and concepts
  const searchQuery = `${topic} ${concepts.join(' ')}`;
  
  // Search for videos
  const videos = await youtubeService.searchVideos(searchQuery, {
    maxResults: concepts.length > 0 ? Math.min(concepts.length * 2, 10) : 5,
    order: 'relevance',
    videoDuration: 'medium',
    safeSearch: 'strict',
  });
  
  // Enrich videos with metadata
  try {
    const enrichedVideos = await videoEnricher.enrichMultipleVideos(videos, {
      assessDifficulty: true,
      generateTimestamps: true,
      courseContext: {
        topic,
        concepts,
      },
    });
    
    // Ensure we have a valid array
    if (!Array.isArray(enrichedVideos)) {
      console.warn('enrichMultipleVideos returned non-array:', enrichedVideos);
      return {
        videos: [],
        metadata: { topic, concepts, totalVideos: 0, avgEducationalValue: 0, avgRelevanceScore: 0 }
      };
    }
    
    return {
      videos: enrichedVideos,
      metadata: {
        topic,
        concepts,
        totalVideos: enrichedVideos.length,
        avgEducationalValue: enrichedVideos.length > 0 ? enrichedVideos.reduce((sum, v) => sum + (v.metadata?.educationalValue || 0), 0) / enrichedVideos.length : 0,
        avgRelevanceScore: enrichedVideos.length > 0 ? enrichedVideos.reduce((sum, v) => sum + (v.metadata?.relevanceScore || 0), 0) / enrichedVideos.length : 0,
      }
    };
  } catch (error) {
    console.error('Error in generateVideoContent:', error);
    return {
      videos: [],
      metadata: { topic, concepts, totalVideos: 0, avgEducationalValue: 0, avgRelevanceScore: 0 }
    };
  }
}

export async function enrichVideoMetadata(videos: any[]): Promise<any[]> {
  if (videos.length === 0) {
    return [];
  }
  
  const videoEnricher = new VideoEnricher();
  
  // Convert video objects to YouTubeVideo format if needed
  const youtubeVideos = videos.map(video => ({
    videoId: video.id || video.videoId || `mock-${Date.now()}-${Math.random()}`,
    title: video.title || 'Untitled',
    description: video.description || '',
    channelId: video.channelId || 'mock-channel',
    channelTitle: video.channelTitle || 'Mock Channel',
    publishedAt: video.publishedAt || new Date().toISOString(),
    duration: video.duration || 'PT10M0S',
    viewCount: video.viewCount?.toString() || '100',
    likeCount: video.likeCount?.toString() || '10',
    thumbnails: video.thumbnails || {
      default: { url: 'https://example.com/thumb.jpg', width: 120, height: 90 },
      medium: { url: 'https://example.com/thumb-medium.jpg', width: 320, height: 180 },
      high: { url: 'https://example.com/thumb-high.jpg', width: 480, height: 360 },
    },
    tags: video.tags || ['test'],
    categoryId: video.categoryId || '27',
  }));
  
  // Enrich each video
  try {
    const enrichedVideos = await videoEnricher.enrichMultipleVideos(youtubeVideos, {
      assessDifficulty: true,
      generateTimestamps: false,
      extractLearningOutcomes: true,
    });
    
    // Ensure we return a valid array
    return Array.isArray(enrichedVideos) ? enrichedVideos : [];
  } catch (error) {
    console.error('Error in enrichVideoMetadata:', error);
    return [];
  }
}

export function createVideoPlaylist(videos: any[]): Record<string, any[]> {
  const playlist: Record<string, any[]> = {
    beginner: [],
    intermediate: [],
    advanced: [],
    general: [],
  };
  
  videos.forEach(video => {
    const difficulty = video.difficulty || video.metadata?.difficulty;
    
    if (difficulty && playlist[difficulty]) {
      playlist[difficulty].push(video);
    } else {
      playlist.general.push(video);
    }
  });
  
  // Sort each category by duration (shorter first for beginners, longer for advanced)
  Object.keys(playlist).forEach(key => {
    playlist[key].sort((a, b) => {
      const getDuration = (video: any) => {
        if (video.duration && typeof video.duration === 'number') {
          return video.duration;
        }
        if (video.duration && video.duration.minutes) {
          const hours = video.duration.hours || 0;
          return hours * 60 + video.duration.minutes;
        }
        return 600; // default 10 minutes
      };
      
      const aDuration = getDuration(a);
      const bDuration = getDuration(b);
      
      // For beginner content, prefer shorter videos
      if (key === 'beginner') {
        return aDuration - bDuration;
      }
      // For advanced content, longer videos first
      if (key === 'advanced') {
        return bDuration - aDuration;
      }
      // For intermediate and general, sort by relevance if available
      const aRelevance = a.metadata?.relevanceScore || 0.5;
      const bRelevance = b.metadata?.relevanceScore || 0.5;
      return bRelevance - aRelevance;
    });
  });
  
  return playlist;
}

// Export existing example functions for backward compatibility
export {
  exampleBasicSearch,
  exampleVideoEnrichment,
  exampleVideoGenerator,
  exampleProgressiveLearningPath,
  exampleChannelDiscovery,
};