import { Badge } from "@/components/ui/badge";

type Props = {
  displayName: string;
  level: number;
  totalXP: number;
  streak: number;
  streakFreezeAvailable: number;
  greeting: string;
};

export function HeroHeader({
  displayName,
  level,
  totalXP,
  streak,
  streakFreezeAvailable,
  greeting,
}: Props) {
  return (
    <div className="rounded-xl bg-primary/10 border border-primary/20 px-4 py-3 md:px-5 md:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-lg md:text-2xl font-bold">
          {greeting}, {displayName || "there"} 👋
        </h2>
        <p className="text-muted-foreground text-sm mt-0.5">
          Level {level} &middot; {totalXP} XP total
        </p>
      </div>

      <div className="flex flex-row sm:flex-col sm:items-end items-center gap-2 sm:gap-1.5 shrink-0">
        <Badge className="flex items-center gap-1.5 rounded-full px-3 py-1.5">
          <span className="text-base leading-none">🔥</span>
          <span className="font-bold text-sm leading-none">
            {streak} streak
          </span>
        </Badge>
        {streakFreezeAvailable > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>🧊</span>
            <span>
              {streakFreezeAvailable} freeze
              {streakFreezeAvailable > 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
