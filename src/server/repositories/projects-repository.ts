import type { SupabaseClient } from "@supabase/supabase-js";

/** Thin repository layer over Supabase queries (typed surface for UI + services). */
export async function listActiveProjects(supabase: SupabaseClient, limit = 50) {
  return supabase
    .from("projects")
    .select("id,name,slug,status,health_score,workspace_id,updated_at")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(limit);
}

export async function countOverdueTasks(supabase: SupabaseClient) {
  const today = new Date().toISOString().slice(0, 10);
  const { count, error } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .lt("due_date", today)
    .neq("status", "done")
    .is("deleted_at", null);
  if (error) return 0;
  return count ?? 0;
}

export async function countOpenHighRisks(supabase: SupabaseClient) {
  const { count, error } = await supabase
    .from("risks")
    .select("*", { count: "exact", head: true })
    .eq("status", "open")
    .in("severity", ["high", "critical"])
    .is("deleted_at", null);
  if (error) return 0;
  return count ?? 0;
}
