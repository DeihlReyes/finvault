import { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Sign In — FinVault" };

export default function LoginPage() {
  return (
    <>
      <h2 className="text-xl font-semibold mb-6">Welcome back</h2>
      <LoginForm />
    </>
  );
}
