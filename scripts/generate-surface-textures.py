"""Rebuild the small, original walnut/floor textures (Python 3 + Pillow + numpy).

Offline only: no runtime generation, external images, asset license, or build dependency.
Roughness/height pack: red = height, green = perceptual roughness, blue = unused.
"""
from pathlib import Path
import numpy as np
from PIL import Image

OUTPUT = Path(__file__).resolve().parents[1] / "public/materials"
OUTPUT.mkdir(exist_ok=True)
SIZE = 512
rng = np.random.default_rng(10222026)
y, x = np.mgrid[0:SIZE, 0:SIZE] / SIZE


def wood(u, v, phase=0):
    # Seamless anisotropic noise gives irregular fibers rather than repeated sine stripes.
    def grain_noise(length, width):
        noise = rng.normal(size=(SIZE, SIZE))
        fx = np.fft.fftfreq(SIZE)[None, :]
        fy = np.fft.fftfreq(SIZE)[:, None]
        blur = np.exp(-2*np.pi**2*((fx*length)**2+(fy*width)**2))
        field = np.fft.ifft2(np.fft.fft2(noise)*blur).real
        return field / field.std()
    broad = grain_noise(70, 13)
    fibers = grain_noise(34, 1.1)
    pores = grain_noise(9, .4)
    # Bend the growth pattern gently across the board, with independent row offsets.
    warp = .012*np.sin(2*np.pi*u + phase) + .007*np.sin(4*np.pi*u)
    rows = np.floor(((v+warp)%1)*SIZE).astype(int)%SIZE
    columns = np.floor(u*SIZE).astype(int)%SIZE
    variation = .065*broad + .035*fibers - .018*np.maximum(0,pores-1)
    return variation[rows,columns]


def save(name, variation, base, seams):
    fine = rng.normal(0, .008, (SIZE, SIZE))
    value = np.clip(1 + variation + fine, .45, 1.35)
    color = np.stack([value*c for c in base], axis=-1)
    color *= (1 - .28*seams[..., None])
    Image.fromarray(np.uint8(np.clip(color,0,255))).save(OUTPUT/f"{name}-color.webp", quality=88, method=6)
    height = np.clip(128 + variation*55 - seams*32, 0, 255)
    roughness = np.clip(190 - variation*65 + seams*25, 0, 255)
    packed = np.stack([height, roughness, np.zeros_like(height)], axis=-1)
    Image.fromarray(np.uint8(packed)).save(OUTPUT/f"{name}-surface.webp", lossless=True, method=6)

save("walnut", wood(x,y), (112,82,57), np.zeros_like(x))
# Four staggered boards per 3 m × 1 m tile. Shallow joints, never black trenches.
row = np.floor(y*4).astype(int)%SIZE
local_y = y*4-row
phase = np.array([.08,.47,.21,.76])[row]
u = (x+phase)%1
variation = wood(u,local_y,phase*6) + np.array([-.04,.035,-.015,.02])[row]
side_seam = np.exp(-np.minimum(local_y,1-local_y)**2/.00012)
end_seam = np.exp(-np.minimum(u,1-u)**2/.000009)
save("floor", variation, (91,77,62), np.maximum(side_seam,end_seam))
for path in OUTPUT.glob("*.webp"):
    print(path.name, path.stat().st_size)
