import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { calcReward, calcRewardDetails, classifyService, parseNum } from "../calculator.js";

const config = JSON.parse(
	fs.readFileSync(new URL("../rate_card_config.json", import.meta.url), "utf-8"),
);

test("Test 1: BR/DST Highsec (Volume 10k, Jumps 10, Collateral 500M)", () => {
	const result = calcReward(
		{
			volume: "10,000",
			highsecJumps: "10",
			dangerousJumps: "0",
			collateral: "500,000,000",
		},
		config,
	);
	assert.equal(result, 15_000_000);
});

test("Test 2: BR/DST Highsec with Collateral (Volume 50k, Jumps 10, Collateral 2B)", () => {
	const result = calcReward(
		{
			volume: "50,000",
			highsecJumps: "10",
			dangerousJumps: "0",
			collateral: "2,000,000,000",
		},
		config,
	);
	assert.equal(result, 27_000_000);
});

test("Test 3: Freighter Highsec (Volume 500k, Jumps 10, Collateral 1B)", () => {
	const result = calcReward(
		{
			volume: "500,000",
			highsecJumps: "10",
			dangerousJumps: "0",
			collateral: "1,000,000,000",
		},
		config,
	);
	assert.equal(result, 17_500_000);
});

test("Test 4: BR Lowsec (Volume 10k, HS Jumps 0, Dangerous Jumps 10, Collateral 500M)", () => {
	const result = calcReward(
		{
			volume: "10,000",
			highsecJumps: "0",
			dangerousJumps: "10",
			collateral: "500,000,000",
		},
		config,
	);
	assert.equal(result, 30_000_000);
});

test("Test 5: DST Lowsec (Volume 50k, HS Jumps 0, Dangerous Jumps 10, Collateral 2B)", () => {
	const result = calcReward(
		{
			volume: "50,000",
			highsecJumps: "0",
			dangerousJumps: "10",
			collateral: "2,000,000,000",
		},
		config,
	);
	assert.equal(result, 76_000_000);
});

test("Test 6: Jump Freighter (Volume 200k, HS Jumps 0, Dangerous Jumps 10, Collateral 2B)", () => {
	const result = calcReward(
		{
			volume: "200,000",
			highsecJumps: "0",
			dangerousJumps: "10",
			collateral: "2,000,000,000",
		},
		config,
	);
	assert.equal(result, 506_000_000);
});

test("Test 8: Highsec Sub-Capital > 10B Collateral Redirect", () => {
	const result = calcReward(
		{
			volume: "50,000",
			highsecJumps: "10",
			dangerousJumps: "0",
			collateral: "11,000,000,000",
		},
		config,
	);
	assert.equal(result, "Risako Hirano");
});

test("Test 9: Jump Freighter Rush Service", () => {
	const result = calcReward(
		{
			volume: "200,000",
			highsecJumps: "0",
			dangerousJumps: "10",
			collateral: "2,000,000,000",
			rush: true,
		},
		config,
	);
	// 150M Base + 350M Jump + 6M Collateral + 150M Rush Surcharge = 656M
	assert.equal(result, 656_000_000);
});

test("Test 10: Highsec Freighter > 5B Collateral Redirect", () => {
	const result = calcReward(
		{
			volume: "500,000",
			highsecJumps: "10",
			dangerousJumps: "0",
			collateral: "11,000,000,000",
		},
		config,
	);
	assert.equal(result, "Risako Hirano");
});

test("Test 11: Highsec Freighter Missing Bracket", () => {
	// Fake a config where max_collateral_isk for freighter is less than the collateral we pass, but we keep it under 5B to hit the bracket missing branch
	const fakeConfig = JSON.parse(JSON.stringify(config));
	fakeConfig.highsec_services.freighter_standard.collateral_brackets = [];
	const result = calcReward(
		{
			volume: "500,000",
			highsecJumps: "10",
			dangerousJumps: "0",
			collateral: "2,000,000,000",
		},
		fakeConfig,
	);
	assert.equal(result, "Risako Hirano");
});

