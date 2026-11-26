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
  await page.addInitScript(() => { window.__manual = true; window.__xrtest = true; });
  await page.route('**/cdnjs.cloudflare.com/**', r => r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(NM + '/three/build/three.min.js') }));
  await page.route('**/fonts.googleapis.com/**', r => r.fulfill({ contentType: 'text/css', body: '' }));
  await page.route('**/fonts.gstatic.com/**', r => r.abort());
  await page.route('http://sb.local/**', r => { const u = new URL(r.request().url()), f = path.join(pageDir, u.pathname === '/' ? 'index.html' : u.pathname.slice(1)); if (!fs.existsSync(f)) return r.fulfill({ status: 404, body: 'missing' }); r.fulfill({ contentType: f.endsWith('.json') ? 'application/json' : 'text/html', body: fs.readFileSync(f) }); });
  await page.goto('http://sb.local/index.html');
  await page.waitForFunction(() => window.__arena || !document.getElementById('note').hidden, null, { timeout: 120000 });
  const res = await page.evaluate(() => {
    const X = window.__xr, G = window.__xrg, out = {}, dt = 1 / 72, eyeL = 1.5;
    const d3 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
    out.tris = X.build(); X.size(); X.eye(eyeL, 0);
    // a controller position that puts the hand at a street point W (the inverse of handTarget)
    function localFor(W) {
      const c = Math.cos(G.yaw), s = Math.sin(G.yaw), k = G.k, a = G.arm, H = G.headLocal, py = H.y - 0.22;
      const dx = (W[0] - G.pos.x) / k, dy = (W[1] - G.pos.y) / k, dz = (W[2] - G.pos.z) / k;
      const lx = dx * c - dz * s, lz = dx * s + dz * c, ly = dy;            // undo the turn
      return [H.x + (lx - H.x) / a, py + (ly - py) / a, H.z + (lz - H.z) / a];
    }
    out.settleDrift = []; for (let i = 0; i < X.props().length; i++) { const h = X.home(i); }
    const list = X.props(); out.count = {}; list.forEach(p => out.count[p.type] = (out.count[p.type] || 0) + 1);
    // 1. everything woken where it stands, nobody near: nothing should move or break
    X.spawn(0.3, 2.6, 0, eyeL); X.step(dt, [0, eyeL, 0], null, null, 30);
    list.forEach((p, i) => X.poke(i, 0, 0, 0));
    X.step(dt, [0, eyeL, 0], null, null, 72 * 4);
    const after = X.props();
    out.settleBad = after.map((p, i) => ({ i, type: p.type, home: list[i].p, now: p.p, moved: +d3(p.p, list[i].p).toFixed(3), broken: p.broken, asleep: p.asleep })).filter(o => o.moved > 0.03 || o.broken || !o.asleep);
    out.settleMax = Math.max(...after.map((p, i) => d3(p.p, list[i].p))).toFixed(3);
    // 2. drops onto the alley floor: a bottle from 1.4 m smashes, from 0.25 m it does not; a can clatters
    const bi = after.findIndex(p => p.type === 'bottle'), ci = after.findIndex(p => p.type === 'can'), ki = after.findIndex(p => p.type === 'ball');
    X.place(bi, 0.9, 1.4, 8); X.step(dt, [0, eyeL, 0], null, null, 72 * 2); out.dropHigh = X.props()[bi];
    X.step(dt, [0, eyeL, 0], null, null, 72 * 31); out.backHome = { p: X.props()[bi].p, home: list[bi].p, broken: X.props()[bi].broken };
    X.place(bi, 0.9, 0.35, 8); X.step(dt, [0, eyeL, 0], null, null, 72 * 2); out.dropLow = X.props()[bi];
    // 3. the ball dropped from 2 m: how high it bounces back
    X.place(ki, 1.5, 2.0, 9); let top = 0, fell = false;
    for (let i = 0; i < 72 * 3; i++) { X.step(dt, [0, eyeL, 0], null, null, 1); const y = X.props()[ki].p[1]; if (y < 0.2) fell = true; if (fell) top = Math.max(top, y); }
    out.ballBounce = +top.toFixed(3);
    // 4. the ball through the hoop: dropped just above the rim's middle
    const s0 = X.score(); X.place(ki, 38.77, 3.4, 29); X.step(dt, [0, eyeL, 0], null, null, 72 * 2); out.hoop = { scored: X.score() - s0, ball: X.props()[ki].p };
    // 5. grab a can: stand by it, hand over it, close the fist, lift, throw
    X.place(ci, 0.6, 0.2, 6.4); X.step(dt, [0, eyeL, 0], null, null, 72 * 2);
    const can0 = X.props()[ci].p; X.spawn(0.6, 7.3, 0, eyeL); X.step(dt, [0, eyeL, 0], null, null, 40);
    // the spawn faces +z: turn round to face the can (yaw pi)
    G.yaw = Math.PI; X.step(dt, [0, eyeL, 0], null, null, 5);
    const at = [can0[0], can0[1] + 0.05, can0[2]];
    let L = localFor(at); X.step(dt, [0, eyeL, 0], L.concat([0, 0]), null, 10);
    out.handNearCan = d3(X.state().L.last, at).toFixed(3);
    X.step(dt, [0, eyeL, 0], L.concat([1, 1]), null, 3);
    out.held = X.props()[ci].held;
    for (let i = 1; i <= 20; i++) { L = localFor([at[0], at[1] + 0.04 * i, at[2]]); X.step(dt, [0, eyeL, 0], L.concat([1, 1]), null, 1); }
    out.lifted = X.props()[ci].p;
    // throw: bring the hand in close, then swing it forward and up (towards -z in the street, since we face pi), then open
    const H0 = X.state().head;
    for (let i = 1; i <= 10; i++) { L = localFor([H0[0] + 0.2, H0[1] - 0.1, H0[2] - 0.25]); X.step(dt, [0, eyeL, 0], L.concat([1, 1]), null, 1); }
    const base = X.state().L.last; out.throwFrom = base;
    for (let i = 1; i <= 8; i++) { L = localFor([base[0], base[1] + 0.025 * i, base[2] - 0.07 * i]); X.step(dt, [0, eyeL, 0], L.concat([1, 1]), null, 1); }
    X.step(dt, [0, eyeL, 0], L.concat([0, 0]), null, 1);
    const rel = X.props()[ci].p; out.released = { held: X.props()[ci].held, at: rel, handTo: X.state().L.last };
    X.step(dt, [0, eyeL, 0], null, null, 72 * 3); out.landed = { p: X.props()[ci].p, flew: +d3(X.props()[ci].p, rel).toFixed(2) };
    // 6. knock a standing bottle over on open ground with a quick sweep at shin height
    X.place(bi, 0.9, 0.085, 10.5, true); X.step(dt, [0, eyeL, 0], null, null, 72 * 2);
    const b0 = X.props()[bi].p; X.spawn(0.9, 11.4, 0, eyeL); G.yaw = Math.PI; X.step(dt, [0, eyeL, 0], null, null, 30);
    for (let j = 0; j <= 14; j++) { L = localFor([b0[0] + 0.45 - 0.065 * j, 0.14, b0[2]]); X.step(dt, [0, eyeL, 0], L.concat([0, 0]), null, 1); }
    X.step(dt, [0, eyeL, 0], null, null, 72 * 2); const b1 = X.props()[bi]; out.knockOpen = { from: b0, to: b1.p, broken: b1.broken, fell: b1.p[1] < 0.05 };
    // 7. knock bottles off what they stand on: sweep from the side that is open air
    const hi = X.props().map((p, i) => [p, i]).filter(o => o[0].type === 'bottle' && o[0].p[1] > 0.3 && !o[0].broken);
    out.highBottles = hi.length; out.knockOff = [];
    hi.slice(0, 5).forEach(([B, i]) => {
      const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]], y = B.p[1] + 0.04;
      const d = dirs.find(d => { for (let t = 0.1; t <= 0.6; t += 0.05) if (!X.clear(B.p[0] + d[0] * t, y, B.p[2] + d[1] * t, 0.07)) return false; return X.clear(B.p[0] + d[0] * 1.2, y + 0.4, B.p[2] + d[1] * 1.2, 0.3); });
      if (!d) { out.knockOff.push({ i, at: B.p, skipped: 'no open side' }); return; }
      X.spawn(B.p[0] + d[0] * 1.1, B.p[2] + d[1] * 1.1, 0, eyeL); G.yaw = Math.atan2(d[0], d[1]); X.step(dt, [0, eyeL, 0], null, null, 30);
      for (let j = 0; j <= 14; j++) { const t = 0.5 - 0.07 * j; L = localFor([B.p[0] + d[0] * t, y, B.p[2] + d[1] * t]); X.step(dt, [0, eyeL, 0], L.concat([0, 0]), null, 1); }
      X.step(dt, [0, eyeL, 0], null, null, 72 * 2); const A = X.props()[i];
      out.knockOff.push({ i, at: B.p, now: A.p, broken: A.broken, dropped: +(B.p[1] - A.p[1]).toFixed(2) });
    });
    // 8. the call button: a hand pressed onto it
    X.spawn(-1.6, 1.1, 0, eyeL); X.step(dt, [0, eyeL, 0], null, null, 30);
    for (let j = 0; j <= 12; j++) { L = localFor([-2.0, 1.05, 0.35 - 0.025 * j]); X.step(dt, [0, eyeL, 0], L.concat([0, 0]), null, 1); }
    out.call = X.call(); out.callHand = X.state().L.last;
    // 9. the boombox: where it settled, then a hand coming down on its play key
    const bx = X.boom(); out.boomAt = bx.at;
    X.spawn(bx.at[0] - 0.9, bx.at[2], 0, eyeL); X.step(dt, [0, eyeL, 0], null, null, 30); X.step(dt, [0, eyeL, 0], null, null, 2);
    const key = X.boom().key; out.boomKey = key;
    for (let j = 0; j <= 10; j++) { L = localFor([key[0], key[1] + 0.25 - 0.03 * j, key[2]]); X.step(dt, [0, eyeL, 0], L.concat([0, 0]), null, 1); }
    out.boomAfter = X.boom(); out.boomHand = X.state().L.last;
    out.state = X.state();
    return out;
  });
  const sb = res.settleBad; delete res.settleBad; console.log("settleBad:"); sb.forEach(o => console.log(" ", JSON.stringify(o))); console.log(JSON.stringify(res));
  console.log(errors.slice(0, 6).join('\n') || 'no errors');
  await browser.close();
})();
