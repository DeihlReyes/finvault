"use client";

import { useActionState, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { signUp } from "@/actions/auth";
import { signUpSchema, type SignUpInput } from "@/lib/validators/user";
import type { ActionResult } from "@/types/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

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
        <div className="space-y-1.5">
          <Label htmlFor="displayName">
            Display name{" "}
            <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Input
            id="displayName"
            type="text"
            {...register("displayName")}
            placeholder="Your name"
            className="h-9 w-full"
          />
          {errors.displayName && (
            <p className="text-destructive text-xs">{errors.displayName.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...register("email")}
            placeholder="you@example.com"
            className="h-9 w-full"
          />
          {errors.email && (
            <p className="text-destructive text-xs">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            {...register("password")}
            placeholder="Min. 8 characters"
            className="h-9 w-full"
          />
          {errors.password && (
            <p className="text-destructive text-xs">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            id="confirmPassword"
            type="password"
            {...register("confirmPassword")}
            placeholder="Repeat password"
            className="h-9 w-full"
          />
          {errors.confirmPassword && (
            <p className="text-destructive text-xs">{errors.confirmPassword.message}</p>
          )}
        </div>

        {state?.success === false && (
          <p className="text-destructive text-sm bg-destructive/10 px-3 py-2 rounded-lg">
            {state.error}
          </p>
        )}

        <Button type="submit" disabled={pending} className="w-full h-9">
          {pending ? "Creating account…" : "Create account"}
        </Button>
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
