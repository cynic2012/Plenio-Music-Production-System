"""Party songs made from the player (owner's request 2026-10-25; docs/design/party-songs.md §3): who may, the line
(move among one's own places, edit and delete while waiting), the worker that sends one song at a time to the Song
API and follows it, the finished song in the library, the estimates - and the routes of the player's and the
guests' servers."""

from __future__ import annotations

import http.client
import json
import threading
from collections.abc import Iterator
from pathlib import Path
from typing import Any

import pytest

from plenio.player import guest as guest_module
from plenio.player import maker as maker_module
from plenio.player.accounts import Accounts
from plenio.player.guest import GuestHub
from plenio.player.library import Library
from plenio.player.maker import MakerError, PartySongs, Studio, StudioError, StudioUnavailableError
from plenio.player.server import State, serve

ADMIN = {"kind": "admin", "id": "admin", "name": "Admin"}
ANNA = {"kind": "user", "id": "aaaaaaaaaaaa", "name": "Anna"}
BEN = {"kind": "user", "id": "bbbbbbbbbbbb", "name": "Ben"}
GUEST = {"kind": "guest", "id": "g123", "name": "Guest"}
SONG = {
    "genre": "synthwave",
    "length": "about 2:00",
    "vocals": "sung",
    "language": "English",
    "voice": "warm female vocal",
}


class FakeStudio:
    """The Song API as the worker sees it: jobs it was sent, their status as the test sets it."""

    def __init__(self) -> None:
        self.sent: list[dict[str, Any]] = []
        self.keys: list[str] = []
        self.uploads: list[tuple[str, bytes]] = []
        self.cancelled: list[str] = []
        self.views: dict[str, dict[str, Any]] = {}
        self.down = False
        self.refuse: StudioError | None = None

    def _check(self) -> None:
        if self.down:
            raise StudioUnavailableError("ComfyUI is not running")

    def queue(self) -> dict[str, Any]:
        self._check()
        return {"running": None, "pending": 0, "pending_api": [], "recent": []}

    def template(self, template_id: str) -> dict[str, Any]:
        raise StudioUnavailableError("not in this test")

    def briefs(self, kind: str) -> dict[str, Any]:
        raise StudioUnavailableError("not in this test")

    def upload(self, path: Path, name: str) -> dict[str, Any]:
        self._check()
        self.uploads.append((name, path.read_bytes()))
        return {"name": f"plenio-api-000000000000-{name}", "bytes": path.stat().st_size}

    def create(self, body: dict[str, Any], key: str) -> dict[str, Any]:
        self._check()
        if self.refuse is not None:
            raise self.refuse
        self.sent.append(body)
        self.keys.append(key)
        job_id = f"comfy-{len(self.sent)}"
        self.views[job_id] = {"id": job_id, "status": "queued", "queue_position": 1}
        return dict(self.views[job_id])

    def job(self, job_id: str) -> dict[str, Any]:
        self._check()
        if job_id not in self.views:
            raise StudioError(404, "not_found", "no such job")
        return dict(self.views[job_id])

    def cancel(self, job_id: str) -> dict[str, Any]:
        self.cancelled.append(job_id)
        return {"id": job_id, "status": "cancelled"}


def record(title: str) -> dict[str, Any]:
    return {
        "schema": "plenio.release/1",
        "title": title,
        "created": "2026-10-25T20:00:00Z",
        "prompt": {"1": {"class_type": "PlenioSongBrief", "inputs": {"genre": "synthwave"}}},
        "audio": {"seconds": 120.0, "tags": {"artist": "Anna", "album": "Party-Song 2026-10-25"}},
        "files": [{"name": f"{title}.flac", "format": "flac"}],
    }


class Clock:
    def __init__(self) -> None:
        self.now = 1_800_000_000.0

    def __call__(self) -> float:
        return self.now


