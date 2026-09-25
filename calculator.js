export const parseNum = (val) => {
	if (val == null || val === "") return 0;
	const parsed = typeof val === "number" ? val : parseFloat(String(val).replaceAll(",", ""));
	return Number.isFinite(parsed) ? parsed : 0;
};

function classifyHighsecService(parsedVolume) {
	if (parsedVolume <= 62500) {
		return "highsec_services.blockade_runner_dst";
	}
	if (parsedVolume <= 1125000) {
		return "highsec_services.freighter_standard";
	}
	return "volume_limit_exceeded";
}

function classifyDangerousService(parsedVolume) {
	if (parsedVolume <= 12500) {
		return "dangerous_space_services.blockade_runner_stargate";
	}
	if (parsedVolume <= 62500) {
		return "dangerous_space_services.scouted_dst_stargate";
	}
	if (parsedVolume <= 360000) {
		return "dangerous_space_services.jump_freighter_standard";
	}
	return "volume_limit_exceeded";
}

export function classifyService({ volume, routeSecurity, dangerousJumps, forceJF }) {
	if (forceJF) {
		return "dangerous_space_services.jump_freighter_standard";
	}

	const parsedVolume = parseNum(volume);
	const hasDangerousJumps =
		parseNum(dangerousJumps) > 0 || routeSecurity === "dangerous" || routeSecurity === "high_risk";

	return hasDangerousJumps
		? classifyDangerousService(parsedVolume)
		: classifyHighsecService(parsedVolume);
}

function findCollateralBracket(service, parsedCollateral) {
	const brackets = service.collateral_brackets || [];
	return brackets.find((b) => parsedCollateral <= b.max_collateral_isk);
}

const DEFAULT_COLLATERAL_RULES = Object.freeze({
	blockade_runner: [
		{ max_collateral_isk: 1_000_000_000, rate: 0.0 },
		{ max_collateral_isk: 3_000_000_000, rate: 0.002 },
		{ max_collateral_isk: 5_000_000_000, rate: 0.004 },
	],
	scouted_dst: [
		{ max_collateral_isk: 1_000_000_000, rate: 0.0 },
		{ max_collateral_isk: 3_000_000_000, rate: 0.003 },
		{ max_collateral_isk: 5_000_000_000, rate: 0.005 },
	],
	jump_freighter: [
		{ max_collateral_isk: 2_000_000_000, rate: 0.0 },
		{ max_collateral_isk: 10_000_000_000, rate: 0.004 },
		{ max_collateral_isk: 50_000_000_000, rate: 0.006 },
	],
});

function calcCollateralSurcharge(parsedCollateral, rules) {
	if (!Array.isArray(rules) || rules.length === 0) return 0;
	const bracket =
		rules.find((b) => parsedCollateral <= b.max_collateral_isk) || rules[rules.length - 1];
	return parsedCollateral * (bracket?.rate ?? 0);
}

function createRewardResult({
	isRedirect = false,
	redirectTarget = "",
	total = 0,
	baseFee = 0,
	distanceFee = 0,
	collateralFee = 0,
	multiplier = 1.0,
	surcharge = 0,
	serviceClass = "",
	hullClass = "Standard Sub-Capital",
}) {
	return {
		isRedirect,
		redirectTarget,
		total,
		baseFee,
		distanceFee,
		collateralFee,
		multiplier,
		surcharge,
		serviceClass,
		serviceName: hullClass || "Standard Sub-Capital",
		distanceLabel: serviceClass?.includes("jump_freighter")
			? "Distance Cyno Fee:"
			: "Distance Jump Fee:",
		finalTotal: Math.max(1_000_000, Math.ceil(total)),
	};
}

