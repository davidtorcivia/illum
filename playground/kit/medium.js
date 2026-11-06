// The medium: paper as a living surface, a tool as a hand moving through time.
// Nothing here draws a result. The paper holds state (its tooth, its sizing, the way its fibres run); a wet layer holds
// water and the pigment suspended in it; a dry layer holds what has settled. A tool, moved by a hand (position,
// pressure, speed over time), lays water and pigment where it touches; then, every frame, the wet layer spreads (along
// the fibres, more where the sizing is weak), dries (water leaves, faster where it is thin, so pigment settles hardest at
// the edges, and in the tooth's valleys), and what you see is that moment of the process. Lines join because wet meets
// wet; edges are the paper's; a tool dragged through wet ink carries it.
// WebGL2, half-float render targets, ping-pong. Calibrated against real pen lines (research/08-paint.md), not by taste.

const VS = `#version 300 es
in vec2 aPos; out vec2 vUV; uniform vec4 uRect; uniform vec2 uRes;
void main(){ vec2 p = uRect.xy + aPos * uRect.zw; vUV = p / uRes; gl_Position = vec4(vUV * 2. - 1., 0, 1); }`;

const NOISE = `
// an integer hash (PCG, Jarzynski & Olano 2020): sin-based hashes leave diagonal patterns at fine scales
float hash(vec2 p){ uvec2 v = uvec2(ivec2(floor(p)) + 32768); v = v * 1664525u + 1013904223u; v.x += v.y * 1664525u; v.y += v.x * 1664525u;
  v ^= v >> 16u; v.x += v.y * 1664525u; v.y += v.x * 1664525u; v ^= v >> 16u; return float(v.x) / 4294967295.; }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }`;

// paper: R tooth height, G sizing (1 = hard-sized, resists ink), BA fibre direction × how strongly it wicks
const PAPER_FS = `#version 300 es
precision highp float; in vec2 vUV; out vec4 o; uniform vec2 uRes; uniform float uSeed, uSizing, uPx;
${NOISE}
void main(){
  vec2 p = vUV * uRes * uPx;                         // CSS px
  // tooth: felt marks of the mould and the press, a little elongated; fine fibre on top
  float t = .45 * vn(p / vec2(3.1, 2.3) + uSeed) + .35 * vn(p / 1.3 + uSeed * 2.) + .2 * vn(vec2(p.x * .9 + p.y * .4, p.y * 1.1 - p.x * .3) / .6 + uSeed * 3.);
  // fibres: short runs at random angles, slowly varying; where one lies, ink wicks along it
  float a = vn(p / 7. + 40. + uSeed) * 6.2832, strength = smoothstep(.55, .9, vn(p / vec2(2.2, 2.2) + 9. + uSeed));
  float sizing = clamp(uSizing + (vn(p / 14. + 77. + uSeed) - .5) * .25, 0., 1.);
  o = vec4(t, sizing, cos(a) * strength, sin(a) * strength);
}`;

// deposit: the tool's footprint at one step, added into the wet layer (additive blend)
const DEPOSIT_FS = `#version 300 es
precision highp float; in vec2 vUV; out vec4 o; uniform sampler2D uPaper; uniform vec2 uC, uNib, uRes;
uniform float uW, uT, uSplit, uTine, uFlow, uContact, uPx;
void main(){
  vec2 p = vUV * uRes, d = p - uC;
  float x = dot(d, uNib), y = dot(d, vec2(-uNib.y, uNib.x));          // along the nib's edge, and across it
  float halfW = uW * .5, soft = .7 / uPx;
  float body = (1. - smoothstep(halfW - soft, halfW + soft, abs(x))) * (1. - smoothstep(uT * .5 - soft, uT * .5 + soft, abs(y)));
  // tines: under pressure they part; ink runs down each, and fills between only while the pen is well charged
  float tines = 1. - smoothstep(uTine - soft, uTine + soft, abs(abs(x) - halfW + uTine));
  float cov = body * mix(1., max(tines, 1. - uSplit), uSplit);
  // contact: the pen touches the tooth's peaks first; with little pressure or a starved nib, the valleys are skipped
  float h = texture(uPaper, vUV).r, contact = smoothstep(uContact - .22, uContact + .22, h + .4);
  float a = cov * contact * uFlow;
  o = vec4(a * 1.7, a, 0, 0);                                             // water, pigment (ink is mostly water)
}`;

