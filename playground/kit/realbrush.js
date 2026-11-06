// Real brush strokes, bent to a scribe's path: the RealBrush idea (Lu, Barnes, DiVerdi & Finkelstein, SIGGRAPH 2013).
// Every mark is a stroke a person actually made: harvested from public-domain museum scans (Met Open Access, CC0;
// playground/materials/strokes, tools/strokes) with its centreline and width measured. A stroke of the ductus picks
// the real stroke nearest it in proportion and turn, and that stroke is laid along it as a ribbon of thin slices
// (texture-following, not stretched as a sticker), keeping its own swell, its loaded start, its dry splits and its
// pooled end; its ink is recoloured into lapis or vermilion by density, as pigment over the paper. Nothing simulated.
const BASE = new URL('../materials/strokes/', import.meta.url).href;
let LIB = null;
export async function loadStrokes() {
  if (LIB) return LIB;
  const m = await (await fetch(BASE + 'manifest.json')).json();
  LIB = m.strokes.filter(s => s.centerline?.length > 4 && s.halfwidth?.length > 4).map(s => {
    const C = s.centerline, S = [0]; for (let i = 1; i < C.length; i++) S.push(S[i - 1] + Math.hypot(C[i][0] - C[i - 1][0], C[i][1] - C[i - 1][1]));
    const hw = s.halfwidth, mean = hw.reduce((a, b) => a + b, 0) / hw.length, L = S[S.length - 1];
    return { ...s, S, L, meanHW: mean, ratio: L / (2 * mean + 1e-6), turn: turning(C), img: null };
  });
  return LIB;
}
function turning(P) { let t = 0; for (let i = 2; i < P.length; i++) { const a = Math.atan2(P[i - 1][1] - P[i - 2][1], P[i - 1][0] - P[i - 2][0]), b = Math.atan2(P[i][1] - P[i - 1][1], P[i][0] - P[i - 1][0]); let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; t += d; } return t; }
// fetch every stroke's image once, so laying a stroke never waits
export async function preload(lib) { await Promise.all(lib.map(async s => { if (!s.img) s.img = await createImageBitmap(await (await fetch(BASE + s.file)).blob(), { premultiplyAlpha: 'none' }); })); }