@pytest.fixture
def party(tmp_path: Path) -> tuple[PartySongs, FakeStudio, Clock, Library]:
    library_folder = tmp_path / "library"
    library_folder.mkdir()
    library = Library([library_folder], cache=tmp_path / "state" / "cache.json")
    studio = FakeStudio()
    clock = Clock()
    songs = PartySongs(library, tmp_path / "state", studio, clock=clock)  # type: ignore[arg-type]
    songs.configure({"on": True})
    return songs, studio, clock, library


def test_nobody_but_the_admin_makes_songs_until_it_is_switched_on(tmp_path: Path) -> None:
    songs = PartySongs(Library([tmp_path]), tmp_path / "state", FakeStudio())  # type: ignore[arg-type]
    assert songs.may(ADMIN) == (True, "")
    assert songs.may(ANNA)[0] is False and songs.may(GUEST)[0] is False
    songs.configure({"on": True, "guests": False})
    assert songs.may(ANNA) == (True, "") and songs.may(GUEST)[0] is False and not songs.guests_may()
    with pytest.raises(MakerError) as error:
        songs.create(GUEST, {"fields": SONG})
    assert error.value.status == 403
    kept = json.loads((tmp_path / "state" / "party-songs.json").read_text(encoding="utf-8"))
    assert kept["settings"]["on"] is True and kept["settings"]["guests"] is False


def test_a_song_waits_in_the_line_and_only_its_owner_and_the_admin_see_it(party: Any) -> None:
    songs, _studio, _clock, _library = party
    made = songs.create(GUEST, {"fields": {**SONG, "description": "  a  night\ndrive  "}})
    assert made["status"] == "waiting" and made["position"] == 1 and made["mine"]
    assert made["label"] == "synthwave · 2:00 · warm female vocal"
    assert made["fields"]["description"] == "a night\ndrive"
    assert made["can"] == {"edit": True, "up": False, "down": False, "delete": True}
    assert songs.listing(ANNA) == []
    everyone = songs.status(ADMIN, everyone=True)["jobs"]
    assert [j["owner"] for j in everyone] == [{"kind": "guest", "name": "Guest"}]
    assert "fields" not in songs.view(songs.jobs[0], ANNA)


@pytest.mark.parametrize(
    ("fields", "message"),
    [
        ({"genre": ""}, "Choose a style"),
        ({**SONG, "length": "very long (about 6:00)"}, "up to about 4:00"),
        ({**SONG, "vocals": "rap"}, "Vocals"),
        ({**SONG, "genre": "x" * 121}, "too long"),
        ({**SONG, "description": "x" * 1501}, "too long"),
        ({**SONG, "template": "../evil"}, "No such style"),
    ],
)
def test_a_form_that_is_not_right_is_refused(party: Any, fields: dict[str, Any], message: str) -> None:
    songs = party[0]
    with pytest.raises(MakerError, match=message):
        songs.create(ANNA, {"fields": fields})


def test_the_admin_may_make_longer_songs_and_a_length_in_minutes_is_one_of_the_choices(party: Any) -> None:
    songs = party[0]
    assert (
        songs.create(ADMIN, {"fields": {**SONG, "length": "very long (about 6:00)"}})["fields"]["length"]
        == "very long (about 6:00)"
    )
    assert songs.create(ANNA, {"fields": {**SONG, "length": "2:25"}})["fields"]["length"] == "about 2:30"
    assert songs.form(ANNA)["song"]["choices"]["length"][-1] == "about 4:00"
    assert songs.form(ADMIN)["song"]["choices"]["length"][-1] == "very long (about 6:00)"


def test_a_person_has_so_many_songs_in_the_making(party: Any) -> None:
    songs = party[0]
    songs.configure({"per_person": 2})
    songs.create(GUEST, {"fields": SONG})
    songs.create(GUEST, {"fields": SONG})
    with pytest.raises(MakerError) as error:
        songs.create(GUEST, {"fields": SONG})
    assert error.value.status == 429
    songs.create(ANNA, {"fields": SONG})  # another person
    for _ in range(3):
        songs.create(ADMIN, {"fields": SONG})  # the admin has no limit


