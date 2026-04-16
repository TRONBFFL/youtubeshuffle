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
    const trimmed = input.trim();
    // Try to parse as a URL first
    try {
      const urlObj = new URL(trimmed);
      const listParam = urlObj.searchParams.get('list');
      return listParam ? listParam.trim() : null;
    } catch {
      // Not a URL — treat the whole input as a direct playlist ID
      return trimmed.length > 0 ? trimmed : null;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const playlistId = extractPlaylistId(url);
    if (playlistId) {
      onPlaylistLoad(playlistId);
    }
  };

  const handleExample = () => {
    setUrl('https://youtube.com/playlist?list=PLvw0tvZ4jEmhPGP95rvObD7pXV4gKzXL2');
  };

  const playlistId = extractPlaylistId(url);

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
      <button
        type="button"
        onClick={handleExample}
        disabled={isLoading}
        className="text-xs text-muted-foreground hover:text-primary hover:underline"
      >
        Load example playlist
      </button>
      {playlistId && (
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-green-600 hover:bg-green-500 text-white"
        >
          <Shuffle className="mr-2 h-4 w-4" />
          {isLoading ? 'Loading...' : 'Go'}
        </Button>
      )}
    </form>
  );
}
