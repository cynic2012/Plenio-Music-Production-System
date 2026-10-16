# Plenio Player

A page in your browser that plays the songs you made with Plenio. It is a program of its own: it runs
**without ComfyUI**, and ComfyUI can start it with one click. Make songs in ComfyUI and listen in the player
at the same time, or just listen.

It finds every song that Export Release wrote (each export writes a `.plenio.json` release record next to
the audio). It shows them as a library you can search. While a song plays, the lyrics light up word by word,
a cursor follows the notes on the sheet music, and Winamp-style visuals move with the music. Every song can
go back into ComfyUI to work on it.

## Open the player

### From ComfyUI: one click

- **Plenio Player** (▶) in ComfyUI's action bar, beside **Run**.
- The menu **Plenio › Plenio Player** (also in the command palette).
- **▶ Open in the Plenio Player** on **Export Release**: after a run it opens the player right at the song the
  node just exported.

The player opens in a browser tab of its own; the next click brings that tab back. If no player runs yet,
ComfyUI starts one first (a few seconds): it plays ComfyUI's output folder and finds ComfyUI again for
*Open in ComfyUI*. A player started this way keeps running when you close ComfyUI, and it has no window -
stop it on its **Settings** page (*Stop the player*). Its messages go to `player.log` in the player's state
folder (`~/.plenio/player`).

### Without ComfyUI: a double click

In the Plenio folder (`ComfyUI/custom_nodes/Plenio-Music-Production-System`):

- **Windows:** double-click **`Plenio Player.bat`**. It finds the Python of your ComfyUI - the portable
  build's `python_embeded`, or the `.venv` of a manual or Desktop install.
- **macOS and Linux:** run **`./plenio_player.sh`**.

The browser opens at `http://127.0.0.1:8765/`. Stop the player with Ctrl+C in its window, or on its
Settings page. The same by hand, with the Python that runs your ComfyUI (any Python 3.10 or newer works;
the waveform needs PyAV and numpy):

```bash
# from the ComfyUI folder (a venv install)
.venv/Scripts/python custom_nodes/Plenio-Music-Production-System/plenio_player.py

# the Windows portable package
python_embeded\python.exe ComfyUI\custom_nodes\Plenio-Music-Production-System\plenio_player.py

# or as a module, from the package folder
python -m plenio.player
```

However you start it, it is the same player with the same playlists and settings.

| Option | What it does |
|---|---|
| `--folder <folder>` | The folder to read songs from, with all its subfolders (repeatable). The default is ComfyUI's `output` folder when Plenio sits in `ComfyUI/custom_nodes`, else the current folder |
| `--port 8765` | Another port, if 8765 is taken |
| `--no-browser` | Do not open the browser |
| `--comfyui http://127.0.0.1:8188` | The ComfyUI that *Open in ComfyUI* goes to (the button in ComfyUI sets it) |
| `--host 127.0.0.1` | Only this computer can open the player. `--host 0.0.0.0` opens it to your network. There is no login, so only do this on a network you trust |

Instead of `--folder` you can set `PLENIO_PLAYER_FOLDER` (several folders separated by `;` on Windows, `:`
elsewhere).

