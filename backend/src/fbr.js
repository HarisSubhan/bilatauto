/**
 * FBR IRIS Digital Invoicing — pure logic (no database, no network).
 * Field names, endpoints, scenario IDs and error codes follow
 * "Technical Specification for DI API v1.12" (PRAL, 24-Jul-2025).
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";

export const ENVIRONMENTS = ["sandbox", "production"];

/** Section 9 — Scenarios for Sandbox Testing (scenario → sale type). */
export const SCENARIOS = {
  SN001: ["Goods at standard rate to registered buyers", "Goods at standard rate (default)"],
  SN002: ["Goods at standard rate to unregistered buyers", "Goods at standard rate (default)"],
  SN003: ["Sale of Steel (Melted and Re-Rolled)", "Steel Melting and re-rolling"],
  SN004: ["Sale by Ship Breakers", "Ship breaking"],
  SN005: ["Reduced rate sale", "Goods at Reduced Rate"],
  SN006: ["Exempt goods sale", "Exempt goods"],
  SN007: ["Zero rated sale", "Goods at zero-rate"],
  SN008: ["Sale of 3rd schedule goods", "3rd Schedule Goods"],
  SN009: ["Cotton Spinners purchase from Cotton Ginners (Textile Sector)", "Cotton Ginners"],
  SN010: ["Telecom services rendered or provided", "Telecommunication services"],
  SN011: ["Toll Manufacturing sale by Steel sector", "Toll Manufacturing"],
  SN012: ["Sale of Petroleum products", "Petroleum Products"],
  SN013: ["Electricity Supply to Retailers", "Electricity Supply to Retailers"],
  SN014: ["Sale of Gas to CNG stations", "Gas to CNG stations"],
  SN015: ["Sale of mobile phones", "Mobile Phones"],
  SN016: ["Processing / Conversion of Goods", "Processing/Conversion of Goods"],
  SN017: ["Sale of Goods where FED is charged in ST mode", "Goods (FED in ST Mode)"],
  SN018: ["Services rendered or provided where FED is charged in ST mode", "Services (FED in ST Mode)"],
  SN019: ["Services rendered or provided", "Services"],
  SN020: ["Sale of Electric Vehicles", "Electric Vehicle"],
  SN021: ["Sale of Cement /Concrete Block", "Cement /Concrete Block"],
  SN022: ["Sale of Potassium Chlorate", "Potassium Chlorate"],
  SN023: ["Sale of CNG", "CNG Sales"],
  SN024: ["Goods sold that are listed in SRO 297(1)/2023", "Goods as per SRO.297(I)/2023"],
  SN025: ["Drugs sold at fixed ST rate under serial 81 of Eighth Schedule Table 1", "Non-Adjustable Supplies"],
  SN026: ["Sale to End Consumer by retailers", "Goods at standard rate (default)"],
  SN027: ["Sale to End Consumer by retailers", "3rd Schedule Goods"],
  SN028: ["Sale to End Consumer by retailers", "Goods at Reduced Rate"],
};

const norm = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
const r2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

/** Section 7 — Sales error codes with FBR's own explanation, extracted from the uploaded document. */
let ERRORS = {};
try { ERRORS = JSON.parse(readFileSync(new URL("./fbr-error-codes.json", import.meta.url), "utf8")); } catch { ERRORS = {}; }

/* ---------------- token encryption ---------------- */
function key() {
  const k = process.env.FBR_SECRET_KEY || process.env.JWT_SECRET;
  if (!k) throw Object.assign(new Error("Server is missing FBR_SECRET_KEY / JWT_SECRET"), { status: 500 });
  return createHash("sha256").update("fbr:" + k).digest();
}
export function encryptToken(plain) {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([c.update(String(plain), "utf8"), c.final()]);
  return [iv, c.getAuthTag(), enc].map((b) => b.toString("base64")).join(".");
}
export function decryptToken(stored) {
  if (!stored) return null;
  const [iv, tag, enc] = stored.split(".").map((s) => Buffer.from(s, "base64"));
  const d = createDecipheriv("aes-256-gcm", key(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(enc), d.final()]).toString("utf8");
}

