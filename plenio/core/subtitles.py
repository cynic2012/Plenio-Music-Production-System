"""Lyrics subtitles (SRT): when each line and each syllable is sung, measured by listening (owner's request
2026-10-15, ``docs/design/subtitles-tags-seeds.md``).

A YuE2 render is shifted against its score (1.7 s in the median song, up to 15 s), so the score's note
times alone are no subtitles. The times are **heard**: the lyrics ASR transcribes the song, its words are
matched to the lyrics, and - with a score - the score is fitted to the heard words and gives every syllable
its note. Since 2026-10-22 the ASR is Qwen3-ASR and **Qwen3-ForcedAligner** times the heard words - the
aligner was the reference of the measurement below, so its times are used as they are (``ALIGNED``).
faster-whisper, the fallback for languages the aligner does not know, starts its words early; its times
get the corrections measured against the aligner on 48 YuE2 songs no choice was made on (``WHISPER``):
median error 0.16 s per word, 82 % within 0.5 s (Whisper alone: 0.34 s, 66 %).

Two files: whole lines (``lines_srt``), and the lines painted on note by note (``notes_srt``: a cue per
syllable or word, showing the line up to what is being sung). SRT styling is not portable (YouTube reads no
markup, DaVinci Resolve has shown tags as text), so nothing here uses tags.

Pure functions; no audio, no model.
"""

from __future__ import annotations

import bisect
import difflib
import re
import statistics
import unicodedata
from collections.abc import Iterable, Mapping, Sequence
from dataclasses import dataclass, field
from typing import Any

from . import lyrics as lyrics_rules
from .alignment import LINE_GAP_S, AsrWord, drop_known_inventions, join_tokens

LEAD_S = 0.3
"""Whisper's word starts come early (0.26 s in the median word, its words being contiguous): added to every
heard start."""
FIRST_WORD_MAX_S = 0.5
"""A line's first word takes the rest before it in Whisper's times (0.7 s early in the median): it starts at
most this long before its end."""
AGREE_S = 0.35
"""The score's time is kept where it is this close to the heard one; farther, the heard time wins."""
SHIFT_SPREAD_S = 0.35
"""A line is shifted by its words' median offset only when they agree within this (median deviation)."""
MAX_SHIFT_S = 6.0
MATCH_SIMILARITY = 0.7
"""How alike a lyrics word and a heard word must be to pair them (``difflib`` ratio)."""
LINE_TAIL_S = 0.25
"""A line's cue stays this long after its last word ends, never into the next line."""
MIN_CUE_S = 0.8
GAP_S = 0.04
"""The least time between two cues."""
WORD_S = 0.3
"""The time a word not heard is given at the edge of a line (between heard words: by letters)."""
WRAP = 42
"""Characters per subtitle row (the common limit); a longer line takes two rows."""
MIN_HEARD_WORDS = 5
"""Without lyrics: fewer heard words than this are no singing (an instrumental's stray ASR words)."""


@dataclass(frozen=True)
class HeardTiming:
    """How heard word starts are corrected before they are used."""

    lead_s: float
    """Added to every heard start."""
    first_word_max_s: float | None
    """A line's first word starts at most this long before its end (``None``: as heard)."""


WHISPER = HeardTiming(LEAD_S, FIRST_WORD_MAX_S)
ALIGNED = HeardTiming(0.0, None)
"""A forced aligner's times are the measurement's reference: nothing to correct."""


def timing_for(engine: str) -> HeardTiming:
    """The timing correction of an ASR engine id (``AsrResult.engine``)."""
    return WHISPER if engine.startswith("faster-whisper") else ALIGNED


_DIRECTION = re.compile(r"^\s*[\(\[\{<].*[\)\]\}>]\s*$")
_TOKEN = re.compile(r"\S+")
_APOSTROPHES = str.maketrans({"’": "'", "‘": "'", "`": "'", "´": "'"})


def normalize(word: str) -> str:
    """A word as the matching compares it: case, apostrophes, hyphens and punctuation folded."""
    text = unicodedata.normalize("NFKC", word).translate(_APOSTROPHES).lower()
    return re.sub(r"[\W_]+", "", text)


@dataclass(frozen=True)
class Unit:
    """What a cue of the notes file adds: from ``start`` the line is shown up to character ``cut``."""

    start: float
    cut: int
    score: float | None = None
    """Where the syllable's note is in the score (seconds at the score's tempo); ``None`` without a score."""


@dataclass(frozen=True)
class TimedLine:
    text: str
    start: float
    end: float
    units: tuple[Unit, ...]


