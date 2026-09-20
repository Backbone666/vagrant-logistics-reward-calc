import { calcRewardDetails, parseNum } from "./calculator.js";
import {
	fetchEveRoute,
	JUMP_FREIGHTER_MAX_VOLUME,
	RouteNotFoundError,
	resolveAvoidList,
	selectRouteForVolume,
} from "./route-service.js";
import { attachSystemAutocomplete, isKnownSystem, loadSystemsData } from "./system-autocomplete.js";

const collateralInput = document.getElementById("collateral");
const highsecJumpsInput = document.getElementById("highsec_jumps");
const dangerousJumpsInput = document.getElementById("dangerous_jumps");
const jumpsGrid = document.getElementById("jumps_grid");
const toggleManualJumpsBtn = document.getElementById("toggle_manual_jumps");
const volumeInput = document.getElementById("volume");
const safeRouteCheckbox = document.getElementById("safe_route");
const forceJfCheckbox = document.getElementById("force_jf");
const originInput = document.getElementById("origin_system");
const destinationInput = document.getElementById("destination_system");
const originList = document.getElementById("origin_system_list");
const destinationList = document.getElementById("destination_system_list");
const routeStatus = document.getElementById("route-status");
const routeJumpsSummary = document.getElementById("route-jumps-summary");
const theraBadge = document.getElementById("thera-badge");

const rewardOutput = document.getElementById("reward_output");
const rewardIpjOutput = document.getElementById("reward_ipj_output");
const copyBtn = document.getElementById("copy_btn");
const copyQuoteBtn = document.getElementById("copy_quote_btn");
const clearBtn = document.getElementById("clear_btn");
const feeBreakdown = document.getElementById("fee_breakdown");
const bdService = document.getElementById("bd_service");
const bdBase = document.getElementById("bd_base");
const bdDistanceLabel = document.getElementById("bd_distance_label");
const bdDistance = document.getElementById("bd_distance");
const bdCollateral = document.getElementById("bd_collateral");
const bdSecurity = document.getElementById("bd_security");
const configWarning = document.getElementById("config-warning");
const calcCard = document.querySelector(".calculator-card");
const presetBtns = document.querySelectorAll(".preset-btn");
const miniCopyBtns = document.querySelectorAll(".btn-mini-copy");
const toFormatNumberInputs = document.querySelectorAll(".to_format_number");
const toChangeElements = document.querySelectorAll(".to_change");

let currentReward = 0;
let config = null;
let lastRouteResult = null;

const FALLBACK_CONFIG = {
	highsec_services: {
		blockade_runner_dst: {
			hull_class: "BR / DST Highsec Standard",
			base_rate_per_jump: 1500000,
			minimum_contract_fee: 4500000,
			collateral_brackets: [
				{ max_collateral_isk: 1500000000, multiplier: 1.0, surcharge: 0 },
				{ max_collateral_isk: 2000000000, multiplier: 1.8, surcharge: 0 },
				{ max_collateral_isk: 3000000000, multiplier: 2.2, surcharge: 0 },
				{ max_collateral_isk: 5000000000, multiplier: 4.0, surcharge: 0 },
				{
					max_collateral_isk: 10000000000,
					multiplier: 4.0,
					surcharge: 12000000,
				},
			],
		},
		freighter_standard: {
			hull_class: "Freighter / Bowhead / Avalanche",
			base_rate_per_jump: 1750000,
			minimum_contract_fee: 10000000,
			collateral_brackets: [
				{ max_collateral_isk: 1500000000, multiplier: 1.0 },
				{ max_collateral_isk: 3000000000, multiplier: 1.8 },
				{ max_collateral_isk: 5000000000, multiplier: 3.5 },
			],
		},
	},
	dangerous_space_services: {
		blockade_runner_stargate: {
			hull_class: "Blockade Runner",
			base_rate_isk: 10000000,
			base_rate_per_jump_dangerous: 2000000,
			base_rate_per_jump_highsec: 1500000,
			max_collateral_isk: 5000000000,
		},
		scouted_dst_stargate: {
			hull_class: "Deep Space Transport",
			base_rate_isk: 20000000,
			base_rate_per_jump_dangerous: 5000000,
			base_rate_per_jump_highsec: 2000000,
			max_collateral_isk: 3000000000,
		},
		jump_freighter_standard: {
			hull_class: "Jump Freighter",
			base_rate_isk: 150000000,
			cyno_jump_fee_isk: 35000000,
			max_collateral_isk: 50000000000,
		},
	},
	operational_modifiers: {},
};

