"""Check Sung Words after Export Release (owner's request 2026-10-23): the writer is asked only when the take's
sung lines have words the lyrics lack; the corrections go into the record and (sung).srt, once."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pytest

pytestmark = pytest.mark.comfy

LYRICS = "[Verse]\nWe walk down the riverside\n\n[Chorus]\nHold me close tonight"
SUNG = ["We walk doun the riverside", "Hold me close tonight"]


def node(name: str) -> Any:
    from plenio.comfy import nodes

    return next(n for n in nodes.NODES if n.GET_SCHEMA().node_id == name)


def write_record(folder: Path, sung: bool = True) -> Path:
    from plenio.core.release import file_facts, record_fingerprint

    srt = folder / "Song (sung).srt"
    srt.write_text("1\n00:00:00,000 --> 00:00:01,000\nWe walk doun the riverside\n", encoding="utf-8")
    lines = [
        {"text": t, "start": float(k), "end": k + 0.9, "units": [[k, len(t)]]} for k, t in enumerate(SUNG)
    ]
    timing: dict[str, Any] = {"take": "", "timing": "measured", "warp": None, "lines": lines}
    if sung:
        timing["sung"] = {"text": "[Verse]\n" + SUNG[0] + "\n\n[Chorus]\n" + SUNG[1], "lines": lines}
    record: dict[str, Any] = {
        "schema": "plenio.release/1",
        "title": "Song",
        "documents": {"lyrics": {"text": LYRICS}},
        "files": [{**file_facts(srt), "role": "subtitles", "subtitles": "sung", "timing": "sung"}],
        "timing": [timing],
    }
    record["fingerprint"] = record_fingerprint(record)
    path = folder / "Song.plenio.json"
    path.write_text(json.dumps(record), encoding="utf-8")
    return path


def test_the_writer_is_asked_only_when_there_are_words_to_check(comfy_path: Path, tmp_path: Path) -> None:
    apply = node("PlenioApplySungCheck")
    record = write_record(tmp_path)
    assert apply.check_lazy_status(record=str(record)) == ["answer"]
    prompt, schema = node("PlenioComposeSungCheck").execute(record=str(record)).result
    assert "[doun | written: down]" in prompt and json.loads(schema)["required"] == ["fixes"]
    other = tmp_path / "other"
    other.mkdir()
    plain = write_record(other, sung=False)
    assert apply.check_lazy_status(record=str(plain)) == []
    assert node("PlenioComposeSungCheck").execute(record=str(plain)).result[0] == ""
    assert apply.execute(record=str(plain)).result[1].status.value == "skipped"


def test_the_corrections_go_into_the_record_and_the_subtitles_once(comfy_path: Path, tmp_path: Path) -> None:
    from plenio.core.release import file_facts, record_fingerprint

    apply = node("PlenioApplySungCheck")
    record = write_record(tmp_path)
    answer = '{"fixes": [{"line": 1, "heard": "doun", "word": "down", "sure": 0.97}]}'
    out = apply.execute(record=str(record), answer=answer)
    assert out.result[0] == str(record)
    report = out.result[1]
    assert report.status.value == "ok" and "1 of 1 word(s)" in report.summary
    data = json.loads(record.read_text(encoding="utf-8"))
    sung = data["timing"][0]["sung"]
    assert sung["lines"][0]["text"] == "We walk down the riverside"
    assert sung["corrected"] == [{"line": 1, "heard": "doun", "word": "down", "sure": 0.97}]
    srt = tmp_path / "Song (sung).srt"
    assert "We walk down the riverside" in srt.read_text(encoding="utf-8")
    assert data["files"][0]["sha256"] == file_facts(srt)["sha256"]
    assert data["fingerprint"] == record_fingerprint(data)
    # checked once: a second run asks no writer
    assert apply.check_lazy_status(record=str(record)) == []
