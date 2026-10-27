import { i as api, n as Button } from "./bilal-logo.asset-DVM5nCcq.js";
import { t as AppShell } from "./AppShell-CbTTFVU-.js";
import { a as TableHeader, i as TableHead, n as TableBody, o as TableRow, r as TableCell, t as Table } from "./table-ITrsg8wD.js";
import { i as printDocs, r as downloadPdf } from "./print-PiHnITnd.js";
import { t as Input } from "./input-BdVko9wQ.js";
import { o as TableState, s as Toolbar } from "./kit-4pQ21Dd3.js";
import { useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileDown, Printer } from "lucide-react";
//#region src/routes/_authenticated/fbr-final-invoices.tsx?tsr-split=component
var money = (n) => Number(n).toLocaleString(void 0, {
	minimumFractionDigits: 2,
	maximumFractionDigits: 2
});
function FbrFinalInvoices() {
	const [search, setSearch] = useState("");
	const [from, setFrom] = useState("");
	const [to, setTo] = useState("");
	const params = new URLSearchParams(Object.entries({
		search,
		from,
		to
	}).filter(([, v]) => v));
	const list = useQuery({
		queryKey: ["fbr-final", params.toString()],
		queryFn: () => api(`/fbr/final-invoices?${params}`)
	});
	const rows = list.data ?? [];
	return /* @__PURE__ */ jsx(AppShell, {
		title: "FBR Final Invoices",
		description: "Invoices accepted by FBR (Production) — with FBR invoice number, QR code and Digital Invoicing logo",
		children: /* @__PURE__ */ jsxs("div", {
			className: "panel overflow-hidden",
			children: [/* @__PURE__ */ jsxs(Toolbar, {
				search,
				onSearch: setSearch,
				placeholder: "Search invoice, FBR number or buyer…",
				children: [
					/* @__PURE__ */ jsx(Input, {
						type: "date",
						"aria-label": "From date",
						value: from,
						onChange: (e) => setFrom(e.target.value),
						className: "w-40"
					}),
					/* @__PURE__ */ jsx(Input, {
						type: "date",
						"aria-label": "To date",
						value: to,
						onChange: (e) => setTo(e.target.value),
						className: "w-40"
					}),
					/* @__PURE__ */ jsxs(Button, {
						size: "sm",
						variant: "outline",
						disabled: !rows.length,
						onClick: () => downloadPdf(rows.map((r) => r.id), "fbr").catch((e) => toast.error(e.message)),
						children: [/* @__PURE__ */ jsx(FileDown, { className: "size-4" }), "Download all"]
					})
				]
			}), /* @__PURE__ */ jsx("div", {
				className: "overflow-x-auto",
				children: /* @__PURE__ */ jsxs(Table, { children: [/* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
					/* @__PURE__ */ jsx(TableHead, { children: "FBR Invoice No." }),
					/* @__PURE__ */ jsx(TableHead, { children: "Sales Tax Invoice" }),
					/* @__PURE__ */ jsx(TableHead, { children: "Date" }),
					/* @__PURE__ */ jsx(TableHead, { children: "Buyer" }),
					/* @__PURE__ */ jsx(TableHead, { children: "Buyer type" }),
					/* @__PURE__ */ jsx(TableHead, {
						className: "text-right",
						children: "Total"
					}),
					/* @__PURE__ */ jsx(TableHead, { children: "Accepted" }),
					/* @__PURE__ */ jsx(TableHead, {
						className: "text-right",
						children: "Actions"
					})
				] }) }), /* @__PURE__ */ jsxs(TableBody, { children: [/* @__PURE__ */ jsx(TableState, {
					cols: 8,
					loading: list.isLoading,
					error: list.error ? list.error.message : null,
					empty: !list.isLoading && rows.length === 0,
					title: "No FBR-accepted invoices yet",
					hint: "Invoices appear here after FBR accepts them in Production (FBR Invoicing → Submit)."
				}), rows.map((r) => /* @__PURE__ */ jsxs(TableRow, { children: [
					/* @__PURE__ */ jsx(TableCell, {
						className: "font-mono text-xs",
						children: r.fbr_invoice_number
					}),
					/* @__PURE__ */ jsx(TableCell, {
						className: "font-mono",
						children: r.sales_tax_number
					}),
					/* @__PURE__ */ jsx(TableCell, { children: String(r.invoice_date).slice(0, 10) }),
					/* @__PURE__ */ jsx(TableCell, { children: r.department_name }),
					/* @__PURE__ */ jsx(TableCell, { children: r.buyer_type ?? "—" }),
					/* @__PURE__ */ jsx(TableCell, {
						className: "text-right tabular-nums",
						children: money(r.grand_total)
					}),
					/* @__PURE__ */ jsx(TableCell, {
						className: "text-xs",
						children: r.submitted_at ? new Date(r.submitted_at).toLocaleString() : "—"
					}),
					/* @__PURE__ */ jsxs(TableCell, {
						className: "whitespace-nowrap text-right",
						children: [/* @__PURE__ */ jsx(Button, {
							size: "icon",
							variant: "ghost",
							"aria-label": "Download FBR invoice PDF",
							onClick: () => downloadPdf([r.id], "fbr").catch((e) => toast.error(e.message)),
							children: /* @__PURE__ */ jsx(FileDown, { className: "size-4" })
						}), /* @__PURE__ */ jsx(Button, {
							size: "icon",
							variant: "ghost",
							"aria-label": "Print FBR invoice",
							onClick: () => void printDocs([r.id], "fbr"),
							children: /* @__PURE__ */ jsx(Printer, { className: "size-4" })
						})]
					})
				] }, r.id))] })] })
			})]
		})
	});
}
//#endregion
export { FbrFinalInvoices as component };
