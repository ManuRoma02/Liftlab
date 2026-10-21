import os
import resvg_py

SCRATCH_DIR = r"scripts/scratch"

# -------------------------------------------------------------
# Concept V2: Frontal Olympic Bumper Plate with Chiseled Athletic "L"
# No accidental 'b'! The "L" is a bold, modern geometric glyph
# with a solid faceted structure, chamfered 45° cuts, and a central
# steel collar that acts as the focal anchor rather than an off-center eye.
# -------------------------------------------------------------
svg_v2 = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <radialGradient id="v2-bg" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#141824" />
      <stop offset="65%" stop-color="#080A0E" />
      <stop offset="100%" stop-color="#030406" />
    </radialGradient>

    <linearGradient id="v2-rim" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2D3647" />
      <stop offset="30%" stop-color="#181D26" />
      <stop offset="70%" stop-color="#10131B" />
      <stop offset="100%" stop-color="#0A0C10" />
    </linearGradient>

    <radialGradient id="v2-face" cx="45%" cy="40%" r="65%">
      <stop offset="0%" stop-color="#1A202C" />
      <stop offset="55%" stop-color="#10131A" />
      <stop offset="100%" stop-color="#07080C" />
    </radialGradient>

    <linearGradient id="v2-steel" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="25%" stop-color="#E2E8F0" />
      <stop offset="50%" stop-color="#94A3B8" />
      <stop offset="75%" stop-color="#475569" />
      <stop offset="100%" stop-color="#1E293B" />
    </linearGradient>

    <linearGradient id="v2-neon" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#55FF94" />
      <stop offset="25%" stop-color="#30D158" />
      <stop offset="80%" stop-color="#059669" />
      <stop offset="100%" stop-color="#047857" />
    </linearGradient>

    <linearGradient id="v2-accent-glow" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.9" />
      <stop offset="100%" stop-color="#30D158" stop-opacity="0.3" />
    </linearGradient>

    <filter id="v2-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#000000" flood-opacity="0.8" />
    </filter>

    <filter id="v2-glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="10" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <!-- Background Canvas -->
  <rect width="512" height="512" fill="url(#v2-bg)" />

  <!-- Ambient Light Halo -->
  <circle cx="256" cy="256" r="200" fill="#30D158" opacity="0.12" filter="url(#v2-glow)" />

  <!-- Olympic Plate Body -->
  <g filter="url(#v2-shadow)">
    <!-- Bumper Plate Outer Ring -->
    <circle cx="256" cy="256" r="192" fill="url(#v2-rim)" stroke="#384459" stroke-width="2.5" />
    <circle cx="256" cy="256" r="188" fill="none" stroke="#FFFFFF" stroke-opacity="0.1" stroke-width="1.5" />
    <circle cx="256" cy="256" r="186" fill="none" stroke="#30D158" stroke-opacity="0.35" stroke-width="1.2" />

    <!-- Recessed Plate Face -->
    <circle cx="256" cy="256" r="154" fill="url(#v2-face)" stroke="#06080B" stroke-width="3" />

    <!-- Calibration Grooves -->
    <circle cx="256" cy="256" r="142" fill="none" stroke="#252D3C" stroke-width="1.5" />
    <circle cx="256" cy="256" r="138" fill="none" stroke="#374357" stroke-width="1.2" stroke-dasharray="4 6" stroke-opacity="0.6" />

    <!-- Stainless Steel Olympic Bushing -->
    <circle cx="256" cy="256" r="70" fill="url(#v2-steel)" stroke="#F8FAFC" stroke-width="2" />
    <circle cx="256" cy="256" r="66" fill="none" stroke="#475569" stroke-width="1" />
    <circle cx="256" cy="256" r="50" fill="#0A0D13" stroke="#1E2736" stroke-width="2" />
    <circle cx="256" cy="256" r="30" fill="#020304" stroke="#000000" stroke-width="2" />
  </g>

  <!-- Chiseled Athletic Monogram 'L' -->
  <!-- A powerful, solid geometric letterform with 45° chamfers, overlapping the plate like a high-tech badge -->
  <g filter="url(#v2-glow)">
    <!-- Soft Neon Underglow -->
    <path d="
      M 166, 134
      L 220, 134
      L 220, 314
      L 348, 314
      L 348, 368
      L 166, 368
      Z"
      fill="#30D158"
      opacity="0.3"
    />

    <!-- Solid Emerald Body with 45° Chamfered Corners -->
    <path d="
      M 184, 134
      L 220, 134
      L 220, 314
      L 348, 314
      L 348, 350
      L 330, 368
      L 166, 368
      L 166, 152
      Z"
      fill="url(#v2-neon)"
      stroke="#55FF94"
      stroke-width="2.5"
    />

    <!-- Specular Blade Accent (Inner Light Stroke) -->
    <path d="
      M 193, 148
      L 193, 339
      L 330, 339"
      fill="none"
      stroke="url(#v2-accent-glow)"
      stroke-width="5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    
    <!-- Fine White Core Fiber -->
    <path d="
      M 193, 152
      L 193, 339
      L 326, 339"
      fill="none"
      stroke="#FFFFFF"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      opacity="0.9"
    />

    <!-- Tech Precision Dots on the L -->
    <circle cx="193" cy="142" r="3" fill="#FFFFFF" />
    <circle cx="340" cy="339" r="3" fill="#FFFFFF" />
  </g>

  <!-- Calibrated Weight Hash Ticks around Plate Rim -->
  <g stroke="#30D158" stroke-width="2" opacity="0.75">
    <line x1="256" y1="64" x2="256" y2="74" />
    <line x1="256" y1="438" x2="256" y2="448" />
    <line x1="64" y1="256" x2="74" y2="256" />
    <line x1="438" y1="256" x2="448" y2="256" />
  </g>
