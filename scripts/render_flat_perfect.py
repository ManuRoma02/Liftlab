import os
import resvg_py
from PIL import Image

OUT_DIR = os.path.join(os.path.dirname(__file__), "scratch")

svg_flat_perfect = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <!-- Deep Obsidian Background -->
  <rect width="512" height="512" rx="116" fill="#090A0E" />

  <!-- Calibrated Olympic Bumper Rim -->
  <circle cx="256" cy="256" r="186" fill="none" stroke="#222733" stroke-width="8" />
  <circle cx="256" cy="256" r="154" fill="none" stroke="#161A22" stroke-width="3" stroke-dasharray="6 8" />

  <!-- 4 Cardinal Olympic Notches -->
  <rect x="253" y="58" width="6" height="24" rx="3" fill="#30D158" />
  <rect x="253" y="430" width="6" height="24" rx="3" fill="#30D158" />
  <rect x="58" y="253" width="24" height="6" rx="3" fill="#30D158" />
  <rect x="430" y="253" width="24" height="6" rx="3" fill="#30D158" />

  <!-- Mathematically Centered Architectural Olympic 'L' (Bounding Box 176..336, 136..376) -->
  <path d="
    M 196, 136
    L 236, 136
    L 236, 316
    L 336, 316
    L 336, 356
    L 316, 376
    L 176, 376
    L 176, 156
    Z"
    fill="#30D158"
  />
</svg>"""

png_bytes = resvg_py.svg_to_bytes(svg_string=svg_flat_perfect, width=1024, height=1024)
out_path = os.path.join(OUT_DIR, "logo_flat_perfect.png")
with open(out_path, "wb") as f:
    f.write(png_bytes)
print(f"Generated {out_path}")
