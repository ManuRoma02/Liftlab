import os
import resvg_py
from PIL import Image

OUT_DIR = r"scripts/scratch"
os.makedirs(OUT_DIR, exist_ok=True)

# -------------------------------------------------------------
# Style A: "Linear / Apple Fitness 2026 Minimalist"
# Pure vector geometry. Zero messy bevels or dated filters.
# Deep matte obsidian background, precision calibrated Olympic bumper ring,
# and a monolithic, athletic, high-contrast Emerald "L" glyph.
# -------------------------------------------------------------
svg_2026_a = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <!-- 2026 Modern Deep Obsidian Gradient -->
    <radialGradient id="a-bg" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#111318" />
      <stop offset="70%" stop-color="#08090C" />
      <stop offset="100%" stop-color="#030405" />
    </radialGradient>

    <!-- Vibrant Electric Emerald Gradient (Apple Fitness / Nike Lab) -->
    <linearGradient id="a-emerald" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#34E065" />
      <stop offset="100%" stop-color="#10B981" />
    </linearGradient>

    <!-- Subtle Plate Ring Gradient -->
    <linearGradient id="a-ring" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#2D3340" />
      <stop offset="100%" stop-color="#151820" />
    </linearGradient>
  </defs>

  <!-- Canvas Background -->
  <rect width="512" height="512" rx="112" fill="url(#a-bg)" />

  <!-- Outer Sub-Pixel Chamfer Border -->
  <rect width="510" height="510" x="1" y="1" rx="111" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="2" />

  <!-- Olympic Bumper Plate Calibrated Frame -->
  <!-- Outer rubber profile -->
  <circle cx="256" cy="256" r="184" fill="#0C0E12" stroke="url(#a-ring)" stroke-width="4" />
  
  <!-- Subtle Olympic Step-Down Groove -->
  <circle cx="256" cy="256" r="156" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="2" />
  <circle cx="256" cy="256" r="150" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1" stroke-dasharray="3 5" />

  <!-- 4 Cardinal Olympic Notches (calibrated weight indicators) -->
  <circle cx="256" cy="76" r="3.5" fill="#30D158" />
  <circle cx="256" cy="436" r="3.5" fill="#30D158" />
  <circle cx="76" cy="256" r="3.5" fill="#30D158" />
  <circle cx="436" cy="256" r="3.5" fill="#30D158" />

  <!-- Center Bore Accent (Olympic 50.4mm Aperture Ring) -->
  <circle cx="256" cy="256" r="48" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="2" />
  <circle cx="256" cy="256" r="24" fill="#060709" stroke="rgba(255,255,255,0.08)" stroke-width="1.5" />

  <!-- The Architectural 2026 'L' Glyph -->
  <!-- Monolithic, bold, perfectly balanced athletic geometry with 45° chamfers -->
  <path d="
    M 204, 140
    C 204, 134 208, 130 214, 130
    L 254, 130
    C 260, 130 264, 134 264, 140
    L 264, 318
    L 346, 318
    C 352, 318 356, 322 356, 328
    L 356, 368
    C 356, 374 352, 378 346, 378
    L 214, 378
    C 208, 378 204, 374 204, 368
    Z"
    fill="url(#a-emerald)"
  />

  <!-- High-Tech Optical Split Accent (A clean 4px white surgical gap cutting the corner for precision) -->
  <circle cx="204" cy="378" r="3" fill="#FFFFFF" />
  <circle cx="356" cy="318" r="3" fill="#FFFFFF" />
  <circle cx="264" cy="130" r="3" fill="#FFFFFF" />
