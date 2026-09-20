import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const styleCssPath = path.resolve(__dirname, "../style.css");
const styleCss = fs.readFileSync(styleCssPath, "utf-8");

test("typography: brand fonts Cinzel and EveSansNeue remain registered and assigned", () => {
	assert.match(
		styleCss,
		/--font-heading:\s*["']Cinzel["']/,
		"Brand heading font Cinzel must remain registered in --font-heading",
	);
	assert.match(
		styleCss,
		/--font-body:\s*["']EveSansNeue["']/,
		"Brand body font EveSansNeue must remain registered in --font-body",
	);
});

test("typography: minimum font size floor is at least 0.8125rem (13px)", () => {
	// Match font-size declarations like: font-size: 0.75rem; or font-size: 11px;
	const fontSizeRegex = /font-size:\s*([0-9.]+)(rem|px)/g;
	let match = fontSizeRegex.exec(styleCss);
	const violations = [];

	while (match !== null) {
		const val = Number.parseFloat(match[1]);
		const unit = match[2];
		if (unit === "rem" && val < 0.8125) {
			violations.push(`${match[0]} (< 0.8125rem)`);
		} else if (unit === "px" && val < 13) {
			violations.push(`${match[0]} (< 13px)`);
		}
		match = fontSizeRegex.exec(styleCss);
	}

	assert.deepEqual(
		violations,
		[],
		`All explicit font-size rules must be >= 0.8125rem (13px). Violations: ${violations.join(", ")}`,
	);
});

test("typography: header subtitle h2 clamp never drops below 0.8125rem", () => {
	// Match clamp declarations on h2
	const clampMatches = styleCss.match(/clamp\(\s*([0-9.]+)(rem|px)[^)]+\)/g) || [];
	const h2ClampMinViolations = [];

	for (const clamp of clampMatches) {
		const minMatch = clamp.match(/clamp\(\s*([0-9.]+)(rem|px)/);
		if (minMatch) {
			const val = Number.parseFloat(minMatch[1]);
			const unit = minMatch[2];
			if (unit === "rem" && val < 0.8125) {
				h2ClampMinViolations.push(clamp);
			} else if (unit === "px" && val < 13) {
				h2ClampMinViolations.push(clamp);
			}
		}
	}

	assert.deepEqual(
		h2ClampMinViolations,
		[],
		`Clamp minimum font-size rules must never drop below 0.8125rem (13px). Violations: ${h2ClampMinViolations.join(", ")}`,
	);
});

test("a11y: target size for manual jump toggle satisfies WCAG 2.5.8 (>= 24px)", () => {
	assert.match(
		styleCss,
		/\.btn-manual-toggle\s*\{[^}]*min-height:\s*(2[4-9]|[3-9][0-9])px/s,
		".btn-manual-toggle must specify min-height >= 24px for WCAG 2.5.8 target size",
	);
});

test("a11y: content text avoids opacity dilution", () => {
	// Check that legal-footer, input-hint, footer, and fee-breakdown placeholder do not use diluted opacity (0.45 or 0.5)
	assert.doesNotMatch(
		styleCss,
		/\.legal-footer\s+small\s*\{[^}]*opacity:\s*0\.[1-5]/s,
		".legal-footer small must not dilute text contrast with low opacity",
	);
	assert.doesNotMatch(
		styleCss,
		/\.input-hint\s*\{[^}]*opacity:\s*0\.[1-7]/s,
		".input-hint must not dilute text contrast with opacity < 0.8",
	);
	assert.doesNotMatch(
		styleCss,
		/\.fee-breakdown\.placeholder-active\s*\{[^}]*opacity:\s*0\.[1-5]/s,
		".fee-breakdown.placeholder-active must not dilute text contrast with low opacity",
	);
});
