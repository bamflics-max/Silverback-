/* ================================================================== */
/* The headset. On a Quest, Enter VR puts you in the street as a       */
/* gorilla who moves only with his arms, the way Gorilla Tag moves     */
/* you: a hand that touches something stays where it touched, so       */
/* pushing it moves you, and letting go mid-swing throws you. The      */
/* rules follow Gorilla Tag's open-source GorillaLocomotion (MIT,      */
/* Another Axiom); this is a fresh JavaScript version for this page.   */
/* ================================================================== */
/* k: how many times bigger than you your gorilla is (your arms reach k times as far). E: how high its eyes sit off the ground, resting on its body. */
/* E / k is the same for all three, about 0.8 m, so the ground always meets your hands near your thighs, the way it does in Gorilla Tag.     */
var SIZES = [{ name: 'Gorilla Tag size', k: 1.0, E: 0.8 }, { name: 'Big', k: 1.3, E: 1.05 }, { name: 'Silverback size', k: 1.6, E: 1.3 }];
var G = 9.8;
var XRG = {
  on: false, session: null, ref: null, cam: null, rig: null, me: null, world: null, button: null,
  size: 1, k: 1.3, E: 1.05, D: null, EYE0: 1.347, EYEM: V(0, 1.347, 0.342),
  pos: V(0, 0, 0), yaw: 0, vel: V(0, 0, 0), ground: false, time: 0,
  headLocal: V(0, 1.6, 0), headQ: new T.Quaternion(), poseSeen: false, aligned: false, failed: false,
  hands: ['left', 'right'].map(function (side) { return { side: side, arm: side === 'left' ? 1 : -1, local: V(0, 0, 0), q: new T.Quaternion(), cur: V(0, 0, 0), last: V(0, 0, 0), prev: V(0, 0, 0), was: false, coll: false, kind: 0, src: null, tracked: false, tapAt: 0 }; }),
  hist: [], histI: 0, spheres: [], col: null, spawn: { pos: V(0.3, 0, 2.6), yaw: 0 },
  held: { turn: false, size: false, home: false }, toast: null, toastT: 0
};
var HW = V(0, 0, 0), BW = V(0, 0, 0), TMP = V(0, 0, 0), MOVE = V(0, 0, 0), TRAVEL = V(0, 0, 0), START = V(0, 0, 0), AVG = V(0, 0, 0), OFF = V(0, 0, 0), LW = V(0, 0, 0);
var FIRST = [V(0, 0, 0), V(0, 0, 0)];

function xrSize(i, live) {                               /* live: in the headset, so keep the head where it is and resize the others too */
  var z = SIZES[i];
  if (live) toWorld(XRG.headLocal, HW);
  XRG.size = i; XRG.k = z.k; XRG.E = z.E;
  XRG.D = { rHand: 0.065 * z.E, rHead: 0.17 * z.E, rBody: 0.3 * z.E, drop: 0.7 * z.E, maxArm: 1.25 * z.k, unstick: z.k, velLimit: 0.3 * z.k, maxJump: 6.5 * Math.pow(z.k, 0.75) };
  var s = z.E / XRG.EYE0;                                /* every gorilla is the player's size, so the ones standing about are what other players will look like */
  if (XRG.on) fighters.forEach(function (f) { f.root.scale.setScalar(s); });
  XRG.spheres = fighters.map(function (f) { return { x: f.root.position.x, y: f.root.position.y + 0.72 * s, z: f.root.position.z, r: 0.5 * s }; });
  if (live) { placeAround(HW); settle(false); unstick(); }
}

/* ---------------- the solid world: every surface you can touch, sorted into a grid of cells ---------------- */
/* Lights, wires, bulbs, marks on surfaces and little things (bottles, labels, bananas, the hats on show) are left out, so a hand never snags on them. */
var NOHIT = { wire: 1, bulbE: 1, dripS: 1, poolO: 1, poolF: 1, blob: 1, strip: 1, puddle: 1, cardF: 1, glassB: 1, glassBr: 1, labelP: 1, banana: 1, tape: 1, itemA: 1, itemB: 1, itemC: 1, stain1: 1, stain2: 1, drip: 1, rustDrip: 1 };
/* what each surface sounds like under a hand: 0 stone, 1 metal, 2 wood, 3 soft, 4 glass */
var KIND = { steelK: 1, steelG: 1, galv: 1, panelK: 1, lidK: 1, paintG: 1, drumB: 1, drumR: 1, drumK: 1, drumLid: 1, drumIn: 1, rustS: 1, doorG: 1, shutter: 1, grate: 1, hazardS: 1, fenceS: 1, rimO: 1, hydR: 1, callB: 1,
  woodS: 2, boards: 2, card: 2, shopF: 2, boardW: 2,
  bagK: 3, bagW: 3, tarpB: 3, tarpR: 3, tarpG: 3, awnS: 3, cushK: 3, clothA: 3, clothB: 3, clothC: 3, bagL1: 3, bagL2: 3, bagL3: 3, matK: 3, tireS: 3, rubberS: 3, coneT: 3, coneB: 3, ballO: 3,
  winDark: 4, winLit: 4, winLit2: 4, glassM: 4, glassS: 4 };
