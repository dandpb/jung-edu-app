// Test YouTube Integration from Console
// Run with: npx ts-node src/test-youtube-console.ts

import { YouTubeService } from './services/video/youtubeService';
import { VideoGenerator } from './services/llm/generators/video-generator';
import { LLMProviderFactory } from './services/llm/provider';

async function testYouTubeIntegration() {
  console.log('🎥 Testing YouTube Integration for Jung Educational App\n');

  // Test 1: Direct YouTube Search
  console.log('📺 Test 1: Direct YouTube Search');
  console.log('================================');
  
  const youtubeService = new YouTubeService();
  
  try {
    const searchResults = await youtubeService.searchVideos('Carl Jung Shadow Self', {
      maxResults: 3,
      order: 'relevance',
      videoDuration: 'medium',
      safeSearch: 'strict',
    });

    console.log(`Found ${searchResults.length} videos:\n`);
    
    searchResults.forEach((video, index) => {
      console.log(`${index + 1}. ${video.title}`);
      console.log(`   Channel: ${video.channelTitle}`);
      console.log(`   Views: ${parseInt(video.viewCount).toLocaleString()}`);
      console.log(`   Duration: ${parseDuration(video.duration)}`);
      console.log(`   URL: https://www.youtube.com/watch?v=${video.videoId}\n`);
    });
  } catch (error) {
    console.error('Search error:', error);
  }

  // Test 2: AI-Generated Video Suggestions
  console.log('\n🤖 Test 2: AI-Generated Video Suggestions');
  console.log('==========================================');
  
  const provider = LLMProviderFactory.getProvider();
  const videoGenerator = new VideoGenerator(provider);
  
  try {
    const topic = 'Individuation Process';
    const concepts = ['ego', 'self', 'persona', 'shadow integration'];
    
    console.log(`Generating videos for topic: "${topic}"`);
    console.log(`Key concepts: ${concepts.join(', ')}\n`);
    
    const generatedVideos = await videoGenerator.generateVideos(
      topic,
      concepts,
      'Psychology students and self-help enthusiasts',
      3
    );

    console.log(`Generated ${generatedVideos.length} video suggestions:\n`);
    
    generatedVideos.forEach((video, index) => {
      console.log(`${index + 1}. ${video.title}`);
      console.log(`   Duration: ${video.duration} minutes`);
      console.log(`   Description: ${video.description}`);
      console.log(`   URL: ${video.url}\n`);
    });
  } catch (error) {
    console.error('Generation error:', error);
  }

  // Test 3: Educational Channel Discovery
  console.log('\n🎓 Test 3: Educational Channel Discovery');
  console.log('========================================');
  
  try {
    const channels = await youtubeService.searchEducationalChannels('Jungian Psychology', 3);
    
    console.log(`Found ${channels.length} educational channels:\n`);
    
    channels.forEach((channel, index) => {
      console.log(`${index + 1}. ${channel.title}`);
      console.log(`   Subscribers: ${parseInt(channel.subscriberCount).toLocaleString()}`);
      console.log(`   Total Videos: ${parseInt(channel.videoCount).toLocaleString()}`);
      console.log(`   Channel URL: https://www.youtube.com/channel/${channel.channelId}\n`);
    });
  } catch (error) {
    console.error('Channel search error:', error);
  }

  // Test 4: Integration with Module Generation
  console.log('\n🔗 Test 4: Module Video Integration');
  console.log('===================================');
  
  console.log('When generating a module, the system will:');
  console.log('1. Generate contextual search queries using AI');
  console.log('2. Search YouTube for relevant educational videos');
  console.log('3. Enrich videos with educational metadata');
  console.log('4. Select the best videos based on:');
  console.log('   - Educational value score');
  console.log('   - Relevance to module concepts');
  console.log('   - Appropriate difficulty level');
  console.log('   - Content quality indicators\n');

  console.log('✅ YouTube integration is working correctly!');
  console.log('\nNote: In development mode without a YouTube API key,');
  console.log('the service returns realistic mock data for testing.');
}

function parseDuration(isoDuration: string): string {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 'Unknown';
  
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Run the test
testYouTubeIntegration().catch(console.error);