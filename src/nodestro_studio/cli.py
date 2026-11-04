"""``nodestro``: start the studio on localhost (API, interface and documentation on one port)."""

from __future__ import annotations

import threading
import webbrowser

from nodestro_api.cli import parser, prepare, require_free_port, serve


def main(argv: list[str] | None = None) -> None:
    options = parser("nodestro", "Nodestro - Visual AI Agent Studio")
    options.add_argument("--no-browser", action="store_true", help="Do not open the browser")
    args = options.parse_args(argv)
    url = prepare(args)
    # A taken port stops here with one sentence (exit code 2): nothing says "running" and no browser opens the
    # other program (DX handover B2).
    require_free_port(args)

    def ready() -> None:
        print(f"Nodestro is running at {url}  (stop with Ctrl+C)")
        if not args.no_browser:
            threading.Thread(target=webbrowser.open, args=(url,), name="nodestro-browser", daemon=True).start()

    serve("nodestro_studio.app:create_app", args, ready=ready)


if __name__ == "__main__":  # pragma: no cover
    main()
