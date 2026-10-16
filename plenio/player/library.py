"""The songs of Plenio output folders, for the Plenio Player (owner's request 2026-10-15): every release record
(``<name>.plenio.json``) with its files, the facts the library shows and searches, and - for one song - its
documents, the notation and the times its lyrics are sung.

Pure Python and ``plenio.core``. It reads the folders and writes there only when the listener removes a
song (owner's request 2026-10-16): its files go to the retired songs (``_retired`` in the library folder,
which the library does not read) or are deleted for good. A folder can also take other music, audio files
not from Plenio (``plenio.player.other``): songs of their own, marked so, with what their files have.
"""

from __future__ import annotations

import functools
import hashlib
import json
import os
import re
import shutil
import threading
import time
from collections.abc import Callable, Iterable, Mapping, Sequence
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from ..core import subtitles as subtitle_rules
from . import other as other_music

RECORD_SUFFIX = ".plenio.json"
CACHE_VERSION = 4
RETIRED_DIR = "_retired"
"""Where removed songs go, below the library folder they were in; the library does not read it."""
SKIP_DIRS = {".plenio-player", "__pycache__", ".git", RETIRED_DIR}
AUDIO_KINDS = ("flac", "mp3", "wav")
ENGINE_NAMES = {"yue2": "YuE2", "minimax_music3": "MiniMax Music 3", "minimax": "MiniMax Music 3"}
RESOURCES = Path(__file__).resolve().parents[2] / "resources"
SEED_TITLES = {"take seed": "take", "draft seed": "draft", "arrangement seed": "arrangement"}
_SRT_TIME = re.compile(r"(\d+):(\d+):(\d+)[,.](\d+)\s*-->\s*(\d+):(\d+):(\d+)[,.](\d+)")


def _appeared(stat: os.stat_result) -> float:
    """When a file appeared here: written (mtime) or, for a file copied or moved in with its old time, put
    here (ctime: its creation on Windows, its last change of place elsewhere)."""
    return max(stat.st_mtime, stat.st_ctime)


def song_id(path: Path, root: Path) -> str:
    """A short id that stays the same while the record stays where it is."""
    rel = path.relative_to(root).as_posix() if path.is_relative_to(root) else path.as_posix()
    return hashlib.sha1(f"{root.as_posix()}|{rel}".encode()).hexdigest()[:12]


def _text(value: Any) -> str:
    return "" if value is None else str(value).strip()


def _brief_node(prompt: Mapping[str, Any]) -> tuple[str, dict[str, Any]]:
    for node in prompt.values():
        if isinstance(node, Mapping) and node.get("class_type") in ("PlenioSongBrief", "PlenioCoverBrief"):
            return str(node["class_type"]), dict(node.get("inputs") or {})
    return "", {}


_TEMPLATES: dict[str, dict[str, str]] | None = None


def template_fields(template_id: str) -> dict[str, str]:
    """The fields of a shipped brief template (empty when unknown): they fill what the brief left empty."""
    global _TEMPLATES
    if _TEMPLATES is None:
        _TEMPLATES = {}
        try:
            from ..core.brief import TemplateLibrary

            library = TemplateLibrary(RESOURCES / "templates")
            for template in library._load().values():  # noqa: SLF001 - the library's own reader
                _TEMPLATES[template.id] = dict(template.fields)
        except Exception:  # noqa: BLE001 - the player works without templates
            _TEMPLATES = {}
    return _TEMPLATES.get(template_id, {})


