export interface LrcLine {
  time: number;
  text: string;
}

function parseTitle(title: string): { artist: string; track: string } | null {
  const cleaned = title.replace(/\s*\[.*?\]\s*/g, ' ').trim();
  const match = cleaned.match(/^(.+?)\s*[-–—]\s*(.+)$/);
  if (!match) return null;
  const artist = match[1].trim();
  const track = match[2]
    .replace(/\s*\(.*?\)\s*/g, ' ')
    .replace(/\s*feat\..*$/i, '')
    .replace(/\s*ft\..*$/i, '')
    .trim();
  if (!artist || !track) return null;
  return { artist, track };
}

function parseLrc(lrc: string): LrcLine[] {
  const lines: LrcLine[] = [];
  for (const line of lrc.split('\n')) {
    const match = line.match(/^\[(\d+):(\d+(?:\.\d+)?)\]\s*(.*)/);
    if (!match) continue;
    const time = parseInt(match[1], 10) * 60 + parseFloat(match[2]);
    const text = match[3].trim();
    if (text) lines.push({ time, text });
  }
  return lines.sort((a, b) => a.time - b.time);
}

export async function fetchLyrics(title: string): Promise<LrcLine[] | null> {
  const parsed = parseTitle(title);
  if (!parsed) return null;
  try {
    const url = new URL('https://lrclib.net/api/search');
    url.searchParams.set('track_name', parsed.track);
    url.searchParams.set('artist_name', parsed.artist);
    const res = await fetch(url.toString(), {
      headers: { 'Lrclib-Client': 'YTShuffler/1.0 (ytshuffler.com)' },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const results: any[] = await res.json();
    if (!Array.isArray(results)) return null;
    const hit = results.find(r => r.syncedLyrics);
    if (!hit?.syncedLyrics) return null;
    const lines = parseLrc(hit.syncedLyrics);
    return lines.length > 0 ? lines : null;
  } catch {
    return null;
  }
}
