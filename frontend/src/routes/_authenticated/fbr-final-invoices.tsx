import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FileDown, Printer } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/db";
import { downloadPdf, printDocs } from "@/lib/print";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableState, Toolbar } from "@/components/data/kit";

export const Route = createFileRoute("/_authenticated/fbr-final-invoices")({
  head: () => ({ meta: [
    { title: "FBR Final Invoices — Bilal Autos" },
    { name: "description", content: "Download invoices accepted by FBR, printed with the FBR invoice number, QR code and Digital Invoicing logo." },
    { property: "og:title", content: "FBR Final Invoices — Bilal Autos" },
    { property: "og:description", content: "Download FBR-accepted invoices with FBR number, QR code and logo." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: FbrFinalInvoices,
});

type Row = { id: string; invoice_number: string; sales_tax_number: string; invoice_date: string; grand_total: number; buyer_type: string | null; department_name: string; fbr_invoice_number: string; submitted_at: string };
const money = (n: number) => Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function FbrFinalInvoices() {
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const params = new URLSearchParams(Object.entries({ search, from, to }).filter(([, v]) => v));
  const list = useQuery({ queryKey: ["fbr-final", params.toString()], queryFn: () => api(`/fbr/final-invoices?${params}`) as Promise<Row[]> });
  const rows = list.data ?? [];
  return (
    <AppShell title="FBR Final Invoices" description="Invoices accepted by FBR (Production) — with FBR invoice number, QR code and Digital Invoicing logo">
      <div className="panel overflow-hidden">
        <Toolbar search={search} onSearch={setSearch} placeholder="Search invoice, FBR number or buyer…">
          <Input type="date" aria-label="From date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
          <Input type="date" aria-label="To date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
          <Button size="sm" variant="outline" disabled={!rows.length} onClick={() => downloadPdf(rows.map((r) => r.id), "fbr").catch((e: Error) => toast.error(e.message))}><FileDown className="size-4" />Download all</Button>
        </Toolbar>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>FBR Invoice No.</TableHead><TableHead>Sales Tax Invoice</TableHead><TableHead>Date</TableHead><TableHead>Buyer</TableHead><TableHead>Buyer type</TableHead><TableHead className="text-right">Total</TableHead><TableHead>Accepted</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              <TableState cols={8} loading={list.isLoading} error={list.error ? (list.error as Error).message : null} empty={!list.isLoading && rows.length === 0} title="No FBR-accepted invoices yet" hint="Invoices appear here after FBR accepts them in Production (FBR Invoicing → Submit)." />
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.fbr_invoice_number}</TableCell>
                  <TableCell className="font-mono">{r.sales_tax_number}</TableCell>
                  <TableCell>{String(r.invoice_date).slice(0, 10)}</TableCell>
                  <TableCell>{r.department_name}</TableCell>
                  <TableCell>{r.buyer_type ?? "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{money(r.grand_total)}</TableCell>
                  <TableCell className="text-xs">{r.submitted_at ? new Date(r.submitted_at).toLocaleString() : "—"}</TableCell>
                  <TableCell className="whitespace-nowrap text-right">
                    <Button size="icon" variant="ghost" aria-label="Download FBR invoice PDF" onClick={() => downloadPdf([r.id], "fbr").catch((e: Error) => toast.error(e.message))}><FileDown className="size-4" /></Button>
                    <Button size="icon" variant="ghost" aria-label="Print FBR invoice" onClick={() => void printDocs([r.id], "fbr")}><Printer className="size-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppShell>
  );
}
