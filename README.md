<p align="center">
  <img src="assets/branding/banner.png" alt="Plenio Music Production System for ComfyUI - YuE2, YuE2 Cover and MiniMax Music 3" width="100%" />
</p>

# Plenio Music Production System 1.2 for ComfyUI

<p align="center">
  <a href="https://youtu.be/XpNpks9ZCgE"><img src="assets/branding/0.5.0/spot.jpg" alt="Plenio - Your idea. Your song. Your control. Watch the spot on YouTube" width="80%" /></a>
</p>

<p align="center"><b>▶ <a href="https://youtu.be/XpNpks9ZCgE">Your idea. Your song. Your control.</a></b> - Plenio in 54 seconds</p>

**Make songs locally in ComfyUI - and see exactly what the music model is given.** Describe a song and a local language model writes it. YuE2 or MiniMax Music 3 performs it, Plenio masters it and exports it with tags, cover art and a record of how it was made. You can also turn an existing recording into a new version of itself, compose the score yourself, split a finished song into stems to rebalance it, or finish and master a file you already have.

Everything runs on your own machine, inside ComfyUI's own nodes: no cloud service, no API key, no extra Python packages. Before a single note is rendered, the **Song Sheet** shows you the title, style, lyrics and score that the model will receive. You can edit all of them, and your edits are never silently overwritten.

**Free, open source - now 1.2.** Plenio costs nothing: no subscription, no credits, no account, Apache 2.0 code. After fourteen releases in three weeks, 1.0.0 was the milestone where the whole way holds together - from the first idea to the song people listen to - and the version to build on: saved workflows and release records keep working in every 1.x version. What changed in each version is in the [changelog](CHANGELOG.md).

## New in 1.2.1: lyrics sung as written, and heard more exactly

- **Lyrics fidelity**: a music model does not always sing its lyrics. The brief's new *lyrics fidelity* renders a second take (*high*) or up to a third (*highest*) and keeps the one that sings most of its lyrics as written, as the lyrics ASR hears it. It takes longer - up to about twice or three times. [Details](docs/user/concepts/lyrics-fidelity.md)
- **The lyrics heard on the vocal stem**: Export separates the take's vocals before it listens, so the subtitles, the lyrics as sung and the player's following are timed more exactly.
- **Fix Misheard Words** in covers: the writer model corrects the words the transcription of the original misheard - before the render, only where it is sure. *Check Sung Words* is retired: what a take sings stays as heard.
- **Fixed**: lyrics in Latin letters for another script (Hinglish ...) are matched with what was heard, and a YuE2 plan that left a verse without notes gets a second plan.

## New in 1.2: the lyrics as sung, a login for the player, and a tidier studio

