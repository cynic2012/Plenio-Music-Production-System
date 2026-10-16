# Plenio Player - design (0.8.1)

The owner's request (2026-10-15): a local website that plays the songs made with Plenio - choosing and
searching by many criteria, a page per song with its notation PDF and details, playback that shows which
lyrics are sung and where the music is on the sheet, playlists, and visuals in the spirit of Winamp (random
from a chosen set, one per playlist, one per song, other modes). It runs without ComfyUI, and playing should
feel as pleasant and animated as possible.

User guide: [docs/user/concepts/player.md](../user/concepts/player.md).

## 1. Constraints

| Constraint | Consequence |
|---|---|
| Runs without ComfyUI | its own small server (`python -m plenio.player`, `plenio_player.py`), only the Python standard library and `plenio.core` |
| No new dependencies, nothing downloaded at runtime | `http.server` (threaded), the page built with the existing frontend toolchain (Vue, abcjs) and **committed** to `plenio/player/static` like `web/js`; the waveform uses PyAV and numpy when they are there (ComfyUI's Python has them) and is left out otherwise |
| Writes into the songs' folders only to remove a song (owner's request 2026-10-16) | the listener's state, the library cache and the waveforms in `~/.plenio/player` (`PLENIO_PLAYER_STATE`); a removed song's files (`library.owned_files`: the record, the files it lists, the names Export Release uses - only inside the record's folder) move to `<library folder>/_retired/<subfolders>` (skipped by the scan; a name retired before gets a timestamp folder) or are deleted, on `POST /api/song/<id>/remove` with JSON `{action, confirm: <id>}` from the page's own origin |
| The release record is the source | the library is every `*.plenio.json` below the folders; nothing else is indexed |
| Local | binds to 127.0.0.1; requests must be addressed to it (DNS rebinding); files are served only from the record's own folder; no CORS; changes (state, removing) only as JSON from the page's own origin; on Windows no `SO_REUSEADDR`, so a second player cannot bind the port and leave the first one answering |

## 2. Data

- **Library** (`plenio/player/library.py`): per record a summary - title, date, length, model (from the
  render report), the brief's facts (typed values, the brief template's where a field was empty), tempo, key
  and meter from the score's header, seeds (the template's *Take/Draft/Arrangement seed* nodes), the writer
  model, loudness, tags, the files by kind (from the record's file entries, else the names Export Release
  writes), and a *takes key* (title + lyrics hash + score hash: the takes of one song). Cached by the
  record's size and time.