/* ---------------- payload ---------------- */
/**
 * Build the DI API request body from an existing Sales Tax Invoice.
 * inv: invoice row + department fields; items: invoice_items with fbr_description; seller: settings.
 */
export function buildPayload({ inv, items, seller, environment, scenarioId }) {
  // Buyer type is stored on the invoice; older invoices fall back to the buyer record.
  const buyerType = inv.buyer_type || inv.registration_type;
  const registered = buyerType === "Registered";
  const body = {
    invoiceType: "Sale Invoice",
    invoiceDate: String(inv.invoice_date).slice(0, 10),
    sellerNTNCNIC: digits(seller.ntn),
    sellerBusinessName: String(seller.name ?? "").trim(),
    sellerProvince: String(seller.province ?? "").trim(),
    sellerAddress: String(seller.address ?? "").trim(),
    buyerNTNCNIC: digits(inv.buyer_ntn ?? inv.tax_number),
    buyerBusinessName: String(inv.buyer_name ?? inv.department_name ?? "").trim(),
    buyerProvince: String(inv.province ?? "").trim(),
    buyerAddress: String(inv.address ?? "").trim(),
    buyerRegistrationType: registered ? "Registered" : buyerType === "Unregistered" ? "Unregistered" : "",
    invoiceRefNo: "",
    ...(environment === "sandbox" ? { scenarioId: scenarioId || "" } : {}),
    items: [...items].sort((a, b) => (a.line_position ?? 0) - (b.line_position ?? 0)).map((it) => {
      const service = it.item_kind === "service";
      // Service lines (e.g. labour) carry the manually entered amount as their value; quantity defaults to 1.
      const value = service ? r2(Number(it.unit_price)) : r2(Number(it.quantity) * Number(it.unit_price) - Number(it.discount || 0));
      const tax = r2(it.sales_tax_value ?? (value * Number(it.tax_percent)) / 100);
      return {
        hsCode: String(it.fbr_hs_code || it.hs_code || "").trim(),
        productDescription: String(it.fbr_description || it.product_name || it.description || "").trim(),
        rate: `${Number(it.tax_percent)}%`,
        uoM: String(it.uom ?? "").trim(),
        quantity: Number(it.quantity) > 0 ? Number(it.quantity) : 1,
        totalValues: r2(value + tax),
        valueSalesExcludingST: value,
        fixedNotifiedValueOrRetailPrice: 0,
        salesTaxApplicable: tax,
        salesTaxWithheldAtSource: 0,
        extraTax: 0,
        furtherTax: 0,
        sroScheduleNo: String(it.sro_schedule_no ?? "").trim(),
        fedPayable: 0,
        discount: service ? 0 : r2(it.discount || 0),
        saleType: String(it.type_of_goods ?? "").trim(),
        sroItemSerialNo: String(it.sro_item_serial_no ?? "").trim(),
      };
    }),
  };
  return body;
}
const digits = (s) => String(s ?? "").replace(/[^0-9]/g, "");
export const payloadHash = (p) => createHash("sha256").update(JSON.stringify({ ...p, scenarioId: undefined })).digest("hex");

/* ---------------- pre-validation ---------------- */
/**
 * Local checks from the documented field rules, run before calling FBR.
 * Returns issues: { where, field, problem, fix, auto? } — auto issues can be fixed safely by the system.
 */
