import { n as Button, r as cn } from "./bilal-logo.asset-DVM5nCcq.js";
import { a as DropdownMenu, c as DropdownMenuSeparator, l as DropdownMenuTrigger, o as DropdownMenuContent, s as DropdownMenuItem } from "./AppShell-CbTTFVU-.js";
import { o as TableRow, r as TableCell } from "./table-ITrsg8wD.js";
import { t as Input } from "./input-BdVko9wQ.js";
import { t as Skeleton } from "./skeleton-CnA2_DGM.js";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { Inbox, MoreHorizontal, Search } from "lucide-react";
//#region src/components/data/kit.tsx
var TONES = {
	verified: "bg-success/12 text-success ring-success/25",
	approved: "bg-success/12 text-success ring-success/25",
	invoiced: "bg-info/12 text-info ring-info/25",
	healthy: "bg-success/12 text-success ring-success/25",
	active: "bg-success/12 text-success ring-success/25",
	submitted: "bg-warning/15 text-warning-foreground ring-warning/40 dark:text-warning",
	pending: "bg-warning/15 text-warning-foreground ring-warning/40 dark:text-warning",
	low: "bg-warning/15 text-warning-foreground ring-warning/40 dark:text-warning",
	rejected: "bg-destructive/12 text-destructive ring-destructive/25",
	out: "bg-destructive/12 text-destructive ring-destructive/25",
	suspended: "bg-destructive/12 text-destructive ring-destructive/25",
	cancelled: "bg-muted text-muted-foreground ring-border",
	draft: "bg-muted text-muted-foreground ring-border",
	unverified: "bg-muted text-muted-foreground ring-border",
	inactive: "bg-muted text-muted-foreground ring-border"
};
var LABELS = {
	submitted: "Pending approval",
	low: "Low stock",
	out: "Out of stock",
	healthy: "Healthy"
};
function StatusBadge({ status, label }) {
	const s = status?.toLowerCase() ?? "draft";
	return /* @__PURE__ */ jsxs("span", {
		className: cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ring-1 ring-inset", TONES[s] ?? TONES["draft"]),
		children: [/* @__PURE__ */ jsx("span", { className: "size-1.5 rounded-full bg-current" }), label ?? LABELS[s] ?? s.replace(/_/g, " ")]
	});
}
function RowActions({ actions }) {
	const shown = actions.filter((a) => !a.hidden);
	if (!shown.length) return null;
	return /* @__PURE__ */ jsxs(DropdownMenu, { children: [/* @__PURE__ */ jsx(DropdownMenuTrigger, {
		asChild: true,
		children: /* @__PURE__ */ jsx(Button, {
			variant: "ghost",
			size: "icon",
			className: "size-8",
			"aria-label": "Row actions",
			children: /* @__PURE__ */ jsx(MoreHorizontal, { className: "size-4" })
		})
	}), /* @__PURE__ */ jsx(DropdownMenuContent, {
		align: "end",
		className: "w-48",
		children: shown.map((a) => /* @__PURE__ */ jsxs("div", { children: [a.separator ? /* @__PURE__ */ jsx(DropdownMenuSeparator, {}) : null, /* @__PURE__ */ jsxs(DropdownMenuItem, {
			onClick: a.onClick,
			className: cn(a.danger && "text-destructive focus:text-destructive"),
			children: [a.icon ? /* @__PURE__ */ jsx(a.icon, { className: "size-4" }) : null, a.label]
		})] }, a.label))
	})] });
}
function TableState({ loading, empty, cols, title = "Nothing here yet", hint, error }) {
	if (loading) return /* @__PURE__ */ jsx(Fragment, { children: [
		0,
		1,
		2,
		3
	].map((i) => /* @__PURE__ */ jsx(TableRow, {
		className: "hover:bg-transparent",
		children: /* @__PURE__ */ jsx(TableCell, {
			colSpan: cols,
			children: /* @__PURE__ */ jsx(Skeleton, { className: "h-6 w-full" })
		})
	}, i)) });
	if (error) return /* @__PURE__ */ jsx(TableRow, {
		className: "hover:bg-transparent",
		children: /* @__PURE__ */ jsxs(TableCell, {
			colSpan: cols,
			className: "py-12 text-center text-sm text-destructive",
			children: ["Couldn't load this list. ", error]
		})
	});
	if (!empty) return null;
	return /* @__PURE__ */ jsx(TableRow, {
		className: "hover:bg-transparent",
		children: /* @__PURE__ */ jsx(TableCell, {
			colSpan: cols,
			className: "py-14",
			children: /* @__PURE__ */ jsxs("div", {
				className: "flex flex-col items-center gap-2 text-center",
				children: [
					/* @__PURE__ */ jsx("span", {
						className: "flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground",
						children: /* @__PURE__ */ jsx(Inbox, { className: "size-5" })
					}),
					/* @__PURE__ */ jsx("p", {
						className: "text-sm font-medium",
						children: title
					}),
					hint ? /* @__PURE__ */ jsx("p", {
						className: "max-w-sm text-xs text-muted-foreground",
						children: hint
					}) : null
				]
			})
		})
	});
}
function Toolbar({ search, onSearch, placeholder, children }) {
	return /* @__PURE__ */ jsxs("div", {
		className: "flex flex-wrap items-center gap-2 border-b border-border p-4",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "relative w-full max-w-xs",
			children: [/* @__PURE__ */ jsx(Search, { className: "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" }), /* @__PURE__ */ jsx(Input, {
				value: search,
				onChange: (e) => onSearch(e.target.value),
				placeholder,
				className: "pl-9"
			})]
		}), /* @__PURE__ */ jsx("div", {
			className: "ml-auto flex flex-wrap items-center gap-2",
			children
		})]
	});
}
function FormSection({ title, hint, children }) {
	return /* @__PURE__ */ jsxs("section", {
		className: "rounded-xl border border-border bg-muted/25 p-4",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "mb-3",
			children: [/* @__PURE__ */ jsx("p", {
				className: "font-heading text-sm font-semibold",
				children: title
			}), hint ? /* @__PURE__ */ jsx("p", {
				className: "text-xs text-muted-foreground",
				children: hint
			}) : null]
		}), children]
	});
}
function SummaryBox({ sub, tax, grand, money, labor = 0 }) {
	return /* @__PURE__ */ jsxs("div", {
		className: "space-y-2 rounded-xl border border-border bg-card p-4 text-sm shadow-sm",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex justify-between text-muted-foreground",
				children: [/* @__PURE__ */ jsx("span", { children: "Subtotal" }), /* @__PURE__ */ jsx("span", {
					className: "tabular-nums text-foreground",
					children: money(sub)
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "flex justify-between text-muted-foreground",
				children: [/* @__PURE__ */ jsx("span", { children: "Sales Tax Value" }), /* @__PURE__ */ jsx("span", {
					className: "tabular-nums text-foreground",
					children: money(tax)
				})]
			}),
			labor > 0 ? /* @__PURE__ */ jsxs("div", {
				className: "flex justify-between text-muted-foreground",
				children: [/* @__PURE__ */ jsx("span", { children: "Labor (earlier record)" }), /* @__PURE__ */ jsx("span", {
					className: "tabular-nums text-foreground",
					children: money(labor)
				})]
			}) : null,
			/* @__PURE__ */ jsxs("div", {
				className: "flex items-baseline justify-between border-t border-border pt-2",
				children: [/* @__PURE__ */ jsx("span", {
					className: "font-semibold",
					children: "Grand total"
				}), /* @__PURE__ */ jsx("span", {
					className: "font-heading text-xl font-semibold tabular-nums text-primary",
					children: money(grand)
				})]
			})
		]
	});
}
/** Sticky bar shown when rows are selected: bulk verify / unverify / delete / PDF. */
function BulkBar({ count, onClear, children }) {
	if (!count) return null;
	return /* @__PURE__ */ jsxs("div", {
		className: "flex flex-wrap items-center gap-2 border-b border-border bg-accent/60 px-4 py-2 text-sm",
		children: [
			/* @__PURE__ */ jsxs("span", {
				className: "font-semibold",
				children: [count, " selected"]
			}),
			/* @__PURE__ */ jsx(Button, {
				size: "sm",
				variant: "ghost",
				onClick: onClear,
				children: "Clear"
			}),
			/* @__PURE__ */ jsx("div", {
				className: "ml-auto flex flex-wrap gap-2",
				children
			})
		]
	});
}
//#endregion
export { SummaryBox as a, StatusBadge as i, FormSection as n, TableState as o, RowActions as r, Toolbar as s, BulkBar as t };
