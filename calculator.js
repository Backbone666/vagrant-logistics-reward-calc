export const parseNum = (val) => {
	if (typeof val === "number") return val;
	if (!val) return 0;
	return parseFloat(val.toString().replace(/,/g, "")) || 0;
};

export function classifyService({ volume, routeSecurity, dangerousJumps, forceJF }) {
	const parsedVolume = parseNum(volume);
	const hasDangerousJumps =
		parseNum(dangerousJumps) > 0 || routeSecurity === "dangerous" || routeSecurity === "high_risk";

	if (forceJF) {
		return "dangerous_space_services.jump_freighter_standard";
	}

	if (!hasDangerousJumps) {
		if (parsedVolume <= 62500) {
			return "highsec_services.blockade_runner_dst";
		}
		if (parsedVolume <= 1125000) {
			return "highsec_services.freighter_standard";
		}
		return "volume_limit_exceeded";
	}

	// Route contains lowsec/nullsec stargates
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

function findCollateralBracket(service, parsedCollateral) {
	const brackets = service.collateral_brackets || [];
	return brackets.find((b) => parsedCollateral <= b.max_collateral_isk);
}

function calcCollateralSurcharge(parsedCollateral) {
	if (parsedCollateral > 1_000_000_000 && parsedCollateral <= 3_000_000_000) {
		return parsedCollateral * 0.003;
	}
	if (parsedCollateral > 3_000_000_000) {
		return parsedCollateral * 0.005;
	}
	return 0;
}

function calcStargateRouteReward({
	service,
	parsedHighsecJumps,
	parsedDangerousJumps,
	parsedCollateral,
	rush,
	opsConfig,
	serviceClass,
	maxCollateral,
}) {
	let isRedirect = false;
	if (parsedCollateral > (service.max_collateral_isk || maxCollateral)) {
		isRedirect = true;
	}

	const baseRate = service.base_rate_isk || 0;
	const dangerousJumpRate = service.base_rate_per_jump_dangerous || 0;
	const hsJumpRate = service.base_rate_per_jump_highsec || 0;

	const distanceFee = parsedDangerousJumps * dangerousJumpRate + parsedHighsecJumps * hsJumpRate;

	let collateralFee = 0;
	if (!isRedirect) {
		collateralFee = calcCollateralSurcharge(parsedCollateral);
	}

	let total = baseRate + distanceFee + collateralFee;
	if (rush) {
		total += opsConfig.rush_surcharge_subcapital || 0;
	}

	return {
		isRedirect,
		redirectTarget: isRedirect ? "Risako Hirano" : "",
		total,
		baseFee: baseRate,
		distanceFee,
		collateralFee,
		multiplier: 1.0,
		surcharge: 0,
		serviceClass,
	};
}

function calcHighsecReward({
	service,
	opsConfig,
	parsedHighsecJumps,
	parsedCollateral,
	rush,
	serviceClass,
}) {
	const baseJumpRate = service.base_rate_per_jump || 0;
	const minFee = service.minimum_contract_fee || 0;

	let baseFee = parsedHighsecJumps * baseJumpRate;
	if (baseFee < minFee) {
		baseFee = minFee;
	}

	const matchedBracket = findCollateralBracket(service, parsedCollateral);
	let isRedirect = false;
	let redirectTarget = "";
	let multiplier = 1.0;
	let surcharge = 0;

	if (!matchedBracket) {
		isRedirect = true;
		redirectTarget = "Risako Hirano";
	} else {
		multiplier = matchedBracket.multiplier ?? 1.0;
		surcharge = matchedBracket.surcharge ?? 0;
	}

	const collateralFee = baseFee * (multiplier - 1) + surcharge;
	let total = baseFee + collateralFee;
	if (rush) {
		total += opsConfig.rush_surcharge_subcapital || 0;
	}

	return {
		isRedirect,
		redirectTarget,
		total,
		baseFee,
		distanceFee: 0,
		collateralFee,
		multiplier,
		surcharge,
		serviceClass,
	};
}

function calcJumpFreighterReward({
	dangerousConfig,
	opsConfig,
	parsedDangerousJumps,
	parsedCollateral,
	rush,
	serviceClass,
}) {
	const service = dangerousConfig.jump_freighter_standard || {};
	const jfBase = service.base_rate_isk || 0;
	const cynoFee = service.cyno_jump_fee_isk || 0;

	let isRedirect = false;
	if (parsedCollateral > (service.max_collateral_isk || 50_000_000_000)) {
		isRedirect = true;
	}

	const baseFee = jfBase;
	const distanceFee = parsedDangerousJumps * cynoFee;

	let collateralFee = 0;
	if (!isRedirect) {
		collateralFee = calcCollateralSurcharge(parsedCollateral);
	}

	let total = baseFee + distanceFee + collateralFee;
	if (rush) {
		total += opsConfig.rush_surcharge_jf || 0;
	}

	return {
		isRedirect,
		redirectTarget: isRedirect ? "Executive Review" : "",
		total,
		baseFee,
		distanceFee,
		collateralFee,
		multiplier: 1.0,
		surcharge: 0,
		serviceClass,
	};
}
export function calcRewardDetails(options, configOpt) {
	const {
		volume,
		collateral,
		highsecJumps,
		dangerousJumps,
		rush,
		forceJF,
		config: inlineConfig,
	} = options || {};

	const config = inlineConfig || configOpt;

	if (!config) {
		return { error: true, message: "Configuration not loaded" };
	}

	const parsedVolume = parseNum(volume);
	const parsedCollateral = parseNum(collateral);
	const parsedHighsecJumps = parseNum(highsecJumps);
	const parsedDangerousJumps = parseNum(dangerousJumps);

	if (
		parsedVolume <= 0 ||
		parsedCollateral < 0 ||
		(parsedHighsecJumps === 0 && parsedDangerousJumps === 0)
	) {
		return { error: true, message: "Invalid volume, jumps, or collateral" };
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
		return {
			error: true,
			message: `Cargo volume exceeds maximum limits. Please split the cargo into multiple contracts. Max volume is ${maxVol} m³.`,
		};
	}

	// Extract config groups
	const hsConfig = config.highsec_services || {};
	const dangerousConfig = config.dangerous_space_services || {};
	const opsConfig = config.operational_modifiers || {};

	if (serviceClass === "highsec_services.blockade_runner_dst") {
		return calcHighsecReward({
			service: hsConfig.blockade_runner_dst || {},
			opsConfig,
			parsedHighsecJumps,
			parsedCollateral,
			rush,
			serviceClass,
		});
	}

	if (serviceClass === "highsec_services.freighter_standard") {
		return calcHighsecReward({
			service: hsConfig.freighter_standard || {},
			opsConfig,
			parsedHighsecJumps,
			parsedCollateral,
			rush,
			serviceClass,
		});
	}

	if (serviceClass === "dangerous_space_services.blockade_runner_stargate") {
		const service = dangerousConfig.blockade_runner_stargate || {};
		return calcStargateRouteReward({
			service,
			parsedHighsecJumps,
			parsedDangerousJumps,
			parsedCollateral,
			rush,
			opsConfig,
			serviceClass,
			maxCollateral: 5_000_000_000,
		});
	}

	if (serviceClass === "dangerous_space_services.scouted_dst_stargate") {
		const service = dangerousConfig.scouted_dst_stargate || {};
		return calcStargateRouteReward({
			service,
			parsedHighsecJumps,
			parsedDangerousJumps,
			parsedCollateral,
			rush,
			opsConfig,
			serviceClass,
			maxCollateral: 3_000_000_000,
		});
	}

	if (serviceClass === "dangerous_space_services.jump_freighter_standard") {
		return calcJumpFreighterReward({
			dangerousConfig,
			opsConfig,
			parsedDangerousJumps,
			parsedCollateral,
			rush,
			serviceClass,
		});
	}

	return { error: true, message: "Unknown service class classification" };
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