export function precheck(p, { environment, uomList = [], provinceList = [], invoice } = {}) {
  const out = [];
  const add = (where, field, problem, fix, extra = {}) => out.push({ where, field, problem, fix, ...extra });
  const H = "Invoice";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.invoiceDate)) add(H, "Invoice date", "The invoice date is not a valid date.", "Open the invoice and set a correct date.");
  if (!/^(\d{7}|\d{13})$/.test(p.sellerNTNCNIC)) add("Your company", "Seller NTN/CNIC", "Your company's NTN must be 7 digits (or CNIC 13 digits).", "Go to FBR Invoicing → Settings and enter your NTN.");
  if (!p.sellerBusinessName) add("Your company", "Seller name", "Your company name is empty.", "Enter it in Settings → Company name.");
  if (!p.sellerAddress) add("Your company", "Seller address", "Your company address is empty.", "Enter it in Settings → Company address.");
  if (!p.sellerProvince) add("Your company", "Seller province", "Your company's province is not set.", "Choose it in FBR Invoicing → Settings.");
  else if (provinceList.length && !provinceList.some((x) => norm(x) === norm(p.sellerProvince))) add("Your company", "Seller province", `"${p.sellerProvince}" is not in FBR's province list.`, "Choose a province from the list in FBR Invoicing → Settings.");
  if (!p.buyerRegistrationType) add("Buyer", "Buyer type", "The invoice buyer type is not Registered or Unregistered.", "Edit the invoice and choose a Buyer Type (or set the registration type on the buyer in Departments / Buyers).");
  if (p.buyerRegistrationType === "Registered" && !/^(\d{7}|\d{9}|\d{13})$/.test(p.buyerNTNCNIC)) add("Buyer", "Buyer NTN/CNIC", "A registered buyer needs an NTN (7 or 9 digits) or CNIC (13 digits).", "Edit the buyer and enter the correct Tax / Registration No.");
  if (p.buyerNTNCNIC && p.buyerNTNCNIC === p.sellerNTNCNIC) add("Buyer", "Buyer NTN/CNIC", "Buyer and seller have the same NTN — FBR does not allow self-invoicing (error 0058).", "Check the buyer's Tax / Registration No.");
  if (!p.buyerBusinessName) add("Buyer", "Buyer name", "The buyer name is empty.", "Edit the buyer and enter a name.");
  if (!p.buyerAddress) add("Buyer", "Buyer address", "The buyer address is empty.", "Edit the buyer and enter an address.");
  if (!p.buyerProvince) add("Buyer", "Buyer province", "The buyer's province is not set.", "Edit the buyer and choose a province.");
  else if (provinceList.length && !provinceList.some((x) => norm(x) === norm(p.buyerProvince))) add("Buyer", "Buyer province", `"${p.buyerProvince}" is not in FBR's province list.`, "Edit the buyer and pick a province spelled as FBR lists it.");
  if (environment === "sandbox") {
    const sc = SCENARIOS[p.scenarioId];
    if (!sc) add(H, "Scenario", "A Sandbox test scenario must be chosen.", "Pick a scenario (for example SN001) before validating.");
    else {
      if (p.scenarioId === "SN001" && p.buyerRegistrationType === "Unregistered") add(H, "Scenario", "SN001 is for registered buyers but this buyer is Unregistered.", "Use SN002 for unregistered buyers.", { auto: { type: "scenario", value: "SN002" } });
      if (p.scenarioId === "SN002" && p.buyerRegistrationType === "Registered") add(H, "Scenario", "SN002 is for unregistered buyers but this buyer is Registered.", "Use SN001 for registered buyers.", { auto: { type: "scenario", value: "SN001" } });
    }
  }
  if (p.invoiceType === "Debit Note" && !p.invoiceRefNo) add(H, "Invoice reference", "A debit note needs the original FBR invoice reference.", "Enter the original FBR invoice number.");
  if (!p.items.length) add(H, "Items", "The invoice has no items.", "Add at least one item.");
  p.items.forEach((it, i) => {
    const W = `Item ${i + 1}${it.productDescription ? ` (${it.productDescription.slice(0, 40)})` : ""}`;
    if (!/^\d{4}\.\d{4}$/.test(it.hsCode)) add(W, "HS Code", it.hsCode ? `HS code "${it.hsCode}" is not in FBR format 0000.0000.` : "This product has no FBR HS code.", "Map this product's Custom HS Code to the correct FBR HS Code.");
    if (!it.productDescription) add(W, "Description", "The product description is empty.", "Add a description to the HS code.");
    if (!it.uoM) add(W, "UOM", "Unit of measurement is missing. FBR requires a UOM on every line, including service lines.", "Edit the invoice and choose the UOM that FBR expects for this HS code (for services this is usually the one shown by FBR for that HS code).");
    else if (uomList.length && !uomList.some((u) => norm(u) === norm(it.uoM))) {
      const near = uomList.find((u) => norm(u).startsWith(norm(it.uoM).slice(0, 4)));
      add(W, "UOM", `"${it.uoM}" is not one of FBR's UOM names.`, near ? `Use "${near}".` : "Choose a UOM from FBR's list.", near ? { auto: { type: "uom", line: i, value: near } } : {});
    }
    if (!(it.quantity > 0)) add(W, "Quantity", "Quantity must be greater than zero.", "Edit the invoice quantity.");
    if (!(it.valueSalesExcludingST >= 0)) add(W, "Value", "The sales value is negative.", "Check the price and discount.");
    if (it.sroItemSerialNo && !it.sroScheduleNo) add(W, "SRO", "An SRO item serial number is entered but no SRO / Schedule is selected.", "Choose the SRO / Schedule from the SRO Master, or clear the serial number.");
    if (it.sroScheduleNo && !it.sroItemSerialNo && !/standard rate/i.test(it.saleType)) add(W, "SRO item serial no.", `SRO ${it.sroScheduleNo} is selected without an item serial number.`, "Enter the serial number of this item within the SRO / Schedule, if FBR requires it for this sale type.", { warning: true });
    if (!it.saleType) add(W, "Sale type", "Type of Goods (sale type) is missing.", "Edit the invoice and choose a Type of Goods.");
    if (environment === "sandbox" && SCENARIOS[p.scenarioId] && it.saleType && norm(it.saleType) !== norm(SCENARIOS[p.scenarioId][1])) add(W, "Sale type", `Scenario ${p.scenarioId} expects sale type "${SCENARIOS[p.scenarioId][1]}" but this item is "${it.saleType}".`, "Choose a scenario that matches the items, or correct the Type of Goods.");
    const expTax = r2((it.valueSalesExcludingST * parseFloat(it.rate)) / 100);
    if (["Goods at standard rate (default)", "Goods at Reduced Rate", "Goods at zero-rate", "Exempt goods"].some(x => norm(x) === norm(it.saleType)) && Number.isFinite(expTax) && Math.abs(expTax - it.salesTaxApplicable) > 0.01) add(W, "Sales tax", `Sales tax should be ${expTax} (${it.rate} of ${it.valueSalesExcludingST}) but is ${it.salesTaxApplicable}.`, "Recalculate the item from its value and rate.", { auto: { type: "recalc" } });
    if (/3rd schedule/i.test(it.saleType) && !(it.fixedNotifiedValueOrRetailPrice > 0)) add(W, "Retail price", "3rd Schedule goods need the printed retail price.", "This value is not stored on invoices yet — please confirm the retail price before sending.", { manual: true });
  });
  if (invoice && Number(invoice.labor_amount) > 0) add(H, "Labor (earlier record)", `This older invoice has ${invoice.labor_amount} of separate labor, which is not an FBR line.`, "Add the labor as a Service line with its HS code, then send again.", { warning: true });
  return out;
}

