import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ProjectOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: milestones }, { data: risks }, { data: blockers }] = await Promise.all([
    supabase.from("milestones").select("id,title,status,due_date").eq("project_id", id).is("deleted_at", null).limit(5),
    supabase.from("risks").select("id,title,severity,status").eq("project_id", id).is("deleted_at", null).limit(5),
    supabase.from("blockers").select("id,title,status").eq("project_id", id).is("deleted_at", null).limit(5),
  ]);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Operational snapshot</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Milestones</h3>
            <ul className="mt-2 space-y-2 text-sm">
              {(milestones ?? []).map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-2 rounded-md border border-border/60 px-2 py-1">
                  <span>{m.title}</span>
                  <Badge variant="outline">{m.status}</Badge>
                </li>
              ))}
              {(milestones ?? []).length === 0 ? <li className="text-muted-foreground">No milestones yet.</li> : null}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Risks</h3>
            <ul className="mt-2 space-y-2 text-sm">
              {(risks ?? []).map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-2 rounded-md border border-border/60 px-2 py-1">
                  <span>{r.title}</span>
                  <Badge variant="destructive">{r.severity}</Badge>
                </li>
              ))}
              {(risks ?? []).length === 0 ? <li className="text-muted-foreground">No tracked risks.</li> : null}
            </ul>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Blockers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {(blockers ?? []).map((b) => (
            <div key={b.id} className="rounded-md border border-border/60 px-2 py-2">
              <div className="font-medium">{b.title}</div>
              <div className="text-xs text-muted-foreground">{b.status}</div>
            </div>
          ))}
          {(blockers ?? []).length === 0 ? <p className="text-muted-foreground">No open blockers.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
