import { a as db, n as Button, r as cn, t as bilal_logo_asset_default } from "./bilal-logo.asset-DVM5nCcq.js";
import * as React from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useRouter, useRouterState } from "@tanstack/react-router";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BarChart3, Bell, Boxes, Building2, Check, ChevronRight, ChevronsUpDown, Circle, FileSpreadsheet, FileText, History, Landmark, LayoutDashboard, LogOut, Menu, Moon, PanelLeftClose, PanelLeftOpen, Receipt, Search, Settings, ShoppingCart, Sparkles, Sun, Tags, Truck, Users, X } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Command } from "cmdk";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
//#region src/lib/auth.tsx
var AuthContext = createContext(null);
function AuthProvider({ children }) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [session, setSession] = useState(null);
	const [profile, setProfile] = useState(null);
	const [roles, setRoles] = useState([]);
	const [loading, setLoading] = useState(true);
	useEffect(() => {
		let active = true;
		let generation = 0;
		const loadExtras = async (userId) => {
			const request = ++generation;
			const [{ data: p }, { data: r }] = await Promise.all([db.from("profiles").select("*").eq("id", userId).maybeSingle(), db.from("user_roles").select("roles(slug)").eq("user_id", userId)]);
			if (!active || request !== generation) return;
			setProfile(p ?? null);
			const slugs = (r ?? []).map((row) => row.roles?.slug).filter((s) => Boolean(s));
			setRoles(slugs);
		};
		const { data: sub } = db.auth.onAuthStateChange((_event, nextSession) => {
			setSession(nextSession);
			if (nextSession?.user) loadExtras(nextSession.user.id);
			else {
				generation++;
				setProfile(null);
				setRoles([]);
			}
		});
		db.auth.getSession().then(({ data }) => {
			if (!active) return;
			setSession(data.session);
			if (data.session?.user) loadExtras(data.session.user.id);
			setLoading(false);
		});
		return () => {
			active = false;
			sub.subscription.unsubscribe();
		};
	}, []);
	const value = useMemo(() => ({
		user: session?.user ?? null,
		session,
		profile,
		roles,
		loading,
		isSuperAdmin: roles.includes("super_admin") || roles.includes("admin"),
		signOut: async () => {
			setSession(null);
			setProfile(null);
			setRoles([]);
			await db.auth.signOut();
			await queryClient.cancelQueries();
			queryClient.clear();
			await router.navigate({
				to: "/auth",
				replace: true
			});
			await router.invalidate();
		}
	}), [
		session,
		profile,
		roles,
		loading,
		router,
		queryClient
	]);
	return /* @__PURE__ */ jsx(AuthContext.Provider, {
		value,
		children
	});
}
function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
	return ctx;
}
//#endregion
//#region src/lib/theme.tsx
var KEY = "ba-theme";
var ThemeCtx = createContext({
	theme: "light",
	setTheme: () => {},
	toggle: () => {}
});
/** Inline script that applies the saved theme before paint (avoids a flash). */
var themeInitScript = `try{if(localStorage.getItem('${KEY}')==='dark')document.documentElement.classList.add('dark')}catch(e){}`;
function ThemeProvider({ children }) {
	const [theme, setThemeState] = useState("light");
	useEffect(() => {
		const saved = localStorage.getItem(KEY);
		if (saved === "dark" || saved === "light") setThemeState(saved);
	}, []);
	useEffect(() => {
		document.documentElement.classList.toggle("dark", theme === "dark");
	}, [theme]);
	const setTheme = useCallback((t) => {
		localStorage.setItem(KEY, t);
		setThemeState(t);
	}, []);
	const toggle = useCallback(() => setTheme(theme === "dark" ? "light" : "dark"), [theme, setTheme]);
	return /* @__PURE__ */ jsx(ThemeCtx.Provider, {
		value: {
			theme,
			setTheme,
			toggle
		},
		children
	});
}
var useTheme = () => useContext(ThemeCtx);
//#endregion
//#region src/components/ui/dialog.tsx
var Dialog = DialogPrimitive.Root;
var DialogPortal = DialogPrimitive.Portal;
var DialogOverlay = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(DialogPrimitive.Overlay, {
	ref,
	className: cn("fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className),
	...props
}));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;
var DialogContent = React.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs(DialogPortal, { children: [/* @__PURE__ */ jsx(DialogOverlay, {}), /* @__PURE__ */ jsxs(DialogPrimitive.Content, {
	ref,
	className: cn("fixed left-[50%] top-[50%] z-50 grid grid-cols-[minmax(0,1fr)] w-[calc(100%-2rem)] max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg", className),
	...props,
	children: [children, /* @__PURE__ */ jsxs(DialogPrimitive.Close, {
		className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background cursor-pointer transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground",
		children: [/* @__PURE__ */ jsx(X, { className: "h-4 w-4" }), /* @__PURE__ */ jsx("span", {
			className: "sr-only",
			children: "Close"
		})]
	})]
})] }));
DialogContent.displayName = DialogPrimitive.Content.displayName;
var DialogHeader = ({ className, ...props }) => /* @__PURE__ */ jsx("div", {
	className: cn("flex flex-col space-y-1.5 text-center sm:text-left", className),
	...props
});
DialogHeader.displayName = "DialogHeader";
var DialogFooter = ({ className, ...props }) => /* @__PURE__ */ jsx("div", {
	className: cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className),
	...props
});
DialogFooter.displayName = "DialogFooter";
var DialogTitle = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(DialogPrimitive.Title, {
	ref,
	className: cn("text-lg font-semibold leading-none tracking-tight", className),
	...props
}));
DialogTitle.displayName = DialogPrimitive.Title.displayName;
var DialogDescription = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(DialogPrimitive.Description, {
	ref,
	className: cn("text-sm text-muted-foreground", className),
	...props
}));
DialogDescription.displayName = DialogPrimitive.Description.displayName;
//#endregion
//#region src/components/ui/dropdown-menu.tsx
var DropdownMenu = DropdownMenuPrimitive.Root;
var DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
var DropdownMenuSubTrigger = React.forwardRef(({ className, inset, children, ...props }, ref) => /* @__PURE__ */ jsxs(DropdownMenuPrimitive.SubTrigger, {
	ref,
	className: cn("flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", inset && "pl-8", className),
	...props,
	children: [children, /* @__PURE__ */ jsx(ChevronRight, { className: "ml-auto" })]
}));
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName;
var DropdownMenuSubContent = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(DropdownMenuPrimitive.SubContent, {
	ref,
	className: cn("z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-dropdown-menu-content-transform-origin)", className),
	...props
}));
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName;
var DropdownMenuContent = React.forwardRef(({ className, sideOffset = 4, ...props }, ref) => /* @__PURE__ */ jsx(DropdownMenuPrimitive.Portal, { children: /* @__PURE__ */ jsx(DropdownMenuPrimitive.Content, {
	ref,
	sideOffset,
	className: cn("z-50 max-h-[var(--radix-dropdown-menu-content-available-height)] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md", "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-dropdown-menu-content-transform-origin)", className),
	...props
}) }));
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;
var DropdownMenuItem = React.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ jsx(DropdownMenuPrimitive.Item, {
	ref,
	className: cn("relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0", inset && "pl-8", className),
	...props
}));
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;
var DropdownMenuCheckboxItem = React.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs(DropdownMenuPrimitive.CheckboxItem, {
	ref,
	className: cn("relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className),
	...props,
	children: [/* @__PURE__ */ jsx("span", {
		className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center",
		children: /* @__PURE__ */ jsx(DropdownMenuPrimitive.ItemIndicator, { children: /* @__PURE__ */ jsx(Check, { className: "h-4 w-4" }) })
	}), children]
}));
DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName;
var DropdownMenuRadioItem = React.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs(DropdownMenuPrimitive.RadioItem, {
	ref,
	className: cn("relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className),
	...props,
	children: [/* @__PURE__ */ jsx("span", {
		className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center",
		children: /* @__PURE__ */ jsx(DropdownMenuPrimitive.ItemIndicator, { children: /* @__PURE__ */ jsx(Circle, { className: "h-2 w-2 fill-current" }) })
	}), children]
}));
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;
var DropdownMenuLabel = React.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ jsx(DropdownMenuPrimitive.Label, {
	ref,
	className: cn("px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className),
	...props
}));
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;
var DropdownMenuSeparator = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(DropdownMenuPrimitive.Separator, {
	ref,
	className: cn("-mx-1 my-1 h-px bg-muted", className),
	...props
}));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;
var DropdownMenuShortcut = ({ className, ...props }) => {
	return /* @__PURE__ */ jsx("span", {
		className: cn("ml-auto text-xs tracking-widest opacity-60", className),
		...props
	});
};
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";
//#endregion
//#region src/components/ui/command.tsx
var Command$1 = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(Command, {
	ref,
	className: cn("flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground", className),
	...props
}));
Command$1.displayName = Command.displayName;
var CommandDialog = ({ children, ...props }) => {
	return /* @__PURE__ */ jsx(Dialog, {
		...props,
		children: /* @__PURE__ */ jsx(DialogContent, {
			className: "overflow-hidden p-0",
			children: /* @__PURE__ */ jsx(Command$1, {
				className: "[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5",
				children
			})
		})
	});
};
var CommandInput = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxs("div", {
	className: "flex items-center border-b px-3",
	"cmdk-input-wrapper": "",
	children: [/* @__PURE__ */ jsx(Search, { className: "mr-2 h-4 w-4 shrink-0 opacity-50" }), /* @__PURE__ */ jsx(Command.Input, {
		ref,
		className: cn("flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50", className),
		...props
	})]
}));
CommandInput.displayName = Command.Input.displayName;
var CommandList = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(Command.List, {
	ref,
	className: cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className),
	...props
}));
CommandList.displayName = Command.List.displayName;
var CommandEmpty = React.forwardRef((props, ref) => /* @__PURE__ */ jsx(Command.Empty, {
	ref,
	className: "py-6 text-center text-sm",
	...props
}));
CommandEmpty.displayName = Command.Empty.displayName;
var CommandGroup = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(Command.Group, {
	ref,
	className: cn("overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground", className),
	...props
}));
CommandGroup.displayName = Command.Group.displayName;
var CommandSeparator = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(Command.Separator, {
	ref,
	className: cn("-mx-1 h-px bg-border", className),
	...props
}));
CommandSeparator.displayName = Command.Separator.displayName;
var CommandItem = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(Command.Item, {
	ref,
	className: cn("relative flex cursor-default gap-2 select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled=true]:pointer-events-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", className),
	...props
}));
CommandItem.displayName = Command.Item.displayName;
var CommandShortcut = ({ className, ...props }) => {
	return /* @__PURE__ */ jsx("span", {
		className: cn("ml-auto text-xs tracking-widest text-muted-foreground", className),
		...props
	});
};
CommandShortcut.displayName = "CommandShortcut";
//#endregion
//#region src/components/ui/popover.tsx
var Popover = PopoverPrimitive.Root;
var PopoverTrigger = PopoverPrimitive.Trigger;
var PopoverContent = React.forwardRef(({ className, align = "center", sideOffset = 4, ...props }, ref) => /* @__PURE__ */ jsx(PopoverPrimitive.Portal, { children: /* @__PURE__ */ jsx(PopoverPrimitive.Content, {
	ref,
	align,
	sideOffset,
	className: cn("z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-popover-content-transform-origin)", className),
	...props
}) }));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;
//#endregion
//#region src/components/ui/tooltip.tsx
var TooltipProvider = TooltipPrimitive.Provider;
var Tooltip = TooltipPrimitive.Root;
var TooltipTrigger = TooltipPrimitive.Trigger;
var TooltipContent = React.forwardRef(({ className, sideOffset = 4, ...props }, ref) => /* @__PURE__ */ jsx(TooltipPrimitive.Portal, { children: /* @__PURE__ */ jsx(TooltipPrimitive.Content, {
	ref,
	sideOffset,
	className: cn("z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-tooltip-content-transform-origin)", className),
	...props
}) }));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;
//#endregion
//#region src/components/layout/AppShell.tsx
var NAV = [
	{
		heading: "Overview",
		items: [{
			label: "Dashboard",
			to: "/dashboard",
			icon: LayoutDashboard
		}]
	},
	{
		heading: "Operations",
		items: [
			{
				label: "Purchases",
				to: "/purchases",
				icon: ShoppingCart
			},
			{
				label: "Quotations",
				to: "/quotations",
				icon: FileText
			},
			{
				label: "Invoices",
				to: "/invoices",
				icon: Receipt
			},
			{
				label: "Sales Tax Invoices",
				to: "/sales-invoices",
				icon: Receipt
			},
			{
				label: "FBR Invoicing",
				to: "/fbr",
				icon: Landmark
			},
			{
				label: "FBR Final Invoices",
				to: "/fbr-final-invoices",
				icon: Receipt
			},
			{
				label: "Inventory",
				to: "/stock",
				icon: Boxes
			},
			{
				label: "AI Quotation",
				to: "/ai-quotation",
				icon: Sparkles
			},
			{
				label: "Reports",
				to: "/reports",
				icon: BarChart3
			}
		]
	},
	{
		heading: "Master Data",
		items: [
			{
				label: "Suppliers",
				to: "/suppliers",
				icon: Truck
			},
			{
				label: "Departments / Buyers",
				to: "/departments",
				icon: Building2
			},
			{
				label: "FBR HS Codes",
				to: "/fbr-hs-codes",
				icon: FileSpreadsheet
			},
			{
				label: "Custom HS Codes",
				to: "/custom-hs-codes",
				icon: Tags
			}
		]
	},
	{
		heading: "Master Configuration",
		items: [
			{
				label: "UOM",
				to: "/uom",
				icon: Boxes
			},
			{
				label: "Type of Sales (Goods)",
				to: "/type-of-goods",
				icon: Tags
			},
			{
				label: "SRO Master",
				to: "/sro",
				icon: FileSpreadsheet
			},
			{
				label: "Buyer Types",
				to: "/buyer-types",
				icon: Building2
			}
		]
	},
	{
		heading: "Administration",
		items: [
			{
				label: "Users & Roles",
				to: "/users",
				icon: Users
			},
			{
				label: "Activity Logs",
				to: "/activity-logs",
				icon: History
			},
			{
				label: "Settings",
				to: "/settings",
				icon: Settings
			}
		]
	}
];
var COLLAPSE_KEY = "ba-sidebar-collapsed";
function AppShell({ title, description, actions, children }) {
	const [open, setOpen] = useState(false);
	const [collapsed, setCollapsed] = useState(false);
	const [searchOpen, setSearchOpen] = useState(false);
	const { theme, toggle } = useTheme();
	const { profile, roles, signOut } = useAuth();
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const navigate = useNavigate();
	useEffect(() => {
		setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
		const onKey = (e) => {
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
				e.preventDefault();
				setSearchOpen((v) => !v);
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);
	const toggleCollapse = () => {
		const next = !collapsed;
		setCollapsed(next);
		localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
	};
	const { data: pending = [] } = useQuery({
		queryKey: ["shell-pending-quotations"],
		queryFn: async () => {
			const { data } = await db.from("quotations").select("id, quotation_number, grand_total, quotation_date").eq("status", "submitted").order("quotation_date", { ascending: false }).limit(6);
			return data ?? [];
		},
		staleTime: 6e4
	});
	const { data: brand } = useQuery({
		queryKey: ["system-brand"],
		queryFn: async () => {
			const { data } = await db.from("system_settings").select("key, value");
			const map = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
			return {
				name: map["system_name"] || map["company_name"] || "Bilal Autos",
				logo: map["logo_url"] || "",
				favicon: map["favicon_url"] || ""
			};
		},
		staleTime: 5 * 6e4
	});
	useEffect(() => {
		if (!brand?.favicon) return;
		let link = document.querySelector("link[rel='icon']");
		if (!link) {
			link = document.createElement("link");
			link.rel = "icon";
			document.head.appendChild(link);
		}
		link.href = brand.favicon;
		link.type = "image/png";
	}, [brand?.favicon]);
	const group = NAV.find((g) => g.items.some((i) => i.to === pathname));
	const initials = (profile?.full_name ?? "U").split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();
	const roleLabel = roles[0]?.replace(/_/g, " ") ?? "member";
	const brandName = brand?.name ?? "Bilal Autos";
	return /* @__PURE__ */ jsx(TooltipProvider, {
		delayDuration: 200,
		children: /* @__PURE__ */ jsxs("div", {
			className: "app-canvas flex min-h-screen",
			children: [
				/* @__PURE__ */ jsxs("aside", {
					className: cn("fixed inset-y-0 left-0 z-40 flex shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width,transform] duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0", collapsed ? "lg:w-[76px]" : "lg:w-64", "w-64", open ? "translate-x-0" : "-translate-x-full"),
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "flex h-16 items-center gap-3 px-4",
							children: [/* @__PURE__ */ jsx("img", {
								src: bilal_logo_asset_default.url,
								alt: "Bilal Autos",
								className: "size-10 shrink-0 rounded-lg bg-white object-contain"
							}), /* @__PURE__ */ jsxs("div", {
								className: cn("min-w-0", collapsed && "lg:hidden"),
								children: [/* @__PURE__ */ jsx("p", {
									className: "truncate font-heading text-sm font-semibold text-sidebar-foreground",
									children: brandName
								}), /* @__PURE__ */ jsx("p", {
									className: "truncate text-[11px] text-muted-foreground",
									children: "Spare Parts Portal"
								})]
							})]
						}),
						/* @__PURE__ */ jsx("nav", {
							className: "flex-1 space-y-5 overflow-y-auto px-3 py-3",
							children: NAV.map((g) => /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
								className: cn("px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/80", collapsed && "lg:invisible lg:h-2 lg:p-0"),
								children: g.heading
							}), /* @__PURE__ */ jsx("ul", {
								className: "space-y-0.5",
								children: g.items.map((item) => {
									const active = pathname === item.to;
									const Icon = item.icon;
									const link = /* @__PURE__ */ jsxs(Link, {
										to: item.to,
										onClick: () => setOpen(false),
										className: cn("group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200", collapsed && "lg:justify-center lg:px-0", active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/80 hover:translate-x-0.5 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"),
										children: [
											active ? /* @__PURE__ */ jsx("span", { className: "absolute inset-y-1.5 left-0 w-1 rounded-r-full bg-primary" }) : null,
											/* @__PURE__ */ jsx(Icon, { className: cn("size-[18px] shrink-0", active && "text-primary") }),
											/* @__PURE__ */ jsx("span", {
												className: cn("truncate", collapsed && "lg:hidden"),
												children: item.label
											})
										]
									});
									return /* @__PURE__ */ jsx("li", { children: collapsed ? /* @__PURE__ */ jsxs(Tooltip, { children: [/* @__PURE__ */ jsx(TooltipTrigger, {
										asChild: true,
										children: link
									}), /* @__PURE__ */ jsx(TooltipContent, {
										side: "right",
										className: "hidden lg:block",
										children: item.label
									})] }) : link }, item.to);
								})
							})] }, g.heading))
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "space-y-2 border-t border-sidebar-border p-3",
							children: [/* @__PURE__ */ jsxs("div", {
								className: cn("flex items-center gap-2 rounded-lg bg-muted/60 p-1", collapsed && "lg:flex-col"),
								children: [/* @__PURE__ */ jsxs("button", {
									onClick: () => theme === "dark" && toggle(),
									className: cn("flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors", theme === "light" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"),
									"aria-label": "Light mode",
									children: [/* @__PURE__ */ jsx(Sun, { className: "size-3.5" }), /* @__PURE__ */ jsx("span", {
										className: cn(collapsed && "lg:hidden"),
										children: "Light"
									})]
								}), /* @__PURE__ */ jsxs("button", {
									onClick: () => theme === "light" && toggle(),
									className: cn("flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors", theme === "dark" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"),
									"aria-label": "Dark mode",
									children: [/* @__PURE__ */ jsx(Moon, { className: "size-3.5" }), /* @__PURE__ */ jsx("span", {
										className: cn(collapsed && "lg:hidden"),
										children: "Dark"
									})]
								})]
							}), /* @__PURE__ */ jsxs("button", {
								onClick: toggleCollapse,
								className: "hidden w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-foreground lg:flex",
								"aria-label": collapsed ? "Expand sidebar" : "Collapse sidebar",
								children: [collapsed ? /* @__PURE__ */ jsx(PanelLeftOpen, { className: "mx-auto size-4" }) : /* @__PURE__ */ jsx(PanelLeftClose, { className: "size-4" }), /* @__PURE__ */ jsx("span", {
									className: cn(collapsed && "hidden"),
									children: "Collapse"
								})]
							})]
						})
					]
				}),
				open ? /* @__PURE__ */ jsx("button", {
					"aria-label": "Close navigation overlay",
					className: "fixed inset-0 z-30 bg-foreground/30 backdrop-blur-sm lg:hidden",
					onClick: () => setOpen(false)
				}) : null,
				/* @__PURE__ */ jsxs("div", {
					className: "flex min-w-0 flex-1 flex-col",
					children: [/* @__PURE__ */ jsxs("header", {
						className: "sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border/70 bg-background/75 px-4 backdrop-blur-xl sm:px-6",
						children: [
							/* @__PURE__ */ jsx(Button, {
								variant: "ghost",
								size: "icon",
								className: "lg:hidden",
								onClick: () => setOpen(true),
								"aria-label": "Open menu",
								children: /* @__PURE__ */ jsx(Menu, { className: "size-5" })
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ jsxs("nav", {
									className: "flex items-center gap-1 text-[11px] text-muted-foreground",
									"aria-label": "Breadcrumb",
									children: [
										/* @__PURE__ */ jsx(Link, {
											to: "/dashboard",
											className: "hover:text-foreground",
											children: "Home"
										}),
										group && group.heading !== "Overview" ? /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx(ChevronRight, { className: "size-3" }), /* @__PURE__ */ jsx("span", { children: group.heading })] }) : null,
										/* @__PURE__ */ jsx(ChevronRight, { className: "size-3" }),
										/* @__PURE__ */ jsx("span", {
											className: "truncate text-foreground/80",
											children: title
										})
									]
								}), /* @__PURE__ */ jsx("h1", {
									className: "truncate font-heading text-base font-semibold leading-tight sm:text-lg",
									children: title
								})]
							}),
							/* @__PURE__ */ jsxs("button", {
								onClick: () => setSearchOpen(true),
								className: "hidden h-9 w-60 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm text-muted-foreground shadow-sm transition-colors hover:border-primary/40 md:flex",
								children: [
									/* @__PURE__ */ jsx(Search, { className: "size-4" }),
									/* @__PURE__ */ jsx("span", {
										className: "flex-1 text-left",
										children: "Search pages…"
									}),
									/* @__PURE__ */ jsx("kbd", {
										className: "rounded border border-border bg-muted px-1.5 text-[10px] font-medium",
										children: "Ctrl K"
									})
								]
							}),
							/* @__PURE__ */ jsx(Button, {
								variant: "ghost",
								size: "icon",
								className: "md:hidden",
								onClick: () => setSearchOpen(true),
								"aria-label": "Search",
								children: /* @__PURE__ */ jsx(Search, { className: "size-4" })
							}),
							actions,
							/* @__PURE__ */ jsxs(Popover, { children: [/* @__PURE__ */ jsx(PopoverTrigger, {
								asChild: true,
								children: /* @__PURE__ */ jsxs(Button, {
									variant: "ghost",
									size: "icon",
									className: "relative",
									"aria-label": "Notifications",
									children: [/* @__PURE__ */ jsx(Bell, { className: "size-4" }), pending.length ? /* @__PURE__ */ jsxs("span", {
										className: "absolute right-1.5 top-1.5 flex size-2",
										children: [/* @__PURE__ */ jsx("span", { className: "absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" }), /* @__PURE__ */ jsx("span", { className: "relative inline-flex size-2 rounded-full bg-primary" })]
									}) : null]
								})
							}), /* @__PURE__ */ jsxs(PopoverContent, {
								align: "end",
								className: "w-80 p-0",
								children: [/* @__PURE__ */ jsxs("div", {
									className: "border-b border-border px-4 py-3",
									children: [/* @__PURE__ */ jsx("p", {
										className: "text-sm font-semibold",
										children: "Notifications"
									}), /* @__PURE__ */ jsx("p", {
										className: "text-xs text-muted-foreground",
										children: "Quotations waiting for approval"
									})]
								}), pending.length ? /* @__PURE__ */ jsx("ul", {
									className: "max-h-72 overflow-y-auto py-1",
									children: pending.map((q) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(Link, {
										to: "/quotations",
										className: "flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-muted",
										children: [/* @__PURE__ */ jsx("span", {
											className: "flex size-8 items-center justify-center rounded-full bg-warning/15 text-warning",
											children: /* @__PURE__ */ jsx(FileText, { className: "size-4" })
										}), /* @__PURE__ */ jsxs("span", {
											className: "min-w-0 flex-1",
											children: [/* @__PURE__ */ jsx("span", {
												className: "block truncate font-medium",
												children: q.quotation_number
											}), /* @__PURE__ */ jsx("span", {
												className: "block text-xs text-muted-foreground",
												children: q.quotation_date
											})]
										})]
									}) }, q.id))
								}) : /* @__PURE__ */ jsx("div", {
									className: "px-4 py-8 text-center text-sm text-muted-foreground",
									children: "You're all caught up."
								})]
							})] }),
							/* @__PURE__ */ jsx(Button, {
								variant: "ghost",
								size: "icon",
								onClick: toggle,
								"aria-label": "Toggle theme",
								className: "hidden sm:inline-flex",
								children: theme === "dark" ? /* @__PURE__ */ jsx(Sun, { className: "size-4" }) : /* @__PURE__ */ jsx(Moon, { className: "size-4" })
							}),
							/* @__PURE__ */ jsxs(DropdownMenu, { children: [/* @__PURE__ */ jsx(DropdownMenuTrigger, {
								asChild: true,
								children: /* @__PURE__ */ jsxs("button", {
									className: "flex items-center gap-2 rounded-lg p-1 pr-2 transition-colors hover:bg-muted",
									children: [
										/* @__PURE__ */ jsx("span", {
											className: "stat-blue flex size-8 items-center justify-center rounded-full text-xs font-semibold",
											children: initials
										}),
										/* @__PURE__ */ jsxs("span", {
											className: "hidden text-left sm:block",
											children: [/* @__PURE__ */ jsx("span", {
												className: "block text-sm font-medium leading-tight",
												children: profile?.full_name ?? "User"
											}), /* @__PURE__ */ jsx("span", {
												className: "block text-[11px] capitalize text-muted-foreground",
												children: roleLabel
											})]
										}),
										/* @__PURE__ */ jsx(ChevronsUpDown, { className: "hidden size-3.5 text-muted-foreground sm:block" })
									]
								})
							}), /* @__PURE__ */ jsxs(DropdownMenuContent, {
								align: "end",
								className: "w-56",
								children: [
									/* @__PURE__ */ jsxs(DropdownMenuLabel, { children: [/* @__PURE__ */ jsx("p", {
										className: "text-sm font-medium",
										children: profile?.full_name ?? "User"
									}), /* @__PURE__ */ jsx("p", {
										className: "text-xs font-normal capitalize text-muted-foreground",
										children: roleLabel
									})] }),
									/* @__PURE__ */ jsx(DropdownMenuSeparator, {}),
									/* @__PURE__ */ jsxs(DropdownMenuItem, {
										onClick: () => void navigate({ to: "/settings" }),
										children: [/* @__PURE__ */ jsx(Settings, { className: "size-4" }), " Settings"]
									}),
									/* @__PURE__ */ jsxs(DropdownMenuItem, {
										onClick: toggle,
										children: [theme === "dark" ? /* @__PURE__ */ jsx(Sun, { className: "size-4" }) : /* @__PURE__ */ jsx(Moon, { className: "size-4" }), theme === "dark" ? "Light mode" : "Dark mode"]
									}),
									/* @__PURE__ */ jsx(DropdownMenuSeparator, {}),
									/* @__PURE__ */ jsxs(DropdownMenuItem, {
										onClick: () => void signOut(),
										className: "text-destructive focus:text-destructive",
										children: [/* @__PURE__ */ jsx(LogOut, { className: "size-4" }), " Sign out"]
									})
								]
							})] })
						]
					}), /* @__PURE__ */ jsxs("main", {
						className: "page-enter flex-1 p-4 sm:p-6 lg:p-8",
						children: [description ? /* @__PURE__ */ jsx("p", {
							className: "-mt-1 mb-5 text-sm text-muted-foreground",
							children: description
						}) : null, children]
					})]
				}),
				/* @__PURE__ */ jsxs(CommandDialog, {
					open: searchOpen,
					onOpenChange: setSearchOpen,
					children: [/* @__PURE__ */ jsx(CommandInput, { placeholder: "Jump to a page…" }), /* @__PURE__ */ jsxs(CommandList, { children: [/* @__PURE__ */ jsx(CommandEmpty, { children: "No page found." }), NAV.map((g) => /* @__PURE__ */ jsx(CommandGroup, {
						heading: g.heading,
						children: g.items.map((i) => /* @__PURE__ */ jsxs(CommandItem, {
							onSelect: () => {
								setSearchOpen(false);
								navigate({ to: i.to });
							},
							children: [
								/* @__PURE__ */ jsx(i.icon, { className: "size-4" }),
								" ",
								i.label
							]
						}, i.to))
					}, g.heading))] })]
				})
			]
		})
	});
}
//#endregion
export { themeInitScript as _, DropdownMenu as a, useAuth as b, DropdownMenuSeparator as c, DialogContent as d, DialogDescription as f, ThemeProvider as g, DialogTitle as h, PopoverTrigger as i, DropdownMenuTrigger as l, DialogHeader as m, Popover as n, DropdownMenuContent as o, DialogFooter as p, PopoverContent as r, DropdownMenuItem as s, AppShell as t, Dialog as u, useTheme as v, AuthProvider as y };
