import React, { useState } from 'react';
import { Search, Video, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { YouTubeService } from '../services/video/youtubeService';
import { VideoGenerator } from '../services/llm/generators/video-generator';
import { VideoEnricher } from '../services/video/videoEnricher';
import { LLMProviderFactory } from '../services/llm/provider';
import VideoPlayer from '../components/modules/VideoPlayer';

const TestYouTubeIntegration: React.FC = () => {
  const [topic, setTopic] = useState('Shadow Self');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [generatedVideos, setGeneratedVideos] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'search' | 'generate'>('search');
  const [selectedVideo, setSelectedVideo] = useState<any | null>(null);

  const youtubeService = new YouTubeService();
  const provider = LLMProviderFactory.getProvider();
  const videoGenerator = new VideoGenerator(provider);
  const videoEnricher = new VideoEnricher(provider);

  const handleDirectSearch = async () => {
    setIsSearching(true);
    setError(null);
    setSearchResults([]);

    try {
      console.log(`Searching YouTube for: ${topic} Jung psychology`);
      
      const videos = await youtubeService.searchVideos(`${topic} Jung psychology`, {
        maxResults: 6,
        order: 'relevance',
        videoDuration: 'medium',
        safeSearch: 'strict',
      });

      console.log(`Found ${videos.length} videos`);
      setSearchResults(videos);
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'Failed to search videos');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAIGeneratedSearch = async () => {
    setIsSearching(true);
    setError(null);
    setGeneratedVideos([]);

    try {
      console.log(`Generating videos for topic: ${topic}`);
      
      const videos = await videoGenerator.generateVideos(
        topic,
        ['fundamental concepts', 'psychological integration', 'practical applications'],
        'Psychology students and general learners',
        5
      );

      console.log(`Generated ${videos.length} video suggestions`);
      setGeneratedVideos(videos);
    } catch (err) {
      console.error('Generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate videos');
    } finally {
      setIsSearching(false);
    }
  };

  const formatDuration = (isoDuration: string) => {
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 'Unknown';
    
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatViewCount = (count: string) => {
    const num = parseInt(count);
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M views`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K views`;
    }
    return `${num} views`;
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">YouTube Integration Test</h1>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-2">Testing YouTube Integration</h2>
        <p className="text-blue-800">
          This page demonstrates the YouTube integration working with both direct search and AI-generated video suggestions.
        </p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Enter a Jungian Psychology Topic
        </label>
        <div className="flex space-x-2">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Shadow Self, Anima and Animus, Individuation"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                activeTab === 'search' ? handleDirectSearch() : handleAIGeneratedSearch();
              }
            }}
          />
        </div>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('search')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'search'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Direct YouTube Search
          </button>
          <button
            onClick={() => setActiveTab('generate')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'generate'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            AI-Generated Videos
          </button>
        </nav>
      </div>

      {activeTab === 'search' && (
        <div>
          <button
            onClick={handleDirectSearch}
            disabled={isSearching || !topic}
            className="btn-primary flex items-center space-x-2 mb-6"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Searching YouTube...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Search YouTube</span>
              </>
            )}
          </button>

          {searchResults.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-4">
                YouTube Search Results ({searchResults.length} videos)
              </h3>
              <div className="grid gap-4">
                {searchResults.map((video) => (
                  <div
                    key={video.videoId}
                    className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedVideo(video)}
                  >
                    <div className="flex space-x-4">
                      <img
                        src={video.thumbnails.medium.url}
                        alt={video.title}
                        className="w-40 h-24 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 line-clamp-2">
                          {video.title}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {video.channelTitle} • {formatViewCount(video.viewCount)} • {formatDuration(video.duration)}
                        </p>
                        <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                          {video.description}
                        </p>
                      </div>
                      <Video className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'generate' && (
        <div>
          <button
            onClick={handleAIGeneratedSearch}
            disabled={isSearching || !topic}
            className="btn-primary flex items-center space-x-2 mb-6"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating Videos...</span>
              </>
            ) : (
              <>
                <Video className="w-4 h-4" />
                <span>Generate Video Suggestions</span>
              </>
            )}
          </button>

          {generatedVideos.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-4">
                AI-Generated Video Resources ({generatedVideos.length} videos)
              </h3>
              <div className="grid gap-4">
                {generatedVideos.map((video, index) => (
                  <div
                    key={video.id || index}
                    className="border rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-1" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">
                          {video.title}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Duration: {video.duration} minutes • Platform: {video.platform || 'YouTube'}
                        </p>
                        <p className="text-sm text-gray-700 mt-2">
                          {video.description}
                        </p>
                        {video.metadata && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {video.metadata.difficulty && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                                {video.metadata.difficulty}
                              </span>
                            )}
                            {video.metadata.educationalValue && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                                Educational: {Math.round(video.metadata.educationalValue * 100)}%
                              </span>
                            )}
                            {video.metadata.relevanceScore && (
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                                Relevance: {Math.round(video.metadata.relevanceScore * 100)}%
                              </span>
                            )}
                          </div>
                        )}
                        <a
                          href={video.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700 mt-3"
                        >
                          Watch on YouTube
                          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div className="flex-1">
              <p className="text-red-800 font-semibold">{error}</p>
              {error.includes('API key not valid') && (
                <div className="mt-2 text-sm text-red-700">
                  <p>The YouTube API key is invalid or not enabled. Please:</p>
                  <ol className="list-decimal ml-5 mt-1">
                    <li>Go to <a href="https://console.cloud.google.com/apis/library/youtube.googleapis.com" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console</a></li>
                    <li>Enable YouTube Data API v3</li>
                    <li>Check API key restrictions</li>
                  </ol>
                  <p className="mt-2">Using mock data instead (with real Jung video IDs).</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold">{selectedVideo.title}</h3>
                <button
                  onClick={() => setSelectedVideo(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <VideoPlayer
                video={{
                  id: selectedVideo.videoId,
                  title: selectedVideo.title,
                  youtubeId: selectedVideo.videoId,
                  description: selectedVideo.description,
                  duration: parseInt(selectedVideo.duration.match(/\d+/)?.[0] || '0'),
                }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3">How it works:</h3>
        <div className="space-y-2 text-sm text-gray-700">
          <p>
            <strong>Direct Search:</strong> Uses the YouTube API (or mock data in development) to search for real videos.
          </p>
          <p>
            <strong>AI-Generated:</strong> Uses the LLM to generate search queries and then enriches results with educational metadata.
          </p>
          <p>
            <strong>Mock Mode:</strong> When no YouTube API key is set, the service returns realistic mock data for testing.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TestYouTubeIntegration;