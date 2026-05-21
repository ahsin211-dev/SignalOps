import { createClient } from "@/lib/supabase/server";
import { TranscriptUploader } from "@/components/projects/transcript-uploader";
import { Badge } from "@/components/ui/badge";

export default async function TranscriptsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: transcripts } = await supabase
    .from("meeting_transcripts")
    .select("id,title,source,status,meeting_at,created_at")
    .eq("project_id", id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(30);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Meeting transcripts</h2>
        <p className="text-sm text-muted-foreground">
          Upload transcripts for parsing, entity extraction, and human-reviewed operational events.
        </p>
      </div>
      <TranscriptUploader projectId={id} />
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground">Recent uploads</h3>
        {(transcripts ?? []).map((t) => (
          <div key={t.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/60 px-3 py-2 text-sm">
            <div>{t.title}</div>
            <div className="flex gap-2">
              <Badge variant="outline">{t.source}</Badge>
              <Badge>{t.status}</Badge>
            </div>
          </div>
        ))}
        {(transcripts ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No transcripts yet.</p> : null}
      </div>
    </div>
  );
}