var CELL = 0.75;
function cellKey(ix, iy, iz) { return ((ix + 1024) * 2048 + (iy + 1024)) * 2048 + (iz + 1024); }
function buildCollision(world) {
  var list = [], n = 0, ident = new T.Matrix4();
  world.updateMatrixWorld(true);
  world.traverse(function (o) {
    if (!o.isMesh || !o.userData.key || NOHIT[o.userData.key] || !o.geometry || !o.geometry.attributes.position) return;
    list.push(o); n += o.geometry.index ? o.geometry.index.count / 3 : o.geometry.attributes.position.count / 3;
  });
  var tri = new Float32Array(n * 9), box = new Float32Array(n * 6), kind = new Uint8Array(n), m = 0, p = V(0, 0, 0);
  list.forEach(function (o) {
    var arr = o.geometry.attributes.position.array, idx = o.geometry.index ? o.geometry.index.array : null, count = idx ? idx.length : arr.length / 3;
    var same = o.matrixWorld.equals(ident), kd = KIND[o.userData.key] || 0, i, v;
    for (i = 0; i + 2 < count; i += 3) {
      var o9 = m * 9;
      for (v = 0; v < 3; v++) {
        var j = (idx ? idx[i + v] : i + v) * 3;
        p.set(arr[j], arr[j + 1], arr[j + 2]); if (!same) p.applyMatrix4(o.matrixWorld);
        tri[o9 + v * 3] = p.x; tri[o9 + v * 3 + 1] = p.y; tri[o9 + v * 3 + 2] = p.z;
      }
      var ax = tri[o9], ay = tri[o9 + 1], az = tri[o9 + 2], ux = tri[o9 + 3] - ax, uy = tri[o9 + 4] - ay, uz = tri[o9 + 5] - az, wx = tri[o9 + 6] - ax, wy = tri[o9 + 7] - ay, wz = tri[o9 + 8] - az;
      var cx = uy * wz - uz * wy, cy = uz * wx - ux * wz, cz = ux * wy - uy * wx;
      if (cx * cx + cy * cy + cz * cz < 1e-12) continue;  /* a sliver with no area */
      var b6 = m * 6;
      box[b6] = Math.min(ax, tri[o9 + 3], tri[o9 + 6]); box[b6 + 1] = Math.min(ay, tri[o9 + 4], tri[o9 + 7]); box[b6 + 2] = Math.min(az, tri[o9 + 5], tri[o9 + 8]);
      box[b6 + 3] = Math.max(ax, tri[o9 + 3], tri[o9 + 6]); box[b6 + 4] = Math.max(ay, tri[o9 + 4], tri[o9 + 7]); box[b6 + 5] = Math.max(az, tri[o9 + 5], tri[o9 + 8]);
      kind[m] = kd; m++;
    }
  });
  function each(t, fn) {
    var b = t * 6, x0 = Math.floor(box[b] / CELL), x1 = Math.floor(box[b + 3] / CELL), y0 = Math.floor(box[b + 1] / CELL), y1 = Math.floor(box[b + 4] / CELL), z0 = Math.floor(box[b + 2] / CELL), z1 = Math.floor(box[b + 5] / CELL);
    for (var ix = x0; ix <= x1; ix++) for (var iy = y0; iy <= y1; iy++) for (var iz = z0; iz <= z1; iz++) fn(cellKey(ix, iy, iz));
  }
  var cells = new Map(), total = 0, t;
  for (t = 0; t < m; t++) each(t, function (key) { var c = cells.get(key); if (c) c[1]++; else cells.set(key, [0, 1]); });
  cells.forEach(function (c) { c[0] = total; total += c[1]; c[1] = 0; });
  var items = new Int32Array(total);
  for (t = 0; t < m; t++) each(t, function (key) { var c = cells.get(key); items[c[0] + c[1]] = t; c[1]++; });
  XRG.col = { tri: tri, box: box, kind: kind, n: m, cells: cells, items: items, seen: new Int32Array(m), stamp: 0 };
  return m;
}
var CP = { x: 0, y: 0, z: 0 };
function closestOnTri(T9, o, px, py, pz) {                /* the point of a triangle nearest to p (Ericson, Real-Time Collision Detection 5.1.5) */
  var ax = T9[o], ay = T9[o + 1], az = T9[o + 2], bx = T9[o + 3], by = T9[o + 4], bz = T9[o + 5], cx = T9[o + 6], cy = T9[o + 7], cz = T9[o + 8];
  var abx = bx - ax, aby = by - ay, abz = bz - az, acx = cx - ax, acy = cy - ay, acz = cz - az, apx = px - ax, apy = py - ay, apz = pz - az;
  var d1 = abx * apx + aby * apy + abz * apz, d2 = acx * apx + acy * apy + acz * apz;
  if (d1 <= 0 && d2 <= 0) { CP.x = ax; CP.y = ay; CP.z = az; return; }
  var bpx = px - bx, bpy = py - by, bpz = pz - bz, d3 = abx * bpx + aby * bpy + abz * bpz, d4 = acx * bpx + acy * bpy + acz * bpz;
  if (d3 >= 0 && d4 <= d3) { CP.x = bx; CP.y = by; CP.z = bz; return; }
  var vc = d1 * d4 - d3 * d2;
  if (vc <= 0 && d1 >= 0 && d3 <= 0) { var v = d1 / (d1 - d3); CP.x = ax + v * abx; CP.y = ay + v * aby; CP.z = az + v * abz; return; }
  var cpx = px - cx, cpy = py - cy, cpz = pz - cz, d5 = abx * cpx + aby * cpy + abz * cpz, d6 = acx * cpx + acy * cpy + acz * cpz;
  if (d6 >= 0 && d5 <= d6) { CP.x = cx; CP.y = cy; CP.z = cz; return; }
  var vb = d5 * d2 - d1 * d6;
  if (vb <= 0 && d2 >= 0 && d6 <= 0) { var w = d2 / (d2 - d6); CP.x = ax + w * acx; CP.y = ay + w * acy; CP.z = az + w * acz; return; }
  var va = d3 * d6 - d5 * d4;
  if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) { var u = (d4 - d3) / ((d4 - d3) + (d5 - d6)); CP.x = bx + u * (cx - bx); CP.y = by + u * (cy - by); CP.z = bz + u * (cz - bz); return; }
  var den = 1 / (va + vb + vc), v2 = vb * den, w2 = vc * den;
  CP.x = ax + abx * v2 + acx * w2; CP.y = ay + aby * v2 + acy * w2; CP.z = az + abz * v2 + acz * w2;
}
/* The nearest surface within r of p: how far (d), which way is out (n), and what it is made of. Gorillas standing about count as round, soft bodies. */
var Q = { hit: false, d: 0, nx: 0, ny: 1, nz: 0, kind: 0 };
function nearest(px, py, pz, r) {
  var c = XRG.col, best = r * r, found = -1, bx = 0, by = 0, bz = 0, ix, iy, iz, j;
  Q.hit = false;
  if (c) {
    c.stamp++; if (c.stamp > 2000000000) { c.seen.fill(0); c.stamp = 1; }
    var x0 = Math.floor((px - r) / CELL), x1 = Math.floor((px + r) / CELL), y0 = Math.floor((py - r) / CELL), y1 = Math.floor((py + r) / CELL), z0 = Math.floor((pz - r) / CELL), z1 = Math.floor((pz + r) / CELL);
    var box = c.box, items = c.items, seen = c.seen, stamp = c.stamp;
    for (ix = x0; ix <= x1; ix++) for (iy = y0; iy <= y1; iy++) for (iz = z0; iz <= z1; iz++) {
      var cell = c.cells.get(cellKey(ix, iy, iz)); if (!cell) continue;
      for (j = cell[0]; j < cell[0] + cell[1]; j++) {
        var t = items[j]; if (seen[t] === stamp) continue; seen[t] = stamp;
        var b = t * 6;
        if (px + r < box[b] || px - r > box[b + 3] || py + r < box[b + 1] || py - r > box[b + 4] || pz + r < box[b + 2] || pz - r > box[b + 5]) continue;
        closestOnTri(c.tri, t * 9, px, py, pz);
        var dx = px - CP.x, dy = py - CP.y, dz = pz - CP.z, d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < best) { best = d2; found = t; bx = CP.x; by = CP.y; bz = CP.z; }
      }
    }
  }
  var bestD = r;
  if (found >= 0) {
    bestD = Math.sqrt(best); Q.hit = true; Q.d = bestD; Q.kind = c.kind[found];
    if (bestD > 1e-5) { Q.nx = (px - bx) / bestD; Q.ny = (py - by) / bestD; Q.nz = (pz - bz) / bestD; }
    else {                                                 /* exactly on the surface: use the face's own normal */
      var T9 = c.tri, o = found * 9, ux = T9[o + 3] - T9[o], uy = T9[o + 4] - T9[o + 1], uz = T9[o + 5] - T9[o + 2], wx = T9[o + 6] - T9[o], wy = T9[o + 7] - T9[o + 1], wz = T9[o + 8] - T9[o + 2];
      var nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx, l = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
      Q.nx = nx / l; Q.ny = ny / l; Q.nz = nz / l;
    }
  }
  for (j = 0; j < XRG.spheres.length; j++) {
    var S = XRG.spheres[j], sx = px - S.x, sy = py - S.y, sz = pz - S.z, sd = Math.sqrt(sx * sx + sy * sy + sz * sz), gap = sd - S.r;
    if (gap < bestD && gap < r) {
      bestD = gap; Q.hit = true; Q.d = gap; Q.kind = 3;
      if (sd > 1e-5) { Q.nx = sx / sd; Q.ny = sy / sd; Q.nz = sz / sd; } else { Q.nx = 0; Q.ny = 1; Q.nz = 0; }
    }
  }
  return Q;
}

