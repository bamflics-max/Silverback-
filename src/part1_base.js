/* ================================================================== */
/* Arena, second version: a 12 m ring in a basement fight club.        */
/* Layout, scale, light and mood. Metres, y up. The cage is centred on */
/* the origin; the blue gate faces +z and the red gate faces -z.       */
/* ================================================================== */
var PH = 1.0;                 /* platform height */
var A = 6.0;                  /* cage: centre to the middle of a side (12 m across) */
var CH = 4.0;                 /* cage wall height above the platform */
var IN = 0.7, UP = 0.45;      /* the overhang at the top leans this far in and up */
var AP = 7.3;                 /* platform edge (a 1.3 m walkway outside the cage) */
var ROWS = [[9.2, 10.3, 0.7], [10.3, 11.4, 1.25], [11.4, 12.5, 1.8], [12.5, 14.2, 1.8]];   /* stands: inner edge, outer edge, height. The last is the top walkway. */
var WALL = 14.2, ROOF = 7.2;
var T30 = Math.tan(Math.PI / 6), C30 = Math.cos(Math.PI / 6), D2R = Math.PI / 180;
function V(x, y, z) { return new T.Vector3(x, y, z); }
function sideDir(k) { var a = k * Math.PI / 3; return V(Math.sin(a), 0, Math.cos(a)); }
function sideTan(k) { var a = k * Math.PI / 3; return V(Math.cos(a), 0, -Math.sin(a)); }
/* a point given the side it belongs to, its distance out from the centre, its position along the side, and its height */
function P(k, a, t, y) { var d = sideDir(k), u = sideTan(k); return V(d.x * a + u.x * t, y, d.z * a + u.z * t); }
/* a point by compass-style angle (0 = towards the blue gate, 90 = +x) and distance from the centre */
function polar(deg, r, y) { return V(Math.sin(deg * D2R) * r, y, Math.cos(deg * D2R) * r); }
function rand(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
/* If one part fails on some phone, the rest still loads. What failed is noted here and shown in small print. */
var BUILD = 'build 7', PROBLEMS = [];
function problem(where, e) { PROBLEMS.push(where + ': ' + String(e && (e.message || e)).slice(0, 140)); if (window.console) console.error(where, e); }

/* ---------------- lights ---------------- */
/* Each room has its own set of 13 lights. Whatever is built while a set is in use is lit by that set alone, so one room's lamps never leak */
/* through a wall into the next.                                                                                                           */
var NL = 13, FOG = { uFogC: { value: new T.Color(0.021, 0.019, 0.017) }, uFogD: { value: 0.015 } };
function lightSet(sky, ground) {
  return { uni: { uLP: { value: [] }, uLD: { value: [] }, uLC: { value: [] }, uLK: { value: [] },
    uAmbS: { value: new T.Color(sky[0], sky[1], sky[2]) }, uAmbG: { value: new T.Color(ground[0], ground[1], ground[2]) }, uFogC: FOG.uFogC, uFogD: FOG.uFogD,
    uWrap: { value: 0 } }, lamps: [] };                  /* uWrap: how far a lamp's light creeps round a surface. 0 in the dark arena; more in a bright tiled room, where light bounces everywhere */
}
var LIGHTS, LAMPS;
function useLights(set) { LIGHTS = set.uni; LAMPS = set.lamps; }
function fillLights() { while (LAMPS.length < NL) addLight(V(0, -99, 0), [0, 0, 0], 0, 0, 0, 1, 'none'); }      /* the shader always reads 13, so unused places are dark lamps far away */
/* The arena: six shaded lamps hang over the ring. Bare bulbs hang over the stands, a caged lamp sits over each tunnel, */
/* and one soft light stands in for the glow the lit mat throws back into the room.                                     */
var ARENA_LIGHTS = lightSet([0.19, 0.195, 0.225], [0.1, 0.092, 0.082]);
useLights(ARENA_LIGHTS);
function addLight(pos, colour, strength, coneIn, coneOut, reach, kind) {
  var c = new T.Color(colour[0], colour[1], colour[2]).multiplyScalar(strength);
  LIGHTS.uLP.value.push(pos); LIGHTS.uLD.value.push(V(0, -1, 0)); LIGHTS.uLC.value.push(c);
  LIGHTS.uLK.value.push(coneIn ? V(Math.cos(coneIn * D2R), Math.cos(coneOut * D2R), reach) : V(-1.0, -1.01, reach));   /* no cone: shines every way */
  LAMPS.push({ pos: pos, kind: kind, colour: c, base: c.clone() });
}
var TUNGSTEN = [1.0, 0.84, 0.6], BULB = [1.0, 0.76, 0.46];
(function () {
  var i;
  for (i = 0; i < 6; i++) addLight(polar(30 + 60 * i, 3.4, 6.45), TUNGSTEN, 0.6, 38, 86, 8.5, 'pendant');
  [1, 2, 4, 5].forEach(function (k) { addLight(P(k, 11.3, k % 2 ? 0.8 : -0.8, 4.7), BULB, 0.8, 0, 0, 4.6, 'bulb'); });
  [0, 3].forEach(function (k) { addLight(P(k, WALL - 0.75, 0, 3.35), [1.0, 0.66, 0.36], 0.75, 0, 0, 3.4, 'cage'); });
  addLight(V(0, 0.55, 0), [1.0, 0.86, 0.66], 0.8, 0, 0, 10.0, 'bounce');
})();
function walkLights() {                                   /* three dim wall lamps down each tunnel, and the arena's light falling in at the mouth */
  useLights(WALK_LIGHTS);
  [0, 3].forEach(function (k) {
    [4.5, 9.5, 14.5].forEach(function (d, n) { addLight(P(k, WALL + d, n % 2 ? 1.3 : -1.3, walkY(d) + 2.05), [1.0, 0.72, 0.42], 0.7, 0, 0, 3.2, 'wall'); });
    addLight(P(k, WALL - 0.6, 0, 2.2), [1.0, 0.84, 0.6], k === 0 ? 0.95 : 0.4, 0, 0, 5.5, 'none');
  });
  fillLights(); useLights(ARENA_LIGHTS);
}
function lightAt(p) {                                    /* how much light reaches a point (used to light each gorilla for where it stands) */
  var s = 0;
  for (var i = 0; i < LAMPS.length; i++) {
    var d = LIGHTS.uLP.value[i].clone().sub(p), dist = d.length(); d.multiplyScalar(-1 / dist);
    var k = LIGHTS.uLK.value[i], c = clamp01((d.dot(LIGHTS.uLD.value[i]) - k.y) / (k.x - k.y)); c = c * c * (3 - 2 * c);
    var b = LAMPS[i].base;
    s += c * (b.r + b.g + b.b) / 3 / (1 + dist * dist / (k.z * k.z));
  }
  return s;
}

/* ---------------- textures: small, hand-pixelled looking, drawn once when the page starts ---------------- */
var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
function bay(x, y) { return (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16; }
function pal(list) { return list.map(function (s) { return [parseInt(s.substr(1, 2), 16), parseInt(s.substr(3, 2), 16), parseInt(s.substr(5, 2), 16)]; }); }
/* choose a colour from a short dark-to-light list; the dither pattern is what makes it read as pixel art rather than a smooth blur */
function pick(p, v, x, y) { var n = p.length, i = Math.floor(v * (n - 1) + bay(x, y)); return p[i < 0 ? 0 : i > n - 1 ? n - 1 : i]; }
/* smooth noise that repeats every px by py steps, so textures tile without a seam */
function noise2(seed, px, py) {
  py = py || px;
  var r = rand(seed), g = new Float32Array(px * py), i;
  for (i = 0; i < g.length; i++) g[i] = r();
  function at(x, y) { return g[(((y % py) + py) % py) * px + (((x % px) + px) % px)]; }
  return function (u, v) {
    var x0 = Math.floor(u), y0 = Math.floor(v), fx = u - x0, fy = v - y0;
    fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
    var a = at(x0, y0), b = at(x0 + 1, y0), c = at(x0, y0 + 1), d = at(x0 + 1, y0 + 1);
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  };
}
function makeTex(w, h, data, clampEdges) {
  var t = new T.DataTexture(data, w, h, T.RGBAFormat);
  t.magFilter = T.NearestFilter; t.minFilter = T.LinearMipmapLinearFilter; t.generateMipmaps = true;
  if (!clampEdges) { t.wrapS = T.RepeatWrapping; t.wrapT = T.RepeatWrapping; }
  t.userData = { w: w, h: h }; t.needsUpdate = true;                     /* no extra smoothing: the pixels are meant to stay sharp up close */
  return t;
}
/* For clean, finely detailed surfaces: the texture is smoothed between its pixels and stays sharp when seen at a slant. (The arena's chunky pixels stay as they are.) */
function smoothTex(t) {
  if (!t) return t;
  t.magFilter = T.LinearFilter;
  try { t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy() || 1); } catch (e) {}
  t.needsUpdate = true; return t;
}
/* paint(put, w, h): put(x, y, [r, g, b], alpha) wraps round the edges. Row 0 is the bottom of the texture. */
function pixTex(w, h, paint, clampEdges) {
  var d = new Uint8Array(w * h * 4);
  paint(function (x, y, c, a) {
    x = ((Math.floor(x) % w) + w) % w; y = ((Math.floor(y) % h) + h) % h;
    var i = (y * w + x) * 4; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = a === undefined ? 255 : a;
  }, w, h);
  return makeTex(w, h, d, clampEdges);
}
/* A texture drawn with the canvas (lettering, paint), then hardened into pixels: a few colour steps, hard or speckled edges, chipped paint. */
function signTex(w, h, draw, o) {
  try { return signTexUnsafe(w, h, draw, o); } catch (e) { problem('sign', e); return null; }
}
function signTexUnsafe(w, h, draw, o) {
  o = o || {};
  var c = document.createElement('canvas'); c.width = w; c.height = h;
  var g = c.getContext('2d'); draw(g, w, h);
  var s = g.getImageData(0, 0, w, h).data, out = new Uint8Array(w * h * 4), q = 255 / (o.levels || 10);
  var n = noise2(o.seed || 1, 12), n2 = noise2((o.seed || 1) + 5, 48), x, y, k;
  for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
    var i = (y * w + x) * 4, j = ((h - 1 - y) * w + x) * 4, a = s[i + 3] / 255, b = bay(x, y) - 0.5;
    if (o.wear) { var chip = n(x / w * 12, y / h * 12) * 0.6 + n2(x / w * 48, y / h * 48) * 0.4; if (chip < o.wear) a = 0; }
    a += b * (o.soft || 0);
    for (k = 0; k < 3; k++) { var v = Math.round((s[i + k] + b * q) / q) * q; out[j + k] = v < 0 ? 0 : v > 255 ? 255 : v; }
    out[j + 3] = a > 0.5 ? 255 : 0;
  }
  return makeTex(w, h, out, true);
}

