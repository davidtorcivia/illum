// Gold over large areas, after research/07-gold.md: not a texture but a mirror bent over a gesso cushion.
// The shape is baked once into fields (height H, cavity K, wear Wr, edge distance D), then lit: once by a fixed
// copy-stand environment for the still page, or every frame in WebGL2 by the reader's light. Colour comes from the
// ramp measured on Met 477838 (raised burnished ground), never from hue-fixed noise.
import { noise2, mulberry } from './marks.js';

// the measured ramp, linear RGB, evenly spaced in E (07-gold §4.3)
// The ramp: dark olive → body → bright, re-taken by eye from the reference crop's own pixels (the lit field of 477838
// sits near sRGB 236 201 115 and 241 194 77, its olive sweeps near 133 105 54): more saturated in the body than the
// measured keyframes of 07-gold §4.3, whose top was pulled toward white by specular highlights.
const lin = c => { c /= 255; return c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4; };
export const RAMP = [[52, 38, 16], [96, 74, 32], [138, 108, 52], [180, 140, 62], [218, 176, 80], [240, 198, 96], [252, 230, 156]].map(c => c.map(lin));
export const BOLE = [.242, .083, .028];
const ramp = e => { e = Math.min(1, Math.max(0, e)) * 6; const i = Math.min(5, e | 0), f = e - i; return RAMP[i].map((v, j) => v + (RAMP[i + 1][j] - v) * f); };
const srgb = c => c <= .0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - .055;

function blur(A, w, h, r) {
  if (r < 1) return A; const T = new Float32Array(w * h), O = new Float32Array(w * h), k = 2 * r + 1;
  for (let y = 0; y < h; y++) { let s = 0; for (let x = -r; x <= r; x++) s += A[y * w + Math.min(w - 1, Math.max(0, x))];
    for (let x = 0; x < w; x++) { T[y * w + x] = s / k; s += A[y * w + Math.min(w - 1, x + r + 1)] - A[y * w + Math.max(0, x - r)]; } }
  for (let x = 0; x < w; x++) { let s = 0; for (let y = -r; y <= r; y++) s += T[Math.min(h - 1, Math.max(0, y)) * w + x];
    for (let y = 0; y < h; y++) { O[y * w + x] = s / k; s += T[Math.min(h - 1, y + r + 1) * w + x] - T[Math.max(0, y - r) * w + x]; } }
  return O;
}
const gauss = (A, w, h, sigma) => { const r = Math.max(1, Math.round(sigma * .87)); return blur(blur(blur(A, w, h, r), w, h, r), w, h, r); };
// distance to the outside of the mask, in device px (chamfer 3-4)
function edgeDistance(M, w, h) {
  const D = new Float32Array(w * h); for (let i = 0; i < w * h; i++) D[i] = M[i] > .5 ? 1e6 : 0;
  const p = (i, j, c) => { if (D[j] + c < D[i]) D[i] = D[j] + c; };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x; if (!D[i]) continue;
    if (x) p(i, i - 1, 3); if (y) { p(i, i - w, 3); if (x) p(i, i - w - 1, 4); if (x < w - 1) p(i, i - w + 1, 4); } }
  for (let y = h - 1; y >= 0; y--) for (let x = w - 1; x >= 0; x--) { const i = y * w + x; if (!D[i]) continue;
    if (x < w - 1) p(i, i + 1, 3); if (y < h - 1) { p(i, i + w, 3); if (x < w - 1) p(i, i + w + 1, 4); if (x) p(i, i + w - 1, 4); } }
  for (let i = 0; i < w * h; i++) D[i] = Math.min(D[i], 1e5) / 3;
  return D;
}

