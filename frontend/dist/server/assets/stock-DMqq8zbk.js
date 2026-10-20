import { a as db, r as cn } from "./bilal-logo.asset-BEz_DQLU.js";
import { t as AppShell } from "./AppShell-DTDjlCau.js";
import { a as TableHeader, i as TableHead, n as TableBody, o as TableRow, r as TableCell, t as Table } from "./table-BISuKeg0.js";
import { t as DataTools } from "./DataTools-C5II5dxL.js";
import { r as importOpeningStock, s as openingStockFields } from "./doc-import-BTxB3kp8.js";
import { t as Input } from "./input-CdXJHMPP.js";
import { i as StatusBadge, o as TableState, s as Toolbar } from "./kit-gGcW_pA6.js";
import { i as dateRange, t as DateFilter } from "./DocFilters-Bv4LkwoI.js";
import { i as TabsTrigger, n as TabsContent, r as TabsList, t as Tabs } from "./tabs-CEhDg_0f.js";
import { useMemo, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowDownLeft, ArrowUpRight, PackageCheck, PackageX } from "lucide-react";
//#region src/routes/_authenticated/stock.tsx?tsr-split=component
var LOW = 5;
var health = (a) => a <= 0 ? "out" : a <= LOW ? "low" : "healthy";
function StockPage() {
	const [search, setSearch] = useState("");
	const [filter, setFilter] = useState("all");
	const [hs, setHs] = useState("");
	const [dir, setDir] = useState("all");
	const [df, setDf] = useState({
		preset: "all",
		from: "",
		to: ""
	});
	const codes = useQuery({
		queryKey: ["hs-code-options"],
		queryFn: async () => (await db.from("custom_hs_codes").select("hs_code,description").order("hs_code")).data ?? []
	});
	const qc = useQueryClient();
	const stock = useQuery({
		queryKey: [
			"current-stock",
			search,
			hs
		],
		queryFn: async () => {
			let q = db.from("current_stock").select("*").order("hs_code");
			if (hs) q = q.eq("hs_code", hs);
			if (search) q = q.or(`hs_code.ilike.%${search}%,description.ilike.%${search}%`);
			const { data, error } = await q;
			if (error) throw error;
			return data ?? [];
		}
	});
	const ledger = useQuery({
		queryKey: [
			"stock-ledger",
			search,
			hs,
			dir,
			df
		],
		queryFn: async () => {
			let q = db.from("stock_movements").select("*").order("created_at", { ascending: false }).limit(300);
			if (hs) q = q.eq("hs_code", hs);
			if (dir !== "all") q = q.eq("direction", dir);
			const r = dateRange(df);
			if (r.from) q = q.gte("movement_date", r.from);
			if (r.to) q = q.lte("movement_date", r.to);
			if (search) q = q.or(`hs_code.ilike.%${search}%,description.ilike.%${search}%,reference_number.ilike.%${search}%`);
			const { data, error } = await q;
			if (error) throw error;
			return data ?? [];
		}
	});
	const all = stock.data ?? [];
	const counts = useMemo(() => {
		const c = {
			healthy: 0,
			low: 0,
			out: 0
		};
		for (const s of all) c[health(Number(s.available ?? 0))]++;
		return c;
	}, [all]);
	const rows = filter === "all" ? all : all.filter((s) => health(Number(s.available ?? 0)) === filter);
	return /* @__PURE__ */ jsxs(AppShell, {
		title: "Inventory",
		description: "Stock is calculated from all stock in and stock out entries",
		children: [
			/* @__PURE__ */ jsx("div", {
				className: "stagger mb-4 grid gap-3 sm:grid-cols-3",
				children: [
					{
						k: "healthy",
						label: "Healthy",
						icon: PackageCheck,
						tone: "text-success bg-success/12"
					},
					{
						k: "low",
						label: `Low (≤ ${LOW})`,
						icon: AlertTriangle,
						tone: "text-warning bg-warning/15"
					},
					{
						k: "out",
						label: "Out of stock",
						icon: PackageX,
						tone: "text-destructive bg-destructive/12"
					}
				].map((c) => /* @__PURE__ */ jsxs("button", {
					onClick: () => setFilter(filter === c.k ? "all" : c.k),
					className: cn("panel lift flex items-center gap-3 p-4 text-left", filter === c.k && "ring-2 ring-primary"),
					children: [/* @__PURE__ */ jsx("span", {
						className: cn("flex size-10 items-center justify-center rounded-xl", c.tone),
						children: /* @__PURE__ */ jsx(c.icon, { className: "size-5" })
					}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
						className: "font-heading text-xl font-semibold leading-none",
						children: counts[c.k]
					}), /* @__PURE__ */ jsx("p", {
						className: "mt-1 text-xs text-muted-foreground",
						children: c.label
					})] })]
				}, c.k))
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "mb-3 flex flex-wrap items-center gap-2",
				children: [
					/* @__PURE__ */ jsx(Input, {
						list: "hs-code-list",
						"aria-label": "HS code filter",
						className: "h-8 w-56",
						placeholder: "Filter by HS code (all)",
						value: hs,
						onChange: (e) => setHs(e.target.value.trim())
					}),
					/* @__PURE__ */ jsx("datalist", {
						id: "hs-code-list",
						children: (codes.data ?? []).map((c) => /* @__PURE__ */ jsx("option", {
							value: c.hs_code,
							children: c.description
						}, c.hs_code))
					}),
					hs ? /* @__PURE__ */ jsx("button", {
						className: "text-xs text-muted-foreground underline",
						onClick: () => setHs(""),
						children: "Clear"
					}) : null
				]
			}),
			/* @__PURE__ */ jsxs(Tabs, {
				defaultValue: "current",
				children: [
					/* @__PURE__ */ jsxs(TabsList, { children: [/* @__PURE__ */ jsx(TabsTrigger, {
						value: "current",
						children: "Current stock"
					}), /* @__PURE__ */ jsx(TabsTrigger, {
						value: "ledger",
						children: "Stock ledger"
					})] }),
					/* @__PURE__ */ jsxs(TabsContent, {
						value: "current",
						className: "panel overflow-hidden",
						children: [/* @__PURE__ */ jsx(Toolbar, {
							search,
							onSearch: setSearch,
							placeholder: "Search HS code or description…",
							children: /* @__PURE__ */ jsx(DataTools, {
								name: "opening-stock",
								fields: openingStockFields,
								exportRows: async () => (stock.data ?? []).map((s) => ({
									...s,
									quantity: s["available"]
								})),
								onImport: async (rows) => {
									const m = await importOpeningStock(rows);
									await qc.invalidateQueries();
									return m;
								}
							})
						}), /* @__PURE__ */ jsxs(Table, { children: [/* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
							/* @__PURE__ */ jsx(TableHead, { children: "HS code" }),
							/* @__PURE__ */ jsx(TableHead, { children: "Product" }),
							/* @__PURE__ */ jsx(TableHead, {
								className: "text-right",
								children: "Stock in"
							}),
							/* @__PURE__ */ jsx(TableHead, {
								className: "text-right",
								children: "Stock out"
							}),
							/* @__PURE__ */ jsx(TableHead, {
								className: "text-right",
								children: "Current"
							}),
							/* @__PURE__ */ jsx(TableHead, { children: "Status" })
						] }) }), /* @__PURE__ */ jsxs(TableBody, { children: [/* @__PURE__ */ jsx(TableState, {
							cols: 6,
							loading: stock.isLoading,
							error: stock.error ? stock.error.message : null,
							empty: !stock.isLoading && rows.length === 0,
							title: "No stock to show",
							hint: "Verify a purchase to add stock."
						}), rows.map((s, i) => {
							const a = Math.max(0, Number(s.available ?? 0));
							return /* @__PURE__ */ jsxs(TableRow, { children: [
								/* @__PURE__ */ jsx(TableCell, {
									className: "font-mono text-xs font-semibold",
									children: s.hs_code
								}),
								/* @__PURE__ */ jsx(TableCell, {
									className: "max-w-sm truncate",
									children: s.description
								}),
								/* @__PURE__ */ jsx(TableCell, {
									className: "text-right tabular-nums text-success",
									children: s.total_in
								}),
								/* @__PURE__ */ jsx(TableCell, {
									className: "text-right tabular-nums text-info",
									children: s.total_out
								}),
								/* @__PURE__ */ jsx(TableCell, {
									className: "text-right font-heading text-base font-semibold tabular-nums",
									children: a
								}),
								/* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx(StatusBadge, { status: health(a) }) })
							] }, i);
						})] })] })]
					}),
					/* @__PURE__ */ jsxs(TabsContent, {
						value: "ledger",
						className: "panel overflow-hidden",
						children: [/* @__PURE__ */ jsxs(Toolbar, {
							search,
							onSearch: setSearch,
							placeholder: "Search HS code, description or reference…",
							children: [/* @__PURE__ */ jsx("div", {
								className: "flex rounded-lg border border-border bg-muted/40 p-0.5",
								children: [
									"all",
									"in",
									"out"
								].map((d) => /* @__PURE__ */ jsx("button", {
									onClick: () => setDir(d),
									className: cn("rounded-md px-3 py-1 text-xs font-medium", dir === d ? "bg-card shadow-sm" : "text-muted-foreground"),
									children: d === "all" ? "All" : d === "in" ? "Stock in" : "Stock out"
								}, d))
							}), /* @__PURE__ */ jsx(DateFilter, {
								value: df,
								onChange: setDf
							})]
						}), /* @__PURE__ */ jsxs(Table, { children: [/* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
							/* @__PURE__ */ jsx(TableHead, { children: "Entry" }),
							/* @__PURE__ */ jsx(TableHead, { children: "Date" }),
							/* @__PURE__ */ jsx(TableHead, { children: "Type" }),
							/* @__PURE__ */ jsx(TableHead, { children: "HS code" }),
							/* @__PURE__ */ jsx(TableHead, { children: "Description" }),
							/* @__PURE__ */ jsx(TableHead, {
								className: "text-right",
								children: "Qty"
							}),
							/* @__PURE__ */ jsx(TableHead, {
								className: "text-right",
								children: "Available before"
							}),
							/* @__PURE__ */ jsx(TableHead, { children: "Reference" })
						] }) }), /* @__PURE__ */ jsxs(TableBody, { children: [/* @__PURE__ */ jsx(TableState, {
							cols: 8,
							loading: ledger.isLoading,
							empty: !ledger.isLoading && (ledger.data ?? []).length === 0,
							title: "No movements yet"
						}), (ledger.data ?? []).map((m) => /* @__PURE__ */ jsxs(TableRow, { children: [
							/* @__PURE__ */ jsx(TableCell, {
								className: "font-mono text-xs",
								children: m.movement_number
							}),
							/* @__PURE__ */ jsx(TableCell, { children: m.movement_date }),
							/* @__PURE__ */ jsxs(TableCell, { children: [/* @__PURE__ */ jsxs("span", {
								className: cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold", m.direction === "in" ? "bg-success/12 text-success" : "bg-info/12 text-info"),
								children: [m.direction === "in" ? /* @__PURE__ */ jsx(ArrowDownLeft, { className: "size-3" }) : /* @__PURE__ */ jsx(ArrowUpRight, { className: "size-3" }), m.direction === "in" ? "Stock in" : "Stock out"]
							}), Number(m.shortfall) > 0 ? /* @__PURE__ */ jsxs("span", {
								className: "ml-1 rounded-full bg-warning/15 px-2 py-0.5 text-[11px] font-semibold text-warning-foreground dark:text-warning",
								children: ["short ", m.shortfall]
							}) : null] }),
							/* @__PURE__ */ jsx(TableCell, {
								className: "font-mono text-xs",
								children: m.hs_code
							}),
							/* @__PURE__ */ jsx(TableCell, {
								className: "max-w-xs truncate",
								children: m.description
							}),
							/* @__PURE__ */ jsxs(TableCell, {
								className: "text-right tabular-nums",
								children: [
									m.quantity,
									" ",
									m.uom
								]
							}),
							/* @__PURE__ */ jsx(TableCell, {
								className: "text-right tabular-nums text-muted-foreground",
								children: m.available_before ?? "—"
							}),
							/* @__PURE__ */ jsx(TableCell, { children: m.reference_number })
						] }, m.id))] })] })]
					})
				]
			})
		]
	});
}
//#endregion
export { StockPage as component };
