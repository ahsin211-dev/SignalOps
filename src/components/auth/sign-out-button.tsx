"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function SignOutButton() {
  const router = useRouter();
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={async () => {
        try {
          const supabase = createClient();
          await supabase.auth.signOut();
          toast.success("Signed out");
          router.push("/login");
          router.refresh();
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Sign out failed");
        }
      }}
    >
      Sign out
    </Button>
  );
}
