/* ================================================================== */
/* The street the alley opens onto. x runs along it, from a dead end   */
/* at -8 to the hoop at 40; z runs across it, from the alley's side    */
/* (24) to the far side (34). The practice yard is a gap on the        */
/* alley's side (x 22 to 32, back to z 14); the low building after it  */
/* (x 32 to 40) has the roof you can climb to.                         */
/* ================================================================== */
var S1_LIGHTS = nightSet(), S2_LIGHTS = nightSet();      /* the street's lamps, in two lots: the alley's end of it, and the hoop's end with the yard and the roof */
var SAT = { shopIn: V(0.2, 2.5, 35.2), shopOut: V(0.15, 4.8, 33.2), champ1: V(6.2, 4.7, 24.9), champ2: V(9.8, 4.7, 24.9), booth1: V(9.2, 2.05, 32.5), booth2: V(12.8, 2.05, 32.5), booth3: V(16.4, 2.05, 32.5),
  fill: V(10, 5.2, 29), post2: V(17.0, 6.4, 27.0), lampD: V(19.6, 3.6, 24.3), floodA: V(22.7, 5.6, 14.7), floodB: V(31.3, 5.6, 14.7), yard: V(27, 4.2, 19.5), post3: V(30.0, 6.4, 27.0), hoop: V(39.7, 5.4, 29),
  fire2: V(33.7, 1.4, 32.8), farL: V(26.6, 3.55, 33.6), roofFill: V(37, 8.3, 17), roofL: V(34.4, 8.2, 19.4), stair: V(38.4, 4.0, 24.3) };
(function () {
  useLights(S1_LIGHTS);
  addLight(AT.post, SODIUM, 1.8, 45, 80, 11, 'post'); addLight(SAT.shopIn, WARM, 2.0, 0, 0, 4.5, 'shop'); addLight(SAT.shopOut, WARM, 1.3, 0, 0, 3.6, 'sign');                 /* 0, 1, 2 */
  addLight(SAT.champ1, WARM, 1.8, 0, 0, 3.4, 'champ'); addLight(SAT.champ2, WARM, 1.8, 0, 0, 3.4, 'champ');                                                                 /* 3, 4 */
  addLight(SAT.booth1, WARM, 1.3, 0, 0, 2.8, 'booth'); addLight(SAT.booth2, WARM, 1.3, 0, 0, 2.8, 'booth'); addLight(SAT.booth3, WARM, 1.3, 0, 0, 2.8, 'booth');           /* 5, 6, 7 */
  addLight(SAT.fill, WARM, 0.5, 0, 0, 4.5, 'none'); addLight(SAT.post2, SODIUM, 1.8, 45, 80, 11, 'post'); addLight(SAT.lampD, COLD, 1.2, 0, 0, 3.4, 'wall');                /* 8, 9, 10 */
  addLight(AT.sg4, WARM, 0.55, 0, 0, 5, 'none'); addLight(SAT.post3, SODIUM, 1.8, 45, 80, 11, 'post');                                                                       /* 11, 12 */
  fillLights();
  useLights(S2_LIGHTS);
  addLight(SAT.post2, SODIUM, 1.8, 45, 80, 11, 'post'); addLight(SAT.lampD, COLD, 1.2, 0, 0, 3.4, 'wall'); addLight(SAT.booth3, WARM, 1.3, 0, 0, 2.8, 'booth');             /* 0, 1, 2 */
  addLight(SAT.floodA, COLD, 1.8, 0, 0, 6, 'flood'); addLight(SAT.floodB, COLD, 1.8, 0, 0, 6, 'flood'); addLight(SAT.yard, WARM, 0.7, 0, 0, 5, 'none');                      /* 3, 4, 5 */
  addLight(SAT.post3, SODIUM, 1.8, 45, 80, 11, 'post'); addLight(SAT.hoop, COLD, 1.7, 0, 0, 5, 'hoop'); addLight(SAT.fire2, FIRE, 1.9, 0, 0, 3.2, 'fire');                   /* 6, 7, 8 */
  addLight(SAT.farL, SODIUM, 1.3, 0, 0, 3.0, 'wall'); addLight(SAT.roofFill, WARM, 0.9, 0, 0, 5, 'none'); addLight(SAT.roofL, WARM, 1.2, 0, 0, 3.6, 'roof'); addLight(SAT.stair, SODIUM, 1.2, 0, 0, 3.2, 'wall');      /* 9, 10, 11, 12 */
  fillLights();
  useLights(ARENA_LIGHTS);
})();

