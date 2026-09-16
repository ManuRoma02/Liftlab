import React, { useEffect, useRef, useState } from "react";
import Model, { IExerciseData } from "react-body-highlighter";
import type { ExerciseData } from "../../types/workout";

export function ExerciseMuscleVisual({
  exercise,
  className = "w-24 h-24",
}: {
  exercise?: ExerciseData;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { rootMargin: "200px" } // Pre-load slightly before scrolling into view
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  if (!exercise)
    return <div className={`${className} bg-surface-variant rounded-lg`}></div>;

  const category = (exercise.category || "").toLowerCase();
  const title = (exercise.title || "").toLowerCase();
  const muscleFocus = exercise.muscleFocus?.map((m) => m.toLowerCase()) || [];

  // Using standard red for generic highlight
  const activeColor = "#ca0a0f";
  const inactiveColor = "#353534";

  const getMusclesForCategory = (): string[] => {
    // If specific focus is defined, use it but map to highlighter keys
    if (muscleFocus.length > 0) {
      const focusMap: Record<string, string[]> = {
        chest: ["chest"],
        petto: ["chest"],
        biceps: ["biceps"],
        bicipiti: ["biceps"],
        triceps: ["triceps"],
        tricipiti: ["triceps"],
        shoulders: ["front-deltoids", "back-deltoids"],
        spalle: ["front-deltoids", "back-deltoids"],
        quads: ["quadriceps"],
        quadricipiti: ["quadriceps"],
        hamstrings: ["hamstring"],
        femorali: ["hamstring"],
        calves: ["calves"],
        polpacci: ["calves"],
        glutes: ["gluteal"],
        glutei: ["gluteal"],
        abs: ["abs"],
        addominali: ["abs"],
        traps: ["trapezius"],
        trapezius: ["trapezius"],
        "upper back": ["upper-back"],
        "lower back": ["lower-back"],
        forearms: ["forearm"],
        forearm: ["forearm"],
        avambracci: ["forearm"],
      };

      let result: string[] = [];
      muscleFocus.forEach((m) => {
        if (focusMap[m]) result = [...result, ...focusMap[m]];
        else if (m === "core") result = [...result, "abs", "obliques"];
        else result.push(m);
      });

      const validMuscles = [
        "trapezius",
        "upper-back",
        "lower-back",
        "chest",
        "biceps",
        "triceps",
        "forearm",
        "back-deltoids",
        "front-deltoids",
        "abs",
        "obliques",
        "adductor",
        "hamstring",
        "quadriceps",
        "abductors",
        "calves",
        "gluteal",
        "head",
        "neck",
        "knees",
        "left-soleus",
        "right-soleus",
      ];

      result = result.filter((m) => validMuscles.includes(m));

      if (result.length > 0) return result;
    }

    // Heuristic based on title keywords
    if (
      title.includes("bicep") ||
      title.includes("curl") ||
      title.includes("bicipit")
    ) {
      if (!title.includes("leg curl") && !title.includes("hammer"))
        return ["biceps"];
    }
    if (
      title.includes("tricep") ||
      title.includes("pushdown") ||
      title.includes("skullcrusher") ||
      title.includes("tricipit")
    )
      return ["triceps"];
    if (title.includes("hammer curl")) return ["biceps", "forearm"];
    if (
      title.includes("bench press") ||
      title.includes("chest press") ||
      title.includes("pec deck") ||
      title.includes("fly")
    )
      return ["chest"];
    if (
      title.includes("lat pull") ||
      title.includes("pull up") ||
      title.includes("chin up")
    )
      return ["upper-back", "biceps"];
    if (title.includes("row") || title.includes("rimatore"))
      return ["upper-back", "trapezius"];
    if (title.includes("deadlift") || title.includes("stacco"))
      return ["lower-back", "hamstring", "gluteal", "trapezius"];
    if (
      title.includes("squat") ||
      title.includes("leg press") ||
      (title.includes("exten") && category.includes("leg"))
    )
      return ["quadriceps", "gluteal"];
    if (
      title.includes("leg curl") ||
      title.includes("stacco rumeno") ||
      title.includes("hamstring")
    )
      return ["hamstring", "gluteal"];
    if (title.includes("calf") || title.includes("polpacci")) return ["calves"];
    if (
      title.includes("overhead press") ||
      title.includes("military") ||
      title.includes("shoulder press")
    )
      return ["front-deltoids"];
    if (title.includes("lateral raise") || title.includes("alzate laterali"))
      return ["front-deltoids"];
    if (title.includes("rear delt") || title.includes("fly posterior"))
      return ["back-deltoids"];
    if (title.includes("shrug") || title.includes("scrollate"))
      return ["trapezius"];
    if (
      title.includes("crunch") ||
      title.includes("abs") ||
      title.includes("plank")
    )
      return ["abs"];

    // Fallback to Category broad mapping
    switch (category) {
      case "chest":
      case "petto":
        return ["chest"];
      case "back":
      case "schiena":
      case "dorso":
        return ["trapezius", "upper-back", "lower-back"];
      case "legs":
      case "gambe":
        return ["quadriceps", "hamstring", "gluteal", "calves", "adductor"];
      case "arms":
      case "braccia":
        return ["biceps", "triceps", "forearm"];
      case "core":
      case "addome":
        return ["abs", "obliques"];
      case "shoulders":
      case "spalle":
        return ["front-deltoids", "back-deltoids"];
      default:
        return [];
    }
  };

  const data: IExerciseData[] = [
    { name: "Exercise", muscles: getMusclesForCategory() as any },
  ];

  return (
    <div
      ref={containerRef}
      className={`${className} flex items-center justify-center p-1 bg-surface-container-high rounded-lg overflow-hidden border border-surface-variant group-hover:border-primary-container transition-all relative`}
    >
      {isVisible ? (
        <div className="flex h-full w-full opacity-90 group-hover:opacity-100 transition-opacity">
          <Model
            type="anterior"
            data={data}
            style={{ width: "50%", height: "100%" }}
            svgStyle={{ width: "100%", height: "100%" }}
            bodyColor={inactiveColor}
            highlightedColors={[
              activeColor,
              activeColor,
              activeColor,
              activeColor,
            ]}
          />
          <Model
            type="posterior"
            data={data}
            style={{ width: "50%", height: "100%" }}
            svgStyle={{ width: "100%", height: "100%" }}
            bodyColor={inactiveColor}
            highlightedColors={[
              activeColor,
              activeColor,
              activeColor,
              activeColor,
            ]}
          />
        </div>
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-surface-container-high to-transparent opacity-80 pointer-events-none"></div>
    </div>
  );
}
