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

## Your folders, and other music

The player reads every release record below its folders: ComfyUI's output folder unless you choose others.
Choose them on the **Settings** page under **Songs**:

- **Add a folder…** opens a folder browser: start at *Home*, your music folder or a drive, go into a folder,
  or type or paste its path, then **Choose this folder**. Add as many folders as you like; × stops reading one
  (its files stay where they are).
- **also other music** (per folder): the player also plays the folder's audio files that were **not made
  with Plenio** - FLAC, MP3, WAV, OGG, Opus, M4A. The files of a Plenio song (its audio, its unmastered take,
  its stems) always stay with that song.
- **Back to the start's folders** forgets your choice.

The folders are kept with the player (`library.json` in `~/.plenio/player`), so the player started from
ComfyUI reads them too.

**Other music is clearly marked**: *other music* on its card, **Other music** on its page, *Made with: other*
among the library's filters, `is:other` in the search (`is:plenio` for the rest, `artist:` and `album:` for
their tags). It has what its file has, no more: the title, artist, album, genre and year from its tags, the
picture inside the file (or a `cover.jpg` / `folder.jpg` beside it), the lyrics from its tags - and timed
lyrics, word by word, from an `.lrc` file of the same name beside it (or an `.srt`). It plays with the
visuals, in playlists and the queue like every song, and can be removed (the audio and its own `.lrc` go,
never the folder's cover). What needs a release record is not there: no notation, no sheet music, no brief or
seeds, no measured lyrics, no *Open in ComfyUI*.

The first time a folder with much other music is read, the player reads every file's tags once (a few
seconds per thousand files); after that it remembers them.

## The library

The library shows a featured song at the top, then every song as a card with its cover. Songs without a
cover get artwork drawn from their colours and genre. **Click a card to open the song's page; ▶ on its cover
plays it.** In the list view, a double click plays a song and ⓘ opens its page. A right-click or ⋯ opens the
song's menu:

