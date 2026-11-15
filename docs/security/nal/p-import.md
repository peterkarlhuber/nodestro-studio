# P-Import: skill packages, agent templates and package operations

Part of the [NAL review packages](README.md). Not commissioned.

## Scope

- **Skill packages (B3, B4):**
  - orkexa `src/orkexa/skills/package.py`: `read_zip`, `parse_skill`, `validate`, `SkillLimits` (ZIP format,
    sizes, paths, symlinks, encoding). Design: orkexa `docs/skills.md`, nodestro-runtime ADR 0018.
  - nodestro-runtime `src/nodestro_runtime/skills.py`, `skills_select.py`, `skill_tools.py` (storage in the document
    store with SHA-256 checks, assignment, loading on demand, freezing in a release, provenance).
  - nodestro-api `src/nodestro_api/api_skills.py`: `import_skill` (dry run, import as a new version),
    `export_skill`, `read_skill_file`.
  - Scripts of a skill are never run; adopting one as a tool goes through the existing tool adoption
    (nodestro-runtime `tool_adoption.py`, Docker-first sandbox).
- **Agent templates (B1):** nodestro-api `src/nodestro_api/api_agent_templates.py`: `import_template` (at most 1 MB,
  approval rules reset, connections and knowledge files removed, provenance set by the server only),
  `export_template`; nodestro-runtime `src/nodestro_runtime/agent_templates.py`.
- **Portable package operations (C3):** nodestro-api `src/nodestro_api/portable_ops.py`: `extract`, `restore`,
  `update`, `stage_package`, `apply_pending`, `check_own_folder`, `verify_program`; `ui install` in `portable.py`
  (`ui_command`). Docs: `docs/portable-export.md`.

## Review goals

1. **Archives:** ZIP bombs, entry counts, path traversal (`..`, absolute, Windows drive and UNC paths, reserved
   names), symlinks and link chains, case clashes, duplicate entries, EOCD tricks.
2. **Content:** a skill or template cannot grant rights: no tool approvals, connections, secrets or provenance from
   the archive; disabled skills stay out of releases.
3. **Prompt framing:** a skill's text cannot break out of its frame in the prompt or reorder instructions.
4. **Provenance laundering:** importing as a new version or copying cannot turn foreign content into built-in or
   trusted content.
5. **Tenant separation:** imported skills and templates stay in their tenant (SQLite and PostgreSQL).
6. **restore / update / ui install:** folders that hit the package, a parent, the home folder or a root are refused;
   the old folder is moved aside, not deleted; links are created last and checked with realpath; integrity check of
   the program folder.
7. **Secrets:** exports and backups carry no secrets unless asked; backup files are readable only by the owner.

## Tests to start from

- orkexa: `tests/skills/test_skills.py`.
- nodestro-runtime: `tests/test_skills.py`, `tests/test_skills_b4.py`, `tests/test_agent_templates.py`.
- nodestro-api: `tests/test_skills_api.py`, `tests/test_skills_b4_api.py`, `tests/test_agent_templates_api.py`,
  `tests/test_portable_operations.py`.

## Internal reviews so far

- B3: 0 critical, 0 high; M1 (frame breakout and order), M2 (provenance laundering), M3 (disabled skills in
  releases), L1 to L5 fixed.
- C3: H1 (a link chain in an update archive could leave the target folder) and H2 (`data_dir="."` could delete the
  package on restore) fixed, M1, M2, L1 to L3, L5 fixed. Accepted and documented: L4 (time of check to time of use
  with write access to the folder) and detecting a running application on Windows only through the PID file. The
  integrity check protects against accidental change, not against an attacker with write access; real provenance is
  API-046 (signing).

## Decision this review informs

Whether skills and templates from untrusted sources may be imported broadly, and whether `restore`, `update` and
`ui install` may be offered for packages passed on to third parties (together with API-054).