**What it writes:** your playlists, favourites, play counts and settings ([see below](#your-settings-are-kept))
and the waveforms it has worked out go to `~/.plenio/player` (or the folder in `PLENIO_PLAYER_STATE`). In your
song folders it changes something only when you remove a song ([see below](#remove-a-song)).

If the port is taken - the player is already running, or another program uses 8765 - it says so and does
not start; open the running one, or start it with `--port 8766`. (ComfyUI's button finds a running player on
8765-8769, and else starts one on the first free port.)

New songs show up when you click **Look for new songs** in the sidebar, or reload the page.

## The library

The library shows a featured song at the top, then every song as a card with its cover. Songs without a
cover get artwork drawn from their colours and genre. **Click a card to open the song's page; ▶ on its cover
plays it.** In the list view, a double click plays a song and ⓘ opens its page. A right-click or ⋯ opens the
song's menu:

- **Play next** or **Add to the queue**
- **Start a radio of songs alike**: the song, then up to 40 songs like it
- **Add to favourites**, or add it to a playlist
- **Open the song's page**
- **Open in ComfyUI** ([see below](#continue-a-song-in-comfyui))
- **Remove from the library…** ([see below](#remove-a-song))

**Search** looks through titles, lyrics, genres, moods, styles and briefs; every word you type must match.
A line from the lyrics shows on the card when a word matches there. You can also narrow the search with
fields:

| Type | Finds |
|---|---|
| `genre:jazz` `mood:warm` | the brief's genre, mood |
| `bpm:>110` `bpm:90-120` | tempo from the score |
| `key:Am` `meter:6/8` | key and meter |
| `model:yue2` `model:minimax` `model:master` | the music model (*master*: recordings from Enhance & Master) |
| `lang:german` `vocals:instrumental` | language, vocals |
| `mode:dramatic` | the creative mode |
| `len:<3` | length in minutes |
| `year:2026` `template:jazz` `writer:gemma` | year, brief template, the model that wrote the lyrics |
| `is:fav` `is:cover` | favourites, covers |
| `has:pdf` `has:timing` `has:original` | songs with sheet music, timed lyrics, an unmastered take |
| `"a phrase"` `-word` | an exact phrase; leave out songs with a word |

The **chips** under the search are your most common genres, moods, models, languages and creative modes; a
click filters, a second click removes the filter. You can sort by newest, oldest, title, length, tempo,
loudness, most played or recently played, and switch between a grid and a list.

**Your search and filters stay** - when you open a song's page, go to another view or another window and
come back, or reload the page; the library also keeps its place in the list. Each view (*Songs*,
*Favourites*, *Most played*, *Recently played*) has its own. While a search or filter is on, a **Filtered**
row shows each of them (× removes one) and how many songs are left, and **Reset filters** clears them all.

## A song's page

Open it with a click on the song's card or title, with ⓘ beside the song in the bar at the bottom and at the
top of Now playing, or with the key **I** (the song that plays). It shows the cover, the style, how often you
played it, the buttons *Play*, *Add to favourites*, *Playlist, queue …*, **Open in ComfyUI** and **Remove…**,
and these tabs (it opens on the tab you used last). The page of the song that plays follows the music: when the next song starts, the page shows that one, on the same tab
(on *Lyrics*, its live lyrics), and Back still leads to where you came from.

- **Lyrics**: every line with the time it is sung. Click a line to hear the song from there. While the song
  plays, the lyrics light up as they are sung, and the line sung now stays in view.
- **Notation**: the score with the lyrics under the notes. While the song plays, the notes light up as they
  sound and the sheet scrolls along. Click a note to jump there.
- **Sheet music**: the PDF from Export Release, in the browser's PDF viewer.
- **Details**: the brief (genre, mood, tempo, key, voice, theme, template, creative mode, genre closeness),
  the model and the writer, loudness and true peak, the seeds (with a copy button, so you can make the take
  again), the tags in the file, the cover's prompt, and every file to download: FLAC, MP3, WAV, the
  unmastered take, the PDF, both subtitle files, the cover and the release record. The record's path is
  shown with a copy button, ready for *File > Continue a Plenio song…* in ComfyUI.
- **Takes**: the song's other takes (same title, lyrics and score, rendered again). Play them one after the
  other to compare.
- **Alike**: songs with a similar genre, mood, tempo, key and language.

## Now playing

Click the cover in the bar at the bottom (or press **F**) for the full screen. It has four views:

- **Stage**: the cover floating in the song's colours, with the lyrics beside it.
- **Lyrics**: the lyrics, large and centred, lit up as they are sung (like karaoke).
- **Notation**: the sheet following the music, with the lyrics at the side.
- **Visual**: only the visual, with the lyrics as subtitles. The controls fade out while the mouse rests.

Every view has the song's sections as chips (*Verse*, *Chorus* …; click to jump) and the song's waveform:
the part already played is filled in the song's colours, and hovering shows the time, the section and the
line sung there. Click or drag the waveform to jump. A title card greets every new song.

The bar at the bottom always shows the song, the line sung right now, the controls and a small visual. It
also has:

- **A · master / B · original**: switches to the unmastered take and back without a gap, at the same moment
  in the song. You get this when you export with Export Release's *original* input connected (every
  template connects it).
- **Speed**: 0.75× to 1.25× without changing the pitch, to learn a part or sing along.
- **Volume**, **mute**, **shuffle** and **repeat** (all, one, off).

Songs fade into each other (**crossfade**, 3 seconds by default; set 0-12 s in the queue). The player
remembers where you stopped and picks up there next time. The media keys on your keyboard and the operating
system's media controls work too.

## Visuals

Visuals in the spirit of Winamp, MilkDrop and AVS, drawn live from the music (its spectrum, its waveform,
left against right, the bass and the beats):

| Visual | What you see |
|---|---|
| Classic Bars | Winamp's spectrum: bars with caps that fall slowly, mirrored on the floor |
| Oscilloscope | the waveform as a glowing line with afterglow |
| Stereo Vectorscope | left against right: the stereo picture of the music, drawn in light |
| Radial Bloom | the spectrum as petals around a pulsing core |
| Feedback Tunnel | MilkDrop-style feedback: each frame zooms and turns the last |
| Hyperspace | a starfield that rushes with the bass |
| Plasma | flowing colour fields, faster and brighter with the music |
| Inferno | AVS fire: the spectrum feeds the flames |
| Kaleidoscope | the waveform and floating lights, mirrored into twelve slices |
| Beat Fountain | every beat throws a burst of sparks |
| Spectrum Ridges | the spectrum's recent past as glowing ridges |
| Ripples | every beat drops a ring into still water |
| Retro Grid | a synthwave horizon: the sun pulses, the grid races with the bass |

Open the visuals' settings with ✦ in Now playing (or press **V**):

- **Mode**:
  - *Match the music*: a visual that suits the song's genre, mood and tempo (the default). Calm songs get
    calm visuals, dance songs fast ones.
  - *Random*: a random pick from the visuals you tick, never the same twice in a row.
  - *Cycle*: the ticked visuals in turn.
  - *Fixed*: always the same visual.
- **Change**: with every song, at every section (verse, chorus …), every few seconds, or *when the music
  drops in* after a quiet passage.
- **This song**: a visual of its own for the song that plays. It is kept for that song.
- **The playlist**: a visual for the whole playlist that plays. You can also choose it on the playlist's page.
- **Look**: the song's colours, Winamp classic, neon, sunset or monochrome. **Sensitivity** makes the visuals
  react more or less. Switch the lyrics over the visual and the title card on or off.

A song's own visual wins, then the playlist's, then the mode. **N** shows another visual right away.

## Playlists and the queue

**Playlists** in the sidebar lists the smart lists first: *Favourites*, *Most played*, *Recently played* and
*Never played*. Your own playlists follow. Make a new one with + in the sidebar, on the Playlists page, or
from a song's menu. On a playlist's page you can:

- rename it (click the name)
- reorder songs by dragging, or remove them
- add songs with the search
- give it a colour and a visual of its own
- play it in order or shuffled

The **queue** (the list icon in the bar, or **Q**) shows what played, what plays and what comes next. Drag to
reorder, remove songs, clear the rest, or **save the queue as a playlist**. It also holds the crossfade and
the **sleep timer**: stop after 15 to 90 minutes, with the music fading out over the last seconds, or after
this song.

A song counts as played after 30 seconds.

## Continue a song in ComfyUI

**Open in ComfyUI** on a song's page (or in its menu) opens ComfyUI in a browser tab with the song's
workflow - its brief, its lyrics, its score and its settings, as the song was made - ready for another take, a
new arrangement or an edit of the lyrics or the notes. It is the same as *File › Continue a Plenio song…*
in ComfyUI, or dropping the song's FLAC onto ComfyUI: the song's record travels from the player to the
ComfyUI tab.

It needs a ComfyUI with Plenio 0.8.1 or newer running on this computer. Which one: the ComfyUI that started
the player; else the address under **Settings › Open in ComfyUI**; else the player looks for one at
`127.0.0.1:8188` and `127.0.0.1:8000` (ComfyUI Desktop). The Settings page says which ComfyUI it found.

## Your settings are kept

Everything you set in the player is kept - not in the browser, but by the player itself, on this computer:

- your playlists, their order, colours and visuals, your favourites and play counts
- every setting: the visuals (mode, the ticked ones, a song's own visual), the colours, volume, crossfade and
  speed, the library's sort and view, and its search and filters (per view)
- the view Now playing opens in and the tab a song's page opens on
- where you stopped: the queue and the moment in the song (the player starts there next time)

It is saved half a second after each change, and once more when you close the page. So it is all still
there after closing the browser or restarting the computer, in another browser, and whether you started
the player from ComfyUI or by hand. *Settings* in the sidebar says **kept ✓** (or *saved ✓* after a change).

The **Settings** page shows what is kept, the file it is kept in (`~/.plenio/player/state.json`), and when it
was last saved, and it has:

- **Download a backup** - a `.json` file with everything above (the songs stay in their folders)
- **Restore a backup…** - read such a file back, on this or another computer
- **Start afresh…** - forget playlists, favourites, play counts and settings (asks once more)

It also shows where *Open in ComfyUI* goes, the folders the player reads, the player's version, and
**Stop the player**.

## Remove a song

A song you do not want any more: **Remove…** (👎) on its page, or *Remove from the library…* in its menu.
The dialog lists the song's files - the record, the audio of every take, the unmastered take, the cover,
the sheet music, the subtitles, the stems - and offers two ways:

- **Move to the retired songs**: the files go to `_retired` in the library folder, in the same subfolders
  as before (`output/plenio/…` → `output/_retired/plenio/…`). The player does not read that folder. To have
  the song back, move its files back and click **Look for new songs**. A song of the same name retired
  before keeps its place: the next one gets a folder of its own, named after the time.
- **Delete permanently**: the files are deleted, not moved to the recycle bin. The button asks once more
  (*Yes, delete 7 files for good*).

Either way the song leaves the queue, your playlists and your favourites. A song that is playing makes way
for the next one first. Only files in the song's own folder are touched, never a file the record names
elsewhere.

## Keys

| Key | Does |
|---|---|
| Space | play / pause |
| ← → | back / ahead 5 seconds |
| Shift + ← → | previous / next song |
| ↑ ↓ | louder / quieter |
| F | Now playing |
| I | the page of the song that plays |
| 1 2 3 4 | Stage, Lyrics, Notation, Visual |
| V | the visuals' settings |
| N | another visual |
| L | favourite |
| S | shuffle |
| R | repeat: all, one, off |
| B | A/B: master or unmastered take |
| M | mute |
| Q | the queue |
| / | search |
| Esc | close |
| ? | all keys |

## Where the times come from

Since 0.8.1, Export Release listens to every song as it exports it. It writes when each lyrics line and
syllable is sung into the release record and into the [subtitle files](tags-and-subtitles.md), and for songs
with a score, where each syllable sits in the score. The player reads these times. On the songs measured
for 0.8.1, half the words were within 0.16 seconds and 82 % within half a second.

- **Songs exported before 0.8.1** have no times. The player shows their lyrics as plain text, and the sheet's
  cursor follows the score's tempo. Open the song with *File > Continue a Plenio song…* and export it again
  to add the times.
- **Songs with subtitle files but no times in the record** (a record edited by hand) take the times from the
  `.srt` files.
- **Recordings** from Enhance & Master have no score. They play with their waveform and visuals, without
  notation.

## Limits

- The player plays what the browser can play: FLAC, MP3 and WAV work in Chrome, Edge and Firefox (and in
  Safari since version 11).
- The sheet music tab uses the browser's PDF viewer. If your browser has none, use *Open the PDF*.
- The player does not edit songs. It moves or deletes their files only when you remove a song.
- The player keeps a cache of the records it has read in its state folder, so on later starts it reads
  only new or changed records again.
