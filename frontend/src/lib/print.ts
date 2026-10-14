import { db as supabase } from "@/lib/db";
import headerAsset from "@/assets/bilal-header.asset.json";
import footerAsset from "@/assets/bilal-footer.asset.json";

export type DocKind = "quotation" | "bill" | "sales";
const esc = (v: unknown) => String(v ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const money = (n: unknown) => Number(n ?? 0).toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** A4 = 794 × 1123 CSS px at 96 dpi. Styles are scoped to .a4doc so the page can be shown in-app, printed, or captured to PDF. */
export const A4_CSS = `
.a4doc{width:794px;min-height:1123px;box-sizing:border-box;padding:28px 34px 0;background:#fff;color:#111;font:11px Arial,sans-serif;display:flex;flex-direction:column;page-break-after:always;break-after:page}
.a4doc *{box-sizing:border-box}.a4doc img.lh{width:100%;display:block}.a4doc .meta{display:flex;justify-content:space-between;gap:15px;margin:12px 0;line-height:1.6}
.a4doc .r{text-align:right}.a4doc h2{margin:0;color:#cf541d;font-size:20px}.a4doc table{width:100%;border-collapse:collapse}
.a4doc th,.a4doc td{border:1px solid #ccc;padding:4px 5px;vertical-align:top}.a4doc th{background:#fff1e9;text-align:left;font-size:9.5px}
.a4doc tr{break-inside:avoid}.a4doc .tot{width:320px;margin:14px 0 10px auto}.a4doc .tot div{display:flex;justify-content:space-between;padding:3px 0}
.a4doc .grand{font-weight:bold;font-size:14px;border-top:2px solid #d85d24}.a4doc .offline{border:1px dashed #dd782d;padding:6px;background:#fff7ef;margin:6px 0}
.a4doc .warn{border:1px solid #d33;color:#a11;padding:6px;margin:6px 0}.a4doc .notes{white-space:pre-wrap;margin:8px 0}
.a4doc .sig{margin-top:26px;display:flex;justify-content:space-between}.a4doc .grow{flex:1}.a4doc img.ft{width:calc(100% + 68px);max-width:none;margin:16px -34px 0;display:block}`;

const abs = (u: string) => new URL(u, window.location.origin).href;

/** Builds the A4 document markup (one .a4doc element) for a quotation, bill or sales tax invoice. */
export async function buildDocHtml(id: string, kind: DocKind): Promise<{ html: string; number: string }> {
  const quotation = kind === "quotation";
  const { data: d, error } = quotation
    ? await supabase.from("quotations").select("*, departments(name,address,tax_number,phone), quotation_items(*)").eq("id", id).single()
    : await supabase.from("invoices").select("*, departments(name,address,tax_number,phone), quotations(quotation_number), invoice_items(*)").eq("id", id).single();
  if (error || !d) throw new Error("Document could not be loaded");
  const { data: settings } = await supabase.from("system_settings").select("key,value");
  const s = Object.fromEntries((settings ?? []).map(r => [r.key, r.value ?? ""]));
  const doc = d as unknown as Record<string, unknown>;
  const dept = doc["departments"] as { name: string; address?: string; tax_number?: string } | null;
  let items = (doc[quotation ? "quotation_items" : "invoice_items"] as Array<Record<string, unknown>>).slice().sort((a, b) => String(a["created_at"]).localeCompare(String(b["created_at"])));
  const unmapped: string[] = [];
  if (kind === "sales") {
    // Sales Tax Invoice: mapped official FBR code + official FBR description. Custom code/description stay untouched on the bill.
    const codes = [...new Set(items.map(it => String(it["fbr_hs_code"] ?? "")).filter(Boolean))];
    const { data: fbr } = codes.length ? await supabase.from("fbr_hs_codes").select("hs_code,description").in("hs_code", codes) : { data: [] };
    const map = new Map((fbr ?? []).map(r => [r.hs_code, r.description]));
    items = items.map(it => {
      const code = String(it["fbr_hs_code"] ?? "");
      const desc = map.get(code);
      if (!desc) unmapped.push(String(it["hs_code"]));
      return { ...it, hs_code: desc ? code : it["hs_code"], description: desc ?? it["description"] };
    });
  }
  const title = quotation ? "QUOTATION" : kind === "sales" ? "SALES TAX INVOICE" : "INVOICE / BILL";
  const number = String(doc[quotation ? "quotation_number" : kind === "sales" ? "sales_tax_number" : "invoice_number"] ?? "");
  const source = (doc["quotations"] as { quotation_number?: string } | null)?.quotation_number ?? (doc["source"] === "manual" ? "Manual invoice" : "");
  const rows = items.map((it, i) => `<tr><td>${i + 1}</td><td>${esc(it["hs_code"])}</td><td>${esc(it["description"])}${it["part_number"] ? `<br><small>Part: ${esc(it["part_number"])}</small>` : ""}</td><td class="r">${esc(it["quantity"])}</td><td class="r">${money(it["unit_price"])}</td><td class="r">${money(it["discount"])}</td><td class="r">${esc(Number(it["tax_percent"]))}%</td><td class="r">${money(it["sales_tax_value"])}</td><td class="r">${esc(Number(it["labor_percent"] ?? 0))}%</td><td class="r">${money(it["labor_amount"])}</td><td class="r">${money(it["line_total"])}</td></tr>`).join("");
  const html = `<div class="a4doc"><img class="lh" src="${esc(abs(headerAsset.url))}" alt="Bilal Autos letterhead" crossorigin="anonymous" />
<div class="meta"><div><b>${esc(dept?.name)}</b><br>${esc(dept?.address)}<br>Buyer NTN / STRN: ${esc(dept?.tax_number || "Not provided")}<br>Vehicle type: ${esc(doc["vehicle_type"] || "—")}<br>Vehicle number: ${esc(doc["vehicle_number"] || "—")}</div>
<div class="r"><h2>${title}</h2><b>${esc(number)}</b><br>Date: ${esc(doc[quotation ? "quotation_date" : "invoice_date"])}<br>${quotation ? `Valid until: ${esc(doc["valid_until"] || "—")}` : `Quotation: ${esc(source || "—")}`}<br>Seller NTN: ${esc(s["company_ntn"] || "7079463-0")}<br>Seller STRN: ${esc(s["company_strn"] || "327787623695")}</div></div>
${kind === "sales" ? '<p class="offline">MANUAL / OFFLINE — Not submitted to FBR. This document has no FBR-issued number, QR code or submission acknowledgment.</p>' : ""}
${unmapped.length ? `<p class="warn">FBR mapping missing for HS code(s): ${esc(unmapped.join(", "))}. Fix the FBR HS code in Custom HS Codes before submitting to FBR.</p>` : ""}
<table><thead><tr><th>#</th><th>HS Code</th><th>Particulars / Description</th><th>Units</th><th>Rate</th><th>Disc.</th><th>ST %</th><th>Sales Tax Value</th><th>Labor %</th><th>Labor</th><th>Net Amount</th></tr></thead><tbody>${rows}</tbody></table>
<div class="tot"><div><span>Subtotal</span><span>${money(doc["subtotal"])}</span></div><div><span>Discount</span><span>− ${money(doc["discount_total"])}</span></div><div><span>Sales Tax Value</span><span>${money(doc["tax_total"])}</span></div><div><span>Total Labor</span><span>${money(doc["labor_amount"])}</span></div><div class="grand"><span>Grand Total (${esc(s["currency"] || "PKR")})</span><span>${money(doc["grand_total"])}</span></div></div>
<p class="notes">${esc(doc["notes"])}</p><div class="grow"></div>
<div class="sig"><span>Customer signature: __________________</span><span>Authorized signature: __________________</span></div>
<img class="ft" src="${esc(abs(footerAsset.url))}" alt="Bilal Autos contact details" crossorigin="anonymous" /></div>`;
  return { html, number };
}

/** Opens the browser print dialog for one or more documents (each on its own A4 page). */
export async function printDocs(ids: string[], kind: DocKind) {
  const win = window.open("", "_blank"); if (!win) return;
  win.document.write("<p style='font:14px Arial'>Preparing…</p>");
  try {
    const docs = await Promise.all(ids.map(id => buildDocHtml(id, kind)));
    win.document.open();
    win.document.write(`<!doctype html><html><head><title>${esc(docs.length === 1 ? docs[0]!.number : `${docs.length} documents`)}</title><style>@page{size:A4;margin:0}body{margin:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}${A4_CSS}.a4doc{min-height:297mm;width:210mm}</style></head><body>${docs.map(d => d.html).join("")}<script>window.onload=()=>Promise.all(Array.from(document.images).map(i=>i.decode().catch(()=>{}))).then(()=>window.print())</script></body></html>`);
    win.document.close();
  } catch (e) { win.document.body.textContent = (e as Error).message; }
}
export const printInvoice = (id: string, salesTax = false) => printDocs([id], salesTax ? "sales" : "bill");
export const printQuotation = (id: string) => printDocs([id], "quotation");

/** Renders documents off-screen and saves them as one A4 PDF file (one or more pages per document). */
export async function downloadPdf(ids: string[], kind: DocKind) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas-pro"), import("jspdf")]);
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const host = document.createElement("div");
  host.style.cssText = "position:fixed;left:-10000px;top:0;";
  host.innerHTML = `<style>${A4_CSS}</style>`;
  document.body.appendChild(host);
  let first = true; let lastNumber = "";
  try {
    for (const id of ids) {
      const { html, number } = await buildDocHtml(id, kind);
      lastNumber = number;
      const wrap = document.createElement("div"); wrap.innerHTML = html; host.appendChild(wrap);
      await Promise.all(Array.from(wrap.querySelectorAll("img")).map(i => i.decode().catch(() => undefined)));
      const canvas = await html2canvas(wrap.firstElementChild as HTMLElement, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const pageH = Math.round(canvas.width * 297 / 210);
      for (let y = 0; y < canvas.height - 4; y += pageH) {
        const slice = document.createElement("canvas"); slice.width = canvas.width; slice.height = Math.min(pageH, canvas.height - y);
        slice.getContext("2d")!.drawImage(canvas, 0, y, canvas.width, slice.height, 0, 0, canvas.width, slice.height);
        if (!first) pdf.addPage(); first = false;
        pdf.addImage(slice.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, 210, slice.height * 210 / canvas.width);
      }
      wrap.remove();
    }
  } finally { host.remove(); }
  const name = ids.length === 1 ? `${lastNumber || kind}.pdf` : `${kind === "quotation" ? "quotations" : kind === "sales" ? "sales-tax-invoices" : "invoices"}-${ids.length}.pdf`;
  const blob = pdf.output("blob");
  const file = new File([blob], name, { type: "application/pdf" });
  if (matchMedia("(pointer: coarse)").matches && navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: name }); return; } catch (e) { if ((e as DOMException).name === "AbortError") return; }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
