"""The Song API's templates and requests (owner's request 2026-10-25; docs/design/party-songs.md §2): the fields
read from the templates, a request written into the workflow as the frontend would (checked against the frontend's
own prompts), validation, seeds, the field list pinned."""

from __future__ import annotations

import json
import random
from pathlib import Path
from typing import Any

import pytest

from plenio.core import song_api
from plenio.core.song_api import SongApiError, api_templates, load_template, prepare
from plenio.core.song_api_doc import openapi

ROOT = Path(__file__).resolve().parents[2]
NODES: dict[str, Any] = json.loads((ROOT / "tools" / "data" / "node_types.json").read_text(encoding="utf-8"))[
    "nodes"
]
WORKFLOWS = {
    p.stem: json.loads(p.read_text(encoding="utf-8")) for p in (ROOT / "example_workflows").glob("*.json")
}
TEMPLATES = api_templates(WORKFLOWS)

SONG_FIELDS = [
    ("mode", "choice"), ("template", "choice"), ("description", "text"), ("genre", "string"), ("mood", "string"),
    ("tempo", "string"), ("length", "choice"), ("vocals", "choice"), ("language", "string"), ("voice", "string"),
    ("theme", "string"), ("melody", "choice"), ("lead_instrument", "string"), ("key", "string"), ("meter", "string"),
    ("arrangement", "choice"), ("genre_closeness", "integer"), ("lines_under_singing", "boolean"),
    ("creativity", "integer"), ("lyrics_fidelity", "choice"), ("finish.hq_mastering", "boolean"),
    ("finish.cover_art", "boolean"), ("writer.model", "choice"),
]  # fmt: skip
COVER_FIELDS = [
    ("mode", "choice"), ("template", "choice"), ("description", "text"), ("genre", "string"), ("mood", "string"),
    ("vocals", "choice"), ("melody", "choice"), ("lead_instrument", "string"), ("language", "string"),
    ("voice", "string"), ("theme", "string"), ("phrasing_reference", "boolean"), ("harmony", "choice"),
    ("title", "string"), ("arrangement", "choice"), ("song_flow_closeness", "integer"),
    ("lyrics_closeness", "integer"), ("lines_under_singing", "boolean"), ("creativity", "integer"),
    ("lyrics_fidelity", "choice"), ("finish.hq_mastering", "boolean"), ("finish.cover_art", "boolean"),
    ("writer.model", "choice"), ("source.audio", "upload"), ("excerpt.start_index", "number"),
    ("excerpt.duration", "number"), ("excerpt.enabled", "boolean"),
]  # fmt: skip
RELEASE_FIELDS = [
    "folder", "naming", "collision", "flac", "mp3", "wav", "tags", "artist", "album", "date", "track", "genre",
    "comment", "album_artist", "composer", "lyrics", "sheet_music", "sheet_music_size", "project_in_flac",
    "lyrics_srt", "lyrics_timing",
]  # fmt: skip
"""The API's surface for the shipped templates. A change here is a change of API v1: additions are fine (a minor
version), a field gone or renamed needs an entry in FIELD_ALIASES and a line in the changelog."""


def template(template_id: str) -> song_api.Template:
    name, workflow = TEMPLATES[template_id]
    return load_template(name, workflow, NODES.get)


def fixture(name: str) -> dict[str, Any]:
    data: dict[str, Any] = json.loads(
        (ROOT / "tests" / "fixtures" / "song_api" / name).read_text(encoding="utf-8")
    )
    return data


def test_the_api_runs_the_two_yue2_templates() -> None:
    assert sorted(TEMPLATES) == ["yue2-cover", "yue2-song"]
    song, cover = template("yue2-song"), template("yue2-cover")
    assert (song.kind, song.title, song.needs()) == ("song", "YuE2 · Song", [])
    assert (cover.kind, cover.title, cover.needs()) == ("cover", "YuE2 · Cover", ["source.audio"])


@pytest.mark.parametrize(
    ("template_id", "fields"), [("yue2-song", SONG_FIELDS), ("yue2-cover", COVER_FIELDS)]
)
def test_the_fields_of_the_song_part_are_pinned(template_id: str, fields: list[tuple[str, str]]) -> None:
    found = template(template_id)
    assert [(f.id, f.type) for f in found.fields] == fields
    assert [f.id for f in found.release] == RELEASE_FIELDS


