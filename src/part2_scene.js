/* ---------------- the room ---------------- */
function boxL(key, c, sx, sy, sz, ry, grainUp) {        /* a board: like box(), but the texture follows the board (along its length, or up it when grainUp is set) whichever way it is turned */
  var ca = Math.cos(ry || 0), sa = Math.sin(ry || 0), hx = sx / 2, hy = sy / 2, hz = sz / 2;
  function w(x, y, z) { return V(c.x + x * ca + z * sa, c.y + y, c.z - x * sa + z * ca); }
  function face(a, b, d, e, ua, va, ub, vb) { if (grainUp) quadUV(key, a, e, d, b, va, ua, vb, ub); else quadUV(key, a, b, d, e, ua, va, ub, vb); }
  face(w(-hx, hy, hz), w(hx, hy, hz), w(hx, hy, -hz), w(-hx, hy, -hz), -hx, hz, hx, -hz);            /* top */
  face(w(-hx, -hy, -hz), w(hx, -hy, -hz), w(hx, -hy, hz), w(-hx, -hy, hz), -hx, -hz, hx, hz);        /* bottom */
  face(w(-hx, -hy, hz), w(hx, -hy, hz), w(hx, hy, hz), w(-hx, hy, hz), -hx, -hy, hx, hy);            /* front */
  face(w(hx, -hy, -hz), w(-hx, -hy, -hz), w(-hx, hy, -hz), w(hx, hy, -hz), hx, -hy, -hx, hy);        /* back */
  face(w(hx, -hy, hz), w(hx, -hy, -hz), w(hx, hy, -hz), w(hx, hy, hz), hz, -hy, -hz, hy);            /* ends */
  face(w(-hx, -hy, -hz), w(-hx, -hy, hz), w(-hx, hy, hz), w(-hx, hy, -hz), -hz, -hy, hz, hy);
}

function buildRoom() {
  var k, i, w = WALL * T30;
  prism('floor', 'floor', hexPts(WALL + 0.4), -0.3, 0);
  for (k = 0; k < 6; k++) {
    var out = P(k, WALL + 5, 0, 3), ry = k * Math.PI / 3, cry = (30 + 60 * k) * D2R;
    if (k === 0 || k === 3) {                                                                                  /* the two walls with a walkout tunnel behind them have a real opening */
      var gaps = [[w - 1.6, w + 1.6, 0, 2.9]];
      if (k === 0 && CLUB.stairs) gaps.push([w - 6.9, w - 5.7, 1.8, 3.9], [w + 5.7, w + 6.9, 1.8, 3.9]);
      holedWall(P(k, WALL, -w, 0), P(k, WALL, w, 0), ROOF, 3.3, gaps, out, 'wallLow', 'wallUp');
      if (k === 0 && CLUB.stairs) [-6.3, 6.3].forEach(function (t) {
        [-0.66, 0.66].forEach(function (d) { box('steel', P(k, WALL - 0.04, t + d, 2.87), 0.1, 2.14, 0.1, ry); });
        box('steel', P(k, WALL - 0.04, t, 3.96), 1.42, 0.1, 0.1, ry);
      });
    } else {
      quad('wallLow', P(k, WALL, -w, 0), P(k, WALL, w, 0), P(k, WALL, w, 3.3), P(k, WALL, -w, 3.3), out);     /* old paint up to 3.3 m, bare block above */
      quad('wallUp', P(k, WALL, -w, 3.3), P(k, WALL, w, 3.3), P(k, WALL, w, ROOF), P(k, WALL, -w, ROOF), out);
    }
    tube('rust', P(k, WALL - 0.16, -w + 0.3, 4.3), P(k, WALL - 0.16, w - 0.3, 4.3), 0.06, 6);                 /* pipes run right round the room */
    tube('zinc', P(k, WALL - 0.13, -w + 0.3, 4.52), P(k, WALL - 0.13, w - 0.3, 4.52), 0.035, 5);
    for (i = -2; i <= 2; i++) box('steel', P(k, WALL - 0.09, i * 3.2 + 0.4, 4.4), 0.08, 0.42, 0.18, ry);
    var cp = polar(30 + 60 * k, WALL / C30 - 0.5, 0);                                                         /* a pier in each corner */
    box('column', V(cp.x, ROOF / 2, cp.z), 0.9, ROOF, 0.9, cry);
    var fc = polar(30 + 60 * k, 14.95, 0);                                                                    /* and a column standing clear of it, behind the last row */
    box('column', V(fc.x, ROOF / 2, fc.z), 0.7, ROOF, 0.7, cry);
    box('red', V(fc.x, 1.8 + 0.55, fc.z), 0.716, 1.1, 0.716, cry);
    box('column', V(fc.x, ROOF - 0.2, fc.z), 1.0, 0.4, 1.0, cry);
    shadow(fc.x, fc.z, 1.8, 0.75);
  }
  var roof = hexPts(WALL + 0.4).map(function (p) { return V(p[0], ROOF, p[1]); });
  for (i = 1; i < 5; i++) tri('slab', roof[0], roof[i], roof[i + 1], V(0, ROOF + 5, 0));
  [-9, -4.5, 0, 4.5, 9].forEach(function (z) { var half = WALL / C30 - Math.abs(z) * T30; box('beam', V(0, ROOF - 0.25, z), half * 2, 0.5, 0.45, 0); });
  box('zinc', V(-11.2, 6.28, 0), 0.8, 0.5, 17.4, 0);                                                          /* an air duct hung along one side */
  [-7.5, -3.75, 0, 3.75, 7.5].forEach(function (z) { box('steel', V(-11.2, 6.3, z), 0.86, 0.56, 0.06, 0); box('steel', V(-11.2, 6.8, z), 0.05, 0.5, 0.05, 0); });
  box('zinc', V(-10.6, 6.2, 2.2), 0.42, 0.32, 0.7, 0);
  tube('rust', V(-11, 6.5, -8.8), V(11, 6.5, -8.8), 0.085, 6);                                                /* pipes under the ceiling */
  tube('zinc', V(-10.9, 6.52, -9.08), V(10.9, 6.52, -9.08), 0.05, 5);
  tube('red', V(-10.8, 6.5, -9.34), V(10.8, 6.5, -9.34), 0.065, 6);
  [-8, -4, 0, 4, 8].forEach(function (x) { box('steel', V(x, 6.62, -9.07), 0.05, 0.16, 0.78, 0); });
  [1, 4].forEach(function (kk) { var c = polar(30 + 60 * kk, WALL / C30 - 1.08, 0); tube('rust', V(c.x, 4.3, c.z), V(c.x, ROOF, c.z), 0.06, 6); });

  /* walkout tunnel mouths: a striped frame and a roller shutter with gaps between its slats. In this preview one fighter is walking out */
  /* (shutter right up) and the other is still waiting behind theirs (shutter down).                                                   */
  [0, 3].forEach(function (kk) {
    var ry = kk * Math.PI / 3, j, slats = kk === 0 ? 3 : 19;
    [-1.68, 1.68].forEach(function (t) { box('hazard', P(kk, WALL - 0.1, t, 1.49), 0.2, 2.98, 0.2, ry); });
    box('hazard', P(kk, WALL - 0.1, 0, 3.06), 3.56, 0.16, 0.2, ry);
    for (j = 0; j < slats; j++) box('rust', P(kk, WALL - 0.07, 0, 2.84 - j * 0.15), 3.16, 0.13, 0.05 + (j % 2) * 0.02, ry);
    box('steel', P(kk, WALL - 0.07, 0, 2.92 - slats * 0.15), 3.16, 0.07, 0.09, ry);
    [-1.25, 1.25].forEach(function (t) { box(kk === 0 ? 'blue' : 'red', P(kk, (AP + 1.9 + WALL) / 2, t, 0.006), 0.1, 0.012, WALL - AP - 1.9, ry); });
    box('steel', P(kk, WALL - 0.1, 0, 3.3), 0.3, 0.12, 0.18, ry);                                             /* the caged lamp's fitting */
  });
}

