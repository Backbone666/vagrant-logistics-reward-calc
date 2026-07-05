# Plan 004: Implement Design Critique and Accessibility Improvements

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise.
>
> **Drift check (run first)**: `git diff --stat e88f1d0..HEAD -- index.html style.css calculator.js`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: plans/001-verification-baseline.md, plans/003-cinzel-typography.md
- **Category**: bug | perf | dx
- **Planned at**: commit `e88f1d0`, 2026-07-04

## Why this matters

The design critique and accessibility reviews identified three priority issues:
1. **Visual Weight Balance**: The reward display value is oversized (`clamp(1.8rem, 8vw, 2.8rem)`), making the screen top-heavy and drawing the eye away from active inputs.
2. **Interaction Affordance**: Volume presets (Freighter, DST, BR) resemble labels rather than interactive buttons, resulting in users missing the auto-fill capability.
3. **Accessibility**: High-risk zone warnings rely exclusively on red color border and text glows, which are invisible to red-green colorblind users.
4. **Information Density**: The results panel is empty and fails to explain the pricing breakdown.
5. **UX Bug**: The clipboard copy button fails silently on invalid states.

Addressing these issues balances the screen visual hierarchy, improves user efficiency, guarantees accessibility compliance, and increases transparency.

## Current state

- The relevant files:
  - `index.html` — Result display and buttons.
  - `style.css` — Preset styles, reward sizing, and high-risk mode classes.
  - `calculator.js` — Core calculation module.

## Commands you will need

| Purpose   | Command                         | Expected on success |
|-----------|---------------------------------|---------------------|
| Run Tests | `npm test`                      | exit 0, all tests pass |
| Lint Check| `npx @biomejs/biome check .`    | exit 0, no errors   |

## Scope

**In scope**:
- `index.html` [MODIFY]
- `style.css` [MODIFY]
- `calculator.js` [MODIFY]
- `test/calculator.test.js` [MODIFY]

**Out of scope**:
- Modifications to core calculation rates.

## Git workflow

- Branch: `advisor/004-design-and-accessibility-improvements`
- Commits: Commit per step; message style: `ux: resolve visual weight, preset affordance, and colorblind alerts`

## Steps

### Step 1: Extract detailed calculation breakdowns

Modify `calculator.js` to export a new helper function `calcRewardDetails()` that returns the breakdown of calculations, leaving `calcReward()` unchanged for compatibility:

```javascript
// calculator.js
export function calcRewardDetails({ volume, jumps, collateral, routeSecurity }) {
  const parsedVolume = parseNum(volume);
  const parsedJumps = parseNum(jumps);
  const parsedCollateral = parseNum(collateral);

  if (parsedCollateral > 5_000_000_000) return { isRedirect: true, redirectTarget: "Risako Hirano" };
  if (parsedVolume <= 0 || parsedJumps <= 0 || parsedCollateral < 0) return { error: true };

  // Calculate base & jump rate based on same logic as calcReward...
  // (Incorporate the tier checks to set baseFee and ratePerJump)
  let baseFee = 0;
  let ratePerJump = 0;
  let riskMultiplier = 1.0;

  if (routeSecurity === "highsec") {
    if (parsedVolume <= 12_500) { baseFee = 3_000_000; ratePerJump = 800_000; }
    else if (parsedVolume <= 62_500) { baseFee = 8_000_000; ratePerJump = 1_200_000; }
    else if (parsedVolume <= 1_125_000) { baseFee = 15_000_000; ratePerJump = 1_800_000; }
  } else if (routeSecurity === "dangerous" || routeSecurity === "high_risk") {
    if (routeSecurity === "high_risk") riskMultiplier = 1.5;
    if (parsedVolume <= 12_500) { baseFee = 10_000_000; ratePerJump = 2_000_000; }
    else if (parsedVolume <= 62_500) { baseFee = 20_000_000; ratePerJump = 5_000_000; }
    else if (parsedVolume <= 360_000) { baseFee = 150_000_000; ratePerJump = 35_000_000; }
  }

  const transportFee = (baseFee + parsedJumps * ratePerJump) * riskMultiplier;
  
  let collateralFee = 0;
  if (parsedCollateral > 1_000_000_000 && parsedCollateral <= 3_000_000_000) {
    collateralFee = parsedCollateral * 0.003;
  } else if (parsedCollateral > 3_000_000_000) {
    collateralFee = parsedCollateral * 0.005;
  }

  const total = Math.max(baseFee, transportFee + collateralFee);

  return {
    isRedirect: false,
    total,
    baseFee,
    distanceFee: parsedJumps * ratePerJump,
    collateralFee,
    riskMultiplier
  };
}
```

