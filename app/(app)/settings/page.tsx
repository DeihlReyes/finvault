"use client";

import { useUser, useCategories } from "@/lib/hooks/use-db-queries";
import { SettingsCategories } from "./settings-categories";
import { DangerZone } from "@/components/settings/danger-zone";
import { ProfileForm } from "@/components/settings/profile-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  const { data: user, isLoading: userLoading } = useUser();
  const { data: categories = [], isLoading: catsLoading } = useCategories();

  if (userLoading || catsLoading) {
    return (
      <div className="p-4 md:p-6 mx-auto space-y-4">
        <h2 className="text-xl font-bold">Settings</h2>
        <div className="space-y-4">
          <Skeleton className="h-44 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="p-4 md:p-6 mx-auto space-y-4">
      <h2 className="text-xl font-bold">Settings</h2>

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
        <Card className="flex-1 hidden md:block">
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-sm font-bold truncate">{user.email}</p>
            <Badge variant="secondary" className="mt-1 text-xs font-normal">
              Local Account
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Profile form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-0">
          <ProfileForm
            initialValues={{
              displayName: user.displayName ?? null,
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

      {/* Danger zone */}
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-base text-destructive">
            Danger zone
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-0">
          <DangerZone />
        </CardContent>
      </Card>
    </div>
  );
}
