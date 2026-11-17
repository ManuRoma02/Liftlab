import { useReducedMotion } from "motion/react";
import { pressTransition, reducedFade } from "./motion";

export function useLiftMotion() {
  const reduce = useReducedMotion() === true;
  return { reduce, pressTransition, reducedFade };
}
