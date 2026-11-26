const path = require('path'), fs = require('fs');
const { chromium } = require('playwright');
const pageDir = process.argv[2], NM = '/home/claude/silverback/node_modules';
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 800, height: 450 } })).newPage(), errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR ' + e.message));
  await page.addInitScript(() => { window.__manual = true; window.__xrtest = true; });
  await page.route('**/cdnjs.cloudflare.com/**', r => r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(NM + '/three/build/three.min.js') }));
  await page.route('**/fonts.googleapis.com/**', r => r.fulfill({ contentType: 'text/css', body: '' }));
  await page.route('**/fonts.gstatic.com/**', r => r.abort());
  await page.route('http://sb.local/**', r => { const u = new URL(r.request().url()), f = path.join(pageDir, u.pathname === '/' ? 'index.html' : u.pathname.slice(1)); r.fulfill({ body: fs.readFileSync(f), contentType: 'text/html' }); });
  await page.goto('http://sb.local/index.html');
  await page.waitForFunction(() => window.__arena || !document.getElementById('note').hidden, null, { timeout: 120000 });
  const res = await page.evaluate(new Function(fs.readFileSync(process.argv[3], 'utf8')));
  console.log(typeof res === 'string' ? res : JSON.stringify(res));
  console.log(errors.slice(0, 6).join('\n') || 'no errors');
  await browser.close();
})();
