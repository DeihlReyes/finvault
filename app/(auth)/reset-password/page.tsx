import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata = { title: "Reset Password — FinVault" };

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-muted-foreground text-sm text-center">Loading…</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
