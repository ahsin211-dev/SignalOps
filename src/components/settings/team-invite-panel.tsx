"use client";

import { useActionState } from "react";
import { createWorkspaceInvite, type InviteActionState } from "@/app/actions/workspace-invites";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type WorkspaceOption = { id: string; name: string; slug: string };

const initialInviteState: InviteActionState = { ok: false, message: "" };

export function TeamInvitePanel({ workspaces }: { workspaces: WorkspaceOption[] }) {
  const [state, formAction, pending] = useActionState(createWorkspaceInvite, initialInviteState);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite teammates</CardTitle>
        <CardDescription>
          Invites are scoped to a workspace. The invited user must sign in with the same email address they were invited
          with, then paste the token on the accept page.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {workspaces.length === 0 ? (
          <p className="text-sm text-muted-foreground">You are not a member of any workspace yet.</p>
        ) : (
          <form action={formAction} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="workspaceId">Workspace</Label>
              <select
                id="workspaceId"
                name="workspaceId"
                className="flex h-10 w-full rounded-md border border-border bg-secondary/40 px-3 text-sm"
                defaultValue={workspaces[0]?.id}
                required
              >
                {workspaces.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.slug})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Invitee email</Label>
              <Input id="email" name="email" type="email" autoComplete="off" required />
            </div>
            <Button type="submit" disabled={pending}>
              {pending ? "Creating invite…" : "Create invite"}
            </Button>
          </form>
        )}

        {state.message ? (
          <div className={`rounded-md border p-3 text-sm ${state.ok ? "border-emerald-500/40 bg-emerald-500/5" : "border-destructive/40 bg-destructive/5"}`}>
            <p>{state.message}</p>
            {state.ok && state.token ? (
              <div className="mt-3 space-y-1">
                <p className="text-xs text-muted-foreground">One-time invite token</p>
                <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-all rounded bg-background/60 p-2 text-xs">{state.token}</pre>
                <p className="text-xs text-muted-foreground">
                  Accept URL: <span className="font-mono">/accept-invite</span>
                </p>
              </div>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
