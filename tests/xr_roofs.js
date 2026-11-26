// Opens the headset page with an emulated Quest 2 (Meta's IWER), presses Enter VR, and moves the head and controllers.
const path = require('path'), fs = require('fs');
const { chromium } = require('playwright');
const [,, pageDir, outDir] = process.argv;
const NM = '/home/claude/silverback/node_modules';
const IWER = fs.readFileSync('/home/claude/xrtest/node_modules/iwer/build/iwer.min.js', 'utf8');
const b64 = f => fs.readFileSync(f).toString('base64');
const face = (fam, w, file) => `@font-face{font-family:'${fam}';font-weight:${w};src:url(data:font/woff2;base64,${b64(NM + '/@fontsource/' + file)}) format('woff2')}`;
const fontCss = [face('Anton', 400, 'anton/files/anton-latin-400-normal.woff2'), face('Sedgwick Ave Display', 400, 'sedgwick-ave-display/files/sedgwick-ave-display-latin-400-normal.woff2'), face('Sedgwick Ave', 400, 'sedgwick-ave/files/sedgwick-ave-latin-400-normal.woff2'),
  face('New Rocker', 400, 'new-rocker/files/new-rocker-latin-400-normal.woff2'), face('Urbanist', 450, 'urbanist/files/urbanist-latin-500-normal.woff2'), face('Urbanist', 650, 'urbanist/files/urbanist-latin-600-normal.woff2')].join('\n');
(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 640 }, ignoreHTTPSErrors: true })).newPage(), errors = [], log = [];
  page.on('pageerror', e => errors.push('PAGEERROR ' + e.message));
  page.on('console', m => { if ((m.type() === 'error' || m.type() === 'warning') && !/GL Driver|GPU stall|swiftshader/i.test(m.text())) errors.push(m.type() + ': ' + m.text().slice(0, 200)); });
  await page.addInitScript({ content: IWER + '\n;(function(){ window.__xrtest = true; var d = new IWER.XRDevice(IWER.metaQuest2); d.installRuntime({ forceInstall: true }); d.position.set(0, 1.6, 0); window.__dev = d; })();' });
  await page.route('**/cdnjs.cloudflare.com/**', r => r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(NM + '/three/build/three.min.js') }));
  await page.route('**/fonts.googleapis.com/**', r => r.fulfill({ contentType: 'text/css', body: fontCss }));
  await page.route('**/fonts.gstatic.com/**', r => r.abort());
  await page.route('https://sb.local/**', r => { const u = new URL(r.request().url()), f = path.join(pageDir, u.pathname === '/' ? 'index.html' : u.pathname.slice(1)); if (!fs.existsSync(f)) return r.fulfill({ status: 404, body: 'missing' }); r.fulfill({ contentType: f.endsWith('.json') ? 'application/json' : 'text/html', body: fs.readFileSync(f) }); });
  await page.goto('https://sb.local/index.html');
  await page.waitForSelector('.xr:not([hidden])', { timeout: 150000 });
  log.push('button: ' + await page.textContent('.xr'));
  await page.screenshot({ path: path.join(outDir, '0_page.png') });
  await page.click('.xr');
  await page.waitForFunction(() => window.__xrg && window.__xrg.on && window.__xrg.aligned && window.__xrg.frames > 3, null, { timeout: 120000 });
  const frames = async (n) => { const f0 = await page.evaluate(() => window.__xrg.frames); await page.waitForFunction((t) => window.__xrg.frames >= t, f0 + n, { timeout: 180000 }); };
  const st = () => page.evaluate(() => { const s = window.__xr.state(), X = window.__xrg; return { head: s.head, L: s.L, R: s.R, vel: s.vel, yaw: +X.yaw.toFixed(3), size: X.size, frames: X.frames, toast: X.toast && X.toast.visible, problems: window.__arena ? null : null }; });
  await page.evaluate(() => { const d = window.__dev; d.controllers.left.position.set(-0.25, 1.0, -0.2); d.controllers.right.position.set(0.25, 1.0, -0.2); });
  const views = [['r11_low_north', 36, 20, 36, 8.5, 14, 6], ['r12_R2_east', 6.5, 12, 14, 11, 12, 9.5]];
  for (const [name, x, z, tx, ty, tz, y] of views) {
    const yaw = Math.atan2(-(tx - x), -(tz - z)) + Math.PI;
    await page.evaluate(([x, z, yaw, y]) => { window.__xr.spawn(x, z, yaw, 1.6, y); }, [x, z, yaw, y]);
    await frames(8);
    const s0 = await st(), head = s0.head, hd = Math.hypot(tx - head[0], tz - head[2]), pitch = Math.atan2(head[1] - ty, hd);
    await page.evaluate((pitch) => { const d = window.__dev; d.quaternion.set(-Math.sin(pitch / 2), 0, 0, Math.cos(pitch / 2)); }, pitch);
    await page.evaluate(() => { if (window.__xrg.toast) window.__xrg.toast.visible = false; }); await frames(6);
    const s1 = await st(); log.push(name + ' head ' + JSON.stringify(s1.head) + ' aligned ' + (await page.evaluate(() => window.__xrg.aligned)));
    await page.screenshot({ path: path.join(outDir, name + ".png") });
  }
  console.log(log.join('\n'));
  console.log('errors:', errors.length ? [...new Set(errors)].slice(0, 12).join('\n') : 'none');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
