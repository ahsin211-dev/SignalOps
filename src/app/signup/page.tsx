import Link from "next/link";
import { SignupForm } from "@/components/auth/signup-form";

export default function SignupPage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-12">
      <div className="mb-8 space-y-2 text-center">
        <Link href="/" className="text-lg font-semibold">
          SignalOps
        </Link>
        <p className="text-sm text-muted-foreground">Create an account for your organization.</p>
      </div>
      <SignupForm />
    </div>
  );
}
