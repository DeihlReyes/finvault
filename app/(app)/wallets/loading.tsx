export default function WalletsLoading() {
  return (
    <div className="p-4 md:p-6  mx-auto space-y-4 animate-pulse">
      <div className="h-7 bg-secondary rounded w-24" />
      <div className="h-20 bg-card border border-border rounded-xl" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-28 bg-card border border-border rounded-xl"
          />
        ))}
      </div>
    </div>
  );
}
