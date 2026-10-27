import { describe, expect, it } from "vitest";
import { calculateLine, documentLineSchema, savedLine, hsSelectionPatch, uniqueInvoiceRows } from "./document-calculations";

describe("editing saved items", () => {
  it("accepts empty SRO fields saved as null", () => {
    const l = documentLineSchema.parse({ hs_code: "8421.2300", description: "Filter", description_source: "custom", quantity: 1, unit_price: 500, tax_percent: 18, sro_schedule_no: null, sro_item_serial_no: null, type_of_goods: null, uom: null });
    expect(l.sro_schedule_no).toBe("");
    expect(l.sro_item_serial_no).toBe("");
  });
  it("keeps blank defaults instead of null when opening a saved item", () => {
    expect(savedLine({ sro_schedule_no: "", quantity: 1 }, { sro_schedule_no: null, quantity: 3 })).toEqual({ sro_schedule_no: "", quantity: 3 });
  });
});

describe("retail price", () => {
  const line = { quantity: 2, tax_percent: 18, type_of_goods: "3rd Schedule Goods", retail_sales_value: 1500 };
  it("3rd Schedule sales tax is 18% of retail 1500 = 270", () => expect(calculateLine(line, 500, true).tax).toBe(270));
  it("purchases keep tax on the purchase value", () => expect(calculateLine(line, 500, false).tax).toBe(180));
});

describe("HS selection", () => {
  const pick={hs_code:"8708.9420",description:"Steering column",source:"custom" as const,type_of_goods:"Goods at standard rate (default)"};
  const goods=[{id:"standard",name:"Goods at standard rate (default)"}];
  it("leaves a blank part name manual",()=>expect({...{product_name:""},...hsSelectionPatch({product_name:""},pick,goods)}.product_name).toBe(""));
  it("never replaces a part name even when it matches the old HS description",()=>expect({...{product_name:"Old"},...hsSelectionPatch({product_name:"Old",description:"Old"},pick,goods)}.product_name).toBe("Old"));
  it("preserves a manually entered part name",()=>expect(hsSelectionPatch({product_name:"Toyota steering",description:"Old"},pick,goods)).not.toHaveProperty("product_name"));
  it("preserves the manually entered part number",()=>expect({...{part_number:"PN-87"},...hsSelectionPatch({part_number:"PN-87"},pick,goods)}.part_number).toBe("PN-87"));
  it("links the selected HS code and its exact description",()=>expect(hsSelectionPatch({},pick,goods)).toMatchObject({hs_code:"8708.9420",description:"Steering column",description_source:"custom"}));
  it("selects the explicit HS master mapping",()=>expect(hsSelectionPatch({},pick,goods).type_of_goods_id).toBe("standard"));
  it("clears stale classification when no mapping is available, never guessing from HS",()=>expect(hsSelectionPatch({type_of_goods:"3rd Schedule Goods"},{...pick,type_of_goods:null},goods).type_of_goods).toBe(""));
  it("preserves every HS description character without filling a part name",()=>{const p=hsSelectionPatch({}, {...pick,description:"a".repeat(1000)},goods);expect(p.description).toHaveLength(1000);expect(p).not.toHaveProperty("product_name");});
});

it("repeated validations show a single invoice row, without combining different invoices",()=>{
  expect(uniqueInvoiceRows([{id:"402",status:"old"},{id:"402",status:"validated"},{id:"403",status:"new"}])).toEqual([{id:"402",status:"validated"},{id:"403",status:"new"}]);
});
