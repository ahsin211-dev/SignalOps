import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";

const columns: Record<string, string> = {
  todo: "To do",
  in_progress: "In progress",
  blocked: "Blocked",
  done: "Done",
};

export default async function TasksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: tasks } = await supabase
    .from("tasks")
    .select("id,title,status,priority,due_date")
    .eq("project_id", id)
    .is("deleted_at", null)
    .order("due_date", { ascending: true });

  const grouped: Record<string, NonNullable<typeof tasks>> = { todo: [], in_progress: [], blocked: [], done: [] };
  for (const task of tasks ?? []) {
    const key = task.status in grouped ? (task.status as keyof typeof grouped) : "todo";
    grouped[key].push(task);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Task board</h2>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {Object.entries(columns).map(([key, label]) => (
          <div key={key} className="rounded-lg border border-border bg-card/30 p-3">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">{label}</h3>
              <Badge variant="outline">{grouped[key as keyof typeof grouped].length}</Badge>
            </div>
            <div className="space-y-2">
              {grouped[key as keyof typeof grouped].map((row) => (
                <div key={row.id} className="rounded-md border border-border/60 bg-background/50 p-3 text-sm">
                  <div className="font-medium">{row.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {row.priority} · {row.due_date ?? "no due date"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
