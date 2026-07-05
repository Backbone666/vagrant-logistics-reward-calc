# Competitive Analysis & Rate Strategy

## Fork Source Analysis & Market Positioning

---

## 1. FORK SOURCE COMPARISON: Haulers Channel Calculator

### Original Haulers Channel Formula (Lines 38-140)

The original calculator uses a **complex dynamic formula** based on:

**Base Formula (Highsec/Non-JF):**

```
reward = ((mult * base * collateral / 1e9) + add) * jumps
```

Where:

- `base = 1,000,000 ISK`
- `mult` starts at 1.0 and is modified by various factors
- `add` is volume/collateral-based bonuses

**Key Mechanics:**

1. **Collateral Boosting for Low Values:**
   - BR/T1 (≤12k m³): If collat < 1B, artificially inflates to `(100M + collat) / 1.1`
   - DST (12k-60k m³): If collat < 1B, inflates to `(1B + collat) / 2`
   - Freighter (>62.5k m³): If collat < 1B, inflates to `(3B + collat) / 4`
2. **Jump Minimum Penalty:**
   - If jumps < 5: `jumps = (5 + jumps) * 0.5` (minimum 2.5 effective jumps)

3. **Low/Null Multiplier:**
   - `mult *= 2` for dangerous space
   - Rush in Low/Null: `mult *= 2` again (4x total)

4. **JF Formula (Low/Null, volume > 62.5k):**

```
reward = (mult * 60M * max(1.0, jumps/7)) + (collateral * 0.01)
```

Where mult varies by volume:

- < 100 m³: 0.25x
- ≤ 12k m³: 0.5x
- ≤ 60k m³: 0.75x
- ≤ 340k m³: 1.0x
- > 340k m³: 4.0x

### Vagrant Logistics Deviations from Fork

**What We Changed:**

1. ✅ **Removed artificial collateral inflation** - More transparent pricing
2. ✅ **Removed jump minimum penalty** - Fairer for short routes
3. ✅ **Simplified to fixed base + per-jump model** - Easier to understand
4. ✅ **Added distinct BR tier** - Original treated BR/DST identically
5. ❌ **Lost dynamic collateral scaling** - Original scaled smoothly with collateral value
6. ❌ **JF pricing became disconnected** - Original had volume-based multipliers

**Critical Finding:**
The original formula creates **MUCH LOWER** JF prices than our current implementation:

- **Original JF (10 jumps, 200k m³, 2B collateral):** ~85M ISK + 20M collateral fee = **105M ISK**
- **Our Current JF (same scenario):** 75M + (10 \* 60M) = **675M ISK** ⚠️

---

## 2. Competitor Comparison Matrix

| Service            | Vagrant (Current) | Haulers Channel (Fork) | PushX               | Purple Frog | Black Frog |
| :----------------- | :---------------- | :--------------------- | :------------------ | :---------- | :--------- |
| **BR Highsec**     | 5M + 900k/J       | Dynamic (1M base)      | 1.5M/warp           | N/A         | N/A        |
| **DST Highsec**    | 10M + 1.25M/J     | Dynamic (1M base)      | 1.5M/warp           | Calculator  | N/A        |
| **Freighter HS**   | 25M + 2M/J        | Dynamic (1M base)      | 2.25M/warp          | N/A         | N/A        |
| **BR Lowsec**      | 15M + 2M/J        | Dynamic (2x mult)      | 3.75M/warp          | N/A         | N/A        |
| **DST Low/Null**   | 25M + 6M/J        | Dynamic (2x mult)      | JF Only             | N/A         | JF Only    |
| **JF Low/Null**    | 75M + 60M/J ⚠️    | 60M base + dynamic     | 200M + 100M/sys     | N/A         | ~300M+     |
| **Collateral**     | 0.5% > 1.5B       | Dynamic scaling        | Multipliers         | Up to 10B   | Tiered     |
| **Max Collateral** | 5B                | No hard cap            | 10B (DST), 50B (JF) | 10B         | 50B        |

### Example Calculations

**Scenario: DST Highsec, 50k m³, 10 jumps, 500M collateral**

- **Vagrant:** 10M + (10 \* 1.25M) = **22.5M ISK**
- **Haulers Channel:** (1.0 _ 1M _ 500M/1B) \* 10 = **5M ISK** (artificially low due to collat boost)
- **PushX:** 11 warps _ 1.5M _ 1.0 (no multiplier) = **16.5M ISK**