// M: coverage (Float32, device px, cw × ch), W: the gold's width in CSS px (sets every scale), dpr, seed.
// raised: gesso under the leaf (an initial's ground) or flat (a panel). Returns the fields, all in device px.
export function goldFields(M, cw, ch, { W, dpr = 2, seed = 1, raised = true, wear = .015, cushion = .035, waves = 1 } = {}) {
  const n = cw * ch, H = new Float32Array(n), K = new Float32Array(n), Wr = new Float32Array(n), D = edgeDistance(M, cw, ch);
  const nz = noise2(seed), nz2 = noise2(seed ^ 0x51), nz3 = noise2(seed ^ 0xa7), px = 1 / dpr;   // px: CSS px per device px
  if (raised) {
    // the cushion: two profile widths mixed slowly along the edge, one common height, so the interior stays flat
    const s1 = .04 * W, s2 = .1 * W, B1 = gauss(M, cw, ch, s1 * dpr), B2 = gauss(M, cw, ch, s2 * dpr), Hc = cushion * W;
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) { const i = y * cw + x; if (M[i] <= 0) continue;
      const b1 = Math.min(1, Math.max(0, (B1[i] - .5) / .45)), b2 = Math.min(1, Math.max(0, (B2[i] - .5) / .45));
      const m = .6 + .4 * nz(x * px / (W / 2.5), y * px / (W / 2.5)), prof = (b1 * (2 - b1)) * (1 - m) + (b2 * (2 - b2)) * m;
      H[i] = Hc * prof * (.5 + 1 * nz2(x * px / (W / 3), y * px / (W / 3))); }
  }
  // gesso waves: the top octaves only, more as the gold gets larger (07-gold §4.4)
  const oct = W < 60 ? 0 : W < 160 ? 4 : 5;
  for (let o = 0; o < oct; o++) { const cell = W / (1.5 * 2 ** o), amp = [.015, .012, .006, .003, .0015][o] * cell * (W < 160 ? .66 : 1) * waves * (o ? .6 : 1) * (W < 160 && o > 1 ? .5 : 1);
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) { const i = y * cw + x; if (M[i] > 0) H[i] += amp * (nz3(x * px / cell + o * 17, y * px / cell) - .5) * 2; } }
  const Hb = gauss(H, cw, ch, Math.max(1, .008 * W * dpr)); H.set(Hb);
  // cavity: the dark lip where the leaf breaks over the gesso edge, and a few specks
  for (let i = 0; i < n; i++) if (M[i] > 0) K[i] = .4 * Math.exp(-D[i] * px / 1.2);
  const r = mulberry(seed ^ 0x99), specks = Math.min(3, Math.round(W * W / 8000)) + (W > 160 ? Math.round(W * W / 8000) : 0);
  for (let s = 0, tries = 0; s < specks && tries < 200; tries++) { const x = (r() * cw) | 0, y = (r() * ch) | 0, i = y * cw + x;
    if (D[i] * px < W * .08) continue; s++; const rad = (1 + r()) * dpr * .6;
    for (let yy = -3; yy <= 3; yy++) for (let xx = -3; xx <= 3; xx++) { const j = (y + yy) * cw + x + xx, d = Math.hypot(xx, yy);
      if (j >= 0 && j < n && d < rad + 1) K[j] = Math.max(K[j], .5 * Math.min(1, rad + 1 - d)); } }
  // fine structure, faint and dark only, when the gold is seen large: a few short cracks in the gesso, and scuffs
  if (W * dpr >= 240) { const cr = mulberry(seed ^ 0x3131), ncr = Math.round(W * W * dpr * dpr / 9000);
    for (let k = 0; k < ncr; k++) { let x = cr() * cw, y = cr() * ch, a = cr() * 6.28; const len = (4 + cr() * 14) * dpr;
      for (let s = 0; s < len; s += .7) { a += (cr() - .5) * .5; x += Math.cos(a) * .7; y += Math.sin(a) * .7; const i = (y | 0) * cw + (x | 0);
        if (i >= 0 && i < n && M[i] > 0) K[i] = Math.max(K[i], .16 * (1 - s / len)); } }
    const sc = noise2(seed ^ 0x7777);
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) { const i = y * cw + x; if (M[i] <= 0) continue;
      const v = sc(x * px / 2.2, y * px / 9); if (v > .78) K[i] = Math.max(K[i], (v - .78) * .5); } }
  // wear: at the edges and the high points, sparingly
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) { const i = y * cw + x; if (M[i] <= 0) continue;
    const t = nz(x * px / (W / 40) + 9, y * px / (W / 40)) * .6 + Math.max(0, 1 - D[i] * px / (.04 * W)) * .3 + (H[i] / (1e-3 + 6)) * .2;
    Wr[i] = wear ? Math.min(1, Math.max(0, (t - (.75 - wear * 2)) / .1)) : 0; }
  return { M, H, K, Wr, D, cw, ch, dpr, W };
}

// The still: a copy stand, bright softboxes left and right (turned a little, the right one weaker), dark above and
// below. Writes premultiplied sRGB into an ImageData-sized buffer.
export function goldStill({ M, H, K, Wr, D, cw, ch, dpr }, { turn = .45, lift = .07, sweep = 1.3 } = {}) {
  const out = new ImageData(cw, ch), d = out.data, px = 1 / dpr, D2R = Math.PI / 180;
  for (let y = 1; y < ch - 1; y++) for (let x = 1; x < cw - 1; x++) {
    const i = y * cw + x, m = M[i]; if (m <= 0) continue;
    const gx = (H[i + 1] - H[i - 1]) / (2 * px), gy = (H[i + cw] - H[i - cw]) / (2 * px), l = Math.hypot(gx, gy, 1);
    const nx = -gx / l, ny = -gy / l, nzv = 1 / l, rz = 2 * nzv * nzv - 1, rx = 2 * nzv * nx, ry = 2 * nzv * ny;
    const th = Math.acos(Math.max(-1, Math.min(1, rz))), ph = Math.atan2(ry, rx) + turn, c2 = Math.cos(ph) ** 2;
    const right = Math.cos(ph) > 0 ? .55 : 1;
    let e = .66 + lift + .30 * right * Math.exp(-(((th - 38 * D2R) / (22 * D2R)) ** 2)) * c2 - .55 * Math.exp(-(((th - 35 * D2R) / (25 * D2R)) ** 2)) * (1 - c2);
    // the room is not even: brighter toward the upper left, where the larger softbox stands, so gentle undulations
    // of the gesso show as broad sweeps of light and shade, the way a photographed ground does
    e += sweep * (-rx * .8 - ry * .6);
    e -= .6 * K[i] + .25 * Math.exp(-D[i] * px / 1.2) * .4;
    let c = ramp(e); const w = Wr[i];
    if (w > 0) c = c.map((v, j) => v * (1 - w) + BOLE[j] * (.9 + .2 * ((x * 7 + y * 13) % 5) / 5) * w);
    const dither = (((x * 52.98 + y * 6.71) % 1) - .5) / 255;
    for (let j = 0; j < 3; j++) d[i * 4 + j] = Math.round(Math.min(1, Math.max(0, srgb(c[j]) + dither)) * 255 * m);
    d[i * 4 + 3] = Math.round(255 * m);
  }
  return out;
}

