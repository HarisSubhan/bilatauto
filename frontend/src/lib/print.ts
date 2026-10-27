import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { Button } from "@/components/ui/button";
import { db as supabase , api } from "@/lib/db";

export type DocKind = "quotation" | "bill" | "sales" | "simplified" | "fbr";
const esc = (v: unknown) => String(v ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c);
const money = (n: unknown) => Number(n ?? 0).toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** A4 = 794 × 1123 CSS px at 96 dpi. Plain white paper, black text, dark borders; generous top/bottom margins so the document
 * never collides with a physical preprinted letterhead. No system header, footer or page numbers are printed. */
export const A4_CSS = `
.a4doc{width:794px;min-height:1123px;box-sizing:border-box;padding:180px 40px 90px;background:#fff;color:#111;font:12px Arial,sans-serif;display:flex;flex-direction:column;page-break-after:always;break-after:page}
.a4doc *{box-sizing:border-box}
.a4doc .meta{display:grid;grid-template-columns:1fr auto 1fr;gap:16px;margin:0 0 32px;line-height:1.55}
.a4doc .meta .c{text-align:center}.a4doc .meta .r{text-align:right}
.a4doc h2{margin:0 0 3px;font-size:22px;color:#111;letter-spacing:1px}
.a4doc table{width:100%;border-collapse:collapse;font:inherit}
.a4doc table.detail{table-layout:fixed}
.a4doc .description{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.a4doc th,.a4doc td{border:1px solid #444;padding:5px 6px;vertical-align:top}
.a4doc th{background:#f2f2f2;text-align:center;font-size:11px}
.a4doc td.c{text-align:center}.a4doc td.r{text-align:right;white-space:nowrap}
.a4doc th:first-child,.a4doc td:first-child{width:36px;text-align:center}
.a4doc > *{flex-shrink:0}.a4doc tr{break-inside:avoid}
.a4doc .tot{width:340px;margin:18px 0 12px auto}.a4doc .tot div{display:flex;justify-content:space-between;padding:3px 0}
.a4doc .grand{font-weight:bold;font-size:15px;border-top:2px solid #111}
.a4doc .warn{border:1px solid #d33;color:#a11;padding:6px;margin:6px 0}
.a4doc .notes{white-space:pre-wrap;margin:8px 0}
.a4doc .tail{break-inside:avoid}.a4doc td{overflow-wrap:anywhere}
.a4doc .sig{margin-top:80px;display:flex;justify-content:flex-end}
.a4doc .grow{flex:1}`;

const abs = (u: string) => new URL(u, window.location.origin).href;

/** Deterministic Part Name: the saved Product/Part Name wins; otherwise the first segment of the description.
 * Never modifies the stored description. */
export function partName(it: Record<string, unknown>): string {
  const saved = String(it["product_name"] ?? "").trim();
  if (saved) return saved;
  const desc = String(it["description"] ?? "").trim();
  if (!desc) return "—";
  const firstLine = desc.split(/\r?\n/)[0] ?? desc;
  const segment = (firstLine.split(/\s[-–—|/]\s|,\s|;\s/)[0] ?? firstLine).trim() || firstLine;
  return segment.length > 80 ? segment.slice(0, 80).trimEnd() + "…" : segment;
}

/** First line of a long description, shortened with an ellipsis; the full text stays in the database and the title attribute. */
function shortDesc(desc: unknown): string {
  const d = String(desc ?? "").trim();
  const first = (d.split(/\r?\n/)[0] ?? d).trim();
  return first.length > 110 ? first.slice(0, 110).trimEnd() + "…" : first;
}

