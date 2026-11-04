"""``nodestro``: start the studio on localhost (API, interface and documentation on one port)."""

from __future__ import annotations

import threading
import webbrowser

from nodestro_api.cli import parser, prepare, serve


def main(argv: list[str] | None = None) -> None:
    options = parser("nodestro", "Nodestro - Visual AI Agent Studio")
    options.add_argument("--no-browser", action="store_true", help="Do not open the browser")
    args = options.parse_args(argv)
    url = prepare(args)
    # serve() stops on a taken port with one sentence (exit code 2) after the configuration checks: nothing says
    # "running" and no browser opens the other program (DX handover B2).

    def ready() -> None:
        print(f"Nodestro is running at {url}  (stop with Ctrl+C)", flush=True)
        if not args.no_browser:
            threading.Thread(target=webbrowser.open, args=(url,), name="nodestro-browser", daemon=True).start()

    serve("nodestro_studio.app:create_app", args, ready=ready)


if __name__ == "__main__":  # pragma: no cover
    main()
