
import type { ExerciseData } from '../types/workout';

export const BASIC_EXERCISES: ExerciseData[] = [
  // Existing from App.tsx
  { id: "e_bp", title: "Barbell Bench Press", category: "Chest", type: "Compound", muscleFocus: ["Chest", "Triceps", "Shoulders"], image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&q=80&w=200&h=200", equipment: "Barbell", notes: "", sets: [] },
  { id: "e_ip", title: "Incline Dumbbell Press", category: "Chest", type: "Compound", muscleFocus: ["Chest", "Shoulders"], image: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&q=80&w=200&h=200", equipment: "Dumbbell", notes: "", sets: [] },
  { id: "e_dp", title: "Decline Bench Press", category: "Chest", type: "Compound", muscleFocus: ["Chest"], image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=200&h=200", equipment: "Barbell", notes: "", sets: [] },
  { id: "e_cc", title: "Cable Crossover", category: "Chest", type: "Isolation", muscleFocus: ["Chest"], image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=200&h=200", equipment: "Machine", notes: "", sets: [] },
  { id: "e_pd", title: "Pec Deck Fly", category: "Chest", type: "Isolation", muscleFocus: ["Chest"], image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&q=80&w=200&h=200", equipment: "Machine", notes: "", sets: [] },
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
