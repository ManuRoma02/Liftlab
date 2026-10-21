import os
import math
import json
import io
import resvg_py
from PIL import Image, ImageDraw

def build_svg_strings():
    size = 1024
    cx, cy = 512.0, 512.0

    # Scale factor from reference 100x100
    # Center = 50, 50. Outer rim r = 44 (diameter 88).
    # In 1024x1024 canvas, safe plate diameter = 760 (radius 380 -> 74.2% safe zone).
    scale = 380.0 / 44.0  # ~8.6364

    r_outer = 44.0 * scale       # 380.0
    r_recess = 34.0 * scale      # 293.6
    r_track = 31.5 * scale       # 272.0
    r_bushing = 15.0 * scale     # 129.5
    r_inner_collar = 11.0 * scale # 95.0
    r_bore = 7.0 * scale         # 60.5

    # 'L' Monogram coordinates
    # Reference: M 40 28 V 70 H 68 (dx = -10, dy1 = -22, dy2 = 20, dx2 = 18)
    lx1 = cx + (-10.0 * scale)   # 425.6
    ly1 = cy + (-22.0 * scale)   # 322.0
    ly2 = cy + (20.0 * scale)    # 684.7
    lx2 = cx + (18.0 * scale)    # 667.5
    l_stroke = 6.6 * scale       # 57.0

    # 1. Master SVG (Full Color, Dark Titanium Canvas)
    master_svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="100%" height="100%">
  <defs>
    <!-- Background Canvas Gradients -->
    <radialGradient id="bg-canvas" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#141822" />
      <stop offset="65%" stop-color="#090B0F" />
      <stop offset="100%" stop-color="#040507" />
    </radialGradient>

    <!-- Outer Bumper Rubber Rim -->
    <linearGradient id="bumper-rim" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2D3545" />
      <stop offset="35%" stop-color="#1E232E" />
      <stop offset="70%" stop-color="#141820" />
      <stop offset="100%" stop-color="#0C0E13" />
    </linearGradient>

    <!-- Recessed Plate Face -->
    <radialGradient id="plate-face" cx="45%" cy="40%" r="65%">
      <stop offset="0%" stop-color="#1E2430" />
      <stop offset="50%" stop-color="#13171F" />
      <stop offset="100%" stop-color="#0A0D12" />
    </radialGradient>

    <!-- Stainless Steel Collar Bushing -->
    <linearGradient id="steel-bushing" x1="15%" y1="0%" x2="85%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="20%" stop-color="#E2E8F0" />
      <stop offset="50%" stop-color="#94A3B8" />
      <stop offset="80%" stop-color="#64748B" />
      <stop offset="100%" stop-color="#334155" />
    </linearGradient>

    <!-- Inner Collar Chamber -->
    <radialGradient id="bushing-inner" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#050608" />
      <stop offset="65%" stop-color="#0E1219" />
      <stop offset="100%" stop-color="#1E2634" />
    </radialGradient>

    <!-- High-Voltage Emerald Neon Energy -->
    <linearGradient id="neon-emerald" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4ADE80" />
      <stop offset="30%" stop-color="#30D158" />
      <stop offset="80%" stop-color="#10B981" />
      <stop offset="100%" stop-color="#059669" />
    </linearGradient>

    <!-- Specular Highlight Sheen -->
    <linearGradient id="specular-light" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.35" />
      <stop offset="25%" stop-color="#FFFFFF" stop-opacity="0.06" />
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0" />
    </linearGradient>

    <!-- Ambient Neon Aura Filter -->
    <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="12" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <!-- Layer 0: Background Canvas -->
  <rect width="1024" height="1024" fill="url(#bg-canvas)" />

  <!-- Layer 1: Ambient Emerald Backlight -->
  <circle cx="{cx}" cy="{cy}" r="{r_outer * 1.06:.1f}" fill="#30D158" opacity="0.12" filter="url(#neon-glow)" />

  <!-- Layer 2: Plate Drop Shadow -->
  <circle cx="{cx}" cy="{cy + 12:.1f}" r="{r_outer:.1f}" fill="#000000" opacity="0.80" />

  <!-- Layer 3: Outer Calibrated Bumper Rim -->
  <circle cx="{cx}" cy="{cy}" r="{r_outer:.1f}" fill="url(#bumper-rim)" stroke="#384357" stroke-width="3.5" />
  <circle cx="{cx}" cy="{cy}" r="{r_outer:.1f}" fill="none" stroke="url(#specular-light)" stroke-width="2.5" />
  <circle cx="{cx}" cy="{cy}" r="{r_outer - 4:.1f}" fill="none" stroke="#30D158" stroke-width="2.2" stroke-opacity="0.45" />

  <!-- Layer 4: Recessed Plate Face (Olympic Standard Step) -->
  <circle cx="{cx}" cy="{cy}" r="{r_recess:.1f}" fill="url(#plate-face)" stroke="#090B0F" stroke-width="4.5" />
  <circle cx="{cx}" cy="{cy}" r="{r_recess:.1f}" fill="none" stroke="#2D3748" stroke-width="1.8" />

  <!-- Machining & Calibration Grooves -->
  <circle cx="{cx}" cy="{cy}" r="{r_track:.1f}" fill="none" stroke="#252D3C" stroke-width="3.5" />
  <circle cx="{cx}" cy="{cy}" r="{r_track:.1f}" fill="none" stroke="#3D495F" stroke-width="1.5" stroke-dasharray="3.5 4.5" stroke-opacity="0.65" />

  <!-- Layer 5: Center Stainless Steel Hub Collar (50mm Barbell Bushing) -->
  <circle cx="{cx}" cy="{cy + 3:.1f}" r="{r_bushing + 3:.1f}" fill="#000000" opacity="0.65" />
  <circle cx="{cx}" cy="{cy}" r="{r_bushing:.1f}" fill="url(#steel-bushing)" stroke="#F8FAFC" stroke-width="2.8" />
  <circle cx="{cx}" cy="{cy}" r="{r_bushing - 3:.1f}" fill="none" stroke="#475569" stroke-width="1.2" />

  <!-- Inner Collar Bevel -->
  <circle cx="{cx}" cy="{cy}" r="{r_inner_collar:.1f}" fill="url(#bushing-inner)" stroke="#1E2838" stroke-width="1.8" />

  <!-- Layer 6: Barbell 50.4mm Bore Hole -->
  <circle cx="{cx}" cy="{cy}" r="{r_bore:.1f}" fill="#040507" stroke="#000000" stroke-width="2.5" />

  <!-- Layer 7: Bold Emerald Neon 'L' Monogram -->
  <!-- Ambient Neon Glow Under-layer -->
  <path d="M {lx1:.1f} {ly1:.1f} V {ly2:.1f} H {lx2:.1f}" fill="none" stroke="#30D158" stroke-width="{l_stroke * 1.5:.1f}" stroke-linecap="round" stroke-linejoin="round" opacity="0.35" filter="url(#neon-glow)" />

  <!-- Core 'L' Stroke -->
  <path d="M {lx1:.1f} {ly1:.1f} V {ly2:.1f} H {lx2:.1f}" fill="none" stroke="url(#neon-emerald)" stroke-width="{l_stroke:.1f}" stroke-linecap="round" stroke-linejoin="round" />

  <!-- Inner High-Voltage White Core Sheen on 'L' -->
  <path d="M {lx1:.1f} {ly1 + 8:.1f} V {ly2 - 3:.1f} H {lx2 - 8:.1f}" fill="none" stroke="#FFFFFF" stroke-width="{l_stroke * 0.22:.1f}" stroke-linecap="round" stroke-linejoin="round" opacity="0.75" />

  <!-- Central Precision Accent Core Dot -->
  <circle cx="{cx}" cy="{cy}" r="4.2" fill="#30D158" stroke="#FFFFFF" stroke-width="1.2" />

  <!-- Layer 8: Tactile Apple HIG Specular Sheen -->
  <path d="M {cx - r_outer * 0.85:.1f} {cy - r_outer * 0.2:.1f} A {r_outer:.1f} {r_outer:.1f} 0 0 1 {cx + r_outer * 0.85:.1f} {cy - r_outer * 0.2:.1f} A {r_outer:.1f} {r_outer * 0.5:.1f} 0 0 0 {cx - r_outer * 0.85:.1f} {cy - r_outer * 0.2:.1f} Z" fill="url(#specular-light)" opacity="0.45" pointer-events="none" />
