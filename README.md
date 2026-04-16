# YTShuffler

**True random shuffle for YouTube playlists — because YouTube's shuffle isn't actually random.**

🔗 [ytshuffler.com](https://ytshuffler.com)

---

## The Problem

YouTube's built-in shuffle isn't random. Under the hood, it uses the same recommendation engine that drives your entire feed — which means the "shuffle" is silently influenced by watch history, popularity, and engagement signals. The result? You end up hearing the same artist multiple times in a row, the same popular tracks keep surfacing near the top, and your deeper cuts never get a fair shot. It's not shuffle — it's a soft recommendation loop wearing a shuffle badge.

## The Solution

YTShuffler bypasses YouTube's algorithm entirely. It fetches your complete playlist via the YouTube Data API, then shuffles it locally — on your device — using a **cryptographic Fisher-Yates shuffle** that no server, algorithm, or engagement metric can influence.

## How the Shuffle Works

Most shuffle implementations — including YouTube's — rely on `Math.random()`, a pseudo-random number generator seeded from a simple system clock value. Pseudo-random means the numbers only *look* random; given the same seed, the sequence is fully deterministic and repeatable. YouTube layers further bias on top by weighting its shuffle toward videos it predicts you'll engage with, which is why the same handful of popular tracks keep bubbling to the surface.

YTShuffler takes a different approach. Each shuffle position is decided by a custom entropy function that combines two independent sources of randomness:

1. **The Web Crypto API** — your browser's built-in cryptographically secure random number generator (CSPRNG). Unlike `Math.random()`, the CSPRNG is seeded from genuinely unpredictable hardware-level noise (interrupt timing, CPU jitter, OS entropy pools), making the output statistically indistinguishable from true randomness.

2. **Sub-millisecond timing noise** — `performance.now()` captures the fractional microseconds of the exact moment the number is requested. This value fluctuates based on CPU scheduling, memory state, and other runtime conditions that can't be predicted or reproduced.

These two values are XOR-mixed through an avalanche function — meaning a single-bit difference in either input flips roughly half the output bits — and the result is normalized to a uniform float in `[0, 1)`.

That float feeds a **Fisher-Yates shuffle**: a mathematically proven algorithm that walks the playlist from last position to first, swapping each video with a randomly chosen video at or before it. Every possible ordering of the playlist has an exactly equal probability of occurring — `1 / n!` for a playlist of `n` videos. There is no weighting, no history, and no repetition until every video has played.

The practical result: on a 100-video playlist, YTShuffler has 9.3 × 10¹⁵⁷ possible orderings, and each one is equally likely.

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
  