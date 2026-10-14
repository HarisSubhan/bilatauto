import { documentLineSchema } from "@/lib/document-calculations";
import { db as supabase } from "@/lib/db";
import type { FieldDef } from "@/components/data/MasterPage";

/** Spreadsheet layouts: one row per item; rows sharing the same Ref become one document. */
const itemFields = (price: string): FieldDef[] => [
  { key: "hs_code", label: "HS Code", required: true },
  { key: "part_number", label: "Part No." },
  { key: "description", label: "Description", required: true },
  { key: "quantity", label: "Units", type: "number", required: true },
  { key: price, label: price === "unit_cost" ? "Unit Cost" : "Unit Price", type: "number", required: true },
  { key: "discount", label: "Discount", type: "number" },
  { key: "tax_percent", label: "Sales Tax %", type: "number" },
];

export const purchaseFields: FieldDef[] = [
  { key: "ref", label: "Ref (groups rows)", required: true },
  { key: "purchase_date", label: "Date (YYYY-MM-DD)" },
  { key: "supplier", label: "Supplier name", required: true },
  { key: "bill_number", label: "Bill No." },
  ...itemFields("unit_cost"),
];

export const quotationFields: FieldDef[] = [
  { key: "ref", label: "Ref (groups rows)", required: true },
  { key: "quotation_date", label: "Date (YYYY-MM-DD)" },
  { key: "buyer", label: "Buyer / Department name", required: true },
  { key: "contact_person", label: "Contact person" },
  { key: "vehicle_type", label: "Vehicle type (or number required)" },
  { key: "vehicle_number", label: "Vehicle number (or type required)" },
  { key: "labor_percent", label: "Labor %", type: "number" },
  ...itemFields("unit_price"),
];

export const invoiceFields: FieldDef[] = [
  { key: "invoice_number", label: "Invoice No." },
  { key: "invoice_date", label: "Date" },
  { key: "buyer", label: "Buyer" },
  { key: "quotation_number", label: "Quotation No." },
  { key: "sales_tax_number", label: "Sales Tax Invoice No." },
  { key: "vehicle_type", label: "Vehicle type" },
  { key: "vehicle_number", label: "Vehicle number" },
  { key: "labor_percent", label: "Labor %", type: "number" },
  { key: "labor_amount", label: "Labor amount", type: "number" },
  { key: "sales_tax_value", label: "Sales Tax Value", type: "number" },
  ...itemFields("unit_price"),
  { key: "line_total", label: "Line total", type: "number" },
];

export const openingStockFields: FieldDef[] = [
  { key: "hs_code", label: "HS Code", required: true },
  { key: "description", label: "Description", required: true },
  { key: "quantity", label: "Units", type: "number", required: true },
  { key: "movement_date", label: "Date (YYYY-MM-DD)" },
];

const n = (v: unknown) => (v === undefined || v === "" || isNaN(Number(v)) ? 0 : Number(v));
const today = () => new Date().toISOString().slice(0, 10);

function group(rows: Array<Record<string, unknown>>) {
  const m = new Map<string, Array<Record<string, unknown>>>();
  for (const r of rows) {
    const k = String(r["ref"]);
    m.set(k, [...(m.get(k) ?? []), r]);
  }
  return m;
}

function lines(rows: Array<Record<string, unknown>>, price: string) {
  let sub = 0, disc = 0, tax = 0;
  const items = rows.map((r: any) => {
    const q = n(r["quantity"]), p = n(r[price]), d = n(r["discount"]), t = n(r["tax_percent"]);
    const gross = q * p - d;
    const lt = gross + (gross * t) / 100;
    sub += q * p; disc += d; tax += (gross * t) / 100;
    return {
      hs_code: String(r["hs_code"]), part_number: r["part_number"] ? String(r["part_number"]) : null,
      description: String(r["description"]), description_source: "custom" as const,
      quantity: q, uom: "pcs", [price]: p, discount: d, tax_percent: t, line_total: +lt.toFixed(2),
    };
  });
  return { items, totals: { subtotal: sub, discount_total: disc, tax_total: tax, grand_total: sub - disc + tax } };
}

async function lookup(table: "suppliers" | "departments") {
  const { data, error } = await supabase.from(table).select("id,name");
  if (error) throw error;
  return new Map((data ?? []).map((x: any) => [x.name.trim().toLowerCase(), x.id]));
}

export async function importPurchases(rows: Array<Record<string, unknown>>) {
  const sup = await lookup("suppliers");
  let made = 0;
  const missing = new Set<string>();
  for (const [, g] of group(rows)) {
    const head = g[0]!;
    const sid = sup.get(String(head["supplier"]).trim().toLowerCase());
    if (!sid) { missing.add(String(head["supplier"])); continue; }
    const { items } = lines(g, "unit_cost");
    const valid = items.map(i => documentLineSchema.parse(i));
    const { error } = await supabase.rpc("create_document", { _kind: "purchase", _header: { supplier_id: sid, date: String(head["purchase_date"] || today()), bill_number: head["bill_number"] || null, reference_number: String(head["ref"]) }, _items: valid });
    if (error) throw error;
    made++;
  }
  return `${made} purchases imported (stock added)` + (missing.size ? `. Skipped unknown suppliers: ${[...missing].join(", ")}` : "");
}

export async function importQuotations(rows: Array<Record<string, unknown>>) {
  const dep = await lookup("departments");
  let made = 0;
  const missing = new Set<string>();
  for (const [, g] of group(rows)) {
    const head = g[0]!;
    const did = dep.get(String(head["buyer"]).trim().toLowerCase());
    if (!did) { missing.add(String(head["buyer"])); continue; }
    const { items } = lines(g, "unit_price");
    const valid = items.map(i => documentLineSchema.parse(i));
    const { error } = await supabase.rpc("create_document", { _kind: "quotation", _header: { department_id: did, date: String(head["quotation_date"] || today()), contact_person: head["contact_person"] || null, notes: `Imported (ref ${String(head["ref"])})`, vehicle_type: head["vehicle_type"] || null, vehicle_number: head["vehicle_number"] || null, labor_percent: n(head["labor_percent"]) }, _items: valid });
    if (error) throw error;
    made++;
  }
  return `${made} draft quotations imported` + (missing.size ? `. Skipped unknown buyers: ${[...missing].join(", ")}` : "");
}

export async function importOpeningStock(rows: Array<Record<string, unknown>>) {
  for (const r of rows) {
    const { data: num, error: ne } = await supabase.rpc("next_document_number", { _prefix: "SIN" });
    if (ne) throw ne;
    const { error } = await supabase.from("stock_movements").insert({
      movement_number: num, direction: "in", hs_code: String(r["hs_code"]), description: String(r["description"]),
      quantity: n(r["quantity"]), uom: r["uom"] ? String(r["uom"]) : null, reference_type: "opening",
      reference_number: "OPENING", movement_date: String(r["movement_date"] || today()),
    });
    if (error) throw error;
  }
  return `${rows.length} opening stock entries added`;
}

/** Flatten documents with items for export (one row per item). */
export function flatten(
  docs: Array<Record<string, unknown>>,
  itemsKey: string,
  head: (d: Record<string, unknown>) => Record<string, unknown>,
) {
  return docs.flatMap((d) => {
    const items = (d[itemsKey] as Array<Record<string, unknown>> | undefined) ?? [];
    return items.length ? items.map((i) => ({ ...head(d), vehicle_type: d["vehicle_type"], vehicle_number: d["vehicle_number"], labor_percent: d["labor_percent"], labor_amount: d["labor_amount"], sales_tax_number: d["sales_tax_number"], ...i })) : [head(d)];
  });
}