def test_the_fields_come_from_the_song_groups_with_their_conditions_and_defaults() -> None:
    song = template("yue2-song")
    by_id = {f.id: f for f in song.fields}
    assert {f.group for f in song.fields} == {"1 · SONG"}
    assert by_id["language"].when == (("vocals", ("sung", "sparse vocals")),)
    assert by_id["lead_instrument"].when == (("vocals", ("instrumental",)),)
    assert by_id["mode"].fixed and by_id["mode"].default == "new song every run"
    assert by_id["finish.cover_art"].default is True and by_id["finish.hq_mastering"].default is False
    assert (
        by_id["length"].default == "short (about 1:30)"
        and "very long (about 6:00)" in by_id["length"].choices
    )
    cover = {f.id: f for f in template("yue2-cover").fields}
    assert {cover["source.audio"].group, cover["genre"].group} == {"1 · SOURCE", "2 · COVER"}
    assert cover["source.audio"].required and cover["excerpt.enabled"].default is False
    assert dict(cover["language"].defaults) == {"original lyrics": "auto", "new lyrics": "English"}
    assert [s.id for s in template("yue2-song").seeds] == ["draft", "plan", "arrangement", "take", "cover"]


VARIANTS = {
    ("yue2-song", "shipped"): {},
    ("yue2-song", "instrumental"): {
        "vocals": "instrumental",
        "lead_instrument": "saxophone",
        "genre": "smooth jazz",
        "finish.hq_mastering": True,
        "finish.cover_art": False,
    },
    ("yue2-cover", "shipped"): {"source.audio": "plenio-api-0123456789ab-source.mp3"},
    ("yue2-cover", "excerpt"): {
        "source.audio": "plenio-api-0123456789ab-source.mp3",
        "excerpt.enabled": True,
        "excerpt.start_index": 30,
        "vocals": "new lyrics",
        "theme": "a summer night",
    },
}


@pytest.mark.parametrize(("template_id", "variant"), list(VARIANTS), ids=lambda v: str(v))
def test_a_request_makes_the_prompt_the_frontend_makes(template_id: str, variant: str) -> None:
    """The fixtures: the same changes made in ComfyUI's frontend with its own widgets and modes
    (tools/frontend_prompts.mjs) - a DynamicCombo's new choice with its defaults, the Cover Art switch, an
    optional node switched on."""
    found = template(template_id)
    keep = {s.id: s.value for s in found.seeds}
    prepared = prepare(found, {"fields": VARIANTS[(template_id, variant)], "seeds": keep}, NODES.get)
    assert prepared.prompt == fixture(f"{template_id}.{variant}.json")["prompt"]
    assert prepared.warnings == []


def test_a_new_dynamic_choice_brings_its_input_slots_into_the_workflow() -> None:
    prepared = prepare(template("yue2-song"), {"fields": {"vocals": "instrumental"}}, NODES.get)
    brief = next(n for n in prepared.workflow["nodes"] if n["type"] == "PlenioSongBrief")
    names = [s["name"] for s in brief["inputs"]]
    assert "vocals.melody" in names and "vocals.lead_instrument" in names and "vocals.language" not in names
    assert names.index("vocals.melody") == names.index("vocals") + 1


def test_the_seeds_are_drawn_unless_given() -> None:
    found = template("yue2-song")
    first = prepare(found, {}, NODES.get, rng=random.Random(1))
    second = prepare(found, {}, NODES.get, rng=random.Random(2))
    assert first.seeds != second.seeds and all(0 <= v < 2**32 for v in first.seeds.values())
    given = prepare(found, {"seeds": {"take": 7}}, NODES.get, rng=random.Random(1))
    assert given.seeds["take"] == 7
    take = next(n for n in given.workflow["nodes"] if n.get("title") == "Take seed")
    assert take["widgets_values"][0] == 7
    for bad, code in (
        ({"nope": 1}, "unknown_field"),
        ({"take": -1}, "invalid_value"),
        ({"take": True}, "invalid_value"),
    ):
        with pytest.raises(SongApiError) as error:
            prepare(found, {"seeds": bad}, NODES.get)
        assert error.value.code == code


def test_the_release_fields_set_the_party_folder_album_and_artist() -> None:
    prepared = prepare(
        template("yue2-song"),
        {
            "release": {
                "folder": "plenio/Party-Songs-2026-10-25",
                "album": "Party-Song 2026-10-25",
                "artist": "Anna",
            }
        },
        NODES.get,
    )
    export = next(v for v in prepared.prompt.values() if v["class_type"] == "PlenioExportRelease")["inputs"]
    assert export["folder"] == "plenio/Party-Songs-2026-10-25"
    assert (export["tags"], export["tags.album"], export["tags.artist"]) == (
        "tags",
        "Party-Song 2026-10-25",
        "Anna",
    )
    for folder in ("../outside", "/abs", "C:/x", "a/./b"):
        with pytest.raises(SongApiError) as error:
            prepare(template("yue2-song"), {"release": {"folder": folder}}, NODES.get)
        assert error.value.field == "release.folder"


