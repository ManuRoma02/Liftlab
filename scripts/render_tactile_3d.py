import numpy as np
from PIL import Image, ImageFilter
import math
import os

OUT_DIR = r"scripts/scratch"
os.makedirs(OUT_DIR, exist_ok=True)

WIDTH, HEIGHT = 1024, 1024
CX, CY = 512, 512

# Create coordinate grid
y, x = np.ogrid[:HEIGHT, :WIDTH]
dx = (x - CX).astype(np.float32)
dy = (y - CY).astype(np.float32)
dist = np.sqrt(dx * dx + dy * dy)
angle = np.arctan2(dy, dx)

# 1. Base Canvas - Deep Luxury Obsidian Dark Tone (#080A0E)
img = np.zeros((HEIGHT, WIDTH, 3), dtype=np.float32)
# Radial ambient vignette
vignette = np.clip(1.0 - (dist / 650.0) ** 1.8, 0.0, 1.0)
img[:, :, 0] = 8.0 + 10.0 * vignette
img[:, :, 1] = 10.0 + 12.0 * vignette
img[:, :, 2] = 14.0 + 18.0 * vignette

# 2. Olympic Bumper Plate Geometry (Radius ~ 380px)
# Outer rim torus / rounded bevel from r=340 to r=390
plate_mask = np.clip((390.0 - dist) / 2.0, 0.0, 1.0)
plate_rim_mask = np.clip(1.0 - np.abs(dist - 370.0) / 20.0, 0.0, 1.0)
plate_recess_mask = np.clip((330.0 - dist) / 2.0, 0.0, 1.0)

# Plate Heightmap for PBR Normal calculation
heightmap = np.zeros((HEIGHT, WIDTH), dtype=np.float32)
# Outer rim bevel
rim_profile = np.clip((390.0 - dist) / 40.0, 0.0, 1.0)
rim_profile = np.sin(rim_profile * math.pi * 0.5)
heightmap += rim_profile * 0.4 * plate_mask

# Recessed face
heightmap[dist < 330] = 0.25

# Center stainless steel collar hub (r=110 to r=140)
hub_mask = np.clip((140.0 - dist) / 2.0, 0.0, 1.0)
hub_rim = np.clip(1.0 - np.abs(dist - 130.0) / 10.0, 0.0, 1.0)
heightmap[dist < 140] = 0.45 + 0.15 * hub_rim[dist < 140]

# Center 50.4mm Olympic Bore hole (r < 60)
bore_mask = np.clip((60.0 - dist) / 2.0, 0.0, 1.0)
heightmap[dist < 60] = 0.05

# 3. Modern Sculptural Emerald "L" Monogram Heightmap & Mask
# Vertical stem: x in [400, 500], y in [240, 740] (in 1024 canvas)
# Horizontal leg: x in [400, 720], y in [640, 740]
l_mask = np.zeros((HEIGHT, WIDTH), dtype=np.float32)

# Coordinates for L:
# Optical center around CX=512, CY=512
# Vertical bar: X: 410..520, Y: 260..760
# Horizontal bar: X: 410..740, Y: 650..760
vert_cond = (x >= 400) & (x <= 510) & (y >= 260) & (y <= 760)
horiz_cond = (x >= 400) & (x <= 740) & (y >= 650) & (y <= 760)
l_solid = vert_cond | horiz_cond
l_mask[l_solid] = 1.0

# Create smooth rounded/chamfered edges for the L using distance transform
from scipy.ndimage import distance_transform_edt
l_dist = distance_transform_edt(l_mask)
l_edge_dist = distance_transform_edt(1.0 - l_mask)

# Glass cushion / tactile 3D pillow profile for L
l_height = np.clip(l_dist / 32.0, 0.0, 1.0)
l_height = np.sin(l_height * math.pi * 0.5) * 0.65
heightmap = np.maximum(heightmap, l_height)

# 4. Compute High-Resolution Surface Normals
gy, gx = np.gradient(heightmap)
# Scale gradients for lighting
gx *= 18.0
gy *= 18.0
gz = np.ones_like(gx)
norm = np.sqrt(gx * gx + gy * gy + gz * gz)
nx = -gx / norm
ny = -gy / norm
nz = gz / norm

# 5. Studio Lighting Setup (2026 Key Light, Rim Light, Ambient Fill)
# Key Light from top-left (angle: -45°, elevation: 55°)
lx1, ly1, lz1 = -0.5, -0.6, 0.65
l_len1 = math.sqrt(lx1*lx1 + ly1*ly1 + lz1*lz1)
lx1 /= l_len1; ly1 /= l_len1; lz1 /= l_len1

