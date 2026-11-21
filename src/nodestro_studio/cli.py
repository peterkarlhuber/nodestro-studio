"""``nodestro``: start the studio on localhost (API, interface and documentation on one port)."""

from __future__ import annotations

import threading
import webbrowser

from nodestro_api.cli import parser, prepare, serve, terminal_launch


def main(argv: list[str] | None = None) -> None:
    options = parser("nodestro", "Nodestro - Visual AI Agent Studio")
    options.add_argument("--no-browser", action="store_true", help="Do not open the browser")
    args = options.parse_args(argv)
    url = prepare(args)
    # serve() stops on a taken port with one sentence (exit code 2) after the configuration checks: nothing says
    # "running" and no browser opens the other program (DX handover B2).

    def ready() -> None:
        print(f"Nodestro is running at {url}  (stop with Ctrl+C)", flush=True)
        # NODESTRO_TERMINAL_LAUNCH (NS-002, off by default): this process issued a launch secret. The browser opens
        # the file:// path of a 0600 redirect file, never the link itself (a browser's command line is readable by
        # every local user); the link is printed to this terminal only.
        found = terminal_launch(url, write_file=not args.no_browser)
        target: str | None = url
        if found is not None:
            link, file = found
            print(f"Open Nodestro once with this link: {link}", flush=True)
            target = file.as_uri() if file is not None else None
        if not args.no_browser and target is not None:
            threading.Thread(target=webbrowser.open, args=(target,), name="nodestro-browser", daemon=True).start()

    serve("nodestro_studio.app:create_app", args, ready=ready)


if __name__ == "__main__":  # pragma: no cover
    main()
