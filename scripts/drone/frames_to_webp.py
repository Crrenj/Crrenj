"""Assembles PNG frames into a looping animated WebP.  usage: frames_to_webp.py <framesDir> <out.webp> [fps]"""
import glob, os, sys
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
fps = float(sys.argv[3]) if len(sys.argv) > 3 else 15
frames = [Image.open(f).convert("RGBA") for f in sorted(glob.glob(os.path.join(src, "f*.png")))]
frames[0].save(out, save_all=True, append_images=frames[1:], duration=round(1000 / fps), loop=0,
               quality=78, method=6, minimize_size=True)
print(out, len(frames), "frames", os.path.getsize(out) // 1024, "kB")
