import type { SupabaseClient } from "@supabase/supabase-js";

/** Aggregates structured operational memory for a project (milestones, risks, decisions). */
export async function loadProjectStateSnapshot(supabase: SupabaseClient, projectId: string) {
  const [{ data: milestones }, { data: risks }, { data: memory }] = await Promise.all([
    supabase.from("milestones").select("id,title,status,due_date").eq("project_id", projectId).is("deleted_at", null),
    supabase.from("risks").select("id,title,severity,status").eq("project_id", projectId).is("deleted_at", null),
    supabase.from("project_memory").select("memory_key,memory_value,updated_at").eq("project_id", projectId),
  ]);
  return { milestones: milestones ?? [], risks: risks ?? [], memory: memory ?? [] };
}
