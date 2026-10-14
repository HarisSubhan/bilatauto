import { DataTools } from "@/components/data/DataTools";
import { flatten, importQuotations, invoiceFields } from "@/lib/doc-import";
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, FileDown, Plus, Printer } from "lucide-react";
import { toast } from "sonner";
import { downloadPdf, printInvoice } from "@/lib/print";
import { db as supabase } from "@/lib/db";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FormSection, StatusBadge, SummaryBox, TableState, Toolbar } from "@/components/data/kit";
import { DocFilters, dateRange, emptyDocFilter, type DocFilterState } from "@/components/data/DocFilters";
import { BulkActions, SelectAll, SelectOne, useSelection } from "@/components/data/bulk";
import { DocViewer } from "@/components/data/DocViewer";
import { LineItems } from "@/components/data/LineItems";
import { calculateTotals, documentLineSchema } from "@/lib/document-calculations";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/invoices")({
  head: () => ({
    meta: [
      { title: "Invoices — Spare Parts System" },
      { name: "description", content: "Invoices from approved quotations or added manually, with stock-out tracking." },
      { property: "og:title", content: "Invoices — Spare Parts System" },
      { property: "og:description", content: "Invoices from approved quotations or added manually, with stock-out tracking." },
    ],
  }),
  component: InvoicesPage,
});

