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

Activated when a route traverses one or more dangerous systems ($\text{security} < 0.45$) or when "Force Jump Freighter" is toggled.

### Collateral Risk Premiums (Dangerous Routes)
- **Blockade Runner**:
  - $\le 1.0\text{ Billion ISK}$: $0\text{ ISK}$ ($0\%$)
  - $1.0\text{B} < \text{Collateral} \le 3.0\text{ Billion ISK}$: $0.2\%$ of collateral ($\text{Collateral} \times 0.002$)
  - $3.0\text{B} < \text{Collateral} \le 5.0\text{ Billion ISK}$: $0.4\%$ of collateral ($\text{Collateral} \times 0.004$)
- **Scouted Deep Space Transport**:
  - $\le 1.0\text{ Billion ISK}$: $0\text{ ISK}$ ($0\%$)
  - $1.0\text{B} < \text{Collateral} \le 3.0\text{ Billion ISK}$: $0.3\%$ of collateral ($\text{Collateral} \times 0.003$)
  - $3.0\text{B} < \text{Collateral} \le 5.0\text{ Billion ISK}$: $0.5\%$ of collateral ($\text{Collateral} \times 0.005$)
- **Jump Freighter**:
  - $\le 2.0\text{ Billion ISK}$: $0\text{ ISK}$ ($0\%$)
  - $2.0\text{B} < \text{Collateral} \le 10.0\text{ Billion ISK}$: $0.4\%$ of collateral ($\text{Collateral} \times 0.004$)
  - $10.0\text{B} < \text{Collateral} \le 50.0\text{ Billion ISK}$: $0.6\%$ of collateral ($\text{Collateral} \times 0.006$)

---

### A. Blockade Runner (Covert Stargate Route)
- **Volume Limit**: $\le 12,500\text{ m}^3$
- **Base Fee**: $10,000,000\text{ ISK}$
- **Dangerous Jump Rate**: $1,800,000\text{ ISK per jump}$
- **High-Sec Jump Rate**: $1,200,000\text{ ISK per jump}$
- **Max Collateral**: $5,000,000,000\text{ ISK}$ ($> 5\text{B}$ redirects to **Risako Hirano**)

$$\text{Reward} = 10,000,000 + (\text{Dangerous Jumps} \times 1,800,000) + (\text{High-Sec Jumps} \times 1,200,000) + \text{Collateral Premium}$$

---

### B. Scouted Deep Space Transport (DST Stargate Route)
- **Volume Limit**: $\le 62,500\text{ m}^3$
- **Base Fee**: $20,000,000\text{ ISK}$
- **Dangerous Jump Rate**: $4,500,000\text{ ISK per jump}$
- **High-Sec Jump Rate**: $1,500,000\text{ ISK per jump}$
- **Max Collateral**: $5,000,000,000\text{ ISK}$ ($> 5\text{B}$ redirects to **Risako Hirano**)

$$\text{Reward} = 20,000,000 + (\text{Dangerous Jumps} \times 4,500,000) + (\text{High-Sec Jumps} \times 1,500,000) + \text{Collateral Premium}$$

*Strategic Note*: Major competitors (PushX, Black Frog) do not offer subcapital dangerous space hauling, forcing customers with $12,501\text{--}62,500\text{ m}^3$ into expensive Jump Freighter minimums ($300\text{M}\text{--}1.2\text{B}+\text{ ISK}$). Our Scouted DST service captures $100\%$ of this high-margin market.

---

### C. Jump Freighter Standard (Cyno Navigation)
- **Hull Classes**: Ark, Rhea, Anshar, Nomad.
- **Volume Limit**: $\le 360,000\text{ m}^3$ (or any volume when "Force Jump Freighter" is active)
- **Base Fee**: $160,000,000\text{ ISK}$
- **Cyno Jump Rate**: $40,000,000\text{ ISK per jump}$
- **Max Collateral**: $50,000,000,000\text{ ISK}$ ($> 50\text{B}$ redirects to **Executive Review**)

$$\text{Reward} = 160,000,000 + (\text{Cyno Jumps} \times 40,000,000) + \text{Collateral Premium}$$

---

## 3. Operational Modifiers & System Avoidance

