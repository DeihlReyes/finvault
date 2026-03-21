"use client";

import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { dismissWelcomeModal } from "@/actions/onboarding";

const FEATURE_CARDS = [
  {
    emoji: "👛",
    title: "Wallets",
    description: "Track cash, bank, and credit accounts in one place.",
    href: "/wallets",
  },
  {
    emoji: "💳",
    title: "Transactions",
    description: "Log income and expenses to earn XP every day.",
    href: "/transactions",
  },
  {
    emoji: "📊",
    title: "Budgets",
    description: "Set monthly limits by category and stay on track.",
    href: "/budgets",
  },
  {
    emoji: "🏆",
    title: "Achievements",
    description: "Complete milestones to unlock badges and bonus XP.",
    href: "/achievements",
  },
];

type Props = {
  displayName: string;
  onDismiss: () => void;
};

export function WelcomeModal({ displayName, onDismiss }: Props) {
  const router = useRouter();

  async function handleDismiss() {
    onDismiss();
    await dismissWelcomeModal();
  }

  async function handleNavigate(href: string) {
    onDismiss();
    await dismissWelcomeModal();
    router.push(href);
  }

  return (
    <AnimatePresence>
      <motion.div
        key="welcome-overlay"
        className="fixed inset-0 z-[90] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={handleDismiss}
        />

        {/* Card */}
        <motion.div
          className="relative z-10 bg-card border border-primary/30 rounded-2xl p-6 max-w-md w-full mx-auto shadow-2xl"
          initial={{ scale: 0.9, opacity: 0, y: 24 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 22 }}
        >
          {/* Dismiss X */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors text-lg leading-none"
            aria-label="Skip"
          >
            ✕
          </button>

          {/* Header */}
          <motion.div
            className="text-center mb-5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="text-5xl mb-2">🎉</div>
            <h2 className="text-xl font-bold">
              Welcome, {displayName || "there"}!
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Here&apos;s what you can do in FinVault.
            </p>
          </motion.div>

          {/* Feature grid */}
          <motion.div
            className="grid grid-cols-2 gap-2 mb-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
          >
            {FEATURE_CARDS.map((card) => (
              <button
                key={card.href}
                onClick={() => handleNavigate(card.href)}
                className="text-left bg-secondary/50 hover:bg-secondary transition-colors rounded-xl p-3 group"
              >
                <div className="text-2xl mb-1">{card.emoji}</div>
                <p className="text-sm font-semibold group-hover:text-primary transition-colors">
                  {card.title}
                </p>
                <p className="text-xs text-muted-foreground leading-snug mt-0.5">
                  {card.description}
                </p>
              </button>
            ))}
          </motion.div>

          {/* XP hint */}
          <motion.p
            className="text-xs text-center text-muted-foreground mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Every transaction earns you{" "}
            <span className="text-primary font-semibold">XP</span>. Log daily
            to level up and unlock achievements!
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Button className="w-full" onClick={handleDismiss}>
              Let&apos;s go!
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
