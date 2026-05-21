import Link from "next/link";
import { Sidebar } from "@/components/layout/sidebar";
import { Separator } from "@/components/ui/separator";
import { SignOutButton } from "@/components/auth/sign-out-button";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card/40 p-4 lg:block">
        <div className="flex items-center justify-between gap-2 px-2">
          <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
            SignalOps
          </Link>
          <SignOutButton />
        </div>
        <Separator className="my-4" />
        <Sidebar />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border px-4 py-3 lg:hidden">
          <Link href="/dashboard" className="font-semibold">
            SignalOps
          </Link>
          <SignOutButton />
        </header>
        <main className="flex-1 bg-gradient-to-b from-background to-secondary/20 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
