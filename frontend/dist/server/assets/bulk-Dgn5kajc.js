import { a as db, n as Button } from "./bilal-logo.asset-DVM5nCcq.js";
import { t as BulkBar } from "./kit-4pQ21Dd3.js";
import { t as Checkbox } from "./checkbox-C4v7NccO.js";
import { useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileDown, ShieldCheck, ShieldOff, Trash2 } from "lucide-react";
//#region src/components/data/bulk.tsx
function useSelection() {
	const [sel, setSel] = useState(/* @__PURE__ */ new Set());
	const toggle = (id) => setSel((s) => {
		const n = new Set(s);
		if (n.has(id)) n.delete(id);
		else n.add(id);
		return n;
	});
	const setAll = (ids, on) => setSel(on ? new Set(ids) : /* @__PURE__ */ new Set());
	return {
		sel,
		ids: [...sel],
		toggle,
		setAll,
		clear: () => setSel(/* @__PURE__ */ new Set())
	};
}
function SelectAll({ ids, s }) {
	return /* @__PURE__ */ jsx(Checkbox, {
		"aria-label": "Select all",
		checked: ids.length > 0 && ids.every((i) => s.sel.has(i)),
		onCheckedChange: (v) => s.setAll(ids, !!v)
	});
}
function SelectOne({ id, s }) {
	return /* @__PURE__ */ jsx(Checkbox, {
		"aria-label": "Select row",
		checked: s.sel.has(id),
		onCheckedChange: () => s.toggle(id),
		onClick: (e) => e.stopPropagation()
	});
}
/** Bulk verify / unverify / delete. Verified records are never deleted (database rule). */
function BulkActions({ table, s, onPdf, canDelete = true, allowVerifiedDelete = false }) {
	const qc = useQueryClient();
	const [busy, setBusy] = useState(false);
	const run = async (fn) => {
		setBusy(true);
		try {
			toast.success(await fn());
			s.clear();
			await qc.invalidateQueries();
		} catch (e) {
			toast.error(e.message);
		} finally {
			setBusy(false);
		}
	};
	const verify = (v) => run(async () => {
		for (const id of s.ids) {
			const { error } = await db.from(table).update({ verification: v }).eq("id", id);
			if (error) throw error;
		}
		return `${s.ids.length} record(s) ${v}`;
	});
	const del = () => {
		if (!confirm(`Delete ${s.ids.length} selected record(s)? ${allowVerifiedDelete ? "Existing documents and history will be kept." : "Verified records are skipped."}`)) return;
		run(async () => {
			const { data } = await db.from(table).select("id,verification").in("id", s.ids);
			const ok = (data ?? []).filter((r) => allowVerifiedDelete || r.verification !== "verified").map((r) => r.id);
			if (ok.length) {
				const { error } = await db.from(table).delete().in("id", ok);
				if (error) throw error;
			}
			const skipped = s.ids.length - ok.length;
			return `${ok.length} deleted${skipped ? ` · ${skipped} verified record(s) kept` : ""}`;
		});
	};
	return /* @__PURE__ */ jsxs(BulkBar, {
		count: s.ids.length,
		onClear: s.clear,
		children: [
			onPdf ? /* @__PURE__ */ jsxs(Button, {
				size: "sm",
				variant: "outline",
				disabled: busy,
				onClick: () => run(async () => {
					await onPdf(s.ids);
					return "PDF downloaded";
				}),
				children: [/* @__PURE__ */ jsx(FileDown, { className: "size-4" }), "Download PDF"]
			}) : null,
			/* @__PURE__ */ jsxs(Button, {
				size: "sm",
				variant: "outline",
				disabled: busy,
				onClick: () => verify("verified"),
				children: [/* @__PURE__ */ jsx(ShieldCheck, { className: "size-4" }), "Verify"]
			}),
			/* @__PURE__ */ jsxs(Button, {
				size: "sm",
				variant: "outline",
				disabled: busy,
				onClick: () => verify("unverified"),
				children: [/* @__PURE__ */ jsx(ShieldOff, { className: "size-4" }), "Unverify"]
			}),
			canDelete ? /* @__PURE__ */ jsxs(Button, {
				size: "sm",
				variant: "outline",
				className: "text-destructive",
				disabled: busy,
				onClick: del,
				children: [/* @__PURE__ */ jsx(Trash2, { className: "size-4" }), "Delete"]
			}) : null
		]
	});
}
//#endregion
export { useSelection as i, SelectAll as n, SelectOne as r, BulkActions as t };