**Scenario: DST Lowsec, 50k m³, 10 jumps, 2B collateral**

- **Vagrant:** 25M + (10 _ 6M) + (2B _ 0.5%) = 25M + 60M + 10M = **95M ISK**
- **Haulers Channel:** (2.0 _ 1M _ 2B/1B) \* 10 = **40M ISK**
- **PushX:** Forces JF service = 200M + (10 \* 100M) = **1.2B ISK**

**Scenario: JF Low/Null, 200k m³, 10 jumps, 2B collateral** ⚠️

- **Vagrant (CURRENT):** 75M + (10 \* 60M) = **675M ISK** ❌ TOO HIGH
- **Haulers Channel:** (1.0 _ 60M _ max(1, 10/7)) + (2B \* 0.01) = 85.7M + 20M = **105.7M ISK**
- **PushX:** 200M + (10 \* 100M) = **1.2B ISK**
- **Black Frog:** Estimated **300-400M ISK**

---

## 3. Current Baseline Rate Scale

### Philosophy

1. **Transparent Fixed Pricing** - Maintain our improvement over fork's opaque formula
2. **Competitive DST Rates** - Beat PushX and Purple Frog
3. **Realistic JF Pricing** - Fix the critical overpricing issue
4. **Collateral Fairness** - Simple percentage model

### A. Blockade Runner (BR) - _Speed & Stealth_

**Capacity:** Up to 12,500 m³

| Security    | Base Fee | Per Jump | Notes                       |
| :---------- | :------- | :------- | :-------------------------- |
| **Highsec** | 3M ISK   | 800k ISK | Undercuts PushX (1.5M/warp) |
| **Lowsec**  | 10M ISK  | 2M ISK   | Beats PushX (3.75M/warp)    |

**Example:** 10 jumps HS = 3M + 8M = **11M ISK** vs PushX 16.5M

### B. Deep Space Transport (DST) - _The Vagrant Advantage_

**Capacity:** Up to 62,500 m³

| Security    | Base Fee | Per Jump | Notes                  |
| :---------- | :------- | :------- | :--------------------- |
| **Highsec** | 8M ISK   | 1.2M ISK | Competitive with PushX |
| **Lowsec**  | 20M ISK  | 5M ISK   | **Uncontested market** |
| **Nullsec** | 25M ISK  | 6M ISK   | **Uncontested market** |

**Example:** 10 jumps Lowsec = 20M + 50M = **70M ISK** vs PushX forcing JF (1.2B)

### C. Freighter - _Highsec Bulk_

**Capacity:** Up to 1,125,000 m³

| Security    | Base Fee | Per Jump | Notes                               |
| :---------- | :------- | :------- | :---------------------------------- |
| **Highsec** | 15M ISK  | 1.8M ISK | Competitive with PushX (2.25M/warp) |

**Example:** 10 jumps = 15M + 18M = **33M ISK** vs PushX ~25M

### D. Jump Freighter (JF) - _REVISED PRICING_ ⚠️

**Capacity:** Up to 360,000 m³

| Security     | Base Fee | Per Jump | Notes                     |
| :----------- | :------- | :------- | :------------------------ |
| **Low/Null** | 100M ISK | 50M ISK  | **REDUCED from 60M/jump** |

**Critical Adjustment:**

- **OLD:** 75M + 60M/jump = 675M for 10 jumps ❌
- **NEW:** 100M + 50M/jump = 600M for 10 jumps
- **Still competitive vs:** PushX (1.2B), Black Frog (~400M)

**Alternative Conservative Pricing:**

- **Base:** 150M ISK
- **Per Jump:** 35M ISK
- **10 jumps:** 150M + 350M = **500M ISK** (more competitive)

---

## 4. Current Baseline Collateral Structure

| Collateral Tier | Fee               | Rationale                                     |
| :-------------- | :---------------- | :-------------------------------------------- |
| **0 - 1B**      | **FREE**          | Matches industry standard                     |
| **1B - 3B**     | **0.3%**          | Lower than our current 0.5%, more competitive |
| **3B - 5B**     | **0.5%**          | Graduated tier for high-value                 |
| **> 5B**        | **Risako Hirano** | Manual quote required                         |

**Why This Works:**

