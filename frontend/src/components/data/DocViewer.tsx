import { useEffect, useRef, useState } from "react";
import { FileDown, Printer } from "lucide-react";
import { toast } from "sonner";
import { A4_CSS, buildDocHtml, downloadPdf, printDocs, type DocKind } from "@/lib/print";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/** A4 on-screen preview of a quotation / bill / sales tax invoice, with Print and Download PDF. */
export function DocViewer({ id, kind, onClose }: { id: string; kind: DocKind; onClose: () => void }) {
  const [html, setHtml] = useState<string | null>(null);
  const [num, setNum] = useState("");
  const [busy, setBusy] = useState(false);
  const [scale, setScale] = useState(1);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => { buildDocHtml(id, kind).then((r) => { setHtml(r.html); setNum(r.number); }).catch((e: Error) => toast.error(e.message)); }, [id, kind]);
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
              <Button size="sm" variant="outline" onClick={() => void printDocs([id], kind)}><Printer className="size-4" />Print</Button>
              <Button size="sm" disabled={busy || !html} onClick={async () => { setBusy(true); try { await downloadPdf([id], kind); } catch (e) { toast.error((e as Error).message); } setBusy(false); }}><FileDown className="size-4" />{busy ? "Preparing…" : "Download PDF"}</Button>
            </span>
          </DialogTitle>
        </DialogHeader>
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
