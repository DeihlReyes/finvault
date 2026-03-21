import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { signOut } from "@/actions/auth";

export const metadata = { title: "Settings — FinVault" };

async function SettingsContent() {
  const auth = await getUser();
  if (!auth) redirect("/login");

  const { user, supabaseId: userId } = auth;

  const categories = await db.category.findMany({
    where: { userId, isArchived: false },
    orderBy: { isDefault: "desc" },
  });

  return (
    <div className="space-y-6">
      {/* Profile */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold mb-4">Profile</h3>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Display name</span>
            <span>{user.displayName ?? "—"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Email</span>
            <span>{user.email}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Currency</span>
            <span>{user.currency}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Level</span>
            <span>{user.level} ({user.totalXP} XP)</span>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold mb-4">Categories</h3>
        <div className="space-y-2">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2 text-sm">
                <span>{cat.emoji}</span>
                <span>{cat.name}</span>
                {cat.isDefault && (
                  <span className="text-xs bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">default</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sign out */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold mb-4">Account</h3>
        <form action={signOut}>
          <button
            type="submit"
            className="w-full py-2 border border-border rounded-lg text-sm hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-colors"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4">
      <h2 className="text-xl font-bold">Settings</h2>
      <Suspense fallback={<div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-card border border-border rounded-xl animate-pulse" />)}</div>}>
        <SettingsContent />
      </Suspense>
    </div>
  );
}
