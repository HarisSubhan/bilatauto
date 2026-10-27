//#region src/lib/format.ts
function formatMoney(value, currency = "PKR") {
	return `${currency} ${Number(value ?? 0).toLocaleString(void 0, {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	})}`;
}
function formatNumber(value) {
	return Number(value ?? 0).toLocaleString(void 0, { maximumFractionDigits: 2 });
}
function toCsv(rows, headers) {
	const escape = (v) => {
		const s = v === null || v === void 0 ? "" : String(v);
		return /[",\n]/.test(s) ? `"${s.replace(/"/g, "\"\"")}"` : s;
	};
	const lines = [headers.join(",")];
	for (const row of rows) lines.push(headers.map((h) => escape(row[h])).join(","));
	return lines.join("\n");
}
function downloadCsv(filename, csv) {
	const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}
//#endregion
export { toCsv as i, formatMoney as n, formatNumber as r, downloadCsv as t };
