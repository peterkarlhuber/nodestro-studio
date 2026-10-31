# Releases (M6)

How Nodestro products are released, what a release contains, and which platforms are supported. Recorded
2026-10-31. Status: the pipelines exist, but **no release has been made yet** and no build is signed.

## What gets released

| Product | Artifact | Built from | Pipeline |
| --- | --- | --- | --- |
| nodestro-desktop | `nodestro-linux-x86_64.tar.gz` | `studio.json` (a studio merge commit) | `.github/workflows/release.yml` in nodestro-desktop |
| nodestro-server | image `ghcr.io/peterkarlhuber/nodestro-server:<tag>` | `studio.json` (a studio merge commit) | `.github/workflows/release.yml` in nodestro-server |
| components (runtime, api, sdk, …) | not released on their own | full-SHA pins in studio | — |

`platform/versions.json` lists every component pin. Its `products` section names each product commit and the studio
commit that product builds from.

## Release steps

1. Move the product's `studio.json` to a studio merge commit whose pins agree (`scripts/check_versions.py`). Merge
   that change after CI is green; CI builds the product and writes a manifest as a dry run.
2. Update `products` in `platform/versions.json`.
3. Push a tag `vX.Y.Z` on the product's master. The release workflow:
   - **desktop**: builds the shell and the backend, runs the clean-container smoke test, writes the manifest and
     checksums, and creates a **draft** GitHub release;
   - **server**: builds the image and runs every acceptance test against it. Only then does it push the image and
     create a **draft** GitHub release.
4. A person reviews the draft (manifest, unknown licenses, release notes) and publishes it. Nothing is published
   automatically.

## The release manifest

`release-manifest.json` is written by `scripts/release_manifest.py` (the same script in both products) together with
`SHA256SUMS`. It holds:

- the product commit and studio commit, the platform version, and every component commit;
- artifacts with size and SHA-256, and images with their registry digest;
- the platforms the build was tested on;
- the license inventory:
  - desktop: the bundled Python packages, the studio's runtime npm packages and the shell's Rust crates;
  - server: the image's Python packages and the studio's npm packages;
  - packages without a declared license are listed under `licenses.unknown` and need a decision before publishing;
- the signing state.

## Signing

No signing certificate or key is configured, so **every build is unsigned** and the manifest says
`"status": "unsigned"`. Users verify downloads against `SHA256SUMS` and server operators deploy images by digest.

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
| Linux x86_64 (Ubuntu 24.04, WebKitGTK 4.1) | preview | — | CI build and clean-container smoke test |
| Linux amd64 container host, Docker Compose, PostgreSQL 17 | — | preview | CI acceptance tests against the image |
| Linux arm64 | not built | not built | the Dockerfile has an arm64 docker CLI checksum, nothing else |
| macOS (Apple silicon, Intel) | not built | not tested | — |
| Windows 10/11 | not built | not tested | — |
| Browsers for the server's studio | — | not tested in a browser: the server's acceptance tests use HTTP; the studio's browser tests run Chromium against the desktop profile; Safari and Firefox not tested | — |

AI-generated tools need an isolating sandbox. On the desktop that is Docker, on the server the remote Docker daemon.
The built-in sandbox prototype is not isolating yet; see [sandbox-prototype-report.md](sandbox-prototype-report.md).

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
