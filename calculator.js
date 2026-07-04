export const parseNum = (val) => {
	if (typeof val === "number") return val;
	if (!val) return 0;
	return parseFloat(val.toString().replace(/,/g, "")) || 0;
};

export function calcReward({ volume, jumps, collateral, routeSecurity }) {
	const parsedVolume = parseNum(volume);
	const parsedJumps = parseNum(jumps);
	const parsedCollateral = parseNum(collateral);

	// 1. Global Collateral Cap
	if (parsedCollateral > 5_000_000_000) return "Risako Hirano";

	// 2. Basic Validation
	if (parsedVolume <= 0 || parsedJumps <= 0 || parsedCollateral < 0) return 0;

	let baseFee = 0;
	let ratePerJump = 0;
	let riskMultiplier = 1.0;

	// 3. Service Tier Logic
	if (routeSecurity === "highsec") {
		if (parsedVolume <= 12_500) {
			baseFee = 3_000_000;
			ratePerJump = 800_000;
		} else if (parsedVolume <= 62_500) {
			baseFee = 8_000_000;
			ratePerJump = 1_200_000;
		} else if (parsedVolume <= 1_125_000) {
			baseFee = 15_000_000;
			ratePerJump = 1_800_000;
		} else {
			return "Max Volume 1,125,000 m³";
		}
	} else if (routeSecurity === "dangerous" || routeSecurity === "high_risk") {
		if (routeSecurity === "high_risk") riskMultiplier = 1.5;

		if (parsedVolume <= 12_500) {
			baseFee = 10_000_000;
			ratePerJump = 2_000_000;
		} else if (parsedVolume <= 62_500) {
			baseFee = 20_000_000;
			ratePerJump = 5_000_000;
		} else if (parsedVolume <= 360_000) {
			baseFee = 150_000_000;
			ratePerJump = 35_000_000;
		} else {
			return "Max Volume 360,000 m³ (JF)";
		}
	}

	// 4. Calculate Transport Cost with Multipliers
	let totalReward = (baseFee + parsedJumps * ratePerJump) * riskMultiplier;

	// 5. Collateral Fee Schedule (Global)
	if (parsedCollateral > 1_000_000_000 && parsedCollateral <= 3_000_000_000) {
		totalReward += parsedCollateral * 0.003;
	} else if (parsedCollateral > 3_000_000_000) {
		totalReward += parsedCollateral * 0.005;
	}

	// 6. Minimum Reward Floor
	return Math.max(baseFee, totalReward);
}

export function calcRewardDetails({
	volume,
	jumps,
	collateral,
	routeSecurity,
}) {
	const parsedVolume = parseNum(volume);
	const parsedJumps = parseNum(jumps);
	const parsedCollateral = parseNum(collateral);

	if (parsedCollateral > 5_000_000_000) {
		return { isRedirect: true, redirectTarget: "Risako Hirano" };
	}
	if (parsedVolume <= 0 || parsedJumps <= 0 || parsedCollateral < 0) {
		return { error: true };
	}

	let baseFee = 0;
	let ratePerJump = 0;
	let riskMultiplier = 1.0;

	if (routeSecurity === "highsec") {
		if (parsedVolume <= 12_500) {
			baseFee = 3_000_000;
			ratePerJump = 800_000;
		} else if (parsedVolume <= 62_500) {
			baseFee = 8_000_000;
			ratePerJump = 1_200_000;
		} else if (parsedVolume <= 1_125_000) {
			baseFee = 15_000_000;
			ratePerJump = 1_800_000;
		} else {
			return { error: true, message: "Max Volume 1,125,000 m³" };
		}
	} else if (routeSecurity === "dangerous" || routeSecurity === "high_risk") {
		if (routeSecurity === "high_risk") riskMultiplier = 1.5;

		if (parsedVolume <= 12_500) {
			baseFee = 10_000_000;
			ratePerJump = 2_000_000;
		} else if (parsedVolume <= 62_500) {
			baseFee = 20_000_000;
			ratePerJump = 5_000_000;
		} else if (parsedVolume <= 360_000) {
			baseFee = 150_000_000;
			ratePerJump = 35_000_000;
		} else {
			return { error: true, message: "Max Volume 360,000 m³ (JF)" };
		}
	}

	const transportFee = (baseFee + parsedJumps * ratePerJump) * riskMultiplier;

	let collateralFee = 0;
	if (parsedCollateral > 1_000_000_000 && parsedCollateral <= 3_000_000_000) {
		collateralFee = parsedCollateral * 0.003;
	} else if (parsedCollateral > 3_000_000_000) {
		collateralFee = parsedCollateral * 0.005;
	}

	const total = Math.max(baseFee, transportFee + collateralFee);

	return {
		isRedirect: false,
		total,
		baseFee: baseFee * riskMultiplier,
		distanceFee: parsedJumps * ratePerJump * riskMultiplier,
		collateralFee,
		riskMultiplier,
	};
}
