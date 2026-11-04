import os
import io
from PIL import Image, ImageDraw

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
import resvg_py

SVG_LOGO_PATH = os.path.join(BASE_DIR, "public", "logo.svg")
with open(SVG_LOGO_PATH, "r", encoding="utf-8") as f:
    svg_str = f.read()
png_bytes = resvg_py.svg_to_bytes(svg_str, width=1024, height=1024)
master_raw = Image.open(io.BytesIO(png_bytes)).convert("RGBA")
if master_raw.size != (1024, 1024):
    master_raw = master_raw.resize((1024, 1024), Image.Resampling.LANCZOS)

def get_squircle_mask(size: int, radius: int) -> Image.Image:
    scale = 4
    mask = Image.new("L", (size * scale, size * scale), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((0, 0, size * scale, size * scale), radius=radius * scale, fill=255)
    return mask.resize((size, size), Image.Resampling.LANCZOS)

def get_circle_mask(size: int) -> Image.Image:
    scale = 4
    mask = Image.new("L", (size * scale, size * scale), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, size * scale, size * scale), fill=255)
    return mask.resize((size, size), Image.Resampling.LANCZOS)

# Create 1024x1024 versions
squircle_mask_1024 = get_squircle_mask(1024, 225)
squircle_1024 = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
squircle_1024.paste(master_raw, (0, 0), squircle_mask_1024)

circle_mask_1024 = get_circle_mask(1024)
circle_1024 = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
circle_1024.paste(master_raw, (0, 0), circle_mask_1024)

# 1. Public Web & PWA Assets
public_dir = os.path.join(BASE_DIR, "public")
os.makedirs(public_dir, exist_ok=True)

targets = [
    (os.path.join(public_dir, "app-logo.png"), 512, squircle_1024),
    (os.path.join(public_dir, "icon-512.png"), 512, squircle_1024),
    (os.path.join(public_dir, "icon-192.png"), 192, squircle_1024),
    (os.path.join(public_dir, "apple-touch-icon.png"), 180, squircle_1024),
    (os.path.join(BASE_DIR, "src", "assets", "images", "logo_in_app.png"), 512, squircle_1024),
    (os.path.join(BASE_DIR, "src", "assets", "images", "liftlab_console_icon.png"), 512, squircle_1024),
    (os.path.join(BASE_DIR, "src", "assets", "images", "liftlab_console_logo.png"), 512, squircle_1024),
]

for path, size, source_img in targets:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    resized = source_img.resize((size, size), Image.Resampling.LANCZOS)
    resized.save(path, format="PNG", optimize=True)
    print(f"Generated {path} ({size}x{size})")

# 2. Multi-size Favicon.ico
favicon_path = os.path.join(public_dir, "favicon.ico")
ico_sizes = [(16, 16), (32, 32), (48, 48)]
squircle_1024.save(favicon_path, format="ICO", sizes=ico_sizes)
print(f"Generated {favicon_path} with sizes {ico_sizes}")

# 3. Android App Launcher & Splash Icons
android_res = os.path.join(BASE_DIR, "android", "app", "src", "main", "res")
if os.path.exists(android_res):
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
            # Squircle Launcher
            icon_img = squircle_1024.resize((full_size, full_size), Image.Resampling.LANCZOS)
            icon_img.save(os.path.join(folder_path, "ic_launcher.png"), format="PNG")

            # Round Launcher
            icon_round = circle_1024.resize((full_size, full_size), Image.Resampling.LANCZOS)
            icon_round.save(os.path.join(folder_path, "ic_launcher_round.png"), format="PNG")

            # Adaptive Foreground Icon (108dp canvas with 72% safe-zone centered glyph)
            fg_canvas = Image.new("RGBA", (fg_canvas_size, fg_canvas_size), (0, 0, 0, 0))
            glyph_target_size = int(fg_canvas_size * 0.72)
            # Use squircle for adaptive foreground
            glyph_resized = squircle_1024.resize((glyph_target_size, glyph_target_size), Image.Resampling.LANCZOS)
            offset = (fg_canvas_size - glyph_target_size) // 2
            fg_canvas.paste(glyph_resized, (offset, offset), glyph_resized)
            fg_canvas.save(os.path.join(folder_path, "ic_launcher_foreground.png"), format="PNG")

            print(f"Updated Android {folder} (full: {full_size}x{full_size}, fg: {fg_canvas_size}x{fg_canvas_size})")

    # Android Splash Logo (drawable/splash_logo.png)
    splash_logo = os.path.join(android_res, "drawable", "splash_logo.png")
    if os.path.exists(os.path.dirname(splash_logo)):
        splash_img = squircle_1024.resize((480, 480), Image.Resampling.LANCZOS)
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
            logo_size = int(min_dim * 0.36)
            if logo_size < 48:
                logo_size = 48
            logo_resized = squircle_1024.resize((logo_size, logo_size), Image.Resampling.LANCZOS)
            offset_x = (w - logo_size) // 2
            offset_y = (h - logo_size) // 2
            splash_bg.paste(logo_resized, (offset_x, offset_y), logo_resized)
            target_file = os.path.join(target_dir, "splash.png")
            splash_bg.save(target_file, format="PNG", optimize=True)
            print(f"Generated Android splash: {target_file} ({w}x{h}, logo={logo_size}x{logo_size})")

print("All brand assets from Nano Banana successfully exported!")
