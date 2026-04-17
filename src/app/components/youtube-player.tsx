import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';

interface YouTubePlayerProps {
  videoId: string;
  onVideoEnd: () => void;
  onReady: () => void;
  onPlayingChange?: (isPlaying: boolean) => void;
}

export interface YouTubePlayerHandle {
  togglePlay: () => void;
  getCurrentTime: () => number;
  pauseVideo: () => void;
  playVideo: () => void;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export const YouTubePlayer = forwardRef<YouTubePlayerHandle, YouTubePlayerProps>(
  ({ videoId, onVideoEnd, onReady, onPlayingChange }, ref) => {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAPIReady, setIsAPIReady] = useState(false);

  // Stabilize callbacks in refs so the player effect never re-runs due to new function references
  const onVideoEndRef = useRef(onVideoEnd);
  onVideoEndRef.current = onVideoEnd;
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  const onPlayingChangeRef = useRef(onPlayingChange);
  onPlayingChangeRef.current = onPlayingChange;

  useImperativeHandle(ref, () => ({
    togglePlay: () => {
      if (!playerRef.current) return;
      const state = playerRef.current.getPlayerState();
      if (state === window.YT.PlayerState.PLAYING) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    },
    getCurrentTime: () => playerRef.current?.getCurrentTime() ?? 0,
    pauseVideo: () => playerRef.current?.pauseVideo(),
    playVideo: () => playerRef.current?.playVideo(),
  }));

  // Load YouTube IFrame API
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setIsAPIReady(true);
      return;
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      setIsAPIReady(true);
    };
  }, []);

  // Initialize player when API is ready
  useEffect(() => {
    if (!isAPIReady || !containerRef.current) return;

    // Destroy existing player
    if (playerRef.current) {
      playerRef.current.destroy();
    }

    playerRef.current = new window.YT.Player(containerRef.current, {
      videoId,
      playerVars: {
        autoplay: 1,
        controls: 1,
        modestbranding: 1,
        rel: 0,
      },
      events: {
        onReady: () => {
          onReadyRef.current();
        },
        onStateChange: (event: any) => {
          if (event.data === window.YT.PlayerState.ENDED) {
            onVideoEndRef.current();
          }
          onPlayingChangeRef.current?.(event.data === window.YT.PlayerState.PLAYING);
        },
      },
    });

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [isAPIReady, videoId]);

  return (
    <div className="w-full aspect-video bg-black rounded-lg overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
});

YouTubePlayer.displayName = 'YouTubePlayer';
