export default function ReportsLoading() {
  return (
    <div className="p-4 md:p-6  mx-auto space-y-4 animate-pulse">
      <div className="h-7 bg-secondary rounded w-24" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-20 bg-card border border-border rounded-xl" />
        <div className="h-20 bg-card border border-border rounded-xl" />
      </div>
      <div className="h-20 bg-card border border-border rounded-xl" />
      <div className="h-48 bg-card border border-border rounded-xl" />
    </div>
  );
}
