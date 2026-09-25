/**
 * Route calculation service for EVE Online solar systems.
 * Interacts with the TT Route API (https://eve-route.vercel.app/api/route).
 */

export const HIGH_SEC_SECURITY_THRESHOLD = 0.45;
export const DEFAULT_ROUTE_TIMEOUT_MS = 10000;
export const MAX_SYSTEM_NAME_LENGTH = 50;

export const DEFAULT_MANDATORY_AVOID_LIST = Object.freeze([
	"Zarzakh",
	"Ahbazon",
	"Rancer",
	"Hagilur",
	"Siseide",
	"Tama",
	"Aunenen",
]);

// Backwards-compatible alias
export const MANDATORY_AVOID_LIST = DEFAULT_MANDATORY_AVOID_LIST;

export function resolveAvoidList(configAvoidList) {
	if (Array.isArray(configAvoidList) && configAvoidList.length > 0) {
		return Object.freeze([...configAvoidList]);
	}
	return DEFAULT_MANDATORY_AVOID_LIST;
}

export const EVE_ROUTE_BASE_URL = "https://eve-route.vercel.app";
export const DEFAULT_CORS_PROXY_GATEWAY = "https://corsproxy-latest.onrender.com/";
export const DEFAULT_CORS_PROXY_GATEWAYS = Object.freeze([
	"https://corsproxy-latest.onrender.com/",
	"https://reef-proxy.onrender.com/get?url=",
	"https://api.allorigins.win/raw?url=",
]);
export const DEFAULT_PROXY_TIMEOUT_MS = 4000;

export const BLOCKADE_RUNNER_MAX_VOLUME = 12500;
export const JUMP_FREIGHTER_MAX_VOLUME = 360000;

/**
 * Select the appropriate route (Thera wormhole vs Direct stargate) based on volume.
 * Blockade runners (<= 12,500 m³) use Thera wormholes if a shorter route exists.
 * Bulk transport (> 12,500 m³) strictly uses stargate direct routing.
 * When volume is omitted/undefined, defaults to stargate direct routing.
 *
 * @param {object} routeResult
 * @param {number|string} [volume]
 * @returns {{
 *   selectedRoute: object,
 *   routeUsed: "thera" | "direct",
 *   isBlockadeRunner: boolean,
 *   hasTheraShortcut: boolean
 * }}
 */
export function selectRouteForVolume(routeResult, volume, options = {}) {
	if (!routeResult) {
		return {
			selectedRoute: null,
			routeUsed: "direct",
			isBlockadeRunner: false,
			hasTheraShortcut: false,
		};
	}

	const hasTheraShortcut = Boolean(
		routeResult.hasTheraShortcut ||
			(routeResult.thera &&
				routeResult.direct &&
				routeResult.thera.totalJumps < routeResult.direct.totalJumps),
	);

	if (volume === undefined || volume === null) {
		return {
			selectedRoute: routeResult.direct || routeResult,
			routeUsed: "direct",
			isBlockadeRunner: false,
			hasTheraShortcut,
		};
	}

	const parsedVolume =
		typeof volume === "number" ? volume : parseFloat(String(volume || 0).replace(/,/g, "")) || 0;
	// Blockade Runner requires positive cargo volume up to 12,500 m³
	const isBlockadeRunner = parsedVolume > 0 && parsedVolume <= BLOCKADE_RUNNER_MAX_VOLUME;
	const enableThera = Boolean(options.enableThera);

	const useThera =
		isBlockadeRunner && hasTheraShortcut && Boolean(routeResult.thera) && enableThera;
	const selectedRoute = useThera ? routeResult.thera : routeResult.direct || routeResult;
	const routeUsed = useThera ? "thera" : "direct";

	return {
		selectedRoute,
		routeUsed,
		isBlockadeRunner,
		hasTheraShortcut,
	};
}

/**
 * Format a proxied URL based on whether the gateway uses query parameters or path prefix.
 *
 * @param {string} gateway
 * @param {string} targetUrl
 * @returns {string}
 */
export function buildProxiedUrl(gateway, targetUrl) {
	if (gateway.endsWith("=") || gateway.includes("?")) {
		return `${gateway}${encodeURIComponent(targetUrl)}`;
	}
	return gateway.endsWith("/") ? `${gateway}${targetUrl}` : `${gateway}/${targetUrl}`;
}

