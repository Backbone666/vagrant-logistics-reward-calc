## 2026-04-13 - [Mobile Numeric Inputs & External Link Affordance]
**Learning:** For utility-heavy tools like calculators, providing the correct virtual keyboard via `inputmode` significantly reduces friction on mobile. Additionally, in specialized communities (like EVE Online), users frequently transition between tools; clearly marking external links with visual icons helps manage context switching expectations.
**Action:** Always check for numeric-only or decimal-only inputs and apply `inputmode`. Use CSS `::after` with SVG data URIs for lightweight, dependency-free external link icons.
## 2026-04-13 - [CI Workflow Robustness]
**Learning:** GitHub Actions that depend on secrets (like API keys) will fail if those secrets are not available (e.g., in PRs from forks or when not configured). Adding conditional checks (`if`) to skip these steps when required secrets are missing ensures that the overall CI pipeline remains green for general checks while gracefully disabling optional AI-powered features.
**Action:** Always add `if` conditions to skip steps that rely on external API keys if they are not strictly required for the build/test process.
## 2026-04-13 - [Hygiene: Clean up workspace]
**Learning:** Always ensure that temporary files, logs, and diff files generated during the development process are removed before staging and committing. Committing these files adds technical debt and can leak internal details.
**Action:** Add a "cleanup" check to the pre-commit routine to verify no log or diff files are staged.
