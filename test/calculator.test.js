import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { calcReward } from "../calculator.js";

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
	assert.equal(result, 47_500_000);
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
	assert.equal(result, 260_000_000);
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
	assert.equal(result, 650_000_000);
});

test("Test 7: Insurgency Warning Block", () => {
	const result = calcReward(
		{
			volume: "50,000",
			highsecJumps: "0",
			dangerousJumps: "10",
			collateral: "2,000,000,000",
			insurgency: true,
		},
		config,
	);
	assert.equal(result, "Insurgency Blocked");
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
	// 150M Base + 500M Jump + 0 Collateral + 150M Rush Surcharge = 800M
	assert.equal(result, 800_000_000);
});
