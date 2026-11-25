/* ================================================================== */
/* The runner: gorillas, looking around, start-up. The page's own      */
/* scene file sets SCENE (what to build, where you can stand).         */
/* ================================================================== */

/* ---------------- gorillas: the saved body with the stand-in face, lit for where each one stands ---------------- */
var KDIRS = [0, 1, 2, 3, 4, 5].map(function (k) { var az = (30 + 60 * k) * D2R, e = 52 * D2R; return V(Math.sin(az) * Math.cos(e), Math.sin(e), Math.cos(az) * Math.cos(e)); });
var PIX = { value: 0.002 }, S0 = (useLights(ARENA_LIGHTS), lightAt(V(0, PH + 1.4, 0)));        /* the light in the middle of the ring is the yardstick */
/* look: a room with its own kind of light says so here: { s (how strongly lit, the same everywhere), key (the lamps' colour), sky and ground (the room's own light), fog } */
function envAt(pos, least, look) {                       /* least: the dimmest this gorilla may get. A fighter in the cage always stays readable, even up by the lamps. */
  var s = Math.max(least || 0, Math.min(1.15, lightAt(V(pos.x, pos.y + 1.4, pos.z)) / S0));
  if (look && look.s) s = look.s;
  var amb = 0.5 + 0.5 * Math.min(1, s), key = look ? look.key : [1.0, 0.87, 0.68], sky = look ? look.sky : [0.17, 0.175, 0.2], gnd = look ? look.ground : [0.16, 0.13, 0.095];
  return { uArena: { value: 1 }, uK: { value: KDIRS }, uKc: { value: 0.42 * s }, uKeyTint: { value: new T.Color(key[0], key[1], key[2]) },
    uAmbS: { value: new T.Color(sky[0] * amb, sky[1] * amb, sky[2] * amb) }, uAmbG: { value: new T.Color(gnd[0] * amb, gnd[1] * amb, gnd[2] * amb) },
    uFillC: { value: 0.2 * Math.min(1, s + 0.25) }, uSkinLift: { value: 0 }, uRimA: { value: 0 }, uPix: PIX, uGrainFade: { value: 1 },
    uFogC: look && look.fogC ? { value: new T.Color(look.fogC[0], look.fogC[1], look.fogC[2]) } : FOG.uFogC, uFogD: look && look.fog ? { value: look.fog } : FOG.uFogD };
}
var GEO = {}, DARK = new T.MeshBasicMaterial({ color: 0x07070a });
function cached(key, part, mir) { var id = key + (mir ? '-m' : ''); return GEO[id] || (GEO[id] = geometry(part, mir)); }
function makeFighter(pos, yaw, pose, least, look) {
  var M = DATA.meta, Pt = DATA.parts, F = DATA.faces['new'], env = envAt(pos, least, look);
  var root = new T.Group(); root.position.copy(pos); root.rotation.y = yaw;
  var body = material(DATA.bodySkin, DATA.bodySkin, DATA.silver, null, 0, env), headMat = material(F.skin, F.skin2, DATA.crown, F.tone3 ? F.skinDark : null, F.planes, env);
  var torso = new T.Mesh(cached('torso', Pt.torso), body); root.add(torso);
  var head = new T.Group(); head.position.fromArray(M.head); root.add(head);
  head.add(new T.Mesh(cached('head', F.mesh), headMat));
  [-1, 1].forEach(function (s) { var eye = buildEye(F.eyeStyle, F.eyeR); eye.position.set(s * F.eye[0], F.eye[1], F.eye[2]); head.add(eye); });
  if (F.mouth && F.mouth.length > 3) {
    var curve = new T.CatmullRomCurve3(F.mouth.map(function (q) { return V(q[0], q[1], q[2]); }));
    head.add(new T.Mesh(new T.TubeGeometry(curve, 32, F.mouthR || 0.004, 6, false), DARK));
  }
  var arms = [1, -1].map(function (s) {
    var up = new T.Mesh(cached('upper', Pt.upper, s < 0), body), fo = new T.Mesh(cached('fore', Pt.fore, s < 0), body);
    up.matrixAutoUpdate = false; fo.matrixAutoUpdate = false; root.add(up); root.add(fo);
    return { side: s, upper: up, fore: fo };
  });
  var f = { root: root, head: head, torso: torso, arms: arms, M: M, pose: pose || 'stand', phase: pos.x * 3.1 + pos.z };
  if (pose === 'perch') head.rotation.x = 0.32;        /* looking down */
  if (pose === 'guard') head.rotation.x = -0.3;        /* looking up at the one above */
  poseFighter(f, 0);
  return f;
}
/* two-bone arm: shoulder -> elbow -> wrist */
var vS = V(0, 0, 0), vT = V(0, 0, 0), vD = V(0, 0, 0), vE = V(0, 0, 0), vP = V(0, 0, 0), vA = V(0, 0, 0), vU = V(0, 0, 0), vFront = V(0, 0, 1);
var bx = V(0, 0, 0), by = V(0, 0, 0), bz = V(0, 0, 0);
function aim(mesh, from, axis, facing) {
  by.copy(axis).negate();
  bz.copy(facing).addScaledVector(axis, -facing.dot(axis)).normalize();
  bx.crossVectors(by, bz);
  mesh.matrix.makeBasis(bx, by, bz).setPosition(from);
  mesh.matrixWorldNeedsUpdate = true;
}
function poseFighter(f, t) {
  var M = f.M;
  f.arms.forEach(function (a) {
    var s = a.side, sway = reduceMotion ? 0 : Math.sin(t * 1.3 + f.phase + (s > 0 ? 0 : 1.7)), front = vFront;
    vS.set(s * M.shoulder[0], M.shoulder[1], M.shoulder[2]);
    if (f.pose === 'cage') { vT.set(s * 0.4, M.shoulder[1] + 0.3 + sway * 0.02, 0.6); vP.set(s * 0.8, -0.6, 0); vU.set(0, 1, 0.2); front = vU; }                     /* hands up on the fence */
    else if (f.pose === 'slap') {                                                                                                                                     /* one hand flat on the wall, the other hanging */
      if (s > 0) { vT.set(0.3, M.shoulder[1] + 0.42 + sway * 0.01, 0.66); vP.set(0.8, -0.6, 0); vU.set(0, 1, 0.2); front = vU; }
      else { vT.set(-(M.shoulder[0] + 0.11), M.shoulder[1] - 0.9 + sway * 0.006, 0.16); vP.set(-0.35, 0, -1); vU.set(-0.25, 0, 1); }
    }
    else if (f.pose === 'guard' || f.pose === 'box') { vT.set(s * 0.42, M.shoulder[1] - 0.12 + sway * 0.012, 0.5); vP.set(s * 0.8, -0.8, -0.3); vU.set(s * 0.2, 1, 0.1); front = vU; }   /* fists up, elbows out and down */
    else if (f.pose === 'perch') { vT.set(s * 0.37, 0.3 + sway * 0.004, 0.2); vP.set(s * 0.9, 0.1, -0.5); vU.set(s * 0.3, 0, 1); }                                   /* crouched, knuckles on the boards */
    else { vT.set(s * (M.shoulder[0] + 0.11), M.shoulder[1] - 0.9 + sway * 0.006, 0.16); vP.set(s * 0.35, 0, -1); vU.set(s * 0.25, 0, 1); }
    vD.subVectors(vT, vS);
    var dist = Math.min(Math.max(vD.length(), Math.abs(M.L1 - M.L2) + 0.01), M.L1 + M.L2 - 0.004);
    vD.normalize();
    var along = (M.L1 * M.L1 - M.L2 * M.L2 + dist * dist) / (2 * dist), outw = Math.sqrt(Math.max(M.L1 * M.L1 - along * along, 0));
    vP.addScaledVector(vD, -vP.dot(vD)).normalize();
    vE.copy(vS).addScaledVector(vD, along).addScaledVector(vP, outw);
    vA.subVectors(vE, vS).normalize();
    aim(a.upper, vS, vA, front);
    vT.copy(vS).addScaledVector(vD, dist);
    vA.subVectors(vT, vE).normalize();
    aim(a.fore, vE, vA, vU);
  });
}
var fighters = [], TAGGED = {};
function facing(from, to) { return Math.atan2(to.x - from.x, to.z - from.z); }

