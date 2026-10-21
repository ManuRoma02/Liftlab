import os
import resvg_py
from PIL import Image

SCRATCH_DIR = r"scripts/scratch"

# Master Full-Color Logo SVG (assets/logo.svg & public/logo.svg)
svg_master = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <!-- Dark Tech Radial Canvas Gradient -->
    <radialGradient id="ll-bg" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#141824" />
      <stop offset="60%" stop-color="#090B10" />
      <stop offset="100%" stop-color="#030406" />
    </radialGradient>

    <!-- Calibrated Olympic Bumper Rubber Rim -->
    <linearGradient id="ll-rim" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#333E52" />
      <stop offset="25%" stop-color="#1E2430" />
      <stop offset="70%" stop-color="#121620" />
      <stop offset="100%" stop-color="#0A0C12" />
    </linearGradient>

    <!-- Recessed Olympic Plate Face -->
    <radialGradient id="ll-face" cx="42%" cy="38%" r="65%">
      <stop offset="0%" stop-color="#1D2433" />
      <stop offset="45%" stop-color="#111622" />
      <stop offset="85%" stop-color="#0A0D14" />
      <stop offset="100%" stop-color="#05070A" />
    </radialGradient>

    <!-- Machined Stainless Steel Collar / Bushing -->
    <linearGradient id="ll-steel" x1="15%" y1="0%" x2="85%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="20%" stop-color="#E2E8F0" />
      <stop offset="48%" stop-color="#94A3B8" />
      <stop offset="75%" stop-color="#475569" />
      <stop offset="100%" stop-color="#1E293B" />
    </linearGradient>

    <!-- High-Voltage Neon Emerald Gradient for L -->
    <linearGradient id="ll-neon" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#55FF94" />
      <stop offset="25%" stop-color="#30D158" />
      <stop offset="75%" stop-color="#059669" />
      <stop offset="100%" stop-color="#047857" />
    </linearGradient>

    <!-- 3D Bevel Facet - Light Edge -->
    <linearGradient id="ll-facet-light" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.55" />
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.08" />
    </linearGradient>

    <!-- 3D Bevel Facet - Dark Edge -->
    <linearGradient id="ll-facet-dark" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#000000" stop-opacity="0.45" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0.12" />
    </linearGradient>

    <!-- Specular Highlight for Top Rim -->
    <linearGradient id="ll-specular" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.35" />
      <stop offset="35%" stop-color="#FFFFFF" stop-opacity="0.05" />
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.0" />
    </linearGradient>

    <!-- Soft Ambient Plate Shadow -->
    <filter id="ll-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="24" flood-color="#000000" flood-opacity="0.85" />
    </filter>

    <!-- High-Energy Neon Glow Filter -->
    <filter id="ll-glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="9" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <!-- Layer 0: Background Canvas -->
  <rect width="512" height="512" fill="url(#ll-bg)" />

  <!-- Layer 1: Ambient Emerald Backlight Halo -->
  <circle cx="256" cy="256" r="198" fill="#30D158" opacity="0.12" filter="url(#ll-glow)" />

  <!-- Layer 2: Master Olympic Bumper Plate Structure -->
  <g filter="url(#ll-shadow)">
    <!-- Outer Heavy Bumper Rubber Rim -->
    <circle cx="256" cy="256" r="194" fill="url(#ll-rim)" stroke="#3E4A60" stroke-width="2.5" />
    
    <!-- Outer Bevel Edge & Specular Highlight -->
    <circle cx="256" cy="256" r="190" fill="none" stroke="url(#ll-specular)" stroke-width="2" />
    <circle cx="256" cy="256" r="187" fill="none" stroke="#30D158" stroke-width="1.2" stroke-opacity="0.45" />

    <!-- Recessed Olympic Face Step (Machined Groove) -->
    <circle cx="256" cy="256" r="158" fill="url(#ll-face)" stroke="#06080B" stroke-width="3.5" />
    <circle cx="256" cy="256" r="156" fill="none" stroke="#2B3648" stroke-width="1.5" />

    <!-- Calibration Grooves & Olympic Track -->
    <circle cx="256" cy="256" r="144" fill="none" stroke="#1B2230" stroke-width="2" />
    <circle cx="256" cy="256" r="140" fill="none" stroke="#41506B" stroke-width="1.5" stroke-dasharray="4 6" stroke-opacity="0.8" />
    <circle cx="256" cy="256" r="136" fill="none" stroke="#171C26" stroke-width="1" />

    <!-- 4 Cardinal Olympic Hash Notches (Calibrated Weight Marks) -->
    <g stroke="#30D158" stroke-width="2.2" stroke-linecap="round" opacity="0.85">
      <line x1="256" y1="64" x2="256" y2="76" />
      <line x1="256" y1="436" x2="256" y2="448" />
      <line x1="64" y1="256" x2="76" y2="256" />
      <line x1="436" y1="256" x2="448" y2="256" />
    </g>

    <!-- Center Stainless Steel Olympic Bushing Collar -->
    <circle cx="256" cy="256" r="72" fill="url(#ll-steel)" stroke="#FFFFFF" stroke-width="1.8" />
    <circle cx="256" cy="256" r="68" fill="none" stroke="#475569" stroke-width="1.2" />
    
    <!-- Inner Hub Recess Chamber -->
    <circle cx="256" cy="256" r="50" fill="#0C0F15" stroke="#1E2838" stroke-width="1.8" />

    <!-- Olympic 50.4mm Bore Hole -->
    <circle cx="256" cy="256" r="30" fill="#030406" stroke="#000000" stroke-width="2.5" />
  </g>

  <!-- Layer 3: Central Athletic Chiseled 'L' Monogram -->
  <!-- Optically Centered and Balanced:
       Vertical Stem: x: 196 to 252, y: 132 to 380
       Horizontal Leg: x: 196 to 352, y: 324 to 380
       Dynamic 45° Chamfered Terminals -->
  <g filter="url(#ll-glow)">
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
      opacity="0.32"
      filter="url(#ll-shadow)"
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
      fill="url(#ll-neon)"
      stroke="#55FF94"
      stroke-width="2"
    />

    <!-- Bevel Facet - Left / Top Highlight -->
    <polygon points="196,152 216,132 216,360 196,380" fill="url(#ll-facet-light)" />
    <polygon points="216,324 352,324 332,344 216,344" fill="url(#ll-facet-light)" />

    <!-- Bevel Facet - Right / Bottom Shade -->
    <polygon points="252,132 252,324 234,324 234,152" fill="url(#ll-facet-dark)" />
    <polygon points="352,324 352,360 332,380 332,344" fill="url(#ll-facet-dark)" />

    <!-- Center Olympic Collar Passthrough Accent:
         A precision circular steel core disc on the hub intersection,
         integrating the plate's center bore with the L -->
    <circle cx="256" cy="256" r="14" fill="#121722" stroke="url(#ll-steel)" stroke-width="2.5" />
    <circle cx="256" cy="256" r="6" fill="#30D158" />

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
    fill="url(#ll-specular)"
    opacity="0.08"
    pointer-events="none"
  />
