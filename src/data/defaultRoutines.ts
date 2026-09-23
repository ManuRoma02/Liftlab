import type { RoutineData } from "../types/workout";
import { BASIC_EXERCISES } from "./exercises";

const createSets = (count: number, reps: number) => {
  return Array.from({ length: count }, (_, idx) => ({
    id: `set_starter_${idx + 1}_${Math.random().toString(36).slice(2, 6)}`,
    weight: "",
    reps,
    completed: false,
  }));
};

const bench = BASIC_EXERCISES.find((e) => e.id === "e_bp") || BASIC_EXERCISES[0];
const squat = BASIC_EXERCISES.find((e) => e.id === "e_sq") || BASIC_EXERCISES[1];
const deadlift = BASIC_EXERCISES.find((e) => e.id === "e_dl") || BASIC_EXERCISES[2];
const incline = BASIC_EXERCISES.find((e) => e.id === "e_ip") || BASIC_EXERCISES[3];
const cableCross = BASIC_EXERCISES.find((e) => e.id === "e_cc") || BASIC_EXERCISES[4];

export const DEFAULT_STARTER_ROUTINES: RoutineData[] = [
  {
    id: "starter_full_body",
    name: "Full Body Starter",
    duration: 45,
    tags: ["Full Body", "Beginner"],
    favorite: true,
    scheduledDay: 0, // Monday
    exercises: [
      {
        ...squat,
        id: "starter_fb_squat",
        sets: createSets(3, 8),
      },
      {
        ...bench,
        id: "starter_fb_bench",
        sets: createSets(3, 8),
      },
      {
        ...incline,
        id: "starter_fb_incline",
        sets: createSets(3, 10),
      },
      {
        ...cableCross,
        id: "starter_fb_cable",
        sets: createSets(3, 12),
      },
    ],
  },
  {
    id: "starter_upper_body",
    name: "Upper Body Power",
    duration: 50,
    tags: ["Upper Body", "Strength"],
    favorite: false,
    scheduledDay: 2, // Wednesday
    exercises: [
      {
        ...bench,
        id: "starter_ub_bench",
        sets: createSets(4, 8),
      },
      {
        ...incline,
        id: "starter_ub_incline",
        sets: createSets(3, 10),
      },
      {
        ...cableCross,
        id: "starter_ub_cable",
        sets: createSets(3, 12),
      },
    ],
  },
  {
    id: "starter_lower_body",
    name: "Lower Body Focus",
    duration: 45,
    tags: ["Lower Body", "Legs"],
    favorite: false,
    scheduledDay: 4, // Friday
    exercises: [
      {
        ...squat,
        id: "starter_lb_squat",
        sets: createSets(4, 8),
      },
      {
        ...deadlift,
        id: "starter_lb_deadlift",
        sets: createSets(3, 6),
      },
    ],
  },
];
