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

export async function fetchLyrics(title: string): Promise<LrcLine[] | null> {
  const parsed = parseTitle(title);
  if (!parsed) return null;
  const { artist, track } = parsed;
  try {
    // Strategy 1: structured artist + track
    const r1 = await lrclibSearch({ track_name: track, artist_name: artist });
    if (r1) return r1;
    // Strategy 2: full-text query
    const r2 = await lrclibSearch({ q: `${artist} ${track}` });
    if (r2) return r2;
    // Strategy 3: track name only (handles artist name mismatches)
    return await lrclibSearch({ track_name: track });
  } catch {
    return null;
  }
}