// step: the wet layer spreads and dries; pigment settles into the dry layer (MRT: wet, dry)
const STEP_FS = `#version 300 es
precision highp float; in vec2 vUV; layout(location = 0) out vec4 oWet; layout(location = 1) out vec4 oDry;
uniform sampler2D uWet, uDry, uPaper; uniform vec2 uTexel; uniform float uSpread, uEvap, uSettle, uGran, uAniso, uDt;
void main(){
  vec4 w = texture(uWet, vUV), pap = texture(uPaper, vUV); float W = w.r, P = w.g;
  vec2 fib = pap.ba; float sizing = pap.g;
  float dW = 0., dP = 0.;
  for (int k = 0; k < 8; k++) {
    vec2 dir = vec2(cos(float(k) * .785398), sin(float(k) * .785398)), off = round(dir * 1.0001);
    vec4 n = texture(uWet, vUV + off * uTexel); vec4 np = texture(uPaper, vUV + off * uTexel);
    float along = dot(normalize(off), fib); float g = (1. + uAniso * along * along) / length(off);
    // water moves from wet to less wet, only where there is water to move (a front, not a fog), less into sized paper
    // bounded so the step stays stable (the sum of all eight never passes ~0.9)
    float m = min(.11, uSpread * g * min(1., max(W, n.r)) * (1. - .8 * mix(sizing, np.g, .5)));
    float f = m * (n.r - W);
    dW += f;
    // pigment travels with the water that carries it
    dP += f > 0. ? f * n.g / max(n.r, 1e-4) : f * P / max(W, 1e-4);
  }
  W = clamp(W + dW * uDt, 0., 3.); P = clamp(P + dP * uDt, 0., 3.);
  // drying: water leaves faster where it is thin (the edge), and as it leaves, pigment settles: hardest at the edges and
  // in the valleys of the tooth
  // edges dry first only on soft paper; hard-sized parchment holds ink where it lands (no rim, as measured)
  float soft = 1. - sizing, evap = uEvap * (1. + 2.5 * soft * exp(-W * 12.)) * uDt;
  float W2 = max(0., W - evap);
  float settle = clamp(uSettle * uDt * (1. + 3. * soft * (1. - W2 / max(W, 1e-4))) * (1. + uGran * (.5 - pap.r)), 0., 1.);
  if (W2 < .002) settle = 1.;
  float dep = P * settle;
  oWet = vec4(W2, P - dep, 0, 0);
  oDry = texture(uDry, vUV) + vec4(dep, 0, 0, 0);
}`;

// render: ink over the paper, subtractively; wet ink a little darker and glossier than dry
const RENDER_FS = `#version 300 es
precision highp float; in vec2 vUV; out vec4 o; uniform sampler2D uWet, uDry, uPaper; uniform vec3 uPaperRGB, uK, uKAged;
uniform float uAge, uTooth; uniform vec2 uRes; uniform float uPx;
${NOISE}
void main(){
  vec4 w = texture(uWet, vUV), pap = texture(uPaper, vUV); float dry = texture(uDry, vUV).r;
  vec3 K = mix(uK, uKAged, uAge);
  // age: dry ink is rubbed from the high points of the surface first, then flakes in small irregular grains,
  // so the ground shows through it as it does on a six-hundred-year-old page
  vec2 p = vUV * uRes * uPx;
  float grain = .5 * vn(p / 1.1) + .3 * vn(p / 2.6 + 13.) + .2 * vn(p / .5 + 29.);
  float worn = clamp(uAge * 1.35 * smoothstep(.42, .7, grain), 0., .96);   // granules, not scratches
  float d = dry * (1. - worn) + w.g * 1.15;
  vec3 paper = uPaperRGB * (1. - uTooth * (.5 - pap.r));
  vec3 c = paper * exp(-K * d);
  c += vec3(.05) * smoothstep(.05, .4, w.r) * smoothstep(.0, .3, d);     // the sheen of wet ink
  o = vec4(c, 1);
}`;

