"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useDb } from "@/lib/db";
import { LOCAL_USER_ID } from "@/lib/db/constants";
import { AppShell } from "@/components/layout/app-shell";
import { eq } from "drizzle-orm";
import { users } from "@/lib/db/schema";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { db, isReady } = useDb();
  const router = useRouter();

  const { data: user, isLoading, isFetching } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const result = await db
        .select()
        .from(users)
        .where(eq(users.id, LOCAL_USER_ID))
        .limit(1);
      return result[0] ?? null;
    },
    enabled: isReady,
  });

  useEffect(() => {
    // Only redirect once we have a settled (non-fetching) result
    if (isReady && !isLoading && !isFetching) {
      if (!user || !user.onboardingCompleted) {
        router.replace("/onboarding");
      }
    }
  }, [isReady, isLoading, isFetching, user, router]);

  // Show blank screen while DB initializes, loading, or any fetch in flight
  if (!isReady || isLoading || isFetching || !user || !user.onboardingCompleted) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <AppShell
      user={{
        name: user.displayName ?? user.email,
        email: user.email,
        avatar: user.avatarUrl ?? "",
      }}
    >
      {children}
    </AppShell>
  );
}
