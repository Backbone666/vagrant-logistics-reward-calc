import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
	filterServicedSystems,
	verifyServicedSystemsIntegrity,
} from "../scripts/build-systems-data.mjs";
import {
	attachSystemAutocomplete,
	buildCanonicalSystemMap,
	findMatchingSystems,
	getCanonicalSystemMap,
	isKnownSystem,
	loadSystemsData,
	resolveSelectedSystemOnEnter,
} from "../system-autocomplete.js";

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

test("isKnownSystem: returns true for exact matches (case-insensitive) and false for substrings", () => {
	assert.equal(isKnownSystem("Jita", SAMPLE_SYSTEMS), true);
	assert.equal(isKnownSystem("jita", SAMPLE_SYSTEMS), true);
	assert.equal(isKnownSystem("JITA", SAMPLE_SYSTEMS), true);
	assert.equal(isKnownSystem("  Amarr  ", SAMPLE_SYSTEMS), true);
	assert.equal(isKnownSystem("1DQ1-A", SAMPLE_SYSTEMS), true);
	assert.equal(isKnownSystem("1dq1-a", SAMPLE_SYSTEMS), true);

	// Partial substrings must return false
	assert.equal(isKnownSystem("Jit", SAMPLE_SYSTEMS), false);
	assert.equal(isKnownSystem("Ama", SAMPLE_SYSTEMS), false);
	assert.equal(isKnownSystem("", SAMPLE_SYSTEMS), false);
	assert.equal(isKnownSystem("   ", SAMPLE_SYSTEMS), false);
	assert.equal(isKnownSystem(null, SAMPLE_SYSTEMS), false);
	assert.equal(isKnownSystem(undefined, SAMPLE_SYSTEMS), false);
	assert.equal(isKnownSystem("Jita", []), false);
	assert.equal(isKnownSystem("Jita", null), false);
});

class MockElement {
	constructor(tag, id = "") {
		this.tagName = tag.toUpperCase();
		this.id = id;
		this.value = "";
		this._innerHTML = "";
		this.children = [];
		this.attrs = new Map();
		this.classes = new Set();
		this.listeners = new Map();
	}
	get innerHTML() {
		return this._innerHTML;
	}
	set innerHTML(val) {
		this._innerHTML = val;
		if (val === "") {
			this.children = [];
		}
	}
	get className() {
		return Array.from(this.classes).join(" ");
	}
	set className(val) {
		this.classes.clear();
		for (const c of val.split(" ").filter(Boolean)) {
			this.classes.add(c);
		}
	}
	get classList() {
		return {
			add: (...cls) => {
				for (const c of cls) this.classes.add(c);
			},
			remove: (...cls) => {
				for (const c of cls) this.classes.delete(c);
			},
			contains: (c) => this.classes.has(c),
			toggle: (c, force) => {
				if (force !== undefined) {
					if (force) this.classes.add(c);
					else this.classes.delete(c);
				} else if (this.classes.has(c)) {
					this.classes.delete(c);
				} else {
					this.classes.add(c);
				}
			},
		};
	}
	setAttribute(name, val) {
		this.attrs.set(name, String(val));
	}
	getAttribute(name) {
		return this.attrs.get(name) || null;
	}
	removeAttribute(name) {
		this.attrs.delete(name);
	}
	addEventListener(type, cb) {
		if (!this.listeners.has(type)) this.listeners.set(type, []);
		this.listeners.get(type).push(cb);
	}
	dispatchEvent(event) {
		const cbs = this.listeners.get(event.type) || [];
		for (const cb of cbs) {
			cb(event);
		}
		return true;
	}
	appendChild(child) {
		this.children.push(child);
	}
	querySelectorAll(selector) {
		if (selector === ".system-option") {
			return this.children.filter((c) => c.classes.has("system-option"));
		}
		return [];
	}
	scrollIntoView() {}
}

