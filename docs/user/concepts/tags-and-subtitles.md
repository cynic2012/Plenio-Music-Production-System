# Tags, variables and lyrics subtitles

Export Release writes the song's files; since 1.0.0 its tags and file names take **variables**, and it writes
the lyrics as **subtitles** next to the song.

## Tags

Choose *tags* in Export Release (the song templates do): artist, album, date, track, genre, comment, album
artist, composer and **lyrics**. FLAC and MP3 carry them all (the lyrics as FLAC's `LYRICS` comment and MP3's
`USLT` frame, which foobar2000, MusicBee, Poweramp and others show); WAV keeps only a few and no lyrics.

Every tag field takes typed text with variables, or a **connected text**: drag a link from any text output
onto the field - a field output of the Song Brief, a writer's answer, a *String* node. The connected text
wins over the typed one.

## Variables

| Group | Variables |
|---|---|
| song | `{title}`, `{lyrics}`, `{style}`, `{artwork_prompt}`, `{duration}`, `{bpm}`, `{score_key}` |
| brief | `{description}`, `{template}`, `{mode}`, `{genre}`, `{mood}`, `{tempo}`, `{length}`, `{vocals}`, `{language}`, `{voice}`, `{theme}`, `{melody}`, `{lead_instrument}`, `{key}`, `{meter}`, `{arrangement}`, `{genre_closeness}`, `{lines_under_singing}`; a cover's `{harmony}`, `{song_flow_closeness}`, `{lyrics_closeness}` |
| run | `{date}`, `{year}`, `{time}`, `{seed}` (= `{take_seed}`), `{draft_seed}`, `{arrangement_seed}` |
| models | `{model}`, `{writer}` |
| Plenio | `{plenio_version}` |
| tags | `{artist}`, `{album}`, `{album_artist}`, `{composer}`, `{track}` |

- `{genre}` - the value. The brief's fields come through Export Release's **brief** input (connected in the
  templates); a field left empty in the brief gives the template's value.
- `[ ... ]` - the text inside appears only when every variable in it has a value: `[Mood: {mood} · ]`
  vanishes when the mood is empty. Brackets without a variable inside stay text (`[Live]`).
- `{{` and `}}` - literal braces.

Examples:

| Field | Typed | Written |
|---|---|---|
| comment | `[Genre: {genre} · ][Mood: {mood} · ][Language: {language} · ]Powered by Plenio …` (the templates') | `Genre: indie pop · Language: English · Powered by Plenio …` |
| album | `{genre} Sessions {year}` | `indie pop Sessions 2026` |
| file name | `{artist} - {title}` | `The Band - Harbour Lights.flac` |
| file name | `{genre}/{date} {title}` | a folder per genre |

A name that is no variable (`{genr}`) stops the run **when you press Run** - before anything renders - and
the message lists the names. In connected text an unknown name stays as written (generated text may contain
braces) and the export's summary notes it. The *Tags & variables* note beside Export Release in every
template lists the variables, too.

## Lyrics subtitles

*lyrics subtitles (SRT)* (on by default) writes two files next to the song:

- `<name> (lines).srt` - one subtitle per lyrics line, shown from where its first word is sung until its last
  word ends;
- `<name> (notes).srt` - the same lines **painted on note by note**: a new subtitle at every syllable (YuE2,
  on its note) or word (MiniMax), showing the line up to what is being sung - `Hal`, `Halle`, `Hallelu`,
  `Hallelujah`.

**How the times are measured.** The lyrics ASR (faster-whisper large-v3, 3.1 GB, MIT; downloaded on first
use, its results cached) listens to the exported song. Its words are matched to the final lyrics; with a
score (YuE2), the score is fitted to the heard words and every syllable takes its note's time - the heard
time wins where the two disagree. A YuE2 render is shifted against its score (1.7 s in the median song), so
the score's own times are not used. Measured on 48 YuE2 songs against a forced aligner: half the words
within 0.16 s, 82 % within 0.5 s, 92 % within 1 s.

- **Without lyrics** (*Enhance & Master*): the subtitles are the words as heard, a line per phrase; the
  sentences Whisper is known to invent into music are left out, and without singing there are none.
- **Instrumentals**: no subtitles.
- **A line nobody sang** (the render left it out) is placed between its neighbours when there is room,
  otherwise left out; the summary names it.
- **Offline without the model**, or when the ASR fails: the export goes on without subtitles and says why.

The files use no styling tags: SRT markup is read differently by players, YouTube and video editors, so the
files work everywhere. Into DaVinci Resolve: *File > Import > Subtitle…*, then drag the subtitle track onto
the timeline at the song's start; YouTube: *Subtitles > Upload file > With timing*.
