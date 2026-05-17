import React from "react";
import { Trophy, Medal, Target, Flame, Zap, Dumbbell, Clock, Calendar, CheckSquare, Star, Crown, Activity } from "lucide-react";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  progress: (workoutLogs: any[], unit: string) => number; // 0 to 1
  level?: "bronze" | "silver" | "gold" | "platinum";
}

export const ACHIEVEMENTS: Achievement[] = [
  // Workout Count Thresholds
  {
    id: "first_workout",
    title: "First Blood",
    description: "Complete your very first workout.",
    icon: Medal,
    level: "bronze",
    progress: (logs) => Math.min(1, logs.length / 1)
  },
  {
    id: "10_workouts",
    title: "Consistent",
    description: "Log 10 workouts.",
    icon: Target,
    level: "silver",
    progress: (logs) => Math.min(1, logs.length / 10)
  },
  {
    id: "50_workouts",
    title: "Gym Rat",
    description: "Log 50 workouts.",
    icon: Flame,
    level: "gold",
    progress: (logs) => Math.min(1, logs.length / 50)
  },
  {
    id: "100_workouts",
    title: "Centurion",
    description: "Log 100 workouts.",
    icon: Crown,
    level: "platinum",
    progress: (logs) => Math.min(1, logs.length / 100)
  },

  // Total Volume Thresholds
  {
    id: "volume_10k",
    title: "Heavy Lifter",
    description: "Move 10,000 total volume.",
    icon: Zap,
    level: "bronze",
    progress: (logs) => {
      let vol = 0;
      logs.forEach(l => l.exercises?.forEach(ex => ex.sets?.forEach(s => {
        if (s.completed && s.weight && s.reps) vol += s.weight * s.reps;
      })));
      return Math.min(1, vol / 10000);
    }
  },
  {
    id: "volume_100k",
    title: "Titan",
    description: "Move 100,000 total volume.",
    icon: Zap,
    level: "silver",
    progress: (logs) => {
      let vol = 0;
      logs.forEach(l => l.exercises?.forEach(ex => ex.sets?.forEach(s => {
        if (s.completed && s.weight && s.reps) vol += s.weight * s.reps;
      })));
      return Math.min(1, vol / 100000);
    }
  },
  {
    id: "volume_1m",
    title: "Hercules",
    description: "Move 1,000,000 total volume.",
    icon: Zap,
    level: "gold",
    progress: (logs) => {
      let vol = 0;
      logs.forEach(l => l.exercises?.forEach(ex => ex.sets?.forEach(s => {
        if (s.completed && s.weight && s.reps) vol += s.weight * s.reps;
      })));
      return Math.min(1, vol / 1000000);
    }
  },

  // Specific Exercises
  {
    id: "squat_plates",
    title: "Two Plates (Squat)",
    description: "Squat 225 lbs (100 kg) or more.",
    icon: Dumbbell,
    level: "silver",
    progress: (logs, unit) => {
      const target = unit === 'KG' ? 100 : 225;
      let maxWeight = 0;
      logs.forEach(l => l.exercises?.forEach(ex => {
        if (ex.title?.toLowerCase().includes("squat")) {
          ex.sets?.forEach(s => {
            if (s.completed && s.weight && s.weight > maxWeight) maxWeight = s.weight;
          });
        }
      }));
      return Math.min(1, maxWeight / target);
    }
  },
  {
    id: "bench_plates",
    title: "Two Plates (Bench)",
    description: "Bench Press 225 lbs (100 kg) or more.",
    icon: Dumbbell,
    level: "silver",
    progress: (logs, unit) => {
      const target = unit === 'KG' ? 100 : 225;
      let maxWeight = 0;
      logs.forEach(l => l.exercises?.forEach(ex => {
        if (ex.title?.toLowerCase().includes("bench press")) {
          ex.sets?.forEach(s => {
            if (s.completed && s.weight && s.weight > maxWeight) maxWeight = s.weight;
          });
        }
      }));
      return Math.min(1, maxWeight / target);
    }
  },
  {
    id: "deadlift_plates",
    title: "Three Plates (Deadlift)",
    description: "Deadlift 315 lbs (140 kg) or more.",
    icon: Dumbbell,
    level: "gold",
    progress: (logs, unit) => {
      const target = unit === 'KG' ? 140 : 315;
      let maxWeight = 0;
      logs.forEach(l => l.exercises?.forEach(ex => {
        if (ex.title?.toLowerCase().includes("deadlift")) {
          ex.sets?.forEach(s => {
            if (s.completed && s.weight && s.weight > maxWeight) maxWeight = s.weight;
          });
        }
      }));
      return Math.min(1, maxWeight / target);
    }
  },

  // Time-based
  {
    id: "early_bird",
    title: "Early Bird",
    description: "Complete a workout before 7 AM.",
    icon: Clock,
    level: "bronze",
    progress: (logs) => {
      const hasEarly = logs.some(l => {
        if (!l.date) return false;
        const h = l.date.toDate().getHours();
        return h < 7;
      });
      return hasEarly ? 1 : 0;
    }
  },
  {
    id: "night_owl",
    title: "Night Owl",
    description: "Complete a workout after 10 PM.",
    icon: Clock,
    level: "bronze",
    progress: (logs) => {
      const hasLate = logs.some(l => {
        if (!l.date) return false;
        const h = l.date.toDate().getHours();
        return h >= 22;
      });
      return hasLate ? 1 : 0;
    }
  },
  {
    id: "marathon",
    title: "Marathon",
    description: "Workout for more than 2 hours (7200s).",
    icon: Activity,
    level: "silver",
    progress: (logs) => {
      let maxDuration = 0;
      logs.forEach(l => {
        if (l.duration && l.duration > maxDuration) {
          maxDuration = l.duration;
        } else if (l.startTime && l.endTime) {
          const dur = (l.endTime.toMillis() - l.startTime.toMillis()) / 1000;
          if (dur > maxDuration) maxDuration = dur;
        }
      });
      return Math.min(1, maxDuration / 7200);
    }
  },
  {
    id: "perfectionist",
    title: "Perfectionist",
    description: "Complete 100% of sets in a routine (min 10 sets).",
    icon: CheckSquare,
    level: "gold",
    progress: (logs) => {
      const perfect = logs.some(l => {
        let total = 0;
        let completed = 0;
        l.exercises?.forEach(ex => {
          ex.sets?.forEach(s => {
            total++;
            if (s.completed) completed++;
          });
        });
        return total >= 10 && total === completed;
      });
      return perfect ? 1 : 0;
    }
  },
  // Miscellaneous
  {
    id: "cardio_bunny",
    title: "Cardio Bunny",
    description: "Log 10 cardio sessions.",
    icon: Activity,
    level: "silver",
    progress: (logs) => {
      let count = 0;
      logs.forEach(l => {
        const hasCardio = l.exercises?.some(ex => ex.category === 'Cardio' || ex.title?.toLowerCase().includes('run') || ex.title?.toLowerCase().includes('cycle'));
        if (hasCardio) count++;
      });
      return Math.min(1, count / 10);
    }
  },
  {
    id: "leg_day_hero",
    title: "Leg Day Hero",
    description: "Complete 20 leg focused exercises.",
    icon: Target,
    level: "silver",
    progress: (logs) => {
      let count = 0;
      logs.forEach(l => {
         l.exercises?.forEach(ex => {
            if (ex.muscleFocus && (ex.muscleFocus.includes('Quads') || ex.muscleFocus.includes('Hamstrings') || ex.muscleFocus.includes('Calves') || ex.muscleFocus.includes('Glutes'))) {
               count++;
            }
         });
      });
      return Math.min(1, count / 20);
    }
  },
  {
    id: "upper_body_god",
    title: "Upper Body God",
    description: "Complete 50 upper body focused exercises.",
    icon: Dumbbell,
    level: "gold",
    progress: (logs) => {
      let count = 0;
      logs.forEach(l => {
         l.exercises?.forEach(ex => {
            if (ex.muscleFocus && (ex.muscleFocus.includes('Chest') || ex.muscleFocus.includes('Back') || ex.muscleFocus.includes('Shoulders') || ex.muscleFocus.includes('Biceps') || ex.muscleFocus.includes('Triceps'))) {
               count++;
            }
         });
      });
      return Math.min(1, count / 50);
    }
  },
  {
    id: "streak_7",
    title: "Unstoppable",
    description: "Perform 7 workouts within 7 days.",
    icon: Flame,
    level: "platinum",
    progress: (logs) => {
      if (logs.length < 7) return logs.length / 7;
      let sorted = [...logs].filter(l => l.date).sort((a,b) => a.date.toMillis() - b.date.toMillis());
      let maxConsecutive = 1;
      let currentConsecutive = 1;
      for (let i = 1; i < sorted.length; i++) {
        let diffHours = (sorted[i].date.toMillis() - sorted[i-1].date.toMillis()) / (1000 * 60 * 60);
        if (diffHours <= 48 && diffHours > 4) { // Roughly 1 workout a day
          currentConsecutive++;
          if (currentConsecutive > maxConsecutive) maxConsecutive = currentConsecutive;
        } else {
          currentConsecutive = 1;
        }
      }
      return Math.min(1, maxConsecutive / 7);
    }
  },
  {
    id: "heavy_squat_volume",
    title: "Squat Volume 10k",
    description: "Move 10,000 unit volume on Squats.",
    icon: Dumbbell,
    level: "gold",
    progress: (logs) => {
      let vol = 0;
      logs.forEach(l => l.exercises?.forEach(ex => {
         if (ex.title?.toLowerCase().includes("squat")) {
            ex.sets?.forEach(s => {
               if (s.completed && s.weight && s.reps) vol += s.weight * s.reps;
            });
         }
      }));
      return Math.min(1, vol / 10000);
    }
  },
  {
    id: "bench_volume_10k",
    title: "Bench Volume 10k",
    description: "Move 10,000 unit volume on Bench Press.",
    icon: Dumbbell,
    level: "gold",
    progress: (logs) => {
      let vol = 0;
      logs.forEach(l => l.exercises?.forEach(ex => {
         if (ex.title?.toLowerCase().includes("bench")) {
            ex.sets?.forEach(s => {
               if (s.completed && s.weight && s.reps) vol += s.weight * s.reps;
            });
         }
      }));
      return Math.min(1, vol / 10000);
    }
  },
  {
    id: "deadlift_volume_10k",
    title: "Deadlift Volume 10k",
    description: "Move 10,000 unit volume on Deadlifts.",
    icon: Dumbbell,
    level: "gold",
    progress: (logs) => {
      let vol = 0;
      logs.forEach(l => l.exercises?.forEach(ex => {
         if (ex.title?.toLowerCase().includes("deadlift")) {
            ex.sets?.forEach(s => {
               if (s.completed && s.weight && s.reps) vol += s.weight * s.reps;
            });
         }
      }));
      return Math.min(1, vol / 10000);
    }
  },
  {
    id: "1rep_max_tester",
    title: "The 1RM Tester",
    description: "Log a completed 1-rep set.",
    icon: Star,
    level: "bronze",
    progress: (logs) => {
      let found = false;
      logs.forEach(l => l.exercises?.forEach(ex => ex.sets?.forEach(s => {
        if (s.completed && s.reps === 1) found = true;
      })));
      return found ? 1 : 0;
    }
  },
  {
    id: "endurance_beast",
    title: "Endurance Beast",
    description: "Log a completed set of 20+ reps.",
    icon: Target,
    level: "silver",
    progress: (logs) => {
      let found = false;
      logs.forEach(l => l.exercises?.forEach(ex => ex.sets?.forEach(s => {
        if (s.completed && s.reps && s.reps >= 20) found = true;
      })));
      return found ? 1 : 0;
    }
  },
  {
    id: "master_of_variations",
    title: "Master of Variations",
    description: "Perform 20 different exercises.",
    icon: Trophy,
    level: "platinum",
    progress: (logs) => {
      let uniqueEx = new Set();
      logs.forEach(l => l.exercises?.forEach(ex => {
        if (ex.title) uniqueEx.add(ex.title);
      }));
      return Math.min(1, uniqueEx.size / 20);
    }
  }
];
