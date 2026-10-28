# The Song API: make songs from other programs

Plenio has an API of its own on the running ComfyUI: a program - the [Plenio Player](player.md#party-songs-guests-make-songs)'s
party songs first, a script, a home-automation scene, a shortcut on a phone - makes a song with **one HTTP request**, the
way you would with the *1 · YuE2 · Song* or *2 · YuE2 · Cover* template, and follows it until it is done. Nobody has to
open ComfyUI.

- **Base address**: `http://127.0.0.1:8188/plenio/api/v1` (ComfyUI's own address and port).
- **JSON** in and out; times are seconds since 1970 (UTC).
- **The fields come from the templates themselves**: what the API offers is read from the template and the node
  definitions of the running ComfyUI every time - a field a later Plenio adds to the brief is in the API at once.
- **A job is a ComfyUI run**: its id is ComfyUI's prompt id, and the song lands where the template exports it.

**For programmers:** the complete guide - quick start in curl, Python and JavaScript, every endpoint, errors, retries, access from other computers, versions - is [docs/api/README.md](../../api/README.md), with every field of the templates ([fields.md](../../api/fields.md)), ready-to-run [examples](../../api/examples/) and the [OpenAPI reference](https://jplenio.github.io/Plenio-Music-Production-System/api/). Design and reasons: [docs/design/party-songs.md](../../design/party-songs.md).

## Quick start

```bash
# what the API runs
curl http://127.0.0.1:8188/plenio/api/v1/templates

# make a song: a style, a few fields, the rest as the template has it
curl -X POST http://127.0.0.1:8188/plenio/api/v1/jobs \
  -H "Content-Type: application/json" \
  -d '{"template": "yue2-song",
       "fields": {"genre": "synthwave", "description": "a night drive through a rainy city",
                  "length": "short (about 1:30)", "vocals": "sung", "language": "English",
                  "finish.cover_art": true},
       "release": {"album": "Night drives", "artist": "Me"}}'

# follow it (the id from the answer)
curl http://127.0.0.1:8188/plenio/api/v1/jobs/<id>
```

The answer of `POST /jobs` (`201`) is the job: `status` `queued`, its place in ComfyUI's queue, the seeds it drew. Ask
`GET /jobs/<id>?wait=30` - it answers as soon as something changes, or after 30 seconds: `running` with the stage it
is in (`"stage": {"group": "5 · RENDER", "text": "singing and playing"}`), then `succeeded` with the result - the
song's title, its release record and its files, each with a `url` to download it - or `failed` with the error and the
node it came from.

## The endpoints

| Method and path | What it does |
|---|---|
| `GET /` | The API: its name and version, Plenio's and ComfyUI's versions, the templates, the paths. |
| `GET /openapi.json` | The API described for programs (OpenAPI 3.1), the templates' fields included. |
| `GET /templates` | The templates the API runs: `yue2-song` and `yue2-cover`, with what they need. |
| `GET /templates/{id}` | A template's fields - each with its type, its default (the template's value), its choices or range, its description and the choice it depends on -, the release fields and the seeds. |
| `GET /briefs?kind=song` | The style templates of the brief (id, name, group, fields) and, per field, every value they have. |
| `POST /uploads?name=<file>` | A source recording for a cover (the request's body: MP3, FLAC, WAV, OGG, M4A, OPUS, AAC, AIFF; up to 200 MB). The answer's `name` goes into the field `source.audio`. |
| `POST /jobs` | Make a song (see below). |
| `POST /from-record` | The request that makes a released song again (see below): a new take of it, or a new song of its brief. The body is the song's release record (`<name>.plenio.json`). |
| `GET /jobs` | The API's jobs ComfyUI still knows, newest first (`?status=`, `?client=`, `?template=`, `?limit=`). |
| `GET /jobs/{id}` | One job; `?wait=<seconds>` (at most 60) answers when it changes. |
| `GET /jobs/{id}/files/{name}` | A file of a finished job's song (its `result.files` list each with its `url`). |
| `DELETE /jobs/{id}` | Cancel it: out of the queue while it waits, interrupted while it runs. |
| `GET /queue` | How busy ComfyUI is, and how long the API's runs took lately. |

## A job request

```json
{
  "template": "yue2-song",
  "fields": {"template": "pop/art-pop-vocal", "genre": "art pop", "vocals": "sung", "theme": "dreams"},
  "release": {"folder": "plenio/My-Songs", "album": "Dreams", "artist": "Anna"},
  "seeds": {"take": 1234},
  "client": {"name": "My script"},
  "strict": true
}
```

- **`fields`** - the song part of the template: every input of the groups up to the brief's (*1 · SONG*; for the cover
  *1 · SOURCE* and *2 · COVER*). The brief's fields by their name: `template`, `description`, `genre`, `mood`, `tempo`,
  `length`, `vocals`, `language`, `voice`, `theme`, `melody`, `lead_instrument`, `key`, `meter`, `arrangement`,
  `creativity`, `lyrics_fidelity` …; the other nodes' as `<node>.<input>`: `writer.model`, `finish.hq_mastering`,
  `finish.cover_art` (the Cover Art switch), for the cover `source.audio` and the optional excerpt `excerpt.enabled`,
  `excerpt.start_index`, `excerpt.duration`. A field you leave out keeps the template's value. `length` also takes
  seconds (`200`) or a time (`"3:15"`): the nearest length.
- **`release`** - the Export Release's fields: `folder` (below ComfyUI's output folder), `naming`, `artist`, `album`,
  `date`, `genre`, `comment`, `mp3`, `sheet_music` …
- **`seeds`** - a seed per part (`draft`, `plan`, `arrangement`, `take`, `cover`): the same seeds and fields make the
  same song. A seed you leave out is drawn anew, as the template's *new seed* switch does.
- **`documents`** - the Song Sheets' documents (`title`, `style`, `lyrics`, `score`, `artwork_prompt`, as
  `GET /templates/{id}` lists them under `documents`): a document you give goes into its sheet as **manual**, so the
  run keeps it instead of writing or planning it anew. The documents of a song, with `take` left out of the seeds,
  make a new take of that song (see *Again: a new take* below). A document the template does not keep is refused
  (`unknown_field`) - or left out with `"strict": false`.
