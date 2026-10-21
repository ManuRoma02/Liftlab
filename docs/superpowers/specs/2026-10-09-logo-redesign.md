# LiftLab — Brand Identity & In-App Logo Redesign Spec

## 1. Overview & Problem Statement
The current LiftLab logo (`assets/logo.svg`, `public/logo.svg`) and in-app brand assets (`src/assets/images/logo_in_app.png`, `liftlab_console_icon.png`) suffer from:
1. **Geometric dissonance**: An arbitrary neon green rounded tube superimposed over a barbell weight plate, clashing with the plate's center bore and resembling a confusing "b" or "lo" shape rather than an intentional Olympic "L".
2. **Outdated gloss effects**: 2000s-style Aqua arc gloss layers that clash with LiftLab's modern, dark-mode, high-precision training aesthetic.
3. **In-app illegibility**: The in-app headers (`Settings.tsx`, `RoutineEditor.tsx`) squeeze a low-resolution raster circle into tiny 28px–40px containers, rendering it as a dark, unreadable blob.
4. **Lack of a unified vector brand lockup**: No crisp SVG lockup combining the emblem mark with modern, high-contrast "LIFTLAB" typography.

## 2. Selected Design Direction
**Approach 1: Precision Olympic / Apple Fitness Tech**
- **Core Concept**: An Olympic competition bumper plate fused geometrically with an architectural, high-voltage Emerald "L" monogram.
- **Visual Identity Attributes**:
  - Precision engineering, Apple HIG fitness aesthetic, dark titanium & rubber finishes with electric emerald neon (`#30D158` / `#34E065`).
  - High legibility across all scales: 16px favicon, 28px in-app header, 512px app icon, 1024px store billboard.
  - Pure SVG vector rendering with 0 network latency, 0 blur, and crisp retina sharpness.

## 3. Visual Components & Asset Specifications

### A. Olympic "L" Emblem Mark (`LiftLabMark`)
- **Canvas**: `viewBox="0 0 512 512"` (scalable vector).
- **Background Layer**: Subtle deep slate radial gradient (`#08090C` to `#10131A`).
- **Outer Calibrated Rim**: Dense competition rubber (`#13161F` to `#1D222E`) with a fine circular calibration chamfer (`#2C3446`).
- **Recessed Hub & Collar**: Precision machined titanium hub (`#1A202C` to `#334155`) with 50.4mm Olympic standard center bore.
- **Monogram "L"**:
  - Sculpted into the plate geometry: vertical stem along the left quadrant, horizontal base spanning beneath the center bushing.
  - Beveled/faceted 45° dynamic terminals.
  - High-energy gradient: `#38EF7D` (top highlight) to `#30D158` (core) to `#059669` (depth), layered with an ultra-fine white specular light path (`#FFFFFF` 0.8 opacity) for optic crystal brilliance.
  - Safe zone: Fits comfortably within the central 80% circle, ensuring full compliance with iOS squircle and Android circular adaptive icon masks.

### B. In-App Brand Lockup (`LiftLabLogo`)
- React component: `src/components/common/LiftLabBrand.tsx`
- **Variants**:
  - `lockup`: Emblem Mark + "LIFTLAB" typography (with customizable `badge` for "LAB" or duo-tone inline).
  - `mark`: Emblem Mark alone (responsive `size="sm"|"md"|"lg"`).
  - `text`: Wordmark alone.
- **Typography Details**:
  - "LIFT": Modern geometric sans-serif (ExtraBold/Black, uppercase, `#FFFFFF`, tracking 0.1em).
  - "LAB": Tech badge container (`bg-[#30D158]/15 border border-[#30D158]/35 text-[#30D158] font-black tracking-widest text-[10px] px-1.5 py-0.5 rounded-md`).

### C. File Replacements & Multiplatform Assets
1. **Master Vector Assets**:
   - `assets/logo.svg` (Full color 1024x1024 SVG)
   - `assets/logo-glyph.svg` (Transparent background glyph)
   - `assets/logo-monochrome.svg` (Monochrome vector for Android 13+ themed icons)
   - `public/logo.svg` (Web icon & browser tab)
2. **In-App Component Migration**:
   - `src/components/Settings.tsx`: Replace `logo_in_app.png` with `<LiftLabBrand variant="lockup" size="sm" />`.
   - `src/components/RoutineEditor.tsx`: Replace `logo_in_app.png` with `<LiftLabBrand variant="lockup" size="md" />`.
   - `src/components/Dashboard.tsx`: Enhance console header badge with the new vector emblem.
   - `index.html`: Update splash screen badge styling and markup.
3. **App Icon & Web Manifest Assets**:
   - Regenerate `public/app-logo.png`, `public/icon-192.png`, `public/icon-512.png`, `public/apple-touch-icon.png`, `public/favicon.ico`.
   - Update `src/assets/images/logo_in_app.png` and `liftlab_console_icon.png` high-res fallbacks.

## 4. Acceptance Criteria
- [ ] New SVG files are syntactically clean, standard-compliant, and scale without distortion or blur.
- [ ] Component `<LiftLabBrand />` renders cleanly with no layout shifts.
- [ ] `Settings.tsx` and `RoutineEditor.tsx` headers display the crisp vector lockup.
- [ ] `Dashboard.tsx` and `index.html` splash screen present the refreshed emblem.
- [ ] Existing test suites (`npm test`) and TypeScript lint check (`npm run lint`) pass without errors.
