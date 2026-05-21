import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm font-semibold text-primary">404</p>
      <h1 className="text-3xl font-semibold tracking-tight">This operational view does not exist.</h1>
      <p className="text-muted-foreground">The project or page may have been moved, or you may not have access under your current workspace membership.</p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button asChild>
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/projects">Projects</Link>
        </Button>
      </div>
    </div>
  );
}