/* ---------------- platform, steps, cage ---------------- */
function buildPlatform() {
  var k, i;
  prism('deck', 'ply', hexPts(AP), 0, PH);
  for (k = 0; k < 6; k++) {
    var ry = k * Math.PI / 3;
    box('hazard', P(k, AP + 0.01, 0, PH - 0.08), AP * T30 * 2 + 0.02, 0.16, 0.03, ry);
    for (i = -3; i <= 3; i++) box('ply', P(k, AP + 0.015, i * 1.2, PH / 2 - 0.08), 0.07, PH - 0.16, 0.03, ry);     /* battens holding the skirt boards */
    shade(P(k, AP, -AP * T30, 0.012), P(k, AP, AP * T30, 0.012), sideDir(k), 0.85);
  }
  [0, 3].forEach(function (kk) {
    var ry = kk * Math.PI / 3;
    for (i = 0; i < 5; i++) {
      var topY = PH - (i + 1) * PH / 6, a = AP + 0.16 + 0.32 * i;
      box('steel', P(kk, a, 0, topY / 2), 1.9, topY, 0.32, ry);
      box('hazard', P(kk, a + 0.125, 0, topY + 0.005), 1.9, 0.012, 0.07, ry);
    }
    [-1.0, 1.0].forEach(function (t) {
      tube('rust', P(kk, AP - 0.05, t, PH + 0.95), P(kk, AP + 1.62, t, 0.95 + PH / 6), 0.03, 5);
      tube('rust', P(kk, AP - 0.05, t, PH), P(kk, AP - 0.05, t, PH + 0.95), 0.03, 5);
      tube('rust', P(kk, AP + 1.62, t, 0), P(kk, AP + 1.62, t, 0.95 + PH / 6), 0.03, 5);
    });
  });
  var bell = P(0, AP - 0.4, 1.55, PH), bc = P(0, AP - 0.4, 1.25, PH);                                        /* the bell, by the blue gate for now */
  tube('rust', bell, V(bell.x, PH + 1.5, bell.z), 0.035, 5);
  tube('rust', V(bell.x, PH + 1.5, bell.z), V(bc.x, PH + 1.5, bc.z), 0.028, 5);
  cyl('brass', V(bc.x, PH + 1.4, bc.z), 0.05, 0.075, 8); cyl('brass', V(bc.x, PH + 1.31, bc.z), 0.09, 0.09, 8);
  cyl('brass', V(bc.x, PH + 1.235, bc.z), 0.12, 0.075, 8); cyl('brass', V(bc.x, PH + 1.21, bc.z), 0.142, 0.025, 8);
  cyl('steel', V(bc.x, PH + 1.16, bc.z), 0.028, 0.05, 5);
  shadow(bell.x, bell.z, PH, 0.3);
}

