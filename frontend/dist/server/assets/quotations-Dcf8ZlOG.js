import { a as db, n as Button, r as cn } from "./bilal-logo.asset-DRcrRZxD.js";
import { d as DialogContent, f as DialogDescription, h as DialogTitle, m as DialogHeader, p as DialogFooter, t as AppShell, u as Dialog } from "./AppShell-Ctpjmt0k.js";
import { a as TableHeader, c as SelectContent, d as SelectValue, i as TableHead, l as SelectItem, n as TableBody, o as TableRow, r as TableCell, s as Select, t as Table, u as SelectTrigger } from "./table-C25g3iry.js";
import { t as DataTools } from "./DataTools-D4drsZ9K.js";
import { n as calculateTotals, r as documentLineSchema } from "./document-calculations-3hoJn7j-.js";
import { c as quotationFields, i as importQuotations, t as flatten } from "./doc-import-sz9bvYuY.js";
import { i as printQuotation, n as downloadPdf, t as DocViewer } from "./DocViewer-NxYX7MxI.js";
import { t as Input } from "./input-C4NJMa86.js";
import { t as Label } from "./label-7BUlW98B.js";
import { t as Textarea } from "./textarea-D9S4fcOx.js";
import { a as SummaryBox, i as StatusBadge, n as FormSection, o as TableState, r as RowActions, s as Toolbar } from "./kit-CL2daCzj.js";
import { a as emptyDocFilter, i as dateRange, n as DocFilters } from "./DocFilters-1L4I8yO3.js";
import { i as useSelection, n as SelectAll, r as SelectOne, t as BulkActions } from "./bulk-Qbneul1_.js";
import { t as LineItems } from "./LineItems-DAy3xJzR.js";
import { useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, Clock, Eye, FileDown, FileText, Plus, Send, Trash2, XCircle } from "lucide-react";
//#region src/routes/_authenticated/quotations.tsx?tsr-split=component
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
var money = (n) => n.toLocaleString(void 0, {
	minimumFractionDigits: 2,
	maximumFractionDigits: 2
});
var FILTERS = [
	{
		v: "all",
		l: "All"
	},
	{
		v: "draft",
		l: "Draft"
	},
	{
		v: "submitted",
		l: "Pending"
	},
	{
		v: "invoiced",
		l: "Approved"
	},
	{
		v: "rejected",
		l: "Rejected"
	}
];
function useSetStatus() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async ({ id, status, remarks }) => {
			const patch = { status };
			if (status === "approved") patch["approved_at"] = (/* @__PURE__ */ new Date()).toISOString();
			if (remarks !== void 0) patch["approval_remarks"] = remarks;
			const { error } = await db.from("quotations").update(patch).eq("id", id);
			if (error) throw error;
		},
		onSuccess: (_, { status }) => {
			toast.success(status === "approved" ? "Approved — invoice created and stock deducted" : status === "rejected" ? "Quotation rejected" : "Submitted for approval");
			qc.invalidateQueries();
		},
		onError: (e) => toast.error(e.message)
	});
}
function QuotationsPage() {
	const qc = useQueryClient();
	const [search, setSearch] = useState("");
	const [filter, setFilter] = useState("all");
	const [creating, setCreating] = useState(false);
	const [viewId, setViewId] = useState(null);
	const [a4Id, setA4Id] = useState(null);
	const [f, setF] = useState(emptyDocFilter);
	const s = useSelection();
	const setStatus = useSetStatus();
	const list = useQuery({
		queryKey: [
			"quotations",
			search,
			filter,
			f
		],
		queryFn: async () => {
			let q = db.from("quotations").select("*, departments(name)").order("created_at", { ascending: false }).limit(500);
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
		}
	});
	const del = useMutation({
		mutationFn: async (id) => {
			const { error } = await db.from("quotations").delete().eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			toast.success("Deleted");
			qc.invalidateQueries({ queryKey: ["quotations"] });
		},
		onError: (e) => toast.error(e.message)
	});
	const rows = list.data ?? [];
	return /* @__PURE__ */ jsxs(AppShell, {
		title: "Quotations",
		description: "Approving a quotation automatically creates its invoice and deducts stock",
		actions: /* @__PURE__ */ jsxs(Button, {
			size: "sm",
			onClick: () => setCreating(true),
			children: [/* @__PURE__ */ jsx(Plus, { className: "size-4" }), "New quotation"]
		}),
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "panel overflow-hidden",
				children: [
					/* @__PURE__ */ jsxs(Toolbar, {
						search,
						onSearch: setSearch,
						placeholder: "Search number or contact…",
						children: [/* @__PURE__ */ jsx("div", {
							className: "flex rounded-lg border border-border bg-muted/40 p-0.5",
							children: FILTERS.map((f) => /* @__PURE__ */ jsx("button", {
								onClick: () => setFilter(f.v),
								className: cn("rounded-md px-3 py-1 text-xs font-medium transition-colors", filter === f.v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"),
								children: f.l
							}, f.v))
						}), /* @__PURE__ */ jsx(DataTools, {
							name: "quotations",
							fields: quotationFields,
							exportRows: async () => {
								const { data, error } = await db.from("quotations").select("*, departments(name), quotation_items(*)").order("quotation_date");
								if (error) throw error;
								return flatten(data, "quotation_items", (d) => ({
									ref: d["quotation_number"],
									quotation_date: d["quotation_date"],
									buyer: d["departments"]?.name,
									contact_person: d["contact_person"]
								}));
							},
							onImport: async (rows) => {
								const m = await importQuotations(rows);
								await qc.invalidateQueries({ queryKey: ["quotations"] });
								return m;
							}
						})]
					}),
					/* @__PURE__ */ jsx(DocFilters, {
						value: f,
						onChange: setF
					}),
					/* @__PURE__ */ jsx(BulkActions, {
						table: "quotations",
						s,
						onPdf: (ids) => downloadPdf(ids, "quotation")
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
							/* @__PURE__ */ jsx(TableHead, { children: "Valid until" }),
							/* @__PURE__ */ jsx(TableHead, {
								className: "text-right",
								children: "Total"
							}),
							/* @__PURE__ */ jsx(TableHead, { children: "Status" }),
							/* @__PURE__ */ jsx(TableHead, { className: "w-12" })
						] }) }), /* @__PURE__ */ jsxs(TableBody, { children: [/* @__PURE__ */ jsx(TableState, {
							cols: 8,
							loading: list.isLoading,
							error: list.error ? list.error.message : null,
							empty: !list.isLoading && rows.length === 0,
							title: "No quotations found",
							hint: "Create a quotation and submit it for approval."
						}), rows.map((q) => /* @__PURE__ */ jsxs(TableRow, {
							className: "cursor-pointer",
							onClick: () => setViewId(q.id),
							children: [
								/* @__PURE__ */ jsx(TableCell, {
									onClick: (e) => e.stopPropagation(),
									children: /* @__PURE__ */ jsx(SelectOne, {
										id: q.id,
										s
									})
								}),
								/* @__PURE__ */ jsx(TableCell, {
									className: "font-mono text-xs font-semibold",
									children: q.quotation_number
								}),
								/* @__PURE__ */ jsx(TableCell, { children: q.quotation_date }),
								/* @__PURE__ */ jsx(TableCell, {
									className: "font-medium",
									children: q.departments?.name
								}),
								/* @__PURE__ */ jsx(TableCell, {
									className: "text-muted-foreground",
									children: q.valid_until ?? "—"
								}),
								/* @__PURE__ */ jsx(TableCell, {
									className: "text-right font-semibold tabular-nums",
									children: money(Number(q.grand_total))
								}),
								/* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx(StatusBadge, {
									status: q.status,
									label: q.status === "invoiced" ? "Approved · invoiced" : void 0
								}) }),
								/* @__PURE__ */ jsx(TableCell, {
									className: "text-right",
									onClick: (e) => e.stopPropagation(),
									children: /* @__PURE__ */ jsx(RowActions, { actions: [
										{
											label: "View",
											icon: Eye,
											onClick: () => setViewId(q.id)
										},
										{
											label: "View A4",
											icon: FileText,
											onClick: () => setA4Id(q.id)
										},
										{
											label: "Download PDF",
											icon: FileDown,
											onClick: () => void downloadPdf([q.id], "quotation").catch((e) => toast.error(e.message))
										},
										{
											label: "Submit for approval",
											icon: Send,
											hidden: q.status !== "draft",
											onClick: () => setStatus.mutate({
												id: q.id,
												status: "submitted"
											})
										},
										{
											label: "Review & approve",
											icon: CheckCircle2,
											hidden: q.status !== "submitted",
											onClick: () => setViewId(q.id)
										},
										{
											label: "Delete",
											icon: Trash2,
											danger: true,
											separator: true,
											hidden: q.status !== "draft",
											onClick: () => confirm("Delete this quotation?") && del.mutate(q.id)
										}
									] })
								})
							]
						}, q.id))] })] })
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "border-t border-border p-4 text-right text-sm font-semibold",
						children: [
							rows.length,
							" records · Total ",
							money(rows.reduce((a, r) => a + Number(r.grand_total), 0))
						]
					})
				]
			}),
			a4Id && /* @__PURE__ */ jsx(DocViewer, {
				id: a4Id,
				kind: "quotation",
				onClose: () => setA4Id(null)
			}),
			creating && /* @__PURE__ */ jsx(QuotationForm, { onClose: () => setCreating(false) }),
			viewId && /* @__PURE__ */ jsx(QuotationView, {
				id: viewId,
				onClose: () => setViewId(null)
			})
		]
	});
}
function QuotationForm({ onClose }) {
	const qc = useQueryClient();
	const [departmentId, setDepartmentId] = useState("");
	const [date, setDate] = useState((/* @__PURE__ */ new Date()).toISOString().slice(0, 10));
	const [validUntil, setValidUntil] = useState("");
	const [contact, setContact] = useState("");
	const [notes, setNotes] = useState("");
	const [vehicleType, setVehicleType] = useState("");
	const [vehicleNumber, setVehicleNumber] = useState("");
	const [lines, setLines] = useState([emptyLine()]);
	const [tried, setTried] = useState(false);
	const departments = useQuery({
		queryKey: ["department-options"],
		queryFn: async () => (await db.from("departments").select("id,name").eq("status", "active").order("name")).data ?? []
	});
	const upd = (i, patch) => setLines((ls) => ls.map((l, j) => j === i ? {
		...l,
		...patch
	} : l));
	const totals = calculateTotals(lines, (i) => lines[i].unit_price);
	const save = useMutation({
		mutationFn: async () => {
			setTried(true);
			if (!departmentId) throw new Error("Select a buyer / department");
			if (!vehicleType.trim() && !vehicleNumber.trim()) throw new Error("Vehicle type or vehicle number is required");
			if (!lines.length || lines.length > 200) throw new Error("Add between 1 and 200 items");
			const valid = lines.map((l) => documentLineSchema.parse(l));
			const { error } = await db.rpc("create_document", {
				_kind: "quotation",
				_header: {
					department_id: departmentId,
					date,
					valid_until: validUntil,
					contact_person: contact,
					notes,
					vehicle_type: vehicleType,
					vehicle_number: vehicleNumber
				},
				_items: valid
			});
			if (error) throw error;
		},
		onSuccess: () => {
			toast.success("Quotation saved as draft");
			qc.invalidateQueries({ queryKey: ["quotations"] });
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
				/* @__PURE__ */ jsxs(DialogHeader, { children: [/* @__PURE__ */ jsx(DialogTitle, { children: "New quotation" }), /* @__PURE__ */ jsx(DialogDescription, { children: "Saved as a draft. Submit it for approval when ready." })] }),
				/* @__PURE__ */ jsx(FormSection, {
					title: "1. Buyer & dates",
					children: /* @__PURE__ */ jsxs("div", {
						className: "grid gap-3 md:grid-cols-4",
						children: [
							/* @__PURE__ */ jsxs("div", {
								className: "space-y-1.5",
								children: [
									/* @__PURE__ */ jsx(Label, { children: "Buyer / Department *" }),
									/* @__PURE__ */ jsxs(Select, {
										value: departmentId,
										onValueChange: setDepartmentId,
										children: [/* @__PURE__ */ jsx(SelectTrigger, {
											className: cn(tried && !departmentId && "border-destructive"),
											children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Select buyer" })
										}), /* @__PURE__ */ jsx(SelectContent, { children: (departments.data ?? []).map((d) => /* @__PURE__ */ jsx(SelectItem, {
											value: d.id,
											children: d.name
										}, d.id)) })]
									}),
									tried && !departmentId ? /* @__PURE__ */ jsx("p", {
										className: "text-xs text-destructive",
										children: "Buyer is required"
									}) : null
								]
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
								children: [/* @__PURE__ */ jsx(Label, { children: "Valid until" }), /* @__PURE__ */ jsx(Input, {
									type: "date",
									value: validUntil,
									onChange: (e) => setValidUntil(e.target.value)
								})]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ jsx(Label, { children: "Contact person" }), /* @__PURE__ */ jsx(Input, {
									placeholder: "e.g. Mr. Ahmed",
									value: contact,
									onChange: (e) => setContact(e.target.value)
								})]
							})
						]
					})
				}),
				/* @__PURE__ */ jsx(FormSection, {
					title: "Vehicle",
					hint: "Enter vehicle type or number (at least one required).",
					children: /* @__PURE__ */ jsxs("div", {
						className: "grid gap-3 md:grid-cols-2",
						children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, { children: "Vehicle type" }), /* @__PURE__ */ jsx(Input, {
							maxLength: 100,
							value: vehicleType,
							onChange: (e) => setVehicleType(e.target.value),
							placeholder: "e.g. Toyota Corolla"
						})] }), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, { children: "Vehicle number" }), /* @__PURE__ */ jsx(Input, {
							maxLength: 100,
							value: vehicleNumber,
							onChange: (e) => setVehicleNumber(e.target.value),
							placeholder: "e.g. GX-559"
						})] })]
					})
				}),
				/* @__PURE__ */ jsx(FormSection, {
					title: "2. Items",
					hint: "Each product has its own labor % (on price less discount, before tax). HS codes must map to an FBR HS code.",
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
							placeholder: "Delivery terms, remarks…",
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
					children: save.isPending ? "Saving…" : "Save quotation"
				})] })
			]
		})
	});
}
var STEPS = [
	{
		key: "draft",
		label: "Draft",
		icon: FileText
	},
	{
		key: "submitted",
		label: "Pending approval",
		icon: Clock
	},
	{
		key: "decision",
		label: "Approved / Rejected",
		icon: CheckCircle2
	}
];
function QuotationView({ id, onClose }) {
	const setStatus = useSetStatus();
	const [remarks, setRemarks] = useState("");
	const d = useQuery({
		queryKey: ["quotation", id],
		queryFn: async () => {
			const { data, error } = await db.from("quotations").select("*, departments(name), quotation_items(*), invoices(invoice_number), quotation_approvals(*)").eq("id", id).single();
			if (error) throw error;
			return data;
		}
	}).data;
	const stepIdx = !d ? 0 : d.status === "draft" ? 0 : d.status === "submitted" ? 1 : 2;
	const rejected = d?.status === "rejected";
	const history = [...d?.quotation_approvals ?? []].sort((a, b) => a.acted_at.localeCompare(b.acted_at));
	return /* @__PURE__ */ jsx(Dialog, {
		open: true,
		onOpenChange: (o) => !o && onClose(),
		children: /* @__PURE__ */ jsxs(DialogContent, {
			className: "max-h-[92vh] max-w-5xl overflow-auto",
			children: [/* @__PURE__ */ jsxs(DialogHeader, { children: [/* @__PURE__ */ jsxs(DialogTitle, {
				className: "flex items-center gap-3",
				children: [
					"Quotation ",
					d?.quotation_number,
					" ",
					/* @__PURE__ */ jsx(Button, {
						size: "sm",
						variant: "outline",
						onClick: () => void printQuotation(id),
						children: "Print"
					}),
					/* @__PURE__ */ jsx(Button, {
						size: "sm",
						variant: "outline",
						onClick: () => void downloadPdf([id], "quotation"),
						children: "Download PDF"
					}),
					" ",
					d ? /* @__PURE__ */ jsx(StatusBadge, {
						status: d.status,
						label: d.status === "invoiced" ? "Approved · invoiced" : void 0
					}) : null
				]
			}), /* @__PURE__ */ jsx(DialogDescription, { children: "Review the items and totals before making a decision." })] }), d && /* @__PURE__ */ jsxs("div", {
				className: "space-y-4",
				children: [
					/* @__PURE__ */ jsx("ol", {
						className: "grid grid-cols-3 gap-2",
						children: STEPS.map((s, i) => {
							const done = i < stepIdx || i === stepIdx && i === 2;
							const current = i === stepIdx && i !== 2;
							const Icon = i === 2 && rejected ? XCircle : s.icon;
							return /* @__PURE__ */ jsxs("li", {
								className: cn("flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium", done ? rejected && i === 2 ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-success/30 bg-success/10 text-success" : current ? "border-primary/40 bg-primary/10 text-primary" : "border-border text-muted-foreground"),
								children: [/* @__PURE__ */ jsx(Icon, { className: "size-4" }), i === 2 && stepIdx === 2 ? rejected ? "Rejected" : "Approved" : s.label]
							}, s.key);
						})
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "grid grid-cols-2 gap-3 rounded-xl border border-border bg-muted/25 p-4 text-sm md:grid-cols-4",
						children: [
							/* @__PURE__ */ jsx(Info, {
								label: "Buyer / Department",
								value: d.departments?.name
							}),
							/* @__PURE__ */ jsx(Info, {
								label: "Date",
								value: d.quotation_date
							}),
							/* @__PURE__ */ jsx(Info, {
								label: "Valid until",
								value: d.valid_until ?? "—"
							}),
							/* @__PURE__ */ jsx(Info, {
								label: "Contact",
								value: d.contact_person ?? "—"
							}),
							/* @__PURE__ */ jsx(Info, {
								label: "Vehicle type",
								value: d.vehicle_type ?? "—"
							}),
							/* @__PURE__ */ jsx(Info, {
								label: "Vehicle number",
								value: d.vehicle_number ?? "—"
							}),
							d.invoices.length > 0 && /* @__PURE__ */ jsx(Info, {
								label: "Invoice",
								value: d.invoices[0]?.invoice_number,
								mono: true
							})
						]
					}),
					/* @__PURE__ */ jsx("div", {
						className: "overflow-hidden rounded-xl border border-border",
						children: /* @__PURE__ */ jsxs(Table, { children: [/* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
							/* @__PURE__ */ jsx(TableHead, { children: "HS code" }),
							/* @__PURE__ */ jsx(TableHead, { children: "Part no." }),
							/* @__PURE__ */ jsx(TableHead, { children: "Description" }),
							/* @__PURE__ */ jsx(TableHead, {
								className: "text-right",
								children: "Units"
							}),
							/* @__PURE__ */ jsx(TableHead, {
								className: "text-right",
								children: "Price"
							}),
							/* @__PURE__ */ jsx(TableHead, {
								className: "text-right",
								children: "Disc."
							}),
							/* @__PURE__ */ jsx(TableHead, {
								className: "text-right",
								children: "Sales Tax %"
							}),
							/* @__PURE__ */ jsx(TableHead, {
								className: "text-right",
								children: "Sales Tax Value"
							}),
							/* @__PURE__ */ jsx(TableHead, {
								className: "text-right",
								children: "Labor %"
							}),
							/* @__PURE__ */ jsx(TableHead, {
								className: "text-right",
								children: "Labor"
							}),
							/* @__PURE__ */ jsx(TableHead, {
								className: "text-right",
								children: "Total"
							})
						] }) }), /* @__PURE__ */ jsx(TableBody, { children: d.quotation_items.map((it) => /* @__PURE__ */ jsxs(TableRow, { children: [
							/* @__PURE__ */ jsx(TableCell, {
								className: "font-mono text-xs",
								children: it.hs_code
							}),
							/* @__PURE__ */ jsx(TableCell, { children: it.part_number ?? "—" }),
							/* @__PURE__ */ jsx(TableCell, { children: it.description }),
							/* @__PURE__ */ jsx(TableCell, {
								className: "text-right tabular-nums",
								children: it.quantity
							}),
							/* @__PURE__ */ jsx(TableCell, {
								className: "text-right tabular-nums",
								children: money(Number(it.unit_price))
							}),
							/* @__PURE__ */ jsx(TableCell, {
								className: "text-right tabular-nums",
								children: money(Number(it.discount))
							}),
							/* @__PURE__ */ jsx(TableCell, {
								className: "text-right tabular-nums",
								children: Number(it.tax_percent)
							}),
							/* @__PURE__ */ jsx(TableCell, {
								className: "text-right tabular-nums",
								children: money(Number(it.sales_tax_value))
							}),
							/* @__PURE__ */ jsx(TableCell, {
								className: "text-right tabular-nums",
								children: Number(it.labor_percent)
							}),
							/* @__PURE__ */ jsx(TableCell, {
								className: "text-right tabular-nums",
								children: money(Number(it.labor_amount))
							}),
							/* @__PURE__ */ jsx(TableCell, {
								className: "text-right font-semibold tabular-nums",
								children: money(Number(it.line_total))
							})
						] }, it.id)) })] })
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "grid gap-4 md:grid-cols-2",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "rounded-xl border border-border p-4",
							children: [
								/* @__PURE__ */ jsx("p", {
									className: "mb-3 font-heading text-sm font-semibold",
									children: "Approval history"
								}),
								history.length === 0 ? /* @__PURE__ */ jsx("p", {
									className: "text-xs text-muted-foreground",
									children: "No actions yet."
								}) : /* @__PURE__ */ jsx("ol", {
									className: "space-y-3 border-l border-border pl-4",
									children: history.map((h) => /* @__PURE__ */ jsxs("li", {
										className: "relative",
										children: [
											/* @__PURE__ */ jsx("span", { className: cn("absolute -left-[21px] top-1 size-2.5 rounded-full ring-4 ring-card", h.action === "approved" ? "bg-success" : h.action === "rejected" ? "bg-destructive" : "bg-warning") }),
											/* @__PURE__ */ jsx("p", {
												className: "text-sm font-medium capitalize",
												children: h.action === "submitted" ? "Submitted for approval" : h.action
											}),
											/* @__PURE__ */ jsx("p", {
												className: "text-xs text-muted-foreground",
												children: new Date(h.acted_at).toLocaleString()
											}),
											h.remarks ? /* @__PURE__ */ jsxs("p", {
												className: "mt-1 text-xs",
												children: [
													"“",
													h.remarks,
													"”"
												]
											}) : null
										]
									}, h.id))
								}),
								d.approval_remarks && !history.some((h) => h.remarks) ? /* @__PURE__ */ jsxs("p", {
									className: "mt-3 text-xs",
									children: ["Remarks: ", d.approval_remarks]
								}) : null
							]
						}), /* @__PURE__ */ jsx(SummaryBox, {
							sub: Number(d.subtotal),
							disc: Number(d.discount_total),
							tax: Number(d.tax_total),
							grand: Number(d.grand_total),
							labor: Number(d.labor_amount),
							laborPercent: Number(d.labor_percent),
							money
						})]
					}),
					d.status === "submitted" && /* @__PURE__ */ jsxs("div", {
						className: "space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-4",
						children: [
							/* @__PURE__ */ jsx("p", {
								className: "font-heading text-sm font-semibold",
								children: "Your decision"
							}),
							/* @__PURE__ */ jsx(Textarea, {
								placeholder: "Remarks (optional, required for rejection)",
								value: remarks,
								onChange: (e) => setRemarks(e.target.value)
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "flex flex-wrap justify-end gap-2",
								children: [/* @__PURE__ */ jsxs(Button, {
									variant: "outline",
									className: "border-destructive/40 text-destructive hover:bg-destructive/10",
									disabled: setStatus.isPending,
									onClick: () => {
										if (!remarks.trim()) {
											toast.error("Please add a reason for rejection");
											return;
										}
										setStatus.mutate({
											id,
											status: "rejected",
											remarks
										}, { onSuccess: onClose });
									},
									children: [/* @__PURE__ */ jsx(XCircle, { className: "size-4" }), "Reject"]
								}), /* @__PURE__ */ jsxs(Button, {
									className: "bg-success text-success-foreground hover:bg-success/90",
									disabled: setStatus.isPending,
									onClick: () => setStatus.mutate({
										id,
										status: "approved",
										remarks: remarks || void 0
									}, { onSuccess: onClose }),
									children: [/* @__PURE__ */ jsx(CheckCircle2, { className: "size-4" }), "Approve & create invoice"]
								})]
							})
						]
					}),
					d.status === "draft" && /* @__PURE__ */ jsx("div", {
						className: "flex justify-end",
						children: /* @__PURE__ */ jsxs(Button, {
							onClick: () => setStatus.mutate({
								id,
								status: "submitted"
							}, { onSuccess: onClose }),
							children: [/* @__PURE__ */ jsx(Send, { className: "size-4" }), "Submit for approval"]
						})
					})
				]
			})]
		})
	});
}
function Info({ label, value, mono }) {
	return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
		className: "text-[11px] uppercase tracking-wider text-muted-foreground",
		children: label
	}), /* @__PURE__ */ jsx("p", {
		className: cn("font-medium", mono && "font-mono"),
		children: value ?? "—"
	})] });
}
//#endregion
export { QuotationsPage as component };