def test_one_moves_among_ones_own_places_and_the_admin_moves_any(party: Any) -> None:
    songs = party[0]
    a1 = songs.create(ANNA, {"fields": {**SONG, "genre": "a1"}})["id"]
    songs.create(BEN, {"fields": {**SONG, "genre": "b1"}})
    a2 = songs.create(ANNA, {"fields": {**SONG, "genre": "a2"}})["id"]

    def order() -> list[str]:
        return [j["fields"]["genre"] for j in songs.jobs if j["status"] == "waiting"]

    assert songs.view(songs.jobs[2], ANNA)["can"]["up"] is True
    songs.move(ANNA, a2, -1)
    assert order() == ["a2", "b1", "a1"]  # Ben keeps his place in the middle
    with pytest.raises(MakerError, match="first already"):
        songs.move(ANNA, a2, -1)
    songs.move(ADMIN, a1, -1)
    assert order() == ["a2", "a1", "b1"]
    with pytest.raises(MakerError) as error:
        songs.move(BEN, a1, 1)
    assert error.value.status == 404  # not his song


def test_a_waiting_song_is_edited_and_one_being_made_is_not(party: Any) -> None:
    songs, studio, _clock, _library = party
    job = songs.create(ANNA, {"fields": SONG})["id"]
    assert songs.update(ANNA, job, {"fields": {**SONG, "genre": "disco"}})["fields"]["genre"] == "disco"
    songs.tick()
    assert studio.sent and songs.jobs[0]["status"] == "queued"
    with pytest.raises(MakerError) as error:
        songs.update(ANNA, job, {"fields": SONG})
    assert error.value.status == 409


def test_the_worker_sends_one_song_at_a_time_with_the_party_settings(party: Any) -> None:
    songs, studio, clock, _library = party
    first = songs.create(GUEST, {"fields": {**SONG, "template": "electronic/synthwave"}})["id"]
    songs.create(ANNA, {"fields": {**SONG, "vocals": "instrumental", "voice": "ignored"}})
    songs.tick()
    assert len(studio.sent) == 1 and studio.keys == [f"plenio-player-{first}"]
    body = studio.sent[0]
    assert body["template"] == "yue2-song" and body["strict"] is False
    assert body["fields"]["finish.hq_mastering"] is False and body["fields"]["finish.cover_art"] is True
    assert body["fields"]["template"] == "electronic/synthwave" and body["fields"]["length"] == "about 2:00"
    date = maker_module._today(clock.now)
    assert body["release"] == {
        "folder": f"plenio/Party-Songs-{date}",
        "album": f"Party-Song {date}",
        "artist": "Guest",
    }
    songs.tick()
    assert len(studio.sent) == 1  # the next waits for this one
    studio.views["comfy-1"] = {
        "id": "comfy-1",
        "status": "succeeded",
        "started_at": clock.now - 300,
        "finished_at": clock.now,
        "result": {"title": "Neon", "record": ""},
    }
    songs.tick()
    songs.tick()
    assert len(studio.sent) == 2
    second = studio.sent[1]
    assert (
        second["release"]["artist"] == "Anna" and "voice" not in second["fields"]
    )  # an instrumental has no voice


