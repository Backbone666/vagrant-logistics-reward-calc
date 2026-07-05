# Plan 001: Extract Calculation Logic and Establish Automated Test Suite

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise.
>
> **Drift check (run first)**: `git diff --stat e88f1d0..HEAD -- index.html package.json`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tests | tech-debt | dx
- **Planned at**: commit `e88f1d0`, 2026-07-04

## Why this matters

The core courier reward calculation logic (`calcReward`) is currently embedded inline inside a `<script>` tag in `index.html`. This prevents external Node-based test runners from importing and validating it. Establishing a verification baseline by extracting this logic enables automated testing of pricing changes against `test-cases.md`, preventing silent regressions in pricing updates.

## Current state

- The relevant files:
  - `index.html` — Contains inline `calcReward` logic (lines 216–283) and helper function `parseNum` (line 214) under a `<script>` tag.
  - `package.json` — Lists `@biomejs/biome` and `tscanner` as dependencies but lacks standard task commands or test scripts.
- Excerpts of current state:
  - `index.html:L214-221`:
    ```javascript
    const parseNum = (val) => parseFloat(val.replace(/,/g, "")) || 0;

    function calcReward() {
      const volume = parseNum(volumeInput.value);
      const jumps = parseNum(jumpsInput.value);
      const collateral = parseNum(collateralInput.value);
      const routeSecurity = routeSecuritySelect.value;
      ...
    ```

## Commands you will need

| Purpose   | Command                         | Expected on success |
|-----------|---------------------------------|---------------------|
| Run Tests | `node test/calculator.test.js`  | exit 0, all tests pass |
| Lint Check| `npx @biomejs/biome check .`    | exit 0, no errors   |

## Scope

**In scope** (the only files you should modify or create):
- `calculator.js` [NEW]
- `index.html` [MODIFY]
- `package.json` [MODIFY]
- `test/calculator.test.js` [NEW]

**Out of scope**:
- Modifications to any calculations or rates (leave the obsolete rates untouched for this step; they will be updated in Plan 002).
- Adding styling or changing UI components.

## Git workflow

- Branch: `advisor/001-verification-baseline`
- Commits: Commit per step; message style: `test: establish calculator test suite`

## Steps

### Step 1: Create calculator.js and extract logic

Create a new file `calculator.js` in the project root. Extract `parseNum` and `calcReward` from `index.html` into this file, modifying `calcReward` to accept inputs as parameters rather than reading directly from DOM elements:

```javascript
// calculator.js
export const parseNum = (val) => {
  if (typeof val === "number") return val;
  return parseFloat(val.replace(/,/g, "")) || 0;
};

export function calcReward({ volume, jumps, collateral, routeSecurity }) {
  const parsedVolume = parseNum(volume);
  const parsedJumps = parseNum(jumps);
  const parsedCollateral = parseNum(collateral);

  // 1. Global Collateral Cap
  if (parsedCollateral > 5_000_000_000) return "Risako Hirano";

  // 2. Basic Validation
  if (parsedVolume <= 0 || parsedJumps <= 0 || parsedCollateral < 0) return 0;

  let baseFee = 0;
  let ratePerJump = 0;
  let riskMultiplier = 1.0;

  // 3. Service Tier Logic
  if (routeSecurity === "highsec") {
    if (parsedVolume <= 12_500) {
      baseFee = 5_000_000;
      ratePerJump = 900_000;
    } else if (parsedVolume <= 62_500) {
      baseFee = 10_000_000;
      ratePerJump = 1_250_000;
    } else if (parsedVolume <= 1_125_000) {
      baseFee = 25_000_000;
      ratePerJump = 2_000_000;
    } else {
      return "Max Volume 1,125,000 m³";
    }
  } else if (routeSecurity === "dangerous" || routeSecurity === "high_risk") {
    if (routeSecurity === "high_risk") riskMultiplier = 1.5;

    if (parsedVolume <= 12_500) {
      baseFee = 15_000_000;
      ratePerJump = 2_000_000;
    } else if (parsedVolume <= 62_500) {
      baseFee = 25_000_000;
      ratePerJump = 6_000_000;
    } else if (parsedVolume <= 360_000) {
      baseFee = 150_000_000;
      ratePerJump = 35_000_000;
    } else {
      return "Max Volume 360,000 m³ (JF)";
    }
  }

  // 4. Calculate Transport Cost with Multipliers
  let totalReward = (baseFee + parsedJumps * ratePerJump) * riskMultiplier;

  // 5. Collateral Fee Schedule (Global)
  if (parsedCollateral > 1_000_000_000 && parsedCollateral <= 3_000_000_000) {
    totalReward += parsedCollateral * 0.003;
  } else if (parsedCollateral > 3_000_000_000) {
    totalReward += parsedCollateral * 0.005;
  }

  // 6. Minimum Reward Floor
  return Math.max(baseFee, totalReward);
}
```

