import { test } from "node:test";
import assert from "node:assert/strict";
process.env.FBR_SECRET_KEY = "test-key";
const { buildPayload, precheck, interpret, encryptToken, decryptToken, payloadHash } = await import("./fbr.js");

const seller = { ntn: "1234567", name: "Bilal Autos", address: "Karachi", province: "SINDH" };
const inv = { invoice_date: "2026-10-20", buyer_ntn: "7654321", buyer_name: "Buyer Co", address: "Lahore", province: "PUNJAB", registration_type: "Registered", labor_amount: 0 };
const item = { hs_code: "C-1", fbr_hs_code: "8708.2900", fbr_description: "Body parts", description: "Bumper", quantity: 3, unit_price: 100, tax_percent: 18, sales_tax_value: 54, uom: "Numbers, pieces, units", type_of_goods: "Goods at standard rate (default)", line_position: 0 };

test("payload uses documented field names and FBR HS code with the invoice description", () => {
  const p = buildPayload({ inv, items: [item], seller, environment: "sandbox", scenarioId: "SN001" });
  assert.equal(p.invoiceType, "Sale Invoice");
  assert.equal(p.scenarioId, "SN001");
  assert.equal(p.items[0].hsCode, "8708.2900");
  assert.equal(p.items[0].productDescription, "Bumper");
  assert.equal(p.items[0].rate, "18%");
  assert.equal(p.items[0].valueSalesExcludingST, 300);
  assert.equal(p.items[0].salesTaxApplicable, 54);
  assert.equal(p.items[0].totalValues, 354);
});

test("production payload has no scenarioId", () => {
  const p = buildPayload({ inv, items: [item], seller, environment: "production" });
  assert.equal("scenarioId" in p, false);
});

test("precheck passes a complete invoice", () => {
  const p = buildPayload({ inv, items: [item], seller, environment: "sandbox", scenarioId: "SN001" });
  assert.deepEqual(precheck(p, { environment: "sandbox" }).filter((x) => !x.warning), []);
});

test("precheck catches missing FBR HS code and wrong seller NTN", () => {
  const p = buildPayload({ inv, items: [{ ...item, fbr_hs_code: "", hs_code: "C-1" }], seller: { ...seller, ntn: "12" }, environment: "sandbox", scenarioId: "SN001" });
  const fields = precheck(p, { environment: "sandbox" }).map((x) => x.field);
  assert.ok(fields.includes("HS Code"));
  assert.ok(fields.includes("Seller NTN/CNIC"));
});

test("SN001 with unregistered buyer offers auto-fix to SN002", () => {
  const p = buildPayload({ inv: { ...inv, registration_type: "Unregistered", buyer_ntn: "" }, items: [item], seller, environment: "sandbox", scenarioId: "SN001" });
  const fix = precheck(p, { environment: "sandbox" }).find((x) => x.auto?.type === "scenario");
  assert.equal(fix.auto.value, "SN002");
});

test("UOM not in FBR list is flagged", () => {
  const p = buildPayload({ inv, items: [{ ...item, uom: "pcs" }], seller, environment: "production" });
  assert.ok(precheck(p, { environment: "production", uomList: ["Numbers, pieces, units", "KG"] }).some((x) => x.field === "UOM"));
});

test("valid FBR response is read as valid with FBR invoice number", () => {
  const r = interpret(200, { invoiceNumber: "7000007DI1747119701593", validationResponse: { statusCode: "00", status: "Valid", error: "", invoiceStatuses: [{ itemSNo: "1", statusCode: "00", status: "Valid" }] } });
  assert.equal(r.outcome, "valid");
  assert.equal(r.invoiceNumber, "7000007DI1747119701593");
});

test("header and item errors from FBR are explained", () => {
  const a = interpret(200, { validationResponse: { statusCode: "01", status: "Invalid", errorCode: "0052", error: "Provide proper HS Code", invoiceStatuses: null } });
  assert.equal(a.outcome, "invalid"); assert.equal(a.errors[0].code, "0052");
  const b = interpret(200, { validationResponse: { statusCode: "00", status: "invalid", invoiceStatuses: [{ itemSNo: "1", statusCode: "01", errorCode: "0046", error: "Provide rate." }] } });
  assert.equal(b.outcome, "invalid"); assert.equal(b.errors[0].where, "Item 1");
});

