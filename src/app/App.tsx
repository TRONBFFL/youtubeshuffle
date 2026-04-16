import { useState, useRef } from 'react';
import { PlaylistInput } from './components/playlist-input';
import { YouTubePlayer, YouTubePlayerHandle } from './components/youtube-player';
import { VideoQueue } from './components/video-queue';
import { PlayerControls } from './components/player-controls';
import { ErrorBoundary } from './components/error-boundary';
import { ShareToTV } from './components/share-to-tv';
import { Video } from './types';
import { fetchPlaylistVideos, shuffleArray } from './utils/youtube-api';
import { toast, Toaster } from 'sonner';
import { Music } from 'lucide-react';

export default function App() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showShareToTV, setShowShareToTV] = useState(false);
  const playerRef = useRef<YouTubePlayerHandle>(null);

  const handleTogglePlay = () => {
    playerRef.current?.togglePlay();
  };

  const handleCast = () => {
    setShowShareToTV(true);
  };

  const handlePlaylistLoad = async (playlistId: string) => {
    setIsLoading(true);
    try {
      const fetchedVideos = await fetchPlaylistVideos(playlistId);
      const shuffled = shuffleArray(fetchedVideos);
      setVideos(shuffled);
      setCurrentIndex(0);
      toast.success(`Loaded and shuffled ${shuffled.length} videos!`);
    } catch (error: any) {
      const message = error?.message ?? 'Unknown error';
      toast.error(`Failed to load playlist: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVideoEnd = () => {
    if (currentIndex < videos.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      toast.info('Playlist finished!');
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < videos.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      toast.info('This is the last video in the playlist');
    }
  };

  const handleReshuffle = () => {
    const currentVideo = videos[currentIndex];
    const shuffled = shuffleArray(videos);
    setVideos(shuffled);
    // Find the current video in the new shuffled array
    const newIndex = (shuffled as Video[]).findIndex((v) => v.id === currentVideo.id);
    setCurrentIndex(newIndex !== -1 ? newIndex : 0);
    toast.success('Playlist reshuffled!');
  };

  const currentVideo = videos[currentIndex];

  return (
    <ErrorBoundary>
    <div className="min-h-screen bg-background">
      <Toaster position="top-center" />

      {showShareToTV && (
        <ShareToTV
          onClose={() => {
            setShowShareToTV(false);
            if (!navigator.share) toast.success('Link copied to clipboard!');
          }}
        />
      )}
      
      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Music className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Shuffle Player</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Load a YouTube playlist and play with custom shuffle
          </p>
        </div>

        {/* Playlist Input */}
        {videos.length === 0 && (
          <div className="bg-card rounded-lg p-6 border">
            <PlaylistInput
              onPlaylistLoad={handlePlaylistLoad}
              isLoading={isLoading}
            />
            <div className="mt-4 p-3 bg-muted rounded-lg text-xs text-muted-foreground">
              <p className="font-medium mb-1">📝 How to use:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Paste a YouTube playlist URL</li>
                <li>Videos will be shuffled automatically</li>
                <li>Use controls to navigate</li>
                <li>Cast to external screen if needed</li>
              </ol>
            </div>
          </div>
        )}

        {/* Video Player */}
        {currentVideo && (
          <div className="space-y-4">
            <div className="bg-card rounded-lg p-4 border space-y-4">
              <div>
                <h2 className="font-semibold text-lg line-clamp-2 mb-1">
                  {currentVideo.title}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Video {currentIndex + 1} of {videos.length}
                </p>
              </div>
              
              <YouTubePlayer
                ref={playerRef}
                videoId={currentVideo.id}
                onVideoEnd={handleVideoEnd}
                onReady={() => setIsPlaying(true)}
                onPlayingChange={setIsPlaying}
              />
              
              <PlayerControls
                onPrevious={handlePrevious}
                onNext={handleNext}
                onReshuffle={handleReshuffle}
                onCast={handleCast}
                onTogglePlay={handleTogglePlay}
                hasPlaylist={videos.length > 0}
                isCasting={false}
                isPlaying={isPlaying}
                castSupported={true}
              />
            </div>

            {/* Video Queue */}
            <div className="bg-card rounded-lg p-4 border">
              <VideoQueue
                videos={videos}
                currentIndex={currentIndex}
                onSelectVideo={setCurrentIndex}
              />
            </div>

            {/* Load New Playlist Button */}
            <button
              onClick={() => {
                setVideos([]);
                setCurrentIndex(0);
              }}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Load a different playlist
            </button>
          </div>
        )}

        {/* API Key Notice */}
        <div className="text-center text-xs text-muted-foreground p-4 bg-muted/50 rounded-lg">
          <p className="mb-2">
            🔑 To use real playlists, add your YouTube Data API v3 key to:
          </p>
          <code className="bg-background px-2 py-1 rounded">
            /src/app/utils/youtube-api.ts
          </code>
          <p className="mt-2">
            Get your free API key at{' '}
            <a
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Google Cloud Console
            </a>
          </p>
        </div>
      </div>
    </div>
    </ErrorBoundary>
  );
}
