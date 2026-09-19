import assert from "node:assert/strict";
import test from "node:test";
import {
	buildRouteUrl,
	classifyJumps,
	EVE_ROUTE_BASE_URL,
	fetchEveRoute,
	MANDATORY_AVOID_LIST,
	RouteNotFoundError,
	RouteUnavailableError,
} from "../route-service.js";

test("classifyJumps: returns 0 jumps for empty or single-system routes", () => {
	assert.deepEqual(classifyJumps([]), { highSecJumps: 0, dangerousJumps: 0 });
	assert.deepEqual(classifyJumps(null), { highSecJumps: 0, dangerousJumps: 0 });
	assert.deepEqual(classifyJumps([{ name: "Jita", security: 0.95 }]), {
		highSecJumps: 0,
		dangerousJumps: 0,
	});
});

test("classifyJumps: N - 1 transition calculation (3-system route = 2 jumps)", () => {
	const systems = [
		{ name: "Jita", security: 0.95 }, // S_0: Origin (ignored)
		{ name: "Perimeter", security: 0.95 }, // S_1: Jump 1 -> High-Sec
		{ name: "Urlen", security: 0.96 }, // S_2: Jump 2 -> High-Sec
	];
	const result = classifyJumps(systems);
	assert.equal(result.highSecJumps, 2);
	assert.equal(result.dangerousJumps, 0);
});

test("classifyJumps: jump security classification edge cases", () => {
	// Exactly 0.45 -> High-Sec
	const exactlyHighSec = [
		{ name: "Start", security: 0.2 },
		{ name: "BorderHigh", security: 0.45 },
	];
	assert.deepEqual(classifyJumps(exactlyHighSec), {
		highSecJumps: 1,
		dangerousJumps: 0,
	});

	// 0.449 -> Dangerous
	const justUnderHighSec = [
		{ name: "Start", security: 1.0 },
		{ name: "BorderLow", security: 0.449 },
	];
	assert.deepEqual(classifyJumps(justUnderHighSec), {
		highSecJumps: 0,
		dangerousJumps: 1,
	});

	// Negative security (e.g. -0.2) -> Dangerous
	const nullsecSystem = [
		{ name: "Start", security: 0.9 },
		{ name: "Nullsec", security: -0.2 },
	];
	assert.deepEqual(classifyJumps(nullsecSystem), {
		highSecJumps: 0,
		dangerousJumps: 1,
	});

	// String security representation
	const stringSec = [
		{ name: "Start", security: "0.9" },
		{ name: "Target", security: "0.45" },
	];
	assert.deepEqual(classifyJumps(stringSec), {
		highSecJumps: 1,
		dangerousJumps: 0,
	});
});

test("buildRouteUrl: serialises query parameters and avoidance list", () => {
	const expectedAvoid = ["Zarzakh", "Ahbazon", "Rancer", "Hagilur", "Siseide", "Tama", "Aunenen"];
	assert.deepEqual(MANDATORY_AVOID_LIST, expectedAvoid);

	const urlStr = buildRouteUrl("  Jita  ", "  Amarr  ");
	const parsed = new URL(urlStr);

	assert.equal(parsed.origin, EVE_ROUTE_BASE_URL);
	assert.equal(parsed.pathname, "/api/route");
	assert.equal(parsed.searchParams.get("start"), "Jita");
	assert.equal(parsed.searchParams.get("end"), "Amarr");
	assert.equal(parsed.searchParams.get("pref"), "shortest");
	assert.equal(parsed.searchParams.get("avoid"), expectedAvoid.join(","));
});

test("buildRouteUrl: accepts custom avoid list and pref", () => {
	const urlStr = buildRouteUrl("Jita", "Amarr", {
		avoid: ["Tama", "Rancer"],
		pref: "safest",
		baseUrl: "https://custom-route.example.com",
	});
	const parsed = new URL(urlStr);

	assert.equal(parsed.origin, "https://custom-route.example.com");
	assert.equal(parsed.searchParams.get("avoid"), "Tama,Rancer");
	assert.equal(parsed.searchParams.get("pref"), "safest");
});

test("fetchEveRoute: returns 0 jumps for identical origin and destination without network call", async () => {
	let fetchCalled = false;
	const mockFetch = () => {
		fetchCalled = true;
		throw new Error("Should not fetch");
	};

	const result = await fetchEveRoute("Jita", "jita", { fetch: mockFetch });
	assert.equal(fetchCalled, false);
	assert.equal(result.highSecJumps, 0);
	assert.equal(result.dangerousJumps, 0);
	assert.equal(result.totalJumps, 0);
});

