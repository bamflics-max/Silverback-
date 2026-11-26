const X = window.__xr, G = window.__xrg, e = 1.5, out = {};
X.build(); X.size(); out.ground = X.ground(0);
const k = G.k, R = G.R, DT = 1 / 72;
function rest(dt) { X.spawn(0.3, 2.6, 0, e); X.step(dt, [0, e, 0], null, null, Math.round(0.9 / dt)); return X.state().head; }
function push(speed, dt) {            // both hands straight down through the ground to full reach, at a real hand speed
  dt = dt || DT; const h0 = rest(dt); let y = e - R + 0.10, maxY = h0[1], s;
  while (y > e - 0.78) { y -= speed * dt; s = X.step(dt, [0, e, 0], [-0.2, y, -0.15], [0.2, y, -0.15]); maxY = Math.max(maxY, s.head[1]); }
  const rel = X.state().head[1];
  for (let i = 0; i < Math.round(0.08 / dt); i++) { y += 3 * dt; s = X.step(dt, [0, e, 0], [-0.2, y, -0.15], [0.2, y, -0.15]); maxY = Math.max(maxY, s.head[1]); }
  for (let i = 0; i < Math.round(1.6 / dt); i++) { s = X.step(dt, [0, e, 0], [-0.2, e - 0.3, -0.2], [0.2, e - 0.3, -0.2]); maxY = Math.max(maxY, s.head[1]); }
  return { handSpeed: speed, fps: Math.round(1 / dt), riseFeel: +((maxY - h0[1]) / k).toFixed(3), gorillaTag: +(0.78 - (R - 0.05) + Math.pow(1.1 * speed, 2) / 19.6).toFixed(3), riseWorld: +(maxY - h0[1]).toFixed(2) };
}
out.push = [push(1.5), push(2.0), push(3.0), push(2.0, 1 / 36), push(2.0, 1 / 90), push(2.0, 1 / 120)];
function bound(speed) {               // reach forward, pull down and back: one bound along the alley
  const h0 = rest(DT), A = [e - R + 0.08, -0.45], B = [e - 0.74, 0.0], n = Math.ceil(Math.hypot(B[0] - A[0], B[1] - A[1]) / (speed * DT)); let s, maxY = 0, air = 0;
  for (let i = 0; i <= n; i++) { const t = i / n, y = A[0] + (B[0] - A[0]) * t, z = A[1] + (B[1] - A[1]) * t; s = X.step(DT, [0, e, 0], [-0.2, y, z], [0.2, y, z]); }
  for (let i = 0; i < 180; i++) { s = X.step(DT, [0, e, 0], [-0.2, e - 0.25, -0.2], [0.2, e - 0.25, -0.2]); maxY = Math.max(maxY, s.head[1]); if (!s.ground) air++; }
  return { handSpeed: speed, distFeel: +((s.head[2] - h0[2]) / k).toFixed(2), distWorld: +(s.head[2] - h0[2]).toFixed(2), apexFeel: +((maxY - h0[1]) / k).toFixed(2), airSec: +(air * DT).toFixed(2) };
}
out.bound = [bound(2.0), bound(3.0)];
function run(n, speed) {              // bound after bound without stopping: hands hit the ground again before the body lands
  const h0 = rest(DT); let s, t = 0;
  for (let c = 0; c < n; c++) {
    const A = [e - R + 0.1, -0.42], B = [e - 0.72, 0.02], m = Math.ceil(Math.hypot(B[0] - A[0], B[1] - A[1]) / (speed * DT));
    for (let i = 0; i <= m; i++) { const u = i / m; s = X.step(DT, [0, e, 0], [-0.2, A[0] + (B[0] - A[0]) * u, A[1] + (B[1] - A[1]) * u], [0.2, A[0] + (B[0] - A[0]) * u, A[1] + (B[1] - A[1]) * u]); t += DT; }
    for (let i = 1; i <= 14; i++) { const u = i / 14, y = B[0] + (A[0] - B[0]) * u + 0.2 * Math.sin(Math.PI * u), z = B[1] + (A[1] - B[1]) * u; s = X.step(DT, [0, e, 0], [-0.2, y, z], [0.2, y, z]); t += DT; }
  }
  return { bounds: n, handSpeed: speed, distWorld: +(s.head[2] - h0[2]).toFixed(1), speedWorld: +((s.head[2] - h0[2]) / t).toFixed(2), speedFeel: +((s.head[2] - h0[2]) / t / k).toFixed(2) };
}
out.run = [run(6, 2.0), run(6, 3.0)];
function localFor(W) { const c = Math.cos(G.yaw), s = Math.sin(G.yaw); const dx = (W[0] - G.pos.x) / G.k, dy = (W[1] - G.pos.y) / G.k, dz = (W[2] - G.pos.z) / G.k; return [dx * c - dz * s, dy, dx * s + dz * c]; }
function climb(strokes, speed) {      // hand over hand up a flat brick wall (the dead end's, 13 m)
  X.spawn(-7.35, 25.5, 0, e); let s = X.step(DT, [0, e, 0], null, null, 50); const y0 = s.head[1], wallX = -8, r = G.D.rHand, top = 0.25, bot = -0.42, n = Math.round((top - bot) / (speed * DT)); let maxY = y0, touched = 0;
  for (let st = 0; st < strokes; st++) for (let i = 0; i <= n; i++) {
    const h = X.state().head, t = i / n, side = st % 2 ? 0.2 : -0.2;
    const a = localFor([wallX + r - 0.02, h[1], 25.5 + side]), b = localFor([wallX + r + 0.2, h[1], 25.5 - side]);
    a[1] = e + top + (bot - top) * t; b[1] = e + bot + (top - bot) * t;
    s = st % 2 ? X.step(DT, [0, e, 0], b, a) : X.step(DT, [0, e, 0], a, b); maxY = Math.max(maxY, s.head[1]); if (s.L.coll || s.R.coll) touched++;
  }
  return { strokes, handSpeed: speed, gainWorld: +(X.state().head[1] - y0).toFixed(2), topWorld: +(maxY - y0).toFixed(2), touchedFrames: touched, head: X.state().head, aligned: G.aligned };
}
out.climb = [climb(6, 2.0), climb(20, 2.5)];
return JSON.stringify(out, null, 0).replace(/\},\{/g, '},\n  {').replace(/"(push|bound|run|climb)":/g, '\n"$1":');