function buildCage(group) {
  var W = A * T30, top = PH + CH, Wi = (A - IN) * T30, slope = Math.hypot(IN, UP), k;
  var fenceMat = roomMat({ tex: TEX.fence, tile: 0.56, two: true, blend: true });
  for (k = 0; k < 6; k++) {
    var ry = k * Math.PI / 3, cry = (30 + 60 * k) * D2R, c0 = P(k, A, W, 0);
    box('rust', V(c0.x, PH + CH / 2, c0.z), 0.2, CH, 0.2, cry);                                               /* corner post and its padding */
    box('vinyl', V(c0.x, PH + 1.1, c0.z), 0.38, 2.2, 0.38, cry);
    if (k === 1) box('tape', V(c0.x, PH + 1.52, c0.z), 0.39, 0.09, 0.39, cry);
    if (k === 4) { box('tape', V(c0.x, PH + 0.7, c0.z), 0.39, 0.09, 0.39, cry); box('tape', V(c0.x, PH + 0.86, c0.z), 0.39, 0.06, 0.39, cry); }
    shadow(c0.x, c0.z, PH, 0.42);
    (function (k) {
      [0.07, 2.0, CH].forEach(function (y, n) { tube('rust', P(k, A, -W, PH + y), P(k, A, W, PH + y), n === 2 ? 0.05 : 0.04, 6); });
      [-W / 3, W / 3].forEach(function (t) { tube('rust', P(k, A, t, PH), P(k, A, t, top), 0.035, 6); });
      [-W, -W / 3, W / 3].forEach(function (t) { tube('rust', P(k, A, t, top), P(k, A - IN, t * Wi / W, top + UP), 0.03, 5); });
    })(k);
    tube('blue', P(k, A - IN, -Wi, top + UP), P(k, A - IN, Wi, top + UP), 0.075, 6);                          /* the lip of the overhang */

    /* the chain-link itself: one sheet for the wall, one for the overhang. Each side is its own mesh so the far sides are drawn before the near ones. */
    var c = P(k, A, 0, PH + CH / 2), pos = [], nrm = [], uv = [];
    var q = [[P(k, A, -W, PH), P(k, A, W, PH), P(k, A, W, top), P(k, A, -W, top), [-W, 0, W, 0, W, CH, -W, CH]],
      [P(k, A, -W, top), P(k, A, W, top), P(k, A - IN, Wi, top + UP), P(k, A - IN, -Wi, top + UP), [-W, CH, W, CH, Wi, CH + slope, -Wi, CH + slope]]];
    q.forEach(function (f) {
      _e1.subVectors(f[1], f[0]); _e2.subVectors(f[3], f[0]); _nn.crossVectors(_e1, _e2).normalize();
      [0, 1, 2, 0, 2, 3].forEach(function (i) { pos.push(f[i].x - c.x, f[i].y - c.y, f[i].z - c.z); nrm.push(_nn.x, _nn.y, _nn.z); uv.push(f[4][i * 2], f[4][i * 2 + 1]); });
    });
    var g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(new Float32Array(pos), 3)); g.setAttribute('normal', new T.BufferAttribute(new Float32Array(nrm), 3)); g.setAttribute('uv', new T.BufferAttribute(new Float32Array(uv), 2));
    var m = new T.Mesh(g, fenceMat); m.position.copy(c); m.renderOrder = 2; group.add(m);

    if (k === 0 || k === 3) {                                                                                 /* a gate: painted frame, a welded door with a brace and a bolt */
      var col = k === 0 ? 'blue' : 'red', ad = A + 0.06;
      [-0.74, 0.74].forEach(function (t) { box(col, P(k, A, t, PH + 1.17), 0.11, 2.34, 0.11, ry); });
      box(col, P(k, A, 0, PH + 2.34), 1.59, 0.11, 0.11, ry);
      [-0.64, 0.64].forEach(function (t) { tube('rust', P(k, ad, t, PH + 0.1), P(k, ad, t, PH + 2.22), 0.03, 5); });
      [0.1, 1.16, 2.22].forEach(function (y) { tube('rust', P(k, ad, -0.64, PH + y), P(k, ad, 0.64, PH + y), 0.03, 5); });
      tube('rust', P(k, ad, -0.64, PH + 0.1), P(k, ad, 0.64, PH + 1.16), 0.022, 4);
      box('steel', P(k, ad + 0.03, 0.5, PH + 1.16), 0.2, 0.12, 0.05, ry);
      box('steel', P(k, ad + 0.05, 0.66, PH + 1.16), 0.16, 0.04, 0.04, ry);
    }
  }
}

/* ---------------- stands ---------------- */
function buildStands() {
  for (var k = 0; k < 6; k++) (function (k) {
    var ry = k * Math.PI / 3, split = (k === 0 || k === 3), inw = sideDir(k).negate();
    ROWS.forEach(function (rw, n) {
      var a0 = rw[0], a1 = rw[1], h = rw[2];
      function piece(t0a, t1a, t0b, t1b) {              /* along-the-side limits at the inner and outer edge */
        var q = [P(k, a0, t0a, 0), P(k, a0, t1a, 0), P(k, a1, t1b, 0), P(k, a1, t0b, 0)].map(function (p) { return [p.x, p.z]; });
        prism('tier', 'tier', q, 0, h);
        if (n < 3) box('yellow', P(k, a0 + 0.05, (t0a + t1a) / 2, h + 0.004), t1a - t0a, 0.008, 0.08, ry);           /* a worn painted line on the edge of each step */
        if (n === 0) shade(P(k, a0, t0a, 0.012), P(k, a0, t1a, 0.012), inw, 0.55);
        if (n < 2) shade(P(k, a1, t0b, h + 0.012), P(k, a1, t1b, h + 0.012), inw, 0.4);                              /* shade at the foot of the next step up */
        if (n === 3) {
          shade(P(k, WALL, t0b, h + 0.012), P(k, WALL, t1b, h + 0.012), inw, 0.8);
          shade(P(k, WALL - 0.016, t0b, h), P(k, WALL - 0.016, t1b, h), V(0, 1, 0), 1.0);                            /* grime up the foot of the wall */
        }
      }
      if (split) { piece(-a0 * T30, -1.6, -a1 * T30, -1.6); piece(1.6, a0 * T30, 1.6, a1 * T30); }
      else piece(-a0 * T30, a0 * T30, -a1 * T30, a1 * T30);
    });
    var ar = 12.58, tw = ar * T30 - 0.25;                                                                           /* a pipe rail along the front of the top walkway */
    (split ? [[-tw, -1.75], [1.75, tw]] : [[-tw, tw]]).forEach(function (sg) {
      var n = Math.max(1, Math.round((sg[1] - sg[0]) / 2.4));
      for (var i = 0; i <= n; i++) { var t = sg[0] + (sg[1] - sg[0]) * i / n; tube('rust', P(k, ar, t, 1.8), P(k, ar, t, 2.86), 0.03, 5); }
      tube('rust', P(k, ar, sg[0], 2.86), P(k, ar, sg[1], 2.86), 0.032, 5);
      tube('rust', P(k, ar, sg[0], 2.36), P(k, ar, sg[1], 2.36), 0.022, 5);
    });
  })(k);
}