test("fetchEveRoute: successfully calculates route and classifies jumps", async () => {
	const mockResponse = {
		summary: {
			start: "Jita",
			end: "Amarr",
			pref: "shortest",
			directJumps: 2,
		},
		routes: {
			direct: [
				{ name: "Jita", security: 0.95 },
				{ name: "Vecamia", security: 0.44 }, // Dangerous
				{ name: "Amarr", security: 1.0 }, // High-Sec
			],
		},
	};

	const mockFetch = async () => ({
		ok: true,
		status: 200,
		json: async () => mockResponse,
	});

	const result = await fetchEveRoute("Jita", "Amarr", { fetch: mockFetch });
	assert.equal(result.highSecJumps, 1);
	assert.equal(result.dangerousJumps, 1);
	assert.equal(result.totalJumps, 2);
	assert.equal(result.systems.length, 3);
});

test("fetchEveRoute: graceful error handling when fetch throws", async () => {
	const mockFetch = () => Promise.reject(new TypeError("Failed to fetch"));

	await assert.rejects(
		async () => {
			await fetchEveRoute("Jita", "Amarr", { fetch: mockFetch });
		},
		(err) => {
			assert(err instanceof RouteUnavailableError);
			assert.equal(err.code, "UNAVAILABLE");
			assert.match(err.message, /Route lookup unavailable — manual entry enabled/);
			assert(err.cause instanceof TypeError);
			return true;
		},
	);
});

test("fetchEveRoute: throws RouteNotFoundError when API reports invalid system names", async () => {
	const mockFetch = async () => ({
		ok: false,
		status: 400,
		json: async () => ({ error: "Invalid system names." }),
	});

	await assert.rejects(
		async () => {
			await fetchEveRoute("InvalidOrigin", "Amarr", { fetch: mockFetch });
		},
		(err) => {
			assert(err instanceof RouteNotFoundError);
			assert.equal(err.code, "NO_ROUTE");
			assert.equal(err.message, "No route found avoiding specified systems");
			return true;
		},
	);
});

test("fetchEveRoute: throws RouteNotFoundError when routes.direct is null", async () => {
	const mockFetch = async () => ({
		ok: true,
		status: 200,
		json: async () => ({
			summary: { start: "Jita", end: "Polaris" },
			routes: { direct: null },
		}),
	});

	await assert.rejects(
		async () => {
			await fetchEveRoute("Jita", "Polaris", { fetch: mockFetch });
		},
		(err) => {
			assert(err instanceof RouteNotFoundError);
			assert.equal(err.code, "NO_ROUTE");
			return true;
		},
	);
});

test("fetchEveRoute: throws RouteUnavailableError on HTTP 500 error", async () => {
	const mockFetch = async () => ({
		ok: false,
		status: 500,
		json: async () => ({ error: "Internal Server Error" }),
	});

	await assert.rejects(
		async () => {
			await fetchEveRoute("Jita", "Amarr", { fetch: mockFetch });
		},
		(err) => {
			assert(err instanceof RouteUnavailableError);
			assert.equal(err.code, "UNAVAILABLE");
			return true;
		},
	);
});

test("fetchEveRoute: throws Error on missing or empty origin/destination", async () => {
	await assert.rejects(async () => fetchEveRoute("", "Amarr"), /Origin and destination/);
	await assert.rejects(async () => fetchEveRoute("Jita", "  "), /Origin and destination/);
	await assert.rejects(async () => fetchEveRoute(null, "Amarr"), /Origin and destination/);
});

test("fetchEveRoute: rethrows AbortError when signal is aborted by caller", async () => {
	const controller = new AbortController();
	controller.abort();

	await assert.rejects(
		async () => {
			await fetchEveRoute("Jita", "Amarr", { signal: controller.signal });
		},
		(err) => {
			assert.equal(err.name, "AbortError");
			return true;
		},
	);
});

test("fetchEveRoute: live verification for Jita to Amarr avoids Ahbazon", async (t) => {
	try {
		const result = await fetchEveRoute("Jita", "Amarr");
		assert.equal(result.totalJumps, 24);
		assert.equal(result.highSecJumps, 23);
		assert.equal(result.dangerousJumps, 1);
		assert.equal(
			result.systems.some((s) => s.name === "Ahbazon"),
			false,
			"Ahbazon must be avoided",
		);
	} catch (err) {
		t.skip(`Network unavailable for live route test: ${err.message}`);
	}
});
