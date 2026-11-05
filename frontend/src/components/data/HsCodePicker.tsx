import { useEffect, useState } from "react";
import { db as supabase } from "@/lib/db";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export type HsPick = { hs_code: string; description: string; source: "fbr" | "custom"; type_of_goods?: string | null };

/**
 * Search HS codes by code ("hs") or description ("description").
 * Quotations/invoices use the Custom list; FBR descriptions are applied on the Sales Tax Invoice.
 */
export function HsCodePicker({ value, onPick, onType, mode = "hs", sources = ["custom", "fbr"], placeholder }: {
  value: string; onPick: (p: HsPick) => void; onType?: (v: string) => void;
  mode?: "hs" | "description"; sources?: Array<"fbr" | "custom">; placeholder?: string;
}) {
  const [q, setQ] = useState(value);
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<HsPick[]>([]);

  useEffect(() => setQ(value), [value]);

  useEffect(() => {
    if (!open || q.trim().length < 1) return setResults([]);
    let active = true;
    const t = setTimeout(async () => {
      const term = `%${q.trim().replace(/[%,()]/g, "")}%`;
      const col = mode === "hs" ? "hs_code" : "description";
      const res = await Promise.all(sources.map(async (s) => {
        const { data } = await supabase.from(s === "fbr" ? "fbr_hs_codes" : "custom_hs_codes").select(s === "custom" ? "hs_code,description,type_of_goods" : "hs_code,description").ilike(col, term).limit(12);
        return (data ?? []).map((r) => ({ ...r, source: s }));
      }));
      if (active) setResults(res.flat());
    }, 250);
    return () => { active = false; clearTimeout(t); };
  }, [q, open, mode, sources.join()]);

  return (
    <div className="relative">
      <Input
        value={q}
        aria-label={mode === "hs" ? "HS code" : "HS description"}
        placeholder={placeholder ?? (mode === "hs" ? "Type HS code…" : "Type HS description…")}
        onChange={(e) => { setQ(e.target.value); setOpen(true); onType?.(e.target.value); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
      />
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 max-h-64 w-[min(28rem,90vw)] overflow-auto rounded-md border bg-popover shadow-lg">
          {results.map((r, i) => (
            <Button key={i} type="button" variant="ghost" className="flex h-auto w-full justify-start gap-2 rounded-none px-3 py-2 text-left text-sm font-normal"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onPick(r); setQ(mode === "hs" ? r.hs_code : r.description); setOpen(false); }}>
              {sources.length > 1 && <span className={`shrink-0 rounded px-1.5 text-xs font-semibold uppercase ${r.source === "fbr" ? "bg-primary/15 text-primary" : "bg-secondary text-secondary-foreground"}`}>{r.source}</span>}
              <span className="font-mono">{r.hs_code}</span>
              <span className="min-w-0 whitespace-normal break-words text-muted-foreground">{r.description}</span>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
