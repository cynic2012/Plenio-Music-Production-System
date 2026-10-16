"""Songs shared as a player (owner's request 2026-10-16): one HTML file with the player's page and the songs
chosen, which plays by itself - each song as an MP3 of at most 192 kbit/s, never its FLAC, and nothing of
this computer: no release record, no paths."""

from __future__ import annotations

import base64
import http.client
import io
import json
import re
import threading
import time
from collections.abc import Iterator
from fractions import Fraction
from pathlib import Path

import pytest

from plenio.player.library import Library
from plenio.player.package import build
from plenio.player.server import State, serve

av = pytest.importorskip("av")
np = pytest.importorskip("numpy")


def flac(path: Path, seconds: float = 4.0) -> None:
    rate = 44100
    with av.open(str(path), "w") as container:
        stream = container.add_stream("flac", rate=rate)
        stream.layout = "stereo"
        samples = (0.2 * np.sin(2 * np.pi * 330 * np.arange(int(rate * seconds)) / rate)).astype(np.float32)
        frame = av.AudioFrame.from_ndarray(np.stack([samples, samples]), format="fltp", layout="stereo")
        frame.sample_rate = rate
        frame.pts = 0
        frame.time_base = Fraction(1, rate)
        for packet in [*stream.encode(frame), *stream.encode(None)]:
            container.mux(packet)


@pytest.fixture
def songs(tmp_path: Path) -> Path:
    folder = tmp_path / "output" / "plenio"
    folder.mkdir(parents=True)
    for title in ("First", "Second"):
        flac(folder / f"{title}.flac")
        record = {
            "schema": "plenio.release/1",
            "title": title,
            "files": [{"name": f"{title}.flac", "format": "flac"}],
            "documents": {"lyrics": {"text": "la la la"}, "title": {"text": title}},
            "workflow": {"secret": "the workflow stays home"},
        }
        (folder / f"{title}.plenio.json").write_text(json.dumps(record), encoding="utf-8")
    try:
        from PIL import Image

        Image.new("RGB", (900, 900), (200, 40, 90)).save(folder / "First.jpg")
    except ImportError:
        pass
    (folder / "First.pdf").write_bytes(b"%PDF-1.4 sheet music")
    return tmp_path / "output"


def blocks(html: str, kind: str) -> dict[str, bytes]:
    found = re.findall(
        rf'<script type="text/plain" data-plenio="{kind}" data-id="([^"]+)"[^>]*>([^<]*)</script>', html
    )
    return {key: base64.b64decode(data) for key, data in found}


def test_a_shared_player_has_the_songs_as_mp3_and_nothing_of_this_computer(
    songs: Path, tmp_path: Path
) -> None:
    library = Library([songs])
    library.scan(force=True)
    ids = [s["id"] for s in library.songs()]
    seen: list[tuple[int, int]] = []
    path = build(
        library,
        ids,
        {"title": "Party <Mix>", "bitrate": 128, "pdf": True, "settings": {"lyrics": {"effect": "neon"}},
         "playlists": [{"name": "Both", "songs": ids}, {"name": "Elsewhere", "songs": ["0123456789ab"]}]},
        tmp_path / "state",
        lambda done, total: seen.append((done, total)),
    )  # fmt: skip
    assert path.name == "Party Mix.html" and seen[-1] == (2, 2)
    html = path.read_text(encoding="utf-8")
    assert "<title>Party &lt;Mix&gt; - Plenio Player</title>" in html
    # the page's own code inside, no file it would have to load
    assert '<script type="module">' in html and 'src="./assets/' not in html and "<style>" in html
    data = json.loads(
        re.search(r'<script type="application/json" id="plenio-portable">(.*?)</script>', html, re.S).group(1)
    )
    assert data["format"] == "plenio.portable/1" and data["bitrate"] == 128
    assert sorted(s["title"] for s in data["songs"]) == ["First", "Second"]
    assert data["settings"] == {"lyrics": {"effect": "neon"}}
    assert data["playlists"] == [{"name": "Both", "songs": ids}]
    # MP3 only, at the bit rate asked for
    audio = blocks(html, "audio")
    assert sorted(audio) == sorted(ids)
    for sound in audio.values():
        with av.open(io.BytesIO(sound)) as container:
            stream = container.streams.audio[0]
            assert container.format.name == "mp3" and stream.codec_context.name in ("mp3", "mp3float")
            assert stream.codec_context.bit_rate <= 192_000
            assert 3.5 < container.duration / 1e6 < 4.5
        assert b"fLaC" not in sound[:64]
    first = next(s for s in data["songs"] if s["title"] == "First")
    assert first["has"]["pdf"] and blocks(html, "pdf")[first["id"]].startswith(b"%PDF")
    if first["has"]["cover"]:
        cover = blocks(html, "cover")[first["id"]]
        from PIL import Image

        assert max(Image.open(io.BytesIO(cover)).size) <= 512
    # nothing of this computer: no paths, no records, no workflow
    assert str(songs) not in html and str(songs).replace("\\", "/") not in html
    assert "the workflow stays home" not in html
    packed = json.dumps(data) + "".join(m for m in re.findall(r'data-plenio="[^"]+" data-id="[^"]+"', html))
    assert ".plenio.json" not in packed and "workflow" not in packed
    detail = data["details"][first["id"]]
    assert (
        detail["record_path"] == ""
        and detail["owned_files"] == []
        and detail["files"] == {"audio": "First.mp3", "pdf": "First.pdf"}
    )