/* ---------------- things inside the ring ---------------- */
/* Laid out so the ring looks the same from either gate: whatever is on blue's right is on red's right too. The middle stays clear. */
function buildObstacles(group, plates) {
  var r = rand(2024), y0 = PH + 0.006;
  function stack(c, n) { for (var i = 0; i < n; i++) tyre(V(c.x + (r() - 0.5) * 0.09, c.y + i * 0.3, c.z + (r() - 0.5) * 0.09), r() * 6.283); shadow(c.x, c.z, c.y, 0.82); }

  [30, 210].forEach(function (deg, n) {                 /* concrete pillars, 3 m tall, broken off at the top */
    var c = polar(deg, 3.6, 0), ry = deg * D2R, dir = polar(deg, 1, 0), tan = V(Math.cos(ry), 0, -Math.sin(ry));
    box('pillar', V(c.x, PH + 0.07, c.z), 1.02, 0.14, 1.02, ry);
    box('pillar', V(c.x, PH + 1.59, c.z), 0.76, 2.9, 0.76, ry);
    box('hazard', V(c.x, PH + 0.42, c.z), 0.776, 0.56, 0.776, ry);
    box('pillar', V(c.x + tan.x * 0.12, PH + 3.12, c.z + tan.z * 0.12), 0.5, 0.17, 0.62, ry);
    [[-0.2, 0.18, 0.36, 0.1], [0.24, -0.2, 0.3, -0.12], [0.05, 0.22, 0.44, 0.04]].forEach(function (b) {
      var p = V(c.x + tan.x * b[0] + dir.x * b[1], PH + 3.0, c.z + tan.z * b[0] + dir.z * b[1]);
      tube('rust', p, V(p.x + b[3], p.y + b[2], p.z + b[3] * 0.6), 0.016, 4);
    });
    shadow(c.x, c.z, y0, 1.0);
  });

  [90, 270].forEach(function (deg, n) {                 /* a rough wall of mismatched boards, propped up from behind */
    var c = polar(deg, 3.6, 0), ry = deg * D2R, dir = polar(deg, 1, 0), tan = V(Math.cos(ry), 0, -Math.sin(ry));
    var hs = [1.85, 1.7, 1.96, 1.8, 1.58, 1.9, 1.76, 1.95, 1.66], i;
    for (i = 0; i < 9; i++) {
      var h = hs[n ? 8 - i : i], off = (i - 4) * 0.29;
      boxL(i % 3 === 1 ? 'woodLight' : 'woodV', V(c.x + tan.x * off, PH + h / 2, c.z + tan.z * off), 0.27, h, 0.045, ry, true);
    }
    [0.45, 1.36].forEach(function (yy) { boxL('wood', V(c.x + dir.x * 0.045, PH + yy, c.z + dir.z * 0.045), 2.62, 0.12, 0.045, ry); });
    [-0.9, 0.9].forEach(function (t) {
      tube('wood', V(c.x + tan.x * t + dir.x * 0.08, PH + 1.36, c.z + tan.z * t + dir.z * 0.08), V(c.x + tan.x * t + dir.x * 0.95, PH + 0.03, c.z + tan.z * t + dir.z * 0.95), 0.04, 4);
      box('wood', V(c.x + tan.x * t + dir.x * 0.95, PH + 0.04, c.z + tan.z * t + dir.z * 0.95), 0.2, 0.06, 0.3, ry);
    });
    var e0 = V(c.x - tan.x * 1.32, y0 + 0.006, c.z - tan.z * 1.32), e1 = V(c.x + tan.x * 1.32, y0 + 0.006, c.z + tan.z * 1.32);
    shade(e0, e1, dir, 0.7); shade(e0, e1, dir.clone().negate(), 0.5);
    plates.push([n ? TEX.tally : TEX.cross, n ? 0.9 : 0.85, n ? 0.45 : 0.85, V(c.x - dir.x * 0.03, PH + (n ? 1.25 : 1.05), c.z - dir.z * 0.03), dir.clone().negate()]);
  });

  [150, 330].forEach(function (deg) {                   /* tyre stacks: these are the bouncy ones */
    var c = polar(deg, 3.6, y0), ry = deg * D2R, dir = polar(deg, 1, 0), tan = V(Math.cos(ry), 0, -Math.sin(ry));
    stack(V(c.x - tan.x * 0.53, y0, c.z - tan.z * 0.53), 4);
    stack(V(c.x + tan.x * 0.53, y0, c.z + tan.z * 0.53), 3);
    stack(V(c.x + dir.x * 0.9, y0, c.z + dir.z * 0.9), 2);
  });

  function ledge(k, h) {                                /* boards on brackets, bolted to the cage and hung on chains from the top rail */
    var ry = k * Math.PI / 3, y = PH + h, i;
    for (i = 0; i < 3; i++) boxL(i === 1 ? 'woodLight' : 'wood', P(k, A - 0.16 - i * 0.24, (i - 1) * 0.05, y), 2.4 - (i === 1 ? 0.12 : 0), 0.05, 0.22, ry);
    [-0.85, 0.85].forEach(function (t) {
      tube('rust', P(k, A - 0.02, t, y - 0.05), P(k, A - 0.74, t, y - 0.05), 0.028, 4);
      tube('rust', P(k, A - 0.02, t, y - 0.62), P(k, A - 0.66, t, y - 0.07), 0.022, 4);
    });
    [-1.12, 1.12].forEach(function (t) { tube('steel', P(k, A - 0.7, t, y + 0.02), P(k, A - 0.04, t * 1.02, PH + CH - 0.03), 0.014, 4); });
    var c = P(k, A - 0.4, 0, y0); shadow(c.x, c.z, y0, 1.35, 0.7, ry);
  }
  ledge(1, 2.5); ledge(4, 2.5); ledge(2, 1.5); ledge(5, 1.5);          /* the high pair leaves headroom under the overhang */
}

