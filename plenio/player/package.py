"""The player with songs, as one HTML file that plays by itself (owner's request 2026-10-16: give your music to
others very easily). Double-click it - no server, no install, no ComfyUI - and it is the Plenio Player with
these songs: the library, the song pages, the karaoke lyrics, the notation following the music, the visuals,
playlists, Live Play; the recipient's playlists and settings are kept in their browser.

Only what is meant for listening goes in: each song as an MP3 of at most 192 kbit/s (never the FLAC, the WAV
or the unmastered take), a small cover, the timed lyrics and the score's notation, its waveform, optionally
the sheet music PDF; no release record, no workflow, no paths of this computer. The page's own code and
style are put into the file; the songs' sound and pictures follow as base64 blocks the page turns into
files when they are needed.
"""

from __future__ import annotations

import base64
import io
import json
import re
import secrets
import threading
import time
from collections.abc import Callable
from fractions import Fraction
from html import escape as html_escape
from pathlib import Path
from typing import Any

from .. import __version__
from .library import Library, Song, song_detail
from .peaks import peaks

PACKAGES_DIR = "packages"
BITRATES = (128, 160, 192)
COVER_SIDE = 512
FORMAT = "plenio.portable/1"
# what a song's page may show of a song; the rest stays on this computer
DETAIL_KEYS = (
    "id", "title", "created", "year", "seconds", "model", "kind", "brief", "genre", "mood", "language", "vocals",
    "instrumental", "arrangement", "template", "style", "lyrics", "loudness", "tags", "plenio", "takes_key",
    "bpm", "score_key", "score_meter", "seeds", "writer", "other", "artist", "album",
    "documents", "lyrics_raw", "notation", "lines", "timing_source", "licences",
)  # fmt: skip
SUMMARY_KEYS = DETAIL_KEYS[: DETAIL_KEYS.index("documents")]


def packages_dir(state_dir: Path) -> Path:
    return state_dir / PACKAGES_DIR


def encode_mp3(audio: Path, bitrate: int, tags: dict[str, str]) -> bytes:
    """The song as an MP3 (44.1 kHz stereo, ``bitrate`` kbit/s, its title and artist in the tags)."""
    import av

    out = io.BytesIO()
    with av.open(str(audio)) as source, av.open(out, "w", format="mp3") as target:
        for key, value in tags.items():
            if value:
                target.metadata[key] = value
        stream = target.add_stream("libmp3lame" if "libmp3lame" in av.codecs_available else "mp3", rate=44100)
        stream.layout = "stereo"
        stream.bit_rate = bitrate * 1000
        fmt = stream.codec_context.format.name if stream.codec_context.format else "s16p"
        resampler = av.AudioResampler(format=fmt, layout="stereo", rate=44100)
        position = 0
        for frame in source.decode(source.streams.audio[0]):
            for piece in resampler.resample(frame):
                piece.pts = position
                piece.time_base = Fraction(1, 44100)
                position += piece.samples
                for packet in stream.encode(piece):
                    target.mux(packet)
        for piece in resampler.resample(None):
            piece.pts = position
            piece.time_base = Fraction(1, 44100)
            position += piece.samples
            for packet in stream.encode(piece):
                target.mux(packet)
        for packet in stream.encode(None):
            target.mux(packet)
    return out.getvalue()


def small_cover(path: Path) -> bytes | None:
    """The cover as a JPEG of at most 512 pixels a side."""
    try:
        from PIL import Image

        with Image.open(path) as source:
            image = source.convert("RGB")
            image.thumbnail((COVER_SIDE, COVER_SIDE))
            out = io.BytesIO()
            image.save(out, "JPEG", quality=85)
            return out.getvalue()
    except Exception:  # noqa: BLE001 - a song without its cover still plays (it gets artwork)
        return None


def _block(kind: str, key: str, data: bytes, mime: str) -> str:
    return f'<script type="text/plain" data-plenio="{kind}" data-id="{key}" data-mime="{mime}">{base64.b64encode(data).decode()}</script>\n'


