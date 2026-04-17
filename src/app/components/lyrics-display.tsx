import { useMemo } from 'react';
import { type LrcLine } from '../utils/lyrics';

interface LyricsDisplayProps {
  lines: LrcLine[];
  currentTime: number;
}

export function LyricsDisplay({ lines, currentTime }: LyricsDisplayProps) {
  const isUnsynced = lines.length > 0 && lines[0].time === -1;

  if (isUnsynced) {
    return (
      <div className="rounded-lg p-3 bg-black/20 backdrop-blur-sm max-h-40 overflow-y-auto space-y-1">
        <p className="text-center text-xs text-muted-foreground/40 mb-2">Lyrics (unsynced)</p>
        {lines.map((line, i) => (
          <p key={i} className="text-center text-sm text-foreground/80 leading-relaxed">
            {line.text}
          </p>
        ))}
      </div>
    );
  }

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