- **2B collateral:** 0.3% = 6M fee (vs our current 10M)
- **4B collateral:** 0.5% = 20M fee (vs our current 20M, but starts higher)
- More competitive on mid-range collateral (1-3B)

---

## 5. Pricing Rationale

### Why We Beat Competitors

**1. DST Dominance (Our Killer App)**

- PushX doesn't offer DST in Low/Null (forces expensive JF)
- We fill the 12.5k - 62.5k m³ gap in dangerous space
- **70M for 10-jump Lowsec DST vs 1.2B JF requirement**

**2. Transparent Pricing**

- Original fork formula is opaque and confusing
- Our fixed base + per-jump is clear and predictable
- Customers can calculate quotes themselves

**3. Competitive Highsec**

- BR: 11M vs PushX 16.5M (10 jumps)
- DST: 20M vs PushX 16.5M (slightly higher but more capacity)
- Freighter: 33M vs PushX 25M (competitive range)

**4. JF Reality Check**

- **CRITICAL:** Reduced from 675M to 500-600M range
- Still profitable but not pricing ourselves out
- Competitive with Black Frog, cheaper than PushX

### Why We Improved on Fork Source

**Original Haulers Channel Weaknesses:**

1. **Artificial collateral inflation** - Confusing and opaque
2. **Jump minimum penalty** - Unfair to short routes
3. **No BR/DST distinction** - Missed pricing opportunity
4. **Dynamic formula complexity** - Hard to predict quotes

**Our Improvements:**

1. ✅ **Transparent fixed pricing**
2. ✅ **Fair short-route pricing**
3. ✅ **Distinct service tiers**
4. ✅ **Predictable calculations**
5. ✅ **Competitive DST Low/Null offering**

---

## 6. Implementation History

### Immediate Changes Required

**1. JF Rate Reduction (CRITICAL)**

```javascript
// OLD (OVERPRICED):
baseFee = 75_000_000;
ratePerJump = 60_000_000;

// NEW (COMPETITIVE):
baseFee = 150_000_000;
ratePerJump = 35_000_000;
```

**2. Collateral Tier Adjustment**

```javascript
// OLD:
if (collateral > 1_500_000_000) {
  totalReward += collateral * 0.005; // 0.5%
}

// NEW:
if (collateral > 1_000_000_000 && collateral <= 3_000_000_000) {
  totalReward += collateral * 0.003; // 0.3%
} else if (collateral > 3_000_000_000) {
  totalReward += collateral * 0.005; // 0.5%
}
```

**3. Minor Base Fee Adjustments**

- BR Highsec: 5M → 3M
- BR Lowsec: 15M → 10M
- DST Highsec: 10M → 8M
- DST Lowsec: 25M → 20M
- Freighter: 25M → 15M

---

## 7. Competitive Advantages Summary

### vs Original Haulers Channel (Fork Source)

- ✅ **Transparent pricing** (no hidden formulas)
- ✅ **Distinct BR tier** (better small-package pricing)
- ✅ **Predictable quotes** (customers can self-calculate)
- ✅ **Fair short routes** (no jump minimum penalty)

### vs PushX

- ✅ **DST Low/Null service** (they force JF)
- ✅ **Cheaper BR rates** (800k vs 1.5M per jump)
- ✅ **Simpler collateral fees** (% vs multipliers)

### vs Red/Black/Purple Frog

- ✅ **Higher collateral limits** (5B vs 1.5B for Red Frog)
- ✅ **Competitive JF pricing** (500-600M vs 300-400M Black Frog)
- ✅ **DST Low/Null availability** (Purple Frog is Highsec only)

### Market Position

**"The Transparent Alternative with DST Specialization"**

- Clear, predictable pricing (vs opaque calculators)
- Uncontested DST Low/Null service (vs competitors forcing JF)
- Competitive across all tiers (vs single-focus services)

---

## 8. Per-Jump vs Per-Warp Decision

**Recommendation: STAY WITH PER-JUMP**

**Reasoning:**

1. **Simplicity** - Easier for customers to understand
2. **EVE Standard** - Most players think in jumps, not warps
3. **Route Planning** - Jumps are visible in-game route planner
4. **Differentiation** - PushX uses per-warp, we use per-jump

**Note:** PushX's "per warp" typically equals jumps + 1, making their effective rate ~10% higher than advertised for comparison purposes.

---

_Analysis completed: 2026-01-26_
_Critical finding: JF rates require immediate reduction from 60M to 35M per jump_
