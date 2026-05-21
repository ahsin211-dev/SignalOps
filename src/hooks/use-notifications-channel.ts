"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/** Subscribe to in-app notifications for the signed-in user. */
export function useNotificationsChannel(userId?: string) {
  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          // Consumers can toast / update Zustand / invalidate queries
          void payload;
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);
}
