# Hauling Rates & Service Structure

## Market Analysis & Philosophy

Our pricing model is designed to be competitive with major logistics providers (PushX, Red Frog) while ensuring sustainable rewards for our independent contractors. We prioritize **reliability** and **speed** over being the absolute cheapest option for high-risk routes.

### Competitor Benchmark (Jan 2026)
*   **PushX:**
    *   HighSec: ~1.5M - 2.5M ISK per warp (variable by hull).
    *   Jump Freighter: ~200M Base + 100M/system.
    *   Collateral: Aggressive scaling > 5B ISK.
*   **Red Frog:**
    *   Standardized HighSec service (~1M - 2M/jump).
    *   Strict limits on volume and collateral (max 1.5B ISK).

## Rate Structure

### 1. High-Security Service (0.5 - 1.0)
*Designed for standard logistics between trade hubs and mission centers.*

| Hull Class | Volume Limit | Base Fee | Rate per Jump | Collateral Limit |
| :--- | :--- | :--- | :--- | :--- |
| **Blockade Runner** | < 12,500 m³ | 1,000,000 ISK | 750,000 ISK | 3 Billion ISK |
| **Deep Space Transport** | < 62,500 m³ | 3,000,000 ISK | 1,500,000 ISK | 5 Billion ISK |
| **Freighter** | < 900,000 m³ | 10,000,000 ISK | 3,500,000 ISK | 3 Billion ISK |

*   **Collateral Surcharge:** 1% of Collateral value for contracts > 1 Billion ISK.
*   **Minimum Reward:** 3,000,000 ISK.

### 2. Low/Null/Pochven Service (Dangerous)
*Requires Jump Freighter or Blockade Runner blockade-running.*

| Service Type | Volume Limit | Base Fee | Rate per Jump (Ly) | Collateral Limit |
| :--- | :--- | :--- | :--- | :--- |
| **Covert Ops** | < 10,000 m³ | 15,000,000 ISK | 5,000,000 ISK | 2 Billion ISK |
| **Jump Freighter** | < 360,000 m³ | 150,000,000 ISK | 50,000,000 ISK | 10 Billion ISK* |

*   *Contracts > 5 Billion Collateral require direct negotiation (see Risk Management).*

### 3. Special Handling
*   **Rush Delivery (4 hours):** 2x Standard Rate.
*   **Bulk Contracts:** Negotiable for > 5M m³ total volume.

---

## Risk Management & Collateral

### Collateral Pricing
Collateral is the single biggest risk factor for our haulers. Our automated pricing includes a risk premium for high-value cargo.

*   **0 - 1 Billion ISK:** Included in Base Rate.
*   **1 - 5 Billion ISK:** 1.5% Fee applies to the entire collateral amount.
*   **> 5 Billion ISK:** **Manual Quote Required.** Directs to *Risako Hirano* for specialized handling.

### Route Restrictions
*   **High Sec:** No systems with < 0.5 security status.
*   **Triglavian/Edencom:** We do not route through systems currently under siege unless "Dangerous" service is selected.

---

## Implementation Notes
*   **Algorithm Update:** The current `index.html` calculation should be simplified to match this tiered table structure for better transparency.
*   **Competitiveness:** These rates undercut PushX on short-haul HighSec routes but charge a premium for heavy Freighter logistics to account for the time investment.
