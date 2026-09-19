/**
 * Route calculation service for EVE Online solar systems.
 * Interacts with the TT Route API (https://eve-route.vercel.app/api/route).
 */

export const MANDATORY_AVOID_LIST = Object.freeze([
	"Zarzakh",
	"Ahbazon",
	"Rancer",
	"Hagilur",
	"Siseide",
	"Tama",
	"Aunenen",
]);

export const EVE_ROUTE_BASE_URL = "https://eve-route.vercel.app";

export class RouteNotFoundError extends Error {
	constructor(message = "No route found avoiding specified systems") {
		super(message);
		this.name = "RouteNotFoundError";
		this.code = "NO_ROUTE";
	}
}

export class RouteUnavailableError extends Error {
	constructor(message = "Route lookup unavailable — manual entry enabled", originalError = null) {
		super(message);
		this.name = "RouteUnavailableError";
		this.code = "UNAVAILABLE";
		if (originalError) {
			this.cause = originalError;
		}
	}
}

/**
 * Classify solar system jumps into High-Sec and Dangerous counts.
 * In New Eden, security >= 0.45 rounds to 0.5 (High-Sec).
 * Origin system (index 0) does not count as a jump.
 * Total jumps = N - 1 for N solar systems.
 *
 * @param {Array<{ security?: number | string }>} routeSystems
 * @returns {{ highSecJumps: number, dangerousJumps: number }}
 */
export function classifyJumps(routeSystems) {
	if (!Array.isArray(routeSystems) || routeSystems.length <= 1) {
		return { highSecJumps: 0, dangerousJumps: 0 };
	}

	let highSecJumps = 0;
	let dangerousJumps = 0;

	for (let i = 1; i < routeSystems.length; i++) {
		const system = routeSystems[i];
		const sec = Number(system?.security ?? 0);
		if (sec >= 0.45) {
			highSecJumps++;
		} else {
			dangerousJumps++;
		}
	}

	return { highSecJumps, dangerousJumps };
}

/**
 * Serialise route query parameters and build full URL.
 *
 * @param {string} origin
 * @param {string} destination
 * @param {object} [options]
 * @returns {string}
 */
export function buildRouteUrl(origin, destination, options = {}) {
	const baseUrl = options.baseUrl || EVE_ROUTE_BASE_URL;
	const avoid = options.avoid ?? MANDATORY_AVOID_LIST;
	const pref = options.pref || "shortest";

	const url = new URL("/api/route", baseUrl);
	url.searchParams.set("start", origin.trim());
	url.searchParams.set("end", destination.trim());
	url.searchParams.set("pref", pref);

	if (Array.isArray(avoid) && avoid.length > 0) {
		url.searchParams.set("avoid", avoid.join(","));
	} else if (typeof avoid === "string" && avoid.trim()) {
		url.searchParams.set("avoid", avoid.trim());
	}

	return url.toString();
}

/**
 * Combine multiple abort signals with fallback for runtimes lacking AbortSignal.any.
 *
 * @param {Array<AbortSignal>} signals
 * @returns {{ signal: AbortSignal, cleanup: () => void }}
 */
function combineSignals(signals) {
	if (typeof AbortSignal.any === "function") {
		return { signal: AbortSignal.any(signals), cleanup: () => {} };
	}
	const controller = new AbortController();
	const cleanups = [];
	const cleanup = () => {
		while (cleanups.length > 0) {
			const fn = cleanups.pop();
			try {
				fn();
			} catch {
				// ignore
			}
		}
	};
	for (const sig of signals) {
		if (!sig) continue;
		if (sig.aborted) {
			controller.abort(sig.reason);
			return { signal: sig, cleanup: () => {} };
		}
		const onAbort = () => {
			cleanup();
			controller.abort(sig.reason);
		};
		sig.addEventListener("abort", onAbort, { once: true });
		cleanups.push(() => sig.removeEventListener("abort", onAbort));
	}
	return { signal: controller.signal, cleanup };
}

/**
 * Fetch shortest path between origin and destination systems.
 *
 * @param {string} origin
 * @param {string} destination
 * @param {object} [options]
 * @returns {Promise<{
 *   summary: object,
 *   routes: object,
 *   systems: Array<object>,
 *   highSecJumps: number,
 *   dangerousJumps: number,
 *   totalJumps: number
 * }>}
 */
export async function fetchEveRoute(origin, destination, options = {}) {
	if (
		typeof origin !== "string" ||
		typeof destination !== "string" ||
		!origin.trim() ||
		!destination.trim()
	) {
		throw new Error("Origin and destination systems are required.");
	}

	const trimmedOrigin = origin.trim();
	const trimmedDestination = destination.trim();

	// Identical systems require 0 jumps without a network request
	if (trimmedOrigin.toLowerCase() === trimmedDestination.toLowerCase()) {
		return {
			summary: {
				start: trimmedOrigin,
				end: trimmedDestination,
				pref: "shortest",
				directJumps: 0,
				theraJumps: 0,
				recommended: "direct",
			},
			routes: {
				direct: [{ name: trimmedOrigin, security: 1.0 }],
			},
			systems: [{ name: trimmedOrigin, security: 1.0 }],
			highSecJumps: 0,
			dangerousJumps: 0,
			totalJumps: 0,
		};
	}

	const url = buildRouteUrl(trimmedOrigin, trimmedDestination, options);
	const timeoutMs = options.timeout ?? 5000;
	const timeoutSignal = AbortSignal.timeout(timeoutMs);

	let signal;
	let cleanup = () => {};
	if (options.signal) {
		const combined = combineSignals([options.signal, timeoutSignal]);
		signal = combined.signal;
		cleanup = combined.cleanup;
	} else {
		signal = timeoutSignal;
	}

	const fetchFn = options.fetch || globalThis.fetch;

	try {
		let response;
		try {
			response = await fetchFn(url, { signal });
		} catch (fetchErr) {
			if (fetchErr.name === "AbortError" && options.signal?.aborted) {
				throw fetchErr;
			}
			throw new RouteUnavailableError("Route lookup unavailable — manual entry enabled", fetchErr);
		}

		if (!response.ok) {
			let errBody = null;
			try {
				errBody = await response.json();
			} catch {
				// Non-JSON response
			}

			const errMsg = String(errBody?.error ?? errBody?.message ?? "").toLowerCase();
			if (
				(response.status === 400 || response.status === 404) &&
				(errMsg.includes("invalid system") ||
					errMsg.includes("not found") ||
					errMsg.includes("unknown system") ||
					errMsg.includes("no route"))
			) {
				throw new RouteNotFoundError("No route found avoiding specified systems");
			}

			throw new RouteUnavailableError(
				"Route lookup unavailable — manual entry enabled",
				new Error(`HTTP ${response.status}: ${JSON.stringify(errBody)}`),
			);
		}

		let data;
		try {
			data = await response.json();
		} catch (jsonErr) {
			if (jsonErr.name === "AbortError" && options.signal?.aborted) {
				throw jsonErr;
			}
			throw new RouteUnavailableError("Route lookup unavailable — manual entry enabled", jsonErr);
		}
		const directSystems = data?.routes?.direct;

		if (!Array.isArray(directSystems) || directSystems.length === 0) {
			throw new RouteNotFoundError("No route found avoiding specified systems");
		}

		const { highSecJumps, dangerousJumps } = classifyJumps(directSystems);

		return {
			summary: data.summary,
			routes: data.routes,
			systems: directSystems,
			highSecJumps,
			dangerousJumps,
			totalJumps: highSecJumps + dangerousJumps,
		};
	} finally {
		cleanup();
	}
}