/* ---------------- response interpretation ---------------- */
const PLAIN = {
  "0019": ["This product has no HS code.", "Map the product to an FBR HS Code."],
  "0044": ["This product has no HS code.", "Map the product to an FBR HS Code."],
  "0052": ["The HS code does not match the chosen sale type.", "Check the FBR HS Code and the Type of Goods of this item."],
  "0046": ["The tax rate is missing.", "Set the GST % on this item."],
  "0020": ["The tax rate is missing.", "Set the GST % on this item."],
  "0099": ["The UOM is missing or not valid for this HS code.", "Edit the line and choose the UOM FBR expects for this HS code from the UOM master (this also applies to service lines)."],
  "0096": ["This HS code only accepts the KWH unit.", "Set the line's UOM to KWH."],
  "0097": ["This HS code only accepts the KG unit.", "Set the line's UOM to KG."],
  "0098": ["Quantity is missing.", "Enter the units on this line (service lines default to 1)."],
  "0021": ["The value or quantity of this line is missing.", "Enter the price / service amount and units on this line."],
  "0077": ["This sale type needs an SRO / Schedule number.", "Edit the line and choose the SRO / Schedule from the SRO Master."],
  "0078": ["This sale type needs the item serial number within the SRO.", "Edit the line and enter the SRO item serial no."],
  "0053": ["The buyer type is not valid.", "Choose Registered or Unregistered as the invoice Buyer Type."],
  "0013": ["The sale type is not valid.", "Choose a Type of Goods from the list."],
  "0092": ["The sale type is not valid.", "Choose a Type of Goods from the list."],
  "0002": ["The buyer's NTN/CNIC is not in the right format.", "Enter 7 or 9 digit NTN or 13 digit CNIC on the buyer."],
  "0009": ["The buyer's NTN/CNIC is missing.", "Enter the buyer's Tax / Registration No."],
  "0010": ["The buyer name is missing.", "Enter the buyer's name."],
  "0012": ["The buyer type is missing.", "Choose Registered or Unregistered as the invoice Buyer Type."],
  "0005": ["The invoice date format is wrong.", "The system sends YYYY-MM-DD; check the invoice date."],
  "0058": ["Buyer and seller NTN are the same.", "Correct the buyer's NTN."],
  "0083": ["Seller NTN does not match your token.", "Check your NTN in FBR Settings matches the token's registration."],
  "0108": ["Seller NTN is invalid.", "Check your NTN in FBR Settings."],
  "0401": ["Your token is not authorised for this seller NTN.", "Check the token and seller NTN in FBR Settings."],
  "0402": ["The buyer NTN/CNIC is not authorised.", "Check the buyer's NTN/CNIC."],
};
export function explain(code, fbrText, where) {
  const doc = ERRORS[code] || {};
  const [problem, fix] = PLAIN[code] || [fbrText || doc.message || "FBR rejected this invoice.", doc.fix || "Review the field FBR mentions and correct the invoice."];
  return { code: code || null, where, problem, fix, fbr_message: fbrText || doc.message || null, fbr_guidance: doc.fix || null };
}

