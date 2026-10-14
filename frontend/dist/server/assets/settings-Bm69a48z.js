import { a as db, n as Button, r as cn } from "./bilal-logo.asset-DRcrRZxD.js";
import { b as useAuth, t as AppShell, v as useTheme } from "./AppShell-Ctpjmt0k.js";
import { t as Input } from "./input-C4NJMa86.js";
import { t as Label } from "./label-7BUlW98B.js";
import { t as Textarea } from "./textarea-D9S4fcOx.js";
import { t as Badge } from "./badge-lzCUdAG9.js";
import * as React from "react";
import { useEffect, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ImagePlus, Moon, Sun } from "lucide-react";
//#region src/components/ui/card.tsx
var Card = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx("div", {
	ref,
	className: cn("rounded-xl border bg-card text-card-foreground shadow", className),
	...props
}));
Card.displayName = "Card";
var CardHeader = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx("div", {
	ref,
	className: cn("flex flex-col space-y-1.5 p-6", className),
	...props
}));
CardHeader.displayName = "CardHeader";
var CardTitle = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx("div", {
	ref,
	className: cn("font-semibold leading-none tracking-tight", className),
	...props
}));
CardTitle.displayName = "CardTitle";
var CardDescription = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx("div", {
	ref,
	className: cn("text-sm text-muted-foreground", className),
	...props
}));
CardDescription.displayName = "CardDescription";
var CardContent = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx("div", {
	ref,
	className: cn("p-6 pt-0", className),
	...props
}));
CardContent.displayName = "CardContent";
var CardFooter = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx("div", {
	ref,
	className: cn("flex items-center p-6 pt-0", className),
	...props
}));
CardFooter.displayName = "CardFooter";
//#endregion
//#region src/routes/_authenticated/settings.tsx?tsr-split=component
/** Resize an uploaded image to a small PNG data URL so it can live in settings. */
async function toDataUrl(file, max) {
	const url = URL.createObjectURL(file);
	const img = new Image();
	await new Promise((res, rej) => {
		img.onload = res;
		img.onerror = rej;
		img.src = url;
	});
	const scale = Math.min(1, max / Math.max(img.width, img.height));
	const c = document.createElement("canvas");
	c.width = Math.round(img.width * scale);
	c.height = Math.round(img.height * scale);
	c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
	URL.revokeObjectURL(url);
	return c.toDataURL("image/png");
}
var FIELDS = [
	{
		key: "system_name",
		label: "System name"
	},
	{
		key: "company_name",
		label: "Company name"
	},
	{
		key: "company_address",
		label: "Company address",
		long: true
	},
	{
		key: "company_phone",
		label: "Phone"
	},
	{
		key: "company_email",
		label: "Email"
	},
	{
		key: "company_website",
		label: "Website"
	},
	{
		key: "company_ntn",
		label: "NTN / Tax number"
	},
	{
		key: "currency",
		label: "Currency"
	},
	{
		key: "default_tax_percent",
		label: "Default tax %"
	},
	{
		key: "invoice_footer",
		label: "Invoice footer",
		long: true
	}
];
function SettingsPage() {
	const qc = useQueryClient();
	const { isSuperAdmin } = useAuth();
	const { theme, setTheme } = useTheme();
	const pick = async (key, file) => {
		if (!file) return;
		if (file.size > 3e6) {
			toast.error("Please choose an image under 3 MB");
			return;
		}
		const v = await toDataUrl(file, key === "logo_url" ? 256 : 64);
		setVals((s) => ({
			...s,
			[key]: v
		}));
		toast.message("Image ready — click Save settings to apply");
	};
	const [vals, setVals] = useState({});
	const [saving, setSaving] = useState(false);
	const q = useQuery({
		queryKey: ["settings"],
		queryFn: async () => (await db.from("system_settings").select("key, value")).data ?? []
	});
	useEffect(() => {
		if (q.data) setVals(Object.fromEntries(q.data.map((r) => [r.key, r.value ?? ""])));
	}, [q.data]);
	const save = async () => {
		setSaving(true);
		const rows = [
			...FIELDS.map((f) => f.key),
			"logo_url",
			"favicon_url"
		].map((key) => ({
			key,
			value: vals[key] ?? ""
		}));
		const { error } = await db.from("system_settings").upsert(rows, { onConflict: "key" });
		setSaving(false);
		if (error) {
			toast.error(error.message);
			return;
		}
		toast.success("Settings saved");
		qc.invalidateQueries({ queryKey: ["settings"] });
		qc.invalidateQueries({ queryKey: ["system-brand"] });
	};
	return /* @__PURE__ */ jsx(AppShell, {
		title: "Settings",
		description: "System name, branding, company details and theme",
		children: /* @__PURE__ */ jsxs("div", {
			className: "grid gap-6 lg:grid-cols-3",
			children: [/* @__PURE__ */ jsxs(Card, {
				className: "lg:col-span-2",
				children: [/* @__PURE__ */ jsxs(CardHeader, { children: [/* @__PURE__ */ jsx(CardTitle, { children: "Company & invoice" }), /* @__PURE__ */ jsx(CardDescription, { children: isSuperAdmin ? "Only the Super Admin can change these." : "View only — Super Admin access required to edit." })] }), /* @__PURE__ */ jsxs(CardContent, {
					className: "grid gap-4 sm:grid-cols-2",
					children: [FIELDS.map((f) => /* @__PURE__ */ jsxs("div", {
						className: f.long ? "sm:col-span-2" : "",
						children: [/* @__PURE__ */ jsx(Label, { children: f.label }), f.long ? /* @__PURE__ */ jsx(Textarea, {
							disabled: !isSuperAdmin,
							value: vals[f.key] ?? "",
							onChange: (e) => setVals({
								...vals,
								[f.key]: e.target.value
							})
						}) : /* @__PURE__ */ jsx(Input, {
							disabled: !isSuperAdmin,
							value: vals[f.key] ?? "",
							onChange: (e) => setVals({
								...vals,
								[f.key]: e.target.value
							})
						})]
					}, f.key)), isSuperAdmin && /* @__PURE__ */ jsx("div", {
						className: "sm:col-span-2",
						children: /* @__PURE__ */ jsx(Button, {
							onClick: save,
							disabled: saving,
							children: saving ? "Saving…" : "Save settings"
						})
					})]
				})]
			}), /* @__PURE__ */ jsxs("div", {
				className: "space-y-6",
				children: [
					/* @__PURE__ */ jsxs(Card, { children: [/* @__PURE__ */ jsxs(CardHeader, { children: [/* @__PURE__ */ jsx(CardTitle, { children: "Branding" }), /* @__PURE__ */ jsx(CardDescription, { children: "System name above, logo and browser icon here. Shown across the portal." })] }), /* @__PURE__ */ jsxs(CardContent, {
						className: "grid grid-cols-2 gap-4",
						children: [["logo_url", "favicon_url"].map((k) => /* @__PURE__ */ jsxs("label", {
							className: cn("flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-border p-4 text-center transition-colors hover:border-primary/50 hover:bg-accent/30", !isSuperAdmin && "pointer-events-none opacity-60"),
							children: [
								vals[k] ? /* @__PURE__ */ jsx("img", {
									src: vals[k],
									alt: "",
									className: "size-14 rounded-lg object-contain"
								}) : /* @__PURE__ */ jsx("span", {
									className: "flex size-14 items-center justify-center rounded-lg bg-muted text-muted-foreground",
									children: /* @__PURE__ */ jsx(ImagePlus, { className: "size-6" })
								}),
								/* @__PURE__ */ jsx("span", {
									className: "text-xs font-medium",
									children: k === "logo_url" ? "Logo" : "Favicon"
								}),
								/* @__PURE__ */ jsx("span", {
									className: "text-[11px] text-muted-foreground",
									children: vals[k] ? "Click to replace" : "Click to upload"
								}),
								/* @__PURE__ */ jsx("input", {
									type: "file",
									accept: "image/*",
									className: "hidden",
									"aria-label": k === "logo_url" ? "Upload logo" : "Upload favicon",
									onChange: (e) => void pick(k, e.target.files?.[0])
								})
							]
						}, k)), isSuperAdmin && (vals["logo_url"] || vals["favicon_url"]) ? /* @__PURE__ */ jsx(Button, {
							variant: "ghost",
							size: "sm",
							className: "col-span-2",
							onClick: () => setVals((s) => ({
								...s,
								logo_url: "",
								favicon_url: ""
							})),
							children: "Remove images"
						}) : null]
					})] }),
					/* @__PURE__ */ jsxs(Card, { children: [/* @__PURE__ */ jsxs(CardHeader, { children: [/* @__PURE__ */ jsx(CardTitle, { children: "Theme" }), /* @__PURE__ */ jsx(CardDescription, { children: "Your choice is remembered on this device." })] }), /* @__PURE__ */ jsx(CardContent, {
						className: "grid grid-cols-2 gap-3",
						children: ["light", "dark"].map((t) => /* @__PURE__ */ jsxs("button", {
							onClick: () => setTheme(t),
							className: cn("flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium capitalize transition-all", theme === t ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"),
							children: [
								t === "light" ? /* @__PURE__ */ jsx(Sun, { className: "size-5" }) : /* @__PURE__ */ jsx(Moon, { className: "size-5" }),
								t,
								" mode",
								t === "light" ? " (default)" : ""
							]
						}, t))
					})] }),
					/* @__PURE__ */ jsxs(Card, { children: [/* @__PURE__ */ jsxs(CardHeader, { children: [/* @__PURE__ */ jsxs(CardTitle, {
						className: "flex items-center gap-2",
						children: ["FBR Digital Invoicing ", /* @__PURE__ */ jsx(Badge, {
							variant: "outline",
							children: "Coming soon"
						})]
					}), /* @__PURE__ */ jsx(CardDescription, { children: "Invoices already store the fields needed for FBR submission, so this can be switched on later without rebuilding." })] }), /* @__PURE__ */ jsxs(CardContent, {
						className: "space-y-3 opacity-60",
						children: [
							/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, { children: "Environment" }), /* @__PURE__ */ jsx(Input, {
								disabled: true,
								placeholder: "Sandbox / Production"
							})] }),
							/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, { children: "POS ID" }), /* @__PURE__ */ jsx(Input, { disabled: true })] }),
							/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, { children: "API token" }), /* @__PURE__ */ jsx(Input, {
								disabled: true,
								type: "password"
							})] }),
							/* @__PURE__ */ jsx(Button, {
								disabled: true,
								className: "w-full",
								children: "Test connection"
							})
						]
					})] })
				]
			})]
		})
	});
}
//#endregion
export { SettingsPage as component };
