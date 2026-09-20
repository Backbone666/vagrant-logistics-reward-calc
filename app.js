import { calcRewardDetails, parseNum } from "./calculator.js";
import { fetchEveRoute, RouteNotFoundError, resolveAvoidList } from "./route-service.js";

const collateralInput = document.getElementById("collateral");
const highsecJumpsInput = document.getElementById("highsec_jumps");
const dangerousJumpsInput = document.getElementById("dangerous_jumps");
const volumeInput = document.getElementById("volume");
const rushCheckbox = document.getElementById("rush");
const forceJfCheckbox = document.getElementById("force_jf");
const originInput = document.getElementById("origin_system");
const destinationInput = document.getElementById("destination_system");
const routeStatus = document.getElementById("route-status");

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
const bdRushRow = document.getElementById("bd_rush_row");
const bdRush = document.getElementById("bd_rush");
const configWarning = document.getElementById("config-warning");
const calcCard = document.querySelector(".calculator-card");
const presetBtns = document.querySelectorAll(".preset-btn");
const miniCopyBtns = document.querySelectorAll(".btn-mini-copy");
const toFormatNumberInputs = document.querySelectorAll(".to_format_number");
const toChangeElements = document.querySelectorAll(".to_change");

let currentReward = 0;
let config = null;

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
	operational_modifiers: {
		rush_surcharge_subcapital: 45000000,
		rush_surcharge_jf: 150000000,
	},
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
		r: options.rush ? "1" : "",
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

function getFormInputs() {
	return {
		volume: volumeInput.value,
		collateral: collateralInput.value,
		highsecJumps: highsecJumpsInput.value,
		dangerousJumps: dangerousJumpsInput.value,
		rush: rushCheckbox.checked,
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

		if (details.rushFee > 0) {
			bdRushRow.style.display = "flex";
			bdRush.textContent = `${formatNumber(details.rushFee)} ISK`;
		} else {
			bdRushRow.style.display = "none";
		}

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

function handleRouteInputChange() {
	cancelPendingRouteLookup();

	const origin = originInput?.value?.trim() || "";
	const destination = destinationInput?.value?.trim() || "";

	if (!origin || !destination) {
		setRouteStatus("", "");
		return;
	}

	if (origin.toLowerCase() === destination.toLowerCase()) {
		highsecJumpsInput.value = "0";
		dangerousJumpsInput.value = "0";
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
			const result = await fetchEveRoute(origin, destination, {
				signal: controller.signal,
				avoid,
			});

			if (controller.signal.aborted) return;

			highsecJumpsInput.value = formatNumber(result.highSecJumps, false);
			dangerousJumpsInput.value = formatNumber(result.dangerousJumps, false);
			setRouteStatus("", "");
			updateAll();
		} catch (err) {
			if (controller.signal.aborted || err.name === "AbortError") {
				return;
			}
			if (err instanceof RouteNotFoundError || err.code === "NO_ROUTE") {
				setRouteStatus("warning", "No route found avoiding specified systems");
			} else {
				console.warn("Route lookup unavailable:", err);
				setRouteStatus("warning", "Route lookup unavailable — manual entry enabled");
			}
		} finally {
			if (routeAbortController === controller) {
				routeAbortController = null;
			}
		}
	}, ROUTE_DEBOUNCE_MS);
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
		}

		const start = e.target.selectionStart;
		const end = e.target.selectionEnd;
		const oldLen = e.target.value.length;

		const isDecimalAllowed = e.target.id === "collateral" || e.target.id === "volume";
		e.target.value = formatNumber(e.target.value, isDecimalAllowed);

		const newLen = e.target.value.length;
		const delta = newLen - oldLen;

		e.target.setSelectionRange(start + delta, end + delta);
		updateAll();
	});
});

toChangeElements.forEach((el) => {
	el.addEventListener("change", updateAll);
});

if (originInput) {
	originInput.addEventListener("input", handleRouteInputChange);
}
if (destinationInput) {
	destinationInput.addEventListener("input", handleRouteInputChange);
}

presetBtns.forEach((btn) => {
	btn.addEventListener("click", () => {
		presetBtns.forEach((b) => {
			b.classList.remove("active");
		});
		btn.classList.add("active");

		volumeInput.value = formatNumber(btn.getAttribute("data-val"));
		updateAll();
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
	const routeLabel =
		originVal && destVal
			? `Route: ${originVal} → ${destVal} (${highsecJumpsInput.value || 0} HighSec / ${dangerousJumpsInput.value || 0} Dangerous Jumps)`
			: `Route: ${highsecJumpsInput.value || 0} HighSec / ${dangerousJumpsInput.value || 0} Dangerous Jumps`;

	const template = [
		"Vagrant Logistics Courier Quote",
		"------------------------------",
		`Volume: ${volumeInput.value || 0} m³`,
		`Collateral: ${collateralInput.value || 0} ISK`,
		routeLabel,
		`Rush Service: ${rushCheckbox.checked ? "Yes" : "No"}`,
		`Estimated Reward: ${detailsText}`,
		`Link: ${window.location.href}`,
	].join("\n");

	const success = await copyTextToClipboard(template);
	triggerCopyFeedback(copyQuoteBtn, success, "Quote Copied!");
});

clearBtn.addEventListener("click", () => {
	cancelPendingRouteLookup();
	if (originInput) originInput.value = "";
	if (destinationInput) destinationInput.value = "";
	setRouteStatus("", "");

	collateralInput.value = "";
	highsecJumpsInput.value = "";
	dangerousJumpsInput.value = "";
	volumeInput.value = "";
	rushCheckbox.checked = false;
	forceJfCheckbox.checked = false;
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
		if (urlParams.has("v")) {
			volumeInput.value = clampInputVal(urlParams.get("v"), 0, 1_500_000, true);
		}
		if (urlParams.get("r") === "1") rushCheckbox.checked = true;
		if (urlParams.get("jf") === "1") forceJfCheckbox.checked = true;

		if (urlParams.has("from") && originInput) {
			originInput.value = urlParams.get("from").trim().slice(0, 50);
		}
		if (urlParams.has("to") && destinationInput) {
			destinationInput.value = urlParams.get("to").trim().slice(0, 50);
		}

		if (
			(urlParams.has("from") || urlParams.has("to")) &&
			!urlParams.has("hj") &&
			!urlParams.has("dj") &&
			typeof handleRouteInputChange === "function"
		) {
			handleRouteInputChange();
		}
	} catch (err) {
		console.warn("Failed to parse URL query parameters defensively:", err);
	}
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
