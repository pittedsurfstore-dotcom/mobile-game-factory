# Security Policy

## Supported versions

This is a scaffold-grade hobby project with a single maintained line: `main`. The most recent tagged release (`v0.1.0` at the time of writing) is the supported snapshot. Older commits or branches are out of scope.

## Reporting a vulnerability

**Please do not open a public issue or pull request for security problems.**

Use GitHub's **Privately report a vulnerability** form on this repo:

<https://github.com/pittedsurfstore-dotcom/mobile-game-factory/security/advisories/new>

That routes the report directly to the maintainer and keeps the disclosure private until a fix lands. You can also DM the maintainer on GitHub if the form is unavailable.

When you report, include:

- A short description of the vulnerability
- A minimal reproduction or proof-of-concept (the smaller the better)
- The affected commit / tag / release
- Any suggested mitigation or workaround you have in mind

## What to expect

| Stage                                       | Target                                             |
| ------------------------------------------- | -------------------------------------------------- |
| Initial acknowledgement                     | within **3 business days**                         |
| Severity triage + fix plan                  | within **7 business days**                         |
| Patch landing on `main` (for valid reports) | within **30 days** of triage, sooner for criticals |

Critical issues affecting user data, secrets, or in-app purchase flow will be prioritised.

## Scope

In scope:

- Code in this repository (`apps/`, `packages/`, `games/`)
- CI workflows under `.github/workflows/`
- Configuration of the published GitHub release artefacts

Out of scope:

- Vulnerabilities in upstream dependencies (please report those to the dependency's own maintainers; security advisories will flow back here via Dependabot)
- Issues that require physical device access or a rooted/jailbroken environment
- Social engineering of the maintainer

## Acknowledgement

If you'd like credit for a valid report, mention it when you file — your handle will be included in the advisory and the release notes for the fix.
