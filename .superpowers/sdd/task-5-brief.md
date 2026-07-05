# Plan 010: Update README to Reflect Modern Real-Time Features and Tooling

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise.
>
> **Drift check (run first)**: `git diff --stat 2cb3e01..HEAD -- README.md`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: None
- **Category**: docs
- **Planned at**: commit `2cb3e01`, 2026-07-04

## Why this matters

The repository's [README.md](file:///C:/Users/Backbone/Google%20Drive/github/haulers-channel-reward-calc/README.md) contains stale instructions referring to features that no longer exist (e.g. a "Calculate" button and a single "Dangerous Space" checkbox). Updating the README ensures onboarding users and developers understand how the modern real-time calculator, modular structure, and automated tests function.

## Current state

- Relevant files:
  - `README.md` — The project documentation and setup guide.
- Excerpts of stale instructions in `README.md`:
  ```markdown
  4. Check the "Low / Nullsec / Dangerous Space" box if the route is in low or nullsec.
  5. Click the "Calculate" button to see the estimated reward.
  ```

## Scope

**In scope**:
- `README.md` [MODIFY]

**Out of scope**:
- Changing any source code or stylesheet styles.

## Git workflow

- Branch: `advisor/010-update-readme`
- Commits: Commit per step; message style: `docs: update README with real-time UI details and development commands`

## Steps

### Step 1: Update README.md content

Overwrite `README.md` with accurate details of the real-time input fields, presets, tests, and configuration files:

```markdown
# Vagrant Logistics - Courier Calculator

A shipping contract reward calculator for EVE Online's Vagrant Logistics corporation and The Charter alliance. Built with high-end glassmorphism styling and precise, real-time quote computations.

## Installation & Usage

1. **Clone the repository**:
   ```bash
   git clone https://github.com/backbone666/vagrant-logistics-reward-calc.git
   ```
2. **Open the App**:
   Open `index.html` directly in any modern web browser.

3. **Calculate Quotes**:
   * Input the **Collateral** in ISK (suggested Janice Sell value).
   * Input the route's **Highsec Jumps** and **Dangerous Jumps** (Lowsec/Nullsec).
   * Input the **Volume** in m³ (or click the volume preset buttons: Freighter, DST, Blockade Runner).
   * The reward quote and route breakdown update instantly as you type.
   * Click **Copy Reward** to copy the calculated value to your clipboard.

## Project Structure

* `index.html` — Calculator user interface, assets, and DOM interaction script.
* `calculator.js` — Core calculator logic, module exports, and service classifier.
* `rate_card_config.json` — Operational config containing base rates, cyno fees, and collateral brackets.
* `style.css` — Custom glassmorphism responsive design inspired by the Amarr Empire.
* `test/calculator.test.js` — Automated test suite verifying calculation scenarios.

## Development Commands

* **Run Tests**:
  ```bash
  npm run test
  ```
* **Lint Check**:
  ```bash
  npm run lint
  ```
* **Auto-format**:
  ```bash
  npm run format
  ```
```

**Verify**: Verify changes save cleanly and markdown renders without structural errors.
