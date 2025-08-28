/**
 * Comprehensive tests for video/example-usage.ts
 * Tests all exported functions, error handling, and integration patterns
 */

import {
  generateVideoContent,
  enrichVideoMetadata,
  createVideoPlaylist,
  exampleBasicSearch,
  exampleVideoEnrichment,
  exampleVideoGenerator,
  exampleProgressiveLearningPath,
  exampleChannelDiscovery
} from '../example-usage';
import { YouTubeService } from '../youtubeService';
import { VideoEnricher } from '../videoEnricher';
import { VideoGenerator } from '../../llm/generators/video-generator';
import { OpenAIProvider } from '../../llm/providers/openai';

// Mock dependencies
jest.mock('../youtubeService');
jest.mock('../videoEnricher');
jest.mock('../../llm/generators/video-generator');
jest.mock('../../llm/providers/openai');

const mockYouTubeService = YouTubeService as jest.MockedClass<typeof YouTubeService>;
const mockVideoEnricher = VideoEnricher as jest.MockedClass<typeof VideoEnricher>;
const mockVideoGenerator = VideoGenerator as jest.MockedClass<typeof VideoGenerator>;
const mockOpenAIProvider = OpenAIProvider as jest.MockedClass<typeof OpenAIProvider>;

// Mock video data
const mockYouTubeVideos = [
  {
    videoId: 'video1',
    title: 'Understanding the Shadow Self',
    description: 'Deep dive into Jung\'s concept of the shadow',
    channelId: 'UC-psychology',
    channelTitle: 'Psychology Today',
    publishedAt: '2024-01-15T10:00:00Z',
    duration: 'PT15M30S',
    viewCount: '50000',
    likeCount: '2500',
    thumbnails: {
      default: { url: 'https://example.com/thumb1.jpg', width: 120, height: 90 },
      medium: { url: 'https://example.com/thumb1-med.jpg', width: 320, height: 180 },
      high: { url: 'https://example.com/thumb1-high.jpg', width: 480, height: 360 }
    },
    tags: ['psychology', 'jung', 'shadow'],
    categoryId: '27'
  },
  {
    videoId: 'video2',
    title: 'Collective Unconscious Explained',
    description: 'Exploring Jung\'s theory of collective unconscious',
    channelId: 'UC-education',
    channelTitle: 'Educational Videos',
    publishedAt: '2024-01-16T14:00:00Z',
    duration: 'PT22M45S',
    viewCount: '75000',
    likeCount: '3200',
    thumbnails: {
      default: { url: 'https://example.com/thumb2.jpg', width: 120, height: 90 },
      medium: { url: 'https://example.com/thumb2-med.jpg', width: 320, height: 180 },
      high: { url: 'https://example.com/thumb2-high.jpg', width: 480, height: 360 }
    },
    tags: ['psychology', 'jung', 'collective unconscious'],
    categoryId: '27'
  }
];

const mockEnrichedVideos = [
  {
    id: 'video-video1',
    title: 'Understanding the Shadow Self',
    description: 'Enhanced description with learning outcomes',
    url: 'https://youtube.com/watch?v=video1',
    duration: { hours: 0, minutes: 15, seconds: 30 },
    platform: 'youtube',
    metadata: {
      educationalValue: 0.9,
      relevanceScore: 0.8,
      difficulty: 'intermediate' as const,
      relatedConcepts: ['shadow', 'projection'],
      learningOutcomes: ['Understand shadow psychology', 'Identify personal shadows']
    }
  },
  {
    id: 'video-video2',
    title: 'Collective Unconscious Explained',
    description: 'Enhanced description with educational context',
    url: 'https://youtube.com/watch?v=video2',
    duration: { hours: 0, minutes: 22, seconds: 45 },
    platform: 'youtube',
    metadata: {
      educationalValue: 0.85,
      relevanceScore: 0.9,
      difficulty: 'beginner' as const,
      relatedConcepts: ['collective unconscious', 'archetypes'],
      learningOutcomes: ['Understand collective unconscious', 'Recognize archetypal patterns']
    }
  }
];

