import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import chat from '../api/chat.mjs';
const root = resolve(fileURLToPath(new URL('../public/', import.meta.url)));
const config = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url)));
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json', '.unityweb': 'application/octet-stream' };
const server = http.createServer(async (req, res) => {
  try {
    const host = req.headers.host ?? '';
    if (!/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)) { res.writeHead(403).end(); return; }
    const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    for (const rule of config.headers) {
      const matches = rule.source === '/(.*)' || rule.source === path ||
        (rule.source.endsWith('/:path*') && path.startsWith(rule.source.slice(0, -7)));
      if (matches) for (const { key, value } of rule.headers) res.setHeader(key, value);
    }
    if (path === '/api/chat') { await chat(req, res); return; }
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405).end(); return; }
    let target = resolve(root, '.' + path);
    if (target !== root && !target.startsWith(root.endsWith(sep) ? root : root + sep)) { res.writeHead(403).end(); return; }
    if ((await stat(target)).isDirectory()) target = resolve(target, 'index.html');
    const bytes = await readFile(target);
    res.setHeader('Content-Type', types[extname(target)] ?? 'application/octet-stream');
    res.setHeader('Content-Length', bytes.length);
    res.statusCode = 200;
    res.end(req.method === 'HEAD' ? undefined : bytes);
  } catch { if (!res.headersSent) res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('Not found'); }
});
const port = Number(process.env.PORT || 4173);
server.listen(port, '127.0.0.1', () => console.log(`Local: http://localhost:${port}`));