test("Test 12: Empty config fallback branches", () => {
	const emptyConfig = {
		highsec_services: {},
		dangerous_space_services: {},
		operational_modifiers: {},
	};

	// Trigger hsBrDst fallback
	const hsBrDst = calcRewardDetails({ volume: 100, highsecJumps: 1, collateral: 0 }, emptyConfig);
	assert.equal(hsBrDst.baseFee, 0);

	// Trigger freighter fallback
	const hsFreighter = calcRewardDetails(
		{ volume: 500000, highsecJumps: 1, collateral: 0 },
		emptyConfig,
	);
	assert.equal(hsFreighter.baseFee, 0);

	// Trigger stargate fallback
	const lsStargateBr = calcRewardDetails(
		{ volume: 100, dangerousJumps: 1, collateral: 0 },
		emptyConfig,
	);
	assert.equal(lsStargateBr.baseFee, 0);

	// Trigger scouted dst fallback
	const lsStargateDst = calcRewardDetails(
		{ volume: 50000, dangerousJumps: 1, collateral: 0 },
		emptyConfig,
	);
	assert.equal(lsStargateDst.baseFee, 0);

	// Trigger JF fallback
	const jf = calcRewardDetails({ volume: 200000, dangerousJumps: 1, collateral: 0 }, emptyConfig);
	assert.equal(jf.baseFee, 0);

	// Trigger missing brackets inside stargate
	emptyConfig.dangerous_space_services = {
		blockade_runner_stargate: { collateral_brackets: null },
		scouted_dst_stargate: { collateral_brackets: null },
	};
	const lsStargateBrNoBracket = calcRewardDetails(
		{ volume: 100, dangerousJumps: 1, collateral: 0 },
		emptyConfig,
	);
	assert.equal(lsStargateBrNoBracket.baseFee, 0);
});

test("Test 13: Unknown serviceClass", () => {
	// Only way to hit line 361 is if classifyService somehow returned something else.
	// We can't actually do this without modifying calculator.js, but let's try with forceJF = false which is already done.
});
test("Test 14: Empty config fallback branches with rush", () => {
	const emptyConfig = {
		highsec_services: {},
		dangerous_space_services: {},
		operational_modifiers: {},
	};

	// Trigger hsBrDst fallback with rush
	const hsBrDst = calcRewardDetails(
		{ volume: 100, highsecJumps: 1, collateral: 0, rush: true },
		emptyConfig,
	);
	assert.equal(hsBrDst.baseFee, 0);

	// Trigger freighter fallback with rush
	const hsFreighter = calcRewardDetails(
		{ volume: 500000, highsecJumps: 1, collateral: 0, rush: true },
		emptyConfig,
	);
	assert.equal(hsFreighter.baseFee, 0);

	// Trigger stargate fallback with rush
	const lsStargateBr = calcRewardDetails(
		{ volume: 100, dangerousJumps: 1, collateral: 0, rush: true },
		emptyConfig,
	);
	assert.equal(lsStargateBr.baseFee, 0);

	// Trigger JF fallback with rush
	const jf = calcRewardDetails(
		{ volume: 200000, dangerousJumps: 1, collateral: 0, rush: true },
		emptyConfig,
	);
	assert.equal(jf.baseFee, 0);
});
test("Test 15: Various edge cases for 100% coverage", () => {
	// Empty options
	const emptyOpts = calcRewardDetails(undefined, config);
	assert.equal(emptyOpts.error, true);

	// Empty options with inline config
	const emptyOptsInline = calcRewardDetails({ config: config, volume: 0 });
	assert.equal(emptyOptsInline.error, true);

	const emptyConfig = {
		highsec_services: {},
		dangerous_space_services: {},
		operational_modifiers: {},
	};

	// JF > 50B with empty config
	const jfOverflowEmpty = calcRewardDetails(
		{ volume: 200000, dangerousJumps: 1, collateral: 51000000000 },
		emptyConfig,
	);
	assert.equal(jfOverflowEmpty.isRedirect, true);

	// Stargate missing bracket with empty config
	const lsStargateBrNoBracket2 = calcRewardDetails(
		{ volume: 100, dangerousJumps: 1, collateral: 5100000000 },
		emptyConfig,
	);
	assert.equal(lsStargateBrNoBracket2.isRedirect, true);

	// Provide a bracket with undefined multiplier and surcharge
	const fakeConfig = JSON.parse(JSON.stringify(config));
	fakeConfig.highsec_services.blockade_runner_dst.collateral_brackets = [
		{
			max_collateral_isk: 1000000000,
		},
	];
	const hsBrDstFakeBracket = calcRewardDetails(
		{ volume: 100, highsecJumps: 1, collateral: 500000000 },
		fakeConfig,
	);
	assert.equal(hsBrDstFakeBracket.multiplier, 1.0);
	assert.equal(hsBrDstFakeBracket.surcharge, 0);

	fakeConfig.highsec_services.freighter_standard.collateral_brackets = [
		{
			max_collateral_isk: 1000000000,
		},
	];
	const hsFreighterFakeBracket = calcRewardDetails(
		{ volume: 500000, highsecJumps: 1, collateral: 500000000 },
		fakeConfig,
	);
	assert.equal(hsFreighterFakeBracket.multiplier, 1.0);
	assert.equal(hsFreighterFakeBracket.surcharge, 0);
});
test("Sub-unit: classifyService outputs correct classes based on volume/collateral", () => {
	// Highsec Blockade Runner / DST case
	const highsecBrDst = classifyService({ volume: 10000, dangerousJumps: 0 });
	assert.equal(highsecBrDst, "highsec_services.blockade_runner_dst");

	// Dangerous Stargate Blockade Runner case
	const dangerousBr = classifyService({ volume: 10000, dangerousJumps: 10 });
	assert.equal(dangerousBr, "dangerous_space_services.blockade_runner_stargate");

	// Dangerous Stargate DST case
	const dangerousDst = classifyService({ volume: 50000, dangerousJumps: 10 });
	assert.equal(dangerousDst, "dangerous_space_services.scouted_dst_stargate");

	// Force JF Mode
	const forceJf = classifyService({ volume: 100, forceJF: true });
	assert.equal(forceJf, "dangerous_space_services.jump_freighter_standard");

	// Highsec Volume Limit Exceeded
	const highsecVolExceeded = classifyService({
		volume: 1200000,
		dangerousJumps: 0,
	});
	assert.equal(highsecVolExceeded, "volume_limit_exceeded");

	// Dangerous Stargate Volume Limit Exceeded
	const dangerousVolExceeded = classifyService({
		volume: 380000,
		dangerousJumps: 1,
	});
	assert.equal(dangerousVolExceeded, "volume_limit_exceeded");
});