// Fetch dynamic configuration
async function loadConfig() {
	try {
		// Include cache-buster and no-cache header to bypass stale/broken browser or proxy caches
		const response = await fetch(`./rate_card_config.json?t=${Date.now()}`, {
			cache: "no-cache",
		});
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		config = await response.json();
		try {
			localStorage.setItem("vagrant_logistics_rate_config", JSON.stringify(config));
		} catch (e) {
			console.warn("Failed to cache configuration to localStorage:", e);
		}
		configWarning.classList.add("hidden");
		updateAll();
	} catch (err) {
		console.warn("Failed to load dynamic rates, trying local fallbacks:", err);
		if (!config) {
			config = FALLBACK_CONFIG;
		}
		configWarning.textContent = `Failed to load live rates (${err.message || err}). Operating in cached offline mode.`;
		configWarning.classList.remove("hidden");
		updateAll();
	}
}

// Memoized number formatter
const numberFormatter = new Intl.NumberFormat("en-US");

const formatNumber = (val, allowDecimal = true) => {
	const regex = allowDecimal ? /[^0-9.]/g : /[^0-9]/g;
	let cleaned = val.toString().replace(regex, "");

	if (allowDecimal) {
		const parts = cleaned.split(".");
		if (parts.length > 2) {
			cleaned = `${parts[0]}.${parts.slice(1).join("")}`;
		}
	}

	if (!cleaned) return "";

	if (allowDecimal && cleaned.includes(".")) {
		const [integerPart, decimalPart] = cleaned.split(".");
		if (integerPart === "") return `.${decimalPart}`;
		const formattedInteger = numberFormatter.format(integerPart);
		return `${formattedInteger}.${decimalPart}`;
	}
	return numberFormatter.format(cleaned);
};

function syncUrlParams(options) {
	const url = new URL(window.location);
	const params = {
		c: options.collateral.replace(/,/g, ""),
		hj: options.highsecJumps.replace(/,/g, ""),
		dj: options.dangerousJumps.replace(/,/g, ""),
		v: options.volume.replace(/,/g, ""),
		sr: options.safeRoute === false ? "0" : "",
		jf: options.forceJF ? "1" : "",
		from: options.origin || "",
		to: options.destination || "",
	};

	for (const [key, val] of Object.entries(params)) {
		if (val) {
			url.searchParams.set(key, val);
		} else {
			url.searchParams.delete(key);
		}
	}

	// Wrap in try-catch to prevent SecurityError in sandboxed iframe or EVE webview environments
	try {
		window.history.replaceState({}, "", url.toString());
	} catch (e) {
		console.warn("Failed to update URL parameters (history API restricted):", e);
	}
}

let syncUrlTimeout = null;
function debouncedSyncUrlParams(options) {
	if (syncUrlTimeout) clearTimeout(syncUrlTimeout);
	syncUrlTimeout = setTimeout(() => {
		syncUrlTimeout = null;
		syncUrlParams(options);
	}, 200);
}

function updateRouteJumpsSummary(highSecJumps, dangerousJumps) {
	if (!routeJumpsSummary) return;
	const hs = parseNum(highSecJumps) || 0;
	const dang = parseNum(dangerousJumps) || 0;
	const origin = originInput?.value?.trim() || "";
	const dest = destinationInput?.value?.trim() || "";

	if (hs === 0 && dang === 0 && !origin && !dest) {
		routeJumpsSummary.classList.add("hidden");
		routeJumpsSummary.textContent = "";
		routeJumpsSummary.classList.remove("has-dangerous");
		return;
	}

	const total = hs + dang;
	if (dang > 0) {
		routeJumpsSummary.textContent = `${total} Jumps (${hs} HS / ${dang} Dangerous)`;
		routeJumpsSummary.classList.add("has-dangerous");
	} else {
		routeJumpsSummary.textContent = `${total} Jumps (${total} HighSec)`;
		routeJumpsSummary.classList.remove("has-dangerous");
	}
	routeJumpsSummary.classList.remove("hidden");
}

