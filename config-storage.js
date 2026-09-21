export const CONFIG_STORAGE_KEY = "vagrant_logistics_rate_config";
export const CONFIG_CACHE_VERSION = 1;
export const CONFIG_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days (GDPR Storage Limitation)

export function saveCachedConfig(rateConfig, storage = globalThis.localStorage) {
	if (!storage || typeof storage.setItem !== "function") return;
	try {
		const payload = {
			version: CONFIG_CACHE_VERSION,
			timestamp: Date.now(),
			config: rateConfig,
		};
		storage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(payload));
	} catch (e) {
		console.warn("Failed to cache configuration to storage:", e);
	}
}

export function loadCachedConfig(storage = globalThis.localStorage, now = Date.now()) {
	if (!storage || typeof storage.getItem !== "function") return null;
	try {
		const raw = storage.getItem(CONFIG_STORAGE_KEY);
		if (!raw) return null;

		const payload = JSON.parse(raw);
		if (!payload || typeof payload !== "object") return null;

		// Support backwards compatibility with unversioned legacy caches
		if (!payload.version && !payload.timestamp) {
			return payload;
		}

		if (payload.version !== CONFIG_CACHE_VERSION) {
			if (typeof storage.removeItem === "function") storage.removeItem(CONFIG_STORAGE_KEY);
			return null;
		}

		const age = now - (payload.timestamp || 0);
		if (age > CONFIG_CACHE_TTL_MS || age < 0) {
			if (typeof storage.removeItem === "function") storage.removeItem(CONFIG_STORAGE_KEY);
			return null;
		}

		return payload.config || null;
	} catch (e) {
		console.warn("Failed to parse cached configuration:", e);
		return null;
	}
}
