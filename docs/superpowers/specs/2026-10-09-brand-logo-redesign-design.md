# Design Specification: LiftLab Logo & Brand Identity Redesign (The Bumper Plate)

**Date**: 2026-10-09  
**Status**: User Approved (Concept 01: "The Bumper Plate")  
**Target Applications**: Web/PWA, Android Native App, Status Bar / Notification Icons, App Store / Launcher  

---

## 1. Problem Statement & Objectives
- **Previous Issue**: The previous app logo was perceived as a generic circular ring/donut or camera lens rather than an authentic gym weight plate, lacking immediate gym identity and visual punch at small icon sizes (16px–48px).
- **Core Objective**: Replace the legacy branding across all platforms with **Concept 01: "The Bumper Plate"**, an Olympic bumper weight plate fusing the initial "L" (LiftLab) with a 50mm stainless steel collar bushing and calibrated competition disc geometry.
- **Success Criteria**:
  1. Instant gym recognizability (barbell plate + "L" monogram).
  2. Multi-scale legibility: razor-sharp from 16px favicon/status bar up to 1024px store listing.
  3. 100% platform compliance: Android adaptive icons (foreground/background), splash screens, notification icons, and PWA assets.
  4. Build integrity: all unit tests passing, zero lint errors, successful Android APK assembly.

---

## 2. Visual Architecture & Geometry (Concept 01)

### 2.1 Color Tokens
| Token | Hex | Role |
|---|---|---|
| Titanium Black Canvas | `#090A0E` | Background for app icon canvas and adaptive background |
| Cast Iron / Bumper Rubber | `#12161F` / `#1E2430` | Outer disc rim and body structure |
| Stainless Steel Bushing | `#94A3B8` / `#CBD5E1` | Center Olympic 50mm collar bushing |
| Electric Emerald Neon | `#30D158` / `#10B981` | Accent color for the kinetic "L" lettermark & rim glow |
| Pure Bore Hole | `#040507` | 50mm barbell bore hole depth |

### 2.2 Vector Specifications (512×512 Master)
- **Outer Rim**: Calibrated 450mm Olympic disc outer circle (Radius 225 inside 256, 256 center, staying inside the 80% safe zone).
- **Bevel & Machining Rings**: Concentric inner tracks providing depth and tactile barbell plate aesthetics without micro-text clutter.
- **Center Bushing**: 50mm Olympic collar insert in brushed steel with a solid dark bore hole.
- **Lettermark "L"**: Bold, geometric "L" cut through the disc with a 90° angle, rounded terminals, and dual-tone emerald gradient fill (`#30D158` to `#10B981`).

---

## 3. Platform Asset Delivery Plan

### 3.1 Master SVGs
- `src/assets/logo.svg`: Full-color 512×512 master vector graphic.
- `src/assets/logo-monochrome.svg`: Single-color silhouette with pure transparency for status bar and themed app icons.

### 3.2 Android Native Assets
- `android/app/src/main/res/drawable-v24/ic_launcher_foreground.xml`: Vector drawable centered in 108×108 viewport with the Bumper Plate "L" inside the 66dp safe zone.
- `android/app/src/main/res/drawable/ic_launcher_background.xml`: Solid `#090A0E` background vector.
- `android/app/src/main/res/drawable/splash_icon.xml`: Vector drawable for splash screen and status bar notifications.
- `android/app/src/main/res/mipmap-{mdpi,hdpi,xhdpi,xxhdpi,xxxhdpi}/ic_launcher.png`: Production density PNGs generated at 48px, 72px, 96px, 144px, 192px.

### 3.3 Web & PWA Assets
- `public/favicon.ico`: 32×32 / 48×48 multi-resolution favicon.
- `public/apple-touch-icon.png`: 180×180 PNG.
- `public/icon-192.png`: 192×192 PWA icon.
- `public/icon-512.png`: 512×512 PWA splash icon.
- `src/assets/images/logo_in_app.png`: High-res in-app display image.
- `src/assets/images/liftlab_console_icon.png`: Header / console branding image.

---

## 4. Automation & Verification
1. **Generation Script**: Python script using Pillow (`PIL`) or Node.js canvas/sharp to render raster density bundles from the approved master SVG.
2. **Quality Checks**:
   - Android Adaptive Icon Preview: verified against circle, squircle, and rounded rectangle mask shapes.
   - Status Bar Icon: pure alpha transparency mask, verified in `LiveWorkoutService.java`.
   - Web PWA manifest: verified in `public/manifest.webmanifest`.
3. **Build & APK Delivery**:
   - `npm run test` & `npm run lint`.
   - `npm run build` & `npx cap sync android`.
   - `cd android && gradlew.bat assembleDebug`.
   - `npm run send:apk` to deliver the updated APK to Telegram.