- **The lyrics as written and as sung**: Export keeps what a take really sings - `(sung).srt` and the release record -, and the Plenio Player follows either; a song whose take departs far from its lyrics shows them as sung (**W** switches). **Check Sung Words** lets the writer model correct the words the lyrics ASR misheard - only those it is sure of. [Details](docs/user/concepts/player.md#written-and-sung-lyrics)
- **A login for the Plenio Player**: users with a password keep their own playlists, likes and plays on every device; the admin sets them up on the player's computer, a guest keeps everything in the browser. *Settings > Sound* plays the MP3. [Details](docs/user/concepts/player.md#who-is-listening-the-login)
- **42 new visuals**: twelve classics - Digital Rain, VU Meters, Vinyl, Harmonograph, Spiral Galaxy … - and thirty Plenio Drop presets after the MilkDrop classics, each with the music it suits. [Details](docs/user/concepts/player.md#visuals)
- **Titles and covers from the song**: the writer proposes ten titles from the lyrics and Plenio picks one no song has yet; the cover prompt follows the lyrics' motif, then the title and the tags.
- **Runs that go through**: covers and series run without stopping, and the lyrics and the notation cursor follow the song again.
- **A tidier studio**: the sections stand in one row of one height; the *HQ Mastering & Cover Art* cards and the writer model open group 1 (HQ mastering on by default in Enhance & Master); each Song Sheet says with its colour and its edit button what you edit there; the stems sit inside the Master block, Cover Art above the render.

<p align="center">
  <img src="assets/branding/1.2.0/comfyui-sheet-cards.jpg" alt="The 1 · YuE2 · Song template in ComfyUI: the HQ Mastering card (off) and the Cover Art card (on) with the writer model at the top of group 1, the Song Brief under them, Write Song with its draft seed, and Song Sheet · Text in teal with its Edit lyrics &amp; text card" width="49%" />
  <img src="assets/branding/1.2.0/player-new-visuals.jpg" alt="Six of the new visuals of the Plenio Player: Vinyl, Spiral Galaxy, Spirograph, Drop · Mandala Breath, Drop · Fractal Garden, Drop · Ember Rise" width="49%" />
</p>

*Group 1 with the HQ Mastering & Cover Art cards and the writer model, and Song Sheet · Text with its edit card · six of the 42 new visuals.*

## New in 1.1: Audio HQ, a new ear for the lyrics, and the score in and out

- **Audio HQ** in every template's master: *Stereo Cleanup* calms the unsteady stereo shimmer of AI renders, *Regenerate Highs* lets UniverSR generate fresh highs above 8.2 kHz - presets that follow the song's genre. The **HQ Mastering** card at the top of every template (beside it the *Cover Art* card) turns UniverSR on: it can clearly reduce AI shimmer and artifacts, but the song takes about twice as long - so it is **off** by default. [Details](docs/user/concepts/audio-hq.md)
- **Qwen3-ASR** hears the lyrics and **Qwen3-ForcedAligner** times every word - for covers and for the lyrics subtitles; faster-whisper stays as the fallback.
- **MusicXML round trip**: *Import MusicXML…* brings back what *Export MusicXML* wrote - also after a script put the lyrics on their notes or changed notes in bulk. Only Plenio's own MusicXML is read. [Details](docs/user/concepts/score-editor.md#musicxml-round-trip)
- **A whole track an octave down or up** - Vocal or Instrument, in the palette and the DAW track headers.
- **The bass and the vocals as MIDI**: a saved bass or vocals stem also comes as a `.mid` file with the notes it plays, for your DAW (experimental). [Details](docs/user/concepts/stems.md#the-bass-and-the-vocals-as-midi)
- **In the Plenio Player**: covers of one song no longer share one title (*Yesterday (2)*, *(3)* …), and a song exported without lyrics times follows its score's times and says why it has none of its own.

<p align="center">
  <img src="assets/branding/1.1.0/comfyui-hq-mastering.jpg" alt="The 1 · YuE2 · Song template in ComfyUI: the HQ Mastering switch at the top of group 1, off - faster, no UniverSR - above the Song Brief" width="49%" />
  <img src="assets/branding/1.1.0/editor-musicxml-octave.jpg" alt="The score editor in the DAW layout: Import MusicXML next to the other file buttons, Vocal and Instrument −8va / +8va under Whole score and in the track headers" width="49%" />
</p>

*The HQ Mastering switch at the top of every template (off by default; on in Enhance & Master since 1.2) · the score editor with Import MusicXML… and an octave for a whole track.*

Every change: [CHANGELOG](CHANGELOG.md).

## New in 1.0.2: creativity, one slider

One slider on the Song Brief and the Cover Brief, from *0 steady* to *100 experimental*. **At 50 everything stays exactly as before** - also in every workflow you saved earlier. Lower, the writer keeps the song plain with a repeated hook, and YuE2 plans and performs more predictably; higher, the lyrics get fresher images, the style more specific instruments and contrast, and YuE2 plans and performs more freely.

<p align="center">
  <img src="assets/branding/1.0.2/comfyui-creativity.jpg" alt="The 1 · YuE2 · Song template in ComfyUI: the Song Brief with its creativity slider at 75 and the new creativity output, linked to the YuE2 Plan block's creativity input" width="49%" />
  <img src="assets/branding/1.0.2/player-creativity.jpg" alt="A song's details in the Plenio Player: creativity 75 - varied, the writer temperature 0.9, YuE2's plan and take sampling" width="49%" />
</p>

*The Song Brief with its creativity at 75 · a song's details in the Plenio Player: its creativity and the sampling it gave.*

- **Steady to experimental**: 0-19 steady, 20-39 restrained, 40-60 balanced, 61-80 varied, 81-100 experimental. The writer's rules and temperature, a creative mode's plan and YuE2's plan and takes follow it - moderately: the repetition penalties stay as they are, and more surprises also bring more misses, so listen to a few takes.
- **A more varied style without long prose**: YuE2 sings style prose, so its style stays one short line, made more specific; MiniMax Music 3's caption tells an arc of contrasts.
- **In the player**: every song's creativity and sampling in its details, a *Creativity* filter and `creativity:>60` in the search.
- **ComfyUI 0.41.0** is the version Plenio is tested against now; 0.37.0 still works.

Every change: [CHANGELOG](CHANGELOG.md) · the slider in detail: [Creativity](docs/user/concepts/creativity.md).

## New in 1.0.1: the player at home and at the party

Two days after 1.0, the Plenio Player leaves the desk. **In your network** a link opens the whole player on the phone, the tablet or the laptop - and ComfyUI with it, when it runs. At a party the guests see the live playlist on their phones and wish for songs, and **Show the visual** puts the music on the big screen with their QR code over it. Videos and shared players are made in the background while you listen, and a song's video now carries its cover all the way through and sings its words one by one, on the beat.

<p align="center">
  <img src="assets/branding/1.0.1/player-party.jpg" alt="Show the visual at a party: the Electric Lotus preset on the whole screen, the guests' QR code to join the live playlist in the corner" width="49%" />
  <img src="assets/branding/1.0.1/player-video-words.jpg" alt="A frame of a song's video: the word sung now large in the middle, the words before it smaller above, the line sung drawn into the Electric Lotus visual, the cover as a spinning record in the corner" width="49%" />
</p>
<p align="center">
  <img src="assets/branding/1.0.1/player-filters.jpg" alt="The library filtered: the tag party chosen and art pop left out, the tag and genre rows with numbers that follow the filters, the songs' tags on the cards, saved filters in the sidebar" width="49%" />
  <img src="assets/branding/1.0.1/player-making.jpg" alt="In the making: a shared player of 24 songs being packed, a Full HD video being drawn at 8.6 times its speed, a finished video with Watch, Download and Folder" width="49%" />
</p>

*The party's big screen with the guests' QR code · a song's video, word by word, the cover as a record · filters and tags of your own · a video and a shared player in the making.*

- **The player in your network**: Settings › *In your network* gives a link with a code of its own and a QR code - the whole player on every device at home, and ComfyUI too; a browser without the link does not get in.
- **The party**: guests scan a QR code and see the live playlist on their phones - or change it and add songs; the visual on the big screen with the QR code over it.
- **In the making**: *Make the video* and *Make the player* go into a queue and run in the background; a list shows how far each is, with *Stop*.
- **Large shared players**: a player of 365 songs (2.6 GB) shows its songs in under a second - and parts of 250 MB to 1 GB open on a phone.
- **Find any song**: every value in the filters, numbers that follow the filters, a right click that leaves songs out, suggestions as you type, saved filters - and **tags of your own**.
- **Soft changes between visuals**: *Morph*, *Melt*, a fade, a zoom, a slide or a flash on the beat.
- **More for a song's video**: the cover all the way through (also as a spinning record), the lyrics word by word, in places of their own and coming in on the beat; five new Plenio Drop presets draw the cover, the title and the words into the picture.

Every change: [CHANGELOG](CHANGELOG.md).

## New in 1.0: from the finished song to the listener

Plenio no longer stops at the exported file. The **Plenio Player** - one click from ComfyUI, or on its own without it - plays your songs in the browser, the lyrics lit up as they are sung and the sheet music following the music, and turns them into something to show and to give away.

<p align="center">
  <img src="assets/branding/1.0.0/player-drop.jpg" alt="Plenio Drop: the Electric Lotus preset full screen, a line of the lyrics in neon over it" width="49%" />
  <img src="assets/branding/1.0.0/player-video-frame.jpg" alt="A frame of a song's video: the Star Gate visual, the lyrics as karaoke in the middle, the notation with its cursor below, the title in the corner" width="49%" />
</p>
<p align="center">
  <img src="assets/branding/1.0.0/player-live.jpg" alt="Live Play: the live playlist with a song just made in ComfyUI marked new and playing next" width="49%" />
  <img src="assets/branding/1.0.0/player-share.jpg" alt="Share your songs as a player: a playlist chosen, MP3 at 192 kbit/s, the sheet music, the look and the playlists packed into one HTML file" width="49%" />
</p>

*Plenio Drop with the lyrics in neon · a frame of a song's video · Live Play as a song made in ComfyUI arrives · one file to share your songs.*

- **Plenio Drop**: visuals like Winamp's MilkDrop, made anew - 21 presets drawn by Plenio's own renderer on the graphics card (five draw the song's cover, title and words into the picture), one made up fresh each time, all moving with the music. **Write your own** as a short JSON file of numbers and formulas; it changes on screen as you save it ([guide](docs/user/concepts/player-visuals.md)).
- **Live Play**: a playlist for a party that you change while it plays - and the songs you make in ComfyUI join it the moment they are exported: next, at the end or anywhere.
- **A song as a video**: an MP4 of the visual with the lyrics (subtitles or karaoke), the notation following the music and a title card - Full HD, 4K, square, or upright for Shorts, Reels and TikTok - made on your graphics card, several times faster than the song lasts.
- **Share your songs as a player**: one HTML file with the player and the songs you choose, as MP3 - anyone double-clicks it and listens, with the lyrics, the notation and the visuals. No install, no server, no account.
- **Your look**: eleven fonts and eleven effects for the lyrics - neon, glow, bounce, typewriter, rainbow, on the beat … - in the player and in the videos.
- **Your folders, and other music**: the player reads the folders you choose and plays the other music in them too, with its tags, cover and `.lrc` lyrics.

Also new in 1.0: **lyrics subtitles timed by listening** (`.srt`, ready for YouTube or DaVinci Resolve), **tags filled from the brief** with variables, and **Plenio · Seed** - one plain switch per seed. More about the player [below](#listen-in-the-plenio-player).

## One package, from the idea to the listener

Nothing else to buy, sign up for or glue together - every step is in the box, and every step runs on your computer:

| Step | What Plenio gives you |
|---|---|
| **Write** | Song Brief and Cover Brief with templates for every genre; a local language model writes title, style and lyrics - Gemma 4 natively, or any GGUF, LM Studio, Ollama, llama.cpp, vLLM or Jan; thirteen creative modes plan the arrangement *(experimental)* |
| **Check** | The Song Sheet: exactly what the music model will get - title, style, lyrics, score - editable, never silently overwritten |
| **Compose** | A real score editor: notation, piano roll, chords, a MIDI keyboard, arranging like in a DAW, MIDI, MusicXML and PDF - or write the whole melody yourself (*YuE2 · DAW*) |
| **Perform** | YuE2 for songs, covers and your own melody; MiniMax Music 3 for songs |
| **Cover** | Any recording becomes a new version: its score read by SheetSage2, its words by Qwen3-ASR, new lyrics fitted to the melody |
| **Polish** | Stems with a mixer, Audio HQ (stereo cleanup, regenerated highs), an EQ on the curve, loudness to -14 LUFS / -1 dBTP with a true-peak limiter |
| **Release** | FLAC, MP3 or WAV with tags and cover art (FLUX.2 Klein), lyrics subtitles, the sheet music as PDF, and the whole project inside the FLAC |
| **Go on** | Drop a song's FLAC onto ComfyUI and you are back in its workflow - new takes, a changed score, new lyrics |
| **Listen & share** | The Plenio Player: visuals, Live Play, videos and a player in one file to send |

Nine narrated video tutorials walk through it, all made with the real models.

## Watch the tutorials

**▶ [Plenio in 75 seconds](https://youtu.be/q_dMH834E1o)** - the promo: what Plenio does, from the first idea to the mastered song.

<p align="center">
  <a href="https://youtu.be/q_dMH834E1o"><img src="assets/branding/0.4.5/promo.jpg" alt="Plenio - Music production in ComfyUI: the promo video on YouTube" width="70%" /></a>
</p>

**▶ [All tutorials as a YouTube playlist](https://www.youtube.com/playlist?list=PLAFqTtP59fgE)** - one narrated video for every template, two for the creative modes and one for the Plenio Player (English, 2 to 15 minutes, with chapters), recorded in ComfyUI with the real models: every song you hear in them was made right there. Watch them in order, or jump to the template you need.

| | Tutorial | What you will see |
|:---:|---|---|
| <img src="assets/branding/0.4.5/tutorial-0-system-check.jpg" alt="Tutorial 0 · System Check" width="180" /> | **0 · System Check** | Is your ComfyUI ready? Versions, the GPU, the model files every template needs and the hardware table with your machine's row. |
| <img src="assets/branding/0.4.5/tutorial-1-yue2-song.jpg" alt="Tutorial 1 · YuE2 · Song" width="180" /> | **1 · YuE2 · Song** | From a brief to a finished song - as a series or one song with review stops, with the writer model of your choice and the sheet music PDF of every export. Then a tour of the score editor: notes, lyrics, playback, track sounds and presets, copy and paste, arranging sections and bars, recording with a MIDI keyboard, the files. |
| <img src="assets/branding/0.4.5/tutorial-2-yue2-cover.jpg" alt="Tutorial 2 · YuE2 · Cover" width="180" /> | **2 · YuE2 · Cover** | A recording becomes a new version. In the score editor the original plays under the notes (waveform, A/B), a copied chorus sings its words again, and the sheet music goes out as files. |
| <img src="assets/branding/0.4.5/tutorial-3-minimax-song.jpg" alt="Tutorial 3 · MiniMax · Song" width="180" /> | **3 · MiniMax · Song** | Songs with MiniMax Music 3: the caption, the lyrics and the 5,000-token budget, checked before anything is rendered. |
| <img src="assets/branding/0.4.5/tutorial-4-enhance-master.jpg" alt="Tutorial 4 · Enhance & Master" width="180" /> | **4 · Enhance & Master** | Master any recording without a GPU: a warm tone match, measured loudness and the release export - then your own sound. |
| <img src="assets/branding/0.4.5/tutorial-5-yue2-daw.jpg" alt="Tutorial 5 · YuE2 · DAW" width="180" /> | **5 · YuE2 · DAW** | Compose it yourself: the words first, then the music - draw the notes, import a MIDI sketch or play it in with a MIDI keyboard - and YuE2 sings your melody. |
| <img src="assets/branding/0.4.5/tutorial-6-yue2-song-creative.jpg" alt="Tutorial 6 · YuE2 · Song · Creative modes" width="180" /> | **6 · YuE2 · Song · Creative modes** *(experimental)* | The writer model plans the arrangement, Plenio writes the notes: a *dramatic* song, its arranged score in the Song Sheet, the rendered song - and another arrangement from the arrangement seed. |
| <img src="assets/branding/0.4.5/tutorial-7-yue2-cover-creative.jpg" alt="Tutorial 7 · YuE2 · Cover · Creative modes" width="180" /> | **7 · YuE2 · Cover · Creative modes** *(experimental)* | A recording re-arranged for a full ensemble, with new lyrics that keep its story - *song flow closeness* and *lyrics closeness*, A/B against the original, the cover and its sheet music. |
| <img src="assets/branding/1.0.0/tutorial-8-player.jpg" alt="Tutorial 8 · Plenio Player" width="180" /> | **8 · Plenio Player** | Your songs in the browser, one click from ComfyUI: search, a page per song, the lyrics lit up as they are sung and the sheet music following the music, playlists, Winamp-style visuals that move with the music, settings that last - and *Open in ComfyUI* back to the song's workflow. |

## Listen first

**🎧 [Open the demo gallery](https://jplenio.github.io/Plenio-Music-Production-System/)** - 30 songs made with Plenio 0.2.2 and YuE2 (one per genre, straight out of the templates), 35 MiniMax Music 3 songs and 8 cover versions, with search, filters and everything the model received for each track.

**🔊 [SoundCloud playlist](https://soundcloud.com/pelenio/sets/minimax-music-3-comfyui)** · a sample file with its full prompt report: [`assets/sound-samples`](assets/sound-samples/)

The demos were made with the same music models by Plenio's predecessor, the [Music Production Toolkit](https://github.com/jplenio/ComfyUI-MiniMax-Music-Production-Toolkit) (see [Coming from the Music Production Toolkit?](#coming-from-the-music-production-toolkit)).

## What Plenio does: one clear path per model, and nothing hidden

- **One template per music model.** *YuE2 · Song*, *YuE2 · Cover* and *MiniMax · Song* each show only the controls that apply to them. There is no model switch that half the nodes ignore.
- **Two ways to work, chosen first in the brief.** *New song every run* turns one brief into a whole series: set the number of runs, press Run once, and every run writes and renders a different song. *One song, stop to review* is for the song you want to get right: the run stops at the Song Sheets so you can check and edit the text and the score before anything is rendered, and every later run is a new take of the approved song.
- **The Song Sheet: what you see is what the model gets.** Every document that conditions the music (title, style or caption, lyrics, score) passes through one sheet. Each document is *automatic*, *edited* or *manual*. Manual text is never replaced. If the draft changes under an edit, the run stops and asks instead of guessing. When a sheet stops for review, nothing is rendered until you approve exactly what you saw.
- **A real score editor.** YuE2's score is ABC notation, and the Song Sheet opens it as notation, as a **piano roll** and as ABC text, with playback. Draw, move and resize notes, set **chord symbols** in the chord lane, work through the **bar inspector** (bars, meter, key changes), and export or import **MIDI**. Play a melody in with a **MIDI keyboard** (record with count-in, or step input), hear every track in a **sound** of its own, set them with **presets** for the kind of song, and export the sheet music as **PDF, PNG or SVG** in four sizes. Every edit is checked by the same parser the model uses; a malformed text is refused with a reason and can be reverted.
- **Arrange like in a DAW.** Copy, move and delete whole sections in the section list, as on Cubase's arranger track - or single bars in the bar strip under it. A **cursor** in the ruler sets where playback and paste start, and **Ctrl+V** / **Ctrl+Shift+V** paste at it, overwriting or inserting time. The Guide track, the lyrics and, in covers, the original words and the source recording's times follow every arrangement. The **lyrics** stand over the notes they are sung on and are edited right there - their lines are moved, made longer or shorter, copied and pasted like notes, and chord symbols move by semitones with the notes. The sheet music goes out as **MusicXML**, and a **project file** keeps the score, the Guide notes and the lyrics to go on later.
- **Or write the score yourself.** **5 · YuE2 · DAW** is the song template for composing: an all-rest score is built from the brief, you draw the melody and the chords - play them in with a **MIDI keyboard** or bring a sketch from your DAW with **Import MIDI…** - and YuE2 renders exactly what you approved. The **Guide** track plays with the sheet but is never sent to the model.
- **Covers from the actual music.** SheetSage2 reads the score out of your recording and keeps its beat grid. Qwen3-ASR transcribes the sung words - from the recording or its vocal stem, whichever it hears more surely -, Qwen3-ForcedAligner times them, the writer model corrects the words it is sure were misheard, and Plenio places them into the score's sections. You choose *instrumental*, *original lyrics* or *new lyrics* (written to the phrasing of the original and fitted to its melody line by line), and whether the harmony stays; the cover is named after its source (`<title>-cover`). In the score editor the source recording plays under the notes, bar by bar, and the **sung pitch** is drawn over them, so you hear and see where the transcription is off.
- **Stems, first in the master.** **Stems** splits a song into vocals, drums, bass and other and mixes them back with a **residual** that keeps a neutral mix exact - inside every song template's master, off until you switch *stems* on (in Enhance & Master a block of its own).
- **Finishing built in.** Every song template ends in **Plenio · Master**: **Audio HQ** first - *Stereo Cleanup* calms the unsteady stereo shimmer of AI renders, *Regenerate Highs* lets UniverSR generate new highs above 8.2 kHz when you switch **HQ mastering** on (fewer AI artifacts, about twice the time; on by default in Enhance & Master), presets that follow the song's genre ([guide](docs/user/concepts/audio-hq.md)) - then a gentle tone match, compression and a true-peak limiter to **-14 LUFS / -1 dBTP**. Export writes FLAC 24-bit, MP3 V0 or WAV 32-bit float with tags and embedded cover art, the unmastered take, a **release record** of the documents, seeds, settings, loudness and model licences - and, for YuE2, the **sheet music as a PDF**.
- **Lyrics subtitles, timed by listening.** Export writes every song's lyrics as `(lines).srt` - whole lines - and `(notes).srt` - the lines painted on note by note. The times are measured: the lyrics ASR listens to the song and, for YuE2, the score puts every syllable on its note (half the words within 0.16 s of where they are sung). Ready for a lyric video in DaVinci Resolve or for YouTube ([guide](docs/user/concepts/tags-and-subtitles.md)).
- **Tags from the brief.** Tag fields and file names take variables - `Genre: {genre}[, mood: {mood}]`, `{artist} - {title}`, `{lyrics}` as the lyrics tag - or any connected text, and every field of the brief is an output of its own.
- **Seeds you can read.** One switch per seed: 🔒 keeps a part (the lyrics, the take), 🎲 renews it every run - and the number shown is always the one that made what you just heard ([guide](docs/user/concepts/seeds.md)).
- **Go on with a song later.** **File > Continue a Plenio song…** lists every song you exported, newest first - pick one (or drop its `.plenio.json` - or, since 0.8.0, the song's FLAC, which carries the same record - onto ComfyUI) and it opens in the workflow it was made with, its title, style, lyrics and score kept: new takes, a changed score or new lyrics from exactly where you stopped. Songs made with older versions open in today's template with their settings ([guide](docs/user/concepts/continue-a-song.md)).
- **Listen, show and share** (new in 1.0). The **Plenio Player** plays every song you exported - lyrics lit up as they are sung, the sheet music following the music, Plenio Drop visuals, Live Play for a party - and makes a video of a song or a player in one file to send ([more](#listen-in-the-plenio-player)).
- **Video tutorials for every template** and for the creative modes, narrated and recorded with the real models - [watch them](#watch-the-tutorials).
- **Your own local LLMs as the writer.** The **Local LLM** node runs any GGUF from ComfyUI's `models/LLM` folder (or from LM Studio and the Hugging Face cache) in a llama.cpp server that is started for the draft and gone afterwards, so the GPU is free again for the music model - or asks a running LM Studio, Ollama, llama.cpp, vLLM or Jan. *Write Song*'s **writer model** lists them next to the native Gemma 4 writer (the default) - choose one, and only that one is loaded. No extra packages ([guide](docs/user/concepts/local-llm.md)).
- **Creative modes and closeness sliders (experimental).** Besides the plain generation (arrangement *off*), thirteen modes from simple to rich - *standard*, *sterile*, *unplugged*, *varied*, *call and response*, *signature motif*, *hypnotic*, *breakdown*, *dramatic*, *many instruments*, *jazz colours*, *fantasy* and *key change* (the one mode that lifts the key) - shape the writing and let the writer model plan every section of YuE2's score - chords, what the instrument line plays, energy - with a slider for how close a song stays to its genre, and for covers how close the song flow and the new lyrics stay to the original. The writer plans, Plenio writes and checks every note - chords that carry the melody, instrument lines that leave room for the voice, a key lift that is led in: the score always stays valid, and a plan that cannot be used leaves it as it was, said in the Song Sheet. **Experimental:** the results can surprise - try the modes, listen and keep what you like; *off* stays the dependable choice ([guide](docs/user/concepts/creative-modes.md)).
- **Native ComfyUI all the way.** Generation, loaders, samplers, loops and downloads are ComfyUI's own nodes. Plenio adds 26 small nodes where ComfyUI has nothing equivalent (the predecessor had 55), and every field explains itself in a short tooltip beside the node. ComfyUI manages GPU memory and offers missing model downloads itself.

## The templates

Open them from ComfyUI's template browser (listed under this package's name):

| Template | For |
|---|---|
| **0 · System Check** | versions, GPUs, which model files each template still needs, and a hardware table with your row marked |
| **1 · YuE2 · Song** | new songs with YuE2, sung, with sparse vocals or instrumental, with an editable score ([guide](docs/user/paths/yue2-song.md)) |
| **2 · YuE2 · Cover** | a new version of a recording you own or may use: instrumental, original or new lyrics ([guide](docs/user/paths/yue2-cover.md)) |
| **3 · MiniMax · Song** | new songs with MiniMax Music 3 and its structured caption ([guide](docs/user/paths/minimax-song.md)) |
| **4 · Enhance & Master** | EQ, loudness and export for a file you already have; runs on the CPU ([guide](docs/user/paths/enhance-master.md)) |
| **5 · YuE2 · DAW** | compose the score yourself: piano roll, chord symbols and the Guide track ([guide](docs/user/paths/yue2-daw.md)) |

Every template reads left to right in numbered groups: **SONG → WRITE → SHEET → RENDER → FINISH** (the DAW template adds **DAW** and **FINISH** groups of its own). The sections stand in one row of one height; group 1 opens with the *HQ Mastering & Cover Art* cards and the writer model, Cover Art sits above the render. An *About this template* note explains the path in a few steps, and optional nodes (the instrumental adapter, HQ 3, the Stems block of Enhance & Master) are marked *(optional)* and switched off until you want them. All six templates also run as a simple form in ComfyUI's **App mode**; the Song Sheet buttons work there too, so you can review and edit without the graph.

### Two ways to work

The first field of the **Song Brief** (and of the **Cover Brief**) is the **mode**:

| Mode | What a run does | Use it for |
|---|---|---|
| **new song every run** (song default) | writes and renders a **different song** from the same brief every time - its own title, story and hook - without stopping. Set *Number of runs* in App mode, or the batch count next to **Run**, and one click makes a whole series; every song is exported under its own name. | many songs in one style, finding ideas, overnight batches |
| **one song, stop to review** | stops at the **Song Sheets**: check or edit title, style, lyrics and (YuE2) the score, press *Approve*, run again. After that every run is a **new take** of the same approved song. | the one song you want to get right |

**Where the run stands** is shown on the nodes: before a run every Song Sheet that will stop carries **⏸ review stop**; after a run each Plenio node shows ✓, ⚠ or ✖, and the sheet where the run waits shows **⏸ waiting for your approval** with an amber frame (and a message says what to do). The line under the sheet's button says the same in App mode.

The cover template has the same choice (*new cover every run* is its default - a new version, title, style and, with new lyrics, the lyrics, on the same transcription every time, so a queue of covers runs through; *one cover, stop to review* stops to check the transcription and the lyrics first). The Song Sheets follow the brief (*review: as the brief says*); you can still set a single sheet to *continue* or *stop for review*.

<p align="center">
  <img src="assets/branding/0.4.5/Screenshot%20YuE2-graph.png" alt="The 1 · YuE2 · Song template in ComfyUI: brief, writer, Song Sheets, render and finish in numbered groups" width="100%" />
</p>

*1 · YuE2 · Song (an earlier version): the brief on the left, the writer and the Song Sheets in the middle, render, mastering and export on the right. Today the sections stand in one row of one height, the switches and the writer model open group 1, Cover Art sits above the render and the stems are inside the Master block.*

**App mode** - the same templates as a simple form, without the graph:

| 1 · YuE2 · Song | 3 · MiniMax · Song | 4 · Enhance & Master |
|---|---|---|
| <img src="assets/branding/0.4.5/Screenshot%20YuE2-appmode.png" alt="1 · YuE2 · Song in App mode: brief fields, take seed and the finished song" width="100%" /> | <img src="assets/branding/0.4.1/Screenshot%20Minimax-appmode.png" alt="3 · MiniMax · Song in App mode" width="100%" /> | <img src="assets/branding/0.4.1/Screenshot%20SoundEnhance-appmode.png" alt="4 · Enhance & Master in App mode" width="100%" /> |

*The apps also show the mode and the Song Sheet buttons.*

### Make a new song

1. Open **1 · YuE2 · Song** or **3 · MiniMax · Song**. ComfyUI offers to download missing model files.
2. Choose the **mode** in the **Song Brief** (see [Two ways to work](#two-ways-to-work)).
3. Fill in the brief: pick one of about 240 genre templates or describe your own idea; set mood, tempo, length (1:00 to 6:00), vocals (language, voice, theme) or *instrumental*.
4. Queue. The writer (Gemma 4 through ComfyUI's native text generation) drafts title, style and lyrics; YuE2 plans a score; the Song Sheets show both.
5. *New song every run:* every further run is the next song of the series (set the **Draft seed** to 🎲 *new seed* for even more variety). *One song, stop to review:* approve the sheets, then every further run is a new take - the take seed changes, the draft and the plan stay cached and your edits stay valid.
6. Want more than YuE2's own plan? Choose a **creative mode** in the brief's *arrangement* (and its *genre closeness*): the writer then plans every section of the score, and **Song Sheet · Score** shows the arranged score and what was changed. *Arrangement seed* gives another arrangement of the same song ([Creative modes](docs/user/concepts/creative-modes.md)).
7. Steadier or bolder? The brief's **creativity** slider goes from *0 steady* to *100 experimental*; *50* is the reference, exactly as before. It shapes the writer's rules and temperature and how freely YuE2 plans and performs ([Creativity](docs/user/concepts/creativity.md)).

### Make a cover

1. Open **2 · YuE2 · Cover** and load the source recording.
2. Choose the mode, the target style in the **Cover Brief**, the vocals (the template starts with the *original lyrics* on the style template *pop/dance-pop-vocal*; *instrumental* lets an instrument play the vocal melody) and the harmony (the template starts with *keep original chords*). With an empty title the cover is named after its source recording: `<title>-cover`.
3. Queue: with *new cover every run* (the default) it renders straight through, a new version every run. With *one cover, stop to review* the run stops at **Song Sheet · Score** and later at **Song Sheet · Text**, so you can inspect and edit the transcribed score and the lyrics before YuE2 renders.
4. Optional: a **creative mode** re-arranges the transcription within the *song flow closeness* (100 the original ... 0 only a hint; the form always stays, below 80 the melody follows the new chords), and with *new lyrics* the *lyrics closeness* sets how close the new words stay to the original ones.

<p align="center">
  <img src="assets/branding/0.4.5/Screenshot%20YuE2-cover-graph.png" alt="The 2 · YuE2 · Cover template: source, Cover Brief, score, lyrics, render and finish" width="100%" />
</p>

*2 · YuE2 · Cover: source and Cover Brief, then Song Sheet · Score and Song Sheet · Text with their review stops, render, mastering and export.*

### Edit the score

Open a Song Sheet and choose the score tab. The **piano roll** draws, moves and resizes notes (Review mode: into rests, **Alt** to overwrite) and in its *Select* mode frames several notes at once, the **chord lane** takes chord symbols, the **inspector** handles the bar the selection starts in (insert, duplicate, delete, meter, key changes), and the notation and the ABC text stay in sync with the selection. **Export MIDI** writes the score (and the Guide notes) as a type-1 file; **Import MIDI…** shows the file's tracks with a role each, its grid and what the import would change *before* it replaces anything - and can read chord symbols from a Chords track. **Import MusicXML…** brings back the sheet music *Export MusicXML* wrote, with the lyrics on their notes - also after a script changed it. Undo and redo work, and every result is validated before it is kept.

The editor also arranges. Select sections in the list and duplicate (Ctrl+D), copy, move (Ctrl+↑/↓ or drag; Alt copies) or delete them - and single bars the same way in the bar strip under the sections. Click in the ruler to set the **cursor**: playback starts there, and **Ctrl+V** pastes the clipboard there, overwriting the notes of its voices, while **Ctrl+Shift+V** inserts it and moves what follows. When the song has lyrics, a **lyrics lane** shows every line over the notes it is sung on: a double-click edits it, and lines are selected, moved, made longer or shorter, deleted, copied and pasted like notes; the notation shows the syllables under the notes. **Export MusicXML** hands the sheet music to MuseScore, Sibelius, Dorico or Cubase, **Export notation…** gives it as PDF, PNG or SVG in four sizes, **♫ sounds** plays each track in its own sound (piano, strings, pad, voice ... - with presets by kind of song, and your own), and **Save project / Open project…** keeps the score, the Guide notes, the lyrics and these settings in one file. See the [score editor guide](docs/user/concepts/score-editor.md).

<p align="center">
  <img src="assets/branding/0.4.4/Screenshot%20Score-Editor.png" alt="The Song Sheet's score tab in the DAW layout, playing the chorus of an imported sketch: the chord and lyrics lanes over the piano roll, the transport with play, rec, step, the MIDI keyboard and the sounds, the notation with the syllables, and the four tracks with their sounds on the left" width="100%" />
</p>

*The score tab of a Song Sheet in the DAW layout, playing the chorus of a sketch brought in with Import MIDI: the chord lane and the lyrics lane over the piano roll (each line over its phrase, each syllable over its note), the **transport** right under the roll (play, ● rec and step input with a MIDI keyboard, ♫ sounds, loop, metronome, the voices, speed), the notation with the syllables under the notes, the files (MIDI, MusicXML, the notation as PDF or picture, the project) - and on the left the four **tracks**, each with its sound.*

Every track plays in a sound of its own - piano, electric piano, strings, pad, organ, flute, a sung “ah”, pluck, synth lead, bass, mallets - synthesized in the browser, so nothing is downloaded. **Presets** set the sounds and the basic settings for a kind of song (pop, ballad, rock, electronic, acoustic, jazz, orchestral) or a way of working (composing with a MIDI keyboard, checking a cover's transcription, a free cover arrangement); **save current as preset…** keeps your own in ComfyUI, for every song. **Export notation…** gives the sheet music as a PDF on A4 or Letter pages, as a PNG or SVG picture, or prints it - and *Export Release* saves that PDF of the final score with the lyrics automatically next to the song (`<name>.pdf`, the YuE2 templates on A4).

| | |
|:---:|:---:|
| <img src="assets/branding/0.4.4/Screenshot%20Sounds.png" alt="The sounds panel over the transport: the preset Pop chosen, and Vocal in Voice ah, Instrument in Pluck, Chords in Pad and Guide in Bass, each with a play button to hear it" width="100%" /> | <img src="assets/branding/0.4.4/Screenshot%20Notation-PDF.png" alt="Page 1 of the notation exported as PDF: the title Open Window, the tempo, chord symbols and sections over the Vocal and Ins staves, the lyrics under the Vocal notes, and the page number 1 / 2" width="62%" /> |
| *♫ sounds: a preset for the kind of song, a sound per track, ▶ to hear it* | *Export notation… → PDF: the first page of the sketch's sheet music* |

For a **cover** the source recording is a track of its own, like an audio track under the MIDI in a DAW: its **waveform** runs under the chord and lyrics lanes, **hear: both** plays the notes and the recording together on the transcription's beat grid (**A/B** switches at once), **⇆ align** moves the recording when the beat detection was off, and the **Sung Pitch** node draws the sung melody as a curve over the notes - so a wrong pitch, an octave off or a missed note shows at a glance. Quantize (Q), vertical zoom and a *follow* switch round off the roll; **⌨ keys** lists every key and gesture.

<p align="center">
  <img src="assets/branding/0.4.4/Screenshot%20Cover-Score-Editor.png" alt="The score editor of a cover, playing the chorus: the source's waveform in a lane over the piano roll, the sung pitch as a pink curve over the transcribed vocal notes, and the transport with hear both, notes, source, A/B and align" width="100%" />
</p>

*A cover's chorus playing in Song Sheet · Score: the source recording's waveform over the roll, the sung pitch (pink) over the transcribed notes - here an octave lower in the singing, so the curve is drawn in the notes' octave (*sung +8va*) - and the transport with **hear: both**, **A/B** and **⇆ align**. *wave* and *sung* in the roll's toolbar hide both for a cover that goes far from the original.*

### Compose a song yourself (YuE2 · DAW)

Open **5 · YuE2 · DAW**, describe the song in the brief and run: the run stops at **Song Sheet · Text** with the writer's lyrics; approve them and run again. *Score Tools* builds an empty score in the right length, meter and key, and the run stops at **Song Sheet · DAW**. Draw the notes, set the chords, split the score into sections - or press **Import MIDI…** and bring a sketch from your DAW: the dialog shows every track of the file with its role (Vocal, Instrument, Chords, Guide) before anything changes. Approve and run again: YuE2 renders exactly the score you approved. The fourth track, **Guide**, is played with the sheet but never sent to the model ([guide](docs/user/paths/yue2-daw.md), [video: tutorial 5 in the playlist](https://www.youtube.com/playlist?list=PLAFqTtP59fgE)).

<p align="center">
  <img src="assets/branding/0.4.5/Screenshot%20YuE2-DAW-graph.png" alt="The 5 · YuE2 · DAW template: brief, writer, Song Sheet · Text, Score Tools and Song Sheet · DAW, render and finish" width="100%" />
</p>

*5 · YuE2 · DAW: the writer and Song Sheet · Text for the words, Score Tools and Song Sheet · DAW for the music, then render, mastering and export.*

<p align="center">
  <img src="assets/branding/0.4.2/Screenshot%20Import-MIDI.png" alt="The Import MIDI dialog: the four tracks of a sketch with their roles, the grid, read chords from the notes, keep the Guide notes, and what the import did" width="80%" />
</p>

*Import MIDI…: the file's tracks with a role each - the bass of this sketch goes to the Guide track - the grid, and a report of what the import did, before *Insert* replaces the score (one undo step).*

Or play it in: with a **MIDI keyboard** (Chrome or Edge), **● rec** (Shift+R) records into the roll's *draw into* voice from the cursor after a bar of count-in. The keys show as notes while you play, timed as you heard them; Space keeps the take as one undo step, on the *quantize* grid, and Esc throws it away. **step** input writes a note at the cursor with every key - a melody can be entered without playing in time.

<p align="center">
  <img src="assets/branding/0.4.4/Screenshot%20MIDI-Record.png" alt="Recording with a MIDI keyboard in Song Sheet · DAW: red notes appear in the piano roll from bar 5 while the score plays, the rec button is lit, and the MIDI panel shows the keyboard, count-in, quantize, replace and step length" width="100%" />
</p>

*Recording a counter-line into Ins from bar 5: the played keys appear red in the roll while the score plays, and 🎹 holds the keyboard, hearing the keys, count-in, quantize, replace or merge and the step input's length.*

### Make a song with MiniMax Music 3

The same brief and writer, one Song Sheet with the structured caption (Global Metadata, Vocal Details, Arrangement) and the lyrics; the sheet checks the exact 5,000-token prompt budget with the model's own tokenizer before rendering.

<p align="center">
  <img src="assets/branding/0.4.5/Screenshot%20Minimax-graph.png" alt="The 3 · MiniMax · Song template: brief, writer, Song Sheet, MiniMax render and finish" width="100%" />
</p>

*3 · MiniMax · Song: one Song Sheet between the writer and the MiniMax Music 3 render.*

### Finish a recording

<p align="center">
  <img src="assets/branding/0.4.5/Screenshot%20SoundEnhance-graph.png" alt="The 4 · Enhance & Master template: load a file, EQ, loudness and export" width="100%" />
</p>

*4 · Enhance & Master: load a file, shape it with the EQ (manual bands with the curve, or tone match), set the loudness target and export with the file's own tags and cover.*

## Stems, Audio HQ and Refine

**Stems** is the first stage of the master: off until you switch *stems* on on the *Plenio · Master* node (in *4 · Enhance & Master* a block under Load Audio: **Ctrl+B**); **Audio HQ** follows inside the master.

- **Stems**: *Separate Stems* splits the song into up to four stems (vocals, drums, bass, other) and keeps the **residual** as the strip *rest*, so a neutral **Stem Mixer** returns the song unchanged - separation errors can only affect what you change yourself. The mixer has a fader, mute/solo, compression and reverb/delay sends per strip, you drag **muted time ranges** directly on the strip's waveform, and **save** writes a strip as its own 24-bit FLAC - the bass and the vocals also as MIDI notes. The mixer is inside the block: open it with the icon at the top right of the node. The mixdown is not normalised; *Plenio · Master* sets the loudness. Needs the BS-RoFormer checkpoint (527 MB, `models/audio_separation`). [Details](docs/user/concepts/stems.md)
- **Audio HQ**: three stages before the EQ inside *Plenio · Master* - **HQ 1 · Stereo Cleanup** (on) cleans the side signal above 2 kHz and adds a little warmth, **HQ 2 · Regenerate Highs** (with the **HQ Mastering** switch at the top of the template - off by default, on in Enhance & Master) lets UniverSR (229 MB, `models/audio_sr`, needed only then) generate new highs above 8.2 kHz at the original's level - fewer AI shimmer and artifacts, the song takes about twice as long - **HQ 3 · De-Reverb** (bypassed) dries a short metallic room but dulls the highs. Presets *auto* (from the brief's genre), *standard*, *gentle*, *strong*, *wide* and *custom*; HQ 2 takes about 1.5 s per second of music on an RTX 5060 Ti. HQ 3 is **experimental**. [Details](docs/user/concepts/audio-hq.md)
- **Refine (48 kHz)**: in no template since Audio HQ - the node library keeps it for a plain 48 kHz conversion or super-resolution with a crossover of your own. [Details](docs/user/concepts/refine.md)

<p align="center">
  <img src="assets/branding/0.4.1/Screenshot%20Stems.png" alt="The Stem Mixer node: a strip per stem and the residual rest with fader, mute/solo, compression, reverb and delay sends and save, and the two effect buses" width="80%" />
</p>

*The Stem Mixer before its first run: the four documented stems and the residual "rest", each with fader, mute/solo, compression, the two sends and a save switch; the waveform under each strip fills with the separation, and the reverb and delay buses sit below.*

## Mastering and export

- **EQ**: up to 8 parametric bands edited directly on the response curve - drag a handle for frequency and gain, use the wheel for Q, type exact values into the band strip - with presets, undo/redo and the last run's spectrum behind the curve; or *tone match*: a gentle tilt (*warm*, *bright*) or the long-term spectrum of a reference recording, within a maximum gain you set.
- **Loudness & Dynamics**: BS.1770-4 loudness, EBU loudness range, 4x oversampled true peak; a soft-knee compressor and a lookahead true-peak limiter. The default target is -14 LUFS / -1 dBTP, and the result is measured and reported. If the target cannot be reached within the gain and limiter budgets, you get the best result within them and a note.
- **Export Release**: FLAC 24-bit, MP3 V0 (above 48 kHz converted for the MP3 only), WAV 32-bit float; title, artist, album, date, track, genre, comment (preset to *Powered by Plenio Music Production System / ComfyUI*), album artist, composer and the lyrics, typed - with variables such as `{genre}`, `{mood}`, `{lyrics}` -, connected or copied from the loaded file; the lyrics also as subtitles (`.srt`) timed by listening. Cover art - from the optional Cover Art block, or copied from the loaded file - is embedded in the FLAC and MP3 files (whichever tag option you choose) and saved next to them as `.jpg`; WAV keeps the `.jpg` only. Every export also writes a `.plenio.json` release record - with the workflow, so *File > Continue a Plenio song…* opens the song again - and puts the same record into the song's FLAC (*project in FLAC*, on by default).

<p align="center">
  <img src="assets/branding/0.4.1/Screenshot%20graphical-EQ.png" alt="The EQ node's panel after a run: the warm tone match's four gentle bands as a curve over the song's spectrum, the band strip and Edit these bands" width="80%" />
</p>

*The EQ node's panel after a run: the warm tone match proposed four gentle bands, drawn as a curve over the song's own spectrum. **Edit these bands** turns them into manual bands - each a handle on the curve, with an inline editor for type, frequency, gain and Q; presets, the gain range, undo/redo and compare sit above the curve.*

Details and limits: [Mastering and audio formats](docs/user/concepts/mastering.md).

## Listen in the Plenio Player

New in 1.0: your songs in the browser - a program of its own, which runs without ComfyUI and opens at `http://127.0.0.1:8765/`.

- **From ComfyUI, one click:** **Plenio Player** beside *Run*, the **Plenio** menu, or **▶ Open in the Plenio Player** on Export Release (right at the song just exported). ComfyUI starts the player if it is not running yet.
- **Without ComfyUI:** double-click **`Plenio Player.bat`** in the Plenio folder (`./plenio_player.sh` on macOS and Linux), or `python plenio_player.py`.

It finds every song Export Release wrote into ComfyUI's output folder. **Open in ComfyUI** on a song's page opens its workflow in ComfyUI again, to work on it. Your playlists and every setting are kept on this computer (with a backup on the Settings page); a song you no longer want goes to the retired songs, or is deleted.

- **Find songs**: search titles, lyrics and briefs, or narrow it with fields like `genre:jazz`, `bpm:>110`, `key:Am` or `is:fav`; every value of a song in the filters, with numbers that follow them, a right click that leaves songs out, suggestions as you type and saved filters; **tags of your own** (`#party`); eight sorts.
- **A page per song**: the lyrics (click a line to hear it), the notation, the sheet music PDF, the brief and the seeds, every file, the other takes and songs alike.
- **While it plays**: the lyrics light up syllable by syllable; on the sheet, the notes light up as they sound. The times are measured when the song is exported.
- **Visuals after Winamp and MilkDrop**: 13 classic visuals and **Plenio Drop** - 21 MilkDrop-style presets drawn by Plenio's own renderer on the graphics card (five draw the song's cover, title and words into the picture), and one made up anew each time - all moving with the music, changing softly from one to the next (morph, melt, fade …), on the whole screen if you like (Shift+F). Let the player match them to the music, pick at random from the ones you tick, cycle or fix one - or give a song or a playlist its own. **Write your own Drop presets**: a short JSON file of numbers and formulas, changed on screen as you save it ([guide](docs/user/concepts/player-visuals.md)).
- **Playlists**: smart lists, your own lists, a radio of songs alike, crossfades, repeat (the playlist or the song), A/B with the unmastered take and a sleep timer.
- **Live Play**: a playlist for a party that you change while it plays - and the songs you make in ComfyUI join it as soon as they are exported: next, at the end or anywhere. **Show the visual** puts it on the big screen.
- **Guests in your network**: everyone on the party's Wi-Fi scans a QR code and sees the live playlist on the phone - and, if you allow it, moves songs, takes them out and adds songs from your library. Their QR code can stand over the visual on the big screen.
- **A song as a video**: an MP4 of the song's visual with its lyrics (subtitles, karaoke or word by word, in places of their own, coming in on the beat), the cover all the way through, its notation following the music and a title card - Full HD, 4K, square or upright for Shorts.
- **Share your songs as a player**: one HTML file with the player and the songs you choose (as MP3) - send it, and anyone can double-click it and listen, with the lyrics, the notation and the visuals, no install. Also for hundreds of songs, in parts for a phone.
- **In the making**: videos and shared players are made in the background while you listen; a list shows how far each is.
- **In your network**: a link (and a QR code) opens the whole player on the phone, the tablet or another computer at home - ComfyUI too, when it runs.
- **Your folders, and other music**: choose the folders in Settings; other music in them plays too, clearly marked, with its tags, cover and `.lrc` lyrics.

<p align="center">
  <img src="assets/branding/1.0.0/player-stage.jpg" alt="The Plenio Player's Now playing view: the song's cover, the lyrics lit up as they are sung, the sections as chips and the waveform as the seek bar, a visual behind" width="49%" />
  <img src="assets/branding/1.0.0/player-notation.jpg" alt="The Plenio Player's notation view: the score with the lyrics under the notes, the cursor at the note sung now, the lyrics at the side" width="49%" />
</p>
<p align="center">
  <img src="assets/branding/1.0.0/player-library.jpg" alt="The Plenio Player's library: a featured song, the search with filter chips, the songs as cards, the bar with the line sung now" width="49%" />
  <img src="assets/branding/1.0.0/player-visual.jpg" alt="The Plenio Player's visual view: the Retro Grid visual full screen with the lyrics as subtitles" width="49%" />
</p>
<p align="center">
  <img src="assets/branding/1.0.0/player-video.jpg" alt="Save a song as a video: the preview with karaoke lyrics and the notation, the size, the part, the visual and the lyrics' look" width="49%" />
  <img src="assets/branding/1.0.0/player-lyrics-look.jpg" alt="How the lyrics look: the panel in Now playing with the fonts and effects, a line in Poster and Neon over Plenio Drop" width="49%" />
</p>

*The Plenio Player: Now playing, the sheet following the music, the library, a visual with the lyrics as subtitles, a song saved as a video, and the lyrics' look.*

Guide: [Plenio Player](docs/user/concepts/player.md).

## Built for different computers

The **0 · System Check** template reads your GPU and marks your row. Nothing is switched automatically; you choose the model files in the loaders.

<p align="center">
  <img src="assets/branding/0.4.5/Screenshot%200-System%20Check.png" alt="The 0 · System Check template: versions, GPU and RAM, the model files of every template, the hardware table with this machine's row marked, and recommendations" width="70%" />
</p>

*0 · System Check: versions, GPU and memory, which model files each template has or still needs, and the hardware table with this machine's row marked.*

| GPU memory | YuE2 | MiniMax Music 3 | Cover Art (FLUX.2 Klein 4B) |
|---|---|---|---|
| below 8 GB | only with heavy offloading (the int8 model alone is 4 GB): very slow, keep songs short | only with heavy offloading: very slow | not practical |
| 8-12 GB | int8 checkpoint (template default); keep songs short | int8 DiT `minimax_music3_dit_int8_convrot` (2.5 GB) and *tiled decode* | `flux-2-klein-4b-fp8` with the text encoder `qwen_3_4b_fp4_flux2` |
| 12-16 GB | int8 checkpoint (template default) | the defaults may offload; the int8 DiT is the safer choice | fp8 model and fp4 text encoder |
| 16-24 GB | int8 checkpoint with the Gemma 4 E4B writer | template defaults (fp16 DiT, int8 text encoder) | template defaults (bf16) |
| 24 GB and more | the bf16 checkpoint `yue2_3b_bf16` (7.8 GB) is possible; int8 stays the faster default | template defaults | template defaults |

YuE2 is measured on a 16 GB RTX 5060 Ti; the other rows come from model sizes and the predecessor toolkit's ratings. *4 · Enhance & Master* needs no GPU. See [Models and downloads](docs/user/models.md) for every file, folder and size.

## Installation

Requires **ComfyUI 0.37.0 or newer** (tested with 0.41.0); it provides the native YuE2, SheetSage2, MiniMax Music 3, FLUX.2 and text-generation nodes Plenio builds on.

**ComfyUI Manager:** open *Manager → Custom Nodes Manager*, search for **Plenio Music Production System** and install it. Restart ComfyUI.

**Comfy CLI:**

```bash
comfy node install comfyui-plenio-music
```

**By hand:**

```bash
cd ComfyUI/custom_nodes
git clone https://github.com/jplenio/Plenio-Music-Production-System
```

Restart ComfyUI, open **0 · System Check** from the template browser and run it. Plenio installs no Python packages. One feature is optional and tells you the command when you use it: `python -m pip install faster-whisper` for covers with lyrics. Model files come through ComfyUI's missing-model dialog when you open a template, or [by hand](docs/user/models.md).

## Coming from the Music Production Toolkit?

Plenio is the successor of the [Music Production Toolkit](https://github.com/jplenio/ComfyUI-MiniMax-Music-Production-Toolkit) (formerly *MiniMax Music Production Toolkit*). So much changed that it became a new project. The old name also no longer fit, because MiniMax is one of three music paths, not the whole story.

- **New package, new node IDs.** Both can be installed side by side, and old workflows keep working with the old toolkit. There is no automatic migration of saved workflows; start from the new templates.
- **Carried over deliberately:** the prompt template library (re-checked, 239 templates), the EQ and loudness presets, the compressor and limiter (ported and verified sample by sample against the toolkit's output), and the lessons of its cover work.
- **Replaced:** the llama.cpp LLM node by ComfyUI's native text generation; the model downloader and advisor by ComfyUI's missing-model dialog and the System Check; the cover studio's freedom slider by an editable score and explicit brief choices; FlashSR and the restoration chain are not part of Plenio (the tested takes showed no need for it).

## Documentation

- Users: [Getting started](docs/user/getting-started.md) · [YuE2 Song](docs/user/paths/yue2-song.md) · [YuE2 Cover](docs/user/paths/yue2-cover.md) · [YuE2 DAW](docs/user/paths/yue2-daw.md) · [MiniMax Song](docs/user/paths/minimax-song.md) · [Enhance & Master](docs/user/paths/enhance-master.md) · [Song Sheet](docs/user/concepts/song-sheet.md) · [Continue a song](docs/user/concepts/continue-a-song.md) · [Brief templates](docs/user/concepts/brief-templates.md) · [Score editor](docs/user/concepts/score-editor.md) · [Stems](docs/user/concepts/stems.md) · [Refine (48 kHz)](docs/user/concepts/refine.md) · [Instrumental](docs/user/concepts/instrumental.md) · [Mastering](docs/user/concepts/mastering.md) · [Plenio Player](docs/user/concepts/player.md) · [Plenio Drop presets](docs/user/concepts/player-visuals.md) · [Tags and subtitles](docs/user/concepts/tags-and-subtitles.md) · [Seeds](docs/user/concepts/seeds.md) · [App mode](docs/user/concepts/app-mode.md) · [Local LLMs](docs/user/concepts/local-llm.md) · [Models](docs/user/models.md) · [Configuration](docs/user/configuration.md) · [Licensing](docs/user/licensing.md) · [Troubleshooting](docs/user/troubleshooting.md)
- Contributors: [Architecture](docs/dev/architecture.md) · [Extending Plenio](docs/dev/extending.md) · [Testing](docs/dev/testing.md) · [Design documents](docs/design/README.md) · [Decisions](docs/adr/README.md) · [Acceptance review](docs/audit/2026-09-25-phase-10-acceptance.md)
- Videos: [the spot](https://youtu.be/XpNpks9ZCgE) · [Plenio in 75 seconds](https://youtu.be/q_dMH834E1o) · [all tutorials (playlist)](https://www.youtube.com/playlist?list=PLAFqTtP59fgE)
- [Changelog](CHANGELOG.md): what changed in each version · [Security and privacy](SECURITY.md): what Plenio downloads, starts and writes

## A few honest limits

- YuE2 sometimes renders a take to the length ceiling and stops mid-phrase; render another take. *Instrumental* is a strong request, not a guarantee: the optional *Check Vocals* measures the take and keeps the cleanest one.
- The ASR can mishear words. A cover shows unsure words highlighted so you can correct them before rendering.
- Mastering is whole-song loudness with a gentle tone match after Audio HQ. There are no fades and no multiband processing.
- The player's videos need a browser that can encode video (current Chrome or Edge), and Plenio Drop needs WebGL2; the other visuals draw everywhere.
- **Stems**, **Audio HQ 3** and **Refine** are experimental: their guarantees (a neutral mix returns the input, same rate and length, no normalisation) are tested, but how the models *sound* is decided by listening checks. Audio HQ 1 and 2 (UniverSR) passed the listening test; their profiles other than *standard* are not listened to yet ([test report](docs/test-reports/2026-10-21-audio-hq.md)).

## Licences

- Plenio's code: **Apache-2.0** ([LICENSE](LICENSE), [NOTICE.md](NOTICE.md)); bundled frontend libraries: [THIRD_PARTY.md](THIRD_PARTY.md).
- **Model weights have their own licences and are not included.** YuE2, YuE2-VAE, SheetSage2 and the instrumental adapter are **CC BY-NC 4.0 (non-commercial)**. MiniMax Music 3 uses the MiniMax-Music3 Community License with commercial conditions. FLUX.2 Klein 4B, the Gemma 4 writer and faster-whisper are Apache-2.0 or MIT. The release record names the licences of the models a song was made with; see [Licensing](docs/user/licensing.md).

Created by [Johannes Plenio](https://github.com/jplenio). This is an independent community project.
