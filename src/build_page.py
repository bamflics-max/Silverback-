"""Builds one of the club's look-around pages (the arena, the locker room) from the gorilla preview page and the club's script parts.

The preview page supplies the gorilla (mesh decoding, shader, eyes). This script gives that shader the club's
light (lamps from above, room light, a soft light on the bare face, fur grain that fades with distance, haze),
replaces the preview's controls with the page's viewpoints, and appends the scene itself.

The gorilla's data is written into the page itself (without the unused earlier face), so the page needs no second download.

Usage: python3 build_page.py <gorilla preview index.html> <out index.html> <fighter.json> <page.json>

page.json: { "title", "what" (the place, in words), "sub" (small print under the logo), "spots": [[id, label], ...], "parts": [script files, in order] }
"""
import json
import sys

src_path, out_path, data_path, page_path = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
page = json.load(open(page_path))
s = open(src_path).read()
app = "".join(open(p).read() for p in page["parts"])


def rep(a, b):
    global s
    assert a in s, "not found: " + a[:90]
    s = s.replace(a, b, 1)


# ---- page: title, fonts, backdrop, controls
rep("<title>Silverback gorilla preview</title>", "<title>" + page["title"] + "</title>")
rep("family=New+Rocker&family=Urbanist:wght@450;650&display=swap", "family=Anton&family=Black+Ops+One&family=Sedgwick+Ave&family=Sedgwick+Ave+Display&family=New+Rocker&family=Permanent+Marker&family=Urbanist:wght@450;650&display=swap")
rep("  --backdrop:#8f939b;\n  --backdrop-edge:#5d6169;", "  --backdrop:#0b0c0f;\n  --backdrop-edge:#050506;")
rep("  /* Layout: one flat studio backdrop. The gorilla owns the screen; the logo sits top left and three plain text rows sit at the bottom. No panels, no boxes. */",
    "  /* Layout: the room fills the screen. The logo sits top left with one quiet line under it; one plain text row at the bottom picks where you stand. No panels, no boxes. */")
rep(".hint{position:absolute;right:18px;top:22px;", ".sub{position:absolute;left:20px;top:calc(12px + clamp(30px,8.4vw,46px) + 12px);margin:0;color:var(--ink-soft);font-size:15px;pointer-events:none}\n.hint{position:absolute;right:18px;top:22px;")
rep("  .logo{left:28px;top:18px}", "  .logo{left:28px;top:18px}\n  .sub{left:30px;top:calc(18px + 46px + 12px)}")
# phone: no "View" label, and taller tap targets. This goes last so it wins over the base rules.
rep("</style>", "@media (max-width:480px){.row{gap:0 18px}.row > span{display:none}.opt{padding:13px 0 12px}}\n</style>")
rep("  background:linear-gradient(to top,rgba(52,55,61,.72),rgba(52,55,61,0));", "  background:linear-gradient(to top,rgba(5,5,6,.82),rgba(5,5,6,0));")
rep('<main class="stage" id="stage" aria-label="3D preview of the gorilla. Drag to turn it.">', '<main class="stage" id="stage" aria-label="3D view of the Silverback ' + page["what"] + '. Drag to look around.">')
rep('  <p class="hint" id="hint">Drag to turn</p>', '  <p class="sub">' + page["sub"] + '</p>\n  <p class="hint" id="hint">Drag to look around</p>')
a = s.index('  <nav class="picks" aria-label="Preview options">')
b = s.index('  </nav>') + len('  </nav>')
buttons = "\n".join('      <button class="opt" role="radio" aria-checked="%s" data-spot="%s">%s</button>' % ("true" if n == 0 else "false", sid, label) for n, (sid, label) in enumerate(page["spots"]))
s = s[:a] + '''  <nav class="picks" aria-label="Where you stand">
    <div class="row" role="radiogroup" aria-labelledby="l-spot" id="g-spot">
      <span id="l-spot">View</span>
''' + buttons + '''
    </div>
  </nav>''' + s[b:]
# a soft shade behind the logo and the hint, so a lamp passing behind them never hides the words
rep('  <canvas id="view"></canvas>', '  <canvas id="view"></canvas>\n  <div class="shade" aria-hidden="true"></div>')
rep(".note[hidden]{display:none}", ".note[hidden]{display:none}\n.note small{display:block;margin-top:16px;max-width:36ch;font-size:13px;line-height:1.35;color:var(--ink-faint);word-break:break-word}")
rep(".sub{position:absolute;", ".shade{position:absolute;left:0;right:0;top:0;height:120px;pointer-events:none;background:linear-gradient(to bottom,rgba(5,5,6,.7),rgba(5,5,6,0))}\n.sub{position:absolute;")
rep("if (!T) { note('This preview needs 3D graphics. Open it in Chrome or Safari.'); return; }", "if (!T) { note('The 3D library did not load. Check the connection, then reload the page.'); return; }")
rep("catch (e) { note('This preview needs 3D graphics (WebGL). Open it in Chrome or Safari.'); return; }", "catch (e) { note('This page needs 3D graphics (WebGL). Open it in Chrome or Safari.'); return; }")

# ---- gorilla shader: world-space normal, arena light
rep("""  'varying vec3 vN; varying vec3 vObj; varying vec3 vMask; varying vec3 vView; varying vec4 vPaint;',
  'void main(){',
  '  vObj = position; vMask = mask; vPaint = paint;',""",
    """  'varying vec3 vN; varying vec3 vObj; varying vec3 vMask; varying vec3 vView; varying vec4 vPaint; varying vec3 vNw;',
  'void main(){',
  '  vObj = position; vMask = mask; vPaint = paint; vNw = normalize(mat3(modelMatrix) * normal);',""")