/** Builds the A4 document markup (one .a4doc element) for a quotation, bill, sales tax invoice (full or simplified) or FBR final invoice. */
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
  let items = (doc[quotation ? "quotation_items" : "invoice_items"] as Array<Record<string, unknown>>).slice().sort((a, b) => Number(a["line_position"]||0)-Number(b["line_position"]||0)||String(a["created_at"]).localeCompare(String(b["created_at"])));
  const unmapped: string[] = [];
  // FBR Final Invoice: only for invoices FBR accepted in Production; carries the FBR-issued number, QR code and FBR Digital Invoicing logo.
  let fbrNo = "", qr = "";
  if (kind === "fbr") {
    const [row] = (await api(`/fbr/final-invoices?id=${encodeURIComponent(id)}`)) as Array<{ fbr_invoice_number: string; submitted_at: string }>;
    if (!row) throw new Error("This invoice has not been accepted by FBR in Production yet");
    fbrNo = row.fbr_invoice_number;
    const QR = await import("qrcode");
    qr = await QR.toDataURL(fbrNo, { version: 2, errorCorrectionLevel: "L", margin: 0, width: 192 });
  }
  // Full-detail Sales Tax Invoice (and FBR copy): official FBR code + FBR description. Quotations, Bills and the
  // Simplified Print show the Part Name instead and never expose HS codes or long descriptions to the customer.
  const fullDetail = kind === "sales" || kind === "fbr";
  if (fullDetail) {
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
  const title = quotation ? "QUOTATION" : fullDetail ? "SALES TAX INVOICE" : kind === "simplified" ? "SALES TAX INVOICE" : "BILL";
  const number = String(doc[quotation ? "quotation_number" : kind === "bill" ? "invoice_number" : "sales_tax_number"] ?? "");
  const source = (doc["quotations"] as { quotation_number?: string } | null)?.quotation_number ?? (doc["source"] === "manual" ? "Manual invoice" : "");

  // Line calculations: goods amount = qty × rate; service amount = the entered service amount.
  // Tax and net come from the stored values (exact for every record); older records stay correct.
  const calc = items.map(it => {
    const svc = it["item_kind"] === "service";
    const qty = Number(it["quantity"]) > 0 ? Number(it["quantity"]) : 1;
    const price = Number(it["unit_price"] ?? it["unit_cost"] ?? 0);
    const amount = r2(svc ? price : qty * price);
    const storedTax = Number(it["sales_tax_value"]);
    const storedNet = Number(it["line_total"]);
    const tax = Number.isFinite(storedTax) && it["sales_tax_value"] != null ? r2(storedTax) : r2(amount * Number(it["tax_percent"] ?? 0) / 100);
    const net = Number.isFinite(storedNet) && it["line_total"] != null ? r2(storedNet) : r2(amount + tax);
    return { it, svc, qty, price, amount, gross: r2(net - tax), tax, net };
  });
  const rows = calc.map(({ it, svc, qty, price, amount, tax, net }, i) => {
    const nameCell = fullDetail
      ? `<span class="description" title="${esc(it["description"])}">${esc(shortDesc(it["description"]))}</span>`
      : svc ? `Service${it["part_number"] ? `<br><small>Part: ${esc(it["part_number"])}</small>` : ""}` : `${esc(partName(it))}${it["part_number"] ? `<br><small>Part: ${esc(it["part_number"])}</small>` : ""}`;
    return `<tr><td class="c">${i + 1}</td>${fullDetail ? `<td class="c" style="white-space:nowrap">${esc(it["hs_code"])}</td>` : ""}<td>${nameCell}</td><td class="c">${esc(qty)}</td><td class="r">${money(price)}</td><td class="r">${money(amount)}</td><td class="c">${esc(Number(it["tax_percent"]))}%</td><td class="r">${money(tax)}</td><td class="r">${money(net)}</td></tr>`;
  }).join("");

  // Tax summary: goods GST and Service Sales Tax shown as separate components (§4). Rates shown when uniform.
  const goods = calc.filter(c => !c.svc), svcs = calc.filter(c => c.svc);
  const uniform = (ls: typeof calc) => { const set = new Set(ls.map(c => Number(c.it["tax_percent"] ?? 0))); return set.size === 1 ? [...set][0] : null; };
  const gAmount = r2(goods.reduce((a, c) => a + c.amount, 0));
  const gTaxable = r2(goods.reduce((a, c) => a + c.gross, 0)), gTax = r2(goods.reduce((a, c) => a + c.tax, 0));
  const sTaxable = r2(svcs.reduce((a, c) => a + c.gross, 0)), sTax = r2(svcs.reduce((a, c) => a + c.tax, 0));
  const gRate = uniform(goods), sRate = uniform(svcs);
  const totRows: string[] = [];
  if (goods.length) totRows.push(`<div><span>Goods amount</span><span>${money(gAmount)}</span></div>`);
  if (goods.length) totRows.push(`<div><span>Goods taxable amount</span><span>${money(gTaxable)}</span></div>`);
  if (gTax > 0 || goods.length) totRows.push(`<div><span>Sales Tax (GST${gRate != null ? ` ${gRate}%` : ""})</span><span>${money(gTax)}</span></div>`);
  if (svcs.length) totRows.push(`<div><span>Service taxable amount</span><span>${money(sTaxable)}</span></div>`);
  if (svcs.length) totRows.push(`<div><span>Service Sales Tax (SST${sRate != null ? ` ${sRate}%` : ""})</span><span>${money(sTax)}</span></div>`);
  if (Number(doc["labor_amount"] ?? 0) > 0) totRows.push(`<div><span>Labor (earlier record)</span><span>${money(doc["labor_amount"])}</span></div>`);
  totRows.push(`<div class="grand"><span>Grand Total (${esc(s["currency"] || "PKR")})</span><span>${money(doc["grand_total"])}</span></div>`);

  const head = `<div class="meta">
<div><b>${esc(doc["buyer_name"] || dept?.name)}</b><br>${esc(dept?.address)}<br>Buyer NTN / STRN: ${esc(doc["buyer_ntn"] || dept?.tax_number || "Not provided")}<br>Vehicle: ${esc([doc["vehicle_type"], doc["vehicle_number"]].filter(Boolean).join(" · ") || "—")}</div>
<div class="c"><h2>${title}</h2><b>${esc(number)}</b><br>Date: ${esc(doc[quotation ? "quotation_date" : "invoice_date"])}<br>${quotation ? `Valid until: ${esc(doc["valid_until"] || "—")}` : `Quotation: ${esc(source || "—")}`}</div>
<div class="r"><b>${esc(s["company_name"] || "Bilal Autos")}</b><br>${esc(s["company_address"] || "")}<br>Seller NTN: ${esc(s["company_ntn"] || "7079463-0")}<br>Seller STRN: ${esc(s["company_strn"] || "327787623695")}</div></div>`;

  const html = `<div class="a4doc">${head}
${kind === "fbr" ? `<div class="fbrbox" style="display:flex;align-items:center;gap:12px;border:1px solid #1d4f91;border-radius:6px;padding:8px;margin:8px 0"><img src="${esc(abs("/fbr-digital-invoicing.png"))}" alt="FBR Digital Invoicing System" style="width:1in;height:auto" /><div style="flex:1"><b>FBR Invoice No.</b><br><span style="font-family:monospace;font-size:13px">${esc(fbrNo)}</span></div><img src="${qr}" alt="FBR invoice QR code" style="width:1in;height:1in" /></div>` : ""}
${unmapped.length ? `<p class="warn">FBR mapping missing for HS code(s): ${esc(unmapped.join(", "))}. Fix the FBR HS code in Custom HS Codes before submitting to FBR.</p>` : ""}
<table${fullDetail ? ' class="detail"' : ""}>${fullDetail ? '<colgroup><col style="width:5%"><col style="width:10%"><col style="width:23%"><col style="width:5%"><col style="width:11%"><col style="width:11%"><col style="width:8%"><col style="width:13%"><col style="width:14%"></colgroup>' : ""}<thead><tr><th>SR. No.</th>${fullDetail ? "<th>HS Code</th>" : ""}<th>${fullDetail ? "Description" : "Part Name"}</th><th>QTY</th><th>Unit Rate</th><th>Amount</th><th>Sales Tax %</th><th>Sales Tax Value</th><th>Net Amount</th></tr></thead><tbody>${rows}</tbody></table>
<div class="tail"><div class="tot">${totRows.join("")}</div>
<p class="notes">${esc(doc["notes"])}</p><div class="grow"></div>
<div class="sig"><span>Authorized signature: __________________</span></div></div></div>`;
  return { html: await paginateDocument(html), number };
}

