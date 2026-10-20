import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { readLocalImage, parseQuotationText } from "@/lib/local-ocr";
import { Textarea } from "@/components/ui/textarea";
import { documentLineSchema, roundMoney } from "@/lib/document-calculations";
import { toast } from "sonner";
import { Sparkles, Trash2, Upload } from "lucide-react";
import { db as supabase } from "@/lib/db";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { HsCodePicker, type HsPick } from "@/components/data/HsCodePicker";


export const Route = createFileRoute("/_authenticated/ai-quotation")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "AI Quotation from Image — Spare Parts System" },
      { name: "description", content: "Upload a photo of a parts list and get a draft quotation with matched HS codes." },
      { property: "og:title", content: "AI Quotation from Image — Spare Parts System" },
      { property: "og:description", content: "Upload a photo of a parts list and get a draft quotation with matched HS codes." },
    ],
  }),
  component: AiQuotationPage,
});

type Line = { read: string; hs_code: string; description: string; description_source: "fbr" | "custom"; quantity: number; unit_price: number };

async function bestMatch(name: string): Promise<HsPick | null> {
  const words = name.split(/\s+/).filter((w) => w.length > 2).slice(0, 3);
  for (const term of [name, ...words]) {
    const t = `%${term.replace(/[%,()]/g, "")}%`;
    const [c, f] = await Promise.all([
      supabase.from("custom_hs_codes").select("hs_code,description").ilike("description", t).limit(1),
      supabase.from("fbr_hs_codes").select("hs_code,description").ilike("description", t).limit(1),
    ]);
    if (c.data?.[0]) return { ...c.data[0], source: "custom" };
    if (f.data?.[0]) return { ...f.data[0], source: "fbr" };
  }
  return null;
}

