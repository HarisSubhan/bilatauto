import { describe, expect, it } from "vitest";
import { defaultDisplay, partName, printedDate } from "./print";

describe("invoice presentation rules", () => {
  it("dates display as 05-11-2026 without changing the stored date", () => expect(printedDate("2026-11-05")).toBe("05-11-2026"));
  it("service names display exactly as manually entered, never as HS descriptions", () => {
    expect(partName({ item_kind: "service", product_name: "Bumper Paint Labour", description: "FBR service description" })).toBe("Bumper Paint Labour");
    expect(partName({ item_kind: "service", product_name: "", description: "FBR service description" })).toBe("—");
  });
  it("both document types preserve their default format while allowing explicit overrides", () => {
    expect(defaultDisplay("bill")).toBe("part"); expect(defaultDisplay("sales")).toBe("hs");
  });
});