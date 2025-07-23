import { YouTubeService } from '../../../services/video/youtubeService';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('YouTubeService Extended Tests', () => {
  let service: YouTubeService;
  const mockApiKey = 'test-api-key-12345';

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear environment variable to ensure we control the API key
    delete process.env.REACT_APP_YOUTUBE_API_KEY;
  });

  describe('Constructor and initialization', () => {
    it('should initialize with API key from constructor', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      service = new YouTubeService(mockApiKey);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'YouTube Service: Using real API with key:',
        'test-ap...'
      );
      consoleSpy.mockRestore();
    });

    it('should initialize with API key from environment', () => {
      process.env.REACT_APP_YOUTUBE_API_KEY = 'env-api-key';
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      service = new YouTubeService();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'YouTube Service: Using real API with key:',
        'env-api...'
      );
      consoleSpy.mockRestore();
    });

    it('should initialize in mock mode without API key', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      service = new YouTubeService();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'YouTube Service: No API key found, using mock mode'
      );
      consoleSpy.mockRestore();
    });
  });

  describe('searchVideos', () => {
    beforeEach(() => {
      service = new YouTubeService(mockApiKey);
    });

    it('should search videos with default options', async () => {
      const mockSearchResponse = {
        data: {
          items: [
            { id: { videoId: 'video1' } },
            { id: { videoId: 'video2' } }
          ]
        }
      };

      const mockVideosResponse = {
        data: {
          items: [
            {
              id: 'video1',
              snippet: {
                title: 'Jung Psychology Video 1',
                description: 'Description 1',
                channelId: 'channel1',
                channelTitle: 'Channel 1',
                publishedAt: '2023-01-01T00:00:00Z',
                tags: ['jung', 'psychology']
              },
              contentDetails: { duration: 'PT10M30S' },
              statistics: { viewCount: '1000', likeCount: '100' }
            },
            {
              id: 'video2',
              snippet: {
                title: 'Jung Psychology Video 2',
                description: 'Description 2',
                channelId: 'channel2',
                channelTitle: 'Channel 2',
                publishedAt: '2023-01-02T00:00:00Z'
              },
              contentDetails: { duration: 'PT15M' },
              statistics: { viewCount: '2000' }
            }
          ]
        }
      };

      mockedAxios.get
        .mockResolvedValueOnce(mockSearchResponse)
        .mockResolvedValueOnce(mockVideosResponse);

      const results = await service.searchVideos('jung psychology');

      // Verify search API call
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://www.googleapis.com/youtube/v3/search',
        expect.objectContaining({
          params: expect.objectContaining({
            key: mockApiKey,
            q: 'jung psychology',
            part: 'snippet',
            type: 'video',
            maxResults: 10,
            order: 'relevance',
            videoEmbeddable: true,
            safeSearch: 'moderate',
            relevanceLanguage: 'en'
          })
        })
      );

      // Verify videos API call
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://www.googleapis.com/youtube/v3/videos',
        expect.objectContaining({
          params: expect.objectContaining({
            key: mockApiKey,
            id: 'video1,video2',
            part: 'snippet,contentDetails,statistics'
          })
        })
      );

      expect(results).toHaveLength(2);
      expect(results[0].title).toBe('Jung Psychology Video 1');
      expect(results[0].viewCount).toBe('1000');
      expect(results[0].likeCount).toBe('100');
      expect(results[0].tags).toEqual(['jung', 'psychology']);
    });

    it('should cache search results', async () => {
      // Create a new service instance for this test to avoid beforeEach cache clearing
      const cacheTestService = new YouTubeService(mockApiKey);
      
      const mockSearchResponse = {
        data: {
          items: [{ id: { videoId: 'cached-video' } }]
        }
      };

      const mockVideosResponse = {
        data: {
          items: [{
            id: 'cached-video',
            snippet: {
              title: 'Cached Video',
              description: 'Test description',
              channelId: 'test-channel',
              channelTitle: 'Test Channel',
              publishedAt: '2023-01-01T00:00:00Z'
            },
            contentDetails: { duration: 'PT5M' },
            statistics: { viewCount: '1000' }
          }]
        }
      };

      mockedAxios.get
        .mockResolvedValueOnce(mockSearchResponse)
        .mockResolvedValueOnce(mockVideosResponse);

      // First search
      const firstResult = await cacheTestService.searchVideos('cached query');
      expect(mockedAxios.get).toHaveBeenCalledTimes(2); // search + videos
      expect(firstResult).toHaveLength(1);
      expect(firstResult[0].videoId).toBe('cached-video');

      // Second search with same query - should use cache
      mockedAxios.get.mockClear();
      const secondResult = await cacheTestService.searchVideos('cached query');
      expect(mockedAxios.get).not.toHaveBeenCalled();
      expect(secondResult).toEqual(firstResult); // Should return cached result
    });

    it('should handle API errors and switch to mock mode', async () => {
      const apiError = {
        response: {
          data: {
            error: {
              code: 400,
              errors: [{ reason: 'badRequest' }]
            }
          }
        }
      };

      mockedAxios.get.mockRejectedValueOnce(apiError);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      const results = await service.searchVideos('error test');

      expect(consoleSpy).toHaveBeenCalledWith('YouTube API error:', apiError);
      expect(consoleSpy).toHaveBeenCalledWith(
        'YouTube API Key is invalid or not enabled for YouTube Data API v3'
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Switching to mock mode due to API key error'
      );
      
      // Should return mock data
      expect(results.length).toBeGreaterThan(0);
      
      consoleSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    it('should apply all search options', async () => {
      mockedAxios.get.mockResolvedValue({ data: { items: [] } });

      await service.searchVideos('test', {
        maxResults: 20,
        order: 'viewCount',
        videoDuration: 'long',
        videoDefinition: 'high',
        videoEmbeddable: false,
        safeSearch: 'strict',
        channelId: 'test-channel',
        relevanceLanguage: 'es'
      });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            maxResults: 20,
            order: 'viewCount',
            videoDuration: 'long',
            videoDefinition: 'high',
            videoEmbeddable: false,
            safeSearch: 'strict',
            channelId: 'test-channel',
            relevanceLanguage: 'es'
          })
        })
      );
    });
  });

  describe('searchEducationalChannels', () => {
    beforeEach(() => {
      service = new YouTubeService(mockApiKey);
    });

    it('should search for educational channels', async () => {
      const mockSearchResponse = {
        data: {
          items: [
            { id: { channelId: 'ch1' } },
            { id: { channelId: 'ch2' } }
          ]
        }
      };

      const mockChannelsResponse = {
        data: {
          items: [
            {
              id: 'ch1',
              snippet: {
                title: 'Jung Academy',
                description: 'Educational content about Jung',
                thumbnails: {
                  default: { url: 'thumb1.jpg' },
                  medium: { url: 'thumb1-m.jpg' },
                  high: { url: 'thumb1-h.jpg' }
                }
              },
              statistics: {
                subscriberCount: '10000',
                videoCount: '100',
                viewCount: '1000000'
              }
            },
            {
              id: 'ch2',
              snippet: {
                title: 'Psychology Lectures',
                description: 'Academic psychology content',
                customUrl: '@psychlectures',
                thumbnails: {
                  default: { url: 'thumb2.jpg' },
                  medium: { url: 'thumb2-m.jpg' },
                  high: { url: 'thumb2-h.jpg' }
                }
              },
              statistics: {
                subscriberCount: '50000',
                videoCount: '500',
                viewCount: '5000000'
              }
            }
          ]
        }
      };

      mockedAxios.get
        .mockResolvedValueOnce(mockSearchResponse)
        .mockResolvedValueOnce(mockChannelsResponse);

      const results = await service.searchEducationalChannels('jung', 5);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://www.googleapis.com/youtube/v3/search',
        expect.objectContaining({
          params: expect.objectContaining({
            q: 'jung education lecture',
            type: 'channel',
            maxResults: 5
          })
        })
      );

      expect(results).toHaveLength(2);
      expect(results[0].title).toBe('Jung Academy');
      expect(results[0].subscriberCount).toBe('10000');
      expect(results[1].customUrl).toBe('@psychlectures');
    });

    it('should handle channel search errors', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const results = await service.searchEducationalChannels('error test');

      expect(consoleSpy).toHaveBeenCalled();
      expect(results.length).toBeGreaterThan(0); // Should return mock data
      
      consoleSpy.mockRestore();
    });
  });

  describe('getVideoById', () => {
    beforeEach(() => {
      service = new YouTubeService(mockApiKey);
    });

    it('should get video by ID', async () => {
      const mockResponse = {
        data: {
          items: [{
            id: 'test-video-id',
            snippet: {
              title: 'Test Video',
              description: 'Test description',
              channelId: 'test-channel',
              channelTitle: 'Test Channel',
              publishedAt: '2023-01-01T00:00:00Z',
              tags: ['test', 'video']
            },
            contentDetails: { duration: 'PT5M' },
            statistics: { viewCount: '1000', likeCount: '50' }
          }]
        }
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await service.getVideoById('test-video-id');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://www.googleapis.com/youtube/v3/videos',
        expect.objectContaining({
          params: expect.objectContaining({
            key: mockApiKey,
            id: 'test-video-id',
            part: 'snippet,contentDetails,statistics'
          })
        })
      );

      expect(result).toBeDefined();
      expect(result!.videoId).toBe('test-video-id');
      expect(result!.title).toBe('Test Video');
    });

    it('should return null for non-existent video', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { items: [] }
      });

      const result = await service.getVideoById('non-existent');
      expect(result).toBeNull();
    });

    it('should handle API errors', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('API Error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await service.getVideoById('error-video');

      expect(consoleSpy).toHaveBeenCalled();
      expect(result).toBeDefined(); // Should return mock data
      
      consoleSpy.mockRestore();
    });
  });

  describe('getVideoDetails', () => {
    beforeEach(() => {
      service = new YouTubeService(mockApiKey);
    });

    it('should get video details in expected format', async () => {
      const mockResponse = {
        data: {
          items: [{
            id: 'detail-video',
            snippet: {
              title: 'Detailed Video',
              tags: ['jung', 'psychology']
            },
            contentDetails: { duration: 'PT10M30S' },
            statistics: { viewCount: '5000', likeCount: '250' }
          }]
        }
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await service.getVideoDetails('detail-video');

      expect(result).toEqual({
        id: 'detail-video',
        title: 'Detailed Video',
        duration: 630, // 10 minutes 30 seconds
        viewCount: 5000,
        likeCount: 250,
        tags: ['jung', 'psychology']
      });
    });

    it('should throw error for missing video ID', async () => {
      await expect(service.getVideoDetails('')).rejects.toThrow('Video ID is required');
    });

    it('should throw error for invalid video ID', async () => {
      await expect(service.getVideoDetails('invalid id with spaces')).rejects.toThrow('Invalid video ID');
    });

    it('should handle videos without likes', async () => {
      const mockResponse = {
        data: {
          items: [{
            id: 'no-likes',
            snippet: { title: 'No Likes Video' },
            contentDetails: { duration: 'PT5M' },
            statistics: { viewCount: '100' }
          }]
        }
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await service.getVideoDetails('no-likes');
      expect(result.likeCount).toBe(0);
    });
  });

  describe('getVideoTranscript', () => {
    beforeEach(() => {
      service = new YouTubeService(mockApiKey);
    });

    it('should fetch video transcript', async () => {
      const mockTranscript = {
        data: {
          transcript: [
            { text: 'Hello', start: 0, duration: 2 },
            { text: 'World', start: 2, duration: 2 }
          ]
        }
      };

      mockedAxios.get.mockResolvedValueOnce(mockTranscript);

      const result = await service.getVideoTranscript('transcript-video');

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/transcript/transcript-video');
      expect(result).toBe('Hello World');
    });

    it('should return null for empty video ID', async () => {
      const result = await service.getVideoTranscript('');
      expect(result).toBeNull();
    });

    it('should return null in mock mode', async () => {
      service = new YouTubeService(); // No API key, mock mode
      const result = await service.getVideoTranscript('any-video');
      expect(result).toBeNull();
    });

    it('should handle transcript API errors', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Transcript error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await service.getVideoTranscript('error-video');

      expect(consoleSpy).toHaveBeenCalledWith('Error fetching transcript:', expect.any(Error));
      expect(result).toBeNull();
      
      consoleSpy.mockRestore();
    });
  });

  describe('getChannelInfo', () => {
    beforeEach(() => {
      service = new YouTubeService(mockApiKey);
    });

    it('should get channel information', async () => {
      const mockResponse = {
        data: {
          items: [{
            id: 'channel-123',
            snippet: {
              title: 'Test Channel'
            },
            statistics: {
              subscriberCount: '25000',
              videoCount: '150'
            }
          }]
        }
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await service.getChannelInfo('channel-123');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://www.googleapis.com/youtube/v3/channels',
        expect.objectContaining({
          params: expect.objectContaining({
            key: mockApiKey,
            id: 'channel-123',
            part: 'snippet,statistics'
          })
        })
      );

      expect(result).toEqual({
        id: 'channel-123',
        title: 'Test Channel',
        subscriberCount: 25000,
        videoCount: 150
      });
    });

    it('should return null for non-existent channel', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { items: [] }
      });

      const result = await service.getChannelInfo('non-existent');
      expect(result).toBeNull();
    });

    it('should return mock data in mock mode', async () => {
      service = new YouTubeService(); // No API key
      const result = await service.getChannelInfo('mock-channel');
      
      expect(result).toEqual({
        id: 'mock-channel',
        title: 'Mock Channel',
        subscriberCount: 100000,
        videoCount: 250
      });
    });

    it('should handle channel API errors', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Channel error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await service.getChannelInfo('error-channel');

      expect(consoleSpy).toHaveBeenCalled();
      expect(result).toBeNull();
      
      consoleSpy.mockRestore();
    });
  });

  describe('searchEducationalVideos', () => {
    beforeEach(() => {
      service = new YouTubeService(mockApiKey);
    });

    it('should search educational videos with appropriate filters', async () => {
      mockedAxios.get.mockResolvedValue({ data: { items: [] } });

      await service.searchEducationalVideos('jung lectures', {
        minDuration: 600 // 10 minutes
      });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            videoDuration: 'long',
            videoDefinition: 'high',
            safeSearch: 'strict'
          })
        })
      );
    });

    it('should use medium duration for shorter videos', async () => {
      mockedAxios.get.mockResolvedValue({ data: { items: [] } });

      await service.searchEducationalVideos('jung introduction', {
        minDuration: 300 // 5 minutes
      });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            videoDuration: 'medium'
          })
        })
      );
    });
  });

  describe('Private methods', () => {
    it('should parse ISO 8601 duration correctly', async () => {
      service = new YouTubeService(mockApiKey);
      
      // Access private method through getVideoDetails
      const mockResponse = {
        data: {
          items: [{
            id: 'test',
            snippet: { title: 'Test' },
            contentDetails: { duration: 'PT1H25M30S' }, // 1 hour 25 minutes 30 seconds
            statistics: { viewCount: '100' }
          }]
        }
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);
      const result = await service.getVideoDetails('test');
      expect(result.duration).toBe(5130); // 1*3600 + 25*60 + 30
    });

    it('should handle duration without hours', async () => {
      service = new YouTubeService(mockApiKey);
      
      const mockResponse = {
        data: {
          items: [{
            id: 'test',
            snippet: { title: 'Test' },
            contentDetails: { duration: 'PT15M45S' }, // 15 minutes 45 seconds
            statistics: { viewCount: '100' }
          }]
        }
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);
      const result = await service.getVideoDetails('test');
      expect(result.duration).toBe(945); // 15*60 + 45
    });

    it('should handle duration with only seconds', async () => {
      service = new YouTubeService(mockApiKey);
      
      const mockResponse = {
        data: {
          items: [{
            id: 'test',
            snippet: { title: 'Test' },
            contentDetails: { duration: 'PT30S' }, // 30 seconds
            statistics: { viewCount: '100' }
          }]
        }
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);
      const result = await service.getVideoDetails('test');
      expect(result.duration).toBe(30);
    });
  });

  describe('Mock mode behavior', () => {
    beforeEach(() => {
      service = new YouTubeService(); // No API key - mock mode
    });

    it('should return mock search results', async () => {
      const results = await service.searchVideos('jung');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toHaveProperty('videoId');
      expect(results[0]).toHaveProperty('title');
      expect(results[0]).toHaveProperty('description');
    });

    it('should return mock channel results', async () => {
      const results = await service.searchEducationalChannels('psychology');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toHaveProperty('channelId');
      expect(results[0]).toHaveProperty('title');
      expect(results[0]).toHaveProperty('subscriberCount');
    });

    it('should return mock video by ID', async () => {
      const result = await service.getVideoById('mock-video-id');
      
      expect(result).toBeDefined();
      expect(result!.videoId).toBeDefined();
      expect(result!.title).toBeDefined();
    });
  });
});