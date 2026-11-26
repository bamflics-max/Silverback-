/* ================================================================== */
/* The street: the main lobby. This file builds its first stretch, the */
/* alley: a rough city alley at night, just after rain, with the       */
/* freight elevator at its end. The street round the corner comes next.*/
/* ================================================================== */
/* z runs up the alley: 0 at the elevator wall, 24 at its mouth on the street. x runs across it, -3.5 to 3.5 (7 m wide). */
/* On the left a loading dock sits in a nook (back to x = -5.3) from z 7.5 to 15.                                        */
var AL = { ax: 3.5, az: 24, nook: -5.3, e2: 3.9 };
var SPRAY = '"Sedgwick Ave Display", "Permanent Marker", sans-serif';
var SPRAYN = '"Sedgwick Ave", "Permanent Marker", sans-serif';                  /* the same hand with small letters, for the name */      /* sign lettering out here: sprayed straight onto the brick */

/* Night, but never murky: cold light from the sky, and a lot of lamps. The alley's lamps are split into a near half and a far half. */
function nightSet() {
  var s = lightSet([0.066, 0.082, 0.128], [0.046, 0.045, 0.05]);
  s.uni.uFogC = { value: new T.Color(0.03, 0.038, 0.058) }; s.uni.uFogD = { value: 0.026 }; s.uni.uWrap.value = 0.12;
  return s;
}
var NEAR_LIGHTS = nightSet(), FAR_LIGHTS = nightSet();
var SODIUM = [1.0, 0.66, 0.32], WARM = [1.0, 0.84, 0.62], COLD = [0.74, 0.88, 1.0], FIRE = [1.0, 0.5, 0.16], BLUE = [0.26, 0.48, 1.0];
var AT = { lift: V(0, 2.2, -1.2), sign: V(0, 5.9, 1.5), tube: V(0, 3.15, 0.9), w1: V(-3.1, 3.6, 4.6), e1: V(3.1, 3.3, 3.4), dock: V(-4.9, 4.3, 10.4), sg1: V(0, 4.4, 4.5), sg2: V(0, 4.6, 10.5), fe: V(3.45, 2.8, 11.2),
  pend: V(0.2, 5.1, 16.1), sg3: V(0, 4.5, 19), sg4: V(0, 4.6, 22.3), barrel: V(1.4, 1.25, 20.0), stoop: V(-3.05, 2.95, 19.5), e3: V(3.1, 3.7, 20.6), post: V(2.4, 6.4, 26.8) };
(function () {
  function middle() {                                    /* the lamps near the middle light both halves, so the ground shows no seam: 0 to 4 in each set */
    addLight(AT.dock, WARM, 1.7, 0, 0, 4.2, 'dock'); addLight(AT.sg2, WARM, 0.55, 0, 0, 5, 'none'); addLight(AT.fe, SODIUM, 1.2, 0, 0, 3.4, 'fe');
    addLight(AT.pend, [1.0, 0.88, 0.68], 2.0, 50, 85, 8, 'pend'); addLight(AT.sg3, WARM, 0.55, 0, 0, 5, 'none');
  }
  useLights(NEAR_LIGHTS); middle();
  addLight(AT.lift, WARM, 1.6, 0, 0, 4.5, 'lift'); addLight(AT.sign, [1.0, 0.93, 0.8], 1.5, 0, 0, 4.2, 'sign');          /* 5, 6 */
  addLight(AT.w1, SODIUM, 1.5, 0, 0, 3.6, 'wall'); addLight(AT.e1, COLD, 1.2, 0, 0, 3.4, 'wall'); addLight(AT.sg1, WARM, 0.55, 0, 0, 5, 'none');      /* 7, 8, 9 */
  addLight(AT.tube, BLUE, 1.6, 0, 0, 3.6, 'tube');                                                                        /* 10 */
  fillLights();
  useLights(FAR_LIGHTS); middle();
  addLight(AT.sg4, WARM, 0.55, 0, 0, 5, 'none'); addLight(AT.barrel, FIRE, 1.9, 0, 0, 3.2, 'fire'); addLight(AT.stoop, WARM, 1.1, 0, 0, 3.2, 'stoop');       /* 5, 6, 7 */
  addLight(AT.e3, COLD, 1.2, 0, 0, 3.4, 'wall'); addLight(AT.post, SODIUM, 1.8, 45, 80, 11, 'post');                                                       /* 8, 9 */
  addLight(V(0.2, 2.5, 35.2), WARM, 2.0, 0, 0, 4.5, 'shop'); addLight(V(6.2, 4.7, 24.9), WARM, 1.8, 0, 0, 3.4, 'champ');                                   /* 10, 11: fittings built with the street */
  fillLights();
  useLights(ARENA_LIGHTS);
})();
var STREET_LOOK = { s: 0.8, key: [1.0, 0.82, 0.62], sky: [0.17, 0.2, 0.28], ground: [0.13, 0.12, 0.12], fog: 0.026, fogC: [0.03, 0.038, 0.058] };      /* how a gorilla is lit out here */
var WIN = [];                                             /* every window, remembered, so air units and stains can hang under some of them */