def test_a_finished_song_comes_into_the_library_also_from_outside_its_folders(
    party: Any, tmp_path: Path
) -> None:
    songs, studio, clock, library = party
    songs.create(ANNA, {"fields": SONG})
    songs.tick()
    party_folder = tmp_path / "comfy-output" / "plenio" / "Party-Songs-2026-10-25"
    party_folder.mkdir(parents=True)
    path = party_folder / "Neon.plenio.json"
    path.write_text(json.dumps(record("Neon")), encoding="utf-8")
    (party_folder / "Neon.flac").write_bytes(b"f" * 64)
    studio.views["comfy-1"] = {
        "id": "comfy-1",
        "status": "running",
        "started_at": clock.now,
        "stage": {"group": "5 · RENDER", "text": "singing and playing"},
    }
    songs.tick()
    running = songs.listing(ANNA)[0]
    assert (
        running["status"] == "running"
        and running["stage"]["text"] == "singing and playing"
        and running["eta"]
    )
    clock.now += 400
    studio.views["comfy-1"] = {
        "id": "comfy-1",
        "status": "succeeded",
        "started_at": clock.now - 400,
        "finished_at": clock.now,
        "result": {"title": "Neon", "record": str(path)},
    }
    songs.tick()
    done = songs.listing(ANNA)[0]
    assert done["status"] == "done" and done["result"]["title"] == "Neon"
    song = library.song(done["result"]["song"])
    assert song is not None and song.record == path
    assert songs.folders == [str(party_folder.resolve())]
    assert song.summary["title"] == "Neon"
    # the estimates learnt how long a song takes here: a two-minute song took 400 s
    assert songs.estimate(songs.jobs[0]) == pytest.approx(400, rel=0.01)


def test_a_song_comfyui_forgot_is_made_again_once(party: Any) -> None:
    songs, studio, _clock, _library = party
    songs.create(ANNA, {"fields": SONG})
    songs.tick()
    studio.views.clear()  # ComfyUI restarted
    songs.tick()
    job = songs.jobs[0]
    assert job["status"] == "waiting" and job["retried"] and job["note"].startswith("ComfyUI restarted")
    songs.tick()
    studio.views.clear()
    songs.tick()
    assert songs.jobs[0]["status"] == "failed" and "lost" in songs.jobs[0]["error"]


def test_without_comfyui_the_song_waits_and_a_refusal_is_said(party: Any) -> None:
    songs, studio, _clock, _library = party
    studio.down = True
    songs.create(ANNA, {"fields": SONG})
    songs.tick()
    assert songs.jobs[0]["status"] == "waiting" and not studio.sent
    assert songs.status(ADMIN)["studio"]["reachable"] is False
    studio.down = False
    songs.studio_state["checked"] = 0.0
    studio.refuse = StudioError(400, "comfyui_rejected", "ComfyUI refused the run: a model file is missing.")
    songs.tick()
    assert songs.jobs[0]["status"] == "failed" and "model file" in songs.jobs[0]["error"]


def test_deleting_takes_a_waiting_song_out_and_stops_one_being_made(party: Any) -> None:
    songs, studio, _clock, _library = party
    first = songs.create(ANNA, {"fields": SONG})["id"]
    second = songs.create(ANNA, {"fields": SONG})["id"]
    assert songs.remove(ANNA, second) == {"id": second, "removed": True}
    songs.tick()
    stopped = songs.remove(ANNA, first)
    assert stopped["status"] == "cancelled" and studio.cancelled == ["comfy-1"]
    assert songs.remove(ANNA, first) == {"id": first, "removed": True}  # off the list
    assert songs.jobs == []


def test_a_cover_sends_its_recording_and_keeps_the_originals_tempo_and_length(party: Any) -> None:
    songs, studio, _clock, _library = party
    source = songs.add_source(GUEST, "My Song.mp3", b"ID3" + b"\x00" * 64)
    assert source["name"] == "My Song.mp3" and source["title"] == "My Song"
    with pytest.raises(MakerError, match="audio file"):
        songs.add_source(GUEST, "evil.exe", b"MZ")
    job = songs.create(
        GUEST,
        {
            "source": source["id"],
            "fields": {"genre": "jazz", "vocals": "original lyrics", "tempo": "120 BPM", "theme": "x"},
        },
    )
    assert job["kind"] == "cover" and job["label"].startswith("Cover of My Song")
    with pytest.raises(MakerError, match="No such recording"):
        songs.create(ANNA, {"source": source["id"], "fields": {"genre": "jazz"}})  # not her recording
    songs.tick()
    body = studio.sent[0]
    assert body["template"] == "yue2-cover" and studio.uploads[0][0] == "My Song.mp3"
    assert body["fields"]["source.audio"] == "plenio-api-000000000000-My Song.mp3"
    assert "tempo" not in body["fields"] and "theme" not in body["fields"]  # original lyrics keep their theme
    songs.configure({"covers": False})
    with pytest.raises(MakerError) as error:
        songs.add_source(GUEST, "b.mp3", b"ID3")
    assert error.value.status == 403


