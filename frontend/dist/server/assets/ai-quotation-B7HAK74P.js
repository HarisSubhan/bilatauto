import { a as db, n as Button } from "./bilal-logo.asset-DRcrRZxD.js";
import { t as AppShell } from "./AppShell-Ctpjmt0k.js";
import { a as TableHeader, c as SelectContent, d as SelectValue, i as TableHead, l as SelectItem, n as TableBody, o as TableRow, r as TableCell, s as Select, t as Table, u as SelectTrigger } from "./table-C25g3iry.js";
import { r as documentLineSchema } from "./document-calculations-3hoJn7j-.js";
import { t as Input } from "./input-C4NJMa86.js";
import { t as Label } from "./label-7BUlW98B.js";
import { t as Textarea } from "./textarea-D9S4fcOx.js";
import { t as HsCodePicker } from "./HsCodePicker-CdENtd5d.js";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Sparkles, Trash2, Upload } from "lucide-react";
//#region src/lib/local-ocr.ts
/** Key-free OCR. Handwriting is imperfect: always review text and item matches. */
function parseQuotationText(text) {
	return {
		vehicle_number: text.match(/(?:vehicle|veh|registration|reg|car)\s*(?:no\.?|number|#)?\s*[:=\-]?\s*([A-Z]{1,4}[- ]?\d{2,6})/i)?.[1] ?? "",
		vehicle_type: text.match(/(?:vehicle type|model|make)\s*[:=]\s*([^\n]+)/i)?.[1]?.trim() ?? "",
		items: text.split(/\n/).flatMap((raw) => {
			const line = raw.trim();
			if (!line || /^(?:total|subtotal|grand|gst|tax|invoice|quotation|date|vehicle|qty|quantity|particulars|bill|model|make)\b/i.test(line)) return [];
			const m = line.match(/^(\d+(?:\.\d+)?)\s+(?:pcs?\s+)?(.+?)(?:\s+(\d[\d,]*(?:\.\d+)?))?$/);
			if (m && /[a-z]/i.test(m[2])) return [{
				name: m[2].trim(),
				quantity: Number(m[1]),
				unit_price: m[3] ? Number(m[3].replace(/,/g, "")) : 0
			}];
			const n = line.match(/^(.+?[a-z].*?)\s+[x×]\s*(\d+(?:\.\d+)?)(?:\s+[@=]\s*(\d[\d,.]*))?$/i);
			return n ? [{
				name: n[1].trim(),
				quantity: Number(n[2]),
				unit_price: n[3] ? Number(n[3].replace(/,/g, "")) : 0
			}] : [];
		}).slice(0, 200)
	};
}
async function readLocalImage(image, onProgress) {
	const { createWorker } = await import("tesseract.js");
	const worker = await createWorker("eng", 1, { logger: (m) => {
		if (m.status === "recognizing text") onProgress(Math.round(m.progress * 100));
	} });
	try {
		const { data } = await worker.recognize(image);
		return {
			text: data.text,
			confidence: data.confidence,
			...parseQuotationText(data.text)
		};
	} finally {
		await worker.terminate();
	}
}
//#endregion
//#region src/routes/_authenticated/ai-quotation.tsx?tsr-split=component
async function bestMatch(name) {
	const words = name.split(/\s+/).filter((w) => w.length > 2).slice(0, 3);
	for (const term of [name, ...words]) {
		const t = `%${term.replace(/[%,()]/g, "")}%`;
		const [c, f] = await Promise.all([db.from("custom_hs_codes").select("hs_code,description").ilike("description", t).limit(1), db.from("fbr_hs_codes").select("hs_code,description").ilike("description", t).limit(1)]);
		if (c.data?.[0]) return {
			...c.data[0],
			source: "custom"
		};
		if (f.data?.[0]) return {
			...f.data[0],
			source: "fbr"
		};
	}
	return null;
}
function AiQuotationPage() {
	const navigate = useNavigate();
	const [rawText, setRawText] = useState("");
	const [progress, setProgress] = useState(0);
	const [vehicleType, setVehicleType] = useState("");
	const [vehicleNumber, setVehicleNumber] = useState("");
	const [laborPercent, setLaborPercent] = useState(0);
	const [reviewed, setReviewed] = useState(false);
	const [preview, setPreview] = useState(null);
	const [busy, setBusy] = useState(false);
	const [lines, setLines] = useState([]);
	const [dept, setDept] = useState("");
	const [tax, setTax] = useState(18);
	const depts = useQuery({
		queryKey: ["dept-options"],
		queryFn: async () => (await db.from("departments").select("id,name").eq("status", "active").order("name")).data ?? []
	});
	const onFile = (file) => {
		if (file.size > 8e6) {
			toast.error("Image must be under 8 MB");
			return;
		}
		const r = new FileReader();
		r.onload = () => setPreview(String(r.result));
		r.readAsDataURL(file);
	};
	const read = async () => {
		if (!preview && !rawText.trim()) return;
		setBusy(true);
		try {
			const result = preview ? await readLocalImage(preview, setProgress) : parseQuotationText(rawText);
			if ("text" in result) setRawText(String(result.text));
			setVehicleNumber(result.vehicle_number);
			setVehicleType(result.vehicle_type);
			setReviewed(false);
			const { items } = result;
			if (!items.length) toast.warning("No items found in the image");
			const matched = await Promise.all(items.map(async (i) => {
				const m = await bestMatch(i.name);
				return {
					read: i.name,
					hs_code: m?.hs_code ?? "",
					description: m?.description ?? i.name,
					description_source: m?.source ?? "custom",
					quantity: i.quantity,
					unit_price: i.unit_price ?? 0
				};
			}));
			setLines(matched);
		} catch (e) {
			toast.error(e.message);
		} finally {
			setBusy(false);
		}
	};
	const upd = (i, p) => setLines(lines.map((l, j) => j === i ? {
		...l,
		...p
	} : l));
	const save = async () => {
		if (!dept) {
			toast.error("Select a buyer / department");
			return;
		}
		if (!vehicleType.trim() && !vehicleNumber.trim()) {
			toast.error("Vehicle type or number is required");
			return;
		}
		if (!reviewed) {
			toast.error("Review the extracted text, prices, units and HS codes first");
			return;
		}
		setBusy(true);
		try {
			if (!lines.length) throw new Error("Add at least one item");
			const items = lines.map((l) => documentLineSchema.parse({
				...l,
				discount: 0,
				tax_percent: tax
			}));
			const { error } = await db.rpc("create_document", {
				_kind: "quotation",
				_header: {
					department_id: dept,
					date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
					vehicle_type: vehicleType,
					vehicle_number: vehicleNumber,
					notes: "Draft from locally read image; reviewed by user"
				},
				_items: items.map((it) => ({
					...it,
					labor_percent: laborPercent
				}))
			});
			if (error) throw error;
			toast.success("Draft quotation created");
			navigate({ to: "/quotations" });
		} catch (e) {
			toast.error(e.message);
		} finally {
			setBusy(false);
		}
	};
	return /* @__PURE__ */ jsx(AppShell, {
		title: "AI Quotation from Image",
		description: "Key-free local OCR → review → draft quotation. Handwriting may need correction.",
		children: /* @__PURE__ */ jsxs("div", {
			className: "grid gap-6 lg:grid-cols-3",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "space-y-3 panel overflow-hidden p-4",
				children: [
					/* @__PURE__ */ jsx(Label, {
						htmlFor: "img",
						className: "flex h-48 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed text-muted-foreground",
						children: preview ? /* @__PURE__ */ jsx("img", {
							src: preview,
							alt: "Uploaded parts list",
							className: "h-full w-full object-contain"
						}) : /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx(Upload, { className: "size-6" }), "Upload image"] })
					}),
					/* @__PURE__ */ jsx("input", {
						id: "img",
						type: "file",
						accept: "image/*",
						className: "hidden",
						onChange: (e) => e.target.files?.[0] && onFile(e.target.files[0])
					}),
					/* @__PURE__ */ jsxs(Button, {
						className: "w-full",
						disabled: !preview && !rawText.trim() || busy,
						onClick: read,
						children: [/* @__PURE__ */ jsx(Sparkles, { className: "mr-1 size-4" }), busy ? `Reading… ${progress}%` : "Read items"]
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-xs text-muted-foreground",
						children: "No OpenAI or Gemini key. Images are read in your browser. OCR language files download on first use; handwritten figures are not guaranteed."
					}),
					/* @__PURE__ */ jsx(Label, { children: "Extracted / pasted text — correct before parsing" }),
					/* @__PURE__ */ jsx(Textarea, {
						rows: 8,
						value: rawText,
						onChange: (e) => {
							setRawText(e.target.value);
							setReviewed(false);
						}
					}),
					/* @__PURE__ */ jsx(Button, {
						variant: "outline",
						onClick: async () => {
							const r = parseQuotationText(rawText);
							setVehicleNumber(r.vehicle_number);
							setVehicleType(r.vehicle_type);
							setLines(await Promise.all(r.items.map(async (i) => {
								const m = await bestMatch(i.name);
								return {
									read: i.name,
									hs_code: m?.hs_code ?? "",
									description: m?.description ?? i.name,
									description_source: m?.source ?? "custom",
									quantity: i.quantity,
									unit_price: i.unit_price
								};
							})));
						},
						children: "Parse corrected text"
					})
				]
			}), /* @__PURE__ */ jsxs("div", {
				className: "space-y-4 lg:col-span-2",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "flex flex-wrap gap-3",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "min-w-56",
							children: [/* @__PURE__ */ jsx(Label, { children: "Buyer / Department" }), /* @__PURE__ */ jsxs(Select, {
								value: dept,
								onValueChange: setDept,
								children: [/* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Choose" }) }), /* @__PURE__ */ jsx(SelectContent, { children: (depts.data ?? []).map((d) => /* @__PURE__ */ jsx(SelectItem, {
									value: d.id,
									children: d.name
								}, d.id)) })]
							})]
						}), /* @__PURE__ */ jsxs("div", {
							className: "w-28",
							children: [/* @__PURE__ */ jsx(Label, { children: "Tax %" }), /* @__PURE__ */ jsx(Input, {
								type: "number",
								value: tax,
								onChange: (e) => setTax(Number(e.target.value))
							})]
						})]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "grid gap-3 md:grid-cols-2",
						children: [
							/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, { children: "Vehicle type *" }), /* @__PURE__ */ jsx(Input, {
								value: vehicleType,
								onChange: (e) => setVehicleType(e.target.value)
							})] }),
							/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, { children: "Vehicle number *" }), /* @__PURE__ */ jsx(Input, {
								value: vehicleNumber,
								onChange: (e) => setVehicleNumber(e.target.value)
							})] }),
							/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, { children: "Labor % (applied to each item)" }), /* @__PURE__ */ jsx(Input, {
								type: "number",
								min: 0,
								max: 100,
								value: laborPercent,
								onChange: (e) => setLaborPercent(Number(e.target.value))
							})] })
						]
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-xs text-muted-foreground",
						children: "At least one vehicle field is required."
					}),
					/* @__PURE__ */ jsx("div", {
						className: "panel overflow-x-auto",
						children: /* @__PURE__ */ jsxs(Table, { children: [/* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
							/* @__PURE__ */ jsx(TableHead, { children: "Read from image" }),
							/* @__PURE__ */ jsx(TableHead, {
								className: "min-w-64",
								children: "HS code / description"
							}),
							/* @__PURE__ */ jsx(TableHead, {
								className: "w-24",
								children: "Units"
							}),
							/* @__PURE__ */ jsx(TableHead, {
								className: "w-32",
								children: "Unit price"
							}),
							/* @__PURE__ */ jsx(TableHead, { children: "Sales Tax %" }),
							/* @__PURE__ */ jsx(TableHead, { children: "Sales Tax Value" }),
							/* @__PURE__ */ jsx(TableHead, {})
						] }) }), /* @__PURE__ */ jsxs(TableBody, { children: [lines.map((l, i) => /* @__PURE__ */ jsxs(TableRow, { children: [
							/* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx(Input, {
								value: l.description,
								onChange: (e) => upd(i, { description: e.target.value })
							}) }),
							/* @__PURE__ */ jsxs(TableCell, { children: [/* @__PURE__ */ jsx(HsCodePicker, {
								value: l.hs_code,
								onPick: (p) => upd(i, {
									hs_code: p.hs_code,
									description: p.description,
									description_source: p.source
								})
							}), /* @__PURE__ */ jsx("p", {
								className: "mt-1 text-xs text-muted-foreground",
								children: l.hs_code ? `${l.description} (${l.description_source.toUpperCase()})` : "No match — search to pick"
							})] }),
							/* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx(Input, {
								type: "number",
								value: l.quantity,
								onChange: (e) => upd(i, { quantity: Number(e.target.value) })
							}) }),
							/* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx(Input, {
								type: "number",
								value: l.unit_price,
								onChange: (e) => upd(i, { unit_price: Number(e.target.value) })
							}) }),
							/* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx(Button, {
								size: "icon",
								variant: "ghost",
								onClick: () => setLines(lines.filter((_, j) => j !== i)),
								children: /* @__PURE__ */ jsx(Trash2, { className: "size-4" })
							}) })
						] }, i)), !lines.length && /* @__PURE__ */ jsx(TableRow, { children: /* @__PURE__ */ jsx(TableCell, {
							colSpan: 7,
							className: "py-10 text-center text-muted-foreground",
							children: "Upload an image and click \"Read items\""
						}) })] })] })
					}),
					/* @__PURE__ */ jsxs("label", {
						className: "flex items-center gap-2 text-sm",
						children: [/* @__PURE__ */ jsx("input", {
							type: "checkbox",
							checked: reviewed,
							onChange: (e) => setReviewed(e.target.checked)
						}), "I reviewed vehicle details, descriptions, HS codes, units and prices."]
					}),
					/* @__PURE__ */ jsx(Button, {
						variant: "outline",
						onClick: () => setLines([...lines, {
							read: "",
							hs_code: "",
							description: "",
							description_source: "custom",
							quantity: 1,
							unit_price: 0
						}]),
						children: "Add item manually"
					}),
					/* @__PURE__ */ jsx(Button, {
						disabled: busy || !lines.length || !reviewed,
						onClick: save,
						children: "Create draft quotation"
					})
				]
			})]
		})
	});
}
//#endregion
export { AiQuotationPage as component };
