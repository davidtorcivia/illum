// A static server over HTTP/2 and TLS with brotli for text, standing in for Cloudflare's edge when measuring (one
// connection, multiplexed, compressed; python's http.server is HTTP/1.0, a connection a request, uncompressed, which hides
// the very waterfall measured). usage: node tools/serve-h2.mjs <dir> <port>   (self-signed, in the system's temp folder:
// tools/firstpaint.mjs launches Chrome to accept it)
import http2 from 'node:http2';
import { readFileSync, statSync, existsSync, mkdirSync } from 'node:fs';
import { brotliCompressSync, constants } from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { join, extname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
const [d, port] = process.argv.slice(2), dir = resolve(d), here = tmpdir() + '/illum-h2';
if (!existsSync(here + '/key.pem')) { mkdirSync(here, { recursive: true }); execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', here + '/key.pem', '-out', here + '/cert.pem', '-days', '30', '-subj', '/CN=127.0.0.1'], { stdio: 'ignore' }); }
const T = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.webp': 'image/webp', '.png': 'image/png', '.txt': 'text/plain' };
const br = new Map();
http2.createSecureServer({ key: readFileSync(here + '/key.pem'), cert: readFileSync(here + '/cert.pem') }, (q, s) => {
  let p = decodeURIComponent(new URL(q.url, 'https://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const f = join(dir, p); if (!f.startsWith(dir) || !existsSync(f) || !statSync(f).isFile()) { s.writeHead(404); return s.end(); }
  const type = T[extname(f)] ?? 'application/octet-stream', text = /text|json|svg/.test(type);
  let body = readFileSync(f), h = { 'content-type': type, 'cache-control': 'public, max-age=0, must-revalidate' };
  if (text && /\bbr\b/.test(q.headers['accept-encoding'] ?? '')) { const k = f + statSync(f).mtimeMs; if (!br.has(k)) br.set(k, brotliCompressSync(body, { params: { [constants.BROTLI_PARAM_QUALITY]: 4 } })); body = br.get(k); h['content-encoding'] = 'br'; }
  s.writeHead(200, h); s.end(q.method === 'HEAD' ? undefined : body);
}).listen(+port, '127.0.0.1');
