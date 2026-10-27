import { i as api, n as Button, r as cn } from "./bilal-logo.asset-DVM5nCcq.js";
import { d as DialogContent, f as DialogDescription, h as DialogTitle, m as DialogHeader, t as AppShell, u as Dialog } from "./AppShell-CbTTFVU-.js";
import { t as Route } from "./fbr-CkfbN2U5.js";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-GN_Kexq5.js";
import { a as TableHeader, i as TableHead, n as TableBody, o as TableRow, r as TableCell, t as Table } from "./table-ITrsg8wD.js";
import { o as uniqueInvoiceRows } from "./document-calculations-CO6XfdJx.js";
import { t as Input } from "./input-BdVko9wQ.js";
import { t as Label } from "./label-DwaA--ly.js";
import { o as TableState } from "./kit-4pQ21Dd3.js";
import { t as Checkbox } from "./checkbox-C4v7NccO.js";
import { n as validTaxId, t as decodeFbrJson } from "./tax-id-Db-hC7Im.js";
import { t as Badge } from "./badge-hwXf-j3D.js";
import { a as CardTitle, i as CardHeader, n as CardContent, r as CardDescription, t as Card } from "./card-CbByMzFt.js";
import { i as TabsTrigger, n as TabsContent, r as TabsList, t as Tabs } from "./tabs-D8havF6Y.js";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Eye, Lightbulb, Pencil, Plug, Plus, RefreshCw, Send, ShieldCheck, Trash2, Wand2 } from "lucide-react";
//#region src/components/data/SandboxTest.tsx
var blankItem = () => ({
	hsCode: "",
	productDescription: "",
	rate: "",
	uoM: "",
	quantity: 1,
	totalValues: 0,
	valueSalesExcludingST: 0,
	fixedNotifiedValueOrRetailPrice: 0,
	salesTaxApplicable: 0,
	salesTaxWithheldAtSource: 0,
	extraTax: 0,
	furtherTax: 0,
	fedPayable: 0,
	discount: 0,
	sroScheduleNo: "",
	saleType: "",
	sroItemSerialNo: ""
});
var numeric = /* @__PURE__ */ new Set([
	"quantity",
	"totalValues",
	"valueSalesExcludingST",
	"fixedNotifiedValueOrRetailPrice",
	"salesTaxApplicable",
	"salesTaxWithheldAtSource",
	"extraTax",
	"furtherTax",
	"fedPayable",
	"discount"
]);
var fields = [
	["hsCode", "HS code"],
	["productDescription", "Product description"],
	["rate", "Rate (FBR value)"],
	["uoM", "UOM"],
	["quantity", "Quantity"],
	["valueSalesExcludingST", "Value excluding sales tax"],
	["salesTaxApplicable", "Sales tax"],
	["totalValues", "Total value"],
	["fixedNotifiedValueOrRetailPrice", "Fixed / retail value"],
	["salesTaxWithheldAtSource", "Sales tax withheld"],
	["extraTax", "Extra tax"],
	["furtherTax", "Further tax"],
	["fedPayable", "FED payable"],
	["discount", "Discount"],
	["sroScheduleNo", "SRO schedule"],
	["sroItemSerialNo", "SRO item serial"],
	["saleType", "Sale type"]
];
function SandboxTest({ scenarios, settings, canValidate }) {
	const [form, setForm] = useState({
		scenarioId: settings["fbr_default_scenario"] || "SN001",
		invoiceType: "Sale Invoice",
		invoiceDate: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
		invoiceRefNo: "",
		buyerNTNCNIC: "",
		buyerBusinessName: "",
		buyerProvince: "",
		buyerAddress: "",
		buyerRegistrationType: "Registered"
	});
	const [items, setItems] = useState([{
		...blankItem(),
		saleType: scenarios[form.scenarioId]?.[1] || ""
	}]);
	const [result, setResult] = useState(null);
	const validate = useMutation({
		mutationFn: () => api("/fbr/sandbox/validate", {
			...form,
			items
		}),
		onSuccess: (r) => setResult(r),
		onError: (e) => toast.error(e.message)
	});
	const edit = (key, value) => {
		setResult(null);
		setForm({
			...form,
			[key]: value
		});
	};
	return /* @__PURE__ */ jsxs("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "border-b border-border pb-3",
				children: [/* @__PURE__ */ jsx("h2", {
					className: "text-lg font-semibold",
					children: "Sandbox scenario test"
				}), /* @__PURE__ */ jsxs("p", {
					className: "text-sm text-muted-foreground",
					children: [
						"Seller: ",
						settings["fbr_seller_name"] || settings["company_name"] || "Not set",
						" · ",
						settings["fbr_seller_ntn"] || settings["fbr_seller_cnic"] || "Tax identity missing"
					]
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "sm:col-span-2",
						children: [/* @__PURE__ */ jsx(Label, {
							htmlFor: "test-scenario",
							children: "Scenario"
						}), /* @__PURE__ */ jsxs(Select, {
							value: form.scenarioId,
							onValueChange: (v) => {
								edit("scenarioId", v);
								setItems(items.map((it) => ({
									...it,
									saleType: scenarios[v]?.[1] || ""
								})));
							},
							children: [/* @__PURE__ */ jsx(SelectTrigger, {
								id: "test-scenario",
								className: "h-auto min-h-10 whitespace-normal text-left",
								children: /* @__PURE__ */ jsx(SelectValue, {})
							}), /* @__PURE__ */ jsx(SelectContent, { children: Object.entries(scenarios).map(([id, [name, sale]]) => /* @__PURE__ */ jsxs(SelectItem, {
								value: id,
								children: [
									id,
									" — ",
									name,
									" (",
									sale,
									")"
								]
							}, id)) })]
						})]
					}),
					/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, {
						htmlFor: "test-type",
						children: "Invoice type"
					}), /* @__PURE__ */ jsxs(Select, {
						value: form.invoiceType,
						onValueChange: (v) => edit("invoiceType", v),
						children: [/* @__PURE__ */ jsx(SelectTrigger, {
							id: "test-type",
							children: /* @__PURE__ */ jsx(SelectValue, {})
						}), /* @__PURE__ */ jsxs(SelectContent, { children: [/* @__PURE__ */ jsx(SelectItem, {
							value: "Sale Invoice",
							children: "Sale Invoice"
						}), /* @__PURE__ */ jsx(SelectItem, {
							value: "Debit Note",
							children: "Debit Note"
						})] })]
					})] }),
					[
						["invoiceDate", "Invoice date"],
						["invoiceRefNo", "Invoice reference"],
						["buyerNTNCNIC", "Buyer NTN / CNIC"],
						["buyerBusinessName", "Buyer name"],
						["buyerProvince", "Buyer province"],
						["buyerAddress", "Buyer address"]
					].map(([key, label]) => /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, {
						htmlFor: `test-${key}`,
						children: label
					}), /* @__PURE__ */ jsx(Input, {
						id: `test-${key}`,
						type: key === "invoiceDate" ? "date" : "text",
						value: form[key],
						onChange: (e) => edit(key, e.target.value)
					})] }, key)),
					/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, {
						htmlFor: "test-registration",
						children: "Buyer registration"
					}), /* @__PURE__ */ jsxs(Select, {
						value: form.buyerRegistrationType,
						onValueChange: (v) => edit("buyerRegistrationType", v),
						children: [/* @__PURE__ */ jsx(SelectTrigger, {
							id: "test-registration",
							children: /* @__PURE__ */ jsx(SelectValue, {})
						}), /* @__PURE__ */ jsxs(SelectContent, { children: [/* @__PURE__ */ jsx(SelectItem, {
							value: "Registered",
							children: "Registered"
						}), /* @__PURE__ */ jsx(SelectItem, {
							value: "Unregistered",
							children: "Unregistered"
						})] })]
					})] })
				]
			}),
			items.map((item, i) => /* @__PURE__ */ jsxs("section", {
				className: "border-t border-border pt-4",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "mb-3 flex items-center justify-between",
					children: [/* @__PURE__ */ jsxs("h3", {
						className: "font-semibold",
						children: ["Item ", i + 1]
					}), /* @__PURE__ */ jsx(Button, {
						"aria-label": `Remove item ${i + 1}`,
						variant: "ghost",
						size: "icon",
						disabled: items.length === 1,
						onClick: () => {
							setItems(items.filter((_, j) => j !== i));
							setResult(null);
						},
						children: /* @__PURE__ */ jsx(Trash2, { className: "size-4" })
					})]
				}), /* @__PURE__ */ jsx("div", {
					className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-4",
					children: fields.map(([key, label]) => /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, {
						htmlFor: `item-${i}-${key}`,
						children: label
					}), /* @__PURE__ */ jsx(Input, {
						id: `item-${i}-${key}`,
						type: numeric.has(key) ? "number" : "text",
						step: "any",
						min: numeric.has(key) ? 0 : void 0,
						value: item[key],
						onChange: (e) => {
							setItems(items.map((it, j) => j === i ? {
								...it,
								[key]: numeric.has(key) ? Number(e.target.value) : e.target.value
							} : it));
							setResult(null);
						}
					})] }, key))
				})]
			}, i)),
			/* @__PURE__ */ jsxs("div", {
				className: "flex flex-wrap gap-2",
				children: [/* @__PURE__ */ jsxs(Button, {
					variant: "outline",
					onClick: () => {
						setItems([...items, {
							...blankItem(),
							saleType: scenarios[form.scenarioId]?.[1] || ""
						}]);
						setResult(null);
					},
					children: [/* @__PURE__ */ jsx(Plus, { className: "size-4" }), "Add item"]
				}), /* @__PURE__ */ jsxs(Button, {
					disabled: !canValidate || validate.isPending,
					onClick: () => validate.mutate(),
					children: [/* @__PURE__ */ jsx(CheckCircle2, { className: "size-4" }), validate.isPending ? "Validating…" : "Validate Sandbox form"]
				})]
			}),
			result && /* @__PURE__ */ jsxs("section", {
				"aria-label": "Sandbox validation result",
				className: "border-t border-border pt-4",
				children: [
					/* @__PURE__ */ jsx("h3", {
						className: "font-semibold",
						children: result.outcome === "valid" ? "Valid — FBR validation accepted" : result.outcome
					}),
					result.errors.map((e, i) => /* @__PURE__ */ jsxs("div", {
						className: "mt-2 text-sm",
						children: [/* @__PURE__ */ jsx("p", {
							className: "text-destructive",
							children: e.problem
						}), /* @__PURE__ */ jsx("p", { children: e.fix })]
					}, i)),
					/* @__PURE__ */ jsxs("details", {
						className: "mt-3",
						children: [/* @__PURE__ */ jsx("summary", { children: "Request and FBR response" }), /* @__PURE__ */ jsx("pre", {
							className: "max-h-80 overflow-auto bg-muted p-3 text-xs",
							children: JSON.stringify({
								request: result.payload,
								response: result.response
							}, null, 2)
						})]
					})
				]
			})
		]
	});
}
//#endregion
//#region src/routes/_authenticated/fbr.tsx?tsr-split=component
var STATUS = {
	not_validated: {
		label: "Not validated",
		tone: "bg-muted text-muted-foreground"
	},
	validation_failed: {
		label: "Validation failed",
		tone: "bg-destructive/15 text-destructive"
	},
	validated: {
		label: "Ready to send",
		tone: "bg-primary/15 text-primary"
	},
	submitting: {
		label: "Sending…",
		tone: "bg-accent text-accent-foreground"
	},
	sent: {
		label: "Sent to FBR",
		tone: "bg-success/15 text-success"
	},
	submission_failed: {
		label: "Send failed",
		tone: "bg-destructive/15 text-destructive"
	},
	pending_confirmation: {
		label: "Awaiting confirmation",
		tone: "bg-warning/20 text-warning-foreground"
	}
};
var FILTERS = [
	["remaining", "Remaining / Not sent"],
	["not_validated", "Not validated"],
	["validation_failed", "Validation failed"],
	["validated", "Ready to send"],
	["sent", "Sent to FBR"],
	["failed", "Failed / Awaiting confirmation"],
	["all", "All"]
];
var money = (n) => Number(n).toLocaleString(void 0, {
	minimumFractionDigits: 2,
	maximumFractionDigits: 2
});
var OUTCOME = {
	valid: "Valid",
	invalid: "Rejected by FBR",
	precheck_failed: "Needs correction",
	already_sent: "Already sent",
	sent: "Sent",
	submission_failed: "Not sent",
	pending_confirmation: "Awaiting confirmation",
	unauthorized: "Token rejected",
	unreachable: "FBR not reachable",
	no_token: "No token",
	not_validated: "Validate first",
	changed: "Changed — validate again",
	needs_confirmation: "Needs confirmation",
	server_error: "FBR server error",
	unknown: "Unexpected reply"
};
function FbrPage() {
	const { tab } = Route.useSearch();
	const navigate = useNavigate();
	const cfg = useQuery({
		queryKey: ["fbr-config"],
		queryFn: () => api("/fbr/config")
	});
	const [env, setEnv] = useState("sandbox");
	useEffect(() => {
		if (cfg.data) setEnv(cfg.data.settings["fbr_active_environment"] || "sandbox");
	}, [cfg.data]);
	return /* @__PURE__ */ jsxs(AppShell, {
		title: "FBR Digital Invoicing",
		description: "Validate, then submit Sales Tax Invoices to FBR IRIS",
		actions: /* @__PURE__ */ jsxs("div", {
			className: "flex items-center gap-2",
			children: [/* @__PURE__ */ jsx("span", {
				className: "text-xs text-muted-foreground",
				children: "Environment"
			}), /* @__PURE__ */ jsxs(Select, {
				value: env,
				onValueChange: (v) => setEnv(v),
				children: [/* @__PURE__ */ jsx(SelectTrigger, {
					className: "h-8 w-36",
					children: /* @__PURE__ */ jsx(SelectValue, {})
				}), /* @__PURE__ */ jsxs(SelectContent, { children: [/* @__PURE__ */ jsx(SelectItem, {
					value: "sandbox",
					children: "Sandbox (test)"
				}), /* @__PURE__ */ jsx(SelectItem, {
					value: "production",
					children: "Production"
				})] })]
			})]
		}),
		children: [/* @__PURE__ */ jsxs("div", {
			className: cn("mb-4 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm", env === "production" ? "border-destructive/40 bg-destructive/10 text-destructive" : "border-primary/30 bg-primary/10 text-primary"),
			children: [env === "production" ? /* @__PURE__ */ jsx(AlertTriangle, { className: "size-4" }) : /* @__PURE__ */ jsx(ShieldCheck, { className: "size-4" }), env === "production" ? "PRODUCTION — invoices sent here are real and final." : "SANDBOX — test mode. Nothing here is a real FBR submission."]
		}), /* @__PURE__ */ jsxs(Tabs, {
			value: tab ?? "invoices",
			onValueChange: (t) => void navigate({
				to: "/fbr",
				search: { tab: t }
			}),
			children: [
				/* @__PURE__ */ jsxs(TabsList, { children: [
					/* @__PURE__ */ jsx(TabsTrigger, {
						value: "invoices",
						children: "Invoices"
					}),
					/* @__PURE__ */ jsx(TabsTrigger, {
						value: "history",
						children: "History"
					}),
					/* @__PURE__ */ jsx(TabsTrigger, {
						value: "settings",
						children: "Settings"
					}),
					/* @__PURE__ */ jsx(TabsTrigger, {
						value: "sandbox",
						children: "Sandbox test"
					})
				] }),
				/* @__PURE__ */ jsx(TabsContent, {
					value: "invoices",
					children: cfg.data && /* @__PURE__ */ jsx(InvoicesTab, {
						env,
						cfg: cfg.data
					})
				}),
				/* @__PURE__ */ jsx(TabsContent, {
					value: "sandbox",
					children: cfg.data && /* @__PURE__ */ jsx(SandboxTest, {
						scenarios: cfg.data.scenarios,
						settings: cfg.data.settings,
						canValidate: !!cfg.data.can["validate"]
					})
				}),
				/* @__PURE__ */ jsx(TabsContent, {
					value: "history",
					children: /* @__PURE__ */ jsx(HistoryTab, { env })
				}),
				/* @__PURE__ */ jsx(TabsContent, {
					value: "settings",
					children: cfg.data ? /* @__PURE__ */ jsx(SettingsTab, { cfg: cfg.data }) : /* @__PURE__ */ jsx("p", {
						className: "p-4 text-sm text-muted-foreground",
						children: cfg.error ? cfg.error.message : "Loading…"
					})
				})
			]
		})]
	});
}
function InvoicesTab({ env, cfg }) {
	const qc = useQueryClient();
	const [dept, setDept] = useState("");
	const [from, setFrom] = useState("");
	const [to, setTo] = useState("");
	const [status, setStatus] = useState("remaining");
	const [search, setSearch] = useState("");
	const [scenario, setScenario] = useState(cfg.settings["fbr_default_scenario"] || "SN001");
	const [sel, setSel] = useState(/* @__PURE__ */ new Set());
	const [results, setResults] = useState(null);
	const [preview, setPreview] = useState(null);
	const depts = useQuery({
		queryKey: ["fbr-department-options"],
		queryFn: async () => (await api("/rest/departments", {
			op: "select",
			select: "id,name",
			include_deleted: true,
			order: [{
				col: "name",
				asc: true
			}]
		})).data ?? []
	});
	const params = new URLSearchParams({
		env,
		department_id: dept,
		status,
		...from ? { from } : {},
		...to ? { to } : {},
		...search.trim() ? { search: search.trim() } : {}
	});
	const list = useQuery({
		queryKey: ["fbr-invoices", params.toString()],
		enabled: !!dept,
		queryFn: () => api(`/fbr/invoices?${params}`)
	});
	useEffect(() => setSel(/* @__PURE__ */ new Set()), [
		env,
		dept,
		status,
		from,
		to
	]);
	const rows = uniqueInvoiceRows(list.data ?? []);
	const run = useMutation({
		mutationFn: async ({ action, retry, ids }) => {
			const input = {
				env,
				ids: ids ?? [...sel],
				scenario: env === "sandbox" ? scenario : void 0,
				confirm_retry: retry
			};
			if (action === "validate" || retry) return (await api(`/fbr/${action}`, input)).results;
			const checked = (await api("/fbr/validate", input)).results;
			const ready = checked.filter((r) => r.outcome === "valid").map((r) => r.id);
			const failures = checked.filter((r) => r.outcome !== "valid");
			if (!ready.length) return failures;
			return [...failures, ...(await api("/fbr/submit", {
				...input,
				ids: ready
			})).results];
		},
		onSuccess: (r) => {
			setResults(r);
			qc.invalidateQueries({ queryKey: ["fbr-invoices"] });
		},
		onError: (e) => toast.error(e.message)
	});
	const fix = useMutation({
		mutationFn: async ({ id, f }) => api("/fbr/autofix", {
			env,
			id,
			fix: f
		}),
		onSuccess: (_d, v) => {
			qc.invalidateQueries({ queryKey: ["fbr-invoices"] });
			if (v.revalidate) run.mutate({
				action: "validate",
				ids: [v.id]
			});
			else toast.success("Change applied — validate again");
		},
		onError: (e) => toast.error(e.message)
	});
	const connected = !!cfg.environments.find((e) => e.environment === env)?.connected;
	const selectable = rows.filter((r) => r.fbr_status !== "sent");
	const confirmSend = () => {
		const msg = env === "production" ? `Send ${sel.size} invoice(s) to FBR PRODUCTION? This is a real, final tax submission.` : `Send ${sel.size} invoice(s) to the FBR Sandbox?`;
		if (window.confirm(msg)) run.mutate({ action: "submit" });
	};
	return /* @__PURE__ */ jsxs("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "panel grid gap-3 p-4 md:grid-cols-6",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "space-y-1.5 md:col-span-2",
						children: [/* @__PURE__ */ jsx(Label, { children: "Department / Buyer *" }), /* @__PURE__ */ jsxs(Select, {
							value: dept,
							onValueChange: setDept,
							children: [/* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Select a department" }) }), /* @__PURE__ */ jsx(SelectContent, { children: (depts.data ?? []).map((d) => /* @__PURE__ */ jsx(SelectItem, {
								value: d.id,
								children: d.name
							}, d.id)) })]
						})]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ jsx(Label, { children: "From" }), /* @__PURE__ */ jsx(Input, {
							type: "date",
							value: from,
							onChange: (e) => setFrom(e.target.value)
						})]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ jsx(Label, { children: "To" }), /* @__PURE__ */ jsx(Input, {
							type: "date",
							value: to,
							onChange: (e) => setTo(e.target.value)
						})]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ jsx(Label, { children: "FBR status" }), /* @__PURE__ */ jsxs(Select, {
							value: status,
							onValueChange: setStatus,
							children: [/* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }), /* @__PURE__ */ jsx(SelectContent, { children: FILTERS.map(([v, l]) => /* @__PURE__ */ jsx(SelectItem, {
								value: v,
								children: l
							}, v)) })]
						})]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ jsx(Label, { children: "Invoice no." }), /* @__PURE__ */ jsx(Input, {
							value: search,
							onChange: (e) => setSearch(e.target.value),
							placeholder: "Search…"
						})]
					})
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "panel overflow-hidden",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex flex-wrap items-center gap-2 border-b border-border p-3",
					children: [
						/* @__PURE__ */ jsxs("span", {
							className: "text-sm font-medium",
							children: [sel.size, " selected"]
						}),
						env === "sandbox" && /* @__PURE__ */ jsxs(Select, {
							value: scenario,
							onValueChange: setScenario,
							children: [/* @__PURE__ */ jsx(SelectTrigger, {
								className: "h-8 w-72",
								children: /* @__PURE__ */ jsx(SelectValue, {})
							}), /* @__PURE__ */ jsx(SelectContent, { children: Object.entries(cfg.scenarios).map(([k, [d]]) => /* @__PURE__ */ jsxs(SelectItem, {
								value: k,
								children: [
									k,
									" — ",
									d
								]
							}, k)) })]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "ml-auto flex gap-2",
							children: [
								/* @__PURE__ */ jsxs(Button, {
									size: "sm",
									variant: "ghost",
									onClick: () => void list.refetch(),
									disabled: !dept,
									children: [/* @__PURE__ */ jsx(RefreshCw, { className: "size-4" }), "Refresh"]
								}),
								cfg.can["validate"] && /* @__PURE__ */ jsxs(Button, {
									size: "sm",
									variant: "outline",
									disabled: !connected || !sel.size || run.isPending,
									onClick: () => run.mutate({ action: "validate" }),
									children: [/* @__PURE__ */ jsx(CheckCircle2, { className: "size-4" }), "Validate selected"]
								}),
								cfg.can["submit"] && /* @__PURE__ */ jsxs(Button, {
									size: "sm",
									variant: env === "production" ? "destructive" : "default",
									disabled: !connected || !sel.size || run.isPending,
									onClick: confirmSend,
									children: [/* @__PURE__ */ jsx(Send, { className: "size-4" }), "Send to FBR"]
								})
							]
						})
					]
				}), /* @__PURE__ */ jsx("div", {
					className: "overflow-x-auto",
					children: /* @__PURE__ */ jsxs(Table, { children: [/* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
						/* @__PURE__ */ jsx(TableHead, {
							className: "w-8",
							children: /* @__PURE__ */ jsx(Checkbox, {
								"aria-label": "Select all",
								checked: selectable.length > 0 && selectable.every((r) => sel.has(r.id)),
								onCheckedChange: (v) => setSel(v ? new Set(selectable.map((r) => r.id)) : /* @__PURE__ */ new Set())
							})
						}),
						/* @__PURE__ */ jsx(TableHead, { children: "Sales tax no." }),
						/* @__PURE__ */ jsx(TableHead, { children: "Invoice" }),
						/* @__PURE__ */ jsx(TableHead, { children: "Buyer NTN / province" }),
						/* @__PURE__ */ jsx(TableHead, { children: "Date" }),
						/* @__PURE__ */ jsx(TableHead, {
							className: "text-right",
							children: "Sales tax"
						}),
						/* @__PURE__ */ jsx(TableHead, {
							className: "text-right",
							children: "Total"
						}),
						/* @__PURE__ */ jsx(TableHead, { children: "FBR status" }),
						/* @__PURE__ */ jsx(TableHead, { children: "FBR invoice no." }),
						/* @__PURE__ */ jsx(TableHead, {})
					] }) }), /* @__PURE__ */ jsxs(TableBody, { children: [!dept ? /* @__PURE__ */ jsx(TableRow, { children: /* @__PURE__ */ jsx(TableCell, {
						colSpan: 10,
						className: "py-10 text-center text-sm text-muted-foreground",
						children: "Select a department to see its invoices."
					}) }) : /* @__PURE__ */ jsx(TableState, {
						cols: 10,
						loading: list.isLoading,
						error: list.error ? list.error.message : null,
						empty: !list.isLoading && rows.length === 0,
						title: "No invoices match",
						hint: "Change the date range or status filter."
					}), rows.map((r) => {
						const st = STATUS[r.fbr_status] ?? {
							label: "Not validated",
							tone: "bg-muted text-muted-foreground"
						};
						return /* @__PURE__ */ jsxs(TableRow, {
							className: cn(sel.has(r.id) && "bg-accent/40"),
							children: [
								/* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx(Checkbox, {
									"aria-label": `Select ${r.invoice_number}`,
									disabled: r.fbr_status === "sent",
									checked: sel.has(r.id),
									onCheckedChange: (v) => setSel((s) => {
										const n = new Set(s);
										if (v) n.add(r.id);
										else n.delete(r.id);
										return n;
									})
								}) }),
								/* @__PURE__ */ jsx(TableCell, {
									className: "font-mono",
									children: r.sales_tax_number
								}),
								/* @__PURE__ */ jsx(TableCell, {
									className: "font-mono",
									children: r.invoice_number
								}),
								/* @__PURE__ */ jsxs(TableCell, { children: [/* @__PURE__ */ jsx("div", { children: r.buyer_ntn || "Missing NTN / CNIC" }), /* @__PURE__ */ jsx("div", {
									className: "text-xs text-muted-foreground",
									children: r.buyer_province || "Province missing"
								})] }),
								/* @__PURE__ */ jsx(TableCell, {
									className: "whitespace-nowrap",
									children: r.invoice_date
								}),
								/* @__PURE__ */ jsx(TableCell, {
									className: "text-right tabular-nums",
									children: money(r.tax_total)
								}),
								/* @__PURE__ */ jsx(TableCell, {
									className: "text-right tabular-nums",
									children: money(r.grand_total)
								}),
								/* @__PURE__ */ jsxs(TableCell, {
									className: "whitespace-nowrap",
									children: [/* @__PURE__ */ jsx("span", {
										className: cn("rounded-full px-2 py-0.5 text-xs font-medium", st.tone),
										children: st.label
									}), r.last_errors?.length ? /* @__PURE__ */ jsxs("span", {
										className: "ml-1 text-xs text-muted-foreground",
										children: [
											"(",
											r.last_errors.length,
											")"
										]
									}) : null]
								}),
								/* @__PURE__ */ jsx(TableCell, {
									className: "font-mono text-xs",
									children: r.fbr_invoice_number ?? "—"
								}),
								/* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx(Button, {
									size: "icon",
									variant: "ghost",
									"aria-label": "Check invoice",
									onClick: () => setPreview(r.id),
									children: /* @__PURE__ */ jsx(Eye, { className: "size-4" })
								}) })
							]
						}, r.id);
					})] })] })
				})]
			}),
			results && /* @__PURE__ */ jsx(ResultsDialog, {
				results,
				onClose: () => setResults(null),
				onFix: (id, f, revalidate) => fix.mutate({
					id,
					f,
					revalidate
				}),
				onRevalidate: (id) => run.mutate({
					action: "validate",
					ids: [id]
				}),
				busy: run.isPending || fix.isPending,
				onRetry: () => {
					if (window.confirm("Only retry if FBR's portal shows NO record of these invoices, otherwise they may be duplicated. Retry now?")) run.mutate({
						action: "submit",
						retry: true
					});
				}
			}),
			preview && /* @__PURE__ */ jsx(PreviewDialog, {
				id: preview,
				env,
				scenario,
				onClose: () => setPreview(null)
			})
		]
	});
}
function IssueList({ issues, onFix }) {
	return /* @__PURE__ */ jsx("ul", {
		className: "space-y-2",
		children: issues.map((e, i) => /* @__PURE__ */ jsxs("li", {
			className: cn("rounded-lg border p-3 text-sm", e.warning ? "border-warning/40 bg-warning/10" : "border-destructive/30 bg-destructive/5"),
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "flex flex-wrap items-center gap-2",
					children: [
						/* @__PURE__ */ jsx("span", {
							className: "font-medium",
							children: e.problem
						}),
						e.code && /* @__PURE__ */ jsxs(Badge, {
							variant: "outline",
							children: ["FBR ", e.code]
						}),
						e.warning && /* @__PURE__ */ jsx(Badge, {
							variant: "outline",
							children: "Note"
						})
					]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "mt-1 text-xs text-muted-foreground",
					children: [
						"Where: ",
						e.where,
						e.field ? ` → ${e.field}` : ""
					]
				}),
				e.fix && /* @__PURE__ */ jsxs("div", {
					className: "mt-1 text-xs",
					children: [
						/* @__PURE__ */ jsx("span", {
							className: "font-medium",
							children: "How to fix:"
						}),
						" ",
						e.fix
					]
				}),
				e.fbr_guidance && /* @__PURE__ */ jsxs("div", {
					className: "mt-1 text-xs text-muted-foreground",
					children: ["FBR guidance: ", e.fbr_guidance]
				}),
				e.auto && onFix && /* @__PURE__ */ jsxs(Button, {
					size: "sm",
					variant: "outline",
					className: "mt-2",
					onClick: () => e.auto && onFix(e.auto),
					children: [/* @__PURE__ */ jsx(Wand2, { className: "size-3.5" }), "Fix automatically"]
				}),
				e.manual && /* @__PURE__ */ jsx("div", {
					className: "mt-1 text-xs font-medium text-destructive",
					children: "Manual action required"
				}),
				!!e.suggestions?.length && /* @__PURE__ */ jsxs("div", {
					className: "mt-2 space-y-2 rounded-md border border-primary/30 bg-primary/5 p-2",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-1 text-xs font-semibold text-primary",
						children: [/* @__PURE__ */ jsx(Lightbulb, { className: "size-3.5" }), "System suggestion"]
					}), e.suggestions.map((sg, k) => /* @__PURE__ */ jsxs("div", {
						className: "text-xs",
						children: [
							/* @__PURE__ */ jsxs("div", { children: [
								/* @__PURE__ */ jsx("span", {
									className: "font-medium",
									children: sg.label
								}),
								" → ",
								sg.field,
								": ",
								/* @__PURE__ */ jsx("span", {
									className: "line-through text-muted-foreground",
									children: sg.current || "empty"
								}),
								" → ",
								/* @__PURE__ */ jsx("span", {
									className: "font-medium",
									children: sg.value
								})
							] }),
							/* @__PURE__ */ jsxs("div", {
								className: "text-muted-foreground",
								children: [sg.reason, Object.keys(sg.patch).filter((x) => x !== "type_of_goods").length ? ` Also sets: ${Object.entries(sg.patch).filter(([x]) => x !== "type_of_goods").map(([x, v]) => `${x.replace(/_/g, " ")} = ${v || "empty"}`).join(", ")}.` : ""]
							}),
							onFix && /* @__PURE__ */ jsxs("div", {
								className: "mt-1 flex gap-2",
								children: [/* @__PURE__ */ jsxs(Button, {
									size: "sm",
									variant: "outline",
									onClick: () => onFix({
										type: "item",
										line: sg.line,
										patch: sg.patch
									}),
									children: [/* @__PURE__ */ jsx(Wand2, { className: "size-3.5" }), "Apply"]
								}), /* @__PURE__ */ jsxs(Button, {
									size: "sm",
									onClick: () => onFix({
										type: "item",
										line: sg.line,
										patch: sg.patch
									}, true),
									children: [/* @__PURE__ */ jsx(Wand2, { className: "size-3.5" }), "Apply & validate again"]
								})]
							})
						]
					}, k))]
				}),
				e.no_suggestion && /* @__PURE__ */ jsx("div", {
					className: "mt-2 text-xs text-muted-foreground",
					children: e.no_suggestion
				})
			]
		}, i))
	});
}
function ResultsDialog({ results, onClose, onFix, onRetry, onRevalidate, busy }) {
	const good = results.filter((r) => ["valid", "sent"].includes(r.outcome)).length;
	return /* @__PURE__ */ jsx(Dialog, {
		open: true,
		onOpenChange: (o) => !o && onClose(),
		children: /* @__PURE__ */ jsxs(DialogContent, {
			className: "max-h-[90vh] max-w-3xl overflow-auto",
			children: [/* @__PURE__ */ jsxs(DialogHeader, { children: [/* @__PURE__ */ jsx(DialogTitle, { children: "Results" }), /* @__PURE__ */ jsxs(DialogDescription, { children: [
				good,
				" of ",
				results.length,
				" succeeded."
			] })] }), /* @__PURE__ */ jsxs("div", {
				className: "space-y-4",
				children: [results.map((r) => /* @__PURE__ */ jsxs("div", {
					className: "rounded-xl border border-border p-3",
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "mb-2 flex items-center justify-between",
							children: [/* @__PURE__ */ jsx("span", {
								className: "font-mono font-medium",
								children: r.invoice_number
							}), /* @__PURE__ */ jsx(Badge, {
								variant: ["valid", "sent"].includes(r.outcome) ? "default" : "outline",
								children: OUTCOME[r.outcome] ?? r.outcome
							})]
						}),
						r.fbr_invoice_number && /* @__PURE__ */ jsxs("p", {
							className: "mb-2 text-sm",
							children: ["FBR invoice no: ", /* @__PURE__ */ jsx("span", {
								className: "font-mono",
								children: r.fbr_invoice_number
							})]
						}),
						r.automatic_sandbox && /* @__PURE__ */ jsxs("p", {
							className: "mb-2 text-sm text-muted-foreground",
							children: [
								"Sandbox: ",
								r.automatic_sandbox.message,
								r.automatic_sandbox.fbr_invoice_number ? ` (${r.automatic_sandbox.fbr_invoice_number})` : ""
							]
						}),
						r.errors.length ? /* @__PURE__ */ jsx(IssueList, {
							issues: r.errors,
							onFix: (f, rv) => onFix(r.id, f, rv)
						}) : /* @__PURE__ */ jsx("p", {
							className: "text-sm text-muted-foreground",
							children: "No problems found."
						}),
						![
							"valid",
							"sent",
							"already_sent",
							"needs_confirmation",
							"pending_confirmation"
						].includes(r.outcome) && /* @__PURE__ */ jsxs("div", {
							className: "mt-3 flex flex-wrap gap-2",
							children: [/* @__PURE__ */ jsx(Button, {
								size: "sm",
								variant: "outline",
								asChild: true,
								children: /* @__PURE__ */ jsxs(Link, {
									to: "/invoices",
									search: { edit: r.id },
									children: [/* @__PURE__ */ jsx(Pencil, { className: "size-3.5" }), "Edit invoice"]
								})
							}), /* @__PURE__ */ jsxs(Button, {
								size: "sm",
								variant: "outline",
								disabled: busy,
								onClick: () => onRevalidate(r.id),
								children: [/* @__PURE__ */ jsx(RefreshCw, { className: "size-3.5" }), "Validate again"]
							})]
						})
					]
				}, r.id)), results.some((r) => r.outcome === "needs_confirmation") && /* @__PURE__ */ jsx(Button, {
					variant: "outline",
					onClick: onRetry,
					children: "Retry unconfirmed invoices"
				})]
			})]
		})
	});
}
function PreviewDialog({ id, env, scenario, onClose }) {
	const q = useQuery({
		queryKey: [
			"fbr-preview",
			id,
			env,
			scenario
		],
		queryFn: () => api(`/fbr/preview/${id}?env=${env}&scenario=${scenario}`)
	});
	return /* @__PURE__ */ jsx(Dialog, {
		open: true,
		onOpenChange: (o) => !o && onClose(),
		children: /* @__PURE__ */ jsxs(DialogContent, {
			className: "max-h-[90vh] max-w-3xl overflow-auto",
			children: [/* @__PURE__ */ jsxs(DialogHeader, { children: [/* @__PURE__ */ jsx(DialogTitle, { children: "Local check before FBR" }), /* @__PURE__ */ jsx(DialogDescription, { children: "What will be sent, and any problems found locally." })] }), q.isLoading ? /* @__PURE__ */ jsx("p", {
				className: "text-sm",
				children: "Checking…"
			}) : q.error ? /* @__PURE__ */ jsx("p", {
				className: "text-sm text-destructive",
				children: q.error.message
			}) : /* @__PURE__ */ jsxs(Fragment, { children: [q.data?.issues.length ? /* @__PURE__ */ jsx(IssueList, { issues: q.data?.issues ?? [] }) : /* @__PURE__ */ jsx("p", {
				className: "text-sm text-success",
				children: "No local problems found."
			}), /* @__PURE__ */ jsx("pre", {
				className: "mt-3 max-h-80 overflow-auto rounded-lg bg-muted p-3 text-xs",
				children: JSON.stringify(q.data?.payload, null, 2)
			})] })]
		})
	});
}
function HistoryTab({ env }) {
	const q = useQuery({
		queryKey: ["fbr-history", env],
		queryFn: () => api(`/fbr/history?env=${env}`)
	});
	const [open, setOpen] = useState(null);
	const rows = q.data ?? [];
	return /* @__PURE__ */ jsxs("div", {
		className: "panel overflow-x-auto",
		children: [/* @__PURE__ */ jsxs(Table, { children: [/* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
			/* @__PURE__ */ jsx(TableHead, { children: "When" }),
			/* @__PURE__ */ jsx(TableHead, { children: "Action" }),
			/* @__PURE__ */ jsx(TableHead, { children: "Invoice" }),
			/* @__PURE__ */ jsx(TableHead, { children: "Result" }),
			/* @__PURE__ */ jsx(TableHead, { children: "FBR no." }),
			/* @__PURE__ */ jsx(TableHead, { children: "By" }),
			/* @__PURE__ */ jsx(TableHead, { children: "Details" })
		] }) }), /* @__PURE__ */ jsxs(TableBody, { children: [/* @__PURE__ */ jsx(TableState, {
			cols: 7,
			loading: q.isLoading,
			error: q.error ? q.error.message : null,
			empty: !q.isLoading && rows.length === 0,
			title: "No FBR activity yet",
			hint: "Tests, validations and submissions appear here."
		}), rows.map((h) => /* @__PURE__ */ jsxs(TableRow, { children: [
			/* @__PURE__ */ jsx(TableCell, {
				className: "whitespace-nowrap text-xs",
				children: h.created_at
			}),
			/* @__PURE__ */ jsx(TableCell, {
				className: "capitalize",
				children: h.action
			}),
			/* @__PURE__ */ jsx(TableCell, {
				className: "font-mono",
				children: h.invoice_number ?? "—"
			}),
			/* @__PURE__ */ jsxs(TableCell, { children: [OUTCOME[h.outcome] ?? h.outcome, h.http_status ? /* @__PURE__ */ jsxs("span", {
				className: "ml-1 text-xs text-muted-foreground",
				children: ["HTTP ", h.http_status]
			}) : null] }),
			/* @__PURE__ */ jsx(TableCell, {
				className: "font-mono text-xs",
				children: h.fbr_invoice_number ?? "—"
			}),
			/* @__PURE__ */ jsx(TableCell, {
				className: "text-xs",
				children: h.user_name
			}),
			/* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx(Button, {
				size: "sm",
				variant: "ghost",
				onClick: () => setOpen(h),
				children: "View"
			}) })
		] }, h.id))] })] }), open && /* @__PURE__ */ jsx(Dialog, {
			open: true,
			onOpenChange: (o) => !o && setOpen(null),
			children: /* @__PURE__ */ jsxs(DialogContent, {
				className: "max-h-[90vh] max-w-3xl overflow-auto",
				children: [
					/* @__PURE__ */ jsxs(DialogHeader, { children: [/* @__PURE__ */ jsxs(DialogTitle, { children: [
						open.action,
						" — ",
						open.invoice_number ?? env
					] }), /* @__PURE__ */ jsx(DialogDescription, { children: open.error_message ?? "No error" })] }),
					/* @__PURE__ */ jsx(Label, { children: "Sent to FBR" }),
					/* @__PURE__ */ jsx("pre", {
						className: "max-h-60 overflow-auto rounded-lg bg-muted p-3 text-xs",
						children: JSON.stringify(decodeFbrJson(open.request_json), null, 2)
					}),
					/* @__PURE__ */ jsx(Label, { children: "FBR reply" }),
					/* @__PURE__ */ jsx("pre", {
						className: "max-h-60 overflow-auto rounded-lg bg-muted p-3 text-xs",
						children: JSON.stringify(decodeFbrJson(open.response_json), null, 2)
					})
				]
			})
		})]
	});
}
function SettingsTab({ cfg }) {
	const qc = useQueryClient();
	const refresh = () => void qc.invalidateQueries({ queryKey: ["fbr-config"] });
	const [s, setS] = useState({
		fbr_seller_name: cfg.settings["fbr_seller_name"] || cfg.settings["company_name"] || "",
		fbr_seller_address: cfg.settings["fbr_seller_address"] || cfg.settings["company_address"] || "",
		fbr_seller_cnic: cfg.settings["fbr_seller_cnic"] || "",
		fbr_seller_ntn: cfg.settings["fbr_seller_ntn"] ?? "",
		fbr_seller_province: cfg.settings["fbr_seller_province"] ?? "",
		fbr_default_scenario: cfg.settings["fbr_default_scenario"] || "SN001"
	});
	const canEdit = !!cfg.can["configure"];
	const provinces = cfg.provinces.length ? cfg.provinces : [
		"PUNJAB",
		"SINDH",
		"KHYBER PAKHTUNKHWA",
		"BALOCHISTAN",
		"CAPITAL TERRITORY",
		"GILGIT BALTISTAN",
		"AZAD JAMMU AND KASHMIR"
	];
	const saveSeller = useMutation({
		mutationFn: () => {
			if (!s.fbr_seller_name.trim() || !s.fbr_seller_address.trim() || !s.fbr_seller_province) throw new Error("Enter seller name, address and province.");
			if (s.fbr_seller_ntn ? !validTaxId(s.fbr_seller_ntn) : !/^\d{13}$/.test(s.fbr_seller_cnic)) throw new Error("Enter a valid seller NTN or 13-digit CNIC.");
			return api("/fbr/settings", s, "PUT");
		},
		onSuccess: () => {
			toast.success("Saved");
			refresh();
		},
		onError: (e) => toast.error(e.message)
	});
	return /* @__PURE__ */ jsxs("div", {
		className: "grid gap-4 lg:grid-cols-2",
		children: [cfg.environments.sort((a, b) => a.environment.localeCompare(b.environment)).reverse().map((e) => /* @__PURE__ */ jsx(EnvCard, {
			e,
			canEdit,
			onSaved: refresh
		}, e.environment)), /* @__PURE__ */ jsxs(Card, { children: [/* @__PURE__ */ jsxs(CardHeader, { children: [/* @__PURE__ */ jsx(CardTitle, { children: "Seller details sent to FBR" }), /* @__PURE__ */ jsx(CardDescription, { children: "Seller is your company. Buyer NTN / CNIC, province and registration are automatically picked from the department on each invoice." })] }), /* @__PURE__ */ jsxs(CardContent, {
			className: "space-y-3",
			children: [
				[
					["fbr_seller_name", "Seller name"],
					["fbr_seller_cnic", "Seller CNIC (13 digits)"],
					["fbr_seller_address", "Seller address"]
				].map(([key, label]) => /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, {
					htmlFor: key,
					children: label
				}), /* @__PURE__ */ jsx(Input, {
					id: key,
					disabled: !canEdit,
					value: s[key],
					onChange: (e) => setS({
						...s,
						[key]: e.target.value
					})
				})] }, key)),
				/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, {
					htmlFor: "fbr_seller_ntn",
					children: "Seller NTN"
				}), /* @__PURE__ */ jsx(Input, {
					id: "fbr_seller_ntn",
					maxLength: 20,
					disabled: !canEdit,
					value: s.fbr_seller_ntn,
					onChange: (e) => setS({
						...s,
						fbr_seller_ntn: e.target.value
					})
				})] }),
				/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, { children: "Seller province" }), /* @__PURE__ */ jsxs(Select, {
					disabled: !canEdit,
					value: s.fbr_seller_province,
					onValueChange: (v) => setS({
						...s,
						fbr_seller_province: v
					}),
					children: [/* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Select province" }) }), /* @__PURE__ */ jsx(SelectContent, { children: provinces.map((p) => /* @__PURE__ */ jsx(SelectItem, {
						value: p,
						children: p
					}, p)) })]
				})] }),
				/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, { children: "Default Sandbox scenario" }), /* @__PURE__ */ jsxs(Select, {
					disabled: !canEdit,
					value: s.fbr_default_scenario,
					onValueChange: (v) => setS({
						...s,
						fbr_default_scenario: v
					}),
					children: [/* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }), /* @__PURE__ */ jsx(SelectContent, { children: Object.entries(cfg.scenarios).map(([k, [d]]) => /* @__PURE__ */ jsxs(SelectItem, {
						value: k,
						children: [
							k,
							" — ",
							d
						]
					}, k)) })]
				})] }),
				canEdit && /* @__PURE__ */ jsx(Button, {
					onClick: () => saveSeller.mutate(),
					disabled: saveSeller.isPending,
					children: "Save seller details"
				})
			]
		})] })]
	});
}
function EnvCard({ e, canEdit, onSaved }) {
	const [post, setPost] = useState(e.post_url);
	const [val, setVal] = useState(e.validate_url);
	const [token, setToken] = useState("");
	const save = useMutation({
		mutationFn: (clear) => api(`/fbr/config/${e.environment}`, {
			post_url: post,
			validate_url: val,
			...token ? { token } : {},
			...clear ? { clear_token: true } : {}
		}, "PUT"),
		onSuccess: () => {
			setToken("");
			toast.success("Saved");
			onSaved();
		},
		onError: (x) => toast.error(x.message)
	});
	const test = useMutation({
		mutationFn: () => api(`/fbr/test/${e.environment}`, {}),
		onSuccess: (r) => {
			if (r.ok) toast.success(r.message);
			else toast.error(r.message);
			onSaved();
		},
		onError: (x) => toast.error(x.message)
	});
	const disconnect = useMutation({
		mutationFn: () => api(`/fbr/disconnect/${e.environment}`, {}),
		onSuccess: () => {
			toast.success("Disconnected — saved credentials and history retained");
			onSaved();
		},
		onError: (x) => toast.error(x.message)
	});
	return /* @__PURE__ */ jsxs(Card, { children: [/* @__PURE__ */ jsxs(CardHeader, { children: [/* @__PURE__ */ jsxs(CardTitle, {
		className: "flex items-center gap-2 capitalize",
		children: [e.environment, e.connected ? /* @__PURE__ */ jsx(Badge, { children: "Connected" }) : e.last_test_ok === 0 ? /* @__PURE__ */ jsx(Badge, {
			variant: "destructive",
			children: "Failed"
		}) : /* @__PURE__ */ jsx(Badge, {
			variant: "outline",
			children: "Disconnected"
		})]
	}), /* @__PURE__ */ jsxs(CardDescription, { children: [e.last_test_message ?? "Enter the API links and token PRAL issued for this environment.", e.last_test_at ? ` · ${e.last_test_at}` : ""] })] }), /* @__PURE__ */ jsxs(CardContent, {
		className: "space-y-3",
		children: [
			/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, { children: "Post invoice URL" }), /* @__PURE__ */ jsx(Input, {
				disabled: !canEdit,
				value: post,
				onChange: (x) => setPost(x.target.value)
			})] }),
			/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, { children: "Validate invoice URL" }), /* @__PURE__ */ jsx(Input, {
				disabled: !canEdit,
				value: val,
				onChange: (x) => setVal(x.target.value)
			})] }),
			/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs(Label, { children: ["Security token ", e.has_token && /* @__PURE__ */ jsx("span", {
				className: "text-xs text-muted-foreground",
				children: "(saved securely)"
			})] }), /* @__PURE__ */ jsx(Input, {
				disabled: !canEdit,
				type: "password",
				autoComplete: "off",
				value: token,
				onChange: (x) => setToken(x.target.value),
				placeholder: e.has_token ? "Leave empty to keep the saved token" : "Paste token"
			})] }),
			canEdit && /* @__PURE__ */ jsxs("div", {
				className: "flex flex-wrap gap-2",
				children: [
					/* @__PURE__ */ jsx(Button, {
						onClick: () => save.mutate(false),
						disabled: save.isPending,
						children: "Save"
					}),
					/* @__PURE__ */ jsxs(Button, {
						variant: "outline",
						onClick: () => test.mutate(),
						disabled: test.isPending || !e.has_token,
						children: [/* @__PURE__ */ jsx(Plug, { className: "size-4" }), test.isPending ? "Testing…" : "Connect / test"]
					}),
					/* @__PURE__ */ jsxs(Button, {
						variant: "outline",
						disabled: !e.connected || disconnect.isPending,
						onClick: () => {
							if (window.confirm(`Disconnect ${e.environment}? No further API calls will be made; saved credentials and history remain.`)) disconnect.mutate();
						},
						children: ["Disconnect ", e.environment]
					}),
					e.has_token && /* @__PURE__ */ jsx(Button, {
						variant: "ghost",
						onClick: () => {
							if (window.confirm("Remove the saved token?")) save.mutate(true);
						},
						children: "Remove token"
					})
				]
			})
		]
	})] });
}
//#endregion
export { FbrPage as component };
