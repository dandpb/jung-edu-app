import React, { useState } from 'react';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const TestYouTubeAPI: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testDirectFetch = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    const apiKey = process.env.REACT_APP_YOUTUBE_API_KEY;
    console.log('Using API Key:', apiKey?.substring(0, 7) + '...');

    if (!apiKey) {
      setError('No API key found in environment variables');
      setIsLoading(false);
      return;
    }

    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=carl+jung+shadow&type=video&maxResults=3&key=${apiKey}`;
    
    try {
      console.log('Fetching:', url);
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('Response status:', response.status);
      console.log('Response data:', data);

      if (response.ok) {
        setResult(data);
      } else {
        setError(JSON.stringify(data.error, null, 2));
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">YouTube API Direct Test</h1>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-blue-800">
          This page tests the YouTube API directly using fetch to isolate any axios issues.
        </p>
      </div>

      <button
        onClick={testDirectFetch}
        disabled={isLoading}
        className="btn-primary flex items-center space-x-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Testing API...</span>
          </>
        ) : (
          <>
            <CheckCircle className="w-4 h-4" />
            <span>Test YouTube API with Fetch</span>
          </>
        )}
      </button>

      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-800 font-semibold">API Error</p>
              <pre className="mt-2 text-sm text-red-700 whitespace-pre-wrap">{error}</pre>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-green-800 font-semibold mb-3">✅ API Key is Working!</p>
              <div className="space-y-3">
                {result.items?.map((item: any, index: number) => (
                  <div key={item.id.videoId} className="bg-white p-3 rounded border border-green-300">
                    <p className="font-semibold">{index + 1}. {item.snippet.title}</p>
                    <p className="text-sm text-gray-600 mt-1">Channel: {item.snippet.channelTitle}</p>
                    <p className="text-sm text-gray-600">Video ID: {item.id.videoId}</p>
                    <a 
                      href={`https://www.youtube.com/watch?v=${item.id.videoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Watch on YouTube →
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold mb-2">Debug Info:</h3>
        <p className="text-sm text-gray-700">
          API Key present: {process.env.REACT_APP_YOUTUBE_API_KEY ? '✅ Yes' : '❌ No'}
        </p>
        <p className="text-sm text-gray-700">
          API Key prefix: {process.env.REACT_APP_YOUTUBE_API_KEY?.substring(0, 7) || 'Not found'}...
        </p>
        <p className="text-sm text-gray-700 mt-2">
          Open browser console (F12) for detailed logs.
        </p>
      </div>
    </div>
  );
};

export default TestYouTubeAPI;