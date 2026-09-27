# Vagrant Logistics — Courier Reward Calculator

A high-performance, web-based courier contract reward calculator engineered for EVE Online's **Vagrant Logistics** corporation and **The Charter** alliance. Designed with an Amarr Empire aesthetic (Gold, Burgundy, Onyx) featuring glassmorphism, responsive 1080p layout, and real-time quotation math.

Live deployment: [https://vglgi.backb0ne.cloud](https://vglgi.backb0ne.cloud)

---

## 1. Capabilities & Routing Logistics

The calculator provides real-time quotation, route discovery, and security classification across all New Eden regions.

### A. Real-Time Multi-Tier Routing Pipeline
- **Primary Engine**: Direct route resolution via official CCP Games ESI (`/latest/route/{origin}/{destination}/`) with native browser CORS. Stargate hops are classified synchronously in $O(1)$ time using an in-memory High-Sec system dataset (`data/highsec-systems.json`).
- **Resilient Fallback**: Sequential failover to external route endpoints (`eve-route.vercel.app`) using a multi-gateway CORS proxy pool (`allorigins.win`, `codetabs.com`).
- **Volume Gating**: Stargate route planning is automatically gated on positive cargo volume entry. If volume is missing or non-positive, routing falls back to standard baseline stargates.

### B. Thera Wormhole Shortcut Routing
- **Automatic Detection**: When calculating routes between distant trade hubs or remote regions, the route engine evaluates known wormhole connections traversing Thera.
- **Cargo-Bound Qualification**: Thera shortcuts are strictly restricted to Blockade Runner cargo hulls ($\le 12,500\text{ m}^3$). Bulk transports (> 12,500 m³) automatically route via direct stargates.
- **Contract Policy Enforcement**: When a Thera shortcut is active, the contract requirements dynamically switch to **1 Day to Accept** and **1 Day to Complete** to ensure deliveries land before wormhole connections collapse.

### C. Safe Route & Choke Point Avoidance
- **Safe Route Toggle**: Active by default. Automatically prioritizes High-Sec security corridors (`pref=safest` / `flag=secure`) while avoiding notorious chokepoints.
- **Default Avoidance Blacklist**: Automatically avoids high-risk gate camps and hazard systems: `Zarzakh`, `Ahbazon`, `Rancer`, `Hagilur`, `Siseide`, `Tama`, and `Aunenen`.
- **Dynamic Lock**: For super-heavy cargo (> 360,000 m³), the Safe Route toggle is automatically locked on to prevent catastrophic freighter routings through dangerous low-sec pockets.

### D. Service Tiers & Pricing Breakdown
- **High-Sec BR / DST** ($\le 62,500\text{ m}^3$): $1,500,000\text{ ISK/jump}$, base minimum $4,500,000\text{ ISK}$.
- **High-Sec Freighter** ($62,500\text{ m}^3 - 1,125,000\text{ m}^3$): $1,750,000\text{ ISK/jump}$, base minimum $10,000,000\text{ ISK}$.
- **Dangerous Space (Low/Null/Pochven)**:
  - *Blockade Runner*: $15,000,000\text{ ISK base} + 2,000,000\text{ ISK/jump} + \text{collateral surcharge}$.
  - *Scouted DST*: $25,000,000\text{ ISK base} + 6,000,000\text{ ISK/jump} + \text{collateral surcharge}$.
  - *Jump Freighter*: $150,000,000\text{ ISK base} + 35,000,000\text{ ISK/jump} + \text{collateral surcharge}$.
- **High-Value Collateral**: Contracts exceeding 10 Billion ISK in High-Sec or 50 Billion ISK for Jump Freighters trigger an interactive redirect to corporate leadership (**Risako Hirano**) for tailored risk underwriting.

---

## 2. Architecture & Design System

The application is built on a **zero-framework, zero-runtime-dependency** paradigm using pure vanilla ES modules, semantic HTML5, and modern CSS. All computations and route lookups execute client-side in the browser.

```
┌─────────────────────────────────────────────────────────────┐
│                         index.html                          │
│     (Accessible Combobox, Responsive Glassmorphism Cards)   │
└──────────────────────────────┬──────────────────────────────┘
                               │
                ┌───────────────┴───────────────┐
                ▼                               ▼
        ┌───────────────┐               ┌───────────────┐
        │    app.js     │◄─────────────►│   style.css   │
        │ (DOM / Events)│               │ (Amarr Theme) │
        └───────┬───────┘               └───────────────┘
                │
       ┌────────┴───────────────────────┬───────────────────────┐
       ▼                                ▼                       ▼
 ┌───────────────┐              ┌───────────────┐       ┌───────────────┐
 │ calculator.js │              │route-service.js       │system-auto... │
 │ (Pricing Math)│              │ (Multi-Tier)  │       │ (Combobox UX) │
 └───────┬───────┘              └───────┬───────┘       └───────┬───────┘
         │                              │                       │
  ┌──────┴──────────────┐       ┌───────┴───────┐       ┌───────┴───────┐
  │rate_card_config.json│       │ highsec.json  │       │ systems.json  │
  └─────────────────────┘       └───────────────┘       └───────────────┘
```

### Module Responsibilities

- **`index.html`**: Semantic document structure, W3C ARIA 1.2 combobox patterns for solar system search, tabular layout, visible AEO FAQ accordion, and Schema.org JSON-LD graph.
- **`style.css`**: Design tokens, Amarr Imperial palette (Gold, Burgundy, Onyx), glassmorphism card surfaces, fluid typography (`Cinzel` headings, `EveSansNeue` body), tabular numeric figures (`tabular-nums`), and reduced-motion queries.
- **`calculator.js`**: Pure mathematical calculation engine and contract tier classifier (`calcReward`, `calcRewardDetails`, `classifyService`, `parseNum`). Independent of the DOM.
- **`app.js`**: Presentation controller, input event normalization, debounced route calculations, bidirectional URL state synchronization (`?from=&to=&v=&c=&sr=&th=`), and clipboard integrations.
- **`route-service.js`**: Resilient multi-tier routing pipeline supporting direct CCP ESI queries, fallback proxy failover, avoidance sanitization, and Thera shortcut parsing.
- **`system-autocomplete.js`**: Zero-latency in-memory prefix and substring search across all New Eden solar systems with keyboard navigation (`ArrowUp`/`ArrowDown`/`Enter`/`Escape`).
- **`config-storage.js`**: LocalStorage caching and cache invalidation wrapper for dynamic rate card configurations.
- **`rate_card_config.json`**: Authoritative pricing configuration defining base rates, jump fees, collateral multipliers, and mandatory system avoidance lists.
- **`data/systems.json`**: Compiled dictionary of 2,125 serviced New Eden solar systems (High-Sec, Low-Sec, Providence, and Catch) for instant client-side autocomplete.
- **`data/highsec-systems.json`**: Compact integer set (~1,240 systems, ~11 KB) of High-Sec solar system IDs (`security >= 0.45`) for hot-path jump security classification without async node queries.
- **`scripts/build-systems-data.mjs`**: Utility script to fetch and compile system names from CCP ESI universe endpoints into `data/systems.json`.
- **`scripts/build-highsec-data.mjs`**: Utility script to scan and compile High-Sec system IDs from CCP ESI into `data/highsec-systems.json`.
- **`dev.js`**: Minimal local Node.js development HTTP server with static file serving, binary streaming, and transparent CORS handling.

---

## 3. How-to Guides: Development & Verification

### Prerequisites

- **Node.js**: `>= 20.0.0` (CI runs on Node.js 22 Active LTS)
- **npm**: Included with Node.js

### Local Development Server

To serve the project locally with static streaming and CORS bypass handling:

```bash
npm run dev
```

The application will be accessible at `http://localhost:3000`.

### Running Verification & Quality Gates

Before committing any change, run the compound verification gate:

```bash
npm run check
```

This executes both Biome linting/formatting checks and the complete Node.js test runner suite.

### Running Automated Tests

```bash
# Run all unit and integration tests
npm test

# Run tests with experimental terminal code coverage report
npm run test:coverage
```

### Formatting & Linting

```bash
# Check code style and lint rules
npm run lint

# Automatically apply safe fixes
npm run lint:fix

# Format files using Biome
npm run format
```

### Regenerating Static Universe Datasets

If CCP Games updates solar system topologies, stargates, or names:

```bash
# Rebuild High-Sec security IDs set
npm run build:highsec

# Rebuild complete New Eden system name dictionary
npm run build:systems
```

---

## 4. Release & Deployment Pipeline

- **Hosting & Deployment**: The site is hosted on GitHub Pages and served directly from the `gh-pages` branch.
- **Zero Build Artifacts**: Production assets run directly in modern browsers without compilation or bundling.
- **Automated Releases**: The repository uses `googleapis/release-please-action` on `gh-pages`.
  - All commits must follow the **Conventional Commits** specification (`feat:`, `fix:`, `perf:`, `chore:`, `ci:`).
  - Merging release pull requests automatically bumps `package.json`, updates `CHANGELOG.md`, and creates a GitHub Release tag.
- **Lockfile Synchronization**: Any modification to `package.json` must be paired with `npm install --package-lock-only` to keep `package-lock.json` synchronized.
- **Invariant Protection**: Root assets (`CNAME`, `robots.txt`, `sitemap.xml`) are protected invariants and must never be deleted or truncated.