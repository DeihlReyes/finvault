import { Skeleton } from "@/components/ui/skeleton";

export default function AchievementsLoading() {
  return (
    <div className="p-4 md:p-6 mx-auto space-y-4">
      <Skeleton className="h-7 w-36" />
      {/* XP summary card */}
      <Skeleton className="h-24 w-full rounded-xl" />
      {/* Achievement grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