/* ---------------- loose things around the room ---------------- */
function buildProps() {
  var r = rand(77);
  function drum(key, c) { cyl(key, c, 0.29, 0.88, 10, 'steel'); [0.0, 0.29, 0.58, 0.85].forEach(function (y) { cyl(key, V(c.x, c.y + y, c.z), 0.305, 0.03, 10); }); shadow(c.x, c.z, c.y, 0.56); }
  function crate(c, s, ry) { box('crate', V(c.x, c.y + s / 2, c.z), s, s, s, ry); if (c.y < 0.5 || Math.abs(c.y - 1.8) < 0.01) shadow(c.x, c.z, c.y, s * 0.95); }
  function stack(c, n) { for (var i = 0; i < n; i++) tyre(V(c.x + (r() - 0.5) * 0.09, c.y + i * 0.3, c.z + (r() - 0.5) * 0.09), r() * 6.283); shadow(c.x, c.z, c.y, 0.8); }
  drum('blue', P(1, 8.45, 2.9, 0)); drum('rust', P(1, 8.5, 3.6, 0)); drum('red', P(4, 8.5, -3.1, 0));
  drum('rust', P(2, 13.3, 5.6, 1.8)); drum('blue', P(5, 13.4, -5.2, 1.8)); drum('rust', P(0, 13.4, 2.7, 1.8)); drum('red', P(3, 13.4, -2.6, 1.8));
  crate(P(5, 8.5, -2.4, 0), 0.8, 0.3); crate(P(5, 8.52, -2.36, 0.8), 0.58, 0.9); crate(P(2, 8.55, 2.7, 0), 0.7, 1.2); crate(P(4, 13.3, 4.6, 1.8), 0.8, 0.5);
  stack(P(1, 8.5, -3.0, 0), 3); stack(P(4, 8.5, 2.6, 0), 2);
}

/* ---------------- stains, drips, damp ---------------- */
function buildDecals() {
  var r = rand(404), i, k, j;
  for (i = 0; i < 16; i++) { k = Math.floor(r() * 6); var s = 1.2 + r() * 1.5, p = P(k, 7.8 + r() * 1.05, (r() - 0.5) * 7.2, 0.013); decal(r() < 0.5 ? 'stain1' : 'stain2', p, s, s * (0.7 + r() * 0.5), r() * 6.283); }
  for (i = 0; i < 9; i++) { k = Math.floor(r() * 6); var s2 = 1.0 + r() * 1.3, t = (r() - 0.5) * 10; if ((k === 0 || k === 3) && Math.abs(t) < 2.6) t = 3.4; decal(r() < 0.5 ? 'stain1' : 'stain2', P(k, 13.05 + r() * 0.75, t, 1.813), s2, s2, r() * 6.283); }
  for (i = 0; i < 7; i++) { k = Math.floor(r() * 6); var s3 = 0.6 + r() * 0.6; decal(r() < 0.5 ? 'stain1' : 'stain2', P(k, 6.5 + r() * 0.42, (r() - 0.5) * 6, PH + 0.013), s3, s3, r() * 6.283); }
  for (k = 0; k < 6; k++) for (j = 0; j < 3; j++) {
    var tt = (r() - 0.5) * 13, wd = 0.7 + r() * 0.5, lo = 2.2 + r() * 0.8; if ((k === 0 || k === 3) && Math.abs(tt) < 2.4) tt = 4.5;
    quadUV(r() < 0.55 ? 'drip' : 'rustDrip', P(k, WALL - 0.018, tt - wd / 2, lo), P(k, WALL - 0.018, tt + wd / 2, lo), P(k, WALL - 0.018, tt + wd / 2, 4.26), P(k, WALL - 0.018, tt - wd / 2, 4.26), 0, 0, 1, 1);
  }
  [1, 2, 4, 5].forEach(function (kk) {                  /* rust running down the skirt boards */
    [-2.9, 2.6].forEach(function (t) { quadUV('rustDrip', P(kk, AP + 0.032, t - 0.3, 0.25), P(kk, AP + 0.032, t + 0.3, 0.25), P(kk, AP + 0.032, t + 0.3, PH - 0.16), P(kk, AP + 0.032, t - 0.3, PH - 0.16), 0, 0, 1, 1); });
  });
}

/* ---------------- lamps you can see ---------------- */
var GLOW = null;
function glowTex() {                                    /* the soft glow drawn round every lamp */
  if (GLOW) return GLOW;
  var gc = document.createElement('canvas'); gc.width = 128; gc.height = 128; var g = gc.getContext('2d');
  var gr = g.createRadialGradient(64, 64, 4, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,0.55)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.16)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  GLOW = new T.CanvasTexture(gc); return GLOW;
}
function lampHalo(group, p, size, L, colour) {
  var s = new T.Sprite(new T.SpriteMaterial({ map: glowTex(), color: colour === undefined ? 0xffdca8 : colour, blending: T.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.9 }));
  s.position.copy(p); s.scale.set(size, size, 1); s.renderOrder = 3; group.add(s); if (L) L.halo = s;
}
function lampBulb(group, p, r, L, colour) {
  var m = new T.Mesh(new T.SphereGeometry(r, 6, 5), new T.MeshBasicMaterial({ color: colour === undefined ? 0xffe2a8 : colour })); m.position.copy(p); group.add(m); if (L) L.bulb = m;
}
function buildLamps(group) {
  var inside = new T.MeshBasicMaterial({ color: 0xf2c57c, side: T.DoubleSide });
  function halo(p, size, L) { lampHalo(group, p, size, L); }
  function bulb(p, r, L) { lampBulb(group, p, r, L); }
  LAMPS.forEach(function (L) {
    var p = L.pos;
    if (L.kind === 'pendant') {                          /* an enamel shade on a cord */
      tube('cord', V(p.x, ROOF - (Math.abs(p.z) < 0.5 ? 0.5 : 0), p.z), V(p.x, p.y + 0.42, p.z), 0.012, 4);
      cone('green', V(p.x, p.y + 0.08, p.z), 0.46, 0.09, 0.3, 10);
      cyl('steel', V(p.x, p.y + 0.36, p.z), 0.07, 0.08, 6);
      var d = new T.Mesh(new T.CircleGeometry(0.43, 10), inside); d.rotation.x = Math.PI / 2; d.position.set(p.x, p.y + 0.11, p.z); group.add(d);
      bulb(V(p.x, p.y + 0.09, p.z), 0.075, L); halo(V(p.x, p.y + 0.04, p.z), 2.1, L);
    } else if (L.kind === 'bulb') {                      /* a bare bulb */
      tube('cord', V(p.x, ROOF, p.z), V(p.x, p.y + 0.14, p.z), 0.01, 4);
      cyl('steel', V(p.x, p.y + 0.05, p.z), 0.03, 0.09, 5);
      bulb(p, 0.06, L); halo(p, 1.5, L);
    } else if (L.kind === 'cage') {
      var k = p.z > 0 ? 0 : 3, q = P(k, WALL - 0.24, 0, 3.22);
      bulb(q, 0.07, L); halo(q, 1.5, L);
    }
  });
}