/* ---------------- moving: the rig, the head and body, the hands ---------------- */
function toWorld(l, out) {                               /* a point in the headset's own space (metres in your room) to the street */
  var c = Math.cos(XRG.yaw), s = Math.sin(XRG.yaw), k = XRG.k;
  return out.set(XRG.pos.x + k * (l.x * c + l.z * s), XRG.pos.y + k * l.y, XRG.pos.z + k * (-l.x * s + l.z * c));
}
function placeAround(H) {                                /* put the rig so that the head lands at H */
  var c = Math.cos(XRG.yaw), s = Math.sin(XRG.yaw), k = XRG.k, l = XRG.headLocal;
  XRG.pos.set(H.x - k * (l.x * c + l.z * s), H.y - k * l.y, H.z - k * (-l.x * s + l.z * c));
}
function pushOut(p, r, physics) {                        /* if a sphere round p overlaps something, move the whole rig clear of it */
  var q = nearest(p.x, p.y, p.z, r); if (!q.hit) return false;
  var push = r - q.d + 0.001;
  XRG.pos.x += q.nx * push; XRG.pos.y += q.ny * push; XRG.pos.z += q.nz * push;
  if (physics) {                                         /* moving into a surface stops; moving along it goes on */
    var vn = XRG.vel.x * q.nx + XRG.vel.y * q.ny + XRG.vel.z * q.nz;
    if (vn < 0) { XRG.vel.x -= q.nx * vn; XRG.vel.y -= q.ny * vn; XRG.vel.z -= q.nz * vn; }
    if (q.ny > 0.55) XRG.ground = true;
  }
  return true;
}
function settle(physics) {                               /* the head and the body under it never sit inside anything */
  var D = XRG.D;
  for (var it = 0; it < 5; it++) {
    toWorld(XRG.headLocal, HW);
    if (pushOut(HW, D.rHead, physics)) continue;
    BW.set(HW.x, HW.y - D.drop, HW.z);
    if (pushOut(BW, D.rBody, physics)) continue;
    break;
  }
}
function moveBody(dx, dy, dz, physics) {                 /* move the rig in steps small enough that the head can never pass through a wall */
  var len = Math.sqrt(dx * dx + dy * dy + dz * dz), steps = Math.min(40, Math.max(1, Math.ceil(len / (0.3 * XRG.D.rHead))));
  for (var i = 0; i < steps; i++) { XRG.pos.x += dx / steps; XRG.pos.y += dy / steps; XRG.pos.z += dz / steps; settle(physics); }
}
var CAST = { hit: false, pos: V(0, 0, 0), kind: 0 }, CASTP = V(0, 0, 0);
function castHand(start, move, r) {                      /* slide a hand from start by move; stop at the first surface it meets */
  var len = move.length(), steps = Math.min(40, Math.max(1, Math.ceil(len / (r * 0.4)))), q, i, it;
  CAST.hit = false;
  for (i = 1; i <= steps; i++) {
    CASTP.copy(start).addScaledVector(move, i / steps);
    q = nearest(CASTP.x, CASTP.y, CASTP.z, r);
    if (q.hit) {
      for (it = 0; it < 4 && q.hit; it++) { var push = r - q.d + 0.0005; CASTP.x += q.nx * push; CASTP.y += q.ny * push; CASTP.z += q.nz * push; CAST.kind = q.kind; q = nearest(CASTP.x, CASTP.y, CASTP.z, r); }
      CAST.hit = true; CAST.pos.copy(CASTP); return CAST;
    }
  }
  CAST.pos.copy(CASTP);
  q = nearest(CASTP.x, CASTP.y, CASTP.z, r + 0.003);    /* resting against something counts as touching it */
  if (q.hit) { CAST.hit = true; CAST.kind = q.kind; }
  return CAST;
}
function handTarget(h, out) {                            /* where the tracked hand is in the street: the grip, a little forward to the knuckles, no further than an arm from the head */
  OFF.set(0, 0, -0.03).applyQuaternion(h.q); LW.copy(h.local).add(OFF);
  toWorld(LW, out);
  var d = out.distanceTo(HW), max = XRG.D.maxArm;
  if (d > max) out.sub(HW).multiplyScalar(max / d).add(HW);
  return out;
}
function fromHead(h) {                                   /* a hand that has just appeared reaches out from the head, so it can never start inside a wall or under the ground */
  handTarget(h, h.cur);
  castHand(HW, TMP.subVectors(h.cur, HW), XRG.D.rHand);
  h.last.copy(CAST.pos); h.prev.copy(h.cur); h.was = h.coll = false;
}
function unstick() { toWorld(XRG.headLocal, HW); XRG.hands.forEach(function (h) { if (h.tracked) { fromHead(h); h.seen = true; } else { h.seen = false; h.was = h.coll = false; } }); }

