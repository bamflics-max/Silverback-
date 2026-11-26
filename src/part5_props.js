/* ================================================================== */
/* Loose things you can knock over, pick up and throw: bottles (which  */
/* smash on a hard hit and come back later), soda cans, the basketball */
/* and the trash bags. A small physics of its own: each thing is a few */
/* spheres that bounce, slide and roll on the street's surfaces. Close */
/* your whole fist (grip and trigger) to grab, open it to let go.      */
/* ================================================================== */
var PROPS = { on: true, building: false, specs: [], list: [], mats: {}, ready: false, hint: false, shadows: null, shards: null, shardList: [], time: 0, score: 0 };
PROPS.add = function (type, o) { o.type = type; o.uni = LIGHTS; o.lamps = LAMPS; PROPS.specs.push(o); };      /* remembers the lamps of the part of the street that put it there */
PROPS.sets = [];
function ring4(rad, y, r) { return [[rad, y, 0, r], [-rad, y, 0, r], [0, y, rad, r], [0, y, -rad, r]]; }      /* small balls round a flat end, so a bottle or can stands on it instead of balancing on a point */
var PTYPE = {                                            /* spheres: [x, y, z, r] measured up from the bottom of the thing */
  bottle: { mass: 0.45, e: 0.22, mu: 0.4, spheres: ring4(0.021, 0.01, 0.01).concat([[0, 0.034, 0, 0.031], [0, 0.094, 0, 0.031], [0, 0.168, 0, 0.019], [0, 0.212, 0, 0.0155]]), breaks: 3.0, snd: 'glass' },      /* breaks: knocked off a crate, or dropped from a hand, it smashes */
  can: { mass: 0.3, e: 0.3, mu: 0.5, spheres: ring4(0.024, 0.008, 0.008).concat(ring4(0.024, 0.114, 0.008), [[0, 0.032, 0, 0.032], [0, 0.09, 0, 0.032]]), snd: 'can' },
  ball: { mass: 0.6, e: 0.85, mu: 0.75, spheres: [[0, 0.12, 0, 0.12]], snd: 'ball', roll: true },
  bag: { mass: 3.5, e: 0.04, mu: 0.95, spheres: null, snd: 'bag' },
  boombox: { mass: 3.2, e: 0.12, mu: 0.6, spheres: [-0.165, -0.055, 0.055, 0.165].reduce(function (a, x) { return a.concat([[x, 0.065, 0, 0.065], [x, 0.205, 0, 0.065]]); }, []), snd: 'boom' }
};
/* extra soda cans, standing (lie undefined) or lying on their side, on surfaces that are really there */
var CANS = [[2.95, 0, 6.05, 1.2], [-3.95, 0.95, 11.55], [0.7, 0, 20.45], [-2.25, 0.36, 18.75], [-5.1, 0.66, 24.45], [9.6, 0.12, 25.7, 0.4], [37.85, 6.466, 17.45], [35.4, 0, 31.3, 2.2], [27.2, 0, 22.6], [-0.5, 0, 9.2, 3.0]];
var PV = V(0, 0, 0), PN = V(0, 0, 0), PC = V(0, 0, 0), PO = V(0, 0, 0), PRC = V(0, 0, 0), PVC = V(0, 0, 0), PRX = V(0, 0, 0), PVT = V(0, 0, 0), PQ = new T.Quaternion(), PQ2 = new T.Quaternion(), PM = new T.Matrix4(), PS = V(1, 1, 1);

