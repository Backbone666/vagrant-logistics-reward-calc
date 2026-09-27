import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchKspaceSystemIds } from "./build-highsec-data.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const OUTPUT_FILE = path.join(ROOT_DIR, "data", "systems.json");

/**
 * EVE Online region IDs for operational Null-Sec space.
 */
export const PROVIDENCE_REGION_ID = 10000047;
export const CATCH_REGION_ID = 10000014;
export const SERVICED_NULLSEC_REGIONS = Object.freeze([PROVIDENCE_REGION_ID, CATCH_REGION_ID]);

const BATCH_CONCURRENCY = 60;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchWithRetry(url, retries = 3) {
	for (let attempt = 0; attempt < retries; attempt++) {
		try {
			const res = await fetch(url);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			return await res.json();
		} catch (err) {
			if (attempt === retries - 1) throw err;
			await delay(300 * (attempt + 1));
		}
	}
}

export async function fetchRegionSystemIds(regionId, fetchFn = fetchWithRetry) {
	const region = await fetchFn(`https://esi.evetech.net/latest/universe/regions/${regionId}/`);
	const systemIds = [];
	for (const cId of region.constellations) {
		const constellation = await fetchFn(
			`https://esi.evetech.net/latest/universe/constellations/${cId}/`,
		);
		systemIds.push(...constellation.systems);
	}
	return systemIds;
}

export async function fetchProvidenceAndCatchSystemIds(fetchFn = fetchWithRetry) {
	const provIds = await fetchRegionSystemIds(PROVIDENCE_REGION_ID, fetchFn);
	const catchIds = await fetchRegionSystemIds(CATCH_REGION_ID, fetchFn);
	return new Set([...provIds, ...catchIds]);
}

export function filterServicedSystems(systems, provCatchSet) {
	if (!Array.isArray(systems)) return [];
	const set = provCatchSet instanceof Set ? provCatchSet : new Set(provCatchSet || []);
	return systems.filter((sys) => {
		if (!sys || typeof sys.security_status !== "number") return false;
		return sys.security_status > 0.0 || set.has(sys.system_id);
	});
}

export async function scanServicedSystems(systemIds, provCatchSet, batchSize = BATCH_CONCURRENCY) {
	const names = [];
	let completed = 0;

	for (let i = 0; i < systemIds.length; i += batchSize) {
		const chunk = systemIds.slice(i, i + batchSize);
		const systems = await Promise.all(
			chunk.map((id) => fetchWithRetry(`https://esi.evetech.net/latest/universe/systems/${id}/`)),
		);

		const serviced = filterServicedSystems(systems, provCatchSet);
		for (const sys of serviced) {
			if (sys.name) names.push(sys.name);
		}

		completed += chunk.length;
		if (completed % 600 === 0 || completed === systemIds.length) {
			console.log(
				`Progress: ${completed}/${systemIds.length} systems scanned (${names.length} serviced retained)...`,
			);
		}
	}

	names.sort((a, b) => a.localeCompare(b));
	return names;
}

export function verifyServicedSystemsIntegrity(names) {
	if (!Array.isArray(names) || names.length < 2100 || names.length > 2200) {
		throw new Error(
			`Dataset size integrity check failed: expected 2100-2200 systems, got ${names?.length}`,
		);
	}

	const requiredAnchors = ["Jita", "Amarr", "Tama", "Rancer", "KBP7-G", "GE-8JV"];
	for (const anchor of requiredAnchors) {
		if (!names.includes(anchor)) {
			throw new Error(`Integrity check failed: required serviced system '${anchor}' is missing.`);
		}
	}

	const forbiddenAnchors = ["1DQ1-A", "O-OPOX", "R-ARKN", "B-R5RB", "Zarzakh"];
	for (const forbidden of forbiddenAnchors) {
		if (names.includes(forbidden)) {
			throw new Error(
				`Integrity check failed: unserviced system '${forbidden}' must not be present in dataset.`,
			);
		}
	}

	return true;
}

async function main() {
	console.log("1. Fetching Providence and Catch system IDs...");
	const provCatchSet = await fetchProvidenceAndCatchSystemIds();
	console.log(`Found ${provCatchSet.size} serviced Null-Sec system IDs (Providence + Catch).`);

	console.log("2. Fetching all K-space system IDs...");
	const kspaceIds = await fetchKspaceSystemIds({ includeZarzakh: false });
	console.log(`Found ${kspaceIds.length} K-space system IDs to evaluate.`);

	console.log("3. Scanning security status and filtering serviced systems...");
	const names = await scanServicedSystems(kspaceIds, provCatchSet);

	console.log("4. Running pre-write integrity checks...");
	verifyServicedSystemsIntegrity(names);

	fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
	fs.writeFileSync(OUTPUT_FILE, JSON.stringify(names), "utf8");
	const fileSize = fs.statSync(OUTPUT_FILE).size;
	console.log(
		`Successfully wrote ${names.length} serviced system names to ${OUTPUT_FILE} (${fileSize} bytes)`,
	);
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
	main().catch((err) => {
		console.error("Error building systems data:", err);
		process.exit(1);
	});
}
