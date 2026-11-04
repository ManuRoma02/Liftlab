import fs from "fs";
import path from "path";

// Extract taboo phrases from taboo-phrases.md
const tabooFile = ".agents/skills/unslop/references/taboo-phrases.md";
let tabooText = "";
if (fs.existsSync(tabooFile)) {
  tabooText = fs.readFileSync(tabooFile, "utf8");
}

// Extract quoted phrases from markdown table lines like | "phrase" |
const phraseMatches = tabooText.matchAll(/\| "([^"]+)"/g);
const tabooPhrases = new Set();
for (const match of phraseMatches) {
  tabooPhrases.add(match[1].toLowerCase());
}

// Add common AI writing tells in English & Italian fitness/app contexts
const customAITells = [
  // English tells
  "embark",
  "delve",
  "tapestry",
  "testament",
  "elevate",
  "beacon",
  "seamless",
  "game-changer",
  "game changer",
  "synergy",
  "unleash",
  "transform your",
  "journey begins",
  "consistency is key",
  "your fitness journey",
  "unlock your potential",
  "take your training to the next level",
  "powerhouse",
  "gym companion",
  "in today's fast-paced",
  "without further ado",
  "look no further",
  "it turns out",
  "make no mistake",
  "dive in",
  "let that sink in",
  "full stop.",
  "period.",
  
  // Italian AI tells
  "il tuo percorso",
  "il tuo compagno",
  "intraprendi",
  "testamento",
  "eleva",
  "scatena",
  "sblocca il tuo potenziale",
  "la coerenza è la chiave",
  "ottimo lavoro!",
  "senza ulteriori indugi",
  "portare il tuo allenamento al livello successivo",
  "non cercare oltre",
  "nel frenetico mondo di oggi",
  "un viaggio di mille miglia",
  "operazione completata con successo",
  "si popoleranno automaticamente",
  "inizia oggi stesso",
  "trasforma il tuo",
  "il segreto del successo",
  "è fondamentale",
  "un elemento imprescindibile"
];

customAITells.forEach(p => tabooPhrases.add(p.toLowerCase()));

console.log(`Loaded ${tabooPhrases.size} taboo phrases & AI patterns.`);

const scanTargets = [
  "src/data/translations.ts",
  "src/lib/achievements.ts",
  "src/data/defaultRoutines.ts",
  "src/components/OnboardingTutorial.tsx",
  "src/components/Dashboard.tsx",
  "src/components/Progress.tsx",
  "src/components/ActiveWorkout.tsx",
  "src/components/Routines.tsx",
  "src/components/WarmupCalculatorModal.tsx",
  "src/components/ExerciseSelectorModal.tsx"
];

const results = [];

for (const target of scanTargets) {
  if (!fs.existsSync(target)) continue;
  const content = fs.readFileSync(target, "utf8");
  const lines = content.split("\n");

  lines.forEach((line, lineIdx) => {
    const lower = line.toLowerCase();
    for (const phrase of tabooPhrases) {
      if (phrase.length < 4) continue;
      // Word boundary check
      const regex = new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      if (regex.test(lower)) {
        results.push({
          file: target,
          lineNum: lineIdx + 1,
          phrase,
          context: line.trim()
        });
      }
    }
  });
}

console.log(`\nFound ${results.length} suspected AI pattern occurrences:\n`);
results.forEach(r => {
  console.log(`[${r.file}:${r.lineNum}] Matched "${r.phrase}":`);
  console.log(`   ${r.context.slice(0, 120)}`);
});