export function createMedium(canvas, { dpr = Math.min(2, devicePixelRatio || 1), seed = 1, sizing = .6, paper = [243, 237, 225] } = {}) {
  const gl = canvas.getContext('webgl2', { antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: true });
  if (!gl || !gl.getExtension('EXT_color_buffer_float')) throw new Error('This needs WebGL2 with float render targets.');
  const W = canvas.width, H = canvas.height;
  const sh = (t, src) => { const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const prog = fs => { const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)); const U = {}; return { p, u: n => U[n] ??= gl.getUniformLocation(p, n) }; };
  const P = { paper: prog(PAPER_FS), dep: prog(DEPOSIT_FS), step: prog(STEP_FS), render: prog(RENDER_FS) };
  const quad = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, quad); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
  const tex = () => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, W, H, 0, gl.RGBA, gl.HALF_FLOAT, null);
    for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.NEAREST], [gl.TEXTURE_MAG_FILTER, gl.NEAREST], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v); return t; };
  const fbo = (...ts) => { const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); ts.forEach((t, i) => gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, t, 0));
    gl.drawBuffers(ts.map((_, i) => gl.COLOR_ATTACHMENT0 + i)); return f; };
  const paperT = tex(), wet = [tex(), tex()], dry = [tex(), tex()], F = { paper: fbo(paperT), dep: [fbo(wet[0]), fbo(wet[1])], step: [fbo(wet[1], dry[1]), fbo(wet[0], dry[0])] };
  let cur = 0;
  const run = (pr, rect = [0, 0, W, H]) => { gl.useProgram(pr.p); const a = gl.getAttribLocation(pr.p, 'aPos'); gl.bindBuffer(gl.ARRAY_BUFFER, quad); gl.enableVertexAttribArray(a);
    gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0); gl.uniform4f(pr.u('uRect'), ...rect); gl.uniform2f(pr.u('uRes'), W, H); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); };
  const bind = (pr, name, unit, t) => { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t); gl.uniform1i(pr.u(name), unit); };
  const K = (rgb) => rgb.map((c, i) => -Math.log(Math.max(.02, c / paper[i])));
  const S = { sizing, spread: .9, evap: .01, settle: .05, gran: .6, aniso: 2.5, tooth: .022, age: .35,
    ink: [18, 14, 22], aged: [78, 58, 26] };                     // iron gall: blue-black when fresh, browning as it ages

  function makePaper() { gl.viewport(0, 0, W, H); gl.bindFramebuffer(gl.FRAMEBUFFER, F.paper); gl.disable(gl.BLEND);
    gl.useProgram(P.paper.p); gl.uniform1f(P.paper.u('uSeed'), seed % 97); gl.uniform1f(P.paper.u('uSizing'), S.sizing); gl.uniform1f(P.paper.u('uPx'), 1 / dpr); run(P.paper); }
  function clear() { for (const f of [...F.step]) { gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); } cur = 0; }
  makePaper(); clear();

  // lay the tool's footprint at device-px point c: nib angle a, width w, thickness t (device px), split 0..1, flow
  function deposit(c, { angle, w, t, split, flow, contact }) {
    const r = Math.ceil(w / 2 + t + 3), rect = [Math.max(0, c[0] - r), Math.max(0, c[1] - r), 2 * r, 2 * r];
    gl.viewport(0, 0, W, H); gl.bindFramebuffer(gl.FRAMEBUFFER, F.dep[cur]); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
    const pr = P.dep; gl.useProgram(pr.p); bind(pr, 'uPaper', 0, paperT);
    gl.uniform2f(pr.u('uC'), c[0], c[1]); gl.uniform2f(pr.u('uNib'), Math.cos(angle), Math.sin(angle)); gl.uniform1f(pr.u('uW'), w); gl.uniform1f(pr.u('uT'), t);
    gl.uniform1f(pr.u('uSplit'), split); gl.uniform1f(pr.u('uTine'), Math.max(.6 * dpr, w * .14)); gl.uniform1f(pr.u('uFlow'), flow); gl.uniform1f(pr.u('uContact'), contact); gl.uniform1f(pr.u('uPx'), 1 / dpr);
    run(pr, rect); gl.disable(gl.BLEND);
  }
  function step(n = 1, dt = 1) {
    gl.viewport(0, 0, W, H);
    for (let k = 0; k < n; k++) {
      const pr = P.step; gl.bindFramebuffer(gl.FRAMEBUFFER, F.step[cur]); gl.useProgram(pr.p);
      bind(pr, 'uWet', 0, wet[cur]); bind(pr, 'uDry', 1, dry[cur]); bind(pr, 'uPaper', 2, paperT);
      gl.uniform2f(pr.u('uTexel'), 1 / W, 1 / H); gl.uniform1f(pr.u('uSpread'), S.spread * .11); gl.uniform1f(pr.u('uEvap'), S.evap); gl.uniform1f(pr.u('uSettle'), S.settle);
      gl.uniform1f(pr.u('uGran'), S.gran); gl.uniform1f(pr.u('uAniso'), S.aniso); gl.uniform1f(pr.u('uDt'), dt); run(pr); cur = 1 - cur;
    }
  }
  function render() {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H); const pr = P.render; gl.useProgram(pr.p);
    bind(pr, 'uWet', 0, wet[cur]); bind(pr, 'uDry', 1, dry[cur]); bind(pr, 'uPaper', 2, paperT);
    gl.uniform3f(pr.u('uPaperRGB'), ...paper.map(c => c / 255)); gl.uniform3f(pr.u('uK'), ...K(S.ink)); gl.uniform3f(pr.u('uKAged'), ...K(S.aged));
    gl.uniform1f(pr.u('uAge'), S.age); gl.uniform1f(pr.u('uTooth'), S.tooth); gl.uniform1f(pr.u('uPx'), 1 / dpr); run(pr);
  }
  return { gl, W, H, dpr, settings: S, deposit, step, render, clear, makePaper };
}