/* ---------------- flat painted things: the mat, wall paint, signs, the scoreboards ---------------- */
function plate(group, tex, w, h, pos, facing, glow) {
  if (!tex) return null;                                  /* that sign could not be made: leave the wall bare */
  var m = new T.Mesh(new T.PlaneGeometry(w, h), roomMat({ tex: tex, two: true, cut: true, snap: false, offset: true, glow: glow || 0 }));
  m.position.copy(pos); m.lookAt(pos.clone().add(facing)); group.add(m); return m;
}
function buildPainted(group, plates) {
  var mat = new T.Mesh(new T.CircleGeometry(A / C30, 6), roomMat({ tex: TEX.mat }));
  mat.rotation.x = -Math.PI / 2; mat.position.y = PH + 0.006; group.add(mat);

  plate(group, TEX.wallLogo, 6.4, 2.13, P(1, WALL - 0.03, 0.8, 3.0), sideDir(1).negate());
  plate(group, TEX.wallLogo, 6.4, 2.13, P(4, WALL - 0.03, -0.8, 3.0), sideDir(4).negate());
  plate(group, TEX.rules, 2.24, 1.4, P(2, WALL - 0.04, -4.4, 3.05), sideDir(2).negate());
  plate(group, TEX.tag, 2.2, 1.65, P(5, WALL - 0.03, 4.3, 3.15), sideDir(5).negate());
  plate(group, TEX.ko, 1.15, 0.86, P(5, WALL - 0.03, 2.5, 2.85), sideDir(5).negate());
  plate(group, TEX.tag, 1.8, 1.35, P(2, WALL - 0.03, 3.9, 3.2), sideDir(2).negate());
  [0, 3].forEach(function (k) { plate(group, TEX.only, 3.2, 0.6, P(k, WALL - 0.03, 0, 3.86), sideDir(k).negate()); });
  [1, 2, 4, 5].forEach(function (k) { plate(group, TEX.skirtLogo, 3.6, 0.75, P(k, AP + 0.034, 0, PH / 2 - 0.06), sideDir(k)); });
  for (var k = 0; k < 6; k++) {
    var fc = polar(30 + 60 * k, 14.95, 0), dir = polar(30 + 60 * k, 1, 0);
    plate(group, TEX.num && TEX.num[k], 0.5, 0.75, V(fc.x - dir.x * 0.365, 1.8 + 1.75, fc.z - dir.z * 0.365), dir.clone().negate());
    if (k === 2) plate(group, TEX.tally, 0.56, 0.28, V(fc.x - dir.x * 0.365, 1.8 + 0.8, fc.z - dir.z * 0.365), dir.clone().negate());
  }
  plates.forEach(function (p) { plate(group, p[0], p[1], p[2], p[3], p[4]); });

  /* scoreboards: old tube TVs on chains outside the cage, tipped down at the crowd. Fighters only ever see the backs. */
  var caseMat = roomMat({ tex: TEX.steel, tile: 0.8, color: 0x8c8c8c }), screen = new T.MeshBasicMaterial(TEX.crt ? { map: TEX.crt } : { color: 0x16212b }), bezel = new T.MeshBasicMaterial({ color: 0x0b0b0c });
  for (k = 0; k < 6; k++) {
    var c = P(k, A + 1.05, 0, 5.8), out = sideDir(k), f = V(out.x, -0.5, out.z).normalize(), tan = sideTan(k);
    var body = new T.Mesh(new T.BoxGeometry(1.0, 0.8, 0.72), caseMat); body.position.copy(c); body.lookAt(c.clone().add(f)); group.add(body);
    var bz = new T.Mesh(new T.PlaneGeometry(0.92, 0.72), bezel); bz.position.copy(c).addScaledVector(f, 0.362); bz.lookAt(bz.position.clone().add(f)); group.add(bz);
    var sc = new T.Mesh(new T.PlaneGeometry(0.82, 0.615), screen); sc.position.copy(c).addScaledVector(f, 0.366); sc.lookAt(sc.position.clone().add(f)); group.add(sc);
    [-0.4, 0.4].forEach(function (t) { tube('steel', V(c.x + tan.x * t, c.y + 0.3, c.z + tan.z * t), V(c.x + tan.x * t, ROOF, c.z + tan.z * t), 0.014, 4); });
  }
}

