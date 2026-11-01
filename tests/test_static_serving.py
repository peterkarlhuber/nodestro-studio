"""How the built interface is served: gzip for text files, long caching for hashed assets, nothing else touched."""

from __future__ import annotations

from collections.abc import Callable
import gzip
from pathlib import Path

from fastapi.testclient import TestClient
from nodestro_runtime.testing import text
import pytest

from nodestro_studio.app import CACHE_HASHED, CACHE_REVALIDATE

ASSISTANT = "You are the Nodestro Assistant"
GZIP = {"Accept-Encoding": "gzip"}
BUNDLE = "index-Abc123.js"


@pytest.fixture
def static_dir(tmp_path: Path) -> Path:
    """A small stand-in for ``npm run build``: index.html, hashed assets and a file of the public folder."""
    static = tmp_path / "static"
    (static / "assets").mkdir(parents=True)
    (static / "index.html").write_text(
        '<!doctype html><html><head><script type="module" src="/assets/index-Abc123.js"></script></head>'
        + "<body><div id='root'></div></body></html>\n" * 40
    )
    (static / "assets" / BUNDLE).write_text("export const greeting = 'Hello, world';\n" * 20_000)
    (static / "assets" / "index-Def456.css").write_text("body { margin: 0; color: #222; }\n" * 500)
    (static / "assets" / "tiny-Ghi789.js").write_text("export {};\n")
    (static / "assets" / "logo-Jkl012.png").write_bytes(b"\x89PNG\r\n\x1a\n" + bytes(4096))
    (static / "manifest.webmanifest").write_text('{"name": "Nodestro", "icons": []}' + " " * 2048)
    return static


def test_a_large_bundle_is_gzipped_and_cached_for_a_year(make_app: Callable[..., TestClient], static_dir: Path) -> None:
    client = make_app(static_dir=static_dir)
    response = client.get(f"/assets/{BUNDLE}", headers=GZIP)
    assert response.status_code == 200
    assert response.headers["content-encoding"] == "gzip"
    assert "Accept-Encoding" in response.headers["vary"]
    assert response.headers["cache-control"] == CACHE_HASHED == "public, max-age=31536000, immutable"
    assert response.content == (static_dir / "assets" / BUNDLE).read_bytes()
    assert response.num_bytes_downloaded < len(response.content) / 10
    # The stylesheet is compressed as well; a client without gzip gets the file as it is, with the same caching.
    css = client.get("/assets/index-Def456.css", headers=GZIP)
    assert css.headers["content-encoding"] == "gzip" and css.headers["cache-control"] == CACHE_HASHED
    plain = client.get(f"/assets/{BUNDLE}", headers={"Accept-Encoding": "identity"})
    assert "content-encoding" not in plain.headers
    assert plain.headers["cache-control"] == CACHE_HASHED
    assert int(plain.headers["content-length"]) == (static_dir / "assets" / BUNDLE).stat().st_size


def test_small_and_binary_assets_are_not_compressed(make_app: Callable[..., TestClient], static_dir: Path) -> None:
    client = make_app(static_dir=static_dir)
    for name in ("tiny-Ghi789.js", "logo-Jkl012.png"):
        response = client.get(f"/assets/{name}", headers=GZIP)
        assert response.status_code == 200
        assert "content-encoding" not in response.headers, name
        assert response.headers["cache-control"] == CACHE_HASHED


def test_a_revalidated_asset_keeps_its_caching_and_a_missing_one_gets_none(
    make_app: Callable[..., TestClient], static_dir: Path
) -> None:
    client = make_app(static_dir=static_dir)
    etag = client.get(f"/assets/{BUNDLE}").headers["etag"]
    not_modified = client.get(f"/assets/{BUNDLE}", headers={**GZIP, "If-None-Match": etag})
    assert not_modified.status_code == 304
    assert not_modified.headers["cache-control"] == CACHE_HASHED
    # A chunk of an older build must not be cached for a year as a 404.
    missing = client.get("/assets/index-Old000.js", headers=GZIP)
    assert missing.status_code == 404
    assert "cache-control" not in missing.headers


@pytest.mark.parametrize("path", ["/", "/index.html", "/flows/flow_1/edit", "/settings"])
def test_index_html_and_the_spa_fallback_are_revalidated(
    make_app: Callable[..., TestClient], static_dir: Path, path: str
) -> None:
    client = make_app(static_dir=static_dir)
    response = client.get(path, headers=GZIP)
    assert response.status_code == 200
    assert response.headers["cache-control"] == CACHE_REVALIDATE == "no-cache"
    assert response.headers["content-type"].startswith("text/html")
    assert response.headers["content-encoding"] == "gzip"
    assert response.content == (static_dir / "index.html").read_bytes()
    assert "etag" in response.headers


def test_other_files_of_the_interface_are_compressed_and_revalidated(
    make_app: Callable[..., TestClient], static_dir: Path
) -> None:
    client = make_app(static_dir=static_dir)
    response = client.get("/manifest.webmanifest", headers=GZIP)
    assert response.status_code == 200
    assert response.headers["content-encoding"] == "gzip"
    assert response.headers["cache-control"] == CACHE_REVALIDATE


def test_api_responses_are_untouched(make_app: Callable[..., TestClient], static_dir: Path) -> None:
    client = make_app(static_dir=static_dir)
    # A JSON response well above the compression threshold.
    response = client.get("/api/openapi.json", headers=GZIP)
    assert response.status_code == 200 and len(response.content) > 10_000
    assert "content-encoding" not in response.headers
    assert "cache-control" not in response.headers
    assert "Accept-Encoding" not in response.headers.get("vary", "")
    unknown = client.get("/api/does-not-exist", headers=GZIP)
    assert unknown.status_code == 404 and unknown.headers["content-type"] == "application/json"
    assert "cache-control" not in unknown.headers and "content-encoding" not in unknown.headers


def test_event_streams_are_never_compressed(make_app: Callable[..., TestClient], static_dir: Path) -> None:
    """gzip buffers and would hold back the events of a live stream (text/event-stream)."""
    answer = "Done. " + "This answer is long enough to be worth compressing. " * 60
    client = make_app({ASSISTANT: [text(answer)]}, static_dir=static_dir)
    conversation = client.post("/api/assistant/conversations", json={}).json()["id"]
    sent = client.post(f"/api/assistant/conversations/{conversation}/messages", json={"content": "Hi"}).json()
    url = f"/api/assistant/conversations/{conversation}/messages/{sent['assistant']['id']}/events"
    with client.stream("GET", url, headers=GZIP) as response:
        assert response.headers["content-type"].startswith("text/event-stream")
        assert "content-encoding" not in response.headers
        assert response.headers["cache-control"] == "no-cache"
        body = b"".join(response.iter_raw())
    assert b"event: end" in body and b"This answer is long enough" in body
    with pytest.raises(gzip.BadGzipFile):
        gzip.decompress(body)
