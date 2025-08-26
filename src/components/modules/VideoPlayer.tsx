import React from 'react';
import YouTube from 'react-youtube';
import { Video } from '../../types';
import { Clock } from 'lucide-react';

interface VideoPlayerProps {
  video: Video;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ video }) => {
  const [hasError, setHasError] = React.useState(false);
  
  // Check if video ID exists
  if (!video?.youtubeId) {
    return (
      <div className="card">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{video?.title || 'Video'}</h3>
        <div className="bg-gray-100 rounded-lg p-8 text-center">
          <p className="text-gray-600">No video ID provided</p>
        </div>
      </div>
    );
  }
  
  const opts = {
    height: '390',
    width: '100%',
    playerVars: {
      autoplay: 0,
      modestbranding: 1,
      rel: 0
    },
  };

  const onReady = () => {
    // Video is ready
  };

  const onError = (event: any) => {
    console.error('YouTube Player Error:', event);
    setHasError(true);
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="card">
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{video.title}</h3>
      <p className="text-gray-600 mb-4">{video.description}</p>
      
      <div className="flex items-center text-sm text-gray-500 mb-4">
        <Clock className="w-4 h-4 mr-1" />
        <span>Duration: {formatDuration(typeof video.duration === 'number' ? video.duration : 0)}</span>
      </div>
      
      {hasError ? (
        <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
          <div className="text-center p-4">
            <p className="text-gray-600 mb-2">Unable to load video</p>
            <a 
              href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-700 underline"
            >
              Watch on YouTube
            </a>
          </div>
        </div>
      ) : (
        <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden">
          <YouTube 
            videoId={video.youtubeId} 
            opts={opts} 
            onReady={onReady}
            onError={onError}
            className="w-full h-full"
          />
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;