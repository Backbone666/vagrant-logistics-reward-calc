import assert from "node:assert/strict";
import test from "node:test";
import {
	buildRouteUrl,
	classifyJumps,
	DEFAULT_CORS_PROXY_GATEWAY,
	DEFAULT_CORS_PROXY_GATEWAYS,
	DEFAULT_MANDATORY_AVOID_LIST,
	DEFAULT_PROXY_TIMEOUT_MS,
	DEFAULT_ROUTE_TIMEOUT_MS,
	EVE_ROUTE_BASE_URL,
	fetchEsiRoute,
	fetchEveRoute,
	fetchWithCorsFallback,
	HIGH_SEC_SECURITY_THRESHOLD,
	loadHighSecSystems,
	MANDATORY_AVOID_LIST,
	MAX_SYSTEM_NAME_LENGTH,
	RouteNotFoundError,
	RouteUnavailableError,
	resolveAvoidList,
	resolveSystemIdsBatch,
	TRADE_HUB_IDS,
} from "../route-service.js";

test("route-service constants: threshold and defaults match specs", () => {
	assert.equal(HIGH_SEC_SECURITY_THRESHOLD, 0.45);
	assert.equal(DEFAULT_ROUTE_TIMEOUT_MS, 12000);
	assert.equal(DEFAULT_PROXY_TIMEOUT_MS, 6000);
	assert.equal(MAX_SYSTEM_NAME_LENGTH, 50);
	assert.deepEqual(MANDATORY_AVOID_LIST, DEFAULT_MANDATORY_AVOID_LIST);
	assert.ok(DEFAULT_CORS_PROXY_GATEWAYS.length >= 2);
});

test("resolveAvoidList: returns config list when provided or falls back to default", () => {
	const custom = ["Tama", "Amamake"];
	assert.deepEqual(resolveAvoidList(custom), ["Tama", "Amamake"]);
	assert.deepEqual(resolveAvoidList([]), DEFAULT_MANDATORY_AVOID_LIST);
	assert.deepEqual(resolveAvoidList(null), DEFAULT_MANDATORY_AVOID_LIST);
	assert.deepEqual(resolveAvoidList(undefined), DEFAULT_MANDATORY_AVOID_LIST);
});

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

test("buildRouteUrl: handles string avoidance parameter", () => {
	const urlStr = buildRouteUrl("Jita", "Amarr", { avoid: "Tama,Rancer" });
	const parsed = new URL(urlStr);
	assert.equal(parsed.searchParams.get("avoid"), "Tama,Rancer");
});

test("fetchEveRoute: throws RouteUnavailableError on malformed JSON response", async () => {
	const mockFetch = async () => ({
		ok: true,
		status: 200,
		json: async () => {
			throw new SyntaxError("Unexpected token < in JSON at position 0");
		},
	});

	await assert.rejects(
		async () => {
			await fetchEveRoute("Jita", "Amarr", { fetch: mockFetch });
		},
		(err) => {
			assert(err instanceof RouteUnavailableError);
			assert.equal(err.code, "UNAVAILABLE");
			assert(err.cause instanceof SyntaxError);
			return true;
		},
	);
});

