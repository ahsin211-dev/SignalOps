import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function GmailSettingsPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Gmail integration</h1>
        <p className="text-muted-foreground">Ingest-only by default; sends flow through drafts + approvals.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Implementation checklist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <ul className="list-disc space-y-2 pl-5">
            <li>Google OAuth (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`) with Gmail readonly + compose scopes as needed.</li>
            <li>Store refresh material in `gmail_connections` via Supabase Vault / KMS in production (never plain text).</li>
            <li>Implement `GmailSyncService` with exponential backoff, partial history replay, and thread summaries into `operational_events`.</li>
            <li>Wire Pub/Sub push to `POST /api/webhooks/gmail` with verified tokens.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
