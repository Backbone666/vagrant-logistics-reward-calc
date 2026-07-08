# Vagrant Logistics Project Documentation

This document summarizes the development and features of the **Vagrant Logistics - Courier Calculator**, a premium web-based tool for EVE Online haulers.

## Project Vision

To create a "Gold Standard" calculator that reflects the prestigious and professional identity of Vagrant Logistics and The Charter alliance. The interface focuses on high-end aesthetics (Amarr Empire theme) combined with precise, real-time calculation logic.

## Design Context

### Users
EVE Online haulers and players associated with "The Charter" alliance and Vagrant Logistics corporation. These users need to quickly and precisely calculate rewards for courier contracts, often while managing complex logistics in-game. The interface must be high-signal, allowing them to calculate quotes for HighSec or Dangerous space with confidence.

### Brand Personality
**Competent, Safe, Trustworthy.**
The brand aims for a "Gold Standard" of professional hauling services. It reflects the prestige of the Amarr Empire and the elite status of its alliance.

### Aesthetic Direction
- **Theme**: Amarr Empire inspired (Gold, Burgundy, Onyx) with glassmorphism (semi-transparent cards, high-blur).
- **Visual Tone**: Luxurious, technical, and precise.
- **Typography**: Strictly 'EveSansNeue' (regular weight) for all text to ensure a unified, professional appearance.
- **Avoid**: "AI-generated", "cheap", or "out-of-the-box" UI patterns. Avoid generic utility calculator looks.
- **Optimized For**: 1080p high-definition displays (lock-to-window layout) and mobile accessibility.

### Design Principles
1. **Competence through Precision**: Deliver real-time, accurate calculations with immediate visual feedback. Never allow ambiguity in the quote.
2. **Trust through Safety**: Clearly communicate all fees, especially collateral risk premiums and dangerous space surcharges, to ensure transparency between the hauler and the customer.
3. **Imperial Prestige**: Maintain the high-end Amarr aesthetic consistently across all components. Gold should be used for highlights and primary branding, while Burgundy and Onyx provide depth and contrast.
4. **Accessible In-Game Utility**: Ensure the interface is usable in typical EVE Online contexts, including low-light environments. Explicitly support users with red-green color blindness by using shape-based indicators or contrast-rich color pairings instead of relying solely on red/green cues.
5. **Zero-Slop Implementation**: No placeholder or "filler" elements. Every pixel should serve a purpose, reflecting the high standards of the corporation.

## Key Features

### 1. Advanced Calculation Engine

- **Live Updates**: All calculations occur instantly as the user types or clicks presets.
- **Dynamic Scaling**: Reward logic scales based on volume (Freighter vs. DST vs. BR/T1) and collateral risk.
- **Dangerous Routes**: A toggle for Low/Nullsec/Dangerous space redirects logic to Jump Freighter rates.
- **Collateral Threshold**: If collateral exceeds **5 Billion ISK**, the calculator redirects the user to **Risako Hirano** for a manual quote.

### 2. Premium Design & Aesthetics

- **Theme**: Amarr Empire inspired (Gold, Burgundy, Onyx) with a deep nebula background.
- **Glassmorphism**: High-blur, semi-transparent cards with subtle gold borders.
- **Typography**: Exclusive use of the **'EveSansNeue'** font in regular weight for a clean, unified look.
- **Micro-animations**: Subtle transitions on inputs, pulse effects on reward updates, and feedback on copy buttons.
- **Responsive Layout**: Designed to fit 100% of the viewport height (lock-to-window) on desktops while remain fully functional on mobile devices.

### 3. Integrated Contract Requirements

- **Contract Details**: Real-time display of "Contract To", "Time to Accept" (3 Days), and "Time to Complete" (3 Days).
- **Clipboard Integration**:
  - "Copy Reward" functionality for standard quotes.
  - "Name Copied!" functionality when redirected to Risako Hirano.
  - Mini-copy buttons for the "Contract To" (Vagrant Logistics) field.

### 4. Alliance Identity

- **Branding**: Inclusion of the Vagrant Logistics corporation logo and "Member of The Charter" alliance footer.