@dataclass(frozen=True)
class Subtitles:
    lines: tuple[TimedLine, ...]
    timing: str
    """``measured``: the lyrics, timed by listening; ``heard``: no lyrics given - what was heard."""
    untimed: tuple[str, ...] = ()
    """Lyrics lines left out: nothing of them was heard and there was no room for them."""
    matched: float = 0.0
    """The share of the lyrics' words that were heard."""
    notes: tuple[str, ...] = field(default=())
    warp: tuple[float, float] | None = None
    """``(a, b)``: the song against its score, ``t_audio = a * t_score + b`` (``None`` without a score)."""

    def lines_srt(self) -> str:
        return srt([(line.start, line.end, wrapped(line.text)) for line in self.lines])

    def notes_srt(self) -> str:
        cues: list[tuple[float, float, str]] = []
        for line in self.lines:
            units = [
                u
                for k, u in enumerate(line.units)
                if k + 1 == len(line.units) or line.units[k + 1].start > u.start
            ]
            for k, unit in enumerate(units):
                end = units[k + 1].start if k + 1 < len(units) else line.end
                if end - unit.start >= GAP_S:
                    cues.append((unit.start, end, wrapped(line.text, unit.cut)))
        return srt(cues)

    def to_timing(self, take: str = "") -> dict[str, Any]:
        """The times for the release record (the Plenio Player): every line with its units ``[start, cut]``
        - ``[start, cut, score]`` where the syllable has a note - and the warp against the score."""

        def unit(u: Unit) -> list[float | int]:
            return [round(u.start, 3), u.cut] + ([round(u.score, 3)] if u.score is not None else [])

        return {
            "take": take.strip(),
            "timing": self.timing,
            "warp": [round(self.warp[0], 4), round(self.warp[1], 3)] if self.warp else None,
            "lines": [
                {
                    "text": line.text,
                    "start": round(line.start, 3),
                    "end": round(line.end, 3),
                    "units": [unit(u) for u in line.units],
                }
                for line in self.lines
            ],
        }

    def to_dict(self) -> dict[str, Any]:
        return {
            "timing": self.timing,
            "lines": len(self.lines),
            "untimed": list(self.untimed),
            "matched": round(self.matched, 3),
        }


# --- the SRT text ---------------------------------------------------------------------------