/* ---------------- how each thing looks ---------------- */
function latheGeo(prof, seg, H) {                        /* a turned shape, texture v running bottom (0) to top (1) by height */
  var pos = [], nrm = [], uv = [], n = prof.length, i, j, nr = [];
  for (i = 0; i < n; i++) { var a = prof[Math.max(0, i - 1)], b = prof[Math.min(n - 1, i + 1)], dr = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dr, dy) || 1; nr.push([dy / l, -dr / l]); }
  function push(i, j) { var ang = j / seg * Math.PI * 2, s = Math.sin(ang), c = Math.cos(ang); pos.push(s * prof[i][0], prof[i][1], c * prof[i][0]); nrm.push(s * nr[i][0], nr[i][1], c * nr[i][0]); uv.push(j / seg, prof[i][1] / H); }
  for (i = 0; i < n - 1; i++) for (j = 0; j < seg; j++) {
    if (prof[i][0] > 1e-5) { push(i, j); push(i, j + 1); push(i + 1, j + 1); }
    if (prof[i + 1][0] > 1e-5) { push(i, j); push(i + 1, j + 1); push(i + 1, j); }
  }
  var g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(nrm, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  return g;
}
function propTextures() {
  function paint(w, h, fn) { var c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); var t = smoothTex(new T.CanvasTexture(c)); t.userData = { w: w, h: h }; return t; }
  function bottleTex(glass, label, ink) {
    return paint(64, 256, function (g, w, h) {                /* v = 0 at the bottom: the canvas is drawn upside down from that */
      g.fillStyle = glass; g.fillRect(0, 0, w, h);
      var gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.45, 'rgba(255,255,255,0.18)'); gr.addColorStop(0.55, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      var y0 = h * (1 - 0.5), y1 = h * (1 - 0.22);             /* the paper label, between 22% and 50% of the height */
      g.fillStyle = label; g.fillRect(0, y0, w, y1 - y0); g.fillStyle = ink; g.fillRect(0, y0 + (y1 - y0) * 0.38, w, (y1 - y0) * 0.24);
      g.fillStyle = 'rgba(60,50,40,0.35)'; for (var k = 0; k < 6; k++) g.fillRect(Math.random() * w, y0 + Math.random() * (y1 - y0), 3 + Math.random() * 6, 2);
      g.fillStyle = '#b9b2a0'; g.fillRect(0, 0, w, h * 0.05);   /* the cap */
    });
  }
  TEX.bottleBr = bottleTex('#3b220f', '#c9bd9c', '#8a2f22'); TEX.bottleGr = bottleTex('#1c3424', '#d6d0bd', '#24426e');
  function canTex(body, band) {
    return paint(64, 128, function (g, w, h) {
      g.fillStyle = '#aab0b6'; g.fillRect(0, 0, w, h);
      g.fillStyle = body; g.fillRect(0, h * 0.09, w, h * 0.82);
      g.fillStyle = band; g.fillRect(0, h * 0.42, w, h * 0.12); g.beginPath(); g.arc(w * 0.3, h * 0.48, w * 0.12, 0, 7); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.22)'; g.fillRect(w * 0.45, h * 0.09, w * 0.08, h * 0.82);
    });
  }
  TEX.canR = canTex('#9e2a22', '#f1ece2'); TEX.canB = canTex('#24477e', '#e9e5da'); TEX.canG = canTex('#2c5a34', '#e7e0c8');
  TEX.boomF = paint(256, 150, function (g, w, h) {           /* the boombox's front: two speakers, the tape deck, the tuner strip */
    g.fillStyle = '#17181b'; g.fillRect(0, 0, w, h); g.fillStyle = '#26282d'; g.fillRect(4, 4, w - 8, h - 8);
    g.fillStyle = '#8d9298'; g.fillRect(6, 10, w - 12, 3); g.fillRect(6, h - 13, w - 12, 3);
    [58, 198].forEach(function (x) {
      var y = 84; g.fillStyle = '#0d0e10'; g.beginPath(); g.arc(x, y, 50, 0, 7); g.fill();
      g.strokeStyle = '#9ba0a6'; g.lineWidth = 3; g.beginPath(); g.arc(x, y, 50, 0, 7); g.stroke();
      g.fillStyle = '#2b2d31'; for (var yy = y - 44; yy < y + 44; yy += 5) for (var xx = x - 44; xx < x + 44; xx += 5) if ((xx - x) * (xx - x) + (yy - y) * (yy - y) < 44 * 44) g.fillRect(xx, yy, 2.4, 2.4);      /* the grille */
      g.fillStyle = '#3c3f44'; g.beginPath(); g.arc(x, y, 12, 0, 7); g.fill();
    });
    g.fillStyle = '#0b0c0d'; g.fillRect(104, 58, 48, 42); g.strokeStyle = '#8d9298'; g.lineWidth = 2; g.strokeRect(104, 58, 48, 42);      /* the tape deck */
    g.fillStyle = '#3d2f24'; g.fillRect(110, 70, 36, 16); g.fillStyle = '#c9c2b0'; [118, 138].forEach(function (x) { g.beginPath(); g.arc(x, 78, 5, 0, 7); g.fill(); });
    g.fillStyle = '#0b0c0d'; g.fillRect(100, 22, 56, 22); g.strokeStyle = '#c9c2b0'; g.lineWidth = 1; for (var k = 0; k < 12; k++) { g.beginPath(); g.moveTo(104 + k * 4.4, 36); g.lineTo(104 + k * 4.4, 40); g.stroke(); }
    g.fillStyle = '#d23a2a'; g.fillRect(126, 25, 2, 15);                                         /* the tuner's needle */
    g.fillStyle = '#8d9298'; for (var b = 0; b < 4; b++) g.fillRect(106 + b * 12, 110, 8, 18);  /* the sliders */
  });
  TEX.boomT = paint(128, 64, function (g, w, h) {             /* its top: the piano keys, play in red */
    g.fillStyle = '#1d1e21'; g.fillRect(0, 0, w, h);
    for (var k = 0; k < 6; k++) { g.fillStyle = k === 1 ? '#b8382a' : '#a9adb2'; g.fillRect(30 + k * 11, 40, 9, 18); g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(30 + k * 11, 55, 9, 3); }
  });
  TEX.ballT = paint(256, 128, function (g, w, h) {           /* a basketball, worn: pebbled orange, black seams */
    g.fillStyle = '#b4561c'; g.fillRect(0, 0, w, h);
    for (var k = 0; k < 2600; k++) { g.fillStyle = Math.random() < 0.5 ? 'rgba(0,0,0,0.1)' : 'rgba(255,200,150,0.08)'; g.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5); }
    g.strokeStyle = '#1a1210'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke();
    [0.25, 0.75].forEach(function (u) { g.beginPath(); g.moveTo(w * u, 0); g.lineTo(w * u, h); g.stroke(); });
    [0, 0.5].forEach(function (u) { g.beginPath(); for (var y = 0; y <= h; y += 4) { var x = w * u + Math.sin(y / h * Math.PI) * w * 0.11; if (y) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke(); g.beginPath(); for (var y2 = 0; y2 <= h; y2 += 4) { var x2 = w * u - Math.sin(y2 / h * Math.PI) * w * 0.11; if (y2) g.lineTo(x2 < 0 ? x2 + w : x2, y2); else g.moveTo(x2 < 0 ? x2 + w : x2, y2); } g.stroke(); });
  });
}
var BOTTLE_PROF = [[0.0, 0], [0.026, 0], [0.031, 0.006], [0.031, 0.125], [0.027, 0.15], [0.014, 0.185], [0.0125, 0.214], [0.0155, 0.217], [0.0155, 0.228], [0.0, 0.228]];
var CAN_PROF = [[0.0, 0.002], [0.025, 0.0], [0.031, 0.008], [0.032, 0.013], [0.032, 0.109], [0.028, 0.118], [0.027, 0.122], [0.0, 0.12]];
function matsFor(o) {                                    /* each thing is lit by the lamps of the part of the street it starts in */
  if (!o.uni) {                                          /* the extra cans: the lamps of whatever the street put nearest */
    var best = null, bd = 1e9;
    PROPS.specs.forEach(function (q) { var d = (q.x - o.x) * (q.x - o.x) + (q.z - o.z) * (q.z - o.z); if (q.uni && d < bd) { bd = d; best = q; } });
    o.uni = best ? best.uni : ARENA_LIGHTS.uni; o.lamps = best ? best.lamps : ARENA_LIGHTS.lamps;
  }
  var key = PROPS.sets.indexOf(o.uni);
  if (key < 0) { key = PROPS.sets.length; PROPS.sets.push(o.uni); }
  if (PROPS.mats[key]) return PROPS.mats[key];
  useLights({ uni: o.uni, lamps: o.lamps });
  function mat(o) { o.snap = false; return roomMat(o); }
  var m = {
    bagK: mat({ tex: TEX.bagT, gloss: 0.1, shine: 7, two: true }), bagW: mat({ tex: TEX.bagT, color: 0xb9bdc6, gloss: 0.1, shine: 7, two: true }),
    bottleBr: mat({ tex: TEX.bottleBr, gloss: 1.0, shine: 46 }), bottleGr: mat({ tex: TEX.bottleGr, gloss: 1.0, shine: 46 }),
    canR: mat({ tex: TEX.canR, gloss: 0.7, shine: 34 }), canB: mat({ tex: TEX.canB, gloss: 0.7, shine: 34 }), canG: mat({ tex: TEX.canG, gloss: 0.7, shine: 34 }),
    ball: mat({ tex: TEX.ballT, gloss: 0.15, shine: 12 }),
    boomS: mat({ color: 0x1b1c1f, gloss: 0.35, shine: 30 }), boomF: mat({ tex: TEX.boomF, gloss: 0.25, shine: 26 }), boomT: mat({ tex: TEX.boomT, gloss: 0.35, shine: 30 }), chrome: mat({ color: 0xb4b8be, gloss: 0.85, shine: 60 })
  };
  useLights(ARENA_LIGHTS);
  return (PROPS.mats[key] = m);
}
function boomboxMesh(M) {                                /* 46 cm of black plastic, a chrome handle, an aerial: built standing on its base at the origin */
  var g = new T.Group(), W = 0.46, H = 0.27, D = 0.13;
  var body = new T.Mesh(new T.BoxGeometry(W, H, D), [M.boomS, M.boomS, M.boomT, M.boomS, M.boomF, M.boomS]); body.position.set(0, H / 2, 0); g.add(body);
  [-0.15, 0.15].forEach(function (x) { var post = new T.Mesh(new T.CylinderGeometry(0.008, 0.008, 0.06, 6), M.chrome); post.position.set(x, H + 0.03, 0); g.add(post); });
  var bar = new T.Mesh(new T.CylinderGeometry(0.011, 0.011, 0.33, 8), M.chrome); bar.rotation.z = Math.PI / 2; bar.position.set(0, H + 0.062, 0); g.add(bar);
  var aer = new T.Mesh(new T.CylinderGeometry(0.0025, 0.0035, 0.34, 4), M.chrome); aer.position.set(0.2, H + 0.15, -0.045); aer.rotation.z = -0.5; aer.rotation.x = -0.25; g.add(aer);
  return g;
}
function captureBag(o) {                                 /* the bag shape the street already makes, built at the origin as its own mesh */
  var keep = buckets; buckets = {}; PROPS.building = true;
  try { bag(0, 0, o.s, o.seed, o.key, 0); } finally { PROPS.building = false; }
  var got = buckets, b = got[o.key || 'bagK']; buckets = keep;
  var g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(b.pos, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(b.nrm, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(b.uv.length ? b.uv : new Array(b.pos.length / 3 * 2).fill(0), 2));
  return g;
}

/* ---------------- making them ---------------- */
function propMake(o) {
  var T_ = PTYPE[o.type], M = matsFor(o), geo, mat, spheres = T_.spheres;
  var green = false;
  if (o.type === 'bottle') { geo = PROPS.geoBottle || (PROPS.geoBottle = latheGeo(BOTTLE_PROF, 14, 0.228)); green = hash2(o.x, o.z, 3) >= 0.6; mat = green ? M.bottleGr : M.bottleBr; }
  else if (o.type === 'can') { geo = PROPS.geoCan || (PROPS.geoCan = latheGeo(CAN_PROF, 14, 0.122)); mat = [M.canR, M.canB, M.canG][Math.floor(hash2(o.x, o.z, 6) * 3) % 3]; }
  else if (o.type === 'ball') { geo = new T.SphereGeometry(0.12, 24, 16); geo.translate(0, 0.12, 0); mat = M.ball; }
  else if (o.type === 'boombox') geo = null;
  else { geo = captureBag(o); mat = M[o.key || 'bagK']; var s = o.s; spheres = [[0, 0.2 * s, 0, 0.2 * s], [0.14 * s, 0.16 * s, 0, 0.16 * s], [-0.14 * s, 0.16 * s, 0, 0.16 * s], [0, 0.16 * s, 0.12 * s, 0.16 * s], [0, 0.16 * s, -0.12 * s, 0.16 * s], [0, 0.34 * s, 0, 0.12 * s]]; }
  /* the centre of mass, and the spheres around it */
  var com = V(0, 0, 0), wsum = 0;
  spheres.forEach(function (q) { var w = q[3] * q[3] * q[3]; com.x += q[0] * w; com.y += q[1] * w; com.z += q[2] * w; wsum += w; });
  com.multiplyScalar(1 / wsum);
  var sph = spheres.map(function (q) { return { o: V(q[0] - com.x, q[1] - com.y, q[2] - com.z), r: q[3] }; }), I = 0, br = 0;
  sph.forEach(function (s, i) { var m = T_.mass * spheres[i][3] * spheres[i][3] * spheres[i][3] / wsum; I += m * (s.o.lengthSq() + 0.4 * s.r * s.r); br = Math.max(br, s.o.length() + s.r); });
  var mesh;
  if (o.type === 'boombox') { mesh = boomboxMesh(M); mesh.children.forEach(function (c) { c.position.sub(com); }); }
  else {
    if (o.type !== 'ball' && o.type !== 'bag') geo = geo.clone();
    geo.translate(-com.x, -com.y, -com.z);
    mesh = new T.Mesh(geo, mat);
  }
  scene.add(mesh);
  var P = { type: o.type, green: green, T: T_, mesh: mesh, sph: sph, im: 1 / T_.mass, iI: 1 / Math.max(I, 1e-5), br: br, com: com,
    home: { p: V(0, 0, 0), q: new T.Quaternion() }, p: V(0, 0, 0), q: new T.Quaternion(), sleepP: V(0, 0, 0), sleepQ: new T.Quaternion(), v: V(0, 0, 0), w: V(0, 0, 0),
    asleep: true, still: 0, held: null, broken: false, brokeAt: 0, baseY: o.y || 0, groundY: o.y || 0, onGround: true, away: 0, sndAt: 0, prev: V(0, 0, 0), prevQ: new T.Quaternion(), vh: [V(0, 0, 0), V(0, 0, 0), V(0, 0, 0), V(0, 0, 0), V(0, 0, 0), V(0, 0, 0)], vhi: 0 };
  /* where it starts: standing, or lying on its side pointing along lie */
  if (o.lie !== undefined && o.type !== 'ball' && o.type !== 'bag') {
    P.home.q.setFromEuler(new T.Euler(Math.PI / 2, o.lie, 0, 'YXZ'));
    P.home.p.set(o.x, (o.y || 0) + (o.type === 'bottle' ? 0.031 : 0.032), o.z).add(PV.copy(com).applyQuaternion(P.home.q));
  } else {
    P.home.q.setFromAxisAngle(YAX, o.yaw !== undefined ? o.yaw : hash2(o.x, o.z, 9) * 6.28);
    P.home.p.set(o.x, (o.y || 0) + com.y, o.z);
  }
  propReset(P);
  PROPS.list.push(P);
  return P;
}
function propReset(P) {
  P.p.copy(P.home.p); P.q.copy(P.home.q); P.v.set(0, 0, 0); P.w.set(0, 0, 0); P.asleep = true; P.still = 0; P.broken = false; P.away = 0; P.held = null;
  P.mesh.visible = true; P.groundY = P.baseY; P.onGround = true;
  propDraw(P);
}
function propDraw(P) { P.mesh.position.copy(P.p); P.mesh.quaternion.copy(P.q); }
function propsSetup() {
  if (PROPS.ready) return;
  propTextures();
  PROPS.specs.forEach(propMake);
  CANS.forEach(function (c) { propMake({ type: 'can', x: c[0], y: c[1], z: c[2], lie: c[3] }); });
  /* soft shadows under them, all in one draw */
  var sm = new T.MeshBasicMaterial({ map: TEX.softBlob, transparent: true, depthWrite: false, opacity: 0.9, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  var sg = new T.PlaneGeometry(1, 1); sg.rotateX(-Math.PI / 2);
  PROPS.shadows = new T.InstancedMesh(sg, sm, PROPS.list.length); PROPS.shadows.renderOrder = 1; PROPS.shadows.frustumCulled = false; scene.add(PROPS.shadows);
  /* glass shards, all in one draw */
  PROPS.shards = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), new T.MeshBasicMaterial({ color: 0xffffff }), 64); PROPS.shards.frustumCulled = false; scene.add(PROPS.shards);
  for (var i = 0; i < 64; i++) { PROPS.shardList.push({ p: V(0, -50, 0), v: V(0, 0, 0), s: V(0, 0, 0), r: new T.Euler(), life: 0, rest: false }); PROPS.shards.setColorAt(i, new T.Color(0x3b220f)); }
  PROPS.list.forEach(function (P, i) { shadowAt(P, i); });
  PROPS.shadows.instanceMatrix.needsUpdate = true; propsShardDraw();
  callSetup(); boomLoad();
  PROPS.ready = true;
}
function shadowAt(P, i) {
  var lift = P.p.y - P.groundY, s = P.broken || P.held || lift > 0.9 ? 0 : P.br * 2.6 * Math.max(0.3, 1 - lift * 0.8);
  PM.makeTranslation(P.p.x, P.groundY + 0.006, P.p.z); PS.set(s, 1, s); PM.scale(PS);
  PROPS.shadows.setMatrixAt(i, PM);
}

/* ---------------- moving them ---------------- */
function propWake(P) { P.asleep = false; P.still = 0; P.sleepP.copy(P.p); P.sleepQ.copy(P.q); }
function propContact(P, h, impactOut) {                  /* the spheres against the street: push out, bounce, rub */
  var hit = false;
  P.onGround = false;
  for (var i = 0; i < P.sph.length; i++) {
    var s = P.sph[i];
    PO.copy(s.o).applyQuaternion(P.q); PC.copy(P.p).add(PO);
    var q = nearest(PC.x, PC.y, PC.z, s.r);
    if (!q.hit) continue;
    hit = true; PN.set(q.nx, q.ny, q.nz);
    var depth = s.r - q.d; P.p.addScaledVector(PN, depth + 0.0003);
    if (q.ny > 0.5) { P.onGround = true; P.groundY = PC.y - s.r + depth; }
    PRC.copy(PO).addScaledVector(PN, -s.r);
    PVC.crossVectors(P.w, PRC).add(P.v);
    var vn = PVC.dot(PN);
    if (vn < 0) {
      PRX.crossVectors(PRC, PN);
      var e = -vn < 0.6 ? 0 : P.T.e, jn = -(1 + e) * vn / (P.im + P.iI * PRX.lengthSq());
      P.v.addScaledVector(PN, jn * P.im); P.w.addScaledVector(PRX, jn * P.iI);
      PVC.crossVectors(P.w, PRC).add(P.v); var vn2 = PVC.dot(PN); PVT.copy(PVC).addScaledVector(PN, -vn2); var vt = PVT.length();
      if (vt > 1e-5) { PVT.multiplyScalar(1 / vt); PRX.crossVectors(PRC, PVT); var jt = Math.min(P.T.mu * jn, vt / (P.im + P.iI * PRX.lengthSq())); P.v.addScaledVector(PVT, -jt * P.im); P.w.addScaledVector(PRX, -jt * P.iI); }
      if (-vn > impactOut.speed) { impactOut.speed = -vn; impactOut.kind = q.kind; impactOut.x = PC.x; impactOut.y = PC.y - s.r; impactOut.z = PC.z; }
    }
  }
  return hit;
}
var IMPACT = { speed: 0, kind: 0, x: 0, y: 0, z: 0 };
function propStep(P, dt) {
  var sp = P.v.length(), n = Math.min(8, Math.max(1, Math.ceil(sp * dt / (0.4 * P.sph[P.sph.length - 1].r + 0.01)))), h = dt / n;
  IMPACT.speed = 0;
  for (var k = 0; k < n; k++) {
    P.v.y -= G * h;
    P.p.addScaledVector(P.v, h);
    var wl = P.w.length();
    if (wl > 1e-6) { PQ.setFromAxisAngle(PV.copy(P.w).multiplyScalar(1 / wl), wl * h); P.q.premultiply(PQ).normalize(); }
    propContact(P, h, IMPACT);
  }
  var damp = P.onGround ? (P.T.roll ? 0.4 : 2.2) : 0.05;   /* air barely slows things; the ground settles them */
  P.v.multiplyScalar(Math.exp(-damp * dt * (P.onGround && sp < 0.4 ? 3 : 1))); P.w.multiplyScalar(Math.exp(-(P.onGround ? (P.T.roll ? 0.6 : 2.5) : 0.3) * dt));
  if (IMPACT.speed > 0.4) propHit(P, IMPACT.speed, IMPACT.kind, IMPACT);
  if (P.p.distanceToSquared(P.sleepP) < 1e-4 && 1 - Math.abs(P.q.dot(P.sleepQ)) < 1e-3) { P.still += dt; if (P.still > 0.6) { P.asleep = true; P.v.set(0, 0, 0); P.w.set(0, 0, 0); } }
  else { P.sleepP.copy(P.p); P.sleepQ.copy(P.q); P.still = 0; }
}
function propHit(P, speed, kind, at) {                    /* a knock: a sound, and glass that hits hard enough smashes */
  if (PROPS.settling) return;
  if (P.type === 'bottle' && speed > P.T.breaks) { smash(P, at); return; }
  if (PROPS.time - P.sndAt > 0.06) { P.sndAt = PROPS.time; sfx(P.T.snd, speed, P.p); }
}
function smash(P, at) {
  P.broken = true; P.brokeAt = PROPS.time; P.mesh.visible = false; P.asleep = true; P.held = null;
  XRG.hands.forEach(function (h) { if (h.held === P) h.held = null; });
  var cols = P.green ? [0x3f7a4c, 0x2a5236, 0x5d9a68] : [0x7a3f16, 0x4e2810, 0x9a5a26], made = 0;      /* glass catching the light: brighter than the bottle looked whole */
  for (var i = 0; i < PROPS.shardList.length && made < 16; i++) {
    var s = PROPS.shardList[i]; if (s.life > 0) continue;
    s.p.set(at.x + (Math.random() - 0.5) * 0.06, Math.max(at.y, P.p.y - 0.05) + 0.02, at.z + (Math.random() - 0.5) * 0.06);
    var a = Math.random() * 6.283, out = 0.6 + Math.random() * 1.6;
    s.v.set(Math.cos(a) * out + P.v.x * 0.3, 0.8 + Math.random() * 1.6, Math.sin(a) * out + P.v.z * 0.3);
    var big = made < 4;                                   /* a few big curved pieces, the rest small */
    s.s.set((big ? 0.035 : 0.012) + Math.random() * (big ? 0.03 : 0.022), 0.004, (big ? 0.03 : 0.01) + Math.random() * (big ? 0.03 : 0.02)); s.r.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
    s.life = 10 + Math.random() * 4; s.rest = false; PROPS.shards.setColorAt(i, new T.Color(made % 7 === 6 ? 0xd6d0bd : cols[made % 3])); made++;
  }
  PROPS.shards.instanceColor.needsUpdate = true;
  sfx('smash', 6, P.p);
}
function propsShardDraw() {
  var E = PROPS.shards;
  PROPS.shardList.forEach(function (s, i) {
    if (s.life <= 0) { PM.makeScale(0, 0, 0); E.setMatrixAt(i, PM); return; }
    var f = Math.min(1, s.life / 2);                     /* the last two seconds, they shrink away */
    PM.makeRotationFromEuler(s.r); PS.copy(s.s).multiplyScalar(f); PM.scale(PS); PM.setPosition(s.p);
    E.setMatrixAt(i, PM);
  });
  E.instanceMatrix.needsUpdate = true;
}
function propsShards(dt) {
  var any = false;
  PROPS.shardList.forEach(function (s) {
    if (s.life <= 0) return;
    any = true; s.life -= dt;
    if (s.rest) return;
    s.r.x += dt * 9; s.r.z += dt * 7;
    var n = Math.min(8, Math.ceil(s.v.length() * dt / 0.004) || 1), h = dt / n;      /* small steps, so a quick piece cannot slip through the ground */
    for (var k = 0; k < n && !s.rest; k++) {
      s.v.y -= G * h; s.p.addScaledVector(s.v, h);
      var q = nearest(s.p.x, s.p.y, s.p.z, 0.006);
      if (q.hit) { s.p.x += q.nx * (0.006 - q.d); s.p.y += q.ny * (0.006 - q.d); s.p.z += q.nz * (0.006 - q.d); var vn = s.v.x * q.nx + s.v.y * q.ny + s.v.z * q.nz; if (vn < 0) { s.v.x -= 1.3 * vn * q.nx; s.v.y -= 1.3 * vn * q.ny; s.v.z -= 1.3 * vn * q.nz; s.v.multiplyScalar(0.45); } if (s.v.length() < 0.15 && q.ny > 0.5) { s.rest = true; s.r.set(0, s.r.y, 0); } }
    }
    if (s.p.y < -5) s.life = 0;
  });
  if (any || PROPS.shardsWere) propsShardDraw();
  PROPS.shardsWere = any;
}
/* hands and the body push things; a closed fist holds them */
var HV = [V(0, 0, 0), V(0, 0, 0)], HPREV = [V(0, 0, 0), V(0, 0, 0)], BODYV = V(0, 0, 0), BODYP = V(0, 0, 0);
function pushProp(P, cx, cy, cz, cr, vx, vy, vz, hand) {      /* a sphere moving at v shoves the thing out of its way */
  if (P.held || P.broken || (hand && P.noPush > PROPS.time)) return false;
  var dx = P.p.x - cx, dy = P.p.y - cy, dz = P.p.z - cz;
  if (dx * dx + dy * dy + dz * dz > (P.br + cr) * (P.br + cr)) return false;
  if (vx * vx + vy * vy + vz * vz < 0.45 * 0.45) return false;      /* a slow hand passes through, so you can close your fist round a thing */
  var touched = false, resting = P.asleep || P.onGround;
  for (var i = 0; i < P.sph.length; i++) {
    var s = P.sph[i]; PO.copy(s.o).applyQuaternion(P.q); PC.copy(P.p).add(PO);
    PN.set(PC.x - cx, PC.y - cy, PC.z - cz); var d = PN.length(), R = s.r + cr;
    if (d >= R) continue;
    if (d < 1e-5) PN.set(0, 1, 0); else PN.multiplyScalar(1 / d);
    if (resting && PN.y < 0) {                           /* never pushed down into what it stands on: sideways instead */
      PN.y = 0; var hl = Math.hypot(PN.x, PN.z); if (hl < 0.25) continue; PN.x /= hl; PN.z /= hl;
    }
    if (P.asleep) propWake(P);
    P.p.addScaledVector(PN, Math.min(R - d, 0.5 * s.r + 0.005));
    PRC.copy(PO).addScaledVector(PN, -s.r);
    PVC.crossVectors(P.w, PRC).add(P.v); PVC.x -= vx; PVC.y -= vy; PVC.z -= vz;
    var vn = PVC.dot(PN);
    if (vn < 0) {
      PRX.crossVectors(PRC, PN); var jn = -1.25 * vn / (P.im + P.iI * PRX.lengthSq());
      P.v.addScaledVector(PN, jn * P.im); P.w.addScaledVector(PRX, jn * P.iI);
      if (hand && -vn > 0.8) { if (P.type === 'bottle' && -vn > 7) { smash(P, { x: PC.x, y: PC.y, z: PC.z }); return true; } if (PROPS.time - P.sndAt > 0.08) { P.sndAt = PROPS.time; sfx(P.T.snd, -vn * 0.7, P.p); } }
    }
    touched = true;
  }
  return touched;
}
function fistOf(h) { return button(h, 1) > 0.6 && button(h, 0) > 0.6; }
function propsHands(dt) {
  var D = XRG.D, rh = D.rHand * 1.05;
  XRG.hands.forEach(function (h, i) {
    if (!h.tracked) { if (h.held) letGo(h, i); h.seen2 = false; return; }
    if (!h.seen2) { HPREV[i].copy(h.last); h.seen2 = true; }
    HV[i].subVectors(h.last, HPREV[i]).multiplyScalar(1 / Math.max(dt, 1e-3)); HPREV[i].copy(h.last);
    var fist = fistOf(h), open = button(h, 1) < 0.35 || button(h, 0) < 0.35;
    if (h.held) { if (open) letGo(h, i); else carry(h, dt); }
    else if (fist && !h.fistWas) {                       /* reach for the nearest thing within a hand's width */
      var best = null, bd = 1e9;
      PROPS.list.forEach(function (P) {
        if (P.broken || P.held) return;
        for (var k = 0; k < P.sph.length; k++) { PO.copy(P.sph[k].o).applyQuaternion(P.q).add(P.p); var d = PO.distanceTo(h.last) - P.sph[k].r; if (d < rh + 0.07 && d < bd) { bd = d; best = P; } }
      });
      if (best) hold(h, best);
    }
    h.fistWas = fist;
    if (!h.held) { callHand(h, i); boomHand(h, i); }
    if (!h.held) PROPS.list.forEach(function (P) { pushProp(P, h.last.x, h.last.y, h.last.z, rh, HV[i].x, HV[i].y, HV[i].z, true); });
    if (!PROPS.hint && !h.held) {                         /* the first time a hand comes near something you can pick up, say how */
      for (var k = 0; k < PROPS.list.length; k++) { var P = PROPS.list[k]; if (!P.broken && P.p.distanceTo(h.last) < P.br + 0.25) { PROPS.hint = true; toast('Close your fist to grab', 3); break; } }
    }
  });
  /* the body and head shove things too */
  toWorld(XRG.headLocal, HW);
  BODYV.subVectors(XRG.pos, BODYP).multiplyScalar(1 / Math.max(dt, 1e-3)); BODYP.copy(XRG.pos);
  PROPS.list.forEach(function (P) {
    pushProp(P, HW.x, HW.y, HW.z, D.rHead, BODYV.x, BODYV.y, BODYV.z, false);
    pushProp(P, HW.x, HW.y - D.drop, HW.z, D.rBody, BODYV.x, BODYV.y, BODYV.z, false);
  });
}
function hold(h, P) {
  h.held = P; P.held = h; propWake(P); P.v.set(0, 0, 0); P.w.set(0, 0, 0);
  PQ.copy(h.wq).invert();
  h.relP = PV.copy(P.p).sub(h.last).applyQuaternion(PQ).clone(); h.relQ = PQ.clone().multiply(P.q);
  P.vh.forEach(function (v) { v.set(0, 0, 0); }); P.prev.copy(P.p); P.prevQ.copy(P.q);
  buzz(h, 0.25);
}
function carry(h, dt) {
  var P = h.held;
  P.prev.copy(P.p); P.prevQ.copy(P.q);
  P.p.copy(h.relP).applyQuaternion(h.wq).add(h.last); P.q.copy(h.wq).multiply(h.relQ);
  P.vh[P.vhi].subVectors(P.p, P.prev).multiplyScalar(1 / Math.max(dt, 1e-3)); P.vhi = (P.vhi + 1) % P.vh.length;
  PQ2.copy(P.prevQ).invert(); PQ.copy(P.q).multiply(PQ2);                    /* how it turned this frame */
  var ang = 2 * Math.acos(Math.min(1, Math.abs(PQ.w))), sa = Math.sqrt(Math.max(1e-9, 1 - PQ.w * PQ.w));
  P.w.set(PQ.x / sa, PQ.y / sa, PQ.z / sa).multiplyScalar((PQ.w < 0 ? -ang : ang) / Math.max(dt, 1e-3));
  if (!isFinite(P.w.x)) P.w.set(0, 0, 0);
  propDraw(P);
}
function letGo(h, i) {                                   /* a throw: the hand at its fastest in the last few frames, with the frames either side */
  var P = h.held; h.held = null; if (!P) return;
  var n = P.vh.length, newest = (P.vhi - 1 + n) % n, top = 0, best = -1, a, cnt = 0;
  for (a = 0; a < n; a++) { var s2 = P.vh[(newest - a + n) % n].lengthSq(); if (s2 > best) { best = s2; top = a; } }      /* a: how many frames ago */
  P.held = null; P.v.set(0, 0, 0);
  for (a = Math.max(0, top - 1); a <= Math.min(n - 1, top + 1); a++) { P.v.add(P.vh[(newest - a + n) % n]); cnt++; }
  P.v.multiplyScalar(1.1 / cnt);
  if (P.w.length() > 25) P.w.setLength(25);
  propWake(P);
}
function propsStep(dt) {
  if (!PROPS.ready || !XRG.col) return;
  PROPS.time += dt;
  propsHands(dt);
  var anyMoved = false;
  PROPS.list.forEach(function (P, i) {
    if (P.broken) {                                      /* a smashed bottle comes back once nobody is standing on its spot */
      if (PROPS.time - P.brokeAt > 30) { toWorld(XRG.headLocal, HW); if (HW.distanceTo(P.home.p) > 2) { propReset(P); shadowAt(P, i); anyMoved = true; } }
      return;
    }
    if (P.held) { shadowAt(P, i); anyMoved = true; return; }
    if (!P.asleep) {
      propStep(P, dt);
      if (P.type === 'ball') hoopCheck(P);
      if (P.p.y < -3) { propReset(P); }
      propDraw(P); shadowAt(P, i); anyMoved = true;
      /* things resting on a thing that really moves wake up too (a tremble does not count) */
      if (P.v.lengthSq() > 0.02 || P.w.lengthSq() > 1) PROPS.list.forEach(function (Q) { if (Q.asleep && !Q.broken && Q !== P && Q.p.distanceTo(P.p) < Q.br + P.br) propWake(Q); });
      propsPair(P);
    } else if (P.p.distanceToSquared(P.home.p) > 1) {    /* left lying far from home a long while, with nobody near: it goes back */
      P.away += dt; toWorld(XRG.headLocal, HW);
      if (P.away > 120 && HW.distanceTo(P.p) > 6 && HW.distanceTo(P.home.p) > 6) { propReset(P); shadowAt(P, i); anyMoved = true; }
    }
  });
  if (anyMoved) PROPS.shadows.instanceMatrix.needsUpdate = true;
  propsShards(dt); callStep(); boomStep();
}
function propsPair(P) {                                  /* two things bumping: push apart, share the knock */
  PROPS.list.forEach(function (Q) {
    if (Q === P || Q.broken || Q.held) return;
    if (P.p.distanceTo(Q.p) > P.br + Q.br) return;
    for (var i = 0; i < P.sph.length; i++) for (var j = 0; j < Q.sph.length; j++) {
      var a = P.sph[i], b = Q.sph[j];
      PO.copy(a.o).applyQuaternion(P.q).add(P.p); PC.copy(b.o).applyQuaternion(Q.q).add(Q.p);
      PN.subVectors(PO, PC); var d = PN.length(), R = a.r + b.r;
      if (d >= R || d < 1e-6) continue;
      PN.multiplyScalar(1 / d); var depth = R - d;
      var vn = (P.v.x - Q.v.x) * PN.x + (P.v.y - Q.v.y) * PN.y + (P.v.z - Q.v.z) * PN.z, still = Q.asleep;
      if (still && (depth > 0.004 || vn < -0.15)) { propWake(Q); still = false; }      /* a light touch leaves a sleeping thing be: it holds like the street does */
      var wa = still ? 1 : P.im / (P.im + Q.im), qm = still ? 0 : Q.im;
      P.p.addScaledVector(PN, depth * wa); if (!still) Q.p.addScaledVector(PN, -depth * (1 - wa));
      if (vn < 0) { var j_ = -1.2 * vn / (P.im + qm); P.v.addScaledVector(PN, j_ * P.im); if (!still) Q.v.addScaledVector(PN, -j_ * Q.im); if (-vn > 1.2) propHit(P, -vn * 0.6, 4, { x: PO.x, y: PO.y, z: PO.z }); }
    }
  });
}
/* once, before anyone plays: let everything find its feet where the street left it, and call that home */
function propsSettle() {
  if (PROPS.settled || !PROPS.ready || !XRG.col) return;
  PROPS.settling = true;
  try {
    PROPS.list.forEach(function (P) { propReset(P); propWake(P); });
    for (var f = 0; f < 72 * 4; f++) PROPS.list.forEach(function (P) { if (!P.asleep) { propStep(P, 1 / 72); propsPair(P); if (P.p.y < -3) propReset(P); } });
    PROPS.list.forEach(function (P, i) { P.home.p.copy(P.p); P.home.q.copy(P.q); P.baseY = P.groundY; P.v.set(0, 0, 0); P.w.set(0, 0, 0); P.asleep = true; propDraw(P); shadowAt(P, i); });
    PROPS.shadows.instanceMatrix.needsUpdate = true;
  } finally { PROPS.settling = false; PROPS.settled = true; }
}
/* the hoop: a ball dropping down through the rim scores */
var RIM = { x: 38.77, y: 3.05, z: 29, r: 0.21 };
function hoopCheck(P) {
  var dx = P.p.x - RIM.x, dz = P.p.z - RIM.z;
  if (P.prev.y > RIM.y && P.p.y <= RIM.y && P.v.y < 0 && dx * dx + dz * dz < RIM.r * RIM.r) { PROPS.score++; sfx('swish', 3, P.p); toast(PROPS.score === 1 ? 'Bucket' : 'Bucket · ' + PROPS.score + ' in', 2); }
  P.prev.copy(P.p);
}

/* ---------------- what they sound like ---------------- */
var SFX = {
  glass: [{ type: 'bandpass', f: 3400, q: 9, len: 0.09, vol: 0.32 }], can: [{ type: 'bandpass', f: 2300, q: 14, len: 0.16, vol: 0.3 }, { type: 'bandpass', f: 5200, q: 10, len: 0.06, vol: 0.12 }],
  ball: [{ type: 'lowpass', f: 230, q: 3, len: 0.14, vol: 0.7 }, { type: 'bandpass', f: 520, q: 4, len: 0.05, vol: 0.18 }], bag: [{ type: 'lowpass', f: 150, q: 0.6, len: 0.16, vol: 0.5 }, { type: 'highpass', f: 3200, q: 0.5, len: 0.12, vol: 0.08 }],
  smash: [{ type: 'highpass', f: 1800, q: 0.7, len: 0.38, vol: 0.55 }, { type: 'bandpass', f: 4300, q: 6, len: 0.2, vol: 0.3, at: 0.05 }, { type: 'bandpass', f: 6100, q: 8, len: 0.15, vol: 0.22, at: 0.12 }, { type: 'bandpass', f: 5000, q: 9, len: 0.12, vol: 0.18, at: 0.22 }, { type: 'bandpass', f: 7000, q: 9, len: 0.1, vol: 0.12, at: 0.31 }],
  swish: [{ type: 'bandpass', f: 1500, q: 0.8, len: 0.35, vol: 0.35 }],
  click: [{ type: 'bandpass', f: 2600, q: 3, len: 0.035, vol: 0.5 }, { type: 'lowpass', f: 300, q: 1, len: 0.04, vol: 0.3 }],
  boom: [{ type: 'lowpass', f: 420, q: 1.2, len: 0.12, vol: 0.55 }, { type: 'bandpass', f: 1300, q: 3, len: 0.05, vol: 0.18 }],
  radio: [{ type: 'bandpass', f: 1700, q: 0.6, len: 1.4, vol: 0.2 }, { type: 'highpass', f: 4200, q: 0.5, len: 1.2, vol: 0.08 }, { type: 'bandpass', f: 900, q: 2, len: 0.08, vol: 0.2, at: 0.3 }, { type: 'bandpass', f: 900, q: 2, len: 0.06, vol: 0.18, at: 0.75 }]
};
var SV = V(0, 0, 0), HEAR = { fall: 1, pan: 0 };
function hear(at) {                                       /* how loud a thing at 'at' is from here, and how far to the left or right */
  toWorld(XRG.headLocal, HW); SV.subVectors(at, HW); var d = SV.length();
  YQ.setFromAxisAngle(YAX, XRG.yaw); MQ.copy(YQ).multiply(XRG.headQ); FWD.set(0, 0, -1).applyQuaternion(MQ);
  HEAR.fall = 1 / (1 + d * d / 6); HEAR.pan = d > 0.01 ? Math.max(-0.8, Math.min(0.8, (SV.x * -FWD.z + SV.z * FWD.x) / d)) : 0;
  return HEAR;
}
function sfx(name, strength, at) {
  if (!SND || !SFX[name]) return;
  try {
    var c = SND.ctx, t0 = c.currentTime, hr = hear(at), fall = hr.fall, pan = hr.pan;
    SFX[name].forEach(function (o) {
      var t = t0 + (o.at || 0), v = o.vol * Math.min(1.2, 0.15 + strength / 4) * fall;
      if (v < 0.004) return;
      var s = c.createBufferSource(); s.buffer = SND.noise; s.playbackRate.value = 0.85 + Math.random() * 0.3;
      var f = c.createBiquadFilter(); f.type = o.type; f.frequency.value = o.f * (0.9 + Math.random() * 0.2); f.Q.value = o.q;
      var g = c.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0006, t + o.len);
      s.connect(f); f.connect(g);
      if (c.createStereoPanner) { var p = c.createStereoPanner(); p.pan.value = pan; g.connect(p); p.connect(c.destination); } else g.connect(c.destination);
      s.start(t); s.stop(t + o.len + 0.03);
    });
  } catch (e) {}
}

