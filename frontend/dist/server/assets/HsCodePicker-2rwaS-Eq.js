import { a as db } from "./bilal-logo.asset-BEz_DQLU.js";
import { t as Input } from "./input-CdXJHMPP.js";
import { useEffect, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/components/data/HsCodePicker.tsx
/**
* Search HS codes by code ("hs") or description ("description").
* Quotations/invoices use the Custom list; FBR descriptions are applied on the Sales Tax Invoice.
*/
function HsCodePicker({ value, onPick, onType, mode = "hs", sources = ["custom", "fbr"], placeholder }) {
	const [q, setQ] = useState(value);
	const [open, setOpen] = useState(false);
	const [results, setResults] = useState([]);
	useEffect(() => setQ(value), [value]);
	useEffect(() => {
		if (!open || q.trim().length < 1) return setResults([]);
		const t = setTimeout(async () => {
			const term = `%${q.trim().replace(/[%,()]/g, "")}%`;
			const col = mode === "hs" ? "hs_code" : "description";
			const res = await Promise.all(sources.map(async (s) => {
				const { data } = await db.from(s === "fbr" ? "fbr_hs_codes" : "custom_hs_codes").select("hs_code,description").ilike(col, term).limit(12);
				return (data ?? []).map((r) => ({
					...r,
					source: s
				}));
			}));
			setResults(res.flat());
		}, 250);
		return () => clearTimeout(t);
	}, [
		q,
		open,
		mode,
		sources.join()
	]);
	return /* @__PURE__ */ jsxs("div", {
		className: "relative",
		children: [/* @__PURE__ */ jsx(Input, {
			value: q,
			placeholder: placeholder ?? (mode === "hs" ? "Type HS code…" : "Type product name…"),
			onChange: (e) => {
				setQ(e.target.value);
				setOpen(true);
				onType?.(e.target.value);
			},
			onFocus: () => setOpen(true),
			onBlur: () => setTimeout(() => setOpen(false), 200)
		}), open && results.length > 0 && /* @__PURE__ */ jsx("div", {
			className: "absolute z-50 mt-1 max-h-64 w-[min(28rem,90vw)] overflow-auto rounded-md border bg-popover shadow-lg",
			children: results.map((r, i) => /* @__PURE__ */ jsxs("button", {
				type: "button",
				className: "flex w-full gap-2 px-3 py-2 text-left text-sm hover:bg-accent",
				onMouseDown: () => {
					onPick(r);
					setQ(mode === "hs" ? r.hs_code : r.description);
					setOpen(false);
				},
				children: [
					sources.length > 1 && /* @__PURE__ */ jsx("span", {
						className: `shrink-0 rounded px-1.5 text-xs font-semibold uppercase ${r.source === "fbr" ? "bg-primary/15 text-primary" : "bg-secondary text-secondary-foreground"}`,
						children: r.source
					}),
					/* @__PURE__ */ jsx("span", {
						className: "font-mono",
						children: r.hs_code
					}),
					/* @__PURE__ */ jsx("span", {
						className: "truncate text-muted-foreground",
						children: r.description
					})
				]
			}, i))
		})]
	});
}
//#endregion
export { HsCodePicker as t };
