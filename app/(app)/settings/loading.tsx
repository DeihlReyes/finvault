import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="p-4 md:p-6 mx-auto space-y-4">
      <Skeleton className="h-7 w-24" />
      {/* Stats row */}
      <div className="flex gap-3">
        <Skeleton className="h-20 flex-1 rounded-xl" />
        <Skeleton className="h-20 flex-1 rounded-xl" />
        <Skeleton className="h-20 flex-1 rounded-xl hidden md:block" />
      </div>
      {/* Profile */}
      <Skeleton className="h-44 w-full rounded-xl" />
      {/* Categories */}
      <Skeleton className="h-64 w-full rounded-xl" />
      {/* Notifications */}
      <Skeleton className="h-24 w-full rounded-xl" />
      {/* Danger zone */}
      <Skeleton className="h-20 w-full rounded-xl" />
    </div>
  );
}
