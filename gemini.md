# Vagrant Logistics Project Documentation

This document summarizes the development and features of the **Vagrant Logistics - Courier Calculator**, a premium web-based tool for EVE Online haulers.

## Project Vision

To create a "Gold Standard" calculator that reflects the prestigious and professional identity of Vagrant Logistics and The Charter alliance. The interface focuses on high-end aesthetics (Amarr Empire theme) combined with precise, real-time calculation logic.

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
  - **Collateral Adjustment**: Implement graduated tiers (0.3% for 1-3B, 0.5% for 3-5B) for better competitiveness

---

_Documented by Gemini - 2026-01-26_
_URGENT: JF rates require immediate correction - currently 6x higher than fork source_