// choose the real stroke for a path: like in length to width and in how much and which way it turns
export function pick(lib, P, hwMean, { seed = 1, kinds = null, hair = false, dryW = 4 } = {}) {
  const S = [0]; for (let i = 1; i < P.length; i++) S.push(S[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  const ratio = S[S.length - 1] / (2 * hwMean + 1e-6), turn = turning(P);
  const scored = lib.filter(s => !kinds || kinds.includes(s.kind)).filter(s => hair || (s.dry ?? 0) < .3).filter(s => hair ? s.meanHW / s.L < .06 : s.meanHW / s.L >= .035).map(s => {
    const flip = Math.sign(s.turn) !== Math.sign(turn) && Math.abs(turn) > .3;
    return { s, flip, score: Math.abs(Math.log(s.ratio / ratio)) + .55 * Math.abs(Math.abs(s.turn) - Math.abs(turn)) + dryW * Math.max(0, (s.dry ?? 0) - .08) };
  }).sort((a, b) => a.score - b.score);
  const k = Math.min(scored.length, 4), h = Math.abs(Math.sin(seed * 9301 + 49297)) * 1e4; return scored[Math.floor((h - Math.floor(h)) * k)] ?? null;
}

const VS = `#version 300 es
in vec2 aPos; in vec2 aUV; out vec2 vUV; uniform vec2 uSize;
void main(){ vUV = aUV; vec2 p = aPos / uSize * 2. - 1.; gl_Position = vec4(p.x, -p.y, 0, 1); }`;
const FS = `#version 300 es
precision highp float; in vec2 vUV; out vec4 o; uniform sampler2D uTex; uniform vec3 uK, uPaper; uniform float uLoad;
void main(){
  vec4 t = texture(uTex, vUV);
  float lum = dot(t.rgb, vec3(.3, .59, .11)), dark = clamp((.62 - lum) / .5, 0., 1.);
  // the ink's own density (its coverage, and how dark the ink lay) becomes the pigment's
  float d = t.a * mix(.72, 1.08, dark) * uLoad;
  vec3 c = uPaper * exp(-uK * d * 1.15);
  float a = smoothstep(.02, .55, t.a);
  o = vec4(c * a, a);
}`;
let R = null;
function renderer() {
  if (R) return R;
  const cv = new OffscreenCanvas(8, 8), gl = cv.getContext('webgl2', { premultipliedAlpha: true, alpha: true, antialias: true }); if (!gl) return null;
  const sh = (t, src) => { const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr); gl.useProgram(pr);
  R = { cv, gl, pr, buf: gl.createBuffer(), tex: new Map(), U: n => gl.getUniformLocation(pr, n) };
  return R;
}

// lay one real stroke along path P (page px) onto 2D context g, whose transform maps page px to device px at dpr.
// hw(u): the path's half-width from the ductus; the real stroke keeps its own swell, scaled to this weight.
export function layStroke(g, lib, P, { hw, dpr = 2, color = [40, 60, 140], paper = [244, 238, 226], seed = 1, hair = false, blend = .3 } = {}) {
  const r = renderer(); if (!r || P.length < 2) return false;
  const hwOf = typeof hw === 'function' ? hw : () => hw;
  let hwMean = 0; for (let k = 0; k <= 8; k++) hwMean += hwOf(k / 8) / 9;
  const choice = pick(lib, P, hwMean, { seed, hair }); if (!choice) return false;
  const { s, flip } = choice, img = s.img, gl = r.gl; if (!img) return false;
  // the path by arc length
  const S = [0]; for (let i = 1; i < P.length; i++) S.push(S[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  const L = S[S.length - 1], at = (Q, SQ, d) => { let i = 1; while (i < Q.length - 1 && SQ[i] < d) i++; const u = Math.max(0, Math.min(1, (d - SQ[i - 1]) / ((SQ[i] - SQ[i - 1]) || 1)));
    const a = Q[i - 1], b = Q[i]; return { p: [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u], t: [(b[0] - a[0]), (b[1] - a[1])] }; };
  const scale = hwMean / s.meanHW, M = 1.45, N = 64, ext = .9;   // slices; a margin round the stroke for its soft edge; reach past its ends
  const ehw = u => { const k = Math.max(0, Math.min(s.halfwidth.length - 1, u * (s.halfwidth.length - 1))), i = Math.floor(k), f = k - i; return s.halfwidth[i] * (1 - f) + (s.halfwidth[Math.min(s.halfwidth.length - 1, i + 1)] ?? 0) * f; };
  const pos = [], uv = [], [W, H] = s.size;
  for (let k = -2; k <= N + 2; k++) {
    const u = Math.max(0, Math.min(1, k / N)), over = k < 0 ? k / 2 : k > N ? (k - N) / 2 : 0;   // beyond the ends, run on along the tangent
    const e = at(s.centerline, s.S, u * s.L), tl = Math.hypot(...e.t) || 1, et = [e.t[0] / tl, e.t[1] / tl], en = [-et[1] * (flip ? -1 : 1), et[0] * (flip ? -1 : 1)];
    const reach = over * ext * Math.max(ehw(u), 2);
    const ec = [e.p[0] + et[0] * reach * (k < 0 ? -1 : 1) * Math.sign(over || 1), e.p[1] + et[1] * reach * (k < 0 ? -1 : 1) * Math.sign(over || 1)];
    const q = at(P, S, u * L), ql = Math.hypot(...q.t) || 1, qt = [q.t[0] / ql, q.t[1] / ql], qn = [-qt[1], qt[0]];
    const halfE = Math.max(1.5, ehw(u)) * M, halfT = (blend * Math.max(1.5, ehw(u)) * scale + (1 - blend) * hwOf(u)) * M;
    const qc = [q.p[0] + qt[0] * reach * scale * (k < 0 ? -1 : 1) * Math.sign(over || 1), q.p[1] + qt[1] * reach * scale * (k < 0 ? -1 : 1) * Math.sign(over || 1)];
    for (const side of [-1, 1]) {
      pos.push(qc[0] + qn[0] * halfT * side, qc[1] + qn[1] * halfT * side);
      uv.push((ec[0] + en[0] * halfE * side) / W, (ec[1] + en[1] * halfE * side) / H);
    }
  }
  // render into a canvas over the ribbon's box, then lay it on the page
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; for (let i = 0; i < pos.length; i += 2) { x0 = Math.min(x0, pos[i]); x1 = Math.max(x1, pos[i]); y0 = Math.min(y0, pos[i + 1]); y1 = Math.max(y1, pos[i + 1]); }
  x0 = Math.floor(x0 - 2); y0 = Math.floor(y0 - 2); x1 = Math.ceil(x1 + 2); y1 = Math.ceil(y1 + 2);
  const cw = Math.max(1, Math.ceil((x1 - x0) * dpr)), ch = Math.max(1, Math.ceil((y1 - y0) * dpr));
  r.cv.width = cw; r.cv.height = ch; gl.viewport(0, 0, cw, ch); gl.useProgram(r.pr);
  const data = new Float32Array(pos.length * 2); for (let i = 0; i < pos.length / 2; i++) { data[i * 4] = (pos[i * 2] - x0) * dpr; data[i * 4 + 1] = (pos[i * 2 + 1] - y0) * dpr; data[i * 4 + 2] = uv[i * 2]; data[i * 4 + 3] = uv[i * 2 + 1]; }
  gl.bindBuffer(gl.ARRAY_BUFFER, r.buf); gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
  const aP = gl.getAttribLocation(r.pr, 'aPos'), aU = gl.getAttribLocation(r.pr, 'aUV');
  gl.enableVertexAttribArray(aP); gl.vertexAttribPointer(aP, 2, gl.FLOAT, false, 16, 0); gl.enableVertexAttribArray(aU); gl.vertexAttribPointer(aU, 2, gl.FLOAT, false, 16, 8);
  let tex = r.tex.get(s.file);
  if (!tex) { tex = gl.createTexture(); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img); gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); r.tex.set(s.file, tex); }
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
  const K = color.map((c, i) => -Math.log(Math.max(.02, c / paper[i])));
  gl.uniform2f(r.U('uSize'), cw, ch); gl.uniform1i(r.U('uTex'), 0); gl.uniform3f(r.U('uK'), ...K); gl.uniform3f(r.U('uPaper'), ...paper.map(c => c / 255)); gl.uniform1f(r.U('uLoad'), 1);
  gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, pos.length / 2);
  g.drawImage(r.cv, x0, y0, cw / dpr, ch / dpr);
  return { id: s.id, flip };
}
