import assert from "node:assert/strict";
import test from "node:test";
import {
	CONFIG_CACHE_TTL_MS,
	CONFIG_CACHE_VERSION,
	CONFIG_STORAGE_KEY,
	isCacheExpired,
	loadCachedConfig,
	saveCachedConfig,
} from "../config-storage.js";

function createMockStorage(initial = {}) {
	const store = new Map(Object.entries(initial));
	return {
		getItem: (key) => store.get(key) ?? null,
		setItem: (key, val) => store.set(key, String(val)),
		removeItem: (key) => store.delete(key),
		_store: store,
	};
}

test("config-storage: saves and loads unexpired config with schema metadata", () => {
	const storage = createMockStorage();
	const sampleConfig = { test: 123 };
	saveCachedConfig(sampleConfig, storage);

	const raw = JSON.parse(storage.getItem(CONFIG_STORAGE_KEY));
	assert.equal(raw.version, CONFIG_CACHE_VERSION);
	assert.equal(typeof raw.timestamp, "number");
	assert.deepEqual(raw.config, sampleConfig);

	const loaded = loadCachedConfig(storage, raw.timestamp + 1000);
	assert.deepEqual(loaded, sampleConfig);
});

test("config-storage: purges expired payload exceeding 7-day TTL", () => {
	const storage = createMockStorage();
	const sampleConfig = { test: 123 };
	saveCachedConfig(sampleConfig, storage);

	const raw = JSON.parse(storage.getItem(CONFIG_STORAGE_KEY));
	const expiredTime = raw.timestamp + CONFIG_CACHE_TTL_MS + 1000;

	const loaded = loadCachedConfig(storage, expiredTime);
	assert.equal(loaded, null);
	assert.equal(storage.getItem(CONFIG_STORAGE_KEY), null);
});

test("config-storage: purges payload when schema version mismatches", () => {
	const storage = createMockStorage({
		[CONFIG_STORAGE_KEY]: JSON.stringify({
			version: 999,
			timestamp: Date.now(),
			config: { old: true },
		}),
	});

	const loaded = loadCachedConfig(storage);
	assert.equal(loaded, null);
	assert.equal(storage.getItem(CONFIG_STORAGE_KEY), null);
});

test("config-storage: supports legacy unversioned JSON config without purging", () => {
	const legacy = { highsec_services: {} };
	const storage = createMockStorage({
		[CONFIG_STORAGE_KEY]: JSON.stringify(legacy),
	});

	const loaded = loadCachedConfig(storage);
	assert.deepEqual(loaded, legacy);
});

test("config-storage: handles corrupted JSON or storage exceptions gracefully", () => {
	const corruptedStorage = createMockStorage({ [CONFIG_STORAGE_KEY]: "{not-valid-json" });
	assert.equal(loadCachedConfig(corruptedStorage), null);

	const throwingStorage = {
		getItem: () => {
			throw new Error("SecurityError: Access is denied");
		},
		setItem: () => {
			throw new Error("QuotaExceededError");
		},
	};
	assert.doesNotThrow(() => saveCachedConfig({ a: 1 }, throwingStorage));
	assert.doesNotThrow(() => assert.equal(loadCachedConfig(throwingStorage), null));
});

test("config-storage: isCacheExpired detects TTL expiration and future clock skew", () => {
	const now = 1_000_000_000;
	assert.equal(isCacheExpired({ timestamp: now - 1000 }, now), false);
	assert.equal(isCacheExpired({ timestamp: now - 8 * 86_400_000 }, now), true);
	assert.equal(isCacheExpired({ timestamp: now + 5000 }, now), true);
	assert.equal(isCacheExpired(null, now), true);
});
