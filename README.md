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

### Core Playback
- 🎲 **True random shuffle** — cryptographic randomness, not YouTube's pseudo-random algorithm
- 📋 **Full playlist loading** — fetches every video across all pages, not just the first 50
- ⏭ **Queue view** — see the full shuffled order and jump to any video
- 🔀 **Re-shuffle anytime** — re-randomize the remaining queue without interrupting the current video
- ⏯ **Play / Pause control** — full playback control without touching the YouTube player
- 📱 **Mobile friendly** — works in any mobile browser, no app install needed
- 📺 **Open on TV** — QR code and share link for Smart TVs, Fire Stick, and Chromecast browsers
- ⚡ **No login required** — just paste a playlist URL and go

### Lyrics
- 🎵 **Synced lyrics** — real-time karaoke-style display that tracks the current line as the song plays, sourced from [lrclib.net](https://lrclib.net)
- 📄 **Plain text fallback** — if synced lyrics aren't available, unsynced lyrics are fetched from [lyrics.ovh](https://lyrics.ovh) and displayed as a scrollable transcript
- 🔍 **Smart title parsing** — strips noise like "(Official Music Video)", "(feat. Artist)", "[HD]", and emoji from YouTube titles before searching, dramatically improving match rates
- ⏸ **Auto-pause while loading** — when lyrics mode is on, the video waits until lyrics are fetched before playing, so you never miss the first lines
- ⏱ **Per-song sync offset** — use the **−** and **+** buttons (±0.5 s steps) to nudge lyrics earlier or later for a song; your offset for each song is saved automatically and restored next time
- 🔄 **Offset reset** — the **↺** button clears a song's saved offset back to zero
- 🚀 **Lyrics prefetch** — lyrics for the next 3 upcoming songs are fetched silently in the background so they appear instantly when those songs start

### Visuals
- 🖼 **Custom wallpaper** — upload any image as a full-page parallax background; saved to localStorage so it persists across sessions
- 🎬 **Theater mode** — expands the player to fill the entire viewport; press **Esc** or the exit button to return to normal view
- ✨ **Frosted-glass UI** — when a wallpaper is set, all cards and the theater overlay use a semi-transparent blur effect so the wallpaper shows through

---

## Usage

### Basic playback

1. Copy any public YouTube playlist URL:
   ```
   https://youtube.com/playlist?list=PLxxxxxxxxxxxxxxxx
   ```
2. Paste it into YTShuffler and hit **Load & Shuffle**
3. Enjoy your playlist in true random order

### Lyrics

1. While a song is playing, click the **Lyrics** toggle to enable lyrics mode
2. Synced lyrics scroll automatically — the current line is highlighted in bold
3. If only plain text lyrics are available they are shown in a scrollable panel instead
4. To fix timing drift, use the **−** / **+** buttons next to the offset display (e.g. `+1.0s`) to shift lyrics earlier or later in 0.5 s steps — the adjustment saves automatically per song
5. Click **↺** to reset a song's offset to zero
6. Toggle lyrics off at any time; the video resumes immediately

### Wallpaper

1. Click the wallpaper icon in the toolbar and choose an image file
2. The image becomes a fixed parallax background behind the entire UI
3. To remove it, click the wallpaper icon again and select **Remove**

### Theater mode

1. Click the **⛶ Theater** button (or the expand icon on the player) to go fullscreen
2. Press **Esc** or the **✕** button to exit
3. If a wallpaper is set it remains visible behind the frosted theater overlay

---

## Tech Stack

- **React 18** + TypeScript
- **Vite** (build tooling)
- **Tailwind CSS** + shadcn/ui (styling)
- **YouTube IFrame API** (video playback)
- **YouTube Data API v3** (playlist fetching)
- **Web Crypto API** (cryptographic shuffle entropy)
- **lrclib.net** (synced LRC lyrics)
- **lyrics.ovh** (plain text lyrics fallback)
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
  