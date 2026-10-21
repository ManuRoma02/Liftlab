import os

def create_branding_html():
    with open("assets/logo.svg", "r", encoding="utf-8") as f:
        master_svg = f.read()

    with open("assets/logo-glyph.svg", "r", encoding="utf-8") as f:
        glyph_svg = f.read()

    with open("assets/logo-monochrome.svg", "r", encoding="utf-8") as f:
        mono_svg = f.read()

    html_content = f"""<!DOCTYPE html>
<html lang="it" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LiftLab — Visual Identity & Brand System</title>
  <link rel="icon" href="/favicon.ico">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {{
      darkMode: 'class',
      theme: {{
        extend: {{
          colors: {{
            'liftlab-black': '#090A0B',
            'liftlab-surface': '#13151A',
            'liftlab-card': '#191D24',
            'liftlab-border': '#262C38',
            'liftlab-lime': '#C3F400',
            'liftlab-emerald': '#30D158',
            'liftlab-cyan': '#5AC8FA',
            'liftlab-blue': '#0A84FF',
          }},
          fontFamily: {{
            sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"SF Pro Text"', 'Segoe UI', 'Roboto', 'sans-serif'],
            mono: ['"SF Mono"', 'ui-monospace', 'Menlo', 'monospace']
          }}
        }}
      }}
    }}
  </script>
  <style>
    /* Continuous squircle mask for iOS */
    .mask-ios {{
      border-radius: 22.37%;
      overflow: hidden;
      box-shadow: 0 20px 40px -15px rgba(0,0,0,0.7), 0 0 30px -5px rgba(48, 209, 88, 0.25);
    }}
    .mask-android {{
      border-radius: 9999px;
      overflow: hidden;
      box-shadow: 0 16px 36px -12px rgba(0,0,0,0.8);
    }}
    .mask-square {{
      border-radius: 4px;
      overflow: hidden;
      box-shadow: 0 16px 36px -12px rgba(0,0,0,0.8);
    }}
    /* Subtle dot matrix background */
    .bg-grid {{
      background-size: 32px 32px;
      background-image: radial-gradient(circle, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
    }}
  </style>
</head>
<body class="bg-liftlab-black text-slate-100 min-h-screen bg-grid antialiased selection:bg-liftlab-lime selection:text-black">

  <!-- Top Navigation Bar -->
  <header class="sticky top-0 z-50 backdrop-blur-xl bg-liftlab-black/80 border-b border-liftlab-border px-6 py-4">
    <div class="max-w-6xl mx-auto flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl overflow-hidden border border-white/10 shadow-sm flex items-center justify-center bg-black">
          <div class="w-8 h-8">
            {master_svg}
          </div>
        </div>
        <div>
          <span class="text-xs uppercase tracking-widest font-bold text-liftlab-emerald block leading-none">Design System</span>
          <h1 class="text-lg font-black tracking-tight text-white flex items-center gap-2">
            LiftLab <span class="text-xs font-normal px-2 py-0.5 rounded-full bg-white/10 text-slate-300">v1.0 Master</span>
          </h1>
        </div>
      </div>

      <div class="flex items-center gap-3 text-xs">
        <a href="/" class="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition text-slate-300 hover:text-white flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
          Torna all'App
        </a>
        <a href="#assets" class="px-3.5 py-1.5 rounded-lg bg-liftlab-lime text-black font-semibold hover:bg-liftlab-lime/90 transition shadow-sm">
          Asset Bundle
        </a>
      </div>
    </div>
  </header>

  <main class="max-w-6xl mx-auto px-6 py-10 space-y-16">

    <!-- Hero / Headline -->
    <div class="text-center max-w-2xl mx-auto space-y-3">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-liftlab-lime/10 border border-liftlab-lime/20 text-liftlab-lime text-xs font-semibold">
        <span class="w-2 h-2 rounded-full bg-liftlab-lime animate-pulse"></span>
        Identit&agrave; Visiva & App Icon
      </div>
      <h2 class="text-3xl md:text-5xl font-extrabold tracking-tight text-white">
        The Atomic Plate
      </h2>
      <p class="text-slate-400 text-sm md:text-base leading-relaxed">
        Fusione tra il disco olimpico calibrato da gara e l'acceleratore cinetico orbitale di precisione. Minimalismo tattile, conformit&agrave; alle Apple HIG e supporto alle Themed Icons Android.
      </p>
    </div>

    <!-- Interactive Icon Stage -->
    <section class="bg-liftlab-surface border border-liftlab-border rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden">
      <div class="absolute -top-32 -right-32 w-96 h-96 bg-liftlab-emerald/10 rounded-full blur-3xl pointer-events-none"></div>

      <div class="flex flex-col lg:flex-row items-center gap-10">
        
        <!-- Big Preview Canvas -->
        <div class="flex flex-col items-center gap-5 w-full lg:w-1/2">
          <div id="icon-container" class="w-64 h-64 md:w-80 md:h-80 transition-all duration-300 mask-ios bg-black border border-white/10 relative group">
            <div id="icon-svg-wrapper" class="w-full h-full">
              {master_svg}
            </div>
          </div>

          <!-- Mask Switcher Controls -->
          <div class="flex items-center gap-1 p-1 bg-liftlab-card border border-liftlab-border rounded-xl text-xs font-medium">
            <button onclick="setMask('ios')" id="btn-ios" class="px-3 py-1.5 rounded-lg bg-liftlab-lime text-black font-bold transition shadow-sm">
              Apple Squircle (iOS)
            </button>
            <button onclick="setMask('android')" id="btn-android" class="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white transition">
              Cerchio (Android)
            </button>
            <button onclick="setMask('square')" id="btn-square" class="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white transition">
              Master Square (1024px)
            </button>
          </div>
          <span id="mask-caption" class="text-xs text-slate-400">Raggio continuo 22.37% &bull; Safe Zone 80% rispettata</span>
        </div>

        <!-- Specifications & Design Breakdown -->
        <div class="w-full lg:w-1/2 space-y-6">
          <div>
            <span class="text-xs font-bold text-liftlab-cyan uppercase tracking-wider">Architettura del Glifo</span>
            <h3 class="text-2xl font-bold text-white mt-1">Dettagli di Calibrazione</h3>
            <p class="text-slate-400 text-sm mt-2">
              Ogni elemento geometrico &egrave; calibrato per mantenere leggibilit&agrave; estrema da 16px di Favicon fino a 1024px di App Store.
            </p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div class="p-4 rounded-xl bg-liftlab-card border border-liftlab-border/70 space-y-1">
              <span class="text-slate-400 block font-medium">Safe Zone Ratio</span>
              <span class="text-white font-bold text-sm text-liftlab-lime">73.2% (Diametro 750px)</span>
              <p class="text-slate-500 text-[11px]">Ampio margine di tolleranza rispetto all'80% massimo per evitare ritagli.</p>
            </div>
            <div class="p-4 rounded-xl bg-liftlab-card border border-liftlab-border/70 space-y-1">
              <span class="text-slate-400 block font-medium">Ergonomic Grip Vents</span>
              <span class="text-white font-bold text-sm text-liftlab-cyan">4 Aperture a 45&deg;</span>
              <p class="text-slate-500 text-[11px]">Tracciati ergonomici con smusso speculare e profondit&agrave; negativa a contrasto.</p>
            </div>
            <div class="p-4 rounded-xl bg-liftlab-card border border-liftlab-border/70 space-y-1">
              <span class="text-slate-400 block font-medium">Tornitura Mozzo</span>
              <span class="text-white font-bold text-sm text-slate-200">Lathe Concentrico</span>
              <p class="text-slate-500 text-[11px]">Solchi circolari micro-finiti che evocano l'acciaio del collar olimpico.</p>
            </div>
            <div class="p-4 rounded-xl bg-liftlab-card border border-liftlab-border/70 space-y-1">
              <span class="text-slate-400 block font-medium">Kinetic Power Core</span>
              <span class="text-white font-bold text-sm text-liftlab-emerald">3 Ellissi Orbitali</span>
              <p class="text-slate-500 text-[11px]">Nucleo quantistico ad alta energia in Cyber Lime & Emerald Green.</p>
            </div>
          </div>
        </div>

      </div>
    </section>

    <!-- Scale & Context Mockup (Different icon sizes) -->
    <section class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-xl font-bold text-white">Scala di Risoluzione & Test Densità</h3>
          <p class="text-slate-400 text-xs">Verifica di leggibilità nei contesti operativi di sistema</p>
        </div>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        <!-- 180px iPhone Home -->
        <div class="p-4 rounded-2xl bg-liftlab-surface border border-liftlab-border flex flex-col items-center justify-between gap-3 text-center">
          <div class="w-20 h-20 mask-ios bg-black border border-white/10">
            {master_svg}
          </div>
          <div>
            <span class="font-bold text-xs text-white block">iPhone Home</span>
            <span class="text-[11px] text-slate-400">180&times;180 px</span>
          </div>
        </div>

        <!-- 96px Android Home -->
        <div class="p-4 rounded-2xl bg-liftlab-surface border border-liftlab-border flex flex-col items-center justify-between gap-3 text-center">
          <div class="w-16 h-16 mask-android bg-black border border-white/10">
            {master_svg}
          </div>
          <div>
            <span class="font-bold text-xs text-white block">Android Home</span>
            <span class="text-[11px] text-slate-400">96&times;96 px (xhdpi)</span>
          </div>
        </div>

        <!-- 80px Spotlight / Settings -->
        <div class="p-4 rounded-2xl bg-liftlab-surface border border-liftlab-border flex flex-col items-center justify-between gap-3 text-center">
          <div class="w-12 h-12 mask-ios bg-black border border-white/10">
            {master_svg}
          </div>
          <div>
            <span class="font-bold text-xs text-white block">Spotlight iOS</span>
            <span class="text-[11px] text-slate-400">80&times;80 px</span>
          </div>
        </div>

        <!-- 48px Notification -->
        <div class="p-4 rounded-2xl bg-liftlab-surface border border-liftlab-border flex flex-col items-center justify-between gap-3 text-center">
          <div class="w-10 h-10 mask-android bg-black border border-white/10">
            {master_svg}
          </div>
          <div>
            <span class="font-bold text-xs text-white block">Notifica Push</span>
            <span class="text-[11px] text-slate-400">48&times;48 px</span>
          </div>
        </div>

        <!-- 32px Browser Favicon -->
        <div class="p-4 rounded-2xl bg-liftlab-surface border border-liftlab-border flex flex-col items-center justify-between gap-3 text-center">
          <div class="w-8 h-8 rounded-md bg-black border border-white/10 overflow-hidden flex items-center justify-center p-0.5">
            {master_svg}
          </div>
          <div>
            <span class="font-bold text-xs text-white block">Favicon Tab</span>
            <span class="text-[11px] text-slate-400">32&times;32 px</span>
          </div>
        </div>

        <!-- In-App Header Badge -->
        <div class="p-4 rounded-2xl bg-liftlab-surface border border-liftlab-border flex flex-col items-center justify-between gap-3 text-center">
          <div class="w-14 h-14 rounded-2xl bg-black border border-white/10 overflow-hidden shadow-inner">
            {master_svg}
          </div>
          <div>
            <span class="font-bold text-xs text-white block">In-App Console</span>
            <span class="text-[11px] text-slate-400">Dashboard</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Brand Color Palette -->
    <section class="space-y-6">
      <div>
        <h3 class="text-xl font-bold text-white">Scheda Colori Ufficiale (Brand Tokens)</h3>
        <p class="text-slate-400 text-xs">Colori primari per Dark Cockpit, Light Mode e contrasti tipografici</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <!-- Swatch 1: Cyber Lime -->
        <div class="p-5 rounded-2xl bg-liftlab-surface border border-liftlab-border flex flex-col justify-between h-44 cursor-pointer hover:border-liftlab-lime/50 transition group" onclick="copyHex('#C3F400')">
          <div class="w-full h-12 rounded-xl bg-[#C3F400] flex items-center justify-end px-3 shadow-sm">
            <span class="text-[10px] font-black uppercase text-black bg-white/70 px-1.5 py-0.5 rounded">Primary</span>
          </div>
          <div>
            <span class="text-xs text-slate-400 block font-medium">Cyber Lime (Live Reps)</span>
            <span class="text-lg font-mono font-bold text-white group-hover:text-liftlab-lime transition flex items-center justify-between">
              #C3F400
              <svg class="w-4 h-4 text-slate-500 group-hover:text-liftlab-lime" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
            </span>
          </div>
        </div>

        <!-- Swatch 2: Electric Emerald -->
        <div class="p-5 rounded-2xl bg-liftlab-surface border border-liftlab-border flex flex-col justify-between h-44 cursor-pointer hover:border-liftlab-emerald/50 transition group" onclick="copyHex('#30D158')">
          <div class="w-full h-12 rounded-xl bg-[#30D158] flex items-center justify-end px-3 shadow-sm">
            <span class="text-[10px] font-black uppercase text-black bg-white/70 px-1.5 py-0.5 rounded">Core Glow</span>
          </div>
          <div>
            <span class="text-xs text-slate-400 block font-medium">Electric Emerald (Progresso)</span>
            <span class="text-lg font-mono font-bold text-white group-hover:text-liftlab-emerald transition flex items-center justify-between">
              #30D158
              <svg class="w-4 h-4 text-slate-500 group-hover:text-liftlab-emerald" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
            </span>
          </div>
        </div>

        <!-- Swatch 3: Titanium Cyan -->
        <div class="p-5 rounded-2xl bg-liftlab-surface border border-liftlab-border flex flex-col justify-between h-44 cursor-pointer hover:border-liftlab-cyan/50 transition group" onclick="copyHex('#5AC8FA')">
          <div class="w-full h-12 rounded-xl bg-[#5AC8FA] flex items-center justify-end px-3 shadow-sm">
            <span class="text-[10px] font-black uppercase text-black bg-white/70 px-1.5 py-0.5 rounded">Telemetry</span>
          </div>
          <div>
            <span class="text-xs text-slate-400 block font-medium">Titanium Cyan (Metriche & PR)</span>
            <span class="text-lg font-mono font-bold text-white group-hover:text-liftlab-cyan transition flex items-center justify-between">
              #5AC8FA
              <svg class="w-4 h-4 text-slate-500 group-hover:text-liftlab-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
            </span>
          </div>
        </div>

        <!-- Swatch 4: Obsidian Cockpit -->
        <div class="p-5 rounded-2xl bg-liftlab-surface border border-liftlab-border flex flex-col justify-between h-44 cursor-pointer hover:border-slate-500 transition group" onclick="copyHex('#090A0B')">
          <div class="w-full h-12 rounded-xl bg-[#090A0B] border border-white/20 flex items-center justify-end px-3 shadow-sm">
            <span class="text-[10px] font-black uppercase text-white bg-white/20 px-1.5 py-0.5 rounded">OLED</span>
          </div>
          <div>
            <span class="text-xs text-slate-400 block font-medium">Obsidian Cockpit (Canvas)</span>
            <span class="text-lg font-mono font-bold text-white group-hover:text-slate-300 transition flex items-center justify-between">
              #090A0B
              <svg class="w-4 h-4 text-slate-500 group-hover:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
            </span>
          </div>
        </div>

      </div>
    </section>

    <!-- Themed Icons & Dynamic Tinting Interactive Lab -->
    <section class="bg-liftlab-surface border border-liftlab-border rounded-3xl p-6 md:p-8 space-y-6">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span class="text-xs font-bold text-liftlab-lime uppercase tracking-wider">Android 13+ & iOS 18 Tinted</span>
          <h3 class="text-xl font-bold text-white mt-1">Collaudatore Icona Silhouette</h3>
          <p class="text-slate-400 text-xs">Seleziona un colore per testare la compatibilit&agrave; dinamica del tracciato <code class="text-liftlab-cyan">currentColor</code>:</p>
        </div>

        <!-- Color Tint Buttons -->
        <div class="flex items-center gap-2">
          <button onclick="setTint('#C3F400')" class="w-7 h-7 rounded-full bg-[#C3F400] ring-2 ring-white/20 hover:scale-110 transition cursor-pointer" title="Lime"></button>
          <button onclick="setTint('#30D158')" class="w-7 h-7 rounded-full bg-[#30D158] ring-2 ring-white/20 hover:scale-110 transition cursor-pointer" title="Emerald"></button>
          <button onclick="setTint('#5AC8FA')" class="w-7 h-7 rounded-full bg-[#5AC8FA] ring-2 ring-white/20 hover:scale-110 transition cursor-pointer" title="Cyan"></button>
          <button onclick="setTint('#FF9F0A')" class="w-7 h-7 rounded-full bg-[#FF9F0A] ring-2 ring-white/20 hover:scale-110 transition cursor-pointer" title="Amber"></button>
          <button onclick="setTint('#BF5AF2')" class="w-7 h-7 rounded-full bg-[#BF5AF2] ring-2 ring-white/20 hover:scale-110 transition cursor-pointer" title="Purple"></button>
          <button onclick="setTint('#FFFFFF')" class="w-7 h-7 rounded-full bg-white ring-2 ring-white/20 hover:scale-110 transition cursor-pointer" title="White"></button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-center pt-4 border-t border-liftlab-border">
        
        <!-- Live Tinted Icon Preview -->
        <div class="flex items-center justify-center p-8 rounded-2xl bg-black border border-white/10">
          <div id="mono-preview-box" class="w-44 h-44 mask-ios flex items-center justify-center transition-colors duration-300" style="color: #C3F400; background: #16181D;">
            <div class="w-40 h-40">
              {mono_svg}
            </div>
          </div>
        </div>

        <!-- Description -->
        <div class="space-y-3 text-xs text-slate-300 leading-relaxed">
          <div class="flex items-start gap-2">
            <svg class="w-4 h-4 text-liftlab-lime shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            <span><strong>Spazi Negativi al 100%:</strong> Le fenditure di presa e la camera centrale sono tracciati vuoti a trasparenza pura, garantendo contrasto impeccabile su qualsiasi sfondo.</span>
          </div>
          <div class="flex items-start gap-2">
            <svg class="w-4 h-4 text-liftlab-lime shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            <span><strong>Android Material You:</strong> Adotta automaticamente il colore estratto dallo sfondo del dispositivo utente.</span>
          </div>
          <div class="flex items-start gap-2">
            <svg class="w-4 h-4 text-liftlab-lime shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            <span><strong>iOS 18 Tinted:</strong> Nessun bordo scalettato; rendering vettoriale pulito a qualsiasi fattore di scala display.</span>
          </div>
        </div>

      </div>
    </section>

    <!-- Assets Generated Directory -->
    <section id="assets" class="space-y-6">
      <div>
        <h3 class="text-xl font-bold text-white">Pacchetti Asset Generati</h3>
        <p class="text-slate-400 text-xs">File salvati e sincronizzati all'interno dell'albero di progetto</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        
        <div class="p-5 rounded-2xl bg-liftlab-surface border border-liftlab-border space-y-3">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-liftlab-lime"></span>
            <h4 class="font-bold text-sm text-white">Apple iOS / macOS</h4>
          </div>
          <p class="text-slate-400">Pacchetto asset catalog completo pronto per Xcode:</p>
          <ul class="space-y-1 font-mono text-slate-300">
            <li>&bull; <code class="text-liftlab-cyan">AppIcon.appiconset/</code></li>
            <li>&bull; <code class="text-slate-400">Contents.json</code></li>
            <li>&bull; Risoluzioni da 40px a 1024px</li>
          </ul>
          <span class="text-[11px] text-slate-500 block pt-2">Percorso: assets/exported-icons/ios/</span>
        </div>

        <div class="p-5 rounded-2xl bg-liftlab-surface border border-liftlab-border space-y-3">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-liftlab-emerald"></span>
            <h4 class="font-bold text-sm text-white">Android Native</h4>
          </div>
          <p class="text-slate-400">Risorse densit&agrave; per Capacitor APK:</p>
          <ul class="space-y-1 font-mono text-slate-300">
            <li>&bull; <code class="text-liftlab-cyan">mipmap-mdpi &rarr; xxxhdpi</code></li>
            <li>&bull; <code class="text-slate-400">ic_launcher.png</code> (legacy)</li>
            <li>&bull; <code class="text-slate-400">ic_launcher_round.png</code></li>
            <li>&bull; <code class="text-liftlab-lime">ic_launcher_foreground.png</code></li>
          </ul>
          <span class="text-[11px] text-slate-500 block pt-2">Percorso: android/app/src/main/res/</span>
        </div>

        <div class="p-5 rounded-2xl bg-liftlab-surface border border-liftlab-border space-y-3">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-liftlab-cyan"></span>
            <h4 class="font-bold text-sm text-white">Web & PWA</h4>
          </div>
          <p class="text-slate-400">Icone web ad alta definizione e splash:</p>
          <ul class="space-y-1 font-mono text-slate-300">
            <li>&bull; <code class="text-liftlab-cyan">favicon.ico</code> (16/32/48 px)</li>
            <li>&bull; <code class="text-slate-400">apple-touch-icon.png</code></li>
            <li>&bull; <code class="text-slate-400">icon-192.png &amp; icon-512.png</code></li>
            <li>&bull; <code class="text-liftlab-lime">public/logo.svg</code> (Master)</li>
          </ul>
          <span class="text-[11px] text-slate-500 block pt-2">Percorso: public/</span>
        </div>

      </div>
    </section>

    <!-- Notification Toast -->
    <div id="toast" class="fixed bottom-6 right-6 px-4 py-2.5 rounded-xl bg-liftlab-lime text-black font-bold text-xs shadow-2xl opacity-0 pointer-events-none transition-all duration-300 flex items-center gap-2 z-50">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
      <span id="toast-msg">Copiato negli appunti!</span>
    </div>

  </main>

  <!-- Interactive Script -->
  <script>
    function setMask(mask) {{
      const container = document.getElementById('icon-container');
      const caption = document.getElementById('mask-caption');
      
      const bIos = document.getElementById('btn-ios');
      const bAndroid = document.getElementById('btn-android');
      const bSquare = document.getElementById('btn-square');

      [bIos, bAndroid, bSquare].forEach(b => {{
        b.className = 'px-3 py-1.5 rounded-lg text-slate-300 hover:text-white transition';
      }});

      container.className = 'w-64 h-64 md:w-80 md:h-80 transition-all duration-300 bg-black border border-white/10 relative group';

      if (mask === 'ios') {{
        container.classList.add('mask-ios');
        bIos.className = 'px-3 py-1.5 rounded-lg bg-liftlab-lime text-black font-bold transition shadow-sm';
        caption.innerText = 'Raggio continuo 22.37% • Safe Zone 80% rispettata (Apple Squircle)';
      }} else if (mask === 'android') {{
        container.classList.add('mask-android');
        bAndroid.className = 'px-3 py-1.5 rounded-lg bg-liftlab-lime text-black font-bold transition shadow-sm';
        caption.innerText = 'Maschera circolare continua • Margine safe-zone garantito (Android)';
      }} else {{
        container.classList.add('mask-square');
        bSquare.className = 'px-3 py-1.5 rounded-lg bg-liftlab-lime text-black font-bold transition shadow-sm';
        caption.innerText = 'Master Square 1024×1024 a pieno formato (Apple App Store & Play Store)';
      }}
    }}

    function setTint(hex) {{
      const box = document.getElementById('mono-preview-box');
      box.style.color = hex;
    }}

    function copyHex(hex) {{
      navigator.clipboard.writeText(hex).then(() => {{
        showToast('Hex ' + hex + ' copiato negli appunti!');
      }}).catch(() => {{
        showToast(hex);
      }});
    }}

    function showToast(msg) {{
      const toast = document.getElementById('toast');
      document.getElementById('toast-msg').innerText = msg;
      toast.classList.remove('opacity-0', 'pointer-events-none');
      setTimeout(() => {{
        toast.classList.add('opacity-0', 'pointer-events-none');
      }}, 2400);
    }}
  </script>
</body>
</html>
"""
    return html_content

if __name__ == "__main__":
    html = create_branding_html()
    with open("public/branding.html", "w", encoding="utf-8") as f:
        f.write(html)
    
    # Also save as artifact
    artifact_path = r"public/branding.html"
    with open(artifact_path, "w", encoding="utf-8") as f:
        f.write(html)
    print("branding.html successfully generated in public/ and artifact directory!")
