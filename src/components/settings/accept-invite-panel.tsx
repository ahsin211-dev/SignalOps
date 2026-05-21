"use client";

import { useActionState } from "react";
import { acceptWorkspaceInvite, type AcceptInviteState } from "@/app/actions/workspace-invites";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const initialAcceptState: AcceptInviteState = { ok: false, message: "" };

export function AcceptInvitePanel() {
  const [state, formAction, pending] = useActionState(acceptWorkspaceInvite, initialAcceptState);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Accept workspace invite</CardTitle>
        <CardDescription>Paste the invite token you received from a workspace admin.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="token">Invite token</Label>
            <Input id="token" name="token" autoComplete="off" required />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Joining…" : "Join workspace"}
          </Button>
        </form>
        {state.message ? (
          <p className={`mt-3 text-sm ${state.ok ? "text-emerald-400" : "text-destructive"}`}>{state.message}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
