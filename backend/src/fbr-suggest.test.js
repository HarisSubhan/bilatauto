import { test } from "node:test";
import assert from "node:assert/strict";
import { suggestFixes } from "./fbr-suggest.js";

const items = [
  { hs_code: "C-1", fbr_hs_code: "9820.2000", description: "Repair", type_of_goods: "Goods at standard rate (default)", uom: "Numbers, pieces, units" },
  { hs_code: "C-2", fbr_hs_code: "8708.9900", description: "Part", type_of_goods: "Goods at standard rate (default)", uom: "Numbers, pieces, units" },
];

test("header 0052 suggests the sale type FBR accepted earlier for that HS code, with its SRO", () => {
  const accepted = { "9820.2000": [{ type_of_goods: "Services", uom: "Numbers, pieces, units", sro_schedule_no: "ICTO TABLE I", sro_item_serial_no: "1(ii)(ii)(a)" }] };
  const [e] = suggestFixes([{ code: "0052", where: "Invoice" }], items, { accepted });
  assert.equal(e.suggestions.length, 1);
  assert.equal(e.suggestions[0].line, 0);
  assert.deepEqual(e.suggestions[0].patch, { type_of_goods: "Services", sro_schedule_no: "ICTO TABLE I", sro_item_serial_no: "1(ii)(ii)(a)" });
});

test("master Type of Goods is used when there is no accepted history", () => {
  const [e] = suggestFixes([{ code: "0052", where: "Item 2" }], items, { master: { "C-2": "3rd Schedule Goods" } });
  assert.equal(e.suggestions[0].line, 1);
  assert.equal(e.suggestions[0].value, "3rd Schedule Goods");
});

test("no evidence gives no guessed suggestion", () => {
  const [e] = suggestFixes([{ code: "0052", where: "Invoice" }], items, {});
  assert.equal(e.suggestions.length, 0);
  assert.ok(e.no_suggestion);
});

test("0097 suggests KG", () => {
  const [e] = suggestFixes([{ code: "0097", where: "Item 2" }], items, {});
  assert.deepEqual(e.suggestions[0].patch, { uom: "KG" });
});

test("unrelated errors are left unchanged", () => {
  const err = { code: "0058", where: "Invoice" };
  assert.equal(suggestFixes([err], items, {})[0], err);
});