test("attachSystemAutocomplete: clicking option closes dropdown without re-opening and triggers onSelect", async () => {
	const prevDoc = globalThis.document;
	globalThis.document = {
		createElement: (tag) => new MockElement(tag),
	};

	try {
		const inputEl = new MockElement("input", "test-origin");
		const listEl = new MockElement("ul", "test-origin-list");
		listEl.classList.add("hidden");

		let selectedSystem = null;
		attachSystemAutocomplete(inputEl, listEl, {
			loadData: async () => SAMPLE_SYSTEMS,
			onSelect: (name) => {
				selectedSystem = name;
			},
		});

		// 1. User types "Jit"
		inputEl.value = "Jit";
		inputEl.dispatchEvent(new Event("input"));
		await new Promise((r) => setTimeout(r, 10));

		// Dropdown should be open with Jita
		assert.equal(listEl.classList.contains("hidden"), false);
		assert.equal(inputEl.getAttribute("aria-expanded"), "true");
		assert.equal(listEl.children.length, 1);
		assert.equal(listEl.children[0].textContent, "Jita");

		// 2. User clicks the option
		const option = listEl.children[0];
		let defaultPrevented = false;
		option.dispatchEvent({
			type: "mousedown",
			preventDefault: () => {
				defaultPrevented = true;
			},
		});
		await new Promise((r) => setTimeout(r, 10));

		// Verify option was selected
		assert.equal(defaultPrevented, true);
		assert.equal(inputEl.value, "Jita");
		assert.equal(selectedSystem, "Jita");

		// Crucial verification: dropdown is closed, hidden, and did NOT re-open
		assert.equal(listEl.classList.contains("hidden"), true);
		assert.equal(inputEl.getAttribute("aria-expanded"), "false");
		assert.equal(listEl.children.length, 0);
	} finally {
		globalThis.document = prevDoc;
	}
});

test("attachSystemAutocomplete: keyboard ArrowDown and Enter selects option and keeps dropdown dismissed", async () => {
	const prevDoc = globalThis.document;
	globalThis.document = {
		createElement: (tag) => new MockElement(tag),
	};

	try {
		const inputEl = new MockElement("input", "test-dest");
		const listEl = new MockElement("ul", "test-dest-list");
		listEl.classList.add("hidden");

		let selectedSystem = null;
		attachSystemAutocomplete(inputEl, listEl, {
			loadData: async () => SAMPLE_SYSTEMS,
			onSelect: (name) => {
				selectedSystem = name;
			},
		});

		// 1. User types "Ama"
		inputEl.value = "Ama";
		inputEl.dispatchEvent(new Event("input"));
		await new Promise((r) => setTimeout(r, 10));

		assert.equal(listEl.classList.contains("hidden"), false);
		assert.ok(listEl.children.length >= 2); // Amamake, Amarr, Samas

		// 2. ArrowDown to first option
		inputEl.dispatchEvent({
			type: "keydown",
			key: "ArrowDown",
			preventDefault: () => {},
		});
		assert.equal(listEl.children[0].classes.has("active"), true);

		// 3. ArrowDown to second option ("Amarr")
		inputEl.dispatchEvent({
			type: "keydown",
			key: "ArrowDown",
			preventDefault: () => {},
		});
		assert.equal(listEl.children[1].classes.has("active"), true);

		// 4. Press Enter
		inputEl.dispatchEvent({
			type: "keydown",
			key: "Enter",
			preventDefault: () => {},
		});
		await new Promise((r) => setTimeout(r, 10));

		// Verify selection and dismissal
		assert.equal(inputEl.value, "Amarr");
		assert.equal(selectedSystem, "Amarr");
		assert.equal(listEl.classList.contains("hidden"), true);
		assert.equal(inputEl.getAttribute("aria-expanded"), "false");
	} finally {
		globalThis.document = prevDoc;
	}
});

test("attachSystemAutocomplete: pressing Enter with activeIndex === -1 selects exact match and dismisses dropdown", async () => {
	const prevDoc = globalThis.document;
	globalThis.document = {
		createElement: (tag) => new MockElement(tag),
	};

	try {
		const inputEl = new MockElement("input", "test-exact");
		const listEl = new MockElement("ul", "test-exact-list");
		listEl.classList.add("hidden");

		let selectedSystem = null;
		attachSystemAutocomplete(inputEl, listEl, {
			loadData: async () => SAMPLE_SYSTEMS,
			onSelect: (name) => {
				selectedSystem = name;
			},
		});

		// User types lowercase "jita"
		inputEl.value = "jita";
		inputEl.dispatchEvent(new Event("input"));
		await new Promise((r) => setTimeout(r, 10));

		assert.equal(listEl.classList.contains("hidden"), false);

		// Press Enter without ArrowDown
		let defaultPrevented = false;
		inputEl.dispatchEvent({
			type: "keydown",
			key: "Enter",
			preventDefault: () => {
				defaultPrevented = true;
			},
		});
		await new Promise((r) => setTimeout(r, 10));

		assert.equal(defaultPrevented, true);
		assert.equal(inputEl.value, "Jita");
		assert.equal(selectedSystem, "Jita");
		assert.equal(listEl.classList.contains("hidden"), true);
		assert.equal(inputEl.getAttribute("aria-expanded"), "false");
	} finally {
		globalThis.document = prevDoc;
	}
});

