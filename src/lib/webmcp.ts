/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { readJson, writeJsonAtomic, readJsonArray } from "./storage";
import { loadExerciseCatalog } from "../data/exercises";
import { findRoutineCatalogMatch, parseLiftLabRoutineText } from "./routineImport";
import { convertWeight, roundToGymWeight } from "./workoutUtils";
import type { ExerciseData, RoutineData, WorkoutLog } from "../types/workout";

export const WEIGHT_LOGGED_EVENT = "liftlab:weight-logged";
export const ROUTINES_IMPORTED_EVENT = "liftlab:routines-imported";

function canonicalUnit(value: unknown): "KG" | "LBS" | null {
  if (typeof value !== "string") return null;
  const unit = value.trim().toUpperCase();
  if (unit === "KG" || unit === "KGS") return "KG";
  if (unit === "LB" || unit === "LBS") return "LBS";
  return null;
}

function notifyApp(name: string, detail: unknown) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

// WebMCP (Web Model Context Protocol) Navigator Extension Interface
interface McpActionParameterSchema {
  type: string;
  properties?: Record<string, unknown>;
  required?: string[];
  [key: string]: unknown;
}

interface McpActionDefinition {
  id: string;
  name: string;
  description: string;
  parameters: McpActionParameterSchema;
  handler: (params: Record<string, unknown>) => Promise<Record<string, unknown>> | Record<string, unknown>;
}

interface McpActionsRegistry {
  register: (action: McpActionDefinition) => void;
  unregister?: (id: string) => void;
}

declare global {
  interface Navigator {
    mcpActions?: McpActionsRegistry;
  }
}

/**
 * Initializes WebMCP actions on supported browsers (Chrome, Edge 2026+ and AI browsing agents).
 */