</svg>
"""

    # 2. Foreground Glyph SVG (Transparent background)
    glyph_svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="100%" height="100%">
  <defs>
    <!-- Outer Bumper Rubber Rim -->
    <linearGradient id="bumper-rim-g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2D3545" />
      <stop offset="35%" stop-color="#1E232E" />
      <stop offset="70%" stop-color="#141820" />
      <stop offset="100%" stop-color="#0C0E13" />
    </linearGradient>

    <!-- Recessed Plate Face -->
    <radialGradient id="plate-face-g" cx="45%" cy="40%" r="65%">
      <stop offset="0%" stop-color="#1E2430" />
      <stop offset="50%" stop-color="#13171F" />
      <stop offset="100%" stop-color="#0A0D12" />
    </radialGradient>

    <!-- Stainless Steel Collar Bushing -->
    <linearGradient id="steel-bushing-g" x1="15%" y1="0%" x2="85%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="20%" stop-color="#E2E8F0" />
      <stop offset="50%" stop-color="#94A3B8" />
      <stop offset="80%" stop-color="#64748B" />
      <stop offset="100%" stop-color="#334155" />
    </linearGradient>

    <!-- Inner Collar Chamber -->
    <radialGradient id="bushing-inner-g" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#050608" />
      <stop offset="65%" stop-color="#0E1219" />
      <stop offset="100%" stop-color="#1E2634" />
    </radialGradient>

    <!-- High-Voltage Emerald Neon Energy -->
    <linearGradient id="neon-emerald-g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4ADE80" />
      <stop offset="30%" stop-color="#30D158" />
      <stop offset="80%" stop-color="#10B981" />
      <stop offset="100%" stop-color="#059669" />
    </linearGradient>

    <!-- Specular Highlight Sheen -->
    <linearGradient id="specular-light-g" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.35" />
      <stop offset="25%" stop-color="#FFFFFF" stop-opacity="0.06" />
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0" />
    </linearGradient>

    <!-- Ambient Neon Aura Filter -->
    <filter id="neon-glow-g" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="12" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <!-- Plate Drop Shadow -->
  <circle cx="{cx}" cy="{cy + 12:.1f}" r="{r_outer:.1f}" fill="#000000" opacity="0.80" />

  <!-- Outer Calibrated Bumper Rim -->
  <circle cx="{cx}" cy="{cy}" r="{r_outer:.1f}" fill="url(#bumper-rim-g)" stroke="#384357" stroke-width="3.5" />
  <circle cx="{cx}" cy="{cy}" r="{r_outer:.1f}" fill="none" stroke="url(#specular-light-g)" stroke-width="2.5" />
  <circle cx="{cx}" cy="{cy}" r="{r_outer - 4:.1f}" fill="none" stroke="#30D158" stroke-width="2.2" stroke-opacity="0.45" />

  <!-- Recessed Plate Face (Olympic Standard Step) -->
  <circle cx="{cx}" cy="{cy}" r="{r_recess:.1f}" fill="url(#plate-face-g)" stroke="#090B0F" stroke-width="4.5" />
  <circle cx="{cx}" cy="{cy}" r="{r_recess:.1f}" fill="none" stroke="#2D3748" stroke-width="1.8" />

  <!-- Machining & Calibration Grooves -->
  <circle cx="{cx}" cy="{cy}" r="{r_track:.1f}" fill="none" stroke="#252D3C" stroke-width="3.5" />
  <circle cx="{cx}" cy="{cy}" r="{r_track:.1f}" fill="none" stroke="#3D495F" stroke-width="1.5" stroke-dasharray="3.5 4.5" stroke-opacity="0.65" />

  <!-- Center Stainless Steel Hub Collar -->
  <circle cx="{cx}" cy="{cy + 3:.1f}" r="{r_bushing + 3:.1f}" fill="#000000" opacity="0.65" />
  <circle cx="{cx}" cy="{cy}" r="{r_bushing:.1f}" fill="url(#steel-bushing-g)" stroke="#F8FAFC" stroke-width="2.8" />
  <circle cx="{cx}" cy="{cy}" r="{r_bushing - 3:.1f}" fill="none" stroke="#475569" stroke-width="1.2" />

  <!-- Inner Collar Bevel -->
  <circle cx="{cx}" cy="{cy}" r="{r_inner_collar:.1f}" fill="url(#bushing-inner-g)" stroke="#1E2838" stroke-width="1.8" />

  <!-- Barbell 50.4mm Bore Hole -->
  <circle cx="{cx}" cy="{cy}" r="{r_bore:.1f}" fill="#040507" stroke="#000000" stroke-width="2.5" />

  <!-- Bold Emerald Neon 'L' Monogram -->
  <path d="M {lx1:.1f} {ly1:.1f} V {ly2:.1f} H {lx2:.1f}" fill="none" stroke="#30D158" stroke-width="{l_stroke * 1.5:.1f}" stroke-linecap="round" stroke-linejoin="round" opacity="0.35" filter="url(#neon-glow-g)" />
  <path d="M {lx1:.1f} {ly1:.1f} V {ly2:.1f} H {lx2:.1f}" fill="none" stroke="url(#neon-emerald-g)" stroke-width="{l_stroke:.1f}" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M {lx1:.1f} {ly1 + 8:.1f} V {ly2 - 3:.1f} H {lx2 - 8:.1f}" fill="none" stroke="#FFFFFF" stroke-width="{l_stroke * 0.22:.1f}" stroke-linecap="round" stroke-linejoin="round" opacity="0.75" />
  <circle cx="{cx}" cy="{cy}" r="4.2" fill="#30D158" stroke="#FFFFFF" stroke-width="1.2" />

  <!-- Tactile Sheen -->
  <path d="M {cx - r_outer * 0.85:.1f} {cy - r_outer * 0.2:.1f} A {r_outer:.1f} {r_outer:.1f} 0 0 1 {cx + r_outer * 0.85:.1f} {cy - r_outer * 0.2:.1f} A {r_outer:.1f} {r_outer * 0.5:.1f} 0 0 0 {cx - r_outer * 0.85:.1f} {cy - r_outer * 0.2:.1f} Z" fill="url(#specular-light-g)" opacity="0.45" pointer-events="none" />
</svg>
"""

    # 3. Monochrome Vector Silhouette SVG (Single Color / Tintable)
    monochrome_svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="100%" height="100%">
  <g fill="currentColor" stroke="currentColor">
    <!-- Outer Bumper Rim Ring -->
    <circle cx="{cx}" cy="{cy}" r="{r_outer:.1f}" fill="none" stroke-width="32" />
    
    <!-- Recessed Face Ring -->
    <circle cx="{cx}" cy="{cy}" r="{r_recess:.1f}" fill="none" stroke-width="12" />
    
    <!-- Inner Calibration Ring -->
    <circle cx="{cx}" cy="{cy}" r="{r_track:.1f}" fill="none" stroke-width="6" stroke-dasharray="14 10" />

    <!-- Center Bushing Ring -->
    <circle cx="{cx}" cy="{cy}" r="{r_bushing:.1f}" fill="none" stroke-width="24" />

    <!-- Inner Bore Hole -->
    <circle cx="{cx}" cy="{cy}" r="{r_bore:.1f}" fill="none" stroke-width="8" />

    <!-- Bold 'L' Monogram -->
    <path d="M {lx1:.1f} {ly1:.1f} V {ly2:.1f} H {lx2:.1f}" fill="none" stroke-width="{l_stroke:.1f}" stroke-linecap="round" stroke-linejoin="round" />

    <!-- Center Core Dot -->
    <circle cx="{cx}" cy="{cy}" r="8" fill="currentColor" stroke-width="0" />
  </g>