function AiQuotationPage() {
  const navigate = useNavigate();
  const [rawText, setRawText] = useState("");
  const [progress, setProgress] = useState(0);
  const [vehicleType, setVehicleType] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [lines, setLines] = useState<Line[]>([]);
  const [dept, setDept] = useState("");
  const [tax, setTax] = useState(18);
  const depts = useQuery({ queryKey: ["dept-options"], queryFn: async () => (await supabase.from("departments").select("id,name").eq("status", "active").order("name")).data ?? [] });

  const onFile = (file: File) => {
    if (file.size > 8_000_000) { toast.error("Image must be under 8 MB"); return; }
    const r = new FileReader();
    r.onload = () => setPreview(String(r.result));
    r.readAsDataURL(file);
  };

  const read = async () => {
    if (!preview && !rawText.trim()) return;
    setBusy(true);
    try {
      const result = preview ? await readLocalImage(preview, setProgress) : parseQuotationText(rawText);
      if ("text" in result) setRawText(String(result.text));
      setVehicleNumber(result.vehicle_number); setVehicleType(result.vehicle_type); setReviewed(false);
      const { items } = result;
      if (!items.length) toast.warning("No items found in the image");
      const matched = await Promise.all(items.map(async (i) => {
        const m = await bestMatch(i.name);
        return { read: i.name, hs_code: m?.hs_code ?? "", description: m?.description ?? i.name, description_source: m?.source ?? "custom", quantity: i.quantity, unit_price: i.unit_price ?? 0 } as Line;
      }));
      setLines(matched);
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  };

  const upd = (i: number, p: Partial<Line>) => setLines(lines.map((l, j) => (j === i ? { ...l, ...p } : l)));

  const save = async () => {
    if (!dept) { toast.error("Select a buyer / department"); return; }
    if (!vehicleType.trim() && !vehicleNumber.trim()) { toast.error("Vehicle type or number is required"); return; }
    if (!reviewed) { toast.error("Review the extracted text, prices, units and HS codes first"); return; }
    setBusy(true);
    try {
      if (!lines.length) throw new Error("Add at least one item");
      const items = lines.map(l => documentLineSchema.parse({ ...l, product_name:l.read, discount: 0, tax_percent: tax }));
      const { error } = await supabase.rpc("create_document", { _kind: "quotation", _header: { department_id: dept, date: new Date().toISOString().slice(0,10), vehicle_type: vehicleType, vehicle_number: vehicleNumber, notes: "Draft from locally read image; reviewed by user" }, _items: items });
      if (error) throw error;
      toast.success("Draft quotation created");
      void navigate({ to: "/quotations" });
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  };

  return (
    <AppShell title="AI Quotation from Image" description="Key-free local OCR → review → draft quotation. Handwriting may need correction.">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 panel overflow-hidden p-4">
          <Label htmlFor="img" className="flex h-48 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed text-muted-foreground">
            {preview ? <img src={preview} alt="Uploaded parts list" className="h-full w-full object-contain" /> : <><Upload className="size-6" />Upload image</>}
          </Label>
          <input id="img" type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
          <Button className="w-full" disabled={(!preview && !rawText.trim()) || busy} onClick={read}><Sparkles className="mr-1 size-4" />{busy ? `Reading… ${progress}%` : "Read items"}</Button>
          <p className="text-xs text-muted-foreground">No OpenAI or Gemini key. Images are read in your browser. OCR language files download on first use; handwritten figures are not guaranteed.</p>
          <Label>Extracted / pasted text — correct before parsing</Label><Textarea rows={8} value={rawText} onChange={e => { setRawText(e.target.value); setReviewed(false); }} /><Button variant="outline" onClick={async () => { const r = parseQuotationText(rawText); setVehicleNumber(r.vehicle_number); setVehicleType(r.vehicle_type); setLines(await Promise.all(r.items.map(async i => { const m = await bestMatch(i.name); return { read: i.name, hs_code: m?.hs_code ?? "", description: m?.description ?? i.name, description_source: m?.source ?? "custom", quantity: i.quantity, unit_price: i.unit_price }; }))); }}>Parse corrected text</Button>
        </div>
        <div className="space-y-4 lg:col-span-2">
          <div className="flex flex-wrap gap-3">
            <div className="min-w-56"><Label>Buyer / Department</Label>
              <Select value={dept} onValueChange={setDept}><SelectTrigger><SelectValue placeholder="Choose" /></SelectTrigger>
                <SelectContent>{(depts.data ?? []).map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="w-28"><Label>Tax %</Label><Input type="number" value={tax} onChange={(e) => setTax(Number(e.target.value))} /></div>
          </div>
          <div className="grid gap-3 md:grid-cols-2"><div><Label>Vehicle type *</Label><Input value={vehicleType} onChange={e => setVehicleType(e.target.value)} /></div><div><Label>Vehicle number *</Label><Input value={vehicleNumber} onChange={e => setVehicleNumber(e.target.value)} /></div></div><p className="text-xs text-muted-foreground">At least one vehicle field is required.</p>
          <div className="panel overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Read from image</TableHead><TableHead className="min-w-64">HS code / description</TableHead><TableHead className="w-24">Units</TableHead><TableHead className="w-32">Unit price</TableHead><TableHead>Sales Tax %</TableHead><TableHead>Sales Tax Value</TableHead><TableHead /></TableRow></TableHeader>
              <TableBody>
                {lines.map((l, i) => (
                  <TableRow key={i}>
                    <TableCell><Input value={l.description} onChange={e => upd(i, { description: e.target.value })} /></TableCell>
                    <TableCell>
                      <HsCodePicker value={l.hs_code} onPick={(p) => upd(i, { hs_code: p.hs_code, description: p.description, description_source: p.source })} />
                      <p className="mt-1 text-xs text-muted-foreground">{l.hs_code ? `${l.description} (${l.description_source.toUpperCase()})` : "No match — search to pick"}</p>
                    </TableCell>
                    <TableCell><Input type="number" value={l.quantity} onChange={(e) => upd(i, { quantity: Number(e.target.value) })} /></TableCell>
                    <TableCell><Input type="number" value={l.unit_price} onChange={(e) => upd(i, { unit_price: Number(e.target.value) })} /></TableCell>
                    <TableCell><Button size="icon" variant="ghost" onClick={() => setLines(lines.filter((_, j) => j !== i))}><Trash2 className="size-4" /></Button></TableCell>
                  </TableRow>
                ))}
                {!lines.length && <TableRow><TableCell colSpan={7} className="py-10 text-center text-muted-foreground">Upload an image and click "Read items"</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={reviewed} onChange={e => setReviewed(e.target.checked)} />I reviewed vehicle details, descriptions, HS codes, units and prices.</label>
          <Button variant="outline" onClick={() => setLines([...lines, { read: "", hs_code: "", description: "", description_source: "custom", quantity: 1, unit_price: 0 }])}>Add item manually</Button>
          <Button disabled={busy || !lines.length || !reviewed} onClick={save}>Create draft quotation</Button>
        </div>
      </div>
    </AppShell>
  );
}
