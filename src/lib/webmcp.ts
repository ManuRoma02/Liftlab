/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { readJson, writeJsonAtomic, readJsonArray } from "./storage";
import { loadExerciseCatalog } from "../data/exercises";
import type { RoutineData, WorkoutLogData } from "../types/workout";

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
      const rawUser = readJson<Record<string, unknown>>("liftlab_user_data", {});
      const activeUnit = (params.unit as string) || (rawUser.unit as string) || "kg";
      const today = new Date().toISOString().split("T")[0];

      const weightLogs = readJsonArray<{ id: string; date: string; weight: number; unit?: string }>("liftlab_weight_logs");
      const existingIdx = weightLogs.findIndex((l) => l.date === today);
      const newEntry = {
        id: existingIdx >= 0 ? weightLogs[existingIdx].id : `weight_${Date.now()}`,
        date: today,
        weight: val,
        unit: activeUnit,
      };

      if (existingIdx >= 0) {
        weightLogs[existingIdx] = newEntry;
      } else {
        weightLogs.unshift(newEntry);
      }

      writeJsonAtomic("liftlab_weight_logs", weightLogs);
      writeJsonAtomic("liftlab_user_data", { ...rawUser, currentWeight: val, unit: activeUnit });

      // Notify reactive UI if running live in browser tab
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("storage"));
      }

      return {
        success: true,
        message: `Body weight of ${val} ${activeUnit} recorded for ${today}.`,
        date: today,
        weight: val,
        unit: activeUnit,
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
        const matchesQ = !q || ex.title.toLowerCase().includes(q) || (ex.target && ex.target.toLowerCase().includes(q));
        const matchesMuscle = !muscle || (ex.target && ex.target.toLowerCase().includes(muscle));
        return matchesQ && matchesMuscle;
      });

      return {
        success: true,
        count: filtered.length,
        exercises: filtered.slice(0, 15).map((ex) => ({
          id: ex.id || ex.title,
          title: ex.title,
          target: ex.target,
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
          updatedAt: r.updatedAt,
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
      const logs = readJsonArray<WorkoutLogData>("liftlab_workout_logs");
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

  // Register with browser agent if WebMCP API is exposed
  if (mcp && typeof mcp.register === "function") {
    try {
      mcp.register(logWeightAction);
      mcp.register(searchExercisesAction);
      mcp.register(getRoutinesAction);
      mcp.register(getWorkoutHistoryAction);
    } catch (e) {
      console.warn("WebMCP action registration notice:", e);
    }
  }

  const registry: Record<string, McpActionDefinition> = {
    "log-weight": logWeightAction,
    "search-exercises": searchExercisesAction,
    "get-routines": getRoutinesAction,
    "get-workout-history": getWorkoutHistoryAction,
  };

  win.__liftlab_mcp__ = registry;
  return registry;
}
