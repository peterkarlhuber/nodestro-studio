# Releases (M6)

How Nodestro products are released, what a release contains, and which platforms are supported. Recorded
2026-10-31. Status: release candidate **`v0.2.0-preview.1`** is built and checked but **not published**; no build is
signed. The steps of every release are in [release-checklist.md](release-checklist.md).

## What gets released

| Product | Artifact | Built from | Pipeline |
| --- | --- | --- | --- |
| nodestro-desktop | `nodestro-desktop-<version>-linux-x86_64.tar.gz` | `studio.json` (a studio merge commit) | `.github/workflows/release.yml` in nodestro-desktop |
| nodestro-server | image `ghcr.io/peterkarlhuber/nodestro-server:<version>` (never `latest`) | `studio.json` (a studio merge commit) | `.github/workflows/release.yml` in nodestro-server |
| components (runtime, api, sdk, …) | not released on their own | full-SHA pins in studio | — |

`platform/versions.json` lists every component pin. Its `products` section names each product commit and the studio
commit that product builds from.

## Release steps

Building and publishing are separate workflows. Nothing is published by a push, a merge or a tag: each publishing
step is started by a person.

1. Move the product's `studio.json` to a studio merge commit whose pins agree (`scripts/check_versions.py`). Merge
   that change after CI is green; CI builds the product, writes a manifest and runs the secret scan as a dry run.
2. Update `products` in `platform/versions.json`.
3. **Candidate**: run `Release candidate` (`.github/workflows/release.yml`) by hand on master with the version. Its
   token can only read; it creates no tag, no release and no image in a registry.
   - **desktop**: checks that the version equals the shell's (`app/Cargo.toml`), builds the shell and the backend,
     runs the clean-container smoke test, writes the manifest and checksums and scans them for secrets;
   - **server**: builds the image with the version labels, runs every acceptance test against it, saves the image,
     scans every layer and the release files for secrets and writes the manifest.

   The run's `release-candidate` artifact holds the files (and the saved server image) for 30 days.
4. A person reviews the candidates (release checklist) and decides go or no-go.
5. **Publish**: run `Publish release` (`.github/workflows/publish.yml`) by hand with the candidate's run ID, the
   version and the confirmation `publish <version>`. It checks that the run is a passed candidate on master, the
   checksums, the version, the commit, the license inventory and the signing state, and then:
   - **desktop**: creates a **draft pre-release** with exactly the candidate's files;
   - **server**: loads the saved image, checks that its ID is the tested one, pushes it under the version tag and
     creates a **draft pre-release** with the manifest, the checksums and `published-image.txt` (the digest).

   The job runs in the `release` environment: required reviewers set there (repository settings) add a second
   approval.
6. **Release**: a person reviews the drafts and publishes them. Publishing creates the tags.

## The release manifest

`release-manifest.json` is written by `scripts/release_manifest.py` (the same script in both products) together with
`SHA256SUMS`. It holds:

- the product commit and studio commit, the platform version, and every component commit;
- artifacts with size and SHA-256, and images with their registry digest;
- the platforms the build was tested on, and the channel (`preview` for a version with a pre-release part);
- the license inventory:
  - desktop: the bundled Python packages, the studio's runtime npm packages and the shell's Rust crates;
  - server: the image's Python packages and the studio's npm packages;
  - packages without a declared license are listed under `licenses.unknown` and need a decision before publishing;
- the signing state.

## Signing

No signing certificate or key is configured, so **every build is unsigned** and the manifest says
`"status": "unsigned"`. Preview builds say so in the desktop archive (`README.txt`, `VERSION`, the window title shows
the version) and in the server image's labels (`dev.nodestro.channel=preview`, `dev.nodestro.signing=unsigned`). Users verify downloads against `SHA256SUMS` and server operators deploy images by digest.

| Platform | Needed to sign | State |
| --- | --- | --- |
| Linux desktop archive | a signing key (for example minisign or GPG) and its public key in the docs | not configured |
| macOS desktop | Apple Developer ID certificate and notarization credentials | not available; no macOS build |
| Windows desktop | an Authenticode code-signing certificate | not available; no Windows build |
| Server image | a signing key for image signatures (for example cosign) | not configured |

Signing must not be described as done until the certificate exists and a signed build has been verified.

## Supported platforms