/** Paginate between rows, repeating invoice details/table headers and reserving letterhead margins on every page. No page numbers. */
export async function paginateDocument(html: string): Promise<string> {
  const host=document.createElement("div");host.style.cssText="position:fixed;left:-10000px;top:0;width:794px;";host.innerHTML=`<style>${A4_CSS}</style>${html}`;document.body?.appendChild(host);
  try {
    await document.fonts.ready;await Promise.all(Array.from(host.querySelectorAll("img")).map(i=>i.decode().catch(()=>undefined)));
    const original=host.querySelector<HTMLElement>(".a4doc");if(!original)return html;
    const table=original.querySelector("table"), tail=original.querySelector(".tail");if(!table||!tail)return html;
    const rows=Array.from(table.querySelectorAll("tbody tr"));const pages:HTMLElement[]=[];let page=original,body=table.querySelector("tbody");if(!body)return html;
    const newPage=()=>{const clone=original.cloneNode(true) as HTMLElement;clone.querySelector("tbody")?.replaceChildren();clone.querySelector(".tail")?.remove();host.appendChild(clone);page=clone;const b=clone.querySelector("tbody");if(!b)throw new Error("Missing item table");body=b;pages.push(clone);};
    const fits=()=>{const content=page.lastElementChild;if(!content)return true;const bottom=page.getBoundingClientRect().top+1123-90;return content.getBoundingClientRect().bottom<=bottom;};
    newPage();
    for(const row of rows){body?.appendChild(row.cloneNode(true));if(!fits()){body?.lastElementChild?.remove();if(body?.children.length===0)throw new Error("An item is too tall for an A4 page. Shorten its description.");newPage();body?.appendChild(row.cloneNode(true));if(!fits())throw new Error("An item is too tall for an A4 page. Shorten its description.");}}
    const end=tail.cloneNode(true) as HTMLElement;page.appendChild(end);if(!fits()){end.remove();newPage();page.appendChild(end);if(!fits())throw new Error("Document notes are too long for one A4 page. Shorten the notes.");}
    return pages.map(p=>p.outerHTML).join("");
  } finally {host.remove();}
}

