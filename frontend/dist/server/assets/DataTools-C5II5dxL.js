import { a as db, n as Button } from "./bilal-logo.asset-BEz_DQLU.js";
import { n as downloadXlsx, r as readSpreadsheet, t as ImportDialog } from "./ImportDialog-RfitToag.js";
import { useRef, useState } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { toast } from "sonner";
import { Download, FileSpreadsheet, Upload } from "lucide-react";
//#region src/components/data/DataTools.tsx
/** Template / Export / Import buttons used on every module screen. */
function DataTools({ name, fields, exportRows, onImport, template = true, exportFields = fields }) {
	const fileRef = useRef(null);
	const [rows, setRows] = useState(null);
	const labeled = [
		"purchases",
		"invoices",
		"sales-tax-invoices"
	].includes(name);
	const headers = exportFields.map((f) => labeled ? f.label : f.key);
	const templateDownload = async () => {
		if (!labeled) {
			downloadXlsx(`${name}-template.xlsx`, [], fields.map((f) => f.key));
			return;
		}
		try {
			const { data, error } = await db.rpc("document_template", { _kind: name === "purchases" ? "purchase" : "invoice" });
			if (error) throw new Error(error.message);
			const bytes = Uint8Array.from(atob(data.base64), (c) => c.charCodeAt(0));
			const url = URL.createObjectURL(new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
			const a = document.createElement("a");
			a.href = url;
			a.download = data.filename;
			a.click();
			setTimeout(() => URL.revokeObjectURL(url), 3e4);
		} catch (e) {
			toast.error(e.message);
		}
	};
	return /* @__PURE__ */ jsxs(Fragment, { children: [
		template ? /* @__PURE__ */ jsxs(Button, {
			size: "sm",
			variant: "outline",
			onClick: () => void templateDownload(),
			children: [/* @__PURE__ */ jsx(FileSpreadsheet, { className: "mr-1 size-4" }), " Template"]
		}) : null,
		/* @__PURE__ */ jsxs(Button, {
			size: "sm",
			variant: "outline",
			onClick: async () => {
				try {
					const data = await exportRows();
					if (!data.length) {
						toast.info("Nothing to export yet");
						return;
					}
					downloadXlsx(`${name}-export.xlsx`, labeled ? data.map((r) => Object.fromEntries(exportFields.map((f) => [f.label, r[f.key] ?? ""]))) : data, headers);
				} catch (e) {
					toast.error(e.message);
				}
			},
			children: [/* @__PURE__ */ jsx(Download, { className: "mr-1 size-4" }), " Export"]
		}),
		onImport ? /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsxs(Button, {
			size: "sm",
			variant: "outline",
			onClick: () => fileRef.current?.click(),
			children: [/* @__PURE__ */ jsx(Upload, { className: "mr-1 size-4" }), " Import"]
		}), /* @__PURE__ */ jsx("input", {
			ref: fileRef,
			type: "file",
			hidden: true,
			accept: ".csv,.xlsx,.xls",
			"aria-label": `Import ${name} file`,
			onChange: async (e) => {
				const f = e.target.files?.[0];
				e.target.value = "";
				if (!f) return void 0;
				const parsed = await readSpreadsheet(f);
				if (!parsed.length) {
					toast.error("The file has no rows");
					return;
				}
				setRows(parsed);
			}
		})] }) : null,
		rows && onImport ? /* @__PURE__ */ jsx(ImportDialog, {
			rows,
			grouped: labeled,
			fields,
			onClose: () => setRows(null),
			onImport: async (m) => {
				const msg = await onImport(m);
				toast.success(msg || `${m.length} rows imported`);
			}
		}) : null
	] });
}
//#endregion
export { DataTools as t };
