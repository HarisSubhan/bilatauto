/** Keep IRIS display formatting; only remove separators/check digits for the DI request. */
export function normalizeTaxId(value?: string | null): string {
  const raw = String(value ?? "").trim().toUpperCase();
  const ntn = raw.match(/^([A-Z0-9]{7})-\d$/);
  if (ntn?.[1]) return ntn[1];
  const compact = raw.replace(/[\s-]/g, "");
  return /^\d{8}$/.test(compact) ? compact.slice(0, 7) : compact;
}

export function validTaxId(value?: string | null): boolean {
  const raw = String(value ?? "").trim();
  return /^[a-z0-9\s-]+$/i.test(raw) && /^(?:[A-Z0-9]{7}|\d{13})$/.test(normalizeTaxId(raw));
}

export function decodeFbrJson(value: unknown): unknown {
  let decoded = value;
  for (let i = 0; i < 4 && typeof decoded === "string"; i++) {
    try { decoded = JSON.parse(decoded); } catch { break; }
  }
  return decoded;
}