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
    `🏋️‍♂️ *LiftLab v1.0.3 — OTA & Animazioni Cartoon*
📅 ${new Date().toLocaleString("it-IT", { timeZone: "Europe/Rome" })} | 📦 ${sizeMb} MB

🎯 *Migliorie della versione:*
• 🚀 *Aggiornamenti In-App (OTA)*: Nuova versione v1.0.3 con aggiornamenti automatici dal web senza dover riscaricare l'APK.
• 🎬 *Animazioni Cartoon Esche & Tattili*:
  - *Completamento Serie*: Elastic bounce da 460ms con overshoot visibile a occhio umano e ripple verde smeraldo.
  - *Drop-Set a Cascata*: Serie drop collegata animata a cascata (80ms delay) per dare conferma visiva dell'azione combinata.
  - *Timer di Recupero*: Tasti -15s/+15s/Stop elastici con fisica cartoon.
  - *Preferiti*: Stella con rimbalzo e wobble cartoon (480ms).
• 🏋️ *Drop-Set Unificati*: Segnati con un unico tocco.`,
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
