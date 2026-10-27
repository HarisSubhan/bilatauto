import { a as db } from "./bilal-logo.asset-DVM5nCcq.js";
import { t as AppShell } from "./AppShell-CbTTFVU-.js";
import { a as TableHeader, i as TableHead, n as TableBody, o as TableRow, r as TableCell, t as Table } from "./table-ITrsg8wD.js";
import { t as DataTools } from "./DataTools-D4w2VKVa.js";
import { t as Input } from "./input-BdVko9wQ.js";
import { t as Badge } from "./badge-hwXf-j3D.js";
import { useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
//#region src/routes/_authenticated/activity-logs.tsx?tsr-split=component
function LogsPage() {
	const [search, setSearch] = useState("");
	const q = useQuery({
		queryKey: ["logs", search],
		queryFn: async () => {
			let s = db.from("activity_logs").select("id, user_name, action, module, record_label, created_at").order("created_at", { ascending: false }).limit(300);
			if (search) s = s.or(`module.ilike.%${search}%,record_label.ilike.%${search}%,user_name.ilike.%${search}%`);
			return (await s).data ?? [];
		}
	});
	return /* @__PURE__ */ jsxs(AppShell, {
		title: "Activity Logs",
		description: "Every change is recorded automatically and cannot be edited",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "mb-4 flex flex-wrap items-center gap-2",
			children: [/* @__PURE__ */ jsx(Input, {
				className: "max-w-sm",
				placeholder: "Search user, module or record…",
				value: search,
				onChange: (e) => setSearch(e.target.value)
			}), /* @__PURE__ */ jsx("div", {
				className: "ml-auto",
				children: /* @__PURE__ */ jsx(DataTools, {
					name: "activity-logs",
					template: false,
					fields: [
						{
							key: "created_at",
							label: "When"
						},
						{
							key: "user_name",
							label: "User"
						},
						{
							key: "action",
							label: "Action"
						},
						{
							key: "module",
							label: "Module"
						},
						{
							key: "record_label",
							label: "Record"
						}
					],
					exportRows: async () => q.data ?? []
				})
			})]
		}), /* @__PURE__ */ jsx("div", {
			className: "panel overflow-hidden",
			children: /* @__PURE__ */ jsxs(Table, { children: [/* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
				/* @__PURE__ */ jsx(TableHead, { children: "When" }),
				/* @__PURE__ */ jsx(TableHead, { children: "User" }),
				/* @__PURE__ */ jsx(TableHead, { children: "Action" }),
				/* @__PURE__ */ jsx(TableHead, { children: "Module" }),
				/* @__PURE__ */ jsx(TableHead, { children: "Record" })
			] }) }), /* @__PURE__ */ jsxs(TableBody, { children: [(q.data ?? []).map((l) => /* @__PURE__ */ jsxs(TableRow, { children: [
				/* @__PURE__ */ jsx(TableCell, {
					className: "whitespace-nowrap",
					children: new Date(l.created_at).toLocaleString("en-GB")
				}),
				/* @__PURE__ */ jsx(TableCell, { children: l.user_name ?? "System" }),
				/* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx(Badge, {
					variant: l.action === "delete" ? "destructive" : l.action === "insert" ? "default" : "secondary",
					children: l.action
				}) }),
				/* @__PURE__ */ jsx(TableCell, {
					className: "capitalize",
					children: l.module.replace(/_/g, " ")
				}),
				/* @__PURE__ */ jsx(TableCell, {
					className: "font-mono text-xs",
					children: l.record_label
				})
			] }, l.id)), q.data?.length === 0 && /* @__PURE__ */ jsx(TableRow, { children: /* @__PURE__ */ jsx(TableCell, {
				colSpan: 5,
				className: "py-10 text-center text-muted-foreground",
				children: "No activity yet"
			}) })] })] })
		})]
	});
}
//#endregion
export { LogsPage as component };
