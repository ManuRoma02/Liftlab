import os
import resvg_py

# Let's explore 4 razor-sharp 2026 concepts:

# Concept 1: "The Twin Chevrons / Kinetic LL"
# Two ascending parallel athletic chevrons (one titanium white, one electric emerald)
# forming a dynamic forward-leaning "LL" monogram that evokes speed, lifting progress, and precision science.
svg_1 = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#121318"/>
      <stop offset="100%" stop-color="#08090B"/>
    </linearGradient>
    <linearGradient id="em1" x1="180" y1="120" x2="380" y2="400" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#34E866"/>
      <stop offset="100%" stop-color="#22BF45"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="116" fill="url(#bg)"/>
  <rect x="2" y="2" width="508" height="508" rx="114" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="3"/>

  <!-- Left Dynamic Blade: LIFT (Titanium White) -->
  <path d="
    M 148 140
    C 148 131 155 124 164 124
    L 220 124
    C 229 124 236 131 236 140
    L 236 322
    C 236 328 241 334 248 334
    L 332 334
    C 341 334 348 341 348 350
    L 348 376
    C 348 385 341 392 332 392
    L 164 392
    C 155 392 148 385 148 376
    Z"
    fill="#FFFFFF"
  />

  <!-- Interlocking Kinetic Wedge: LAB (Electric Emerald) -->
  <path d="
    M 264 124
    C 273 124 280 131 280 140
    L 280 256
    C 280 262 285 268 292 268
    L 364 268
    C 373 268 380 275 380 284
    L 380 306
    C 380 315 373 322 364 322
    L 292 322
    C 277 322 264 309 264 294
    L 264 140
    C 264 131 271 124 280 124
    Z"
    fill="url(#em1)"
  />
</svg>"""

# Concept 2: "The Athletic Apex / Kinetic Barbell Monogram"
# A bold, modern architectural glyph: A central vertical barbell spine flanked by two aerodynamic 45° athletic wings forming an "L"
svg_2 = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#121318"/>
      <stop offset="100%" stop-color="#08090B"/>
    </linearGradient>
    <linearGradient id="em2" x1="140" y1="120" x2="380" y2="400" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#34E866"/>
      <stop offset="100%" stop-color="#20BE43"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="116" fill="url(#bg)"/>
  <rect x="2" y="2" width="508" height="508" rx="114" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="3"/>

  <!-- Athletic Geometric Monogram 'L' with 45° upward cut and athletic power bars -->
  <!-- Main Column -->
  <path d="
    M 154 136
    L 226 136
    L 226 314
    L 358 314
    L 358 386
    L 154 386
    Z"
    fill="#FFFFFF"
  />
  <!-- High Voltage Diagonal Ascent Cut (Lab Speed Vector) -->
  <path d="
    M 252 136
    L 358 242
    L 358 190
    L 304 136
    Z"
    fill="url(#em2)"
  />
  <path d="
    M 288 340
    L 358 270
    L 358 314
    L 314 358
    L 288 358
    Z"
    fill="url(#em2)"
  />
</svg>"""

# Concept 3: "The Pure Vector Precision Emblem"
# Clean, powerful, iconic: A solid athletic vertical pillar + kinetic base with an energized glowing cut
# Minimal, timeless like Tesla, Gymshark, Arc'teryx, Apple.
svg_3 = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#121318"/>
      <stop offset="100%" stop-color="#07080A"/>
    </linearGradient>
    <linearGradient id="em3" x1="160" y1="120" x2="360" y2="380" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#34E866"/>
      <stop offset="100%" stop-color="#24B948"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="116" fill="url(#bg)"/>
  <rect x="2" y="2" width="508" height="508" rx="114" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="3"/>

  <!-- Left Pillar (Strength / Lift) in Pure Crisp White -->
  <path d="
    M 166 136
    C 166 126 174 118 184 118
    L 232 118
    C 242 118 250 126 250 136
    L 250 376
    C 250 386 242 394 232 394
    L 184 394
    C 174 394 166 386 166 376
    Z"
    fill="#FFFFFF"
  />

  <!-- Horizontal Power Track (Progress / Foundation) in Electric Emerald -->
  <path d="
    M 270 314
    C 270 304 278 296 288 296
    L 366 296
    C 376 296 384 304 384 314
    L 384 376
    C 384 386 376 394 366 394
    L 288 394
    C 278 394 270 386 270 376
    Z"
    fill="url(#em3)"
  />

  <!-- Ascending Lab Pulse (Dynamic 45° Diamond Dot) -->
  <path d="
    M 314 170
    L 348 204
    L 314 238
    L 280 204
    Z"
    fill="url(#em3)"
  />
</svg>"""

# Concept 4: "The Interlocking Monogram - Pure Geometric LL"
# An interconnected geometric monogram where the Lift L and the Lab L form an athletic helix / crest:
# Stroke 1: White L
# Stroke 2: Emerald L inverted or interlocking, forming a bold athletic shield silhouette.
svg_4 = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#121319"/>
      <stop offset="100%" stop-color="#08090C"/>
    </linearGradient>
    <linearGradient id="em4" x1="160" y1="120" x2="380" y2="400" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#34E866"/>
      <stop offset="100%" stop-color="#22BF45"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="116" fill="url(#bg)"/>
  <rect x="2" y="2" width="508" height="508" rx="114" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="3"/>

  <!-- Continuous Architectural Ribbon forming 'L' with 3D athletic chamfers -->
  <!-- Vertical Arm (White to Light Slate) -->
  <path d="
    M 164 132
    C 164 124 171 118 179 118
    L 235 118
    C 243 118 250 124 250 132
    L 250 310
    C 250 316 255 321 261 321
    L 353 321
    C 361 321 368 327 368 335
    L 368 379
    C 368 387 361 394 353 394
    L 179 394
    C 171 394 164 387 164 379
    Z"
    fill="#FFFFFF"
  />

  <!-- Kinetic Emerald Chevron / Upward Ascent Blade -->
  <path d="
    M 272 138
    C 272 130 279 124 287 124
    L 349 124
    C 357 124 364 130 364 138
    L 364 266
    C 364 274 357 280 349 280
    L 287 280
    C 279 280 272 274 272 266
    Z"
    fill="url(#em4)"
  />
</svg>"""

# Render all
os.makedirs("test_logos", exist_ok=True)
logos = [("concept_1_twin_ll", svg_1), ("concept_2_apex", svg_2), ("concept_3_pure", svg_3), ("concept_4_architectural", svg_4)]

for name, svg in logos:
    b = resvg_py.svg_to_bytes(svg_string=svg, width=512, height=512)
    with open(f"test_logos/{name}.png", "wb") as f:
        f.write(b)

print("Rendered 4 refined concepts!")
