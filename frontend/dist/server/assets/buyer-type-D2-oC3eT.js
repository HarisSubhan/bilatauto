import { a as db, n as Button } from "./bilal-logo.asset-DVM5nCcq.js";
import { d as DialogContent, h as DialogTitle, m as DialogHeader, u as Dialog } from "./AppShell-CbTTFVU-.js";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-GN_Kexq5.js";
import { i as printDocs, n as buildDocHtml, r as downloadPdf, t as A4_CSS } from "./print-PiHnITnd.js";
import { t as Label } from "./label-DwaA--ly.js";
import { n as validTaxId } from "./tax-id-Db-hC7Im.js";
import { useEffect, useRef, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileDown, Printer } from "lucide-react";
//#region src/components/data/DocViewer.tsx
/** A4 on-screen preview of a quotation / bill / sales tax invoice, with Print and Download PDF. */
function DocViewer({ id, kind, onClose }) {
	const [html, setHtml] = useState(null);
	const [num, setNum] = useState("");
	const [busy, setBusy] = useState(false);
	const [scale, setScale] = useState(1);
	const box = useRef(null);
	useEffect(() => {
		buildDocHtml(id, kind).then((r) => {
			setHtml(r.html);
			setNum(r.number);
		}).catch((e) => toast.error(e.message));
	}, [id, kind]);
	useEffect(() => {
		const fit = () => box.current && setScale(Math.min(1, (box.current.clientWidth - 16) / 794));
		fit();
		window.addEventListener("resize", fit);
		return () => window.removeEventListener("resize", fit);
	}, [html]);
	return /* @__PURE__ */ jsx(Dialog, {
		open: true,
		onOpenChange: (o) => !o && onClose(),
		children: /* @__PURE__ */ jsxs(DialogContent, {
			className: "max-h-[94vh] max-w-[880px] overflow-auto",
			children: [/* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsxs(DialogTitle, {
				className: "flex flex-wrap items-center gap-2",
				children: [num || "Loading…", /* @__PURE__ */ jsxs("span", {
					className: "ml-auto flex gap-2",
					children: [/* @__PURE__ */ jsxs(Button, {
						size: "sm",
						variant: "outline",
						onClick: () => void printDocs([id], kind),
						children: [/* @__PURE__ */ jsx(Printer, { className: "size-4" }), "Print"]
					}), /* @__PURE__ */ jsxs(Button, {
						size: "sm",
						disabled: busy || !html,
						onClick: async () => {
							setBusy(true);
							try {
								await downloadPdf([id], kind);
							} catch (e) {
								toast.error(e.message);
							}
							setBusy(false);
						},
						children: [/* @__PURE__ */ jsx(FileDown, { className: "size-4" }), busy ? "Preparing…" : "Download PDF"]
					})]
				})]
			}) }), /* @__PURE__ */ jsx("div", {
				ref: box,
				className: "overflow-hidden rounded-lg bg-muted p-2",
				children: html ? /* @__PURE__ */ jsx("div", {
					style: { width: 794 * scale },
					className: "mx-auto shadow-lg",
					children: /* @__PURE__ */ jsxs("div", {
						style: {
							zoom: scale,
							width: 794
						},
						children: [/* @__PURE__ */ jsx("style", { children: A4_CSS }), /* @__PURE__ */ jsx("div", { dangerouslySetInnerHTML: { __html: html } })]
					})
				}) : /* @__PURE__ */ jsx("p", {
					className: "p-10 text-center text-sm text-muted-foreground",
					children: "Loading document…"
				})
			})]
		})
	});
}
//#endregion
//#region src/components/data/BuyerTypeField.tsx
/** Buyer Type dropdown populated from the Buyer Type master. */
function BuyerTypeField({ value, onChange, problem }) {
	const opts = useQuery({
		queryKey: ["buyer_types", "active"],
		queryFn: async () => {
			const { data, error } = await db.from("buyer_types").select("id,name").eq("status", "active").order("serial_number");
			if (error) throw new Error(error.message);
			return data ?? [];
		}
	});
	return /* @__PURE__ */ jsxs("div", {
		className: "space-y-1.5",
		children: [
			/* @__PURE__ */ jsx(Label, { children: "Buyer type *" }),
			/* @__PURE__ */ jsxs(Select, {
				value,
				onValueChange: onChange,
				children: [/* @__PURE__ */ jsx(SelectTrigger, {
					"aria-label": "Buyer type",
					children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Registered / Unregistered" })
				}), /* @__PURE__ */ jsx(SelectContent, { children: (opts.data ?? []).map((o) => /* @__PURE__ */ jsx(SelectItem, {
					value: o.name,
					children: o.name
				}, o.id)) })]
			}),
			problem ? /* @__PURE__ */ jsx("p", {
				className: "text-xs text-destructive",
				children: problem
			}) : null
		]
	});
}
//#endregion
//#region src/lib/buyer-type.ts
/** Suggest a buyer type from the department's saved registration type only (never from a blank tax number). */
function suggestBuyerType(registrationType) {
	const r = (registrationType ?? "").trim().toLowerCase();
	if (r === "registered") return "Registered";
	if (r === "unregistered") return "Unregistered";
	return "";
}
/**
* FBR DI API: buyerRegistrationType is "Registered" or "Unregistered"; a Registered buyer needs a
* buyerNTNCNIC of seven characters (NTN, alphabets supported) or 13 digits (CNIC).
* Returns a plain-language problem or null.
*/
function buyerTypeProblem(type, taxNumber) {
	if (!type) return "Choose a buyer type (Registered or Unregistered).";
	if (type !== "Registered" && type !== "Unregistered") return "Buyer type must be Registered or Unregistered.";
	if ((type === "Registered" || taxNumber?.trim()) && !validTaxId(taxNumber)) return "Enter a valid buyer NTN or 13-digit CNIC in Departments / Buyers. NTN letters and dashes are supported (for example C01245-5).";
	return null;
}
//#endregion
export { DocViewer as i, suggestBuyerType as n, BuyerTypeField as r, buyerTypeProblem as t };
