import { documentLineSchema, calculateLine, roundMoney } from "@/lib/document-calculations";
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Plus, ShieldCheck, ShieldOff, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { db as supabase } from "@/lib/db";
import { AppShell } from "@/components/layout/AppShell";
import { HsCodePicker } from "@/components/data/HsCodePicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineItems } from "@/components/data/LineItems";
import { DataTools } from "@/components/data/DataTools";
import { flatten, importPurchases, purchaseFields } from "@/lib/doc-import";
import { DateFilter, MultiPick, dateRange, useOptions, type DatePreset } from "@/components/data/DocFilters";
import { BulkActions, SelectAll, SelectOne, useSelection } from "@/components/data/bulk";
import { FormSection, RowActions, StatusBadge, SummaryBox, TableState, Toolbar } from "@/components/data/kit";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/purchases")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Purchases — Spare Parts System" },
      { name: "description", content: "Record supplier purchases; verified purchases add stock automatically." },
      { property: "og:title", content: "Purchases — Spare Parts System" },
      { property: "og:description", content: "Record supplier purchases; verified purchases add stock automatically." },
    ],
  }),
  component: PurchasesPage,
});

type Line = { product_name:string; type_of_goods:string; retail_sales_value:number; hs_code: string; part_number: string; description: string; description_source: "fbr" | "custom"; uom: string; quantity: number; unit_cost: number; discount: number; tax_percent: number };
const emptyLine = (): Line => ({ product_name:"", type_of_goods:"", retail_sales_value:0, hs_code: "", part_number: "", description: "", description_source: "fbr", uom: "", quantity: 1, unit_cost: 0, discount: 0, tax_percent: 0 });
const lineCalc = (l: Line) => calculateLine(l, l.unit_cost);
const money = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function PurchasesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  const [sups, setSups] = useState<string[]>([]);
  const [df, setDf] = useState<{ preset: DatePreset; from: string; to: string }>({ preset: "all", from: "", to: "" });
  const supOpts = useOptions("suppliers");
  const s = useSelection();

  const list = useQuery({
    queryKey: ["purchases", search, sups, df],
    queryFn: async () => {
      let q = supabase.from("purchases").select("*, suppliers(name)").order("created_at", { ascending: false }).limit(200);
      const term = search.trim().replace(/[%,()]/g, "");
      if (term) q = q.or(`purchase_number.ilike.%${term}%,bill_number.ilike.%${term}%,reference_number.ilike.%${term}%`);
      if (sups.length) q = q.in("supplier_id", sups);
      const r = dateRange(df);
      if (r.from) q = q.gte("purchase_date", r.from);
      if (r.to) q = q.lte("purchase_date", r.to);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const setVerify = useMutation({
    mutationFn: async ({ id, v }: { id: string; v: "verified" | "unverified" }) => {
      const { error } = await supabase.from("purchases").update({ verification: v }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { v }) => {
      toast.success(v === "verified" ? "Verified — stock added" : "Unverified — stock reversed");
      qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("purchases").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["purchases"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell
      title="Purchases"
      description="Verifying a purchase automatically adds its items to stock"
      actions={<Button size="sm" onClick={() => setCreating(true)}><Plus className="size-4" />New purchase</Button>}
    >
      <div className="panel overflow-hidden">
        <Toolbar search={search} onSearch={setSearch} placeholder="Search number, bill or reference…">
          <DataTools name="purchases" fields={purchaseFields}
            exportRows={async () => {
              const { data, error } = await supabase.from("purchases").select("*, suppliers(name,tax_number), purchase_items(*)").order("purchase_date");
              if (error) throw error;
              return flatten(data as never, "purchase_items", (d) => ({ ref: d["purchase_number"], purchase_date: d["purchase_date"], supplier_ntn:d["supplier_ntn"]??(d["suppliers"] as {tax_number?:string}|null)?.tax_number, supplier:d["supplier_name"]??(d["suppliers"] as { name: string } | null)?.name, bill_number: d["bill_number"] }));
            }}
            onImport={async (rows) => { const m = await importPurchases(rows); await qc.invalidateQueries({ queryKey: ["purchases"] }); return m; }} />
        </Toolbar>
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2"><MultiPick label="suppliers" options={supOpts.data ?? []} value={sups} onChange={setSups} /><DateFilter value={df} onChange={setDf} /></div>
        <BulkActions table="purchases" s={s} />
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"><SelectAll ids={(list.data ?? []).map((r) => r.id)} s={s} /></TableHead>
              <TableHead>Number</TableHead><TableHead>Date</TableHead><TableHead>Supplier</TableHead>
              <TableHead>Bill No.</TableHead><TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead><TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableState cols={8} loading={list.isLoading} empty={!list.isLoading && (list.data?.length ?? 0) === 0} title="No purchases found" hint="Record a supplier purchase, then verify it to add stock." />
            {(list.data ?? []).map((p) => (
              <TableRow key={p.id}>
                <TableCell><SelectOne id={p.id} s={s} /></TableCell>
                <TableCell className="font-mono">{p.purchase_number}</TableCell>
                <TableCell>{p.purchase_date}</TableCell>
                <TableCell>{(p.suppliers as { name: string } | null)?.name}</TableCell>
                <TableCell>{p.bill_number}</TableCell>
                <TableCell className="text-right">{money(Number(p.grand_total))}</TableCell>
                <TableCell><StatusBadge status={p.verification} /></TableCell>
                <TableCell className="text-right">
                  <RowActions actions={[
                    { label: "View", icon: Eye, onClick: () => setViewId(p.id) },
                    p.verification === "verified"
                      ? { label: "Unverify (reverse stock)", icon: ShieldOff, onClick: () => setVerify.mutate({ id: p.id, v: "unverified" }) }
                      : { label: "Verify & add stock", icon: ShieldCheck, onClick: () => setVerify.mutate({ id: p.id, v: "verified" }) },
                    { label: "Delete", icon: Trash2, danger: true, separator: true, hidden: p.verification === "verified", onClick: () => confirm("Delete this purchase?") && del.mutate(p.id) },
                  ]} />
                </TableCell>
              </TableRow>
            ))}

          </TableBody>
        </Table>
        </div>
        <div className="border-t border-border p-4 text-right text-sm font-semibold">{(list.data ?? []).length} records · Total {money((list.data ?? []).reduce((a, r) => a + Number(r.grand_total), 0))}</div>
      </div>
      {creating && <PurchaseForm onClose={() => setCreating(false)} />}
      {viewId && <PurchaseView id={viewId} onClose={() => setViewId(null)} />}
    </AppShell>
  );
}

function PurchaseForm({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [supplierId, setSupplierId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [bill, setBill] = useState("");
  const [ref, setRef] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([emptyLine()]);

  const suppliers = useQuery({
    queryKey: ["supplier-options"],
    queryFn: async () => (await supabase.from("suppliers").select("id,name,tax_number").eq("status", "active").order("name")).data ?? [],
  });

  const upd = (i: number, patch: Partial<Line>) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const totals = lines.reduce((a, l) => {
    const c = lineCalc(l);
    return { sub: a.sub + l.quantity * l.unit_cost, disc: a.disc + l.discount, tax: a.tax + c.tax, grand: a.grand + c.total };
  }, { sub: 0, disc: 0, tax: 0, grand: 0 });

  const save = useMutation({
    mutationFn: async () => {
      if(!bill.trim())throw new Error("Purchase Invoice Number is required");
      if (!supplierId) throw new Error("Select a supplier");
      if (!lines.length || lines.length > 200) throw new Error("Add between 1 and 200 items");
      const valid = lines.map(l => documentLineSchema.parse(l));
      const { error } = await supabase.rpc("create_document", { _kind: "purchase", _header: { supplier_id: supplierId, date, bill_number: bill, reference_number: ref, notes }, _items: valid });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Purchase saved"); qc.invalidateQueries({ queryKey: ["purchases"] }); onClose(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-6xl overflow-auto">
        <DialogHeader><DialogTitle>New Purchase</DialogTitle></DialogHeader>
        <FormSection title="1. Supplier & bill">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="space-y-1">
            <Label>Supplier *</Label>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
              <SelectContent>{(suppliers.data ?? []).map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1"><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div className="space-y-1"><Label>Purchase Invoice Number *</Label><Input value={bill} onChange={(e) => setBill(e.target.value)} /></div>
          <div className="space-y-1"><Label>Reference No.</Label><Input value={ref} onChange={(e) => setRef(e.target.value)} /></div>
        </div>
        <div className="mt-3"><Label>Supplier NTN</Label><Input readOnly value={suppliers.data?.find((s:any)=>s.id===supplierId)?.tax_number??""}/></div>
        </FormSection>
        <FormSection title="2. Items" hint="Search an HS code by number or name, then choose the FBR or custom description.">
          <LineItems lines={lines} upd={upd} setLines={setLines} priceKey="unit_cost" />
        </FormSection>
        <div className="grid gap-4 md:grid-cols-2">
          <FormSection title="3. Notes"><Textarea placeholder="Remarks…" value={notes} onChange={(e) => setNotes(e.target.value)} /></FormSection>
          <SummaryBox {...totals} money={money} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>Save Purchase</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PurchaseView({ id, onClose }: { id: string; onClose: () => void }) {
  const q = useQuery({
    queryKey: ["purchase", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("purchases").select("*, suppliers(name,tax_number), purchase_items(*)").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });
  const p = q.data;
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader><DialogTitle>Purchase {p?.purchase_number}</DialogTitle></DialogHeader>
        {p && (
          <>
            <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
              <div><span className="text-muted-foreground">Supplier</span><div>{(p.suppliers as { name: string } | null)?.name}</div></div>
              <div><span className="text-muted-foreground">Date</span><div>{p.purchase_date}</div></div>
              <div><span className="text-muted-foreground">Bill No.</span><div>{p.bill_number ?? "—"}</div></div>
              <div><span className="text-muted-foreground">Status</span><div><StatusBadge status={p.verification} /></div></div>
            </div>
            <Table>
              <TableHeader><TableRow><TableHead>HS Code</TableHead><TableHead>Part no.</TableHead><TableHead>Description</TableHead><TableHead>Units</TableHead><TableHead>Unit Cost</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
              <TableBody>
                {p.purchase_items.map((it:any) => (
                  <TableRow key={it.id}>
                    <TableCell className="font-mono">{it.hs_code}</TableCell><TableCell>{it.part_number ?? "—"}</TableCell><TableCell>{it.description}</TableCell>
                    <TableCell>{it.quantity}</TableCell><TableCell>{money(Number(it.unit_cost))}</TableCell>
                    <TableCell className="text-right">{money(Number(it.line_total))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="text-right text-lg font-bold">Grand Total: {money(Number(p.grand_total))}</div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
