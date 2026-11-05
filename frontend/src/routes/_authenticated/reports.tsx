import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { db as supabase } from "@/lib/db";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MultiPick, useOptions } from "@/components/data/DocFilters";
import { downloadCsv, formatMoney, toCsv } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Reports — Spare Parts System" },
      { name: "description", content: "Department-wise sales, supplier-wise purchases, quotation, invoice and stock reports with filters and export." },
      { property: "og:title", content: "Reports — Spare Parts System" },
      { property: "og:description", content: "Department-wise sales, supplier-wise purchases, quotation, invoice and stock reports with filters and export." },
    ],
  }),
  component: ReportsPage,
});

type Kind = "dept_sales" | "supplier_purchases" | "purchases" | "quotations" | "invoices" | "stock_in" | "stock_out" | "inventory";
type Row = Record<string, string | number | null>;
const MONEY_COLS = new Set(["total", "tax", "labor", "sales_total", "purchase_total"]);
const DEPT_KINDS: Kind[] = ["dept_sales", "quotations", "invoices"];
const SUP_KINDS: Kind[] = ["supplier_purchases", "purchases"];
const HS_KINDS: Kind[] = ["stock_in", "stock_out", "inventory"];

const monthStart = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10); };

function ReportsPage() {
  const [kind, setKind] = useState<Kind>("dept_sales");
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [depts, setDepts] = useState<string[]>([]);
  const [sups, setSups] = useState<string[]>([]);
  const [hs, setHs] = useState("");
  const [search, setSearch] = useState("");
  const deptOpts = useOptions("departments");
  const supOpts = useOptions("suppliers");

  const q = useQuery({
    queryKey: ["report", kind, from, to, depts, sups, hs],
    queryFn: async (): Promise<{ cols: string[]; rows: Row[]; totalKey?: string }> => {
      if (kind === "dept_sales" || kind === "invoices") {
        let s = supabase.from("invoices").select("invoice_number, invoice_date, tax_total, grand_total, department_id, source, departments(name), quotations(quotation_number)").gte("invoice_date", from).lte("invoice_date", to).order("invoice_date");
        if (depts.length) s = s.in("department_id", depts);
        const { data, error } = await s; if (error) throw error;
        if (kind === "invoices") {
          const rows = (data ?? []).map((r) => ({ number: r.invoice_number, date: r.invoice_date, department: (r.departments as { name: string } | null)?.name ?? "", source: r.source === "manual" ? "Manual" : (r.quotations as { quotation_number: string } | null)?.quotation_number ?? "", tax: Number(r.tax_total), total: Number(r.grand_total) }));
          return { cols: ["number", "date", "department", "source", "tax", "total"], rows, totalKey: "total" };
        }
        const g = new Map<string, Row>();
        for (const r of data ?? []) {
          const name = (r.departments as { name: string } | null)?.name ?? "—";
          const a = g.get(name) ?? { department: name, invoices: 0, tax: 0, sales_total: 0 };
          a["invoices"] = Number(a["invoices"]) + 1; a["tax"] = Number(a["tax"]) + Number(r.tax_total); a["sales_total"] = Number(a["sales_total"]) + Number(r.grand_total);
          g.set(name, a);
        }
        return { cols: ["department", "invoices", "tax", "sales_total"], rows: [...g.values()].sort((a, b) => Number(b["sales_total"]) - Number(a["sales_total"])), totalKey: "sales_total" };
      }
      if (kind === "purchases" || kind === "supplier_purchases") {
        let s = supabase.from("purchases").select("purchase_number, purchase_date, bill_number, grand_total, verification, supplier_id, suppliers(name)").gte("purchase_date", from).lte("purchase_date", to).order("purchase_date");
        if (sups.length) s = s.in("supplier_id", sups);
        const { data, error } = await s; if (error) throw error;
        if (kind === "purchases") {
          const rows = (data ?? []).map((r) => ({ number: r.purchase_number, date: r.purchase_date, supplier: (r.suppliers as { name: string } | null)?.name ?? "", bill: r.bill_number, status: r.verification, total: Number(r.grand_total) }));
          return { cols: ["number", "date", "supplier", "bill", "status", "total"], rows, totalKey: "total" };
        }
        const g = new Map<string, Row>();
        for (const r of data ?? []) {
          const name = (r.suppliers as { name: string } | null)?.name ?? "—";
          const a = g.get(name) ?? { supplier: name, purchases: 0, purchase_total: 0 };
          a["purchases"] = Number(a["purchases"]) + 1; a["purchase_total"] = Number(a["purchase_total"]) + Number(r.grand_total);
          g.set(name, a);
        }
        return { cols: ["supplier", "purchases", "purchase_total"], rows: [...g.values()].sort((a, b) => Number(b["purchase_total"]) - Number(a["purchase_total"])), totalKey: "purchase_total" };
      }
      if (kind === "quotations") {
        let s = supabase.from("quotations").select("quotation_number, quotation_date, status, grand_total, department_id, departments(name)").gte("quotation_date", from).lte("quotation_date", to).order("quotation_date");
        if (depts.length) s = s.in("department_id", depts);
        const { data, error } = await s; if (error) throw error;
        const rows = (data ?? []).map((r) => ({ number: r.quotation_number, date: r.quotation_date, department: (r.departments as { name: string } | null)?.name ?? "", status: r.status, total: Number(r.grand_total) }));
        return { cols: ["number", "date", "department", "status", "total"], rows, totalKey: "total" };
      }
      if (kind === "inventory") {
        let s = supabase.from("current_stock").select("*").order("hs_code");
        if (hs) s = s.eq("hs_code", hs);
        const { data } = await s;
        return { cols: ["hs_code", "description", "total_in", "total_out", "available"], rows: (data ?? []) as Row[] };
      }
      let s = supabase.from("stock_movements").select("movement_number, movement_date, hs_code, description, quantity, uom, reference_number").eq("direction", kind === "stock_in" ? "in" : "out").gte("movement_date", from).lte("movement_date", to).order("movement_date");
      if (hs) s = s.eq("hs_code", hs);
      const { data } = await s;
      return { cols: ["movement_number", "movement_date", "hs_code", "description", "quantity", "uom", "reference_number"], rows: (data ?? []) as Row[] };
    },
  });

  const term = search.trim().toLowerCase();
  const rows = (q.data?.rows ?? []).filter((r) => !term || Object.values(r).some((v) => String(v ?? "").toLowerCase().includes(term)));
  const total = q.data?.totalKey ? rows.reduce((a, r) => a + Number(r[q.data!.totalKey!] ?? 0), 0) : undefined;
  const exportCsv = () => q.data && downloadCsv(`${kind}-${from}-to-${to}.csv`, toCsv(rows, q.data.cols));

  return (
    <AppShell title="Reports" description="Filter by date, department, supplier or HS code and export" actions={<Button size="sm" variant="outline" onClick={exportCsv}><Download className="mr-1 size-4" />Export</Button>}>
      <Tabs value={kind} onValueChange={(v) => setKind(v as Kind)}>
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="dept_sales">Department sales</TabsTrigger><TabsTrigger value="supplier_purchases">Supplier purchases</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger><TabsTrigger value="quotations">Quotations</TabsTrigger>
          <TabsTrigger value="purchases">Purchases</TabsTrigger><TabsTrigger value="stock_in">Stock In</TabsTrigger>
          <TabsTrigger value="stock_out">Stock Out</TabsTrigger><TabsTrigger value="inventory">Inventory</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="my-4 flex flex-wrap items-end gap-3">
        <div><Label>Search</Label><Input placeholder="Search this report…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        {kind !== "inventory" && <>
          <div><Label>From</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div><Label>To</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
        </>}
        {DEPT_KINDS.includes(kind) && <div><Label className="block">Department</Label><MultiPick label="departments" options={deptOpts.data ?? []} value={depts} onChange={setDepts} /></div>}
        {SUP_KINDS.includes(kind) && <div><Label className="block">Supplier</Label><MultiPick label="suppliers" options={supOpts.data ?? []} value={sups} onChange={setSups} /></div>}
        {HS_KINDS.includes(kind) && <div><Label>HS code</Label><Input placeholder="All HS codes" value={hs} onChange={(e) => setHs(e.target.value.trim())} /></div>}
      </div>
      <div className="panel overflow-x-auto">
        <Table>
          <TableHeader><TableRow>{q.data?.cols.map((c) => <TableHead key={c} className="capitalize">{c.replace(/_/g, " ")}</TableHead>)}</TableRow></TableHeader>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={i}>{q.data!.cols.map((c) => <TableCell key={c}>{typeof r[c] === "number" && MONEY_COLS.has(c) ? formatMoney(r[c]) : String(r[c] ?? "")}</TableCell>)}</TableRow>
            ))}
            {q.data && rows.length === 0 && <TableRow><TableCell colSpan={q.data.cols.length} className="py-10 text-center text-muted-foreground">No records for these filters</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
      {total !== undefined && <p className="mt-3 text-right text-lg font-bold">{rows.length} rows · Total {formatMoney(total)}</p>}
    </AppShell>
  );
}