def brief_facts(prompt: Mapping[str, Any]) -> dict[str, Any]:
    """The brief as the song was made: typed values, the template's where a text field was empty."""
    kind, inputs = _brief_node(prompt)
    if not kind:
        return {}
    template = _text(inputs.get("template"))
    filled = template_fields(template) if template and template != "none" else {}

    def field_value(name: str, key: str | None = None) -> str:
        return _text(inputs.get(key or name)) or _text(filled.get(name))

    vocals = _text(inputs.get("vocals")) or _text(filled.get("vocals"))
    facts: dict[str, Any] = {
        "kind": "cover" if kind == "PlenioCoverBrief" else "song",
        "mode": _text(inputs.get("mode")),
        "template": "" if template == "none" else template,
        "description": field_value("description"),
        "genre": field_value("genre"),
        "mood": field_value("mood"),
        "tempo": field_value("tempo"),
        "length": _text(inputs.get("length")),
        "vocals": vocals,
        "language": field_value("language", "vocals.language"),
        "voice": field_value("voice", "vocals.voice"),
        "theme": field_value("theme", "vocals.theme"),
        "lead_instrument": field_value("lead_instrument", "vocals.lead_instrument"),
        "key": field_value("key"),
        "meter": field_value("meter"),
        "arrangement": _text(inputs.get("arrangement")) or "off",
        "harmony": _text(inputs.get("harmony")),
        "closeness": inputs.get("genre_closeness", inputs.get("song_flow_closeness")),
    }
    return facts


def prompt_facts(prompt: Mapping[str, Any]) -> dict[str, Any]:
    """The seeds of the template's seed nodes and the writer model."""
    seeds: dict[str, int] = {}
    writer = ""
    for node in prompt.values():
        if not isinstance(node, Mapping):
            continue
        inputs = node.get("inputs") or {}
        title = _text((node.get("_meta") or {}).get("title")).lower()
        if node.get("class_type") in ("PlenioSeed", "SeedNode") and title in SEED_TITLES:
            seed = inputs.get("seed")
            if isinstance(seed, int) and not isinstance(seed, bool):
                seeds.setdefault(SEED_TITLES[title], seed)
        if (
            node.get("class_type") == "PlenioWriterChoice"
            and isinstance(inputs.get("model"), str)
            and not writer
        ):
            writer = (
                Path(inputs["model"].replace("\\", "/"))
                .name.removesuffix(".safetensors")
                .removesuffix(".gguf")
            )
    return {"seeds": seeds, "writer": writer}


def score_facts(score: str) -> dict[str, Any]:
    """Tempo, key and meter from a score's header (cheap: the library has hundreds of songs)."""
    if not score.strip():
        return {}
    tempo = re.search(r"^Q:\s*(?:\d+/\d+=)?(\d+)", score, re.M)
    key = re.search(r"^K:\s*([^\s%]+)", score, re.M)
    meter = re.search(r"^M:\s*([^\s%]+)", score, re.M)
    return {
        "bpm": int(tempo.group(1)) if tempo else None,
        "score_key": key.group(1) if key else "",
        "score_meter": meter.group(1) if meter else "",
    }


def _engine(record: Mapping[str, Any]) -> str:
    for report in record.get("reports") or []:
        engine = (report.get("data") or {}).get("engine")
        if engine:
            return ENGINE_NAMES.get(str(engine), str(engine))
    return ""


def parse_srt(text: str) -> list[dict[str, Any]]:
    """The cues of an SRT file: ``start``, ``end`` and ``text``."""
    cues = []
    for block in re.split(r"\n\s*\n", text.replace("\r\n", "\n").strip()):
        lines = block.split("\n")
        for k, line in enumerate(lines):
            match = _SRT_TIME.search(line)
            if match:
                g = [int(x) for x in match.groups()]
                start = g[0] * 3600 + g[1] * 60 + g[2] + g[3] / 1000
                end = g[4] * 3600 + g[5] * 60 + g[6] + g[7] / 1000
                cues.append({"start": start, "end": end, "text": "\n".join(lines[k + 1 :]).strip()})
                break
    return cues


@dataclass
class Song:
    """A song of the library. ``record`` is its release record - for other music (``other``) its audio file."""

    id: str
    record: Path
    root: Path
    summary: dict[str, Any]
    files: dict[str, Path] = field(default_factory=dict)
    other: bool = False