/**
 * Interpret a DI API response. Returns { outcome, invoiceNumber, errors }.
 * outcome: valid | invalid | unauthorized | server_error | unknown
 */
export function interpret(httpStatus, body) {
  if (httpStatus === 401) return { outcome: "unauthorized", errors: [explain(null, "Unauthorized — the token was rejected by FBR.", "Connection")].map((e) => ({ ...e, problem: "FBR did not accept your token.", fix: "Check the token for this environment in FBR Settings." })) };
  if (httpStatus >= 500) return { outcome: "server_error", errors: [{ where: "FBR", problem: "FBR's server reported an error.", fix: "Try again later. If it repeats, contact PRAL.", fbr_message: typeof body === "string" ? body.slice(0, 300) : null }] };
  const v = body && body.validationResponse;
  if (!v) return { outcome: "unknown", errors: [{ where: "FBR", problem: "FBR's reply was not in the expected format.", fix: "Check the full response in history; the invoice was not marked as sent.", fbr_message: JSON.stringify(body ?? null).slice(0, 300) }] };
  const errors = [];
  if (v.errorCode || (v.error && String(v.statusCode) !== "00")) errors.push(explain(v.errorCode, v.error, "Invoice"));
  for (const s of v.invoiceStatuses || []) if (String(s.statusCode) !== "00") errors.push(explain(s.errorCode, s.error, `Item ${s.itemSNo}`));
  const valid = String(v.statusCode) === "00" && /^valid$/i.test(String(v.status)) && errors.length === 0;
  return { outcome: valid ? "valid" : "invalid", invoiceNumber: body.invoiceNumber || null, dated: body.dated || null, errors };
}
