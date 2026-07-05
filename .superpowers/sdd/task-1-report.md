# Task 1 Report

## Status
COMPLETE

## Steps
1. Update standard JF cyno fee to 35M ISK in rate_card_config.json: DONE. Verified.
2. Implement percentage-based collateral surcharges in calculator.js: DONE. Verified via lint checks and test outputs (Test 6 and Test 9 failing with the new calculated amounts, as expected before Plan 007 is run).

## Files Changed
- `rate_card_config.json`
- `calculator.js`

## Notes
- Created git commits for both steps.
- Cleaned up biome warning regarding shadow variable declaration.