test("401 is unauthorized, not a validation result", () => {
  assert.equal(interpret(401, "").outcome, "unauthorized");
});

test("token encryption round-trips and does not store plain text", () => {
  const enc = encryptToken("secret-token-123");
  assert.ok(!enc.includes("secret-token"));
  assert.equal(decryptToken(enc), "secret-token-123");
});

test("payload hash ignores scenario but changes when an amount changes", () => {
  const a = buildPayload({ inv, items: [item], seller, environment: "sandbox", scenarioId: "SN001" });
  const b = buildPayload({ inv, items: [item], seller, environment: "sandbox", scenarioId: "SN002" });
  const c = buildPayload({ inv, items: [{ ...item, quantity: 4, sales_tax_value: 72 }], seller, environment: "sandbox", scenarioId: "SN001" });
  assert.equal(payloadHash(a), payloadHash(b));
  assert.notEqual(payloadHash(a), payloadHash(c));
});

 test("buyer identity comes from invoice department, not company seller settings", () => {
  const p = buildPayload({ inv: { invoice_date: "2026-10-20", department_name: "Department Buyer", tax_number: "7654321", province: "PUNJAB", registration_type: "Registered" }, items: [item], seller, environment: "production" });
  assert.equal(p.buyerNTNCNIC, "7654321");
  assert.equal(p.buyerProvince, "PUNJAB");
  assert.equal(p.buyerBusinessName, "Department Buyer");
  assert.equal(p.sellerNTNCNIC, "1234567");
  assert.equal(p.sellerProvince, "SINDH");
 });

test("service line (labour) sends its manual amount once, with SRO fields and invoice buyer type", () => {
  const svc = { ...item, item_kind: "service", hs_code: "S-1", fbr_hs_code: "9987.9000", fbr_description: "Repair services", quantity: 1, unit_price: 2000, tax_percent: 16, sales_tax_value: 320, type_of_goods: "Services", sro_schedule_no: "ICTO TABLE II", sro_item_serial_no: "5", line_position: 1 };
  const p = buildPayload({ inv: { ...inv, registration_type: "Registered", buyer_type: "Unregistered" }, items: [item, svc], seller, environment: "production" });
  assert.equal(p.buyerRegistrationType, "Unregistered");
  assert.equal(p.items.length, 2);
  assert.equal(p.items[1].valueSalesExcludingST, 2000);
  assert.equal(p.items[1].totalValues, 2320);
  assert.equal(p.items[1].quantity, 1);
  assert.equal(p.items[1].sroScheduleNo, "ICTO TABLE II");
  assert.equal(p.items[1].sroItemSerialNo, "5");
  assert.equal(p.items[0].sroScheduleNo, "");
  // SST flow: the service line carries its own sale type and 16% service sales tax, kept separate from the goods line's GST.
  assert.equal(p.items[1].saleType, "Services");
  assert.equal(p.items[1].salesTaxApplicable, 320);
  assert.equal(p.items[1].rate, "16%");
  assert.equal(p.items[0].saleType, "Goods at standard rate (default)");
  assert.equal(p.items[0].salesTaxApplicable, 54);
});

test("missing UOM on a service line is explained, and SRO serial without SRO is flagged", () => {
  const svc = { ...item, item_kind: "service", uom: "", quantity: 1, unit_price: 500, sales_tax_value: 90, sro_item_serial_no: "3" };
  const issues = precheck(buildPayload({ inv, items: [svc], seller, environment: "production" }), { environment: "production" });
  assert.ok(issues.some((x) => x.field === "UOM" && /service/i.test(x.problem)));
  assert.ok(issues.some((x) => x.field === "SRO"));
});

test("FBR SRO errors 0077/0078 map to plain guidance", () => {
  const r = interpret(200, { validationResponse: { statusCode: "01", status: "Invalid", invoiceStatuses: [{ itemSNo: "2", statusCode: "01", errorCode: "0077", error: "Provide SRO/Schedule No." }] } });
  assert.equal(r.outcome, "invalid");
  assert.match(r.errors[0].fix, /SRO Master/);
  assert.equal(r.errors[0].fbr_message, "Provide SRO/Schedule No.");
});