diffuse1 = np.clip(nx * lx1 + ny * ly1 + nz * lz1, 0.0, 1.0)
# Specular highlight (Blinn-Phong)
hx1, hy1, hz1 = lx1, ly1, lz1 + 1.0
h_len1 = math.sqrt(hx1*hx1 + hy1*hy1 + hz1*hz1)
hx1 /= h_len1; hy1 /= h_len1; hz1 /= h_len1
spec1 = np.clip(nx * hx1 + ny * hy1 + nz * hz1, 0.0, 1.0) ** 32

# Secondary Rim Light from bottom-right (Emerald Accent)
lx2, ly2, lz2 = 0.6, 0.7, 0.4
diffuse2 = np.clip(nx * lx2 + ny * ly2 + nz * lz2, 0.0, 1.0)

# Base Plate Shading (Dark Matte Rubber & Titanium)
plate_color = np.zeros_like(img)
plate_color[:, :, 0] = 18.0 + diffuse1 * 22.0
plate_color[:, :, 1] = 22.0 + diffuse1 * 26.0
plate_color[:, :, 2] = 28.0 + diffuse1 * 34.0

# Stainless steel hub coloring
is_hub = (hub_mask > 0.05) & (bore_mask < 0.95)
steel_spec = spec1 * 1.8
plate_color[is_hub, 0] = 140.0 * diffuse1[is_hub] + steel_spec[is_hub] * 200.0
plate_color[is_hub, 1] = 150.0 * diffuse1[is_hub] + steel_spec[is_hub] * 220.0
plate_color[is_hub, 2] = 165.0 * diffuse1[is_hub] + steel_spec[is_hub] * 255.0

# Bore hole dark cavity
is_bore = bore_mask > 0.5
plate_color[is_bore, :] = 4.0

# Rim specular catch
plate_color += (spec1 * 60.0 * plate_mask)[:, :, None]

# Blend plate onto background canvas
img = img * (1.0 - plate_mask[:, :, None]) + plate_color * plate_mask[:, :, None]

# 6. Tactile Frosted Emerald Liquid Glass for the L Monogram
# Translucent Emerald Glass (#30D158 / #55FF94)
glass_mask = np.clip(l_dist / 4.0, 0.0, 1.0)
# Internal neon glow core
inner_core = np.clip((l_dist - 14.0) / 12.0, 0.0, 1.0)

glass_color = np.zeros_like(img)
# Emerald base gradient (dark emerald depth to bright neon)
glass_color[:, :, 0] = 15.0 + 35.0 * inner_core + 80.0 * spec1
glass_color[:, :, 1] = 180.0 + 75.0 * inner_core + 75.0 * spec1
glass_color[:, :, 2] = 75.0 + 70.0 * inner_core + 120.0 * spec1

# Rim Fresnel refraction on glass edges
fresnel = np.clip(1.0 - nz, 0.0, 1.0) ** 2.2
glass_color[:, :, 0] += fresnel * 120.0
glass_color[:, :, 1] += fresnel * 255.0
glass_color[:, :, 2] += fresnel * 180.0

# Razor sharp specular highlight line on glass crown
glass_spec = (spec1 ** 2.0) * 220.0
glass_color += glass_spec[:, :, None]

# Core fiber highlight (White laser line down center)
center_line_vert = (np.abs(x - 455) <= 3) & (y >= 290) & (y <= 710)
center_line_horiz = (np.abs(y - 705) <= 3) & (x >= 455) & (x <= 710)
center_fiber = (center_line_vert | center_line_horiz).astype(np.float32)
glass_color[:, :, 0] += center_fiber * 220.0
glass_color[:, :, 1] += center_fiber * 255.0
glass_color[:, :, 2] += center_fiber * 240.0

# Ambient emerald bloom / drop shadow onto plate
shadow_offset_y = 16
shadow_mask = np.roll(l_mask, shadow_offset_y, axis=0)
img = img * (1.0 - 0.45 * shadow_mask[:, :, None] * (1.0 - glass_mask[:, :, None]))

# Composite Glass L onto image
img = img * (1.0 - glass_mask[:, :, None]) + glass_color * glass_mask[:, :, None]

# Clip and convert to PIL Image
img = np.clip(img, 0.0, 255.0).astype(np.uint8)
pil_img = Image.fromarray(img, mode="RGB")

# Apply modern subtle bloom glow filter
glow = pil_img.filter(ImageFilter.GaussianBlur(radius=14))
pil_final = Image.blend(pil_img, glow, alpha=0.18)

out_file = os.path.join(OUT_DIR, "render_tactile_3d.png")
pil_final.save(out_file, format="PNG", quality=95)
print(f"Generated {out_file}")