function syncSafeRouteLock(volume) {
	if (!safeRouteCheckbox) return;
	const parsedVolume = parseNum(volume);
	const isOverJfVolume = parsedVolume > JUMP_FREIGHTER_MAX_VOLUME;

	if (isOverJfVolume) {
		safeRouteCheckbox.checked = true;
		safeRouteCheckbox.disabled = true;
		safeRouteCheckbox.parentElement?.classList.add("locked");
		safeRouteCheckbox.title =
			"Safe Route (High-Sec only) enforced: Volume exceeds Jump Freighter capacity (360,000 m³). Freighters cannot traverse dangerous space.";
	} else {
		safeRouteCheckbox.disabled = false;
		safeRouteCheckbox.parentElement?.classList.remove("locked");
		safeRouteCheckbox.removeAttribute("title");
	}
}

function getFormInputs() {
	return {
		volume: volumeInput.value,
		collateral: collateralInput.value,
		highsecJumps: highsecJumpsInput.value,
		dangerousJumps: dangerousJumpsInput.value,
		safeRoute: safeRouteCheckbox ? safeRouteCheckbox.checked : false,
		forceJF: forceJfCheckbox.checked,
		origin: originInput?.value?.trim().slice(0, 50) || "",
		destination: destinationInput?.value?.trim().slice(0, 50) || "",
	};
}

function syncPresets(volumeStr) {
	presetBtns.forEach((btn) => {
		const btnVal = btn.getAttribute("data-val");
		if (volumeStr === btnVal) {
			btn.classList.add("active");
		} else {
			btn.classList.remove("active");
		}
	});
}

function renderBreakdown(details) {
	if (details.error || details.isRedirect) {
		feeBreakdown.classList.add("placeholder-active");
		bdService.textContent = "—";
		bdBase.textContent = "—";
		bdDistance.textContent = "—";
		bdCollateral.textContent = "—";
		bdSecurity.textContent = "—";
		if (bdDistanceLabel) {
			bdDistanceLabel.textContent = "Distance Jump Fee:";
		}

		if (
			details.isRedirect &&
			(details.redirectTarget === "Risako Hirano" || details.redirectTarget === "Executive Review")
		) {
			copyBtn.disabled = false;
			copyQuoteBtn.disabled = false;
		} else {
			copyBtn.disabled = true;
			copyQuoteBtn.disabled = true;
		}
	} else {
		feeBreakdown.classList.remove("placeholder-active");

		bdService.textContent = details.serviceName || "Standard Sub-Capital";
		if (bdDistanceLabel) {
			bdDistanceLabel.textContent = details.distanceLabel || "Distance Jump Fee:";
		}

		bdBase.textContent = `${formatNumber(details.baseFee)} ISK`;
		bdDistance.textContent = `${formatNumber(details.distanceFee)} ISK`;
		bdCollateral.textContent = `${formatNumber(details.collateralFee)} ISK`;
		bdSecurity.textContent = `${details.multiplier}x`;

		copyBtn.disabled = false;
		copyQuoteBtn.disabled = false;
	}
}

function renderReward(reward, rawJumps) {
	rewardOutput.classList.remove("small");

	if (typeof reward === "string") {
		rewardOutput.textContent = reward;
		if (reward !== "Risako Hirano" && reward !== "Executive Review") {
			rewardOutput.classList.add("small");
		}
		rewardIpjOutput.textContent = "Contact in game";
	} else if (reward > 0) {
		rewardOutput.textContent = `${formatNumber(reward)} ISK`;

		const ipj = reward / rawJumps;
		rewardIpjOutput.textContent = `${formatNumber(Math.ceil(ipj))} ISK/Jump`;
	} else {
		rewardOutput.textContent = "0 ISK";
		rewardIpjOutput.textContent = "0 ISK/Jump";
	}
}

