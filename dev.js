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
	".woff2": "font/woff2",
};

const server = http.createServer((req, res) => {
	const urlPath = req.url.split("?")[0];
	const target = urlPath === "/" ? "index.html" : urlPath.replace(/^\/+/, "");
	const filePath = path.resolve(__dirname, target);

	const rootWithSep = __dirname.endsWith(path.sep) ? __dirname : __dirname + path.sep;
	if (!filePath.startsWith(rootWithSep)) {
		res.writeHead(403, { "Content-Type": "text/plain" });
		res.end("403 Forbidden");
		return;
	}

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
			res.writeHead(200, {
				"Content-Type": contentType,
				"X-Content-Type-Options": "nosniff",
				"Access-Control-Allow-Origin": "*",
			});
			res.end(content);
		}
	});
});

server.listen(PORT, () => {
	console.log(`Server running at http://localhost:${PORT}/`);
});