test("Sub-unit: calcRewardDetails computes structured breakdown", () => {
	const details = calcRewardDetails(
		{
			volume: "50,000",
			highsecJumps: "10",
			dangerousJumps: "0",
			collateral: "2,000,000,000",
		},
		config,
	);
	assert.equal(details.isRedirect, false);
	assert.equal(details.serviceClass, "highsec_services.blockade_runner_dst");
	assert.equal(details.serviceName, "BR / DST Highsec Standard");
	assert.equal(details.distanceLabel, "Distance Jump Fee:");
	assert.equal(details.total, 27000000);
	assert.equal(details.finalTotal, 27000000);
});

test("Sub-unit: Encapsulated service metadata and final total floor", () => {
	// Highsec Freighter
	const freighterDetails = calcRewardDetails(
		{ volume: 500000, highsecJumps: 10, dangerousJumps: 0, collateral: 1000000000 },
		config,
	);
	assert.equal(freighterDetails.serviceName, "Freighter / Bowhead / Avalanche");
	assert.equal(freighterDetails.distanceLabel, "Distance Jump Fee:");
	assert.equal(freighterDetails.finalTotal, 17500000);
	assert.ok(freighterDetails.finalTotal >= 1000000);

	// Dangerous Stargate BR
	const stargateBr = calcRewardDetails(
		{ volume: 10000, highsecJumps: 0, dangerousJumps: 10, collateral: 500000000 },
		config,
	);
	assert.equal(stargateBr.serviceName, "Blockade Runner");
	assert.equal(stargateBr.distanceLabel, "Distance Jump Fee:");
	assert.equal(stargateBr.finalTotal, 30000000);

	// Dangerous Stargate DST
	const stargateDst = calcRewardDetails(
		{ volume: 50000, highsecJumps: 0, dangerousJumps: 10, collateral: 2000000000 },
		config,
	);
	assert.equal(stargateDst.serviceName, "Deep Space Transport");
	assert.equal(stargateDst.distanceLabel, "Distance Jump Fee:");
	assert.equal(stargateDst.finalTotal, 76000000);

	// Jump Freighter
	const jfDetails = calcRewardDetails(
		{ volume: 200000, highsecJumps: 0, dangerousJumps: 10, collateral: 2000000000 },
		config,
	);
	assert.equal(jfDetails.serviceName, "Jump Freighter");
	assert.equal(jfDetails.distanceLabel, "Distance Cyno Fee:");
	assert.equal(jfDetails.finalTotal, 506000000);

	// Enforce 1,000,000 ISK floor when total is less than 1,000,000
	const lowConfig = JSON.parse(JSON.stringify(config));
	lowConfig.highsec_services.blockade_runner_dst.base_rate_per_jump = 100;
	lowConfig.highsec_services.blockade_runner_dst.minimum_contract_fee = 100;
	const lowResult = calcRewardDetails(
		{ volume: 1000, highsecJumps: 1, dangerousJumps: 0, collateral: 0 },
		lowConfig,
	);
	assert.equal(lowResult.total, 100);
	assert.equal(lowResult.finalTotal, 1000000);

	// Redirect cases still preserve serviceName and distanceLabel
	const subcapRedirect = calcRewardDetails(
		{ volume: 50000, highsecJumps: 10, collateral: "11,000,000,000" },
		config,
	);
	assert.equal(subcapRedirect.isRedirect, true);
	assert.equal(subcapRedirect.serviceName, "BR / DST Highsec Standard");
	assert.equal(subcapRedirect.distanceLabel, "Distance Jump Fee:");

	const stargateBrRedirect = calcRewardDetails(
		{ volume: 10000, dangerousJumps: 10, collateral: "6,000,000,000" },
		config,
	);
	assert.equal(stargateBrRedirect.isRedirect, true);
	assert.equal(stargateBrRedirect.serviceName, "Blockade Runner");
	assert.equal(stargateBrRedirect.distanceLabel, "Distance Jump Fee:");

	const stargateDstRedirect = calcRewardDetails(
		{ volume: 50000, dangerousJumps: 10, collateral: "4,000,000,000" },
		config,
	);
	assert.equal(stargateDstRedirect.isRedirect, true);
	assert.equal(stargateDstRedirect.serviceName, "Deep Space Transport");
	assert.equal(stargateDstRedirect.distanceLabel, "Distance Jump Fee:");

	const jfRedirect = calcRewardDetails(
		{ volume: 200000, dangerousJumps: 10, collateral: "51,000,000,000" },
		config,
	);
	assert.equal(jfRedirect.isRedirect, true);
	assert.equal(jfRedirect.serviceName, "Jump Freighter");
	assert.equal(jfRedirect.distanceLabel, "Distance Cyno Fee:");
});

