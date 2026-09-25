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

function findFontSizeViolations(cssText, minRem = 0.8125, minPx = 13) {
	const fontSizeRegex = /font-size:\s*([0-9.]+)(rem|px)/g;
	const violations = [];
	let match = fontSizeRegex.exec(cssText);

	while (match !== null) {
		const val = Number.parseFloat(match[1]);
		const unit = match[2];
		if ((unit === "rem" && val < minRem) || (unit === "px" && val < minPx)) {
			violations.push(`${match[0]} (< ${unit === "rem" ? `${minRem}rem` : `${minPx}px`})`);
		}
		match = fontSizeRegex.exec(cssText);
	}

	return violations;
}

test("typography: minimum font size floor is at least 0.8125rem (13px)", () => {
	const violations = findFontSizeViolations(styleCss);
	assert.deepEqual(
		violations,
		[],
		`All explicit font-size rules must be >= 0.8125rem (13px). Violations: ${violations.join(", ")}`,
	);
});

function findClampViolations(cssText, minRem = 0.8125, minPx = 13) {
	const clampMatches = cssText.match(/clamp\(\s*([0-9.]+)(rem|px)[^)]+\)/g) || [];
	const violations = [];

	for (const clamp of clampMatches) {
		const match = clamp.match(/clamp\(\s*([0-9.]+)(rem|px)/);
		if (!match) continue;
		const val = Number.parseFloat(match[1]);
		const unit = match[2];
		if ((unit === "rem" && val < minRem) || (unit === "px" && val < minPx)) {
			violations.push(clamp);
		}
	}

	return violations;
}

test("typography: header subtitle h2 clamp never drops below 0.8125rem", () => {
	const h2ClampMinViolations = findClampViolations(styleCss, 0.8125, 13);
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

test("a11y: skip-link provides visible keyboard focus without outline: none", () => {
	assert.match(
		styleCss,
		/\.skip-link\s*\{[^}]*position:\s*fixed/s,
		".skip-link must declare position: fixed for viewport positioning",
	);
	assert.match(
		styleCss,
		/\.skip-link:(?:focus|focus-visible)\s*\{[^}]*outline:\s*2px\s+solid/s,
		".skip-link:focus must declare a visible 2px solid outline",
	);
	assert.doesNotMatch(
		styleCss,
		/\.skip-link:focus\s*\{[^}]*outline:\s*none/s,
		".skip-link:focus must not suppress focus outline with outline: none",
	);
});

test("a11y: volume preset buttons define aria-pressed attribute and authentic icons", () => {
	const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf-8");
	const presetMatches = html.match(/class="preset-btn"[^>]*aria-pressed="false"/g) || [];
	assert.equal(
		presetMatches.length,
		3,
		"All 3 preset buttons must declare initial aria-pressed='false'",
	);
	const iconMatches =
		html.match(/<svg class="btn-icon\s+icon-(?:freighter|dst|br)"\s+aria-hidden="true"/g) || [];
	assert.equal(
		iconMatches.length,
		3,
		"All 3 preset buttons must embed semantic SVG icons with aria-hidden='true'",
	);
});

test("a11y: #thera_toggle is a semantic button with accessible focus and target size", () => {
	const indexHtmlPath = path.resolve(__dirname, "../index.html");
	const indexHtml = fs.readFileSync(indexHtmlPath, "utf-8");

	// 1. Semantic button in index.html
	assert.match(
		indexHtml,
		/<button\b[^>]*\bid=["']thera_toggle["'][^>]*>/s,
		"#thera_toggle must be a <button>",
	);
	assert.match(
		indexHtml,
		/<button\b[^>]*\bid=["']thera_toggle["'][^>]*>/s,
		'#thera_toggle must declare type="button"',
	);
	assert.match(
		indexHtml,
		/<button\b[^>]*\btype=["']button["'][^>]*\bid=["']thera_toggle["'][^>]*>/s,
		'#thera_toggle must declare type="button"',
	);
	assert.match(
		indexHtml,
		/<button\b[^>]*\bid=["']thera_toggle["'][^>]*\baria-pressed=["']false["'][^>]*>/s,
		"#thera_toggle must initialize with aria-pressed attribute",
	);

	// 2. Minimum target size (WCAG 2.5.8 >= 24px)
	assert.match(
		styleCss,
		/\.btn-thera-toggle[^{]*\{[^}]*min-height:\s*(2[4-9]|[3-9][0-9])px/s,
		".btn-thera-toggle must specify min-height >= 24px for WCAG 2.5.8 target size",
	);

	// 3. Focus-visible indicator defined
	assert.match(
		styleCss,
		/\.btn-thera-toggle:focus-visible[^{]*\{[^}]*box-shadow:/s,
		".btn-thera-toggle:focus-visible must provide clear box-shadow focus indicator",
	);
});

test("seo-aeo: index.html defines valid JSON-LD schema with synchronized FAQPage", () => {
	const indexHtmlPath = path.resolve(__dirname, "../index.html");
	const indexHtml = fs.readFileSync(indexHtmlPath, "utf-8");

	const jsonLdMatch = indexHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/s);
	assert.ok(jsonLdMatch, "index.html must include a JSON-LD script tag");

	let schema;
	assert.doesNotThrow(() => {
		schema = JSON.parse(jsonLdMatch[1]);
	}, "JSON-LD content must parse cleanly without syntax errors");

	assert.equal(schema["@context"], "https://schema.org");
	assert.ok(Array.isArray(schema["@graph"]), "JSON-LD schema must use @graph structure");

	const faqEntity = schema["@graph"].find((item) => item["@type"] === "FAQPage");
	assert.ok(faqEntity, "JSON-LD @graph must contain an FAQPage entity");
	assert.ok(Array.isArray(faqEntity.mainEntity), "FAQPage must define mainEntity array");
	assert.equal(
		faqEntity.mainEntity.length,
		8,
		"FAQPage must contain exactly 8 structured Q&A pairs",
	);

	const theraDurationFaq = faqEntity.mainEntity.find(
		(q) => q.name === "What are the contract duration and expiration requirements?",
	);
	assert.ok(theraDurationFaq, "FAQPage schema must include contract duration requirements");
	assert.match(
		theraDurationFaq.acceptedAnswer.text,
		/1 Day to Accept and 1 Day to Complete/,
		"Accepted answer must state 1-day requirements for Thera contracts",
	);

	const webAppEntity = schema["@graph"].find((item) => item["@type"] === "WebApplication");
	assert.ok(webAppEntity, "JSON-LD @graph must contain a WebApplication entity");
	assert.equal(
		webAppEntity.dateModified,
		"2026-09-25",
		"dateModified must reflect current release date",
	);
});

test("seo-aeo: visible FAQ questions match JSON-LD FAQPage question names", () => {
	const indexHtmlPath = path.resolve(__dirname, "../index.html");
	const indexHtml = fs.readFileSync(indexHtmlPath, "utf-8");

	const jsonLdMatch = indexHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/s);
	const schema = JSON.parse(jsonLdMatch[1]);
	const faqEntity = schema["@graph"].find((item) => item["@type"] === "FAQPage");

	const visibleQuestions = [
		...indexHtml.matchAll(/<summary class="faq-question">([^<]+)<\/summary>/g),
	].map((m) => m[1].trim());

	assert.equal(visibleQuestions.length, 8, "There must be 8 visible FAQ questions in index.html");
	for (const q of faqEntity.mainEntity) {
		assert.ok(
			visibleQuestions.includes(q.name),
			`Visible FAQs must include JSON-LD question: "${q.name}"`,
		);
	}
});
