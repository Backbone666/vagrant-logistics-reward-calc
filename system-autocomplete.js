/**
 * System Autocomplete Engine
 * Pure filtering algorithm and accessible W3C combobox controller.
 */

/**
 * Filter and sort matching solar system names.
 * Prioritises prefix matches over substring matches.
 * Case-insensitive.
 *
 * @param {string} query
 * @param {string[]} systems
 * @param {number} [limit=8]
 * @returns {string[]}
 */
export function findMatchingSystems(query, systems, limit = 8) {
	if (!query || typeof query !== "string" || !Array.isArray(systems)) {
		return [];
	}

	const cleanQuery = query.trim().toLowerCase();
	if (!cleanQuery) return [];

	const prefixMatches = [];
	const substringMatches = [];

	for (let i = 0; i < systems.length; i++) {
		const name = systems[i];
		const lower = name.toLowerCase();

		if (lower.startsWith(cleanQuery)) {
			prefixMatches.push(name);
			if (prefixMatches.length >= limit) break;
		} else if (lower.includes(cleanQuery)) {
			substringMatches.push(name);
		}
	}

	const results = prefixMatches;
	if (results.length < limit) {
		for (let i = 0; i < substringMatches.length; i++) {
			results.push(substringMatches[i]);
			if (results.length >= limit) break;
		}
	}

	return results;
}

/**
 * Check if a solar system name exists in the systems dataset (case-insensitive exact match).
 *
 * @param {string} name
 * @param {string[]} systems
 * @returns {boolean}
 */
let cachedSystems = null;
let cachedCanonicalMap = null;
let systemsFetchPromise = null;

export function buildCanonicalSystemMap(systems) {
	if (systems instanceof Map) return systems;
	if (!Array.isArray(systems)) return new Map();
	const map = new Map();
	for (const s of systems) {
		if (typeof s === "string") {
			map.set(s.toLowerCase(), s);
		}
	}
	return map;
}

export function getCanonicalSystemMap() {
	return cachedCanonicalMap;
}

function lookupInCollection(clean, collection) {
	if (collection instanceof Set || collection instanceof Map) {
		return collection.has(clean);
	}
	if (Array.isArray(collection)) {
		return collection.some((s) => typeof s === "string" && s.toLowerCase() === clean);
	}
	return false;
}

function isDefaultCachedSystem(clean) {
	return Boolean(cachedCanonicalMap?.has(clean));
}

export function isKnownSystem(name, systems) {
	if (typeof name !== "string") return false;
	const clean = name.trim().toLowerCase();
	if (!clean) return false;

	return !systems || systems === cachedSystems
		? isDefaultCachedSystem(clean)
		: lookupInCollection(clean, systems);
}

/**
 * Lazily load New Eden systems dataset once.
 *
 * @param {string} [dataUrl="data/systems.json"]
 * @returns {Promise<string[]>}
 */
export async function loadSystemsData(dataUrl = "data/systems.json") {
	if (cachedSystems) return cachedSystems;
	if (systemsFetchPromise) return systemsFetchPromise;

	systemsFetchPromise = (async () => {
		try {
			const res = await fetch(dataUrl);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const data = await res.json();
			cachedSystems = data;
			cachedCanonicalMap = buildCanonicalSystemMap(data);
			return cachedSystems;
		} catch (err) {
			console.warn("Failed to load systems dataset for autocomplete:", err);
			return [];
		} finally {
			systemsFetchPromise = null;
		}
	})();

	return systemsFetchPromise;
}

export function resolveSelectedSystemOnEnter(currentMatches, activeIndex, inputValue) {
	if (!Array.isArray(currentMatches) || currentMatches.length === 0) return null;
	if (activeIndex >= 0 && activeIndex < currentMatches.length) {
		return currentMatches[activeIndex];
	}
	const query = (inputValue || "").trim().toLowerCase();
	return currentMatches.find((m) => m.toLowerCase() === query) || null;
}

