"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { approvalDecisionSchema } from "@/lib/validations/api";

export async function decideApproval(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = approvalDecisionSchema.safeParse({ decision: raw.decision, note: raw.note });
  if (!parsed.success) throw new Error("Invalid approval payload");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const approvalId = String(raw.approvalId);
  const projectId = String(raw.projectId);
  const { error } = await supabase
    .from("approval_requests")
    .update({
      status: parsed.data.decision === "approved" ? "approved" : "rejected",
      decided_by: user.id,
      decided_at: new Date().toISOString(),
      decision_note: parsed.data.note ?? null,
    })
    .eq("id", approvalId)
    .eq("project_id", projectId);
  if (error) throw error;
  await supabase.from("operational_events").insert({
    project_id: projectId,
    event_type: "approval_decided",
    title: `Approval ${parsed.data.decision}`,
    body: parsed.data.note ?? null,
    source: "system",
    metadata: { approvalId },
  });
  revalidatePath(`/projects/${projectId}/approvals`);
  revalidatePath(`/dashboard`);
}