## Project History & Milestones

- **Initial Build**: Core calculator logic with volume presets and number formatting.
- **Aesthetic Overhaul**: Implementation of the glassmorphism design system and nebula background.
- **Font Enforcement**: Removal of external fonts (Inter/Outfit) and strict enforcement of 'EveSansNeue'.
- **Alliance Integration**: Added Charter alliance footer and branding.
- **Contract Logic Expansion**: Added the Contract Details section and the 5B collateral threshold logic.
- **Rate Analysis & Optimization (Jan 2026)**: Conducted comprehensive market research comparing PushX, Red Frog, and current logic. Established a new tiered rate structure documented in `rates.md`.
  - **Strategy Shift**: Aggressively priced **Deep Space Transport (DST)** services (1.5M Base / 850k Jump) to undercut all major competitors and dominate this precise market segment.
  - **Collateral Standardization**: Unified collateral limit to **5 Billion ISK** across all service tiers (including Dangerous/HighSec) to simplify user experience.
- **1080p Layout Optimization**: Optimized vertical spacing, padding, and margins to ensure the interface fits perfectly on standard high-definition displays without scrolling.
- **Logic Alignment**: Updated the `calcReward` engine to a clean, table-based approach:
  - **HighSec**: Inverted pricing model where DST is cheaper than Blockade Runners per jump to incentivize bulk transport.
  - **Dangerous Space**: Smoothed rate curves for Covert Ops (15M Base), DST (25M Base), and Jump Freighters (150M Base).
  - **Risk Premiums**: Implemented a mandatory 1.5% collateral fee for high-value contracts (>1B ISK) to protect contractor profitability.
  - **Competitive Benchmarking**: Ensuring HighSec rates remain attractive for short hauls while properly pricing the massive time/risk investment of Freighter and JF logistics.
- **Dangerous Space Optimization (Jan 23, 2026)**: Smoothed the pricing curve for Low/Nullsec routes to eliminate massive cost "cliffs" between ship classes.
  - Reduced Jump Freighter base fee by 60% and per-jump rate by 65%.
  - Adjusted DST and Covert Ops rates to create a more gradual progression.
  - Maintained profitability through the 1.5% collateral surcharge on high-value contracts.
- **Strategic Rate Overhaul (Jan 26, 2026)**: Complete comparative analysis vs PushX, Red Frog, and Black Frog.
  - **Identified Gap**: Current rates (flat fees) were losing high-collateral contracts to PushX multipliers.
  - **New Strategy**: Documented in `rates.md`. Split services into 4 tiers (BR, DST, Freighter, JF).
  - **Key Move**: Introduced "Shadow Class" DST service in Low/Null at 15M/jump to corner the mid-size dangerous hauling market where competitors force costly JF usage.
- **Low/Null Re-evaluation (Jan 26, 2026 - Update)**: Refined dangerous space philosophy.
  - **Assumption**: Leveraging reduced-risk internal routing.
  - **New DST Rate**: 25M Base + 6M/Jump. This extremely aggressive pricing aims to capture 100% of sub-freighter volume in our operational regions.
  - **New BR Rate**: 15M Base + 2M/Jump.
  - **Removed Branding**: Dropped "Shadow Class" naming for clarity.
- **Fork Source Analysis (Jan 26, 2026 - CRITICAL)**: Analyzed original Haulers Channel calculator that this project was forked from.
  - **Fork Source**: https://kujara.github.io/haulers-channel-reward-calc/ogb.html
  - **Key Finding**: Original uses complex dynamic formula: `((mult * 1M * collateral/1B) + add) * jumps`
  - **Our Improvements**: Removed artificial collateral inflation, removed jump minimum penalty, added distinct BR tier, transparent fixed pricing
  - **CRITICAL ISSUE IDENTIFIED**: JF pricing is severely overpriced compared to both fork source AND market competitors
    - Original JF formula: `(mult * 60M * max(1, jumps/7)) + (collateral * 0.01)`
    - Original 10-jump JF: ~105M ISK
    - Our current 10-jump JF: 675M ISK ❌ **6.4x too expensive**
    - PushX 10-jump JF: 1.2B ISK
    - Black Frog estimate: 300-400M ISK
  - **Recommended Fix**: Reduce JF to 150M Base + 35M/Jump (10 jumps = 500M, competitive with market)