/**
 * Attach accessible autocomplete combobox behavior to an input.
 *
 * @param {HTMLInputElement} inputEl
 * @param {HTMLUListElement} listEl
 * @param {object} [options]
 * @param {(selectedSystem: string) => void} [options.onSelect]
 * @param {() => Promise<string[]>} [options.loadData]
 */
export function attachSystemAutocomplete(inputEl, listEl, options = {}) {
	if (!inputEl || !listEl) return;

	const getData = options.loadData || loadSystemsData;
	let activeIndex = -1;
	let currentMatches = [];

	// Preload on focus
	inputEl.addEventListener("focus", () => {
		getData();
	});

	function closeDropdown() {
		listEl.innerHTML = "";
		listEl.classList.add("hidden");
		inputEl.setAttribute("aria-expanded", "false");
		inputEl.removeAttribute("aria-activedescendant");
		activeIndex = -1;
		currentMatches = [];
	}

	function highlightOption(index) {
		const items = listEl.querySelectorAll(".system-option");
		items.forEach((item, idx) => {
			const isSelected = idx === index;
			item.classList.toggle("active", isSelected);
			item.setAttribute("aria-selected", isSelected ? "true" : "false");
		});

		if (index >= 0 && index < items.length) {
			inputEl.setAttribute("aria-activedescendant", items[index].id);
			items[index].scrollIntoView({ block: "nearest" });
		} else {
			inputEl.removeAttribute("aria-activedescendant");
		}
		activeIndex = index;
	}

	let isSelecting = false;

	function selectOption(systemName) {
		isSelecting = true;
		inputEl.value = systemName;
		closeDropdown();
		inputEl.dispatchEvent(new Event("input", { bubbles: true }));
		inputEl.dispatchEvent(new Event("change", { bubbles: true }));
		if (typeof options.onSelect === "function") {
			options.onSelect(systemName);
		}
	}

	async function renderSuggestions() {
		const query = inputEl.value.trim();
		if (!query) {
			closeDropdown();
			return;
		}

		const systems = await getData();
		currentMatches = findMatchingSystems(query, systems, 8);

		if (currentMatches.length === 0) {
			closeDropdown();
			return;
		}

		listEl.innerHTML = "";
		currentMatches.forEach((name, idx) => {
			const li = document.createElement("li");
			li.id = `${inputEl.id}-opt-${idx}`;
			li.className = "system-option";
			li.setAttribute("role", "option");
			li.setAttribute("aria-selected", "false");
			li.textContent = name;

			li.addEventListener("mousedown", (e) => {
				e.preventDefault(); // Prevent input blur
				selectOption(name);
			});

			listEl.appendChild(li);
		});

		listEl.classList.remove("hidden");
		inputEl.setAttribute("aria-expanded", "true");
		activeIndex = -1;
	}

	inputEl.addEventListener("input", () => {
		if (isSelecting) {
			isSelecting = false;
			return;
		}
		renderSuggestions();
	});

	inputEl.addEventListener("keydown", (e) => {
		if (listEl.classList.contains("hidden") || currentMatches.length === 0) {
			return;
		}

		if (e.key === "ArrowDown") {
			e.preventDefault();
			const next = activeIndex + 1 >= currentMatches.length ? 0 : activeIndex + 1;
			highlightOption(next);
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			const prev = activeIndex - 1 < 0 ? currentMatches.length - 1 : activeIndex - 1;
			highlightOption(prev);
		} else if (e.key === "Enter") {
			const selection = resolveSelectedSystemOnEnter(currentMatches, activeIndex, inputEl.value);
			if (selection) {
				e.preventDefault();
				selectOption(selection);
			} else {
				closeDropdown();
			}
		} else if (e.key === "Escape") {
			e.preventDefault();
			closeDropdown();
		} else if (e.key === "Tab") {
			closeDropdown();
		}
	});

	inputEl.addEventListener("blur", () => {
		// Small delay to allow click event on mousedown
		setTimeout(closeDropdown, 150);
	});
}