- **Play next** or **Add to the queue**
- **Start a radio of songs alike**: the song, then up to 40 songs like it
- **Add to favourites**, or add it to a playlist
- **Open the song's page**
- **Tags…**: your own tags for the song ([see below](#tags-of-your-own))
- **Open in ComfyUI** ([see below](#continue-a-song-in-comfyui))
- **Remove from the library…** ([see below](#remove-a-song))

**Search** looks through titles, lyrics, genres, moods, styles, briefs and your tags; every word you type must
match. A line from the lyrics shows on the card when a word matches there. You can also narrow the search with
fields - **as you type, the search suggests them**: `gen` offers `genre:`, `genre:blu` offers every genre with
*blu* and how many songs have it, `#` your tags (↑ ↓ to choose, Enter or Tab to take one):

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
| `tag:party` `#party` `tag:"road trip"` | your own tags |
| `is:fav` `is:cover` `is:other` `is:plenio` | favourites, covers, other music, Plenio's songs |
| `is:unplayed` `is:played` `is:tagged` `is:untagged` | never played or played, with or without tags of yours |
| `plenio:>=0.8` `plenio:0.7` `plenio:0.5-0.7` | songs made with a Plenio version: from 0.8 on, any 0.7.x, from 0.5 to 0.7 |
| `artist:` `album:` | the tags of other music |
| `has:pdf` `has:timing` `has:original` `has:score` | songs with sheet music, timed lyrics (measured or from subtitle files), an unmastered take, notation |
| `"a phrase"` `-word` | an exact phrase; leave out songs with a word |

The **filters** under the search are rows of chips - your tags, genres, moods, what made the song (Plenio or
other music) and the model; **More filters** opens vocals, language, tempo (slow, 90-119, 120-139, fast), length
(under 3, 3-5, over 5 minutes), key, creative mode, template, year, Plenio version, what a song has (timed
lyrics, sheet music, notation, an unmastered take, a cover picture) and listening (favourites, played, never
played, no tags yet). A row shows its most common values first; **+ 113 more** opens it to every value - every
genre a template gave, the rare ones too - with a field to find one in a long row.

- **A click** on a chip keeps only the songs with it; a second click takes the filter off.
- **A right click** (a long press on a phone) **leaves those songs out**: the chip turns red and struck
  through, *not Genre: jazz* in the Filtered row.
- **The numbers** on the chips are how many of the songs shown have that value - so with a filter on, every
  chip says how many songs would stay. A row that could not narrow the songs further is left out.
- **Plenio version** offers *from 1.0.0*, *from 0.8.0* … for an archive with songs of older versions: only the
  songs made with that version or a newer one. Tempo, length and Plenio version take one choice at a time (a
  click on another replaces it).

You can sort by newest, oldest, title, length, tempo, loudness, most played or recently played, and switch
between a grid and a list.

**Saved filters**: *Save this filter…* in the Filtered row keeps the search and the filters under a name; the
sidebar lists them under *Saved filters* - a click shows those songs again, × forgets one.

### Tags of your own

Every song can have tags of yours - *party*, *road trip*, *for Anna* …:

- **On a song's page**, under its facts: type a tag and press Enter (or a comma). The tags you gave before are
  offered as you type - choose one with ↑ ↓ or the mouse. × takes a tag off; Backspace in the empty field the
  last one.
- **In a song's menu** (right click or ⋯): **Tags…**, the same.
- **For many songs at once**: **Tag…** on the songs' page gives a tag to every song shown - all of them, or the
  ones a search or filter shows. It also lists the tags those songs have (*party 12/37*: 12 of the 37) to take
  one off all of them.

A tag is found with `#party` or `tag:party` and in the filter row **Tags**; the cards show their tags - a click
on one shows the songs with it. Capitals do not make a new tag: *party* given after *Party* is *Party*.
**Settings > Tags** lists every tag with how many songs have it, to rename one (into another tag: the two become
one) or take it off every song; the filters that name it follow. Tags are kept with your playlists (in
`state.json`, and in a backup), and *Share as a player* can take your tags of the songs along.

**Your search and filters stay** - when you open a song's page, go to another view or another window and
come back, or reload the page; the library also keeps its place in the list, and as many songs as *Show more*
had shown. **Back to the songs, the page shows the song that plays**: when it is not in sight where you left
the list, the page goes to it - however far down, also among a thousand songs - and its card lights up for a
moment. Each view (*Songs*, *Favourites*, *Most played*, *Recently played*) has its own. While a search or filter is on, a **Filtered**
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
  sound and the sheet moves on with the music: the line of music sounding now always stays in view, also
  after a jump or when you come back to the tab. The cursor points at the notes sounding (where only rests
  sound, already at the bar's next note); it stands at the bar's chord only in a bar with no note, one note
  or only a rest. Click a note to jump there.
- **Sheet music**: the PDF from Export Release, in the browser's PDF viewer.
- **Details**: *The song* lists every field of the brief the song was made with - work mode, template,
  genre, mood, tempo, key, meter, length and target length, vocals, language, voice, lyrics theme (or melody
  and lead instrument), for a cover the harmony and the closeness sliders, the arrangement, genre closeness
  and lines under the singing. A field you left empty shows the brief's default with *(default)*, or - for a
  text field, which has none - *open - the writer chose*; a value the template filled says *(from the
  template)*. Then the model and the writer, loudness and true peak, the seeds (with a copy button, so you can make the take
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

**How the lyrics look** - in the Lyrics and Stage views, on a song's page and in the subtitles over the
visual: 🎤 in Now playing, or *Lyrics* in Settings.

- **Font**: Clean, Condensed, Poster, Rounded, Elegant serif, Classic serif, Handwritten, Script, Typewriter,
  Code, Blackletter - each shown in itself - or **your own font**: the name of any font installed on this
  computer. (The player uses the computer's fonts and downloads none; each choice names fonts that Windows,
  macOS and Linux have, the first one found is used.)
- **Effect** - how each syllable comes in as it is sung: *Sweep* (the colour runs through it), *Glow*,
  *Bounce* (it hops), *Pop* (it swells and settles), *Wave* (the letters ripple), *Typewriter* (the line types
  itself), *Rise* (syllables float up and in), *Focus* (blurred until sung), *Neon* (outlines that flick on),
  *Rainbow*, *On the beat* (the line pulses with the music). A line at the top sings itself as a preview.
- **Colour** of what is sung (white, the song's colour, gold, ice, pink, lime) and the **size**.

**The visual on the whole screen:** press **Shift + F**, double-click the visual, click *full screen* in the
visuals' settings, or click ⛶ on the small visual in the bar at the bottom. Again (or Esc) to go back.

Every view has the song's sections as chips (*Verse*, *Chorus* …; click to jump) and the song's waveform:
the part already played is filled in the song's colours, and hovering shows the time, the section and the
line sung there. Click or drag the waveform to jump. A title card greets every new song.

The bar at the bottom always shows the song, the line sung right now, the controls and a small square
visual - a bright ring of the music round a core that pulses with the bass, which breathes slowly when the
music stops; click it for Now playing. It also has:

- **A · master / B · original**: switches to the unmastered take and back without a gap, at the same moment
  in the song. You get this when you export with Export Release's *original* input connected (every
  template connects it).
- **Speed**: 0.75× to 1.25× without changing the pitch, to learn a part or sing along.
- **Volume**, **mute**, **shuffle** and **repeat**: the button (in the bar and in Now playing) goes from
  **repeat the whole playlist** (after its last song the queue starts again) to **repeat this song** (a small
  *1* on the button) to **no repeat** (the music stops after the last song). **R** does the same. A song's
  end is caught also while the player's tab is in the background.

Songs fade into each other (**crossfade**, 3 seconds by default; set 0-12 s in the queue). A song you start
always plays from its beginning. The player remembers where you stopped: the next time, ▶ in the bar (or
Space) picks up there; starting the song from its page or its card plays it from the beginning. The media keys on your keyboard and the operating
system's media controls work too.

## Visuals

Visuals in the spirit of Winamp, MilkDrop and AVS, drawn live from the music (its spectrum, its waveform,
left against right, the bass and the beats). There are two kinds.

**Classic visuals:**

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

**Plenio Drop**: visuals like Winamp's MilkDrop, drawn by Plenio's own renderer on the graphics card (nothing
is taken from MilkDrop). Each frame draws the last one again - zoomed, turned, bent, fading - and the music
on top, so trails, tunnels and swirls build up. When one Drop visual follows another, the picture stays and
glides into the new one.

| Visual | What you see |
|---|---|
| Drop · Nebula Swirl | a slow swirl of colour around a ring the music swells |
| Drop · Liquid Mirror | a line of sound melting upward, mirrored left and right |
| Drop · Star Gate | a tunnel rushing at you with the bass, the stereo picture at its heart |
| Drop · Kaleido Bloom | six mirrored slices, three shapes circling, the spectrum as a ring of dots |
| Drop · Pulse Rings | every beat drops a ring; the ripples carry the colour out |
| Drop · Aurora Curtain | green and violet light rising from a wave along the ground |
| Drop · Plasma Storm | the warp field wild, sparks of sound thrown into it |
| Drop · Vortex Engine | an outward spiral that turns faster when the mids push |
| Drop · Electric Lotus | eight petals of mirrored spectrum around a glowing core |
| Drop · Deep Dive | plunging forward, the image echoing back on itself |
| Drop · Mirror Hall | four mirrors and a slow turn |
| Drop · Solar Wind | both channels as streams of light, flaring with the highs |
| Drop · Neon Grid | a field of strokes along the flow, a line of sound across it |
| Drop · Ink in Water | colour spreading slowly, as ink in still water |
| Drop · Shockwave | every kick hits the picture: a jolt of zoom, a ring, a flash |
| Drop · Firefly Orbit | five lights circling, their trails woven into the dark |
| Drop · Random | a preset made up now - a different one each time |

**Write your own:** a Plenio Drop preset is a short text file of numbers and small formulas. *Edit a copy*
in the visuals' settings saves the visual that plays into your presets folder; change it in any editor, save,
and the visual changes on screen. Your presets appear as *My · <name>*. The guide:
[Plenio Drop: visuals of your own](player-visuals.md).

Open the visuals' settings with ✦ in Now playing (or press **V**):

- **Mode**:
  - *Match the music*: a visual that suits the song's genre, mood and tempo (the default). Calm songs get
    calm visuals, dance songs fast ones.
  - *Random*: a random pick from the visuals you tick, never the same twice in a row.
  - *Cycle*: the ticked visuals in turn.
  - *Fixed*: always the same visual.
- **Change**: with every song, at every section (verse, chorus …), **every few seconds - also within a song**
  (10, 20, 30, 60 s or any number from 5), or *when the music drops in* after a quiet passage.
- **This song**: a visual of its own for the song that plays. It is kept for that song.
- **The playlist**: a visual for the whole playlist that plays. You can also choose it on the playlist's page.
- **Look**: the song's colours, Winamp classic, neon, sunset or monochrome. **Sensitivity** makes the visuals
  react more or less. Switch the lyrics over the visual and the title card on or off.
- The visuals are listed in groups (*Classic*, *Plenio Drop*, *My presets*); **all** and **none** tick or
  untick a whole group, for example to leave out Plenio Drop.
- **Plenio Drop**: the **Quality** (*Fast* for a slow computer, *Balanced*, *Sharp*), **Edit a copy**,
  **Open my folder**, and any of your preset files that has a mistake, with what is wrong.
- **Visuals on** switches all visuals off (Now playing then shows the song's colours).

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

## Share your songs as a player

Give your music to others in one file: **Share…** in a view of the library or on a playlist's page, or
**Share as a player…** at the bottom of the sidebar, packs the player and the songs you choose into **one HTML
file that plays by itself**. Send it (by mail, a cloud folder, a USB stick); the other one double-clicks it and
has the Plenio Player with your songs - in any current browser, on Windows, macOS, Linux or a tablet, without
installing anything, without Plenio or ComfyUI.

- **Choose the songs**: tick them, or take all of the view, your favourites or a playlist at once; search to
  find some. The dialog shows how long and how large the file gets.
- **Sound**: MP3 at 128, 160 or 192 kbit/s (about 1-1.5 MB a minute). Never the FLAC or WAV.
- **Also**: the sheet music (PDF), your look (the visuals' and the lyrics' settings), your own Plenio Drop
  visuals, your playlists of these songs.

In the shared player everything that needs no Plenio plays as here: the library with its search and filters,
a page per song with the lyrics and the notation following the music, Now playing with its four views, every
visual, the lyrics' look, playlists, the queue, Live Play, repeat, the sleep timer, the keys. The listener's
playlists, favourites and settings are kept in their browser. What it does not have: opening songs in
ComfyUI, folders and other music, new songs from ComfyUI, removing songs, videos, the unmastered take.

What stays out of the file: the FLAC and WAV files, the unmastered takes, the release records with their
workflows, and every path of your computer. The songs' details (style, brief, seeds) go in, as their pages
show them. The files are kept in the player's `packages` folder (`~/.plenio/player/packages`), listed under
*Shared players* in Settings, with *Download* and *Try it*.

## Save a song as a video

**Video…** on a song's page (or *Save as a video…* in its menu) makes an **MP4 video** of the song: a visual
moving with the music, and over it what you choose.

- **Size**: 1920 × 1080 (Full HD), 1280 × 720, 3840 × 2160 (4K), 1080 × 1080 (square) or 1080 × 1920
  (upright, for Shorts, Reels and TikTok). **30 or 60 frames a second**, standard or high quality.
- **The part**: the whole song, or from - to (in seconds; the section chips set a section). A part cut out
  of the song fades in and out.
- **The visual**: any visual - classic, Plenio Drop or your own presets - or *as the visuals' settings
  choose for this song*; **a new visual** never, at every section, or **every few seconds**; the colours.
- **Over the visual**: the **lyrics** as subtitles or as **karaoke** (large in the middle, the line before
  and after it), lit up as they are sung - in the player's font, colour and effect, or another for the video
  (*as in the player* brings the player's back); **the notation**, the line of music sounding with a cursor at the
  notes and the notes aglow; a **title card** at the start with the cover; the song in the **corner**; a
  **progress bar** with the sections; *made with Plenio*.
- **Sound**: the master, or the unmastered take.

**Preview** draws one frame as the video will show it. **Make the video** draws every frame from the song's
own sound - the visuals react exactly as when it plays - and encodes it on the graphics card where the browser
can: usually several times faster than the song lasts (12 seconds of Full HD in about 3 seconds on a current
graphics card). You see the video grow, how fast and how long it still takes, and can stop it. The finished
MP4 (H.264 with AAC sound) is in the player's **videos** folder (`~/.plenio/player/videos`); download it,
watch it, or open the folder - also later, under *Videos* in Settings. The video settings are kept for the
next one.

It needs a browser that can encode video (WebCodecs with H.264): current Chrome and Edge can, on Windows,
macOS and Linux.

## Live Play: make songs at a party, and they play

**Live Play** (in the sidebar) is a playlist that plays while you change it - and the songs you make in
ComfyUI join it as soon as **Export Release** has written them. Make songs while the party goes on; a moment
after each export it is in the playlist.

**Start** it with the queue as it is, with a playlist, with the newest 10-100 songs, or empty (it waits for
the first song ComfyUI makes). While it runs, *LIVE* shows in the sidebar and in the bar at the bottom.

**Change it while it plays:**

- drag a song to another place (⠿), or drop it at the end
- ▶ plays a song now, ↑ plays it next, × takes it out
- **Add songs**: search the library and add a song *next* or *at the end*
- *Played* lists the last songs; **Again** plays one once more after the song that plays
- **Save as a playlist** keeps it

**New songs from ComfyUI** (switch off *join by themselves* to only be told of them):

- **next** - right after the song that plays (several new songs in the order they came)
- **at the end**
- **anywhere, at random** - somewhere after the song that plays

A message says where each new song went, *What happened* lists them (and what guests did), and a red **new**
mark shows on them (here and in the library) for a quarter of an hour.

**At the end** Live Play starts again **from the top**, or **waits for the next new song** and plays it the
moment it comes. Live Play stays on when you close the page and open it again, and so do its rules. The
player asks for new songs every few seconds; it reads its folders again for it, at most every two seconds.

### Guests in your network

Switch on **Let guests see the live playlist** in Live Play, and everyone on the same network - the party's
Wi-Fi - opens a page of their own on the phone: the song that plays (with how far it is), what comes next and
what played. The music keeps playing on your computer; the phones get no sound and no files.

- **The way in**: a QR code and an address like `http://192.168.178.23:8770/Ab3dE…/`. The last part is made
  at random; **New address** makes another one at any time, and the old one leads nowhere from then on.
- **Guests may** *only look*, or *change it*: move a song up or down, take it out, and search your library to
  add a song next or at the end. The song that plays and the ones already played stay as they are. A message
  and *What happened* say what a guest did.
- **On the screen**: the QR code and the address, only one of them, or nothing - as a card in Live Play and in
  Now playing (it stays when the controls fade, for a screen the room sees). **Show it big** (or a click on
  the card) shows it over everything.
- *n guests are looking now* counts the phones that asked in the last half minute.

The access is a small server of its own on port 8770 (8771-8779 when it is taken), apart from the player,
which still answers this computer only. It answers only below the random part of the address - the guests'
page, the live playlist with titles and covers, and in *change* mode the library's titles to add from. The
first time, **Windows may ask whether Python may accept connections**: allow it for private networks, or
the phones cannot reach the player. On a network you do not trust (a café, a hotel) leave it off. It stays on
when the player starts again, with the same address; `--guests-host` (or `PLENIO_GUESTS_HOST`) sets where it
listens (every network by default). Guests see the live playlist while the player's page is open - the page keeps the playlist.

## Continue a song in ComfyUI

**Open in ComfyUI** on a song's page (or in its menu) opens ComfyUI in a browser tab with the song's
workflow - its brief, its lyrics, its score and its settings, as the song was made - ready for another take, a
new arrangement or an edit of the lyrics or the notes. It is the same as *File › Continue a Plenio song…*
in ComfyUI, or dropping the song's FLAC onto ComfyUI: the song's record travels from the player to the
ComfyUI tab.

It needs a ComfyUI with Plenio 1.0.0 or newer running on this computer. Which one: the ComfyUI that started
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

The **Settings** page starts with the version of the player that runs (and says so when the page is from
another version - reload it then). It shows what is kept, the file it is kept in
(`~/.plenio/player/state.json`), and when it was last saved, and it has:

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
| Shift + F | only the visual, on the whole screen |
| I | the page of the song that plays |
| 1 2 3 4 | Stage, Lyrics, Notation, Visual |
| V | the visuals' settings |
| N | another visual |
| L | favourite |
| S | shuffle |
| R | repeat: the whole playlist, this song, off |
| B | A/B: master or unmastered take |
| M | mute |
| Q | the queue |
| / | search |
| Esc | close |
| ? | all keys |

**Songs without measured times** (exported before 1.0.0): the player finds where the score sits in the
recording by comparing their harmonies, once per song (a moment on its first notation), and the cursor
follows the music - *The cursor follows the music as the player heard it*. A YuE2 render is shifted against
its score, often by about a bar, and the shift wanders over the song; on the songs measured at export the
estimate lands within a few tenths of a second. If a song's cursor still runs ahead or behind, move it with
the buttons above the sheet (a quarter second or a bar at a time); the player keeps it for that song.

## Where the times come from

Since 1.0.0, Export Release listens to every song as it exports it. It writes when each lyrics line and
syllable is sung into the release record and into the [subtitle files](tags-and-subtitles.md), and for songs
with a score, where each syllable sits in the score. The player reads these times. On the songs measured
for 1.0.0, half the words were within 0.16 seconds and 82 % within half a second.

- **Songs exported before 1.0.0** have no times. The player shows their lyrics as plain text, and the sheet's
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
- Other music plays what the browser can play: OGG and Opus not in Safari, M4A (AAC) not in every Firefox.
- The player keeps a cache of the records it has read in its state folder, so on later starts it reads
  only new or changed records again.