const scheduleFrame =
	typeof requestAnimationFrame === "function" ? requestAnimationFrame : (cb) => cb();

let renderRafId = null;
let lastDetails = null;

function updateAll() {
	if (!config) return;

	const options = getFormInputs();
	debouncedSyncUrlParams(options);

	const hsJumps = parseNum(options.highsecJumps);
	const dangerousJumps = parseNum(options.dangerousJumps);
	const isDangerous = dangerousJumps > 0 || options.forceJF;
	const details = calcRewardDetails({ ...options, highsecJumps: hsJumps, dangerousJumps, config });
	lastDetails = details;

	const reward = details.error
		? 0
		: details.isRedirect
			? details.redirectTarget
			: details.finalTotal;
	currentReward = reward;
	const rawJumps = hsJumps + dangerousJumps || 1;

	if (renderRafId && typeof cancelAnimationFrame === "function") {
		cancelAnimationFrame(renderRafId);
	}
	renderRafId = scheduleFrame(() => {
		renderRafId = null;
		if (calcCard) {
			calcCard.classList.toggle("route-dangerous", isDangerous);
		}
		renderBreakdown(details);
		syncPresets(options.volume);
		renderReward(reward, rawJumps);
	});
}

function setRouteStatus(type, message) {
	if (!routeStatus) return;
	routeStatus.className = "route-status";
	if (!message) {
		routeStatus.textContent = "";
		return;
	}
	if (type === "loading") {
		routeStatus.classList.add("loading");
		routeStatus.innerHTML = `<span class="route-spinner" aria-hidden="true"></span><span>${message}</span>`;
	} else {
		if (type) routeStatus.classList.add(type);
		routeStatus.textContent = message;
	}
}

let routeDebounceTimer = null;
let routeAbortController = null;

const ROUTE_DEBOUNCE_MS = 350;

function cancelPendingRouteLookup() {
	if (routeDebounceTimer) {
		clearTimeout(routeDebounceTimer);
		routeDebounceTimer = null;
	}
	if (routeAbortController) {
		routeAbortController.abort();
		routeAbortController = null;
	}
	if (routeStatus?.classList.contains("loading")) {
		setRouteStatus("", "");
	}
}

let isManualJumpEntryEnabled = false;

export function setManualJumpVisibility(show) {
	isManualJumpEntryEnabled = show;
	if (jumpsGrid) {
		jumpsGrid.classList.toggle("hidden", !show);
	}
	if (toggleManualJumpsBtn) {
		toggleManualJumpsBtn.setAttribute("aria-expanded", show ? "true" : "false");
		toggleManualJumpsBtn.textContent = show ? "Hide manual jumps" : "Enter jumps manually";
	}
}

if (toggleManualJumpsBtn) {
	toggleManualJumpsBtn.addEventListener("click", () => {
		setManualJumpVisibility(!isManualJumpEntryEnabled);
		if (isManualJumpEntryEnabled) {
			highsecJumpsInput?.focus();
		}
	});
}

function updateTheraBadge(selection) {
	if (!theraBadge) return;
	if (!selection || !selection.hasTheraShortcut || !lastRouteResult?.thera) {
		theraBadge.className = "thera-badge hidden";
		theraBadge.textContent = "";
		theraBadge.removeAttribute("title");
		return;
	}

	const theraJumps = lastRouteResult.thera.totalJumps;
	const directJumps = lastRouteResult.direct?.totalJumps ?? 0;

	if (selection.routeUsed === "thera") {
		theraBadge.className = "thera-badge thera-active";
		theraBadge.textContent = `⚡ Via Thera (${theraJumps} jumps)`;
		theraBadge.title = `Thera wormhole shortcut active (${theraJumps} jumps vs ${directJumps} stargate jumps). Supported for Blockade Runners (≤ 12,500 m³).`;
	} else {
		theraBadge.className = "thera-badge thera-available";
		theraBadge.textContent = `🌀 Thera shortcut: ${theraJumps}j (BR only)`;
		theraBadge.title = `A ${theraJumps}-jump Thera wormhole shortcut exists for Blockade Runners (≤ 12,500 m³). Stargate route (${directJumps} jumps) required for larger hulls.`;
	}
}

