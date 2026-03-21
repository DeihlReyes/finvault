export default function TransactionsLoading() {
  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4 animate-pulse">
      <div className="h-7 bg-secondary rounded w-32" />
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-16 bg-card border border-border rounded-xl" />
        ))}
      </div>
    </div>
  );
}
