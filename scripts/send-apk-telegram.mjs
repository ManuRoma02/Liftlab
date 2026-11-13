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
        const rawVal = trimmed.slice(eqIdx + 1).trim();
        const val = rawVal.replace(/^["']|["']$/g, "").trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnv();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!BOT_TOKEN || !CHAT_ID) {
  console.error("❌ Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID. Please set them in your .env file.");
  process.exit(1);
}

const defaultApkPath = path.join(rootDir, "android", "app", "build", "outputs", "apk", "debug", "app-debug.apk");
const externalApkPath = path.join(process.env.USERPROFILE || "", ".gradle-builds", "liftlab", "app", "outputs", "apk", "debug", "app-debug.apk");
const apkPath = fs.existsSync(defaultApkPath) ? defaultApkPath : (fs.existsSync(externalApkPath) ? externalApkPath : defaultApkPath);

// Read version and notes dynamically
let version = "1.0.6";
try {
  const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf-8"));
  if (pkg.version) version = pkg.version;
} catch {}

let versionCode = "1";
try {
  const gradle = fs.readFileSync(path.join(rootDir, "android", "app", "build.gradle"), "utf-8");
  const match = gradle.match(/versionCode\s+(\d+)/);
  if (match) versionCode = match[1];
} catch {}

let releaseNotes = "• Ottimizzazioni prestazioni e aggiornamenti interfaccia.";
try {
  const manifestPath = path.join(rootDir, "updates", "update-manifest.json");
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    if (manifest.notes) releaseNotes = manifest.notes;
  }
} catch {}

async function sendApk() {
  if (!fs.existsSync(apkPath)) {
    console.error(`❌ APK file not found at: ${apkPath}`);
    console.error("Please run the build first: npm run build:apk");
    process.exit(1);
  }

  const stats = fs.statSync(apkPath);
  const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
  const apkFileName = `LiftLab-v${version}.apk`;

  console.log(`📦 Preparing to send ${apkFileName} (${sizeMb} MB, build ${versionCode}) to Telegram chat ${CHAT_ID}...`);

  const fileBuffer = fs.readFileSync(apkPath);
  const blob = new Blob([fileBuffer], { type: "application/vnd.android.package-archive" });

  const captionText = `🏋️‍♂️ *LiftLab v${version}* (Build ${versionCode})
📅 ${new Date().toLocaleString("it-IT", { timeZone: "Europe/Rome" })} | 📦 ${sizeMb} MB

📋 *Novità & Migliorie:*
${releaseNotes}

💡 *Consiglio per l'aggiornamento:*
Scarica e installa questo APK (*${apkFileName}*). Poiché il versionCode è aggiornato a ${versionCode}, Android riconosce l'aggiornamento pulito e azzera eventuali cache obsolete!`;

  const formData = new FormData();
  formData.append("chat_id", CHAT_ID);
  formData.append("caption", captionText);
  formData.append("parse_mode", "Markdown");
  formData.append("document", blob, apkFileName);

  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    if (data.ok) {
      console.log(`✅ ${apkFileName} inviato con successo sul tuo Telegram!`);
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
