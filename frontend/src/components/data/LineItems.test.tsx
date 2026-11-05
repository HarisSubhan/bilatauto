import { fireEvent, render, screen, waitFor, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LineItems, type AnyLine } from "./LineItems";

const search = vi.hoisted(() => ({ calls: [] as Array<{ col: string; term: string }> }));
vi.mock("@/lib/db", () => ({ db: { from: (table: string) => ({
  select: () => ({
    eq: () => ({ order: async () => ({ data: [], error: null }) }),
    ilike: (col: string, term: string) => ({ limit: async () => {
      search.calls.push({ col, term });
      return { data: table === "custom_hs_codes" ? [{ hs_code: "8708.9420", description: "Steering column" }] : [], error: null };
    } }),
  }),
}) } }));

function Editor({ product_name = "", part_number = "" }: { product_name?: string; part_number?: string }) {
  const [lines, setLines] = useState<AnyLine[]>([{ product_name, part_number, hs_code: "", description: "", description_source: "custom", uom: "", quantity: 1, tax_percent: 18, unit_price: 0 }]);
  return <QueryClientProvider client={new QueryClient()}><LineItems lines={lines} setLines={setLines} priceKey="unit_price" upd={(i, patch) => setLines(old => old.map((l, j) => j === i ? { ...l, ...patch } : l))} /></QueryClientProvider>;
}

afterEach(() => { cleanup(); search.calls.length = 0; });
describe("manual part identity and linked HS dropdowns", () => {
  it("typing 87 searches HS codes; selecting fills the description without filling part identity", async () => {
    render(<Editor />);
    fireEvent.change(screen.getByRole("textbox", { name: "HS code" }), { target: { value: "87" } });
    fireEvent.click(await screen.findByRole("button", { name: "8708.9420 Steering column" }));
    expect(search.calls).toContainEqual({ col: "hs_code", term: "%87%" });
    expect(screen.getByRole("textbox", { name: "HS code" })).toHaveValue("8708.9420");
    expect(screen.getByRole("textbox", { name: "HS description" })).toHaveValue("Steering column");
    expect(screen.getByRole("textbox", { name: "Product name item 1" })).toHaveValue("");
  });
  it("description typing and selection fill the code while leaving manually entered parts unchanged", async () => {
    render(<Editor product_name="My part" part_number="PN-87" />);
    fireEvent.change(screen.getByRole("textbox", { name: "HS description" }), { target: { value: "Steering" } });
    expect(screen.getByRole("textbox", { name: "Product name item 1" })).toHaveValue("My part");
    fireEvent.click(await screen.findByRole("button", { name: "8708.9420 Steering column" }));
    await waitFor(() => expect(screen.getByRole("textbox", { name: "HS code" })).toHaveValue("8708.9420"));
    expect(search.calls).toContainEqual({ col: "description", term: "%Steering%" });
    expect(screen.getByRole("textbox", { name: "HS description" })).toHaveValue("Steering column");
    expect(screen.getByRole("textbox", { name: "Product name item 1" })).toHaveValue("My part");
    expect(screen.getAllByRole("textbox").some(input => (input as HTMLInputElement).value === "PN-87")).toBe(true);
  });
  it("typing a description alone never fills a blank part name", () => {
    render(<Editor />);
    fireEvent.change(screen.getByRole("textbox", { name: "HS description" }), { target: { value: "Manual HS description" } });
    expect(screen.getByRole("textbox", { name: "Product name item 1" })).toHaveValue("");
  });
});