### Route Safety Preferences
- **Default Routing**: Automated route calculations default to **Shortest Route** (`pref=shortest` / `flag=shortest`) to minimise jump counts while enforcing corporate mandatory system avoidance.
- **Safe Route (Prefer Highsec)**: Prioritises High-Sec travel (0.5+ security) and bypasses dangerous Low-Sec/Null-Sec stargates whenever a viable empire connection exists (`pref=safest` / `flag=secure`).
- **Freighter Safety Lock**: Any cargo volume exceeding Jump Freighter limits ($> 360,000\text{ m}^3$) automatically locks the routing engine into **Safe Route (Prefer Highsec)** (`safe_route` checked and disabled). Standard Freighters lack jump drives and cannot safely navigate dangerous lowsec/nullsec stargates.

### Mandatory Avoidance Systems
By corporate directive, all automated routing calculations enforce avoidance of critical choke points and hazard systems:
- `Zarzakh`
- `Ahbazon`
- `Rancer`
- `Hagilur`
- `Siseide`
- `Tama`
- `Aunenen`

### Thera Wormhole Routing (Blockade Runners)
- **Blockade Runners ($\le 12,500\text{ m}^3$)**: May utilize active Thera wormhole shortcuts when fewer total jumps exist than stargate direct paths.
- **Bulk & Heavy Transport ($> 12,500\text{ m}^3$)**: Deep Space Transports, Freighters, and Jump Freighters strictly adhere to permanent stargates (`routes.direct`) due to mass limits, wormhole collapse hazards, and cyno mechanics.

---

## 4. Market Competitive Benchmarking

| Service Scenario | Vagrant Logistics | PushX | Black Frog / DSHX | Market Position |
|---|---|---|---|---|
| **BR High-Sec** (10k m³, 10J, 500M) | **15.0M ISK** | 16.5M ISK | ~20.0M ISK | Undercuts market standard for rapid subcap hauls ($-9\%$) |
| **DST High-Sec** (50k m³, 10J, 2B) | **27.0M ISK** | ~33.0M ISK | ~40.0M ISK | Aggressive bulk pricing via DST efficiency ($-18\%$) |
| **Freighter High-Sec** (500k m³, 10J, 1B) | **17.5M ISK** | 24.75M ISK | ~30.0M ISK | High volume leader for hub-to-hub freight ($-29\%$) |
| **BR Low-Sec** (10k m³, 10J Dangerous, 500M) | **28.0M ISK** | ~37.5M–45.0M ISK | ~50.0M ISK | **$-25\%\text{ to } -38\%$ vs PushX** |
| **DST Low-Sec Gate Pipe** (55k m³, 1 HS, 4 LS, 2.5B) | **47.0M ISK** | 300.0M (Forced JF) | 84.0M (DSHX) | **Dominates subcap void ($-84\%$ vs PushX, $-44\%$ vs DSHX)** |
| **DST High-Value Sprint** (40k m³, 2 HS, 4 LS, 5.0B) | **66.0M ISK** | 300.0M (Forced JF) | 136.0M (DSHX) | **$-78\%$ vs PushX, $-51\%$ vs DSHX (accepted up to 5B)** |
| **DST Standard 10J Dangerous** (50k m³, 10 LS, 2.0B) | **71.0M ISK** | 1,200.0M (Forced JF) | 86.0M (DSHX) | **$-94\%$ vs PushX, $-17\%$ vs DSHX** |
| **JF Short Lowsec Hop** (320k m³, 1 Cyno Hop, 10B) | **240.0M ISK** | 350.0M ISK | 320.0M (BF) | **$-31\%$ vs PushX, $-25\%$ vs Black Frog** |
| **JF Deep NPC Null Run** (300k m³, 3 Cyno Hops, 15B) | **370.0M ISK** | 600.0M ISK | 480.0M (BF) / 520M (DSHX) | **$-38\%$ vs PushX, $-23\%$ vs Black Frog** |
| **JF High-Collateral Sov Keepstar** (340k m³, 4 Hops, 30B) | **500.0M ISK** | 950.0M ISK | 820.0M (BF) / Rejected (DSHX) | **$-47\%$ vs PushX, $-39\%$ vs Black Frog** |

---

## 5. Operational Governance & SLA Terms for Dangerous Space

- **Time to Accept**: **7 Days** (allows haulers to monitor intelligence channels, avoid gate camps, and wait out hostile fleet spikes safely).
- **Time to Complete**: **3 Days** for Low-Sec stargate runs; **7 Days** for deep Null-Sec or multi-cyno routes.
- **Structure & Docking Terms**: Deliveries to player-owned Upwell structures require verified corporate Access Control List (ACL) docking permissions. Revoked access or unanchoring structures relieve contractor liability.
