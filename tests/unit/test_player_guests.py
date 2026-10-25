"""Guests in the same network see the live playlist (owner's request 2026-10-17): the access is a server of its
own below a random path that can be made anew, the player's page sends what it shows and carries out the
guests' wishes, and the guests get titles and covers - no audio, no records, no paths. The tests bind it to
the loopback address (the player binds it to the network)."""

from __future__ import annotations

import http.client
import json
import threading
from collections.abc import Iterator
from pathlib import Path

import pytest

from plenio.player import guest as guest_module
from plenio.player.guest import GuestHub
from plenio.player.library import Library
from plenio.player.server import State, serve

JPEG = bytes.fromhex("ffd8ffe000104a46494600010100000100010000ffd9")


def record(title: str, genre: str) -> dict[str, object]:
    return {
        "schema": "plenio.release/1",
        "title": title,
        "created": "2026-10-17T10:00:00Z",
        "prompt": {"1": {"class_type": "PlenioSongBrief", "inputs": {"genre": genre}}},
        "audio": {"seconds": 180.0},
        "files": [{"name": f"{title}.flac", "format": "flac"}, {"name": f"{title}.jpg", "role": "cover"}],
    }


@pytest.fixture
def party(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Iterator[tuple[Library, GuestHub, int]]:
    folder = tmp_path / "songs"
    folder.mkdir()
    for title, genre in (("River", "folk"), ("Neon Night", "synthwave"), ("Blue Hour", "jazz")):
        (folder / f"{title}.plenio.json").write_text(json.dumps(record(title, genre)), encoding="utf-8")
        (folder / f"{title}.flac").write_bytes(b"f" * 64)
        (folder / f"{title}.jpg").write_bytes(JPEG)
    library = Library([folder], cache=tmp_path / "state" / "cache.json")
    library.scan(force=True)
    # an unused port range, so a player running on this computer is not in the way
    monkeypatch.setattr(guest_module, "PORTS", range(0, 1))
    hub = GuestHub(library, tmp_path / "state", host="127.0.0.1")
    player = serve(library, State(tmp_path / "state" / "state.json"), "127.0.0.1", 0, guests=hub)
    threading.Thread(target=player.serve_forever, daemon=True).start()
    yield library, hub, player.server_address[1]
    hub.close()
    player.shutdown()
    player.server_close()


def call(
    port: int, method: str, path: str, body: object = None, **headers: str
) -> tuple[int, dict[str, str], bytes]:
    connection = http.client.HTTPConnection("127.0.0.1", port, timeout=10)
    data = json.dumps(body).encode() if body is not None else None
    if body is not None:
        headers.setdefault("Content-Type", "application/json")
    connection.request(method, path, body=data, headers=headers)
    answer = connection.getresponse()
    payload = answer.read()
    result = answer.status, dict(answer.getheaders()), payload
    connection.close()
    return result


def ids(library: Library) -> dict[str, str]:
    return {s["title"]: s["id"] for s in library.songs()}


def test_the_access_is_off_until_switched_on_and_answers_only_below_its_token(
    party: tuple[Library, GuestHub, int],
) -> None:
    library, hub, player = party
    status = json.loads(call(player, "GET", "/api/guests")[2])
    assert status["on"] is False and hub.server is None
    # only the player's own page switches it on
    assert call(player, "PUT", "/api/guests", {"on": True}, **{"Content-Type": "text/plain"})[0] == 403
    status = json.loads(call(player, "PUT", "/api/guests", {"on": True})[2])
    assert status["on"] is True and status["mode"] == "view" and status["show"] == "both"
    port, token = hub.settings["port"], hub.settings["token"]
    assert len(token) >= 16 and all(url.endswith(f":{port}/{token}/") for url in status["urls"])
    page = call(port, "GET", f"/{token}/")
    assert page[0] == 200 and b"Plenio Live" in page[2]
    assert (
        "default-src 'none'" in page[1]["Content-Security-Policy"]
        and page[1]["Referrer-Policy"] == "no-referrer"
    )
    assert call(port, "GET", f"/{token}")[1]["Location"] == f"/{token}/"
    # one character off (never the token itself, whatever its last character is)
    near = token[:-1] + ("y" if token.endswith("x") else "x")
    for wrong in ("/", "/api/live", f"/{near}/api/live", "/api/library", f"/{token}/../api/library"):
        assert call(port, "GET", wrong)[0] == 404
    # a new address: the old one leads nowhere
    call(player, "PUT", "/api/guests", {"regenerate": True})
    assert call(port, "GET", f"/{token}/api/live")[0] == 404
    assert call(port, "GET", f"/{hub.settings['token']}/api/live")[0] == 200
    # off: nobody answers on the guests' port
    call(player, "PUT", "/api/guests", {"on": False})
    with pytest.raises(OSError):
        call(port, "GET", f"/{hub.settings['token']}/")
    kept = json.loads((hub.path).read_text(encoding="utf-8"))
    assert kept["on"] is False and kept["token"] == hub.settings["token"]
    assert ids(library)  # the library is untouched


def test_guests_see_what_the_page_shows_with_titles_and_covers_but_no_files(
    party: tuple[Library, GuestHub, int],
) -> None:
    library, hub, player = party
    call(player, "PUT", "/api/guests", {"on": True})
    port, token = hub.settings["port"], hub.settings["token"]
    live = json.loads(call(port, "GET", f"/{token}/api/live")[2])
    assert live["open"] is False  # the page has not said anything yet
    song = ids(library)
    shown = {
        "live": True,
        "playing": True,
        "position": 30.0,
        "now": {"id": song["River"], "at": 0},
        "next": [
            {"id": song["Neon Night"], "at": 1, "new": True},
            {"id": song["Blue Hour"], "at": 2},
            {"id": "ffffffffffff", "at": 3},
        ],
        "played": [],
    }
    assert call(player, "POST", "/api/guests/live", shown, **{"Content-Type": "text/plain"})[0] == 403
    assert call(player, "POST", "/api/guests/live", shown)[0] == 200
    live = json.loads(call(port, "GET", f"/{token}/api/live")[2])
    assert live["open"] and live["live"] and live["mode"] == "view"
    assert live["now"]["title"] == "River" and live["now"]["by"] == "folk" and live["now"]["position"] >= 30.0
    assert [s["title"] for s in live["next"]] == ["Neon Night", "Blue Hour"]  # an unknown song is left out
    assert live["next"][0]["new"] is True and live["next"][0]["at"] == 1
    text = json.dumps(live)
    assert "flac" not in text and "songs" not in text and str(Path.home()) not in text
    cover = call(port, "GET", f"/{token}/cover/{song['River']}")
    assert cover[0] == 200 and cover[1]["Content-Type"] == "image/jpeg" and cover[2] == JPEG
    assert call(port, "GET", f"/{token}/cover/ffffffffffff")[0] == 404
    assert json.loads(call(player, "GET", "/api/guests")[2])["guests"] == 1


def test_the_host_decides_whether_guests_may_change_the_playlist(
    party: tuple[Library, GuestHub, int],
) -> None:
    library, hub, player = party
    call(player, "PUT", "/api/guests", {"on": True})
    port, token = hub.settings["port"], hub.settings["token"]
    song = ids(library)
    up = {"op": "up", "id": song["Blue Hour"], "at": 2}
    assert call(port, "POST", f"/{token}/api/wish", up)[0] == 403  # view only
    assert call(port, "GET", f"/{token}/api/songs?q=neon")[0] == 403
    call(player, "PUT", "/api/guests", {"mode": "change"})
    found = json.loads(call(port, "GET", f"/{token}/api/songs?q=neon")[2])["songs"]
    assert [s["title"] for s in found] == ["Neon Night"] and set(found[0]) == {
        "id",
        "title",
        "by",
        "seconds",
        "cover",
    }
    assert call(port, "POST", f"/{token}/api/wish", up)[0] == 200
    add = {"op": "add", "id": song["River"], "where": "end"}
    assert call(port, "POST", f"/{token}/api/wish", add)[0] == 200
    for bad in (
        {"op": "shuffle", "id": song["River"]},
        {"op": "add", "id": song["River"], "where": "first"},
        {"op": "up", "id": song["River"]},
        {"op": "remove", "id": "ffffffffffff", "at": 1},
    ):
        assert call(port, "POST", f"/{token}/api/wish", bad)[0] == 400
    raw = http.client.HTTPConnection("127.0.0.1", port, timeout=10)
    raw.request("POST", f"/{token}/api/wish", body=json.dumps(up), headers={"Content-Type": "text/plain"})
    assert raw.getresponse().status == 415
    raw.close()
    wishes = json.loads(call(player, "GET", "/api/guests/wishes?after=0")[2])
    assert [(w["op"], w["n"]) for w in wishes["wishes"]] == [("up", 1), ("add", 2)] and wishes["last"] == 2
    assert wishes["wishes"][1]["where"] == "end"
    assert json.loads(call(player, "GET", "/api/guests/wishes?after=2")[2])["wishes"] == []
    # one guest cannot flood the page
    statuses = [
        call(port, "POST", f"/{token}/api/wish", up)[0] for _ in range(guest_module.WISHES_PER_MINUTE)
    ]
    assert statuses[-1] == 429


def test_the_guests_address_is_on_this_computers_network() -> None:
    for address in guest_module.lan_addresses():
        assert not address.startswith(("127.", "169.254.")) and address.count(".") == 3
