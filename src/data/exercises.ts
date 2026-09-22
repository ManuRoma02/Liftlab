
import type { ExerciseData } from '../types/workout';

export const BASIC_EXERCISES: ExerciseData[] = [
  {
    id: "e_bp",
    title: "Barbell Bench Press",
    category: "Chest",
    type: "Compound",
    equipment: "Barbell",
    muscleFocus: ["Chest", "Triceps", "Shoulders"],
    targetMuscle: "Chest",
    secondaryMuscles: ["Triceps", "Shoulders"],
    image: "https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/images/0025-EIeI8Vf.jpg",
    gifUrl: "https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/videos/0025-EIeI8Vf.gif",
    instructions: [
      "Sdraiati sulla panca piana con i piedi ben piantati a terra.",
      "Afferra il bilanciere con una presa leggermente più ampia della larghezza delle spalle.",
      "Stacca il bilanciere dai supporti e posizionalo direttamente sopra il petto a braccia tese.",
      "Abbassa lentamente il bilanciere verso il centro del petto, mantenendo i gomiti a circa 45 gradi dal busto.",
      "Spingi il bilanciere verso l'alto tornando alla posizione di partenza espirando."
    ],
    instructionsByLang: {
      it: [
        "Sdraiati sulla panca piana con i piedi ben piantati a terra.",
        "Afferra il bilanciere con una presa leggermente più ampia della larghezza delle spalle.",
        "Stacca il bilanciere dai supporti e posizionalo direttamente sopra il petto a braccia tese.",
        "Abbassa lentamente il bilanciere verso il centro del petto, mantenendo i gomiti a circa 45 gradi dal busto.",
        "Spingi il bilanciere verso l'alto tornando alla posizione di partenza espirando."
      ],
      en: [
        "Lie flat on your back on a bench with your feet flat on the ground.",
        "Grip the barbell with hands slightly wider than shoulder-width apart.",
        "Unrack the barbell and hold it straight over your chest with arms fully extended.",
        "Slowly lower the barbell to the middle of your chest, keeping elbows at roughly a 45-degree angle.",
        "Push the barbell back up to the starting position while exhaling."
      ]
    },
    notes: "",
    sets: []
  },
  {
    id: "e_sq",
    title: "Barbell Full Squat",
    category: "Legs",
    type: "Compound",
    equipment: "Barbell",
    muscleFocus: ["Quadriceps", "Glutes", "Hamstrings", "Calves"],
    targetMuscle: "Quadriceps",
    secondaryMuscles: ["Glutes", "Hamstrings", "Calves"],
    image: "https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/images/0043-qXTaZnJ.jpg",
    gifUrl: "https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/videos/0043-qXTaZnJ.gif",
    instructions: [
      "Posiziona il bilanciere sui trapezi superiori e afferralo saldamente con entrambe le mani.",
      "Posiziona i piedi alla larghezza delle spalle, con le punte leggermente rivolte verso l'esterno.",
      "Piega le ginocchia e spingi i fianchi all'indietro come per sederti su una sedia, mantenendo la schiena dritta e il petto alto.",
      "Scendi fino a quando le cosce sono almeno parallele al suolo.",
      "Spingi attraverso i talloni per tornare alla posizione eretta."
    ],
    instructionsByLang: {
      it: [
        "Posiziona il bilanciere sui trapezi superiori e afferralo saldamente con entrambe le mani.",
        "Posiziona i piedi alla larghezza delle spalle, con le punte leggermente rivolte verso l'esterno.",
        "Piega le ginocchia e spingi i fianchi all'indietro come per sederti su una sedia, mantenendo la schiena dritta e il petto alto.",
        "Scendi fino a quando le cosce sono almeno parallele al suolo.",
        "Spingi attraverso i talloni per tornare alla posizione eretta."
      ],
      en: [
        "Position the barbell on your upper back and grip it securely with both hands.",
        "Set your feet shoulder-width apart, toes pointing slightly outward.",
        "Bend your knees and push your hips back as if sitting in a chair, keeping your back straight and chest up.",
        "Lower until thighs are at least parallel to the floor.",
        "Drive through your heels to return to the standing position."
      ]
    },
    notes: "",
    sets: []
  },
  {
    id: "e_dl",
    title: "Barbell Deadlift",
    category: "Legs",
    type: "Compound",
    equipment: "Barbell",
    muscleFocus: ["Glutes", "Hamstrings", "Lower Back", "Back"],
    targetMuscle: "Glutes",
    secondaryMuscles: ["Hamstrings", "Lower Back", "Back"],
    image: "https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/images/0032-ila4NZS.jpg",
    gifUrl: "https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/videos/0032-ila4NZS.gif",
    instructions: [
      "Mettiti in piedi con i piedi alla larghezza dei fianchi e il bilanciere sopra la parte centrale dei piedi.",
      "Piegati in avanti dai fianchi e afferra il bilanciere appena all'esterno delle gambe.",
      "Piega le ginocchia finché gli stinchi non toccano il bilanciere, petto in fuori e schiena neutra.",
      "Solleva il bilanciere spingendo il pavimento con i piedi e distendendo contemporaneamente anche e ginocchia.",
      "Raggiungi la posizione eretta bloccando fianchi e ginocchia, poi abbassa il carico con controllo."
    ],
    instructionsByLang: {
      it: [
        "Mettiti in piedi con i piedi alla larghezza dei fianchi e il bilanciere sopra la parte centrale dei piedi.",
        "Piegati in avanti dai fianchi e afferra il bilanciere appena all'esterno delle gambe.",
        "Piega le ginocchia finché gli stinchi non toccano il bilanciere, petto in fuori e schiena neutra.",
        "Solleva il bilanciere spingendo il pavimento con i piedi e distendendo contemporaneamente anche e ginocchia.",
        "Raggiungi la posizione eretta bloccando fianchi e ginocchia, poi abbassa il carico con controllo."
      ],
      en: [
        "Stand with feet hip-width apart and the barbell over your mid-foot.",
        "Hinge at the hips and grip the bar just outside your legs.",
        "Bend your knees until your shins touch the bar, chest up and spine neutral.",
        "Lift the barbell by driving through the floor and extending hips and knees.",
        "Lock out at the top, then lower with control."
      ]
    },
    notes: "",
    sets: []
  },
  {
    id: "e_ip",
    title: "Dumbbell Incline Bench Press",
    category: "Chest",
    type: "Compound",
    equipment: "Dumbbell",
    muscleFocus: ["Chest", "Shoulders", "Triceps"],
    targetMuscle: "Chest",
    secondaryMuscles: ["Shoulders", "Triceps"],
    image: "https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/images/0314-8N3V73d.jpg",
    gifUrl: "https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/videos/0314-8N3V73d.gif",
    instructions: [
      "Siediti su una panca inclinata (30-45 gradi) con un manubrio in ciascuna mano appoggiato sulle cosce.",
      "Aiutati con le ginocchia per portare i manubri all'altezza del petto.",
      "Spingi i manubri verso l'alto fino a distendere le braccia senza bloccare i gomiti.",
      "Abbassa lentamente i manubri fino al livello delle spalle controllando la discesa.",
      "Ripeti per il numero di ripetizioni desiderato."
    ],
    instructionsByLang: {
      it: [
        "Siediti su una panca inclinata (30-45 gradi) con un manubrio in ciascuna mano appoggiato sulle cosce.",
        "Aiutati con le ginocchia per portare i manubri all'altezza del petto.",
        "Spingi i manubri verso l'alto fino a distendere le braccia senza bloccare i gomiti.",
        "Abbassa lentamente i manubri fino al livello delle spalle controllando la discesa.",
        "Ripeti per il numero di ripetizioni desiderato."
      ],
      en: [
        "Sit on an incline bench (30-45 degrees) holding dumbbells on your thighs.",
        "Kick weights up to shoulder level as you lean back.",
        "Press the dumbbells up until your arms are extended without locking elbows.",
        "Lower dumbbells with control back to chest level.",
        "Repeat for the desired number of reps."
      ]
    },
    notes: "",
    sets: []
  },
  {
    id: "e_cc",
    title: "Cable Cross-Over Variation",
    category: "Chest",
    type: "Isolation",
    equipment: "Cable",
    muscleFocus: ["Chest", "Shoulders"],
    targetMuscle: "Chest",
    secondaryMuscles: ["Shoulders"],
    image: "https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/images/0155-k5yJvjN.jpg",
    gifUrl: "https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/videos/0155-k5yJvjN.gif",
    instructions: [
      "Posiziona le pulegge dei cavi all'altezza desiderata e afferra una maniglia con ciascuna mano.",
      "Fai un passo avanti mantenendo una posizione sfalsata e una leggera inclinazione del busto.",
      "Con i gomiti leggermente piegati, porta le mani in avanti e verso il centro fino a incrociarle leggermente davanti al petto.",
      "Contrai i pettorali nel punto di massima contrazione per un secondo.",
      "Riapri lentamente le braccia tornando alla posizione iniziale controllando il carico."
    ],
    instructionsByLang: {
      it: [
        "Posiziona le pulegge dei cavi all'altezza desiderata e afferra una maniglia con ciascuna mano.",
        "Fai un passo avanti mantenendo una posizione sfalsata e una leggera inclinazione del busto.",
        "Con i gomiti leggermente piegati, porta le mani in avanti e verso il centro fino a incrociarle leggermente davanti al petto.",
        "Contrai i pettorali nel punto di massima contrazione per un secondo.",
        "Riapri lentamente le braccia tornando alla posizione iniziale controllando il carico."
      ],
      en: [
        "Set cable pulleys at chosen height and grasp handles in each hand.",
        "Step forward into a staggered stance with a slight torso lean.",
        "With slightly bent elbows, bring hands forward and together across chest.",
        "Squeeze chest muscles at peak contraction for one second.",
        "Slowly reverse the movement back to starting stretch."
      ]
    },
    notes: "",
    sets: []
  }
];

export const mergeExerciseCatalog = (
  catalog: ExerciseData[],
  customExercises: ExerciseData[] = [],
) => {
  const map = new Map<string, ExerciseData>();
  [...catalog, ...customExercises].forEach((exercise) => {
    const key = exercise.id || exercise.title;
    map.set(key, exercise);
  });
  return Array.from(map.values());
};

export async function loadExerciseCatalog(): Promise<ExerciseData[]> {
  const { precompiledExercises } = await import('./precompiledExercises');
  return mergeExerciseCatalog(
    BASIC_EXERCISES,
    precompiledExercises as ExerciseData[],
  );
}