def _files(record: Mapping[str, Any], path: Path) -> dict[str, Path]:
    """The song's files by kind (audio, original, cover, pdf, lines, notes, stems), found next to the record."""
    folder = path.parent
    stem = path.name.removesuffix(RECORD_SUFFIX)
    found: dict[str, Path] = {}
    for entry in record.get("files") or []:
        name = _text(entry.get("name"))
        if not name:
            continue
        candidate = folder / name
        role = entry.get("role")
        if role == "original":
            found.setdefault("original", candidate)
        elif role == "cover":
            found.setdefault("cover", candidate)
        elif role == "sheet_music":
            found.setdefault("pdf", candidate)
        elif role == "subtitles":
            found.setdefault(str(entry.get("subtitles") or "lines"), candidate)
        elif role == "stem":
            found.setdefault("stems", candidate.parent)
        elif role is None and entry.get("format") in AUDIO_KINDS and " take " not in name:
            found.setdefault(f"audio_{entry['format']}", candidate)
    # files written next to the record without an entry (or a record moved with its files)
    guesses = {
        "audio_flac": f"{stem}.flac",
        "audio_mp3": f"{stem}.mp3",
        "audio_wav": f"{stem}.wav",
        "original": f"{stem} (original).flac",
        "cover": f"{stem}.jpg",
        "pdf": f"{stem}.pdf",
        "lines": f"{stem} (lines).srt",
        "notes": f"{stem} (notes).srt",
    }
    for kind, name in guesses.items():
        if kind not in found or not found[kind].exists():
            if (folder / name).exists():
                found[kind] = folder / name
    sheet = record.get("sheet_music") or {}
    if "pdf" not in found and sheet.get("file") and (folder / str(sheet["file"])).exists():
        found["pdf"] = folder / str(sheet["file"])
    inside = folder.resolve()
    files = {
        kind: p
        for kind, p in found.items()
        if p.exists() and (p.resolve() == inside or inside in p.resolve().parents)
    }
    for kind in ("audio_flac", "audio_mp3", "audio_wav"):
        if kind in files:
            files.setdefault("audio", files[kind])
    files["record"] = path
    return files


def summarize(record: Mapping[str, Any], path: Path, root: Path) -> Song:
    """A song of the library from its record: what the list shows, sorts and searches."""
    documents = record.get("documents") or {}

    def doc(kind: str) -> str:
        entry = documents.get(kind)
        return _text(entry.get("text")) if isinstance(entry, Mapping) else ""

    prompt = record.get("prompt") or {}
    audio = record.get("audio") or {}
    loudness = (audio.get("loudness") or [{}])[0] or {}
    tags = dict(audio.get("tags") or {})
    brief = brief_facts(prompt)
    files = _files(record, path)
    lyrics = doc("lyrics")
    created = _text(record.get("created"))
    title = _text(record.get("title")) or doc("title") or path.name.removesuffix(RECORD_SUFFIX)
    lyrics_sha = (
        (documents.get("lyrics") or {}).get("sha256", "")
        if isinstance(documents.get("lyrics"), Mapping)
        else ""
    )
    score_sha = (
        (documents.get("score") or {}).get("sha256", "")
        if isinstance(documents.get("score"), Mapping)
        else ""
    )
    model = _engine(record)
    summary: dict[str, Any] = {
        "title": title,
        "created": created,
        "year": created[:4],
        "seconds": float(audio.get("seconds") or 0.0),
        "model": model,
        "kind": brief.get("kind") or ("master" if not model else "song"),
        "brief": brief,
        "genre": brief.get("genre") or _text(tags.get("genre")),
        "mood": brief.get("mood", ""),
        "language": brief.get("language", ""),
        "vocals": brief.get("vocals", ""),
        "instrumental": brief.get("vocals") == "instrumental",
        "arrangement": brief.get("arrangement", "off"),
        "template": brief.get("template", ""),
        "style": doc("style"),
        "lyrics": subtitle_rules.plain_lyrics(lyrics) if lyrics else "",
        "loudness": {
            "lufs": loudness.get("integrated_lufs"),
            "true_peak": loudness.get("true_peak_dbtp"),
            "range": loudness.get("loudness_range_lu"),
        },
        "tags": {k: v for k, v in tags.items() if k != "lyrics"},
        "plenio": _text((record.get("versions") or {}).get("plenio")),
        "folder": path.parent.relative_to(root).as_posix() if path.parent.is_relative_to(root) else "",
        "file": path.name.removesuffix(RECORD_SUFFIX),
        "takes_key": hashlib.sha1(f"{title.lower()}|{lyrics_sha}|{score_sha}".encode()).hexdigest()[:10]
        if (lyrics_sha or score_sha)
        else "",
        "has": {
            "audio": "audio" in files,
            "original": "original" in files,
            "cover": "cover" in files,
            "pdf": "pdf" in files,
            "lines": "lines" in files,
            "notes": "notes" in files,
            "stems": "stems" in files,
            "timing": bool(record.get("timing")),
            "score": bool(doc("score")),
        },
        **score_facts(doc("score")),
        **prompt_facts(prompt),
    }
    song = Song(song_id(path, root), path, root, summary, files)
    summary["id"] = song.id
    return song


