"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { completeOnboarding } from "@/actions/user";
import { createWallet } from "@/actions/wallets";

const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "SGD", "INR", "PHP", "MXN"];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [displayName, setDisplayName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [walletName, setWalletName] = useState("Main Wallet");
  const [walletBalance, setWalletBalance] = useState("0");

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
      // Create first wallet
      const fd = new FormData();
      fd.set("name", walletName);
      fd.set("type", "BANK");
      fd.set("balance", walletBalance);
      fd.set("currency", currency);
      await createWallet(null, fd);

      // Complete onboarding (redirects to /dashboard)
      await completeOnboarding({ displayName, currency });
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
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                s <= step ? "bg-primary" : "bg-border"
              }`}
            />
          ))}
        </div>

        <div className="bg-card border border-border rounded-2xl p-8">
          {step === 1 && (
            <form onSubmit={handleStep1} className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold mb-1">Welcome to FinVault! 🎉</h2>
                <p className="text-muted-foreground text-sm">Let&apos;s set up your profile.</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Your name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="What should we call you?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Default currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90"
              >
                Continue →
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleStep2} className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold mb-1">Create your first wallet 👛</h2>
                <p className="text-muted-foreground text-sm">
                  You&apos;ll earn <span className="text-primary font-semibold">+25 XP</span> for this!
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Wallet name</label>
                <input
                  type="text"
                  value={walletName}
                  onChange={(e) => setWalletName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Current balance</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    {currency}
                  </span>
                  <input
                    type="number"
                    value={walletBalance}
                    onChange={(e) => setWalletBalance(e.target.value)}
                    min="0"
                    step="0.01"
                    className="w-full pl-14 pr-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-secondary"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90"
                >
                  Continue →
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleFinish} className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold mb-1">You&apos;re all set! 🚀</h2>
                <p className="text-muted-foreground text-sm">
                  Here&apos;s a summary of your setup:
                </p>
              </div>

              <div className="space-y-3 bg-secondary/50 rounded-xl p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium">{displayName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Currency</span>
                  <span className="font-medium">{currency}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">First wallet</span>
                  <span className="font-medium">{walletName}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={isPending}
                  className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-secondary disabled:opacity-50"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
                >
                  {isPending ? "Setting up…" : "Get started!"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
