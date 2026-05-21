import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: projects } = await supabase
    .from("projects")
    .select("id,name,status,health_score,workspace_id")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(8);

  const { data: approvals } = await supabase
    .from("approval_requests")
    .select("id,entity_type,status,project_id")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(6);

  const { data: events } = await supabase
    .from("operational_events")
    .select("id,title,event_type,occurred_at,project_id")
    .order("occurred_at", { ascending: false })
    .limit(10);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Operational dashboard</h1>
          <p className="text-muted-foreground">Command-center view across active initiatives.</p>
        </div>
        <Button asChild>
          <Link href="/projects">View projects</Link>
        </Button>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>Active projects</CardTitle>
              <CardDescription>Milestones, risks, and delivery posture.</CardDescription>
            </div>
            <Badge variant="secondary">Live</Badge>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {(projects ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No projects yet. Create rows in Supabase or connect a workspace — see README for bootstrap SQL.
                </p>
              ) : (
                (projects ?? []).map((p) => (
                  <Link key={p.id} href={`/projects/${p.id}`} className="rounded-lg border border-border bg-secondary/30 p-4 hover:bg-secondary/50">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium">{p.name}</div>
                      <Badge>{p.health_score}</Badge>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground capitalize">{p.status}</div>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pending approvals</CardTitle>
            <CardDescription>AI and system proposals awaiting humans.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {(approvals ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending approvals.</p>
            ) : (
              (approvals ?? []).map((a) => (
                <Link key={a.id} href={`/projects/${a.project_id}/approvals`} className="block rounded-md border border-border px-3 py-2 text-sm hover:bg-secondary/60">
                  <div className="font-medium">{a.entity_type}</div>
                  <div className="text-xs text-muted-foreground">Project {a.project_id.slice(0, 8)}…</div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent operational events</CardTitle>
          <CardDescription>Slack, Gmail, meetings, approvals, and AI insights in one stream.</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-72 pr-3">
            <div className="space-y-3">
              {(events ?? []).map((e) => (
                <div key={e.id} className="rounded-md border border-border/60 bg-card/40 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-medium">{e.title}</div>
                    <Badge variant="outline">{e.event_type}</Badge>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{new Date(e.occurred_at).toLocaleString()}</div>
                </div>
              ))}
              {(events ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">Events appear here as integrations and AI analysis post to the timeline.</p>
              ) : null}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
      <Separator />
      <div className="rounded-lg border border-dashed border-amber-500/40 bg-amber-500/5 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-amber-200">Google Sheets layer (optional)</p>
        <p className="mt-1">
          Sheets can mirror milestones and risks for stakeholders, but concurrency and audit fidelity are limited. Keep Postgres
          (`project_memory`, `milestones`, `operational_events`) authoritative and treat Sheets as a human-friendly projection.
        </p>
      </div>
    </div>
  );
}
