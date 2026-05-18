const fs = require('fs');
const path = require('path');

const csvPath = './esercizi_fixed.csv';
const tsPath = './src/data/rawCsv.ts';

console.log('Starting exercise update...');

if (!fs.existsSync(csvPath)) {
  console.error('CSV file not found at:', path.resolve(csvPath));
  process.exit(1);
}

const csvData = fs.readFileSync(csvPath, 'utf8');
console.log('Read CSV data, length:', csvData.length);

const tsTemplate = `export const rawCsvData = \`${csvData.replace(/`/g, '\\`').replace(/\${/g, '\\${')}\`;

function guessMuscleAndCategory(title: string): { category: string, muscleFocus: string[], type: string } {
    const t = title.toLowerCase();
    
    // DELTS / SHOULDERS
    if (t.includes("deltoid") || t.includes("spalle") || t.includes("alzate") || t.includes("delt") || t.includes("shoulder") || t.includes("military") || t.includes("face pull")) {
        return { category: "Shoulders", muscleFocus: ["Shoulders"], type: "Isolation" };
    }
    // BACK
    if (t.includes("rematore") || t.includes("remata") || t.includes("row") || t.includes("trazion") || t.includes("pulldown") || t.includes("pull-in") || t.includes("pull around") || t.includes("lat") || t.includes("chin up") || t.includes("pull up")) {
        return { category: "Back", muscleFocus: ["Back", "Biceps"], type: "Compound" };
    }
    // BICEPS / ARMS
    if (t.includes("curl") || t.includes("bicipit")) {
        return { category: "Arms", muscleFocus: ["Biceps"], type: "Isolation" };
    }
    // TRICEPS
    if (t.includes("tricipit") || t.includes("tricep") || t.includes("french press") || t.includes("pushdown") || t.includes("skullcrusher")) {
        return { category: "Arms", muscleFocus: ["Triceps"], type: "Isolation" };
    }
    // CHEST
    if (t.includes("panca") || t.includes("bench") || t.includes("press") || t.includes("chest") || t.includes("pectoral") || t.includes("croci") || t.includes("flessioni") || t.includes("push up")) {
        return { category: "Chest", muscleFocus: ["Chest", "Triceps", "Shoulders"], type: "Compound" };
    }
    // LEGS
    if (t.includes("squat") || t.includes("affond") || t.includes("leg") || t.includes("calf") || t.includes("lunge") || t.includes("leg press") || t.includes("leg curl") || t.includes("leg extension")) {
        return { category: "Legs", muscleFocus: ["Quads", "Glutes", "Hamstrings"], type: "Compound" };
    }
    if (t.includes("stacco") || t.includes("deadlift") || t.includes("good morning") || t.includes("hip thrust")) {
        return { category: "Legs", muscleFocus: ["Hamstrings", "Glutes", "Lower Back"], type: "Compound" };
    }
    // STRETCHING
    if (t.includes("allungamento") || t.includes("stretch") || t.includes("yoga") || t.includes("savasana") || t.includes("posizione") || t.includes("mobilizzazione")) {
        return { category: "Stretching", muscleFocus: ["Full Body"], type: "Isolation" };
    }
    // CARDIO
    if (t.includes("cardio") || t.includes("vogata") || t.includes("vogatore") || t.includes("run") || t.includes("corsa") || t.includes("jack")) {
        return { category: "Cardio", muscleFocus: ["Full Body"], type: "Cardio" };
    }
    // CORE
    if (t.includes("addomin") || t.includes("crunch") || t.includes("plank") || t.includes("core") || t.includes("sollevamento gambe")) {
        return { category: "Core", muscleFocus: ["Abs"], type: "Isolation" };
    }
    
    return { category: "Full Body", muscleFocus: ["Full Body"], type: "Compound" };
}

const lines = rawCsvData.split('\\n');
const exercises = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  if (line === '' || i === 0) continue; // Skip header
  
  // Basic CSV parser to handle quotes
  const parts = [];
  let current = '';
  let inQuotes = false;
  for (let char of line) {
    if (char === '"') inQuotes = !inQuotes;
    else if (char === ',' && !inQuotes) {
      parts.push(current.trim());
      current = '';
    } else current += char;
  }
  parts.push(current.trim());

  if (parts.length >= 2) {
    let catName = parts[0];
    if (catName.startsWith("Testo: ")) catName = catName.substring(7).trim();
    if (catName.length < 3) continue;
    
    const equipmentStr = parts[1];
    let trueEq = "Bodyweight";
    if (equipmentStr.includes("Bilanciere") || equipmentStr.includes("Barbell") || equipmentStr.includes("Ez Bar") || equipmentStr.includes("Trap Bar")) trueEq = "Barbell";
    else if (equipmentStr.includes("Manubri") || equipmentStr.includes("Dumbbell") || equipmentStr.includes("Manubrio")) trueEq = "Dumbbell";
    else if (equipmentStr.includes("Macchina") || equipmentStr.includes("Machine") || equipmentStr.includes("Cavo") || equipmentStr.includes("Cavi") || equipmentStr.includes("Smith-Machine") || equipmentStr.includes("Lat machine")) trueEq = "Machine";
    else if (equipmentStr.includes("Kettlebell")) trueEq = "Kettlebell";
    else if (equipmentStr.includes("Piatto") || equipmentStr.includes("Piastra") || equipmentStr.includes("Palla Medica")) trueEq = "Weight";
    else if (equipmentStr.includes("Fascia") || equipmentStr.includes("Elastico") || equipmentStr.includes("Band")) trueEq = "Bands";
    else if (equipmentStr.includes("TRX")) trueEq = "TRX";

    const { category, muscleFocus, type } = guessMuscleAndCategory(catName);

    exercises.push({
       id: "e_csv_" + i + "_" + Math.floor(Math.random()*1000),
       title: catName,
       category: category,
       type: type,
       muscleFocus: muscleFocus,
       image: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&q=80&w=200&h=200",
       equipment: trueEq,
       notes: "",
       sets: []
    });
  }
}

// Remove duplicates
const uniqueMap = {};
for (const ex of exercises) {
   if (!uniqueMap[ex.title]) {
       uniqueMap[ex.title] = ex;
   }
}
const finalExercises = Object.values(uniqueMap);

export const parsedCsvExercises = finalExercises as any[];
`;

fs.writeFileSync(tsPath, tsTemplate);
console.log('Successfully updated src/data/rawCsv.ts');
