import Link from "next/link";
import { Suspense } from "react";
import { cn } from "@/lib/utils";
import { getUser } from "@/lib/auth/get-user";

const btn =
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";
const btnPrimary = cn(
  btn,
  "bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2",
);
const btnOutline = cn(
  btn,
  "border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2",
);
const btnGhost = cn(
  btn,
  "hover:bg-accent hover:text-accent-foreground h-9 px-3",
);

export const metadata = {
  title: "FinVault — Gamified Personal Finance, Free Forever",
  description:
    "Track spending, build budgets, and level up your finances. No subscription. No ads. Just you and your money.",
};

const FEATURES = [
  {
    emoji: "💳",
    title: "Multi-wallet tracking",
    desc: "Cash, bank accounts, e-wallets, credit cards — all in one place.",
  },
  {
    emoji: "📊",
    title: "Smart budgets",
    desc: "Set monthly limits per category and get alerts before you overspend.",
  },
  {
    emoji: "🔁",
    title: "Recurring transactions",
    desc: "Automate rent, subscriptions, and salaries. Never miss an entry.",
  },
  {
    emoji: "📈",
    title: "Rich reports",
    desc: "Donut charts, trend lines, net worth history — beautiful and fast.",
  },
  {
    emoji: "🏆",
    title: "Gamified XP system",
    desc: "Earn XP for every transaction, level up, hit streaks and unlock achievements.",
  },
  {
    emoji: "📤",
    title: "CSV & PDF exports",
    desc: "Download your data any time. Your finances, your files.",
  },
];

const COMPETITORS = [
  { name: "YNAB", price: "$109/yr" },
  { name: "Monarch", price: "$100/yr" },
  { name: "Copilot", price: "$83/yr" },
  { name: "FinVault", price: "Free", highlight: true },
];

async function NavAuth() {
  const auth = await getUser();
  if (auth) {
    return (
      <Link href="/dashboard" className={cn(btnPrimary, "h-9 px-3 text-xs")}>
        Go to dashboard
      </Link>
    );
  }
  return (
    <>
      <Link href="/login" className={btnGhost}>
        Sign in
      </Link>
      <Link href="/signup" className={cn(btnPrimary, "h-9 px-3 text-xs")}>
        Get started free
      </Link>
    </>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="border-b border-border/50 sticky top-0 z-40 bg-background/80 backdrop-blur">
        <div className=" mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-lg font-bold text-primary tracking-tight">
            FinVault
          </span>
          <div className="flex items-center gap-3">
            <Suspense
              fallback={
                <Link href="/login" className={btnGhost}>
                  Sign in
                </Link>
              }
            >
              <NavAuth />
            </Suspense>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className=" mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-primary/20">
          Free forever — no credit card required
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight mb-6">
          Personal finance that{" "}
          <span className="text-primary">levels you up</span>
        </h1>
        <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-10">
          Track every dollar, build better habits, and earn XP along the way.
          Everything YNAB does — completely free.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/signup"
            className={cn(btnPrimary, "h-11 px-8 text-base")}
          >
            Start for free
          </Link>
          <Link href="/login" className={cn(btnOutline, "h-11 px-8 text-base")}>
            Sign in
          </Link>
        </div>
      </section>

      {/* Pricing comparison */}
      <section className=" mx-auto px-6 pb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-xl mx-auto">
          {COMPETITORS.map(({ name, price, highlight }) => (
            <div
              key={name}
              className={cn(
                "rounded-xl border p-4 text-center",
                highlight
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card",
              )}
            >
              <p
                className={cn(
                  "text-xs font-medium mb-1",
                  highlight ? "text-primary" : "text-muted-foreground",
                )}
              >
                {name}
              </p>
              <p
                className={cn(
                  "text-xl font-bold",
                  highlight ? "text-primary" : "text-foreground",
                )}
              >
                {price}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border/50 bg-card/30">
        <div className=" mx-auto px-6 py-20">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            Everything you need. Nothing you pay for.
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {FEATURES.map(({ emoji, title, desc }) => (
              <div
                key={title}
                className="rounded-xl border border-border bg-card p-5 space-y-2"
              >
                <p className="text-2xl">{emoji}</p>
                <p className="font-semibold text-sm">{title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gamification callout */}
      <section className=" mx-auto px-6 py-20 text-center">
        <p className="text-5xl mb-6">🎮</p>
        <h2 className="text-2xl md:text-3xl font-bold mb-4">
          Finance, but make it fun
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto mb-8">
          Every transaction earns XP. Log daily and build a streak. Unlock
          achievements. Level up. Building good money habits has never felt this
          rewarding.
        </p>
        <div className="flex flex-wrap justify-center gap-3 text-sm">
          {[
            "🔥 Daily streaks",
            "⚡ XP & levels",
            "🏆 Achievements",
            "🎯 Monthly challenges",
          ].map((tag) => (
            <span
              key={tag}
              className="border border-border rounded-full px-4 py-1.5 bg-card"
            >
              {tag}
            </span>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/50 bg-primary/5">
        <div className=" mx-auto px-6 py-20 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Ready to take control?
          </h2>
          <p className="text-muted-foreground mb-8">
            Free forever. No hidden fees. Just better finances.
          </p>
          <Link
            href="/signup"
            className={cn(btnPrimary, "h-11 px-10 text-base")}
          >
            Create your free account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50">
        <div className=" mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="font-semibold text-primary">FinVault</span>
          <span>Built for people tired of paying for budgeting apps.</span>
        </div>
      </footer>
    </div>
  );
}
