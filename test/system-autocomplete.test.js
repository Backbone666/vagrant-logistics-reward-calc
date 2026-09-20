import assert from "node:assert/strict";
import test from "node:test";
import { findMatchingSystems } from "../system-autocomplete.js";

const SAMPLE_SYSTEMS = [
	"1DQ1-A",
	"A-8M3Q",
	"Ahbazon",
	"Amamake",
	"Amarr",
	"Aunenen",
	"Dodixie",
	"Hek",
	"Jita",
	"Nourvukaiken",
	"Perimeter",
	"Rancer",
	"Rens",
	"Samas",
	"Tama",
	"Zarzakh",
];

test("findMatchingSystems: returns empty array on empty or invalid query", () => {
	assert.deepEqual(findMatchingSystems("", SAMPLE_SYSTEMS), []);
	assert.deepEqual(findMatchingSystems("   ", SAMPLE_SYSTEMS), []);
	assert.deepEqual(findMatchingSystems(null, SAMPLE_SYSTEMS), []);
	assert.deepEqual(findMatchingSystems("Jita", null), []);
});

test("findMatchingSystems: prioritises prefix matches over substring matches", () => {
	// Searching "ama": "Amamake" and "Amarr" start with "ama", "Samas" contains "ama"
	const results = findMatchingSystems("ama", SAMPLE_SYSTEMS, 5);
	assert.equal(results[0], "Amamake");
	assert.equal(results[1], "Amarr");
	assert.ok(results.includes("Samas"));
	assert.ok(results.indexOf("Amarr") < results.indexOf("Samas"));
});

test("findMatchingSystems: case-insensitive matching", () => {
	const lower = findMatchingSystems("jita", SAMPLE_SYSTEMS);
	const upper = findMatchingSystems("JITA", SAMPLE_SYSTEMS);
	assert.deepEqual(lower, ["Jita"]);
	assert.deepEqual(upper, ["Jita"]);
});

test("findMatchingSystems: respects limit parameter", () => {
	const allA = findMatchingSystems("a", SAMPLE_SYSTEMS, 2);
	assert.equal(allA.length, 2);
});

test("findMatchingSystems: matches nullsec alphanumeric names", () => {
	const matches = findMatchingSystems("1dq", SAMPLE_SYSTEMS);
	assert.deepEqual(matches, ["1DQ1-A"]);
});
