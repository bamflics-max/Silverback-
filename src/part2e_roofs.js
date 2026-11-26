/* ================================================================== */
/* The rooftops. Every building round the alley and the street gets a */
/* roof you can stand on, a low wall round its edge, the walls where a */
/* taller building rises over a lower one, and the clutter roofs       */
/* collect: air units, vents, stair huts, water tanks. Two fixed       */
/* ladders show ways up. Past the edge, more buildings, out of reach,  */
/* so the city carries on.                                             */
/* ================================================================== */
var ROOF = {
  bound: [-14, 48, -6, 42],                               /* x0, x1, z0, z1: the edge of everywhere you can get to */
  blocks: [                                               /* each building: its footprint (rectangles x0, x1, z0, z1), how tall, its brick */
    { n: 'end', r: [[-3.5, 3.5, -6, 0]], h: 13, b: 'brickD' },
    { n: 'L1', r: [[-14, -3.5, -6, 7.5]], h: 14, b: 'brickR' },
    { n: 'dock', r: [[-14, -5.3, 7.5, 15]], h: 10, b: 'brickD' },
    { n: 'L2', r: [[-14, -3.5, 15, 24]], h: 16, b: 'brickP' },
    { n: 'dead', r: [[-14, -8, 24, 34]], h: 13, b: 'brickD' },
    { n: 'shop', r: [[-14, 6, 34, 42]], h: 13, b: 'brickD' },
    { n: 'far2', r: [[6, 18, 34, 42]], h: 15, b: 'brickR' },
    { n: 'far3', r: [[18, 30, 34, 42]], h: 12, b: 'brickP' },
    { n: 'far4', r: [[30, 40, 34, 42]], h: 14, b: 'brickY' },
    { n: 'endE', r: [[40, 48, -6, 42]], h: 9, b: 'brickD' },
    { n: 'R1', r: [[3.5, 14, -6, 8]], h: 15, b: 'brickD' },
    { n: 'R2', r: [[3.9, 14, 8, 17]], h: 9.5, b: 'brickR' },
    { n: 'R3', r: [[3.5, 12, 17, 24], [12, 14, 17, 20]], h: 12.5, b: 'brickY' },
    { n: 'S1', r: [[14, 22, 14, 24], [12, 14, 20, 24]], h: 14, b: 'brickR' },
    { n: 'mid', r: [[14, 22, -6, 14]], h: 11, b: 'brickD' },
    { n: 'yardB', r: [[22, 40, -6, 14]], h: 10, b: 'brickD' },
    { n: 'low', r: [[32, 40, 14, 24]], h: 6, b: 'brickD', built: true }      /* the low roof by the yard already has its own */
  ],
  skip: [['z', 7.5, -14, -3.5], ['z', 15, -14, -3.5], ['z', 8, 3.5, 14], ['z', 17, 3.5, 14], ['x', 40, 14, 34]],      /* walls between roofs the street already built */
  huts: [[-9, -1.2, 0, 'L1'], [-6.2, 18.5, Math.PI / 2, 'L2'], [-10, 38.5, 0, 'shop'], [35, 38.6, Math.PI, 'far4'], [10, 0.5, 0, 'R1'], [19, 20.5, -Math.PI / 2, 'S1'], [18, -3.2, 0, 'mid'], [37.6, 8, Math.PI, 'yardB']],
  grid: null
};
var ROOF_LIGHTS = (function () {                          /* up here: more open sky, a lamp over each stair hut's door, one over the chairs */
  var s = lightSet([0.13, 0.15, 0.22], [0.072, 0.07, 0.078]);
  s.uni.uFogC = { value: new T.Color(0.03, 0.038, 0.058) }; s.uni.uFogD = { value: 0.026 }; s.uni.uWrap.value = 0.12;
  useLights(s);
  ROOF.huts.forEach(function (u) { var h = roofBlock(u[3]).h; addLight(V(u[0] + Math.sin(u[2]) * 1.05, h + 2.15, u[1] + Math.cos(u[2]) * 1.05), [1.0, 0.84, 0.62], 1.3, 0, 0, 4.2, 'none'); });
  addLight(V(8.3, 9.5 + 2.3, 12.8), [1.0, 0.8, 0.55], 1.2, 0, 0, 4.5, 'none');
  fillLights(); useLights(ARENA_LIGHTS);
  return s;
})();
function roofBlock(n) { return ROOF.blocks.filter(function (b) { return b.n === n; })[0]; }

