## 2026-04-13 - [Mobile Numeric Inputs & External Link Affordance]
**Learning:** For utility-heavy tools like calculators, providing the correct virtual keyboard via `inputmode` significantly reduces friction on mobile. Additionally, in specialized communities (like EVE Online), users frequently transition between tools; clearly marking external links with visual icons helps manage context switching expectations.
**Action:** Always check for numeric-only or decimal-only inputs and apply `inputmode`. Use CSS `::after` with SVG data URIs for lightweight, dependency-free external link icons.
