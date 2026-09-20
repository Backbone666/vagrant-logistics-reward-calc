# Vagrant Logistics — Rate Card & Pricing Strategy

Authoritative specification of courier contract pricing formulas for **Vagrant Logistics** and **The Charter** alliance. All figures match the live configuration in `rate_card_config.json` and execution logic in `calculator.js`.

---

## 1. High-Sec Courier Tier

All High-Sec rates apply when a route contains **zero dangerous jumps** (`dangerousJumps === 0`) and the "Force Jump Freighter" option is unflagged.

### A. Blockade Runner / Deep Space Transport (BR / DST)
- **Hull Classes**: Prorator, Crane, Viator, Prowler, Impel, Bustard, Occator, Mastodon.
- **Volume Limit**: $\le 62,500\text{ m}^3$
- **Base Rate**: $1,500,000\text{ ISK per jump}$
- **Minimum Contract Fee**: $4,500,000\text{ ISK}$
- **Collateral Scale**:
  - $\le 1.5\text{ Billion ISK}$: $1.0\times$ multiplier ($0\text{ ISK}$ surcharge)
  - $\le 2.0\text{ Billion ISK}$: $1.8\times$ multiplier ($0\text{ ISK}$ surcharge)
  - $\le 3.0\text{ Billion ISK}$: $2.2\times$ multiplier ($0\text{ ISK}$ surcharge)
  - $\le 5.0\text{ Billion ISK}$: $4.0\times$ multiplier ($0\text{ ISK}$ surcharge)
  - $\le 10.0\text{ Billion ISK}$: $4.0\times$ multiplier $+ 12,000,000\text{ ISK}$ surcharge
  - $> 10.0\text{ Billion ISK}$: Manual quote redirect (**Risako Hirano**)

$$\text{Reward} = \max\left(4,500,000,\, (\text{Jumps} \times 1,500,000 \times \text{Multiplier}) + \text{Surcharge}\right)$$

---

### B. Freighter / Bulk Transport
- **Hull Classes**: Providence, Charon, Obelisk, Fenrir, Bowhead, Avalanche.
- **Volume Limit**: $\le 1,125,000\text{ m}^3$ (contracts $> 62,500\text{ m}^3$)
- **Base Rate**: $1,750,000\text{ ISK per jump}$
- **Minimum Contract Fee**: $10,000,000\text{ ISK}$
- **Collateral Scale**:
  - $\le 1.5\text{ Billion ISK}$: $1.0\times$ multiplier
  - $\le 3.0\text{ Billion ISK}$: $1.8\times$ multiplier
  - $\le 5.0\text{ Billion ISK}$: $3.5\times$ multiplier
  - $> 5.0\text{ Billion ISK}$: Manual quote redirect (**Risako Hirano**)

$$\text{Reward} = \max\left(10,000,000,\, \text{Jumps} \times 1,750,000 \times \text{Multiplier}\right)$$

---

## 2. Dangerous Space Courier Tier (Low-Sec / Null-Sec / Pochven)

Activated when a route traverses one or more dangerous systems ($\text{security} < 0.45$) or when "Force Jump Freighter" is toggled.

### Collateral Risk Premiums (Dangerous Routes)
- $\le 1.0\text{ Billion ISK}$: $0\text{ ISK}$ ($0\%$)
- $1.0\text{B} < \text{Collateral} \le 3.0\text{ Billion ISK}$: $0.3\%$ of collateral ($\text{Collateral} \times 0.003$)
- $> 3.0\text{ Billion ISK}$: $0.5\%$ of collateral ($\text{Collateral} \times 0.005$)

---

### A. Blockade Runner (Covert Stargate Route)
- **Volume Limit**: $\le 12,500\text{ m}^3$
- **Base Fee**: $10,000,000\text{ ISK}$
- **Dangerous Jump Rate**: $2,000,000\text{ ISK per jump}$
- **High-Sec Jump Rate**: $1,500,000\text{ ISK per jump}$
- **Max Collateral**: $5,000,000,000\text{ ISK}$ ($> 5\text{B}$ redirects to **Risako Hirano**)

