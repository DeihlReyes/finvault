"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { completeOnboarding } from "@/actions/user";
import { createWallet } from "@/actions/wallets";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "CAD",
  "AUD",
  "SGD",
  "INR",
  "PHP",
  "MXN",
];

const WALLET_TYPES = [
  { value: "BANK", label: "Bank Account" },
  { value: "CASH", label: "Cash" },
  { value: "EWALLET", label: "E-Wallet" },
  { value: "CREDIT_CARD", label: "Credit Card" },
  { value: "SAVINGS", label: "Savings" },
  { value: "INVESTMENT", label: "Investment" },
];

const stepVariants = {
  enter: { opacity: 0, x: 24 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
};

export default function OnboardingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [displayName, setDisplayName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [walletName, setWalletName] = useState("Main Wallet");
  const [walletBalance, setWalletBalance] = useState("0");
  const [walletType, setWalletType] = useState("BANK");

  function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) return;
    setStep(2);
  }

  function handleStep2(e: React.FormEvent) {
    e.preventDefault();
    setStep(3);
  }

  async function handleFinish(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await createWallet({
        name: walletName,
        type: walletType,
        balance: parseFloat(walletBalance) || 0,
        currency,
      });
      await completeOnboarding({ displayName, currency });
      await queryClient.refetchQueries({ queryKey: ["user"] });
      router.push("/dashboard");
    });
  }

  async function handleSkip() {
    startTransition(async () => {
      await completeOnboarding({
        displayName: displayName || "there",
        currency,
      });
      await queryClient.refetchQueries({ queryKey: ["user"] });
      router.push("/dashboard");
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Progress indicator */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                s <= step ? "bg-primary" : "bg-border"
              }`}
            />
          ))}
        </div>

        <Card>
          <CardContent className="pt-8 pb-8 overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              {step === 1 && (
                <motion.form
                  key="step1"
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  onSubmit={handleStep1}
                  className="space-y-5"
                >
                  <div>
                    <h2 className="text-2xl font-bold mb-1">
                      Welcome to FinVault! 🎉
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      Let&apos;s set up your profile.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Your name</Label>
                    <Input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                      placeholder="What should we call you?"
                      className="h-9 w-full"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Default currency</Label>
                    <Select
                      value={currency}
                      onValueChange={(v) => v && setCurrency(v)}
                    >
                      <SelectTrigger className="w-full h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button type="submit" className="w-full">
                    Continue →
                  </Button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleSkip}
                      disabled={isPending}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Skip for now →
                    </button>
                  </div>
                </motion.form>
              )}

              {step === 2 && (
                <motion.form
                  key="step2"
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  onSubmit={handleStep2}
                  className="space-y-5"
                >
                  <div>
                    <h2 className="text-2xl font-bold mb-1">
                      Create your first wallet 👛
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      You&apos;ll earn{" "}
                      <span className="text-primary font-semibold">+25 XP</span>{" "}
                      for this!
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Wallet name</Label>
                    <Input
                      type="text"
                      value={walletName}
                      onChange={(e) => setWalletName(e.target.value)}
                      required
                      className="h-9 w-full"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Wallet type</Label>
                    <Select
                      value={walletType}
                      onValueChange={(v) => v && setWalletType(v)}
                    >
                      <SelectTrigger className="w-full h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {WALLET_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Current balance</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                        {currency}
                      </span>
                      <Input
                        type="number"
                        value={walletBalance}
                        onChange={(e) => setWalletBalance(e.target.value)}
                        min="0"
                        step="0.01"
                        className="h-9 w-full pl-14"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setStep(1)}
                    >
                      ← Back
                    </Button>
                    <Button type="submit" className="flex-1">
                      Continue →
                    </Button>
                  </div>
                </motion.form>
              )}

              {step === 3 && (
                <motion.form
                  key="step3"
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  onSubmit={handleFinish}
                  className="space-y-5"
                >
                  <div>
                    <h2 className="text-2xl font-bold mb-1">
                      You&apos;re all set! 🚀
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      Here&apos;s a summary of your setup:
                    </p>
                  </div>

                  <Card className="bg-secondary/30">
                    <CardContent className="pt-4 space-y-3">
                      {[
                        { label: "Name", value: displayName },
                        { label: "Currency", value: currency },
                        { label: "First wallet", value: walletName },
                        {
                          label: "Wallet type",
                          value:
                            WALLET_TYPES.find((t) => t.value === walletType)
                              ?.label ?? walletType,
                        },
                      ].map(({ label, value }, i, arr) => (
                        <div key={label}>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              {label}
                            </span>
                            <span className="font-medium">{value}</span>
                          </div>
                          {i < arr.length - 1 && <Separator className="mt-3" />}
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <div className="flex items-center justify-center gap-2">
                    <Badge
                      variant="outline"
                      className="text-xs gap-1 px-2.5 py-1"
                    >
                      <span className="text-primary font-bold">+25 XP</span>
                      <span>for your first wallet</span>
                    </Badge>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setStep(2)}
                      disabled={isPending}
                    >
                      ← Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={isPending}
                      className="flex-1"
                    >
                      {isPending ? "Setting up…" : "Get started!"}
                    </Button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
