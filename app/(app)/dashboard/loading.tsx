import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="p-4 md:p-6 space-y-4 mx-auto">
      {/* Hero header */}
      <Skeleton className="h-20 w-full rounded-xl" />

      {/* Stat strip */}
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-24 col-span-3 sm:col-span-1 rounded-xl" />
        <Skeleton className="h-24 col-span-3 sm:col-span-1 rounded-xl" />
        <Skeleton className="h-24 col-span-3 sm:col-span-1 rounded-xl" />
      </div>

      {/* Gamification row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>

      {/* Budget health */}
      <Skeleton className="h-24 rounded-xl" />

      {/* Activity row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}
