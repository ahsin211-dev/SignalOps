import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Workspace administration and integrations.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="secondary">
            <Link href="/settings/integrations">Manage integrations</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/settings/team">Team & invites</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/settings/slack">Slack</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/settings/gmail">Gmail</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