/* ---------------- the whole arena in one go ---------------- */
function arenaFighters() {                              /* where each gorilla is, which way it faces, what it is doing, the shadow under it */
  var centre = V(0, PH, 0), a, list = [];
  var perch = P(4, A - 0.52, 0, PH + 2.5 + 0.025 - 0.26), onMat = V(-1.0, PH, -0.4);
  list.push({ pos: onMat, yaw: facing(onMat, perch), pose: 'guard', shadow: 0.62, least: 0.66 });                    /* on the mat, watching the one above */
  list.push({ pos: perch, yaw: facing(perch, onMat), pose: 'perch', shadow: 0, least: 0.66 });                       /* up on a ledge, about to drop */
  a = P(1, A + 0.55, -0.9, PH); list.push({ pos: a, yaw: facing(a, centre), pose: 'cage', shadow: 0.55 });           /* at the fence, hands on it */
  a = P(4, A + 0.7, -1.7, PH); list.push({ pos: a, yaw: facing(a, centre), pose: 'stand', shadow: 0.55 });
  a = P(5, 9.75, 3.6, 0.7); list.push({ pos: a, yaw: facing(a, centre), pose: 'stand', shadow: 0.55 });              /* front row */
  a = P(1, 10.85, 2.2, 1.25); list.push({ pos: a, yaw: facing(a, centre), pose: 'stand', shadow: 0.55 });
  a = P(2, 12.0, -0.9, 1.8); list.push({ pos: a, yaw: facing(a, centre), pose: 'stand', shadow: 0.55 });             /* back row */
  return list;
}
function buildArena(world, step, extraPlates) {         /* builds the whole arena and returns its gorillas. extraPlates: more signs to hang, from a room that joins on */
  var plates = extraPlates || [], list = [];
  useLights(ARENA_LIGHTS);
  step('room', buildRoom); step('platform', buildPlatform); step('cage', function () { buildCage(world); }); step('stands', buildStands);
  step('obstacles', function () { buildObstacles(world, plates); }); step('props', buildProps); step('stains', buildDecals);
  step('lamps', function () { buildLamps(world); }); step('signs', function () { buildPainted(world, plates); });
  step('barriers', buildBarriers);
  step('shadows', function () { list = arenaFighters(); list.forEach(function (s) { if (s.shadow) shadow(s.pos.x, s.pos.z, s.pos.y + (s.pos.y === PH ? 0.006 : 0), s.shadow); }); });
  finalize(world);
  walkLights();                                          /* the tunnels have lamps of their own, so the arena's never leak into them */
  useLights(WALK_LIGHTS); step('walkout tunnels', function () { buildWalkouts(world); }); finalize(world); useLights(ARENA_LIGHTS);
  list.forEach(function (s) { s.set = ARENA_LIGHTS; });
  return list;
}

/* ---------------- the walkout: two tunnels, and a clear path from each to the cage ---------------- */
function buildWalkouts(group) {
  var n = 12, seg = 12, step = WALK.len / n;
  [0, 3].forEach(function (k) {
    var i, j, ry = k * Math.PI / 3;
    function pt(d, t, y) { return P(k, WALL + d, t, walkY(d) + y); }
    function arch(j) { var a = Math.PI * j / seg; return [-WALK.r * Math.cos(a), WALK.wall + WALK.r * Math.sin(a)]; }
    for (i = 0; i < n; i++) {
      var d0 = i === 0 ? 0.02 : i * step, d1 = (i + 1) * step, dm = (d0 + d1) / 2;
      quad('floor', pt(d0, -1.6, 0), pt(d0, 1.6, 0), pt(d1, 1.6, 0), pt(d1, -1.6, 0), pt(dm, 0, -5));
      [-1, 1].forEach(function (s) {
        quad('tier', pt(d0, s * 1.6, 0), pt(d1, s * 1.6, 0), pt(d1, s * 1.6, WALK.wall), pt(d0, s * 1.6, WALK.wall), pt(dm, s * 7, 1));
        quadUV(k === 0 ? 'blue' : 'red', pt(d0, s * 1.25 - 0.05, 0.006), pt(d0, s * 1.25 + 0.05, 0.006), pt(d1, s * 1.25 + 0.05, 0.006), pt(d1, s * 1.25 - 0.05, 0.006), 0, d0, 0.125, d1);      /* the painted lines carry on down the tunnel */
      });
      for (j = 0; j < seg; j++) {
        var p0 = arch(j), p1 = arch(j + 1), mt = (p0[0] + p1[0]) / 2, my = (p0[1] + p1[1]) / 2 - WALK.wall;
        quad('tier', pt(d0, p0[0], p0[1]), pt(d1, p0[0], p0[1]), pt(d1, p1[0], p1[1]), pt(d0, p1[0], p1[1]), pt(dm, mt * 5, WALK.wall + my * 5));
      }
    }
    for (j = 0; j < seg; j++) {                           /* at the mouth, the wall between the square opening and the arch */
      var q0 = arch(j), q1 = arch(j + 1);
      quad('slab', pt(0.02, q0[0], q0[1]), pt(0.02, q1[0], q1[1]), pt(0.02, q1[0], 2.95), pt(0.02, q0[0], 2.95), pt(5, 0, 1));
    }
    /* the far end: a blank wall with the steel door the fighter comes in by */
    quad('tier', pt(WALK.len, -1.6, 0), pt(WALK.len, 1.6, 0), pt(WALK.len, 1.6, 3.0), pt(WALK.len, -1.6, 3.0), pt(WALK.len + 5, 0, 1));
    box('rust', P(k, WALL + WALK.len - 0.04, 0, walkY(WALK.len) + 1.08), 1.3, 2.16, 0.07, ry);
    box('steel', P(k, WALL + WALK.len - 0.09, 0.45, walkY(WALK.len) + 1.05), 0.06, 0.22, 0.05, ry);
    WALK_LIGHTS.lamps.forEach(function (L) {              /* the wall lamps: a small steel fitting and a caged bulb */
      if (L.kind !== 'wall' || (L.pos.z > 0 ? 0 : 3) !== k) return;
      var side = sideTan(k).dot(L.pos) > 0 ? 1 : -1, q = L.pos.clone().addScaledVector(sideTan(k), side * 0.2);
      box('steel', q, 0.26, 0.2, 0.12, ry + Math.PI / 2);
      lampBulb(group, L.pos.clone().addScaledVector(sideTan(k), side * 0.08), 0.05, L); lampHalo(group, L.pos, 1.0, L);
    });
  });
}
/* A steel bar barrier, the kind that holds a crowd back: two rails, upright bars, flat feet. p0 and p1 are its ends, on the ground. */
function barrier(p0, p1) {
  var d = p1.clone().sub(p0), len = d.length(), u = d.clone().multiplyScalar(1 / len), side = V(-u.z, 0, u.x), n = Math.max(4, Math.round(len / 0.15)), i;
  function at(s, y) { return V(p0.x + u.x * s, p0.y + y, p0.z + u.z * s); }
  tube('zinc', at(0, 1.08), at(len, 1.08), 0.024, 6); tube('zinc', at(0, 0.18), at(len, 0.18), 0.02, 6);
  tube('zinc', at(0, 0.02), at(0, 1.08), 0.024, 6); tube('zinc', at(len, 0.02), at(len, 1.08), 0.024, 6);
  for (i = 1; i < n; i++) tube('steel', at(len * i / n, 0.18), at(len * i / n, 1.08), 0.011, 4);
  [0.12, len - 0.12].forEach(function (s) { var c = at(s, 0.015); box('steel', c, 0.07, 0.03, 0.62, Math.atan2(-u.z, u.x)); });
}
function buildBarriers() {
  [0, 3].forEach(function (k) {
    [-1, 1].forEach(function (s) {
      barrier(P(k, 9.16, s * 1.62, 0), P(k, AP + 0.08, s * 1.62, 0));                                        /* across the floor between the stands and the platform */
      barrier(P(k, AP - 0.06, s * 1.22, PH), P(k, A + 0.16, s * 1.22, PH));                                  /* across the walkway round the cage */
      ROWS.forEach(function (rw) { barrier(P(k, rw[0] + 0.07, s * 1.69, rw[2]), P(k, rw[1] - 0.07, s * 1.69, rw[2])); });      /* along the edge of each row of the stands, over the path */
    });
  });
}

