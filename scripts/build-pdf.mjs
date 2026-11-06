// Build printable materials through an ephemeral local server, without deployment.
import { existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { resolve, extname, sep } from 'node:path';
const version = process.argv[2] || JSON.parse(readFileSync('package.json', 'utf8')).version;
if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error('Expected a release version, e.g. 0.3.0');
const fallback = '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || (existsSync(fallback) ? fallback : 'playwright'));
const root = resolve('dist');
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.woff': 'font/woff', '.svg': 'image/svg+xml' };
let server;
let baseURL = process.env.BASE_URL;
if (!baseURL) {
  server = createServer((request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      let path = resolve(root, '.' + pathname);
      if (path !== root && !path.startsWith(root + sep)) throw new Error('Invalid path');
      if (statSync(path).isDirectory()) path = resolve(path, 'index.html');
      response.writeHead(200, { 'Content-Type': mime[extname(path)] || 'application/octet-stream' });
      response.end(readFileSync(path));
    } catch { response.writeHead(404); response.end('Not found'); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  baseURL = 'http://127.0.0.1:' + server.address().port;
}
let browser;
try {
  browser = await chromium.launch({ headless: true, ...(existsSync('/usr/bin/chromium') ? { executablePath: '/usr/bin/chromium' } : {}), args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto(baseURL + '/learn/', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({ path: `dist/learn/downloads/parent-child-guide-${version}.pdf`, format: 'A4', printBackground: true, preferCSSPageSize: true, displayHeaderFooter: true, headerTemplate: '<span></span>', footerTemplate: `<div style="font-size:8px;color:#879278;width:100%;text-align:center">余烬王国 · 亲子游戏工坊 v${version}　 |　<span class="pageNumber"></span> / <span class="totalPages"></span></div>` });
  await page.goto(baseURL + '/learn/cards.html', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({ path: `dist/learn/downloads/designer-cards-${version}.pdf`, format: 'A4', printBackground: true, preferCSSPageSize: true });
  console.log(`Tutorial PDF and five printable cards generated for ${version}.`);
} finally {
  if (browser) await browser.close();
  if (server) await new Promise(resolve => server.close(resolve));
}
