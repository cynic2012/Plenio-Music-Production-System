# Changelog

All notable changes of the current version and the one before. Versions follow semantic versioning; published Registry versions are immutable. Earlier versions (0.2.0 to 1.3.1): the [changelog of 1.3.2](https://github.com/jplenio/Plenio-Music-Production-System/blob/v1.3.2/CHANGELOG.md) (1.3.1), the [changelog of 1.3.1](https://github.com/jplenio/Plenio-Music-Production-System/blob/v1.3.1/CHANGELOG.md) (1.3.0), the [changelog of 1.3.0](https://github.com/jplenio/Plenio-Music-Production-System/blob/v1.3.0/CHANGELOG.md) (1.2.1), the [changelog of 1.2.1](https://github.com/jplenio/Plenio-Music-Production-System/blob/v1.2.1/CHANGELOG.md) (1.2.0), the [changelog of 1.2.0](https://github.com/jplenio/Plenio-Music-Production-System/blob/v1.2.0/CHANGELOG.md) (1.1.0), the [changelog of 1.1.0](https://github.com/jplenio/Plenio-Music-Production-System/blob/v1.1.0/CHANGELOG.md) (1.0.2), the [changelog of 1.0.2](https://github.com/jplenio/Plenio-Music-Production-System/blob/v1.0.2/CHANGELOG.md) (1.0.1), the [changelog of 1.0.1](https://github.com/jplenio/Plenio-Music-Production-System/blob/v1.0.1/CHANGELOG.md) (1.0.0), the [changelog of 1.0.0](https://github.com/jplenio/Plenio-Music-Production-System/blob/v1.0.0/CHANGELOG.md) (0.8.0), the [changelog of 0.8.0](https://github.com/jplenio/Plenio-Music-Production-System/blob/v0.8.0/CHANGELOG.md) (0.7.0), the [changelog of 0.7.0](https://github.com/jplenio/Plenio-Music-Production-System/blob/v0.7.0/CHANGELOG.md) (0.6.1), the [changelog of 0.6.0](https://github.com/jplenio/Plenio-Music-Production-System/blob/v0.6.0/CHANGELOG.md) (0.5.0 and 0.6.0), the [changelog of 0.4.4](https://github.com/jplenio/Plenio-Music-Production-System/blob/v0.4.4/CHANGELOG.md) (0.2.0 to 0.4.4) and the [GitHub releases](https://github.com/jplenio/Plenio-Music-Production-System/releases).

## 1.4.0 - 2026-10-28

**The player starts ComfyUI as you do, and remembers what the party felt.** The Plenio Player starts ComfyUI the way you last started it - with your models folder and options - and names a model file ComfyUI does not find. A song's page says when, how long and on what it was made, and with which lyrics fidelity. The guests' reactions are kept for every song, as many as they like or one each; only the guests' songs are party songs, and the big screen says which party. Videos give their graphics memory back and try again; links, headings and texts are clearer on every screen.

### Added

- **How a song was made, on its page**: the date and time, how long making it took, the graphics card (with its memory) or the processor alone, the processor and the RAM, and the lyrics fidelity. Export Release writes them into the release record (`made`; the names of the graphics card and the processor, no serial number, user name or path - [what the record holds](SECURITY.md#plenios-http-routes)); songs exported before show when they were saved and, where their record says it, the fidelity. [Details](docs/user/concepts/player.md#a-songs-page)
- **The guests' reactions kept for every song**, apart from the favourites' hearts: counted in the player's state (`reactions.json`), shown in Live Play and on the song's page (*🔥 12 · ❤️ 4 from the guests*). The host chooses **as many per song as they like** or **one per song and guest** - a tap on another emoji changes it. [Details](docs/user/concepts/player.md#guests-in-your-network)
- The example songs as videos made by the Plenio Player, in the README (*Listen first*) and the getting-started guide; tutorials 9 and 10 in the README's table.

### Changed

- **The player starts ComfyUI the way you last started it**: every time ComfyUI loads Plenio, Plenio keeps its Python and its arguments (your `--models-directory`, your options); *Start the studio* and a song ordered while ComfyUI is not running use them when *Settings › The studio* has no arguments of its own - also for ComfyUI Desktop, whose folder has no Plenio in it. The settings show which arguments it uses. [Details](docs/user/concepts/player.md#the-studio-comfyui-started-by-the-player)
- **Party songs are the guests' songs only**: a song ordered on the party's page is saved in the day's party folder and named on the big screen; a song you or a user make in the player is saved like one made in ComfyUI (the template's folder and tags).
- **The big screen and the guests' phones say when a party song's party was** (*made at the party on 27 October 2026*), not *this party*.
- The sidebar names the songs' folder by its last two folders (the whole path in its tooltip; a click opens the folders in Settings).
- On a phone, Live Play's and Make a song's headings stand above their buttons, and the playlists come two in a row.

### Fixed

- **A song ordered from the player stopped with "Load checkpoint: Value not in list"**, and *Every setting of the studio* listed only LM Studio's models, when the player had started ComfyUI without the models folder it is usually started with. Besides the start above, a missing model file is now named, with what to do (*ComfyUI does not find the model file …*), and a model field set to a file ComfyUI does not list says so.
- **Videos stopped now and then with "out of memory"**: every preview - one at each change in the video dialog - and every video kept the graphics memory of its Plenio Drop renderer until the browser collected it. They give it back at once now; a lost graphics context is made anew, the video's pieces on their way to the player are bounded, and a video that fails is tried once more by itself.
- **Links to a section of the settings** (*Switch it on in Settings*, *How to start it*) opened the settings at the top when they were already open, or before the section had loaded.

## 1.3.2 - 2026-10-27

**Lyrics you can correct in Enhance & Master, and instrumental covers that run again.** Enhance & Master gets an optional *Lyrics* block: the recording's words are heard, corrected on a Song Sheet and released as you wrote them. An instrumental cover no longer stops at the transcription, and the player's help plays the tutorials of 1.3.1.

### Added

- **Enhance & Master: correct the lyrics before the release.** An optional *Lyrics* block (bypassed until you switch it on) hears the recording's words and stops at a Song Sheet; the words fixed there go into the subtitles, the lyrics tag and the release record, timed to the singing. Before, the words went out as the ASR heard them, misheard ones included. [Details](docs/user/paths/enhance-master.md#correcting-the-lyrics)

### Fixed

- **An instrumental cover stopped at Transcribe Lyrics** (*The transcription found no vocal melody*) when the source had no singing, although the Cover Brief said *instrumental* (since 1.2.1). An instrumental cover now skips the transcription.
- **A Song Sheet waiting for review let an Export Release that reads only its report run**, with the unreviewed documents; the report now waits for the approval like the sheet's other outputs.
- With *copy from loaded file*, a Song Sheet's lyrics now win over the lyrics tag copied from the file.

### Changed

- **Help & tutorials in the player** plays the tutorials of 1.3.1: *8 · The Plenio Player* in its new recording, and the new *9 · Party songs* and *10 · Song API*. The player guide and the Song API guide link them too.
