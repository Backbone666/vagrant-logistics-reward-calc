# Vagrant Logistics — Courier Reward Calculator

A high-performance, web-based courier contract reward calculator engineered for EVE Online's **Vagrant Logistics** corporation and **The Charter** alliance. Designed with an Amarr Empire aesthetic (Gold, Burgundy, Onyx) featuring glassmorphism, responsive 1080p layout, and real-time quotation math.

Live deployment: [https://vglgi.backb0ne.cloud](https://vglgi.backb0ne.cloud)

---

## 1. Architectural Overview

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

- **`index.html`**: Semantic document structure, W3C ARIA combobox patterns for solar system search, tabular layout, and Open Graph metadata.
- **`style.css`**: Design tokens, Amarr Imperial palette, glassmorphism card surfaces, fluid typography, tabular numeric figures (`tabular-nums`), and reduced-motion queries.
- **`calculator.js`**: Pure mathematical calculation engine and contract tier classifier (`calcReward`, `calcRewardDetails`, `classifyService`, `parseNum`). Independent of the DOM.
- **`app.js`**: Presentation controller, input event normalization, debounced route calculations, bidirectional URL state synchronization (`?from=&to=&v=...`), and clipboard integrations.
- **`route-service.js`**: Resilient multi-tier routing pipeline:
  - *Tier 1*: Direct query to primary route provider (`eve-route.vercel.app`).
  - *Tier 2*: Sequential failover through a pool of public CORS gateways (`allorigins.win`, `corsproxy.io`, `codetabs.com`) with short per-gateway timeouts.
  - *Tier 3*: Direct CCP ESI route calculation (`esi.evetech.net/latest/route/`) with native browser CORS and synchronous $O(1)$ jump security classification using `data/highsec-systems.json`.
- **`system-autocomplete.js`**: Zero-latency in-memory prefix and substring search across all New Eden solar systems with keyboard navigation (`ArrowUp`/`ArrowDown`/`Enter`/`Escape`).
- **`rate_card_config.json`**: Authoritative pricing configuration defining base rates, jump fees, collateral multipliers, and mandatory system avoidance lists.
- **`data/systems.json`**: Compiled dictionary of 8,400+ New Eden solar systems for instant client-side autocomplete.
- **`data/highsec-systems.json`**: Compact integer set (~1,240 systems, ~11 KB) of High-Sec solar system IDs (`security >= 0.45`) for hot-path jump security classification without async node queries.
- **`scripts/build-systems-data.mjs`**: Utility script to fetch and compile system names from CCP ESI universe endpoints into `data/systems.json`.
- **`scripts/build-highsec-data.mjs`**: Utility script to scan and compile High-Sec system IDs from CCP ESI into `data/highsec-systems.json`.
- **`dev.js`**: Minimal local Node.js development HTTP server with static file serving, binary streaming, and transparent CORS handling.

---

## 2. Local Development & Operational Tooling

### Prerequisites

- **Node.js**: `>= 20.0.0`
- **npm**: Included with Node.js

### Commands

| Purpose | Command | Description |
|---|---|---|
| **Local Dev Server** | `npm run dev` | Serves the project locally at `http://localhost:3000`. |
| **Verification Gate** | `npm run check` | Primary compound check: runs Biome linting followed by Node test suite. |
| **Unit Tests** | `npm test` | Runs Node.js native test runner across all unit tests in `test/`. |
| **Test Coverage** | `npm run test:coverage` | Generates terminal coverage summary via Node's experimental coverage reporter. |
| **Lint Check** | `npm run lint` | Runs Biome linter across JavaScript, JSON, and CSS. |
| **Lint & Autofix** | `npm run lint:fix` | Automatically applies safe linting fixes. |
| **Format Code** | `npm run format` | Enforces formatting across the codebase using Biome. |
| **Build Highsec Data** | `npm run build:highsec` | Scans CCP ESI universe systems and regenerates `data/highsec-systems.json`. |

---

## 3. Solo Developer Deployment & Release Cycle

- **Hosting & Deployment**: The site is hosted on GitHub Pages and served directly from the `gh-pages` branch.
- **No Build Artifacts**: The codebase is production-ready as static files; no bundler (Vite, Webpack) is required.
- **Release Automation**: This repository utilizes `googleapis/release-please-action` on the `gh-pages` branch.
  - All commits must follow the **Conventional Commits** specification (`feat:`, `fix:`, `perf:`, `chore:`, `docs:`, `ci:`).
  - Merging release pull requests automatically bumps `package.json`, updates `CHANGELOG.md`, and creates a GitHub Release tag.
- **Lockfile Synchronization**: Any modification to `package.json` must be paired with `npm install --package-lock-only` to keep `package-lock.json` synchronized.
- **Invariant Protection**: Root assets (`CNAME`, `robots.txt`, `sitemap.xml`, `llms.txt`) are protected invariants and must never be deleted or truncated.