function xrStep(dt) {
  var D = XRG.D, H = XRG.hands, i, h;
  XRG.time += dt; START.copy(XRG.pos); XRG.ground = false;
  /* 1. falling and flying: gravity and whatever speed you have, the head and body kept out of everything */
  XRG.vel.y -= G * dt;
  moveBody(XRG.vel.x * dt, XRG.vel.y * dt, XRG.vel.z * dt, true);
  if (XRG.ground) { var f = Math.exp(-10 * dt); XRG.vel.x *= f; XRG.vel.z *= f; }
  /* 2. the hands: one that touches something holds on there, and the body moves to keep it there */
  toWorld(XRG.headLocal, HW);
  for (i = 0; i < 2; i++) {
    h = H[i]; h.coll = false; FIRST[i].set(0, 0, 0);
    if (!h.tracked) { h.seen = false; h.was = false; continue; }
    if (!h.seen) { fromHead(h); h.seen = true; }
    handTarget(h, h.cur);
    TRAVEL.subVectors(h.cur, h.last); TRAVEL.y -= 2 * G * dt * dt;                 /* a hand at rest still leans its weight on the ground */
    if (castHand(h.last, TRAVEL, D.rHand).hit) {
      if (h.was) FIRST[i].subVectors(h.last, h.cur); else FIRST[i].subVectors(CAST.pos, h.cur);
      XRG.vel.set(0, 0, 0); h.coll = true; h.kind = CAST.kind;
    }
  }
  MOVE.copy(FIRST[0]).add(FIRST[1]);
  if ((H[0].coll || H[0].was) && (H[1].coll || H[1].was)) MOVE.multiplyScalar(0.5);      /* both hands down: go by the average of the two */
  if (MOVE.lengthSq() > 0) moveBody(MOVE.x, MOVE.y, MOVE.z, false);
  /* 3. where each hand ends up after the body moved */
  toWorld(XRG.headLocal, HW);
  for (i = 0; i < 2; i++) {
    h = H[i];
    if (!h.tracked) continue;
    handTarget(h, h.cur);
    TRAVEL.subVectors(h.cur, h.last);
    if (castHand(h.last, TRAVEL, D.rHand).hit) { h.last.copy(CAST.pos); h.coll = true; h.kind = CAST.kind; } else h.last.copy(h.cur);
  }
  /* 4. the speed you leave a surface with is the average of the last few frames, a little more: that is the throw */
  var v = XRG.hist[XRG.histI]; v.set((XRG.pos.x - START.x) / dt, (XRG.pos.y - START.y) / dt, (XRG.pos.z - START.z) / dt); XRG.histI = (XRG.histI + 1) % XRG.hist.length;
  AVG.set(0, 0, 0); XRG.hist.forEach(function (w) { AVG.add(w); }); AVG.multiplyScalar(1 / XRG.hist.length);
  if ((H[0].coll || H[1].coll) && AVG.length() > D.velLimit) {
    XRG.vel.copy(AVG).multiplyScalar(1.1);
    var sp = XRG.vel.length(); if (sp > D.maxJump) XRG.vel.multiplyScalar(D.maxJump / sp);
  }
  /* 5. a hand left far behind lets go, unless something stands between it and the head */
  for (i = 0; i < 2; i++) {
    h = H[i];
    if (h.coll && h.cur.distanceTo(h.last) > D.unstick && !castHand(HW, TMP.subVectors(h.cur, HW), D.rHand * 0.9).hit) { h.last.copy(h.cur); h.coll = false; }
    if (h.coll && !h.was) {                              /* a hand landing on something: a tap you hear and feel */
      var speed = h.cur.distanceTo(h.prev) / dt / XRG.k;
      if (speed > 0.25 && XRG.time - h.tapAt > 0.07) { h.tapAt = XRG.time; tap(h.kind, speed, h.side === 'left' ? -0.5 : 0.5); buzz(h, Math.min(1, 0.12 + speed * 0.15)); }
    }
    h.prev.copy(h.cur); h.was = h.coll;
  }
  /* 6. fell out of the street, or climbed over a wall: back to the elevator */
  toWorld(XRG.headLocal, HW);
  if (HW.y < -4 || HW.y > 22 || !inStreet(HW.x, HW.z)) { XRG.aligned = false; XRG.vel.set(0, 0, 0); toast('Back to the elevator', 2.5); }
}
function inStreet(x, z) {                                /* the alley, the street, and the yard with the roof beside it */
  return (x > -5.9 && x < 4.5 && z > -3.8 && z < 24.6) || (x > -8.6 && x < 40.6 && z > 23.4 && z < 36.9) || (x > 21.4 && x < 40.6 && z > 13.4 && z < 24.6);
}
var FWD = V(0, 0, 0);
function xrAlign() {                                     /* stand at the spawn, eyes at gorilla height, facing up the alley */
  FWD.set(0, 0, -1).applyQuaternion(XRG.headQ);
  XRG.yaw = XRG.spawn.yaw - Math.atan2(FWD.x, FWD.z);
  HW.set(XRG.spawn.pos.x, XRG.spawn.pos.y + XRG.E + 0.02, XRG.spawn.pos.z);
  placeAround(HW);
  XRG.vel.set(0, 0, 0); XRG.hist.forEach(function (w) { w.set(0, 0, 0); });
  settle(false); unstick(); XRG.aligned = true;
}
function turn(d) { toWorld(XRG.headLocal, HW); XRG.yaw += d; placeAround(HW); unstick(); }

