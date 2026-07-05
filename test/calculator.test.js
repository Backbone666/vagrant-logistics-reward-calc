import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { calcReward, classifyService, calcRewardDetails, parseNum } from "../calculator.js";

const config = JSON.parse(
	fs.readFileSync(
		new URL("../rate_card_config.json", import.meta.url),
		"utf-8",
	),
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
	assert.equal(details.total, 27000000);
});

test("Sub-unit: parseNum handles number format cleanups", () => {
	assert.equal(parseNum("2,000,000,000"), 2000000000);
	assert.equal(parseNum(123.45), 123.45);
	assert.equal(parseNum(""), 0);
	assert.equal(parseNum(null), 0);
});


