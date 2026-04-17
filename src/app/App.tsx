import { useState, useRef, useEffect, type ChangeEvent } from 'react';
import { PlaylistInput } from './components/playlist-input';
import { YouTubePlayer, YouTubePlayerHandle } from './components/youtube-player';
import { VideoQueue } from './components/video-queue';
import { PlayerControls } from './components/player-controls';
import { ErrorBoundary } from './components/error-boundary';
import { ShareToTV } from './components/share-to-tv';
import { LyricsDisplay } from './components/lyrics-display';
import { Video } from './types';
import { fetchPlaylistVideos, shuffleArray } from './utils/youtube-api';
import { fetchLyrics, type LrcLine } from './utils/lyrics';
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
  const lyricsPausedRef = useRef(false);

  const [wallpaperUrl, setWallpaperUrl] = useState<string | null>(() => {
    try { return localStorage.getItem('ytshuffler-wallpaper'); } catch { return null; }
  });
  const [bgScrollY, setBgScrollY] = useState(0);

  const [lyricsEnabled, setLyricsEnabled] = useState(false);
  const [lrcLines, setLrcLines] = useState<LrcLine[] | null>(null);
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [lyricsTime, setLyricsTime] = useState(0);
  const [lyricsOffset, setLyricsOffset] = useState(0);
  const [theaterMode, setTheaterMode] = useState(false);

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

  useEffect(() => {
    if (!theaterMode) {
      document.body.style.overflow = '';
      return;
    }
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setTheaterMode(false); };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [theaterMode]);

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

  // Fetch lyrics when video changes or lyrics toggled on
  useEffect(() => {
    if (!lyricsEnabled || !currentVideo) {
      setLrcLines(null);
      setLyricsTime(0);
      setLyricsLoading(false);
      return;
    }
    setLrcLines(null);
    setLyricsTime(0);
    // Load per-song saved offset
    try {
      const map = JSON.parse(localStorage.getItem('ytshuffler-lyrics-offsets') ?? '{}');
      setLyricsOffset(typeof map[currentVideo.id] === 'number' ? map[currentVideo.id] : 0);
    } catch {
      setLyricsOffset(0);
    }
    setLyricsLoading(true);
    let cancelled = false;
    fetchLyrics(currentVideo.title).then(lines => {
      if (cancelled) return;
      setLrcLines(lines);
      setLyricsLoading(false);
      if (lyricsPausedRef.current) {
        lyricsPausedRef.current = false;
        playerRef.current?.playVideo();
      }
    });
    return () => { cancelled = true; };
  }, [lyricsEnabled, currentVideo?.id]);

  // Poll playback time for lyrics sync
  useEffect(() => {
    if (!lyricsEnabled || !lrcLines) return;
    const id = setInterval(() => {
      setLyricsTime(playerRef.current?.getCurrentTime() ?? 0);
    }, 100);
    return () => clearInterval(id);
  }, [lyricsEnabled, lrcLines]);

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
            <div className={
              theaterMode
                ? 'fixed inset-0 z-50 bg-background flex flex-col p-4 sm:p-8 gap-4 overflow-y-auto'
                : (wallpaperUrl
                  ? 'bg-card/70 backdrop-blur-md rounded-lg p-4 border space-y-4'
                  : 'bg-card rounded-lg p-4 border space-y-4')
            }>
              <div className="flex items-start justify-between gap-2 shrink-0">
                <div className="min-w-0">
                  <h2 className="font-semibold text-lg line-clamp-2 mb-1">
                    {currentVideo.title}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Video {currentIndex + 1} of {videos.length}
                  </p>
                </div>
                <button
                  onClick={() => setTheaterMode(v => !v)}
                  className="hidden sm:flex items-center shrink-0 p-1.5 rounded hover:bg-muted text-muted-foreground/60 hover:text-foreground transition-colors"
                  title={theaterMode ? 'Exit fullscreen (Esc)' : 'Fullscreen mode'}
                >
                  {theaterMode ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                    </svg>
                  )}
                </button>
              </div>
              
              <div className={theaterMode ? 'w-full max-w-4xl mx-auto shrink-0' : ''}>
                <YouTubePlayer
                  ref={playerRef}
                  videoId={currentVideo.id}
                  onVideoEnd={handleVideoEnd}
                  onReady={() => {
                    if (lyricsEnabled && lyricsLoading) {
                      playerRef.current?.pauseVideo();
                      lyricsPausedRef.current = true;
                    }
                  }}
                  onPlayingChange={setIsPlaying}
                />
              </div>
              
              <div className={theaterMode ? 'w-full max-w-4xl mx-auto space-y-4 shrink-0' : 'space-y-4'}>
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

                {/* Lyrics toggle */}
                <div className="flex items-center justify-center gap-3 pt-1">
                  <button
                    onClick={() => setLyricsEnabled(v => {
                      const next = !v;
                      if (!next && lyricsPausedRef.current) {
                        lyricsPausedRef.current = false;
                        playerRef.current?.playVideo();
                      }
                      return next;
                    })}
                    className={`text-xs transition-colors ${
                      lyricsEnabled
                        ? 'text-foreground'
                        : 'text-muted-foreground/60 hover:text-muted-foreground'
                    }`}
                  >
                    🎤 {lyricsEnabled ? 'Hide lyrics' : 'Lyrics'}
                  </button>
                  {lyricsEnabled && lrcLines && lrcLines[0]?.time !== -1 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground/60">
                      <button
                        onClick={() => setLyricsOffset(o => {
                          const next = Math.round((o - 0.5) * 10) / 10;
                          try {
                            const map = JSON.parse(localStorage.getItem('ytshuffler-lyrics-offsets') ?? '{}');
                            map[currentVideo.id] = next;
                            localStorage.setItem('ytshuffler-lyrics-offsets', JSON.stringify(map));
                          } catch {}
                          return next;
                        })}
                        className="px-1.5 py-0.5 rounded hover:bg-muted hover:text-foreground transition-colors font-mono"
                        title="Lyrics showing too early — delay by 0.5s"
                      >−</button>
                      <span className="w-10 text-center tabular-nums">
                        {lyricsOffset === 0 ? 'sync' : `${lyricsOffset > 0 ? '+' : ''}${lyricsOffset.toFixed(1)}s`}
                      </span>
                      <button
                        onClick={() => setLyricsOffset(o => {
                          const next = Math.round((o + 0.5) * 10) / 10;
                          try {
                            const map = JSON.parse(localStorage.getItem('ytshuffler-lyrics-offsets') ?? '{}');
                            map[currentVideo.id] = next;
                            localStorage.setItem('ytshuffler-lyrics-offsets', JSON.stringify(map));
                          } catch {}
                          return next;
                        })}
                        className="px-1.5 py-0.5 rounded hover:bg-muted hover:text-foreground transition-colors font-mono"
                        title="Lyrics showing too late — advance by 0.5s"
                      >+</button>
                      {lyricsOffset !== 0 && (
                        <button
                          onClick={() => {
                            try {
                              const map = JSON.parse(localStorage.getItem('ytshuffler-lyrics-offsets') ?? '{}');
                              delete map[currentVideo.id];
                              localStorage.setItem('ytshuffler-lyrics-offsets', JSON.stringify(map));
                            } catch {}
                            setLyricsOffset(0);
                          }}
                          className="px-1.5 py-0.5 rounded hover:bg-muted hover:text-foreground transition-colors"
                          title="Reset sync"
                        >↺</button>
                      )}
                    </div>
                  )}
                </div>

                {/* Lyrics display */}
                {lyricsEnabled && (
                  lyricsLoading
                    ? (
                      <div className="rounded-lg p-4 bg-black/20 backdrop-blur-sm min-h-[100px] flex items-center justify-center">
                        <p className="text-xs text-muted-foreground/60 animate-pulse">Searching for lyrics…</p>
                      </div>
                    )
                    : lrcLines
                    ? <LyricsDisplay lines={lrcLines} currentTime={lyricsTime + lyricsOffset} />
                    : (
                      <div className="rounded-lg p-4 bg-black/20 backdrop-blur-sm min-h-[80px] flex items-center justify-center">
                        <p className="text-xs text-muted-foreground/50">No lyrics found for this song</p>
                      </div>
                    )
                )}
              </div>
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