/* ---------------- the controllers ---------------- */
function pressed(h, i) { var g = h.src && h.src.gamepad; return !!(g && g.buttons[i] && g.buttons[i].pressed); }
function stickX(h) { var g = h.src && h.src.gamepad; if (!g || !g.axes) return 0; return g.axes.length > 2 ? g.axes[2] : g.axes[0] || 0; }
function controls() {
  var L = XRG.hands[0], R = XRG.hands[1], sx = stickX(R);
  if (!XRG.held.turn && Math.abs(sx) > 0.7) { XRG.held.turn = true; turn(sx > 0 ? -Math.PI / 4 : Math.PI / 4); }      /* right stick: turn 45 degrees */
  else if (XRG.held.turn && Math.abs(sx) < 0.3) XRG.held.turn = false;
  var sz = pressed(R, 5) || pressed(L, 5);              /* B or Y: try the next size */
  if (sz && !XRG.held.size) { xrSize((XRG.size + 1) % SIZES.length, true); toast(SIZES[XRG.size].name, 2.5); }
  XRG.held.size = sz;
  var home = pressed(L, 3);                             /* the left stick pressed in: back to the elevator */
  if (home && !XRG.held.home) { XRG.aligned = false; toast('Back to the elevator', 2.5); }
  XRG.held.home = home;
}
function readPoses(frame) {
  var pose = frame.getViewerPose(XRG.ref);
  if (pose) { var t = pose.transform; XRG.headLocal.set(t.position.x, t.position.y, t.position.z); XRG.headQ.set(t.orientation.x, t.orientation.y, t.orientation.z, t.orientation.w); XRG.poseSeen = true; }
  XRG.hands[0].tracked = XRG.hands[1].tracked = false;
  var srcs = XRG.session.inputSources;
  for (var i = 0; i < srcs.length; i++) {
    var s = srcs[i], h = s.handedness === 'left' ? XRG.hands[0] : s.handedness === 'right' ? XRG.hands[1] : null;
    if (!h || !s.gripSpace) continue;
    var gp = frame.getPose(s.gripSpace, XRG.ref); if (!gp) continue;
    var p = gp.transform.position, o = gp.transform.orientation;
    h.local.set(p.x, p.y, p.z); h.q.set(o.x, o.y, o.z, o.w); h.tracked = true; h.src = s;
  }
}