def other_detail(song: Song) -> dict[str, Any]:
    """The page of a song not from Plenio: its tags, its lyrics, timed lines from its ``.lrc``/``.srt``."""
    lines = other_music.timed_lines(song.files)
    return {
        **song.summary,
        "documents": {
            "title": str(song.summary.get("title") or ""),
            "lyrics": str(song.summary.get("lyrics") or ""),
        },
        "lyrics_raw": "",
        "notation": {},
        "lines": lines,
        "timing_source": song.files["lines"].suffix.lstrip(".") if lines else "",
        "files": {kind: path.name for kind, path in song.files.items()},
        "owned_files": [
            path.relative_to(song.record.parent.resolve()).as_posix() for path in owned_files(song)
        ],
        "retire_to": str(retired_folder(song)),
        "record_path": "",
        "file_path": str(song.record),
        "licences": [],
        "versions": {},
    }


def song_detail(song: Song, cache: Path | None = None) -> dict[str, Any]:
    """Everything the song's page needs: the documents, the notation, the times, the files. With ``cache``,
    a song without measured times gets the score's place in its recording estimated (``plenio.player.align``),
    so that its notation follows the music."""
    if song.other:
        return other_detail(song)
    record = json.loads(song.record.read_text(encoding="utf-8"))
    documents = record.get("documents") or {}

    def doc(kind: str) -> str:
        entry = documents.get(kind)
        return str(entry.get("text") or "") if isinstance(entry, Mapping) else ""

    score, lyrics = doc("score"), doc("lyrics")
    notation: dict[str, Any] = {}
    if score.strip():
        try:
            from ..core.score import canonical, editor_view

            view = editor_view(score, lyrics or None, _spans(record) or None)
            notation["abc"] = str(view.get("display_abc") or "")
            parsed = canonical.from_abc(score)
            starts = parsed.starts
            notation["tempo"] = parsed.tempo
            notation["sections"] = [
                {
                    "label": section.label,
                    "start": round(parsed.seconds(starts[section.measure]), 3),
                    "bar": section.measure + 1,
                }
                for section in parsed.sections
            ]
            notation["seconds"] = round(parsed.seconds(parsed.total), 3)
        except Exception as error:  # noqa: BLE001 - a song without notation still plays
            notation["error"] = str(error)
    timing = record.get("timing") or []
    lines: list[dict[str, Any]] = []
    source = ""
    if timing:
        first = timing[0]
        lines, source = list(first.get("lines") or []), str(first.get("timing") or "measured")
        notation["warp"] = first.get("warp")
    elif "lines" in song.files:
        cues = parse_srt(song.files["lines"].read_text(encoding="utf-8", errors="replace"))
        notes = (
            parse_srt(song.files["notes"].read_text(encoding="utf-8", errors="replace"))
            if "notes" in song.files
            else []
        )
        lines = [_line_from_cues(cue, notes) for cue in cues]
        source = "subtitles"
    if not timing and notation.get("abc") and cache is not None and "audio" in song.files:
        from .align import cached_estimate

        found = cached_estimate(song.files["audio"], score, cache)
        if found:
            notation["warp"] = found["warp"]
            notation["anchors"] = found["anchors"]
            notation["estimated"] = True
    return {
        **song.summary,
        "documents": {kind: doc(kind) for kind in ("title", "style", "lyrics", "artwork_prompt")},
        "lyrics_raw": lyrics,
        "notation": notation,
        "lines": lines,
        "timing_source": source,
        "files": {kind: path.name for kind, path in song.files.items() if kind != "stems"},
        "owned_files": [
            path.relative_to(song.record.parent.resolve()).as_posix() for path in owned_files(song)
        ],
        "retire_to": str(retired_folder(song)),
        "record_path": str(song.record),
        "licences": record.get("licences") or [],
        "versions": record.get("versions") or {},
    }


