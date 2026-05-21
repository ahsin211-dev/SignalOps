"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = (id: string) => [
  { href: `/projects/${id}`, label: "Overview" },
  { href: `/projects/${id}/timeline`, label: "Timeline" },
  { href: `/projects/${id}/tasks`, label: "Tasks" },
  { href: `/projects/${id}/milestones`, label: "Milestones" },
  { href: `/projects/${id}/risks`, label: "Risks" },
  { href: `/projects/${id}/transcripts`, label: "Transcripts" },
  { href: `/projects/${id}/communications`, label: "Communications" },
  { href: `/projects/${id}/approvals`, label: "Approvals" },
];

export function ProjectSubnav({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  return (
    <div className="flex flex-wrap gap-2 border-b border-border pb-3">
      {tabs(projectId).map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "rounded-full px-3 py-1 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground",
              active && "bg-secondary text-foreground"
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