</svg>
"""

    return master_svg, glyph_svg, monochrome_svg

def create_circular_icon(img: Image.Image) -> Image.Image:
    """Applies a smooth circular mask to an image for ic_launcher_round.png."""
    size = img.size
    mask = Image.new("L", size, 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, size[0], size[1]), fill=255)
    
    round_img = Image.new("RGBA", size, (0, 0, 0, 0))
    round_img.paste(img, (0, 0))
    round_img.putalpha(mask)
    return round_img

def update_android_xml_vectors():
    """Generates precise Android Vector Drawable XMLs for adaptive foreground and splash/status bar."""
    
    # 1. ic_launcher_foreground.xml (108x108 viewport, safe circle radius 33dp at 54,54)
    # Plate radius: 31dp (safe within 33dp mask)
    fg_xml = """<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">

    <!-- 1. Outer Calibrated Bumper Rim -->
    <path
        android:pathData="M 54,23 a 31,31 0 1,0 0.001,0 Z"
        android:fillColor="#181D26"
        android:strokeColor="#2D3442"
        android:strokeWidth="2.5" />

    <!-- Neon Rim Accent Lip -->
    <path
        android:pathData="M 54,25 a 29,29 0 1,0 0.001,0 Z"
        android:fillColor="#00000000"
        android:strokeColor="#30D158"
        android:strokeWidth="0.8"
        android:strokeAlpha="0.5" />

    <!-- 2. Recessed Plate Face (Olympic Standard Step) -->
    <path
        android:pathData="M 54,30 a 24,24 0 1,0 0.001,0 Z"
        android:fillColor="#12161F"
        android:strokeColor="#252C3A"
        android:strokeWidth="1.2" />

    <!-- Precision Machining Track -->
    <path
        android:pathData="M 54,31.8 a 22.2,22.2 0 1,0 0.001,0 Z"
        android:fillColor="#00000000"
        android:strokeColor="#384357"
        android:strokeWidth="0.8"
        android:strokeAlpha="0.6" />

    <!-- 3. Center Stainless Steel Hub Collar (50mm Bushing) -->
    <path
        android:pathData="M 54,43.4 a 10.6,10.6 0 1,0 0.001,0 Z"
        android:fillColor="#94A3B8"
        android:strokeColor="#CBD5E1"
        android:strokeWidth="1.0" />

    <!-- Inner Collar Chamber -->
    <path
        android:pathData="M 54,46.2 a 7.8,7.8 0 1,0 0.001,0 Z"
        android:fillColor="#1E2838"
        android:strokeColor="#0E1219"
        android:strokeWidth="0.8" />

    <!-- Barbell 50.4mm Bore Hole -->
    <path
        android:pathData="M 54,49.1 a 4.9,4.9 0 1,0 0.001,0 Z"
        android:fillColor="#040507" />

    <!-- 4. Bold Emerald Neon 'L' Monogram -->
    <path
        android:pathData="M 47,38.5 L 47,68.1 L 66.7,68.1"
        android:fillColor="#00000000"
        android:strokeColor="#30D158"
        android:strokeWidth="4.6"
        android:strokeLineCap="round"
        android:strokeLineJoin="round" />

    <!-- High-Voltage White Core Sheen on 'L' -->
    <path
        android:pathData="M 47,40 L 47,67 L 65.2,67"
        android:fillColor="#00000000"
        android:strokeColor="#FFFFFF"
        android:strokeWidth="1.2"
        android:strokeAlpha="0.75"
        android:strokeLineCap="round"
        android:strokeLineJoin="round" />

    <!-- Precision Center Core Dot -->
    <path
        android:pathData="M 54,52.2 a 1.8,1.8 0 1,0 0.001,0 Z"
        android:fillColor="#30D158" />
