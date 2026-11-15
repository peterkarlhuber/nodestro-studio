# NAL security review packages (D1)

Status: prepared 2026-11-15, **not commissioned**. These briefs bundle the attack surface that the NAL packages
(Nodestro Apps & Library) added, so that one independent review covers it instead of many small ones. Commissioning
a review, and any paid service, is the owner's decision; nothing here orders one. Internal reviews do not replace an
independent one.

Until a package's review has a report without open critical or high findings (or the owner accepts the residual
risk), the switches it guards stay off:

| Package | Covers | Switches that stay off | Brief |
| --- | --- | --- | --- |
| P-Web | web search and page fetch, egress guard, content marking (A2), the MCP network guard built on it | `NODESTRO_WEB_TOOLS_SERVER` (server profile) | [p-web.md](p-web.md) |
| P-Import | skill packages (B3, B4), agent template import (B1), `restore`, `update` and `ui install` of portable packages (C3) | none of its own; blocks broad activation of imports from untrusted sources | [p-import.md](p-import.md) |
| P-Pair | pairing a browser with a portable package (C4) and the standard interface on another origin (C5) | `NODESTRO_PAIRING`, `NODESTRO_CROSS_ORIGIN` | [p-pair.md](p-pair.md) |
| P-Send | sending e-mail and webhooks (A5) | `NODESTRO_SEND_TOOLS` | attached to RT-001 (nodestro-runtime); A5 is locked until RT-001 is accepted |

Where possible a package is bundled with an existing open review: P-Pair with API-054 (portable export, nodestro-api),
P-Send with RT-001 (tool approvals, nodestro-runtime).

## Code under review

All briefs refer to the platform lock of nodestro-studio `d050e1c` (`platform/versions.json`):

| Repository | Commit |
| --- | --- |
| orkexa | `7ee9977605ada72a2df404bc31fed4a43eaad9f0` |
| nodestro-runtime | `f5f602c30e78e3a31a2d9fe7e41fd781cd135357` |
| nodestro-api | `790271b6d8e1835797fc1e54b956deacc959a39b` (embeds nodestro-app-ui `cf264b4`) |
| nodestro-examples | `39c8afa2187e0f426e98a4960797fdb0ddc06bf2` |
| nodestro-app-ui | `cf264b4f9f356d540bc529770e912ff678406feb` |

A later review uses the lock current at that time; the brief's file and function names are the entry points, not a
complete list.

## Common rules for every package

- Test environment only: the deterministic `test` search provider, mock transports and test keys. Real searches,
  paid providers and production keys need the owner's separate consent.
- No production data. Every finding gets a severity, a reproduction and the affected commit.
- Out of scope everywhere: denial of service by volume, social engineering, the hosting of GitHub.

## Expected results (each package)

- Findings with severity and reproduction.
- An assessment of the documented residual risks.
- A recommendation whether the package's switches may be enabled for productive use, and under which conditions.
