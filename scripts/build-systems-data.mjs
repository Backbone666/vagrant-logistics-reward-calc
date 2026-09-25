import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchKspaceSystemIds } from "./build-highsec-data.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const OUTPUT_FILE = path.join(ROOT_DIR, "data", "systems.json");

async function main() {
	const kspaceIds = await fetchKspaceSystemIds({ includeZarzakh: true });
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

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
	main().catch((err) => {
		console.error("Error building systems data:", err);
		process.exit(1);
	});
}