</vector>
"""

    fg_xml_path = "android/app/src/main/res/drawable-v24/ic_launcher_foreground.xml"
    os.makedirs(os.path.dirname(fg_xml_path), exist_ok=True)
    with open(fg_xml_path, "w", encoding="utf-8") as f:
        f.write(fg_xml)

    # 2. splash_icon.xml (Monochrome Alpha Vector for Status Bar & Splash)
    splash_xml = """<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">

    <!-- Outer Bumper Rim Ring -->
    <path
        android:fillColor="#FFFFFF"
        android:fillType="evenOdd"
        android:pathData="M 54,23 a 31,31 0 1,0 0.001,0 Z M 54,26 a 28,28 0 1,1 -0.001,0 Z" />

    <!-- Center Bushing Ring -->
    <path
        android:fillColor="#FFFFFF"
        android:fillType="evenOdd"
        android:pathData="M 54,43.4 a 10.6,10.6 0 1,0 0.001,0 Z M 54,48 a 6,6 0 1,1 -0.001,0 Z" />

    <!-- Bold 'L' Monogram -->
    <path
        android:fillColor="#00000000"
        android:strokeColor="#FFFFFF"
        android:strokeWidth="4.6"
        android:strokeLineCap="round"
        android:strokeLineJoin="round"
        android:pathData="M 47,38.5 L 47,68.1 L 66.7,68.1" />

    <!-- Center Precision Dot -->
    <path
        android:fillColor="#FFFFFF"
        android:pathData="M 54,52.5 a 1.5,1.5 0 1,0 0.001,0 Z" />