/* ---------------- pieces ---------------- */
function footShade(x0, z0, x1, z1, nx, nz, y) {          /* grime up the foot of a wall, shade along it on the ground */
  y = y || 0;
  shade(V(x0 + nx * 0.012, y, z0 + nz * 0.012), V(x1 + nx * 0.012, y, z1 + nz * 0.012), V(0, 1, 0), 1.3);
  shade(V(x0, y + 0.012, z0), V(x1, y + 0.012, z1), V(nx, 0, nz), 0.8);
}
function doorAt(x, z, nx, nz, y0) {                      /* a steel back door in a wall that faces (nx, nz) */
  var ry = Math.atan2(nx, nz); y0 = y0 || 0;
  box('doorG', V(x + nx * 0.04, y0 + 1.05, z + nz * 0.04), 0.95, 2.1, 0.08, ry); box('conc', V(x + nx * 0.06, y0 + 2.2, z + nz * 0.06), 1.2, 0.14, 0.14, ry);
  box('steelG', V(x + nx * 0.1 + nz * 0.34, y0 + 1.0, z + nz * 0.1 - nx * 0.34), 0.04, 0.12, 0.03, ry);
}
function stoopAt(x, z, nz, g) {                          /* three concrete steps up to a door, iron rails either side: somewhere to sit */
  box('conc', V(x, g + 0.27, z + nz * 0.55), 2.2, 0.54, 1.1, 0); box('conc', V(x, g + 0.18, z + nz * 1.25), 2.2, 0.36, 0.3, 0); box('conc', V(x, g + 0.09, z + nz * 1.55), 2.2, 0.18, 0.3, 0);
  doorAt(x, z, 0, nz, g + 0.54);
  [x - 1.08, x + 1.08].forEach(function (xr) {
    pipe('steelK', [V(xr, g + 1.44, z + nz * 0.1), V(xr, g + 1.44, z + nz * 1.15), V(xr, g + 0.9, z + nz * 1.72), V(xr, g, z + nz * 1.72)], 0.02, 6);
    pipe('steelK', [V(xr, g + 1.44, z + nz * 1.15), V(xr, g + 0.54, z + nz * 1.15)], 0.02, 6);
  });
  shadow(x, z + nz * 0.9, g, 1.4, 1.2, 0);
}
function gooseneck(group, L, nx, nz) {                   /* an old shop lamp on a bent pipe, out from a wall that faces (nx, nz), its beam in the damp air */
  var p = L.pos;
  pipe('steelK', [V(p.x - nx * 0.88, p.y + 0.35, p.z - nz * 0.88), V(p.x - nx * 0.4, p.y + 0.56, p.z - nz * 0.4), V(p.x - nx * 0.05, p.y + 0.42, p.z - nz * 0.05), V(p.x, p.y + 0.2, p.z)], 0.02, 6);
  lathe('steelK', V(p.x, p.y + 0.02, p.z), [[0.2, 0], [0.17, 0.05], [0.05, 0.16], [0.0, 0.18]], 12);
  lampBulb(group, V(p.x, p.y, p.z), 0.05, L, 0xfff0d0); lampHalo(group, p, 1.3, L, 0xffe0b0); lightCone(group, V(p.x, p.y + 0.06, p.z), 1.4, 2.8, 0xffe6c0, 0.2);
}
function fireOn(group, x, y, z, L) {                     /* a fire in an open drum standing on y */
  var ember = new T.Mesh(new T.CircleGeometry(0.272, 24), new T.MeshBasicMaterial({ color: 0xff7a1c })); ember.rotation.x = -Math.PI / 2; ember.position.set(x, y + 0.66, z); group.add(ember); L.bulb = ember;
  lampHalo(group, V(x, y + 1.08, z), 1.7, L, 0xff8a2a); L.halo.scale.set(1.3, 1.9, 1);
  [[0xff5a10, 0.74, 1.25, 1.12, 0.8], [0xffa030, 0.5, 0.9, 1.02, 1.0], [0xffe6a0, 0.26, 0.44, 0.9, 0.8]].forEach(function (f) {
    var fl = new T.Sprite(new T.SpriteMaterial({ map: glowTex(), color: f[0], blending: T.AdditiveBlending, depthWrite: false, transparent: true, opacity: f[4] })); fl.position.set(x, y + f[3], z); fl.scale.set(f[1], f[2], 1); fl.renderOrder = 3; group.add(fl);
  });
  decal('poolF', V(x, y + 0.011, z), 4.4, 4.4, 0);
}
function steam(group, x, z) {                            /* a manhole cover, and the steam coming up round it */
  lathe('steelK', V(x, 0.002, z), [[0.42, 0], [0.42, 0.012], [0.0, 0.014]], 16);
  [[0.4, 0.9, 0.17], [1.0, 1.3, 0.13], [1.7, 1.8, 0.09], [2.5, 2.3, 0.06], [3.4, 2.8, 0.035]].forEach(function (s) {
    var sp = new T.Sprite(new T.SpriteMaterial({ map: glowTex(), color: 0xb4c0d2, depthWrite: false, transparent: true, opacity: s[2] * 2.4 })); sp.position.set(x + s[0] * 0.14, s[0], z - s[0] * 0.08); sp.scale.set(s[1], s[1] * 1.25, 1); sp.renderOrder = 3; group.add(sp);
  });
}
function groundPaint(group, tex, w, d, x, z) {           /* paint on the road */
  if (!tex) return;
  var m = new T.Mesh(new T.PlaneGeometry(w, d), roomMat({ tex: tex, two: true, blend: true, snap: false, offset: true, grime: 0.3 })); m.rotation.x = -Math.PI / 2; m.position.set(x, 0.007, z); m.renderOrder = 1; group.add(m);
}
function barrier(x, z, yaw) {                            /* a road barrier: two striped boards on four legs */
  var M = xf(x, 0, z, 0, yaw, 0);
  [-1.0, 1.0].forEach(function (lx) { [-0.26, 0.26].forEach(function (lz) { pipe('steelK', [V(lx, 1.04, 0).applyMatrix4(M), V(lx, 0, lz).applyMatrix4(M)], 0.018, 5); }); });
  obox('hazardS', M, 0, 0.92, 0, 2.4, 0.2, 0.03); obox('hazardS', M, 0, 0.5, 0, 2.4, 0.16, 0.03); shadow(x, z, 0, 1.2, 0.4, yaw);
}
function hydrant(x, y, z) {
  turned('hydR', V(x, y, z), [[0.11, 0], [0.11, 0.04], [0.075, 0.06], [0.075, 0.42], [0.095, 0.44], [0.095, 0.48], [0.06, 0.56], [0.03, 0.6], [0.0, 0.61]], 12, 0);
  rod('hydR', V(x - 0.13, y + 0.34, z), V(x + 0.13, y + 0.34, z), 0.036, 8); rod('hydR', V(x, y + 0.3, z - 0.14), V(x, y + 0.3, z), 0.045, 8); shadow(x, z, y, 0.2);
}
function bin(x, y, z) {                                  /* a street litter bin */
  var c = V(x, y, z);
  turned('galv', c, [[0.24, 0], [0.26, 0.02], [0.29, 0.78], [0.3, 0.8], [0.3, 0.84], [0.275, 0.86]], 16, 0); turned('drumIn', c, [[0.275, 0.86], [0.26, 0.84], [0.25, 0.3]], 16, 0);
  for (var k = 0; k < 8; k++) { var a = k / 8 * 6.283; pipe('steelK', [V(x + Math.sin(a) * 0.265, y + 0.03, z + Math.cos(a) * 0.265), V(x + Math.sin(a) * 0.293, y + 0.78, z + Math.cos(a) * 0.293)], 0.008, 4); }
  shadow(x, z, y, 0.4);
}
function hatOn(key, x, y, z) {                           /* a hat on a head-shaped block on a stand: what a cosmetics seller shows off */
  pipe('steelK', [V(x, y, z), V(x, y + 0.28, z)], 0.012, 6); turned('steelK', V(x, y, z), [[0.07, 0], [0.07, 0.012], [0.0, 0.014]], 10, 0);
  turned('lidK', V(x, y + 0.26, z), [[0.0, 0], [0.07, 0.02], [0.095, 0.1], [0.08, 0.19], [0.0, 0.22]], 12, 0);
  turned(key, V(x, y + 0.42, z), [[0.19, 0], [0.19, 0.012], [0.1, 0.02], [0.096, 0.1], [0.0, 0.115]], 14, 0);
}
function bananas(x, y, z, seed) {                       /* a hand of bananas hanging from (x, y, z) */
  pipe('woodS', [V(x, y, z), V(x, y - 0.05, z)], 0.012, 5);
  for (var k = 0; k < 6; k++) {
    var a = k / 6 * 6.283 + seed, dx = Math.sin(a), dz = Math.cos(a), r = 0.9 + hash2(seed, k) * 0.3;
    pipe('banana', [V(x + dx * 0.015, y - 0.05, z + dz * 0.015), V(x + dx * 0.055 * r, y - 0.11, z + dz * 0.055 * r), V(x + dx * 0.075 * r, y - 0.19, z + dz * 0.075 * r), V(x + dx * 0.06 * r, y - 0.26, z + dz * 0.06 * r)], 0.019, 6);
  }
}
/* a vendor's booth on the far sidewalk, facing the road: four poles, a tarpaulin over and behind, a board on two crates, a bare bulb, a sprayed sign. */
/* kind 1 sells walkouts (what goes off when you are picked to fight), 2 fight cards (your name and numbers, for the announcer), 3 bananas (for the crowd to eat and throw) */
function booth(group, x, L, tarp, kind, plates) {
  var g = 0.12, zf = 32.3, zb = 33.75, w = 1.2, ty = g + 0.78, k;
  [[-w, zf, 2.86], [w, zf, 2.86], [-w, zb, 2.1], [w, zb, 2.1]].forEach(function (p) { pipe('steelK', [V(x + p[0], g, p[1]), V(x + p[0], g + p[2], p[1])], 0.02, 6); });
  quadUV(tarp, V(x - w - 0.12, g + 2.38, zf - 0.2), V(x + w + 0.12, g + 2.38, zf - 0.2), V(x + w + 0.12, g + 2.1, zb + 0.05), V(x - w - 0.12, g + 2.1, zb + 0.05), 0, 0, 1, 1);
  quadUV(tarp, V(x - w - 0.12, g + 2.16, zf - 0.215), V(x + w + 0.12, g + 2.16, zf - 0.215), V(x + w + 0.12, g + 2.38, zf - 0.2), V(x - w - 0.12, g + 2.38, zf - 0.2), 0, 0, 1, 0.16);
  quadUV(tarp, V(x - w, g + 0.25, zb), V(x + w, g + 0.25, zb), V(x + w, g + 2.1, zb), V(x - w, g + 2.1, zb), 0, 0, 1, 1);
  box('woodS', V(x, g + 2.64, zf), 1.9, 0.44, 0.025, 0); plates.push([TEX.boothSign[kind - 1], 1.7, 0.42, V(x, g + 2.64, zf - 0.016), V(0, 0, -1)]);       /* its board, up between the front poles */
  crate(V(x - 0.72, g, 32.8), 0.72, 0.05); crate(V(x + 0.72, g, 32.8), 0.72, -0.04);
  obox('woodS', xf(x, g + 0.74, 32.8, 0, 0, 0), 0, 0.02, 0, 2.3, 0.04, 0.82);
  if (kind === 1) {                                      /* walkouts: a speaker, a smoke machine breathing, flares by the boxful */
    box('matK', V(x - 0.72, ty + 0.3, 32.85), 0.42, 0.6, 0.36, 0.15);
    [[0.42, 0.13], [0.16, 0.07]].forEach(function (c) { rod('steelK', V(x - 0.745, ty + c[0], 32.675), V(x - 0.75, ty + c[0], 32.655), c[1], 14); rod('lidK', V(x - 0.75, ty + c[0], 32.655), V(x - 0.752, ty + c[0], 32.648), c[1] * 0.8, 14); });
    box('galv', V(x - 0.05, ty + 0.11, 32.88), 0.4, 0.22, 0.3, -0.1); rod('steelK', V(x - 0.05, ty + 0.12, 32.73), V(x - 0.06, ty + 0.14, 32.62), 0.04, 8);
    [[0.3, 0.5, 0.2], [0.6, 0.8, 0.13], [1.0, 1.1, 0.07]].forEach(function (s) { var sp = new T.Sprite(new T.SpriteMaterial({ map: glowTex(), color: 0xc4cedd, depthWrite: false, transparent: true, opacity: s[2] * 2 })); sp.position.set(x - 0.06 - s[0] * 0.1, ty + 0.14 + s[0] * 0.5, 32.6 - s[0] * 0.35); sp.scale.set(s[1], s[1], 1); sp.renderOrder = 3; group.add(sp); });
    crate(V(x + 0.62, ty, 32.85), 0.36, 0.2);
    for (k = 0; k < 7; k++) turned(k % 3 ? 'itemB' : 'itemA', V(x + 0.5 + (k % 4) * 0.075, ty + 0.2, 32.75 + Math.floor(k / 4) * 0.12 + (k % 2) * 0.03), [[0.022, 0], [0.022, 0.32], [0.0, 0.33]], 8, 0);
    rod('tarpR', V(x + 0.1, ty + 0.05, 33.05), V(x + 1.0, ty + 0.05, 33.12), 0.05, 8); carton(x - 1.0, g, 33.45, 0.45, 0.3); crate(V(x + 0.95, g, 33.42), 0.5, -0.2);
  } else if (kind === 2) {                               /* fight cards: cards pegged along a line, stacks of blanks, a camera on legs to take your picture */
    pipe('wire', sagPts(V(x - w, g + 1.86, zb - 0.03), V(x + w, g + 1.86, zb - 0.03), 0.06, 8), 0.005, 4);
    for (k = 0; k < 6; k++) plates.push([TEX.champ[(k * 5 + 1) % 12], 0.27, 0.385, V(x - 0.93 + k * 0.372, g + 1.64 - (k % 2) * 0.02, zb - 0.035), V(0, 0, -1), (hash2(k, 8) - 0.5) * 0.12, true]);
    for (k = 0; k < 4; k++) box('itemC', V(x - 0.8 + k * 0.3, ty + 0.03 + (k % 2) * 0.015, 32.78 + (k % 2) * 0.1), 0.19, 0.06 + (k % 2) * 0.03, 0.27, (hash2(k, 9) - 0.5) * 0.5);
    carton(x + 0.62, ty, 32.9, 0.3, 0.25, true);
    var cx = x + 1.5, cz = 32.55; [0, 2.09, 4.19].forEach(function (a) { pipe('steelK', [V(cx, g + 1.25, cz), V(cx + Math.sin(a) * 0.36, g, cz + Math.cos(a) * 0.36)], 0.014, 5); });
    box('matK', V(cx, g + 1.36, cz), 0.2, 0.15, 0.13, 0); rod('steelK', V(cx, g + 1.36, cz - 0.065), V(cx, g + 1.36, cz - 0.15), 0.045, 10); rod('glassM', V(cx, g + 1.36, cz - 0.15), V(cx, g + 1.36, cz - 0.156), 0.036, 10);
    carton(x - 1.0, g, 33.45, 0.45, 0.6); carton(x + 0.9, g, 33.4, 0.5, -0.4);
  } else {                                               /* bananas: hands of them hung along a bar, crates of them on the board */
    pipe('steelK', [V(x - w, g + 2.08, zf + 0.02), V(x + w, g + 2.08, zf + 0.02)], 0.016, 6);
    for (k = 0; k < 6; k++) bananas(x - 0.95 + k * 0.38, g + 2.08, zf + 0.02, k * 1.7 + 0.3);
    [[-0.68, 0.44, 0.1], [0.1, 0.4, -0.15], [0.78, 0.44, 0.2]].forEach(function (c, n) {
      crate(V(x + c[0], ty, 32.85), c[1], c[2]);
      for (k = 0; k < 7; k++) { var a = hash2(n, k) * 6.283, bx = x + c[0] + (hash2(k, n, 2) - 0.5) * c[1] * 0.6, bz = 32.85 + (hash2(k, n, 3) - 0.5) * c[1] * 0.6, by = ty + c[1] + 0.03; pipe('banana', [V(bx - Math.sin(a) * 0.09, by, bz - Math.cos(a) * 0.09), V(bx, by + 0.035, bz), V(bx + Math.sin(a) * 0.09, by, bz + Math.cos(a) * 0.09)], 0.019, 6); }
    });
    crate(V(x - 0.95, g, 33.42), 0.5, 0.3); carton(x + 0.95, g, 33.4, 0.5, -0.2, true);
  }
  pipe('wire', [V(L.pos.x, g + 2.26, L.pos.z), V(L.pos.x, L.pos.y + 0.08, L.pos.z)], 0.006, 4); lathe('wire', V(L.pos.x, L.pos.y + 0.03, L.pos.z), [[0.018, 0], [0.018, 0.06]], 5);
  lampBulb(group, L.pos, 0.045, L, 0xffe6b8); lampHalo(group, L.pos, 1.2, L, 0xffc070);
  shadow(x, 32.95, g, 1.4, 0.8, 0);
}
function heavyBag(x, z, top, key) {                      /* a heavy bag on three chains from a beam at top */
  var by = top - 1.75;
  turned(key, V(x, by, z), [[0.0, 0], [0.13, 0.0], [0.18, 0.05], [0.18, 1.1], [0.13, 1.15], [0.0, 1.15]], 16, hash2(x, z) * 6);
  [0, 2.1, 4.2].forEach(function (a) { pipe('steelK', [V(x + Math.sin(a) * 0.13, by + 1.15, z + Math.cos(a) * 0.13), V(x, top - 0.14, z)], 0.008, 4); });
  pipe('steelK', [V(x, top - 0.14, z), V(x, top, z)], 0.012, 5); shadow(x, z, 0, 0.32);
}
function dummy(x, z) {                                   /* a striking dummy: a padded body and head on a post set in a tyre, a padded bar for arms */
  tire(x, 0, z, 0.3); pipe('steelK', [V(x, 0, z), V(x, 1.0, z)], 0.05, 8);
  turned('bagL1', V(x, 0, z), [[0.0, 0.9], [0.17, 0.94], [0.21, 1.1], [0.25, 1.45], [0.2, 1.62], [0.09, 1.7], [0.0, 1.7]], 14, 0);
  turned('bagL1', V(x, 0, z), [[0.0, 1.68], [0.1, 1.72], [0.135, 1.84], [0.1, 1.96], [0.0, 1.99]], 12, 1);
  rod('matK', V(x - 0.5, 1.48, z), V(x + 0.5, 1.48, z), 0.055, 8); shadow(x, z, 0, 0.45);
}
function plyBox(x, z, h) {                               /* a jump box knocked up from boards: battens at the corners, a frame round the top */
  var M = xf(x, 0, z, 0, 0, 0), s = 1.2, hs = 0.6;
  obox('woodS', M, 0, h / 2, 0, s, h, s);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (q) { obox('woodS', M, q[0] * hs, h / 2, q[1] * hs, 0.07, h + 0.02, 0.07); });
  [-1, 1].forEach(function (q) { obox('woodS', M, 0, h, q * hs, s + 0.07, 0.05, 0.07); obox('woodS', M, q * hs, h, 0, 0.07, 0.05, s + 0.07); });
  shadow(x, z, 0, 0.9);
}
function parapet(x0, z0, x1, z1, y) {                    /* a low brick wall round a roof, with a coping */
  var len = Math.hypot(x1 - x0, z1 - z0), ry = Math.atan2(-(z1 - z0), x1 - x0), c = V((x0 + x1) / 2, y + 0.3, (z0 + z1) / 2);
  box('brickD', c, len, 0.6, 0.24, ry); box('conc', V(c.x, y + 0.63, c.z), len + 0.04, 0.06, 0.3, ry);
}

