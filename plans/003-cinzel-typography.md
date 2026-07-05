# Plan 003: Integrate Cinzel for Headings and Maintain Amarr Theme

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise.
>
> **Drift check (run first)**: `git diff --stat e88f1d0..HEAD -- index.html style.css`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plans/001-verification-baseline.md
- **Category**: direction | dx | docs
- **Planned at**: commit `e88f1d0`, 2026-07-04

## Why this matters

The Amarr Empire's theme is inspired by classical Roman inscriptions, luxury, and prestige. Using a single sans-serif font (`EveSansNeue`) for both headings and body text results in a flat, utility-like interface that lacks brand contrast. Introducing `Cinzel`—a Google Font styled after classical Roman lettering—for headings and display labels, while keeping `EveSansNeue` for technical body text, establishes a premium typography hierarchy that elevates the Amarr theme without compromising readability.

## Current state

- The relevant files:
  - `index.html` — The main structure of the calculator.
  - `style.css` — Defines the Amarr aesthetic variables and styles.
- Excerpts of current state:
  - `style.css:L29-30`:
    ```css
    --font-display: "EveSansNeue", sans-serif;
    --font-body: "EveSansNeue", sans-serif;
    ```

## Commands you will need

| Purpose   | Command                         | Expected on success |
|-----------|---------------------------------|---------------------|
| Lint Check| `npx @biomejs/biome check .`    | exit 0, no errors   |

## Scope

**In scope**:
- `index.html` [MODIFY]
- `style.css` [MODIFY]

**Out of scope**:
- Modifying calculation logic or changing numerical rates.
- Modifying structural margins or layout widths.

## Git workflow

- Branch: `advisor/003-cinzel-typography`
- Commits: Commit per step; message style: `style: integrate Cinzel font for display typography`

## Steps

### Step 1: Import Cinzel via Google Fonts in index.html

Modify the `<head>` of `index.html` to import the Google Font family `Cinzel`. Insert the `<link>` preconnect and stylesheet tags directly before `style.css`:

```html
    <!-- index.html -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400..700&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="style.css" />
```

**Verify**: Verify changes save cleanly.

---

### Step 2: Update typography variables in style.css

Modify the `:root` variables in `style.css` to assign `Cinzel` to `--font-display`, keeping `EveSansNeue` as `--font-body` for highly readable body text, numbers, and inputs:

```css
	/* style.css */
	--font-display: "Cinzel", serif;
	--font-body: "EveSansNeue", sans-serif;
```

**Verify**: Run `npx @biomejs/biome check .` and ensure style sheet conforms to lint/format standards.

---

### Step 3: Refine header weights and styles

To ensure `Cinzel` displays beautifully, adjust the font-weight of the main headers (`h1` and `h2`) to add weight contrast. Cinzel works best with custom weights:

1. Update `h1` style to use `font-weight: 500`:
   ```css
   h1 {
   	font-family: var(--font-display);
   	font-size: clamp(1.5rem, 5vw, 2.2rem);
   	font-weight: 500;
   	color: white;
   	text-transform: uppercase;
   	letter-spacing: 0.3em;
   	margin-bottom: 0.2rem;
   	filter: drop-shadow(0 0 15px rgba(0, 0, 0, 0.8));
   }
   ```
2. Update `h2` style to use `font-weight: 400` and slight uppercase adjustment if necessary:
   ```css
   h2 {
   	font-family: var(--font-display);
   	font-size: clamp(0.6rem, 2vw, 0.8rem);
   	color: var(--primary-gold);
   	letter-spacing: 0.5em;
   	text-transform: uppercase;
   	opacity: 0.9;
   	font-weight: 400;
   }
   ```

**Verify**: Open the calculator in your browser. Verify the headers now render with the classic, elegant serif proportions of the `Cinzel` font, while numerical outputs and inputs remain in the clean, technical `EveSansNeue` sans-serif font.

## Test plan

- Visual manual check: open `index.html` in a web browser and inspect elements:
  - Check "VAGRANT LOGISTICS" and "COURIER CALCULATOR" title fonts.
  - Check the labels ("Collateral", "Number of Jumps", "Volume") to ensure they are rendered in `Cinzel` but remain readable.
  - Verify that the numbers in the inputs and output (like `11,000,000 ISK`) remain rendered in `EveSansNeue` to guarantee maximum numerical readability.

## Done criteria

- [ ] Google Fonts stylesheet for `Cinzel` is imported in `index.html`.
- [ ] `--font-display` in `style.css` is updated to `"Cinzel", serif`.
- [ ] App launches with clean, high-contrast serif/sans typography layout.

## STOP conditions

- If Google Fonts fails to load due to offline sandbox development, verify if `Cinzel` can fall back to generic `serif`. (A fallback is configured, but active internet connection is recommended for production).