$$\text{Reward} = 10,000,000 + (\text{Dangerous Jumps} \times 2,000,000) + (\text{High-Sec Jumps} \times 1,500,000) + \text{Collateral Premium}$$

---

### B. Scouted Deep Space Transport (DST Stargate Route)
- **Volume Limit**: $\le 62,500\text{ m}^3$
- **Base Fee**: $20,000,000\text{ ISK}$
- **Dangerous Jump Rate**: $5,000,000\text{ ISK per jump}$
- **High-Sec Jump Rate**: $2,000,000\text{ ISK per jump}$
- **Max Collateral**: $3,000,000,000\text{ ISK}$ ($> 3\text{B}$ redirects to **Risako Hirano**)

$$\text{Reward} = 20,000,000 + (\text{Dangerous Jumps} \times 5,000,000) + (\text{High-Sec Jumps} \times 2,000,000) + \text{Collateral Premium}$$

*Strategic Note*: Major competitors (PushX, Black Frog) do not offer subcapital dangerous space hauling, forcing customers with $15,000\text{--}62,500\text{ m}^3$ into expensive Jump Freighter minimums ($1.2\text{B}+\text{ ISK}$). Our Scouted DST service captures $100\%$ of this high-margin market.

---

### C. Jump Freighter Standard (Cyno Navigation)
- **Hull Classes**: Ark, Rhea, Anshar, Nomad.
- **Volume Limit**: $\le 360,000\text{ m}^3$ (or any volume when "Force Jump Freighter" is active)
- **Base Fee**: $150,000,000\text{ ISK}$
- **Cyno Jump Rate**: $35,000,000\text{ ISK per jump}$
- **Max Collateral**: $50,000,000,000\text{ ISK}$ ($> 50\text{B}$ redirects to **Executive Review**)

$$\text{Reward} = 150,000,000 + (\text{Cyno Jumps} \times 35,000,000) + \text{Collateral Premium}$$

---

## 3. Operational Modifiers & System Avoidance

### Route Safety Preferences
- **Safe Route (Prefer Highsec)**: Prioritises High-Sec travel (0.5+ security) and bypasses dangerous Low-Sec/Null-Sec stargates whenever a viable empire connection exists (`pref=safest` / `flag=secure`).
- **Shortest Route**: Computes the fewest total jumps between origin and destination, enforcing only corporate mandatory system avoidance (`pref=shortest` / `flag=shortest`).

### Mandatory Avoidance Systems
By corporate directive, all automated routing calculations enforce avoidance of critical choke points and hazard systems:
- `Zarzakh`
- `Ahbazon`
- `Rancer`
- `Hagilur`
- `Siseide`
- `Tama`
- `Aunenen`

---

## 4. Market Competitive Benchmarking

| Service Scenario | Vagrant Logistics | PushX | Market Delta | Strategic Position |
|---|---|---|---|---|
| **BR High-Sec** (10k m³, 10J, 500M) | **15.0M ISK** | 16.5M ISK | $-9\%$ | Undercuts market standard for rapid subcap hauls |
| **DST High-Sec** (50k m³, 10J, 2B) | **27.0M ISK** | ~33.0M ISK | $-18\%$ | Aggressive bulk pricing via DST efficiency |
| **Freighter High-Sec** (500k m³, 10J, 1B) | **17.5M ISK** | 24.75M ISK | $-29\%$ | High volume leader for hub-to-hub freight |
| **BR Low-Sec** (10k m³, 10J Dangerous, 500M) | **30.0M ISK** | ~37.5M ISK | $-20\%$ | Cost-effective covert deliveries |
| **DST Low-Sec** (50k m³, 10J Dangerous, 2B) | **76.0M ISK** | 1,200.0M ISK (Forced JF) | **$-94\%$** | **Uncontested market dominance in mid-size dangerous hauling** |
| **JF Low/Null** (200k m³, 10 Cyno Jumps, 2B) | **506.0M ISK** | 1,200.0M ISK | $-58\%$ | Competitively aligned with Black Frog (~300–500M) |
