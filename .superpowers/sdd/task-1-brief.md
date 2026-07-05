# Plan 006: Implement Competitive JF Rates and Percentage Surcharges

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise.
>
> **Drift check (run first)**: `git diff --stat 2cb3e01..HEAD -- rate_card_config.json calculator.js`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: None
- **Category**: correctness | tech-debt
- **Planned at**: commit `2cb3e01`, 2026-07-04

## Why this matters

The Cyno jump fee (per-jump rate for Jump Freighters) is currently set at **50,000,000 ISK** instead of the strategically chosen **35,000,000 ISK**. Additionally, the collateral surcharges for JFs are flat fee brackets rather than the graduated percentage tiers (0.3% for 1B–3B, 0.5% for >3B) recommended in the competitive analysis. Correcting these rates aligns the service pricing with market competitor benchmarks (Black Frog).

## Current state

- The relevant files:
  - `rate_card_config.json` — Declares the EVE hauling rates and service variables.
  - `calculator.js` — Core calculator and service classification engine.
- Excerpts of current state:
  - `rate_card_config.json:L60-61`:
    ```json
    			"base_rate_isk": 150000000,
    			"cyno_jump_fee_isk": 50000000,
    ```
  - `calculator.js:L258-301` (inside JF standard calculation block):
    ```javascript
    	if (serviceClass === "dangerous_space_services.jump_freighter_standard") {
    		const service = dangerousConfig.jump_freighter_standard || {};
    		const jfBase = service.base_rate_isk || 0;
    		const cynoFee = service.cyno_jump_fee_isk || 0;
    
    		if (parsedCollateral > (service.max_collateral_isk || 50_000_000_000)) {
    			isRedirect = true;
    			redirectTarget = "Executive Review";
    		}
    
    		baseFee = jfBase;
    		distanceFee = parsedDangerousJumps * cynoFee; // Cyno Jumps assumes 1 per dangerous jump
    
    		let matchedSurcharge = 0;
    		if (!isRedirect) {
    			const brackets = service.collateral_brackets || [];
    			const matchedBracket = brackets.find(
    				(b) => parsedCollateral <= b.max_collateral_isk,
    			);
    			if (matchedBracket) {
    				matchedSurcharge = matchedBracket.surcharge_isk ?? 0;
    			} else {
    				isRedirect = true;
    				redirectTarget = "Executive Review";
    			}
    		}
    
    		let total = baseFee + distanceFee + matchedSurcharge;
    		if (rush) {
    			total += opsConfig.rush_surcharge_jf || 0;
    		}
    
    		return {
    			isRedirect,
    			redirectTarget,
    			total,
    			baseFee,
    			distanceFee,
    			collateralFee: matchedSurcharge,
    			multiplier: 1.0,
    			surcharge: 0,
    			serviceClass,
    		};
    	}
    ```

## Commands you will need

| Purpose   | Command                         | Expected on success |
|-----------|---------------------------------|---------------------|
| Verify    | `npm run test`                  | exit 0, tests pass (note: Test 6 and 9 will fail until Plan 007 runs) |
| Lint Check| `npx @biomejs/biome check .`    | exit 0, no errors   |

## Scope

**In scope**:
- `rate_card_config.json` [MODIFY]
- `calculator.js` [MODIFY]

**Out of scope**:
- Modifying test files directly (handled in Plan 007).

## Git workflow

- Branch: `advisor/006-competitive-jf-rates`
- Commits: Commit per step; message style: `feat: implement competitive JF cyno fees and percentage-based collateral surcharges`

## Steps

### Step 1: Update rate_card_config.json cyno fee

Modify standard JF cyno fee (`cyno_jump_fee_isk`) from `50000000` to `35000000` (35M ISK):

```json
			"base_rate_isk": 150000000,
			"cyno_jump_fee_isk": 35000000,
```

**Verify**: Verify json saves cleanly.

---

### Step 2: Implement percentage-based collateral surcharges in calculator.js

Replace the flat-bracket surcharge logic for standard JF in `calculator.js` with graduated percentage surcharges:
* `collateral <= 1B`: 0%
* `1B < collateral <= 3B`: 0.3%
* `3B < collateral <= 50B`: 0.5%
* `collateral > 50B`: redirects to "Executive Review"

Modify the `jump_freighter_standard` logic in `calculator.js` to look like this:

```javascript
	if (serviceClass === "dangerous_space_services.jump_freighter_standard") {
		const service = dangerousConfig.jump_freighter_standard || {};
		const jfBase = service.base_rate_isk || 0;
		const cynoFee = service.cyno_jump_fee_isk || 0;

		if (parsedCollateral > (service.max_collateral_isk || 50_000_000_000)) {
			isRedirect = true;
			redirectTarget = "Executive Review";
		}

		baseFee = jfBase;
		distanceFee = parsedDangerousJumps * cynoFee;

		let collateralFee = 0;
		if (!isRedirect) {
			if (parsedCollateral > 1_000_000_000 && parsedCollateral <= 3_000_000_000) {
				collateralFee = parsedCollateral * 0.003;
			} else if (parsedCollateral > 3_000_000_000) {
				collateralFee = parsedCollateral * 0.005;
			}
		}

		let total = baseFee + distanceFee + collateralFee;
		if (rush) {
			total += opsConfig.rush_surcharge_jf || 0;
		}

		return {
			isRedirect,
			redirectTarget: isRedirect ? "Executive Review" : "",
			total,
			baseFee,
			distanceFee,
			collateralFee,
			multiplier: 1.0,
			surcharge: 0,
			serviceClass,
		};
	}
```

**Verify**: Run `npx @biomejs/biome check calculator.js` to verify syntax and formatting conforms to style guidelines.
