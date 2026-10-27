import { n as Button } from "./bilal-logo.asset-DVM5nCcq.js";
import { d as DialogContent, f as DialogDescription, h as DialogTitle, m as DialogHeader, u as Dialog } from "./AppShell-CbTTFVU-.js";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-GN_Kexq5.js";
import { a as TableHeader, i as TableHead, n as TableBody, o as TableRow, r as TableCell, t as Table } from "./table-ITrsg8wD.js";
import { useMemo, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { toast } from "sonner";
import * as XLSX from "xlsx";
//#region src/components/data/ImportDialog.tsx
var SKIP = "__skip__";
var norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
var SYN = {
	description: [
		"itemname",
		"item",
		"partname",
		"part",
		"name",
		"detail",
		"details",
		"product"
	],
	serial_number: [
		"sno",
		"srno",
		"sr",
		"serial",
		"no",
		"sn"
	],
	hs_code: [
		"code",
		"hscode",
		"hs",
		"pctcode",
		"pct"
	]
};
async function readSpreadsheet(file) {
	const wb = XLSX.read(await file.arrayBuffer(), {
		type: "array",
		cellDates: true
	});
	const sheet = wb.Sheets[wb.SheetNames[0] ?? ""];
	if (!sheet) return [];
	return XLSX.utils.sheet_to_json(sheet, {
		defval: "",
		raw: true
	}).map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k.trim(), v instanceof Date ? v.toISOString().slice(0, 10) : String(v ?? "").trim()])));
}
function downloadXlsx(filename, rows, headers) {
	const ws = XLSX.utils.json_to_sheet(rows.map((r) => Object.fromEntries(headers.map((h) => [h, r[h] ?? ""]))), { header: headers });
	const wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(wb, ws, "Data");
	XLSX.writeFile(wb, filename);
}
function ImportDialog({ rows, fields, onClose, onImport, grouped = false }) {
	const columns = useMemo(() => Object.keys(rows[0] ?? {}), [rows]);
	const [map, setMap] = useState(() => Object.fromEntries(fields.map((f) => [f.key, columns.find((c) => norm(c) === norm(f.key) || norm(c) === norm(f.label)) ?? columns.find((c) => norm(c).includes(norm(f.label)) || norm(f.label).includes(norm(c))) ?? columns.find((c) => (SYN[f.key] ?? []).includes(norm(c))) ?? SKIP])));
	const [busy, setBusy] = useState(false);
	const [importError, setImportError] = useState("");
	const mapped = useMemo(() => rows.map((r, index) => {
		const o = { _row: index + 2 };
		for (const f of fields) {
			const col = map[f.key];
			if (!col || col === SKIP) continue;
			const v = r[col] ?? "";
			if (v === "") continue;
			o[f.key] = f.type === "number" ? Number(String(v).replace(/,/g, "")) : v;
		}
		return o;
	}).filter((o) => Object.keys(o).length > 1), [
		rows,
		fields,
		map
	]);
	const missing = fields.filter((f) => f.required && (!map[f.key] || map[f.key] === SKIP));
	const invalid = grouped ? 0 : mapped.filter((o) => fields.some((f) => f.required && (o[f.key] === void 0 || o[f.key] === ""))).length;
	const run = async () => {
		setBusy(true);
		setImportError("");
		try {
			if (invalid) throw new Error(`${invalid} rows have missing required values. Correct the file before importing.`);
			await onImport(mapped);
			onClose();
		} catch (e) {
			setImportError(e.message);
			toast.error("Import rejected; no records were saved.");
		} finally {
			setBusy(false);
		}
	};
	return /* @__PURE__ */ jsx(Dialog, {
		open: true,
		onOpenChange: (o) => !o && onClose(),
		children: /* @__PURE__ */ jsxs(DialogContent, {
			className: "max-w-4xl max-h-[90vh] overflow-auto",
			children: [
				/* @__PURE__ */ jsxs(DialogHeader, { children: [/* @__PURE__ */ jsx(DialogTitle, { children: "Match columns" }), /* @__PURE__ */ jsxs(DialogDescription, { children: [rows.length, " rows found. Choose which column in your file goes into each field."] })] }),
				/* @__PURE__ */ jsx("div", {
					className: "grid gap-3 sm:grid-cols-2",
					children: fields.map((f) => /* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ jsxs("span", {
							className: "w-40 shrink-0 text-sm font-medium",
							children: [f.label, f.required ? " *" : ""]
						}), /* @__PURE__ */ jsxs(Select, {
							value: map[f.key] ?? SKIP,
							onValueChange: (v) => setMap({
								...map,
								[f.key]: v
							}),
							children: [/* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }), /* @__PURE__ */ jsxs(SelectContent, { children: [/* @__PURE__ */ jsx(SelectItem, {
								value: SKIP,
								children: "— Don't import —"
							}), columns.map((c) => /* @__PURE__ */ jsx(SelectItem, {
								value: c,
								children: c
							}, c))] })]
						})]
					}, f.key))
				}),
				/* @__PURE__ */ jsx("p", {
					className: "text-sm font-medium",
					children: "Preview (first 5 rows)"
				}),
				/* @__PURE__ */ jsx("div", {
					className: "max-h-56 overflow-auto rounded border",
					children: /* @__PURE__ */ jsxs(Table, { children: [/* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsx(TableRow, { children: fields.map((f) => /* @__PURE__ */ jsx(TableHead, { children: f.label }, f.key)) }) }), /* @__PURE__ */ jsx(TableBody, { children: mapped.slice(0, 5).map((o, i) => /* @__PURE__ */ jsx(TableRow, { children: fields.map((f) => /* @__PURE__ */ jsx(TableCell, { children: String(o[f.key] ?? "") }, f.key)) }, i)) })] })
				}),
				importError && /* @__PURE__ */ jsx("p", {
					role: "alert",
					className: "whitespace-pre-wrap border border-destructive p-3 text-sm text-destructive",
					children: importError
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "flex items-center justify-between gap-3",
					children: [/* @__PURE__ */ jsx("p", {
						className: "text-sm text-muted-foreground",
						children: missing.length ? `Required: ${missing.map((m) => m.label).join(", ")}` : invalid ? `${invalid} rows missing required values; nothing will be imported` : importError ? "Import rejected — no records saved" : "Ready to import"
					}), /* @__PURE__ */ jsx(Button, {
						disabled: busy || missing.length > 0 || invalid > 0,
						onClick: run,
						children: busy ? "Importing…" : `Import ${mapped.length - invalid} rows`
					})]
				})
			]
		})
	});
}
//#endregion
export { downloadXlsx as n, readSpreadsheet as r, ImportDialog as t };
