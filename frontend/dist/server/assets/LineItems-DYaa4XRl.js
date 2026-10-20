import { a as db, n as Button } from "./bilal-logo.asset-BEz_DQLU.js";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-MFYILeGF.js";
import { t as calculateLine } from "./document-calculations-B6gNwPBL.js";
import { t as Input } from "./input-CdXJHMPP.js";
import { t as Label } from "./label-Dq4-HTAg.js";
import { t as HsCodePicker } from "./HsCodePicker-2rwaS-Eq.js";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
//#region src/components/data/LineItems.tsx
var money = (n) => n.toLocaleString(void 0, {
	minimumFractionDigits: 2,
	maximumFractionDigits: 2
});
/** One card per item. HS code ⇄ description auto-fill each other from the Custom HS list. */
function LineItems({ lines, upd, setLines, priceKey, quotation = false }) {
	const goods = useQuery({
		queryKey: ["type_of_goods", "active"],
		queryFn: async () => {
			const { data, error } = await db.from("type_of_goods").select("id,name").eq("status", "active").order("serial_number");
			if (error) throw new Error(error.message);
			return data ?? [];
		}
	});
	const uoms = useQuery({
		queryKey: ["units_of_measurement", "active"],
		queryFn: async () => {
			const { data, error } = await db.from("units_of_measurement").select("id,name").eq("status", "active").order("serial_number");
			if (error) throw new Error(error.message);
			return data ?? [];
		}
	});
	const sros = useQuery({
		queryKey: ["sro_master", "active"],
		queryFn: async () => {
			const { data, error } = await db.from("sro_master").select("id,name").eq("status", "active").order("serial_number");
			if (error) throw new Error(error.message);
			return data ?? [];
		}
	});
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
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ jsxs("span", {
							className: "text-sm font-semibold",
							children: ["Item ", i + 1]
						}), /* @__PURE__ */ jsx("div", {
							className: "inline-flex rounded-md border border-border p-0.5 text-xs",
							role: "group",
							"aria-label": `Item ${i + 1} type`,
							children: ["goods", "service"].map((k) => /* @__PURE__ */ jsx("button", {
								type: "button",
								"aria-pressed": (l.item_kind ?? "goods") === k,
								className: `rounded px-2 py-1 ${(l.item_kind ?? "goods") === k ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`,
								onClick: () => upd(i, k === "service" ? {
									item_kind: k,
									discount: 0,
									quantity: l.quantity || 1
								} : {
									item_kind: k,
									service_percent: null
								}),
								children: k === "goods" ? "Goods" : "Service"
							}, k))
						})]
					}), /* @__PURE__ */ jsx(Button, {
						size: "icon",
						variant: "ghost",
						"aria-label": "Remove item",
						onClick: () => setLines((ls) => ls.filter((_, j) => j !== i)),
						disabled: lines.length === 1,
						children: /* @__PURE__ */ jsx(X, { className: "size-4" })
					})]
				}),
				quotation && /* @__PURE__ */ jsxs("div", {
					className: "mb-3",
					children: [/* @__PURE__ */ jsx(Label, { children: "Product Name *" }), /* @__PURE__ */ jsx(Input, {
						"aria-label": `Product name item ${i + 1}`,
						maxLength: 250,
						value: String(l["product_name"] ?? ""),
						onChange: (e) => upd(i, { product_name: e.target.value })
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
							children: l.item_kind === "service" ? "Service description" : "Product / description"
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
					className: "mt-3 grid gap-3 md:grid-cols-2",
					children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs(Label, { children: ["Type of Goods", quotation ? "" : " *"] }), /* @__PURE__ */ jsxs(Select, {
						value: String(l["type_of_goods_id"] ?? ""),
						onValueChange: (id) => {
							const v = goods.data?.find((v) => v.id === id);
							if (v) upd(i, {
								type_of_goods_id: id,
								type_of_goods: v.name
							});
						},
						children: [/* @__PURE__ */ jsx(SelectTrigger, {
							"aria-label": `Type of Goods item ${i + 1}`,
							children: /* @__PURE__ */ jsx(SelectValue, { placeholder: String(l["type_of_goods"] || "Select Type of Goods") })
						}), /* @__PURE__ */ jsx(SelectContent, { children: goods.data?.map((v) => /* @__PURE__ */ jsx(SelectItem, {
							value: v.id,
							children: v.name
						}, v.id)) })]
					})] }), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs(Label, { children: ["UOM", quotation || l.item_kind === "service" ? " (optional)" : " *"] }), /* @__PURE__ */ jsxs(Select, {
						value: String(l["uom_id"] ?? ""),
						onValueChange: (id) => {
							const v = uoms.data?.find((v) => v.id === id);
							if (v) upd(i, {
								uom_id: id,
								uom: v.name
							});
						},
						children: [/* @__PURE__ */ jsx(SelectTrigger, {
							"aria-label": `UOM item ${i + 1}`,
							children: /* @__PURE__ */ jsx(SelectValue, { placeholder: l.uom || "Select UOM" })
						}), /* @__PURE__ */ jsx(SelectContent, { children: uoms.data?.map((v) => /* @__PURE__ */ jsx(SelectItem, {
							value: v.id,
							children: v.name
						}, v.id)) })]
					})] })]
				}),
				priceKey !== "unit_cost" && /* @__PURE__ */ jsxs("div", {
					className: "mt-3 grid gap-3 md:grid-cols-2",
					children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, { children: "SRO / Schedule" }), /* @__PURE__ */ jsxs(Select, {
						value: l.sro_schedule_no || "__none",
						onValueChange: (v) => upd(i, { sro_schedule_no: v === "__none" ? "" : v }),
						children: [/* @__PURE__ */ jsx(SelectTrigger, {
							"aria-label": `SRO item ${i + 1}`,
							children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "No SRO" })
						}), /* @__PURE__ */ jsxs(SelectContent, { children: [/* @__PURE__ */ jsx(SelectItem, {
							value: "__none",
							children: "No SRO"
						}), sros.data?.map((v) => /* @__PURE__ */ jsx(SelectItem, {
							value: v.name,
							children: v.name
						}, v.id))] })]
					})] }), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, { children: "SRO item serial no." }), /* @__PURE__ */ jsx(Input, {
						maxLength: 100,
						value: l.sro_item_serial_no ?? "",
						onChange: (e) => upd(i, { sro_item_serial_no: e.target.value }),
						placeholder: "If SRO applies"
					})] })]
				}),
				(goods.error || uoms.error) && /* @__PURE__ */ jsx("p", {
					className: "mt-2 text-sm text-destructive",
					children: String((goods.error || uoms.error)?.message)
				}),
				/* @__PURE__ */ jsxs("div", {
					className: `mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7`,
					children: [
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs(Label, {
							className: "text-xs",
							children: ["Units", l.item_kind === "service" ? " (optional)" : ""]
						}), /* @__PURE__ */ jsx(Input, {
							type: "number",
							min: 0,
							value: l.quantity,
							onChange: (e) => upd(i, { quantity: +e.target.value })
						})] }),
						l.item_kind === "service" ? /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, {
							className: "text-xs",
							children: "Service %"
						}), /* @__PURE__ */ jsx(Input, {
							type: "number",
							min: 0,
							max: 100,
							"aria-label": `Service percent item ${i + 1}`,
							value: l.service_percent ?? "",
							onChange: (e) => upd(i, { service_percent: e.target.value === "" ? null : +e.target.value })
						})] }), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, {
							className: "text-xs",
							children: "Service amount"
						}), /* @__PURE__ */ jsx(Input, {
							type: "number",
							min: 0,
							"aria-label": `Service amount item ${i + 1}`,
							value: Number(l[priceKey] ?? 0),
							onChange: (e) => upd(i, { [priceKey]: +e.target.value })
						})] })] }) : /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, {
							className: "text-xs",
							children: "Price"
						}), /* @__PURE__ */ jsx(Input, {
							type: "number",
							min: 0,
							value: Number(l[priceKey] ?? 0),
							onChange: (e) => upd(i, { [priceKey]: +e.target.value })
						})] }), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, {
							className: "text-xs",
							children: "Discount"
						}), /* @__PURE__ */ jsx(Input, {
							type: "number",
							min: 0,
							value: l.discount,
							onChange: (e) => upd(i, { discount: +e.target.value })
						})] })] }),
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
							children: priceKey === "unit_cost" ? "Sales Tax Charged" : "Value Added Tax"
						}), /* @__PURE__ */ jsx("div", {
							className: "flex h-9 items-center justify-end rounded-md bg-muted px-3 text-sm tabular-nums",
							children: money(calc(l).tax)
						})] }),
						priceKey === "unit_cost" && /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, {
							className: "text-xs",
							children: "Purchase Value"
						}), /* @__PURE__ */ jsx("div", {
							className: "flex h-9 items-center justify-end bg-muted px-3 text-sm",
							children: money(calc(l).gross)
						})] }), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, {
							className: "text-xs",
							children: "Retail Sales Value *"
						}), /* @__PURE__ */ jsx(Input, {
							"aria-label": `Retail Sales Value item ${i + 1}`,
							type: "number",
							min: 0,
							value: Number(l["retail_sales_value"] ?? 0),
							onChange: (e) => upd(i, { retail_sales_value: Number(e.target.value) })
						})] })] }),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, {
							className: "text-xs",
							children: priceKey === "unit_cost" ? "Total Purchase Amount" : "Total"
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
				...ls[ls.length - 1] ?? {},
				hs_code: "",
				part_number: "",
				description: "",
				description_source: "custom",
				product_name: "",
				retail_sales_value: 0,
				quantity: 1,
				discount: 0,
				item_kind: "goods",
				service_percent: null,
				sro_item_serial_no: "",
				[priceKey]: 0
			}]),
			children: [/* @__PURE__ */ jsx(Plus, { className: "size-4" }), "Add item / service"]
		})]
	});
}
//#endregion
export { LineItems as t };
