import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
from PIL import Image
from scipy import ndimage as nd
from ok import oklch, srgb_to_lin
src = sys.argv[1]
# region: (file, crop box in full px or None, kind)  ; gold mask by hue/chroma gate
P = {
 '477838 ground': ('477838.jpg', (430, 455, 2030, 2190)),
 '477838a': ('477838.jpg', (1642+200, 490+20, 1642+349, 490+170)),
 '477838b': ('477838.jpg', (448, 1808+60, 448+200, 1808+310)),
 '466330 ceiling': ('466330.jpg', (1236+400, 292+120, 1236+900, 292+329)),
 '463605 ground': ('463605.jpg', (180, 972, 361, 1458)),
 '437742 ground': ('437742.jpg', (389, 1000, 389+230, 1600)),
 '437290 sky': ('437290.jpg', (460, 320, 1228, 520)),
 '459134 gable': ('459134.jpg', (702+180, 1040+150, 702+330, 1440)),
 '437649 halo': ('437649.jpg', (365+100, 971+100, 365+230, 971+700)),
 '436908 ground': ('436908.jpg', (60+100, 587, 304, 979)),
}
def bands(L, m):
    # share of variance of L in octave bands (DoG), inside mask
    out=[]; prev = L
    for s in [1,2,4,8,16,32,64]:
        g = nd.gaussian_filter(L, s); band = prev - g; prev = g
        out.append(float(np.var(band[m])))
    out.append(float(np.var(prev[m])))
    tot = sum(out); return [round(v/tot,3) for v in out]
def acf_len(L):
    x = L - L.mean(); F = np.fft.fft2(x); a = np.real(np.fft.ifft2(F*np.conj(F))); a/=a[0,0]
    ax = a[0,:a.shape[1]//2]; ay = a[:a.shape[0]//2,0]
    f = lambda v: int(np.argmax(v < 1/np.e)) if (v<1/np.e).any() else len(v)
    return f(ax), f(ay)
def slope(L):
    x = L - L.mean(); h,w = x.shape; win = np.outer(np.hanning(h),np.hanning(w))
    P = np.abs(np.fft.fftshift(np.fft.fft2(x*win)))**2
    yy,xx = np.indices(P.shape); r = np.hypot(yy-h/2, xx-w/2).astype(int)
    rad = np.bincount(r.ravel(), P.ravel())/np.maximum(1,np.bincount(r.ravel()))
    k = np.arange(2, min(h,w)//2); return float(np.polyfit(np.log(k), np.log(rad[k]),1)[0])
def coherence(L):
    gx = nd.sobel(nd.gaussian_filter(L,1),1); gy = nd.sobel(nd.gaussian_filter(L,1),0)
    J = [nd.gaussian_filter(v,8) for v in (gx*gx, gy*gy, gx*gy)]
    l1 = (J[0]+J[1])/2 + np.sqrt(((J[0]-J[1])/2)**2 + J[2]**2); l2 = (J[0]+J[1])/2 - np.sqrt(((J[0]-J[1])/2)**2 + J[2]**2)
    c = (l1-l2)/(l1+l2+1e-12); return float(np.median(c))
res = {}
for k,(f,box) in P.items():
    im = np.asarray(Image.open(os.path.join(src,f)).convert('RGB').crop(box))
    L,C,h = oklch(im)
    m = (C>0.035) & (h>55) & (h<115) & (L>0.25)
    pc = lambda v: [round(float(x),3) for x in np.percentile(v[m],[1,5,25,50,75,95,99.5])]
    lin = srgb_to_lin(im.astype(float))[m]; 
    Lm = np.where(m, L, L[m].mean())
    # hue vs L: is the dark gold olive?
    q = np.percentile(L[m],[10,90]); dk = m&(L<q[0]); br = m&(L>q[1])
    r = dict(size=im.shape[:2], gold_frac=round(float(m.mean()),3), L=pc(L), C=pc(C), h=pc(h), Lstd=round(float(L[m].std()),3),
      dark10=dict(L=round(float(L[dk].mean()),3),C=round(float(C[dk].mean()),3),h=round(float(h[dk].mean()),1)),
      bright10=dict(L=round(float(L[br].mean()),3),C=round(float(C[br].mean()),3),h=round(float(h[br].mean()),1)),
      lin_mean=[round(float(x),3) for x in lin.mean(0)],
      bands_var_share_1_2_4_8_16_32_64_rest=bands(Lm,m), acf_px=acf_len(Lm), psd_slope=round(slope(Lm),2), coherence=round(coherence(Lm),2),
      frac_dark=round(float((L[m]<np.median(L[m])-0.1).mean()),3), frac_bright=round(float((L[m]>np.median(L[m])+0.08).mean()),3))
    res[k]=r; print(k, json.dumps(r))
