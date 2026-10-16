"""The Plenio Player's local web server: the player page, the library as JSON, the songs' files (with byte
ranges, so the audio seeks) and the listener's own state (playlists, favourites, plays).

Standard library only. It serves the files of the songs it found and nothing else, and listens on
127.0.0.1 unless told otherwise.
"""

from __future__ import annotations

import json
import mimetypes
import os
import re
import threading
import urllib.request
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, quote, unquote, urlparse

from .. import __version__
from . import folders as folder_choice
from . import other as other_music
from .library import RETIRED_DIR, Library, song_detail
from .package import PackageJobs, package_file, packages_dir
from .package import listing as package_listing
from .peaks import peaks
from .video import VideoJobs, videos_dir
from .visuals import list_presets, open_folder, save_copy, visuals_dir

STATIC = Path(__file__).resolve().parent / "static"
MEDIA_KINDS = {
    "audio",
    "original",
    "cover",
    "pdf",
    "lines",
    "notes",
    "record",
    "audio_flac",
    "audio_mp3",
    "audio_wav",
}
STATE_LIMIT = 4 * 2**20
NEW_SONGS_EVERY = 2.0
VIDEO_FPS = (24, 25, 30, 50, 60)
VIDEO_MAX_SIDE = 3840
"""Live Play asks every few seconds for new songs: the folders are read again at most this often."""
CHUNK = 256 * 1024
TYPES = {".mp4": "video/mp4", ".htm": "text/html; charset=utf-8", ".flac": "audio/flac", ".mp3": "audio/mpeg", ".wav": "audio/wav", ".srt": "text/plain; charset=utf-8",
         ".json": "application/json", ".pdf": "application/pdf", ".jpg": "image/jpeg", ".js": "text/javascript",
         ".mjs": "text/javascript", ".css": "text/css", ".html": "text/html; charset=utf-8", ".svg": "image/svg+xml",
         ".png": "image/png", ".woff2": "font/woff2"}  # fmt: skip
APP = "plenio-player"
COMFYUI_PORTS = (8188, 8000)  # ComfyUI, ComfyUI Desktop
LOOPBACK_URL = re.compile(r"https?://(127\.0\.0\.1|localhost|\[::1\]):\d{2,5}/?")
EMPTY_STATE: dict[str, Any] = {
    "playlists": [],
    "favorites": [],
    "plays": {},
    "last_played": {},
    "settings": {},
}


class State:
    """The listener's playlists, favourites, play counts and settings in one JSON file (outside the songs'
    folders, which the player changes only to remove a song)."""

    def __init__(self, path: Path):
        self.path = path
        self.lock = threading.Lock()

    def read(self) -> dict[str, Any]:
        try:
            data = json.loads(self.path.read_text(encoding="utf-8"))
            return {**EMPTY_STATE, **data} if isinstance(data, dict) else dict(EMPTY_STATE)
        except (OSError, ValueError):
            return dict(EMPTY_STATE)

    def write(self, data: dict[str, Any]) -> None:
        with self.lock:
            self.path.parent.mkdir(parents=True, exist_ok=True)
            temp = self.path.with_suffix(".tmp")
            temp.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
            temp.replace(self.path)


def comfyui_at(url: str, timeout: float = 0.8) -> dict[str, Any] | None:
    """The ComfyUI answering at ``url`` (a loopback address only: the player asks no other computer)."""
    if not LOOPBACK_URL.fullmatch(url):
        return None
    try:
        with urllib.request.urlopen(f"{url.rstrip('/')}/system_stats", timeout=timeout) as answer:  # noqa: S310
            stats = json.loads(answer.read().decode("utf-8"))
    except (OSError, ValueError):
        return None
    system = stats.get("system") if isinstance(stats, dict) else None
    if not isinstance(system, dict):
        return None
    return {"url": url.rstrip("/") + "/", "version": str(system.get("comfyui_version") or "")}