| Platform | Desktop | Server | Evidence |
| --- | --- | --- | --- |
| Linux x86_64, glibc 2.39 or newer, WebKitGTK 4.1: Ubuntu 24.04 | preview | — | CI build and clean-container smoke test |
| Linux x86_64: Debian 13 | preview | — | clean-container smoke test, run by hand for `v0.2.0-preview.1` |
| Linux x86_64 with glibc older than 2.39 (Ubuntu 22.04, Debian 12) | does not start | — | Ubuntu 22.04: `GLIBC_2.39 not found` |
| Other Linux distributions, real desktop sessions, GPU drivers | not tested | — | the smoke test uses a virtual display |
| Linux amd64 container host, Docker Compose, PostgreSQL 17 | — | preview | CI acceptance tests against the image |
| Linux arm64 | not built | not built | the Dockerfile has an arm64 docker CLI checksum, nothing else |
| macOS (Apple silicon, Intel) | not built | not tested | — |
| Windows 10/11 | not built | not tested | — |
| Browsers for the server's studio | — | not tested in a browser: the server's acceptance tests use HTTP; the studio's browser tests run Chromium against the desktop profile; Safari and Firefox not tested | — |

AI-generated tools need an isolating sandbox. On the desktop that is Docker, on the server the remote Docker daemon.
The built-in sandbox prototype is not isolating yet; see [sandbox-prototype-report.md](sandbox-prototype-report.md).

## Release candidate v0.2.0-preview.1

Built and checked 2026-10-31, **not published** (no tag, no release, no image in a registry). Both products build
from studio `78710ce` (orkexa `cbf6df3`, runtime `c6bc2e5`, examples `86c58a1`, integrations `652c231`, api
`a08c9c3`, sdk `e508e6b`). Later studio and component commits are not part of this candidate.

| | Desktop | Server |
| --- | --- | --- |
| Product commit | `67122b7` | `5bc7b82` |
| Candidate run | 41212112554 (passed) | 41212693919 (passed) |
| Artifact | `nodestro-desktop-v0.2.0-preview.1-linux-x86_64.tar.gz`, 79.4 MB (262 MB unpacked) | `nodestro-server-v0.2.0-preview.1-linux-amd64.tar.gz` (saved image), 128.6 MB; image ID `sha256:391c3a18e9aa…605cf` |
| Tests in the run | `cargo test`, clean-container smoke test (Ubuntu 24.04) | every acceptance test against the image (15 tests; the run passes only if all pass) |
| License inventory | 620 packages (406 cargo, 161 npm, 53 python), 0 without a declared license | 218 packages (161 npm, 57 python), 0 without a declared license |
| License texts | `LICENSES/` (Rust crates, npm packages, Nodestro); Python in `*.dist-info` | `/opt/nodestro/licenses/` (npm packages, Nodestro); Python in `*.dist-info`, Debian in `/usr/share/doc` |
| Secret scan | 0 findings (in the run and again after download) | 0 findings in the saved image (every layer) and the release files, including the build token's exact value; 0 again after download |
| Checked after download | `sha256sum -c` OK; manifest commits equal the pins; bundled components' `direct_url.json` commits equal the pins | `sha256sum -c` OK; `docker load` gives the manifest's image ID; labels version `v0.2.0-preview.1`, channel `preview`, signing `unsigned`; runs as user 10001; no `pip` in the image |

Copyleft licenses in the inventories (weak copyleft, used unmodified): desktop: `cssparser`, `cssparser-macros`,
`dtoa-short`, `option-ext`, `selectors` (MPL-2.0), `r-efi` (MIT OR Apache-2.0 OR LGPL-2.1-or-later); server:
`certifi` (MPL-2.0), `psycopg`, `psycopg-binary`, `psycopg-pool` (LGPL-3.0-only). 5 crates and 2 npm packages ship
no license file; their declared licenses are permissive (MIT, BSD-3-Clause, Apache-2.0 OR MIT) or MPL-2.0.

Tested by hand beyond CI (desktop archive of the same build recipe, local): clean-container smoke test passed on
Ubuntu 24.04 and Debian 13; Ubuntu 22.04 does not start (`GLIBC_2.39 not found`).

## Update and rollback

- **Desktop**:
  - Update: unpack the new archive in place of the old one. The data directory stays where it is, and a migration
    first writes `~/.nodestro/backups/pre-migration-*.db`.
  - Rollback: unpack the previous archive. An older version refuses a data directory with a newer schema
    (`storage.schema_too_new`); restore the pre-migration backup in that case.
- **Server**:
  - Upgrades and rollback follow the runbook of nodestro-server (`docs/RUNBOOK.md`, "Upgrade" and "Releases and
    rollback").
  - `migrate` writes a `pg_dump` backup before it changes the schema.
  - Rollback means restoring that backup and starting the previous image by digest.
