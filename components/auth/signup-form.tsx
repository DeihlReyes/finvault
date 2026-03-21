"use client";

import { useActionState, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { signUp } from "@/actions/auth";
import { signUpSchema, type SignUpInput } from "@/lib/validators/user";
import type { ActionResult } from "@/types/api";

export function SignUpForm() {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(signUp, null);
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    formState: { errors },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
  });

  if (emailSent || state?.success === true) {
    return (
      <div className="text-center space-y-3">
        <div className="text-4xl">📧</div>
        <h3 className="font-semibold">Check your email</h3>
        <p className="text-muted-foreground text-sm">
          We sent a confirmation link. Click it to activate your account.
        </p>
        <Link href="/login" className="text-primary text-sm hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <form
        action={async (fd) => {
          await action(fd);
          if (state?.success) setEmailSent(true);
        }}
        className="space-y-4"
      >
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium mb-1">
            Display name <span className="text-muted-foreground">(optional)</span>
          </label>
          <input
            id="displayName"
            type="text"
            {...register("displayName")}
            className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground"
            placeholder="Your name"
          />
          {errors.displayName && (
            <p className="text-destructive text-xs mt-1">{errors.displayName.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            {...register("email")}
            className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground"
            placeholder="you@example.com"
          />
          {errors.email && (
            <p className="text-destructive text-xs mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            {...register("password")}
            className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Min. 8 characters"
          />
          {errors.password && (
            <p className="text-destructive text-xs mt-1">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
            Confirm password
          </label>
          <input
            id="confirmPassword"
            type="password"
            {...register("confirmPassword")}
            className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Repeat password"
          />
          {errors.confirmPassword && (
            <p className="text-destructive text-xs mt-1">{errors.confirmPassword.message}</p>
          )}
        </div>

        {state?.success === false && (
          <p className="text-destructive text-sm bg-destructive/10 px-3 py-2 rounded-lg">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {pending ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-primary hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