test("attachSystemAutocomplete: pressing Enter with partial match dismisses dropdown without selection", async () => {
	const prevDoc = globalThis.document;
	globalThis.document = {
		createElement: (tag) => new MockElement(tag),
	};

	try {
		const inputEl = new MockElement("input", "test-partial");
		const listEl = new MockElement("ul", "test-partial-list");
		listEl.classList.add("hidden");

		let selectedSystem = null;
		attachSystemAutocomplete(inputEl, listEl, {
			loadData: async () => SAMPLE_SYSTEMS,
			onSelect: (name) => {
				selectedSystem = name;
			},
		});

		// User types partial "Jit"
		inputEl.value = "Jit";
		inputEl.dispatchEvent(new Event("input"));
		await new Promise((r) => setTimeout(r, 10));

		assert.equal(listEl.classList.contains("hidden"), false);

		// Press Enter without ArrowDown
		let defaultPrevented = false;
		inputEl.dispatchEvent({
			type: "keydown",
			key: "Enter",
			preventDefault: () => {
				defaultPrevented = true;
			},
		});
		await new Promise((r) => setTimeout(r, 10));

		assert.equal(defaultPrevented, false);
		assert.equal(inputEl.value, "Jit");
		assert.equal(selectedSystem, null);
		assert.equal(listEl.classList.contains("hidden"), true);
		assert.equal(inputEl.getAttribute("aria-expanded"), "false");
	} finally {
		globalThis.document = prevDoc;
	}
});

test("buildCanonicalSystemMap: builds lowercased-to-canonical mapping", () => {
	const systems = ["Jita", "Amarr", "1DQ1-A"];
	const map = buildCanonicalSystemMap(systems);
	assert.equal(map.get("jita"), "Jita");
	assert.equal(map.get("amarr"), "Amarr");
	assert.equal(map.get("1dq1-a"), "1DQ1-A");
});

test("isKnownSystem: supports Set and Map instances for O(1) synchronous lookup", () => {
	const systemSet = new Set(["jita", "amarr", "1dq1-a"]);
	const systemMap = new Map([
		["jita", "Jita"],
		["amarr", "Amarr"],
	]);
	assert.equal(isKnownSystem("Jita", systemSet), true);
	assert.equal(isKnownSystem("amarr", systemSet), true);
	assert.equal(isKnownSystem("Rens", systemSet), false);
	assert.equal(isKnownSystem("Jita", systemMap), true);
	assert.equal(isKnownSystem("Rens", systemMap), false);
});

test("isKnownSystem: utilizes cachedCanonicalMap when called without second argument", async () => {
	const originalFetch = globalThis.fetch;
	globalThis.fetch = async () => ({
		ok: true,
		json: async () => ["Jita", "Amarr", "1DQ1-A"],
	});
	try {
		await loadSystemsData();
		assert.ok(getCanonicalSystemMap() instanceof Map);
		assert.equal(isKnownSystem("Jita"), true);
		assert.equal(isKnownSystem("jita"), true);
		assert.equal(isKnownSystem("Rens"), false);
	} finally {
		globalThis.fetch = originalFetch;
	}
});

test("resolveSelectedSystemOnEnter: resolves activeIndex selection or exact typed match", () => {
	const matches = ["Jita", "Amarr", "Dodixie"];
	assert.equal(resolveSelectedSystemOnEnter(matches, 1, "anything"), "Amarr");
	assert.equal(resolveSelectedSystemOnEnter(matches, -1, "amarr"), "Amarr");
	assert.equal(resolveSelectedSystemOnEnter(matches, -1, "jit"), null);
	assert.equal(resolveSelectedSystemOnEnter([], -1, "jita"), null);
});