/* ---------------- textures ---------------- */
function buildStreetTextures() {
  var i;
  function P_(list, n) { return fine(pal(list), n === undefined ? 2 : n); }
  /* brick in running bond: every brick a shade different, soot in broad patches, pale mortar. One sheet covers 1.6 m by 1.2 m. */
  function bricks(seed, p, mortar, soot) {
    var q = rand(seed), n1 = noise2(seed + 1, 4), n3 = noise2(seed + 2, 128), tone = [], k;
    for (k = 0; k < 8 * 16; k++) tone.push(q());
    return smoothTex(pixTex(256, 256, function (put) {
      for (var y = 0; y < 256; y++) for (var x = 0; x < 256; x++) {
        var row = y >> 4, xx = (x + (row & 1) * 16) & 255, lx = xx & 31, ly = y & 15;
        if (lx < 2 || ly < 2) { put(x, y, mortar); continue; }
        var val = 0.5 + (tone[row * 8 + (xx >> 5)] - 0.5) * 0.5 + (n3(x / 2, y / 2) - 0.5) * 0.22 + (n1(x / 64, y / 64) - 0.5) * soot;
        if (ly === 2 || lx === 2) val -= 0.1; else if (ly === 15) val += 0.07;
        put(x, y, pick(p, val, x, y));
      }
    }));
  }
  function plain(seed, p, N, amount, grit) {             /* a cast or painted surface: slow changes of tone, and a fine grit */
    var n1 = noise2(seed, 4), n2 = noise2(seed + 1, 16), n3 = noise2(seed + 2, N / 2);
    return smoothTex(pixTex(N, N, function (put) {
      for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) put(x, y, pick(p, 0.5 + ((n1(x / N * 4, y / N * 4) - 0.5) * 0.6 + (n2(x / N * 16, y / N * 16) - 0.5) * 0.3) * amount + (n3(x / 2, y / 2) - 0.5) * (grit || 0.15), x, y));
    }));
  }
  TEX.brickR = bricks(301, P_(['#2c1b17', '#3a241e', '#482d25', '#55362c', '#613f34']), [54, 50, 46], 0.5);
  TEX.brickD = bricks(305, P_(['#24211f', '#2f2b28', '#3a3531', '#45403b', '#514b45']), [44, 42, 40], 0.5);
  TEX.brickP = bricks(309, P_(['#1e2a33', '#25333d', '#2c3c48', '#344653', '#3c505e']), [30, 38, 44], 0.35);
  TEX.asphalt = (function () {                           /* wet blacktop: near black, flecked with stones, patched here and there */
    var p = P_(['#101113', '#17181b', '#1e2023', '#26282c']), n1 = noise2(321, 4), n3 = noise2(322, 128), q = rand(323);
    return smoothTex(pixTex(256, 256, function (put) {
      var x, y, k;
      for (y = 0; y < 256; y++) for (x = 0; x < 256; x++) put(x, y, pick(p, 0.45 + (n1(x / 64, y / 64) - 0.5) * 0.5 + (n3(x / 2, y / 2) - 0.5) * 0.4, x, y));
      for (k = 0; k < 700; k++) put(q() * 256, q() * 256, [58 + q() * 30, 60 + q() * 30, 64 + q() * 30]);
    }));
  })();
  TEX.walk = (function () {                              /* sidewalk: concrete slabs 1.2 m square, joints between them */
    var p = P_(['#3b3c3e', '#46474a', '#515356', '#5c5e62', '#676a6e']), n1 = noise2(331, 4), n3 = noise2(332, 128), q = rand(333), tone = [q(), q(), q(), q()];
    return smoothTex(pixTex(256, 256, function (put) {
      for (var y = 0; y < 256; y++) for (var x = 0; x < 256; x++) {
        var lx = x & 127, ly = y & 127, val = 0.5 + (tone[(y >> 7) * 2 + (x >> 7)] - 0.5) * 0.25 + (n1(x / 64, y / 64) - 0.5) * 0.3 + (n3(x / 2, y / 2) - 0.5) * 0.25;
        if (lx < 2 || ly < 2) val = 0.08;
        put(x, y, pick(p, val, x, y));
      }
    }));
  })();
  TEX.conc = plain(341, P_(['#4a4b4d', '#55575a', '#606266', '#6b6e72']), 128, 0.5, 0.2);
  TEX.roofT = plain(345, P_(['#26272a', '#2f3134', '#393b3f', '#43464b']), 128, 0.6, 0.3);
  TEX.paintG = plain(349, P_(['#1f3a2c', '#264636', '#2d5240', '#345e4a']), 64, 0.5, 0.12);
  TEX.steelK = plain(353, P_(['#26282c', '#2f3236', '#383b40', '#42454b']), 64, 0.4, 0.1);
  TEX.woodS = (function () { var p = P_(['#4a3626', '#5a422e', '#6a4e37', '#7a5b41', '#8a684b']), n = noise2(357, 3, 48), n2 = noise2(358, 16, 128); return smoothTex(pixTex(128, 128, function (put) {
    for (var y = 0; y < 128; y++) for (var x = 0; x < 128; x++) { var gv = n(x / 128 * 3, y / 128 * 48); put(x, y, pick(p, 0.5 + (gv - 0.5) * 0.7 + (n2(x / 8, y) - 0.5) * 0.2, x, y)); }
  })); })();
  TEX.shutter = (function () { var p = P_(['#2b2e33', '#363a40', '#42464d', '#4e535b', '#5a6069']), n = noise2(361, 8, 2); return smoothTex(pixTex(64, 64, function (put) {      /* a roll-down shutter: ribs across, rust creeping up from the bottom of each */
    for (var y = 0; y < 64; y++) for (var x = 0; x < 64; x++) put(x, y, pick(p, 0.5 + 0.34 * Math.sin((y % 8) / 8 * 6.283) + (n(x / 8, y / 32) - 0.5) * 0.16, x, y));
  })); })();
  TEX.awn = smoothTex(pixTex(64, 8, function (put) { for (var y = 0; y < 8; y++) for (var x = 0; x < 64; x++) put(x, y, (x >> 4) & 1 ? [214, 208, 192] : [255, 255, 255]); }));      /* awning stripes, tinted per stall */
  function windowTex(seed, lit) {                        /* a sash window: four panes in a frame. lit: 1 a bare warm room, 2 the same with a blind half down */
    var n = noise2(seed, 8);
    return smoothTex(pixTex(64, 96, function (put) {
      for (var y = 0; y < 96; y++) for (var x = 0; x < 64; x++) {
        var frame = x < 4 || x > 59 || y < 4 || y > 91 || Math.abs(x - 31.5) < 1.5 || Math.abs(y - 47.5) < 1.5, c;
        if (frame) c = lit ? [40, 33, 26] : [26, 28, 32];
        else if (lit) { var g = Math.min(1, 0.72 + y / 96 * 0.28 + (n(x / 8, y / 8) - 0.5) * 0.14) * (lit === 2 && y > 50 ? (y % 6 < 1 ? 0.5 : 0.66) : 1); c = [255 * g, 198 * g, 122 * g]; }
        else { var s = 0.4 + y / 96 * 0.6; c = [12 + 12 * s, 16 + 18 * s, 26 + 30 * s]; }
        put(x, y, c);
      }
    }, true));
  }
  TEX.winDark = windowTex(371, 0); TEX.winLit = windowTex(372, 1); TEX.winLit2 = windowTex(373, 2);
  TEX.far = (function () {                               /* the city beyond: dark blocks against the sky, a scatter of lit windows */
    var q = rand(381), W = 512, H = 128, tops = [], x, y, k;
    for (x = 0; x < W; x += 16) { var h = 30 + q() * 80; for (k = 0; k < 16; k++) tops.push(h); }
    return smoothTex(pixTex(W, H, function (put) {
      for (y = 0; y < H; y++) for (x = 0; x < W; x++) put(x, y, [9, 11, 17], y < tops[x] ? 255 : 0);
      for (k = 0; k < 520; k++) { x = Math.floor(q() * W); y = Math.floor(q() * 120); if (y < tops[x] - 4) { var c = q() < 0.8 ? [214, 164, 96] : [150, 190, 226]; put(x, y, c, 255); if (q() < 0.5) put(x + 1, y, c, 255); } }
    }, true));
  })();
  TEX.puddle = (function () {                            /* standing water: an uneven patch with soft edges */
    var n = noise2(385, 5);
    return smoothTex(pixTex(64, 64, function (put) {
      for (var y = 0; y < 64; y++) for (var x = 0; x < 64; x++) { var v = 1 - Math.hypot(x - 31.5, y - 31.5) / 31.5 + (n(x / 64 * 5, y / 64 * 5) - 0.5) * 0.9; put(x, y, [10, 12, 16], Math.round(clamp01((v - 0.3) * 4) * 150)); }
    }, true));
  })();
  TEX.streak = smoothTex(pixTex(8, 64, function (put) {  /* a sign's light smeared down the wet ground: bright by the wall, fading out */
    for (var y = 0; y < 64; y++) for (var x = 0; x < 8; x++) { var a = 1 - y / 63, e = 1 - Math.abs(x - 3.5) / 4; a = a * a * (0.35 + 0.65 * e) * 255; put(x, y, [a, a, a], 255); }
  }, true));
  TEX.softBlob = smoothTex(pixTex(64, 64, function (put) {
    for (var y = 0; y < 64; y++) for (var x = 0; x < 64; x++) { var v = clamp01(1 - Math.hypot(x - 31.5, y - 31.5) / 31.5); put(x, y, [0, 0, 0], Math.round(v * v * (3 - 2 * v) * 170)); }
  }, true));
  TEX.softStrip = smoothTex(pixTex(4, 32, function (put) { for (var y = 0; y < 32; y++) for (var x = 0; x < 4; x++) { var a = 1 - y / 31; put(x, y, [0, 0, 0], Math.round(a * a * 160)); } }, true));
  TEX.grate = smoothTex(pixTex(32, 32, function (put) { for (var y = 0; y < 32; y++) for (var x = 0; x < 32; x++) put(x, y, (x % 4 < 1 || y % 8 < 1) ? [52, 55, 60] : [8, 9, 10], (x % 4 < 1 || y % 8 < 1) ? 255 : 150); }));      /* an open steel grating */

  /* lit signs */
  TEX.sbSign = cleanSign(1024, 300, function (g) {
    g.scale(2, 2); g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '400 96px ' + LOGO; g.lineJoin = 'round';
    g.strokeStyle = '#2f6bff'; g.lineWidth = 9; g.strokeText('Silverback', 256, 78); g.fillStyle = '#f4f7ff'; g.fillText('Silverback', 256, 78);
  }, 801);
  TEX.brickY = bricks(313, P_(['#322e28', '#3f3a32', '#4b453b', '#575045', '#625a4e']), [44, 42, 39], 0.6);
  TEX.card = plain(391, P_(['#4b3b29', '#584630', '#655138', '#715c41']), 64, 0.5, 0.12);
  TEX.dripS = (function () {                            /* dirty water that has run down a wall: soft dark streaks, thinning as they fall */
    var q = rand(393);
    return smoothTex(pixTex(64, 128, function (put) {
      var x, y, k; for (y = 0; y < 128; y++) for (x = 0; x < 64; x++) put(x, y, [12, 11, 10], 0);
      for (k = 0; k < 9; k++) { var cx = 4 + q() * 56, len = 40 + q() * 86, w = 1 + q() * 2.5; for (y = 0; y < len; y++) for (x = -4; x <= 4; x++) { var a = (1 - y / len) * Math.max(0, 1 - Math.abs(x) / w) * 150; if (a > 2) put(cx + x + Math.sin(y * 0.07 + k) * 1.5, 127 - y, [12, 11, 10], Math.min(200, a)); } }
    }, true));
  })();
  TEX.coneG = smoothTex(pixTex(4, 64, function (put) { for (var y = 0; y < 64; y++) for (var x = 0; x < 4; x++) { var a = Math.pow(y / 63, 2.2) * 255; put(x, y, [a, a, a], 255); } }, true));      /* a lamp's beam in damp air: bright at the lamp, gone by the ground */
  /* paint, sprayed straight onto the brick: soft at the edges, thin in places, missing where the mortar sits back */
  function sprayTex(wm, hm, draw, seed, base, S) {       /* wm by hm metres. base: how high its bottom edge is, so the brick courses line up */
    S = S || 150;
    var W = Math.round(wm * S), H = Math.round(hm * S), c = document.createElement('canvas'), q = rand(seed), k; c.width = W; c.height = H;
    var g = c.getContext('2d'); draw(g, q, S);
    g.shadowBlur = 0; g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000';
    for (k = 0; k < W * H / 230; k++) { g.globalAlpha = 0.2 + q() * 0.5; g.beginPath(); g.arc(q() * W, q() * H, 0.5 + q() * 2.4, 0, 7); g.fill(); }
    if (base !== undefined) { g.globalAlpha = 0.16; for (var y = Math.ceil(base / 0.075) * 0.075; y < base + hm; y += 0.075) g.fillRect(0, H - (y - base) * S - 0.012 * S, W, 0.012 * S); }
    var t = smoothTex(new T.CanvasTexture(c)); t.userData = { w: W, h: H }; return t;
  }
  function spray(g, S, colour, blur) { g.fillStyle = colour; g.strokeStyle = colour; g.shadowColor = colour; g.shadowBlur = (blur === undefined ? 0.05 : blur) * S; g.lineCap = 'round'; g.lineJoin = 'round'; }
  function drips(g, S, q, x0, x1, y, n, colour) {         /* where the paint went on too thick and ran */
    spray(g, S, colour, 0.012);
    for (var k = 0; k < n; k++) { var x = x0 + q() * (x1 - x0), len = (0.1 + q() * q() * 0.6) * S, w = (0.012 + q() * 0.014) * S; g.lineWidth = w; g.beginPath(); g.moveTo(x, y - 0.06 * S); g.lineTo(x, y + len); g.stroke(); g.beginPath(); g.arc(x, y + len, w * 0.8, 0, 7); g.fill(); }
  }
  function paintHand(g, x, y, size, rot) { gorillaHand(g, x, y, size, rot); }      /* a big flat hand, pressed on in paint */
  TEX.logoS = sprayTex(6.0, 2.3, function (g, q, S) {     /* the name, across the brick over the door */
    var W = 6.0 * S, size = 1.5 * S, by = 1.32 * S; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.font = '400 ' + size + 'px ' + SPRAYN;
    var w = g.measureText('Silverback').width; if (w > 5.0 * S) { size *= 5.0 * S / w; g.font = '400 ' + size + 'px ' + SPRAYN; }
    function word(x, y, colour, fat, blur) { spray(g, S, colour, blur); g.lineWidth = fat * S; g.strokeText('Silverback', x, y); g.fillText('Silverback', x, y); }
    word(W / 2 + 0.07 * S, by + 0.08 * S, '#2f6bff', 0.075, 0.07);
    g.lineWidth = 0.1 * S; g.beginPath(); g.moveTo(0.7 * S, by + 0.42 * S); g.quadraticCurveTo(W / 2, by + 0.26 * S, W - 0.6 * S, by + 0.38 * S); g.stroke();
    drips(g, S, q, 1.0 * S, W - 1.0 * S, by + 0.44 * S, 7, '#2f6bff');
    word(W / 2, by, '#e9e5da', 0.05, 0.04); g.shadowBlur = 0; g.strokeText('Silverback', W / 2, by); g.fillText('Silverback', W / 2, by);
    drips(g, S, q, 0.9 * S, W - 0.9 * S, by + 0.04 * S, 9, '#e9e5da');
  }, 811, 3.62, 200);
  TEX.hands = [841, 842].map(function (seed) {
    return sprayTex(1.7, 2.5, function (g, q, S) {
      var cols = ['#d9d5ca', '#d9d5ca', '#2f6bff', '#d9d5ca', '#bdb9ae'];
      for (var k = 0; k < 9; k++) { spray(g, S, cols[k % 5], 0.012); paintHand(g, (0.34 + q() * 1.0) * S, (0.5 + q() * 1.6) * S, (0.25 + q() * 0.05) * S, (q() - 0.5) * 0.9); }
    }, seed, 0.3);
  });
  TEX.tagClub = sprayTex(2.9, 1.05, function (g, q, S) {  /* the way in: the arrow points along the wall to the elevator */
    spray(g, S, '#e9e5da', 0.03); g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.font = '400 ' + 0.52 * S + 'px ' + SPRAY; g.fillText('Fight club', 0.2 * S, 0.52 * S);
    g.lineWidth = 0.065 * S; g.beginPath(); g.moveTo(0.22 * S, 0.76 * S); g.lineTo(2.62 * S, 0.72 * S); g.moveTo(2.34 * S, 0.57 * S); g.lineTo(2.66 * S, 0.72 * S); g.lineTo(2.36 * S, 0.9 * S); g.stroke();
    drips(g, S, q, 0.3 * S, 2.4 * S, 0.76 * S, 4, '#e9e5da');
  }, 821, 1.55);
  TEX.tagKO = sprayTex(1.7, 1.4, function (g, q, S) { spray(g, S, '#9e2f28', 0.05); g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.font = '400 ' + 1.05 * S + 'px ' + SPRAY; g.fillText('KO', 0.85 * S, 1.0 * S); drips(g, S, q, 0.3 * S, 1.4 * S, 1.0 * S, 5, '#9e2f28'); }, 822);
  TEX.tagCrown = sprayTex(1.6, 1.3, function (g, q, S) {
    spray(g, S, '#2f6bff', 0.04); g.lineWidth = 0.075 * S;
    g.beginPath(); g.moveTo(0.22 * S, 1.0 * S); g.lineTo(0.16 * S, 0.36 * S); g.lineTo(0.5 * S, 0.7 * S); g.lineTo(0.8 * S, 0.2 * S); g.lineTo(1.1 * S, 0.7 * S); g.lineTo(1.44 * S, 0.36 * S); g.lineTo(1.38 * S, 1.0 * S); g.closePath(); g.stroke();
    drips(g, S, q, 0.3 * S, 1.3 * S, 1.0 * S, 3, '#2f6bff');
  }, 823, 1.2);
  TEX.scr = [['#d9d5ca', 831], ['#0b0b0d', 832], ['#2f6bff', 833], ['#d9d5ca', 834], ['#9e2f28', 835], ['#0b0b0d', 836]].map(function (c) {      /* tags: somebody's name, written fast */
    return sprayTex(1.25, 0.75, function (g, q, S) {
      spray(g, S, c[0], 0.012); g.lineWidth = 0.024 * S; var x = 0.12 * S, y = (0.3 + q() * 0.2) * S, k; g.beginPath(); g.moveTo(x, y);
      for (k = 0; k < 7; k++) { var nx = x + (0.08 + q() * 0.14) * S, ny = (0.14 + q() * 0.42) * S; g.bezierCurveTo(x + (q() - 0.3) * 0.2 * S, y - (q() - 0.5) * 0.5 * S, nx - (q() - 0.3) * 0.2 * S, ny + (q() - 0.5) * 0.5 * S, nx, ny); x = nx; y = ny; }
      g.stroke(); g.beginPath(); g.moveTo(0.1 * S, 0.63 * S); g.quadraticCurveTo(0.6 * S, 0.53 * S, 1.12 * S, 0.65 * S); g.stroke();
    }, c[1]);
  });
  /* what the things in the alley are made of */
  function canvasTex(w, h, draw, seed) { var c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), rand(seed), w, h); var t = smoothTex(new T.CanvasTexture(c)); t.wrapS = t.wrapT = T.RepeatWrapping; t.userData = { w: w, h: h }; return t; }
  function mottle(g, q, w, h, n, lo, hi) { for (var k = 0; k < n; k++) { g.globalAlpha = lo + q() * (hi - lo); g.fillStyle = q() < 0.5 ? '#000' : '#fff'; var r = 2 + q() * w * 0.06; g.beginPath(); g.ellipse(q() * w, q() * h, r, r * (0.5 + q()), q() * 3, 0, 7); g.fill(); } g.globalAlpha = 1; }
  function runs(g, q, w, h, n, colour, top) {            /* rust or dirt that has run down from n places: thin streaks that fade */
    for (var k = 0; k < n; k++) { var x = q() * w, y = q() * h * top, len = h * (0.08 + q() * 0.35), ww = 1 + q() * w * 0.014, gr = g.createLinearGradient(0, y, 0, y + len); gr.addColorStop(0, 'rgba(' + colour + ',0.55)'); gr.addColorStop(1, 'rgba(' + colour + ',0)'); g.fillStyle = gr; g.fillRect(x, y, ww, len); }
  }
  function blotch(g, q, w, h, n, colour) {               /* where the paint has gone and the steel has rusted: ragged patches, each a cluster of small ones */
    g.fillStyle = 'rgb(' + colour + ')';
    for (var k = 0; k < n; k++) { var cx = q() * w, cy = q() * h, r = w * (0.02 + q() * 0.05); for (var j = 0; j < 16; j++) { g.globalAlpha = 0.14 + q() * 0.2; g.beginPath(); g.ellipse(cx + (q() - 0.5) * r * 2.4, cy + (q() - 0.5) * r * 1.6, r * (0.2 + q() * 0.55), r * (0.15 + q() * 0.45), q() * 3, 0, 7); g.fill(); } }
    g.globalAlpha = 1;
  }
  function drumTex(seed, base) {                         /* a painted steel drum, once round and bottom to top: chipped, rusting from the rims, a worn stencil */
    return canvasTex(256, 256, function (g, q, w, h) {
      g.fillStyle = base; g.fillRect(0, 0, w, h); mottle(g, q, w, h, 110, 0.012, 0.04);
      g.globalAlpha = 0.13; g.fillStyle = '#d8d2c2'; g.fillRect(30 + q() * 150, 98, 54, 30); g.globalAlpha = 1;
      blotch(g, q, w, h, 13, '66,38,24'); runs(g, q, w, h, 18, '62,36,23', 0.8);
      var gr = g.createLinearGradient(0, h, 0, h - 50); gr.addColorStop(0, 'rgba(40,25,17,0.9)'); gr.addColorStop(1, 'rgba(40,25,17,0)'); g.fillStyle = gr; g.fillRect(0, h - 50, w, 50);
      gr = g.createLinearGradient(0, 0, 0, 22); gr.addColorStop(0, 'rgba(52,31,20,0.7)'); gr.addColorStop(1, 'rgba(52,31,20,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, 22);
      g.strokeStyle = 'rgba(190,186,178,0.16)'; g.lineWidth = 1; for (var k = 0; k < 40; k++) { var x = q() * w, y = q() * h; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (q() - 0.5) * 34, y + (q() - 0.5) * 10); g.stroke(); }
    }, seed);
  }
  TEX.drumB = drumTex(861, '#22344f'); TEX.drumR = drumTex(862, '#43291d'); TEX.drumK = drumTex(863, '#1d1f21');
  TEX.coneT = canvasTex(64, 128, function (g, q, w, h) {  /* a road cone, bottom to top: orange, a grey-white collar, scuffed and filthy at the foot */
    g.fillStyle = '#a2441a'; g.fillRect(0, 0, w, h); g.fillStyle = '#a9a69d'; g.fillRect(0, h * 0.26, w, h * 0.2); mottle(g, q, w, h, 90, 0.04, 0.12);
    var gr = g.createLinearGradient(0, h, 0, h * 0.62); gr.addColorStop(0, 'rgba(22,18,15,0.85)'); gr.addColorStop(1, 'rgba(22,18,15,0)'); g.fillStyle = gr; g.fillRect(0, h * 0.62, w, h * 0.38);
    runs(g, q, w, h, 12, '30,24,20', 0.7);
  }, 864);
  TEX.bagT = canvasTex(128, 128, function (g, q, w, h) {  /* a bin bag: black plastic pulled into creases that run down from the knot */
    g.fillStyle = '#17181b'; g.fillRect(0, 0, w, h);
    for (var k = 0; k < 70; k++) { var x = q() * w, bend = (q() - 0.5) * 18; g.strokeStyle = q() < 0.5 ? 'rgba(120,124,132,' + (0.1 + q() * 0.2) + ')' : 'rgba(0,0,0,' + (0.25 + q() * 0.3) + ')'; g.lineWidth = 0.6 + q() * 1.6; g.beginPath(); g.moveTo(x, 0); g.quadraticCurveTo(x + bend, h * 0.5, x + bend * 0.4 + (q() - 0.5) * 10, h * (0.6 + q() * 0.4)); g.stroke(); }
  }, 865);
  TEX.tireT = canvasTex(64, 128, function (g, q, w, h) {  /* a tyre, round its section: the tread across the middle, plain walls either side */
    g.fillStyle = '#131316'; g.fillRect(0, 0, w, h);
    var t0 = h * 0.34, t1 = h * 0.62, y, x;
    g.fillStyle = '#1e1f23'; g.fillRect(0, t0, w, t1 - t0);
    g.fillStyle = '#08080a'; for (y = t0 + 5; y < t1; y += 9) g.fillRect(0, y, w, 2.5);
    g.strokeStyle = '#08080a'; g.lineWidth = 3; for (x = -8; x < w + 8; x += 16) { g.beginPath(); g.moveTo(x, t0); g.lineTo(x + 8, (t0 + t1) / 2); g.lineTo(x, t1); g.stroke(); }
    g.fillStyle = 'rgba(70,72,78,0.5)'; g.fillRect(0, h * 0.14, w, 2); g.fillRect(0, h * 0.82, w, 2);
  }, 866);
  TEX.hazardS = canvasTex(128, 128, function (g, q, w, h) {      /* warning stripes, painted long ago */
    g.fillStyle = '#b7922a'; g.fillRect(0, 0, w, h); g.fillStyle = '#17171a';
    for (var k = -2; k < 4; k++) { g.beginPath(); g.moveTo(k * 64, h); g.lineTo(k * 64 + 32, h); g.lineTo(k * 64 + 32 + h, 0); g.lineTo(k * 64 + h, 0); g.closePath(); g.fill(); }
    mottle(g, q, w, h, 160, 0.05, 0.16); runs(g, q, w, h, 12, '40,30,22', 0.6);
  }, 867);
  TEX.galvT = plain(868, P_(['#3a4047', '#444b53', '#4e565f', '#596169']), 64, 0.6, 0.14);
  /* the street's own */
  TEX.boothSign = [['Walkouts', 891], ['Fight cards', 892], ['Bananas', 893]].map(function (o) {      /* a booth's board: what it sells, sprayed on */
    return sprayTex(1.7, 0.42, function (g, q, S) { spray(g, S, '#e9e5da', 0.02); g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.font = '400 ' + 0.3 * S + 'px ' + SPRAY; g.fillText(o[0], 0.85 * S, 0.31 * S); }, o[1], undefined, 220);
  });
  TEX.tagCos = sprayTex(4.4, 1.15, function (g, q, S) { spray(g, S, '#e9e5da', 0.035); g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.font = '400 ' + 0.8 * S + 'px ' + SPRAY; g.fillText('Cosmetics', 2.2 * S, 0.8 * S); drips(g, S, q, 0.5 * S, 3.9 * S, 0.8 * S, 6, '#e9e5da'); }, 881, 3.7);
  TEX.tagChamp = sprayTex(4.8, 1.15, function (g, q, S) {
    spray(g, S, '#e9e5da', 0.035); g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.font = '400 ' + 0.8 * S + 'px ' + SPRAY; g.fillText('Champions', 2.4 * S, 0.8 * S); drips(g, S, q, 0.5 * S, 4.3 * S, 0.8 * S, 6, '#e9e5da');
    spray(g, S, '#2f6bff', 0.03); g.lineWidth = 0.06 * S; g.beginPath(); g.moveTo(0.5 * S, 0.98 * S); g.quadraticCurveTo(2.4 * S, 0.9 * S, 4.3 * S, 0.99 * S); g.stroke();
  }, 882, 3.25);
  TEX.champ = [];
  for (var cn = 0; cn < 12; cn++) TEX.champ.push((function (n) {      /* a champion's bill: a number, a head and shoulders in shadow, room for a name */
    var W = 210, H = 300, c = document.createElement('canvas'), q = rand(870 + n), k, j; c.width = W; c.height = H;
    var g = c.getContext('2d'), tint = ['#2f6bff', '#9e2f28', '#b58a2e', '#66707c'][n % 4];
    g.fillStyle = '#141416'; g.fillRect(0, 0, W, H);
    var gr = g.createRadialGradient(W / 2, H * 0.42, 10, W / 2, H * 0.42, H * 0.6); gr.addColorStop(0, tint); gr.addColorStop(1, 'rgba(20,20,22,0)'); g.globalAlpha = 0.6; g.fillStyle = gr; g.fillRect(0, 0, W, H); g.globalAlpha = 1;
    g.fillStyle = '#0a0a0c'; g.beginPath(); g.ellipse(W / 2, H * 0.8, W * 0.53, H * 0.3, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(W / 2, H * 0.44, W * 0.2, H * 0.17, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(W / 2, H * 0.34, W * 0.15, H * 0.1, 0, 0, 7); g.fill();
    g.fillStyle = '#e9e5da'; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.font = '400 60px ' + SIGN; g.fillText('#' + (n + 1), 12, 60);
    g.fillRect(0, H - 64, W, 64); g.fillStyle = '#141416'; g.textAlign = 'center'; g.font = '400 30px ' + SIGN; g.fillText('Champion', W / 2, H - 30); g.font = '650 12px "Urbanist", sans-serif'; g.fillText('Name goes here', W / 2, H - 11);
    for (k = 0; k < 12; k++) { var x = q() * W, y = q() * H, r = (0.1 + q() * 0.3) * W, sg = g.createRadialGradient(x, y, 0, x, y, r); sg.addColorStop(0, 'rgba(40,34,26,0.28)'); sg.addColorStop(1, 'rgba(40,34,26,0)'); g.fillStyle = sg; g.fillRect(x - r, y - r, r * 2, r * 2); }
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000';
    for (k = 0; k < n % 3; k++) { var cx = q() < 0.5 ? 0 : W, cy = q() < 0.5 ? H : 0, rr = (0.08 + q() * 0.14) * W; g.beginPath(); for (j = 0; j < 11; j++) { var a = j / 11 * 6.283, d = rr * (0.55 + q() * 0.8); if (j) g.lineTo(cx + Math.cos(a) * d, cy + Math.sin(a) * d * 1.4); else g.moveTo(cx + d, cy); } g.fill(); }
    var t = smoothTex(new T.CanvasTexture(c)); t.userData = { w: W, h: H }; return t;
  })(cn));
  TEX.linkS = canvasTex(64, 64, function (g, q, w, h) { g.strokeStyle = '#8a9099'; g.lineWidth = 4.5; g.lineCap = 'square'; g.beginPath(); g.moveTo(-8, -8); g.lineTo(72, 72); g.moveTo(-8, 72); g.lineTo(72, -8); g.stroke(); }, 883);      /* chain-link: one diamond */
  TEX.tarpT = canvasTex(128, 128, function (g, q, w, h) {  /* a tarpaulin: fold lines from when it was packed, pulled creases, dirt */
    g.fillStyle = '#9a9a9a'; g.fillRect(0, 0, w, h); mottle(g, q, w, h, 120, 0.03, 0.1);
    for (var k = 1; k < 4; k++) { g.fillStyle = 'rgba(255,255,255,0.16)'; g.fillRect(k * 32, 0, 1.5, h); g.fillRect(0, k * 32, w, 1.5); g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(k * 32 + 1.5, 0, 1.5, h); g.fillRect(0, k * 32 + 1.5, w, 1.5); }
    runs(g, q, w, h, 14, '30,26,22', 0.6);
  }, 884);
  TEX.leatherT = canvasTex(128, 256, function (g, q, w, h) {      /* a heavy bag, once round and bottom to top: worn pale where it gets hit, a seam, two bands of tape */
    g.fillStyle = '#8a8a8a'; g.fillRect(0, 0, w, h); mottle(g, q, w, h, 200, 0.03, 0.1);
    var gr = g.createLinearGradient(0, h * 0.2, 0, h * 0.75); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.22)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(10, 0, 2, h); g.fillStyle = 'rgba(210,210,214,0.75)'; g.fillRect(0, h * 0.3, w, 16); g.fillRect(0, h * 0.62, w, 12);
    g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 1; for (var k = 0; k < 60; k++) { var x = q() * w, y = q() * h; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (q() - 0.5) * 20, y + (q() - 0.5) * 20); g.stroke(); }
  }, 885);
  TEX.court = (function () {                             /* the lines of a half court, rolled on years ago: the hoop is at the right-hand edge */
    var c = document.createElement('canvas'), q = rand(886), k; c.width = 580; c.height = 490; var g = c.getContext('2d');
    g.strokeStyle = '#d9d5ca'; g.lineWidth = 6; g.strokeRect(3, 65, 574, 360); g.beginPath(); g.arc(3, 245, 180, -Math.PI / 2, Math.PI / 2); g.stroke(); g.beginPath(); g.moveTo(420, 65); g.lineTo(420, 425); g.stroke();
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000'; for (k = 0; k < 2600; k++) { g.globalAlpha = 0.3 + q() * 0.6; g.beginPath(); g.arc(q() * 580, q() * 490, 1 + q() * 6, 0, 7); g.fill(); }
    var t = smoothTex(new T.CanvasTexture(c)); t.userData = { w: 580, h: 490 }; return t;
  })();
  /* bills pasted on a wall, some half torn off */
  TEX.meterF = canvasTex(128, 128, function (g, q, w, h) {      /* an electric meter's face under its glass: dial marks, the counter, the spinning disc's edge */
    g.clearRect(0, 0, w, h); var c = w / 2;
    g.fillStyle = '#9aa0a6'; g.beginPath(); g.arc(c, c, 62, 0, 7); g.fill();                   /* the steel rim */
    g.fillStyle = '#e8e4da'; g.beginPath(); g.arc(c, c, 55, 0, 7); g.fill();
    g.strokeStyle = '#2a2a2a'; g.lineWidth = 1.5; for (var k = 0; k < 5; k++) { var a = -2.4 + k * 1.2, ax = c - 26 + k * 13; g.beginPath(); g.arc(ax, 46, 5.5, 0, 7); g.stroke(); g.beginPath(); g.moveTo(ax, 46); g.lineTo(ax + Math.cos(a + k) * 4.5, 46 + Math.sin(a + k) * 4.5); g.stroke(); }
    g.fillStyle = '#16181a'; g.fillRect(c - 24, 62, 48, 12); g.fillStyle = '#d9d5ca'; g.font = '600 10px "Urbanist", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('0 4 7 1 9', c, 68.5);
    g.fillStyle = '#3a3d40'; g.fillRect(c - 30, 84, 60, 3); g.fillStyle = '#9e2a22'; g.fillRect(c - 4, 83, 8, 5);
    g.fillStyle = '#2a2a2a'; g.font = '600 8px "Urbanist", sans-serif'; g.fillText('kWh', c, 97);
    var gl = g.createRadialGradient(c - 18, c - 22, 2, c - 18, c - 22, 40); gl.addColorStop(0, 'rgba(255,255,255,0.55)'); gl.addColorStop(1, 'rgba(255,255,255,0)');      /* the glass catching the light */
    g.fillStyle = gl; g.beginPath(); g.arc(c, c, 55, 0, 7); g.fill();
  }, 917);
  TEX.callL = canvasTex(256, 96, function (g, q, w, h) {      /* CALL, stamped into a plate */
    g.clearRect(0, 0, w, h); g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '400 64px "Anton", sans-serif';
    g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillText('CALL', w / 2 + 2, h / 2 + 3); g.fillStyle = '#d6d2c6'; g.fillText('CALL', w / 2, h / 2);
  }, 918);
  TEX.couchF = plain(919, P_(['#2a2522', '#302a26', '#36302b', '#3c3530']), 64, 0.55, 0.16);      /* worn brown cloth: the fire does the warming */
  TEX.bill = [['#c9c2b0', '#141312', '#2f6bff', 851], ['#b7b1a1', '#141312', '#9e2f28', 852], ['#1a1a1c', '#d9d5ca', '#2f6bff', 853]].map(function (o) {
    var S = 300, W = Math.round(0.6 * S), H = Math.round(0.85 * S), c = document.createElement('canvas'), q = rand(o[3]), k, j; c.width = W; c.height = H;
    var g = c.getContext('2d'); g.fillStyle = o[0]; g.fillRect(0, 0, W, H);
    g.fillStyle = o[2]; g.fillRect(0, H * 0.56, W, H * 0.12);
    g.fillStyle = o[1]; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.font = '400 ' + H * 0.21 + 'px ' + SIGN; g.fillText('Fight', W / 2, H * 0.27); g.fillText('night', W / 2, H * 0.49);
    g.font = '650 ' + H * 0.052 + 'px "Urbanist", sans-serif'; g.fillText('Every night', W / 2, H * 0.78); g.fillText('Take the elevator down', W / 2, H * 0.86);
    g.fillStyle = '#f1eee6'; g.font = '400 ' + H * 0.085 + 'px ' + SIGN; g.fillText('Silverback', W / 2, H * 0.65);
    for (k = 0; k < 16; k++) { var x = q() * W, y = q() * H, r = (0.1 + q() * 0.3) * W, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(40,34,26,0.3)'); gr.addColorStop(1, 'rgba(40,34,26,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000';
    for (k = 0; k < 2 + o[3] % 3; k++) {
      var cx = q() < 0.5 ? 0 : W, cy = q() < 0.6 ? H : q() * H, rr = (0.14 + q() * 0.26) * W; g.beginPath();
      for (j = 0; j < 11; j++) { var a = j / 11 * 6.283, d = rr * (0.55 + q() * 0.8); if (j) g.lineTo(cx + Math.cos(a) * d, cy + Math.sin(a) * d * 1.5); else g.moveTo(cx + d, cy); }
      g.fill();
    }
    var t = smoothTex(new T.CanvasTexture(c)); t.userData = { w: W, h: H }; return t;
  });
}

/* ---------------- small builders ---------------- */
/* a wall from (x0, z0) to (x1, z1) that faces (nx, nz) */
function wallQ(key, x0, z0, x1, z1, y0, y1, nx, nz) {
  quad(key, V(x0, y0, z0), V(x1, y0, z1), V(x1, y1, z1), V(x0, y1, z0), V((x0 + x1) / 2 - nx * 5, (y0 + y1) / 2, (z0 + z1) / 2 - nz * 5));
}
/* something flat hung on a wall that faces (nx, nz): its middle is at (x, y, z) */
function hang(key, x, y, z, w, h, nx, nz, off) {
  var dx = nz, dz = -nx, o = off === undefined ? 0.03 : off, cx = x + nx * o, cz = z + nz * o;
  quadUV(key, V(cx - dx * w / 2, y - h / 2, cz - dz * w / 2), V(cx + dx * w / 2, y - h / 2, cz + dz * w / 2), V(cx + dx * w / 2, y + h / 2, cz + dz * w / 2), V(cx - dx * w / 2, y + h / 2, cz - dz * w / 2), 0, 0, 1, 1);
}
/* rows of sash windows along a wall, a few of them lit, each on a stone sill */
function windowsOn(x0, z0, x1, z1, nx, nz, floors, count, seed, litShare, boardShare) {
  var q = rand(seed), len = Math.hypot(x1 - x0, z1 - z0), ux = (x1 - x0) / len, uz = (z1 - z0) / len, ry = Math.atan2(-uz, ux);
  floors.forEach(function (y) {
    for (var i = 0; i < count; i++) {
      var s = (i + 0.5) / count * len, x = x0 + ux * s, z = z0 + uz * s, r = q(), share = litShare === undefined ? 0.22 : litShare;
      var key = r < share * 0.6 ? 'winLit' : r < share ? 'winLit2' : r > 1 - (boardShare || 0) ? 'boards' : 'winDark';
      hang(key, x, y + 0.85, z, 1.1, 1.7, nx, nz);
      box('conc', V(x + nx * 0.06, y - 0.06, z + nz * 0.06), 1.34, 0.1, 0.18, ry);                          /* a sill under it, a lintel over it */
      box('conc', V(x + nx * 0.04, y + 1.8, z + nz * 0.04), 1.34, 0.16, 0.1, ry);
      WIN.push({ x: x, y: y, z: z, nx: nx, nz: nz, key: key });
    }
  });
}
/* a roll-down shutter in a wall that faces (nx, nz), its foot on the ground at (x, z). open: how far it is rolled up (0 shut) */
function shutterAt(x, z, w, h, nx, nz, open, y0) {
  var ry = Math.atan2(nx, nz); y0 = y0 || 0;
  if (open) hang('dark', x, y0 + open / 2, z, w, open, nx, nz, 0.02);
  hang('shutter', x, y0 + (h + (open || 0)) / 2, z, w, h - (open || 0), nx, nz, 0.05);
  box('steelK', V(x + nx * 0.06, y0 + h + 0.12, z + nz * 0.06), w + 0.2, 0.24, 0.2, ry);             /* the box it rolls up into */
  [-1, 1].forEach(function (s) { box('steelK', V(x + nx * 0.05 + nz * s * (w / 2 + 0.04), y0 + h / 2, z + nz * 0.05 - nx * s * (w / 2 + 0.04)), 0.08, h, 0.1, ry); });
}
/* light from a sign or lamp smeared along wet ground: from the foot of the wall at (x, z), w wide, reaching len in direction (nx, nz) */
function streak(key, x, z, w, len, nx, nz) {
  var dx = nz, dz = -nx, y = 0.01;
  quadUV(key, V(x - dx * w / 2, y, z - dz * w / 2), V(x + dx * w / 2, y, z + dz * w / 2), V(x + dx * w / 2 + nx * len, y, z + dz * w / 2 + nz * len), V(x - dx * w / 2 + nx * len, y, z - dz * w / 2 + nz * len), 0, 0, 1, 1);
}
function glowPlate(group, tex, w, h, pos, facing, roll) {                                              /* a sign that makes its own light */
  if (!tex) return null;
  var m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.4, side: T.DoubleSide }));
  m.position.copy(pos); m.lookAt(pos.clone().add(facing)); if (roll) m.rotateZ(roll); group.add(m); return m;
}
function streetLamp(group, L, footX, footZ) {            /* a tall post with an arm out over the road and a glowing head */
  var p = L.pos, top = p.y + 0.35;
  lathe('steelK', V(footX, 0, footZ), [[0.16, 0], [0.16, 0.5], [0.085, 0.62], [0.07, top - 0.1], [0.06, top]], 10);
  pipe('steelK', [V(footX, top - 0.05, footZ), V((footX + p.x) / 2, top + 0.12, (footZ + p.z) / 2), V(p.x, top - 0.1, p.z)], 0.05, 8);
  box('steelK', V(p.x, p.y + 0.2, p.z), 0.34, 0.14, 0.7, 0);
  var head = new T.Mesh(new T.BoxGeometry(0.26, 0.05, 0.56), new T.MeshBasicMaterial({ color: 0xffd9a0 })); head.position.set(p.x, p.y + 0.11, p.z); group.add(head); L.bulb = head;
  lampHalo(group, V(p.x, p.y + 0.05, p.z), 2.6, L, 0xffb060);
}
function wallLamp(group, L, nx, nz) {                    /* a caged lamp on a short arm */
  var p = L.pos, ry = Math.atan2(nx, nz);
  box('steelK', V(p.x - nx * 0.22, p.y + 0.1, p.z - nz * 0.22), 0.16, 0.2, 0.34, ry);
  lathe('steelK', V(p.x, p.y + 0.06, p.z), [[0.16, 0], [0.05, 0.1], [0.0, 0.1]], 10);
  lampBulb(group, V(p.x, p.y, p.z), 0.065, L, 0xffd49a); lampHalo(group, p, 1.5, L, 0xffb060);
}
function chainFence(x0, z0, x1, z1, h, nx, nz) {         /* chain-link on posts with a top rail */
  var len = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(len / 2.6)), i;
  quad('fenceS', V(x0, 0.06, z0), V(x1, 0.06, z1), V(x1, h, z1), V(x0, h, z0), V((x0 + x1) / 2 - nx * 5, 1, (z0 + z1) / 2 - nz * 5));
  for (i = 0; i <= n; i++) { var x = x0 + (x1 - x0) * i / n, z = z0 + (z1 - z0) * i / n; pipe('steelG', [V(x, 0, z), V(x, h + 0.06, z)], 0.035, 8); }
  pipe('steelG', [V(x0, h, z0), V(x1, h, z1)], 0.028, 8); pipe('steelG', [V(x0, 0.08, z0), V(x1, 0.08, z1)], 0.02, 6);
}
/* ---------------- shapes that are not square to the world ---------------- */
function xf(x, y, z, rx, ry, rz) { return new T.Matrix4().makeRotationFromEuler(new T.Euler(rx || 0, ry || 0, rz || 0, 'YXZ')).setPosition(x, y, z); }
/* a box that can lean or tilt: M places the object, (lx, ly, lz) is the box's middle within it */
function obox(key, M, lx, ly, lz, sx, sy, sz) {
  var c = [], i, mid = V(lx, ly, lz).applyMatrix4(M);
  for (i = 0; i < 8; i++) c.push(V(lx + (i & 1 ? sx : -sx) / 2, ly + (i & 2 ? sy : -sy) / 2, lz + (i & 4 ? sz : -sz) / 2).applyMatrix4(M));
  [[0, 1, 3, 2], [4, 5, 7, 6], [0, 1, 5, 4], [2, 3, 7, 6], [0, 2, 6, 4], [1, 3, 7, 5]].forEach(function (f) { quad(key, c[f[0]], c[f[1]], c[f[2]], c[f[3]], mid); });
}
/* a lumpy, soft shape sitting on the ground at c: a full trash bag, a bundle */
function blob(key, c, rx, ry, rz, seed, yaw) {
  var q = rand(seed), ph = [q() * 6.28, q() * 6.28, q() * 6.28, q() * 6.28], nu = 12, nv = 8, ca = Math.cos(yaw || 0), sa = Math.sin(yaw || 0), g = [], i, j, mid = V(c.x, c.y + ry * 0.6, c.z);
  for (j = 0; j <= nv; j++) {
    var v = j / nv * Math.PI, row = [];
    for (i = 0; i < nu; i++) {
      var u = i / nu * 2 * Math.PI, r = 1 + 0.14 * Math.sin(3 * u + ph[0]) * Math.sin(2 * v + ph[1]) + 0.1 * Math.sin(5 * u + ph[2]) * Math.sin(3 * v + ph[3]) + 0.06 * Math.sin(2 * u + ph[3]);
      var x = Math.sin(v) * Math.cos(u) * rx * r, y = Math.max(-0.6, Math.cos(v) * r) * ry + 0.6 * ry, z = Math.sin(v) * Math.sin(u) * rz * r;
      row.push(V(c.x + x * ca + z * sa, c.y + y, c.z - x * sa + z * ca));
    }
    g.push(row);
  }
  function vert(j, i) {
    i = (i + nu) % nu;
    var p = g[j][i], du = g[j][(i + 1) % nu].clone().sub(g[j][(i + nu - 1) % nu]), dv = g[Math.min(j + 1, nv)][i].clone().sub(g[Math.max(j - 1, 0)][i]), n = du.cross(dv), out = p.clone().sub(mid);
    if (n.lengthSq() < 1e-10) n = out.clone(); n.normalize(); if (n.dot(out) < 0) n.negate();
    return { p: p, n: n, u: i / nu, v: j / nv };
  }
  for (j = 0; j < nv; j++) for (i = 0; i < nu; i++) { var a = vert(j, i), b = vert(j, i + 1), d = vert(j + 1, i + 1), e = vert(j + 1, i); triN(key, a, b, d); triN(key, a, d, e); }
}
/* a wire slung between two points, sagging in the middle */
function sagPts(a, b, sag, n) { var pts = []; for (var i = 0; i <= n; i++) { var t = i / n, p = a.clone().lerp(b, t); p.y -= sag * 4 * t * (1 - t); pts.push(p); } return pts; }
var BULB_HALO = null;
function bulbString(group, a, b, sag, count) {           /* a string of bare bulbs across the alley */
  var i;
  if (!BULB_HALO) BULB_HALO = new T.SpriteMaterial({ map: glowTex(), color: 0xffb060, blending: T.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.6 });
  pipe('wire', sagPts(a, b, sag, 14), 0.008, 4);
  for (i = 1; i <= count; i++) {
    var t = i / (count + 1), p = a.clone().lerp(b, t); p.y -= sag * 4 * t * (1 - t);
    lathe('wire', V(p.x, p.y - 0.06, p.z), [[0.016, 0], [0.016, 0.06]], 5);
    lathe('bulbE', V(p.x, p.y - 0.17, p.z), [[0.0, 0], [0.03, 0.015], [0.045, 0.05], [0.04, 0.085], [0.018, 0.112]], 7);
    if (i % 2) { var s = new T.Sprite(BULB_HALO); s.position.set(p.x, p.y - 0.12, p.z); s.scale.set(0.75, 0.75, 1); s.renderOrder = 3; group.add(s); }
  }
}
function lightCone(group, apex, r, h, colour, opacity) {  /* a lamp's beam showing in the damp air: brightest at the lamp, fading out at its edges and towards the ground */
  var m = new T.Mesh(new T.ConeGeometry(r, h, 28, 1, true), new T.ShaderMaterial({ transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide,
    uniforms: { uCol: { value: new T.Color(colour) }, uOp: { value: opacity } },
    vertexShader: 'varying vec3 vN; varying vec3 vV; varying float vH; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalMatrix * normal; vV = -mv.xyz; vH = uv.y; gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'precision highp float; uniform vec3 uCol; uniform float uOp; varying vec3 vN; varying vec3 vV; varying float vH; void main(){ float e = abs(dot(normalize(vN), normalize(vV))); gl_FragColor = vec4(uCol, pow(e, 1.7) * pow(vH, 1.7) * uOp); }' }));
  m.position.set(apex.x, apex.y - h / 2, apex.z); m.renderOrder = 3; group.add(m); return m;
}
function stick(group, tex, w, h, pos, facing, roll, paper) {      /* paint on a wall, or (paper) a pasted sheet with hard torn edges */
  if (!tex) return null;
  var m = new T.Mesh(new T.PlaneGeometry(w, h), roomMat(paper ? { tex: tex, two: true, cut: true, snap: false, offset: true, grime: 0.55 } : { tex: tex, two: true, blend: true, snap: false, offset: true, grime: 0.3 }));
  m.position.copy(pos); m.lookAt(pos.clone().add(facing)); if (roll) m.rotateZ(roll); m.renderOrder = 1; group.add(m); return m;
}
/* ---------------- the wet ground: whatever stands in the alley shows in it, sharp in the puddles, smeared on the damp blacktop ---------------- */
var WET = null;
function buildWet(group) {
  var W = 512, H = 320, c = document.createElement('canvas'), q = rand(907), k; c.width = W; c.height = H;
  var g = c.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'lighter';
  function pool(x, z, r, a) {                            /* standing water round (x, z), in metres */
    var px = (x + 16) / 64 * W, py = (z + 4) / 40 * H, pr = r / 64 * W, gr = g.createRadialGradient(px, py, 0, px, py, pr);
    gr.addColorStop(0, 'rgba(255,255,255,' + a + ')'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(px - pr, py - pr, pr * 2, pr * 2);
  }
  [[0.5, 2.4, 2.0], [-0.3, 4.6, 1.6], [1.2, 6.2, 1.5], [-1.4, 8.4, 1.9], [0.9, 10.4, 2.1], [-2.4, 12.2, 1.4], [0.2, 13.6, 1.6], [1.6, 15.8, 1.7], [-0.8, 17.8, 2.0], [0.4, 19.0, 1.2], [-1.6, 21.2, 1.6], [0.8, 22.6, 2.0], [2.4, 12.6, 1.2], [-3.0, 14.2, 1.3]]
    .forEach(function (p) { pool(p[0], p[1], p[2], 0.75); });
  for (k = 0; k < 34; k++) pool(-5 + q() * 8.6, q() * 24, 0.5 + q() * 1.1, 0.3 + q() * 0.3);
  for (k = 0; k < 44; k++) pool(-8 + q() * 48, 26.3 + q() * 5.4, 0.8 + q() * 1.8, 0.4 + q() * 0.4);
  for (k = 0; k < 8; k++) pool(22.5 + q() * 9, 14.5 + q() * 9, 0.7 + q() * 1.2, 0.5 + q() * 0.3);
  var mask = new T.CanvasTexture(c); mask.flipY = false; mask.minFilter = T.LinearFilter; mask.generateMipmaps = false;
  var rt = new T.WebGLRenderTarget(1024, 1024, { minFilter: T.LinearFilter, magFilter: T.LinearFilter, format: T.RGBFormat }), pos = [];
  function rect(x0, z0, x1, z1) { pos.push(x0, 0.003, z0, x0, 0.003, z1, x1, 0.003, z1, x0, 0.003, z0, x1, 0.003, z1, x1, 0.003, z0); }
  rect(AL.nook, 0, AL.e2, AL.az); rect(-8, AL.az, 40, AL.az + 10); rect(22, 14, 32, 24);
  var geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(new Float32Array(pos), 3));
  var mat = new T.ShaderMaterial({ transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
    uniforms: { uRefl: { value: rt.texture }, uMask: { value: mask }, uM: { value: new T.Matrix4() } },
    vertexShader: 'uniform mat4 uM; varying vec4 vP; varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vP = uM * w; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: ['precision highp float; uniform sampler2D uRefl; uniform sampler2D uMask; varying vec4 vP; varying vec3 vW;',
      'float gh(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
      'float gn(vec2 p){ vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(gh(i), gh(i + vec2(1.0, 0.0)), f.x), mix(gh(i + vec2(0.0, 1.0)), gh(i + vec2(1.0, 1.0)), f.x), f.y); }',
      'void main(){',
      '  float m = texture2D(uMask, vec2((vW.x + 16.0) / 64.0, (vW.z + 4.0) / 40.0)).r + (gn(vW.xz * 1.6) - 0.5) * 0.22;',
      '  float wet = smoothstep(0.44, 0.54, m);                                /* 1 in standing water, 0 on blacktop that is only damp */',
      '  vec3 eye = cameraPosition - vW; float dist = length(eye); float fres = 0.3 + 0.7 * pow(1.0 - max(eye.y / dist, 0.0), 2.5);',
      '  vec2 wob = vec2(gn(vW.xz * 11.0), gn(vW.xz * 11.0 + 31.7)) - 0.5;',
      '  vec4 p = vP; p.xy += wob * vec2(0.4, 1.0) * mix(0.07, 0.003, wet) * p.w;',
      '  vec3 r = texture2DProj(uRefl, p).rgb;',
      '  gl_FragColor = vec4(r, mix(0.3, 0.85, wet) * fres);',
      '}'].join('\n') });
  var mesh = new T.Mesh(geo, mat); mesh.frustumCulled = false; group.add(mesh);
  WET = { rt: rt, mesh: mesh, mat: mat, cam: new T.PerspectiveCamera(), rot: new T.Matrix4(), look: V(0, 0, 0), up: V(0, 1, 0) };
}
function renderWet() {                                   /* draw the alley as the ground sees it: from the eye's place mirrored under the ground */
  var w = WET; if (!w) return;
  var e = camera.position; if (e.y < 0.05) return;
  camera.updateMatrixWorld(); w.rot.extractRotation(camera.matrixWorld);
  w.look.set(0, 0, -1).applyMatrix4(w.rot).add(e); w.up.set(0, 1, 0).applyMatrix4(w.rot);
  w.cam.position.set(e.x, -e.y, e.z); w.cam.up.set(w.up.x, -w.up.y, w.up.z); w.cam.lookAt(w.look.x, -w.look.y, w.look.z);
  w.cam.updateMatrixWorld(); w.cam.projectionMatrix.copy(camera.projectionMatrix); w.cam.projectionMatrixInverse.copy(camera.projectionMatrixInverse);
  w.mat.uniforms.uM.value.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1).multiply(w.cam.projectionMatrix).multiply(w.cam.matrixWorldInverse);
  var keep = renderer.getRenderTarget(); w.mesh.visible = false;
  renderer.setRenderTarget(w.rt); renderer.clear(); renderer.render(scene, w.cam); renderer.setRenderTarget(keep);
  w.mesh.visible = true;
}
/* a band of stone or steel standing proud of a wall that faces (nx, nz): a cornice, a string course */
function trim(key, x0, z0, x1, z1, y, h, d, nx, nz) {
  var len = Math.hypot(x1 - x0, z1 - z0);
  box(key, V((x0 + x1) / 2 + nx * d / 2, y, (z0 + z1) / 2 + nz * d / 2), len, h, d, Math.atan2(-(z1 - z0), x1 - x0));
}

/* ---------------- things left in an alley ---------------- */
function dumpster(x, z, yaw, open, seed, y) {            /* its front faces the way yaw turns it; open: the lid is thrown back; y: what it stands on */
  var M = xf(x, y || 0, z, 0, yaw, 0), i;
  function w(lx, ly, lz) { return V(lx, ly, lz).applyMatrix4(M); }
  obox('paintG', M, 0, 0.7, 0, 1.9, 1.08, 1.15);
  [-0.62, 0, 0.62].forEach(function (lx) { obox('paintG', M, lx, 0.7, 0.585, 0.07, 0.96, 0.03); });       /* ribs pressed into its front */
  obox('steelK', M, 0, 1.25, 0, 1.96, 0.04, 1.21);
  if (open) {
    obox('lidK', M.clone().multiply(xf(0, 1.27, -0.6, -1.78, 0, 0)), 0, 0, 0.6, 1.94, 0.05, 1.2);
    blob('bagK', w(-0.4, 0.86, 0.05), 0.42, 0.34, 0.38, seed, 0.4); blob('bagK', w(0.35, 0.92, -0.1), 0.4, 0.36, 0.4, seed + 1, 1.2); blob('bagW', w(0.0, 1.0, 0.22), 0.3, 0.26, 0.3, seed + 2, 2.0);
  } else {
    obox('lidK', M.clone().multiply(xf(0, 1.27, -0.6, 0.05, 0, 0)), -0.49, 0, 0.6, 0.95, 0.05, 1.2);
    obox('lidK', M.clone().multiply(xf(0, 1.27, -0.6, -0.1, 0, 0)), 0.49, 0, 0.6, 0.95, 0.05, 1.2);    /* one half not quite shut */
  }
  [[-0.8, -0.45], [0.8, -0.45], [-0.8, 0.45], [0.8, 0.45]].forEach(function (c) { lathe('steelK', w(c[0], 0, c[1]), [[0.0, 0], [0.07, 0], [0.07, 0.15], [0.0, 0.15]], 8, true); });
  [-1, 1].forEach(function (s) { pipe('steelK', [w(s * 0.96, 0.95, -0.3), w(s * 1.07, 0.95, -0.3), w(s * 1.07, 0.95, 0.3), w(s * 0.96, 0.95, 0.3)], 0.022, 6); });
  shadow(x, z, y || 0, 1.25, 0.85, yaw);
}
/* a shape turned on a lathe, like lathe(), but its texture goes exactly once round and once from the first point of the outline to the last, and rot turns it */
function turned(key, c, prof, seg, rot) {
  var n = prof.length, nr = [], len = [0], i, j;
  for (i = 0; i < n; i++) {
    var a = prof[Math.max(0, i - 1)], b = prof[Math.min(n - 1, i + 1)], dr = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dr, dy) || 1;
    nr.push([dy / l, -dr / l]);
    if (i) len.push(len[i - 1] + Math.hypot(prof[i][0] - prof[i - 1][0], prof[i][1] - prof[i - 1][1]));
  }
  function vert(i, j) {
    var ang = (rot || 0) + j / seg * Math.PI * 2, s = Math.sin(ang), co = Math.cos(ang);
    return { p: V(c.x + s * prof[i][0], c.y + prof[i][1], c.z + co * prof[i][0]), n: V(s * nr[i][0], nr[i][1], co * nr[i][0]).normalize(), u: j / seg, v: len[i] / len[n - 1] };
  }
  for (i = 0; i < n - 1; i++) for (j = 0; j < seg; j++) {
    var v00 = vert(i, j), v01 = vert(i, j + 1), v10 = vert(i + 1, j), v11 = vert(i + 1, j + 1);
    if (prof[i][0] > 1e-5) triN(key, v00, v01, v11);
    if (prof[i + 1][0] > 1e-5) triN(key, v00, v11, v10);
  }
}
function hash2(x, z, k) { var v = Math.sin(x * 12.9898 + z * 78.233 + (k || 0) * 37.719) * 43758.5453; return v - Math.floor(v); }      /* a steady random number for a place, so the same thing always looks the same */
/* a full bin bag: sagging wide at the bottom, flat where it sits, pulled into creases, gathered and tied at the top */
function bag(x, z, s, seed, key, y) {
  if (typeof PROPS !== 'undefined' && PROPS.on && !PROPS.building) { PROPS.add('bag', { x: x, z: z, s: s, seed: seed, key: key, y: y || 0 }); return; }      /* loose, on the headset page */
  key = key || 'bagK'; y = y || 0;
  var q = rand(seed), ph = [q() * 6.28, q() * 6.28, q() * 6.28, q() * 6.28, q() * 6.28], nu = 20, nv = 12, yaw = q() * 6.28, ca = Math.cos(yaw), sa = Math.sin(yaw);
  var rx = 0.36 * s * (0.9 + q() * 0.25), rz = 0.33 * s * (0.9 + q() * 0.25), H = 0.46 * s * (0.9 + q() * 0.2), g = [], i, j, mid = V(x, y + H * 0.4, z);
  for (j = 0; j <= nv; j++) {
    var t = j / nv, row = [];                              /* t: 0 at the knot, 1 underneath */
    var ang = Math.min(1, t / 0.86) * Math.PI * 0.62, wide, yy;
    if (t < 0.86) { wide = Math.pow(Math.sin(ang), 0.8); yy = H * (Math.cos(ang) + 0.368) / 1.368; } else { wide = 0.93 * (1 - (t - 0.86) / 0.14 * 0.6); yy = 0; }
    if (t < 0.1) { wide = Math.max(wide, 0.085); yy += H * 0.05 * (1 - t / 0.1); }
    for (i = 0; i < nu; i++) {
      var u = i / nu * 2 * Math.PI, crease = t < 0.9 ? 1 : 0.4;
      var r = 1 + crease * (0.1 * Math.sin(3 * u + ph[0]) * Math.sin(2.2 * t * 3.14 + ph[1]) + 0.07 * Math.sin(6 * u + ph[2]) * (1 - t) + 0.045 * Math.sin(11 * u + ph[3]) * (1 - t * 0.6) + 0.05 * Math.sin(2 * u + ph[4]));
      var px = Math.cos(u) * rx * wide * r, pz = Math.sin(u) * rz * wide * r;
      row.push(V(x + px * ca + pz * sa, y + Math.max(0.004, yy + (t < 0.86 ? 0.02 * s * Math.sin(5 * u + ph[2]) * t : 0)), z - px * sa + pz * ca));
    }
    g.push(row);
  }
  function vert(j, i) {
    i = (i + nu) % nu;
    var p = g[j][i], du = g[j][(i + 1) % nu].clone().sub(g[j][(i + nu - 1) % nu]), dv = g[Math.min(j + 1, nv)][i].clone().sub(g[Math.max(j - 1, 0)][i]), n = du.cross(dv), out = p.clone().sub(mid);
    if (n.lengthSq() < 1e-10) n = out.clone(); n.normalize(); if (n.dot(out) < 0) n.negate();
    return { p: p, n: n, u: i / nu, v: 1 - j / nv };
  }
  function vertU(j, i, u) { var o = vert(j, i); o.u = u; return o; }
  for (j = 0; j < nv; j++) for (i = 0; i < nu; i++) { var a = vertU(j, i, i / nu), b = vertU(j, i + 1, (i + 1) / nu), d = vertU(j + 1, i + 1, (i + 1) / nu), e = vertU(j + 1, i, i / nu); triN(key, a, b, d); triN(key, a, d, e); }
  turned(key, V(x, y + H * 1.03, z), [[0.032 * s, 0], [0.018 * s, 0.03 * s], [0.026 * s, 0.05 * s], [0.055 * s, 0.085 * s]], 9, yaw);      /* the neck, tied, and the ruff above the knot */
  if (!y) shadow(x, z, 0, 0.42 * s);
}
/* a cardboard box, 0.76 s tall: taped shut with a shipping label, or (open) its four flaps left however they fell */
function carton(x, y, z, s, yaw, open) {
  var M = xf(x, y, z, 0, yaw, 0), w = s * (1.02 + 0.36 * hash2(x, z, 1)), d = s * (0.72 + 0.22 * hash2(x, z, 2)), h = s * 0.76, t = 0.007;
  if (open) {
    obox('card', M, 0, t / 2, 0, w, t, d); obox('card', M, -w / 2 + t / 2, h / 2, 0, t, h, d); obox('card', M, w / 2 - t / 2, h / 2, 0, t, h, d); obox('card', M, 0, h / 2, -d / 2 + t / 2, w, h, t); obox('card', M, 0, h / 2, d / 2 - t / 2, w, h, t);
    var f1 = 0.5 + hash2(x, z, 3) * 0.9, f2 = 2.3 + hash2(x, z, 4) * 0.5, f3 = 1.9 + hash2(x, z, 5) * 0.9, f4 = 0.3 + hash2(x, z, 6) * 0.7;      /* how far each flap has fallen, from straight up */
    obox('card', M.clone().multiply(xf(0, h, d / 2, f1, 0, 0)), 0, d * 0.24, 0, w - 0.01, d * 0.48, t);
    obox('card', M.clone().multiply(xf(0, h, -d / 2, -f2, 0, 0)), 0, d * 0.24, 0, w - 0.01, d * 0.48, t);
    obox('card', M.clone().multiply(xf(w / 2, h, 0, 0, 0, -f3)), 0, d * 0.24, 0, t, d * 0.48, d - 0.01);
    obox('card', M.clone().multiply(xf(-w / 2, h, 0, 0, 0, f4)), 0, d * 0.24, 0, t, d * 0.48, d - 0.01);
  } else {
    obox('card', M, 0, h / 2, 0, w, h, d);
    obox('tape', M, 0, h + 0.0015, 0, w + 0.004, 0.003, 0.055); obox('tape', M, w / 2 + 0.0015, h - 0.05, 0, 0.003, 0.1, 0.055); obox('tape', M, -w / 2 - 0.0015, h - 0.05, 0, 0.003, 0.1, 0.055);
    obox('labelP', M, (hash2(x, z, 7) - 0.5) * w * 0.4, h * 0.55, d / 2 + 0.0015, 0.13, 0.09, 0.003); obox('dark', M, (hash2(x, z, 7) - 0.5) * w * 0.4, h * 0.53, d / 2 + 0.003, 0.09, 0.02, 0.002);
  }
  if (!y) shadow(x, z, 0, s * 0.8);
}
function pallet(M) {                                     /* a wooden pallet: lies flat within M, so M can lean it against a wall */
  var i;
  for (i = 0; i < 5; i++) if (!(M.elements[13] > 0.2 && i === 3)) obox('woodS', M, 0, 0.13, -0.44 + i * 0.22, 1.2, 0.022, 0.1);
  [-0.5, 0, 0.5].forEach(function (lx) { obox('woodS', M, lx, 0.07, 0, 0.1, 0.09, 1.0); });
  [-0.44, 0, 0.44].forEach(function (lz) { obox('woodS', M, 0, 0.011, lz, 1.2, 0.022, 0.1); });
}
function couch(x, z, ry, seed) {                         /* a worn three-seat couch, its back to a wall: x, z the middle of its front edge's foot, facing along ry */
  var q = rand(seed), M = xf(x, 0, z, 0, ry, 0), W = 2.0, D = 0.86, i;
  [[-0.92, -0.36], [0.92, -0.36], [-0.92, 0.36], [0.92, 0.36]].forEach(function (c) { obox('dark', M, c[0], 0.035, c[1], 0.07, 0.07, 0.07); });      /* stubby feet */
  obox('couchF', M, 0, 0.2, 0, W, 0.26, D);                                                      /* the frame */
  for (i = 0; i < 3; i++) obox('couchF', M.clone().multiply(xf((i - 1) * 0.6, 0.4, 0.07, (q() - 0.5) * 0.06, (q() - 0.5) * 0.06, (q() - 0.5) * 0.05)), 0, 0, 0, 0.58, 0.13, 0.64);      /* seat cushions, sat flat over the years */
  obox('couchF', M.clone().multiply(xf(0, 0.33, -0.33, -0.18, 0, 0)), 0, 0.26, 0, W - 0.36, 0.56, 0.18);            /* the back, leaning a little */
  for (i = 0; i < 3; i++) obox('couchF', M.clone().multiply(xf((i - 1) * 0.58, 0.47, -0.2, -0.3 + (q() - 0.5) * 0.1, (q() - 0.5) * 0.08, (q() - 0.5) * 0.06)), 0, 0.17, 0, 0.55, 0.36, 0.13);      /* back cushions, slumped */
  [-1, 1].forEach(function (sd) { obox('couchF', M, sd * (W / 2 - 0.09), 0.32, 0, 0.18, 0.5, D); obox('couchF', M, sd * (W / 2 - 0.09), 0.58, 0.02, 0.22, 0.06, D + 0.02); });      /* the arms */
  shadow(x - Math.sin(ry) * 0.05, z - Math.cos(ry) * 0.05, 0, 1.15, 0.6, ry);
}
function crate(c, s, ry) {                               /* a slatted wooden crate: posts at the corners, boards with gaps you can see into, a lid of boards */
  var M = xf(c.x, c.y, c.z, 0, ry || 0, 0), hs = s / 2, hb = s * 0.2, k;
  obox('dark', M, 0, hs, 0, s - 0.04, s - 0.03, s - 0.04);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (q) { obox('woodS', M, q[0] * (hs - 0.02), hs, q[1] * (hs - 0.02), 0.045, s, 0.045); });
  for (k = 0; k < 4; k++) {
    var yb = hb / 2 + k * (s - hb) / 3;
    obox('woodS', M, hs, yb, 0, 0.016, hb, s - 0.01); obox('woodS', M, -hs, yb, 0, 0.016, hb, s - 0.01); obox('woodS', M, 0, yb, hs, s - 0.01, hb, 0.016); obox('woodS', M, 0, yb, -hs, s - 0.01, hb, 0.016);
    obox('woodS', M, 0, s + 0.008, -hs + hb / 2 + k * (s - hb) / 3, s + 0.02, 0.016, hb);
  }
  if (!c.y) shadow(c.x, c.z, 0, s * 0.8);
}
/* a steel drum: rolled hoops, rims, a sunk lid with two bungs. key: which paint. open: no lid, for a fire */
function drum(x, z, key, y, open) {
  y = y || 0; var c = V(x, y, z), rot = hash2(x, z) * 6.28;
  turned(key, c, [[0.272, 0], [0.29, 0.008], [0.29, 0.022], [0.283, 0.032], [0.283, 0.272], [0.293, 0.286], [0.293, 0.304], [0.283, 0.318], [0.283, 0.562], [0.293, 0.576], [0.293, 0.594], [0.283, 0.608], [0.283, 0.852], [0.29, 0.862], [0.29, 0.874], [0.28, 0.882]], 24, rot);
  if (open) turned('drumIn', c, [[0.28, 0.882], [0.272, 0.876], [0.272, 0.3]], 24, rot);
  else {
    turned('drumLid', c, [[0.28, 0.882], [0.271, 0.878], [0.271, 0.862], [0.0, 0.862]], 24, rot);
    [[0.17, 0.5, 0.034], [0.15, 3.4, 0.02]].forEach(function (b) { turned('steelK', V(x + Math.sin(rot + b[1]) * b[0], y + 0.862, z + Math.cos(rot + b[1]) * b[0]), [[b[2], 0], [b[2], 0.012], [0.0, 0.012]], 10, 0); });
  }
  if (!y) shadow(x, z, 0, 0.42);
}
function tire(x, y, z, rot) {                            /* a car tyre lying flat: a real ring, rounded at the shoulders, with a tread */
  turned('tireS', V(x, y, z), [[0.2, 0.03], [0.215, 0.0], [0.29, 0.0], [0.322, 0.026], [0.33, 0.07], [0.33, 0.14], [0.322, 0.184], [0.29, 0.21], [0.215, 0.21], [0.2, 0.18], [0.2, 0.03]], 22, rot);
}
function tireStack(x, z, n) { for (var k = 0; k < n; k++) tire(x + (hash2(x, z, k) - 0.5) * 0.07, k * 0.21, z + (hash2(z, x, k) - 0.5) * 0.07, hash2(x, z, k + 9) * 6.28); shadow(x, z, 0, 0.44); }
function roadCone(x, z) {                                /* a road cone: a square foot, a collar band, scuffed */
  var ry = hash2(x, z) * 1.5;
  box('coneB', V(x, 0.014, z), 0.36, 0.028, 0.36, ry);
  turned('coneT', V(x, 0.028, z), [[0.15, 0], [0.142, 0.014], [0.036, 0.6], [0.03, 0.615], [0.0, 0.615]], 16, ry);
  shadow(x, z, 0, 0.27);
}
/* a beer bottle with a paper label. y: what it stands on. lie: lying on its side, pointing that way round */
function bottle(x, z, y, lie) {
  if (typeof PROPS !== 'undefined' && PROPS.on && !PROPS.building) { PROPS.add('bottle', { x: x, z: z, y: y || 0, lie: lie }); return; }
  y = y || 0; var key = hash2(x, z, 3) < 0.6 ? 'glassBr' : 'glassB';
  if (lie === undefined) {
    turned(key, V(x, y, z), [[0.026, 0], [0.031, 0.006], [0.031, 0.125], [0.027, 0.15], [0.014, 0.185], [0.0125, 0.214], [0.0155, 0.217], [0.0155, 0.228], [0.0, 0.228]], 12, 0);
    turned('labelP', V(x, y, z), [[0.0318, 0.05], [0.0318, 0.108]], 12, 0);
  } else {
    var dx = Math.sin(lie), dz = Math.cos(lie), p = V(x, y + 0.031, z);
    rod(key, p, V(x + dx * 0.13, y + 0.031, z + dz * 0.13), 0.031, 10, key); rod(key, V(x + dx * 0.13, y + 0.031, z + dz * 0.13), V(x + dx * 0.225, y + 0.031, z + dz * 0.225), 0.014, 8, key);
    rod('labelP', V(x + dx * 0.045, y + 0.031, z + dz * 0.045), V(x + dx * 0.1, y + 0.031, z + dz * 0.1), 0.0318, 10, 'labelP');
  }
}
function ladder(x0, xw, z, h) {                          /* a wooden ladder, its foot at x0, leaning on the wall at xw: flat rails, round rungs */
  var L = Math.hypot(xw - x0, h), th = Math.atan2(-(xw - x0), h), i;
  [-0.2, 0.2].forEach(function (d) { obox('woodS', xf(x0, 0, z + d, 0, 0, th), 0, L / 2, 0, 0.07, L, 0.028); });
  for (i = 1; i < 11; i++) { var t = i / 11.3; pipe('woodS', [V(x0 + (xw - x0) * t, h * t, z - 0.2), V(x0 + (xw - x0) * t, h * t, z + 0.2)], 0.015, 6); }
}
function conduit(x, nx, z0, z1, y, drops) {              /* cable pipes clipped along a wall that faces nx, with boxes where they join and drops to the ground */
  [0, 0.07].forEach(function (d) { pipe('steelK', [V(x + nx * 0.035, y + d, z0), V(x + nx * 0.035, y + d, z1)], 0.016, 6); });
  for (var z = z0 + 0.5; z < z1; z += 1.3) box('galv', V(x + nx * 0.03, y + 0.035, z), 0.06, 0.13, 0.035, 0);                   /* clips */
  drops.forEach(function (z) {
    box('galv', V(x + nx * 0.06, y + 0.03, z), 0.12, 0.24, 0.2, 0); box('steelK', V(x + nx * 0.124, y + 0.03, z), 0.008, 0.2, 0.16, 0);
    pipe('steelK', [V(x + nx * 0.035, y - 0.09, z), V(x + nx * 0.035, 0.1, z)], 0.014, 6);
    [y - 0.7, y - 1.7].forEach(function (yy) { if (yy > 0.3) box('galv', V(x + nx * 0.03, yy, z), 0.06, 0.035, 0.07, 0); });
  });
}
function meterBank(x, nx, z0, n, y, plates) {                    /* electric meters on a wall that faces nx: a round glass on each box, a pipe up from each to a trunk, a breaker cabinet at the end */
  for (var k = 0; k < n; k++) {
    var z = z0 + k * 0.36;
    box('galv', V(x + nx * 0.05, y, z), 0.1, 0.34, 0.24, 0);
    rod('steelK', V(x + nx * 0.1, y + 0.03, z), V(x + nx * 0.14, y + 0.03, z), 0.1, 14, 'steelK');
    if (plates) plates.push([TEX.meterF, 0.2, 0.2, V(x + nx * 0.1415, y + 0.03, z), V(nx, 0, 0)]);
    pipe('steelK', [V(x + nx * 0.05, y + 0.17, z), V(x + nx * 0.05, y + 0.62, z)], 0.017, 6);
  }
  var ze = z0 + (n - 1) * 0.36;
  box('galv', V(x + nx * 0.05, y + 0.66, (z0 + ze) / 2 - 0.3), 0.1, 0.1, ze - z0 + 1.0, 0);                                     /* the trunk they all feed */
  box('galv', V(x + nx * 0.08, y + 0.2, z0 - 0.62), 0.16, 0.8, 0.52, 0); box('steelK', V(x + nx * 0.164, y + 0.2, z0 - 0.62), 0.008, 0.72, 0.44, 0); box('galv', V(x + nx * 0.17, y + 0.2, z0 - 0.62), 0.012, 0.68, 0.4, 0);
  box('steelK', V(x + nx * 0.185, y + 0.2, z0 - 0.47), 0.02, 0.12, 0.03, 0);
  pipe('steelK', [V(x + nx * 0.06, y + 0.6, z0 - 0.62), V(x + nx * 0.06, 12.4, z0 - 0.62)], 0.045, 8);
  for (var yy = y + 1.6; yy < 12; yy += 2.2) box('galv', V(x + nx * 0.06, yy, z0 - 0.62), 0.12, 0.05, 0.14, 0);
}
function airUnit(w) {                                    /* a window air unit under window w, and the stain where it has dripped for years */
  var ry = Math.atan2(w.nx, w.nz), x = w.x + w.nx * 0.3, z = w.z + w.nz * 0.3;
  box('steelG', V(x, w.y + 0.24, z), 0.72, 0.46, 0.62, ry); hang('grate', w.x + w.nx * 0.615, w.y + 0.25, w.z + w.nz * 0.615, 0.6, 0.34, w.nx, w.nz, 0);
  pipe('steelK', [V(w.x + w.nx * 0.02, w.y - 0.45, w.z + w.nz * 0.02), V(x + w.nx * 0.2, w.y + 0.02, z + w.nz * 0.2)], 0.016, 5);
  wallDecal('dripS', V(w.x, w.y - 1.25, w.z), 0.7, 2.2, V(w.nx, 0, w.nz));
}

