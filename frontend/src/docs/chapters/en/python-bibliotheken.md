# Python libraries

Your own and AI-created tools may use third-party libraries such as `numpy`, `pandas`, `scipy` or `requests`. This chapter explains how Nodestro detects them, why you approve every library explicitly and how the separate Python environments work.

## Overview {#ueberblick}
<!-- keywords: libraries, packages, pypi, numpy, pandas, third-party, dependencies, uv -->

Python's standard library is enough for many tools. When you need more:

1. **Detect:** Nodestro reads the imports in the tool's code and works out the packages needed. Nothing is downloaded.
2. **Approve:** Before anything is installed you see every package with its version and approve it. Without approval nothing is installed.
3. **Install:** Nodestro installs exactly the approved versions with the package tool **uv** into a separate environment in the data folder.
4. **Run:** The tool runs in the sandbox with the Python of that environment.

The Python that runs Nodestro itself never changes. Workflows whose tools only use the standard library need none of this and work as before.

> **Important:** Approving a library does not approve a tool's code. You check and approve code and tests as usual (see [Approval](/docs/tools#freigabe)).

## How libraries are detected {#erkennung}
<!-- keywords: import, from import, detection, module name, package name, pil, pillow, script, pep 723, dependencies, ambiguous -->

Nodestro evaluates `import x` and `from x import y`:

- The **standard library** (`math`, `json`, `datetime` …) and the module `tool` in the tests need nothing.
- **Known modules** are mapped to the right package even when the names differ: `PIL` → `Pillow`, `sklearn` → `scikit-learn`, `yaml` → `PyYAML`, `bs4` → `beautifulsoup4`, `cv2` → `opencv-python-headless`.
- **Unknown modules** are never guessed. Nodestro reports them and asks for an explicit declaration.
- **Dynamic imports** such as `importlib.import_module(name)` cannot be resolved and are reported.
- Imports inside `try: … except ImportError:` count as optional.

You declare packages and version ranges explicitly in a header at the top of the code (the “inline script metadata” format):

```python
# /// script
# dependencies = ["numpy>=1.26", "python-dateutil"]
# ///
import numpy as np
from dateutil import parser
```

Only a package name and version specification are allowed, no links or local paths.

## Approval {#freigabe}
<!-- keywords: approval, approve, permit, version, indirect, transitive, overview, install -->

With **Review and approve** Nodestro resolves the versions (downloading package information; a package without a prebuilt wheel is built from source, which runs its build script) and shows an overview:

| Column | Meaning |
|---|---|
| **Package** and **Version** | The exact version that would be installed |
| **Kind** | *direct* (a tool imports it), *indirect* (another package needs it) or *runtime* (Nodestro always brings it) |
| **Required by** | The tools or packages that need it |
| **Status** | *New*, *Approved*, *Change old → new* or *Dropped* |

Check the list and click **Approve and install**. Third-party libraries can access files and the network: only approve packages you know.

Nodestro stores every approval with package, version and time. As long as nothing changes, Nodestro does not ask again. A new approval is needed when:

- a tool needs a **new package**,
- a **requirement** changes (e.g. a new version range) so that another version is needed,
- the **Python version** has changed,
- the approvals come from **another computer** or an **import**.

Nodestro never upgrades silently: already approved versions are preferred when resolving again, and any other version shows up as a *Change*.

## Libraries in a workflow {#workflow}
<!-- keywords: workflow, environment, inspector, status, start, run, own environment, install -->

Every workflow with libraries gets its **own environment** with its own approvals. In the workflow inspector (with no node selected) the section **Python libraries** shows:

- the **status**: *Approval needed*, *Installation pending*, *Installing*, *Approved and installed* or *Installation failed*,
- every required package with its installed version and the tools that use it,
- the actions **Review and approve**, **Install** and **View versions**,
- the **change history** with approvals, installations and imports.