Add unit tests for `calcRewardDetails` in `test/calculator.test.js`.

**Verify**: Run `npm test` and check that tests pass.

---

### Step 2: Implement visual weight balance and preset hover styles in style.css

Modify `style.css` to:
1. Decrease `.reward-value` size to `clamp(1.6rem, 6vw, 2.2rem)`.
2. Update `.preset-btn` hover styles to add an active gold border, scale transformation, and standard cursor pointer.
3. Prepend a small `+ ` sign to preset buttons to indicate injection.

```css
/* style.css modifications */
.reward-value {
	font-family: var(--font-display);
	font-size: clamp(1.6rem, 6vw, 2.2rem); /* Reduced weight */
	font-weight: 400;
	color: var(--primary-gold);
	...
}

.preset-btn {
	background: hsla(45, 70%, 55%, 0.08);
	border: 1px solid hsla(45, 70%, 55%, 0.2);
	color: var(--text-secondary);
	padding: 0.6rem 1.2rem;
	font-size: 0.75rem;
	border-radius: 30px;
	cursor: pointer;
	transition: var(--transition-smooth);
	text-transform: uppercase;
	letter-spacing: 0.15em;
	font-weight: 400;
}

.preset-btn::before {
	content: "+ ";
	color: var(--primary-gold);
	font-weight: bold;
}

.preset-btn:hover {
	background: hsla(45, 70%, 55%, 0.15);
	border-color: var(--primary-gold);
	color: white;
	transform: translateY(-2px);
	box-shadow: 0 4px 10px var(--primary-gold-glow);
}
```

**Verify**: Open the site and hover over preset buttons. They must now show a clear pointer, translate upwards by 2px, and display a plus symbol.

---

### Step 3: Implement Fee Breakdown and Colorblind warnings in index.html

Modify `index.html` to add the fee breakdown container and the high-risk text badge:

1. Insert the warning badge and fee breakdown HTML inside the `.reward-display`:
   ```html
   <!-- index.html -->
   <div class="reward-display">
     <div class="reward-label" id="reward-label">Estimated Reward</div>
     <div id="reward_output" class="reward-value" aria-labelledby="reward-label">0 ISK</div>
     
     <!-- Colorblind accessible warning -->
     <div id="high_risk_alert" class="high-risk-alert hidden" role="alert">
       ⚠️ HIGH-RISK ZONE ACTIVE (1.5x surcharge applied)
     </div>

     <div id="reward_ipj_output" class="reward-ipj" aria-label="Reward per Jump">0 ISK/Jump</div>
     
     <!-- Fee Breakdown Table -->
     <div id="fee_breakdown" class="fee-breakdown hidden">
       <div class="breakdown-title">Quote Breakdown</div>
       <div class="breakdown-grid">
         <div class="breakdown-row"><span>Base Transport Fee:</span><span id="bd_base">0 ISK</span></div>
         <div class="breakdown-row"><span>Distance Jumps Fee:</span><span id="bd_distance">0 ISK</span></div>
         <div class="breakdown-row"><span>Collateral Risk Fee:</span><span id="bd_collateral">0 ISK</span></div>
         <div class="breakdown-row highlight"><span>Security Surcharge:</span><span id="bd_security">1.0x</span></div>
       </div>
     </div>
     
     <div class="button-group">
   ```