/* ---------------- the near half: the elevator end, the dock, the fire escape ---------------- */
function nearZone(group, plates) {
  var ax = AL.ax, nk = AL.nook, e2 = AL.e2, i, L = NEAR_LIGHTS.lamps;
  quad('asphalt', V(nk, 0, 0), V(e2, 0, 0), V(e2, 0, 13), V(nk, 0, 13), V(0, -5, 6));
  box('grate', V(0, 0.004, 6.6), 0.22, 0.008, 12.6, 0);                                                     /* a drain down the middle, under a grating */
  /* the end wall, with the elevator's opening */
  holedWall(V(-ax, 0, 0), V(ax, 0, 0), 13, [[13, 'brickD']], [[ax - 1.5, ax + 1.5, 0, 2.7]], V(0, 1, -5));
  trim('conc', -ax, 0, ax, 0, 13.12, 0.3, 0.4, 0, 1); trim('conc', -ax, 0, ax, 0, 3.55, 0.16, 0.1, 0, 1);
  windowsOn(-ax + 0.5, 0, ax - 0.5, 0, 0, 1, [7.3, 10.2], 3, 511, 0.4);
  /* left: a tall red-brick block, then the dock's nook, set back, under a lower building */
  wallQ('brickR', -ax, 0, -ax, 7.5, 0, 14, 1, 0); wallQ('brickR', nk, 7.5, -ax, 7.5, 0, 14, 0, 1); wallQ('brickR', -14, 7.5, nk, 7.5, 10, 14, 0, 1);
  trim('conc', -ax, 0, -ax, 7.5, 14.12, 0.3, 0.4, 1, 0); trim('conc', -ax, 0, -ax, 7.5, 3.6, 0.16, 0.1, 1, 0);
  windowsOn(-ax, 0.5, -ax, 7.1, 1, 0, [4.3, 7.4, 10.5], 3, 512, 0.3, 0.1);
  wallQ('brickD', nk, 7.5, nk, 15, 0, 10, 1, 0); trim('conc', nk, 7.5, nk, 15, 10.12, 0.3, 0.4, 1, 0);
  windowsOn(nk, 8.0, nk, 14.6, 1, 0, [5.2, 7.7], 3, 513, 0.34);
  /* right: a tall dark block, then a lower red one, set back a little, with the fire escape on it */
  wallQ('brickD', ax, 0, ax, 8, 0, 15, -1, 0); wallQ('brickD', ax, 8, 14, 8, 0, 15, 0, 1);
  trim('conc', ax, 0, ax, 8, 15.12, 0.3, 0.4, -1, 0); trim('conc', ax, 0, ax, 8, 3.6, 0.16, 0.1, -1, 0);
  windowsOn(ax, 0.6, ax, 7.5, -1, 0, [4.4, 7.5, 10.6], 3, 514, 0.3, 0.12);
  wallQ('brickR', e2, 8, e2, 17, 0, 9.5, -1, 0); trim('conc', e2, 8, e2, 17, 9.62, 0.3, 0.4, -1, 0);
  windowsOn(e2, 8.5, e2, 16.6, -1, 0, [3.9, 6.9], 3, 515, 0.4);
  [[-ax, 0, -ax, 7.5, 1, 0], [nk, 7.5, nk, 13, 1, 0], [ax, 0, ax, 8, -1, 0], [e2, 8, e2, 13, -1, 0], [-ax, 0, ax, 0, 0, 1]].forEach(function (w) {       /* grime up the foot of every wall, shade along it on the ground */
    shade(V(w[0] + w[4] * 0.012, 0, w[1] + w[5] * 0.012), V(w[2] + w[4] * 0.012, 0, w[3] + w[5] * 0.012), V(0, 1, 0), 1.3);
    shade(V(w[0], 0.012, w[1]), V(w[2], 0.012, w[3]), V(w[4], 0, w[5]), 0.8);
  });
  /* a water tank on the dock building's roof, against the sky */
  lathe('woodS', V(-8.2, 11.3, 11.4), [[0.0, 0], [1.25, 0], [1.3, 0.05], [1.3, 2.3], [1.42, 2.36], [0.0, 3.1]], 16);
  [[-9.1, 10.5], [-7.3, 10.5], [-9.1, 12.3], [-7.3, 12.3]].forEach(function (p) { pipe('steelK', [V(p[0], 10, p[1]), V(p[0], 11.3, p[1])], 0.06, 6); });

  /* the freight elevator at the end, under the lit sign */
  var ez = -3.2, L0 = L[5];
  quad('steelG', V(-1.5, 0, ez), V(1.5, 0, ez), V(1.5, 0, 0), V(-1.5, 0, 0), V(0, -5, -1.5));
  wallQ('panelK', -1.5, ez, 1.5, ez, 0, 2.7, 0, 1); wallQ('panelK', -1.5, ez, -1.5, 0, 0, 2.7, 1, 0); wallQ('panelK', 1.5, ez, 1.5, 0, 0, 2.7, -1, 0);
  quad('steelK', V(-1.5, 2.7, ez), V(1.5, 2.7, ez), V(1.5, 2.7, 0), V(-1.5, 2.7, 0), V(0, 8, -1.5));
  pipe('steelG', [V(-1.2, 0.95, ez + 0.07), V(1.2, 0.95, ez + 0.07)], 0.022, 8); box('steelK', V(0, 0.09, ez + 0.006), 3.0, 0.18, 0.012, 0);
  [-1.62, 1.62].forEach(function (x) { box('hazardS', V(x, 1.4, 0.08), 0.24, 2.8, 0.24, 0); });
  box('hazardS', V(0, 2.82, 0.08), 3.48, 0.24, 0.24, 0);
  for (i = 0; i < 6; i++) { pipe('steelG', [V(1.02, 0.1 + i * 0.43, 0.03), V(1.46, 0.53 + i * 0.43, 0.03)], 0.012, 6); pipe('steelG', [V(1.02, 0.53 + i * 0.43, 0.03), V(1.46, 0.1 + i * 0.43, 0.03)], 0.012, 6); }      /* its folded gate */
  [1.02, 1.46].forEach(function (x) { pipe('steelG', [V(x, 0.05, 0.03), V(x, 2.68, 0.03)], 0.016, 6); });
  var panel = new T.Mesh(new T.BoxGeometry(1.3, 0.02, 0.8), new T.MeshBasicMaterial({ color: 0xfff0d6 })); panel.position.set(0, 2.68, -1.6); group.add(panel); L0.bulb = panel;
  lampHalo(group, V(0, 2.5, -0.9), 2.2, L0, 0xffe2b8);
  box('steelG', V(-2.0, 1.1, 0.022), 0.15, 0.28, 0.044, 0); box('steelK', V(-2.0, 1.1, 0.045), 0.124, 0.25, 0.004, 0);      /* the call station: a galvanized box, a dark face, one round button */
  [[-0.05, 0.11], [0.05, 0.11], [-0.05, -0.11], [0.05, -0.11]].forEach(function (c) { box('steelG', V(-2.0 + c[0], 1.1 + c[1], 0.048), 0.012, 0.012, 0.004, 0); });
  pipe('steelK', [V(-2.0, 1.24, 0.024), V(-2.0, 3.44, 0.024)], 0.011, 6); box('steelG', V(-2.0, 3.0, 0.024), 0.05, 0.03, 0.05, 0);      /* its wires, in a conduit up to the ledge */
  plates.push([TEX.callL, 0.09, 0.034, V(-2.0, 1.175, 0.048), V(0, 0, 1)]);
  /* the name, sprayed across the brick over the door, two old lamps bent over it and a blue tube under it */
  plates.push([TEX.logoS, 6.0, 2.3, V(0, 4.77, 0.03), V(0, 0, 1)]);
  [-1.7, 1.7].forEach(function (x) {
    pipe('steelK', [V(x, 6.45, 0.02), V(x, 6.62, 0.5), V(x, 6.5, 0.86), V(x, 6.32, 0.9)], 0.02, 6);
    lathe('steelK', V(x, 6.14, 0.9), [[0.2, 0], [0.17, 0.05], [0.05, 0.16], [0.0, 0.18]], 12);
    lampBulb(group, V(x, 6.13, 0.9), 0.05, L[6], 0xfff0d0); lightCone(group, V(x, 6.2, 0.9), 1.5, 2.6, 0xffe6c0, 0.2);
  });
  lampHalo(group, V(0, 6.0, 1.0), 2.4, L[6], 0xffe0b0); L[6].halo.scale.set(5.5, 1.8, 1);
  var tube = new T.Mesh(new T.CylinderGeometry(0.028, 0.028, 3.9, 8), new T.MeshBasicMaterial({ color: 0x9dbcff })); tube.rotation.z = Math.PI / 2; tube.position.set(0, 3.18, 0.2); group.add(tube); L[10].bulb = tube;
  [-1.8, 0, 1.8].forEach(function (x) { box('steelK', V(x, 3.18, 0.09), 0.05, 0.08, 0.2, 0); });
  lampHalo(group, V(0, 3.18, 0.35), 2.2, L[10], 0x3f7bff); L[10].halo.scale.set(6.5, 1.5, 1);
  plates.push([TEX.hands[0], 1.7, 2.5, V(-2.55, 1.55, 0.03), V(0, 0, 1)]); plates.push([TEX.hands[1], 1.7, 2.5, V(2.6, 1.55, 0.03), V(0, 0, 1)]);
  plates.push([TEX.tagClub, 2.9, 1.05, V(-ax + 0.03, 2.08, 5.6), V(1, 0, 0)]);                                 /* the way in, on the wall as you come down the alley */

  /* the loading dock in its nook: a concrete platform, steps down, a roller shutter, a lamp over it */
  box('conc', V((nk - 3.65) / 2, 0.475, 10.55), -3.65 - nk, 0.95, 5.7, 0);
  for (i = 0; i < 4; i++) box('conc', V((nk - 3.65) / 2, (0.76 - i * 0.19) / 2, 13.575 + i * 0.35), -3.65 - nk, 0.76 - i * 0.19, 0.35, 0);
  box('hazardS', V(-3.7, 0.9, 10.55), 0.1, 0.1, 5.7, 0);
  [8.6, 10.55, 12.5].forEach(function (z) { box('rubberS', V(-3.6, 0.6, z), 0.1, 0.5, 0.32, 0); });          /* bumpers */
  shutterAt(nk, 10.4, 3.0, 2.8, 1, 0, 0.5, 0.95);
  box('doorG', V(nk + 0.04, 0.95 + 1.05, 13.0), 0.08, 2.1, 0.95, 0); box('conc', V(nk + 0.06, 0.95 + 2.2, 13.0), 0.14, 0.14, 1.2, 0); box('steelG', V(nk + 0.1, 1.95, 13.32), 0.03, 0.12, 0.04, 0);
  wallLamp(group, L[0], 1, 0); lightCone(group, V(AT.dock.x, AT.dock.y, AT.dock.z), 1.7, 3.3, 0xffd9a8, 0.22);
  crate(V(nk + 0.55, 0.95, 8.25), 0.7, 0.1); crate(V(nk + 0.6, 0.95, 9.0), 0.6, -0.15); crate(V(nk + 0.55, 1.65, 8.3), 0.55, 0.3);
  drum(nk + 1.25, 8.2, 'drumB', 0.95); drum(nk + 0.5, 12.2, 'drumK', 0.95);
  pallet(xf(nk + 0.22, 1.5, 11.95 - 0.5, 0, Math.PI / 2, 1.33));                                              /* a pallet leaning on the wall */
  carton(-4.0, 0.95, 12.45, 0.5, 0.3, true); carton(-4.15, 0.95, 9.3, 0.45, -0.2);
  shade(V(-3.65, 0.012, 7.7), V(-3.65, 0.012, 13.4), V(1, 0, 0), 0.7); shade(V(nk, 0.962, 7.7), V(nk, 0.962, 13.4), V(1, 0, 0), 0.5);

  /* the fire escape: two balconies one over the other, a steep stair between them, a ladder that stops short of the ground */
  var xo = 2.8, z0 = 9.2, z1 = 13.2, zm = (z0 + z1) / 2;
  function bar(pts, r) { pipe('steelK', pts, r || 0.02, 6); }
  [3.3, 6.3].forEach(function (y) {
    box('grate', V((e2 + xo) / 2, y - 0.03, zm), e2 - xo, 0.05, z1 - z0, 0);
    box('steelK', V(xo + 0.025, y - 0.09, zm), 0.05, 0.14, z1 - z0, 0); [z0 + 0.025, z1 - 0.025].forEach(function (z) { box('steelK', V((e2 + xo) / 2, y - 0.09, z), e2 - xo, 0.14, 0.05, 0); });
    [1.0, 0.52].forEach(function (h) { bar([V(e2, y + h, z0), V(xo, y + h, z0), V(xo, y + h, z1), V(e2, y + h, z1)], h === 1.0 ? 0.022 : 0.014); });
    for (var s = 0; s <= 5; s++) bar([V(xo, y, z0 + (z1 - z0) * s / 5), V(xo, y + 1.0, z0 + (z1 - z0) * s / 5)], 0.016);
    [z0 + 0.4, z1 - 0.4].forEach(function (z) { bar([V(e2, y - 0.95, z), V(xo + 0.15, y - 0.12, z)], 0.02); });           /* brackets */
  });
  [3.02, 3.52].forEach(function (x) { bar([V(x, 3.3, z0 + 0.75), V(x, 6.27, z1 - 0.75)]); });                  /* the stair's two sides, and its treads */
  for (i = 1; i < 11; i++) { var t = i / 11; box('grate', V(3.27, 3.3 + 2.97 * t, z0 + 0.75 + (z1 - z0 - 1.5) * t), 0.5, 0.03, 0.2, 0); }
  [3.0, 3.44].forEach(function (x) { bar([V(x, 4.2, z0 + 0.3), V(x, 0.95, z0 + 0.3)]); });                     /* the drop ladder */
  for (i = 0; i < 9; i++) bar([V(3.0, 1.1 + i * 0.34, z0 + 0.3), V(3.44, 1.1 + i * 0.34, z0 + 0.3)], 0.014);
  [3.4, 3.8].forEach(function (x) { bar([V(x, 6.3, z1 - 0.28), V(x, 10.3, z1 - 0.28)]); });                    /* and one more ladder up to the roof */
  for (i = 0; i < 11; i++) bar([V(3.4, 6.6 + i * 0.34, z1 - 0.28), V(3.8, 6.6 + i * 0.34, z1 - 0.28)], 0.014);
  box('doorG', V(e2 - 0.04, 1.05, 11.2), 0.08, 2.1, 0.95, 0); box('conc', V(e2 - 0.06, 2.2, 11.2), 0.14, 0.14, 1.2, 0);       /* a back door under it, with a caged lamp */
  wallLamp(group, L[2], -1, 0);
 

  /* lamps on the walls, their light on the wet ground */
  wallLamp(group, L[7], 1, 0);
  wallLamp(group, L[8], -1, 0);
  box('doorG', V(ax - 0.04, 1.05, 3.4), 0.08, 2.1, 0.95, 0); box('conc', V(ax - 0.06, 2.2, 3.4), 0.14, 0.14, 1.2, 0); box('steelG', V(ax - 0.1, 1.0, 3.05), 0.03, 0.12, 0.04, 0);

  /* on the walls: meters and their pipes, a duct, downpipes, air units, paint */
  meterBank(-ax, 1, 1.3, 4, 1.45, plates);
  for (i = 0; i < 9; i++) { box('galv', V(ax - 0.16, 1.5 + i * 1.2, 7.2), 0.32, 1.2, 0.4, 0); box('steelK', V(ax - 0.16, 0.9 + i * 1.2, 7.2), 0.36, 0.04, 0.44, 0); }      /* a ventilation duct up the wall */
  box('galv', V(ax - 0.29, 0.69, 7.2), 0.58, 0.42, 0.4, 0); hang('grate', ax - 0.585, 0.69, 7.2, 0.32, 0.3, -1, 0, 0);
  pipe('steelK', [V(-ax + 0.1, 14, 7.2), V(-ax + 0.1, 0.35, 7.2), V(-ax + 0.3, 0.12, 7.2)], 0.06, 8);          /* downpipes */
  pipe('steelK', [V(e2 - 0.1, 9.5, 16.7), V(e2 - 0.1, 0.35, 16.7), V(e2 - 0.3, 0.12, 16.7)], 0.06, 8);
  [[-ax, 4.3], [ax, 7.5], [nk, 5.2]].forEach(function (k) { for (var n = 0; n < WIN.length; n++) if (Math.abs(WIN[n].x - k[0]) < 0.01 && Math.abs(WIN[n].y - k[1]) < 0.01 && WIN[n].key !== 'boards') { airUnit(WIN[n]); break; } });
  plates.push([TEX.tagCrown, 1.6, 1.3, V(e2 - 0.03, 1.9, 13.6), V(-1, 0, 0)]);
  plates.push([TEX.scr[0], 1.25, 0.75, V(ax - 0.03, 1.5, 1.2), V(-1, 0, 0), 0.08]); plates.push([TEX.scr[1], 1.1, 0.66, V(nk + 0.03, 2.3, 8.6), V(1, 0, 0), -0.1]);
  plates.push([TEX.scr[2], 1.25, 0.75, V(-ax + 0.03, 2.55, 3.3), V(1, 0, 0), 0.05]); plates.push([TEX.scr[3], 1.0, 0.6, V(e2 - 0.03, 1.4, 9.9), V(-1, 0, 0), -0.06]);
  conduit(ax, -1, 0.3, 7.7, 3.0, [0.5, 6.2]); conduit(e2, -1, 8.3, 16.8, 2.85, [12.4]);
  ladder(-2.75, -ax + 0.03, 0.42, 3.3); roadCone(-1.2, 0.6); roadCone(1.75, 6.6);
  bottle(-3.75, 13.1, 0.95); bottle(-3.92, 12.9, 0.95, 0.8); bottle(2.6, 3.0, 0, 2.1); bottle(-2.9, 4.3); bottle(-2.75, 4.45, 0, 4.0); bottle(e2 - 0.4, 9.3, 0, 1.2);
  wallDecal('dripS', V(ax, 2.6, 1.6), 0.9, 2.8, V(-1, 0, 0)); wallDecal('dripS', V(-1.9, 6.0, 0), 1.0, 2.6, V(0, 0, 1));

  /* on the ground: dumpsters, bags, boxes, pallets, tires */
  dumpster(-ax + 0.72, 3.4, Math.PI / 2, false, 601); dumpster(ax - 0.74, 5.4, -Math.PI / 2 + 0.07, true, 604);
  bag(-ax + 0.5, 5.0, 1.0, 611); bag(-ax + 1.1, 5.3, 0.85, 612); bag(-ax + 0.55, 5.75, 0.9, 613, 'bagW'); bag(ax - 0.5, 6.75, 1.0, 614); bag(ax - 1.2, 6.5, 0.8, 615); bag(ax - 1.35, 4.2, 0.9, 616);
  bag(-ax + 0.45, 0.8, 0.9, 617); bag(e2 - 0.5, 15.9, 1.0, 618); bag(e2 - 1.15, 16.3, 0.85, 619, 'bagW'); bag(e2 - 0.55, 14.9, 0.8, 620);
  pallet(xf(2.25, 0, 1.5, 0, 0.12, 0)); pallet(xf(2.3, 0.14, 1.55, 0, -0.06, 0)); pallet(xf(2.2, 0.28, 1.45, 0, 0.2, 0)); shadow(2.25, 1.5, 0, 0.85);
  carton(2.3, 0.42, 1.5, 0.5, 0.5); carton(1.2, 0, 0.75, 0.55, 0.2, true);
  pallet(xf(ax - 0.2, 0.62, 2.0 - 0.0, 0, -Math.PI / 2, -1.3));                                               /* one leaning by the door */
  tireStack(-ax + 0.42, 6.95, 3);
  carton(-2.4, 0, 6.5, 0.6, 0.4); carton(-2.3, 0.46, 6.55, 0.45, -0.3); carton(-1.75, 0, 6.9, 0.4, 1.0, true);
  drum(e2 - 0.45, 8.5, 'drumR'); drum(e2 - 1.1, 8.35, 'drumB');
  /* wet: puddles, and the lamps showing in them */
  [[0.2, 4.4, 2.6], [-0.4, 8.8, 2.4], [0.8, 11.6, 2.2]].forEach(function (p) { decal('poolO', V(p[0], 0.011, p[1]), p[2], p[2], 0); });
  /* overhead: strings of bulbs, wires */
  bulbString(group, V(-ax, 5.2, 2.8), V(ax, 4.9, 6.2), 0.55, 11); bulbString(group, V(ax, 4.9, 6.2), V(-ax, 5.4, 7.3), 0.5, 10); bulbString(group, V(-ax, 5.4, 7.3), V(e2, 5.7, 14.6), 0.7, 13);
  pipe('wire', sagPts(V(-ax, 8.6, 1.6), V(ax, 9.1, 3.0), 0.7, 12), 0.012, 4); pipe('wire', sagPts(V(-ax, 9.4, 5.6), V(ax, 8.2, 7.6), 0.9, 12), 0.012, 4); pipe('wire', sagPts(V(nk, 8.4, 10.2), V(e2, 8.8, 12.8), 1.0, 12), 0.012, 4);
}

