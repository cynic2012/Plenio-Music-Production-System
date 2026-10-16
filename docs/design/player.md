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
