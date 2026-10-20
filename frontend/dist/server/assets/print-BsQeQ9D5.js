import { a as db, i as api, n as Button } from "./bilal-logo.asset-BEz_DQLU.js";
import { createElement } from "react";
import { createRoot } from "react-dom/client";
var bilal_header_asset_default = {
	version: 1,
	asset_id: "842c5a42-42cc-4ac4-afc4-7b9d9e6fb26f",
	project_id: "41c08519-cb0d-4dd3-9301-24c613be83e5",
	url: "/brand/header.png",
	r2_key: "a/v1/41c08519-cb0d-4dd3-9301-24c613be83e5/842c5a42-42cc-4ac4-afc4-7b9d9e6fb26f/bilal-header.png",
	original_filename: "bilal-header.png",
	size: 204517,
	content_type: "image/png",
	created_at: "2026-10-05T08:00:56Z"
};
var bilal_footer_asset_default = {
	version: 1,
	asset_id: "03ff0769-5529-4bf5-9076-51de9c9afa4f",
	project_id: "41c08519-cb0d-4dd3-9301-24c613be83e5",
	url: "/brand/footer.png",
	r2_key: "a/v1/41c08519-cb0d-4dd3-9301-24c613be83e5/03ff0769-5529-4bf5-9076-51de9c9afa4f/bilal-footer.png",
	original_filename: "bilal-footer.png",
	size: 165476,
	content_type: "image/png",
	created_at: "2026-10-05T08:01:00Z"
};
//#endregion
//#region src/lib/print.ts
var esc = (v) => String(v ?? "").replace(/[&<>"]/g, (c) => ({
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	"\"": "&quot;"
})[c] ?? c);
var money = (n) => Number(n ?? 0).toLocaleString("en-PK", {
	minimumFractionDigits: 2,
	maximumFractionDigits: 2
});
/** A4 = 794 × 1123 CSS px at 96 dpi. Styles are scoped to .a4doc so the page can be shown in-app, printed, or captured to PDF. */
var A4_CSS = `
.a4doc{width:794px;min-height:1123px;box-sizing:border-box;padding:28px 34px 0;background:#fff;color:#111;font:11px Arial,sans-serif;display:flex;flex-direction:column;page-break-after:always;break-after:page}
.a4doc *{box-sizing:border-box}.a4doc img.lh{width:100%;display:block}.a4doc .meta{display:flex;justify-content:space-between;gap:15px;margin:12px 0;line-height:1.6}
.a4doc .r{text-align:right}.a4doc h2{margin:0;color:#cf541d;font-size:20px}.a4doc table{width:100%;border-collapse:collapse}
.a4doc th:first-child,.a4doc td:first-child{width:30px;white-space:nowrap}.a4doc td.r{white-space:nowrap}.a4doc th,.a4doc td{border:1px solid #ccc;padding:4px 5px;vertical-align:top}.a4doc th{background:#fff1e9;text-align:left;font-size:9.5px}
.a4doc > *{flex-shrink:0}.a4doc tr{break-inside:avoid}.a4doc .tot{width:320px;margin:14px 0 10px auto}.a4doc .tot div{display:flex;justify-content:space-between;padding:3px 0}
.a4doc .grand{font-weight:bold;font-size:14px;border-top:2px solid #d85d24}.a4doc .offline{border:1px dashed #dd782d;padding:6px;background:#fff7ef;margin:6px 0}
.a4doc .warn{border:1px solid #d33;color:#a11;padding:6px;margin:6px 0}.a4doc .notes{white-space:pre-wrap;margin:8px 0}
.a4doc.invoice{height:1123px;min-height:1123px;padding:151px 34px 94px;background:#fff}.a4doc.invoice h2{color:#111}.a4doc.invoice th{background:#fff}.a4doc.invoice .grand{border-color:#111}.a4doc.invoice .offline{background:#fff;border-color:#777}.a4doc .tail{break-inside:avoid}.a4doc td{overflow-wrap:anywhere}.a4doc .page-number{font-size:9px;text-align:right;margin-top:8px}.a4doc .sig{margin-top:26px;display:flex;justify-content:space-between}.a4doc .grow{flex:1}.a4doc img.ft{width:calc(100% + 68px);max-width:none;margin:16px -34px 0;display:block}`;
var abs = (u) => new URL(u, window.location.origin).href;
/** Builds the A4 document markup (one .a4doc element) for a quotation, bill or sales tax invoice. */
async function buildDocHtml(id, kind) {
	const quotation = kind === "quotation";
	const { data: d, error } = quotation ? await db.from("quotations").select("*, departments(name,address,tax_number,phone), quotation_items(*)").eq("id", id).single() : await db.from("invoices").select("*, departments(name,address,tax_number,phone), quotations(quotation_number), invoice_items(*)").eq("id", id).single();
	if (error || !d) throw new Error("Document could not be loaded");
	const { data: settings } = await db.from("system_settings").select("key,value");
	const s = Object.fromEntries((settings ?? []).map((r) => [r.key, r.value ?? ""]));
	const doc = d;
	const dept = doc["departments"];
	let items = doc[quotation ? "quotation_items" : "invoice_items"].slice().sort((a, b) => Number(a["line_position"] || 0) - Number(b["line_position"] || 0) || String(a["created_at"]).localeCompare(String(b["created_at"])));
	const unmapped = [];
	let fbrNo = "", qr = "";
	if (kind === "fbr") {
		const [row] = await api(`/fbr/final-invoices?id=${encodeURIComponent(id)}`);
		if (!row) throw new Error("This invoice has not been accepted by FBR in Production yet");
		fbrNo = row.fbr_invoice_number;
		qr = await (await import("qrcode")).toDataURL(fbrNo, {
			version: 2,
			errorCorrectionLevel: "L",
			margin: 0,
			width: 192
		});
	}
	if (kind === "sales" || kind === "fbr") {
		const codes = [...new Set(items.map((it) => String(it["fbr_hs_code"] ?? "")).filter(Boolean))];
		const { data: fbr } = codes.length ? await db.from("fbr_hs_codes").select("hs_code,description").in("hs_code", codes) : { data: [] };
		const map = new Map((fbr ?? []).map((r) => [r.hs_code, r.description]));
		items = items.map((it) => {
			const code = String(it["fbr_hs_code"] ?? "");
			const desc = map.get(code);
			if (!desc) unmapped.push(String(it["hs_code"]));
			return {
				...it,
				hs_code: desc ? code : it["hs_code"],
				description: desc ?? it["description"]
			};
		});
	}
	const title = quotation ? "QUOTATION" : kind === "sales" || kind === "fbr" ? "SALES TAX INVOICE" : "INVOICE / BILL";
	const number = String(doc[quotation ? "quotation_number" : kind === "sales" || kind === "fbr" ? "sales_tax_number" : "invoice_number"] ?? "");
	const source = doc["quotations"]?.quotation_number ?? (doc["source"] === "manual" ? "Manual invoice" : "");
	const rows = items.map((it, i) => `<tr><td>${i + 1}</td>${quotation ? "" : `<td>${esc(it["hs_code"])}</td>`}<td>${esc(quotation ? it["product_name"] || "—" : it["description"])}${it["part_number"] ? `<br><small>Part: ${esc(it["part_number"])}</small>` : ""}${quotation ? "" : `<br><small>${esc(it["type_of_goods"] || "—")} · ${esc(it["uom"] || "—")}${it["sro_schedule_no"] ? ` · SRO ${esc(it["sro_schedule_no"])}${it["sro_item_serial_no"] ? " / " + esc(it["sro_item_serial_no"]) : ""}` : ""}</small>`}</td><td class="r">${esc(it["quantity"])}</td><td class="r">${money(it["unit_price"])}${it["item_kind"] === "service" ? "<br><small>service amount</small>" : ""}</td><td class="r">${money(it["discount"])}</td><td class="r">${esc(Number(it["tax_percent"]))}%</td><td class="r">${money(it["sales_tax_value"])}</td><td class="r">${it["item_kind"] === "service" && it["service_percent"] != null ? esc(Number(it["service_percent"])) + "%" : ""}</td><td class="r">${money(it["line_total"])}</td></tr>`).join("");
	return {
		html: await paginateDocument(`<div class="a4doc ${quotation ? "" : "invoice"}">${quotation ? `<img class="lh" src="${esc(abs(bilal_header_asset_default.url))}" alt="Bilal Autos letterhead" crossorigin="anonymous" />` : ""}
<div class="meta"><div><b>${esc(doc["buyer_name"] || dept?.name)}</b><br>${esc(dept?.address)}<br>Buyer NTN / STRN: ${esc(doc["buyer_ntn"] || dept?.tax_number || "Not provided")}<br>Vehicle type: ${esc(doc["vehicle_type"] || "—")}<br>Vehicle number: ${esc(doc["vehicle_number"] || "—")}</div>
<div class="r"><h2>${title}</h2><b>${esc(number)}</b><br>Date: ${esc(doc[quotation ? "quotation_date" : "invoice_date"])}<br>${quotation ? `Valid until: ${esc(doc["valid_until"] || "—")}` : `Quotation: ${esc(source || "—")}`}<br>Seller NTN: ${esc(s["company_ntn"] || "7079463-0")}<br>Seller STRN: ${esc(s["company_strn"] || "327787623695")}</div></div>
${kind === "fbr" ? `<div class="fbrbox" style="display:flex;align-items:center;gap:12px;border:1px solid #1d4f91;border-radius:6px;padding:8px;margin:8px 0"><img src="${esc(abs("/fbr-digital-invoicing.png"))}" alt="FBR Digital Invoicing System" style="width:1in;height:auto" /><div style="flex:1"><b>FBR Invoice No.</b><br><span style="font-family:monospace;font-size:13px">${esc(fbrNo)}</span></div><img src="${qr}" alt="FBR invoice QR code" style="width:1in;height:1in" /></div>` : ""}
${kind === "sales" ? "<p class=\"offline\">MANUAL / OFFLINE — Not submitted to FBR. This document has no FBR-issued number, QR code or submission acknowledgment.</p>" : ""}
${unmapped.length ? `<p class="warn">FBR mapping missing for HS code(s): ${esc(unmapped.join(", "))}. Fix the FBR HS code in Custom HS Codes before submitting to FBR.</p>` : ""}
<table><thead><tr><th>#</th>${quotation ? "" : "<th>HS Code</th>"}<th>${quotation ? "Product Name" : "Particulars / Description"}</th><th>Units</th><th>Rate</th><th>Disc.</th><th>ST %</th><th>Sales Tax Value</th><th>Rate %</th><th>Net Amount</th></tr></thead><tbody>${rows}</tbody></table>
<div class="tail"><div class="tot"><div><span>Subtotal</span><span>${money(doc["subtotal"])}</span></div><div><span>Discount</span><span>− ${money(doc["discount_total"])}</span></div><div><span>Sales Tax Value</span><span>${money(doc["tax_total"])}</span></div>${Number(doc["labor_amount"] ?? 0) > 0 ? `<div><span>Labor (earlier record)</span><span>${money(doc["labor_amount"])}</span></div>` : ""}<div class="grand"><span>Grand Total (${esc(s["currency"] || "PKR")})</span><span>${money(doc["grand_total"])}</span></div></div>
<p class="notes">${esc(doc["notes"])}</p><div class="grow"></div>
<div class="sig"><span>Customer signature: __________________</span><span>Authorized signature: __________________</span></div>
${quotation ? `<img class="ft" src="${esc(abs(bilal_footer_asset_default.url))}" alt="Bilal Autos contact details" crossorigin="anonymous" />` : ""}</div></div>`),
		number
	};
}
/** Paginate between rows, repeating invoice details/table headers and reserving margins on every page. */
async function paginateDocument(html) {
	const host = document.createElement("div");
	host.style.cssText = "position:fixed;left:-10000px;top:0;width:794px;";
	host.innerHTML = `<style>${A4_CSS}</style>${html}`;
	document.body?.appendChild(host);
	try {
		await document.fonts.ready;
		await Promise.all(Array.from(host.querySelectorAll("img")).map((i) => i.decode().catch(() => void 0)));
		const original = host.querySelector(".a4doc");
		if (!original) return html;
		const table = original.querySelector("table"), tail = original.querySelector(".tail");
		if (!table || !tail) return html;
		const rows = Array.from(table.querySelectorAll("tbody tr"));
		const pages = [];
		let page = original, body = table.querySelector("tbody");
		if (!body) return html;
		const newPage = () => {
			const clone = original.cloneNode(true);
			clone.querySelector("tbody")?.replaceChildren();
			clone.querySelector(".tail")?.remove();
			host.appendChild(clone);
			page = clone;
			const b = clone.querySelector("tbody");
			if (!b) throw new Error("Missing item table");
			body = b;
			pages.push(clone);
		};
		const fits = () => {
			const content = page.lastElementChild;
			if (!content) return true;
			const bottom = page.getBoundingClientRect().top + 1123 - (page.classList.contains("invoice") ? 94 : 50);
			return content.getBoundingClientRect().bottom <= bottom;
		};
		newPage();
		for (const row of rows) {
			body?.appendChild(row.cloneNode(true));
			if (!fits()) {
				body?.lastElementChild?.remove();
				if (body?.children.length === 0) throw new Error("An item is too tall for an A4 page. Shorten its description.");
				newPage();
				body?.appendChild(row.cloneNode(true));
				if (!fits()) throw new Error("An item is too tall for an A4 page. Shorten its description.");
			}
		}
		const end = tail.cloneNode(true);
		page.appendChild(end);
		if (!fits()) {
			end.remove();
			newPage();
			page.appendChild(end);
			if (!fits()) throw new Error("Document notes are too long for one A4 page. Shorten the notes.");
		}
		pages.forEach((p, i) => {
			const n = document.createElement("div");
			n.className = "page-number";
			n.textContent = `Page ${i + 1} of ${pages.length}`;
			p.appendChild(n);
		});
		return pages.map((p) => p.outerHTML).join("");
	} finally {
		host.remove();
	}
}
async function printDocs(ids, kind) {
	const win = window.open("", "_blank");
	if (!win) return;
	win.document.write("<p>Preparing…</p>");
	try {
		const docs = await Promise.all(ids.map((id) => buildDocHtml(id, kind)));
		win.document.open();
		win.document.write(`<!doctype html><html><head><title>${esc(docs.length === 1 ? docs[0]?.number : `${docs.length} documents`)}</title><style>@page{size:A4;margin:0}body{margin:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}${A4_CSS}</style></head><body>${docs.map((d) => d.html).join("")}<script>window.onload=()=>Promise.all(Array.from(document.images).map(i=>i.decode().catch(()=>{}))).then(()=>window.print())<\/script></body></html>`);
		win.document.close();
	} catch (e) {
		win.document.body.textContent = e.message;
	}
}
var printInvoice = (id, salesTax = false) => printDocs([id], salesTax ? "sales" : "bill");
var printQuotation = (id) => printDocs([id], "quotation");
async function downloadPdf(ids, kind) {
	const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas-pro"), import("jspdf")]);
	const pdf = new jsPDF({
		unit: "mm",
		format: "a4"
	});
	const host = document.createElement("div");
	host.style.cssText = "position:fixed;left:-10000px;top:0;width:794px;";
	host.innerHTML = `<style>${A4_CSS}</style>`;
	document.body?.appendChild(host);
	let first = true, lastNumber = "";
	try {
		for (const id of ids) {
			const { html, number } = await buildDocHtml(id, kind);
			lastNumber = number;
			const wrap = document.createElement("div");
			wrap.innerHTML = html;
			host.appendChild(wrap);
			await Promise.all(Array.from(wrap.querySelectorAll("img")).map((i) => i.decode().catch(() => void 0)));
			for (const page of Array.from(wrap.querySelectorAll(".a4doc"))) {
				const canvas = await html2canvas(page, {
					scale: 2,
					useCORS: true,
					backgroundColor: "#ffffff"
				});
				if (!first) pdf.addPage();
				first = false;
				pdf.addImage(canvas.toDataURL("image/jpeg", .95), "JPEG", 0, 0, 210, 297);
			}
			wrap.remove();
		}
	} finally {
		host.remove();
	}
	const name = ids.length === 1 ? `${lastNumber || kind}.pdf` : `${kind}-${ids.length}.pdf`;
	const blob = pdf.output("blob");
	const file = new File([blob], name, { type: "application/pdf" });
	const dialog = document.createElement("dialog");
	dialog.className = "pointer-events-auto rounded-lg border border-border bg-card p-6 text-card-foreground shadow-lg";
	document.body?.appendChild(dialog);
	const root = createRoot(dialog);
	const close = () => {
		dialog.close();
		root.unmount();
		dialog.remove();
	};
	const save = async () => {
		if (matchMedia("(pointer:coarse)").matches && navigator.canShare?.({ files: [file] })) try {
			await navigator.share({
				files: [file],
				title: name
			});
			close();
			return;
		} catch (e) {
			if (e.name === "AbortError") return;
		}
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = name;
		document.body?.appendChild(a);
		a.click();
		a.remove();
		setTimeout(() => URL.revokeObjectURL(url), 3e4);
		close();
	};
	root.render(createElement("div", { className: "space-y-4" }, createElement("p", { className: "font-semibold" }, "Your PDF is ready"), createElement("div", { className: "flex gap-2" }, createElement(Button, { onClick: () => void save() }, "Save PDF"), createElement(Button, {
		variant: "outline",
		onClick: close
	}, "Cancel"))));
	dialog.showModal();
}
//#endregion
export { printInvoice as a, printDocs as i, buildDocHtml as n, printQuotation as o, downloadPdf as r, A4_CSS as t };