/* ---------------- the far half: the stoop, the fire barrel, the mouth of the alley and the street beyond ---------------- */
function farZone(group, plates) {
  var ax = AL.ax, az = AL.az, nk = AL.nook, e2 = AL.e2, i, L = FAR_LIGHTS.lamps;
  quad('asphalt', V(nk, 0, 13), V(e2, 0, 13), V(e2, 0, az), V(nk, 0, az), V(0, -5, 18));
  box('grate', V(0, 0.004, 18.4), 0.22, 0.008, 10.8, 0);
  /* left: a tall block of old painted brick with the stoop; right: a sooty one with a shutter */
  wallQ('brickP', -ax, 15, -ax, az, 0, 16, 1, 0); wallQ('brickP', nk, 15, -ax, 15, 0, 16, 0, -1); wallQ('brickP', -14, 15, nk, 15, 10, 16, 0, -1);
  trim('conc', -ax, 15, -ax, az, 16.12, 0.3, 0.4, 1, 0); trim('conc', -ax, 15, -ax, az, 3.6, 0.16, 0.1, 1, 0);
  windowsOn(-ax, 15.6, -ax, az - 0.4, 1, 0, [4.4, 7.5, 10.6, 13.6], 3, 521, 0.3, 0.1);
  wallQ('brickY', ax, 17, ax, az, 0, 12.5, -1, 0); wallQ('brickY', ax, 17, 14, 17, 0, 12.5, 0, -1);
  trim('conc', ax, 17, ax, az, 12.62, 0.3, 0.4, -1, 0); trim('conc', ax, 17, ax, az, 3.6, 0.16, 0.1, -1, 0);
  windowsOn(ax, 17.5, ax, az - 0.4, -1, 0, [4.4, 7.5, 10.4], 2, 522, 0.25, 0.3);
  shutterAt(ax, 20.6, 3.0, 3.0, -1, 0, 0); wallLamp(group, L[8], -1, 0);
  plates.push([TEX.tagKO, 1.7, 1.4, V(ax - 0.07, 1.6, 20.6), V(-1, 0, 0)]);
  [[17.5, 2.3, 0, 0.03], [18.14, 2.27, 1, -0.02], [18.78, 2.31, 2, 0.04], [17.56, 1.4, 1, -0.04], [18.2, 1.37, 0, 0.02], [18.84, 1.41, 1, 0.05]].forEach(function (b) { plates.push([TEX.bill[b[2]], 0.6, 0.85, V(ax - 0.03, b[1], b[0]), V(-1, 0, 0), b[3], true]); });      /* a wall of bills */
  [[16.0, 1.9, 2, 0.03], [16.64, 1.86, 0, -0.03]].forEach(function (b) { plates.push([TEX.bill[b[2]], 0.6, 0.85, V(-ax + 0.03, b[1], 15.0 + (b[0] - 15.0)), V(1, 0, 0), b[3], true]); });
  plates.push([TEX.scr[4], 1.25, 0.75, V(-ax + 0.03, 1.5, 23.2), V(1, 0, 0), 0.07]); plates.push([TEX.scr[5], 1.1, 0.66, V(ax - 0.03, 2.4, 23.0), V(-1, 0, 0), -0.05]); plates.push([TEX.scr[0], 1.0, 0.6, V(-ax + 0.03, 2.2, 17.9), V(1, 0, 0), -0.08]);
  conduit(-ax, 1, 15.3, 23.8, 3.25, [18.2, 21.0]);
  roadCone(2.6, 23.6); roadCone(-0.9, 23.9); bottle(-ax + 1.45, 18.9, 0.36); bottle(-ax + 1.7, 19.2, 0.18, 2.4); bottle(-ax + 1.3, 20.2, 0.36); bottle(2.3, 19.7); bottle(0.9, 21.1, 0, 0.6); bottle(ax - 0.9, 19.3, 0, 3.3); bottle(1.0, 20.75);
  [[-ax, 15, -ax, az, 1, 0], [ax, 17, ax, az, -1, 0], [nk, 13, nk, 15, 1, 0], [e2, 13, e2, 17, -1, 0]].forEach(function (w) {
    shade(V(w[0] + w[4] * 0.012, 0, w[1] + w[5] * 0.012), V(w[2] + w[4] * 0.012, 0, w[3] + w[5] * 0.012), V(0, 1, 0), 1.3);
    shade(V(w[0], 0.012, w[1]), V(w[2], 0.012, w[3]), V(w[4], 0, w[5]), 0.8);
  });
  for (var n = 0; n < WIN.length; n++) if (Math.abs(WIN[n].x + ax) < 0.01 && WIN[n].z > 15 && Math.abs(WIN[n].y - 7.5) < 0.01 && WIN[n].key !== 'boards') { airUnit(WIN[n]); break; }
  pipe('steelK', [V(-ax + 0.1, 16, 15.25), V(-ax + 0.1, 0.35, 15.25), V(-ax + 0.3, 0.12, 15.25)], 0.06, 8);
  box('steelG', V(-ax + 0.14, 3.0, 22.6), 0.28, 0.7, 0.7, 0); hang('grate', -ax + 0.285, 3.0, 22.6, 0.56, 0.56, 1, 0, 0); wallDecal('dripS', V(-ax, 1.6, 22.6), 0.8, 2.2, V(1, 0, 0));      /* an extractor fan */
  wallDecal('dripS', V(ax, 2.4, 18.3), 1.0, 2.8, V(-1, 0, 0)); wallDecal('dripS', V(-ax, 2.6, 17.2), 0.9, 2.6, V(1, 0, 0));

  /* the back-door stoop: three steps up to a door, iron rails, a lamp over it, somewhere to sit */
  var sz = 19.5;
  box('conc', V(-ax + 0.55, 0.27, sz), 1.1, 0.54, 2.2, 0); box('conc', V(-ax + 1.25, 0.18, sz), 0.3, 0.36, 2.2, 0); box('conc', V(-ax + 1.55, 0.09, sz), 0.3, 0.18, 2.2, 0);
  box('doorG', V(-ax + 0.04, 0.54 + 1.05, sz), 0.08, 2.1, 1.0, 0); box('conc', V(-ax + 0.06, 0.54 + 2.2, sz), 0.14, 0.14, 1.24, 0); box('steelG', V(-ax + 0.1, 1.55, sz + 0.36), 0.03, 0.12, 0.04, 0);
  [sz - 1.08, sz + 1.08].forEach(function (z) { pipe('steelK', [V(-ax + 0.1, 1.44, z), V(-ax + 1.15, 1.44, z), V(-ax + 1.72, 0.9, z), V(-ax + 1.72, 0.0, z)], 0.02, 6); pipe('steelK', [V(-ax + 1.15, 1.44, z), V(-ax + 1.15, 0.54, z)], 0.02, 6); });
  shadow(-ax + 0.9, sz, 0, 1.4, 1.3, 0);
  var LS = L[7]; box('steelK', V(-ax + 0.07, 3.06, sz), 0.14, 0.1, 0.2, 0); lampBulb(group, V(-ax + 0.14, 2.96, sz), 0.06, LS, 0xffe0b0); lampHalo(group, V(-ax + 0.2, 2.96, sz), 1.3, LS, 0xffc890);
  crate(V(-ax + 0.55, 0, sz + 1.75), 0.65, 0.15); crate(V(-ax + 0.5, 0, sz + 2.5), 0.55, -0.2); crate(V(-ax + 1.3, 0, sz + 2.0), 0.5, 0.5);
  dumpster(-ax + 0.72, 16.6, Math.PI / 2 + 0.05, false, 631); bag(-ax + 1.6, 16.0, 0.9, 632); bag(-ax + 1.75, 17.1, 1.0, 633, 'bagW');

  /* the fire barrel: an oil drum with a fire in it */
  var bp = V(AT.barrel.x, 0, AT.barrel.z), LF = L[6];
  drum(bp.x, bp.z, 'drumK', 0, true);
  var ember = new T.Mesh(new T.CircleGeometry(0.272, 24), new T.MeshBasicMaterial({ color: 0xff7a1c })); ember.rotation.x = -Math.PI / 2; ember.position.set(bp.x, 0.66, bp.z); group.add(ember); LF.bulb = ember;
  lampHalo(group, V(bp.x, 1.08, bp.z), 1.7, LF, 0xff8a2a); LF.halo.scale.set(1.3, 1.9, 1);
  [[0xff5a10, 0.74, 1.25, 1.12, 0.8], [0xffa030, 0.5, 0.9, 1.02, 1.0], [0xffe6a0, 0.26, 0.44, 0.9, 0.8]].forEach(function (f) {      /* flames: three soft tongues, one inside the other */
    var fl = new T.Sprite(new T.SpriteMaterial({ map: glowTex(), color: f[0], blending: T.AdditiveBlending, depthWrite: false, transparent: true, opacity: f[4] })); fl.position.set(bp.x, f[3], bp.z); fl.scale.set(f[1], f[2], 1); fl.renderOrder = 3; group.add(fl);
  });
  shadow(bp.x, bp.z, 0, 0.45); decal('poolF', V(bp.x, 0.011, bp.z), 4.4, 4.4, 0);
  couch(ax - 0.47, 20.6, -Math.PI / 2, 4);              /* an old couch against the wall, facing the fire: somewhere to hang out */
  if (typeof PROPS !== 'undefined' && PROPS.on) PROPS.add('boombox', { x: ax - 0.45, z: 22.6, y: 0.95, yaw: -Math.PI / 2 - 0.35 });      /* on the drum, facing the couch and the fire */
  /* more left about: drums, boxes, a pallet, tires */
  drum(ax - 0.45, 22.6, 'drumB'); drum(ax - 1.1, 23.0, 'drumK'); drum(ax - 0.5, 23.3, 'drumR');
  carton(ax - 0.5, 0, 18.3, 0.6, 0.2); carton(ax - 0.55, 0.46, 18.35, 0.5, -0.25); carton(ax - 1.15, 0, 18.6, 0.45, 0.8, true); carton(ax - 0.45, 0, 19.0, 0.4, 0.1);
  tireStack(-ax + 0.45, 23.35, 2); tire(-ax + 1.1, 0, 23.1, 0.4);
  /* a hanging lamp on a wire across the alley, its beam in the damp air; steam off a manhole */
  var LP_ = L[3]; pipe('wire', sagPts(V(-ax, 6.4, 15.5), V(e2, 6.4, 16.7), 0.75, 12), 0.012, 4); pipe('wire', [V(AT.pend.x, 5.66, AT.pend.z), V(AT.pend.x, 5.3, AT.pend.z)], 0.008, 4);
  lathe('steelK', V(AT.pend.x, 5.1, AT.pend.z), [[0.34, 0], [0.3, 0.06], [0.1, 0.2], [0.06, 0.24], [0.0, 0.24]], 14);
  lampBulb(group, V(AT.pend.x, 5.08, AT.pend.z), 0.08, LP_, 0xfff0c8); lampHalo(group, V(AT.pend.x, 5.0, AT.pend.z), 2.0, LP_, 0xffd9a0);
  lightCone(group, V(AT.pend.x, 5.1, AT.pend.z), 3.0, 5.1, 0xffe2b0, 0.26); decal('poolO', V(AT.pend.x, 0.011, AT.pend.z), 5.5, 5.5, 0);
  lathe('steelK', V(-1.1, 0.002, 14.2), [[0.42, 0], [0.42, 0.012], [0.0, 0.014]], 16);
  [[0.4, 0.9, 0.17], [1.0, 1.3, 0.13], [1.7, 1.8, 0.09], [2.5, 2.3, 0.06], [3.4, 2.8, 0.035]].forEach(function (s) {
    var sp = new T.Sprite(new T.SpriteMaterial({ map: glowTex(), color: 0xb4c0d2, depthWrite: false, transparent: true, opacity: s[2] * 2.4 })); sp.position.set(-1.1 + s[0] * 0.14, s[0], 14.2 - s[0] * 0.08); sp.scale.set(s[1], s[1] * 1.25, 1); sp.renderOrder = 3; group.add(sp);
  });
  [[0.3, 19.2, 2.4], [-0.2, 22.3, 2.4]].forEach(function (p) { decal('poolO', V(p[0], 0.011, p[1]), p[2], p[2], 0); });
  bulbString(group, V(e2, 5.7, 14.6), V(-ax, 5.2, 16.4), 0.6, 11); bulbString(group, V(-ax, 5.2, 16.4), V(ax, 5.0, 19.6), 0.55, 11); bulbString(group, V(ax, 5.0, 19.6), V(-ax, 5.3, 22.6), 0.55, 11);
  pipe('wire', sagPts(V(-ax, 9.0, 18.0), V(ax, 8.6, 21.2), 0.9, 12), 0.012, 4); pipe('wire', sagPts(V(-ax, 11.2, 21.8), V(ax, 10.4, 23.2), 0.8, 12), 0.012, 4);

}

