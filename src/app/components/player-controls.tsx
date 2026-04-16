import { Button } from './ui/button';
import { SkipBack, SkipForward, Shuffle, Cast, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface PlayerControlsProps {
  onPrevious: () => void;
  onNext: () => void;
  onReshuffle: () => void;
  onCast: () => void;
  hasPlaylist: boolean;
  isCasting: boolean;
}

export function PlayerControls({
  onPrevious,
  onNext,
  onReshuffle,
  onCast,
  hasPlaylist,
  isCasting,
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
        onClick={onReshuffle}
        disabled={!hasPlaylist}
        className="h-12 w-12"
      >
        <RefreshCw className="h-5 w-5" />
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
        variant={isCasting ? 'default' : 'outline'}
        size="icon"
        onClick={onCast}
        disabled={!hasPlaylist}
        className="h-12 w-12"
      >
        <Cast className="h-5 w-5" />
      </Button>
    </div>
  );
}
