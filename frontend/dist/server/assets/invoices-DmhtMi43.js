import { a as db, n as Button, r as cn } from "./bilal-logo.asset-DRcrRZxD.js";
import { d as DialogContent, f as DialogDescription, h as DialogTitle, m as DialogHeader, p as DialogFooter, t as AppShell, u as Dialog } from "./AppShell-Ctpjmt0k.js";
import { a as TableHeader, c as SelectContent, d as SelectValue, i as TableHead, l as SelectItem, n as TableBody, o as TableRow, r as TableCell, s as Select, t as Table, u as SelectTrigger } from "./table-C25g3iry.js";
import { t as DataTools } from "./DataTools-D4drsZ9K.js";
import { n as calculateTotals, r as documentLineSchema } from "./document-calculations-3hoJn7j-.js";
import { a as invoiceFields, i as importQuotations, t as flatten } from "./doc-import-sz9bvYuY.js";
import { n as downloadPdf, r as printInvoice, t as DocViewer } from "./DocViewer-NxYX7MxI.js";
import { t as Input } from "./input-C4NJMa86.js";
import { t as Label } from "./label-7BUlW98B.js";
import { t as Textarea } from "./textarea-D9S4fcOx.js";
import { a as SummaryBox, i as StatusBadge, n as FormSection, o as TableState, s as Toolbar } from "./kit-CL2daCzj.js";
import { a as emptyDocFilter, i as dateRange, n as DocFilters } from "./DocFilters-1L4I8yO3.js";
import { i as useSelection, n as SelectAll, r as SelectOne, t as BulkActions } from "./bulk-Qbneul1_.js";
import { t as LineItems } from "./LineItems-DAy3xJzR.js";
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, FileDown, Plus, Printer } from "lucide-react";
//#region src/routes/_authenticated/invoices.tsx
var Route = createFileRoute("/_authenticated/invoices")({
	head: () => ({ meta: [
		{ title: "Invoices — Spare Parts System" },
		{
			name: "description",
			content: "Invoices from approved quotations or added manually, with stock-out tracking."
		},
		{
			property: "og:title",
			content: "Invoices — Spare Parts System"
		},
		{
			property: "og:description",
			content: "Invoices from approved quotations or added manually, with stock-out tracking."
		}
	] }),
	component: InvoicesPage
});
var money = (n) => n.toLocaleString(void 0, {
	minimumFractionDigits: 2,
	maximumFractionDigits: 2
});
function InvoicesPage({ salesTax = false }) {
	const [search, setSearch] = useState("");
	const [f, setF] = useState(emptyDocFilter);
	const [viewId, setViewId] = useState(null);
	const [creating, setCreating] = useState(false);
	const s = useSelection();
	const kind = salesTax ? "sales" : "bill";
	const list = useQuery({
		queryKey: [
			"invoices",
			salesTax,
			search,
			f
		],
		queryFn: async () => {
			let q = db.from("invoices").select("*, departments(name), quotations(quotation_number)").order("created_at", { ascending: false }).limit(500);
			const term = search.trim().replace(/[%,()]/g, "");
			if (term) q = q.or(`invoice_number.ilike.%${term}%,sales_tax_number.ilike.%${term}%,vehicle_number.ilike.%${term}%,vehicle_type.ilike.%${term}%`);
			if (f.depts.length) q = q.in("department_id", f.depts);
			const r = dateRange(f);
			if (r.from) q = q.gte("invoice_date", r.from);
			if (r.to) q = q.lte("invoice_date", r.to);
			const { data, error } = await q;
			if (error) throw error;
			return data;
		}
	});
	const rows = list.data ?? [];
	const total = rows.reduce((a, r) => a + Number(r.grand_total), 0);
	return /* @__PURE__ */ jsxs(AppShell, {
		title: salesTax ? "Sales Tax Invoices" : "Invoices / Bills",
		description: salesTax ? "Automatically generated • Manual / offline • Not submitted to FBR" : "Approved quotations create invoices automatically — or add one manually",
		actions: salesTax ? void 0 : /* @__PURE__ */ jsxs(Button, {
			size: "sm",
			onClick: () => setCreating(true),
			children: [/* @__PURE__ */ jsx(Plus, { className: "size-4" }), "Add Invoice"]
		}),
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "panel overflow-hidden",
				children: [
					/* @__PURE__ */ jsx(Toolbar, {
						search,
						onSearch: setSearch,
						placeholder: "Search number or vehicle…",
						children: /* @__PURE__ */ jsx(DataTools, {
							name: salesTax ? "sales-tax-invoices" : "invoices",
							fields: invoiceFields,
							exportRows: async () => {
								const { data, error } = await db.from("invoices").select("*, departments(name), quotations(quotation_number), invoice_items(*)").order("invoice_date");
								if (error) throw error;
								return flatten(data, "invoice_items", (d) => ({
									invoice_number: d["invoice_number"],
									invoice_date: d["invoice_date"],
									buyer: d["departments"]?.name,
									quotation_number: d["quotations"]?.quotation_number
								}));
							},
							onImport: async (rows) => {
								return await importQuotations(rows.map((r) => ({
									...r,
									ref: r["invoice_number"] || r["quotation_number"] || "import",
									quotation_date: r["invoice_date"]
								}))) + " — approve them to create invoices";
							}
						})
					}),
					/* @__PURE__ */ jsx(DocFilters, {
						value: f,
						onChange: setF
					}),
					/* @__PURE__ */ jsx(BulkActions, {
						table: "invoices",
						s,
						onPdf: (ids) => downloadPdf(ids, kind)
					}),
					/* @__PURE__ */ jsx("div", {
						className: "overflow-x-auto",
						children: /* @__PURE__ */ jsxs(Table, { children: [/* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
							/* @__PURE__ */ jsx(TableHead, {
								className: "w-8",
								children: /* @__PURE__ */ jsx(SelectAll, {
									ids: rows.map((r) => r.id),
									s
								})
							}),
							/* @__PURE__ */ jsx(TableHead, { children: "Number" }),
							/* @__PURE__ */ jsx(TableHead, { children: "Date" }),
							/* @__PURE__ */ jsx(TableHead, { children: "Buyer" }),
							/* @__PURE__ */ jsx(TableHead, { children: "Source" }),
							/* @__PURE__ */ jsx(TableHead, {
								className: "text-right",
								children: "Total"
							}),
							/* @__PURE__ */ jsx(TableHead, { children: "Status" }),
							/* @__PURE__ */ jsx(TableHead, {
								className: "text-right",
								children: "Actions"
							})
						] }) }), /* @__PURE__ */ jsxs(TableBody, { children: [/* @__PURE__ */ jsx(TableState, {
							cols: 8,
							loading: list.isLoading,
							error: list.error ? list.error.message : null,
							empty: !list.isLoading && rows.length === 0,
							title: "No invoices found",
							hint: "Approve a quotation or add an invoice manually."
						}), rows.map((inv) => /* @__PURE__ */ jsxs(TableRow, {
							className: cn(s.sel.has(inv.id) && "bg-accent/40"),
							children: [
								/* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx(SelectOne, {
									id: inv.id,
									s
								}) }),
								/* @__PURE__ */ jsx(TableCell, {
									className: "font-mono",
									children: salesTax ? inv.sales_tax_number : inv.invoice_number
								}),
								/* @__PURE__ */ jsx(TableCell, { children: inv.invoice_date }),
								/* @__PURE__ */ jsx(TableCell, { children: inv.departments?.name }),
								/* @__PURE__ */ jsx(TableCell, {
									className: "text-xs",
									children: inv.source === "manual" ? "Manual" : /* @__PURE__ */ jsx("span", {
										className: "font-mono",
										children: inv.quotations?.quotation_number ?? "Quotation"
									})
								}),
								/* @__PURE__ */ jsx(TableCell, {
									className: "text-right tabular-nums",
									children: money(Number(inv.grand_total))
								}),
								/* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx(StatusBadge, { status: inv.verification }) }),
								/* @__PURE__ */ jsxs(TableCell, {
									className: "whitespace-nowrap text-right",
									children: [
										/* @__PURE__ */ jsx(Button, {
											size: "icon",
											variant: "ghost",
											"aria-label": "View A4",
											onClick: () => setViewId(inv.id),
											children: /* @__PURE__ */ jsx(Eye, { className: "size-4" })
										}),
										/* @__PURE__ */ jsx(Button, {
											size: "icon",
											variant: "ghost",
											"aria-label": "Download PDF",
											onClick: () => downloadPdf([inv.id], kind).catch((e) => toast.error(e.message)),
											children: /* @__PURE__ */ jsx(FileDown, { className: "size-4" })
										}),
										/* @__PURE__ */ jsx(Button, {
											size: "icon",
											variant: "ghost",
											"aria-label": "Print",
											onClick: () => void printInvoice(inv.id, salesTax),
											children: /* @__PURE__ */ jsx(Printer, { className: "size-4" })
										})
									]
								})
							]
						}, inv.id))] })] })
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "border-t border-border p-4 text-right text-sm font-semibold",
						children: [
							rows.length,
							" records · Total ",
							money(total)
						]
					})
				]
			}),
			viewId && /* @__PURE__ */ jsx(DocViewer, {
				id: viewId,
				kind,
				onClose: () => setViewId(null)
			}),
			creating && /* @__PURE__ */ jsx(InvoiceForm, { onClose: () => setCreating(false) })
		]
	});
}
var emptyLine = () => ({
	hs_code: "",
	part_number: "",
	description: "",
	description_source: "custom",
	uom: "pcs",
	quantity: 1,
	unit_price: 0,
	discount: 0,
	tax_percent: 0,
	labor_percent: 0
});
/** Manual invoice: same rules as a quotation-generated invoice (vehicle, FBR mapping, per-line labor, stock out). */
function InvoiceForm({ onClose }) {
	const qc = useQueryClient();
	const [departmentId, setDepartmentId] = useState("");
	const [date, setDate] = useState((/* @__PURE__ */ new Date()).toISOString().slice(0, 10));
	const [vehicleType, setVehicleType] = useState("");
	const [vehicleNumber, setVehicleNumber] = useState("");
	const [notes, setNotes] = useState("");
	const [lines, setLines] = useState([emptyLine()]);
	const departments = useQuery({
		queryKey: ["department-options"],
		queryFn: async () => (await db.from("departments").select("id,name").eq("status", "active").order("name")).data ?? []
	});
	const upd = (i, p) => setLines((ls) => ls.map((l, j) => j === i ? {
		...l,
		...p
	} : l));
	const totals = calculateTotals(lines, (i) => lines[i].unit_price);
	const save = useMutation({
		mutationFn: async () => {
			if (!departmentId) throw new Error("Select a buyer / department");
			if (!vehicleType.trim() && !vehicleNumber.trim()) throw new Error("Vehicle type or vehicle number is required");
			const valid = lines.map((l) => documentLineSchema.parse(l));
			const { error } = await db.rpc("create_document", {
				_kind: "invoice",
				_header: {
					department_id: departmentId,
					date,
					vehicle_type: vehicleType,
					vehicle_number: vehicleNumber,
					notes
				},
				_items: valid
			});
			if (error) throw error;
		},
		onSuccess: () => {
			toast.success("Invoice created — stock deducted");
			qc.invalidateQueries();
			onClose();
		},
		onError: (e) => toast.error(e.message)
	});
	return /* @__PURE__ */ jsx(Dialog, {
		open: true,
		onOpenChange: (o) => !o && onClose(),
		children: /* @__PURE__ */ jsxs(DialogContent, {
			className: "max-h-[92vh] max-w-6xl overflow-auto",
			children: [
				/* @__PURE__ */ jsxs(DialogHeader, { children: [/* @__PURE__ */ jsx(DialogTitle, { children: "Add invoice" }), /* @__PURE__ */ jsx(DialogDescription, { children: "Creates the invoice and its sales tax invoice without a quotation." })] }),
				/* @__PURE__ */ jsx(FormSection, {
					title: "1. Buyer, date & vehicle",
					hint: "Vehicle type or number is required.",
					children: /* @__PURE__ */ jsxs("div", {
						className: "grid gap-3 md:grid-cols-4",
						children: [
							/* @__PURE__ */ jsxs("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ jsx(Label, { children: "Buyer / Department *" }), /* @__PURE__ */ jsxs(Select, {
									value: departmentId,
									onValueChange: setDepartmentId,
									children: [/* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Select buyer" }) }), /* @__PURE__ */ jsx(SelectContent, { children: (departments.data ?? []).map((d) => /* @__PURE__ */ jsx(SelectItem, {
										value: d.id,
										children: d.name
									}, d.id)) })]
								})]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ jsx(Label, { children: "Date" }), /* @__PURE__ */ jsx(Input, {
									type: "date",
									value: date,
									onChange: (e) => setDate(e.target.value)
								})]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ jsx(Label, { children: "Vehicle type" }), /* @__PURE__ */ jsx(Input, {
									maxLength: 100,
									value: vehicleType,
									onChange: (e) => setVehicleType(e.target.value),
									placeholder: "e.g. Toyota Corolla"
								})]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ jsx(Label, { children: "Vehicle number" }), /* @__PURE__ */ jsx(Input, {
									maxLength: 100,
									value: vehicleNumber,
									onChange: (e) => setVehicleNumber(e.target.value),
									placeholder: "e.g. GX-559"
								})]
							})
						]
					})
				}),
				/* @__PURE__ */ jsx(FormSection, {
					title: "2. Items",
					hint: "Each product has its own labor %. HS codes must map to an FBR HS code.",
					children: /* @__PURE__ */ jsx(LineItems, {
						lines,
						upd,
						setLines,
						priceKey: "unit_price",
						labor: true
					})
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "grid gap-4 md:grid-cols-2",
					children: [/* @__PURE__ */ jsx(FormSection, {
						title: "3. Notes",
						children: /* @__PURE__ */ jsx(Textarea, {
							value: notes,
							onChange: (e) => setNotes(e.target.value)
						})
					}), /* @__PURE__ */ jsx(SummaryBox, {
						...totals,
						money
					})]
				}),
				/* @__PURE__ */ jsxs(DialogFooter, { children: [/* @__PURE__ */ jsx(Button, {
					variant: "outline",
					onClick: onClose,
					children: "Cancel"
				}), /* @__PURE__ */ jsx(Button, {
					onClick: () => save.mutate(),
					disabled: save.isPending,
					children: save.isPending ? "Saving…" : "Save invoice"
				})] })
			]
		})
	});
}
//#endregion
export { Route as n, InvoicesPage as t };