export const TRADE_HUB_IDS = Object.freeze({
	jita: 30000142,
	amarr: 30002187,
	dodixie: 30002659,
	rens: 30002510,
	hek: 30002057,
	perimeter: 30000144,
});

/** @internal Encapsulated high-risk choke point IDs */
const AVOID_SYSTEM_IDS = Object.freeze({
	zarzakh: 30100000,
	ahbazon: 30005196,
	rancer: 30002718,
	hagilur: 30002050,
	siseide: 30002539,
	tama: 30002813,
	aunenen: 30001398,
});

/** @internal Encapsulated solar system ID lookup cache */
const SYSTEM_ID_CACHE = new Map();

for (const [name, id] of Object.entries(TRADE_HUB_IDS)) {
	SYSTEM_ID_CACHE.set(name.toLowerCase(), id);
}
for (const [name, id] of Object.entries(AVOID_SYSTEM_IDS)) {
	SYSTEM_ID_CACHE.set(name.toLowerCase(), id);
}

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
function isHighSecSystemNode(system) {
	return Number(system?.security ?? 0) >= HIGH_SEC_SECURITY_THRESHOLD;
}

export function classifyJumps(routeSystems) {
	if (!Array.isArray(routeSystems) || routeSystems.length <= 1) {
		return { highSecJumps: 0, dangerousJumps: 0 };
	}

	let highSecJumps = 0;
	let dangerousJumps = 0;

	for (let i = 1; i < routeSystems.length; i++) {
		if (isHighSecSystemNode(routeSystems[i])) {
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
function normalizeAvoidList(avoid, origin, destination) {
	const originClean = origin.trim().toLowerCase();
	const destClean = destination.trim().toLowerCase();

	const items = Array.isArray(avoid)
		? avoid
		: typeof avoid === "string" && avoid.trim()
			? avoid
					.split(",")
					.map((s) => s.trim())
					.filter(Boolean)
			: [];

	return items.filter((name) => {
		const lower = name.toLowerCase();
		return lower !== originClean && lower !== destClean;
	});
}

export function resolveRoutePreference(options = {}) {
	return options.pref || (options.safeRoute ? "safest" : "shortest");
}

export function buildRouteUrl(origin, destination, options = {}) {
	const baseUrl = options.baseUrl || EVE_ROUTE_BASE_URL;
	const avoid = options.avoid ?? MANDATORY_AVOID_LIST;
	const pref = resolveRoutePreference(options);

	const url = new URL("/api/route", baseUrl);
	url.searchParams.set("start", origin.trim());
	url.searchParams.set("end", destination.trim());
	url.searchParams.set("pref", pref);

	const filteredAvoid = normalizeAvoidList(avoid, origin, destination);
	if (filteredAvoid.length > 0) {
		url.searchParams.set("avoid", filteredAvoid.join(","));
	}

	return url.toString();
}

/**
 * Combine multiple abort signals with fallback for runtimes lacking AbortSignal.any.
 *
 * @param {Array<AbortSignal>} signals
 * @returns {{ signal: AbortSignal, cleanup: () => void }}
 */
function combineSignalsFallback(signals) {
	const controller = new AbortController();
	const cleanups = [];
	const cleanup = () => {
		while (cleanups.length > 0) {
			try {
				cleanups.pop()();
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

function combineSignals(signals) {
	if (typeof AbortSignal.any === "function") {
		return { signal: AbortSignal.any(signals), cleanup: () => {} };
	}
	return combineSignalsFallback(signals);
}

let cachedHighSecSet = null;
let highSecFetchPromise = null;

/**
 * Load high-sec system ID set for O(1) jump classification.
 *
 * @param {string} [dataUrl="data/highsec-systems.json"]
 * @param {object} [options]
 * @returns {Promise<Set<number>>}
 */
export async function loadHighSecSystems(dataUrl = "data/highsec-systems.json", options = {}) {
	if (cachedHighSecSet) return cachedHighSecSet;
	if (highSecFetchPromise) return highSecFetchPromise;

	highSecFetchPromise = (async () => {
		try {
			if (
				typeof process !== "undefined" &&
				process?.versions?.node &&
				typeof window === "undefined"
			) {
				const fs = await import("node:fs");
				const fileUrl = new URL("./data/highsec-systems.json", import.meta.url);
				const content = fs.readFileSync(fileUrl, "utf-8");
				const ids = JSON.parse(content);
				cachedHighSecSet = new Set(ids);
				return cachedHighSecSet;
			}
			const fetchFn = options.fetch || globalThis.fetch;
			const resolvedUrl =
				typeof window !== "undefined" && window.location?.href
					? new URL(dataUrl, window.location.href).href
					: dataUrl;
			const res = await fetchFn(resolvedUrl);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const ids = await res.json();
			cachedHighSecSet = new Set(ids);
			return cachedHighSecSet;
		} catch (err) {
			console.warn("Failed to load highsec systems dataset:", err);
			return new Set();
		} finally {
			highSecFetchPromise = null;
		}
	})();

	return highSecFetchPromise;
}

/**
 * Batch resolve system names to IDs via cache and CCP ESI.
 *
 * @param {string[]} systemNames
 * @param {object} [options]
 * @returns {Promise<Map<string, number>>}
 */
export async function resolveSystemIdsBatch(systemNames, options = {}) {
	const fetchFn = options.fetch || globalThis.fetch;
	const signal = options.signal;
	const resolved = new Map();
	const unresolved = [];

	for (const name of systemNames) {
		if (!name || typeof name !== "string") continue;
		const clean = name.trim().toLowerCase();
		if (SYSTEM_ID_CACHE.has(clean)) {
			resolved.set(name, SYSTEM_ID_CACHE.get(clean));
		} else {
			unresolved.push(name.trim());
		}
	}

	if (unresolved.length > 0) {
		const res = await fetchFn("https://esi.evetech.net/latest/universe/ids/", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(unresolved),
			signal,
		});

		if (!res.ok) {
			throw new RouteUnavailableError(
				"Route lookup unavailable — manual entry enabled",
				new Error(`ESI Universe IDs returned HTTP ${res.status}`),
			);
		}

		const data = await res.json();
		const systems = data?.systems || [];
		for (const sys of systems) {
			const cleanName = sys.name.toLowerCase();
			SYSTEM_ID_CACHE.set(cleanName, sys.id);
			for (const reqName of unresolved) {
				if (reqName.toLowerCase() === cleanName) {
					resolved.set(reqName, sys.id);
				}
			}
		}
	}

	return resolved;
}

export function buildEsiRouteSystems(routeIds, origin, destination, highSecSet) {
	if (!Array.isArray(routeIds)) return [];
	const lastIdx = routeIds.length - 1;
	return routeIds.map((id, idx) => {
		let name = String(id);
		if (idx === 0) name = origin;
		else if (idx === lastIdx) name = destination;
		return {
			id,
			name,
			security: highSecSet?.has(id) ? 1.0 : 0.0,
		};
	});
}

export function classifyEsiRouteJumps(routeIds, highSecSet) {
	if (!Array.isArray(routeIds) || routeIds.length <= 1 || !highSecSet) {
		return { highSecJumps: 0, dangerousJumps: 0, totalJumps: 0 };
	}
	let highSecJumps = 0;
	let dangerousJumps = 0;
	for (let i = 1; i < routeIds.length; i++) {
		if (highSecSet.has(routeIds[i])) {
			highSecJumps++;
		} else {
			dangerousJumps++;
		}
	}
	return { highSecJumps, dangerousJumps, totalJumps: highSecJumps + dangerousJumps };
}

/**
 * Calculate route directly using CCP ESI and classify jumps using the highsec ID set.
 *
 * @param {string} origin
 * @param {string} destination
 * @param {object} [options]
 * @returns {Promise<object>}
 */
export async function fetchEsiRoute(origin, destination, options = {}) {
	const fetchFn = options.fetch || globalThis.fetch;
	const signal = options.signal;

	const trimmedOrigin = origin.trim();
	const trimmedDestination = destination.trim();

	const idMap = await resolveSystemIdsBatch([trimmedOrigin, trimmedDestination], options);
	const originId = idMap.get(trimmedOrigin);
	const destId = idMap.get(trimmedDestination);

	if (!originId || !destId) {
		throw new RouteNotFoundError(
			`Unknown solar system: ${!originId ? trimmedOrigin : trimmedDestination}`,
		);
	}

	const avoidNames = resolveAvoidList(options.avoid);
	let avoidIds = [];
	if (avoidNames.length > 0) {
		const avoidMap = await resolveSystemIdsBatch(avoidNames, options);
		avoidIds = avoidNames
			.map((n) => avoidMap.get(n))
			.filter((id) => Boolean(id) && id !== originId && id !== destId);
	}

	const pref = resolveRoutePreference(options);
	const flag = options.flag || (pref === "safest" ? "secure" : "shortest");
	let esiUrl = `https://esi.evetech.net/latest/route/${originId}/${destId}/?flag=${flag}`;
	if (avoidIds.length > 0) {
		esiUrl += `&avoid=${avoidIds.join(",")}`;
	}

	const res = await fetchFn(esiUrl, { signal });
	if (!res.ok) {
		if (res.status === 404) {
			throw new RouteNotFoundError("No route found avoiding specified systems");
		}
		throw new RouteUnavailableError(
			"Route lookup unavailable — manual entry enabled",
			new Error(`ESI route returned HTTP ${res.status}`),
		);
	}

	const routeIds = await res.json();
	if (!Array.isArray(routeIds) || routeIds.length === 0) {
		throw new RouteNotFoundError("No route found avoiding specified systems");
	}

	const highSecSet =
		options.highSecSet ||
		(options.highSecSystems
			? new Set(options.highSecSystems)
			: await loadHighSecSystems(options.highSecDataUrl, options));

	const { highSecJumps, dangerousJumps, totalJumps } = classifyEsiRouteJumps(routeIds, highSecSet);
	const systemsArray = buildEsiRouteSystems(
		routeIds,
		trimmedOrigin,
		trimmedDestination,
		highSecSet,
	);

	const directInfo = {
		systems: systemsArray,
		highSecJumps,
		dangerousJumps,
		totalJumps,
	};

	return {
		summary: {
			start: trimmedOrigin,
			end: trimmedDestination,
			pref,
			directJumps: totalJumps,
		},
		routes: { direct: systemsArray },
		direct: directInfo,
		thera: null,
		hasTheraShortcut: false,
		routeUsed: "direct",
		systems: systemsArray,
		highSecJumps,
		dangerousJumps,
		totalJumps,
	};
}

function isBrowserContext() {
	return typeof window !== "undefined" && typeof window.location?.origin === "string";
}

function isDirectFetchAllowed(targetUrl, options = {}) {
	if (!isBrowserContext() || options.allowDirectBrowserFetch) {
		return true;
	}
	try {
		return new URL(targetUrl).origin === window.location.origin;
	} catch {
		return false;
	}
}

export function createWrappedProxyResponse(contents, status) {
	if (typeof Response === "function") {
		return new Response(contents, {
			status,
			statusText: "OK",
			headers: { "Content-Type": "application/json" },
		});
	}
	return {
		ok: true,
		status,
		json: async () => JSON.parse(contents),
		text: async () => contents,
	};
}

async function unwrapProxyEnvelope(proxyResponse, gateway) {
	if (!gateway.includes("/get?")) return proxyResponse;
	try {
		const clone = typeof proxyResponse.clone === "function" ? proxyResponse.clone() : proxyResponse;
		const wrapper = await clone.json();
		if (wrapper && typeof wrapper === "object" && typeof wrapper.contents === "string") {
			const status = wrapper.status?.http_code || 200;
			if (status >= 200 && status < 300) {
				return createWrappedProxyResponse(wrapper.contents, status);
			}
			throw new Error(`Wrapped upstream proxy returned HTTP ${status}`);
		}
	} catch (err) {
		if (err.message?.startsWith("Wrapped upstream proxy")) throw err;
	}
	return proxyResponse;
}

/**
 * Attempt to fetch a resource directly; if blocked by CORS (TypeError)
 * or network error, sequentially retry via the CORS edge gateway pool.
 *
 * @param {string} targetUrl
 * @param {object} [options]
 * @returns {Promise<Response>}
 */
function resolveProxyGateways(options = {}) {
	if (options.corsProxyGateways) {
		return options.corsProxyGateways;
	}
	if (options.corsProxyGateway !== undefined) {
		return options.corsProxyGateway ? [options.corsProxyGateway] : [];
	}
	return DEFAULT_CORS_PROXY_GATEWAYS;
}

async function attemptDirectFetch(targetUrl, fetchFn, signal, proxyGateways) {
	try {
		const response = await fetchFn(targetUrl, { signal });
		if (response.ok) {
			return response;
		}
		if (![408, 429, 502, 503, 504].includes(response.status) || proxyGateways.length === 0) {
			return response;
		}
	} catch (err) {
		if (err.name === "AbortError" && signal?.aborted) {
			throw err;
		}
	}
	return null;
}

export async function fetchWithCorsFallback(targetUrl, options = {}) {
	const signal = options.signal;
	const fetchFn = options.fetch || globalThis.fetch;
	const proxyGateways = resolveProxyGateways(options);
	const proxyTimeoutMs = options.proxyTimeoutMs || DEFAULT_PROXY_TIMEOUT_MS;

	if (isDirectFetchAllowed(targetUrl, options)) {
		const directResponse = await attemptDirectFetch(targetUrl, fetchFn, signal, proxyGateways);
		if (directResponse) {
			return directResponse;
		}
	}

	if (proxyGateways.length === 0) {
		throw new RouteUnavailableError("Route lookup unavailable — manual entry enabled");
	}

	let lastError = null;
	for (const gateway of proxyGateways) {
		if (!gateway) continue;
		if (signal?.aborted) {
			const abortErr = new Error("The operation was aborted");
			abortErr.name = "AbortError";
			throw abortErr;
		}

		const proxiedUrl = buildProxiedUrl(gateway, targetUrl);
		const perProxyTimeout = AbortSignal.timeout(proxyTimeoutMs);
		const combined = combineSignals(signal ? [signal, perProxyTimeout] : [perProxyTimeout]);

		try {
			const proxyResponse = await fetchFn(proxiedUrl, { signal: combined.signal });
			if (proxyResponse.ok) {
				try {
					return await unwrapProxyEnvelope(proxyResponse, gateway);
				} catch (wrapErr) {
					lastError = wrapErr;
					continue;
				}
			}
			lastError = new Error(`Proxy ${gateway} returned HTTP ${proxyResponse.status}`);
		} catch (proxyErr) {
			if (proxyErr.name === "AbortError" && signal?.aborted) {
				throw proxyErr;
			}
			lastError = proxyErr;
		} finally {
			combined.cleanup();
		}
	}

	throw new RouteUnavailableError("Route lookup unavailable — manual entry enabled", lastError);
}

async function executeEsiFallbackRoute(
	origin,
	destination,
	options,
	fetchFn,
	primaryEngine,
	lastErr,
) {
	if (options.esiFallback === false || primaryEngine === "esi") {
		if (lastErr instanceof RouteUnavailableError || lastErr instanceof RouteNotFoundError) {
			throw lastErr;
		}
		throw new RouteUnavailableError("Route lookup unavailable — manual entry enabled", lastErr);
	}
	try {
		if (options.signal?.aborted) {
			throw options.signal.reason;
		}
		const esiTimeoutMs = options.esiTimeout ?? 6000;
		const esiTimeoutSignal = AbortSignal.timeout(esiTimeoutMs);
		const esiCombined = options.signal
			? combineSignals([options.signal, esiTimeoutSignal])
			: { signal: esiTimeoutSignal, cleanup: () => {} };

		try {
			return await fetchEsiRoute(origin, destination, {
				...options,
				signal: esiCombined.signal,
				fetch: fetchFn,
			});
		} finally {
			esiCombined.cleanup();
		}
	} catch (esiErr) {
		if (esiErr.name === "AbortError" && options.signal?.aborted) {
			throw esiErr;
		}
		if (esiErr instanceof RouteNotFoundError) {
			throw esiErr;
		}
		throw new RouteUnavailableError("Route lookup unavailable — manual entry enabled", esiErr);
	}
}

/**
 * Fetch shortest path between origin and destination systems with multi-tier failover.
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
function createTrivialZeroJumpRoute(origin, destination) {
	const directInfo = {
		name: "direct",
		jumps: 0,
		highSecJumps: 0,
		dangerousJumps: 0,
		systems: [{ name: origin, security: 1.0 }],
	};
	return {
		summary: {
			start: origin,
			end: destination,
			pref: "shortest",
			directJumps: 0,
			theraJumps: 0,
			recommended: "direct",
		},
		routes: {
			direct: [{ name: origin, security: 1.0 }],
		},
		direct: directInfo,
		thera: null,
		hasTheraShortcut: false,
		routeUsed: "direct",
		systems: directInfo.systems,
		highSecJumps: 0,
		dangerousJumps: 0,
		totalJumps: 0,
	};
}

async function handleEveRouteResponseError(response, runEsiFallback) {
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

	return await runEsiFallback(new Error(`HTTP ${response.status}: ${JSON.stringify(errBody)}`));
}

function buildRoutePathInfo(systems) {
	if (!Array.isArray(systems) || systems.length === 0) return null;
	const classification = classifyJumps(systems);
	return {
		systems,
		highSecJumps: classification.highSecJumps,
		dangerousJumps: classification.dangerousJumps,
		totalJumps: classification.highSecJumps + classification.dangerousJumps,
	};
}

function assembleEveRouteResult(data, options = {}) {
	const directInfo = buildRoutePathInfo(data?.routes?.direct);
	const theraInfo = buildRoutePathInfo(data?.routes?.thera);
	const hasTheraShortcut = Boolean(
		theraInfo && directInfo && theraInfo.totalJumps < directInfo.totalJumps,
	);

	const routeSelection = selectRouteForVolume(
		{ direct: directInfo, thera: theraInfo, hasTheraShortcut },
		options.volume,
		options,
	);

	const selectedRoute = routeSelection.selectedRoute || directInfo;

	return {
		summary: data.summary,
		routes: data.routes,
		direct: directInfo,
		thera: theraInfo,
		hasTheraShortcut,
		routeUsed: routeSelection.routeUsed,
		systems: selectedRoute.systems,
		highSecJumps: selectedRoute.highSecJumps,
		dangerousJumps: selectedRoute.dangerousJumps,
		totalJumps: selectedRoute.totalJumps,
	};
}

export async function fetchEveRoute(origin, destination, options = {}) {
	if (
		typeof origin !== "string" ||
		typeof destination !== "string" ||
		!origin.trim() ||
		!destination.trim()
	) {
		throw new Error("Origin and destination must be non-empty strings");
	}

	const trimmedOrigin = origin.trim();
	const trimmedDestination = destination.trim();

	// Identical systems require 0 jumps without a network request
	if (trimmedOrigin.toLowerCase() === trimmedDestination.toLowerCase()) {
		return createTrivialZeroJumpRoute(trimmedOrigin, trimmedDestination);
	}

	const url = buildRouteUrl(trimmedOrigin, trimmedDestination, options);
	const timeoutMs = options.timeout ?? DEFAULT_ROUTE_TIMEOUT_MS;
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
	const primaryEngine = options.primaryEngine || (options.esiPrimary ? "esi" : "eve-route");

	const runEsiFallback = (lastErr) =>
		executeEsiFallbackRoute(
			trimmedOrigin,
			trimmedDestination,
			options,
			fetchFn,
			primaryEngine,
			lastErr,
		);

	if (primaryEngine === "esi") {
		try {
			return await fetchEsiRoute(trimmedOrigin, trimmedDestination, {
				...options,
				signal,
				fetch: fetchFn,
			});
		} catch (esiErr) {
			if (esiErr.name === "AbortError" && options.signal?.aborted) {
				throw esiErr;
			}
			if (esiErr instanceof RouteNotFoundError) {
				throw esiErr;
			}
			if (options.fallbackToEveRoute === false) {
				throw new RouteUnavailableError("Route lookup unavailable — manual entry enabled", esiErr);
			}
			// Fall through to EVE TT secondary resolution below
		}
	}

	try {
		let response;
		try {
			response = await fetchWithCorsFallback(url, {
				signal,
				fetch: fetchFn,
				corsProxyGateway: options.corsProxyGateway,
				corsProxyGateways: options.corsProxyGateways,
				proxyTimeoutMs: options.proxyTimeoutMs,
			});
		} catch (fetchErr) {
			if (fetchErr.name === "AbortError" && options.signal?.aborted) {
				throw fetchErr;
			}
			return await runEsiFallback(fetchErr);
		}

		if (!response.ok) {
			return await handleEveRouteResponseError(response, runEsiFallback);
		}

		let data;
		try {
			data = await response.json();
		} catch (jsonErr) {
			if (jsonErr.name === "AbortError" && options.signal?.aborted) {
				throw jsonErr;
			}
			return await runEsiFallback(jsonErr);
		}
		const directSystems = data?.routes?.direct;

		if (!Array.isArray(directSystems) || directSystems.length === 0) {
			if (data && typeof data === "object" && "routes" in data) {
				throw new RouteNotFoundError("No route found avoiding specified systems");
			}
			return await runEsiFallback(new Error("Malformed route payload from EVE TT"));
		}

		return assembleEveRouteResult(data, options);
	} finally {
		cleanup();
	}
}