def find_comfyui(preferred: str = "") -> dict[str, Any] | None:
    """ComfyUI on this computer: ``preferred`` (the one that started the player, or the address in the
    settings), else the usual loopback ports."""
    for url in [preferred] if preferred else []:
        found = comfyui_at(url)
        if found:
            return found
    for port in COMFYUI_PORTS:
        found = comfyui_at(f"http://127.0.0.1:{port}")
        if found:
            return found
    return None


def make_handler(
    library: Library,
    state: State,
    static: Path = STATIC,
    cache: Path | None = None,
    hosts: frozenset[str] = frozenset(),
    comfyui: str = "",
) -> type[BaseHTTPRequestHandler]:
    """The requests' handler; with ``hosts`` it answers only requests addressed to one of them (a player on
    the loopback address is then out of reach of web pages that rename themselves to it: DNS rebinding)."""

    jobs = VideoJobs(videos_dir(state.path.parent))
    packages = PackageJobs()

    def folders_answer() -> dict[str, Any]:
        counts = library.counts()
        return {
            "folders": [
                {
                    "path": str(root),
                    "other": root in library.other,
                    "exists": root.is_dir(),
                    "songs": counts.get(root, [0, 0])[0],
                    "other_songs": counts.get(root, [0, 0])[1],
                }
                for root in library.folders
            ],
            "chosen": folder_choice.load(state.path.parent) is not None,
            "started_with": [str(f) for f in library.started_with],
        }

    class Handler(BaseHTTPRequestHandler):
        server_version = f"PlenioPlayer/{__version__}"

        def parse_request(self) -> bool:
            if not super().parse_request():
                return False
            if hosts and (self.headers.get("Host") or "").lower() not in hosts:
                self._error(403, "unknown host")
                return False
            return True

        def log_message(self, format: str, *args: Any) -> None:  # noqa: A002 - the base class's name
            pass  # quiet: a player streams many ranges

        # --- answers ------------------------------------------------------------------------------
        def _json(self, data: Any, status: int = 200) -> None:
            body = json.dumps(data, ensure_ascii=False).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(body)

        def _error(self, status: int, message: str) -> None:
            self._json({"error": message}, status)

        def _file(self, path: Path, *, cache: bool = False, download: str = "") -> None:
            if not path.is_file():
                return self._error(404, "not found")
            size = path.stat().st_size
            kind = (
                TYPES.get(path.suffix.lower())
                or mimetypes.guess_type(path.name)[0]
                or "application/octet-stream"
            )
            start, end = 0, size - 1
            ranged = self.headers.get("Range")
            match = re.fullmatch(r"bytes=(\d*)-(\d*)", ranged.strip()) if ranged else None
            if match and (match.group(1) or match.group(2)):
                if match.group(1):
                    start = int(match.group(1))
                    end = int(match.group(2)) if match.group(2) else size - 1
                else:
                    start = max(0, size - int(match.group(2)))
                end = min(end, size - 1)
                if start > end or start >= size:
                    self.send_response(HTTPStatus.REQUESTED_RANGE_NOT_SATISFIABLE)
                    self.send_header("Content-Range", f"bytes */{size}")
                    self.end_headers()
                    return
                self.send_response(HTTPStatus.PARTIAL_CONTENT)
                self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
            else:
                self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", kind)
            self.send_header("Accept-Ranges", "bytes")
            self.send_header("Content-Length", str(end - start + 1))
            self.send_header("Cache-Control", "max-age=86400" if cache else "no-cache")
            if download:
                self.send_header("Content-Disposition", f"attachment; filename*=UTF-8''{quote(download)}")
            self.end_headers()
            if self.command == "HEAD":
                return
            with path.open("rb") as handle:
                handle.seek(start)
                left = end - start + 1
                try:
                    while left > 0:
                        chunk = handle.read(min(CHUNK, left))
                        if not chunk:
                            break
                        self.wfile.write(chunk)
                        left -= len(chunk)
                except (ConnectionResetError, BrokenPipeError, ConnectionAbortedError):
                    pass  # the browser stopped reading (a seek): normal

        # --- routes ---------------------------------------------------------------------------------
        def do_HEAD(self) -> None:  # noqa: N802 - the base class's name
            self.do_GET()

        def do_GET(self) -> None:  # noqa: N802
            parsed = urlparse(self.path)
            route = unquote(parsed.path)
            query = {k: v[0] for k, v in parse_qs(parsed.query).items()}
            if route == "/api/info":
                # who answers here (ComfyUI's launcher looks for this), where the state is kept, which ComfyUI
                return self._json(
                    {
                        "app": APP,
                        "version": __version__,
                        "folders": [str(f) for f in library.folders],
                        "state": str(state.path),
                        "retired": RETIRED_DIR,
                        "comfyui": comfyui,
                        "pid": os.getpid(),
                    }
                )
            if route == "/api/comfyui":
                found = find_comfyui(query.get("url", "") or comfyui)
                return self._json({"found": found})
            if route == "/api/find":
                # the song of a record file (Export Release's button in ComfyUI opens the player at it)
                wanted = Path(query.get("record", ""))
                for summary in library.songs():
                    song = library.song(summary["id"])
                    if song and wanted.name == song.record.name and song.record.resolve() == wanted.resolve():
                        return self._json({"id": song.id})
                return self._error(404, "no such song")
            if route == "/api/library":
                return self._json(
                    {
                        "songs": library.songs(),
                        "folders": [str(f) for f in library.folders],
                        "errors": library.errors[:20],
                        "version": __version__,
                    }
                )
            if route.startswith("/api/song/"):
                song = library.song(route.removeprefix("/api/song/"))
                if song is None:
                    return self._error(404, "no such song")
                try:
                    return self._json(song_detail(song, cache=state.path.parent / "cache"))
                except (OSError, ValueError) as error:
                    return self._error(500, str(error))
            if route == "/api/state":
                return self._json(state.read())
            if route == "/api/folders":
                return self._json(folders_answer())
            if route == "/api/packages":
                directory = state.path.parent
                return self._json(
                    {"folder": str(packages_dir(directory)), "files": package_listing(directory)}
                )
            job = re.fullmatch(r"/api/package/([0-9a-f]{16})", route)
            if job:
                status = packages.status(job.group(1))
                return self._json(status) if status else self._error(404, "no such package")
            if route.startswith("/packages/"):
                made = package_file(state.path.parent, route.removeprefix("/packages/"))
                if made is None:
                    return self._error(404, "no such package")
                return self._file(made, download=made.name if query.get("download") else "")
            if route == "/api/videos":
                return self._json({"folder": str(jobs.folder), "files": jobs.listing()})
            if route.startswith("/videos/"):
                video = jobs.file(route.removeprefix("/videos/"))
                if video is None:
                    return self._error(404, "no such video")
                return self._file(video, download=video.name if query.get("download") else "")
            if route == "/api/new":
                # Live Play: the songs that appeared since the last answer's "now" (the folders read again,
                # at most every two seconds); without "since" just the "now" to start from
                library.scan(every=NEW_SONGS_EVERY)
                try:
                    since = float(query.get("since", ""))
                except ValueError:
                    since = None
                songs = library.newer(since) if since is not None else []
                return self._json({"now": library.scan_started, "songs": songs})
            if route == "/api/dirs":
                # the folder browser of the Settings page: only for the player's own page (another page
                # cannot send this header without asking first, and this server never says yes)
                if self.headers.get("X-Plenio-Player") != "1":
                    return self._error(403, "only from the player's page")
                return self._json(folder_choice.list_dirs(query.get("path")))
            if route == "/api/visuals":
                # the listener's own Plenio Drop presets (the page reads them again every few seconds)
                folder = visuals_dir(state.path.parent)
                return self._json({"folder": str(folder), "files": list_presets(folder)})
            if route.startswith("/api/peaks/"):
                song = library.song(route.removeprefix("/api/peaks/"))
                audio = song.files.get("audio") if song else None
                levels = peaks(audio, cache or state.path.parent / "peaks") if audio else None
                return self._json({"peaks": levels}) if levels else self._error(404, "no waveform")
            if route.startswith("/media/"):
                parts = route.split("/")
                if len(parts) != 4 or parts[3] not in MEDIA_KINDS:
                    return self._error(404, "not found")
                song = library.song(parts[2])
                path = song.files.get(parts[3]) if song else None
                if (
                    song
                    and not path
                    and song.other
                    and parts[3] == "cover"
                    and song.summary["has"].get("cover")
                ):
                    # the picture inside the audio file, saved once into the cache
                    path = other_music.embedded_cover(song.record, song.id, state.path.parent / "cache")
                return self._file(path) if path else self._error(404, "no such file")
            # the page itself and its assets; every other path is the page (the player routes by #)
            target = (
                (static / route.lstrip("/")).resolve() if route not in ("", "/") else static / "index.html"
            )
            if static.resolve() not in target.parents and target != static / "index.html":
                return self._error(404, "not found")
            if not target.is_file():
                target = static / "index.html"
            return self._file(target, cache="/assets/" in route)

        def _from_this_page(self) -> bool:
            """A request that changes something must come from the player's own page: JSON (another site's
            page cannot send that without asking first, and this server never says yes) and, when the
            browser names the page's origin, this one."""
            if not (self.headers.get("Content-Type") or "").startswith("application/json"):
                return False
            origin = self.headers.get("Origin")
            host = self.headers.get("Host") or ""
            return origin is None or origin in (f"http://{host}", f"https://{host}")

        def _binary_from_this_page(self) -> bool:
            """A binary upload from the player's own page: a header another site's page cannot send without
            asking first (and this server never says yes), and - when the browser names it - this origin."""
            origin = self.headers.get("Origin")
            host = self.headers.get("Host") or ""
            return self.headers.get("X-Plenio-Player") == "1" and (
                origin is None or origin in (f"http://{host}", f"https://{host}")
            )

        def _body(self) -> bytes | None:
            """The request's body, read before any answer (an answer with the body unread makes Windows
            reset the connection); ``None`` when there is none or it is too large (the connection closes)."""
            length = int(self.headers.get("Content-Length") or 0)
            if length > STATE_LIMIT:
                self.close_connection = True
                return None
            return self.rfile.read(length) if length > 0 else None

        def do_PUT(self) -> None:  # noqa: N802
            body = self._body()
            route = unquote(urlparse(self.path).path)
            if route not in ("/api/state", "/api/folders"):
                return self._error(404, "not found")
            if not self._from_this_page():
                return self._error(403, "only from the player's page")
            if route == "/api/folders":
                return self._put_folders(body)
            if body is None:
                return self._error(413, "no state, or too large")
            try:
                data = json.loads(body.decode("utf-8"))
            except ValueError:
                return self._error(400, "not JSON")
            if not isinstance(data, dict):
                return self._error(400, "the state is an object")
            state.write({**EMPTY_STATE, **{k: v for k, v in data.items() if k in EMPTY_STATE}})
            return self._json({"ok": True})

        def _put_folders(self, body: bytes | None) -> None:
            """The folders chosen in Settings (``{"folders": [{"path", "other"}]}``), or back to the folders
            the player started with (``{"reset": true}``)."""
            try:
                data = json.loads(body.decode("utf-8")) if body else None
            except ValueError:
                data = None
            if not isinstance(data, dict):
                return self._error(400, "not JSON")
            directory = state.path.parent
            if data.get("reset"):
                folder_choice.forget(directory)
                library.set_folders(library.started_with)
                return self._json(folders_answer())
            try:
                chosen = folder_choice.validate(data.get("folders"))
            except ValueError as error:
                return self._error(400, str(error))
            folder_choice.save(directory, chosen)
            library.set_folders([f.path for f in chosen], [f.path for f in chosen if f.other])
            return self._json(folders_answer())

        def _package(self, route: str, raw: bytes | None) -> None:
            """A portable player of chosen songs (one HTML file: plenio.player.package), or its folder shown."""
            if not self._from_this_page():
                return self._error(403, "only from the player's page")
            if route == "/api/packages/open":
                folder = packages_dir(state.path.parent)
                try:
                    open_folder(folder)
                except OSError as error:
                    return self._error(500, str(error))
                return self._json({"folder": str(folder)})
            try:
                body = json.loads(raw.decode("utf-8")) if raw else None
            except ValueError:
                body = None
            if not isinstance(body, dict) or not isinstance(body.get("songs"), list) or not body["songs"]:
                return self._error(400, "the songs to pack")
            ids = [str(i) for i in body["songs"]][:500]
            if int(body.get("bitrate") or 192) not in (128, 160, 192):
                return self._error(400, "MP3 at 128, 160 or 192 kbit/s")
            job = packages.start(library, ids, body, state.path.parent)
            return self._json({"job": job})

        def _video(self, route: str, raw: bytes | None) -> None:
            """A song made into a video: start (the song, the part, the size), the H.264 stream in pieces,
            finish (the MP4 put together with the song's sound), cancel; and the videos folder shown."""
            data_route = re.fullmatch(r"/api/video/([0-9a-f]{16})/data", route)
            if data_route:
                if not self._binary_from_this_page():
                    return self._error(403, "only from the player's page")
                if raw is None:
                    return self._error(413, "no data, or too large")
                try:
                    return self._json({"bytes": jobs.append(data_route.group(1), raw)})
                except KeyError:
                    return self._error(404, "no such video")
                except (OSError, ValueError) as error:
                    return self._error(400, str(error))
            if not self._from_this_page():
                return self._error(403, "only from the player's page")
            try:
                body = json.loads(raw.decode("utf-8")) if raw else {}
            except ValueError:
                return self._error(400, "not JSON")
            if not isinstance(body, dict):
                return self._error(400, "not JSON")
            if route == "/api/videos/open":
                try:
                    open_folder(jobs.folder)
                except OSError as error:
                    return self._error(500, str(error))
                return self._json({"folder": str(jobs.folder)})
            if route == "/api/video":
                song = library.song(str(body.get("song", "")))
                if song is None:
                    return self._error(404, "no such song")
                audio = song.files.get("original") if body.get("take") == "original" else None
                audio = audio or song.files.get("audio")
                if audio is None:
                    return self._error(400, "the song has no audio")
                try:
                    fps, width, height = int(body["fps"]), int(body["width"]), int(body["height"])
                    start, length = float(body.get("start") or 0.0), float(body["length"])
                except (KeyError, TypeError, ValueError):
                    return self._error(400, "fps, width, height, start and length")
                if fps not in VIDEO_FPS or not (
                    16 <= width <= VIDEO_MAX_SIDE and 16 <= height <= VIDEO_MAX_SIDE
                ):
                    return self._error(400, f"a frame rate of {VIDEO_FPS} and a size up to {VIDEO_MAX_SIDE}")
                if start < 0 or not 0 < length <= 4 * 3600:
                    return self._error(400, "a part of the song")
                job = jobs.start(
                    {
                        "song": song.id,
                        "title": song.summary.get("title") or "song",
                        "audio": str(audio),
                        "fps": fps,
                        "width": width,
                        "height": height,
                        "start": start,
                        "length": length,
                    }
                )
                return self._json({"job": job})
            action = re.fullmatch(r"/api/video/([0-9a-f]{16})/(finish|cancel)", route)
            if not action:
                return self._error(404, "not found")
            try:
                if action.group(2) == "cancel":
                    jobs.cancel(action.group(1))
                    return self._json({"ok": True})
                made = jobs.finish(action.group(1), int(body.get("frames") or 0))
            except KeyError:
                return self._error(404, "no such video")
            except Exception as error:  # noqa: BLE001 - PyAV's errors are many; the page shows the reason
                return self._error(500, f"could not make the video: {error}")
            return self._json({"file": made.name, "size": made.stat().st_size, "folder": str(jobs.folder)})

        def do_POST(self) -> None:  # noqa: N802
            raw = self._body()
            route = unquote(urlparse(self.path).path)
            if route == "/api/rescan":
                library.scan(force=True)
                return self._json({"songs": len(library.songs())})
            if route in ("/api/package", "/api/packages/open"):
                return self._package(route, raw)
            if route == "/api/video" or route.startswith("/api/video/") or route == "/api/videos/open":
                return self._video(route, raw)
            if route in ("/api/visuals/copy", "/api/visuals/open"):
                if not self._from_this_page():
                    return self._error(403, "only from the player's page")
                folder = visuals_dir(state.path.parent)
                if route == "/api/visuals/open":
                    try:
                        open_folder(folder)
                    except OSError as error:
                        return self._error(500, str(error))
                    return self._json({"folder": str(folder)})
                try:
                    body = json.loads(raw.decode("utf-8")) if raw else None
                except ValueError:
                    body = None
                if not isinstance(body, dict) or not isinstance(body.get("text"), str):
                    return self._error(400, "name and text of the preset")
                try:
                    json.loads(body["text"])
                    saved = save_copy(folder, str(body.get("name") or "preset"), body["text"])
                except ValueError as error:
                    return self._error(400, f"not a preset: {error}")
                except OSError as error:
                    return self._error(500, str(error))
                return self._json({"file": saved.name, "folder": str(folder)})
            if route == "/api/quit":
                # Stop the player (its Settings page): a player started from ComfyUI has no window to close
                if not self._from_this_page():
                    return self._error(403, "only from the player's page")
                self._json({"ok": True})
                threading.Thread(target=self.server.shutdown, daemon=True).start()
                return None
            match = re.fullmatch(r"/api/song/([0-9a-f]+)/remove", route)
            if not match:
                return self._error(404, "not found")
            # retire or delete a song: from the player's page only, naming the song twice (in the address and
            # in the body), so that no stray request removes one
            if not self._from_this_page():
                return self._error(403, "only from the player's page")
            try:
                body = json.loads(raw.decode("utf-8")) if raw else None
            except ValueError:
                body = None
            if not isinstance(body, dict) or body.get("confirm") != match.group(1):
                return self._error(400, "confirm the song's id")
            if body.get("action") not in ("retire", "delete"):
                return self._error(400, "action: retire or delete")
            try:
                result = library.remove(match.group(1), str(body["action"]))
            except OSError as error:
                return self._error(500, f"could not remove every file: {error}")
            return self._json(result) if result else self._error(404, "no such song")

    return Handler


LOOPBACK = {"127.0.0.1", "localhost", "::1"}


def serve(
    library: Library, state: State, host: str = "127.0.0.1", port: int = 8765, comfyui: str = ""
) -> ThreadingHTTPServer:
    """The player's server; on the loopback address only for requests addressed to it. ``comfyui``: the
    ComfyUI that started it (where *Open in ComfyUI* goes)."""

    class Server(ThreadingHTTPServer):
        daemon_threads = True
        # On Windows SO_REUSEADDR lets a second player bind the same port, and the first one keeps
        # answering - a player started again would serve its old page. There the bind must fail instead.
        allow_reuse_address = os.name != "nt"

        def server_bind(self) -> None:
            super().server_bind()
            if host in LOOPBACK:
                bound = self.server_address[1]
                names = ("127.0.0.1", "localhost", "[::1]")
                # the port is known only now
                self.RequestHandlerClass = make_handler(
                    library,
                    state,
                    cache=state.path.parent / "peaks",
                    hosts=frozenset(f"{name}:{bound}" for name in names),
                    comfyui=comfyui,
                )

    return Server(
        (host, port), make_handler(library, state, cache=state.path.parent / "peaks", comfyui=comfyui)
    )
