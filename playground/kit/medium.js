// The medium: paper that keeps what is done to it, and a pen that behaves like one.
// The pen has mass. It follows the hand through a damped spring, as a held pen and a wrist do, so a stroke is a true
// curve (with a real hand's small lag and overshoot) and a corner is only a corner when the hand makes one. The ink is
// laid by the nib's edge as it sweeps: each step is exactly the area the edge passes over, with an analytic anti-aliased
// edge, so a broad nib makes its thick and thin by its angle and nothing is stamped. Ink flows per unit of time, so it
// lands heavier where the pen slows (touch-down, a turn, a stop) and runs finer in a quick stroke. Pressure spreads a
// flexible nib. As the charge runs down, the ink catches only the tooth's high points and the line breaks dry.
// Within one stroke the ink is one deposit (wet into wet: overlaps don't double); crossing an earlier stroke lays ink
// on ink, darker. WebGL2, half-float targets.

const VS = `#version 300 es
in vec2 aPos; out vec2 vUV; uniform vec4 uRect; uniform vec2 uRes;
void main(){ vec2 p = uRect.xy + aPos * uRect.zw; vUV = p / uRes; gl_Position = vec4(vUV * 2. - 1., 0, 1); }`;
const NOISE = `
float hash(vec2 p){ uvec2 v = uvec2(ivec2(floor(p)) + 32768); v = v * 1664525u + 1013904223u; v.x += v.y * 1664525u; v.y += v.x * 1664525u;
  v ^= v >> 16u; v.x += v.y * 1664525u; v.y += v.x * 1664525u; v ^= v >> 16u; return float(v.x) / 4294967295.; }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }`;
// how a stroke's ink takes on the paper: a dry pen catches only the tooth's peaks; the fibre roughens every edge a little
const LAY = `
float lay(vec4 s, vec4 pap) {
  float catchK = smoothstep(.15 + .7 * s.b, .35 + .7 * s.b, pap.r + .25);
  float edgeK = smoothstep(0., .9, s.g + (pap.g - .5) * .35);
  return s.r * catchK * edgeK * (.9 + .2 * pap.r);
}`;

// paper: R tooth height, G fibre
const PAPER_FS = `#version 300 es
precision highp float; in vec2 vUV; out vec4 o; uniform vec2 uRes; uniform float uSeed, uPx, uRough;
${NOISE}
void main(){
  vec2 p = vUV * uRes * uPx;
  float t = .5 * vn(p / vec2(1.9, 1.5) + uSeed) + .3 * vn(p / .8 + uSeed * 2.) + .2 * vn(p / 4.5 + uSeed * 3.);
  o = vec4(mix(.5, t, uRough), vn(p / .55 + 71. + uSeed), 0, 0);
}`;

// one step of the nib's sweep: the quad [A0, A1, B1, B0] its edge passes over. The sides are anti-aliased; the two
// ends (the edge at a and at b) are pushed out half a pixel so consecutive steps join with no seam.
// R ink, G coverage, B dryness; MAX-blended into the stroke.
const SWEEP_FS = `#version 300 es
precision highp float; in vec2 vUV; out vec4 o; uniform vec2 uRes, uA, uB; uniform vec2 uQ[4]; uniform float uInk0, uInk1, uDry, uRim;
float edge(vec2 p, vec2 a, vec2 b){ vec2 e = b - a; return dot(p - a, normalize(vec2(e.y, -e.x))); }
void main(){
  vec2 p = vUV * uRes;
  vec2 u = uQ[1] - uQ[0], v = uQ[3] - uQ[0]; float s = u.x * v.y - u.y * v.x < 0. ? 1. : -1.;
  float ds = min(s * edge(p, uQ[1], uQ[2]), s * edge(p, uQ[3], uQ[0]));
  float de = min(s * edge(p, uQ[0], uQ[1]), s * edge(p, uQ[2], uQ[3]));
  float cov = clamp(ds + .5, 0., 1.) * clamp(de + 1., 0., 1.); if (cov <= 0.) discard;
  vec2 ab = uB - uA; float t = clamp(dot(p - uA, ab) / max(dot(ab, ab), 1e-6), 0., 1.);
  // the ink is drawn to the stroke's two borders (the nib's corners drag it there), a little lighter between them
  float wide = distance(uQ[0], uQ[1]), rim = 1. + uRim * smoothstep(5., 14., wide) * (1.4 * exp(-max(ds, 0.) / 2.2) - .3);
  o = vec4(mix(uInk0, uInk1, t) * rim * cov, cov, uDry * cov, 0);
}`;

