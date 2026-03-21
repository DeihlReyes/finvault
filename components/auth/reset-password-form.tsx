"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { requestPasswordReset, updatePassword } from "@/actions/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const hasToken = searchParams.has("token") || searchParams.has("code");
  const [resetState, resetAction, resetPending] = useActionState(requestPasswordReset, null);
  const [newState, newAction, newPending] = useActionState(updatePassword, null);
  const [sent, setSent] = useState(false);

  if (!hasToken && !sent) {
    return (
      <>
        <h2 className="text-xl font-semibold mb-6">Reset your password</h2>
        <p className="text-muted-foreground text-sm mb-4">
          Enter your email and we&apos;ll send a reset link.
        </p>
        <form
          action={async (fd: FormData) => {
            await resetAction(fd);
            setSent(true);
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              className="h-9 w-full"
            />
          </div>
          {resetState?.success === false && (
            <p className="text-destructive text-sm">{resetState.error}</p>
          )}
          <Button type="submit" disabled={resetPending} className="w-full h-9">
            {resetPending ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      </>
    );
  }

  if (sent && !hasToken) {
    return (
      <>
        <h2 className="text-xl font-semibold mb-4">Check your email</h2>
        <p className="text-muted-foreground text-sm">
          A password reset link has been sent. Check your inbox.
        </p>
      </>
    );
  }

  return (
    <>
      <h2 className="text-xl font-semibold mb-6">Set new password</h2>
      <form action={newAction} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            className="h-9 w-full"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            className="h-9 w-full"
          />
        </div>
        {newState?.success === false && (
          <p className="text-destructive text-sm">{newState.error}</p>
        )}
        <Button type="submit" disabled={newPending} className="w-full h-9">
          {newPending ? "Updating…" : "Update password"}
        </Button>
      </form>
    </>
  );
}
