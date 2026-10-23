"""Misheard words in what a take sings (owner's request 2026-10-23): the lyrics ASR writes what it heard - a
word it misheard stands in the lyrics *as sung* as heard. The writer model reads the song's lyrics and every
line as heard, with the words the lyrics do not have there marked, and names the words it is sure were
misheard, each with the word that was most likely sung. A correction is taken only when it is sure enough
(``MIN_SURE``), replaces a marked word, and has as many syllables as the word heard; the record keeps every
correction beside the lines (``timing[].sung.corrected``), so what was heard stays documented.

    found = candidates(lyrics, [line["text"] for line in sung["lines"]])
    prompt = check_prompt(lyrics, sung_texts, found, language)
    fixes, refused = parse_answer(answer, found, language)
    updated = corrected_sung(sung, lyrics, fixes)

Pure: no model, no files.
"""

from __future__ import annotations

import json
import re
from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from typing import Any

from . import subtitles as sub
from .syllables import count_word

MIN_SURE = 0.8
"""How sure the writer must be that a word was misheard (0 to 1): below it the word stays as heard."""
MAX_MARKED = 120
"""Marked words in one prompt at most (a take that sings other lyrics altogether has little to correct)."""
SCHEMA_VERSION = "plenio.sung_check/1"
ANSWER_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "fixes": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "line": {"type": "integer"},
                    "heard": {"type": "string"},
                    "word": {"type": "string"},
                    "sure": {"type": "number"},
                },
                "required": ["line", "heard", "word", "sure"],
            },
        }
    },
    "required": ["fixes"],
}


@dataclass(frozen=True)
class Candidate:
    """Words of a sung line that the lyrics do not have there: one word, or several in a row (a phrase can be
    heard as other words - *a detour* as *ready to*)."""

    line: int
    """The sung line (0-based)."""
    start: int
    end: int
    """Where the words are in the line's text."""
    word: str
    written: str = ""
    """The lyrics' word it was paired with, when one word was heard as a similar one (``""``: none)."""


@dataclass(frozen=True)
class Fix:
    line: int
    start: int
    end: int
    """The marked word's place in the line."""
    heard: str
    word: str
    sure: float

    def to_record(self) -> dict[str, Any]:
        return {"line": self.line + 1, "heard": self.heard, "word": self.word, "sure": round(self.sure, 2)}


def _tokens(text: str) -> list[tuple[int, int]]:
    return [(m.start(), m.end()) for m in sub._TOKEN.finditer(text)]


def _pairs(lyrics: str, sung: Sequence[str]) -> tuple[list[str], list[tuple[int, int, int]], dict[int, int]]:
    """The lyrics' words, the sung words as ``(line, start, end)``, and sung word -> lyrics word."""
    lyric_words = [w for line in sub.sung_lines(lyrics) for w in line.words]
    words = [(n, a, z) for n, text in enumerate(sung) for a, z in _tokens(text)]
    heard = [sub.normalize(sung[n][a:z]) for n, a, z in words]
    pairs = sub.match_words(lyric_words, heard)
    return lyric_words, words, {j: i for i, j in pairs.items() if lyric_words[i] and heard[j]}


def candidates(lyrics: str, sung: Sequence[str]) -> list[Candidate]:
    """The words of the sung lines that the lyrics do not have there: heard where no lyrics word is - the words
    of a row in one candidate -, or heard as a similar word (``Candidate.written``)."""
    if not lyrics.strip():
        return []
    lyric_words, words, paired = _pairs(lyrics, sung)
    found: list[Candidate] = []
    run: Candidate | None = None
    for j, (n, a, z) in enumerate(words):
        text = sung[n][a:z]
        if not sub.normalize(text):
            continue
        i = paired.get(j)
        if i is None:
            if run is not None and run.line == n and not run.written:
                run = Candidate(n, run.start, z, sung[n][run.start : z])
                found[-1] = run
            else:
                run = Candidate(n, a, z, text)
                found.append(run)
            continue
        run = None
        if lyric_words[i] != sub.normalize(text):
            found.append(Candidate(n, a, z, text, lyric_words[i]))
    return found