/* ---------------- you: your own gorilla's arms and body, under your eyes ---------------- */
var MQ = new T.Quaternion(), YQ = new T.Quaternion(), GQ = new T.Quaternion(), MINV = new T.Matrix4(), UPV = V(0, 0, 0), TGT = V(0, 0, 0), POLE = V(0, 0, 0), FACE = V(0, 0, 0), YAX = V(0, 1, 0);
var aS = V(0, 0, 0), aD = V(0, 0, 0), aE = V(0, 0, 0), aP = V(0, 0, 0), aA = V(0, 0, 0), aT = V(0, 0, 0), ax_ = V(0, 0, 0), ay_ = V(0, 0, 0), az_ = V(0, 0, 0);
var KNUCKLE = 0.79;                                      /* elbow to knuckles on the gorilla's forearm, which ends in its fist */
function makeMe() {
  var f = makeFighter(V(0, 0, 0), 0, 'stand', 0, STREET_LOOK);
  f.head.visible = false;                                /* your own head stays out of your eyes */
  f.root.visible = false; scene.add(f.root); XRG.me = f;
}
function aimMe(mesh, from, axis, facing, st) {
  ay_.copy(axis).negate();
  az_.copy(facing).addScaledVector(axis, -facing.dot(axis));
  if (az_.lengthSq() < 0.04) { az_.set(0, 1, 0).addScaledVector(axis, -axis.y); if (az_.lengthSq() < 0.04) az_.set(0, 0, 1).addScaledVector(axis, -axis.z); }
  az_.normalize(); ax_.crossVectors(ay_, az_); ay_.multiplyScalar(st);
  mesh.matrix.makeBasis(ax_, ay_, az_).setPosition(from); mesh.matrixWorldNeedsUpdate = true;
}
function reachArm(f, a, target, pole, face) {           /* shoulder to elbow to knuckles; an arm too short to reach stretches a little */
  var M = f.M, s = a.side;
  aS.set(s * M.shoulder[0], M.shoulder[1], M.shoulder[2]);
  aD.subVectors(target, aS);
  var want = aD.length(), full = M.L1 + KNUCKLE, st = Math.min(1.5, Math.max(1, want / (full - 0.01))), L1 = M.L1 * st, L2 = KNUCKLE * st;
  var dist = Math.min(Math.max(want, Math.abs(L1 - L2) + 0.01), L1 + L2 - 0.004);
  aD.normalize();
  var along = (L1 * L1 - L2 * L2 + dist * dist) / (2 * dist), outw = Math.sqrt(Math.max(L1 * L1 - along * along, 0));
  aP.copy(pole).addScaledVector(aD, -pole.dot(aD)).normalize();
  aE.copy(aS).addScaledVector(aD, along).addScaledVector(aP, outw);
  aA.subVectors(aE, aS).normalize(); aimMe(a.upper, aS, aA, face, st);
  aT.copy(aS).addScaledVector(aD, dist); aA.subVectors(aT, aE).normalize(); aimMe(a.fore, aE, aA, face, st);
}
function poseMe() {
  var f = XRG.me; if (!f) return;
  var s = XRG.E / XRG.EYE0;
  toWorld(XRG.headLocal, HW);
  YQ.setFromAxisAngle(YAX, XRG.yaw); MQ.copy(YQ).multiply(XRG.headQ);
  FWD.set(0, 0, -1).applyQuaternion(MQ); UPV.set(0, 1, 0).applyQuaternion(MQ);
  var yaw = Math.atan2(FWD.x - UPV.x * FWD.y, FWD.z - UPV.z * FWD.y);          /* the body turns with the head, even when you look straight down */
  var c = Math.cos(yaw), sn = Math.sin(yaw), e = XRG.EYEM;
  f.root.rotation.set(0, yaw, 0); f.root.scale.setScalar(s);
  f.root.position.set(HW.x - s * (e.x * c + e.z * sn), HW.y - s * e.y, HW.z - s * (-e.x * sn + e.z * c));
  f.root.updateMatrixWorld(true); MINV.copy(f.root.matrixWorld).invert();
  f.arms.forEach(function (a) {
    var h = a.side > 0 ? XRG.hands[0] : XRG.hands[1];
    a.upper.visible = a.fore.visible = h.tracked;
    if (!h.tracked) return;
    TGT.copy(h.last).applyMatrix4(MINV);
    POLE.set(a.side * 0.8, -0.5, -0.5);
    GQ.copy(YQ).multiply(h.q); FACE.set(0, 0, -1).applyQuaternion(GQ).applyAxisAngle(YAX, -yaw);      /* knuckles face where the controller points */
    reachArm(f, a, TGT, POLE, FACE);
  });
}