def test_no_songs_or_a_bit_rate_above_192_make_no_player(songs: Path, tmp_path: Path) -> None:
    library = Library([songs])
    library.scan(force=True)
    with pytest.raises(ValueError):
        build(library, [], {"bitrate": 192}, tmp_path / "state")
    with pytest.raises(ValueError):
        build(library, [library.songs()[0]["id"]], {"bitrate": 320}, tmp_path / "state")


@pytest.fixture
def server(songs: Path, tmp_path: Path) -> Iterator[tuple[str, int, Library, Path]]:
    library = Library([songs])
    library.scan(force=True)
    running = serve(library, State(tmp_path / "state" / "state.json"), "127.0.0.1", 0)
    threading.Thread(target=running.serve_forever, daemon=True).start()
    yield "127.0.0.1", running.server_address[1], library, tmp_path / "state"
    running.shutdown()
    running.server_close()


def call(address, method: str, path: str, body: object = None, **headers: str):
    connection = http.client.HTTPConnection(address[0], address[1], timeout=60)
    data = json.dumps(body).encode() if body is not None else None
    if body is not None:
        headers.setdefault("Content-Type", "application/json")
    connection.request(method, path, body=data, headers=headers)
    answer = connection.getresponse()
    payload = answer.read()
    response_headers = dict(answer.getheaders())
    connection.close()
    return answer.status, json.loads(payload) if payload[:1] in (b"{", b"[") else payload, response_headers


def test_the_player_makes_a_shared_player_on_its_pages_request(
    server: tuple[str, int, Library, Path],
) -> None:
    ids = [s["id"] for s in server[2].songs()]
    request = {"songs": ids, "title": "Share", "bitrate": 160, "pdf": False}
    assert call(server, "POST", "/api/package", body=None)[0] == 403  # not JSON
    assert call(server, "POST", "/api/package", request, Origin="http://evil.example")[0] == 403
    assert call(server, "POST", "/api/package", {**request, "bitrate": 320})[0] == 400
    assert call(server, "POST", "/api/package", {**request, "songs": []})[0] == 400
    status, answer, _ = call(server, "POST", "/api/package", request)
    assert status == 200
    for _ in range(200):
        status, state, _ = call(server, "GET", f"/api/package/{answer['job']}")
        if state["state"] != "working":
            break
        time.sleep(0.1)
    assert state["state"] == "done" and state["file"] == "Share.html" and state["size"] > 10_000
    listed = call(server, "GET", "/api/packages")[1]["files"]
    assert [f["name"] for f in listed] == ["Share.html"]
    status, body, headers = call(server, "GET", "/packages/Share.html?download=1")
    assert (
        status == 200
        and body.startswith(b"<!doctype html>")
        and "attachment" in headers["Content-Disposition"]
    )
    assert call(server, "GET", "/packages/..%2Fstate.json")[0] == 404
    assert call(server, "GET", "/api/package/ffffffffffffffff")[0] == 404
