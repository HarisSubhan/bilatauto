import { SandboxTest } from "@/components/data/SandboxTest";
import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Eye, Lightbulb, Pencil, Plug, RefreshCw, Send, ShieldCheck, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { api, db as supabase } from "@/lib/db";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableState } from "@/components/data/kit";
import { cn } from "@/lib/utils";
import { validTaxId, decodeFbrJson } from "@/lib/tax-id";
import { uniqueInvoiceRows } from "@/lib/document-calculations";

export const Route = createFileRoute("/_authenticated/fbr")({
  validateSearch: z.object({ tab: z.enum(["invoices", "history", "settings", "sandbox"]).optional() }),
  head: () => ({
    meta: [
      { title: "FBR Digital Invoicing — Bilal Autos" },
      { name: "description", content: "Validate and submit sales tax invoices to FBR IRIS in Sandbox or Production." },
      { property: "og:title", content: "FBR Digital Invoicing — Bilal Autos" },
      { property: "og:description", content: "Validate and submit sales tax invoices to FBR IRIS in Sandbox or Production." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FbrPage,
});

type Env = "sandbox" | "production";
type Issue = { where: string; field?: string; problem: string; fix: string; code?: string | null; fbr_message?: string | null; fbr_guidance?: string | null; warning?: boolean; manual?: boolean; auto?: AutoFix; suggestions?: Suggestion[]; no_suggestion?: string };
type AutoFix = { type: "scenario"; value: string } | { type: "uom"; line: number; value: string } | { type: "item"; line: number; patch: Record<string, string> };
type Suggestion = { line: number; label: string; field: string; current: string; value: string; reason: string; patch: Record<string, string> };
type Result = { id: string; invoice_number: string; outcome: string; fbr_invoice_number?: string | null; errors: Issue[]; automatic_sandbox?: { outcome: string; message: string; fbr_invoice_number?: string | null } };
type EnvCfg = { environment: Env; connected: number; post_url: string; validate_url: string; token_last4: string | null; has_token: boolean; last_test_at: string | null; last_test_ok: number | null; last_test_message: string | null };
type Config = { environments: EnvCfg[]; settings: Record<string, string>; scenarios: Record<string, [string, string]>; provinces: string[]; uom: string[]; can: Record<string, boolean> };
type Row = { id: string; invoice_number: string; sales_tax_number: string; invoice_date: string; grand_total: number; tax_total: number; department_name: string; buyer_ntn: string | null; buyer_province: string | null; fbr_status: string; fbr_invoice_number: string | null; scenario_id: string | null; last_errors: Issue[] | null };

const STATUS: Record<string, { label: string; tone: string }> = {
  not_validated: { label: "Not validated", tone: "bg-muted text-muted-foreground" },
  validation_failed: { label: "Validation failed", tone: "bg-destructive/15 text-destructive" },
  validated: { label: "Ready to send", tone: "bg-primary/15 text-primary" },
  submitting: { label: "Sending…", tone: "bg-accent text-accent-foreground" },
  sent: { label: "Sent to FBR", tone: "bg-success/15 text-success" },
  submission_failed: { label: "Send failed", tone: "bg-destructive/15 text-destructive" },
  pending_confirmation: { label: "Awaiting confirmation", tone: "bg-warning/20 text-warning-foreground" },
};
const FILTERS: Array<[string, string]> = [["remaining", "Remaining / Not sent"], ["not_validated", "Not validated"], ["validation_failed", "Validation failed"], ["validated", "Ready to send"], ["sent", "Sent to FBR"], ["failed", "Failed / Awaiting confirmation"], ["all", "All"]];
const money = (n: number) => Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const OUTCOME: Record<string, string> = { valid: "Valid", invalid: "Rejected by FBR", precheck_failed: "Needs correction", already_sent: "Already sent", sent: "Sent", submission_failed: "Not sent", pending_confirmation: "Awaiting confirmation", unauthorized: "Token rejected", unreachable: "FBR not reachable", no_token: "No token", not_validated: "Validate first", changed: "Changed — validate again", needs_confirmation: "Needs confirmation", server_error: "FBR server error", unknown: "Unexpected reply" };

function FbrPage() {
  const { tab } = Route.useSearch();
  const navigate = useNavigate();
  const cfg = useQuery({ queryKey: ["fbr-config"], queryFn: () => api("/fbr/config") as Promise<Config> });
  const [env, setEnv] = useState<Env>("sandbox");
  useEffect(() => { if (cfg.data) setEnv((cfg.data.settings["fbr_active_environment"] as Env) || "sandbox"); }, [cfg.data]);
  return (
    <AppShell title="FBR Digital Invoicing" description="Validate, then submit Sales Tax Invoices to FBR IRIS"
      actions={
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Environment</span>
          <Select value={env} onValueChange={(v) => setEnv(v as Env)}>
            <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="sandbox">Sandbox (test)</SelectItem><SelectItem value="production">Production</SelectItem></SelectContent>
          </Select>
        </div>}>
      <div className={cn("mb-4 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm", env === "production" ? "border-destructive/40 bg-destructive/10 text-destructive" : "border-primary/30 bg-primary/10 text-primary")}>
        {env === "production" ? <AlertTriangle className="size-4" /> : <ShieldCheck className="size-4" />}
        {env === "production" ? "PRODUCTION — invoices sent here are real and final." : "SANDBOX — test mode. Nothing here is a real FBR submission."}
      </div>
      <Tabs value={tab ?? "invoices"} onValueChange={(t) => void navigate({ to: "/fbr", search: { tab: t as "invoices" } })}>
        <TabsList><TabsTrigger value="invoices">Invoices</TabsTrigger><TabsTrigger value="history">History</TabsTrigger><TabsTrigger value="settings">Settings</TabsTrigger><TabsTrigger value="sandbox">Sandbox test</TabsTrigger></TabsList>
        <TabsContent value="invoices">{cfg.data && <InvoicesTab env={env} cfg={cfg.data} />}</TabsContent>
        <TabsContent value="sandbox">{cfg.data && <SandboxTest scenarios={cfg.data.scenarios} settings={cfg.data.settings} canValidate={!!cfg.data.can["validate"]} />}</TabsContent>
        <TabsContent value="history"><HistoryTab env={env} /></TabsContent>
        <TabsContent value="settings">{cfg.data ? <SettingsTab cfg={cfg.data} /> : <p className="p-4 text-sm text-muted-foreground">{cfg.error ? (cfg.error as Error).message : "Loading…"}</p>}</TabsContent>
      </Tabs>
    </AppShell>
  );
}

function InvoicesTab({ env, cfg }: { env: Env; cfg: Config }) {
  const qc = useQueryClient();
  const [dept, setDept] = useState("");
  const [from, setFrom] = useState(""); const [to, setTo] = useState("");
  const [status, setStatus] = useState("remaining"); const [search, setSearch] = useState("");
  const [scenario, setScenario] = useState(cfg.settings["fbr_default_scenario"] || "SN001");
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<Result[] | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const depts = useQuery({ queryKey: ["fbr-department-options"], queryFn: async () => (await api("/rest/departments", { op: "select", select: "id,name", include_deleted: true, order: [{ col: "name", asc: true }] })).data ?? [] });
  const params = new URLSearchParams({ env, department_id: dept, status, ...(from ? { from } : {}), ...(to ? { to } : {}), ...(search.trim() ? { search: search.trim() } : {}) });
  const list = useQuery({ queryKey: ["fbr-invoices", params.toString()], enabled: !!dept, queryFn: () => api(`/fbr/invoices?${params}`) as Promise<Row[]> });
  useEffect(() => setSel(new Set()), [env, dept, status, from, to]);
  const rows = uniqueInvoiceRows(list.data ?? []);
  const run = useMutation({
    mutationFn: async ({ action, retry, ids }: { action: "validate" | "submit"; retry?: boolean; ids?: string[] }) => {
      const input = { env, ids: ids ?? [...sel], scenario: env === "sandbox" ? scenario : undefined, confirm_retry: retry };
      if (action === "validate" || retry) return (await api(`/fbr/${action}`, input)).results as Result[];
      const checked = (await api("/fbr/validate", input)).results as Result[];
      const ready = checked.filter(r => r.outcome === "valid").map(r => r.id);
      const failures = checked.filter(r => r.outcome !== "valid");
      if (!ready.length) return failures;
      return [...failures, ...((await api("/fbr/submit", { ...input, ids: ready })).results as Result[])];
    },
    onSuccess: (r) => { setResults(r); void qc.invalidateQueries({ queryKey: ["fbr-invoices"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const fix = useMutation({
    mutationFn: async ({ id, f }: { id: string; f: AutoFix; revalidate?: boolean | undefined }) => api("/fbr/autofix", { env, id, fix: f }),
    onSuccess: (_d, v) => { void qc.invalidateQueries({ queryKey: ["fbr-invoices"] }); if (v.revalidate) run.mutate({ action: "validate", ids: [v.id] }); else toast.success("Change applied — validate again"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const connected = !!cfg.environments.find((e) => e.environment === env)?.connected;
  const selectable = rows.filter((r) => r.fbr_status !== "sent");
  const confirmSend = () => {
    const msg = env === "production" ? `Send ${sel.size} invoice(s) to FBR PRODUCTION? This is a real, final tax submission.` : `Send ${sel.size} invoice(s) to the FBR Sandbox?`;
    if (window.confirm(msg)) run.mutate({ action: "submit" });
  };
  return (
    <div className="space-y-4">
      <div className="panel grid gap-3 p-4 md:grid-cols-6">
        <div className="space-y-1.5 md:col-span-2"><Label>Department / Buyer *</Label>
          <Select value={dept} onValueChange={setDept}><SelectTrigger><SelectValue placeholder="Select a department" /></SelectTrigger>
            <SelectContent>{(depts.data ?? []).map((d: { id: string; name: string }) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-1.5"><Label>From</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
        <div className="space-y-1.5"><Label>To</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
        <div className="space-y-1.5"><Label>FBR status</Label>
          <Select value={status} onValueChange={setStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{FILTERS.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-1.5"><Label>Invoice no.</Label><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" /></div>
      </div>
      <div className="panel overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
          <span className="text-sm font-medium">{sel.size} selected</span>
          {env === "sandbox" && (
            <Select value={scenario} onValueChange={setScenario}><SelectTrigger className="h-8 w-72"><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(cfg.scenarios).map(([k, [d]]) => <SelectItem key={k} value={k}>{k} — {d}</SelectItem>)}</SelectContent></Select>)}
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => void list.refetch()} disabled={!dept}><RefreshCw className="size-4" />Refresh</Button>
            {cfg.can["validate"] && <Button size="sm" variant="outline" disabled={!connected || !sel.size || run.isPending} onClick={() => run.mutate({ action: "validate" })}><CheckCircle2 className="size-4" />Validate selected</Button>}
            {cfg.can["submit"] && <Button size="sm" variant={env === "production" ? "destructive" : "default"} disabled={!connected || !sel.size || run.isPending} onClick={confirmSend}><Send className="size-4" />Send to FBR</Button>}
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead className="w-8"><Checkbox aria-label="Select all" checked={selectable.length > 0 && selectable.every((r) => sel.has(r.id))} onCheckedChange={(v) => setSel(v ? new Set(selectable.map((r) => r.id)) : new Set())} /></TableHead>
              <TableHead>Sales tax no.</TableHead><TableHead>Invoice</TableHead><TableHead>Buyer NTN / province</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Sales tax</TableHead><TableHead className="text-right">Total</TableHead><TableHead>FBR status</TableHead><TableHead>FBR invoice no.</TableHead><TableHead />
            </TableRow></TableHeader>
            <TableBody>
              {!dept ? <TableRow><TableCell colSpan={10} className="py-10 text-center text-sm text-muted-foreground">Select a department to see its invoices.</TableCell></TableRow> :
                <TableState cols={10} loading={list.isLoading} error={list.error ? (list.error as Error).message : null} empty={!list.isLoading && rows.length === 0} title="No invoices match" hint="Change the date range or status filter." />}
              {rows.map((r) => {
                const st = STATUS[r.fbr_status] ?? { label: "Not validated", tone: "bg-muted text-muted-foreground" };
                return (
                  <TableRow key={r.id} className={cn(sel.has(r.id) && "bg-accent/40")}>
                    <TableCell><Checkbox aria-label={`Select ${r.invoice_number}`} disabled={r.fbr_status === "sent"} checked={sel.has(r.id)} onCheckedChange={(v) => setSel((s) => { const n = new Set(s); if (v) n.add(r.id); else n.delete(r.id); return n; })} /></TableCell>
                    <TableCell className="font-mono">{r.sales_tax_number}</TableCell><TableCell className="font-mono">{r.invoice_number}</TableCell><TableCell><div>{r.buyer_ntn || "Missing NTN / CNIC"}</div><div className="text-xs text-muted-foreground">{r.buyer_province || "Province missing"}</div></TableCell><TableCell className="whitespace-nowrap">{r.invoice_date}</TableCell>
                    <TableCell className="text-right tabular-nums">{money(r.tax_total)}</TableCell><TableCell className="text-right tabular-nums">{money(r.grand_total)}</TableCell>
                    <TableCell className="whitespace-nowrap"><span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", st.tone)}>{st.label}</span>{r.last_errors?.length ? <span className="ml-1 text-xs text-muted-foreground">({r.last_errors.length})</span> : null}</TableCell>
                    <TableCell className="font-mono text-xs">{r.fbr_invoice_number ?? "—"}</TableCell>
                    <TableCell><Button size="icon" variant="ghost" aria-label="Check invoice" onClick={() => setPreview(r.id)}><Eye className="size-4" /></Button></TableCell>
                  </TableRow>);
              })}
            </TableBody>
          </Table>
        </div>
      </div>
      {results && <ResultsDialog results={results} onClose={() => setResults(null)} onFix={(id, f, revalidate) => fix.mutate({ id, f, revalidate })} onRevalidate={(id) => run.mutate({ action: "validate", ids: [id] })} busy={run.isPending || fix.isPending} onRetry={() => { if (window.confirm("Only retry if FBR's portal shows NO record of these invoices, otherwise they may be duplicated. Retry now?")) run.mutate({ action: "submit", retry: true }); }} />}
      {preview && <PreviewDialog id={preview} env={env} scenario={scenario} onClose={() => setPreview(null)} />}
    </div>
  );
}

function IssueList({ issues, onFix }: { issues: Issue[]; onFix?: (f: AutoFix, revalidate?: boolean) => void }) {
  return (
    <ul className="space-y-2">
      {issues.map((e, i) => (
        <li key={i} className={cn("rounded-lg border p-3 text-sm", e.warning ? "border-warning/40 bg-warning/10" : "border-destructive/30 bg-destructive/5")}>
          <div className="flex flex-wrap items-center gap-2"><span className="font-medium">{e.problem}</span>{e.code && <Badge variant="outline">FBR {e.code}</Badge>}{e.warning && <Badge variant="outline">Note</Badge>}</div>
          <div className="mt-1 text-xs text-muted-foreground">Where: {e.where}{e.field ? ` → ${e.field}` : ""}</div>
          {e.fix && <div className="mt-1 text-xs"><span className="font-medium">How to fix:</span> {e.fix}</div>}
          {e.fbr_guidance && <div className="mt-1 text-xs text-muted-foreground">FBR guidance: {e.fbr_guidance}</div>}
          {e.auto && onFix && <Button size="sm" variant="outline" className="mt-2" onClick={() => e.auto && onFix(e.auto)}><Wand2 className="size-3.5" />Fix automatically</Button>}
          {e.manual && <div className="mt-1 text-xs font-medium text-destructive">Manual action required</div>}
          {!!e.suggestions?.length && (
            <div className="mt-2 space-y-2 rounded-md border border-primary/30 bg-primary/5 p-2">
              <div className="flex items-center gap-1 text-xs font-semibold text-primary"><Lightbulb className="size-3.5" />System suggestion</div>
              {e.suggestions.map((sg, k) => (
                <div key={k} className="text-xs">
                  <div><span className="font-medium">{sg.label}</span> → {sg.field}: <span className="line-through text-muted-foreground">{sg.current || "empty"}</span> → <span className="font-medium">{sg.value}</span></div>
                  <div className="text-muted-foreground">{sg.reason}{Object.keys(sg.patch).filter((x) => x !== "type_of_goods").length ? ` Also sets: ${Object.entries(sg.patch).filter(([x]) => x !== "type_of_goods").map(([x, v]) => `${x.replace(/_/g, " ")} = ${v || "empty"}`).join(", ")}.` : ""}</div>
                  {onFix && <div className="mt-1 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => onFix({ type: "item", line: sg.line, patch: sg.patch })}><Wand2 className="size-3.5" />Apply</Button>
                    <Button size="sm" onClick={() => onFix({ type: "item", line: sg.line, patch: sg.patch }, true)}><Wand2 className="size-3.5" />Apply &amp; validate again</Button>
                  </div>}
                </div>))}
            </div>)}
          {e.no_suggestion && <div className="mt-2 text-xs text-muted-foreground">{e.no_suggestion}</div>}
        </li>))}
    </ul>
  );
}

function ResultsDialog({ results, onClose, onFix, onRetry, onRevalidate, busy }: { results: Result[]; onClose: () => void; onFix: (id: string, f: AutoFix, revalidate?: boolean) => void; onRetry: () => void; onRevalidate: (id: string) => void; busy: boolean }) {
  const good = results.filter((r) => ["valid", "sent"].includes(r.outcome)).length;
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-auto">
        <DialogHeader><DialogTitle>Results</DialogTitle><DialogDescription>{good} of {results.length} succeeded.</DialogDescription></DialogHeader>
        <div className="space-y-4">
          {results.map((r) => (
            <div key={r.id} className="rounded-xl border border-border p-3">
              <div className="mb-2 flex items-center justify-between"><span className="font-mono font-medium">{r.invoice_number}</span>
                <Badge variant={["valid", "sent"].includes(r.outcome) ? "default" : "outline"}>{OUTCOME[r.outcome] ?? r.outcome}</Badge></div>
              {r.fbr_invoice_number && <p className="mb-2 text-sm">FBR invoice no: <span className="font-mono">{r.fbr_invoice_number}</span></p>}
              {r.automatic_sandbox && <p className="mb-2 text-sm text-muted-foreground">Sandbox: {r.automatic_sandbox.message}{r.automatic_sandbox.fbr_invoice_number ? ` (${r.automatic_sandbox.fbr_invoice_number})` : ""}</p>}
              {r.errors.length ? <IssueList issues={r.errors} onFix={(f, rv) => onFix(r.id, f, rv)} /> : <p className="text-sm text-muted-foreground">No problems found.</p>}
              {!["valid", "sent", "already_sent", "needs_confirmation", "pending_confirmation"].includes(r.outcome) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" asChild><Link to="/invoices" search={{ edit: r.id }}><Pencil className="size-3.5" />Edit invoice</Link></Button>
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => onRevalidate(r.id)}><RefreshCw className="size-3.5" />Validate again</Button>
                </div>)}
            </div>))}
          {results.some((r) => r.outcome === "needs_confirmation") && <Button variant="outline" onClick={onRetry}>Retry unconfirmed invoices</Button>}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PreviewDialog({ id, env, scenario, onClose }: { id: string; env: Env; scenario: string; onClose: () => void }) {
  const q = useQuery({ queryKey: ["fbr-preview", id, env, scenario], queryFn: () => api(`/fbr/preview/${id}?env=${env}&scenario=${scenario}`) as Promise<{ payload: unknown; issues: Issue[] }> });
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-auto">
        <DialogHeader><DialogTitle>Local check before FBR</DialogTitle><DialogDescription>What will be sent, and any problems found locally.</DialogDescription></DialogHeader>
        {q.isLoading ? <p className="text-sm">Checking…</p> : q.error ? <p className="text-sm text-destructive">{(q.error as Error).message}</p> : (<>
          {q.data?.issues.length ? <IssueList issues={q.data?.issues ?? []} /> : <p className="text-sm text-success">No local problems found.</p>}
          <pre className="mt-3 max-h-80 overflow-auto rounded-lg bg-muted p-3 text-xs">{JSON.stringify(q.data?.payload, null, 2)}</pre>
        </>)}
      </DialogContent>
    </Dialog>
  );
}

type Hist = { id: string; invoice_number: string | null; action: string; outcome: string; http_status: number | null; fbr_invoice_number: string | null; error_message: string | null; user_name: string | null; created_at: string; request_json: unknown; response_json: unknown };
function HistoryTab({ env }: { env: Env }) {
  const q = useQuery({ queryKey: ["fbr-history", env], queryFn: () => api(`/fbr/history?env=${env}`) as Promise<Hist[]> });
  const [open, setOpen] = useState<Hist | null>(null);
  const rows = q.data ?? [];
  return (
    <div className="panel overflow-x-auto">
      <Table>
        <TableHeader><TableRow><TableHead>When</TableHead><TableHead>Action</TableHead><TableHead>Invoice</TableHead><TableHead>Result</TableHead><TableHead>FBR no.</TableHead><TableHead>By</TableHead><TableHead>Details</TableHead></TableRow></TableHeader>
        <TableBody>
          <TableState cols={7} loading={q.isLoading} error={q.error ? (q.error as Error).message : null} empty={!q.isLoading && rows.length === 0} title="No FBR activity yet" hint="Tests, validations and submissions appear here." />
          {rows.map((h) => (
            <TableRow key={h.id}><TableCell className="whitespace-nowrap text-xs">{h.created_at}</TableCell><TableCell className="capitalize">{h.action}</TableCell><TableCell className="font-mono">{h.invoice_number ?? "—"}</TableCell>
              <TableCell>{OUTCOME[h.outcome] ?? h.outcome}{h.http_status ? <span className="ml-1 text-xs text-muted-foreground">HTTP {h.http_status}</span> : null}</TableCell>
              <TableCell className="font-mono text-xs">{h.fbr_invoice_number ?? "—"}</TableCell><TableCell className="text-xs">{h.user_name}</TableCell>
              <TableCell><Button size="sm" variant="ghost" onClick={() => setOpen(h)}>View</Button></TableCell></TableRow>))}
        </TableBody>
      </Table>
      {open && (
        <Dialog open onOpenChange={(o) => !o && setOpen(null)}>
          <DialogContent className="max-h-[90vh] max-w-3xl overflow-auto">
            <DialogHeader><DialogTitle>{open.action} — {open.invoice_number ?? env}</DialogTitle><DialogDescription>{open.error_message ?? "No error"}</DialogDescription></DialogHeader>
            <Label>Sent to FBR</Label><pre className="max-h-60 overflow-auto rounded-lg bg-muted p-3 text-xs">{JSON.stringify(decodeFbrJson(open.request_json), null, 2)}</pre>
            <Label>FBR reply</Label><pre className="max-h-60 overflow-auto rounded-lg bg-muted p-3 text-xs">{JSON.stringify(decodeFbrJson(open.response_json), null, 2)}</pre>
          </DialogContent>
        </Dialog>)}
    </div>
  );
}

function SettingsTab({ cfg }: { cfg: Config }) {
  const qc = useQueryClient();
  const refresh = () => void qc.invalidateQueries({ queryKey: ["fbr-config"] });
  const [s, setS] = useState({ fbr_seller_name: cfg.settings["fbr_seller_name"] || cfg.settings["company_name"] || "", fbr_seller_address: cfg.settings["fbr_seller_address"] || cfg.settings["company_address"] || "", fbr_seller_cnic: cfg.settings["fbr_seller_cnic"] || "", fbr_seller_ntn: cfg.settings["fbr_seller_ntn"] ?? "", fbr_seller_province: cfg.settings["fbr_seller_province"] ?? "", fbr_default_scenario: cfg.settings["fbr_default_scenario"] || "SN001" });
  const canEdit = !!cfg.can["configure"];
  const provinces = cfg.provinces.length ? cfg.provinces : ["PUNJAB", "SINDH", "KHYBER PAKHTUNKHWA", "BALOCHISTAN", "CAPITAL TERRITORY", "GILGIT BALTISTAN", "AZAD JAMMU AND KASHMIR"];
  const saveSeller = useMutation({ mutationFn: () => {
    if (!s.fbr_seller_name.trim() || !s.fbr_seller_address.trim() || !s.fbr_seller_province) throw new Error("Enter seller name, address and province.");
    if (s.fbr_seller_ntn ? !validTaxId(s.fbr_seller_ntn) : !/^\d{13}$/.test(s.fbr_seller_cnic)) throw new Error("Enter a valid seller NTN or 13-digit CNIC.");
    return api("/fbr/settings", s, "PUT");
  }, onSuccess: () => { toast.success("Saved"); refresh(); }, onError: (e: Error) => toast.error(e.message) });
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {cfg.environments.sort((a, b) => a.environment.localeCompare(b.environment)).reverse().map((e) => <EnvCard key={e.environment} e={e} canEdit={canEdit} onSaved={refresh} />)}
      <Card>
        <CardHeader><CardTitle>Seller details sent to FBR</CardTitle><CardDescription>Seller is your company. Buyer NTN / CNIC, province and registration are automatically picked from the department on each invoice.</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          {([['fbr_seller_name','Seller name'],['fbr_seller_cnic','Seller CNIC (13 digits)'],['fbr_seller_address','Seller address']] as const).map(([key,label]) => <div key={key}><Label htmlFor={key}>{label}</Label><Input id={key} disabled={!canEdit} value={s[key]} onChange={e => setS({...s,[key]:e.target.value})}/></div>)}
          <div><Label htmlFor="fbr_seller_ntn">Seller NTN</Label><Input id="fbr_seller_ntn" maxLength={20} disabled={!canEdit} value={s.fbr_seller_ntn} onChange={(e) => setS({ ...s, fbr_seller_ntn: e.target.value })} /></div>
          <div><Label>Seller province</Label>
            <Select disabled={!canEdit} value={s.fbr_seller_province} onValueChange={(v) => setS({ ...s, fbr_seller_province: v })}><SelectTrigger><SelectValue placeholder="Select province" /></SelectTrigger><SelectContent>{provinces.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
          <div><Label>Default Sandbox scenario</Label>
            <Select disabled={!canEdit} value={s.fbr_default_scenario} onValueChange={(v) => setS({ ...s, fbr_default_scenario: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(cfg.scenarios).map(([k, [d]]) => <SelectItem key={k} value={k}>{k} — {d}</SelectItem>)}</SelectContent></Select></div>
          {canEdit && <Button onClick={() => saveSeller.mutate()} disabled={saveSeller.isPending}>Save seller details</Button>}
        </CardContent>
      </Card>
    </div>
  );
}

function EnvCard({ e, canEdit, onSaved }: { e: EnvCfg; canEdit: boolean; onSaved: () => void }) {
  const [post, setPost] = useState(e.post_url); const [val, setVal] = useState(e.validate_url); const [token, setToken] = useState("");
  const save = useMutation({ mutationFn: (clear?: boolean) => api(`/fbr/config/${e.environment}`, { post_url: post, validate_url: val, ...(token ? { token } : {}), ...(clear ? { clear_token: true } : {}) }, "PUT"),
    onSuccess: () => { setToken(""); toast.success("Saved"); onSaved(); }, onError: (x: Error) => toast.error(x.message) });
  const test = useMutation({ mutationFn: () => api(`/fbr/test/${e.environment}`, {}) as Promise<{ ok: boolean; message: string }>,
    onSuccess: (r) => { if (r.ok) toast.success(r.message); else toast.error(r.message); onSaved(); }, onError: (x: Error) => toast.error(x.message) });
  const disconnect = useMutation({ mutationFn: () => api(`/fbr/disconnect/${e.environment}`, {}), onSuccess: () => { toast.success("Disconnected — saved credentials and history retained"); onSaved(); }, onError: (x: Error) => toast.error(x.message) });
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2 capitalize">{e.environment}
        {e.connected ? <Badge>Connected</Badge> : e.last_test_ok === 0 ? <Badge variant="destructive">Failed</Badge> : <Badge variant="outline">Disconnected</Badge>}</CardTitle>
        <CardDescription>{e.last_test_message ?? "Enter the API links and token PRAL issued for this environment."}{e.last_test_at ? ` · ${e.last_test_at}` : ""}</CardDescription></CardHeader>
      <CardContent className="space-y-3">
        <div><Label>Post invoice URL</Label><Input disabled={!canEdit} value={post} onChange={(x) => setPost(x.target.value)} /></div>
        <div><Label>Validate invoice URL</Label><Input disabled={!canEdit} value={val} onChange={(x) => setVal(x.target.value)} /></div>
        <div><Label>Security token {e.has_token && <span className="text-xs text-muted-foreground">(saved securely)</span>}</Label>
          <Input disabled={!canEdit} type="password" autoComplete="off" value={token} onChange={(x) => setToken(x.target.value)} placeholder={e.has_token ? "Leave empty to keep the saved token" : "Paste token"} /></div>
        {canEdit && <div className="flex flex-wrap gap-2">
          <Button onClick={() => save.mutate(false)} disabled={save.isPending}>Save</Button>
          <Button variant="outline" onClick={() => test.mutate()} disabled={test.isPending || !e.has_token}><Plug className="size-4" />{test.isPending ? "Testing…" : "Connect / test"}</Button>
          <Button variant="outline" disabled={!e.connected || disconnect.isPending} onClick={() => { if (window.confirm(`Disconnect ${e.environment}? No further API calls will be made; saved credentials and history remain.`)) disconnect.mutate(); }}>Disconnect {e.environment}</Button>
          {e.has_token && <Button variant="ghost" onClick={() => { if (window.confirm("Remove the saved token?")) save.mutate(true); }}>Remove token</Button>}
        </div>}
      </CardContent>
    </Card>
  );
}