/* ---------------- where everything is: a grid cut along every building's edges ---------------- */
function roofGrid() {
  var xs = [ROOF.bound[0], ROOF.bound[1]], zs = [ROOF.bound[2], ROOF.bound[3]];
  ROOF.blocks.forEach(function (b, k) { b.k = k; b.r.forEach(function (r) { xs.push(r[0], r[1]); zs.push(r[2], r[3]); }); });
  function uniq(a) { a = a.map(function (v) { return Math.round(v * 100) / 100; }).sort(function (p, q) { return p - q; }); return a.filter(function (v, i) { return i === 0 || v !== a[i - 1]; }); }
  xs = uniq(xs); zs = uniq(zs);
  var nx = xs.length - 1, nz = zs.length - 1, cell = new Int16Array(nx * nz).fill(-1), i, j;
  for (j = 0; j < nz; j++) for (i = 0; i < nx; i++) {
    var cx = (xs[i] + xs[i + 1]) / 2, cz = (zs[j] + zs[j + 1]) / 2;
    ROOF.blocks.forEach(function (b) { b.r.forEach(function (r) { if (cx > r[0] && cx < r[1] && cz > r[2] && cz < r[3]) cell[i + j * nx] = b.k; }); });
  }
  ROOF.grid = { xs: xs, zs: zs, nx: nx, nz: nz, cell: cell };
}
function roofCell(i, j) { var G = ROOF.grid; return i < 0 || j < 0 || i >= G.nx || j >= G.nz ? -2 : G.cell[i + j * G.nx]; }      /* a building's number; -1 open ground; -2 past the edge */
function roofAt(x, z) {                                   /* the roof's height over (x, z): -1 on open ground (or right by a wall), null past the edge of everything */
  var B = ROOF.bound;
  if (x < B[0] - 0.5 || x > B[1] + 0.5 || z < B[2] - 0.5 || z > B[3] + 0.5) return null;
  for (var k = 0; k < ROOF.blocks.length; k++) { var b = ROOF.blocks[k]; for (var m = 0; m < b.r.length; m++) { var r = b.r[m]; if (x > r[0] + 0.3 && x < r[1] - 0.3 && z > r[2] + 0.3 && z < r[3] - 0.3) return b.h; } }
  return -1;
}
function roofEdges() {                                     /* every edge of every roof: what is on the other side of it */
  var G = ROOF.grid, segs = [], i, j;
  function add(axis, c, a0, a1, n, b, other) {
    var B = ROOF.blocks[b], type, y0 = 0;
    if (other >= 0) { if (other === b || ROOF.blocks[other].h >= B.h) return; type = 'step'; y0 = ROOF.blocks[other].h; }
    else type = other === -1 ? 'face' : 'edge';
    segs.push({ axis: axis, c: c, a0: a0, a1: a1, n: n, b: b, type: type, y0: y0, h: B.h });
  }
  for (j = 0; j < G.nz; j++) for (i = 0; i < G.nx; i++) {
    var b = G.cell[i + j * G.nx]; if (b < 0) continue;
    add('x', G.xs[i + 1], G.zs[j], G.zs[j + 1], 1, b, roofCell(i + 1, j)); add('x', G.xs[i], G.zs[j], G.zs[j + 1], -1, b, roofCell(i - 1, j));
    add('z', G.zs[j + 1], G.xs[i], G.xs[i + 1], 1, b, roofCell(i, j + 1)); add('z', G.zs[j], G.xs[i], G.xs[i + 1], -1, b, roofCell(i, j - 1));
  }
  segs.sort(function (p, q) { return (p.axis < q.axis ? -1 : p.axis > q.axis ? 1 : 0) || p.c - q.c || p.n - q.n || p.a0 - q.a0; });
  var out = [];
  segs.forEach(function (s) { var l = out[out.length - 1]; if (l && l.axis === s.axis && l.c === s.c && l.n === s.n && l.b === s.b && l.type === s.type && l.y0 === s.y0 && Math.abs(l.a1 - s.a0) < 1e-6) l.a1 = s.a1; else out.push(s); });
  return out;
}
function roofSkip(s) { return ROOF.skip.some(function (e) { return e[0] === s.axis && Math.abs(e[1] - s.c) < 1e-6 && s.a0 >= e[2] - 1e-6 && s.a1 <= e[3] + 1e-6; }); }

