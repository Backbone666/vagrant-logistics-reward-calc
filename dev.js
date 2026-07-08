import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

const MIME_TYPES = {
	".html": "text/html",
	".css": "text/css",
	".js": "text/javascript",
	".json": "application/json",
	".webp": "image/webp",
	".otf": "font/otf",
};

const server = http.createServer((req, res) => {
	const urlPath = req.url.split("?")[0];
	const filePath = path.join(__dirname, urlPath === "/" ? "index.html" : urlPath);
	const ext = path.extname(filePath);
	const contentType = MIME_TYPES[ext] || "application/octet-stream";

	fs.readFile(filePath, (err, content) => {
		if (err) {
			if (err.code === "ENOENT") {
				res.writeHead(404, { "Content-Type": "text/plain" });
				res.end("404 Not Found");
			} else {
				res.writeHead(500, { "Content-Type": "text/plain" });
				res.end(`Server Error: ${err.code}`);
			}
		} else {
			res.writeHead(200, { "Content-Type": contentType });
			res.end(content, "utf-8");
		}
	});
});

server.listen(PORT, () => {
	console.log(`Server running at http://localhost:${PORT}/`);
});
