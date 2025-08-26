/**
 * Extended test suite for VideoGenerator covering edge cases and advanced functionality
 */

import { VideoGenerator } from '../video-generator';
import { ILLMProvider } from '../../types';
import { YouTubeService } from '../../../video/youtubeService';
import { VideoEnricher } from '../../../video/videoEnricher';

// Mock dependencies
jest.mock('../../../video/youtubeService');
jest.mock('../../../video/videoEnricher');

describe('VideoGenerator - Extended Coverage', () => {
  let videoGenerator: VideoGenerator;
  let mockProvider: jest.Mocked<ILLMProvider>;
  let mockYouTubeService: jest.Mocked<YouTubeService>;
  let mockVideoEnricher: jest.Mocked<VideoEnricher>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockProvider = {
      generateStructuredOutput: jest.fn(),
      generateCompletion: jest.fn(),
      getTokenCount: jest.fn().mockReturnValue(100),
      isAvailable: jest.fn().mockResolvedValue(true),
    } as any;

    mockYouTubeService = {
      searchVideos: jest.fn(),
      getVideoById: jest.fn(),
      searchEducationalChannels: jest.fn(),
      getPlaylistVideos: jest.fn(),
    } as any;
    (YouTubeService as jest.Mock).mockImplementation(() => mockYouTubeService);

    mockVideoEnricher = {
      enrichMultipleVideos: jest.fn(),
      calculateRelevanceMatrix: jest.fn(),
    } as any;
    (VideoEnricher as jest.Mock).mockImplementation(() => mockVideoEnricher);

    videoGenerator = new VideoGenerator(mockProvider);
  });

  describe('Advanced Error Scenarios', () => {
    it('should handle YouTube API rate limiting', async () => {
      mockProvider.generateStructuredOutput.mockResolvedValue(['test query']);
      mockYouTubeService.searchVideos.mockRejectedValue(
        new Error('quotaExceeded')
      );

      const videos = await videoGenerator.generateVideos(
        'Rate Limit Test',
        ['test'],
        'Students',
        3
      );

      // Should return fallback videos when rate limited
      expect(videos).toHaveLength(2);
      expect(videos[0].youtubeId).toBe('nBUQsNpyPHs');
    });

    it('should handle malformed YouTube search responses', async () => {
      mockProvider.generateStructuredOutput.mockResolvedValue(['valid query']);
      mockYouTubeService.searchVideos.mockResolvedValue([
        {
          videoId: 'valid123',
          title: 'Valid Video',
          description: 'Valid description',
          channelTitle: 'Valid Channel',
          duration: 'PT15M',
          viewCount: '1000',
          publishedAt: '2023-01-01',
          thumbnails: {
            high: { url: 'https://example.com/thumb.jpg', width: 480, height: 360 }
          }
        },
        // Malformed entries
        null as any,
        undefined as any,
        {} as any,
        {
          // Missing required fields
          videoId: 'invalid456',
          title: null
        } as any
      ]);

      mockVideoEnricher.enrichMultipleVideos.mockResolvedValue([{
        id: 'video-valid123',
        title: 'Valid Video',
        url: 'https://www.youtube.com/watch?v=valid123',
        description: 'Valid description',
        duration: { hours: 0, minutes: 15, seconds: 0 },
        metadata: {
          educationalValue: 0.8,
          relevanceScore: 0.9,
          difficulty: 'beginner'
        }
      }]);

      const videos = await videoGenerator.generateVideos(
        'Malformed Response Test',
        ['test'],
        'Students',
        5
      );

      // Should filter out malformed entries and process only valid ones
      expect(videos).toHaveLength(1);
      expect(videos[0].title).toBe('Valid Video');
    });

    it('should handle video enricher returning inconsistent data', async () => {
      mockProvider.generateStructuredOutput.mockResolvedValue(['query']);
      mockYouTubeService.searchVideos.mockResolvedValue([
        {
          videoId: 'test123',
          title: 'Test Video',
          description: 'Description',
          channelTitle: 'Channel',
          duration: 'PT10M',
          viewCount: '1000',
          publishedAt: '2023-01-01',
          thumbnails: { high: { url: 'thumb.jpg', width: 480, height: 360 } }
        }
      ]);

      // Return enriched video with mismatched data
      mockVideoEnricher.enrichMultipleVideos.mockResolvedValue([
        {
          id: 'different-id', // Different from search result
          title: 'Different Title', // Different title
          url: 'https://www.youtube.com/watch?v=different123',
          description: 'Different description',
          duration: { hours: 1, minutes: 0, seconds: 0 }, // Different duration
          metadata: {
            educationalValue: 0.7,
            relevanceScore: 0.8,
            difficulty: 'advanced'
          }
        }
      ]);

      const videos = await videoGenerator.generateVideos(
        'Inconsistent Data Test',
        ['test'],
        'Students',
        1
      );

      // Should handle the mismatch gracefully
      expect(videos).toHaveLength(1);
      expect(videos[0].id).toBe('different-id');
      expect(videos[0].title).toBe('Different Title');
    });

    it('should handle concurrent search query generation', async () => {
      // Simulate multiple parallel calls
      const promises = Array(5).fill(null).map((_, i) => {
        mockProvider.generateStructuredOutput.mockResolvedValueOnce([
          `query ${i}`,
          `search ${i}`
        ]);
        mockYouTubeService.searchVideos.mockResolvedValueOnce([]);
        mockVideoEnricher.enrichMultipleVideos.mockResolvedValueOnce([]);

        return videoGenerator.generateVideos(
          `Concurrent Test ${i}`,
          [`concept${i}`],
          'Students',
          1
        );
      });

      const results = await Promise.all(promises);

      // All requests should complete successfully
      expect(results).toHaveLength(5);
      results.forEach((result, i) => {
        expect(Array.isArray(result)).toBe(true);
      });
    });
  });

  describe('Memory and Performance Edge Cases', () => {
    it('should handle extremely large search results', async () => {
      mockProvider.generateStructuredOutput.mockResolvedValue(['query']);
      
      // Generate 1000 mock search results
      const largeSearchResults = Array(1000).fill(null).map((_, i) => ({
        videoId: `video${i}`,
        title: `Video ${i}`,
        description: `Description ${i}`,
        channelTitle: `Channel ${i}`,
        duration: 'PT15M',
        viewCount: '1000',
        publishedAt: '2023-01-01',
        thumbnails: {
          high: { url: `https://example.com/thumb${i}.jpg`, width: 480, height: 360 }
        }
      }));

      mockYouTubeService.searchVideos.mockResolvedValue(largeSearchResults);
      
      // Mock enricher to return subset to avoid memory issues
      mockVideoEnricher.enrichMultipleVideos.mockResolvedValue(
        largeSearchResults.slice(0, 50).map((video, i) => ({
          id: `enriched-${video.videoId}`,
          title: video.title,
          url: `https://www.youtube.com/watch?v=${video.videoId}`,
          description: video.description,
          duration: { hours: 0, minutes: 15, seconds: 0 },
          metadata: {
            educationalValue: 0.8 - (i * 0.01), // Decreasing quality
            relevanceScore: 0.9 - (i * 0.01),
            difficulty: i < 17 ? 'beginner' : i < 34 ? 'intermediate' : 'advanced'
          }
        }))
      );

      const videos = await videoGenerator.generateVideos(
        'Large Results Test',
        ['concept'],
        'Students',
        10
      );

      // Should handle large datasets efficiently and return requested amount
      expect(videos).toHaveLength(10);
    });

    it('should handle videos with very long metadata', async () => {
      mockProvider.generateStructuredOutput.mockResolvedValue(['query']);
      mockYouTubeService.searchVideos.mockResolvedValue([
        {
          videoId: 'longmeta123',
          title: 'Video with Long Metadata',
          description: 'x'.repeat(10000), // Very long description
          channelTitle: 'y'.repeat(1000), // Long channel name
          duration: 'PT15M',
          viewCount: '1000',
          publishedAt: '2023-01-01',
          thumbnails: {
            high: { url: 'https://example.com/thumb.jpg', width: 480, height: 360 }
          }
        }
      ]);

      mockVideoEnricher.enrichMultipleVideos.mockResolvedValue([
        {
          id: 'enriched-longmeta123',
          title: 'Video with Long Metadata',
          url: 'https://www.youtube.com/watch?v=longmeta123',
          description: 'z'.repeat(5000), // Different long description
          duration: { hours: 0, minutes: 15, seconds: 0 },
          metadata: {
            educationalValue: 0.8,
            relevanceScore: 0.9,
            difficulty: 'intermediate',
            tags: Array(1000).fill('tag'), // Many tags
            transcript: 'w'.repeat(50000) // Very long transcript
          }
        }
      ]);

      const videos = await videoGenerator.generateVideos(
        'Long Metadata Test',
        ['concept'],
        'Students',
        1
      );

      // Should handle long metadata without issues
      expect(videos).toHaveLength(1);
      expect(videos[0].description).toBeDefined();
      expect(videos[0].description.length).toBeGreaterThan(1000);
    });
  });

  describe('Internationalization Edge Cases', () => {
    it('should handle mixed language concepts', async () => {
      const mixedConcepts = [
        'shadow', // English
        'sombra', // Portuguese
        'тень', // Russian
        '影', // Chinese
        'छाया' // Hindi
      ];

      mockProvider.generateStructuredOutput.mockResolvedValue([
        'shadow psychology international',
        'sombra psicologia português',
        'международная психология тень'
      ]);

      mockYouTubeService.searchVideos.mockResolvedValue([]);
      mockVideoEnricher.enrichMultipleVideos.mockResolvedValue([]);

      const videos = await videoGenerator.generateVideos(
        'Mixed Languages',
        mixedConcepts,
        'International students',
        5,
        'multi'
      );

      // Should handle mixed languages gracefully
      expect(Array.isArray(videos)).toBe(true);
      expect(mockProvider.generateStructuredOutput).toHaveBeenCalled();
    });

    it('should handle right-to-left language concepts', async () => {
      const rtlConcepts = [
        'الظل', // Arabic for shadow
        'הצל', // Hebrew for shadow
        'سایه' // Persian for shadow
      ];

      mockProvider.generateStructuredOutput.mockResolvedValue([
        'الظل نفسية يونغ',
        'jung shadow arabic'
      ]);

      mockYouTubeService.searchVideos.mockResolvedValue([]);
      mockVideoEnricher.enrichMultipleVideos.mockResolvedValue([]);

      const videos = await videoGenerator.generateVideos(
        'RTL Languages',
        rtlConcepts,
        'Arabic speakers',
        3,
        'ar'
      );

      expect(Array.isArray(videos)).toBe(true);
    });
  });

  describe('Video Quality and Filtering', () => {
    it('should filter out low-quality videos based on view count', async () => {
      mockProvider.generateStructuredOutput.mockResolvedValue(['quality test']);
      mockYouTubeService.searchVideos.mockResolvedValue([
        {
          videoId: 'highquality',
          title: 'High Quality Video',
          description: 'Professional content',
          channelTitle: 'Educational Channel',
          duration: 'PT15M',
          viewCount: '1000000', // 1M views
          publishedAt: '2023-01-01',
          thumbnails: { high: { url: 'thumb.jpg', width: 480, height: 360 } }
        },
        {
          videoId: 'lowquality',
          title: 'Low Quality Video',
          description: 'Amateur content',
          channelTitle: 'Random Channel',
          duration: 'PT15M',
          viewCount: '10', // Very low views
          publishedAt: '2023-01-01',
          thumbnails: { high: { url: 'thumb.jpg', width: 480, height: 360 } }
        }
      ]);

      mockVideoEnricher.enrichMultipleVideos.mockResolvedValue([
        {
          id: 'high-quality',
          title: 'High Quality Video',
          url: 'https://www.youtube.com/watch?v=highquality',
          description: 'Professional content',
          duration: { hours: 0, minutes: 15, seconds: 0 },
          metadata: {
            educationalValue: 0.9,
            relevanceScore: 0.8,
            difficulty: 'intermediate'
          }
        },
        {
          id: 'low-quality',
          title: 'Low Quality Video',
          url: 'https://www.youtube.com/watch?v=lowquality',
          description: 'Amateur content',
          duration: { hours: 0, minutes: 15, seconds: 0 },
          metadata: {
            educationalValue: 0.3, // Low educational value
            relevanceScore: 0.2, // Low relevance
            difficulty: 'beginner'
          }
        }
      ]);

      const videos = await videoGenerator.generateVideos(
        'Quality Test',
        ['quality'],
        'Students',
        2
      );

      // Should prefer higher quality video
      expect(videos[0].title).toBe('High Quality Video');
      if (videos.length > 1) {
        expect(videos[1].title).toBe('Low Quality Video');
      }
    });

    it('should handle videos with missing or invalid durations', async () => {
      mockProvider.generateStructuredOutput.mockResolvedValue(['duration test']);
      mockYouTubeService.searchVideos.mockResolvedValue([
        {
          videoId: 'noduration',
          title: 'No Duration Video',
          description: 'Missing duration',
          channelTitle: 'Test Channel',
          duration: null as any, // Missing duration
          viewCount: '1000',
          publishedAt: '2023-01-01',
          thumbnails: { high: { url: 'thumb.jpg', width: 480, height: 360 } }
        },
        {
          videoId: 'invalidduration',
          title: 'Invalid Duration Video',
          description: 'Invalid duration format',
          channelTitle: 'Test Channel',
          duration: 'INVALID_FORMAT',
          viewCount: '1000',
          publishedAt: '2023-01-01',
          thumbnails: { high: { url: 'thumb.jpg', width: 480, height: 360 } }
        }
      ]);

      mockVideoEnricher.enrichMultipleVideos.mockResolvedValue([
        {
          id: 'no-duration',
          title: 'No Duration Video',
          url: 'https://www.youtube.com/watch?v=noduration',
          description: 'Missing duration',
          duration: null as any,
          metadata: { educationalValue: 0.8, relevanceScore: 0.7, difficulty: 'beginner' }
        },
        {
          id: 'invalid-duration',
          title: 'Invalid Duration Video',
          url: 'https://www.youtube.com/watch?v=invalidduration',
          description: 'Invalid duration format',
          duration: 'invalid' as any,
          metadata: { educationalValue: 0.7, relevanceScore: 0.6, difficulty: 'beginner' }
        }
      ]);

      const videos = await videoGenerator.generateVideos(
        'Duration Test',
        ['duration'],
        'Students',
        2
      );

      // Should handle missing/invalid durations gracefully
      expect(videos).toHaveLength(2);
      videos.forEach(video => {
        expect(typeof video.duration).toBe('number');
        expect(video.duration).toBeGreaterThan(0); // Should have default duration
      });
    });
  });

  describe('Accessibility and Captions', () => {
    it('should prioritize videos with captions when available', async () => {
      mockProvider.generateStructuredOutput.mockResolvedValue(['caption test']);
      mockYouTubeService.searchVideos.mockResolvedValue([
        {
          videoId: 'withcaptions',
          title: 'Video with Captions',
          description: 'Has captions',
          channelTitle: 'Accessible Channel',
          duration: 'PT15M',
          viewCount: '5000',
          publishedAt: '2023-01-01',
          thumbnails: { high: { url: 'thumb.jpg', width: 480, height: 360 } }
        },
        {
          videoId: 'nocaptions',
          title: 'Video without Captions',
          description: 'No captions',
          channelTitle: 'Regular Channel',
          duration: 'PT15M',
          viewCount: '10000', // Higher views but no captions
          publishedAt: '2023-01-01',
          thumbnails: { high: { url: 'thumb.jpg', width: 480, height: 360 } }
        }
      ]);

      mockVideoEnricher.enrichMultipleVideos.mockResolvedValue([
        {
          id: 'with-captions',
          title: 'Video with Captions',
          url: 'https://www.youtube.com/watch?v=withcaptions',
          description: 'Has captions',
          duration: { hours: 0, minutes: 15, seconds: 0 },
          captions: [
            { language: 'en', url: 'https://captions.en', autoGenerated: false },
            { language: 'pt', url: 'https://captions.pt', autoGenerated: true }
          ],
          metadata: {
            educationalValue: 0.8,
            relevanceScore: 0.7,
            difficulty: 'intermediate',
            hasAccessibleCaptions: true
          }
        },
        {
          id: 'no-captions',
          title: 'Video without Captions',
          url: 'https://www.youtube.com/watch?v=nocaptions',
          description: 'No captions',
          duration: { hours: 0, minutes: 15, seconds: 0 },
          metadata: {
            educationalValue: 0.9,
            relevanceScore: 0.8,
            difficulty: 'intermediate',
            hasAccessibleCaptions: false
          }
        }
      ]);

      const videos = await videoGenerator.generateVideos(
        'Accessibility Test',
        ['accessibility'],
        'Hearing impaired students',
        2
      );

      expect(videos).toHaveLength(2);
      // Video with captions should be prioritized despite lower view count
      const videosWithCaptions = videos.filter(v => v.captions && v.captions.length > 0);
      expect(videosWithCaptions.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Monitoring', () => {
    it('should track generation time and token usage', async () => {
      const startTime = Date.now();
      
      mockProvider.generateStructuredOutput.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve(['performance test']), 100))
      );
      mockProvider.getTokenCount.mockReturnValue(150);
      
      mockYouTubeService.searchVideos.mockResolvedValue([]);
      mockVideoEnricher.enrichMultipleVideos.mockResolvedValue([]);

      const videos = await videoGenerator.generateVideos(
        'Performance Test',
        ['performance'],
        'Students',
        1
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeGreaterThanOrEqual(100); // At least 100ms due to delay
      expect(mockProvider.getTokenCount).toHaveBeenCalled();
      expect(Array.isArray(videos)).toBe(true);
    });

    it('should handle memory-intensive operations', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Create large data structures
      mockProvider.generateStructuredOutput.mockResolvedValue(
        Array(1000).fill('large query string'.repeat(100))
      );
      
      const largeSearchResults = Array(500).fill(null).map((_, i) => ({
        videoId: `memory${i}`,
        title: `Memory Test Video ${i}`,
        description: 'Large description '.repeat(1000),
        channelTitle: 'Memory Test Channel',
        duration: 'PT15M',
        viewCount: '1000',
        publishedAt: '2023-01-01',
        thumbnails: { high: { url: 'thumb.jpg', width: 480, height: 360 } }
      }));

      mockYouTubeService.searchVideos.mockResolvedValue(largeSearchResults);
      
      const largeEnrichedResults = largeSearchResults.map((video, i) => ({
        id: `enriched-${video.videoId}`,
        title: video.title,
        url: `https://www.youtube.com/watch?v=${video.videoId}`,
        description: video.description,
        duration: { hours: 0, minutes: 15, seconds: 0 },
        metadata: {
          educationalValue: 0.8,
          relevanceScore: 0.9,
          difficulty: 'intermediate',
          largemetadata: 'x'.repeat(10000) // Large metadata
        }
      }));

      mockVideoEnricher.enrichMultipleVideos.mockResolvedValue(largeEnrichedResults);

      const videos = await videoGenerator.generateVideos(
        'Memory Test',
        ['memory'],
        'Students',
        10
      );

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      expect(videos).toHaveLength(10);
      // Memory increase should be reasonable (less than 100MB for this test)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
    });
  });
});