/* ---------------- what roofs have on them ---------------- */
function roofLedge(x0, z0, x1, z1, y, key) {              /* a low wall along a roof's edge, with a coping; a little long, so corners close */
  var len = Math.hypot(x1 - x0, z1 - z0) + 0.24, ry = Math.atan2(-(z1 - z0), x1 - x0), c = V((x0 + x1) / 2, y + 0.3, (z0 + z1) / 2);
  box(key, c, len, 0.6, 0.24, ry); box('conc', V(c.x, y + 0.63, c.z), len + 0.04, 0.06, 0.3, ry);
}
function acUnit(x, y, z, ry) {                             /* a rooftop air unit on its curb, a duct down into the roof */
  var M = xf(x, y, z, 0, ry, 0);
  obox('steelK', M, 0, 0.05, 0, 1.36, 0.1, 1.04); obox('galv', M, 0, 0.53, 0, 1.24, 0.86, 0.92); obox('grate', M, 0, 0.97, 0, 1.0, 0.03, 0.72);
  obox('dark', M, 0, 0.955, 0, 0.7, 0.01, 0.6); obox('galv', M, 0.75, 0.3, 0.1, 0.3, 0.3, 0.4);
}
function vent(x, y, z, h, r) { pipe('steelK', [V(x, y, z), V(x, y + h, z)], r, 8); lathe('steelK', V(x, y + h + 0.05, z), [[r * 2.0, 0], [r * 2.0, 0.04], [0.0, 0.17]], 8); }
function stairHut(x, y, z, ry, key) {                      /* the hut over the stairs, its steel door, a lamp over the door */
  var M = xf(x, y, z, 0, ry, 0);
  obox(key, M, 0, 1.2, 0, 2.0, 2.4, 1.8); obox('conc', M, 0, 2.45, 0, 2.24, 0.1, 2.04);
  obox('doorG', M, 0, 1.06, 0.91, 0.92, 2.06, 0.04); obox('steelK', M, 0.33, 1.05, 0.94, 0.05, 0.04, 0.04);
  obox('steelK', M, 0, 2.1, 0.97, 0.2, 0.1, 0.14);
}
function waterTank(x, y, z) {                              /* a wooden tank on a steel stand, the old way */
  [[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9]].forEach(function (p) { pipe('steelK', [V(x + p[0], y, z + p[1]), V(x + p[0], y + 1.3, z + p[1])], 0.06, 6); });
  box('steelK', V(x, y + 1.32, z), 2.2, 0.08, 2.2, 0);
  lathe('woodS', V(x, y + 1.36, z), [[0.0, 0], [1.25, 0], [1.3, 0.05], [1.3, 2.3], [1.42, 2.36], [0.0, 3.1]], 16);
}
function chimney(x, y, z, key) { box(key, V(x, y + 0.8, z), 0.7, 1.6, 0.7, 0); box('conc', V(x, y + 1.63, z), 0.82, 0.06, 0.82, 0); }
function antenna(x, y, z) {
  pipe('steelK', [V(x, y, z), V(x, y + 3.2, z)], 0.03, 6); box('steelK', V(x, y + 0.04, z), 0.4, 0.08, 0.4, 0);
  [2.2, 2.6, 3.0].forEach(function (h, k) { var w = 0.6 - k * 0.15; pipe('steelK', [V(x - w, y + h, z), V(x + w, y + h, z)], 0.012, 4); });
}
function skylight(x, y, z, ry) { var M = xf(x, y, z, 0, ry, 0); obox('conc', M, 0, 0.2, 0, 1.6, 0.4, 1.2); obox('glassM', M, 0, 0.42, 0, 1.5, 0.04, 1.1); }
function lawnChair(x, y, z, ry) {                          /* a folding chair: a light frame, a sagging cloth seat and back */
  var M = xf(x, y, z, 0, ry, 0), w = 0.27;
  obox('cushK', M, 0, 0.37, 0.02, 0.52, 0.04, 0.46); obox('cushK', M.clone().multiply(xf(0, 0.39, -0.22, -0.3, 0, 0)), 0, 0.28, 0, 0.52, 0.56, 0.04);
  function pt(lx, ly, lz) { return V(lx, ly, lz).applyMatrix4(M); }
  [-1, 1].forEach(function (s) {
    pipe('steelG', [pt(s * w, 0, 0.26), pt(s * w, 0.37, -0.2), pt(s * w, 0.9, -0.38)], 0.012, 5);      /* back leg and upright */
    pipe('steelG', [pt(s * w, 0, -0.24), pt(s * w, 0.37, 0.24)], 0.012, 5);                             /* front leg */
    pipe('steelG', [pt(s * w, 0.58, -0.25), pt(s * w, 0.58, 0.22), pt(s * w, 0.37, 0.24)], 0.014, 5);      /* the arm */
  });
}
function cooler(x, y, z, ry) { var M = xf(x, y, z, 0, ry, 0); obox('doorG', M, 0, 0.2, 0, 0.62, 0.4, 0.4); obox('conc', M, 0, 0.42, 0, 0.64, 0.05, 0.42); obox('steelK', M, 0, 0.47, 0, 0.3, 0.03, 0.04); }
function wallLadder(x, z, nx, nz, y0, y1) {                /* a fixed steel ladder on a wall facing (nx, nz), from y0 up and over the ledge at y1 */
  var tx = -nz, tz = nx, off = 0.2, w = 0.23, y;
  [-1, 1].forEach(function (s) {
    var bx = x + tx * w * s, bz = z + tz * w * s;
    pipe('steelK', [V(bx + nx * off, y0, bz + nz * off), V(bx + nx * off, y1 + 0.35, bz + nz * off), V(bx - nx * 0.1, y1 + 1.0, bz - nz * 0.1), V(bx - nx * 0.5, y1 + 0.85, bz - nz * 0.5), V(bx - nx * 0.5, y1 + 0.66, bz - nz * 0.5)], 0.022, 6);
    for (y = y0 + 0.6; y < y1; y += 1.5) pipe('steelK', [V(bx + nx * 0.01, y, bz + nz * 0.01), V(bx + nx * off, y, bz + nz * off)], 0.015, 5);
  });
  for (y = y0 + 0.28; y < y1 + 0.25; y += 0.3) pipe('steelK', [V(x - tx * w + nx * off, y, z - tz * w + nz * off), V(x + tx * w + nx * off, y, z + tz * w + nz * off)], 0.014, 5);
}

