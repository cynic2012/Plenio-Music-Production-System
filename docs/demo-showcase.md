# Adding songs and song videos to the demo page

The [demo page](https://jplenio.github.io/Plenio-Music-Production-System/) shows song videos on YouTube and new songs
from `docs/demo-showcase.js`. `tools/demo_showcase.py` writes that file - run it from the repository's folder with the
Python of your ComfyUI (it reads songs with Plenio's own code), then commit and push: GitHub Pages shows the change a
minute later.

## A song

```
python tools/demo_showcase.py add "D:/ComfyUI/output/plenio/2026-10-29 Neon Midnight.flac" --soundcloud https://soundcloud.com/you/neon-midnight
```

Give the song's FLAC (or its `.plenio.json`) and where it plays - one or more of:

| Option | The page plays the song |
|---|---|
| `--soundcloud URL` | in SoundCloud's player, loaded when the visitor presses play |
| `--youtube URL` | as its YouTube video (it then shows with the song videos) |
| `--audio` | from the page itself: the MP3 Export Release wrote beside the FLAC is copied into `docs/assets/showcase/` (without one, it is encoded from the FLAC the same way). An MP3 is a few megabytes in the repository - for a handful of songs; SoundCloud or YouTube for many. |

The card shows the cover (copied 640 pixels square), the genre, language, length, tempo and key, the style, the lyrics
and how the song was made - when, how long it took and on which graphics card. `--no-lyrics` leaves the lyrics out,
`--note "…"` adds a line of your own. Nothing else of the record is copied: not the prompts, the seeds, the processor,
the paths or the record itself.

## A song video

```
python tools/demo_showcase.py add-video https://youtu.be/hPq9tUjTzr0 --title "Restrained Driving Atmosphere" --genre "Progressive Trance"
```

Any YouTube link works (`youtu.be`, `watch?v=`, Shorts) or the bare video id. The page shows YouTube's picture of the
video and loads the player (from `youtube-nocookie.com`) only when the visitor presses play.

## The list

```
python tools/demo_showcase.py list
python tools/demo_showcase.py remove neon-midnight
```

`list` shows every entry with its id, newest first - the page's order. `remove` takes an entry out and deletes the
files it copied into `docs/assets/showcase/`. A video added in the last 45 days carries a *NEW* mark on the page.

The archive further down the page - the songs of Plenio 0.2.2, MiniMax Music 3 and the covers - has its own catalogs;
[docs/dev/release.md](dev/release.md#demo-gallery) describes them.
