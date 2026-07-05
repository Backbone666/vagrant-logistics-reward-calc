# Task 3 Report: Competitive Subcapital Lowsec/Nullsec Rates and Surcharges

## Status
COMPLETE

## Steps Completed

### Step 1: Update rate_card_config.json subcapital dangerous services
- **Status**: DONE
- **Details**: Configured `base_rate_isk`, updated `base_rate_per_jump_dangerous`, and removed the flat `collateral_surcharge_per_1b` for both blockade runner stargate and scouted DST stargate services.
- **Verification**: Ran `npx @biomejs/biome check rate_card_config.json` after formatting, which returned successful with no errors.

### Step 2: Implement base rate and percentage-based collateral surcharges in calculator.js
- **Status**: DONE
- **Details**: Updated `calcStargateRouteReward` to add `base_rate_isk` to the calculation, calculate `distanceFee`, and calculate `collateralFee` based on the graduated percentage tiers:
  - Collateral <= 1B: 0%
  - 1B < Collateral <= 3B: 0.3%
  - 3B < Collateral <= max: 0.5%
- **Verification**: Ran `npx @biomejs/biome check calculator.js` which validated syntax successfully.

### Step 3: Update test assertions in test/calculator.test.js
- **Status**: DONE
- **Details**: Updated Test 4 expectation to `30_000_000` (10M base + 10 * 2M) and Test 5 expectation to `76_000_000` (20M base + 10 * 5M + 2B * 0.3%).
- **Verification**: Ran `npm run test` which succeeded with all 8 tests passing.

## Files Changed
- [rate_card_config.json](file:///C:/Users/Backbone/Google%20Drive%20%28metalmic666%29/github/haulers-channel-reward-calc/rate_card_config.json)
- [calculator.js](file:///C:/Users/Backbone/Google%20Drive%20%28metalmic666%29/github/haulers-channel-reward-calc/calculator.js)
- [test/calculator.test.js](file:///C:/Users/Backbone/Google%20Drive%20%28metalmic666%29/github/haulers-channel-reward-calc/test/calculator.test.js)

## Notes
- None. Everything went according to the plan and brief.
