# Plan 008: Implement Competitive Subcapital Lowsec/Nullsec Rates and Surcharges

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise.
>
> **Drift check (run first)**: `git diff --stat 2cb3e01..HEAD -- rate_card_config.json calculator.js test/calculator.test.js`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: None
- **Category**: correctness | tests
- **Planned at**: commit `2cb3e01`, 2026-07-04

## Why this matters

The subcapital dangerous space services (Blockade Runner and Deep Space Transport Stargate routes) currently use outdated base rates and per-jump fees in `rate_card_config.json`, and completely omit flat base fees (10M for BR, 20M for DST). Additionally, they calculate collateral fees with a flat fee per 1B ISK instead of the graduated percentage tiers (0.3% for 1B–3B, 0.5% for >3B) specified in the corporate strategy. Implementing these changes brings Lowsec subcapital pricing in line with competitor benchmarks (PushX/Frog) and corporate pricing documents.

## Current state

- The relevant files:
  - `rate_card_config.json` — Declares the EVE hauling rates and service variables.
  - `calculator.js` — Core calculator and service classification engine.
  - `test/calculator.test.js` — Test suite for calculator logic.
- Excerpts of current state:
  - `rate_card_config.json:L38-55`:
    ```json
    		"blockade_runner_stargate": {
    			"region": "Lowsec / NPC Nullsec Stargate",
    			"hull_class": "Blockade Runner",
    			"max_volume_m3": 12500,
    			"base_rate_per_jump_dangerous": 3000000,
    			"base_rate_per_jump_highsec": 1500000,
    			"max_collateral_isk": 5000000000,
    			"collateral_surcharge_per_1b": 35000000
    		},
    		"scouted_dst_stargate": {
    			"region": "Lowsec / Selected Nullsec Stargate (Scouted)",
    			"hull_class": "Deep Space Transport",
    			"max_volume_m3": 62500,
    			"base_rate_per_jump_dangerous": 10000000,
    			"base_rate_per_jump_highsec": 2000000,
    			"max_collateral_isk": 3000000000,
    			"collateral_surcharge_per_1b": 80000000
    		},
    ```
  - `calculator.js:L51-91` (`calcStargateRouteReward`):
    ```javascript
    function calcStargateRouteReward({
    	service,
    	parsedHighsecJumps,
    	parsedDangerousJumps,
    	parsedCollateral,
    	rush,
    	opsConfig,
    	serviceClass,
    	maxCollateral,
    }) {
    	let isRedirect = false;
    	if (parsedCollateral > (service.max_collateral_isk || maxCollateral)) {
    		isRedirect = true;
    	}
    
    	const dangerousJumpRate = service.base_rate_per_jump_dangerous || 0;
    	const hsJumpRate = service.base_rate_per_jump_highsec || 0;
    
    	const baseFee =
    		parsedDangerousJumps * dangerousJumpRate + parsedHighsecJumps * hsJumpRate;
    	const collateralFee =
    		(parsedCollateral / 1_000_000_000) *
    		(service.collateral_surcharge_per_1b || 0);
    
    	let total = baseFee + collateralFee;
    	if (rush) {
    		total += opsConfig.rush_surcharge_subcapital || 0;
    	}
    
    	return {
    		isRedirect,
    		redirectTarget: isRedirect ? "Risako Hirano" : "",
    		total,
    		baseFee,
    		distanceFee: 0,
    		collateralFee,
    		multiplier: 1.0,
    		surcharge: 0,
    		serviceClass,
    	};
    }
    ```
  - `test/calculator.test.js:L52-76`:
    ```javascript
    test("Test 4: BR Lowsec (Volume 10k, HS Jumps 0, Dangerous Jumps 10, Collateral 500M)", () => {
    	const result = calcReward(
    		{
    			volume: "10,000",
    			highsecJumps: "0",
    			dangerousJumps: "10",
    			collateral: "500,000,000",
    		},
    		config,
    	);
    	assert.equal(result, 47_500_000);
    });
    
    test("Test 5: DST Lowsec (Volume 50k, HS Jumps 0, Dangerous Jumps 10, Collateral 2B)", () => {
    	const result = calcReward(
    		{
    			volume: "50,000",
    			highsecJumps: "0",
    			dangerousJumps: "10",
    			collateral: "2,000,000,000",
    		},
    		config,
    	);
    	assert.equal(result, 260_000_000);
    });
    ```

## Commands you will need

| Purpose   | Command                         | Expected on success |
|-----------|---------------------------------|---------------------|
| Verify    | `npm run test`                  | exit 0, all tests pass |
| Lint Check| `npx @biomejs/biome check .`    | exit 0, no errors   |

## Scope

