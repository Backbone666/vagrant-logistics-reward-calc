import { calcRewardDetails, parseNum } from "./calculator.js";

const collateralInput = document.getElementById("collateral");
const highsecJumpsInput = document.getElementById("highsec_jumps");
const dangerousJumpsInput = document.getElementById("dangerous_jumps");
const volumeInput = document.getElementById("volume");
const rushCheckbox = document.getElementById("rush");
const forceJfCheckbox = document.getElementById("force_jf");

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
			hull_class: "Freighter Standard",
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
			hull_class: "BR Dangerous Stargate",
			base_rate_isk: 10000000,
			base_rate_per_jump_dangerous: 2000000,
			base_rate_per_jump_highsec: 1500000,
			max_collateral_isk: 5000000000,
		},
		scouted_dst_stargate: {
			hull_class: "DST Dangerous Stargate (Scouted)",
			base_rate_isk: 20000000,
			base_rate_per_jump_dangerous: 5000000,
			base_rate_per_jump_highsec: 2000000,
			max_collateral_isk: 3000000000,
		},
		jump_freighter_standard: {
			hull_class: "Jump Freighter Standard",
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

function getFormInputs() {
	return {
		volume: volumeInput.value,
		collateral: collateralInput.value,
		highsecJumps: highsecJumpsInput.value,
		dangerousJumps: dangerousJumpsInput.value,
		rush: rushCheckbox.checked,
		forceJF: forceJfCheckbox.checked,
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
		bdDistanceLabel.textContent = "Distance Jump Fee:";

		if (
			details.isRedirect &&
			(details.redirectTarget === "Risako Hirano" || details.redirectTarget === "Executive Review")
		) {
			copyBtn.disabled = false;
			copyBtn.style.opacity = "1";
			copyBtn.style.cursor = "pointer";
			copyQuoteBtn.disabled = false;
			copyQuoteBtn.style.opacity = "1";
			copyQuoteBtn.style.cursor = "pointer";
		} else {
			copyBtn.disabled = true;
			copyBtn.style.opacity = "0.5";
			copyBtn.style.cursor = "not-allowed";
			copyQuoteBtn.disabled = true;
			copyQuoteBtn.style.opacity = "0.5";
			copyQuoteBtn.style.cursor = "not-allowed";
		}
	} else {
		feeBreakdown.classList.remove("placeholder-active");

		let readableService = "Standard Sub-Capital";
		const isJF = details.serviceClass?.includes("jump_freighter");
		bdDistanceLabel.textContent = isJF ? "Distance Cyno Fee:" : "Distance Jump Fee:";

		if (details.serviceClass) {
			const parts = details.serviceClass.split(".");
			if (parts.length === 2) {
				const [section, service] = parts;
				readableService = config[section]?.[service]?.hull_class || readableService;
			}
		}

		bdService.textContent = readableService;
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
		copyBtn.style.opacity = "1";
		copyBtn.style.cursor = "pointer";
		copyQuoteBtn.disabled = false;
		copyQuoteBtn.style.opacity = "1";
		copyQuoteBtn.style.cursor = "pointer";
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
		const finalVal = Math.max(1_000_000, Math.ceil(reward));
		rewardOutput.textContent = `${formatNumber(finalVal)} ISK`;

		const ipj = finalVal / rawJumps;
		rewardIpjOutput.textContent = `${formatNumber(Math.ceil(ipj))} ISK/Jump`;
	} else {
		rewardOutput.textContent = "0 ISK";
		rewardIpjOutput.textContent = "0 ISK/Jump";
	}
}

function updateAll() {
	if (!config) return;

	const options = getFormInputs();
	syncUrlParams(options);

	const calcCard = document.querySelector(".calculator-card");
	if (calcCard) {
		const isDangerous = (parseNum(options.dangerousJumps) || 0) > 0 || options.forceJF;
		if (isDangerous) {
			calcCard.classList.add("route-dangerous");
		} else {
			calcCard.classList.remove("route-dangerous");
		}
	}

	const details = calcRewardDetails({ ...options, config });
	const reward = details.error ? 0 : details.isRedirect ? details.redirectTarget : details.total;
	currentReward = reward;

	const rawJumps = parseNum(options.highsecJumps) + parseNum(options.dangerousJumps) || 1;

	renderBreakdown(details);
	syncPresets(options.volume);
	renderReward(reward, rawJumps);
}

// Mini copy buttons
miniCopyBtns.forEach((btn) => {
	btn.addEventListener("click", async () => {
		const val = btn.getAttribute("data-copy");
		try {
			await navigator.clipboard.writeText(val);
			const originalText = btn.textContent;
			btn.textContent = "Copied!";
			btn.classList.add("copied");
			setTimeout(() => {
				btn.textContent = originalText;
				btn.classList.remove("copied");
			}, 1500);
		} catch (err) {
			console.error("Failed to copy: ", err);
		}
	});
});

// Live formatting as user types
toFormatNumberInputs.forEach((input) => {
	input.addEventListener("input", (e) => {
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
	const originalText = copyBtn.textContent;

	if (currentReward === "Risako Hirano" || currentReward === "Executive Review") {
		textToCopy = currentReward;
	} else if (typeof currentReward === "number" && currentReward > 0) {
		textToCopy = Math.max(1_000_000, Math.ceil(currentReward)).toString();
	}

	if (textToCopy) {
		try {
			await navigator.clipboard.writeText(textToCopy);
			copyBtn.textContent =
				currentReward === "Risako Hirano" || currentReward === "Executive Review"
					? "Name Copied!"
					: "Reward Copied!";
			copyBtn.classList.add("copied");
			setTimeout(() => {
				copyBtn.textContent = originalText;
				copyBtn.classList.remove("copied");
			}, 2000);
		} catch (err) {
			console.error("Failed to copy: ", err);
		}
	}
});

copyQuoteBtn.addEventListener("click", async () => {
	const originalText = copyQuoteBtn.textContent;
	const details = calcRewardDetails({
		volume: volumeInput.value,
		collateral: collateralInput.value,
		highsecJumps: highsecJumpsInput.value,
		dangerousJumps: dangerousJumpsInput.value,
		rush: rushCheckbox.checked,
		forceJF: forceJfCheckbox.checked,
		config,
	});

	if (details.error) return;

	let detailsText = "";
	if (details.isRedirect) {
		detailsText = `Redirect to: ${details.redirectTarget}`;
	} else {
		detailsText = `${formatNumber(Math.max(1000000, Math.ceil(details.total)))} ISK`;
	}

	const template = [
		"Vagrant Logistics Courier Quote",
		"------------------------------",
		`Volume: ${volumeInput.value || 0} m³`,
		`Collateral: ${collateralInput.value || 0} ISK`,
		`Route: ${highsecJumpsInput.value || 0} HighSec / ${dangerousJumpsInput.value || 0} Dangerous Jumps`,
		`Rush Service: ${rushCheckbox.checked ? "Yes" : "No"}`,
		`Estimated Reward: ${detailsText}`,
		`Link: ${window.location.href}`,
	].join("\n");

	try {
		await navigator.clipboard.writeText(template);
		copyQuoteBtn.textContent = "Quote Copied!";
		copyQuoteBtn.classList.add("copied");
		setTimeout(() => {
			copyQuoteBtn.textContent = originalText;
			copyQuoteBtn.classList.remove("copied");
		}, 2000);
	} catch (err) {
		console.error("Failed to copy quote: ", err);
	}
});

clearBtn.addEventListener("click", () => {
	collateralInput.value = "";
	highsecJumpsInput.value = "";
	dangerousJumpsInput.value = "";
	volumeInput.value = "";
	rushCheckbox.checked = false;
	forceJfCheckbox.checked = false;
	updateAll();
});

// Initialize inputs from URL params
function initParamsFromUrl() {
	const urlParams = new URLSearchParams(window.location.search);

	if (urlParams.has("c")) collateralInput.value = formatNumber(urlParams.get("c"));
	if (urlParams.has("hj")) highsecJumpsInput.value = formatNumber(urlParams.get("hj"), false);
	if (urlParams.has("dj")) dangerousJumpsInput.value = formatNumber(urlParams.get("dj"), false);
	if (urlParams.has("v")) volumeInput.value = formatNumber(urlParams.get("v"));
	if (urlParams.get("r") === "1") rushCheckbox.checked = true;
	if (urlParams.get("jf") === "1") forceJfCheckbox.checked = true;
}

// Load config dynamically on startup
initParamsFromUrl();

// Try loading from localStorage first to render instantly
try {
	const cachedConfig = localStorage.getItem("vagrant_logistics_rate_config");
	if (cachedConfig) {
		config = JSON.parse(cachedConfig);
	}
} catch (e) {
	console.warn("Failed to parse cached configuration:", e);
}

loadConfig();
