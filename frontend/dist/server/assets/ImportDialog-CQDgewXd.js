import { n as Button } from "./bilal-logo.asset-DRcrRZxD.js";
import { d as DialogContent, f as DialogDescription, h as DialogTitle, m as DialogHeader, u as Dialog } from "./AppShell-Ctpjmt0k.js";
import { a as TableHeader, c as SelectContent, d as SelectValue, i as TableHead, l as SelectItem, n as TableBody, o as TableRow, r as TableCell, s as Select, t as Table, u as SelectTrigger } from "./table-C25g3iry.js";
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
	const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
	const sheet = wb.Sheets[wb.SheetNames[0] ?? ""];
	if (!sheet) return [];
	return XLSX.utils.sheet_to_json(sheet, {
		defval: "",
		raw: false
	}).map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k.trim(), String(v ?? "").trim()])));
}
function downloadXlsx(filename, rows, headers) {
	const ws = XLSX.utils.json_to_sheet(rows.map((r) => Object.fromEntries(headers.map((h) => [h, r[h] ?? ""]))), { header: headers });
	const wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(wb, ws, "Data");
	XLSX.writeFile(wb, filename);
}
function ImportDialog({ rows, fields, onClose, onImport }) {
	const columns = useMemo(() => Object.keys(rows[0] ?? {}), [rows]);
	const [map, setMap] = useState(() => Object.fromEntries(fields.map((f) => [f.key, columns.find((c) => norm(c) === norm(f.key) || norm(c) === norm(f.label)) ?? columns.find((c) => norm(c).includes(norm(f.label)) || norm(f.label).includes(norm(c))) ?? columns.find((c) => (SYN[f.key] ?? []).includes(norm(c))) ?? SKIP])));
	const [busy, setBusy] = useState(false);
	const mapped = useMemo(() => rows.map((r) => {
		const o = {};
		for (const f of fields) {
			const col = map[f.key];
			if (!col || col === SKIP) continue;
			const v = r[col] ?? "";
			if (v === "") continue;
			o[f.key] = f.type === "number" ? Number(String(v).replace(/,/g, "")) : v;
		}
		return o;
	}).filter((o) => Object.keys(o).length > 0), [
		rows,
		fields,
		map
	]);
	const missing = fields.filter((f) => f.required && (!map[f.key] || map[f.key] === SKIP));
	const invalid = mapped.filter((o) => fields.some((f) => f.required && (o[f.key] === void 0 || o[f.key] === ""))).length;
	const run = async () => {
		setBusy(true);
		try {
			await onImport(mapped.filter((o) => fields.every((f) => !f.required || o[f.key] !== void 0 && o[f.key] !== "")));
			onClose();
		} catch (e) {
			toast.error(e.message);
		} finally {
			setBusy(false);
		}
	};
	return /* @__PURE__ */ jsx(Dialog, {
		open: true,
		onOpenChange: (o) => !o && onClose(),
		children: /* @__PURE__ */ jsxs(DialogContent, {
			className: "max-w-4xl",
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
				/* @__PURE__ */ jsxs("div", {
					className: "flex items-center justify-between gap-3",
					children: [/* @__PURE__ */ jsx("p", {
						className: "text-sm text-muted-foreground",
						children: missing.length ? `Required: ${missing.map((m) => m.label).join(", ")}` : invalid ? `${invalid} rows missing required values will be skipped` : "Ready to import"
					}), /* @__PURE__ */ jsx(Button, {
						disabled: busy || missing.length > 0,
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
