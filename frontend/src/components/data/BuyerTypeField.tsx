import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/** Buyer Type dropdown populated from the Buyer Type master. */
export function BuyerTypeField({ value, onChange, problem }: { value: string; onChange: (v: string) => void; problem?: string | null }) {
  const opts = useQuery({ queryKey: ["buyer_types", "active"], queryFn: async () => { const { data, error } = await db.from("buyer_types").select("id,name").eq("status", "active").order("serial_number"); if (error) throw new Error(error.message); return data ?? []; } });
  return (
    <div className="space-y-1.5">
      <Label>Buyer type *</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger aria-label="Buyer type"><SelectValue placeholder="Registered / Unregistered" /></SelectTrigger>
        <SelectContent>{(opts.data ?? []).map((o: any) => <SelectItem key={o.id} value={o.name}>{o.name}</SelectItem>)}</SelectContent>
      </Select>
      {problem ? <p className="text-xs text-destructive">{problem}</p> : null}
    </div>
  );
}
