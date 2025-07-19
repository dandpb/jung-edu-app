import axios from 'axios';

export interface YouTubeVideo {
  videoId: string;
  title: string;
  description: string;
  channelId: string;
  channelTitle: string;
  publishedAt: string;
  duration: string;
  viewCount: string;
  likeCount?: string;
  thumbnails: {
    default: { url: string; width: number; height: number };
    medium: { url: string; width: number; height: number };
    high: { url: string; width: number; height: number };
    maxres?: { url: string; width: number; height: number };
  };
  tags?: string[];
  categoryId?: string;
}

export interface YouTubeSearchOptions {
  maxResults?: number;
  order?: 'relevance' | 'date' | 'rating' | 'viewCount' | 'title';
  videoDuration?: 'short' | 'medium' | 'long'; // short < 4min, medium 4-20min, long > 20min
  videoDefinition?: 'high' | 'standard' | 'any';
  videoEmbeddable?: boolean;
  safeSearch?: 'none' | 'moderate' | 'strict';
  channelId?: string;
  relevanceLanguage?: string;
}

export interface YouTubeChannel {
  channelId: string;
  title: string;
  description: string;
  subscriberCount: string;
  videoCount: string;
  viewCount: string;
  customUrl?: string;
  thumbnails: {
    default: { url: string };
    medium: { url: string };
    high: { url: string };
  };
}

export class YouTubeService {
  private apiKey: string;
  private baseUrl = 'https://www.googleapis.com/youtube/v3';
  private mockMode: boolean;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.REACT_APP_YOUTUBE_API_KEY || '';
    this.mockMode = !this.apiKey;
    
