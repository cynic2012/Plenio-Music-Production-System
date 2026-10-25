"""The Song API in a real ComfyUI (owner's request 2026-10-25; docs/design/party-songs.md §2): the templates and their
fields read from the running server, a job queued that ComfyUI's own validation accepts (the template's loaders
find files of the catalogue's names - empty ones: the run then fails at the first loader, which is expected), its
status from the queue and the history, a recording uploaded, refusals by name, a cancel.

The real run (models on a GPU) was made on the owner's machine: a party song through this API, its record with the
party's folder, album and artist."""

from __future__ import annotations

import json
import time
import urllib.request
from pathlib import Path
from typing import Any

import pytest

from harness import PROJECT, ComfyServer
from plenio.core.models import load_catalogue

pytestmark = pytest.mark.host

BASE = "/plenio/api/v1"


@pytest.fixture(scope="module")
def models(server: ComfyServer) -> ComfyServer:
    """Empty files with the catalogue's names in the server's models folder: the loaders' lists have them."""
    for model in load_catalogue(PROJECT / "resources" / "models.toml").values():
        target = server.base / "models" / model.folder / model.file
        target.parent.mkdir(parents=True, exist_ok=True)
        if not target.exists():
            target.write_bytes(b"")
    return server


def finished(server: ComfyServer, job_id: str, timeout: float = 120.0) -> dict[str, Any]:
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        view: dict[str, Any] = server.get(f"{BASE}/jobs/{job_id}")
        if view["status"] in ("succeeded", "failed", "cancelled"):
            return view
        time.sleep(0.3)
    raise TimeoutError(server.log_tail())


def test_the_api_describes_itself(server: ComfyServer) -> None:
    index = server.get(BASE)
    assert index["api"] == "plenio-song-api" and index["version"].startswith("1.")
    assert [t["id"] for t in index["templates"]] == ["yue2-song", "yue2-cover"]
    song = server.get(f"{BASE}/templates/yue2-song")
    fields = {f["id"]: f for f in song["fields"]}
    assert {
        "template",
        "genre",
        "vocals",
        "language",
        "writer.model",
        "finish.hq_mastering",
        "finish.cover_art",
    } <= set(fields)
    assert fields["vocals"]["choices"] == ["sung", "sparse vocals", "instrumental"]
    assert fields["mode"]["fixed"] is True
    assert {"folder", "artist", "album"} <= {f["id"] for f in song["release"]}
    cover = server.get(f"{BASE}/templates/yue2-cover")
    assert cover["needs"] == ["source.audio"]
    document = server.get(f"{BASE}/openapi.json")
    assert document["openapi"] == "3.1.0" and "JobRequest_yue2_song" in document["components"]["schemas"]
    briefs = server.get(f"{BASE}/briefs?kind=song")
    assert len(briefs["briefs"]) > 100 and any("synthwave" in v.lower() for v in briefs["values"]["genre"])
    assert server.request("GET", f"{BASE}/templates/nope")[0] == 404


