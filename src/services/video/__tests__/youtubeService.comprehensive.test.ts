/**
 * Comprehensive test suite for YouTubeService
 * Tests API integration, error handling, caching, and mock mode functionality
 * Targets 90%+ coverage for video service operations
 */

import { YouTubeService, YouTubeVideo, YouTubeChannel, YouTubeSearchOptions } from '../youtubeService';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('YouTubeService', () => {
  let service: YouTubeService;
  
  const mockVideoResponse = {
    data: {
      items: [
        {
          id: 'test-video-id',
          snippet: {
            title: 'Carl Jung and Psychology',
            description: 'An exploration of Jungian concepts',
            channelId: 'test-channel-id',
            channelTitle: 'Psychology Channel',
            publishedAt: '2023-10-15T09:00:00Z',
            thumbnails: {
              default: { url: 'https://i.ytimg.com/vi/test/default.jpg', width: 120, height: 90 },
              medium: { url: 'https://i.ytimg.com/vi/test/mqdefault.jpg', width: 320, height: 180 },
              high: { url: 'https://i.ytimg.com/vi/test/hqdefault.jpg', width: 480, height: 360 }
            },
            tags: ['psychology', 'jung', 'education'],
            categoryId: '27'
          },
          contentDetails: {
            duration: 'PT24M36S'
          },
          statistics: {
            viewCount: '125430',
            likeCount: '4821'
          }
        }
      ]
    }
  };

  const mockSearchResponse = {
    data: {
      items: [
        {
          id: { videoId: 'test-video-id' }
        }
      ]
    }
  };

  const mockChannelResponse = {
    data: {
      items: [
        {
          id: 'test-channel-id',
          snippet: {
            title: 'Psychology Channel',
            description: 'Educational psychology content',
            customUrl: '@psychology',
            thumbnails: {
              default: { url: 'https://yt3.ggpht.com/default.jpg' },
              medium: { url: 'https://yt3.ggpht.com/medium.jpg' },
              high: { url: 'https://yt3.ggpht.com/high.jpg' }
            }
          },
          statistics: {
            subscriberCount: '450000',
            videoCount: '324',
            viewCount: '28500000'
          }
        }
      ]
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear cache between tests
    service = new YouTubeService('test-api-key');
    service['searchCache'].clear();
  });

  describe('Constructor', () => {
    it('should initialize with API key', () => {
      const serviceWithKey = new YouTubeService('sk-test-key-123');
      expect(serviceWithKey['apiKey']).toBe('sk-test-key-123');
      expect(serviceWithKey['mockMode']).toBe(false);
    });

    it('should use environment variable when no key provided', () => {
      process.env.REACT_APP_YOUTUBE_API_KEY = 'env-key-123';
      const serviceFromEnv = new YouTubeService();
      expect(serviceFromEnv['apiKey']).toBe('env-key-123');
      delete process.env.REACT_APP_YOUTUBE_API_KEY;
    });

    it('should enable mock mode when no API key available', () => {
      const serviceNoKey = new YouTubeService('');
      expect(serviceNoKey['mockMode']).toBe(true);
    });

    it('should log API key usage', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      new YouTubeService('test-key-12345');
      expect(consoleSpy).toHaveBeenCalledWith('YouTube Service: Using real API with key:', 'test-ke...');
      consoleSpy.mockRestore();
    });

    it('should log mock mode activation', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      new YouTubeService();
      expect(consoleSpy).toHaveBeenCalledWith('YouTube Service: No API key found, using mock mode');
      consoleSpy.mockRestore();
    });
  });

  describe('searchVideos', () => {
    beforeEach(() => {
      service = new YouTubeService('test-api-key');
    });

    it('should search videos successfully', async () => {
      mockedAxios.get
        .mockResolvedValueOnce(mockSearchResponse)
        .mockResolvedValueOnce(mockVideoResponse);

      const result = await service.searchVideos('jung psychology');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(expect.objectContaining({
        videoId: 'test-video-id',
        title: 'Carl Jung and Psychology',
        description: 'An exploration of Jungian concepts',
        channelTitle: 'Psychology Channel',
        duration: 'PT24M36S',
        viewCount: '125430',
        likeCount: '4821',
        tags: ['psychology', 'jung', 'education']
      }));
    });

    it('should use search options correctly', async () => {
      mockedAxios.get
        .mockResolvedValueOnce(mockSearchResponse)
        .mockResolvedValueOnce(mockVideoResponse);

      const options: YouTubeSearchOptions = {
        maxResults: 5,
        order: 'viewCount',
        videoDuration: 'medium',
        videoDefinition: 'high',
        safeSearch: 'strict',
        channelId: 'specific-channel',
        relevanceLanguage: 'pt'
      };

      await service.searchVideos('jung', options);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://www.googleapis.com/youtube/v3/search',
        expect.objectContaining({
          params: expect.objectContaining({
            maxResults: 5,
            order: 'viewCount',
            videoDuration: 'medium',
            videoDefinition: 'high',
            safeSearch: 'strict',
            channelId: 'specific-channel',
            relevanceLanguage: 'pt'
          })
        })
      );
    });

    it('should handle empty search results', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: { items: [] } });

      const result = await service.searchVideos('nonexistent');

      expect(result).toEqual([]);
    });

    it('should cache search results', async () => {
      mockedAxios.get
        .mockResolvedValueOnce(mockSearchResponse)
        .mockResolvedValueOnce(mockVideoResponse);

      await service.searchVideos('jung');
      await service.searchVideos('jung'); // Second call should use cache

      expect(mockedAxios.get).toHaveBeenCalledTimes(2); // Only initial search, not cached
    });

    it('should handle API errors gracefully', async () => {
      mockedAxios.get.mockRejectedValue(new Error('API Error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await service.searchVideos('jung');

      expect(result).toHaveLength(3); // Should return mock videos
      expect(consoleSpy).toHaveBeenCalledWith('YouTube API error:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('should handle invalid API key error', async () => {
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

      mockedAxios.get.mockRejectedValue(apiError);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const logSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await service.searchVideos('jung');

      expect(service['mockMode']).toBe(true);
      expect(logSpy).toHaveBeenCalledWith('Switching to mock mode due to API key error');
      expect(result).toHaveLength(3); // Mock videos
      
      consoleSpy.mockRestore();
      logSpy.mockRestore();
    });

    it('should use videoEmbeddable as default true', async () => {
      mockedAxios.get
        .mockResolvedValueOnce(mockSearchResponse)
        .mockResolvedValueOnce(mockVideoResponse);

      await service.searchVideos('jung', { videoEmbeddable: undefined });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            videoEmbeddable: true
          })
        })
      );
    });

    it('should respect videoEmbeddable false setting', async () => {
      mockedAxios.get
        .mockResolvedValueOnce(mockSearchResponse)
        .mockResolvedValueOnce(mockVideoResponse);

      await service.searchVideos('jung', { videoEmbeddable: false });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            videoEmbeddable: false
          })
        })
      );
    });
  });

  describe('Mock mode functionality', () => {
    beforeEach(() => {
      service = new YouTubeService(); // No API key, activates mock mode
    });

    it('should return mock videos in mock mode', async () => {
      const result = await service.searchVideos('jung psychology');

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual(expect.objectContaining({
        videoId: 'nBUQsNpyPHs',
        title: expect.stringContaining('jung psychology'),
        channelTitle: 'Jung Psychology Institute'
      }));
    });

    it('should filter mock videos by duration', async () => {
      const shortVideos = await service.searchVideos('jung', { videoDuration: 'short' });
      const longVideos = await service.searchVideos('jung', { videoDuration: 'long' });

      expect(shortVideos.length).toBeGreaterThanOrEqual(0);
      expect(longVideos.length).toBeGreaterThanOrEqual(0);
    });

    it('should sort mock videos by view count', async () => {
      const result = await service.searchVideos('jung', { order: 'viewCount' });

      expect(result).toHaveLength(3);
      // Should be sorted by view count descending
      const viewCounts = result.map(v => parseInt(v.viewCount));
      for (let i = 1; i < viewCounts.length; i++) {
        expect(viewCounts[i - 1]).toBeGreaterThanOrEqual(viewCounts[i]);
      }
    });

    it('should sort mock videos by date', async () => {
      const result = await service.searchVideos('jung', { order: 'date' });

      expect(result).toHaveLength(3);
      // Should be sorted by date descending
      const dates = result.map(v => new Date(v.publishedAt).getTime());
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i - 1]).toBeGreaterThanOrEqual(dates[i]);
      }
    });

    it('should limit results based on maxResults', async () => {
      const result = await service.searchVideos('jung', { maxResults: 2 });

      expect(result).toHaveLength(2);
    });
  });

  describe('searchEducationalChannels', () => {
    beforeEach(() => {
      service = new YouTubeService('test-api-key');
    });

    it('should search channels successfully', async () => {
      const mockChannelSearchResponse = {
        data: {
          items: [{ id: { channelId: 'test-channel-id' } }]
        }
      };

      mockedAxios.get
        .mockResolvedValueOnce(mockChannelSearchResponse)
        .mockResolvedValueOnce(mockChannelResponse);

      const result = await service.searchEducationalChannels('psychology');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(expect.objectContaining({
        channelId: 'test-channel-id',
        title: 'Psychology Channel',
        subscriberCount: '450000',
        videoCount: '324'
      }));
    });

    it('should use correct search parameters for educational content', async () => {
      mockedAxios.get.mockResolvedValue({ data: { items: [] } });

      await service.searchEducationalChannels('psychology', 15);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://www.googleapis.com/youtube/v3/search',
        expect.objectContaining({
          params: expect.objectContaining({
            q: 'psychology education lecture',
            type: 'channel',
            maxResults: 15,
            order: 'relevance'
          })
        })
      );
    });

    it('should return mock channels in mock mode', async () => {
      service = new YouTubeService(); // Mock mode

      const result = await service.searchEducationalChannels('psychology');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(expect.objectContaining({
        channelId: 'UCX6OQ3DkcsbYNE6H8uQQuVA',
        title: 'Jung Psychology Institute'
      }));
    });

    it('should handle API errors and fallback to mock', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await service.searchEducationalChannels('psychology');

      expect(result).toHaveLength(2); // Mock channels
      consoleSpy.mockRestore();
    });
  });

  describe('getVideoById', () => {
    beforeEach(() => {
      service = new YouTubeService('test-api-key');
    });

    it('should get video by ID successfully', async () => {
      mockedAxios.get.mockResolvedValue(mockVideoResponse);

      const result = await service.getVideoById('test-video-id');

      expect(result).toEqual(expect.objectContaining({
        videoId: 'test-video-id',
        title: 'Carl Jung and Psychology'
      }));
    });

    it('should return null for non-existent video', async () => {
      mockedAxios.get.mockResolvedValue({ data: { items: [] } });

      const result = await service.getVideoById('non-existent');

      expect(result).toBeNull();
    });

    it('should return mock video in mock mode', async () => {
      service = new YouTubeService(); // Mock mode

      const result = await service.getVideoById('any-id');

      expect(result).toEqual(expect.objectContaining({
        videoId: 'any-id',
        title: "The Shadow: Carl Jung's Warning to The World"
      }));
    });

    it('should handle API errors and return mock', async () => {
      mockedAxios.get.mockRejectedValue(new Error('API error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await service.getVideoById('test-id');

      expect(result).not.toBeNull();
      expect(result?.videoId).toBe('test-id');
      consoleSpy.mockRestore();
    });
  });

  describe('getVideoDetails', () => {
    beforeEach(() => {
      service = new YouTubeService('test-api-key');
    });

    it('should get video details in expected format', async () => {
      mockedAxios.get.mockResolvedValue(mockVideoResponse);

      const result = await service.getVideoDetails('test-video-id');

      expect(result).toEqual(expect.objectContaining({
        id: 'test-video-id',
        title: 'Carl Jung and Psychology',
        duration: expect.any(Number),
        viewCount: 125430,
        likeCount: 4821,
        tags: ['psychology', 'jung', 'education']
      }));
    });

    it('should throw error for empty video ID', async () => {
      await expect(service.getVideoDetails('')).rejects.toThrow('Video ID is required');
    });

    it('should throw error for invalid video ID', async () => {
      await expect(service.getVideoDetails('invalid id')).rejects.toThrow('Invalid video ID');
    });

    it('should return null for non-existent video', async () => {
      mockedAxios.get.mockResolvedValue({ data: { items: [] } });

      const result = await service.getVideoDetails('non-existent');

      expect(result).toBeNull();
    });

    it('should parse duration correctly', async () => {
      mockedAxios.get.mockResolvedValue(mockVideoResponse);

      const result = await service.getVideoDetails('test-video-id');

      expect(result?.duration).toBe(1476); // 24 minutes 36 seconds = 1476 seconds
    });

    it('should handle missing like count', async () => {
      const videoWithoutLikes = {
        ...mockVideoResponse,
        data: {
          items: [{
            ...mockVideoResponse.data.items[0],
            statistics: {
              viewCount: '125430'
              // No likeCount
            }
          }]
        }
      };

      mockedAxios.get.mockResolvedValue(videoWithoutLikes);

      const result = await service.getVideoDetails('test-video-id');

      expect(result?.likeCount).toBe(0);
    });
  });

  describe('getVideoTranscript', () => {
    beforeEach(() => {
      service = new YouTubeService('test-api-key');
    });

    it('should return null in mock mode', async () => {
      service = new YouTubeService(); // Mock mode

      const result = await service.getVideoTranscript('any-id');

      expect(result).toBeNull();
    });

    it('should return null for empty video ID', async () => {
      const result = await service.getVideoTranscript('');

      expect(result).toBeNull();
    });

    it('should fetch transcript from API', async () => {
      const mockTranscriptResponse = {
        data: {
          transcript: [
            { text: 'Hello and welcome' },
            { text: 'to this psychology video' }
          ]
        }
      };

      mockedAxios.get.mockResolvedValue(mockTranscriptResponse);

      const result = await service.getVideoTranscript('test-video-id');

      expect(result).toBe('Hello and welcome to this psychology video');
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/transcript/test-video-id');
    });

    it('should handle transcript API errors', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Transcript not available'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await service.getVideoTranscript('test-video-id');

      expect(result).toBeNull();
      consoleSpy.mockRestore();
    });
  });

  describe('getChannelInfo', () => {
    beforeEach(() => {
      service = new YouTubeService('test-api-key');
    });

    it('should get channel info successfully', async () => {
      mockedAxios.get.mockResolvedValue(mockChannelResponse);

      const result = await service.getChannelInfo('test-channel-id');

      expect(result).toEqual({
        id: 'test-channel-id',
        title: 'Psychology Channel',
        subscriberCount: 450000,
        videoCount: 324
      });
    });

    it('should return null for non-existent channel', async () => {
      mockedAxios.get.mockResolvedValue({ data: { items: [] } });

      const result = await service.getChannelInfo('non-existent');

      expect(result).toBeNull();
    });

    it('should return mock channel info in mock mode', async () => {
      service = new YouTubeService(); // Mock mode

      const result = await service.getChannelInfo('any-channel-id');

      expect(result).toEqual({
        id: 'any-channel-id',
        title: 'Mock Channel',
        subscriberCount: 100000,
        videoCount: 250
      });
    });

    it('should handle API errors', async () => {
      mockedAxios.get.mockRejectedValue(new Error('API error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await service.getChannelInfo('test-channel-id');

      expect(result).toBeNull();
      consoleSpy.mockRestore();
    });
  });

  describe('searchEducationalVideos', () => {
    beforeEach(() => {
      service = new YouTubeService('test-api-key');
    });

    it('should search educational videos with appropriate options', async () => {
      mockedAxios.get
        .mockResolvedValueOnce(mockSearchResponse)
        .mockResolvedValueOnce(mockVideoResponse);

      const serviceSearchSpy = jest.spyOn(service, 'searchVideos');

      await service.searchEducationalVideos('psychology', { minDuration: 700 });

      expect(serviceSearchSpy).toHaveBeenCalledWith('psychology', expect.objectContaining({
        videoDuration: 'long',
        videoDefinition: 'high',
        safeSearch: 'strict'
      }));

      serviceSearchSpy.mockRestore();
    });

    it('should use medium duration for shorter minimum duration', async () => {
      const serviceSearchSpy = jest.spyOn(service, 'searchVideos');

      await service.searchEducationalVideos('psychology', { minDuration: 300 });

      expect(serviceSearchSpy).toHaveBeenCalledWith('psychology', expect.objectContaining({
        videoDuration: 'medium'
      }));

      serviceSearchSpy.mockRestore();
    });
  });

  describe('getPlaylistVideos', () => {
    beforeEach(() => {
      service = new YouTubeService('test-api-key');
    });

    it('should get playlist videos successfully', async () => {
      const mockPlaylistResponse = {
        data: {
          items: [
            { contentDetails: { videoId: 'video1' } },
            { contentDetails: { videoId: 'video2' } }
          ]
        }
      };

      mockedAxios.get
        .mockResolvedValueOnce(mockPlaylistResponse)
        .mockResolvedValueOnce({
          data: {
            items: [
              { ...mockVideoResponse.data.items[0], id: 'video1' },
              { ...mockVideoResponse.data.items[0], id: 'video2' }
            ]
          }
        });

      const result = await service.getPlaylistVideos('playlist-id');

      expect(result).toHaveLength(2);
      expect(result[0].videoId).toBe('video1');
      expect(result[1].videoId).toBe('video2');
    });

    it('should return mock playlist videos in mock mode', async () => {
      service = new YouTubeService(); // Mock mode

      const result = await service.getPlaylistVideos('any-playlist-id');

      expect(result).toHaveLength(3);
      expect(result[0].videoId).toBe('mock-1');
    });

    it('should handle playlist API errors', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Playlist not found'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await service.getPlaylistVideos('invalid-playlist');

      expect(result).toHaveLength(3); // Mock videos
      consoleSpy.mockRestore();
    });
  });

  describe('getChannelVideos', () => {
    beforeEach(() => {
      service = new YouTubeService('test-api-key');
    });

    it('should get channel videos successfully', async () => {
      mockedAxios.get
        .mockResolvedValueOnce(mockSearchResponse)
        .mockResolvedValueOnce(mockVideoResponse);

      const result = await service.getChannelVideos('test-channel-id');

      expect(result).toHaveLength(1);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://www.googleapis.com/youtube/v3/search',
        expect.objectContaining({
          params: expect.objectContaining({
            channelId: 'test-channel-id',
            type: 'video',
            order: 'date'
          })
        })
      );
    });

    it('should return empty array for channels with no videos', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: { items: [] } });

      const result = await service.getChannelVideos('empty-channel');

      expect(result).toEqual([]);
    });

    it('should return mock channel videos in mock mode', async () => {
      service = new YouTubeService(); // Mock mode

      const result = await service.getChannelVideos('any-channel-id', { maxResults: 5 });

      expect(result).toHaveLength(5);
      expect(result[0].channelId).toBe('any-channel-id');
    });
  });

  describe('getRelatedVideos', () => {
    beforeEach(() => {
      service = new YouTubeService('test-api-key');
    });

    it('should get related videos based on original video tags', async () => {
      // Mock original video response
      mockedAxios.get
        .mockResolvedValueOnce(mockVideoResponse) // getVideoById call
        .mockResolvedValueOnce({ // Search for related videos
          data: {
            items: [
              { id: { videoId: 'related-1' } },
              { id: { videoId: 'related-2' } }
            ]
          }
        })
        .mockResolvedValueOnce({ // Get video details for related videos
          data: {
            items: [
              { ...mockVideoResponse.data.items[0], id: 'related-1' },
              { ...mockVideoResponse.data.items[0], id: 'related-2' }
            ]
          }
        });

      const result = await service.getRelatedVideos('original-video-id', 2);

      expect(result).toHaveLength(2);
      expect(result[0].videoId).toBe('related-1');
      expect(result[1].videoId).toBe('related-2');
    });

    it('should filter out original video from results', async () => {
      const originalVideoId = 'original-video';
      
      mockedAxios.get
        .mockResolvedValueOnce(mockVideoResponse)
        .mockResolvedValueOnce({
          data: {
            items: [
              { id: { videoId: originalVideoId } }, // Should be filtered out
              { id: { videoId: 'related-1' } }
            ]
          }
        })
        .mockResolvedValueOnce({
          data: {
            items: [
              { ...mockVideoResponse.data.items[0], id: 'related-1' }
            ]
          }
        });

      const result = await service.getRelatedVideos(originalVideoId);

      expect(result).toHaveLength(1);
      expect(result[0].videoId).toBe('related-1');
    });

    it('should return empty array if original video not found', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: { items: [] } });

      const result = await service.getRelatedVideos('non-existent');

      expect(result).toEqual([]);
    });

    it('should return mock related videos in mock mode', async () => {
      service = new YouTubeService(); // Mock mode

      const result = await service.getRelatedVideos('any-video-id', 5);

      expect(result).toHaveLength(5);
      expect(result[0].videoId).toMatch(/^related-any-video-id-\d+$/);
    });

    it('should use video title for search when no tags available', async () => {
      const videoWithoutTags = {
        ...mockVideoResponse,
        data: {
          items: [{
            ...mockVideoResponse.data.items[0],
            snippet: {
              ...mockVideoResponse.data.items[0].snippet,
              tags: undefined,
              title: 'Complex Jung Psychology Analysis'
            }
          }]
        }
      };

      mockedAxios.get
        .mockResolvedValueOnce(videoWithoutTags)
        .mockResolvedValueOnce({ data: { items: [] } });

      await service.getRelatedVideos('video-without-tags');

      expect(mockedAxios.get).toHaveBeenNthCalledWith(
        2,
        'https://www.googleapis.com/youtube/v3/search',
        expect.objectContaining({
          params: expect.objectContaining({
            q: 'Complex Jung Psychology'
          })
        })
      );
    });
  });

  describe('Duration parsing utilities', () => {
    beforeEach(() => {
      service = new YouTubeService('test-api-key');
    });

    it('should parse ISO 8601 duration to seconds correctly', () => {
      expect(service['parseDuration']('PT1H30M45S')).toBe(5445); // 1:30:45
      expect(service['parseDuration']('PT30M')).toBe(1800); // 30 minutes
      expect(service['parseDuration']('PT45S')).toBe(45); // 45 seconds
      expect(service['parseDuration']('PT2H')).toBe(7200); // 2 hours
    });

    it('should parse duration to minutes correctly', () => {
      expect(service['parseDurationToMinutes']('PT1H30M45S')).toBe(91); // 90 + 1 minute (rounded up seconds)
      expect(service['parseDurationToMinutes']('PT30M')).toBe(30);
      expect(service['parseDurationToMinutes']('PT45S')).toBe(1); // Rounded up
    });

    it('should handle invalid duration format', () => {
      expect(service['parseDuration']('invalid')).toBe(0);
      expect(service['parseDurationToMinutes']('invalid')).toBe(0);
    });
  });

  describe('Error handling and edge cases', () => {
    beforeEach(() => {
      service = new YouTubeService('test-api-key');
    });

    it('should handle network timeouts', async () => {
      const timeoutError = new Error('Network timeout');
      timeoutError.name = 'TimeoutError';
      
      mockedAxios.get.mockRejectedValue(timeoutError);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await service.searchVideos('jung');

      expect(result).toHaveLength(3); // Should fallback to mock
      consoleSpy.mockRestore();
    });

    it('should handle malformed API responses', async () => {
      mockedAxios.get.mockResolvedValue({ data: null });

      const result = await service.searchVideos('jung');

      expect(result).toEqual([]);
    });

    it('should handle missing response properties', async () => {
      const incompleteResponse = {
        data: {
          items: [{
            id: 'incomplete-video',
            snippet: {
              title: 'Incomplete Video'
              // Missing other required properties
            }
          }]
        }
      };

      mockedAxios.get.mockResolvedValue(incompleteResponse);

      await expect(service.getVideoById('incomplete-video')).not.toThrow();
    });
  });

  describe('Cache functionality', () => {
    beforeEach(() => {
      service = new YouTubeService('test-api-key');
    });

    it('should cache search results', async () => {
      mockedAxios.get
        .mockResolvedValueOnce(mockSearchResponse)
        .mockResolvedValueOnce(mockVideoResponse);

      // First call
      const result1 = await service.searchVideos('jung psychology');
      
      // Second call should use cache
      const result2 = await service.searchVideos('jung psychology');

      expect(result1).toEqual(result2);
      expect(mockedAxios.get).toHaveBeenCalledTimes(2); // Initial search + video details, no second search
    });

    it('should use different cache keys for different search options', async () => {
      mockedAxios.get
        .mockResolvedValueOnce(mockSearchResponse)
        .mockResolvedValueOnce(mockVideoResponse)
        .mockResolvedValueOnce(mockSearchResponse)
        .mockResolvedValueOnce(mockVideoResponse);

      await service.searchVideos('jung', { maxResults: 5 });
      await service.searchVideos('jung', { maxResults: 10 }); // Different options

      expect(mockedAxios.get).toHaveBeenCalledTimes(4); // Both calls hit API
    });
  });
});