- **Rate Configuration Fetch & Webview Robustness Fix (Jul 8, 2026)**: Addressed a bug causing "Failed to load live rates" warning banner on deployed site.
  - **History API Exception Prevention**: Wrapped `window.history.replaceState` in a `try...catch` block. This prevents security exceptions in sandboxed iframe widgets or EVE Online's in-game browser from interrupting the configuration loading cycle.
  - **Cache-Busted Configuration Requests**: Added cache-buster query parameters (`?t=...`) and `{ cache: "no-cache" }` headers to the `rate_card_config.json` fetch request to bypass stale/broken browser and proxy cache results.
  - **Local Development Compatibility**: Updated the local `dev.js` HTTP server to strip query parameters before file path lookup, enabling full local testing with cache-busting.

---

_Documented by Gemini - 2026-03-13_
_Updated with Design Context from teacher-impeccable session_

## Design Critique (March 2026)

### Anti-Patterns Verdict
**Pass (with caveats).** The interface successfully avoids the "generic SaaS" look by leaning heavily into EVE Online's specific aesthetic (Amarr Empire). However, tells like high-blur glassmorphism and the "Hero Metric" layout for the reward are fingerprints of modern AI-assisted design trends. The removal of redundant layout thrashing and the implementation of fluid typography have significantly elevated the quality above "out-of-the-box" slop.

### Overall Impression
The calculator feels **Competent** and **Imperial**. It effectively communicates prestige through its color palette and custom typography. The biggest opportunity lies in moving from "generic luxurious" to "functionally elite"—specifically by refining the information density and interaction feedback.

### What's Working
- **Aesthetic Consistency**: The Amarr palette (Gold/Burgundy/Onyx) is applied with discipline. Using `EveSansNeue` across the board reinforces the professional brand.
- **Immediate Feedback**: The live-updating reward with the pulse animation creates a high-signal, "living" interface that builds user confidence.
- **Accessibility Integration**: The move to HSL-based secondary colors and `:focus-visible` rings shows a commitment to professional-grade usability without sacrificing the theme.

### Priority Issues

1. **Visual Weight Balance**
   - **What**: The "Estimated Reward" value is visually overwhelming compared to the "Contract Details" section.
   - **Why it matters**: It creates a "top-heavy" feeling that draws the eye away from the input fields where the user is actively working.
   - **Fix**: Slightly reduce the max clamp size of the reward value and increase the prominence of the input group headers.
   - **Command**: `/quieter`

2. **Interaction Affordance on Presets**
   - **What**: Volume presets (Freighter, DST, BR) look like labels rather than primary action buttons.
   - **Why it matters**: Users might not realize they can click them to auto-fill volume, missing a core efficiency feature.
   - **Fix**: Add a subtle gold hover state that is more distinct than the background, and perhaps a small "plus" or "fill" icon pattern.
   - **Command**: `/delight`

3. **Information Density in Results**
   - **What**: The result area has a lot of vertical whitespace on 1080p screens.
   - **Why it matters**: It feels slightly "empty" despite the premium theme, missing an opportunity to show more value (e.g., breakdown of collateral fees).
   - **Fix**: Add a small, toggleable or always-visible "Fee Breakdown" micro-table in the result area.
   - **Command**: `/distill`

### Minor Observations
- The "Mini-copy" buttons in the contract section are functionally great but could use a more "tactile" feel (active states).
- The nebula background is beautiful but could be slightly dimmed to ensure the glass cards "pop" more effectively.

### Questions to Consider
- *What if the "Dangerous Space" toggle changed the entire card's accent color from Gold to a "Warning Red" or "Darker Gold"?*
- *Could we integrate a "Contract Verification" checklist that appears once a reward is calculated?*
- *Is the "Clear" button too prominent? Should it be a secondary action?*