/* ---------------- the alley's end of the street: the shop, the champions, the booths ---------------- */
function townNear(group, plates) {
  var L = S1_LIGHTS.lamps, g = 0.12, i;
  quad('asphalt', V(-8, 0, 24), V(20, 0, 24), V(20, 0, 34), V(-8, 0, 34), V(6, -5, 29));
  [[-8, -3.5], [3.5, 20]].forEach(function (s) { box('walk', V((s[0] + s[1]) / 2, 0.06, 25), s[1] - s[0], 0.12, 2, 0); box('curb', V((s[0] + s[1]) / 2, 0.07, 26.06), s[1] - s[0], 0.14, 0.14, 0); });
  box('conc', V(0, 0.012, 25.05), 7, 0.024, 2.1, 0);                                                          /* the apron across the alley's mouth */
  box('walk', V(6, 0.06, 33), 28, 0.12, 2, 0); box('curb', V(6, 0.07, 31.94), 28, 0.14, 0.14, 0);
  box('tar', V(20, 0.004, 29), 0.7, 0.008, 5.8, 0);
  [1.0, 14.0].forEach(function (x) { box('grate', V(x, 0.006, 26.32), 0.9, 0.012, 0.36, 0); });
  /* the alley's side: the tall painted block with a stoop, the yellow block with the wall of champions, a red block with a shutter */
  wallQ('brickP', -8, 24, -3.5, 24, 0, 16, 0, 1); trim('conc', -8, 24, -3.5, 24, 16.12, 0.3, 0.4, 0, 1); windowsOn(-7.7, 24, -3.8, 24, 0, 1, [4.4, 7.5, 10.6, 13.6], 2, 541, 0.3, 0.1);
  wallQ('brickY', 3.5, 24, 12, 24, 0, 12.5, 0, 1); trim('conc', 3.5, 24, 12, 24, 12.62, 0.3, 0.4, 0, 1); windowsOn(4.2, 24, 11.4, 24, 0, 1, [5.2, 8.0, 10.4], 3, 542, 0.3, 0.15);
  wallQ('brickR', 12, 24, 22, 24, 0, 14, 0, 1); trim('conc', 12, 24, 22, 24, 14.12, 0.3, 0.4, 0, 1); trim('conc', 12, 24, 22, 24, 3.7, 0.16, 0.1, 0, 1); windowsOn(12.6, 24, 21.4, 24, 0, 1, [4.4, 7.5, 10.6], 4, 543, 0.35, 0.1);
  doorAt(13.0, 24, 0, 1, g); shutterAt(18.6, 24, 3.0, 2.9, 0, 1, 0, g); wallLamp(group, L[10], 0, 1);
  pipe('steelK', [V(12.0, 12.5, 24.08), V(12.0, 0.5, 24.08), V(12.0, 0.26, 24.3)], 0.06, 8); pipe('steelK', [V(3.6, 12.5, 24.08), V(3.6, 0.5, 24.08), V(3.6, 0.26, 24.3)], 0.06, 8);
  footShade(-8, 24, -3.5, 24, 0, 1, g); footShade(3.5, 24, 22, 24, 0, 1, g);
  stoopAt(-5.9, 24, 1, g);
  var sb = new T.Mesh(new T.SphereGeometry(0.06, 8, 6), new T.MeshBasicMaterial({ color: 0xffe0b0 })); sb.position.set(-5.9, 3.1, 24.14); group.add(sb); box('steelK', V(-5.9, 3.2, 24.07), 0.2, 0.1, 0.14, 0);
  crate(V(-4.35, g, 24.55), 0.6, 0.2); crate(V(-7.35, g, 24.5), 0.7, -0.1); bottle(-5.3, 25.2, g + 0.36); bottle(-6.6, 25.45, g + 0.18, 1.0); bottle(-4.4, 24.5, g + 0.62);
  /* the wall of champions */
  plates.push([TEX.tagChamp, 4.8, 1.15, V(8.0, 3.82, 24.03), V(0, 0, 1)]);
  for (i = 0; i < 12; i++) plates.push([TEX.champ[i], 0.7, 1.0, V(5.2 + (i % 6) * 1.12, (i < 6 ? 2.68 : 1.58) + (hash2(i, 5) - 0.5) * 0.05, 24.03), V(0, 0, 1), (hash2(i, 3) - 0.5) * 0.07, true]);
  gooseneck(group, L[3], 0, 1); gooseneck(group, L[4], 0, 1);
  decal('poolO', V(8, g + 0.011, 25.2), 7, 2.4, 0);
  dumpster(15.2, 24.8, 0, false, 705, g); bag(16.55, 24.7, 0.9, 706, 'bagK', g); bag(14.05, 24.6, 0.8, 707, 'bagK', g); drum(21.3, 24.5, 'drumB', g); drum(20.65, 24.55, 'drumR', g);
  plates.push([TEX.scr[1], 1.1, 0.66, V(20.9, 2.2, 24.03), V(0, 0, 1), 0.06]); plates.push([TEX.scr[3], 1.25, 0.75, V(-6.9, 1.9, 24.03), V(0, 0, 1), -0.05]);
  /* the dead end: a wall with a goods shutter, the road shut off with barriers */
  wallQ('brickD', -8, 24, -8, 34, 0, 13, 1, 0); trim('conc', -8, 24, -8, 34, 13.12, 0.3, 0.4, 1, 0); windowsOn(-8, 24.8, -8, 33.2, 1, 0, [5.2, 8.2], 3, 544, 0.3);
  shutterAt(-8, 29, 3.4, 3.2, 1, 0, 0); footShade(-8, 26.1, -8, 31.9, 1, 0, 0);
  plates.push([TEX.tagCrown, 1.6, 1.3, V(-7.97, 2.1, 26.9), V(1, 0, 0)]); plates.push([TEX.scr[4], 1.25, 0.75, V(-7.93, 1.6, 29.2), V(1, 0, 0), 0.05]);
  barrier(-6.1, 27.8, 1.5); barrier(-6.2, 30.5, 1.64); roadCone(-5.3, 26.75); roadCone(-5.4, 31.5);
  bag(-7.3, 33.2, 1.0, 701, 'bagK', g); bag(-6.55, 33.4, 0.9, 702, 'bagW', g); bag(-7.4, 32.5, 0.8, 703, 'bagK', g);
  /* the far side: the shop, then a tall red block with the booths in front of it */
  holedWall(V(-8, 0, 34), V(6, 0, 34), 13, [[13, 'brickD']], [[5, 9.6, 0.87, 2.95], [10.2, 11.3, g, 2.4]], V(0, 1, 40));
  trim('conc', -8, 34, 6, 34, 13.12, 0.3, 0.4, 0, -1); windowsOn(-7.4, 34, 5.4, 34, 0, -1, [5.6, 8.4, 10.9], 5, 551, 0.35);
  wallQ('brickR', 6, 34, 18, 34, 0, 15, 0, -1); trim('conc', 6, 34, 18, 34, 15.12, 0.3, 0.4, 0, -1); windowsOn(6.6, 34, 17.4, 34, 0, -1, [4.8, 7.7, 10.6, 13.0], 4, 552, 0.3, 0.1);
  pipe('steelK', [V(6.0, 13, 33.92), V(6.0, 0.5, 33.92), V(6.0, 0.26, 33.7)], 0.06, 8); pipe('steelK', [V(17.9, 12, 33.92), V(17.9, 0.5, 33.92), V(17.9, 0.26, 33.7)], 0.06, 8);
  footShade(-8, 34, -3.3, 34, 0, -1, g); footShade(3.6, 34, 18, 34, 0, -1, g);
  /* inside the shop: a lit room, shelves of stock, a counter */
  var sx0 = -3.3, sx1 = 3.6, sz = 36.4;
  quad('shopF', V(sx0, g, 34), V(sx1, g, 34), V(sx1, g, sz), V(sx0, g, sz), V(0, -5, 35));
  wallQ('shopW', sx0, sz, sx1, sz, g, 3.1, 0, -1); wallQ('shopW', sx0, 34, sx0, sz, g, 3.1, 1, 0); wallQ('shopW', sx1, 34, sx1, sz, g, 3.1, -1, 0);
  quad('shopW', V(sx0, 3.1, 34), V(sx1, 3.1, 34), V(sx1, 3.1, sz), V(sx0, 3.1, sz), V(0, 9, 35));
  var panel = new T.Mesh(new T.BoxGeometry(2.4, 0.04, 0.5), new T.MeshBasicMaterial({ color: 0xfff0d2 })); panel.position.set(0.2, 3.07, 35.2); group.add(panel); L[1].bulb = panel;
  [0.95, 1.55, 2.15].forEach(function (y, r) {
    box('woodS', V(-0.7, y, sz - 0.2), 4.6, 0.04, 0.36, 0);
    for (var k = 0; k < 9; k++) { var hh = 0.16 + hash2(k, r, 1) * 0.16, ww = 0.2 + hash2(k, r, 2) * 0.14; box(['itemA', 'itemB', 'itemC', 'card'][(k + r) % 4], V(-2.8 + k * 0.52, y + 0.02 + hh / 2, sz - 0.2), ww, hh, 0.22, (hash2(k, r, 3) - 0.5) * 0.4); }
  });
  box('woodS', V(-0.3, g + 0.5, 35.45), 1.9, 1.0, 0.55, 0); box('steelK', V(-0.3, g + 1.02, 35.45), 2.0, 0.04, 0.65, 0); carton(-0.9, g + 1.04, 35.45, 0.26, 0.3);
  /* its front: a big window with hats on show, an open door, an awning, the word sprayed on the brick above, a strip light over that */
  box('steelK', V(-0.7, 0.87, 34.0), 4.7, 0.08, 0.16, 0); box('steelK', V(-0.7, 2.95, 34.0), 4.7, 0.08, 0.16, 0);
  [-3.0, -1.47, 0.07, 1.6].forEach(function (x) { box('steelK', V(x, 1.91, 34.0), 0.07, 2.08, 0.16, 0); });
  var glass = new T.Mesh(new T.PlaneGeometry(4.6, 2.08), new T.MeshBasicMaterial({ color: 0x9fc0e0, transparent: true, opacity: 0.1, depthWrite: false, side: T.DoubleSide })); glass.position.set(-0.7, 1.91, 33.99); glass.userData.key = 'glassS'; group.add(glass);
  box('woodS', V(-0.7, 0.9, 34.45), 4.4, 0.05, 0.6, 0);
  [[-2.4, 'itemA'], [-1.2, 'itemC'], [0.0, 'itemB'], [1.0, 'itemA']].forEach(function (h, k) { hatOn(h[1], h[0], 0.925, 34.4 + (k % 2) * 0.12); });
  [2.2, 3.3].forEach(function (x) { box('steelK', V(x, 1.26, 34.0), 0.07, 2.28, 0.16, 0); }); box('steelK', V(2.75, 2.42, 34.0), 1.17, 0.07, 0.16, 0);
  obox('doorG', xf(3.26, g, 34.06, 0, 1.25, 0), -0.5, 1.12, 0, 1.0, 2.24, 0.04);
  quadUV('awnS', V(sx0, 2.72, 32.85), V(sx1, 2.72, 32.85), V(sx1, 3.36, 34), V(sx0, 3.36, 34), 0, 0, 11.5, 1);
  quadUV('awnS', V(sx0, 2.47, 32.85), V(sx1, 2.47, 32.85), V(sx1, 2.72, 32.85), V(sx0, 2.72, 32.85), 0, 0, 11.5, 1);
  [sx0, sx1].forEach(function (x) { pipe('steelK', [V(x, 2.72, 32.87), V(x, 2.72, 34)], 0.015, 5); pipe('steelK', [V(x, 2.72, 32.87), V(x, 2.2, 34)], 0.012, 5); });
  plates.push([TEX.tagCos, 4.4, 1.15, V(0.15, 4.28, 33.97), V(0, 0, -1)]);
  box('steelK', V(0.15, 5.03, 33.86), 3.8, 0.08, 0.26, 0);
  var strip = new T.Mesh(new T.BoxGeometry(3.6, 0.03, 0.08), new T.MeshBasicMaterial({ color: 0xffe9c4 })); strip.position.set(0.15, 4.975, 33.8); group.add(strip); L[2].bulb = strip;
  lampHalo(group, V(0.15, 4.9, 33.7), 1.6, L[2], 0xffd9a0); L[2].halo.scale.set(5, 1.2, 1);
  decal('poolO', V(-0.2, g + 0.011, 33.0), 7.5, 2.2, 0);
  [0, 1, 2, 3].forEach(function (k) { plates.push([TEX.bill[k % 3], 0.6, 0.85, V(6.7 + k * 0.64, (k % 2 ? 1.72 : 1.8), 33.97), V(0, 0, -1), (k - 1.5) * 0.03, true]); });
  plates.push([TEX.scr[2], 1.25, 0.75, V(-5.6, 1.7, 33.97), V(0, 0, -1), 0.06]);
  hydrant(5.3, g, 32.5); bin(18.9, g, 32.7); crate(V(4.5, g, 33.5), 0.5, 0.3); bottle(4.45, 33.45, g + 0.516);
  booth(group, 9.2, L[5], 'tarpB', 1, plates); booth(group, 12.8, L[6], 'tarpR', 2, plates); booth(group, 16.4, L[7], 'tarpG', 3, plates);
  /* lamps on posts, their beams and their pools; strings of bulbs across to the booths; steam */
  streetLamp(group, L[0], 4.3, 25.6); lightCone(group, V(AT.post.x, AT.post.y + 0.1, AT.post.z), 3.8, 6.4, 0xffc070, 0.24); decal('poolO', V(AT.post.x, 0.011, AT.post.z), 8, 6, 0);
  streetLamp(group, L[9], 17.0, 25.7); lightCone(group, V(SAT.post2.x, SAT.post2.y + 0.1, SAT.post2.z), 3.8, 6.4, 0xffc070, 0.24); decal('poolO', V(SAT.post2.x, 0.011, SAT.post2.z), 8, 6, 0);
  bulbString(group, V(7, 5.7, 24.05), V(11, 5.3, 33.95), 0.6, 13); bulbString(group, V(11, 5.3, 33.95), V(15, 5.7, 24.05), 0.6, 13); bulbString(group, V(15, 5.7, 24.05), V(19, 5.3, 33.95), 0.6, 13);
  pipe('wire', sagPts(V(-2, 9.4, 24.05), V(2, 8.6, 33.95), 0.9, 12), 0.012, 4); pipe('wire', sagPts(V(5, 10.6, 24.05), V(9, 11.2, 33.95), 1.0, 12), 0.012, 4);
  steam(group, 8.2, 29.3);
}

