import { z } from "zod";
//#region src/lib/goods-rules.ts
/**
* Extra FBR fields each Type of Goods (FBR "sale type") needs on a sales line.
* Mirrors server-package/backend/src/goods-rules.js — keep both lists identical.
*/
var norm = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
/** Sale types where FBR needs the Fixed / Notified Value or Retail Price, and sales tax is charged on it. */
var RETAIL_PRICE_TYPES = ["3rd Schedule Goods"];
/** Sale types where FBR needs an SRO / Schedule number and the item serial number within it. */
var SRO_REQUIRED_TYPES = [
	"Goods at Reduced Rate",
	"Goods at zero-rate",
	"Exempt goods",
	"Goods as per SRO.297(I)/2023",
	"Non-Adjustable Supplies"
];
var needsRetailPrice = (type) => RETAIL_PRICE_TYPES.some((t) => norm(t) === norm(type));
var needsSro = (type) => SRO_REQUIRED_TYPES.some((t) => norm(t) === norm(type));
//#endregion
//#region src/lib/document-calculations.ts
var roundMoney = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
/** The invoice list is not an activity log; repeated responses retain one row per identity. */
function uniqueInvoiceRows(rows) {
	return [...new Map(rows.map((row) => [row.id, row])).values()];
}
/** Saved records come back with empty columns as null; treat them as "not filled in". */
var text = (max) => z.string().max(max).nullish().transform((v) => v ?? "");
var optionalText = (max) => z.string().max(max).nullish().transform((v) => v ?? void 0);
var documentLineSchema = z.object({
	item_kind: z.enum(["goods", "service"]).nullish().transform((v) => v ?? "goods"),
	hs_code: z.string().trim().min(1, "HS code is required").max(100),
	description: z.string().trim().min(1, "Description is required").max(2e4),
	description_source: z.enum(["fbr", "custom"]),
	part_number: z.string().max(100).nullable().optional(),
	quantity: z.coerce.number().finite().positive("Units must be more than 0").max(999999999),
	unit_price: z.coerce.number().finite().min(0).optional(),
	unit_cost: z.coerce.number().finite().min(0).optional(),
	tax_percent: z.coerce.number().finite().min(0).max(100),
	uom: optionalText(200),
	/** Service lines only: manually entered rate, stored as-is and never used to compute the amount. */
	service_percent: z.coerce.number().finite().min(0).max(100).nullable().optional(),
	sale_type: optionalText(200),
	sro_schedule_no: text(200),
	sro_item_serial_no: text(100),
	product_name: z.string().trim().max(250).nullable().optional(),
	type_of_goods: optionalText(200),
	type_of_goods_id: z.string().uuid().nullable().optional(),
	uom_id: z.string().uuid().nullable().optional(),
	retail_sales_value: z.coerce.number().finite().min(0).nullish().transform((v) => v ?? 0)
});
/** Turns a saved item (nulls for empty columns) into an editable line without losing the blank defaults. */
function savedLine(blank, saved) {
	const out = { ...blank };
	for (const [k, v] of Object.entries(saved)) if (v !== null && v !== void 0) out[k] = v;
	return out;
}
/** HS suggestions are explicit master data, never inferred tax treatment. */
function hsSelectionPatch(_line, pick, goods) {
	const mapped = goods.find((g) => g.name === pick.type_of_goods);
	return {
		hs_code: pick.hs_code,
		description: pick.description,
		description_source: pick.source,
		type_of_goods_id: mapped?.id ?? null,
		type_of_goods: mapped?.name ?? ""
	};
}
/**
* Goods: gross = qty×price. Service: gross = the manually entered service amount (price field),
* quantity is informational. Tax = gross × tax%; total = gross + tax. Each line counts exactly once.
* Sales lines (retailBase) of a retail-price Type of Goods (3rd Schedule) charge tax on the entered retail price.
*/
function calculateLine(l, price, retailBase = false) {
	const gross = roundMoney(l.item_kind === "service" ? price : l.quantity * price);
	const retail = Number(l.retail_sales_value ?? 0);
	const tax = roundMoney((retailBase && needsRetailPrice(l.type_of_goods) && retail > 0 ? retail : gross) * l.tax_percent / 100);
	return {
		gross,
		tax,
		total: roundMoney(gross + tax)
	};
}
/** Sales document totals; grand total = Σ(gross + tax) across goods and service lines. */
function calculateTotals(lines, priceOf) {
	return lines.reduce((a, l, i) => {
		const c = calculateLine(l, priceOf(i), true);
		return {
			sub: roundMoney(a.sub + c.gross),
			tax: roundMoney(a.tax + c.tax),
			grand: roundMoney(a.grand + c.total)
		};
	}, {
		sub: 0,
		tax: 0,
		grand: 0
	});
}
//#endregion
export { savedLine as a, needsSro as c, hsSelectionPatch as i, calculateTotals as n, uniqueInvoiceRows as o, documentLineSchema as r, needsRetailPrice as s, calculateLine as t };
