import { Video } from '../types';
import { Play, GripVertical } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

interface VideoQueueProps {
  videos: Video[];
  currentIndex: number;
  onSelectVideo: (index: number) => void;
}

export function VideoQueue({
  videos,
  currentIndex,
  onSelectVideo,
}: VideoQueueProps) {
  if (videos.length === 0) return null;

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Queue ({videos.length} videos)</h2>
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
