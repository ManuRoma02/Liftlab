import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import welcomeImg from "../assets/images/liftlab_welcome_1779009844351.png";
import workoutImg from "../assets/images/liftlab_workout_1779009862346.png";
import statsImg from "../assets/images/liftlab_stats_1779009880448.png";
import readyImg from "../assets/images/liftlab_ready_1779009897309.png";

export function OnboardingTutorial({ onFinish }: { onFinish: () => void }) {
  const [step, setStep] = useState(0);
  const steps = [
    {
      title: "Welcome to LIFTLAB",
      description:
        "Your ultimate gym companion for tracking workouts, routine management, and progress analysis.",
      image: welcomeImg,
    },
    {
      title: "Workouts",
      description:
        "Create and track your workouts. Build routines or start an empty workout to record sets and reps.",
      image: workoutImg,
    },
    {
      title: "Stats & Analysis",
      description:
        "Keep track of your body weight, volume, personal records, and strength progression over time.",
      image: statsImg,
    },
    {
      title: "Ready?",
      description:
        "You are ready to crush your goals! Forge your legacy and track your limits.",
      image: readyImg,
    },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/95 backdrop-blur-md z-[200] flex items-center justify-center p-4 md:p-6"
      >
        <motion.div
          layoutId="tutorialCard"
          className="bg-surface-container-high border border-surface-variant rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl flex flex-col gap-6 relative overflow-hidden"
        >
          {/* Subtle glow effect */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-primary/10 blur-[80px] rounded-full pointer-events-none" />

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-6 relative z-10"
            >
              <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden relative shadow-lg ring-1 ring-surface-variant/50">
                <img
                  src={steps[step].image}
                  alt={steps[step].title}
                  className="absolute inset-0 w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="text-center">
                <h2 className="text-2xl font-black text-primary uppercase tracking-tight mb-2">
                  {steps[step].title}
                </h2>
                <p className="text-on-surface-variant text-sm sm:text-base leading-relaxed max-w-[280px] mx-auto">
                  {steps[step].description}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between items-center mt-2 relative z-10">
            <div className="flex gap-2 items-center">
              {steps.map((_, i) => (
                <motion.div
                  key={i}
                  initial={false}
                  animate={{
                    width: i === step ? 24 : 8,
                    backgroundColor:
                      i === step
                        ? "var(--color-primary-fixed)"
                        : "var(--color-surface-variant)",
                  }}
                  className="h-2 rounded-full cursor-pointer"
                  onClick={() => setStep(i)}
                />
              ))}
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (step < steps.length - 1) setStep(step + 1);
                else onFinish();
              }}
              className="bg-primary text-[#000000] px-6 py-3 rounded-full font-bold uppercase tracking-wider text-sm hover:opacity-90 transition-all shadow-[0_0_15px_rgba(195,244,0,0.2)]"
            >
              {step === steps.length - 1 ? "Forge It" : "Next"}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