/* ---------------- looking around ---------------- */
var view = { spot: '', yaw: 0, pitch: 0 }, aspect = 1;
function standAt(s) { return aspect < 0.8 && s.narrow ? s.narrow : s.pos; }      /* a spot may name a second place to stand for tall, narrow screens */
function goTo(name) {
  var s = SCENE.spots[name]; if (!s) return;
  view.spot = name; var d = s.at.clone().sub(standAt(s));
  view.yaw = Math.atan2(d.x, d.z); view.pitch = Math.atan2(d.y, Math.hypot(d.x, d.z));
  Array.prototype.forEach.call(document.querySelectorAll('[data-spot]'), function (b) { b.setAttribute('aria-checked', String(b.dataset.spot === name)); });
}
function updateCamera() {
  var s = SCENE.spots[view.spot], cp = Math.cos(view.pitch);
  camera.fov = aspect < 0.8 ? 80 : 62; camera.near = 0.06; camera.far = 90;
  var at = standAt(s);
  camera.position.copy(at);
  camera.lookAt(at.x + Math.sin(view.yaw) * cp, at.y + Math.sin(view.pitch), at.z + Math.cos(view.yaw) * cp);
  camera.updateMatrixWorld(); camera.updateProjectionMatrix();
  LIGHT.copy(LIGHT_WORLD).transformDirection(camera.matrixWorldInverse);
  PIX.value = 2 * Math.tan(camera.fov * Math.PI / 360) / Math.max(1, renderer.domElement.height);
}
var drag = { id: null, x: 0, y: 0 };
stage.addEventListener('pointerdown', function (e) {
  if (e.target.closest('.opt, .xr')) return;
  drag.id = e.pointerId; drag.x = e.clientX; drag.y = e.clientY; $('hint').style.opacity = 0;
  try { stage.setPointerCapture(e.pointerId); } catch (err) {}
});
stage.addEventListener('pointermove', function (e) {
  if (drag.id !== e.pointerId) return;
  var k = 0.0042 * (camera.fov / 70);
  view.yaw += (e.clientX - drag.x) * k; view.pitch = Math.max(-1.3, Math.min(1.3, view.pitch + (e.clientY - drag.y) * k));
  drag.x = e.clientX; drag.y = e.clientY;
});
function endDrag(e) { if (drag.id === e.pointerId) drag.id = null; }
stage.addEventListener('pointerup', endDrag);
stage.addEventListener('pointercancel', endDrag);
$('g-spot').addEventListener('click', function (e) { var b = e.target.closest('[data-spot]'); if (b) goTo(b.dataset.spot); });