export function applyRouteSelection() {
	if (!lastRouteResult) return;
	const selection = selectRouteForVolume(lastRouteResult, volumeInput?.value);
	if (!selection.selectedRoute) return;

	highsecJumpsInput.value = formatNumber(selection.selectedRoute.highSecJumps, false);
	dangerousJumpsInput.value = formatNumber(selection.selectedRoute.dangerousJumps, false);
	updateTheraBadge(selection);
	updateRouteJumpsSummary(
		selection.selectedRoute.highSecJumps,
		selection.selectedRoute.dangerousJumps,
	);
	updateAll();
}

function handleRouteInputChange() {
	cancelPendingRouteLookup();

	const origin = originInput?.value?.trim() || "";
	const destination = destinationInput?.value?.trim() || "";

	if (!origin || !destination) {
		lastRouteResult = null;
		updateTheraBadge(null);
		updateRouteJumpsSummary(0, 0);
		setRouteStatus("", "");
		return;
	}

	if (origin.toLowerCase() === destination.toLowerCase()) {
		lastRouteResult = null;
		updateTheraBadge(null);
		highsecJumpsInput.value = "0";
		dangerousJumpsInput.value = "0";
		updateRouteJumpsSummary(0, 0);
		setRouteStatus("", "");
		updateAll();
		return;
	}

	routeDebounceTimer = setTimeout(async () => {
		routeDebounceTimer = null;
		const controller = new AbortController();
		routeAbortController = controller;

		setRouteStatus("loading", "Calculating route...");

		try {
			const avoid = resolveAvoidList(config?.mandatory_avoid_systems);
			const routing = config?.routing;
			const isSafe = safeRouteCheckbox ? safeRouteCheckbox.checked : false;
			const result = await fetchEveRoute(origin, destination, {
				signal: controller.signal,
				avoid,
				safeRoute: isSafe,
				pref: isSafe ? "safest" : "shortest",
				volume: volumeInput?.value,
				primaryEngine: routing?.primary_engine || "eve-route",
				corsProxyGateway: routing?.cors_proxy_gateway,
				corsProxyGateways: routing?.cors_proxy_gateways,
				proxyTimeoutMs: routing?.proxy_timeout_ms,
				esiFallback: routing?.esi_fallback_enabled,
			});

			if (controller.signal.aborted) return;

			lastRouteResult = result;
			setRouteStatus("", "");
			applyRouteSelection();
		} catch (err) {
			if (controller.signal.aborted || err.name === "AbortError") {
				return;
			}
			lastRouteResult = null;
			updateTheraBadge(null);
			if (err instanceof RouteNotFoundError || err.code === "NO_ROUTE") {
				setRouteStatus("warning", "No route found avoiding specified systems");
				setManualJumpVisibility(true);
			} else {
				console.warn("Route lookup unavailable:", err);
				setRouteStatus("warning", "Route lookup unavailable — manual entry enabled");
				setManualJumpVisibility(true);
			}
		} finally {
			if (routeAbortController === controller) {
				routeAbortController = null;
			}
		}
	}, ROUTE_DEBOUNCE_MS);
}

export async function checkAndTriggerRouteLookup() {
	const origin = originInput?.value?.trim() || "";
	const destination = destinationInput?.value?.trim() || "";

	if (!origin || !destination) {
		setRouteStatus("", "");
		return;
	}

	const systems = await loadSystemsData();
	if (systems && systems.length > 0) {
		if (!isKnownSystem(origin, systems) || !isKnownSystem(destination, systems)) {
			return;
		}

		const matchOrigin = systems.find((s) => s.toLowerCase() === origin.toLowerCase());
		const matchDest = systems.find((s) => s.toLowerCase() === destination.toLowerCase());
		if (matchOrigin && originInput.value !== matchOrigin) originInput.value = matchOrigin;
		if (matchDest && destinationInput.value !== matchDest) destinationInput.value = matchDest;
	}

	handleRouteInputChange();
}

