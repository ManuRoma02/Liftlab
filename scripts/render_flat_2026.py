import os
import resvg_py

OUT_DIR = os.path.join(os.path.dirname(__file__), "scratch")
os.makedirs(OUT_DIR, exist_ok=True)

# -------------------------------------------------------------
# Flat Design 1: "The Calibrated Olympic Monogram"
# Pure flat geometry. Solid obsidian background (#090A0E).
# Bold, unshaded electric emerald (#30D158) athletic "L" with 45° surgical chamfers,
# framed by a calibrated Olympic bumper ring with 4 cardinal notches.
# -------------------------------------------------------------
svg_flat_1 = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <!-- Deep Obsidian Background -->
  <rect width="512" height="512" rx="116" fill="#090A0E" />

  <!-- Calibrated Olympic Bumper Rim (Pure Flat Line-Art) -->
  <circle cx="256" cy="256" r="184" fill="none" stroke="#1E232E" stroke-width="12" />
  <circle cx="256" cy="256" r="152" fill="none" stroke="#141820" stroke-width="4" stroke-dasharray="8 8" />

  <!-- 4 Cardinal Olympic Notches (Solid Emerald) -->
  <rect x="252" y="58" width="8" height="28" rx="4" fill="#30D158" />
  <rect x="252" y="426" width="8" height="28" rx="4" fill="#30D158" />
  <rect x="58" y="252" width="28" height="8" rx="4" fill="#30D158" />
  <rect x="426" y="252" width="28" height="8" rx="4" fill="#30D158" />

  <!-- Solid Architectural 'L' Monogram (Pure Emerald #30D158) -->
  <path d="
    M 216, 136
    L 256, 136
    L 256, 316
    L 356, 316
    L 356, 356
    L 336, 376
    L 196, 376
    L 196, 156
    Z"
    fill="#30D158"
  />

  <!-- Surgical 45° White Precision Accent Pin -->
  <circle cx="256" cy="256" r="8" fill="#FFFFFF" />
</svg>"""

# -------------------------------------------------------------
# Flat Design 2: "The Linear / Dynamic Overload L"
# Two monolithic, clean athletic bars forming the L with clean geometric fillets,
# concentric Olympic ring background. Super clean, like Linear or Nike Training.
# -------------------------------------------------------------
svg_flat_2 = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <rect width="512" height="512" rx="116" fill="#090A0E" />

  <!-- Olympic Ring Profile (Dual Precision Rings) -->
  <circle cx="256" cy="256" r="186" fill="none" stroke="#262D3B" stroke-width="6" />
  <circle cx="256" cy="256" r="148" fill="none" stroke="#161B24" stroke-width="3" />

  <!-- 4 Precision Ticks -->
  <circle cx="256" cy="70" r="5" fill="#30D158" />
  <circle cx="256" cy="442" r="5" fill="#30D158" />
  <circle cx="70" cy="256" r="5" fill="#30D158" />
  <circle cx="442" cy="256" r="5" fill="#30D158" />

  <!-- Monolithic Athletic 'L' Monogram -->
  <!-- Perfectly proportioned, bold, solid, zero noise -->
  <path d="
    M 196, 136
    L 252, 136
    L 252, 320
    L 356, 320
    L 356, 376
    L 196, 376
    Z"
    fill="#30D158"
  />

  <!-- High-Contrast Clean White Corner Line (Subtle Graphic Identity) -->
  <path d="
    M 212, 152
    L 212, 360
    L 340, 360"
    fill="none"
    stroke="#FFFFFF"
    stroke-width="8"
    stroke-linecap="square"
  />
</svg>"""

# -------------------------------------------------------------
# Flat Design 3: "The Pure Minimalist Monolith" (Nike / Apple Aesthetic)
# Ultra-clean: Solid dark plate (#11141A) inside the squircle,
# with a razor-sharp, geometric, solid Emerald 'L' that cuts through cleanly.
# 100% timeless, zero gradients, 100% scalable from 16px to 1024px.
# -------------------------------------------------------------
svg_flat_3 = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <rect width="512" height="512" rx="116" fill="#090A0E" />

  <!-- Subtle Olympic Bumper Disc Base -->
  <circle cx="256" cy="256" r="182" fill="#12161F" />
  <circle cx="256" cy="256" r="182" fill="none" stroke="#252D3D" stroke-width="4" />
  <circle cx="256" cy="256" r="144" fill="none" stroke="#1A202C" stroke-width="2" stroke-dasharray="6 6" />

  <!-- Center Olympic Bore Hole (Negative Space) -->
  <circle cx="256" cy="256" r="32" fill="#090A0E" />

  <!-- Pure Geometric Athletic 'L' -->
  <!-- Crisp, bold, solid Emerald (#30D158) -->
  <path d="
    M 192, 132
    H 252
    V 316
    H 356
    V 376
    H 192
    Z"
    fill="#30D158"
  />
</svg>"""

# -------------------------------------------------------------
# Flat Design 4: "The Precision Geometric Stencil L" (Teenage Engineering / Linear)
# Independent vertical plate blade + horizontal bar blade with a 12px surgical gap.
# Incredibly modern, high-tech, athletic.
# -------------------------------------------------------------
svg_flat_4 = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <rect width="512" height="512" rx="116" fill="#090A0E" />

  <!-- Outer Bumper Rim -->
  <circle cx="256" cy="256" r="184" fill="none" stroke="#222938" stroke-width="4" />
  
  <!-- 4 Cardinal Olympic Marks -->
  <circle cx="256" cy="72" r="4" fill="#30D158" />
  <circle cx="256" cy="440" r="4" fill="#30D158" />
  <circle cx="72" cy="256" r="4" fill="#30D158" />
  <circle cx="440" cy="256" r="4" fill="#30D158" />

  <!-- Stencil Segment 1: Vertical Column (representing the vertical plate) -->
  <rect x="196" y="132" width="56" height="244" rx="12" fill="#30D158" />

  <!-- Stencil Segment 2: Horizontal Base (representing the bar sleeve) -->
  <rect x="264" y="320" width="100" height="56" rx="12" fill="#30D158" />

  <!-- Precision Center Point -->
  <circle cx="224" cy="348" r="8" fill="#090A0E" />
</svg>"""

for name, code in [("flat_1", svg_flat_1), ("flat_2", svg_flat_2), ("flat_3", svg_flat_3), ("flat_4", svg_flat_4)]:
    png = resvg_py.svg_to_bytes(svg_string=code, width=1024, height=1024)
    path = os.path.join(OUT_DIR, f"logo_{name}.png")
    with open(path, "wb") as f:
        f.write(png)
    print(f"Generated {path}")
