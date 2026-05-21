"use server";

import { createHash, randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function hashInviteToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export type InviteActionState = { ok: boolean; message: string; token?: string };

export async function createWorkspaceInvite(_prev: InviteActionState, formData: FormData): Promise<InviteActionState> {
  const workspaceId = String(formData.get("workspaceId") ?? "");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!workspaceId || !email) {
    return { ok: false, message: "Workspace and email are required." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "You must be signed in." };

  const { data: membership, error: memErr } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (memErr || !membership || !["owner", "admin"].includes(membership.role)) {
    return { ok: false, message: "Only workspace owners or admins can send invites." };
  }

  const token = randomBytes(32).toString("hex");
  const token_hash = hashInviteToken(token);
  const expires_at = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();

  const { error } = await supabase.from("workspace_invites").insert({
    workspace_id: workspaceId,
    email,
    role: "member",
    token_hash,
    invited_by: user.id,
    expires_at,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/settings/team");
  return {
    ok: true,
    message:
      "Invite created. Copy the token once — it is not stored in plaintext. Share the accept link with the invited user.",
    token,
  };
}

export type AcceptInviteState = { ok: boolean; message: string };

export async function acceptWorkspaceInvite(_prev: AcceptInviteState, formData: FormData): Promise<AcceptInviteState> {
  const token = String(formData.get("token") ?? "").trim();
  if (!token) return { ok: false, message: "Token is required." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("accept_workspace_invite", { p_token: token });
  if (error) return { ok: false, message: error.message };

  const payload = data as { ok?: boolean; error?: string; workspace_id?: string };
  if (!payload?.ok) {
    return { ok: false, message: payload?.error ?? "Invite could not be accepted." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/projects");
  return { ok: true, message: "You have joined the workspace." };
}