def srt_time(seconds: float) -> str:
    millis = max(0, round(seconds * 1000))
    hours, rest = divmod(millis, 3_600_000)
    minutes, rest = divmod(rest, 60_000)
    secs, millis = divmod(rest, 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"


def srt(cues: Iterable[tuple[float, float, str]]) -> str:
    blocks = [
        f"{index}\n{srt_time(start)} --> {srt_time(end)}\n{text}"
        for index, (start, end, text) in enumerate(cues, start=1)
    ]
    return "\n\n".join(blocks) + "\n" if blocks else ""


def wrap_at(text: str) -> int | None:
    """Where a line longer than ``WRAP`` breaks into two rows: the space nearest the middle, one after a
    comma or full stop preferred (``None``: one row)."""
    if len(text) <= WRAP:
        return None
    spaces = [m.start() for m in re.finditer(r" ", text)]
    if not spaces:
        return None
    middle = len(text) / 2

    def cost(index: int) -> float:
        rows = max(index, len(text) - index - 1)
        return abs(index - middle) - (10 if text[index - 1] in ",;:.!?" else 0) + (50 if rows > WRAP else 0)

    return min(spaces, key=cost)


def wrapped(text: str, cut: int | None = None) -> str:
    """``text`` up to ``cut`` in its rows; the break is chosen for the whole line, so a growing line never
    jumps between rows."""
    shown = text if cut is None else text[:cut]
    split = wrap_at(text)
    if split is None or len(shown) <= split:
        return shown.rstrip()
    return shown[:split].rstrip() + "\n" + shown[split + 1 :].lstrip()


# --- the lyrics ------------------------------------------------------------------------------


@dataclass(frozen=True)
class LyricLine:
    block: int
    line: int
    text: str
    tokens: tuple[tuple[int, int], ...]
    """``(start, end)`` of every word in ``text``."""
    words: tuple[str, ...]
    """The normalised words (empty for a token without letters, which is never matched)."""


def sung_lines(text: str) -> list[LyricLine]:
    """The lyrics' sung lines in order (section tags and directions left out). ``block``/``line`` index
    ``lyrics.parse_lyrics``'s sections as the score's lyric layout does; lines before any tag are block -1."""
    parsed = lyrics_rules.parse_lyrics(text or "")
    blocks: list[tuple[int, Sequence[str]]] = [(-1, parsed.preamble)] if parsed.preamble else []
    blocks += [(b, section.lines) for b, section in enumerate(parsed.sections)]
    found = []
    for b, lines in blocks:
        for j, line in enumerate(lines):
            if _DIRECTION.match(line) or not normalize(line):
                continue
            tokens = tuple((m.start(), m.end()) for m in _TOKEN.finditer(line))
            found.append(LyricLine(b, j, line, tokens, tuple(normalize(line[a:z]) for a, z in tokens)))
    return found


def plain_lyrics(text: str) -> str:
    """The lyrics as players show them: the sung lines, a blank line between sections; tags and directions
    left out."""
    stanzas: list[list[str]] = []
    current = None
    for line in sung_lines(text):
        if line.block != current:
            stanzas.append([])
            current = line.block
        stanzas[-1].append(line.text)
    return "\n\n".join("\n".join(stanza) for stanza in stanzas)


# --- matching and fitting --------------------------------------------------------------------


def match_words(lyric: Sequence[str], heard: Sequence[str]) -> dict[int, int]:
    """Lyrics word index -> heard word index for the words that pair up (Needleman-Wunsch on words: a
    match scores its likeness, a skipped word -0.6)."""
    n, m = len(lyric), len(heard)
    gap = -0.6
    likeness: dict[tuple[str, str], float] = {}

    def like(a: str, b: str) -> float:
        key = (a, b)
        if key not in likeness:
            likeness[key] = 1.0 if a == b else difflib.SequenceMatcher(a=a, b=b).ratio() if a and b else 0.0
        return likeness[key]

    score = [[0.0] * (m + 1) for _ in range(n + 1)]
    back = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        score[i][0], back[i][0] = i * gap, 1
    for j in range(1, m + 1):
        score[0][j], back[0][j] = j * gap, 2
    for i in range(1, n + 1):
        row, above = score[i], score[i - 1]
        for j in range(1, m + 1):
            diagonal = above[j - 1] + 2 * like(lyric[i - 1], heard[j - 1]) - 1
            up, left = above[j] + gap, row[j - 1] + gap
            if diagonal >= up and diagonal >= left:
                row[j], back[i][j] = diagonal, 0
            elif up >= left:
                row[j], back[i][j] = up, 1
            else:
                row[j], back[i][j] = left, 2
    pairs: dict[int, int] = {}
    i, j = n, m
    while i > 0 and j > 0:
        move = back[i][j]
        if move == 0:
            if like(lyric[i - 1], heard[j - 1]) >= MATCH_SIMILARITY:
                pairs[i - 1] = j - 1
            i, j = i - 1, j - 1
        elif move == 1:
            i -= 1
        else:
            j -= 1
    return pairs


def fit_warp(times: Sequence[float], onsets: Sequence[float]) -> tuple[float, float]:
    """``(a, b)`` with ``t_audio = a * t_score + b``: the warp that puts the heard word starts nearest to the
    score's Vocal onsets (scale 0.92-1.08, shift +-15 s; a grid, then a finer one)."""
    import numpy as np

    marks = np.asarray(sorted(onsets), dtype=float)
    heard = np.asarray(times, dtype=float)
    if len(marks) < 2 or len(heard) < 2:
        return 1.0, 0.0

    def spread(a: float, b: float) -> float:
        x = (heard - b) / a
        i = np.clip(np.searchsorted(marks, x), 1, len(marks) - 1)
        distance = np.minimum(np.abs(x - marks[i - 1]), np.abs(x - marks[i]))
        # a hair towards the smallest shift: a steady rhythm fits as well a beat later or earlier
        return float(np.mean(np.minimum(0.5, distance))) + 0.001 * abs(b) + 0.01 * abs(a - 1)

    coarse = [(1 + da / 100, db / 10) for da in range(-8, 9) for db in range(-150, 151)]
    a0, b0 = min(coarse, key=lambda w: spread(*w))
    fine = [(a0 + da / 1000, b0 + db / 100) for da in range(-10, 11) for db in range(-10, 11)]
    return min(fine, key=lambda w: spread(*w))


def _increasing(times: Mapping[int, float]) -> set[int]:
    """The keys of the longest run of times that never goes backwards (in key order): a word matched to
    another repetition of a chorus falls out."""
    keys = sorted(times)
    tails: list[float] = []
    tail_index: list[int] = []
    previous: list[int] = [-1] * len(keys)
    for position, key in enumerate(keys):
        value = times[key]
        slot = bisect.bisect_right(tails, value)
        if slot == len(tails):
            tails.append(value)
            tail_index.append(position)
        else:
            tails[slot] = value
            tail_index[slot] = position
        previous[position] = tail_index[slot - 1] if slot else -1
    kept: set[int] = set()
    position = tail_index[-1] if tail_index else -1
    while position >= 0:
        kept.add(keys[position])
        position = previous[position]
    return kept


# --- timing ----------------------------------------------------------------------------------


@dataclass(frozen=True)
class ScoreNotes:
    """What the score says about one lyrics line: per word the score time of its first syllable, and the
    syllables (score time, cut in the line's text) - times in seconds at the score's tempo."""

    words: Mapping[int, float]
    syllables: tuple[tuple[float, int], ...]
    end: float | None


def _cuts(text: str, pieces: Sequence[tuple[str, bool]]) -> list[int]:
    """Where each syllable ends in ``text``: after as many letters as the syllables so far hold, and on to the
    end of the word (its punctuation) when the syllable ends a word."""
    letters = [k for k, ch in enumerate(text) if ch.isalnum()]
    cuts: list[int] = []
    count = 0
    for piece, end_of_word in pieces:
        count += sum(1 for ch in piece if ch.isalnum())
        if not letters:
            cuts.append(len(text))
            continue
        cut = letters[min(count, len(letters)) - 1] + 1 if count else 0
        if end_of_word:
            while cut < len(text) and not text[cut].isspace():
                cut += 1
        cuts.append(cut)
    return cuts


def score_notes(score: Any, layout: Any, lines: Sequence[LyricLine]) -> dict[tuple[int, int], ScoreNotes]:
    """Per lyrics line ``(block, line)``: where the score's lyric layout sings it (lines no note sings are
    left out). ``score`` is a ``canonical.Score``, ``layout`` its ``LyricLayout`` of the same lyrics."""
    ends = {note.onset: note.onset + note.duration for note in score.vocal}
    by_key = {(line.block, line.line): line for line in lines}
    found: dict[tuple[int, int], ScoreNotes] = {}
    for placed in layout.lines():
        line = by_key.get((placed.block, placed.line))
        if line is None or not placed.syllables:
            continue
        pieces: list[tuple[str, bool]] = []
        for syllable in placed.syllables:
            # a syllable may hold several words (they share a note)
            parts = syllable.text.split(" ")
            pieces += [(part, k < len(parts) - 1 or syllable.end_of_word) for k, part in enumerate(parts)]
        cuts = _cuts(line.text, pieces)
        times: list[float] = []
        for syllable in placed.syllables:
            times += [score.seconds(syllable.onset)] * len(syllable.text.split(" "))
        # the word of a piece is the one its last letter stands in; the first piece in a word gives its time
        words: dict[int, float] = {}
        starts = [start for start, _end in line.tokens]
        for cut, when in zip(cuts, times, strict=True):
            word = max(0, bisect.bisect_right(starts, max(0, cut - 1)) - 1)
            words.setdefault(word, when)
        last = placed.syllables[-1].onset
        held = max([ends.get(last, last), *(ends.get(h, h) for h in placed.holds)])
        found[(line.block, line.line)] = ScoreNotes(
            words, tuple(zip(times, cuts, strict=True)), score.seconds(held)
        )
    return found


def _heard_starts(
    lines: Sequence[LyricLine], heard: Sequence[AsrWord], pairs: Mapping[int, int], timing: HeardTiming
) -> dict[int, float]:
    first = set()
    index = 0
    for line in lines:
        first.add(index)
        index += len(line.tokens)
    starts = {}
    for word, h in pairs.items():
        start, end = heard[h].start, heard[h].end
        cap = timing.first_word_max_s
        if word in first and cap is not None and end - start > cap:
            start = end - cap
        starts[word] = start + timing.lead_s
    return starts


def time_lyrics(
    lyrics: str,
    heard: Sequence[AsrWord],
    *,
    duration: float,
    score: Any = None,
    layout: Any = None,
    timing: HeardTiming = WHISPER,
) -> Subtitles:
    """The lyrics' lines with their times, measured from the heard words (and the score's notes when given:
    a ``canonical.Score`` with the ``LyricLayout`` of these lyrics); ``timing`` corrects the heard starts
    (``timing_for`` the engine that heard them)."""
    lines = sung_lines(lyrics)
    if not lines:
        return Subtitles((), "measured")
    flat = [(n, k) for n, line in enumerate(lines) for k in range(len(line.tokens))]
    lyric_words = [lines[n].words[k] for n, k in flat]
    usable = [w for w in heard if normalize(w.word)]
    pairs = match_words(lyric_words, [normalize(w.word) for w in usable])
    pairs = {i: j for i, j in pairs.items() if lyric_words[i]}
    heard_at = _heard_starts(lines, usable, pairs, timing)
    times: dict[int, float] = {}
    notes: dict[tuple[int, int], ScoreNotes] = {}
    warp = (1.0, 0.0)
    shifts: dict[int, float] = {}
    if score is not None and layout is not None and score.vocal:
        notes = score_notes(score, layout, lines)
        onsets = [score.seconds(note.onset) for note in score.vocal]
        warp = fit_warp([usable[j].start for j in pairs.values()], onsets)
    a, b = warp
    index = 0
    for n, line in enumerate(lines):
        placed = notes.get((line.block, line.line))
        warped = {index + k: a * t + b for k, t in placed.words.items()} if placed else {}
        offsets = [heard_at[i] - warped[i] for i in warped if i in heard_at and i != index]
        if len(offsets) >= 2:
            middle = statistics.median(offsets)
            if (
                statistics.median(abs(x - middle) for x in offsets) <= SHIFT_SPREAD_S
                and abs(middle) <= MAX_SHIFT_S
            ):
                shifts[n] = middle
        for k in range(len(line.tokens)):
            i = index + k
            on_score = warped[i] + shifts.get(n, 0.0) if i in warped else None
            on_ear = heard_at.get(i)
            if on_score is not None and (on_ear is None or abs(on_score - on_ear) <= AGREE_S):
                times[i] = on_score
            elif on_ear is not None:
                times[i] = on_ear
        index += len(line.tokens)
    # a time that goes backwards is a word paired with another repetition: it is placed between its neighbours
    kept = _increasing(times)
    times = {i: t for i, t in times.items() if i in kept and 0 <= t <= duration}
    timed: list[TimedLine] = []
    untimed: list[str] = []
    index = 0
    starts = _line_starts(lines, times)
    for n, line in enumerate(lines):
        count = len(line.tokens)
        own = {k: times[index + k] for k in range(count) if index + k in times}
        before = timed[-1].end if timed else 0.0
        after = next((s for s in starts[n + 1 :] if s is not None), duration)
        if not own:
            room = after - before - 2 * GAP_S
            if room < max(MIN_CUE_S, 0.2 * count):
                untimed.append(line.text)
                index += count
                continue
            step = min(WORD_S, room / (count + 1))
            own = {k: before + GAP_S + step * (k + 0.5) for k in range(count)}
        word_times = _fill(line, own, before, after)
        placed = notes.get((line.block, line.line))
        units = _units(line, word_times, placed, a)
        start = units[0].start
        end = _line_end(line, word_times, placed, a, b + shifts.get(n, 0.0), usable, pairs, index, timing)
        timed.append(TimedLine(line.text, start, max(end, units[-1].start + 0.2), tuple(units)))
        index += count
    finished = _finish(timed, duration)
    matched = len(pairs) / max(1, sum(1 for w in lyric_words if w))
    return Subtitles(tuple(finished), "measured", tuple(untimed), matched, warp=warp if notes else None)


def _line_starts(lines: Sequence[LyricLine], times: Mapping[int, float]) -> list[float | None]:
    starts: list[float | None] = []
    index = 0
    for line in lines:
        own = [times[index + k] for k in range(len(line.tokens)) if index + k in times]
        starts.append(min(own) if own else None)
        index += len(line.tokens)
    return starts


def _fill(line: LyricLine, own: Mapping[int, float], before: float, after: float) -> list[float]:
    """Every word's time: the heard or scored ones, the others between their neighbours by letters (at the
    edges ``WORD_S`` per word, kept inside the room between the lines)."""
    count = len(line.tokens)
    known = sorted(own)
    result: list[float] = [0.0] * count
    for k in range(count):
        if k in own:
            result[k] = own[k]
            continue
        lower = max((q for q in known if q < k), default=None)
        upper = min((q for q in known if q > k), default=None)
        if lower is not None and upper is not None:
            span = line.tokens[upper][0] - line.tokens[lower][0]
            share = (line.tokens[k][0] - line.tokens[lower][0]) / span if span else 0.5
            result[k] = own[lower] + share * (own[upper] - own[lower])
        elif upper is not None:
            result[k] = max(before + GAP_S, own[upper] - WORD_S * (upper - k))
        elif lower is not None:
            result[k] = min(after - GAP_S, own[lower] + WORD_S * (k - lower))
    for k in range(1, count):
        result[k] = max(result[k], result[k - 1])
    return result


def _units(line: LyricLine, word_times: Sequence[float], placed: ScoreNotes | None, a: float) -> list[Unit]:
    """The cues of the notes file: a syllable per note where the score sings the line (the syllables after a
    word's first keep the score's rhythm), otherwise a word each."""
    if placed is None or not placed.syllables:
        return [Unit(word_times[k], end) for k, (_start, end) in enumerate(line.tokens)]
    units: list[Unit] = []
    starts = [start for start, _end in line.tokens]
    first_score: dict[int, float] = {}
    for when, cut in placed.syllables:
        word = max(0, bisect.bisect_right(starts, max(0, cut - 1)) - 1)
        first_score.setdefault(word, when)
        start = word_times[word] + a * (when - first_score[word])
        if units:
            start = max(start, units[-1].start)
        units.append(Unit(start, cut, when))
    # words the layout put on no note (a short phrase) are shown with the word before them
    if units and units[-1].cut < len(line.text.rstrip()):
        units[-1] = Unit(units[-1].start, len(line.text), units[-1].score)
    return units


def _line_end(
    line: LyricLine,
    word_times: Sequence[float],
    placed: ScoreNotes | None,
    a: float,
    b: float,
    heard: Sequence[AsrWord],
    pairs: Mapping[int, int],
    index: int,
    timing: HeardTiming,
) -> float:
    last = len(line.tokens) - 1
    if placed is not None and placed.end is not None and last in placed.words:
        on_score = a * placed.words[last] + b
        if abs(on_score - word_times[last]) <= AGREE_S:
            return a * placed.end + b
    h = pairs.get(index + last)
    if h is not None and heard[h].end + timing.lead_s > word_times[last]:
        return heard[h].end + timing.lead_s
    return word_times[last] + 2 * WORD_S


def _finish(lines: Sequence[TimedLine], duration: float) -> list[TimedLine]:
    """Cues that never overlap: a line ends ``LINE_TAIL_S`` after its last word, before the next line, and
    lasts at least ``MIN_CUE_S`` where there is room."""
    result: list[TimedLine] = []
    for k, line in enumerate(lines):
        start = line.start
        if result and start < result[-1].end + GAP_S:
            start = result[-1].end + GAP_S
        limit = lines[k + 1].start - GAP_S if k + 1 < len(lines) else duration
        end = min(max(line.end + LINE_TAIL_S, start + MIN_CUE_S), limit)
        if end - start < GAP_S:
            continue
        units = tuple(Unit(min(max(u.start, start), end), u.cut, u.score) for u in line.units)
        result.append(TimedLine(line.text, start, end, units))
    return result


def time_heard(heard: Sequence[AsrWord], *, duration: float, timing: HeardTiming = WHISPER) -> Subtitles:
    """Subtitles of what was heard, for a song whose lyrics are not known: a line per ASR segment, split at
    pauses longer than ``alignment.LINE_GAP_S``; Whisper's known inventions left out."""
    kept, _dropped = drop_known_inventions([w for w in heard if normalize(w.word)])
    if len(kept) < MIN_HEARD_WORDS:
        return Subtitles((), "heard", notes=("no singing heard",))
    groups: list[list[AsrWord]] = []
    for word in kept:
        if (
            not groups
            or word.segment != groups[-1][-1].segment
            or word.start - groups[-1][-1].end > LINE_GAP_S
        ):
            groups.append([])
        groups[-1].append(word)
    lines: list[TimedLine] = []
    for group in groups:
        text = join_tokens([w.word for w in group])
        units: list[Unit] = []
        cut = 0
        for k, word in enumerate(group):
            start, end = word.start, word.end
            cap = timing.first_word_max_s
            if k == 0 and cap is not None and end - start > cap:
                start = end - cap
            cut = text.find(word.word, cut) + len(word.word) if word.word in text[cut:] else len(text)
            units.append(Unit(start + timing.lead_s, cut))
        for k in range(1, len(units)):
            units[k] = Unit(max(units[k].start, units[k - 1].start), units[k].cut)
        lines.append(TimedLine(text, units[0].start, group[-1].end + timing.lead_s, tuple(units)))
    return Subtitles(tuple(_finish(lines, duration)), "heard")
