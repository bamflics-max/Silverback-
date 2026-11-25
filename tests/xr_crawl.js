// Crawl with both arms from the street up onto the sidewalk, and up the stoop: the body must ride over curbs and steps.
const path = require('path'), fs = require('fs');
const { chromium } = require('playwright');
const [,, pageDir] = process.argv;
const NM = '/home/claude/silverback/node_modules';
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 800, height: 450 } })).newPage(), errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR ' + e.message));
  await page.addInitScript(() => { window.__manual = true; });
  await page.route('**/cdnjs.cloudflare.com/**', r => r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(NM + '/three/build/three.min.js') }));
  await page.route('**/fonts.googleapis.com/**', r => r.fulfill({ contentType: 'text/css', body: '' }));
  await page.route('**/fonts.gstatic.com/**', r => r.abort());
  await page.route('http://sb.local/**', r => { const u = new URL(r.request().url()), f = path.join(pageDir, u.pathname === '/' ? 'index.html' : u.pathname.slice(1)); r.fulfill({ contentType: f.endsWith('.json') ? 'application/json' : 'text/html', body: fs.readFileSync(f) }); });
  await page.goto('http://sb.local/index.html');
  await page.waitForFunction(() => window.__arena || !document.getElementById('note').hidden, null, { timeout: 120000 });
  const res = await page.evaluate(() => {
    const X = window.__xr, dt = 1 / 72, eyeL = 1.6, out = {}; X.build(); X.size(1);
    const groundL = eyeL - 1.05 / 1.3, hy = groundL + 0.052 - 0.03;
    function crawl(n, lift) {                              // n strides: both hands down in front, pull back, lift, reach forward again
      let s, track = [];
      for (let c = 0; c < n; c++) {
        for (let i = 0; i <= 10; i++) { const z = -0.4 + 0.45 * i / 10; s = X.step(dt, [0, eyeL, 0], [0.25, hy - 0.02, z], [-0.25, hy - 0.02, z]); }
        for (let i = 1; i <= 8; i++) { const z = 0.05 - 0.45 * i / 8, y = hy + (lift || 0.3) * Math.sin(Math.PI * i / 8); s = X.step(dt, [0, eyeL, 0], [0.25, y, z], [-0.25, y, z]); }
        track.push([s.head[0], s.head[1], s.head[2]].map(v => +v.toFixed(2)));
      }
      return track;
    }
    // 1. from the middle of the street to the far sidewalk (curb at z = 31.94, 0.14 high)
    X.spawn(10.5, 29.0, 0, eyeL); X.step(dt, [0, eyeL, 0], null, null, 60);
    out.toCurb = crawl(7);
    // 2. from the alley's stoop side: up the three stoop steps at the far end (x = -3.5 + steps, z = 19.5), crawling towards -x
    X.spawn(-0.2, 19.5, -Math.PI / 2, eyeL); X.step(dt, [0, eyeL, 0], null, null, 60);
    out.upStoop = crawl(8);
    // 3. along the alley floor, 10 strides: how far one stride takes you
    X.spawn(0.3, 4.0, 0, eyeL); X.step(dt, [0, eyeL, 0], null, null, 60);
    out.alley = crawl(10);
    return out;
  });
  console.log(JSON.stringify(res));
  console.log('errors:', errors.length ? errors.join('\n') : 'none');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
