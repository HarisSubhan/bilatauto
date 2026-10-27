import { calculateLine, hsSelectionPatch } from "@/lib/document-calculations";
import { Plus, X } from "lucide-react";
import { HsCodePicker, type HsPick } from "@/components/data/HsCodePicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { needsRetailPrice, needsSro } from "@/lib/goods-rules";

const money = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export type AnyLine = { hs_code: string; part_number: string; description: string; description_source: "fbr" | "custom"; uom: string; quantity: number; tax_percent: number; item_kind?: "goods" | "service"; service_percent?: number | null; sro_schedule_no?: string; sro_item_serial_no?: string; product_name?:string; type_of_goods?:string; type_of_goods_id?:string|null; uom_id?:string|null; retail_sales_value?:number } & Record<string, unknown>;

/** One card per item. HS code ⇄ description auto-fill each other from the Custom HS list. */
export function LineItems<L extends AnyLine>({ lines, upd, setLines, priceKey, quotation = false }: {
  lines: L[];
  upd: (i: number, p: Partial<L>) => void;
  setLines: (fn: (ls: L[]) => L[]) => void;
  priceKey: string;
  quotation?: boolean;
}) {
  const goods = useQuery({queryKey:["type_of_goods","active"],queryFn:async()=>{const {data,error}=await db.from("type_of_goods").select("id,name").eq("status","active").order("serial_number");if(error)throw new Error(error.message);return data??[];}});
  const uoms = useQuery({queryKey:["units_of_measurement","active"],queryFn:async()=>{const {data,error}=await db.from("units_of_measurement").select("id,name").eq("status","active").order("serial_number");if(error)throw new Error(error.message);return data??[];}});
  const sros = useQuery({queryKey:["sro_master","active"],queryFn:async()=>{const {data,error}=await db.from("sro_master").select("id,name").eq("status","active").order("serial_number");if(error)throw new Error(error.message);return data??[];}});
  const sales = priceKey !== "unit_cost";
  const calc = (l: L) => calculateLine(l, Number(l[priceKey] ?? 0), sales);
  const pick = (i: number) => (p: HsPick) => {
    const line = lines[i];
    if (!line) return;
    upd(i, hsSelectionPatch(line, p, goods.data ?? []) as unknown as Partial<L>);
  };
  return (
    <div className="space-y-3">
      {lines.map((l, i) => (
        <div key={i} className="rounded-lg border border-border bg-card p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2"><span className="text-sm font-semibold">Item {i + 1}</span>
              <div className="inline-flex rounded-md border border-border p-0.5 text-xs" role="group" aria-label={`Item ${i + 1} type`}>
                {(["goods", "service"] as const).map((k) => <button key={k} type="button" aria-pressed={(l.item_kind ?? "goods") === k} className={`rounded px-2 py-1 ${(l.item_kind ?? "goods") === k ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                  onClick={() => upd(i, (k === "service" ? { item_kind: k, quantity: l.quantity || 1 } : { item_kind: k, service_percent: null }) as unknown as Partial<L>)}>{k === "goods" ? "Goods" : "Service"}</button>)}
              </div></div>
            <Button size="icon" variant="ghost" aria-label="Remove item" onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))} disabled={lines.length === 1}><X className="size-4" /></Button>
          </div>
          <div className="mb-3"><Label>{quotation ? "Product Name *" : "Part Name (optional — printed on the Bill and Simplified invoice)"}</Label><Input aria-label={`Product name item ${i+1}`} maxLength={250} value={String(l["product_name"]??"")} onChange={e=>upd(i,{product_name:e.target.value} as unknown as Partial<L>)} /></div>
          <div className="grid gap-3 md:grid-cols-[10rem_1fr_9rem]">
            <div><Label className="text-xs">HS code</Label><HsCodePicker mode="hs" sources={["custom"]} value={l.hs_code} onPick={pick(i)} onType={(v) => upd(i, { hs_code: v } as unknown as Partial<L>)} /></div>
            <div><Label className="text-xs">HS description</Label><HsCodePicker mode="description" sources={["custom"]} value={l.description} onPick={pick(i)} onType={(v) => upd(i, { description: v } as unknown as Partial<L>)} /></div>
            <div><Label className="text-xs">Part no. (optional)</Label><Input value={l.part_number} onChange={(e) => upd(i, { part_number: e.target.value } as unknown as Partial<L>)} /></div>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div><Label>Type of Goods{quotation?"":" *"}</Label><Select value={String(l["type_of_goods_id"]??"")} onValueChange={id=>{const v=goods.data?.find((v:any)=>v.id===id);if(v)upd(i,{type_of_goods_id:id,type_of_goods:v.name} as unknown as Partial<L>);}}><SelectTrigger aria-label={`Type of Goods item ${i+1}`}><SelectValue placeholder={String(l["type_of_goods"]||"Select Type of Goods")} /></SelectTrigger><SelectContent>{goods.data?.map((v:any)=><SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>UOM{quotation||l.item_kind==="service"?" (optional)":" *"}</Label><Select value={String(l["uom_id"]??"")} onValueChange={id=>{const v=uoms.data?.find((v:any)=>v.id===id);if(v)upd(i,{uom_id:id,uom:v.name} as unknown as Partial<L>);}}><SelectTrigger aria-label={`UOM item ${i+1}`}><SelectValue placeholder={l.uom||"Select UOM"} /></SelectTrigger><SelectContent>{uoms.data?.map((v:any)=><SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}</SelectContent></Select></div>
          </div>
          {priceKey !== "unit_cost" && <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div><Label>SRO / Schedule{needsSro(l.type_of_goods)?" *":""}</Label><Select value={l.sro_schedule_no || "__none"} onValueChange={v=>upd(i,{sro_schedule_no:v==="__none"?"":v} as unknown as Partial<L>)}><SelectTrigger aria-label={`SRO item ${i+1}`}><SelectValue placeholder="No SRO" /></SelectTrigger><SelectContent><SelectItem value="__none">No SRO</SelectItem>{sros.data?.map((v:any)=><SelectItem key={v.id} value={v.name}>{v.name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>SRO item serial no.{needsSro(l.type_of_goods)?" *":""}</Label><Input maxLength={100} value={l.sro_item_serial_no ?? ""} onChange={e=>upd(i,{sro_item_serial_no:e.target.value} as unknown as Partial<L>)} placeholder="If SRO applies" /></div>
          </div>}
          {sales && needsSro(l.type_of_goods) && (!l.sro_schedule_no || !l.sro_item_serial_no) && <p className="mt-2 text-xs text-muted-foreground">FBR needs the SRO / Schedule and the item serial number for "{l.type_of_goods}".</p>}
          {sales && (needsRetailPrice(l.type_of_goods) || Number(l["retail_sales_value"] ?? 0) > 0) && <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div><Label>Fixed / Notified Value or Retail Price{needsRetailPrice(l.type_of_goods) && !quotation ? " *" : ""}</Label><Input aria-label={`Retail price item ${i+1}`} type="number" min={0} step="0.01" value={Number(l["retail_sales_value"] ?? 0)} onChange={e=>upd(i,{retail_sales_value:Number(e.target.value)} as unknown as Partial<L>)} /><p className="mt-1 text-xs text-muted-foreground">Total printed retail price for all units on this line. Sales tax is charged on this value.</p></div>
          </div>}
          {(goods.error||uoms.error)&&<p className="mt-2 text-sm text-destructive">{String((goods.error||uoms.error)?.message)}</p>}
          <div className={`mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7`}>
            <div><Label className="text-xs">Units{l.item_kind==="service"?" (optional)":""}</Label><Input type="number" min={0} value={l.quantity} onChange={(e) => upd(i, { quantity: +e.target.value } as unknown as Partial<L>)} /></div>
            {l.item_kind === "service" ? <>
              <div><Label className="text-xs">Service %</Label><Input type="number" min={0} max={100} aria-label={`Service percent item ${i + 1}`} value={l.service_percent ?? ""} onChange={(e) => upd(i, { service_percent: e.target.value === "" ? null : +e.target.value } as unknown as Partial<L>)} /></div>
              <div><Label className="text-xs">Service amount</Label><Input type="number" min={0} aria-label={`Service amount item ${i + 1}`} value={Number(l[priceKey] ?? 0)} onChange={(e) => upd(i, { [priceKey]: +e.target.value } as unknown as Partial<L>)} /></div>
            </> : <>
            <div><Label className="text-xs">Price</Label><Input type="number" min={0} value={Number(l[priceKey] ?? 0)} onChange={(e) => upd(i, { [priceKey]: +e.target.value } as unknown as Partial<L>)} /></div>
            </>}
            <div><Label className="text-xs">Sales Tax %</Label><Input type="number" min={0} value={l.tax_percent} onChange={(e) => upd(i, { tax_percent: +e.target.value } as unknown as Partial<L>)} /></div>
            <div><Label className="text-xs">{priceKey === "unit_cost" ? "Sales Tax Charged" : "Value Added Tax"}</Label><div className="flex h-9 items-center justify-end rounded-md bg-muted px-3 text-sm tabular-nums">{money(calc(l).tax)}</div></div>
            {priceKey === "unit_cost" && <><div><Label className="text-xs">Purchase Value</Label><div className="flex h-9 items-center justify-end bg-muted px-3 text-sm">{money(calc(l).gross)}</div></div><div><Label className="text-xs">Retail Sales Value *</Label><Input aria-label={`Retail Sales Value item ${i+1}`} type="number" min={0} value={Number(l["retail_sales_value"]??0)} onChange={e=>upd(i,{retail_sales_value:Number(e.target.value)} as unknown as Partial<L>)} /></div></>}
            <div><Label className="text-xs">{priceKey === "unit_cost" ? "Total Purchase Amount" : "Total"}</Label><div className="flex h-9 items-center justify-end rounded-md bg-muted px-3 text-sm font-semibold tabular-nums">{money(calc(l).total)}</div></div>
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => setLines((ls) => [...ls, { ...(ls[ls.length - 1] ?? {}), hs_code: "", part_number: "", description: "", description_source: "custom", product_name:"", retail_sales_value:0, quantity: 1, item_kind: "goods", service_percent: null, sro_item_serial_no: "", [priceKey]: 0 } as unknown as L])}>
        <Plus className="size-4" />Add item / service
      </Button>
    </div>
  );
}
