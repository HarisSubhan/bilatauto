import { calculateLine } from "@/lib/document-calculations";
import { Plus, X } from "lucide-react";
import { HsCodePicker, type HsPick } from "@/components/data/HsCodePicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const money = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export type AnyLine = { hs_code: string; part_number: string; description: string; description_source: "fbr" | "custom"; uom: string; quantity: number; discount: number; tax_percent: number; labor_percent?: number } & Record<string, unknown>;

/** One card per item. HS code ⇄ description auto-fill each other from the Custom HS list. */
export function LineItems<L extends AnyLine>({ lines, upd, setLines, priceKey, labor = false }: {
  lines: L[];
  upd: (i: number, p: Partial<L>) => void;
  setLines: (fn: (ls: L[]) => L[]) => void;
  priceKey: string;
  /** Show the per-product labor % and labor amount. */
  labor?: boolean;
}) {
  const calc = (l: L) => calculateLine(l, Number(l[priceKey] ?? 0));
  const pick = (i: number) => (p: HsPick) => upd(i, { hs_code: p.hs_code, description: p.description, description_source: "custom" } as Partial<L>);
  return (
    <div className="space-y-3">
      {lines.map((l, i) => (
        <div key={i} className="rounded-lg border border-border bg-card p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold">Item {i + 1}</span>
            <Button size="icon" variant="ghost" aria-label="Remove item" onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))} disabled={lines.length === 1}><X className="size-4" /></Button>
          </div>
          <div className="grid gap-3 md:grid-cols-[10rem_1fr_9rem]">
            <div><Label className="text-xs">HS code</Label><HsCodePicker mode="hs" sources={["custom"]} value={l.hs_code} onPick={pick(i)} onType={(v) => upd(i, { hs_code: v } as Partial<L>)} /></div>
            <div><Label className="text-xs">Product / description</Label><HsCodePicker mode="description" sources={["custom"]} value={l.description} onPick={pick(i)} onType={(v) => upd(i, { description: v } as Partial<L>)} /></div>
            <div><Label className="text-xs">Part no. (optional)</Label><Input value={l.part_number} onChange={(e) => upd(i, { part_number: e.target.value } as Partial<L>)} /></div>
          </div>
          <div className={`mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 ${labor ? "lg:grid-cols-8" : "lg:grid-cols-6"}`}>
            <div><Label className="text-xs">Units</Label><Input type="number" min={0} value={l.quantity} onChange={(e) => upd(i, { quantity: +e.target.value } as Partial<L>)} /></div>
            <div><Label className="text-xs">Price</Label><Input type="number" min={0} value={Number(l[priceKey] ?? 0)} onChange={(e) => upd(i, { [priceKey]: +e.target.value } as Partial<L>)} /></div>
            <div><Label className="text-xs">Discount</Label><Input type="number" min={0} value={l.discount} onChange={(e) => upd(i, { discount: +e.target.value } as Partial<L>)} /></div>
            <div><Label className="text-xs">Sales Tax %</Label><Input type="number" min={0} value={l.tax_percent} onChange={(e) => upd(i, { tax_percent: +e.target.value } as Partial<L>)} /></div>
            <div><Label className="text-xs">Sales Tax Value</Label><div className="flex h-9 items-center justify-end rounded-md bg-muted px-3 text-sm tabular-nums">{money(calc(l).tax)}</div></div>
            {labor ? <>
              <div><Label className="text-xs">Labor %</Label><Input type="number" min={0} max={100} aria-label={`Labor percent item ${i + 1}`} value={l.labor_percent ?? 0} onChange={(e) => upd(i, { labor_percent: +e.target.value } as Partial<L>)} /></div>
              <div><Label className="text-xs">Labor amount</Label><div className="flex h-9 items-center justify-end rounded-md bg-muted px-3 text-sm tabular-nums">{money(calc(l).labor)}</div></div>
            </> : null}
            <div><Label className="text-xs">Total</Label><div className="flex h-9 items-center justify-end rounded-md bg-muted px-3 text-sm font-semibold tabular-nums">{money(calc(l).total)}</div></div>
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => setLines((ls) => [...ls, { ...ls[ls.length - 1]!, hs_code: "", part_number: "", description: "", description_source: "custom", quantity: 1, discount: 0, labor_percent: 0, [priceKey]: 0 } as L])}>
        <Plus className="size-4" />Add item
      </Button>
    </div>
  );
}
