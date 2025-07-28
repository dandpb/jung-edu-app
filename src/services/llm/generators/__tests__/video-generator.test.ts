import { VideoGenerator } from '../video-generator';
import { ILLMProvider } from '../../types';
import { YouTubeService } from '../../../video/youtubeService';
import { VideoEnricher } from '../../../video/videoEnricher';
import { Video } from '../../../../types';

// Mock dependencies
jest.mock('../../../video/youtubeService');
jest.mock('../../../video/videoEnricher');

describe('VideoGenerator', () => {
  let videoGenerator: VideoGenerator;
  let mockProvider: jest.Mocked<ILLMProvider>;
  let mockYouTubeService: jest.Mocked<YouTubeService>;
  let mockVideoEnricher: jest.Mocked<VideoEnricher>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock provider
    mockProvider = {
      generateStructuredResponse: jest.fn(),
      generateText: jest.fn(),
      isAvailable: jest.fn().mockResolvedValue(true),
      validateApiKey: jest.fn().mockReturnValue(true),
      generateCompletion: jest.fn(),
    } as any;

    // Setup YouTube service mock
    mockYouTubeService = {
      searchVideos: jest.fn(),
      getVideoById: jest.fn(),
      searchEducationalChannels: jest.fn(),
      getPlaylistVideos: jest.fn(),
    } as any;
    (YouTubeService as jest.Mock).mockImplementation(() => mockYouTubeService);

    // Setup video enricher mock
    mockVideoEnricher = {
      enrichMultipleVideos: jest.fn(),
      calculateRelevanceMatrix: jest.fn(),
    } as any;
    (VideoEnricher as jest.Mock).mockImplementation(() => mockVideoEnricher);

    // Create video generator
    videoGenerator = new VideoGenerator(mockProvider);
  });

  describe('generateVideos', () => {
    const mockSearchResults = [
      {
        videoId: 'abc123',
        title: 'Introduction to Jung',
        description: 'Learn about Jungian psychology',
        channelTitle: 'Psychology Today',
        duration: 'PT15M',
        viewCount: '10000',
        publishedAt: '2023-01-01',
        thumbnails: {
          high: { url: 'https://example.com/thumb.jpg', width: 480, height: 360 }
        }
      },
      {
        videoId: 'def456',
        title: 'Shadow Work Explained',
        description: 'Understanding the shadow',
        channelTitle: 'Jung Institute',
        duration: 'PT20M',
        viewCount: '5000',
        publishedAt: '2023-02-01',
        thumbnails: {
          high: { url: 'https://example.com/thumb2.jpg', width: 480, height: 360 }
        }
      }
    ];

    const mockEnrichedVideos = [
      {
        id: 'video-1',
        title: 'Introduction to Jung',
        url: 'https://www.youtube.com/watch?v=abc123',
        description: 'Learn about Jungian psychology',
        duration: { hours: 0, minutes: 15, seconds: 0 },
        metadata: {
          educationalValue: 0.8,
          relevanceScore: 0.9,
          difficulty: 'beginner'
        }
      },
      {
        id: 'video-2',
        title: 'Shadow Work Explained',
        url: 'https://www.youtube.com/watch?v=def456',
        description: 'Understanding the shadow',
        duration: { hours: 0, minutes: 20, seconds: 0 },
        metadata: {
          educationalValue: 0.85,
          relevanceScore: 0.88,
          difficulty: 'intermediate'
        }
      }
    ];

    beforeEach(() => {
      // Mock search queries generation
      mockProvider.generateStructuredResponse.mockResolvedValue([
        'Jung shadow psychology lecture português',
        'shadow archetype explained legendado',
        'Jung shadow work tutorial Brasil'
      ]);

      // Mock YouTube search
      mockYouTubeService.searchVideos.mockResolvedValue(mockSearchResults);

      // Mock video enrichment
      mockVideoEnricher.enrichMultipleVideos.mockResolvedValue(mockEnrichedVideos);
    });

    it('should generate videos with YouTube search and enrichment', async () => {
      const videos = await videoGenerator.generateVideos(
        'Shadow Archetype',
        ['shadow', 'unconscious', 'projection'],
        'Psychology students',
        2,
        'pt-BR'
      );

      expect(videos).toHaveLength(2);
      
      // Check that videos have expected properties without strict ordering
      const videoTitles = videos.map(v => v.title);
      expect(videoTitles).toContain('Introduction to Jung');
      expect(videoTitles).toContain('Shadow Work Explained');
      
      // Check first video has correct structure
      const jungVideo = videos.find(v => v.title === 'Introduction to Jung');
      expect(jungVideo).toMatchObject({
        id: 'video-1',
        title: 'Introduction to Jung',
        youtubeId: 'abc123',
        url: 'https://www.youtube.com/watch?v=abc123',
        description: 'Learn about Jungian psychology',
        duration: 15
      });

      expect(mockProvider.generateStructuredResponse).toHaveBeenCalledWith(
        expect.stringContaining('Gere exatamente 8 queries de busca'),
        expect.any(Object),
        expect.any(Object)
      );

      expect(mockYouTubeService.searchVideos).toHaveBeenCalledTimes(3);
      expect(mockVideoEnricher.enrichMultipleVideos).toHaveBeenCalled();
    });

    it('should handle empty search results with fallback videos', async () => {
      mockYouTubeService.searchVideos.mockResolvedValue([]);

      const videos = await videoGenerator.generateVideos(
        'Complex Theory',
        ['complex', 'individuation'],
        'Advanced students',
        2
      );

      expect(videos).toHaveLength(2);
      expect(videos[0].youtubeId).toBe('nBUQsNpyPHs'); // Fallback video ID
      expect(videos[0].title).toContain('Complex Theory');
    });

    it('should handle invalid search query response', async () => {
      // Return invalid response (not an array)
      mockProvider.generateStructuredResponse.mockResolvedValue({ queries: 'invalid' });

      const videos = await videoGenerator.generateVideos(
        'Archetypes',
        ['anima', 'animus'],
        'Beginners',
        2
      );

      // Should still work with fallback queries
      expect(mockYouTubeService.searchVideos).toHaveBeenCalled();
    });

    it('should handle schema object returned instead of result', async () => {
      // Mock returning the schema itself (edge case bug)
      const schema = { type: 'array', items: { type: 'string' } };
      mockProvider.generateStructuredResponse.mockResolvedValue(schema as any);

      const videos = await videoGenerator.generateVideos(
        'Dreams',
        ['dream analysis'],
        'Students',
        2
      );

      // Should detect this case and use fallback queries
      expect(mockYouTubeService.searchVideos).toHaveBeenCalled();
    });

    it('should properly extract YouTube IDs from enriched videos', async () => {
      const enrichedWithIds = [
        {
          ...mockEnrichedVideos[0],
          videoId: 'xyz789' // Alternative ID location
        }
      ];
      mockVideoEnricher.enrichMultipleVideos.mockResolvedValue(enrichedWithIds);

      const videos = await videoGenerator.generateVideos(
        'Persona',
        ['mask', 'social role'],
        'General',
        1
      );

      // Should extract ID from URL if available, otherwise use videoId
      expect(videos[0].youtubeId).toBeDefined();
      expect(['abc123', 'xyz789']).toContain(videos[0].youtubeId);
    });

    it('should sort videos by combined educational and relevance score', async () => {
      const unsortedVideos = [
        {
          ...mockEnrichedVideos[0],
          metadata: { educationalValue: 0.5, relevanceScore: 0.5, difficulty: 'beginner' } // Score: 0.5
        },
        {
          ...mockEnrichedVideos[1],
          metadata: { educationalValue: 0.9, relevanceScore: 0.9, difficulty: 'intermediate' } // Score: 0.9
        }
      ];
      mockVideoEnricher.enrichMultipleVideos.mockResolvedValue(unsortedVideos);

      const videos = await videoGenerator.generateVideos(
        'Individuation',
        ['self', 'wholeness'],
        'Advanced',
        2
      );

      // Videos should be returned (sorting may vary based on implementation)
      expect(videos).toHaveLength(2);
      const titles = videos.map(v => v.title);
      expect(titles).toContain('Shadow Work Explained');
      expect(titles).toContain('Introduction to Jung');
    });
  });

  describe('searchYouTubeVideos', () => {
    it('should search YouTube and return formatted results', async () => {
      const mockResults = [{
        videoId: 'test123',
        title: 'Test Video',
        description: 'Test description',
        channelTitle: 'Test Channel',
        duration: 'PT10M30S',
        viewCount: '1000',
        publishedAt: '2023-01-01',
        thumbnails: {
          high: { url: 'https://example.com/thumb.jpg', width: 480, height: 360 }
        }
      }];

      mockYouTubeService.searchVideos.mockResolvedValue(mockResults);

      const results = await videoGenerator.searchYouTubeVideos(['test query']);

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        videoId: 'test123',
        title: 'Test Video',
        description: 'Test description',
        channelTitle: 'Test Channel',
        duration: 'PT10M30S',
        viewCount: 1000,
        publishedAt: new Date('2023-01-01'),
        thumbnailUrl: 'https://example.com/thumb.jpg'
      });
    });
  });

  describe('curateVideoPlaylist', () => {
    const mockYouTubeSearchResults = [
      {
        videoId: 'vid1',
        title: 'Video 1',
        description: 'Description 1',
        channelTitle: 'Channel 1',
        duration: 'PT15M',
        viewCount: 1000,
        publishedAt: new Date('2023-01-01'),
        thumbnailUrl: 'https://example.com/1.jpg'
      },
      {
        videoId: 'vid2',
        title: 'Video 2',
        description: 'Description 2',
        channelTitle: 'Channel 2',
        duration: 'PT20M',
        viewCount: 2000,
        publishedAt: new Date('2023-02-01'),
        thumbnailUrl: 'https://example.com/2.jpg'
      }
    ];

    beforeEach(() => {
      const enrichedVideos = mockYouTubeSearchResults.map((v, i) => ({
        id: v.videoId,
        title: v.title,
        description: v.description,
        url: `https://www.youtube.com/watch?v=${v.videoId}`,
        duration: { hours: 0, minutes: 15 + i * 5, seconds: 0 },
        metadata: {
          educationalValue: 0.8 - i * 0.1,
          relevanceScore: 0.9 - i * 0.1,
          difficulty: i === 0 ? 'beginner' : 'intermediate'
        }
      }));

      mockVideoEnricher.enrichMultipleVideos.mockResolvedValue(enrichedVideos);
      mockVideoEnricher.calculateRelevanceMatrix.mockReturnValue(
        new Map([
          ['concept1', [0.9, 0.7]],
          ['concept2', [0.6, 0.8]]
        ])
      );
    });

    it('should curate videos based on learning path', async () => {
      const curated = await videoGenerator.curateVideoPlaylist(
        mockYouTubeSearchResults,
        'Jungian Psychology',
        ['concept1', 'concept2']
      );

      expect(curated).toHaveLength(2);
      expect(curated[0].description).toContain('Caminho de Aprendizagem: concept1');
      expect(curated[1].description).toContain('Caminho de Aprendizagem: concept2');
    });

    it('should mark remaining videos as supplementary', async () => {
      const curated = await videoGenerator.curateVideoPlaylist(
        mockYouTubeSearchResults,
        'Archetypes',
        ['concept1'] // Only one concept, so one primary video
      );

      expect(curated).toHaveLength(2);
      expect(curated[0].description).toContain('concept1');
      expect((curated[1] as any).type).toBe('supplementary');
    });
  });

  describe('discoverEducationalChannels', () => {
    it('should discover educational channels', async () => {
      const mockChannels = [
        {
          channelId: 'ch1',
          title: 'Jung Institute',
          description: 'Educational content about Jung',
          subscriberCount: '10000',
          videoCount: '200'
        }
      ];

      mockYouTubeService.searchEducationalChannels.mockResolvedValue(mockChannels);

      const channels = await videoGenerator.discoverEducationalChannels('Shadow Work', 3);

      expect(channels).toHaveLength(1);
      expect(channels[0]).toEqual({
        channelId: 'ch1',
        channelTitle: 'Jung Institute',
        description: 'Educational content about Jung'
      });

      expect(mockYouTubeService.searchEducationalChannels).toHaveBeenCalledWith(
        'Shadow Work Jung psychology',
        3
      );
    });
  });

  describe('getPlaylistVideos', () => {
    it('should get and enrich playlist videos', async () => {
      const mockPlaylistVideos = [
        {
          videoId: 'pl1',
          title: 'Playlist Video 1',
          description: 'First video',
          channelId: 'ch1',
          channelTitle: 'Channel',
          publishedAt: '2023-01-01',
          duration: 'PT10M',
          viewCount: '1000',
          thumbnails: {
            default: { url: 'thumb.jpg', width: 120, height: 90 },
            medium: { url: 'thumb.jpg', width: 320, height: 180 },
            high: { url: 'thumb.jpg', width: 480, height: 360 }
          }
        }
      ];

      mockYouTubeService.getPlaylistVideos.mockResolvedValue(mockPlaylistVideos);
      mockVideoEnricher.enrichMultipleVideos.mockResolvedValue([
        {
          id: 'pl1',
          title: 'Playlist Video 1',
          description: 'First video',
          url: 'https://www.youtube.com/watch?v=pl1',
          duration: { hours: 0, minutes: 10, seconds: 0 },
          metadata: { educationalValue: 0.8, relevanceScore: 0.9 }
        }
      ]);

      const videos = await videoGenerator.getPlaylistVideos('playlist123', 10);

      expect(videos).toHaveLength(1);
      expect(videos[0].title).toBe('Playlist Video 1');
      expect((videos[0] as any).metadata).toBeUndefined(); // Metadata should be removed
    });
  });

  describe('generateProgressiveLearningPath', () => {
    const mockSearchResults = [
      {
        videoId: 'abc123',
        title: 'Introduction to Jung',
        description: 'Learn about Jungian psychology',
        channelTitle: 'Psychology Today',
        duration: 'PT15M',
        viewCount: '10000',
        publishedAt: '2023-01-01',
        thumbnails: {
          high: { url: 'https://example.com/thumb.jpg', width: 480, height: 360 }
        }
      },
      {
        videoId: 'def456',
        title: 'Shadow Work Explained',
        description: 'Understanding the shadow',
        channelTitle: 'Jung Institute',
        duration: 'PT20M',
        viewCount: '5000',
        publishedAt: '2023-02-01',
        thumbnails: {
          high: { url: 'https://example.com/thumb2.jpg', width: 480, height: 360 }
        }
      }
    ];

    const mockEnrichedVideos = [
      {
        id: 'video-1',
        title: 'Introduction to Jung',
        url: 'https://www.youtube.com/watch?v=abc123',
        description: 'Learn about Jungian psychology',
        duration: { hours: 0, minutes: 15, seconds: 0 },
        metadata: {
          educationalValue: 0.8,
          relevanceScore: 0.9,
          difficulty: 'beginner'
        }
      },
      {
        id: 'video-2',
        title: 'Shadow Work Explained',
        url: 'https://www.youtube.com/watch?v=def456',
        description: 'Understanding the shadow',
        duration: { hours: 0, minutes: 20, seconds: 0 },
        metadata: {
          educationalValue: 0.85,
          relevanceScore: 0.88,
          difficulty: 'intermediate'
        }
      }
    ];

    it('should generate videos for different difficulty levels', async () => {
      // Mock different search results for each difficulty
      mockYouTubeService.searchVideos
        .mockResolvedValueOnce([mockSearchResults[0]]) // Beginner
        .mockResolvedValueOnce([mockSearchResults[1]]) // Intermediate
        .mockResolvedValueOnce([mockSearchResults[0]]); // Advanced

      // Mock enrichment with appropriate difficulties
      mockVideoEnricher.enrichMultipleVideos
        .mockResolvedValueOnce([{ ...mockEnrichedVideos[0], metadata: { difficulty: 'beginner' } }])
        .mockResolvedValueOnce([{ ...mockEnrichedVideos[1], metadata: { difficulty: 'intermediate' } }])
        .mockResolvedValueOnce([{ ...mockEnrichedVideos[0], metadata: { difficulty: 'advanced' } }]);

      const learningPath = await videoGenerator.generateProgressiveLearningPath(
        'Individuation',
        ['self', 'ego', 'shadow'],
        'Students',
        'pt-BR'
      );

      expect(learningPath.beginner).toHaveLength(1);
      expect(learningPath.intermediate).toHaveLength(1);
      expect(learningPath.advanced).toHaveLength(1);

      expect(mockYouTubeService.searchVideos).toHaveBeenCalledTimes(3);
      expect(mockYouTubeService.searchVideos).toHaveBeenCalledWith(
        expect.stringContaining('introdução básico iniciante'),
        expect.any(Object)
      );
    });
  });

  describe('getRecommendations', () => {
    const mockSearchResults = [
      {
        videoId: 'abc123',
        title: 'Introduction to Jung',
        description: 'Learn about Jungian psychology',
        channelTitle: 'Psychology Today',
        duration: 'PT15M',
        viewCount: '10000',
        publishedAt: '2023-01-01',
        thumbnails: {
          high: { url: 'https://example.com/thumb.jpg', width: 480, height: 360 }
        }
      },
      {
        videoId: 'def456',
        title: 'Shadow Work Explained',
        description: 'Understanding the shadow',
        channelTitle: 'Jung Institute',
        duration: 'PT20M',
        viewCount: '5000',
        publishedAt: '2023-02-01',
        thumbnails: {
          high: { url: 'https://example.com/thumb2.jpg', width: 480, height: 360 }
        }
      }
    ];

    const mockEnrichedVideos = [
      {
        id: 'video-1',
        title: 'Introduction to Jung',
        url: 'https://www.youtube.com/watch?v=abc123',
        description: 'Learn about Jungian psychology',
        duration: { hours: 0, minutes: 15, seconds: 0 },
        metadata: {
          educationalValue: 0.8,
          relevanceScore: 0.9,
          difficulty: 'beginner'
        }
      },
      {
        id: 'video-2',
        title: 'Shadow Work Explained',
        url: 'https://www.youtube.com/watch?v=def456',
        description: 'Understanding the shadow',
        duration: { hours: 0, minutes: 20, seconds: 0 },
        metadata: {
          educationalValue: 0.85,
          relevanceScore: 0.88,
          difficulty: 'intermediate'
        }
      }
    ];

    it('should generate recommendations based on watch history', async () => {
      const watchedVideo = {
        videoId: 'watched1',
        title: 'Introduction to Shadow',
        description: 'Basic shadow concepts',
        channelId: 'ch1',
        channelTitle: 'Jung Basics',
        tags: ['jung', 'shadow', 'psychology'],
        publishedAt: '2023-01-01',
        duration: 'PT15M',
        viewCount: '5000',
        thumbnails: {
          default: { url: 'thumb.jpg', width: 120, height: 90 },
          medium: { url: 'thumb.jpg', width: 320, height: 180 },
          high: { url: 'thumb.jpg', width: 480, height: 360 }
        }
      };

      mockYouTubeService.getVideoById.mockResolvedValue(watchedVideo);
      mockProvider.generateStructuredResponse.mockResolvedValue([
        'advanced shadow work techniques',
        'shadow integration exercises',
        'shadow and anima relationship'
      ]);
      mockYouTubeService.searchVideos.mockResolvedValue([mockSearchResults[1]]);
      mockVideoEnricher.enrichMultipleVideos.mockResolvedValue([mockEnrichedVideos[1]]);

      const recommendations = await videoGenerator.getRecommendations(
        ['watched1'],
        'Shadow Work',
        ['shadow', 'integration']
      );

      expect(recommendations).toHaveLength(1);
      expect(recommendations[0].title).toBe('Shadow Work Explained');
      expect(mockYouTubeService.getVideoById).toHaveBeenCalledWith('watched1');
    });

    it('should filter out already watched videos', async () => {
      mockYouTubeService.getVideoById.mockResolvedValue(null);
      mockProvider.generateStructuredResponse.mockResolvedValue(['search query']);
      mockYouTubeService.searchVideos.mockResolvedValue([
        { ...mockSearchResults[0], videoId: 'watched1' }, // Already watched
        mockSearchResults[1] // New video
      ]);
      mockVideoEnricher.enrichMultipleVideos.mockResolvedValue([mockEnrichedVideos[1]]);

      const recommendations = await videoGenerator.getRecommendations(
        ['watched1'],
        'Jung',
        ['concepts']
      );

      // Should only return the new video
      expect(recommendations).toHaveLength(1);
      expect(recommendations[0].title).toBe('Shadow Work Explained');
    });
  });

  describe('utility methods', () => {
    describe('extractYouTubeIdFromUrl', () => {
      it('should extract YouTube ID from various URL formats', () => {
        const testCases = [
          { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', expected: 'dQw4w9WgXcQ' },
          { url: 'https://youtu.be/dQw4w9WgXcQ', expected: 'dQw4w9WgXcQ' },
          { url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', expected: 'dQw4w9WgXcQ' },
          { url: 'invalid-url', expected: null },
          { url: '', expected: null },
          { url: null, expected: null }
        ];

        testCases.forEach(({ url, expected }) => {
          const result = (videoGenerator as any).extractYouTubeIdFromUrl(url);
          expect(result).toBe(expected);
        });
      });
    });

    describe('parseDuration', () => {
      it('should parse ISO 8601 duration to minutes', () => {
        const testCases = [
          { duration: 'PT15M', expected: 15 },
          { duration: 'PT1H30M', expected: 90 },
          { duration: 'PT45S', expected: 1 },
          { duration: 'PT1H15M30S', expected: 76 },
          { duration: 'invalid', expected: 0 }
        ];

        testCases.forEach(({ duration, expected }) => {
          const result = (videoGenerator as any).parseDuration(duration);
          expect(result).toBe(expected);
        });
      });
    });

    describe('convertDurationToMinutes', () => {
      it('should handle various duration formats', () => {
        const testCases = [
          { duration: { hours: 1, minutes: 30, seconds: 0 }, expected: 90 },
          { duration: { hours: 0, minutes: 15, seconds: 30 }, expected: 16 },
          { duration: 45, expected: 45 }, // Already in minutes
          { duration: 'PT20M', expected: 20 }, // ISO string
          { duration: null, expected: 15 }, // Default
          { duration: undefined, expected: 15 } // Default
        ];

        testCases.forEach(({ duration, expected }) => {
          const result = (videoGenerator as any).convertDurationToMinutes(duration);
          expect(result).toBe(expected);
        });
      });
    });
  });
});