async function copyTextToClipboard(text) {
	if (navigator.clipboard?.writeText) {
		try {
			await navigator.clipboard.writeText(text);
			return true;
		} catch (e) {
			console.warn("navigator.clipboard.writeText failed, attempting fallback:", e);
		}
	}

	try {
		const textArea = document.createElement("textarea");
		textArea.value = text;
		textArea.style.position = "fixed";
		textArea.style.left = "-9999px";
		textArea.style.top = "0";
		textArea.setAttribute("readonly", "");
		document.body.appendChild(textArea);
		textArea.focus();
		textArea.select();
		const successful = document.execCommand("copy");
		document.body.removeChild(textArea);
		return successful;
	} catch (fallbackErr) {
		console.error("Fallback clipboard copy failed:", fallbackErr);
		return false;
	}
}

function triggerCopyFeedback(btn, success, successText, duration = 2000) {
	const originalText = btn.getAttribute("data-original-text") || btn.textContent;
	btn.setAttribute("data-original-text", originalText);
	btn.textContent = success ? successText : "Copy Failed!";
	btn.classList.toggle("copied", success);
	btn.classList.toggle("copy-failed", !success);

	setTimeout(() => {
		btn.textContent = originalText;
		btn.classList.remove("copied", "copy-failed");
	}, duration);
}

// Mini copy buttons
miniCopyBtns.forEach((btn) => {
	btn.addEventListener("click", async () => {
		const val = btn.getAttribute("data-copy");
		const success = await copyTextToClipboard(val);
		triggerCopyFeedback(btn, success, "Copied!", 1500);
	});
});

// Live formatting as user types
toFormatNumberInputs.forEach((input) => {
	input.addEventListener("input", (e) => {
		if (e.target === highsecJumpsInput || e.target === dangerousJumpsInput) {
			cancelPendingRouteLookup();
			lastRouteResult = null;
			updateTheraBadge(null);
			updateRouteJumpsSummary(highsecJumpsInput.value, dangerousJumpsInput.value);
		}

		const start = e.target.selectionStart;
		const end = e.target.selectionEnd;
		const oldLen = e.target.value.length;

		const isDecimalAllowed = e.target.id === "collateral" || e.target.id === "volume";
		e.target.value = formatNumber(e.target.value, isDecimalAllowed);

		const newLen = e.target.value.length;
		const delta = newLen - oldLen;

		e.target.setSelectionRange(start + delta, end + delta);

		if (e.target === volumeInput) {
			const wasOverJf = safeRouteCheckbox?.disabled;
			syncSafeRouteLock(e.target.value);
			const isNowOverJf = safeRouteCheckbox?.disabled;
			const origin = originInput?.value?.trim() || "";
			const dest = destinationInput?.value?.trim() || "";
			if (
				!wasOverJf &&
				isNowOverJf &&
				origin &&
				dest &&
				typeof checkAndTriggerRouteLookup === "function"
			) {
				checkAndTriggerRouteLookup();
			} else if (lastRouteResult) {
				applyRouteSelection();
			} else {
				updateAll();
			}
		} else {
			updateAll();
		}
	});
});

toChangeElements.forEach((el) => {
	el.addEventListener("change", updateAll);
});

function handleSystemInputChange(e) {
	const val = e.target.value.trim();
	if (!val) {
		setRouteStatus("", "");
		updateRouteJumpsSummary(0, 0);
	}
	syncUrlParams(getFormInputs());
}

if (originInput) {
	originInput.addEventListener("input", handleSystemInputChange);
	originInput.addEventListener("change", () => checkAndTriggerRouteLookup());
	originInput.addEventListener("keydown", (e) => {
		if (e.key === "Enter") {
			checkAndTriggerRouteLookup();
		}
	});
}
if (destinationInput) {
	destinationInput.addEventListener("input", handleSystemInputChange);
	destinationInput.addEventListener("change", () => checkAndTriggerRouteLookup());
	destinationInput.addEventListener("keydown", (e) => {
		if (e.key === "Enter") {
			checkAndTriggerRouteLookup();
		}
	});
}

