import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";

export default async function CommunicationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: drafts } = await supabase
    .from("communication_drafts")
    .select("id,channel,subject,body,status,created_at")
    .eq("project_id", id)
    .order("created_at", { ascending: false })
    .limit(40);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Communication drafts</h2>
      <p className="text-sm text-muted-foreground">
        Drafts are created for human review. Sending through Gmail or Slack requires explicit approval and integration tokens.
      </p>
      <div className="space-y-3">
        {(drafts ?? []).map((d) => (
          <div key={d.id} className="rounded-lg border border-border bg-card/40 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-medium">{d.subject ?? "Untitled"}</div>
              <div className="flex gap-2">
                <Badge variant="outline">{d.channel}</Badge>
                <Badge>{d.status}</Badge>
              </div>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{d.body}</p>
            <p className="mt-2 text-xs text-muted-foreground">{new Date(d.created_at).toLocaleString()}</p>
          </div>
        ))}
        {(drafts ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No drafts yet.</p> : null}
      </div>
    </div>
  );
}
