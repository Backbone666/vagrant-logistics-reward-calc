import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const OUTPUT_FILE = path.join(ROOT_DIR, "data", "systems.json");

async function main() {
	console.log("Fetching solar systems list from CCP ESI...");
	const res = await fetch("https://esi.evetech.net/latest/universe/systems/");
	if (!res.ok) throw new Error(`Failed to fetch system IDs: HTTP ${res.status}`);
	const allIds = await res.json();

	// Filter K-space systems (30000000..30999999) plus Zarzakh (30100000)
	const kspaceIds = allIds.filter((id) => (id >= 30000000 && id < 31000000) || id === 30100000);
	console.log(`Found ${kspaceIds.length} K-space/Zarzakh system IDs.`);

	const names = [];
	const chunkSize = 1000;
	for (let i = 0; i < kspaceIds.length; i += chunkSize) {
		const chunk = kspaceIds.slice(i, i + chunkSize);
		const r = await fetch("https://esi.evetech.net/latest/universe/names/", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(chunk),
		});
		if (!r.ok) throw new Error(`Failed to fetch names chunk: HTTP ${r.status}`);
		const data = await r.json();
		names.push(...data.map((d) => d.name));
	}

	names.sort((a, b) => a.localeCompare(b));

	fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
	fs.writeFileSync(OUTPUT_FILE, JSON.stringify(names), "utf8");
	console.log(`Successfully wrote ${names.length} system names to ${OUTPUT_FILE}`);
}

main().catch((err) => {
	console.error("Error building systems data:", err);
	process.exit(1);
});
