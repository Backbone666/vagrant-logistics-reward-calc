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

function resolveSafeFilePath(urlPath, rootDir) {
	const cleanPath = urlPath.split("?")[0];
	const target = cleanPath === "/" ? "index.html" : cleanPath.replace(/^\/+/, "");
	const filePath = path.resolve(rootDir, target);
	const rootWithSep = rootDir.endsWith(path.sep) ? rootDir : rootDir + path.sep;
	if (!filePath.startsWith(rootWithSep)) return null;
	return filePath;
}

function serveStaticFile(res, filePath) {
	const ext = path.extname(filePath);
	const contentType = MIME_TYPES[ext] || "application/octet-stream";

	fs.readFile(filePath, (err, content) => {
		if (err) {
			const status = err.code === "ENOENT" ? 404 : 500;
			const msg = err.code === "ENOENT" ? "404 Not Found" : `Server Error: ${err.code}`;
			res.writeHead(status, { "Content-Type": "text/plain" });
			res.end(msg);
			return;
		}
		res.writeHead(200, {
			"Content-Type": contentType,
			"X-Content-Type-Options": "nosniff",
			"Access-Control-Allow-Origin": "*",
		});
		res.end(content);
	});
}

const server = http.createServer((req, res) => {
	const filePath = resolveSafeFilePath(req.url, __dirname);
	if (!filePath) {
		res.writeHead(403, { "Content-Type": "text/plain" });
		res.end("403 Forbidden");
		return;
	}
	serveStaticFile(res, filePath);
});

server.listen(PORT, () => {
	console.log(`Server running at http://localhost:${PORT}/`);
});
