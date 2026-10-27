import { z } from "zod";
import { needsRetailPrice } from "@/lib/goods-rules";
export const roundMoney = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export type ItemKind = "goods" | "service";

/** The invoice list is not an activity log; repeated responses retain one row per identity. */
export function uniqueInvoiceRows<T extends {id:string}>(rows: T[]): T[] {
  return [...new Map(rows.map(row => [row.id,row])).values()];
}

/** Saved records come back with empty columns as null; treat them as "not filled in". */
const text = (max: number) => z.string().max(max).nullish().transform((v) => v ?? "");
const optionalText = (max: number) => z.string().max(max).nullish().transform((v) => v ?? undefined);

export const documentLineSchema = z.object({
  item_kind: z.enum(["goods", "service"]).nullish().transform((v) => v ?? "goods"),
  hs_code: z.string().trim().min(1, "HS code is required").max(100), description: z.string().trim().min(1, "Description is required").max(20000),
  description_source: z.enum(["fbr", "custom"]), part_number: z.string().max(100).nullable().optional(),
  quantity: z.coerce.number().finite().positive("Units must be more than 0").max(999999999), unit_price: z.coerce.number().finite().min(0).optional(),
  unit_cost: z.coerce.number().finite().min(0).optional(),
  tax_percent: z.coerce.number().finite().min(0).max(100), uom: optionalText(200),
  /** Service lines only: manually entered rate, stored as-is and never used to compute the amount. */
  service_percent: z.coerce.number().finite().min(0).max(100).nullable().optional(),
  sale_type: optionalText(200),
  sro_schedule_no: text(200),
  sro_item_serial_no: text(100),
  product_name: z.string().trim().max(250).nullable().optional(), type_of_goods: optionalText(200), type_of_goods_id: z.string().uuid().nullable().optional(), uom_id: z.string().uuid().nullable().optional(),
  retail_sales_value: z.coerce.number().finite().min(0).nullish().transform((v) => v ?? 0),
});

/** Turns a saved item (nulls for empty columns) into an editable line without losing the blank defaults. */
export function savedLine<T extends Record<string, unknown>>(blank: T, saved: Record<string, unknown>): T {
  const out: Record<string, unknown> = { ...blank };
  for (const [k, v] of Object.entries(saved)) if (v !== null && v !== undefined) out[k] = v;
  return out as T;
}

/** HS suggestions are explicit master data, never inferred tax treatment. */
export function hsSelectionPatch(_line: Record<string, unknown>, pick: { hs_code: string; description: string; source: "fbr" | "custom"; type_of_goods?: string | null }, goods: Array<{ id: string; name: string }>) {
  const mapped = goods.find(g => g.name === pick.type_of_goods);
  return {
    hs_code: pick.hs_code, description: pick.description, description_source: pick.source,
    type_of_goods_id: mapped?.id ?? null, type_of_goods: mapped?.name ?? "",
  };
}

type CalcLine = { quantity: number; tax_percent: number; item_kind?: ItemKind; type_of_goods?: string; retail_sales_value?: number };

/**
 * Goods: gross = qty×price. Service: gross = the manually entered service amount (price field),
 * quantity is informational. Tax = gross × tax%; total = gross + tax. Each line counts exactly once.
 * Sales lines (retailBase) of a retail-price Type of Goods (3rd Schedule) charge tax on the entered retail price.
 */
export function calculateLine(l: CalcLine, price: number, retailBase = false) {
  const svc = l.item_kind === "service";
  const gross = roundMoney(svc ? price : l.quantity * price);
  const retail = Number(l.retail_sales_value ?? 0);
  const base = retailBase && needsRetailPrice(l.type_of_goods) && retail > 0 ? retail : gross;
  const tax = roundMoney(base * l.tax_percent / 100);
  return { gross, tax, total: roundMoney(gross + tax) };
}

/** Sales document totals; grand total = Σ(gross + tax) across goods and service lines. */
export function calculateTotals(lines: CalcLine[], priceOf: (i: number) => number) {
  return lines.reduce((a, l, i) => {
    const c = calculateLine(l, priceOf(i), true);
    return { sub: roundMoney(a.sub + c.gross), tax: roundMoney(a.tax + c.tax), grand: roundMoney(a.grand + c.total) };
  }, { sub: 0, tax: 0, grand: 0 });
}