@pytest.mark.parametrize(
    ("fields", "code", "field"),
    [
        ({"genr": "jazz"}, "unknown_field", "genr"),
        ({"vocals": "rap"}, "invalid_value", "vocals"),
        ({"genre": 3}, "invalid_value", "genre"),
        ({"genre": "x" * 401}, "invalid_value", "genre"),
        ({"genre": "two\nlines"}, "invalid_value", "genre"),
        ({"creativity": 101}, "invalid_value", "creativity"),
        ({"creativity": 50.5}, "invalid_value", "creativity"),
        ({"finish.cover_art": "yes"}, "invalid_value", "finish.cover_art"),
        ({"mode": "one song, stop to review"}, "not_supported", "mode"),
        ({"length": "forever"}, "invalid_value", "length"),
    ],
)
def test_a_wrong_value_is_refused_by_name(fields: dict[str, Any], code: str, field: str) -> None:
    with pytest.raises(SongApiError) as error:
        prepare(template("yue2-song"), {"fields": fields}, NODES.get)
    assert (error.value.code, error.value.field) == (code, field)
    assert error.value.to_dict()["message"]


def test_friendly_values_are_made_exact() -> None:
    prepared = prepare(
        template("yue2-song"),
        {"fields": {"length": 200, "vocals": "SUNG", "mode": "new song every run"}},
        NODES.get,
    )
    assert (prepared.fields["length"], prepared.fields["vocals"]) == ("about 3:30", "sung")
    brief = next(v for v in prepared.prompt.values() if v["class_type"] == "PlenioSongBrief")["inputs"]
    assert brief["length"] == "about 3:30" and brief["mode"] == "new song every run"
    assert (
        prepare(template("yue2-song"), {"fields": {"length": "2:50"}}, NODES.get).fields["length"]
        == "standard (about 3:00)"
    )


def test_lenient_requests_leave_out_what_is_unknown_or_does_not_apply() -> None:
    prepared = prepare(
        template("yue2-song"),
        {
            "fields": {"vocals": "instrumental", "voice": "warm", "tempo2": "x"},
            "release": {"bpm": 1},
            "strict": False,
        },
        NODES.get,
    )
    assert prepared.warnings == [
        "no field 'tempo2' - left out",
        "no release field 'bpm' - left out",
        "'voice' does not apply when 'vocals' is 'instrumental' - left out",
    ]
    brief = next(v for v in prepared.prompt.values() if v["class_type"] == "PlenioSongBrief")["inputs"]
    assert "vocals.voice" not in brief and brief["vocals"] == "instrumental"


def test_a_cover_needs_its_source_recording() -> None:
    with pytest.raises(SongApiError) as error:
        prepare(template("yue2-cover"), {}, NODES.get)
    assert (error.value.code, error.value.field) == ("missing_field", "source.audio")


def test_an_old_field_name_keeps_working(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setitem(song_api.FIELD_ALIASES, "yue2-song", {"style_genre": "genre"})
    prepared = prepare(template("yue2-song"), {"fields": {"style_genre": "ska"}}, NODES.get)
    assert prepared.fields["genre"] == "ska"
    assert template("yue2-song").describe()["aliases"] == {"style_genre": "genre"}


def test_the_stage_is_the_group_of_the_node_that_runs() -> None:
    workflow = TEMPLATES["yue2-song"][1]
    assert song_api.stage_of(workflow, "15:801") == "5 · RENDER"
    assert song_api.stage_of(workflow, "4") == "2 · WRITE"
    assert song_api.stage_of(workflow, "21:1004") == "COVER ART"
    assert song_api.stage_of(workflow, "999") == ""


def test_the_style_templates_values_for_a_simple_form() -> None:
    from plenio.core.brief import Template

    found = song_api.brief_values(
        [
            Template("a/x", "X", "A", {"genre": "Jazz", "mood": "warm, hopeful", "description": "long text"}),
            Template("a/y", "Y", "A", {"genre": "jazz", "mood": "dark"}),
        ],
        ("genre", "mood", "description"),
    )
    assert found == {"genre": ["Jazz"], "mood": ["dark", "warm, hopeful"], "description": []}


def test_the_openapi_document_describes_every_template() -> None:
    document = openapi([template("yue2-song"), template("yue2-cover")], plenio="1.2.1", comfyui="0.41.0")
    assert document["openapi"] == "3.1.0" and document["info"]["version"] == song_api.API_VERSION
    schemas = document["components"]["schemas"]
    song = schemas["JobRequest_yue2_song"]["properties"]["fields"]["properties"]
    assert song["vocals"]["enum"] == ["sung", "sparse vocals", "instrumental"]
    assert song["mode"]["const"] == "new song every run"
    assert schemas["JobRequest_yue2_cover"]["properties"]["fields"]["required"] == ["source.audio"]
    assert set(document["paths"]) == {
        "/",
        "/templates",
        "/templates/{id}",
        "/briefs",
        "/uploads",
        "/jobs",
        "/jobs/{id}",
        "/queue",
    }
    json.dumps(document)  # plain JSON
