# Party songs and the Song API - design

The owner's request (2026-10-25): guests and logged-in users of the Plenio Player make songs of their own, on the
fly, at the party - YuE2 only, new songs and covers. The admin chooses in the settings who may. A simple form
(template, description, genre, mood, tempo, length, vocals, language, voice, theme, key, meter; a template fills
every field; each field a list of every value the templates have, or a value of one's own; for a cover the original
song uploaded), a beautiful *Generate Song* button, and an overview of one's songs in the making: made (when),
being made (for how long), waiting (where in line, and very roughly when it will be done); move a song in the
line, delete it, edit it while it has not started. Always *HQ mastering* off and *Cover Art* on; album *Party-Song
<date>*, artist *Guest* or the user's name; the songs written to `plenio/Party-Songs-<date>`; a finished song joins
Live Play as new songs do. Attractive and intuitive for people who know nothing of sound generation; nothing of it
in the shared (portable) player. The player talks to ComfyUI through an **API of Plenio's own on the running
ComfyUI**, after best practice, with every input field of the template's group *1 · Song*; review stops are not
supported yet but the code is ready for them; the API follows changes of the workflow in later versions, as far as
possible by itself.

User guides: [player.md](../user/concepts/player.md#party-songs-guests-make-songs) and
[song-api.md](../user/concepts/song-api.md).

## 1. Constraints and decisions

| Question | Decision |
|---|---|
| Where does the API live? | In ComfyUI, as routes of Plenio's extension: `/plenio/api/v1/...` on the running ComfyUI (the place the owner asked for). Any program can make a song with one HTTP request - the player is one client. |
| How does a template become a run? | ComfyUI's backend runs only the *API prompt* (`POST /prompt`); turning a workflow into one is the frontend's work (`graphToPrompt`), which a server has not got. Plenio converts it itself: `plenio.core.workflow_prompt`, pure Python, from the template file and the node definitions of the running ComfyUI (their `input_order`, widgets, DynamicCombo options). It flattens subgraphs (ids `outer:inner`), takes promoted widgets from the subgraph node, leaves out muted nodes and passes bypassed ones through (an input of the output's type), skips frontend-only nodes, and maps `widgets_values` to inputs (seed controls are not sent). Tests compare its prompts with the frontend's own for both templates (fixtures made in a browser with the real frontend). ComfyUI's code is not copied (GPL); the format is the documented workflow JSON. |
| Which templates? | The templates that say so: `extra.plenio_api = {"id", "kind"}`, written by `tools/build_graphs.py` - `yue2-song` (*1 · YuE2 · Song*) and `yue2-cover` (*2 · YuE2 · Cover*). MiniMax is not offered (the owner: YuE2 only). |
| Which fields? | Read from the template at run time, never listed by hand: every widget of every node in the groups up to the brief's (*1 · SONG*; for the cover *1 · SOURCE* and *2 · COVER*), plus the template's switches (*Cover Art*: the nodes marked `plenio_switch: cover`) and its optional nodes (titled *(optional)*: an `enabled` field), plus the Export Release's fields (`release`) and the seeds (`seeds`). A widget added to the brief in a later version is a field of the API at once; a field the template no longer has is refused by name. |
| Stable names | The brief's own fields by their input name (`genre`, `vocals`), its DynamicCombo's inputs by their own (`language` - with the choices they belong to); other nodes `<node>.<input>` with a short name per node type (`writer.model`, `finish.hq_mastering`, `finish.cover_art`, `source.audio`, `excerpt.start_index`); release fields by name (`folder`, `artist`, `album`). Class types and input names change rarely; a renamed input keeps its old name as an alias (`FIELD_ALIASES`). A test pins the fields of the shipped templates: a change of the API's surface is seen and written in the changelog, never by accident. |
| Validation | The API checks every value against the node definition (a choice of the list, a number in range, text not longer than 4000 characters) and says which field and why; ComfyUI's own validation follows (`/prompt`), its node errors are passed on with the field they belong to. Unknown fields are refused, unless `"strict": false` (then they are named in `warnings`). |
| Review stops | Not in v1: the brief's *mode* is fixed to its run-through choice (*new song every run*, *new cover every run*); a request for the review mode is refused (`not_supported`). Ready for later: the job keeps its workflow, the status names a reserved `waiting_for_review`, and the place where a stopped run would show its Song Sheet is written down (§2.7). |
| Seeds | As the frontend does before each run (`seedNode.ts`): every Plenio · Seed set to *new seed* draws one (below 2^32), unless the request gives it (`seeds: {"take": 7}`); a seed control set to *randomize* draws too. The job says which seeds it used. |
| Queueing | Through ComfyUI's own `POST /prompt` on its own address (no copy of its handler, valid for every version Plenio supports), with the workflow as `extra_pnginfo` (the record keeps it: *Open in ComfyUI* works for a party song too) and `extra_data.plenio_api` (template, fields, client). The job's id is ComfyUI's prompt id. |
| The player's queue | Its own, kept in its state folder: the songs wait there and go to ComfyUI one at a time, so a song can be moved, edited and deleted until it starts - ComfyUI's queue cannot reorder. The owner's own runs in ComfyUI are not disturbed: a party song waits behind them. |
| Who may | The admin always; the settings say whether logged-in users and guests may (off by default), how many songs one person may have waiting (3), the longest length offered (*about 4:00*) and whether covers may be made. Guests are the login's guests (the player from the network, without an account) and the party's guests (the phones of Live Play's guest page). |
| Party guests | Their page (the guests' server, `guest.py`) gets *Make your own song*: a page of its own (`/<token>/make/`), built from the same Vue components as the player's form, as a small bundle of its own (`plenio/player/guest_static`) - a phone does not load the whole player. A guest is known by a random cookie (`plenio_maker`). |
| Party folder | Album `Party-Song <date>`, artist `Guest` or the user's name, folder `plenio/Party-Songs-<date>` - set by the player per song (the API's `release` fields). The finished record's folder is read by the library (added by itself when it is outside the library's folders), so Live Play takes the song in as it takes every new song: next, at the end or at random, as set. |
| Shared player | The form, the queue and the settings need the player's server and ComfyUI: none of it is in a shared player (`isPortable`), and the server's answer decides whether the page shows it. |

## 2. The Song API (v1)

Base `http://<comfyui>/plenio/api/v1`. JSON in, JSON out; times are seconds since 1970 (UTC); errors are

```json
{"error": {"code": "invalid_value", "message": "…", "hint": "…", "field": "length"}}
```

with HTTP 400 (`bad_request`, `unknown_template`, `unknown_field`, `invalid_value`, `missing_field`,
`not_supported`, `comfyui_rejected` - ComfyUI's node errors in `details`), 404 (`not_found`), 413 (`too_large`), 415
(`unsupported_media_type`), 503 (`not_ready`).

| Method and path | What it does |
|---|---|
| `GET /` | The API: name, version (`1.0`; a new minor version only adds), Plenio's and ComfyUI's versions, the templates, the paths. |
| `GET /openapi.json` | An OpenAPI 3.1 description, the templates' request schemas included (made from the same field list). |
| `GET /templates` | The templates runnable through the API: id, title, kind (`song`, `cover`), what they need (`source.audio`). |
| `GET /templates/{id}` | The template's fields: id, label, type (`text`, `string`, `integer`, `number`, `boolean`, `choice`), default (the template's value), choices, range, description (the tooltip), the node and group it belongs to, `when` (the choice it depends on), `fixed`; the release fields; the seeds. |
| `GET /briefs?kind=song` | The style templates (id, name, group, fields) and, per field, every value they have - the lists of a simple form. |
| `POST /uploads?name=<file>` | A source recording for a cover (the request body; MP3, FLAC, WAV, OGG, M4A, OPUS; 200 MB at most): saved in ComfyUI's input folder as `plenio-api-<hash>-<name>`; the answer's `name` goes into `source.audio`. |
| `POST /jobs` | Make a song: `{"template", "fields", "release", "seeds", "client", "strict"}` → `201` with the job. An `Idempotency-Key` header makes a repeated request (a retry after a lost answer) return the first job instead of a second song. |
| `GET /jobs/{id}` | The job: `status` (`queued`, `running`, `succeeded`, `failed`, `cancelled`; `waiting_for_review` reserved), its place in ComfyUI's queue, the stage it is in (the template group of the node that runs: *2 · WRITE* … *6 · FINISH*, *COVER ART*), when it was queued, started and finished, the seeds, and when done the result (title, record, files, folder) or the error (message, the node's title). |
| `GET /jobs` | The jobs made through the API that ComfyUI still knows, newest first. |
| `DELETE /jobs/{id}` | Cancel: a waiting job leaves the queue, a running one is interrupted. |
| `GET /queue` | How busy ComfyUI is: the run that runs, how many wait, and how long API runs took lately (for estimates). |

### 2.1 The fields of the shipped templates

*YuE2 · Song* (`yue2-song`): `template`, `description`, `genre`, `mood`, `tempo`, `length`, `vocals` (sung,
sparse vocals, instrumental), `language`, `voice`, `theme` (sung, sparse), `melody`, `lead_instrument`
(instrumental), `key`, `meter`, `arrangement`, `genre_closeness`, `lines_under_singing`, `creativity`,
`lyrics_fidelity`, `mode` (fixed), `writer.model`, `finish.hq_mastering`, `finish.cover_art`.

*YuE2 · Cover* (`yue2-cover`): `source.audio` (required), `excerpt.enabled`, `excerpt.start_index`,
`excerpt.duration`, `writer.model`, `finish.hq_mastering`, `finish.cover_art`, and the Cover Brief's `template`,
`description`, `genre`, `mood`, `vocals` (original lyrics, new lyrics, instrumental) with `language`, `voice`,
`theme`, `phrasing_reference`, `melody`, `lead_instrument`, `harmony`, `title`, `arrangement`,
`song_flow_closeness`, `lyrics_closeness`, `lines_under_singing`, `creativity`, `lyrics_fidelity`, `mode` (fixed).

Release fields (both): `folder`, `naming`, `collision`, `flac`, `mp3`, `wav`, `tags`, `artist`, `album`, `date`,
`track`, `genre`, `comment`, `album_artist`, `composer`, `lyrics`, `sheet_music`, `sheet_music_size`,
`project_in_flac`, `lyrics_srt`, `lyrics_timing`.

### 2.2 How a request becomes a run

1. The template's workflow, copied; the fields checked; a field left out keeps the template's value.
2. The values written into the nodes' `widgets_values`, by the widget layout the node definition gives; a new
   DynamicCombo choice gets its own inputs (and the node's input slots follow, so the workflow in the record opens
   in ComfyUI as it ran). Switches and optional nodes set to run (mode 0) or bypassed (mode 4).
3. The seeds drawn or given.
4. The workflow converted into the API prompt (`workflow_prompt`).
5. Queued by `POST /prompt` with `extra_pnginfo.workflow` and `extra_data.plenio_api`.

### 2.3 Status

From ComfyUI's queue (running, waiting - the place) and history (`status_str`, the `execution_*` messages with
their times, the outputs: Export Release's `plenio_player` names the record). The stage is the group of the
top-level node that runs now (`last_node_id`, `outer:inner` → the outer node's group). Start times ComfyUI keeps
only in its history are noted by the API when it first sees a job run.

### 2.4 When the workflow changes

- A new widget in a song group: a new field, with the template's value as its default - old clients do not send
  it and get what the template does.
- A widget gone: requests naming it are refused (`unknown_field`) - or, with `"strict": false`, run without it.
- A renamed input: `FIELD_ALIASES` maps the old name; the test of the field list fails until the alias is there.
- A node moved to another group, a new template group: the fields follow the groups by themselves.
- A new template: `extra.plenio_api` in `build_graphs.py`, and it is in the API.

### 2.5 Security

The API is part of ComfyUI and as open as ComfyUI is (on 127.0.0.1 by default; the player's network gateway
passes requests on only with its link). Requests that change something are JSON (`application/json`) or, for
uploads, a body with an audio type; uploads go only into the input folder under a name of Plenio's own; no field
names a path; the release folder is relative to the output folder and may not leave it (`..`, absolute paths
refused).

### 2.6 Estimates

`GET /queue` reports how long API runs took (from the history's `execution_start` to `execution_success`) with
their template and length. The player estimates a song as a fixed part and a part per second of music (song: 120 s
+ 3.0 s/s, cover: 180 s + 3.2 s/s of the recording) times a factor per kind that it learns from every song it made
(half the old factor, half the new). Measured on 2026-10-25 on an RTX 5060 Ti (GPU 1, the owner's ComfyUI busy on
GPU 0): four songs of about 1:00 through the API took 416 s (the models loaded for the first time), 357 s, 300 s and
155 s (an instrumental).

### 2.7 Review stops later

A brief in its review mode stops the run at the Song Sheets (the sheet nodes block their outputs until the
documents are approved). A later version can: accept `mode` with the review choice; report the job as
`waiting_for_review` with the sheet's documents and findings (`GET /jobs/{id}/review`), take the approval or the
edited documents (`POST /jobs/{id}/review`) and queue the run again with the sheets' state widgets set - the job
keeps its workflow for that. Nothing in v1's request or answer has to change for it.

## 3. The player's side

`plenio/player/maker.py`:

- **Settings** (`party-songs.json` in the state folder, admin only): on, users, guests, songs per person, the
  longest length, covers.
- **Jobs**: owner (admin, user, guest), the form's values, the source recording (kept in `party-sources/` until
  sent), status (`waiting`, `sending`, `queued`, `running`, `done`, `failed`, `cancelled`), ComfyUI's job id,
  times, stage, result (title, song, cover), error. One worker thread sends the first waiting song when no party
  song is at ComfyUI and follows it; a song ComfyUI forgot (a restart) goes back to the head of the line once.
  Finished songs stay in the list for 12 hours.
- **Order**: one line for everybody. A user or guest moves their songs among their own places in it (nobody
  jumps the line of others); the admin moves any.
- **Estimates**: the length (a cover: the recording's) times the rate, plus the fixed part; the line adds up from
  the song that runs (what is left of its estimate, at least half a minute) - shown as *ready about 21:40*,
  rounded to five minutes.
- **Routes**: `GET /api/make` (may I, the settings, the studio, my songs), `GET /api/make/form` (templates and
  value lists), `POST /api/make/jobs`, `PUT /api/make/jobs/<id>`, `POST /api/make/jobs/<id>/move`,
  `DELETE /api/make/jobs/<id>`, `POST /api/make/sources` (the recording), `PUT /api/make/settings`; the guests'
  server answers the same below its token for the party's guests.

## 4. The page

- **Make a song** in the sidebar (with the number of one's songs in the making) and a page `#/make`: two cards
  at the top - *A new song* and *A cover* (drop the original); *Start from a style* (the templates by group, a
  search, *Surprise me*); *Describe your song*; the fields as lists with *your own…* (typing clears the list's
  choice); for a cover the fields a cover keeps from the original (tempo, length, key, meter) are not asked and
  the vocals are *original lyrics*, *new lyrics* or *instrumental*; the **Generate Song** button.
- **Your songs**: in their order, each with what identifies it (the title when made; the style, length and voice,
  and the start of the description, before), the state - *ready 21:14* with ▶, *being made 3:12* with the stage
  (*writing the lyrics*, *composing*, *singing and playing*, *mastering*, *painting the cover*), *#2 in line ·
  ready about 21:40* - and ↑ ↓, *Edit* (while waiting), ✕.
- The admin sees everybody's songs with their names; Settings has the switches.
- The party's guests: their page shows *Make your own song* when allowed; the form and their songs on a page of
  their own.

## 5. Checked

- The converter's prompts equal the ones ComfyUI's frontend 1.57 makes of both templates - as shipped and with a
  DynamicCombo's new choice, the Cover Art switch off and the optional excerpt on (`tools/frontend_prompts.mjs` wrote
  the fixtures in Edge with the real frontend).
- A party song made through the API on the owner's machine (GPU 1, the real models): its record has the party's
  folder, album and artist, HQ mastering off, a cover, the workflow.
- The whole party in a browser: a guest's phone orders a song, it is made, it joins Live Play by itself and plays; the
  guests' page shows it playing.

## 6. Tests

`tests/unit/test_workflow_prompt.py` (the converter against the frontend's prompts and by construction:
subgraphs, bypass, mute, promoted widgets, DynamicCombo, seed controls), `tests/unit/test_song_api.py` (fields,
values, aliases, seeds, validation, the pinned field list), `tests/unit/test_player_maker.py` (rights, the line,
edit, move, delete, estimates, a fake ComfyUI API end to end, the guests' server), `tests/host/test_song_api.py`
(the routes in a real ComfyUI: the fields, a job queued and validated by ComfyUI, cancelled), frontend tests of the
form's logic; on the owner's machine a party song and a cover made through the API on GPU 1.
