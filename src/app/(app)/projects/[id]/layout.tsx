import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProjectSubnav } from "@/components/projects/project-subnav";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: project } = await supabase.from("projects").select("id,name").eq("id", id).maybeSingle();
  if (!project) notFound();
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Project</p>
        <h1 className="text-3xl font-semibold tracking-tight">{project.name}</h1>
      </div>
      <ProjectSubnav projectId={id} />
      <div>{children}</div>
    </div>
  );
}
