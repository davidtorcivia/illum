# Synthetic burnished raised-gold initial ground, lit statically, to check the recipe against the measurements.
import sys, numpy as np
from PIL import Image
from scipy import ndimage as nd
W = int(sys.argv[2]) if len(sys.argv) > 2 else 400; rng = np.random.default_rng(7)
y, x = np.mgrid[0:W, 0:W] + 0.5
# coverage: square ground minus the round body of a letter (like 477838)
M = ((np.hypot(x - W*.52, y - W*.5) > W*.36)).astype(float)
M[:int(W*.02)] = 0; M[-int(W*.02):] = 0; M[:, :int(W*.02)] = 0; M[:, -int(W*.02):] = 0
d = nd.distance_transform_edt(M > .5)
def vnoise(cell):  # smooth value noise with cubic interpolation, one octave
    n = int(np.ceil(W / cell)) + 4; g = rng.standard_normal((n, n))
    return nd.map_coordinates(g, [y / cell + 1, x / cell + 1], order=3, mode='nearest')
# height (px units): cushion over the distance field + gesso waves (fbm, gain .5 => equal slope per octave)
def dome(s): b = np.clip((nd.gaussian_filter(M, s) - .5) / .45, 0, 1); return s * b * (2 - b)
mixn = np.clip(.5 + .9 * vnoise(W / 2.5), 0, 1); amp = 1 + .45 * vnoise(W / 3)   # gesso laid unevenly: width and height wander
h = amp * ((1 - mixn) * dome(.025 * W) + mixn * dome(.07 * W)) * 1.1
for cell, a in [(W/1.5, .015), (W/3, .012), (W/6, .006), (W/12, .003), (W/24, .0015)]: h += a * cell * vnoise(cell)  # amplitude ∝ cell size
h = nd.gaussian_filter(h, .008 * W)  # gesso is poured and burnished: no creases
# sparse dark features: burnish scratches (short, near-parallel), and specks
cav = np.zeros((W, W)); ang0 = 0.6
# burnish striations: dense, short, faint, slightly curved, in two crossing strokes (Cennini: one way, then the other)
for i in range(int(W * W / 400)):
    cx, cy = rng.uniform(0, W, 2); L = rng.uniform(.01, .05) * W; a = ang0 + (np.pi / 2 if rng.random() < .4 else 0) + rng.normal(0, .15)
    k = rng.normal(0, .2 / L); t = np.linspace(-L/2, L/2, max(2, int(L * 2))); aa = a + k * t
    px, py = (cx + t*np.cos(aa)).astype(int), (cy + t*np.sin(aa)).astype(int); w = np.sin(np.linspace(0, np.pi, len(t)))  # tapered
    ok = (px >= 0) & (px < W) & (py >= 0) & (py < W); np.add.at(cav, (py[ok], px[ok]), rng.uniform(.08, .22) * w[ok])
for i in range(int(W * W / 8000)):
    cx, cy = rng.integers(0, W, 2); cav[cy, cx] += rng.uniform(1, 4)
cav = nd.gaussian_filter(cav, 0.6)
h -= 0.15 * cav
gy, gx = np.gradient(nd.gaussian_filter(h, .7))
n = np.dstack([-gx, -gy, np.ones_like(h)]); n /= np.linalg.norm(n, axis=2, keepdims=True)
# reflect the view (0,0,1): r = 2 n.z n - v ; environment = copy stand: bright softboxes left/right at ~40deg, dim above, dark above/below
r = 2 * n[..., 2:3] * n - np.array([0, 0, 1.0]); th = np.degrees(np.arccos(np.clip(r[..., 2], -1, 1))); ph = np.arctan2(r[..., 1], r[..., 0])
E = 0.66 + 0.30 * np.exp(-((th - 38) / 22) ** 2) * np.cos(ph) ** 2 - 0.55 * np.exp(-((th - 35) / 25) ** 2) * np.sin(ph) ** 2
E = E - 0.6 * nd.gaussian_filter(cav, .8) - 0.25 * np.exp(-d / 1.2)  # occlusion in scratches; burr of the rim
# leaf texture below the relief: fine, low-contrast, slightly dark-skewed (wrinkles, beater marks), in reflectance only

E = np.clip(E, 0, 1)
# ramp: measured OKLCH keyframes (L, C, h) indexed by E
K = np.array([[0.30, .048, 72], [0.42, .066, 80], [0.55, .082, 84], [0.68, .100, 85], [0.78, .106, 86.5], [0.86, .105, 87.5], [0.93, .090, 95]])
t = E * (len(K) - 1); i = np.clip(t.astype(int), 0, len(K) - 2); f = (t - i)[..., None]; lch = K[i] * (1 - f) + K[i + 1] * f
Lk, Ck, hk = lch[..., 0], lch[..., 1], np.radians(lch[..., 2]); lab = np.dstack([Lk, Ck * np.cos(hk), Ck * np.sin(hk)])
M2 = np.array([[1, 0.3963377774, 0.2158037573], [1, -0.1055613458, -0.0638541728], [1, -0.0894841775, -1.2914855480]])
M1 = np.array([[4.0767416621, -3.3077115913, 0.2309699292], [-1.2684380046, 2.6097574011, -0.3413193965], [-0.0041960863, -0.7034186147, 1.7076147010]])
lin = np.clip((lab @ M2.T) ** 3 @ M1.T, 0, 1); srgb = np.where(lin <= .0031308, lin * 12.92, 1.055 * lin ** (1/2.4) - .055)
paper = np.array([0.93, 0.91, 0.86]); out = np.where(M[..., None] > .5, srgb, paper)
# ink outline on the edge, as every manuscript ground has
edge = (M > .5) & (d < 1.5); out[edge] = out[edge] * 0.25
Image.fromarray((out * 255).round().astype(np.uint8)).save(sys.argv[1])
