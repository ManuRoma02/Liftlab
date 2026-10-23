import os
import resvg_py
from PIL import Image

SCRATCH_DIR = os.path.dirname(__file__)
OUT_DIR = os.path.join(os.path.dirname(__file__), "scratch")

svg_v7 = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <!-- Background Canvas Gradient -->
    <radialGradient id="v7-bg" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#141724" />
      <stop offset="55%" stop-color="#08090E" />
      <stop offset="100%" stop-color="#020305" />
    </radialGradient>

    <!-- Calibrated Olympic Bumper Rubber Rim -->
    <linearGradient id="v7-rim" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#364257" />
      <stop offset="25%" stop-color="#1F2634" />
      <stop offset="70%" stop-color="#121620" />
      <stop offset="100%" stop-color="#0A0C12" />
    </linearGradient>

    <!-- Recessed Olympic Plate Face -->
    <radialGradient id="v7-face" cx="42%" cy="38%" r="65%">
      <stop offset="0%" stop-color="#1B2232" />
      <stop offset="45%" stop-color="#111623" />
      <stop offset="85%" stop-color="#090B10" />
      <stop offset="100%" stop-color="#050608" />
    </radialGradient>

    <!-- High-Voltage Neon Emerald Gradient -->
    <linearGradient id="v7-neon" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#55FF94" />
      <stop offset="22%" stop-color="#30D158" />
      <stop offset="75%" stop-color="#059669" />
      <stop offset="100%" stop-color="#047857" />
    </linearGradient>

    <!-- 3D Bevel Facet - Light Edge -->
    <linearGradient id="v7-facet-light" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.65" />
      <stop offset="60%" stop-color="#FFFFFF" stop-opacity="0.15" />
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.04" />
    </linearGradient>

    <!-- 3D Bevel Facet - Dark Edge -->
    <linearGradient id="v7-facet-dark" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#000000" stop-opacity="0.5" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0.15" />
    </linearGradient>

    <!-- Outer Rim Specular Highlight -->
    <linearGradient id="v7-specular" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.45" />
      <stop offset="30%" stop-color="#FFFFFF" stop-opacity="0.08" />
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.0" />
    </linearGradient>

    <!-- Drop Shadow Filter for Plate -->
    <filter id="v7-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="24" flood-color="#000000" flood-opacity="0.9" />
    </filter>

    <!-- Neon Bloom Filter -->
    <filter id="v7-glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <!-- Background Canvas -->
  <rect width="512" height="512" fill="url(#v7-bg)" />

  <!-- Ambient Emerald Underglow -->
  <circle cx="256" cy="256" r="200" fill="#30D158" opacity="0.12" filter="url(#v7-glow)" />

  <!-- Master Olympic Bumper Plate Structure -->
  <g filter="url(#v7-shadow)">
    <!-- Heavy Rubber Bumper Rim -->
    <circle cx="256" cy="256" r="194" fill="url(#v7-rim)" stroke="#3E4C63" stroke-width="2.5" />
    
    <!-- Outer Specular Bevel Edge -->
    <circle cx="256" cy="256" r="190" fill="none" stroke="url(#v7-specular)" stroke-width="2" />
    <circle cx="256" cy="256" r="187" fill="none" stroke="#30D158" stroke-width="1.2" stroke-opacity="0.4" />

    <!-- Recessed Olympic Face Step -->
    <circle cx="256" cy="256" r="158" fill="url(#v7-face)" stroke="#06080B" stroke-width="3.5" />
    <circle cx="256" cy="256" r="155" fill="none" stroke="#2B3648" stroke-width="1.5" />

    <!-- Olympic Calibration Grooves -->
    <circle cx="256" cy="256" r="142" fill="none" stroke="#1A222F" stroke-width="2" />
    <circle cx="256" cy="256" r="138" fill="none" stroke="#3F4F68" stroke-width="1.4" stroke-dasharray="4 6" stroke-opacity="0.75" />
    <circle cx="256" cy="256" r="134" fill="none" stroke="#161B24" stroke-width="1" />

    <!-- 4 Cardinal Olympic Hash Notches -->
    <g stroke="#30D158" stroke-width="2.5" stroke-linecap="round" opacity="0.85">
      <line x1="256" y1="64" x2="256" y2="76" />
      <line x1="256" y1="436" x2="256" y2="448" />
      <line x1="64" y1="256" x2="76" y2="256" />
      <line x1="436" y1="256" x2="448" y2="256" />
    </g>

    <!-- Calibrated Concentric Micro-Tracks (Precision Lab Aesthetic) -->
    <circle cx="256" cy="256" r="92" fill="none" stroke="#242E40" stroke-width="1.2" stroke-dasharray="2 4" stroke-opacity="0.5" />
    <circle cx="256" cy="256" r="88" fill="none" stroke="#151A24" stroke-width="1" />
  </g>

  <!-- Central Athletic Chiseled 'L' Monogram -->
  <!-- Bold, Athletic, Balanced, Zero Ambiguity -->
  <g filter="url(#v7-glow)">
    <!-- Neon Drop Shadow Under L -->
    <path d="
      M 196, 132
      L 252, 132
      L 252, 324
      L 352, 324
      L 352, 380
      L 196, 380
      Z"
      fill="#30D158"
      opacity="0.35"
      filter="url(#v7-shadow)"
    />

    <!-- Main Solid Neon Emerald Body with 45° Chamfered Terminals -->
    <path d="
      M 216, 132
      L 252, 132
      L 252, 324
      L 352, 324
      L 352, 360
      L 332, 380
      L 196, 380
      L 196, 152
      Z"
      fill="url(#v7-neon)"
      stroke="#55FF94"
      stroke-width="2"
    />

    <!-- 3D Bevel Facets -->
    <polygon points="196,152 216,132 216,360 196,380" fill="url(#v7-facet-light)" />
    <polygon points="216,324 352,324 332,344 216,344" fill="url(#v7-facet-light)" />

    <polygon points="252,132 252,324 234,324 234,152" fill="url(#v7-facet-dark)" />
    <polygon points="352,324 352,360 332,380 332,344" fill="url(#v7-facet-dark)" />

    <!-- Specular Blade Core (High-Precision Center Line) -->
    <path d="
      M 226, 146
      L 226, 352
      L 338, 352"
      fill="none"
      stroke="#FFFFFF"
      stroke-width="4.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      opacity="0.95"
    />

    <!-- Ultra-Thin Crystal Core Fiber -->
    <path d="
      M 226, 150
      L 226, 352
      L 334, 352"
      fill="none"
      stroke="#FFFFFF"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    />

    <!-- Precision Accent Dots on the L Terminals -->
    <circle cx="226" cy="140" r="3.2" fill="#FFFFFF" />
    <circle cx="344" cy="352" r="3.2" fill="#FFFFFF" />
  </g>

  <!-- Modern Subtle Top Rim Specular Sheen -->
  <path d="
    M 96, 200
    A 194, 194 0 0, 1 416, 200
    A 194, 144 0 0, 0 96, 200
    Z"
    fill="url(#v7-specular)"
    opacity="0.08"
    pointer-events="none"
  />
</svg>"""

png_bytes = resvg_py.svg_to_bytes(svg_string=svg_v7, width=1024, height=1024)
out_path = os.path.join(OUT_DIR, "logo_v7_clean.png")
with open(out_path, "wb") as f:
    f.write(png_bytes)
print(f"Generated {out_path}")
