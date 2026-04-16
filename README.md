# YTShuffler

**True random shuffle for YouTube playlists — because YouTube's shuffle isn't actually random.**

🔗 [ytshuffler.com](https://ytshuffler.com)

---

## The Problem

YouTube's built-in shuffle isn't random. Under the hood, it uses the same recommendation engine that drives your entire feed — which means the "shuffle" is silently influenced by watch history, popularity, and engagement signals. The result? You end up hearing the same artist multiple times in a row, the same popular tracks keep surfacing near the top, and your deeper cuts never get a fair shot. It's not shuffle — it's a soft recommendation loop wearing a shuffle badge.

## The Solution

YTShuffler bypasses YouTube's algorithm entirely. It fetches your complete playlist via the YouTube Data API and applies a **cryptographic Fisher-Yates shuffle** — an algorithm seeded with entropy from the Web Crypto API and sub-millisecond timing noise. The result is a genuinely unpredictable playback order: every video gets exactly one slot, no track is weighted above another, and no pattern repeats until the full playlist has played through.

---

## Features

- 🎲 **True random shuffle** — cryptographic randomness, not YouTube's pseudo-random algorithm
- 📋 **Full playlist loading** — fetches every video across all pages, not just the first 50
- ⏭ **Queue view** — see the full shuffled order and jump to any video
- 🔀 **Re-shuffle anytime** — re-randomize the remaining queue without interrupting the current video
- ⏯ **Play / Pause control** — full playback control without touching the YouTube player
- 📱 **Mobile friendly** — works in any mobile browser, no app install needed
- 📺 **Open on TV** — QR code and share link for Smart TVs, Fire Stick, and Chromecast browsers
- ⚡ **No login required** — just paste a playlist URL and go

---

## Usage

1. Copy any public YouTube playlist URL:
   ```
   https://youtube.com/playlist?list=PLxxxxxxxxxxxxxxxx
   ```
2. Paste it into YTShuffler
3. Hit **Load & Shuffle**
4. Enjoy your playlist in true random order

---

## Tech Stack

- **React 18** + TypeScript
- **Vite** (build tooling)
- **Tailwind CSS** + shadcn/ui (styling)
- **YouTube IFrame API** (video playback)
- **YouTube Data API v3** (playlist fetching)
- **Web Crypto API** (cryptographic shuffle entropy)
- **Netlify** (hosting)

---

## Self-Hosting

### Prerequisites
- Node.js 20+
- pnpm 9+
- A [YouTube Data API v3 key](https://console.cloud.google.com/apis/credentials)

### Setup

```bash
git clone https://github.com/your-username/ytshuffler.git
cd ytshuffler
pnpm install
```

Create a `.env.local` file in the project root:
```
VITE_YOUTUBE_API_KEY=your_api_key_here
```

### Run locally
```bash
pnpm dev
```

### Build for production
```bash
pnpm build
```

### Deploy to Netlify
Set the `VITE_YOUTUBE_API_KEY` environment variable in your Netlify site settings under **Site configuration → Environment variables**, then push to your connected repo.

---

## License

MIT
  