import { Metadata } from "next";
import { SignUpForm } from "@/components/auth/signup-form";

export const metadata: Metadata = { title: "Create Account — FinVault" };

export default function SignUpPage() {
  return (
    <>
      <h2 className="text-xl font-semibold mb-6">Create your account</h2>
      <SignUpForm />
    </>
  );
}