export function initWebMcp(): Record<string, McpActionDefinition> {
  const win = typeof window !== "undefined" ? (window as any) : (globalThis as any);
  const nav = typeof navigator !== "undefined" ? navigator : undefined;
  const mcp = nav?.mcpActions;

  // 1. Log Body Weight Action
  const logWeightAction: McpActionDefinition = {
    id: "log-weight",
    name: "Log Body Weight",
    description: "Record daily morning body weight in kg or lbs for fitness tracking",
    parameters: {
      type: "object",
      required: ["weight"],
      properties: {
        weight: {
          type: "number",
          minimum: 1,
          maximum: 1000,
          description: "Numeric weight value",
        },
        unit: {
          type: "string",
          enum: ["kg", "lbs"],
          description: "Unit of weight (defaults to user setting or kg)",
        },
      },
    },
    handler: async (params) => {
      const val = Number(params.weight);
      if (!Number.isFinite(val) || val <= 0 || val > 1000) {
        return { success: false, error: "Invalid weight value" };
      }
      const requestedUnit = canonicalUnit(params.unit);
      if (params.unit != null && params.unit !== "" && !requestedUnit) {
        return { success: false, error: "Invalid unit" };
      }

      const guest = readJson<Record<string, unknown>>("liftlab_guest_data", {});
      const storedUnit = canonicalUnit(guest.unit) || "KG";
      const sourceUnit = requestedUnit || storedUnit;
      const converted = convertWeight(val, sourceUnit, storedUnit);
      const weight = Number(roundToGymWeight(typeof converted === "number" ? converted : val, 2));
      if (!Number.isFinite(weight) || weight <= 0) {
        return { success: false, error: "Invalid weight value" };
      }

      const weightLogs = readJsonArray<{ date: string; weight: number }>("liftlab_weight_logs");
      const entry = { date: new Date().toISOString(), weight };
      const nextLogs = [...weightLogs, entry];
      const nextGuest = {
        ...guest,
        currentWeight: weight,
        weightLogs: nextLogs,
        unit: guest.unit ?? storedUnit,
        updatedAt: new Date().toISOString(),
      };

      writeJsonAtomic("liftlab_weight_logs", nextLogs);
      writeJsonAtomic("liftlab_guest_data", nextGuest);
      notifyApp(WEIGHT_LOGGED_EVENT, { weight, weightLogs: nextLogs, userData: nextGuest });

      const unitLabel = storedUnit.toLowerCase();
      return {
        success: true,
        message: `Body weight of ${weight} ${unitLabel} recorded.`,
        date: entry.date,
        weight,
        unit: unitLabel,
      };
    },
  };

  // 2. Search Exercise Catalog Action
  const searchExercisesAction: McpActionDefinition = {
    id: "search-exercises",
    name: "Search Exercise Catalog",
    description: "Search and filter LiftLab exercise library by name or muscle group",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Keyword search for exercise title",
        },
        muscle: {
          type: "string",
          description: "Target muscle filter (e.g. chest, back, legs, shoulders, arms, core)",
        },
      },
    },
    handler: async (params) => {
      const catalog = await loadExerciseCatalog();
      const q = typeof params.query === "string" ? params.query.toLowerCase().trim() : "";
      const muscle = typeof params.muscle === "string" ? params.muscle.toLowerCase().trim() : "";

      const filtered = catalog.filter((ex) => {
        const muscleNames = [ex.targetMuscle, ex.category, ...(ex.muscleFocus || [])]
          .filter((name): name is string => typeof name === "string" && name.length > 0)
          .join(" ")
          .toLowerCase();
        const matchesQ = !q || ex.title.toLowerCase().includes(q) || muscleNames.includes(q);
        const matchesMuscle = !muscle || muscleNames.includes(muscle);
        return matchesQ && matchesMuscle;
      });

      return {
        success: true,
        count: filtered.length,
        exercises: filtered.slice(0, 15).map((ex) => ({
          id: ex.id || ex.title,
          title: ex.title,
          target: ex.targetMuscle,
          equipment: ex.equipment,
          secondaryMuscles: ex.secondaryMuscles,
        })),
      };
    },
  };

  // 3. Get Workout Routines Action
  const getRoutinesAction: McpActionDefinition = {
    id: "get-routines",
    name: "Get Workout Routines",
    description: "Retrieve all saved workout routine templates and their exercises",
    parameters: {
      type: "object",
      properties: {},
    },
    handler: async () => {
      const routines = readJsonArray<RoutineData>("liftlab_routines");
      return {
        success: true,
        count: routines.length,
        routines: routines.map((r) => ({
          id: r.id,
          name: r.name,
          exerciseCount: r.exercises ? r.exercises.length : 0,
        })),
      };
    },
  };

  // 4. Get Workout History Action
  const getWorkoutHistoryAction: McpActionDefinition = {
    id: "get-workout-history",
    name: "Get Workout History",
    description: "Retrieve recent workout history, completed sets, volume and dates",
    parameters: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Max sessions to return (default 10)",
        },
      },
    },
    handler: async (params) => {
      const limit = typeof params.limit === "number" && params.limit > 0 ? params.limit : 10;
      const logs = readJsonArray<WorkoutLog>("liftlab_workout_logs");
      return {
        success: true,
        totalWorkouts: logs.length,
        recentWorkouts: logs.slice(0, limit).map((log) => ({
          id: log.id,
          routineName: log.routineName,
          date: log.date,
          duration: log.duration,
          exercisesCount: log.exercises ? log.exercises.length : 0,
        })),
      };
    },
  };

  // 5. Import Routine Action
  const importRoutineAction: McpActionDefinition = {
    id: "import-routine",
    name: "Import Routine",
    description: "Import a workout routine or workout plan from JSON code or shared text",
    parameters: {
      type: "object",
      required: ["routine_code"],
      properties: {
        routine_code: {
          type: "string",
          description: "LiftLab routine JSON format or encoded routine string",
        },
      },
    },
    handler: async (params) => {
      const code = typeof params.routine_code === "string" ? params.routine_code.trim() : "";
      if (!code) return { success: false, error: "routine_code is required" };

      try {
        const catalog = await loadExerciseCatalog();
        const customExercises = readJsonArray<ExerciseData>("liftlab_custom_exercises");
        const known = [...catalog, ...customExercises];
        const parsed = parseLiftLabRoutineText(code, known) as RoutineData[];
        if (parsed.length === 0) return { success: false, error: "No routines found" };

        const created: ExerciseData[] = [];
        for (const routine of parsed) {
          for (const exercise of routine.exercises || []) {
            if (findRoutineCatalogMatch(exercise.title, [...known, ...created])) continue;
            created.push({
              id: `e_custom_import_${Date.now()}_${created.length}`,
              title: exercise.title,
              category: exercise.category || "Custom",
              type: "Custom",
              equipment: exercise.type || "Custom",
              notes: exercise.notes || "Created automatically from routine import.",
              sets: [],
              muscleFocus: [exercise.category || "Custom"],
              image:
                exercise.image ||
                "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=200&h=200",
            });
          }
        }

        if (created.length) {
          writeJsonAtomic("liftlab_custom_exercises", [...customExercises, ...created]);
        }

        let routines = readJsonArray<RoutineData>("liftlab_routines");
        for (const routine of parsed) {
          routines = [routine, ...routines];
        }
        writeJsonAtomic("liftlab_routines", routines);
        notifyApp(ROUTINES_IMPORTED_EVENT, { routines, customExercises: created });

        return {
          success: true,
          count: parsed.length,
          names: parsed.map((routine) => routine.name),
          customExercisesCreated: created.length,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Import failed";
        return { success: false, error: message };
      }
    },
  };

  // Register with browser agent if WebMCP API is exposed
  if (mcp && typeof mcp.register === "function") {
    try {
      mcp.register(logWeightAction);
      mcp.register(searchExercisesAction);
      mcp.register(getRoutinesAction);
      mcp.register(getWorkoutHistoryAction);
      mcp.register(importRoutineAction);
    } catch (e) {
      console.warn("WebMCP action registration notice:", e);
    }
  }

  const registry: Record<string, McpActionDefinition> = {
    "log-weight": logWeightAction,
    "search-exercises": searchExercisesAction,
    "get-routines": getRoutinesAction,
    "get-workout-history": getWorkoutHistoryAction,
    "import-routine": importRoutineAction,
  };

  win.__liftlab_mcp__ = registry;
  return registry;
}