/* ---------------- the hoop's end: the practice yard, the roof, the hoop ---------------- */
function townFar(group, plates) {
  var L = S2_LIGHTS.lamps, g = 0.12, i, R = 6;
  quad('asphalt', V(20, 0, 24), V(40, 0, 24), V(40, 0, 34), V(20, 0, 34), V(30, -5, 29)); quad('asphalt', V(22, 0, 14), V(32, 0, 14), V(32, 0, 24), V(22, 0, 24), V(27, -5, 19));
  box('walk', V(30, 0.06, 25), 20, 0.12, 2, 0); box('curb', V(30, 0.07, 26.06), 20, 0.14, 0.14, 0); box('walk', V(30, 0.06, 33), 20, 0.12, 2, 0); box('curb', V(30, 0.07, 31.94), 20, 0.14, 0.14, 0);
  box('grate', V(27.0, 0.006, 26.32), 0.9, 0.012, 0.36, 0);
  /* the far side: a blue-painted block with a stoop, a yellow one with a shutter */
  wallQ('brickP', 18, 34, 30, 34, 0, 12, 0, -1); trim('conc', 18, 34, 30, 34, 12.12, 0.3, 0.4, 0, -1); windowsOn(18.6, 34, 29.4, 34, 0, -1, [4.9, 7.5, 9.9], 4, 563, 0.3, 0.1);
  shutterAt(21.4, 34, 3.0, 2.9, 0, -1, 0, g); stoopAt(26.6, 34, -1, g);
  box('steelK', V(26.6, 3.66, 33.9), 0.2, 0.1, 0.2, 0); lampBulb(group, SAT.farL, 0.06, L[9], 0xffd49a); lampHalo(group, SAT.farL, 1.4, L[9], 0xffb060);
  wallQ('brickY', 30, 34, 40, 34, 0, 14, 0, -1); trim('conc', 30, 34, 40, 34, 14.12, 0.3, 0.4, 0, -1); windowsOn(30.6, 34, 39.4, 34, 0, -1, [4.8, 7.7, 10.6], 3, 564, 0.3, 0.15);
  shutterAt(35.3, 34, 3.0, 2.9, 0, -1, 0, g); plates.push([TEX.tagKO, 1.7, 1.4, V(35.3, 1.75, 33.93), V(0, 0, -1)]);
  pipe('steelK', [V(30.0, 12, 33.92), V(30.0, 0.5, 33.92), V(30.0, 0.26, 33.7)], 0.06, 8);
  footShade(18, 34, 40, 34, 0, -1, g);
  dumpster(31.4, 33.2, Math.PI, true, 721, g); bag(32.7, 33.45, 0.9, 722, 'bagK', g); bag(30.2, 33.4, 0.85, 723, 'bagK', g);
  drum(33.7, 32.8, 'drumK', g, true); fireOn(group, 33.7, g, 32.8, L[8]); crate(V(34.9, g, 33.3), 0.5, 0.3); crate(V(33.0, g, 32.3), 0.45, 0.7); bottle(34.85, 33.25, g + 0.516); bottle(34.2, 32.4, g, 2.0);
  tire(38.8, g, 33.3, 0.3); tire(38.75, g + 0.21, 33.28, 1.1); tire(37.9, g, 33.4, 0.7);
  plates.push([TEX.scr[0], 1.25, 0.75, V(23.9, 1.9, 33.97), V(0, 0, -1), 0.05]); plates.push([TEX.scr[5], 1.1, 0.66, V(38.2, 2.2, 33.97), V(0, 0, -1), -0.06]);
  [0, 1, 2].forEach(function (k) { plates.push([TEX.bill[(k + 1) % 3], 0.6, 0.85, V(28.4 + k * 0.63, 1.8 - (k % 2) * 0.06, 33.97), V(0, 0, -1), (k - 1) * 0.04, true]); });
  /* the end of the street: a wall, the hoop on it, the lines of a half court on the road */
  wallQ('brickD', 40, 14, 40, 34, 0, 9, -1, 0); trim('conc', 40, 14, 40, 34, 9.12, 0.3, 0.4, -1, 0); footShade(40, 26.1, 40, 31.9, -1, 0, 0);
  [-0.45, 0.45].forEach(function (d) { pipe('steelK', [V(40, 3.75, 29 + d), V(39.26, 3.55, 29 + d * 0.7)], 0.025, 6); pipe('steelK', [V(40, 3.0, 29 + d), V(39.26, 3.3, 29 + d * 0.7)], 0.025, 6); });
  box('boardW', V(39.22, 3.5, 29), 0.04, 1.05, 1.8, 0); box('rimO', V(39.195, 3.28, 29), 0.006, 0.45, 0.6, 0); box('boardW', V(39.19, 3.28, 29), 0.008, 0.37, 0.52, 0);
  var ring = []; for (i = 0; i <= 16; i++) ring.push(V(38.77 + Math.cos(i / 16 * 6.2832) * 0.23, 3.05, 29 + Math.sin(i / 16 * 6.2832) * 0.23));
  pipe('rimO', ring, 0.012, 6); box('rimO', V(39.1, 3.04, 29), 0.2, 0.02, 0.1, 0); turned('fenceS', V(38.77, 2.62, 29), [[0.13, 0], [0.225, 0.43]], 14, 0);
  wallLamp(group, L[7], -1, 0); lightCone(group, V(SAT.hoop.x - 0.1, SAT.hoop.y, SAT.hoop.z), 2.6, 5.2, 0xdcebff, 0.16);
  groundPaint(group, TEX.court, 5.8, 4.9, 37.1, 29);
  turned('ballO', V(36.9, 0, 27.6), [[0.0, 0], [0.085, 0.035], [0.12, 0.12], [0.085, 0.205], [0.0, 0.24]], 14, 0); shadow(36.9, 27.6, 0, 0.16);
  plates.push([TEX.tagCrown, 1.6, 1.3, V(39.97, 2.0, 32.4), V(-1, 0, 0)]); plates.push([TEX.hands[0], 1.7, 2.5, V(39.97, 1.6, 26.2), V(-1, 0, 0)]);
  /* the practice yard: a fenced lot between two buildings */
  wallQ('brickR', 22, 14, 22, 24, 0, 14, 1, 0); trim('conc', 22, 14, 22, 24, 14.12, 0.3, 0.4, 1, 0); windowsOn(22, 15, 22, 23, 1, 0, [5.0, 8.0, 11.0], 3, 561, 0.3, 0.1);
  wallQ('brickD', 22, 14, 32, 14, 0, 10, 0, 1); trim('conc', 22, 14, 32, 14, 10.12, 0.3, 0.4, 0, 1); windowsOn(22.8, 14, 31.2, 14, 0, 1, [4.6, 7.2], 3, 562, 0.3, 0.2);
  wallQ('brickD', 32, 14, 32, 24, 0, R + 0.6, -1, 0);
  footShade(22, 14, 22, 24, 1, 0, 0); footShade(22, 14, 32, 14, 0, 1, 0); footShade(32, 14, 32, 24, -1, 0, 0);
  chainFence(22, 24, 25.5, 24, 2.6, 0, 1); chainFence(28.5, 24, 32, 24, 2.6, 0, 1); chainFence(25.5, 24, 25.15, 22.5, 2.4, 1, 0); chainFence(28.5, 24, 28.9, 22.5, 2.4, -1, 0);
  [SAT.floodA, SAT.floodB].forEach(function (p, k) {       /* a floodlight on a pole in each back corner */
    pipe('steelK', [V(p.x, 0, p.z - 0.3), V(p.x, p.y + 0.2, p.z - 0.3)], 0.05, 8);
    var fl = new T.Mesh(new T.BoxGeometry(0.5, 0.3, 0.08), new T.MeshBasicMaterial({ color: 0xe6f0ff })); fl.position.set(p.x, p.y, p.z - 0.2); fl.rotation.x = 0.5; group.add(fl); L[3 + k].bulb = fl;
    box('steelK', V(p.x, p.y + 0.02, p.z - 0.27), 0.58, 0.38, 0.1, 0); lampHalo(group, V(p.x, p.y, p.z), 2.2, L[3 + k], 0xcfe2ff);
  });
  bulbString(group, V(22, 4.8, 23.4), V(32, 5.0, 18.6), 0.55, 12); bulbString(group, V(32, 5.0, 18.6), V(22, 4.6, 15.2), 0.55, 12);
  /* heavy bags on a frame */
  [23.4, 27.6].forEach(function (x) { pipe('steelK', [V(x, 0, 16.2), V(x, 3.1, 16.2)], 0.05, 8); box('steelK', V(x, 0.02, 16.2), 0.5, 0.04, 0.5, 0); pipe('steelK', [V(x, 2.4, 16.2), V(x + (x < 25 ? 0.6 : -0.6), 3.1, 16.2)], 0.03, 6); });
  pipe('steelK', [V(23.4, 3.1, 16.2), V(27.6, 3.1, 16.2)], 0.05, 8);
  heavyBag(24.4, 16.2, 3.1, 'bagL1'); heavyBag(25.5, 16.2, 3.1, 'bagL2'); heavyBag(26.6, 16.2, 3.1, 'bagL3');
  dummy(29.9, 16.4);
  /* the course: boxes to jump up, bars to swing along, tyres to hop through */
  plyBox(22.72, 22.7, 0.5); plyBox(22.72, 21.3, 1.0); plyBox(22.72, 19.9, 1.5); plyBox(22.72, 18.5, 2.0);
  [18.1, 18.9].forEach(function (z) { [23.55, 27.1].forEach(function (x) { pipe('steelK', [V(x, 0, z), V(x, 2.6, z)], 0.04, 8); }); pipe('steelK', [V(23.55, 2.6, z), V(27.1, 2.6, z)], 0.035, 8); });
  for (i = 0; i < 9; i++) pipe('steelK', [V(23.9 + i * 0.36, 2.6, 18.1), V(23.9 + i * 0.36, 2.6, 18.9)], 0.02, 6);
  [[24.3, 22.3], [25.0, 21.5], [24.3, 20.7], [25.0, 19.9], [26.2, 21.0]].forEach(function (t, k) { tire(t[0], 0, t[1], k * 0.9); shadow(t[0], t[1], 0, 0.4); });
  /* a small cage to spar in */
  box('matK', V(30.2, 0.06, 20.4), 3.2, 0.12, 3.2, 0);
  chainFence(28.7, 18.9, 31.7, 18.9, 2.3, 0, 1); chainFence(31.7, 18.9, 31.7, 21.9, 2.3, -1, 0); chainFence(28.7, 21.9, 31.7, 21.9, 2.3, 0, -1); chainFence(28.7, 18.9, 28.7, 19.9, 2.3, 1, 0); chainFence(28.7, 20.9, 28.7, 21.9, 2.3, 1, 0);
  crate(V(24.0, 0, 23.3), 0.5, 0.3); drum(31.4, 23.2, 'drumB'); bag(31.3, 22.5, 0.8, 731);
  plates.push([TEX.scr[2], 1.25, 0.75, V(22.03, 1.9, 16.6), V(1, 0, 0), 0.05]); plates.push([TEX.hands[1], 1.7, 2.5, V(29.6, 1.55, 14.03), V(0, 0, 1)]);
  /* the low building after the yard, and the steel stair up its front to the roof */
  wallQ('brickD', 32, 24, 40, 24, 0, R, 0, 1); doorAt(33.7, 24, 0, 1, g); footShade(32, 24, 40, 24, 0, 1, g); wallLamp(group, L[12], 0, 1);
  var sx = 39.4, run = 6.4, rise = R - g, th = Math.atan2(rise, -run), SL = Math.hypot(run, rise);
  for (i = 0; i < 24; i++) box('grate', V(sx - run * (i + 0.5) / 24, g + rise * (i + 1) / 24, 24.5), 0.3, 0.03, 0.9, 0);
  [24.07, 24.93].forEach(function (z) { obox('steelK', xf(sx, g, z, 0, 0, th), SL / 2, -0.05, 0, SL, 0.16, 0.03); });
  pipe('steelK', [V(sx, g + 1.0, 24.93), V(sx - run, R + 1.0, 24.93), V(32.2, R + 1.0, 24.93), V(32.2, R + 1.0, 24.02)], 0.02, 6);
  for (i = 0; i <= 6; i++) pipe('steelK', [V(sx - run * i / 6, g + rise * i / 6, 24.93), V(sx - run * i / 6, g + rise * i / 6 + 1.0, 24.93)], 0.015, 5);
  [36.2, 34.2].forEach(function (x) { pipe('steelK', [V(x, g, 24.93), V(x, g + rise * (sx - x) / run - 0.1, 24.93)], 0.03, 6); });
  box('grate', V(32.6, R - 0.02, 24.5), 0.84, 0.04, 0.96, 0); pipe('steelK', [V(32.2, R, 24.93), V(32.2, R + 1.0, 24.93)], 0.015, 5); pipe('steelK', [V(32.3, R - 0.9, 24.02), V(32.9, R - 0.05, 24.9)], 0.02, 5);
  bag(38.9, 24.55, 0.85, 741, 'bagK', g); crate(V(37.6, g, 24.5), 0.5, 0.2);
  /* the roof: somewhere to sit above it all */
  quad('roofT', V(32, R, 14), V(40, R, 14), V(40, R, 24), V(32, R, 24), V(36, 0, 19));
  parapet(33.3, 23.88, 40, 23.88, R); parapet(32.12, 14, 32.12, 24, R); parapet(32, 14.12, 40, 14.12, R);
  [[34.2, 14.5], [39.7, 14.5], [39.7, 19.6], [34.2, 19.6]].forEach(function (p, k, all) { var n = all[(k + 1) % 4]; pipe('steelK', [V(p[0], R, p[1]), V(p[0], R + 2.5, p[1])], 0.03, 6); bulbString(group, V(p[0], R + 2.5, p[1]), V(n[0], R + 2.5, n[1]), 0.3, 8); });
  lampBulb(group, SAT.roofL, 0.06, L[11], 0xffe6b8); lampHalo(group, SAT.roofL, 1.4, L[11], 0xffc070);
  pallet(xf(37.4, R, 15.4, 0, 0, 0)); pallet(xf(37.4, R + 0.14, 15.4, 0, 0, 0)); pallet(xf(37.4, R + 0.8, 14.72, -1.3, 0, 0)); obox('cushK', xf(37.1, R + 0.28, 15.45, 0, 0.04, 0), 0, 0.06, 0, 0.56, 0.12, 0.86); obox('cushK', xf(37.7, R + 0.28, 15.43, 0, -0.05, 0), 0, 0.06, 0, 0.56, 0.12, 0.86);
  crate(V(37.5, R, 16.9), 0.45, 0.3); bottle(37.45, 16.85, R + 0.466); bottle(37.62, 16.98, R + 0.466); crate(V(35.6, R, 16.2), 0.5, 0.6); crate(V(39.0, R, 17.4), 0.5, -0.3);
  tire(35.2, R, 18.3, 0.2); tire(35.2, R + 0.21, 18.3, 1.0);
  lathe('woodS', V(33.5, R + 0.9, 15.6), [[0.0, 0], [0.85, 0], [0.9, 0.05], [0.9, 1.6], [0.98, 1.64], [0.0, 2.1]], 16);
  [[32.9, 15.0], [34.1, 15.0], [32.9, 16.2], [34.1, 16.2]].forEach(function (p) { pipe('steelK', [V(p[0], R, p[1]), V(p[0], R + 0.9, p[1])], 0.05, 6); });
  box('galv', V(38.9, R + 0.4, 21.6), 1.0, 0.8, 1.0, 0); box('grate', V(38.9, R + 0.81, 21.6), 0.8, 0.02, 0.8, 0);
  /* a lamp post, bulbs, steam */
  streetLamp(group, L[6], 30.0, 25.7); lightCone(group, V(SAT.post3.x, SAT.post3.y + 0.1, SAT.post3.z), 3.8, 6.4, 0xffc070, 0.24); decal('poolO', V(SAT.post3.x, 0.011, SAT.post3.z), 8, 6, 0);
  pipe('wire', sagPts(V(24, 9.0, 34), V(22, 9.6, 24), 0.9, 12), 0.012, 4); pipe('wire', sagPts(V(33, 8.2, 34), V(35, 6.7, 24), 0.8, 12), 0.012, 4);
  steam(group, 24.4, 28.6);
}