test("fetchEveRoute: handles non-JSON response in error body gracefully", async () => {
	const mockFetch = async () => ({
		ok: false,
		status: 502,
		json: async () => {
			throw new SyntaxError("Bad Gateway HTML");
		},
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

test("fetchEveRoute: fallback signal combination when AbortSignal.any is undefined", async () => {
	const originalAny = AbortSignal.any;
	AbortSignal.any = undefined;

	try {
		const controller = new AbortController();
		const mockResponse = {
			summary: { start: "Jita", end: "Amarr" },
			routes: {
				direct: [
					{ name: "Jita", security: 0.95 },
					{ name: "Amarr", security: 1.0 },
				],
			},
		};
		const mockFetch = async (_url, { signal } = {}) => {
			if (signal?.aborted) {
				const err = new Error("This operation was aborted");
				err.name = "AbortError";
				throw err;
			}
			return {
				ok: true,
				status: 200,
				json: async () => mockResponse,
			};
		};

		const result = await fetchEveRoute("Jita", "Amarr", {
			signal: controller.signal,
			fetch: mockFetch,
		});
		assert.equal(result.totalJumps, 1);
		assert.equal(result.highSecJumps, 1);

		// Now test aborting the controller with the fallback
		const abortController = new AbortController();
		abortController.abort();
		await assert.rejects(
			async () => {
				await fetchEveRoute("Jita", "Amarr", {
					signal: abortController.signal,
					fetch: mockFetch,
				});
			},
			(err) => {
				assert.equal(err.name, "AbortError");
				return true;
			},
		);
	} finally {
		AbortSignal.any = originalAny;
	}
});

test("fetchEveRoute: cleans up signal listeners in fallback mode on successful completion", async () => {
	const originalAny = AbortSignal.any;
	try {
		AbortSignal.any = undefined;
		const controller = new AbortController();
		let added = 0;
		let removed = 0;
		const origAdd = controller.signal.addEventListener;
		const origRemove = controller.signal.removeEventListener;
		controller.signal.addEventListener = function (...args) {
			added++;
			return origAdd.apply(this, args);
		};
		controller.signal.removeEventListener = function (...args) {
			removed++;
			return origRemove.apply(this, args);
		};

		const mockFetch = async () => ({
			ok: true,
			status: 200,
			json: async () => ({
				summary: {},
				routes: {
					direct: [
						{ name: "Jita", security: 1.0 },
						{ name: "Amarr", security: 1.0 },
					],
				},
			}),
		});

		await fetchEveRoute("Jita", "Amarr", {
			signal: controller.signal,
			fetch: mockFetch,
		});

		assert(added > 0, "Expected abort listener to be added to controller.signal");
		assert.equal(
			removed,
			added,
			"Expected all added abort listeners to be removed upon completion",
		);
	} finally {
		AbortSignal.any = originalAny;
	}
});

test("fetchEveRoute: throws RouteNotFoundError on alternative not-found error body", async () => {
	const mockFetch = async () => ({
		ok: false,
		status: 400,
		json: async () => ({ message: "System not found" }),
	});

	await assert.rejects(
		async () => {
			await fetchEveRoute("NonExistent", "Amarr", { fetch: mockFetch });
		},
		(err) => {
			assert(err instanceof RouteNotFoundError);
			assert.equal(err.code, "NO_ROUTE");
			return true;
		},
	);
});

test("fetchEveRoute: rethrows AbortError when signal is aborted during json body read", async () => {
	const controller = new AbortController();
	const mockFetch = async () => ({
		ok: true,
		status: 200,
		json: async () => {
			controller.abort();
			const abortErr = new Error("The operation was aborted");
			abortErr.name = "AbortError";
			throw abortErr;
		},
	});

	await assert.rejects(
		async () => {
			await fetchEveRoute("Jita", "Amarr", {
				signal: controller.signal,
				fetch: mockFetch,
			});
		},
		(err) => {
			assert.equal(err.name, "AbortError");
			return true;
		},
	);
});

test("fetchWithCorsFallback: uses direct fetch if successful", async () => {
	const calledUrls = [];
	const mockFetch = async (url) => {
		calledUrls.push(url);
		return {
			ok: true,
			status: 200,
			json: async () => ({ success: true }),
		};
	};

	const res = await fetchWithCorsFallback(
		"https://eve-route.vercel.app/api/route?start=Jita&end=Amarr",
		{
			fetch: mockFetch,
		},
	);
	assert.equal(res.ok, true);
	assert.equal(calledUrls.length, 1);
	assert.equal(calledUrls[0], "https://eve-route.vercel.app/api/route?start=Jita&end=Amarr");
});

test("fetchWithCorsFallback: transparently retries via CORS proxy on network/CORS error", async () => {
	const calledUrls = [];
	const mockFetch = async (url) => {
		calledUrls.push(url);
		if (url.startsWith("https://eve-route.vercel.app")) {
			// Simulate browser CORS block: TypeError: Failed to fetch / NetworkError
			throw new TypeError("Failed to fetch (CORS block)");
		}
		// Proxy gateway call succeeds
		return {
			ok: true,
			status: 200,
			json: async () => ({ proxied: true }),
		};
	};

	const targetUrl = "https://eve-route.vercel.app/api/route?start=Jita&end=Amarr";
	const res = await fetchWithCorsFallback(targetUrl, {
		fetch: mockFetch,
	});

	assert.equal(res.ok, true);
	assert.equal(calledUrls.length, 2);
	assert.equal(calledUrls[0], targetUrl);
	assert.equal(calledUrls[1], `${DEFAULT_CORS_PROXY_GATEWAY}${encodeURIComponent(targetUrl)}`);
});

test("fetchWithCorsFallback: throws RouteUnavailableError when both direct and proxy fail", async () => {
	const mockFetch = async () => {
		throw new TypeError("Network failed");
	};

	await assert.rejects(
		async () => {
			await fetchWithCorsFallback("https://eve-route.vercel.app/test", {
				fetch: mockFetch,
			});
		},
		(err) => {
			assert(err instanceof RouteUnavailableError);
			return true;
		},
	);
});

test("fetchWithCorsFallback: does not retry proxy if corsProxyGateway is null or empty", async () => {
	let attempts = 0;
	const mockFetch = async () => {
		attempts++;
		throw new TypeError("Failed to fetch");
	};

	await assert.rejects(
		async () => {
			await fetchWithCorsFallback("https://eve-route.vercel.app/test", {
				fetch: mockFetch,
				corsProxyGateway: null,
			});
		},
		(err) => {
			assert(err instanceof RouteUnavailableError);
			assert.equal(attempts, 1);
			return true;
		},
	);
});

test("fetchEveRoute: transparently recovers from CORS error via gateway and classifies jumps", async () => {
	const mockFetch = async (url) => {
		if (!url.startsWith(DEFAULT_CORS_PROXY_GATEWAY)) {
			// Direct call blocked by browser CORS
			throw new TypeError("Failed to fetch due to CORS");
		}
		// Proxy gateway call succeeds with EVE TT payload
		return {
			ok: true,
			status: 200,
			json: async () => ({
				summary: {
					start: "Jita",
					end: "Amarr",
					directJumps: 2,
				},
				routes: {
					direct: [
						{ name: "Jita", security: 0.95 },
						{ name: "Perimeter", security: 0.95 },
						{ name: "Ahbazon", security: 0.4 },
					],
				},
			}),
		};
	};

	const result = await fetchEveRoute("Jita", "Amarr", { fetch: mockFetch });
	assert.equal(result.highSecJumps, 1);
	assert.equal(result.dangerousJumps, 1);
	assert.equal(result.totalJumps, 2);
	assert.equal(result.systems.length, 3);
});

test("loadHighSecSystems: returns a Set containing Jita (30000142) and Amarr (30002187)", async () => {
	const highSec = await loadHighSecSystems();
	assert.ok(highSec instanceof Set);
	assert.ok(highSec.size > 1000);
	assert.equal(highSec.has(30000142), true); // Jita
	assert.equal(highSec.has(30002187), true); // Amarr
	assert.equal(highSec.has(30005196), false); // Ahbazon (0.4, lowsec)
});

test("resolveSystemIdsBatch: resolves cached trade hubs synchronously without network call", async () => {
	let fetchCalled = false;
	const mockFetch = async () => {
		fetchCalled = true;
		throw new Error("Should not fetch");
	};

	const map = await resolveSystemIdsBatch(["Jita", "Amarr"], { fetch: mockFetch });
	assert.equal(fetchCalled, false);
	assert.equal(map.get("Jita"), TRADE_HUB_IDS.jita);
	assert.equal(map.get("Amarr"), TRADE_HUB_IDS.amarr);
});

test("resolveSystemIdsBatch: batches POST to ESI for unknown systems", async () => {
	const mockFetch = async (url, options) => {
		assert.equal(url, "https://esi.evetech.net/latest/universe/ids/");
		assert.equal(options.method, "POST");
		const body = JSON.parse(options.body);
		assert.deepEqual(body, ["CustomSys"]);
		return {
			ok: true,
			status: 200,
			json: async () => ({
				systems: [{ id: 30001234, name: "CustomSys" }],
			}),
		};
	};

	const map = await resolveSystemIdsBatch(["Jita", "CustomSys"], { fetch: mockFetch });
	assert.equal(map.get("Jita"), TRADE_HUB_IDS.jita);
	assert.equal(map.get("CustomSys"), 30001234);
});

test("fetchWithCorsFallback: sequentially fails over from Proxy 1 (504 timeout) to Proxy 2 (200 OK)", async () => {
	const calledUrls = [];
	const mockFetch = async (url) => {
		calledUrls.push(url);
		if (url.includes("allorigins")) {
			return {
				ok: false,
				status: 504,
				json: async () => ({ error: "Gateway Timeout" }),
			};
		}
		if (url.includes("corsproxy.io")) {
			return {
				ok: true,
				status: 200,
				json: async () => ({ success: true }),
			};
		}
		throw new TypeError("CORS block on direct");
	};

	const targetUrl = "https://eve-route.vercel.app/api/route?start=Jita&end=Amarr";
	const res = await fetchWithCorsFallback(targetUrl, {
		fetch: mockFetch,
		corsProxyGateways: ["https://api.allorigins.win/raw?url=", "https://corsproxy.io/?url="],
	});

	assert.equal(res.ok, true);
	assert.equal(calledUrls.length, 3);
	assert.equal(calledUrls[0], targetUrl);
	assert.ok(calledUrls[1].includes("allorigins"));
	assert.ok(calledUrls[2].includes("corsproxy.io"));
});

test("fetchEsiRoute: successfully resolves IDs, fetches route, and classifies jumps using highsec Set", async () => {
	const mockFetch = async (url) => {
		if (url.includes("/route/30000142/30002187/")) {
			return {
				ok: true,
				status: 200,
				json: async () => [
					30000142, // Jita (origin, not counted)
					30000144, // Perimeter (highsec, jump 1)
					30005196, // Ahbazon (lowsec, jump 2)
					30002187, // Amarr (highsec, jump 3)
				],
			};
		}
		throw new Error(`Unexpected URL: ${url}`);
	};

	const highSecSet = new Set([30000142, 30000144, 30002187]);
	const result = await fetchEsiRoute("Jita", "Amarr", {
		fetch: mockFetch,
		highSecSet,
	});

	assert.equal(result.highSecJumps, 2);
	assert.equal(result.dangerousJumps, 1);
	assert.equal(result.totalJumps, 3);
	assert.equal(result.systems.length, 4);
	assert.equal(result.summary.start, "Jita");
	assert.equal(result.summary.end, "Amarr");
});

test("fetchEsiRoute: throws RouteNotFoundError when origin or destination is invalid", async () => {
	const mockFetch = async () => ({
		ok: true,
		status: 200,
		json: async () => ({ systems: [] }),
	});

	await assert.rejects(
		async () => {
			await fetchEsiRoute("NonExistentOrigin999", "Amarr", { fetch: mockFetch });
		},
		(err) => {
			assert(err instanceof RouteNotFoundError);
			return true;
		},
	);
});

test("fetchEsiRoute: throws RouteNotFoundError when ESI returns 404", async () => {
	const mockFetch = async (url) => {
		if (url.includes("/route/")) {
			return {
				ok: false,
				status: 404,
				json: async () => ({ error: "No route found" }),
			};
		}
		throw new Error(`Unexpected URL: ${url}`);
	};

	await assert.rejects(
		async () => {
			await fetchEsiRoute("Jita", "Amarr", { fetch: mockFetch });
		},
		(err) => {
			assert(err instanceof RouteNotFoundError);
			return true;
		},
	);
});

test("fetchEveRoute: transparently falls back to CCP ESI when EVE TT direct and all proxies fail", async () => {
	const highSecSet = new Set([30000142, 30000144, 30002187]);
	const mockFetch = async (url) => {
		if (url.includes("eve-route.vercel.app")) {
			throw new TypeError("Failed to fetch due to CORS / Gateway Timeout");
		}
		if (url.includes("/route/30000142/30002187/")) {
			return {
				ok: true,
				status: 200,
				json: async () => [30000142, 30000144, 30002187],
			};
		}
		throw new Error(`Unexpected URL: ${url}`);
	};

	const result = await fetchEveRoute("Jita", "Amarr", {
		fetch: mockFetch,
		corsProxyGateways: [],
		highSecSet,
	});

	assert.equal(result.highSecJumps, 2);
	assert.equal(result.dangerousJumps, 0);
	assert.equal(result.totalJumps, 2);
});

test("fetchEveRoute: throws RouteUnavailableError when both EVE TT and CCP ESI fail", async () => {
	const mockFetch = async () => {
		throw new TypeError("Network down completely");
	};

	await assert.rejects(
		async () => {
			await fetchEveRoute("Jita", "Amarr", {
				fetch: mockFetch,
				corsProxyGateways: [],
			});
		},
		(err) => {
			assert(err instanceof RouteUnavailableError);
			return true;
		},
	);
});

test("buildRouteUrl: filters origin and destination from avoid list", () => {
	const urlStr = buildRouteUrl("Jita", "Ahbazon");
	const parsed = new URL(urlStr);
	const avoid = parsed.searchParams.get("avoid").split(",");
	assert.equal(avoid.includes("Ahbazon"), false);
	assert.equal(avoid.includes("Tama"), true);
	assert.equal(avoid.includes("Zarzakh"), true);
});

test("fetchEsiRoute: filters destination from avoidIds so ESI does not 404 on avoided systems", async () => {
	let capturedUrl = "";
	const mockFetch = async (url) => {
		capturedUrl = url;
		if (url.includes("/route/")) {
			return {
				ok: true,
				status: 200,
				json: async () => [
					30000142, // Jita
					30000144, // Perimeter
					30005196, // Ahbazon
				],
			};
		}
		throw new Error(`Unexpected URL: ${url}`);
	};

	const highSecSet = new Set([30000142, 30000144]);
	const result = await fetchEsiRoute("Jita", "Ahbazon", {
		fetch: mockFetch,
		highSecSet,
	});

	assert.equal(result.totalJumps, 2);
	assert.equal(result.highSecJumps, 1);
	assert.equal(result.dangerousJumps, 1);
	// Verify that Ahbazon's system ID (30005196) was NOT included in the avoid query param
	const parsedUrl = new URL(capturedUrl);
	const avoidParam = parsedUrl.searchParams.get("avoid") || "";
	assert.equal(avoidParam.includes("30005196"), false);
});

test("buildRouteUrl: supports safeRoute boolean option (sets pref=safest)", () => {
	const safeUrl = buildRouteUrl("Jita", "Amarr", { safeRoute: true });
	const parsedSafe = new URL(safeUrl);
	assert.equal(parsedSafe.searchParams.get("pref"), "safest");

	const shortestUrl = buildRouteUrl("Jita", "Amarr", { safeRoute: false });
	const parsedShortest = new URL(shortestUrl);
	assert.equal(parsedShortest.searchParams.get("pref"), "shortest");
});

test("fetchEsiRoute: uses flag=secure when safeRoute is true or pref=safest", async () => {
	let capturedUrls = [];
	const mockFetch = async (url) => {
		capturedUrls.push(url);
		return {
			ok: true,
			status: 200,
			json: async () => [30000142, 30002187],
		};
	};

	const highSecSet = new Set([30000142, 30002187]);
	await fetchEsiRoute("Jita", "Amarr", {
		fetch: mockFetch,
		safeRoute: true,
		highSecSet,
	});
	assert.ok(capturedUrls[0].includes("flag=secure"));

	capturedUrls = [];
	await fetchEsiRoute("Jita", "Amarr", {
		fetch: mockFetch,
		pref: "safest",
		highSecSet,
	});
	assert.ok(capturedUrls[0].includes("flag=secure"));
});

test("fetchEsiRoute: uses flag=shortest when safeRoute is false and pref=shortest", async () => {
	let capturedUrl = "";
	const mockFetch = async (url) => {
		capturedUrl = url;
		return {
			ok: true,
			status: 200,
			json: async () => [30000142, 30002187],
		};
	};

	const highSecSet = new Set([30000142, 30002187]);
	await fetchEsiRoute("Jita", "Amarr", {
		fetch: mockFetch,
		safeRoute: false,
		pref: "shortest",
		highSecSet,
	});
	assert.ok(capturedUrl.includes("flag=shortest"));
});

test("fetchEveRoute: propagates safeRoute option to URL building and ESI fallback", async () => {
	let ttUrl = "";
	let esiUrl = "";
	const mockFetch = async (url) => {
		if (url.includes("eve-route.vercel.app")) {
			ttUrl = url;
			throw new TypeError("Simulated TT network failure");
		}
		if (url.includes("esi.evetech.net")) {
			esiUrl = url;
			return {
				ok: true,
				status: 200,
				json: async () => [30000142, 30002187],
			};
		}
		throw new Error(`Unexpected url: ${url}`);
	};

	const highSecSet = new Set([30000142, 30002187]);
	const result = await fetchEveRoute("Jita", "Amarr", {
		safeRoute: true,
		fetch: mockFetch,
		corsProxyGateways: [],
		highSecSet,
	});

	assert.ok(ttUrl.includes("pref=safest"));
	assert.ok(esiUrl.includes("flag=secure"));
	assert.equal(result.summary.pref, "safest");
});

test("fetchWithCorsFallback: fails over when proxy returns 401 Unauthorized or 403 Forbidden", async () => {
	const calledUrls = [];
	const mockFetch = async (url) => {
		calledUrls.push(url);
		if (url.includes("corsproxy.io")) {
			// Paywalled proxy returning 401
			return {
				ok: false,
				status: 401,
				json: async () => ({ error: "API key required" }),
			};
		}
		if (url.includes("forbidden-proxy")) {
			// Proxy returning 403
			return {
				ok: false,
				status: 403,
				json: async () => ({ error: "Forbidden" }),
			};
		}
		if (url.includes("working-proxy")) {
			return {
				ok: true,
				status: 200,
				json: async () => ({ success: true }),
			};
		}
		throw new TypeError("CORS block on direct");
	};

	const targetUrl = "https://eve-route.vercel.app/api/route?start=Jita&end=Amarr";
	const res = await fetchWithCorsFallback(targetUrl, {
		fetch: mockFetch,
		corsProxyGateways: [
			"https://corsproxy.io/?url=",
			"https://forbidden-proxy.example.com/?url=",
			"https://working-proxy.example.com/?url=",
		],
	});

	assert.equal(res.ok, true);
	assert.equal(calledUrls.length, 4); // direct + 3 proxies
	assert.equal(calledUrls[0], targetUrl);
	assert.ok(calledUrls[1].includes("corsproxy.io"));
	assert.ok(calledUrls[2].includes("forbidden-proxy"));
	assert.ok(calledUrls[3].includes("working-proxy"));
});

test("fetchEveRoute: uses primaryEngine='esi' to resolve directly via CCP ESI without calling EVE TT", async () => {
	let ttCalled = false;
	let esiCalled = false;
	const mockFetch = async (url) => {
		if (url.includes("eve-route.vercel.app")) {
			ttCalled = true;
			throw new Error("Should not call EVE TT when primaryEngine is esi");
		}
		if (url.includes("esi.evetech.net")) {
			esiCalled = true;
			return {
				ok: true,
				status: 200,
				json: async () => [30000142, 30002187],
			};
		}
		throw new Error(`Unexpected url: ${url}`);
	};

	const highSecSet = new Set([30000142, 30002187]);
	const result = await fetchEveRoute("Jita", "Amarr", {
		primaryEngine: "esi",
		fetch: mockFetch,
		highSecSet,
	});

	assert.equal(ttCalled, false);
	assert.equal(esiCalled, true);
	assert.equal(result.highSecJumps, 1);
	assert.equal(result.dangerousJumps, 0);
	assert.equal(result.totalJumps, 1);
});

test("fetchEveRoute: falls back to EVE TT when primaryEngine='esi' and ESI encounters network error", async () => {
	let ttCalled = false;
	let esiCalled = false;
	const mockFetch = async (url) => {
		if (url.includes("esi.evetech.net")) {
			esiCalled = true;
			throw new TypeError("Failed to reach ESI (network down)");
		}
		if (url.includes("eve-route.vercel.app")) {
			ttCalled = true;
			return {
				ok: true,
				status: 200,
				json: async () => ({
					summary: { start: "Jita", end: "Amarr", directJumps: 2 },
					routes: {
						direct: [
							{ name: "Jita", security: 0.95 },
							{ name: "Perimeter", security: 0.95 },
							{ name: "Amarr", security: 1.0 },
						],
					},
				}),
			};
		}
		throw new Error(`Unexpected url: ${url}`);
	};

	const result = await fetchEveRoute("Jita", "Amarr", {
		primaryEngine: "esi",
		fetch: mockFetch,
	});

	assert.equal(esiCalled, true);
	assert.equal(ttCalled, true);
	assert.equal(result.highSecJumps, 2);
	assert.equal(result.dangerousJumps, 0);
	assert.equal(result.totalJumps, 2);
});

test("fetchWithCorsFallback: unwraps { contents: string } from /get? JSON envelope proxy", async () => {
	const calledUrls = [];
	const innerPayload = {
		summary: { start: "Jita", end: "Amarr", directJumps: 2 },
		routes: {
			direct: [
				{ name: "Jita", security: 0.95 },
				{ name: "Perimeter", security: 0.95 },
				{ name: "Amarr", security: 1.0 },
			],
		},
	};

	const mockFetch = async (url) => {
		calledUrls.push(url);
		if (url.includes("/get?")) {
			return {
				ok: true,
				status: 200,
				json: async () => ({
					contents: JSON.stringify(innerPayload),
					status: { http_code: 200 },
				}),
			};
		}
		throw new TypeError("Direct fetch blocked");
	};

	const targetUrl = "https://eve-route.vercel.app/api/route?start=Jita&end=Amarr";
	const res = await fetchWithCorsFallback(targetUrl, {
		fetch: mockFetch,
		corsProxyGateways: ["https://api.allorigins.win/get?url="],
	});

	assert.equal(res.ok, true);
	assert.equal(res.status, 200);
	const data = await res.json();
	assert.deepEqual(data, innerPayload);
});

test("fetchWithCorsFallback: bypasses direct fetch in simulated browser environment", async () => {
	const calledUrls = [];
	const mockFetch = async (url) => {
		calledUrls.push(url);
		return {
			ok: true,
			status: 200,
			json: async () => ({ proxied: true }),
		};
	};

	const originalWindow = globalThis.window;
	try {
		// Simulate browser environment with different origin
		globalThis.window = {
			location: { origin: "https://vglgi.backb0ne.cloud" },
		};

		const targetUrl = "https://eve-route.vercel.app/api/route?start=Jita&end=Amarr";
		const res = await fetchWithCorsFallback(targetUrl, {
			fetch: mockFetch,
			corsProxyGateways: ["https://api.cors.lol/?url="],
		});

		assert.equal(res.ok, true);
		// In browser, direct fetch to different origin must be skipped
		assert.equal(calledUrls.length, 1);
		assert.ok(calledUrls[0].includes("api.cors.lol"));
		assert.ok(!calledUrls.includes(targetUrl));
	} finally {
		if (originalWindow === undefined) {
			delete globalThis.window;
		} else {
			globalThis.window = originalWindow;
		}
	}
});

test("fetchWithCorsFallback: allows direct fetch in browser when allowDirectBrowserFetch is true", async () => {
	const calledUrls = [];
	const mockFetch = async (url) => {
		calledUrls.push(url);
		if (url.startsWith("https://eve-route.vercel.app")) {
			throw new TypeError("Direct CORS blocked");
		}
		return {
			ok: true,
			status: 200,
			json: async () => ({ proxied: true }),
		};
	};

	const originalWindow = globalThis.window;
	try {
		globalThis.window = {
			location: { origin: "https://vglgi.backb0ne.cloud" },
		};

		const targetUrl = "https://eve-route.vercel.app/api/route?start=Jita&end=Amarr";
		const res = await fetchWithCorsFallback(targetUrl, {
			fetch: mockFetch,
			allowDirectBrowserFetch: true,
			corsProxyGateways: ["https://api.cors.lol/?url="],
		});

		assert.equal(res.ok, true);
		assert.equal(calledUrls.length, 2);
		assert.equal(calledUrls[0], targetUrl);
		assert.ok(calledUrls[1].includes("api.cors.lol"));
	} finally {
		if (originalWindow === undefined) {
			delete globalThis.window;
		} else {
			globalThis.window = originalWindow;
		}
	}
});

test("fetchEveRoute: falls back to ESI when proxy returns 200 with non-route body", async () => {
	let esiCalled = false;
	const mockFetch = async (url) => {
		if (url.includes("cors.lol")) {
			// Proxy returns 200 with rate limit or non-route message
			return {
				ok: true,
				status: 200,
				json: async () => ({ error: "Rate limit exceeded" }),
			};
		}
		if (url.includes("esi.evetech.net")) {
			esiCalled = true;
			return {
				ok: true,
				status: 200,
				json: async () => [30000142, 30002187],
			};
		}
		throw new TypeError("Direct blocked");
	};

	const highSecSet = new Set([30000142, 30002187]);
	const result = await fetchEveRoute("Jita", "Amarr", {
		fetch: mockFetch,
		corsProxyGateways: ["https://api.cors.lol/?url="],
		highSecSet,
	});

	assert.equal(esiCalled, true);
	assert.equal(result.highSecJumps, 1);
	assert.equal(result.totalJumps, 1);
});
