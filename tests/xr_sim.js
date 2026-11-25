// Usage: node xr_sim.js <page dir>
// Loads the headset page on a desktop (no headset), builds the solid world, and runs the arm movement by numbers.
const path = require('path'), fs = require('fs');
const { chromium } = require('playwright');
const [,, pageDir] = process.argv;
const NM = '/home/claude/silverback/node_modules';
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 800, height: 450 } });
  const page = await ctx.newPage(), errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.addInitScript(() => { window.__manual = true; });
  await page.route('**/cdnjs.cloudflare.com/**', r => r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(NM + '/three/build/three.min.js') }));
  await page.route('**/fonts.googleapis.com/**', r => r.fulfill({ contentType: 'text/css', body: '' }));
  await page.route('**/fonts.gstatic.com/**', r => r.abort());
  await page.route('http://sb.local/**', r => { const u = new URL(r.request().url()), f = path.join(pageDir, u.pathname === '/' ? 'index.html' : u.pathname.slice(1)); if (!fs.existsSync(f)) return r.fulfill({ status: 404, body: 'missing' }); r.fulfill({ contentType: f.endsWith('.json') ? 'application/json' : 'text/html', body: fs.readFileSync(f) }); });
  await page.goto('http://sb.local/index.html');
  await page.waitForFunction(() => window.__arena || !document.getElementById('note').hidden, null, { timeout: 120000 });
  const res = await page.evaluate(() => {
    const X = window.__xr, out = {};
    if (!X) return { error: 'no __xr', problems: window.__arena && window.__arena.problems };
    let t0 = performance.now(); out.tris = X.build(); out.buildMs = Math.round(performance.now() - t0);
    out.problems = window.__arena.problems.slice();
    const D = X.size(1), dt = 1 / 72, k = 1.3, E = 1.05, eyeL = 1.6, groundL = eyeL - E / k, rL = D.rHand / k;
    out.dims = D; out.groundLocal = groundL;
    // A. resting: nothing in the hands, the body settles on the ground
    let s = X.spawn(0.3, 2.6, 0, eyeL); out.A0 = s.head;
    s = X.step(dt, [0, eyeL, 0], null, null, 150); out.A = { head: s.head, vel: s.vel, ground: s.ground };
    // B. hands a little below the ground: they hold the body up
    const hy = groundL + rL - 0.05;
    s = X.step(dt, [0, eyeL, 0], [0.25, hy, -0.35], [-0.25, hy, -0.35], 60); out.B = s;
    // C. both hands push back along the ground 0.4 m over 12 frames, then lift: the body goes forward and glides
    const zBefore = s.head[2]; let zs = [];
    for (let i = 1; i <= 12; i++) { const z = -0.35 + 0.4 * i / 12; s = X.step(dt, [0, eyeL, 0], [0.25, hy, z], [-0.25, hy, z]); zs.push(s.head[2]); }
    out.C_push = { dz: +(s.head[2] - zBefore).toFixed(3), vel: s.vel, L: s.L.coll, R: s.R.coll };
    for (let i = 1; i <= 4; i++) s = X.step(dt, [0, eyeL, 0], [0.25, hy + 0.08 * i, 0.05], [-0.25, hy + 0.08 * i, 0.05]);
    out.C_release = { vel: s.vel, L: s.L.coll, R: s.R.coll };
    s = X.step(dt, [0, eyeL, 0], [0.25, hy + 0.35, 0.05], [-0.25, hy + 0.35, 0.05], 90);
    out.C_glide = { dz: +(s.head[2] - zBefore).toFixed(3), head: s.head, vel: s.vel };
    // D. a hand pushed into the wall on the right (x = 3.5): it stops at the wall, and pushing on moves the body back
    s = X.spawn(2.3, 2.5, Math.PI / 2, eyeL); s = X.step(dt, [0, eyeL, 0], null, null, 60);
    const x0 = s.head[0]; let hit = null;
    for (let i = 1; i <= 30; i++) { s = X.step(dt, [0, eyeL, 0], null, [-0.1, eyeL - 0.3, -0.2 - 0.9 * i / 30]); if (s.R.coll && !hit) hit = { frame: i, last: s.R.last }; }
    out.D = { firstTouch: hit, handLastX: s.R.last[0], headMoved: +(s.head[0] - x0).toFixed(3), kind: s.R.kind };
    // E. a jump: hands push down fast, then let go
    s = X.spawn(0.3, 5.0, 0, eyeL); s = X.step(dt, [0, eyeL, 0], [0.25, hy, -0.3], [-0.25, hy, -0.3], 60);
    const y0 = s.head[1]; let apex = y0;
    for (let i = 1; i <= 6; i++) { s = X.step(dt, [0, eyeL, 0], [0.25, hy - 0.05 * i, -0.3], [-0.25, hy - 0.05 * i, -0.3]); }
    const pushed = s.head[1];
    s = X.step(dt, [0, eyeL, 0], [0.25, eyeL - 0.2, -0.3], [-0.25, eyeL - 0.2, -0.3]); const launch = s.vel;
    for (let i = 0; i < 120; i++) { s = X.step(dt, [0, eyeL, 0], [0.4, eyeL - 0.1, -0.2], [-0.4, eyeL - 0.1, -0.2]); apex = Math.max(apex, s.head[1]); }
    out.E = { rest: y0, afterPush: pushed, launchVel: launch, apex: +apex.toFixed(3), landed: s.head[1] };
    // F. the three sizes at rest
    out.F = [0, 1, 2].map(i => { X.size(i); const dd = X.size(i), kk = [1, 1.3, 1.6][i]; let q = X.spawn(0.3, 8.6, 0, eyeL); q = X.step(dt, [0, eyeL, 0], null, null, 120); return { size: i, head: q.head, wantEye: [0.8, 1.05, 1.3][i] }; });
    X.size(1);
    // G. speed: one step with both hands on the ground
    s = X.spawn(0.3, 5.0, 0, eyeL); X.step(dt, [0, eyeL, 0], [0.25, hy, -0.3], [-0.25, hy, -0.3], 20);
    t0 = performance.now(); for (let i = 0; i < 300; i++) { const z = -0.3 + 0.3 * Math.sin(i / 10); X.step(dt, [0, eyeL, 0], [0.25, hy, z], [-0.25, hy, z]); }
    out.G_msPerStep = +((performance.now() - t0) / 300).toFixed(3);
    out.G_end = X.state().head;
    return out;
  });
  console.log(JSON.stringify(res, null, 1));
  console.log('errors:', errors.length ? errors.slice(0, 8).join('\n') : 'none');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