export async function printDocs(ids: string[], kind: DocKind) {
 const win=window.open("","_blank");if(!win)return;
 win.document.write("<p>Preparing…</p>");
 try {const docs=await Promise.all(ids.map(id=>buildDocHtml(id,kind)));win.document.open();win.document.write(`<!doctype html><html><head><title>${esc(docs.length===1?docs[0]?.number:`${docs.length} documents`)}</title><style>@page{size:A4;margin:0}body{margin:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}${A4_CSS}</style></head><body>${docs.map(d=>d.html).join("")}<script>window.onload=()=>Promise.all(Array.from(document.images).map(i=>i.decode().catch(()=>{}))).then(()=>window.print())</script></body></html>`);win.document.close();}catch(e){win.document.body.textContent=(e as Error).message;}
}
export const printInvoice=(id:string,salesTax=false)=>printDocs([id],salesTax?"sales":"bill");
export const printQuotation=(id:string)=>printDocs([id],"quotation");

export async function downloadPdf(ids:string[],kind:DocKind) {
 const [{default:html2canvas},{jsPDF}]=await Promise.all([import("html2canvas-pro"),import("jspdf")]);const pdf=new jsPDF({unit:"mm",format:"a4"});
 const host=document.createElement("div");host.style.cssText="position:fixed;left:-10000px;top:0;width:794px;";host.innerHTML=`<style>${A4_CSS}</style>`;document.body?.appendChild(host);let first=true,lastNumber="";
 try {for(const id of ids){const {html,number}=await buildDocHtml(id,kind);lastNumber=number;const wrap=document.createElement("div");wrap.innerHTML=html;host.appendChild(wrap);await Promise.all(Array.from(wrap.querySelectorAll("img")).map(i=>i.decode().catch(()=>undefined)));for(const page of Array.from(wrap.querySelectorAll<HTMLElement>(".a4doc"))){const canvas=await html2canvas(page,{scale:2,useCORS:true,backgroundColor:"#ffffff"});if(!first)pdf.addPage();first=false;pdf.addImage(canvas.toDataURL("image/jpeg",0.95),"JPEG",0,0,210,297);}wrap.remove();}}finally{host.remove();}
 const name=ids.length===1?`${lastNumber||kind}.pdf`:`${kind}-${ids.length}.pdf`;const blob=pdf.output("blob");const file=new File([blob],name,{type:"application/pdf"});
 // Generation happens first. A fresh click retains activation for Safari downloads/share sheets.
 const dialog=document.createElement("dialog");dialog.className="pointer-events-auto rounded-lg border border-border bg-card p-6 text-card-foreground shadow-lg";document.body?.appendChild(dialog);const root=createRoot(dialog);const close=()=>{dialog.close();root.unmount();dialog.remove();};
 const save=async()=>{if(matchMedia("(pointer:coarse)").matches&&navigator.canShare?.({files:[file]})){try{await navigator.share({files:[file],title:name});close();return;}catch(e){if((e as DOMException).name==="AbortError")return;}}const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=name;document.body?.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);close();};
 root.render(createElement("div",{className:"space-y-4"},createElement("p",{className:"font-semibold"},"Your PDF is ready"),createElement("div",{className:"flex gap-2"},createElement(Button,{onClick:()=>void save()},"Save PDF"),createElement(Button,{variant:"outline",onClick:close},"Cancel"))));dialog.showModal();
}
