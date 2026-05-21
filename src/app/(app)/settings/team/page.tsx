import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TeamInvitePanel } from "@/components/settings/team-invite-panel";
import { Button } from "@/components/ui/button";

export default async function TeamSettingsPage() {
  const supabase = await createClient();
  const { data: workspaces } = await supabase.from("workspaces").select("id,name,slug").order("name", { ascending: true });

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Team & invites</h1>
          <p className="text-muted-foreground">Invite users into a workspace with auditable membership.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/settings">Back to settings</Link>
        </Button>
      </div>
      <TeamInvitePanel workspaces={workspaces ?? []} />
    </div>
  );
}
