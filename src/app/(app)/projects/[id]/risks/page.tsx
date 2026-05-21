import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";

export default async function RisksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: risks } = await supabase
    .from("risks")
    .select("id,title,description,severity,status")
    .eq("project_id", id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Risk register</h2>
      <div className="grid gap-3">
        {(risks ?? []).map((r) => (
          <div key={r.id} className="rounded-lg border border-border bg-card/40 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-medium">{r.title}</div>
              <div className="flex gap-2">
                <Badge variant="destructive">{r.severity}</Badge>
                <Badge variant="outline">{r.status}</Badge>
              </div>
            </div>
            {r.description ? <p className="mt-2 text-sm text-muted-foreground">{r.description}</p> : null}
          </div>
        ))}
        {(risks ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No risks logged.</p> : null}
      </div>
    </div>
  );
}
