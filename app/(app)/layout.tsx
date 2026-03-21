import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/get-user";
import { AppShell } from "@/components/layout/app-shell";

async function AppShellWrapper({ children }: { children: React.ReactNode }) {
  const auth = await getUser();
  if (!auth) redirect("/login");

  return (
    <AppShell
      user={{
        name: auth.user.displayName ?? auth.user.email,
        email: auth.user.email,
        avatar: auth.user.avatarUrl ?? "",
      }}
    >
      {children}
    </AppShell>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <AppShellWrapper>{children}</AppShellWrapper>
    </Suspense>
  );
}
