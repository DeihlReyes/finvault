import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { signOut } from "@/actions/auth";
import { SettingsCategories } from "./settings-categories";
import { NotificationPreferences } from "@/components/settings/notification-preferences";
import { DangerZone } from "@/components/settings/danger-zone";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = { title: "Settings — FinVault" };

async function SettingsContent() {
  const auth = await getUser();
  if (!auth) redirect("/login");

  const { user, supabaseId: userId } = auth;

  const categories = await db.category.findMany({
    where: { userId, isArchived: false },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-6">
      {/* Profile */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Profile</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          {[
            { label: "Display name", value: user.displayName ?? "—" },
            { label: "Email", value: user.email },
            { label: "Currency", value: user.currency },
            { label: "Level", value: `${user.level} (${user.totalXP} XP)` },
            { label: "Streak", value: `🔥 ${user.streak} days` },
          ].map(({ label, value }, i, arr) => (
            <div key={label}>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="truncate ml-4 max-w-[60%] text-right">{value}</span>
              </div>
              {i < arr.length - 1 && <Separator className="mt-3" />}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Categories */}
      <SettingsCategories
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          emoji: c.emoji,
          color: c.color,
          isDefault: c.isDefault,
        }))}
      />

      {/* Notifications */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Notifications</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <NotificationPreferences />
        </CardContent>
      </Card>

      {/* Account */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <form action={signOut}>
            <Button
              type="submit"
              variant="outline"
              className="w-full hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
            >
              Sign out
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-destructive">Danger zone</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <DangerZone />
        </CardContent>
      </Card>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4">
      <h2 className="text-xl font-bold">Settings</h2>
      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-44 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        }
      >
        <SettingsContent />
      </Suspense>
    </div>
  );
}