/* ---------------- who is out on the street ---------------- */
function townFighters(add) {
  add(V(-0.1, 0.12, 35.98), V(-0.1, 0, 30), 'stand', S1_LIGHTS, 0.5);                                                 /* the shopkeeper, behind the counter */
  add(V(12.5, 0, 31.2), V(12.8, 0, 33), 'stand', S1_LIGHTS);                                                       /* one looking over a booth */
  add(V(7.3, 0.12, 25.6), V(7.3, 2, 24), 'guard', S1_LIGHTS); add(V(9.7, 0, 26.8), V(9.2, 0, 24), 'stand', S1_LIGHTS);      /* two reading the wall of champions */
  add(V(-5.9, 0.12 + 0.54 - 0.26, 24.8), V(-5.9, 0, 30), 'perch', S1_LIGHTS, 0);                                   /* one on the stoop at the dead end */
  add(V(25.5, 0, 17.4), V(25.5, 0, 16.2), 'box', S2_LIGHTS);                                                       /* one working a heavy bag */
  add(V(23.2, 2.0 - 0.26, 18.5), V(27, 0, 18.5), 'perch', S2_LIGHTS, 0);                                           /* one on top of the highest box */
  add(V(30.2, 0.12, 20.4), V(28, 0, 20.4), 'guard', S2_LIGHTS);                                                    /* one in the cage */
  add(V(36.2, 0, 29.8), V(40, 0, 29), 'stand', S2_LIGHTS);                                                         /* one under the hoop */
  add(V(36.3, 6.66 - 0.26, 24.0), V(36.3, 0, 30), 'perch', S2_LIGHTS, 0); add(V(38.3, 6.66 - 0.26, 24.0), V(38.0, 0, 30), 'perch', S2_LIGHTS, 0);     /* two on the roof's edge */
  add(V(26.6, 0.12 + 0.54 - 0.26, 33.2), V(26.6, 0, 28), 'perch', S2_LIGHTS, 0);                                   /* one on the far stoop */
}