def test_a_job_is_queued_validated_by_comfyui_and_followed(models: ComfyServer) -> None:
    server = models
    status, job = server.request(
        "POST",
        f"{BASE}/jobs",
        {
            "template": "yue2-song",
            "fields": {
                "genre": "synthwave",
                "length": 60,
                "vocals": "sung",
                "language": "English",
                "finish.cover_art": True,
            },
            "release": {"folder": "plenio/Party-Songs-test", "album": "Party-Song test", "artist": "Guest"},
            "client": {"name": "host test"},
        },
    )
    assert status == 201, job
    assert job["template"] == "yue2-song" and set(job["seeds"]) == {
        "draft",
        "plan",
        "arrangement",
        "take",
        "cover",
    }
    view = finished(server, job["id"])
    # the empty checkpoint: the run got past ComfyUI's validation and failed at its first loader
    assert view["status"] == "failed" and view["error"]["title"], view
    assert view["started_at"] and view["finished_at"] >= view["started_at"]
    history = server.get(f"/history/{job['id']}")[job["id"]]
    prompt, extra = history["prompt"][2], history["prompt"][3]
    assert extra["plenio_api"]["template"] == "yue2-song" and extra["plenio_api"]["client"] == {
        "name": "host test"
    }
    assert extra["extra_pnginfo"]["workflow"]["extra"]["plenio_api"]["id"] == "yue2-song"
    export = next(n for n in prompt.values() if n["class_type"] == "PlenioExportRelease")["inputs"]
    assert (export["folder"], export["tags.album"], export["tags.artist"]) == (
        "plenio/Party-Songs-test",
        "Party-Song test",
        "Guest",
    )
    brief = next(n for n in prompt.values() if n["class_type"] == "PlenioSongBrief")["inputs"]
    assert brief["length"] == "very short (about 1:00)" and brief["mode"] == "new song every run"
    listed = server.get(f"{BASE}/jobs")["jobs"]
    assert job["id"] in [j["id"] for j in listed]
    assert server.get(f"{BASE}/queue")["recent"] == [] or isinstance(
        server.get(f"{BASE}/queue")["recent"], list
    )


def test_a_repeated_request_with_its_key_is_one_job(models: ComfyServer) -> None:
    server = models
    body = json.dumps({"template": "yue2-song", "fields": {"genre": "ska"}}).encode("utf-8")

    def post() -> dict[str, Any]:
        request = urllib.request.Request(
            server.url + f"{BASE}/jobs",
            data=body,
            method="POST",
            headers={"Content-Type": "application/json", "Idempotency-Key": "host-test-key"},
        )
        with urllib.request.urlopen(request, timeout=60) as answer:  # noqa: S310 - local test server
            result: dict[str, Any] = json.loads(answer.read())
            return result

    first, again = post(), post()
    assert first["id"] == again["id"]
    finished(server, first["id"])


def test_refusals_name_the_field(server: ComfyServer) -> None:
    cases = [
        ({"template": "yue2-song", "fields": {"genr": "x"}}, "unknown_field", "genr"),
        ({"template": "yue2-song", "fields": {"vocals": "rap"}}, "invalid_value", "vocals"),
        ({"template": "yue2-song", "fields": {"mode": "one song, stop to review"}}, "not_supported", "mode"),
        ({"template": "yue2-cover"}, "missing_field", "source.audio"),
        ({"template": "yue2-song", "release": {"folder": "../out"}}, "invalid_value", "release.folder"),
    ]
    for body, code, field in cases:
        status, answer = server.request("POST", f"{BASE}/jobs", body)
        assert status == 400 and answer["error"]["code"] == code and answer["error"]["field"] == field, answer


def test_a_recording_is_uploaded_and_a_cover_is_queued_and_cancelled(
    models: ComfyServer, tmp_path: Path
) -> None:
    server = models
    data = b"RIFF" + b"\x00" * 64
    request = urllib.request.Request(
        server.url + f"{BASE}/uploads?name=My%20Song.wav",
        data=data,
        method="POST",
        headers={"Content-Type": "audio/wav"},
    )
    with urllib.request.urlopen(request, timeout=60) as answer:  # noqa: S310 - local test server
        uploaded = json.loads(answer.read())
    assert uploaded["name"].startswith("plenio-api-") and uploaded["name"].endswith("-My-Song.wav")
    assert (server.base / "input" / uploaded["name"]).read_bytes() == data
    status, wrong = server.request("POST", f"{BASE}/uploads?name=evil.exe", None)
    assert status == 415 and wrong["error"]["code"] == "unsupported_media_type"
    status, job = server.request(
        "POST",
        f"{BASE}/jobs",
        {"template": "yue2-cover", "fields": {"source.audio": uploaded["name"], "genre": "jazz"}},
    )
    assert status == 201, job
    status, stopped = server.request("DELETE", f"{BASE}/jobs/{job['id']}")
    assert status == 200 and stopped["id"] == job["id"]
    assert finished(server, job["id"])["status"] in ("cancelled", "failed")