// A quill held by a hand: broad-edged, cut at an angle; pressure spreads its tines; it carries a charge of ink that
// runs down as it writes (each dip refills it); where it moves slowly it lays more.
export class Quill {
  constructor(medium, { width = 2.6, angle = .62, flex = 1, load = 1 } = {}) { Object.assign(this, { m: medium, width, angle, flex, charge: load, prev: null }); }
  dip() { this.charge = 1; }
  // move the nib to page point p (CSS px) with pressure 0..1 and speed (CSS px per ms)
  to(p, pressure, speed) {
    const m = this.m, d = m.dpr, q = [p[0] * d, p[1] * d];
    if (!this.prev) { this.prev = q; this.lay(q, pressure, speed, true); return; }
    const L = Math.hypot(q[0] - this.prev[0], q[1] - this.prev[1]), n = Math.max(1, Math.ceil(L / (.5 * d)));
    for (let k = 1; k <= n; k++) this.lay([this.prev[0] + (q[0] - this.prev[0]) * k / n, this.prev[1] + (q[1] - this.prev[1]) * k / n], pressure, speed, false);
    this.prev = q;
  }
  lift() { this.prev = null; }
  lay(c, pressure, speed, first) {
    const d = this.m.dpr, starved = Math.max(0, .35 - this.charge) / .35;
    const split = Math.max(0, pressure - .8) / .2 * this.flex * starved;
    const w = (this.width + this.flex * 1.4 * Math.max(0, pressure - .3)) * d, t = (.55 + .3 * pressure) * d;
    // ink laid per half-pixel of travel: more where the hand is slow, less as the charge runs down; a pooled touch-down
    const dwell = 1 + 1.6 * Math.exp(-speed * 4);
    const flow = .5 * dwell * (.35 + .65 * Math.min(1, this.charge * 1.6)) * (first ? 3 : 1);
    this.m.deposit(c, { angle: this.angle, w, t, split, flow, contact: .25 + .5 * starved - .25 * pressure });
    this.charge = Math.max(0, this.charge - flow * .00022 * Math.sqrt(w / d));   // a dip writes a few words
  }
}
