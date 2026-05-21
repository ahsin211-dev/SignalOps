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

  const { data: approval, error: loadErr } = await supabase
    .from("approval_requests")
    .select("id,entity_type,entity_id,status")
    .eq("id", approvalId)
    .eq("project_id", projectId)
    .maybeSingle();

  if (loadErr || !approval) throw new Error("Approval request not found");
  if (approval.status !== "pending") throw new Error("Approval is no longer pending");

  const { data: projectRow } = await supabase.from("projects").select("workspace_id").eq("id", projectId).maybeSingle();

  let organizationId: string | null = null;
  if (projectRow?.workspace_id) {
    const { data: workspaceRow } = await supabase
      .from("workspaces")
      .select("organization_id")
      .eq("id", projectRow.workspace_id)
      .maybeSingle();
    organizationId = workspaceRow?.organization_id ?? null;
  }

  const nextStatus = parsed.data.decision === "approved" ? "approved" : "rejected";

  const { error } = await supabase
    .from("approval_requests")
    .update({
      status: nextStatus,
      decided_by: user.id,
      decided_at: new Date().toISOString(),
      decision_note: parsed.data.note ?? null,
    })
    .eq("id", approvalId)
    .eq("project_id", projectId);

  if (error) throw error;

  if (approval.entity_type === "ai_suggestion") {
    await supabase.from("ai_suggestions").update({ status: nextStatus }).eq("id", approval.entity_id).eq("project_id", projectId);
  }

  if (approval.entity_type === "communication_draft") {
    const draftStatus = parsed.data.decision === "approved" ? "approved" : "discarded";
    await supabase.from("communication_drafts").update({ status: draftStatus }).eq("id", approval.entity_id).eq("project_id", projectId);
  }

  await supabase.from("operational_events").insert({
    project_id: projectId,
    event_type: "approval_decided",
    title: `Approval ${parsed.data.decision}`,
    body: parsed.data.note ?? null,
    source: "system",
    metadata: { approvalId, entityType: approval.entity_type, entityId: approval.entity_id },
  });

  if (organizationId) {
    await supabase.from("audit_logs").insert({
      organization_id: organizationId,
      actor_id: user.id,
      action: `approval_${parsed.data.decision}`,
      entity_type: approval.entity_type,
      entity_id: approval.entity_id,
      changes: { approvalId, note: parsed.data.note ?? null },
    });
  }

  revalidatePath(`/projects/${projectId}/approvals`);
  revalidatePath(`/dashboard`);
}
