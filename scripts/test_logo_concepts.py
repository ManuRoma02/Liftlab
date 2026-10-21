import os
import resvg_py
from PIL import Image

# We will test 4 modern 2026 athletic brand concepts for LiftLab:
# Concept 1: The Kinetic Monogram (Geometric twin chiseled blades forming 'LL' - dynamic upward 45° angle)
# Concept 2: The Apex Lift (Architectural monolithic 'L' fused with an ascending electric emerald chevron)
# Concept 3: The Interlocking Plates / Precision Prisms (Dual angled athletic polygons forming an iconic 'L')
# Concept 4: The Speed Vector L (Ultra-minimalist aerodynamic athletic mark)

svg_c1 = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#14151B"/>
      <stop offset="100%" stop-color="#090A0D"/>
    </linearGradient>
    <linearGradient id="emeraldGrad" x1="160" y1="120" x2="380" y2="400" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#3CE76A"/>
      <stop offset="100%" stop-color="#28B84B"/>
    </linearGradient>
    <linearGradient id="whiteGrad" x1="140" y1="120" x2="260" y2="380" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#C5C8D4"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="120" fill="url(#bg)"/>
  <rect x="2" y="2" width="508" height="508" rx="118" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="4"/>

  <!-- Kinetic Monogram: Twin dynamic athletic pillars (LIFT & LAB) -->
  <!-- Left Pillar (Solid Crisp White) -->
  <path d="M 168 138 C 168 132 173 126 180 126 L 226 126 C 233 126 238 132 238 138 L 238 316 C 238 322 243 328 250 328 L 334 328 C 341 328 346 333 346 340 L 346 374 C 346 381 341 386 334 386 L 180 386 C 173 386 168 381 168 374 Z" fill="url(#whiteGrad)"/>

  <!-- Right Accent Blade: Energetic Emerald Overload (LAB / Growth) -->
  <path d="M 276 126 C 283 126 289 130 293 136 L 366 250 C 371 257 368 266 360 270 L 328 286 C 321 290 312 287 308 280 L 264 210 C 260 204 260 196 264 190 L 276 172 C 280 166 281 158 278 152 L 276 126 Z" fill="url(#emeraldGrad)"/>
</svg>"""

# Let's create a pure, high-end geometric athletic logo
# Monogram 'L' + 'L' precision cut:
# Left stroke is the bold vertical spine.
# Bottom stroke is the dynamic foot.
# An interior/accent stroke creates a stunning double-L (LIFT + LAB) in pure emerald and titanium white.
svg_master = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#111216"/>
      <stop offset="100%" stop-color="#08090B"/>
    </linearGradient>
    <linearGradient id="emerald" x1="160" y1="140" x2="360" y2="380" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#34E866"/>
      <stop offset="100%" stop-color="#28C750"/>
    </linearGradient>
    <linearGradient id="subtleGlow" x1="256" y1="100" x2="256" y2="420" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="rgba(48,209,88,0.15)"/>
      <stop offset="100%" stop-color="rgba(48,209,88,0)"/>
    </linearGradient>
  </defs>
  <!-- Background Container -->
  <rect width="512" height="512" rx="116" fill="url(#bg)"/>
  <rect x="2" y="2" width="508" height="508" rx="114" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="3"/>
  <circle cx="256" cy="220" r="160" fill="url(#subtleGlow)"/>

  <!-- Geometric Architectural Double-L / Athletic Power Crest -->
  <!-- Primary L (LIFT) in Titanium White -->
  <path d="M 152 144 C 152 135 159 128 168 128 L 222 128 C 231 128 238 135 238 144 L 238 310 C 238 316 243 322 250 322 L 344 322 C 353 322 360 329 360 338 L 360 370 C 360 379 353 386 344 386 L 168 386 C 159 386 152 379 152 370 Z" fill="#FFFFFF"/>

  <!-- Inner Dynamic Surge L (LAB) in Precision Emerald -->
  <!-- Nested offset creating depth, kinetic speed, and athletic science -->
  <path d="M 264 196 C 264 188 271 182 279 182 L 315 182 C 323 182 330 188 330 196 L 330 262 C 330 268 335 274 341 274 L 385 274 C 393 274 400 281 400 289 L 400 313 C 400 321 393 328 385 328 L 279 328 C 271 328 264 321 264 313 Z" fill="url(#emerald)"/>
</svg>"""

# Let's also explore Concept B:
# A pure, iconic, razor-sharp athletic chevron monogram:
# Two heavy, forward-angled athletic strokes (representing a barbell bench press drive / sprint propulsion)
# forming the letter 'L' with a dynamic 45° angle.
svg_chevron = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#111216"/>
      <stop offset="100%" stop-color="#08090B"/>
    </linearGradient>
    <linearGradient id="emGrad" x1="160" y1="120" x2="380" y2="400" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#34E866"/>
      <stop offset="100%" stop-color="#28C750"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="116" fill="url(#bg)"/>
  <rect x="2" y="2" width="508" height="508" rx="114" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="3"/>

  <!-- Left Pillar (Titanium White, pure athletic power) -->
  <path d="M 160 136 C 160 127 167 120 176 120 L 228 120 C 237 120 244 127 244 136 L 244 376 C 244 385 237 392 228 392 L 176 392 C 167 392 160 385 160 376 Z" fill="#FFFFFF"/>

  <!-- Base Bar with Forward Kinetic Ramp (Electric Emerald) -->
  <path d="M 264 316 C 264 308 271 302 279 302 L 366 302 C 376 302 384 312 381 322 L 364 378 C 362 386 354 392 346 392 L 279 392 C 271 392 264 385 264 376 Z" fill="url(#emGrad)"/>

  <!-- Top Accent Pip (Precision Lab Dot) -->
  <circle cx="316" cy="180" r="32" fill="url(#emGrad)"/>
</svg>"""

# Concept C: High-End Minimalist Olympic Silhouette (No crosshairs!)
# A monolithic, luxury athletic monogram:
# An elegant, powerful athletic 'L' with a dynamic 45° chamfered corner and an illuminated inner energy beam.
svg_luxury = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#121318"/>
      <stop offset="100%" stop-color="#08090B"/>
    </linearGradient>
    <linearGradient id="emerald" x1="160" y1="120" x2="360" y2="380" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#34E866"/>
      <stop offset="100%" stop-color="#24B948"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="116" fill="url(#bg)"/>
  <rect x="2" y="2" width="508" height="508" rx="114" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="3"/>

  <!-- Sleek Athletic L Monogram with 45° Speed Bevel -->
  <path d="
    M 160 142
    C 160 132 168 124 178 124
    L 236 124
    C 246 124 254 132 254 142
    L 254 308
    C 254 316 260 322 268 322
    L 358 322
    C 368 322 376 330 376 340
    L 376 370
    C 376 380 368 388 358 388
    L 178 388
    C 168 388 160 380 160 370
    Z"
    fill="url(#emerald)"
  />

  <!-- Subtle Interior Titanium Speed Accent -->
  <path d="
    M 194 156
    L 220 156
    L 220 338
    L 342 338
    L 342 356
    L 194 356
    Z"
    fill="#FFFFFF"
    opacity="0.22"
  />
</svg>"""

# Render and test
os.makedirs("test_logos", exist_ok=True)
for name, svg in [("master_double_l", svg_master), ("chevron", svg_chevron), ("luxury_l", svg_luxury)]:
    b = resvg_py.svg_to_bytes(svg_string=svg, width=512, height=512)
    with open(f"test_logos/{name}.png", "wb") as f:
        f.write(b)
print("Rendered test logos!")
