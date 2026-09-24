import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

// Load .env manually to avoid extra dependencies
function loadEnv() {
  const envPath = path.join(rootDir, ".env");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnv();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "your_telegram_bot_token_here";
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || "your_telegram_chat_id_here";
const apkPath = path.join(rootDir, "android", "app", "build", "outputs", "apk", "debug", "app-debug.apk");

async function sendApk() {
  if (!fs.existsSync(apkPath)) {
    console.error(`❌ APK file not found at: ${apkPath}`);
    console.error("Please run the build first: npm run build:apk");
    process.exit(1);
  }

  const stats = fs.statSync(apkPath);
  const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`📦 Preparing to send APK (${sizeMb} MB) to Telegram chat ${CHAT_ID}...`);

  const fileBuffer = fs.readFileSync(apkPath);
  const blob = new Blob([fileBuffer], { type: "application/vnd.android.package-archive" });

  const formData = new FormData();
  formData.append("chat_id", CHAT_ID);
  formData.append(
    "caption",
    `🍏 *LiftLab v2.1 — Apple Design & iOS HIG Transformation*\n📅 Data: ${new Date().toLocaleString("it-IT", { timeZone: "Europe/Rome" })}\n📦 Dimensione: ${sizeMb} MB\n\n✨ *Design Paradigms & HIG Compliance:*\n• 🪟 *Apple Glass Materials*: Frosted glass card tokens (\`blur(28px)\`, \`saturate(190%)\`, highlight borders)\n• 🌀 *Spring Physics*: Animazioni e transizioni modali \`APPLE_SPRINGS.criticallyDamped\` (damping 1.0, zero oscillazioni)\n• 📱 *Apple Inset Grouped*: Tavole, card e dashboard uniformate con angoli rounded-3xl (\`28px-32px\`)\n• 👆 *Touch Targets Accessible*: Minimo 44x44pt su tutti i pulsanti, chiusure e stepper +/- live\n• 🎛️ *AppleBottomSheet*: Fogli inferiori nativi con drag-handle pill, swipe-to-dismiss e scrim blur\n• 🧭 *Safe Area & Dock Clearance*: Nessuna sovrapposizione col dock fluttuante (\`safe-area-inset-bottom\`)\n• 🔢 *Tabular Figures*: Tipografia \`tabular-nums\` su tutti i timer, metriche e carichi\n• 🧪 *Quality Assurance*: 282/282 test E2E superati (100% pass rate)`,
  );
  formData.append("parse_mode", "Markdown");
  formData.append("document", blob, "LiftLab.apk");

  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    if (data.ok) {
      console.log("✅ APK inviato con successo sul tuo Telegram!");
    } else {
      console.error("❌ Errore API Telegram:", data);
      process.exit(1);
    }
  } catch (err) {
    console.error("❌ Errore durante l'invio su Telegram:", err);
    process.exit(1);
  }
}

sendApk();
