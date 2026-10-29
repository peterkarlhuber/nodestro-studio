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
    print(f"Nodestro is running at {url}  (stop with Ctrl+C)")
    if not args.no_browser:
        threading.Timer(1.2, lambda: webbrowser.open(url)).start()
    serve("nodestro_studio.app:create_app", args)


if __name__ == "__main__":  # pragma: no cover
    main()