/* ---------------- everything ---------------- */
function streetMats() {
  function mat(o) { o.snap = false; return roomMat(o); }
  function mark(tex, opacity) { var m = new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: opacity, side: T.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }); m.userData.decal = true; return m; }
  function light(tex, colour, strength) { var m = new T.MeshBasicMaterial({ map: tex, color: colour, transparent: true, depthWrite: false, opacity: strength, blending: T.AdditiveBlending, side: T.DoubleSide, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }); m.userData.decal = true; return m; }
  var bt = [1.6, 1.2], G = glowTex();
  return {
    brickR: mat({ tex: TEX.brickR, tile: bt, grime: 0.8 }), brickD: mat({ tex: TEX.brickD, tile: bt, grime: 0.8 }), brickP: mat({ tex: TEX.brickP, tile: bt, gloss: 0.08, shine: 20, grime: 0.8 }), brickY: mat({ tex: TEX.brickY, tile: bt, grime: 0.8 }),
    asphalt: mat({ tex: TEX.asphalt, tile: 3.2, gloss: 0.8, shine: 30, grime: 0.4 }), walk: mat({ tex: TEX.walk, tile: 2.4, gloss: 0.35, shine: 30, grime: 0.5 }), curb: mat({ tex: TEX.conc, tile: 1.6, color: 0xb9bcc0, gloss: 0.2, grime: 0.5 }),
    conc: mat({ tex: TEX.conc, tile: 1.6, gloss: 0.12, grime: 0.65 }), paintG: mat({ tex: TEX.paintG, tile: 0.8, gloss: 0.3, shine: 24, grime: 0.6 }),
    steelK: mat({ tex: TEX.steelK, tile: 0.8, gloss: 0.35, shine: 30, two: true }), steelG: mat({ tex: TEX.galvT, tile: 0.7, color: 0xd6dade, gloss: 0.4, shine: 30, two: true, grime: 0.5 }), panelK: mat({ tex: TEX.steelK, tile: 0.8, color: 0xd2d6dc, gloss: 0.3, shine: 30 }),
    lidK: mat({ color: 0x1b1d20, gloss: 0.1, shine: 12, two: true, grime: 0.4 }),
    galv: mat({ tex: TEX.galvT, tile: 0.7, color: 0xa4a9b0, gloss: 0.4, shine: 24, grime: 0.6 }),
    rustS: mat({ tex: TEX.steelK, tile: 0.8, color: 0xb07a58, gloss: 0.15, two: true, grime: 0.5 }),
    drumB: mat({ tex: TEX.drumB, gloss: 0.3, shine: 18, two: true }), drumR: mat({ tex: TEX.drumR, gloss: 0.18, shine: 14, two: true }), drumK: mat({ tex: TEX.drumK, gloss: 0.3, shine: 18, two: true }),
    drumLid: mat({ tex: TEX.steelK, tile: 0.6, color: 0x9aa0a8, gloss: 0.3, shine: 20, two: true, grime: 0.5 }), drumIn: mat({ color: 0x0c0a09, two: true }),
    coneT: mat({ tex: TEX.coneT, gloss: 0.18, shine: 14 }), coneB: mat({ color: 0x1a1a1c, gloss: 0.15, grime: 0.4 }), tireS: mat({ tex: TEX.tireT, tile: [0.05, 1], gloss: 0.22, shine: 14, two: true }),
    labelP: mat({ color: 0xb9b4a6, grime: 0.3 }), glassBr: mat({ color: 0x3a2412, gloss: 1.0, shine: 46, two: true }),
    woodS: mat({ tex: TEX.woodS, tile: 1.2, color: 0x7f848c, gloss: 0.1, two: true, grime: 0.45 }), boards: mat({ tex: TEX.woodS, color: 0x9a8a74, two: true, grime: 0.4 }), shutter: mat({ tex: TEX.shutter, tile: [0.8, 0.8], gloss: 0.3, shine: 26, two: true, grime: 0.55 }),
    winDark: mat({ tex: TEX.winDark, gloss: 0.9, shine: 60, two: true }), winLit: mat({ tex: TEX.winLit, glow: 0.5, two: true }), winLit2: mat({ tex: TEX.winLit2, glow: 0.42, two: true }),
    dark: mat({ color: 0x050607, two: true }), doorG: mat({ tex: TEX.paintG, tile: 0.8, color: 0xa8b0a8, gloss: 0.25, grime: 0.55 }), hazardS: mat({ tex: TEX.hazardS, tile: 0.5, color: 0xbfbfbf, grime: 0.5 }), callB: mat({ color: 0x38c060, glow: 0.8 }), couchF: mat({ tex: TEX.couchF, tile: 0.5, gloss: 0.06, shine: 8, grime: 0.6 }),
    grate: mat({ tex: TEX.grate, tile: 0.2, two: true, gloss: 0.3 }), fenceS: mat({ tex: TEX.fence, tile: 0.56, two: true, cut: true }), rubberS: mat({ color: 0x141416, gloss: 0.15 }),
    bagK: mat({ tex: TEX.bagT, gloss: 0.1, shine: 7, two: true }), bagW: mat({ tex: TEX.bagT, color: 0xb9bdc6, gloss: 0.1, shine: 7, two: true }), card: mat({ tex: TEX.card, tile: 0.8, color: 0xa4a9b3, two: true, grime: 0.4 }), tape: mat({ color: 0x7c6f52 }),
    wire: mat({ color: 0x0c0c0e, two: true }), bulbE: mat({ color: 0xffd9a0, glow: 3.0, two: true }), glassM: mat({ color: 0x2a3440, gloss: 0.9, shine: 60, two: true }),
    glassB: mat({ color: 0x1f3a2a, gloss: 1.0, shine: 46, two: true }),
    clothA: mat({ color: 0xa9a394, two: true }), clothB: mat({ color: 0x44587c, two: true }), clothC: mat({ color: 0x7c443c, two: true }),
    dripS: mark(TEX.dripS, 0.75), poolO: light(G, 0xffa850, 0.2), poolF: light(G, 0xff7a20, 0.16),
    blob: mark(TEX.softBlob, 1), strip: mark(TEX.softStrip, 1)
  };
}
function streetFighters() {
  var list = [];
  function add(pos, at, pose, set, shadowR) { list.push({ pos: pos, yaw: facing(pos, at), pose: pose, shadow: shadowR === undefined ? 0.55 : shadowR, set: set, look: STREET_LOOK }); }
  add(V(2.45, 0, 19.35), V(1.4, 0, 20.0), 'stand', FAR_LIGHTS); add(V(1.75, 0, 21.05), V(1.4, 0, 20.0), 'stand', FAR_LIGHTS);          /* two at the fire barrel */
  add(V(-AL.ax + 0.6, 0.54 - 0.26, 19.5), V(2, 0, 19.2), 'perch', FAR_LIGHTS, 0);                                                   /* one sitting on the stoop */
  add(V(-3.95, 0.95 - 0.26, 11.3), V(2, 0, 11.0), 'perch', NEAR_LIGHTS, 0);                                                         /* one on the edge of the dock */
  add(V(3.3, 3.3 - 0.26, 11.9), V(-2, 0, 11.4), 'perch', NEAR_LIGHTS, 0);                                                           /* one up on the fire escape */
  add(V(-2.0, 0, 4.1), V(0, 0, 0), 'stand', NEAR_LIGHTS);
  townFighters(add);                                                                           /* one waiting for the elevator */
  return list;
}
function buildStreet(world, step) {
  var plates = [], list = [];
  function zone(name, set, fn) {
    useLights(set);
    step(name, function () { fn(world, plates); });
    step(name + ' paint', function () { plates.forEach(function (p) { stick(world, p[0], p[1], p[2], p[3], p[4], p[5], p[6]); }); plates.length = 0; });
    step(name + ' shadows', function () { list.forEach(function (s) { if (s.set === set && s.shadow) shadow(s.pos.x, s.pos.z, s.pos.y, s.shadow); }); });
    finalize(world, streetMats);
  }
  step('who is where', function () { list = streetFighters(); });
  zone('alley, near half', NEAR_LIGHTS, nearZone);
  zone('alley, far half', FAR_LIGHTS, farZone);
  zone('street, near end', S1_LIGHTS, townNear);
  zone('street, far end', S2_LIGHTS, townFar);
  if (typeof buildRoofs === 'function') zone('roofs', ROOF_LIGHTS, buildRoofs);      /* on the headset page: every roof, and the city past them */
  step('skyline', function () {                           /* the city over the rooftops, at both ends */
    var m = new T.MeshBasicMaterial({ map: TEX.far, transparent: true, alphaTest: 0.5, side: T.DoubleSide, fog: false });
    [[V(10, 26, 78), V(0, 0, -1), 190, 44], [V(10, 26, -44), V(0, 0, 1), 190, 44], [V(84, 26, 20), V(-1, 0, 0), 150, 44], [V(-52, 26, 20), V(1, 0, 0), 150, 44]].forEach(function (s) {
      var mesh = new T.Mesh(new T.PlaneGeometry(s[2], s[3]), m); mesh.position.copy(s[0]); mesh.lookAt(s[0].clone().add(s[1])); world.add(mesh);
    });
  });
  step('wet ground', function () { buildWet(world); });
  useLights(ARENA_LIGHTS);
  return list;
}