/* ---------------- taps you hear and feel ---------------- */
var SND = null;
function soundInit() {
  if (SND) { if (SND.ctx.state === 'suspended') SND.ctx.resume(); return; }
  try {
    var C = window.AudioContext || window.webkitAudioContext; if (!C) return;
    var ctx = new C(), n = Math.floor(ctx.sampleRate * 0.3), buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0), seed = 7;
    for (var i = 0; i < n; i++) { seed = (seed * 16807) % 2147483647; d[i] = (seed / 1073741823.5 - 1) * Math.exp(-i / (n * 0.1)); }
    SND = { ctx: ctx, noise: buf };
  } catch (e) { SND = null; }
}
var TAPS = [{ type: 'lowpass', f: 520, q: 0.8, len: 0.1, vol: 0.55 }, { type: 'bandpass', f: 1900, q: 7, len: 0.22, vol: 0.4 }, { type: 'bandpass', f: 760, q: 2.2, len: 0.09, vol: 0.5 },
  { type: 'lowpass', f: 300, q: 0.6, len: 0.12, vol: 0.4 }, { type: 'bandpass', f: 3200, q: 5, len: 0.07, vol: 0.28 }];
function tap(kind, speed, pan) {
  if (!SND) return;
  try {
    var c = SND.ctx, o = TAPS[kind] || TAPS[0], t = c.currentTime, v = o.vol * Math.min(1, 0.2 + speed / 3);
    var s = c.createBufferSource(); s.buffer = SND.noise; s.playbackRate.value = 0.85 + Math.random() * 0.3;
    var f = c.createBiquadFilter(); f.type = o.type; f.frequency.value = o.f * (0.9 + Math.random() * 0.2); f.Q.value = o.q;
    var g = c.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0008, t + o.len);
    s.connect(f); f.connect(g);
    if (c.createStereoPanner) { var p = c.createStereoPanner(); p.pan.value = pan; g.connect(p); p.connect(c.destination); } else g.connect(c.destination);
    s.start(t); s.stop(t + o.len + 0.03);
  } catch (e) {}
}
function buzz(h, amount) { try { var g = h.src && h.src.gamepad, a = g && g.hapticActuators && g.hapticActuators[0]; if (a && a.pulse) a.pulse(amount, 28); } catch (e) {} }

/* ---------------- a line of words floating low in front of you ---------------- */
function toast(line1, secs, line2) {
  if (!XRG.cam) return;
  if (!XRG.toast) {
    var cv = document.createElement('canvas'); cv.width = 2048; cv.height = 384;
    var tex = new T.CanvasTexture(cv); tex.minFilter = T.LinearFilter; tex.generateMipmaps = false;
    var m = new T.Mesh(new T.PlaneGeometry(0.8, 0.15), new T.MeshBasicMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false }));
    m.position.set(0, -0.17, -0.8); m.renderOrder = 20; XRG.cam.add(m); XRG.toast = m; XRG.toastC = cv;
  }
  var g = XRG.toastC.getContext('2d'); g.clearRect(0, 0, 2048, 384);
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = 'rgba(0,0,0,0.9)'; g.shadowBlur = 30;
  function fit(text, weight, px, max) { g.font = weight + ' ' + px + 'px "Urbanist", sans-serif'; var w = g.measureText(text).width; if (w > max) g.font = weight + ' ' + Math.floor(px * max / w) + 'px "Urbanist", sans-serif'; }
  g.fillStyle = '#f1f2f4'; fit(line1, 650, 104, 1900); g.fillText(line1, 1024, line2 ? 130 : 192);
  if (line2) { g.fillStyle = '#c3c7ce'; fit(line2, 450, 72, 1900); g.fillText(line2, 1024, 262); }
  XRG.toast.material.map.needsUpdate = true; XRG.toast.visible = true; XRG.toastT = secs || 3;
}

