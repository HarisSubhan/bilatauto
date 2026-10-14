import { DataTools } from "@/components/data/DataTools";
import { importOpeningStock, openingStockFields } from "@/lib/doc-import";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowDownLeft, ArrowUpRight, PackageCheck, PackageX } from "lucide-react";
import { db as supabase } from "@/lib/db";
import { AppShell } from "@/components/layout/AppShell";
import { StatusBadge, TableState, Toolbar } from "@/components/data/kit";
import { DateFilter, dateRange, type DatePreset } from "@/components/data/DocFilters";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/stock")({
  head: () => ({
    meta: [
      { title: "Inventory — Spare Parts System" },
      { name: "description", content: "Current stock by HS code and full stock in/out ledger." },
      { property: "og:title", content: "Inventory — Spare Parts System" },
      { property: "og:description", content: "Current stock by HS code and full stock in/out ledger." },
    ],
  }),
  component: StockPage,
});

const LOW = 5;
type Health = "healthy" | "low" | "out";
const health = (a: number): Health => (a <= 0 ? "out" : a <= LOW ? "low" : "healthy");

function StockPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | Health>("all");
  const [hs, setHs] = useState("");
  const [dir, setDir] = useState<"all" | "in" | "out">("all");
  const [df, setDf] = useState<{ preset: DatePreset; from: string; to: string }>({ preset: "all", from: "", to: "" });
  const codes = useQuery({ queryKey: ["hs-code-options"], queryFn: async () => (await supabase.from("custom_hs_codes").select("hs_code,description").order("hs_code")).data ?? [] });
  const qc = useQueryClient();
  const stock = useQuery({
    queryKey: ["current-stock", search, hs],
    queryFn: async () => {
      let q = supabase.from("current_stock").select("*").order("hs_code");
      if (hs) q = q.eq("hs_code", hs);
      if (search) q = q.or(`hs_code.ilike.%${search}%,description.ilike.%${search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
  const ledger = useQuery({
    queryKey: ["stock-ledger", search, hs, dir, df],
    queryFn: async () => {
      let q = supabase.from("stock_movements").select("*").order("created_at", { ascending: false }).limit(300);
      if (hs) q = q.eq("hs_code", hs);
      if (dir !== "all") q = q.eq("direction", dir);
      const r = dateRange(df);
      if (r.from) q = q.gte("movement_date", r.from);
      if (r.to) q = q.lte("movement_date", r.to);
      if (search) q = q.or(`hs_code.ilike.%${search}%,description.ilike.%${search}%,reference_number.ilike.%${search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const all = stock.data ?? [];
  const counts = useMemo(() => {
    const c = { healthy: 0, low: 0, out: 0 };
    for (const s of all) c[health(Number(s.available ?? 0))]++;
    return c;
  }, [all]);
  const rows = filter === "all" ? all : all.filter((s) => health(Number(s.available ?? 0)) === filter);

  const chips: Array<{ k: Health; label: string; icon: typeof PackageCheck; tone: string }> = [
    { k: "healthy", label: "Healthy", icon: PackageCheck, tone: "text-success bg-success/12" },
    { k: "low", label: `Low (≤ ${LOW})`, icon: AlertTriangle, tone: "text-warning bg-warning/15" },
    { k: "out", label: "Out of stock", icon: PackageX, tone: "text-destructive bg-destructive/12" },
  ];

  return (
    <AppShell title="Inventory" description="Stock is calculated from all stock in and stock out entries">
      <div className="stagger mb-4 grid gap-3 sm:grid-cols-3">
        {chips.map((c) => (
          <button key={c.k} onClick={() => setFilter(filter === c.k ? "all" : c.k)}
            className={cn("panel lift flex items-center gap-3 p-4 text-left", filter === c.k && "ring-2 ring-primary")}>
            <span className={cn("flex size-10 items-center justify-center rounded-xl", c.tone)}><c.icon className="size-5" /></span>
            <div><p className="font-heading text-xl font-semibold leading-none">{counts[c.k]}</p><p className="mt-1 text-xs text-muted-foreground">{c.label}</p></div>
          </button>
        ))}
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Input list="hs-code-list" aria-label="HS code filter" className="h-8 w-56" placeholder="Filter by HS code (all)" value={hs} onChange={(e) => setHs(e.target.value.trim())} />
        <datalist id="hs-code-list">{(codes.data ?? []).map((c) => <option key={c.hs_code} value={c.hs_code}>{c.description}</option>)}</datalist>
        {hs ? <button className="text-xs text-muted-foreground underline" onClick={() => setHs("")}>Clear</button> : null}
      </div>
      <Tabs defaultValue="current">
        <TabsList><TabsTrigger value="current">Current stock</TabsTrigger><TabsTrigger value="ledger">Stock ledger</TabsTrigger></TabsList>
        <TabsContent value="current" className="panel overflow-hidden">
          <Toolbar search={search} onSearch={setSearch} placeholder="Search HS code or description…">
            <DataTools name="opening-stock" fields={openingStockFields}
              exportRows={async () => ((stock.data ?? []) as Array<Record<string, unknown>>).map((s) => ({ ...s, quantity: s["available"] }))}
              onImport={async (rows) => { const m = await importOpeningStock(rows); await qc.invalidateQueries(); return m; }} />
          </Toolbar>
          <Table>
            <TableHeader><TableRow><TableHead>HS code</TableHead><TableHead>Product</TableHead><TableHead className="text-right">Stock in</TableHead><TableHead className="text-right">Stock out</TableHead><TableHead className="text-right">Current</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>
              <TableState cols={6} loading={stock.isLoading} error={stock.error ? (stock.error as Error).message : null} empty={!stock.isLoading && rows.length === 0} title="No stock to show" hint="Verify a purchase to add stock." />
              {rows.map((s, i) => {
                const a = Math.max(0, Number(s.available ?? 0));
                return (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-xs font-semibold">{s.hs_code}</TableCell><TableCell className="max-w-sm truncate">{s.description}</TableCell>
                    <TableCell className="text-right tabular-nums text-success">{s.total_in}</TableCell><TableCell className="text-right tabular-nums text-info">{s.total_out}</TableCell>
                    <TableCell className="text-right font-heading text-base font-semibold tabular-nums">{a}</TableCell>
                    <TableCell><StatusBadge status={health(a)} /></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TabsContent>
        <TabsContent value="ledger" className="panel overflow-hidden">
          <Toolbar search={search} onSearch={setSearch} placeholder="Search HS code, description or reference…">
            <div className="flex rounded-lg border border-border bg-muted/40 p-0.5">{(["all", "in", "out"] as const).map((d) => <button key={d} onClick={() => setDir(d)} className={cn("rounded-md px-3 py-1 text-xs font-medium", dir === d ? "bg-card shadow-sm" : "text-muted-foreground")}>{d === "all" ? "All" : d === "in" ? "Stock in" : "Stock out"}</button>)}</div>
            <DateFilter value={df} onChange={setDf} />
          </Toolbar>
          <Table>
            <TableHeader><TableRow><TableHead>Entry</TableHead><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>HS code</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Available before</TableHead><TableHead>Reference</TableHead></TableRow></TableHeader>
            <TableBody>
              <TableState cols={8} loading={ledger.isLoading} empty={!ledger.isLoading && (ledger.data ?? []).length === 0} title="No movements yet" />
              {(ledger.data ?? []).map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-mono text-xs">{m.movement_number}</TableCell><TableCell>{m.movement_date}</TableCell>
                  <TableCell>
                    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold", m.direction === "in" ? "bg-success/12 text-success" : "bg-info/12 text-info")}>
                      {m.direction === "in" ? <ArrowDownLeft className="size-3" /> : <ArrowUpRight className="size-3" />}{m.direction === "in" ? "Stock in" : "Stock out"}
                    </span>
                    {Number(m.shortfall) > 0 ? <span className="ml-1 rounded-full bg-warning/15 px-2 py-0.5 text-[11px] font-semibold text-warning-foreground dark:text-warning">short {m.shortfall}</span> : null}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{m.hs_code}</TableCell><TableCell className="max-w-xs truncate">{m.description}</TableCell>
                  <TableCell className="text-right tabular-nums">{m.quantity} {m.uom}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">{m.available_before ?? "—"}</TableCell>
                  <TableCell>{m.reference_number}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