- **`client`** - who asks: kept with the job and shown in its listing.
- **`strict`** - `false` leaves out fields the template does not have (named in the job's `warnings`) instead of
  refusing the request. A field that does not apply to the choices made - a voice for an instrumental - is left out
  with a warning either way.
- **`Idempotency-Key`** (a header): the same key again returns the first job instead of making a second song - for a
  program that repeats a request whose answer it lost.

## Again: a new take, a new song of the same brief

`POST /from-record` turns a song's **release record** - the `<name>.plenio.json` Export Release writes next to the
song - back into a request, so that a program can make the song again without knowing its fields:

```bash
curl -X POST http://127.0.0.1:8188/plenio/api/v1/from-record \
  -H "Content-Type: application/json" \
  --data-binary @"Night Drive.plenio.json"
```

The answer is the request the record's song was made with - its `template`, `fields`, `release`, `seeds` and
`documents` - plus what the API can tell about it:

```json
{"template": "yue2-song", "kind": "song", "title": "Night Drive", "model": "YuE2",
 "fields": {"genre": "synthwave", "length": "short (about 1:30)", "vocals": "sung"},
 "release": {"folder": "plenio/Party-Songs-2026-10-25", "album": "Party-Song 2026-10-25"},
 "seeds": {"draft": 11, "plan": 12, "take": 13, "cover": 14},
 "documents": {"title": "Night Drive", "style": "synthwave …", "lyrics": "[verse] …", "score": "X:1 …"},
 "take": {"possible": true, "why": ""}, "warnings": []}
```

What you make of it:

- **The same song again**: send the answer to `POST /jobs` as it is - the same fields, seeds and documents.
- **A new take of it**: send it without `seeds.take`. The take seed is drawn anew, so the song is sung and played
  again with the same title, words and notes; change a document (or leave one out) to make a new take with other
  words or another style. Changed lyrics need new notes: leave the `score` out when you change the `lyrics`.
- **A new song of its brief**: send only `template`, `fields` and `release` - no documents, no seeds. The writer and
  the plan work as they do for any new song.

`take.possible` says whether the record's documents make a new take here, with the reason when they do not: the
song was made with another music model (a new take is YuE2's), its record has no score or no lyrics, or - for a
cover - its original recording is no longer in ComfyUI's input folder. A value the template no longer takes is left
out and named in `warnings`. The route reads nothing but the record in its body.

A cover's record names its original recording (`fields["source.audio"]`, a file in ComfyUI's input folder); a new
take of a cover needs that file to still be there. To make a cover of a song whose recording has other formats,
upload it with `POST /uploads` first and put the answer's `name` into `source.audio`.

## Errors

```json
{"error": {"code": "invalid_value", "message": "'rap' is not a choice of the field 'vocals'.",
           "hint": "Choices: ['sung', 'sparse vocals', 'instrumental']", "field": "vocals"}}
```

`400` with `bad_request`, `unknown_template`, `unknown_field`, `invalid_value`, `missing_field` (a cover without its
recording), `not_supported` or `comfyui_rejected` (ComfyUI's own check refused the run - `details` names the nodes and
why, usually a model file that is missing); `404` `not_found`; `413` `too_large`; `415` `unsupported_media_type`; `503`
`not_ready`.

## Stable across versions

- The path carries the version (`/v1`); a new minor version (`1.1`) only adds - fields, paths, values. A change that
  would break a program gets a new path.
- The fields are named after the node types and their inputs, not after titles; when a later version renames an
  input, the old name keeps working (the template's `aliases`).
- A field the template no longer has is refused by name (`unknown_field`) - or left out with `"strict": false`.

## Not yet: review stops

The templates can stop at the Song Sheets so you can check and edit the lyrics and the score. The API runs straight
through: the brief's *mode* is fixed to *new song every run* (or *new cover every run*), and asking for the review mode
is refused (`not_supported`). The job's status has a reserved value `waiting_for_review` for a later version that shows
a stopped run's Song Sheet and takes its approval.

## Security

The API is as open as your ComfyUI: on `127.0.0.1` only this computer reaches it (ComfyUI's default). Changes are
JSON requests (or an upload with an audio type); an upload goes only into ComfyUI's input folder, under a name of
Plenio's own; the release folder may not leave the output folder.
