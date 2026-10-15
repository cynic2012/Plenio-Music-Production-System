"""Lyrics subtitles (owner's request 2026-10-15): times from what was heard - with a score, on its notes -,
whole lines and lines painted on note by note, SRT that every player reads."""

from __future__ import annotations

from plenio.core import subtitles as s
from plenio.core.alignment import AsrWord
from plenio.core.score import canonical, lyric_layout

HEAD = """X:1
T:
M:4/4
L:1/8
Q:1/4=120
V: Vocal clef=treble name="Vocal Melody" snm="Vocal"
V: Ins clef=treble name="Ins Melody" snm="Inst."
K:C
"""
# 120 BPM, L:1/8 = 0.25 s: a bar of rest, then two phrases of eight eighths with a bar's rest between
SCORE = (
    HEAD
    + "% intro\nV: Vocal\nz8|\nV: Ins\nC8|\n"
    + "% verse\nV: Vocal\nCDEF GABc|z8|cBAG FEDC|z8|\nV: Ins\nC8|C8|C8|C8|\n"
)
LYRICS = "[Verse]\nwalking down the river side\nsinging songs of yesterday"


def heard(words: list[tuple[str, float, float]], segment: int = 0) -> list[AsrWord]:
    return [AsrWord(start, end, word, 0.9, segment) for word, start, end in words]


def whisper_like(times: list[tuple[str, float]], length: float = 0.25) -> list[AsrWord]:
    """Words as Whisper times them: each starts where the one before ends (the first of a phrase takes the rest
    before it), so the starts are early."""
    found: list[AsrWord] = []
    previous_end = 0.0
    for word, start in times:
        found.append(AsrWord(previous_end, start + length, word, 0.9, 0))
        previous_end = start + length
    return found


def test_srt_format() -> None:
    assert s.srt_time(3723.4567) == "01:02:03,457"
    text = s.srt([(1.0, 2.5, "first line"), (3.0, 4.0, "second\nrow")])
    assert (
        text
        == "1\n00:00:01,000 --> 00:00:02,500\nfirst line\n\n2\n00:00:03,000 --> 00:00:04,000\nsecond\nrow\n"
    )
    assert s.srt([]) == ""


def test_long_lines_wrap_once_and_grow_in_their_rows() -> None:
    line = "When the morning comes, I will be standing at your door again"
    split = s.wrap_at(line)
    assert split is not None and line[split - 1] == ","  # a comma near the middle
    assert s.wrapped(line) == "When the morning comes,\nI will be standing at your door again"
    assert s.wrapped(line, 9) == "When the"  # still on the first row
    assert s.wrapped(line, 30) == "When the morning comes,\nI will"
    assert s.wrap_at("short line") is None


def test_sung_lines_and_plain_lyrics_leave_out_tags_and_directions() -> None:
    lyrics = "[Intro]\n(guitar)\n\n[Verse]\nOne line, sung\nTwo\n\n[Chorus]\nThree"
    lines = s.sung_lines(lyrics)
    assert [line.text for line in lines] == ["One line, sung", "Two", "Three"]
    assert lines[0].words == ("one", "line", "sung")
    assert s.plain_lyrics(lyrics) == "One line, sung\nTwo\n\nThree"


def test_words_pair_up_across_a_skipped_and_an_extra_word() -> None:
    pairs = s.match_words(["walk", "down", "the", "river"], ["walking", "down", "a", "the", "rivers"])
    assert pairs == {0: 0, 1: 1, 2: 3, 3: 4}  # alike enough ("walk", "walking"); "a" is extra
    assert s.match_words(["sun"], ["moon"]) == {}


