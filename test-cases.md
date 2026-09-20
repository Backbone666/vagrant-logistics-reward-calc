# Vagrant Logistics — Authoritative Test Case Reference

Authoritative documentation of core test scenarios implemented in the automated test suite (`test/calculator.test.js`, `test/route-service.test.js`, `test/system-autocomplete.test.js`).

---

## 1. High-Sec Test Scenarios

### Test 1: BR / DST High-Sec Standard (Small Volume, Baseline Collateral)
- **Inputs**: Volume `10,000 m³`, High-Sec Jumps `10`, Dangerous Jumps `0`, Collateral `500,000,000 ISK`
- **Calculation**: $\max(4,500,000,\, 10 \times 1,500,000 \times 1.0) = 15,000,000\text{ ISK}$
- **Expected Reward**: **15,000,000 ISK**

### Test 2: BR / DST High-Sec with Collateral Multiplier (1.5B–2.0B Tier)
- **Inputs**: Volume `50,000 m³`, High-Sec Jumps `10`, Dangerous Jumps `0`, Collateral `2,000,000,000 ISK`
- **Calculation**: $\max(4,500,000,\, 10 \times 1,500,000 \times 1.8) = 27,000,000\text{ ISK}$
- **Expected Reward**: **27,000,000 ISK**

### Test 3: Freighter High-Sec Standard (Bulk Volume)
- **Inputs**: Volume `500,000 m³`, High-Sec Jumps `10`, Dangerous Jumps `0`, Collateral `1,000,000,000 ISK`
- **Calculation**: $\max(10,000,000,\, 10 \times 1,750,000 \times 1.0) = 17,500,000\text{ ISK}$
- **Expected Reward**: **17,500,000 ISK**

---

## 2. Dangerous Space Test Scenarios

### Test 4: Blockade Runner Low-Sec (Covert Route)
- **Inputs**: Volume `10,000 m³`, High-Sec Jumps `0`, Dangerous Jumps `10`, Collateral `500,000,000 ISK`
- **Calculation**: $10,000,000\text{ (Base)} + (10 \times 1,800,000) + 0\text{ (Collateral } \le 1\text{B)} = \mathbf{28,000,000\text{ ISK}}$
- **Expected Reward**: **28,000,000 ISK**

### Test 5: Scouted DST Low-Sec (Mid-Volume Dangerous Route)
- **Inputs**: Volume `50,000 m³`, High-Sec Jumps `0`, Dangerous Jumps `10`, Collateral `2,000,000,000 ISK`
- **Calculation**: $20,000,000\text{ (Base)} + (10 \times 4,500,000) + (2,000,000,000 \times 0.003) = 20\text{M} + 45\text{M} + 6\text{M} = \mathbf{71,000,000\text{ ISK}}$
- **Expected Reward**: **71,000,000 ISK**

### Test 6: Jump Freighter Standard (Cyno Navigation)
- **Inputs**: Volume `200,000 m³`, High-Sec Jumps `0`, Dangerous Jumps `10`, Collateral `2,000,000,000 ISK`
- **Calculation**: $160,000,000\text{ (Base)} + (10 \times 40,000,000) + 0\text{ (Collateral } \le 2\text{B)} = 160\text{M} + 400\text{M} = \mathbf{560,000,000\text{ ISK}}$
- **Expected Reward**: **560,000,000 ISK**

---

## 3. Thresholds & Redirect Scenarios

### Test 7: Collateral Cap Redirects
- **High-Sec Subcapital** $> 10\text{B ISK}$: Returns `"Risako Hirano"` for executive quote.
- **High-Sec Freighter** $> 5\text{B ISK}$: Returns `"Risako Hirano"`.
- **Dangerous Blockade Runner** $> 5\text{B ISK}$: Returns `"Risako Hirano"`.
- **Dangerous Scouted DST** $> 5\text{B ISK}$: Returns `"Risako Hirano"`.
- **Jump Freighter** $> 50\text{B ISK}$: Returns `"Executive Review"`.

### Test 8: Route Safety Preferences
- **Safe Route (Prefer Highsec)** (`safeRoute === true`): Routes through empire High-Sec corridors (`pref=safest` in EVE TT, `flag=secure` in CCP ESI fallback), minimising exposure to dangerous stargates.
- **Shortest Route** (`safeRoute === false`): Computes direct shortest path (`pref=shortest` in EVE TT, `flag=shortest` in CCP ESI fallback) respecting corporate mandatory system avoidance.

---

## 4. Test Execution Guide

All scenarios above are automated in Node.js test files:
- `test/calculator.test.js`: Comprehensive pricing math, bracket verification, edge-case coverage.
- `test/route-service.test.js`: Route serialization, multi-tier CORS gateway failover, CCP ESI direct routing, jump classification.
- `test/system-autocomplete.test.js`: Combobox accessibility, dropdown dismissals, in-memory prefix search.

### Execution Command
```bash
npm test
```
Or for the complete linting and testing quality gate:
```bash
npm run check
```
