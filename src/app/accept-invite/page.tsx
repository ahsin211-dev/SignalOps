import Link from "next/link";
import { AcceptInvitePanel } from "@/components/settings/accept-invite-panel";

export default function AcceptInvitePage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-12">
      <div className="mb-6 text-center">
        <Link href="/" className="text-lg font-semibold">
          SignalOps
        </Link>
        <p className="mt-2 text-sm text-muted-foreground">Redeem a workspace invitation.</p>
      </div>
      <AcceptInvitePanel />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Wrong place? <Link href="/login">Sign in</Link>
      </p>
    </div>
  );
}