/* ---------------- turn the gathered pieces into meshes ---------------- */
function finalize(group, extra) {                        /* extra: a function giving more materials, for a room with its own surfaces */
  function flat(tex) { return new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: T.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }); }
  var M = {
    floor: roomMat({ tex: TEX.floor, tile: 3.2 }), tier: roomMat({ tex: TEX.tier, tile: 1.6 }), slab: roomMat({ tex: TEX.slab, tile: 1.6 }),
    beam: roomMat({ tex: TEX.tier, tile: 1.6, color: 0x9c9c9c }), column: roomMat({ tex: TEX.tier, tile: 1.6, color: 0xd0d0d0 }), pillar: roomMat({ tex: TEX.tier, tile: 1.6 }),
    wallUp: roomMat({ tex: TEX.block, tile: 1.6 }), wallLow: roomMat({ tex: TEX.blockPaint, tile: 1.6 }),
    deck: roomMat({ tex: TEX.deck, tile: 1.6 }), ply: roomMat({ tex: TEX.plyDark, tile: 1.6 }), crate: roomMat({ tex: TEX.crate, tile: 0.8 }),
    wood: roomMat({ tex: TEX.grain, tile: 1.6, two: true }), woodV: roomMat({ tex: TEX.grain, tile: 1.6, two: true }), woodLight: roomMat({ tex: TEX.ply, tile: 1.6, two: true }),
    rust: roomMat({ tex: TEX.rust, tile: 0.8 }), steel: roomMat({ tex: TEX.steel, tile: 0.8 }), zinc: roomMat({ tex: TEX.zinc, tile: 0.8 }),
    blue: roomMat({ tex: TEX.blue, tile: 0.8 }), red: roomMat({ tex: TEX.red, tile: 0.8 }), green: roomMat({ tex: TEX.green, tile: 0.8, two: true }), yellow: roomMat({ tex: TEX.yellow, tile: 0.8 }),
    hazard: roomMat({ tex: TEX.hazard, tile: 0.8 }), vinyl: roomMat({ tex: TEX.vinyl, tile: 0.8 }), tread: roomMat({ tex: TEX.tread, tile: 0.4 }), rubber: roomMat({ tex: TEX.rubber, tile: 0.8 }),
    brass: roomMat({ color: 0xa5803a }), tape: roomMat({ color: 0x6b6a66 }), voidc: roomMat({ color: 0x030303 }), cord: roomMat({ color: 0x0c0c0c }),
    blob: flat(TEX.blob), strip: flat(TEX.strip), stain1: flat(TEX.stain1), stain2: flat(TEX.stain2), drip: flat(TEX.drip),
    rustDrip: roomMat({ tex: TEX.rustDrip, two: true, blend: true, snap: false, offset: true })
  };
  if (extra) { var more = extra(); Object.keys(more).forEach(function (k) { M[k] = more[k]; }); }
  var DECALS = { blob: 1, strip: 1, stain1: 1, stain2: 1, drip: 1, rustDrip: 1 };
  Object.keys(buckets).forEach(function (key) {
    var b = buckets[key], g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(new Float32Array(b.pos), 3));
    g.setAttribute('normal', new T.BufferAttribute(new Float32Array(b.nrm), 3));
    g.setAttribute('uv', new T.BufferAttribute(new Float32Array(b.uv), 2));
    var mesh = new T.Mesh(g, M[key] || roomMat({ color: 0xff00ff }));
    if (DECALS[key] || (M[key] && M[key].userData.decal)) mesh.renderOrder = 1;        /* marks lying on a surface are drawn after it */
    mesh.userData.key = key;                             /* which material this is: the headset uses it to tell solid from not, and metal from wood */
    group.add(mesh);
  });
  buckets = {};                                          /* the next room gathers its own pieces */
}
