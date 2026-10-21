# LiftLab Logo & In-App Brand Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the LiftLab logo and in-app brand graphics into a high-precision Olympic bumper plate and neon Emerald "L" vector identity, complete with a dedicated vector lockup component and multiplatform raster asset generation.

**Architecture:** Create mathematically clean SVG vector masters (full-color, transparent glyph, and monochrome silhouette). Build a reusable React component (`LiftLabBrand`) supporting lockup, mark, and wordmark variants. Replace blurry raster PNG usages across Settings, RoutineEditor, Dashboard, and index.html splash screen. Export high-density PNG icons to keep PWA and notification fallbacks perfectly in sync.

**Tech Stack:** SVG / Vector XML, React 19, TypeScript, Tailwind CSS, Python (Pillow / resvg or Cairo for raster asset export), Vite.

## Global Constraints
- Retain dark-mode harmony: deep slate `#08090C`, `#121316`, high-voltage Emerald `#30D158` / `#34E065`.
- Ensure 80% safe zone compliance for iOS squircle and Android circular adaptive masks.
- All TypeScript types must compile cleanly with `npm run lint`.
- All existing tests (`npm test`) must continue to pass.

---

### Task 1: Craft the Master Vector Artwork (SVG Files)

**Files:**
- Create/Modify: `assets/logo.svg`
- Create/Modify: `assets/logo-glyph.svg`
- Create/Modify: `assets/logo-monochrome.svg`
- Create/Modify: `public/logo.svg`

**Interfaces:**
- Produces: Scalable vector assets with `viewBox="0 0 512 512"` (and 1024x1024). Layered groups `<rect id="bg" />`, `<g id="plate" />`, `<g id="monogram-l" />`.

- [ ] **Step 1: Write `assets/logo.svg`** with Olympic bumper plate geometry and precision neon "L" monogram.
- [ ] **Step 2: Write `assets/logo-glyph.svg`** (same artwork without dark background canvas for transparent usage).
- [ ] **Step 3: Write `assets/logo-monochrome.svg`** with single-color silhouette (`fill="currentColor"`).
- [ ] **Step 4: Update `public/logo.svg`** to match the master vector artwork.
- [ ] **Step 5: Verify SVG rendering** by inspecting dimensions and syntax.

---

### Task 2: Build the Reusable React Brand Component (`LiftLabBrand`)

**Files:**
- Create: `src/components/common/LiftLabBrand.tsx`
- Test: `src/components/common/LiftLabBrand.test.tsx` (or direct unit test in `src/lib/` or tsx test runner)

**Interfaces:**
- Produces: `<LiftLabBrand variant="lockup" | "mark" | "text" size="sm" | "md" | "lg" className?: string />`

- [ ] **Step 1: Create `src/components/common/LiftLabBrand.tsx`** with embedded crisp vector glyph and responsive typography.
- [ ] **Step 2: Add test or verification check** to validate export and rendering of all variants.
- [ ] **Step 3: Verify TypeScript compilation** with `npx tsc --noEmit`.

---

### Task 3: Integrate `LiftLabBrand` in In-App Views & Headers

**Files:**
- Modify: `src/components/Settings.tsx`
- Modify: `src/components/RoutineEditor.tsx`
- Modify: `src/components/Dashboard.tsx`
- Modify: `index.html`

**Interfaces:**
- Consumes: `<LiftLabBrand />` component from `src/components/common/LiftLabBrand.tsx`.

- [ ] **Step 1: Update `Settings.tsx` header** to use `<LiftLabBrand variant="lockup" size="sm" />`.
- [ ] **Step 2: Update `RoutineEditor.tsx` header** to use `<LiftLabBrand variant="lockup" size="md" />`.
- [ ] **Step 3: Update `Dashboard.tsx` console badge** with the new vector emblem.
- [ ] **Step 4: Update `index.html` splash screen** with enhanced styling and badge branding.

---

### Task 4: Generate Multiplatform High-Density Raster Assets

**Files:**
- Modify: `public/app-logo.png`
- Modify: `public/icon-192.png`
- Modify: `public/icon-512.png`
- Modify: `public/apple-touch-icon.png`
- Modify: `public/favicon.ico`
- Modify: `src/assets/images/logo_in_app.png`
- Modify: `src/assets/images/liftlab_console_icon.png`

**Interfaces:**
- Produces: Crisp 1024x1024, 512x512, 192x192 PNG assets rendered from the new master SVG.

- [ ] **Step 1: Write and run Python rasterization script** to convert the new master artwork into high-res PNGs and favicons.
- [ ] **Step 2: Verify asset sizes and visual output** across generated files.

---

### Task 5: End-to-End Verification & Quality Gate

- [ ] **Step 1: Run typecheck** `npm run lint`.
- [ ] **Step 2: Run test suite** `npm test`.
- [ ] **Step 3: Run production build** `npm run build` to confirm Vite bundles all assets cleanly.
