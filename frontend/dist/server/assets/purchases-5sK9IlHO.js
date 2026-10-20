import { a as db, n as Button } from "./bilal-logo.asset-BEz_DQLU.js";
import { d as DialogContent, h as DialogTitle, m as DialogHeader, p as DialogFooter, t as AppShell, u as Dialog } from "./AppShell-DTDjlCau.js";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-MFYILeGF.js";
import { a as TableHeader, i as TableHead, n as TableBody, o as TableRow, r as TableCell, t as Table } from "./table-BISuKeg0.js";
import { t as DataTools } from "./DataTools-C5II5dxL.js";
import { r as documentLineSchema, t as calculateLine } from "./document-calculations-B6gNwPBL.js";
import { c as purchaseFields, i as importPurchases, t as flatten } from "./doc-import-BTxB3kp8.js";
import { t as Input } from "./input-CdXJHMPP.js";
import { t as Label } from "./label-Dq4-HTAg.js";
import { t as Textarea } from "./textarea-D_09KXFL.js";
import { a as SummaryBox, i as StatusBadge, n as FormSection, o as TableState, r as RowActions, s as Toolbar } from "./kit-gGcW_pA6.js";
import { i as dateRange, o as useOptions, r as MultiPick, t as DateFilter } from "./DocFilters-Bv4LkwoI.js";
import { i as useSelection, n as SelectAll, r as SelectOne, t as BulkActions } from "./bulk-Bhth6Vjl.js";
import { t as LineItems } from "./LineItems-DYaa4XRl.js";
import { useState } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, Plus, ShieldCheck, ShieldOff, Trash2 } from "lucide-react";
//#region src/routes/_authenticated/purchases.tsx?tsr-split=component
var emptyLine = () => ({
	product_name: "",
	type_of_goods: "",
	retail_sales_value: 0,
	hs_code: "",
	part_number: "",
	description: "",
	description_source: "fbr",
	uom: "",
	quantity: 1,
	unit_cost: 0,
	discount: 0,
	tax_percent: 0
});
var lineCalc = (l) => calculateLine(l, l.unit_cost);
var money = (n) => n.toLocaleString(void 0, {
	minimumFractionDigits: 2,
	maximumFractionDigits: 2
});
function PurchasesPage() {
	const qc = useQueryClient();
	const [search, setSearch] = useState("");
	const [creating, setCreating] = useState(false);
	const [viewId, setViewId] = useState(null);
	const [sups, setSups] = useState([]);
	const [df, setDf] = useState({
		preset: "all",
		from: "",
		to: ""
	});
	const supOpts = useOptions("suppliers");
	const s = useSelection();
	const list = useQuery({
		queryKey: [
			"purchases",
			search,
			sups,
			df
		],
		queryFn: async () => {
			let q = db.from("purchases").select("*, suppliers(name)").order("created_at", { ascending: false }).limit(200);
			const term = search.trim().replace(/[%,()]/g, "");
			if (term) q = q.or(`purchase_number.ilike.%${term}%,bill_number.ilike.%${term}%,reference_number.ilike.%${term}%`);
			if (sups.length) q = q.in("supplier_id", sups);
			const r = dateRange(df);
			if (r.from) q = q.gte("purchase_date", r.from);
			if (r.to) q = q.lte("purchase_date", r.to);
			const { data, error } = await q;
			if (error) throw error;
			return data;
		}
	});
	const setVerify = useMutation({
		mutationFn: async ({ id, v }) => {
			const { error } = await db.from("purchases").update({ verification: v }).eq("id", id);
			if (error) throw error;
		},
		onSuccess: (_, { v }) => {
			toast.success(v === "verified" ? "Verified — stock added" : "Unverified — stock reversed");
			qc.invalidateQueries();
		},
		onError: (e) => toast.error(e.message)
	});
	const del = useMutation({
		mutationFn: async (id) => {
			const { error } = await db.from("purchases").delete().eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			toast.success("Deleted");
			qc.invalidateQueries({ queryKey: ["purchases"] });
		},
		onError: (e) => toast.error(e.message)
	});
	return /* @__PURE__ */ jsxs(AppShell, {
		title: "Purchases",
		description: "Verifying a purchase automatically adds its items to stock",
		actions: /* @__PURE__ */ jsxs(Button, {
			size: "sm",
			onClick: () => setCreating(true),
			children: [/* @__PURE__ */ jsx(Plus, { className: "size-4" }), "New purchase"]
		}),
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "panel overflow-hidden",
				children: [
					/* @__PURE__ */ jsx(Toolbar, {
						search,
						onSearch: setSearch,
						placeholder: "Search number, bill or reference…",
						children: /* @__PURE__ */ jsx(DataTools, {
							name: "purchases",
							fields: purchaseFields,
							exportRows: async () => {
								const { data, error } = await db.from("purchases").select("*, suppliers(name,tax_number), purchase_items(*)").order("purchase_date");
								if (error) throw error;
								return flatten(data, "purchase_items", (d) => ({
									ref: d["purchase_number"],
									purchase_date: d["purchase_date"],
									supplier_ntn: d["supplier_ntn"] ?? d["suppliers"]?.tax_number,
									supplier: d["supplier_name"] ?? d["suppliers"]?.name,
									bill_number: d["bill_number"]
								}));
							},
							onImport: async (rows) => {
								const m = await importPurchases(rows);
								await qc.invalidateQueries({ queryKey: ["purchases"] });
								return m;
							}
						})
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "flex flex-wrap items-center gap-2 border-b border-border px-4 py-2",
						children: [/* @__PURE__ */ jsx(MultiPick, {
							label: "suppliers",
							options: supOpts.data ?? [],
							value: sups,
							onChange: setSups
						}), /* @__PURE__ */ jsx(DateFilter, {
							value: df,
							onChange: setDf
						})]
					}),
					/* @__PURE__ */ jsx(BulkActions, {
						table: "purchases",
						s
					}),
					/* @__PURE__ */ jsx("div", {
						className: "overflow-x-auto",
						children: /* @__PURE__ */ jsxs(Table, { children: [/* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
							/* @__PURE__ */ jsx(TableHead, {
								className: "w-8",
								children: /* @__PURE__ */ jsx(SelectAll, {
									ids: (list.data ?? []).map((r) => r.id),
									s
								})
							}),
							/* @__PURE__ */ jsx(TableHead, { children: "Number" }),
							/* @__PURE__ */ jsx(TableHead, { children: "Date" }),
							/* @__PURE__ */ jsx(TableHead, { children: "Supplier" }),
							/* @__PURE__ */ jsx(TableHead, { children: "Bill No." }),
							/* @__PURE__ */ jsx(TableHead, {
								className: "text-right",
								children: "Total"
							}),
							/* @__PURE__ */ jsx(TableHead, { children: "Status" }),
							/* @__PURE__ */ jsx(TableHead, { className: "w-12" })
						] }) }), /* @__PURE__ */ jsxs(TableBody, { children: [/* @__PURE__ */ jsx(TableState, {
							cols: 8,
							loading: list.isLoading,
							empty: !list.isLoading && (list.data?.length ?? 0) === 0,
							title: "No purchases found",
							hint: "Record a supplier purchase, then verify it to add stock."
						}), (list.data ?? []).map((p) => /* @__PURE__ */ jsxs(TableRow, { children: [
							/* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx(SelectOne, {
								id: p.id,
								s
							}) }),
							/* @__PURE__ */ jsx(TableCell, {
								className: "font-mono",
								children: p.purchase_number
							}),
							/* @__PURE__ */ jsx(TableCell, { children: p.purchase_date }),
							/* @__PURE__ */ jsx(TableCell, { children: p.suppliers?.name }),
							/* @__PURE__ */ jsx(TableCell, { children: p.bill_number }),
							/* @__PURE__ */ jsx(TableCell, {
								className: "text-right",
								children: money(Number(p.grand_total))
							}),
							/* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx(StatusBadge, { status: p.verification }) }),
							/* @__PURE__ */ jsx(TableCell, {
								className: "text-right",
								children: /* @__PURE__ */ jsx(RowActions, { actions: [
									{
										label: "View",
										icon: Eye,
										onClick: () => setViewId(p.id)
									},
									p.verification === "verified" ? {
										label: "Unverify (reverse stock)",
										icon: ShieldOff,
										onClick: () => setVerify.mutate({
											id: p.id,
											v: "unverified"
										})
									} : {
										label: "Verify & add stock",
										icon: ShieldCheck,
										onClick: () => setVerify.mutate({
											id: p.id,
											v: "verified"
										})
									},
									{
										label: "Delete",
										icon: Trash2,
										danger: true,
										separator: true,
										hidden: p.verification === "verified",
										onClick: () => confirm("Delete this purchase?") && del.mutate(p.id)
									}
								] })
							})
						] }, p.id))] })] })
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "border-t border-border p-4 text-right text-sm font-semibold",
						children: [
							(list.data ?? []).length,
							" records · Total ",
							money((list.data ?? []).reduce((a, r) => a + Number(r.grand_total), 0))
						]
					})
				]
			}),
			creating && /* @__PURE__ */ jsx(PurchaseForm, { onClose: () => setCreating(false) }),
			viewId && /* @__PURE__ */ jsx(PurchaseView, {
				id: viewId,
				onClose: () => setViewId(null)
			})
		]
	});
}
function PurchaseForm({ onClose }) {
	const qc = useQueryClient();
	const [supplierId, setSupplierId] = useState("");
	const [date, setDate] = useState((/* @__PURE__ */ new Date()).toISOString().slice(0, 10));
	const [bill, setBill] = useState("");
	const [ref, setRef] = useState("");
	const [notes, setNotes] = useState("");
	const [lines, setLines] = useState([emptyLine()]);
	const suppliers = useQuery({
		queryKey: ["supplier-options"],
		queryFn: async () => (await db.from("suppliers").select("id,name,tax_number").eq("status", "active").order("name")).data ?? []
	});
	const upd = (i, patch) => setLines((ls) => ls.map((l, j) => j === i ? {
		...l,
		...patch
	} : l));
	const totals = lines.reduce((a, l) => {
		const c = lineCalc(l);
		return {
			sub: a.sub + l.quantity * l.unit_cost,
			disc: a.disc + l.discount,
			tax: a.tax + c.tax,
			grand: a.grand + c.total
		};
	}, {
		sub: 0,
		disc: 0,
		tax: 0,
		grand: 0
	});
	const save = useMutation({
		mutationFn: async () => {
			if (!bill.trim()) throw new Error("Purchase Invoice Number is required");
			if (!supplierId) throw new Error("Select a supplier");
			if (!lines.length || lines.length > 200) throw new Error("Add between 1 and 200 items");
			const valid = lines.map((l) => documentLineSchema.parse(l));
			const { error } = await db.rpc("create_document", {
				_kind: "purchase",
				_header: {
					supplier_id: supplierId,
					date,
					bill_number: bill,
					reference_number: ref,
					notes
				},
				_items: valid
			});
			if (error) throw error;
		},
		onSuccess: () => {
			toast.success("Purchase saved");
			qc.invalidateQueries({ queryKey: ["purchases"] });
			onClose();
		},
		onError: (e) => toast.error(e.message)
	});
	return /* @__PURE__ */ jsx(Dialog, {
		open: true,
		onOpenChange: (o) => !o && onClose(),
		children: /* @__PURE__ */ jsxs(DialogContent, {
			className: "max-h-[90vh] max-w-6xl overflow-auto",
			children: [
				/* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: "New Purchase" }) }),
				/* @__PURE__ */ jsxs(FormSection, {
					title: "1. Supplier & bill",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "grid gap-3 md:grid-cols-4",
						children: [
							/* @__PURE__ */ jsxs("div", {
								className: "space-y-1",
								children: [/* @__PURE__ */ jsx(Label, { children: "Supplier *" }), /* @__PURE__ */ jsxs(Select, {
									value: supplierId,
									onValueChange: setSupplierId,
									children: [/* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Select supplier" }) }), /* @__PURE__ */ jsx(SelectContent, { children: (suppliers.data ?? []).map((s) => /* @__PURE__ */ jsx(SelectItem, {
										value: s.id,
										children: s.name
									}, s.id)) })]
								})]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "space-y-1",
								children: [/* @__PURE__ */ jsx(Label, { children: "Date" }), /* @__PURE__ */ jsx(Input, {
									type: "date",
									value: date,
									onChange: (e) => setDate(e.target.value)
								})]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "space-y-1",
								children: [/* @__PURE__ */ jsx(Label, { children: "Purchase Invoice Number *" }), /* @__PURE__ */ jsx(Input, {
									value: bill,
									onChange: (e) => setBill(e.target.value)
								})]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "space-y-1",
								children: [/* @__PURE__ */ jsx(Label, { children: "Reference No." }), /* @__PURE__ */ jsx(Input, {
									value: ref,
									onChange: (e) => setRef(e.target.value)
								})]
							})
						]
					}), /* @__PURE__ */ jsxs("div", {
						className: "mt-3",
						children: [/* @__PURE__ */ jsx(Label, { children: "Supplier NTN" }), /* @__PURE__ */ jsx(Input, {
							readOnly: true,
							value: suppliers.data?.find((s) => s.id === supplierId)?.tax_number ?? ""
						})]
					})]
				}),
				/* @__PURE__ */ jsx(FormSection, {
					title: "2. Items",
					hint: "Search an HS code by number or name, then choose the FBR or custom description.",
					children: /* @__PURE__ */ jsx(LineItems, {
						lines,
						upd,
						setLines,
						priceKey: "unit_cost"
					})
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "grid gap-4 md:grid-cols-2",
					children: [/* @__PURE__ */ jsx(FormSection, {
						title: "3. Notes",
						children: /* @__PURE__ */ jsx(Textarea, {
							placeholder: "Remarks…",
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
					children: "Save Purchase"
				})] })
			]
		})
	});
}
function PurchaseView({ id, onClose }) {
	const p = useQuery({
		queryKey: ["purchase", id],
		queryFn: async () => {
			const { data, error } = await db.from("purchases").select("*, suppliers(name,tax_number), purchase_items(*)").eq("id", id).single();
			if (error) throw error;
			return data;
		}
	}).data;
	return /* @__PURE__ */ jsx(Dialog, {
		open: true,
		onOpenChange: (o) => !o && onClose(),
		children: /* @__PURE__ */ jsxs(DialogContent, {
			className: "max-w-4xl",
			children: [/* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsxs(DialogTitle, { children: ["Purchase ", p?.purchase_number] }) }), p && /* @__PURE__ */ jsxs(Fragment, { children: [
				/* @__PURE__ */ jsxs("div", {
					className: "grid grid-cols-2 gap-2 text-sm md:grid-cols-4",
					children: [
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
							className: "text-muted-foreground",
							children: "Supplier"
						}), /* @__PURE__ */ jsx("div", { children: p.suppliers?.name })] }),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
							className: "text-muted-foreground",
							children: "Date"
						}), /* @__PURE__ */ jsx("div", { children: p.purchase_date })] }),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
							className: "text-muted-foreground",
							children: "Bill No."
						}), /* @__PURE__ */ jsx("div", { children: p.bill_number ?? "—" })] }),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("span", {
							className: "text-muted-foreground",
							children: "Status"
						}), /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx(StatusBadge, { status: p.verification }) })] })
					]
				}),
				/* @__PURE__ */ jsxs(Table, { children: [/* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
					/* @__PURE__ */ jsx(TableHead, { children: "HS Code" }),
					/* @__PURE__ */ jsx(TableHead, { children: "Part no." }),
					/* @__PURE__ */ jsx(TableHead, { children: "Description" }),
					/* @__PURE__ */ jsx(TableHead, { children: "Units" }),
					/* @__PURE__ */ jsx(TableHead, { children: "Unit Cost" }),
					/* @__PURE__ */ jsx(TableHead, {
						className: "text-right",
						children: "Total"
					})
				] }) }), /* @__PURE__ */ jsx(TableBody, { children: p.purchase_items.map((it) => /* @__PURE__ */ jsxs(TableRow, { children: [
					/* @__PURE__ */ jsx(TableCell, {
						className: "font-mono",
						children: it.hs_code
					}),
					/* @__PURE__ */ jsx(TableCell, { children: it.part_number ?? "—" }),
					/* @__PURE__ */ jsx(TableCell, { children: it.description }),
					/* @__PURE__ */ jsx(TableCell, { children: it.quantity }),
					/* @__PURE__ */ jsx(TableCell, { children: money(Number(it.unit_cost)) }),
					/* @__PURE__ */ jsx(TableCell, {
						className: "text-right",
						children: money(Number(it.line_total))
					})
				] }, it.id)) })] }),
				/* @__PURE__ */ jsxs("div", {
					className: "text-right text-lg font-bold",
					children: ["Grand Total: ", money(Number(p.grand_total))]
				})
			] })]
		})
	});
}
//#endregion
export { PurchasesPage as component };
