import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Shuffle } from 'lucide-react';

interface PlaylistInputProps {
  onPlaylistLoad: (playlistId: string) => void;
  isLoading: boolean;
}

export function PlaylistInput({ onPlaylistLoad, isLoading }: PlaylistInputProps) {
  const [url, setUrl] = useState('');

  const extractPlaylistId = (input: string): string | null => {
    // Handle direct playlist ID
    if (input.length === 34 && !input.includes('/') && !input.includes('?')) {
      return input;
    }

    // Handle full YouTube URL
    try {
      const urlObj = new URL(input);
      const params = new URLSearchParams(urlObj.search);
      return params.get('list');
    } catch {
      return null;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const playlistId = extractPlaylistId(url);
    if (playlistId) {
      onPlaylistLoad(playlistId);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      <div className="space-y-2">
        <label htmlFor="playlist-url" className="text-sm font-medium">
          YouTube Playlist URL or ID
        </label>
        <Input
          id="playlist-url"
          type="text"
          placeholder="https://www.youtube.com/playlist?list=..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full"
        />
      </div>
      <Button 
        type="submit" 
        disabled={!url || isLoading}
        className="w-full"
      >
        <Shuffle className="mr-2 h-4 w-4" />
        {isLoading ? 'Loading...' : 'Load & Shuffle Playlist'}
      </Button>
    </form>
  );
}
