import os
import resvg_py
from PIL import Image

# Master 2026 Tactile Olympic Plate & Sculpted Emerald L
# Luxury athletic hardware aesthetic (Aerospace matte graphite + Machined Emerald Titanium)
# NO CROSSHAIRS. NO AMATEUR STICKS. PURE 2026 HIGH-END INDUSTRIAL ATHLETIC DESIGN.

svg_tactile_olympic = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <!-- Background Gradient: Deep Obsidian & Carbon -->
    <linearGradient id="bgPlate" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#16181F"/>
      <stop offset="50%" stop-color="#0E1014"/>
      <stop offset="100%" stop-color="#060709"/>
    </linearGradient>

    <!-- Outer Bezel Rim Metallic Reflection -->
    <linearGradient id="bezelGleam" x1="100" y1="60" x2="412" y2="452" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#3A3F4D"/>
      <stop offset="35%" stop-color="#1A1C24"/>
      <stop offset="70%" stop-color="#0F1116"/>
      <stop offset="100%" stop-color="#282C38"/>
    </linearGradient>

    <!-- Olympic Bumper Tire Rim (Heavy Matte Urethane) -->
    <radialGradient id="bumperUrethane" cx="256" cy="256" r="230" gradientUnits="userSpaceOnUse">
      <stop offset="70%" stop-color="#181B24"/>
      <stop offset="88%" stop-color="#12141B"/>
      <stop offset="100%" stop-color="#0A0B0F"/>
    </radialGradient>

    <!-- Recessed Hub Inset Shadow -->
    <radialGradient id="innerHub" cx="256" cy="250" r="160" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#141720"/>
      <stop offset="75%" stop-color="#0A0B0E"/>
      <stop offset="100%" stop-color="#050608"/>
    </radialGradient>

    <!-- Luminous Emerald Bioluminescence Core -->
    <radialGradient id="emeraldAura" cx="256" cy="256" r="140" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="rgba(48,209,88,0.22)"/>
      <stop offset="60%" stop-color="rgba(48,209,88,0.06)"/>
      <stop offset="100%" stop-color="rgba(48,209,88,0)"/>
    </radialGradient>

    <!-- Sculpted Emerald L: Primary Light Face -->
    <linearGradient id="lFaceLight" x1="170" y1="130" x2="350" y2="380" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#3DF574"/>
      <stop offset="45%" stop-color="#30D158"/>
      <stop offset="100%" stop-color="#22B847"/>
    </linearGradient>

    <!-- Sculpted Emerald L: Shadow / Bevel Flank -->
    <linearGradient id="lBevelShadow" x1="180" y1="140" x2="330" y2="390" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#209E40"/>
      <stop offset="100%" stop-color="#126B29"/>
    </linearGradient>

    <!-- Specular highlight on the top lip of the L -->
    <linearGradient id="specularTop" x1="170" y1="130" x2="250" y2="130" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#A6FFBE"/>
      <stop offset="100%" stop-color="#30D158"/>
    </linearGradient>

    <!-- Soft Drop Shadow Filter for the Monogram -->
    <filter id="monogramShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#000000" flood-opacity="0.85"/>
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#30D158" flood-opacity="0.25"/>
    </filter>
  </defs>

  <!-- Base App Icon Squircle (Continuous Curvature) -->
  <rect width="512" height="512" rx="116" fill="url(#bgPlate)"/>
  <rect x="2" y="2" width="508" height="508" rx="114" fill="none" stroke="url(#bezelGleam)" stroke-width="3"/>

  <!-- 1. Olympic Calibrated Plate: Outer Flange & Recessed Channel -->
  <!-- Outer Ring Highlight -->
  <circle cx="256" cy="256" r="198" fill="none" stroke="#252A36" stroke-width="2"/>
  
  <!-- Calibrated Bumper Outer Tier -->
  <circle cx="256" cy="256" r="194" fill="url(#bumperUrethane)"/>
  
  <!-- Precision Step Lip (Aerospace chamfer) -->
  <circle cx="256" cy="256" r="176" fill="none" stroke="#2D3342" stroke-width="3"/>
  <circle cx="256" cy="256" r="173" fill="none" stroke="#0D0E13" stroke-width="2"/>

  <!-- Recessed Inner Steel Hub Bowl -->
  <circle cx="256" cy="256" r="170" fill="url(#innerHub)"/>

  <!-- Center Steel Collar Ring (Olympic Sleeve) -->
  <circle cx="256" cy="256" r="168" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1.5"/>

  <!-- Ambient Emerald Energy Aura -->
  <circle cx="256" cy="256" r="150" fill="url(#emeraldAura)"/>

  <!-- Subtle Olympic Calibrated Grip Arcs (Dual Ergonomic Recesses at 10 & 2 o'clock / 4 & 8 o'clock) -->
  <!-- Clean, curved, aesthetic plate handles - NOT crosshairs! -->
  <path d="M 120 220 A 150 150 0 0 1 120 180" fill="none" stroke="#20242F" stroke-width="6" stroke-linecap="round"/>
  <path d="M 392 220 A 150 150 0 0 0 392 180" fill="none" stroke="#20242F" stroke-width="6" stroke-linecap="round"/>
  <path d="M 120 292 A 150 150 0 0 0 120 332" fill="none" stroke="#20242F" stroke-width="6" stroke-linecap="round"/>
  <path d="M 392 292 A 150 150 0 0 1 392 332" fill="none" stroke="#20242F" stroke-width="6" stroke-linecap="round"/>

  <!-- 2. Sculpted Master 'L' (Architectural Olympic Monogram with 3D Bevels) -->
  <g filter="url(#monogramShadow)">
    <!-- Base 3D Extrusion Shadow Bevel -->
    <path d="
      M 172 144
      C 172 136 178 130 186 130
      L 242 130
      C 250 130 256 136 256 144
      L 256 308
      C 256 314 261 319 267 319
      L 348 319
      C 356 319 362 325 362 333
      L 362 366
      C 362 374 356 380 348 380
      L 186 380
      C 178 380 172 374 172 366
      Z"
      fill="url(#lBevelShadow)"
    />

    <!-- Main Chiseled Face (Slightly Offset Upward & Left for Dynamic 3D Depth) -->
    <path d="
      M 168 138
      C 168 130 174 124 182 124
      L 238 124
      C 246 124 252 130 252 138
      L 252 304
      C 252 310 257 315 263 315
      L 344 315
      C 352 315 358 321 358 329
      L 358 360
      C 358 368 352 374 344 374
      L 182 374
      C 174 374 168 368 168 360
      Z"
      fill="url(#lFaceLight)"
    />

    <!-- Specular Titanium Highlight on Top Crest -->
    <path d="
      M 182 124
      L 238 124
      C 246 124 252 130 252 138
      L 252 144
      L 178 144
      L 168 138
      C 168 130 174 124 182 124
      Z"
      fill="url(#specularTop)"
    />

    <!-- Kinetic Inset Energy Channel (Subtle High-Tech Accent) -->
    <path d="
      M 194 156
      L 218 156
      L 218 326
      C 218 333 223 338 230 338
      L 332 338
      L 332 352
      L 220 352
      C 206 352 194 340 194 326
      Z"
      fill="#FFFFFF"
      opacity="0.35"
    />
  </g>
</svg>"""

# Render master tactile plate
os.makedirs("test_logos", exist_ok=True)
png_data = resvg_py.svg_to_bytes(svg_string=svg_tactile_olympic, width=512, height=512)
with open("test_logos/master_tactile_olympic.png", "wb") as f:
    f.write(png_data)

print("Rendered master tactile Olympic plate 512x512!")