function calcStargateRouteReward({
	service,
	parsedHighsecJumps,
	parsedDangerousJumps,
	parsedCollateral,
	serviceClass,
	maxCollateral,
	collateralRules,
}) {
	let isRedirect = false;
	if (parsedCollateral > (service.max_collateral_isk || maxCollateral || 5_000_000_000)) {
		isRedirect = true;
	}

	const baseRate = service.base_rate_isk || 0;
	const dangerousJumpRate = service.base_rate_per_jump_dangerous || 0;
	const hsJumpRate = service.base_rate_per_jump_highsec || 0;

	const distanceFee = parsedDangerousJumps * dangerousJumpRate + parsedHighsecJumps * hsJumpRate;

	let collateralFee = 0;
	if (!isRedirect) {
		const rulesKey = serviceClass?.includes("blockade_runner") ? "blockade_runner" : "scouted_dst";
		const rules = collateralRules?.[rulesKey] || DEFAULT_COLLATERAL_RULES[rulesKey];
		collateralFee = calcCollateralSurcharge(parsedCollateral, rules);
	}

	const total = baseRate + distanceFee + collateralFee;

	return createRewardResult({
		isRedirect,
		redirectTarget: isRedirect ? "Risako Hirano" : "",
		total,
		baseFee: baseRate,
		distanceFee,
		collateralFee,
		serviceClass,
		hullClass: service.hull_class,
	});
}

function resolveHighsecBaseFee(service, parsedHighsecJumps) {
	const baseJumpRate = service.base_rate_per_jump || 0;
	const minFee = service.minimum_contract_fee || 0;
	return Math.max(minFee, parsedHighsecJumps * baseJumpRate);
}

function resolveHighsecCollateralParams(service, parsedCollateral) {
	const matchedBracket = findCollateralBracket(service, parsedCollateral);
	if (!matchedBracket) {
		return {
			isRedirect: true,
			redirectTarget: "Risako Hirano",
			multiplier: 1.0,
			surcharge: 0,
		};
	}
	return {
		isRedirect: false,
		redirectTarget: "",
		multiplier: matchedBracket.multiplier ?? 1.0,
		surcharge: matchedBracket.surcharge ?? 0,
	};
}

function calcHighsecReward({ service, parsedHighsecJumps, parsedCollateral, serviceClass }) {
	const baseFee = resolveHighsecBaseFee(service, parsedHighsecJumps);
	const { isRedirect, redirectTarget, multiplier, surcharge } = resolveHighsecCollateralParams(
		service,
		parsedCollateral,
	);
	const collateralFee = baseFee * (multiplier - 1) + surcharge;
	const total = baseFee + collateralFee;

	return createRewardResult({
		isRedirect,
		redirectTarget,
		total,
		baseFee,
		distanceFee: 0,
		collateralFee,
		multiplier,
		surcharge,
		serviceClass,
		hullClass: service.hull_class,
	});
}

function resolveJumpFreighterCollateralParams(service, parsedCollateral, collateralRules) {
	const maxCollateral = service.max_collateral_isk || 50_000_000_000;
	if (parsedCollateral > maxCollateral) {
		return { isRedirect: true, collateralFee: 0 };
	}
	const rules = collateralRules?.jump_freighter || DEFAULT_COLLATERAL_RULES.jump_freighter;
	return {
		isRedirect: false,
		collateralFee: calcCollateralSurcharge(parsedCollateral, rules),
	};
}

function calcJumpFreighterReward({
	dangerousConfig,
	parsedDangerousJumps,
	parsedCollateral,
	serviceClass,
	collateralRules,
}) {
	const service = dangerousConfig.jump_freighter_standard || {};
	const baseFee = service.base_rate_isk || 0;
	const distanceFee = parsedDangerousJumps * (service.cyno_jump_fee_isk || 0);
	const { isRedirect, collateralFee } = resolveJumpFreighterCollateralParams(
		service,
		parsedCollateral,
		collateralRules,
	);
	const total = baseFee + distanceFee + collateralFee;

	return createRewardResult({
		isRedirect,
		redirectTarget: isRedirect ? "Executive Review" : "",
		total,
		baseFee,
		distanceFee,
		collateralFee,
		serviceClass,
		hullClass: service.hull_class,
	});
}
function createErrorResult(message) {
	return {
		error: true,
		message,
		serviceName: "—",
		distanceLabel: "Distance Jump Fee:",
		finalTotal: 0,
	};
}

