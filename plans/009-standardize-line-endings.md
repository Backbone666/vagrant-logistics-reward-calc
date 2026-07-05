# Plan 009: Standardise Repository Line Endings and Fix Formatting

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise.
>
> **Drift check (run first)**: `git diff --stat 2cb3e01..HEAD -- package.json`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: None
- **Category**: dx | tooling
- **Planned at**: commit `2cb3e01`, 2026-07-04

## Why this matters

The linter check (`npm run lint` / `biome check .`) fails on Windows environments because git checkouts default to CRLF (`\r\n`) line endings, while Biome strictly expects LF (`\n`). Adding `.gitattributes` enforces LF line endings across all platforms and standardizes file formats, allowing tests and linting to pass natively on any operating system.

## Current state

- Relevant files:
  - `package.json` — Specifies the package metadata and formatting scripts.
- Excerpts of Biome validation failure on Windows:
  ```
  test\calculator.test.js format ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  × Formatter would have printed the following content:
  Found 3 errors.
  ```

## Commands you will need

| Purpose   | Command                         | Expected on success |
|-----------|---------------------------------|---------------------|
| Format    | `npm run format`                | exit 0, files reformatted |
| Lint Check| `npm run lint`                  | exit 0, no formatting errors |

## Scope

**In scope**:
- `.gitattributes` [CREATE]
- Formatting across all project source files (`.js`, `.json`, `.html`, `.css`) [MODIFY via Biome write]

**Out of scope**:
- Modifying calculation logic or style sheets manually.

## Git workflow

- Branch: `advisor/009-standardize-line-endings`
- Commits: Commit per step; message style: `chore: enforce LF line endings via gitattributes and format files`

## Steps

### Step 1: Create .gitattributes file

Create a `.gitattributes` file at the repository root to enforce LF line endings on git checkouts for all text files:

```
* text eol=lf
```

**Verify**: Verify `.gitattributes` is saved successfully.

---

### Step 2: Renormalize Git line endings and format files

Run git commands to renormalize files in the index, then run the formatter to write LF formatting across all files:

```bash
git add --renormalize .
npm run format
```

**Verify**: Run `npm run lint` and verify it now exits with 0 and reports no formatting errors.