</svg>"""

# -------------------------------------------------------------
# Concept V3: Pure Modern Minimalist "Olympic Core"
# The Plate itself IS sculpted: a pure dark titanium plate where
# the letter "L" is an ultra-clean, Apple HIG style negative/positive
# space cut, perfectly balanced, no clutter, timeless luxury.
# -------------------------------------------------------------
svg_v3 = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <radialGradient id="v3-bg" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#121620" />
      <stop offset="60%" stop-color="#080A0E" />
      <stop offset="100%" stop-color="#020304" />
    </radialGradient>

    <radialGradient id="v3-disc" cx="35%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#222834" />
      <stop offset="45%" stop-color="#141822" />
      <stop offset="85%" stop-color="#0C0E14" />
      <stop offset="100%" stop-color="#07080B" />
    </radialGradient>

    <linearGradient id="v3-neon" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#55FF94" />
      <stop offset="40%" stop-color="#30D158" />
      <stop offset="100%" stop-color="#059669" />
    </linearGradient>

    <linearGradient id="v3-rim-light" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.25" />
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.0" />
    </linearGradient>

    <filter id="v3-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="20" stdDeviation="28" flood-color="#000000" flood-opacity="0.85" />
    </filter>

    <filter id="v3-bloom" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="512" height="512" fill="url(#v3-bg)" />

  <!-- Ambient Glow -->
  <circle cx="256" cy="256" r="185" fill="#30D158" opacity="0.10" />

  <!-- Main Olympic Bumper Disc -->
  <g filter="url(#v3-shadow)">
    <!-- Heavy Rubber Bumper Outer Profile -->
    <circle cx="256" cy="256" r="190" fill="url(#v3-disc)" stroke="#2C3545" stroke-width="2.5" />
    <circle cx="256" cy="256" r="186" fill="none" stroke="url(#v3-rim-light)" stroke-width="1.8" />

    <!-- Subtle Calibrated Inner Recess -->
    <circle cx="256" cy="256" r="148" fill="#0E1117" stroke="#06070A" stroke-width="3" />
    <circle cx="256" cy="256" r="146" fill="none" stroke="#252E3E" stroke-width="1.5" />

    <!-- Outer Neon Ring Accent -->
    <circle cx="256" cy="256" r="172" fill="none" stroke="#30D158" stroke-width="1.5" stroke-opacity="0.4" />
    <circle cx="256" cy="256" r="172" fill="none" stroke="#30D158" stroke-width="3" stroke-dasharray="16 119" stroke-linecap="round" />

    <!-- Center Olympic Steel Hub -->
    <circle cx="256" cy="256" r="54" fill="#1A202C" stroke="#475569" stroke-width="2" />
    <circle cx="256" cy="256" r="48" fill="#0C0E14" stroke="#2B3545" stroke-width="1.5" />
    <circle cx="256" cy="256" r="28" fill="#020304" stroke="#000000" stroke-width="2" />
  </g>

  <!-- Precision "L" Monogram - Engineered Blade -->
  <g filter="url(#v3-bloom)">
    <!-- Shadow for L on Disc -->
    <path d="
      M 168, 142
      L 214, 142
      L 214, 318
      L 344, 318
      L 344, 364
      L 168, 364
      Z"
      fill="#000000"
      opacity="0.6"
      transform="translate(0, 4)"
    />

    <!-- Sharp, Balanced Emerald L -->
    <path d="
      M 168, 142
      L 214, 142
      L 214, 318
      L 344, 318
      L 344, 364
      L 168, 364
      Z"
      fill="url(#v3-neon)"
      stroke="#55FF94"
      stroke-width="1.5"
    />

    <!-- Modern Diagonal Blade Slice on L Top & Tip -->
    <polygon points="168,142 214,142 168,188" fill="#FFFFFF" opacity="0.3" />
    <polygon points="344,318 344,364 298,364" fill="#FFFFFF" opacity="0.15" />

    <!-- Precision High-Voltage Core Line -->
    <path d="
      M 191, 154
      L 191, 341
      L 330, 341"
      fill="none"
      stroke="#FFFFFF"
      stroke-width="3.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      opacity="0.9"
    />
  </g>
</svg>"""