function chime(at, delay) {                               /* the elevator's bell: one struck tone, ringing out */
  if (!SND) return;
  try {
    var c = SND.ctx, t = c.currentTime + (delay || 0), hr = hear(at);
    [[1318.5, 0.2, 1.8], [2637, 0.05, 0.8], [3960, 0.02, 0.45], [659.3, 0.04, 1.2]].forEach(function (o) {
      var os = c.createOscillator(), g = c.createGain(); os.type = 'sine'; os.frequency.value = o[0];
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(o[1] * (0.3 + hr.fall), t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + o[2]);
      os.connect(g);
      if (c.createStereoPanner) { var p = c.createStereoPanner(); p.pan.value = hr.pan; g.connect(p); p.connect(c.destination); } else g.connect(c.destination);
      os.start(t); os.stop(t + o[2] + 0.05);
    });
  } catch (e) {}
}

/* ---------------- the elevator's call button: press it and it lights, and rings ---------------- */
var CALL = { p: V(-2.0, 1.05, 0.054), r: 0.026, face: null, mat: null, lit: 0, down: [false, false], said: 0 };
function callSetup() {
  var c = document.createElement('canvas'); c.width = c.height = 64; var g = c.getContext('2d');
  g.fillStyle = '#d9d2c0'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#2a2622'; g.beginPath(); g.moveTo(19, 23); g.lineTo(45, 23); g.lineTo(32, 43); g.closePath(); g.fill();      /* an arrow, down: the club is below */
  var t = smoothTex(new T.CanvasTexture(c)); t.userData = { w: 64, h: 64 };
  useLights(NEAR_LIGHTS);
  CALL.mat = roomMat({ tex: t, snap: false, gloss: 0.5, shine: 40 });
  var side = roomMat({ color: 0xcfc8b6, snap: false, gloss: 0.4, shine: 30 }), ring = roomMat({ color: 0x9aa0a6, snap: false, gloss: 0.7, shine: 50 });
  useLights(ARENA_LIGHTS);
  var btn = new T.Group(); btn.position.copy(CALL.p);
  var cyl = new T.Mesh(new T.CylinderGeometry(CALL.r, CALL.r, 0.012, 20, 1, true), side); cyl.rotation.x = Math.PI / 2; cyl.position.z = -0.006; btn.add(cyl);
  CALL.face = new T.Mesh(new T.CircleGeometry(CALL.r, 20), CALL.mat); btn.add(CALL.face);
  var rg = new T.Mesh(new T.TorusGeometry(CALL.r + 0.005, 0.0045, 6, 24), ring); rg.position.z = -0.008; btn.add(rg);
  scene.add(btn); CALL.btn = btn;
}
function callHand(h, i) {
  var d = h.last.distanceTo(CALL.p), r = XRG.D.rHand;
  if (d < r + 0.03) { if (!CALL.down[i]) { CALL.down[i] = true; callPress(); } }
  else if (d > r + 0.08) CALL.down[i] = false;
}
function callPress() {
  sfx('click', 3, CALL.p);
  if (PROPS.time < CALL.lit) return;                     /* already called */
  CALL.lit = PROPS.time + 3.5; chime(CALL.p, 0.45);
  if (PROPS.time - CALL.said > 8) { CALL.said = PROPS.time; toast('The elevator is out of order', 3, 'The fights downstairs come next'); }
}
function callStep() {
  if (!CALL.mat) return;
  var on = PROPS.time < CALL.lit, u = CALL.mat.uniforms;
  u.uGlow.value = on ? 1.6 : 0; u.uColor.value.setHex(on ? 0xffb54a : 0xffffff);
  CALL.face.position.z = on ? -0.004 : 0;                /* pushed in while it is lit */
}