- **Song** (`song_detail`): the documents, the display ABC with the lyrics under the notes (the score
  editor's `editor_view`, so the sheet matches the editor and the PDF), the score's sections in score
  seconds, and the **timed lines**.
- **Timed lines**: Export Release measures when the lyrics are sung (subtitles-tags-seeds.md) and since this
  change also writes the result into the record: `timing[]` per exported take - `lines[]` with `start`,
  `end` and `units` `[start, cut, score?]` (the syllable's start, how much of the line it shows, the
  syllable's place in the score in seconds) and the `warp` (`t_audio = a * t_score + b`). Records without
  it fall back to the two SRT files (the notes file's cues inside a line become its units); records before
  0.8.1 have plain lyrics.

## 3. Time: song, lyrics and score

The syllables that have a score time are anchors `(t_audio, t_score)`, both rising. Song time to score time
interpolates between anchors and continues along the warp outside them (1:1 without anything); the inverse
puts a clicked note or a section on the song's time line. The karaoke wipe paints each chunk of a line from
its start to the next chunk's start (at most 1.6 s). The sheet's cursor uses abcjs's note timings at the
score's tempo, looked up at the score time - so a render that runs ahead of its score, or drifts, still
shows the right note.

## 4. Sound

Two decks of audio elements fed into Web Audio (the browser streams the files with HTTP ranges): a crossfade
loads the next song on the other deck and ramps both gains; each deck has the song's unmastered take beside
it at zero gain for **A/B** (switched in 30 ms, kept in step every frame). The analysers (the mix, left and
right) give the visuals one frame of spectrum, waveform, bass/mid/treble and a beat detector per animation
frame, however many visuals draw. Playback speed keeps the pitch (the elements' `preservesPitch`).

## 5. Visuals

13 presets on a canvas: Classic Bars, Oscilloscope, Stereo Vectorscope, Radial Bloom, Feedback Tunnel,
Hyperspace, Plasma, Inferno, Kaleidoscope, Beat Fountain, Spectrum Ridges, Ripples, Retro Grid - each a
`draw(ctx, frame, colors)` with the moods it suits. Which one plays (`visuals/chooser.ts`): the song's own
visual, else the playlist's, else the mode - *match the music* (presets whose moods match the song's genre,
mood and tempo; the same song starts with the same one), *random* from the ticked set (never twice in a
row), *cycle*, *fixed*. It changes with every song, at every section, every N seconds, or when the music
drops in after a quiet passage; changes blend over 0.8 s. Colour schemes: the song's (from its cover, else
its id and genre), Winamp classic, neon, sunset, mono.

## 6. The page

Vue 3, hash routes (`#/`, `#/favorites`, `#/top`, `#/recent`, `#/playlists`, `#/playlist/<id>`,
`#/song/<id>`). The library (featured song, search with field filters, facet chips, sort, grid/list), a
song's page (lyrics with jump-to-line, notation following the music, the PDF, details with seeds and every
file, takes, songs alike), playlists (smart lists, drag to reorder, a colour and a visual each), the queue
(reorder, save as playlist, crossfade, sleep timer), the bar (waveform seek with sections and the lyric under
the mouse, A/B, speed, mini visual), Now playing (Stage, Lyrics, Notation, Visual; title card; idle fade),
keyboard control and the system's media session. The song's colours tint the whole page.

## 7. Tests

`tests/unit/test_player.py` (library, detail, SRT fallback, ranges, state, host check, files outside the
folder), `tests/unit/test_subtitles.py` (the record's timing), `frontend/tests/player.test.ts` (timing,
search, songs alike, the visual chooser); the CI builds the page and checks the committed build matches.
The pages and views were checked in Chromium with 33 songs (console clean).

## 8. Left out

- No transcoding, no streaming outside the local network, no accounts.
- No PDF renderer of its own (pdf.js would be a new dependency): the browser's viewer shows the PDF.
- No editing of songs; removing one moves or deletes its files, nothing else.

## 9. One click from ComfyUI, settings kept, back to ComfyUI (owner's request 2026-10-16)

The owner: the player must be easy to find and start with one click, also from the workflows - but it stays
a program of its own that runs without ComfyUI (not built into ComfyUI); a song should go back into a
ComfyUI workflow for more work; every setting made in the browser must last, and say so; the song's page
must be easier to find.

| Question | Decision |
|---|---|
| How does a click in ComfyUI start the player? | ComfyUI only launches it. `POST /plenio/player/open` (in `plenio.comfy.routes`, the work in `plenio.player.launch`) looks for a Plenio Player on 127.0.0.1 (ports 8765-8769, `GET /api/info` says `"app": "plenio-player"`); if none answers it starts one - ComfyUI's own Python, `-m plenio.player --no-browser --folder <ComfyUI's output folder> --comfyui <this ComfyUI>`, a fixed argument list without a shell, detached, so it keeps running when ComfyUI stops; its output goes to `player.log` in its state folder - and waits until it answers. The page opens a named tab (`plenio-player`) at once (so no pop-up blocker stops it) and sends it to the player's address when the route answers. |
| Where is the click? | A **Plenio Player** button in ComfyUI's action bar (beside Run), the command in a **Plenio** menu (with *Continue a Plenio song…*) and the command palette, and on **Export Release** a button that opens the player at the song just exported (`#/record/<path>` → the song's page). |
| Without ComfyUI? | `Plenio Player.bat` in the package folder (Windows, a double click: it finds the portable build's or the venv's Python), `plenio_player.sh`, or `python plenio_player.py`. Started either way, it shares one state folder, so playlists are the same. |
| Stopping a player without a window | The Settings page has **Stop the player** (`POST /api/quit`, from the page only): a player started from ComfyUI has no console to press Ctrl+C in. |
| Back to ComfyUI | *Open in ComfyUI* on a song's page and in its menu: the page fetches the song's record, opens ComfyUI in a tab (`?plenio=continue`), and when the Plenio extension there says it is ready (`postMessage` to its opener) hands it the record; the extension continues the song as a dropped record does (`/plenio/records/continue`). It takes records only from its own origin or a loopback one. Which ComfyUI: the one that started the player (`--comfyui`), else the address in the settings, else the player's server probes loopback (8188, then 8000 for ComfyUI Desktop). |
| Settings that last | Everything the page remembers lives in the server's state file (`~/.plenio/player/state.json`, or `PLENIO_PLAYER_STATE`): playlists, favourites, plays, every setting, the last view of Now playing and the last tab of a song's page (they were in the browser's local storage before), and the library's search and filter chips per view (`settings.filters`; a *Filtered* row and *Reset filters*; the library's scroll position is kept per route for the session). Saved half a second after a change and once more when the page closes (`fetch` with `keepalive`). A **Settings** page says what is kept and where, shows when it was last saved, and offers a backup (download), a restore (upload) and a reset. |
| The song's page | A click on a card opens it (double-click and ▶ still play), an ⓘ button in the bar and in Now playing, the key **I**. |

## 10. MilkDrop-style visuals, more folders and other music, Live Play (owner's requests 2026-10-16)

| Request | Decision |
|---|---|
| Visuals like Winamp's MilkDrop - not taken from it, made anew, efficient, configurable, switchable off, full screen | **Plenio Drop**, a renderer of its own on WebGL2 (`visuals/drop/`), built on what makes MilkDrop: a feedback loop. Every frame draws the last one again, warped - zoom (with its curve over the radius), rotation, a sine warp field, stretch, drift around a centre - and fading (decay); then the waveform (circle, scope, line, spectrum, dots, as thick additive strips), shapes and motion vectors are drawn on top; a composite pass adds gamma, a video echo, symmetry and colour effects. Six warp families in the warp shader (plain, swirl, waves, tunnel, kaleidoscope, ripple); half-float buffers where the GPU has them (an 8-bit buffer fades in steps); the feedback runs at a fraction of the screen (the quality setting, 0.5-1). A preset is data, not code (owner: the format simple to understand and well documented, so that anyone can write presets): a JSON file whose values are numbers or formulas in a small language of our own (arithmetic, comparisons, ``a ? b : c``, a fixed list of functions), read by our own parser and evaluated by it - never as script, so a shared preset can draw and nothing else. Each frame starts from ``base``, works through ``frame`` in order (parameters and the preset's own variables, which carry over), then the waves and shapes (each ``repeat`` times with ``i``/``n``). Mistakes are reported with where and why. The listener's presets live in ``visuals/`` in the state folder (``GET /api/visuals``, read again every three seconds: a file saved changes on screen; ``POST /api/visuals/copy`` saves a copy of a preset to edit, never overwriting; ``POST /api/visuals/open`` shows the folder). The guide is docs/user/concepts/player-visuals.md; a test compiles its examples. Motion is per frame at 60 fps and scaled for other frame rates. Every change of preset glides: the buffer stays, the parameters move to the new ones over two seconds. Sixteen presets of our own, written in the same format (so they are examples too), and *Drop · Random*, which makes a new one each time. Colours come from the scheme's palette of bright colours, going round. They are visuals like the others (the same chooser, per song, per playlist, the same switches); one shared WebGL context, drawn into the visual's canvas. Full screen: a double-click on the visual, a button in the visuals' panel and in the bar's little visual, and the key Shift+F. |
| Several song folders, chosen in Settings | The server keeps the folders in `library.json` in its state folder (`GET/PUT /api/folders`); the Settings page lists them, adds one through a folder browser (`GET /api/dirs`: the drives and subfolders of this computer - JSON for the player's own page only) and removes one. With a `library.json`, its folders win over `--folder` and the default. |
| Songs not from Plenio | Per folder, *also other music*: audio files (FLAC, MP3, WAV, OGG, M4A, OPUS) that no release record lists become songs of their own - title, artist, album, genre and length from their tags (PyAV), cached like the records. They carry a clear mark (*Other music* on the card, the page, the search `is:other`) and have what their file has: the audio, its tags and lyrics if any - no notation, no times, no brief, no *Open in ComfyUI*. |
| Live Play | A view of its own: the queue as a live playlist that plays while you change it (add, remove, drag to reorder, play next) - and the songs ComfyUI makes now join it as soon as Export Release has written them: at the end, next, or somewhere at random. The page asks the server every few seconds for songs newer than the last it saw (`GET /api/new?since=`, the server reads the folders again for it); a new song shows a message and a *new* mark. When the playlist runs out the music does not stop: it starts again from the top (or waits for the next new song). The live settings are kept with the others. |
