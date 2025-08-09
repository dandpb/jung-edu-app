import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Video, TimestampedNote, Bookmark, Chapter } from '../../types';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  SkipBack,
  SkipForward,
  Settings,
  Maximize,
  MessageSquare,
  BookmarkPlus,
  Edit3,
  Clock,
  List,
  Share2,
  Download
} from 'lucide-react';

interface MultimediaPlayerProps {
  video: Video;
  onNoteCreate?: (note: Omit<TimestampedNote, 'id'>) => void;
  onBookmarkCreate?: (bookmark: Omit<Bookmark, 'id'>) => void;
  className?: string;
  autoplay?: boolean;
  showNotes?: boolean;
  showBookmarks?: boolean;
  allowNoteCreation?: boolean;
}

const MultimediaPlayer: React.FC<MultimediaPlayerProps> = ({
  video,
  onNoteCreate,
  onBookmarkCreate,
  className = '',
  autoplay = false,
  showNotes = true,
  showBookmarks = true,
  allowNoteCreation = true
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [activeTab, setActiveTab] = useState<'notes' | 'bookmarks' | 'chapters'>('notes');
  
  // Note creation
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [noteType, setNoteType] = useState<'note' | 'question' | 'insight'>('note');
  const [noteTags, setNoteTags] = useState<string[]>([]);
  
  // Bookmark creation
  const [isCreatingBookmark, setIsCreatingBookmark] = useState(false);
  const [bookmarkTitle, setBookmarkTitle] = useState('');
  const [bookmarkDescription, setBookmarkDescription] = useState('');
  
  // Sample data (would come from props or state management)
  const [notes, setNotes] = useState<TimestampedNote[]>([
    {
      id: '1',
      timestamp: 120,
      content: 'Jung explains the concept of the collective unconscious',
      type: 'note',
      tags: ['collective-unconscious', 'theory']
    },
    {
      id: '2',
      timestamp: 240,
      content: 'How does this relate to modern psychology?',
      type: 'question',
      tags: ['modern-psychology']
    }
  ]);
  
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([
    {
      id: '1',
      timestamp: 60,
      title: 'Introduction to Archetypes',
      description: 'Beginning of archetype discussion'
    },
    {
      id: '2',
      timestamp: 300,
      title: 'Shadow Work Example',
      description: 'Practical example of shadow integration'
    }
  ]);

  const chapters = video.chapters || [];

  // Video event handlers
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleTimeUpdate = () => setCurrentTime(videoElement.currentTime);
    const handleDurationChange = () => setDuration(videoElement.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleVolumeChange = () => {
      setVolume(videoElement.volume);
      setIsMuted(videoElement.muted);
    };

    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('durationchange', handleDurationChange);
    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('volumechange', handleVolumeChange);

    return () => {
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('durationchange', handleDurationChange);
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('volumechange', handleVolumeChange);
    };
  }, []);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  }, [isPlaying]);

  const handleSeek = useCallback((time: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = time;
    setCurrentTime(time);
  }, []);

  const handleVolumeChange = useCallback((newVolume: number) => {
    if (!videoRef.current) return;
    videoRef.current.volume = newVolume;
    setVolume(newVolume);
  }, []);

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  const changePlaybackRate = useCallback((rate: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = rate;
    setPlaybackRate(rate);
  }, []);

  const skipForward = useCallback(() => {
    handleSeek(Math.min(currentTime + 10, duration));
  }, [currentTime, duration, handleSeek]);

  const skipBackward = useCallback(() => {
    handleSeek(Math.max(currentTime - 10, 0));
  }, [currentTime, handleSeek]);

  const toggleFullscreen = useCallback(() => {
    if (!videoRef.current) return;
    
    if (!isFullscreen) {
      videoRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, [isFullscreen]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const createNote = useCallback(() => {
    if (!noteContent.trim()) return;
    
    const newNote: TimestampedNote = {
      id: Date.now().toString(),
      timestamp: currentTime,
      content: noteContent,
      type: noteType,
      tags: noteTags
    };
    
    setNotes(prev => [...prev, newNote].sort((a, b) => a.timestamp - b.timestamp));
    onNoteCreate?.(newNote);
    
    // Reset form
    setNoteContent('');
    setNoteTags([]);
    setIsCreatingNote(false);
  }, [noteContent, noteType, noteTags, currentTime, onNoteCreate]);

  const createBookmark = useCallback(() => {
    if (!bookmarkTitle.trim()) return;
    
    const newBookmark: Bookmark = {
      id: Date.now().toString(),
      timestamp: currentTime,
      title: bookmarkTitle,
      description: bookmarkDescription
    };
    
    setBookmarks(prev => [...prev, newBookmark].sort((a, b) => a.timestamp - b.timestamp));
    onBookmarkCreate?.(newBookmark);
    
    // Reset form
    setBookmarkTitle('');
    setBookmarkDescription('');
    setIsCreatingBookmark(false);
  }, [bookmarkTitle, bookmarkDescription, currentTime, onBookmarkCreate]);

  const jumpToTimestamp = useCallback((timestamp: number) => {
    handleSeek(timestamp);
  }, [handleSeek]);

  const getVideoUrl = () => {
    if (video.youtubeId) {
      return `https://www.youtube.com/embed/${video.youtubeId}`;
    }
    return video.url || '';
  };

  return (
    <div className={`multimedia-player ${className}`}>
      <div className="flex bg-gray-900 rounded-lg overflow-hidden">
        {/* Video Container */}
        <div className={`relative ${showSidebar ? 'flex-1' : 'w-full'}`}>
          {/* Video Element */}
          {video.youtubeId ? (
            <iframe
              src={`https://www.youtube.com/embed/${video.youtubeId}?enablejsapi=1`}
              className="w-full aspect-video"
              allowFullScreen
              title={video.title}
            />
          ) : (
            <video
              ref={videoRef}
              className="w-full aspect-video bg-black"
              autoPlay={autoplay}
              onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
            >
              <source src={video.url} type="video/mp4" />
              {video.captions?.map(caption => (
                <track
                  key={caption.language}
                  kind="subtitles"
                  src={caption.url}
                  srcLang={caption.language}
                  label={caption.language}
                />
              ))}
              Your browser does not support the video tag.
            </video>
          )}
          
          {/* Video Controls Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max={duration}
                  value={currentTime}
                  onChange={(e) => handleSeek(Number(e.target.value))}
                  className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                />
                
                {/* Progress markers for notes and bookmarks */}
                <div className="absolute top-0 left-0 right-0 h-2 pointer-events-none">
                  {notes.map(note => (
                    <div
                      key={note.id}
                      className="absolute w-1 h-full bg-yellow-400 rounded"
                      style={{ left: `${(note.timestamp / duration) * 100}%` }}
                      title={note.content}
                    />
                  ))}
                  {bookmarks.map(bookmark => (
                    <div
                      key={bookmark.id}
                      className="absolute w-1 h-full bg-blue-400 rounded"
                      style={{ left: `${(bookmark.timestamp / duration) * 100}%` }}
                      title={bookmark.title}
                    />
                  ))}
                </div>
              </div>
              
              <div className="flex justify-between text-xs text-gray-300 mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
            
            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={skipBackward}
                  className="p-2 text-white hover:text-gray-300"
                >
                  <SkipBack className="w-5 h-5" />
                </button>
                
                <button
                  onClick={togglePlay}
                  className="p-3 bg-white/20 hover:bg-white/30 rounded-full text-white"
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                </button>
                
                <button
                  onClick={skipForward}
                  className="p-2 text-white hover:text-gray-300"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
                
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={toggleMute}
                    className="p-2 text-white hover:text-gray-300"
                  >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                  
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => handleVolumeChange(Number(e.target.value))}
                    className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                
                <div className="text-white text-sm ml-4">
                  {playbackRate}x
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {allowNoteCreation && (
                  <button
                    onClick={() => setIsCreatingNote(true)}
                    className="p-2 text-white hover:text-gray-300"
                    title="Add Note"
                  >
                    <MessageSquare className="w-5 h-5" />
                  </button>
                )}
                
                <button
                  onClick={() => setIsCreatingBookmark(true)}
                  className="p-2 text-white hover:text-gray-300"
                  title="Add Bookmark"
                >
                  <BookmarkPlus className="w-5 h-5" />
                </button>
                
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 text-white hover:text-gray-300"
                >
                  <Settings className="w-5 h-5" />
                </button>
                
                <button
                  onClick={toggleFullscreen}
                  className="p-2 text-white hover:text-gray-300"
                >
                  <Maximize className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Settings Panel */}
          {showSettings && (
            <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm text-white p-4 rounded-lg">
              <h3 className="font-semibold mb-3">Configurações</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm mb-1">Velocidade de Reprodução</label>
                  <select
                    value={playbackRate}
                    onChange={(e) => changePlaybackRate(Number(e.target.value))}
                    className="w-full bg-gray-700 text-white rounded px-2 py-1"
                  >
                    <option value={0.5}>0.5x</option>
                    <option value={0.75}>0.75x</option>
                    <option value={1}>1x</option>
                    <option value={1.25}>1.25x</option>
                    <option value={1.5}>1.5x</option>
                    <option value={2}>2x</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm mb-1">Qualidade</label>
                  <select className="w-full bg-gray-700 text-white rounded px-2 py-1">
                    <option>Auto</option>
                    <option>720p</option>
                    <option>480p</option>
                    <option>360p</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Sidebar */}
        {showSidebar && (
          <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">{video.title}</h3>
                <button
                  onClick={() => setShowSidebar(false)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
              
              {/* Tab Navigation */}
              <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                {showNotes && (
                  <button
                    onClick={() => setActiveTab('notes')}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'notes'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Anotações ({notes.length})
                  </button>
                )}
                
                {showBookmarks && (
                  <button
                    onClick={() => setActiveTab('bookmarks')}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'bookmarks'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Marcadores ({bookmarks.length})
                  </button>
                )}
                
                {chapters.length > 0 && (
                  <button
                    onClick={() => setActiveTab('chapters')}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'chapters'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Capítulos ({chapters.length})
                  </button>
                )}
              </div>
            </div>
            
            {/* Sidebar Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Notes Tab */}
              {activeTab === 'notes' && (
                <div className="p-4">
                  <div className="space-y-4">
                    {notes.map(note => (
                      <div
                        key={note.id}
                        className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                        onClick={() => jumpToTimestamp(note.timestamp)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-500 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatTime(note.timestamp)}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            note.type === 'note' ? 'bg-blue-100 text-blue-800' :
                            note.type === 'question' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {note.type === 'note' ? 'Nota' :
                             note.type === 'question' ? 'Pergunta' : 'Insight'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-900 mb-2">{note.content}</p>
                        {note.tags && note.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {note.tags.map(tag => (
                              <span
                                key={tag}
                                className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Bookmarks Tab */}
              {activeTab === 'bookmarks' && (
                <div className="p-4">
                  <div className="space-y-4">
                    {bookmarks.map(bookmark => (
                      <div
                        key={bookmark.id}
                        className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                        onClick={() => jumpToTimestamp(bookmark.timestamp)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{bookmark.title}</h4>
                          <span className="text-sm text-gray-500 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatTime(bookmark.timestamp)}
                          </span>
                        </div>
                        {bookmark.description && (
                          <p className="text-sm text-gray-600">{bookmark.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Chapters Tab */}
              {activeTab === 'chapters' && (
                <div className="p-4">
                  <div className="space-y-2">
                    {chapters.map(chapter => (
                      <div
                        key={chapter.id}
                        className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                        onClick={() => jumpToTimestamp(chapter.startTime)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-gray-900">{chapter.title}</h4>
                          <span className="text-sm text-gray-500">
                            {formatTime(chapter.startTime)}
                          </span>
                        </div>
                        {chapter.description && (
                          <p className="text-sm text-gray-600">{chapter.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Note Creation Modal */}
      {isCreatingNote && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Nova Anotação</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tipo</label>
                <select
                  value={noteType}
                  onChange={(e) => setNoteType(e.target.value as any)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="note">Nota</option>
                  <option value="question">Pergunta</option>
                  <option value="insight">Insight</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Conteúdo</label>
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 h-24"
                  placeholder="Digite sua anotação..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Timestamp: {formatTime(currentTime)}
                </label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setIsCreatingNote(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={createNote}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Bookmark Creation Modal */}
      {isCreatingBookmark && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Novo Marcador</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Título</label>
                <input
                  type="text"
                  value={bookmarkTitle}
                  onChange={(e) => setBookmarkTitle(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Nome do marcador..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Descrição</label>
                <textarea
                  value={bookmarkDescription}
                  onChange={(e) => setBookmarkDescription(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 h-20"
                  placeholder="Descrição opcional..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Timestamp: {formatTime(currentTime)}
                </label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setIsCreatingBookmark(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={createBookmark}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultimediaPlayer;