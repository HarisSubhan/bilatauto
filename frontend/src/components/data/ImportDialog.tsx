import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { FieldDef } from "./MasterPage";

const SKIP = "__skip__";
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const SYN: Record<string, string[]> = {
  description: ["itemname", "item", "partname", "part", "name", "detail", "details", "product"],
  serial_number: ["sno", "srno", "sr", "serial", "no", "sn"],
  hs_code: ["code", "hscode", "hs", "pctcode", "pct"],
};

export async function readSpreadsheet(file: File): Promise<Array<Record<string, string>>> {
  const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0] ?? ""];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "", raw: false }).map((r: any) =>
    Object.fromEntries(Object.entries(r).map(([k, v]) => [k.trim(), String(v ?? "").trim()])),
  );
}

export function downloadXlsx(filename: string, rows: Array<Record<string, unknown>>, headers: string[]) {
  const ws = XLSX.utils.json_to_sheet(rows.map((r: any) => Object.fromEntries(headers.map((h) => [h, r[h] ?? ""]))), { header: headers });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data");
  XLSX.writeFile(wb, filename);
}

export function ImportDialog({
  rows,
  fields,
  onClose,
  onImport,
}: {
  rows: Array<Record<string, string>>;
  fields: FieldDef[];
  onClose: () => void;
  onImport: (mapped: Array<Record<string, unknown>>) => Promise<void>;
}) {
  const columns = useMemo(() => Object.keys(rows[0] ?? {}), [rows]);
  const [map, setMap] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      fields.map((f) => [
        f.key,
        columns.find((c) => norm(c) === norm(f.key) || norm(c) === norm(f.label)) ??
          columns.find((c) => norm(c).includes(norm(f.label)) || norm(f.label).includes(norm(c))) ??
          columns.find((c) => (SYN[f.key] ?? []).includes(norm(c))) ??
          SKIP,
      ]),
    ),
  );
  const [busy, setBusy] = useState(false);

  const mapped = useMemo(
    () =>
      rows
        .map((r: any) => {
          const o: Record<string, unknown> = {};
          for (const f of fields) {
            const col = map[f.key];
            if (!col || col === SKIP) continue;
            const v = r[col] ?? "";
            if (v === "") continue;
            o[f.key] = f.type === "number" ? Number(String(v).replace(/,/g, "")) : v;
          }
          return o;
        })
        .filter((o) => Object.keys(o).length > 0),
    [rows, fields, map],
  );
  const missing = fields.filter((f) => f.required && (!map[f.key] || map[f.key] === SKIP));
  const invalid = mapped.filter((o) => fields.some((f) => f.required && (o[f.key] === undefined || o[f.key] === ""))).length;

  const run = async () => {
    setBusy(true);
    try {
      await onImport(mapped.filter((o) => fields.every((f) => !f.required || (o[f.key] !== undefined && o[f.key] !== ""))));
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Match columns</DialogTitle>
          <DialogDescription>{rows.length} rows found. Choose which column in your file goes into each field.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          {fields.map((f) => (
            <div key={f.key} className="flex items-center gap-2">
              <span className="w-40 shrink-0 text-sm font-medium">{f.label}{f.required ? " *" : ""}</span>
              <Select value={map[f.key] ?? SKIP} onValueChange={(v) => setMap({ ...map, [f.key]: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={SKIP}>— Don't import —</SelectItem>
                  {columns.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
        <p className="text-sm font-medium">Preview (first 5 rows)</p>
        <div className="max-h-56 overflow-auto rounded border">
          <Table>
            <TableHeader><TableRow>{fields.map((f) => <TableHead key={f.key}>{f.label}</TableHead>)}</TableRow></TableHeader>
            <TableBody>
              {mapped.slice(0, 5).map((o, i) => (
                <TableRow key={i}>{fields.map((f) => <TableCell key={f.key}>{String(o[f.key] ?? "")}</TableCell>)}</TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {missing.length ? `Required: ${missing.map((m: any) => m.label).join(", ")}` : invalid ? `${invalid} rows missing required values will be skipped` : "Ready to import"}
          </p>
          <Button disabled={busy || missing.length > 0} onClick={run}>{busy ? "Importing…" : `Import ${mapped.length - invalid} rows`}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
