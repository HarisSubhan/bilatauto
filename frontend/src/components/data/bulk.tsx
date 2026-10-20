import { useState } from "react";
import { FileDown, ShieldCheck, ShieldOff, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { db as supabase } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { BulkBar } from "./kit";

export function useSelection() {
  const [sel, setSel] = useState<Set<string>>(new Set());
  const toggle = (id: string) => setSel((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const setAll = (ids: string[], on: boolean) => setSel(on ? new Set(ids) : new Set());
  return { sel, ids: [...sel], toggle, setAll, clear: () => setSel(new Set()) };
}

export function SelectAll({ ids, s }: { ids: string[]; s: ReturnType<typeof useSelection> }) {
  const all = ids.length > 0 && ids.every((i) => s.sel.has(i));
  return <Checkbox aria-label="Select all" checked={all} onCheckedChange={(v) => s.setAll(ids, !!v)} />;
}
export function SelectOne({ id, s }: { id: string; s: ReturnType<typeof useSelection> }) {
  return <Checkbox aria-label="Select row" checked={s.sel.has(id)} onCheckedChange={() => s.toggle(id)} onClick={(e) => e.stopPropagation()} />;
}

/** Bulk verify / unverify / delete. Verified records are never deleted (database rule). */
export function BulkActions({ table, s, onPdf, canDelete = true }: { table: string; s: ReturnType<typeof useSelection>; onPdf?: (ids: string[]) => Promise<void>; canDelete?: boolean }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<string>) => {
    setBusy(true);
    try { toast.success(await fn()); s.clear(); await qc.invalidateQueries(); }
    catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  };
  const verify = (v: "verified" | "unverified") => run(async () => {
    for (const id of s.ids) {
      const { error } = await supabase.from(table as never).update({ verification: v } as never).eq("id", id);
      if (error) throw error;
    }
    return `${s.ids.length} record(s) ${v}`;
  });
  const del = () => {
    if (!confirm(`Delete ${s.ids.length} selected record(s)? Verified records are skipped.`)) return;
    void run(async () => {
      const { data } = await supabase.from(table as never).select("id,verification").in("id", s.ids);
      const ok = ((data ?? []) as Array<{ id: string; verification: string }>).filter((r) => r.verification !== "verified").map((r) => r.id);
      if (ok.length) { const { error } = await supabase.from(table as never).delete().in("id", ok); if (error) throw error; }
      const skipped = s.ids.length - ok.length;
      return `${ok.length} deleted${skipped ? ` · ${skipped} verified record(s) kept` : ""}`;
    });
  };
  return (
    <BulkBar count={s.ids.length} onClear={s.clear}>
      {onPdf ? <Button size="sm" variant="outline" disabled={busy} onClick={() => run(async () => { await onPdf(s.ids); return "PDF downloaded"; })}><FileDown className="size-4" />Download PDF</Button> : null}
      <Button size="sm" variant="outline" disabled={busy} onClick={() => verify("verified")}><ShieldCheck className="size-4" />Verify</Button>
      <Button size="sm" variant="outline" disabled={busy} onClick={() => verify("unverified")}><ShieldOff className="size-4" />Unverify</Button>
      {canDelete ? <Button size="sm" variant="outline" className="text-destructive" disabled={busy} onClick={del}><Trash2 className="size-4" />Delete</Button> : null}
    </BulkBar>
  );
}
