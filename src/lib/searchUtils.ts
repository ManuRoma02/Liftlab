import type { ExerciseData } from '../types/workout';

export const normalizeSearchText = (value = "") =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export const TOKEN_TRANSLATIONS: Record<string, string> = {
  // Italian exercise terms to English
  panca: "bench",
  panche: "bench",
  piana: "bench",
  piane: "bench",
  inclinata: "incline",
  inclinato: "incline",
  declinata: "decline",
  declinato: "decline",
  stacco: "deadlift",
  stacchi: "deadlift",
  rumeno: "romanian",
  rumeni: "romanian",
  trazioni: "pull up chin up",
  sbarra: "pull up",
  spinte: "press",
  spinta: "press",
  croci: "fly crossover",
  apertura: "fly",
  aperture: "fly",
  alzate: "raise",
  alzata: "raise",
  laterali: "lateral",
  laterale: "lateral",
  frontali: "front",
  frontale: "front",
  posteriori: "rear",
  posteriore: "rear",
  rematore: "row",
  rematori: "row",
  piegamenti: "push up",
  flessioni: "push up",
  lento: "shoulder press",
  avanti: "press",
  military: "military overhead press",
  polpacci: "calves calf",
  polpaccio: "calves calf",
  addome: "core abs",
  addominali: "core abs",
  core: "core",
  glutei: "glutes glute",
  gluteo: "glutes glute",
  femorali: "hamstrings",
  femorale: "hamstrings",
  quadricipiti: "quads quadriceps",
  quadricipite: "quads quadriceps",
  bicipiti: "biceps curl",
  bicipite: "biceps curl",
  tricipiti: "triceps pushdown",
  tricipite: "triceps pushdown",
  petto: "chest",
  pettorali: "chest",
  pettorale: "chest",
  dorso: "back lats",
  dorsali: "back lats",
  dorsale: "back lats",
  schiena: "back",
  spalle: "shoulders delts",
  spalla: "shoulders delts",
  deltoidi: "shoulders delts",
  deltoide: "shoulders delts",
  gambe: "legs",
  gamba: "legs",
  braccia: "arms",
  braccio: "arms",
  bilanciere: "barbell",
  bilancieri: "barbell",
  manubri: "dumbbell",
  manubrio: "dumbbell",
  cavi: "cable",
  cavo: "cable",
  macchina: "machine",
  macchine: "machine",
  macchinario: "machine",
  macchinari: "machine",
  corpo: "bodyweight",
  libero: "bodyweight",
  elastici: "bands",
  elastico: "bands",
  fascia: "bands",
  fasce: "bands",
  affondi: "lunge",
  affondo: "lunge",
  squat: "squat",
  dip: "dip",
  parallele: "dip",
  pulley: "row",
  french: "skullcrusher triceps",
  press: "press",
  leg: "legs",
  curl: "curl",

  // Acronyms
  rdl: "romanian deadlift",
  ohp: "overhead press",
  bb: "barbell",
  db: "dumbbell",
  bp: "bench press",
  sq: "squat",
  dl: "deadlift"
};

export const buildExerciseSearchHaystack = (
  ex: ExerciseData,
  t?: (key: string) => string
): string => {
  const parts: string[] = [
    ex.title || "",
    ex.category || "",
    ex.type || "",
    ex.equipment || "",
    ex.targetMuscle || "",
    ...(ex.muscleFocus || []),
    ...(ex.secondaryMuscles || []),
  ];

  if (t) {
    const translatedTitle = t(ex.title);
    if (translatedTitle && translatedTitle !== ex.title) {
      parts.push(translatedTitle);
    }
    if (ex.category) {
      const translatedCat = t(ex.category.toLowerCase());
      if (translatedCat && translatedCat !== ex.category) parts.push(translatedCat);
    }
    if (ex.equipment) {
      const translatedEq = t(ex.equipment.toLowerCase());
      if (translatedEq && translatedEq !== ex.equipment) parts.push(translatedEq);
    }
  }

  return normalizeSearchText(parts.join(" "));
};

export const fuzzyScore = (query: string, target: string): number => {
  const q = normalizeSearchText(query);
  const t = normalizeSearchText(target);
  if (!q) return 1;
  if (!t) return 0;
  if (t === q) return 100;
  if (t.startsWith(q)) return 80;
  if (t.includes(q)) return 60;
  const tokens = q.split(" ").filter(Boolean);
  if (tokens.length > 1 && tokens.every((token) => t.includes(token))) return 50;

  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti += 1) {
    if (t[ti] === q[qi]) qi += 1;
  }
  return qi === q.length ? 20 : 0;
};

export const getExerciseSearchScore = (
  query: string,
  ex: ExerciseData,
  t?: (key: string) => string
): number => {
  const q = normalizeSearchText(query);
  if (!q) return 1;

  const title = normalizeSearchText(ex.title);
  const translatedTitle = t ? normalizeSearchText(t(ex.title)) : "";
  const haystack = buildExerciseSearchHaystack(ex, t);

  // 1. Exact title match (English or Translated)
  if (title === q || (translatedTitle && translatedTitle === q)) return 100;

  // 2. Title starts with query
  if (title.startsWith(q) || (translatedTitle && translatedTitle.startsWith(q))) return 92;

  // 3. Any word in title starts with query (e.g. "bench" in "Barbell Bench Press")
  const titleWords = title.split(" ");
  if (titleWords.some((w) => w.startsWith(q))) return 88;
  if (translatedTitle && translatedTitle.split(" ").some((w) => w.startsWith(q))) return 86;

  // 4. Acronym or mapped keyword exact lookup (e.g. "rdl", "panca", "stacco", "addominali")
  if (TOKEN_TRANSLATIONS[q]) {
    const expansion = TOKEN_TRANSLATIONS[q];
    if (title.includes(expansion) || (translatedTitle && translatedTitle.includes(expansion))) return 85;
    const expansionTokens = expansion.split(" ");
    if (expansionTokens.every((tok) => title.includes(tok))) return 82;
    if (expansionTokens.some((tok) => title.includes(tok))) return 78;
    if (expansionTokens.some((tok) => haystack.includes(tok))) return 70;
  }

  // 5. Title contains query substring
  if (title.includes(q) || (translatedTitle && translatedTitle.includes(q))) return 78;

  // 6. Token-based expansion for multi-word or Italian queries (e.g. "alzate laterali", "panca piana", "db bench")
  const qTokens = q.split(" ").filter(Boolean);
  if (qTokens.length > 0) {
    const tokenMatchedTitle = qTokens.every((tok) => {
      if (title.includes(tok) || (translatedTitle && translatedTitle.includes(tok))) return true;
      const exp = TOKEN_TRANSLATIONS[tok];
      if (exp && exp.split(" ").some((alt) => title.includes(alt) || (translatedTitle && translatedTitle.includes(alt)))) return true;
      return false;
    });
    if (tokenMatchedTitle) return 76;

    const tokenMatchedHaystack = qTokens.every((tok) => {
      if (haystack.includes(tok)) return true;
      const exp = TOKEN_TRANSLATIONS[tok];
      if (exp && exp.split(" ").some((alt) => haystack.includes(alt))) return true;
      return false;
    });
    if (tokenMatchedHaystack) return 68;
  }

  // 7. Standard full haystack match
  const rawScore = fuzzyScore(q, haystack);
  if (rawScore > 0) return rawScore;

  return 0;
};