function resize() {
  if (renderer.xr && renderer.xr.isPresenting) return;     /* the headset sets its own size */
  var w = stage.clientWidth || 1, h = stage.clientHeight || 1;
  aspect = w / h; renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); renderer.setSize(w, h, false);
  camera.aspect = aspect; camera.updateProjectionMatrix();
}
if (window.ResizeObserver) new ResizeObserver(resize).observe(stage);
window.addEventListener('resize', resize);

/* tired lamps flicker */
var flicks = [];
function flicker(dt) {
  flicks.forEach(function (f) {
    f.left -= dt;
    if (f.left <= 0) {
      var r = Math.random();
      f.level = r < 0.8 ? 1 : r < 0.92 ? 0.5 : 0.15;
      f.left = f.level === 1 ? 0.3 + Math.random() * 2.2 : 0.04 + Math.random() * 0.1;
    }
    var L = f.lamp, g = 0.35 + 0.65 * f.level;
    L.colour.copy(L.base).multiplyScalar(f.level);
    if (L.halo) L.halo.material.opacity = 0.9 * f.level;
    if (L.bulb) { if (!L.bulbBase) L.bulbBase = L.bulb.material.color.clone(); L.bulb.material.color.copy(L.bulbBase).multiplyScalar(g); }
  });
}