// the pen lifts: the stroke joins the wet ink (wet into wet merges, it does not double)
const COMMIT_FS = `#version 300 es
precision highp float; in vec2 vUV; out vec4 o; uniform sampler2D uStroke, uPaper;
${LAY}
void main(){ o = vec4(lay(texture(uStroke, vUV), texture(uPaper, vUV)), 0, 0, 0); }`;
// drying: a fraction of the wet ink passes into the dry sheet each frame; ink laid over dry ink adds, darker
const DRY_FS = `#version 300 es
precision highp float; in vec2 vUV; layout(location = 0) out vec4 oDry; layout(location = 1) out vec4 oWet;
uniform sampler2D uDry, uWet; uniform float uK;
void main(){ float w = texture(uWet, vUV).r; oDry = texture(uDry, vUV) + vec4(w * uK, 0, 0, 0); oWet = vec4(w * (1. - uK), 0, 0, 0); }`;

const RENDER_FS = `#version 300 es
precision highp float; in vec2 vUV; out vec4 o; uniform sampler2D uDry, uWet, uStroke, uPaper; uniform vec3 uPaperRGB, uK;
${LAY}
void main(){
  vec2 uv = vec2(vUV.x, 1. - vUV.y);                 // the simulation runs y down, the screen's framebuffer y up
  float d = texture(uDry, uv).r + max(texture(uWet, uv).r, lay(texture(uStroke, uv), texture(uPaper, uv)));
  o = vec4(uPaperRGB * exp(-uK * d), 1);
}`;