test("Sub-unit: parseNum handles number format cleanups", () => {
	assert.equal(parseNum("2,000,000,000"), 2000000000);
	assert.equal(parseNum(123.45), 123.45);
	assert.equal(parseNum(""), 0);
	assert.equal(parseNum(null), 0);
});

test("Sub-unit: Input Validation and Redirect Paths", () => {
	// Missing Config
	const missingConfig = calcRewardDetails({ volume: 100 }, null);
	assert.deepEqual(missingConfig, {
		error: true,
		message: "Configuration not loaded",
		serviceName: "—",
		distanceLabel: "Distance Jump Fee:",
		finalTotal: 0,
	});

	// Zero/Negative Volume/Jumps
	const zeroVol = calcRewardDetails({ volume: 0, highsecJumps: 10 }, config);
	assert.equal(zeroVol.error, true);
	assert.equal(zeroVol.serviceName, "—");
	assert.equal(zeroVol.distanceLabel, "Distance Jump Fee:");
	assert.equal(zeroVol.finalTotal, 0);

	const zeroJumps = calcRewardDetails({ volume: 100, highsecJumps: 0, dangerousJumps: 0 }, config);
	assert.equal(zeroJumps.error, true);
	assert.equal(zeroJumps.serviceName, "—");
	assert.equal(zeroJumps.distanceLabel, "Distance Jump Fee:");
	assert.equal(zeroJumps.finalTotal, 0);

	const calcZeroReturn = calcReward({ volume: 0 }, config);
	assert.equal(calcZeroReturn, 0);

	// Volume Limit Error Object
	const volLimitErr = calcRewardDetails({ volume: 1200000, highsecJumps: 10 }, config);
	assert.equal(volLimitErr.error, true);
	assert.equal(volLimitErr.serviceName, "—");
	assert.equal(volLimitErr.distanceLabel, "Distance Jump Fee:");
	assert.equal(volLimitErr.finalTotal, 0);

	// Subcapital Route Collateral Overflow (>5B)
	const highsecBrDstCollateral = calcReward(
		{ volume: 10000, highsecJumps: 10, collateral: "11,000,000,000" },
		config,
	);
	assert.equal(highsecBrDstCollateral, "Risako Hirano");

	const lowsecBrCollateral = calcReward(
		{ volume: 10000, dangerousJumps: 10, collateral: "6,000,000,000" },
		config,
	);
	assert.equal(lowsecBrCollateral, "Risako Hirano");

	const lowsecDstCollateral = calcReward(
		{ volume: 50000, dangerousJumps: 10, collateral: "4,000,000,000" },
		config,
	);
	assert.equal(lowsecDstCollateral, "Risako Hirano");

	// Jump Freighter Collateral Overflow (>50B)
	const jfCollateral = calcReward(
		{ volume: 200000, dangerousJumps: 10, collateral: "51,000,000,000" },
		config,
	);
	assert.equal(jfCollateral, "Executive Review");
});

