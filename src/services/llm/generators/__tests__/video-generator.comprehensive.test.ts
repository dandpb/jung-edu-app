import { VideoGenerator, YouTubeSearchResult } from '../video-generator';
import { ILLMProvider } from '../../types';
import { YouTubeService, YouTubeVideo } from '../../../video/youtubeService';
import { VideoEnricher, VideoMetadata, EnrichmentOptions } from '../../../video/videoEnricher';
import { Video, VideoCaption, Chapter } from '../../../../types';

// Mock dependencies
jest.mock('../../../video/youtubeService');
jest.mock('../../../video/videoEnricher');

describe('VideoGenerator - Comprehensive Test Suite', () => {
  let videoGenerator: VideoGenerator;
  let mockProvider: jest.Mocked<ILLMProvider>;
  let mockYouTubeService: jest.Mocked<YouTubeService>;
  let mockVideoEnricher: jest.Mocked<VideoEnricher>;

  // Test data constants
  const VALID_YOUTUBE_VIDEO: YouTubeVideo = {
    videoId: 'abc123',
    title: 'Jung Shadow Psychology Explained',
    description: 'Deep dive into Carl Jung\'s shadow archetype',
    channelId: 'UCTest123',
    channelTitle: 'Psychology Academy',
    publishedAt: '2023-06-15T10:00:00Z',
    duration: 'PT25M30S',
    viewCount: '50000',
    likeCount: '2500',
    thumbnails: {
      default: { url: 'https://i.ytimg.com/vi/abc123/default.jpg', width: 120, height: 90 },
      medium: { url: 'https://i.ytimg.com/vi/abc123/mqdefault.jpg', width: 320, height: 180 },
      high: { url: 'https://i.ytimg.com/vi/abc123/hqdefault.jpg', width: 480, height: 360 }
    },
    tags: ['jung', 'shadow', 'psychology', 'archetype'],
    categoryId: '27'
  };

  const ENRICHED_VIDEO_METADATA: VideoMetadata = {
    educationalValue: 0.85,
    relevanceScore: 0.9,
    difficulty: 'intermediate' as const,
    relatedConcepts: ['shadow', 'persona', 'projection'],
    suggestedPrerequisites: ['Basic understanding of Jungian psychology'],
    learningOutcomes: [
      'Understand the shadow archetype',
      'Identify shadow projections',
      'Learn integration techniques'
    ],
    keyTimestamps: [
      { time: 0, topic: 'Introduction', description: 'Overview of shadow concept' },
      { time: 300, topic: 'Shadow Formation', description: 'How shadows develop' },
      { time: 900, topic: 'Integration', description: 'Working with the shadow' }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();

    // Mock LLM Provider
    mockProvider = {
      generateStructuredOutput: jest.fn(),
      generateCompletion: jest.fn(),
      getTokenCount: jest.fn().mockReturnValue(100),
      isAvailable: jest.fn().mockResolvedValue(true),
    } as any;

    // Mock YouTube Service
    mockYouTubeService = {
      searchVideos: jest.fn(),
      getVideoById: jest.fn(),
      searchEducationalChannels: jest.fn(),
      getPlaylistVideos: jest.fn(),
      getVideoDetails: jest.fn(),
      getVideoTranscript: jest.fn(),
      getChannelInfo: jest.fn(),
      searchEducationalVideos: jest.fn(),
      getChannelVideos: jest.fn(),
      getRelatedVideos: jest.fn()
    } as any;

    // Mock Video Enricher
    mockVideoEnricher = {
      enrichVideo: jest.fn(),
      enrichMultipleVideos: jest.fn(),
      calculateRelevanceMatrix: jest.fn(),
      generateVideoSummary: jest.fn()
    } as any;

    // Setup constructor mocks
    (YouTubeService as jest.Mock).mockImplementation(() => mockYouTubeService);
    (VideoEnricher as jest.Mock).mockImplementation(() => mockVideoEnricher);

    videoGenerator = new VideoGenerator(mockProvider);
  });

  describe('Video Search Functionality', () => {
    describe('generateSearchQueries', () => {
      it('should generate structured Portuguese queries for pt-BR language', async () => {
        const expectedQueries = [
          'Jung shadow psychology lecture português',
          'shadow archetype explained legendado',
          'Carl Jung shadow work tutorial Brasil'
        ];

        mockProvider.generateStructuredOutput.mockResolvedValue(expectedQueries);

        const result = await (videoGenerator as any).generateSearchQueries(
          'Shadow',
          ['shadow', 'projection', 'persona'],
          'Psychology students',
          'pt-BR'
        );

        expect(mockProvider.generateStructuredOutput).toHaveBeenCalledWith(
          expect.stringContaining('Gere exatamente 8 queries de busca'),
          expect.objectContaining({
            type: 'array',
            items: { type: 'string' },
            minItems: 6,
            maxItems: 10
          }),
          { temperature: 0.5 }
        );

        expect(result).toEqual(expectedQueries);
      });

      it('should generate English queries for en language', async () => {
        const expectedQueries = [
          'Jung shadow psychology lecture',
          'shadow archetype explanation',
          'Carl Jung shadow concepts tutorial'
        ];

        mockProvider.generateStructuredOutput.mockResolvedValue(expectedQueries);

        const result = await (videoGenerator as any).generateSearchQueries(
          'Shadow',
          ['shadow', 'projection'],
          'Students',
          'en'
        );

        expect(mockProvider.generateStructuredOutput).toHaveBeenCalledWith(
          expect.stringContaining('Generate exactly 8 YouTube search queries'),
          expect.any(Object),
          { temperature: 0.5 }
        );

        expect(result).toEqual(expectedQueries);
      });

      it('should handle schema object returned instead of queries', async () => {
        const schema = { type: 'array', items: { type: 'string' } };
        mockProvider.generateStructuredOutput.mockResolvedValue(schema as any);

        const result = await (videoGenerator as any).generateSearchQueries(
          'Dreams',
          ['dream analysis'],
          'Students',
          'pt-BR'
        );

        // Should return fallback queries
        expect(result).toEqual([
          'Dreams Jung psicologia palestra português',
          'Dreams psicologia analítica explicação legendado',
          'Jung Dreams conceitos tutorial Brasil',
          'Dreams processo individuação português',
          'Dreams estudo de caso junguiano legendado',
          'Dreams inconsciente coletivo português',
          'Dreams psicologia moderna pesquisa Brasil',
          'Dreams Jung teoria legendado'
        ]);
      });

      it('should handle non-array responses gracefully', async () => {
        mockProvider.generateStructuredOutput.mockResolvedValue('invalid response' as any);

        const result = await (videoGenerator as any).generateSearchQueries(
          'Anima',
          ['anima', 'feminine'],
          'Students',
          'en'
        );

        expect(result).toEqual([
          'Anima Jung psychology lecture',
          'Anima analytical psychology explanation',
          'Jung Anima concepts tutorial',
          'Anima individuation process',
          'Jungian Anima case study',
          'Anima collective unconscious',
          'modern Anima psychology research',
          'Anima Jung theory'
        ]);
      });

      it('should handle wrapped queries in object format', async () => {
        const wrappedResponse = {
          queries: ['query1', 'query2', 'query3']
        };
        mockProvider.generateStructuredOutput.mockResolvedValue(wrappedResponse as any);

        const result = await (videoGenerator as any).generateSearchQueries(
          'Persona',
          ['mask'],
          'Students'
        );

        expect(result).toEqual(['query1', 'query2', 'query3']);
      });
    });

    describe('searchYouTubeVideos', () => {
      it('should search multiple queries and return aggregated results', async () => {
        const mockResults = [VALID_YOUTUBE_VIDEO];
        mockYouTubeService.searchVideos.mockResolvedValue(mockResults);

        const queries = ['jung shadow', 'shadow psychology', 'analytical psychology'];
        const results = await videoGenerator.searchYouTubeVideos(queries);

        expect(mockYouTubeService.searchVideos).toHaveBeenCalledTimes(3);
        expect(results).toHaveLength(3); // One result per query

        // Verify format conversion
        expect(results[0]).toEqual({
          videoId: 'abc123',
          title: 'Jung Shadow Psychology Explained',
          description: 'Deep dive into Carl Jung\'s shadow archetype',
          channelTitle: 'Psychology Academy',
          duration: 'PT25M30S',
          viewCount: 50000,
          publishedAt: new Date('2023-06-15T10:00:00Z'),
          thumbnailUrl: 'https://i.ytimg.com/vi/abc123/hqdefault.jpg'
        });
      });

      it('should handle API key parameter', async () => {
        mockYouTubeService.searchVideos.mockResolvedValue([]);

        await videoGenerator.searchYouTubeVideos(['test'], 'fake-api-key');

        expect(mockYouTubeService.searchVideos).toHaveBeenCalledWith('test', {
          maxResults: 5,
          order: 'relevance',
          safeSearch: 'strict'
        });
      });

      it('should handle search failures gracefully', async () => {
        mockYouTubeService.searchVideos.mockRejectedValue(new Error('API Error'));

        const results = await videoGenerator.searchYouTubeVideos(['test query']);

        expect(results).toEqual([]); // Should return empty array on failure
      });
    });
  });

  describe('Content Generation and Enrichment', () => {
    describe('generateVideos', () => {
      beforeEach(() => {
        // Setup default mocks for generateVideos flow
        mockProvider.generateStructuredOutput.mockResolvedValue([
          'Jung shadow psychology português',
          'shadow work explained',
          'shadow integration techniques'
        ]);

        mockYouTubeService.searchVideos.mockResolvedValue([VALID_YOUTUBE_VIDEO]);

        mockVideoEnricher.enrichMultipleVideos.mockResolvedValue([
          {
            id: 'video-abc123',
            title: 'Jung Shadow Psychology Explained',
            url: 'https://www.youtube.com/watch?v=abc123',
            description: 'Deep dive into Carl Jung\'s shadow archetype',
            duration: { hours: 0, minutes: 25, seconds: 30 },
            metadata: ENRICHED_VIDEO_METADATA
          } as any
        ]);
      });

      it('should generate videos with proper YouTube ID extraction', async () => {
        const videos = await videoGenerator.generateVideos(
          'Shadow Psychology',
          ['shadow', 'projection'],
          'Psychology students',
          3,
          'pt-BR'
        );

        expect(videos).toHaveLength(1);
        expect(videos[0]).toMatchObject({
          id: 'video-abc123',
          title: 'Jung Shadow Psychology Explained',
          youtubeId: 'abc123',
          url: 'https://www.youtube.com/watch?v=abc123',
          description: 'Deep dive into Carl Jung\'s shadow archetype',
          duration: 26 // 25 minutes + 1 for rounded seconds
        });
      });

      it('should handle video sorting by combined scores', async () => {
        const mockMultipleVideos = [
          {
            id: 'video-low',
            title: 'Low Quality Video',
            url: 'https://www.youtube.com/watch?v=low',
            description: 'Low quality content',
            duration: { hours: 0, minutes: 10, seconds: 0 },
            metadata: {
              educationalValue: 0.3,
              relevanceScore: 0.4,
              difficulty: 'beginner' as const,
              relatedConcepts: ['basic']
            }
          },
          {
            id: 'video-high',
            title: 'High Quality Video',
            url: 'https://www.youtube.com/watch?v=high',
            description: 'High quality content',
            duration: { hours: 0, minutes: 20, seconds: 0 },
            metadata: {
              educationalValue: 0.9,
              relevanceScore: 0.95,
              difficulty: 'advanced' as const,
              relatedConcepts: ['advanced']
            }
          }
        ];

        mockVideoEnricher.enrichMultipleVideos.mockResolvedValue(mockMultipleVideos as any);

        const videos = await videoGenerator.generateVideos(
          'Test Topic',
          ['test'],
          'Students',
          2
        );

        // Videos should be sorted by combined score (relevance * 0.6 + educational * 0.4)
        // High: 0.95*0.6 + 0.9*0.4 = 0.93
        // Low: 0.4*0.6 + 0.3*0.4 = 0.36
        expect(videos[0].title).toBe('High Quality Video');
        expect(videos[1].title).toBe('Low Quality Video');
      });

      it('should handle caption and chapter data correctly', async () => {
        const videoWithCaptionsAndChapters = {
          id: 'video-complete',
          title: 'Complete Video',
          url: 'https://www.youtube.com/watch?v=complete',
          description: 'Complete video with all features',
          duration: { hours: 0, minutes: 30, seconds: 0 },
          captions: [
            { language: 'en', url: 'https://captions.com/en' },
            { language: 'pt', url: 'https://captions.com/pt', autoGenerated: true }
          ],
          chapters: [
            { title: 'Introduction', startTime: 0, endTime: 300, description: 'Intro' },
            { id: 'existing-id', title: 'Main Content', startTime: 300, endTime: 1200 }
          ],
          metadata: ENRICHED_VIDEO_METADATA
        };

        mockVideoEnricher.enrichMultipleVideos.mockResolvedValue([videoWithCaptionsAndChapters] as any);

        const videos = await videoGenerator.generateVideos('Test', ['test'], 'Students', 1);

        // Check captions are properly converted
        expect(videos[0].captions).toHaveLength(2);
        expect(videos[0].captions![0]).toEqual({
          language: 'en',
          url: 'https://captions.com/en',
          autoGenerated: false // Should be added
        });
        expect(videos[0].captions![1]).toEqual({
          language: 'pt',
          url: 'https://captions.com/pt',
          autoGenerated: true // Should remain
        });

        // Check chapters are properly converted
        expect(videos[0].chapters).toHaveLength(2);
        expect(videos[0].chapters![0]).toEqual({
          id: 'chapter-0', // Should be generated
          title: 'Introduction',
          startTime: 0,
          endTime: 300,
          description: 'Intro'
        });
        expect(videos[0].chapters![1]).toEqual({
          id: 'existing-id', // Should remain
          title: 'Main Content',
          startTime: 300,
          endTime: 1200,
          description: undefined
        });
      });

      it('should filter out invalid captions and chapters', async () => {
        const videoWithInvalidData = {
          id: 'video-invalid',
          title: 'Video with Invalid Data',
          url: 'https://www.youtube.com/watch?v=invalid',
          description: 'Test description',
          duration: { hours: 0, minutes: 15, seconds: 0 },
          captions: [
            null, // Invalid
            { language: 'en' }, // Missing url
            { url: 'https://captions.com' }, // Missing language
            { language: 'pt', url: 'https://captions.pt' } // Valid
          ],
          chapters: [
            null, // Invalid
            { title: 'Incomplete' }, // Missing required fields
            { startTime: 0, endTime: 300 }, // Missing title
            { title: 'Valid Chapter', startTime: 300, endTime: 600 } // Valid
          ],
          metadata: ENRICHED_VIDEO_METADATA
        };

        mockVideoEnricher.enrichMultipleVideos.mockResolvedValue([videoWithInvalidData] as any);

        const videos = await videoGenerator.generateVideos('Test', ['test'], 'Students', 1);

        // Should only include valid captions
        expect(videos[0].captions).toHaveLength(1);
        expect(videos[0].captions![0]).toEqual({
          language: 'pt',
          url: 'https://captions.pt',
          autoGenerated: false
        });

        // Should only include valid chapters
        expect(videos[0].chapters).toHaveLength(1);
        expect(videos[0].chapters![0]).toEqual({
          id: 'chapter-0',
          title: 'Valid Chapter',
          startTime: 300,
          endTime: 600,
          description: undefined
        });
      });

      it('should handle empty search results with fallback videos', async () => {
        mockYouTubeService.searchVideos.mockResolvedValue([]);
        mockVideoEnricher.enrichMultipleVideos.mockResolvedValue([]);

        const videos = await videoGenerator.generateVideos(
          'Obscure Topic',
          ['rare concept'],
          'Students',
          2,
          'pt-BR'
        );

        expect(videos).toHaveLength(2);
        expect(videos[0].youtubeId).toBe('nBUQsNpyPHs');
        expect(videos[1].youtubeId).toBe('VjZyGfb-LbM');
        expect(videos[0].title).toContain('Obscure Topic');
      });

      it('should handle enrichment service failures', async () => {
        mockVideoEnricher.enrichMultipleVideos.mockRejectedValue(new Error('Enrichment failed'));

        const videos = await videoGenerator.generateVideos(
          'Test Topic',
          ['test'],
          'Students',
          1
        );

        // Should return fallback videos
        expect(videos).toHaveLength(2);
        expect(videos[0].youtubeId).toBe('nBUQsNpyPHs');
      });

      it('should handle LLM provider failures', async () => {
        mockProvider.generateStructuredOutput.mockRejectedValue(new Error('LLM timeout'));

        const videos = await videoGenerator.generateVideos(
          'Test Topic',
          ['test'],
          'Students',
          2
        );

        // Should still work with fallback queries
        expect(mockYouTubeService.searchVideos).toHaveBeenCalled();
      });
    });

    describe('curateVideoPlaylist', () => {
      const mockLegacyVideo: YouTubeSearchResult = {
        videoId: 'playlist-test',
        title: 'Playlist Video',
        description: 'Test video for playlist',
        channelTitle: 'Test Channel',
        duration: 'PT20M',
        viewCount: 10000,
        publishedAt: new Date('2023-01-01'),
        thumbnailUrl: 'https://example.com/thumb.jpg'
      };

      beforeEach(() => {
        mockVideoEnricher.enrichMultipleVideos.mockResolvedValue([
          {
            id: 'playlist-test',
            title: 'Playlist Video',
            url: 'https://www.youtube.com/watch?v=playlist-test',
            description: 'Test video for playlist',
            duration: { hours: 0, minutes: 20, seconds: 0 },
            metadata: {
              educationalValue: 0.8,
              relevanceScore: 0.9,
              difficulty: 'intermediate' as const,
              relatedConcepts: ['test-concept']
            }
          } as any
        ]);

        mockVideoEnricher.calculateRelevanceMatrix.mockReturnValue(
          new Map([['test-concept', [0.9]]])
        );
      });

      it('should curate videos based on learning path', async () => {
        const curatedVideos = await videoGenerator.curateVideoPlaylist(
          [mockLegacyVideo],
          'Test Topic',
          ['test-concept']
        );

        expect(curatedVideos).toHaveLength(1);
        expect(curatedVideos[0].description).toContain('📍 Caminho de Aprendizagem: test-concept');
        expect(mockVideoEnricher.calculateRelevanceMatrix).toHaveBeenCalled();
      });

      it('should mark unused videos as supplementary', async () => {
        const multipleVideos = [
          mockLegacyVideo,
          { ...mockLegacyVideo, videoId: 'extra-video', title: 'Extra Video' }
        ];

        mockVideoEnricher.enrichMultipleVideos.mockResolvedValue([
          {
            id: 'playlist-test',
            title: 'Playlist Video',
            url: 'https://www.youtube.com/watch?v=playlist-test',
            description: 'Test video for playlist',
            duration: { hours: 0, minutes: 20, seconds: 0 },
            metadata: { educationalValue: 0.8, relevanceScore: 0.9, difficulty: 'intermediate' as const, relatedConcepts: [] }
          },
          {
            id: 'extra-video',
            title: 'Extra Video',
            url: 'https://www.youtube.com/watch?v=extra-video',
            description: 'Extra video',
            duration: { hours: 0, minutes: 15, seconds: 0 },
            metadata: { educationalValue: 0.7, relevanceScore: 0.8, difficulty: 'beginner' as const, relatedConcepts: [] }
          }
        ] as any);

        const curatedVideos = await videoGenerator.curateVideoPlaylist(
          multipleVideos,
          'Test Topic',
          ['test-concept']
        );

        expect(curatedVideos).toHaveLength(2);
        const supplementaryVideo = curatedVideos.find((v: any) => v.type === 'supplementary');
        expect(supplementaryVideo).toBeDefined();
      });

      it('should handle empty learning paths', async () => {
        const curatedVideos = await videoGenerator.curateVideoPlaylist(
          [mockLegacyVideo],
          'Test Topic',
          []
        );

        expect(curatedVideos).toHaveLength(1);
        expect((curatedVideos[0] as any).type).toBe('supplementary');
      });
    });
  });

  describe('Advanced Features', () => {
    describe('discoverEducationalChannels', () => {
      it('should discover and format educational channels', async () => {
        const mockChannels = [
          {
            channelId: 'UC123',
            title: 'Jung Institute',
            description: 'Educational Jungian content',
            subscriberCount: '100000',
            videoCount: '500'
          }
        ];

        mockYouTubeService.searchEducationalChannels.mockResolvedValue(mockChannels);

        const channels = await videoGenerator.discoverEducationalChannels('Shadow Work', 5);

        expect(channels).toHaveLength(1);
        expect(channels[0]).toEqual({
          channelId: 'UC123',
          channelTitle: 'Jung Institute',
          description: 'Educational Jungian content'
        });

        expect(mockYouTubeService.searchEducationalChannels).toHaveBeenCalledWith(
          'Shadow Work Jung psychology',
          5
        );
      });

      it('should handle channel discovery failures', async () => {
        mockYouTubeService.searchEducationalChannels.mockRejectedValue(new Error('API Error'));

        const channels = await videoGenerator.discoverEducationalChannels('Test Topic');

        expect(channels).toEqual([]);
      });
    });

    describe('getPlaylistVideos', () => {
      it('should enrich playlist videos and remove metadata', async () => {
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
            metadata: { educationalValue: 0.8, relevanceScore: 0.9, difficulty: 'beginner' as const, relatedConcepts: [] }
          } as any
        ]);

        const videos = await videoGenerator.getPlaylistVideos('PL123', 10);

        expect(videos).toHaveLength(1);
        expect(videos[0].title).toBe('Playlist Video 1');
        expect((videos[0] as any).metadata).toBeUndefined();
      });
    });

    describe('generateProgressiveLearningPath', () => {
      const mockBeginner: YouTubeVideo = {
        ...VALID_YOUTUBE_VIDEO,
        videoId: 'beginner1',
        title: 'Introduction to Jung'
      };

      const mockIntermediate: YouTubeVideo = {
        ...VALID_YOUTUBE_VIDEO,
        videoId: 'intermediate1',
        title: 'Advanced Jung Concepts'
      };

      const mockAdvanced: YouTubeVideo = {
        ...VALID_YOUTUBE_VIDEO,
        videoId: 'advanced1',
        title: 'Clinical Applications'
      };

      it('should generate progressive learning paths', async () => {
        mockYouTubeService.searchVideos
          .mockResolvedValueOnce([mockBeginner])
          .mockResolvedValueOnce([mockIntermediate])
          .mockResolvedValueOnce([mockAdvanced]);

        mockVideoEnricher.enrichMultipleVideos
          .mockResolvedValueOnce([{
            ...mockBeginner,
            id: 'beginner1',
            metadata: { ...ENRICHED_VIDEO_METADATA, difficulty: 'beginner' as const }
          } as any])
          .mockResolvedValueOnce([{
            ...mockIntermediate,
            id: 'intermediate1',
            metadata: { ...ENRICHED_VIDEO_METADATA, difficulty: 'intermediate' as const }
          } as any])
          .mockResolvedValueOnce([{
            ...mockAdvanced,
            id: 'advanced1',
            metadata: { ...ENRICHED_VIDEO_METADATA, difficulty: 'advanced' as const }
          } as any]);

        const learningPath = await videoGenerator.generateProgressiveLearningPath(
          'Individuation',
          ['self', 'ego'],
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

      it('should handle English language queries', async () => {
        mockYouTubeService.searchVideos.mockResolvedValue([]);
        mockVideoEnricher.enrichMultipleVideos.mockResolvedValue([]);

        await videoGenerator.generateProgressiveLearningPath(
          'Dreams',
          ['symbols'],
          'Students',
          'en'
        );

        expect(mockYouTubeService.searchVideos).toHaveBeenCalledWith(
          expect.stringContaining('introduction basics beginner'),
          expect.any(Object)
        );
      });
    });

    describe('getRecommendations', () => {
      it('should generate personalized recommendations based on watch history', async () => {
        const watchedVideo = {
          videoId: 'watched1',
          title: 'Shadow Introduction',
          description: 'Basic shadow concepts',
          channelId: 'ch1',
          channelTitle: 'Psychology Channel',
          tags: ['jung', 'shadow'],
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
          'advanced shadow techniques',
          'shadow integration methods'
        ]);
        mockYouTubeService.searchVideos.mockResolvedValue([VALID_YOUTUBE_VIDEO]);
        mockVideoEnricher.enrichMultipleVideos.mockResolvedValue([
          {
            id: 'video-abc123',
            title: 'Jung Shadow Psychology Explained',
            url: 'https://www.youtube.com/watch?v=abc123',
            description: 'Deep dive into shadow',
            duration: { hours: 0, minutes: 25, seconds: 0 },
            metadata: ENRICHED_VIDEO_METADATA
          } as any
        ]);

        const recommendations = await videoGenerator.getRecommendations(
          ['watched1'],
          'Shadow Work',
          ['shadow', 'integration']
        );

        expect(recommendations).toHaveLength(1);
        expect(recommendations[0].title).toBe('Jung Shadow Psychology Explained');
        expect(mockYouTubeService.getVideoById).toHaveBeenCalledWith('watched1');
      });

      it('should filter out already watched videos', async () => {
        mockYouTubeService.getVideoById.mockResolvedValue(null);
        mockProvider.generateStructuredOutput.mockResolvedValue(['test query']);
        
        // Return a video with ID that's already watched
        const alreadyWatchedVideo = { ...VALID_YOUTUBE_VIDEO, videoId: 'watched1' };
        const newVideo = { ...VALID_YOUTUBE_VIDEO, videoId: 'new123' };
        
        mockYouTubeService.searchVideos.mockResolvedValue([alreadyWatchedVideo, newVideo]);
        mockVideoEnricher.enrichMultipleVideos.mockResolvedValue([
          {
            id: 'video-new123',
            title: 'New Video',
            url: 'https://www.youtube.com/watch?v=new123',
            description: 'New content',
            duration: { hours: 0, minutes: 15, seconds: 0 },
            metadata: ENRICHED_VIDEO_METADATA
          } as any
        ]);

        const recommendations = await videoGenerator.getRecommendations(
          ['watched1'],
          'Test Topic',
          ['test']
        );

        expect(recommendations).toHaveLength(1);
        expect(recommendations[0].title).toBe('New Video');
      });
    });
  });

  describe('Utility Methods and Error Handling', () => {
    describe('extractYouTubeIdFromUrl', () => {
      it('should extract YouTube IDs from various URL formats', () => {
        const testCases = [
          { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', expected: 'dQw4w9WgXcQ' },
          { url: 'https://youtu.be/dQw4w9WgXcQ', expected: 'dQw4w9WgXcQ' },
          { url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', expected: 'dQw4w9WgXcQ' },
          { url: 'https://www.youtube.com/v/dQw4w9WgXcQ', expected: 'dQw4w9WgXcQ' },
          { url: 'invalid-url', expected: null },
          { url: '', expected: null },
          { url: null as any, expected: null }
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
          { duration: 'PT2H15M30S', expected: 136 },
          { duration: 'PT0S', expected: 0 },
          { duration: 'invalid', expected: 0 },
          { duration: '', expected: 0 }
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
          { duration: { hours: 2, minutes: 0, seconds: 45 }, expected: 121 },
          { duration: 45, expected: 45 }, // Already in minutes
          { duration: 'PT20M', expected: 20 }, // ISO string
          { duration: null, expected: 15 }, // Default fallback
          { duration: undefined, expected: 15 }, // Default fallback
          { duration: {}, expected: 15 } // Invalid object
        ];

        testCases.forEach(({ duration, expected }) => {
          const result = (videoGenerator as any).convertDurationToMinutes(duration);
          expect(result).toBe(expected);
        });
      });
    });

    describe('createFallbackVideos', () => {
      it('should create fallback videos with proper structure', () => {
        const fallbackVideos = (videoGenerator as any).createFallbackVideos('Test Topic', 3, 'pt-BR');

        expect(fallbackVideos).toHaveLength(3);
        
        fallbackVideos.forEach((video: Video, index: number) => {
          expect(video).toHaveProperty('id');
          expect(video).toHaveProperty('title');
          expect(video).toHaveProperty('youtubeId');
          expect(video).toHaveProperty('url');
          expect(video).toHaveProperty('description');
          expect(video).toHaveProperty('duration');
          
          expect(video.id).toMatch(/^video-\d+-\d+$/);
          expect(video.title).toContain('Test Topic');
          expect(video.youtubeId).toBeTruthy();
          expect(video.url).toStartWith('https://www.youtube.com/watch?v=');
          expect(typeof video.duration).toBe('number');
        });
      });

      it('should create English fallback videos', () => {
        const fallbackVideos = (videoGenerator as any).createFallbackVideos('Dreams', 2, 'en');

        expect(fallbackVideos).toHaveLength(2);
        expect(fallbackVideos[0].title).toContain('Introduction to Dreams');
        expect(fallbackVideos[0].description).toContain('analytical psychology');
      });

      it('should always return at least 2 videos for error handling', () => {
        const fallbackVideos = (videoGenerator as any).createFallbackVideos('Test', 1);

        expect(fallbackVideos).toHaveLength(2); // Should return 2 even when 1 requested
      });
    });
  });

  describe('Error Scenarios and Edge Cases', () => {
    describe('Service failures', () => {
      it('should handle YouTube service complete failure', async () => {
        mockProvider.generateStructuredOutput.mockResolvedValue(['test query']);
        mockYouTubeService.searchVideos.mockImplementation(() => {
          throw new Error('YouTube API completely down');
        });

        const videos = await videoGenerator.generateVideos('Test', ['test'], 'Students', 2);

        expect(videos).toHaveLength(2);
        expect(videos[0].youtubeId).toBe('nBUQsNpyPHs');
        expect(videos[1].youtubeId).toBe('VjZyGfb-LbM');
      });

      it('should handle video enricher timeout', async () => {
        mockProvider.generateStructuredOutput.mockResolvedValue(['test query']);
        mockYouTubeService.searchVideos.mockResolvedValue([VALID_YOUTUBE_VIDEO]);
        mockVideoEnricher.enrichMultipleVideos.mockImplementation(() => {
          return new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Timeout')), 100);
          });
        });

        const videos = await videoGenerator.generateVideos('Test', ['test'], 'Students', 1);

        expect(videos).toHaveLength(2); // Should fallback
      });

      it('should handle network connectivity issues', async () => {
        mockProvider.generateStructuredOutput.mockRejectedValue(new Error('ENOTFOUND'));
        mockYouTubeService.searchVideos.mockRejectedValue(new Error('Network error'));
        mockVideoEnricher.enrichMultipleVideos.mockRejectedValue(new Error('Connection timeout'));

        const videos = await videoGenerator.generateVideos('Test', ['test'], 'Students', 1);

        expect(videos).toHaveLength(2); // Should use fallback
      });
    });

    describe('Data validation and sanitization', () => {
      it('should handle malformed video data', async () => {
        const malformedVideo = {
          id: null,
          title: undefined,
          url: 'not-a-url',
          description: null,
          duration: 'invalid',
          metadata: {
            educationalValue: 'not-a-number',
            relevanceScore: null,
            difficulty: 'invalid-difficulty',
            relatedConcepts: null
          }
        };

        mockProvider.generateStructuredOutput.mockResolvedValue(['test']);
        mockYouTubeService.searchVideos.mockResolvedValue([]);
        mockVideoEnricher.enrichMultipleVideos.mockResolvedValue([malformedVideo] as any);

        const videos = await videoGenerator.generateVideos('Test', ['test'], 'Students', 1);

        expect(videos).toHaveLength(2); // Should fallback due to malformed data
      });

      it('should handle extremely long video titles and descriptions', async () => {
        const longTitle = 'A'.repeat(1000);
        const longDescription = 'B'.repeat(10000);

        const videoWithLongData = {
          id: 'long-data',
          title: longTitle,
          url: 'https://www.youtube.com/watch?v=longdata',
          description: longDescription,
          duration: { hours: 0, minutes: 15, seconds: 0 },
          metadata: ENRICHED_VIDEO_METADATA
        };

        mockProvider.generateStructuredOutput.mockResolvedValue(['test']);
        mockYouTubeService.searchVideos.mockResolvedValue([]);
        mockVideoEnricher.enrichMultipleVideos.mockResolvedValue([videoWithLongData] as any);

        const videos = await videoGenerator.generateVideos('Test', ['test'], 'Students', 1);

        // Should handle long data gracefully
        expect(videos[0].title.length).toBeLessThanOrEqual(1000);
        expect(videos[0].description.length).toBeLessThanOrEqual(10000);
      });

      it('should handle special characters in video data', async () => {
        const videoWithSpecialChars = {
          id: 'special-chars',
          title: 'Test Video with émojis 🎥 and spéciał chärs',
          url: 'https://www.youtube.com/watch?v=special',
          description: 'Description with <script>alert("xss")</script> and other HTML',
          duration: { hours: 0, minutes: 15, seconds: 0 },
          metadata: ENRICHED_VIDEO_METADATA
        };

        mockProvider.generateStructuredOutput.mockResolvedValue(['test']);
        mockYouTubeService.searchVideos.mockResolvedValue([]);
        mockVideoEnricher.enrichMultipleVideos.mockResolvedValue([videoWithSpecialChars] as any);

        const videos = await videoGenerator.generateVideos('Test', ['test'], 'Students', 1);

        expect(videos[0].title).toBe('Test Video with émojis 🎥 and spéciał chärs');
        expect(videos[0].description).toContain('<script>'); // Should not sanitize HTML (that's UI responsibility)
      });
    });

    describe('Performance and boundary conditions', () => {
      it('should handle large result sets efficiently', async () => {
        const startTime = Date.now();

        // Create 100 mock videos
        const largeVideoSet = Array.from({ length: 100 }, (_, i) => ({
          ...VALID_YOUTUBE_VIDEO,
          videoId: `video-${i}`
        }));

        const largeEnrichedSet = largeVideoSet.map((video, i) => ({
          id: `video-${video.videoId}`,
          title: `Video ${i}`,
          url: `https://www.youtube.com/watch?v=${video.videoId}`,
          description: `Description ${i}`,
          duration: { hours: 0, minutes: 15 + i, seconds: 0 },
          metadata: {
            ...ENRICHED_VIDEO_METADATA,
            educationalValue: 0.5 + (i % 50) / 100 // Vary scores
          }
        }));

        mockProvider.generateStructuredOutput.mockResolvedValue(['test query']);
        mockYouTubeService.searchVideos.mockResolvedValue(largeVideoSet);
        mockVideoEnricher.enrichMultipleVideos.mockResolvedValue(largeEnrichedSet as any);

        const videos = await videoGenerator.generateVideos('Test', ['test'], 'Students', 50);

        const endTime = Date.now();
        const executionTime = endTime - startTime;

        expect(videos).toHaveLength(50);
        expect(executionTime).toBeLessThan(5000); // Should complete within 5 seconds
      });

      it('should handle concurrent video generation requests', async () => {
        const mockConcurrentResponse = {
          id: 'concurrent-test',
          title: 'Concurrent Test Video',
          url: 'https://www.youtube.com/watch?v=concurrent',
          description: 'Test for concurrency',
          duration: { hours: 0, minutes: 10, seconds: 0 },
          metadata: ENRICHED_VIDEO_METADATA
        };

        mockProvider.generateStructuredOutput.mockResolvedValue(['concurrent test']);
        mockYouTubeService.searchVideos.mockResolvedValue([VALID_YOUTUBE_VIDEO]);
        mockVideoEnricher.enrichMultipleVideos.mockResolvedValue([mockConcurrentResponse] as any);

        // Simulate 10 concurrent requests
        const concurrentRequests = Array.from({ length: 10 }, (_, i) =>
          videoGenerator.generateVideos(`Test ${i}`, ['test'], 'Students', 1)
        );

        const results = await Promise.all(concurrentRequests);

        results.forEach((videos, index) => {
          expect(videos).toHaveLength(1);
          expect(videos[0]).toBeDefined();
        });
      });

      it('should handle empty or null inputs gracefully', async () => {
        const edgeCases = [
          { topic: '', concepts: [], audience: '', count: 0 },
          { topic: null as any, concepts: null as any, audience: null as any, count: -1 },
          { topic: undefined as any, concepts: undefined as any, audience: undefined as any, count: undefined as any }
        ];

        for (const testCase of edgeCases) {
          const videos = await videoGenerator.generateVideos(
            testCase.topic,
            testCase.concepts,
            testCase.audience,
            testCase.count
          );

          expect(Array.isArray(videos)).toBe(true);
          expect(videos.length).toBeGreaterThanOrEqual(0);
        }
      });
    });

    describe('Memory and resource management', () => {
      it('should clean up resources after video generation', async () => {
        const initialMemory = process.memoryUsage().heapUsed;

        // Generate videos multiple times to test memory leaks
        for (let i = 0; i < 10; i++) {
          mockProvider.generateStructuredOutput.mockResolvedValue(['test']);
          mockYouTubeService.searchVideos.mockResolvedValue([VALID_YOUTUBE_VIDEO]);
          mockVideoEnricher.enrichMultipleVideos.mockResolvedValue([
            {
              id: `video-${i}`,
              title: `Video ${i}`,
              url: `https://www.youtube.com/watch?v=test${i}`,
              description: `Description ${i}`,
              duration: { hours: 0, minutes: 15, seconds: 0 },
              metadata: ENRICHED_VIDEO_METADATA
            } as any
          ]);

          await videoGenerator.generateVideos('Test', ['test'], 'Students', 1);
        }

        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }

        const finalMemory = process.memoryUsage().heapUsed;
        const memoryIncrease = finalMemory - initialMemory;

        // Memory increase should be reasonable (less than 50MB)
        expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
      });

      it('should handle service timeouts gracefully', async () => {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Service timeout')), 1000);
        });

        mockProvider.generateStructuredOutput.mockReturnValue(timeoutPromise);
        mockYouTubeService.searchVideos.mockReturnValue(timeoutPromise);
        mockVideoEnricher.enrichMultipleVideos.mockReturnValue(timeoutPromise);

        const videos = await videoGenerator.generateVideos('Test', ['test'], 'Students', 1);

        // Should return fallback videos when services timeout
        expect(videos).toHaveLength(2);
        expect(videos[0].youtubeId).toBe('nBUQsNpyPHs');
      });
    });
  });

  describe('Integration with External APIs', () => {
    describe('YouTube Data API integration', () => {
      it('should handle YouTube API quota exceeded', async () => {
        const quotaError = new Error('Quota exceeded');
        (quotaError as any).response = {
          status: 403,
          data: { error: { code: 403, message: 'quotaExceeded' } }
        };

        mockProvider.generateStructuredOutput.mockResolvedValue(['test']);
        mockYouTubeService.searchVideos.mockRejectedValue(quotaError);

        const videos = await videoGenerator.generateVideos('Test', ['test'], 'Students', 1);

        expect(videos).toHaveLength(2); // Should fallback
      });

      it('should handle YouTube API key issues', async () => {
        const keyError = new Error('Invalid API key');
        (keyError as any).response = {
          status: 400,
          data: { error: { code: 400, message: 'Invalid API key' } }
        };

        mockProvider.generateStructuredOutput.mockResolvedValue(['test']);
        mockYouTubeService.searchVideos.mockRejectedValue(keyError);

        const videos = await videoGenerator.generateVideos('Test', ['test'], 'Students', 1);

        expect(videos).toHaveLength(2); // Should fallback
      });
    });

    describe('LLM Provider integration', () => {
      it('should handle LLM rate limiting', async () => {
        const rateLimitError = new Error('Rate limit exceeded');
        (rateLimitError as any).status = 429;

        mockProvider.generateStructuredOutput.mockRejectedValue(rateLimitError);
        mockYouTubeService.searchVideos.mockResolvedValue([VALID_YOUTUBE_VIDEO]);
        mockVideoEnricher.enrichMultipleVideos.mockResolvedValue([
          {
            id: 'fallback-video',
            title: 'Fallback Video',
            url: 'https://www.youtube.com/watch?v=fallback',
            description: 'Fallback description',
            duration: { hours: 0, minutes: 15, seconds: 0 },
            metadata: ENRICHED_VIDEO_METADATA
          } as any
        ]);

        const videos = await videoGenerator.generateVideos('Test', ['test'], 'Students', 1);

        // Should still work with fallback queries
        expect(mockYouTubeService.searchVideos).toHaveBeenCalled();
      });

      it('should validate LLM response formats', async () => {
        const invalidResponses = [
          'not json',
          { invalid: 'structure' },
          null,
          undefined,
          42,
          []
        ];

        for (const invalidResponse of invalidResponses) {
          mockProvider.generateStructuredOutput.mockResolvedValue(invalidResponse as any);
          mockYouTubeService.searchVideos.mockResolvedValue([]);
          mockVideoEnricher.enrichMultipleVideos.mockResolvedValue([]);

          const videos = await videoGenerator.generateVideos('Test', ['test'], 'Students', 1);

          // Should handle invalid responses gracefully
          expect(Array.isArray(videos)).toBe(true);
          expect(videos.length).toBeGreaterThanOrEqual(0);
        }
      });
    });
  });
});