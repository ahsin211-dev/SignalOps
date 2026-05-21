import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-12">
      <div className="mb-8 space-y-2 text-center">
        <Link href="/" className="text-lg font-semibold">
          SignalOps
        </Link>
        <p className="text-sm text-muted-foreground">Sign in to your workspace.</p>
      </div>
      <LoginForm searchParams={sp} />
    </div>
  );
}
