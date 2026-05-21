import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-5xl flex-col gap-10 px-6 py-16">
      <header className="flex items-center justify-between">
        <div className="text-lg font-semibold tracking-tight">SignalOps</div>
        <div className="flex gap-2">
          <Button asChild variant="ghost">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/signup">Sign up</Link>
          </Button>
          <Button asChild>
            <Link href="/login">Open console</Link>
          </Button>
        </div>
      </header>
      <main className="grid gap-8 lg:grid-cols-2 lg:items-center">
        <div className="space-y-4">
          <p className="text-sm font-medium text-primary">Human-in-the-loop operations</p>
          <h1 className="text-4xl font-semibold tracking-tight">Operational intelligence without autonomous agents.</h1>
          <p className="text-muted-foreground">
            SignalOps centralizes project communication, milestones, risks, and meeting intelligence. AI proposes summaries,
            drafts, and alerts — PMs and admins always approve what ships.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/dashboard">Go to dashboard</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/login">Authenticate</Link>
            </Button>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card/60 p-6 shadow-sm">
          <h2 className="text-sm font-semibold">What this is not</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            <li>Not a chatbot product surface.</li>
            <li>No self-executing AI agents or swarms.</li>
            <li>No silent sends to Slack, Gmail, or customers.</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
