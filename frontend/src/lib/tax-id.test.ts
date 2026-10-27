import { describe, expect, it } from "vitest";
import { normalizeTaxId, validTaxId, decodeFbrJson } from "./tax-id";
import { buyerTypeProblem } from "./buyer-type";

describe("IRIS identities", () => {
  it("preserves the buyer C rather than corrupting C01245-5", () => {
    expect(normalizeTaxId("C01245-5")).toBe("C012455");
    expect(buyerTypeProblem("Registered", "C01245-5")).toBeNull();
    expect(buyerTypeProblem("Unregistered", "C01245-5")).toBeNull();
  });
  it("accepts the seller display NTN and sends the seven-character registration", () => {
    expect(validTaxId("7079463-0")).toBe(true);
    expect(normalizeTaxId("7079463-0")).toBe("7079463");
  });
  it("keeps NTN alphabets anywhere rather than only a leading C", () => {
    expect(validTaxId("AB12345-6")).toBe(true);
    expect(normalizeTaxId("AB12345-6")).toBe("AB12345");
    expect(validTaxId("12AB345")).toBe(true);
    expect(normalizeTaxId("12AB345")).toBe("12AB345");
  });
  it("retains CNIC digits and rejects malformed optional buyer identities", () => {
    expect(normalizeTaxId("35202-1234567-1")).toBe("3520212345671");
    expect(buyerTypeProblem("Unregistered", "012455")).not.toBeNull();
    expect(buyerTypeProblem("Unregistered", "")).toBeNull();
  });
  it("decodes the quoted FBR validation response", () => {
    const response = { validationResponse: { statusCode: "01", errorCode: "0002" } };
    expect(decodeFbrJson(JSON.stringify(JSON.stringify(response)))).toEqual(response);
  });
});