**In scope**:
- `rate_card_config.json` [MODIFY]
- `calculator.js` [MODIFY]
- `test/calculator.test.js` [MODIFY]

**Out of scope**:
- Modifying Highsec rates or Jump Freighter logic.

## Git workflow

- Branch: `advisor/008-subcapital-lowsec-rates`
- Commits: Commit per step; message style: `feat: implement competitive subcapital lowsec rates and surcharges`

## Steps

### Step 1: Update rate_card_config.json subcapital dangerous services

Modify Blockade Runner stargate and Scouted DST stargate entries in `rate_card_config.json` to configure base rates, updated cyno jump rates, and remove the flat collateral surcharge:

```json
		"blockade_runner_stargate": {
			"region": "Lowsec / NPC Nullsec Stargate",
			"hull_class": "Blockade Runner",
			"max_volume_m3": 12500,
			"base_rate_isk": 10000000,
			"base_rate_per_jump_dangerous": 2000000,
			"base_rate_per_jump_highsec": 1500000,
			"max_collateral_isk": 5000000000
		},
		"scouted_dst_stargate": {
			"region": "Lowsec / Selected Nullsec Stargate (Scouted)",
			"hull_class": "Deep Space Transport",
			"max_volume_m3": 62500,
			"base_rate_isk": 20000000,
			"base_rate_per_jump_dangerous": 5000000,
			"base_rate_per_jump_highsec": 2000000,
			"max_collateral_isk": 3000000000
		},
```

**Verify**: Verify JSON is valid.

---

### Step 2: Implement base rate and percentage-based collateral surcharges in calculator.js

Update `calcStargateRouteReward` in `calculator.js` to calculate rewards using `service.base_rate_isk` + per-jump fees, and apply the graduated percentage collateral surcharges:
* `collateral <= 1B`: 0%
* `1B < collateral <= 3B`: 0.3%
* `3B < collateral <= maxCollateral`: 0.5%

Modify `calcStargateRouteReward` to look like this:

```javascript
function calcStargateRouteReward({
	service,
	parsedHighsecJumps,
	parsedDangerousJumps,
	parsedCollateral,
	rush,
	opsConfig,
	serviceClass,
	maxCollateral,
}) {
	let isRedirect = false;
	if (parsedCollateral > (service.max_collateral_isk || maxCollateral)) {
		isRedirect = true;
	}

	const baseRate = service.base_rate_isk || 0;
	const dangerousJumpRate = service.base_rate_per_jump_dangerous || 0;
	const hsJumpRate = service.base_rate_per_jump_highsec || 0;

	const distanceFee =
		parsedDangerousJumps * dangerousJumpRate + parsedHighsecJumps * hsJumpRate;

	let collateralFee = 0;
	if (!isRedirect) {
		if (parsedCollateral > 1_000_000_000 && parsedCollateral <= 3_000_000_000) {
			collateralFee = parsedCollateral * 0.003;
		} else if (parsedCollateral > 3_000_000_000) {
			collateralFee = parsedCollateral * 0.005;
		}
	}

	let total = baseRate + distanceFee + collateralFee;
	if (rush) {
		total += opsConfig.rush_surcharge_subcapital || 0;
	}

	return {
		isRedirect,
		redirectTarget: isRedirect ? "Risako Hirano" : "",
		total,
		baseFee: baseRate,
		distanceFee,
		collateralFee,
		multiplier: 1.0,
		surcharge: 0,
		serviceClass,
	};
}
```

**Verify**: Run `npx @biomejs/biome check calculator.js` to verify syntax.

---

### Step 3: Update test assertions in test/calculator.test.js

Update Test 4 and Test 5 expected assertions:
- Test 4 expected is **30,000,000 ISK** (`10M base + 10 * 2M jump`).
- Test 5 expected is **76,000,000 ISK** (`20M base + 10 * 5M jump + 2B * 0.3% collateral surcharge`).

```javascript
test("Test 4: BR Lowsec (Volume 10k, HS Jumps 0, Dangerous Jumps 10, Collateral 500M)", () => {
	const result = calcReward(
		{
			volume: "10,000",
			highsecJumps: "0",
			dangerousJumps: "10",
			collateral: "500,000,000",
		},
		config,
	);
	assert.equal(result, 30_000_000);
});

test("Test 5: DST Lowsec (Volume 50k, HS Jumps 0, Dangerous Jumps 10, Collateral 2B)", () => {
	const result = calcReward(
		{
			volume: "50,000",
			highsecJumps: "0",
			dangerousJumps: "10",
			collateral: "2,000,000,000",
		},
		config,
	);
	assert.equal(result, 76_000_000);
});
```

**Verify**: Run `npm run test` and confirm all tests pass.
