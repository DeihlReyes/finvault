"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { requestPasswordReset, updatePassword } from "@/actions/auth";

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
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          {resetState?.success === false && (
            <p className="text-destructive text-sm">{resetState.error}</p>
          )}
          <button
            type="submit"
            disabled={resetPending}
            className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {resetPending ? "Sending…" : "Send reset link"}
          </button>
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
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">New password</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">Confirm password</label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        {newState?.success === false && (
          <p className="text-destructive text-sm">{newState.error}</p>
        )}
        <button
          type="submit"
          disabled={newPending}
          className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          {newPending ? "Updating…" : "Update password"}
        </button>
      </form>
    </>
  );
}
