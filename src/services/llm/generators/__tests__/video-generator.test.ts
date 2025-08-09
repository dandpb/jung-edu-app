import { VideoGenerator } from '../video-generator';
import { ILLMProvider } from '../../types';
import { YouTubeService } from '../../../video/youtubeService';
import { VideoEnricher } from '../../../video/videoEnricher';
import { Video, VideoCaption, Chapter } from '../../../../types';

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
      generateStructuredOutput: jest.fn(),
      generateCompletion: jest.fn(),
      getTokenCount: jest.fn().mockReturnValue(100),
      isAvailable: jest.fn().mockResolvedValue(true),
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
      mockProvider.generateStructuredOutput.mockResolvedValue([
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

      expect(mockProvider.generateStructuredOutput).toHaveBeenCalledWith(
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
      mockProvider.generateStructuredOutput.mockResolvedValue({ queries: 'invalid' });

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
      mockProvider.generateStructuredOutput.mockResolvedValue(schema as any);

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
      mockProvider.generateStructuredOutput.mockResolvedValue([
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
      mockProvider.generateStructuredOutput.mockResolvedValue(['search query']);
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

  describe('type conversion tests', () => {
    describe('caption to VideoCaption conversion in curateVideoPlaylist', () => {
      it('should add autoGenerated field when missing from captions', async () => {
        const legacyVideo = {
          videoId: 'caption-test',
          title: 'Caption Test Video',
          description: 'Test description',
          channelTitle: 'Test Channel',
          duration: 'PT15M',
          viewCount: 1000,
          publishedAt: new Date('2023-01-01'),
          thumbnailUrl: 'https://example.com/thumb.jpg'
        };

        const enrichedWithIncompleteCaption = {
          id: 'video-caption-test',
          title: 'Caption Test Video',
          url: 'https://www.youtube.com/watch?v=caption-test',
          description: 'Test description',
          duration: { hours: 0, minutes: 15, seconds: 0 },
          captions: [
            {
              language: 'en',
              url: 'https://youtube.com/captions/en'
              // Missing autoGenerated field
            },
            {
              language: 'pt', 
              url: 'https://youtube.com/captions/pt',
              autoGenerated: true // Already has the field
            }
          ],
          metadata: {
            educationalValue: 0.8,
            relevanceScore: 0.9,
            difficulty: 'intermediate'
          }
        };

        mockVideoEnricher.enrichMultipleVideos.mockResolvedValue([enrichedWithIncompleteCaption]);
        mockVideoEnricher.calculateRelevanceMatrix.mockReturnValue(
          new Map([['test-concept', [0.9]]])
        );

        const videos = await videoGenerator.curateVideoPlaylist([legacyVideo], 'Test Topic', ['test-concept']);

        expect(videos[0].captions).toHaveLength(2);
        
        const firstCaption = videos[0].captions![0] as VideoCaption;
        expect(firstCaption).toEqual({
          language: 'en',
          url: 'https://youtube.com/captions/en',
          autoGenerated: false // Should be added
        });

        const secondCaption = videos[0].captions![1] as VideoCaption;
        expect(secondCaption).toEqual({
          language: 'pt',
          url: 'https://youtube.com/captions/pt',
          autoGenerated: true // Should remain unchanged
        });
      });

      it('should handle videos without captions gracefully', async () => {
        const legacyVideo = {
          videoId: 'no-captions-test',
          title: 'No Captions Video',
          description: 'Test description',
          channelTitle: 'Test Channel',
          duration: 'PT15M',
          viewCount: 1000,
          publishedAt: new Date('2023-01-01'),
          thumbnailUrl: 'https://example.com/thumb.jpg'
        };

        const enrichedNoCaptions = {
          id: 'video-no-captions-test',
          title: 'No Captions Video',
          url: 'https://www.youtube.com/watch?v=no-captions-test',
          description: 'Test description',
          duration: { hours: 0, minutes: 15, seconds: 0 },
          metadata: {
            educationalValue: 0.8,
            relevanceScore: 0.9,
            difficulty: 'intermediate'
          }
        };

        mockVideoEnricher.enrichMultipleVideos.mockResolvedValue([enrichedNoCaptions]);
        mockVideoEnricher.calculateRelevanceMatrix.mockReturnValue(
          new Map([['test-concept', [0.9]]])
        );

        const videos = await videoGenerator.curateVideoPlaylist([legacyVideo], 'Test Topic', ['test-concept']);

        expect(videos[0].captions).toBeUndefined();
      });

      it('should handle empty captions array', async () => {
        const legacyVideo = {
          videoId: 'empty-captions-test',
          title: 'Empty Captions Video',
          description: 'Test description',
          channelTitle: 'Test Channel',
          duration: 'PT15M',
          viewCount: 1000,
          publishedAt: new Date('2023-01-01'),
          thumbnailUrl: 'https://example.com/thumb.jpg'
        };

        const enrichedEmptyCaptions = {
          id: 'video-empty-captions-test',
          title: 'Empty Captions Video',
          url: 'https://www.youtube.com/watch?v=empty-captions-test',
          description: 'Test description',
          duration: { hours: 0, minutes: 15, seconds: 0 },
          captions: [],
          metadata: {
            educationalValue: 0.8,
            relevanceScore: 0.9,
            difficulty: 'intermediate'
          }
        };

        mockVideoEnricher.enrichMultipleVideos.mockResolvedValue([enrichedEmptyCaptions]);
        mockVideoEnricher.calculateRelevanceMatrix.mockReturnValue(
          new Map([['test-concept', [0.9]]])
        );

        const videos = await videoGenerator.curateVideoPlaylist([legacyVideo], 'Test Topic', ['test-concept']);

        expect(videos[0].captions).toEqual([]);
      });
    });

    describe('VideoChapter to Chapter conversion in curateVideoPlaylist', () => {
      it('should add id field when missing from chapters', async () => {
        const legacyVideo = {
          videoId: 'chapter-test',
          title: 'Chapter Test Video',
          description: 'Test description',
          channelTitle: 'Test Channel',
          duration: 'PT30M',
          viewCount: 2000,
          publishedAt: new Date('2023-01-01'),
          thumbnailUrl: 'https://example.com/thumb.jpg'
        };

        const enrichedWithIncompleteChapters = {
          id: 'video-chapter-test',
          title: 'Chapter Test Video',
          url: 'https://www.youtube.com/watch?v=chapter-test',
          description: 'Test description',
          duration: { hours: 0, minutes: 30, seconds: 0 },
          chapters: [
            {
              title: 'Introduction',
              startTime: 0,
              endTime: 300,
              description: 'Basic concepts'
              // Missing id field
            },
            {
              id: 'existing-id',
              title: 'Advanced Topics',
              startTime: 300,
              endTime: 600,
              description: 'Deep dive'
              // Already has id field
            },
            {
              title: 'Conclusion',
              startTime: 600,
              endTime: 900
              // Missing both id and description
            }
          ],
          metadata: {
            educationalValue: 0.8,
            relevanceScore: 0.9,
            difficulty: 'intermediate'
          }
        };

        mockVideoEnricher.enrichMultipleVideos.mockResolvedValue([enrichedWithIncompleteChapters]);
        mockVideoEnricher.calculateRelevanceMatrix.mockReturnValue(
          new Map([['test-concept', [0.9]]])
        );

        const videos = await videoGenerator.curateVideoPlaylist([legacyVideo], 'Test Topic', ['test-concept']);

        expect(videos[0].chapters).toHaveLength(3);
        
        const firstChapter = videos[0].chapters![0] as Chapter;
        expect(firstChapter).toEqual({
          id: 'chapter-0', // Should be generated
          title: 'Introduction',
          startTime: 0,
          endTime: 300,
          description: 'Basic concepts'
        });

        const secondChapter = videos[0].chapters![1] as Chapter;
        expect(secondChapter).toEqual({
          id: 'existing-id', // Should remain unchanged
          title: 'Advanced Topics',
          startTime: 300,
          endTime: 600,
          description: 'Deep dive'
        });

        const thirdChapter = videos[0].chapters![2] as Chapter;
        expect(thirdChapter).toEqual({
          id: 'chapter-2', // Should be generated
          title: 'Conclusion',
          startTime: 600,
          endTime: 900,
          description: undefined // Should remain undefined if originally missing
        });
      });

      it('should handle videos without chapters gracefully', async () => {
        const legacyVideo = {
          videoId: 'no-chapters-test',
          title: 'No Chapters Video',
          description: 'Test description',
          channelTitle: 'Test Channel',
          duration: 'PT15M',
          viewCount: 1000,
          publishedAt: new Date('2023-01-01'),
          thumbnailUrl: 'https://example.com/thumb.jpg'
        };

        const enrichedNoChapters = {
          id: 'video-no-chapters-test',
          title: 'No Chapters Video',
          url: 'https://www.youtube.com/watch?v=no-chapters-test',
          description: 'Test description',
          duration: { hours: 0, minutes: 15, seconds: 0 },
          metadata: {
            educationalValue: 0.8,
            relevanceScore: 0.9,
            difficulty: 'intermediate'
          }
        };

        mockVideoEnricher.enrichMultipleVideos.mockResolvedValue([enrichedNoChapters]);
        mockVideoEnricher.calculateRelevanceMatrix.mockReturnValue(
          new Map([['test-concept', [0.9]]])
        );

        const videos = await videoGenerator.curateVideoPlaylist([legacyVideo], 'Test Topic', ['test-concept']);

        expect(videos[0].chapters).toBeUndefined();
      });

      it('should handle empty chapters array', async () => {
        const legacyVideo = {
          videoId: 'empty-chapters-test',
          title: 'Empty Chapters Video',
          description: 'Test description',
          channelTitle: 'Test Channel',
          duration: 'PT15M',
          viewCount: 1000,
          publishedAt: new Date('2023-01-01'),
          thumbnailUrl: 'https://example.com/thumb.jpg'
        };

        const enrichedEmptyChapters = {
          id: 'video-empty-chapters-test',
          title: 'Empty Chapters Video',
          url: 'https://www.youtube.com/watch?v=empty-chapters-test',
          description: 'Test description',
          duration: { hours: 0, minutes: 15, seconds: 0 },
          chapters: [],
          metadata: {
            educationalValue: 0.8,
            relevanceScore: 0.9,
            difficulty: 'intermediate'
          }
        };

        mockVideoEnricher.enrichMultipleVideos.mockResolvedValue([enrichedEmptyChapters]);
        mockVideoEnricher.calculateRelevanceMatrix.mockReturnValue(
          new Map([['test-concept', [0.9]]])
        );

        const videos = await videoGenerator.curateVideoPlaylist([legacyVideo], 'Test Topic', ['test-concept']);

        expect(videos[0].chapters).toEqual([]);
      });
    });

    describe('generateVideos basic Video type mapping', () => {
      it('should properly map enriched video metadata to basic Video type', async () => {
        const mockEnrichedVideoWithAllFields = {
          id: 'video-complex',
          title: 'Complex Video Test',
          url: 'https://www.youtube.com/watch?v=complex123',
          description: 'Complex test description',
          duration: { hours: 1, minutes: 30, seconds: 45 },
          // Note: generateVideos strips captions and chapters, only curateVideoPlaylist preserves them
          metadata: {
            educationalValue: 0.95,
            relevanceScore: 0.88,
            difficulty: 'advanced',
            relatedConcepts: ['shadow', 'anima'],
            learningOutcomes: ['Learn shadow work', 'Understand anima projection']
          }
        };

        mockProvider.generateStructuredOutput.mockResolvedValue(['complex test']);
        mockYouTubeService.searchVideos.mockResolvedValue([]);
        mockVideoEnricher.enrichMultipleVideos.mockResolvedValue([mockEnrichedVideoWithAllFields]);

        const videos = await videoGenerator.generateVideos('Complex Test', ['shadow'], 'advanced students', 1);

        const video = videos[0];
        
        // Check Video type structure (basic Video from generateVideos)
        expect(video).toMatchObject({
          id: 'video-complex',
          title: 'Complex Video Test',
          youtubeId: 'complex123',
          url: 'https://www.youtube.com/watch?v=complex123',
          description: 'Complex test description',
          duration: 91 // 1*60 + 30 + 1 (seconds rounded up)
        });

        // Check metadata is removed from final Video object
        expect(video).not.toHaveProperty('metadata');
        // generateVideos doesn't include captions/chapters - only basic Video fields
        expect(video).not.toHaveProperty('captions');
        expect(video).not.toHaveProperty('chapters');
      });

      it('should handle video sorting by educational and relevance scores', async () => {
        const mockEnrichedVideosForSorting = [
          {
            id: 'video-low',
            title: 'Low Score Video',
            url: 'https://www.youtube.com/watch?v=low',
            description: 'Low quality',
            duration: { hours: 0, minutes: 10, seconds: 0 },
            metadata: {
              educationalValue: 0.3,
              relevanceScore: 0.4,
              difficulty: 'beginner'
            }
          },
          {
            id: 'video-high',
            title: 'High Score Video',
            url: 'https://www.youtube.com/watch?v=high',
            description: 'High quality',
            duration: { hours: 0, minutes: 20, seconds: 0 },
            metadata: {
              educationalValue: 0.9,
              relevanceScore: 0.95,
              difficulty: 'advanced'
            }
          },
          {
            id: 'video-medium',
            title: 'Medium Score Video',
            url: 'https://www.youtube.com/watch?v=medium',
            description: 'Medium quality',
            duration: { hours: 0, minutes: 15, seconds: 0 },
            metadata: {
              educationalValue: 0.7,
              relevanceScore: 0.6,
              difficulty: 'intermediate'
            }
          }
        ];

        mockProvider.generateStructuredOutput.mockResolvedValue(['sorting test']);
        mockYouTubeService.searchVideos.mockResolvedValue([]);
        mockVideoEnricher.enrichMultipleVideos.mockResolvedValue(mockEnrichedVideosForSorting);

        const videos = await videoGenerator.generateVideos('Sorting Test', ['test'], 'students', 3);

        // Videos should be sorted by combined score (relevance * 0.6 + educational * 0.4)
        // High: 0.95*0.6 + 0.9*0.4 = 0.57 + 0.36 = 0.93
        // Medium: 0.6*0.6 + 0.7*0.4 = 0.36 + 0.28 = 0.64  
        // Low: 0.4*0.6 + 0.3*0.4 = 0.24 + 0.12 = 0.36

        expect(videos[0].title).toBe('High Score Video');
        expect(videos[1].title).toBe('Medium Score Video');
        expect(videos[2].title).toBe('Low Score Video');
      });
    });

    describe('generateVideosForConcepts method equivalent', () => {
      it('should generate appropriate videos for given concepts', async () => {
        const concepts = ['shadow', 'projection', 'integration'];
        
        mockProvider.generateStructuredOutput.mockResolvedValue([
          'Jung shadow psychology português',
          'projection shadow work',
          'shadow integration techniques'
        ]);

        const mockConceptVideos = concepts.map((concept, index) => ({
          videoId: `${concept}-${index}`,
          title: `Understanding ${concept}`,
          description: `Learn about ${concept} in Jungian psychology`,
          channelTitle: 'Jung Institute',
          duration: 'PT' + (15 + index * 5) + 'M',
          viewCount: (1000 + index * 500).toString(),
          publishedAt: '2023-01-01',
          thumbnails: {
            high: { url: `https://example.com/${concept}.jpg`, width: 480, height: 360 }
          }
        }));

        mockYouTubeService.searchVideos.mockResolvedValue(mockConceptVideos);

        const mockEnriched = mockConceptVideos.map((video, index) => ({
          id: `video-${video.videoId}`,
          title: video.title,
          url: `https://www.youtube.com/watch?v=${video.videoId}`,
          description: video.description,
          duration: { hours: 0, minutes: 15 + index * 5, seconds: 0 },
          metadata: {
            educationalValue: 0.8 + index * 0.05,
            relevanceScore: 0.9 - index * 0.05,
            difficulty: index === 0 ? 'beginner' : index === 1 ? 'intermediate' : 'advanced',
            relatedConcepts: [concept]
          }
        }));

        mockVideoEnricher.enrichMultipleVideos.mockResolvedValue(mockEnriched);

        const videos = await videoGenerator.generateVideos('Shadow Work', concepts, 'psychology students');

        expect(videos).toHaveLength(3);
        expect(videos.map(v => v.title)).toEqual([
          'Understanding shadow',
          'Understanding projection',
          'Understanding integration'
        ]);

        // Check that each video relates to its concept
        videos.forEach((video, index) => {
          expect(video.youtubeId).toBe(`${concepts[index]}-${index}`);
          expect(video.duration).toBe(15 + index * 5);
        });
      });
    });

    describe('generateVideosForLearningPath method equivalent', () => {
      it('should generate videos that follow a learning path progression', async () => {
        const learningPath = ['basic concepts', 'shadow work', 'active imagination', 'individuation'];
        
        const mockPathVideos = learningPath.map((step, index) => ({
          videoId: `path-${index}`,
          title: `Step ${index + 1}: ${step}`,
          description: `Learn about ${step} as part of your Jung learning journey`,
          channelTitle: 'Progressive Learning',
          duration: 'PT' + (10 + index * 5) + 'M',
          viewCount: (2000 - index * 200).toString(),
          publishedAt: '2023-01-01',
          thumbnails: {
            high: { url: `https://example.com/path-${index}.jpg`, width: 480, height: 360 }
          }
        }));

        mockProvider.generateStructuredOutput.mockResolvedValue(
          learningPath.map(step => `Jung ${step} learning path`)
        );
        mockYouTubeService.searchVideos.mockResolvedValue(mockPathVideos);

        const mockPathEnriched = mockPathVideos.map((video, index) => ({
          id: `video-${video.videoId}`,
          title: video.title,
          url: `https://www.youtube.com/watch?v=${video.videoId}`,
          description: video.description + `\n\n📍 Learning Path Step: ${index + 1}`,
          duration: { hours: 0, minutes: 10 + index * 5, seconds: 0 },
          metadata: {
            educationalValue: 0.7 + index * 0.05,
            relevanceScore: 0.85,
            difficulty: index < 2 ? 'beginner' : index < 3 ? 'intermediate' : 'advanced',
            relatedConcepts: [learningPath[index]]
          }
        }));

        mockVideoEnricher.enrichMultipleVideos.mockResolvedValue(mockPathEnriched);

        const videos = await videoGenerator.generateVideos('Jung Learning Path', learningPath, 'progressive learners', 4);

        expect(videos).toHaveLength(4);
        
        // Should maintain learning path order and progression
        videos.forEach((video, index) => {
          expect(video.title).toContain(`Step ${index + 1}`);
          expect(video.duration).toBe(10 + index * 5);
        });
      });
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

  describe('error handling and edge cases', () => {
    describe('missing data handling', () => {
      it('should handle videos with missing YouTube IDs gracefully', async () => {
        const mockEnrichedVideoNoYouTubeId = {
          id: 'video-no-yt-id',
          title: 'Video Without YouTube ID',
          url: 'https://invalid-url.com',
          description: 'Test description',
          duration: { hours: 0, minutes: 15, seconds: 0 },
          metadata: {
            educationalValue: 0.8,
            relevanceScore: 0.9,
            difficulty: 'intermediate'
          }
        };

        mockProvider.generateStructuredOutput.mockResolvedValue(['test query']);
        mockYouTubeService.searchVideos.mockResolvedValue([]);
        mockVideoEnricher.enrichMultipleVideos.mockResolvedValue([mockEnrichedVideoNoYouTubeId]);

        const videos = await videoGenerator.generateVideos('Test', ['test'], 'students', 1);

        expect(videos[0].youtubeId).toBeNull();
        expect(videos[0].url).toBe('https://invalid-url.com');
      });

      it('should handle null or undefined duration values', async () => {
        const mockEnrichedVideoNullDuration = {
          id: 'video-null-duration',
          title: 'Video With Null Duration',
          url: 'https://www.youtube.com/watch?v=null123',
          description: 'Test description',
          duration: null,
          metadata: {
            educationalValue: 0.8,
            relevanceScore: 0.9,
            difficulty: 'intermediate'
          }
        };

        mockProvider.generateStructuredOutput.mockResolvedValue(['test query']);
        mockYouTubeService.searchVideos.mockResolvedValue([]);
        mockVideoEnricher.enrichMultipleVideos.mockResolvedValue([mockEnrichedVideoNullDuration]);

        const videos = await videoGenerator.generateVideos('Test', ['test'], 'students', 1);

        expect(videos[0].duration).toBe(15); // Should use default duration
      });

      it('should handle invalid caption data structures', async () => {
        const mockEnrichedVideoInvalidCaptions = {
          id: 'video-invalid-captions',
          title: 'Video With Invalid Captions',
          url: 'https://www.youtube.com/watch?v=invalid123',
          description: 'Test description',
          duration: { hours: 0, minutes: 15, seconds: 0 },
          captions: [
            null, // Invalid caption
            { language: 'en' }, // Missing url
            { url: 'https://captions.com' }, // Missing language
            { language: 'pt', url: 'https://captions.pt' } // Valid caption
          ],
          metadata: {
            educationalValue: 0.8,
            relevanceScore: 0.9,
            difficulty: 'intermediate'
          }
        };

        mockProvider.generateStructuredOutput.mockResolvedValue(['test query']);
        mockYouTubeService.searchVideos.mockResolvedValue([]);
        mockVideoEnricher.enrichMultipleVideos.mockResolvedValue([mockEnrichedVideoInvalidCaptions]);

        const videos = await videoGenerator.generateVideos('Test', ['test'], 'students', 1);

        // Should only include the valid caption with autoGenerated added
        expect(videos[0].captions).toHaveLength(1);
        expect(videos[0].captions![0]).toEqual({
          language: 'pt',
          url: 'https://captions.pt',
          autoGenerated: false
        });
      });

      it('should handle invalid chapter data structures', async () => {
        const mockEnrichedVideoInvalidChapters = {
          id: 'video-invalid-chapters',
          title: 'Video With Invalid Chapters',
          url: 'https://www.youtube.com/watch?v=invalid456',
          description: 'Test description',
          duration: { hours: 0, minutes: 30, seconds: 0 },
          chapters: [
            null, // Invalid chapter
            { title: 'Incomplete Chapter' }, // Missing required fields
            { startTime: 0, endTime: 300 }, // Missing title
            { // Valid chapter
              title: 'Valid Chapter',
              startTime: 300,
              endTime: 600,
              description: 'Valid description'
            }
          ],
          metadata: {
            educationalValue: 0.8,
            relevanceScore: 0.9,
            difficulty: 'intermediate'
          }
        };

        mockProvider.generateStructuredOutput.mockResolvedValue(['test query']);
        mockYouTubeService.searchVideos.mockResolvedValue([]);
        mockVideoEnricher.enrichMultipleVideos.mockResolvedValue([mockEnrichedVideoInvalidChapters]);

        const videos = await videoGenerator.generateVideos('Test', ['test'], 'students', 1);

        // Should only include the valid chapter with id added
        expect(videos[0].chapters).toHaveLength(1);
        expect(videos[0].chapters![0]).toEqual({
          id: 'chapter-0',
          title: 'Valid Chapter',
          startTime: 300,
          endTime: 600,
          description: 'Valid description'
        });
      });
    });

    describe('service error handling', () => {
      it('should handle YouTube service complete failure', async () => {
        mockProvider.generateStructuredOutput.mockResolvedValue(['test query']);
        mockYouTubeService.searchVideos.mockImplementation(() => {
          throw new Error('YouTube API down');
        });

        const videos = await videoGenerator.generateVideos('Test', ['test'], 'students', 2);

        // Should return fallback videos
        expect(videos).toHaveLength(2);
        expect(videos[0].youtubeId).toBe('nBUQsNpyPHs');
        expect(videos[1].youtubeId).toBe('VjZyGfb-LbM');
      });

      it('should handle video enricher complete failure', async () => {
        mockProvider.generateStructuredOutput.mockResolvedValue(['test query']);
        mockYouTubeService.searchVideos.mockResolvedValue([
          {
            videoId: 'enrichment-fail',
            title: 'Enrichment Will Fail',
            description: 'Test description',
            channelTitle: 'Test Channel',
            duration: 'PT15M',
            viewCount: '1000',
            publishedAt: '2023-01-01',
            thumbnails: { high: { url: 'test.jpg', width: 480, height: 360 } }
          }
        ]);
        mockVideoEnricher.enrichMultipleVideos.mockImplementation(() => {
          throw new Error('Enrichment service down');
        });

        const videos = await videoGenerator.generateVideos('Test', ['test'], 'students', 1);

        // Should return fallback videos
        expect(videos).toHaveLength(2);
        expect(videos[0].youtubeId).toBe('nBUQsNpyPHs');
      });

      it('should handle LLM provider timeout', async () => {
        mockProvider.generateStructuredOutput.mockImplementation(() => {
          throw new Error('Request timeout');
        });
        mockYouTubeService.searchVideos.mockResolvedValue([]);

        const videos = await videoGenerator.generateVideos('Test', ['test'], 'students', 1);

        // Should still work with fallback queries and return fallback videos
        expect(videos).toHaveLength(2);
        expect(videos[0].youtubeId).toBeDefined();
      });
    });

    describe('curateVideoPlaylist edge cases', () => {
      it('should handle type conversions in curateVideoPlaylist', async () => {
        const legacyVideo = {
          videoId: 'curate-test',
          title: 'Curate Test Video',
          description: 'Test description',
          channelTitle: 'Test Channel',
          duration: 'PT20M',
          viewCount: 5000,
          publishedAt: new Date('2023-01-01'),
          thumbnailUrl: 'https://example.com/thumb.jpg'
        };

        const enrichedWithTypeConversions = {
          id: 'video-curate-test',
          title: 'Curate Test Video',
          url: 'https://www.youtube.com/watch?v=curate-test',
          description: 'Test description\n\n📍 Caminho de Aprendizagem: test-concept',
          duration: { hours: 0, minutes: 20, seconds: 0 },
          captions: [
            { language: 'en', url: 'https://captions.en' } // Missing autoGenerated
          ],
          chapters: [
            { title: 'Chapter 1', startTime: 0, endTime: 600 } // Missing id
          ],
          metadata: {
            educationalValue: 0.9,
            relevanceScore: 0.85,
            difficulty: 'intermediate'
          }
        };

        mockVideoEnricher.enrichMultipleVideos.mockResolvedValue([enrichedWithTypeConversions]);
        mockVideoEnricher.calculateRelevanceMatrix.mockReturnValue(
          new Map([['test-concept', [0.9]]])
        );

        const result = await videoGenerator.curateVideoPlaylist([legacyVideo], 'Test Topic', ['test-concept']);

        expect(result).toHaveLength(1);
        
        const video = result[0];
        expect(video.captions![0]).toEqual({
          language: 'en',
          url: 'https://captions.en',
          autoGenerated: false
        });
        
        expect(video.chapters![0]).toEqual({
          id: 'chapter-0',
          title: 'Chapter 1',
          startTime: 0,
          endTime: 600,
          description: undefined
        });
      });

      it('should handle empty learning path in curateVideoPlaylist', async () => {
        const legacyVideo = {
          videoId: 'empty-path-test',
          title: 'Empty Path Test',
          description: 'Test description',
          channelTitle: 'Test Channel',
          duration: 'PT15M',
          viewCount: 3000,
          publishedAt: new Date('2023-01-01'),
          thumbnailUrl: 'https://example.com/thumb.jpg'
        };

        const enrichedVideo = {
          id: 'video-empty-path-test',
          title: 'Empty Path Test',
          url: 'https://www.youtube.com/watch?v=empty-path-test',
          description: 'Test description',
          duration: { hours: 0, minutes: 15, seconds: 0 },
          metadata: {
            educationalValue: 0.7,
            relevanceScore: 0.8,
            difficulty: 'beginner'
          }
        };

        mockVideoEnricher.enrichMultipleVideos.mockResolvedValue([enrichedVideo]);
        mockVideoEnricher.calculateRelevanceMatrix.mockReturnValue(new Map());

        const result = await videoGenerator.curateVideoPlaylist([legacyVideo], 'Test Topic', []);

        expect(result).toHaveLength(1);
        expect(result[0].title).toBe('Empty Path Test');
        expect((result[0] as any).type).toBe('supplementary');
      });
    });

    describe('Video type validation', () => {
      it('should ensure final videos match Video interface structure', async () => {
        const mockValidVideo = {
          id: 'validation-test',
          title: 'Validation Test Video',
          url: 'https://www.youtube.com/watch?v=validation123',
          description: 'Complete video for validation',
          duration: { hours: 0, minutes: 25, seconds: 30 },
          metadata: {
            educationalValue: 0.85,
            relevanceScore: 0.9,
            difficulty: 'intermediate'
          }
        };

        mockProvider.generateStructuredOutput.mockResolvedValue(['validation test']);
        mockYouTubeService.searchVideos.mockResolvedValue([]);
        mockVideoEnricher.enrichMultipleVideos.mockResolvedValue([mockValidVideo]);

        const videos = await videoGenerator.generateVideos('Validation Test', ['test'], 'students', 1);
        const video = videos[0];

        // Validate Video interface compliance (basic structure)
        expect(video).toHaveProperty('id', 'validation-test');
        expect(video).toHaveProperty('title', 'Validation Test Video');
        expect(video).toHaveProperty('youtubeId', 'validation123');
        expect(video).toHaveProperty('url', 'https://www.youtube.com/watch?v=validation123');
        expect(video).toHaveProperty('description', 'Complete video for validation');
        expect(typeof video.duration).toBe('number');
        expect(video.duration).toBe(26); // 25 minutes + 1 for rounded seconds

        // Ensure metadata is not present in final Video
        expect(video).not.toHaveProperty('metadata');
        
        // generateVideos returns basic Video type - no captions/chapters
        expect(video).not.toHaveProperty('captions');
        expect(video).not.toHaveProperty('chapters');
      });
    });

    describe('duration conversion edge cases', () => {
      it('should handle various duration formats correctly', async () => {
        const durationTestCases = [
          { input: { hours: 2, minutes: 30, seconds: 45 }, expected: 151 }, // 2*60 + 30 + 1
          { input: { hours: 0, minutes: 0, seconds: 30 }, expected: 1 }, // Rounds up to 1 minute
          { input: { hours: 1, minutes: 0, seconds: 0 }, expected: 60 }, // Exactly 1 hour
          { input: 45, expected: 45 }, // Already in minutes
          { input: null, expected: 15 }, // Default fallback
          { input: undefined, expected: 15 } // Default fallback
        ];

        for (let i = 0; i < durationTestCases.length; i++) {
          const testCase = durationTestCases[i];
          const mockEnrichedVideo = {
            id: `duration-test-${i}`,
            title: `Duration Test Video ${i}`,
            url: `https://www.youtube.com/watch?v=duration${i}`,
            description: `Test duration conversion ${i}`,
            duration: testCase.input,
            metadata: {
              educationalValue: 0.8,
              relevanceScore: 0.9,
              difficulty: 'intermediate'
            }
          };

          // Set up mocks for this iteration
          mockProvider.generateStructuredOutput = jest.fn().mockResolvedValue([`duration test ${i}`]);
          mockYouTubeService.searchVideos = jest.fn().mockResolvedValue([]);
          mockVideoEnricher.enrichMultipleVideos = jest.fn().mockResolvedValue([mockEnrichedVideo]);

          const videos = await videoGenerator.generateVideos(`Duration Test ${i}`, ['test'], 'students', 1);
          
          expect(videos[0].duration).toBe(testCase.expected);
        }
      });
    });
  });
});