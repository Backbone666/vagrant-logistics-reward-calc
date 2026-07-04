import assert from "node:assert/strict";
import test from "node:test";
import { calcReward, calcRewardDetails } from "../calculator.js";

test("Test 1: BR Highsec (Small Package)", () => {
	const result = calcReward({
		volume: "10,000",
		jumps: "10",
		collateral: "500,000,000",
		routeSecurity: "highsec",
	});
	assert.equal(result, 11_000_000);
});

test("Test 2: DST Highsec (Medium Package)", () => {
	const result = calcReward({
		volume: "50,000",
		jumps: "10",
		collateral: "500,000,000",
		routeSecurity: "highsec",
	});
	assert.equal(result, 20_000_000);
});

test("Test 3: Freighter Highsec (Large Package)", () => {
	const result = calcReward({
		volume: "500,000",
		jumps: "10",
		collateral: "1,000,000,000",
		routeSecurity: "highsec",
	});
	assert.equal(result, 33_000_000);
});

test("Test 4: DST Highsec with Collateral (1-3B tier)", () => {
	const result = calcReward({
		volume: "50,000",
		jumps: "10",
		collateral: "2,000,000,000",
		routeSecurity: "highsec",
	});
	assert.equal(result, 26_000_000);
});

test("Test 5: DST Highsec with Collateral (3-5B tier)", () => {
	const result = calcReward({
		volume: "50,000",
		jumps: "10",
		collateral: "4,000,000,000",
		routeSecurity: "highsec",
	});
	assert.equal(result, 40_000_000);
});

test("Test 6: BR Lowsec", () => {
	const result = calcReward({
		volume: "10,000",
		jumps: "10",
		collateral: "500,000,000",
		routeSecurity: "dangerous",
	});
	assert.equal(result, 30_000_000);
});

test("Test 7: DST Lowsec (Our Competitive Advantage)", () => {
	const result = calcReward({
		volume: "50,000",
		jumps: "10",
		collateral: "2,000,000,000",
		routeSecurity: "dangerous",
	});
	assert.equal(result, 76_000_000);
});

test("Test 8: JF (CORRECTED PRICING)", () => {
	const result = calcReward({
		volume: "200,000",
		jumps: "10",
		collateral: "2,000,000,000",
		routeSecurity: "dangerous",
	});
	assert.equal(result, 506_000_000);
});

test("Test 9: Over 5B Collateral", () => {
	const result = calcReward({
		volume: "50,000",
		jumps: "10",
		collateral: "6,000,000,000",
		routeSecurity: "highsec",
	});
	assert.equal(result, "Risako Hirano");
});

test("Test calcRewardDetails breakdown", () => {
	const result = calcRewardDetails({
		volume: "50,000",
		jumps: "10",
		collateral: "2,000,000,000",
		routeSecurity: "dangerous",
	});
	assert.deepEqual(result, {
		isRedirect: false,
		total: 76_000_000,
		baseFee: 20_000_000,
		distanceFee: 50_000_000,
		collateralFee: 6_000_000,
		riskMultiplier: 1.0,
	});
});

test("Test calcRewardDetails error", () => {
	const result = calcRewardDetails({
		volume: "0",
		jumps: "10",
		collateral: "2,000,000,000",
		routeSecurity: "dangerous",
	});
	assert.deepEqual(result, { error: true });
});

test("Test calcRewardDetails redirect", () => {
	const result = calcRewardDetails({
		volume: "50,000",
		jumps: "10",
		collateral: "6,000,000,000",
		routeSecurity: "dangerous",
	});
	assert.deepEqual(result, {
		isRedirect: true,
		redirectTarget: "Risako Hirano",
	});
});
