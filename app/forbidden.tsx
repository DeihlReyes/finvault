import Link from "next/link";

export default function Forbidden() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <p className="text-6xl">🚫</p>
        <h1 className="text-2xl font-bold">403 — Forbidden</h1>
        <p className="text-muted-foreground text-sm">
          You don&apos;t have permission to access this resource.
        </p>
        <Link
          href="/dashboard"
          className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
