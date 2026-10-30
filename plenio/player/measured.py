"""How well each song came out, measured (owner's request 2026-10-29), for the player. A song exported since 1.4.0
has it in its record (Export Release measures it); one exported before is measured when its page asks - its audio
decoded with PyAV and :mod:`plenio.core.quality` run on it, about half a second a song - and the result kept in the
player's cache (``quality.json``). Without numpy and PyAV the record's measures alone are given.

The stars the admin gives a song by ear go into the song's own page beside it (``<name>.html``, the page Export
Release wrote - never a new file), with the measured ones.
"""

from __future__ import annotations

import json
import logging
import re
import threading
from collections.abc import Mapping
from pathlib import Path
from typing import Any

log = logging.getLogger(__name__)

CACHE_FILE = "quality.json"
KEPT = 5000
"""Songs whose measures the cache keeps at most."""
SONG_ID = re.compile(r"[0-9a-f]{12}")


def ratings_of(raw: Any) -> dict[str, float]:
    """The stars given by ear, as a listener's state keeps them: song id -> 0 to 5 in halves (anything else out)."""
    if not isinstance(raw, Mapping):
        return {}
    out: dict[str, float] = {}
    for song, value in raw.items():
        if SONG_ID.fullmatch(str(song)) and isinstance(value, (int, float)) and not isinstance(value, bool):
            if 0 <= value <= 5:
                out[str(song)] = round(float(value) * 2) / 2
    return out


def decode(path: Path, seconds: float) -> tuple[Any, int]:
    """A song's audio as float32, channels first, at its own rate (at most ``seconds`` of it)."""
    import av
    import numpy as np

    with av.open(str(path)) as container:
        stream = container.streams.audio[0]
        rate = int(stream.rate)
        layout = "stereo" if (stream.channels or 2) > 1 else "mono"
        resampler = av.AudioResampler(format="fltp", layout=layout, rate=rate)
        limit = int(rate * (seconds + 1))
        chunks = []
        total = 0
        for frame in container.decode(stream):
            for out in resampler.resample(frame):
                data = out.to_ndarray()
                chunks.append(data)
                total += data.shape[1]
            if total >= limit:
                break
        chunks += [out.to_ndarray() for out in resampler.resample(None)]
    return np.concatenate(chunks, axis=1)[:, :limit].astype(np.float32), rate


class Measured:
    """The measured quality of the library's songs: the record's, else measured once and kept."""

    def __init__(self, folder: Path) -> None:
        self.path = folder / CACHE_FILE
        self.lock = threading.Lock()
        self._cache: dict[str, Any] | None = None

    def _kept(self) -> dict[str, Any]:
        if self._cache is None:
            try:
                data = json.loads(self.path.read_text(encoding="utf-8"))
            except (OSError, ValueError):
                data = {}
            self._cache = data if isinstance(data, dict) else {}
        return self._cache

    def _keep(self, song_id: str, entry: dict[str, Any]) -> None:
        with self.lock:
            kept = self._kept()
            kept.pop(song_id, None)
            kept[song_id] = entry
            while len(kept) > KEPT:
                kept.pop(next(iter(kept)))
            try:
                self.path.parent.mkdir(parents=True, exist_ok=True)
                temp = self.path.with_suffix(".tmp")
                temp.write_text(json.dumps(kept), encoding="utf-8")
                temp.replace(self.path)
            except OSError:
                pass  # kept in memory until the next one

    def of(self, song: Any) -> dict[str, Any] | None:
        """How well ``song`` came out, measured (``None``: this player cannot measure it)."""
        try:
            from ..core.quality import MAX_SECONDS, QUALITY_VERSION, song_quality
        except ImportError:
            return None
        record: dict[str, Any] = {}
        if not song.other:
            try:
                record = json.loads(song.record.read_text(encoding="utf-8"))
            except (OSError, ValueError):
                record = {}
        given = record.get("quality")
        if isinstance(given, dict) and given.get("version") == QUALITY_VERSION:
            return given
        audio = song.files.get("audio")
        try:
            stat = audio.stat() if audio is not None else None
        except OSError:
            stat = None
        stamp = [stat.st_size, int(stat.st_mtime)] if stat else None
        with self.lock:
            cached = self._kept().get(song.id)
        if (
            isinstance(cached, dict)
            and cached.get("stamp") == stamp
            and (cached.get("quality") or {}).get("version") == QUALITY_VERSION
        ):
            return dict(cached["quality"])
        samples, rate = None, 0
        if audio is not None and stat is not None:
            try:
                samples, rate = decode(audio, MAX_SECONDS)
            except Exception:  # noqa: BLE001 - no PyAV here, or a file it cannot read: the record's measures
                log.info("Plenio Player: %s could not be measured", audio.name, exc_info=True)
                samples = None
        quality = song_quality(samples, rate, record or None)
        self._keep(song.id, {"stamp": stamp, "quality": quality})
        return quality

    def write_pages(self, library: Any, ratings: Mapping[str, float | None]) -> None:
        """The songs' own pages beside them written anew with the admin's stars (in the background): only pages
        Export Release wrote, never a new file."""

        def work() -> None:
            from ..core.files import atomic_write_text
            from .song_page import page_for

            for song_id, stars in ratings.items():
                song = library.song(song_id)
                page = song.files.get("page") if song is not None and not song.other else None
                if page is None or not page.is_file():
                    continue
                try:
                    atomic_write_text(page, page_for(song.record, rating=stars, quality=self.of(song)))
                except (OSError, ValueError):
                    log.warning("Plenio Player: the page of %s was not written", song_id, exc_info=True)

        threading.Thread(target=work, name="plenio-song-pages", daemon=True).start()