var PALS = {
  floor: ['#1a1918', '#252321', '#302e2b', '#3c3935', '#48443f'],
  tier: ['#211f1c', '#2d2a26', '#3a3631', '#47423b', '#544e45'],
  block: ['#1e1d1c', '#292726', '#343230', '#403d3a', '#4b4844'],
  paintLow: ['#151c1a', '#1c2623', '#23302c', '#2b3a35'],
  slab: ['#121211', '#191817', '#201f1d', '#282624'],
  plank: ['#231a13', '#30241a', '#3e2f21', '#4c3a28', '#5b4630'],
  ply: ['#3d3022', '#4c3c2a', '#5b4832', '#6a553b', '#796245'],
  plyDark: ['#131211', '#1a1918', '#22201e', '#2b2825'],
  rust: ['#1a1513', '#2a1e19', '#3b2820', '#4f3226', '#643d2b'],
  steel: ['#161718', '#1f2123', '#292c2f', '#34383b', '#40444a'],
  zinc: ['#33373a', '#3f4447', '#4c5155', '#595f63', '#666c70'],
  wire: ['#4a4744', '#625e59', '#7d7871'],
  vinyl: ['#1c0f10', '#291516', '#371b1c', '#452223', '#532a2a'],
  blue: ['#131d33', '#19294d', '#213765', '#2a467f', '#34569a'],
  red: ['#2e1110', '#451916', '#5d221d', '#752c24', '#8c372c'],
  yellow: ['#4d411a', '#665621', '#806c29', '#998231', '#b0963a'],
  green: ['#0f1a15', '#15251d', '#1c3026', '#243c30'],
  rubber: ['#0c0c0d', '#131315', '#1b1b1e', '#242428', '#2e2e33'],
  canvas: ['#3f3a32', '#4f493f', '#5f584c', '#6f6759', '#7f7767', '#8e8574'],
  locker: ['#182220', '#1f2d2b', '#283a37', '#324844'],
  tileP: ['#403d35', '#504c42', '#605c50', '#706b5e', '#807a6c'],
  porc: ['#5f5b51', '#726d61', '#858072', '#989284'],
  grout: ['#252320'],
  tileW: ['#a3a29a', '#b4b3ab', '#c4c3bb', '#d3d2ca', '#e0dfd7'],
  tileB: ['#1d4590', '#2452a8', '#2b60c0', '#346fd6', '#4380e6'],
  tileF: ['#4a4f56', '#555b62', '#60666e', '#6b727a', '#767d86'],
  paintW: ['#7f878f', '#89919a', '#939ba4', '#9da5ae'],
  ceilP: ['#3c3e41', '#46494c', '#505457', '#5a5e62'],
  lockB: ['#1b3f86', '#214c9e', '#2759b6', '#2e67cd', '#3877e0'],
  chrome: ['#565b60', '#72787e', '#90969c', '#aeb4b9', '#cbd0d4'],
  porcW: ['#b4b4ae', '#c2c2bc', '#cfcfc9', '#dadad4', '#e4e4de'],
  lam: ['#1c2c4a', '#22355a', '#283e69', '#2f4778'],
  woodL: ['#5e4630', '#6e5338', '#7e6041', '#8e6d4a', '#9d7a54'],
  leather: ['#3a1212', '#4a1716', '#5b1c1a', '#6d221e', '#7f2923'],
  leatherK: ['#101012', '#17171a', '#1e1e22', '#26262b'],
  brassP: ['#6e5420', '#8a6b29', '#a68233', '#c0993e', '#d6b04c'],
  panel: ['#5d6166', '#686c72', '#73787e', '#7f848a', '#8b9096'],
  galv: ['#7d8388', '#888e93', '#93999e', '#9ea4a9'],
  stone: ['#2c2f34', '#34383d', '#3c4046', '#44494f'],
  matR: ['#1c1d20', '#232427', '#2a2b2f']
};
var LOGO = '"New Rocker", "Pirata One", Georgia, serif', HAND = '"Permanent Marker", "Urbanist", sans-serif', STENCIL = '"Black Ops One", "Urbanist", sans-serif', UI = '"Urbanist", "Segoe UI", sans-serif';
var BONE = '#d8d3c6', SPRAY_BLUE = '#3460b8', SPRAY_DEEP = '#1c2f63';
function sprayLogo(g, x, y, size, text) {                /* the game's lettering as spray paint: bone white with a blue outline */
  g.font = '400 ' + size + 'px ' + LOGO; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.lineWidth = size * 0.2; g.strokeStyle = SPRAY_DEEP; g.strokeText(text, x, y + size * 0.05);
  g.lineWidth = size * 0.13; g.strokeStyle = SPRAY_BLUE; g.strokeText(text, x, y);
  g.fillStyle = BONE; g.fillText(text, x, y);
}