/* ---------------- what the street is made of, on top of the alley's ---------------- */
var alleyMats = streetMats;
streetMats = function () {
  function mat(o) { o.snap = false; return roomMat(o); }
  var m = alleyMats();
  m.fenceS = mat({ tex: TEX.linkS, tile: 0.11, two: true, blend: true, gloss: 0.2 });
  m.tarpB = mat({ tex: TEX.tarpT, color: 0x33435c, two: true, grime: 0.3 }); m.tarpR = mat({ tex: TEX.tarpT, color: 0x5e302a, two: true, grime: 0.3 }); m.tarpG = mat({ tex: TEX.tarpT, color: 0x3a4a3e, two: true, grime: 0.3 });
  m.bagL1 = mat({ tex: TEX.leatherT, color: 0x7a3a33, gloss: 0.25, shine: 14, two: true }); m.bagL2 = mat({ tex: TEX.leatherT, color: 0x3a3d43, gloss: 0.25, shine: 14, two: true }); m.bagL3 = mat({ tex: TEX.leatherT, color: 0x8f8676, gloss: 0.1, two: true });
  m.awnS = mat({ tex: TEX.awn, color: 0x33435c, two: true, grime: 0.4 }); m.shopW = mat({ color: 0x6f6a5f, two: true }); m.shopF = mat({ tex: TEX.woodS, tile: 1.2, color: 0x9a8f80 });
  m.itemA = mat({ color: 0x2f5fd0, two: true }); m.itemB = mat({ color: 0x8c3b30, two: true }); m.itemC = mat({ color: 0xcfc8b6, two: true });
  m.boardW = mat({ color: 0xb9b6ad, gloss: 0.2, grime: 0.5 }); m.rimO = mat({ color: 0xa8481c, two: true }); m.ballO = mat({ color: 0x8a4a22, grime: 0.3 });
  m.hydR = mat({ color: 0x7c2a22, gloss: 0.3, grime: 0.5 }); m.tar = mat({ color: 0x0c0c0e, gloss: 0.9, shine: 40 }); m.matK = mat({ color: 0x16171a, gloss: 0.15 });
  m.roofT = mat({ tex: TEX.roofT, tile: 2.4, gloss: 0.3, grime: 0.4 }); m.banana = mat({ color: 0xc19a22, gloss: 0.2, shine: 16 }); m.cushK = mat({ tex: TEX.tarpT, tile: 0.9, color: 0x3a4152, grime: 0.3 });
  return m;
};
