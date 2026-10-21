# LiftLab — Brand Identity & Visual System

## 1. Concept & Metaphor: The Atomic Plate / Lab Disc
**LiftLab** bridges raw physical exertion with rigorous scientific calibration. The visual identity fuses two quintessential forms:
1. **The Calibrated Olympic Plate**: The 20.4 kg / 45 lb competition plate, tactile cast metal with machined lathe grooves and 4 ergonomic kinetic apertures (grip vents).
2. **The Atomic Accelerator Core**: An inner luminous scientific chamber with triple orbital electron arcs and a high-energy quantum fusion beacon in Cyber Lime and Electric Emerald.

---

## 2. Brand Color Palette & Design Tokens

### Dark Mode (Primary / Default App Experience)
| Token | Hex Value | Role & Usage |
| :--- | :--- | :--- |
| **Brand Primary (Energy)** | `#C3F400` / `#30D158` | Live workout status, PR highlights, kinetic core glow, active timers |
| **Brand Secondary (Telemetry)** | `#5AC8FA` / `#0A84FF` | Calibration marks, volume metrics, graphs, resting indicators |
| **Background (Cockpit)** | `#090A0B` | Deep OLED black canvas, zero battery consumption, distraction-free |
| **Surface (Titanium Plates)** | `#12141A` – `#1A1E27` | Cards, bottom sheets, workout log rows, metallic plate body |
| **Border & Chamfers** | `#3D4554` / `#4F5768` | Specular edges, fine dividers, lathe finishing grooves |
| **Text Primary** | `#FFFFFF` | Display headlines, weight entries, rep counters |
| **Text Muted** | `#8E8E93` | Telemetry units (kg/lbs), timestamps, inactive tabs |

### Light Mode Counterpart
| Token | Hex Value | Role & Usage |
| :--- | :--- | :--- |
| **Brand Primary (High Contrast)**| `#15803D` – `#16A34A` | Primary action buttons, badges, high-contrast checkmarks |
| **Brand Secondary** | `#0066CC` | Secondary links, charts, telemetry metrics |
| **Background Canvas** | `#F5F5F7` | Clean Apple Studio gray canvas |
| **Surface Cards** | `#FFFFFF` | Clean white cards with 1px border `#E5E5EA` |
| **Text Primary** | `#090A0B` | Deep obsidian high-contrast typography |
| **Text Muted** | `#636366` | Secondary body text and labels |

### Monochrome Silhouette (Android Themed & iOS 18 Tinted)
- **Format**: `fill="currentColor"` pure silhouette vector.
- **Negative Space**: Vents and calibration ring cut out with 100% transparency.
- **Compatibility**: Adapts dynamically to Android Material You dynamic wallpaper tones and iOS 18 dark/tinted widget systems.

---

## 3. App Icon Specifications & Apple HIG Compliance

- **Canvas Size**: 1024 × 1024 px full-bleed square (no pre-rounded corners; platforms apply continuous curvature squircle and circular masks automatically).
- **Safe Zone Rule**: Artwork bounded within center 73.2% (Diameter: 750 px), well within the Apple/Google 80% safe zone circle (Diameter: 819.2 px).
- **Separated Layers**:
  - `id="bg"`: Deep obsidian canvas with radial backlight aura.
  - `id="foreground"`: Metallic plate with laser calibration ticks, ergonomic grip vents, and luminous atomic core.

---

## 4. Multiplatform Asset Manifest

### iOS & macOS
- Path: `assets/exported-icons/ios/AppIcon.appiconset/`
- Manifest: `Contents.json`
- Sizes:
  - `icon_40.png` (20x20@2x)
  - `icon_60.png` (20x20@3x)
  - `icon_58.png` (29x29@2x)
  - `icon_87.png` (29x29@3x)
  - `icon_76.png` (38x38@2x)
  - `icon_114.png` (38x38@3x)
  - `icon_80.png` (40x40@2x)
  - `icon_120.png` (40x40@3x / 60x60@2x)
  - `icon_180.png` (60x60@3x)
  - `icon_1024.png` (1024x1024@1x App Store Master)

### Android
- Path: `android/app/src/main/res/` & `assets/exported-icons/android/`
- Densities:
  - `mipmap-mdpi` (48px)
  - `mipmap-hdpi` (72px)
  - `mipmap-xhdpi` (96px)
  - `mipmap-xxhdpi` (144px)
  - `mipmap-xxxhdpi` (192px)
- Files per density:
  - `ic_launcher.png`: Legacy square master
  - `ic_launcher_round.png`: Circular masked legacy icon
  - `ic_launcher_foreground.png`: Adaptive transparent foreground glyph
- Configuration:
  - `values/ic_launcher_background.xml`: `#090A0B`

### Web & PWA
- Path: `public/` & `assets/exported-icons/web/`
- Files:
  - `favicon.ico`: Multi-resolution ICO (16px, 32px, 48px)
  - `apple-touch-icon.png`: 180 × 180 px
  - `icon-192.png`: 192 × 192 px
  - `icon-512.png`: 512 × 512 px
  - `app-logo.png`: 512 × 512 px
  - `logo.svg`: 1024 × 1024 px Scalable Master Vector
