import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const OUTPUT_FILE = path.join(ROOT_DIR, "data", "highsec-systems.json");

const BATCH_CONCURRENCY = 60;
const HIGH_SEC_SECURITY_THRESHOLD = 0.45;
const KSPACE_MIN_SYSTEM_ID = 30000000;
const KSPACE_MAX_SYSTEM_ID = 31000000;
const ZARZAKH_SYSTEM_ID = 30100000;

export async function fetchKspaceSystemIds({ includeZarzakh = false } = {}) {
	console.log("Fetching solar systems list from CCP ESI...");
	const res = await fetch("https://esi.evetech.net/latest/universe/systems/");
	if (!res.ok) throw new Error(`Failed to fetch system IDs: HTTP ${res.status}`);
	const allIds = await res.json();
	return allIds.filter(
		(id) =>
			(id >= KSPACE_MIN_SYSTEM_ID && id < KSPACE_MAX_SYSTEM_ID) ||
			(includeZarzakh && id === ZARZAKH_SYSTEM_ID),
	);
}

async function fetchSystemWithRetry(id, retries = 3) {
	for (let attempt = 0; attempt < retries; attempt++) {
		try {
			const res = await fetch(`https://esi.evetech.net/latest/universe/systems/${id}/`);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			return await res.json();
		} catch (err) {
			if (attempt === retries - 1) throw err;
			await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
		}
	}
}

async function main() {
	const kspaceIds = await fetchKspaceSystemIds({ includeZarzakh: false });
	console.log(`Scanning security status for ${kspaceIds.length} K-space systems...`);

	const highSecSystemIds = [];
	let completed = 0;

	for (let i = 0; i < kspaceIds.length; i += BATCH_CONCURRENCY) {
		const chunk = kspaceIds.slice(i, i + BATCH_CONCURRENCY);
		const systems = await Promise.all(chunk.map((id) => fetchSystemWithRetry(id)));
		for (const sys of systems) {
			if (
				sys &&
				typeof sys.security_status === "number" &&
				sys.security_status >= HIGH_SEC_SECURITY_THRESHOLD
			) {
				highSecSystemIds.push(sys.system_id);
			}
		}
		completed += chunk.length;
		if (completed % 600 === 0 || completed === kspaceIds.length) {
			console.log(
				`Progress: ${completed}/${kspaceIds.length} checked (${highSecSystemIds.length} highsec found)...`,
			);
		}
	}

	highSecSystemIds.sort((a, b) => a - b);

	fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
	fs.writeFileSync(OUTPUT_FILE, JSON.stringify(highSecSystemIds), "utf8");
	const fileSize = fs.statSync(OUTPUT_FILE).size;
	console.log(
		`Successfully wrote ${highSecSystemIds.length} highsec system IDs to ${OUTPUT_FILE} (${fileSize} bytes)`,
	);
}

main().catch((err) => {
	console.error("Error building highsec systems data:", err);
	process.exit(1);
});
