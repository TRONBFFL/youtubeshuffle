import { Video } from '../types';
import { Play, GripVertical, Music2 } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

interface ScanProgress {
  done: number;
  total: number;
}

interface VideoQueueProps {
  videos: Video[];
  currentIndex: number;
  onSelectVideo: (index: number) => void;
  lyricsHasMap?: Record<string, boolean>;
  scanProgress?: ScanProgress | null;
  lyricsOnlyFilter?: boolean;
  onToggleLyricsFilter?: (v: boolean) => void;
}

export function VideoQueue({
  videos,
  currentIndex,
  onSelectVideo,
  lyricsHasMap,
  scanProgress,
  lyricsOnlyFilter,
  onToggleLyricsFilter,
}: VideoQueueProps) {
  if (videos.length === 0) return null;

  const scanDone = scanProgress != null && scanProgress.done === scanProgress.total;
  const lyricsCount = lyricsHasMap
    ? Object.values(lyricsHasMap).filter(Boolean).length
    : 0;

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Queue ({videos.length} videos)</h2>

        {/* Scan progress / filter toggle */}
        {scanProgress != null && !scanDone && (
          <span className="text-xs text-muted-foreground/60 animate-pulse">
            Scanning {scanProgress.done}/{scanProgress.total}…
          </span>
        )}
        {scanDone && lyricsCount > 0 && (
          <button
            onClick={() => onToggleLyricsFilter?.(!lyricsOnlyFilter)}
            className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border transition-colors ${
              lyricsOnlyFilter
                ? 'bg-primary text-primary-foreground border-primary'
                : 'text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
            }`}
            title={lyricsOnlyFilter ? 'Show all videos' : `Filter to ${lyricsCount} videos with lyrics`}
          >
            <Music2 className="h-3 w-3" />
            Lyrics only ({lyricsCount})
          </button>
        )}
      </div>

      <ScrollArea className="h-[300px] rounded-lg border">
        <div className="p-2 space-y-1">
          {videos.map((video, index) => (
            <button
              key={`${video.id}-${index}`}
              onClick={() => onSelectVideo(index)}
              className={`w-full p-3 rounded-lg flex items-start gap-3 text-left transition-colors ${
                index === currentIndex
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent'
              }`}
            >
              <GripVertical className="h-5 w-5 flex-shrink-0 mt-0.5 opacity-50" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm line-clamp-2">
                  {video.title}
                </p>
                <p className="text-xs opacity-70 mt-1">
                  {index + 1} of {videos.length}
                </p>
              </div>
              {lyricsHasMap?.[video.id] === true && (
                <Music2
                  className={`h-3.5 w-3.5 flex-shrink-0 mt-0.5 ${
                    index === currentIndex ? 'opacity-80' : 'text-muted-foreground/50'
                  }`}
                />
              )}
              {index === currentIndex && (
                <Play className="h-5 w-5 flex-shrink-0 fill-current" />
              )}
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
