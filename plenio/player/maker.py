"""Party songs: songs made from the player (owner's request 2026-10-25; docs/design/party-songs.md §3).

Guests and users - as the admin allows in the settings - fill a simple form (a style template, a description,
genre, mood, tempo, length, vocals, language, voice, theme, key, meter; for a cover the original recording) and the
song is made by YuE2 in the ComfyUI on this computer, through Plenio's Song API (``/plenio/api/v1``). Every song is
made with *HQ mastering* off and *Cover Art* on, in ``plenio/Party-Songs-<date>``, album *Party-Song <date>*, artist
*Guest* or the user's name; once made, the library reads it and Live Play takes it in as every new song.

The songs wait in the player's own line (``party-songs.json`` in its state folder) and go to ComfyUI one at a time:
until a song starts it can be moved, edited and deleted. A user or guest moves their songs among their own places
in the line; the admin moves any. How long a song takes is estimated from its length and from how long the songs
made before took on this computer.

Standard library only (PyAV, where it is, reads a recording's length).
"""

from __future__ import annotations

import hashlib
import json
import re
import secrets
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from collections.abc import Callable, Mapping
from pathlib import Path
from typing import Any

from ..core import brief as brief_rules
from ..core.errors import PlenioUserError
from ..core.song_api import brief_values
from . import other as other_music
from .library import Library

FILE = "party-songs.json"
SOURCES = "party-sources"
COOKIE = "plenio_maker"
GUEST_NAME = "Guest"
DEFAULTS: dict[str, Any] = {
    "on": False,
    "users": True,
    "guests": True,
    "per_person": 3,
    "max_length": "about 4:00",
    "covers": True,
}
"""Off until the admin switches it on; then users and guests may, three songs each waiting, up to about 4:00."""
TEMPLATES = {"song": "yue2-song", "cover": "yue2-cover"}
SONG_FIELDS = (
    "template",
    "description",
    "genre",
    "mood",
    "tempo",
    "length",
    "vocals",
    "language",
    "voice",
    "theme",
    "key",
    "meter",
)
COVER_FIELDS = ("template", "description", "genre", "mood", "vocals", "language", "voice", "theme")
"""What the form asks. A cover keeps the original's tempo, length, key and meter."""
SUNG_ONLY = ("language", "voice", "theme")
DESCRIPTION_LIMIT = 1500
TEXT_LIMIT = 120
SOURCE_LIMIT = 100 * 2**20
SOURCE_SUFFIXES = (".mp3", ".flac", ".wav", ".ogg", ".m4a", ".opus", ".aac", ".aif", ".aiff")
LINE_LIMIT = 40
"""Songs waiting in the line at most (for everybody together)."""
KEEP_FINISHED_S = 12 * 3600
SOURCES_KEPT_S = 6 * 3600
POLL_S = 2.0
STUDIO_EVERY_S = 5.0
PRIOR = {"song": (120.0, 3.0), "cover": (180.0, 3.2)}
"""Seconds of work before the first song is measured: a fixed part and so many per second of music (measured
2026-10-25 on an RTX 5060 Ti: a song of about 1:00 took 300-360 s once the models were loaded)."""
ACTIVE = ("sending", "queued", "running")
FINISHED = ("done", "failed", "cancelled")
LOOPBACK = re.compile(r"https?://(127\.0\.0\.1|localhost|\[::1\]):\d{2,5}/?")


class MakerError(ValueError):
    """A request the party songs refuse, with the HTTP status to answer."""

    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.status = status


class StudioUnavailableError(OSError):
    """ComfyUI does not answer (not running, starting, the network)."""


class StudioError(ValueError):
    """The Song API refused a request: its code and message."""

    def __init__(self, status: int, code: str, message: str):
        super().__init__(message)
        self.status = status
        self.code = code


