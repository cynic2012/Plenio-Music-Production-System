"""Start the Plenio Player from ComfyUI with one click (owner's request 2026-10-16): find a player that runs on
this computer, or start one - as a program of its own, which keeps running when ComfyUI stops.

Standard library only; ComfyUI's route (``plenio.comfy.routes``) calls :func:`ensure_player` in a thread.
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

PACKAGE_ROOT = Path(__file__).resolve().parents[2]
SCRIPT = PACKAGE_ROOT / "plenio_player.py"
PORTS = range(8765, 8770)
APP = "plenio-player"


def player_at(port: int, timeout: float = 0.6) -> dict[str, Any] | None:
    """The Plenio Player answering on ``127.0.0.1:port`` (its ``/api/info``), else ``None``."""
    try:
        with urllib.request.urlopen(f"http://127.0.0.1:{port}/api/info", timeout=timeout) as answer:  # noqa: S310 - loopback only
            info = json.loads(answer.read().decode("utf-8"))
    except (OSError, ValueError):
        return None
    return info if isinstance(info, dict) and info.get("app") == APP else None


def _port_free(port: int) -> bool:
    """Nothing listens on ``127.0.0.1:port`` (any answer, even an error page, means taken)."""
    try:
        urllib.request.urlopen(f"http://127.0.0.1:{port}/", timeout=0.4)  # noqa: S310 - loopback only
    except urllib.error.HTTPError:
        return False
    except OSError:
        return True
    return False


def find_player() -> tuple[int, dict[str, Any]] | None:
    """A Plenio Player running on one of the player's ports."""
    for port in PORTS:
        info = player_at(port)
        if info:
            return port, info
    return None


def start_player(folder: Path, comfyui: str, port: int, state: Path) -> subprocess.Popen[bytes]:
    """Start a player in the background: this Python, the package's ``plenio_player.py`` (it puts the package
    on its own import path, also in the portable build's embedded Python), a fixed argument list, no shell,
    no window, detached from ComfyUI. Its output goes to ``player.log`` in its state folder."""
    state.mkdir(parents=True, exist_ok=True)
    log = (state / "player.log").open("ab")
    flags: dict[str, Any] = {}
    if os.name == "nt":
        flags["creationflags"] = subprocess.DETACHED_PROCESS | subprocess.CREATE_NEW_PROCESS_GROUP
    else:
        flags["start_new_session"] = True
    # the launcher script; a copy of the package without it (some installs copy only the folders) runs the
    # module with the package on the import path
    env = {**os.environ, "PYTHONIOENCODING": "utf-8"}
    if SCRIPT.is_file():
        command = [sys.executable, str(SCRIPT)]
    else:
        command = [sys.executable, "-m", "plenio.player"]
        env["PYTHONPATH"] = os.pathsep.join(p for p in (str(PACKAGE_ROOT), env.get("PYTHONPATH", "")) if p)
    command += ["--no-browser", "--port", str(port), "--folder", str(folder)]
    if comfyui:
        command += ["--comfyui", comfyui]
    try:
        return subprocess.Popen(  # noqa: S603 - fixed argv, no shell
            command,
            cwd=str(PACKAGE_ROOT),
            stdin=subprocess.DEVNULL,
            stdout=log,
            stderr=subprocess.STDOUT,
            env=env,
            **flags,
        )
    finally:
        log.close()


def ensure_player(folder: Path, comfyui: str, state: Path, wait: float = 25.0) -> dict[str, Any]:
    """The address of a running Plenio Player - the one found, or one started now. ``started`` says which;
    raises ``RuntimeError`` when the player did not come up (the end of its log says why)."""
    found = find_player()
    if found:
        running, info = found
        return {"url": f"http://127.0.0.1:{running}/", "started": False, "version": info.get("version", "")}
    port = next((p for p in PORTS if _port_free(p)), None)
    if port is None:
        raise RuntimeError(f"Ports {PORTS.start}-{PORTS.stop - 1} are all taken by other programs.")
    process = start_player(folder, comfyui, port, state)
    deadline = time.monotonic() + wait
    while time.monotonic() < deadline:
        answer = player_at(port)
        if answer:
            return {"url": f"http://127.0.0.1:{port}/", "started": True, "version": answer.get("version", "")}
        if process.poll() is not None:
            break
        time.sleep(0.3)
    tail = ""
    try:
        tail = (state / "player.log").read_text(encoding="utf-8", errors="replace").strip().splitlines()[-1]
    except (OSError, IndexError):
        pass
    raise RuntimeError(f"The Plenio Player did not start. {tail}".strip())
