import { a as db, n as Button, r as cn } from "./bilal-logo.asset-BEz_DQLU.js";
import { t as AppShell } from "./AppShell-DTDjlCau.js";
import { t as Skeleton } from "./skeleton-O8RfA9y_.js";
import { r as formatNumber } from "./format-DPwQXC9y.js";
import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowDownLeft, ArrowUpRight, BarChart3, Boxes, ClipboardCheck, FileSpreadsheet, FileText, PackageCheck, PackageMinus, PackageX, Plus, Receipt, ShoppingCart } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
//#region src/routes/_authenticated/dashboard.tsx?tsr-split=component
var LOW_STOCK = 5;
var RANGES = [
	{
		label: "7D",
		days: 7
	},
	{
		label: "30D",
		days: 30
	},
	{
		label: "90D",
		days: 90
	}
];
var iso = (d) => d.toISOString().slice(0, 10);
function Dashboard() {
	const [days, setDays] = useState(30);
	const { data: summary, isLoading } = useQuery({
		queryKey: ["dash-summary-v3"],
		queryFn: async () => {
			const count = async (table, filter) => {
				let q = db.from(table).select("id", {
					count: "exact",
					head: true
				});
				if (filter) q = q.eq(filter[0], filter[1]);
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
				db.from("current_stock").select("*")
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
			return {
				products: fbr + custom,
				purchases,
				quotations,
				pending,
				invoices,
				totalIn,
				totalOut,
				available,
				low,
				out,
				items: stock.length
			};
		}
	});
	const { data: series, isLoading: seriesLoading } = useQuery({
		queryKey: ["dash-series-v3", days],
		queryFn: async () => {
			const since = /* @__PURE__ */ new Date();
			since.setDate(since.getDate() - (days - 1));
			const from = iso(since);
			const [mv, pu, qu, inv] = await Promise.all([
				db.from("stock_movements").select("movement_date, direction, quantity").gte("movement_date", from),
				db.from("purchases").select("purchase_date").gte("purchase_date", from),
				db.from("quotations").select("quotation_date, status").gte("quotation_date", from),
				db.from("invoices").select("invoice_date").gte("invoice_date", from)
			]);
			const buckets = /* @__PURE__ */ new Map();
			for (let i = 0; i < days; i++) {
				const d = new Date(since);
				d.setDate(since.getDate() + i);
				const k = iso(d);
				buckets.set(k, {
					date: k,
					in: 0,
					out: 0,
					purchases: 0,
					quotations: 0,
					approved: 0,
					invoices: 0
				});
			}
			const day = (v) => buckets.get(String(v).slice(0, 10));
			for (const m of mv.data ?? []) {
				const b = day(m.movement_date);
				if (b) b[m.direction === "in" ? "in" : "out"] += Number(m.quantity);
			}
			for (const p of pu.data ?? []) {
				const b = day(p.purchase_date);
				if (b) b.purchases++;
			}
			for (const q of qu.data ?? []) {
				const b = day(q.quotation_date);
				if (b) {
					b.quotations++;
					if (q.status === "approved" || q.status === "invoiced") b.approved++;
				}
			}
			for (const i of inv.data ?? []) {
				const b = day(i.invoice_date);
				if (b) b.invoices++;
			}
			const rows = [...buckets.values()];
			let net = 0;
			return {
				rows: rows.map((r) => {
					net += r.in - r.out;
					return {
						...r,
						label: r.date.slice(5),
						net: Math.max(0, net)
					};
				}),
				hasStock: rows.some((r) => r.in || r.out),
				hasTx: rows.some((r) => r.purchases || r.quotations || r.invoices)
			};
		}
	});
	const s = summary;
	const cards = [
		{
			label: "Products (HS codes)",
			value: s?.products ?? 0,
			hint: "FBR + custom list",
			icon: FileSpreadsheet,
			tone: "stat-orange",
			to: "/fbr-hs-codes"
		},
		{
			label: "Available stock",
			value: s?.available ?? 0,
			hint: `${formatNumber(s?.items ?? 0)} items tracked`,
			icon: Boxes,
			tone: "stat-blue",
			to: "/stock"
		},
		{
			label: "Purchases",
			value: s?.purchases ?? 0,
			hint: "All purchase orders",
			icon: ShoppingCart,
			tone: "stat-teal",
			to: "/purchases"
		},
		{
			label: "Quotations",
			value: s?.quotations ?? 0,
			hint: "All quotations",
			icon: FileText,
			tone: "stat-green",
			to: "/quotations"
		},
		{
			label: "Pending approvals",
			value: s?.pending ?? 0,
			hint: "Waiting for a decision",
			icon: ClipboardCheck,
			tone: "stat-amber",
			to: "/quotations"
		},
		{
			label: "Invoices",
			value: s?.invoices ?? 0,
			hint: "Created from approvals",
			icon: Receipt,
			tone: "stat-orange",
			to: "/invoices"
		}
	];
	const stockCards = [
		{
			label: "Stock in",
			value: s?.totalIn ?? 0,
			icon: PackageCheck,
			color: "text-success bg-success/12"
		},
		{
			label: "Stock out",
			value: s?.totalOut ?? 0,
			icon: PackageMinus,
			color: "text-info bg-info/12"
		},
		{
			label: "Low stock",
			value: s?.low ?? 0,
			icon: AlertTriangle,
			color: "text-warning bg-warning/15"
		},
		{
			label: "Out of stock",
			value: s?.out ?? 0,
			icon: PackageX,
			color: "text-destructive bg-destructive/12"
		}
	];
	return /* @__PURE__ */ jsxs(AppShell, {
		title: "Dashboard",
		actions: /* @__PURE__ */ jsxs("div", {
			className: "hidden gap-2 lg:flex",
			children: [/* @__PURE__ */ jsx(Button, {
				asChild: true,
				size: "sm",
				variant: "outline",
				children: /* @__PURE__ */ jsxs(Link, {
					to: "/purchases",
					children: [/* @__PURE__ */ jsx(Plus, { className: "size-4" }), " Purchase"]
				})
			}), /* @__PURE__ */ jsx(Button, {
				asChild: true,
				size: "sm",
				children: /* @__PURE__ */ jsxs(Link, {
					to: "/quotations",
					children: [/* @__PURE__ */ jsx(Plus, { className: "size-4" }), " Quotation"]
				})
			})]
		}),
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "mb-6",
				children: [/* @__PURE__ */ jsx("h2", {
					className: "font-heading text-2xl font-semibold tracking-tight",
					children: "Business at a glance"
				}), /* @__PURE__ */ jsx("p", {
					className: "text-sm text-muted-foreground",
					children: "Live figures from your purchases, quotations, invoices and stock."
				})]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "stagger grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6",
				children: cards.map((c) => /* @__PURE__ */ jsxs(Link, {
					to: c.to,
					className: cn("lift group relative overflow-hidden rounded-xl p-4 shadow-sm", c.tone),
					children: [
						/* @__PURE__ */ jsx("div", { className: "absolute -right-5 -top-5 size-20 rounded-full bg-current opacity-10 transition-transform duration-300 group-hover:scale-125" }),
						/* @__PURE__ */ jsxs("div", {
							className: "flex items-center justify-between",
							children: [/* @__PURE__ */ jsx("span", {
								className: "flex size-8 items-center justify-center rounded-lg bg-current/15",
								children: /* @__PURE__ */ jsx(c.icon, { className: "size-4" })
							}), /* @__PURE__ */ jsx(ArrowUpRight, { className: "size-4 opacity-0 transition-opacity group-hover:opacity-80" })]
						}),
						isLoading ? /* @__PURE__ */ jsx("div", { className: "mt-3 h-7 w-14 animate-pulse rounded bg-current/20" }) : /* @__PURE__ */ jsx("p", {
							className: "mt-3 font-heading text-2xl font-semibold leading-none",
							children: formatNumber(c.value)
						}),
						/* @__PURE__ */ jsx("p", {
							className: "mt-1.5 text-xs font-medium opacity-95",
							children: c.label
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-[11px] opacity-75",
							children: c.hint
						})
					]
				}, c.label))
			}),
			/* @__PURE__ */ jsx("div", {
				className: "stagger mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4",
				children: stockCards.map((c) => /* @__PURE__ */ jsxs("div", {
					className: "panel lift flex items-center gap-3 p-4",
					children: [/* @__PURE__ */ jsx("span", {
						className: cn("flex size-10 items-center justify-center rounded-xl", c.color),
						children: /* @__PURE__ */ jsx(c.icon, { className: "size-5" })
					}), /* @__PURE__ */ jsxs("div", { children: [isLoading ? /* @__PURE__ */ jsx(Skeleton, { className: "h-6 w-12" }) : /* @__PURE__ */ jsx("p", {
						className: "font-heading text-xl font-semibold leading-none",
						children: formatNumber(c.value)
					}), /* @__PURE__ */ jsx("p", {
						className: "mt-1 text-xs text-muted-foreground",
						children: c.label
					})] })]
				}, c.label))
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "mt-6 flex items-center justify-between",
				children: [/* @__PURE__ */ jsx("h3", {
					className: "font-heading text-lg font-semibold",
					children: "Reports"
				}), /* @__PURE__ */ jsx("div", {
					className: "flex rounded-lg border border-border bg-card p-0.5 shadow-sm",
					children: RANGES.map((r) => /* @__PURE__ */ jsx("button", {
						onClick: () => setDays(r.days),
						className: cn("rounded-md px-3 py-1 text-xs font-medium transition-colors", days === r.days ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"),
						children: r.label
					}, r.label))
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "mt-3 grid gap-4 xl:grid-cols-2",
				children: [/* @__PURE__ */ jsx(ChartPanel, {
					title: "Inventory overview",
					subtitle: "Stock in, stock out and running stock",
					loading: seriesLoading,
					empty: !series?.hasStock,
					emptyText: "Verify a purchase to see stock movement here.",
					children: /* @__PURE__ */ jsx(ResponsiveContainer, {
						width: "100%",
						height: "100%",
						children: /* @__PURE__ */ jsxs(AreaChart, {
							data: series?.rows ?? [],
							margin: {
								left: -16,
								right: 8,
								top: 8
							},
							children: [
								/* @__PURE__ */ jsxs("defs", { children: [/* @__PURE__ */ jsxs("linearGradient", {
									id: "gIn",
									x1: "0",
									y1: "0",
									x2: "0",
									y2: "1",
									children: [/* @__PURE__ */ jsx("stop", {
										offset: "0%",
										stopColor: "var(--chart-2)",
										stopOpacity: .35
									}), /* @__PURE__ */ jsx("stop", {
										offset: "100%",
										stopColor: "var(--chart-2)",
										stopOpacity: 0
									})]
								}), /* @__PURE__ */ jsxs("linearGradient", {
									id: "gNet",
									x1: "0",
									y1: "0",
									x2: "0",
									y2: "1",
									children: [/* @__PURE__ */ jsx("stop", {
										offset: "0%",
										stopColor: "var(--chart-1)",
										stopOpacity: .35
									}), /* @__PURE__ */ jsx("stop", {
										offset: "100%",
										stopColor: "var(--chart-1)",
										stopOpacity: 0
									})]
								})] }),
								/* @__PURE__ */ jsx(CartesianGrid, {
									strokeDasharray: "3 3",
									stroke: "var(--border)",
									vertical: false
								}),
								/* @__PURE__ */ jsx(XAxis, {
									dataKey: "label",
									tick: {
										fontSize: 11,
										fill: "var(--muted-foreground)"
									},
									tickLine: false,
									axisLine: false,
									minTickGap: 18
								}),
								/* @__PURE__ */ jsx(YAxis, {
									tick: {
										fontSize: 11,
										fill: "var(--muted-foreground)"
									},
									tickLine: false,
									axisLine: false,
									allowDecimals: false
								}),
								/* @__PURE__ */ jsx(Tooltip, { contentStyle: tooltipStyle }),
								/* @__PURE__ */ jsx(Legend, {
									iconType: "circle",
									wrapperStyle: { fontSize: 12 }
								}),
								/* @__PURE__ */ jsx(Area, {
									type: "monotone",
									dataKey: "net",
									name: "Current stock",
									stroke: "var(--chart-1)",
									fill: "url(#gNet)",
									strokeWidth: 2
								}),
								/* @__PURE__ */ jsx(Area, {
									type: "monotone",
									dataKey: "in",
									name: "Stock in",
									stroke: "var(--chart-2)",
									fill: "url(#gIn)",
									strokeWidth: 2
								}),
								/* @__PURE__ */ jsx(Area, {
									type: "monotone",
									dataKey: "out",
									name: "Stock out",
									stroke: "var(--chart-3)",
									fill: "transparent",
									strokeWidth: 2
								})
							]
						})
					})
				}), /* @__PURE__ */ jsx(ChartPanel, {
					title: "Transaction overview",
					subtitle: "Purchases, quotations, approvals and invoices",
					loading: seriesLoading,
					empty: !series?.hasTx,
					emptyText: "Create a purchase or quotation to see activity here.",
					children: /* @__PURE__ */ jsx(ResponsiveContainer, {
						width: "100%",
						height: "100%",
						children: /* @__PURE__ */ jsxs(BarChart, {
							data: series?.rows ?? [],
							margin: {
								left: -16,
								right: 8,
								top: 8
							},
							barGap: 2,
							children: [
								/* @__PURE__ */ jsx(CartesianGrid, {
									strokeDasharray: "3 3",
									stroke: "var(--border)",
									vertical: false
								}),
								/* @__PURE__ */ jsx(XAxis, {
									dataKey: "label",
									tick: {
										fontSize: 11,
										fill: "var(--muted-foreground)"
									},
									tickLine: false,
									axisLine: false,
									minTickGap: 18
								}),
								/* @__PURE__ */ jsx(YAxis, {
									tick: {
										fontSize: 11,
										fill: "var(--muted-foreground)"
									},
									tickLine: false,
									axisLine: false,
									allowDecimals: false
								}),
								/* @__PURE__ */ jsx(Tooltip, {
									contentStyle: tooltipStyle,
									cursor: { fill: "var(--muted)" }
								}),
								/* @__PURE__ */ jsx(Legend, {
									iconType: "circle",
									wrapperStyle: { fontSize: 12 }
								}),
								/* @__PURE__ */ jsx(Bar, {
									dataKey: "purchases",
									name: "Purchases",
									fill: "var(--chart-3)",
									radius: [
										4,
										4,
										0,
										0
									]
								}),
								/* @__PURE__ */ jsx(Bar, {
									dataKey: "quotations",
									name: "Quotations",
									fill: "var(--chart-4)",
									radius: [
										4,
										4,
										0,
										0
									]
								}),
								/* @__PURE__ */ jsx(Bar, {
									dataKey: "approved",
									name: "Approved",
									fill: "var(--chart-2)",
									radius: [
										4,
										4,
										0,
										0
									]
								}),
								/* @__PURE__ */ jsx(Bar, {
									dataKey: "invoices",
									name: "Invoices",
									fill: "var(--chart-1)",
									radius: [
										4,
										4,
										0,
										0
									]
								})
							]
						})
					})
				})]
			}),
			/* @__PURE__ */ jsx(RecentMovements, {})
		]
	});
}
var tooltipStyle = {
	background: "var(--popover)",
	border: "1px solid var(--border)",
	borderRadius: 10,
	color: "var(--popover-foreground)",
	fontSize: 12
};
function ChartPanel({ title, subtitle, loading, empty, emptyText, children }) {
	return /* @__PURE__ */ jsxs("div", {
		className: "panel p-5",
		children: [
			/* @__PURE__ */ jsx("p", {
				className: "font-heading text-sm font-semibold",
				children: title
			}),
			/* @__PURE__ */ jsx("p", {
				className: "text-xs text-muted-foreground",
				children: subtitle
			}),
			/* @__PURE__ */ jsx("div", {
				className: "mt-4 h-64",
				children: loading ? /* @__PURE__ */ jsx(Skeleton, { className: "size-full rounded-lg" }) : empty ? /* @__PURE__ */ jsxs("div", {
					className: "flex size-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 text-center",
					children: [
						/* @__PURE__ */ jsx("span", {
							className: "flex size-10 items-center justify-center rounded-full bg-accent text-accent-foreground",
							children: /* @__PURE__ */ jsx(BarChart3, { className: "size-5" })
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-sm font-medium",
							children: "No data in this period"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "max-w-xs text-xs text-muted-foreground",
							children: emptyText
						})
					]
				}) : children
			})
		]
	});
}
function RecentMovements() {
	const { data, isLoading } = useQuery({
		queryKey: ["dash-recent-moves"],
		queryFn: async () => {
			const { data } = await db.from("stock_movements").select("id, movement_number, movement_date, direction, hs_code, description, quantity, shortfall").order("created_at", { ascending: false }).limit(6);
			return data ?? [];
		}
	});
	const rows = useMemo(() => data ?? [], [data]);
	return /* @__PURE__ */ jsxs("div", {
		className: "panel mt-4 overflow-hidden",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "flex items-center justify-between px-5 py-4",
			children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
				className: "font-heading text-sm font-semibold",
				children: "Latest stock movements"
			}), /* @__PURE__ */ jsx("p", {
				className: "text-xs text-muted-foreground",
				children: "Automatic entries from purchases and invoices"
			})] }), /* @__PURE__ */ jsx(Button, {
				asChild: true,
				variant: "ghost",
				size: "sm",
				children: /* @__PURE__ */ jsx(Link, {
					to: "/stock",
					children: "View all"
				})
			})]
		}), isLoading ? /* @__PURE__ */ jsx("div", {
			className: "space-y-2 px-5 pb-5",
			children: [
				0,
				1,
				2
			].map((i) => /* @__PURE__ */ jsx(Skeleton, { className: "h-10" }, i))
		}) : rows.length === 0 ? /* @__PURE__ */ jsx("p", {
			className: "px-5 pb-8 pt-2 text-center text-sm text-muted-foreground",
			children: "No stock movements yet."
		}) : /* @__PURE__ */ jsx("div", {
			className: "overflow-x-auto",
			children: /* @__PURE__ */ jsxs("table", {
				className: "w-full text-sm",
				children: [/* @__PURE__ */ jsx("thead", {
					className: "border-y border-border bg-muted/50 text-left text-[11px] uppercase tracking-wider text-muted-foreground",
					children: /* @__PURE__ */ jsxs("tr", { children: [
						/* @__PURE__ */ jsx("th", {
							className: "px-5 py-2.5 font-semibold",
							children: "Entry"
						}),
						/* @__PURE__ */ jsx("th", {
							className: "px-5 py-2.5 font-semibold",
							children: "Item"
						}),
						/* @__PURE__ */ jsx("th", {
							className: "px-5 py-2.5 font-semibold",
							children: "Type"
						}),
						/* @__PURE__ */ jsx("th", {
							className: "px-5 py-2.5 text-right font-semibold",
							children: "Qty"
						})
					] })
				}), /* @__PURE__ */ jsx("tbody", { children: rows.map((m) => /* @__PURE__ */ jsxs("tr", {
					className: "border-b border-border/60 transition-colors last:border-0 hover:bg-muted/40",
					children: [
						/* @__PURE__ */ jsxs("td", {
							className: "px-5 py-3",
							children: [/* @__PURE__ */ jsx("p", {
								className: "font-medium",
								children: m.movement_number
							}), /* @__PURE__ */ jsx("p", {
								className: "text-xs text-muted-foreground",
								children: m.movement_date
							})]
						}),
						/* @__PURE__ */ jsxs("td", {
							className: "px-5 py-3",
							children: [/* @__PURE__ */ jsx("p", {
								className: "font-mono text-xs",
								children: m.hs_code
							}), /* @__PURE__ */ jsx("p", {
								className: "max-w-xs truncate text-xs text-muted-foreground",
								children: m.description
							})]
						}),
						/* @__PURE__ */ jsxs("td", {
							className: "px-5 py-3",
							children: [/* @__PURE__ */ jsxs("span", {
								className: cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold", m.direction === "in" ? "bg-success/12 text-success" : "bg-info/12 text-info"),
								children: [m.direction === "in" ? /* @__PURE__ */ jsx(ArrowDownLeft, { className: "size-3" }) : /* @__PURE__ */ jsx(ArrowUpRight, { className: "size-3" }), m.direction === "in" ? "Stock in" : "Stock out"]
							}), Number(m.shortfall) > 0 ? /* @__PURE__ */ jsxs("span", {
								className: "ml-1 rounded-full bg-warning/15 px-2 py-0.5 text-[11px] font-semibold text-warning",
								children: ["short ", formatNumber(Number(m.shortfall))]
							}) : null]
						}),
						/* @__PURE__ */ jsx("td", {
							className: "px-5 py-3 text-right font-semibold tabular-nums",
							children: formatNumber(Number(m.quantity))
						})
					]
				}, m.id)) })]
			})
		})]
	});
}
//#endregion
export { Dashboard as component };
