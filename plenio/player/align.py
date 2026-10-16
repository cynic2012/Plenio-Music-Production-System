"""Where a song's score sits in its recording, for songs without measured times (exported before 1.0.0, or
with subtitle files only): the notation then follows the music instead of running a bar or more behind or
ahead (owner's report 2026-10-16) - a YuE2 render is shifted against its score, 1.7 s in the median song,
and the shift wanders over the song.

The pitch classes (chroma) of the score - its notes, every voice - and of the recording are compared at every
shift from -12 to +20 seconds; the best is the song's offset (``t_audio = t_score + b``). Then stretches of
24 seconds, every 12, each on its own near that offset, give anchors along the song, as the measured
syllables do for a song exported with 1.0.0. Chords and melody change over a song, so the match is clear
where onsets alone repeat with every bar. Kept in the player's cache.
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

RATE = 20
"""Frames a second."""
SAMPLE_RATE = 22050
WINDOW = 4096
LOWEST, HIGHEST = -12.0, 20.0
MIN_PEAK = 0.2
"""Below this the match is no better than chance: no estimate."""
MIN_LEAD = 1.2
"""The best shift must beat the best other (more than a second away) by this much."""
STRETCH = 24
"""Seconds of score matched on their own, every half of it, to follow where the render drifts."""
DRIFT = 3.0
"""How far a stretch may sit from the whole song's shift."""


def _audio_chroma(path: Path) -> Any:
    import av
    import numpy as np

    with av.open(str(path)) as container:
        resampler = av.AudioResampler(format="flt", layout="mono", rate=SAMPLE_RATE)
        pieces = [
            f.to_ndarray().reshape(-1)
            for frame in container.decode(container.streams.audio[0])
            for f in resampler.resample(frame)
        ]
    if not pieces:
        return np.zeros((0, 12))
    x = np.concatenate(pieces)
    hop = SAMPLE_RATE // RATE
    count = 1 + (len(x) - WINDOW) // hop
    if count <= 0:
        return np.zeros((0, 12))
    freqs = np.fft.rfftfreq(WINDOW, 1 / SAMPLE_RATE)
    band = (freqs > 55) & (freqs < 2000)
    classes = np.round(12 * np.log2(freqs[band] / 440.0)).astype(int) % 12
    window = np.hanning(WINDOW).astype(np.float32)
    chroma = np.zeros((count, 12), dtype=np.float32)
    # in blocks, so that a long song does not need a large array at once
    for start in range(0, count, 512):
        stop = min(count, start + 512)
        index = np.arange(WINDOW)[None, :] + hop * np.arange(start, stop)[:, None]
        frames = np.multiply(x[index], window[None, :])
        spectrum = np.log1p(10 * np.abs(np.fft.rfft(frames, axis=1))[:, band])
        for pc in range(12):
            chroma[start:stop, pc] = spectrum[:, classes == pc].sum(axis=1)
    chroma -= chroma.mean(axis=1, keepdims=True)
    norm = np.linalg.norm(chroma, axis=1, keepdims=True)
    return chroma / np.where(norm > 0, norm, 1)


def _score_chroma(score: Any, count: int) -> Any:
    import numpy as np

    chroma = np.zeros((count, 12), dtype=np.float32)
    for notes in (score.vocal, score.ins):
        for note in notes:
            a = int(score.seconds(note.onset) * RATE)
            b = max(a + 1, int(score.seconds(note.onset + note.duration) * RATE))
            chroma[max(0, a) : min(count, b), (note.pitch - 69) % 12] += 1
    active = chroma.sum(axis=1) > 0
    chroma -= chroma.mean(axis=1, keepdims=True)
    norm = np.linalg.norm(chroma, axis=1, keepdims=True)
    # a new array: the division is float64 (numpy 2.5's stubs refuse it in the float32 one)
    normed = chroma / np.where(norm > 0, norm, 1)
    normed[~active] = 0
    return normed


