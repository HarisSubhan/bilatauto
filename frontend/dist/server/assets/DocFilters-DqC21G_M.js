import { a as db, n as Button } from "./bilal-logo.asset-DVM5nCcq.js";
import { i as PopoverTrigger, n as Popover, r as PopoverContent } from "./AppShell-CbTTFVU-.js";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-GN_Kexq5.js";
import { t as Input } from "./input-BdVko9wQ.js";
import { t as Checkbox } from "./checkbox-C4v7NccO.js";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
//#region src/components/data/DocFilters.tsx
var emptyDocFilter = {
	depts: [],
	preset: "all",
	from: "",
	to: ""
};
/** Resolve the preset to an inclusive [from, to] date range (ISO dates) or nulls for All Time. */
function dateRange(f, today = /* @__PURE__ */ new Date()) {
	const iso = (d) => d.toISOString().slice(0, 10);
	if (f.preset === "1m" || f.preset === "3m") {
		const d = new Date(today);
		d.setMonth(d.getMonth() - (f.preset === "1m" ? 1 : 3));
		return {
			from: iso(d),
			to: iso(today)
		};
	}
	if (f.preset === "custom") return {
		from: f.from || null,
		to: f.to || null
	};
	return {
		from: null,
		to: null
	};
}
/** Options list (id,name) for departments or suppliers. */
function useOptions(table) {
	return useQuery({
		queryKey: [`${table}-filter-options`],
		queryFn: async () => (await db.from(table).select("id,name").order("name")).data ?? []
	});
}
function MultiPick({ label, options, value, onChange }) {
	return /* @__PURE__ */ jsxs(Popover, { children: [/* @__PURE__ */ jsx(PopoverTrigger, {
		asChild: true,
		children: /* @__PURE__ */ jsxs(Button, {
			variant: "outline",
			size: "sm",
			className: "min-w-40 justify-between",
			children: [value.length === 0 ? `All ${label}` : value.length === 1 ? options.find((o) => o.id === value[0])?.name ?? "1 selected" : `${value.length} ${label}`, /* @__PURE__ */ jsx(ChevronDown, { className: "size-4 opacity-60" })]
		})
	}), /* @__PURE__ */ jsxs(PopoverContent, {
		className: "w-64 p-2",
		align: "start",
		children: [/* @__PURE__ */ jsxs("label", {
			className: "flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent",
			children: [
				/* @__PURE__ */ jsx(Checkbox, {
					checked: value.length === 0,
					onCheckedChange: () => onChange([])
				}),
				"All ",
				label
			]
		}), /* @__PURE__ */ jsx("div", {
			className: "max-h-64 overflow-auto",
			children: options.map((o) => /* @__PURE__ */ jsxs("label", {
				className: "flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent",
				children: [/* @__PURE__ */ jsx(Checkbox, {
					checked: value.includes(o.id),
					onCheckedChange: (c) => onChange(c ? [...value, o.id] : value.filter((x) => x !== o.id))
				}), o.name]
			}, o.id))
		})]
	})] });
}
function DateFilter({ value, onChange }) {
	return /* @__PURE__ */ jsxs("div", {
		className: "flex flex-wrap items-center gap-2",
		children: [/* @__PURE__ */ jsxs(Select, {
			value: value.preset,
			onValueChange: (p) => onChange({
				...value,
				preset: p
			}),
			children: [/* @__PURE__ */ jsx(SelectTrigger, {
				className: "h-8 w-40",
				"aria-label": "Date range",
				children: /* @__PURE__ */ jsx(SelectValue, {})
			}), /* @__PURE__ */ jsxs(SelectContent, { children: [
				/* @__PURE__ */ jsx(SelectItem, {
					value: "all",
					children: "All Time"
				}),
				/* @__PURE__ */ jsx(SelectItem, {
					value: "1m",
					children: "Last 1 Month"
				}),
				/* @__PURE__ */ jsx(SelectItem, {
					value: "3m",
					children: "Last 3 Months"
				}),
				/* @__PURE__ */ jsx(SelectItem, {
					value: "custom",
					children: "Custom Date Range"
				})
			] })]
		}), value.preset === "custom" ? /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx(Input, {
			type: "date",
			"aria-label": "From date",
			className: "h-8 w-36",
			value: value.from,
			onChange: (e) => onChange({
				...value,
				from: e.target.value
			})
		}), /* @__PURE__ */ jsx(Input, {
			type: "date",
			"aria-label": "To date",
			className: "h-8 w-36",
			value: value.to,
			onChange: (e) => onChange({
				...value,
				to: e.target.value
			})
		})] }) : null]
	});
}
/** Department (multi) + date filters, shared by Quotations and Invoices. */
function DocFilters({ value, onChange }) {
	return /* @__PURE__ */ jsxs("div", {
		className: "flex flex-wrap items-center gap-2 border-b border-border px-4 py-2",
		children: [/* @__PURE__ */ jsx(MultiPick, {
			label: "departments",
			options: useOptions("departments").data ?? [],
			value: value.depts,
			onChange: (d) => onChange({
				...value,
				depts: d
			})
		}), /* @__PURE__ */ jsx(DateFilter, {
			value,
			onChange: (v) => onChange({
				...value,
				...v
			})
		})]
	});
}
//#endregion
export { emptyDocFilter as a, dateRange as i, DocFilters as n, useOptions as o, MultiPick as r, DateFilter as t };
