import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { decideApproval } from "@/app/actions/approvals";

export default async function ApprovalsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("approval_requests")
    .select("id,entity_type,entity_id,status,created_at,payload")
    .eq("project_id", id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Approval center</h2>
      <p className="text-sm text-muted-foreground">
        AI-generated actions, drafts, and escalations stop here until a PM or admin approves.
      </p>
      <div className="space-y-3">
        {(rows ?? []).map((r) => (
          <Card key={r.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">{r.entity_type}</CardTitle>
                <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
              </div>
              <Badge variant={r.status === "pending" ? "default" : "secondary"}>{r.status}</Badge>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <pre className="max-h-40 overflow-auto rounded-md bg-secondary/40 p-3 text-xs">{JSON.stringify(r.payload, null, 2)}</pre>
              {r.status === "pending" ? (
                <form action={decideApproval} className="space-y-2">
                  <input type="hidden" name="approvalId" value={r.id} />
                  <input type="hidden" name="projectId" value={id} />
                  <div className="space-y-1">
                    <Label htmlFor={`note-${r.id}`}>Decision note</Label>
                    <Textarea id={`note-${r.id}`} name="note" rows={3} placeholder="Context for the audit log" />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" name="decision" value="approved">
                      Approve
                    </Button>
                    <Button type="submit" name="decision" value="rejected" variant="destructive">
                      Reject
                    </Button>
                  </div>
                </form>
              ) : null}
            </CardContent>
          </Card>
        ))}
        {(rows ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No approval requests.</p> : null}
      </div>
    </div>
  );
}
