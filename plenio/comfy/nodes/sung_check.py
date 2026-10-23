"""Check Sung Words: misheard words in the lyrics as sung, corrected by the writer model (owner's request
2026-10-23, ``core.sung_check``). After Export Release: Compose asks about the words of the take's sung lines
that its lyrics do not have; Apply takes the corrections that hold and writes them into the release record and
``(sung).srt`` - each one listed with the word heard."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from comfy_api.latest import io

from ...core import subtitles as subtitle_rules
from ...core import sung_check as rules
from ...core.files import atomic_write_text
from ...core.release import file_facts, record_fingerprint
from ...core.reports import Report, Status
from ..sheet_music import RECORD_LOCK
from ..types import ReportType

RECORD_TOOLTIP = "The release record Export Release wrote (its 'record' output)."
LANGUAGE_TOOLTIP = "The language the song is sung in (empty: the brief's, else guessed from the lyrics)."


def _read(path: str) -> dict[str, Any] | None:
    try:
        data = json.loads(Path(path).read_text(encoding="utf-8"))
    except (OSError, ValueError, TypeError):
        return None
    return data if isinstance(data, dict) else None


def _language(record: dict[str, Any], given: str) -> str:
    if given.strip():
        return given.strip()
    for node in (record.get("prompt") or {}).values():
        if isinstance(node, dict) and node.get("class_type") in ("PlenioSongBrief", "PlenioCoverBrief"):
            language = str((node.get("inputs") or {}).get("vocals.language") or "").strip()
            if language and language.lower() != "auto":
                return language
    from ...core.syllables import guess_language

    return guess_language(_lyrics(record))


def _lyrics(record: dict[str, Any]) -> str:
    entry = (record.get("documents") or {}).get("lyrics") or {}
    return str(entry.get("text") or "") if isinstance(entry, dict) else ""


def _sung(record: dict[str, Any]) -> tuple[int, dict[str, Any]] | None:
    """The first take with what it sings (the templates export one), unless it was checked already."""
    for index, timing in enumerate(record.get("timing") or []):
        sung = timing.get("sung") if isinstance(timing, dict) else None
        if isinstance(sung, dict) and sung.get("lines"):
            return None if "corrected" in sung else (index, sung)
    return None


def _found(record: dict[str, Any] | None) -> tuple[list[rules.Candidate], int, dict[str, Any]] | None:
    if record is None:
        return None
    taken = _sung(record)
    if taken is None:
        return None
    index, sung = taken
    found = rules.candidates(_lyrics(record), [str(line.get("text") or "") for line in sung["lines"]])
    return (found, index, sung) if found else None


class PlenioComposeSungCheck(io.ComfyNode):
    @classmethod
    def define_schema(cls) -> io.Schema:
        return io.Schema(
            node_id="PlenioComposeSungCheck",
            display_name="Compose Sung Check",
            category="Plenio/Lyrics",
            description=(
                "The question about the lyrics as sung: the song's lyrics and every line the take sings, with the "
                "words the lyrics do not have there marked. Connect it to a writer (Generate Text or Local LLM, "
                "which also takes the schema) and the answer to Apply Sung Check."
            ),
            inputs=[
                io.String.Input("record", force_input=True, tooltip=RECORD_TOOLTIP),
                io.String.Input("language", optional=True, default="", tooltip=LANGUAGE_TOOLTIP),
            ],
            outputs=[
                io.String.Output(display_name="prompt", tooltip="The question for the writer model."),
                io.String.Output(display_name="schema", tooltip="The answer's JSON schema, for Local LLM."),
            ],
        )

    @classmethod
    def execute(cls, record: str, language: str = "") -> io.NodeOutput:
        data = _read(record)
        found = _found(data)
        if data is None or found is None:
            return io.NodeOutput("", json.dumps(rules.ANSWER_SCHEMA))
        candidates, _index, sung = found
        texts = [str(line.get("text") or "") for line in sung["lines"]]
        prompt = rules.check_prompt(_lyrics(data), texts, candidates, _language(data, language))
        return io.NodeOutput(prompt, json.dumps(rules.ANSWER_SCHEMA))


class PlenioApplySungCheck(io.ComfyNode):
    @classmethod
    def define_schema(cls) -> io.Schema:
        return io.Schema(
            node_id="PlenioApplySungCheck",
            # the summary is re-sent on every run, also when the node is cached (ComfyUI keeps its UI)
            has_intermediate_output=True,
            display_name="Apply Sung Check",
            category="Plenio/Lyrics",
            description=(
                "Corrects misheard words in the lyrics as sung: of the writer model's corrections it takes those "
                f"that replace a marked word, are sure enough ({rules.MIN_SURE:.0%}) and have as many syllables as "
                "the word heard. The release record keeps each one with the word heard; (sung).srt is written "
                "again. A record without what its take sings, or without marked words, asks no writer."
            ),
            inputs=[
                io.String.Input("record", force_input=True, tooltip=RECORD_TOOLTIP),
                io.String.Input(
                    "answer",
                    optional=True,
                    lazy=True,
                    force_input=True,
                    tooltip="The writer model's answer (asked only when there are words to check).",
                ),
                io.String.Input("language", optional=True, default="", tooltip=LANGUAGE_TOOLTIP),
            ],
            outputs=[
                io.String.Output(display_name="record", tooltip="The release record (corrected in place)."),
                ReportType.Output(display_name="report", tooltip="What was corrected, and why not the rest."),
            ],
            is_output_node=True,
        )

    @classmethod
    def check_lazy_status(cls, record: str = "", answer: str | None = None, **_others: Any) -> list[str]:
        return ["answer"] if answer is None and _found(_read(record)) is not None else []

    @classmethod
    def execute(cls, record: str, answer: str | None = None, language: str = "") -> io.NodeOutput:
        def done(status: Status, summary: str, notes: list[str], data: dict[str, Any]) -> io.NodeOutput:
            report = Report("sung_check", status, summary, tuple(notes), data)
            lines = "\n".join(f"- {note}" for note in notes)
            markdown = f"**{summary}**" + (f"\n{lines}" if lines else "")
            ui = {"plenio_summary": [{"status": status.value, "markdown": markdown}]}
            return io.NodeOutput(record, report, ui=ui)

        with RECORD_LOCK:  # the sheet music PDF is listed in the same record, perhaps at the same moment
            data = _read(record)
            found = _found(data)
            if data is None or found is None:
                why = (
                    "no record" if data is None else "nothing to check (no sung lyrics, or no word they lack)"
                )
                return done(Status.SKIPPED, f"Sung words: {why}", [], {})
            candidates, index, sung = found
            language = _language(data, language)
            texts = [str(line.get("text") or "") for line in sung["lines"]]
            fixes, refused = rules.parse_answer(answer or "", candidates, language, texts)
            updated = rules.corrected_sung(sung, _lyrics(data), fixes)
            timing = [dict(t) for t in data["timing"]]
            timing[index] = {**timing[index], "sung": updated}
            data = {**data, "timing": timing}
            folder = Path(record).parent
            sung_files = [f for f in data.get("files") or [] if f.get("subtitles") == "sung"]
            nth = sum(1 for t in timing[:index] if isinstance(t.get("sung"), dict))
            if fixes and nth < len(sung_files):
                entry = sung_files[nth]
                path = folder / str(entry["name"])
                cues = [
                    (float(x["start"]), float(x["end"]), subtitle_rules.wrapped(str(x["text"])))
                    for x in updated["lines"]
                ]
                atomic_write_text(path, subtitle_rules.srt(cues))
                entry.update(file_facts(path))
            data["fingerprint"] = record_fingerprint(data)
            atomic_write_text(Path(record), json.dumps(data, indent=2, ensure_ascii=False))
        changed = [f"'{f.heard}' -> '{f.word}' (line {f.line + 1}, {f.sure:.0%} sure)" for f in fixes]
        summary = (
            f"Sung words: {len(fixes)} of {len(candidates)} word(s) the lyrics do not have were misheard and are "
            "corrected"
            if fixes
            else f"Sung words: none of {len(candidates)} word(s) the lyrics do not have was misheard"
        )
        notes = [*changed, *(f"not taken: {why}" for why in refused)]
        return done(
            Status.OK, summary, notes, {"corrected": [f.to_record() for f in fixes], "refused": refused}
        )
