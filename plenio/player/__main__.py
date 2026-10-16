"""Start the Plenio Player: ``python -m plenio.player [--folder <songs>] [--port 8765]``.

Without ``--folder`` it plays ComfyUI's output folder when Plenio sits in ``ComfyUI/custom_nodes``
(``PLENIO_PLAYER_FOLDER`` overrides), else the current folder. It runs without ComfyUI.
"""

from __future__ import annotations

import argparse
import os
import sys
import threading
import webbrowser
from pathlib import Path

from .. import __version__
from .library import Library
from .server import State, serve

PACKAGE_ROOT = Path(__file__).resolve().parents[2]


def default_folders() -> list[Path]:
    configured = os.environ.get("PLENIO_PLAYER_FOLDER", "").strip()
    if configured:
        return [Path(p) for p in configured.split(os.pathsep) if p.strip()]
    output = PACKAGE_ROOT.parent.parent / "output"  # ComfyUI/custom_nodes/<pack> -> ComfyUI/output
    if PACKAGE_ROOT.parent.name == "custom_nodes" and output.is_dir():
        return [output]
    return [Path.cwd()]


def say(text: str) -> None:
    sys.stdout.write(text + "\n")
    sys.stdout.flush()


def state_dir() -> Path:
    base = os.environ.get("PLENIO_PLAYER_STATE", "").strip()
    return Path(base) if base else Path.home() / ".plenio" / "player"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="plenio-player", description=__doc__)
    parser.add_argument(
        "--folder", action="append", type=Path, help="a folder with Plenio songs (repeatable)"
    )
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--no-browser", action="store_true", help="do not open the browser")
    args = parser.parse_args(argv)
    folders = args.folder or default_folders()
    directory = state_dir()
    library = Library(folders, cache=directory / "library-cache.json")
    say(f"Plenio Player {__version__}: reading the songs of {', '.join(str(f) for f in folders)} ...")
    library.scan(force=True)
    say(f"{len(library.songs())} songs ({len(library.errors)} records could not be read)")
    try:
        server = serve(library, State(directory / "state.json"), args.host, args.port)
    except OSError as error:
        say(
            f"Port {args.port} on {args.host} is taken ({error.strerror or error}) - is the player already "
            f"running? Open http://{args.host}:{args.port}/ or start it with --port {args.port + 1}."
        )
        return 1
    url = f"http://{args.host}:{server.server_address[1]}/"
    say(f"Plenio Player is running at {url} - stop it with Ctrl+C")
    if not args.no_browser:
        threading.Timer(0.6, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