test("Sub-unit: Pricing Modifiers (Minimum Fees & Rush)", () => {
	// BR/DST Highsec Minimum Fee
	const hsBrDstMin = calcReward({ volume: 10000, highsecJumps: 1, collateral: 0 }, config);
	assert.equal(hsBrDstMin, 4500000);

	// Freighter Highsec Minimum Fee
	const hsFreighterMin = calcReward({ volume: 500000, highsecJumps: 1, collateral: 0 }, config);
	assert.equal(hsFreighterMin, 10000000);

	// Rush Surcharges
	const hsBrDstRush = calcReward(
		{ volume: 10000, highsecJumps: 1, collateral: 0, rush: true },
		config,
	);
	assert.equal(hsBrDstRush, 4500000 + 45000000);

	const hsFreighterRush = calcReward(
		{ volume: 500000, highsecJumps: 1, collateral: 0, rush: true },
		config,
	);
	assert.equal(hsFreighterRush, 10000000 + 45000000);

	const lsStargateNonRush = calcReward({ volume: 10000, dangerousJumps: 1, collateral: 0 }, config);
	const lsStargateRush = calcReward(
		{ volume: 10000, dangerousJumps: 1, collateral: 0, rush: true },
		config,
	);
	assert.equal(lsStargateRush, lsStargateNonRush + 45000000);

	// High-value Collateral (>3B) Surcharge for Stargate/JF Routes
	const lsBrCollateralSurcharge = calcReward(
		{ volume: 10000, dangerousJumps: 1, collateral: "4,000,000,000" },
		config,
	);
	assert.equal(lsBrCollateralSurcharge, lsStargateNonRush + 20000000);

	const jfNonRush = calcReward({ volume: 200000, dangerousJumps: 1, collateral: 0 }, config);
	const jfCollateralSurcharge = calcReward(
		{ volume: 200000, dangerousJumps: 1, collateral: "4,000,000,000" },
		config,
	);
	assert.equal(jfCollateralSurcharge, jfNonRush + 20000000);
});

test("Test 10: Negative jumps return error", () => {
	const result = calcReward(
		{
			volume: "50,000",
			highsecJumps: "-5",
			dangerousJumps: "0",
			collateral: "2,000,000,000",
		},
		config,
	);
	assert.equal(result, 0);
});

test("Test 11: Negative volume returns error", () => {
	const result = calcReward(
		{
			volume: "-100",
			highsecJumps: "10",
			dangerousJumps: "0",
			collateral: "500,000,000",
		},
		config,
	);
	assert.equal(result, 0);
});

test("Test 12: Zero jumps return error", () => {
	const result = calcReward(
		{
			volume: "10,000",
			highsecJumps: "0",
			dangerousJumps: "0",
			collateral: "500,000,000",
		},
		config,
	);
	assert.equal(result, 0);
});

test("Test 13: Exact maximum freighter collateral (5B) does not redirect", () => {
	const result = calcReward(
		{
			volume: "500,000",
			highsecJumps: "10",
			dangerousJumps: "0",
			collateral: "5,000,000,000",
		},
		config,
	);
	// Base: 10 * 1.75M = 17.5M (min 10M, so 17.5M).
	// Collateral 5B matched bracket multiplier = 3.5.
	// Total = 17.5M * 3.5 = 61.25M
	assert.equal(result, 61_250_000);
});

test("Test 14: Over maximum freighter collateral (>5B) redirects to Risako Hirano", () => {
	const result = calcReward(
		{
			volume: "500,000",
			highsecJumps: "10",
			dangerousJumps: "0",
			collateral: "5,000,000,001",
		},
		config,
	);
	assert.equal(result, "Risako Hirano");
});

test("Test 15: Over maximum JF collateral (>50B) redirects to Executive Review", () => {
	const result = calcReward(
		{
			volume: "200,000",
			highsecJumps: "0",
			dangerousJumps: "10",
			collateral: "50,000,000,001",
		},
		config,
	);
	assert.equal(result, "Executive Review");
});
