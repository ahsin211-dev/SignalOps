import { createClient } from "@/lib/supabase/server";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export default async function TimelinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: events } = await supabase
    .from("operational_events")
    .select("id,title,body,event_type,source,occurred_at")
    .eq("project_id", id)
    .order("occurred_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold">Operational timeline</h2>
      <ScrollArea className="h-[640px] rounded-lg border border-border bg-card/30 p-4">
        <div className="space-y-3">
          {(events ?? []).map((e) => (
            <div key={e.id} className="rounded-lg border border-border/60 bg-background/40 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-medium">{e.title}</div>
                <div className="flex gap-2">
                  <Badge variant="outline">{e.source}</Badge>
                  <Badge variant="secondary">{e.event_type}</Badge>
                </div>
              </div>
              {e.body ? <p className="mt-2 text-sm text-muted-foreground">{e.body}</p> : null}
              <p className="mt-2 text-xs text-muted-foreground">{new Date(e.occurred_at).toLocaleString()}</p>
            </div>
          ))}
          {(events ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No events yet.</p> : null}
        </div>
      </ScrollArea>
    </div>
  );
}
