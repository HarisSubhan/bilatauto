import { z } from "zod";
//#region src/lib/document-calculations.ts
var roundMoney = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
var documentLineSchema = z.object({
	item_kind: z.enum(["goods", "service"]).default("goods"),
	hs_code: z.string().trim().min(1, "HS code is required").max(100),
	description: z.string().trim().min(1, "Description is required").max(2e3),
	description_source: z.enum(["fbr", "custom"]),
	part_number: z.string().max(100).nullable().optional(),
	quantity: z.number().finite().positive("Units must be more than 0").max(999999999),
	unit_price: z.number().finite().min(0).optional(),
	unit_cost: z.number().finite().min(0).optional(),
	discount: z.number().finite().min(0),
	tax_percent: z.number().finite().min(0).max(100),
	uom: z.string().optional(),
	/** Service lines only: manually entered rate, stored as-is and never used to compute the amount. */
	service_percent: z.number().finite().min(0).max(100).nullable().optional(),
	sale_type: z.string().max(200).optional(),
	sro_schedule_no: z.string().max(200).optional(),
	sro_item_serial_no: z.string().max(100).optional(),
	product_name: z.string().trim().max(250).nullable().optional(),
	type_of_goods: z.string().max(200).optional(),
	type_of_goods_id: z.string().uuid().nullable().optional(),
	uom_id: z.string().uuid().nullable().optional(),
	retail_sales_value: z.number().finite().min(0).optional()
}).refine((l) => l.item_kind === "service" || l.discount <= l.quantity * (l.unit_price ?? l.unit_cost ?? 0), "Discount cannot exceed item value");
/**
* Goods: gross = qty×price − discount. Service: gross = the manually entered service amount (price field),
* quantity is informational. Tax = gross × tax%; total = gross + tax. Each line counts exactly once.
*/
function calculateLine(l, price) {
	const gross = roundMoney(l.item_kind === "service" ? price : l.quantity * price - l.discount);
	const tax = roundMoney(gross * l.tax_percent / 100);
	return {
		gross,
		tax,
		total: roundMoney(gross + tax)
	};
}
/** Document totals; grand total = Σ(gross + tax) across goods and service lines. */
function calculateTotals(lines, priceOf) {
	return lines.reduce((a, l, i) => {
		const p = priceOf(i);
		const c = calculateLine(l, p);
		const svc = l.item_kind === "service";
		return {
			sub: roundMoney(a.sub + roundMoney(svc ? p : l.quantity * p)),
			disc: roundMoney(a.disc + (svc ? 0 : l.discount)),
			tax: roundMoney(a.tax + c.tax),
			grand: roundMoney(a.grand + c.total)
		};
	}, {
		sub: 0,
		disc: 0,
		tax: 0,
		grand: 0
	});
}
//#endregion
export { calculateTotals as n, documentLineSchema as r, calculateLine as t };
