import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { SettingsCategories } from "./settings-categories";
import { NotificationPreferences } from "@/components/settings/notification-preferences";
import { DangerZone } from "@/components/settings/danger-zone";
import { ProfileForm } from "@/components/settings/profile-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
      {/* Stats */}
      <div className="flex gap-3">
        <Card className="flex-1">
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold">{user.level}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Level</p>
            <p className="text-xs text-muted-foreground">{user.totalXP} XP</p>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold">🔥 {user.streak}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Day streak</p>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-sm font-bold truncate">{user.email}</p>
            <Badge variant="secondary" className="mt-1 text-xs font-normal">
              Account
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Profile form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Profile</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ProfileForm
            initialValues={{
              displayName: user.displayName,
              currency: user.currency,
              timezone: user.timezone,
            }}
          />
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

      {/* Danger zone */}
      <Card className="border-destructive/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-destructive">
            Danger zone
          </CardTitle>
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
    <div className="p-4 md:p-6  mx-auto space-y-4">
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
