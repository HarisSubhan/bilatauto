import { a as db, n as Button } from "./bilal-logo.asset-DVM5nCcq.js";
import { t as Input } from "./input-BdVko9wQ.js";
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
		let active = true;
		const t = setTimeout(async () => {
			const term = `%${q.trim().replace(/[%,()]/g, "")}%`;
			const col = mode === "hs" ? "hs_code" : "description";
			const res = await Promise.all(sources.map(async (s) => {
				const { data } = await db.from(s === "fbr" ? "fbr_hs_codes" : "custom_hs_codes").select(s === "custom" ? "hs_code,description,type_of_goods" : "hs_code,description").ilike(col, term).limit(12);
				return (data ?? []).map((r) => ({
					...r,
					source: s
				}));
			}));
			if (active) setResults(res.flat());
		}, 250);
		return () => {
			active = false;
			clearTimeout(t);
		};
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
			"aria-label": mode === "hs" ? "HS code" : "HS description",
			placeholder: placeholder ?? (mode === "hs" ? "Type HS code…" : "Type HS description…"),
			onChange: (e) => {
				setQ(e.target.value);
				setOpen(true);
				onType?.(e.target.value);
			},
			onFocus: () => setOpen(true),
			onBlur: () => setTimeout(() => setOpen(false), 200)
		}), open && results.length > 0 && /* @__PURE__ */ jsx("div", {
			className: "absolute z-50 mt-1 max-h-64 w-[min(28rem,90vw)] overflow-auto rounded-md border bg-popover shadow-lg",
			children: results.map((r, i) => /* @__PURE__ */ jsxs(Button, {
				type: "button",
				variant: "ghost",
				className: "flex h-auto w-full justify-start gap-2 rounded-none px-3 py-2 text-left text-sm font-normal",
				onMouseDown: (e) => e.preventDefault(),
				onClick: () => {
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
						className: "min-w-0 whitespace-normal break-words text-muted-foreground",
						children: r.description
					})
				]
			}, i))
		})]
	});
}
//#endregion
export { HsCodePicker as t };
