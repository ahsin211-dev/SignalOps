import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SlackSettingsPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Slack integration</h1>
        <p className="text-muted-foreground">Architecture for monitored channels, webhooks, and operational event fan-out.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Implementation checklist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <ul className="list-disc space-y-2 pl-5">
            <li>Install Slack app with OAuth (`SLACK_CLIENT_ID`, `SLACK_CLIENT_SECRET`, user tokens as needed).</li>
            <li>Expose `POST /api/webhooks/slack` with `SLACK_SIGNING_SECRET` verification (see `slack-processing.ts`).</li>
            <li>Persist installs in `integrations` + `slack_connections`; map channels in `slack_channel_mappings`.</li>
            <li>Enqueue `slack.event` jobs for durable retries; never auto-send without `approval_requests`.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
