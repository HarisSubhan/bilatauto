import { a as db, n as Button } from "./bilal-logo.asset-DVM5nCcq.js";
import { t as AppShell } from "./AppShell-CbTTFVU-.js";
import { a as TableHeader, i as TableHead, n as TableBody, o as TableRow, r as TableCell, t as Table } from "./table-ITrsg8wD.js";
import { t as Input } from "./input-BdVko9wQ.js";
import { t as Label } from "./label-DwaA--ly.js";
import { o as useOptions, r as MultiPick } from "./DocFilters-DqC21G_M.js";
import { i as toCsv, n as formatMoney, t as downloadCsv } from "./format-DPwQXC9y.js";
import { i as TabsTrigger, r as TabsList, t as Tabs } from "./tabs-D8havF6Y.js";
import { useState } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
//#region src/routes/_authenticated/reports.tsx?tsr-split=component
var MONEY_COLS = /* @__PURE__ */ new Set([
	"total",
	"tax",
	"labor",
	"sales_total",
	"purchase_total"
]);
var DEPT_KINDS = [
	"dept_sales",
	"quotations",
	"invoices"
];
var SUP_KINDS = ["supplier_purchases", "purchases"];
var HS_KINDS = [
	"stock_in",
	"stock_out",
	"inventory"
];
var monthStart = () => {
	const d = /* @__PURE__ */ new Date();
	return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
};
function ReportsPage() {
	const [kind, setKind] = useState("dept_sales");
	const [from, setFrom] = useState(monthStart());
	const [to, setTo] = useState((/* @__PURE__ */ new Date()).toISOString().slice(0, 10));
	const [depts, setDepts] = useState([]);
	const [sups, setSups] = useState([]);
	const [hs, setHs] = useState("");
	const [search, setSearch] = useState("");
	const deptOpts = useOptions("departments");
	const supOpts = useOptions("suppliers");
	const q = useQuery({
		queryKey: [
			"report",
			kind,
			from,
			to,
			depts,
			sups,
			hs
		],
		queryFn: async () => {
			if (kind === "dept_sales" || kind === "invoices") {
				let s = db.from("invoices").select("invoice_number, invoice_date, tax_total, grand_total, department_id, source, departments(name), quotations(quotation_number)").gte("invoice_date", from).lte("invoice_date", to).order("invoice_date");
				if (depts.length) s = s.in("department_id", depts);
				const { data, error } = await s;
				if (error) throw error;
				if (kind === "invoices") return {
					cols: [
						"number",
						"date",
						"department",
						"source",
						"tax",
						"total"
					],
					rows: (data ?? []).map((r) => ({
						number: r.invoice_number,
						date: r.invoice_date,
						department: r.departments?.name ?? "",
						source: r.source === "manual" ? "Manual" : r.quotations?.quotation_number ?? "",
						tax: Number(r.tax_total),
						total: Number(r.grand_total)
					})),
					totalKey: "total"
				};
				const g = /* @__PURE__ */ new Map();
				for (const r of data ?? []) {
					const name = r.departments?.name ?? "—";
					const a = g.get(name) ?? {
						department: name,
						invoices: 0,
						tax: 0,
						sales_total: 0
					};
					a["invoices"] = Number(a["invoices"]) + 1;
					a["tax"] = Number(a["tax"]) + Number(r.tax_total);
					a["sales_total"] = Number(a["sales_total"]) + Number(r.grand_total);
					g.set(name, a);
				}
				return {
					cols: [
						"department",
						"invoices",
						"tax",
						"sales_total"
					],
					rows: [...g.values()].sort((a, b) => Number(b["sales_total"]) - Number(a["sales_total"])),
					totalKey: "sales_total"
				};
			}
			if (kind === "purchases" || kind === "supplier_purchases") {
				let s = db.from("purchases").select("purchase_number, purchase_date, bill_number, grand_total, verification, supplier_id, suppliers(name)").gte("purchase_date", from).lte("purchase_date", to).order("purchase_date");
				if (sups.length) s = s.in("supplier_id", sups);
				const { data, error } = await s;
				if (error) throw error;
				if (kind === "purchases") return {
					cols: [
						"number",
						"date",
						"supplier",
						"bill",
						"status",
						"total"
					],
					rows: (data ?? []).map((r) => ({
						number: r.purchase_number,
						date: r.purchase_date,
						supplier: r.suppliers?.name ?? "",
						bill: r.bill_number,
						status: r.verification,
						total: Number(r.grand_total)
					})),
					totalKey: "total"
				};
				const g = /* @__PURE__ */ new Map();
				for (const r of data ?? []) {
					const name = r.suppliers?.name ?? "—";
					const a = g.get(name) ?? {
						supplier: name,
						purchases: 0,
						purchase_total: 0
					};
					a["purchases"] = Number(a["purchases"]) + 1;
					a["purchase_total"] = Number(a["purchase_total"]) + Number(r.grand_total);
					g.set(name, a);
				}
				return {
					cols: [
						"supplier",
						"purchases",
						"purchase_total"
					],
					rows: [...g.values()].sort((a, b) => Number(b["purchase_total"]) - Number(a["purchase_total"])),
					totalKey: "purchase_total"
				};
			}
			if (kind === "quotations") {
				let s = db.from("quotations").select("quotation_number, quotation_date, status, grand_total, department_id, departments(name)").gte("quotation_date", from).lte("quotation_date", to).order("quotation_date");
				if (depts.length) s = s.in("department_id", depts);
				const { data, error } = await s;
				if (error) throw error;
				return {
					cols: [
						"number",
						"date",
						"department",
						"status",
						"total"
					],
					rows: (data ?? []).map((r) => ({
						number: r.quotation_number,
						date: r.quotation_date,
						department: r.departments?.name ?? "",
						status: r.status,
						total: Number(r.grand_total)
					})),
					totalKey: "total"
				};
			}
			if (kind === "inventory") {
				let s = db.from("current_stock").select("*").order("hs_code");
				if (hs) s = s.eq("hs_code", hs);
				const { data } = await s;
				return {
					cols: [
						"hs_code",
						"description",
						"total_in",
						"total_out",
						"available"
					],
					rows: data ?? []
				};
			}
			let s = db.from("stock_movements").select("movement_number, movement_date, hs_code, description, quantity, uom, reference_number").eq("direction", kind === "stock_in" ? "in" : "out").gte("movement_date", from).lte("movement_date", to).order("movement_date");
			if (hs) s = s.eq("hs_code", hs);
			const { data } = await s;
			return {
				cols: [
					"movement_number",
					"movement_date",
					"hs_code",
					"description",
					"quantity",
					"uom",
					"reference_number"
				],
				rows: data ?? []
			};
		}
	});
	const term = search.trim().toLowerCase();
	const rows = (q.data?.rows ?? []).filter((r) => !term || Object.values(r).some((v) => String(v ?? "").toLowerCase().includes(term)));
	const total = q.data?.totalKey ? rows.reduce((a, r) => a + Number(r[q.data.totalKey] ?? 0), 0) : void 0;
	const exportCsv = () => q.data && downloadCsv(`${kind}-${from}-to-${to}.csv`, toCsv(rows, q.data.cols));
	return /* @__PURE__ */ jsxs(AppShell, {
		title: "Reports",
		description: "Filter by date, department, supplier or HS code and export",
		actions: /* @__PURE__ */ jsxs(Button, {
			size: "sm",
			variant: "outline",
			onClick: exportCsv,
			children: [/* @__PURE__ */ jsx(Download, { className: "mr-1 size-4" }), "Export"]
		}),
		children: [
			/* @__PURE__ */ jsx(Tabs, {
				value: kind,
				onValueChange: (v) => setKind(v),
				children: /* @__PURE__ */ jsxs(TabsList, {
					className: "h-auto flex-wrap",
					children: [
						/* @__PURE__ */ jsx(TabsTrigger, {
							value: "dept_sales",
							children: "Department sales"
						}),
						/* @__PURE__ */ jsx(TabsTrigger, {
							value: "supplier_purchases",
							children: "Supplier purchases"
						}),
						/* @__PURE__ */ jsx(TabsTrigger, {
							value: "invoices",
							children: "Invoices"
						}),
						/* @__PURE__ */ jsx(TabsTrigger, {
							value: "quotations",
							children: "Quotations"
						}),
						/* @__PURE__ */ jsx(TabsTrigger, {
							value: "purchases",
							children: "Purchases"
						}),
						/* @__PURE__ */ jsx(TabsTrigger, {
							value: "stock_in",
							children: "Stock In"
						}),
						/* @__PURE__ */ jsx(TabsTrigger, {
							value: "stock_out",
							children: "Stock Out"
						}),
						/* @__PURE__ */ jsx(TabsTrigger, {
							value: "inventory",
							children: "Inventory"
						})
					]
				})
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "my-4 flex flex-wrap items-end gap-3",
				children: [
					/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, { children: "Search" }), /* @__PURE__ */ jsx(Input, {
						placeholder: "Search this report…",
						value: search,
						onChange: (e) => setSearch(e.target.value)
					})] }),
					kind !== "inventory" && /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, { children: "From" }), /* @__PURE__ */ jsx(Input, {
						type: "date",
						value: from,
						onChange: (e) => setFrom(e.target.value)
					})] }), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, { children: "To" }), /* @__PURE__ */ jsx(Input, {
						type: "date",
						value: to,
						onChange: (e) => setTo(e.target.value)
					})] })] }),
					DEPT_KINDS.includes(kind) && /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, {
						className: "block",
						children: "Department"
					}), /* @__PURE__ */ jsx(MultiPick, {
						label: "departments",
						options: deptOpts.data ?? [],
						value: depts,
						onChange: setDepts
					})] }),
					SUP_KINDS.includes(kind) && /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, {
						className: "block",
						children: "Supplier"
					}), /* @__PURE__ */ jsx(MultiPick, {
						label: "suppliers",
						options: supOpts.data ?? [],
						value: sups,
						onChange: setSups
					})] }),
					HS_KINDS.includes(kind) && /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, { children: "HS code" }), /* @__PURE__ */ jsx(Input, {
						placeholder: "All HS codes",
						value: hs,
						onChange: (e) => setHs(e.target.value.trim())
					})] })
				]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "panel overflow-x-auto",
				children: /* @__PURE__ */ jsxs(Table, { children: [/* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsx(TableRow, { children: q.data?.cols.map((c) => /* @__PURE__ */ jsx(TableHead, {
					className: "capitalize",
					children: c.replace(/_/g, " ")
				}, c)) }) }), /* @__PURE__ */ jsxs(TableBody, { children: [rows.map((r, i) => /* @__PURE__ */ jsx(TableRow, { children: q.data.cols.map((c) => /* @__PURE__ */ jsx(TableCell, { children: typeof r[c] === "number" && MONEY_COLS.has(c) ? formatMoney(r[c]) : String(r[c] ?? "") }, c)) }, i)), q.data && rows.length === 0 && /* @__PURE__ */ jsx(TableRow, { children: /* @__PURE__ */ jsx(TableCell, {
					colSpan: q.data.cols.length,
					className: "py-10 text-center text-muted-foreground",
					children: "No records for these filters"
				}) })] })] })
			}),
			total !== void 0 && /* @__PURE__ */ jsxs("p", {
				className: "mt-3 text-right text-lg font-bold",
				children: [
					rows.length,
					" rows · Total ",
					formatMoney(total)
				]
			})
		]
	});
}
//#endregion
export { ReportsPage as component };
