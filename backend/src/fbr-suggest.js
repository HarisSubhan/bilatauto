// System suggestions for FBR validation errors.
// Evidence comes only from explicit data: the Custom HS master's Type of Goods and
// earlier invoice lines with the same FBR HS code that FBR accepted. No HS-prefix tax guesses.

const SALE_TYPE_CODES = new Set(["0052", "0013", "0092"]);
const UOM_CODES = { "0099": null, "0096": "KWH", "0097": "KG" };
const SRO_CODES = new Set(["0077", "0078"]);
const norm = (s) => String(s ?? "").trim().toLowerCase();

/** Pick the most frequent non-empty value of a field among accepted lines. */
function mostUsed(rows, key) {
  const n = new Map();
  for (const r of rows) { const v = String(r[key] ?? "").trim(); if (v) n.set(v, (n.get(v) || 0) + 1); }
  let best = null, count = 0;
  for (const [v, c] of n) if (c > count) { best = v; count = c; }
  return best ? { value: best, count } : null;
}

/** Item lines an error refers to: "Item 3 (...)" → [2]; header errors → every line. */
function linesFor(where, total) {
  const m = /^Item\s+(\d+)/i.exec(String(where || ""));
  if (m) { const i = Number(m[1]) - 1; return i >= 0 && i < total ? [i] : []; }
  return [...Array(total).keys()];
}

/**
 * @param errors   interpreted/precheck issues ({ code, where, ... })
 * @param items    invoice_items rows (hs_code, fbr_hs_code, type_of_goods, uom, sro_schedule_no, sro_item_serial_no)
 * @param evidence { master: { [custom_hs_code]: type_of_goods }, accepted: { [fbr_hs_code]: rows[] } }
 * @returns errors with `suggestions: [{ line, field, current, value, reason, patch }]`
 */
export function suggestFixes(errors, items, evidence = {}) {
  const master = evidence.master || {}, accepted = evidence.accepted || {};
  return errors.map((e) => {
    const code = e.code ? String(e.code) : null;
    const field = String(e.field || "");
    const wantsSale = (code && SALE_TYPE_CODES.has(code)) || (!code && /sale type/i.test(field));
    const wantsUom = (code && code in UOM_CODES) || (!code && /^uom$/i.test(field) && !e.auto);
    const wantsSro = (code && SRO_CODES.has(code)) || (!code && /^sro/i.test(field));
    if (!wantsSale && !wantsUom && !wantsSro) return e;
    const suggestions = [];
    for (const i of linesFor(e.where, items.length)) {
      const it = items[i]; const hs = String(it.fbr_hs_code || it.hs_code || "").trim();
      const hist = accepted[hs] || [];
      const label = `Item ${i + 1}${it.description ? ` (${String(it.description).slice(0, 30)})` : ""}`;
      if (wantsSale) {
        const fromMaster = master[it.hs_code] ? { value: master[it.hs_code], reason: `Custom HS Codes master sets "${master[it.hs_code]}" for ${it.hs_code}.` } : null;
        const h = mostUsed(hist, "type_of_goods");
        const fromHist = h ? { value: h.value, reason: `FBR accepted HS ${hs} with "${h.value}" on ${h.count} earlier invoice line(s).` } : null;
        const pick = [fromHist, fromMaster].find((x) => x && norm(x.value) !== norm(it.type_of_goods));
        if (pick) {
          const patch = { type_of_goods: pick.value };
          const same = hist.filter((r) => norm(r.type_of_goods) === norm(pick.value));
          const sro = mostUsed(same, "sro_schedule_no"), serial = mostUsed(same, "sro_item_serial_no"), uom = mostUsed(same, "uom");
          patch.sro_schedule_no = sro?.value ?? ""; patch.sro_item_serial_no = serial?.value ?? "";
          if (uom && norm(uom.value) !== norm(it.uom)) patch.uom = uom.value;
          suggestions.push({ line: i, label, field: "Type of Goods", current: it.type_of_goods || "", value: pick.value, reason: pick.reason, patch });
        }
      }
      if (wantsUom) {
        const fixed = code ? UOM_CODES[code] : null;
        const h = mostUsed(hist, "uom");
        const value = fixed || h?.value;
        if (value && norm(value) !== norm(it.uom)) suggestions.push({ line: i, label, field: "UOM", current: it.uom || "", value, reason: fixed ? `FBR error ${code} allows only ${fixed} for this HS code.` : `FBR accepted HS ${hs} with UOM "${value}" on ${h.count} earlier line(s).`, patch: { uom: value } });
      }
      if (wantsSro) {
        const same = hist.filter((r) => norm(r.type_of_goods) === norm(it.type_of_goods));
        const sro = mostUsed(same, "sro_schedule_no"), serial = mostUsed(same, "sro_item_serial_no");
        if (sro && serial && (norm(sro.value) !== norm(it.sro_schedule_no) || norm(serial.value) !== norm(it.sro_item_serial_no)))
          suggestions.push({ line: i, label, field: "SRO", current: [it.sro_schedule_no, it.sro_item_serial_no].filter(Boolean).join(" / "), value: `${sro.value} / ${serial.value}`, reason: `FBR accepted HS ${hs} as "${it.type_of_goods}" with this SRO on earlier invoices.`, patch: { sro_schedule_no: sro.value, sro_item_serial_no: serial.value } });
      }
    }
    return suggestions.length ? { ...e, suggestions } : { ...e, suggestions: [], no_suggestion: "No earlier FBR-accepted example or Custom HS master setting exists for this item yet. Edit the invoice, correct it, then validate again; set the Type of Goods in Custom HS Codes so it is suggested next time." };
  });
}

/** Load explicit evidence for the given invoice items. */
export async function loadEvidence(c, items, env, excludeInvoiceId) {
  const custom = [...new Set(items.map((x) => x.hs_code).filter(Boolean))];
  const fbr = [...new Set(items.map((x) => x.fbr_hs_code || x.hs_code).filter(Boolean))];
  const master = {}, accepted = {};
  if (custom.length) {
    const [rows] = await c.query("SELECT hs_code, type_of_goods FROM custom_hs_codes WHERE hs_code IN (?) AND deleted_at IS NULL AND type_of_goods IS NOT NULL AND type_of_goods<>''", [custom]);
    for (const r of rows) master[r.hs_code] ??= r.type_of_goods;
  }
  if (fbr.length) {
    const hs = "COALESCE(NULLIF(CONVERT(it.fbr_hs_code USING utf8mb4) COLLATE utf8mb4_unicode_ci,''),CONVERT(it.hs_code USING utf8mb4) COLLATE utf8mb4_unicode_ci)";
    const [rows] = await c.query(`SELECT ${hs} hs, it.type_of_goods, it.uom, it.sro_schedule_no, it.sro_item_serial_no
      FROM invoice_items it JOIN fbr_invoice_state s ON s.invoice_id=it.invoice_id AND s.environment=? AND s.status IN ('validated','sent')
      WHERE ${hs} IN (?) AND it.invoice_id<>? ORDER BY s.validated_at DESC LIMIT 2000`, [env, fbr, excludeInvoiceId]);
    for (const r of rows) (accepted[r.hs] ??= []).push(r);
  }
  return { master, accepted };
}

/** Allowed item fields a suggestion may change. */
export const SUGGESTION_FIELDS = ["type_of_goods", "uom", "sro_schedule_no", "sro_item_serial_no"];