export function createMedium(canvas, { dpr = Math.min(2, devicePixelRatio || 1), seed = 7, paper = [243, 237, 225], ink = [30, 21, 15], rough = .6 } = {}) {
  const gl = canvas.getContext('webgl2', { antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: true });
  if (!gl || !gl.getExtension('EXT_color_buffer_float')) throw new Error('This needs WebGL2 with float render targets.');
  gl.getExtension('EXT_float_blend');
  const W = canvas.width, H = canvas.height;
  const sh = (t, src) => { const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const prog = fs => { const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)); const U = {}; return { p, u: n => U[n] ??= gl.getUniformLocation(p, n) }; };
  const P = { paper: prog(PAPER_FS), sweep: prog(SWEEP_FS), commit: prog(COMMIT_FS), dry: prog(DRY_FS), render: prog(RENDER_FS) };
  const quad = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, quad); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
  const tex = () => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, W, H, 0, gl.RGBA, gl.HALF_FLOAT, null);
    for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.NEAREST], [gl.TEXTURE_MAG_FILTER, gl.NEAREST], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v); return t; };
  const fbo = (...ts) => { const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); ts.forEach((t, i) => gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, t, 0));
    gl.drawBuffers(ts.map((_, i) => gl.COLOR_ATTACHMENT0 + i)); return f; };
  const T = { paper: tex(), stroke: tex(), dry: [tex(), tex()], wet: [tex(), tex()] };
  const F = { paper: fbo(T.paper), stroke: fbo(T.stroke), wet: [fbo(T.wet[0]), fbo(T.wet[1])], dry: [fbo(T.dry[1], T.wet[1]), fbo(T.dry[0], T.wet[0])] };
  let cur = 0, wetting = 0;
  const run = (pr, rect = [0, 0, W, H]) => { gl.useProgram(pr.p); const a = gl.getAttribLocation(pr.p, 'aPos'); gl.bindBuffer(gl.ARRAY_BUFFER, quad); gl.enableVertexAttribArray(a);
    gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0); gl.uniform4f(pr.u('uRect'), ...rect); gl.uniform2f(pr.u('uRes'), W, H); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); };
  const bind = (pr, name, unit, t) => { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t); gl.uniform1i(pr.u(name), unit); };
  const clearT = f => { gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); };
  const S = { rough, ink, paper, rim: .3, density: 1.6, drying: 2500 };

  function makePaper() { gl.viewport(0, 0, W, H); gl.bindFramebuffer(gl.FRAMEBUFFER, F.paper); gl.disable(gl.BLEND); gl.useProgram(P.paper.p);
    gl.uniform1f(P.paper.u('uSeed'), seed % 97); gl.uniform1f(P.paper.u('uPx'), 1 / dpr); gl.uniform1f(P.paper.u('uRough'), S.rough); run(P.paper); }
  function clear() { for (const t of [...T.dry, ...T.wet, T.stroke]) { const f = fbo(t); clearT(f); gl.deleteFramebuffer(f); } wetting = 0; }
  makePaper(); clear();

  // one sweep step: quad q (four device-px points), ink at its start and end, the pen's dryness
  function sweep(q, a, b, ink0, ink1, dry) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; for (const [x, y] of q) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    gl.viewport(0, 0, W, H); gl.bindFramebuffer(gl.FRAMEBUFFER, F.stroke); gl.enable(gl.BLEND); gl.blendEquation(gl.MAX);
    const pr = P.sweep; gl.useProgram(pr.p); gl.uniform2fv(pr.u('uQ[0]'), q.flat()); gl.uniform2f(pr.u('uA'), ...a); gl.uniform2f(pr.u('uB'), ...b);
    gl.uniform1f(pr.u('uInk0'), ink0); gl.uniform1f(pr.u('uInk1'), ink1); gl.uniform1f(pr.u('uDry'), dry); gl.uniform1f(pr.u('uRim'), S.rim);
    run(pr, [Math.floor(x0 - 2), Math.floor(y0 - 2), Math.ceil(x1 - x0 + 4), Math.ceil(y1 - y0 + 4)]);
    gl.blendEquation(gl.FUNC_ADD); gl.disable(gl.BLEND);
  }
  // the pen lifts: the stroke joins the sheet (ink on ink adds) and the next starts clean
  function commit() {
    gl.viewport(0, 0, W, H); gl.bindFramebuffer(gl.FRAMEBUFFER, F.wet[cur]); gl.enable(gl.BLEND); gl.blendEquation(gl.MAX);
    const pr = P.commit; gl.useProgram(pr.p); bind(pr, 'uStroke', 0, T.stroke); bind(pr, 'uPaper', 1, T.paper); run(pr);
    gl.blendEquation(gl.FUNC_ADD); gl.disable(gl.BLEND); clearT(F.stroke); wetting = 15000;
  }
  // the ink dries: half of what is wet is dry after `S.drying` ms (skipped once nothing is wet)
  function dry(ms) {
    if (wetting <= 0) return; wetting -= ms;
    gl.viewport(0, 0, W, H); gl.bindFramebuffer(gl.FRAMEBUFFER, F.dry[cur]); const pr = P.dry; gl.useProgram(pr.p);
    bind(pr, 'uDry', 0, T.dry[cur]); bind(pr, 'uWet', 1, T.wet[cur]); gl.uniform1f(pr.u('uK'), wetting <= 0 ? 1 : 1 - .5 ** (ms / S.drying)); run(pr); cur = 1 - cur;
  }
  function render() {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H); const pr = P.render; gl.useProgram(pr.p);
    bind(pr, 'uDry', 0, T.dry[cur]); bind(pr, 'uWet', 3, T.wet[cur]); bind(pr, 'uStroke', 1, T.stroke); bind(pr, 'uPaper', 2, T.paper);
    gl.uniform3f(pr.u('uPaperRGB'), ...S.paper.map(c => c / 255));
    gl.uniform3f(pr.u('uK'), ...S.ink.map((c, i) => -Math.log(Math.max(.02, c / S.paper[i])) / S.density)); run(pr);
  }
  return { gl, W, H, dpr, settings: S, sweep, commit, dry, render, clear, makePaper };
}

