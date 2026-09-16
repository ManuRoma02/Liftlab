import React from "react";
import {
  Trophy,
  Medal,
  Target,
  Flame,
  Zap,
  Dumbbell,
  Clock,
  Calendar,
  CheckSquare,
  Star,
  Crown,
  Activity,
} from "lucide-react";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  progress: (workoutLogs: any[], unit: string) => number; // 0 to 1
  level?: "bronze" | "silver" | "gold" | "platinum";
}

const safeLogs = (logs: any[] | undefined | null): any[] => {
  return Array.isArray(logs) ? logs : [];
};

const getAchDate = (log: any) => {
  if (!log || !log.date) return new Date();
  if (typeof log.date.toDate === "function") return log.date.toDate();
  const d = new Date(log.date);
  return isNaN(d.getTime()) ? new Date() : d;
};

const getSafeSetVolume = (s: any): number => {
  if (!s?.completed) return 0;
  const w = typeof s.weight === "number" ? s.weight : Number(s.weight);
  const r = typeof s.reps === "number" ? s.reps : Number(s.reps);
  if (!Number.isFinite(w) || !Number.isFinite(r) || w <= 0 || r <= 0) return 0;
  return w * r;
};

const getTotalVolume = (logs: any[] | undefined | null): number => {
  const safe = safeLogs(logs);
  let vol = 0;
  safe.forEach((l) =>
    l?.exercises?.forEach((ex: any) =>
      ex?.sets?.forEach((s: any) => {
        vol += getSafeSetVolume(s);
      }),
    ),
  );
  return vol;
};

