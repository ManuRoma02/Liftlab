#!/usr/bin/env python3
import os
from PIL import Image, ImageDraw

# Master glyph source
SOURCE_GLYPH = "public/icon-512.png"

# Color constants
BG_COLOR = (9, 10, 14, 255) # #090A0E
SPLASH_BG = (9, 10, 11, 255) # #090A0B

def create_launcher_icon(size, is_round=False):
    # Base canvas
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Background
    if is_round:
        draw.ellipse([0, 0, size - 1, size - 1], fill=BG_COLOR)
        glyph_scale = 0.58
    else:
        # Subtle rounded rectangle for standard icon
        radius = int(size * 0.22)
        draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=BG_COLOR)
        glyph_scale = 0.64
    
    # Load and resize glyph
    glyph = Image.open(SOURCE_GLYPH).convert("RGBA")
    g_size = max(1, int(size * glyph_scale))
    glyph_resized = glyph.resize((g_size, g_size), Image.Resampling.LANCZOS)
    
    # Center glyph
    offset = ((size - g_size) // 2, (size - g_size) // 2)
    img.paste(glyph_resized, offset, glyph_resized)
    return img

def create_launcher_foreground(size):
    # Transparent canvas with safe zone glyph
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    glyph = Image.open(SOURCE_GLYPH).convert("RGBA")
    g_size = max(1, int(size * 0.60)) # Safe zone for 108dp canvas
    glyph_resized = glyph.resize((g_size, g_size), Image.Resampling.LANCZOS)
    offset = ((size - g_size) // 2, (size - g_size) // 2)
    img.paste(glyph_resized, offset, glyph_resized)
    return img

def create_splash_screen(width, height):
    # Pure solid background matching #090A0E so zero static logo is shown on startup
    return Image.new("RGBA", (width, height), (9, 10, 14, 255))

def main():
    print("Regenerating all Android mipmap icons and splash screens...")
    
    # Densities and sizes
    densities = {
        "mdpi": {"icon": 48, "fg": 108},
        "hdpi": {"icon": 72, "fg": 162},
        "xhdpi": {"icon": 96, "fg": 216},
        "xxhdpi": {"icon": 144, "fg": 324},
        "xxxhdpi": {"icon": 192, "fg": 432},
    }
    
    res_dir = "android/app/src/main/res"
    
    for density, conf in densities.items():
        folder = os.path.join(res_dir, f"mipmap-{density}")
        os.makedirs(folder, exist_ok=True)
        
        # ic_launcher.png
        icon = create_launcher_icon(conf["icon"], is_round=False)
        icon.save(os.path.join(folder, "ic_launcher.png"), "PNG")
        
        # ic_launcher_round.png
        icon_round = create_launcher_icon(conf["icon"], is_round=True)
        icon_round.save(os.path.join(folder, "ic_launcher_round.png"), "PNG")
        
        # ic_launcher_foreground.png
        icon_fg = create_launcher_foreground(conf["fg"])
        icon_fg.save(os.path.join(folder, "ic_launcher_foreground.png"), "PNG")
        print(f"Generated mipmap-{density} (icon={conf['icon']}, fg={conf['fg']})")

    # Splash screens
    splash_targets = [
        ("drawable/splash.png", 480, 320),
        ("drawable-port-mdpi/splash.png", 320, 480),
        ("drawable-port-hdpi/splash.png", 480, 800),
        ("drawable-port-xhdpi/splash.png", 720, 1280),
        ("drawable-port-xxhdpi/splash.png", 960, 1600),
        ("drawable-port-xxxhdpi/splash.png", 1280, 1920),
        ("drawable-land-mdpi/splash.png", 480, 320),
        ("drawable-land-hdpi/splash.png", 800, 480),
        ("drawable-land-xhdpi/splash.png", 1280, 720),
        ("drawable-land-xxhdpi/splash.png", 1600, 960),
        ("drawable-land-xxxhdpi/splash.png", 1920, 1280),
    ]
    
    for rel_path, w, h in splash_targets:
        full_path = os.path.join(res_dir, rel_path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        spl = create_splash_screen(w, h)
        spl.save(full_path, "PNG")
        print(f"Generated splash: {rel_path} ({w}x{h})")
        
    print("All Android assets successfully generated with canonical Double L!")

if __name__ == "__main__":
    main()