# -------------------------------------------------------------
# Concept V4: The "Kinetic Barbell & Plate" Monogram (Unmistakable L)
# The vertical bar IS a heavy Olympic plate in isometric/side profile
# and the horizontal bar IS the knurled barbell sleeve extending out.
# 100% Gym. 100% Lifting. 100% Original.
# -------------------------------------------------------------
svg_v4 = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <radialGradient id="v4-bg" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#141824" />
      <stop offset="65%" stop-color="#080A0E" />
      <stop offset="100%" stop-color="#030406" />
    </radialGradient>

    <!-- Plate Bevel & Rubber -->
    <linearGradient id="v4-plate-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2D3647" />
      <stop offset="40%" stop-color="#181D26" />
      <stop offset="80%" stop-color="#0F1218" />
      <stop offset="100%" stop-color="#080A0D" />
    </linearGradient>

    <!-- Barbell Chrome Steel Sleeve -->
    <linearGradient id="v4-bar-steel" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="25%" stop-color="#E2E8F0" />
      <stop offset="50%" stop-color="#94A3B8" />
      <stop offset="80%" stop-color="#475569" />
      <stop offset="100%" stop-color="#1E293B" />
    </linearGradient>

    <!-- High-Voltage Neon Emerald -->
    <linearGradient id="v4-neon" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#55FF94" />
      <stop offset="35%" stop-color="#30D158" />
      <stop offset="85%" stop-color="#059669" />
      <stop offset="100%" stop-color="#047857" />
    </linearGradient>

    <filter id="v4-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#000000" flood-opacity="0.8" />
    </filter>

    <filter id="v4-bloom" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="512" height="512" fill="url(#v4-bg)" />

  <!-- Ambient Light -->
  <circle cx="256" cy="256" r="190" fill="#30D158" opacity="0.10" />

  <!-- Master Symbol: Circular Calibrated Target Badge enclosing the Athletic L -->
  <g filter="url(#v4-shadow)">
    <!-- Calibrated Outer Frame Ring -->
    <circle cx="256" cy="256" r="188" fill="#10131A" stroke="#252D3C" stroke-width="2" />
    <circle cx="256" cy="256" r="184" fill="none" stroke="#FFFFFF" stroke-opacity="0.08" stroke-width="1.5" />
    <circle cx="256" cy="256" r="176" fill="none" stroke="#1A2230" stroke-width="1" stroke-dasharray="3 5" />
    
    <!-- Neon Corner Ticks -->
    <circle cx="256" cy="256" r="180" fill="none" stroke="#30D158" stroke-width="2.5" stroke-dasharray="24 165" stroke-opacity="0.7" />

    <!-- Recessed Olympic Disc Face -->
    <circle cx="256" cy="256" r="152" fill="#0A0C11" stroke="#050608" stroke-width="3" />
  </g>

  <!-- The Architectural Dual-Stroke 'L' Monogram -->
  <!-- Left Column: Olympic Calibrated Plate Bar; Bottom Row: Barbell Sleeve Bar -->
  <g filter="url(#v4-bloom)">
    <!-- Main L Polygon with Chamfers -->
    <path d="
      M 164, 128
      C 164, 120 170, 114 178, 114
      L 218, 114
      C 226, 114 232, 120 232, 128
      L 232, 302
      L 348, 302
      C 356, 302 362, 308 362, 316
      L 362, 356
      C 362, 364 356, 370 348, 370
      L 178, 370
      C 170, 370 164, 364 164, 356
      Z"
      fill="url(#v4-neon)"
      stroke="#55FF94"
      stroke-width="2"
    />

    <!-- Titanium Center Hub Inset Ring (Olympic 50mm collar accent in elbow) -->
    <circle cx="292" cy="216" r="42" fill="#141923" stroke="url(#v4-bar-steel)" stroke-width="3.5" />
    <circle cx="292" cy="216" r="34" fill="#0B0D13" stroke="#252D3C" stroke-width="1.5" />
    <circle cx="292" cy="216" r="18" fill="#020304" stroke="#000000" stroke-width="2" />
    <circle cx="292" cy="216" r="6" fill="#30D158" opacity="0.8" />

    <!-- Precision Racing Specular Core -->
    <path d="
      M 198, 132
      L 198, 336
      L 344, 336"
      fill="none"
      stroke="#FFFFFF"
      stroke-width="5"
      stroke-linecap="round"
      stroke-linejoin="round"
      opacity="0.95"
    />

    <path d="
      M 198, 136
      L 198, 336
      L 340, 336"
      fill="none"
      stroke="#FFFFFF"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </g>
</svg>"""

for name, code in [("v2", svg_v2), ("v3", svg_v3), ("v4", svg_v4)]:
    png = resvg_py.svg_to_bytes(svg_string=code, width=1024, height=1024)
    path = os.path.join(SCRATCH_DIR, f"logo_{name}.png")
    with open(path, "wb") as f:
        f.write(png)
    print(f"Generated {path}")
