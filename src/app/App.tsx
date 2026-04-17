import { useState, useRef, useEffect, type ChangeEvent } from 'react';
import { PlaylistInput } from './components/playlist-input';
import { YouTubePlayer, YouTubePlayerHandle } from './components/youtube-player';
import { VideoQueue } from './components/video-queue';
import { PlayerControls } from './components/player-controls';
import { ErrorBoundary } from './components/error-boundary';
import { ShareToTV } from './components/share-to-tv';
import { Video } from './types';
import { fetchPlaylistVideos, shuffleArray } from './utils/youtube-api';
import { toast, Toaster } from 'sonner';


export default function App() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showShareToTV, setShowShareToTV] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const playerRef = useRef<YouTubePlayerHandle>(null);
  const wallpaperInputRef = useRef<HTMLInputElement>(null);

  const [wallpaperUrl, setWallpaperUrl] = useState<string | null>(() => {
    try { return localStorage.getItem('ytshuffler-wallpaper'); } catch { return null; }
  });
  const [bgScrollY, setBgScrollY] = useState(0);

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
    const played = videos.slice(0, currentIndex);
    const current = videos[currentIndex];
    const unplayed = videos.slice(currentIndex + 1);
    const shuffledUnplayed = shuffleArray(unplayed);
    setVideos([...played, current, ...shuffledUnplayed]);
    toast.success('Remaining videos reshuffled!');
  };

  useEffect(() => {
    if (!wallpaperUrl) {
      setBgScrollY(0);
      return;
    }
    const onScroll = () => setBgScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [wallpaperUrl]);

  const handleWallpaperUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      try {
        localStorage.setItem('ytshuffler-wallpaper', dataUrl);
      } catch {
        toast.error('Image too large to save — will only last this session.');
      }
      setWallpaperUrl(dataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveWallpaper = () => {
    try { localStorage.removeItem('ytshuffler-wallpaper'); } catch { /* ignore */ }
    setWallpaperUrl(null);
  };

  const currentVideo = videos[currentIndex];

  return (
    <ErrorBoundary>
      {wallpaperUrl && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            top: '-10vh',
            left: 0,
            width: '100%',
            height: '120vh',
            zIndex: -1,
            backgroundImage: `url(${wallpaperUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transform: `translateY(${bgScrollY * 0.3}px)`,
            willChange: 'transform',
          }}
        />
      )}
    <div className={wallpaperUrl ? 'min-h-screen bg-transparent' : 'min-h-screen bg-background'}>
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
          <div className="flex items-center justify-center">
            <img
              src="/simplelogo.png"
              alt="YTShuffler"
              className="w-4/5 max-w-xs h-auto"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            True random shuffle for any YouTube playlist
          </p>
          <div className="text-center">
            <button
              onClick={() => setShowDisclaimer(v => !v)}
              className="text-xs text-muted-foreground/60 hover:text-muted-foreground underline underline-offset-2"
            >
              {showDisclaimer ? 'Hide disclaimer' : 'Disclaimer'}
            </button>
            {showDisclaimer && (
              <div className="mt-2 px-2 text-left text-xs text-muted-foreground/70 space-y-2 leading-relaxed">
                <p>
                  YTShuffler.com is an independent tool that uses publicly available YouTube embeds to play videos. This site does not host, store, or distribute any video or audio content. All videos are streamed directly from YouTube's servers and all rights remain with their respective owners.
                </p>
                <p>
                  YTShuffler.com is not affiliated with, endorsed by, or connected to YouTube, Google LLC, or any of their partners.
                </p>
                <p>
                  This site provides a convenience feature (true shuffle playback) and does not modify, circumvent, or interfere with YouTube's functionality, ads, or policies.
                </p>
                <p>
                  Any support or donations made through this site go toward maintaining and improving YTShuffler.com and are not payments for access to YouTube content.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Playlist Input */}
        {videos.length === 0 && (
          <div className={wallpaperUrl ? 'bg-card/70 backdrop-blur-md rounded-lg p-6 border' : 'bg-card rounded-lg p-6 border'}>
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
            <div className={wallpaperUrl ? 'bg-card/70 backdrop-blur-md rounded-lg p-4 border space-y-4' : 'bg-card rounded-lg p-4 border space-y-4'}>
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
            <div className={wallpaperUrl ? 'bg-card/70 backdrop-blur-md rounded-lg p-4 border' : 'bg-card rounded-lg p-4 border'}>
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
        <div className={`text-center text-xs text-muted-foreground p-4 rounded-lg ${wallpaperUrl ? 'bg-muted/30 backdrop-blur-sm' : 'bg-muted/50'}`}>
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

        {/* Buy Me a Coffee */}
        <div className="text-center pb-2">
          <a
            href="https://buymeacoffee.com/tronjedi"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-400 hover:bg-yellow-300 text-yellow-900 text-sm font-medium transition-colors"
          >
            ☕ Buy me a coffee
          </a>
        </div>

        {/* Wallpaper */}
        <div className="text-center pb-4">
          <input
            ref={wallpaperInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleWallpaperUpload}
          />
          {wallpaperUrl ? (
            <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
              <button
                onClick={() => wallpaperInputRef.current?.click()}
                className="hover:text-foreground transition-colors underline underline-offset-2"
              >
                Change wallpaper
              </button>
              <span aria-hidden="true">·</span>
              <button
                onClick={handleRemoveWallpaper}
                className="hover:text-foreground transition-colors underline underline-offset-2"
              >
                Remove wallpaper
              </button>
            </div>
          ) : (
            <button
              onClick={() => wallpaperInputRef.current?.click()}
              className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
            >
              🖼️ Set wallpaper
            </button>
          )}
        </div>

      </div>
    </div>
    </ErrorBoundary>
  );
}
