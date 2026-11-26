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
  await page.evaluate(() => { window.__xr.spawn(0.3, 2.6, 0, 1.6); });
  await frames(6);
  const pose = async (name, pitch, pts, ql, qr, trig, grip) => {
    await page.evaluate(([pitch, pts, ql, qr, trig, grip]) => { const d = window.__dev; d.quaternion.set(-Math.sin(pitch / 2), 0, 0, Math.cos(pitch / 2)); const L = d.controllers.left, R = d.controllers.right; L.position.set(-pts[0], pts[1], pts[2]); R.position.set(pts[0], pts[1], pts[2]); L.quaternion.set(ql[0], ql[1], ql[2], ql[3]); R.quaternion.set(qr[0], qr[1], qr[2], qr[3]); [L, R].forEach(c => { c.updateButtonValue('trigger', trig); c.updateButtonValue('squeeze', grip); }); if (window.__xrg.toast) window.__xrg.toast.visible = false; }, [pitch, pts, ql, qr, trig, grip]);
    await frames(6); await page.screenshot({ path: path.join(outDir, name + '.png') });
  };
  await pose('a1_palms_down', 0.62, [0.2, 1.3, -0.36], [0.5, -0.5, -0.5, 0.5], [0.5, 0.5, 0.5, 0.5], 0, 0);
  await pose('a2_fists', 0.62, [0.2, 1.3, -0.36], [0.5, -0.5, -0.5, 0.5], [0.5, 0.5, 0.5, 0.5], 1, 1);
  await pose('a3_thumbs_up', 0.5, [0.22, 1.27, -0.45], [0.7071, 0, 0, 0.7071], [0.7071, 0, 0, 0.7071], 0, 0);
  console.log(log.join('\n'));
  console.log('errors:', errors.length ? [...new Set(errors)].slice(0, 12).join('\n') : 'none');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