test("isKnownSystem: handles whitespace, empty strings, and non-string inputs cleanly", () => {
	assert.equal(isKnownSystem("   "), false);
	assert.equal(isKnownSystem(null), false);
	assert.equal(isKnownSystem(12345), false);
});

test("filterServicedSystems: accurately filters systems by security status and region membership", () => {
	const provCatchSet = new Set([30003715, 30001201]); // KBP7-G, GE-8JV
	const mockSystems = [
		{ system_id: 30000142, name: "Jita", security_status: 0.94 }, // Highsec
		{ system_id: 30002813, name: "Tama", security_status: 0.28 }, // Lowsec
		{ system_id: 30003715, name: "KBP7-G", security_status: -0.2 }, // Providence (serviced nullsec)
		{ system_id: 30001201, name: "GE-8JV", security_status: -0.1 }, // Catch (serviced nullsec)
		{ system_id: 30004759, name: "1DQ1-A", security_status: -0.5 }, // Delve (unserviced nullsec)
		{ system_id: 30100000, name: "Zarzakh", security_status: -1.0 }, // Yasna Zakh (unserviced)
		null, // Graceful null handling
		{ system_id: 99999999, name: "Corrupted" }, // Missing security status
	];

	const filtered = filterServicedSystems(mockSystems, provCatchSet);
	const names = filtered.map((s) => s.name);

	assert.deepEqual(names, ["Jita", "Tama", "KBP7-G", "GE-8JV"]);
});

test("verifyServicedSystemsIntegrity: validates anchor membership and size bounds", () => {
	const validSample = [
		"Jita",
		"Amarr",
		"Tama",
		"Rancer",
		"KBP7-G",
		"GE-8JV",
		...Array(2119).fill("DummySystem"),
	];
	assert.equal(verifyServicedSystemsIntegrity(validSample), true);

	// Missing anchor throws
	assert.throws(
		() => verifyServicedSystemsIntegrity(["Amarr", "Tama", ...Array(2120).fill("Dummy")]),
		/missing/,
	);

	// Forbidden unserviced system throws
	assert.throws(
		() =>
			verifyServicedSystemsIntegrity([
				"Jita",
				"Amarr",
				"Tama",
				"Rancer",
				"KBP7-G",
				"GE-8JV",
				"1DQ1-A",
				...Array(2118).fill("Dummy"),
			]),
		/unserviced system/,
	);
});

test("dataset: data/systems.json restricts nullsec systems strictly to Providence and Catch", () => {
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = path.dirname(__filename);
	const systemsPath = path.resolve(__dirname, "..", "data", "systems.json");
	const systems = JSON.parse(fs.readFileSync(systemsPath, "utf8"));

	assert.ok(Array.isArray(systems));
	assert.ok(
		systems.length >= 2100 && systems.length <= 2200,
		`Expected ~2,125 systems, got ${systems.length}`,
	);

	// Highsec & Lowsec
	assert.ok(systems.includes("Jita"), "Must include Jita");
	assert.ok(systems.includes("Amarr"), "Must include Amarr");
	assert.ok(systems.includes("Tama"), "Must include Tama");
	assert.ok(systems.includes("Rancer"), "Must include Rancer");

	// Serviced Nullsec (Providence & Catch)
	assert.ok(systems.includes("KBP7-G"), "Must include Providence system KBP7-G");
	assert.ok(systems.includes("F-YH5B"), "Must include Providence system F-YH5B");
	assert.ok(systems.includes("GE-8JV"), "Must include Catch system GE-8JV");
	assert.ok(systems.includes("V-3YG7"), "Must include Catch system V-3YG7");

	// Unserviced Nullsec
	assert.equal(systems.includes("1DQ1-A"), false, "Must exclude Delve system 1DQ1-A");
	assert.equal(systems.includes("O-OPOX"), false, "Must exclude Fountain system O-OPOX");
	assert.equal(systems.includes("R-ARKN"), false, "Must exclude Tribute system R-ARKN");
	assert.equal(systems.includes("B-R5RB"), false, "Must exclude Immensea system B-R5RB");
	assert.equal(systems.includes("Zarzakh"), false, "Must exclude Zarzakh");
});