**Verify**: Check that `calculator.js` exists.

---

### Step 2: Update index.html to import calculator.js

Update `index.html` to reference `calculator.js` as an ES Module, replacing the inline definitions of `parseNum` and `calcReward`.

1. Change the main script tag to `type="module"`:
   ```html
   <script type="module">
     import { parseNum, calcReward } from "./calculator.js";
     ...
   ```
2. Update references to `calcReward()` inside `updateAll()` to pass input values:
   ```javascript
   function updateAll() {
     const reward = calcReward({
       volume: volumeInput.value,
       jumps: jumpsInput.value,
       collateral: collateralInput.value,
       routeSecurity: routeSecuritySelect.value
     });
     currentReward = reward;
     ...
   ```

**Verify**: Open `index.html` in a web browser (with local server to allow ES Modules) and ensure that inputting values still updates the reward correctly without console errors.

---

### Step 3: Write the automated test suite

Create `test/calculator.test.js` using Node.js's built-in `node:test` runner. Write assertions for the current calculations in `index.html` to establish the baseline:

```javascript
import test from "node:test";
import assert from "node:assert/strict";
import { calcReward } from "../calculator.js";

test("Highsec - Blockade Runner (Small Package) baseline", () => {
  const result = calcReward({
    volume: "10,000",
    jumps: "10",
    collateral: "500,000,000",
    routeSecurity: "highsec"
  });
  // Baseline rate: 5M base + 10 * 900k = 14M ISK
  assert.equal(result, 14_000_000);
});

test("Highsec - DST (Medium Package) baseline", () => {
  const result = calcReward({
    volume: "50,000",
    jumps: "10",
    collateral: "500,000,000",
    routeSecurity: "highsec"
  });
  // Baseline rate: 10M base + 10 * 1.25M = 22.5M ISK
  assert.equal(result, 22_500_000);
});

test("Dangerous - JF baseline", () => {
  const result = calcReward({
    volume: "200,000",
    jumps: "10",
    collateral: "2,000,000,000",
    routeSecurity: "dangerous"
  });
  // Baseline rate: 150M base + 10 * 35M + 2B * 0.3% = 506M ISK
  assert.equal(result, 506_000_000);
});

test("Over 5B Collateral Redirection", () => {
  const result = calcReward({
    volume: "50,000",
    jumps: "10",
    collateral: "6,000,000,000",
    routeSecurity: "highsec"
  });
  assert.equal(result, "Risako Hirano");
});
```

**Verify**: Run `node test/calculator.test.js`. All 4 tests must pass.

---

### Step 4: Update package.json scripts

Add standard commands to `package.json` for easy interaction:

```json
{
  "scripts": {
    "test": "node test/calculator.test.js",
    "lint": "biome check .",
    "format": "biome format --write ."
  },
  "devDependencies": {
    "@biomejs/biome": "2.3.14",
    "tscanner": "^0.1.3"
  }
}
```

**Verify**: Run `npm run test` or `pnpm test` and verify that the tests execute and exit 0.

## Test plan

- Execute `npm run test` and check outputs.
- Verify Biome passes: `npx @biomejs/biome check .`.

## Done criteria

- [ ] `calculator.js` exists and contains core calculation functions.
- [ ] `index.html` script is marked `type="module"` and imports calculation functions.
- [ ] `test/calculator.test.js` exists and passes successfully via `node test/calculator.test.js`.
- [ ] `package.json` contains `scripts` block exposing `test` and `lint`.
- [ ] Biome check runs cleanly.

## STOP conditions

- If the browser blocks loading `calculator.js` due to CORS policies when open locally via file scheme (explain to the user that a local dev server like `npx serve` or live-server is required for ES modules).
- If Node version is older than 18 (unlikely given `node --version` returned v24).

## Maintenance notes

- Any future rate changes must first be updated in the test files to assert the new expected outcomes, then updated in `calculator.js`.
