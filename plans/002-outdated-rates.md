# Plan 002: Update Calculation Rates to Match Rates.md and Test-cases.md

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise.
>
> **Drift check (run first)**: `git diff --stat e88f1d0..HEAD -- calculator.js test/calculator.test.js`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plans/001-verification-baseline.md
- **Category**: bug | tests
- **Planned at**: commit `e88f1d0`, 2026-07-04

## Why this matters

The calculations in `calculator.js` (extracted from `index.html`) use obsolete base fees and rates, causing calculated rewards to differ from official rate definitions in `rates.md` and failing scenarios in `test-cases.md`. Correcting this ensures customers receive accurate quotes matching corporate specifications.

## Current state

- The relevant files:
  - `calculator.js` — Contains `calcReward` logic.
  - `test/calculator.test.js` — Contains automated tests.
  - `rates.md` — Specifies the correct rates (e.g. BR Highsec base 3M / jump 800k).
  - `test-cases.md` — Specifies the 9 target test scenarios.
- Excerpts of current state (obsolete rates in `calculator.js`):
  ```javascript
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
    }
    ...
  } else if (routeSecurity === "dangerous" || routeSecurity === "high_risk") {
    ...
    if (parsedVolume <= 12_500) {
      baseFee = 15_000_000;
      ratePerJump = 2_000_000;
    } else if (parsedVolume <= 62_500) {
      baseFee = 25_000_000;
      ratePerJump = 6_000_000;
    }
  ```

## Commands you will need

| Purpose   | Command                         | Expected on success |
|-----------|---------------------------------|---------------------|
| Run Tests | `npm test`                      | exit 0, all tests pass |

## Scope

**In scope**:
- `calculator.js` [MODIFY]
- `test/calculator.test.js` [MODIFY]

**Out of scope**:
- Modifications to styling, UI structures, or layout variables.
- Modifying the collateral cap (remains at 5B).

## Git workflow

- Branch: `advisor/002-outdated-rates`
- Commits: Commit per step; message style: `fix: update calculator rates to match rates.md`

## Steps

### Step 1: Update the rates in calculator.js

Modify the rate constants in `calculator.js` to match the official updated rates:
- **Highsec BR**: Base 3,000,000, Jump 800,000
- **Highsec DST**: Base 8,000,000, Jump 1,200,000
- **Highsec Freighter**: Base 15,000,000, Jump 1,800,000
- **Dangerous (Lowsec/Nullsec) BR**: Base 10,000,000, Jump 2,000,000
- **Dangerous (Lowsec/Nullsec) DST**: Base 20,000,000, Jump 5,000,000

```javascript
  // 3. Service Tier Logic
  if (routeSecurity === "highsec") {
    if (parsedVolume <= 12_500) {
      baseFee = 3_000_000;
      ratePerJump = 800_000;
    } else if (parsedVolume <= 62_500) {
      baseFee = 8_000_000;
      ratePerJump = 1_200_000;
    } else if (parsedVolume <= 1_125_000) {
      baseFee = 15_000_000;
      ratePerJump = 1_800_000;
    } else {
      return "Max Volume 1,125,000 m³";
    }
  } else if (routeSecurity === "dangerous" || routeSecurity === "high_risk") {
    if (routeSecurity === "high_risk") riskMultiplier = 1.5;

    if (parsedVolume <= 12_500) {
      baseFee = 10_000_000;
      ratePerJump = 2_000_000;
    } else if (parsedVolume <= 62_500) {
      baseFee = 20_000_000;
      ratePerJump = 5_000_000;
    } else if (parsedVolume <= 360_000) {
      baseFee = 150_000_000;
      ratePerJump = 35_000_000;
    } else {
      return "Max Volume 360,000 m³ (JF)";
    }
  }
```

**Verify**: Verify changes save cleanly.

---

### Step 2: Implement all 9 scenarios in test/calculator.test.js

Update the automated test file to reflect all 9 scenarios from `test-cases.md`:

```javascript
import test from "node:test";
import assert from "node:assert/strict";
import { calcReward } from "../calculator.js";

test("Test 1: BR Highsec (Small Package)", () => {
  const result = calcReward({ volume: "10,000", jumps: "10", collateral: "500,000,000", routeSecurity: "highsec" });
  assert.equal(result, 11_000_000);
});

test("Test 2: DST Highsec (Medium Package)", () => {
  const result = calcReward({ volume: "50,000", jumps: "10", collateral: "500,000,000", routeSecurity: "highsec" });
  assert.equal(result, 20_000_000);
});

test("Test 3: Freighter Highsec (Large Package)", () => {
  const result = calcReward({ volume: "500,000", jumps: "10", collateral: "1,000,000,000", routeSecurity: "highsec" });
  assert.equal(result, 33_000_000);
});

test("Test 4: DST Highsec with Collateral (1-3B tier)", () => {
  const result = calcReward({ volume: "50,000", jumps: "10", collateral: "2,000,000,000", routeSecurity: "highsec" });
  assert.equal(result, 26_000_000);
});

test("Test 5: DST Highsec with Collateral (3-5B tier)", () => {
  const result = calcReward({ volume: "50,000", jumps: "10", collateral: "4,000,000,000", routeSecurity: "highsec" });
  assert.equal(result, 40_000_000);
});

test("Test 6: BR Lowsec", () => {
  const result = calcReward({ volume: "10,000", jumps: "10", collateral: "500,000,000", routeSecurity: "dangerous" });
  assert.equal(result, 30_000_000);
});

test("Test 7: DST Lowsec (Our Competitive Advantage)", () => {
  const result = calcReward({ volume: "50,000", jumps: "10", collateral: "2,000,000,000", routeSecurity: "dangerous" });
  assert.equal(result, 76_000_000);
});

test("Test 8: JF (CORRECTED PRICING)", () => {
  const result = calcReward({ volume: "200,000", jumps: "10", collateral: "2,000,000,000", routeSecurity: "dangerous" });
  assert.equal(result, 506_000_000);
});

test("Test 9: Over 5B Collateral", () => {
  const result = calcReward({ volume: "50,000", jumps: "10", collateral: "6,000,000,000", routeSecurity: "highsec" });
  assert.equal(result, "Risako Hirano");
});
```

**Verify**: Run `npm test`. All 9 tests must pass.

## Test plan

- Run `npm test` and verify that all 9 test assertions complete successfully.

## Done criteria

- [ ] All 9 tests pass.
- [ ] `calculator.js` contains the correct, updated rate structures matching `rates.md`.

## STOP conditions

- If any of the 9 tests fail, stop and check the math. Ensure the minimum reward floor (`Math.max(baseFee, totalReward)`) is correct.
