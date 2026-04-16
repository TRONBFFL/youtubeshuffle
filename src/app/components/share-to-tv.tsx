import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Tv, X, Share2 } from 'lucide-react';

interface ShareToTVProps {
  onClose: () => void;
}

export function ShareToTV({ onClose }: ShareToTVProps) {
  const [appUrl, setAppUrl] = useState('');

  useEffect(() => {
    // Strip any query params — share the clean app URL
    setAppUrl(`${window.location.origin}${window.location.pathname}`);
  }, []);

  const qrUrl = appUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=10&data=${encodeURIComponent(appUrl)}`
    : '';

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Shuffle Player', url: appUrl });
      } catch {
        // user cancelled — ignore
      }
    } else {
      await navigator.clipboard.writeText(appUrl);
      // parent will show toast
    }
  };

  const canShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-card border rounded-xl w-full max-w-sm p-6 space-y-4 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <Tv className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-base">Open on TV</h2>
        </div>

        <p className="text-sm text-muted-foreground">
          Scan this QR code with your TV or smart device browser, or share the link directly.
        </p>

        {qrUrl && (
          <div className="flex justify-center">
            <img
              src={qrUrl}
              alt="QR code to open app on TV"
              className="rounded-lg border w-48 h-48"
            />
          </div>
        )}

        <div className="bg-muted rounded-md px-3 py-2 text-xs break-all text-center text-muted-foreground">
          {appUrl}
        </div>

        <Button onClick={handleShare} className="w-full" variant="outline">
          <Share2 className="h-4 w-4 mr-2" />
          {canShare ? 'Share Link' : 'Copy Link'}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Works with any Smart TV, Fire Stick, or Chromecast browser on the same network.
        </p>
      </div>
    </div>
  );
}