def _match(
    audio: Any, score: Any, low: float, high: float, part: slice | None = None
) -> tuple[float, float, float]:
    """The best shift in seconds (audio later: positive), its match, and the best other one's match."""
    import numpy as np

    if part is not None:
        mask = np.zeros(len(score), dtype=bool)
        mask[part] = True
        score = np.where(mask[:, None], score, 0)
    first, last = round(low * RATE), round(high * RATE)
    values = np.full(last - first + 1, -1.0)
    # the mean over all the score's sounding frames: where a shift moves score off the recording, that part
    # counts as no match - else a shift by a repeated chorus, matching half the song, would win as well
    total = int((np.abs(score).sum(axis=1) > 0).sum())
    if total < RATE * 8:
        return 0.0, -1.0, -1.0
    for k, lag in enumerate(range(first, last + 1)):
        if lag >= 0:
            x, y = audio[lag:], score[: max(0, len(audio) - lag)]
        else:
            x, y = audio[: len(audio) + lag], score[-lag:]
        m = min(len(x), len(y))
        if m <= 0:
            continue
        values[k] = float((x[:m] * y[:m]).sum()) / total
    best = int(np.argmax(values))
    away = np.abs(np.arange(len(values)) - best) > RATE
    other = float(values[away].max()) if away.any() else -1.0
    return (first + best) / RATE, float(values[best]), other


def estimate(audio: Path, score_text: str) -> dict[str, Any] | None:
    """``{"warp": [1, b], "anchors": [[t_audio, t_score], ...], "match": ..., "lead": ...}`` or ``None`` when
    the score and the recording do not match clearly enough. ``b`` is the whole song's shift; the anchors follow
    the render where it drifts (it is no straight line: a YuE2 render runs early here and late there)."""
    try:
        from ..core.score import canonical

        score = canonical.from_abc(score_text)
        recording = _audio_chroma(audio)
    except Exception:  # noqa: BLE001 - a song that cannot be read is followed 1:1
        return None
    if len(recording) < RATE * 20:
        return None
    notes = _score_chroma(score, len(recording) + int(HIGHEST * RATE))
    b, peak, other = _match(recording, notes, LOWEST, HIGHEST)
    if peak < MIN_PEAK or peak < other * MIN_LEAD:
        return None
    # each stretch of the score on its own, near the whole song's shift
    end = int(score.seconds(score.total) * RATE)
    window, step = STRETCH * RATE, STRETCH * RATE // 2
    found: list[tuple[float, float]] = []
    for start in range(0, max(1, end - window // 2), step):
        stop = min(end, start + window)
        shift, match, _ = _match(recording, notes, b - DRIFT, b + DRIFT, slice(start, stop))
        if match >= MIN_PEAK * 0.9:
            found.append(((start + stop) / 2 / RATE, shift))
    # a stretch that disagrees with both neighbours is noise: the middle of the three wins
    anchors: list[list[float]] = []
    for k, (centre, _) in enumerate(found):
        near = sorted(shift for _, shift in found[max(0, k - 1) : k + 2])
        shift = near[len(near) // 2]
        anchors.append([round(centre + shift, 3), round(centre, 3)])
    return {
        "warp": [1.0, round(b, 3)],
        "anchors": anchors,
        "match": round(peak, 3),
        "lead": round(peak / max(other, 1e-6), 2),
    }


def cached_estimate(audio: Path, score_text: str, cache: Path) -> dict[str, Any] | None:
    """:func:`estimate`, worked out once per recording and score (``<cache>/align/<key>.json``)."""
    stat = audio.stat()
    key = hashlib.sha1(
        f"{audio.resolve()}|{stat.st_size}|{int(stat.st_mtime)}|{score_text}".encode()
    ).hexdigest()[:16]
    path = cache / "align" / f"{key}.json"
    if path.is_file():
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            known: dict[str, Any] | None = data.get("estimate")
            return known
        except (OSError, ValueError):
            pass
    result = estimate(audio, score_text)
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps({"estimate": result}), encoding="utf-8")
    except OSError:
        pass
    return result
