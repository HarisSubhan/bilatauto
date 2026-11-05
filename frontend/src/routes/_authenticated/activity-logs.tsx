import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { DataTools } from "@/components/data/DataTools";
import { AppShell } from "@/components/layout/AppShell";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/activity-logs")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Activity Logs — Spare Parts System" },
      { name: "description", content: "Who created, changed or deleted records, and when." },
      { property: "og:title", content: "Activity Logs — Spare Parts System" },
      { property: "og:description", content: "Who created, changed or deleted records, and when." },
    ],
  }),
  component: LogsPage,
});

function LogsPage() {
  const [search, setSearch] = useState("");
  const q = useQuery({
    queryKey: ["logs", search],
    queryFn: async () => {
      let s = db.from("activity_logs").select("id, user_name, action, module, record_label, created_at").order("created_at", { ascending: false }).limit(300);
      if (search) s = s.or(`module.ilike.%${search}%,record_label.ilike.%${search}%,user_name.ilike.%${search}%`);
      return (await s).data ?? [];
    },
  });
  return (
    <AppShell title="Activity Logs" description="Every change is recorded automatically and cannot be edited">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input className="max-w-sm" placeholder="Search user, module or record…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="ml-auto"><DataTools name="activity-logs" template={false}
          fields={[{ key: "created_at", label: "When" }, { key: "user_name", label: "User" }, { key: "action", label: "Action" }, { key: "module", label: "Module" }, { key: "record_label", label: "Record" }]}
          exportRows={async () => (q.data ?? []) as Array<Record<string, unknown>>} /></div>
      </div>
      <div className="panel overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead>When</TableHead><TableHead>User</TableHead><TableHead>Action</TableHead><TableHead>Module</TableHead><TableHead>Record</TableHead></TableRow></TableHeader>
          <TableBody>
            {(q.data ?? []).map((l: any) => (
              <TableRow key={l.id}>
                <TableCell className="whitespace-nowrap">{new Date(l.created_at).toLocaleString("en-GB")}</TableCell>
                <TableCell>{l.user_name ?? "System"}</TableCell>
                <TableCell><Badge variant={l.action === "delete" ? "destructive" : l.action === "insert" ? "default" : "secondary"}>{l.action}</Badge></TableCell>
                <TableCell className="capitalize">{l.module.replace(/_/g, " ")}</TableCell>
                <TableCell className="font-mono text-xs">{l.record_label}</TableCell>
              </TableRow>
            ))}
            {q.data?.length === 0 && <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">No activity yet</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </AppShell>
  );
}
