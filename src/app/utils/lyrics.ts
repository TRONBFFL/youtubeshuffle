export interface LrcLine {
  time: number;
  text: string;
}

// Patterns to strip noise from the track portion of a YouTube title
const TRACK_NOISE_PATTERNS = [
  /\(\s*official\s*(music\s*)?video\s*\)/gi,
  /\(\s*official\s*(audio|lyric\s*video|lyrics\s*video|visualizer)\s*\)/gi,
  /\(\s*(audio|lyrics?(\s*video)?|lyric\s*video|visualizer)\s*\)/gi,
  /\(\s*(hq|hd|4k|1080p|720p)\s*\)/gi,
  /\(\s*live(\s*(at|from|performance|session|version|acoustic))?\s*\)/gi,
  /\(\s*(acoustic|unplugged|demo|remix|radio\s*edit|extended(\s*mix)?|club\s*mix|original\s*mix)\s*\)/gi,
  /\(\s*(music\s*video|official\s*single|single)\s*\)/gi,
  /\[\s*official\s*(music\s*)?video\s*\]/gi,
  /\[\s*(audio|lyrics?|lyric\s*video|visualizer|hq|hd|4k)\s*\]/gi,
  /\s*[|｜]\s*.+$/g,
  /\s*(feat\.?|ft\.?|featuring)\s+[^(\[)]+/gi,
  /#\S+/g,
  /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu,
  /^["'"']+|["'"']+$/g,
  /\(\s*\)|\[\s*\]/g,
];

function cleanTrack(raw: string): string {
  let s = raw;
  for (const pattern of TRACK_NOISE_PATTERNS) {
    s = s.replace(pattern, ' ');
  }
  return s.replace(/\s{2,}/g, ' ').trim();
}

function parseTitle(title: string): { artist: string; track: string } | null {
  let t = title.replace(/^\s*\[.*?\]\s*/g, '').trim();
  const match = t.match(/^(.+?)\s*[-–—:]\s*(.+)$/);
  if (!match) return null;
  const artist = match[1].trim().replace(/["'"']/g, '').trim();
  const track = cleanTrack(match[2]);
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

const HEADERS = { 'Lrclib-Client': 'YTShuffler/1.0 (ytshuffler.com)' };

async function lrclibSearch(params: Record<string, string>): Promise<LrcLine[] | null> {
  const url = new URL('https://lrclib.net/api/search');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), {
    headers: HEADERS,
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) return null;
  const results: any[] = await res.json();
  if (!Array.isArray(results) || results.length === 0) return null;
  const hit = results.find(r => r.syncedLyrics) ?? results[0];
  const lrc = hit?.syncedLyrics;
  if (!lrc) return null;
  const lines = parseLrc(lrc);
  return lines.length > 0 ? lines : null;
}

async function fetchLyricsOvh(artist: string, track: string): Promise<LrcLine[] | null> {
  try {
    const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(track)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const data = await res.json();
    const text: string = data?.lyrics;
    if (!text || typeof text !== 'string') return null;
    const lines = text
      .split('\n')
      .map((l: string) => l.trim())
      .filter((l: string) => l.length > 0)
      .map((l: string) => ({ time: -1, text: l }));
    return lines.length > 0 ? lines : null;
  } catch {
    return null;
  }
}

export async function fetchLyrics(title: string): Promise<LrcLine[] | null> {
  const parsed = parseTitle(title);
  if (!parsed) return null;
  const { artist, track } = parsed;
  try {
    // Strategy 1: structured artist + track (synced)
    const r1 = await lrclibSearch({ track_name: track, artist_name: artist });
    if (r1) return r1;
    // Strategy 2: full-text query (synced)
    const r2 = await lrclibSearch({ q: `${artist} ${track}` });
    if (r2) return r2;
    // Strategy 3: track name only (synced, handles artist name mismatches)
    const r3 = await lrclibSearch({ track_name: track });
    if (r3) return r3;
    // Strategy 4: lyrics.ovh fallback (unsynced plain text — time: -1)
    return await fetchLyricsOvh(artist, track);
  } catch {
    return null;
  }
}

/**
 * Quick 2-strategy check used for background playlist scanning.
 * Returns whether lyrics were found and the lines if so (for caching).
 */
export async function checkLyrics(title: string): Promise<{ hasLyrics: boolean; lines: LrcLine[] | null }> {
  const parsed = parseTitle(title);
  if (!parsed) return { hasLyrics: false, lines: null };
  const { artist, track } = parsed;
  try {
    const lines =
      (await lrclibSearch({ track_name: track, artist_name: artist })) ??
      (await lrclibSearch({ q: `${artist} ${track}` }));
    return { hasLyrics: lines !== null, lines };
  } catch {
    return { hasLyrics: false, lines: null };
  }
}
