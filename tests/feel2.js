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
function localFor(W) { const c = Math.cos(G.yaw), s = Math.sin(G.yaw); const dx = (W[0] - G.pos.x) / G.k, dy = (W[1] - G.pos.y) / G.k, dz = (W[2] - G.pos.z) / G.k; return [dx * c - dz * s, dy, dx * s + dz * c]; }
function climb(strokes, speed) {      // hand over hand up a flat brick wall (the dead end's, 13 m): each hand reaches to the wall, then pulls straight down past the body
  X.spawn(-7.35, 25.5, 0, e); let s = X.step(DT, [0, e, 0], null, null, 50); const y0 = s.head[1], wallX = -8, r = G.D.rHand, top = 0.25, bot = -0.42, n = Math.round((top - bot) / (speed * DT)); let maxY = y0, touched = 0, a;
  for (let st = 0; st < strokes; st++) for (let i = 0; i <= n; i++) {
    const h = X.state().head, t = i / n, side = st % 2 ? 0.2 : -0.2;
    if (i === 0) a = localFor([wallX + r - 0.015, h[1], h[2] + side]);
    const b = localFor([wallX + r + 0.2, h[1], h[2] - side]);
    a[1] = e + top + (bot - top) * t; b[1] = e + bot + (top - bot) * t;
    s = st % 2 ? X.step(DT, [0, e, 0], b, a.slice()) : X.step(DT, [0, e, 0], a.slice(), b); maxY = Math.max(maxY, s.head[1]); if (s.L.coll || s.R.coll) touched++;
  }
  return { strokes, handSpeed: speed, gainWorld: +(X.state().head[1] - y0).toFixed(2), topWorld: +(maxY - y0).toFixed(2), touchedFrames: touched, of: strokes * (n + 1), head: X.state().head, aligned: G.aligned };
}
out.climb = [climb(6, 2.0), climb(22, 2.5), climb(22, 1.5)];
return JSON.stringify(out).replace(/\},\{/g, '},\n  {');
