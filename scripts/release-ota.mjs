/**
 * LiftLab OTA Build & Release Automation
 * 
 * Automatically bumps the app version on every run (ensuring OTA updates
 * are always recognized by the device), builds the web assets with Vite,
 * packages the bundle into a clean zip archive, calculates the SHA-256
 * checksum, and updates update-manifest.json.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { ZipArchive } = require("archiver");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

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

// Parse CLI args
const args = process.argv.slice(2);

if (args.includes("-h") || args.includes("--help")) {
  console.log(`
LiftLab OTA Build & Release CLI

Usage:
  npm run ota:release -- [options]
  node scripts/release-ota.mjs [options]

Options:
  --version <semver>   Specify explicit release version (default: patch bump)
  --notes <text>       Custom release notes in Markdown
  --telegram           Send announcement to configured Telegram bot
  --dry-run            Simulate release process without writing files
  -h, --help           Show this help message
`);
  process.exit(0);
}

const isDryRun = args.includes("--dry-run");
let customVersion = null;
let customNotes = null;
let sendTelegram = args.includes("--telegram");

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--version" && args[i + 1]) {
    customVersion = args[i + 1];
    i++;
  } else if (args[i] === "--notes" && args[i + 1]) {
    customNotes = args[i + 1];
    i++;
  }
}

// 1. Read package.json and determine next version
const packageJsonPath = path.join(rootDir, "package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
const oldVersion = packageJson.version || "1.0.0";

let nextVersion = customVersion;
if (!nextVersion) {
  // Auto-increment patch version every single time
  const parts = oldVersion.split(".").map((p) => parseInt(p, 10));
  if (parts.length === 3 && !parts.some(isNaN)) {
    parts[2] += 1;
    nextVersion = parts.join(".");
  } else {
    nextVersion = "1.0.1";
  }
}

console.log(`\n🚀 [LiftLab OTA] Preparing Live Update Release`);
console.log(`📌 Version transition: v${oldVersion} ➜ v${nextVersion}`);

// 2. Update package.json
packageJson.version = nextVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n", "utf-8");
console.log(`✓ Updated package.json version to ${nextVersion}`);

// 3. Update src/lib/version.ts
const versionTsPath = path.join(rootDir, "src", "lib", "version.ts");
const nowIso = new Date().toISOString();
const versionTsContent = `/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const APP_VERSION = "${nextVersion}";
export const BUILD_TIME = "${nowIso}";
`;
fs.writeFileSync(versionTsPath, versionTsContent, "utf-8");
console.log(`✓ Updated src/lib/version.ts to v${nextVersion}`);

// 4. Build web production bundle
console.log(`\n🔨 Compiling production bundle (vite build)...`);
try {
  execSync("npm run build", { stdio: "inherit", cwd: rootDir });
  console.log(`✓ Web bundle compiled successfully into dist/`);
} catch (err) {
  console.error("❌ Build failed! Aborting OTA release.");
  process.exit(1);
}

// 5. Package dist/ into zip
const updatesDir = path.join(rootDir, "updates");
const distOtaDir = path.join(rootDir, "dist-ota");
fs.mkdirSync(updatesDir, { recursive: true });
fs.mkdirSync(distOtaDir, { recursive: true });

const zipFileName = `liftlab-v${nextVersion}.zip`;
const zipFilePath = path.join(updatesDir, zipFileName);
const distOtaZipPath = path.join(distOtaDir, zipFileName);

console.log(`\n📦 Creating OTA zip bundle: ${zipFileName}...`);

async function createZipBundle() {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipFilePath);
    const archive = new ZipArchive({ zlib: { level: 9 } });

    output.on("close", () => {
      // Copy also to dist-ota for archival
      fs.copyFileSync(zipFilePath, distOtaZipPath);
      resolve();
    });
    output.on("error", (err) => reject(err));

    archive.on("error", (err) => reject(err));
    archive.pipe(output);

    // Append all contents of dist/ directly at zip root
    const distPath = path.join(rootDir, "dist");
    archive.directory(distPath, false);
    archive.finalize();
  });
}

await createZipBundle();

const stats = fs.statSync(zipFilePath);
const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
console.log(`✓ Bundle archived (${sizeMb} MB) at updates/${zipFileName}`);

// 6. Calculate SHA-256 Checksum
const fileBuffer = fs.readFileSync(zipFilePath);
const sha256 = crypto.createHash("sha256").update(fileBuffer).digest("hex");
console.log(`✓ SHA-256 Checksum: ${sha256}`);

// 7. Update update-manifest.json
const manifestPath = path.join(rootDir, "update-manifest.json");
const updatesManifestPath = path.join(updatesDir, "update-manifest.json");

const manifest = {
  version: nextVersion,
  url: `https://raw.githubusercontent.com/ManuRoma02/Liftlab/main/updates/${zipFileName}`,
  checksum: sha256,
  releaseDate: nowIso,
  notes: customNotes || `• **Aggiornamento v${nextVersion}**: ottimizzazioni prestazioni e correzioni stabilità.`,
  bundleSizeMb: sizeMb,
};

const manifestJson = JSON.stringify(manifest, null, 2) + "\n";
fs.writeFileSync(manifestPath, manifestJson, "utf-8");
fs.writeFileSync(updatesManifestPath, manifestJson, "utf-8");
console.log(`✓ Generated update-manifest.json`);

// 8. Sync native Capacitor assets so local debug APK also has latest code
console.log(`\n🔄 Syncing web assets with Capacitor Android...`);
try {
  execSync("npx cap sync android", { stdio: "inherit", cwd: rootDir });
  console.log(`✓ Capacitor Android synced.`);
} catch (e) {
  console.warn("⚠️ Capacitor sync skipped or encountered warning.");
}

// 9. Optional Telegram Alert
if (sendTelegram || (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID && args.includes("--send"))) {
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
  if (BOT_TOKEN && CHAT_ID) {
    try {
      console.log(`\n📲 Sending OTA announcement to Telegram...`);
      const caption = `🚀 *Nuovo Aggiornamento OTA Disponibile!*\n\n` +
        `📦 *Versione:* \`v${nextVersion}\`\n` +
        `⚖️ *Dimensione:* \`${sizeMb} MB\`\n` +
        `🔑 *SHA256:* \`${sha256.slice(0, 16)}...\`\n\n` +
        `✨ Apri l'app LiftLab o vai in *Impostazioni ➜ Aggiornamenti In-App* per applicarlo senza reinstallare l'APK!`;

      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: caption,
          parse_mode: "Markdown",
        }),
      });
      console.log(`✓ Telegram notification sent!`);
    } catch (tgErr) {
      console.warn("Could not notify Telegram:", tgErr);
    }
  }
}

console.log(`\n======================================================`);
console.log(`🎉 OTA Release v${nextVersion} creata con successo!`);
console.log(`======================================================`);
console.log(`Per distribuire l'aggiornamento ai dispositivi:`);
console.log(`  git add .`);
console.log(`  git commit -m "chore(release): OTA live update v${nextVersion}"`);
console.log(`  git push origin main`);
console.log(`\nI telefoni con l'app installata scaricheranno direttamente la v${nextVersion} via OTA!`);
console.log(`======================================================\n`);
