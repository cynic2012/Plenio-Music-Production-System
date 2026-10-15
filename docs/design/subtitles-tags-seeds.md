# Lyrics subtitles, tag variables, layout and seeds (0.8.1, 2026-10-15)

The owner's request of 2026-10-15, four features for 0.8.1, designed here before they are built. Every
choice below says what it rests on: a measurement, the code as it stands or the platforms the files go to.

| # | Request | Design in short |
|---|---|---|
| 1 | An SRT file of the lyrics for every song, with exact times: one with whole lines, one that places the lyrics on the notes; switchable in the export node, on by default | Export Release writes `<name> (lines).srt` and `<name> (notes).srt`. The times are **measured**: faster-whisper listens to the exported song, the heard words are matched to the lyrics and, with a score, put onto the score's notes (median error 0.16 s per word, 82 % within 0.5 s, held-out sample). New toggle *lyrics subtitles (SRT)*, on |
| 2 | Tag fields filled by typed or generated text; every tag field takes an input; the Song Brief's fields as outputs; the fields as variables in the tags, e.g. `Genre: {genre}`; more fields (title, model, lyrics ...); documented in the workflow and the docs | Every tag field is a widget with a socket; Export Release gets a **brief** input; tags and the file name pattern take `{variables}` (song, brief, run, model and tag values) with `[optional {parts}]`; Song Brief gets 14 field outputs (Cover Brief its 12); a new tag field **lyrics**; the templates use tags with variables and carry a *Tags & variables* note |
| 3 | A wider Song Brief (text is cut); tooltips where they belong, never over the fields, and short | Briefs 380 -> 520 px wide, the graph moves with them; Plenio's tooltips appear **beside the node** at the height of the field; no tooltip longer than 220 characters (the long ones move to the help pages) |
| 4 | Seeds that stand out and that everyone understands: fixed to keep a part, random for something new | A Plenio **Seed** node replaces the template seeds: one switch *each run: 🎲 new seed / 🔒 same seed*, the seed drawn **before** the run (the number shown is always the one the last run used), a colour per state, a line that says what it keeps, a 🎲 button |

## 1. Lyrics subtitles (SRT)

### 1.1 What the times can rest on

A YuE2 song has a score: every syllable has a note, every note a time at the score's tempo. A MiniMax song
has only the lyrics. The question is how close either comes to where the words are actually sung.

