import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Boxes,
  ClipboardCheck,
  FileSpreadsheet,
  FileText,
  PackageCheck,
  PackageMinus,
  PackageX,
  Plus,
  Receipt,
  ShoppingCart,
  BarChart3,
  type LucideIcon,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { db } from "@/lib/db";
import { AppShell } from "@/components/layout/AppShell";
import { formatNumber } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Spare Parts System" },
      { name: "description", content: "Live overview of stock, purchases, quotations, approvals and invoices." },
      { property: "og:title", content: "Dashboard — Spare Parts System" },
      { property: "og:description", content: "Live overview of stock, purchases, quotations, approvals and invoices." },
    ],
  }),
  component: Dashboard,
});

const LOW_STOCK = 5;
const RANGES = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
] as const;

const iso = (d: Date) => d.toISOString().slice(0, 10);

function Dashboard() {
  const [days, setDays] = useState<number>(30);

  const { data: summary, isLoading } = useQuery({
    queryKey: ["dash-summary-v3"],
    queryFn: async () => {
      const count = async (table: string, filter?: [string, string]) => {
        let q = db.from(table as never).select("id", { count: "exact", head: true });
        if (filter) q = q.eq(filter[0] as never, filter[1] as never);
        const { count: c } = await q;
        return c ?? 0;
      };
      const [fbr, custom, purchases, quotations, pending, invoices, stockRes] = await Promise.all([
        count("fbr_hs_codes"),
        count("custom_hs_codes"),
        count("purchases"),
        count("quotations"),
        count("quotations", ["status", "submitted"]),
        count("invoices"),
        db.from("current_stock").select("*"),
      ]);
      const stock = stockRes.data ?? [];
      let totalIn = 0, totalOut = 0, available = 0, low = 0, out = 0;
      for (const s of stock) {
        totalIn += Number(s.total_in ?? 0);
        totalOut += Number(s.total_out ?? 0);
        const a = Math.max(0, Number(s.available ?? 0));
        available += a;
        if (a <= 0) out += 1;
        else if (a <= LOW_STOCK) low += 1;
      }
      return { products: fbr + custom, purchases, quotations, pending, invoices, totalIn, totalOut, available, low, out, items: stock.length };
    },
  });

  const { data: series, isLoading: seriesLoading } = useQuery({
    queryKey: ["dash-series-v3", days],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - (days - 1));
      const from = iso(since);
      const [mv, pu, qu, inv] = await Promise.all([
        db.from("stock_movements").select("movement_date, direction, quantity").gte("movement_date", from),
        db.from("purchases").select("purchase_date").gte("purchase_date", from),
        db.from("quotations").select("quotation_date, status").gte("quotation_date", from),
        db.from("invoices").select("invoice_date").gte("invoice_date", from),
      ]);
      const buckets = new Map<string, { date: string; in: number; out: number; purchases: number; quotations: number; approved: number; invoices: number }>();
      for (let i = 0; i < days; i++) {
        const d = new Date(since);
        d.setDate(since.getDate() + i);
        const k = iso(d);
        buckets.set(k, { date: k, in: 0, out: 0, purchases: 0, quotations: 0, approved: 0, invoices: 0 });
      }
      const day = (v: string) => buckets.get(String(v).slice(0, 10));
      for (const m of mv.data ?? []) {
        const b = day(m.movement_date);
        if (b) b[m.direction === "in" ? "in" : "out"] += Number(m.quantity);
      }
      for (const p of pu.data ?? []) { const b = day(p.purchase_date); if (b) b.purchases++; }
      for (const q of qu.data ?? []) {
        const b = day(q.quotation_date);
        if (b) { b.quotations++; if (q.status === "approved" || q.status === "invoiced") b.approved++; }
      }
      for (const i of inv.data ?? []) { const b = day(i.invoice_date); if (b) b.invoices++; }
      const rows = [...buckets.values()];
      // running net stock across the window
      let net = 0;
      const withNet = rows.map((r: any) => { net += r.in - r.out; return { ...r, label: r.date.slice(5), net: Math.max(0, net) }; });
      const hasStock = rows.some((r: any) => r.in || r.out);
      const hasTx = rows.some((r: any) => r.purchases || r.quotations || r.invoices);
      return { rows: withNet, hasStock, hasTx };
    },
  });

  const s = summary;
  const cards: { label: string; value: number; hint: string; icon: LucideIcon; tone: string; to: string }[] = [
    { label: "Products (HS codes)", value: s?.products ?? 0, hint: "FBR + custom list", icon: FileSpreadsheet, tone: "stat-orange", to: "/fbr-hs-codes" },
    { label: "Available stock", value: s?.available ?? 0, hint: `${formatNumber(s?.items ?? 0)} items tracked`, icon: Boxes, tone: "stat-blue", to: "/stock" },
    { label: "Purchases", value: s?.purchases ?? 0, hint: "All purchase orders", icon: ShoppingCart, tone: "stat-teal", to: "/purchases" },
    { label: "Quotations", value: s?.quotations ?? 0, hint: "All quotations", icon: FileText, tone: "stat-green", to: "/quotations" },
    { label: "Pending approvals", value: s?.pending ?? 0, hint: "Waiting for a decision", icon: ClipboardCheck, tone: "stat-amber", to: "/quotations" },
    { label: "Invoices", value: s?.invoices ?? 0, hint: "Created from approvals", icon: Receipt, tone: "stat-orange", to: "/invoices" },
  ];
  const stockCards: { label: string; value: number; icon: LucideIcon; color: string }[] = [
    { label: "Stock in", value: s?.totalIn ?? 0, icon: PackageCheck, color: "text-success bg-success/12" },
    { label: "Stock out", value: s?.totalOut ?? 0, icon: PackageMinus, color: "text-info bg-info/12" },
    { label: "Low stock", value: s?.low ?? 0, icon: AlertTriangle, color: "text-warning bg-warning/15" },
    { label: "Out of stock", value: s?.out ?? 0, icon: PackageX, color: "text-destructive bg-destructive/12" },
  ];

  return (
    <AppShell
      title="Dashboard"
      actions={
        <div className="hidden gap-2 lg:flex">
          <Button asChild size="sm" variant="outline">
            <Link to="/purchases"><Plus className="size-4" /> Purchase</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/quotations"><Plus className="size-4" /> Quotation</Link>
          </Button>
        </div>
      }
    >
      <div className="mb-6">
        <h2 className="font-heading text-2xl font-semibold tracking-tight">Business at a glance</h2>
        <p className="text-sm text-muted-foreground">Live figures from your purchases, quotations, invoices and stock.</p>
      </div>

      {/* Gradient stat cards */}
      <div className="stagger grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {cards.map((c) => (
          <Link key={c.label} to={c.to} className={cn("lift group relative overflow-hidden rounded-xl p-4 shadow-sm", c.tone)}>
            <div className="absolute -right-5 -top-5 size-20 rounded-full bg-current opacity-10 transition-transform duration-300 group-hover:scale-125" />
            <div className="flex items-center justify-between">
              <span className="flex size-8 items-center justify-center rounded-lg bg-current/15">
                <c.icon className="size-4" />
              </span>
              <ArrowUpRight className="size-4 opacity-0 transition-opacity group-hover:opacity-80" />
            </div>
            {isLoading ? (
              <div className="mt-3 h-7 w-14 animate-pulse rounded bg-current/20" />
            ) : (
              <p className="mt-3 font-heading text-2xl font-semibold leading-none">{formatNumber(c.value)}</p>
            )}
            <p className="mt-1.5 text-xs font-medium opacity-95">{c.label}</p>
            <p className="text-[11px] opacity-75">{c.hint}</p>
          </Link>
        ))}
      </div>

      {/* Stock health strip */}
      <div className="stagger mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stockCards.map((c) => (
          <div key={c.label} className="panel lift flex items-center gap-3 p-4">
            <span className={cn("flex size-10 items-center justify-center rounded-xl", c.color)}>
              <c.icon className="size-5" />
            </span>
            <div>
              {isLoading ? <Skeleton className="h-6 w-12" /> : (
                <p className="font-heading text-xl font-semibold leading-none">{formatNumber(c.value)}</p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="mt-6 flex items-center justify-between">
        <h3 className="font-heading text-lg font-semibold">Reports</h3>
        <div className="flex rounded-lg border border-border bg-card p-0.5 shadow-sm">
          {RANGES.map((r: any) => (
            <button
              key={r.label}
              onClick={() => setDays(r.days)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                days === r.days ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 grid gap-4 xl:grid-cols-2">
        <ChartPanel
          title="Inventory overview"
          subtitle="Stock in, stock out and running stock"
          loading={seriesLoading}
          empty={!series?.hasStock}
          emptyText="Verify a purchase to see stock movement here."
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series?.rows ?? []} margin={{ left: -16, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="gIn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gNet" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} minTickGap={18} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="net" name="Current stock" stroke="var(--chart-1)" fill="url(#gNet)" strokeWidth={2} />
              <Area type="monotone" dataKey="in" name="Stock in" stroke="var(--chart-2)" fill="url(#gIn)" strokeWidth={2} />
              <Area type="monotone" dataKey="out" name="Stock out" stroke="var(--chart-3)" fill="transparent" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel
          title="Transaction overview"
          subtitle="Purchases, quotations, approvals and invoices"
          loading={seriesLoading}
          empty={!series?.hasTx}
          emptyText="Create a purchase or quotation to see activity here."
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series?.rows ?? []} margin={{ left: -16, right: 8, top: 8 }} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} minTickGap={18} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="purchases" name="Purchases" fill="var(--chart-3)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="quotations" name="Quotations" fill="var(--chart-4)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="approved" name="Approved" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="invoices" name="Invoices" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
      </div>

      <RecentMovements />
    </AppShell>
  );
}

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  color: "var(--popover-foreground)",
  fontSize: 12,
};

function ChartPanel({
  title, subtitle, loading, empty, emptyText, children,
}: { title: string; subtitle: string; loading: boolean; empty: boolean; emptyText: string; children: React.ReactNode }) {
  return (
    <div className="panel p-5">
      <p className="font-heading text-sm font-semibold">{title}</p>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
      <div className="mt-4 h-64">
        {loading ? (
          <Skeleton className="size-full rounded-lg" />
        ) : empty ? (
          <div className="flex size-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 text-center">
            <span className="flex size-10 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <BarChart3 className="size-5" />
            </span>
            <p className="text-sm font-medium">No data in this period</p>
            <p className="max-w-xs text-xs text-muted-foreground">{emptyText}</p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

function RecentMovements() {
  const { data, isLoading } = useQuery({
    queryKey: ["dash-recent-moves"],
    queryFn: async () => {
      const { data } = await db
        .from("stock_movements")
        .select("id, movement_number, movement_date, direction, hs_code, description, quantity, shortfall")
        .order("created_at", { ascending: false })
        .limit(6);
      return data ?? [];
    },
  });
  const rows = useMemo(() => data ?? [], [data]);
  return (
    <div className="panel mt-4 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4">
        <div>
          <p className="font-heading text-sm font-semibold">Latest stock movements</p>
          <p className="text-xs text-muted-foreground">Automatic entries from purchases and invoices</p>
        </div>
        <Button asChild variant="ghost" size="sm"><Link to="/stock">View all</Link></Button>
      </div>
      {isLoading ? (
        <div className="space-y-2 px-5 pb-5">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-10" />)}</div>
      ) : rows.length === 0 ? (
        <p className="px-5 pb-8 pt-2 text-center text-sm text-muted-foreground">No stock movements yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-y border-border bg-muted/50 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr><th className="px-5 py-2.5 font-semibold">Entry</th><th className="px-5 py-2.5 font-semibold">Item</th><th className="px-5 py-2.5 font-semibold">Type</th><th className="px-5 py-2.5 text-right font-semibold">Qty</th></tr>
            </thead>
            <tbody>
              {rows.map((m: any) => (
                <tr key={m.id} className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/40">
                  <td className="px-5 py-3"><p className="font-medium">{m.movement_number}</p><p className="text-xs text-muted-foreground">{m.movement_date}</p></td>
                  <td className="px-5 py-3"><p className="font-mono text-xs">{m.hs_code}</p><p className="max-w-xs truncate text-xs text-muted-foreground">{m.description}</p></td>
                  <td className="px-5 py-3">
                    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold", m.direction === "in" ? "bg-success/12 text-success" : "bg-info/12 text-info")}>
                      {m.direction === "in" ? <ArrowDownLeft className="size-3" /> : <ArrowUpRight className="size-3" />}
                      {m.direction === "in" ? "Stock in" : "Stock out"}
                    </span>
                    {Number(m.shortfall) > 0 ? <span className="ml-1 rounded-full bg-warning/15 px-2 py-0.5 text-[11px] font-semibold text-warning">short {formatNumber(Number(m.shortfall))}</span> : null}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold tabular-nums">{formatNumber(Number(m.quantity))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