def syllables(text: str, language: str = "") -> int:
    """Syllables of a word or a few words: a Chinese or Japanese character is one."""
    cjk = len(sub._CJK_CHAR.findall(text))
    rest = sub._CJK_CHAR.sub(" ", text)
    return cjk + sum(count_word(w, language) for w in re.findall(r"[^\W\d_][\w'’-]*", rest))


def _near_lyrics(lyrics: str, sung: Sequence[str]) -> list[str]:
    """Per sung line, the lyrics line(s) its words were paired with - else those of the nearest line that has
    some."""
    lines = sub.sung_lines(lyrics)
    owner_of: list[int] = []
    for k, line in enumerate(lines):
        owner_of += [k] * len(line.words)
    _lyric_words, words, paired = _pairs(lyrics, sung)
    owners: list[list[int]] = [[] for _ in sung]
    for j, (n, _a, _z) in enumerate(words):
        i = paired.get(j)
        if i is not None and owner_of[i] not in owners[n]:
            owners[n].append(owner_of[i])
    near: list[str] = []
    for n in range(len(sung)):
        found = owners[n]
        for step in range(1, len(sung)):
            if found:
                break
            for m in (n - step, n + step):
                if 0 <= m < len(sung) and owners[m]:
                    found = owners[m]
                    break
        near.append(" / ".join(lines[k].text for k in found[:2]))
    return near


def check_prompt(lyrics: str, sung: Sequence[str], found: Sequence[Candidate], language: str = "") -> str:
    """The question for the writer model: the lyrics, the lines as heard with the marked words."""
    marked = {(c.line, c.start): c for c in found[:MAX_MARKED]}
    near = _near_lyrics(lyrics, sung)
    rows = []
    for n, text in enumerate(sung):
        out, at = "", 0
        for a, _z in _tokens(text):
            c = marked.get((n, a))
            if c is not None and a >= at:
                out += text[at:a] + (f"[{c.word} | written: {c.written}]" if c.written else f"[{c.word}]")
                at = c.end
        out += text[at:]
        if out != text:
            rows.append(f"{n + 1}: {out}" + (f'    (lyrics there: "{near[n]}")' if near[n] else ""))
    language_line = f" The song is sung in {language}." if language else ""
    return (
        "You check what a speech recognizer heard in a song against the lyrics the song was written with."
        f"{language_line} The music model sang most lines as written, but it sometimes changes, repeats or "
        "invents words - and the recognizer sometimes mishears a sung word as another one that sounds alike.\n\n"
        f"The lyrics as written:\n<<<\n{sub.plain_lyrics(lyrics)}\n>>>\n\n"
        "Lines as heard; the words in [brackets] are not in the written lyrics at that place - one word, or "
        "several heard in a row ('written:' names the lyrics' word one was heard instead of):\n"
        + "\n".join(rows)
        + "\n\nFor each bracket decide whether it was most likely MISHEARD: the singer sang other words that "
        "sound alike. Only then give what was most likely sung for the WHOLE bracket - it must fit the line's "
        "meaning and grammar, sound like what was heard and have the same number of syllables; the words outside "
        "the brackets stay as they are. Words that make sense as sung (an ad-lib, words the music model chose, a "
        "repetition) stay: leave them out.\n\n"
        'Answer with JSON only: {"fixes": [{"line": 4, "heard": "doun", "word": "down", "sure": 0.9}]} - '
        '"line" is the number before the line, "heard" the whole bracket\'s words, "word" what replaces them, '
        f'"sure" how likely they were misheard (0 to 1). List only what you are sure of ({MIN_SURE} or more); '
        'none: {"fixes": []}.'
    )


def _json(text: str) -> Any:
    clean = re.sub(r"<think>.*?</think>", "", text or "", flags=re.DOTALL)
    start, end = clean.find("{"), clean.rfind("}")
    if start < 0 or end <= start:
        return None
    try:
        return json.loads(clean[start : end + 1])
    except ValueError:
        return None