def test_the_warp_finds_how_the_render_is_shifted_against_the_score() -> None:
    gaps = [0.5, 0.25, 0.75, 0.5, 1.0, 0.25, 0.25, 1.5]  # a sung rhythm, not a grid
    onsets = [sum(gaps[: k % 8]) + 4.0 * (k // 8) for k in range(64)]
    times = [t - 1.7 + 0.02 * ((k % 5) - 2) for k, t in enumerate(onsets[5:50])]
    a, b = s.fit_warp(times, onsets)
    assert abs(a - 1.0) <= 0.002 and abs(b + 1.7) <= 0.05
    # a steady grid fits a beat later as well as here: the smallest shift wins
    grid = [0.5 * k for k in range(60)]
    assert s.fit_warp([t + 0.04 for t in grid[4:40]], grid) == (1.0, 0.04)


def test_without_a_score_the_heard_times_are_corrected_for_whisper() -> None:
    sung = [("walking", 2.0), ("down", 2.5), ("the", 3.0), ("river", 3.5), ("side", 4.0)]
    sung += [("singing", 8.0), ("songs", 8.5), ("of", 9.0), ("yesterday", 9.5)]
    timed = s.time_lyrics(LYRICS, whisper_like(sung), duration=20.0)
    assert timed.timing == "measured" and timed.matched == 1.0
    first, second = timed.lines
    # Whisper started "singing" where "side" ended (4.25 s): the line's first word is capped, then 0.3 s on
    assert abs(first.units[1].start - 2.55) < 0.01  # down: Whisper's 2.25 (where "walking" ended) + 0.3
    assert 7.5 <= second.start <= 8.2
    assert second.start >= first.end  # cues never overlap
    assert [u.cut for u in second.units] == [7, 13, 16, 26]  # a word each: "singing", "singing songs" ...


def test_a_line_nobody_sang_is_left_out_when_there_is_no_room() -> None:
    lyrics = "[Verse]\nfirst line here\nnever heard at all\nthird line here"
    words = heard([("first", 1.0, 1.3), ("line", 1.3, 1.6), ("here", 1.6, 2.0)])
    words += heard([("third", 2.2, 2.5), ("line", 2.5, 2.8), ("here", 2.8, 3.1)])
    timed = s.time_lyrics(lyrics, words, duration=10.0)
    assert [line.text for line in timed.lines] == ["first line here", "third line here"]
    assert timed.untimed == ("never heard at all",)


def test_with_a_score_the_syllables_sit_on_their_notes() -> None:
    score = canonical.from_abc(SCORE)
    layout = lyric_layout.layout(score, LYRICS)
    notes = s.score_notes(score, layout, s.sung_lines(LYRICS))
    (first_key, first), (_, second) = sorted(notes.items())
    assert first_key == (0, 0) and first.words[0] == 2.0  # after the intro bar: 4 beats at 120 BPM
    # the render sings 1.5 s earlier than its score; Whisper's starts 0.3 s early, as measured
    shift = -1.5
    sung = [(w, first.words[k] + shift) for k, w in enumerate(["walking", "down", "the", "river", "side"])]
    sung += [(w, second.words[k] + shift) for k, w in enumerate(["singing", "songs", "of", "yesterday"])]
    words = heard([(w, t - s.LEAD_S, t + 0.2) for w, t in sung])
    timed = s.time_lyrics(LYRICS, words, duration=20.0, score=score, layout=layout)
    line = timed.lines[0]
    assert abs(line.start - (2.0 + shift)) < 0.06
    # "walking" has two notes: its second syllable keeps the score's rhythm (an eighth later)
    assert [round(u.start - line.start, 2) for u in line.units[:3]] == [0.0, 0.25, 0.5]
    assert [line.text[: u.cut] for u in line.units[:3]] == ["wal", "walking", "walking down"]
    notes_srt = timed.notes_srt()
    assert "\nwal\n" in notes_srt and "\nwalking down the river side\n" in notes_srt
    assert timed.lines_srt().count(" --> ") == 2


def test_without_lyrics_the_words_as_heard_and_no_inventions() -> None:
    words = heard(
        [("Hold", 1.0, 1.3), ("on", 1.3, 1.6), ("to", 1.6, 1.8), ("the", 1.8, 2.0), ("light", 2.0, 2.6)]
    )
    words += heard(
        [("Thank", 30.0, 30.2), ("you", 30.2, 30.4), ("for", 30.4, 30.5), ("watching!", 30.5, 31.0)], 1
    )
    timed = s.time_heard(words, duration=40.0)
    assert timed.timing == "heard"
    assert [line.text for line in timed.lines] == ["Hold on to the light"]
    assert s.time_heard(heard([("la", 1.0, 1.2)]), duration=5.0).lines == ()