/* ---------------- the boombox: carry it anywhere; press play on its top ---------------- */
var BOOM = { P: null, list: null, el: null, node: null, gain: null, pan: null, on: false, idx: 0, at: -9, key: V(-0.1, 0.27, 0.05), KP: V(0, 0, 0) };
function boomLoad() {                                     /* the beats live in the music folder, listed in music/list.json */
  BOOM.P = PROPS.list.filter(function (P) { return P.type === 'boombox'; })[0] || null;
  if (BOOM.P) BOOM.key.sub(BOOM.P.com);
  try {
    fetch('music/list.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      var l = j && (j.tracks || j); BOOM.list = (Array.isArray(l) ? l : []).map(function (t) { var f = typeof t === 'string' ? t : t.file; return f && f.indexOf('/') < 0 ? 'music/' + f : f; }).filter(Boolean);
    }).catch(function () { BOOM.list = []; });
  } catch (e) { BOOM.list = []; }
}
function boomHand(h, i) {
  var P = BOOM.P; if (!P || P.held) return;
  BOOM.KP.copy(BOOM.key).applyQuaternion(P.q).add(P.p);
  if (h.last.distanceTo(BOOM.KP) < XRG.D.rHand + 0.06) P.noPush = PROPS.time + 0.3;      /* a hand on the keys plays it, it does not shove it */
  if (h.last.distanceTo(BOOM.KP) < XRG.D.rHand + 0.025 && HV[i].y < -0.25 && PROPS.time - BOOM.at > 0.6) { BOOM.at = PROPS.time; boomToggle(); }      /* a press: the hand coming down on the key */
}
function boomName(f) { return decodeURIComponent(f.split('/').pop().replace(/\.[a-z0-9]+$/i, '')).replace(/[_-]+/g, ' '); }
function boomToggle() {
  if (!SND || !BOOM.P) return;
  sfx('click', 3, BOOM.P.p);
  if (BOOM.on) { boomOff(); return; }
  if (!BOOM.list || !BOOM.list.length) { sfx('radio', 4, BOOM.P.p); toast('No beats on the boombox yet', 2.5); return; }
  try {
    var c = SND.ctx;
    if (!BOOM.el) {
      BOOM.el = new Audio(); BOOM.el.preload = 'auto';
      BOOM.node = c.createMediaElementSource(BOOM.el); BOOM.gain = c.createGain(); BOOM.gain.gain.value = 0.9;
      BOOM.pan = c.createPanner(); BOOM.pan.panningModel = 'HRTF'; BOOM.pan.distanceModel = 'inverse'; BOOM.pan.refDistance = 1.2; BOOM.pan.maxDistance = 60; BOOM.pan.rolloffFactor = 1.1;
      BOOM.node.connect(BOOM.gain); BOOM.gain.connect(BOOM.pan); BOOM.pan.connect(c.destination);
      BOOM.el.addEventListener('ended', function () { BOOM.idx = (BOOM.idx + 1) % BOOM.list.length; boomPlay(); });
    }
    boomPlay();
  } catch (e) { BOOM.on = false; }
}
function boomPlay() {
  var f = BOOM.list[BOOM.idx % BOOM.list.length];
  BOOM.el.src = f; BOOM.on = true;
  var go = BOOM.el.play(); if (go && go.catch) go.catch(function () { BOOM.on = false; toast('That beat would not play', 2.5); });
  toast(boomName(f), 2.5);
}
function boomOff() { BOOM.on = false; if (BOOM.el) BOOM.el.pause(); }
var LF_ = V(0, 0, 0), LU_ = V(0, 0, 0);
function boomStep() {                                     /* the music comes from wherever the boombox is */
  if (!BOOM.on || !BOOM.pan || !SND) return;
  var c = SND.ctx, P = BOOM.P.p, L = c.listener, t = c.currentTime;
  toWorld(XRG.headLocal, HW); YQ.setFromAxisAngle(YAX, XRG.yaw); MQ.copy(YQ).multiply(XRG.headQ); LF_.set(0, 0, -1).applyQuaternion(MQ); LU_.set(0, 1, 0).applyQuaternion(MQ);
  if (BOOM.pan.positionX) { BOOM.pan.positionX.setTargetAtTime(P.x, t, 0.02); BOOM.pan.positionY.setTargetAtTime(P.y, t, 0.02); BOOM.pan.positionZ.setTargetAtTime(P.z, t, 0.02); } else BOOM.pan.setPosition(P.x, P.y, P.z);
  if (L.positionX) { L.positionX.setTargetAtTime(HW.x, t, 0.02); L.positionY.setTargetAtTime(HW.y, t, 0.02); L.positionZ.setTargetAtTime(HW.z, t, 0.02); L.forwardX.setTargetAtTime(LF_.x, t, 0.02); L.forwardY.setTargetAtTime(LF_.y, t, 0.02); L.forwardZ.setTargetAtTime(LF_.z, t, 0.02); L.upX.setTargetAtTime(LU_.x, t, 0.02); L.upY.setTargetAtTime(LU_.y, t, 0.02); L.upZ.setTargetAtTime(LU_.z, t, 0.02); }
  else { L.setPosition(HW.x, HW.y, HW.z); L.setOrientation(LF_.x, LF_.y, LF_.z, LU_.x, LU_.y, LU_.z); }
}