var TEX = {}, TEXFN = null;                             /* TEXFN: the texture painters, so another room can make its own materials in the same hand */
function buildTextures() {
  var C = {}; Object.keys(PALS).forEach(function (k) { C[k] = pal(PALS[k]); });

  function concrete(seed, p, N, cracks) {
    var n1 = noise2(seed, 4), n2 = noise2(seed + 1, 8), n3 = noise2(seed + 2, 32), r = rand(seed + 3);
    return pixTex(N, N, function (put) {
      var x, y, i, s, a;
      for (y = 0; y < N; y++) for (x = 0; x < N; x++) {
        var u = x / N, v = y / N;
        put(x, y, pick(p, 0.5 + (n1(u * 4, v * 4) - 0.5) * 0.75 + (n2(u * 8, v * 8) - 0.5) * 0.4 + (n3(u * 32, v * 32) - 0.5) * 0.3, x, y));
      }
      for (i = 0; i < N * N / 110; i++) put(r() * N, r() * N, p[r() < 0.65 ? 0 : p.length - 1]);           /* pits and grit */
      for (i = 0; i < cracks; i++) {                                                                       /* hairline cracks */
        x = r() * N; y = r() * N; a = r() * 6.283;
        for (s = 0; s < N * 0.6; s++) { put(x, y, p[0]); a += (r() - 0.5) * 0.9; x += Math.cos(a); y += Math.sin(a); }
      }
    });
  }
  TEX.floor = concrete(21, C.floor, 128, 2);
  TEX.tier = concrete(31, C.tier, 64, 1);
  TEX.slab = concrete(41, C.slab, 64, 0);

  /* concrete blocks, 40 by 20 cm, each with a lit top edge and a shadowed bottom edge. chipPal: old paint that has partly come away. */
  function blocks(seed, p, mortar, paintPal) {
    var r = rand(seed), n = noise2(seed + 1, 16), ch = noise2(seed + 2, 8), ch2 = noise2(seed + 3, 32), tone = [], i;
    for (i = 0; i < 32; i++) tone.push(r());
    return pixTex(64, 64, function (put) {
      for (var y = 0; y < 64; y++) for (var x = 0; x < 64; x++) {
        var row = y >> 3, xo = (x + ((row & 1) ? 8 : 0)) & 63, bx = xo >> 4, lx = xo & 15, ly = y & 7;
        if (ly === 0 || lx === 0) { put(x, y, mortar); continue; }
        var val = 0.28 + tone[row * 4 + bx] * 0.42 + (n(x / 4, y / 4) - 0.5) * 0.3 + (ly === 7 ? 0.14 : 0) - (ly === 1 ? 0.12 : 0);
        var use = p;
        if (paintPal && ch(x / 8, y / 8) * 0.6 + ch2(x / 2, y / 2) * 0.4 < 0.62) use = paintPal;
        put(x, y, pick(use, val, x, y));
      }
    });
  }
  TEX.block = blocks(51, C.block, C.block[0]);
  TEX.blockPaint = blocks(51, C.block, C.paintLow[0], C.paintLow);

  /* boards running along x. wpx: board width in pixels. gaps: dark gaps, butt joints and nails (a boarded surface) or none (one board). */
  function boards(seed, p, wpx, gaps) {
    var r = rand(seed), n = noise2(seed + 1, 4, 32), n2 = noise2(seed + 2, 16, 64), rows = 64 / wpx, tone = [], joint = [], i;
    for (i = 0; i < rows; i++) { tone.push(r()); joint.push(Math.floor(r() * 64)); }
    return pixTex(64, 64, function (put) {
      for (var y = 0; y < 64; y++) for (var x = 0; x < 64; x++) {
        var b = Math.floor(y / wpx), ly = y % wpx;
        if (gaps && ly === 0) { put(x, y, p[0]); continue; }
        var val = 0.24 + (gaps ? tone[b] * 0.42 : 0.2) + (n(x / 16, y / 2) - 0.5) * 0.34 + (n2(x / 4, y) - 0.5) * 0.24;
        if (gaps) {
          var dx = (x - joint[b] + 64) & 63;
          if (dx === 0) val = 0;
          if ((dx === 2 || dx === 62) && (ly === 2 || ly === wpx - 2)) val = 0.03;
        }
        put(x, y, pick(p, val, x, y));
      }
    });
  }
  TEX.deck = boards(61, C.plank, 8, true);
  TEX.grain = boards(62, C.plank, 64, false);
  TEX.plyDark = boards(63, C.plyDark, 64, false);
  TEX.crate = boards(64, C.ply, 16, true);
  TEX.ply = boards(65, C.ply, 64, false);

  /* painted or bare metal with rust breaking through. amount: how much of it has rusted. */
  function metal(seed, p, rustPal, amount) {
    var n = noise2(seed, 8), n2 = noise2(seed + 1, 32), st = noise2(seed + 2, 32, 4);
    return pixTex(32, 32, function (put) {
      for (var y = 0; y < 32; y++) for (var x = 0; x < 32; x++) {
        var m = n(x / 4, y / 4) * 0.6 + n2(x, y) * 0.2 + st(x, y / 8) * 0.2;
        if (m > 1 - amount) put(x, y, pick(rustPal, 0.2 + (m - (1 - amount)) * 2.4 + (n2(x + 7, y + 3) - 0.5) * 0.3, x, y));
        else put(x, y, pick(p, 0.45 + (n2(x, y) - 0.5) * 0.5 + (st(x, y / 8) - 0.5) * 0.3, x, y));
      }
    });
  }
  TEX.rust = metal(71, C.steel, C.rust, 0.66);
  TEX.steel = metal(72, C.steel, C.rust, 0.3);
  TEX.zinc = metal(73, C.zinc, C.rust, 0.26);
  TEX.blue = metal(74, C.blue, C.rust, 0.42);
  TEX.red = metal(75, C.red, C.rust, 0.42);
  TEX.green = metal(76, C.green, C.rust, 0.36);
  TEX.yellow = metal(77, C.yellow, C.tier, 0.5);

  TEX.vinyl = (function () {                            /* cracked padding with stitched seams */
    var n = noise2(81, 8), n2 = noise2(82, 32), r = rand(83);
    return pixTex(32, 32, function (put) {
      var x, y, i, s;
      for (y = 0; y < 32; y++) for (x = 0; x < 32; x++) {
        var val = 0.5 + (n(x / 4, y / 4) - 0.5) * 0.5 + (n2(x, y) - 0.5) * 0.25;
        if ((y & 15) === 0) val -= 0.45; if ((y & 15) === 15) val += 0.16;
        put(x, y, pick(C.vinyl, val, x, y));
      }
      for (i = 0; i < 6; i++) { x = r() * 32; y = r() * 32; var a = r() * 6.283; for (s = 0; s < 7; s++) { put(x, y, C.vinyl[0]); a += (r() - 0.5); x += Math.cos(a); y += Math.sin(a); } }
      for (i = 0; i < 2; i++) { x = r() * 32; y = r() * 32; put(x, y, [130, 112, 70]); put(x + 1, y, [112, 96, 60]); put(x, y + 1, [112, 96, 60]); }      /* foam showing through a tear */
    });
  })();

  TEX.hazard = (function () {                           /* worn yellow and black stripes */
    var n = noise2(91, 8), n2 = noise2(92, 32);
    return pixTex(32, 32, function (put) {
      for (var y = 0; y < 32; y++) for (var x = 0; x < 32; x++) {
        var w = n(x / 4, y / 4) * 0.6 + n2(x, y) * 0.4;
        if (w > 0.66) put(x, y, pick(C.floor, 0.5, x, y));
        else put(x, y, (((x + y) >> 3) & 1) ? pick(C.yellow, 0.5 + (w - 0.4) * 0.7, x, y) : pick(C.plyDark, 0.35 + w * 0.5, x, y));
      }
    });
  })();

  TEX.tread = (function () { var n2 = noise2(101, 32); return pixTex(32, 32, function (put) {     /* zigzag tyre tread */
    for (var y = 0; y < 32; y++) for (var x = 0; x < 32; x++) { var z = y & 7; var k = (x + (z < 4 ? z : 7 - z)) & 7; put(x, y, pick(C.rubber, (k < 3 ? 0.12 : 0.62) + (n2(x, y) - 0.5) * 0.3, x, y)); }
  }); })();
  TEX.rubber = (function () { var n = noise2(102, 8), n2 = noise2(103, 32); return pixTex(32, 32, function (put) {
    for (var y = 0; y < 32; y++) for (var x = 0; x < 32; x++) put(x, y, pick(C.rubber, 0.42 + (n(x / 4, y / 4) - 0.5) * 0.5 + (n2(x, y) - 0.5) * 0.3, x, y));
  }); })();

  TEX.fence = (function () {                            /* chain-link: 14 cm diamonds, each wire with a lit edge, knuckles where the wires cross */
    var n = noise2(111, 8);
    return pixTex(64, 64, function (put) {
      for (var y = 0; y < 64; y++) for (var x = 0; x < 64; x++) {
        var a = (x + y) & 15, b = (x - y) & 15, onA = a < 2, onB = b < 2;
        if (!onA && !onB) { put(x, y, [72, 64, 56], 0); continue; }
        var rusty = n(x / 8, y / 8) > 0.56, hi = (onA && a === 0) || (onB && !onA && b === 0), col;
        if (onA && onB) col = C.wire[2];
        else if (rusty) col = hi ? C.rust[4] : C.rust[3];
        else col = hi ? C.wire[2] : C.wire[0];
        put(x, y, col, 255);
      }
    });
  })();

  /* shadows: soft shapes broken into a dither, like the rest */
  TEX.blob = pixTex(32, 32, function (put) {
    for (var y = 0; y < 32; y++) for (var x = 0; x < 32; x++) { var a = clamp01(1 - Math.hypot(x - 15.5, y - 15.5) / 15.5); a = a * a * (3 - 2 * a); put(x, y, [0, 0, 0], Math.min(255, Math.floor(a * 7 + bay(x, y)) / 7 * 235)); }
  }, true);
  TEX.strip = pixTex(4, 32, function (put) {
    for (var y = 0; y < 32; y++) for (var x = 0; x < 4; x++) { var a = 1 - y / 31; a = a * a; put(x, y, [0, 0, 0], Math.min(255, Math.floor(a * 7 + bay(x, y)) / 7 * 225)); }
  }, true);
  function stain(seed) {                                 /* an irregular dark patch in two tones */
    var n = noise2(seed, 6), n2 = noise2(seed + 1, 24);
    return pixTex(64, 64, function (put) {
      for (var y = 0; y < 64; y++) for (var x = 0; x < 64; x++) {
        var v = 1 - Math.hypot(x - 31.5, y - 31.5) / 31.5 + (n(x / 64 * 6, y / 64 * 6) - 0.5) * 1.1 + (n2(x / 64 * 24, y / 64 * 24) - 0.5) * 0.3;
        put(x, y, [6, 5, 4], v > 0.62 ? 150 : v > 0.42 ? (bay(x, y) < 0.6 ? 120 : 0) : v > 0.36 ? (bay(x, y) < 0.3 ? 100 : 0) : 0);
      }
    }, true);
  }
  TEX.stain1 = stain(121); TEX.stain2 = stain(131);
  TEX.drip = (function () {                             /* streaks running down a wall */
    var r = rand(141);
    return pixTex(32, 64, function (put) {
      var x, y; for (y = 0; y < 64; y++) for (x = 0; x < 32; x++) put(x, y, [8, 6, 5], 0);
      for (x = 1; x < 31; x++) { if (r() < 0.45) continue; var len = 10 + r() * 50, w = r() < 0.3 ? 2 : 1; for (y = 0; y < len; y++) { var a = (1 - y / len) * 190; if (bay(x, y) * 255 < a + 40) { put(x, 63 - y, [8, 6, 5], 150); if (w === 2) put(x + 1, 63 - y, [8, 6, 5], 120); } } }
    }, true);
  })();
  TEX.rustDrip = (function () {
    var r = rand(151);
    return pixTex(32, 64, function (put) {
      var x, y; for (y = 0; y < 64; y++) for (x = 0; x < 32; x++) put(x, y, [70, 40, 26], 0);
      for (x = 1; x < 31; x++) { if (r() < 0.5) continue; var len = 8 + r() * 44; for (y = 0; y < len; y++) { if (bay(x, y) < 0.9 - y / len * 0.8) put(x, 63 - y, [74 - y * 0.5, 42 - y * 0.3, 27], 170); } }
    }, true);
  })();

  /* ---- the mat: stained canvas, faded paint, the logo sprayed in the middle ---- */
  TEX.mat = (function () {
   try {
    var N = 512, R = A / C30, s = N / (2 * R), base = [], x, y, i, a;
    C.canvas.forEach(function (c, n) { if (n) { var p = C.canvas[n - 1]; base.push([(p[0] + c[0]) >> 1, (p[1] + c[1]) >> 1, (p[2] + c[2]) >> 1]); } base.push(c); });   /* in-between shades, so the dither on the mat is gentle */
    var n1 = noise2(11, 6), n2 = noise2(12, 24), n3 = noise2(13, 128), st = noise2(14, 9), wr = noise2(15, 40), wr2 = noise2(16, 128), r = rand(17);
    var c = document.createElement('canvas'); c.width = N; c.height = N; var g = c.getContext('2d');
    function X(m) { return N / 2 + m * s; }
    g.lineJoin = 'round';
    g.strokeStyle = '#3a5fae'; g.lineWidth = 0.14 * s; g.beginPath();                            /* a line half a metre in from the cage */
    for (i = 0; i < 6; i++) { a = (30 + 60 * i) * D2R; var rr = (A - 0.5) / C30; if (i) g.lineTo(X(Math.sin(a) * rr), X(Math.cos(a) * rr)); else g.moveTo(X(Math.sin(a) * rr), X(Math.cos(a) * rr)); }
    g.closePath(); g.stroke();
    g.strokeStyle = '#b9b3a6'; g.lineWidth = 0.09 * s; g.beginPath(); g.arc(N / 2, N / 2, 2.0 * s, 0, 7); g.stroke();
    g.fillStyle = '#34569a'; g.beginPath(); g.moveTo(X(-0.95), X(A - 0.5)); g.lineTo(X(0.95), X(A - 0.5)); g.lineTo(X(0), X(A - 1.55)); g.fill();        /* blue corner, by the blue gate */
    g.fillStyle = '#8c372c'; g.beginPath(); g.moveTo(X(-0.95), X(-A + 0.5)); g.lineTo(X(0.95), X(-A + 0.5)); g.lineTo(X(0), X(-A + 1.55)); g.fill();
    sprayLogo(g, N / 2, N / 2, 1.34 * s, 'Silverback');
    var paint = g.getImageData(0, 0, N, N).data, d = new Uint8Array(N * N * 4), seam = {}, blots = [];
    [-4.5, -1.5, 1.5, 4.5].forEach(function (m) { seam[Math.round(X(m))] = 1; });               /* the canvas is laid in 3 m strips */
    for (i = 0; i < 9; i++) blots.push([N * (0.14 + r() * 0.72), N * (0.14 + r() * 0.72), (0.14 + r() * 0.3) * s, Math.floor(r() * 20), 0.6 + r() * 0.9]);
    for (y = 0; y < N; y++) for (x = 0; x < N; x++) {
      var u = x / N, v = y / N, i4 = (y * N + x) * 4, j = ((N - 1 - y) * N + x) * 4, b = bay(x, y);
      var val = 0.55 + (n1(u * 6, v * 6) - 0.5) * 0.5 + (n2(u * 24, v * 24) - 0.5) * 0.3 + (n3(u * 128, v * 128) - 0.5) * 0.24;
      if (seam[x]) val -= 0.22; else if (seam[x - 1]) val += 0.08;
      var col = pick(base, val, x, y), cr = col[0], cg = col[1], cb = col[2];
      if (paint[i4 + 3] / 255 + (b - 0.5) * 0.5 > 0.5) {
        var wear = wr(u * 40, v * 40) * 0.6 + wr2(u * 128, v * 128) * 0.4;
        if (wear > 0.27) { var f = 0.74 + wear * 0.34; cr = paint[i4] * f; cg = paint[i4 + 1] * f; cb = paint[i4 + 2] * f; }
      }
      var sv = st(u * 9, v * 9), m = sv > 0.62 ? 0.82 : 1, mr = m, mg = m, mb = m;
      for (i = 0; i < blots.length; i++) {
        var bl = blots[i], dd = Math.hypot((x - bl[0]) * bl[4], y - bl[1]) / bl[2] + (n2(u * 24 + bl[3], v * 24) - 0.5) * 1.3 + (n3(u * 128, v * 128 + bl[3]) - 0.5) * 0.5;
        if (dd < 1) { var k = dd < 0.78 ? 0.58 : 0.78; mr *= k + (1 - k) * 0.25; mg *= k; mb *= k; }
      }
      cr = Math.round((cr * mr + (b - 0.5) * 10) / 10) * 10; cg = Math.round((cg * mg + (b - 0.5) * 10) / 10) * 10; cb = Math.round((cb * mb + (b - 0.5) * 10) / 10) * 10;
      d[j] = cr < 0 ? 0 : cr > 255 ? 255 : cr; d[j + 1] = cg < 0 ? 0 : cg > 255 ? 255 : cg; d[j + 2] = cb < 0 ? 0 : cb > 255 ? 255 : cb; d[j + 3] = 255;
    }
    for (i = 0; i < 170; i++) {                                                                  /* scuffs */
      x = r() * N; y = r() * N; a = r() * 6.283; var len = 3 + r() * 12, top = base[base.length - 1];
      for (var q = 0; q < len; q++) { var jx = Math.floor(x + Math.cos(a) * q), jy = Math.floor(y + Math.sin(a) * q); if (jx < 0 || jy < 0 || jx >= N || jy >= N) continue; var o = (jy * N + jx) * 4; d[o] = (d[o] + top[0]) >> 1; d[o + 1] = (d[o + 1] + top[1]) >> 1; d[o + 2] = (d[o + 2] + top[2]) >> 1; }
    }
    return makeTex(N, N, d, true);
   } catch (e) { problem('mat', e); return concrete(11, C.canvas, 128, 0); }       /* a plain mat if the painted one cannot be made */
  })();

  /* ---- paint and signs ---- */
  TEX.wallLogo = signTex(384, 128, function (g, w, h) {
    var r = rand(7);
    g.shadowColor = SPRAY_BLUE; g.shadowBlur = 4;
    sprayLogo(g, w / 2, h / 2 - 8, 76, 'Silverback');
    g.shadowBlur = 0;
    for (var i = 0; i < 11; i++) { var x = 40 + r() * (w - 80), len = 8 + r() * 30; g.fillStyle = r() < 0.6 ? SPRAY_BLUE : SPRAY_DEEP; g.fillRect(Math.floor(x), h / 2 + 20, r() < 0.3 ? 2 : 1, len); }
  }, { soft: 0.9, wear: 0.2, seed: 3, levels: 9 });
  TEX.skirtLogo = signTex(192, 40, function (g, w, h) { sprayLogo(g, w / 2, h / 2, 27, 'Silverback'); }, { soft: 0.5, wear: 0.24, seed: 9, levels: 9 });
  TEX.rules = signTex(256, 160, function (g, w, h) {
    var r = rand(5), i;
    g.fillStyle = '#54432f'; g.fillRect(0, 0, w, h);
    for (i = 0; i < 260; i++) { g.fillStyle = r() < 0.5 ? 'rgba(30,22,14,0.16)' : 'rgba(150,120,80,0.1)'; g.fillRect(r() * w, r() * h, 8 + r() * 46, 1); }      /* plywood grain */
    g.fillStyle = '#2a2018'; [[6, 6], [w - 8, 6], [6, h - 8], [w - 8, h - 8]].forEach(function (p) { g.fillRect(p[0], p[1], 3, 3); });                              /* screws */
    g.fillStyle = '#e3dccb'; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    g.font = '400 27px ' + HAND; g.fillText('House rules', 18, 36);
    g.fillRect(18, 43, 150, 2);
    g.font = '400 17px ' + HAND;
    ['1. Knockout wins', '2. Ring the bell to fight', '3. Bang on the cage', '4. Stay loud'].forEach(function (s, n) { g.save(); g.translate(18, 72 + n * 26); g.rotate((n % 2 ? 1 : -1) * 0.012); g.fillText(s, 0, 0); g.restore(); });
  }, { seed: 21, levels: 9 });
  TEX.only = signTex(256, 48, function (g, w, h) {
    g.font = '400 30px ' + STENCIL; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#b0963a'; g.fillText('FIGHTERS ONLY', w / 2, h / 2 + 2);
  }, { wear: 0.3, seed: 31, levels: 8 });
  TEX.tag = signTex(128, 96, function (g, w, h) {
    g.shadowColor = SPRAY_BLUE; g.shadowBlur = 3; g.strokeStyle = SPRAY_BLUE; g.lineWidth = 5; g.lineJoin = 'round'; g.lineCap = 'round';
    g.beginPath(); [[14, 58], [22, 24], [40, 48], [58, 18], [76, 48], [94, 24], [102, 58], [14, 58]].forEach(function (p, i) { if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }); g.stroke();
    g.beginPath(); g.moveTo(18, 70); g.lineTo(98, 70); g.stroke();
    g.fillStyle = SPRAY_BLUE; g.fillRect(40, 70, 2, 20); g.fillRect(77, 70, 1, 13);
    g.shadowBlur = 0;
  }, { soft: 0.9, wear: 0.16, seed: 41, levels: 9 });
  TEX.ko = signTex(64, 48, function (g, w, h) {
    g.font = '400 40px ' + HAND; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = BONE; g.fillText('KO', w / 2, h / 2 + 2);
  }, { soft: 0.4, wear: 0.2, seed: 51, levels: 9 });
  TEX.tally = signTex(96, 48, function (g, w, h) {                                               /* chalk marks: someone is keeping count */
    var r = rand(61); g.strokeStyle = '#cfc9bb'; g.lineWidth = 2; g.lineCap = 'round';
    for (var n = 0; n < 3; n++) {
      var x0 = 8 + n * 30, k = n === 2 ? 3 : 4;
      for (var i = 0; i < k; i++) { g.beginPath(); g.moveTo(x0 + i * 5 + r() * 1.5, 9 + r() * 3); g.lineTo(x0 + i * 5 + r() * 1.5, 38 + r() * 3); g.stroke(); }
      if (n < 2) { g.beginPath(); g.moveTo(x0 - 4, 34); g.lineTo(x0 + 20, 13); g.stroke(); }
    }
  }, { wear: 0.18, seed: 61, levels: 8 });
  TEX.num = [1, 2, 3, 4, 5, 6].map(function (n) {
    return signTex(32, 48, function (g, w, h) { g.font = '400 44px ' + STENCIL; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#cfc8b6'; g.fillText(String(n), w / 2, h / 2 + 2); }, { wear: 0.3, seed: 70 + n, levels: 8 });
  });
  TEX.cross = signTex(64, 64, function (g, w, h) {                                               /* a sprayed X */
    g.shadowColor = '#8c372c'; g.shadowBlur = 3; g.strokeStyle = '#8c372c'; g.lineWidth = 7; g.lineCap = 'round';
    g.beginPath(); g.moveTo(12, 12); g.lineTo(52, 52); g.moveTo(52, 12); g.lineTo(12, 52); g.stroke();
    g.fillStyle = '#8c372c'; g.shadowBlur = 0; g.fillRect(30, 40, 2, 20);
  }, { soft: 0.9, wear: 0.2, seed: 81, levels: 9 });

  /* the scoreboard, as an old tube TV would show it */
  TEX.crt = signTex(128, 96, function (g, w, h) {
    g.fillStyle = '#0b1118'; g.fillRect(0, 0, w, h);
    g.font = '650 11px ' + UI; g.textBaseline = 'middle'; g.fillStyle = '#93a6ad'; g.textAlign = 'left'; g.fillText('1 v 1', 8, 11); g.textAlign = 'right'; g.fillText('0:47', w - 8, 11);
    [['Player 1', 0.72, '#4f86e8'], ['Player 2', 0.38, '#d2574b']].forEach(function (p, i) {
      var y = 38 + i * 32;
      g.fillStyle = '#3d444c'; g.beginPath(); g.arc(18, y, 10, 0, 7); g.fill();                  /* a stand-in for the fighter's head picture */
      g.fillStyle = '#15191e'; g.fillRect(11, y - 3, 14, 3); g.fillRect(14, y + 3, 8, 2);
      g.fillStyle = p[2]; g.fillRect(6, y - 10, 2, 20);
      g.font = '650 12px ' + UI; g.fillStyle = '#e6eaec'; g.textAlign = 'left'; g.fillText(p[0], 34, y - 6);
      g.fillStyle = '#1c232c'; g.fillRect(34, y + 3, 86, 7);
      g.fillStyle = p[2]; g.fillRect(34, y + 3, Math.round(86 * p[1]), 7);
    });
    for (var y2 = 0; y2 < h; y2 += 2) { g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(0, y2, w, 1); }
  }, { seed: 91, levels: 12 });
  TEXFN = { concrete: concrete, blocks: blocks, boards: boards, metal: metal, C: C };
}

/* ---------------- the room's material: a pixel texture, lit per texel by the lamps, fading into the dark ---------------- */
var ROOMV = [
  'varying vec3 vW; varying vec3 vNw; varying vec2 vUv;',
  'void main(){',
  '  vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vNw = normalize(mat3(modelMatrix) * normal); vUv = uv;',
  '  gl_Position = projectionMatrix * viewMatrix * w;',
  '}'].join('\n');
var ROOMF = [
  'precision highp float;',
  'uniform vec3 uLP[13]; uniform vec3 uLD[13]; uniform vec3 uLC[13]; uniform vec3 uLK[13];',
  'uniform vec3 uAmbS; uniform vec3 uAmbG; uniform vec3 uFogC; uniform float uFogD; uniform float uWrap;',
  'uniform vec3 uColor; uniform sampler2D uMap; uniform float uUseMap; uniform vec2 uRep; uniform vec2 uTexSize; uniform float uGlow; uniform float uSnap; uniform float uCut; uniform float uGloss; uniform float uShine; uniform float uGrime;',
  'float gh(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
  'float gn(vec2 p){ vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(gh(i), gh(i + vec2(1.0, 0.0)), f.x), mix(gh(i + vec2(0.0, 1.0)), gh(i + vec2(1.0, 1.0)), f.x), f.y); }',
  'varying vec3 vW; varying vec3 vNw; varying vec2 vUv;',
  'void main(){',
  '  vec3 n = normalize(vNw); if (!gl_FrontFacing) n = -n;',
  '  vec3 base = uColor; float alpha = 1.0; vec3 wp = vW;',
  '  if (uUseMap > 0.5) {',
  '    vec2 uv = vUv * uRep; vec4 t = texture2D(uMap, uv);',
  '    if (uCut > 0.5 && t.a < 0.5) discard;',
  '    base *= t.rgb; alpha = t.a;',
  '    //SNAP',
  '  }',
  '  if (alpha < 0.004) discard;',
  '  if (uGrime > 0.0) {                                                    /* years of dirt: blotches, streaks run down the walls, soot rising from the ground */',
  '    float up = abs(n.y); vec2 gp = up > 0.5 ? vW.xz : vec2(vW.x + vW.z, vW.y);',
  '    float g = gn(gp * 0.4) * 0.55 + gn(gp * vec2(2.6, 0.35) + 9.0) * 0.45;',
  '    float low = (1.0 - smoothstep(0.0, 2.4, vW.y)) * (1.0 - up);',
  '    base *= 1.0 - uGrime * clamp(0.75 * smoothstep(0.3, 0.8, g) + 0.5 * low, 0.0, 1.0);',
  '  }',
  '  vec3 L = mix(uAmbG, uAmbS, n.y * 0.5 + 0.5); vec3 S = vec3(0.0); vec3 eye = normalize(cameraPosition - vW);',
  '  for (int i = 0; i < 13; i++) {',
  '    vec3 d = uLP[i] - wp; float dist = length(d); vec3 l = d / dist;',
  '    float fall = smoothstep(uLK[i].y, uLK[i].x, dot(-l, uLD[i])) / (1.0 + dist * dist / (uLK[i].z * uLK[i].z));',
  '    L += uLC[i] * (max((dot(n, l) + uWrap) / (1.0 + uWrap), 0.0) * fall);',
  '    if (uGloss > 0.0) {                                                  /* the lamp\'s highlight on a glossy surface, kept smooth rather than blocky */',
  '      vec3 l2 = normalize(uLP[i] - vW);',
  '      S += uLC[i] * (pow(max(dot(n, normalize(l2 + eye)), 0.0), uShine) * fall * step(0.0, dot(n, l2)));',
  '    }',
  '  }',
  '  vec3 col = base * (L + uGlow) + S * uGloss;',
  '  col = mix(uFogC, col, exp(-length(vW - cameraPosition) * uFogD));',
  '  gl_FragColor = vec4(col, alpha);',
  '}'].join('\n');
/* The full version lights each texture pixel as one block, by moving the lit point to the middle of its texel. The plain version skips that, */
/* and is what the page falls back to if a phone's graphics chip refuses the full one.                                                      */
var ROOMF_PLAIN = ROOMF, ROOM_MATS = [];
ROOMF = ROOMF.replace('    //SNAP', [
  '    if (uSnap > 0.5) {',
  '      vec2 tx = uv * uTexSize; vec2 d = (floor(tx) + 0.5 - tx) / uTexSize;',
  '      vec2 dx = dFdx(uv); vec2 dy = dFdy(uv); float det = dx.x * dy.y - dx.y * dy.x;',
  '      if (abs(det) > 1e-12) { vec2 s = clamp(vec2(d.x * dy.y - d.y * dy.x, dx.x * d.y - dx.y * d.x) / det, -40.0, 40.0); wp += dFdx(vW) * s.x + dFdy(vW) * s.y; }',
  '    }'].join('\n'));
/* o: tex, tile (metres one repeat covers; leave out for a texture that fits the shape once), color, two (both faces), cut (hard-edged holes), blend (see-through), glow, snap, */
/*    gloss (how strong the lamps' highlights are, 0 for a dull surface) and shine (how tight they are) */
function roomMat(o) {
  o = o || {};
  var t = o.tex || null, tile = o.tile ? (o.tile.length ? o.tile : [o.tile, o.tile]) : null;
  var m = new T.ShaderMaterial({ vertexShader: ROOMV, fragmentShader: ROOMF, side: o.two ? T.DoubleSide : T.FrontSide, extensions: { derivatives: true },
    transparent: !!o.blend, depthWrite: !o.blend,
    uniforms: { uLP: LIGHTS.uLP, uLD: LIGHTS.uLD, uLC: LIGHTS.uLC, uLK: LIGHTS.uLK, uAmbS: LIGHTS.uAmbS, uAmbG: LIGHTS.uAmbG, uFogC: LIGHTS.uFogC, uFogD: LIGHTS.uFogD, uWrap: LIGHTS.uWrap,
      uColor: { value: new T.Color(o.color === undefined ? 0xffffff : o.color) }, uMap: { value: t }, uUseMap: { value: t ? 1 : 0 },
      uRep: { value: new T.Vector2(tile ? 1 / tile[0] : 1, tile ? 1 / tile[1] : 1) }, uTexSize: { value: new T.Vector2(t ? t.userData.w : 1, t ? t.userData.h : 1) },
      uGlow: { value: o.glow || 0 }, uSnap: { value: o.snap === false ? 0 : 1 }, uCut: { value: o.cut ? 1 : 0 }, uGloss: { value: o.gloss || 0 }, uShine: { value: o.shine || 24 }, uGrime: { value: o.grime || 0 } } });
  if (o.offset) { m.polygonOffset = true; m.polygonOffsetFactor = -2; m.polygonOffsetUnits = -2; }
  ROOM_MATS.push(m);
  return m;
}

/* ---------------- geometry: everything static is gathered into one mesh per material ---------------- */
var buckets = {};
function bucket(key) { return buckets[key] || (buckets[key] = { pos: [], nrm: [], uv: [] }); }
var _e1 = new T.Vector3(), _e2 = new T.Vector3(), _nn = new T.Vector3();
/* inside: a point the face must look away from. Texture coordinates are laid out in metres across the face, so textures line up from piece to piece. */
function tri(key, p0, p1, p2, inside) {
  _e1.subVectors(p1, p0); _e2.subVectors(p2, p0); _nn.crossVectors(_e1, _e2).normalize();
  if (inside) { _e1.subVectors(p0, inside); if (_e1.dot(_nn) < 0) { var t = p1; p1 = p2; p2 = t; _nn.negate(); } }
  var b = bucket(key), ps = [p0, p1, p2], flat = Math.abs(_nn.y) > 0.7, tx = 0, tz = 0, i;
  if (!flat) { var l = Math.hypot(_nn.x, _nn.z); tx = _nn.z / l; tz = -_nn.x / l; }
  for (i = 0; i < 3; i++) {
    var p = ps[i]; b.pos.push(p.x, p.y, p.z); b.nrm.push(_nn.x, _nn.y, _nn.z);
    if (flat) b.uv.push(p.x, p.z); else b.uv.push(p.x * tx + p.z * tz, p.y);
  }
}
function quad(key, p0, p1, p2, p3, inside) { tri(key, p0, p1, p2, inside); tri(key, p0, p2, p3, inside); }
/* a four-sided piece with its own texture coordinates: p0 and p1 sit at v0, p2 and p3 at v1 */
function quadUV(key, p0, p1, p2, p3, u0, v0, u1, v1) {
  _e1.subVectors(p1, p0); _e2.subVectors(p3, p0); _nn.crossVectors(_e1, _e2).normalize();
  var b = bucket(key), ps = [p0, p1, p2, p0, p2, p3], uv = [u0, v0, u1, v0, u1, v1, u0, v0, u1, v1, u0, v1];
  for (var i = 0; i < 6; i++) { b.pos.push(ps[i].x, ps[i].y, ps[i].z); b.nrm.push(_nn.x, _nn.y, _nn.z); b.uv.push(uv[i * 2], uv[i * 2 + 1]); }
}
function prism(keyTop, keySide, pts, y0, y1) {          /* pts: a convex outline on the ground as [x, z] pairs */
  var n = pts.length, cx = 0, cz = 0, i;
  for (i = 0; i < n; i++) { cx += pts[i][0] / n; cz += pts[i][1] / n; }
  var mid = V(cx, (y0 + y1) / 2, cz);
  var top = pts.map(function (p) { return V(p[0], y1, p[1]); }), bot = pts.map(function (p) { return V(p[0], y0, p[1]); });
  for (i = 1; i < n - 1; i++) { tri(keyTop, top[0], top[i], top[i + 1], mid); tri(keySide, bot[0], bot[i], bot[i + 1], mid); }
  for (i = 0; i < n; i++) { var j = (i + 1) % n; quad(keySide, bot[i], bot[j], top[j], top[i], mid); }
}
/* c: centre of the box. sx runs along the box's own x, which ry turns: with ry = k * 60 degrees, sx lies along side k and sz points out from the centre. */
function box(key, c, sx, sy, sz, ry, keyTop) {
  var ca = Math.cos(ry || 0), sa = Math.sin(ry || 0);
  var pts = [[-sx / 2, -sz / 2], [sx / 2, -sz / 2], [sx / 2, sz / 2], [-sx / 2, sz / 2]].map(function (p) { return [c.x + p[0] * ca + p[1] * sa, c.z - p[0] * sa + p[1] * ca]; });
  prism(keyTop || key, key, pts, c.y - sy / 2, c.y + sy / 2);
}
function cyl(key, c, r, h, seg, keyTop) {               /* c: centre of the base */
  var pts = [];
  for (var i = 0; i < seg; i++) { var a = (i + 0.5) / seg * Math.PI * 2; pts.push([c.x + Math.sin(a) * r, c.z + Math.cos(a) * r]); }
  prism(keyTop || key, key, pts, c.y, c.y + h);
}
var _ax = new T.Vector3(), _u = new T.Vector3(), _w = new T.Vector3();
function tube(key, p, q, r, seg) {                      /* a faceted pipe from p to q */
  seg = seg || 6; _ax.subVectors(q, p).normalize();
  _u.set(0, 1, 0); if (Math.abs(_ax.y) > 0.9) _u.set(1, 0, 0);
  _u.crossVectors(_ax, _u).normalize(); _w.crossVectors(_ax, _u).normalize();
  var mid = p.clone().add(q).multiplyScalar(0.5), rg = [], i;
  for (i = 0; i < seg; i++) { var a = (i + 0.5) / seg * Math.PI * 2, ox = Math.cos(a) * r, oy = Math.sin(a) * r; rg.push([p.clone().addScaledVector(_u, ox).addScaledVector(_w, oy), q.clone().addScaledVector(_u, ox).addScaledVector(_w, oy)]); }
  for (i = 0; i < seg; i++) { var j = (i + 1) % seg; quad(key, rg[i][0], rg[j][0], rg[j][1], rg[i][1], mid); }
}
function cone(key, c, r0, r1, h, seg) {                 /* an open cone or funnel: radius r0 at the base c, r1 at the top */
  var mid = V(c.x, c.y + h / 2, c.z);
  for (var i = 0; i < seg; i++) {
    var a0 = i / seg * Math.PI * 2, a1 = (i + 1) / seg * Math.PI * 2;
    quad(key, V(c.x + Math.sin(a0) * r0, c.y, c.z + Math.cos(a0) * r0), V(c.x + Math.sin(a1) * r0, c.y, c.z + Math.cos(a1) * r0),
      V(c.x + Math.sin(a1) * r1, c.y + h, c.z + Math.cos(a1) * r1), V(c.x + Math.sin(a0) * r1, c.y + h, c.z + Math.cos(a0) * r1), mid);
  }
}
function tyre(c, rot) {                                 /* c: centre of the underside. A real ring with a hole, not a disc. */
  var rIn = 0.27, rOut = 0.5, h = 0.3, seg = 10;
  function pt(a, r, y) { return V(c.x + Math.sin(a) * r, y, c.z + Math.cos(a) * r); }
  for (var i = 0; i < seg; i++) {
    var a0 = rot + i / seg * Math.PI * 2, a1 = rot + (i + 1) / seg * Math.PI * 2, mid = pt((a0 + a1) / 2, (rIn + rOut) / 2, c.y + h / 2);
    quad('tread', pt(a0, rOut, c.y), pt(a1, rOut, c.y), pt(a1, rOut, c.y + h), pt(a0, rOut, c.y + h), mid);
    quad('rubber', pt(a0, rIn, c.y), pt(a1, rIn, c.y), pt(a1, rIn, c.y + h), pt(a0, rIn, c.y + h), mid);
    quad('rubber', pt(a0, rOut, c.y + h), pt(a1, rOut, c.y + h), pt(a1, rIn, c.y + h), pt(a0, rIn, c.y + h), mid);
    quad('rubber', pt(a0, rOut, c.y), pt(a1, rOut, c.y), pt(a1, rIn, c.y), pt(a0, rIn, c.y), mid);
  }
}
/* An upright wall from p0 to p1 (two points on the floor), h tall, with rectangular openings left out. Each hole is [from, to, bottom, top], */
/* with from and to measured along the wall from p0. Below 'band' it takes the first material, above it the second. behind: a point on the  */
/* side the wall does not face.                                                                                                              */
function holedWall(p0, p1, h, band, holes, behind, keyLow, keyUp) {
  var bands = band.length ? band : [[band, keyLow], [h, keyUp]];        /* band: one height with two materials, or a list of [top, material] from the floor up */
  var len = Math.hypot(p1.x - p0.x, p1.z - p0.z), dx = (p1.x - p0.x) / len, dz = (p1.z - p0.z) / len, ss = [0, len], ys = [0, h], i, j;
  bands.forEach(function (b) { ys.push(b[0]); });
  function keyAt(y) { for (var n = 0; n < bands.length; n++) if (y < bands[n][0]) return bands[n][1]; return bands[bands.length - 1][1]; }
  function pt(s, y) { return V(p0.x + dx * s, y, p0.z + dz * s); }
  function tidy(a, hi) { a = a.filter(function (v) { return v >= 0 && v <= hi; }).sort(function (m, n) { return m - n; }); return a.filter(function (v, n) { return !n || v - a[n - 1] > 1e-6; }); }
  holes.forEach(function (o) { ss.push(o[0], o[1]); ys.push(o[2], o[3]); });
  ss = tidy(ss, len); ys = tidy(ys, h);
  for (i = 0; i < ss.length - 1; i++) for (j = 0; j < ys.length - 1; j++) {
    var ms = (ss[i] + ss[i + 1]) / 2, my = (ys[j] + ys[j + 1]) / 2;
    if (holes.some(function (o) { return ms > o[0] && ms < o[1] && my > o[2] && my < o[3]; })) continue;
    quad(keyAt(my), pt(ss[i], ys[j]), pt(ss[i + 1], ys[j]), pt(ss[i + 1], ys[j + 1]), pt(ss[i], ys[j + 1]), behind);
  }
}
function rod(key, p, q, r, seg, keyEnd) {              /* a pipe with closed ends, lying any way round: dumbbells, bars, plates */
  tube(key, p, q, r, seg);
  _ax.subVectors(q, p).normalize(); _u.set(0, 1, 0); if (Math.abs(_ax.y) > 0.9) _u.set(1, 0, 0);
  _u.crossVectors(_ax, _u).normalize(); _w.crossVectors(_ax, _u).normalize();
  var mid = p.clone().add(q).multiplyScalar(0.5), u = _u.clone(), w = _w.clone();
  [p, q].forEach(function (c) {
    var ring = [], i; for (i = 0; i < seg; i++) { var a = (i + 0.5) / seg * Math.PI * 2; ring.push(c.clone().addScaledVector(u, Math.cos(a) * r).addScaledVector(w, Math.sin(a) * r)); }
    for (i = 1; i < seg - 1; i++) tri(keyEnd || key, ring[0], ring[i], ring[i + 1], mid);
  });
}
/* A triangle that brings its own normals and texture coordinates, for rounded things that should shade smoothly. Each corner is { p, n, u, v }. */
function triN(key, a, b, c) {
  _e1.subVectors(b.p, a.p); _e2.subVectors(c.p, a.p); _nn.crossVectors(_e1, _e2);
  if (_nn.lengthSq() < 1e-14) return;
  if (_nn.dot(a.n) + _nn.dot(b.n) + _nn.dot(c.n) < 0) { var t = b; b = c; c = t; }       /* wind it to face the way its normals point */
  var k = bucket(key);
  [a, b, c].forEach(function (q) { k.pos.push(q.p.x, q.p.y, q.p.z); k.nrm.push(q.n.x, q.n.y, q.n.z); k.uv.push(q.u, q.v); });
}
/* A shape turned on a lathe: prof is its outline as [radius, height] pairs, spun round the upright line through c. The surface faces the right-hand side */
/* of the outline as you follow it: drawn from the bottom up it faces outwards, drawn from a rim down to the middle it is a hollow. hard: keep every corner sharp. */
function lathe(key, c, prof, seg, hard) {
  if (hard) { var sharp = []; prof.forEach(function (p, m) { sharp.push(p); if (m > 0 && m < prof.length - 1) sharp.push(p); }); prof = sharp; }
  var n = prof.length, nr = [], len = [0], i, j, R = 0;
  for (i = 0; i < n; i++) R = Math.max(R, prof[i][0]);
  for (i = 0; i < n; i++) {
    var a = prof[Math.max(0, i - 1)], b = prof[Math.min(n - 1, i + 1)], dr = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dr, dy) || 1;
    nr.push([dy / l, -dr / l]);
    if (i) len.push(len[i - 1] + Math.hypot(prof[i][0] - prof[i - 1][0], prof[i][1] - prof[i - 1][1]));
  }
  function vert(i, j) {
    var ang = j / seg * Math.PI * 2, s = Math.sin(ang), co = Math.cos(ang);
    return { p: V(c.x + s * prof[i][0], c.y + prof[i][1], c.z + co * prof[i][0]), n: V(s * nr[i][0], nr[i][1], co * nr[i][0]).normalize(), u: j / seg * 2 * Math.PI * R, v: len[i] };
  }
  for (i = 0; i < n - 1; i++) for (j = 0; j < seg; j++) {
    var v00 = vert(i, j), v01 = vert(i, j + 1), v10 = vert(i + 1, j), v11 = vert(i + 1, j + 1);
    if (prof[i][0] > 1e-5) triN(key, v00, v01, v11);
    if (prof[i + 1][0] > 1e-5) triN(key, v00, v11, v10);
  }
}
/* A round pipe through a list of points, shaded smoothly: taps, traps, rails, shackles. */
function pipe(key, pts, r, seg) {
  seg = seg || 8; var rings = [], i, j, dist = 0, u = null;
  for (i = 0; i < pts.length; i++) {
    var t = pts[Math.min(i + 1, pts.length - 1)].clone().sub(pts[Math.max(i - 1, 0)]).normalize();
    if (!u) u = Math.abs(t.y) > 0.9 ? V(1, 0, 0) : V(0, 1, 0);
    u = u.clone().addScaledVector(t, -u.dot(t)).normalize();             /* carry the same 'up' along the pipe, so it never twists */
    var w = t.clone().cross(u), ring = [];
    if (i) dist += pts[i].distanceTo(pts[i - 1]);
    for (j = 0; j <= seg; j++) { var a = j / seg * Math.PI * 2, nn = u.clone().multiplyScalar(Math.cos(a)).addScaledVector(w, Math.sin(a)); ring.push({ p: pts[i].clone().addScaledVector(nn, r), n: nn, u: a * r, v: dist }); }
    rings.push(ring);
  }
  for (i = 0; i < rings.length - 1; i++) for (j = 0; j < seg; j++) { triN(key, rings[i][j], rings[i][j + 1], rings[i + 1][j + 1]); triN(key, rings[i][j], rings[i + 1][j + 1], rings[i + 1][j]); }
}
/* in-between shades for a palette, so clean surfaces dither gently */
function fine(p, times) {
  for (var t = 0; t < (times || 1); t++) { var q = []; p.forEach(function (c, n) { if (n) { var a = p[n - 1]; q.push([(a[0] + c[0]) >> 1, (a[1] + c[1]) >> 1, (a[2] + c[2]) >> 1]); } q.push(c); }); p = q; }
  return p;
}
/* shared by the rooms' signs */
var SIGN = '"Anton", "Urbanist", sans-serif';           /* the lettering on signs and the voting screen: tall and heavy, like a fight poster */
function roundPath(g, x, y, w, h, r) {
  g.beginPath(); g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r); g.lineTo(x + w, y + h - r); g.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r); g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y); g.closePath();
}
function roundRect(g, x, y, w, h, r) { roundPath(g, x, y, w, h, r); g.fill(); }
function gorillaHand(g, x, y, s, rot) {                  /* the gorilla's own hand, pressed flat in paint: a broad square palm, three thick fingers, a thumb out to the side. s: how wide the palm is */
  g.save(); g.translate(x, y); g.rotate(rot); g.strokeStyle = g.fillStyle; g.lineJoin = 'round'; g.lineWidth = 0.24 * s;
  g.beginPath(); g.moveTo(-0.38 * s, -0.22 * s); g.lineTo(0.38 * s, -0.22 * s); g.lineTo(0.3 * s, 0.36 * s); g.lineTo(-0.3 * s, 0.36 * s); g.closePath(); g.fill(); g.stroke();
  [[-0.335, -0.1, 0.6], [0, 0, 0.68], [0.335, 0.1, 0.58]].forEach(function (f) { g.save(); g.translate(f[0] * s, -0.2 * s); g.rotate(f[1]); roundRect(g, -0.135 * s, -(f[2] + 0.1) * s, 0.27 * s, (f[2] + 0.1) * s, 0.105 * s); g.restore(); });
  g.save(); g.translate(-0.36 * s, 0.22 * s); g.rotate(-1.0); roundRect(g, -0.135 * s, -0.56 * s, 0.27 * s, 0.56 * s, 0.105 * s); g.restore();
  g.restore();
}
function cleanSign(w, h, draw, seed) { return smoothTex(signTex(w, h, draw, { seed: seed, levels: 255 })); }           /* lettering and plates, drawn sharp and left clean */
/* something flat laid on a wall: c is its middle, n the way the wall faces */
function wallDecal(key, c, w, h, n) {
  var t = V(n.z, 0, -n.x), o = c.clone().addScaledVector(n, 0.004), a = o.clone().addScaledVector(t, -w / 2), b = o.clone().addScaledVector(t, w / 2);
  quadUV(key, V(a.x, c.y - h / 2, a.z), V(b.x, c.y - h / 2, b.z), V(b.x, c.y + h / 2, b.z), V(a.x, c.y + h / 2, a.z), 0, 0, 1, 1);
}
var CLUB = { stairs: false };                      /* stairs: the blue wall also has a doorway each side, up on the top walkway (not used now: the crowd spawns in the stands) */
/* The walkout tunnels: long, dark, arched, climbing up to the arena. Only the two chosen fighters ever see them. */
var WALK = { len: 18, climb: 0.11, r: 1.6, wall: 1.3 };
function walkY(d) { return d < 1 ? 0 : -(d - 1) * WALK.climb; }      /* the tunnel floor's height, d metres back from its mouth */
var WALK_LIGHTS = lightSet([0.075, 0.075, 0.085], [0.045, 0.04, 0.036]);                           /* set when the locker room is built behind the arena's blue wall */
function hexPts(a) { var r = []; for (var k = 0; k < 6; k++) { var c = P(k, a, a * T30, 0); r.push([c.x, c.z]); } return r; }
/* flat pieces laid just above a surface: shadows and stains */
function decal(key, c, sx, sz, ry) {
  var ca = Math.cos(ry || 0), sa = Math.sin(ry || 0);
  var q = [[-sx / 2, -sz / 2], [sx / 2, -sz / 2], [sx / 2, sz / 2], [-sx / 2, sz / 2]].map(function (p) { return V(c.x + p[0] * ca + p[1] * sa, c.y, c.z - p[0] * sa + p[1] * ca); });
  quadUV(key, q[0], q[1], q[2], q[3], 0, 0, 1, 1);
}
function shadow(x, z, y, r, rz, ry) { decal('blob', V(x, y + 0.014, z), r * 2, (rz || r) * 2, ry || 0); }
/* a band of shade along the line p0-p1, darkest on the line and fading out over w metres in direction dir */
function shade(p0, p1, dir, w) { quadUV('strip', p0, p1, p1.clone().addScaledVector(dir, w), p0.clone().addScaledVector(dir, w), 0, 0, 1, 1); }
