import { downloadPdf, printQuotation } from "@/lib/print";
import { documentLineSchema, calculateTotals, savedLine } from "@/lib/document-calculations";
import { DocFilters, dateRange, emptyDocFilter, type DocFilterState } from "@/components/data/DocFilters";
import { BulkActions, SelectAll, SelectOne, useSelection } from "@/components/data/bulk";
import { DocViewer } from "@/components/data/DocViewer";
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock, Eye, FileDown, FileText, Plus, Pencil, Send, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { db as supabase } from "@/lib/db";
import { AppShell } from "@/components/layout/AppShell";
import { BuyerTypeField } from "@/components/data/BuyerTypeField";
import { buyerTypeProblem, suggestBuyerType } from "@/lib/buyer-type";
import { LineItems } from "@/components/data/LineItems";
import { DataTools } from "@/components/data/DataTools";
import { flatten, importQuotations, quotationFields, quotationExportFields } from "@/lib/doc-import";
import { FormSection, RowActions, StatusBadge, SummaryBox, TableState, Toolbar } from "@/components/data/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/quotations")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Quotations — Spare Parts System" },
      { name: "description", content: "Create quotations, submit for approval, and auto-convert approved quotations to invoices." },
      { property: "og:title", content: "Quotations — Spare Parts System" },
      { property: "og:description", content: "Create quotations, submit for approval, and auto-convert approved quotations to invoices." },
    ],
  }),
  component: QuotationsPage,
});

type Line = { product_name:string; type_of_goods:string; retail_sales_value:number; hs_code: string; part_number: string; description: string; description_source: "fbr" | "custom"; uom: string; quantity: number; unit_price: number; tax_percent: number; item_kind: "goods" | "service"; service_percent: number | null; sro_schedule_no: string; sro_item_serial_no: string };
const emptyLine = (): Line => ({ product_name:"", type_of_goods:"", retail_sales_value:0, hs_code: "", part_number: "", description: "", description_source: "custom", uom: "", quantity: 1, unit_price: 0, tax_percent: 0, item_kind: "goods", service_percent: null, sro_schedule_no: "", sro_item_serial_no: "" });
const money = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
type QuotationStatus = "draft" | "submitted" | "approved" | "rejected" | "cancelled" | "invoiced";
const FILTERS: Array<{ v: "all" | QuotationStatus; l: string }> = [
  { v: "all", l: "All" }, { v: "draft", l: "Draft" }, { v: "submitted", l: "Pending" },
  { v: "invoiced", l: "Approved" }, { v: "rejected", l: "Rejected" },
];

function useSetStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, remarks }: { id: string; status: QuotationStatus; remarks?: string | undefined }) => {
      const patch: { status: QuotationStatus; approved_at?: string; approval_remarks?: string } = { status };
      if (status === "approved") patch["approved_at"] = new Date().toISOString();
      if (remarks !== undefined) patch["approval_remarks"] = remarks;
      const { error } = await supabase.from("quotations").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      toast.success(status === "approved" ? "Approved — invoice created and stock deducted" : status === "rejected" ? "Quotation rejected" : "Submitted for approval");
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

function QuotationsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | QuotationStatus>("all");
  const [editing,setEditing]=useState<any>(null);
  const [creating, setCreating] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  const [a4Id, setA4Id] = useState<string | null>(null);
  const [f, setF] = useState<DocFilterState>(emptyDocFilter);
  const s = useSelection();
  const setStatus = useSetStatus();

  const list = useQuery({
    queryKey: ["quotations", search, filter, f],
    queryFn: async () => {
      let q = supabase.from("quotations").select("*, departments(name)").order("created_at", { ascending: false }).limit(500);
      const term = search.trim().replace(/[%,()]/g, "");
      if (term) q = q.or(`quotation_number.ilike.%${term}%,contact_person.ilike.%${term}%,vehicle_number.ilike.%${term}%,vehicle_type.ilike.%${term}%`);
      if (f.depts.length) q = q.in("department_id", f.depts);
      const r = dateRange(f);
      if (r.from) q = q.gte("quotation_date", r.from);
      if (r.to) q = q.lte("quotation_date", r.to);
      if (filter !== "all") q = filter === "invoiced" ? q.in("status", ["approved", "invoiced"]) : q.eq("status", filter);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("quotations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Deleted"); void qc.invalidateQueries({ queryKey: ["quotations"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = list.data ?? [];
  return (
    <AppShell
      title="Quotations"
      description="Approving a quotation automatically creates its invoice and deducts stock"
      actions={<Button size="sm" onClick={() => setCreating(true)}><Plus className="size-4" />New quotation</Button>}
    >
      <div className="panel overflow-hidden">
        <Toolbar search={search} onSearch={setSearch} placeholder="Search number or contact…">
          <div className="flex rounded-lg border border-border bg-muted/40 p-0.5">
            {FILTERS.map((f) => (
              <button key={f.v} onClick={() => setFilter(f.v)} className={cn("rounded-md px-3 py-1 text-xs font-medium transition-colors", filter === f.v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>{f.l}</button>
            ))}
          </div>
          <DataTools name="quotations" fields={quotationFields} exportFields={quotationExportFields}
            exportRows={async () => {
              const { data, error } = await supabase.from("quotations").select("*, departments(name), quotation_items(*)").order("quotation_date");
              if (error) throw error;
              return flatten(data as never, "quotation_items", (d) => ({ ref: d["quotation_number"], quotation_date: d["quotation_date"], buyer: (d["departments"] as { name: string } | null)?.name, contact_person: d["contact_person"] }));
            }}
            onImport={async (rows) => { const m = await importQuotations(rows); await qc.invalidateQueries({ queryKey: ["quotations"] }); return m; }} />
        </Toolbar>
        <DocFilters value={f} onChange={setF} />
        <BulkActions table="quotations" s={s} onPdf={(ids) => downloadPdf(ids, "quotation")} />
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"><SelectAll ids={rows.map((r) => r.id)} s={s} /></TableHead>
              <TableHead>Number</TableHead><TableHead>Date</TableHead><TableHead>Buyer</TableHead>
              <TableHead>Valid until</TableHead><TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead><TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableState cols={8} loading={list.isLoading} error={list.error ? (list.error as Error).message : null} empty={!list.isLoading && rows.length === 0} title="No quotations found" hint="Create a quotation and submit it for approval." />
            {rows.map((q) => (
              <TableRow key={q.id} className="cursor-pointer" onClick={() => setViewId(q.id)}>
                <TableCell onClick={(e) => e.stopPropagation()}><SelectOne id={q.id} s={s} /></TableCell>
                <TableCell className="font-mono text-xs font-semibold">{q.quotation_number}</TableCell>
                <TableCell>{q.quotation_date}</TableCell>
                <TableCell className="font-medium">{(q.departments as { name: string } | null)?.name}</TableCell>
                <TableCell className="text-muted-foreground">{q.valid_until ?? "—"}</TableCell>
                <TableCell className="text-right font-semibold tabular-nums">{money(Number(q.grand_total))}</TableCell>
                <TableCell><StatusBadge status={q.status} label={q.status === "invoiced" ? "Approved · invoiced" : undefined} /></TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <RowActions actions={[
                    {label:"Edit draft",icon:Pencil,hidden:q.status!=="draft",onClick:async()=>{const {data,error}=await supabase.from("quotations").select("*, quotation_items(*)").eq("id",q.id).single();if(error)toast.error(error.message);else setEditing(data);}},
                    { label: "View", icon: Eye, onClick: () => setViewId(q.id) },
                    { label: "View A4", icon: FileText, onClick: () => setA4Id(q.id) },
                    { label: "Download PDF", icon: FileDown, onClick: () => void downloadPdf([q.id], "quotation").catch((e: Error) => toast.error(e.message)) },
                    { label: "Submit for approval", icon: Send, hidden: q.status !== "draft", onClick: () => setStatus.mutate({ id: q.id, status: "submitted" }) },
                    { label: "Review & approve", icon: CheckCircle2, hidden: q.status !== "submitted", onClick: () => setViewId(q.id) },
                    { label: "Delete", icon: Trash2, danger: true, separator: true, hidden: q.status !== "draft", onClick: () => confirm("Delete this quotation?") && del.mutate(q.id) },
                  ]} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
        <div className="border-t border-border p-4 text-right text-sm font-semibold">{rows.length} records · Total {money(rows.reduce((a, r) => a + Number(r.grand_total), 0))}</div>
      </div>
      {a4Id && <DocViewer id={a4Id} kind="quotation" onClose={() => setA4Id(null)} />}
      {editing && <QuotationForm key={editing.id} initial={editing} onClose={()=>setEditing(null)}/>}
      {creating && <QuotationForm onClose={() => setCreating(false)} />}
      {viewId && <QuotationView id={viewId} onClose={() => setViewId(null)} />}
    </AppShell>
  );
}

function QuotationForm({ onClose, initial }: { onClose: () => void; initial?:any }) {
  const qc = useQueryClient();
  const [departmentId, setDepartmentId] = useState(initial?.department_id??"");
  const [date, setDate] = useState(initial?.quotation_date??new Date().toISOString().slice(0, 10));
  const [validUntil, setValidUntil] = useState(initial?.valid_until??"");
  const [contact, setContact] = useState(initial?.contact_person??"");
  const [notes, setNotes] = useState(initial?.notes??"");
  const [vehicleType, setVehicleType] = useState(initial?.vehicle_type??"");
  const [vehicleNumber, setVehicleNumber] = useState(initial?.vehicle_number??"");
  const [lines, setLines] = useState<Line[]>(initial?.quotation_items?.map((it:any)=>savedLine(emptyLine(),it))??[emptyLine()]);
  const [tried, setTried] = useState(false);
  const [buyerType, setBuyerType] = useState<string>(initial?.buyer_type??"");

  const departments = useQuery({
    queryKey: ["department-options"],
    queryFn: async () => (await supabase.from("departments").select("id,name,tax_number,registration_type").eq("status", "active").order("name")).data ?? [],
  });
  const buyerProblem = departmentId ? buyerTypeProblem(buyerType, (departments.data ?? []).find((d:any) => d.id === departmentId)?.tax_number) : null;

  const upd = (i: number, patch: Partial<Line>) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const totals = calculateTotals(lines, (i) => lines[i]?.unit_price ?? 0);

  const save = useMutation({
    mutationFn: async () => {
      setTried(true);
      if (!departmentId) throw new Error("Select a buyer / department");
      if (buyerProblem) throw new Error(buyerProblem);
      if (!vehicleType.trim() && !vehicleNumber.trim()) throw new Error("Vehicle type or vehicle number is required");
      if (!lines.length || lines.length > 200) throw new Error("Add between 1 and 200 items");
      const valid = lines.map(l => documentLineSchema.parse(l));
      const { error } = await supabase.rpc(initial?"update_document":"create_document", { _id:initial?.id, _kind: "quotation", _header: { department_id: departmentId, date, valid_until: validUntil, contact_person: contact, notes, vehicle_type: vehicleType, vehicle_number: vehicleNumber, buyer_type: buyerType }, _items: valid });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Quotation saved as draft"); void qc.invalidateQueries({ queryKey: ["quotations"] }); onClose(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-6xl overflow-auto">
        <DialogHeader>
          <DialogTitle>{initial?"Edit draft quotation":"New quotation"}</DialogTitle>
          <DialogDescription>Saved as a draft. Submit it for approval when ready.</DialogDescription>
        </DialogHeader>
        <FormSection title="1. Buyer & dates">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-1.5">
              <Label>Buyer / Department *</Label>
              <Select value={departmentId} onValueChange={(v) => { setDepartmentId(v); setBuyerType(suggestBuyerType((departments.data ?? []).find((d:any) => d.id === v)?.registration_type)); }}>
                <SelectTrigger className={cn(tried && !departmentId && "border-destructive")}><SelectValue placeholder="Select buyer" /></SelectTrigger>
                <SelectContent>{(departments.data ?? []).map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
              {tried && !departmentId ? <p className="text-xs text-destructive">Buyer is required</p> : null}
            </div>
            <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Valid until</Label><Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Contact person</Label><Input placeholder="e.g. Mr. Ahmed" value={contact} onChange={(e) => setContact(e.target.value)} /></div>
            <BuyerTypeField value={buyerType} onChange={setBuyerType} problem={tried || buyerType ? buyerProblem : null} />
          </div>
        </FormSection>
        <FormSection title="Vehicle" hint="Enter vehicle type or number (at least one required).">
          <div className="grid gap-3 md:grid-cols-2"><div><Label>Vehicle type</Label><Input maxLength={100} value={vehicleType} onChange={e => setVehicleType(e.target.value)} placeholder="e.g. Toyota Corolla" /></div><div><Label>Vehicle number</Label><Input maxLength={100} value={vehicleNumber} onChange={e => setVehicleNumber(e.target.value)} placeholder="e.g. GX-559" /></div></div>
        </FormSection>
        <FormSection title="2. Items" hint="Add labour and other charges as Service lines with their own HS code, % and amount. HS codes must map to an FBR HS code.">
          <LineItems lines={lines} upd={upd} setLines={setLines} priceKey="unit_price" quotation />
        </FormSection>
        <div className="grid gap-4 md:grid-cols-2">
          <FormSection title="3. Notes"><Textarea placeholder="Delivery terms, remarks…" value={notes} onChange={(e) => setNotes(e.target.value)} /></FormSection>
          <SummaryBox {...totals} money={money} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? "Saving…" : "Save quotation"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const STEPS = [
  { key: "draft", label: "Draft", icon: FileText },
  { key: "submitted", label: "Pending approval", icon: Clock },
  { key: "decision", label: "Approved / Rejected", icon: CheckCircle2 },
] as const;

function QuotationView({ id, onClose }: { id: string; onClose: () => void }) {
  const setStatus = useSetStatus();
  const [remarks, setRemarks] = useState("");
  const q = useQuery({
    queryKey: ["quotation", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("quotations").select("*, departments(name), quotation_items(*), invoices(invoice_number), quotation_approvals(*)").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });
  const d = q.data;
  const stepIdx = !d ? 0 : d.status === "draft" ? 0 : d.status === "submitted" ? 1 : 2;
  const rejected = d?.status === "rejected";
  const history = [...(d?.quotation_approvals ?? [])].sort((a, b) => a.acted_at.localeCompare(b.acted_at));

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">Quotation {d?.quotation_number} <Button size="sm" variant="outline" onClick={() => void printQuotation(id)}>Print</Button><Button size="sm" variant="outline" onClick={() => void downloadPdf([id], "quotation")}>Download PDF</Button> {d ? <StatusBadge status={d.status} label={d.status === "invoiced" ? "Approved · invoiced" : undefined} /> : null}</DialogTitle>
          <DialogDescription>Review the items and totals before making a decision.</DialogDescription>
        </DialogHeader>
        {d && (
          <div className="space-y-4">
            <ol className="grid grid-cols-3 gap-2">
              {STEPS.map((s, i) => {
                const done = i < stepIdx || (i === stepIdx && i === 2);
                const current = i === stepIdx && i !== 2;
                const Icon = i === 2 && rejected ? XCircle : s.icon;
                return (
                  <li key={s.key} className={cn("flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium",
                    done ? (rejected && i === 2 ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-success/30 bg-success/10 text-success") : current ? "border-primary/40 bg-primary/10 text-primary" : "border-border text-muted-foreground")}>
                    <Icon className="size-4" />{i === 2 && stepIdx === 2 ? (rejected ? "Rejected" : "Approved") : s.label}
                  </li>
                );
              })}
            </ol>
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-muted/25 p-4 text-sm md:grid-cols-4">
              <Info label="Buyer / Department" value={(d.departments as { name: string } | null)?.name} />
              <Info label="Date" value={d.quotation_date} />
              <Info label="Valid until" value={d.valid_until ?? "—"} />
              <Info label="Contact" value={d.contact_person ?? "—"} /><Info label="Vehicle type" value={d.vehicle_type ?? "—"} /><Info label="Vehicle number" value={d.vehicle_number ?? "—"} />
              {d.invoices.length > 0 && <Info label="Invoice" value={d.invoices[0]?.invoice_number} mono />}
            </div>
            <div className="overflow-hidden rounded-xl border border-border">
              <Table>
                <TableHeader><TableRow><TableHead>Product Name</TableHead><TableHead>Part no.</TableHead><TableHead className="text-right">Units</TableHead><TableHead className="text-right">Price</TableHead><TableHead className="text-right">Sales Tax %</TableHead><TableHead className="text-right">Sales Tax Value</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                <TableBody>
                  {d.quotation_items.map((it:any) => (
                    <TableRow key={it.id}>
                      <TableCell>{it.product_name || "—"}</TableCell><TableCell>{it.part_number ?? "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">{it.quantity}</TableCell><TableCell className="text-right tabular-nums">{money(Number(it.unit_price))}</TableCell>
                      <TableCell className="text-right tabular-nums">{Number(it.tax_percent)}</TableCell>
                      <TableCell className="text-right tabular-nums">{money(Number(it.sales_tax_value))}</TableCell><TableCell className="text-right font-semibold tabular-nums">{money(Number(it.line_total))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-border p-4">
                <p className="mb-3 font-heading text-sm font-semibold">Approval history</p>
                {history.length === 0 ? <p className="text-xs text-muted-foreground">No actions yet.</p> : (
                  <ol className="space-y-3 border-l border-border pl-4">
                    {history.map((h) => (
                      <li key={h.id} className="relative">
                        <span className={cn("absolute -left-[21px] top-1 size-2.5 rounded-full ring-4 ring-card", h.action === "approved" ? "bg-success" : h.action === "rejected" ? "bg-destructive" : "bg-warning")} />
                        <p className="text-sm font-medium capitalize">{h.action === "submitted" ? "Submitted for approval" : h.action}</p>
                        <p className="text-xs text-muted-foreground">{new Date(h.acted_at).toLocaleString()}</p>
                        {h.remarks ? <p className="mt-1 text-xs">“{h.remarks}”</p> : null}
                      </li>
                    ))}
                  </ol>
                )}
                {d.approval_remarks && !history.some((h) => h.remarks) ? <p className="mt-3 text-xs">Remarks: {d.approval_remarks}</p> : null}
              </div>
              <SummaryBox sub={Number(d.subtotal)} tax={Number(d.tax_total)} grand={Number(d.grand_total)} labor={Number(d.labor_amount)} money={money} />
            </div>
            {d.status === "submitted" && (
              <div className="space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
                <p className="font-heading text-sm font-semibold">Your decision</p>
                <Textarea placeholder="Remarks (optional, required for rejection)" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
                <div className="flex flex-wrap justify-end gap-2">
                  <Button variant="outline" className="border-destructive/40 text-destructive hover:bg-destructive/10" disabled={setStatus.isPending}
                    onClick={() => { if (!remarks.trim()) { toast.error("Please add a reason for rejection"); return; } setStatus.mutate({ id, status: "rejected", remarks }, { onSuccess: onClose }); }}>
                    <XCircle className="size-4" />Reject
                  </Button>
                  <Button className="bg-success text-success-foreground hover:bg-success/90" disabled={setStatus.isPending}
                    onClick={() => setStatus.mutate({ id, status: "approved", remarks: remarks || undefined }, { onSuccess: onClose })}>
                    <CheckCircle2 className="size-4" />Approve & create invoice
                  </Button>
                </div>
              </div>
            )}
            {d.status === "draft" && (
              <div className="flex justify-end"><Button onClick={() => setStatus.mutate({ id, status: "submitted" }, { onSuccess: onClose })}><Send className="size-4" />Submit for approval</Button></div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Info({ label, value, mono }: { label: string; value?: string | null | undefined; mono?: boolean }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("font-medium", mono && "font-mono")}>{value ?? "—"}</p>
    </div>
  );
}
