import { AppShell } from "@/components/layout/app-shell";

/**
 * App shell layout — does NOT check auth here.
 * Middleware (middleware.ts) handles all auth redirects and onboarding gating.
 * Individual pages fetch user data inside <Suspense> boundaries per Next.js 16 PPR rules.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