class Studio:
    """The Song API of the ComfyUI on this computer (``url()`` finds it; loopback addresses only)."""

    def __init__(self, url: Callable[[], str | None]):
        self.url = url

    def _call(
        self,
        method: str,
        path: str,
        body: Any = None,
        *,
        data: bytes | None = None,
        content_type: str = "",
        headers: Mapping[str, str] | None = None,
        timeout: float = 10.0,
    ) -> Any:
        base = (self.url() or "").rstrip("/")
        if not base or not LOOPBACK.fullmatch(base + "/"):
            raise StudioUnavailableError("ComfyUI is not running on this computer")
        sent = data if data is not None else (json.dumps(body).encode("utf-8") if body is not None else None)
        request = urllib.request.Request(f"{base}/plenio/api/v1{path}", data=sent, method=method)
        if sent is not None:
            request.add_header("Content-Type", content_type or "application/json")
        for name, value in (headers or {}).items():
            request.add_header(name, value)
        try:
            with urllib.request.urlopen(request, timeout=timeout) as answer:  # noqa: S310 - loopback only
                return json.loads(answer.read().decode("utf-8") or "null")
        except urllib.error.HTTPError as error:
            try:
                problem = json.loads(error.read().decode("utf-8")).get("error") or {}
            except (ValueError, AttributeError):
                problem = {}
            if error.code == 404 and not problem:
                raise StudioError(
                    404, "not_installed", "This ComfyUI has no Song API (Plenio older than 1.3?)."
                ) from error
            message = str(problem.get("message") or error.reason)
            if problem.get("details"):
                first = (
                    problem["details"][0]
                    if isinstance(problem["details"], list) and problem["details"]
                    else {}
                )
                if isinstance(first, Mapping) and first.get("message"):
                    message += f" ({first.get('title') or first.get('type')}: {first['message']})"
            raise StudioError(error.code, str(problem.get("code") or "error"), message) from error
        except (urllib.error.URLError, OSError, ValueError) as error:
            raise StudioUnavailableError(str(getattr(error, "reason", error))) from error

    def index(self) -> dict[str, Any]:
        return dict(self._call("GET", "/", timeout=4.0))

    def template(self, template_id: str) -> dict[str, Any]:
        return dict(self._call("GET", f"/templates/{template_id}"))

    def briefs(self, kind: str) -> dict[str, Any]:
        return dict(self._call("GET", f"/briefs?kind={kind}"))

    def upload(self, path: Path, name: str) -> dict[str, Any]:
        return dict(
            self._call(
                "POST",
                f"/uploads?name={urllib.parse.quote(name)}",
                data=path.read_bytes(),
                content_type="application/octet-stream",
                timeout=120.0,
            )
        )

    def create(self, body: Mapping[str, Any], key: str) -> dict[str, Any]:
        return dict(self._call("POST", "/jobs", body, headers={"Idempotency-Key": key}, timeout=60.0))

    def job(self, job_id: str) -> dict[str, Any]:
        return dict(self._call("GET", f"/jobs/{job_id}", timeout=5.0))

    def cancel(self, job_id: str) -> dict[str, Any]:
        return dict(self._call("DELETE", f"/jobs/{job_id}", timeout=10.0))

    def queue(self) -> dict[str, Any]:
        return dict(self._call("GET", "/queue", timeout=5.0))


def guest_id(token: str) -> str:
    """A guest by the cookie their browser keeps (only its hash)."""
    return "g" + hashlib.sha256(token.encode("utf-8")).hexdigest()[:15]


def new_guest_token() -> str:
    return secrets.token_urlsafe(24)


def guest_cookie(token: str) -> str:
    return f"{COOKIE}={token}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax"


def token_of(cookie_header: str | None) -> str:
    for part in (cookie_header or "").split(";"):
        name, _, value = part.strip().partition("=")
        if name == COOKIE and re.fullmatch(r"[A-Za-z0-9_-]{20,64}", value.strip()):
            return value.strip()
    return ""


def length_seconds(option: str) -> float:
    return float(brief_rules.LENGTHS.get(option, brief_rules.LENGTHS[brief_rules.DEFAULT_LENGTH]))


def _today(clock: float) -> str:
    return time.strftime("%Y-%m-%d", time.localtime(clock))


def _line(text: Any, limit: int, name: str) -> str:
    value = " ".join(str(text or "").split())
    if len(value) > limit:
        raise MakerError(f"The {name} is too long ({limit} characters at most).")
    return value