rep("""  'uniform float uGrain; uniform float uToon; uniform float uInk;',
  'varying vec3 vN; varying vec3 vObj; varying vec3 vMask; varying vec3 vView; varying vec4 vPaint;',""",
    """  'uniform float uGrain; uniform float uToon; uniform float uInk;',
  'uniform float uArena; uniform vec3 uK[6]; uniform float uKc; uniform vec3 uKeyTint; uniform vec3 uAmbS; uniform vec3 uAmbG;',
  'uniform float uFillC; uniform float uSkinLift; uniform float uRimA; uniform float uPix; uniform float uGrainFade; uniform vec3 uFogC; uniform float uFogD;',
  'varying vec3 vN; varying vec3 vObj; varying vec3 vMask; varying vec3 vView; varying vec4 vPaint; varying vec3 vNw;',""")
rep("""  '    float g = (hash(floor(vObj * vec3(150.0, 42.0, 150.0))) - 0.5) * 0.5 + (hash(floor(vObj * vec3(64.0, 20.0, 64.0)) + 7.0) - 0.5) * 0.32 + (hash(floor(vObj * vec3(21.0, 9.0, 21.0)) + 3.0) - 0.5) * 0.18;',""",
    """  '    float o1 = 1.0; float o2 = 1.0; float o3 = 1.0;',
  '    if (uGrainFade > 0.5) {                                              /* each layer of grain fades out as its cells shrink towards one pixel, so far-away fur does not sparkle */',
  '      float foot = length(vView) * uPix;',
  '      o1 = smoothstep(1.0, 2.5, 0.0067 / foot); o2 = smoothstep(1.0, 2.5, 0.0156 / foot); o3 = smoothstep(1.0, 2.5, 0.048 / foot);',
  '    }',
  '    float g = (hash(floor(vObj * vec3(150.0, 42.0, 150.0))) - 0.5) * 0.5 * o1 + (hash(floor(vObj * vec3(64.0, 20.0, 64.0)) + 7.0) - 0.5) * 0.32 * o2 + (hash(floor(vObj * vec3(21.0, 9.0, 21.0)) + 3.0) - 0.5) * 0.18 * o3;',""")
rep("""  '  gl_FragColor = vec4(base * 1.25 * lit * occ + add, 1.0);',""",
    """  '  if (uArena > 0.5) {                                                    /* arena: six lamps on a ring over the cage, dim room light from above, warm bounce off the canvas */',
  '    vec3 nw = normalize(vNw); float sum = 0.0;',
  '    for (int i = 0; i < 6; i++) { float wi = dot(nw, uK[i]) * 0.5 + 0.5; sum += wi * wi * wi; }',
  '    float face = skin * uPlanes;                                         /* the bare face of the head */',
  '    vec3 light = mix(uAmbG, uAmbS, nw.y * 0.5 + 0.5) + uKeyTint * (uKc * sum);',
  '    light += vec3(uFillC * max(dot(n, v), 0.0)) * face;                  /* a little light that always comes from the viewer side, on the bare face only */',
  '    float occA = mix(0.55, 1.0, ao);',
  '    vec3 col = base * (1.0 + uSkinLift * face) * 1.25 * light * occA + add * 0.4;',
  '    col += vec3(0.78, 0.84, 1.0) * (uRimA * rim * occA * (0.4 + 0.6 * smoothstep(-0.3, 0.5, nw.y)));',
  '    col = mix(uFogC, col, exp(-length(vView) * uFogD));                  /* the same haze as the room */',
  '    gl_FragColor = vec4(col, 1.0); return;',
  '  }',
  '  gl_FragColor = vec4(base * 1.25 * lit * occ + add, 1.0);',""")
rep("""function material(skin, skin2, alt, skinDark, planes) {
  return new T.ShaderMaterial({
    vertexShader: VERT, fragmentShader: FRAG,
    uniforms: {""",
    """function material(skin, skin2, alt, skinDark, planes, env) {                /* env: the light where this gorilla stands */
  return new T.ShaderMaterial({
    vertexShader: VERT, fragmentShader: FRAG,
    uniforms: {
      uArena: env.uArena, uK: env.uK, uKc: env.uKc, uKeyTint: env.uKeyTint, uAmbS: env.uAmbS, uAmbG: env.uAmbG,
      uFillC: env.uFillC, uSkinLift: env.uSkinLift, uRimA: env.uRimA, uPix: env.uPix, uGrainFade: env.uGrainFade, uFogC: env.uFogC, uFogD: env.uFogD,""")

# ---- everything from "Building the fighter" on is replaced by the arena
marker = "/* ------------------------------------------------------------------ */\n/* Building the fighter"
a = s.index(marker)
b = s.index("</script>", a)
s = s[:a] + app + s[b:]

# the gorilla, inside the page
data = json.load(open(data_path))
data["faces"] = {"new": data["faces"]["new"]}
blob = json.dumps(data, separators=(",", ":")).replace("</", "<\\/")
last = s.rindex("<script>")
s = s[:last] + '<script type="application/json" id="fighter-data">' + blob + "</script>\n" + s[last:]

open(out_path, "w").write(s)
print("wrote", out_path, len(s), "bytes")