function dispatchServiceReward({
	serviceClass,
	config,
	parsedHighsecJumps,
	parsedDangerousJumps,
	parsedCollateral,
}) {
	const hsConfig = config.highsec_services || {};
	const dangerousConfig = config.dangerous_space_services || {};

	switch (serviceClass) {
		case "highsec_services.blockade_runner_dst":
			return calcHighsecReward({
				service: hsConfig.blockade_runner_dst || {},
				parsedHighsecJumps,
				parsedCollateral,
				serviceClass,
			});
		case "highsec_services.freighter_standard":
			return calcHighsecReward({
				service: hsConfig.freighter_standard || {},
				parsedHighsecJumps,
				parsedCollateral,
				serviceClass,
			});
		case "dangerous_space_services.blockade_runner_stargate":
			return calcStargateRouteReward({
				service: dangerousConfig.blockade_runner_stargate || {},
				parsedHighsecJumps,
				parsedDangerousJumps,
				parsedCollateral,
				serviceClass,
				maxCollateral: 5_000_000_000,
				collateralRules: config.dangerous_collateral_rules,
			});
		case "dangerous_space_services.scouted_dst_stargate":
			return calcStargateRouteReward({
				service: dangerousConfig.scouted_dst_stargate || {},
				parsedHighsecJumps,
				parsedDangerousJumps,
				parsedCollateral,
				serviceClass,
				maxCollateral: 5_000_000_000,
				collateralRules: config.dangerous_collateral_rules,
			});
		case "dangerous_space_services.jump_freighter_standard":
			return calcJumpFreighterReward({
				dangerousConfig,
				parsedDangerousJumps,
				parsedCollateral,
				serviceClass,
				collateralRules: config.dangerous_collateral_rules,
			});
		default:
			return createErrorResult("Unknown service class classification");
	}
}

export function calcRewardDetails(options, configOpt) {
	const {
		volume,
		collateral,
		highsecJumps,
		dangerousJumps,
		forceJF,
		config: inlineConfig,
	} = options || {};

	const config = inlineConfig || configOpt;

	if (!config) {
		return createErrorResult("Configuration not loaded");
	}

	const parsedVolume = parseNum(volume);
	const parsedCollateral = parseNum(collateral);
	const parsedHighsecJumps = parseNum(highsecJumps);
	const parsedDangerousJumps = parseNum(dangerousJumps);

	if (
		parsedVolume <= 0 ||
		parsedCollateral < 0 ||
		parsedHighsecJumps < 0 ||
		parsedDangerousJumps < 0 ||
		(parsedHighsecJumps === 0 && parsedDangerousJumps === 0)
	) {
		return createErrorResult("Invalid volume, jumps, or collateral");
	}

	// 1. Service Classification
	const routeSecurity = parsedDangerousJumps > 0 ? "dangerous" : "highsec";
	const serviceClass = classifyService({
		volume: parsedVolume,
		routeSecurity,
		dangerousJumps: parsedDangerousJumps,
		forceJF,
	});

	if (serviceClass === "volume_limit_exceeded") {
		const maxVol = routeSecurity === "highsec" ? "1,125,000" : "360,000";
		return createErrorResult(
			`Cargo volume exceeds maximum limits. Please split the cargo into multiple contracts. Max volume is ${maxVol} m³.`,
		);
	}

	return dispatchServiceReward({
		serviceClass,
		config,
		parsedHighsecJumps,
		parsedDangerousJumps,
		parsedCollateral,
	});
}

export function calcReward(options, config) {
	const details = calcRewardDetails({ ...options, config });
	if (details.error) {
		return 0;
	}
	if (details.isRedirect) {
		return details.redirectTarget;
	}
	return details.total;
}
