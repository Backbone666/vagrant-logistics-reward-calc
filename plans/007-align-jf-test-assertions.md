# Plan 007: Align Jump Freighter Test Assertions with Competitive Strategy

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise.
>
> **Drift check (run first)**: `git diff --stat 2cb3e01..HEAD -- test/calculator.test.js`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plans/006-competitive-jf-rates.md
- **Category**: tests
- **Planned at**: commit `2cb3e01`, 2026-07-04

## Why this matters

The test suite contains hardcoded assertions checking outdated, overpriced Jump Freighter rates. Aligning these assertions with the competitive rates (35M ISK per jump and percentage-based collateral surcharges) defined in Plan 006 ensures the test suite accurately reflects the product strategy.

## Current state

- The relevant files:
  - `test/calculator.test.js` — The unit tests verifying reward math.
- Excerpts of current state:
  - `test/calculator.test.js:L78-89`:
    ```javascript
    test("Test 6: Jump Freighter (Volume 200k, HS Jumps 0, Dangerous Jumps 10, Collateral 2B)", () => {
    	const result = calcReward(
    		{
    			volume: "200,000",
    			highsecJumps: "0",
    			dangerousJumps: "10",
    			collateral: "2,000,000,000",
    		},
    		config,
    	);
    	assert.equal(result, 650_000_000);
    });
    ```
  - `test/calculator.test.js:L104-117`:
    ```javascript
    test("Test 9: Jump Freighter Rush Service", () => {
    	const result = calcReward(
    		{
    			volume: "200,000",
    			highsecJumps: "0",
    			dangerousJumps: "10",
    			collateral: "2,000,000,000",
    			rush: true,
    		},
    		config,
    	);
    	// 150M Base + 500M Jump + 0 Collateral + 150M Rush Surcharge = 800M
    	assert.equal(result, 800_000_000);
    });
    ```

## Commands you will need

| Purpose   | Command                         | Expected on success |
|-----------|---------------------------------|---------------------|
| Verify    | `npm run test`                  | exit 0, all tests pass |
| Lint Check| `npx @biomejs/biome check .`    | exit 0, no errors   |

## Scope

**In scope**:
- `test/calculator.test.js` [MODIFY]

**Out of scope**:
- Changing logic inside `calculator.js`.

## Git workflow

- Branch: `advisor/007-align-jf-test-assertions`
- Commits: Commit per step; message style: `test: update Jump Freighter test assertions for competitive rate changes`

## Steps

### Step 1: Update Test 6 assertion

Update the expected value of Test 6 from `650_000_000` to `506_000_000` (representing `150M base + 10 * 35M jump rate + 2B * 0.3% collateral surcharge`):

```javascript
test("Test 6: Jump Freighter (Volume 200k, HS Jumps 0, Dangerous Jumps 10, Collateral 2B)", () => {
	const result = calcReward(
		{
			volume: "200,000",
			highsecJumps: "0",
			dangerousJumps: "10",
			collateral: "2,000,000,000",
		},
		config,
	);
	assert.equal(result, 506_000_000);
});
```

**Verify**: Verify changes save cleanly.

---

### Step 2: Update Test 9 assertion

Update the expected value of Test 9 from `800_000_000` to `656_000_000` (representing `150M base + 10 * 35M jump rate + 2B * 0.3% collateral surcharge + 150M rush surcharge`):

```javascript
test("Test 9: Jump Freighter Rush Service", () => {
	const result = calcReward(
		{
			volume: "200,000",
			highsecJumps: "0",
			dangerousJumps: "10",
			collateral: "2,000,000,000",
			rush: true,
		},
		config,
	);
	// 150M Base + 350M Jump + 6M Collateral + 150M Rush Surcharge = 656M
	assert.equal(result, 656_000_000);
});
```

**Verify**: Run `npm run test` and confirm all 8 unit tests now pass.
