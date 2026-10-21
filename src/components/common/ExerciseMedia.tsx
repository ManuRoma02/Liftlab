import React, { useState, useEffect } from "react";
import type { ExerciseData } from "../../types/workout";
import { getExerciseMediaCandidates } from "../../lib/workoutUtils";
import { ExerciseMuscleVisual } from "./ExerciseMuscleVisual";

export interface ExerciseMediaProps {
  exercise: ExerciseData;
  className?: string;
  imageClassName?: string;
  preferGif?: boolean;
  alt?: string;
}

export const ExerciseMedia: React.FC<ExerciseMediaProps> = ({
  exercise,
  className = "w-full h-full",
  imageClassName = "w-full h-full object-cover",
  preferGif = false,
  alt,
}) => {
  const primarySource = preferGif
    ? exercise.gifUrl || exercise.image
    : exercise.image || exercise.gifUrl;
  const fallbackSource = preferGif ? exercise.image : exercise.gifUrl;

  const candidates = React.useMemo(() => {
    const list: string[] = [];
    if (primarySource) list.push(...getExerciseMediaCandidates(primarySource));
    if (fallbackSource && fallbackSource !== primarySource) {
      list.push(...getExerciseMediaCandidates(fallbackSource));
    }
    return list;
  }, [primarySource, fallbackSource]);

  const [candidateIndex, setCandidateIndex] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setCandidateIndex(0);
    setHasError(false);
    setIsLoaded(false);
  }, [exercise.id, primarySource]);

  const currentUrl = candidates[candidateIndex];

  if (!currentUrl || hasError) {
    return <ExerciseMuscleVisual exercise={exercise} className={className} />;
  }

  return (
    <div className={`relative overflow-hidden flex items-center justify-center bg-black/40 ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <ExerciseMuscleVisual exercise={exercise} className="w-full h-full opacity-60" />
        </div>
      )}
      <img
        src={currentUrl}
        alt={alt || exercise.title}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          if (candidateIndex + 1 < candidates.length) {
            setCandidateIndex((prev) => prev + 1);
          } else {
            setHasError(true);
          }
        }}
        className={`${imageClassName} transition-opacity duration-300 ${isLoaded ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
};