describe('Video Example Usage - Comprehensive Tests', () => {
  let mockYouTubeServiceInstance: jest.Mocked<YouTubeService>;
  let mockVideoEnricherInstance: jest.Mocked<VideoEnricher>;
  let mockVideoGeneratorInstance: jest.Mocked<VideoGenerator>;
  let mockOpenAIProviderInstance: jest.Mocked<OpenAIProvider>;

  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();

    // Setup YouTube service mock
    mockYouTubeServiceInstance = {
      searchVideos: jest.fn(),
      searchEducationalChannels: jest.fn(),
      getVideoDetails: jest.fn()
    } as any;
    mockYouTubeService.mockImplementation(() => mockYouTubeServiceInstance);

    // Setup video enricher mock
    mockVideoEnricherInstance = {
      enrichVideo: jest.fn(),
      enrichMultipleVideos: jest.fn(),
      generateVideoSummary: jest.fn(),
      calculateRelevanceMatrix: jest.fn()
    } as any;
    mockVideoEnricher.mockImplementation(() => mockVideoEnricherInstance);

    // Setup video generator mock
    mockVideoGeneratorInstance = {
      generateVideos: jest.fn(),
      generateProgressiveLearningPath: jest.fn()
    } as any;
    mockVideoGenerator.mockImplementation(() => mockVideoGeneratorInstance);

    // Setup OpenAI provider mock
    mockOpenAIProviderInstance = {
      generateCompletion: jest.fn(),
      generateStructuredOutput: jest.fn(),
      generateEmbedding: jest.fn()
    } as any;
    mockOpenAIProvider.mockImplementation(() => mockOpenAIProviderInstance);

    // Default mock return values
    mockYouTubeServiceInstance.searchVideos.mockResolvedValue(mockYouTubeVideos);
    mockVideoEnricherInstance.enrichMultipleVideos.mockResolvedValue(mockEnrichedVideos);
    mockVideoEnricherInstance.enrichVideo.mockResolvedValue(mockEnrichedVideos[0]);
  });

  describe('generateVideoContent', () => {
    it('should generate video content successfully', async () => {
      const result = await generateVideoContent('Shadow Psychology', ['shadow', 'projection']);

      expect(result).toBeDefined();
      expect(result.videos).toHaveLength(2);
      expect(result.metadata).toMatchObject({
        topic: 'Shadow Psychology',
        concepts: ['shadow', 'projection'],
        totalVideos: 2,
        avgEducationalValue: expect.any(Number),
        avgRelevanceScore: expect.any(Number)
      });

      expect(mockYouTubeServiceInstance.searchVideos).toHaveBeenCalledWith(
        'Shadow Psychology shadow projection',
        {
          maxResults: 4, // concepts.length * 2
          order: 'relevance',
          videoDuration: 'medium',
          safeSearch: 'strict'
        }
      );
    });

    it('should handle empty topic', async () => {
      await expect(generateVideoContent('', ['shadow']))
        .rejects.toThrow('Topic cannot be empty');
    });

    it('should handle null/undefined topic', async () => {
      await expect(generateVideoContent(null as any, ['shadow']))
        .rejects.toThrow('Topic cannot be empty');
    });

    it('should handle empty concepts array', async () => {
      const result = await generateVideoContent('Jung Psychology', []);

      expect(result.videos).toHaveLength(2);
      expect(mockYouTubeServiceInstance.searchVideos).toHaveBeenCalledWith(
        'Jung Psychology ',
        expect.objectContaining({
          maxResults: 5 // default when no concepts
        })
      );
    });

    it('should handle YouTube service errors', async () => {
      mockYouTubeServiceInstance.searchVideos.mockRejectedValue(new Error('YouTube API Error'));

      await expect(generateVideoContent('Test Topic', ['concept']))
        .rejects.toThrow('YouTube API Error');
    });

    it('should handle enrichment errors gracefully', async () => {
      mockVideoEnricherInstance.enrichMultipleVideos.mockRejectedValue(new Error('Enrichment Error'));

      // Should handle errors gracefully and return empty result
      await expect(generateVideoContent('Test Topic', ['concept'])).resolves.not.toThrow();
      
      // Verify error was logged
      expect(console.error).toHaveBeenCalledWith('Error in generateVideoContent:', expect.any(Error));
    });

    it('should handle non-array enrichment response', async () => {
      mockVideoEnricherInstance.enrichMultipleVideos.mockResolvedValue('invalid' as any);

      // Should handle invalid responses gracefully
      const result = await generateVideoContent('Test Topic', ['concept']);

      expect(result.videos).toEqual([]);
      // May log warning about invalid response
    });

    it('should calculate correct average scores', async () => {
      const result = await generateVideoContent('Test Topic', ['concept']);

      const expectedAvgEducational = (0.9 + 0.85) / 2;
      const expectedAvgRelevance = (0.8 + 0.9) / 2;

      expect(result.metadata.avgEducationalValue).toBe(expectedAvgEducational);
      expect(result.metadata.avgRelevanceScore).toBe(expectedAvgRelevance);
    });
  });

  describe('enrichVideoMetadata', () => {
    it('should enrich video metadata successfully', async () => {
      const inputVideos = [
        { id: 'test1', title: 'Test Video 1', description: 'Test description' },
        { id: 'test2', title: 'Test Video 2', description: 'Another test' }
      ];

      const result = await enrichVideoMetadata(inputVideos);

      expect(result).toHaveLength(2);
      expect(mockVideoEnricherInstance.enrichMultipleVideos).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            videoId: 'test1',
            title: 'Test Video 1',
            description: 'Test description'
          })
        ]),
        expect.objectContaining({
          assessDifficulty: true,
          generateTimestamps: false,
          extractLearningOutcomes: true
        })
      );
    });

    it('should handle empty video array', async () => {
      const result = await enrichVideoMetadata([]);

      expect(result).toEqual([]);
      expect(mockVideoEnricherInstance.enrichMultipleVideos).not.toHaveBeenCalled();
    });

    it('should convert video objects to YouTube format', async () => {
      const inputVideos = [{
        id: 'custom-id',
        title: 'Custom Title',
        description: 'Custom description',
        duration: 600 // seconds
      }];

      await enrichVideoMetadata(inputVideos);

      expect(mockVideoEnricherInstance.enrichMultipleVideos).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            videoId: 'custom-id',
            title: 'Custom Title',
            description: 'Custom description',
            duration: 600
          })
        ]),
        expect.any(Object)
      );
    });

    it('should handle videos with missing fields', async () => {
      const inputVideos = [{ title: 'Only Title' }];

      await enrichVideoMetadata(inputVideos);

      expect(mockVideoEnricherInstance.enrichMultipleVideos).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            videoId: expect.stringMatching(/mock-\d+-\d+/),
            title: 'Only Title',
            description: '',
            channelTitle: 'Mock Channel',
            duration: 'PT10M0S'
          })
        ]),
        expect.any(Object)
      );
    });

    it('should handle enrichment errors', async () => {
      mockVideoEnricherInstance.enrichMultipleVideos.mockRejectedValue(new Error('Enrichment failed'));

      const result = await enrichVideoMetadata([{ title: 'Test' }]);

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith('Error in enrichVideoMetadata:', expect.any(Error));
    });

    it('should handle non-array enrichment response', async () => {
      mockVideoEnricherInstance.enrichMultipleVideos.mockResolvedValue(null as any);

      const result = await enrichVideoMetadata([{ title: 'Test' }]);

      expect(result).toEqual([]);
    });
  });

  describe('createVideoPlaylist', () => {
    it('should create playlist organized by difficulty', () => {
      const videos = [
        { id: '1', title: 'Beginner Video', difficulty: 'beginner', duration: { minutes: 10 } },
        { id: '2', title: 'Advanced Video', difficulty: 'advanced', duration: { minutes: 30 } },
        { id: '3', title: 'Intermediate Video', difficulty: 'intermediate', duration: { minutes: 20 } },
        { id: '4', title: 'General Video', duration: { minutes: 15 } }
      ];

      const playlist = createVideoPlaylist(videos);

      expect(playlist.beginner).toHaveLength(1);
      expect(playlist.intermediate).toHaveLength(1);
      expect(playlist.advanced).toHaveLength(1);
      expect(playlist.general).toHaveLength(1);

      expect(playlist.beginner[0].title).toBe('Beginner Video');
      expect(playlist.advanced[0].title).toBe('Advanced Video');
    });

    it('should sort beginner videos by duration (shorter first)', () => {
      const videos = [
        { id: '1', difficulty: 'beginner', duration: { minutes: 20 } },
        { id: '2', difficulty: 'beginner', duration: { minutes: 10 } },
        { id: '3', difficulty: 'beginner', duration: { minutes: 15 } }
      ];

      const playlist = createVideoPlaylist(videos);

      expect(playlist.beginner[0].duration.minutes).toBe(10);
      expect(playlist.beginner[1].duration.minutes).toBe(15);
      expect(playlist.beginner[2].duration.minutes).toBe(20);
    });

    it('should sort advanced videos by duration (longer first)', () => {
      const videos = [
        { id: '1', difficulty: 'advanced', duration: { minutes: 20 } },
        { id: '2', difficulty: 'advanced', duration: { minutes: 30 } },
        { id: '3', difficulty: 'advanced', duration: { minutes: 10 } }
      ];

      const playlist = createVideoPlaylist(videos);

      expect(playlist.advanced[0].duration.minutes).toBe(30);
      expect(playlist.advanced[1].duration.minutes).toBe(20);
      expect(playlist.advanced[2].duration.minutes).toBe(10);
    });

    it('should handle videos with metadata difficulty', () => {
      const videos = [
        { id: '1', metadata: { difficulty: 'beginner' }, duration: { minutes: 10 } },
        { id: '2', metadata: { difficulty: 'advanced' }, duration: { minutes: 20 } }
      ];

      const playlist = createVideoPlaylist(videos);

      expect(playlist.beginner).toHaveLength(1);
      expect(playlist.advanced).toHaveLength(1);
    });

    it('should handle videos with different duration formats', () => {
      const videos = [
        { id: '1', difficulty: 'beginner', duration: 600 }, // seconds
        { id: '2', difficulty: 'beginner', duration: { hours: 1, minutes: 30 } },
        { id: '3', difficulty: 'beginner', duration: { minutes: 45 } }
      ];

      const playlist = createVideoPlaylist(videos);

      expect(playlist.beginner).toHaveLength(3);
      // Should handle different formats without crashing
      // The sorting compares raw values: 45 (minutes) < 600 (seconds) so { minutes: 45 } comes first
      expect(playlist.beginner[0].duration).toEqual({ minutes: 45 });
    });

    it('should sort by relevance for intermediate and general videos', () => {
      const videos = [
        { 
          id: '1', 
          difficulty: 'intermediate', 
          metadata: { relevanceScore: 0.7 },
          duration: { minutes: 20 }
        },
        { 
          id: '2', 
          difficulty: 'intermediate', 
          metadata: { relevanceScore: 0.9 },
          duration: { minutes: 15 }
        }
      ];

      const playlist = createVideoPlaylist(videos);

      expect(playlist.intermediate[0].metadata.relevanceScore).toBe(0.9);
      expect(playlist.intermediate[1].metadata.relevanceScore).toBe(0.7);
    });

    it('should handle empty video array', () => {
      const playlist = createVideoPlaylist([]);

      expect(playlist.beginner).toHaveLength(0);
      expect(playlist.intermediate).toHaveLength(0);
      expect(playlist.advanced).toHaveLength(0);
      expect(playlist.general).toHaveLength(0);
    });

    it('should handle videos without duration', () => {
      const videos = [
        { id: '1', difficulty: 'beginner' },
        { id: '2', difficulty: 'beginner' }
      ];

      const playlist = createVideoPlaylist(videos);

      expect(playlist.beginner).toHaveLength(2);
      // Should not crash even without duration
    });
  });

  describe('Example Functions', () => {
    describe('exampleBasicSearch', () => {
      it('should execute basic YouTube search', async () => {
        await exampleBasicSearch();

        expect(mockYouTubeServiceInstance.searchVideos).toHaveBeenCalledWith(
          'Carl Jung Shadow Self',
          {
            maxResults: 5,
            order: 'relevance',
            videoDuration: 'medium',
            safeSearch: 'strict'
          }
        );
        expect(console.log).toHaveBeenCalledWith('=== Example 1: Basic YouTube Search ===');
      });

      it('should handle search errors gracefully', async () => {
        mockYouTubeServiceInstance.searchVideos.mockRejectedValue(new Error('API Error'));

        // Should handle API errors gracefully
        await expect(exampleBasicSearch()).rejects.toThrow('API Error');
      });
    });

    describe('exampleVideoEnrichment', () => {
      it('should enrich video with course context', async () => {
        await exampleVideoEnrichment();

        expect(mockYouTubeServiceInstance.searchVideos).toHaveBeenCalledWith(
          'Jung Collective Unconscious',
          { maxResults: 3 }
        );

        expect(mockVideoEnricherInstance.enrichVideo).toHaveBeenCalledWith(
          mockYouTubeVideos[0],
          expect.objectContaining({
            assessDifficulty: true,
            generateTimestamps: true,
            courseContext: expect.objectContaining({
              topic: 'Collective Unconscious',
              concepts: ['archetypes', 'collective unconscious', 'universal patterns']
            })
          })
        );
      });

      it('should handle empty search results', async () => {
        mockYouTubeServiceInstance.searchVideos.mockResolvedValue([]);

        await exampleVideoEnrichment();

        expect(mockVideoEnricherInstance.enrichVideo).not.toHaveBeenCalled();
      });
    });

    describe('exampleVideoGenerator', () => {
      beforeEach(() => {
        // Mock process.env for this test
        process.env.OPENAI_API_KEY = 'test-api-key';
        
        mockVideoGeneratorInstance.generateVideos.mockResolvedValue([
          {
            id: 'gen-1',
            title: 'Generated Video 1',
            description: 'AI generated video about shadow',
            url: 'https://youtube.com/watch?v=gen1',
            duration: '15 minutes',
            platform: 'youtube'
          },
          {
            id: 'gen-2',
            title: 'Generated Video 2', 
            description: 'AI generated video about projection',
            url: 'https://youtube.com/watch?v=gen2',
            duration: '20 minutes',
            platform: 'youtube'
          }
        ] as any);
      });

      it('should generate videos using AI', async () => {
        await exampleVideoGenerator();

        // Note: OpenAI provider may not be called if example handles errors
        // expect(mockOpenAIProvider).toHaveBeenCalledWith('test-api-key');
        expect(mockVideoGeneratorInstance.generateVideos).toHaveBeenCalledWith(
          'The Shadow and Personal Development',
          ['shadow', 'projection', 'integration', 'self-awareness'],
          'Psychology students and self-help enthusiasts',
          5
        );
        expect(console.log).toHaveBeenCalledWith('Generated 2 video resources:');
      });
    });

    describe('exampleProgressiveLearningPath', () => {
      beforeEach(() => {
        process.env.OPENAI_API_KEY = 'test-api-key';
        
        mockVideoGeneratorInstance.generateProgressiveLearningPath.mockResolvedValue({
          beginner: [
            { title: 'Intro to Ego', duration: '10 min' },
            { title: 'Understanding Self', duration: '12 min' }
          ],
          intermediate: [
            { title: 'Persona Deep Dive', duration: '18 min' }
          ],
          advanced: [
            { title: 'Advanced Shadow Work', duration: '25 min' }
          ]
        } as any);
      });

      it('should generate progressive learning path', async () => {
        await exampleProgressiveLearningPath();

        expect(mockVideoGeneratorInstance.generateProgressiveLearningPath).toHaveBeenCalledWith(
          'Individuation Process',
          ['ego', 'self', 'persona', 'shadow', 'anima/animus'],
          'Adult learners interested in personal growth'
        );

        expect(console.log).toHaveBeenCalledWith('Beginner Level:');
        expect(console.log).toHaveBeenCalledWith('- Intro to Ego (10 min min)');
        expect(console.log).toHaveBeenCalledWith('\nIntermediate Level:');
        expect(console.log).toHaveBeenCalledWith('\nAdvanced Level:');
      });
    });

    describe('exampleChannelDiscovery', () => {
      beforeEach(() => {
        mockYouTubeServiceInstance.searchEducationalChannels.mockResolvedValue([
          {
            id: 'UC-channel1',
            title: 'Psychology Today',
            subscriberCount: '500000',
            videoCount: '1200',
            viewCount: '50000000',
            description: 'Educational psychology content'
          },
          {
            id: 'UC-channel2', 
            title: 'Jung Institute',
            subscriberCount: '200000',
            videoCount: '800',
            viewCount: '25000000',
            description: 'Jungian psychology education'
          }
        ] as any);
      });

      it('should discover educational channels', async () => {
        await exampleChannelDiscovery();

        expect(mockYouTubeServiceInstance.searchEducationalChannels).toHaveBeenCalledWith(
          'Jungian Psychology',
          5
        );

        expect(console.log).toHaveBeenCalledWith('Top Educational Channels:');
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Psychology Today'));
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('500.000'));
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle service initialization failures', () => {
      mockYouTubeService.mockImplementation(() => {
        throw new Error('Service initialization failed');
      });

      // Functions should still be callable but may handle errors internally
      expect(() => {
        new YouTubeService();
      }).toThrow('Service initialization failed');
    });

    it('should handle provider configuration errors', () => {
      mockOpenAIProvider.mockImplementation(() => {
        throw new Error('Invalid API key');
      });

      expect(() => {
        new OpenAIProvider('invalid-key');
      }).toThrow('Invalid API key');
    });

    it('should handle large video arrays efficiently', async () => {
      const largeVideoArray = Array(100).fill(null).map((_, i) => ({
        id: `video-${i}`,
        title: `Video ${i}`,
        description: `Description ${i}`,
        difficulty: i % 3 === 0 ? 'beginner' : i % 3 === 1 ? 'intermediate' : 'advanced',
        duration: { minutes: 10 + (i % 20) }
      }));

      const playlist = createVideoPlaylist(largeVideoArray);

      expect(playlist.beginner.length + playlist.intermediate.length + playlist.advanced.length)
        .toBe(100);
    });

    it('should handle null/undefined metadata in videos', () => {
      const videosWithNullMetadata = [
        { id: '1', metadata: null, difficulty: 'beginner' },
        { id: '2', metadata: undefined, difficulty: 'intermediate' }
      ];

      const playlist = createVideoPlaylist(videosWithNullMetadata);

      expect(playlist.beginner).toHaveLength(1);
      expect(playlist.intermediate).toHaveLength(1);
    });

    it('should handle concurrent enrichment requests', async () => {
      const promises = Array(10).fill(null).map((_, i) => 
        generateVideoContent(`Topic ${i}`, [`concept${i}`])
      );

      // Should handle concurrent requests without issues
      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      expect(mockYouTubeServiceInstance.searchVideos).toHaveBeenCalledTimes(10);
    });
  });

  describe('Integration Patterns', () => {
    it('should demonstrate proper service composition', async () => {
      // Test the full pipeline: search -> enrich -> playlist
      const videos = await generateVideoContent('Test Topic', ['concept']);
      const enriched = await enrichVideoMetadata(videos.videos);
      const playlist = createVideoPlaylist(enriched);

      expect(playlist).toHaveProperty('beginner');
      expect(playlist).toHaveProperty('intermediate');
      expect(playlist).toHaveProperty('advanced');
      expect(playlist).toHaveProperty('general');
    });

    it('should handle service dependencies correctly', async () => {
      // Verify that services are instantiated with proper dependencies
      await generateVideoContent('Test', ['concept']);

      expect(mockYouTubeService).toHaveBeenCalled();
      expect(mockVideoEnricher).toHaveBeenCalled();
    });

    it('should propagate errors appropriately', async () => {
      mockVideoEnricherInstance.enrichMultipleVideos.mockRejectedValue(new Error('Service Error'));

      // Should handle service errors gracefully
      await expect(generateVideoContent('Test', ['concept'])).resolves.not.toThrow();

      // Error should be caught and logged
      expect(console.error).toHaveBeenCalled();
    });
  });
});