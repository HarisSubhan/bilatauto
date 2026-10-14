import { z } from "zod";
//#region src/lib/document-calculations.ts
var roundMoney = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
var documentLineSchema = z.object({
	hs_code: z.string().trim().min(1).max(100),
	description: z.string().trim().min(1).max(2e3),
	description_source: z.enum(["fbr", "custom"]),
	part_number: z.string().max(100).nullable().optional(),
	quantity: z.number().finite().positive().max(999999999),
	unit_price: z.number().finite().min(0).optional(),
	unit_cost: z.number().finite().min(0).optional(),
	discount: z.number().finite().min(0),
	tax_percent: z.number().finite().min(0).max(100),
	uom: z.string().optional(),
	labor_percent: z.number().finite().min(0).max(100).optional()
}).refine((l) => l.discount <= l.quantity * (l.unit_price ?? l.unit_cost ?? 0), "Discount cannot exceed item value");
/** Per line: gross = qty×price − discount; tax and labor are both % of gross; total excludes labor. */
function calculateLine(l, price) {
	const gross = roundMoney(l.quantity * price - l.discount);
	const tax = roundMoney(gross * l.tax_percent / 100);
	return {
		gross,
		tax,
		labor: roundMoney(gross * (l.labor_percent ?? 0) / 100),
		total: roundMoney(gross + tax)
	};
}
/** Document totals; grand total = Σ(gross + tax) + Σ labor. */
function calculateTotals(lines, priceOf) {
	return lines.reduce((a, l, i) => {
		const p = priceOf(i);
		const c = calculateLine(l, p);
		return {
			sub: roundMoney(a.sub + roundMoney(l.quantity * p)),
			disc: roundMoney(a.disc + l.discount),
			tax: roundMoney(a.tax + c.tax),
			labor: roundMoney(a.labor + c.labor),
			grand: roundMoney(a.grand + c.total + c.labor)
		};
	}, {
		sub: 0,
		disc: 0,
		tax: 0,
		labor: 0,
		grand: 0
	});
}
//#endregion
export { calculateTotals as n, documentLineSchema as r, calculateLine as t };
