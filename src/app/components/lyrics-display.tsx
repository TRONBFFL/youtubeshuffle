import { useMemo } from 'react';
import { type LrcLine } from '../utils/lyrics';

interface LyricsDisplayProps {
  lines: LrcLine[];
  currentTime: number;
}

export function LyricsDisplay({ lines, currentTime }: LyricsDisplayProps) {
  const activeIndex = useMemo(() => {
    let idx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].time <= currentTime) idx = i;
      else break;
    }
    return idx;
  }, [lines, currentTime]);

  const windowStart = Math.max(0, activeIndex - 1);
  const visible = lines.slice(windowStart, windowStart + 5);

  return (
    <div className="rounded-lg p-4 bg-black/20 backdrop-blur-sm min-h-[120px] flex flex-col justify-center space-y-1">
      {visible.length === 0 ? (
        <p className="text-center text-xs text-muted-foreground/50">♪ ♪ ♪</p>
      ) : (
        visible.map((line, i) => {
          const absoluteIndex = windowStart + i;
          const isActive = absoluteIndex === activeIndex;
          const isPast = absoluteIndex < activeIndex;
          return (
            <p
              key={`${line.time}-${line.text}`}
              className={`text-center transition-all duration-300 ${
                isActive
                  ? 'text-base font-semibold text-foreground'
                  : isPast
                  ? 'text-xs text-muted-foreground/40'
                  : 'text-sm text-muted-foreground/70'
              }`}
            >
              {line.text}
            </p>
          );
        })
      )}
    </div>
  );
}
