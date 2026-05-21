import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";

export default async function MilestonesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: milestones } = await supabase
    .from("milestones")
    .select("id,title,status,due_date,description")
    .eq("project_id", id)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Milestones</h2>
      <div className="space-y-3">
        {(milestones ?? []).map((m) => (
          <div key={m.id} className="rounded-lg border border-border bg-card/40 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-medium">{m.title}</div>
              <Badge>{m.status}</Badge>
            </div>
            {m.description ? <p className="mt-2 text-sm text-muted-foreground">{m.description}</p> : null}
            <p className="mt-2 text-xs text-muted-foreground">Due {m.due_date ?? "TBD"}</p>
          </div>
        ))}
        {(milestones ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No milestones yet.</p> : null}
      </div>
    </div>
  );
}