def _line_from_cues(cue: Mapping[str, Any], notes: Sequence[Mapping[str, Any]]) -> dict[str, Any]:
    """A timed line from an SRT pair: the notes file's cues inside the line give its units (by the length of
    the text they show)."""
    text = str(cue["text"]).replace("\n", " ")
    units = []
    for note in notes:
        if cue["start"] - 0.01 <= note["start"] < cue["end"] - 0.005:
            shown = str(note["text"]).replace("\n", " ")
            if text.startswith(shown.rstrip()):
                units.append([note["start"], len(shown)])
    return {
        "text": text,
        "start": cue["start"],
        "end": cue["end"],
        "units": units or [[cue["start"], len(text)]],
    }


def owned_files(song: Song) -> list[Path]:
    """Every file of the song in its record's folder: the record, the files it lists (the audio of every take,
    the unmastered take, the cover, the sheet music, the subtitles, the stems) and the files Export Release
    names after it. Nothing outside the record's folder. Other music: the audio and its own lyrics and cover."""
    if song.other:
        return other_music.owned(song.record, song.files)
    folder = song.record.parent.resolve()
    record = json.loads(song.record.read_text(encoding="utf-8"))
    candidates = [song.record]
    for entry in record.get("files") or []:
        name = _text(entry.get("name")) if isinstance(entry, Mapping) else ""
        if name:
            candidates.append(song.record.parent / name)
    candidates.extend(path for kind, path in song.files.items() if kind != "stems")
    found: list[Path] = []
    seen: set[Path] = set()
    for path in candidates:
        resolved = path.resolve()
        if resolved in seen or not resolved.is_file() or folder not in resolved.parents:
            continue
        seen.add(resolved)
        found.append(resolved)
    return found


def retired_folder(song: Song) -> Path:
    """Where the song's files go when it is retired: ``_retired`` below its library folder, in the same
    subfolders as before (``output/plenio/x`` -> ``output/_retired/plenio/x``)."""
    folder = song.record.parent.resolve()
    root = song.root.resolve()
    relative = folder.relative_to(root) if folder.is_relative_to(root) else Path(folder.name)
    return root / RETIRED_DIR / relative


def _retrying(action: Callable[[], object]) -> None:
    # the server may be reading the file for the browser at this moment, and Windows refuses then
    for attempt in range(8):
        try:
            action()
            return
        except PermissionError:
            if attempt == 7:
                raise
            time.sleep(0.25)


def remove_song(song: Song, action: str) -> dict[str, Any]:
    """Retire the song (``retire``: its files moved to :func:`retired_folder`, subfolders kept) or delete its
    files for good (``delete``). Empty subfolders the song leaves behind (its stems) go too."""
    if action not in ("retire", "delete"):
        raise ValueError(f"unknown action {action!r}")
    folder = song.record.parent.resolve()
    files = owned_files(song)
    target = retired_folder(song)
    if action == "retire" and any((target / f.relative_to(folder)).exists() for f in files):
        # a song of the same name was retired before: this one gets a folder of its own
        target = target / time.strftime("%Y-%m-%d %H%M%S")
    done: list[str] = []
    for path in files:
        relative = path.relative_to(folder)
        if action == "retire":
            destination = target / relative
            destination.parent.mkdir(parents=True, exist_ok=True)
            _retrying(functools.partial(shutil.move, str(path), str(destination)))
        else:
            _retrying(path.unlink)
        done.append(relative.as_posix())
    for parent in sorted({p.parent for p in files if p.parent != folder}, key=lambda p: -len(p.parts)):
        try:
            parent.rmdir()  # only when empty
        except OSError:
            pass
    return {"action": action, "files": done, "folder": str(target) if action == "retire" else None}


