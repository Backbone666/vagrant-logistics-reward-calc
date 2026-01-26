# Competitive Analysis & Rate Strategy

## 1. Current State Analysis

**Status**: _Legacy System_
The previous implementation used a high "Danger Premium" for Low/Nullsec routes. With verified safe routing corridors, we can significantly reduce these premiums to undercut the market.

- **Market Opportunity**:
  - Competitors (PushX/Black Frog) price Low/Nullsec as "High Risk", forcing users into expensive Jump Freighters or limited Blockade Runners.
  - **Our Edge**: Utilizing reduced-risk routing to offer **DST** services in dangerous space at a price point that makes Jump Freighters obsolete for medium-sized loads.

## 2. Competitor Comparison (Low/Null Focus)

| Feature          | Vagrant (New)  | PushX               | Black Frog          |
| :--------------- | :------------- | :------------------ | :------------------ |
| **BR Lowsec**    | **2M / Jump**  | 3.75M / Warp        | N/A                 |
| **DST Low/Null** | **6M / Jump**  | JF Only (Expensive) | JF Only (Expensive) |
| **JF Low/Null**  | **60M / Jump** | 100M / Sys + Base   | ~300M+ Total        |

## 3. Recommended Rate Scale

We serve four distinct tiers. The **DST (Low/Null)** rate is the star of this strategy, bridging the gap between small packages and massive freight.

### A. Blockade Runner (BR) - _Speed & Stealth_

_Fast transport for small, high-value items._

- **Capacity**: Up to 12,500 m³
- **Highsec**: **5M Base + 900k ISK / Jump**
  - _Vs PushX_: We are ~40% cheaper on the jump rate.
- **Low/Null (Dangerous)**: **15M Base + 2M ISK / Jump**
  - _Vs PushX_: Significantly cheaper than their 3.75M/warp.

### B. Deep Space Transport (DST) - _The "Vagrant Special"_

_The primary value proposition. High volume in dangerous space without the specific JF cost._

- **Capacity**: Up to 62,500 m³
- **Highsec**: **10M Base + 1.25M ISK / Jump**
  - _Advantage_: Competitively priced against standard highsec haulers.
- **Low/Null (Dangerous)**: **25M Base + 6M ISK / Jump**
  - _Strategic Play_: This is aggressive. A 10-jump Lowsec run costs ~85M ISK.
  - _Competitor Comparison_: A competitor would force a Jump Freighter quote (300M+). We offer the same volume capability for **~25-30% of the price**.

### C. Freighter - _Highsec Bulk_

_Standard bulk hauling for safe space._

- **Capacity**: Up to 1,125,000 m³
- **Highsec**: **25M Base + 2M ISK / Jump**

### D. Jump Freighter (JF) - _Logistics_

_Capital-class hauling for massive loads in dangerous space._

- **Capacity**: Up to 360,000 m³
- **Low/Null**: **75M Base + 60M ISK / Jump**
  - _Justification_: Covers fuel (Isotopes) and cyno usage. Still significantly undercuts the "100M/System" industry standard.

---

## 4. Collateral Structure

Tiered percentage system to favor mid-range collateral contracts up to 5B.

| Collateral Tier      | Fee               | Notes                                      |
| :------------------- | :---------------- | :----------------------------------------- |
| **0 - 1.5 Billion**  | **FREE**          | Entry level standard.                      |
| **1.5B - 5 Billion** | **0.5% Fee**      | Highly competitive (beats 5x multipliers). |
| **> 5 Billion**      | **Risako Hirano** | Manual Quote / Escort Required.            |

## 5. Pricing Rationale

1.  **Safety Dividend**: We pass the savings from our "Safe Routes" directly to the customer. By not pricing in a high probability of ship loss, we can operate DSTs in Low/Null at 6M/jump.
2.  **The DST Niche**: The 12,500m³ to 62,500m³ range in Lowsec is a "Dead Zone" for competitors. They usually upsell to a JF. We fill this zone with the DST.
3.  **Simplified Tiers**: Removed "Shadow Class" marketing speak. The services are defined simply by the hull capability: BR, DST, Freighter, JF.

## 6. Implementation Notes

- **Logic**: Split calculation by Hull Type AND Security.
  - If **Dangerous Space** (checked):
    - Vol <= 12,500 -> BR Logic (15M + 2M/J)
    - Vol <= 62,500 -> DST Logic (25M + 6M/J)
    - Vol <= 360,000 -> JF Logic (75M + 60M/J)
  - If **Highsec** (unchecked):
    - Vol <= 12,500 -> BR Logic (5M + 900k/J)
    - Vol <= 62,500 -> DST Logic (10M + 1.25M/J)
    - Vol <= 1,125,000 -> Freighter Logic (25M + 2M/J)
