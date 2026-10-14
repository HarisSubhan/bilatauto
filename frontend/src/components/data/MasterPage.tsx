import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Pencil, Plus, ShieldCheck, ShieldOff, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { db as supabase } from "@/lib/db";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImportDialog, downloadXlsx, readSpreadsheet } from "./ImportDialog";
import { RowActions, StatusBadge, TableState, Toolbar } from "./kit";
import { BulkActions, SelectAll, SelectOne, useSelection } from "./bulk";

export type FieldDef = {
  key: string;
  label: string;
  type?: "text" | "number" | "textarea" | "select" | "email";
  options?: string[];
  required?: boolean;
  inList?: boolean;
  placeholder?: string;
};

type Row = Record<string, unknown>;

const PAGE_SIZES = [25, 50, 100];

export function MasterPage({
  table,
  title,
  description,
  fields,
  searchFields,
  autoSerial,
}: {
  table: string;
  title: string;
  description: string;
  fields: FieldDef[];
  searchFields: string[];
  /** Field key whose value is auto-assigned (1,2,3…) on new records and hidden from the form. */
  autoSerial?: string;
}) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [editing, setEditing] = useState<Row | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const [importData, setImportData] = useState<Array<Record<string, string>> | null>(null);
  const sel = useSelection();

  const listFields = useMemo(() => fields.filter((f) => f.inList !== false), [fields]);

  const query = useQuery({
    queryKey: [table, search, page, pageSize],
    queryFn: async () => {
      let q = supabase
        .from(table as never)
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * pageSize, page * pageSize + pageSize - 1);
      if (search.trim()) {
        const term = search.trim().replace(/[%,]/g, "");
        q = q.or(searchFields.map((f) => `${f}.ilike.%${term}%`).join(","));
      }
      const { data, error, count } = await q;
      if (error) throw error;
      return { rows: (data ?? []) as Row[], count: count ?? 0 };
    },
  });

  const invalidate = () => void qc.invalidateQueries({ queryKey: [table] });

  const save = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      if (editing) {
        const { error } = await supabase
          .from(table as never)
          .update(payload as never)
          .eq("id", editing["id"] as string);
        if (error) throw error;
      } else {
        const { error } = await supabase.from(table as never).insert(payload as never);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Record updated" : "Record added");
      setFormOpen(false);
      setEditing(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setVerification = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: string }) => {
      const { error } = await supabase
        .from(table as never)
        .update({ verification: value } as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Verification updated");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from(table as never)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Record deleted");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const importRows = async (payload: Array<Record<string, unknown>>) => {
    for (let i = 0; i < payload.length; i += 500) {
      const { error } = await supabase.from(table as never).insert(payload.slice(i, i + 500) as never);
      if (error) throw error;
    }
    toast.success(`${payload.length} records imported`);
    invalidate();
  };

  const openNew = () => {
    setEditing(null);
    setForm({});
    setFormOpen(true);
  };

  const openEdit = (row: Row) => {
    setEditing(row);
    const next: Record<string, string> = {};
    for (const f of fields) next[f.key] = row[f.key] == null ? "" : String(row[f.key]);
    setForm(next);
    setFormOpen(true);
  };

  const submit = async () => {
    const payload: Record<string, unknown> = {};
    if (autoSerial && !editing) {
      const { data } = await supabase.from(table as never).select(autoSerial as never);
      const max = (data ?? []).reduce((m: number, r: Record<string, unknown>) => {
        const n = parseInt(String(r[autoSerial] ?? ""), 10);
        return Number.isFinite(n) && n > m ? n : m;
      }, 0);
      payload[autoSerial] = String(max + 1);
    }
    for (const f of fields) {
      if (f.key === autoSerial) continue;
      const raw = form[f.key] ?? "";
      if (f.required && !raw.trim()) {
        toast.error(`${f.label} is required`);
        return;
      }
      payload[f.key] = f.type === "number" ? (raw === "" ? null : Number(raw)) : raw === "" ? null : raw;
    }
    save.mutate(payload);
  };

  const rows = query.data?.rows ?? [];
  const total = query.data?.count ?? 0;
  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <AppShell
      title={title}
      description={description}
      actions={
        <Button onClick={openNew} size="sm">
          <Plus className="mr-1 size-4" /> Add
        </Button>
      }
    >
      <div className="panel overflow-hidden">
        <Toolbar
          search={search}
          onSearch={(v) => {
            setSearch(v);
            setPage(0);
          }}
          placeholder={`Search ${title.toLowerCase()}…`}
        >
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                downloadXlsx(`${table}-template.xlsx`, [], fields.map((f) => f.key))
              }
            >
              Template
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                downloadXlsx(`${table}-export.xlsx`, rows as Array<Record<string, unknown>>, fields.map((f) => f.key))
              }
            >
              <Download className="mr-1 size-4" /> Export
            </Button>
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              <Upload className="mr-1 size-4" /> Import
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                e.target.value = "";
                const parsed = await readSpreadsheet(file);
                if (!parsed.length) {
                  toast.error("No rows found in the file");
                  return;
                }
                setImportData(parsed);
              }}
            />
          </div>
        </Toolbar>

        {importData ? (
          <ImportDialog rows={importData} fields={fields} onClose={() => setImportData(null)} onImport={importRows} />
        ) : null}
        <BulkActions table={table} s={sel} />
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"><SelectAll ids={rows.map((r) => String(r["id"]))} s={sel} /></TableHead>
                {listFields.map((f) => (
                  <TableHead key={f.key}>{f.label}</TableHead>
                ))}
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableState
                cols={listFields.length + 3}
                loading={query.isLoading}
                error={query.error ? (query.error as Error).message : null}
                empty={!query.isLoading && rows.length === 0}
                title={search ? "No matching records" : "No records yet"}
                hint={search ? "Try a different search term." : `Add your first record or import a spreadsheet.`}
              />
              {rows.map((row, idx) => {
                const verified = row["verification"] === "verified";
                const id = String(row["id"]);
                return (
                  <TableRow key={id} className={idx % 2 ? "bg-muted/20" : undefined}>
                    <TableCell><SelectOne id={id} s={sel} /></TableCell>
                    {listFields.map((f, i) => (
                      <TableCell
                        key={f.key}
                        className={`max-w-[320px] truncate ${i === 0 ? "font-medium" : ""} ${f.key.includes("code") ? "font-mono text-xs" : ""}`}
                      >
                        {row[f.key] == null || row[f.key] === "" ? <span className="text-muted-foreground">—</span> : String(row[f.key])}
                      </TableCell>
                    ))}
                    <TableCell>
                      <StatusBadge status={String(row["verification"] ?? "unverified")} />
                    </TableCell>
                    <TableCell className="text-right">
                      <RowActions
                        actions={[
                          { label: "Edit", icon: Pencil, onClick: () => openEdit(row) },
                          verified
                            ? { label: "Unverify", icon: ShieldOff, onClick: () => setVerification.mutate({ id, value: "unverified" }) }
                            : { label: "Verify", icon: ShieldCheck, onClick: () => setVerification.mutate({ id, value: "verified" }) },
                          {
                            label: "Delete",
                            icon: Trash2,
                            danger: true,
                            separator: true,
                            hidden: verified,
                            onClick: () => confirm("Delete this record?") && remove.mutate(id),
                          },
                        ]}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-border p-4 text-sm">
          <span className="text-muted-foreground">{total} records</span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => {
              setPageSize(Number(v));
              setPage(0);
            }}
          >
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((s) => (
                <SelectItem key={s} value={String(s)}>
                  {s} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <span className="text-muted-foreground">
              Page {page + 1} of {pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page + 1 >= pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${title}` : `Add ${title}`}</DialogTitle>
            <DialogDescription>Fields marked with * are required.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.filter((f) => f.key !== autoSerial).map((f) => (
              <div key={f.key} className={f.type === "textarea" ? "sm:col-span-2" : undefined}>
                <Label htmlFor={f.key}>
                  {f.label}
                  {f.required ? " *" : ""}
                </Label>
                {f.type === "textarea" ? (
                  <Textarea
                    id={f.key}
                    value={form[f.key] ?? ""}
                    onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                  />
                ) : f.type === "select" ? (
                  <Select
                    value={form[f.key] ?? ""}
                    onValueChange={(v) => setForm((s) => ({ ...s, [f.key]: v }))}
                  >
                    <SelectTrigger id={f.key}>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {(f.options ?? []).map((o) => (
                        <SelectItem key={o} value={o} className="capitalize">
                          {o.replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id={f.key}
                    type={f.type === "number" ? "number" : f.type === "email" ? "email" : "text"}
                    placeholder={f.placeholder}
                    value={form[f.key] ?? ""}
                    onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                  />
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={save.isPending}>
              {save.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
