import { a as db, i as api, n as Button } from "./bilal-logo.asset-DRcrRZxD.js";
import { b as useAuth, d as DialogContent, h as DialogTitle, m as DialogHeader, t as AppShell, u as Dialog } from "./AppShell-Ctpjmt0k.js";
import { a as TableHeader, c as SelectContent, d as SelectValue, i as TableHead, l as SelectItem, n as TableBody, o as TableRow, r as TableCell, s as Select, t as Table, u as SelectTrigger } from "./table-C25g3iry.js";
import { t as DataTools } from "./DataTools-D4drsZ9K.js";
import { t as Input } from "./input-C4NJMa86.js";
import { t as Label } from "./label-7BUlW98B.js";
import { t as Checkbox } from "./checkbox-CRGTsv5W.js";
import { i as TabsTrigger, n as TabsContent, r as TabsList, t as Tabs } from "./tabs-BYztEwZ4.js";
import { useState } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { KeyRound, Plus } from "lucide-react";
//#region src/lib/admin.functions.ts
var createUserAccount = ({ data }) => api("/users", data);
var resetUserPassword = ({ data }) => api(`/users/${data.user_id}`, { password: data.password }, "PUT");
//#endregion
//#region src/routes/_authenticated/users.tsx?tsr-split=component
function UsersPage() {
	const { isSuperAdmin } = useAuth();
	const qc = useQueryClient();
	const [open, setOpen] = useState(false);
	const roles = useQuery({
		queryKey: ["roles"],
		queryFn: async () => (await db.from("roles").select("*").order("name")).data ?? []
	});
	const users = useQuery({
		queryKey: ["users"],
		queryFn: async () => {
			const [{ data: p }, { data: ur }] = await Promise.all([db.from("profiles").select("*").order("created_at"), db.from("user_roles").select("user_id, role_id")]);
			return (p ?? []).map((u) => ({
				...u,
				role_id: ur?.find((r) => r.user_id === u.id)?.role_id ?? ""
			}));
		}
	});
	const setRole = async (userId, roleId) => {
		await db.from("user_roles").delete().eq("user_id", userId);
		const { error } = await db.from("user_roles").insert({
			user_id: userId,
			role_id: roleId
		});
		if (error) {
			toast.error(error.message);
			return;
		}
		toast.success("Role updated");
		qc.invalidateQueries({ queryKey: ["users"] });
	};
	const setStatus = async (userId, status) => {
		const { error } = await db.from("profiles").update({ status }).eq("id", userId);
		if (error) {
			toast.error(error.message);
			return;
		}
		qc.invalidateQueries({ queryKey: ["users"] });
	};
	const reset = resetUserPassword;
	const doReset = async (userId) => {
		const pw = window.prompt("New password (min 8 characters)");
		if (!pw) return;
		try {
			await reset({ data: {
				user_id: userId,
				password: pw
			} });
			toast.success("Password changed");
		} catch (e) {
			toast.error(e.message);
		}
	};
	return /* @__PURE__ */ jsxs(AppShell, {
		title: "Users & Roles",
		description: "Only the Super Admin can add users or change access",
		actions: /* @__PURE__ */ jsxs("div", {
			className: "flex gap-2",
			children: [/* @__PURE__ */ jsx(DataTools, {
				name: "users",
				template: false,
				fields: [
					{
						key: "full_name",
						label: "Name"
					},
					{
						key: "email",
						label: "Email"
					},
					{
						key: "phone",
						label: "Phone"
					},
					{
						key: "role",
						label: "Role"
					},
					{
						key: "status",
						label: "Status"
					}
				],
				exportRows: async () => (users.data ?? []).map((u) => ({
					...u,
					role: roles.data?.find((r) => r.id === u.role_id)?.name ?? ""
				}))
			}), isSuperAdmin ? /* @__PURE__ */ jsxs(Button, {
				size: "sm",
				onClick: () => setOpen(true),
				children: [/* @__PURE__ */ jsx(Plus, { className: "mr-1 size-4" }), "Add user"]
			}) : null]
		}),
		children: [/* @__PURE__ */ jsxs(Tabs, {
			defaultValue: "users",
			children: [
				/* @__PURE__ */ jsxs(TabsList, { children: [/* @__PURE__ */ jsx(TabsTrigger, {
					value: "users",
					children: "Users"
				}), /* @__PURE__ */ jsx(TabsTrigger, {
					value: "perms",
					children: "Roles & Permissions"
				})] }),
				/* @__PURE__ */ jsx(TabsContent, {
					value: "users",
					className: "panel overflow-hidden",
					children: /* @__PURE__ */ jsxs(Table, { children: [/* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
						/* @__PURE__ */ jsx(TableHead, { children: "Name" }),
						/* @__PURE__ */ jsx(TableHead, { children: "Email" }),
						/* @__PURE__ */ jsx(TableHead, { children: "Phone" }),
						/* @__PURE__ */ jsx(TableHead, { children: "Role" }),
						/* @__PURE__ */ jsx(TableHead, { children: "Status" }),
						/* @__PURE__ */ jsx(TableHead, {
							className: "text-right",
							children: "Actions"
						})
					] }) }), /* @__PURE__ */ jsx(TableBody, { children: (users.data ?? []).map((u) => /* @__PURE__ */ jsxs(TableRow, { children: [
						/* @__PURE__ */ jsx(TableCell, {
							className: "font-medium",
							children: u.full_name
						}),
						/* @__PURE__ */ jsx(TableCell, { children: u.email }),
						/* @__PURE__ */ jsx(TableCell, { children: u.phone }),
						/* @__PURE__ */ jsx(TableCell, {
							className: "min-w-44",
							children: /* @__PURE__ */ jsxs(Select, {
								disabled: !isSuperAdmin,
								value: u.role_id,
								onValueChange: (v) => void setRole(u.id, v),
								children: [/* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "No role" }) }), /* @__PURE__ */ jsx(SelectContent, { children: (roles.data ?? []).map((r) => /* @__PURE__ */ jsx(SelectItem, {
									value: r.id,
									children: r.name
								}, r.id)) })]
							})
						}),
						/* @__PURE__ */ jsx(TableCell, {
							className: "capitalize",
							children: u.status
						}),
						/* @__PURE__ */ jsx(TableCell, {
							className: "space-x-2 text-right",
							children: isSuperAdmin && /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx(Button, {
								size: "sm",
								variant: "outline",
								onClick: () => void setStatus(u.id, u.status === "active" ? "suspended" : "active"),
								children: u.status === "active" ? "Suspend" : "Activate"
							}), /* @__PURE__ */ jsx(Button, {
								size: "icon",
								variant: "ghost",
								"aria-label": "Reset password",
								onClick: () => void doReset(u.id),
								children: /* @__PURE__ */ jsx(KeyRound, { className: "size-4" })
							})] })
						})
					] }, u.id)) })] })
				}),
				/* @__PURE__ */ jsx(TabsContent, {
					value: "perms",
					children: /* @__PURE__ */ jsx(PermissionMatrix, { canEdit: isSuperAdmin })
				})
			]
		}), open && /* @__PURE__ */ jsx(AddUser, {
			roles: roles.data ?? [],
			onClose: () => setOpen(false),
			onDone: () => {
				setOpen(false);
				qc.invalidateQueries({ queryKey: ["users"] });
			}
		})]
	});
}
function AddUser({ roles, onClose, onDone }) {
	const create = createUserAccount;
	const [f, setF] = useState({
		full_name: "",
		email: "",
		password: "",
		phone: "",
		role_id: ""
	});
	const [busy, setBusy] = useState(false);
	const submit = async () => {
		setBusy(true);
		try {
			await create({ data: f });
			toast.success("User created");
			onDone();
		} catch (e) {
			toast.error(e.message);
		} finally {
			setBusy(false);
		}
	};
	return /* @__PURE__ */ jsx(Dialog, {
		open: true,
		onOpenChange: (o) => !o && onClose(),
		children: /* @__PURE__ */ jsxs(DialogContent, { children: [/* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: "Add user" }) }), /* @__PURE__ */ jsxs("div", {
			className: "grid gap-3",
			children: [
				/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, { children: "Full name" }), /* @__PURE__ */ jsx(Input, {
					value: f.full_name,
					onChange: (e) => setF({
						...f,
						full_name: e.target.value
					})
				})] }),
				/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, { children: "Email" }), /* @__PURE__ */ jsx(Input, {
					type: "email",
					value: f.email,
					onChange: (e) => setF({
						...f,
						email: e.target.value
					})
				})] }),
				/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, { children: "Phone" }), /* @__PURE__ */ jsx(Input, {
					value: f.phone,
					onChange: (e) => setF({
						...f,
						phone: e.target.value
					})
				})] }),
				/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, { children: "Password (min 8)" }), /* @__PURE__ */ jsx(Input, {
					type: "password",
					value: f.password,
					onChange: (e) => setF({
						...f,
						password: e.target.value
					})
				})] }),
				/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, { children: "Role" }), /* @__PURE__ */ jsxs(Select, {
					value: f.role_id,
					onValueChange: (v) => setF({
						...f,
						role_id: v
					}),
					children: [/* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Choose role" }) }), /* @__PURE__ */ jsx(SelectContent, { children: roles.map((r) => /* @__PURE__ */ jsx(SelectItem, {
						value: r.id,
						children: r.name
					}, r.id)) })]
				})] }),
				/* @__PURE__ */ jsx(Button, {
					onClick: submit,
					disabled: busy || !f.role_id,
					children: busy ? "Creating…" : "Create user"
				})
			]
		})] })
	});
}
function PermissionMatrix({ canEdit }) {
	const qc = useQueryClient();
	const q = useQuery({
		queryKey: ["perm-matrix"],
		queryFn: async () => {
			const [r, p, rp] = await Promise.all([
				db.from("roles").select("*").order("name"),
				db.from("permissions").select("*").order("module"),
				db.from("role_permissions").select("*")
			]);
			return {
				roles: r.data ?? [],
				perms: p.data ?? [],
				links: rp.data ?? []
			};
		}
	});
	const toggle = async (role_id, permission_id, on) => {
		const res = on ? await db.from("role_permissions").insert({
			role_id,
			permission_id
		}) : await db.from("role_permissions").delete().eq("role_id", role_id).eq("permission_id", permission_id);
		if (res.error) {
			toast.error(res.error.message);
			return;
		}
		qc.invalidateQueries({ queryKey: ["perm-matrix"] });
	};
	const d = q.data;
	if (!d) return null;
	const roles = d.roles.filter((r) => r.slug !== "super_admin");
	return /* @__PURE__ */ jsxs("div", {
		className: "overflow-x-auto panel overflow-hidden",
		children: [/* @__PURE__ */ jsxs(Table, { children: [/* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
			/* @__PURE__ */ jsx(TableHead, { children: "Module" }),
			/* @__PURE__ */ jsx(TableHead, { children: "Action" }),
			roles.map((r) => /* @__PURE__ */ jsx(TableHead, {
				className: "text-center",
				children: r.name
			}, r.id))
		] }) }), /* @__PURE__ */ jsx(TableBody, { children: d.perms.map((p) => /* @__PURE__ */ jsxs(TableRow, { children: [
			/* @__PURE__ */ jsx(TableCell, {
				className: "capitalize",
				children: p.module.replace(/_/g, " ")
			}),
			/* @__PURE__ */ jsx(TableCell, {
				className: "capitalize",
				children: p.action
			}),
			roles.map((r) => {
				const on = d.links.some((l) => l.role_id === r.id && l.permission_id === p.id);
				return /* @__PURE__ */ jsx(TableCell, {
					className: "text-center",
					children: /* @__PURE__ */ jsx(Checkbox, {
						disabled: !canEdit,
						checked: on,
						onCheckedChange: (v) => void toggle(r.id, p.id, v === true)
					})
				}, r.id);
			})
		] }, p.id)) })] }), /* @__PURE__ */ jsx("p", {
			className: "p-3 text-xs text-muted-foreground",
			children: "Super Admin always has full access."
		})]
	});
}
//#endregion
export { UsersPage as component };