The [check](/docs/workflows#pruefung) reports missing approvals as errors. A workflow only starts once all libraries are approved. If an approved environment is not installed yet (e.g. after deleting it), Nodestro installs it from the approved versions at start.

The environment is only created when it is needed. Downloaded packages live in a shared cache and are reused by all environments, so a second environment with the same packages installs quickly.

## Libraries in tools {#tools}
<!-- keywords: tool, own tool, ai tool, coding agent, test environment, tests, try, without libraries -->

For the **tests** of a tool with libraries Nodestro creates a separate **test environment**:

- **Write yourself:** *Check and test* reports which libraries the tool needs. The tests only run once you have approved them in the section **Python libraries of the tool**. Then check again and save.
- **Create with AI:** If the Coding Agent proposes libraries, the job waits with the status *Waiting for libraries*. You see the overview and choose **Approve libraries** (install, then test) or **Rewrite without libraries**. You approve the code separately afterwards as usual.
- **Try** in the library also uses the tool's test environment.

The approval for the tests does not automatically apply to workflows. If a workflow uses the tool, you approve the libraries there; the overview shows where they are already approved.

Tools with libraries run with more generous limits (60 seconds, 2 GB memory) because loading packages such as `pandas` takes time.

## AI Workflow Architect {#architekt}
<!-- keywords: architect, draft, tool draft, libraries, not installed -->

The [AI Workflow Architect](/docs/ki-architekt#tools-freigeben) may propose tool drafts with libraries. It collects the packages needed and shows them in the draft review, **but installs nothing**. When testing a tool draft you approve the libraries for the test environment; after applying the draft you approve them in the workflow.

## Versions and reproducibility {#versionen}
<!-- keywords: version, lock, reproducible, pinned, update, upgrade, conflict -->

After approval Nodestro stores a **complete definition** of all packages with their exact version, including the indirect ones. An environment can always be restored identically from it. Installation happens in a separate folder and only replaces the previous environment once everything is installed and all imports work. If it fails, the previous environment stays unchanged.

If two tools of a workflow need incompatible versions, Nodestro reports a **conflict** and names the packages involved in the technical details. Adjust the version specifications in the `# /// script` header.

## Export, import and backup {#export}
<!-- keywords: export, import, backup, other computer, portable, definition -->

- **Exporting** a workflow includes the library definition (packages and versions) but no installed files.
- **Importing** takes over the definition. The packages must be **approved again** on this computer; the overview shows the versions that came along.
- **Duplicating** also takes over the versions but requires its own approval.
- A **backup** contains definitions and approvals. On the same computer the approvals stay valid after restoring; on another computer they must be granted again. The environments themselves are reinstalled when needed.

## Maintenance and cleanup {#wartung}
<!-- keywords: maintenance, clean up, tidy, storage, cache, orphaned, delete, settings -->

In the [settings](/docs/einstellungen) the section **Python environments** shows the uv and Python versions, the cache size and every environment with owner, number of packages, size and installation time.

- **Delete environment** removes the installed files. The approvals stay; the environment is reinstalled the next time it is needed.
- **Orphaned** environments belong to a workflow or tool that was deleted.
- **Clean up orphaned** deletes all orphaned environments including their definition and tidies up the cache.

Nodestro never deletes an environment without your action.

## Solving problems {#probleme}
<!-- keywords: error, conflict, not found, network, uv missing, docker, installation failed, log -->

| Message | Remedy |
|---|---|
| **No package is known for the module** | Declare the package in the `# /// script` header. |
| **An import by name cannot be resolved** | Import the module directly with `import`. |
| **The package does not exist** | Check the spelling of the package name. |
| **No matching version** / **Conflict** | Loosen the version specification or align it between the tools. |
| **Package index cannot be reached** | Check the internet connection; installed environments also work offline. |
| **uv was not found** | Reinstall Nodestro; uv is installed with it. |
| **Process sandbox only** | Tools with libraries do not run in the Docker sandbox. Switch the [sandbox](/docs/einstellungen#sandbox) to *Python process*. |

If an installation fails, the **installation log** shows uv's output. **Install again** starts a new attempt.
