# Hauling Rates & Service Structure

## Market Analysis & Philosophy

Our pricing model is designed to be competitive with major logistics providers (PushX, Red Frog) while ensuring sustainable rewards for our independent contractors. We prioritize **reliability** and **speed** over being the absolute cheapest option for high-risk routes.

### Competitor Benchmark (Jan 2026)

- **PushX:**
  - HighSec: ~1.5M - 2.5M ISK per warp (variable by hull).
  - Jump Freighter: ~200M Base + 100M/system.
  - Collateral: Aggressive scaling > 5B ISK.
- **Red Frog:**
  - Standardized HighSec service (~1M - 2M/jump).
  - Strict limits on volume and collateral (max 1.5B ISK).

## Rate Structure

### 1. High-Security Service (0.5 - 1.0)

_Designed for standard logistics between trade hubs and mission centers._

| Hull Class               | Volume Limit   | Base Fee       | Rate per Jump | Collateral Limit |
| :----------------------- | :------------- | :------------- | :------------ | :--------------- |
| **Blockade Runner**      | < 12,500 m³    | 1,500,000 ISK  | 900,000 ISK   | 5 Billion ISK    |
| **Deep Space Transport** | < 62,500 m³    | 1,500,000 ISK  | 850,000 ISK   | 5 Billion ISK    |
| **Freighter**            | < 1,125,000 m³ | 20,000,000 ISK | 6,000,000 ISK | 5 Billion ISK    |

- **Collateral Surcharge:** 1.5% of Collateral value for contracts > 1 Billion ISK.
- **Minimum Reward:** 3,000,000 ISK.

### 2. Low/Null/Pochven Service (Dangerous)

_Requires Jump Freighter or Blockade Runner blockade-running._

| Service Type             | Volume Limit | Base Fee        | Rate per Jump (Ly) | Collateral Limit |
| :----------------------- | :----------- | :-------------- | :----------------- | :--------------- |
| **Covert Ops**           | < 12,500 m³  | 15,000,000 ISK  | 3,000,000 ISK      | 5 Billion ISK    |
| **Deep Space Transport** | < 62,500 m³  | 25,000,000 ISK  | 7,000,000 ISK      | 5 Billion ISK    |
| **Jump Freighter**       | < 360,000 m³ | 150,000,000 ISK | 35,000,000 ISK     | 5 Billion ISK\*  |

- _Contracts > 5 Billion Collateral require direct negotiation (see Risk Management)._

### 3. Special Handling

- **Rush Delivery (4 hours):** 2x Standard Rate.
- **Bulk Contracts:** Negotiable for > 5M m³ total volume.

---

## Risk Management & Collateral

### Collateral Pricing

Collateral is the single biggest risk factor for our haulers. Our automated pricing includes a risk premium for high-value cargo.

- **0 - 1 Billion ISK:** Included in Base Rate.
- **1 - 5 Billion ISK:** 1.5% Fee applies to the entire collateral amount.
- **> 5 Billion ISK:** **Manual Quote Required.** Directs to _Risako Hirano_ for specialized handling.

### Route Restrictions

- **High Sec:** No systems with < 0.5 security status.
- **Triglavian/Edencom:** We do not route through systems currently under siege unless "Dangerous" service is selected.

---

## Implementation Notes

- **Algorithm Update:** The current `index.html` calculation should be simplified to match this tiered table structure for better transparency.
- **Competitiveness:** These rates undercut PushX on short-haul HighSec routes but charge a premium for heavy Freighter logistics to account for the time investment.
