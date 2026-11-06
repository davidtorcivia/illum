// The gold of kit/goldleaf.js as a WebGL2 shader, lit by the reader: the same broad sweeps over an undulating ground,
// the olive turn of the leaf at the edges away from the light, the real detail of a photographed burnished ground
// (Met 477838) as a texture, and a highlight that slides across the leaf as the light moves. Drawn only when the
// light moves; rests at the still light otherwise.
import { RAMP, BOLE } from './gold.js';

const VS = `#version 300 es
in vec2 p; out vec2 uv; void main(){ uv = p * .5 + .5; uv.y = 1. - uv.y; gl_Position = vec4(p, 0, 1); }`;
const FS = `#version 300 es
precision highp float;
uniform sampler2D uMask;    // r: coverage, g: soft edge field (blurred coverage)
uniform sampler2D uDetail;  // r: the real gold's fine luminance detail (sRGB units), tiling
uniform vec2 uSize;         // canvas size, device px
uniform float uPx, uW, uSeed, uDetailScale, uFlip;
uniform vec2 uLight, uOff;  // where the light is (a unit-ish direction in the page plane); detail offset
uniform float uGlint;       // how strongly a moving light flashes
uniform float uAmp, uEdge, uHand;
uniform vec3 uRamp[7], uBole;
in vec2 uv; out vec4 o;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)) + uSeed * 13.7) * 43758.5453); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
float h(vec2 X){ return .9 * vn(X / (uW * .7)) + .45 * vn(X / (uW * .33) + 9.); }
vec3 ramp(float e){ e = clamp(e, 0., 1.) * 6.; int i = min(int(e), 5); return mix(uRamp[i], uRamp[i + 1], e - float(i)); }
vec3 toS(vec3 c){ return mix(c * 12.92, 1.055 * pow(c, vec3(1. / 2.4)) - .055, step(.0031308, c)); }
void main(){
  vec2 px = uv * uSize; vec4 m = texture(uMask, uv); if (m.r <= 0.) discard;
  vec2 X = px * uPx; float e = .7;
  vec2 grad = vec2(h(X + vec2(e, 0)) - h(X - vec2(e, 0)), h(X + vec2(0, e)) - h(X - vec2(0, e))) / (2. * e) * uW * uAmp;
  vec2 L = uLight;
  float E = .72 - 2.2 * dot(L, grad);
  // a highlight: where the ground's tilt matches the light's offset, the leaf flashes (burnished, so a tight lobe)
  E += uGlint * exp(-dot(grad * 1.6 - L * .45, grad * 1.6 - L * .45) / .06);
  // the edge: the leaf turns down over the gesso; dark olive on the side away from the light, in patches
  vec2 t = 1. / uSize;
  float bx = texture(uMask, uv + vec2(t.x, 0)).g - texture(uMask, uv - vec2(t.x, 0)).g, by = texture(uMask, uv + vec2(0, t.y)).g - texture(uMask, uv - vec2(0, t.y)).g;
  vec2 nrm = -vec2(bx, by) / max(1e-5, length(vec2(bx, by)));
  float facing = dot(nrm, normalize(L + vec2(1e-4))), near = clamp((1. - m.g) * 1.8, 0., 1.), pat = max(0., vn(X / (uW * .3) + 33.) * 1.6 - .45);
  E += near * (facing > 0. ? .12 * facing : uEdge * facing * pat);
  vec3 c = toS(clamp(ramp(E), 0., 1.));
  vec2 sp = (px * uFlip * uDetailScale + uOff) / vec2(textureSize(uDetail, 0));
  float dv = texture(uDetail, sp).r / 255. * uHand; dv = dv < 0. ? dv * 1.25 : dv * .7;
  c += dv;
  o = vec4(clamp(c, 0., 1.) * m.r, m.r);
}`;
// M: coverage (Float32, device px), B: its soft edge field; detail: { H: Float32 sRGB detail, S: size }
export function goldShader(canvas, M, B, cw, ch, detail, { dpr = 2, W = 100, seed = 1, detailScale = 1, amp = .14, edge = .9, hand = 1.7 } = {}) {
  const gl = canvas.getContext('webgl2', { premultipliedAlpha: true, alpha: true, antialias: false }); if (!gl) return null;
  const sh = (t, src) => { const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr); gl.useProgram(pr);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const tex = (unit, w, h, fmt, ifmt, data, wrap) => { const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
    for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.NEAREST], [gl.TEXTURE_MAG_FILTER, gl.NEAREST], [gl.TEXTURE_WRAP_S, wrap], [gl.TEXTURE_WRAP_T, wrap]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
    gl.texImage2D(gl.TEXTURE_2D, 0, ifmt, w, h, 0, fmt, gl.FLOAT, data); };
  const mb = new Float32Array(cw * ch * 2); for (let i = 0; i < cw * ch; i++) { mb[i * 2] = M[i]; mb[i * 2 + 1] = B[i]; }
  tex(0, cw, ch, gl.RG, gl.RG32F, mb, gl.CLAMP_TO_EDGE);
  tex(1, detail.S, detail.S, gl.RED, gl.R32F, detail.H, gl.REPEAT);
  const U = n => gl.getUniformLocation(pr, n), r = (seed * 9301 + 49297) % 233280 / 233280;
  gl.uniform1i(U('uMask'), 0); gl.uniform1i(U('uDetail'), 1); gl.uniform2f(U('uSize'), cw, ch); gl.uniform1f(U('uPx'), 1 / dpr); gl.uniform1f(U('uW'), W);
  gl.uniform1f(U('uSeed'), seed % 97); gl.uniform1f(U('uDetailScale'), detailScale); gl.uniform1f(U('uAmp'), amp); gl.uniform1f(U('uEdge'), edge); gl.uniform1f(U('uHand'), hand); gl.uniform1f(U('uFlip'), r < .5 ? -1 : 1);
  gl.uniform2f(U('uOff'), r * 4093 % detail.S, r * 7919 % detail.S);
  gl.uniform3fv(U('uRamp[0]'), RAMP.flat()); gl.uniform3fv(U('uBole'), BOLE);
  canvas.width = cw; canvas.height = ch; gl.viewport(0, 0, cw, ch); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  return (light, glint = 0) => { gl.uniform2f(U('uLight'), light[0], light[1]); gl.uniform1f(U('uGlint'), glint);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); };
}