def test_the_line_says_roughly_when_each_song_will_be_ready(party: Any) -> None:
    songs, _studio, clock, _library = party
    for _ in range(3):
        songs.create(ANNA, {"fields": SONG})
    jobs = songs.listing(ANNA)
    etas = [j["eta"] for j in jobs]
    assert etas == sorted(etas) and etas[0] > clock.now
    per_song = songs.estimate(songs.jobs[0])
    assert etas[2] - etas[1] == pytest.approx(per_song, abs=1.5)
    assert [j["position"] for j in jobs] == [1, 2, 3]


def test_the_state_survives_a_restart(party: Any, tmp_path: Path) -> None:
    songs, studio, _clock, library = party
    songs.create(ANNA, {"fields": SONG})
    songs.jobs[0]["status"] = "sending"
    songs._save()
    again = PartySongs(library, tmp_path / "state", studio)  # type: ignore[arg-type]
    assert again.jobs[0]["status"] == "waiting" and again.settings["on"] is True


def test_who_made_a_party_song_is_shown_as_the_admin_chooses(party: Any, tmp_path: Path) -> None:
    songs, studio, _clock, library = party
    assert songs.settings["credit"] == "off"  # not shown until the admin says so
    with pytest.raises(MakerError):
        songs.configure({"credit": "everywhere"})
    songs.configure({"credit": "drift"})
    assert songs.status(ANNA)["settings"]["credit"] == "drift"  # every listener's player shows it
    assert PartySongs(library, tmp_path / "state", studio).settings["credit"] == "drift"  # type: ignore[arg-type]
    assert maker_module.party_maker({"album": "Party-Song 2026-10-25", "artist": "Anna"}) == "Anna"
    assert maker_module.party_maker({"album": "Party-Song 2026-10-25"}) == "Guest"
    assert maker_module.party_maker({"album": "Summer", "artist": "Anna"}) is None


def test_the_guests_see_who_made_the_party_song_that_plays(party: Any, tmp_path: Path) -> None:
    songs, _studio, _clock, library = party
    folder = tmp_path / "library" / "Party-Songs-2026-10-25"
    folder.mkdir()
    (folder / "Neon.plenio.json").write_text(json.dumps(record("Neon")), encoding="utf-8")
    (folder / "Neon.flac").write_bytes(b"f" * 64)
    library.scan(force=True)
    song_id = library.songs()[0]["id"]
    hub = GuestHub(library, tmp_path / "state", host="127.0.0.1")
    hub.maker = songs
    hub.publish({"live": True, "playing": True, "now": {"id": song_id}})
    assert hub.snapshot["now"]["made_by"] == ""  # the admin has not chosen to show it
    songs.configure({"credit": "spotlight"})
    hub.publish({"live": True, "playing": True, "now": {"id": song_id}, "next": [{"id": song_id}]})
    assert hub.snapshot["now"]["made_by"] == "Anna" and hub.snapshot["next"][0]["made_by"] == "Anna"


# --- the Song API over HTTP -----------------------------------------------------------------------------


def test_the_studio_client_says_why_and_asks_only_this_computer() -> None:
    with pytest.raises(StudioUnavailableError):
        Studio(lambda: "http://192.168.1.5:8188").queue()
    with pytest.raises(StudioUnavailableError):
        Studio(lambda: None).queue()