</vector>
"""
    splash_xml_path = "android/app/src/main/res/drawable/splash_icon.xml"
    with open(splash_xml_path, "w", encoding="utf-8") as f:
        f.write(splash_xml)

    # 3. mipmap-anydpi-v26 adaptive icon XMLs (pointing to @drawable/ic_launcher_foreground and @drawable/splash_icon)
    adaptive_xml = """<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@drawable/ic_launcher_foreground"/>
    <monochrome android:drawable="@drawable/splash_icon"/>
</adaptive-icon>
"""
    with open("android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml", "w", encoding="utf-8") as f:
        f.write(adaptive_xml)
    with open("android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml", "w", encoding="utf-8") as f:
        f.write(adaptive_xml)

def main():
    print("1. Generating Master, Glyph & Monochrome SVGs...")
    os.makedirs("assets", exist_ok=True)
    os.makedirs("public", exist_ok=True)
    os.makedirs("src/assets", exist_ok=True)
    os.makedirs("src/assets/images", exist_ok=True)

    master_svg, glyph_svg, mono_svg = build_svg_strings()

    # Save SVG source files
    with open("assets/logo.svg", "w", encoding="utf-8") as f:
        f.write(master_svg)
    with open("public/logo.svg", "w", encoding="utf-8") as f:
        f.write(master_svg)
    with open("src/assets/logo.svg", "w", encoding="utf-8") as f:
        f.write(master_svg)
    with open("assets/logo-glyph.svg", "w", encoding="utf-8") as f:
        f.write(glyph_svg)
    with open("assets/logo-monochrome.svg", "w", encoding="utf-8") as f:
        f.write(mono_svg)
    with open("src/assets/logo-monochrome.svg", "w", encoding="utf-8") as f:
        f.write(mono_svg)

    print("2. Rasterizing 1024x1024 Masters with resvg...")
    master_bytes = resvg_py.svg_to_bytes(svg_string=master_svg, width=1024, height=1024)
    glyph_bytes = resvg_py.svg_to_bytes(svg_string=glyph_svg, width=1024, height=1024)

    master_1024 = Image.open(io.BytesIO(master_bytes)).convert("RGBA")
    glyph_1024 = Image.open(io.BytesIO(glyph_bytes)).convert("RGBA")

    master_1024.save("assets/master-1024.png", "PNG")
    glyph_1024.save("assets/glyph-1024.png", "PNG")

    # Output directory for exported bundles
    export_dir = "assets/exported-icons"
    os.makedirs(export_dir, exist_ok=True)

    # 3. iOS AppIcon.appiconset
    print("3. Exporting iOS AppIcon.appiconset...")
    ios_dir = os.path.join(export_dir, "ios", "AppIcon.appiconset")
    os.makedirs(ios_dir, exist_ok=True)

    ios_specs = [
        {"size": "20x20", "scale": "2x", "px": 40},
        {"size": "20x20", "scale": "3x", "px": 60},
        {"size": "29x29", "scale": "2x", "px": 58},
        {"size": "29x29", "scale": "3x", "px": 87},
        {"size": "38x38", "scale": "2x", "px": 76},
        {"size": "38x38", "scale": "3x", "px": 114},
        {"size": "40x40", "scale": "2x", "px": 80},
        {"size": "40x40", "scale": "3x", "px": 120},
        {"size": "60x60", "scale": "2x", "px": 120},
        {"size": "60x60", "scale": "3x", "px": 180},
        {"size": "64x64", "scale": "2x", "px": 128},
        {"size": "64x64", "scale": "3x", "px": 192},
        {"size": "68x68", "scale": "2x", "px": 136},
        {"size": "76x76", "scale": "2x", "px": 152},
        {"size": "83.5x83.5", "scale": "2x", "px": 167},
        {"size": "1024x1024", "scale": "1x", "px": 1024}
    ]

    contents_images = []
    for spec in ios_specs:
        px = spec["px"]
        filename = f"icon_{spec['size']}@{spec['scale']}.png"
        img = master_1024.resize((px, px), Image.Resampling.LANCZOS)
        img.save(os.path.join(ios_dir, filename))
        contents_images.append({
            "size": spec["size"],
            "idiom": "universal",
            "filename": filename,
            "scale": spec["scale"]
        })

    with open(os.path.join(ios_dir, "Contents.json"), "w", encoding="utf-8") as f:
        json.dump({"images": contents_images, "info": {"version": 1, "author": "antigravity"}}, f, indent=2)

    # 4. Android Densities
    print("4. Exporting Android density bundles...")
    android_densities = {
        "mipmap-mdpi": 48,
        "mipmap-hdpi": 72,
        "mipmap-xhdpi": 96,
        "mipmap-xxhdpi": 144,
        "mipmap-xxxhdpi": 192
    }

    android_proj_res = "android/app/src/main/res"

    for folder, size in android_densities.items():
        exp_folder = os.path.join(export_dir, "android", folder)
        os.makedirs(exp_folder, exist_ok=True)
        
        proj_folder = os.path.join(android_proj_res, folder)
        os.makedirs(proj_folder, exist_ok=True)

        # Standard legacy square icon
        icon_square = master_1024.resize((size, size), Image.Resampling.LANCZOS)
        # Standard legacy circular icon
        icon_round = create_circular_icon(icon_square)
        # Adaptive foreground: transparent background glyph
        icon_fg = glyph_1024.resize((size, size), Image.Resampling.LANCZOS)

        # Save to export folder
        icon_square.save(os.path.join(exp_folder, "ic_launcher.png"))
        icon_round.save(os.path.join(exp_folder, "ic_launcher_round.png"))
        icon_fg.save(os.path.join(exp_folder, "ic_launcher_foreground.png"))

        # Save to project res folder
        icon_square.save(os.path.join(proj_folder, "ic_launcher.png"))
        icon_round.save(os.path.join(proj_folder, "ic_launcher_round.png"))
        icon_fg.save(os.path.join(proj_folder, "ic_launcher_foreground.png"))

    # Update ic_launcher_background.xml
    bg_xml_path = os.path.join(android_proj_res, "values", "ic_launcher_background.xml")
    os.makedirs(os.path.dirname(bg_xml_path), exist_ok=True)
    with open(bg_xml_path, "w", encoding="utf-8") as f:
        f.write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#090A0E</color>\n</resources>\n')

    # Update vector drawables (foreground and splash)
    update_android_xml_vectors()

    # 5. Web & Favicons
    print("5. Exporting Web & PWA assets...")
    web_export_dir = os.path.join(export_dir, "web")
    os.makedirs(web_export_dir, exist_ok=True)

    web_sizes = {
        "apple-touch-icon.png": 180,
        "icon-192.png": 192,
        "icon-512.png": 512,
        "app-logo.png": 512
    }

    for name, size in web_sizes.items():
        resized = master_1024.resize((size, size), Image.Resampling.LANCZOS)
        resized.save(os.path.join(web_export_dir, name))
        resized.save(os.path.join("public", name))

    # Multi-size Favicon ICO (16, 32, 48)
    fav_16 = master_1024.resize((16, 16), Image.Resampling.LANCZOS)
    fav_32 = master_1024.resize((32, 32), Image.Resampling.LANCZOS)
    fav_48 = master_1024.resize((48, 48), Image.Resampling.LANCZOS)
    fav_32.save(
        os.path.join(web_export_dir, "favicon.ico"),
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48)],
        append_images=[fav_16, fav_48]
    )
    fav_32.save(
        os.path.join("public", "favicon.ico"),
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48)],
        append_images=[fav_16, fav_48]
    )

    # 6. Update in-app console images
    print("6. Updating in-app console assets in src/assets/images/...")
    master_1024.resize((512, 512), Image.Resampling.LANCZOS).save("src/assets/images/liftlab_console_icon.png")
    master_1024.resize((512, 512), Image.Resampling.LANCZOS).save("src/assets/images/liftlab_console_logo.png")
    master_1024.resize((512, 512), Image.Resampling.LANCZOS).save("src/assets/images/logo_in_app.png")

    # 7. Update Android Splash Screen Assets
    print("7. Updating Android splash screen images...")
    splash_logo_path = "android/app/src/main/res/drawable/splash_logo.png"
    glyph_1024.resize((512, 512), Image.Resampling.LANCZOS).save(splash_logo_path)

    import glob
    for splash_file in glob.glob("android/app/src/main/res/drawable*/splash.png"):
        try:
            with Image.open(splash_file) as existing:
                sw, sh = existing.size
            
            # Create dark titanium background canvas
            splash_bg = Image.new("RGBA", (sw, sh), (9, 10, 14, 255))
            logo_target_size = int(min(sw, sh) * 0.38)
            scaled_logo = glyph_1024.resize((logo_target_size, logo_target_size), Image.Resampling.LANCZOS)
            
            # Center logo
            offset_x = (sw - logo_target_size) // 2
            offset_y = (sh - logo_target_size) // 2
            splash_bg.paste(scaled_logo, (offset_x, offset_y), scaled_logo)
            splash_bg.convert("RGB").save(splash_file)
        except Exception as e:
            print(f"Warning updating {splash_file}: {e}")

    print("\n[SUCCESS] Concept 01 (The Bumper Plate) assets successfully built, rendered, and exported!")

if __name__ == "__main__":
    main()
