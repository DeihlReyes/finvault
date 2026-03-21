export default function DashboardLoading() {
  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 bg-secondary rounded w-40" />
          <div className="h-4 bg-secondary rounded w-24" />
        </div>
        <div className="h-8 bg-secondary rounded w-24" />
      </div>
      <div className="h-12 bg-card border border-border rounded-xl" />
      <div className="h-24 bg-card border border-border rounded-xl" />
      <div className="h-56 bg-card border border-border rounded-xl" />
    </div>
  );
}
