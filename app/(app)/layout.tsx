import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";

/**
 * App shell layout — does NOT check auth here.
 * proxy.ts handles all auth redirects and onboarding gating.
 * Individual pages fetch user data inside <Suspense> boundaries per Next.js 16 PPR rules.
 *
 * AppShell is wrapped in <Suspense> so PPR treats the nav (which uses usePathname())
 * as dynamic. Since AppShell has no async work the Suspense resolves immediately.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}
