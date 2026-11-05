import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { db as supabase } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type DatePreset = "all" | "1m" | "3m" | "custom";
export type DocFilterState = { depts: string[]; preset: DatePreset; from: string; to: string };
export const emptyDocFilter: DocFilterState = { depts: [], preset: "all", from: "", to: "" };

/** Resolve the preset to an inclusive [from, to] date range (ISO dates) or nulls for All Time. */
export function dateRange(f: Pick<DocFilterState, "preset" | "from" | "to">, today = new Date()): { from: string | null; to: string | null } {
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  if (f.preset === "1m" || f.preset === "3m") {
    const d = new Date(today); d.setMonth(d.getMonth() - (f.preset === "1m" ? 1 : 3));
    return { from: iso(d), to: iso(today) };
  }
  if (f.preset === "custom") return { from: f.from || null, to: f.to || null };
  return { from: null, to: null };
}

/** Options list (id,name) for departments or suppliers. */
export function useOptions(table: "departments" | "suppliers") {
  return useQuery({ queryKey: [`${table}-filter-options`], queryFn: async () => (await supabase.from(table).select("id,name").order("name")).data ?? [] });
}

export function MultiPick({ label, options, value, onChange }: { label: string; options: Array<{ id: string; name: string }>; value: string[]; onChange: (v: string[]) => void }) {
  const text = value.length === 0 ? `All ${label}` : value.length === 1 ? options.find((o) => o.id === value[0])?.name ?? "1 selected" : `${value.length} ${label}`;
  return (
    <Popover>
      <PopoverTrigger asChild><Button variant="outline" size="sm" className="min-w-40 justify-between">{text}<ChevronDown className="size-4 opacity-60" /></Button></PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <label className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent"><Checkbox checked={value.length === 0} onCheckedChange={() => onChange([])} />All {label}</label>
        <div className="max-h-64 overflow-auto">
          {options.map((o) => (
            <label key={o.id} className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent">
              <Checkbox checked={value.includes(o.id)} onCheckedChange={(c) => onChange(c ? [...value, o.id] : value.filter((x) => x !== o.id))} />{o.name}
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function DateFilter({ value, onChange }: { value: Pick<DocFilterState, "preset" | "from" | "to">; onChange: (v: Pick<DocFilterState, "preset" | "from" | "to">) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={value.preset} onValueChange={(p) => onChange({ ...value, preset: p as DatePreset })}>
        <SelectTrigger className="h-8 w-40" aria-label="Date range"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Time</SelectItem><SelectItem value="1m">Last 1 Month</SelectItem>
          <SelectItem value="3m">Last 3 Months</SelectItem><SelectItem value="custom">Custom Date Range</SelectItem>
        </SelectContent>
      </Select>
      {value.preset === "custom" ? <>
        <Input type="date" aria-label="From date" className="h-8 w-36" value={value.from} onChange={(e) => onChange({ ...value, from: e.target.value })} />
        <Input type="date" aria-label="To date" className="h-8 w-36" value={value.to} onChange={(e) => onChange({ ...value, to: e.target.value })} />
      </> : null}
    </div>
  );
}

/** Department (multi) + date filters, shared by Quotations and Invoices. */
export function DocFilters({ value, onChange }: { value: DocFilterState; onChange: (v: DocFilterState) => void }) {
  const depts = useOptions("departments");
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2">
      <MultiPick label="departments" options={depts.data ?? []} value={value.depts} onChange={(d) => onChange({ ...value, depts: d })} />
      <DateFilter value={value} onChange={(v) => onChange({ ...value, ...v })} />
    </div>
  );
}
