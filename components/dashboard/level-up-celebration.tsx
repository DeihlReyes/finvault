"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

const CONFETTI = ["🎉", "⭐", "✨", "🌟", "💫", "🎊", "🏆", "🎯"];

type Props = {
  level: number;
  onDismiss: () => void;
};

export function LevelUpCelebration({ level, onDismiss }: Props) {
  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        className="fixed inset-0 z-[100] flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onDismiss}
        />

        {/* Floating confetti */}
        {CONFETTI.map((emoji, i) => (
          <motion.span
            key={i}
            className="absolute text-2xl pointer-events-none select-none"
            style={{ left: `${10 + i * 11}%` }}
            initial={{ y: "110vh", opacity: 0, rotate: 0 }}
            animate={{
              y: "-10vh",
              opacity: [0, 1, 1, 0],
              rotate: i % 2 === 0 ? 360 : -360,
            }}
            transition={{
              duration: 2.5,
              delay: i * 0.12,
              ease: "easeOut",
            }}
          >
            {emoji}
          </motion.span>
        ))}

        {/* Card */}
        <motion.div
          className="relative z-10 bg-card border border-primary/30 rounded-2xl p-8 text-center max-w-sm w-full mx-4 shadow-2xl"
          initial={{ scale: 0.5, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <motion.div
            className="text-6xl mb-3"
            animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            🏆
          </motion.div>

          <motion.p
            className="text-sm font-medium text-primary uppercase tracking-widest mb-1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Level Up!
          </motion.p>

          <motion.p
            className="text-5xl font-bold mb-2"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", delay: 0.5 }}
          >
            {level}
          </motion.p>

          <motion.p
            className="text-muted-foreground text-sm mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            You reached Level {level}. Keep it up!
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <Button onClick={onDismiss} className="w-full">
              Awesome!
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