var clock = 0, live = false;
function tick(dt, xrFrame) {
  clock += dt;
  if (live && !reduceMotion) flicker(dt);
  fighters.forEach(function (f) {
    poseFighter(f, clock);
    if (!reduceMotion) f.torso.scale.set(1 + Math.sin(clock * 1.3 + f.phase) * 0.005, 1, 1 + Math.sin(clock * 1.3 + f.phase) * 0.01);
  });
  if (typeof XRG !== 'undefined' && XRG.on) { xrFrameTick(dt, xrFrame); return; }      /* in a headset: you are the camera */
  updateCamera();
  if (SCENE.frame) SCENE.frame(dt);
  renderer.render(scene, camera);
}
/* Anything that went wrong but did not stop the page is shown in small print under the title, so a screenshot says what to fix. */
function report() {
  if (!PROBLEMS.length) return;
  var count = {}, list = [];
  PROBLEMS.forEach(function (p) { if (count[p]) count[p]++; else { count[p] = 1; list.push(p); } });
  var text = list.map(function (p) { return count[p] > 1 ? p + ' (' + count[p] + ' times)' : p; }).join('; ').slice(0, 260);
  var el = document.querySelector('.sub'); if (el) el.textContent = SCENE.sub + ' · ' + BUILD + ' · missing: ' + text;
}
function fail(e, where) {
  var box = document.createElement('div'), d = document.createElement('small');
  box.textContent = 'The ' + SCENE.what + ' did not load. Reload the page to try again.';
  d.textContent = BUILD + ' · ' + where + ': ' + String(e && (e.message || e)).slice(0, 240);
  box.appendChild(d); $('note').textContent = ''; $('note').appendChild(box); $('note').hidden = false;
  if (window.console) console.error(where, e);
}
/* Shaders the graphics chip refused. The room's shader has a plainer version to fall back to. */
function refused() {
  var bad = [];
  (renderer.info.programs || []).forEach(function (p) {
    var d = p.diagnostics; if (!d || d.runnable !== false) return;
    bad.push({ full: String(p.cacheKey || '').indexOf('dFdx(uv)') >= 0,                   /* the room's full shader, which has a plainer stand-in */
      log: ((d.fragmentShader && d.fragmentShader.log) || (d.vertexShader && d.vertexShader.log) || d.programLog || 'no log').replace(/\s+/g, ' ') });
  });
  return bad;
}
function start() {
  renderer.setClearColor(SCENE.sky === undefined ? 0x040404 : SCENE.sky, 1);       /* indoors: near black. A scene under the open sky names its own colour */
  var world = new T.Group(), specs = []; scene.add(world);
  function step(name, fn) { try { fn(); } catch (e) { problem(name, e); } }
  step('textures', buildTextures);
  specs = SCENE.build(world, step) || [];               /* the scene builds its rooms and says where the gorillas go */
  specs.forEach(function (s, i) {
    step('gorilla ' + (i + 1), function () {
      useLights(s.set || ARENA_LIGHTS);
      var f = makeFighter(s.pos, s.yaw, s.pose, s.least, s.look); world.add(f.root); fighters.push(f);
      if (s.tag) TAGGED[s.tag] = f;
    });
  });
  (SCENE.flicker || []).forEach(function (lamp) { if (lamp) flicks.push({ lamp: lamp, left: 0.6 + flicks.length * 0.7, level: 1 }); });
  if (typeof xrSetup === 'function') step('headset', function () { xrSetup(world); });
  var named = (location.hash || '').replace('#', '');
  resize(); goTo(named in SCENE.spots ? named : SCENE.first);
  if (window.__manual) { window.__arena = { tick: tick, goTo: goTo, view: view, spots: SCENE.spots, V: V, problems: PROBLEMS, refused: refused }; tick(0.016); report(); return; }
  live = true;
  var last = 0, frames = 0, plain = false;
  renderer.setAnimationLoop(function frame(ms, xrFrame) {     /* the same loop runs in a headset, where the headset sets the pace */
    var dt = Math.min(0.05, Math.max(0, (ms - last) / 1000) || 0.016); last = ms;
    try { tick(dt, xrFrame); } catch (e) {
      renderer.setAnimationLoop(null); fail(e, 'drawing');
      if (typeof XRG !== 'undefined' && XRG.session) XRG.session.end().catch(function () {});
      return;
    }
    frames++;
    if (frames === 2) {                                    /* after the first frames: did the graphics chip accept the shaders? */
      var bad = refused();
      if (bad.some(function (b) { return b.full; })) { plain = true; ROOM_MATS.forEach(function (m) { m.fragmentShader = ROOMF_PLAIN; m.needsUpdate = true; }); }     /* try the plainer one */
      else { if (bad.length) problem('shader', bad[0].log); report(); }
    } else if (plain && frames === 4) {
      var still = refused().filter(function (b) { return !b.full; });
      if (still.length) problem('shader', still[0].log);
      report();
    }
  });
}
function fontsReady() {                                  /* the signs are drawn with web fonts, so wait for them, but not for long */
  if (!document.fonts || !document.fonts.load) return Promise.resolve();
  var wait = Promise.all(['400 64px "New Rocker"', '400 64px "Permanent Marker"', '400 64px "Black Ops One"', '400 64px "Anton"', '400 64px "Sedgwick Ave Display"', '400 64px "Sedgwick Ave"', '650 32px "Urbanist"'].map(function (f) { return document.fonts.load(f).catch(function () {}); }));
  return Promise.race([wait, new Promise(function (r) { setTimeout(r, 2500); })]);
}
/* The gorilla's data is inside this page, so there is no second download that can fail. The separate file is only a fallback. */
function loadFighter() {
  var el = document.getElementById('fighter-data');
  if (el && el.textContent.length > 1000) { try { return Promise.resolve(JSON.parse(el.textContent)); } catch (e) { problem('gorilla data', e); } }
  return fetch('fighter.json').then(function (r) { if (!r.ok) throw new Error('fighter.json answered ' + r.status); return r.json(); });
}
function quietly(fn) { try { return Promise.resolve(fn()); } catch (e) { return Promise.reject(e); } }
Promise.all([quietly(loadFighter).catch(function (e) { throw new Error('the gorilla: ' + (e && e.message)); }), quietly(fontsReady).catch(function () {})]).then(function (res) {
  DATA = res[0];
  try { start(); } catch (e) { fail(e, 'building'); }
}).catch(function (e) { fail(e, 'loading'); });
})();
