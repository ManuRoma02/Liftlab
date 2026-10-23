import os
import resvg_py

SCRATCH_DIR = os.path.join(os.path.dirname(__file__), "scratch")

# Concept V5: Optically Centered Olympic Bumper Plate with Precision Athletic 'L'
# No competing second hole! The plate is the calibrated Olympic frame,
# and the "L" is an athletic, chiseled emerald centerpiece with perfect optical balance.
svg_v5 = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <!-- Background Canvas -->
    <radialGradient id="v5-bg" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#141824" />
      <stop offset="55%" stop-color="#080A0F" />
      <stop offset="100%" stop-color="#020305" />
    </radialGradient>

    <!-- Outer Bumper Rubber Bevel -->
    <linearGradient id="v5-rim" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2D3546" />
      <stop offset="30%" stop-color="#181D27" />
      <stop offset="70%" stop-color="#0F1219" />
      <stop offset="100%" stop-color="#07090D" />
    </linearGradient>

    <!-- Recessed Face of Plate -->
    <radialGradient id="v5-plate-face" cx="42%" cy="38%" r="65%">
      <stop offset="0%" stop-color="#1C2230" />
      <stop offset="50%" stop-color="#11151E" />
      <stop offset="100%" stop-color="#080A0E" />
    </radialGradient>

    <!-- High-Voltage Neon Emerald Gradient -->
    <linearGradient id="v5-neon" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#55FF94" />
      <stop offset="25%" stop-color="#30D158" />
      <stop offset="75%" stop-color="#059669" />
      <stop offset="100%" stop-color="#047857" />
    </linearGradient>

    <!-- Chiseled Facet Light (Left/Top bevel of L) -->
    <linearGradient id="v5-facet-light" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.45" />
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.05" />
    </linearGradient>

    <!-- Chiseled Facet Dark (Right/Bottom bevel of L) -->
    <linearGradient id="v5-facet-dark" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#000000" stop-opacity="0.4" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0.1" />
    </linearGradient>

    <!-- Metallic Rim Highlight -->
    <linearGradient id="v5-rim-sheen" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.28" />
      <stop offset="40%" stop-color="#FFFFFF" stop-opacity="0.04" />
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.0" />
    </linearGradient>

    <!-- Olympic Steel Collar Track -->
    <linearGradient id="v5-steel" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#CBD5E1" />
      <stop offset="50%" stop-color="#64748B" />
      <stop offset="100%" stop-color="#334155" />
    </linearGradient>

    <!-- Drop Shadow for Disc -->
    <filter id="v5-disc-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="24" flood-color="#000000" flood-opacity="0.85" />
    </filter>

    <!-- Neon Glow Filter -->
    <filter id="v5-glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="9" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <!-- Background Canvas -->
  <rect width="512" height="512" fill="url(#v5-bg)" />

  <!-- Ambient Emerald Underglow -->
  <circle cx="256" cy="256" r="195" fill="#30D158" opacity="0.10" />

  <!-- Master Olympic Bumper Plate -->
  <g filter="url(#v5-disc-shadow)">
    <!-- Heavy Rubber Rim -->
    <circle cx="256" cy="256" r="192" fill="url(#v5-rim)" stroke="#333D4F" stroke-width="2.5" />
    <circle cx="256" cy="256" r="188" fill="none" stroke="url(#v5-rim-sheen)" stroke-width="1.5" />
    <circle cx="256" cy="256" r="186" fill="none" stroke="#30D158" stroke-width="1" stroke-opacity="0.35" />

    <!-- Recessed Plate Face Step -->
    <circle cx="256" cy="256" r="156" fill="url(#v5-plate-face)" stroke="#06080B" stroke-width="3" />
    <circle cx="256" cy="256" r="154" fill="none" stroke="#252F3F" stroke-width="1.2" />

    <!-- Olympic Calibration Grooves & Ticks -->
    <circle cx="256" cy="256" r="142" fill="none" stroke="#1E2634" stroke-width="2" />
    <circle cx="256" cy="256" r="138" fill="none" stroke="#38455A" stroke-width="1.2" stroke-dasharray="4 6" stroke-opacity="0.75" />
    <circle cx="256" cy="256" r="134" fill="none" stroke="#1A212E" stroke-width="1" />

    <!-- 4 Cardinal Olympic Hash Notches -->
    <g stroke="#30D158" stroke-width="2" stroke-linecap="round" opacity="0.8">
      <line x1="256" y1="68" x2="256" y2="78" />
      <line x1="256" y1="434" x2="256" y2="444" />
      <line x1="68" y1="256" x2="78" y2="256" />
      <line x1="434" y1="256" x2="444" y2="256" />
    </g>

    <!-- Inner Metallic Collar Track -->
    <circle cx="256" cy="256" r="92" fill="none" stroke="url(#v5-steel)" stroke-width="1.5" stroke-opacity="0.4" />
    <circle cx="256" cy="256" r="90" fill="none" stroke="#131822" stroke-width="1" />
  </g>

  <!-- Central Athletic Chiseled 'L' Monogram -->
  <!-- Optically centered around the disc:
       Vertical stem spans x: 196 -> 248, y: 136 -> 376
       Horizontal foot spans x: 196 -> 348, y: 324 -> 376
       Visual bounding box: 152 wide x 240 high, centered around cx=256, cy=256! -->
  <g filter="url(#v5-glow)">
    <!-- Ambient Neon Shadow Under L -->
    <path d="
      M 196, 136
      L 248, 136
      L 248, 324
      L 348, 324
      L 348, 376
      L 196, 376
      Z"
      fill="#30D158"
      opacity="0.3"
      filter="url(#v5-disc-shadow)"
    />

    <!-- Main Solid Neon Emerald Body with 45° Chamfered Terminals -->
    <path d="
      M 214, 136
      L 248, 136
      L 248, 324
      L 348, 324
      L 348, 358
      L 330, 376
      L 196, 376
      L 196, 154
      Z"
      fill="url(#v5-neon)"
      stroke="#55FF94"
      stroke-width="2"
    />

    <!-- Bevel Facet - Left / Top Highlight -->
    <polygon points="196,154 214,136 214,358 196,376" fill="url(#v5-facet-light)" />
    <polygon points="214,324 348,324 330,342 214,342" fill="url(#v5-facet-light)" />

    <!-- Bevel Facet - Right / Bottom Shade -->
    <polygon points="248,136 248,324 232,324 232,154" fill="url(#v5-facet-dark)" />
    <polygon points="348,324 348,358 330,376 330,342" fill="url(#v5-facet-dark)" />

    <!-- Specular Blade Core (High-Precision Center Line) -->
    <path d="
      M 222, 150
      L 222, 350
      L 334, 350"
      fill="none"
      stroke="#FFFFFF"
      stroke-width="4.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      opacity="0.95"
    />

    <!-- Ultra-Thin Crystal Core Fiber -->
    <path d="
      M 222, 154
      L 222, 350
      L 330, 350"
      fill="none"
      stroke="#FFFFFF"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    />

    <!-- Tech Precision Dots on the L Terminals -->
    <circle cx="222" cy="144" r="3.2" fill="#FFFFFF" />
    <circle cx="340" cy="350" r="3.2" fill="#FFFFFF" />
  </g>

  <!-- Modern Apple HIG Specular Sheen on Top of Disc -->
  <path d="
    M 100, 200
    A 192, 192 0 0, 1 412, 200
    A 192, 145 0 0, 0 100, 200
    Z"
    fill="url(#v5-rim-sheen)"
    opacity="0.08"
    pointer-events="none"
  />
</svg>"""

# Render and save V5
png_bytes = resvg_py.svg_to_bytes(svg_string=svg_v5, width=1024, height=1024)
out_path = os.path.join(SCRATCH_DIR, "logo_v5.png")
with open(out_path, "wb") as f:
    f.write(png_bytes)
print(f"Generated {out_path}")
