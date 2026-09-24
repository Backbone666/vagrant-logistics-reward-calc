import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appJsPath = path.resolve(__dirname, "../app.js");
const appJs = fs.readFileSync(appJsPath, "utf-8");

test("url-params: syncUrlParams maps safeRoute to sr=1 when enabled and omits when disabled", () => {
	assert.match(
		appJs,
		/sr:\s*options\.safeRoute\s*\?\s*["']1["']\s*:\s*["']["']/,
		"syncUrlParams must serialize sr as '1' when safeRoute is true, and '' when false",
	);
	assert.doesNotMatch(
		appJs,
		/sr:\s*options\.safeRoute\s*===\s*false/,
		"syncUrlParams must not contain inverted 'options.safeRoute === false' logic",
	);
});

test("url-params: buildUrlParamEntries maps and sanitizes parameters cleanly", () => {
	assert.match(
		appJs,
		/export function buildUrlParamEntries\(options\)/,
		"app.js must export buildUrlParamEntries helper",
	);
	assert.match(
		appJs,
		/const strip = \(val\) => \(val \? String\(val\)\.replaceAll\([",'],[",'], [",'][",']\) : [",'][",']\)/,
		"buildUrlParamEntries must use modern replaceAll for comma stripping",
	);
});

test("url-params: initParamsFromUrl deserializes sr=1 to safeRouteCheckbox.checked", () => {
	assert.match(
		appJs,
		/safeRouteCheckbox\.checked\s*=\s*urlParams\.get\(["']sr["']\)\s*===\s*["']1["']/,
		"initParamsFromUrl must check urlParams.get('sr') === '1'",
	);
});

test("url-params: FALLBACK_CONFIG includes routing engine and avoidance systems", () => {
	assert.match(
		appJs,
		/routing:\s*\{[\s\S]*primary_engine:\s*["']eve-route["']/,
		"FALLBACK_CONFIG must define routing configuration with eve-route primary engine",
	);
	assert.match(
		appJs,
		/mandatory_avoid_systems:\s*\[[\s\S]*"Zarzakh"[\s\S]*"Ahbazon"/,
		"FALLBACK_CONFIG must include mandatory_avoid_systems list",
	);
	assert.match(
		appJs,
		/dangerous_collateral_rules:\s*\{[\s\S]*blockade_runner:/,
		"FALLBACK_CONFIG must include dangerous_collateral_rules",
	);
	assert.doesNotMatch(
		appJs,
		/operational_modifiers:\s*\{/,
		"FALLBACK_CONFIG must prune obsolete operational_modifiers",
	);
});