class PartySongs:
    """The party songs: settings, the line, the worker that sends one song at a time to ComfyUI and follows it."""

    def __init__(
        self,
        library: Library,
        directory: Path,
        studio: Studio,
        *,
        clock: Callable[[], float] = time.time,
        package_templates: Path | None = None,
    ) -> None:
        self.library = library
        self.directory = directory
        self.path = directory / FILE
        self.sources = directory / SOURCES
        self.studio = studio
        self.clock = clock
        self.package_templates = (
            package_templates or Path(__file__).resolve().parents[2] / "resources" / "templates"
        )
        self.lock = threading.RLock()
        data = self._load()
        self.settings: dict[str, Any] = data["settings"]
        self.jobs: list[dict[str, Any]] = data["jobs"]
        self.rates: dict[str, float] = data["rates"]
        self.folders: list[str] = data["folders"]
        self.studio_state: dict[str, Any] = {"reachable": False, "checked": 0.0, "queue": None, "error": ""}
        self._form: tuple[float, dict[str, Any]] | None = None
        self._stop = threading.Event()
        self._thread: threading.Thread | None = None
        self.library.extra = [Path(f) for f in self.folders]
        # a song that was being sent when the player stopped: sent again (the API knows it by its job id)
        for job in self.jobs:
            if job["status"] == "sending":
                job["status"] = "waiting"

    # --- the file ---------------------------------------------------------------------------------------
    def _load(self) -> dict[str, Any]:
        try:
            data = json.loads(self.path.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            data = {}
        data = data if isinstance(data, dict) else {}
        given: dict[str, Any] = data["settings"] if isinstance(data.get("settings"), dict) else {}
        settings = {**DEFAULTS, **{k: v for k, v in given.items() if k in DEFAULTS}}
        settings["on"], settings["users"], settings["guests"], settings["covers"] = (
            bool(settings["on"]),
            bool(settings["users"]),
            bool(settings["guests"]),
            bool(settings["covers"]),
        )
        try:
            settings["per_person"] = max(1, min(20, int(settings["per_person"])))
        except (TypeError, ValueError):
            settings["per_person"] = DEFAULTS["per_person"]
        if settings["max_length"] not in brief_rules.LENGTHS:
            settings["max_length"] = DEFAULTS["max_length"]
        jobs = [j for j in data.get("jobs") or [] if isinstance(j, dict) and isinstance(j.get("id"), str)]
        rates = {
            k: float(v)
            for k, v in (data.get("rates") or {}).items()
            if k in PRIOR and isinstance(v, (int, float))
        }
        folders = [str(f) for f in data.get("folders") or [] if isinstance(f, str)]
        return {"settings": settings, "jobs": jobs, "rates": rates, "folders": folders}

    def _save(self) -> None:
        self.directory.mkdir(parents=True, exist_ok=True)
        temp = self.path.with_suffix(".tmp")
        temp.write_text(
            json.dumps(
                {"settings": self.settings, "jobs": self.jobs, "rates": self.rates, "folders": self.folders},
                ensure_ascii=False,
                indent=1,
            ),
            encoding="utf-8",
        )
        for attempt in range(20):
            try:
                temp.replace(self.path)
                return
            except PermissionError:
                if attempt == 19:
                    raise
                time.sleep(0.05)

    # --- rights -----------------------------------------------------------------------------------------
    def may(self, who: Mapping[str, Any]) -> tuple[bool, str]:
        if who.get("kind") == "admin":
            return True, ""
        if not self.settings["on"]:
            return False, "Making songs is switched off - the host switches it on in Settings."
        if who.get("kind") == "user" and not self.settings["users"]:
            return False, "The host lets only the admin make songs."
        if who.get("kind") == "guest" and not self.settings["guests"]:
            return False, "The host lets only logged-in listeners make songs."
        return True, ""

    def guests_may(self) -> bool:
        return bool(self.settings["on"] and self.settings["guests"])

    def _mine(self, who: Mapping[str, Any], job: Mapping[str, Any]) -> bool:
        owner = job.get("owner") or {}
        return owner.get("kind") == who.get("kind") and owner.get("id") == who.get("id")

    def _job(self, job_id: str, who: Mapping[str, Any]) -> dict[str, Any]:
        job = next((j for j in self.jobs if j["id"] == job_id), None)
        if job is None or not (self._mine(who, job) or who.get("kind") == "admin"):
            raise MakerError("No such song.", 404)
        return job

    # --- the settings -----------------------------------------------------------------------------------
    def configure(self, changes: Mapping[str, Any]) -> dict[str, Any]:
        with self.lock:
            for key in ("on", "users", "guests", "covers"):
                if key in changes:
                    self.settings[key] = bool(changes[key])
            if "per_person" in changes:
                try:
                    self.settings["per_person"] = max(1, min(20, int(changes["per_person"])))
                except (TypeError, ValueError) as error:
                    raise MakerError("Songs per person: a number from 1 to 20.") from error
            if "max_length" in changes:
                if changes["max_length"] not in brief_rules.LENGTHS:
                    raise MakerError(f"The longest length: one of {list(brief_rules.LENGTHS)}.")
                self.settings["max_length"] = changes["max_length"]
            self._save()
            return dict(self.settings)

    # --- the form ---------------------------------------------------------------------------------------
    def _lengths(self, who: Mapping[str, Any]) -> list[str]:
        limit = length_seconds(self.settings["max_length"]) if who.get("kind") != "admin" else float("inf")
        return [option for option, seconds in brief_rules.LENGTHS.items() if seconds <= limit]

    def form(self, who: Mapping[str, Any]) -> dict[str, Any]:
        """What the form offers: the style templates (to fill every field), every value their fields have (the
        lists), the choices of length and vocals - from ComfyUI's Song API when it answers, else from the package."""
        now = self.clock()
        cached = self._form
        if cached is None or now - cached[0] > 60:
            built = self._form_from_studio() or self._form_from_package()
            self._form = cached = (now, built)
        form: dict[str, Any] = json.loads(json.dumps(cached[1]))
        form["song"]["choices"]["length"] = [
            c for c in form["song"]["choices"]["length"] if c in self._lengths(who)
        ]
        form["limits"] = {
            "description": DESCRIPTION_LIMIT,
            "text": TEXT_LIMIT,
            "source_mb": SOURCE_LIMIT // 2**20,
            "max_length": self.settings["max_length"] if who.get("kind") != "admin" else "",
        }
        form["covers"] = bool(self.settings["covers"]) or who.get("kind") == "admin"
        return form

    def _form_from_studio(self) -> dict[str, Any] | None:
        try:
            song = self.studio.template(TEMPLATES["song"])
            cover = self.studio.template(TEMPLATES["cover"])
            briefs = self.studio.briefs("song")
        except (StudioUnavailableError, StudioError):
            return None

        def field_of(template: Mapping[str, Any], name: str) -> Mapping[str, Any]:
            found: Mapping[str, Any] = next(
                (f for f in template.get("fields") or [] if isinstance(f, Mapping) and f.get("id") == name),
                {},
            )
            return found

        def choices(template: Mapping[str, Any], name: str) -> list[str]:
            return [str(c) for c in field_of(template, name).get("choices") or []]

        def default(template: Mapping[str, Any], name: str) -> Any:
            return field_of(template, name).get("default")

        return {
            "source": "studio",
            "templates": [
                {"id": b["id"], "name": b["name"], "group": b["group"], "fields": b.get("fields") or {}}
                for b in briefs.get("briefs") or []
                if isinstance(b, Mapping) and b.get("id")
            ],
            "values": briefs.get("values") or {},
            "song": {
                "fields": list(SONG_FIELDS),
                "choices": {"length": choices(song, "length"), "vocals": choices(song, "vocals")},
                "defaults": {"length": default(song, "length"), "vocals": default(song, "vocals")},
            },
            "cover": {
                "fields": list(COVER_FIELDS),
                "choices": {"vocals": choices(cover, "vocals")},
                "defaults": {"vocals": default(cover, "vocals")},
            },
        }

    def _form_from_package(self) -> dict[str, Any]:
        library = brief_rules.TemplateLibrary(self.package_templates)
        found = [library.templates()[i] for i in library.ids()]
        return {
            "source": "package",
            "templates": [
                {"id": t.id, "name": t.name, "group": t.group, "fields": dict(t.fields)} for t in found
            ],
            "values": brief_values(found, brief_rules.TEMPLATE_FIELDS),
            "song": {
                "fields": list(SONG_FIELDS),
                "choices": {"length": list(brief_rules.LENGTHS), "vocals": list(brief_rules.VOCALS)},
                "defaults": {"length": brief_rules.DEFAULT_LENGTH, "vocals": "sung"},
            },
            "cover": {
                "fields": list(COVER_FIELDS),
                "choices": {"vocals": list(brief_rules.COVER_VOCALS)},
                "defaults": {"vocals": "original lyrics"},
            },
        }

    # --- songs --------------------------------------------------------------------------------------------
    def _clean(self, who: Mapping[str, Any], data: Mapping[str, Any], *, kind: str) -> dict[str, str]:
        given: Mapping[str, Any] = data["fields"] if isinstance(data.get("fields"), Mapping) else {}
        names = SONG_FIELDS if kind == "song" else COVER_FIELDS
        fields: dict[str, str] = {}
        for name in names:
            if name == "description":
                text = str(given.get(name) or "").strip()
                if len(text) > DESCRIPTION_LIMIT:
                    raise MakerError(f"The description is too long ({DESCRIPTION_LIMIT} characters at most).")
                fields[name] = re.sub(r"[^\S\n]+", " ", text)
            else:
                fields[name] = _line(given.get(name), TEXT_LIMIT, name)
        if kind == "song":
            if fields["length"] and fields["length"] not in brief_rules.LENGTHS:
                try:
                    fields["length"] = brief_rules.resolve_length(fields["length"])[0]
                except PlenioUserError as error:
                    raise MakerError(f"The length: {error.message}") from error
            fields["length"] = fields["length"] or brief_rules.DEFAULT_LENGTH
            if fields["length"] not in self._lengths(who):
                raise MakerError(f"The host allows songs up to {self.settings['max_length']}.")
            fields["vocals"] = fields["vocals"] or "sung"
            if fields["vocals"] not in brief_rules.VOCALS:
                raise MakerError(f"Vocals: one of {', '.join(brief_rules.VOCALS)}.")
        else:
            fields["vocals"] = fields["vocals"] or "original lyrics"
            if fields["vocals"] not in brief_rules.COVER_VOCALS:
                raise MakerError(f"Vocals: one of {', '.join(brief_rules.COVER_VOCALS)}.")
        fields["template"] = fields["template"] if fields["template"] not in ("", "none") else "none"
        if fields["template"] != "none" and (
            not re.fullmatch(r"[a-z0-9][a-z0-9/_-]{0,118}", fields["template"])
            or fields["template"] not in self._style_ids(who)
        ):
            raise MakerError("No such style - choose one of the list.")
        if fields["template"] == "none" and not (fields["genre"] or fields["description"]):
            raise MakerError("Choose a style, or give at least a genre or a description.")
        return fields

    def _style_ids(self, who: Mapping[str, Any]) -> set[str]:
        """The style templates the form offers (ComfyUI's, else the package's)."""
        return {str(t.get("id")) for t in self.form(who).get("templates") or []}

    def _waiting(self) -> list[dict[str, Any]]:
        return [j for j in self.jobs if j["status"] == "waiting"]

    def create(self, who: Mapping[str, Any], data: Mapping[str, Any]) -> dict[str, Any]:
        allowed, why = self.may(who)
        if not allowed:
            raise MakerError(why, 403)
        source_id = str(data.get("source") or "")
        kind = "cover" if source_id else "song"
        if kind == "cover" and not (self.settings["covers"] or who.get("kind") == "admin"):
            raise MakerError("The host lets guests make new songs only, no covers.", 403)
        fields = self._clean(who, data, kind=kind)
        with self.lock:
            open_jobs = [j for j in self.jobs if self._mine(who, j) and j["status"] not in FINISHED]
            if who.get("kind") != "admin" and len(open_jobs) >= self.settings["per_person"]:
                raise MakerError(
                    f"You have {len(open_jobs)} songs in the making - the host allows {self.settings['per_person']}. "
                    "Wait until one is done.",
                    429,
                )
            if len(self._waiting()) >= LINE_LIMIT:
                raise MakerError("The line is full just now - try again in a few minutes.", 429)
            source = self._source(source_id, who) if kind == "cover" else None
            job = {
                "id": secrets.token_hex(8),
                "owner": {
                    "kind": who.get("kind"),
                    "id": who.get("id"),
                    "name": who.get("name") or GUEST_NAME,
                },
                "kind": kind,
                "fields": fields,
                "source": source,
                "status": "waiting",
                "created": self.clock(),
                "sent": None,
                "started": None,
                "finished": None,
                "comfy": None,
                "stage": None,
                "progress": None,
                "result": None,
                "error": "",
                "note": "",
                "retried": False,
            }
            self.jobs.append(job)
            self._save()
        return self.view(job, who)

    def update(self, who: Mapping[str, Any], job_id: str, data: Mapping[str, Any]) -> dict[str, Any]:
        with self.lock:
            job = self._job(job_id, who)
            if job["status"] != "waiting":
                raise MakerError("The song is being made already - it can no longer be changed.", 409)
            job["fields"] = self._clean(who, data, kind=job["kind"])
            if (
                job["kind"] == "cover"
                and data.get("source")
                and data.get("source") != (job.get("source") or {}).get("id")
            ):
                job["source"] = self._source(str(data["source"]), who)
            self._save()
            return self.view(job, who)

    def move(self, who: Mapping[str, Any], job_id: str, by: int) -> dict[str, Any]:
        """One place up (``-1``) or down (``1``) in the line: past the next song of one's own (the admin: past the
        next song)."""
        if by not in (-1, 1):
            raise MakerError("by: -1 (earlier) or 1 (later).")
        with self.lock:
            job = self._job(job_id, who)
            if job["status"] != "waiting":
                raise MakerError("Only a song that is still waiting can move.", 409)
            line = self._waiting()
            at = line.index(job)
            admin = who.get("kind") == "admin"
            others = [k for k, j in enumerate(line) if (admin or self._mine(who, j)) and j is not job]
            target = next(
                (k for k in (reversed(others) if by < 0 else others) if (k < at if by < 0 else k > at)), None
            )
            if target is None:
                raise MakerError("It is first already." if by < 0 else "It is last already.", 409)
            a, b = self.jobs.index(job), self.jobs.index(line[target])
            self.jobs[a], self.jobs[b] = self.jobs[b], self.jobs[a]
            self._save()
            return self.view(job, who)

    def remove(self, who: Mapping[str, Any], job_id: str) -> dict[str, Any]:
        """A waiting song out of the line, one being made stopped, a finished one off the list."""
        cancel = ""
        with self.lock:
            job = self._job(job_id, who)
            if job["status"] in ACTIVE:
                cancel = str(job.get("comfy") or "")
                job["status"] = "cancelled"
                job["finished"] = self.clock()
                job["note"] = "stopped"
                result = self.view(job, who)
            else:
                self.jobs.remove(job)
                self._drop_source(job)
                result = {"id": job_id, "removed": True}
            self._save()
        if cancel:
            try:
                self.studio.cancel(cancel)
            except (StudioUnavailableError, StudioError):
                pass  # it is gone from ComfyUI already, or ComfyUI is gone
        return result

    # --- the source recordings ------------------------------------------------------------------------------
    def add_source(self, who: Mapping[str, Any], name: str, data: bytes) -> dict[str, Any]:
        allowed, why = self.may(who)
        if not allowed:
            raise MakerError(why, 403)
        if not (self.settings["covers"] or who.get("kind") == "admin"):
            raise MakerError("The host lets guests make new songs only, no covers.", 403)
        clean = Path(str(name or "")).name[:120] or "recording"
        suffix = Path(clean).suffix.lower()
        if suffix not in SOURCE_SUFFIXES:
            raise MakerError("An audio file: MP3, FLAC, WAV, OGG, M4A, OPUS, AAC or AIFF.", 415)
        if not data:
            raise MakerError("The file is empty.")
        if len(data) > SOURCE_LIMIT:
            raise MakerError(f"The recording is too large ({SOURCE_LIMIT // 2**20} MB at most).", 413)
        source_id = secrets.token_hex(8)
        self.sources.mkdir(parents=True, exist_ok=True)
        path = self.sources / f"{source_id}{suffix}"
        path.write_bytes(data)
        facts = other_music.probe(path)
        seconds = float(facts.get("seconds") or 0.0)
        title = str((facts.get("tags") or {}).get("title") or Path(clean).stem)
        meta = {
            "id": source_id,
            "name": clean,
            "title": title[:120],
            "seconds": round(seconds, 1),
            "bytes": len(data),
            "owner": {"kind": who.get("kind"), "id": who.get("id")},
            "added": self.clock(),
        }
        (self.sources / f"{source_id}.json").write_text(
            json.dumps(meta, ensure_ascii=False), encoding="utf-8"
        )
        return {k: meta[k] for k in ("id", "name", "title", "seconds", "bytes")}

    def _source(self, source_id: str, who: Mapping[str, Any]) -> dict[str, Any]:
        if not re.fullmatch(r"[0-9a-f]{16}", source_id):
            raise MakerError("No such recording - add it again.")
        try:
            meta = json.loads((self.sources / f"{source_id}.json").read_text(encoding="utf-8"))
        except (OSError, ValueError) as error:
            raise MakerError("No such recording - add it again.") from error
        owner = meta.get("owner") or {}
        if who.get("kind") != "admin" and (owner.get("kind"), owner.get("id")) != (
            who.get("kind"),
            who.get("id"),
        ):
            raise MakerError("No such recording - add it again.")
        return {k: meta.get(k) for k in ("id", "name", "title", "seconds")}

    def _source_file(self, job: Mapping[str, Any]) -> Path | None:
        source = job.get("source") or {}
        suffix = Path(str(source.get("name") or "")).suffix.lower()
        path = self.sources / f"{source.get('id')}{suffix}"
        return path if source.get("id") and path.is_file() else None

    def _drop_source(self, job: Mapping[str, Any]) -> None:
        source = job.get("source") or {}
        if not source.get("id") or any(
            j is not job and (j.get("source") or {}).get("id") == source["id"] for j in self.jobs
        ):
            return
        for path in self.sources.glob(f"{source['id']}*"):
            path.unlink(missing_ok=True)

    # --- what the page shows --------------------------------------------------------------------------------
    def estimate(self, job: Mapping[str, Any]) -> float:
        """Seconds the song takes to make: a fixed part and a part per second of music, times what this computer
        showed so far."""
        kind = str(job.get("kind") or "song")
        base, per_second = PRIOR.get(kind, PRIOR["song"])
        if kind == "cover":
            seconds = float((job.get("source") or {}).get("seconds") or 0.0) or 180.0
        else:
            seconds = length_seconds(str((job.get("fields") or {}).get("length") or ""))
        return (base + per_second * seconds) * self.rates.get(kind, 1.0)

    def _timeline(self) -> dict[str, tuple[float, float]]:
        """When each song in the making will be done, roughly: (start, ready) by job id."""
        now = self.clock()
        out: dict[str, tuple[float, float]] = {}
        t = now
        active = next((j for j in self.jobs if j["status"] in ACTIVE), None)
        line = self._waiting()
        first = active if active is not None else (line[0] if line else None)
        queue = self.studio_state.get("queue") or {}
        running = queue.get("running") or {}
        # what ComfyUI runs before the party's song (the owner's own runs): how long they take is not known -
        # half a song each
        ours = str((active or {}).get("comfy") or "")
        ahead = int(queue.get("pending") or 0) - (
            1 if ours and ours in (queue.get("pending_api") or []) else 0
        )
        ahead += 1 if running and running.get("id") != ours else 0
        if first is not None and (active is None or active["status"] != "running"):
            t += max(0, ahead) * 0.5 * self.estimate(first)
        if active is not None:
            elapsed = now - float(active.get("started") or now) if active["status"] == "running" else 0.0
            ready = t + max(30.0, self.estimate(active) - elapsed)
            out[active["id"]] = (t, ready)
            t = ready
        for job in line:
            ready = t + self.estimate(job)
            out[job["id"]] = (t, ready)
            t = ready
        return out

    def label(self, job: Mapping[str, Any]) -> str:
        """What identifies a song before it has a title: its style, its length, its voice."""
        fields = job.get("fields") or {}
        minutes = re.search(r"\d+:\d\d", str(fields.get("length") or ""))
        parts = [fields.get("genre") or "", minutes.group(0) if minutes else ""]
        if job.get("kind") == "cover":
            parts = [
                f"Cover of {(job.get('source') or {}).get('title') or 'a song'}",
                fields.get("genre") or "",
            ]
        if fields.get("vocals") == "instrumental":
            parts.append("instrumental")
        else:
            parts.append(fields.get("voice") or fields.get("language") or "")
        if not parts[0] and fields.get("template") not in (None, "", "none"):
            parts[0] = str(fields["template"]).rsplit("/", 1)[-1].replace("-", " ")
        return " · ".join(p for p in parts if p) or "A new song"

    def view(
        self,
        job: Mapping[str, Any],
        who: Mapping[str, Any],
        timeline: Mapping[str, tuple[float, float]] | None = None,
    ) -> dict[str, Any]:
        timeline = self._timeline() if timeline is None else timeline
        mine = self._mine(who, job)
        admin = who.get("kind") == "admin"
        line = self._waiting()
        waiting = job["status"] == "waiting"
        position = next((k + 1 for k, j in enumerate(line) if j is job), None) if waiting else None
        movers = [j for j in line if admin or self._mine(who, j)]
        place = next((k for k, j in enumerate(movers) if j is job), -1) if waiting else -1
        when = timeline.get(job["id"])
        result = dict(job.get("result") or {}) or None
        out: dict[str, Any] = {
            "id": job["id"],
            "kind": job["kind"],
            "status": job["status"],
            "owner": {"kind": job["owner"].get("kind"), "name": job["owner"].get("name")},
            "mine": mine,
            "label": self.label(job),
            "description": str((job.get("fields") or {}).get("description") or "")[:240],
            "created": job.get("created"),
            "started": job.get("started"),
            "finished": job.get("finished"),
            "position": position,
            "eta": round(when[1]) if when else None,
            "starts": round(when[0]) if when and waiting else None,
            "estimate": round(self.estimate(job)),
            "stage": job.get("stage"),
            "progress": job.get("progress"),
            "result": result,
            "error": job.get("error") or "",
            "note": job.get("note") or "",
            "can": {
                "edit": waiting and (mine or admin),
                "up": waiting and place > 0,
                "down": waiting and 0 <= place < len(movers) - 1,
                "delete": mine or admin,
            },
        }
        if mine or admin:
            out["fields"] = dict(job.get("fields") or {})
            out["source"] = dict(job.get("source") or {}) or None
        return out

    def listing(self, who: Mapping[str, Any], *, everyone: bool = False) -> list[dict[str, Any]]:
        with self.lock:
            timeline = self._timeline()
            shown = [j for j in self.jobs if (everyone and who.get("kind") == "admin") or self._mine(who, j)]
            return [self.view(j, who, timeline) for j in shown]

    def status(self, who: Mapping[str, Any], *, everyone: bool = False) -> dict[str, Any]:
        allowed, why = self.may(who)
        admin = who.get("kind") == "admin"
        with self.lock:
            settings = (
                dict(self.settings)
                if admin
                else {k: self.settings[k] for k in ("covers", "max_length", "per_person")}
            )
            waiting = len(self._waiting())
            making = any(j["status"] in ACTIVE for j in self.jobs)
            timeline = self._timeline()
        return {
            "on": bool(self.settings["on"]),
            "may": allowed,
            "why": why,
            "me": {"kind": who.get("kind"), "name": who.get("name") or GUEST_NAME},
            "admin": admin,
            "settings": settings,
            "studio": {
                "reachable": bool(self.studio_state.get("reachable")),
                "error": str(self.studio_state.get("error") or "") if admin else "",
            },
            "line": {
                "waiting": waiting,
                "making": making,
                "free": round(max([t[1] for t in timeline.values()], default=self.clock())),
            },
            "jobs": self.listing(who, everyone=everyone),
        }

    # --- the worker ---------------------------------------------------------------------------------------
    def start(self) -> None:
        if self._thread is None:
            self._thread = threading.Thread(target=self._run, name="plenio-party-songs", daemon=True)
            self._thread.start()

    def close(self) -> None:
        self._stop.set()
        if self._thread is not None:
            self._thread.join(timeout=5)

    def _run(self) -> None:
        while not self._stop.wait(POLL_S):
            try:
                self.tick()
            except Exception as error:  # noqa: BLE001 - the worker goes on with the next song
                with self.lock:
                    self.studio_state["error"] = f"{type(error).__name__}: {error}"

    def _check_studio(self) -> None:
        now = self.clock()
        if now - float(self.studio_state.get("checked") or 0) < STUDIO_EVERY_S:
            return
        self.studio_state["checked"] = now
        try:
            self.studio_state["queue"] = self.studio.queue()
            self.studio_state["reachable"] = True
            self.studio_state["error"] = ""
        except (StudioUnavailableError, StudioError) as error:
            self.studio_state["reachable"] = False
            self.studio_state["queue"] = None
            self.studio_state["error"] = str(error)

    def tick(self) -> None:
        """One step: follow the song being made, or send the next one; forget old finished songs."""
        self._check_studio()
        with self.lock:
            now = self.clock()
            old = [
                j
                for j in self.jobs
                if j["status"] in FINISHED and now - float(j.get("finished") or now) > KEEP_FINISHED_S
            ]
            for job in old:
                self.jobs.remove(job)
                self._drop_source(job)
            if old:
                self._save()
            self._clean_sources(now)
            active = next((j for j in self.jobs if j["status"] in ACTIVE), None)
            nxt = None if active is not None else next(iter(self._waiting()), None)
            if nxt is not None and self.studio_state.get("reachable"):
                nxt["status"] = "sending"
                self._save()
        if active is not None:
            self._follow(active)
        elif nxt is not None and nxt["status"] == "sending":
            self._send(nxt)

    def _clean_sources(self, now: float) -> None:
        if not self.sources.is_dir():
            return
        used = {(j.get("source") or {}).get("id") for j in self.jobs}
        for meta in self.sources.glob("*.json"):
            if meta.stem in used:
                continue
            try:
                if now - meta.stat().st_mtime > SOURCES_KEPT_S:
                    for path in self.sources.glob(f"{meta.stem}*"):
                        path.unlink(missing_ok=True)
            except OSError:
                pass

    def request_of(self, job: Mapping[str, Any], audio: str = "") -> dict[str, Any]:
        """The Song API request for a song: the form's fields, HQ mastering off, Cover Art on, the party's folder,
        album and artist."""
        fields = dict(job.get("fields") or {})
        if fields.get("vocals") in ("instrumental",):
            for name in SUNG_ONLY:
                fields.pop(name, None)
        if job.get("kind") == "cover":
            if fields.get("vocals") != "new lyrics":
                fields.pop("theme", None)
            fields["source.audio"] = audio
        fields = {k: v for k, v in fields.items() if v != "" or k in ("description",)}
        fields["finish.hq_mastering"] = False
        fields["finish.cover_art"] = True
        date = _today(float(job.get("sent") or self.clock()))
        owner = job.get("owner") or {}
        return {
            "template": TEMPLATES[str(job.get("kind") or "song")],
            "fields": fields,
            "release": {
                "folder": f"plenio/Party-Songs-{date}",
                "album": f"Party-Song {date}",
                "artist": str(owner.get("name") or GUEST_NAME)
                if owner.get("kind") != "guest"
                else GUEST_NAME,
            },
            "client": {
                "name": "Plenio Player",
                "job": str(job.get("id")),
                "by": str(owner.get("name") or GUEST_NAME),
            },
            "strict": False,
        }

    def _send(self, job: dict[str, Any]) -> None:
        job["sent"] = self.clock()
        try:
            audio = ""
            if job["kind"] == "cover":
                path = self._source_file(job)
                if path is None:
                    raise StudioError(400, "missing_field", "The original recording is gone - add it again.")
                audio = str(
                    self.studio.upload(path, str((job.get("source") or {}).get("name") or path.name))["name"]
                )
            answer = self.studio.create(self.request_of(job, audio), key=f"plenio-player-{job['id']}")
        except StudioUnavailableError as error:
            with self.lock:
                if job["status"] == "sending":
                    job["status"] = "waiting"
                    job["note"] = f"waiting for ComfyUI ({error})"
                    self._save()
            return
        except StudioError as error:
            with self.lock:
                job["status"] = "failed"
                job["finished"] = self.clock()
                job["error"] = str(error)
                self._save()
            return
        with self.lock:
            if job["status"] == "cancelled":  # deleted while it was being sent
                try:
                    self.studio.cancel(str(answer.get("id")))
                except (StudioUnavailableError, StudioError):
                    pass
                return
            job["comfy"] = str(answer.get("id") or "")
            job["status"] = "running" if answer.get("status") == "running" else "queued"
            job["note"] = ""
            if job["status"] == "running":
                job["started"] = float(answer.get("started_at") or self.clock())
            self._save()

    def _follow(self, job: dict[str, Any]) -> None:
        if job["status"] == "sending":
            return
        try:
            view = self.studio.job(str(job.get("comfy") or "-"))
        except StudioUnavailableError:
            with self.lock:
                job["note"] = "ComfyUI does not answer just now"
            return
        except StudioError as error:
            with self.lock:
                if error.status == 404:
                    # ComfyUI forgot it (a restart): the song goes back to the head of the line once
                    if not job.get("retried"):
                        job.update(
                            status="waiting", comfy=None, retried=True, note="ComfyUI restarted - made again"
                        )
                        self.jobs.remove(job)
                        first = next(
                            (k for k, j in enumerate(self.jobs) if j["status"] == "waiting"), len(self.jobs)
                        )
                        self.jobs.insert(first, job)
                    else:
                        job.update(
                            status="failed",
                            finished=self.clock(),
                            error="ComfyUI restarted and lost the song.",
                        )
                    self._save()
            return
        status = str(view.get("status") or "")
        with self.lock:
            if job["status"] == "cancelled":
                return
            job["note"] = ""
            if status == "queued":
                job["status"] = "queued"
                # ComfyUI runs other runs first (the owner's own): where it waits there
                position = int(view.get("queue_position") or 0)
                job["note"] = f"#{position} in ComfyUI's queue" if position > 1 else ""
            elif status == "running":
                job["status"] = "running"
                job["started"] = float(view.get("started_at") or job.get("started") or self.clock())
                job["stage"] = view.get("stage")
                job["progress"] = view.get("progress")
            elif status == "succeeded":
                job["status"] = "done"
                job["started"] = float(view.get("started_at") or job.get("started") or self.clock())
                job["finished"] = float(view.get("finished_at") or self.clock())
                job["stage"] = None
                job["progress"] = None
                self._learn(job)
                result = view.get("result") or {}
                job["result"] = {
                    "title": str(result.get("title") or ""),
                    "record": str(result.get("record") or ""),
                    "song": "",
                }
            elif status in ("failed", "cancelled"):
                job["status"] = status
                job["finished"] = float(view.get("finished_at") or self.clock())
                problem = view.get("error") or {}
                where = f" ({problem.get('title')})" if problem.get("title") else ""
                job["error"] = (
                    f"{problem.get('message') or 'the run stopped'}{where}" if status == "failed" else ""
                )
                job["stage"] = None
            self._save()
        if job["status"] == "done":
            self._file(job)

    def _learn(self, job: Mapping[str, Any]) -> None:
        """How long the song took against the estimate: the next estimates follow (half the old, half the new)."""
        took = float(job.get("finished") or 0) - float(job.get("started") or 0)
        kind = str(job.get("kind") or "song")
        if took <= 10:
            return
        base, per_second = PRIOR.get(kind, PRIOR["song"])
        seconds = (
            float((job.get("source") or {}).get("seconds") or 180.0)
            if kind == "cover"
            else length_seconds(str((job.get("fields") or {}).get("length") or ""))
        )
        factor = max(0.25, min(4.0, took / (base + per_second * seconds)))
        self.rates[kind] = factor if kind not in self.rates else 0.5 * self.rates[kind] + 0.5 * factor

    def _file(self, job: dict[str, Any]) -> None:
        """The finished song into the library: its record's folder is read (added when it is outside the
        library's folders), so Live Play takes it in as a new song."""
        record = Path(str((job.get("result") or {}).get("record") or ""))
        if not record.name:
            return
        found = self._song_of(record)
        if found is None and record.parent.is_dir():
            folder = str(record.parent.resolve())
            with self.lock:
                if folder not in self.folders:
                    self.folders.append(folder)
                    self.library.extra = [Path(f) for f in self.folders]
                    self._save()
            found = self._song_of(record)
        if found is not None:
            with self.lock:
                job["result"]["song"] = found
                self._save()

    def _song_of(self, record: Path) -> str | None:
        self.library.scan(force=True)
        found = self.library.find_record(record)
        return found.id if found is not None else None
