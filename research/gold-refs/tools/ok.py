import numpy as np
def srgb_to_lin(c):
    c = c/255.0
    return np.where(c<=0.04045, c/12.92, ((c+0.055)/1.055)**2.4)
def lin_to_oklab(l):
    M1 = np.array([[0.4122214708,0.5363325363,0.0514459929],[0.2119034982,0.6806995451,0.1073969566],[0.0883024619,0.2817188376,0.6299787005]])
    M2 = np.array([[0.2104542553,0.7936177850,-0.0040720468],[1.9779984951,-2.4285922050,0.4505937099],[0.0259040371,0.7827717662,-0.8086757660]])
    lms = np.cbrt(l @ M1.T); return lms @ M2.T
def oklch(rgb8):
    lab = lin_to_oklab(srgb_to_lin(rgb8.astype(np.float64)))
    L,a,b = lab[...,0],lab[...,1],lab[...,2]
    return L, np.hypot(a,b), (np.degrees(np.arctan2(b,a))%360)
