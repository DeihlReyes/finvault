"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function Forbidden() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <p className="text-6xl">🚫</p>
        <h1 className="text-2xl font-bold">403 — Forbidden</h1>
        <p className="text-muted-foreground text-sm">
          You don&apos;t have permission to access this resource.
        </p>
        <Link href="/dashboard" className={buttonVariants()}>Back to dashboard</Link>
      </div>
    </div>
  );
}