presetBtns.forEach((btn) => {
	btn.addEventListener("click", () => {
		presetBtns.forEach((b) => {
			b.classList.remove("active");
		});
		btn.classList.add("active");

		volumeInput.value = formatNumber(btn.getAttribute("data-val"));
		const wasOverJf = safeRouteCheckbox?.disabled;
		syncSafeRouteLock(volumeInput.value);
		const isNowOverJf = safeRouteCheckbox?.disabled;
		const origin = originInput?.value?.trim() || "";
		const dest = destinationInput?.value?.trim() || "";
		if (
			!wasOverJf &&
			isNowOverJf &&
			origin &&
			dest &&
			typeof checkAndTriggerRouteLookup === "function"
		) {
			checkAndTriggerRouteLookup();
		} else if (lastRouteResult) {
			applyRouteSelection();
		} else {
			updateAll();
		}
	});
});

copyBtn.addEventListener("click", async () => {
	let textToCopy = "";

	if (currentReward === "Risako Hirano" || currentReward === "Executive Review") {
		textToCopy = currentReward;
	} else if (typeof currentReward === "number" && currentReward > 0) {
		textToCopy = currentReward.toString();
	}

	if (textToCopy) {
		const success = await copyTextToClipboard(textToCopy);
		const label =
			currentReward === "Risako Hirano" || currentReward === "Executive Review"
				? "Name Copied!"
				: "Reward Copied!";
		triggerCopyFeedback(copyBtn, success, label);
	}
});

copyQuoteBtn.addEventListener("click", async () => {
	const details = lastDetails;
	if (!details || details.error) return;

	if (syncUrlTimeout) {
		clearTimeout(syncUrlTimeout);
		syncUrlTimeout = null;
	}
	syncUrlParams(getFormInputs());

	let detailsText = "";
	if (details.isRedirect) {
		detailsText = `Redirect to: ${details.redirectTarget}`;
	} else {
		detailsText = `${formatNumber(details.finalTotal)} ISK`;
	}

	const originVal = originInput?.value?.trim();
	const destVal = destinationInput?.value?.trim();
	const viaTheraTag = lastRouteResult?.routeUsed === "thera" ? " [via Thera]" : "";
	const routeLabel =
		originVal && destVal
			? `Route: ${originVal} → ${destVal}${viaTheraTag} (${highsecJumpsInput.value || 0} HighSec / ${dangerousJumpsInput.value || 0} Dangerous Jumps)`
			: `Route: ${highsecJumpsInput.value || 0} HighSec / ${dangerousJumpsInput.value || 0} Dangerous Jumps`;

	const template = [
		"Vagrant Logistics Courier Quote",
		"------------------------------",
		`Volume: ${volumeInput.value || 0} m³`,
		`Collateral: ${collateralInput.value || 0} ISK`,
		routeLabel,
		`Routing: ${safeRouteCheckbox?.checked ? "Safe Route (Prefer Highsec)" : "Shortest Route"}`,
		`Estimated Reward: ${detailsText}`,
		`Link: ${window.location.href}`,
	].join("\n");

	const success = await copyTextToClipboard(template);
	triggerCopyFeedback(copyQuoteBtn, success, "Quote Copied!");
});

if (safeRouteCheckbox) {
	safeRouteCheckbox.addEventListener("change", () => {
		const origin = originInput?.value?.trim() || "";
		const destination = destinationInput?.value?.trim() || "";
		if (origin && destination && typeof checkAndTriggerRouteLookup === "function") {
			checkAndTriggerRouteLookup();
		}
		updateAll();
	});
}

