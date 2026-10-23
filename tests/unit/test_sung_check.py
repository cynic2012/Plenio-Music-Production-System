"""Misheard words in the lyrics as sung (owner's request 2026-10-23): the words the lyrics lack are marked for the
writer model; only sure corrections with as many syllables are taken, and the record keeps each one."""

from __future__ import annotations

import json

from plenio.core import sung_check as sc

LYRICS = "[Verse]\nWe walk down the riverside\nUnder the silver moon\n\n[Chorus]\nHold me close tonight"
SUNG = ["We walk doun the riverside", "Under the silver moon oh yeah", "Hold me clothes tonight"]


def sung_record() -> dict:
    return {
        "text": "[Verse]\n" + "\n".join(SUNG[:2]) + "\n\n[Chorus]\n" + SUNG[2],
        "lines": [
            {"text": t, "start": float(k), "end": k + 0.9, "units": [[k, 2], [k + 0.3, 7], [k + 0.6, len(t)]]}
            for k, t in enumerate(SUNG)
        ],
        "written_heard": 0.8,
        "extra_words": 4,
        "not_sung": [],
        "sections": [],
    }


def test_the_words_the_lyrics_lack_are_marked() -> None:
    found = sc.candidates(LYRICS, SUNG)
    assert [(c.line, c.word, c.written) for c in found] == [
        (0, "doun", "down"),  # heard as a similar word: the lyrics' word goes with it
        (1, "oh yeah", ""),  # words in a row: one bracket (a phrase can be heard as other words)
        (2, "clothes", ""),
    ]
    assert SUNG[0][found[0].start : found[0].end] == "doun"
    prompt = sc.check_prompt(LYRICS, SUNG, found, "English")
    assert "1: We walk [doun | written: down] the riverside" in prompt
    assert "2: Under the silver moon [oh yeah]" in prompt
    assert '3: Hold me [clothes] tonight    (lyrics there: "Hold me close tonight")' in prompt
    assert "Hold me close tonight" in prompt.split("Lines as heard")[0]  # the lyrics as written come first
    assert sc.candidates("", SUNG) == []


def test_only_sure_corrections_with_as_many_syllables_are_taken() -> None:
    found = sc.candidates(LYRICS, SUNG)
    answer = json.dumps(
        {
            "fixes": [
                {"line": 1, "heard": "doun", "word": "down", "sure": 0.95},
                {"line": 3, "heard": "clothes", "word": "closer", "sure": 0.9},  # two syllables for one
                {"line": 3, "heard": "clothes", "word": "close", "sure": 0.9},
                {"line": 2, "heard": "oh yeah", "word": "open", "sure": 0.5},  # not sure enough: stays
                {"line": 2, "heard": "yeah", "word": "yes", "sure": 0.9},  # a part of a bracket
                {"line": 2, "heard": "silver", "word": "golden", "sure": 0.9},  # no marked word
            ]
        }
    )
    fixes, refused = sc.parse_answer("<think>hm</think> Here: " + answer, found, "English", SUNG)
    assert [(f.line, f.heard, f.word) for f in fixes] == [(0, "doun", "down"), (2, "clothes", "close")]
    assert any("2 syllables, 1 heard" in why for why in refused)
    assert any("'silver' (line 2) is no marked word" in why for why in refused)
    assert any("'yeah' (line 2) is no marked word" in why for why in refused)
    assert sc.parse_answer("no json at all", found)[0] == []
    assert sc.syllables("riverside", "English") == 3 and sc.syllables("月光", "") == 2


def test_the_corrections_go_into_the_lines_and_are_kept_with_the_word_heard() -> None:
    found = sc.candidates(LYRICS, SUNG)
    fixes, _ = sc.parse_answer(
        '{"fixes": [{"line": 1, "heard": "doun", "word": "down", "sure": 0.95}, '
        '{"line": 3, "heard": "clothes", "word": "close", "sure": 0.9}]}',
        found,
        "English",
    )
    out = sc.corrected_sung(sung_record(), LYRICS, fixes)
    assert out["lines"][0]["text"] == "We walk down the riverside"
    assert out["lines"][2]["text"] == "Hold me close tonight"
    # the cuts after a shorter word moved with it; the ones before stay
    assert out["lines"][2]["units"] == [[2, 2], [2.3, 7], [2.6, len("Hold me close tonight")]]
    assert out["text"].split("\n") == [
        "[Verse]",
        "We walk down the riverside",
        "Under the silver moon oh yeah",
        "",
        "[Chorus]",
        "Hold me close tonight",
    ]
    assert out["corrected"] == [
        {"line": 1, "heard": "doun", "word": "down", "sure": 0.95},
        {"line": 3, "heard": "clothes", "word": "close", "sure": 0.9},
    ]
    assert out["extra_words"] == 2 and out["written_heard"] == 1.0  # counted again: 'oh yeah' stay its own


def test_a_phrase_heard_as_other_words_is_corrected_whole() -> None:
    """A real answer of Qwen3.5 9B (2026-10-23): "A detour I don't know how" was heard as "ready to I don't know
    how"; word by word the writer made "to" an "I" - a word twice in a row - and "ready" an "A" (one syllable)."""
    lyrics = "[Verse]\nA detour I don't know how\n\n[Chorus]\nI want you"
    sung = ["ready to I don't know how", "I won't you"]
    found = sc.candidates(lyrics, sung)
    assert [(c.line, c.word, c.written) for c in found] == [(0, "ready to", ""), (1, "won't", "want")]
    words = {
        "fixes": [
            {"line": 1, "heard": "to", "word": "I", "sure": 0.9},
            {"line": 2, "heard": "won't", "word": "I", "sure": 0.9},
        ]
    }
    fixes, refused = sc.parse_answer(json.dumps(words), found, "English", sung)
    assert fixes == [] and any("a word twice in a row" in why for why in refused)
    whole = {"fixes": [{"line": 1, "heard": "ready to", "word": "A detour", "sure": 0.9}]}
    fixes, _ = sc.parse_answer(json.dumps(whole), found, "English", sung)
    assert [(f.heard, f.word) for f in fixes] == [("ready to", "A detour")]