def _json_script(value: Any) -> str:
    # "</" would end the script element early
    text = json.dumps(value, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    return f'<script type="application/json" id="plenio-portable">{text}</script>\n'


def _page(static: Path) -> tuple[str, str, str]:
    """The built page's head (title, icon), its script and its style."""
    index = (static / "index.html").read_text(encoding="utf-8")
    script = re.search(r'<script type="module"[^>]*src="\./([^"]+)"', index)
    style = re.search(r'<link rel="stylesheet"[^>]*href="\./([^"]+)"', index)
    icon = re.search(r'<link rel="icon"[^>]*>', index)
    if not script or not style:
        raise RuntimeError("the player's page is not built (npm run build:player)")
    js = (static / script.group(1)).read_text(encoding="utf-8").replace("</script", "<\\/script")
    css = (static / style.group(1)).read_text(encoding="utf-8").replace("</style", "<\\/style")
    return icon.group(0) if icon else "", js, css


def tags_of(raw: Any, packed: set[str]) -> dict[str, list[str]]:
    """The listener's tags of the songs packed: short texts, at most 40 a song."""
    if not isinstance(raw, dict):
        return {}
    out: dict[str, list[str]] = {}
    for song_id, tags in raw.items():
        if song_id in packed and isinstance(tags, list):
            kept = [str(t).strip()[:40] for t in tags if isinstance(t, str) and t.strip()][:40]
            if kept:
                out[song_id] = kept
    return out


def file_name(title: str, folder: Path) -> Path:
    stem = re.sub(r'[\s<>:"/\\|?*\x00-\x1f]+', " ", title).strip().rstrip(".")[:80] or "Plenio songs"
    target = folder / f"{stem}.html"
    count = 1
    while target.exists():
        count += 1
        target = folder / f"{stem} {count}.html"
    return target


def build(
    library: Library,
    ids: list[str],
    options: dict[str, Any],
    state_dir: Path,
    progress: Callable[[int, int], None] = lambda done, total: None,
    static: Path | None = None,
) -> Path:
    """Write the portable player with the songs ``ids`` into the packages folder; its path back.

    ``options``: ``title``, ``bitrate`` (128, 160, 192), ``pdf`` (the sheet music), ``settings`` (the
    visuals' and the lyrics' look to start with), ``presets`` (the listener's own visuals: name, text),
    ``playlists`` (``[{"name", "songs"}]``, the songs among those packed), ``tags`` (song id -> the
    listener's tags of it)."""
    from .server import STATIC

    bitrate = int(options.get("bitrate") or 192)
    if bitrate not in BITRATES:
        raise ValueError(f"MP3 at {', '.join(map(str, BITRATES))} kbit/s")
    songs: list[Song] = []
    for song_id in ids:
        song = library.song(song_id)
        if song is None or "audio" not in song.files:
            continue
        songs.append(song)
    if not songs:
        raise ValueError("no songs to pack")
    title = str(options.get("title") or "Plenio songs").strip()[:120] or "Plenio songs"
    cache = state_dir / "cache"
    icon, js, css = _page(static or STATIC)
    summaries: list[dict[str, Any]] = []
    details: dict[str, Any] = {}
    waves: dict[str, Any] = {}
    blocks: list[str] = []
    total = len(songs)
    for done, song in enumerate(songs):
        progress(done, total)
        detail = song_detail(song, cache=cache)
        summary = {k: song.summary[k] for k in SUMMARY_KEYS if k in song.summary}
        artist = str(song.summary.get("artist") or song.summary.get("tags", {}).get("artist") or "")
        mp3 = encode_mp3(
            song.files["audio"], bitrate, {"title": str(summary.get("title") or ""), "artist": artist}
        )
        blocks.append(_block("audio", song.id, mp3, "audio/mpeg"))
        cover = small_cover(song.files["cover"]) if "cover" in song.files else None
        if cover:
            blocks.append(_block("cover", song.id, cover, "image/jpeg"))
        pdf = song.files.get("pdf") if options.get("pdf") else None
        if pdf and pdf.is_file() and pdf.stat().st_size < 8 * 2**20:
            blocks.append(_block("pdf", song.id, pdf.read_bytes(), "application/pdf"))
        level = peaks(song.files["audio"], cache / "peaks")
        if level:
            waves[song.id] = level
        summary["has"] = {
            "audio": True,
            "original": False,
            "cover": bool(cover),
            "pdf": bool(pdf and pdf.is_file()),
            "lines": bool(detail.get("lines")),
            "notes": False,
            "stems": False,
            "timing": bool(song.summary.get("has", {}).get("timing")),
            "score": bool(song.summary.get("has", {}).get("score")),
        }
        summary["folder"] = ""
        summary["file"] = ""
        summaries.append(summary)
        name = f"{summary.get('title') or 'song'}.mp3"
        details[song.id] = {
            **{k: detail[k] for k in DETAIL_KEYS if k in detail},
            "has": summary["has"],
            "files": {
                "audio": name,
                **({"pdf": f"{summary.get('title') or 'song'}.pdf"} if summary["has"]["pdf"] else {}),
            },
            "owned_files": [],
            "retire_to": "",
            "record_path": "",
            "versions": {"plenio": str(song.summary.get("plenio") or "")},
        }
    progress(total, total)
    packed = {s["id"] for s in summaries}
    playlists = [
        {
            "name": str(p.get("name") or "Playlist")[:80],
            "songs": [i for i in p.get("songs") or [] if i in packed],
        }
        for p in options.get("playlists") or []
        if isinstance(p, dict)
    ]
    data = {
        "format": FORMAT,
        "id": secrets.token_hex(6),
        "title": title,
        "created": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "plenio": __version__,
        "bitrate": bitrate,
        "songs": summaries,
        "details": details,
        "peaks": waves,
        "settings": options.get("settings") if isinstance(options.get("settings"), dict) else {},
        "presets": [
            {"name": str(p.get("name")), "text": str(p.get("text")), "mtime": 0}
            for p in options.get("presets") or []
            if isinstance(p, dict) and p.get("name") and p.get("text")
        ],
        "playlists": [p for p in playlists if p["songs"]],
        "tags": tags_of(options.get("tags"), packed),
    }
    safe_title = html_escape(title)
    html = (
        '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8" />\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1" />\n'
        '<meta name="color-scheme" content="dark" />\n'
        f'<meta name="generator" content="Plenio Player {__version__}" />\n'
        f"<title>{safe_title} - Plenio Player</title>\n{icon}\n<style>{css}</style>\n</head>\n<body>\n"
        '<div id="app"></div>\n'
        + _json_script(data)
        + "".join(blocks)
        + f'<script type="module">{js}</script>\n'
        "</body>\n</html>\n"
    )
    folder = packages_dir(state_dir)
    folder.mkdir(parents=True, exist_ok=True)
    target = file_name(title, folder)
    partial = target.with_suffix(".part")
    partial.write_text(html, encoding="utf-8")
    partial.replace(target)
    return target


class PackageJobs:
    """Portable players being made, one thread each, their progress asked for by the page."""

    def __init__(self) -> None:
        self.jobs: dict[str, dict[str, Any]] = {}
        self.lock = threading.Lock()

    def start(self, library: Library, ids: list[str], options: dict[str, Any], state_dir: Path) -> str:
        job = secrets.token_hex(8)
        with self.lock:
            self.jobs[job] = {"state": "working", "done": 0, "total": len(ids)}

        def step(done: int, total: int) -> None:
            with self.lock:
                self.jobs[job].update(done=done, total=total)

        def run() -> None:
            try:
                path = build(library, ids, options, state_dir, step)
                result = {
                    "state": "done",
                    "file": path.name,
                    "size": path.stat().st_size,
                    "folder": str(path.parent),
                }
            except Exception as error:  # noqa: BLE001 - the page shows why
                result = {"state": "error", "error": str(error)}
            with self.lock:
                self.jobs[job].update(result)

        threading.Thread(target=run, daemon=True).start()
        return job

    def status(self, job: str) -> dict[str, Any] | None:
        with self.lock:
            found = self.jobs.get(job)
            return dict(found) if found else None


def listing(state_dir: Path) -> list[dict[str, Any]]:
    folder = packages_dir(state_dir)
    if not folder.is_dir():
        return []
    files = sorted(folder.glob("*.html"), key=lambda p: p.stat().st_mtime, reverse=True)
    return [{"name": p.name, "size": p.stat().st_size, "mtime": p.stat().st_mtime} for p in files]


def package_file(state_dir: Path, name: str) -> Path | None:
    folder = packages_dir(state_dir).resolve()
    candidate = (folder / name).resolve()
    if candidate.parent != folder or candidate.suffix != ".html" or not candidate.is_file():
        return None
    return candidate
