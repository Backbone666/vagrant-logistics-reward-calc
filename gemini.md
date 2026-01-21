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
  - **Strategy Shift**: Aggressively priced **Deep Space Transport (DST)** services (1M Base/Jump) to undercut all major competitors and dominate this precise market segment.
- **1080p Layout Optimization**: Optimized vertical spacing, padding, and margins to ensure the interface fits perfectly on standard high-definition displays without scrolling.
- **Logic Alignment**: Updated the `calcReward` engine to a clean, table-based approach:
  - **HighSec**: Tiers for Blockade Runner, DST, and Freighter with specific base fees and per-jump rates.
  - **Dangerous Space**: Specialized tiers for Covert Ops, Deep Space Transport, and Jump Freighters.
  - **Risk Premiums**: Implemented a mandatory 1.5% collateral fee for high-value contracts (>1B ISK) to protect contractor profitability.
  - **Competitive Benchmarking**: Ensuring HighSec rates remain attractive for short hauls while properly pricing the massive time/risk investment of Freighter and JF logistics.

---

_Documented by Gemini - 2026-01-21_
