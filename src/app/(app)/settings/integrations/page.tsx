import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function IntegrationsSettingsPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Integrations</h1>
        <p className="text-muted-foreground">Connect operational signals from Slack, Gmail, and optional Google Sheets mirrors.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Slack</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>OAuth install, channel mapping, webhook ingestion, and retry-aware event processing.</p>
            <Button asChild size="sm" variant="secondary">
              <Link href="/settings/slack">Open Slack settings</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Gmail</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>OAuth, label-scoped sync, thread parsing, and escalation hints — all proposals until approved.</p>
            <Button asChild size="sm" variant="secondary">
              <Link href="/settings/gmail">Open Gmail settings</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Google Sheets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Optional bi-directional mirror. Keep Postgres authoritative; Sheets are convenient but not infinitely scalable.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
