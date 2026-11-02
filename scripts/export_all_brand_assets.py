import os
import io
import resvg_py
from PIL import Image

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SVG_PATH = os.path.join(BASE_DIR, "assets", "logo.svg")
GLYPH_SVG_PATH = os.path.join(BASE_DIR, "assets", "logo-glyph.svg")

with open(SVG_PATH, "r", encoding="utf-8") as f:
    svg_content = f.read()

with open(GLYPH_SVG_PATH, "r", encoding="utf-8") as f:
    glyph_svg_content = f.read()

def render_png(svg_str: str, width: int, height: int) -> Image.Image:
    png_bytes = resvg_py.svg_to_bytes(svg_string=svg_str, width=width, height=height)
    return Image.open(io.BytesIO(png_bytes)).convert("RGBA")

print("Rendering master 1024x1024...")
img_1024 = render_png(svg_content, 1024, 1024)
glyph_1024 = render_png(glyph_svg_content, 1024, 1024)

# 1. Public PWA & Web Assets
public_dir = os.path.join(BASE_DIR, "public")
os.makedirs(public_dir, exist_ok=True)

targets = [
    (os.path.join(public_dir, "app-logo.png"), 512),
    (os.path.join(public_dir, "icon-512.png"), 512),
    (os.path.join(public_dir, "icon-192.png"), 192),
    (os.path.join(public_dir, "apple-touch-icon.png"), 180),
    (os.path.join(BASE_DIR, "src", "assets", "images", "logo_in_app.png"), 512),
    (os.path.join(BASE_DIR, "src", "assets", "images", "liftlab_console_icon.png"), 512),
    (os.path.join(BASE_DIR, "src", "assets", "images", "liftlab_console_logo.png"), 512),
]

for path, size in targets:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    resized = img_1024.resize((size, size), Image.Resampling.LANCZOS)
    resized.save(path, format="PNG", optimize=True)
    print(f"Generated {path} ({size}x{size})")

# 2. Multi-size Favicon.ico
favicon_path = os.path.join(public_dir, "favicon.ico")
ico_sizes = [(16, 16), (32, 32), (48, 48)]
img_1024.save(favicon_path, format="ICO", sizes=ico_sizes)
print(f"Generated {favicon_path} with sizes {ico_sizes}")

# 3. Android App Launcher & Splash Icons
android_res = os.path.join(BASE_DIR, "android", "app", "src", "main", "res")
if os.path.exists(android_res):
    # (folder, full_size, foreground_size)
    android_densities = [
        ("mipmap-mdpi", 48, 108),
        ("mipmap-hdpi", 72, 162),
        ("mipmap-xhdpi", 96, 216),
        ("mipmap-xxhdpi", 144, 324),
        ("mipmap-xxxhdpi", 192, 432),
    ]
    for folder, full_size, fg_canvas_size in android_densities:
        folder_path = os.path.join(android_res, folder)
        if os.path.exists(folder_path):
            # Legacy Full Launcher Icons
            icon_img = img_1024.resize((full_size, full_size), Image.Resampling.LANCZOS)
            icon_img.save(os.path.join(folder_path, "ic_launcher.png"), format="PNG")
            icon_img.save(os.path.join(folder_path, "ic_launcher_round.png"), format="PNG")

            # Adaptive Foreground Icon (108dp canvas with 66% safe-zone centered glyph)
            fg_canvas = Image.new("RGBA", (fg_canvas_size, fg_canvas_size), (0, 0, 0, 0))
            glyph_target_size = int(fg_canvas_size * 0.66)
            glyph_resized = glyph_1024.resize((glyph_target_size, glyph_target_size), Image.Resampling.LANCZOS)
            offset = (fg_canvas_size - glyph_target_size) // 2
            fg_canvas.paste(glyph_resized, (offset, offset), glyph_resized)
            fg_canvas.save(os.path.join(folder_path, "ic_launcher_foreground.png"), format="PNG")

            print(f"Updated Android {folder} (full: {full_size}x{full_size}, fg: {fg_canvas_size}x{fg_canvas_size})")

    # Android Splash Logo (drawable/splash_logo.png)
    splash_logo = os.path.join(android_res, "drawable", "splash_logo.png")
    if os.path.exists(os.path.dirname(splash_logo)):
        splash_img = img_1024.resize((480, 480), Image.Resampling.LANCZOS)
        splash_img.save(splash_logo, format="PNG")
        print(f"Updated {splash_logo}")

    # Generate Centered Native Android Splash Screen Drawables
    splash_targets = [
        ("drawable", 480, 320),
        ("drawable-land-mdpi", 480, 320),
        ("drawable-land-hdpi", 800, 480),
        ("drawable-land-xhdpi", 1280, 720),
        ("drawable-land-xxhdpi", 1600, 960),
        ("drawable-land-xxxhdpi", 1920, 1280),
        ("drawable-port-mdpi", 320, 480),
        ("drawable-port-hdpi", 480, 800),
        ("drawable-port-xhdpi", 720, 1280),
        ("drawable-port-xxhdpi", 960, 1600),
        ("drawable-port-xxxhdpi", 1280, 1920),
    ]

    bg_color = (9, 10, 14, 255) # #090A0E

    for folder, w, h in splash_targets:
        target_dir = os.path.join(android_res, folder)
        if os.path.exists(target_dir):
            splash_bg = Image.new("RGBA", (w, h), bg_color)
            min_dim = min(w, h)
            # Logo dimension: 32% of min dimension
            logo_size = int(min_dim * 0.34)
            if logo_size < 48:
                logo_size = 48
            logo_resized = img_1024.resize((logo_size, logo_size), Image.Resampling.LANCZOS)
            offset_x = (w - logo_size) // 2
            offset_y = (h - logo_size) // 2
            splash_bg.paste(logo_resized, (offset_x, offset_y), logo_resized)
            target_file = os.path.join(target_dir, "splash.png")
            splash_bg.save(target_file, format="PNG", optimize=True)
            print(f"Generated Android splash: {target_file} ({w}x{h}, logo={logo_size}x{logo_size})")

print("All brand assets successfully exported!")
