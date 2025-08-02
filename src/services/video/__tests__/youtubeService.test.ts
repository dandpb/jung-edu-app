/**
 * Test Suite for YouTubeService
 * Tests YouTube API integration and mock functionality
 */

import axios from 'axios';
import { YouTubeService, YouTubeVideo, YouTubeSearchOptions, YouTubeChannel } from '../youtubeService';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('YouTubeService', () => {
  let service: YouTubeService;
  let serviceWithMock: YouTubeService;
  const mockApiKey = 'test-api-key-123';

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Reset environment variable
    delete process.env.REACT_APP_YOUTUBE_API_KEY;
    
    // Create services
    service = new YouTubeService(mockApiKey);
    serviceWithMock = new YouTubeService(); // No API key, will use mock mode
  });

  describe('constructor', () => {
    it('should initialize with provided API key', () => {
      expect(service['apiKey']).toBe(mockApiKey);
      expect(service['mockMode']).toBe(false);
    });

    it('should use environment variable if no key provided', () => {
      process.env.REACT_APP_YOUTUBE_API_KEY = 'env-api-key';
      const envService = new YouTubeService();
      expect(envService['apiKey']).toBe('env-api-key');
      expect(envService['mockMode']).toBe(false);
    });

    it('should enable mock mode when no API key available', () => {
      expect(serviceWithMock['mockMode']).toBe(true);
    });
  });

  describe('searchVideos', () => {
    const mockSearchResponse = {
      data: {
        items: [
          {
            id: { videoId: 'video1' },
            snippet: {
              title: 'Jung Shadow Concept',
              description: 'Understanding the shadow',
              channelId: 'channel1',
              channelTitle: 'Psychology Channel',
              publishedAt: '2023-01-01T00:00:00Z',
              thumbnails: {
                default: { url: 'thumb1.jpg', width: 120, height: 90 },
                medium: { url: 'thumb1-m.jpg', width: 320, height: 180 },
                high: { url: 'thumb1-h.jpg', width: 480, height: 360 }
              }
            }
          }
        ]
      }
    };

    const mockVideoDetailsResponse = {
      data: {
        items: [
          {
            id: 'video1',
            snippet: {
              title: 'Jung Shadow Concept',
              description: 'Understanding the shadow',
              channelId: 'channel1',
              channelTitle: 'Psychology Channel',
              publishedAt: '2023-01-01T00:00:00Z',
              thumbnails: {
                default: { url: 'thumb1.jpg', width: 120, height: 90 },
                medium: { url: 'thumb1-m.jpg', width: 320, height: 180 },
                high: { url: 'thumb1-h.jpg', width: 480, height: 360 }
              },
              tags: ['jung', 'shadow', 'psychology'],
              categoryId: '27'
            },
            contentDetails: { duration: 'PT10M30S' },
            statistics: {
              viewCount: '10000',
              likeCount: '500',
              commentCount: '50'
            }
          }
        ]
      }
    };

    it('should search videos with API', async () => {
      mockedAxios.get
        .mockResolvedValueOnce(mockSearchResponse)
        .mockResolvedValueOnce(mockVideoDetailsResponse);

      const results = await service.searchVideos('Jung shadow');

      expect(results).toHaveLength(1); // API mock returns 1 result
      expect(results[0]).toMatchObject({
        videoId: 'video1',
        title: 'Jung Shadow Concept',
        description: 'Understanding the shadow',
        duration: 'PT10M30S',
        viewCount: '10000',
        likeCount: '500'
      });

      // Verify API calls
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/search'),
        expect.objectContaining({
          params: expect.objectContaining({
            key: mockApiKey,
            q: 'Jung shadow',
            type: 'video'
          })
        })
      );
    });

    it('should apply search options correctly', async () => {
      mockedAxios.get
        .mockResolvedValueOnce(mockSearchResponse)
        .mockResolvedValueOnce(mockVideoDetailsResponse);

      const options: YouTubeSearchOptions = {
        maxResults: 10,
        order: 'viewCount',
        videoDuration: 'medium',
        videoDefinition: 'high',
        videoEmbeddable: true,
        safeSearch: 'moderate'
      };

      await service.searchVideos('Jung', options);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            maxResults: 10,
            order: 'viewCount',
            videoDuration: 'medium',
            videoDefinition: 'high',
            videoEmbeddable: true,
            safeSearch: 'moderate'
          })
        })
      );
    });

    it('should cache search results', async () => {
      mockedAxios.get
        .mockResolvedValueOnce(mockSearchResponse)
        .mockResolvedValueOnce(mockVideoDetailsResponse);

      // First call
      const results1 = await service.searchVideos('Jung shadow');
      // Second call (should use cache)
      const results2 = await service.searchVideos('Jung shadow');

      expect(results1).toEqual(results2);
      expect(results1).toHaveLength(1); // API mock returns 1 result
      // First call makes 2 requests (search + details), second uses cache
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });

    it('should handle API errors gracefully', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('API Error'));

      const results = await service.searchVideos('Jung shadow');
      
      // Should fallback to mock data on error
      expect(results).toHaveLength(3);
      expect(results[0]).toMatchObject({
        videoId: expect.any(String),
        title: expect.stringContaining('Jung')
      });
    });

    it('should filter restricted videos', async () => {
      const responseWithRestricted = {
        data: {
          items: [
            {
              id: { videoId: 'video1' },
              snippet: {
                title: 'Normal Video',
                description: 'Description',
                channelId: 'channel1',
                channelTitle: 'Channel',
                publishedAt: '2023-01-01T00:00:00Z',
                thumbnails: {
                  default: { url: 'thumb.jpg', width: 120, height: 90 },
                  medium: { url: 'thumb-m.jpg', width: 320, height: 180 },
                  high: { url: 'thumb-h.jpg', width: 480, height: 360 }
                }
              },
              contentDetails: {
                regionRestriction: { blocked: ['US'] }
              }
            }
          ]
        }
      };

      mockedAxios.get
        .mockResolvedValueOnce(responseWithRestricted)
        .mockResolvedValueOnce({ data: { items: [] } });

      const results = await service.searchVideos('Jung');
      
      // Restricted video should be filtered out
      expect(results).toHaveLength(0);
    });

    it('should use mock mode when no API key', async () => {
      const results = await serviceWithMock.searchVideos('Jung shadow');

      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toMatchObject({
        videoId: expect.any(String),
        title: expect.stringContaining('Jung'),
        duration: expect.any(String),
        viewCount: expect.any(String)
      });
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('should handle empty search results', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: { items: [] } });

      const results = await service.searchVideos('nonexistent query xyz');
      expect(results).toHaveLength(0); // Empty API response returns empty array
    });
  });

  describe('getVideoById', () => {
    const mockVideoResponse = {
      data: {
        items: [
          {
            id: 'video123',
            snippet: {
              title: 'Jung Video',
              description: 'Description',
              channelId: 'channel1',
              channelTitle: 'Channel',
              publishedAt: '2023-01-01T00:00:00Z',
              thumbnails: {
                default: { url: 'thumb.jpg', width: 120, height: 90 },
                medium: { url: 'thumb-m.jpg', width: 320, height: 180 },
                high: { url: 'thumb-h.jpg', width: 480, height: 360 }
              },
              tags: ['jung', 'psychology'],
              categoryId: '27'
            },
            contentDetails: { duration: 'PT15M' },
            statistics: {
              viewCount: '5000',
              likeCount: '200',
              commentCount: '20'
            }
          }
        ]
      }
    };

    it('should get video by ID', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockVideoResponse);

      const video = await service.getVideoById('video123');

      expect(video).toMatchObject({
        videoId: 'video123',
        title: 'Jung Video',
        duration: 'PT15M',
        viewCount: '5000',
        tags: ['jung', 'psychology']
      });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/videos'),
        expect.objectContaining({
          params: expect.objectContaining({
            id: 'video123',
            part: 'snippet,contentDetails,statistics'
          })
        })
      );
    });

    it('should return null for non-existent video', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: { items: [] } });

      const video = await service.getVideoById('nonexistent');
      expect(video).toBeNull();
    });

    it('should handle API errors', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('API Error'));

      const video = await service.getVideoById('video123');
      // Falls back to mock data on error
      expect(video).toBeDefined();
      expect(video?.videoId).toBe('video123');
    });

    it('should use mock mode for getVideoById', async () => {
      const video = await serviceWithMock.getVideoById('mock-video-1');

      expect(video).toBeDefined();
      expect(video?.videoId).toBe('mock-video-1');
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });
  });

  describe('getChannelInfo', () => {
    const mockChannelResponse = {
      data: {
        items: [
          {
            id: 'channel123',
            snippet: {
              title: 'Psychology Channel',
              description: 'Educational content',
              customUrl: '@psychchannel',
              thumbnails: {
                default: { url: 'channel-thumb.jpg' },
                medium: { url: 'channel-thumb-m.jpg' },
                high: { url: 'channel-thumb-h.jpg' }
              }
            },
            statistics: {
              subscriberCount: '100000',
              videoCount: '150',
              viewCount: '5000000'
            }
          }
        ]
      }
    };

    it('should get channel information', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockChannelResponse);

      const channel = await service.getChannelInfo('channel123');

      expect(channel).toMatchObject({
        id: 'channel123',
        title: 'Psychology Channel',
        subscriberCount: 100000,
        videoCount: 150
      });
    });

    it('should return null for non-existent channel', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: { items: [] } });

      const channel = await service.getChannelInfo('nonexistent');
      expect(channel).toBeNull();
    });

    it('should handle missing statistics gracefully', async () => {
      const responseWithoutStats = {
        data: {
          items: [
            {
              id: 'channel123',
              snippet: {
                title: 'Channel',
                description: 'Description',
                thumbnails: {
                  default: { url: 'thumb.jpg' },
                  medium: { url: 'thumb-m.jpg' },
                  high: { url: 'thumb-h.jpg' }
                }
              }
              // No statistics field
            }
          ]
        }
      };

      mockedAxios.get.mockResolvedValueOnce(responseWithoutStats);

      const channel = await service.getChannelInfo('channel123');
      
      // Service returns null when statistics are missing
      expect(channel).toBeNull();
    });
  });

  // getChannelVideos method is now implemented in YouTubeService
  describe('getChannelVideos', () => {
    const mockChannelVideosResponse = {
      data: {
        items: [
          {
            id: { videoId: 'video1' },
            snippet: {
              title: 'Channel Video 1',
              description: 'Description',
              channelId: 'channel123',
              channelTitle: 'Channel',
              publishedAt: '2023-01-01T00:00:00Z',
              thumbnails: {
                default: { url: 'thumb.jpg', width: 120, height: 90 },
                medium: { url: 'thumb-m.jpg', width: 320, height: 180 },
                high: { url: 'thumb-h.jpg', width: 480, height: 360 }
              }
            }
          }
        ]
      }
    };

    it('should get videos from a channel', async () => {
      mockedAxios.get
        .mockResolvedValueOnce(mockChannelVideosResponse)
        .mockResolvedValueOnce({
          data: {
            items: [
              {
                id: 'video1',
                snippet: {
                  title: 'Channel Video 1',
                  description: 'Description',
                  channelId: 'channel123',
                  channelTitle: 'Channel',
                  publishedAt: '2023-01-01T00:00:00Z',
                  thumbnails: {
                    default: { url: 'thumb.jpg', width: 120, height: 90 },
                    medium: { url: 'thumb-m.jpg', width: 320, height: 180 },
                    high: { url: 'thumb-h.jpg', width: 480, height: 360 }
                  }
                },
                contentDetails: { duration: 'PT5M' },
                statistics: { viewCount: '1000', likeCount: '50' }
              }
            ]
          }
        });

      const videos = await service.getChannelVideos('channel123', { maxResults: 5 });

      expect(videos).toHaveLength(1);
      expect(videos[0].channelId).toBe('channel123');
      
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            channelId: 'channel123',
            maxResults: 5
          })
        })
      );
    });

    it('should handle channel with no videos', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: { items: [] } });

      const videos = await service.getChannelVideos('empty-channel');
      expect(videos).toEqual([]);
    });
  });

  // getRelatedVideos method is now implemented in YouTubeService
  describe('getRelatedVideos', () => {
    it('should search for related videos', async () => {
      // First mock the call to getVideoById for the original video
      const mockOriginalVideoResponse = {
        data: {
          items: [
            {
              id: 'original-video-id',
              snippet: {
                title: 'Original Video',
                description: 'Original content',
                channelId: 'channel1',
                channelTitle: 'Original Channel',
                publishedAt: '2023-01-01T00:00:00Z',
                thumbnails: {
                  default: { url: 'thumb.jpg', width: 120, height: 90 },
                  medium: { url: 'thumb-m.jpg', width: 320, height: 180 },
                  high: { url: 'thumb-h.jpg', width: 480, height: 360 }
                },
                tags: ['jung', 'psychology']
              },
              contentDetails: { duration: 'PT10M' },
              statistics: { viewCount: '5000', likeCount: '200' }
            }
          ]
        }
      };

      // Then mock the search for related videos
      const mockSearchResponse = {
        data: {
          items: [
            {
              id: { videoId: 'related1' },
              snippet: {
                title: 'Related Video',
                description: 'Related content',
                channelId: 'channel2',
                channelTitle: 'Another Channel',
                publishedAt: '2023-02-01T00:00:00Z',
                thumbnails: {
                  default: { url: 'thumb.jpg', width: 120, height: 90 },
                  medium: { url: 'thumb-m.jpg', width: 320, height: 180 },
                  high: { url: 'thumb-h.jpg', width: 480, height: 360 }
                }
              }
            }
          ]
        }
      };

      // Finally mock the video details response
      const mockVideoDetailsResponse = {
        data: {
          items: [
            {
              id: 'related1',
              snippet: {
                title: 'Related Video',
                description: 'Related content',
                channelId: 'channel2',
                channelTitle: 'Another Channel',
                publishedAt: '2023-02-01T00:00:00Z',
                thumbnails: {
                  default: { url: 'thumb.jpg', width: 120, height: 90 },
                  medium: { url: 'thumb-m.jpg', width: 320, height: 180 },
                  high: { url: 'thumb-h.jpg', width: 480, height: 360 }
                }
              },
              contentDetails: { duration: 'PT8M' },
              statistics: { viewCount: '2000', likeCount: '100' }
            }
          ]
        }
      };

      mockedAxios.get
        .mockResolvedValueOnce(mockOriginalVideoResponse) // getVideoById call
        .mockResolvedValueOnce(mockSearchResponse) // search call
        .mockResolvedValueOnce(mockVideoDetailsResponse); // video details call

      const videos = await service.getRelatedVideos('original-video-id');

      expect(videos.length).toBeGreaterThan(0);
      expect(mockedAxios.get).toHaveBeenCalledTimes(3); // getVideoById + search + video details
    });

    it('should use mock mode for related videos', async () => {
      const videos = await serviceWithMock.getRelatedVideos('video-id');

      expect(videos.length).toBeGreaterThan(0);
      expect(videos[0].title).toContain('Related');
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });
  });

  describe('mock mode functionality', () => {
    it('should generate consistent mock data', async () => {
      const results1 = await serviceWithMock.searchVideos('Jung shadow');
      const results2 = await serviceWithMock.searchVideos('Jung shadow');

      expect(results1).toEqual(results2); // Same query should return same results
    });

    it('should generate different mock data for different queries', async () => {
      const results1 = await serviceWithMock.searchVideos('Jung shadow');
      const results2 = await serviceWithMock.searchVideos('Freud ego');

      expect(results1[0].title).not.toEqual(results2[0].title);
    });

    it('should respect maxResults in mock mode', async () => {
      const results = await serviceWithMock.searchVideos('Jung', { maxResults: 3 });

      expect(results).toHaveLength(3);
    });

    it('should generate appropriate mock durations', async () => {
      const results = await serviceWithMock.searchVideos('Jung', {
        videoDuration: 'short'
      });

      // All videos should have short durations
      results.forEach(video => {
        const duration = video.duration;
        expect(duration).toMatch(/^PT[0-3]M/); // Less than 4 minutes
      });
    });
  });

  describe('edge cases', () => {
    it('should handle network timeouts', async () => {
      mockedAxios.get.mockImplementationOnce(() => 
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 100))
      );

      const results = await service.searchVideos('Jung');
      expect(results.length).toBeGreaterThan(0); // Fallback to mock data
    });

    it('should handle malformed API responses', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: { items: null } });

      const results = await service.searchVideos('Jung');
      expect(results).toHaveLength(0); // Malformed response treated as empty result
    });

    it('should handle very long queries', async () => {
      const longQuery = 'Jung '.repeat(100);
      
      mockedAxios.get
        .mockResolvedValueOnce({ data: { items: [] } });

      const results = await service.searchVideos(longQuery);
      expect(results).toHaveLength(0); // Empty API response returns empty array
    });

    it('should handle special characters in queries', async () => {
      const specialQuery = 'Jung & "Shadow" <Anima> 100%';
      
      mockedAxios.get
        .mockResolvedValueOnce({ data: { items: [] } });

      await service.searchVideos(specialQuery);
      
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            q: specialQuery
          })
        })
      );
    });
  });
});