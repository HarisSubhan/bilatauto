import { a as db } from "./bilal-logo.asset-DVM5nCcq.js";
import { r as documentLineSchema } from "./document-calculations-CO6XfdJx.js";
//#region src/lib/doc-import.ts
/** Spreadsheet layouts: one row per item; rows sharing the same Ref become one document. */
var itemFields = (price) => [
	{
		key: "hs_code",
		label: "HS Code",
		required: true
	},
	{
		key: "part_number",
		label: "Part No."
	},
	{
		key: "description",
		label: "Description",
		required: true
	},
	{
		key: "quantity",
		label: "Units",
		type: "number",
		required: true
	},
	{
		key: price,
		label: price === "unit_cost" ? "Unit Cost" : "Unit Price",
		type: "number",
		required: true
	},
	{
		key: "tax_percent",
		label: "Sales Tax %",
		type: "number"
	}
];
var purchaseFields = [
	{
		key: "purchase_date",
		label: "Purchase Date",
		required: true
	},
	{
		key: "bill_number",
		label: "Purchase Invoice Number",
		required: true
	},
	{
		key: "supplier_ntn",
		label: "Supplier NTN",
		required: true
	},
	{
		key: "supplier",
		label: "supplier Business Name",
		required: true
	},
	{
		key: "hs_code",
		label: "HS Code",
		required: true
	},
	{
		key: "type_of_goods",
		label: "Type of Goods",
		required: true
	},
	{
		key: "description",
		label: "Description",
		required: true
	},
	{
		key: "quantity",
		label: "Quantity Units",
		type: "number",
		required: true
	},
	{
		key: "uom",
		label: "UOM",
		required: true
	},
	{
		key: "unit_cost",
		label: "Unit Price",
		type: "number",
		required: true
	},
	{
		key: "tax_percent",
		label: "G.S.T Percentage",
		type: "number",
		required: true
	},
	{
		key: "purchase_value",
		label: "Purchase Value",
		type: "number"
	},
	{
		key: "sales_tax_charged",
		label: "Sales Tax Charged",
		type: "number"
	},
	{
		key: "retail_sales_value",
		label: "Retail Sales Value",
		type: "number",
		required: true
	},
	{
		key: "total_purchase_amount",
		label: "Total Purchase Amount",
		type: "number"
	}
];
var quotationFields = [
	{
		key: "ref",
		label: "Ref (groups rows)",
		required: true
	},
	{
		key: "quotation_date",
		label: "Date (YYYY-MM-DD)"
	},
	{
		key: "buyer",
		label: "Buyer / Department name",
		required: true
	},
	{
		key: "contact_person",
		label: "Contact person"
	},
	{
		key: "vehicle_type",
		label: "Vehicle type (or number required)"
	},
	{
		key: "vehicle_number",
		label: "Vehicle number (or type required)"
	},
	{
		key: "buyer_type",
		label: "Buyer Type (Registered / Unregistered)"
	},
	{
		key: "item_kind",
		label: "Item Type (goods/service)"
	},
	{
		key: "service_percent",
		label: "Service %",
		type: "number"
	},
	{
		key: "product_name",
		label: "Product Name",
		required: true
	},
	...itemFields("unit_price")
];
var invoiceFields = [
	{
		key: "invoice_number",
		label: "Sales Invoice Number",
		required: true
	},
	{
		key: "invoice_date",
		label: "Invoice Date",
		required: true
	},
	{
		key: "buyer_ntn",
		label: "Buyer NTN",
		required: true
	},
	{
		key: "buyer",
		label: "buyer Name",
		required: true
	},
	{
		key: "vehicle_number",
		label: "vehicle_number",
		required: true
	},
	{
		key: "hs_code",
		label: "hs_code",
		required: true
	},
	{
		key: "description",
		label: "description",
		required: true
	},
	{
		key: "quantity",
		label: "quantity Units",
		type: "number",
		required: true
	},
	{
		key: "unit_price",
		label: "unit_price",
		type: "number",
		required: true
	},
	{
		key: "sale_value",
		label: "SALE value",
		type: "number"
	},
	{
		key: "tax_percent",
		label: "GST %",
		type: "number",
		required: true
	},
	{
		key: "sales_tax_value",
		label: "Value Added Tax",
		type: "number"
	},
	{
		key: "type_of_goods",
		label: "Type of Goods",
		required: true
	},
	{
		key: "uom",
		label: "UOM"
	},
	{
		key: "item_kind",
		label: "Item Type (goods/service)"
	},
	{
		key: "service_percent",
		label: "Service %",
		type: "number"
	},
	{
		key: "buyer_type",
		label: "Buyer Type"
	},
	{
		key: "sro_schedule_no",
		label: "SRO / Schedule"
	},
	{
		key: "sro_item_serial_no",
		label: "SRO Item Serial No"
	}
];
var quotationExportFields = [
	{
		key: "ref",
		label: "Quotation Number"
	},
	{
		key: "quotation_date",
		label: "Date"
	},
	{
		key: "buyer",
		label: "Buyer"
	},
	{
		key: "vehicle_type",
		label: "Vehicle Type"
	},
	{
		key: "vehicle_number",
		label: "Vehicle Number"
	},
	{
		key: "product_name",
		label: "Product Name"
	},
	{
		key: "quantity",
		label: "Units"
	},
	{
		key: "unit_price",
		label: "Unit Price"
	},
	{
		key: "tax_percent",
		label: "Sales Tax %"
	},
	{
		key: "sales_tax_value",
		label: "Sales Tax Value"
	},
	{
		key: "item_kind",
		label: "Item Type"
	},
	{
		key: "service_percent",
		label: "Service %"
	}
];
var openingStockFields = [
	{
		key: "hs_code",
		label: "HS Code",
		required: true
	},
	{
		key: "description",
		label: "Description",
		required: true
	},
	{
		key: "quantity",
		label: "Units",
		type: "number",
		required: true
	},
	{
		key: "movement_date",
		label: "Date (YYYY-MM-DD)"
	}
];
var n = (v) => v === void 0 || v === "" || isNaN(Number(v)) ? 0 : Number(v);
/** Tax rates may arrive as "18%", 18, or an Excel fraction (0.18): all mean 18. */
var pct = (v) => {
	if (v === void 0 || v === null || v === "") return 0;
	const x = parseFloat(String(v).replace(/[,\s]/g, "").replace(/%$/, ""));
	if (!Number.isFinite(x)) return 0;
	return x > 0 && x < 1 ? x * 100 : x;
};
var today = () => (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
function group(rows) {
	const m = /* @__PURE__ */ new Map();
	for (const r of rows) {
		const k = String(r["ref"]);
		m.set(k, [...m.get(k) ?? [], r]);
	}
	return m;
}
function lines(rows, price) {
	let sub = 0, tax = 0;
	return {
		items: rows.map((r) => {
			const q = n(r["quantity"]), p = n(r[price]), t = pct(r["tax_percent"]);
			const svc = String(r["item_kind"] ?? "").trim().toLowerCase() === "service";
			const gross = svc ? p : q * p;
			const lt = gross + gross * t / 100;
			sub += svc ? p : q * p;
			tax += gross * t / 100;
			return {
				hs_code: String(r["hs_code"]),
				part_number: r["part_number"] ? String(r["part_number"]) : null,
				description: String(r["description"]),
				description_source: "custom",
				product_name: String(r["product_name"] ?? ""),
				item_kind: String(r["item_kind"] ?? "").trim().toLowerCase() === "service" ? "service" : "goods",
				service_percent: r["service_percent"] === void 0 || r["service_percent"] === "" ? null : pct(r["service_percent"]),
				sro_schedule_no: String(r["sro_schedule_no"] ?? "").trim() || void 0,
				sro_item_serial_no: String(r["sro_item_serial_no"] ?? "").trim() || void 0,
				quantity: q,
				uom: String(r["uom"] ?? ""),
				[price]: p,
				tax_percent: t,
				line_total: +lt.toFixed(2)
			};
		}),
		totals: {
			subtotal: sub,
			tax_total: tax,
			grand_total: sub + tax
		}
	};
}
async function lookup(table) {
	const { data, error } = await db.from(table).select("id,name");
	if (error) throw error;
	return new Map((data ?? []).map((x) => [x.name.trim().toLowerCase(), x.id]));
}
async function importDocuments(kind, rows) {
	const { data, error } = await db.rpc("import_documents", {
		_kind: kind,
		_rows: rows
	});
	if (error) throw new Error(error.message);
	return `${data.invoices} invoices imported; ${data.rows} rows saved; ${data.rejected} rejected`;
}
var importPurchases = (rows) => importDocuments("purchase", rows);
var importInvoices = (rows) => importDocuments("invoice", rows);
async function importQuotations(rows) {
	const dep = await lookup("departments");
	let made = 0;
	const missing = /* @__PURE__ */ new Set();
	for (const [, g] of group(rows)) {
		const head = g[0];
		const did = dep.get(String(head["buyer"]).trim().toLowerCase());
		if (!did) {
			missing.add(String(head["buyer"]));
			continue;
		}
		const { items } = lines(g, "unit_price");
		const valid = items.map((i) => documentLineSchema.parse(i));
		const { error } = await db.rpc("create_document", {
			_kind: "quotation",
			_header: {
				department_id: did,
				date: String(head["quotation_date"] || today()),
				contact_person: head["contact_person"] || null,
				notes: `Imported (ref ${String(head["ref"])})`,
				vehicle_type: head["vehicle_type"] || null,
				vehicle_number: head["vehicle_number"] || null,
				...head["buyer_type"] ? { buyer_type: String(head["buyer_type"]).trim() } : {}
			},
			_items: valid
		});
		if (error) throw error;
		made++;
	}
	return `${made} draft quotations imported` + (missing.size ? `. Skipped unknown buyers: ${[...missing].join(", ")}` : "");
}
async function importOpeningStock(rows) {
	for (const r of rows) {
		const { data: num, error: ne } = await db.rpc("next_document_number", { _prefix: "SIN" });
		if (ne) throw ne;
		const { error } = await db.from("stock_movements").insert({
			movement_number: num,
			direction: "in",
			hs_code: String(r["hs_code"]),
			description: String(r["description"]),
			quantity: n(r["quantity"]),
			uom: r["uom"] ? String(r["uom"]) : null,
			reference_type: "opening",
			reference_number: "OPENING",
			movement_date: String(r["movement_date"] || today())
		});
		if (error) throw error;
	}
	return `${rows.length} opening stock entries added`;
}
/** Flatten documents with items for export (one row per item). */
function flatten(docs, itemsKey, head) {
	return docs.flatMap((d) => {
		const items = d[itemsKey] ?? [];
		return items.length ? items.map((i) => ({
			purchase_value: Math.round(Number(i["quantity"]) * Number(i["unit_cost"] ?? i["unit_price"]) * 100) / 100,
			sale_value: Math.round(Number(i["quantity"]) * Number(i["unit_price"]) * 100) / 100,
			sales_tax_charged: Math.round((Number(i["line_total"]) - Number(i["quantity"]) * Number(i["unit_cost"])) * 100) / 100,
			total_purchase_amount: i["line_total"],
			...head(d),
			vehicle_type: d["vehicle_type"],
			vehicle_number: d["vehicle_number"],
			buyer_type: d["buyer_type"],
			sales_tax_number: d["sales_tax_number"],
			...i
		})) : [head(d)];
	});
}
//#endregion
export { importQuotations as a, purchaseFields as c, importPurchases as i, quotationExportFields as l, importInvoices as n, invoiceFields as o, importOpeningStock as r, openingStockFields as s, flatten as t, quotationFields as u };
