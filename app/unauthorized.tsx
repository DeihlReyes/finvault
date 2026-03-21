import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <p className="text-6xl">🔒</p>
        <h1 className="text-2xl font-bold">401 — Unauthorized</h1>
        <p className="text-muted-foreground text-sm">
          You need to be signed in to access this page.
        </p>
        <Button>
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
    </div>
  );
}