Measured on the renders of the lyrics-placement study (`docs/design/lyrics-placement.md`; 73 YuE2 songs of
the owner's records, English and German, about 7,000 words; only aggregates): every song was transcribed by
faster-whisper large-v3 and the heard words were placed once more on the audio by Qwen3-ForcedAligner-0.6B,
whose word starts serve as the truth. The methods get only what the product has: the record's score and
lyrics, and Whisper's words.

| Word starts, error against the forced aligner | median | within 0.3 s | within 0.5 s | within 1 s |
|---|---|---|---|---|
| the score alone (note times at the score's tempo) | 1.66 s | 13 % | 19 % | 33 % |
| the score, fitted to Whisper's words (one time warp per song) | 0.35 s | 46 % | 58 % | 82 % |
| ... and shifted per line by the line's heard words | 0.17 s | 70 % | 79 % | 86 % |
| Whisper's word starts | 0.34 s | 46 % | 66 % | 87 % |
| Whisper + 0.3 s, a line's first word at most 0.5 s long | 0.18 s | 73 % | 83 % | 92 % |
| **hybrid**: the score shifted per line, Whisper where they disagree by more than 0.35 s | **0.16 s** | **73 %** | **83 %** | **92 %** |

(sample 2: 48 songs, 4,700 words, on which no choice was made - the constants were chosen on sample 1, 25
songs, which gives the same within two points. Line starts alone, hybrid: median 0.20 s, 63 % within 0.3 s,
73 % within 0.5 s. A word whose aligner time is more than 2 s from Whisper's is left out of the truth: there
the two matched different repetitions of a chorus.) The implementation (`plenio.core.subtitles`), measured the same way on
sample 2: words median 0.16 s, 72 % within 0.3 s, 82 % within 0.5 s, 92 % within 1 s; line starts median
0.20 s; 6 of 1,644 lyrics lines left untimed; 0.1 s per song (the matching and the warp).

What this shows:

- **The score alone is useless for subtitles**: a YuE2 render is shifted against its score, by 1.7 s in the
  median song (it often shortens the intro) and by up to 15 s; the tempo agrees within 1 % in 70 % of the
  songs. So exact times need **listening**.
- **Whisper's word times are early**: 0.26 s in the median (its words are contiguous, so a word starts
  where the one before ends), the first word of a line by 0.7 s (it takes the rest before the line). A
  constant 0.3 s and a cap on a line's first word (at most 0.5 s long) remove most of it.
- **The score puts the words on the notes**: once fitted (a time warp from all heard words, then a shift per
  line from the line's own words), it gives note-exact times and the rhythm of the syllables; where it
  disagrees with what was heard (a line the layout put on other notes), the heard time wins.

### 1.2 Design

**Where.** Export Release: it has the final audio, the final lyrics and score (the Song Sheets' reports, as
for the sheet music), the hand-placed lyrics lines (`hand_placed`) and, new, the brief (§2). A new toggle,
appended last so saved workflows keep their values:

- `lyrics_srt` (*lyrics subtitles (SRT)*), boolean, **default on**.

**Files** (next to the audio, with the same base name; a batch of takes gets one pair per take):

- `<name> (lines).srt` - one cue per lyrics line, from where its first word is sung to where its last ends
  (+0.25 s, never into the next line; at least 0.8 s when there is room).
- `<name> (notes).srt` - the same lines **painted on note by note**: a new cue at every syllable (score) or
  word (no score), each showing the line up to what is being sung, so the text grows exactly on the notes
  ("Hal" -> "Halle" -> "Hallelu" -> "Hallelujah").

Why paint-on and no karaoke colours: SRT styling (`<u>`, `<font color>`) is not portable - YouTube's SRT
support recognises no style markup, and DaVinci Resolve has shown such tags as text or dropped them. A
growing line works in every player, editor and platform. Long lines wrap at 42 characters (two rows at
most), the break chosen once per line so a growing line never jumps between rows.

**Times** (`plenio.core.subtitles`, pure; the constants from §1.1):

1. Run the lyrics ASR (faster-whisper large-v3, Plenio's existing asset and worker, the result cached
   under the audio's hash) on the exported audio. Language: the brief's, else guessed from the lyrics
   (`syllables.guess_language`), else detected.
2. Match the heard words to the lyrics' words (Needleman-Wunsch on normalised words, similarity >= 0.7).
3. Heard time of a word: Whisper's start + 0.3 s; a line's first word starts at most 0.5 s before its end.
4. With a score: fit a time warp `t = a * t_score + b` (Whisper's starts against the Vocal onsets), shift
   each line by the median offset of its words after the first (when at least two agree within 0.35 s),
   take the score's time where heard and score agree within 0.35 s, the heard time otherwise, and the
   score's time for words Whisper missed. The syllables after a word's first keep the score's rhythm.
5. Without a score: the heard times; a word not heard gets a time between its neighbours (by letters); a
   line without any heard word gets the gap between its neighbours when it has room, otherwise it is left
   out and the report names it.
6. Times never go backwards; cues end before the next line.

**Songs without lyrics.** Instrumental songs (no sung lines): no SRT, no ASR. A song whose lyrics are not
known (Enhance & Master): the subtitles are the **heard** words, lines split where Whisper's segments and
pauses of more than 0.9 s split them; sentences Whisper invents into music are left out
(`drop_known_inventions`), and below 5 heard words there is no SRT (a note says so).

**Cost and fallback.** The ASR model is 3.1 GB (MIT), fetched on first use like in the cover template;
about 20 s per 3-minute song on the GPU (Plenio frees 4 GB of VRAM first), about 0.6 x the song on the CPU.
Offline without the model, or when the ASR fails: no SRT, a note in the summary, the export itself goes on.

**Record and summary.** The SRT files are listed in the release record (`role: "subtitles"`, `kind:
"lines" | "notes"`, `timing: "measured" | "heard"`), with the ASR's language and how many lines were timed;
the summary says `- subtitles: <name> (lines).srt, (notes).srt - timed by listening`.

## 2. Tags, inputs and variables

### 2.1 Inputs

- **Tag fields take inputs.** The tag fields (*tags* mode of Export Release) are text widgets; ComfyUI gives
  every widget a socket, so any text output (a Song Brief field, a writer's answer, a *String* node) can be
  connected to it, and the connected text wins over the typed one. This is said in the tooltips and the
  docs and shown in the templates. *title* stays an input only, as before.
- **Song Brief outputs.** Appended after the existing five (saved links stay valid): `template`, `genre`,
  `mood`, `tempo`, `length`, `vocals`, `language`, `voice`, `theme`, `key`, `meter`, `arrangement`
  (strings), `genre_closeness` (INT), `lines_under_singing` (BOOLEAN). The values are the brief's final ones
  - a field left empty gives the template's value. An instrumental song gives empty language, voice and
  theme.
- **Cover Brief outputs** (the same idea, for a consistent pair): `template`, `genre`, `mood`, `vocals`,
  `language`, `voice`, `theme`, `harmony`, `arrangement`, `song_flow_closeness`, `lyrics_closeness`,
  `lines_under_singing`.
- **Export Release `brief` input** (optional, BRIEF): gives every brief field to the variables with one
  wire. The templates connect it.

### 2.2 Variables

**Syntax** - the one Export Release's file name pattern already uses (`{date} {title}`), so one rule holds
for the name and the tags:

- `{name}` - the value; names are lowercase with underscores (`{genre_closeness}`).
- `[ ... ]` around a part with at least one variable - the part appears only when all its variables have a
  value (as in foobar2000 and Mp3tag title formatting): `[Mood: {mood} · ]` disappears for an empty mood.
  Brackets without a variable stay text (`[Live]`).
- `{{` and `}}` - literal braces (brackets need no escape: without a variable inside they are text).
- A typed field with an unknown name stops the run **when it is queued** (before any render), with the list
  of names. Text that arrives through a link keeps an unknown `{name}` as it is (generated text may contain
  braces) and the summary notes it.

**Names** (the summary of a run lists them with their values; empty when the source is missing):

| Group | Variables |
|---|---|
| song | `title`, `lyrics` (plain lines, no section tags), `style` (what the music model was given), `artwork_prompt`, `duration` (m:ss), `bpm`, `score_key` (from the score) |
| brief | `description`, `template`, `mode`, `genre`, `mood`, `tempo`, `length`, `vocals`, `language`, `voice`, `theme`, `melody`, `lead_instrument`, `key`, `meter`, `arrangement`, `genre_closeness`, `lines_under_singing`; cover: `harmony`, `song_flow_closeness`, `lyrics_closeness` |
| run | `date` (2026-10-15), `year`, `time` (HHMMSS), `seed` and `take_seed`, `draft_seed`, `arrangement_seed` (the template's seed nodes) |
| models | `model` (the music model: YuE2, MiniMax Music 3), `writer` (the writer model) |
| Plenio | `plenio_version` |
| tags | `artist`, `album`, `album_artist`, `composer`, `track` - in the file name pattern and in the other tag fields |

`genre`, `date` and `comment` are not tag variables: `{genre}` and `{date}` mean the brief's genre and the
run's date, also inside the tags.

**Where.** Every tag field and the file name pattern. The pattern's `{seed}` gave nothing so far (the export
did not know the seed); it now gives the take seed.

### 2.3 A lyrics tag

New tag field **lyrics** (appended at the end of the *tags* option): FLAC writes it as the Vorbis comment
`LYRICS`, MP3 as an ID3 `USLT` frame (checked with the bundled FFmpeg); WAV cannot hold it (noted). Players
such as foobar2000, MusicBee and Poweramp show it. Default empty; the templates set `{lyrics}`.

### 2.4 Templates and documentation

- The templates' Export Release switches to *tags* with `date: {date}`, `genre: {genre}`,
  `lyrics: {lyrics}` and `comment: [Genre: {genre} · ][Mood: {mood} · ][Language: {language} · ]Powered by
  Plenio Music Production System / ComfyUI` (Enhance & Master keeps *copy from loaded file*).
- A **Tags & variables** note next to Export Release in every template: the syntax, the names, two examples
  and how to connect a field.
- Docs: Export Release's help page, a user guide page *Tags and variables*, the template guides, README.

## 3. Layout and tooltips

### 3.1 Width

Song Brief and Cover Brief: **520 px** instead of 380 - the longest template names
(`house/progressive-house-dreamy-bittersweet`), *arrangement (experimental)* with *call and response*, and
typed genres, moods and voices fit. Everything right of the brief moves 140 px to the right, and what stands
below it moves down by the height of the new outputs (`Graph.shift` in the graph builder, groups included).

### 3.2 Tooltip position

ComfyUI draws a node's tooltip at the mouse, above and to the right of it (`translate(5px, -100%)`): over a
node's own fields, the rows above the hovered one are covered - the owner saw it at *genre closeness*. A
tooltip taller than the space above (the arrangement guide, 1,028 px) is moved below the mouse and runs off
the window.

Plenio's extension places the tooltip of **Plenio nodes** beside the node instead: its left edge 12 px right
of the node, its top at the hovered row (on the left of the node when the right has no room, kept inside the
window). It does so with a class on `<body>` and CSS custom properties, so ComfyUI's own positioning stays
untouched for every other node, and nothing happens when the frontend has no `.node-tooltip`.

### 3.3 Tooltip length

Rule: **at most 220 characters** - what the field does and its default; the rest goes to the node's help
page (the *?* of the node, `web/docs`) and the user guides. 14 Plenio tooltips are longer today (the
arrangement guide of both briefs: 2,425 characters). The creative modes' guide leaves the tooltip: it stays
in the help page, the template's About note, and the brief's summary names the chosen mode with its
one-line description. A unit test keeps every Plenio tooltip (nodes and blueprints) under the limit.

## 4. Seeds

### 4.1 What is hard today

The templates use ComfyUI's *Seed* node: a number and *control after generate* with *fixed*, *increment*,
*decrement*, *randomize*.

- The words are jargon: *seed*, *fixed*, *randomize* say nothing about the song.
- *control after generate* changes the number **after** the run: the number shown is the **next** run's,
  not the one that made the take just heard. Who liked a take and switches to *fixed* keeps a seed nobody
  has heard - the take is lost.
- The seeds look like every other node, though they decide what changes on the next run.

### 4.2 Design: Plenio · Seed

A small node `PlenioSeed` (*Seed*, category *Plenio/Utils*), output `seed` (INT):

- **seed** - the number.
- **each run** - one switch: off **🎲 new seed** (something new every run), on **🔒 same seed** (repeat:
  the same result, so other things can change). One click, plain words.
- The extension draws the new seed **before** the run (the frontend's `beforeQueued` hook, once per queued
  run - also for each run of a batch). So the number shown is always the one the last run used:
  switching to 🔒 keeps exactly the take just heard.
- **Colour per state**: amber for 🎲, blue for 🔒 - visible from afar which parts will change.
- **A line under the switch** says what it means for this seed's part (the template names the part):
  *🎲 Every run draws a new seed: a new take. Liked it? Switch to 🔒 - this number made it.* /
  *🔒 Every run uses 1234567 again: the same take, while you change other things.*
- **🎲 New seed** button: one new number now (try another variant, then keep it).
- In App mode the switch stands next to the number.
- Headless (API): the prompt carries the number; *new seed* is the browser's job, as with ComfyUI's
  control widgets.

Templates: **Take seed** 🎲, **Draft seed** 🔒, **Arrangement seed** 🔒 (MiniMax: draft 🔒, take 🎲; DAW:
take 🎲). The About notes get a short *Seeds* paragraph: "🔒 keeps a part, 🎲 renews it - keep what you like,
let the rest change".

Compatibility: saved workflows keep their *Seed* nodes and work as before. Continuing a record made before
0.6.0 (matched against the templates by class and title) treats *Seed* and *Plenio · Seed* as the same
role, so its seeds land on the new nodes. The demo catalogue reads both.

## 5. Compatibility

- New widgets are appended at the end (saved workflows assign widget values by position): Export Release
  `lyrics_srt`; the tag field `lyrics` at the end of the *tags* option. Old Export nodes get the defaults
  (SRT on, no lyrics tag).
- New outputs are appended at the end of the briefs; new inputs (`brief`) are sockets.
- An API prompt of 0.8.0 runs unchanged (every new input optional with its default).

## 6. Checks

Unit tests (`subtitles`: alignment, warp, shifts, paint-on, wrapping, SRT format, songs without lyrics;
variables: syntax, optional parts, escapes, unknown names, linked text; tooltip length; seed node), the
host and contract tests, the frontend tests (tooltip placement, seed node: before-run draw, colours,
batch), the workflows test, the browser check, and one real export on the GPU (an SRT checked against the
song).

## 7. Not built

- LRC (synced lyrics for music players) and karaoke ASS with colours: the times are there, the formats are
  not requested; a small follow-up.
- A forced aligner (Qwen3-ForcedAligner, the study's truth): a second ASR model of 1.2 GB for a gain of a
  few hundredths of a second over the hybrid - not worth it now.
