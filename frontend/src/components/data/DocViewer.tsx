import { useEffect, useRef, useState } from "react";
import { FileDown, Printer } from "lucide-react";
import { toast } from "sonner";
import { A4_CSS, buildDocHtml, downloadPdf, printDocs, defaultDisplay, type InvoiceDisplay, type DocKind } from "@/lib/print";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/** A4 on-screen preview of a quotation / bill / sales tax invoice, with Print and Download PDF. */
export function DocViewer({ id, kind, display: initialDisplay, onClose }: { id: string; kind: DocKind; display?: InvoiceDisplay; onClose: () => void }) {
  const [display, setDisplay] = useState<InvoiceDisplay>(initialDisplay ?? defaultDisplay(kind));
  const [html, setHtml] = useState<string | null>(null);
  const [num, setNum] = useState("");
  const [busy, setBusy] = useState(false);
  const [scale, setScale] = useState(1);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => { let active = true; setHtml(null); buildDocHtml(id, kind, display).then((r) => { if (active) { setHtml(r.html); setNum(r.number); } }).catch((e: Error) => { if (active) toast.error(e.message); }); return () => { active = false; }; }, [id, kind, display]);
  useEffect(() => {
    const fit = () => box.current && setScale(Math.min(1, (box.current.clientWidth - 16) / 794));
    fit(); window.addEventListener("resize", fit); return () => window.removeEventListener("resize", fit);
  }, [html]);
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[94vh] max-w-[880px] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">{num || "Loading…"}
            <span className="ml-auto flex gap-2">
              <Button size="sm" variant="outline" disabled={!html} onClick={() => void printDocs([id], kind, display)}><Printer className="size-4" />Print</Button>
              <Button size="sm" disabled={busy || !html} onClick={async () => { setBusy(true); try { await downloadPdf([id], kind, display); } catch (e) { toast.error((e as Error).message); } setBusy(false); }}><FileDown className="size-4" />{busy ? "Preparing…" : "Download PDF"}</Button>
            </span>
          </DialogTitle>
        </DialogHeader>
        {kind !== "fbr" && kind !== "quotation" && <div className="flex gap-2" role="group" aria-label="Invoice display"><Button size="sm" variant={display === "hs" ? "default" : "outline"} aria-pressed={display === "hs"} onClick={() => setDisplay("hs")}>HS Code + FBR Description</Button><Button size="sm" variant={display === "part" ? "default" : "outline"} aria-pressed={display === "part"} onClick={() => setDisplay("part")}>Part Name</Button></div>}
        <div ref={box} className="overflow-hidden rounded-lg bg-muted p-2">
          {html ? (
            <div style={{ width: 794 * scale }} className="mx-auto shadow-lg">
              <div style={{ zoom: scale, width: 794 }}>
                <style>{A4_CSS}</style>
                <div dangerouslySetInnerHTML={{ __html: html }} />
              </div>
            </div>
          ) : <p className="p-10 text-center text-sm text-muted-foreground">Loading document…</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
