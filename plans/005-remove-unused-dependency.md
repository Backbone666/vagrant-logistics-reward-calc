# Plan 005: Remove Unused tscanner Dependency

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise.
>
> **Drift check (run first)**: `git diff --stat 2cb3e01..HEAD -- package.json pnpm-workspace.yaml`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: None
- **Category**: dx | dependencies
- **Planned at**: commit `2cb3e01`, 2026-07-04

## Why this matters

The dependency `tscanner` is listed under `devDependencies` in `package.json` and `allowBuilds` in `pnpm-workspace.yaml` but is completely unused throughout the codebase. Removing unused dependencies reduces the installation footprint, avoids security vulnerability risks associated with dead code, and simplifies the codebase configuration.

## Current state

- The relevant files:
  - `package.json` — Declares the project dependencies and scripts.
  - `pnpm-workspace.yaml` — Declares workspace-wide settings.
- Excerpts of current state:
  - `package.json:L10`:
    ```json
    		"tscanner": "^0.1.3"
    ```
  - `pnpm-workspace.yaml:L2`:
    ```yaml
      tscanner: set this to true or false
    ```

## Commands you will need

| Purpose   | Command                         | Expected on success |
|-----------|---------------------------------|---------------------|
| Lint Check| `npx @biomejs/biome check .`    | exit 0, no errors   |
| Verify    | `npm run test`                  | exit 0, all tests pass |

## Scope

**In scope**:
- `package.json` [MODIFY]
- `pnpm-workspace.yaml` [MODIFY]
- lock files (`package-lock.json`, `pnpm-lock.yaml`) [MODIFY via installation]

**Out of scope**:
- Changing any calculation logic, styling, or documentation files.

## Git workflow

- Branch: `advisor/005-remove-unused-dependency`
- Commits: Commit per step; message style: `chore: remove unused tscanner dependency`

## Steps

### Step 1: Remove tscanner from package.json

Remove the line `"tscanner": "^0.1.3"` from `package.json`. Make sure to keep the JSON valid (remove trailing/leading commas as needed).

```json
	"devDependencies": {
		"@biomejs/biome": "2.3.14"
	}
```

**Verify**: Run `npx @biomejs/biome check .` to ensure the project passes lint and format checks.

---

### Step 2: Remove tscanner from pnpm-workspace.yaml

Modify `pnpm-workspace.yaml` to completely remove any reference to `tscanner` under `allowBuilds`. The file should look like this:

```yaml
allowBuilds:
```

**Verify**: Verify changes save cleanly.

---

### Step 3: Clean up Lockfiles

Run package manager install commands to remove `tscanner` from lockfiles:

```bash
npm install
pnpm install
```

**Verify**: Run `npm run test` to verify that the test suite still runs and passes cleanly.
