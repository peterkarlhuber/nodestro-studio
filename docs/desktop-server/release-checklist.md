# Release checklist

Every Nodestro product release goes through these steps, in order. A step that is not done blocks the next one. The
release process itself (candidate, publish, release) is described in [RELEASES.md](RELEASES.md).

## Before the candidate

- [ ] One studio merge commit is chosen for the release; `scripts/check_versions.py` says "pins agree" for it.
- [ ] Both products' `studio.json` name that commit; their CI is green on master.
- [ ] The desktop shell's version (`app/Cargo.toml`, `app/tauri.conf.json`) equals the release version without `v`.
- [ ] `platform/versions.json` `products` names the product commits, the studio commit and the candidate version.

## Candidate (no publishing)

Run `Release candidate` (`release.yml`) by hand on master in nodestro-desktop and nodestro-server with the version.

- [ ] Desktop: build, `cargo test`, clean-container smoke test (Ubuntu 24.04), manifest, secret scan: passed.
- [ ] Server: image build, every acceptance test against the image, secret scan of the saved image and the release
      files, manifest: passed.
- [ ] Each run's `release-candidate` artifact downloaded and checked:
  - [ ] `sha256sum -c SHA256SUMS` is OK;
  - [ ] `release-manifest.json`: `version`, `channel` (`preview` for a pre-release), `commit`, `studio` and every
        component commit equal the chosen pins; `signing.status` is `unsigned`;
  - [ ] `licenses.unknown` is empty, or every entry has a decision;
  - [ ] the license inventory has no license that forbids redistribution (copyleft licenses listed for review);
  - [ ] desktop: `README.txt` and `VERSION` in the archive name the version and say "unsigned preview";
  - [ ] server: the image labels `org.opencontainers.image.version`, `dev.nodestro.channel`,
        `dev.nodestro.signing` are set.
- [ ] Systems beyond CI tested by hand, with the result written down (passed, failed, not run).
- [ ] Release notes: unsigned, supported and untested systems, sandbox limits, known issues.

## Decision

- [ ] Go/no-go report written and given to the person who decides.
- [ ] That person's explicit go for publishing, naming the version and the two candidate run IDs.

## Publish (only after the go)

- [ ] Optional second gate: required reviewers on the `release` environment of both repositories.
- [ ] `Publish release` (`publish.yml`) run by hand in each repository with the candidate run ID, the version and the
      confirmation `publish <version>`; both runs passed.
- [ ] Server: the pushed image's ID equals the manifest's; `published-image.txt` names the digest; the ghcr.io
      package visibility is what was decided.
- [ ] The two draft pre-releases reviewed (files, notes, pre-release flag), then published by a person; the tags
      exist and point at the candidate commits.
- [ ] `platform/versions.json` `products` updated to the released version.

## After the release

- [ ] Download the published desktop archive and the image by digest once and check them against `SHA256SUMS` and
      the manifest.
- [ ] Rollback path known: the previous archive or image, and the pre-migration backups (see RELEASES.md).