// The lit gold: one WebGL2 canvas over the element, lit by the reader's light; only redrawn while the light moves.
const VS = `#version 300 es
in vec2 p; out vec2 vUv; void main(){ vUv = p * .5 + .5; vUv.y = 1. - vUv.y; gl_Position = vec4(p, 0, 1); }`;
const FS = `#version 300 es
precision highp float;
uniform sampler2D uField; uniform vec2 uTexel; uniform vec3 uLight; uniform float uLit, uPx; uniform vec2 uBurnish, uAlpha;
uniform vec3 uRamp[7]; uniform vec3 uBole; in vec2 vUv; out vec4 o;
vec3 ramp(float e){ e = clamp(e, 0., 1.) * 6.; int i = min(int(e), 5); return mix(uRamp[i], uRamp[i + 1], e - float(i)); }
float ign(vec2 p){ return fract(52.9829189 * fract(dot(p, vec2(.06711056, .00583715)))); }
vec3 toS(vec3 c){ return mix(c * 12.92, 1.055 * pow(c, vec3(1. / 2.4)) - .055, step(.0031308, c)); }
void main(){
  vec4 f = texture(uField, vUv); if (f.a <= 0.) discard;
  float hl = texture(uField, vUv - vec2(uTexel.x, 0)).r, hr = texture(uField, vUv + vec2(uTexel.x, 0)).r;
  float hu = texture(uField, vUv - vec2(0, uTexel.y)).r, hd = texture(uField, vUv + vec2(0, uTexel.y)).r;
  vec3 n = normalize(vec3(-(hr - hl) / (2. * uPx), -(hd - hu) / (2. * uPx), 1.));
  vec3 r = reflect(vec3(0, 0, -1), n); float th = acos(clamp(r.z, -1., 1.)), ph = atan(r.y, r.x + 1e-6) + .45, c2 = cos(ph) * cos(ph);
  float still = .73 + 1.3 * (-r.x * .8 - r.y * .6) + .30 * (cos(ph) > 0. ? .55 : 1.) * exp(-pow((th - .66) / .38, 2.)) * c2 - .55 * exp(-pow((th - .61) / .44, 2.)) * (1. - c2);
  vec3 t = vec3(uBurnish, 0), b = normalize(cross(n, t)); t = cross(b, n); vec3 d = r - uLight;
  float lobe = exp(-(pow(dot(d, t) / uAlpha.x, 2.) + pow(dot(d, b) / uAlpha.y, 2.)));
  float lit = .34 + .10 * r.z + .62 * lobe, e = mix(still, lit, uLit) - .6 * f.g;
  vec3 col = mix(ramp(e), uBole * (.9 + .2 * ign(gl_FragCoord.xy * .37)), f.b);
  o = vec4((toS(clamp(col, 0., 1.)) + (ign(gl_FragCoord.xy) - .5) / 255.) * f.a, f.a);
}`;
export function goldLit(canvas, F, { seed = 1 } = {}) {
  const gl = canvas.getContext('webgl2', { premultipliedAlpha: true, alpha: true }); if (!gl) return null;
  const sh = (t, src) => { const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr); gl.useProgram(pr);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const { M, H, K, Wr, cw, ch, dpr } = F, data = new Float32Array(cw * ch * 4);
  for (let i = 0; i < cw * ch; i++) { data[i * 4] = H[i]; data[i * 4 + 1] = K[i]; data[i * 4 + 2] = Wr[i]; data[i * 4 + 3] = M[i]; }
  const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, cw, ch, 0, gl.RGBA, gl.FLOAT, data);
  const U = n => gl.getUniformLocation(pr, n);
  gl.uniform2f(U('uTexel'), 1 / cw, 1 / ch); gl.uniform1f(U('uPx'), 1 / dpr);
  const ba = (seed % 628) / 100; gl.uniform2f(U('uBurnish'), Math.cos(ba), Math.sin(ba)); gl.uniform2f(U('uAlpha'), .10, .18);
  gl.uniform3fv(U('uRamp[0]'), RAMP.flat()); gl.uniform3fv(U('uBole'), BOLE);
  canvas.width = cw; canvas.height = ch; gl.viewport(0, 0, cw, ch); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  return (light, lit) => { const l = Math.hypot(...light); gl.uniform3f(U('uLight'), light[0] / l, light[1] / l, light[2] / l); gl.uniform1f(U('uLit'), lit);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); };
}