# --- the routes ---------------------------------------------------------------------------------------------


def call(
    port: int, method: str, path: str, body: Any = None, raw: bytes | None = None, **headers: str
) -> tuple[int, dict[str, str], Any]:
    connection = http.client.HTTPConnection("127.0.0.1", port, timeout=10)
    data = raw if raw is not None else (json.dumps(body).encode() if body is not None else None)
    if body is not None:
        headers.setdefault("Content-Type", "application/json")
    connection.request(method, path, body=data, headers=headers)
    answer = connection.getresponse()
    payload = answer.read()
    connection.close()
    try:
        parsed = json.loads(payload)
    except ValueError:
        parsed = payload
    return answer.status, dict(answer.getheaders()), parsed


@pytest.fixture
def servers(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> Iterator[tuple[int, GuestHub, PartySongs, FakeStudio]]:
    library = Library([tmp_path / "library"], cache=tmp_path / "state" / "cache.json")
    studio = FakeStudio()
    songs = PartySongs(library, tmp_path / "state", studio)  # type: ignore[arg-type]
    monkeypatch.setattr(guest_module, "PORTS", range(0, 1))
    hub = GuestHub(library, tmp_path / "state", host="127.0.0.1")
    hub.maker = songs
    page = tmp_path / "guest_static"
    (page / "assets").mkdir(parents=True)
    (page / "index.html").write_text("<!doctype html><title>Plenio · Make a song</title>", encoding="utf-8")
    (page / "assets" / "make-1.js").write_text("console.log(1)", encoding="utf-8")
    monkeypatch.setattr(guest_module, "MAKER_PAGE", page)
    player = serve(
        library,
        State(tmp_path / "state" / "state.json"),
        "127.0.0.1",
        0,
        guests=hub,
        accounts=Accounts(tmp_path / "state"),
        maker=songs,
    )
    threading.Thread(target=player.serve_forever, daemon=True).start()
    yield player.server_address[1], hub, songs, studio
    hub.close()
    player.shutdown()
    player.server_close()


def test_the_players_routes(servers: Any) -> None:
    port, _hub, songs, _studio = servers
    status, _headers, answer = call(port, "GET", "/api/make")
    assert status == 200 and answer["admin"] is True and answer["may"] is True and answer["on"] is False
    # a guest from the network (the gateway's header): no account, a cookie of their own
    status, headers, answer = call(port, "GET", "/api/make", **{"X-Plenio-Remote": "1"})
    assert answer["me"] == {"kind": "guest", "name": "Guest"} and answer["may"] is False
    cookie = headers["Set-Cookie"].split(";")[0]
    assert cookie.startswith("plenio_maker=") and "HttpOnly" in headers["Set-Cookie"]
    assert (
        call(port, "PUT", "/api/make/settings", {"on": True}, **{"X-Plenio-Remote": "1", "Cookie": cookie})[0]
        == 403
    )
    assert call(port, "PUT", "/api/make/settings", {"on": True})[2]["settings"]["on"] is True
    made = call(
        port, "POST", "/api/make/jobs", {"fields": SONG}, **{"X-Plenio-Remote": "1", "Cookie": cookie}
    )
    assert made[0] == 201 and made[2]["mine"] and "Set-Cookie" not in made[1]
    mine = call(port, "GET", "/api/make", **{"X-Plenio-Remote": "1", "Cookie": cookie})[2]
    assert [j["id"] for j in mine["jobs"]] == [made[2]["id"]]
    assert call(port, "GET", "/api/make", **{"X-Plenio-Remote": "1"})[2]["jobs"] == []  # another browser
    # changes only as JSON from the page; a recording only with the page's header
    assert call(port, "POST", "/api/make/jobs", raw=b"{}", **{"Content-Type": "text/plain"})[0] == 403
    assert call(port, "POST", "/api/make/sources?name=a.mp3", raw=b"ID3x")[0] == 403
    source = call(port, "POST", "/api/make/sources?name=a.mp3", raw=b"ID3x", **{"X-Plenio-Player": "1"})
    assert source[0] == 201 and source[2]["name"] == "a.mp3"
    job_id = made[2]["id"]
    assert (
        call(
            port,
            "PUT",
            f"/api/make/jobs/{job_id}",
            {"fields": {**SONG, "genre": "ska"}},
            **{"X-Plenio-Remote": "1", "Cookie": cookie},
        )[2]["fields"]["genre"]
        == "ska"
    )
    assert (
        call(
            port,
            "POST",
            f"/api/make/jobs/{job_id}/move",
            {"by": -1},
            **{"X-Plenio-Remote": "1", "Cookie": cookie},
        )[0]
        == 409
    )
    assert call(port, "GET", "/api/make/form")[2]["templates"]  # the package's templates without ComfyUI
    assert call(
        port,
        "DELETE",
        f"/api/make/jobs/{job_id}",
        **{"X-Plenio-Remote": "1", "Cookie": cookie, "Content-Type": "application/json"},
    )[2] == {"id": job_id, "removed": True}
    assert songs.jobs == []


def test_the_guests_server_lets_party_guests_make_songs_when_the_host_allows(servers: Any) -> None:
    port, hub, songs, _studio = servers
    call(port, "PUT", "/api/guests", {"on": True})
    guest_port, token = hub.settings["port"], hub.settings["token"]
    assert json.loads(json.dumps(call(guest_port, "GET", f"/{token}/api/live")[2]))["make"] is False
    assert call(guest_port, "GET", f"/{token}/api/make")[0] == 403
    songs.configure({"on": True})
    assert call(guest_port, "GET", f"/{token}/api/live")[2]["make"] is True
    status, headers, answer = call(guest_port, "GET", f"/{token}/api/make")
    assert status == 200 and answer["me"]["kind"] == "guest"
    cookie = headers["Set-Cookie"].split(";")[0]
    made = call(guest_port, "POST", f"/{token}/api/make/jobs", {"fields": SONG}, Cookie=cookie)
    assert made[0] == 201
    assert (
        call(
            guest_port,
            "POST",
            f"/{token}/api/make/jobs",
            raw=b"{}",
            **{"Content-Type": "text/plain", "Cookie": cookie},
        )[0]
        == 415
    )
    assert (
        call(guest_port, "POST", f"/{token}/api/make/sources?name=a.mp3", raw=b"ID3x", Cookie=cookie)[0]
        == 403
    )
    assert (
        call(
            guest_port,
            "POST",
            f"/{token}/api/make/sources?name=a.mp3",
            raw=b"ID3x",
            **{"Cookie": cookie, "X-Plenio-Live": "1"},
        )[0]
        == 201
    )
    assert (
        call(guest_port, "DELETE", f"/{token}/api/make/jobs/{made[2]['id']}", Cookie=cookie)[2]["removed"]
        is True
    )
    page = call(guest_port, "GET", f"/{token}/make/")
    assert (
        page[0] == 200
        and b"Make a song" in page[2]
        and "script-src 'self'" in page[1]["Content-Security-Policy"]
    )
    asset = call(guest_port, "GET", f"/{token}/make/assets/make-1.js")
    assert asset[0] == 200 and asset[1]["Content-Type"].startswith("text/javascript")
    assert call(guest_port, "GET", f"/{token}/make")[1]["Location"] == f"/{token}/make/"
    for wrong in ("/make/assets/../index.html", "/make/assets/.hidden.js", "/make/other"):
        assert call(guest_port, "GET", f"/{token}{wrong}")[0] == 404
    assert call(guest_port, "GET", "/make/")[0] == 404  # without the token: nothing