clearBtn.addEventListener("click", () => {
	cancelPendingRouteLookup();
	lastRouteResult = null;
	updateTheraBadge(null);
	updateRouteJumpsSummary(0, 0);
	if (originInput) originInput.value = "";
	if (destinationInput) destinationInput.value = "";
	setRouteStatus("", "");

	collateralInput.value = "";
	highsecJumpsInput.value = "";
	dangerousJumpsInput.value = "";
	volumeInput.value = "";
	if (safeRouteCheckbox) {
		safeRouteCheckbox.checked = false;
		safeRouteCheckbox.disabled = false;
		safeRouteCheckbox.parentElement?.classList.remove("locked");
		safeRouteCheckbox.removeAttribute("title");
	}
	forceJfCheckbox.checked = false;
	setManualJumpVisibility(false);
	updateAll();
	if (syncUrlTimeout) {
		clearTimeout(syncUrlTimeout);
		syncUrlTimeout = null;
	}
	syncUrlParams(getFormInputs());
});

// Initialize inputs from URL params
function clampInputVal(rawVal, min, max, allowDecimal = false) {
	if (rawVal === null || rawVal === undefined || rawVal === "") return "";
	const num = parseNum(rawVal);
	if (Number.isNaN(num) || num < min) return formatNumber(min, allowDecimal);
	if (num > max) return formatNumber(max, allowDecimal);
	return formatNumber(rawVal, allowDecimal);
}

function initParamsFromUrl() {
	try {
		const urlParams = new URLSearchParams(window.location.search);

		if (urlParams.has("c")) {
			collateralInput.value = clampInputVal(urlParams.get("c"), 0, 100_000_000_000, true);
		}
		if (urlParams.has("hj")) {
			highsecJumpsInput.value = clampInputVal(urlParams.get("hj"), 0, 100, false);
		}
		if (urlParams.has("dj")) {
			dangerousJumpsInput.value = clampInputVal(urlParams.get("dj"), 0, 100, false);
		}
		if (
			(urlParams.has("hj") && urlParams.get("hj") !== "0") ||
			(urlParams.has("dj") && urlParams.get("dj") !== "0")
		) {
			setManualJumpVisibility(true);
		}
		if (urlParams.has("v")) {
			volumeInput.value = clampInputVal(urlParams.get("v"), 0, 1_500_000, true);
		}
		if (safeRouteCheckbox) {
			safeRouteCheckbox.checked = urlParams.get("sr") === "1";
		}
		syncSafeRouteLock(volumeInput?.value);
		if (urlParams.get("jf") === "1") forceJfCheckbox.checked = true;

		if (urlParams.has("from") && originInput) {
			originInput.value = urlParams.get("from").trim().slice(0, 50);
		}
		if (urlParams.has("to") && destinationInput) {
			destinationInput.value = urlParams.get("to").trim().slice(0, 50);
		}

		if (highsecJumpsInput.value || dangerousJumpsInput.value) {
			updateRouteJumpsSummary(highsecJumpsInput.value, dangerousJumpsInput.value);
		}

		if (
			urlParams.has("from") &&
			urlParams.has("to") &&
			!urlParams.has("hj") &&
			!urlParams.has("dj") &&
			typeof checkAndTriggerRouteLookup === "function"
		) {
			checkAndTriggerRouteLookup();
		}
	} catch (err) {
		console.warn("Failed to parse URL query parameters defensively:", err);
	}
}

// Attach autocomplete to origin and destination inputs
if (originInput && originList) {
	attachSystemAutocomplete(originInput, originList, {
		onSelect: () => checkAndTriggerRouteLookup(),
	});
}
if (destinationInput && destinationList) {
	attachSystemAutocomplete(destinationInput, destinationList, {
		onSelect: () => checkAndTriggerRouteLookup(),
	});
}

// Load config dynamically on startup
initParamsFromUrl();
syncUrlParams(getFormInputs());

// Try loading from localStorage first to render instantly
try {
	const cachedConfig = localStorage.getItem("vagrant_logistics_rate_config");
	if (cachedConfig) {
		config = JSON.parse(cachedConfig);
		updateAll();
	}
} catch (e) {
	console.warn("Failed to parse cached configuration:", e);
}

loadConfig();
