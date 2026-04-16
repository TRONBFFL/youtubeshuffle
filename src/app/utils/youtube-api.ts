import { Video, PlaylistData } from '../types';

const API_KEY: string = (import.meta as any).env?.VITE_YOUTUBE_API_KEY ?? '';

export async function fetchPlaylistVideos(playlistId: string): Promise<Video[]> {
  const videos: Video[] = [];
  let nextPageToken: string | undefined = undefined;

  // Note: This is a mock implementation for demonstration
  // In production, you would make actual API calls to YouTube Data API v3
  
  // Mock data for demonstration
  if (!API_KEY) {
    // Return mock data when no API key is configured
    return generateMockVideos(20);
  }

  try {
    do {
      const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
      url.searchParams.append('part', 'snippet');
      url.searchParams.append('playlistId', playlistId);
      url.searchParams.append('maxResults', '50');
      url.searchParams.append('key', API_KEY);
      
      if (nextPageToken) {
        url.searchParams.append('pageToken', nextPageToken);
      }

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const reason = errData?.error?.message ?? `HTTP ${response.status}`;
        throw new Error(reason);
      }

      const data: PlaylistData = await response.json();

      const validItems = data.items.filter(
        (item) =>
          item.snippet?.resourceId?.videoId &&
          item.snippet.title !== 'Deleted video' &&
          item.snippet.title !== 'Private video'
      );

      videos.push(
        ...validItems.map((item) => ({
          id: item.snippet.resourceId.videoId,
          title: item.snippet.title,
          thumbnail:
            item.snippet.thumbnails?.default?.url ??
            `https://img.youtube.com/vi/${item.snippet.resourceId.videoId}/default.jpg`,
        }))
      );

      nextPageToken = data.nextPageToken;
    } while (nextPageToken);

    return videos;
  } catch (error) {
    console.error('Error fetching playlist:', error);
    throw error;
  }
}

// Generate mock videos for demonstration
function generateMockVideos(count: number): Video[] {
  const titles = [
    'Amazing Music Mix 2026',
    'Best Songs Compilation',
    'Chill Vibes Playlist',
    'Top Hits This Week',
    'Electronic Dance Music',
    'Lo-Fi Beats to Study',
    'Rock Classics Collection',
    'Jazz & Soul Mix',
    'Indie Music Discovery',
    'Pop Hits 2026',
    'Acoustic Sessions',
    'Hip Hop Essentials',
    'Classical Masterpieces',
    'Summer Vibes Mix',
    'Workout Motivation Music',
    'Evening Chill Out',
    'Throwback Thursday Hits',
    'New Music Friday',
    'Feel Good Playlist',
    'Late Night Driving Mix',
  ];

  return Array.from({ length: count }, (_, i) => ({
    id: `mock-video-${i}`,
    title: titles[i % titles.length] + ` #${Math.floor(i / titles.length) + 1}`,
    thumbnail: `https://img.youtube.com/vi/dQw4w9WgXcQ/default.jpg`,
  }));
}

/**
 * Mock Quantum Random Number Generator
 * Combines Web Crypto API entropy with high-resolution timing noise
 * to simulate quantum superposition collapse, producing values in [0, 1)
 */
function quantumRandom(): number {
  // Pull 4 cryptographically secure random 32-bit integers
  const cryptoBuffer = new Uint32Array(4);
  crypto.getRandomValues(cryptoBuffer);

  // Layer in sub-millisecond timing entropy (simulates environmental quantum noise)
  const timingNoise = Math.floor((performance.now() % 1) * 0xFFFFFFFF);

  // XOR-mix all entropy sources together (avalanche effect)
  const mixed =
    cryptoBuffer[0] ^
    (cryptoBuffer[1] >>> 8) ^
    (cryptoBuffer[2] >>> 16) ^
    (cryptoBuffer[3] >>> 24) ^
    timingNoise;

  // Normalize to [0, 1)
  return (mixed >>> 0) / 0x100000000;
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(quantumRandom() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