</svg>"""

# -------------------------------------------------------------
# Style B: "Teenage Engineering / High-Precision Athletic Lab"
# Bold, iconic, Bauhaus/Swiss precision.
# An Olympic Plate where the "L" IS the negative/positive cutout of the plate.
# Incredibly striking, modern, iconic at 16px, instantly recognizable.
# -------------------------------------------------------------
svg_2026_b = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <radialGradient id="b-bg" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#12151D" />
      <stop offset="100%" stop-color="#050608" />
    </radialGradient>
    <linearGradient id="b-lime" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#55FF94" />
      <stop offset="50%" stop-color="#30D158" />
      <stop offset="100%" stop-color="#10B981" />
    </linearGradient>
  </defs>

  <!-- Deep Obsidian Rounded Base -->
  <rect width="512" height="512" rx="116" fill="url(#b-bg)" />
  <rect width="510" height="510" x="1" y="1" rx="115" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="2" />

  <!-- Olympic Disc Silhouette -->
  <!-- Matte Dark Plate Body -->
  <circle cx="256" cy="256" r="180" fill="#090B0E" stroke="rgba(255,255,255,0.12)" stroke-width="3" />
  
  <!-- Outer Calibration Index Ring (Eleiko/Rogue 2026) -->
  <circle cx="256" cy="256" r="152" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1.5" />
  
  <!-- Precision Angle Hash Marks -->
  <g stroke="#30D158" stroke-width="3" stroke-linecap="round">
    <line x1="256" y1="80" x2="256" y2="92" />
    <line x1="256" y1="420" x2="256" y2="432" />
    <line x1="80" y1="256" x2="92" y2="256" />
    <line x1="420" y1="256" x2="432" y2="256" />
  </g>

  <!-- Modern Dual-Segment Architectural Monogram 'L' -->
  <!-- Segment 1: The Powerful Vertical Plate Column (with rounded dynamic capsule) -->
  <rect x="200" y="128" width="56" height="240" rx="28" fill="url(#b-lime)" />

  <!-- Segment 2: The Calibrated Barbell Base Arm (overlapping at 90°) -->
  <rect x="200" y="312" width="156" height="56" rx="28" fill="url(#b-lime)" />

  <!-- Center Precision Aperture (White Core Pin) -->
  <circle cx="228" cy="340" r="10" fill="#090B0E" stroke="#FFFFFF" stroke-width="4" />
</svg>"""

# -------------------------------------------------------------
# Style C: "Minimalist Monogram Mark" (Linear / Nothing OS / Tesla App style)
# The ultimate timeless reduction:
# A circular Olympic bumper plate contour that seamlessly merges
# into a sculptural 'L' in one continuous stroke.
# -------------------------------------------------------------
svg_2026_c = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <radialGradient id="c-bg" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#141720" />
      <stop offset="60%" stop-color="#0A0C10" />
      <stop offset="100%" stop-color="#040507" />
    </radialGradient>
    <linearGradient id="c-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4EFA87" />
      <stop offset="40%" stop-color="#30D158" />
      <stop offset="100%" stop-color="#059669" />
    </linearGradient>
  </defs>

  <rect width="512" height="512" rx="116" fill="url(#c-bg)" />
  <rect width="510" height="510" x="1" y="1" rx="115" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="2" />

  <!-- The Olympic Plate Ring -->
  <circle cx="256" cy="256" r="182" fill="#080A0D" stroke="#232A38" stroke-width="3" />
  <circle cx="256" cy="256" r="176" fill="none" stroke="rgba(48,209,88,0.3)" stroke-width="1.5" />
  <circle cx="256" cy="256" r="148" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1" stroke-dasharray="4 6" />

  <!-- Olympic Hub Ring -->
  <circle cx="256" cy="256" r="44" fill="#0C0E13" stroke="rgba(255,255,255,0.12)" stroke-width="2" />
  <circle cx="256" cy="256" r="22" fill="#040506" stroke="rgba(255,255,255,0.06)" stroke-width="1.5" />

  <!-- Pure Modern Athletic 'L' Glyph -->
  <!-- Razor sharp, clean, geometric, no bevels, high contrast -->
  <path d="
    M 210, 136
    L 258, 136
    L 258, 316
    L 350, 316
    L 350, 364
    L 210, 364
    Z"
    fill="url(#c-grad)"
  />

  <!-- Subtle Specular Inset Line -->
  <path d="
    M 218, 144
    L 218, 356
    L 342, 356"
    fill="none"
    stroke="#FFFFFF"
    stroke-width="2.5"
    stroke-linecap="square"
    stroke-opacity="0.85"
  />
</svg>"""

for name, code in [("2026_a", svg_2026_a), ("2026_b", svg_2026_b), ("2026_c", svg_2026_c)]:
    png = resvg_py.svg_to_bytes(svg_string=code, width=1024, height=1024)
    path = os.path.join(OUT_DIR, f"logo_{name}.png")
    with open(path, "wb") as f:
        f.write(png)
    print(f"Generated {path}")
