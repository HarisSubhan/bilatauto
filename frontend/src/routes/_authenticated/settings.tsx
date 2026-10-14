import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { db as supabase } from "@/lib/db";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { ImagePlus, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

/** Resize an uploaded image to a small PNG data URL so it can live in settings. */
async function toDataUrl(file: File, max: number): Promise<string> {
  const url = URL.createObjectURL(file);
  const img = new Image();
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  URL.revokeObjectURL(url);
  return c.toDataURL("image/png");
}

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Spare Parts System" },
      { name: "description", content: "Company details, invoice footer, currency and FBR configuration." },
      { property: "og:title", content: "Settings — Spare Parts System" },
      { property: "og:description", content: "Company details, invoice footer, currency and FBR configuration." },
    ],
  }),
  component: SettingsPage,
});

const FIELDS: Array<{ key: string; label: string; long?: boolean }> = [
  { key: "system_name", label: "System name" },
  { key: "company_name", label: "Company name" },
  { key: "company_address", label: "Company address", long: true },
  { key: "company_phone", label: "Phone" },
  { key: "company_email", label: "Email" },
  { key: "company_website", label: "Website" },
  { key: "company_ntn", label: "NTN / Tax number" },
  { key: "currency", label: "Currency" },
  { key: "default_tax_percent", label: "Default tax %" },
  { key: "invoice_footer", label: "Invoice footer", long: true },
];

function SettingsPage() {
  const qc = useQueryClient();
  const { isSuperAdmin } = useAuth();
  const { theme, setTheme } = useTheme();
  const pick = async (key: "logo_url" | "favicon_url", file?: File) => {
    if (!file) return;
    if (file.size > 3_000_000) { toast.error("Please choose an image under 3 MB"); return; }
    const v = await toDataUrl(file, key === "logo_url" ? 256 : 64);
    setVals((s: any) => ({ ...s, [key]: v }));
    toast.message("Image ready — click Save settings to apply");
  };
  const [vals, setVals] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const q = useQuery({
    queryKey: ["settings"],
    queryFn: async () => (await supabase.from("system_settings").select("key, value")).data ?? [],
  });
  useEffect(() => {
    if (q.data) setVals(Object.fromEntries(q.data.map((r: any) => [r.key, r.value ?? ""])));
  }, [q.data]);

  const save = async () => {
    setSaving(true);
    const rows = [...FIELDS.map((f) => f.key), "logo_url", "favicon_url"].map((key) => ({ key, value: vals[key] ?? "" }));
    const { error } = await supabase.from("system_settings").upsert(rows, { onConflict: "key" });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Settings saved");
    void qc.invalidateQueries({ queryKey: ["settings"] });
    void qc.invalidateQueries({ queryKey: ["system-brand"] });
  };

  return (
    <AppShell title="Settings" description="System name, branding, company details and theme">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Company & invoice</CardTitle><CardDescription>{isSuperAdmin ? "Only the Super Admin can change these." : "View only — Super Admin access required to edit."}</CardDescription></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {FIELDS.map((f) => (
              <div key={f.key} className={f.long ? "sm:col-span-2" : ""}>
                <Label>{f.label}</Label>
                {f.long ? (
                  <Textarea disabled={!isSuperAdmin} value={vals[f.key] ?? ""} onChange={(e) => setVals({ ...vals, [f.key]: e.target.value })} />
                ) : (
                  <Input disabled={!isSuperAdmin} value={vals[f.key] ?? ""} onChange={(e) => setVals({ ...vals, [f.key]: e.target.value })} />
                )}
              </div>
            ))}
            {isSuperAdmin && <div className="sm:col-span-2"><Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save settings"}</Button></div>}
          </CardContent>
        </Card>
        <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Branding</CardTitle><CardDescription>System name above, logo and browser icon here. Shown across the portal.</CardDescription></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            {(["logo_url", "favicon_url"] as const).map((k) => (
              <label key={k} className={cn("flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-border p-4 text-center transition-colors hover:border-primary/50 hover:bg-accent/30", !isSuperAdmin && "pointer-events-none opacity-60")}>
                {vals[k] ? <img src={vals[k]} alt="" className="size-14 rounded-lg object-contain" /> : <span className="flex size-14 items-center justify-center rounded-lg bg-muted text-muted-foreground"><ImagePlus className="size-6" /></span>}
                <span className="text-xs font-medium">{k === "logo_url" ? "Logo" : "Favicon"}</span>
                <span className="text-[11px] text-muted-foreground">{vals[k] ? "Click to replace" : "Click to upload"}</span>
                <input type="file" accept="image/*" className="hidden" aria-label={k === "logo_url" ? "Upload logo" : "Upload favicon"} onChange={(e) => void pick(k, e.target.files?.[0])} />
              </label>
            ))}
            {isSuperAdmin && (vals["logo_url"] || vals["favicon_url"]) ? <Button variant="ghost" size="sm" className="col-span-2" onClick={() => setVals((s: any) => ({ ...s, logo_url: "", favicon_url: "" }))}>Remove images</Button> : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Theme</CardTitle><CardDescription>Your choice is remembered on this device.</CardDescription></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {(["light", "dark"] as const).map((t) => (
              <button key={t} onClick={() => setTheme(t)} className={cn("flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium capitalize transition-all", theme === t ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted")}>
                {t === "light" ? <Sun className="size-5" /> : <Moon className="size-5" />}{t} mode{t === "light" ? " (default)" : ""}
              </button>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">FBR Digital Invoicing <Badge variant="outline">Coming soon</Badge></CardTitle>
            <CardDescription>Invoices already store the fields needed for FBR submission, so this can be switched on later without rebuilding.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 opacity-60">
            <div><Label>Environment</Label><Input disabled placeholder="Sandbox / Production" /></div>
            <div><Label>POS ID</Label><Input disabled /></div>
            <div><Label>API token</Label><Input disabled type="password" /></div>
            <Button disabled className="w-full">Test connection</Button>
          </CardContent>
        </Card>
        </div>
      </div>
    </AppShell>
  );
}
