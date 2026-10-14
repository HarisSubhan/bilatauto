import { a as db, n as Button } from "./bilal-logo.asset-DRcrRZxD.js";
import { d as DialogContent, f as DialogDescription, h as DialogTitle, m as DialogHeader, p as DialogFooter, t as AppShell, u as Dialog } from "./AppShell-Ctpjmt0k.js";
import { a as TableHeader, c as SelectContent, d as SelectValue, i as TableHead, l as SelectItem, n as TableBody, o as TableRow, r as TableCell, s as Select, t as Table, u as SelectTrigger } from "./table-C25g3iry.js";
import { n as downloadXlsx, r as readSpreadsheet, t as ImportDialog } from "./ImportDialog-CQDgewXd.js";
import { t as Input } from "./input-C4NJMa86.js";
import { t as Label } from "./label-7BUlW98B.js";
import { t as Textarea } from "./textarea-D9S4fcOx.js";
import { i as StatusBadge, o as TableState, r as RowActions, s as Toolbar } from "./kit-CL2daCzj.js";
import { i as useSelection, n as SelectAll, r as SelectOne, t as BulkActions } from "./bulk-Qbneul1_.js";
import { useMemo, useRef, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, Pencil, Plus, ShieldCheck, ShieldOff, Trash2, Upload } from "lucide-react";
//#region src/components/data/MasterPage.tsx
var PAGE_SIZES = [
	25,
	50,
	100
];
function MasterPage({ table, title, description, fields, searchFields, autoSerial }) {
	const qc = useQueryClient();
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(0);
	const [pageSize, setPageSize] = useState(25);
	const [editing, setEditing] = useState(null);
	const [formOpen, setFormOpen] = useState(false);
	const [form, setForm] = useState({});
	const fileRef = useRef(null);
	const [importData, setImportData] = useState(null);
	const sel = useSelection();
	const listFields = useMemo(() => fields.filter((f) => f.inList !== false), [fields]);
	const query = useQuery({
		queryKey: [
			table,
			search,
			page,
			pageSize
		],
		queryFn: async () => {
			let q = db.from(table).select("*", { count: "exact" }).order("created_at", { ascending: false }).range(page * pageSize, page * pageSize + pageSize - 1);
			if (search.trim()) {
				const term = search.trim().replace(/[%,]/g, "");
				q = q.or(searchFields.map((f) => `${f}.ilike.%${term}%`).join(","));
			}
			const { data, error, count } = await q;
			if (error) throw error;
			return {
				rows: data ?? [],
				count: count ?? 0
			};
		}
	});
	const invalidate = () => void qc.invalidateQueries({ queryKey: [table] });
	const save = useMutation({
		mutationFn: async (payload) => {
			if (editing) {
				const { error } = await db.from(table).update(payload).eq("id", editing["id"]);
				if (error) throw error;
			} else {
				const { error } = await db.from(table).insert(payload);
				if (error) throw error;
			}
		},
		onSuccess: () => {
			toast.success(editing ? "Record updated" : "Record added");
			setFormOpen(false);
			setEditing(null);
			invalidate();
		},
		onError: (e) => toast.error(e.message)
	});
	const setVerification = useMutation({
		mutationFn: async ({ id, value }) => {
			const { error } = await db.from(table).update({ verification: value }).eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			toast.success("Verification updated");
			invalidate();
		},
		onError: (e) => toast.error(e.message)
	});
	const remove = useMutation({
		mutationFn: async (id) => {
			const { error } = await db.from(table).delete().eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			toast.success("Record deleted");
			invalidate();
		},
		onError: (e) => toast.error(e.message)
	});
	const importRows = async (payload) => {
		for (let i = 0; i < payload.length; i += 500) {
			const { error } = await db.from(table).insert(payload.slice(i, i + 500));
			if (error) throw error;
		}
		toast.success(`${payload.length} records imported`);
		invalidate();
	};
	const openNew = () => {
		setEditing(null);
		setForm({});
		setFormOpen(true);
	};
	const openEdit = (row) => {
		setEditing(row);
		const next = {};
		for (const f of fields) next[f.key] = row[f.key] == null ? "" : String(row[f.key]);
		setForm(next);
		setFormOpen(true);
	};
	const submit = async () => {
		const payload = {};
		if (autoSerial && !editing) {
			const { data } = await db.from(table).select(autoSerial);
			const max = (data ?? []).reduce((m, r) => {
				const n = parseInt(String(r[autoSerial] ?? ""), 10);
				return Number.isFinite(n) && n > m ? n : m;
			}, 0);
			payload[autoSerial] = String(max + 1);
		}
		for (const f of fields) {
			if (f.key === autoSerial) continue;
			const raw = form[f.key] ?? "";
			if (f.required && !raw.trim()) {
				toast.error(`${f.label} is required`);
				return;
			}
			payload[f.key] = f.type === "number" ? raw === "" ? null : Number(raw) : raw === "" ? null : raw;
		}
		save.mutate(payload);
	};
	const rows = query.data?.rows ?? [];
	const total = query.data?.count ?? 0;
	const pages = Math.max(1, Math.ceil(total / pageSize));
	return /* @__PURE__ */ jsxs(AppShell, {
		title,
		description,
		actions: /* @__PURE__ */ jsxs(Button, {
			onClick: openNew,
			size: "sm",
			children: [/* @__PURE__ */ jsx(Plus, { className: "mr-1 size-4" }), " Add"]
		}),
		children: [/* @__PURE__ */ jsxs("div", {
			className: "panel overflow-hidden",
			children: [
				/* @__PURE__ */ jsx(Toolbar, {
					search,
					onSearch: (v) => {
						setSearch(v);
						setPage(0);
					},
					placeholder: `Search ${title.toLowerCase()}…`,
					children: /* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-2",
						children: [
							/* @__PURE__ */ jsx(Button, {
								variant: "outline",
								size: "sm",
								onClick: () => downloadXlsx(`${table}-template.xlsx`, [], fields.map((f) => f.key)),
								children: "Template"
							}),
							/* @__PURE__ */ jsxs(Button, {
								variant: "outline",
								size: "sm",
								onClick: () => downloadXlsx(`${table}-export.xlsx`, rows, fields.map((f) => f.key)),
								children: [/* @__PURE__ */ jsx(Download, { className: "mr-1 size-4" }), " Export"]
							}),
							/* @__PURE__ */ jsxs(Button, {
								variant: "outline",
								size: "sm",
								onClick: () => fileRef.current?.click(),
								children: [/* @__PURE__ */ jsx(Upload, { className: "mr-1 size-4" }), " Import"]
							}),
							/* @__PURE__ */ jsx("input", {
								ref: fileRef,
								type: "file",
								accept: ".csv,.xlsx,.xls",
								className: "hidden",
								onChange: async (e) => {
									const file = e.target.files?.[0];
									if (!file) return;
									e.target.value = "";
									const parsed = await readSpreadsheet(file);
									if (!parsed.length) {
										toast.error("No rows found in the file");
										return;
									}
									setImportData(parsed);
								}
							})
						]
					})
				}),
				importData ? /* @__PURE__ */ jsx(ImportDialog, {
					rows: importData,
					fields,
					onClose: () => setImportData(null),
					onImport: importRows
				}) : null,
				/* @__PURE__ */ jsx(BulkActions, {
					table,
					s: sel
				}),
				/* @__PURE__ */ jsx("div", {
					className: "overflow-x-auto",
					children: /* @__PURE__ */ jsxs(Table, { children: [/* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
						/* @__PURE__ */ jsx(TableHead, {
							className: "w-8",
							children: /* @__PURE__ */ jsx(SelectAll, {
								ids: rows.map((r) => String(r["id"])),
								s: sel
							})
						}),
						listFields.map((f) => /* @__PURE__ */ jsx(TableHead, { children: f.label }, f.key)),
						/* @__PURE__ */ jsx(TableHead, { children: "Status" }),
						/* @__PURE__ */ jsx(TableHead, {
							className: "text-right",
							children: "Actions"
						})
					] }) }), /* @__PURE__ */ jsxs(TableBody, { children: [/* @__PURE__ */ jsx(TableState, {
						cols: listFields.length + 3,
						loading: query.isLoading,
						error: query.error ? query.error.message : null,
						empty: !query.isLoading && rows.length === 0,
						title: search ? "No matching records" : "No records yet",
						hint: search ? "Try a different search term." : `Add your first record or import a spreadsheet.`
					}), rows.map((row, idx) => {
						const verified = row["verification"] === "verified";
						const id = String(row["id"]);
						return /* @__PURE__ */ jsxs(TableRow, {
							className: idx % 2 ? "bg-muted/20" : void 0,
							children: [
								/* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx(SelectOne, {
									id,
									s: sel
								}) }),
								listFields.map((f, i) => /* @__PURE__ */ jsx(TableCell, {
									className: `max-w-[320px] truncate ${i === 0 ? "font-medium" : ""} ${f.key.includes("code") ? "font-mono text-xs" : ""}`,
									children: row[f.key] == null || row[f.key] === "" ? /* @__PURE__ */ jsx("span", {
										className: "text-muted-foreground",
										children: "—"
									}) : String(row[f.key])
								}, f.key)),
								/* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx(StatusBadge, { status: String(row["verification"] ?? "unverified") }) }),
								/* @__PURE__ */ jsx(TableCell, {
									className: "text-right",
									children: /* @__PURE__ */ jsx(RowActions, { actions: [
										{
											label: "Edit",
											icon: Pencil,
											onClick: () => openEdit(row)
										},
										verified ? {
											label: "Unverify",
											icon: ShieldOff,
											onClick: () => setVerification.mutate({
												id,
												value: "unverified"
											})
										} : {
											label: "Verify",
											icon: ShieldCheck,
											onClick: () => setVerification.mutate({
												id,
												value: "verified"
											})
										},
										{
											label: "Delete",
											icon: Trash2,
											danger: true,
											separator: true,
											hidden: verified,
											onClick: () => confirm("Delete this record?") && remove.mutate(id)
										}
									] })
								})
							]
						}, id);
					})] })] })
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "flex flex-wrap items-center gap-3 border-t border-border p-4 text-sm",
					children: [
						/* @__PURE__ */ jsxs("span", {
							className: "text-muted-foreground",
							children: [total, " records"]
						}),
						/* @__PURE__ */ jsxs(Select, {
							value: String(pageSize),
							onValueChange: (v) => {
								setPageSize(Number(v));
								setPage(0);
							},
							children: [/* @__PURE__ */ jsx(SelectTrigger, {
								className: "w-28",
								children: /* @__PURE__ */ jsx(SelectValue, {})
							}), /* @__PURE__ */ jsx(SelectContent, { children: PAGE_SIZES.map((s) => /* @__PURE__ */ jsxs(SelectItem, {
								value: String(s),
								children: [s, " / page"]
							}, s)) })]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "ml-auto flex items-center gap-2",
							children: [
								/* @__PURE__ */ jsx(Button, {
									variant: "outline",
									size: "sm",
									disabled: page === 0,
									onClick: () => setPage((p) => p - 1),
									children: "Previous"
								}),
								/* @__PURE__ */ jsxs("span", {
									className: "text-muted-foreground",
									children: [
										"Page ",
										page + 1,
										" of ",
										pages
									]
								}),
								/* @__PURE__ */ jsx(Button, {
									variant: "outline",
									size: "sm",
									disabled: page + 1 >= pages,
									onClick: () => setPage((p) => p + 1),
									children: "Next"
								})
							]
						})
					]
				})
			]
		}), /* @__PURE__ */ jsx(Dialog, {
			open: formOpen,
			onOpenChange: setFormOpen,
			children: /* @__PURE__ */ jsxs(DialogContent, {
				className: "max-h-[85vh] overflow-y-auto sm:max-w-2xl",
				children: [
					/* @__PURE__ */ jsxs(DialogHeader, { children: [/* @__PURE__ */ jsx(DialogTitle, { children: editing ? `Edit ${title}` : `Add ${title}` }), /* @__PURE__ */ jsx(DialogDescription, { children: "Fields marked with * are required." })] }),
					/* @__PURE__ */ jsx("div", {
						className: "grid gap-4 sm:grid-cols-2",
						children: fields.filter((f) => f.key !== autoSerial).map((f) => /* @__PURE__ */ jsxs("div", {
							className: f.type === "textarea" ? "sm:col-span-2" : void 0,
							children: [/* @__PURE__ */ jsxs(Label, {
								htmlFor: f.key,
								children: [f.label, f.required ? " *" : ""]
							}), f.type === "textarea" ? /* @__PURE__ */ jsx(Textarea, {
								id: f.key,
								value: form[f.key] ?? "",
								onChange: (e) => setForm((s) => ({
									...s,
									[f.key]: e.target.value
								}))
							}) : f.type === "select" ? /* @__PURE__ */ jsxs(Select, {
								value: form[f.key] ?? "",
								onValueChange: (v) => setForm((s) => ({
									...s,
									[f.key]: v
								})),
								children: [/* @__PURE__ */ jsx(SelectTrigger, {
									id: f.key,
									children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Select" })
								}), /* @__PURE__ */ jsx(SelectContent, { children: (f.options ?? []).map((o) => /* @__PURE__ */ jsx(SelectItem, {
									value: o,
									className: "capitalize",
									children: o.replace(/_/g, " ")
								}, o)) })]
							}) : /* @__PURE__ */ jsx(Input, {
								id: f.key,
								type: f.type === "number" ? "number" : f.type === "email" ? "email" : "text",
								placeholder: f.placeholder,
								value: form[f.key] ?? "",
								onChange: (e) => setForm((s) => ({
									...s,
									[f.key]: e.target.value
								}))
							})]
						}, f.key))
					}),
					/* @__PURE__ */ jsxs(DialogFooter, { children: [/* @__PURE__ */ jsx(Button, {
						variant: "outline",
						onClick: () => setFormOpen(false),
						children: "Cancel"
					}), /* @__PURE__ */ jsx(Button, {
						onClick: submit,
						disabled: save.isPending,
						children: save.isPending ? "Saving..." : "Save"
					})] })
				]
			})
		})]
	});
}
//#endregion
export { MasterPage as t };