def _spans(record: Mapping[str, Any]) -> list[list[int]]:
    """The lyrics lines placed by hand on the score's Song Sheet (kept in the workflow the song was made with)."""
    workflow = record.get("workflow") or {}
    sheets = [
        str((report.get("data") or {}).get("node_id"))
        for report in record.get("reports") or []
        if report.get("kind") == "song_sheet" and (report.get("data") or {}).get("documents", {}).get("score")
    ]
    nodes = {str(n.get("id")): n for n in workflow.get("nodes") or [] if isinstance(n, Mapping)}
    for sheet in sheets:
        spans = ((nodes.get(sheet) or {}).get("properties") or {}).get("plenio_lyric_spans")
        if isinstance(spans, list) and spans:
            return [list(map(int, s)) for s in spans if isinstance(s, list) and len(s) >= 2]
    return []


class Library:
    """The songs below ``folders``; summaries cached on disk by the record's size and time. In the folders of
    ``other``, audio files that no record owns are songs too."""

    def __init__(self, folders: Iterable[Path], cache: Path | None = None, other: Iterable[Path] = ()):
        self.folders = [Path(f).resolve() for f in folders]
        self.other = {Path(f).resolve() for f in other}
        # the folders it started with (--folder, the default): back to them when Settings forgets its own
        self.started_with = list(self.folders)
        self.cache_path = cache
        self._lock = threading.Lock()
        self._songs: dict[str, Song] = {}
        self._cache: dict[str, Any] = {}
        self._scanned = 0.0
        # when each song appeared (its record's or file's time), and the wall clock at the last scan's start
        self._appeared: dict[str, float] = {}
        self.scan_started = 0.0
        self.errors: list[str] = []
        if cache and cache.exists():
            try:
                data = json.loads(cache.read_text(encoding="utf-8"))
                if data.get("version") == CACHE_VERSION:
                    self._cache = data.get("songs") or {}
            except (OSError, ValueError):
                self._cache = {}

    def set_folders(self, folders: Iterable[Path], other: Iterable[Path] = ()) -> None:
        """Read other folders from now on (chosen in Settings)."""
        with self._lock:
            self.folders = [Path(f).resolve() for f in folders]
            self.other = {Path(f).resolve() for f in other}
        self.scan(force=True)

    def _records(self) -> Iterable[tuple[Path, Path]]:
        for root in self.folders:
            if not root.exists():
                continue
            for path in sorted(root.rglob(f"*{RECORD_SUFFIX}")):
                if not SKIP_DIRS.intersection(path.relative_to(root).parts):
                    yield root, path

    def _other_files(self, songs: Iterable[Song]) -> Iterable[tuple[Path, Path]]:
        """The audio files of the folders with other music that no Plenio song owns."""
        roots = [root for root in self.folders if root in self.other and root.exists()]
        if not roots:
            return
        owned, stems = other_music.plenio_owned(songs)
        seen: set[Path] = set()
        for root in roots:
            for path in sorted(root.rglob("*")):
                if path.suffix.lower() not in other_music.AUDIO_SUFFIXES or not path.is_file():
                    continue
                relative = path.relative_to(root).parts
                if SKIP_DIRS.intersection(relative) or path.resolve() in seen:
                    continue
                seen.add(path.resolve())
                if not other_music.is_plenio_file(path, owned, stems):
                    yield root, path

    def scan(self, *, force: bool = False, every: float = 15.0) -> None:
        """Read the records again (at most every ``every`` seconds unless ``force``); unchanged ones come
        from the cache."""
        with self._lock:
            if not force and time.monotonic() - self._scanned < every:
                return
            started = time.time()
            appeared: dict[str, float] = {}
            songs: dict[str, Song] = {}
            cache: dict[str, Any] = {}
            errors: list[str] = []
            for root, path in self._records():
                stat = path.stat()
                key = path.as_posix()
                stamp = [stat.st_size, int(stat.st_mtime)]
                cached = self._cache.get(key)
                try:
                    if cached and cached.get("stamp") == stamp:
                        song = Song(cached["summary"]["id"], path, root, cached["summary"])
                        song.files = {k: Path(v) for k, v in cached["files"].items()}
                    else:
                        record = json.loads(path.read_text(encoding="utf-8"))
                        song = summarize(record, path, root)
                    songs[song.id] = song
                    appeared[song.id] = _appeared(stat)
                    cache[key] = {
                        "stamp": stamp,
                        "summary": song.summary,
                        "files": {k: str(v) for k, v in song.files.items()},
                    }
                except (OSError, ValueError, KeyError, TypeError) as error:
                    errors.append(f"{path.name}: {error}")
            for root, path in self._other_files(list(songs.values())):
                try:
                    stat = path.stat()
                    key = path.as_posix()
                    stamp = [stat.st_size, int(stat.st_mtime)]
                    cached = self._cache.get(key)
                    if cached and cached.get("stamp") == stamp and cached.get("other"):
                        summary = cached["summary"]
                        files = {k: Path(v) for k, v in cached["files"].items()}
                    else:
                        summary, files = other_music.summarize_other(path, root, song_id(path, root))
                    song = Song(summary["id"], path, root, summary, files, other=True)
                    songs[song.id] = song
                    appeared[song.id] = _appeared(stat)
                    cache[key] = {
                        "stamp": stamp,
                        "other": True,
                        "summary": summary,
                        "files": {k: str(v) for k, v in files.items()},
                    }
                except (OSError, ValueError, KeyError, TypeError) as error:
                    errors.append(f"{path.name}: {error}")
            self._songs, self._cache, self.errors = songs, cache, errors
            self._appeared = appeared
            self.scan_started = started
            self._scanned = time.monotonic()
            if self.cache_path:
                try:
                    self.cache_path.parent.mkdir(parents=True, exist_ok=True)
                    temp = self.cache_path.with_suffix(".tmp")
                    temp.write_text(json.dumps({"version": CACHE_VERSION, "songs": cache}), encoding="utf-8")
                    temp.replace(self.cache_path)
                except OSError:
                    pass

    def newer(self, since: float) -> list[dict[str, Any]]:
        """The songs that appeared after ``since`` (the wall clock, as :attr:`scan_started` gives it), oldest
        first - for Live Play, which adds the songs ComfyUI makes while the music plays."""
        found = [
            (at, self._songs[i].summary)
            for i, at in self._appeared.items()
            if at > since and i in self._songs
        ]
        return [summary for _, summary in sorted(found, key=lambda x: x[0])]

    def counts(self) -> dict[Path, list[int]]:
        """Per folder: its Plenio songs and its other music."""
        self.scan()
        found: dict[Path, list[int]] = {root: [0, 0] for root in self.folders}
        for song in self._songs.values():
            found.setdefault(song.root, [0, 0])[1 if song.other else 0] += 1
        return found

    def songs(self) -> list[dict[str, Any]]:
        self.scan()
        return sorted(
            (s.summary for s in self._songs.values()), key=lambda s: s.get("created", ""), reverse=True
        )

    def song(self, song_id: str) -> Song | None:
        self.scan()
        return self._songs.get(song_id)

    def remove(self, song_id: str, action: str) -> dict[str, Any] | None:
        """Retire or delete a song (:func:`remove_song`) and read the folders again; ``None``: no such song."""
        song = self.song(song_id)
        if song is None:
            return None
        try:
            return remove_song(song, action)
        finally:
            self.scan(force=True)
