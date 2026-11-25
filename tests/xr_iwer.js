// Usage: node xr_iwer.js <page dir> <out dir>
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
  const t0 = Date.now(); await frames(10); log.push('ms per frame (SwiftShader, stereo): ' + Math.round((Date.now() - t0) / 10));
  log.push('after enter: ' + JSON.stringify(await st()));
  await page.screenshot({ path: path.join(outDir, '1_enter.png') });
  // hands down by the sides, then to the ground in front
  await page.evaluate(() => { const d = window.__dev; d.controllers.left.position.set(-0.25, 0.79, -0.4); d.controllers.right.position.set(0.25, 0.79, -0.4); });
  await frames(8); log.push('hands on ground: ' + JSON.stringify(await st()));
  await page.screenshot({ path: path.join(outDir, '2_hands_down.png') });
  // pull both hands back along the ground
  for (let i = 1; i <= 8; i++) { await page.evaluate((z) => { const d = window.__dev; d.controllers.left.position.set(-0.25, 0.77, z); d.controllers.right.position.set(0.25, 0.77, z); }, -0.4 + 0.45 * i / 8); await frames(1); }
  log.push('after pull: ' + JSON.stringify(await st()));
  await page.evaluate(() => { const d = window.__dev; d.controllers.left.position.set(-0.3, 1.25, -0.2); d.controllers.right.position.set(0.3, 1.25, -0.2); });
  await frames(12); log.push('after lift and glide: ' + JSON.stringify(await st()));
  // snap turn right
  const yaw0 = (await st()).yaw;
  await page.evaluate(() => window.__dev.controllers.right.updateAxes('thumbstick', 1, 0)); await frames(3);
  await page.evaluate(() => window.__dev.controllers.right.updateAxes('thumbstick', 0, 0)); await frames(3);
  log.push('turned by ' + (((await st()).yaw - yaw0) * 180 / Math.PI).toFixed(1) + ' degrees');
  // B: next size
  await page.evaluate(() => window.__dev.controllers.right.updateButtonValue('b-button', 1)); await frames(3);
  await page.evaluate(() => window.__dev.controllers.right.updateButtonValue('b-button', 0)); await frames(20);
  log.push('after B: ' + JSON.stringify(await st()));
  await page.screenshot({ path: path.join(outDir, '3_bigger.png') });
  // look down at your own arms, hands forward like a punch
  await page.evaluate(() => { const d = window.__dev; d.quaternion.set(-0.3827, 0, 0, 0.9239); d.controllers.left.position.set(-0.3, 1.2, -0.45); d.controllers.right.position.set(0.28, 1.0, -0.35); });
  await frames(6); await page.screenshot({ path: path.join(outDir, '4_look_down.png') });
  log.push('end: ' + JSON.stringify(await st()));
  // leave the headset: the page goes back to looking around
  await page.evaluate(() => window.__xrg.session.end()); await page.waitForTimeout(3000);
  log.push('after exit: ' + JSON.stringify(await page.evaluate(() => ({ on: window.__xrg.on, button: document.querySelector('.xr').textContent, note: document.getElementById('note').hidden ? null : document.getElementById('note').innerText, sub: document.querySelector('.sub').textContent }))));
  await page.screenshot({ path: path.join(outDir, '5_after_exit.png') });
  console.log(log.join('\n'));
  console.log('errors:', errors.length ? [...new Set(errors)].slice(0, 12).join('\n') : 'none');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