    if (this.apiKey) {
      console.log('YouTube Service: Using real API with key:', this.apiKey.substring(0, 7) + '...');
    } else {
      console.log('YouTube Service: No API key found, using mock mode');
    }
  }

  async searchVideos(
    query: string,
    options: YouTubeSearchOptions = {}
  ): Promise<YouTubeVideo[]> {
    if (this.mockMode) {
      return this.mockSearchVideos(query, options);
    }

    try {
      // Search for videos
      console.log('Making YouTube API request with key:', this.apiKey.substring(0, 7) + '...');
      
      const searchResponse = await axios.get(`${this.baseUrl}/search`, {
        params: {
          key: this.apiKey,
          q: query,
          part: 'snippet',
          type: 'video',
          maxResults: options.maxResults || 10,
          order: options.order || 'relevance',
          videoDuration: options.videoDuration,
          videoDefinition: options.videoDefinition,
          videoEmbeddable: options.videoEmbeddable !== false,
          safeSearch: options.safeSearch || 'moderate',
          channelId: options.channelId,
          relevanceLanguage: options.relevanceLanguage || 'en',
        },
        headers: {
          'Accept': 'application/json',
          'Referer': window.location.origin,
        }
      });

      const videoIds = searchResponse.data.items.map((item: any) => item.id.videoId).join(',');

      // Get detailed video information
      const videosResponse = await axios.get(`${this.baseUrl}/videos`, {
        params: {
          key: this.apiKey,
          id: videoIds,
          part: 'snippet,contentDetails,statistics',
        },
      });

      return videosResponse.data.items.map((item: any) => this.mapVideoResponse(item));
    } catch (error: any) {
      console.error('YouTube API error:', error);
      
      // Check if it's an API key error
      if (error.response?.data?.error?.code === 400 && 
          error.response?.data?.error?.errors?.[0]?.reason === 'badRequest') {
        console.error('YouTube API Key is invalid or not enabled for YouTube Data API v3');
        console.error('Please check: https://console.cloud.google.com/apis/library/youtube.googleapis.com');
        
        // Switch to mock mode for this instance
        this.mockMode = true;
        console.log('Switching to mock mode due to API key error');
      }
      
      // Fallback to mock data on error
      return this.mockSearchVideos(query, options);
    }
  }

  async searchEducationalChannels(
    topic: string,
    maxResults: number = 10
  ): Promise<YouTubeChannel[]> {
    if (this.mockMode) {
      return this.mockSearchChannels(topic);
    }

    try {
      const response = await axios.get(`${this.baseUrl}/search`, {
        params: {
          key: this.apiKey,
          q: `${topic} education lecture`,
          part: 'snippet',
          type: 'channel',
          maxResults,
          order: 'relevance',
        },
      });

      const channelIds = response.data.items.map((item: any) => item.id.channelId).join(',');

      const channelsResponse = await axios.get(`${this.baseUrl}/channels`, {
        params: {
          key: this.apiKey,
          id: channelIds,
          part: 'snippet,statistics',
        },
      });

      return channelsResponse.data.items.map((item: any) => this.mapChannelResponse(item));
    } catch (error) {
      console.error('YouTube API error:', error);
      return this.mockSearchChannels(topic);
    }
  }

  async getVideoById(videoId: string): Promise<YouTubeVideo | null> {
    if (this.mockMode) {
      return this.mockGetVideoById(videoId);
    }

    try {
      const response = await axios.get(`${this.baseUrl}/videos`, {
        params: {
          key: this.apiKey,
          id: videoId,
          part: 'snippet,contentDetails,statistics',
        },
      });

      if (response.data.items.length === 0) {
        return null;
      }

      return this.mapVideoResponse(response.data.items[0]);
    } catch (error) {
      console.error('YouTube API error:', error);
      return this.mockGetVideoById(videoId);
    }
  }

  async getPlaylistVideos(playlistId: string, maxResults: number = 50): Promise<YouTubeVideo[]> {
    if (this.mockMode) {
      return this.mockPlaylistVideos(playlistId);
    }

    try {
      const response = await axios.get(`${this.baseUrl}/playlistItems`, {
        params: {
          key: this.apiKey,
          playlistId,
          part: 'contentDetails',
          maxResults,
        },
      });

      const videoIds = response.data.items
        .map((item: any) => item.contentDetails.videoId)
        .join(',');

      const videosResponse = await axios.get(`${this.baseUrl}/videos`, {
        params: {
          key: this.apiKey,
          id: videoIds,
          part: 'snippet,contentDetails,statistics',
        },
      });

      return videosResponse.data.items.map((item: any) => this.mapVideoResponse(item));
    } catch (error) {
      console.error('YouTube API error:', error);
      return this.mockPlaylistVideos(playlistId);
    }
  }

  private mapVideoResponse(item: any): YouTubeVideo {
    return {
      videoId: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      channelId: item.snippet.channelId,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      duration: item.contentDetails.duration,
      viewCount: item.statistics.viewCount,
      likeCount: item.statistics.likeCount,
      thumbnails: item.snippet.thumbnails,
      tags: item.snippet.tags,
      categoryId: item.snippet.categoryId,
    };
  }

  private mapChannelResponse(item: any): YouTubeChannel {
    return {
      channelId: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      subscriberCount: item.statistics.subscriberCount,
      videoCount: item.statistics.videoCount,
      viewCount: item.statistics.viewCount,
      customUrl: item.snippet.customUrl,
      thumbnails: item.snippet.thumbnails,
    };
  }

  // Mock implementations for development
  private async mockSearchVideos(
    query: string,
    options: YouTubeSearchOptions
  ): Promise<YouTubeVideo[]> {
    const mockVideos: YouTubeVideo[] = [
      {
        videoId: 'nBUQsNpyPHs', // Real Jung video: "Face To Face With Carl Jung (1959)"
        title: `Carl Jung and the Psychology of ${query}`,
        description: `An in-depth exploration of Jungian concepts related to ${query}, covering archetypal patterns, the collective unconscious, and practical applications in modern psychology.`,
        channelId: 'UCX6OQ3DkcsbYNE6H8uQQuVA',
        channelTitle: 'Jung Psychology Institute',
        publishedAt: '2023-10-15T09:00:00Z',
        duration: 'PT24M36S',
        viewCount: '125430',
        likeCount: '4821',
        thumbnails: {
          default: { url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/default.jpg', width: 120, height: 90 },
          medium: { url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg', width: 320, height: 180 },
          high: { url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg', width: 480, height: 360 },
          maxres: { url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg', width: 1280, height: 720 },
        },
        tags: ['jung', 'psychology', 'archetypes', query.toLowerCase()],
        categoryId: '27', // Education
      },
      {
        videoId: 'VjZyGfb-LbM', // Real Jung video: "Carl Jung on The Shadow"
        title: `Understanding ${query} Through Jungian Analysis`,
        description: `A comprehensive lecture examining ${query} through the lens of analytical psychology, featuring case studies and practical therapeutic applications.`,
        channelId: 'UCHnyfMqiRRG1u-2MsSQLbXA',
        channelTitle: 'Academy of Ideas',
        publishedAt: '2023-11-22T14:30:00Z',
        duration: 'PT18M42S',
        viewCount: '89234',
        likeCount: '3456',
        thumbnails: {
          default: { url: 'https://i.ytimg.com/vi/J7GY1Xg6X20/default.jpg', width: 120, height: 90 },
          medium: { url: 'https://i.ytimg.com/vi/J7GY1Xg6X20/mqdefault.jpg', width: 320, height: 180 },
          high: { url: 'https://i.ytimg.com/vi/J7GY1Xg6X20/hqdefault.jpg', width: 480, height: 360 },
        },
        tags: ['jungian analysis', 'psychology', 'therapy', query.toLowerCase()],
        categoryId: '27',
      },
      {
        videoId: '7uaJLbm9hBQ', // Real Jung video: "Carl Jung's Red Book: Did Jung GO SCHIZOPHRENIC or PREDICT THE FUTURE?"
        title: `${query}: A Jungian Perspective - Animated`,
        description: `An engaging animated exploration of ${query} concepts in Jungian psychology, perfect for visual learners and beginners.`,
        channelId: 'UCL_f53ZEJxp8TtlOkHwMV9Q',
        channelTitle: 'Philosophy Tube',
        publishedAt: '2023-09-08T10:00:00Z',
        duration: 'PT12M15S',
        viewCount: '234567',
        likeCount: '12345',
        thumbnails: {
          default: { url: 'https://i.ytimg.com/vi/K4Je8J7F0B8/default.jpg', width: 120, height: 90 },
          medium: { url: 'https://i.ytimg.com/vi/K4Je8J7F0B8/mqdefault.jpg', width: 320, height: 180 },
          high: { url: 'https://i.ytimg.com/vi/K4Je8J7F0B8/hqdefault.jpg', width: 480, height: 360 },
        },
        tags: ['animation', 'jung', 'psychology explained', query.toLowerCase()],
        categoryId: '27',
      },
    ];

    // Filter by duration if specified
    let filtered = mockVideos;
    if (options.videoDuration) {
      filtered = filtered.filter(video => {
        const minutes = this.parseDurationToMinutes(video.duration);
        switch (options.videoDuration) {
          case 'short':
            return minutes < 4;
          case 'medium':
            return minutes >= 4 && minutes <= 20;
          case 'long':
            return minutes > 20;
          default:
            return true;
        }
      });
    }

    // Sort by specified order
    if (options.order) {
      filtered.sort((a, b) => {
        switch (options.order) {
          case 'viewCount':
            return parseInt(b.viewCount) - parseInt(a.viewCount);
          case 'date':
            return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
          case 'rating':
            return (parseInt(b.likeCount || '0') / parseInt(b.viewCount)) -
                   (parseInt(a.likeCount || '0') / parseInt(a.viewCount));
          default:
            return 0;
        }
      });
    }

    return filtered.slice(0, options.maxResults || 10);
  }

  private async mockSearchChannels(topic: string): Promise<YouTubeChannel[]> {
    return [
      {
        channelId: 'UCX6OQ3DkcsbYNE6H8uQQuVA',
        title: 'Jung Psychology Institute',
        description: `Leading educational channel dedicated to Carl Jung's analytical psychology and ${topic}.`,
        subscriberCount: '450000',
        videoCount: '324',
        viewCount: '28500000',
        customUrl: '@jungpsychology',
        thumbnails: {
          default: { url: 'https://yt3.ggpht.com/default-channel.jpg' },
          medium: { url: 'https://yt3.ggpht.com/medium-channel.jpg' },
          high: { url: 'https://yt3.ggpht.com/high-channel.jpg' },
        },
      },
      {
        channelId: 'UCHnyfMqiRRG1u-2MsSQLbXA',
        title: 'Academy of Ideas',
        description: 'Philosophical and psychological insights, including extensive Jungian content.',
        subscriberCount: '1850000',
        videoCount: '189',
        viewCount: '125000000',
        customUrl: '@academyofideas',
        thumbnails: {
          default: { url: 'https://yt3.ggpht.com/aoi-default.jpg' },
          medium: { url: 'https://yt3.ggpht.com/aoi-medium.jpg' },
          high: { url: 'https://yt3.ggpht.com/aoi-high.jpg' },
        },
      },
    ];
  }

  private async mockGetVideoById(videoId: string): Promise<YouTubeVideo> {
    return {
      videoId,
      title: 'The Shadow: Carl Jung\'s Warning to The World',
      description: 'A deep dive into Jung\'s concept of the Shadow and its relevance to modern society.',
      channelId: 'UCX6OQ3DkcsbYNE6H8uQQuVA',
      channelTitle: 'Jung Psychology Institute',
      publishedAt: '2023-08-20T12:00:00Z',
      duration: 'PT28M15S',
      viewCount: '567890',
      likeCount: '23456',
      thumbnails: {
        default: { url: `https://i.ytimg.com/vi/${videoId}/default.jpg`, width: 120, height: 90 },
        medium: { url: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`, width: 320, height: 180 },
        high: { url: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`, width: 480, height: 360 },
      },
      tags: ['jung', 'shadow', 'psychology', 'self-improvement'],
      categoryId: '27',
    };
  }

  private async mockPlaylistVideos(playlistId: string): Promise<YouTubeVideo[]> {
    return [
      await this.mockGetVideoById('mock-1'),
      await this.mockGetVideoById('mock-2'),
      await this.mockGetVideoById('mock-3'),
    ];
  }

  private parseDurationToMinutes(isoDuration: string): number {
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');
    
    return hours * 60 + minutes + Math.ceil(seconds / 60);
  }
}