/* ---------------- each frame in the headset ---------------- */
function xrFrameTick(dt, frame) {
  XRG.frames = (XRG.frames || 0) + 1;
  try {
    if (frame && XRG.ref && XRG.session) readPoses(frame);
    if (!XRG.aligned && XRG.poseSeen) xrAlign();
    if (XRG.aligned) {
      controls();
      if (XRG.aligned) { xrStep(Math.min(dt, 1 / 30)); poseMe(); }
    }
    if (XRG.toastT > 0) { XRG.toastT -= dt; if (XRG.toastT <= 0 && XRG.toast) XRG.toast.visible = false; }
  } catch (e) { if (!XRG.failed) { XRG.failed = true; problem('headset', e); } }
  XRG.rig.position.copy(XRG.pos); XRG.rig.rotation.set(0, XRG.yaw, 0); XRG.rig.scale.setScalar(XRG.k);
  renderer.render(scene, XRG.cam);
}
function xrEnter() {
  XRG.on = true; XRG.aligned = false; XRG.poseSeen = false; XRG.failed = false;
  if (!XRG.col) buildCollision(XRG.world);
  xrSize(XRG.size, false);
  if (typeof WET !== 'undefined' && WET) WET.mesh.visible = false;      /* the mirrored wet ground costs a second picture each frame; the headset needs that time */
  if (!XRG.me) makeMe();
  XRG.me.root.visible = true;
  PIX.value = 0.0016;
  if (XRG.button) XRG.button.textContent = 'Exit VR';
  toast('Push the ground with your hands to move', 8, 'Right stick turns · B or Y changes size');
}
function xrExit() {
  XRG.on = false; XRG.session = null; XRG.ref = null;
  fighters.forEach(function (f) { f.root.scale.setScalar(1); });
  if (typeof WET !== 'undefined' && WET) WET.mesh.visible = true;
  if (XRG.me) XRG.me.root.visible = false;
  if (XRG.button) XRG.button.textContent = 'Enter VR';
  resize();
}
function xrStart() {
  if (XRG.session) { XRG.session.end().catch(function () {}); return; }
  soundInit();
  navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor'] }).then(function (session) {
    XRG.session = session;
    session.addEventListener('end', xrExit);
    renderer.xr.enabled = true;
    renderer.xr.setReferenceSpaceType('local');
    renderer.xr.setFramebufferScaleFactor(1.0);
    return renderer.xr.setSession(session).then(function () {
      XRG.ref = renderer.xr.getReferenceSpace();
      try { var layer = session.renderState.baseLayer; if (layer && 'fixedFoveation' in layer) layer.fixedFoveation = 0.5; } catch (e) {}
      xrEnter();
    });
  }).catch(function (e) { problem('headset', e); report(); XRG.session = null; });
}
function xrButton() {
  var css = document.createElement('style');
  css.textContent = '.xr{position:absolute;right:18px;top:58px;z-index:3;margin:0;padding:11px 20px;border:0;border-radius:999px;background:#2f6bff;color:#fff;font:650 15px/1 "Urbanist",sans-serif;letter-spacing:.01em;cursor:pointer}' +
    '.xr[hidden],.xrnote[hidden]{display:none}.xr:focus-visible{outline:2px solid #fff;outline-offset:3px}' +
    '.xrnote{position:absolute;right:18px;top:56px;margin:0;max-width:21ch;text-align:right;color:var(--ink-soft);font-size:14px;line-height:1.35;pointer-events:none}';
  document.head.appendChild(css);
  var b = document.createElement('button'), n = document.createElement('p');
  b.className = 'xr'; b.type = 'button'; b.hidden = true; b.textContent = 'Enter VR';
  n.className = 'xrnote'; n.hidden = true; n.textContent = 'To play, open this page in your Quest’s browser.';
  stage.appendChild(b); stage.appendChild(n); XRG.button = b;
  b.addEventListener('click', xrStart);
  function no() { n.hidden = false; }
  if (!navigator.xr || !navigator.xr.isSessionSupported) { no(); return; }
  navigator.xr.isSessionSupported('immersive-vr').then(function (ok) {
    if (!ok) { no(); return; }
    b.hidden = false; renderer.xr.enabled = true;
    setTimeout(function () { try { if (!XRG.col) buildCollision(XRG.world); } catch (e) { problem('headset walls', e); } }, 500);    /* sort the walls before anyone presses the button */
  }).catch(no);
}
function xrSetup(world) {
  XRG.world = world;
  var M = DATA.meta, eye = DATA.faces['new'].eye;
  XRG.EYE0 = M.head[1] + eye[1]; XRG.EYEM = V(0, XRG.EYE0, M.head[2] + eye[2]);
  XRG.rig = new T.Group(); XRG.cam = new T.PerspectiveCamera(70, 1, 0.05, 160); XRG.rig.add(XRG.cam); scene.add(XRG.rig);
  for (var i = 0; i < 6; i++) XRG.hist.push(V(0, 0, 0));
  xrSize(1, false);
  var sub = document.querySelector('.sub'); if (sub) SCENE.sub = sub.textContent;
  xrButton();
  if (window.__xrtest) window.__xrg = XRG;              /* for the tests with an emulated headset */
  if (window.__manual || window.__xrtest) window.__xr = {   /* for the tests: run the arm movement without a headset */
    build: function () { return buildCollision(world); },
    size: function (i) { xrSize(i, false); return XRG.D; },
    spawn: function (x, z, yaw, headY) { XRG.spawn.pos.set(x, 0, z); XRG.spawn.yaw = yaw || 0; XRG.headLocal.set(0, headY || 1.6, 0); XRG.headQ.set(0, 0, 0, 1); xrAlign(); return xrState(); },
    step: function (dt, head, L, R, n) {
      for (var k = 0; k < (n || 1); k++) {
        if (head) XRG.headLocal.set(head[0], head[1], head[2]);
        [L, R].forEach(function (p, j) { var h = XRG.hands[j]; h.tracked = !!p; if (p) { h.local.set(p[0], p[1], p[2]); h.q.set(0, 0, 0, 1); } });
        xrStep(dt);
      }
      return xrState();
    },
    state: function () { return xrState(); }
  };
}
function xrState() {
  toWorld(XRG.headLocal, HW);
  function r3(v) { return [Math.round(v.x * 1000) / 1000, Math.round(v.y * 1000) / 1000, Math.round(v.z * 1000) / 1000]; }
  return { head: r3(HW), vel: r3(XRG.vel), ground: XRG.ground, L: { last: r3(XRG.hands[0].last), coll: XRG.hands[0].coll, kind: XRG.hands[0].kind }, R: { last: r3(XRG.hands[1].last), coll: XRG.hands[1].coll, kind: XRG.hands[1].kind }, aligned: XRG.aligned, k: XRG.k, E: XRG.E };
}