def parse_answer(
    answer: str, found: Sequence[Candidate], language: str = "", sung: Sequence[str] = ()
) -> tuple[list[Fix], list[str]]:
    """The fixes the writer named that hold: marked words, sure enough, as many syllables, no word twice in a
    row that the line (``sung``) did not have. And why the others were not taken."""
    lines_of = dict(enumerate(sung))
    data = _json(answer)
    if not isinstance(data, Mapping) or not isinstance(data.get("fixes"), list):
        return [], ["the writer's answer had no fixes list"]
    by_line: dict[int, list[Candidate]] = {}
    for c in found:
        by_line.setdefault(c.line, []).append(c)
    fixes: list[Fix] = []
    refused: list[str] = []
    used: set[tuple[int, int]] = set()
    for item in data["fixes"]:
        if not isinstance(item, Mapping):
            continue
        try:
            line = int(item.get("line", 0)) - 1
            sure = float(item.get("sure", 0))
        except (TypeError, ValueError):
            continue
        heard, word = str(item.get("heard", "")).strip(), str(item.get("word", "")).strip()
        match = next(
            (
                c
                for c in by_line.get(line, [])
                if sub.normalize(c.word) == sub.normalize(heard) and (c.line, c.start) not in used
            ),
            None,
        )
        if match is None:
            refused.append(f"'{heard}' (line {line + 1}) is no marked word")
        elif sure < MIN_SURE:
            continue  # not sure enough: it stays as heard
        elif (
            not word
            or len(word.split()) > len(match.word.split()) + 2
            or not re.fullmatch(r"[^\W\d_][\w'’ -]*", word)
        ):
            refused.append(f"'{heard}' -> '{word}' (line {line + 1}): not a word")
        elif sub.normalize(word) == sub.normalize(heard):
            continue
        elif syllables(word, language) != syllables(match.word, language):
            refused.append(
                f"'{heard}' -> '{word}' (line {line + 1}): {syllables(word, language)} syllables, "
                f"{syllables(match.word, language)} heard"
            )
        elif _doubles(lines_of.get(match.line, ""), match, word):
            refused.append(f"'{heard}' -> '{word}' (line {line + 1}): a word twice in a row")
        else:
            used.add((match.line, match.start))
            fixes.append(Fix(match.line, match.start, match.end, match.word, word, sure))
    return fixes, refused


_TWICE = re.compile(r"\b(\w+)[\s,]+\1\b", re.IGNORECASE)


def _doubles(line: str, match: Candidate, word: str) -> bool:
    """A correction that puts a word twice in a row where the line had none (``to`` -> ``I`` before ``I``)."""
    if not line:
        return False
    after = line[: match.start] + word + line[match.end :]
    return bool(_TWICE.search(after)) and not _TWICE.search(line)


def _replace(line: Mapping[str, Any], at: int, end: int, word: str) -> dict[str, Any]:
    """A timed line with the characters ``at:end`` replaced: the cuts of its units after them shift."""
    text = str(line["text"])
    shift = len(word) - (end - at)
    units = []
    for unit in line.get("units") or []:
        cut = int(unit[1])
        if cut >= end:
            cut += shift
        elif cut > at:
            cut = at + len(word)
        units.append([unit[0], cut, *unit[2:]])
    return {**dict(line), "text": text[:at] + word + text[end:], "units": units}


def corrected_sung(sung: Mapping[str, Any], lyrics: str, fixes: Sequence[Fix]) -> dict[str, Any]:
    """The record's ``sung`` with the fixes in its lines and text, the corrections listed, and how far the
    take follows its lyrics counted again."""
    lines = [dict(line) for line in sung.get("lines") or []]
    for fix in sorted(fixes, key=lambda f: (f.line, -f.start)):  # from a line's end: the places before stay
        if 0 <= fix.line < len(lines):
            lines[fix.line] = _replace(lines[fix.line], fix.start, fix.end, fix.word)
    texts = [str(line["text"]) for line in lines]
    rows = iter(texts)
    tagged = [
        row if not row.strip() or (row.startswith("[") and row.rstrip().endswith("]")) else next(rows, row)
        for row in str(sung.get("text") or "").split("\n")
    ]
    lyric_words, words, paired = _pairs(lyrics, texts)
    counted = sum(1 for w in lyric_words if w)
    extra = sum(1 for j, (n, a, z) in enumerate(words) if j not in paired and sub.normalize(texts[n][a:z]))
    return {
        **dict(sung),
        "lines": lines,
        "text": "\n".join(tagged),
        "written_heard": round(len(paired) / max(1, counted), 3),
        "extra_words": extra,
        "corrected": [*list(sung.get("corrected") or []), *(f.to_record() for f in fixes)],
    }