2. Update `style.css` to add the styles for these elements:
   ```css
   .high-risk-alert {
   	color: #ff4d4d;
   	font-size: 0.8rem;
   	letter-spacing: 0.1em;
   	text-transform: uppercase;
   	font-family: var(--font-display);
   	margin-top: var(--space-xs);
   	border: 1px solid rgba(255, 77, 77, 0.3);
   	background: rgba(255, 77, 77, 0.05);
   	padding: var(--space-xs);
   	border-radius: var(--radius-md);
   	display: inline-block;
   }

   .fee-breakdown {
   	margin-top: var(--space-sm);
   	background: rgba(255, 255, 255, 0.02);
   	border: 1px solid hsla(45, 70%, 55%, 0.1);
   	border-radius: var(--radius-md);
   	padding: var(--space-sm);
   	font-family: var(--font-body);
   	width: 100%;
   	font-size: 0.85rem;
   }

   .breakdown-title {
   	font-family: var(--font-display);
   	color: var(--primary-gold);
   	text-transform: uppercase;
   	letter-spacing: 0.15em;
   	margin-bottom: var(--space-xs);
   	text-align: left;
   	border-bottom: 1px solid hsla(45, 70%, 55%, 0.15);
   	padding-bottom: 4px;
   }

   .breakdown-grid {
   	display: flex;
   	flex-direction: column;
   	gap: 4px;
   }

   .breakdown-row {
   	display: flex;
   	justify-content: space-between;
   	color: var(--text-secondary);
   }

   .breakdown-row.highlight {
   	color: var(--bright-gold);
   	font-weight: bold;
   }

   .hidden {
   	display: none !important;
   }
   ```

---

### Step 4: Wire UI updates in index.html script

Update the `updateAll()` function in `index.html` to update the breakdown elements and handle the copy button states:

1. Import `calcRewardDetails` in the script module header:
   ```javascript
   import { parseNum, calcReward, calcRewardDetails } from "./calculator.js";
   ```
2. Modify `updateAll()` to read details:
   ```javascript
   const details = calcRewardDetails({
     volume: volumeInput.value,
     jumps: jumpsInput.value,
     collateral: collateralInput.value,
     routeSecurity: routeSecuritySelect.value
   });
   
   // High-risk mode alert toggle
   const highRiskAlert = document.getElementById("high_risk_alert");
   if (routeSecuritySelect.value === "high_risk" && !details.error && !details.isRedirect) {
     highRiskAlert.classList.remove("hidden");
   } else {
     highRiskAlert.classList.add("hidden");
   }

   // Breakdown table update
   const feeBreakdown = document.getElementById("fee_breakdown");
   if (details.error || details.isRedirect) {
     feeBreakdown.classList.add("hidden");
     // Disable copy button on error
     copyBtn.disabled = true;
     copyBtn.style.opacity = "0.5";
     copyBtn.style.cursor = "not-allowed";
   } else {
     feeBreakdown.classList.remove("hidden");
     document.getElementById("bd_base").textContent = `${formatNumber(details.baseFee)} ISK`;
     document.getElementById("bd_distance").textContent = `${formatNumber(details.distanceFee)} ISK`;
     document.getElementById("bd_collateral").textContent = `${formatNumber(details.collateralFee)} ISK`;
     document.getElementById("bd_security").textContent = `${details.riskMultiplier}x`;
     
     // Enable copy button
     copyBtn.disabled = false;
     copyBtn.style.opacity = "1";
     copyBtn.style.cursor = "pointer";
   }
   ```

**Verify**: Make sure that entering valid inputs displays the fee breakdown list, selecting High-risk shows the colorblind alert badge, and emptying inputs disables the copy button.

## Test plan

- Run `npm test` to verify `calcRewardDetails` functions.
- Manual test: Input `Volume: 50,000`, `Jumps: 10`, `Collateral: 2B`, `Route Security: High-Risk`.
  - Reward must show: `76,000,000 ISK`.
  - Surcharge alert must display.
  - Breakdown table must list: Base: 20M, Distance: 50M, Collateral Fee: 6M, Surcharge: 1.5x.

## Done criteria

- [ ] Visual weight is balanced, reward value size is smaller.
- [ ] Presets use button-like styling and hover transitions.
- [ ] Warning alert exists and shows on "High-Risk Zone".
- [ ] Quote breakdown panel populates dynamically on valid calculations.
- [ ] Copy button disables itself on invalid states.

## STOP conditions

- If DOM element query selectors fail, check spelling in `index.html` versus script mappings.