export const ACHIEVEMENTS: Achievement[] = [
  // Workout Count Thresholds
  {
    id: "first_workout",
    title: "First Blood",
    description: "Complete your very first workout.",
    icon: Medal,
    level: "bronze",
    progress: (logs) => Math.min(1, Math.max(0, safeLogs(logs).length / 1)),
  },
  {
    id: "5_workouts",
    title: "Starter Pack",
    description: "Complete 5 workouts",
    icon: Medal,
    level: "bronze",
    progress: (logs) => Math.min(1, Math.max(0, safeLogs(logs).length / 5)),
  },
  {
    id: "10_workouts",
    title: "Consistent",
    description: "Log 10 workouts.",
    icon: Target,
    level: "silver",
    progress: (logs) => Math.min(1, Math.max(0, safeLogs(logs).length / 10)),
  },
  {
    id: "25_workouts",
    title: "Iron Mind",
    description: "Log 25 workouts",
    icon: Target,
    level: "silver",
    progress: (logs) => Math.min(1, Math.max(0, safeLogs(logs).length / 25)),
  },
  {
    id: "50_workouts",
    title: "Gym Rat",
    description: "Log 50 workouts.",
    icon: Flame,
    level: "gold",
    progress: (logs) => Math.min(1, Math.max(0, safeLogs(logs).length / 50)),
  },
  {
    id: "75_workouts",
    title: "Master Lifter",
    description: "Log 75 workouts",
    icon: Crown,
    level: "gold",
    progress: (logs) => Math.min(1, Math.max(0, safeLogs(logs).length / 75)),
  },
  {
    id: "100_workouts",
    title: "Centurion",
    description: "Log 100 workouts.",
    icon: Crown,
    level: "platinum",
    progress: (logs) => Math.min(1, Math.max(0, safeLogs(logs).length / 100)),
  },
  {
    id: "200_workouts",
    title: "Gym Legend",
    description: "Log 200 workouts",
    icon: Trophy,
    level: "platinum",
    progress: (logs) => Math.min(1, Math.max(0, safeLogs(logs).length / 200)),
  },

  // Total Volume Thresholds
  {
    id: "volume_10k",
    title: "Heavy Lifter",
    description: "Move 10,000 total volume.",
    icon: Zap,
    level: "bronze",
    progress: (logs) => Math.min(1, Math.max(0, getTotalVolume(logs) / 10000)),
  },
  {
    id: "volume_50k",
    title: "Powerhouse",
    description: "Move 50,000 unit volume",
    icon: Zap,
    level: "silver",
    progress: (logs) => Math.min(1, Math.max(0, getTotalVolume(logs) / 50000)),
  },
  {
    id: "volume_100k",
    title: "Titan",
    description: "Move 100,000 total volume.",
    icon: Zap,
    level: "silver",
    progress: (logs) => Math.min(1, Math.max(0, getTotalVolume(logs) / 100000)),
  },
  {
    id: "volume_250k",
    title: "Wrecking Ball",
    description: "Move 250,000 unit volume",
    icon: Flame,
    level: "gold",
    progress: (logs) => Math.min(1, Math.max(0, getTotalVolume(logs) / 250000)),
  },
  {
    id: "volume_500k",
    title: "Colossus",
    description: "Move 500,000 unit volume",
    icon: Crown,
    level: "gold",
    progress: (logs) => Math.min(1, Math.max(0, getTotalVolume(logs) / 500000)),
  },
  {
    id: "volume_1m",
    title: "Hercules",
    description: "Move 1,000,000 total volume.",
    icon: Zap,
    level: "gold",
    progress: (logs) => Math.min(1, Math.max(0, getTotalVolume(logs) / 1000000)),
  },
  {
    id: "volume_2m5",
    title: "Olympian",
    description: "Move 2,500,000 unit volume",
    icon: Trophy,
    level: "platinum",
    progress: (logs) => Math.min(1, Math.max(0, getTotalVolume(logs) / 2500000)),
  },

  // Single Workout Accomplishments
  {
    id: "workout_volume_5k",
    title: "Monster Session",
    description: "Log 5,000 volume in a single workout",
    icon: Flame,
    level: "silver",
    progress: (logs) => {
      const safe = safeLogs(logs);
      let maxVol = 0;
      safe.forEach((l) => {
        let vol = 0;
        l?.exercises?.forEach((ex: any) => {
          ex?.sets?.forEach((s: any) => {
            vol += getSafeSetVolume(s);
          });
        });
        if (vol > maxVol) maxVol = vol;
      });
      return Math.min(1, Math.max(0, maxVol / 5000));
    },
  },
  {
    id: "workout_volume_10k",
    title: "Beast Mode Session",
    description: "Log 10,000 volume in a single workout",
    icon: Zap,
    level: "gold",
    progress: (logs) => {
      const safe = safeLogs(logs);
      let maxVol = 0;
      safe.forEach((l) => {
        let vol = 0;
        l?.exercises?.forEach((ex: any) => {
          ex?.sets?.forEach((s: any) => {
            vol += getSafeSetVolume(s);
          });
        });
        if (vol > maxVol) maxVol = vol;
      });
      return Math.min(1, Math.max(0, maxVol / 10000));
    },
  },
  {
    id: "workout_50_sets",
    title: "Iron Marathon",
    description: "Complete 30+ total sets in a single workout",
    icon: Activity,
    level: "gold",
    progress: (logs) => {
      const safe = safeLogs(logs);
      let maxSets = 0;
      safe.forEach((l) => {
        let sets = 0;
        l?.exercises?.forEach((ex: any) => {
          ex?.sets?.forEach((s: any) => {
            if (s?.completed) sets++;
          });
        });
        if (sets > maxSets) maxSets = sets;
      });
      return Math.min(1, Math.max(0, maxSets / 30));
    },
  },

  // Equipment & Special
  {
    id: "dumbbell_lover",
    title: "Dumbbell Master",
    description: "Complete 50 dumbbell sets",
    icon: Dumbbell,
    level: "bronze",
    progress: (logs) => {
      const safe = safeLogs(logs);
      let count = 0;
      safe.forEach((l) =>
        l?.exercises?.forEach((ex: any) => {
          const name = (ex?.title || ex?.name || ex?.exerciseId || "").toLowerCase();
          const cat = (ex?.equipment || ex?.category || "").toLowerCase();
          if (name.includes("dumbbell") || name.includes("manubri") || cat.includes("dumbbell") || cat.includes("manubri")) {
            ex?.sets?.forEach((s: any) => {
              if (s?.completed) count++;
            });
          }
        }),
      );
      return Math.min(1, Math.max(0, count / 50));
    },
  },
  {
    id: "cable_warrior",
    title: "Cable Specialist",
    description: "Complete 50 cable sets",
    icon: Activity,
    level: "bronze",
    progress: (logs) => {
      const safe = safeLogs(logs);
      let count = 0;
      safe.forEach((l) =>
        l?.exercises?.forEach((ex: any) => {
          const name = (ex?.title || ex?.name || ex?.exerciseId || "").toLowerCase();
          const cat = (ex?.equipment || ex?.category || "").toLowerCase();
          if (name.includes("cable") || name.includes("cavo") || name.includes("cavi") || cat.includes("cable") || cat.includes("cavo") || cat.includes("cavi")) {
            ex?.sets?.forEach((s: any) => {
              if (s?.completed) count++;
            });
          }
        }),
      );
      return Math.min(1, Math.max(0, count / 50));
    },
  },
  {
    id: "multipower_beast",
    title: "Multipower Pro",
    description: "Log 20 Multipower or Smith Machine sets",
    icon: Target,
    level: "silver",
    progress: (logs) => {
      const safe = safeLogs(logs);
      let count = 0;
      safe.forEach((l) =>
        l?.exercises?.forEach((ex: any) => {
          const name = (ex?.title || ex?.name || ex?.exerciseId || "").toLowerCase();
          const cat = (ex?.equipment || ex?.category || "").toLowerCase();
          if (name.includes("multipower") || name.includes("smith") || cat.includes("multipower") || cat.includes("smith")) {
            ex?.sets?.forEach((s: any) => {
              if (s?.completed) count++;
            });
          }
        }),
      );
      return Math.min(1, Math.max(0, count / 20));
    },
  },
  {
    id: "streak_3",
    title: "Consistency King",
    description: "Perform 3 workouts within 5 days",
    icon: Flame,
    level: "bronze",
    progress: (logs) => {
      const safe = safeLogs(logs);
      if (safe.length === 0) return 0;
      if (safe.length < 3) return Math.min(1, Math.max(0, safe.length / 3));
      const sorted = [...safe]
        .filter((l) => l && l.date)
        .sort((a, b) => getAchDate(a).getTime() - getAchDate(b).getTime());
      if (sorted.length < 3) return Math.min(1, Math.max(0, sorted.length / 3));

      let has3In5Days = false;
      for (let i = 0; i <= sorted.length - 3; i++) {
        const diffMs = getAchDate(sorted[i + 2]).getTime() - getAchDate(sorted[i]).getTime();
        if (diffMs <= 5 * 24 * 60 * 60 * 1000) {
          has3In5Days = true;
          break;
        }
      }
      if (has3In5Days) return 1;

      let has2In5Days = false;
      for (let i = 0; i <= sorted.length - 2; i++) {
        const diffMs = getAchDate(sorted[i + 1]).getTime() - getAchDate(sorted[i]).getTime();
        if (diffMs <= 5 * 24 * 60 * 60 * 1000) {
          has2In5Days = true;
          break;
        }
      }
      return has2In5Days ? 2 / 3 : 1 / 3;
    },
  },
  {
    id: "weekend_warrior",
    title: "Weekend Warrior",
    description: "Complete a workout on a Saturday or Sunday",
    icon: Calendar,
    level: "bronze",
    progress: (logs) => {
      const safe = safeLogs(logs);
      const hasWeekend = safe.some((l) => {
        if (!l || !l.date) return false;
        const day = getAchDate(l).getDay();
        return day === 0 || day === 6;
      });
      return hasWeekend ? 1 : 0;
    },
  },

  // Specific Exercises
  {
    id: "squat_plates",
    title: "Two Plates (Squat)",
    description: "Squat 225 lbs (100 kg) or more.",
    icon: Dumbbell,
    level: "silver",
    progress: (logs, unit) => {
      const safe = safeLogs(logs);
      const isKg = String(unit || "").toUpperCase() === "KG";
      const target = isKg ? 100 : 225;
      let maxWeight = 0;
      safe.forEach((l) =>
        l?.exercises?.forEach((ex: any) => {
          if (ex?.title?.toLowerCase().includes("squat")) {
            ex?.sets?.forEach((s: any) => {
              if (s?.completed && s?.weight && s.weight > maxWeight)
                maxWeight = s.weight;
            });
          }
        }),
      );
      return Math.min(1, Math.max(0, maxWeight / target));
    },
  },
  {
    id: "bench_plates",
    title: "Two Plates (Bench)",
    description: "Bench Press 225 lbs (100 kg) or more.",
    icon: Dumbbell,
    level: "silver",
    progress: (logs, unit) => {
      const safe = safeLogs(logs);
      const isKg = String(unit || "").toUpperCase() === "KG";
      const target = isKg ? 100 : 225;
      let maxWeight = 0;
      safe.forEach((l) =>
        l?.exercises?.forEach((ex: any) => {
          if (ex?.title?.toLowerCase().includes("bench press")) {
            ex?.sets?.forEach((s: any) => {
              if (s?.completed && s?.weight && s.weight > maxWeight)
                maxWeight = s.weight;
            });
          }
        }),
      );
      return Math.min(1, Math.max(0, maxWeight / target));
    },
  },
  {
    id: "deadlift_plates",
    title: "Three Plates (Deadlift)",
    description: "Deadlift 315 lbs (140 kg) or more.",
    icon: Dumbbell,
    level: "gold",
    progress: (logs, unit) => {
      const safe = safeLogs(logs);
      const isKg = String(unit || "").toUpperCase() === "KG";
      const target = isKg ? 140 : 315;
      let maxWeight = 0;
      safe.forEach((l) =>
        l?.exercises?.forEach((ex: any) => {
          if (ex?.title?.toLowerCase().includes("deadlift")) {
            ex?.sets?.forEach((s: any) => {
              if (s?.completed && s?.weight && s.weight > maxWeight)
                maxWeight = s.weight;
            });
          }
        }),
      );
      return Math.min(1, Math.max(0, maxWeight / target));
    },
  },

  // Time-based
  {
    id: "early_bird",
    title: "Early Bird",
    description: "Complete a workout before 7 AM.",
    icon: Clock,
    level: "bronze",
    progress: (logs) => {
      const safe = safeLogs(logs);
      const hasEarly = safe.some((l) => {
        if (!l || !l.date) return false;
        const h = getAchDate(l).getHours();
        return h < 7;
      });
      return hasEarly ? 1 : 0;
    },
  },
  {
    id: "night_owl",
    title: "Night Owl",
    description: "Complete a workout after 10 PM.",
    icon: Clock,
    level: "bronze",
    progress: (logs) => {
      const safe = safeLogs(logs);
      const hasLate = safe.some((l) => {
        if (!l || !l.date) return false;
        const h = getAchDate(l).getHours();
        return h >= 22;
      });
      return hasLate ? 1 : 0;
    },
  },
  {
    id: "marathon",
    title: "Marathon",
    description: "Workout for more than 2 hours (7200s).",
    icon: Activity,
    level: "silver",
    progress: (logs) => {
      const safe = safeLogs(logs);
      let maxDuration = 0;
      safe.forEach((l) => {
        if (l?.duration && l.duration > maxDuration) {
          maxDuration = l.duration;
        } else if (l?.startTime && l?.endTime) {
          const startTime =
            typeof l.startTime.toMillis === "function"
              ? l.startTime.toMillis()
              : new Date(l.startTime).getTime();
          const endTime =
            typeof l.endTime.toMillis === "function"
              ? l.endTime.toMillis()
              : new Date(l.endTime).getTime();
          const dur = (endTime - startTime) / 1000;
          if (dur > maxDuration) maxDuration = dur;
        }
      });
      return Math.min(1, Math.max(0, maxDuration / 7200));
    },
  },
  {
    id: "perfectionist",
    title: "Perfectionist",
    description: "Complete 100% of sets in a routine (min 10 sets).",
    icon: CheckSquare,
    level: "gold",
    progress: (logs) => {
      const safe = safeLogs(logs);
      const perfect = safe.some((l) => {
        let completed = 0;
        l?.exercises?.forEach((ex: any) => {
          ex?.sets?.forEach((s: any) => {
            if (s?.completed) completed++;
          });
        });
        const planned =
          typeof l?.plannedSetCount === "number" && Number.isFinite(l.plannedSetCount) && l.plannedSetCount > 0
            ? l.plannedSetCount
            : completed;
        return planned >= 10 && completed === planned;
      });
      return perfect ? 1 : 0;
    },
  },

  // Miscellaneous
  {
    id: "cardio_bunny",
    title: "Cardio Bunny",
    description: "Log 10 cardio sessions.",
    icon: Activity,
    level: "silver",
    progress: (logs) => {
      const safe = safeLogs(logs);
      let count = 0;
      safe.forEach((l) => {
        const hasCardio = l?.exercises?.some(
          (ex: any) =>
            ex?.category === "Cardio" ||
            ex?.title?.toLowerCase().includes("run") ||
            ex?.title?.toLowerCase().includes("cycle"),
        );
        if (hasCardio) count++;
      });
      return Math.min(1, Math.max(0, count / 10));
    },
  },
  {
    id: "leg_day_hero",
    title: "Leg Day Hero",
    description: "Complete 20 leg focused exercises.",
    icon: Target,
    level: "silver",
    progress: (logs) => {
      const safe = safeLogs(logs);
      let count = 0;
      safe.forEach((l) => {
        l?.exercises?.forEach((ex: any) => {
          if (
            ex?.muscleFocus &&
            (ex.muscleFocus.includes("Quads") ||
              ex.muscleFocus.includes("Hamstrings") ||
              ex.muscleFocus.includes("Calves") ||
              ex.muscleFocus.includes("Glutes"))
          ) {
            count++;
          }
        });
      });
      return Math.min(1, Math.max(0, count / 20));
    },
  },
  {
    id: "upper_body_god",
    title: "Upper Body God",
    description: "Complete 50 upper body focused exercises.",
    icon: Dumbbell,
    level: "gold",
    progress: (logs) => {
      const safe = safeLogs(logs);
      let count = 0;
      safe.forEach((l) => {
        l?.exercises?.forEach((ex: any) => {
          if (
            ex?.muscleFocus &&
            (ex.muscleFocus.includes("Chest") ||
              ex.muscleFocus.includes("Back") ||
              ex.muscleFocus.includes("Shoulders") ||
              ex.muscleFocus.includes("Biceps") ||
              ex.muscleFocus.includes("Triceps"))
          ) {
            count++;
          }
        });
      });
      return Math.min(1, Math.max(0, count / 50));
    },
  },
  {
    id: "streak_7",
    title: "Unstoppable",
    description: "Perform 7 workouts within 7 days.",
    icon: Flame,
    level: "platinum",
    progress: (logs) => {
      const safe = safeLogs(logs);
      const dated = [...safe]
        .filter((l) => l && l.date)
        .map((l) => getAchDate(l).getTime())
        .filter((time) => Number.isFinite(time))
        .sort((a, b) => a - b);
      if (dated.length === 0) return 0;
      const weekMs = 7 * 24 * 60 * 60 * 1000;
      let maxInWindow = 1;
      let left = 0;
      for (let right = 0; right < dated.length; right++) {
        while (dated[right] - dated[left] > weekMs) left++;
        maxInWindow = Math.max(maxInWindow, right - left + 1);
      }
      return Math.min(1, Math.max(0, maxInWindow / 7));
    },
  },
  {
    id: "heavy_squat_volume",
    title: "Squat Volume 10k",
    description: "Move 10,000 unit volume on Squats.",
    icon: Dumbbell,
    level: "gold",
    progress: (logs) => {
      const safe = safeLogs(logs);
      let vol = 0;
      safe.forEach((l) =>
        l?.exercises?.forEach((ex: any) => {
          if (ex?.title?.toLowerCase().includes("squat")) {
            ex?.sets?.forEach((s: any) => {
              vol += getSafeSetVolume(s);
            });
          }
        }),
      );
      return Math.min(1, Math.max(0, vol / 10000));
    },
  },
  {
    id: "bench_volume_10k",
    title: "Bench Volume 10k",
    description: "Move 10,000 unit volume on Bench Press.",
    icon: Dumbbell,
    level: "gold",
    progress: (logs) => {
      const safe = safeLogs(logs);
      let vol = 0;
      safe.forEach((l) =>
        l?.exercises?.forEach((ex: any) => {
          if (ex?.title?.toLowerCase().includes("bench")) {
            ex?.sets?.forEach((s: any) => {
              vol += getSafeSetVolume(s);
            });
          }
        }),
      );
      return Math.min(1, Math.max(0, vol / 10000));
    },
  },
  {
    id: "deadlift_volume_10k",
    title: "Deadlift Volume 10k",
    description: "Move 10,000 unit volume on Deadlifts.",
    icon: Dumbbell,
    level: "gold",
    progress: (logs) => {
      const safe = safeLogs(logs);
      let vol = 0;
      safe.forEach((l) =>
        l?.exercises?.forEach((ex: any) => {
          if (ex?.title?.toLowerCase().includes("deadlift")) {
            ex?.sets?.forEach((s: any) => {
              vol += getSafeSetVolume(s);
            });
          }
        }),
      );
      return Math.min(1, Math.max(0, vol / 10000));
    },
  },
  {
    id: "1rep_max_tester",
    title: "The 1RM Tester",
    description: "Log a completed 1-rep set.",
    icon: Star,
    level: "bronze",
    progress: (logs) => {
      const safe = safeLogs(logs);
      let found = false;
      safe.forEach((l) =>
        l?.exercises?.forEach((ex: any) =>
          ex?.sets?.forEach((s: any) => {
            if (s?.completed && s?.reps === 1) found = true;
          }),
        ),
      );
      return found ? 1 : 0;
    },
  },
  {
    id: "endurance_beast",
    title: "Endurance Beast",
    description: "Log a completed set of 20+ reps.",
    icon: Target,
    level: "silver",
    progress: (logs) => {
      const safe = safeLogs(logs);
      let found = false;
      safe.forEach((l) =>
        l?.exercises?.forEach((ex: any) =>
          ex?.sets?.forEach((s: any) => {
            if (s?.completed && s?.reps && s.reps >= 20) found = true;
          }),
        ),
      );
      return found ? 1 : 0;
    },
  },
  {
    id: "master_of_variations",
    title: "Master of Variations",
    description: "Perform 20 different exercises.",
    icon: Trophy,
    level: "platinum",
    progress: (logs) => {
      const safe = safeLogs(logs);
      let uniqueEx = new Set();
      safe.forEach((l) =>
        l?.exercises?.forEach((ex: any) => {
          if (ex?.title) uniqueEx.add(ex.title);
        }),
      );
      return Math.min(1, Math.max(0, uniqueEx.size / 20));
    },
  },
];