</svg>"""

# Transparent Glyph Version (assets/logo-glyph.svg)
svg_glyph = svg_master.replace(
  '<rect width="512" height="512" fill="url(#ll-bg)" />',
  '<!-- Transparent Background -->'
)

# Monochrome Silhouette (assets/logo-monochrome.svg)
svg_monochrome = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <g fill="currentColor">
    <!-- Outer Bumper Rim Ring -->
    <circle cx="256" cy="256" r="194" fill="none" stroke="currentColor" stroke-width="20" />
    
    <!-- Inner Calibration Ring -->
    <circle cx="256" cy="256" r="144" fill="none" stroke="currentColor" stroke-width="6" stroke-dasharray="10 12" />

    <!-- Olympic Collar Bushing Ring -->
    <circle cx="256" cy="256" r="72" fill="none" stroke="currentColor" stroke-width="14" />
    <circle cx="256" cy="256" r="30" fill="none" stroke="currentColor" stroke-width="8" />

    <!-- 4 Cardinal Hash Ticks -->
    <line x1="256" y1="64" x2="256" y2="80" stroke="currentColor" stroke-width="8" stroke-linecap="round" />
    <line x1="256" y1="432" x2="256" y2="448" stroke="currentColor" stroke-width="8" stroke-linecap="round" />
    <line x1="64" y1="256" x2="80" y2="256" stroke="currentColor" stroke-width="8" stroke-linecap="round" />
    <line x1="432" y1="256" x2="448" y2="256" stroke="currentColor" stroke-width="8" stroke-linecap="round" />

    <!-- Solid Athletic 'L' Monogram -->
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
    />
  </g>
</svg>"""

# Render Master Preview
png_bytes = resvg_py.svg_to_bytes(svg_string=svg_master, width=1024, height=1024)
master_png_path = os.path.join(SCRATCH_DIR, "logo_final_1024.png")
with open(master_png_path, "wb") as f:
    f.write(png_bytes)
print(f"Generated {master_png_path}")

# Test multiple scales
for sz in [512, 192, 64, 32, 16]:
    png_sz = resvg_py.svg_to_bytes(svg_string=svg_master, width=sz, height=sz)
    out_sz = os.path.join(SCRATCH_DIR, f"logo_final_{sz}.png")
    with open(out_sz, "wb") as f:
        f.write(png_sz)
    print(f"Generated {out_sz}")