// A pen in a hand. The hand gives targets (page px, pressure, time in ms); the pen follows through a damped spring
// (natural frequency `stiffness` Hz, damping ratio `damping`) and its broad edge sweeps ink onto the sheet.
// angle: the nib edge's angle above the writing line (radians). use: how quickly a dip runs out.
export class Pen {
  constructor(medium, { width = 3.2, angle = .62, flex = .8, hairline = .32, use = 1, stiffness = 24, damping = .9 } = {}) {
    Object.assign(this, { m: medium, width, angle, flex, hairline, use, stiffness, damping, charge: 1 });
    this.reset();
  }
  reset() { this.pos = null; this.vel = [0, 0]; this.last = null; this.target = null; this.prev = null; this.tt = 0; this.pres = .5; this.sp = 0; this.queue = []; }
  dip() { this.charge = 1; }
  hand(x, y, p, t) { this.queue.push({ x, y, p, t }); }
  // advance to time `now`: the target holds the hand's last known place until the next sample arrives
  update(now) {
    while (this.queue.length && this.queue[0].t <= now) {
      const h = this.queue.shift();
      if (!this.pos) { this.pos = [h.x, h.y]; this.tt = h.t; this.pres = h.p; this.target = h; this.emit(0); continue; }
      this.prev = this.target; this.target = h; this.advance(h.t);
    }
    if (this.pos) this.advance(now);
  }
  advance(until) {
    const w = 2 * Math.PI * this.stiffness, z = this.damping, A = this.prev ?? this.target, B = this.target, span = B.t - A.t;
    while (this.tt < until) {
      const dt = Math.min(1, until - this.tt) / 1000, f = span > 0 ? Math.min(1, Math.max(0, (this.tt - A.t) / span)) : 1;
      const h = { x: A.x + (B.x - A.x) * f, y: A.y + (B.y - A.y) * f, p: A.p + (B.p - A.p) * f };
      this.vel[0] += (w * w * (h.x - this.pos[0]) - 2 * z * w * this.vel[0]) * dt;
      this.vel[1] += (w * w * (h.y - this.pos[1]) - 2 * z * w * this.vel[1]) * dt;
      this.pos[0] += this.vel[0] * dt; this.pos[1] += this.vel[1] * dt;
      this.pres += (h.p - this.pres) * Math.min(1, dt * 30); this.tt += dt * 1000; this.emit(dt);
    }
  }
  // lift: the pen settles onto where the hand stopped, then the stroke is committed
  lift() { if (this.pos) { this.update(this.tt); this.advance(this.tt + 30); } this.m.commit(); this.reset(); }
  emit(dt) {
    const d = this.m.dpr, p = this.pos;
    this.sp += (Math.hypot(this.vel[0], this.vel[1]) / 1000 - this.sp) * Math.min(1, dt * 25); const sp = this.sp;   // CSS px per ms, smoothed over ~40 ms
    if (this.last && Math.hypot(p[0] - this.last.p[0], p[1] - this.last.p[1]) * d < .35) { this.last.dwell += dt; return; }
    // the nib: a broad edge rising to the right at its angle, spread a little by pressure if it is flexible
    const halfW = this.width * (1 + this.flex * .9 * Math.max(0, this.pres - .35)) / 2, n = [Math.cos(this.angle), -Math.sin(this.angle)];
    // ink flows per unit time, so it lands heavier where the pen is slow; less as the charge runs down
    const flow = (.8 + .75 * Math.exp(-sp * 2.5)) * (.5 + .5 * Math.min(1, this.charge * 2.5)) * (this.last ? 1 : 1.3);
    const cur = { p: [p[0], p[1]], halfW, n, ink: flow, dwell: 0 };
    if (this.last) {
      const a = this.last, b = cur, D = q => [q[0] * d, q[1] * d], dry = Math.max(0, .4 - this.charge) / .4;
      const inkA = a.ink * (1 + Math.min(1, a.dwell * 8));                   // where the pen rested, a pool
      const e = (c, s) => [[c.p[0] - c.n[0] * c.halfW, c.p[1] - c.n[1] * c.halfW], [c.p[0] + c.n[0] * c.halfW, c.p[1] + c.n[1] * c.halfW]][s];
      this.m.sweep([e(a, 0), e(a, 1), e(b, 1), e(b, 0)].map(D), D(a.p), D(b.p), inkA, b.ink, dry);
      // the nib's own thickness: what remains when the stroke runs along the edge
      const t = [b.p[0] - a.p[0], b.p[1] - a.p[1]], tl = Math.hypot(...t), hn = [-t[1] / tl * this.hairline / 2, t[0] / tl * this.hairline / 2];
      this.m.sweep([[a.p[0] - hn[0], a.p[1] - hn[1]], [a.p[0] + hn[0], a.p[1] + hn[1]], [b.p[0] + hn[0], b.p[1] + hn[1]], [b.p[0] - hn[0], b.p[1] - hn[1]]].map(D), D(a.p), D(b.p), inkA, b.ink, dry);
      this.charge = Math.max(0, this.charge - tl * Math.sqrt(halfW) * .00035 * this.use);
    }
    this.last = cur;
  }
}
