//#region src/lib/tax-id.ts
/** Keep IRIS display formatting; only remove separators/check digits for the DI request. */
function normalizeTaxId(value) {
	const raw = String(value ?? "").trim().toUpperCase();
	const ntn = raw.match(/^([A-Z0-9]{7})-\d$/);
	if (ntn?.[1]) return ntn[1];
	const compact = raw.replace(/[\s-]/g, "");
	return /^\d{8}$/.test(compact) ? compact.slice(0, 7) : compact;
}
function validTaxId(value) {
	const raw = String(value ?? "").trim();
	return /^[a-z0-9\s-]+$/i.test(raw) && /^(?:[A-Z0-9]{7}|\d{13})$/.test(normalizeTaxId(raw));
}
function decodeFbrJson(value) {
	let decoded = value;
	for (let i = 0; i < 4 && typeof decoded === "string"; i++) try {
		decoded = JSON.parse(decoded);
	} catch {
		break;
	}
	return decoded;
}
//#endregion
export { validTaxId as n, decodeFbrJson as t };
