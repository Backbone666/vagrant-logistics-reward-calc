export const parseNum = (val) => {
	if (typeof val === "number") return val;
	if (!val) return 0;
	return parseFloat(val.toString().replace(/,/g, "")) || 0;
};

export function classifyService({
	volume,
	routeSecurity,
	dangerousJumps,
	forceJF,
}) {
	const parsedVolume = parseNum(volume);
	const hasDangerousJumps =
		parseNum(dangerousJumps) > 0 ||
		routeSecurity === "dangerous" ||
		routeSecurity === "high_risk";

	if (forceJF) {
		return "dangerous_space_services.jump_freighter_standard";
	}

	if (!hasDangerousJumps) {
		if (parsedVolume <= 62500) {
			return "highsec_services.blockade_runner_dst";
		}
		if (parsedVolume <= 950000) {
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

export function calcRewardDetails({
	volume,
	collateral,
	highsecJumps,
	dangerousJumps,
	rush,
	forceJF,
	config,
}) {
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
		const maxVol = routeSecurity === "highsec" ? "950,000" : "360,000";
		return {
			error: true,
			message: `Cargo volume exceeds maximum limits. Please split the cargo into multiple contracts. Max volume is ${maxVol} m³.`,
		};
	}

	// Extract config groups
	const hsConfig = config.highsec_services || {};
	const dangerousConfig = config.dangerous_space_services || {};
	const opsConfig = config.operational_modifiers || {};

	let baseFee = 0;
	let distanceFee = 0;
	let collateralFee = 0;
	let multiplier = 1.0;
	let surcharge = 0;
	let isRedirect = false;
	let redirectTarget = "";

	if (serviceClass === "highsec_services.blockade_runner_dst") {
		const service = hsConfig.blockade_runner_dst || {};
		const baseJumpRate = service.base_rate_per_jump || 0;
		const minFee = service.minimum_contract_fee || 0;

		baseFee = parsedHighsecJumps * baseJumpRate;
		if (baseFee < minFee) {
			baseFee = minFee;
		}

		// Find collateral bracket
		const brackets = service.collateral_brackets || [];
		const matchedBracket = brackets.find(
			(b) => parsedCollateral <= b.max_collateral_isk,
		);

		if (!matchedBracket) {
			isRedirect = true;
			redirectTarget = "Risako Hirano";
		} else {
			multiplier = matchedBracket.multiplier ?? 1.0;
			surcharge = matchedBracket.surcharge ?? 0;
		}

		let total = baseFee * multiplier + surcharge;
		if (rush) {
			total += opsConfig.rush_surcharge_subcapital || 0;
		}

		return {
			isRedirect,
			redirectTarget,
			total,
			baseFee,
			distanceFee: 0, // In this model baseFee represents the whole jump calculation before multipliers
			collateralFee: total - baseFee,
			multiplier,
			surcharge,
			serviceClass,
		};
	}

	if (serviceClass === "highsec_services.freighter_standard") {
		const service = hsConfig.freighter_standard || {};
		const baseJumpRate = service.base_rate_per_jump || 0;
		const minFee = service.minimum_contract_fee || 0;

		baseFee = parsedHighsecJumps * baseJumpRate;
		if (baseFee < minFee) {
			baseFee = minFee;
		}

		if (parsedCollateral > 5_000_000_000) {
			isRedirect = true;
			redirectTarget = "Risako Hirano";
		} else {
			const brackets = service.collateral_brackets || [];
			const matchedBracket = brackets.find(
				(b) => parsedCollateral <= b.max_collateral_isk,
			);
			if (!matchedBracket) {
				isRedirect = true;
				redirectTarget = "Risako Hirano";
			} else {
				multiplier = matchedBracket.multiplier ?? 1.0;
			}
		}

		let total = baseFee * multiplier;
		if (rush) {
			total += opsConfig.rush_surcharge_subcapital || 0;
		}

		return {
			isRedirect,
			redirectTarget,
			total,
			baseFee,
			distanceFee: 0,
			collateralFee: total - baseFee,
			multiplier,
			surcharge: 0,
			serviceClass,
		};
	}

	if (serviceClass === "dangerous_space_services.blockade_runner_stargate") {
		const service = dangerousConfig.blockade_runner_stargate || {};
		const dangerousJumpRate = service.base_rate_per_jump_dangerous || 0;
		const hsJumpRate = service.base_rate_per_jump_highsec || 0;

		if (parsedCollateral > (service.max_collateral_isk || 5_000_000_000)) {
			isRedirect = true;
			redirectTarget = "Risako Hirano"; // "reject stargate contract and recommend Jump Freighter routing" -> represented by redirect/manual quote
		}

		baseFee =
			parsedDangerousJumps * dangerousJumpRate +
			parsedHighsecJumps * hsJumpRate;
		collateralFee =
			(parsedCollateral / 1_000_000_000) *
			(service.collateral_surcharge_per_1b || 0);

		let total = baseFee + collateralFee;
		if (rush) {
			total += opsConfig.rush_surcharge_subcapital || 0;
		}

		return {
			isRedirect,
			redirectTarget: isRedirect ? "Risako Hirano" : "",
			total,
			baseFee,
			distanceFee: 0,
			collateralFee,
			multiplier: 1.0,
			surcharge: 0,
			serviceClass,
		};
	}

	if (serviceClass === "dangerous_space_services.scouted_dst_stargate") {
		const service = dangerousConfig.scouted_dst_stargate || {};
		const dangerousJumpRate = service.base_rate_per_jump_dangerous || 0;
		const hsJumpRate = service.base_rate_per_jump_highsec || 0;

		if (parsedCollateral > (service.max_collateral_isk || 3_000_000_000)) {
			isRedirect = true;
			redirectTarget = "Risako Hirano";
		}

		baseFee =
			parsedDangerousJumps * dangerousJumpRate +
			parsedHighsecJumps * hsJumpRate;
		collateralFee =
			(parsedCollateral / 1_000_000_000) *
			(service.collateral_surcharge_per_1b || 0);

		let total = baseFee + collateralFee;
		if (rush) {
			total += opsConfig.rush_surcharge_subcapital || 0;
		}

		return {
			isRedirect,
			redirectTarget: isRedirect ? "Risako Hirano" : "",
			total,
			baseFee,
			distanceFee: 0,
			collateralFee,
			multiplier: 1.0,
			surcharge: 0,
			serviceClass,
		};
	}

	if (serviceClass === "dangerous_space_services.jump_freighter_standard") {
		const service = dangerousConfig.jump_freighter_standard || {};
		const jfBase = service.base_rate_isk || 0;
		const cynoFee = service.cyno_jump_fee_isk || 0;

		if (parsedCollateral > (service.max_collateral_isk || 50_000_000_000)) {
			isRedirect = true;
			redirectTarget = "Executive Review";
		}

		baseFee = jfBase;
		distanceFee = parsedDangerousJumps * cynoFee; // Cyno Jumps assumes 1 per dangerous jump

		let matchedSurcharge = 0;
		if (!isRedirect) {
			const brackets = service.collateral_brackets || [];
			const matchedBracket = brackets.find(
				(b) => parsedCollateral <= b.max_collateral_isk,
			);
			if (matchedBracket) {
				matchedSurcharge = matchedBracket.surcharge_isk ?? 0;
			} else {
				isRedirect = true;
				redirectTarget = "Executive Review";
			}
		}

		let total = baseFee + distanceFee + matchedSurcharge;
		if (rush) {
			total += opsConfig.rush_surcharge_jf || 0;
		}

		return {
			isRedirect,
			redirectTarget,
			total,
			baseFee,
			distanceFee,
			collateralFee: matchedSurcharge,
			multiplier: 1.0,
			surcharge: 0,
			serviceClass,
		};
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