function stepWindows(x0, z0, x1, z1, nx, nz, y0, y1, seed) {      /* rows of windows on the part of a wall that rises over a lower roof */
  var floors = [], y, len = Math.hypot(x1 - x0, z1 - z0), dx = (x1 - x0) / (len || 1), dz = (z1 - z0) / (len || 1);
  for (y = y0 + 1.1; y + 1.9 < y1; y += 3.0) floors.push(y);
  if (!floors.length || len < 2.6) return;
  windowsOn(x0 + dx * 0.6, z0 + dz * 0.6, x1 - dx * 0.6, z1 - dz * 0.6, nx, nz, floors, Math.max(1, Math.floor((len - 1.2) / 2.9)), seed, 0.32, 0.12);
}
/* ---------------- building it ---------------- */
function buildRoofs(group, plates) {
  if (!ROOF.grid) roofGrid();
  var L = ROOF_LIGHTS.lamps, i;
  ROOF.blocks.forEach(function (b) { if (b.built) return; b.r.forEach(function (r) { quad('roofT', V(r[0], b.h, r[2]), V(r[1], b.h, r[2]), V(r[1], b.h, r[3]), V(r[0], b.h, r[3]), V((r[0] + r[1]) / 2, 0, (r[2] + r[3]) / 2)); }); });
  roofEdges().forEach(function (s) {
    var B = ROOF.blocks[s.b], x0, z0, x1, z1, nx = 0, nz = 0;
    if (s.axis === 'x') { x0 = x1 = s.c; z0 = s.a0; z1 = s.a1; nx = s.n; } else { z0 = z1 = s.c; x0 = s.a0; x1 = s.a1; nz = s.n; }
    if (s.type === 'step' && !roofSkip(s)) wallQ(B.b, x0, z0, x1, z1, s.y0, s.h, nx, nz);         /* where this building rises over its neighbour */
    if (s.type === 'step') stepWindows(x0, z0, x1, z1, nx, nz, s.y0, s.h, 940 + Math.round(s.c * 7 + s.a0 * 3));      /* with windows, some lit, so it reads as a building and not a blank */
    if (B.built) return;
    roofLedge(x0, z0, x1, z1, s.h, B.b);
    if (s.type === 'edge') wallQ('barrier', x0, z0, x1, z1, s.h + 0.66, s.h + 4.5, -nx, -nz);       /* past here is out of the game: a wall nobody sees */
  });
  /* the stair huts, each with its lamp */
  ROOF.huts.forEach(function (u, k) {
    var B = roofBlock(u[3]); stairHut(u[0], B.h, u[1], u[2], B.b);
    var p = V(u[0] + Math.sin(u[2]) * 1.0, B.h + 2.15, u[1] + Math.cos(u[2]) * 1.0);
    lampBulb(group, p, 0.05, L[k], 0xffe2b0); lampHalo(group, p, 1.2, L[k], 0xffc27a);
  });
  /* the clutter, roof by roof */
  var h = function (n) { return roofBlock(n).h; };
  vent(-2.4, h('end'), -4.4, 0.9, 0.08); acUnit(1.6, h('end'), -3.6, 0.3);
  acUnit(-6.2, h('L1'), 4.2, 0); vent(-12, h('L1'), 5, 1.1, 0.1); vent(-5.2, h('L1'), -4.2, 0.8, 0.07); chimney(-12.5, h('L1'), -4, 'brickR');
  acUnit(-12, h('dock'), 9.2, 1.57); vent(-6.6, h('dock'), 14, 0.9, 0.08);
  waterTank(-10.5, h('L2'), 20.5); antenna(-12.8, h('L2'), 16.4); vent(-4.6, h('L2'), 22.6, 0.7, 0.06);
  chimney(-12, h('dead'), 26.5, 'brickD'); chimney(-12, h('dead'), 31, 'brickD'); acUnit(-9.6, h('dead'), 29, 1.57);
  skylight(-4, h('shop'), 38, 0); skylight(0, h('shop'), 38, 0); acUnit(3.6, h('shop'), 40, 0); vent(-13, h('shop'), 41, 1.0, 0.09);
  waterTank(12, h('far2'), 38.6); acUnit(8, h('far2'), 36.4, 0); antenna(16.8, h('far2'), 40.8);
  chimney(20, h('far3'), 40.6, 'brickP'); acUnit(25, h('far3'), 37.2, 0.2); vent(28.4, h('far3'), 40.4, 0.9, 0.08);
  acUnit(32.2, h('far4'), 40.4, 0); antenna(38.6, h('far4'), 35.6);
  acUnit(44, h('endE'), 10, 1.57); acUnit(44.2, h('endE'), 30, 1.57); vent(45.5, h('endE'), 20, 1.0, 0.09); vent(43, h('endE'), 38, 0.8, 0.07); chimney(46, h('endE'), 0, 'brickD');
  acUnit(6.2, h('R1'), 5.2, 0); antenna(12.6, h('R1'), -4.2); vent(5, h('R1'), -4.6, 0.9, 0.08);
  acUnit(12.4, h('R2'), 9.6, 1.57); vent(12.6, h('R2'), 16, 0.8, 0.07);
  chimney(6, h('R3'), 22.6, 'brickY'); acUnit(9.4, h('R3'), 19.2, 0); vent(11, h('R3'), 23, 0.9, 0.08);
  acUnit(16.2, h('S1'), 16.6, 0); skylight(16.2, h('S1'), 22, 1.57);
  acUnit(17, h('mid'), 0.5, 0); acUnit(19.6, h('mid'), 6.4, 1.57); vent(15.4, h('mid'), 10.4, 1.0, 0.09);
  skylight(27, h('yardB'), 6, 0); skylight(31, h('yardB'), 6, 0); acUnit(35, h('yardB'), 2, 0); vent(25, h('yardB'), 11.6, 1.1, 0.1);
  /* chairs on the low red roof over the fire escape, looking down the alley, under a bare bulb on a pole */
  var y2 = h('R2'); lawnChair(7.2, y2, 12.6, -Math.PI / 2 + 0.25); lawnChair(7.3, y2, 13.9, -Math.PI / 2 - 0.15); crate(V(7.0, y2, 11.4), 0.45, 0.4); cooler(8.5, y2, 14.6, 0.3);
  pipe('steelK', [V(8.3, y2, 12.8), V(8.3, y2 + 2.4, 12.8), V(8.0, y2 + 2.4, 12.8)], 0.025, 6); var bp = V(8.0, y2 + 2.3, 12.8);
  lampBulb(group, bp, 0.05, L[ROOF.huts.length], 0xffd9a0); lampHalo(group, bp, 1.4, L[ROOF.huts.length], 0xffb870);
  if (typeof PROPS !== 'undefined' && PROPS.on) { PROPS.add('can', { x: 7.05, z: 11.4, y: y2 + 0.45 }); PROPS.add('bottle', { x: 6.9, z: 11.3, y: y2 + 0.45 }); PROPS.add('can', { x: 7.8, z: 13.2, y: y2, lie: 0.7 }); }
  /* two ways up that are plain to see: a ladder on the dead end's wall, one in the yard */
  wallLadder(-8, 31.6, 1, 0, 0.3, h('dead')); wallLadder(25.6, 14, 0, 1, 0.3, h("yardB"));
  roofFiller();
}
/* past the edge: buildings you only see. Plain walls with windows painted on, a roof, a ledge; water tanks on two of them */
var FILLER = [
  [-30, -14, -22, 2, 18], [-30, -14, 2, 14, 12], [-30, -14, 14, 28, 20], [-30, -14, 28, 42, 11], [-30, -14, 42, 58, 16],
  [-14, 0, -22, -6, 15], [0, 10, -22, -6, 22], [10, 24, -22, -6, 12], [24, 38, -22, -6, 17], [38, 48, -22, -6, 10], [48, 64, -22, -6, 19],
  [48, 64, -6, 10, 13], [48, 64, 10, 22, 8], [48, 64, 22, 36, 15], [48, 64, 36, 58, 11],
  [-14, 2, 42, 58, 12], [2, 16, 42, 58, 19], [16, 28, 42, 58, 10], [28, 40, 42, 58, 16], [40, 48, 42, 58, 13]
];
function roofFiller() {
  FILLER.forEach(function (f) {
    var x0 = f[0], x1 = f[1], z0 = f[2], z1 = f[3], hh = f[4], c = V((x0 + x1) / 2, hh / 2, (z0 + z1) / 2);
    wallQ('fillW', x0, z0, x1, z0, 0, hh, 0, -1); wallQ('fillW', x1, z0, x1, z1, 0, hh, 1, 0); wallQ('fillW', x0, z1, x1, z1, 0, hh, 0, 1); wallQ('fillW', x0, z0, x0, z1, 0, hh, -1, 0);
    quad('roofF', V(x0, hh, z0), V(x1, hh, z0), V(x1, hh, z1), V(x0, hh, z1), V(c.x, 0, c.z));
    box('copF', V(c.x, hh + 0.3, z0), x1 - x0, 0.6, 0.24, 0); box('copF', V(c.x, hh + 0.3, z1), x1 - x0, 0.6, 0.24, 0);
    box('copF', V(x0, hh + 0.3, c.z), 0.24, 0.6, z1 - z0, 0); box('copF', V(x1, hh + 0.3, c.z), 0.24, 0.6, z1 - z0, 0);
  });
  [[-22, 20, 20], [5, -14, 22], [56, 30, 15]].forEach(function (t) {
    [[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9]].forEach(function (p) { pipe('copF', [V(t[0] + p[0], t[2], t[1] + p[1]), V(t[0] + p[0], t[2] + 1.3, t[1] + p[1])], 0.06, 5); });
    lathe('tankF', V(t[0], t[2] + 1.32, t[1]), [[0.0, 0], [1.25, 0], [1.3, 0.05], [1.3, 2.3], [1.42, 2.36], [0.0, 3.1]], 12);
  });
}
/* the roofs' own materials, joined to the street's */
function fillerTex() {
  var w = 256, h = 256, c = document.createElement('canvas'); c.width = w; c.height = h;
  var g = c.getContext('2d'), q = rand(931), r, k;
  g.fillStyle = '#2b2321'; g.fillRect(0, 0, w, h);
  for (k = 0; k < 160; k++) { g.globalAlpha = 0.04 + q() * 0.06; g.fillStyle = q() < 0.5 ? '#000' : '#fff'; g.fillRect(q() * w, q() * h, 4 + q() * 30, 2 + q() * 10); }
  g.globalAlpha = 1;
  for (r = 0; r < 4; r++) for (k = 0; k < 4; k++) {        /* four floors of four windows; a few lit */
    var x = k * 64 + 18, y = r * 64 + 12, lit = q() < 0.24;
    g.fillStyle = '#4a4540'; g.fillRect(x - 3, y + 40, 34, 4);
    g.fillStyle = lit ? (q() < 0.5 ? '#e9b871' : '#d9c49c') : (q() < 0.5 ? '#0c111b' : '#151b27'); g.fillRect(x, y, 28, 40);
    g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(x + 13, y, 2, 40); g.fillRect(x, y + 19, 28, 2);
  }
  var t = smoothTex(new T.CanvasTexture(c)); t.wrapS = t.wrapT = T.RepeatWrapping; t.userData = { w: w, h: h };
  return t;
}
var townMats_ = streetMats;
streetMats = function () {
  function mat(o) { o.snap = false; return roomMat(o); }
  var m = townMats_();
  if (!TEX.fillW) TEX.fillW = fillerTex();
  var hide = new T.MeshBasicMaterial(); hide.visible = false;
  m.barrier = hide;
  m.fillW = mat({ tex: TEX.fillW, tile: [12, 12], glow: 0.55, grime: 0.3 });
  m.roofF = mat({ tex: TEX.roofT, tile: 2.4, gloss: 0.2, grime: 0.4 }); m.copF = mat({ color: 0x55524c, grime: 0.5 }); m.tankF = mat({ tex: TEX.woodS, tile: 1.2, color: 0x6a6f76, grime: 0.45 });
  return m;
};
