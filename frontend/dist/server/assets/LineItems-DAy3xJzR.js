import { n as Button } from "./bilal-logo.asset-DRcrRZxD.js";
import { t as calculateLine } from "./document-calculations-3hoJn7j-.js";
import { t as Input } from "./input-C4NJMa86.js";
import { t as Label } from "./label-7BUlW98B.js";
import { t as HsCodePicker } from "./HsCodePicker-CdENtd5d.js";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { Plus, X } from "lucide-react";
//#region src/components/data/LineItems.tsx
var money = (n) => n.toLocaleString(void 0, {
	minimumFractionDigits: 2,
	maximumFractionDigits: 2
});
/** One card per item. HS code ⇄ description auto-fill each other from the Custom HS list. */
function LineItems({ lines, upd, setLines, priceKey, labor = false }) {
	const calc = (l) => calculateLine(l, Number(l[priceKey] ?? 0));
	const pick = (i) => (p) => upd(i, {
		hs_code: p.hs_code,
		description: p.description,
		description_source: "custom"
	});
	return /* @__PURE__ */ jsxs("div", {
		className: "space-y-3",
		children: [lines.map((l, i) => /* @__PURE__ */ jsxs("div", {
			className: "rounded-lg border border-border bg-card p-3",
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "mb-2 flex items-center justify-between",
					children: [/* @__PURE__ */ jsxs("span", {
						className: "text-sm font-semibold",
						children: ["Item ", i + 1]
					}), /* @__PURE__ */ jsx(Button, {
						size: "icon",
						variant: "ghost",
						"aria-label": "Remove item",
						onClick: () => setLines((ls) => ls.filter((_, j) => j !== i)),
						disabled: lines.length === 1,
						children: /* @__PURE__ */ jsx(X, { className: "size-4" })
					})]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "grid gap-3 md:grid-cols-[10rem_1fr_9rem]",
					children: [
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, {
							className: "text-xs",
							children: "HS code"
						}), /* @__PURE__ */ jsx(HsCodePicker, {
							mode: "hs",
							sources: ["custom"],
							value: l.hs_code,
							onPick: pick(i),
							onType: (v) => upd(i, { hs_code: v })
						})] }),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, {
							className: "text-xs",
							children: "Product / description"
						}), /* @__PURE__ */ jsx(HsCodePicker, {
							mode: "description",
							sources: ["custom"],
							value: l.description,
							onPick: pick(i),
							onType: (v) => upd(i, { description: v })
						})] }),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, {
							className: "text-xs",
							children: "Part no. (optional)"
						}), /* @__PURE__ */ jsx(Input, {
							value: l.part_number,
							onChange: (e) => upd(i, { part_number: e.target.value })
						})] })
					]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: `mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 ${labor ? "lg:grid-cols-8" : "lg:grid-cols-6"}`,
					children: [
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, {
							className: "text-xs",
							children: "Units"
						}), /* @__PURE__ */ jsx(Input, {
							type: "number",
							min: 0,
							value: l.quantity,
							onChange: (e) => upd(i, { quantity: +e.target.value })
						})] }),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, {
							className: "text-xs",
							children: "Price"
						}), /* @__PURE__ */ jsx(Input, {
							type: "number",
							min: 0,
							value: Number(l[priceKey] ?? 0),
							onChange: (e) => upd(i, { [priceKey]: +e.target.value })
						})] }),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, {
							className: "text-xs",
							children: "Discount"
						}), /* @__PURE__ */ jsx(Input, {
							type: "number",
							min: 0,
							value: l.discount,
							onChange: (e) => upd(i, { discount: +e.target.value })
						})] }),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, {
							className: "text-xs",
							children: "Sales Tax %"
						}), /* @__PURE__ */ jsx(Input, {
							type: "number",
							min: 0,
							value: l.tax_percent,
							onChange: (e) => upd(i, { tax_percent: +e.target.value })
						})] }),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, {
							className: "text-xs",
							children: "Sales Tax Value"
						}), /* @__PURE__ */ jsx("div", {
							className: "flex h-9 items-center justify-end rounded-md bg-muted px-3 text-sm tabular-nums",
							children: money(calc(l).tax)
						})] }),
						labor ? /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, {
							className: "text-xs",
							children: "Labor %"
						}), /* @__PURE__ */ jsx(Input, {
							type: "number",
							min: 0,
							max: 100,
							"aria-label": `Labor percent item ${i + 1}`,
							value: l.labor_percent ?? 0,
							onChange: (e) => upd(i, { labor_percent: +e.target.value })
						})] }), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, {
							className: "text-xs",
							children: "Labor amount"
						}), /* @__PURE__ */ jsx("div", {
							className: "flex h-9 items-center justify-end rounded-md bg-muted px-3 text-sm tabular-nums",
							children: money(calc(l).labor)
						})] })] }) : null,
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, {
							className: "text-xs",
							children: "Total"
						}), /* @__PURE__ */ jsx("div", {
							className: "flex h-9 items-center justify-end rounded-md bg-muted px-3 text-sm font-semibold tabular-nums",
							children: money(calc(l).total)
						})] })
					]
				})
			]
		}, i)), /* @__PURE__ */ jsxs(Button, {
			variant: "outline",
			size: "sm",
			onClick: () => setLines((ls) => [...ls, {
				...ls[ls.length - 1],
				hs_code: "",
				part_number: "",
				description: "",
				description_source: "custom",
				quantity: 1,
				discount: 0,
				labor_percent: 0,
				[priceKey]: 0
			}]),
			children: [/* @__PURE__ */ jsx(Plus, { className: "size-4" }), "Add item"]
		})]
	});
}
//#endregion
export { LineItems as t };
