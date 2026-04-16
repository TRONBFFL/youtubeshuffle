import { Button } from './ui/button';
import { SkipBack, SkipForward, RefreshCw, Play, Pause, Tv } from 'lucide-react';

interface PlayerControlsProps {
  onPrevious: () => void;
  onNext: () => void;
  onReshuffle: () => void;
  onCast: () => void;
  onTogglePlay: () => void;
  hasPlaylist: boolean;
  isCasting: boolean;
  isPlaying: boolean;
  castSupported: boolean;
}

export function PlayerControls({
  onPrevious,
  onNext,
  onReshuffle,
  onCast,
  onTogglePlay,
  hasPlaylist,
  isCasting,
  isPlaying,
  castSupported,
}: PlayerControlsProps) {
  return (
    <div className="w-full flex items-center justify-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={onPrevious}
        disabled={!hasPlaylist}
        className="h-12 w-12"
      >
        <SkipBack className="h-5 w-5" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={onTogglePlay}
        disabled={!hasPlaylist}
        className="h-14 w-14"
      >
        {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={onNext}
        disabled={!hasPlaylist}
        className="h-12 w-12"
      >
        <SkipForward className="h-5 w-5" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={onReshuffle}
        disabled={!hasPlaylist}
        className="h-12 w-12"
      >
        <RefreshCw className="h-5 w-5" />
      </Button>

      {castSupported && (
        <Button
          variant={isCasting ? 'default' : 'outline'}
          size="icon"
          onClick={onCast}
          disabled={!hasPlaylist}
          className="h-12 w-12"
        >
          <Tv className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}