const money = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function InvoicesPage({ salesTax = false }: { salesTax?: boolean }) {
  const [search, setSearch] = useState("");
  const [f, setF] = useState<DocFilterState>(emptyDocFilter);
  const [viewId, setViewId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const s = useSelection();
  const kind = salesTax ? "sales" : "bill";

  const list = useQuery({
    queryKey: ["invoices", salesTax, search, f],
    queryFn: async () => {
      let q = supabase.from("invoices").select("*, departments(name), quotations(quotation_number)").order("created_at", { ascending: false }).limit(500);
      const term = search.trim().replace(/[%,()]/g, "");
      if (term) q = q.or(`invoice_number.ilike.%${term}%,sales_tax_number.ilike.%${term}%,vehicle_number.ilike.%${term}%,vehicle_type.ilike.%${term}%`);
      if (f.depts.length) q = q.in("department_id", f.depts);
      const r = dateRange(f);
      if (r.from) q = q.gte("invoice_date", r.from);
      if (r.to) q = q.lte("invoice_date", r.to);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
  const rows = list.data ?? [];
  const total = rows.reduce((a, r) => a + Number(r.grand_total), 0);

  return (
    <AppShell title={salesTax ? "Sales Tax Invoices" : "Invoices / Bills"}
      description={salesTax ? "Automatically generated • Manual / offline • Not submitted to FBR" : "Approved quotations create invoices automatically — or add one manually"}
      actions={salesTax ? undefined : <Button size="sm" onClick={() => setCreating(true)}><Plus className="size-4" />Add Invoice</Button>}>
      <div className="panel overflow-hidden">
        <Toolbar search={search} onSearch={setSearch} placeholder="Search number or vehicle…">
          <DataTools name={salesTax ? "sales-tax-invoices" : "invoices"} fields={invoiceFields}
            exportRows={async () => {
              const { data, error } = await supabase.from("invoices").select("*, departments(name), quotations(quotation_number), invoice_items(*)").order("invoice_date");
              if (error) throw error;
              return flatten(data as never, "invoice_items", (d) => ({ invoice_number: d["invoice_number"], invoice_date: d["invoice_date"], buyer: (d["departments"] as { name: string } | null)?.name, quotation_number: (d["quotations"] as { quotation_number: string } | null)?.quotation_number }));
            }}
            onImport={async (rows) => { const m = await importQuotations(rows.map((r) => ({ ...r, ref: r["invoice_number"] || r["quotation_number"] || "import", quotation_date: r["invoice_date"] }))); return m + " — approve them to create invoices"; }} />
        </Toolbar>
        <DocFilters value={f} onChange={setF} />
        <BulkActions table="invoices" s={s} onPdf={(ids) => downloadPdf(ids, kind)} />
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"><SelectAll ids={rows.map((r) => r.id)} s={s} /></TableHead>
                <TableHead>Number</TableHead><TableHead>Date</TableHead><TableHead>Buyer</TableHead>
                <TableHead>Source</TableHead><TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableState cols={8} loading={list.isLoading} error={list.error ? (list.error as Error).message : null} empty={!list.isLoading && rows.length === 0} title="No invoices found" hint="Approve a quotation or add an invoice manually." />
              {rows.map((inv) => (
                <TableRow key={inv.id} className={cn(s.sel.has(inv.id) && "bg-accent/40")}>
                  <TableCell><SelectOne id={inv.id} s={s} /></TableCell>
                  <TableCell className="font-mono">{salesTax ? inv.sales_tax_number : inv.invoice_number}</TableCell>
                  <TableCell>{inv.invoice_date}</TableCell>
                  <TableCell>{(inv.departments as { name: string } | null)?.name}</TableCell>
                  <TableCell className="text-xs">{inv.source === "manual" ? "Manual" : <span className="font-mono">{(inv.quotations as { quotation_number: string } | null)?.quotation_number ?? "Quotation"}</span>}</TableCell>
                  <TableCell className="text-right tabular-nums">{money(Number(inv.grand_total))}</TableCell>
                  <TableCell><StatusBadge status={inv.verification} /></TableCell>
                  <TableCell className="whitespace-nowrap text-right">
                    <Button size="icon" variant="ghost" aria-label="View A4" onClick={() => setViewId(inv.id)}><Eye className="size-4" /></Button>
                    <Button size="icon" variant="ghost" aria-label="Download PDF" onClick={() => downloadPdf([inv.id], kind).catch((e: Error) => toast.error(e.message))}><FileDown className="size-4" /></Button>
                    <Button size="icon" variant="ghost" aria-label="Print" onClick={() => void printInvoice(inv.id, salesTax)}><Printer className="size-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="border-t border-border p-4 text-right text-sm font-semibold">{rows.length} records · Total {money(total)}</div>
      </div>
      {viewId && <DocViewer id={viewId} kind={kind} onClose={() => setViewId(null)} />}
      {creating && <InvoiceForm onClose={() => setCreating(false)} />}
    </AppShell>
  );
}

type Line = { hs_code: string; part_number: string; description: string; description_source: "fbr" | "custom"; uom: string; quantity: number; unit_price: number; discount: number; tax_percent: number; labor_percent: number };
const emptyLine = (): Line => ({ hs_code: "", part_number: "", description: "", description_source: "custom", uom: "pcs", quantity: 1, unit_price: 0, discount: 0, tax_percent: 0, labor_percent: 0 });

/** Manual invoice: same rules as a quotation-generated invoice (vehicle, FBR mapping, per-line labor, stock out). */
function InvoiceForm({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [departmentId, setDepartmentId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [vehicleType, setVehicleType] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([emptyLine()]);
  const departments = useQuery({ queryKey: ["department-options"], queryFn: async () => (await supabase.from("departments").select("id,name").eq("status", "active").order("name")).data ?? [] });
  const upd = (i: number, p: Partial<Line>) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...p } : l)));
  const totals = calculateTotals(lines, (i) => lines[i]!.unit_price);
  const save = useMutation({
    mutationFn: async () => {
      if (!departmentId) throw new Error("Select a buyer / department");
      if (!vehicleType.trim() && !vehicleNumber.trim()) throw new Error("Vehicle type or vehicle number is required");
      const valid = lines.map((l) => documentLineSchema.parse(l));
      const { error } = await supabase.rpc("create_document", { _kind: "invoice", _header: { department_id: departmentId, date, vehicle_type: vehicleType, vehicle_number: vehicleNumber, notes }, _items: valid });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Invoice created — stock deducted"); void qc.invalidateQueries(); onClose(); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-6xl overflow-auto">
        <DialogHeader><DialogTitle>Add invoice</DialogTitle><DialogDescription>Creates the invoice and its sales tax invoice without a quotation.</DialogDescription></DialogHeader>
        <FormSection title="1. Buyer, date & vehicle" hint="Vehicle type or number is required.">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-1.5"><Label>Buyer / Department *</Label>
              <Select value={departmentId} onValueChange={setDepartmentId}><SelectTrigger><SelectValue placeholder="Select buyer" /></SelectTrigger>
                <SelectContent>{(departments.data ?? []).map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Vehicle type</Label><Input maxLength={100} value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} placeholder="e.g. Toyota Corolla" /></div>
            <div className="space-y-1.5"><Label>Vehicle number</Label><Input maxLength={100} value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} placeholder="e.g. GX-559" /></div>
          </div>
        </FormSection>
        <FormSection title="2. Items" hint="Each product has its own labor %. HS codes must map to an FBR HS code."><LineItems lines={lines} upd={upd} setLines={setLines} priceKey="unit_price" labor /></FormSection>
        <div className="grid gap-4 md:grid-cols-2">
          <FormSection title="3. Notes"><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></FormSection>
          <SummaryBox {...totals} money={money} />
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? "Saving…" : "Save invoice"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
