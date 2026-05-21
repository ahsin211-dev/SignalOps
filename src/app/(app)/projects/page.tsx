import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listActiveProjects } from "@/server/repositories/projects-repository";

export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data: projects } = await listActiveProjects(supabase, 100);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Projects</h1>
        <p className="text-muted-foreground">Operational workspaces you belong to.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {(projects ?? []).map((p) => (
          <Link key={p.id} href={`/projects/${p.id}`}>
            <Card className="h-full transition hover:border-primary/40">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-lg">{p.name}</CardTitle>
                <Badge>{p.health_score}</Badge>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <div className="capitalize">Status: {p.status}</div>
                <div className="mt-1">Slug: {p.slug}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {(projects ?? []).length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No projects</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Bootstrap an organization, workspace, and project in Supabase (see README), then refresh.
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
